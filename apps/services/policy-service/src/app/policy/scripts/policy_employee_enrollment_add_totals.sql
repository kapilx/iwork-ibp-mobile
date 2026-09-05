ALTER TABLE policy_employee_enrollment
    ADD COLUMN total_premium NUMERIC DEFAULT 0,
    ADD COLUMN total_company_pay NUMERIC DEFAULT 0,
    ADD COLUMN total_employee_pay NUMERIC DEFAULT 0;
