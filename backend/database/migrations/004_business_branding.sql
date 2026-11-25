CREATE TABLE IF NOT EXISTS `business_branding` (
    `id` CHAR(36) NOT NULL,
    `business_id` CHAR(36) NOT NULL,
    `app_name` VARCHAR(100) NULL,
    `logo_url` VARCHAR(255) NULL,
    `favicon_url` VARCHAR(255) NULL,
    `primary_color` CHAR(7) NOT NULL DEFAULT '#0F4EF0',
    `secondary_color` CHAR(7) NOT NULL DEFAULT '#0F172A',
    `support_email` VARCHAR(160) NULL,
    `support_phone` VARCHAR(30) NULL,
    `website` VARCHAR(255) NULL,
    `custom_domain` VARCHAR(190) NULL,
    `domain_verification_token` VARCHAR(64) NULL,
    `domain_verified_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_branding_business` (`business_id`),
    UNIQUE KEY `uq_branding_custom_domain` (`custom_domain`),
    CONSTRAINT `fk_branding_business` FOREIGN KEY (`business_id`) REFERENCES `businesses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

UPDATE `plans`
SET `limits_json` = JSON_SET(`limits_json`, '$.show_powered_by', true, '$.custom_domain_enabled', false)
WHERE `slug` IN ('starter', 'growth');

UPDATE `plans`
SET `limits_json` = JSON_SET(`limits_json`, '$.show_powered_by', false, '$.custom_domain_enabled', true)
WHERE `slug` = 'enterprise';
