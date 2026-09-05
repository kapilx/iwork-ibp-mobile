ALTER TABLE endorsement
    ADD COLUMN IF NOT EXISTS tpa_document_id INT,
    ADD COLUMN IF NOT EXISTS tpa_processed_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS tpa_acknowledged_date TIMESTAMPTZ;
