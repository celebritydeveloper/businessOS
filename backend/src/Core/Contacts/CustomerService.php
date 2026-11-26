<?php

declare(strict_types=1);

namespace App\Core\Contacts;

use PDO;
use Ramsey\Uuid\Uuid;
use RuntimeException;
use Throwable;

final class CustomerService
{
    public function __construct(private PDO $pdo) {}

    public function list(string $accountId, string $businessId, string $search = ''): array
    {
        $sql = "SELECT c.* FROM customers c INNER JOIN businesses b ON b.id = c.business_id
                WHERE c.business_id = :bid AND b.account_id = :aid AND c.is_active = 1";
        $params = [':bid' => $businessId, ':aid' => $accountId];
        if ($search !== '') {
            $sql .= " AND (c.full_name LIKE :q OR c.phone LIKE :q2)";
            $params[':q'] = "%{$search}%";
            $params[':q2'] = "%{$search}%";
        }
        $stmt = $this->pdo->prepare($sql . " ORDER BY c.full_name ASC LIMIT 200");
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function create(string $businessId, array $d): string
    {
        $id = Uuid::uuid4()->toString();
        $this->pdo->prepare("
            INSERT INTO customers (id, business_id, full_name, phone, email, address, credit_limit, notes)
            VALUES (:id, :bid, :name, :phone, :email, :addr, :limit, :notes)
        ")->execute([
            ':id' => $id,
            ':bid' => $businessId,
            ':name' => $d['full_name'],
            ':phone' => $d['phone'] ?: null,
            ':email' => $d['email'] ?: null,
            ':addr' => $d['address'] ?: null,
            ':limit' => round((float) ($d['credit_limit'] ?? 0), 2),
            ':notes' => $d['notes'] ?: null,
        ]);
        return $id;
    }

    public function update(string $businessId, string $customerId, array $d): void
    {
        $this->pdo->prepare("
            UPDATE customers SET full_name = :name, phone = :phone, email = :email,
                address = :addr, credit_limit = :limit, notes = :notes
            WHERE id = :cid AND business_id = :bid AND is_active = 1
        ")->execute([
            ':name' => $d['full_name'],
            ':phone' => $d['phone'] ?: null,
            ':email' => $d['email'] ?: null,
            ':addr' => $d['address'] ?: null,
            ':limit' => round((float) ($d['credit_limit'] ?? 0), 2),
            ':notes' => $d['notes'] ?: null,
            ':cid' => $customerId,
            ':bid' => $businessId,
        ]);
    }

    public function recordPayment(string $businessId, string $branchId, string $customerId, string $userId, float $amount, string $payCode, string $notes): void
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare("SELECT id, full_name, credit_balance FROM customers WHERE id = :cid AND business_id = :bid FOR UPDATE");
            $stmt->execute([':cid' => $customerId, ':bid' => $businessId]);
            $cust = $stmt->fetch();
            if (!$cust) throw new RuntimeException('Customer not found.');

            $nextBal = max(0.0, round((float) $cust['credit_balance'] - $amount, 2));
            $this->pdo->prepare("UPDATE customers SET credit_balance = :bal WHERE id = :cid")->execute([':bal' => $nextBal, ':cid' => $customerId]);

            $txId = Uuid::uuid4()->toString();
            $this->pdo->prepare("
                INSERT INTO contact_transactions (id, business_id, branch_id, contact_type, contact_id, tx_type, amount, payment_account_code, notes, actor_user_id)
                VALUES (:id, :bid, :brid, 'customer', :cid, 'customer_payment', :amt, :pcode, :notes, :uid)
            ")->execute([':id' => $txId, ':bid' => $businessId, ':brid' => $branchId ?: null, ':cid' => $customerId, ':amt' => $amount, ':pcode' => $payCode, ':notes' => $notes ?: null, ':uid' => $userId]);

            $entryId = Uuid::uuid4()->toString();
            $this->pdo->prepare("INSERT INTO journal_entries (id, business_id, branch_id, reference_type, reference_id, memo, posted_at) VALUES (:id, :bid, :brid, 'customer_payment', :rid, :memo, :at)")
                ->execute([':id' => $entryId, ':bid' => $businessId, ':brid' => $branchId ?: null, ':rid' => $txId, ':memo' => "Customer Credit Repayment ({$cust['full_name']})", ':at' => gmdate('Y-m-d H:i:s')]);
            $line = $this->pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_code, debit, credit) VALUES (:id, :eid, :code, :dr, :cr)");
            $line->execute([':id' => Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => $payCode, ':dr' => $amount, ':cr' => 0.0]);
            $line->execute([':id' => Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => '1100', ':dr' => 0.0, ':cr' => $amount]);
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }
}
