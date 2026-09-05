ALTER TABLE policy_enrollment_employee
    ADD COLUMN company_employee_id INT,

CREATE UNIQUE INDEX IF NOT EXISTS uq_pee_company_employee
  ON policy_enrollment_employee(company_employee_id)
  WHERE deleted_at IS NULL;
