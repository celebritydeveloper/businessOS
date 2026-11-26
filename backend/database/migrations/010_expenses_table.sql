CREATE TABLE IF NOT EXISTS `expenses` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `business_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `expense_account_code` VARCHAR(20) NOT NULL,
    `payment_account_code` VARCHAR(20) NOT NULL DEFAULT '1000',
    `vendor_name` VARCHAR(150) NULL,
    `description` VARCHAR(255) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `expense_date` DATE NOT NULL,
    `recorded_by_user_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_expenses_biz_date` (`business_id`, `expense_date`),
    CONSTRAINT `fk_exp_business` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_exp_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
