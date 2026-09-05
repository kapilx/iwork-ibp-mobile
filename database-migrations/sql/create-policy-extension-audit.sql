-- Policy Extension Audit table
-- Tracks all policy duration extension and revert events for non-grouped policies

CREATE TABLE policy_extension_audit (
  id                      BIGSERIAL     PRIMARY KEY,
  policy_id               BIGINT        NOT NULL,
  insurer_policy_number   VARCHAR       NOT NULL,
  endorsement_type        VARCHAR       NOT NULL,  -- 'Extension' | 'Revert'
  previous_policy_to_date DATE          NOT NULL,
  extension_date          DATE          NOT NULL,
  remarks                 TEXT,
  source_file_upload_id   BIGINT        NOT NULL,
  processed_by            BIGINT        NOT NULL,
  is_reverted             BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMP     NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_pea_policy
    FOREIGN KEY (policy_id) REFERENCES policy(id) ON DELETE CASCADE,
  CONSTRAINT fk_pea_file_upload
    FOREIGN KEY (source_file_upload_id) REFERENCES file_uploads(id),
  CONSTRAINT fk_pea_user
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

CREATE INDEX idx_pea_policy_id   ON policy_extension_audit(policy_id);
CREATE INDEX idx_pea_created_at  ON policy_extension_audit(created_at DESC);
