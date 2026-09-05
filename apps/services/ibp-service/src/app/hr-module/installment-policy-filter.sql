-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: Exclude installment policies from HR Portal and IBP views
--
-- Logic: join policy.is_installment_policy → lookup_data.lookup_key
--        If lookup_key = 'TOGGLE_TYPE_YES'  →  installment policy  →  EXCLUDE
--        Otherwise (NULL or any other key)  →  show normally
--
-- All UPDATEs are idempotent: guarded by "query NOT LIKE '%is_installment_policy%'"
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
BEGIN

-- ── 1. dashboard_policy_cards ─────────────────────────────────────────────────
-- Main HR Portal policy list. Add filter just before ORDER BY.
UPDATE admin_reports
SET
  query       = REPLACE(
    query,
    'ORDER BY ld.lookup_key, p.policy_name',
    E'AND (p.is_installment_policy IS NULL OR NOT EXISTS (\n  SELECT 1 FROM lookup_data inst_ld\n  WHERE inst_ld.id = p.is_installment_policy\n    AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES''\n    AND inst_ld.deleted_at IS NULL\n))\nORDER BY ld.lookup_key, p.policy_name'
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'dashboard_policy_cards'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'dashboard_policy_cards: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 2. dashboard_premium_summary ──────────────────────────────────────────────
-- Two CTEs (cur_year, prev_year) each query FROM policy p.
-- Add filter to both CTE WHERE clauses using their unique date anchors.
UPDATE admin_reports
SET
  query = REPLACE(
    REPLACE(
      query,
      -- cur_year CTE: after policy period end date condition
      E'    AND p.policy_to   <= ###policyPeriodEnd###::date\n)',
      E'    AND p.policy_to   <= ###policyPeriodEnd###::date\n    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n)'
    ),
    -- prev_year CTE: after policy period-minus-1-year condition
    E'    AND p.policy_to   <= (###policyPeriodEnd###::date   - INTERVAL ''1 year'')\n)',
    E'    AND p.policy_to   <= (###policyPeriodEnd###::date   - INTERVAL ''1 year'')\n    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n)'
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'dashboard_premium_summary'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'dashboard_premium_summary: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 3. endorsement_overview ───────────────────────────────────────────────────
-- Joins endorsement e → policy p. Add filter before externalHrUserId condition.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    E'  AND (###externalHrUserId### IS NULL\n       OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))',
    E'  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n  AND (###externalHrUserId### IS NULL\n       OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))'
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'endorsement_overview'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'endorsement_overview: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 4. portfolio_policies ─────────────────────────────────────────────────────
-- FROM policy p WHERE p.company_id IN (...). Add filter before ORDER BY.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    'ORDER BY p.company_id, p.policy_from DESC',
    E'AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\nORDER BY p.company_id, p.policy_from DESC'
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'portfolio_policies'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'portfolio_policies: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 5. dashboard_enrollment_status ────────────────────────────────────────────
-- Scopes policies by company. Add filter before externalHrUserId condition.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    E'    AND (###externalHrUserId### IS NULL\n         OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))',
    E'    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n    AND (###externalHrUserId### IS NULL\n         OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))'
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'dashboard_enrollment_status'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'dashboard_enrollment_status: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 6. policy_claim_history ───────────────────────────────────────────────────
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    E'  AND (###externalHrUserId### IS NULL\n       OR c.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))',
    E'  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n  AND (###externalHrUserId### IS NULL\n       OR c.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))'
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'policy_claim_history'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'policy_claim_history: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 7. endorsement_employee_metrics ───────────────────────────────────────────
-- Has multiple sub-queries; filter on the main policy join anchor.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    E'    AND (###externalHrUserId### IS NULL\n         OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))',
    E'    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n    AND (###externalHrUserId### IS NULL\n         OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))'
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'endorsement_employee_metrics'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'endorsement_employee_metrics: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 8. endorsement_list ───────────────────────────────────────────────────────
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    E'  AND (###externalHrUserId### IS NULL\n       OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))',
    E'  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n  AND (###externalHrUserId### IS NULL\n       OR e.policy_id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))'
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'endorsement_list'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'endorsement_list: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 9. dashboard_top10_diseases ───────────────────────────────────────────────
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    E'  AND (###externalHrUserId### IS NULL\n       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))',
    E'  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n  AND (###externalHrUserId### IS NULL\n       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))'
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'dashboard_top10_diseases'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'dashboard_top10_diseases: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 10. dashboard_top10_hospitals ─────────────────────────────────────────────
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    E'  AND (###externalHrUserId### IS NULL\n       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))',
    E'  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n  AND (###externalHrUserId### IS NULL\n       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))'
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'dashboard_top10_hospitals'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'dashboard_top10_hospitals: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 11. portfolio_company_policies ────────────────────────────────────────────
-- Policy listing per company. Add filter before ORDER BY.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    'ORDER BY p.policy_from DESC',
    E'AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\nORDER BY p.policy_from DESC'
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'portfolio_company_policies'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'portfolio_company_policies: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 12. dashboard_demographics ────────────────────────────────────────────────
-- policy_scope CTE selects all company policies — filter installment ones out.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    E'  WHERE p.company_id = ###companyId###\n    AND (###policyType### = '''' OR ld.lookup_key = ###policyType###)\n),\nemployee_scope AS (',
    E'  WHERE p.company_id = ###companyId###\n    AND (###policyType### = '''' OR ld.lookup_key = ###policyType###)\n    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n),\nemployee_scope AS ('
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'dashboard_demographics'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'dashboard_demographics: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 13. dashboard_claims_analysis_kpi ────────────────────────────────────────
-- net_premium CTE selects policies by company — filter installment ones out.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    E'  WHERE p.company_id = ###companyId###\n    AND (###policyType### = '''' OR ld.lookup_key = ###policyType###)\n)\nSELECT',
    E'  WHERE p.company_id = ###companyId###\n    AND (###policyType### = '''' OR ld.lookup_key = ###policyType###)\n    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n)\nSELECT'
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'dashboard_claims_analysis_kpi'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'dashboard_claims_analysis_kpi: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 14. portfolio_kpi_summary ─────────────────────────────────────────────────
-- Main policy query has externalHrUserId guard. Add filter before it.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    E'  AND (###externalHrUserId### IS NULL\n       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))\nLEFT JOIN policy_loc_ratios',
    E'  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n  AND (###externalHrUserId### IS NULL\n       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))\nLEFT JOIN policy_loc_ratios'
  ),
  updated_at  = NOW(),
  updated_by  = 'SYSTEM'
WHERE name = 'portfolio_kpi_summary'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'portfolio_kpi_summary: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 15. external_hr_company_policies ─────────────────────────────────────────
-- Direct policy listing used for dropdowns/filters. Alias is "ap" not "p".
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    E'WHERE ap.company_id = ###companyId###\nORDER BY ap.policy_name ASC',
    E'WHERE ap.company_id = ###companyId###\n  AND (ap.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = ap.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\nORDER BY ap.policy_name ASC'
  ),
  updated_at = NOW(),
  updated_by = 'SYSTEM'
WHERE name = 'external_hr_company_policies'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'external_hr_company_policies: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 16. linked_policies_of_cd_account ────────────────────────────────────────
-- Lists all policies linked to a CD account. Add filter before ORDER BY.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    'ORDER BY p.policy_name',
    E'AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\nORDER BY p.policy_name'
  ),
  updated_at = NOW(),
  updated_by = 'SYSTEM'
WHERE name = 'linked_policies_of_cd_account'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'linked_policies_of_cd_account: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 17. cd_account_details ────────────────────────────────────────────────────
-- Shows CD accounts with linked policy data. Add filter before externalHrUserId.
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    E'  AND (###externalHrUserId### IS NULL\n       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))\nGROUP BY cd.id',
    E'  AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n  AND (###externalHrUserId### IS NULL\n       OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE hr_management_id = ###externalHrUserId###::INTEGER))\nGROUP BY cd.id'
  ),
  updated_at = NOW(),
  updated_by = 'SYSTEM'
WHERE name = 'cd_account_details'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'cd_account_details: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;


-- ── 18. dashboard_top10_employees ─────────────────────────────────────────────
-- Both cur_year and prev_year CTEs join policy p for policyType filtering.
-- REPLACE patches both CTEs in one pass (all occurrences).
UPDATE admin_reports
SET
  query = REPLACE(
    query,
    E'    AND (###policyType###  = '''' OR ld.lookup_key = ###policyType###)\n    AND c.claim_dt',
    E'    AND (###policyType###  = '''' OR ld.lookup_key = ###policyType###)\n    AND (p.is_installment_policy IS NULL OR NOT EXISTS (SELECT 1 FROM lookup_data inst_ld WHERE inst_ld.id = p.is_installment_policy AND inst_ld.lookup_key = ''TOGGLE_TYPE_YES'' AND inst_ld.deleted_at IS NULL))\n    AND c.claim_dt'
  ),
  updated_at = NOW(),
  updated_by = 'SYSTEM'
WHERE name = 'dashboard_top10_employees'
  AND query NOT LIKE '%is_installment_policy%';

RAISE NOTICE 'dashboard_top10_employees: %', CASE WHEN FOUND THEN 'updated' ELSE 'already patched / not found' END;

END $$;
