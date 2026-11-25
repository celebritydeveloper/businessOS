CREATE TABLE IF NOT EXISTS `catalog_items` (
    `id` CHAR(36) NOT NULL,
    `business_id` CHAR(36) NOT NULL,
    `category_id` CHAR(36) NULL,
    `item_type` ENUM('product', 'service') NOT NULL DEFAULT 'product',
    `name` VARCHAR(160) NOT NULL,
    `sku` VARCHAR(64) NULL,
    `barcode` VARCHAR(64) NULL,
    `unit_label` VARCHAR(32) NOT NULL DEFAULT 'Piece',
    `cost_price` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `selling_price` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `is_vat_exempt` TINYINT(1) NOT NULL DEFAULT 0,
    `track_batches` TINYINT(1) NOT NULL DEFAULT 0,
    `reorder_level` INT NOT NULL DEFAULT 5,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_catalog_business` (`business_id`, `is_active`),
    KEY `idx_catalog_barcode` (`business_id`, `barcode`),
    CONSTRAINT `fk_catalog_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_catalog_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `product_batches` (
    `id` CHAR(36) NOT NULL,
    `business_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `catalog_item_id` CHAR(36) NOT NULL,
    `batch_number` VARCHAR(80) NOT NULL,
    `expiry_date` DATE NOT NULL,
    `cost_price` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `quantity_remaining` DECIMAL(14, 3) NOT NULL DEFAULT 0.000,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_branch_item_batch` (`branch_id`, `catalog_item_id`, `batch_number`),
    KEY `idx_batch_fefo` (`branch_id`, `catalog_item_id`, `expiry_date`),
    CONSTRAINT `fk_batch_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_batch_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_batch_item` FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `branch_inventory` (
    `id` CHAR(36) NOT NULL,
    `business_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `catalog_item_id` CHAR(36) NOT NULL,
    `quantity_on_hand` DECIMAL(14, 3) NOT NULL DEFAULT 0.000,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_branch_inventory` (`branch_id`, `catalog_item_id`),
    CONSTRAINT `fk_binv_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_binv_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_binv_item` FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `inventory_ledger` (
    `id` CHAR(36) NOT NULL,
    `business_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `catalog_item_id` CHAR(36) NOT NULL,
    `batch_id` CHAR(36) NULL,
    `movement_type` ENUM('opening_stock', 'restock', 'sale', 'adjustment', 'return', 'expired_writeoff', 'transfer_out', 'transfer_in') NOT NULL,
    `quantity_delta` DECIMAL(14, 3) NOT NULL,
    `unit_cost` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `reference_type` VARCHAR(40) NULL,
    `reference_id` CHAR(36) NULL,
    `idempotency_key` VARCHAR(100) NULL,
    `actor_user_id` CHAR(36) NULL,
    `notes` VARCHAR(255) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_inventory_idempotency` (`idempotency_key`),
    KEY `idx_ledger_branch_item` (`branch_id`, `catalog_item_id`, `created_at`),
    CONSTRAINT `fk_ledger_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ledger_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ledger_item` FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ledger_batch` FOREIGN KEY (`batch_id`) REFERENCES `product_batches` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_transfers` (
    `id` CHAR(36) NOT NULL,
    `business_id` CHAR(36) NOT NULL,
    `from_branch_id` CHAR(36) NOT NULL,
    `to_branch_id` CHAR(36) NOT NULL,
    `status` ENUM('in_transit', 'received', 'cancelled') NOT NULL DEFAULT 'in_transit',
    `notes` VARCHAR(255) NULL,
    `dispatched_by` CHAR(36) NOT NULL,
    `received_by` CHAR(36) NULL,
    `received_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_transfers_business` (`business_id`, `status`),
    CONSTRAINT `fk_transfer_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_transfer_from` FOREIGN KEY (`from_branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_transfer_to` FOREIGN KEY (`to_branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `stock_transfer_items` (
    `id` CHAR(36) NOT NULL,
    `transfer_id` CHAR(36) NOT NULL,
    `catalog_item_id` CHAR(36) NOT NULL,
    `batch_number` VARCHAR(80) NULL,
    `expiry_date` DATE NULL,
    `unit_cost` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `quantity` DECIMAL(14, 3) NOT NULL,
    PRIMARY KEY (`id`),
    CONSTRAINT `fk_titem_transfer` FOREIGN KEY (`transfer_id`) REFERENCES `stock_transfers` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_titem_item` FOREIGN KEY (`catalog_item_id`) REFERENCES `catalog_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
