<?php

declare(strict_types=1);

namespace App\Core\Tenancy;

use PDO;
use Ramsey\Uuid\Uuid;

final class DefaultBusinessSeeder
{
    public function __construct(private PDO $pdo) {}

    public function seed(string $businessId, string $industryType, string $businessName = ''): void {
        $this->seedCategories($businessId, $industryType);
        $this->seedChartOfAccounts($businessId);
        $this->seedBranding($businessId, $businessName);
    }

    private function seedBranding(string $businessId, string $businessName): void {
        $stmt = $this->pdo->prepare("
            INSERT IGNORE INTO business_branding (id, business_id, app_name, primary_color, secondary_color)
            VALUES (:id, :bid, :name, '#0F4EF0', '#0F172A')
        ");
        $stmt->execute([
            ':id'   => Uuid::uuid4()->toString(),
            ':bid'  => $businessId,
            ':name' => $businessName !== '' ? $businessName : null,
        ]);
    }


    private function seedCategories(string $businessId, string $industryType): void  {
        $categories = $industryType === 'pharmacy'
            ? [
                'Prescription Drugs (Rx)',
                'Over-the-Counter (OTC)',
                'Antibiotics & Anti-Infectives',
                'Vitamins & Supplements',
                'First Aid & Medical Devices',
                'Mother & Baby Care',
            ]
            : [
                'General Merchandise',
                'Beverages & Drinks',
                'Groceries & Packaged Foods',
                'Personal Care & Toiletries',
                'Household & Cleaning',
                'Electronics & Accessories',
            ];

        $stmt = $this->pdo->prepare("
            INSERT IGNORE INTO categories (id, business_id, name, slug)
            VALUES (:id, :bid, :name, :slug)
        ");

        foreach ($categories as $name) {
            $slug = strtolower(trim((string) preg_replace('/[^a-zA-Z0-9]+/', '-', $name), '-'));
            $stmt->execute([
                ':id'   => Uuid::uuid4()->toString(),
                ':bid'  => $businessId,
                ':name' => $name,
                ':slug' => $slug,
            ]);
        }
    }

    private function seedChartOfAccounts(string $businessId): void {
        $accounts = [
            ['1000', 'Cash on Hand (Till)', 'asset', 'debit'],
            ['1010', 'Bank & POS Terminal Settlements', 'asset', 'debit'],
            ['1200', 'Inventory Asset', 'asset', 'debit'],
            ['2000', 'Accounts Payable (Suppliers)', 'liability', 'credit'],
            ['2100', 'Output VAT Payable (FIRS)', 'liability', 'credit'],
            ['3000', "Owner's Equity", 'equity', 'credit'],
            ['4000', 'Sales Revenue', 'revenue', 'credit'],
            ['4100', 'Sales Discounts & Returns', 'revenue', 'debit'],
            ['5000', 'Cost of Goods Sold (COGS)', 'expense', 'debit'],
            ['5100', 'Operating & Utility Expenses', 'expense', 'debit'],
        ];

        $stmt = $this->pdo->prepare("
            INSERT IGNORE INTO chart_of_accounts (id, business_id, code, name, account_type, normal_balance, is_system)
            VALUES (:id, :bid, :code, :name, :type, :bal, 1)
        ");

        foreach ($accounts as [$code, $name, $type, $balance]) {
            $stmt->execute([
                ':id'   => Uuid::uuid4()->toString(),
                ':bid'  => $businessId,
                ':code' => $code,
                ':name' => $name,
                ':type' => $type,
                ':bal'  => $balance,
            ]);
        }
    }
}
