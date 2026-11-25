ALTER TABLE `plans`
    ADD COLUMN `paystack_monthly_plan_code` VARCHAR(100) NULL AFTER `price_yearly`,
    ADD COLUMN `paystack_yearly_plan_code` VARCHAR(100) NULL AFTER `paystack_monthly_plan_code`,
    ADD COLUMN `flutterwave_monthly_plan_id` VARCHAR(100) NULL AFTER `paystack_yearly_plan_code`,
    ADD COLUMN `flutterwave_yearly_plan_id` VARCHAR(100) NULL AFTER `flutterwave_monthly_plan_id`;
