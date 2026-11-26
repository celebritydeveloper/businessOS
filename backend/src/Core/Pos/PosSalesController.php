<?php

declare(strict_types=1);

namespace App\Core\Pos;

use App\Core\Http\JsonResponder;
use App\Core\Security\AuditLogger;
use App\Core\Security\PermissionService;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Throwable;

final class PosSalesController
{
    public function __construct(
        private PDO $pdo,
        private SaleCheckoutService $checkout,
        private AuditLogger $audit,
        private PermissionService $perms
    ) {}

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

        try {
            $res = $this->checkout->process($accountId, $businessId, $branchId, $userId, $body);
        } catch (Throwable $e) {
            return JsonResponder::error($response, $e->getMessage(), 'POS_SALE_ERROR', 422);
        }

        if (!empty($res['duplicate'])) {
            return JsonResponder::success($response, $res);
        }

        $this->audit->log($accountId, 'pos.sale_recorded', $userId, $businessId, $branchId, 'sale', $res['sale_id'], null, ['receipt' => $res['receipt_number']]);
        return JsonResponder::success($response, $res, 201);
    }
}
