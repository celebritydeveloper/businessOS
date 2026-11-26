<?php

declare(strict_types=1);

namespace App\Core\Agriculture;

use PDO;
use Ramsey\Uuid\Uuid;
use RuntimeException;

final class FarmInputService
{
    public function __construct(private PDO $pdo) {}

    public function listInputs(string $accountId, string $businessId, string $branchId): array
    {
        $stmt = $this->pdo->prepare("
            SELECT fi.*
            FROM farm_inputs fi
            INNER JOIN businesses b ON b.id = fi.business_id
            WHERE fi.business_id = :bid AND fi.branch_id = :brid AND b.account_id = :aid
            ORDER BY fi.name ASC
        ");
        $stmt->execute([':bid' => $businessId, ':brid' => $branchId, ':aid' => $accountId]);
        return $stmt->fetchAll();
    }

    public function createOrRestockInput(string $businessId, string $branchId, array $data): string
    {
        $inputId = trim((string) ($data['input_id'] ?? ''));
        $qty = round((float) ($data['quantity'] ?? 0), 3);
        $unitCost = round((float) ($data['unit_cost'] ?? 0), 2);

        if ($inputId !== '') {
            $stmt = $this->pdo->prepare("SELECT id, quantity_on_hand, unit_cost FROM farm_inputs WHERE id = :id AND business_id = :bid AND branch_id = :brid LIMIT 1");
            $stmt->execute([':id' => $inputId, ':bid' => $businessId, ':brid' => $branchId]);
            $existing = $stmt->fetch();
            if (!$existing) {
                throw new RuntimeException('Farm input item not found.');
            }
            $nextCost = $unitCost > 0 ? $unitCost : (float) $existing['unit_cost'];
            $this->pdo->prepare("
                UPDATE farm_inputs
                SET quantity_on_hand = quantity_on_hand + :qty, unit_cost = :cost
                WHERE id = :id
            ")->execute([':qty' => $qty, ':cost' => $nextCost, ':id' => $inputId]);
            return $inputId;
        }

        $newId = Uuid::uuid4()->toString();
        $this->pdo->prepare("
            INSERT INTO farm_inputs (id, business_id, branch_id, name, category, unit_label, quantity_on_hand, reorder_level, unit_cost)
            VALUES (:id, :bid, :brid, :name, :cat, :unit, :qty, :reorder, :cost)
        ")->execute([
            ':id'      => $newId,
            ':bid'     => $businessId,
            ':brid'    => $branchId,
            ':name'    => $data['name'],
            ':cat'     => $data['category'],
            ':unit'    => $data['unit_label'],
            ':qty'     => $qty,
            ':reorder' => round((float) ($data['reorder_level'] ?? 5), 3),
            ':cost'    => $unitCost,
        ]);

        return $newId;
    }

    public function consumeInput(string $businessId, string $branchId, string $inputId, float $qty): array
    {
        $stmt = $this->pdo->prepare("SELECT * FROM farm_inputs WHERE id = :id AND business_id = :bid AND branch_id = :brid FOR UPDATE");
        $stmt->execute([':id' => $inputId, ':bid' => $businessId, ':brid' => $branchId]);
        $input = $stmt->fetch();

        if (!$input) {
            throw new RuntimeException('Selected farm input not found in store.');
        }
        if ((float) $input['quantity_on_hand'] < $qty) {
            throw new RuntimeException("Insufficient {$input['name']} in Farm Input Store ({$input['quantity_on_hand']} {$input['unit_label']} available).");
        }

        $this->pdo->prepare("UPDATE farm_inputs SET quantity_on_hand = quantity_on_hand - :qty WHERE id = :id")
            ->execute([':qty' => $qty, ':id' => $inputId]);

        return $input;
    }
}
