ALTER TABLE `businesses`
    MODIFY COLUMN `industry_type` VARCHAR(40) NOT NULL DEFAULT 'retail';

UPDATE `businesses`
SET `industry_type` = 'agriculture'
WHERE `industry_type` = 'farm';

CREATE TABLE IF NOT EXISTS `farm_cycles` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `business_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `cycle_type` ENUM('livestock', 'crop') NOT NULL DEFAULT 'livestock',
    `name` VARCHAR(150) NOT NULL,
    `species_or_crop` VARCHAR(100) NOT NULL,
    `initial_quantity` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `current_quantity` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `unit_label` VARCHAR(40) NOT NULL DEFAULT 'Birds',
    `initial_cost` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `accumulated_cost` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `start_date` DATE NOT NULL,
    `expected_harvest_date` DATE NOT NULL,
    `actual_harvest_date` DATE NULL,
    `status` ENUM('active', 'harvested', 'closed') NOT NULL DEFAULT 'active',
    `notes` TEXT NULL,
    `created_by_user_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_fc_biz_branch` (`business_id`, `branch_id`, `status`),
    CONSTRAINT `fk_fc_business` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fc_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `farm_cycle_logs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `cycle_id` CHAR(36) NOT NULL,
    `log_type` ENUM('milestone', 'feed_input', 'mortality', 'vaccination', 'harvest') NOT NULL,
    `title` VARCHAR(180) NOT NULL,
    `catalog_item_id` CHAR(36) NULL,
    `quantity` DECIMAL(14, 3) NOT NULL DEFAULT 0.000,
    `cost_amount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `log_date` DATE NOT NULL,
    `notes` VARCHAR(255) NULL,
    `actor_user_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_fcl_cycle_date` (`cycle_id`, `log_date`),
    CONSTRAINT `fk_fcl_cycle` FOREIGN KEY (`cycle_id`) REFERENCES `farm_cycles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
