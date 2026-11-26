ALTER TABLE `users`
    ADD COLUMN `invite_token_hash` CHAR(64) NULL AFTER `pos_pin_hash`,
    ADD COLUMN `invite_expires_at` TIMESTAMP NULL AFTER `invite_token_hash`;
