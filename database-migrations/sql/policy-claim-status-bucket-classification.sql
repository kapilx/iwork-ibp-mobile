-- =============================================================================
-- policy_claim_status_bucket_classification
--
-- Classifies the raw TPA status strings already sitting in policy_claim_status
-- (auto-inserted with iirm_status = NULL by tpa-claims-parser.scheduler.ts the
-- first time each one is seen — see the INSERT ... ON CONFLICT (status) DO
-- NOTHING at that file's processRawResponse) into one of the four buckets the
-- Claim Analytics screen shows: APPROVED | PENDING | REJECTED | SETTLED.
--
-- Also updates admin_reports (id/name = 'policy_claim_history') so both the
-- "Claim TAT Overview" tile counts (HRPortalPolicySummary, reads
-- row.statusBucket) and the Claim Search filter (###claimStatus### param) are
-- driven by this same policy_claim_status.iirm_status lookup, instead of the
-- hardcoded ILIKE keyword lists this query previously used.
--
-- Because the query -> policy_claim_status join happens at READ time, running
-- the classification UPDATEs below retroactively reclassifies every existing
-- claim sharing that status, past and future — no claim data itself is
-- touched, and no reprocessing is needed.
--
-- A status not covered below (or a new one the parser inserts later) is left
-- with iirm_status = NULL — such claims still count under "ALL" but won't
-- match any of the four named buckets until classified here.
-- =============================================================================


-- ── Step 1: classify the 16 known raw statuses ──────────────────────────────
-- 4 judgment calls, flagged for confirmation (see prior discussion — easy to
-- move a status to a different bucket later, it's just a one-row UPDATE):
--   - READY FOR PAYMENT / PAYMENT INITIATED -> APPROVED (decision made,
--     payment not yet disbursed). Could instead be read as still PENDING if
--     the business doesn't consider it final until money moves.
--   - DEFICIENCY / CLAIM INTIMATION / RAL INTIMATION / INTIMATED -> PENDING
--     (unresolved / earliest stage, nothing decided yet).
UPDATE policy_claim_status SET iirm_status = 'PENDING'  WHERE status = 'PENDING';
UPDATE policy_claim_status SET iirm_status = 'SETTLED'  WHERE status = 'SETTLED';
UPDATE policy_claim_status SET iirm_status = 'REJECTED' WHERE status = 'CLAIM DENIED';
UPDATE policy_claim_status SET iirm_status = 'APPROVED' WHERE status = 'READY FOR PAYMENT';
UPDATE policy_claim_status SET iirm_status = 'REJECTED' WHERE status = 'UNDER REJECTION';
UPDATE policy_claim_status SET iirm_status = 'PENDING'  WHERE status = 'UNDER PROCESS';
UPDATE policy_claim_status SET iirm_status = 'APPROVED' WHERE status = 'PAYMENT INITIATED';
UPDATE policy_claim_status SET iirm_status = 'PENDING'  WHERE status = 'BANK DETAILS AWAITED';
UPDATE policy_claim_status SET iirm_status = 'PENDING'  WHERE status = 'CLAIM BILLS PENDING';
UPDATE policy_claim_status SET iirm_status = 'PENDING'  WHERE status = 'DEFICIENCY';
UPDATE policy_claim_status SET iirm_status = 'PENDING'  WHERE status = 'CLAIM INTIMATION';
UPDATE policy_claim_status SET iirm_status = 'PENDING'  WHERE status = 'RAL INTIMATION';
UPDATE policy_claim_status SET iirm_status = 'PENDING'  WHERE status = 'OUTSTANDING';
UPDATE policy_claim_status SET iirm_status = 'REJECTED' WHERE status = 'DENIED';
UPDATE policy_claim_status SET iirm_status = 'REJECTED' WHERE status = 'CANCELLED';
UPDATE policy_claim_status SET iirm_status = 'PENDING'  WHERE status = 'INTIMATED';


-- ── Verify (Step 1) ───────────────────────────────────────────────────────────
SELECT status, iirm_status
FROM policy_claim_status
ORDER BY status;


-- ── Step 2: policy_claim_history — statusBucket + iirmStatus, sourced from
--    policy_claim_status.iirm_status via a full query replacement ──────────
-- Full REPLACE of the stored query rather than a fragment patch — apply this
-- as-is on an environment whose policy_claim_history query already matches
-- the base this was built from (confirmed against this environment's actual
-- admin_reports row). For an environment with a differently-drifted query,
-- use the piecewise FIX 21 in hr-policy-summary-enrolled-only-fix.sql
-- instead, which patches fragments and is safe regardless of prior state.
UPDATE admin_reports
SET query = $fullquery$WITH latest_settlement AS (
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
  COALESCE(c.clm_allowed_amt, ls.settled_amount, 0) AS "approvedAmount",
  ls.settlement_date                               AS "settlementDate",
  INITCAP(COALESCE(c.claim_status, 'pending'))     AS "status",
  INITCAP(pcs.iirm_status)                         AS "statusBucket",
  pcs.iirm_status                                  AS "iirmStatus"
FROM policy_claim c
INNER JOIN policy p ON p.id = c.policy_id
LEFT JOIN policy_enrollment_employee pee ON pee.id = c.employee_id AND pee.deleted_at IS NULL
LEFT JOIN policy_enrollment_dependent ped ON ped.id = c.dependent_id AND ped.deleted_at IS NULL
LEFT JOIN mstr_hospital mh ON mh.id = c.hospital_id AND mh.deleted_at IS NULL
LEFT JOIN latest_settlement ls ON ls.claim_id = c.id
LEFT JOIN policy_claim_status pcs ON UPPER(TRIM(pcs.status)) = UPPER(TRIM(c.claim_status))
WHERE c.policy_id = ###policyId###
  AND (NULLIF(###employeeId###, '') IS NULL OR c.employee_id = NULLIF(###employeeId###, '')::int)
  AND (
    ###claimStatus### = ''
    OR UPPER(COALESCE(pcs.iirm_status, '')) = UPPER(###claimStatus###)
  )
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
ORDER BY c.claim_dt DESC NULLS LAST, c.id DESC$fullquery$,
    updated_at = NOW()
WHERE name = 'policy_claim_history';


-- ── Verify (Step 2) ───────────────────────────────────────────────────────────
SELECT
  name,
  CASE
    WHEN query NOT LIKE '%LEFT JOIN policy_claim_status%'
      THEN 'join NOT APPLIED ✗'
    WHEN query NOT LIKE '%INITCAP(pcs.iirm_status)%AS "statusBucket"%'
      THEN 'statusBucket NOT APPLIED ✗'
    WHEN query NOT LIKE '%pcs.iirm_status%AS "iirmStatus"%'
      THEN 'iirmStatus NOT APPLIED ✗'
    WHEN query LIKE '%c.claim_status ILIKE ''%settled%''%' OR query LIKE '%LOWER(c.claim_status) = LOWER(###claimStatus###)%'
      THEN 'claimStatus filter NOT APPLIED ✗'
    ELSE 'fully applied ✓'
  END AS status
FROM admin_reports
WHERE name = 'policy_claim_history';
