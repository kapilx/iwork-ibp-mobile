-- Table for storing each employee enrollment record
CREATE TABLE policy_enrollment_employee (
    id SERIAL PRIMARY KEY,
    policy_id INT NOT NULL REFERENCES policy(id),
    employee_company_id VARCHAR(100) NOT NULL,
    employee_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    email VARCHAR(100),
    phone_number VARCHAR(20),
    ctc NUMERIC,
    designation VARCHAR(100),
    relation_group VARCHAR(100),
    marital_status VARCHAR(20),
    additional_params JSONB,
    created_by INT NOT NULL DEFAULT 0,
    updated_by INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pee_policy_id ON policy_enrollment_employee(policy_id);

CREATE TABLE policy_enrollment_dependent (
    id SERIAL PRIMARY KEY,
    policy_id INT NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES policy_enrollment_employee(id),
    name VARCHAR(100) NOT NULL,
    relation VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    claim_status VARCHAR(10),
    created_by INT NOT NULL DEFAULT 0,
    updated_by INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ped_employee ON policy_enrollment_dependent(employee_id, relation);

ALTER TABLE policy_enrollment_dependent
    ADD COLUMN relationship_type VARCHAR(100);

