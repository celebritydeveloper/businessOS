<?php

declare(strict_types=1);

namespace App\Core\Pos;

use App\Core\Inventory\InventoryLedgerService;
use PDO;
use Ramsey\Uuid\Uuid;
use RuntimeException;
use Throwable;

final class SaleCheckoutService
{
    public function __construct(
        private PDO $pdo,
        private InventoryLedgerService $ledger,
        private SaleCustomerCreditService $customerCredit
    ) {}

    public function process(string $accountId, string $businessId, string $branchId, string $userId, array $body): array {
        $clientSaleUuid = trim((string) ($body['client_sale_uuid'] ?? ''));
        $items = is_array($body['items'] ?? null) ? $body['items'] : [];
        $payments = is_array($body['payments'] ?? null) ? $body['payments'] : [];

        $dupStmt = $this->pdo->prepare("SELECT id, receipt_number FROM sales WHERE client_sale_uuid = :cuuid LIMIT 1");
        $dupStmt->execute([':cuuid' => $clientSaleUuid]);
        if ($existing = $dupStmt->fetch()) {
            return ['duplicate' => true, 'sale_id' => $existing['id'], 'receipt_number' => $existing['receipt_number']];
        }

        $bizStmt = $this->pdo->prepare("SELECT is_vat_registered, default_vat_rate FROM businesses WHERE id = :bid AND account_id = :aid AND is_active = 1 LIMIT 1");
        $bizStmt->execute([':bid' => $businessId, ':aid' => $accountId]);
        $biz = $bizStmt->fetch();
        if (!$biz) {
            throw new RuntimeException('Business not found.');
        }

        $vatEnabled = (int) $biz['is_vat_registered'] === 1;
        $defaultVatRate = $vatEnabled ? (float) $biz['default_vat_rate'] : 0.0;
        $discount = max(0.0, (float) ($body['discount_amount'] ?? 0));
        $receiptNumber = trim((string) ($body['receipt_number'] ?? '')) ?: ('BOS-' . gmdate('Ymd') . '-' . random_int(1000, 9999));
        $soldAt = !empty($body['sold_at']) ? gmdate('Y-m-d H:i:s', strtotime((string) $body['sold_at'])) : gmdate('Y-m-d H:i:s');
        $saleId = Uuid::uuid4()->toString();
        $customerId = trim((string) ($body['customer_id'] ?? '')) ?: null;

        $this->pdo->beginTransaction();
        try {
            $subtotal = 0.0;
            $totalVat = 0.0;
            $totalCogs = 0.0;
            $preparedLines = [];

            foreach ($items as $idx => $line) {
                $itemId = (string) ($line['catalog_item_id'] ?? '');
                $qty = max(0.001, (float) ($line['quantity'] ?? 1));

                $iStmt = $this->pdo->prepare("SELECT id, name, item_type, cost_price, selling_price, is_vat_exempt FROM catalog_items WHERE id = :iid AND business_id = :bid LIMIT 1");
                $iStmt->execute([':iid' => $itemId, ':bid' => $businessId]);
                $dbItem = $iStmt->fetch();
                if (!$dbItem) {
                    throw new RuntimeException('One or more cart items no longer exist.');
                }

                $unitPrice = isset($line['unit_price']) ? (float) $line['unit_price'] : (float) $dbItem['selling_price'];
                $lineNet = round($unitPrice * $qty, 2);
                $rate = ($vatEnabled && (int) $dbItem['is_vat_exempt'] === 0) ? $defaultVatRate : 0.0;
                $lineVat = round($lineNet * ($rate / 100), 2);
                $lineTotal = round($lineNet + $lineVat, 2);

                $subtotal += $lineNet;
                $totalVat += $lineVat;
                if ($dbItem['item_type'] === 'product') {
                    $totalCogs += round((float) $dbItem['cost_price'] * $qty, 2);
                    $this->ledger->recordMovement([
                        'business_id'     => $businessId,
                        'branch_id'       => $branchId,
                        'catalog_item_id' => $itemId,
                        'movement_type'   => 'sale',
                        'quantity_delta'  => -$qty,
                        'unit_cost'       => (float) $dbItem['cost_price'],
                        'reference_type'  => 'sale',
                        'reference_id'    => $saleId,
                        'idempotency_key' => "sale:{$clientSaleUuid}:{$idx}",
                        'actor_user_id'   => $userId,
                    ]);
                }

                $preparedLines[] = [$dbItem['id'], $dbItem['name'], $unitPrice, (float) $dbItem['cost_price'], $qty, $rate, $lineVat, $lineTotal];
            }

            $grandTotal = max(0.0, round($subtotal - $discount + $totalVat, 2));
            $amountPaid = 0.0;
            $cashIn = 0.0;
            $bankIn = 0.0;
            $creditIn = 0.0;

            foreach ($payments as $p) {
                $amt = max(0.0, (float) ($p['amount'] ?? 0));
                $method = in_array($p['method'] ?? '', ['cash', 'pos_card', 'transfer', 'credit'], true) ? $p['method'] : 'cash';
                $amountPaid += $amt;
                if ($method === 'cash') {
                    $cashIn += $amt;
                } elseif ($method === 'credit') {
                    $creditIn += $amt;
                } else {
                    $bankIn += $amt;
                }
            }

            $changeDue = max(0.0, round($amountPaid - $grandTotal, 2));
            $netCashIn = max(0.0, round($cashIn - $changeDue, 2));

            [$resolvedName, $resolvedPhone] = $this->customerCredit->resolveAndApplySale(
                $businessId,
                $branchId,
                $saleId,
                $receiptNumber,
                $userId,
                $customerId,
                trim((string) ($body['customer_name'] ?? '')),
                trim((string) ($body['customer_phone'] ?? '')),
                $grandTotal,
                $creditIn
            );

            $this->pdo->prepare("
                INSERT INTO sales (id, business_id, branch_id, receipt_number, client_sale_uuid, customer_id, customer_name, customer_phone, subtotal, discount_amount, vat_amount, grand_total, amount_paid, change_due, cashier_user_id, sold_at)
                VALUES (:id, :bid, :brid, :rno, :cuuid, :cid, :cname, :cphone, :sub, :disc, :vat, :gtot, :paid, :chg, :cashier, :sold)
            ")->execute([
                ':id' => $saleId,
                ':bid' => $businessId,
                ':brid' => $branchId,
                ':rno' => $receiptNumber,
                ':cuuid' => $clientSaleUuid,
                ':cid' => $customerId,
                ':cname' => $resolvedName,
                ':cphone' => $resolvedPhone,
                ':sub' => $subtotal,
                ':disc' => $discount,
                ':vat' => $totalVat,
                ':gtot' => $grandTotal,
                ':paid' => $amountPaid,
                ':chg' => $changeDue,
                ':cashier' => $userId,
                ':sold' => $soldAt,
            ]);

            $lineStmt = $this->pdo->prepare("INSERT INTO sale_items (id, sale_id, catalog_item_id, item_name, unit_price, cost_price, quantity, vat_rate, vat_amount, line_total) VALUES (:id, :sid, :iid, :name, :price, :cost, :qty, :vrate, :vamt, :ltot)");
            foreach ($preparedLines as [$iid, $iname, $uprice, $ucost, $qty, $vrate, $vamt, $ltot]) {
                $lineStmt->execute([':id' => Uuid::uuid4()->toString(), ':sid' => $saleId, ':iid' => $iid, ':name' => $iname, ':price' => $uprice, ':cost' => $ucost, ':qty' => $qty, ':vrate' => $vrate, ':vamt' => $vamt, ':ltot' => $ltot]);
            }

            $payStmt = $this->pdo->prepare("INSERT INTO sale_payments (id, sale_id, method, amount, reference) VALUES (:id, :sid, :meth, :amt, :ref)");
            foreach ($payments as $p) {
                $payStmt->execute([':id' => Uuid::uuid4()->toString(), ':sid' => $saleId, ':meth' => $p['method'], ':amt' => (float) $p['amount'], ':ref' => trim((string) ($p['reference'] ?? '')) ?: null]);
            }

            $this->postJournal($businessId, $branchId, $saleId, $receiptNumber, $soldAt, $netCashIn, $bankIn, $creditIn, round($subtotal - $discount, 2), $totalVat, $totalCogs);
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            throw $e;
        }

        return ['sale_id' => $saleId, 'receipt_number' => $receiptNumber];
    }

    private function postJournal(string $businessId, string $branchId, string $saleId, string $receiptNo, string $postedAt, float $cashDr, float $bankDr, float $creditDr, float $salesCr, float $vatCr, float $cogs): void {
        $entryId = Uuid::uuid4()->toString();
        $this->pdo->prepare("INSERT INTO journal_entries (id, business_id, branch_id, reference_type, reference_id, memo, posted_at) VALUES (:id, :bid, :brid, 'sale', :rid, :memo, :at)")
            ->execute([':id' => $entryId, ':bid' => $businessId, ':brid' => $branchId, ':rid' => $saleId, ':memo' => "POS Sale {$receiptNo}", ':at' => $postedAt]);

        $lines = [];
        if ($cashDr > 0) $lines[] = ['1000', $cashDr, 0.0];
        if ($bankDr > 0) $lines[] = ['1010', $bankDr, 0.0];
        if ($creditDr > 0) $lines[] = ['1100', $creditDr, 0.0];
        if ($salesCr > 0) $lines[] = ['4000', 0.0, $salesCr];
        if ($vatCr > 0) $lines[] = ['2100', 0.0, $vatCr];
        if ($cogs > 0) {
            $lines[] = ['5000', $cogs, 0.0];
            $lines[] = ['1200', 0.0, $cogs];
        }

        $stmt = $this->pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_code, debit, credit) VALUES (:id, :eid, :code, :dr, :cr)");
        foreach ($lines as [$code, $dr, $cr]) {
            $stmt->execute([':id' => Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => $code, ':dr' => $dr, ':cr' => $cr]);
        }
    }
}
