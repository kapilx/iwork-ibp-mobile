ALTER TABLE policy_enrollment_employee
    ADD COLUMN IF NOT EXISTS employee_tpa_id VARCHAR(100);

ALTER TABLE policy_enrollment_dependent
    ADD COLUMN IF NOT EXISTS dependent_tpa_id VARCHAR(100);
