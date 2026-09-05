ALTER TABLE policy_enrollment_employee
    DROP COLUMN IF EXISTS endorsement_addition_batch_id,
    DROP COLUMN IF EXISTS endorsement_deletion_batch_id;

ALTER TABLE policy_enrollment_employee_policy_map
    ADD COLUMN endorsement_addition_batch_id INT,
    ADD COLUMN endorsement_deletion_batch_id INT,
    ADD COLUMN endorsement_status_key VARCHAR(50);

ALTER TABLE policy_enrollment_dependent
    ADD COLUMN endorsement_addition_batch_id INT,
    ADD COLUMN endorsement_deletion_batch_id INT,
    ADD COLUMN endorsement_status_key VARCHAR(50);
