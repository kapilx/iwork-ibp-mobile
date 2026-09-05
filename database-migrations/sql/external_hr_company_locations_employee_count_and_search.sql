-- Fixes report id 55 (end_point = 'external_hr_company_locations'), used by the
-- HR Portal's "Select Policy Location" dropdown.
--
-- Problems fixed:
-- 1. The stored query never computed employee_count/no_location_employee_count
--    at all (only selected id, addr_1) — every location showed 0 employees in
--    the dropdown regardless of how many were actually there.
-- 2. Counts now only include employees who have at least one policy mapping
--    to an ACTIVE policy (policy.policy_to >= CURRENT_DATE), matching the same
--    "active" definition used by the portfolio_kpi_summary report's
--    activePolicies stat — previously this would have counted employees on
--    expired policies too.
-- 3. Added a ###searchTerm### parameter so the location list can be searched
--    server-side (needed once the frontend switches from fetching all
--    locations at once, via limit=0, to real pagination — client-side search
--    only works when everything is already loaded).
-- 4. Dropped no_location_employee_count entirely (per explicit request — the
--    "No Location" filter checkbox stays, it just no longer shows a count).
--    It never depended on the location row at all (only on company_id, same
--    for every row) but was written as a per-row correlated subquery —
--    Postgres re-ran the same full scan of policy_enrollment_employee /
--    policy_enrollment_employee_policy_map once per OUTPUT row (e.g. 20 times
--    for a page of 20), which was ~95% of the query's cost (7933ms -> 1035ms
--    for page=1&limit=20 when it was hoisted into a CTE instead — still not
--    worth keeping once it was decided the count itself isn't needed).
-- 5. Split employee_count into active_employee_count/inactive_employee_count.
--    Redefined per explicit follow-up request to match the "Policies" list
--    shown on the dashboard for a location (dashboard_policy_cards, report id
--    22): each count is now the SUM of per-policy employee counts across that
--    location's policies (not a deduplicated headcount), and installment
--    policies are excluded (p.is_installment_policy = TOGGLE_TYPE_YES),
--    exactly mirroring dashboard_policy_cards' own installment-policy filter
--    — so the location dropdown's counts only ever reflect the same policies
--    the dashboard actually lists as cards for that location.
--
--    PERFORMANCE: the installment-policy check must NOT be a per-row
--    correlated EXISTS against lookup_data — that inflates the planner's cost
--    estimate enough to make Postgres JIT-compile the query (its own
--    optimization/emission passes took 3-5s on a query that runs in ~350ms
--    otherwise). Precomputing installment_policy_ids once as a CTE and doing
--    a plain `p.id NOT IN (...)` avoids this. Verified via EXPLAIN ANALYZE
--    against company_id 190550: correlated-EXISTS version = 5340ms (JIT
--    Total 5892ms) vs CTE version = 354ms (JIT Total 239ms) for the same
--    page=1&limit=20 request.
--
-- Verified against real data (company_id 190550): "20Cube Logistics" ->
-- active_employee_count=279, inactive_employee_count=372, matching the sum
-- of employee counts on that location's 2 active + 1 non-installment-inactive
-- policy cards (its 4th policy, an installment Mediclaim policy, is
-- deliberately excluded from both the dashboard's card list and this count).
-- Search filter confirmed to correctly narrow results (e.g. 'nestle' -> only
-- Nestle-named locations) without breaking the unfiltered case.
-- 6. Added the real address.location_code column (e.g. "266MB") — previously
--    the "location_code" field returned to the frontend was actually just
--    a.addr_1 (the address/location NAME), never the genuine code column;
--    confirmed via \d address that a real, populated location_code column
--    exists separately. Renamed the name field to location_name to stop
--    conflating the two, added the real location_code alongside it, and
--    extended the search filter to match either one.

UPDATE admin_reports
SET query = $Q$
WITH installment_policy_ids AS (
  SELECT p.id FROM policy p
  JOIN lookup_data ld ON ld.id = p.is_installment_policy AND ld.lookup_key = 'TOGGLE_TYPE_YES' AND ld.deleted_at IS NULL
  WHERE p.company_id = ###companyId###
)
SELECT DISTINCT ON (a.addr_1)
  a.id,
  a.addr_1 AS location_name,
  a.location_code,
  (
    SELECT COUNT(*)
    FROM policy_enrollment_employee pee
    JOIN policy_enrollment_employee_policy_map peepm ON peepm.employee_id = pee.id AND peepm.deleted_at IS NULL
    JOIN policy p ON p.id = peepm.policy_id
    WHERE pee.policy_config_location_id = cpcl.id
      AND pee.deleted_at IS NULL
      AND p.policy_to >= CURRENT_DATE
      AND p.id NOT IN (SELECT id FROM installment_policy_ids)
  ) AS active_employee_count,
  (
    SELECT COUNT(*)
    FROM policy_enrollment_employee pee2
    JOIN policy_enrollment_employee_policy_map peepm2 ON peepm2.employee_id = pee2.id AND peepm2.deleted_at IS NULL
    JOIN policy p2 ON p2.id = peepm2.policy_id
    WHERE pee2.policy_config_location_id = cpcl.id
      AND pee2.deleted_at IS NULL
      AND p2.policy_to < CURRENT_DATE
      AND p2.id NOT IN (SELECT id FROM installment_policy_ids)
  ) AS inactive_employee_count
FROM company_policy_configuration_location cpcl
JOIN address a ON a.id = cpcl.address_id
WHERE cpcl.company_id = ###companyId###
  AND a.deleted_at IS NULL
  AND (NULLIF(TRIM(###searchTerm###), '') IS NULL
       OR a.addr_1 ILIKE '%' || ###searchTerm### || '%'
       OR a.location_code ILIKE '%' || ###searchTerm### || '%')
ORDER BY a.addr_1 ASC, a.id ASC
$Q$
WHERE end_point = 'external_hr_company_locations';

-- Register the new searchTerm parameter (idempotent — only inserts if absent).
INSERT INTO admin_reports_parameters (admin_report_id, parameter_name, label, data_type, query_parameter, input_field_type, order_no)
SELECT ar.id, 'searchTerm', 'Search Term', 'string', '###searchTerm###', 'text', 3
FROM admin_reports ar
WHERE ar.end_point = 'external_hr_company_locations'
  AND NOT EXISTS (
    SELECT 1 FROM admin_reports_parameters arp
    WHERE arp.admin_report_id = ar.id AND arp.parameter_name = 'searchTerm'
  );
