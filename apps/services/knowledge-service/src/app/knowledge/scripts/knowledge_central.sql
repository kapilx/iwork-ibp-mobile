CREATE TABLE knowledge_central (
    id SERIAL PRIMARY KEY,
    document_id INT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    title VARCHAR(255) NOT NULL,
    doc_type_id INT NOT NULL,
    status_id INT NOT NULL,
    category_id INT NOT NULL,
    relative_path VARCHAR(255),
    extension VARCHAR(20),
    summary TEXT,
    tags TEXT[],
    access_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    deleted_at TIMESTAMPTZ,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,
    CONSTRAINT uq_kc_doc_version UNIQUE (document_id, version),
    CONSTRAINT fk_kc_doc_type FOREIGN KEY (doc_type_id) REFERENCES lookup_data(id),
    CONSTRAINT fk_kc_status FOREIGN KEY (status_id) REFERENCES lookup_data(id),
    CONSTRAINT fk_kc_category FOREIGN KEY (category_id) REFERENCES lookup_data(id)
);

CREATE SEQUENCE knowledge_central_document_id_seq;
ALTER TABLE knowledge_central ALTER COLUMN document_id SET DEFAULT nextval('knowledge_central_document_id_seq');

CREATE INDEX idx_kc_doc_status ON knowledge_central(document_id, status_id);

INSERT INTO lookup_data (lookup_key, lookup_name, value_key, value, description, created_at, updated_at, created_by, updated_by) VALUES
  ('KNOWLEDGE_DOC_DOCUMENT', 'KNOWLEDGE_DOC_TYPE', 'DOCUMENT', 'Document', 'Document file', NOW(), NOW(), 'Admin', 'Admin'),
  ('KNOWLEDGE_DOC_AUDIO', 'KNOWLEDGE_DOC_TYPE', 'AUDIO', 'Audio', 'Audio file', NOW(), NOW(), 'Admin', 'Admin'),
  ('KNOWLEDGE_DOC_VIDEO', 'KNOWLEDGE_DOC_TYPE', 'VIDEO', 'Video', 'Video file', NOW(), NOW(), 'Admin', 'Admin'),
  ('KNOWLEDGE_DOC_IMAGE', 'KNOWLEDGE_DOC_TYPE', 'IMAGE', 'Image', 'Image file', NOW(), NOW(), 'Admin', 'Admin'),
  ('KNOWLEDGE_DOC_STREAM_URL', 'KNOWLEDGE_DOC_TYPE', 'STREAM_URL', 'Stream URL', 'Streaming link', NOW(), NOW(), 'Admin', 'Admin'),
  ('KNOWLEDGE_DOC_DOCUMENT_URL', 'KNOWLEDGE_DOC_TYPE', 'DOCUMENT_URL', 'Document URL', 'Document link', NOW(), NOW(), 'Admin', 'Admin'),
  ('KNOWLEDGE_DOC_WEBSITE_URL', 'KNOWLEDGE_DOC_TYPE', 'WEBSITE_URL', 'Website URL', 'Website link', NOW(), NOW(), 'Admin', 'Admin');

INSERT INTO lookup_data (lookup_key, lookup_name, value_key, value, description, created_at, updated_at, created_by, updated_by) VALUES
  ('KNOWLEDGE_STATUS_ACTIVE', 'KNOWLEDGE_STATUS', 'ACTIVE', 'Active', 'Active knowledge entry', NOW(), NOW(), 'Admin', 'Admin'),
  ('KNOWLEDGE_STATUS_DELETED', 'KNOWLEDGE_STATUS', 'DELETED', 'Deleted', 'Deleted knowledge entry', NOW(), NOW(), 'Admin', 'Admin');

INSERT INTO lookup_data (lookup_key, lookup_name, value_key, value, description, created_at, updated_at, created_by, updated_by) VALUES
  ('KNOWLEDGE_CATEGORY_SALES', 'KNOWLEDGE_CATEGORY', 'SALES_COLLATERAL', 'Sales Collateral', 'Sales collateral documents', NOW(), NOW(), 'Admin', 'Admin'),
  ('KNOWLEDGE_CATEGORY_PRESENTATIONS', 'KNOWLEDGE_CATEGORY', 'PRESENTATIONS', 'Presentations', 'Presentation materials', NOW(), NOW(), 'Admin', 'Admin'),
  ('KNOWLEDGE_CATEGORY_BROCHURES', 'KNOWLEDGE_CATEGORY', 'BROCHURES', 'Brochures', 'Brochure materials', NOW(), NOW(), 'Admin', 'Admin'),
  ('KNOWLEDGE_CATEGORY_TRAINING', 'KNOWLEDGE_CATEGORY', 'TRAINING', 'Training Material', 'Training resources', NOW(), NOW(), 'Admin', 'Admin'),
  ('KNOWLEDGE_CATEGORY_LEGAL', 'KNOWLEDGE_CATEGORY', 'LEGAL', 'Legal Docs', 'Legal documents', NOW(), NOW(), 'Admin', 'Admin'),
  ('KNOWLEDGE_CATEGORY_FAQ', 'KNOWLEDGE_CATEGORY', 'FAQ', 'FAQs', 'Frequently asked questions', NOW(), NOW(), 'Admin', 'Admin');
