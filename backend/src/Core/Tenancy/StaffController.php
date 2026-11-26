<?php

declare(strict_types=1);

namespace App\Core\Tenancy;

use App\Core\Http\JsonResponder;
use App\Core\Notifications\MailerService;
use App\Core\Security\AuditLogger;
use App\Core\Security\PermissionService;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Ramsey\Uuid\Uuid;

final class StaffController {
    public function __construct(
        private PDO $pdo,
        private PlanQuotaService $quotas,
        private AuditLogger $audit,
        private MailerService $mailer,
        private PermissionService $perms
    ) {}

    public function listStaffAndRoles(Request $request, Response $response, array $args): Response {
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'staff.manage')) {
            return JsonResponder::error($response, 'You do not have permission to manage staff.', 'FORBIDDEN', 403);
        }

        $accountId = (string) $request->getAttribute('auth_account_id');
        $bizCheck = $this->pdo->prepare("SELECT id FROM businesses WHERE id = :bid AND account_id = :aid AND is_active = 1 LIMIT 1");
        $bizCheck->execute([':bid' => $businessId, ':aid' => $accountId]);
        if (!$bizCheck->fetch()) {
            return JsonResponder::error($response, 'Business not found.', 'NOT_FOUND', 404);
        }

        $roleStmt = $this->pdo->prepare("SELECT id, name, slug, description, permissions_json, is_system FROM business_roles WHERE business_id = :bid ORDER BY is_system DESC, name ASC");
        $roleStmt->execute([':bid' => $businessId]);
        $roles = array_map(static function (array $r): array {
            $r['permissions'] = json_decode((string) ($r['permissions_json'] ?? '[]'), true) ?: [];
            unset($r['permissions_json']);
            return $r;
        }, $roleStmt->fetchAll());

        $staffStmt = $this->pdo->prepare("
            SELECT u.id, u.full_name, u.email, u.phone, u.is_owner, u.is_active,
                   (u.pos_pin_hash IS NOT NULL) AS has_pos_pin,
                   ubr.branch_id, br.name AS branch_name, ubr.role AS role_slug, ubr.role_id,
                   COALESCE(bro.name, ubr.role) AS role_name
            FROM users u
            LEFT JOIN user_branch_roles ubr ON ubr.user_id = u.id
            LEFT JOIN branches br ON br.id = ubr.branch_id AND br.business_id = :bid
            LEFT JOIN business_roles bro ON bro.id = ubr.role_id
            WHERE u.account_id = :aid AND (u.is_owner = 1 OR br.id IS NOT NULL)
            ORDER BY u.is_owner DESC, u.full_name ASC
        ");
        $staffStmt->execute([':bid' => $businessId, ':aid' => $accountId]);

        return JsonResponder::success($response, [
            'roles' => $roles,
            'staff' => $staffStmt->fetchAll(),
        ]);
    }

    public function createCustomRole(Request $request, Response $response, array $args): Response {
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'staff.manage')) {
            return JsonResponder::error($response, 'You do not have permission to manage staff.', 'FORBIDDEN', 403);
        }

        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $body = (array) ($request->getParsedBody() ?? []);

        $name = trim((string) ($body['name'] ?? ''));
        $permissions = is_array($body['permissions'] ?? null) ? array_values(array_unique(array_map('strval', $body['permissions']))) : [];

        if ($name === '' || empty($permissions)) {
            return JsonResponder::error($response, 'Role name and at least one permission are required.', 'VALIDATION_ERROR', 422);
        }

        $slug = trim(preg_replace('/[^a-z0-9]+/', '_', strtolower($name)) ?? '', '_');
        $roleId = Uuid::uuid4()->toString();

        $this->pdo->prepare("
            INSERT INTO business_roles (id, business_id, name, slug, description, permissions_json, is_system)
            VALUES (:id, :bid, :name, :slug, :desc, :perms, 0)
        ")->execute([
            ':id'    => $roleId,
            ':bid'   => $businessId,
            ':name'  => substr($name, 0, 80),
            ':slug'  => substr($slug, 0, 70) . '_' . random_int(10, 99),
            ':desc'  => trim((string) ($body['description'] ?? '')) ?: null,
            ':perms' => json_encode($permissions),
        ]);

        $this->audit->log($accountId, 'role.custom_created', $userId, $businessId, null, 'business_role', $roleId);
        return JsonResponder::success($response, ['role_id' => $roleId], 201);
    }


    public function createStaff(Request $request, Response $response, array $args): Response {
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $businessId = (string) ($args['businessId'] ?? '');

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'staff.manage')) {
            return JsonResponder::error($response, 'You do not have permission to manage staff.', 'FORBIDDEN', 403);
        }

        $accountId = (string) $request->getAttribute('auth_account_id');
        $actorId = (string) $request->getAttribute('auth_user_id');
        $body = (array) ($request->getParsedBody() ?? []);

        if (!$this->quotas->canAddStaffUser($accountId)) {
            return JsonResponder::error($response, 'Staff limit reached for your current plan. Upgrade to add more.', 'QUOTA_EXCEEDED', 403);
        }

        $fullName = trim((string) ($body['full_name'] ?? ''));
        $email = strtolower(trim((string) ($body['email'] ?? '')));
        $phone = trim((string) ($body['phone'] ?? ''));
        $branchId = trim((string) ($body['branch_id'] ?? ''));
        $roleId = trim((string) ($body['role_id'] ?? ''));
        $appOrigin = rtrim(trim((string) ($body['app_origin'] ?? 'http://localhost:5173')), '/');

        if ($fullName === '' || $email === '' || $branchId === '' || $roleId === '') {
            return JsonResponder::error($response, 'Full name, email, branch, and role are required.', 'VALIDATION_ERROR', 422);
        }

        $bizStmt = $this->pdo->prepare("SELECT name FROM businesses WHERE id = :bid AND account_id = :aid LIMIT 1");
        $bizStmt->execute([':bid' => $businessId, ':aid' => $accountId]);
        $businessName = (string) ($bizStmt->fetchColumn() ?: 'BusinessOS');

        $roleStmt = $this->pdo->prepare("SELECT id, name, slug FROM business_roles WHERE id = :rid AND business_id = :bid LIMIT 1");
        $roleStmt->execute([':rid' => $roleId, ':bid' => $businessId]);
        $role = $roleStmt->fetch();
        if (!$role) {
            return JsonResponder::error($response, 'Selected role not found.', 'NOT_FOUND', 404);
        }

        $rawToken = bin2hex(random_bytes(24));
        $tokenHash = hash('sha256', $rawToken);
        $expiresAt = gmdate('Y-m-d H:i:s', time() + 86400);
        $newUserId = Uuid::uuid4()->toString();

        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("
                INSERT INTO users (id, account_id, full_name, email, phone, invite_token_hash, invite_expires_at, is_owner, is_active)
                VALUES (:id, :aid, :name, :email, :phone, :thash, :texp, 0, 1)
            ")->execute([
                ':id'    => $newUserId,
                ':aid'   => $accountId,
                ':name'  => $fullName,
                ':email' => $email,
                ':phone' => $phone !== '' ? $phone : null,
                ':thash' => $tokenHash,
                ':texp'  => $expiresAt,
            ]);

            $this->pdo->prepare("
                INSERT INTO user_branch_roles (id, user_id, branch_id, role_id, role)
                VALUES (:id, :uid, :brid, :rid, :rslug)
            ")->execute([
                ':id'    => Uuid::uuid4()->toString(),
                ':uid'   => $newUserId,
                ':brid'  => $branchId,
                ':rid'   => $role['id'],
                ':rslug' => $role['slug'],
            ]);

            $this->pdo->commit();
        } catch (\Throwable $e) {
            $this->pdo->rollBack();
            error_log('[createStaff Error] ' . $e->getMessage());
            return JsonResponder::error($response, $e->getMessage(), 'STAFF_CREATE_ERROR', 422);
        }


        $inviteUrl = "{$appOrigin}/auth/accept-invite?token={$rawToken}";
        $this->mailer->sendStaffInvite($email, $fullName, $businessName, (string) $role['name'], $inviteUrl);
        $this->audit->log($accountId, 'staff.invited', $actorId, $businessId, $branchId, 'user', $newUserId);

        return JsonResponder::success($response, [
            'user_id'    => $newUserId,
            'invite_url' => $inviteUrl,
        ], 201);
    }


    public function acceptInvite(Request $request, Response $response): Response {
        $body = (array) ($request->getParsedBody() ?? []);
        $token = trim((string) ($body['token'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $posPin = trim((string) ($body['pos_pin'] ?? ''));

        if ($token === '' || strlen($password) < 8 || !preg_match('/^\d{4}$/', $posPin)) {
            return JsonResponder::error($response, 'Valid invite link, 8+ character password, and 4-digit POS PIN are required.', 'VALIDATION_ERROR', 422);
        }

        $stmt = $this->pdo->prepare("
            SELECT id, account_id, email, invite_expires_at
            FROM users
            WHERE invite_token_hash = :thash AND is_active = 1
            LIMIT 1
        ");
        $stmt->execute([':thash' => hash('sha256', $token)]);
        $user = $stmt->fetch();

        if (!$user || empty($user['invite_expires_at']) || strtotime((string) $user['invite_expires_at']) <= time()) {
            return JsonResponder::error($response, 'This invitation link is invalid or has expired.', 'INVALID_INVITE', 400);
        }

        $this->pdo->prepare("
            UPDATE users
            SET password_hash = :pw, pos_pin_hash = :pin, invite_token_hash = NULL, invite_expires_at = NULL
            WHERE id = :id
        ")->execute([
            ':pw'  => password_hash($password, PASSWORD_DEFAULT),
            ':pin' => password_hash($posPin, PASSWORD_DEFAULT),
            ':id'  => $user['id'],
        ]);

        $this->audit->log((string) $user['account_id'], 'staff.invite_accepted', (string) $user['id'], null, null, 'user', (string) $user['id']);
        return JsonResponder::success($response, ['email' => $user['email']]);
    }

    public function updateStaffPin(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $actorId = (string) $request->getAttribute('auth_user_id');
        $staffId = (string) ($args['userId'] ?? '');
        $pin = trim((string) (($request->getParsedBody() ?? [])['pos_pin'] ?? ''));

        if (!preg_match('/^\d{4}$/', $pin)) {
            return JsonResponder::error($response, 'POS PIN must be exactly 4 digits.', 'INVALID_PIN', 422);
        }

        $this->pdo->prepare("UPDATE users SET pos_pin_hash = :pin WHERE id = :uid AND account_id = :aid")
            ->execute([':pin' => password_hash($pin, PASSWORD_DEFAULT), ':uid' => $staffId, ':aid' => $accountId]);

        $this->audit->log($accountId, 'staff.pin_updated', $actorId, null, null, 'user', $staffId);
        return JsonResponder::success($response, ['updated' => true]);
    }

    public function toggleStaffStatus(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $actorId = (string) $request->getAttribute('auth_user_id');
        $staffId = (string) ($args['userId'] ?? '');
        $isActive = !empty(($request->getParsedBody() ?? [])['is_active']) ? 1 : 0;

        $this->pdo->prepare("UPDATE users SET is_active = :act WHERE id = :uid AND account_id = :aid AND is_owner = 0")
            ->execute([':act' => $isActive, ':uid' => $staffId, ':aid' => $accountId]);

        if ($isActive === 0) {
            $this->pdo->prepare("UPDATE user_sessions SET is_revoked = 1 WHERE user_id = :uid AND account_id = :aid")
                ->execute([':uid' => $staffId, ':aid' => $accountId]);
        }

        $this->audit->log($accountId, $isActive ? 'staff.activated' : 'staff.suspended', $actorId, null, null, 'user', $staffId);
        return JsonResponder::success($response, ['is_active' => (bool) $isActive]);
    }

    public function verifyPosPin(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $branchId = (string) ($args['branchId'] ?? '');
        $pin = trim((string) (($request->getParsedBody() ?? [])['pos_pin'] ?? ''));

        if (!preg_match('/^\d{4}$/', $pin)) {
            return JsonResponder::error($response, 'Enter a valid 4-digit PIN.', 'INVALID_PIN', 422);
        }

        $stmt = $this->pdo->prepare("
            SELECT u.id, u.full_name, u.pos_pin_hash
            FROM users u
            LEFT JOIN user_branch_roles ubr ON ubr.user_id = u.id AND ubr.branch_id = :brid
            WHERE u.account_id = :aid AND u.is_active = 1 AND u.pos_pin_hash IS NOT NULL
              AND (u.is_owner = 1 OR ubr.id IS NOT NULL)
        ");
        $stmt->execute([':brid' => $branchId, ':aid' => $accountId]);

        foreach ($stmt->fetchAll() as $candidate) {
            if (password_verify($pin, (string) $candidate['pos_pin_hash'])) {
                return JsonResponder::success($response, [
                    'cashier_id'   => $candidate['id'],
                    'cashier_name' => $candidate['full_name'],
                ]);
            }
        }

        return JsonResponder::error($response, 'Invalid 4-digit POS PIN for this branch.', 'INVALID_PIN', 401);
    }


    public function updateOwnSecurity(Request $request, Response $response): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $body = (array) ($request->getParsedBody() ?? []);

        $currentPassword = (string) ($body['current_password'] ?? '');
        $newPassword = (string) ($body['new_password'] ?? '');
        $newPin = trim((string) ($body['new_pos_pin'] ?? ''));

        $stmt = $this->pdo->prepare("SELECT password_hash FROM users WHERE id = :uid AND account_id = :aid LIMIT 1");
        $stmt->execute([':uid' => $userId, ':aid' => $accountId]);
        $hash = (string) $stmt->fetchColumn();

        if ($hash === '' || !password_verify($currentPassword, $hash)) {
            return JsonResponder::error($response, 'Current password is incorrect.', 'INVALID_CREDENTIALS', 401);
        }

        if ($newPassword === '' && $newPin === '') {
            return JsonResponder::error($response, 'Provide a new password or a new 4-digit POS PIN.', 'VALIDATION_ERROR', 422);
        }

        if ($newPassword !== '' && strlen($newPassword) < 8) {
            return JsonResponder::error($response, 'New password must be at least 8 characters.', 'VALIDATION_ERROR', 422);
        }

        if ($newPin !== '' && !preg_match('/^\d{4}$/', $newPin)) {
            return JsonResponder::error($response, 'POS PIN must be exactly 4 digits.', 'INVALID_PIN', 422);
        }

        if ($newPassword !== '') {
            $this->pdo->prepare("UPDATE users SET password_hash = :pw WHERE id = :uid")->execute([
                ':pw'  => password_hash($newPassword, PASSWORD_DEFAULT),
                ':uid' => $userId,
            ]);
        }

        if ($newPin !== '') {
            $this->pdo->prepare("UPDATE users SET pos_pin_hash = :pin WHERE id = :uid")->execute([
                ':pin' => password_hash($newPin, PASSWORD_DEFAULT),
                ':uid' => $userId,
            ]);
        }

        $this->audit->log($accountId, 'user.security_updated', $userId, null, null, 'user', $userId);
        return JsonResponder::success($response, ['updated' => true]);
    }
}
