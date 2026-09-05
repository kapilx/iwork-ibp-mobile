CREATE TABLE IF NOT EXISTS policy_employee_claim_settlement (
    id SERIAL PRIMARY KEY,
    claim_id INT NOT NULL REFERENCES policy_employee_claim(id) ,
    source_file_upload_id INT NOT NULL REFERENCES file_upload(id),
    clm_sett_no VARCHAR(100),
    clm_sett_amt NUMERIC,
    clm_sett_date DATE,
    clm_sett_details TEXT,
    clm_dis_amt NUMERIC,
    clm_sett_chq_bnk VARCHAR(100),
    clm_sett_chq_dt DATE,
    clm_sett_chq_no VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_policy_employee_claim_settlement_claim_id
    ON policy_employee_claim_settlement (claim_id);
