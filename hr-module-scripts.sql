-- HR module report seed scripts
-- Endpoints intentionally store only the report key, without the /hr-module/generate/ prefix.

DO $$
BEGIN
  PERFORM setval(
    pg_get_serial_sequence('admin_reports', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports), 0),
    true
  );

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );
END $$;



-- Updated by claude ai
-- 1) Company Demographics Breakdown
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'company_demographics_breakdown',
    'Company Demographics Breakdown',
    'company_demographics_breakdown',
    $demo$
WITH policy_scope AS (
  SELECT
    p.id AS policy_id
  FROM policy p
   INNER JOIN lookup_data ld
    ON ld.id = p.policy_type_lid
  -- WHERE ld.lookup_key IN (
  --   'POLICY_TYPE_GMC',
  --   'POLICY_TYPE_GPA',
  --   'POLICY_TYPE_GTL'
  -- )
  WHERE p.company_id = ###companyId###
    AND p.deleted_at IS NULL
    AND ld.deleted_at IS NULL
),
employee_scope AS (
  SELECT
    emp_map.employee_id,
    MAX(CASE WHEN emp_map.enrollment_addition_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_addition,
    MAX(CASE WHEN emp_map.enrollment_deletion_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_deletion
  FROM policy_enrollment_employee_policy_map emp_map
  INNER JOIN policy_scope ps
    ON ps.policy_id = emp_map.policy_id
  WHERE emp_map.deleted_at IS NULL
  GROUP BY emp_map.employee_id
),
dependent_scope AS (
  SELECT
    dep.id AS dependent_id,
    MAX(CASE WHEN dep.enrollment_addition_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_addition,
    MAX(CASE WHEN dep.enrollment_deletion_batch_id IS NOT NULL THEN 1 ELSE 0 END) AS has_deletion
  FROM policy_enrollment_dependent dep
  INNER JOIN policy_scope ps
    ON ps.policy_id = dep.policy_id
  WHERE dep.deleted_at IS NULL
  GROUP BY dep.id
),
employee_counts AS (
  SELECT
    COUNT(*) FILTER (WHERE has_addition = 0 AND has_deletion = 0) AS inception_employees,
    COUNT(*) FILTER (WHERE has_addition = 1 AND has_deletion = 0) AS addition_employees,
    COUNT(*) FILTER (WHERE has_deletion = 1) AS deletion_employees,
    COUNT(*) FILTER (WHERE has_deletion = 0) AS active_employees
  FROM employee_scope
),
dependent_counts AS (
  SELECT
    COUNT(*) FILTER (WHERE has_addition = 0 AND has_deletion = 0) AS inception_dependents,
    COUNT(*) FILTER (WHERE has_addition = 1 AND has_deletion = 0) AS addition_dependents,
    COUNT(*) FILTER (WHERE has_deletion = 1) AS deletion_dependents,
    COUNT(*) FILTER (WHERE has_deletion = 0) AS active_dependents
  FROM dependent_scope
)
SELECT
  'INCEPTION_MEMBERS' AS "metricKey",
  'Inception Members' AS "metricLabel",
  ec.inception_employees AS "employeeCount",
  dc.inception_dependents AS "dependentCount",
  ec.inception_employees + dc.inception_dependents AS "totalCount",
  ROUND(
    CASE
      WHEN ec.inception_employees + dc.inception_dependents = 0 THEN 0
      ELSE (ec.inception_employees::numeric * 100.0) /
           (ec.inception_employees + dc.inception_dependents)
    END,
    1
  ) AS "employeePercent",
  ROUND(
    CASE
      WHEN ec.inception_employees + dc.inception_dependents = 0 THEN 0
      ELSE (dc.inception_dependents::numeric * 100.0) /
           (ec.inception_employees + dc.inception_dependents)
    END,
    1
  ) AS "dependentPercent"
FROM employee_counts ec
CROSS JOIN dependent_counts dc

UNION ALL

SELECT
  'NEW_ADDITIONS' AS "metricKey",
  'New Additions' AS "metricLabel",
  ec.addition_employees AS "employeeCount",
  dc.addition_dependents AS "dependentCount",
  ec.addition_employees + dc.addition_dependents AS "totalCount",
  ROUND(
    CASE
      WHEN ec.addition_employees + dc.addition_dependents = 0 THEN 0
      ELSE (ec.addition_employees::numeric * 100.0) /
           (ec.addition_employees + dc.addition_dependents)
    END,
    1
  ) AS "employeePercent",
  ROUND(
    CASE
      WHEN ec.addition_employees + dc.addition_dependents = 0 THEN 0
      ELSE (dc.addition_dependents::numeric * 100.0) /
           (ec.addition_employees + dc.addition_dependents)
    END,
    1
  ) AS "dependentPercent"
FROM employee_counts ec
CROSS JOIN dependent_counts dc

UNION ALL

SELECT
  'DELETIONS' AS "metricKey",
  'Deletions' AS "metricLabel",
  ec.deletion_employees AS "employeeCount",
  dc.deletion_dependents AS "dependentCount",
  ec.deletion_employees + dc.deletion_dependents AS "totalCount",
  ROUND(
    CASE
      WHEN ec.deletion_employees + dc.deletion_dependents = 0 THEN 0
      ELSE (ec.deletion_employees::numeric * 100.0) /
           (ec.deletion_employees + dc.deletion_dependents)
    END,
    1
  ) AS "employeePercent",
  ROUND(
    CASE
      WHEN ec.deletion_employees + dc.deletion_dependents = 0 THEN 0
      ELSE (dc.deletion_dependents::numeric * 100.0) /
           (ec.deletion_employees + dc.deletion_dependents)
    END,
    1
  ) AS "dependentPercent"
FROM employee_counts ec
CROSS JOIN dependent_counts dc

UNION ALL

SELECT
  'TOTAL_ACTIVE' AS "metricKey",
  'Total Active' AS "metricLabel",
  ec.active_employees AS "employeeCount",
  dc.active_dependents AS "dependentCount",
  ec.active_employees + dc.active_dependents AS "totalCount",
  ROUND(
    CASE
      WHEN ec.active_employees + dc.active_dependents = 0 THEN 0
      ELSE (ec.active_employees::numeric * 100.0) /
           (ec.active_employees + dc.active_dependents)
    END,
    1
  ) AS "employeePercent",
  ROUND(
    CASE
      WHEN ec.active_employees + dc.active_dependents = 0 THEN 0
      ELSE (dc.active_dependents::numeric * 100.0) /
           (ec.active_employees + dc.active_dependents)
    END,
    1
  ) AS "dependentPercent"
FROM employee_counts ec
CROSS JOIN dependent_counts dc
ORDER BY 1
$demo$,
    'SYSTEM',
    'SYSTEM',
    1
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES (
    report_id,
    'companyId',
    'Company ID',
    '###companyId###',
    'number',
    'SYSTEM',
    'SYSTEM',
    'input',
    'none',
    '{}'::jsonb,
    1
  );

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'metricKey', 'metricKey', 'Metric Key', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'metricLabel', 'metricLabel', 'Metric Label', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'employeeCount', 'employeeCount', 'Employee Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'dependentCount', 'dependentCount', 'Dependent Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalCount', 'totalCount', 'Total Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'employeePercent', 'employeePercent', 'Employee Percent', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'dependentPercent', 'dependentPercent', 'Dependent Percent', 'number', 'SYSTEM', 'SYSTEM', 'right');
END $$;

-- 6) Claims Summary
-- Updated by claude ai — TRD §3A.4 Pattern 1 (Aggregate/KPI):
-- Added INNER JOIN to policy + lookup_data for policyType filter.
-- Added optional date range (startDate/endDate), claimType (clm_type), claimStatus, memberType (derived from dependent_id).
-- Added amount fields, claimRatioPercent vs net_premium, and YoY (cur_year/prev_year CTEs) per §3A.4.
-- All table names kept as-is from original: policy_claim, policy, lookup_data.
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'claims_summary',
    'Claims Summary',
    'claims_summary',
    $claims_summary$
WITH cur_year AS (
  SELECT
    COUNT(c.id)                                                                                         AS total_count,
    COALESCE(SUM(c.claim_amount), 0)                                                                    AS total_amount,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN ('settled', 'paid')), 0)        AS paid_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN ('settled', 'paid'))                     AS paid_count,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN ('outstanding', 'pending')), 0) AS pending_amount,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) IN ('outstanding', 'pending'))              AS pending_count,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) = 'rejected')                               AS rejected_count,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) = 'closed')                                 AS closed_count,
    COUNT(c.id)         FILTER (WHERE LOWER(c.claim_status) = 'denied')                                 AS denied_count
  FROM policy_claim c
  INNER JOIN policy p       ON p.id = c.policy_id AND p.deleted_at IS NULL
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (NULLIF(###policyType###, '') IS NULL OR ld.lookup_key = ###policyType###)
    AND (NULLIF(###startDate###, '') IS NULL OR COALESCE(c.claim_dt, c.created_at::date) >= ###startDate###::date)
    AND (NULLIF(###endDate###, '') IS NULL OR COALESCE(c.claim_dt, c.created_at::date) <= ###endDate###::date)
    AND (NULLIF(###claimType###, '') IS NULL OR LOWER(COALESCE(c.clm_type, '')) LIKE '%' || LOWER(###claimType###) || '%')
    AND (NULLIF(###claimStatus###, '') IS NULL OR LOWER(c.claim_status) = LOWER(###claimStatus###))
    AND (
      NULLIF(###memberType###, '') IS NULL
      OR (LOWER(###memberType###) = 'employee'  AND c.dependent_id IS NULL)
      OR (LOWER(###memberType###) = 'dependent' AND c.dependent_id IS NOT NULL)
    )
),
prev_year AS (
  SELECT
    COUNT(c.id)                                                                                         AS total_count,
    COALESCE(SUM(c.claim_amount), 0)                                                                    AS total_amount,
    COALESCE(SUM(c.claim_amount) FILTER (WHERE LOWER(c.claim_status) IN ('settled', 'paid')), 0)        AS paid_amount
  FROM policy_claim c
  INNER JOIN policy p       ON p.id = c.policy_id AND p.deleted_at IS NULL
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE c.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND (NULLIF(###policyType###, '') IS NULL OR ld.lookup_key = ###policyType###)
    AND (NULLIF(###startDate###, '') IS NULL OR COALESCE(c.claim_dt, c.created_at::date) >= (###startDate###::date - INTERVAL '1 year'))
    AND (NULLIF(###endDate###, '') IS NULL OR COALESCE(c.claim_dt, c.created_at::date) <= (###endDate###::date - INTERVAL '1 year'))
    AND (NULLIF(###claimType###, '') IS NULL OR LOWER(COALESCE(c.clm_type, '')) LIKE '%' || LOWER(###claimType###) || '%')
    AND (NULLIF(###claimStatus###, '') IS NULL OR LOWER(c.claim_status) = LOWER(###claimStatus###))
    AND (
      NULLIF(###memberType###, '') IS NULL
      OR (LOWER(###memberType###) = 'employee'  AND c.dependent_id IS NULL)
      OR (LOWER(###memberType###) = 'dependent' AND c.dependent_id IS NOT NULL)
    )
),
net_premium_agg AS (
  SELECT COALESCE(SUM(p.net_premium), 0) AS total_net_premium
  FROM policy p
  INNER JOIN lookup_data ld ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND p.deleted_at IS NULL
    AND (NULLIF(###policyType###, '') IS NULL OR ld.lookup_key = ###policyType###)
)
SELECT
  cy.total_count                                                                          AS "totalClaimsCount",
  cy.total_amount                                                                         AS "totalClaimsAmount",
  cy.paid_amount                                                                          AS "paidClaimsAmount",
  cy.paid_count                                                                           AS "paidClaimsCount",
  cy.pending_amount                                                                       AS "pendingClaimsAmount",
  cy.pending_count                                                                        AS "pendingClaimsCount",
  cy.rejected_count                                                                       AS "rejectedCount",
  cy.closed_count                                                                         AS "closedCount",
  cy.denied_count                                                                         AS "deniedCount",
  ROUND(cy.paid_amount * 100.0 / NULLIF(np.total_net_premium, 0), 1)                    AS "claimRatioPercent",
  py.total_count                                                                          AS "totalClaimsCountPrevYear",
  py.total_amount                                                                         AS "totalClaimsAmountPrevYear",
  py.paid_amount                                                                          AS "paidClaimsAmountPrevYear",
  ROUND((cy.total_amount - py.total_amount) * 100.0 / NULLIF(py.total_amount, 0), 1)    AS "totalClaimsAmountYoYChangePercent",
  ROUND((cy.paid_amount  - py.paid_amount)  * 100.0 / NULLIF(py.paid_amount,  0), 1)    AS "paidClaimsAmountYoYChangePercent"
FROM cur_year cy
CROSS JOIN prev_year py
CROSS JOIN net_premium_agg np
$claims_summary$,
    'SYSTEM',
    'SYSTEM',
    6
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES
    (report_id, 'companyId',   'Company ID',   '###companyId###',   'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 1),
    (report_id, 'policyType',  'Policy Type',  '###policyType###',  'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 2),
    (report_id, 'startDate',   'Start Date',   '###startDate###',   'date',   'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 3),
    (report_id, 'endDate',     'End Date',     '###endDate###',     'date',   'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 4),
    (report_id, 'claimType',   'Claim Type',   '###claimType###',   'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 5),
    (report_id, 'claimStatus', 'Claim Status', '###claimStatus###', 'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 6),
    (report_id, 'memberType',  'Member Type',  '###memberType###',  'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 7);

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'totalClaimsCount',                  'totalClaimsCount',                  'Total Claims Count',                 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalClaimsAmount',                 'totalClaimsAmount',                 'Total Claims Amount',                'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'paidClaimsAmount',                  'paidClaimsAmount',                  'Paid Claims Amount',                 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'paidClaimsCount',                   'paidClaimsCount',                   'Paid Claims Count',                  'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'pendingClaimsAmount',               'pendingClaimsAmount',               'Pending Claims Amount',              'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'pendingClaimsCount',                'pendingClaimsCount',                'Pending Claims Count',               'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'rejectedCount',                     'rejectedCount',                     'Rejected Count',                     'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'closedCount',                       'closedCount',                       'Closed Count',                       'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'deniedCount',                       'deniedCount',                       'Denied Count',                       'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'claimRatioPercent',                 'claimRatioPercent',                 'Claim Ratio Percent',                'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalClaimsCountPrevYear',          'totalClaimsCountPrevYear',          'Total Claims Count (Prev Year)',     'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalClaimsAmountPrevYear',         'totalClaimsAmountPrevYear',         'Total Claims Amount (Prev Year)',    'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'paidClaimsAmountPrevYear',          'paidClaimsAmountPrevYear',          'Paid Claims Amount (Prev Year)',     'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalClaimsAmountYoYChangePercent', 'totalClaimsAmountYoYChangePercent', 'Total Claims Amount YoY Change (%)', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'paidClaimsAmountYoYChangePercent',  'paidClaimsAmountYoYChangePercent',  'Paid Claims Amount YoY Change (%)',  'number', 'SYSTEM', 'SYSTEM', 'right');
END $$;

-- 7) Processed Claims
-- Updated by claude ai — TRD §8 (ibp_hr_process_claims_list pattern):
-- Removed dead commented-out JOIN. Added deleted_at guards on all joined tables.
-- Added lookup_data JOIN for policyType filter.
-- Added date range (startDate/endDate), claimType, search (employee name/claim number/hospital),
-- and pagination (limit/offset) per TRD §8 ibp_hr_process_claims_list.
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'processed_claims',
    'Processed Claims',
    'processed_claims',
    $processed_claims$
WITH latest_settlement AS (
  SELECT DISTINCT ON (pcs.claim_id)
    pcs.claim_id,
    pcs.clm_sett_amt  AS settled_amount,
    pcs.clm_sett_date AS settlement_date,
    pcs.clm_sett_no   AS settlement_no,
    pcs.status_key
  FROM policy_claim_settlement pcs
  ORDER BY pcs.claim_id, pcs.clm_sett_date DESC NULLS LAST, pcs.id DESC
)
SELECT
  c.id                                                            AS claim_id,
  COALESCE(c.claim_number, c.id::text)                           AS claim_number,
  pe.company_employee_id                                         AS employee_id,
  pe.employee_name,
  pe.designation                                                 AS employee_subtitle,
  CASE
    WHEN d.id IS NULL THEN 'Self'
    ELSE COALESCE(d.relation, d.relationship_type, 'Dependent')
  END                                                             AS relation,
  c.employee_tpa_id                                              AS tpa_id,
  c.clm_type,
  COALESCE(c.claim_dt, c.created_at::date)                      AS claim_date,
  c.claim_amount,
  COALESCE(ls.settled_amount, 0)                                 AS settled_amount,
  c.claim_status                                                 AS status,
  c.policy_id,
  p.insurer_policy_number                                        AS policy_number,
  comp.company_name
FROM policy_claim c
INNER JOIN policy p                      ON p.id  = c.policy_id       AND p.deleted_at  IS NULL
INNER JOIN lookup_data ld                ON ld.id = p.policy_type_lid  AND ld.deleted_at IS NULL
JOIN  policy_enrollment_employee pe      ON pe.id = c.employee_id      AND pe.deleted_at IS NULL
LEFT JOIN policy_enrollment_dependent d  ON d.id  = c.dependent_id     AND d.deleted_at  IS NULL
LEFT JOIN latest_settlement ls           ON ls.claim_id = c.id
LEFT JOIN company comp                   ON comp.id = p.company_id
WHERE p.company_id = ###companyId###
  AND c.deleted_at IS NULL
  AND LOWER(c.claim_status) IN ('settled', 'paid', 'closed', 'rejected', 'denied')
  AND (NULLIF(###policyType###, '') IS NULL OR ld.lookup_key = ###policyType###)
  AND (NULLIF(###startDate###, '') IS NULL OR COALESCE(c.claim_dt, c.created_at::date) >= ###startDate###::date)
  AND (NULLIF(###endDate###, '') IS NULL OR COALESCE(c.claim_dt, c.created_at::date) <= ###endDate###::date)
  AND (NULLIF(###claimType###, '') IS NULL OR LOWER(COALESCE(c.clm_type, '')) LIKE '%' || LOWER(###claimType###) || '%')
  AND (
    NULLIF(###search###, '') IS NULL
    OR pe.employee_name ILIKE '%' || ###search### || '%'
    OR COALESCE(pe.full_name, '') ILIKE '%' || ###search### || '%'
    OR COALESCE(c.claim_number, '') ILIKE '%' || ###search### || '%'
    OR COALESCE(c.clm_hospital, '') ILIKE '%' || ###search### || '%'
  )
ORDER BY c.created_at DESC
LIMIT  COALESCE(NULLIF(###limit###,  '')::int, 50)
OFFSET COALESCE(NULLIF(###offset###, '')::int,  0)
$processed_claims$,
    'SYSTEM',
    'SYSTEM',
    7
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES
    (report_id, 'companyId',  'Company ID',  '###companyId###',  'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 1),
    (report_id, 'policyType', 'Policy Type', '###policyType###', 'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 2),
    (report_id, 'startDate',  'Start Date',  '###startDate###',  'date',   'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 3),
    (report_id, 'endDate',    'End Date',    '###endDate###',    'date',   'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 4),
    (report_id, 'claimType',  'Claim Type',  '###claimType###',  'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 5),
    (report_id, 'search',     'Search',      '###search###',     'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 6),
    (report_id, 'limit',      'Limit',       '###limit###',      'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 7),
    (report_id, 'offset',     'Offset',      '###offset###',     'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 8);

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'claim_id',          'claim_id',          'Claim ID',          'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'claim_number',      'claim_number',      'Claim Number',      'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'employee_id',       'employee_id',       'Employee ID',       'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'employee_name',     'employee_name',     'Employee Name',     'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'employee_subtitle', 'employee_subtitle', 'Employee Subtitle', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'relation',          'relation',          'Relation',          'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'tpa_id',            'tpa_id',            'TPA ID',            'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'clm_type',          'clm_type',          'Claim Type',        'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'claim_date',        'claim_date',        'Claim Date',        'date',   'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'claim_amount',      'claim_amount',      'Claim Amount',      'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'settled_amount',    'settled_amount',    'Settled Amount',    'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'status',            'status',            'Status',            'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'policy_id',         'policy_id',         'Policy ID',         'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'policy_number',     'policy_number',     'Policy Number',     'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'company_name',      'company_name',      'Company Name',      'string', 'SYSTEM', 'SYSTEM', 'left');
END $$;

-- 8) Claims by Hospital
-- Updated by claude ai — TRD §3.3 soft-delete enforcement:
-- Added AND p.deleted_at IS NULL to the policy JOIN (was missing).
-- No other changes — no policyType/date/claimType filters added (intentional all-policy scope).
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'claims_by_hospital',
    'Claims by Hospital',
    'claims_by_hospital',
    $claims_hospital$
WITH latest_settlement AS (
  SELECT DISTINCT ON (pcs.claim_id)
    pcs.claim_id,
    pcs.clm_sett_amt AS settlement_amount,
    pcs.clm_sett_date AS settlement_date
  FROM policy_claim_settlement pcs
  ORDER BY pcs.claim_id, pcs.clm_sett_date DESC NULLS LAST, pcs.id DESC
),
base_claims AS (
  SELECT
    c.id AS claim_id,
    h.id AS hospital_id,
    h.name AS hospital_name,
    COALESCE(a.city_name, '') AS city_name,
    COALESCE(a.state_name, '') AS state_name,
    COALESCE(c.claim_description, c.clm_type, 'Unknown') AS condition_disease,
    c.claim_amount,
    c.claim_dt,
    ls.settlement_amount,
    ls.settlement_date,
    CASE
      WHEN c.claim_dt IS NOT NULL AND ls.settlement_date IS NOT NULL
        THEN ls.settlement_date - c.claim_dt
      ELSE NULL
    END AS settlement_days
  FROM policy_claim c
  JOIN policy p
    ON p.id = c.policy_id AND p.deleted_at IS NULL
  JOIN mstr_hospital h
    ON h.id = c.hospital_id
   AND h.deleted_at IS NULL
  LEFT JOIN mstr_hospital_address a
    ON a.id = h.address_id
   AND a.deleted_at IS NULL
  LEFT JOIN latest_settlement ls
    ON ls.claim_id = c.id
  WHERE p.company_id = ###companyId###
    AND c.deleted_at IS NULL
)
SELECT
  hospital_id,
  hospital_name,
  city_name AS city,
  state_name AS state,
  COUNT(*) AS total_claims,
  COALESCE(SUM(claim_amount), 0) AS total_amount,
  ROUND(COALESCE(AVG(settlement_days), 0), 1) AS avg_settlement,
  (
    SELECT bc2.condition_disease
    FROM base_claims bc2
    WHERE bc2.hospital_id = base_claims.hospital_id
    GROUP BY bc2.condition_disease
    ORDER BY COUNT(*) DESC, COALESCE(SUM(bc2.claim_amount), 0) DESC
    LIMIT 1
  ) AS top_disease
FROM base_claims
GROUP BY hospital_id, hospital_name, city_name, state_name
ORDER BY total_amount DESC
$claims_hospital$,
    'SYSTEM',
    'SYSTEM',
    8
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES (
    report_id,
    'companyId',
    'Company ID',
    '###companyId###',
    'number',
    'SYSTEM',
    'SYSTEM',
    'input',
    'none',
    '{}'::jsonb,
    1
  );

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'hospital_id', 'hospital_id', 'Hospital ID', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'hospital_name', 'hospital_name', 'Hospital Name', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'city', 'city', 'City', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'state', 'state', 'State', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'total_claims', 'total_claims', 'Total Claims', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'total_amount', 'total_amount', 'Total Amount', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'avg_settlement', 'avg_settlement', 'Avg Settlement', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'top_disease', 'top_disease', 'Top Disease', 'string', 'SYSTEM', 'SYSTEM', 'left');
END $$;

-- 2) Company Enrollment Status
-- Updated by claude ai — TRD §3.3 soft-delete enforcement:
-- Added AND p.deleted_at IS NULL to policy_scope WHERE clause (was missing).
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'company_enrollment_status',
    'Company Enrollment Status',
    'company_enrollment_status',
    $enroll$
WITH policy_scope AS (
  SELECT
    p.id AS policy_id
  FROM policy p
  INNER JOIN lookup_data ld
    ON ld.id = p.policy_type_lid
  WHERE p.company_id = ###companyId###
    AND p.deleted_at IS NULL
    AND ld.deleted_at IS NULL
    -- AND ld.lookup_key IN (
    --   'POLICY_TYPE_GMC',
    --   'POLICY_TYPE_GPA',
    --   'POLICY_TYPE_GTL'
    -- )
),
employee_scope AS (
  SELECT DISTINCT
    pee.id AS employee_id,
    pee.user_id
  FROM policy_enrollment_employee pee
  INNER JOIN policy_enrollment_employee_policy_map emp_map
    ON emp_map.employee_id = pee.id
  INNER JOIN policy_scope ps
    ON ps.policy_id = emp_map.policy_id
  WHERE pee.deleted_at IS NULL
    AND emp_map.deleted_at IS NULL
),
total_scope AS (
  SELECT COUNT(*) AS total_employees
  FROM employee_scope
),
latest_login AS (
  SELECT
    ual.user_id,
    MAX(ual.action_date) AS last_login_at
  FROM user_activity_log ual
  WHERE ual.activity_key = 'LOGGED_IN'
    AND ual.activity_category = 'AUTH'
    AND ual.deleted_at IS NULL
  GROUP BY ual.user_id
),
latest_enrollment AS (
  SELECT DISTINCT ON (pe.employee_id)
    pe.employee_id,
    pe.employee_enrollment_status_key
  FROM policy_employee_enrollment pe
  INNER JOIN policy_scope ps
    ON ps.policy_id = pe.policy_id
  WHERE pe.deleted_at IS NULL
  ORDER BY pe.employee_id, pe.updated_at DESC, pe.id DESC
),
logged_in AS (
  SELECT COUNT(DISTINCT es.employee_id) AS count
  FROM employee_scope es
  INNER JOIN latest_login ll
    ON ll.user_id = es.user_id
),
not_logged_in AS (
  SELECT COUNT(DISTINCT es.employee_id) AS count
  FROM employee_scope es
  LEFT JOIN latest_login ll
    ON ll.user_id = es.user_id
  WHERE ll.last_login_at IS NULL
),
enrollment_confirmed AS (
  SELECT COUNT(DISTINCT employee_id) AS count
  FROM latest_enrollment
  WHERE employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
)
SELECT
  'LOGGED_IN' AS "metricKey",
  'Logged In' AS "metricLabel",
  li.count AS "count",
  ROUND(
    CASE
      WHEN ts.total_employees = 0 THEN 0
      ELSE (li.count::numeric * 100.0) / ts.total_employees
    END,
    1
  ) AS "percent"
FROM logged_in li
CROSS JOIN total_scope ts

UNION ALL

SELECT
  'NOT_LOGGED_IN' AS "metricKey",
  'Not Logged In' AS "metricLabel",
  nli.count AS "count",
  ROUND(
    CASE
      WHEN ts.total_employees = 0 THEN 0
      ELSE (nli.count::numeric * 100.0) / ts.total_employees
    END,
    1
  ) AS "percent"
FROM not_logged_in nli
CROSS JOIN total_scope ts

UNION ALL

SELECT
  'ENROLLMENT_CONFIRMED' AS "metricKey",
  'Enrollment Confirmed' AS "metricLabel",
  ec.count AS "count",
  ROUND(
    CASE
      WHEN ts.total_employees = 0 THEN 0
      ELSE (ec.count::numeric * 100.0) / ts.total_employees
    END,
    1
  ) AS "percent"
FROM enrollment_confirmed ec
CROSS JOIN total_scope ts
ORDER BY 1
$enroll$,
    'SYSTEM',
    'SYSTEM',
    2
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES (
    report_id,
    'companyId',
    'Company ID',
    '###companyId###',
    'number',
    'SYSTEM',
    'SYSTEM',
    'input',
    'none',
    '{}'::jsonb,
    1
  );

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'metricKey', 'metricKey', 'Metric Key', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'metricLabel', 'metricLabel', 'Metric Label', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'count', 'count', 'Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'percent', 'percent', 'Percent', 'number', 'SYSTEM', 'SYSTEM', 'right');
END $$;

-- 3) Top Claim Insights by Member
-- Updated by claude ai — TRD §3.3 soft-delete enforcement:
-- Added AND p.deleted_at IS NULL to claim_scope WHERE clause (was missing).
-- Same fix applied to the UPDATE statement below.
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'top_claim_insights_by_member',
    'Top Claim Insights By Member',
    'top_claim_insights_by_member',
    $claim_member$
WITH claim_scope AS (
  SELECT
    pc.id,
    pc.employee_name,
    pc.patient_name,
    pc.claim_amount,
    pc.claim_description
  FROM policy_claim pc
  INNER JOIN policy p
    ON p.id = pc.policy_id
  INNER JOIN lookup_data ld
    ON ld.id = p.policy_type_lid
  WHERE p.company_id = ###companyId###
    AND p.deleted_at IS NULL
    AND pc.deleted_at IS NULL
    AND ld.deleted_at IS NULL
    -- AND ld.lookup_key IN (
    --   'POLICY_TYPE_GMC',
    --   'POLICY_TYPE_GPA',
    --   'POLICY_TYPE_GTL'
    -- )
)
SELECT
  COALESCE(
    NULLIF(TRIM(COALESCE(cs.employee_name, cs.patient_name)), ''),
    'Unknown'
  ) AS "memberName",
  COUNT(*) AS "claimCount",
  COALESCE(SUM(cs.claim_amount), 0) AS "totalClaimAmount",
  COALESCE(AVG(cs.claim_amount), 0) AS "avgClaimAmount"
FROM claim_scope cs
GROUP BY COALESCE(
  NULLIF(TRIM(COALESCE(cs.employee_name, cs.patient_name)), ''),
  'Unknown'
)
ORDER BY "totalClaimAmount" DESC
$claim_member$,
    'SYSTEM',
    'SYSTEM',
    3
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES (
    report_id,
    'companyId',
    'Company ID',
    '###companyId###',
    'number',
    'SYSTEM',
    'SYSTEM',
    'input',
    'none',
    '{}'::jsonb,
    1
  );

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'memberName', 'memberName', 'Member Name', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'claimCount', 'claimCount', 'Claim Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalClaimAmount', 'totalClaimAmount', 'Total Claim Amount', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'avgClaimAmount', 'avgClaimAmount', 'Average Claim Amount', 'number', 'SYSTEM', 'SYSTEM', 'right');
END $$;

UPDATE admin_reports
SET query = $q$
WITH claim_scope AS (
  SELECT
    pc.id,
    pc.employee_name,
    pc.patient_name,
    pc.claim_amount,
    pc.claim_description
  FROM policy_claim pc
  INNER JOIN policy p
    ON p.id = pc.policy_id
  INNER JOIN lookup_data ld
    ON ld.id = p.policy_type_lid
  WHERE p.company_id = ###companyId###
    AND pc.deleted_at IS NULL
    AND ld.deleted_at IS NULL
    -- AND ld.lookup_key IN (
    --   'POLICY_TYPE_GMC',
    --   'POLICY_TYPE_GPA',
    --   'POLICY_TYPE_GTL'
    -- )
)
SELECT
  COALESCE(
    NULLIF(TRIM(COALESCE(cs.employee_name, cs.patient_name)), ''),
    'Unknown'
  ) AS "memberName",
  COUNT(*) AS "claimCount",
  COALESCE(SUM(cs.claim_amount), 0) AS "totalClaimAmount",
  COALESCE(AVG(cs.claim_amount), 0) AS "avgClaimAmount"
FROM claim_scope cs
GROUP BY COALESCE(
  NULLIF(TRIM(COALESCE(cs.employee_name, cs.patient_name)), ''),
  'Unknown'
)
ORDER BY "totalClaimAmount" DESC
$q$
WHERE name = 'top_claim_insights_by_member';


-- 4) Top Claim Insights by Hospital
-- Updated by claude ai — TRD §3.3 soft-delete enforcement:
-- Added AND p.deleted_at IS NULL to claim_scope WHERE clause (was missing).
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'top_claim_insights_by_hospital',
    'Top Claim Insights By Hospital',
    'top_claim_insights_by_hospital',
    $claim_hospital$
WITH claim_scope AS (
  SELECT
    pc.id,
    pc.claim_amount,
    pc.clm_hospital,
    pc.hospital_id
  FROM policy_claim pc
  INNER JOIN policy p
    ON p.id = pc.policy_id
  INNER JOIN lookup_data ld
    ON ld.id = p.policy_type_lid
  WHERE p.company_id = ###companyId###
    AND p.deleted_at IS NULL
    AND pc.deleted_at IS NULL
    AND ld.deleted_at IS NULL
    -- AND ld.lookup_key IN (
    --   'POLICY_TYPE_GMC',
    --   'POLICY_TYPE_GPA',
    --   'POLICY_TYPE_GTL'
    -- )
)
SELECT
  COALESCE(
    NULLIF(TRIM(h.name), ''),
    NULLIF(TRIM(cs.clm_hospital), ''),
    'Unknown'
  ) AS "hospitalName",
  COUNT(*) AS "claimCount",
  COALESCE(SUM(cs.claim_amount), 0) AS "totalClaimAmount",
  COALESCE(AVG(cs.claim_amount), 0) AS "avgClaimAmount"
FROM claim_scope cs
LEFT JOIN mstr_hospital h
  ON h.id = cs.hospital_id
 AND h.deleted_at IS NULL
GROUP BY COALESCE(
  NULLIF(TRIM(h.name), ''),
  NULLIF(TRIM(cs.clm_hospital), ''),
  'Unknown'
)
ORDER BY "totalClaimAmount" DESC
$claim_hospital$,
    'SYSTEM',
    'SYSTEM',
    4
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES (
    report_id,
    'companyId',
    'Company ID',
    '###companyId###',
    'number',
    'SYSTEM',
    'SYSTEM',
    'input',
    'none',
    '{}'::jsonb,
    1
  );

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'hospitalName', 'hospitalName', 'Hospital Name', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'claimCount', 'claimCount', 'Claim Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalClaimAmount', 'totalClaimAmount', 'Total Claim Amount', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'avgClaimAmount', 'avgClaimAmount', 'Average Claim Amount', 'number', 'SYSTEM', 'SYSTEM', 'right');
END $$;

-- 5) Top Claim Insights by Disease
-- Updated by claude ai — TRD §3.3 soft-delete enforcement:
-- Added AND p.deleted_at IS NULL to claim_scope WHERE clause (was missing).
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'top_claim_insights_by_disease',
    'Top Claim Insights By Disease',
    'top_claim_insights_by_disease',
    $claim_disease$
WITH claim_scope AS (
  SELECT
    pc.id,
    pc.claim_amount,
    pc.claim_description
  FROM policy_claim pc
  INNER JOIN policy p
    ON p.id = pc.policy_id
  INNER JOIN lookup_data ld
    ON ld.id = p.policy_type_lid
  WHERE p.company_id = ###companyId###
    AND p.deleted_at IS NULL
    AND pc.deleted_at IS NULL
    AND ld.deleted_at IS NULL
    -- AND ld.lookup_key IN (
    --   'POLICY_TYPE_GMC',
    --   'POLICY_TYPE_GPA',
    --   'POLICY_TYPE_GTL'
    -- )
)
SELECT
  COALESCE(
    NULLIF(
      LEFT(
        REGEXP_REPLACE(COALESCE(cs.claim_description, ''), '\s+', ' ', 'g'),
        80
      ),
      ''
    ),
    'Unknown'
  ) AS "disease",
  COUNT(*) AS "claimCount",
  COALESCE(SUM(cs.claim_amount), 0) AS "totalClaimAmount",
  COALESCE(AVG(cs.claim_amount), 0) AS "avgClaimAmount"
FROM claim_scope cs
GROUP BY COALESCE(
  NULLIF(
    LEFT(
      REGEXP_REPLACE(COALESCE(cs.claim_description, ''), '\s+', ' ', 'g'),
      80
    ),
    ''
  ),
  'Unknown'
)
ORDER BY "totalClaimAmount" DESC
$claim_disease$,
    'SYSTEM',
    'SYSTEM',
    5
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES (
    report_id,
    'companyId',
    'Company ID',
    '###companyId###',
    'number',
    'SYSTEM',
    'SYSTEM',
    'input',
    'none',
    '{}'::jsonb,
    1
  );

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'disease', 'disease', 'Disease', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'claimCount', 'claimCount', 'Claim Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalClaimAmount', 'totalClaimAmount', 'Total Claim Amount', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'avgClaimAmount', 'avgClaimAmount', 'Average Claim Amount', 'number', 'SYSTEM', 'SYSTEM', 'right');
END $$;

-- 7) IBP HR Endorsement Listing
-- Updated by claude ai — TRD §3.3 soft-delete enforcement:
-- Added AND e.deleted_at IS NULL on endorsement table (was missing).
-- Added deleted_at IS NULL guards on all three LEFT JOINs (policy, company, users).
-- Added missing PERFORM setval calls after RETURNING id (present in all other blocks, was absent here).
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'ibp_hr_endorsement_listing',
    'IBP HR Endorsement Listing',
    'ibp_hr_endorsement_listing',
    $endorsement$
SELECT
  e.id AS "endorsementId",
  e.policy_id AS "policyId",
  p.policy_name AS "policyName",
  e.company_id AS "companyId",
  c.company_name AS "companyName",
  e.endorsement_type AS "endorsementType",
  e.endorsement_date AS "endorsementDate",
  e.endorsement_entry_date AS "endorsementEntryDate",
  e.endorsement_effective_date AS "endorsementEffectiveDate",
  e.client_confirmation_date AS "clientConfirmationDate",
  e.tpa_acknowledged_date AS "tpaAcknowledgedDate",
  e.insurer_endorsement_number AS "insurerEndorsementNumber",
  e.provisional_endorsement_number AS "provisionalEndorsementNumber",
  e.insurer_acknowledgement_number AS "insurerAcknowledgementNumber",
  e.insurer_endorsement_date AS "insurerEndorsementDate",
  e.insurer_communication_date AS "insurerCommunicationDate",
  e.endorsment_file_id AS "endorsementFileId",
  e.ack_file_id AS "ackFileId",
  e.tpa_document_id AS "tpaDocumentId",
  e.tpa_error_file_id AS "tpaErrorFileId",
  e.endorsment_count AS "endorsementCount",
  e.endorsment_dependent_count AS "endorsementDependentCount",
  e.employee_endorsement_addition_count AS "employeeAdditionCount",
  e.employee_endorsement_deletion_count AS "employeeDeletionCount",
  (COALESCE(e.employee_endorsement_addition_count, 0) +
   COALESCE(e.employee_endorsement_deletion_count, 0)) AS "totalCount",
  e.sum_insured AS "sumInsured",
  e.premium_at_inception AS "premiumAtInception",
  e.gross_premium AS "grossPremium",
  e.net_premium AS "netPremium",
  e.premium_collected AS "premiumCollected",
  e.gst_amount AS "gstAmount",
  e.tpa_processed_count AS "tpaProcessedCount",
  e.tpa_error_count AS "tpaErrorCount",
  CONCAT(u.first_name, ' ', u.last_name) AS "uploadedBy"
FROM endorsement e
LEFT JOIN policy p  ON p.id  = e.policy_id  AND p.deleted_at IS NULL
LEFT JOIN company c ON c.id  = e.company_id  AND c.deleted_at IS NULL
LEFT JOIN users u   ON u.id  = e.created_by  AND u.deleted_at IS NULL
WHERE e.company_id = ###companyId###
  AND e.deleted_at IS NULL
$endorsement$,
    'SYSTEM',
    'SYSTEM',
    6
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES (
    report_id,
    'companyId',
    'Company ID',
    '###companyId###',
    'number',
    'SYSTEM',
    'SYSTEM',
    'input',
    'none',
    '{}'::jsonb,
    1
  );

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'endorsementId', 'endorsementId', 'Endorsement ID', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'policyId', 'policyId', 'Policy ID', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'policyName', 'policyName', 'Policy Name', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'companyId', 'companyId', 'Company ID', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'companyName', 'companyName', 'Company Name', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'endorsementType', 'endorsementType', 'Endorsement Type', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'endorsementDate', 'endorsementDate', 'Endorsement Date', 'date', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'endorsementEntryDate', 'endorsementEntryDate', 'Endorsement Entry Date', 'date', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'endorsementEffectiveDate', 'endorsementEffectiveDate', 'Endorsement Effective Date', 'date', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'clientConfirmationDate', 'clientConfirmationDate', 'Client Confirmation Date', 'date', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'tpaAcknowledgedDate', 'tpaAcknowledgedDate', 'TPA Acknowledged Date', 'date', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'insurerEndorsementNumber', 'insurerEndorsementNumber', 'Insurer Endorsement Number', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'provisionalEndorsementNumber', 'provisionalEndorsementNumber', 'Provisional Endorsement Number', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'insurerAcknowledgementNumber', 'insurerAcknowledgementNumber', 'Insurer Acknowledgement Number', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'insurerEndorsementDate', 'insurerEndorsementDate', 'Insurer Endorsement Date', 'date', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'insurerCommunicationDate', 'insurerCommunicationDate', 'Insurer Communication Date', 'date', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'endorsementFileId', 'endorsementFileId', 'Endorsement File ID', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'ackFileId', 'ackFileId', 'Ack File ID', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'tpaDocumentId', 'tpaDocumentId', 'TPA Document ID', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'tpaErrorFileId', 'tpaErrorFileId', 'TPA Error File ID', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'endorsementCount', 'endorsementCount', 'Endorsement Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'endorsementDependentCount', 'endorsementDependentCount', 'Endorsement Dependent Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'employeeAdditionCount', 'employeeAdditionCount', 'Employee Addition Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'employeeDeletionCount', 'employeeDeletionCount', 'Employee Deletion Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalCount', 'totalCount', 'Total Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'sumInsured', 'sumInsured', 'Sum Insured', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'premiumAtInception', 'premiumAtInception', 'Premium At Inception', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'grossPremium', 'grossPremium', 'Gross Premium', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'netPremium', 'netPremium', 'Net Premium', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'premiumCollected', 'premiumCollected', 'Premium Collected', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'gstAmount', 'gstAmount', 'GST Amount', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'tpaProcessedCount', 'tpaProcessedCount', 'TPA Processed Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'tpaErrorCount', 'tpaErrorCount', 'TPA Error Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'uploadedBy', 'uploadedBy', 'Uploaded By', 'string', 'SYSTEM', 'SYSTEM', 'left');
END $$;

-- 8) IBP HR Employee Listing
-- Updated by claude ai:
-- Added LIMIT/OFFSET pagination (TRD §7 ibp_hr_enrollment_employee_list pattern — list reports require pagination).
-- Added missing PERFORM setval calls after RETURNING id (was absent, present in all other blocks).
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'ibp_hr_employee_listing',
    'IBP HR Employee Listing',
    'ibp_hr_employee_listing',
    $employee$
WITH base_employees AS (
  SELECT
    pee.id AS "employeeId",
    pee.company_id AS "companyId",
    pee.user_id AS "userId",
    pee.company_employee_id AS "companyEmployeeId",
    pee.employee_name AS "employeeName",
    pee.full_name AS "fullName",
    pee.email_enc AS "email",
    pee.gender AS "gender",
    pee.date_of_birth_enc AS "dateOfBirth",
    pee.phone_number_enc AS "mobile"
  FROM policy_enrollment_employee pee
  WHERE pee.company_id = ###companyId###
    AND pee.deleted_at IS NULL
    AND (
      NULLIF(###search###, '') IS NULL
      OR pee.employee_name ILIKE '%' || ###search### || '%'
      OR pee.full_name ILIKE '%' || ###search### || '%'
      OR pee.email_enc ILIKE '%' || ###search### || '%'
      OR pee.company_employee_id ILIKE '%' || ###search### || '%'
    )
),
latest_enrollment AS (
  SELECT DISTINCT ON (pe.employee_id, pe.company_id)
    pe.employee_id,
    pe.company_id,
    pe.employee_enrollment_status_key,
    pe.sum_insured
  FROM policy_employee_enrollment pe
  INNER JOIN base_employees be
    ON be."employeeId" = pe.employee_id
   AND be."companyId" = pe.company_id
  WHERE pe.deleted_at IS NULL
  ORDER BY pe.employee_id, pe.company_id, pe.updated_at DESC, pe.id DESC
),
dependents AS (
  SELECT
    employee_id,
    COUNT(*) AS dependents_count
  FROM policy_enrollment_dependent
  WHERE deleted_at IS NULL
  GROUP BY employee_id
),
last_login AS (
  SELECT
    ual.user_id,
    MAX(ual.action_date) AS last_login_at
  FROM user_activity_log ual
  INNER JOIN base_employees be
    ON be."userId" = ual.user_id
  WHERE ual.activity_key = 'LOGGED_IN'
    AND ual.activity_category = 'AUTH'
    AND ual.deleted_at IS NULL
  GROUP BY ual.user_id
)
SELECT
  be."employeeId",
  be."companyEmployeeId",
  be."employeeName",
  be."fullName",
  be."email",
  be."gender",
  be."dateOfBirth",
  be."mobile",
  COALESCE(le.employee_enrollment_status_key, 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') AS "enrollStatus",
  COALESCE(le.sum_insured, 0) AS "sumInsured",
  COALESCE(dep.dependents_count, 0) AS "dependentsCount",
  CONCAT('uploads/e-cards/company/', be."companyId", '/', be."companyEmployeeId", '.pdf') AS "ecardKey",
  ll.last_login_at AS "lastLoginAt"
FROM base_employees be
LEFT JOIN latest_enrollment le
  ON le.employee_id = be."employeeId"
 AND le.company_id = be."companyId"
LEFT JOIN dependents dep
  ON dep.employee_id = be."employeeId"
LEFT JOIN last_login ll
  ON ll.user_id = be."userId"
ORDER BY be."employeeId" DESC
LIMIT  COALESCE(NULLIF(###limit###,  '')::int, 50)
OFFSET COALESCE(NULLIF(###offset###, '')::int,  0)
$employee$,
    'SYSTEM',
    'SYSTEM',
    7
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES
    (
      report_id,
      'companyId',
      'Company ID',
      '###companyId###',
      'number',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      1
    ),
    (
      report_id,
      'search',
      'Search',
      '###search###',
      'string',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      2
    ),
    (report_id, 'limit',  'Limit',  '###limit###',  'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 3),
    (report_id, 'offset', 'Offset', '###offset###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 4);

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'employeeId', 'employeeId', 'Employee ID', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'companyEmployeeId', 'companyEmployeeId', 'Company Employee ID', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'employeeName', 'employeeName', 'Employee Name', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'fullName', 'fullName', 'Full Name', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'email', 'email', 'Email', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'gender', 'gender', 'Gender', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'dateOfBirth', 'dateOfBirth', 'Date Of Birth', 'date', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'mobile', 'mobile', 'Mobile', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'enrollStatus', 'enrollStatus', 'Enroll Status', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'sumInsured', 'sumInsured', 'Sum Insured', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'dependentsCount', 'dependentsCount', 'Dependents Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'ecardKey', 'ecardKey', 'E-Card Key', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'lastLoginAt', 'lastLoginAt', 'Last Login At', 'date', 'SYSTEM', 'SYSTEM', 'left');
END $$;



-- Updated by claude ai
-- 9) Company Policy Details Summary
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'company_policy_details_summary',
    'Company Policy Details Summary',
    'company_policy_details_summary',
    $details$
WITH policy_scope AS (
  SELECT
    p.id AS policy_id,
    p.company_id,
    p.policy_name,
    p.policy_from,
    p.policy_to,
    COALESCE(p.premium_at_inception, 0) AS premium_at_inception,
    COALESCE(p.net_premium, 0) AS policy_net_premium,
    ld.lookup_key AS policy_type_key,
    ld.value AS policy_type_name
  FROM policy p
  INNER JOIN lookup_data ld
    ON ld.id = p.policy_type_lid
  WHERE p.company_id = ###companyId###
    AND p.deleted_at IS NULL
    AND ld.deleted_at IS NULL
    -- AND ld.lookup_key IN ('POLICY_TYPE_GMC', 'POLICY_TYPE_GPA', 'POLICY_TYPE_GTL')
),
employee_stats AS (
  SELECT
    pee.policy_id,
    COUNT(*) AS total_employees,
    COUNT(*) FILTER (
      WHERE pee.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
    ) AS enrolled_employees,
    COUNT(*) FILTER (
      WHERE pee.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS'
    ) AS in_progress_employees
  FROM policy_employee_enrollment pee
  WHERE pee.deleted_at IS NULL
  GROUP BY pee.policy_id
),
dependent_stats AS (
  SELECT
    ped.policy_id,
    COUNT(*) AS total_dependents,
    COUNT(*) FILTER (
      WHERE ped.enrollment_addition_batch_id IS NOT NULL
    ) AS addition_dependents,
    COUNT(*) FILTER (
      WHERE ped.enrollment_deletion_batch_id IS NOT NULL
    ) AS deletion_dependents
  FROM policy_enrollment_dependent ped
  WHERE ped.deleted_at IS NULL
  GROUP BY ped.policy_id
),
endorsement_stats AS (
  SELECT
    e.policy_id,
    COALESCE(
      SUM(
        CASE
          WHEN e.endorsement_type ILIKE '%addition%'
            THEN COALESCE(e.net_premium, e.gross_premium, e.premium_at_inception, 0)
          ELSE 0
        END
      ),
      0
    ) AS addition_premium,
    COALESCE(
      SUM(
        CASE
          WHEN e.endorsement_type ILIKE '%deletion%'
            THEN COALESCE(e.net_premium, e.gross_premium, e.premium_at_inception, 0)
          ELSE 0
        END
      ),
      0
    ) AS deletion_premium
  FROM endorsement e
  INNER JOIN policy_scope ps
    ON ps.policy_id = e.policy_id
  WHERE e.deleted_at IS NULL
  GROUP BY e.policy_id
),
cd_stats AS (
  SELECT
    cpm.policy_id,
    COALESCE(SUM(cd.balance_amount), 0) AS cd_balance
  FROM caution_deposit_policy_mapping cpm
  INNER JOIN caution_deposit cd
    ON cd.id = cpm.caution_deposit_id
    AND cd.deleted_at IS NULL
  WHERE cpm.deleted_at IS NULL
  GROUP BY cpm.policy_id
)
SELECT
  ps.policy_id AS "policyId",
  ps.policy_name AS "policyName",
  ps.policy_type_key AS "policyTypeKey",
  ps.policy_type_name AS "policyType",
  ps.policy_from AS "policyFrom",
  ps.policy_to AS "policyTo",
  ps.premium_at_inception AS "inceptionPremium",
  COALESCE(es.addition_premium, 0) AS "additionPremium",
  COALESCE(es.deletion_premium, 0) AS "deletionPremium",
  ps.premium_at_inception
    + COALESCE(es.addition_premium, 0)
    - COALESCE(es.deletion_premium, 0) AS "totalPremium",
  COALESCE(cs.cd_balance, 0) AS "cdBalance",
  COALESCE(emp.total_employees, 0) AS "totalEmployees",
  COALESCE(dep.total_dependents, 0) AS "totalDependents",
  COALESCE(emp.total_employees, 0)
    + COALESCE(dep.total_dependents, 0) AS "totalLives",
  COALESCE(emp.enrolled_employees, 0) AS "enrolledEmployees",
  COALESCE(emp.in_progress_employees, 0) AS "inProgressEmployees",
  COALESCE(dep.addition_dependents, 0) AS "additionDependents",
  COALESCE(dep.deletion_dependents, 0) AS "deletionDependents"
FROM policy_scope ps
LEFT JOIN employee_stats emp
  ON emp.policy_id = ps.policy_id
LEFT JOIN dependent_stats dep
  ON dep.policy_id = ps.policy_id
LEFT JOIN endorsement_stats es
  ON es.policy_id = ps.policy_id
LEFT JOIN cd_stats cs
  ON cs.policy_id = ps.policy_id
ORDER BY ps.policy_from DESC, ps.policy_id DESC
$details$,
    'SYSTEM',
    'SYSTEM',
    8
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES (
    report_id,
    'companyId',
    'Company ID',
    '###companyId###',
    'number',
    'SYSTEM',
    'SYSTEM',
    'input',
    'none',
    '{}'::jsonb,
    1
  );

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'policyId', 'policyId', 'Policy ID', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'policyName', 'policyName', 'Policy Name', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'policyTypeKey', 'policyTypeKey', 'Policy Type Key', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'policyType', 'policyType', 'Policy Type', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'policyFrom', 'policyFrom', 'Policy From', 'date', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'policyTo', 'policyTo', 'Policy To', 'date', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'inceptionPremium', 'inceptionPremium', 'Inception Premium', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'additionPremium', 'additionPremium', 'Addition Premium', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'deletionPremium', 'deletionPremium', 'Deletion Premium', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalPremium', 'totalPremium', 'Total Premium', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'cdBalance', 'cdBalance', 'CD Balance', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalEmployees', 'totalEmployees', 'Total Employees', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalDependents', 'totalDependents', 'Total Dependents', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalLives', 'totalLives', 'Total Lives', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'enrolledEmployees', 'enrolledEmployees', 'Enrolled Employees', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'inProgressEmployees', 'inProgressEmployees', 'In Progress Employees', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'additionDependents', 'additionDependents', 'Addition Dependents', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'deletionDependents', 'deletionDependents', 'Deletion Dependents', 'number', 'SYSTEM', 'SYSTEM', 'right');
END $$;

-- Updated by claude ai
-- 10) Company Policy KPI Summary
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'company_policy_kpi_summary',
    'Company Policy KPI Summary',
    'company_policy_kpi_summary',
    $kpi$
WITH policy_scope AS (
  SELECT
    p.id AS policy_id,
    p.company_id,
    p.policy_name,
    p.policy_from,
    p.policy_to,
    COALESCE(p.premium_at_inception, 0) AS premium_at_inception,
    COALESCE(p.net_premium, 0) AS policy_net_premium,
    ld.lookup_key AS policy_type_key,
    ld.value AS policy_type_name
  FROM policy p
  INNER JOIN lookup_data ld
    ON ld.id = p.policy_type_lid
    AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND p.deleted_at IS NULL
    -- AND ld.lookup_key IN (
    --   'POLICY_TYPE_GMC',
    --   'POLICY_TYPE_GPA',
    --   'POLICY_TYPE_GTL'
    -- )
),
endorsement_agg AS (
  SELECT
    e.policy_id,
    COALESCE(
      SUM(
        CASE
          WHEN e.endorsement_type ILIKE '%addition%'
            THEN COALESCE(e.net_premium, e.gross_premium, e.premium_at_inception, 0)
          ELSE 0
        END
      ),
      0
    ) AS addition_premium,
    COALESCE(
      SUM(
        CASE
          WHEN e.endorsement_type ILIKE '%deletion%'
            THEN COALESCE(e.net_premium, e.gross_premium, e.premium_at_inception, 0)
          ELSE 0
        END
      ),
      0
    ) AS deletion_premium,
    COALESCE(
      SUM(
        CASE
          WHEN e.endorsement_type ILIKE '%top-up%'
            OR e.endorsement_type ILIKE '%topup%'
            THEN COALESCE(e.net_premium, e.gross_premium, e.premium_at_inception, 0)
          ELSE 0
        END
      ),
      0
    ) AS top_up_premium
  FROM endorsement e
  INNER JOIN policy_scope ps
    ON ps.policy_id = e.policy_id
  WHERE e.deleted_at IS NULL
  GROUP BY e.policy_id
)
SELECT
  ps.policy_type_key AS "policyTypeKey",
  ps.policy_type_name AS "policyType",
  COUNT(*) AS "policyCount",
  COALESCE(SUM(ps.premium_at_inception), 0) AS "inceptionPremium",
  COALESCE(SUM(ea.addition_premium), 0) AS "additionPremium",
  COALESCE(SUM(ea.deletion_premium), 0) AS "deletionPremium",
  COALESCE(SUM(ps.premium_at_inception), 0)
    + COALESCE(SUM(ea.addition_premium), 0)
    - COALESCE(SUM(ea.deletion_premium), 0) AS "totalPremium",
  COALESCE(SUM(ea.top_up_premium), 0) AS "topUpPremium"
FROM policy_scope ps
LEFT JOIN endorsement_agg ea
  ON ea.policy_id = ps.policy_id
GROUP BY ps.policy_type_key, ps.policy_type_name

UNION ALL

SELECT
  'ALL' AS "policyTypeKey",
  'ALL' AS "policyType",
  COUNT(*) AS "policyCount",
  COALESCE(SUM(ps.premium_at_inception), 0) AS "inceptionPremium",
  COALESCE(SUM(ea.addition_premium), 0) AS "additionPremium",
  COALESCE(SUM(ea.deletion_premium), 0) AS "deletionPremium",
  COALESCE(SUM(ps.premium_at_inception), 0)
    + COALESCE(SUM(ea.addition_premium), 0)
    - COALESCE(SUM(ea.deletion_premium), 0) AS "totalPremium",
  COALESCE(SUM(ea.top_up_premium), 0) AS "topUpPremium"
FROM policy_scope ps
LEFT JOIN endorsement_agg ea
  ON ea.policy_id = ps.policy_id
ORDER BY 1, 2
$kpi$,
    'SYSTEM',
    'SYSTEM',
    9
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES (
    report_id,
    'companyId',
    'Company ID',
    '###companyId###',
    'number',
    'SYSTEM',
    'SYSTEM',
    'input',
    'none',
    '{}'::jsonb,
    1
  );

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'policyTypeKey', 'policyTypeKey', 'Policy Type Key', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'policyType', 'policyType', 'Policy Type', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'policyCount', 'policyCount', 'Policy Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'inceptionPremium', 'inceptionPremium', 'Inception Premium', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'additionPremium', 'additionPremium', 'Addition Premium', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'deletionPremium', 'deletionPremium', 'Deletion Premium', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalPremium', 'totalPremium', 'Total Premium', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'topUpPremium', 'topUpPremium', 'Top Up Premium', 'number', 'SYSTEM', 'SYSTEM', 'right');
END $$;







-- Updated by claude ai
-- 10) Claims Insights Cashless vs Reimbursement Summary
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'claims_insights_cashless_reimbursement_summary',
    'Claims Insights Cashless Reimbursement Summary',
    'claims_insights_cashless_reimbursement_summary',
    $claims_mode_summary$
WITH params AS (
  SELECT
    COALESCE(NULLIF(###fromDate###, '')::date, (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')::date) AS from_date,
    COALESCE(NULLIF(###toDate###, '')::date, CURRENT_DATE) AS to_date,
    NULLIF(###claimType###, '') AS claim_type_filter,
    NULLIF(###claimStatus###, '') AS claim_status_filter,
    NULLIF(###memberType###, '') AS member_type_filter
),
base_claims AS (
  SELECT
    COALESCE(c.claim_dt, c.created_at::date) AS claim_date,
    CASE
      WHEN LOWER(COALESCE(c.clm_type, '')) LIKE '%cashless%' THEN 'Cashless'
      WHEN LOWER(COALESCE(c.clm_type, '')) LIKE '%reimb%' THEN 'Reimbursement'
      ELSE 'Other'
    END AS claim_mode,
    c.claim_amount,
    CASE
      WHEN c.dependent_id IS NULL THEN 'Employee'
      ELSE 'Dependent'
    END AS member_type,
    c.claim_status
  FROM policy_claim c
  INNER JOIN policy p
    ON p.id = c.policy_id
    AND p.deleted_at IS NULL
  CROSS JOIN params pr
  WHERE p.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND COALESCE(c.claim_dt, c.created_at::date) BETWEEN pr.from_date AND pr.to_date
    AND (
      pr.claim_type_filter IS NULL
      OR LOWER(COALESCE(c.clm_type, '')) = LOWER(pr.claim_type_filter)
      OR LOWER(COALESCE(c.clm_type, '')) LIKE '%' || LOWER(pr.claim_type_filter) || '%'
    )
    AND (
      pr.claim_status_filter IS NULL
      OR LOWER(COALESCE(c.claim_status, '')) = LOWER(pr.claim_status_filter)
    )
    AND (
      pr.member_type_filter IS NULL
      OR LOWER(CASE WHEN c.dependent_id IS NULL THEN 'Employee' ELSE 'Dependent' END) = LOWER(pr.member_type_filter)
    )
)
SELECT
  claim_mode AS "claimMode",
  COUNT(*) AS "claimCount",
  COALESCE(SUM(claim_amount), 0) AS "claimAmount",
  ROUND(
    COALESCE(
      100.0 * COUNT(*) / NULLIF(SUM(COUNT(*)) OVER (), 0),
      0
    ),
    1
  ) AS "countPercent",
  ROUND(
    COALESCE(
      100.0 * SUM(claim_amount) / NULLIF(SUM(SUM(claim_amount)) OVER (), 0),
      0
    ),
    1
  ) AS "amountPercent"
FROM base_claims
WHERE claim_mode IN ('Cashless', 'Reimbursement')
GROUP BY claim_mode
ORDER BY CASE claim_mode WHEN 'Cashless' THEN 1 WHEN 'Reimbursement' THEN 2 ELSE 3 END
$claims_mode_summary$,
    'SYSTEM',
    'SYSTEM',
    10
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES
    (
      report_id,
      'companyId',
      'Company ID',
      '###companyId###',
      'number',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      1
    ),
    (
      report_id,
      'fromDate',
      'From Date',
      '###fromDate###',
      'date',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      2
    ),
    (
      report_id,
      'toDate',
      'To Date',
      '###toDate###',
      'date',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      3
    ),
    (
      report_id,
      'claimType',
      'Claim Type',
      '###claimType###',
      'string',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      4
    ),
    (
      report_id,
      'claimStatus',
      'Claim Status',
      '###claimStatus###',
      'string',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      5
    ),
    (
      report_id,
      'memberType',
      'Member Type',
      '###memberType###',
      'string',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      6
    );

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'claimMode', 'claimMode', 'Claim Mode', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'claimCount', 'claimCount', 'Claim Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'claimAmount', 'claimAmount', 'Claim Amount', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'countPercent', 'countPercent', 'Count Percent', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'amountPercent', 'amountPercent', 'Amount Percent', 'number', 'SYSTEM', 'SYSTEM', 'right');
END $$;

-- Updated by claude ai
-- 11) Claims Insights Cashless vs Reimbursement Monthly
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name,
    label,
    end_point,
    query,
    created_by,
    updated_by,
    order_no
  )
  VALUES (
    'claims_insights_cashless_reimbursement_monthly',
    'Claims Insights Cashless Reimbursement Monthly',
    'claims_insights_cashless_reimbursement_monthly',
    $claims_mode_monthly$
WITH params AS (
  SELECT
    COALESCE(NULLIF(###fromDate###, '')::date, (date_trunc('month', CURRENT_DATE) - INTERVAL '5 months')::date) AS from_date,
    COALESCE(NULLIF(###toDate###, '')::date, CURRENT_DATE) AS to_date,
    NULLIF(###claimType###, '') AS claim_type_filter,
    NULLIF(###claimStatus###, '') AS claim_status_filter,
    NULLIF(###memberType###, '') AS member_type_filter
),
month_series AS (
  SELECT generate_series(
    date_trunc('month', p.from_date)::date,
    date_trunc('month', p.to_date)::date,
    INTERVAL '1 month'
  )::date AS month_start
  FROM params p
),
base_claims AS (
  SELECT
    COALESCE(c.claim_dt, c.created_at::date) AS claim_date,
    CASE
      WHEN LOWER(COALESCE(c.clm_type, '')) LIKE '%cashless%' THEN 'Cashless'
      WHEN LOWER(COALESCE(c.clm_type, '')) LIKE '%reimb%' THEN 'Reimbursement'
      ELSE 'Other'
    END AS claim_mode,
    c.claim_amount,
    CASE
      WHEN c.dependent_id IS NULL THEN 'Employee'
      ELSE 'Dependent'
    END AS member_type,
    c.claim_status
  FROM policy_claim c
  INNER JOIN policy p
    ON p.id = c.policy_id
    AND p.deleted_at IS NULL
  CROSS JOIN params pr
  WHERE p.company_id = ###companyId###
    AND c.deleted_at IS NULL
    AND COALESCE(c.claim_dt, c.created_at::date) BETWEEN pr.from_date AND pr.to_date
    AND (
      pr.claim_type_filter IS NULL
      OR LOWER(COALESCE(c.clm_type, '')) = LOWER(pr.claim_type_filter)
      OR LOWER(COALESCE(c.clm_type, '')) LIKE '%' || LOWER(pr.claim_type_filter) || '%'
    )
    AND (
      pr.claim_status_filter IS NULL
      OR LOWER(COALESCE(c.claim_status, '')) = LOWER(pr.claim_status_filter)
    )
    AND (
      pr.member_type_filter IS NULL
      OR LOWER(CASE WHEN c.dependent_id IS NULL THEN 'Employee' ELSE 'Dependent' END) = LOWER(pr.member_type_filter)
    )
),
monthly AS (
  SELECT
    date_trunc('month', claim_date)::date AS month_start,
    COALESCE(SUM(CASE WHEN claim_mode = 'Cashless' THEN claim_amount ELSE 0 END), 0) AS cashless_amount,
    COALESCE(SUM(CASE WHEN claim_mode = 'Reimbursement' THEN claim_amount ELSE 0 END), 0) AS reimbursement_amount,
    COALESCE(SUM(CASE WHEN claim_mode = 'Cashless' THEN 1 ELSE 0 END), 0) AS cashless_count,
    COALESCE(SUM(CASE WHEN claim_mode = 'Reimbursement' THEN 1 ELSE 0 END), 0) AS reimbursement_count
  FROM base_claims
  GROUP BY 1
)
SELECT
  to_char(ms.month_start, 'Mon') AS "monthLabel",
  to_char(ms.month_start, 'YYYY-MM') AS "monthKey",
  COALESCE(m.cashless_amount, 0) AS "cashlessAmount",
  COALESCE(m.reimbursement_amount, 0) AS "reimbursementAmount",
  COALESCE(m.cashless_amount, 0) + COALESCE(m.reimbursement_amount, 0) AS "totalAmount",
  COALESCE(m.cashless_count, 0) AS "cashlessCount",
  COALESCE(m.reimbursement_count, 0) AS "reimbursementCount",
  COALESCE(m.cashless_count, 0) + COALESCE(m.reimbursement_count, 0) AS "totalCount"
FROM month_series ms
LEFT JOIN monthly m
  ON m.month_start = ms.month_start
ORDER BY ms.month_start
$claims_mode_monthly$,
    'SYSTEM',
    'SYSTEM',
    11
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id,
    parameter_name,
    label,
    query_parameter,
    data_type,
    created_by,
    updated_by,
    input_field_type,
    option_type,
    option,
    order_no
  )
  VALUES
    (
      report_id,
      'companyId',
      'Company ID',
      '###companyId###',
      'number',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      1
    ),
    (
      report_id,
      'fromDate',
      'From Date',
      '###fromDate###',
      'date',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      2
    ),
    (
      report_id,
      'toDate',
      'To Date',
      '###toDate###',
      'date',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      3
    ),
    (
      report_id,
      'claimType',
      'Claim Type',
      '###claimType###',
      'string',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      4
    ),
    (
      report_id,
      'claimStatus',
      'Claim Status',
      '###claimStatus###',
      'string',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      5
    ),
    (
      report_id,
      'memberType',
      'Member Type',
      '###memberType###',
      'string',
      'SYSTEM',
      'SYSTEM',
      'input',
      'none',
      '{}'::jsonb,
      6
    );

  INSERT INTO admin_reports_results_mappings (
    admin_report_id,
    query_parameter_name,
    variable_name,
    label,
    data_type,
    created_by,
    updated_by,
    alignment
  )
  VALUES
    (report_id, 'monthLabel', 'monthLabel', 'Month', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'monthKey', 'monthKey', 'Month Key', 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'cashlessAmount', 'cashlessAmount', 'Cashless Amount', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'reimbursementAmount', 'reimbursementAmount', 'Reimbursement Amount', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalAmount', 'totalAmount', 'Total Amount', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'cashlessCount', 'cashlessCount', 'Cashless Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'reimbursementCount', 'reimbursementCount', 'Reimbursement Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'totalCount', 'totalCount', 'Total Count', 'number', 'SYSTEM', 'SYSTEM', 'right');
END $$;