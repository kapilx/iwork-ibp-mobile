-- Fix multi-company enrollment: replace single-column unique index on company_employee_id
-- with a compound unique index on (company_id, company_employee_id).
-- The old index prevented the same employee_id from existing across two different companies.

DROP INDEX IF EXISTS uq_pee_company_employee;

CREATE UNIQUE INDEX IF NOT EXISTS uq_pee_empco_companyemp_active
  ON policy_enrollment_employee(company_id, company_employee_id)
  WHERE deleted_at IS NULL;
