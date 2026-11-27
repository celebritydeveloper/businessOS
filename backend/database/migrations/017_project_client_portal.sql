ALTER TABLE `creative_projects`
    ADD COLUMN `public_token` VARCHAR(64) NULL AFTER `id`,
    ADD UNIQUE INDEX `uq_cproj_public_token` (`public_token`);

UPDATE `creative_projects`
SET `public_token` = LOWER(CONCAT(HEX(RANDOM_BYTES(16)), HEX(RANDOM_BYTES(16))))
WHERE `public_token` IS NULL;
