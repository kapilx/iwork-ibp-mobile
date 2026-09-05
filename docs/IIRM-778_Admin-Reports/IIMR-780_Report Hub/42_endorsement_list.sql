-- ============================================================================
-- Report: Endorsement List
-- name (used in URL/endpoint): endorsement_list    |    id: 42    |    order_no: 22
-- end_point: endorsement_list
-- created_at: 2026-05-08 12:09:18.263787    updated_at: 2026-06-01 12:11:46.364755
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
-- 1. MAIN QUERY  (admin_reports.query, id = 42)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$SELECT
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
    WHEN COALESCE(e.net_premium, p.net_premium) IS NOT NULL
     AND COALESCE(e.gst_amount,  p.gst_amount)  IS NOT NULL
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
  LEFT JOIN policy_enrollment_upload_summary s ON s.document_processing_file_id = dpf.id
  WHERE p2.company_id = ###companyId###
    AND (###policyId### = '' OR dpf.entity_id::text = ###policyId###)
  GROUP BY dpf.endorsement_id
) counts ON counts.endorsement_id = e.id
WHERE p.company_id = ###companyId###
  AND (###policyId### = '' OR e.policy_id::text = ###policyId###)
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_enrollment_employee_policy_map peepm_f
      INNER JOIN policy_enrollment_employee pee_f
        ON pee_f.id = peepm_f.employee_id AND pee_f.deleted_at IS NULL
      WHERE peepm_f.policy_id = p.id
        AND peepm_f.deleted_at IS NULL
        AND pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )
    )
  )
  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
  AND (###externalHrUserId### IS NULL
       OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
ORDER BY e.created_at DESC$Q$
--   WHERE id = 42;

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
    WHEN COALESCE(e.net_premium, p.net_premium) IS NOT NULL
     AND COALESCE(e.gst_amount,  p.gst_amount)  IS NOT NULL
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
  LEFT JOIN policy_enrollment_upload_summary s ON s.document_processing_file_id = dpf.id
  WHERE p2.company_id = ###companyId###
    AND (###policyId### = '' OR dpf.entity_id::text = ###policyId###)
  GROUP BY dpf.endorsement_id
) counts ON counts.endorsement_id = e.id
WHERE p.company_id = ###companyId###
  AND (###policyId### = '' OR e.policy_id::text = ###policyId###)
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_enrollment_employee_policy_map peepm_f
      INNER JOIN policy_enrollment_employee pee_f
        ON pee_f.id = peepm_f.employee_id AND pee_f.deleted_at IS NULL
      WHERE peepm_f.policy_id = p.id
        AND peepm_f.deleted_at IS NULL
        AND pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        )
    )
  )
  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = 'TOGGLE_TYPE_YES' AND inst_ld.deleted_at IS NULL))
  AND (###externalHrUserId### IS NULL
       OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
ORDER BY e.created_at DESC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 42)
-- ------------------------------------------------------------------
-- Filter: (no label -- stub/unconfigured parameter)
--   parameter_name : locationIds
--   token in query : ###locationIds###
--   data_type      : (none)
--   input_field    : (none -- likely unusable from the UI)
--   >>> STUB parameter row -- no type/label configured, this filter cannot be used from the generic screen.
--
-- Filter: Company ID
--   parameter_name : companyId
--   token in query : ###companyId###
--   data_type      : number
--   input_field    : input
--   order_no       : 1
--
-- Filter: Policy ID
--   parameter_name : policyId
--   token in query : ###policyId###
--   data_type      : string
--   input_field    : input
--   order_no       : 2
--
-- Filter: External HR User ID
--   parameter_name : externalHrUserId
--   token in query : ###externalHrUserId###
--   data_type      : number
--   input_field    : input
--   order_no       : 99
--

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 42)
-- ------------------------------------------------------------------
--   endorsementId                -> Endorsement ID                 (variable: endorsementId, type: number, align: right)
--   policyId                     -> Policy ID                      (variable: policyId, type: number, align: right)
--   policyNumber                 -> Policy Number                  (variable: policyNumber, type: string, align: left)
--   endorsementType              -> Endorsement Type               (variable: endorsementType, type: string, align: left)
--   enrollmentStartDate          -> Enrollment Start               (variable: enrollmentStartDate, type: string, align: left)
--   enrollmentEndDate            -> Enrollment End                 (variable: enrollmentEndDate, type: string, align: left)
--   createdAt                    -> Created At                     (variable: createdAt, type: string, align: left)
--   osTicketNumber               -> OS Ticket Number               (variable: osTicketNumber, type: string, align: left)
--   endorsementStatus            -> Endorsement Status             (variable: endorsementStatus, type: string, align: left)
--   uploadCount                  -> Upload Count                   (variable: uploadCount, type: number, align: right)
--   totalSuccessCount            -> Total Success Count            (variable: totalSuccessCount, type: number, align: right)
--   totalErrorCount              -> Total Error Count              (variable: totalErrorCount, type: number, align: right)
--   totalProcessCount            -> Total Process Count            (variable: totalProcessCount, type: number, align: right)

