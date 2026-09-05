ALTER TABLE policy_enrollment_employee_policy_map
    ADD COLUMN IF NOT EXISTS claim_status VARCHAR(10);

ALTER TABLE policy_enrollment_dependent
    ADD COLUMN IF NOT EXISTS claim_status VARCHAR(10);
