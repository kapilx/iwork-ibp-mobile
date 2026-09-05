-- ============================================================
-- ALTER: endorsement_list report (id=42) — add is_inception
-- ============================================================
-- Adds the is_inception flag to the endorsement_list query so
-- the HR portal can display the correct "Inception" / "Endorsement"
-- tag on each card.
-- Run once against the target database.
-- ============================================================

UPDATE public.admin_reports
SET query = $q$
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
ORDER BY e.created_at DESC
$q$
WHERE name = 'endorsement_list';

-- ============================================================
-- ALTER: endorsement_employee_metrics report (id=41)
--        employeesAtInception → endorsment_count from the
--        endorsement row where is_inception = true
-- ============================================================

UPDATE public.admin_reports
SET query = $q$
WITH inception_counts AS (
  SELECT
    COALESCE(e.endorsment_count,          0) AS employees_at_inception,
    COALESCE(e.endorsment_dependent_count, 0) AS dependents_at_inception
  FROM endorsement e
  INNER JOIN policy p ON p.id = e.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '' OR e.policy_id::text = ###policyId###)
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
$q$
WHERE name = 'endorsement_employee_metrics';

-- ============================================================
-- ALTER: policy_claim_history report — full filter support
-- Filters: claimNo, employeeSearch, patientName, hospital,
--          claimDateFrom/To (full date), settlementDateFrom/To,
--          amountMin/Max, tat (lte7 | 7to30 | gt30)
-- ============================================================
UPDATE public.admin_reports
SET query = $q$
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
       OR (###tat### = 'lte7'
           AND ls.settlement_date IS NOT NULL
           AND (ls.settlement_date::date - c.claim_dt::date) <= 7)
       OR (###tat### = '7to30'
           AND ls.settlement_date IS NOT NULL
           AND (ls.settlement_date::date - c.claim_dt::date) BETWEEN 8 AND 30)
       OR (###tat### = 'gt30'
           AND ls.settlement_date IS NOT NULL
           AND (ls.settlement_date::date - c.claim_dt::date) > 30))
  AND (###search### = ''
       OR COALESCE(pee.full_name, pee.employee_name, '') ILIKE '%' || ###search### || '%'
       OR COALESCE(c.claim_number, '')                   ILIKE '%' || ###search### || '%'
       OR COALESCE(mh.name, c.clm_hospital, '')          ILIKE '%' || ###search### || '%')
ORDER BY c.claim_dt DESC NULLS LAST, c.id DESC
$q$
WHERE name = 'policy_claim_history';

-- Rename startYear → claimDateFrom and endYear → claimDateTo (IDs 239, 240)
UPDATE public.admin_reports_parameters
SET parameter_name = 'claimDateFrom', label = 'Claim Date From',
    query_parameter = '###claimDateFrom###', updated_at = NOW()
WHERE id = 239;

UPDATE public.admin_reports_parameters
SET parameter_name = 'claimDateTo', label = 'Claim Date To',
    query_parameter = '###claimDateTo###', updated_at = NOW()
WHERE id = 240;

-- New parameters for policy_claim_history (admin_report_id = 31)
INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no)
VALUES
  (295, 31, 'claimNo',            'Claim Number',          'string', NOW(), NOW(), NULL, 'SYSTEM', 'SYSTEM', NULL, '###claimNo###',            'input', 'none', '{}', 8),
  (296, 31, 'employeeSearch',     'Employee Name / ID',    'string', NOW(), NOW(), NULL, 'SYSTEM', 'SYSTEM', NULL, '###employeeSearch###',     'input', 'none', '{}', 9),
  (297, 31, 'patientName',        'Patient Name',          'string', NOW(), NOW(), NULL, 'SYSTEM', 'SYSTEM', NULL, '###patientName###',        'input', 'none', '{}', 10),
  (298, 31, 'hospital',           'Hospital',              'string', NOW(), NOW(), NULL, 'SYSTEM', 'SYSTEM', NULL, '###hospital###',           'input', 'none', '{}', 11),
  (299, 31, 'settlementDateFrom', 'Settlement Date From',  'string', NOW(), NOW(), NULL, 'SYSTEM', 'SYSTEM', NULL, '###settlementDateFrom###', 'input', 'none', '{}', 12),
  (300, 31, 'settlementDateTo',   'Settlement Date To',    'string', NOW(), NOW(), NULL, 'SYSTEM', 'SYSTEM', NULL, '###settlementDateTo###',   'input', 'none', '{}', 13),
  (301, 31, 'amountMin',          'Amount Min',            'string', NOW(), NOW(), NULL, 'SYSTEM', 'SYSTEM', NULL, '###amountMin###',          'input', 'none', '{}', 14),
  (302, 31, 'amountMax',          'Amount Max',            'string', NOW(), NOW(), NULL, 'SYSTEM', 'SYSTEM', NULL, '###amountMax###',          'input', 'none', '{}', 15),
  (303, 31, 'tat',                'TAT',                   'string', NOW(), NOW(), NULL, 'SYSTEM', 'SYSTEM', NULL, '###tat###',                'input', 'none', '{}', 16)
ON CONFLICT (id) DO UPDATE
  SET parameter_name  = EXCLUDED.parameter_name,
      query_parameter = EXCLUDED.query_parameter,
      label           = EXCLUDED.label,
      updated_at      = NOW();

-- ============================================================
-- INSERT: policy_renewal_status report (id=58)
-- Returns the active renewal activity for a policy by finding
-- the linked opportunity and picking the highest-priority
-- activity status: WIP → SUBMITTED → APPROVED → REJECTED.
-- Uses dollar-quoting to avoid single-quote escaping issues.
-- Uses ON CONFLICT so the script is safe to re-run.
-- ============================================================

INSERT INTO public.admin_reports (id, name, label, end_point, query, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, order_no)
VALUES (58, 'policy_renewal_status', 'Policy Renewal Status', 'policy_renewal_status', $qr$
SELECT
  o.ref_policy_id   AS "policyId",
  oam.activity_key  AS "activityKey",
  oam.activity_name AS "activityName",
  ld.lookup_key     AS "statusKey"
FROM opportunity_activity_map oam
JOIN opportunity o  ON o.id = oam.opportunity_id
JOIN lookup_data ld ON ld.id = oam.status_lid
WHERE o.ref_policy_id IN (###policyIds###)
  AND o.expiry_date > CURRENT_DATE
  AND ld.lookup_key IN (
    'OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS',
    'OPPORTUNITY_ACTIVITY_STATUS_SUBMITTED',
    'OPPORTUNITY_ACTIVITY_STATUS_APPROVED',
    'OPPORTUNITY_ACTIVITY_STATUS_REJECTED'
  )
ORDER BY
  o.ref_policy_id ASC,
  CASE ld.lookup_key
    WHEN 'OPPORTUNITY_ACTIVITY_STATUS_WORK_IN_PROGRESS' THEN 1
    WHEN 'OPPORTUNITY_ACTIVITY_STATUS_SUBMITTED' THEN 2
    WHEN 'OPPORTUNITY_ACTIVITY_STATUS_APPROVED' THEN 3
    WHEN 'OPPORTUNITY_ACTIVITY_STATUS_REJECTED' THEN 4
    ELSE 5
  END ASC
$qr$, NOW(), NOW(), NULL, 'SYSTEM', 'SYSTEM', NULL, 58)
ON CONFLICT (id) DO UPDATE SET query = EXCLUDED.query, updated_at = NOW();

INSERT INTO public.admin_reports_parameters (id, admin_report_id, parameter_name, label, data_type, created_at, updated_at, deleted_at, created_by, updated_by, deleted_by, query_parameter, input_field_type, option_type, option, order_no)
VALUES (294, 58, 'policyIds', 'Policy IDs', 'string', NOW(), NOW(), NULL, 'SYSTEM', 'SYSTEM', NULL, '###policyIds###', 'input', 'none', '{}', 1)
ON CONFLICT (id) DO UPDATE SET parameter_name = EXCLUDED.parameter_name, query_parameter = EXCLUDED.query_parameter, updated_at = NOW();

-- ============================================================
-- ALTER: policy_claim_history — consolidate search into single ###search###
-- Replaces separate employeeSearch / patientName / hospital conditions with
-- one unified ###search### that matches employee name/ID, patient name, hospital.
-- ============================================================
UPDATE public.admin_reports
SET query = $q2$
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
       OR (###tat### = 'lte7'
           AND ls.settlement_date IS NOT NULL
           AND (ls.settlement_date::date - c.claim_dt::date) <= 7)
       OR (###tat### = '7to30'
           AND ls.settlement_date IS NOT NULL
           AND (ls.settlement_date::date - c.claim_dt::date) BETWEEN 8 AND 30)
       OR (###tat### = 'gt30'
           AND ls.settlement_date IS NOT NULL
           AND (ls.settlement_date::date - c.claim_dt::date) > 30))
  AND (###search### = ''
       OR COALESCE(pee.full_name, pee.employee_name, '')           ILIKE '%' || ###search### || '%'
       OR COALESCE(pee.employee_company_id, '')                    ILIKE '%' || ###search### || '%'
       OR COALESCE(c.claim_number, '')                             ILIKE '%' || ###search### || '%'
       OR COALESCE(mh.name, c.clm_hospital, '')                    ILIKE '%' || ###search### || '%'
       OR COALESCE(c.patient_name, ped.name, pee.full_name, pee.employee_name, '') ILIKE '%' || ###search### || '%')
ORDER BY c.claim_dt DESC NULLS LAST, c.id DESC
$q2$
WHERE name = 'policy_claim_history';

-- Remove obsolete individual search params (now covered by unified ###search###)
UPDATE public.admin_reports_parameters
SET deleted_at = NOW(), updated_at = NOW()
WHERE admin_report_id = (SELECT id FROM public.admin_reports WHERE name = 'policy_claim_history')
  AND parameter_name IN ('employeeSearch', 'patientName', 'hospital')
  AND deleted_at IS NULL;

-- ============================================================
-- ALTER: portfolio_company_policies — sort by policy end date then policy type
-- ============================================================
UPDATE public.admin_reports
SET query = $qp$
WITH policy_insurer AS (
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
),
policy_tpa AS (
  SELECT DISTINCT ON (ptm.policy_id)
    ptm.policy_id,
    t.name AS tpa_name
  FROM policy_tpa_map ptm
  INNER JOIN tpa t ON t.id = ptm.tpa_id
  ORDER BY ptm.policy_id, ptm.id
)
SELECT
  p.id                                                           AS "policyId",
  p.company_id                                                   AS "companyId",
  COALESCE(iirm_ld.value, ld.value)                             AS "policyTypeCode",
  ld.value                                                       AS "policyTypeName",
  pi.insurer_name                                                AS "insurerName",
  COALESCE(pt.tpa_name, '—')                                    AS "tpaName",
  p.insurer_policy_number                                        AS "policyNumber",
  p.net_premium                                                  AS "premiumAmount",
  TO_CHAR(p.policy_from, 'DD/MM/YYYY')                          AS "startDate",
  TO_CHAR(p.policy_to,   'DD/MM/YYYY')                          AS "endDate",
  CASE
    WHEN p.policy_to <  CURRENT_DATE                             THEN 'Expired'
    WHEN p.policy_to <= CURRENT_DATE + INTERVAL '60 days'        THEN 'Renewal Due'
    ELSE 'Active'
  END                                                            AS "policyStatus"
FROM policy p
LEFT JOIN lookup_data ld      ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN policy_type_segregation pts ON pts.policy_type_lid = p.policy_type_lid
LEFT JOIN lookup_data iirm_ld ON iirm_ld.id = pts.iirm_policy_type_lid AND iirm_ld.deleted_at IS NULL
LEFT JOIN policy_insurer pi   ON pi.policy_id = p.id
LEFT JOIN policy_tpa pt       ON pt.policy_id = p.id
WHERE p.company_id = ###companyId###
ORDER BY p.policy_to ASC, ld.value ASC
$qp$
WHERE name = 'portfolio_company_policies';

-- ============================================================
-- ALTER: policy_claim_history — narrow ###search### to names only
-- Problem: search was also matching hospital name and claim number,
--          causing unrelated employees to appear (e.g. search "akhila"
--          returned "Eddula Sivaiah" because the hospital name matched).
-- Fix: restrict ###search### to employee name, employee code, and patient
--      name only. Claim number has its own dedicated ###claimNo### filter.
-- ============================================================
UPDATE public.admin_reports
SET query = $q3$
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
       OR (###tat### = 'lte7'
           AND ls.settlement_date IS NOT NULL
           AND (ls.settlement_date::date - c.claim_dt::date) <= 7)
       OR (###tat### = '7to30'
           AND ls.settlement_date IS NOT NULL
           AND (ls.settlement_date::date - c.claim_dt::date) BETWEEN 8 AND 30)
       OR (###tat### = 'gt30'
           AND ls.settlement_date IS NOT NULL
           AND (ls.settlement_date::date - c.claim_dt::date) > 30))
  AND (NULLIF(###search###, '') IS NULL
       OR COALESCE(pee.full_name, pee.employee_name, '')     ILIKE '%' || ###search### || '%'
       OR COALESCE(pee.employee_company_id, '')              ILIKE '%' || ###search### || '%'
       OR COALESCE(c.patient_name, ped.name, '')             ILIKE '%' || ###search### || '%'
       OR COALESCE(mh.name, c.clm_hospital, '')              ILIKE '%' || ###search### || '%'
       OR COALESCE(c.claim_number, '')                       ILIKE '%' || ###search### || '%')
ORDER BY c.claim_dt DESC NULLS LAST, c.id DESC
$q3$
WHERE name = 'policy_claim_history';


INSERT INTO public.admin_reports_parameters 
(admin_report_id, parameter_name, label, data_type, query_parameter, input_field_type, option_type, option, order_no)
VALUES 
(31, 'search', 'Search', 'string', '###search###', 'input', 'none', '{}', 17);
