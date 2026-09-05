CREATE TABLE IF NOT EXISTS policy_employee_claim (
    id SERIAL PRIMARY KEY,
    policy_id INT NOT NULL REFERENCES policy(id),
    employee_id INT NOT NULL REFERENCES policy_enrollment_employee(id),
    employee_tpa_id VARCHAR(100) NOT NULL,
    claim_insured_id VARCHAR(100),
    dependent_id INT REFERENCES policy_enrollment_dependent(id) ON DELETE SET NULL,
    clm_hospital VARCHAR(255),
    clm_doa DATE,
    clm_dod DATE,
    claim_dt DATE,
    clm_type VARCHAR(50),
    claim_amount NUMERIC,
    claim_description TEXT,
    claim_status VARCHAR(50),
    clm_pre_auth_id VARCHAR(100),
    claim_checklist TEXT,
    clm_bill_details TEXT,
    clm_allowed_amt NUMERIC,
    clm_pre_auth_date DATE,
    clm_pre_auth_amt NUMERIC,
    clm_allowed_id VARCHAR(100),
    claim_checklist_count INT,
    user_id VARCHAR(100),
    source_file_upload_id INT NOT NULL REFERENCES file_upload(id),
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_employee_claim_employee_policy
    ON policy_employee_claim (employee_id, policy_id);
