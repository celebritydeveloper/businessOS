<?php

declare(strict_types=1);

namespace App\Core\Security;

use PDO;

final class PermissionService {
    public function __construct(private PDO $pdo) {}

    public function hasPermission(string $userId, bool $isOwner, string $businessId, string $permission): bool {
        if ($isOwner) {
            return true;
        }

        $stmt = $this->pdo->prepare("
            SELECT bro.permissions_json
            FROM user_branch_roles ubr
            INNER JOIN branches br ON br.id = ubr.branch_id AND br.business_id = :bid
            INNER JOIN business_roles bro ON bro.id = ubr.role_id
            WHERE ubr.user_id = :uid
        ");
        $stmt->execute([':bid' => $businessId, ':uid' => $userId]);

        foreach ($stmt->fetchAll() as $row) {
            $perms = json_decode((string) ($row['permissions_json'] ?? '[]'), true) ?: [];
            if (in_array('*', $perms, true) || in_array($permission, $perms, true)) {
                return true;
            }
        }

        return false;
    }
}
