CREATE TABLE IF NOT EXISTS mstr_service_policy_template_fields (
    id SERIAL PRIMARY KEY,
    field_name VARCHAR(255) NOT NULL,
    field_type VARCHAR(50) NOT NULL,
    claim_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO mstr_service_policy_template_fields (
    field_name,
    field_type,
    claim_type,
    entity_type,
    is_active
)
VALUES
    ('Corporate / Company Name', 'STRING', 'GMC', 'claims', true),
    ('Policy Type', 'STRING', 'GMC', 'claims', true),
    ('Policy Number', 'STRING', 'GMC', 'claims', true),
    ('Policy Start Date', 'DATE', 'GMC', 'claims', true),
    ('Policy End Date', 'DATE', 'GMC', 'claims', true),
    ('Patient TPA ID', 'STRING', 'GMC', 'claims', true),
    ('Claimed Amount', 'NUMBER', 'GMC', 'claims', true),
    ('Settled Amount', 'NUMBER', 'GMC', 'claims', true),
    ('Total Available Balance', 'NUMBER', 'GMC', 'claims', true),
    ('Claim Settled Date', 'DATE', 'GMC', 'claims', true),
    ('Total Sum Insured', 'NUMBER', 'GMC', 'claims', true),
    ('Claim Number', 'STRING', 'GMC', 'claims', true),
    ('Claim Type', 'STRING', 'GMC', 'claims', true),
    ('Employee Name', 'STRING', 'GMC', 'claims', true),
    ('Employee ID', 'STRING', 'GMC', 'claims', true),
    ('Employee TPA Id', 'STRING', 'GMC', 'claims', true),
    ('Patient Name', 'STRING', 'GMC', 'claims', true),
    ('Patient Relation', 'STRING', 'GMC', 'claims', true),
    ('Claim Requested Date', 'DATE', 'GMC', 'claims', true),
    ('Status', 'STRING', 'GMC', 'claims', true);
