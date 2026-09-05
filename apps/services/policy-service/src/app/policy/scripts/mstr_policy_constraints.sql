CREATE TABLE mstr_policy_constraints (
    id SERIAL PRIMARY KEY,
    country_id INT NOT NULL,
    constraints JSONB NOT NULL,
    created_by INT NOT NULL,
    updated_by INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_country_id FOREIGN KEY (country_id) REFERENCES country(id)
);
