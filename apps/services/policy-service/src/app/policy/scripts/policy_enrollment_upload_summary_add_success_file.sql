ALTER TABLE policy_enrollment_upload_summary
    ADD COLUMN success_file_upload_id INT REFERENCES file_uploads(id) ON DELETE SET NULL;
