<?php

declare(strict_types=1);
namespace App\Core\Tenancy;
use PDO;
use RuntimeException;

final class PlanQuotaService {
    public function __construct(private PDO $pdo) {}

    public function getActiveLimits(string $accountId): array {
        $stmt = $this->pdo->prepare("
            SELECT p.limits_json
            FROM subscriptions s
            INNER JOIN plans p ON p.id = s.plan_id
            WHERE s.account_id = :aid
            ORDER BY s.created_at DESC LIMIT 1
        ");
        $stmt->execute([':aid' => $accountId]);
        $json = $stmt->fetchColumn();

        if (!$json) {
            throw new RuntimeException('No active subscription plan found.');
        }

        return json_decode((string) $json, true) ?: [];
    }

    public function assertCanAddBusiness(string $accountId): void {
        $limits = $this->getActiveLimits($accountId);
        $max = (int) ($limits['max_businesses'] ?? 1);
        if ($max === -1) {
            return;
        }

        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM businesses WHERE account_id = :aid AND is_active = 1");
        $stmt->execute([':aid' => $accountId]);
        if ((int) $stmt->fetchColumn() >= $max) {
            throw new RuntimeException("Plan limit reached: maximum {$max} business(es) allowed.");
        }
    }

    public function assertCanAddBranch(string $accountId): void {
        $limits = $this->getActiveLimits($accountId);
        $max = (int) ($limits['max_branches'] ?? 1);
        if ($max === -1) {
            return;
        }

        $stmt = $this->pdo->prepare("
            SELECT COUNT(*) FROM branches br
            INNER JOIN businesses b ON b.id = br.business_id
            WHERE b.account_id = :aid AND br.is_active = 1
        ");
        $stmt->execute([':aid' => $accountId]);
        if ((int) $stmt->fetchColumn() >= $max) {
            throw new RuntimeException("Plan limit reached: maximum {$max} branch(es) allowed.");
        }
    }

    public function canAddCatalogItem(string $accountId, string $businessId): bool {
        $limits = $this->getActiveLimits($accountId);
        $max = (int) ($limits['max_catalog_items'] ?? 500);
        if ($max >= 999999) {
            return true;
        }

        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM catalog_items WHERE business_id = :bid AND is_active = 1");
        $stmt->execute([':bid' => $businessId]);
        return (int) $stmt->fetchColumn() < $max;
    }

    public function canAddStaffUser(string $accountId): bool {
        $limits = $this->getActiveLimits($accountId);
        $max = (int) ($limits['max_staff_users'] ?? 3);
        if ($max >= 999) {
            return true;
        }

        $stmt = $this->pdo->prepare("SELECT COUNT(*) FROM users WHERE account_id = :aid AND is_active = 1");
        $stmt->execute([':aid' => $accountId]);
        return (int) $stmt->fetchColumn() < $max;
    }
}
