ALTER TABLE policy_enrollment_employee
    ADD COLUMN user_id INT REFERENCES users(id) ON DELETE SET NULL,
    ADD COLUMN enrollment_addition_batch_id INT,
    ADD COLUMN enrollment_deletion_batch_id INT,
    ADD COLUMN endorsement_addition_batch_id INT,
    ADD COLUMN endorsement_deletion_batch_id INT;
