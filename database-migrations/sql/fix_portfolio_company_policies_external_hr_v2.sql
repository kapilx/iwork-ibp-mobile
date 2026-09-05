-- HOTFIX: portfolio_company_policies returning 0 results after fix_portfolio_company_policies_external_hr.sql
--
-- Root cause: previous script used (###externalHrUserId### = '') as guard.
-- buildQuery() substitutes SQL NULL (not '') for undefined/unset params,
-- and NULL = '' evaluates to NULL in PostgreSQL (not TRUE), so all policies
-- were excluded for non-External-HR users.
--
-- Fix: use IS NULL so NULL (unset) means "no filter → show all policies".
--   • NULL IS NULL  → TRUE  → all policies shown for regular/CRM/HR users
--   • '5' IS NULL   → FALSE → filters to external HR's mapped policies
--
-- Run this immediately after fix_portfolio_company_policies_external_hr.sql.

BEGIN;

UPDATE admin_reports
SET query = $Q$
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
LEFT JOIN lookup_data ld              ON ld.id = p.policy_type_lid AND ld.deleted_at IS NULL
LEFT JOIN policy_type_segregation pts ON pts.policy_type_lid = p.policy_type_lid
LEFT JOIN lookup_data iirm_ld         ON iirm_ld.id = pts.iirm_policy_type_lid AND iirm_ld.deleted_at IS NULL
LEFT JOIN policy_insurer pi           ON pi.policy_id = p.id
LEFT JOIN policy_tpa pt               ON pt.policy_id = p.id
WHERE p.company_id = ###companyId###
  AND (
    NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), '') IS NULL
    OR EXISTS (
      SELECT 1
      FROM policy_configuration pcfg,
           jsonb_array_elements_text(COALESCE(pcfg.policy_configuration->'selectedLocationIds', '[]'::jsonb)) loc_id
      WHERE pcfg.policy_id = p.id
        AND pcfg.policy_configuration_status_lid = (
          SELECT id FROM lookup_data
          WHERE lookup_key = 'POLICY_CONFIGURATION_STATUS_LIVE'
          LIMIT 1
        )
        AND loc_id::INTEGER = ANY(
          SELECT val::INTEGER
          FROM regexp_split_to_table(
            NULLIF(TRIM(REGEXP_REPLACE(###locationIds###, '[\[\]\s]', '', 'g')), ''),
            ','
          ) AS val
          WHERE val ~ '^\d+$'
        )
    )
  )
  AND (###externalHrUserId### IS NULL
       OR p.id IN (
         SELECT policy_id
         FROM external_hr_policy_map
         WHERE hr_management_id = ###externalHrUserId###::INTEGER
       ))
ORDER BY p.policy_from DESC
$Q$,
updated_at = NOW()
WHERE name = 'portfolio_company_policies';

-- Ensure externalHrUserId parameter is registered (idempotent)
INSERT INTO admin_reports_parameters
  (admin_report_id, parameter_name, query_parameter, created_at, updated_at, created_by, updated_by)
SELECT
  r.id, 'externalHrUserId', '###externalHrUserId###', NOW(), NOW(), 'SYSTEM', 'SYSTEM'
FROM admin_reports r
WHERE r.name = 'portfolio_company_policies'
  AND NOT EXISTS (
    SELECT 1 FROM admin_reports_parameters p
    WHERE p.admin_report_id = r.id AND p.parameter_name = 'externalHrUserId'
  );

-- Verify
SELECT
  r.name,
  CASE
    WHEN r.query LIKE '%###externalHrUserId### IS NULL%' THEN 'QUERY PATCHED OK (IS NULL guard)'
    ELSE 'QUERY NOT PATCHED'
  END AS query_status,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM admin_reports_parameters p
      WHERE p.admin_report_id = r.id AND p.parameter_name = 'externalHrUserId'
    ) THEN 'PARAM REGISTERED OK'
    ELSE 'PARAM MISSING'
  END AS param_status
FROM admin_reports r
WHERE r.name = 'portfolio_company_policies';

COMMIT;
