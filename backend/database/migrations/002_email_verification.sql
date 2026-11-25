ALTER TABLE `accounts`
    ADD COLUMN `email_verified_at` TIMESTAMP NULL AFTER `email`,
    ADD COLUMN `email_verification_code_hash` CHAR(64) NULL AFTER `email_verified_at`,
    ADD COLUMN `email_verification_expires_at` TIMESTAMP NULL AFTER `email_verification_code_hash`;
