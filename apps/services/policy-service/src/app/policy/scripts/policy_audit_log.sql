CREATE TABLE IF NOT EXISTS policy_audit_log (
    id SERIAL PRIMARY KEY,
    policy_id INT NULL,
    policy_configuration_id INT NULL,
    entity_type VARCHAR(100) NULL,
    entity_id INT NULL,
    action VARCHAR(100) NOT NULL,
    performed_by INT NULL,
    remarks TEXT NULL,
    metadata JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NULL
);

CREATE INDEX IF NOT EXISTS idx_policy_audit_log_policy_id ON policy_audit_log (policy_id);
CREATE INDEX IF NOT EXISTS idx_policy_audit_log_policy_configuration_id ON policy_audit_log (policy_configuration_id);
CREATE INDEX IF NOT EXISTS idx_policy_audit_log_entity_type ON policy_audit_log (entity_type);
CREATE INDEX IF NOT EXISTS idx_policy_audit_log_entity_type_id ON policy_audit_log (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_policy_audit_log_action ON policy_audit_log (action);

ALTER TABLE policy_audit_log
    ADD CONSTRAINT fk_policy_audit_log_policy
        FOREIGN KEY (policy_id) REFERENCES policy (id) ON DELETE SET NULL;

ALTER TABLE policy_audit_log
    ADD CONSTRAINT fk_policy_audit_log_policy_configuration
        FOREIGN KEY (policy_configuration_id) REFERENCES policy_configuration (id) ON DELETE SET NULL;
