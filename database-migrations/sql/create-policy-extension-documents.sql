-- Migration: create_policy_extension_documents
-- Creates the table that tracks documents uploaded against a policy extension endorsement.

CREATE TABLE IF NOT EXISTS policy_extension_documents (
  id              SERIAL PRIMARY KEY,
  policy_id       INT          NOT NULL,
  endorsement_id  INT          NOT NULL,
  document_id     INT          NOT NULL,
  status          VARCHAR(20)  NOT NULL DEFAULT 'active',
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  created_by      INT          NOT NULL,
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_by      INT,
  deleted_at      TIMESTAMPTZ,
  deleted_by      INT,

  CONSTRAINT fk_ped_policy      FOREIGN KEY (policy_id)      REFERENCES policy(id)        ON DELETE CASCADE,
  CONSTRAINT fk_ped_endorsement FOREIGN KEY (endorsement_id) REFERENCES policy_asset_endorsement(id),
  CONSTRAINT fk_ped_document    FOREIGN KEY (document_id)    REFERENCES file_uploads(id)
);

CREATE INDEX IF NOT EXISTS idx_ped_policy_id      ON policy_extension_documents (policy_id);
CREATE INDEX IF NOT EXISTS idx_ped_endorsement_id ON policy_extension_documents (endorsement_id);
