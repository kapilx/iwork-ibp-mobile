-- Adds prorated premium columns to policy_employee_enrollment_choice, alongside
-- the existing premium/company_pay/employee_pay columns (left untouched — HR
-- reports (hr.repository.ts) and other existing consumers read those directly
-- expecting the full annual premium; that meaning must not change).
--
-- These new columns hold the day-based prorated amount for the employee's
-- own effective-date-to-policy-end span, computed the same way the endorsement
-- billing total already is (calculateApplicableDays / calculateEmployeePremium
-- in premium-calculator.util.ts). When a component's pro_ration_enabled is
-- false, these equal the full amount, so callers can read them unconditionally.
ALTER TABLE policy_employee_enrollment_choice
  ADD COLUMN IF NOT EXISTS prorated_premium numeric,
  ADD COLUMN IF NOT EXISTS prorated_company_pay numeric,
  ADD COLUMN IF NOT EXISTS prorated_employee_pay numeric;
