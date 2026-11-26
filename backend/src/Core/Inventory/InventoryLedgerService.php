<?php

declare(strict_types=1);

namespace App\Core\Inventory;

use PDO;
use Ramsey\Uuid\Uuid;
use RuntimeException;

final class InventoryLedgerService
{
    public function __construct(private PDO $pdo)
    {
    }

    public function recordMovement(array $params): array
    {
        $businessId = (string) $params['business_id'];
        $branchId = (string) $params['branch_id'];
        $itemId = (string) $params['catalog_item_id'];
        $movementType = (string) $params['movement_type'];
        $delta = (float) $params['quantity_delta'];
        $unitCost = (float) ($params['unit_cost'] ?? 0);
        $actorUserId = $params['actor_user_id'] ?? null;
        $idempotencyKey = !empty($params['idempotency_key']) ? (string) $params['idempotency_key'] : null;
        $batchNumber = trim((string) ($params['batch_number'] ?? ''));
        $expiryDate = trim((string) ($params['expiry_date'] ?? ''));
        $referenceType = $params['reference_type'] ?? null;
        $referenceId = $params['reference_id'] ?? null;
        $notes = $params['notes'] ?? null;

        if ($delta === 0.0) {
            throw new RuntimeException('Quantity delta cannot be zero.');
        }

        if ($idempotencyKey !== null) {
            $dupStmt = $this->pdo->prepare("SELECT id FROM inventory_ledger WHERE idempotency_key = :ikey LIMIT 1");
            $dupStmt->execute([':ikey' => $idempotencyKey]);
            if ($existing = $dupStmt->fetch()) {
                return ['duplicate' => true, 'ledger_id' => $existing['id']];
            }
        }

        $itemStmt = $this->pdo->prepare("SELECT id, item_type, track_batches, cost_price FROM catalog_items WHERE id = :iid AND business_id = :bid AND is_active = 1 LIMIT 1");
        $itemStmt->execute([':iid' => $itemId, ':bid' => $businessId]);
        $item = $itemStmt->fetch();
        if (!$item) {
            throw new RuntimeException('Catalog item not found.');
        }
        if ($item['item_type'] === 'service') {
            return ['service' => true, 'quantity_on_hand' => 0];
        }
        $this->pdo->prepare("
            INSERT IGNORE INTO branch_inventory (id, business_id, branch_id, catalog_item_id, quantity_on_hand)
            VALUES (:id, :bid, :brid, :iid, 0)
        ")->execute([':id' => Uuid::uuid4()->toString(), ':bid' => $businessId, ':brid' => $branchId, ':iid' => $itemId]);

        $lockStmt = $this->pdo->prepare("SELECT id, quantity_on_hand FROM branch_inventory WHERE branch_id = :brid AND catalog_item_id = :iid FOR UPDATE");
        $lockStmt->execute([':brid' => $branchId, ':iid' => $itemId]);
        $invRow = $lockStmt->fetch();
        $nextQty = (float) ($invRow['quantity_on_hand'] ?? 0) + $delta;

        $batchId = null;
        if ((int) $item['track_batches'] === 1) {
            if ($delta > 0) {
                if ($batchNumber === '' || $expiryDate === '') {
                    throw new RuntimeException('Batch number and expiry date are required for batch-tracked items.');
                }
                $batchId = $this->upsertBatchStock($businessId, $branchId, $itemId, $batchNumber, $expiryDate, $delta, $unitCost);
            } else {
                $this->deductFefoBatches($businessId, $branchId, $itemId, abs($delta), $movementType, $unitCost, $referenceType, $referenceId, $idempotencyKey, $actorUserId, $notes, $batchNumber !== '' ? $batchNumber : null);
            }
        }

        $this->pdo->prepare("UPDATE branch_inventory SET quantity_on_hand = :qty WHERE id = :id")->execute([':qty' => $nextQty, ':id' => $invRow['id']]);

        if (!((int) $item['track_batches'] === 1 && $delta < 0)) {
            $this->pdo->prepare("
                INSERT INTO inventory_ledger (id, business_id, branch_id, catalog_item_id, batch_id, movement_type, quantity_delta, unit_cost, reference_type, reference_id, idempotency_key, actor_user_id, notes)
                VALUES (:id, :bid, :brid, :iid, :batch, :mtype, :delta, :cost, :rtype, :rid, :ikey, :actor, :notes)
            ")->execute([
                ':id' => Uuid::uuid4()->toString(),
                ':bid' => $businessId,
                ':brid' => $branchId,
                ':iid' => $itemId,
                ':batch' => $batchId,
                ':mtype' => $movementType,
                ':delta' => $delta,
                ':cost' => $unitCost > 0 ? $unitCost : (float) $item['cost_price'],
                ':rtype' => $referenceType,
                ':rid' => $referenceId,
                ':ikey' => $idempotencyKey,
                ':actor' => $actorUserId,
                ':notes' => $notes,
            ]);
        }

        return ['quantity_on_hand' => $nextQty, 'batch_id' => $batchId];
    }

    private function upsertBatchStock(string $businessId, string $branchId, string $itemId, string $batchNumber, string $expiryDate, float $qtyAdded, float $unitCost): string
    {
        $stmt = $this->pdo->prepare("SELECT id FROM product_batches WHERE branch_id = :brid AND catalog_item_id = :iid AND batch_number = :bnum FOR UPDATE");
        $stmt->execute([':brid' => $branchId, ':iid' => $itemId, ':bnum' => $batchNumber]);
        if ($batch = $stmt->fetch()) {
            $this->pdo->prepare("UPDATE product_batches SET quantity_remaining = quantity_remaining + :add, expiry_date = :exp, is_active = 1 WHERE id = :id")
                ->execute([':add' => $qtyAdded, ':exp' => $expiryDate, ':id' => $batch['id']]);
            return (string) $batch['id'];
        }
        $batchId = Uuid::uuid4()->toString();
        $this->pdo->prepare("INSERT INTO product_batches (id, business_id, branch_id, catalog_item_id, batch_number, expiry_date, cost_price, quantity_remaining) VALUES (:id, :bid, :brid, :iid, :bnum, :exp, :cost, :qty)")
            ->execute([':id' => $batchId, ':bid' => $businessId, ':brid' => $branchId, ':iid' => $itemId, ':bnum' => $batchNumber, ':exp' => $expiryDate, ':cost' => $unitCost, ':qty' => $qtyAdded]);
        return $batchId;
    }

    private function deductFefoBatches(string $businessId, string $branchId, string $itemId, float $qtyNeeded, string $movementType, float $unitCost, ?string $referenceType, ?string $referenceId, ?string $idempotencyKey, ?string $actorUserId, ?string $notes, ?string $specificBatchNumber = null): void
    {
        $allowExpired = $movementType === 'expired_writeoff';
        $sql = "SELECT id, cost_price, quantity_remaining FROM product_batches WHERE branch_id = :brid AND catalog_item_id = :iid AND quantity_remaining > 0 AND is_active = 1";
        $bind = [':brid' => $branchId, ':iid' => $itemId];
        if ($specificBatchNumber !== null) {
            $sql .= " AND batch_number = :bnum";
            $bind[':bnum'] = $specificBatchNumber;
        }
        if (!$allowExpired) {
            $sql .= " AND expiry_date >= CURDATE()";
        }
        $stmt = $this->pdo->prepare($sql . " ORDER BY expiry_date ASC FOR UPDATE");
        $stmt->execute($bind);

        $remaining = $qtyNeeded;
        $idx = 0;
        foreach ($stmt->fetchAll() as $b) {
            if ($remaining <= 0) break;
            $take = min((float) $b['quantity_remaining'], $remaining);
            $remaining -= $take;
            $this->pdo->prepare("UPDATE product_batches SET quantity_remaining = quantity_remaining - :take WHERE id = :id")->execute([':take' => $take, ':id' => $b['id']]);
            $this->pdo->prepare("INSERT INTO inventory_ledger (id, business_id, branch_id, catalog_item_id, batch_id, movement_type, quantity_delta, unit_cost, reference_type, reference_id, idempotency_key, actor_user_id, notes) VALUES (:id, :bid, :brid, :iid, :batch, :mtype, :delta, :cost, :rtype, :rid, :ikey, :actor, :notes)")
                ->execute([
                    ':id' => Uuid::uuid4()->toString(),
                    ':bid' => $businessId,
                    ':brid' => $branchId,
                    ':iid' => $itemId,
                    ':batch' => $b['id'],
                    ':mtype' => $movementType,
                    ':delta' => -$take,
                    ':cost' => $unitCost > 0 ? $unitCost : (float) $b['cost_price'],
                    ':rtype' => $referenceType,
                    ':rid' => $referenceId,
                    ':ikey' => $idempotencyKey !== null ? "{$idempotencyKey}:{$idx}" : null,
                    ':actor' => $actorUserId,
                    ':notes' => $notes,
                ]);
            $idx++;
        }
        if ($remaining > 0.0001 && !$allowExpired) {
            throw new RuntimeException('Insufficient non-expired batch stock available for this item.');
        }
    }
}
