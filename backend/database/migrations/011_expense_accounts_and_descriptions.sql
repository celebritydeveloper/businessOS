ALTER TABLE `chart_of_accounts`
    ADD COLUMN `description` VARCHAR(255) NULL AFTER `name`;

UPDATE `chart_of_accounts`
SET `description` = 'Direct cost of inventory items sold through POS'
WHERE `code` = '5000';

UPDATE `chart_of_accounts`
SET `description` = 'Shop/office rent, PHCN/NEPA prepaid electricity, water, waste disposal'
WHERE `code` = '5100';

INSERT IGNORE INTO `chart_of_accounts` (`id`, `business_id`, `code`, `name`, `description`, `account_type`, `is_system`)
SELECT UUID(), `id`, '6000', 'Staff Salaries & Wages', 'Monthly staff salaries, shift allowances, casual labor', 'expense', 1
FROM `businesses`;

INSERT IGNORE INTO `chart_of_accounts` (`id`, `business_id`, `code`, `name`, `description`, `account_type`, `is_system`)
SELECT UUID(), `id`, '6100', 'Fuel, Generator & Logistics', 'PMS/Diesel for generator, delivery riders, waybill & transport', 'expense', 1
FROM `businesses`;

INSERT IGNORE INTO `chart_of_accounts` (`id`, `business_id`, `code`, `name`, `description`, `account_type`, `is_system`)
SELECT UUID(), `id`, '6200', 'General Operating Expenses', 'Internet/data, airtime, POS paper rolls, cleaning supplies, repairs', 'expense', 1
FROM `businesses`;

INSERT IGNORE INTO `chart_of_accounts` (`id`, `business_id`, `code`, `name`, `description`, `account_type`, `is_system`)
SELECT UUID(), `id`, '6300', 'Inventory Shrinkage & Write-Offs', 'Damaged, expired, or lost stock adjustments', 'expense', 1
FROM `businesses`;
