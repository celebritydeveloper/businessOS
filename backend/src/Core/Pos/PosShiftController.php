<?php

declare(strict_types=1);

namespace App\Core\Pos;

use App\Core\Auth\SessionAuthService;
use App\Core\Http\JsonResponder;
use App\Core\Security\AuditLogger;
use App\Core\Security\PermissionService;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class PosShiftController {
    public function __construct(
        private PDO $pdo,
        private AuditLogger $audit,
        private SessionAuthService $authService,
        private PermissionService $perms
    ) {}

    public function listBranchCashiers(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $branchId = (string) ($args['branchId'] ?? '');

        $stmt = $this->pdo->prepare("
            SELECT DISTINCT u.id, u.full_name, u.is_owner,
                   COALESCE(bro.name, IF(u.is_owner = 1, 'Account Owner', 'Staff')) AS role_name,
                   (u.pos_pin_hash IS NOT NULL AND u.pos_pin_hash <> '') AS has_pin
            FROM users u
            LEFT JOIN user_branch_roles ubr ON ubr.user_id = u.id AND ubr.branch_id = :brid
            LEFT JOIN business_roles bro ON bro.id = ubr.role_id
            WHERE u.account_id = :aid AND u.is_active = 1 AND (u.is_owner = 1 OR ubr.branch_id = :brid2)
            ORDER BY u.full_name ASC
        ");
        $stmt->execute([':brid' => $branchId, ':aid' => $accountId, ':brid2' => $branchId]);

        $staff = array_map(static function (array $row): array {
            $row['has_pin'] = (bool) $row['has_pin'];
            return $row;
        }, $stmt->fetchAll());

        return JsonResponder::success($response, ['cashiers' => $staff]);
    }

    public function switchCashierByPin(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $previousUserId = (string) $request->getAttribute('auth_user_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        $targetUserId = trim((string) ($body['user_id'] ?? ''));
        $pin = trim((string) ($body['pos_pin'] ?? ''));
        if ($targetUserId === '' || !preg_match('/^\d{4}$/', $pin)) {
            return JsonResponder::error($response, 'Select a staff member and enter their 4-digit POS PIN.', 'VALIDATION_ERROR', 422);
        }

        $uStmt = $this->pdo->prepare("SELECT id, account_id, full_name, email, is_owner, pos_pin_hash FROM users WHERE id = :uid AND account_id = :aid AND is_active = 1 LIMIT 1");
        $uStmt->execute([':uid' => $targetUserId, ':aid' => $accountId]);
        $targetUser = $uStmt->fetch();

        if (!$targetUser || empty($targetUser['pos_pin_hash']) || !password_verify($pin, (string) $targetUser['pos_pin_hash'])) {
            return JsonResponder::error($response, 'Invalid or unset 4-digit POS PIN.', 'INVALID_PIN', 401);
        }
        if (!$this->perms->hasPermission($targetUserId, (int) $targetUser['is_owner'] === 1, $businessId, 'pos.sell')) {
            return JsonResponder::error($response, 'Selected staff member does not have POS selling permission.', 'FORBIDDEN', 403);
        }

        return $this->issueSwitchSession($request, $response, $targetUser, $accountId, $businessId, $branchId, 'pos.cashier_switched', ['from_user_id' => $previousUserId]);
    }

    public function resetPinWithPassword(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        $targetUserId = trim((string) ($body['user_id'] ?? ''));
        $loginPassword = (string) ($body['login_password'] ?? '');
        $newPin = trim((string) ($body['new_pos_pin'] ?? ''));
        if ($targetUserId === '' || $loginPassword === '' || !preg_match('/^\d{4}$/', $newPin)) {
            return JsonResponder::error($response, 'Select user, enter login password, and choose a 4-digit PIN.', 'VALIDATION_ERROR', 422);
        }

        $uStmt = $this->pdo->prepare("SELECT id, account_id, full_name, email, is_owner, password_hash FROM users WHERE id = :uid AND account_id = :aid AND is_active = 1 LIMIT 1");
        $uStmt->execute([':uid' => $targetUserId, ':aid' => $accountId]);
        $targetUser = $uStmt->fetch();

        if (!$targetUser || !password_verify($loginPassword, (string) $targetUser['password_hash'])) {
            return JsonResponder::error($response, 'Incorrect account login password.', 'INVALID_PASSWORD', 401);
        }
        if (!$this->perms->hasPermission($targetUserId, (int) $targetUser['is_owner'] === 1, $businessId, 'pos.sell')) {
            return JsonResponder::error($response, 'Selected staff member does not have POS selling permission.', 'FORBIDDEN', 403);
        }

        $this->pdo->prepare("UPDATE users SET pos_pin_hash = :pin WHERE id = :uid")->execute([':pin' => password_hash($newPin, PASSWORD_DEFAULT), ':uid' => $targetUserId]);
        return $this->issueSwitchSession($request, $response, $targetUser, $accountId, $businessId, $branchId, 'pos.pin_reset_on_terminal', []);
    }

    private function issueSwitchSession(Request $request, Response $response, array $user, string $accountId, string $businessId, string $branchId, string $action, array $meta): Response
    {
        $tokens = $this->authService->issueSession($user, $request->getHeaderLine('X-Device-ID') ?: 'pos-terminal', 'POS Terminal', $request->getServerParams()['REMOTE_ADDR'] ?? '0.0.0.0', $request->getHeaderLine('User-Agent') ?: 'POS Browser');
        $this->audit->log($accountId, $action, $user['id'], $businessId, $branchId, 'user', $user['id'], null, $meta);

        $isHttps = ($request->getUri()->getScheme() === 'https');
        $cookie = sprintf('bos_refresh=%s; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=%d%s', $tokens['refresh_token'], 60 * 60 * 24 * 30, $isHttps ? '; Secure' : '');

        return JsonResponder::success($response->withAddedHeader('Set-Cookie', $cookie), ['access_token' => $tokens['access_token'], 'cashier_name' => $user['full_name']]);
    }
}
