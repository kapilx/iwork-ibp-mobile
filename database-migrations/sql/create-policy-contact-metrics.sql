-- Creates policy_contact_metrics (mirrors TypeORM migration file)
CREATE TABLE IF NOT EXISTS policy_contact_metrics (
  id SERIAL PRIMARY KEY,
  policy_id INT,
  party_type VARCHAR(50),
  contact_level VARCHAR(20),
  is_primary BOOLEAN,
  contact_id INT,
  tpa_id INT NULL,
  insurer_id INT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by INT NOT NULL,
  updated_by INT NOT NULL
);

ALTER TABLE policy_contact_metrics
  ADD CONSTRAINT fk_policy_contact_metrics_policy
    FOREIGN KEY (policy_id) REFERENCES policy (id);

ALTER TABLE policy_contact_metrics
  ADD CONSTRAINT fk_policy_contact_metrics_contact
    FOREIGN KEY (contact_id) REFERENCES contact (id);
ALTER TABLE policy_contact_metrics
  ADD CONSTRAINT fk_policy_contact_metrics_tpa
    FOREIGN KEY (tpa_id) REFERENCES tpa (id);

ALTER TABLE policy_contact_metrics
  ADD CONSTRAINT fk_policy_contact_metrics_insurer
    FOREIGN KEY (insurer_id) REFERENCES insurer (id);
