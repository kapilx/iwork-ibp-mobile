CREATE TABLE policy_employee_enrollment (
    id SERIAL PRIMARY KEY,
    policy_id INT NOT NULL REFERENCES policy(id) ON DELETE CASCADE,
    employee_id INT NOT NULL REFERENCES employee(id) ON DELETE CASCADE,
    company_id INT NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    employee_enrollment_status_key VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_employee_enrollment ON policy_employee_enrollment(employee_id, policy_id);
