ALTER TABLE policy_enrollment_upload_summary
    ADD COLUMN batch_id SERIAL UNIQUE;
