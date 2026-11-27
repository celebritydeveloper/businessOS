CREATE TABLE IF NOT EXISTS `creative_projects` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `business_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `customer_id` CHAR(36) NULL,
    `title` VARCHAR(180) NOT NULL,
    `project_type` ENUM('fixed_project', 'monthly_retainer') NOT NULL DEFAULT 'fixed_project',
    `stage` ENUM('brief', 'in_progress', 'client_review', 'revisions', 'delivered') NOT NULL DEFAULT 'brief',
    `contract_amount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `amount_billed` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `amount_paid` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `direct_cost` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `revisions_included` INT NOT NULL DEFAULT 3,
    `revisions_used` INT NOT NULL DEFAULT 0,
    `total_hours_logged` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `due_date` DATE NULL,
    `billing_cycle_label` VARCHAR(60) NULL,
    `notes` TEXT NULL,
    `created_by_user_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_cproj_biz_branch` (`business_id`, `branch_id`, `stage`),
    CONSTRAINT `fk_cproj_business` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_cproj_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `creative_project_logs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `project_id` CHAR(36) NOT NULL,
    `log_type` ENUM('deliverable', 'time_log', 'expense', 'revision', 'retainer_renewal', 'payment') NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `hours_spent` DECIMAL(8, 2) NOT NULL DEFAULT 0.00,
    `cost_amount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `is_completed` TINYINT(1) NOT NULL DEFAULT 0,
    `actor_user_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_cplog_project` (`project_id`, `created_at`),
    CONSTRAINT `fk_cplog_project` FOREIGN KEY (`project_id`) REFERENCES `creative_projects`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
