
-- Widen user_bizdone_report.report_type's CHECK constraint for the Business
-- Targets report async export, which needs its own reportType (distinct from
-- BIZDONE) so its Downloads panel only ever shows its own jobs. Mirrors
-- add-policy-list-report-type.sql. Without this, enqueueing a BUSINESS_TARGET
-- export fails with user_bizdone_report_report_type_check (400).
ALTER TABLE public.user_bizdone_report
  DROP CONSTRAINT IF EXISTS user_bizdone_report_report_type_check;

ALTER TABLE public.user_bizdone_report
  ADD CONSTRAINT user_bizdone_report_report_type_check
  CHECK (report_type IN ('BIZDONE', 'SALES_OPPORTUNITY_LIST', 'RENEWAL_OPPORTUNITY_LIST', 'POLICY_LIST', 'BUSINESS_TARGET'));
