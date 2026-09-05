--create mstr_entity_fields_utility_ref

CREATE TABLE mstr_entity_fields_utility_ref (
    id SERIAL PRIMARY KEY,

    entity_name VARCHAR(50) NOT NULL,        -- INSURER / POLICY / CLAIM
    table_name VARCHAR(100) NOT NULL,
    column_name VARCHAR(100) NOT NULL,

    display_name VARCHAR(100) NOT NULL,
    data_type VARCHAR(20) NOT NULL,          -- STRING | DATE | NUMBER | GENDER
    is_required BOOLEAN DEFAULT false,

    config JSONB,                            -- expected format / target type

    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER,
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by INTEGER,

    UNIQUE (entity_name, table_name, column_name)
);

--insert sample data into mstr_entity_fields_utility_ref

INSERT INTO mstr_entity_fields_utility_ref (
    entity_name,
    table_name,
    column_name,
    display_name,
    data_type,
    is_required,
    config,
    created_at,
    created_by,
    updated_at,
    updated_by
)
VALUES

-- Policy reference
(
    'ENDORSEMENT',
    'endorsement_member',
    'policy_number',
    'Policy Number',
    'STRING',
    true,
    '{"type":"STRING"}',
    NOW(), 1, NOW(), 1
),

-- Endorsement action type
(
    'ENDORSEMENT',
    'endorsement_member',
    'endorsement_action',
    'Endorsement Action Type',
    'STRING',
    true,
    '{"type":"STRING","allowedValues":["A","D","C"]}',
    NOW(), 1, NOW(), 1
),

-- Employee details
(
    'ENDORSEMENT',
    'endorsement_member',
    'employee_number',
    'Employee Number',
    'STRING',
    true,
    '{"type":"STRING"}',
    NOW(), 1, NOW(), 1
),

(
    'ENDORSEMENT',
    'endorsement_member',
    'insured_full_name',
    'Insured Full Name',
    'STRING',
    false,
    '{"type":"STRING"}',
    NOW(), 1, NOW(), 1
),

(
    'ENDORSEMENT',
    'endorsement_member',
    'relationship_code',
    'Relationship Type',
    'STRING',
    true,
    '{"type":"STRING"}',
    NOW(), 1, NOW(), 1
),

-- Gender
(
    'ENDORSEMENT',
    'endorsement_member',
    'gender_code',
    'Gender',
    'GENDER',
    true,
    '{"type":"GENDER","allowedValues":["M","F"]}',
    NOW(), 1, NOW(), 1
),

-- DOB & Age
(
    'ENDORSEMENT',
    'endorsement_member',
    'date_of_birth',
    'Date of Birth',
    'DATE',
    true,
    '{"type":"DATE","targetFormat":"YYYY-MM-DD"}',
    NOW(), 1, NOW(), 1
),

(
    'ENDORSEMENT',
    'endorsement_member',
    'age_years',
    'Age',
    'NUMBER',
    false,
    '{"type":"NUMBER","precision":3,"scale":0}',
    NOW(), 1, NOW(), 1
),

-- Insurance details
(
    'ENDORSEMENT',
    'endorsement_member',
    'sum_insured_amount',
    'Sum Insured',
    'NUMBER',
    true,
    '{"type":"NUMBER","precision":15,"scale":2}',
    NOW(), 1, NOW(), 1
),

-- Employment dates
(
    'ENDORSEMENT',
    'endorsement_member',
    'date_of_joining',
    'Date of Joining',
    'DATE',
    false,
    '{"type":"DATE","targetFormat":"YYYY-MM-DD"}',
    NOW(), 1, NOW(), 1
),

(
    'ENDORSEMENT',
    'endorsement_member',
    'date_of_leaving',
    'Date of Leaving',
    'DATE',
    false,
    '{"type":"DATE","targetFormat":"YYYY-MM-DD"}',
    NOW(), 1, NOW(), 1
),

-- Marriage info
(
    'ENDORSEMENT',
    'endorsement_member',
    'date_of_marriage',
    'Date of Marriage',
    'DATE',
    false,
    '{"type":"DATE","targetFormat":"YYYY-MM-DD"}',
    NOW(), 1, NOW(), 1
),

-- Misc
(
    'ENDORSEMENT',
    'endorsement_member',
    'correction_remarks',
    'Remarks for Corrections',
    'STRING',
    false,
    '{"type":"STRING"}',
    NOW(), 1, NOW(), 1
),

(
    'ENDORSEMENT',
    'endorsement_member',
    'email_addresses',
    'Email IDs',
    'STRING',
    false,
    '{"type":"STRING"}',
    NOW(), 1, NOW(), 1
),

(
    'ENDORSEMENT',
    'endorsement_member',
    'mobile_number',
    'Mobile Number',
    'STRING',
    false,
    '{"type":"STRING"}',
    NOW(), 1, NOW(), 1
);