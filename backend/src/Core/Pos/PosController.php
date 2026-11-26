<?php

declare(strict_types=1);

namespace App\Core\Pos;

use App\Core\Auth\SessionAuthService;
use App\Core\Http\JsonResponder;
use App\Core\Inventory\InventoryLedgerService;
use App\Core\Security\AuditLogger;
use App\Core\Security\PermissionService;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Ramsey\Uuid\Uuid;
use Throwable;

final class PosController {
    public function __construct(
        private PDO $pdo,
        private InventoryLedgerService $ledger,
        private AuditLogger $audit,
        private SessionAuthService $authService,
        private PermissionService $perms
    ) {}

    public function listSales(Request $request, Response $response, array $args): Response {
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


    public function recordSale(Request $request, Response $response, array $args): Response  {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);
        $isOwner = (bool) $request->getAttribute('auth_is_owner');

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'pos.sell')) {
            return JsonResponder::error($response, 'You do not have permission to process POS sales.', 'FORBIDDEN', 403);
        }


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

    private function postSaleJournal(string $businessId, string $branchId, string $saleId, string $receiptNo, string $postedAt, float $cashDebit, float $bankDebit, float $netSalesCredit, float $vatCredit, float $cogsAmount): void  {
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


    public function listBranchCashiers(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');

        $stmt = $this->pdo->prepare("
            SELECT DISTINCT u.id, u.full_name, u.is_owner,
                   COALESCE(bro.name, IF(u.is_owner = 1, 'Account Owner', 'Staff')) AS role_name,
                   (u.pos_pin_hash IS NOT NULL AND u.pos_pin_hash <> '') AS has_pin
            FROM users u
            LEFT JOIN user_branch_roles ubr ON ubr.user_id = u.id AND ubr.branch_id = :brid
            LEFT JOIN business_roles bro ON bro.id = ubr.role_id
            WHERE u.account_id = :aid
              AND u.is_active = 1
              AND (u.is_owner = 1 OR ubr.branch_id = :brid2)
            ORDER BY u.full_name ASC
        ");
        $stmt->execute([':brid' => $branchId, ':aid' => $accountId, ':brid2' => $branchId]);

        $staff = array_map(static function (array $row): array {
            $row['has_pin'] = (bool) $row['has_pin'];
            return $row;
        }, $stmt->fetchAll());

        return JsonResponder::success($response, ['cashiers' => $staff]);
    }


    public function switchCashierByPin(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $previousUserId = (string) $request->getAttribute('auth_user_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        $targetUserId = trim((string) ($body['user_id'] ?? ''));
        $pin = trim((string) ($body['pos_pin'] ?? ''));

        if ($targetUserId === '' || !preg_match('/^\d{4}$/', $pin)) {
            return JsonResponder::error($response, 'Select a staff member and enter their 4-digit POS PIN.', 'VALIDATION_ERROR', 422);
        }

        $uStmt = $this->pdo->prepare("
            SELECT id, account_id, full_name, email, is_owner, pos_pin_hash, is_active
            FROM users
            WHERE id = :uid AND account_id = :aid AND is_active = 1
            LIMIT 1
        ");
        $uStmt->execute([':uid' => $targetUserId, ':aid' => $accountId]);
        $targetUser = $uStmt->fetch();

        if (!$targetUser || empty($targetUser['pos_pin_hash'])) {
            return JsonResponder::error($response, 'This staff member has not set a 4-digit POS PIN yet.', 'PIN_NOT_SET', 422);
        }

        if (!password_verify($pin, (string) $targetUser['pos_pin_hash'])) {
            return JsonResponder::error($response, 'Incorrect 4-digit POS PIN.', 'INVALID_PIN', 401);
        }

        $targetIsOwner = (int) $targetUser['is_owner'] === 1;
        if (!$this->perms->hasPermission($targetUserId, $targetIsOwner, $businessId, 'pos.sell')) {
            return JsonResponder::error($response, 'Selected staff member does not have POS selling permission.', 'FORBIDDEN', 403);
        }

        $deviceId = $request->getHeaderLine('X-Device-ID') ?: 'pos-terminal';
        $userAgent = $request->getHeaderLine('User-Agent') ?: 'POS Browser';
        $ip = $request->getServerParams()['REMOTE_ADDR'] ?? '0.0.0.0';

        $tokens = $this->authService->issueSession($targetUser, $deviceId, 'POS Terminal Shift Switch', $ip, $userAgent);

        $this->audit->log($accountId, 'pos.cashier_switched', $targetUserId, $businessId, $branchId, 'user', $targetUserId, null, [
            'from_user_id' => $previousUserId,
            'to_user_name' => $targetUser['full_name'],
        ]);

        // Set updated HttpOnly refresh cookie so page reloads stay on the incoming cashier
        $isHttps = ($request->getUri()->getScheme() === 'https');
        $cookie = sprintf(
            'bos_refresh=%s; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=%d%s',
            $tokens['refresh_token'],
            60 * 60 * 24 * 30,
            $isHttps ? '; Secure' : ''
        );

        return JsonResponder::success($response->withAddedHeader('Set-Cookie', $cookie), [
            'access_token' => $tokens['access_token'],
            'cashier_name' => $targetUser['full_name'],
        ]);
    }


    public function resetPinWithPassword(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);

        $targetUserId = trim((string) ($body['user_id'] ?? ''));
        $loginPassword = (string) ($body['login_password'] ?? '');
        $newPin = trim((string) ($body['new_pos_pin'] ?? ''));

        if ($targetUserId === '' || $loginPassword === '' || !preg_match('/^\d{4}$/', $newPin)) {
            return JsonResponder::error($response, 'Select user, enter your login password, and choose a new 4-digit PIN.', 'VALIDATION_ERROR', 422);
        }

        $uStmt = $this->pdo->prepare("
            SELECT id, account_id, full_name, email, is_owner, password_hash, is_active
            FROM users
            WHERE id = :uid AND account_id = :aid AND is_active = 1
            LIMIT 1
        ");
        $uStmt->execute([':uid' => $targetUserId, ':aid' => $accountId]);
        $targetUser = $uStmt->fetch();

        if (!$targetUser || !password_verify($loginPassword, (string) $targetUser['password_hash'])) {
            return JsonResponder::error($response, 'Incorrect account login password.', 'INVALID_PASSWORD', 401);
        }

        $targetIsOwner = (int) $targetUser['is_owner'] === 1;
        if (!$this->perms->hasPermission($targetUserId, $targetIsOwner, $businessId, 'pos.sell')) {
            return JsonResponder::error($response, 'Selected staff member does not have POS selling permission.', 'FORBIDDEN', 403);
        }

        $this->pdo->prepare("UPDATE users SET pos_pin_hash = :pin WHERE id = :uid")
            ->execute([':pin' => password_hash($newPin, PASSWORD_DEFAULT), ':uid' => $targetUserId]);

        $deviceId = $request->getHeaderLine('X-Device-ID') ?: 'pos-terminal';
        $userAgent = $request->getHeaderLine('User-Agent') ?: 'POS Browser';
        $ip = $request->getServerParams()['REMOTE_ADDR'] ?? '0.0.0.0';

        $tokens = $this->authService->issueSession($targetUser, $deviceId, 'POS Terminal PIN Reset', $ip, $userAgent);
        $this->audit->log($accountId, 'pos.pin_reset_on_terminal', $targetUserId, $businessId, $branchId, 'user', $targetUserId);

        $isHttps = ($request->getUri()->getScheme() === 'https');
        $cookie = sprintf(
            'bos_refresh=%s; Path=/api/v1/auth; HttpOnly; SameSite=Lax; Max-Age=%d%s',
            $tokens['refresh_token'],
            60 * 60 * 24 * 30,
            $isHttps ? '; Secure' : ''
        );

        return JsonResponder::success($response->withAddedHeader('Set-Cookie', $cookie), [
            'access_token' => $tokens['access_token'],
            'cashier_name' => $targetUser['full_name'],
        ]);
    }
}
