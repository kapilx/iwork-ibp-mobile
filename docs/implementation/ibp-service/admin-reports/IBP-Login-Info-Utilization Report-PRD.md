# IBP Login Info — Admin Report

**Date:** 2026-05-08
**Author:** Nithin Sirigiri

---

## Purpose

Add **IBP Login Info** as a selectable report in the existing Admin Reports screen (the "Select Report" dropdown). When selected, the report shows which enrolled IBP employees have logged in, how many times, and when they last logged in. Users can filter the result before generating or downloading.

---

## Filters

| Filter | Type | Source |
|---|---|---|
| Company Name | Searchable dropdown | Active companies from `company` table |
| Employee ID | Searchable dropdown | Distinct `employee_id` values from the report view |
| Employee Name | Searchable dropdown | Distinct `employee_name` values from the report view |
| Has Logged In | Dropdown (static) | Hard-coded: All, Yes, No |
| Last Login Date — From | Date input | — |
| Last Login Date — To | Date input | — |

All filters are optional. Leaving a filter at "All" / blank means it does not constrain the result.

**Cascade rule *(deferred — not in current scope)*:** When a Company Name is selected, the Employee ID and Employee Name dropdowns immediately reload to show only employees belonging to that company. When Company Name is cleared back to "All", both employee dropdowns reload to show all employees again. All six filters work independently in the current scope.

---

## Business Rules

1. **All filters are optional** — the report runs without any filters and returns all enrolled employees (matching the existing report behaviour for other reports).
2. **Filters use COALESCE** — each dropdown filter uses `WHERE col = COALESCE(###Token###, col)` so a null/unset token is a no-op.
3. **Date range uses IS NULL OR** — the date-from / date-to filters use `(###Token### IS NULL OR last_login_at::date >= ###Token###::date)` instead of COALESCE, because the view's `last_login_at` can be NULL (employees who never logged in) and COALESCE on NULL would silently drop those rows when no date is active.
4. **Date filter excludes never-logged-in employees** — when either date bound is set, only employees with an actual login date in range are returned. Employees who have never logged in are excluded.
5. **Filters combine with AND** — all active filters are conjunctive.
6. **Searchable dropdowns** — Company Name, Employee ID, and Employee Name dropdowns support in-dropdown text search (typeahead), client-side. The full option list loads once; the user types to narrow. "All" stays pinned at the top regardless of typed text.
7. **All dropdowns include an "All" option** — with value `#99#` (the framework's sentinel for null). The frontend must send `#99#` (not an empty string) when the user clears a dropdown — sending `""` would filter to zero rows.
8. **Cascading — Company drives Employee dropdowns *(deferred — not in current scope)*** — when Company Name is set, the Employee ID and Employee Name dropdowns reload with options filtered to that company only. When Company Name is cleared, both employee dropdowns reload with all employees. Has Logged In and date filters are not affected by the cascade — they remain independent. The Employee ID and Employee Name filters are still independent of each other even after the cascade narrows them. *Currently all filters operate independently; cascade requires a frontend code change and will be addressed in a follow-up.*
9. **CSV download honours all active filters** — same filtered query as the on-screen grid.
10. **`last_login_at` is internal** — the view exposes a raw `last_login_at` timestamp (for date filtering) alongside the display-formatted `last_login_date` string. Only `last_login_date` is mapped in the results grid.

---

## Technical Details

- **No code changes required for the current scope.** This is purely DB configuration — run the four scripts and the report is live.
- **Cascade implementation *(deferred — for reference)***: when implemented, the approach is client-side filter — at report load, all employee options are fetched as usual. The Employee ID and Employee Name `raw_query` values include `company_name` as an extra column alongside `label` and `value` so the frontend can group/filter by it. When the user picks a company, the frontend keeps only the options whose `company_name` matches the selection. When the user clears Company back to "All", the full option list is restored. This requires a frontend code change.
- **Token substitution** is handled by the existing `buildQuery()` in `report.service.ts` which replaces `###Token###` with `'value'` or `NULL` at runtime.
- **Dropdown option pattern** — every query-sourced dropdown uses the standard project pattern: an `'All'` / `#99#` row with `sort_order = 0` UNION-ed with distinct values using `ROW_NUMBER() OVER (ORDER BY label)`, ordered by `(sort_order, label)`.
- **View naming** follows the project `vr_` convention (e.g. `vr_user_activity`, `vr_active_user_info`).
- **Report `name` and `end_point`** use kebab-case, matching every existing row in `admin_reports`.

---

## Scripts

Run the four steps below in order.

### Step 1 — Create the view

```sql
CREATE OR REPLACE VIEW public.vr_ibp_login_info AS
SELECT pee.company_id
     , c.company_name
     , pee.company_employee_id       AS "employee_id"
     , pee.employee_name
     , u.email_id                    AS "login_user_email"
     , u.mobile                      AS "login_user_mobile"
     , CASE WHEN COUNT(ual.id) > 0
            THEN 'Yes' ELSE 'No'
       END                           AS "has_logged_in"
     , COUNT(ual.id)                 AS "login_count"
     , MAX(ual.action_date)          AS "last_login_at"
     , TO_CHAR(MAX(ual.action_date),
       'YYYY-MM-DD HH24:MI')         AS "last_login_date"
  FROM policy_enrollment_employee pee
  LEFT JOIN users u
         ON u.id = pee.user_id
        AND u.deleted_at IS NULL
  LEFT JOIN user_activity_log ual
         ON ual.user_id = pee.user_id
        AND ual.activity_key = 'LOGGED_IN'
  LEFT JOIN company c
         ON c.id = pee.company_id
 WHERE pee.deleted_at IS NULL
 GROUP BY pee.id
        , pee.company_employee_id
        , pee.company_id
        , c.company_name
        , pee.employee_name
        , u.login_name
        , u.email_id
        , u.mobile;
```

### Step 2 — Insert the report row

```sql
INSERT INTO public.admin_reports (
  name, label, end_point, query, order_no, created_by, created_at
) VALUES (
  'ibp-login-info',
  'IBP Login Info',
  'ibp-login-info',
  'select company_id, company_name, employee_id, employee_name,
          login_user_email, login_user_mobile, has_logged_in,
          login_count, last_login_date
     from vr_ibp_login_info
    where company_name  = COALESCE(###CompanyName###,  company_name)
      and employee_id   = COALESCE(###EmployeeId###,   employee_id)
      and employee_name = COALESCE(###EmployeeName###, employee_name)
      and has_logged_in = COALESCE(###HasLoggedIn###,  has_logged_in)
      and (###DateFrom### IS NULL OR last_login_at::date >= ###DateFrom###::date)
      and (###DateTo###   IS NULL OR last_login_at::date <= ###DateTo###::date)
    order by company_name, has_logged_in desc, login_count desc, employee_name',
  21,
  '1',
  CURRENT_TIMESTAMP
);
```

### Step 3 — Insert the filter parameter rows

```sql
-- Company Name (searchable dropdown sourced from company table)
INSERT INTO public.admin_reports_parameters (
  admin_report_id, parameter_name, label, data_type,
  query_parameter, input_field_type, option_type, option, created_by
) VALUES (
  (SELECT id FROM public.admin_reports WHERE name = 'ibp-login-info' AND deleted_at IS NULL),
  'companyName', 'Company Name', 'string', '###CompanyName###', 'SelectBox', 'query',
  '{"raw_query":"select label, value, sort_order from (select ''All'' as label, ''#99#'' as value, 0 as sort_order union select label, label as value, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct company_name as label from company where deleted_at is null) a) as t order by sort_order, label"}'::jsonb,
  '1'
);

-- Employee ID (searchable dropdown; includes company_name for client-side cascade filtering)
INSERT INTO public.admin_reports_parameters (
  admin_report_id, parameter_name, label, data_type,
  query_parameter, input_field_type, option_type, option, created_by
) VALUES (
  (SELECT id FROM public.admin_reports WHERE name = 'ibp-login-info' AND deleted_at IS NULL),
  'employeeId', 'Employee ID', 'string', '###EmployeeId###', 'SelectBox', 'query',
  '{"raw_query":"select label, value, company_name, sort_order from (select ''All'' as label, ''#99#'' as value, null as company_name, 0 as sort_order union select label, label as value, company_name, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct employee_id as label, company_name from vr_ibp_login_info where employee_id is not null) a) as t order by sort_order, label"}'::jsonb,
  '1'
);

-- Employee Name (searchable dropdown; includes company_name for client-side cascade filtering)
INSERT INTO public.admin_reports_parameters (
  admin_report_id, parameter_name, label, data_type,
  query_parameter, input_field_type, option_type, option, created_by
) VALUES (
  (SELECT id FROM public.admin_reports WHERE name = 'ibp-login-info' AND deleted_at IS NULL),
  'employeeName', 'Employee Name', 'string', '###EmployeeName###', 'SelectBox', 'query',
  '{"raw_query":"select label, value, company_name, sort_order from (select ''All'' as label, ''#99#'' as value, null as company_name, 0 as sort_order union select label, label as value, company_name, ROW_NUMBER () OVER (ORDER BY label) as sort_order from (select distinct employee_name as label, company_name from vr_ibp_login_info where employee_name is not null) a) as t order by sort_order, label"}'::jsonb,
  '1'
);

-- Has Logged In (static dropdown: All / Yes / No)
INSERT INTO public.admin_reports_parameters (
  admin_report_id, parameter_name, label, data_type,
  query_parameter, input_field_type, option_type, option, created_by
) VALUES (
  (SELECT id FROM public.admin_reports WHERE name = 'ibp-login-info' AND deleted_at IS NULL),
  'hasLoggedIn', 'Has Logged In', 'string', '###HasLoggedIn###', 'SelectBox', 'raw',
  '{"data":[{"label":"All","value":"#99#"},{"label":"Yes","value":"Yes"},{"label":"No","value":"No"}]}'::jsonb,
  '1'
);

-- Last Login Date — From (date input)
INSERT INTO public.admin_reports_parameters (
  admin_report_id, parameter_name, label, data_type,
  query_parameter, input_field_type, option_type, option, created_by
) VALUES (
  (SELECT id FROM public.admin_reports WHERE name = 'ibp-login-info' AND deleted_at IS NULL),
  'dateFrom', 'Last Login Date — From', 'date', '###DateFrom###', '', '', NULL, '1'
);

-- Last Login Date — To (date input)
INSERT INTO public.admin_reports_parameters (
  admin_report_id, parameter_name, label, data_type,
  query_parameter, input_field_type, option_type, option, created_by
) VALUES (
  (SELECT id FROM public.admin_reports WHERE name = 'ibp-login-info' AND deleted_at IS NULL),
  'dateTo', 'Last Login Date — To', 'date', '###DateTo###', '', '', NULL, '1'
);
```

### Step 4 — Insert the result column mappings

```sql
INSERT INTO public.admin_reports_results_mappings (
  admin_report_id, query_parameter_name, variable_name, label, data_type, alignment, created_by
)
SELECT r.id, m.qpn, m.vn, m.lbl, m.dt, '', '1'
FROM public.admin_reports r
CROSS JOIN (VALUES
  ('company_id',        'companyId',       'Company ID',         'number'),
  ('company_name',      'companyName',     'Company Name',       'string'),
  ('employee_id',       'employeeId',      'Employee ID',        'string'),
  ('employee_name',     'employeeName',    'Employee Name',      'string'),
  ('login_user_email',  'loginUserEmail',  'Login User Email',   'string'),
  ('login_user_mobile', 'loginUserMobile', 'Login User Mobile',  'string'),
  ('has_logged_in',     'hasLoggedIn',     'Has Logged In',      'string'),
  ('login_count',       'loginCount',      'Login Count',        'number'),
  ('last_login_date',   'lastLoginDate',   'Last Login Date',    'date')
) AS m(qpn, vn, lbl, dt)
WHERE r.name = 'ibp-login-info' AND r.deleted_at IS NULL;
```

---

## Open Items

### For Engineering / Tech Lead

1. **Role / access control** — which roles (Admin, Operations, etc.) should see "IBP Login Info" in the Select Report dropdown? If `admin_reports` visibility is gated by role, the access grant must be configured before the report is usable. Backend dev or DevOps to confirm how report-level access is controlled in this framework and apply the correct role mapping.

2. **Filter display order** — the six parameter rows in Step 3 are inserted sequentially with no `order_no` value, following the pattern of all existing rows in `admin_reports_parameters` (where `order_no` is always empty). Dev to confirm the framework renders filters in insert order (by `id`) and that no `order_no` value is required. If `order_no` is needed, assign 1–6 in the order: Company Name → Employee ID → Employee Name → Has Logged In → Last Login Date From → Last Login Date To.

3. **Cascade — frontend component and implementation *(deferred — not in current scope)*** — when cascade is picked up, the PRD specifies client-side filter approach: when Company Name changes, the Employee ID and Employee Name option arrays are filtered in the browser using the `company_name` field returned alongside `label` and `value` in the dropdown data. Frontend dev needs to:
   - Identify which component renders the SelectBox dropdowns for admin reports
   - Hook the Company Name `onChange` event to filter the Employee option arrays by `company_name`
   - Confirm the component can consume extra columns in option data (today it likely only reads `label` and `value` — `company_name` is a new field)
   - Handle the "All" pseudo-row correctly — it has `company_name = null` and must always remain visible regardless of the selected company

4. **Searchable dropdown (typeahead) — confirm existing capability** — the PRD requires Company Name, Employee ID, and Employee Name dropdowns to support in-dropdown text search. From the existing UI (screenshot), current SelectBox dropdowns appear to be standard dropdowns with no visible search input. Frontend dev to confirm whether typeahead is already built into the SelectBox component. If yes, no work needed. If no, this must be built before this report can be handed to users — it is the primary usability mechanism for high-cardinality lists like Employee ID and Employee Name.

5. **`last_login_at` extra column in view — results mapping assumption** — the view `vr_ibp_login_info` exposes `last_login_at` (raw timestamp, used for date filtering) which is intentionally NOT included in `admin_reports_results_mappings`. If any part of the framework assumes a 1:1 mapping between view columns and result mapping rows, this will cause an error. Backend dev to verify `last_login_at` is safely ignored by the framework when it appears in query results but has no mapping row.

6. **`company_name` extra column in Employee dropdown options — framework compatibility *(deferred — not in current scope)*** — the Employee ID and Employee Name dropdown `raw_query` values return three columns: `label`, `value`, and `company_name`. The existing framework's option-fetching code likely only reads `label` and `value`. When cascade is implemented, backend dev to confirm the extra `company_name` column is passed through to the frontend (not stripped server-side) so the client-side cascade can use it.

### Pre-existing (not introduced by this feature)

7. **SQL injection** — existing `buildQuery()` in `report.service.ts` does raw string substitution. Not introduced by this feature, but the date inputs are a new user-controlled surface that increases exposure. Track as a separate technical debt ticket.
