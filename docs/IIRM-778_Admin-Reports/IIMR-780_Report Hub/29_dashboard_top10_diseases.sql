-- ============================================================================
-- Report: Dashboard Top 10 Diseases by Claims
-- name (used in URL/endpoint): dashboard_top10_diseases    |    id: 29    |    order_no: 28
-- end_point: dashboard_top10_diseases
-- created_at: 2026-05-08 12:05:23.976083    updated_at: 2026-06-01 12:11:46.364755
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
-- 1. MAIN QUERY  (admin_reports.query, id = 29)
-- ------------------------------------------------------------------
-- To update, edit the query text below and run:
--   UPDATE admin_reports SET query = $Q$WITH policy_window AS (
  SELECT id, policy_from, policy_to FROM policy WHERE id = ###policyId###
),
cur_year_base AS (
  SELECT
    INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text),''),'Unclassified'))) AS disease_category,
    COUNT(c.id)                      AS total_claims,
    COALESCE(SUM(c.claim_amount), 0) AS total_amount
  FROM policy_claim c
  INNER JOIN policy_window p ON p.id = c.policy_id
  WHERE c.deleted_at IS NULL
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee_f.id FROM policy_enrollment_employee pee_f
        WHERE pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        ) AND pee_f.deleted_at IS NULL
      )
    )
  GROUP BY INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text),''),'Unclassified')))
),
cur_year AS (
  SELECT disease_category, total_claims, total_amount,
         RANK() OVER (ORDER BY total_amount DESC) AS cur_rank
  FROM cur_year_base
),
prev_year_ranked AS (
  SELECT
    INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text),''),'Unclassified'))) AS disease_category,
    COALESCE(SUM(c.claim_amount), 0)                                                    AS total_amount_py,
    RANK() OVER (ORDER BY COALESCE(SUM(c.claim_amount),0) DESC)                        AS prev_rank
  FROM policy_claim c
  INNER JOIN policy_window p ON p.id = c.policy_id
  WHERE c.deleted_at IS NULL
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee_f.id FROM policy_enrollment_employee pee_f
        WHERE pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        ) AND pee_f.deleted_at IS NULL
      )
    )
  GROUP BY INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text),''),'Unclassified')))
)
SELECT
  cy.disease_category                                                                                      AS "diseaseCategory",
  cy.total_claims                                                                                          AS "totalClaims",
  cy.total_amount                                                                                          AS "totalAmount",
  COALESCE(py.total_amount_py, 0)                                                                         AS "totalAmountPrevYear",
  py.prev_rank                                                                                             AS "rankPrevYear",
  CASE WHEN py.prev_rank IS NULL THEN NULL ELSE py.prev_rank - cy.cur_rank END                           AS "rankChange",
  ROUND((cy.total_amount - COALESCE(py.total_amount_py,0)) * 100.0 / NULLIF(py.total_amount_py,0), 1)  AS "yoYChangePercent"
FROM cur_year cy
LEFT JOIN prev_year_ranked py ON py.disease_category = cy.disease_category
ORDER BY cy.total_amount DESC$Q$
--   WHERE id = 29;

WITH policy_window AS (
  SELECT id, policy_from, policy_to FROM policy WHERE id = ###policyId###
),
cur_year_base AS (
  SELECT
    INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text),''),'Unclassified'))) AS disease_category,
    COUNT(c.id)                      AS total_claims,
    COALESCE(SUM(c.claim_amount), 0) AS total_amount
  FROM policy_claim c
  INNER JOIN policy_window p ON p.id = c.policy_id
  WHERE c.deleted_at IS NULL
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee_f.id FROM policy_enrollment_employee pee_f
        WHERE pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        ) AND pee_f.deleted_at IS NULL
      )
    )
  GROUP BY INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text),''),'Unclassified')))
),
cur_year AS (
  SELECT disease_category, total_claims, total_amount,
         RANK() OVER (ORDER BY total_amount DESC) AS cur_rank
  FROM cur_year_base
),
prev_year_ranked AS (
  SELECT
    INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text),''),'Unclassified'))) AS disease_category,
    COALESCE(SUM(c.claim_amount), 0)                                                    AS total_amount_py,
    RANK() OVER (ORDER BY COALESCE(SUM(c.claim_amount),0) DESC)                        AS prev_rank
  FROM policy_claim c
  INNER JOIN policy_window p ON p.id = c.policy_id
  WHERE c.deleted_at IS NULL
    AND (
      NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
      OR c.employee_id IN (
        SELECT pee_f.id FROM policy_enrollment_employee pee_f
        WHERE pee_f.policy_config_location_id = ANY(
          SELECT val::INTEGER FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''), ','
          ) AS val WHERE val ~ '^\d+$'
        ) AND pee_f.deleted_at IS NULL
      )
    )
  GROUP BY INITCAP(TRIM(COALESCE(NULLIF(TRIM(c.claim_description::text),''),'Unclassified')))
)
SELECT
  cy.disease_category                                                                                      AS "diseaseCategory",
  cy.total_claims                                                                                          AS "totalClaims",
  cy.total_amount                                                                                          AS "totalAmount",
  COALESCE(py.total_amount_py, 0)                                                                         AS "totalAmountPrevYear",
  py.prev_rank                                                                                             AS "rankPrevYear",
  CASE WHEN py.prev_rank IS NULL THEN NULL ELSE py.prev_rank - cy.cur_rank END                           AS "rankChange",
  ROUND((cy.total_amount - COALESCE(py.total_amount_py,0)) * 100.0 / NULLIF(py.total_amount_py,0), 1)  AS "yoYChangePercent"
FROM cur_year cy
LEFT JOIN prev_year_ranked py ON py.disease_category = cy.disease_category
ORDER BY cy.total_amount DESC

-- ------------------------------------------------------------------
-- 2. FILTER PARAMETERS  (admin_reports_parameters WHERE admin_report_id = 29)
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

-- ------------------------------------------------------------------
-- 3. RESULT COLUMN MAPPINGS  (admin_reports_results_mappings WHERE admin_report_id = 29)
-- ------------------------------------------------------------------
--   diseaseCategory              -> Disease Category               (variable: diseaseCategory, type: string, align: left)
--   totalClaims                  -> Total Claims                   (variable: totalClaims, type: number, align: right)
--   totalAmount                  -> Total Amount                   (variable: totalAmount, type: number, align: right)
--   totalAmountPrevYear          -> Total Amount (Prev Year)       (variable: totalAmountPrevYear, type: number, align: right)
--   rankPrevYear                 -> Rank (Prev Year)               (variable: rankPrevYear, type: number, align: right)
--   rankChange                   -> Rank Change                    (variable: rankChange, type: number, align: right)
--   yoYChangePercent             -> YoY Change (%)                 (variable: yoYChangePercent, type: number, align: right)

