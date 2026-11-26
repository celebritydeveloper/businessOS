<?php

declare(strict_types=1);

namespace App\Core\Contacts;

use PDO;
use Ramsey\Uuid\Uuid;
use RuntimeException;
use Throwable;

final class SupplierService
{
    public function __construct(private PDO $pdo) {}

    public function list(string $accountId, string $businessId, string $search = ''): array
    {
        $sql = "SELECT s.* FROM suppliers s INNER JOIN businesses b ON b.id = s.business_id
                WHERE s.business_id = :bid AND b.account_id = :aid AND s.is_active = 1";
        $params = [':bid' => $businessId, ':aid' => $accountId];
        if ($search !== '') {
            $sql .= " AND (s.name LIKE :q OR s.contact_person LIKE :q2 OR s.phone LIKE :q3)";
            $params[':q'] = "%{$search}%";
            $params[':q2'] = "%{$search}%";
            $params[':q3'] = "%{$search}%";
        }
        $stmt = $this->pdo->prepare($sql . " ORDER BY s.name ASC LIMIT 200");
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function create(string $businessId, array $d): string
    {
        $id = Uuid::uuid4()->toString();
        $this->pdo->prepare("
            INSERT INTO suppliers (id, business_id, name, contact_person, phone, email, address, bank_details, notes)
            VALUES (:id, :bid, :name, :cp, :phone, :email, :addr, :bank, :notes)
        ")->execute([
            ':id' => $id,
            ':bid' => $businessId,
            ':name' => $d['name'],
            ':cp' => $d['contact_person'] ?: null,
            ':phone' => $d['phone'] ?: null,
            ':email' => $d['email'] ?: null,
            ':addr' => $d['address'] ?: null,
            ':bank' => $d['bank_details'] ?: null,
            ':notes' => $d['notes'] ?: null,
        ]);
        return $id;
    }

    public function update(string $businessId, string $supplierId, array $d): void
    {
        $this->pdo->prepare("
            UPDATE suppliers SET name = :name, contact_person = :cp, phone = :phone,
                email = :email, address = :addr, bank_details = :bank, notes = :notes
            WHERE id = :sid AND business_id = :bid AND is_active = 1
        ")->execute([
            ':name' => $d['name'],
            ':cp' => $d['contact_person'] ?: null,
            ':phone' => $d['phone'] ?: null,
            ':email' => $d['email'] ?: null,
            ':addr' => $d['address'] ?: null,
            ':bank' => $d['bank_details'] ?: null,
            ':notes' => $d['notes'] ?: null,
            ':sid' => $supplierId,
            ':bid' => $businessId,
        ]);
    }

    public function recordTransaction(string $businessId, string $branchId, string $supplierId, string $userId, string $txType, float $amount, string $payCode, string $notes): void
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare("SELECT id, name, payable_balance FROM suppliers WHERE id = :sid AND business_id = :bid FOR UPDATE");
            $stmt->execute([':sid' => $supplierId, ':bid' => $businessId]);
            $supp = $stmt->fetch();
            if (!$supp) throw new RuntimeException('Supplier not found.');

            $txId = Uuid::uuid4()->toString();
            if ($txType === 'supplier_bill') {
                $this->pdo->prepare("UPDATE suppliers SET payable_balance = payable_balance + :a, total_purchased = total_purchased + :a2 WHERE id = :sid")
                    ->execute([':a' => $amount, ':a2' => $amount, ':sid' => $supplierId]);
                [$drCode, $crCode, $memo] = ['1200', '2000', "Supplier Credit Bill ({$supp['name']}): {$notes}"];
            } else {
                $nextBal = max(0.0, round((float) $supp['payable_balance'] - $amount, 2));
                $this->pdo->prepare("UPDATE suppliers SET payable_balance = :bal WHERE id = :sid")->execute([':bal' => $nextBal, ':sid' => $supplierId]);
                [$drCode, $crCode, $memo] = ['2000', $payCode, "Supplier Payout ({$supp['name']}): {$notes}"];
            }

            $this->pdo->prepare("
                INSERT INTO contact_transactions (id, business_id, branch_id, contact_type, contact_id, tx_type, amount, payment_account_code, notes, actor_user_id)
                VALUES (:id, :bid, :brid, 'supplier', :sid, :ttype, :amt, :pcode, :notes, :uid)
            ")->execute([':id' => $txId, ':bid' => $businessId, ':brid' => $branchId ?: null, ':sid' => $supplierId, ':ttype' => $txType, ':amt' => $amount, ':pcode' => $txType === 'supplier_payment' ? $payCode : null, ':notes' => $notes ?: null, ':uid' => $userId]);

            $entryId = Uuid::uuid4()->toString();
            $this->pdo->prepare("INSERT INTO journal_entries (id, business_id, branch_id, reference_type, reference_id, memo, posted_at) VALUES (:id, :bid, :brid, :rt, :rid, :memo, :at)")
                ->execute([':id' => $entryId, ':bid' => $businessId, ':brid' => $branchId ?: null, ':rt' => $txType, ':rid' => $txId, ':memo' => substr($memo, 0, 250), ':at' => gmdate('Y-m-d H:i:s')]);
            $line = $this->pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_code, debit, credit) VALUES (:id, :eid, :code, :dr, :cr)");
            $line->execute([':id' => Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => $drCode, ':dr' => $amount, ':cr' => 0.0]);
            $line->execute([':id' => Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => $crCode, ':dr' => 0.0, ':cr' => $amount]);
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
