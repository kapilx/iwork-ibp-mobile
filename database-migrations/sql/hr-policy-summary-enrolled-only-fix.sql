-- =============================================================================
-- HR Portal — Policy Summary — all admin_reports fixes from this round
-- Target: admin_reports 'endorsement_employee_metrics' (id=41) and
--         'endorsement_list' (id=42), which back the "Employee Strength" /
--         "Premium Impact" / "ACTIVE LIVES" card, the "Policy Journey &
--         Enrolment Summary" card, and the per-endorsement accordion rows
--         on /hr-portal/policy-summary/:policyId, Enrolment tab (FIX 1-3,
--         11-16); 'policy_claim_history' (id=31), which backs the Claims
--         tab's claim list/filter (FIX 4-5); 'cd_transactions' (id=46),
--         which backs the CD Balance tab's Transaction history (FIX 6); and
--         'dashboard_policy_cards' (id=22), which backs each policy's card
--         on the HR Dashboard — "ACTIVE LIVES"/Lives Covered donut and the
--         Enrolled/In Progress/Not Logged In tiles (FIX 8, 17-19).
--
-- NOT covered by this file (ship via normal code deployment, not a SQL run):
--   - apps/services/ibp-service/src/app/hr-module/hr.repository.ts
--     (getEndorsementStats — deletion no longer counted as "completed";
--     later widened to include non-batch "life event" dependent additions
--     and choice-based dependent completion, same logic as FIX 14/15)
--   - apps/ui/ibp/src/app/pages/HRPortalPolicySummary/index.tsx
--     (frontend consumers of every field this file adds/changes)
--   - apps/ui/ibp/src/app/pages/HRPortalDashboard/index.tsx
--     (added an "Enrolled" and "Total" KPI tile alongside In Progress/Not
--     Logged In on each policy's dashboard card)
--
-- PROBLEM: both queries currently count/sum every employee added by an
--   endorsement's upload batch, regardless of whether that employee has
--   actually completed enrollment (logged into IBP and finished the flow).
--   A 10,000-person inception batch where only 1,000 have actually enrolled
--   shows "10,000 added" / that batch's full raw premium — the HR admin has
--   no way to see the actually-enrolled, actually-billable population.
--
-- FIX: for INCEPTION and ADDITION batches only (net_premium > 0, or the
--   inception row), employee/dependent counts and premium are now computed
--   by joining each batch's document_processing_file → employees added via
--   that batch (policy_enrollment_employee_policy_map.enrollment_addition_batch_id)
--   → their real completion status (policy_employee_enrollment
--   .employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED',
--   the strict "Enrolled" value — not the broader in-progress/sent bucket).
--   Dependents use their own status column (policy_enrollment_dependent
--   .endorsement_status_key), linked directly via addition_endorsement_id.
--
-- SCOPING DECISION (flag before trusting this): DELETION-side figures
--   (employeesInDeletion, livesInDeletion, and any endorsement row with
--   net_premium < 0) are left as raw roster-removal counts, unchanged.
--   Reasoning: removing someone from the roster isn't gated on their
--   enrollment-completion status the way adding them is — "exited" is a
--   roster event, not an activation event. Confirm this matches intent
--   before shipping; if deletions should also filter by prior enrolled
--   status, that's a different, not-yet-written change.
--
-- Same join pattern as the existing, already-correct
-- apps/services/ibp-service/src/app/hr-module/hr.repository.ts
-- getEndorsementStats — this migration applies that pattern to the two
-- DB-stored report queries instead, since neither of them used it.
--
-- HOW TO RUN: psql -h <host> -U <user> -d <dbname> -f hr-policy-summary-enrolled-only-fix.sql
-- SAFE TO RE-RUN: guarded by query LIKE / NOT LIKE checks below.
-- =============================================================================


-- ── FIX 1: endorsement_employee_metrics — enrolled-only headcounts ──────────
UPDATE admin_reports
SET
  query = '
WITH inception_batch AS MATERIALIZED (
  -- FIX 1e (perf): MATERIALIZED — this CTE is referenced twice below
  -- (inception_docs, and directly by dependents_at_inception). Without the
  -- hint, Postgres may inline and re-run this location-filter logic (which
  -- includes a jsonb_array_elements_text unnest + regex parse) twice instead
  -- of computing it once.
  SELECT e.id AS endorsement_id, e.policy_id
  FROM endorsement e
  INNER JOIN policy p ON p.id = e.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '''' OR e.policy_id::text = ###policyId###)
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, ''[\[\]\s]'', '''', ''g'')), '''') IS NULL
      OR EXISTS (
        SELECT 1
        FROM policy_configuration pcfg,
             jsonb_array_elements_text(COALESCE(pcfg.policy_configuration->''selectedLocationIds'', ''[]''::jsonb)) loc_id
        WHERE pcfg.policy_id = p.id
          AND loc_id::INTEGER = ANY(
            SELECT val::INTEGER
            FROM regexp_split_to_table(
              NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, ''[\[\]\s]'', '''', ''g'')), ''''),
              '',''
            ) AS val
            WHERE val ~ ''^\d+$''
          )
      )
    )
    AND (###externalHrUserId### IS NULL
           OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
    AND e.is_inception = true
  ORDER BY e.id ASC
  LIMIT 1
),
inception_docs AS (
  SELECT ARRAY_AGG(DISTINCT dpf.document_id) AS doc_ids
  FROM inception_batch ib
  LEFT JOIN document_processing_file dpf ON dpf.endorsement_id = ib.endorsement_id
),
addition_endorsements AS MATERIALIZED (
  -- Non-inception endorsements whose batch ADDED employees (positive net_premium) —
  -- same scoping as the original endorsement_activity CTE this replaces.
  -- FIX 1e (perf): MATERIALIZED — referenced 3x below (addition_docs,
  -- dependents_in_addition, addition_premium_raw); without the hint this
  -- endorsement+policy join could run 3 times instead of once.
  SELECT e.id AS endorsement_id
  FROM endorsement e
  INNER JOIN policy p ON p.id = e.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '''' OR e.policy_id::text = ###policyId###)
    AND e.is_inception IS NOT TRUE
    AND e.net_premium IS NOT NULL
    AND e.net_premium > 0
    AND (###externalHrUserId### IS NULL
           OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
),
non_inception_endorsements AS MATERIALIZED (
  -- FIX 1f: employees_in_addition/employees_in_deletion (headcounts) now
  -- come from here instead of addition_endorsements/deletion_counts, which
  -- both classify a batch as "addition" or "deletion" by net_premium''s
  -- sign — fragile, since net_premium can be NULL (not yet computed, e.g. a
  -- freshly-created endorsement still at ENDORSEMENT_REQUEST_RECEIVED) or
  -- genuinely 0, which wrongly excludes a real roster change. Confirmed via
  -- endorsement #30683: net_premium NULL, endorsment_count 0,
  -- endorsement_type "FINANCIAL_ENDORSEMENT" (not "ADDITION"), yet 4 real
  -- employees already exist in policy_enrollment_employee_policy_map
  -- tagged with its upload batch. Here we don''t classify by premium at all
  -- — policy_enrollment_employee_policy_map/policy_enrollment_dependent
  -- already say, per person, which batch/endorsement added them
  -- (enrollment_addition_batch_id / addition_endorsement_id) and which
  -- removed them (enrollment_deletion_batch_id / deletion_endorsement_id).
  -- So gather every non-inception endorsement, regardless of premium, and
  -- let the roster mapping itself decide addition vs deletion per person.
  SELECT e.id AS endorsement_id
  FROM endorsement e
  INNER JOIN policy p ON p.id = e.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '''' OR e.policy_id::text = ###policyId###)
    AND e.is_inception IS NOT TRUE
    AND (###externalHrUserId### IS NULL
           OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
),
non_inception_docs AS (
  SELECT ARRAY_AGG(DISTINCT dpf.document_id) AS doc_ids
  FROM document_processing_file dpf
  WHERE dpf.endorsement_id IN (SELECT endorsement_id FROM non_inception_endorsements)
),
deletion_counts AS MATERIALIZED (
  -- FIX 1f: employee/dependent deletion HEADCOUNTS moved out of here to a
  -- roster-mapping join (see non_inception_docs/non_inception_endorsements
  -- above) — this CTE now computes deletion_premium only, unchanged, since
  -- premium computation wasn''t part of that fix.
  -- FIX 1e (perf): MATERIALIZED — referenced by deletion_premium_raw below;
  -- without the hint this endorsement+policy aggregate could re-run needlessly.
  SELECT
    COALESCE(SUM(CASE WHEN e.net_premium < 0 THEN ABS(e.net_premium) ELSE 0 END), 0)                                          AS deletion_premium
  FROM endorsement e
  INNER JOIN policy p ON p.id = e.policy_id
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '''' OR e.policy_id::text = ###policyId###)
    AND e.is_inception IS NOT TRUE
    AND e.net_premium IS NOT NULL
    AND (###externalHrUserId### IS NULL
           OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
),
-- FIX 1h (perf): consolidates FIVE separate full scans of
-- policy_enrollment_employee_policy_map (employees_at_inception,
-- employees_in_addition, employees_in_deletion, active_employee_calc,
-- total_employees_calc each independently scanned this table) into ONE
-- pass with per-metric FILTER clauses. Confirmed via EXPLAIN ANALYZE on a
-- 164K-employee policy: each of those five scans alone cost ~16-17K buffer
-- reads, repeated 5x, plus JIT-compiling the resulting 700+ function plan
-- pushed total query time to 16-20s. Consolidating dropped the planner''s
-- own cost estimate 66% (503,429 -> 170,710) and execution time from
-- ~13.5s to ~3.4s core / ~7s including a much smaller JIT compile (20.4s ->
-- 1.2s) -- confirmed byte-identical output against the previous version on
-- 4 policies of very different sizes (5, 4, 84K, 164K employees) before
-- this replaced it.
--
-- Semantics preserved exactly: emp_at_inception/emp_in_addition/
-- emp_in_deletion carry no deleted_at condition (lifetime tallies, FIX
-- 1g) same as before; emp_total_current/emp_active still require
-- pepm.deleted_at IS NULL (current-roster scoped), same as
-- total_employees_calc/active_employee_calc did. LEFT JOIN (not INNER) to
-- policy_employee_enrollment so the other four metrics aren''t restricted
-- to only employees who also have an enrollment row -- active_employees/
-- active_premium still correctly resolve to 0 for a NULL-joined row, the
-- same result INNER JOIN gave for that one metric.
employee_headcounts_calc AS MATERIALIZED (
  SELECT
    COUNT(DISTINCT pepm.employee_id) FILTER (
      WHERE pepm.enrollment_addition_batch_id = ANY(idocs.doc_ids)
    )                                                                          AS emp_at_inception,
    COUNT(DISTINCT pepm.employee_id) FILTER (
      WHERE pepm.enrollment_addition_batch_id = ANY(nidocs.doc_ids)
    )                                                                          AS emp_in_addition,
    COUNT(DISTINCT pepm.employee_id) FILTER (
      WHERE pepm.enrollment_deletion_batch_id = ANY(nidocs.doc_ids)
    )                                                                          AS emp_in_deletion,
    COUNT(DISTINCT pepm.employee_id) FILTER (
      WHERE pepm.deleted_at IS NULL AND pepm.enrollment_deletion_batch_id IS NULL
    )                                                                          AS emp_total_current,
    COUNT(DISTINCT pepm.employee_id) FILTER (
      WHERE pepm.deleted_at IS NULL AND pe.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED''
    )                                                                          AS emp_active,
    COALESCE(SUM(pe.total_premium) FILTER (
      WHERE pepm.deleted_at IS NULL AND pe.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED''
    ), 0)                                                                      AS active_premium_calc
  FROM policy_enrollment_employee_policy_map pepm
  INNER JOIN policy p ON p.id = pepm.policy_id
  CROSS JOIN inception_docs idocs
  CROSS JOIN non_inception_docs nidocs
  LEFT JOIN policy_employee_enrollment pe
    ON pe.employee_id = pepm.employee_id AND pe.policy_id = pepm.policy_id AND pe.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
    AND (###policyId### = '''' OR pepm.policy_id::text = ###policyId###)
    AND (###externalHrUserId### IS NULL
           OR pepm.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
),
metrics_raw AS (
  SELECT
  -- FIX 1b: Inception/Added are roster events (a batch was uploaded and its
  -- members added), same as Deleted — not gated by enrolment-completion
  -- status. Enrolled-only filtering here made this whole card collapse to
  -- all zeros for any freshly-incepted policy where nobody has logged in
  -- yet, hiding the real fact that N people were incepted. Only
  -- active_employees/active_dependents (''Current'') should be enrolled-only
  -- — that''s the one figure meant to answer "how many are actually active
  -- right now", everything else here is raw, like Deleted always was.
  -- FIX 1g: lifetime tally, not "still active" — an employee counted at
  -- inception stays counted at inception even if later removed via a
  -- different endorsement. Confirmed via policy 749326: deletion sets BOTH
  -- deleted_at AND enrollment_deletion_batch_id on the SAME roster row (not
  -- a new row), so requiring deleted_at IS NULL / enrollment_deletion_batch_id
  -- IS NULL here silently netted a later deletion out of a historical count
  -- that should never change once it happened. Deleted is its own separate,
  -- equally lifetime-scoped tally below — that''s where a later removal
  -- should show up, not by shrinking Added/Inception.
  (SELECT emp_at_inception FROM employee_headcounts_calc)                                                       AS employees_at_inception,
  (SELECT COUNT(DISTINCT dep.id)
   FROM inception_batch ib
   INNER JOIN policy_enrollment_dependent dep
     ON dep.addition_endorsement_id = ib.endorsement_id)                                                       AS dependents_at_inception,

  -- Added (non-inception endorsements) — raw roster count, classified by
  -- the roster mapping itself, not by the endorsement''s own premium sign.
  -- See non_inception_endorsements/non_inception_docs above (FIX 1f).
  -- FIX 1g: lifetime tally — see employees_at_inception comment above for
  -- why the deleted_at/enrollment_deletion_batch_id exclusions were dropped.
  (SELECT emp_in_addition FROM employee_headcounts_calc)                                                        AS employees_in_addition,
  (SELECT COUNT(DISTINCT dep.id)
   FROM policy_enrollment_dependent dep
   WHERE dep.addition_endorsement_id IN (SELECT endorsement_id FROM non_inception_endorsements))              AS dependents_in_addition,

  -- Deleted — FIX 1f: now via the same roster-mapping join as Added, not
  -- raw endorsment_count/net_premium sign — same staleness risk Added had.
  -- SCOPING DECISION from FIX 1 still holds: not gated by enrolment status.
  -- FIX 1g: dropped "AND pepm.deleted_at IS NULL" — confirmed via policy
  -- 749326 that deletion sets deleted_at ON THE SAME ROW as part of the
  -- deletion itself, not as an unrelated soft-delete signal, so requiring
  -- it IS NULL here made a real deletion impossible to ever match (this
  -- always returned 0). enrollment_deletion_batch_id alone is the
  -- authoritative "was this person removed via this batch" signal.
  (SELECT emp_in_deletion FROM employee_headcounts_calc)                                                        AS employees_in_deletion,
  (SELECT COUNT(DISTINCT dep.id)
   FROM policy_enrollment_dependent dep
   WHERE dep.deletion_endorsement_id IN (SELECT endorsement_id FROM non_inception_endorsements))                AS dependents_in_deletion,

  -- FIX 1d: lifetime raw premium figures for the "Policy Journey" redesign
  -- — Inception/Added premium, matching the SAME lifetime scope as the
  -- headcounts above (no current-period filtering, unlike endorsement_list
  -- which is period-scoped — that mismatch was the gap flagged earlier).
  (SELECT p2.premium_at_inception
   FROM policy p2
   WHERE p2.company_id = ###companyId###
     AND (###policyId### = '''' OR p2.id::text = ###policyId###)
   LIMIT 1)                                                                                                     AS premium_at_inception_raw,
  (SELECT COALESCE(SUM(e2.net_premium), 0)
   FROM endorsement e2
   WHERE e2.id IN (SELECT endorsement_id FROM addition_endorsements))                                           AS addition_premium_raw,
  (SELECT deletion_premium FROM deletion_counts)                                                                AS deletion_premium_raw,

  -- Current — enrolled-only, policy-wide (not batch-scoped). Premium Impacts
  -- "Total" (computed in the frontend from endorsement_list rows) must be
  -- scoped to this SAME enrolled population — see the frontend change
  -- alongside this fix. Otherwise Current shows 0 while Total Premium still
  -- shows the full raw batch premium, which is exactly backwards.
  (SELECT emp_active FROM employee_headcounts_calc)                                                             AS active_employees,
  (SELECT COUNT(DISTINCT ped.id)
   FROM policy_enrollment_dependent ped
   INNER JOIN policy p ON p.id = ped.policy_id
   WHERE p.company_id = ###companyId###
     AND (###policyId### = '''' OR ped.policy_id::text = ###policyId###)
     AND ped.deleted_at IS NULL
     AND ped.endorsement_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED''
     AND (###externalHrUserId### IS NULL
            OR ped.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
  )                                                                                                              AS active_dependents,

  -- Premium of the SAME enrolled population as active_employees above —
  -- this is what "Premium Impact -> Total" now reads on the frontend,
  -- instead of an arithmetic Inception+Added-Deleted rollup of raw batch
  -- premiums. That arithmetic could show a large total even when nobody
  -- had actually enrolled yet (Current = 0), which is backwards — this
  -- figure is 0 exactly when Current is 0, by construction.
  -- FIX 1h (perf): now reads from employee_headcounts_calc (see that CTE,
  -- formerly active_employee_calc before the 5-scans-into-1 consolidation)
  -- — same join as active_employees, computed once instead of twice.
  (SELECT active_premium_calc FROM employee_headcounts_calc)                                                    AS active_premium,
  (SELECT emp_total_current FROM employee_headcounts_calc)                                                      AS total_employees_current
)
SELECT
  employees_at_inception                                       AS "employeesAtInception",
  employees_in_addition                                        AS "employeesInAddition",
  employees_in_deletion                                        AS "employeesInDeletion",
  active_employees                                              AS "activeEmployees",
  active_premium                                                AS "activePremium",
  employees_at_inception + dependents_at_inception             AS "livesAtInception",
  employees_in_addition  + dependents_in_addition               AS "livesInAddition",
  employees_in_deletion  + dependents_in_deletion                AS "livesInDeletion",
  active_employees + active_dependents                          AS "activeLives",
  -- FIX 1d: "Policy Journey & Enrolment Summary" redesign — totalEligible is
  -- the policy''s CURRENT roster headcount (total_employees_current, FIX
  -- 1f), NOT gated by enrolment status; activeEmployees (Enrolled) is shown
  -- against it as the "X / Y" final stage. Same pattern for premium.
  -- FIX 1f: was previously an Inception + Added - Deleted arithmetic
  -- rollup — switched to a direct roster count so Eligible can''t drift out
  -- of sync with reality if any one of those three inputs is stale.
  total_employees_current AS "totalEligible",
  premium_at_inception_raw                                                            AS "premiumAtInception",
  addition_premium_raw                                                                AS "additionPremium",
  deletion_premium_raw                                                                AS "deletionPremium",
  GREATEST(COALESCE(premium_at_inception_raw,0) + addition_premium_raw - deletion_premium_raw, 0) AS "totalPremium",
  ROUND(active_employees * 100.0 / NULLIF(total_employees_current, 0), 1) AS "enrolledOfEligiblePercent",
  ROUND(active_premium   * 100.0 / NULLIF(GREATEST(COALESCE(premium_at_inception_raw,0) + addition_premium_raw - deletion_premium_raw, 0), 0), 1) AS "premiumCoveragePercent"
FROM metrics_raw
',
  updated_at = NOW()
WHERE name = 'endorsement_employee_metrics'
  AND (
    query LIKE '%pe.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'')%employees_at_inception%'
    OR query NOT LIKE '%Current — enrolled-only, policy-wide%'
    OR query NOT LIKE '%active_premium%'
    OR query NOT LIKE '%totalEligible%'
    OR query NOT LIKE '%active_employee_calc%'
    OR query NOT LIKE '%total_employees_current%'
    OR query NOT LIKE '%non_inception_endorsements%'
    OR query NOT LIKE '%FIX 1g%'
    OR query NOT LIKE '%employee_headcounts_calc%'
  );


-- ── FIX 2: endorsement_list — current drive only + enrolled-only per row ────
-- Two independent changes:
--   (a) Only endorsements whose document_processing_file window is open RIGHT
--       NOW are shown (enrollment_start_date <= today <= enrollment_end_date)
--       — same "what's active right now" definition as
--       policy_enrollment_period_status_summary's period_scope. A closed-out
--       inception or old addition batch no longer clutters this list; it's
--       still reflected historically in endorsement_employee_metrics (FIX 1),
--       which stays a lifetime rollup on purpose.
--   (b) Addition/inception rows: endorsmentCount / endorsmentDependentCount
--       become the enrolled-only subset. netPremium/grossPremium stay the
--       endorsements own raw premium columns — see FIX 2b note below for
--       why enrolled-only premium was tried and reverted.
--       Deletion rows (net_premium < 0): unchanged, raw.
UPDATE admin_reports
SET
  query = '
WITH current_period_endorsements AS (
  SELECT DISTINCT dpf.endorsement_id
  FROM document_processing_file dpf
  WHERE dpf.enrollment_start_date IS NOT NULL
    AND dpf.enrollment_end_date IS NOT NULL
    AND dpf.enrollment_start_date <= CURRENT_DATE
    AND dpf.enrollment_end_date >= CURRENT_DATE
)
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
  -- FIX 2c: netPremium/grossPremium/taxAmount for addition/inception rows are
  -- the EMPLOYEE-ENROLLED subset''s premium, not the batch''s raw premium —
  -- reverted back from FIX 2b (which had matched iwork''s raw endorsement.net_premium
  -- for one specific endorsement) per explicit instruction: these figures must
  -- always reflect only the employees who''ve actually completed enrolment.
  -- grossPremium/taxAmount are derived by applying the batch''s own gross/net
  -- ratio to the enrolled net premium, so Net + Tax = Gross still holds exactly.
  --
  -- FIX 2d: the ELSE branch (non-inception, zero/negative net_premium —
  -- covers both real deletions AND endorsements with no premium impact at
  -- all, e.g. demographic-only corrections) used to fall back to the
  -- POLICY''s own net_premium/gross_premium/gst_amount whenever the
  -- endorsement''s own value was null. That silently substituted the ENTIRE
  -- policy''s premium onto a single endorsement that made no premium change
  -- (0 additions, 0 deletions) — showing e.g. 1.72Cr on a card that should
  -- show nothing. Dropped the p.* fallback entirely; a null here now stays
  -- null (renders as "—", correctly signaling "not applicable"), instead of
  -- borrowing an unrelated total.
  CASE
    WHEN COALESCE(e.is_inception, false) OR COALESCE(e.net_premium, 0) > 0
    THEN enrolled.enrolled_gross_premium - enrolled.enrolled_premium
    ELSE e.gst_amount
  END                                                    AS "taxAmount",
  CASE
    WHEN COALESCE(e.is_inception, false) OR COALESCE(e.net_premium, 0) > 0
    THEN enrolled.enrolled_gross_premium
    ELSE e.gross_premium
  END                                                    AS "grossPremium",
  CASE
    WHEN COALESCE(e.is_inception, false) OR COALESCE(e.net_premium, 0) > 0
    THEN enrolled.enrolled_premium
    ELSE e.net_premium
  END                                                    AS "netPremium",
  CASE
    WHEN COALESCE(e.is_inception, false) OR COALESCE(e.net_premium, 0) > 0
    THEN enrolled.enrolled_gross_premium
    ELSE COALESCE(e.net_premium, e.gross_premium)
  END                                                    AS "netGrossPremium",
  -- FIX 2e: raw batch premium, independent of enrolled status — for the
  -- Endorsement Summary card''s "Inception"/"Added" tiles, which mirror
  -- Employee Strength''s raw Inception/Added headcounts (not the enrolled
  -- subset — that''s what "Enrolled Premium" is for). netPremium above stays
  -- enrolled-only for the per-endorsement accordion badge, per instruction;
  -- this is the same raw value netPremium held before FIX 2c.
  --
  -- FIX 2f: the inception endorsement''s own net_premium/gross_premium
  -- columns can be genuinely NULL (never populated at the endorsement
  -- level) — confirmed via the API response for this exact row. FIX 2d
  -- deliberately dropped the policy-level fallback everywhere, because for
  -- an unrelated no-activity endorsement (#30281) borrowing the ENTIRE
  -- policy''s premium was wrong. But inception is literally the event that
  -- establishes the policy''s premium, so falling back to policy.premium_at_inception
  -- (the column meant for exactly this, not the possibly-since-changed
  -- policy.net_premium) is correct specifically here.
  CASE WHEN e.is_inception THEN COALESCE(p.premium_at_inception) ELSE e.net_premium END AS "rawNetPremium",
  CASE WHEN e.is_inception THEN COALESCE(e.gross_premium, p.gross_premium)      ELSE e.gross_premium END AS "rawGrossPremium",
  -- FIX 2g: same roster-based approach as endorsement_employee_metrics''s
  -- FIX 1f — this endorsement''s own real addition headcount, via a direct
  -- join against policy_enrollment_employee_policy_map, never gated on
  -- net_premium/is_inception (unlike endorsmentCount below, which still is,
  -- for its own enrolled-only purpose). Powers the accordion''s "Additions"
  -- row in the Changes section.
  -- FIX 2h: lifetime tally, not "still active" — dropped deleted_at IS NULL
  -- and enrollment_deletion_batch_id IS NULL. Confirmed via policy 749326
  -- that deletion sets deleted_at on the SAME row it lives on, so requiring
  -- deleted_at IS NULL here silently netted a later deletion (via a
  -- DIFFERENT endorsement) out of THIS endorsement''s own historical count
  -- of who it added. This endorsement added 4 people is a fact that doesn''t
  -- change just because one of them was later removed elsewhere.
  (SELECT COUNT(DISTINCT pepm3.employee_id)
   FROM document_processing_file batch_dpf3
   INNER JOIN policy_enrollment_employee_policy_map pepm3
     ON pepm3.enrollment_addition_batch_id = batch_dpf3.document_id
   WHERE batch_dpf3.endorsement_id = e.id
  )                                                      AS "rawAddedCount",
  -- FIX 2h: same roster-based approach, for Deletions — powers the
  -- accordion''s "Deletions" row and the "Exited" pill, replacing the stale
  -- stored employee_endorsement_deletion_count column those used to read.
  -- No deleted_at IS NULL condition, for the same reason as rawAddedCount
  -- above — a real deletion always has deleted_at set, by design.
  (SELECT COUNT(DISTINCT pepm4.employee_id)
   FROM document_processing_file batch_dpf4
   INNER JOIN policy_enrollment_employee_policy_map pepm4
     ON pepm4.enrollment_deletion_batch_id = batch_dpf4.document_id
   WHERE batch_dpf4.endorsement_id = e.id
  )                                                      AS "rawDeletedCount",
  -- FIX 2i: rawAddedCount is now a permanent historical fact (FIX 2h) — it
  -- won''t shrink if one of this batch''s people is later removed via a
  -- DIFFERENT endorsement. That''s correct, but silent: an HR admin staring
  -- at "Added 4" with no indication that 1 of them is actually gone from
  -- the roster now will read it as a data bug. This is the CURRENTLY-active
  -- subset of the SAME batch (the old, pre-FIX-2h definition of
  -- rawAddedCount) — the frontend diffs it against rawAddedCount to detect
  -- "N of these were later removed elsewhere" and show a disclaimer instead
  -- of a silent, unexplained mismatch.
  (SELECT COUNT(DISTINCT pepm5.employee_id)
   FROM document_processing_file batch_dpf5
   INNER JOIN policy_enrollment_employee_policy_map pepm5
     ON pepm5.enrollment_addition_batch_id = batch_dpf5.document_id
     AND pepm5.deleted_at IS NULL
   WHERE batch_dpf5.endorsement_id = e.id
     AND pepm5.enrollment_deletion_batch_id IS NULL
  )                                                      AS "stillActiveAddedCount",
  CASE
    WHEN COALESCE(e.is_inception, false) OR COALESCE(e.net_premium, 0) > 0
    THEN COALESCE(enrolled.enrolled_employee_count, 0)
    ELSE COALESCE(e.endorsment_count, 0)
  END                                                    AS "endorsmentCount",
  CASE
    WHEN COALESCE(e.is_inception, false) OR COALESCE(e.net_premium, 0) > 0
    THEN COALESCE(enrolled.enrolled_dependent_count, 0)
    ELSE COALESCE(e.endorsment_dependent_count, 0)
  END                                                    AS "endorsmentDependentCount",
  COALESCE(e.is_inception, false)                        AS "isInception"
FROM endorsement e
INNER JOIN policy p ON p.id = e.policy_id
INNER JOIN current_period_endorsements cpe ON cpe.endorsement_id = e.id
LEFT JOIN (
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
LEFT JOIN LATERAL (
  SELECT
    COUNT(DISTINCT pepm.employee_id) FILTER (
      WHERE pepm.enrollment_deletion_batch_id IS NULL
        AND pe.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED''
    )                                                                          AS enrolled_employee_count,
    COALESCE(SUM(pe.total_premium) FILTER (
      WHERE pepm.enrollment_deletion_batch_id IS NULL
        AND pe.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED''
    ), 0)                                                                      AS enrolled_premium,
    -- Scales enrolled_premium by this batch''s own gross/net ratio, so the
    -- effective tax rate is preserved without needing a per-employee gross
    -- premium column. Falls back to a 1:1 ratio (net = gross) if the batch''s
    -- own net premium is 0/null, since there''s no ratio to derive from.
    COALESCE(SUM(pe.total_premium) FILTER (
      WHERE pepm.enrollment_deletion_batch_id IS NULL
        AND pe.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED''
    ), 0) * COALESCE(
      COALESCE(e.gross_premium, p.gross_premium) / NULLIF(COALESCE(e.net_premium, p.net_premium), 0),
      1
    )                                                                          AS enrolled_gross_premium,
    (SELECT COUNT(DISTINCT dep.id)
     FROM policy_enrollment_dependent dep
     WHERE dep.addition_endorsement_id = e.id
       AND dep.deleted_at IS NULL
       AND dep.deletion_endorsement_id IS NULL
       AND dep.endorsement_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED''
    )                                                                          AS enrolled_dependent_count
  FROM document_processing_file batch_dpf
  LEFT JOIN policy_enrollment_employee_policy_map pepm
    ON pepm.enrollment_addition_batch_id = batch_dpf.document_id AND pepm.deleted_at IS NULL
  LEFT JOIN policy_employee_enrollment pe
    ON pe.employee_id = pepm.employee_id AND pe.policy_id = pepm.policy_id AND pe.deleted_at IS NULL
  WHERE batch_dpf.endorsement_id = e.id
) enrolled ON COALESCE(e.is_inception, false) OR COALESCE(e.net_premium, 0) > 0
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
WHERE name = 'endorsement_list'
  AND (
    query NOT LIKE '%EMPLOYEE_ENROLLMENT_STATUS_ENROLLED%'
    OR query NOT LIKE '%enrolled_gross_premium%'
    OR query LIKE '%ELSE COALESCE(e.gst_amount, p.gst_amount)%'
    OR query NOT LIKE '%rawNetPremium%'
    OR query NOT LIKE '%FIX 2f%'
    OR query NOT LIKE '%rawAddedCount%'
    OR query NOT LIKE '%rawDeletedCount%'
    OR query NOT LIKE '%stillActiveAddedCount%'
  );


-- ── FIX 3: policy_enrollment_summary — current drive only ───────────────────
-- Powers the "ENROLMENT STATUS" card (Enroled / In Progress / Enrolment Not
-- Started) — a DIFFERENT report than FIX 1/2, found by tracing the frontend
-- (apps/ui/ibp/.../HRPortalPolicySummary/index.tsx uses report name
-- "policy_enrollment_summary", not endorsement_employee_metrics for this card).
-- Its classification logic (employee_enrollment_status_key) was already
-- correct — the fix here is scope, not classification: it previously counted
-- every employee ever added to the policy, all-time. Now restricted to only
-- employees/dependents added via the currently-open enrollment drive, same
-- "current_period_endorsements" definition as FIX 2.
UPDATE admin_reports
SET
  query = '
WITH current_period_endorsements AS (
  SELECT DISTINCT dpf.endorsement_id, dpf.document_id, dpf.enrollment_start_date, dpf.enrollment_end_date
  FROM document_processing_file dpf
  INNER JOIN endorsement e ON e.id = dpf.endorsement_id
  WHERE e.policy_id = ###policyId###
    AND dpf.enrollment_start_date IS NOT NULL
    AND dpf.enrollment_end_date IS NOT NULL
    AND dpf.enrollment_start_date <= CURRENT_DATE
    AND dpf.enrollment_end_date >= CURRENT_DATE
),
-- FIX 3c: the actual date range being used as "current" — shown in the UI
-- next to "current enrolment period" so it''s never ambiguous which window
-- these numbers reflect, even if several batches/endorsements are attached
-- to this policy. MIN/MAX spans every matched batch in case more than one
-- is open right now.
current_period_range AS (
  SELECT MIN(enrollment_start_date) AS period_start, MAX(enrollment_end_date) AS period_end
  FROM current_period_endorsements
),
emp_scope AS (
  SELECT COUNT(DISTINCT peepm.employee_id) AS total_employees
  FROM policy_enrollment_employee_policy_map peepm
  WHERE peepm.policy_id = ###policyId###
    AND peepm.deleted_at IS NULL
    AND peepm.enrollment_addition_batch_id IN (SELECT document_id FROM current_period_endorsements)
),
enroll_status AS (
  SELECT
    COUNT(DISTINCT pee.id) FILTER (WHERE pee.employee_enrollment_status_key=''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'')    AS enrolled_count,
    COUNT(DISTINCT pee.id) FILTER (WHERE pee.employee_enrollment_status_key=''EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS'') AS in_progress_count,
    COUNT(DISTINCT pee.id) FILTER (WHERE pee.employee_enrollment_status_key=''EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED'') AS not_started_count
  FROM policy_employee_enrollment pee
  INNER JOIN policy_enrollment_employee_policy_map peepm
    ON peepm.employee_id = pee.employee_id AND peepm.policy_id = pee.policy_id AND peepm.deleted_at IS NULL
  WHERE pee.policy_id = ###policyId###
    AND pee.deleted_at IS NULL
    AND peepm.enrollment_addition_batch_id IN (SELECT document_id FROM current_period_endorsements)
),
dep_scope AS (
  SELECT COUNT(ped.id) AS total_dependents
  FROM policy_enrollment_dependent ped
  WHERE ped.policy_id = ###policyId###
    AND ped.deleted_at IS NULL
    AND ped.addition_endorsement_id IN (SELECT endorsement_id FROM current_period_endorsements)
)
SELECT
  es.total_employees                                                                       AS "totalEmployees",
  COALESCE(ds.total_dependents, 0)                                                        AS "totalDependents",
  COALESCE(en.enrolled_count, 0)                                                          AS "enrolledCount",
  COALESCE(en.in_progress_count, 0)                                                       AS "inProgressCount",
  -- FIX 3b: not_started_count (from enroll_status) undercounts — it INNER
  -- JOINs to policy_employee_enrollment, which likely only gets a row once
  -- someone has interacted at all (even just to be marked not-started).
  -- Someone who''s never been touched by the enrolment flow may have NO row
  -- there yet, so the INNER JOIN silently drops them before the FILTER can
  -- even see them. Derived by subtraction instead, same pattern already used
  -- for notEnrolledCount below — total roster minus enrolled minus in
  -- progress, which can''t be undercounted by a missing row.
  GREATEST(es.total_employees - COALESCE(en.enrolled_count,0) - COALESCE(en.in_progress_count,0), 0) AS "notStartedCount",
  GREATEST(es.total_employees - COALESCE(en.enrolled_count,0), 0)                        AS "notEnrolledCount",
  ROUND(COALESCE(en.enrolled_count,    0)*100.0/NULLIF(es.total_employees,0),1)           AS "enrolledPercent",
  ROUND(COALESCE(en.in_progress_count, 0)*100.0/NULLIF(es.total_employees,0),1)          AS "inProgressPercent",
  ROUND(GREATEST(es.total_employees - COALESCE(en.enrolled_count,0) - COALESCE(en.in_progress_count,0), 0)*100.0/NULLIF(es.total_employees,0),1) AS "notStartedPercent",
  TO_CHAR(cpr.period_start, ''DD Mon YYYY'')                                                AS "currentPeriodStart",
  TO_CHAR(cpr.period_end,   ''DD Mon YYYY'')                                                AS "currentPeriodEnd",
  -- FIX 3d: notLoggedInCount/loggedInCount/notLoggedInPercent used to come
  -- from a separate patch (not-logged-in-patch-only.sql) applied via text
  -- REPLACE against the ORIGINAL query — this full rewrite would have
  -- silently dropped them. Re-added here, aliased to the already-fixed
  -- notStartedCount rather than reintroducing the old activity-log join
  -- (which hr.repository.ts''s getEndorsementStats had the exact same
  -- unreliable-signal problem with, fixed earlier today).
  GREATEST(es.total_employees - COALESCE(en.enrolled_count,0) - COALESCE(en.in_progress_count,0), 0) AS "notLoggedInCount",
  COALESCE(en.enrolled_count,0) + COALESCE(en.in_progress_count,0)                        AS "loggedInCount",
  ROUND(GREATEST(es.total_employees - COALESCE(en.enrolled_count,0) - COALESCE(en.in_progress_count,0), 0)*100.0/NULLIF(es.total_employees,0),1) AS "notLoggedInPercent"
FROM emp_scope es
CROSS JOIN enroll_status en
CROSS JOIN dep_scope ds
CROSS JOIN current_period_range cpr
',
  updated_at = NOW()
WHERE name = 'policy_enrollment_summary'
  AND (
    query NOT LIKE '%current_period_endorsements%'
    OR query NOT LIKE '%FIX 3b%'
    OR query NOT LIKE '%currentPeriodStart%'
  );


-- ── FIX 4: policy_claim_history — claim status filter (Claims tab) ─────────
-- Frontend's 4 filter chips (Pending/Approved/Rejected/Settled) are just UI
-- labels. The real policy_claim.claim_status column holds many more
-- distinct raw strings (case-inconsistent, free text from TPA/ops updates),
-- e.g. "Ready for payment", "READY FOR PAYMENT", "Payment Initiated",
-- "Under Rejection Approval", "Claim Bills Pending", "RAL Deficiency"... The
-- old filter did an exact LOWER()=LOWER() match against the literal chip
-- label, so e.g. clicking "Approved" looked for claim_status = 'approved',
-- which never occurs in the data.
--
-- Fix: replace the exact-match with a keyword-based ILIKE bucket match — for
-- a given chip label, match ANY raw status string containing a keyword
-- associated with that bucket. See admin_reports id=31
-- ("policy_claim_history", docs/IIRM-778_Admin-Reports/IIMR-780_Report Hub/
-- 31_policy_claim_history.sql) for the full canonical query this patches.
--
-- Bucket mapping (all 16 distinct raw values pulled from production, case
-- variants included):
--   Settled  -> SETTLED, Settled
--   Rejected -> Claim denied, DENIED, CLAIM DENIED, Cancelled,
--               Under Rejection Approval, UNDER REJECTION APPROVAL
--   Approved -> Ready for payment, READY FOR PAYMENT, Payment Initiated,
--               PAYMENT INITIATED, Bank details awaited
--   Pending  -> PENDING, Under Process, UNDER PROCESS, CLAIM BILLS PENDING,
--               Claim Bills Pending, Deficiency, "Claim Intimation ",
--               RAL Intimation, RAL Deficiency, OUTSTANDING
--
-- 4 judgment calls below (flagged for confirmation — easy to move a keyword
-- between OR-branches later if any of these reads is wrong):
--   - Cancelled -> Rejected (claim will not be paid). Could instead be its
--     own bucket if the business wants "withdrawn by employee" distinct
--     from "denied by insurer".
--   - Under Rejection Approval -> Rejected, even though not yet final.
--     Could arguably be Pending since the outcome isn't decided yet.
--   - Outstanding -> Pending (claim still unresolved). Could instead mean
--     "payment amount outstanding" i.e. Approved-adjacent.
--   - Bank details awaited -> Approved (decision made, blocked on payout
--     logistics only). Could instead be read as still Pending.
--
-- Checked for cross-bucket collisions: every one of the 16 raw values
-- matches exactly one bucket's keyword set, so results won't double up
-- across chips.
UPDATE admin_reports
SET query = REPLACE(
  query,
  $old$  AND (###claimStatus### = '' OR LOWER(c.claim_status) = LOWER(###claimStatus###))$old$,
  $new$  AND (
    ###claimStatus### = ''
    OR (###claimStatus### = 'Settled'  AND c.claim_status ILIKE '%settled%')
    OR (###claimStatus### = 'Rejected' AND (c.claim_status ILIKE '%denied%' OR c.claim_status ILIKE '%rejection%' OR c.claim_status ILIKE '%cancelled%'))
    OR (###claimStatus### = 'Approved' AND (c.claim_status ILIKE '%ready for payment%' OR c.claim_status ILIKE '%payment initiated%' OR c.claim_status ILIKE '%bank details%'))
    OR (###claimStatus### = 'Pending'  AND (c.claim_status ILIKE '%pending%' OR c.claim_status ILIKE '%process%' OR c.claim_status ILIKE '%deficiency%' OR c.claim_status ILIKE '%intimation%' OR c.claim_status ILIKE '%outstanding%'))
  )$new$
)
WHERE id = 31
  AND query LIKE '%LOWER(c.claim_status) = LOWER(###claimStatus###)%';


-- ── FIX 5: policy_claim_history — "Approved Amount" (Claims tab) ───────────
-- "Approved Amount" always showed the SETTLED amount, not the actually-
-- approved amount. COALESCE(ls.settled_amount, 0) — ls being
-- latest_settlement, sourced from policy_claim_settlement — only gets a row
-- once a claim is actually PAID. So any claim sitting in "Ready for
-- payment"/"Payment Initiated"/"Bank details awaited" (genuinely approved
-- by the TPA, just not paid out yet) showed Approved Amount = ₹0, even
-- though the TPA already sent back a real sanctioned figure.
--
-- That figure lives on policy_claim.clm_allowed_amt (entity: PolicyClaim.
-- claimAllowedAmount, see policy-employee-claim.entity.ts:113-114) —
-- populated straight from the TPA sync payload's APPROVED_AMOUNT field
-- (scheduler-service/.../tpa-claims-parser.scheduler.ts:250,283) the moment
-- the TPA processes the claim, independent of whether policy_claim_settlement
-- has a row yet. (Not clm_pre_auth_amt — that's the amount authorized
-- BEFORE admission for cashless claims specifically, a different concept.)
--
-- Fix: prefer clm_allowed_amt; fall back to settled_amount for older rows
-- synced before this field existed; fall back to 0 if neither exists.
UPDATE admin_reports
SET query = REPLACE(
  query,
  $old$  COALESCE(ls.settled_amount, 0)                   AS "approvedAmount",$old$,
  $new$  COALESCE(c.clm_allowed_amt, ls.settled_amount, 0) AS "approvedAmount",$new$
)
WHERE id = 31
  AND query LIKE '%COALESCE(ls.settled_amount, 0)%AS "approvedAmount"%';


-- ── FIX 6: cd_transactions — company_id scoping (CD Balance tab) ───────────
-- cd_transactions (id=46) returned zero rows for policy 749326 even though
-- it genuinely has 2 transactions (confirmed directly: caution_deposit_id
-- 266, transaction ids 3847/3852, matching the ₹420 and ₹4,07,893 rows
-- visible in iwork). Root cause: the query scopes by
-- "WHERE cd.company_id = ###companyId###" — caution_deposit's OWN stored
-- company_id column, which can drift from the real company_id of the
-- policies mapped to it (same denormalized-column class of bug as several
-- others this session). Confirmed via policy 749326: policy.company_id =
-- 36980, but its caution_deposit.company_id = 263681 — a different value
-- entirely. 4 of 950 caution_deposit accounts with a policy mapping have
-- this same disagreement.
--
-- Fix: prefer the policy's own live company_id (p.company_id, already
-- LEFT JOINed in this query via "LEFT JOIN policy p ON p.id =
-- cdt.policy_id") over the CD account's stored value — but fall back to
-- cd.company_id when there's no linked policy at all (68 of 2035
-- transactions have policy_id IS NULL — company-level transactions not
-- tied to a specific policy yet — these must stay visible, so can't require
-- p.company_id unconditionally).
UPDATE admin_reports
SET query = REPLACE(
  query,
  $old$WHERE cd.company_id = ###companyId###$old$,
  $new$WHERE COALESCE(p.company_id, cd.company_id) = ###companyId###$new$
)
WHERE id = 46
  AND query LIKE '%WHERE cd.company_id = ###companyId###%';


-- ── FIX 7: linked_policies_of_cd_account — same company_id scoping bug ─────
-- "Upcoming Installments" card showed "0 policies funded from this CD
-- account" for policy 749326 despite it genuinely being funded by a real CD
-- account. Exact same root cause as FIX 6: input_cd_accounts filtered by
-- "cd.company_id = ###companyId###" — the CD account's own stale stored
-- value (263681) instead of the requested policy's real company_id (36980,
-- confirmed via policy 749326 in FIX 6). Since the requested policy itself
-- is already known (###policyId###), verify company ownership through IT
-- (a live join to policy), not through the CD account's denormalized column.
-- The final SELECT already independently re-verifies every returned linked
-- policy against ###companyId### via "INNER JOIN policy p ON ... AND
-- p.company_id = ###companyId###" — that check is untouched, so this isn't
-- a company-isolation weakening, just fixing which value decides whether
-- the REQUESTED policy's own CD account is in scope at all.
UPDATE admin_reports
SET query = REPLACE(
  query,
  $old$  SELECT DISTINCT cdpm.caution_deposit_id
  FROM caution_deposit_policy_mapping cdpm
  INNER JOIN caution_deposit cd ON cd.id = cdpm.caution_deposit_id
  WHERE cdpm.policy_id = ###policyId### AND cd.company_id = ###companyId###$old$,
  $new$  SELECT DISTINCT cdpm.caution_deposit_id
  FROM caution_deposit_policy_mapping cdpm
  INNER JOIN policy p0 ON p0.id = cdpm.policy_id
  WHERE cdpm.policy_id = ###policyId### AND p0.company_id = ###companyId###$new$
)
WHERE id = 33
  AND query LIKE '%WHERE cdpm.policy_id = ###policyId### AND cd.company_id = ###companyId###%';


-- ── FIX 8: dashboard_policy_cards — ICR includes rejected/denied claims ────
-- ICR (Incurred Claims Ratio) = claim amount / premium. claims_relevant (the
-- base CTE every claim figure on this card is built from — claimAmount,
-- icrPercent, icrForecastPercent, etc.) had no claim_status filter at all,
-- so a claim that was fully DENIED still counted its full claimed amount
-- toward ICR, exactly as if it had been paid in full. Confirmed via policy
-- 753273: 232 of 1812 claims (₹1.4Cr of ₹11.3Cr, ~12%) are denied/rejected/
-- cancelled — none of that was ever going to be paid out, so including it
-- meaningfully overstates the ratio and makes the policy look riskier at
-- renewal than it is.
--
-- Fix: exclude the same "Rejected" bucket already established for the
-- Claims tab status filter (FIX 4) — denied/rejection/cancelled, matched by
-- ILIKE keyword since claim_status is free text. Pending/approved/settled
-- claims are unaffected and still count (a claim still being processed is
-- legitimately carried as a reserve estimate; only a FINAL negative outcome
-- should drop out).
UPDATE admin_reports
SET query = REPLACE(
  query,
  $old$  LEFT JOIN loc_employees le ON le.employee_id = c.employee_id
  WHERE c.deleted_at IS NULL
    AND ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
),$old$,
  $new$  LEFT JOIN loc_employees le ON le.employee_id = c.employee_id
  WHERE c.deleted_at IS NULL
    AND ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
    AND NOT (c.claim_status ILIKE '%denied%' OR c.claim_status ILIKE '%rejection%' OR c.claim_status ILIKE '%cancelled%')
),$new$
)
WHERE id = 22
  AND query LIKE '%claims_relevant AS MATERIALIZED%'
  AND query NOT LIKE '%c.claim_status ILIKE ''%denied%''%';


-- ── FIX 9: policy_claim_history — statusBucket (single source of truth) ────
-- Confirmed on a real policy: the "Claim TAT Overview" KPI cards (Pending/
-- Approved/Rejected/Settled counts, client-side in HRPortalPolicySummary)
-- and the Claim Search table (same page, filtered via this same report's
-- ###claimStatus### param, FIX 4's ILIKE buckets) disagreed — TAT card
-- showed "Pending: 88," the actual filtered list showed "42." Root cause:
-- the TAT cards classify each row with a SEPARATE, cruder rule —
-- `row.status === "Ready For Payment"` / `"Claim Denied"` / `"Settled"`,
-- else "Pending" — a 3-exact-string check against the INITCAP'd display
-- string. Any raw value that doesn't INITCAP to exactly one of those three
-- falls into "Pending" by default, regardless of what it actually means.
-- Confirmed: 46 claims with raw status "DENIED" INITCAP to "Denied", not
-- "Claim Denied," so the TAT card's Rejected check missed them entirely
-- (showed 0) and its Pending catch-all absorbed them instead (42 genuinely
-- pending + 46 misclassified denied = 88, matching exactly).
--
-- Fix: add statusBucket, computed with the SAME ILIKE keywords as FIX 4's
-- ###claimStatus### filter, so both the TAT cards and the Claim Search
-- table derive from one server-side classification instead of two
-- independently-maintained ones that can (and did) drift apart. Frontend
-- change: claimTatCards now filters on row.statusBucket instead of
-- re-deriving buckets from row.status.
UPDATE admin_reports
SET query = REPLACE(
  query,
  $old$  INITCAP(COALESCE(c.claim_status, 'pending'))     AS "status"
FROM policy_claim c$old$,
  $new$  INITCAP(COALESCE(c.claim_status, 'pending'))     AS "status",
  CASE
    WHEN c.claim_status ILIKE '%settled%' THEN 'Settled'
    WHEN c.claim_status ILIKE '%denied%' OR c.claim_status ILIKE '%rejection%' OR c.claim_status ILIKE '%cancelled%' THEN 'Rejected'
    WHEN c.claim_status ILIKE '%ready for payment%' OR c.claim_status ILIKE '%payment initiated%' OR c.claim_status ILIKE '%bank details%' THEN 'Approved'
    ELSE 'Pending'
  END                                                     AS "statusBucket"
FROM policy_claim c$new$
)
WHERE id = 31
  AND query LIKE '%AS "status"%'
  AND query NOT LIKE '%AS "statusBucket"%';


-- ── FIX 10: cd_transactions — mistagged policy_id on the transaction row ───
-- Confirmed on policy 749283 (and verified against iwork, which shows no
-- transactions for this policy): 59 real transactions on CD account
-- "C106532" (caution_deposit_id 1019) are tagged
-- caution_deposit_transaction.policy_id = 749283 directly — but the
-- AUTHORITATIVE link (caution_deposit_policy_mapping, the same table
-- policy_cd_summary/id=30 and linked_policies_of_cd_account/id=33 already
-- trust) maps account 1019 to three DIFFERENT policies (749401, 749282,
-- 749400) instead, none of which is 749283. cd_transactions was the only
-- one of the three CD reports trusting cdt.policy_id directly with no
-- cross-check against the mapping table, so it was the only one showing
-- these mistagged rows. Confirmed the fix doesn't regress the case already
-- fixed in FIX 6 (policy 749326): its transactions ARE correctly present in
-- the mapping table, so they're unaffected by this additional check.
--
-- Fix: a transaction only counts toward a policy if that policy is also
-- genuinely mapped to the transaction's own caution_deposit account.
-- Transactions with no policy_id at all (company-level, not yet allocated
-- to a specific policy — ~3.3% of rows) are unaffected, same as FIX 6.
UPDATE admin_reports
SET query = REPLACE(
  query,
  $old$WHERE COALESCE(p.company_id, cd.company_id) = ###companyId###
  AND (###policyId### = '' OR cdt.policy_id::text = ###policyId###)$old$,
  $new$WHERE COALESCE(p.company_id, cd.company_id) = ###companyId###
  AND (###policyId### = '' OR cdt.policy_id::text = ###policyId###)
  AND (
    cdt.policy_id IS NULL
    OR EXISTS (
      SELECT 1 FROM caution_deposit_policy_mapping cdpm
      WHERE cdpm.caution_deposit_id = cdt.caution_deposit_id
        AND cdpm.policy_id = cdt.policy_id
    )
  )$new$
)
WHERE id = 46
  AND query LIKE '%AND (###policyId### = '''' OR cdt.policy_id::text = ###policyId###)%'
  AND query NOT LIKE '%caution_deposit_policy_mapping cdpm%';


-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT name, updated_at,
  CASE
    WHEN name IN ('endorsement_employee_metrics', 'endorsement_list')
      AND query LIKE '%EMPLOYEE_ENROLLMENT_STATUS_ENROLLED%' THEN 'enrolled-only fix applied ✓'
    WHEN name = 'policy_enrollment_summary'
      AND query LIKE '%current_period_endorsements%' THEN 'current-drive-only fix applied ✓'
    ELSE 'NOT APPLIED ✗'
  END AS fix_status
FROM admin_reports
WHERE name IN ('endorsement_employee_metrics', 'endorsement_list', 'policy_enrollment_summary')
ORDER BY name;

SELECT id, name,
  CASE
    WHEN query NOT LIKE '%LOWER(c.claim_status) = LOWER(###claimStatus###)%'
     AND query LIKE '%COALESCE(c.clm_allowed_amt, ls.settled_amount, 0)%'
      THEN 'claim status bucket + approved amount fix applied ✓'
    ELSE 'NOT APPLIED ✗'
  END AS fix_status
FROM admin_reports
WHERE id = 31;

SELECT id, name,
  CASE
    WHEN query LIKE '%COALESCE(p.company_id, cd.company_id) = ###companyId###%'
      THEN 'cd_transactions company_id scoping fix applied ✓'
    ELSE 'NOT APPLIED ✗'
  END AS fix_status
FROM admin_reports
WHERE id = 46;

SELECT id, name,
  CASE
    WHEN query LIKE '%INNER JOIN policy p0 ON p0.id = cdpm.policy_id%'
      THEN 'linked_policies_of_cd_account company_id scoping fix applied ✓'
    ELSE 'NOT APPLIED ✗'
  END AS fix_status
FROM admin_reports
WHERE id = 33;

SELECT id, name,
  CASE
    WHEN query LIKE '%caution_deposit_policy_mapping cdpm%'
      THEN 'cd_transactions mapping-consistency fix applied ✓'
    ELSE 'NOT APPLIED ✗'
  END AS fix_status
FROM admin_reports
WHERE id = 46;


-- =============================================================================
-- FIX 11-19: follow-up round — Policy Journey & Enrolment Summary card,
-- Dashboard Policy Cards. Builds on FIX 1/2/3 above (same reports:
-- endorsement_list id=42, endorsement_employee_metrics id=41) plus
-- dashboard_policy_cards (id=22). Every UPDATE below is idempotent, guarded
-- by its own WHERE clause, and depends only on the ORIGINAL text from FIX
-- 1-3 above — safe to run on any environment that already has FIX 1-3
-- applied, regardless of whether FIX 11-19 have run before.
--
-- NOT covered by this file (ships via normal code deployment, not a SQL
-- run): apps/services/ibp-service/src/app/hr-module/hr.repository.ts —
-- getEndorsementStats now widens dependent row-scope to include employees'
-- non-batch ("life event") dependent additions, and determines dependent
-- completion via the same enrollment-choice chain as FIX 14/15 below,
-- instead of the dependent's own (unreliable outside the batch-upload flow)
-- endorsement_status_key.
-- =============================================================================


-- ── FIX 11: endorsement_list — return full endorsement history ────────────
-- Was scoped to only endorsements whose enrollment window is open RIGHT NOW
-- (via a current_period_endorsements CTE, FIX 2a) — a policy with no
-- currently-open drive came back with an EMPTY endorsement_list, zeroing
-- out the "Policy Journey" card's Added/Deleted premium and the "Endorsement
-- History" accordion, even with a long real history. Drops that
-- restriction — endorsement_list now returns every endorsement ever
-- recorded for the policy, matching endorsement_employee_metrics' lifetime
-- scope. `cpe` (the removed CTE's alias) isn't referenced anywhere else,
-- safe to drop alone.
UPDATE admin_reports
SET
  query = REPLACE(
    REPLACE(
      query,
      $old1$WITH current_period_endorsements AS (
  SELECT DISTINCT dpf.endorsement_id
  FROM document_processing_file dpf
  WHERE dpf.enrollment_start_date IS NOT NULL
    AND dpf.enrollment_end_date IS NOT NULL
    AND dpf.enrollment_start_date <= CURRENT_DATE
    AND dpf.enrollment_end_date >= CURRENT_DATE
)
SELECT$old1$,
      $new1$SELECT$new1$
    ),
    $old2$INNER JOIN current_period_endorsements cpe ON cpe.endorsement_id = e.id
$old2$,
    $new2$$new2$
  ),
  updated_at = NOW()
WHERE name = 'endorsement_list'
  AND query LIKE '%current_period_endorsements%';


-- ── FIX 12: endorsement_list — add rawDeletedDependentCount ───────────────
-- rawDeletedCount (employees only, FIX 2h) had no dependent-level
-- equivalent, so the "Exited" pill could only ever show an employees-only
-- figure. Mirrors FIX 1's dependents_in_deletion pattern (direct
-- deletion_endorsement_id link) — deliberately just as raw/ungated as
-- rawDeletedCount, since removal from the roster isn't gated by
-- enrolment-completion status.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    $old$  (SELECT COUNT(DISTINCT pepm4.employee_id)
   FROM document_processing_file batch_dpf4
   INNER JOIN policy_enrollment_employee_policy_map pepm4
     ON pepm4.enrollment_deletion_batch_id = batch_dpf4.document_id
   WHERE batch_dpf4.endorsement_id = e.id
  )                                                      AS "rawDeletedCount",$old$,
    $new$  (SELECT COUNT(DISTINCT pepm4.employee_id)
   FROM document_processing_file batch_dpf4
   INNER JOIN policy_enrollment_employee_policy_map pepm4
     ON pepm4.enrollment_deletion_batch_id = batch_dpf4.document_id
   WHERE batch_dpf4.endorsement_id = e.id
  )                                                      AS "rawDeletedCount",
  (SELECT COUNT(DISTINCT dep4.id)
   FROM policy_enrollment_dependent dep4
   WHERE dep4.deletion_endorsement_id = e.id
  )                                                      AS "rawDeletedDependentCount",$new$
  ),
  updated_at = NOW()
WHERE name = 'endorsement_list'
  AND query NOT LIKE '%rawDeletedDependentCount%';


-- ── FIX 13: endorsement_list — rawNetPremium prefers the endorsement's own
--    net_premium over policy.premium_at_inception ─────────────────────────
-- FIX 2f unconditionally used policy.premium_at_inception for is_inception
-- rows even when the endorsement's own net_premium was populated with a
-- real, different value (confirmed on endorsement #28959: 356,630 vs
-- 360,538 for the same policy). Inception premium should show this
-- endorsement's own frozen batch value, not a policy-level figure that can
-- drift independently of it. COALESCE(e.net_premium, p.premium_at_inception)
-- preserves FIX 2f's original fallback for when the endorsement's own
-- column really is null.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    $old$  CASE WHEN e.is_inception THEN COALESCE(p.premium_at_inception) ELSE e.net_premium END AS "rawNetPremium",$old$,
    $new$  CASE WHEN e.is_inception THEN COALESCE(e.net_premium, p.premium_at_inception) ELSE e.net_premium END AS "rawNetPremium",$new$
  ),
  updated_at = NOW()
WHERE name = 'endorsement_list'
  AND query LIKE '%CASE WHEN e.is_inception THEN COALESCE(p.premium_at_inception) ELSE e.net_premium END AS "rawNetPremium"%';


-- ── FIX 14: endorsement_list — enrolled_dependent_count via choice linkage +
--    employee-batch-membership ─────────────────────────────────────────────
-- Only counted dependents with addition_endorsement_id = this endorsement
-- AND the dependent's own endorsement_status_key = 'ENROLLED' — both too
-- narrow: addition_endorsement_id is only set for batch-uploaded dependents
-- (a mid-term "add dependent" has no endorsement link at all), and
-- endorsement_status_key on the dependent row itself isn't reliably stamped
-- outside the batch-upload flow. Now also includes dependents whose parent
-- employee belongs to this endorsement's batch, and determines completion
-- via policy_employee_enrollment_choice_dependent -> ...choice ->
-- policy_employee_enrollment.employee_enrollment_status_key instead.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    $old$    (SELECT COUNT(DISTINCT dep.id)
     FROM policy_enrollment_dependent dep
     WHERE dep.addition_endorsement_id = e.id
       AND dep.deleted_at IS NULL
       AND dep.deletion_endorsement_id IS NULL
       AND dep.endorsement_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
    )                                                                          AS enrolled_dependent_count$old$,
    $new$    (SELECT COUNT(DISTINCT dep.id)
     FROM policy_enrollment_dependent dep
     INNER JOIN policy_enrollment_employee_policy_map pepm2
       ON pepm2.employee_id = dep.employee_id AND pepm2.policy_id = dep.policy_id
     INNER JOIN policy_employee_enrollment_choice_dependent pecd2
       ON pecd2.dependent_id = dep.id AND pecd2.deleted_at IS NULL
     INNER JOIN policy_employee_enrollment_choice peec2
       ON peec2.id = pecd2.employee_enrollment_choice_id
     INNER JOIN policy_employee_enrollment pee3
       ON pee3.id = peec2.employee_enrollment_id AND pee3.deleted_at IS NULL
     WHERE dep.deleted_at IS NULL
       AND dep.deletion_endorsement_id IS NULL
       AND (
         dep.addition_endorsement_id = e.id
         OR pepm2.enrollment_addition_batch_id IN (
           SELECT dpf2.document_id FROM document_processing_file dpf2 WHERE dpf2.endorsement_id = e.id
         )
       )
       AND pee3.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
    )                                                                          AS enrolled_dependent_count$new$
  ),
  updated_at = NOW()
WHERE name = 'endorsement_list'
  AND query LIKE '%AND dep.endorsement_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED''
    )                                                                          AS enrolled_dependent_count%';


-- ── FIX 15: endorsement_employee_metrics — active_dependents via enrollment
--    choice linkage ─────────────────────────────────────────────────────────
-- Filtered on policy_enrollment_dependent.endorsement_status_key directly —
-- only reliably set when a dependent arrives via a bulk endorsement batch.
-- Confirmed live: an already-enrolled employee's dependents added afterward
-- through a mid-term "add dependent" flow never surfaced here even once
-- fully enrolled. A dependent is actually covered under an employee's
-- CURRENT enrollment iff selected in one of that enrollment's choices:
-- policy_employee_enrollment -> policy_employee_enrollment_choice ->
-- policy_employee_enrollment_choice_dependent -> policy_enrollment_dependent.
-- Consistent with how dependent PREMIUM already works elsewhere on this page
-- (folded into the employee's choice premium, not tracked separately).
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    $old$  (SELECT COUNT(DISTINCT ped.id)
   FROM policy_enrollment_dependent ped
   INNER JOIN policy p ON p.id = ped.policy_id
   WHERE p.company_id = ###companyId###
     AND (###policyId### = '' OR ped.policy_id::text = ###policyId###)
     AND ped.deleted_at IS NULL
     AND ped.endorsement_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
     AND (###externalHrUserId### IS NULL
            OR ped.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
  )                                                                                                              AS active_dependents,$old$,
    $new$  (SELECT COUNT(DISTINCT ped.id)
   FROM policy_enrollment_dependent ped
   INNER JOIN policy p ON p.id = ped.policy_id
   INNER JOIN policy_employee_enrollment_choice_dependent pecd
     ON pecd.dependent_id = ped.id AND pecd.deleted_at IS NULL
   INNER JOIN policy_employee_enrollment_choice peec
     ON peec.id = pecd.employee_enrollment_choice_id
   INNER JOIN policy_employee_enrollment pee
     ON pee.id = peec.employee_enrollment_id AND pee.deleted_at IS NULL
   WHERE p.company_id = ###companyId###
     AND (###policyId### = '' OR ped.policy_id::text = ###policyId###)
     AND ped.deleted_at IS NULL
     AND pee.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
     AND (###externalHrUserId### IS NULL
            OR ped.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))
  )                                                                                                              AS active_dependents,$new$
  ),
  updated_at = NOW()
WHERE name = 'endorsement_employee_metrics'
  AND query LIKE '%ped.endorsement_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED''%AS active_dependents%';


-- ── FIX 16: endorsement_employee_metrics — active_premium prefers
--    last_paid_net_premium, falls back to total_premium ───────────────────
-- last_paid_net_premium is the more authoritative figure when actually set
-- (the last real amount paid); total_premium is only the fallback for
-- employees who haven't had it populated yet. last_paid_net_premium is
-- NOT NULL default 0, so NULLIF(...,0) treats an unset 0 as "not set" and
-- falls through to total_premium — same null-check-fallback convention used
-- everywhere else on this page.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    $old$    COALESCE(SUM(pe.total_premium) FILTER (
      WHERE pepm.deleted_at IS NULL AND pe.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
    ), 0)                                                                      AS active_premium_calc$old$,
    $new$    COALESCE(SUM(COALESCE(NULLIF(pe.last_paid_net_premium, 0), pe.total_premium)) FILTER (
      WHERE pepm.deleted_at IS NULL AND pe.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
    ), 0)                                                                      AS active_premium_calc$new$
  ),
  updated_at = NOW()
WHERE name = 'endorsement_employee_metrics'
  AND query LIKE '%COALESCE(SUM(pe.total_premium) FILTER (%AS active_premium_calc%';


-- ── FIX 17: dashboard_policy_cards — expose enrollment_addition_batch_id on
--    employee_policy_base ──────────────────────────────────────────────────
-- employee_policy_base only selected endorsement_addition_batch_id (a
-- different, legacy column used for its own member_additions logic).
-- enrollment_addition_batch_id — the column policy_enrollment_summary (FIX
-- 3 above) proves is the authoritative "which batch added this employee"
-- pointer — wasn't projected at all. FIX 18 below needs it.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    $old$    peepm.endorsement_addition_batch_id,
    peepm.enrollment_deletion_batch_id,$old$,
    $new$    peepm.endorsement_addition_batch_id,
    peepm.enrollment_addition_batch_id,
    peepm.enrollment_deletion_batch_id,$new$
  ),
  updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query LIKE '%peepm.endorsement_addition_batch_id,
    peepm.enrollment_deletion_batch_id,%'
  AND query NOT LIKE '%peepm.enrollment_addition_batch_id,%';


-- ── FIX 18: dashboard_policy_cards — Not Logged In scoped to the current
--    enrollment period ──────────────────────────────────────────────────────
-- logged_in_count/not_logged_in_count were policy-wide, all-time (every
-- employee ever on the roster). Adds current_period_docs (mirrors FIX 3's
-- current_period_endorsements) and scopes these two counts to it.
-- employee_count is deliberately left policy-wide — it feeds "Total
-- Lives"/"Employees"/"Dependents"/the header's "ACTIVE LIVES" badge, which
-- must stay total-policy figures, not gated by whether a window is open
-- right now (confirmed live: a policy with no open period showed "ACTIVE
-- LIVES 0" when this was tried on employee_count too — reverted).
-- member_additions/member_deletions (a separate, policy-year-scoped concept)
-- are untouched.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    $old$policy_people_stats AS MATERIALIZED (
  SELECT
    epb.policy_id,
    COUNT(DISTINCT epb.employee_id) FILTER (
      WHERE (SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL
    )                                                                         AS employee_count,
    COUNT(DISTINCT epb.employee_id) FILTER (
      WHERE ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
        AND clu.user_id IS NOT NULL
    )                                                                         AS logged_in_count,
    COUNT(DISTINCT epb.employee_id) FILTER (
      WHERE ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
        AND clu.user_id IS NULL
    )                                                                         AS not_logged_in_count,$old$,
    $new$current_period_docs AS MATERIALIZED (
  SELECT DISTINCT dpf.document_id
  FROM document_processing_file dpf
  INNER JOIN endorsement e ON e.id = dpf.endorsement_id
  INNER JOIN company_policies cp ON cp.policy_id = e.policy_id
  WHERE dpf.enrollment_start_date IS NOT NULL
    AND dpf.enrollment_end_date IS NOT NULL
    AND dpf.enrollment_start_date <= CURRENT_DATE
    AND dpf.enrollment_end_date >= CURRENT_DATE
),

policy_people_stats AS MATERIALIZED (
  SELECT
    epb.policy_id,
    COUNT(DISTINCT epb.employee_id) FILTER (
      WHERE (SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL
    )                                                                         AS employee_count,
    COUNT(DISTINCT epb.employee_id) FILTER (
      WHERE ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
        AND epb.enrollment_addition_batch_id IN (SELECT document_id FROM current_period_docs)
        AND clu.user_id IS NOT NULL
    )                                                                         AS logged_in_count,
    COUNT(DISTINCT epb.employee_id) FILTER (
      WHERE ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
        AND epb.enrollment_addition_batch_id IN (SELECT document_id FROM current_period_docs)
        AND clu.user_id IS NULL
    )                                                                         AS not_logged_in_count,$new$
  ),
  updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query NOT LIKE '%current_period_docs%';


-- ── FIX 19: dashboard_policy_cards — Enrolled/In Progress scoped to the
--    current enrollment period, dedupe-safe ────────────────────────────────
-- enrolled_count/in_progress_count were policy-wide, all-time. Adds an
-- INNER JOIN into policy_enrollment_employee_policy_map, filtered to
-- current_period_docs via enrollment_addition_batch_id (the same column FIX
-- 18 uses — confirmed correct against policy_enrollment_summary's own
-- working numbers; NOT endorsement_addition_batch_id, which matches nothing
-- for this purpose). COUNT(DISTINCT employee_id) instead of bare COUNT(id) —
-- belt-and-suspenders dedupe; policy_employee_enrollment already has a
-- UNIQUE(employee_id, policy_id) index so this was never actually
-- double-counting, and the new join is equally 1:1 per employee, but this
-- makes the "one employee, one count" guarantee explicit per instruction.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    $old$policy_enrollment_counts AS (
  SELECT
    pee_enr.policy_id,
    COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED')    AS enrolled_count,
    COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS') AS in_progress_count,
    COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') AS not_started_count
  FROM policy_employee_enrollment pee_enr
  INNER JOIN company_policies cp ON cp.policy_id = pee_enr.policy_id
  LEFT JOIN loc_employees le ON le.employee_id = pee_enr.employee_id
  WHERE pee_enr.deleted_at IS NULL
    AND ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
  GROUP BY pee_enr.policy_id
),$old$,
    $new$policy_enrollment_counts AS (
  SELECT
    pee_enr.policy_id,
    COUNT(DISTINCT pee_enr.employee_id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED')    AS enrolled_count,
    COUNT(DISTINCT pee_enr.employee_id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS') AS in_progress_count,
    COUNT(DISTINCT pee_enr.employee_id) FILTER (WHERE pee_enr.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED') AS not_started_count
  FROM policy_employee_enrollment pee_enr
  INNER JOIN company_policies cp ON cp.policy_id = pee_enr.policy_id
  INNER JOIN policy_enrollment_employee_policy_map peepm_cp
    ON peepm_cp.employee_id = pee_enr.employee_id
   AND peepm_cp.policy_id = pee_enr.policy_id
   AND peepm_cp.deleted_at IS NULL
   AND peepm_cp.enrollment_addition_batch_id IN (SELECT document_id FROM current_period_docs)
  LEFT JOIN loc_employees le ON le.employee_id = pee_enr.employee_id
  WHERE pee_enr.deleted_at IS NULL
    AND ((SELECT is_all FROM loc_filter) OR le.employee_id IS NOT NULL)
  GROUP BY pee_enr.policy_id
),$new$
  ),
  updated_at = NOW()
WHERE name = 'dashboard_policy_cards'
  AND query LIKE '%COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'')%';


-- ── Verify (FIX 11-19) ──────────────────────────────────────────────────────
SELECT
  name,
  CASE
    WHEN name = 'endorsement_list' AND query LIKE '%current_period_endorsements%'
      THEN 'FIX 11 NOT APPLIED ✗'
    WHEN name = 'endorsement_list' AND query NOT LIKE '%rawDeletedDependentCount%'
      THEN 'FIX 12 NOT APPLIED ✗'
    WHEN name = 'endorsement_list' AND query LIKE '%CASE WHEN e.is_inception THEN COALESCE(p.premium_at_inception) ELSE e.net_premium END AS "rawNetPremium"%'
      THEN 'FIX 13 NOT APPLIED ✗'
    WHEN name = 'endorsement_list' AND query NOT LIKE '%policy_employee_enrollment_choice_dependent pecd2%'
      THEN 'FIX 14 NOT APPLIED ✗'
    WHEN name = 'endorsement_employee_metrics' AND query NOT LIKE '%policy_employee_enrollment_choice_dependent pecd%'
      THEN 'FIX 15 NOT APPLIED ✗'
    WHEN name = 'endorsement_employee_metrics' AND query NOT LIKE '%COALESCE(NULLIF(pe.last_paid_net_premium, 0), pe.total_premium)%'
      THEN 'FIX 16 NOT APPLIED ✗'
    WHEN name = 'dashboard_policy_cards' AND query NOT LIKE '%peepm.enrollment_addition_batch_id,%'
      THEN 'FIX 17 NOT APPLIED ✗'
    WHEN name = 'dashboard_policy_cards' AND query NOT LIKE '%current_period_docs%'
      THEN 'FIX 18 NOT APPLIED ✗'
    WHEN name = 'dashboard_policy_cards' AND query LIKE '%COUNT(pee_enr.id) FILTER (WHERE pee_enr.employee_enrollment_status_key = ''EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'')%'
      THEN 'FIX 19 NOT APPLIED ✗'
    ELSE 'all FIX 11-19 applied ✓'
  END AS status
FROM admin_reports
WHERE name IN ('endorsement_list', 'endorsement_employee_metrics', 'dashboard_policy_cards')
ORDER BY name;


-- =============================================================================
-- FIX 20: performance indexes for endorsement_employee_metrics (FIX 1h)
--
-- These are DDL (schema changes), not admin_reports UPDATEs — run this
-- section separately from the rest of the file if you want to time it
-- during a lower-traffic window. CONCURRENTLY means no write lock on the
-- table while building (safe on a live 1M-row table), but each statement
-- takes longer and CANNOT run inside an explicit transaction block (run
-- each as its own autocommitted statement, which is the default when
-- piping this file through psql -f).
--
-- Both tables are ~1M rows SYSTEM-WIDE (not just for one large policy) —
-- confirmed via pg_class: policy_enrollment_employee_policy_map ~1,010,398
-- rows, policy_enrollment_dependent ~922,095 rows. So this helps every call
-- to this report, for every policy, not just the large ones.
--
-- 1. policy_enrollment_employee_policy_map already has two indexes on
--    policy_id, but BOTH are partial: "WHERE deleted_at IS NULL"
--    (idx_peepm_policy_id and idx_peepm_policy_id_active — identical
--    definitions, see the duplicate-index note below). FIX 1h's new
--    employee_headcounts_calc CTE deliberately does NOT filter deleted_at
--    at the base level (employees_at_inception/employees_in_addition/
--    employees_in_deletion are lifetime tallies that must include
--    already-removed rows, per FIX 1g) — so neither partial index can
--    cover it, forcing a full sequential scan of the 1M-row table every
--    call. Confirmed via EXPLAIN: "Parallel Seq Scan on
--    policy_enrollment_employee_policy_map".
--
-- 2. policy_enrollment_dependent has an index on policy_id but NONE on
--    addition_endorsement_id or deletion_endorsement_id — exactly the two
--    columns dependents_at_inception/dependents_in_addition/
--    dependents_in_deletion filter on. Confirmed via EXPLAIN: 3 separate
--    "Seq Scan on policy_enrollment_dependent" nodes, each scanning all
--    ~922K rows to find a handful of matches.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_peepm_policy_id_all
  ON policy_enrollment_employee_policy_map (policy_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ped_addition_endorsement
  ON policy_enrollment_dependent (addition_endorsement_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_ped_deletion_endorsement
  ON policy_enrollment_dependent (deletion_endorsement_id);

-- Flagged, not acted on: idx_peepm_policy_id and idx_peepm_policy_id_active
-- on policy_enrollment_employee_policy_map are byte-identical definitions
-- ("policy_id) WHERE (deleted_at IS NULL)") — a duplicate index, costing
-- extra disk space and write overhead for zero query benefit (the planner
-- can only ever use one of the two). Not dropping it here since removing
-- an index is a separate judgment call from adding one — confirm intent,
-- then: DROP INDEX CONCURRENTLY idx_peepm_policy_id_active;

-- ── Verify ────────────────────────────────────────────────────────────────────
SELECT tablename, indexname, indexdef
FROM pg_indexes
WHERE indexname IN ('idx_peepm_policy_id_all', 'idx_ped_addition_endorsement', 'idx_ped_deletion_endorsement');
