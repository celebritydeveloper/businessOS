<?php

declare(strict_types=1);

namespace App\Core\Security;

use App\Core\Http\JsonResponder;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class AuditLogController {
    public function __construct(
        private PDO $pdo,
        private PermissionService $perms
    ) {}

    public function listLogs(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'audit.view')) {
            return JsonResponder::error($response, 'You do not have permission to view activity logs.', 'FORBIDDEN', 403);
        }

        $stmt = $this->pdo->prepare("
            SELECT al.id, al.action, al.entity_type, al.entity_id, al.ip_address,
                   al.occurred_at AS created_at,
                   u.full_name AS actor_name,
                   CASE
                       WHEN u.is_owner = 1 THEN 'Owner'
                       ELSE COALESCE(MAX(bro.name), MAX(ubr.role), 'Staff')
                   END AS actor_role,
                   br.name AS branch_name
            FROM activity_logs al
            LEFT JOIN users u ON u.id = al.user_id
            LEFT JOIN branches br ON br.id = al.branch_id
            LEFT JOIN user_branch_roles ubr ON ubr.user_id = u.id AND ubr.branch_id = br.id
            LEFT JOIN business_roles bro ON bro.id = ubr.role_id AND bro.business_id = :bid2
            WHERE al.account_id = :aid
              AND al.business_id = :bid
            GROUP BY al.id, al.action, al.entity_type, al.entity_id, al.ip_address, al.occurred_at, u.full_name, u.is_owner, br.name
            ORDER BY al.occurred_at DESC
            LIMIT 100
        ");
        $stmt->execute([
            ':aid'  => $accountId,
            ':bid'  => $businessId,
            ':bid2' => $businessId,
        ]);


        return JsonResponder::success($response, ['logs' => $stmt->fetchAll()]);
    }
}
