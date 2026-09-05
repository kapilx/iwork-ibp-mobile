ALTER TABLE policy_enrollment_employee_policy_map
    ADD COLUMN enrollment_addition_batch_id INT,
    ADD COLUMN enrollment_deletion_batch_id INT,
    ADD COLUMN effective_date DATE,
    ADD COLUMN deleted_at TIMESTAMPTZ;
