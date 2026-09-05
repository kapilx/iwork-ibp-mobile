ALTER TABLE policy_employee_enrollment
    ADD COLUMN sum_insured NUMERIC DEFAULT 0,
    ADD COLUMN balance NUMERIC DEFAULT 0;
