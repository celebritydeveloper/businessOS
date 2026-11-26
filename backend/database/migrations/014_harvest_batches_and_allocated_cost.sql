ALTER TABLE `farm_cycles`
    ADD COLUMN `allocated_cost` DECIMAL(14, 2) NOT NULL DEFAULT 0.00 AFTER `accumulated_cost`;
