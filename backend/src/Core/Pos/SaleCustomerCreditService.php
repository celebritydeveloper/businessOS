<?php

declare(strict_types=1);

namespace App\Core\Pos;

use PDO;
use Ramsey\Uuid\Uuid;
use RuntimeException;

final class SaleCustomerCreditService
{
    public function __construct(private PDO $pdo) {}

    public function resolveAndApplySale(
        string $businessId,
        string $branchId,
        string $saleId,
        string $receiptNumber,
        string $userId,
        ?string $customerId,
        string $fallbackName,
        string $fallbackPhone,
        float $grandTotal,
        float $creditIn
    ): array {
        if ($creditIn > 0 && ($customerId === null || $customerId === '')) {
            throw new RuntimeException('Select a registered customer before recording a Credit / Pay Later sale.');
        }

        if ($customerId === null || $customerId === '') {
            return [$fallbackName ?: null, $fallbackPhone ?: null];
        }

        $stmt = $this->pdo->prepare("
            SELECT id, full_name, phone, credit_limit, credit_balance
            FROM customers
            WHERE id = :cid AND business_id = :bid AND is_active = 1
            FOR UPDATE
        ");
        $stmt->execute([':cid' => $customerId, ':bid' => $businessId]);
        $cust = $stmt->fetch();
        if (!$cust) {
            throw new RuntimeException('Selected customer was not found.');
        }

        if ($creditIn > 0) {
            $limit = (float) $cust['credit_limit'];
            $currentBal = (float) $cust['credit_balance'];
            if ($limit > 0 && ($currentBal + $creditIn) > $limit) {
                throw new RuntimeException("Credit limit exceeded for {$cust['full_name']} (Limit: ₦" . number_format($limit, 2) . ").");
            }

            $this->pdo->prepare("
                INSERT INTO contact_transactions (id, business_id, branch_id, contact_type, contact_id, tx_type, amount, reference_id, notes, actor_user_id)
                VALUES (:id, :bid, :brid, 'customer', :cid, 'credit_sale', :amt, :ref, :notes, :uid)
            ")->execute([
                ':id'    => Uuid::uuid4()->toString(),
                ':bid'   => $businessId,
                ':brid'  => $branchId,
                ':cid'   => $customerId,
                ':amt'   => $creditIn,
                ':ref'   => $saleId,
                ':notes' => "POS Credit Receipt {$receiptNumber}",
                ':uid'   => $userId,
            ]);
        }

        $this->pdo->prepare("
            UPDATE customers
            SET total_spent = total_spent + :spent,
                credit_balance = credit_balance + :cred
            WHERE id = :cid
        ")->execute([
            ':spent' => $grandTotal,
            ':cred'  => $creditIn,
            ':cid'   => $customerId,
        ]);

        return [
            $fallbackName !== '' ? $fallbackName : (string) $cust['full_name'],
            $fallbackPhone !== '' ? $fallbackPhone : ((string) ($cust['phone'] ?? '') ?: null),
        ];
    }
}
