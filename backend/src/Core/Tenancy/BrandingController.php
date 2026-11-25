<?php

declare(strict_types=1);
namespace App\Core\Tenancy;

use App\Core\Http\JsonResponder;
use App\Core\Security\AuditLogger;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Ramsey\Uuid\Uuid;

final class BrandingController {
    public function __construct(
        private PDO $pdo,
        private PlanQuotaService $quotas,
        private AuditLogger $audit
    ) {}

    public function getBranding(Request $request, Response $response, array $args): Response  {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $businessId = (string) ($args['businessId'] ?? '');

        $biz = $this->findOwnedBusiness($accountId, $businessId);
        if (!$biz) {
            return JsonResponder::error($response, 'Business not found.', 'NOT_FOUND', 404);
        }

        $limits = $this->quotas->getActiveLimits($accountId);
        $branding = $this->fetchOrCreateBranding($businessId, (string) $biz['name']);

        return JsonResponder::success($response, [
            'branding' => $branding,
            'plan_controls' => [
                'show_powered_by'       => (bool) ($limits['show_powered_by'] ?? true),
                'custom_domain_enabled' => (bool) ($limits['custom_domain_enabled'] ?? false),
            ],
        ]);
    }

    public function updateBranding(Request $request, Response $response, array $args): Response  {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        $biz = $this->findOwnedBusiness($accountId, $businessId);
        if (!$biz) {
            return JsonResponder::error($response, 'Business not found.', 'NOT_FOUND', 404);
        }


        $subStmt = $this->pdo->prepare("SELECT status FROM subscriptions WHERE account_id = :aid ORDER BY created_at DESC LIMIT 1");
        $subStmt->execute([':aid' => $accountId]);
        $subStatus = (string) ($subStmt->fetchColumn() ?: 'trialing');

        if ($subStatus === 'trialing') {
            return JsonResponder::error(
                $response,
                'Upgrade from your free trial to customize business branding.',
                'PLAN_UPGRADE_REQUIRED',
                403
            );
        }


        $limits = $this->quotas->getActiveLimits($accountId);
        $existing = $this->fetchOrCreateBranding($businessId, (string) $biz['name']);

        $appName = trim((string) ($body['app_name'] ?? $existing['app_name'] ?? $biz['name']));
        $logoUrl = trim((string) ($body['logo_url'] ?? ''));
        $faviconUrl = trim((string) ($body['favicon_url'] ?? ''));
        $primaryColor = strtoupper(trim((string) ($body['primary_color'] ?? '#0F4EF0')));
        $secondaryColor = strtoupper(trim((string) ($body['secondary_color'] ?? '#0F172A')));
        $supportEmail = trim((string) ($body['support_email'] ?? ''));
        $supportPhone = trim((string) ($body['support_phone'] ?? ''));
        $website = trim((string) ($body['website'] ?? ''));

        if (!preg_match('/^#[0-9A-F]{6}$/', $primaryColor)) {
            $primaryColor = '#0F4EF0';
        }
        if (!preg_match('/^#[0-9A-F]{6}$/', $secondaryColor)) {
            $secondaryColor = '#0F172A';
        }

        // Custom domain handling (Enterprise only)
        $customDomain = $existing['custom_domain'];
        $domainToken = $existing['domain_verification_token'];
        $domainVerifiedAt = $existing['domain_verified_at'];

        if (array_key_exists('custom_domain', $body)) {
            $requestedDomain = strtolower(trim((string) ($body['custom_domain'] ?? '')));
            if ($requestedDomain !== '') {
                if (empty($limits['custom_domain_enabled'])) {
                    return JsonResponder::error($response, 'Upgrade to Enterprise to connect a custom domain.', 'PLAN_UPGRADE_REQUIRED', 403);
                }
                if (!preg_match('/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/', $requestedDomain)) {
                    return JsonResponder::error($response, 'Enter a valid domain (e.g., pos.yourbusiness.ng).', 'INVALID_DOMAIN', 422);
                }
                if ($requestedDomain !== $existing['custom_domain']) {
                    $customDomain = $requestedDomain;
                    $domainToken = 'bos-verify-' . bin2hex(random_bytes(12));
                    $domainVerifiedAt = null;
                }
            } else {
                $customDomain = null;
                $domainToken = null;
                $domainVerifiedAt = null;
            }
        }

        $stmt = $this->pdo->prepare("
            UPDATE business_branding
            SET app_name = :aname, logo_url = :logo, favicon_url = :fav,
                primary_color = :pcol, secondary_color = :scol,
                support_email = :semail, support_phone = :sphone, website = :web,
                custom_domain = :cdom, domain_verification_token = :dtok, domain_verified_at = :dver
            WHERE business_id = :bid
        ");
        $stmt->execute([
            ':aname'  => $appName !== '' ? substr($appName, 0, 100) : null,
            ':logo'   => $logoUrl !== '' ? substr($logoUrl, 0, 255) : null,
            ':fav'    => $faviconUrl !== '' ? substr($faviconUrl, 0, 255) : null,
            ':pcol'   => $primaryColor,
            ':scol'   => $secondaryColor,
            ':semail' => $supportEmail !== '' ? substr($supportEmail, 0, 160) : null,
            ':sphone' => $supportPhone !== '' ? substr($supportPhone, 0, 30) : null,
            ':web'    => $website !== '' ? substr($website, 0, 255) : null,
            ':cdom'   => $customDomain,
            ':dtok'   => $domainToken,
            ':dver'   => $domainVerifiedAt,
            ':bid'    => $businessId,
        ]);

        $this->audit->log($accountId, 'branding.updated', $userId, $businessId, null, 'business_branding', $existing['id']);

        return JsonResponder::success($response, [
            'branding' => $this->fetchOrCreateBranding($businessId, (string) $biz['name']),
        ]);
    }

    public function verifyDomain(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $businessId = (string) ($args['businessId'] ?? '');

        $biz = $this->findOwnedBusiness($accountId, $businessId);
        if (!$biz) {
            return JsonResponder::error($response, 'Business not found.', 'NOT_FOUND', 404);
        }

        $branding = $this->fetchOrCreateBranding($businessId, (string) $biz['name']);
        $domain = (string) ($branding['custom_domain'] ?? '');
        $token = (string) ($branding['domain_verification_token'] ?? '');

        if ($domain === '' || $token === '') {
            return JsonResponder::error($response, 'Save a custom domain first before verifying.', 'NO_CUSTOM_DOMAIN', 422);
        }

        // Check DNS TXT record on _businessos.<custom_domain> matching verification token
        $txtRecords = @dns_get_record('_businessos.' . $domain, DNS_TXT) ?: [];
        $matched = false;
        foreach ($txtRecords as $rec) {
            if (trim((string) ($rec['txt'] ?? '')) === $token) {
                $matched = true;
                break;
            }
        }

        if (!$matched) {
            return JsonResponder::error(
                $response,
                "DNS TXT record not found yet on _businessos.{$domain}. Ensure propagation and try again.",
                'DNS_NOT_VERIFIED',
                422
            );
        }

        $this->pdo->prepare("UPDATE business_branding SET domain_verified_at = UTC_TIMESTAMP() WHERE business_id = :bid")
            ->execute([':bid' => $businessId]);

        return JsonResponder::success($response, [
            'verified' => true,
            'branding' => $this->fetchOrCreateBranding($businessId, (string) $biz['name']),
        ]);
    }

    public function resolvePublicBranding(Request $request, Response $response): Response {
        $host = strtolower(trim((string) ($request->getQueryParams()['host'] ?? '')));
        if ($host === '') {
            return JsonResponder::success($response, ['white_label' => false]);
        }

        $stmt = $this->pdo->prepare("
            SELECT bb.app_name, bb.logo_url, bb.favicon_url, bb.primary_color, bb.secondary_color,
                   bb.support_email, bb.support_phone, bb.website, p.limits_json
            FROM business_branding bb
            INNER JOIN businesses b ON b.id = bb.business_id AND b.is_active = 1
            INNER JOIN subscriptions s ON s.account_id = b.account_id
            INNER JOIN plans p ON p.id = s.plan_id
            WHERE bb.custom_domain = :host AND bb.domain_verified_at IS NOT NULL
            ORDER BY s.created_at DESC LIMIT 1
        ");
        $stmt->execute([':host' => $host]);
        $row = $stmt->fetch();

        if (!$row) {
            return JsonResponder::success($response, ['white_label' => false]);
        }

        $limits = json_decode((string) ($row['limits_json'] ?? '{}'), true) ?: [];
        unset($row['limits_json']);

        return JsonResponder::success($response, [
            'white_label'     => true,
            'branding'        => $row,
            'show_powered_by' => (bool) ($limits['show_powered_by'] ?? false),
        ]);
    }

    private function findOwnedBusiness(string $accountId, string $businessId): ?array {
        $stmt = $this->pdo->prepare("SELECT id, name FROM businesses WHERE id = :bid AND account_id = :aid AND is_active = 1 LIMIT 1");
        $stmt->execute([':bid' => $businessId, ':aid' => $accountId]);
        return $stmt->fetch() ?: null;
    }

    private function fetchOrCreateBranding(string $businessId, string $defaultName): array {
        $stmt = $this->pdo->prepare("SELECT * FROM business_branding WHERE business_id = :bid LIMIT 1");
        $stmt->execute([':bid' => $businessId]);
        $row = $stmt->fetch();

        if (!$row) {
            $id = Uuid::uuid4()->toString();
            $this->pdo->prepare("
                INSERT INTO business_branding (id, business_id, app_name, primary_color, secondary_color)
                VALUES (:id, :bid, :name, '#0F4EF0', '#0F172A')
            ")->execute([':id' => $id, ':bid' => $businessId, ':name' => $defaultName]);

            $stmt->execute([':bid' => $businessId]);
            $row = $stmt->fetch();
        }

        return $row ?: [];
    }
}
