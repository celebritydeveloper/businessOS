CREATE TABLE IF NOT EXISTS `sales` (
    `id` CHAR(36) NOT NULL,
    `business_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `receipt_number` VARCHAR(40) NOT NULL,
    `client_sale_uuid` CHAR(36) NOT NULL,
    `customer_name` VARCHAR(120) NULL,
    `customer_phone` VARCHAR(30) NULL,
    `subtotal` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `discount_amount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `vat_amount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `grand_total` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `amount_paid` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `change_due` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `cashier_user_id` CHAR(36) NULL,
    `sold_at` DATETIME NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_sale_client_uuid` (`client_sale_uuid`),
    UNIQUE KEY `uq_sale_receipt` (`business_id`, `receipt_number`),
    KEY `idx_sales_branch_date` (`branch_id`, `sold_at`),
    CONSTRAINT `fk_sales_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sales_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sale_items` (
    `id` CHAR(36) NOT NULL,
    `sale_id` CHAR(36) NOT NULL,
    `catalog_item_id` CHAR(36) NOT NULL,
    `item_name` VARCHAR(160) NOT NULL,
    `unit_price` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `cost_price` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `quantity` DECIMAL(14, 3) NOT NULL DEFAULT 1.000,
    `vat_rate` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
    `vat_amount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `line_total` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_sitems_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sitems_item` FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sale_payments` (
    `id` CHAR(36) NOT NULL,
    `sale_id` CHAR(36) NOT NULL,
    `method` ENUM('cash', 'pos_card', 'transfer') NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `reference` VARCHAR(100) NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_spay_sale` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `journal_entries` (
    `id` CHAR(36) NOT NULL,
    `business_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NULL,
    `reference_type` VARCHAR(40) NOT NULL,
    `reference_id` CHAR(36) NOT NULL,
    `memo` VARCHAR(255) NOT NULL,
    `posted_at` DATETIME NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_journal_business` (`business_id`, `posted_at`),
    CONSTRAINT `fk_journal_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `journal_lines` (
    `id` CHAR(36) NOT NULL,
    `journal_entry_id` CHAR(36) NOT NULL,
    `account_code` VARCHAR(20) NOT NULL,
    `debit` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `credit` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_jlines_entry` FOREIGN KEY (`journal_entry_id`) REFERENCES `journal_entries` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
