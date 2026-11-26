<?php

declare(strict_types=1);
namespace App\Core\Tenancy;

use App\Core\Http\JsonResponder;
use App\Core\Security\AuditLogger;
use App\Core\Security\CryptoService;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Ramsey\Uuid\Uuid;
use Throwable;

final class OnboardingController {
    public function __construct(
        private PDO $pdo,
        private CryptoService $crypto,
        private AuditLogger $audit,
        private DefaultBusinessSeeder $seeder,
        private PlanQuotaService $quotas
    ) {}

    public function onboardBusiness(Request $request, Response $response): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $deviceId = (string) $request->getAttribute('device_id');
        $ip = (string) ($request->getServerParams()['REMOTE_ADDR'] ?? '0.0.0.0');

        if (!$isOwner) {
            return JsonResponder::error($response, 'Only the account owner can onboard a business.', 'FORBIDDEN', 403);
        }

        // Verify email is confirmed before onboarding
        $accStmt = $this->pdo->prepare("SELECT email_verified_at, has_used_trial FROM accounts WHERE id = :id LIMIT 1");
        $accStmt->execute([':id' => $accountId]);
        $account = $accStmt->fetch();

        if (!$account || empty($account['email_verified_at'])) {
            return JsonResponder::error($response, 'Verify your email before onboarding.', 'EMAIL_NOT_VERIFIED', 403);
        }

        $body = (array) ($request->getParsedBody() ?? []);
        $businessName = trim((string) ($body['business_name'] ?? ''));
        $industry = strtolower(trim((string) ($body['industry_type'] ?? '')));
        $branchName = trim((string) ($body['branch_name'] ?? 'Main Branch'));
        $branchAddress = trim((string) ($body['branch_address'] ?? ''));
        $branchPhone = trim((string) ($body['branch_phone'] ?? ''));
        $isVatRegistered = (bool) ($body['is_vat_registered'] ?? false);
        $tinRaw = trim((string) ($body['tin_number'] ?? ''));
        $vatRate = $isVatRegistered ? (float) ($body['default_vat_rate'] ?? 7.50) : 0.00;
        $planSlug = strtolower(trim((string) ($body['plan_slug'] ?? 'starter')));
        $billingCycle = ($body['billing_cycle'] ?? 'monthly') === 'yearly' ? 'yearly' : 'monthly';

        $allowedIndustries = ['retail', 'pharmacy', 'supermarket', 'laundry', 'restaurant', 'agriculture']; // V1 flagship modules
        if ($businessName === '' || !in_array($industry, $allowedIndustries, true)) {
            return JsonResponder::error($response, 'Business name and valid v1 industry (retail or pharmacy) are required.', 'VALIDATION_ERROR', 422);
        }

        if ($isVatRegistered && $tinRaw === '') {
            return JsonResponder::error($response, 'TIN / VAT registration number is required for VAT-registered businesses.', 'VAT_TIN_REQUIRED', 422);
        }

        $planStmt = $this->pdo->prepare("SELECT * FROM plans WHERE slug = :slug AND is_active = 1 LIMIT 1");
        $planStmt->execute([':slug' => $planSlug]);
        $plan = $planStmt->fetch();
        if (!$plan) {
            return JsonResponder::error($response, 'Selected subscription plan is invalid.', 'INVALID_PLAN', 422);
        }

        $businessId = Uuid::uuid4()->toString();
        $branchId = Uuid::uuid4()->toString();
        $subId = Uuid::uuid4()->toString();

        $canTrial = (int) $account['has_used_trial'] === 0 && (int) $plan['trial_hours'] > 0;
        $subStatus = $canTrial ? 'trialing' : 'pending_payment';
        $trialEndsAt = $canTrial ? gmdate('Y-m-d H:i:s', time() + ((int) $plan['trial_hours'] * 3600)) : null;

        $this->pdo->beginTransaction();
        try {
            $bizStmt = $this->pdo->prepare("
                INSERT INTO businesses (id, account_id, name, industry_type, tin_encrypted, is_vat_registered, default_vat_rate)
                VALUES (:id, :aid, :name, :ind, :tin, :vat, :rate)
            ");
            $bizStmt->execute([
                ':id'   => $businessId,
                ':aid'  => $accountId,
                ':name' => $businessName,
                ':ind'  => $industry,
                ':tin'  => $isVatRegistered ? $this->crypto->encryptField($tinRaw) : null,
                ':vat'  => $isVatRegistered ? 1 : 0,
                ':rate' => $vatRate,
            ]);

            $brStmt = $this->pdo->prepare("
                INSERT INTO branches (id, business_id, name, address, phone)
                VALUES (:id, :bid, :name, :addr, :phone)
            ");
            $brStmt->execute([
                ':id'    => $branchId,
                ':bid'   => $businessId,
                ':name'  => $branchName !== '' ? $branchName : 'Main Branch',
                ':addr'  => $branchAddress !== '' ? $branchAddress : null,
                ':phone' => $branchPhone !== '' ? $branchPhone : null,
            ]);

            // Create subscription only if account does not already have one
            $existingSub = $this->pdo->prepare("SELECT id, status, trial_ends_at FROM subscriptions WHERE account_id = :aid LIMIT 1");
            $existingSub->execute([':aid' => $accountId]);
            $currentSub = $existingSub->fetch();

            if (!$currentSub) {
                $subStmt = $this->pdo->prepare("
                    INSERT INTO subscriptions (id, account_id, plan_id, billing_cycle, status, trial_ends_at)
                    VALUES (:id, :aid, :pid, :cycle, :status, :trial_end)
                ");
                $subStmt->execute([
                    ':id'        => $subId,
                    ':aid'       => $accountId,
                    ':pid'       => $plan['id'],
                    ':cycle'     => $billingCycle,
                    ':status'    => $subStatus,
                    ':trial_end' => $trialEndsAt,
                ]);

                if ($canTrial) {
                    $this->pdo->prepare("UPDATE accounts SET has_used_trial = 1 WHERE id = :id")->execute([':id' => $accountId]);
                }
            } else {
                $subId = $currentSub['id'];
                $subStatus = $currentSub['status'];
                $trialEndsAt = $currentSub['trial_ends_at'];
            }

            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        $this->audit->log($accountId, 'business.onboarded', $userId, $businessId, $branchId, 'business', $businessId, null, [
            'industry'          => $industry,
            'is_vat_registered' => $isVatRegistered,
            'plan_slug'         => $planSlug,
            'status'            => $subStatus,
        ], $deviceId, $ip);

        return JsonResponder::success($response, [
            'business' => [
                'id'                => $businessId,
                'name'              => $businessName,
                'industry_type'     => $industry,
                'is_vat_registered' => $isVatRegistered,
                'default_vat_rate'  => $vatRate,
            ],
            'branch' => [
                'id'   => $branchId,
                'name' => $branchName !== '' ? $branchName : 'Main Branch',
            ],
            'subscription' => [
                'id'            => $subId,
                'plan_slug'     => $planSlug,
                'status'        => $subStatus,
                'trial_ends_at' => $trialEndsAt,
            ],
            'next_step' => $subStatus === 'trialing' ? 'dashboard' : 'billing_checkout',
        ], 201);
    }

    public function workspaceContext(Request $request, Response $response): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');

        $bizStmt = $this->pdo->prepare("
            SELECT id, name, industry_type, is_vat_registered, default_vat_rate, currency, settings_json
            FROM businesses WHERE account_id = :aid AND is_active = 1 ORDER BY created_at ASC
        ");
        $bizStmt->execute([':aid' => $accountId]);
        $businesses = $bizStmt->fetchAll();

        $brStmt = $this->pdo->prepare("
            SELECT br.id, br.business_id, br.name, br.address, br.phone, br.receipt_footer
            FROM branches br
            INNER JOIN businesses b ON b.id = br.business_id
            WHERE b.account_id = :aid AND br.is_active = 1 ORDER BY br.created_at ASC
        ");
        $brStmt->execute([':aid' => $accountId]);
        $branches = $brStmt->fetchAll();

        $subStmt = $this->pdo->prepare("
            SELECT s.id, s.status, s.billing_cycle, s.trial_ends_at, s.current_period_end, p.name AS plan_name, p.slug AS plan_slug, p.limits_json
            FROM subscriptions s
            INNER JOIN plans p ON p.id = s.plan_id
            WHERE s.account_id = :aid ORDER BY s.created_at DESC LIMIT 1
        ");
        $subStmt->execute([':aid' => $accountId]);
        $subscription = $subStmt->fetch() ?: null;

        return JsonResponder::success($response, [
            'user_id'      => $userId,
            'businesses'   => $businesses,
            'branches'     => $branches,
            'subscription' => $subscription,
        ]);
    }



    public function me(Request $request, Response $response): Response {
        $userId = (string) $request->getAttribute('auth_user_id');
        $accountId = (string) $request->getAttribute('auth_account_id');

        $uStmt = $this->pdo->prepare("SELECT id, account_id, full_name, email, phone, is_owner FROM users WHERE id = :uid LIMIT 1");
        $uStmt->execute([':uid' => $userId]);
        $user = $uStmt->fetch();
        $isOwner = (int) ($user['is_owner'] ?? 0) === 1;

        $bStmt = $this->pdo->prepare("SELECT id, account_id, name, industry_type, is_vat_registered, default_vat_rate, currency FROM businesses WHERE account_id = :aid AND is_active = 1");
        $bStmt->execute([':aid' => $accountId]);
        $allBusinesses = $bStmt->fetchAll();

        $businesses = [];
        foreach ($allBusinesses as $biz) {
            $biz['is_vat_registered'] = (bool) $biz['is_vat_registered'];
            $biz['default_vat_rate'] = (float) $biz['default_vat_rate'];

            if ($isOwner) {
                $brStmt = $this->pdo->prepare("SELECT id, business_id, name, address, phone FROM branches WHERE business_id = :bid AND is_active = 1 ORDER BY created_at ASC");

                $brStmt->execute([':bid' => $biz['id']]);
                $branches = array_map(static function (array $br): array {
                    $br['permissions'] = ['*'];
                    return $br;
                }, $brStmt->fetchAll());
            } else {
                $brStmt = $this->pdo->prepare("
                    SELECT br.id, br.business_id, br.name, br.address, br.phone,
                           COALESCE(bro.name, ubr.role) AS role_name,
                           bro.permissions_json
                    FROM branches br
                    INNER JOIN user_branch_roles ubr ON ubr.branch_id = br.id AND ubr.user_id = :uid
                    LEFT JOIN business_roles bro ON bro.id = ubr.role_id
                    WHERE br.business_id = :bid AND br.is_active = 1
                ");
                $brStmt->execute([':uid' => $userId, ':bid' => $biz['id']]);
                $branches = array_map(static function (array $br): array {
                    $br['permissions'] = json_decode((string) ($br['permissions_json'] ?? '[]'), true) ?: [];
                    unset($br['permissions_json']);
                    return $br;
                }, $brStmt->fetchAll());
            }

            if (!empty($branches)) {
                $biz['branches'] = $branches;
                $businesses[] = $biz;
            }
        }

        $sStmt = $this->pdo->prepare("
            SELECT s.id, s.status, s.billing_cycle, s.trial_ends_at, s.current_period_end, s.grace_until, p.slug AS plan_slug
            FROM subscriptions s
            INNER JOIN plans p ON p.id = s.plan_id
            WHERE s.account_id = :aid
            ORDER BY s.created_at DESC LIMIT 1
        ");
        $sStmt->execute([':aid' => $accountId]);
        $sub = $sStmt->fetch() ?: null;

        return JsonResponder::success($response, [
            'user'         => $user,
            'businesses'   => $businesses,
            'subscription' => $sub,
        ]);
    }




    public function createInitialBusiness(Request $request, Response $response): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $body = (array) ($request->getParsedBody() ?? []);

        $accStmt = $this->pdo->prepare("SELECT email_verified_at, has_used_trial FROM accounts WHERE id = :aid LIMIT 1");
        $accStmt->execute([':aid' => $accountId]);
        $account = $accStmt->fetch();

        if (!$account || empty($account['email_verified_at'])) {
            return JsonResponder::error($response, 'Verify your email before setting up a business.', 'EMAIL_NOT_VERIFIED', 403);
        }

        $businessName = trim((string) ($body['business_name'] ?? ''));
        $industryType = strtolower(trim((string) ($body['industry_type'] ?? 'retail')));
        $branchName = trim((string) ($body['branch_name'] ?? 'Main Branch'));
        $branchAddress = trim((string) ($body['branch_address'] ?? ''));
        $branchPhone = trim((string) ($body['branch_phone'] ?? ''));

        if ($businessName === '' || !in_array($industryType, ['retail', 'pharmacy'], true) || $branchName === '') {
            return JsonResponder::error($response, 'Business name, valid industry, and branch name are required.', 'VALIDATION_ERROR', 422);
        }

        $allowedRegTypes = [
            'BUSINESS_NAME',
            'PRIVATE_LIMITED_COMPANY',
            'PUBLIC_LIMITED_COMPANY',
            'COMPANY_LIMITED_BY_GUARANTEE',
            'UNLIMITED_COMPANY',
            'LIMITED_LIABILITY_PARTNERSHIP',
            'LIMITED_PARTNERSHIP',
            'INCORPORATED_TRUSTEES',
        ];

        $regStatus = ($body['registration_status'] ?? 'unregistered') === 'registered' ? 'registered' : 'unregistered';
        $regType = $regStatus === 'registered' ? trim((string) ($body['registration_type'] ?? '')) : null;

        if ($regStatus === 'registered' && !in_array($regType, $allowedRegTypes, true)) {
            return JsonResponder::error($response, 'Please select a valid CAC business registration type.', 'INVALID_REGISTRATION_TYPE', 422);
        }

        $rcBnRaw = trim((string) ($body['rc_bn_number'] ?? ''));
        $rcBnNumber = ($regStatus === 'registered' && $rcBnRaw !== '') ? substr($rcBnRaw, 0, 40) : null;

        $isVatRegistered = ($regStatus === 'registered' && !empty($body['is_vat_registered'])) ? 1 : 0;
        $vatRate = $isVatRegistered === 1 ? (float) ($body['default_vat_rate'] ?? 7.5) : 0.00;
        $tinRaw = trim((string) ($body['tin_number'] ?? ''));
        $encryptedTin = ($isVatRegistered === 1 && $tinRaw !== '') ? $this->crypto->encryptField($tinRaw) : null;
        $businessId = Uuid::uuid4()->toString();
        $branchId = Uuid::uuid4()->toString();

        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("
                INSERT INTO businesses
                (id, account_id, name, industry_type, registration_status, registration_type, rc_bn_number, is_vat_registered, encrypted_tin, default_vat_rate)
                VALUES
                (:id, :aid, :name, :ind, :rstat, :rtype, :rcbn, :vat, :tin, :vrate)
            ")->execute([
                ':id'    => $businessId,
                ':aid'   => $accountId,
                ':name'  => $businessName,
                ':ind'   => $industryType,
                ':rstat' => $regStatus,
                ':rtype' => $regType,
                ':rcbn'  => $rcBnNumber,
                ':vat'   => $isVatRegistered,
                ':tin'   => $encryptedTin,
                ':vrate' => $vatRate,
            ]);

            $this->pdo->prepare("
                INSERT INTO branches (id, business_id, name, address, phone)
                VALUES (:id, :bid, :name, :addr, :phone)
            ")->execute([
                ':id'    => $branchId,
                ':bid'   => $businessId,
                ':name'  => $branchName,
                ':addr'  => $branchAddress !== '' ? $branchAddress : null,
                ':phone' => $branchPhone !== '' ? $branchPhone : null,
            ]);

            // Auto-activate 24-hour free trial on starter plan if account hasn't used trial yet
            $subCheck = $this->pdo->prepare("SELECT id FROM subscriptions WHERE account_id = :aid LIMIT 1");
            $subCheck->execute([':aid' => $accountId]);
            if (!$subCheck->fetch()) {
                $planStmt = $this->pdo->prepare("SELECT id, trial_hours FROM plans WHERE slug = 'starter' LIMIT 1");
                $planStmt->execute();
                $plan = $planStmt->fetch();

                if ($plan) {
                    $trialHours = (int) ($plan['trial_hours'] ?? 24);
                    $trialEnds = gmdate('Y-m-d H:i:s', time() + ($trialHours * 3600));
                    $this->pdo->prepare("
                        INSERT INTO subscriptions (id, account_id, plan_id, billing_cycle, status, trial_ends_at)
                        VALUES (:id, :aid, :pid, 'monthly', 'trialing', :tends)
                    ")->execute([
                        ':id'    => Uuid::uuid4()->toString(),
                        ':aid'   => $accountId,
                        ':pid'   => $plan['id'],
                        ':tends' => $trialEnds,
                    ]);
                    $this->pdo->prepare("UPDATE accounts SET has_used_trial = 1 WHERE id = :aid")->execute([':aid' => $accountId]);
                }
            }

            // Seed industry categories & 10-account Chart of Accounts
            $this->seeder->seed($businessId, $industryType);

            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        $this->audit->log($accountId, 'business.onboarded', $userId, $businessId, $branchId, 'business', $businessId, null, [
            'industry'            => $industryType,
            'registration_status' => $regStatus,
            'registration_type'   => $regType,
        ]);

        return JsonResponder::success($response, [
            'business_id' => $businessId,
            'branch_id'   => $branchId,
        ], 201);
    }


    public function addBusiness(Request $request, Response $response): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$isOwner) {
            return JsonResponder::error($response, 'Only the account owner can create additional businesses.', 'FORBIDDEN', 403);
        }

        try {
            $this->quotas->assertCanAddBusiness($accountId);
        } catch (\RuntimeException $e) {
            return JsonResponder::error($response, $e->getMessage(), 'QUOTA_EXCEEDED', 403);
        }

        $businessName = trim((string) ($body['business_name'] ?? ''));
        $industryType = strtolower(trim((string) ($body['industry_type'] ?? 'retail')));
        $branchName = trim((string) ($body['branch_name'] ?? 'Main Branch'));
        $branchAddress = trim((string) ($body['branch_address'] ?? ''));
        $branchPhone = trim((string) ($body['branch_phone'] ?? ''));

        $allowedIndustries = ['retail', 'pharmacy', 'supermarket', 'laundry', 'restaurant', 'agriculture'];
        if ($businessName === '' || !in_array($industryType, $allowedIndustries, true) || $branchName === '') {
            return JsonResponder::error($response, 'Business name, valid industry, and initial branch name are required.', 'VALIDATION_ERROR', 422);
        }

        $regStatus = ($body['registration_status'] ?? 'unregistered') === 'registered' ? 'registered' : 'unregistered';
        $regType = $regStatus === 'registered' ? trim((string) ($body['registration_type'] ?? 'BUSINESS_NAME')) : null;
        $rcBnRaw = trim((string) ($body['rc_bn_number'] ?? ''));
        $rcBnNumber = ($regStatus === 'registered' && $rcBnRaw !== '') ? substr($rcBnRaw, 0, 40) : null;
        $isVatRegistered = ($regStatus === 'registered' && !empty($body['is_vat_registered'])) ? 1 : 0;
        $vatRate = $isVatRegistered === 1 ? (float) ($body['default_vat_rate'] ?? 7.5) : 0.00;
        $tinRaw = trim((string) ($body['tin_number'] ?? ''));
        $encryptedTin = ($isVatRegistered === 1 && $tinRaw !== '') ? $this->crypto->encryptField($tinRaw) : null;

        $businessId = Uuid::uuid4()->toString();
        $branchId = Uuid::uuid4()->toString();

        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("
                INSERT INTO businesses
                (id, account_id, name, industry_type, registration_status, registration_type, rc_bn_number, is_vat_registered, encrypted_tin, default_vat_rate)
                VALUES
                (:id, :aid, :name, :ind, :rstat, :rtype, :rcbn, :vat, :tin, :vrate)
            ")->execute([
                ':id'    => $businessId,
                ':aid'   => $accountId,
                ':name'  => $businessName,
                ':ind'   => $industryType,
                ':rstat' => $regStatus,
                ':rtype' => $regType,
                ':rcbn'  => $rcBnNumber,
                ':vat'   => $isVatRegistered,
                ':tin'   => $encryptedTin,
                ':vrate' => $vatRate,
            ]);

            $this->pdo->prepare("
                INSERT INTO branches (id, business_id, name, address, phone)
                VALUES (:id, :bid, :name, :addr, :phone)
            ")->execute([
                ':id'    => $branchId,
                ':bid'   => $businessId,
                ':name'  => $branchName,
                ':addr'  => $branchAddress !== '' ? $branchAddress : null,
                ':phone' => $branchPhone !== '' ? $branchPhone : null,
            ]);

            $this->seeder->seed($businessId, $industryType, $businessName);
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            return JsonResponder::error($response, $e->getMessage(), 'BUSINESS_CREATE_ERROR', 422);
        }

        $this->audit->log($accountId, 'business.created', $userId, $businessId, $branchId, 'business', $businessId);
        return JsonResponder::success($response, ['business_id' => $businessId, 'branch_id' => $branchId], 201);
    }


    public function addBranch(Request $request, Response $response): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$isOwner) {
            return JsonResponder::error($response, 'Only the account owner can create additional branches.', 'FORBIDDEN', 403);
        }

        try {
            $this->quotas->assertCanAddBranch($accountId);
        } catch (\RuntimeException $e) {
            return JsonResponder::error($response, $e->getMessage(), 'QUOTA_EXCEEDED', 403);
        }

        $businessId = trim((string) ($body['business_id'] ?? ''));
        $branchName = trim((string) ($body['branch_name'] ?? ''));
        $branchAddress = trim((string) ($body['branch_address'] ?? ''));
        $branchPhone = trim((string) ($body['branch_phone'] ?? ''));

        if ($businessId === '' || $branchName === '') {
            return JsonResponder::error($response, 'Business and branch name are required.', 'VALIDATION_ERROR', 422);
        }

        $bizStmt = $this->pdo->prepare("SELECT id FROM businesses WHERE id = :bid AND account_id = :aid AND is_active = 1 LIMIT 1");
        $bizStmt->execute([':bid' => $businessId, ':aid' => $accountId]);
        if (!$bizStmt->fetch()) {
            return JsonResponder::error($response, 'Business not found.', 'NOT_FOUND', 404);
        }

        $branchId = Uuid::uuid4()->toString();
        $this->pdo->prepare("
            INSERT INTO branches (id, business_id, name, address, phone)
            VALUES (:id, :bid, :name, :addr, :phone)
        ")->execute([
            ':id'    => $branchId,
            ':bid'   => $businessId,
            ':name'  => $branchName,
            ':addr'  => $branchAddress !== '' ? $branchAddress : null,
            ':phone' => $branchPhone !== '' ? $branchPhone : null,
        ]);

        $this->audit->log($accountId, 'branch.created', $userId, $businessId, $branchId, 'branch', $branchId);
        return JsonResponder::success($response, ['branch_id' => $branchId], 201);
    }
}
