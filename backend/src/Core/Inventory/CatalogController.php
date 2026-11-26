<?php

declare(strict_types=1);

namespace App\Core\Inventory;

use App\Core\Http\JsonResponder;
use App\Core\Security\AuditLogger;
use App\Core\Security\PermissionService;
use App\Core\Tenancy\PlanQuotaService;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Ramsey\Uuid\Uuid;
use Throwable;

final class CatalogController {
    public function __construct(
        private PDO $pdo,
        private InventoryLedgerService $ledger,
        private PlanQuotaService $quotas,
        private AuditLogger $audit,
        private PermissionService $perms
    ) {}

    public function listCatalog(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $canViewCatalog = $this->perms->hasPermission($userId, $isOwner, $businessId, 'catalog.manage') || $this->perms->hasPermission($userId, $isOwner, $businessId, 'inventory.restock') || $this->perms->hasPermission($userId, $isOwner, $businessId, 'pos.sell');
        
        if (!$this->verifyBranchOwnership($accountId, $businessId, $branchId)) {
            return JsonResponder::error($response, 'Branch not found.', 'NOT_FOUND', 404);
        }

        if (!$canViewCatalog) {
            return JsonResponder::error($response, 'You do not have permission to view catalog items.', 'FORBIDDEN', 403);
        }


        $catStmt = $this->pdo->prepare("SELECT id, name, slug FROM categories WHERE business_id = :bid AND is_active = 1 ORDER BY name ASC");
        $catStmt->execute([':bid' => $businessId]);

        $itemStmt = $this->pdo->prepare("
            SELECT ci.*, c.name AS category_name, COALESCE(bi.quantity_on_hand, 0) AS quantity_on_hand
            FROM catalog_items ci
            LEFT JOIN categories c ON c.id = ci.category_id
            LEFT JOIN branch_inventory bi ON bi.catalog_item_id = ci.id AND bi.branch_id = :brid
            WHERE ci.business_id = :bid AND ci.is_active = 1
            ORDER BY ci.name ASC
        ");
        $itemStmt->execute([':brid' => $branchId, ':bid' => $businessId]);

        $batchStmt = $this->pdo->prepare("
            SELECT pb.*, ci.name AS item_name, DATEDIFF(pb.expiry_date, CURDATE()) AS days_to_expiry
            FROM product_batches pb
            INNER JOIN catalog_items ci ON ci.id = pb.catalog_item_id
            WHERE pb.branch_id = :brid AND pb.quantity_remaining > 0 AND pb.is_active = 1
            ORDER BY pb.expiry_date ASC
        ");
        $batchStmt->execute([':brid' => $branchId]);

        return JsonResponder::success($response, [
            'categories' => $catStmt->fetchAll(),
            'items'      => $itemStmt->fetchAll(),
            'batches'    => $batchStmt->fetchAll(),
        ]);
    }


    public function createItem(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);
        $isOwner = (bool) $request->getAttribute('auth_is_owner');
        $bizStmt = $this->pdo->prepare("SELECT id, industry_type FROM businesses WHERE id = :bid AND account_id = :aid AND is_active = 1 LIMIT 1");
        $bizStmt->execute([':bid' => $businessId, ':aid' => $accountId]);
        $biz = $bizStmt->fetch();

        if (!$biz) {
            return JsonResponder::error($response, 'Business not found.', 'NOT_FOUND', 404);
        }

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'catalog.manage')) {
            return JsonResponder::error($response, 'You do not have permission to add catalog items.', 'FORBIDDEN', 403);
        }


        if (!$this->quotas->canAddCatalogItem($accountId, $businessId)) {
            return JsonResponder::error($response, 'Catalog item limit reached for your current plan. Upgrade to add more.', 'QUOTA_EXCEEDED', 403);
        }

        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '') {
            return JsonResponder::error($response, 'Item name is required.', 'VALIDATION_ERROR', 422);
        }

        $itemType = ($body['item_type'] ?? 'product') === 'service' ? 'service' : 'product';
        $trackBatches = $itemType === 'product' && (!empty($body['track_batches']) || $biz['industry_type'] === 'pharmacy') ? 1 : 0;
        $itemId = Uuid::uuid4()->toString();

        $this->pdo->beginTransaction();
        try {
            $this->pdo->prepare("
                INSERT INTO catalog_items
                (id, business_id, category_id, item_type, name, sku, barcode, unit_label, cost_price, selling_price, is_vat_exempt, track_batches, reorder_level)
                VALUES
                (:id, :bid, :cid, :itype, :name, :sku, :bar, :unit, :cost, :price, :exempt, :batches, :reorder)
            ")->execute([
                ':id'      => $itemId,
                ':bid'     => $businessId,
                ':cid'     => !empty($body['category_id']) ? (string) $body['category_id'] : null,
                ':itype'   => $itemType,
                ':name'    => $name,
                ':sku'     => trim((string) ($body['sku'] ?? '')) ?: null,
                ':bar'     => trim((string) ($body['barcode'] ?? '')) ?: null,
                ':unit'    => trim((string) ($body['unit_label'] ?? 'Piece')) ?: 'Piece',
                ':cost'    => (float) ($body['cost_price'] ?? 0),
                ':price'   => (float) ($body['selling_price'] ?? 0),
                ':exempt'  => !empty($body['is_vat_exempt']) ? 1 : 0,
                ':batches' => $trackBatches,
                ':reorder' => (int) ($body['reorder_level'] ?? 5),
            ]);

            $openingQty = (float) ($body['opening_stock'] ?? 0);
            $branchId = trim((string) ($body['branch_id'] ?? ''));
            if ($itemType === 'product' && $openingQty > 0 && $branchId !== '') {
                $this->ledger->recordMovement([
                    'business_id'     => $businessId,
                    'branch_id'       => $branchId,
                    'catalog_item_id' => $itemId,
                    'movement_type'   => 'opening_stock',
                    'quantity_delta'  => $openingQty,
                    'unit_cost'       => (float) ($body['cost_price'] ?? 0),
                    'batch_number'    => (string) ($body['batch_number'] ?? ''),
                    'expiry_date'     => (string) ($body['expiry_date'] ?? ''),
                    'actor_user_id'   => $userId,
                    'notes'           => 'Initial opening stock',
                ]);
            }

            $this->pdo->commit();
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            return JsonResponder::error($response, $e->getMessage(), 'CATALOG_ERROR', 422);
        }

        $this->audit->log($accountId, 'catalog.item_created', $userId, $businessId, null, 'catalog_item', $itemId);
        return JsonResponder::success($response, ['item_id' => $itemId], 201);
    }

    public function recordStockMovement(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);
        $isOwner = (bool) $request->getAttribute('auth_is_owner');

        if (!$this->verifyBranchOwnership($accountId, $businessId, $branchId)) {
            return JsonResponder::error($response, 'Branch not found.', 'NOT_FOUND', 404);
        }

        
        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'catalog.manage')) {
            return JsonResponder::error($response, 'You do not have permission to add catalog items.', 'FORBIDDEN', 403);
        }

        $this->pdo->beginTransaction();
        try {
            $res = $this->ledger->recordMovement([
                'business_id'     => $businessId,
                'branch_id'       => $branchId,
                'catalog_item_id' => (string) ($body['catalog_item_id'] ?? ''),
                'movement_type'   => (string) ($body['movement_type'] ?? 'restock'),
                'quantity_delta'  => (float) ($body['quantity_delta'] ?? 0),
                'unit_cost'       => (float) ($body['unit_cost'] ?? 0),
                'batch_number'    => (string) ($body['batch_number'] ?? ''),
                'expiry_date'     => (string) ($body['expiry_date'] ?? ''),
                'idempotency_key' => (string) ($body['idempotency_key'] ?? ''),
                'actor_user_id'   => $userId,
                'notes'           => (string) ($body['notes'] ?? ''),
            ]);
            $this->pdo->commit();
            return JsonResponder::success($response, $res);
        } catch (Throwable $e) {
            $this->pdo->rollBack();
            return JsonResponder::error($response, $e->getMessage(), 'STOCK_MOVEMENT_ERROR', 422);
        }
    }

    private function verifyBranchOwnership(string $accountId, string $businessId, string $branchId): bool {
        $stmt = $this->pdo->prepare("
            SELECT br.id FROM branches br
            INNER JOIN businesses b ON b.id = br.business_id
            WHERE br.id = :brid AND b.id = :bid AND b.account_id = :aid AND br.is_active = 1
            LIMIT 1
        ");
        $stmt->execute([':brid' => $branchId, ':bid' => $businessId, ':aid' => $accountId]);
        return (bool) $stmt->fetch();
    }


    public function updateItem(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $userId = (string) $request->getAttribute('auth_user_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $itemId = (string) ($args['itemId'] ?? '');
        $body = (array) ($request->getParsedBody() ?? []);
        $isOwner = (bool) $request->getAttribute('auth_is_owner');

        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'catalog.manage')) {
            return JsonResponder::error($response, 'You do not have permission to add catalog items.', 'FORBIDDEN', 403);
        }

        $check = $this->pdo->prepare("
            SELECT ci.id, ci.name
            FROM catalog_items ci
            INNER JOIN businesses b ON b.id = ci.business_id
            WHERE ci.id = :iid AND ci.business_id = :bid AND b.account_id = :aid
            LIMIT 1
        ");
        $check->execute([':iid' => $itemId, ':bid' => $businessId, ':aid' => $accountId]);
        if (!$check->fetch()) {
            return JsonResponder::error($response, 'Catalog item not found.', 'NOT_FOUND', 404);
        }

        $name = trim((string) ($body['name'] ?? ''));
        if ($name === '') {
            return JsonResponder::error($response, 'Item name is required.', 'VALIDATION_ERROR', 422);
        }

        $this->pdo->prepare("
            UPDATE catalog_items
            SET category_id = :cid,
                name = :name,
                sku = :sku,
                barcode = :bar,
                unit_label = :unit,
                cost_price = :cost,
                selling_price = :price,
                is_vat_exempt = :exempt,
                reorder_level = :reorder
            WHERE id = :iid AND business_id = :bid
        ")->execute([
            ':cid'     => !empty($body['category_id']) ? (string) $body['category_id'] : null,
            ':name'    => $name,
            ':sku'     => trim((string) ($body['sku'] ?? '')) ?: null,
            ':bar'     => trim((string) ($body['barcode'] ?? '')) ?: null,
            ':unit'    => trim((string) ($body['unit_label'] ?? 'Piece')) ?: 'Piece',
            ':cost'    => (float) ($body['cost_price'] ?? 0),
            ':price'   => (float) ($body['selling_price'] ?? 0),
            ':exempt'  => !empty($body['is_vat_exempt']) ? 1 : 0,
            ':reorder' => (int) ($body['reorder_level'] ?? 5),
            ':iid'     => $itemId,
            ':bid'     => $businessId,
        ]);

        $this->audit->log($accountId, 'catalog.item_updated', $userId, $businessId, null, 'catalog_item', $itemId);
        return JsonResponder::success($response, ['updated' => true]);
    }
}
