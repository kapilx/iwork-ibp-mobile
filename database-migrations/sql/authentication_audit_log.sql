-- Create authentication_audit_log table
-- Immutable audit log for ALL authentication attempts (success and failure)
-- Supports forensic analysis, compliance, and attack detection

CREATE TABLE IF NOT EXISTS authentication_audit_log (
    id SERIAL PRIMARY KEY,
    identifier VARCHAR(255) NOT NULL,
    user_id INTEGER,
    auth_endpoint VARCHAR(255) NOT NULL,
    source_ip VARCHAR(45) NOT NULL,
    user_agent VARCHAR(500),
    failure_category VARCHAR(50), -- 'SUCCESS' for successful login, or failure reason
    feature_context VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by INTEGER
);
