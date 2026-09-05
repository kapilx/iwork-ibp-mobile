-- =============================================================================
-- HR Portal — Policy Summary — endorsement_list: iWork parity round
-- Target: admin_reports 'endorsement_list' (id=42), which backs the IBP HR
--         Portal's per-endorsement accordion on
--         /hr-portal/policy-summary/:policyId, Enrolment tab — File Status
--         tiles/table, Premium breakdown / Changes cards, and the
--         Employees/Dependants figures on that same card.
--
--         iWork (apps/services/policy-service — PolicyRepository
--         getPolicyEndorsementStats / getEndorsementSteps) is NOT touched by
--         this file or by any other change in this round: it's the working
--         reference iWork numbers are compared against, not something to
--         "fix". Every change below is scoped to this one admin_reports row.
--
-- Companion code fix (ships via normal deployment, not this SQL file):
--   apps/services/ibp-service/src/app/hr-module/hr.repository.ts
--   getEnrollmentUploadSummaryByEndorsement — same File Status logic, kept
--   in sync with this query.
--
-- ── FIX 2l (SUPERSEDED by FIX 2o below — kept for history, not applied) ──
-- FIX 2l scoped the "counts" subquery to document_processing_file rows whose
--   OWN enrollment_start_date/enrollment_end_date matched the endorsement's
--   declared window, reasoning that an endorsement stays "open" and keeps
--   accumulating batches from later, unrelated enrollment windows. That
--   reasoning was correct, but the fix itself was wrong: iWork's own file
--   listing (confirmed via GET :policyId/:endorsementId/enrollment-upload-
--   summary-by-endorsement, policy-service policy.repository.ts:9451) does
--   NOT scope by date window either — it filters purely on endorsement_id.
--   So FIX 2l made IBP diverge from iWork (under-counting) instead of
--   matching it. See FIX 2o for the correction.
--
-- ── FIX 2m: netPremium/grossPremium/taxAmount/endorsmentCount/
--            endorsmentDependentCount now match iWork's raw batch numbers,
--            not an enrolled-only subset ──────────────────────────────────
-- PROBLEM: FIX 2c/2d/2f/2j (below, kept inline for history) deliberately
--   made these fields reflect only employees who'd actually completed
--   enrolment, and preferred policy.premium_at_inception over the
--   endorsement's own (occasionally stale) premium columns for inception.
--   That was a considered, explicit product decision at the time — but it
--   means this card structurally cannot agree with iWork's
--   endorsementSummary, which always shows the endorsement's raw, unfiltered
--   batch numbers (endorsement.net_premium / gross_premium,
--   endorsement.endorsment_count / endorsment_dependent_count), regardless
--   of how many of those people have finished enrolling. Per explicit
--   instruction (2026-08-09), full parity with iWork's numbers now takes
--   priority over the enrolled-only view for this card.
--
-- FIX: removed the enrolled-only CASE branches and the
--   policy.premium_at_inception preference. taxAmount/grossPremium/
--   netPremium/netGrossPremium/rawNetPremium/rawGrossPremium/
--   endorsmentCount/endorsmentDependentCount now always read straight from
--   the endorsement's own stored columns (COALESCE'd to 0 for
--   netPremium/grossPremium, matching iWork's `?? 0`), for every
--   endorsement type — inception included. The "enrolled" LATERAL join is
--   now unreferenced and has been removed.
--
-- ── FIX 2o: reverted FIX 2l's date-window filter on the "counts" subquery ──
-- PROBLEM: see FIX 2l note above — iWork does not scope its own file listing
--   by enrollment_start_date/end_date, only by endorsement_id. FIX 2l's
--   date-window filter caused IBP to under-count relative to iWork.
--   Confirmed on endorsement 30418: iWork's listing includes all 3 batches
--   tied to the endorsement (228 total/227 success/1 failed — batches 3068,
--   3065, and 3064, the last dated 01/08-04/08 vs the endorsement's own
--   declared 30/07-14/08 window), while FIX 2l''s date-filtered version only
--   matched 2 of them (158/158/0), dropping batch 3064.
-- FIX: removed the date-window condition. "counts" is back to a plain
--   GROUP BY dpf.endorsement_id, matching iWork exactly — and matching the
--   endorsement_id-only pattern already used by stillActiveAddedCount above
--   (which was never changed and turns out to have been the correct
--   approach all along).
--
-- HOW TO RUN: psql -h <host> -U <user> -d <dbname> -f endorsement-file-status-enrollment-window-scoping-fix.sql
-- SAFE TO RE-RUN: idempotent — re-applying identical content is harmless.
-- =============================================================================

UPDATE admin_reports
SET
  query = '
SELECT
  e.id                                                   AS "endorsementId",
  e.insurer_endorsement_number                           AS "insurerEndorsementId",
  e.policy_id                                            AS "policyId",
  p.insurer_policy_number                                AS "policyNumber",
  e.endorsement_type                                     AS "endorsementType",
  TO_CHAR(e.enrollment_start_date, ''DD/MM/YYYY'')         AS "enrollmentStartDate",
  TO_CHAR(e.enrollment_end_date,   ''DD/MM/YYYY'')         AS "enrollmentEndDate",
  TO_CHAR(e.created_at,            ''DD/MM/YYYY'')         AS "createdAt",
  e.os_ticket_number                                     AS "osTicketNumber",
  COALESCE(e.endorsement_status, '''')                     AS "endorsementStatus",
  COALESCE(counts.upload_count,  0)                      AS "uploadCount",
  COALESCE(counts.success_count, 0)                      AS "totalSuccessCount",
  COALESCE(counts.error_count,   0)                      AS "totalErrorCount",
  COALESCE(counts.process_count, 0)                      AS "totalProcessCount",
  COALESCE(e.basic_premium,  p.basic_premium)            AS "basePremium",

  e.gst_amount                                            AS "taxAmount",

  COALESCE(e.gross_premium, 0)                            AS "grossPremium",
  COALESCE(e.net_premium, 0)                              AS "netPremium",
  COALESCE(e.net_premium, e.gross_premium, 0)             AS "netGrossPremium",
  
  COALESCE(e.net_premium, 0)                              AS "rawNetPremium",
  COALESCE(e.gross_premium, 0)                            AS "rawGrossPremium",
  e.employee_endorsement_addition_count                 AS "rawAddedCount",
  e.employee_endorsement_deletion_count                 AS "rawDeletedCount",
  (SELECT COUNT(DISTINCT dep4.id)
   FROM policy_enrollment_dependent dep4
   WHERE dep4.deletion_endorsement_id = e.id
  )                                                      AS "rawDeletedDependentCount",

  (SELECT COUNT(DISTINCT pepm5.employee_id)
   FROM document_processing_file batch_dpf5
   INNER JOIN policy_enrollment_employee_policy_map pepm5
     ON pepm5.enrollment_addition_batch_id = batch_dpf5.document_id
     AND pepm5.deleted_at IS NULL
   WHERE batch_dpf5.endorsement_id = e.id
     AND pepm5.enrollment_deletion_batch_id IS NULL
  )                                                      AS "stillActiveAddedCount",

  COALESCE(e.endorsment_count, 0)                        AS "endorsmentCount",
  COALESCE(e.endorsment_dependent_count, 0)              AS "endorsmentDependentCount",
  COALESCE(e.is_inception, false)                        AS "isInception"
FROM endorsement e
INNER JOIN policy p ON p.id = e.policy_id
LEFT JOIN (
  -- FIX 2o: reverted the FIX 2l/2n date-window filter. Confirmed against
  -- iWork''s own listEnrollmentUploadSummary (policy-service policy.repository.ts:9451,
  -- GET :policyId/:endorsementId/enrollment-upload-summary-by-endorsement) that
  -- iWork does NOT scope by enrollment_start_date/end_date at all — it filters
  -- purely on entityType/entityId/endorsementId. FIX 2l''s date-window filter
  -- made IBP UNDER-count relative to iWork instead of matching it: on
  -- endorsement 30418, iWork''s own listing includes all 3 batches tied to the
  -- endorsement (228 total/227 success/1 failed across batches 3068, 3065,
  -- 3064 — the last dated 01/08-04/08, different from the endorsement''s own
  -- declared 30/07-14/08 window), while the date-filtered version only
  -- matched 2 of them (158/158/0), silently dropping batch 3064. Back to a
  -- plain endorsement_id GROUP BY, matching iWork exactly.
  SELECT
    dpf.endorsement_id,
    COUNT(DISTINCT dpf.id)              AS upload_count,
    COALESCE(SUM(s.success_count), 0)   AS success_count,
    COALESCE(SUM(s.error_count),   0)   AS error_count,
    COALESCE(SUM(s.process_count), 0)   AS process_count
  FROM document_processing_file dpf
  INNER JOIN policy p2 ON p2.id = dpf.entity_id AND dpf.entity_type = ''policy''
  LEFT JOIN policy_enrollment_upload_summary s ON s.document_processing_file_id = dpf.id
  WHERE p2.company_id = ###companyId###
    AND (###policyId### = '''' OR dpf.entity_id::text = ###policyId###)
  GROUP BY dpf.endorsement_id
) counts ON counts.endorsement_id = e.id
WHERE p.company_id = ###companyId###
  AND (###policyId### = '''' OR e.policy_id::text = ###policyId###)
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, ''[\[\]\s]'', '''', ''g'')), '''') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_enrollment_employee_policy_map peepm_f
      INNER JOIN policy_enrollment_employee pee_f
        ON pee_f.id = peepm_f.employee_id AND pee_f.deleted_at IS NULL
      WHERE peepm_f.policy_id = p.id
        AND peepm_f.deleted_at IS NULL
        AND pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, ''[\[\]\s]'', '''', ''g'')), ''''), '',''
          ) AS val WHERE val ~ ''^\d+$''
        )
    )
  )
  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))
  AND (###externalHrUserId### IS NULL
       OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
ORDER BY e.created_at DESC
',
  updated_at = NOW()
WHERE name = 'endorsement_list';

-- ── Verify ────────────────────────────────────────────────────────────────────
-- Checked against the actual SQL expressions that must be present (or, for
-- the reverted date-window filter, ABSENT) in the stored query — not comment
-- markers, which get stripped/edited over time and aren't a reliable signal.
SELECT
  id,
  name,
  CASE
    WHEN query LIKE '%GROUP BY dpf.endorsement_id%'
     AND query NOT LIKE '%dpf.enrollment_start_date = e2.enrollment_start_date%'
      THEN 'File Status scoped by endorsement_id only (matches iWork) ✓'
    ELSE 'File Status fix NOT applied as expected — check manually'
  END AS file_status_fix,
  CASE
    WHEN query LIKE '%COALESCE(e.gross_premium, 0)%'
     AND query LIKE '%COALESCE(e.net_premium, 0)%'
     AND query LIKE '%COALESCE(e.endorsment_count, 0)%'
     AND query LIKE '%COALESCE(e.endorsment_dependent_count, 0)%'
      THEN 'iWork premium/headcount parity fix applied ✓'
    ELSE 'Parity fix NOT applied — check manually'
  END AS parity_fix,
  updated_at
FROM admin_reports
WHERE id = 42;
