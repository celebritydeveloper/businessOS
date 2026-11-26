CREATE TABLE IF NOT EXISTS `business_roles` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `business_id` CHAR(36) NOT NULL,
    `name` VARCHAR(80) NOT NULL,
    `slug` VARCHAR(80) NOT NULL,
    `description` VARCHAR(255) NULL,
    `permissions_json` JSON NOT NULL,
    `is_system` TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_business_role_slug` (`business_id`, `slug`),
    CONSTRAINT `fk_broles_business` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `user_branch_roles`
    MODIFY COLUMN `role` VARCHAR(80) NOT NULL DEFAULT 'cashier',
    ADD COLUMN `role_id` CHAR(36) NULL AFTER `branch_id`,
    ADD CONSTRAINT `fk_ubr_role` FOREIGN KEY (`role_id`) REFERENCES `business_roles`(`id`) ON DELETE SET NULL;

-- Backfill default roles for all existing businesses
INSERT IGNORE INTO `business_roles` (`id`, `business_id`, `name`, `slug`, `description`, `permissions_json`, `is_system`)
SELECT UUID(), `id`, 'Branch Manager', 'manager', 'Full branch operations, POS, stock, transfers & audit view',
       JSON_ARRAY('pos.sell', 'sales.view', 'catalog.manage', 'inventory.restock', 'transfers.manage', 'batches.manage', 'staff.manage', 'audit.view'), 1
FROM `businesses`;

INSERT IGNORE INTO `business_roles` (`id`, `business_id`, `name`, `slug`, `description`, `permissions_json`, `is_system`)
SELECT UUID(), `id`, 'POS Cashier', 'cashier', 'POS checkout terminal and receipt history',
       JSON_ARRAY('pos.sell', 'sales.view'), 1
FROM `businesses`;

INSERT IGNORE INTO `business_roles` (`id`, `business_id`, `name`, `slug`, `description`, `permissions_json`, `is_system`)
SELECT UUID(), `id`, 'Inventory Clerk', 'inventory_clerk', 'Catalog management, supplier restocks & branch stock transfers',
       JSON_ARRAY('catalog.manage', 'inventory.restock', 'transfers.manage'), 1
FROM `businesses`;

INSERT IGNORE INTO `business_roles` (`id`, `business_id`, `name`, `slug`, `description`, `permissions_json`, `is_system`)
SELECT UUID(), `id`, 'Licensed Pharmacist', 'pharmacist', 'Dispensing POS, FEFO batch & expiry control, and drug intake',
       JSON_ARRAY('pos.sell', 'sales.view', 'catalog.manage', 'inventory.restock', 'batches.manage'), 1
FROM `businesses`
WHERE `industry_type` = 'pharmacy';
