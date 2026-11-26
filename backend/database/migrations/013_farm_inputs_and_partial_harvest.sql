CREATE TABLE IF NOT EXISTS `farm_inputs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `business_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `category` ENUM('feed', 'seed', 'fertilizer', 'vaccine_drug', 'other') NOT NULL DEFAULT 'feed',
    `unit_label` VARCHAR(40) NOT NULL DEFAULT 'Bags',
    `quantity_on_hand` DECIMAL(14, 3) NOT NULL DEFAULT 0.000,
    `reorder_level` DECIMAL(14, 3) NOT NULL DEFAULT 5.000,
    `unit_cost` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_fi_biz_branch` (`business_id`, `branch_id`),
    CONSTRAINT `fk_fi_business` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fi_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `farm_cycle_logs`
    MODIFY COLUMN `log_type` ENUM('milestone', 'feed_input', 'mortality', 'vaccination', 'partial_harvest', 'harvest') NOT NULL,
    ADD COLUMN `farm_input_id` CHAR(36) NULL AFTER `catalog_item_id`;
