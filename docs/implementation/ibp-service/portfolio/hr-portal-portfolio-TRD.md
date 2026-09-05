# HR Portal – Portfolio Page – Technical Requirement Document (TRD)

**Document Version:** 1.0
**Date:** 2026-05-07
**Author:** IIRM Engineering Team
**Jira Reference:** IIRM-PORTFOLIO
**PRD Reference:** `docs/implementation/ibp-service/portfolio/hr-portal-portfolio-PRD.md`
**SDS Reference:** `docs/implementation/ibp-service/portfolio/hr-portal-portfolio-SDS.md`
**Framework Reference:** `docs/implementation/ibp-service/hr-module-report-framework-tech-spec.md`

> **Dependency Note (Framework Spec §9):** This TRD follows the mandatory module-level format defined in `hr-module-report-framework-tech-spec.md §9`. Any update to the framework spec must be reflected here immediately.

---

## 1. Architecture Overview

The Portfolio page is the landing screen of the HR Portal, routed at `/hr-portal/portfolio`. It uses the same HR Report Framework as every other HR Portal screen — all data is fetched via `POST /hr-module/generate/:report`.

The page loads reports on demand:

| Report key | Purpose | Widget type | When called |
|---|---|---|---|
| `portfolio_kpi_summary` | Top-level KPI cards | Single-row aggregate (`data.rows[0]`) | On mount |
| `portfolio_group_companies` | GROUP_MEMBER client companies, paginated | Table (flat rows, frontend groups by `groupId`; 20 per page) | On mount + scroll load-more |
| `portfolio_individual_companies` | INDIVIDUAL client companies, paginated | Table (flat rows; 20 per page) | On mount + scroll load-more |
| `portfolio_company_policies` | Policies for one company | Table (flat rows for `companyId`) | On demand when company row is expanded |

> **Architecture change:** The old `portfolio_companies` and `portfolio_policies` reports (load-all-at-once) have been replaced. Companies are now split into two paginated reports (`portfolio_group_companies`, `portfolio_individual_companies`), loaded via scroll-triggered load-more using an IntersectionObserver sentinel at the bottom of each section. Policies are loaded on demand per company via `portfolio_company_policies` — no policy round-trip is made for companies the user has not expanded.

### 1.1 Route and Entry Point

| Property | Value |
|---|---|
| Frontend route | `/hr-portal/portfolio` |
| Component | `apps/ui/ibp/src/app/pages/HRPortalPortfolio/index.tsx` |
| Auth | `JwtAuthGuard` (401 if no valid JWT) + `RolesGuard` `HR_ADMIN` (403 if wrong role) |
| `companyId` scope | Broker/IBP organization ID from JWT — scopes all queries to client companies managed by this broker org |
| Entry | Left sidebar → "Portfolio" |

### 1.2 Framework API Contracts

| Operation | Method | Path | Success |
|---|---|---|---|
| Generate / fetch report | POST | `/hr-module/generate/:report` | 201 |
| Export report | POST | `/hr-module/download/:report` | 200 file |

**Generate — success response (201):**
```json
{
  "statusCode": 201,
  "message": "Report generated successfully.",
  "data": {
    "rows": [ /* array of row objects */ ],
    "count": 42
  }
}
```

> **Frontend binding rule (Framework §4.1):** Read `data.rows` for list reports. Read `data.rows[0]` for single-row aggregate reports (KPI cards).

### 1.3 Common Request Body Fields

| Placeholder | Type | Required | Description |
|---|---|---|---|
| `###companyId###` | integer | Yes | Broker org ID from JWT — used to scope all portfolio queries |

---

## 2. Screen-to-Report-Key Mapping

| Screen section | Report key | Widget type | Reads from | Call pattern |
|---|---|---|---|---|
| KPI Cards | `portfolio_kpi_summary` | 4 KPI cards | `data.rows[0]` | `useHRReport` on mount |
| Group Clients company list | `portfolio_group_companies` | Flat table (grouped client-side by `groupId`); 20/page | `data.rows` (accumulated across pages) | `useApiMutation` + scroll load-more |
| Individual Clients company list | `portfolio_individual_companies` | Flat table; 20/page | `data.rows` (accumulated across pages) | `useApiMutation` + scroll load-more |
| Policy rows per company | `portfolio_company_policies` | Flat table for one company | `data.rows` | `apiRequest` on expand; cached in `policyCache` |

---

## 3. Schema Notes (Verified from Entity Definitions)

All table and column names below are confirmed from the TypeORM entity files in `apps/services/service-lib/src/lib/entities/`. No placeholders remain.

| Table | Key columns | Notes |
|---|---|---|
| `company` | `id`, `company_name`, `display_name`, `industry_segment_lid`, `no_of_employees`, `account_manager`, `deleted_at` | Company master. Use `COALESCE(display_name, company_name)` for display. Has `deleted_at` — add `c.deleted_at IS NULL` to all company joins. |
| `group_company_map` | `id`, `company_id`, `group_company_id` | Group hierarchy join table. `group_company_id` = the parent/group company (also a `company` record). `company_id` = the member company. Both FKs point to `company.id`. |
| `group_company_lid` | — | A `lookup_data` FK on `company` that classifies whether a company IS a group-type. **Not a parent company FK.** Used by the org-service to decide whether to create a `group_company_map` row. Not used in portfolio SQL. |
| `policy` | `id`, `company_id`, `policy_type_lid`, `insurer_policy_number`, `net_premium`, `policy_from`, `policy_to`, `status_lid` | Policy master. Does **not** have `deleted_at` — do not add `deleted_at IS NULL` on policy joins. No plain text `status` column — policy status is derived from `policy_to` vs `CURRENT_DATE`. |
| `policy_insurer_map` | `policy_id`, `insurer_id`, `share_percentage` | Links policies to insurers (one-to-many). Use `DISTINCT ON (policy_id)` ordered by `share_percentage DESC` to get the lead insurer. |
| `lookup_data` | `id`, `lookup_key`, `lookup_value`, `deleted_at` | Policy type lookup. Policy type codes: verify `lookup_key` values for GMC, GTL, GPA, GPC. |
| `insurer` | `id`, `name`, `display_name` | Insurer master. Use `display_name` for display. Joined via `policy_insurer_map` (not directly from policy). |
| `user` | `user_id`, `first_name`, `last_name` | For RM name. FK from `company.account_manager → user.user_id`. Display as `first_name || ' ' || last_name`. |
| `company_address` | `company_id`, `address_id`, `is_primary` | Junction table. Filter `is_primary = true` for the primary address. |
| `address` | `id`, `city_id`, `state_id` | Address record. FK to city and state. |
| `city` | `id`, `name` | City lookup. Column is `name`. |
| `state` | `id`, `name`, `state_code` | State lookup. Column is `name`. |
| `policy_enrollment_employee_policy_map` | `policy_id`, `employee_id`, `deleted_at` | Enrollment map for life count. Has `deleted_at`. |

### 3.1 Company Classification Logic

| Category | Condition |
|---|---|
| GROUP PARENT | Company appears as `group_company_id` in `group_company_map` |
| GROUP MEMBER | Company appears as `company_id` in `group_company_map` |
| INDIVIDUAL | Company does **not** appear in `group_company_map` (neither column) |

Group parent companies are **not returned as data rows** in `portfolio_group_companies`. They are reconstructed client-side from the `groupId` / `groupName` fields on GROUP_MEMBER rows. The frontend groups member rows by `groupId` to build the Group Clients accordion headers.

### 3.2 Group Logo and Colour

There are no `logo_text` or `logo_color` columns on the `company` table or any related table. These are **derived client-side**:
- **Logo initials:** First letter of each word in `groupName` (up to 2 letters)
- **Logo colour:** Assigned from a deterministic colour palette based on `groupId` (e.g., `PRESET_COLORS[groupId % PRESET_COLORS.length]`)

---

## 4. `admin_reports` Insert/Upsert Plan

Seed script location: `apps/services/ibp-service/src/app/hr-module/hr-module-portfolio-scripts.sql`

Each report uses a plain `INSERT` into `admin_reports` (same as `hr-module-cd-scripts.sql` — no `ON CONFLICT`). The script is designed to run once per environment. Parameters and result mappings follow the exact column signature established by the CD module:

**`admin_reports_parameters` columns:** `admin_report_id`, `parameter_name`, `label`, `query_parameter`, `data_type`, `created_by`, `updated_by`, `input_field_type`, `option_type`, `option`, `order_no`

- `data_type` values: `'number'` or `'string'`
- `input_field_type` value: `'input'`
- `option_type` value: `'none'`
- `option` value: `'{}'::jsonb`

**`admin_reports_results_mappings` columns:** `admin_report_id`, `query_parameter_name`, `variable_name`, `label`, `data_type`, `created_by`, `updated_by`, `alignment`

- `data_type` values: `'number'` or `'string'`
- `alignment` values: `'right'` (numeric fields) or `'left'` (text fields)

---

## 5. Report 1 — `portfolio_kpi_summary`

### 5.1 Purpose

Returns a single aggregate row with overall portfolio KPI metrics for the KPI cards at the top of the page.

### 5.2 Parameters

| Placeholder | Type | Required | Source |
|---|---|---|---|
| `###companyId###` | integer | Yes | JWT companyId (broker org) |

### 5.3 Response Fields

| API field | Type | Description |
|---|---|---|
| `totalCompanies` | integer | Total distinct client companies |
| `totalPolicies` | integer | Total policies (all statuses) |
| `activePolicies` | integer | Policies where `policy_to >= CURRENT_DATE` (Active or Renewal Due) |
| `inactivePolicies` | integer | Policies where `policy_to < CURRENT_DATE` (Expired) |
| `totalLives` | bigint | Sum of distinct enrolled lives across all policies |
| `totalPremium` | numeric | Sum of `net_premium` across all policies (₹) |

### 5.4 SQL

```sql
WITH leaf_companies AS (
  -- Exclude group parent companies; they are section headers, not counted as client companies
  SELECT id FROM company
  WHERE deleted_at IS NULL
    AND id NOT IN (SELECT DISTINCT group_company_id FROM group_company_map)
)
SELECT
  COUNT(DISTINCT c.id)::int                                                          AS "totalCompanies",
  COUNT(DISTINCT p.id)::int                                                         AS "totalPolicies",
  COUNT(DISTINCT p.id) FILTER (WHERE p.policy_to >= CURRENT_DATE)::int              AS "activePolicies",
  COUNT(DISTINCT p.id) FILTER (WHERE p.policy_to < CURRENT_DATE)::int               AS "inactivePolicies",
  COALESCE(SUM(lives.life_count), 0)::bigint                                        AS "totalLives",
  COALESCE(SUM(p.net_premium), 0)::numeric                                          AS "totalPremium"
FROM leaf_companies lc
JOIN company c ON c.id = lc.id
LEFT JOIN policy p ON p.company_id = c.id
LEFT JOIN (
  SELECT
    policy_id,
    COUNT(DISTINCT employee_id) AS life_count
  FROM policy_enrollment_employee_policy_map
  WHERE deleted_at IS NULL
  GROUP BY policy_id
) lives ON lives.policy_id = p.id
```

---

## 6. Reports 2 & 3 — `portfolio_group_companies` / `portfolio_individual_companies`

### 6.1 Purpose

Two separate paginated reports replace the old `portfolio_companies` report:

- **`portfolio_group_companies`** — returns GROUP_MEMBER companies only, 20 per page. The frontend groups rows by `groupId` to build the Group Clients accordion headers.
- **`portfolio_individual_companies`** — returns INDIVIDUAL companies only, 20 per page.

Pagination is handled by the framework via `page` / `limit` in the URL query string; the framework applies `OFFSET` / `LIMIT` automatically. The frontend accumulates pages (load page 1, append page 2, etc.) using `useApiMutation`.

### 6.2 Parameters

| Placeholder | Type | Required | Source |
|---|---|---|---|
| `###companyId###` | integer | Yes | JWT companyId (broker org) |

Pagination query params (URL, not body):

| Query param | Value |
|---|---|
| `page` | Current page number (1-based) |
| `limit` | `20` |

### 6.3 Response Fields (both reports)

| API field | Type | Description |
|---|---|---|
| `companyId` | integer | Client company database ID |
| `companyName` | text | Client company display name |
| `industry` | text | Business sector |
| `city` | text | City |
| `state` | text | State |
| `employeeCount` | integer | Enrolled employee count |
| `rmName` | text | Relationship manager display name; null if unassigned |
| `groupId` | integer | Parent group ID (`portfolio_group_companies` only; always null in individual report) |
| `groupName` | text | Parent group display name (`portfolio_group_companies` only) |
| `groupSector` | text | Parent group industry sector (`portfolio_group_companies` only) |
| `companyRole` | text | `GROUP_MEMBER` or `INDIVIDUAL` — discriminator |
| `policyCount` | integer | Total number of policies for this company |
| `activePolicyCount` | integer | Policies where `policy_to >= CURRENT_DATE` — used for Active/Inactive filter without loading policies |
| `inactivePolicyCount` | integer | Policies where `policy_to < CURRENT_DATE` — used for Active/Inactive filter without loading policies |

> **Status filter note:** The Active/Inactive KPI chip filter operates on `activePolicyCount` / `inactivePolicyCount` from the company rows. Policies do not need to be loaded for filtering to work.
>
> **Note:** `groupLogo` (initials) and `groupLogoColor` (hex) are **not** returned by the API. They are derived client-side from `groupName` (initials) and `groupId` (deterministic colour from a preset palette).

### 6.4 SQL — `portfolio_group_companies`

Returns GROUP_MEMBER companies only. Group parent companies are excluded — the frontend reconstructs group headers from `groupId`/`groupName` on member rows.

```sql
SELECT
  c.id                                                AS "companyId",
  COALESCE(c.display_name, c.company_name)           AS "companyName",
  ind.lookup_value                                    AS "industry",
  city.name                                           AS "city",
  state.name                                          AS "state",
  COALESCE(c.no_of_employees, 0)::int               AS "employeeCount",
  CASE WHEN u.first_name IS NOT NULL
    THEN u.first_name || ' ' || u.last_name
    ELSE NULL END                                     AS "rmName",
  gcm.group_company_id                               AS "groupId",
  COALESCE(gc.display_name, gc.company_name)         AS "groupName",
  grp_ind.lookup_value                               AS "groupSector",
  'GROUP_MEMBER'                                     AS "companyRole",
  COALESCE(pol.policy_count, 0)::int                AS "policyCount",
  COALESCE(pol.active_policy_count, 0)::int         AS "activePolicyCount",
  COALESCE(pol.inactive_policy_count, 0)::int       AS "inactivePolicyCount"
FROM company c
INNER JOIN group_company_map gcm ON gcm.company_id = c.id
INNER JOIN company gc ON gc.id = gcm.group_company_id AND gc.deleted_at IS NULL
LEFT JOIN lookup_data ind ON ind.id = c.industry_segment_lid AND ind.deleted_at IS NULL
LEFT JOIN lookup_data grp_ind ON grp_ind.id = gc.industry_segment_lid AND grp_ind.deleted_at IS NULL
LEFT JOIN "user" u ON u.user_id = c.account_manager
LEFT JOIN company_address ca ON ca.company_id = c.id AND ca.is_primary = true
LEFT JOIN address addr ON addr.id = ca.address_id
LEFT JOIN city ON city.id = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT
    company_id,
    COUNT(*)                                         AS policy_count,
    COUNT(*) FILTER (WHERE policy_to >= CURRENT_DATE) AS active_policy_count,
    COUNT(*) FILTER (WHERE policy_to < CURRENT_DATE)  AS inactive_policy_count
  FROM policy
  GROUP BY company_id
) pol ON pol.company_id = c.id
WHERE c.deleted_at IS NULL
ORDER BY "groupId", "companyName"
```

### 6.5 SQL — `portfolio_individual_companies`

Returns INDIVIDUAL companies only (not in `group_company_map` as parent or member).

```sql
SELECT
  c.id                                                AS "companyId",
  COALESCE(c.display_name, c.company_name)           AS "companyName",
  ind.lookup_value                                    AS "industry",
  city.name                                           AS "city",
  state.name                                          AS "state",
  COALESCE(c.no_of_employees, 0)::int               AS "employeeCount",
  CASE WHEN u.first_name IS NOT NULL
    THEN u.first_name || ' ' || u.last_name
    ELSE NULL END                                     AS "rmName",
  NULL::int                                          AS "groupId",
  NULL::text                                         AS "groupName",
  NULL::text                                         AS "groupSector",
  'INDIVIDUAL'                                       AS "companyRole",
  COALESCE(pol.policy_count, 0)::int                AS "policyCount",
  COALESCE(pol.active_policy_count, 0)::int         AS "activePolicyCount",
  COALESCE(pol.inactive_policy_count, 0)::int       AS "inactivePolicyCount"
FROM company c
LEFT JOIN lookup_data ind ON ind.id = c.industry_segment_lid AND ind.deleted_at IS NULL
LEFT JOIN "user" u ON u.user_id = c.account_manager
LEFT JOIN company_address ca ON ca.company_id = c.id AND ca.is_primary = true
LEFT JOIN address addr ON addr.id = ca.address_id
LEFT JOIN city ON city.id = addr.city_id
LEFT JOIN state ON state.id = addr.state_id
LEFT JOIN (
  SELECT
    company_id,
    COUNT(*)                                         AS policy_count,
    COUNT(*) FILTER (WHERE policy_to >= CURRENT_DATE) AS active_policy_count,
    COUNT(*) FILTER (WHERE policy_to < CURRENT_DATE)  AS inactive_policy_count
  FROM policy
  GROUP BY company_id
) pol ON pol.company_id = c.id
WHERE c.deleted_at IS NULL
  AND c.id NOT IN (SELECT DISTINCT group_company_id FROM group_company_map)
  AND c.id NOT IN (SELECT DISTINCT company_id FROM group_company_map)
ORDER BY "companyName"
```

---

## 7. Report 4 — `portfolio_company_policies`

### 7.1 Purpose

Returns one row per policy for a **single** company. Called on-demand when the user expands a company row. Results are cached client-side in `policyCache: Map<number, PolicyItem[]>` keyed by `companyId` so that re-expanding a row does not re-fetch.

### 7.2 Parameters

| Placeholder | Type | Required | Source |
|---|---|---|---|
| `###companyId###` | integer | Yes | JWT companyId (broker org) — scopes the query to policies the broker manages |
| `###targetCompanyId###` | integer | Yes | The specific company whose policies are being loaded (passed as the expanded company's ID) |

> **Naming note:** The body placeholder for the target company is `###targetCompanyId###` (or whichever placeholder name is registered in `admin_reports_parameters` for this report). The broker-scoping `###companyId###` remains required.

### 7.3 Response Fields

| API field | Type | Description |
|---|---|---|
| `policyId` | integer | Policy database ID — used for policy-summary navigation |
| `companyId` | integer | FK to client company — join key for frontend |
| `policyTypeCode` | text | Short code: GMC / GTL / GPA / GPC |
| `policyTypeName` | text | Full name: e.g., "Group Medical Cover" |
| `insurerName` | text | Insurer display name; null if not linked |
| `policyNumber` | text | Insurer-assigned policy number; null if not set |
| `premiumAmount` | numeric | Annual premium in ₹; null if not set |
| `startDate` | text | Policy start date formatted DD/MM/YYYY |
| `endDate` | text | Policy end/renewal date formatted DD/MM/YYYY; null if not set |
| `policyStatus` | text | Display status derived from `policy_to` date: `Active` / `Renewal Due` / `Expired` |

### 7.4 SQL

```sql
WITH policy_insurer AS (
  -- Lead insurer per policy: highest share_percentage wins; tie-breaks by id
  SELECT DISTINCT ON (pim.policy_id)
    pim.policy_id,
    i.display_name AS insurer_name
  FROM policy_insurer_map pim
  INNER JOIN insurer i ON i.id = pim.insurer_id
  ORDER BY pim.policy_id, pim.share_percentage DESC NULLS LAST, pim.id
)
SELECT
  p.id                                                    AS "policyId",
  p.company_id                                            AS "companyId",
  ld.lookup_key                                           AS "policyTypeCode",
  ld.lookup_value                                         AS "policyTypeName",
  pi.insurer_name                                         AS "insurerName",
  p.insurer_policy_number                                 AS "policyNumber",
  p.net_premium                                           AS "premiumAmount",
  TO_CHAR(p.policy_from, 'DD/MM/YYYY')                   AS "startDate",
  TO_CHAR(p.policy_to,   'DD/MM/YYYY')                   AS "endDate",
  CASE
    WHEN p.policy_to < CURRENT_DATE                       THEN 'Expired'
    WHEN p.policy_to <= CURRENT_DATE + INTERVAL '60 days' THEN 'Renewal Due'
    ELSE 'Active'
  END                                                     AS "policyStatus"
FROM policy p
LEFT JOIN lookup_data ld
  ON ld.id = p.policy_type_lid
  AND ld.deleted_at IS NULL
LEFT JOIN policy_insurer pi ON pi.policy_id = p.id
WHERE p.company_id = ###targetCompanyId###
-- policy table has no deleted_at column
ORDER BY p.policy_from DESC
```

> **Policy columns confirmed:** `policy_from` (start), `policy_to` (end/renewal), `insurer_policy_number` (policy no.), `net_premium` (premium). No plain text `status` column exists — status is date-derived. Insurer is joined via `policy_insurer_map` → `insurer.display_name`, not a direct FK on `policy`.

---

## 8. Frontend Integration

### 8.1 Endpoint Registration

No new endpoint constant is required. The existing `generateHRReports` constant in `apps/ui/ui-lib/src/lib/constants/endPoints.ts` already covers portfolio:

```ts
generateHRReports: environment.ibpUrl + `/hr-module/generate/`,
```

All `useHRReport` calls build their URL as `endPoints.generateHRReports + reportKey`.

### 8.2 `companyId` Source

```ts
import { getCompanyId } from '../../utils/companyConfig';
const companyId = useMemo(() => getCompanyId(), []);
```

`getCompanyId()` reads from `sessionStorage` (`company_id` key first, falls back to `company_config`).

### 8.3 API Call Patterns

**KPI summary** — `useHRReport` (single row, no pagination needed):

```ts
const params = useMemo(() => ({ companyId: String(companyId ?? '') }), [companyId]);
const queryParams = useMemo(() => ({ page: 1, limit: 0 }), []);

const { data: kpiRaw, isLoading: kpiLoading, isError: kpiError, refetch: refetchKpi } =
  useHRReport<KpiRow>('portfolio_kpi_summary', params, !!companyId, queryParams);
```

**Group and individual companies** — `useApiMutation` to support the accumulation pattern (load page 1, append page 2, etc.). `useHRReport` is NOT used for these because it replaces state on each call rather than appending:

```ts
const [groupCompanies, setGroupCompanies] = useState<CompanyApiRow[]>([]);
const [groupPage, setGroupPage] = useState(1);
const [groupHasMore, setGroupHasMore] = useState(true);

const { mutate: fetchGroupPage, isLoading: groupLoading } = useApiMutation(
  (page: number) =>
    apiRequest('POST', `${endPoints.generateHRReports}portfolio_group_companies?page=${page}&limit=20`,
      { companyId }),
  {
    onSuccess: (res) => {
      const rows: CompanyApiRow[] = res.data.rows ?? [];
      setGroupCompanies(prev => [...prev, ...rows]);
      if (rows.length < 20) setGroupHasMore(false);
    },
  }
);

// IntersectionObserver sentinel at bottom of Group Clients section triggers:
//   setGroupPage(p => p + 1) → useEffect calls fetchGroupPage(groupPage)
```

Same pattern applies for `portfolio_individual_companies` with a separate accumulator.

**Company policies** — `apiRequest` directly, cached in a `Map`:

```ts
const policyCache = useRef<Map<number, PolicyItem[]>>(new Map());

const loadPolicies = async (targetCompanyId: number) => {
  if (policyCache.current.has(targetCompanyId)) return; // already loaded
  const res = await apiRequest('POST',
    `${endPoints.generateHRReports}portfolio_company_policies?page=1&limit=0`,
    { companyId, targetCompanyId });
  policyCache.current.set(targetCompanyId, res.data.rows ?? []);
};

// Called when a company row is expanded
```

### 8.4 Client-Side Data Assembly

```ts
// KPI: single row
const kpi = kpiRaw[0] ?? null;

// Companies: accumulated from paginated calls
// groupCompanies state → group by groupId to build GroupItem[]
// individualCompanies state → build CompanyItem[]

// Policies: retrieved on demand from policyCache ref
const getPolicies = (companyId: number): PolicyItem[] =>
  policyCache.current.get(companyId) ?? [];
```

**Status filter:** operates on `activePolicyCount` / `inactivePolicyCount` fields on company rows — does not require policies to be loaded. A company passes the Active filter if `activePolicyCount > 0`; passes the Inactive filter if `inactivePolicyCount > 0`.

### 8.5 Navigation from Portfolio

| User action | Frontend navigation |
|---|---|
| Click company name | `navigate(\`/hr-portal/dashboard?companyId=${company.companyId}\`)` |
| Click policy row | `navigate(\`/hr-portal/policy-summary/${policy.policyId}\`)` |

> **Bug fixed:** The navigation now uses `policy.policyId` (integer from API) not `policy.type.toLowerCase()`. Company navigation now passes `?companyId=` query param.

### 8.6 Mock Data Cleanup

The `data.ts` file (`apps/ui/ibp/src/app/pages/HRPortalPortfolio/data.ts`) is no longer imported. Delete it (see TASK-PF-004).

---

## 9. Error Handling Contracts

| Scenario | HTTP code | Frontend behaviour |
|---|---|---|
| JWT missing or expired | 401 | Redirect to login page |
| Role not `HR_ADMIN` | 403 | Show access-denied screen |
| Unknown report key | 400 | Per-section error state with retry |
| DB query error (report service) | 500 | Per-section error state with retry |
| Network timeout | — | Per-section error state with retry (after 10 s timeout) |
| Empty result set | 201 (success) with empty `rows` | Render appropriate empty state per section |

Reports are fetched independently: `portfolio_kpi_summary` on mount, `portfolio_group_companies` and `portfolio_individual_companies` on mount + scroll, `portfolio_company_policies` on expand. If one fails, the others continue to render. Each section is independently error-recoverable — the retry action re-fires only the failing report call.

---

## 10. Remaining Verification Queries

Most of the schema is confirmed from entity files. Run only these two queries before seeding:

```sql
-- 1. Confirm lookup_key values for policy types
SELECT id, lookup_key, lookup_value FROM lookup_data
WHERE lookup_key LIKE '%GMC%'
   OR lookup_key LIKE '%GTL%'
   OR lookup_key LIKE '%GPA%'
   OR lookup_key LIKE '%GPC%'
   OR lookup_key LIKE 'POLICY_TYPE_%'
LIMIT 20;

-- 2. Confirm policy.status values in use
SELECT DISTINCT status FROM policy LIMIT 20;
```

---

## 11. Security

| Control | Value |
|---|---|
| Auth guard | `JwtAuthGuard` — 401 for missing or invalid JWT |
| Role guard | `RolesGuard` with `HR_ADMIN` — 403 for wrong role |
| Company scoping | `###companyId###` is substituted server-side from the validated JWT; the client-supplied request body `companyId` is used only for SQL placeholder substitution and must be cross-validated against the JWT claim |
| SQL injection | The framework performs placeholder substitution, not raw string concatenation. Integer placeholders (`###companyId###`) are substituted as bare integers — no quotes. Text placeholders should never be user-supplied in these three reports. |
| Unknown report key | Returns 400 (not 404) — the key fails at SQL metadata lookup time |

---

## 10. Seed Script Location

The SQL seed script for portfolio report keys is at:

```
apps/services/ibp-service/src/app/hr-module/hr-module-portfolio-scripts.sql
```

This file follows the same structure as `hr-module-cd-scripts.sql` — idempotent inserts with sequence resets and result mapping definitions. It must be applied to all environments (dev, staging, production) after schema verification.

The script must include all **6** portfolio report keys:

| Report key | Status |
|---|---|
| `portfolio_kpi_summary` | Original — seed as before |
| `portfolio_companies` | Superseded — UPDATE query to be run (see TASK-PF-005); kept in DB for backward compatibility until new reports are seeded |
| `portfolio_policies` | Superseded — UPDATE query to be run (see TASK-PF-005); kept in DB for backward compatibility |
| `portfolio_group_companies` | New — must be seeded (TASK-PF-006) |
| `portfolio_individual_companies` | New — must be seeded (TASK-PF-006) |
| `portfolio_company_policies` | New — must be seeded (TASK-PF-006) |

---

## 11. Files Affected

| File | Change |
|---|---|
| `apps/ui/ibp/src/app/pages/HRPortalPortfolio/index.tsx` | Replace mock data imports with API state; fix policy-row navigation to use `policyId`; add loading/error states |
| `apps/ui/ibp/src/app/pages/HRPortalPortfolio/data.ts` | Delete after API wiring is complete |
| `apps/ui/ui-lib/src/lib/constants/endPoints.ts` | Add `portfolioGenerateReport` endpoint builder |
| `apps/services/ibp-service/src/app/hr-module/hr-module-portfolio-scripts.sql` | **New file** — seed script for 3 portfolio reports |

---

## 12. QA Checklist

- [ ] KPI cards display correct totals from live API
- [ ] `totalLives` formatted correctly (L / K suffixes)
- [ ] `totalPremium` formatted in ₹ Cr
- [ ] Group Clients section renders correct groups from live data
- [ ] Expanding a group shows correct member companies
- [ ] Expanding a company shows correct policy table
- [ ] Policy type codes and names render correctly (GMC, GTL, GPA, GPC)
- [ ] Policy status badges render correctly (Active, Renewal Due, Expired)
- [ ] Policy premium and validity show "—" when null
- [ ] RM name shows "Unassigned" when null
- [ ] Company name click navigates to Dashboard with correct `companyId`
- [ ] Policy row click navigates to `/hr-portal/policy-summary/{actualPolicyId}` (not type string)
- [ ] Active policy filter hides companies with no active policies
- [ ] Inactive policy filter hides companies with no inactive/expired policies
- [ ] Clearing filter restores full list
- [ ] Individual Clients section renders separately from Group Clients
- [ ] Empty state shown when filter yields no results
- [ ] 401 returned for unauthenticated requests
- [ ] 403 returned for non-HR_ADMIN role requests
- [ ] All mock data removed from production build

---

# END OF TRD
