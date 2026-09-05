
-- Widen user_bizdone_report.report_type's CHECK constraint again for the
-- Policy listing (/policies) async export, which needs its own reportType
-- (distinct from BIZDONE) so that page's Downloads panel only ever shows its
-- own jobs. See add-sales-opportunity-report-type.sql /
-- add-renewal-opportunity-report-type.sql for the same pattern applied
-- earlier for SO/RO.
ALTER TABLE public.user_bizdone_report
  DROP CONSTRAINT IF EXISTS user_bizdone_report_report_type_check;

ALTER TABLE public.user_bizdone_report
  ADD CONSTRAINT user_bizdone_report_report_type_check
  CHECK (report_type IN ('BIZDONE', 'SALES_OPPORTUNITY_LIST', 'RENEWAL_OPPORTUNITY_LIST', 'POLICY_LIST'));
