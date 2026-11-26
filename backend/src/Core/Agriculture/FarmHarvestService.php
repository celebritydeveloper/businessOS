<?php

declare(strict_types=1);

namespace App\Core\Agriculture;

use App\Core\Inventory\InventoryLedgerService;
use PDO;
use Ramsey\Uuid\Uuid;
use RuntimeException;

final class FarmHarvestService
{
    public function __construct(
        private PDO $pdo,
        private InventoryLedgerService $ledger
    ) {}

    public function processHarvest(string $businessId, string $branchId, array $cycle, string $userId, array $data): string
    {
        $logType = $data['log_type'];
        $qty = (float) $data['quantity'];
        $directCost = (float) $data['cost_amount'];
        $itemId = (string) ($data['catalog_item_id'] ?? '');

        $totalAccumulated = (float) $cycle['accumulated_cost'] + $directCost;
        $alreadyAllocated = (float) ($cycle['allocated_cost'] ?? 0.0);
        $unallocatedPool = max(0.0, $totalAccumulated - $alreadyAllocated);

        $batchTotalCost = $logType === 'harvest'
            ? $unallocatedPool
            : ($directCost > 0 ? $directCost : $unallocatedPool);
        $batchUnitCost = round($batchTotalCost / $qty, 2);

        if (!empty($data['create_new_product'])) {
            $itemId = $this->createInlineStoreProduct($businessId, [
                'name'          => $data['new_product_name'],
                'unit_label'    => $data['new_product_unit'],
                'selling_price' => $data['new_product_price'],
                'cost_price'    => $batchUnitCost,
            ]);
        }

        if ($itemId === '') {
            throw new RuntimeException('Select an existing POS product or create a new store product for this harvest.');
        }

        $batchNumber = 'HRV-' . gmdate('Ymd') . '-' . random_int(1000, 9999);
        $shelfLifeDays = max(1, (int) ($data['shelf_life_days'] ?? 30));
        $expiryDate = gmdate('Y-m-d', strtotime($data['log_date'] . " +{$shelfLifeDays} days"));

        $this->pdo->prepare("
            INSERT INTO product_batches
            (id, business_id, branch_id, catalog_item_id, batch_number, expiry_date, cost_price, quantity_remaining, is_active)
            VALUES
            (:id, :bid, :brid, :iid, :bnum, :exp, :cost, :qty, 1)
        ")->execute([
            ':id'   => Uuid::uuid4()->toString(),
            ':bid'  => $businessId,
            ':brid' => $branchId,
            ':iid'  => $itemId,
            ':bnum' => $batchNumber,
            ':exp'  => $expiryDate,
            ':cost' => $batchUnitCost,
            ':qty'  => $qty,
        ]);

        $this->updateWeightedAverageCost($businessId, $branchId, $itemId, $qty, $batchUnitCost);

        $this->ledger->recordMovement([
            'business_id'     => $businessId,
            'branch_id'       => $branchId,
            'catalog_item_id' => $itemId,
            'movement_type'   => 'restock',
            'quantity_delta'  => abs($qty),
            'unit_cost'       => $batchUnitCost,
            'batch_number'    => $batchNumber,
            'expiry_date'     => $expiryDate,
            'actor_user_id'   => $userId,
            'notes'           => "Harvest Batch {$batchNumber} from {$cycle['name']}",
        ]);

        $nextAllocated = $alreadyAllocated + $batchTotalCost;
        if ($logType === 'harvest') {
            $this->pdo->prepare("
                UPDATE farm_cycles
                SET status = 'harvested', actual_harvest_date = :hdate, accumulated_cost = :acost, allocated_cost = :alloc
                WHERE id = :cid
            ")->execute([
                ':hdate' => $data['log_date'],
                ':acost' => $totalAccumulated,
                ':alloc' => $nextAllocated,
                ':cid'   => $cycle['id'],
            ]);
            return "Final Harvest Batch {$batchNumber}: {$qty} units @ ₦{$batchUnitCost}/unit";
        }

        $this->pdo->prepare("
            UPDATE farm_cycles
            SET accumulated_cost = :acost, allocated_cost = :alloc
            WHERE id = :cid
        ")->execute([
            ':acost' => $totalAccumulated,
            ':alloc' => $nextAllocated,
            ':cid'   => $cycle['id'],
        ]);

        return "Ongoing Harvest Batch {$batchNumber}: {$qty} units @ ₦{$batchUnitCost}/unit (Cycle Active)";
    }

    private function createInlineStoreProduct(string $businessId, array $p): string
    {
        $name = trim((string) ($p['name'] ?? ''));
        $price = round((float) ($p['selling_price'] ?? 0), 2);
        if ($name === '' || $price <= 0) {
            throw new RuntimeException('New store product name and selling price are required.');
        }

        $newItemId = Uuid::uuid4()->toString();
        $sku = 'FRM-' . random_int(10000, 99999);
        $this->pdo->prepare("
            INSERT INTO catalog_items
            (id, business_id, item_type, name, sku, unit_label, cost_price, selling_price, reorder_level, is_vat_exempt, track_batches, is_active)
            VALUES
            (:id, :bid, 'product', :name, :sku, :unit, :cost, :price, 5, 1, 1, 1)
        ")->execute([
            ':id'    => $newItemId,
            ':bid'   => $businessId,
            ':name'  => $name,
            ':sku'   => $sku,
            ':unit'  => trim((string) ($p['unit_label'] ?? 'Crate')) ?: 'Crate',
            ':cost'  => (float) ($p['cost_price'] ?? 0),
            ':price' => $price,
        ]);

        return $newItemId;
    }

    private function updateWeightedAverageCost(string $businessId, string $branchId, string $itemId, float $newQty, float $newUnitCost): void
    {
        $stmt = $this->pdo->prepare("
            SELECT ci.cost_price, COALESCE(bi.quantity_on_hand, 0) AS qty
            FROM catalog_items ci
            LEFT JOIN branch_inventory bi ON bi.catalog_item_id = ci.id AND bi.branch_id = :brid
            WHERE ci.id = :iid AND ci.business_id = :bid
            LIMIT 1
        ");
        $stmt->execute([':brid' => $branchId, ':iid' => $itemId, ':bid' => $businessId]);
        $row = $stmt->fetch();
        if (!$row) {
            return;
        }

        $oldQty = max(0.0, (float) $row['qty']);
        $oldCost = max(0.0, (float) $row['cost_price']);
        $totalQty = $oldQty + $newQty;
        $wac = $totalQty > 0 ? round((($oldQty * $oldCost) + ($newQty * $newUnitCost)) / $totalQty, 2) : $newUnitCost;

        $this->pdo->prepare("UPDATE catalog_items SET cost_price = :wac, track_batches = 1 WHERE id = :iid")
            ->execute([':wac' => $wac, ':iid' => $itemId]);
    }
}
