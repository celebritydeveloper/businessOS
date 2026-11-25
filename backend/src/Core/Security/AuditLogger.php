<?php

declare(strict_types=1);
namespace App\Core\Security;

use PDO;
use Ramsey\Uuid\Uuid;

final class AuditLogger {
    public function __construct(private PDO $pdo) {}

    public function log(
        string $accountId,
        string $action,
        ?string $userId = null,
        ?string $businessId = null,
        ?string $branchId = null,
        ?string $entityType = null,
        ?string $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?string $deviceId = null,
        ?string $ipAddress = null
    ): void
    {
        $stmt = $this->pdo->prepare("
            INSERT INTO activity_logs
            (id, account_id, business_id, branch_id, user_id, device_id, action, entity_type, entity_id, old_values_json, new_values_json, ip_address)
            VALUES
            (:id, :acc, :biz, :br, :usr, :dev, :act, :etype, :eid, :old, :new, :ip)
        ");

        $stmt->execute([
            ':id'    => Uuid::uuid4()->toString(),
            ':acc'   => $accountId,
            ':biz'   => $businessId,
            ':br'    => $branchId,
            ':usr'   => $userId,
            ':dev'   => $deviceId !== null ? substr($deviceId, 0, 100) : null,
            ':act'   => substr($action, 0, 100),
            ':etype' => $entityType !== null ? substr($entityType, 0, 80) : null,
            ':eid'   => $entityId,
            ':old'   => $oldValues !== null ? json_encode($oldValues, JSON_UNESCAPED_UNICODE) : null,
            ':new'   => $newValues !== null ? json_encode($newValues, JSON_UNESCAPED_UNICODE) : null,
            ':ip'    => $ipAddress !== null ? substr($ipAddress, 0, 45) : null,
        ]);
    }
}
