<?php

declare(strict_types=1);

namespace App\Core\Pos;

use App\Core\Http\JsonResponder;
use App\Core\Inventory\InventoryLedgerService;
use App\Core\Security\AuditLogger;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Ramsey\Uuid\Uuid;
use Throwable;

final class PosController
{
    public function __construct(
        private PDO $pdo,
        private InventoryLedgerService $ledger,
        private AuditLogger $audit
    ) {
    }

    public function listSales(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');

        $stmt = $this->pdo->prepare("
            SELECT s.*, u.full_name AS cashier_name
            FROM sales s
            INNER JOIN businesses b ON b.id = s.business_id
            LEFT JOIN users u ON u.id = s.cashier_user_id
            WHERE s.business_id = :bid AND s.branch_id = :brid AND b.account_id = :aid
            ORDER BY s.sold_at DESC
            LIMIT 60
        ");
        $stmt->execute([':bid' => $businessId, ':brid' => $branchId, ':aid' => $accountId]);
        $sales = $stmt->fetchAll();

        $itemStmt = $this->pdo->prepare("SELECT * FROM sale_items WHERE sale_id = :sid");
        $payStmt = $this->pdo->prepare("SELECT * FROM sale_payments WHERE sale_id = :sid");

        foreach ($sales as &$sale) {
            $itemStmt->execute([':sid' => $sale['id']]);
            $sale['items'] = $itemStmt->fetchAll();
            $payStmt->execute([':sid' => $sale['id']]);
            $sale['payments'] = $payStmt->fetchAll();
        }
        unset($sale);

        return JsonResponder::success($response, ['sales' => $sales]);
    }
    public function recordSale(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        $clientSaleUuid = trim((string) ($body['client_sale_uuid'] ?? ''));
        $items = is_array($body['items'] ?? null) ? $body['items'] : [];
        $payments = is_array($body['payments'] ?? null) ? $body['payments'] : [];

        if ($clientSaleUuid === '' || empty($items) || empty($payments)) {
            return JsonResponder::error($response, 'Sale UUID, cart items, and payment breakdown are required.', 'VALIDATION_ERROR', 422);
        }

        // Idempotent check for offline sync retries
        $dupStmt = $this->pdo->prepare("SELECT id, receipt_number FROM sales WHERE client_sale_uuid = :cuuid LIMIT 1");
        $dupStmt->execute([':cuuid' => $clientSaleUuid]);
        if ($existing = $dupStmt->fetch()) {
            return JsonResponder::success($response, ['duplicate' => true, 'sale_id' => $existing['id'], 'receipt_number' => $existing['receipt_number']]);
        }

        $bizStmt = $this->pdo->prepare("SELECT is_vat_registered, default_vat_rate FROM businesses WHERE id = :bid AND account_id = :aid AND is_active = 1 LIMIT 1");
        $bizStmt->execute([':bid' => $businessId, ':aid' => $accountId]);
        $biz = $bizStmt->fetch();
        if (!$biz) {
            return JsonResponder::error($response, 'Business not found.', 'NOT_FOUND', 404);
        }

        $vatEnabled = (int) $biz['is_vat_registered'] === 1;
        $defaultVatRate = $vatEnabled ? (float) $biz['default_vat_rate'] : 0.0;
        $discount = max(0.0, (float) ($body['discount_amount'] ?? 0));
        $receiptNumber = trim((string) ($body['receipt_number'] ?? '')) ?: ('BOS-' . gmdate('Ymd') . '-' . random_int(1000, 9999));
        $soldAt = !empty($body['sold_at']) ? gmdate('Y-m-d H:i:s', strtotime((string) $body['sold_at'])) : gmdate('Y-m-d H:i:s');
        $saleId = Uuid::uuid4()->toString();

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
                    throw new \RuntimeException('One or more cart items no longer exist.');
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

            foreach ($payments as $p) {
                $amt = max(0.0, (float) ($p['amount'] ?? 0));
                $method = in_array($p['method'] ?? '', ['cash', 'pos_card', 'transfer'], true) ? $p['method'] : 'cash';
                $amountPaid += $amt;
                if ($method === 'cash') {
                    $cashIn += $amt;
                } else {
                    $bankIn += $amt;
                }
            }

            $changeDue = max(0.0, round($amountPaid - $grandTotal, 2));
            $netCashIn = max(0.0, round($cashIn - $changeDue, 2));

            $this->pdo->prepare("
                INSERT INTO sales (id, business_id, branch_id, receipt_number, client_sale_uuid, customer_name, customer_phone, subtotal, discount_amount, vat_amount, grand_total, amount_paid, change_due, cashier_user_id, sold_at)
                VALUES (:id, :bid, :brid, :rno, :cuuid, :cname, :cphone, :sub, :disc, :vat, :gtot, :paid, :chg, :cashier, :sold)
            ")->execute([
                ':id' => $saleId,
                ':bid' => $businessId,
                ':brid' => $branchId,
                ':rno' => $receiptNumber,
                ':cuuid' => $clientSaleUuid,
                ':cname' => trim((string) ($body['customer_name'] ?? '')) ?: null,
                ':cphone' => trim((string) ($body['customer_phone'] ?? '')) ?: null,
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

            $this->postSaleJournal($businessId, $branchId, $saleId, $receiptNumber, $soldAt, $netCashIn, $bankIn, round($subtotal - $discount, 2), $totalVat, $totalCogs);
            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            return JsonResponder::error($response, $e->getMessage(), 'POS_SALE_ERROR', 422);
        }

        $this->audit->log($accountId, 'pos.sale_recorded', $userId, $businessId, $branchId, 'sale', $saleId, null, ['receipt' => $receiptNumber]);
        return JsonResponder::success($response, ['sale_id' => $saleId, 'receipt_number' => $receiptNumber], 201);
    }

    private function postSaleJournal(string $businessId, string $branchId, string $saleId, string $receiptNo, string $postedAt, float $cashDebit, float $bankDebit, float $netSalesCredit, float $vatCredit, float $cogsAmount): void
    {
        $entryId = Uuid::uuid4()->toString();
        $this->pdo->prepare("INSERT INTO journal_entries (id, business_id, branch_id, reference_type, reference_id, memo, posted_at) VALUES (:id, :bid, :brid, 'sale', :rid, :memo, :at)")
            ->execute([':id' => $entryId, ':bid' => $businessId, ':brid' => $branchId, ':rid' => $saleId, ':memo' => "POS Sale {$receiptNo}", ':at' => $postedAt]);

        $lines = [];
        if ($cashDebit > 0) $lines[] = ['1000', $cashDebit, 0.0];
        if ($bankDebit > 0) $lines[] = ['1010', $bankDebit, 0.0];
        if ($netSalesCredit > 0) $lines[] = ['4000', 0.0, $netSalesCredit];
        if ($vatCredit > 0) $lines[] = ['2100', 0.0, $vatCredit];
        if ($cogsAmount > 0) {
            $lines[] = ['5000', $cogsAmount, 0.0];
            $lines[] = ['1200', 0.0, $cogsAmount];
        }

        $stmt = $this->pdo->prepare("INSERT INTO journal_lines (id, journal_entry_id, account_code, debit, credit) VALUES (:id, :eid, :code, :dr, :cr)");
        foreach ($lines as [$code, $dr, $cr]) {
            $stmt->execute([':id' => Uuid::uuid4()->toString(), ':eid' => $entryId, ':code' => $code, ':dr' => $dr, ':cr' => $cr]);
        }
    }
}
