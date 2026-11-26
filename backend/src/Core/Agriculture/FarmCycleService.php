<?php

declare(strict_types=1);

namespace App\Core\Agriculture;

use PDO;
use Ramsey\Uuid\Uuid;
use RuntimeException;
use Throwable;

final class FarmCycleService {
    public function __construct(
        private PDO $pdo,
        private FarmInputService $inputService,
        private FarmHarvestService $harvestService
    ) {}

    public function listCyclesWithLogs(string $accountId, string $businessId, string $branchId): array {
        $stmt = $this->pdo->prepare("
            SELECT fc.*
            FROM farm_cycles fc
            INNER JOIN businesses b ON b.id = fc.business_id
            WHERE fc.business_id = :bid AND fc.branch_id = :brid AND b.account_id = :aid
            ORDER BY FIELD(fc.status, 'active', 'harvested', 'closed'), fc.start_date DESC
        ");
        $stmt->execute([':bid' => $businessId, ':brid' => $branchId, ':aid' => $accountId]);
        $cycles = $stmt->fetchAll();

        if (empty($cycles)) {
            return [];
        }

        $ids = array_column($cycles, 'id');
        $ph = implode(',', array_fill(0, count($ids), '?'));
        $logStmt = $this->pdo->prepare("
            SELECT fcl.*, u.full_name AS actor_name, ci.name AS item_name
            FROM farm_cycle_logs fcl
            LEFT JOIN users u ON u.id = fcl.actor_user_id
            LEFT JOIN catalog_items ci ON ci.id = fcl.catalog_item_id
            WHERE fcl.cycle_id IN ({$ph})
            ORDER BY fcl.log_date DESC, fcl.created_at DESC
        ");
        $logStmt->execute($ids);

        $byCycle = [];
        foreach ($logStmt->fetchAll() as $row) {
            $byCycle[$row['cycle_id']][] = $row;
        }
        foreach ($cycles as &$c) {
            $c['logs'] = $byCycle[$c['id']] ?? [];
        }
        unset($c);

        return $cycles;
    }

    public function createCycle(string $businessId, string $branchId, string $userId, array $data): string {
        $cycleId = Uuid::uuid4()->toString();
        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("
                INSERT INTO farm_cycles
                (id, business_id, branch_id, cycle_type, name, species_or_crop, initial_quantity, current_quantity, unit_label, initial_cost, accumulated_cost, allocated_cost, start_date, expected_harvest_date, notes, created_by_user_id)
                VALUES
                (:id, :bid, :brid, :ctype, :name, :spec, :iqty, :cqty, :unit, :icost, :acost, 0.00, :sdate, :hdate, :notes, :uid)
            ")->execute([
                ':id'    => $cycleId,
                ':bid'   => $businessId,
                ':brid'  => $branchId,
                ':ctype' => $data['cycle_type'],
                ':name'  => $data['name'],
                ':spec'  => $data['species_or_crop'],
                ':iqty'  => $data['initial_quantity'],
                ':cqty'  => $data['initial_quantity'],
                ':unit'  => $data['unit_label'],
                ':icost' => $data['initial_cost'],
                ':acost' => $data['initial_cost'],
                ':sdate' => $data['start_date'],
                ':hdate' => $data['expected_harvest_date'],
                ':notes' => $data['notes'] ?: null,
                ':uid'   => $userId,
            ]);

            $this->insertLog(
                $cycleId,
                'milestone',
                "Cycle Started: {$data['initial_quantity']} {$data['unit_label']} ({$data['species_or_crop']})",
                null,
                null,
                $data['initial_quantity'],
                $data['initial_cost'],
                $data['start_date'],
                $data['notes'],
                $userId
            );
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        return $cycleId;
    }

    public function recordLog(string $businessId, string $branchId, string $cycleId, string $userId, array $data): void
    {
        $cStmt = $this->pdo->prepare("SELECT * FROM farm_cycles WHERE id = :cid AND business_id = :bid AND branch_id = :brid FOR UPDATE");
        $cStmt->execute([':cid' => $cycleId, ':bid' => $businessId, ':brid' => $branchId]);
        $cycle = $cStmt->fetch();
        if (!$cycle) {
            throw new RuntimeException('Farm cycle not found.');
        }

        $logType = $data['log_type'];
        $itemId = (string) ($data['catalog_item_id'] ?? '');
        $farmInputId = (string) ($data['farm_input_id'] ?? '');
        $qty = (float) $data['quantity'];
        $cost = (float) $data['cost_amount'];
        $title = (string) ($data['title'] ?? '');

        $this->pdo->beginTransaction();
        try {
            if ($logType === 'feed_input' && $farmInputId !== '' && $qty > 0) {
                $input = $this->inputService->consumeInput($businessId, $branchId, $farmInputId, $qty);
                if ($cost <= 0) {
                    $cost = round((float) $input['unit_cost'] * $qty, 2);
                }
                $title = $title ?: "Used {$qty} {$input['unit_label']} of {$input['name']}";
            }

            if ($logType === 'mortality' && $qty > 0) {
                $nextQty = max(0.0, (float) $cycle['current_quantity'] - $qty);
                $this->pdo->prepare("UPDATE farm_cycles SET current_quantity = :nq WHERE id = :cid")
                    ->execute([':nq' => $nextQty, ':cid' => $cycleId]);
                $title = $title ?: "Recorded mortality/loss: {$qty} {$cycle['unit_label']}";
            }

            if (($logType === 'partial_harvest' || $logType === 'harvest') && $qty > 0) {
                $autoTitle = $this->harvestService->processHarvest($businessId, $branchId, $cycle, $userId, $data);
                $title = $title ?: $autoTitle;
            } elseif ($cost > 0) {
                $this->pdo->prepare("UPDATE farm_cycles SET accumulated_cost = accumulated_cost + :c WHERE id = :cid")
                    ->execute([':c' => $cost, ':cid' => $cycleId]);
            }

            $finalTitle = $title ?: (ucfirst(str_replace('_', ' ', $logType)) . ' recorded');
            $this->insertLog($cycleId, $logType, $finalTitle, $itemId ?: null, $farmInputId ?: null, $qty, $cost, $data['log_date'], $data['notes'], $userId);
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    private function insertLog(string $cycleId, string $type, string $title, ?string $itemId, ?string $farmInputId, float $qty, float $cost, string $date, string $notes, string $userId): void
    {
        $this->pdo->prepare("
            INSERT INTO farm_cycle_logs (id, cycle_id, log_type, title, catalog_item_id, farm_input_id, quantity, cost_amount, log_date, notes, actor_user_id)
            VALUES (:id, :cid, :ltype, :title, :iid, :fid, :qty, :cost, :ldate, :notes, :uid)
        ")->execute([
            ':id'    => Uuid::uuid4()->toString(),
            ':cid'   => $cycleId,
            ':ltype' => $type,
            ':title' => $title,
            ':iid'   => $itemId,
            ':fid'   => $farmInputId,
            ':qty'   => $qty,
            ':cost'  => $cost,
            ':ldate' => $date,
            ':notes' => $notes !== '' ? $notes : null,
            ':uid'   => $userId,
        ]);
    }
}
