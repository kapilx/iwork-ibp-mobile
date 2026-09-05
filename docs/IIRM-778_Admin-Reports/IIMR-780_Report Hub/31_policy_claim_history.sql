-- ============================================================================
-- Report: Policy Claim History
-- name (used in URL/endpoint): policy_claim_history    |    id: 31    |    order_no: 30
-- end_point: policy_claim_history
-- created_at: 2026-05-08 12:06:13.348584    updated_at: 2026-06-01 12:11:46.364755
-- Pulled directly from production 2026-07-23. See IIRM-780_Report-Hub-PRD.md for the
-- functional description and product-level context for this report.
-- ============================================================================
-- HOW TO CHANGE THIS REPORT
-- 1. Edit the query in section 1, then push it with the UPDATE template there.
-- 2. If you add/remove/rename an output column (an `AS "..."` alias in the SELECT),
--    you MUST also update admin_reports_results_mappings (section 3) --
--    query_parameter_name there must match your alias exactly, or that column
--    silently falls back to a raw, unlabelled header. (This has already happened
--    on two other reports in this set -- see their KNOWN ISSUES sections.)
-- 3. If you add a new ###Token### filter, insert a matching row into
--    admin_reports_parameters (section 2) -- query_parameter there must match
--    the token text in the query exactly, including the ### on both sides.
-- 4. Existing filters follow one of two safe patterns -- keep whichever this
--    report already uses unless you're deliberately changing its behavior:
--      optional:  col = COALESCE(###Token###, col)
--      optional (dates): (###Token### IS NULL OR col::date >= ###Token###::date)
--      mandatory: col = ###Token###   <- returns ZERO rows if the filter is unset
-- ============================================================================

-- ------------------------------------------------------------------
-- 1. MAIN QUERY  (admin_reports.query, id = 31)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH latest_settlement AS (
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
  COALESCE(pee.company_employee_id, '')            AS "employeeCode",
  COALESCE(pee.full_name, pee.employee_name, '—') AS "employeeName",
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
    ELSE INITCAP(LOWER(COALESCE(c.patient_relation, ped.relation, 'Dependent')))
  END                                              AS "relation",
  COALESCE(mh.name, c.clm_hospital, '—')          AS "hospital",
  c.claim_dt                                       AS "claimDate",
  INITCAP(COALESCE(c.clm_type, '—'))              AS "claimType",
  c.claim_amount                                   AS "claimedAmount",
  COALESCE(ls.settled_amount, 0)                   AS "approvedAmount",
  ls.settlement_date                               AS "settlementDate",
  INITCAP(COALESCE(c.claim_status, 'pending'))     AS "status"
FROM policy_claim c
INNER JOIN policy p ON p.id = c.policy_id
LEFT JOIN policy_enrollment_employee pee ON pee.id = c.employee_id AND pee.deleted_at IS NULL
LEFT JOIN policy_enrollment_dependent ped ON ped.id = c.dependent_id AND ped.deleted_at IS NULL
LEFT JOIN mstr_hospital mh ON mh.id = c.hospital_id AND mh.deleted_at IS NULL
LEFT JOIN latest_settlement ls ON ls.claim_id = c.id
WHERE c.policy_id = ###policyId###
  AND (NULLIF(###employeeId###, '') IS NULL OR c.employee_id = NULLIF(###employeeId###, '')::int)
  AND (###claimStatus### = '' OR LOWER(c.claim_status) = LOWER(###claimStatus###))
  AND (###claimType### = '' OR LOWER(COALESCE(c.clm_type, '')) LIKE '%' || LOWER(###claimType###) || '%')
  AND (###claimNo### = '' OR COALESCE(c.claim_number, '') ILIKE '%' || ###claimNo### || '%')
  AND (###search### = ''
       OR COALESCE(pee.full_name, pee.employee_name, '') ILIKE '%' || ###search### || '%'
       OR COALESCE(pee.company_employee_id, '') ILIKE '%' || ###search### || '%'
       OR COALESCE(c.claim_number, '') ILIKE '%' || ###search### || '%'
       OR COALESCE(c.patient_name, '') ILIKE '%' || ###search### || '%'
       OR COALESCE(mh.name, c.clm_hospital, '') ILIKE '%' || ###search### || '%')
  AND (NULLIF(###claimDateFrom###, '') IS NULL OR c.claim_dt::date >= NULLIF(###claimDateFrom###, '')::date)
  AND (NULLIF(###claimDateTo###,   '') IS NULL OR c.claim_dt::date <= NULLIF(###claimDateTo###,   '')::date)
  AND (NULLIF(###settlementDateFrom###, '') IS NULL OR ls.settlement_date::date >= NULLIF(###settlementDateFrom###, '')::date)
  AND (NULLIF(###settlementDateTo###,   '') IS NULL OR ls.settlement_date::date <= NULLIF(###settlementDateTo###,   '')::date)
  AND (NULLIF(###amountMin###, '') IS NULL OR c.claim_amount >= NULLIF(###amountMin###, '')::numeric)
  AND (NULLIF(###amountMax###, '') IS NULL OR c.claim_amount <= NULLIF(###amountMax###, '')::numeric)
  AND (
    ###tat### = ''
    OR (###tat### = 'lte7'  AND ls.settlement_date IS NOT NULL AND (ls.settlement_date::date - c.claim_dt::date) <= 7)
    OR (###tat### = '7to30' AND ls.settlement_date IS NOT NULL AND (ls.settlement_date::date - c.claim_dt::date) BETWEEN 8 AND 30)
    OR (###tat### = 'gt30'  AND ls.settlement_date IS NOT NULL AND (ls.settlement_date::date - c.claim_dt::date) > 30)
  )
  -- New employee-level location filter
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR pee.policy_config_location_id = ANY(
      SELECT val::INTEGER FROM regexp_split_to_table(
        NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
      ) AS val WHERE val ~ '^\d+$'
    )
  )
  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
  AND (###externalHrUserId### IS NULL
       OR c.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
ORDER BY c.claim_dt DESC NULLS LAST, c.id DESC$Q$
--   WHERE id = 31;

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
  COALESCE(pee.company_employee_id, '')            AS "employeeCode",
  COALESCE(pee.full_name, pee.employee_name, '—') AS "employeeName",
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
    ELSE INITCAP(LOWER(COALESCE(c.patient_relation, ped.relation, 'Dependent')))
  END                                              AS "relation",
  COALESCE(mh.name, c.clm_hospital, '—')          AS "hospital",
  c.claim_dt                                       AS "claimDate",
  INITCAP(COALESCE(c.clm_type, '—'))              AS "claimType",
  c.claim_amount                                   AS "claimedAmount",
  COALESCE(ls.settled_amount, 0)                   AS "approvedAmount",
  ls.settlement_date                               AS "settlementDate",
  INITCAP(COALESCE(c.claim_status, 'pending'))     AS "status"
FROM policy_claim c
INNER JOIN policy p ON p.id = c.policy_id
LEFT JOIN policy_enrollment_employee pee ON pee.id = c.employee_id AND pee.deleted_at IS NULL
LEFT JOIN policy_enrollment_dependent ped ON ped.id = c.dependent_id AND ped.deleted_at IS NULL
LEFT JOIN mstr_hospital mh ON mh.id = c.hospital_id AND mh.deleted_at IS NULL
LEFT JOIN latest_settlement ls ON ls.claim_id = c.id
WHERE c.policy_id = ###policyId###
  AND (NULLIF(###employeeId###, '') IS NULL OR c.employee_id = NULLIF(###employeeId###, '')::int)
  AND (###claimStatus### = '' OR LOWER(c.claim_status) = LOWER(###claimStatus###))
  AND (###claimType### = '' OR LOWER(COALESCE(c.clm_type, '')) LIKE '%' || LOWER(###claimType###) || '%')
  AND (###claimNo### = '' OR COALESCE(c.claim_number, '') ILIKE '%' || ###claimNo### || '%')
  AND (###search### = ''
       OR COALESCE(pee.full_name, pee.employee_name, '') ILIKE '%' || ###search### || '%'
       OR COALESCE(pee.company_employee_id, '') ILIKE '%' || ###search### || '%'
       OR COALESCE(c.claim_number, '') ILIKE '%' || ###search### || '%'
       OR COALESCE(c.patient_name, '') ILIKE '%' || ###search### || '%'
       OR COALESCE(mh.name, c.clm_hospital, '') ILIKE '%' || ###search### || '%')
  AND (NULLIF(###claimDateFrom###, '') IS NULL OR c.claim_dt::date >= NULLIF(###claimDateFrom###, '')::date)
  AND (NULLIF(###claimDateTo###,   '') IS NULL OR c.claim_dt::date <= NULLIF(###claimDateTo###,   '')::date)
  AND (NULLIF(###settlementDateFrom###, '') IS NULL OR ls.settlement_date::date >= NULLIF(###settlementDateFrom###, '')::date)
  AND (NULLIF(###settlementDateTo###,   '') IS NULL OR ls.settlement_date::date <= NULLIF(###settlementDateTo###,   '')::date)
  AND (NULLIF(###amountMin###, '') IS NULL OR c.claim_amount >= NULLIF(###amountMin###, '')::numeric)
  AND (NULLIF(###amountMax###, '') IS NULL OR c.claim_amount <= NULLIF(###amountMax###, '')::numeric)
  AND (
    ###tat### = ''
    OR (###tat### = 'lte7'  AND ls.settlement_date IS NOT NULL AND (ls.settlement_date::date - c.claim_dt::date) <= 7)
    OR (###tat### = '7to30' AND ls.settlement_date IS NOT NULL AND (ls.settlement_date::date - c.claim_dt::date) BETWEEN 8 AND 30)
    OR (###tat### = 'gt30'  AND ls.settlement_date IS NOT NULL AND (ls.settlement_date::date - c.claim_dt::date) > 30)
  )
  -- New employee-level location filter
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR pee.policy_config_location_id = ANY(
      SELECT val::INTEGER FROM regexp_split_to_table(
        NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
      ) AS val WHERE val ~ '^\d+$'
    )
  )
  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
  AND (###externalHrUserId### IS NULL
       OR c.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
ORDER BY c.claim_dt DESC NULLS LAST, c.id DESC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 31)
-- ------------------------------------------------------------------
-- Filter: (no label -- stub/unconfigured parameter)
--   parameter_name : locationIds
--   token in query : ###locationIds###
--   data_type      : (none)
--   input_field    : (none -- likely unusable from the UI)
--   >>> STUB parameter row -- no type/label configured, this filter cannot be used from the generic screen.
--
-- Filter: Policy ID
--   parameter_name : policyId
--   token in query : ###policyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--
-- Filter: Claim Status
--   parameter_name : claimStatus
--   token in query : ###claimStatus###
--   data_type      : string
--   input_field    : input
--   order_no       : 2
--
-- Filter: Claim Type
--   parameter_name : claimType
--   token in query : ###claimType###
--   data_type      : string
--   input_field    : input
--   order_no       : 3
--
-- Filter: Start Year
--   parameter_name : startYear
--   token in query : ###startYear###
--   data_type      : string
--   input_field    : input
--   order_no       : 4
--
-- Filter: Claim Date From
--   parameter_name : claimDateFrom
--   token in query : ###claimDateFrom###
--   data_type      : string
--   input_field    : input
--   order_no       : 5
--
-- Filter: Claim Date To
--   parameter_name : claimDateTo
--   token in query : ###claimDateTo###
--   data_type      : string
--   input_field    : input
--   order_no       : 6
--
-- Filter: Employee ID
--   parameter_name : employeeId
--   token in query : ###employeeId###
--   data_type      : number
--   input_field    : input
--   order_no       : 7
--
-- Filter: Claim Number
--   parameter_name : claimNo
--   token in query : ###claimNo###
--   data_type      : string
--   input_field    : input
--   order_no       : 8
--
-- Filter: Employee Name / ID
--   parameter_name : employeeSearch
--   token in query : ###employeeSearch###
--   data_type      : string
--   input_field    : input
--   order_no       : 9
--
-- Filter: Patient Name
--   parameter_name : patientName
--   token in query : ###patientName###
--   data_type      : string
--   input_field    : input
--   order_no       : 10
--
-- Filter: Hospital
--   parameter_name : hospital
--   token in query : ###hospital###
--   data_type      : string
--   input_field    : input
--   order_no       : 11
--
-- Filter: Settlement Date From
--   parameter_name : settlementDateFrom
--   token in query : ###settlementDateFrom###
--   data_type      : string
--   input_field    : input
--   order_no       : 12
--
-- Filter: Settlement Date To
--   parameter_name : settlementDateTo
--   token in query : ###settlementDateTo###
--   data_type      : string
--   input_field    : input
--   order_no       : 13
--
-- Filter: Amount Min
--   parameter_name : amountMin
--   token in query : ###amountMin###
--   data_type      : string
--   input_field    : input
--   order_no       : 14
--
-- Filter: Amount Max
--   parameter_name : amountMax
--   token in query : ###amountMax###
--   data_type      : string
--   input_field    : input
--   order_no       : 15
--
-- Filter: TAT
--   parameter_name : tat
--   token in query : ###tat###
--   data_type      : string
--   input_field    : input
--   order_no       : 16
--
-- Filter: Search
--   parameter_name : search
--   token in query : ###search###
--   data_type      : string
--   input_field    : input
--   order_no       : 17
--
-- Filter: External HR User ID
--   parameter_name : externalHrUserId
--   token in query : ###externalHrUserId###
--   data_type      : number
--   input_field    : input
--   order_no       : 99
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 31)
-- ------------------------------------------------------------------
--   claimId                      -> Claim ID                       (variable: claimId, type: number, align: right)
--   claimNumber                  -> Claim Number                   (variable: claimNumber, type: string, align: left)
--   patientName                  -> Patient Name                   (variable: patientName, type: string, align: left)
--   relation                     -> Relation                       (variable: relation, type: string, align: left)
--   hospital                     -> Hospital                       (variable: hospital, type: string, align: left)
--   claimDate                    -> Claim Date                     (variable: claimDate, type: date, align: left)
--   claimType                    -> Claim Type                     (variable: claimType, type: string, align: left)
--   claimedAmount                -> Claimed Amount                 (variable: claimedAmount, type: number, align: right)
--   approvedAmount               -> Approved Amount                (variable: approvedAmount, type: number, align: right)
--   settlementDate               -> Settlement Date                (variable: settlementDate, type: date, align: left)
--   status                       -> Status                         (variable: status, type: string, align: left)

