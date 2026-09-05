CREATE TABLE document_processing_file (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    document_id INT NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    process_status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    created_by INT NOT NULL DEFAULT 0,
    updated_by INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dpf_entity_status ON document_processing_file(entity_type, entity_id, process_status);
