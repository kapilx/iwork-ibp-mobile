-- Check current indexes on policy_enrollment_employee
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'policy_enrollment_employee'
  AND indexname IN ('uq_pee_company_employee', 'uq_pee_empco_companyemp_active')
ORDER BY indexname;
