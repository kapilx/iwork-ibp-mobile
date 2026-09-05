CREATE TABLE opportunity_final_negotiation (
    id SERIAL PRIMARY KEY,
    meeting_id INT REFERENCES meeting(id),
    policy_placed_type_id INT REFERENCES lookup_data(id),
    lead_insurer_id INT REFERENCES insurer(id),
    is_lead_insurer_pay_commission BOOLEAN,
    finalized_quote_id INT REFERENCES opportunity_quote_entry(id),
    is_quote_edited BOOLEAN,
    basic_premium NUMERIC,
    terrorism NUMERIC,
    tax NUMERIC,
    tax_value NUMERIC,
    net_premium NUMERIC,
    brokerage_percentage NUMERIC,
    insurer_remarks TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by INT,
    updated_by INT
);

CREATE TABLE opportunity_final_negotiation_sharing_detail (
    id SERIAL PRIMARY KEY,
    opportunity_final_negotiation_id INT REFERENCES opportunity_final_negotiation(id) ON DELETE CASCADE,
    insurer_id INT REFERENCES insurer(id),
    share_percentage NUMERIC,
    brokerage_percentage NUMERIC,
    brokerage_amount NUMERIC
);

CREATE TABLE opportunity_final_negotiation_qcr_variation (
    id SERIAL PRIMARY KEY,
    opportunity_final_negotiation_id INT REFERENCES opportunity_final_negotiation(id) ON DELETE CASCADE,
    name VARCHAR(255),
    description TEXT
);

CREATE TABLE opportunity_final_negotiation_service_level_agreement (
    id SERIAL PRIMARY KEY,
    opportunity_final_negotiation_id INT REFERENCES opportunity_final_negotiation(id) ON DELETE CASCADE,
    service_type_id INT REFERENCES lookup_data(id),
    number_of_days INT
);

CREATE TABLE opportunity_final_negotiation_doc_map (
    id SERIAL PRIMARY KEY,
    opportunity_final_negotiation_id INT REFERENCES opportunity_final_negotiation(id) ON DELETE CASCADE,
    document_id INT REFERENCES file_upload(id)
);

---------------------------
ALTER TABLE opportunity_final_negotiation
ADD COLUMN opportunity_id INT,
ADD COLUMN activity_id INT,
ADD COLUMN opportunity_activity_id INT,
ADD COLUMN other_insurer_comments TEXT,
ADD COLUMN status_lid INT,
ADD COLUMN is_final_negotiation_lid INT NOT NULL,
ADD COLUMN select_meeting_id INT,
ADD COLUMN quote_received_on TIMESTAMPTZ,
ADD COLUMN min_of_meeting TEXT;


ALTER TABLE opportunity_final_negotiation
DROP COLUMN IF EXISTS tax,
DROP COLUMN IF EXISTS tax_value;

ALTER TABLE opportunity_final_negotiation
ALTER COLUMN is_lead_insurer_pay_commission TYPE INT USING is_lead_insurer_pay_commission::int,
ALTER COLUMN is_quote_edited TYPE INT USING is_quote_edited::int;

ALTER TABLE opportunity_final_negotiation_qcr_variation
DROP COLUMN IF EXISTS description;

ALTER TABLE opportunity_final_negotiation_qcr_variation
RENAME COLUMN name TO issue;

ALTER TABLE opportunity_final_negotiation_doc_map
ADD COLUMN document_type_lid INT;

CREATE TABLE opportunity_final_negotiation_tax_map (
    id SERIAL PRIMARY KEY,
    opportunity_final_negotiation_id INT REFERENCES opportunity_final_negotiation(id) ON DELETE CASCADE,
    tax INT,
    tax_value INT
);

ALTER TABLE opportunity_final_negotiation
RENAME COLUMN policy_placed_type_id TO policy_placed_type_lid;

ALTER TABLE opportunity_final_negotiation
RENAME COLUMN is_lead_insurer_pay_commission TO is_lead_insurer_pay_commission_lid;

------------------

CREATE TABLE opportunity_final_negotiation_quote_cover_detail (
    id SERIAL PRIMARY KEY,
    opportunity_final_negotiation_id INT NOT NULL,
    quote_id INT NOT NULL,
    cover_map_id INT NOT NULL,
    insurer_cover_response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE opportunity_final_negotiation_quote_documents (
    id SERIAL PRIMARY KEY,
    opportunity_final_negotiation_id INT NOT NULL,
    quote_id INT NOT NULL,
    document_id INT NOT NULL,
    document_type_lid INT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE opportunity_final_negotiation
ADD COLUMN finalized_version_id INT;

ALTER TABLE opportunity_final_negotiation
ADD COLUMN quote_insurer_id INT;