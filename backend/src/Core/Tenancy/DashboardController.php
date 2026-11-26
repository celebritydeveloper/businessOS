<?php

declare(strict_types=1);

namespace App\Core\Tenancy;

use App\Core\Http\JsonResponder;
use App\Core\Security\PermissionService;
use PDO;
use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;

final class DashboardController {
    public function __construct(
        private PDO $pdo,
        private PermissionService $perms
    ){}

    public function getBranchOverview(Request $request, Response $response, array $args): Response {
        $accountId = (string) $request->getAttribute('auth_account_id');
        $businessId = (string) ($args['businessId'] ?? '');
        $branchId = (string) ($args['branchId'] ?? '');
        $userId = (string) $request->getAttribute('auth_user_id');
        $isOwner = (bool) $request->getAttribute('auth_is_owner');


        if (!$this->perms->hasPermission($userId, $isOwner, $businessId, 'dashboard.view')) {
            return JsonResponder::error($response, 'You do not have permission to view dashboard analytics.', 'FORBIDDEN', 403);
        }


        $check = $this->pdo->prepare("
            SELECT br.id
            FROM branches br
            INNER JOIN businesses b ON b.id = br.business_id
            WHERE br.id = :brid AND b.id = :bid AND b.account_id = :aid AND br.is_active = 1
            LIMIT 1
        ");
        $check->execute([':brid' => $branchId, ':bid' => $businessId, ':aid' => $accountId]);
        if (!$check->fetch()) {
            return JsonResponder::error($response, 'Branch not found.', 'NOT_FOUND', 404);
        }

        // 1. Today & Month-to-Date Sales KPIs
        $tz = new \DateTimeZone('Africa/Lagos');
        $nowLagos = new \DateTimeImmutable('now', $tz);
        $todayStr = $nowLagos->format('Y-m-d');
        $monthStart = $nowLagos->format('Y-m-01 00:00:00');


        $kpiStmt = $this->pdo->prepare("
            SELECT
                COALESCE(SUM(CASE WHEN DATE(sold_at) = :today THEN grand_total ELSE 0 END), 0) AS today_revenue,
                COUNT(CASE WHEN DATE(sold_at) = :today2 THEN 1 END) AS today_orders,
                COALESCE(SUM(CASE WHEN sold_at >= :mstart THEN grand_total ELSE 0 END), 0) AS month_revenue
            FROM sales
            WHERE business_id = :bid AND branch_id = :brid
        ");
        $kpiStmt->execute([
            ':today'  => $todayStr,
            ':today2' => $todayStr,
            ':mstart' => $monthStart,
            ':bid'    => $businessId,
            ':brid'   => $branchId,
        ]);
        $kpis = $kpiStmt->fetch() ?: ['today_revenue' => 0, 'today_orders' => 0, 'month_revenue' => 0];

        // 2. Low-Stock Items Count
        $lowStmt = $this->pdo->prepare("
            SELECT COUNT(*)
            FROM catalog_items ci
            LEFT JOIN branch_inventory bi ON bi.catalog_item_id = ci.id AND bi.branch_id = :brid
            WHERE ci.business_id = :bid
              AND ci.is_active = 1
              AND ci.item_type = 'product'
              AND COALESCE(bi.quantity_on_hand, 0) <= ci.reorder_level
        ");
        $lowStmt->execute([':brid' => $branchId, ':bid' => $businessId]);
        $lowStockCount = (int) $lowStmt->fetchColumn();

        // 3. Expiring Batches Within 60 Days
        $expStmt = $this->pdo->prepare("
            SELECT COUNT(*)
            FROM product_batches
            WHERE branch_id = :brid
              AND is_active = 1
              AND quantity_remaining > 0
              AND expiry_date <= DATE_ADD(CURDATE(), INTERVAL 60 DAY)
        ");
        $expStmt->execute([':brid' => $branchId]);
        $expiringCount = (int) $expStmt->fetchColumn();




        $catStmt = $this->pdo->prepare("SELECT COUNT(*) FROM catalog_items WHERE business_id = :bid AND is_active = 1");
        $catStmt->execute([':bid' => $businessId]);
        $catalogCount = (int) $catStmt->fetchColumn();


        // 4. Last 7 Days Revenue Trend
        $start7 = gmdate('Y-m-d', strtotime('-6 days'));
        $trendStmt = $this->pdo->prepare("
            SELECT DATE(sold_at) AS sale_day, COALESCE(SUM(grand_total), 0) AS revenue, COUNT(*) AS orders
            FROM sales
            WHERE business_id = :bid AND branch_id = :brid AND DATE(sold_at) >= :s7
            GROUP BY DATE(sold_at)
        ");
        $trendStmt->execute([':bid' => $businessId, ':brid' => $branchId, ':s7' => $start7]);
        $byDay = [];
        foreach ($trendStmt->fetchAll() as $r) {
            $byDay[$r['sale_day']] = ['revenue' => (float) $r['revenue'], 'orders' => (int) $r['orders']];
        }

        $dailyTrend = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = gmdate('Y-m-d', strtotime("-{$i} days"));
            $dailyTrend[] = [
                'date'    => $day,
                'label'   => gmdate('D', strtotime($day)),
                'revenue' => $byDay[$day]['revenue'] ?? 0.0,
                'orders'  => $byDay[$day]['orders'] ?? 0,
            ];
        }

        // 5. Payment Channel Split (Month-to-Date)
        $payStmt = $this->pdo->prepare("
            SELECT sp.method, COALESCE(SUM(sp.amount), 0) AS total
            FROM sale_payments sp
            INNER JOIN sales s ON s.id = sp.sale_id
            WHERE s.business_id = :bid AND s.branch_id = :brid AND s.sold_at >= :mstart
            GROUP BY sp.method
        ");
        $payStmt->execute([':bid' => $businessId, ':brid' => $branchId, ':mstart' => $monthStart]);
        $payments = $payStmt->fetchAll();

        // 6. Recent 5 Receipts
        $recStmt = $this->pdo->prepare("
            SELECT s.id, s.receipt_number, s.customer_name, s.grand_total, s.sold_at, u.full_name AS cashier_name
            FROM sales s
            LEFT JOIN users u ON u.id = s.cashier_user_id
            WHERE s.business_id = :bid AND s.branch_id = :brid
            ORDER BY s.sold_at DESC
            LIMIT 5
        ");
        $recStmt->execute([':bid' => $businessId, ':brid' => $branchId]);

        return JsonResponder::success($response, [
            'kpis' => [
                'today_revenue'   => (float) $kpis['today_revenue'],
                'today_orders'    => (int) $kpis['today_orders'],
                'month_revenue'   => (float) $kpis['month_revenue'],
                'low_stock_count' => $lowStockCount,
                'expiring_count'  => $expiringCount,
                'catalog_count' => $catalogCount
            ],
            'daily_trend'  => $dailyTrend,
            'payment_mix'  => $payments,
            'recent_sales' => $recStmt->fetchAll(),
        ]);
    }
}
