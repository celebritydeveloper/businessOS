ALTER TABLE `businesses`
    ADD COLUMN `encrypted_tin` VARBINARY(255) NULL AFTER `is_vat_registered`;
