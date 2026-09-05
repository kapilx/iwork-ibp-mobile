CREATE TABLE policy_enrollment_employee_policy_map (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES policy_enrollment_employee(id) ON DELETE CASCADE,
    policy_id INT NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    enrollment_start_date DATE,
    enrollment_end_date DATE,
    claim_status VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, policy_id)
);
