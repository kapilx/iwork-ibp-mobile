-- =============================================================================
-- policy-claim-history-location-fix.sql
--
-- Replaces the policy_claim_history query with the correct version that uses
-- Pattern A (employee-level) location filter: pee.policy_location.
--
-- WHY:
--   policy-location-final-fix.sql applied Pattern B (policy_configuration
--   selectedLocationIds EXISTS subquery) to this report — causing 0 records
--   when the policy's LIVE config doesn't explicitly list the selected location.
--   The dashboard claims analysis uses Pattern A (pee.policy_location) and
--   correctly returns 1 record.  pee is LEFT JOINed at the outer WHERE level,
--   so Pattern A is fully in scope and is the right approach here.
--
-- IDEMPOTENT: skips if Pattern A already present.
-- =============================================================================

BEGIN;

UPDATE admin_reports
SET query = $Q$
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
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR LOWER(TRIM(pee.policy_location)) IN (
      SELECT LOWER(TRIM(a.addr_1))
      FROM address a
      WHERE a.id = ANY(
        SELECT val::INTEGER
        FROM regexp_split_to_table(
          NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
          ','
        ) AS val
        WHERE val ~ '^\d+$'
      )
      AND a.deleted_at IS NULL
    )
  )
  AND (###externalHrUserId### IS NULL
       OR c.policy_id IN (
         SELECT policy_id FROM external_hr_policy_map
         WHERE user_id = ###externalHrUserId###::INTEGER
       ))
ORDER BY c.claim_dt DESC NULLS LAST, c.id DESC
$Q$,
updated_at = NOW()
WHERE name = 'policy_claim_history'
  AND query NOT LIKE '%pee.policy_location%';


-- Register locationIds parameter (idempotent)
INSERT INTO admin_reports_parameters
  (admin_report_id, parameter_name, query_parameter, created_at, updated_at, created_by, updated_by)
SELECT
  r.id, 'locationIds', '###locationIds###', NOW(), NOW(), 'SYSTEM', 'SYSTEM'
FROM admin_reports r
WHERE r.name = 'policy_claim_history'
  AND NOT EXISTS (
    SELECT 1 FROM admin_reports_parameters p
    WHERE p.admin_report_id = r.id AND p.parameter_name = 'locationIds'
  );


-- VERIFY
SELECT name,
  CASE
    WHEN query LIKE '%pee.policy_location%' AND query LIKE '%###locationIds###%'
      THEN 'OK — Pattern A (employee location filter)'
    WHEN query LIKE '%pcfg.policy_id = p.id%' AND query LIKE '%###locationIds###%'
      THEN 'WRONG — Pattern B still present (policy-level, returns 0 for employee claims)'
    WHEN query LIKE '%###locationIds###%'
      THEN 'HAS FILTER — unrecognized pattern, check manually'
    ELSE 'NO FILTER — locationIds not applied'
  END AS status
FROM admin_reports WHERE name = 'policy_claim_history';

COMMIT;
