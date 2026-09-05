CREATE TABLE policy_employee_components (
    id SERIAL PRIMARY KEY,
    employee_enrollment_id INT NOT NULL REFERENCES policy_employee_enrollment(id) ON DELETE CASCADE,
    sum_insured NUMERIC NOT NULL,
    premium NUMERIC NOT NULL,
    company_pay NUMERIC NOT NULL,
    employee_pay NUMERIC NOT NULL,
    policy_component_action_type VARCHAR(100) NOT NULL,
    policy_component_action_type_id INT,
    policy_component_action_label VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_policy_component_map ON policy_employee_components(employee_enrollment_id);
