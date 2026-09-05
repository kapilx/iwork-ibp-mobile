ALTER TABLE policy_enrollment_employee
    DROP COLUMN IF EXISTS policy_id,
    DROP COLUMN IF EXISTS enrollment_start_date,
    DROP COLUMN IF EXISTS enrollment_end_date;
