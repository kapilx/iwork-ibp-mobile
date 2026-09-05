-- Replace p.net_premium with SUM of endorsement net_premium in all 3 HR portal reports.
-- If endorsements exist (net_premium IS NOT NULL) → use their SUM (includes negative deletion amounts).
-- If no endorsements → fallback to p.net_premium.

-- 1. dashboard_policy_cards
UPDATE admin_reports
SET query = REPLACE(
  query,
  'COALESCE(p.net_premium, 0)',
  'COALESCE((SELECT SUM(e.net_premium) FROM endorsement e WHERE e.policy_id = p.id AND e.net_premium IS NOT NULL), p.net_premium, 0)'
)
WHERE name = 'dashboard_policy_cards';

-- 2. portfolio_company_policies
UPDATE admin_reports
SET query = REPLACE(
  query,
  'p.net_premium * COALESCE(
      lpec.loc_emp_count::numeric / NULLIF(tpec.total_emp_count::numeric, 0),
      1.0
    )',
  'COALESCE((SELECT SUM(e.net_premium) FROM endorsement e WHERE e.policy_id = p.id AND e.net_premium IS NOT NULL), p.net_premium) * COALESCE(
      lpec.loc_emp_count::numeric / NULLIF(tpec.total_emp_count::numeric, 0),
      1.0
    )'
)
WHERE name = 'portfolio_company_policies';

-- 3. portfolio_kpi_summary
UPDATE admin_reports
SET query = REPLACE(
  query,
  'p.net_premium * COALESCE(',
  'COALESCE((SELECT SUM(e.net_premium) FROM endorsement e WHERE e.policy_id = p.id AND e.net_premium IS NOT NULL), p.net_premium) * COALESCE('
)
WHERE name = 'portfolio_kpi_summary';

-- Verify all 3 updated
SELECT name, query LIKE '%SUM(e.net_premium)%' AS updated
FROM admin_reports
WHERE name IN ('dashboard_policy_cards', 'portfolio_company_policies', 'portfolio_kpi_summary');
