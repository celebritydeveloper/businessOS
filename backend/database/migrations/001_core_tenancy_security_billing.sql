-- ============================================================================
-- MODULE 1: Core Tenancy, Cybersecurity, Sessions, Audit Logs & 3-Tier Billing
-- ============================================================================

-- 1. Master Owner Accounts
CREATE TABLE IF NOT EXISTS `accounts` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `owner_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(191) NOT NULL UNIQUE,
    `phone` VARCHAR(30) NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `has_used_trial` TINYINT(1) NOT NULL DEFAULT 0,
    `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Subscription Plans (3 Tiers)
CREATE TABLE IF NOT EXISTS `plans` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `price_monthly` DECIMAL(12, 2) NOT NULL,
    `price_yearly` DECIMAL(12, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'NGN',
    `trial_hours` INT UNSIGNED NOT NULL DEFAULT 24,
    `limits_json` JSON NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `sort_order` TINYINT UNSIGNED NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Account Subscriptions
CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `account_id` CHAR(36) NOT NULL,
    `plan_id` CHAR(36) NOT NULL,
    `billing_cycle` ENUM('monthly', 'yearly') NOT NULL DEFAULT 'monthly',
    `status` ENUM('pending_payment', 'trialing', 'active', 'past_due', 'cancelled') NOT NULL DEFAULT 'pending_payment',
    `trial_ends_at` TIMESTAMP NULL,
    `current_period_start` TIMESTAMP NULL,
    `current_period_end` TIMESTAMP NULL,
    `grace_until` TIMESTAMP NULL,
    `gateway` ENUM('paystack', 'flutterwave') NULL,
    `gateway_subscription_code` VARCHAR(150) NULL,
    `last_payment_ref` VARCHAR(150) NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_sub_account` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_sub_plan` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Payment Transactions (Idempotent Webhook & Checkout Ledger)
CREATE TABLE IF NOT EXISTS `payment_transactions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `account_id` CHAR(36) NOT NULL,
    `subscription_id` CHAR(36) NOT NULL,
    `gateway` ENUM('paystack', 'flutterwave') NOT NULL,
    `reference` VARCHAR(150) NOT NULL UNIQUE,
    `gateway_tx_id` VARCHAR(150) NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `currency` CHAR(3) NOT NULL DEFAULT 'NGN',
    `status` ENUM('pending', 'success', 'failed') NOT NULL DEFAULT 'pending',
    `raw_payload_json` JSON NULL,
    `verified_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_pay_account` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_pay_sub` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Businesses (Operating Entities under an Owner Account)
CREATE TABLE IF NOT EXISTS `businesses` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `account_id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `industry_type` ENUM('retail', 'pharmacy', 'supermarket', 'laundry', 'restaurant', 'farm') NOT NULL,
    `tin_encrypted` TEXT NULL,
    `is_vat_registered` TINYINT(1) NOT NULL DEFAULT 0,
    `default_vat_rate` DECIMAL(5, 2) NOT NULL DEFAULT 7.50,
    `currency` CHAR(3) NOT NULL DEFAULT 'NGN',
    `settings_json` JSON NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_biz_account` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Branches (Physical Locations per Business)
CREATE TABLE IF NOT EXISTS `branches` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `business_id` CHAR(36) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `address` VARCHAR(255) NULL,
    `phone` VARCHAR(30) NULL,
    `receipt_footer` VARCHAR(255) NULL DEFAULT 'Thank you for your patronage!',
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_branch_biz` FOREIGN KEY (`business_id`) REFERENCES `businesses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Staff & Owner Users
CREATE TABLE IF NOT EXISTS `users` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `account_id` CHAR(36) NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(191) NULL UNIQUE,
    `phone` VARCHAR(30) NULL,
    `password_hash` VARCHAR(255) NULL,
    `pos_pin_hash` VARCHAR(255) NULL,
    `is_owner` TINYINT(1) NOT NULL DEFAULT 0,
    `two_factor_secret` TEXT NULL,
    `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `last_login_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_user_account` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. User Branch Roles
CREATE TABLE IF NOT EXISTS `user_branch_roles` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL,
    `branch_id` CHAR(36) NOT NULL,
    `role` ENUM('manager', 'cashier', 'pharmacist', 'inventory_clerk') NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uq_user_branch` (`user_id`, `branch_id`),
    CONSTRAINT `fk_ubr_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ubr_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Revocable Device Sessions (Refresh Token & Fingerprint Binding)
CREATE TABLE IF NOT EXISTS `user_sessions` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `user_id` CHAR(36) NOT NULL,
    `account_id` CHAR(36) NOT NULL,
    `refresh_token_hash` CHAR(64) NOT NULL UNIQUE,
    `device_id` VARCHAR(100) NOT NULL,
    `device_fingerprint_hash` CHAR(64) NOT NULL,
    `device_name` VARCHAR(150) NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(255) NULL,
    `is_revoked` TINYINT(1) NOT NULL DEFAULT 0,
    `expires_at` TIMESTAMP NOT NULL,
    `last_active_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_sessions_user` (`user_id`, `is_revoked`),
    CONSTRAINT `fk_session_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_session_account` FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Immutable Security & Operational Audit Trail
CREATE TABLE IF NOT EXISTS `activity_logs` (
    `id` CHAR(36) NOT NULL PRIMARY KEY,
    `account_id` CHAR(36) NOT NULL,
    `business_id` CHAR(36) NULL,
    `branch_id` CHAR(36) NULL,
    `user_id` CHAR(36) NULL,
    `device_id` VARCHAR(100) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity_type` VARCHAR(80) NULL,
    `entity_id` CHAR(36) NULL,
    `old_values_json` JSON NULL,
    `new_values_json` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `occurred_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_audit_account_time` (`account_id`, `occurred_at`),
    INDEX `idx_audit_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Anti-Brute-Force & Replay Nonce Guards
CREATE TABLE IF NOT EXISTS `security_rate_limits` (
    `rate_key` VARCHAR(191) NOT NULL PRIMARY KEY,
    `attempts` INT UNSIGNED NOT NULL DEFAULT 1,
    `window_starts_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `locked_until` TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `used_sync_nonces` (
    `nonce` VARCHAR(100) NOT NULL PRIMARY KEY,
    `account_id` CHAR(36) NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_nonce_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Seed the 3 Subscription Tiers (24-hour trial enabled)
INSERT IGNORE INTO `plans` (`id`, `name`, `slug`, `description`, `price_monthly`, `price_yearly`, `currency`, `trial_hours`, `limits_json`, `sort_order`) VALUES
(
    '11111111-1111-4111-8111-111111111101',
    'Starter',
    'starter',
    'For single-outlet small retail shops or pharmacies getting started.',
    10000.00,
    100000.00,
    'NGN',
    24,
    '{"max_businesses": 1, "max_branches": 1, "max_staff_users": 3, "max_catalog_items": 1000, "offline_sync_enabled": true, "batch_expiry_tracking": true, "realtime_updates": false, "advanced_reports": false}',
    1
),
(
    '11111111-1111-4111-8111-111111111102',
    'Growth',
    'growth',
    'For growing multi-branch pharmacies and retail stores needing deeper insights.',
    25000.00,
    250000.00,
    'NGN',
    24,
    '{"max_businesses": 2, "max_branches": 5, "max_staff_users": 15, "max_catalog_items": 10000, "offline_sync_enabled": true, "batch_expiry_tracking": true, "realtime_updates": true, "advanced_reports": true}',
    2
),
(
    '11111111-1111-4111-8111-111111111103',
    'Enterprise',
    'enterprise',
    'Unlimited scale across multiple businesses, industries, and branches.',
    60000.00,
    600000.00,
    'NGN',
    24,
    '{"max_businesses": -1, "max_branches": -1, "max_staff_users": -1, "max_catalog_items": -1, "offline_sync_enabled": true, "batch_expiry_tracking": true, "realtime_updates": true, "advanced_reports": true}',
    3
);