CREATE TABLE policy_enrollment_upload_summary (
    id SERIAL PRIMARY KEY,
    document_processing_file_id INT NOT NULL REFERENCES document_processing_file(id) ON DELETE CASCADE,
    policy_id INT NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    source_file_upload_id INT NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    error_file_upload_id INT REFERENCES file_uploads(id) ON DELETE SET NULL,
    success_count INT NOT NULL,
    error_count INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
