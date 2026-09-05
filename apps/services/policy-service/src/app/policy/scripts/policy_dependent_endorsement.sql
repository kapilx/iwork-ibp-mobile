CREATE TABLE policy_dependent_endorsement (
    id SERIAL PRIMARY KEY,
    policy_id INT NOT NULL,
    dependent_id INT NOT NULL,
    employee_id INT NOT NULL,
    company_id INT NOT NULL,
    employee_endorsement_status_key VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    endorsement_addition_file_id INT,
    endorsement_deletion_file_id INT,
    endorsement_addition_created_at TIMESTAMP,
    endorsement_deleted_created_at TIMESTAMP,
    endorsement_updation_file_id INT,
    endorsement_updation_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    endorsement_id INT,
    deletion_endorsement_id INT
);