CREATE TABLE IF NOT EXISTS `customers` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `business_id` CHAR(36) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `phone` VARCHAR(40) NULL,
    `email` VARCHAR(150) NULL,
    `address` VARCHAR(255) NULL,
    `credit_limit` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `credit_balance` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `total_spent` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `notes` VARCHAR(255) NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_cust_biz_name` (`business_id`, `full_name`),
    INDEX `idx_cust_biz_phone` (`business_id`, `phone`),
    CONSTRAINT `fk_cust_business` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `suppliers` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `business_id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `contact_person` VARCHAR(120) NULL,
    `phone` VARCHAR(40) NULL,
    `email` VARCHAR(150) NULL,
    `address` VARCHAR(255) NULL,
    `bank_details` VARCHAR(255) NULL,
    `payable_balance` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `total_purchased` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `notes` VARCHAR(255) NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_supp_biz_name` (`business_id`, `name`),
    CONSTRAINT `fk_supp_business` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `contact_transactions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `business_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NULL,
    `contact_type` ENUM('customer', 'supplier') NOT NULL,
    `contact_id` CHAR(36) NOT NULL,
    `tx_type` ENUM('credit_sale', 'customer_payment', 'supplier_bill', 'supplier_payment') NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `payment_account_code` VARCHAR(10) NULL,
    `reference_id` CHAR(36) NULL,
    `notes` VARCHAR(255) NULL,
    `actor_user_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_ctx_contact` (`business_id`, `contact_type`, `contact_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `sales`
    ADD COLUMN `customer_id` CHAR(36) NULL AFTER `cashier_user_id`,
    ADD INDEX `idx_sales_customer` (`customer_id`);

ALTER TABLE `sale_payments`
    MODIFY COLUMN `method` ENUM('cash', 'pos_card', 'transfer', 'credit') NOT NULL DEFAULT 'cash';

INSERT IGNORE INTO `chart_of_accounts` (`id`, `business_id`, `code`, `name`, `account_type`, `normal_balance`, `description`, `is_system`)
SELECT UUID(), `id`, '1100', 'Accounts Receivable (Customer Credit)', 'asset', 'debit', 'Unpaid customer credit sales balances', 1
FROM `businesses`;
