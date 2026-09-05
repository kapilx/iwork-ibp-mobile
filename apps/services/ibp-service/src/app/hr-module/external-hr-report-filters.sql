-- ═══════════════════════════════════════════════════════════════════════════════
-- External HR – Report-Level Policy Scoping (Run AFTER external-hr-management.sql)
-- ───────────────────────────────────────────────────────────────────────────────
-- Every HR portal report that shows policy-based data must honour the External HR
-- user's allowed-policy list (stored in external_hr_policy_map).
--
-- HOW THE FILTER WORKS
-- ────────────────────
-- The generateReport() service already enriches params with:
--   enrichedParams["externalHrUserId"] = String(userId)   ← when user is EXTERNAL_HR
--
-- When the parameter is NULL (HR Admin / CRM / regular users) every filter below
-- is a no-op, so these patches are safe to apply globally.
--
-- REPORTS PATCHED HERE
-- ────────────────────
--  1. dashboard_enrollment_status   (id=25)  — enrollment stats across all policies
--  2. portfolio_kpi_summary         (id=47)  — "total policies" count
--  3. endorsement_overview          (id=40)  — all company endorsements when policyId=''
--  4. endorsement_employee_metrics  (id=41)  — latest version from hr-alter-scripts.sql
--  5. endorsement_list              (id=42)  — latest version from hr-alter-scripts.sql
--  6. cd_kpi_summary                (id=44)  — CD accounts linked to policies
--  7. cd_account_details            (id=45)  — CD account ↔ policy join
--  8. cd_transactions               (id=46)  — transactions per policy
--  9. policy_claim_history          (id=31)  — latest version from hr-alter-scripts.sql
-- ═══════════════════════════════════════════════════════════════════════════════

BEGIN;

-- Helper macro used in all patches:
--   AND (###externalHrUserId### IS NULL
--        OR <policy_col> IN (SELECT policy_id FROM external_hr_policy_map
--                            WHERE user_id = ###externalHrUserId###::INTEGER))

-- ─────────────────────────────────────────────────────────────────────────────
-- Utility: ensure the unique constraint exists so ON CONFLICT works
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_admin_reports_parameters_report_param'
  ) THEN
    ALTER TABLE admin_reports_parameters
      ADD CONSTRAINT uq_admin_reports_parameters_report_param
      UNIQUE (admin_report_id, parameter_name);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. dashboard_enrollment_status (id=25)
--    Scope the policy_scope CTE to only the External HR user's allowed policies.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE report_id INTEGER;
BEGIN
  SELECT id INTO report_id FROM public.admin_reports WHERE name = 'dashboard_enrollment_status';
  IF report_id IS NULL THEN RAISE NOTICE 'dashboard_enrollment_status not found — skip'; RETURN; END IF;

  UPDATE public.admin_reports SET query = $newq$
WITH policy_scope AS (
  SELECT p.id AS policy_id
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyType### = '' OR ld.lookup_key = ###policyType###)
    AND (###externalHrUserId### IS NULL
         OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER))
),
employee_scope AS (
  SELECT DISTINCT peepm.employee_id, pee.user_id
  FROM policy_enrollment_employee_policy_map peepm
  INNER JOIN policy_scope ps ON ps.policy_id = peepm.policy_id
  INNER JOIN policy_enrollment_employee pee ON pee.id = peepm.employee_id
  WHERE peepm.deleted_at IS NULL AND pee.deleted_at IS NULL
),
total_scope AS (SELECT COUNT(*) AS total_employees FROM employee_scope),
latest_login AS (
  SELECT ual.user_id, MAX(ual.action_date) AS last_login_at
  FROM user_activity_log ual
  WHERE ual.activity_key = 'LOGGED_IN' AND ual.activity_category = 'AUTH' AND ual.deleted_at IS NULL
  GROUP BY ual.user_id
),
latest_enrollment AS (
  SELECT DISTINCT ON (pee.employee_id)
    pee.employee_id, pee.employee_enrollment_status_key
  FROM policy_employee_enrollment pee
  INNER JOIN policy_scope ps ON ps.policy_id = pee.policy_id
  WHERE pee.deleted_at IS NULL
  ORDER BY pee.employee_id, pee.updated_at DESC, pee.id DESC
),
login_counts AS (
  SELECT
    COUNT(DISTINCT es.employee_id) FILTER (WHERE ll.last_login_at IS NOT NULL) AS logged_in,
    COUNT(DISTINCT es.employee_id) FILTER (WHERE ll.last_login_at IS NULL)     AS not_logged_in
  FROM employee_scope es
  LEFT JOIN latest_login ll ON ll.user_id = es.user_id
),
enrollment_confirmed AS (
  SELECT COUNT(DISTINCT le.employee_id) AS confirmed
  FROM latest_enrollment le
  WHERE le.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
)
SELECT
  ts.total_employees                                                       AS "totalEligible",
  lc.logged_in                                                             AS "loggedIn",
  lc.not_logged_in                                                         AS "notLoggedIn",
  ec.confirmed                                                             AS "enrollmentConfirmed",
  ROUND(lc.logged_in      * 100.0 / NULLIF(ts.total_employees, 0), 1)    AS "loggedInPercent",
  ROUND(lc.not_logged_in  * 100.0 / NULLIF(ts.total_employees, 0), 1)    AS "notLoggedInPercent",
  ROUND(ec.confirmed      * 100.0 / NULLIF(ts.total_employees, 0), 1)    AS "enrollmentConfirmedPercent"
FROM total_scope ts
CROSS JOIN login_counts lc
CROSS JOIN enrollment_confirmed ec
$newq$
  WHERE id = report_id;

  INSERT INTO public.admin_reports_parameters
    (admin_report_id, parameter_name, label, query_parameter, data_type, created_by, updated_by, input_field_type, option_type, option, order_no)
  VALUES (report_id, 'externalHrUserId', 'External HR User ID', '###externalHrUserId###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 99)
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE 'dashboard_enrollment_status: externalHrUserId policy scoping applied.';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. portfolio_kpi_summary (id=47)
--    Filter the LEFT JOIN policy so totalPolicies/activePolicies counts only
--    the External HR user's allowed policies.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE report_id INTEGER;
BEGIN
  SELECT id INTO report_id FROM public.admin_reports WHERE name = 'portfolio_kpi_summary';
  IF report_id IS NULL THEN RAISE NOTICE 'portfolio_kpi_summary not found — skip'; RETURN; END IF;

  UPDATE public.admin_reports SET query = $newq$
WITH lh_companies AS (
  SELECT DISTINCT c.id
  FROM company c
  WHERE c.deleted_at IS NULL
    AND (###crmUserId### = '' OR c.lead_crm::text = ###crmUserId###)
    AND (
      ###hrCompanyId### = ''
      OR c.id::text = ###hrCompanyId###
      OR c.id IN (
        SELECT gcm.company_id FROM group_company_map gcm
        WHERE gcm.group_company_id IN (
          SELECT gcm2.group_company_id FROM group_company_map gcm2
          WHERE gcm2.company_id::text = ###hrCompanyId###
        )
      )
      OR c.id IN (
        SELECT gcm3.group_company_id FROM group_company_map gcm3
        WHERE gcm3.company_id::text = ###hrCompanyId###
      )
    )
    AND EXISTS (
      SELECT 1
      FROM policy p2
      JOIN policy_type_segregation pts ON pts.policy_type_lid = p2.policy_type_lid
      JOIN lookup_data il ON il.id = pts.iirm_policy_type_lid AND il.deleted_at IS NULL
      WHERE p2.company_id = c.id
        AND (lower(il.value) LIKE '%life%' OR lower(il.value) LIKE '%health%')
        AND lower(il.value) NOT LIKE '%non-life%'
    )
)
SELECT
  COUNT(DISTINCT lc.id)::int                                                           AS "totalCompanies",
  COUNT(DISTINCT p.id)::int                                                            AS "totalPolicies",
  COUNT(DISTINCT p.id) FILTER (WHERE p.policy_to >= CURRENT_DATE)::int                AS "activePolicies",
  COUNT(DISTINCT p.id) FILTER (WHERE p.policy_to <  CURRENT_DATE)::int                AS "inactivePolicies",
  COALESCE(SUM(p.net_premium), 0)::numeric                                             AS "totalPremium"
FROM lh_companies lc
LEFT JOIN policy p ON p.company_id = lc.id
  AND (###externalHrUserId### IS NULL
       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER))
$newq$
  WHERE id = report_id;

  INSERT INTO public.admin_reports_parameters
    (admin_report_id, parameter_name, label, query_parameter, data_type, created_by, updated_by, input_field_type, option_type, option, order_no)
  VALUES (report_id, 'externalHrUserId', 'External HR User ID', '###externalHrUserId###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 99)
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE 'portfolio_kpi_summary: externalHrUserId policy scoping applied.';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. endorsement_overview (id=40)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE report_id INTEGER;
BEGIN
  SELECT id INTO report_id FROM public.admin_reports WHERE name = 'endorsement_overview';
  IF report_id IS NULL THEN RAISE NOTICE 'endorsement_overview not found — skip'; RETURN; END IF;

  UPDATE public.admin_reports SET query = $newq$
SELECT
  COUNT(DISTINCT e.id) AS "totalEndorsements",
  NULL::numeric        AS "netGrossPremium"
FROM endorsement e
INNER JOIN policy p ON p.id = e.policy_id
WHERE p.company_id = ###companyId###
  AND (###policyId### = '' OR e.policy_id::text = ###policyId###)
  AND (###externalHrUserId### IS NULL
       OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER))
$newq$
  WHERE id = report_id;

  INSERT INTO public.admin_reports_parameters
    (admin_report_id, parameter_name, label, query_parameter, data_type, created_by, updated_by, input_field_type, option_type, option, order_no)
  VALUES (report_id, 'externalHrUserId', 'External HR User ID', '###externalHrUserId###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 99)
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE 'endorsement_overview: externalHrUserId policy scoping applied.';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. endorsement_employee_metrics (id=41)
--    Incorporates the is_inception fix from hr-alter-scripts.sql.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE report_id INTEGER;
BEGIN
  SELECT id INTO report_id FROM public.admin_reports WHERE name = 'endorsement_employee_metrics';
  IF report_id IS NULL THEN RAISE NOTICE 'endorsement_employee_metrics not found — skip'; RETURN; END IF;

  UPDATE public.admin_reports SET query = $newq$
WITH inception_counts AS (
  SELECT
    COALESCE(e.endorsment_count,          0) AS employees_at_inception,
    COALESCE(e.endorsment_dependent_count, 0) AS dependents_at_inception
  FROM endorsement e
  INNER JOIN policy p ON p.id = e.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '' OR e.policy_id::text = ###policyId###)
    AND (###externalHrUserId### IS NULL
         OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER))
    AND e.is_inception = true
  ORDER BY e.id ASC
  LIMIT 1
),
employee_scope AS (
  SELECT
    emp_map.employee_id,
    MAX(CASE WHEN emp_map.enrollment_addition_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_addition,
    MAX(CASE WHEN emp_map.enrollment_deletion_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_deletion
  FROM policy_enrollment_employee_policy_map emp_map
  INNER JOIN policy p ON p.id = emp_map.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '' OR emp_map.policy_id::text = ###policyId###)
    AND (###externalHrUserId### IS NULL
         OR emp_map.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER))
    AND emp_map.deleted_at IS NULL
  GROUP BY emp_map.employee_id
),
dependent_scope AS (
  SELECT
    dep.id AS dependent_id,
    MAX(CASE WHEN dep.enrollment_addition_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_addition,
    MAX(CASE WHEN dep.enrollment_deletion_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_deletion
  FROM policy_enrollment_dependent dep
  INNER JOIN policy p ON p.id = dep.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '' OR dep.policy_id::text = ###policyId###)
    AND (###externalHrUserId### IS NULL
         OR dep.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER))
    AND dep.deleted_at IS NULL
  GROUP BY dep.id
),
employee_counts AS (
  SELECT
    COUNT(*) FILTER (WHERE has_addition=1 AND has_deletion=0) AS in_addition,
    COUNT(*) FILTER (WHERE has_deletion=1)                    AS in_deletion,
    COUNT(*) FILTER (WHERE has_deletion=0)                    AS active
  FROM employee_scope
),
dependent_counts AS (
  SELECT
    COUNT(*) FILTER (WHERE has_addition=1 AND has_deletion=0) AS in_addition,
    COUNT(*) FILTER (WHERE has_deletion=1)                    AS in_deletion,
    COUNT(*) FILTER (WHERE has_deletion=0)                    AS active
  FROM dependent_scope
)
SELECT
  ic.employees_at_inception                                        AS "employeesAtInception",
  ec.in_addition                                                   AS "employeesInAddition",
  ec.in_deletion                                                   AS "employeesInDeletion",
  ec.active                                                        AS "activeEmployees",
  ic.employees_at_inception + ic.dependents_at_inception           AS "livesAtInception",
  ec.in_addition  + dc.in_addition                                 AS "livesInAddition",
  ec.in_deletion  + dc.in_deletion                                 AS "livesInDeletion",
  ec.active       + dc.active                                      AS "activeLives"
FROM employee_counts ec
CROSS JOIN dependent_counts dc
CROSS JOIN inception_counts ic
$newq$
  WHERE id = report_id;

  INSERT INTO public.admin_reports_parameters
    (admin_report_id, parameter_name, label, query_parameter, data_type, created_by, updated_by, input_field_type, option_type, option, order_no)
  VALUES (report_id, 'externalHrUserId', 'External HR User ID', '###externalHrUserId###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 99)
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE 'endorsement_employee_metrics: externalHrUserId policy scoping applied.';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. endorsement_list (id=42)
--    Incorporates the is_inception fix from hr-alter-scripts.sql.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE report_id INTEGER;
BEGIN
  SELECT id INTO report_id FROM public.admin_reports WHERE name = 'endorsement_list';
  IF report_id IS NULL THEN RAISE NOTICE 'endorsement_list not found — skip'; RETURN; END IF;

  UPDATE public.admin_reports SET query = $newq$
SELECT
  e.id                                                   AS "endorsementId",
  e.insurer_endorsement_number                           AS "insurerEndorsementId",
  e.policy_id                                            AS "policyId",
  p.insurer_policy_number                                AS "policyNumber",
  e.endorsement_type                                     AS "endorsementType",
  TO_CHAR(e.enrollment_start_date, 'DD/MM/YYYY')         AS "enrollmentStartDate",
  TO_CHAR(e.enrollment_end_date,   'DD/MM/YYYY')         AS "enrollmentEndDate",
  TO_CHAR(e.created_at,            'DD/MM/YYYY')         AS "createdAt",
  e.os_ticket_number                                     AS "osTicketNumber",
  COALESCE(e.endorsement_status, '')                     AS "endorsementStatus",
  COALESCE(counts.upload_count,  0)                      AS "uploadCount",
  COALESCE(counts.success_count, 0)                      AS "totalSuccessCount",
  COALESCE(counts.error_count,   0)                      AS "totalErrorCount",
  COALESCE(counts.process_count, 0)                      AS "totalProcessCount",
  COALESCE(e.basic_premium,  p.basic_premium)            AS "basePremium",
  COALESCE(e.gst_amount,     p.gst_amount)               AS "taxAmount",
  COALESCE(e.gross_premium,  p.gross_premium)            AS "grossPremium",
  COALESCE(e.net_premium,    p.net_premium)              AS "netPremium",
  CASE
    WHEN COALESCE(e.net_premium,   p.net_premium)   IS NOT NULL
     AND COALESCE(e.gst_amount,    p.gst_amount)    IS NOT NULL
    THEN COALESCE(e.net_premium, p.net_premium) + COALESCE(e.gst_amount, p.gst_amount)
    ELSE COALESCE(e.net_premium, p.net_premium, e.gross_premium, p.gross_premium)
  END                                                    AS "netGrossPremium",
  COALESCE(e.endorsment_count, 0)                        AS "endorsmentCount",
  COALESCE(e.endorsment_dependent_count, 0)              AS "endorsmentDependentCount",
  COALESCE(e.is_inception, false)                        AS "isInception"
FROM endorsement e
INNER JOIN policy p ON p.id = e.policy_id
LEFT JOIN (
  SELECT
    dpf.endorsement_id,
    COUNT(DISTINCT dpf.id)              AS upload_count,
    COALESCE(SUM(s.success_count), 0)   AS success_count,
    COALESCE(SUM(s.error_count),   0)   AS error_count,
    COALESCE(SUM(s.process_count), 0)   AS process_count
  FROM document_processing_file dpf
  INNER JOIN policy p2 ON p2.id = dpf.entity_id AND dpf.entity_type = 'policy'
  LEFT JOIN policy_enrollment_upload_summary s
    ON s.document_processing_file_id = dpf.id
  WHERE p2.company_id = ###companyId###
    AND (###policyId### = '' OR dpf.entity_id::text = ###policyId###)
  GROUP BY dpf.endorsement_id
) counts ON counts.endorsement_id = e.id
WHERE p.company_id = ###companyId###
  AND (###policyId### = '' OR e.policy_id::text = ###policyId###)
  AND (###externalHrUserId### IS NULL
       OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER))
ORDER BY e.created_at DESC
$newq$
  WHERE id = report_id;

  INSERT INTO public.admin_reports_parameters
    (admin_report_id, parameter_name, label, query_parameter, data_type, created_by, updated_by, input_field_type, option_type, option, order_no)
  VALUES (report_id, 'externalHrUserId', 'External HR User ID', '###externalHrUserId###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 99)
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE 'endorsement_list: externalHrUserId policy scoping applied (is_inception preserved).';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. cd_kpi_summary (id=44)
--    Scope each CTE to CD accounts whose policies are in the allowed list.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE report_id INTEGER;
BEGIN
  SELECT id INTO report_id FROM public.admin_reports WHERE name = 'cd_kpi_summary';
  IF report_id IS NULL THEN RAISE NOTICE 'cd_kpi_summary not found — skip'; RETURN; END IF;

  UPDATE public.admin_reports SET query = $newq$
WITH allowed_cd AS (
  -- When externalHrUserId is set, restrict to CD accounts linked to allowed policies.
  SELECT DISTINCT cd.id
  FROM caution_deposit cd
  WHERE cd.company_id = ###companyId###
    AND cd.status = 'ACTIVE'
    AND (###externalHrUserId### IS NULL
         OR EXISTS (
           SELECT 1
           FROM caution_deposit_policy_mapping cdpm
           WHERE cdpm.caution_deposit_id = cd.id
             AND cdpm.policy_id IN (
               SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER
             )
         ))
),
account_totals AS (
  SELECT COUNT(DISTINCT cd.id) AS active_accounts_count,
         COALESCE(SUM(cd.balance_amount), 0) AS total_deposit_balance
  FROM caution_deposit cd
  INNER JOIN allowed_cd ac ON ac.id = cd.id
),
utilisation AS (
  SELECT COALESCE(SUM(CASE WHEN cdt.transaction_type='DEBIT_TRANSACTION' THEN cdt.transaction_amount ELSE 0 END), 0) AS total_utilised
  FROM caution_deposit_transaction cdt
  INNER JOIN allowed_cd ac ON ac.id = cdt.caution_deposit_id
),
last_credit AS (
  SELECT cdt.transaction_date, cdt.transaction_amount, cdt.bank_name
  FROM caution_deposit_transaction cdt
  INNER JOIN allowed_cd ac ON ac.id = cdt.caution_deposit_id
  WHERE cdt.transaction_type = 'CREDIT_TRANSACTION'
  ORDER BY cdt.transaction_date DESC LIMIT 1
),
balance_trend AS (
  SELECT json_agg(monthly_balance ORDER BY month_start) AS trend_data
  FROM (
    SELECT
      date_trunc('month', cdt.transaction_date) AS month_start,
      SUM(CASE WHEN cdt.transaction_type='CREDIT_TRANSACTION' THEN cdt.transaction_amount ELSE 0 END)
      - SUM(CASE WHEN cdt.transaction_type='DEBIT_TRANSACTION'  THEN cdt.transaction_amount ELSE 0 END) AS monthly_balance
    FROM caution_deposit_transaction cdt
    INNER JOIN allowed_cd ac ON ac.id = cdt.caution_deposit_id
    WHERE cdt.transaction_date >= date_trunc('month', NOW() - INTERVAL '5 months')
    GROUP BY date_trunc('month', cdt.transaction_date)
    ORDER BY month_start LIMIT 6
  ) t
)
SELECT
  at.total_deposit_balance                                                            AS "totalDepositBalance",
  at.active_accounts_count                                                            AS "activeCdAccountsCount",
  ut.total_utilised                                                                   AS "utilisedAmount",
  ROUND(ut.total_utilised * 100.0 / NULLIF(at.total_deposit_balance, 0), 1)          AS "utilisedPercent",
  TO_CHAR(lc.transaction_date, 'DD/MM/YYYY')                                          AS "lastDepositDate",
  lc.transaction_amount                                                               AS "lastDepositAmount",
  lc.bank_name                                                                        AS "lastDepositBank",
  bt.trend_data                                                                       AS "balanceTrendData"
FROM account_totals at
CROSS JOIN utilisation ut
LEFT JOIN last_credit lc ON true
LEFT JOIN balance_trend bt ON true
$newq$
  WHERE id = report_id;

  INSERT INTO public.admin_reports_parameters
    (admin_report_id, parameter_name, label, query_parameter, data_type, created_by, updated_by, input_field_type, option_type, option, order_no)
  VALUES (report_id, 'externalHrUserId', 'External HR User ID', '###externalHrUserId###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 99)
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE 'cd_kpi_summary: externalHrUserId policy scoping applied.';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. cd_account_details (id=45)
--    Already joins caution_deposit_policy_mapping → policy; add filter on p.id.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE report_id INTEGER;
BEGIN
  SELECT id INTO report_id FROM public.admin_reports WHERE name = 'cd_account_details';
  IF report_id IS NULL THEN RAISE NOTICE 'cd_account_details not found — skip'; RETURN; END IF;

  UPDATE public.admin_reports SET query = $newq$
SELECT
  cd.id                                                                               AS "cdAccountId",
  cd.cd_account_number                                                                AS "cdAccountNumber",
  cd.cd_account_name                                                                  AS "cdAccountName",
  p.insurer_policy_number                                                             AS "policyNumber",
  p.id                                                                                AS "policyId",
  COALESCE(cd.balance_amount, 0)                                                      AS "depositBalance",
  COALESCE(SUM(CASE WHEN cdt.transaction_type='DEBIT_TRANSACTION' THEN cdt.transaction_amount ELSE 0 END), 0) AS "utilisedAmount",
  ROUND(COALESCE(SUM(CASE WHEN cdt.transaction_type='DEBIT_TRANSACTION' THEN cdt.transaction_amount ELSE 0 END), 0) * 100.0 / NULLIF(cd.balance_amount, 0), 1) AS "utilisationPercent",
  TO_CHAR(cd.updated_at, 'DD/MM/YYYY')                                                AS "lastUpdated"
FROM caution_deposit cd
INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
INNER JOIN policy p ON p.id = cdpm.policy_id
LEFT JOIN caution_deposit_transaction cdt ON cdt.caution_deposit_id = cd.id
WHERE cd.company_id = ###companyId###
  AND cd.status = 'ACTIVE'
  AND (###search### = '' OR cd.cd_account_name ILIKE '%' || ###search### || '%' OR p.insurer_policy_number ILIKE '%' || ###search### || '%')
  AND (###externalHrUserId### IS NULL
       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER))
GROUP BY cd.id, cd.cd_account_number, cd.cd_account_name, cd.balance_amount, cd.updated_at, p.insurer_policy_number, p.id
ORDER BY "utilisationPercent" DESC NULLS LAST
$newq$
  WHERE id = report_id;

  INSERT INTO public.admin_reports_parameters
    (admin_report_id, parameter_name, label, query_parameter, data_type, created_by, updated_by, input_field_type, option_type, option, order_no)
  VALUES (report_id, 'externalHrUserId', 'External HR User ID', '###externalHrUserId###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 99)
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE 'cd_account_details: externalHrUserId policy scoping applied.';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. cd_transactions (id=46)
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE report_id INTEGER;
BEGIN
  SELECT id INTO report_id FROM public.admin_reports WHERE name = 'cd_transactions';
  IF report_id IS NULL THEN RAISE NOTICE 'cd_transactions not found — skip'; RETURN; END IF;

  UPDATE public.admin_reports SET query = $newq$
SELECT
  cdt.id                                                                   AS "txnId",
  TO_CHAR(cdt.transaction_date, 'DD/MM/YYYY')                              AS "txnDate",
  CASE
    WHEN cdt.transaction_type = 'CREDIT_TRANSACTION' THEN 'Deposit'
    ELSE 'Deduction'
  END                                                                       AS "txnType",
  CASE
    WHEN cdt.transaction_type = 'CREDIT_TRANSACTION'
      THEN cdt.transaction_amount
    ELSE -cdt.transaction_amount
  END                                                                       AS "amount",
  cd.cd_account_number                                                      AS "cdAccountNumber",
  p.insurer_policy_number                                                   AS "policyNumber",
  cdt.bank_name                                                             AS "bankName",
  COALESCE(NULLIF(TRIM(cdt.cheque_number), ''), cdt.transaction_reference_id) AS "referenceId",
  cdt.cd_balance_amount                                                     AS "runningBalance",
  e.insurer_endorsement_number                                              AS "endorsementNumber",
  e.endorsement_type                                                        AS "endorsementType",
  TO_CHAR(cdt.cheque_date, 'DD/MM/YYYY')                                    AS "transactionValueDate",
  TRIM(u.first_name || ' ' || COALESCE(u.last_name, ''))                    AS "createdBy",
  cdt.remarks                                                               AS "remarks",
  cdt.ifsc_code                                                             AS "ifscCode"
FROM caution_deposit_transaction cdt
INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
LEFT JOIN policy p   ON p.id  = cdt.policy_id
LEFT JOIN endorsement e ON e.id = cdt.endorsement_id
LEFT JOIN users u    ON u.id  = cdt.created_by
WHERE cd.company_id = ###companyId###
  AND (###policyId### = '' OR cdt.policy_id::text = ###policyId###)
  AND (###txnType### = '' OR cdt.transaction_type = ###txnType###)
  AND (NULLIF(###startDate###, '') IS NULL OR cdt.transaction_date >= NULLIF(###startDate###, '')::date)
  AND (NULLIF(###endDate###,   '') IS NULL OR cdt.transaction_date <= NULLIF(###endDate###,   '')::date)
  AND (###externalHrUserId### IS NULL
       OR cdt.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER))
ORDER BY cdt.transaction_date DESC, cdt.id DESC
$newq$
  WHERE id = report_id;

  INSERT INTO public.admin_reports_parameters
    (admin_report_id, parameter_name, label, query_parameter, data_type, created_by, updated_by, input_field_type, option_type, option, order_no)
  VALUES (report_id, 'externalHrUserId', 'External HR User ID', '###externalHrUserId###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 99)
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE 'cd_transactions: externalHrUserId policy scoping applied.';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. policy_claim_history (id=31)
--    Incorporates all filter additions from hr-alter-scripts.sql.
--    The externalHrUserId guard ensures a crafted policyId request is rejected
--    when the policy is not in the user's allowed list.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE report_id INTEGER;
BEGIN
  SELECT id INTO report_id FROM public.admin_reports WHERE name = 'policy_claim_history';
  IF report_id IS NULL THEN RAISE NOTICE 'policy_claim_history not found — skip'; RETURN; END IF;

  UPDATE public.admin_reports SET query = $newq$
WITH latest_settlement AS (
  SELECT DISTINCT ON (pcs.claim_id)
    pcs.claim_id,
    pcs.clm_sett_amt  AS settled_amount,
    pcs.clm_sett_date AS settlement_date
  FROM policy_claim_settlement pcs
  ORDER BY pcs.claim_id, pcs.clm_sett_date DESC NULLS LAST, pcs.id DESC
)
SELECT
  c.id                                             AS "claimId",
  COALESCE(c.claim_number, c.id::text)             AS "claimNumber",
  c.employee_id                                    AS "employeeId",
  COALESCE(pee.employee_company_id, '')            AS "employeeCode",
  COALESCE(pee.full_name, pee.employee_name, '—')  AS "employeeName",
  COALESCE(
    c.patient_name,
    CASE
      WHEN c.dependent_id IS NULL THEN COALESCE(pee.full_name, pee.employee_name)
      ELSE ped.name
    END,
    '—'
  )                                                AS "patientName",
  CASE
    WHEN c.dependent_id IS NULL THEN 'Self'
    ELSE COALESCE(ped.relation, 'Dependent')
  END                                              AS "relation",
  COALESCE(mh.name, c.clm_hospital, '—')           AS "hospital",
  c.claim_dt                                       AS "claimDate",
  INITCAP(COALESCE(c.clm_type, '—'))               AS "claimType",
  c.claim_amount                                   AS "claimedAmount",
  COALESCE(ls.settled_amount, 0)                   AS "approvedAmount",
  ls.settlement_date                               AS "settlementDate",
  INITCAP(COALESCE(c.claim_status, 'pending'))      AS "status"
FROM policy_claim c
INNER JOIN policy p ON p.id = c.policy_id
LEFT JOIN policy_enrollment_employee pee
  ON pee.id = c.employee_id AND pee.deleted_at IS NULL
LEFT JOIN policy_enrollment_dependent ped
  ON ped.id = c.dependent_id AND ped.deleted_at IS NULL
LEFT JOIN mstr_hospital mh
  ON mh.id = c.hospital_id AND mh.deleted_at IS NULL
LEFT JOIN latest_settlement ls ON ls.claim_id = c.id
WHERE c.policy_id = ###policyId###
  AND (NULLIF(###employeeId###, '') IS NULL
       OR c.employee_id = NULLIF(###employeeId###, '')::int)
  AND (###claimStatus### = ''
       OR (###claimStatus### = 'PENDING' AND LOWER(COALESCE(c.claim_status, '')) NOT IN ('settled', 'ready for payment', 'claim denied'))
       OR LOWER(c.claim_status) = LOWER(###claimStatus###))
  AND (###claimType### = ''
       OR LOWER(COALESCE(c.clm_type, '')) LIKE '%' || LOWER(###claimType###) || '%')
  AND (###claimNo### = ''
       OR COALESCE(c.claim_number, '') ILIKE '%' || ###claimNo### || '%')
  AND (###employeeSearch### = ''
       OR COALESCE(pee.full_name, pee.employee_name, '') ILIKE '%' || ###employeeSearch### || '%'
       OR COALESCE(pee.employee_company_id, '')           ILIKE '%' || ###employeeSearch### || '%')
  AND (###patientName### = ''
       OR COALESCE(c.patient_name, '') ILIKE '%' || ###patientName### || '%'
       OR (c.patient_name IS NULL AND c.dependent_id IS NULL AND COALESCE(pee.full_name, pee.employee_name, '') ILIKE '%' || ###patientName### || '%')
       OR (c.patient_name IS NULL AND c.dependent_id IS NOT NULL AND COALESCE(ped.name, '') ILIKE '%' || ###patientName### || '%'))
  AND (###hospital### = ''
       OR COALESCE(mh.name, c.clm_hospital, '') ILIKE '%' || ###hospital### || '%')
  AND (NULLIF(###claimDateFrom###, '') IS NULL
       OR c.claim_dt::date >= NULLIF(###claimDateFrom###, '')::date)
  AND (NULLIF(###claimDateTo###, '') IS NULL
       OR c.claim_dt::date <= NULLIF(###claimDateTo###, '')::date)
  AND (NULLIF(###settlementDateFrom###, '') IS NULL
       OR ls.settlement_date::date >= NULLIF(###settlementDateFrom###, '')::date)
  AND (NULLIF(###settlementDateTo###, '') IS NULL
       OR ls.settlement_date::date <= NULLIF(###settlementDateTo###, '')::date)
  AND (NULLIF(###amountMin###, '') IS NULL
       OR c.claim_amount >= NULLIF(###amountMin###, '')::numeric)
  AND (NULLIF(###amountMax###, '') IS NULL
       OR c.claim_amount <= NULLIF(###amountMax###, '')::numeric)
  AND (###tat### = ''
       OR (###tat### = 'lte7'  AND ls.settlement_date IS NOT NULL AND (ls.settlement_date::date - c.claim_dt::date) <= 7)
       OR (###tat### = '7to30' AND ls.settlement_date IS NOT NULL AND (ls.settlement_date::date - c.claim_dt::date) BETWEEN 8 AND 30)
       OR (###tat### = 'gt30'  AND ls.settlement_date IS NOT NULL AND (ls.settlement_date::date - c.claim_dt::date) > 30))
  AND (###search### = ''
       OR COALESCE(pee.full_name, pee.employee_name, '') ILIKE '%' || ###search### || '%'
       OR COALESCE(c.claim_number, '')                   ILIKE '%' || ###search### || '%'
       OR COALESCE(mh.name, c.clm_hospital, '')          ILIKE '%' || ###search### || '%')
  AND (###externalHrUserId### IS NULL
       OR c.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER))
ORDER BY c.claim_dt DESC NULLS LAST, c.id DESC
$newq$
  WHERE id = report_id;

  INSERT INTO public.admin_reports_parameters
    (admin_report_id, parameter_name, label, query_parameter, data_type, created_by, updated_by, input_field_type, option_type, option, order_no)
  VALUES (report_id, 'externalHrUserId', 'External HR User ID', '###externalHrUserId###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 99)
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE 'policy_claim_history: externalHrUserId policy scoping applied (all filters preserved).';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 10. dashboard_policy_cards — ensure externalHrUserId parameter is registered
-- ─────────────────────────────────────────────────────────────────────────────
-- The query already contains ###externalHrUserId### (added in
-- hr-report-and-user-management-scripts.sql and preserved in
-- hr-module-cd-balance-fixes-v3.sql). This block only ensures the parameter
-- row exists so buildQuery() can replace the placeholder at runtime.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  report_id INTEGER;
BEGIN
  SELECT id INTO report_id FROM public.admin_reports WHERE name = 'dashboard_policy_cards';
  IF report_id IS NULL THEN
    RAISE NOTICE 'dashboard_policy_cards not found — skipping';
    RETURN;
  END IF;

  INSERT INTO public.admin_reports_parameters
    (admin_report_id, parameter_name, label, query_parameter, data_type, created_by, updated_by, input_field_type, option_type, option, order_no)
  VALUES
    (report_id, 'externalHrUserId', 'External HR User ID', '###externalHrUserId###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 99)
  ON CONFLICT (admin_report_id, parameter_name) DO NOTHING;

  RAISE NOTICE 'dashboard_policy_cards: externalHrUserId parameter ensured.';
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Verify all patches applied
-- ─────────────────────────────────────────────────────────────────────────────
SELECT
  name,
  CASE
    WHEN query LIKE '%externalHrUserId%' THEN '✓ filter present'
    ELSE '✗ PATCH DID NOT APPLY'
  END AS status
FROM public.admin_reports
WHERE name IN (
  'dashboard_policy_cards',
  'dashboard_enrollment_status',
  'portfolio_kpi_summary',
  'endorsement_overview',
  'endorsement_employee_metrics',
  'endorsement_list',
  'cd_kpi_summary',
  'cd_account_details',
  'cd_transactions',
  'policy_claim_history'
)
ORDER BY name;

COMMIT;
