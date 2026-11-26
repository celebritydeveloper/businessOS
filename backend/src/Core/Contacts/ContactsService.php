<?php

declare(strict_types=1);

namespace App\Core\Contacts;

use PDO;
use Ramsey\Uuid\Uuid;
use RuntimeException;
use Throwable;

final class ContactsService
{
    public function __construct(private PDO $pdo) {}

    public function listCustomers(string $accountId, string $businessId, string $search = ''): array
    {
        $sql = "
            SELECT c.*
            FROM customers c
            INNER JOIN businesses b ON b.id = c.business_id
            WHERE c.business_id = :bid AND b.account_id = :aid AND c.is_active = 1
        ";
        $params = [':bid' => $businessId, ':aid' => $accountId];
        if ($search !== '') {
            $sql .= " AND (c.full_name LIKE :q OR c.phone LIKE :q2)";
            $params[':q'] = "%{$search}%";
            $params[':q2'] = "%{$search}%";
        }
        $sql .= " ORDER BY c.full_name ASC LIMIT 200";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function createCustomer(string $businessId, array $data): string
    {
        $id = Uuid::uuid4()->toString();
        $this->pdo->prepare("
            INSERT INTO customers (id, business_id, full_name, phone, email, address, credit_limit, notes)
            VALUES (:id, :bid, :name, :phone, :email, :addr, :limit, :notes)
        ")->execute([
            ':id'    => $id,
            ':bid'   => $businessId,
            ':name'  => $data['full_name'],
            ':phone' => $data['phone'] ?: null,
            ':email' => $data['email'] ?: null,
            ':addr'  => $data['address'] ?: null,
            ':limit' => round((float) ($data['credit_limit'] ?? 0), 2),
            ':notes' => $data['notes'] ?: null,
        ]);
        return $id;
    }

    public function recordCustomerPayment(string $businessId, string $branchId, string $customerId, string $userId, float $amount, string $paymentCode, string $notes): void
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare("SELECT id, full_name, credit_balance FROM customers WHERE id = :cid AND business_id = :bid FOR UPDATE");
            $stmt->execute([':cid' => $customerId, ':bid' => $businessId]);
            $cust = $stmt->fetch();
            if (!$cust) {
                throw new RuntimeException('Customer not found.');
            }

            $nextBal = max(0.0, round((float) $cust['credit_balance'] - $amount, 2));
            $this->pdo->prepare("UPDATE customers SET credit_balance = :bal WHERE id = :cid")
                ->execute([':bal' => $nextBal, ':cid' => $customerId]);

            $txId = Uuid::uuid4()->toString();
            $this->pdo->prepare("
                INSERT INTO contact_transactions (id, business_id, branch_id, contact_type, contact_id, tx_type, amount, payment_account_code, notes, actor_user_id)
                VALUES (:id, :bid, :brid, 'customer', :cid, 'customer_payment', :amt, :pcode, :notes, :uid)
            ")->execute([
                ':id'    => $txId,
                ':bid'   => $businessId,
                ':brid'  => $branchId ?: null,
                ':cid'   => $customerId,
                ':amt'   => $amount,
                ':pcode' => $paymentCode,
                ':notes' => $notes ?: null,
                ':uid'   => $userId,
            ]);

            $this->postJournal($businessId, $branchId, 'customer_payment', $txId, "Customer Credit Repayment ({$cust['full_name']})", $paymentCode, '1100', $amount);
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    public function listSuppliers(string $accountId, string $businessId, string $search = ''): array
    {
        $sql = "
            SELECT s.*
            FROM suppliers s
            INNER JOIN businesses b ON b.id = s.business_id
            WHERE s.business_id = :bid AND b.account_id = :aid AND s.is_active = 1
        ";
        $params = [':bid' => $businessId, ':aid' => $accountId];
        if ($search !== '') {
            $sql .= " AND (s.name LIKE :q OR s.contact_person LIKE :q2 OR s.phone LIKE :q3)";
            $params[':q'] = "%{$search}%";
            $params[':q2'] = "%{$search}%";
            $params[':q3'] = "%{$search}%";
        }
        $sql .= " ORDER BY s.name ASC LIMIT 200";

        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function createSupplier(string $businessId, array $data): string
    {
        $id = Uuid::uuid4()->toString();
        $this->pdo->prepare("
            INSERT INTO suppliers (id, business_id, name, contact_person, phone, email, address, bank_details, notes)
            VALUES (:id, :bid, :name, :cp, :phone, :email, :addr, :bank, :notes)
        ")->execute([
            ':id'    => $id,
            ':bid'   => $businessId,
            ':name'  => $data['name'],
            ':cp'    => $data['contact_person'] ?: null,
            ':phone' => $data['phone'] ?: null,
            ':email' => $data['email'] ?: null,
            ':addr'  => $data['address'] ?: null,
            ':bank'  => $data['bank_details'] ?: null,
            ':notes' => $data['notes'] ?: null,
        ]);
        return $id;
    }

    public function recordSupplierActivity(string $businessId, string $branchId, string $supplierId, string $userId, string $txType, float $amount, string $paymentCode, string $notes): void
    {
        $this->pdo->beginTransaction();
        try {
            $stmt = $this->pdo->prepare("SELECT id, name, payable_balance FROM suppliers WHERE id = :sid AND business_id = :bid FOR UPDATE");
            $stmt->execute([':sid' => $supplierId, ':bid' => $businessId]);
            $supp = $stmt->fetch();
            if (!$supp) {
                throw new RuntimeException('Supplier not found.');
            }

            $txId = Uuid::uuid4()->toString();
            if ($txType === 'supplier_bill') {
                $this->pdo->prepare("
                    UPDATE suppliers
                    SET payable_balance = payable_balance + :amt, total_purchased = total_purchased + :amt2
                    WHERE id = :sid
                ")->execute([':amt' => $amount, ':amt2' => $amount, ':sid' => $supplierId]);

                // Dr Inventory Asset (1200) / Cr Accounts Payable (2000)
                $this->postJournal($businessId, $branchId, 'supplier_bill', $txId, "Supplier Credit Bill ({$supp['name']}): {$notes}", '1200', '2000', $amount);
            } else {
                $nextBal = max(0.0, round((float) $supp['payable_balance'] - $amount, 2));
                $this->pdo->prepare("UPDATE suppliers SET payable_balance = :bal WHERE id = :sid")
                    ->execute([':bal' => $nextBal, ':sid' => $supplierId]);

                // Dr Accounts Payable (2000) / Cr Cash/Bank (1000/1010)
                $this->postJournal($businessId, $branchId, 'supplier_payment', $txId, "Supplier Payout ({$supp['name']}): {$notes}", '2000', $paymentCode, $amount);
            }

            $this->pdo->prepare("
                INSERT INTO contact_transactions (id, business_id, branch_id, contact_type, contact_id, tx_type, amount, payment_account_code, notes, actor_user_id)
                VALUES (:id, :bid, :brid, 'supplier', :sid, :ttype, :amt, :pcode, :notes, :uid)
            ")->execute([
                ':id'    => $txId,
                ':bid'   => $businessId,
                ':brid'  => $branchId ?: null,
                ':sid'   => $supplierId,
                ':ttype' => $txType,
                ':amt'   => $amount,
                ':pcode' => $txType === 'supplier_payment' ? $paymentCode : null,
                ':notes' => $notes ?: null,
                ':uid'   => $userId,
            ]);

            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }
    }

    private function postJournal(string $businessId, string $branchId, string $refType, string $refId, string $memo, string $debitCode, string $creditCode, float $amount): void
    {
        $entryId = Uuid::uuid4()->toString();
        $this->pdo->prepare("
            INSERT INTO journal_entries (id, business_id, branch_id, reference_type, reference_id, memo, posted_at)
            VALUES (:id, :bid, :brid, :rtype, :rid, :memo, :at)
        ")->execute([
            ':id'    => $entryId,
            ':bid'   => $businessId,
            ':brid'  => $branchId ?: null,
            ':rtype' => $refType,
            ':rid'   => $refId,
            ':memo'  => substr($memo, 0, 250),
            ':at'    => gmdate('Y-m-d H:i:s'),
        ]);

        $lineStmt = $this->pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_code, debit, credit) VALUES (:id, :eid, :code, :dr, :cr)");
        $lineStmt->execute([':id' => Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => $debitCode, ':dr' => $amount, ':cr' => 0.0]);
        $lineStmt->execute([':id' => Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => $creditCode, ':dr' => 0.0, ':cr' => $amount]);
    }
}
