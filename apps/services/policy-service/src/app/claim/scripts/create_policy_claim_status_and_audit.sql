CREATE TABLE IF NOT EXISTS policy_claim_status (
  id SERIAL PRIMARY KEY,
  status VARCHAR(50) NOT NULL UNIQUE,
  iirm_status VARCHAR(50) NOT NULL,
  created_by INT NOT NULL DEFAULT 0,
  updated_by INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS policy_claim_audit (
  id SERIAL PRIMARY KEY,
  policy_claim_id INT NOT NULL REFERENCES policy_claim(id) ON DELETE CASCADE,
  policy_claim_status_id INT NOT NULL REFERENCES policy_claim_status(id) ON DELETE RESTRICT,
  user_id INT NOT NULL,
  source_file_upload_id INT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_claim_audit_policy_claim_id
  ON policy_claim_audit(policy_claim_id);

CREATE INDEX IF NOT EXISTS idx_policy_claim_audit_status_id
  ON policy_claim_audit(policy_claim_status_id);

CREATE INDEX IF NOT EXISTS idx_policy_claim_audit_user_id
  ON policy_claim_audit(user_id);

INSERT INTO policy_claim_status (status, iirm_status, created_by, updated_by)
VALUES ('PENDING', 'Pending', 0, 0),
       ('SETTLED', 'Settled', 0, 0)
ON CONFLICT (status) DO NOTHING;
