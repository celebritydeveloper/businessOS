<?php

declare(strict_types=1);

namespace App\Core\Inventory;

use App\Core\Http\JsonResponder;
use App\Core\Security\AuditLogger;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Ramsey\Uuid\Uuid;
use Throwable;

final class StockTransferController
{
    public function __construct(
        private PDO $pdo,
        private InventoryLedgerService $ledger,
        private AuditLogger $audit
    ) {}

    public function listTransfers(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $businessId = (string) ($args['businessId'] ?? '');

        $stmt = $this->pdo->prepare("
            SELECT st.*, fb.name AS from_branch_name, tb.name AS to_branch_name
            FROM stock_transfers st
            INNER JOIN branches fb ON fb.id = st.from_branch_id
            INNER JOIN branches tb ON tb.id = st.to_branch_id
            INNER JOIN businesses b ON b.id = st.business_id
            WHERE st.business_id = :bid AND b.account_id = :aid
            ORDER BY st.created_at DESC
            LIMIT 50
        ");
        $stmt->execute([':bid' => $businessId, ':aid' => $accountId]);
        $transfers = $stmt->fetchAll();

        $itemStmt = $this->pdo->prepare("
            SELECT sti.*, ci.name AS item_name
            FROM stock_transfer_items sti
            INNER JOIN catalog_items ci ON ci.id = sti.catalog_item_id
            WHERE sti.transfer_id = :tid
        ");
        foreach ($transfers as &$tr) {
            $itemStmt->execute([':tid' => $tr['id']]);
            $tr['items'] = $itemStmt->fetchAll();
        }
        unset($tr);

        return JsonResponder::success($response, ['transfers' => $transfers]);
    }

    public function dispatchTransfer(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        $fromBranch = trim((string) ($body['from_branch_id'] ?? ''));
        $toBranch = trim((string) ($body['to_branch_id'] ?? ''));
        $items = is_array($body['items'] ?? null) ? $body['items'] : [];

        if ($fromBranch === '' || $toBranch === '' || $fromBranch === $toBranch || empty($items)) {
            return JsonResponder::error($response, 'Select distinct source and destination branches with at least one item.', 'VALIDATION_ERROR', 422);
        }

        $transferId = Uuid::uuid4()->toString();
        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("
                INSERT INTO stock_transfers (id, business_id, from_branch_id, to_branch_id, status, notes, dispatched_by)
                VALUES (:id, :bid, :from, :to, 'in_transit', :notes, :by)
            ")->execute([
                ':id'    => $transferId,
                ':bid'   => $businessId,
                ':from'  => $fromBranch,
                ':to'    => $toBranch,
                ':notes' => trim((string) ($body['notes'] ?? '')) ?: null,
                ':by'    => $userId,
            ]);

            foreach ($items as $idx => $line) {
                $itemId = (string) ($line['catalog_item_id'] ?? '');
                $qty = (float) ($line['quantity'] ?? 0);
                $batchNo = trim((string) ($line['batch_number'] ?? ''));
                $expiry = trim((string) ($line['expiry_date'] ?? ''));
                $cost = (float) ($line['unit_cost'] ?? 0);

                $this->pdo->prepare("
                    INSERT INTO stock_transfer_items (id, transfer_id, catalog_item_id, batch_number, expiry_date, unit_cost, quantity)
                    VALUES (:id, :tid, :iid, :bnum, :exp, :cost, :qty)
                ")->execute([
                    ':id'   => Uuid::uuid4()->toString(),
                    ':tid'  => $transferId,
                    ':iid'  => $itemId,
                    ':bnum' => $batchNo !== '' ? $batchNo : null,
                    ':exp'  => $expiry !== '' ? $expiry : null,
                    ':cost' => $cost,
                    ':qty'  => $qty,
                ]);

                $this->ledger->recordMovement([
                    'business_id'     => $businessId,
                    'branch_id'       => $fromBranch,
                    'catalog_item_id' => $itemId,
                    'movement_type'   => 'transfer_out',
                    'quantity_delta'  => -$qty,
                    'unit_cost'       => $cost,
                    'batch_number'    => $batchNo,
                    'reference_type'  => 'stock_transfer',
                    'reference_id'    => $transferId,
                    'idempotency_key' => "transfer-out:{$transferId}:{$idx}",
                    'actor_user_id'   => $userId,
                ]);
            }

            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            return JsonResponder::error($response, $e->getMessage(), 'TRANSFER_ERROR', 422);
        }

        $this->audit->log($accountId, 'inventory.transfer_dispatched', $userId, $businessId, $fromBranch, 'stock_transfer', $transferId);
        return JsonResponder::success($response, ['transfer_id' => $transferId], 201);
    }

    public function confirmReceipt(Request $request, Response $response, array $args): Response
    {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $transferId = (string) ($args['transferId'] ?? '');

        $stmt = $this->pdo->prepare("SELECT * FROM stock_transfers WHERE id = :tid AND business_id = :bid LIMIT 1");
        $stmt->execute([':tid' => $transferId, ':bid' => $businessId]);
        $transfer = $stmt->fetch();

        if (!$transfer || $transfer['status'] !== 'in_transit') {
            return JsonResponder::error($response, 'Transfer not found or already processed.', 'INVALID_TRANSFER', 422);
        }

        $itemStmt = $this->pdo->prepare("SELECT * FROM stock_transfer_items WHERE transfer_id = :tid");
        $itemStmt->execute([':tid' => $transferId]);
        $lines = $itemStmt->fetchAll();

        $this->pdo->beginTransaction();
        try {
            foreach ($lines as $idx => $line) {
                $this->ledger->recordMovement([
                    'business_id'     => $businessId,
                    'branch_id'       => (string) $transfer['to_branch_id'],
                    'catalog_item_id' => (string) $line['catalog_item_id'],
                    'movement_type'   => 'transfer_in',
                    'quantity_delta'  => (float) $line['quantity'],
                    'unit_cost'       => (float) $line['unit_cost'],
                    'batch_number'    => (string) ($line['batch_number'] ?? ''),
                    'expiry_date'     => (string) ($line['expiry_date'] ?? ''),
                    'reference_type'  => 'stock_transfer',
                    'reference_id'    => $transferId,
                    'idempotency_key' => "transfer-in:{$transferId}:{$idx}",
                    'actor_user_id'   => $userId,
                ]);
            }

            $this->pdo->prepare("
                UPDATE stock_transfers
                SET status = 'received', received_by = :by, received_at = UTC_TIMESTAMP()
                WHERE id = :tid
            ")->execute([':by' => $userId, ':tid' => $transferId]);

            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            return JsonResponder::error($response, $e->getMessage(), 'RECEIPT_ERROR', 422);
        }

        $this->audit->log($accountId, 'inventory.transfer_received', $userId, $businessId, (string) $transfer['to_branch_id'], 'stock_transfer', $transferId);
        return JsonResponder::success($response, ['received' => true]);
    }
}
