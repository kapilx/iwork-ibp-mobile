# HR Portal – Enrolment Status Page – Technical Requirement Document (TRD)

**Document Version:** 1.0
**Date:** 2026-07-08
**Author:** IIRM Engineering Team
**Jira Reference:** IIRM-ENROLMENT-STATUS
**PRD Reference:** `docs/implementation/ibp-service/enrollment-status/hr-portal-enrollment-status-PRD.md`
**Framework Reference:** `docs/implementation/ibp-service/hr-module-report-framework-tech-spec.md`

> **Dependency Note (Framework Spec §9):** This TRD follows the mandatory module-level format defined in `hr-module-report-framework-tech-spec.md §9`. Any update to the framework spec must be reflected here immediately.

---

## 1. Architecture Overview

The Enrolment Status page is routed at `/hr-portal/enrollment-status`. It uses
the same HR Report Framework as every other HR Portal screen for its main
data load — via `POST /hr-module/generate/:report` — plus one framework-external
REST endpoint for the "Send Reminder" action, which is a write/side-effect
operation and therefore does not go through the read-only report framework.

| Report / endpoint | Purpose | Widget type | When called |
|---|---|---|---|
| `policy_enrollment_period_status_summary` | Every current/future enrolment period + per-policy Total/Enrolled/In Progress/Not Enrolled counts | Flat table, grouped client-side by period | On mount + on company switch |
| `POST /onboarding/enrollment-reminder` | Sends an immediate reminder email to not-yet-enrolled employees on one policy | Action (no data returned to render) | On "Send Reminder" click |

> **Single-report design note:** unlike the Portfolio page (4 report keys), this
> screen intentionally uses **one** report key. There is no drill-down/expand-to-fetch
> step — the full period × policy matrix for the company is small enough to load
> in one call (`limit=0`, no pagination), and the accordion UI is purely a
> client-side grouping/collapse of that one result set.

### 1.1 Route and Entry Point

| Property | Value |
|---|---|
| Frontend route | `/hr-portal/enrollment-status` |
| Component | `apps/ui/ibp/src/app/pages/HRPortalEnrollment/index.tsx` |
| Auth | `JwtAuthGuard` (401 if no valid JWT) + role gate at the HR Portal shell/sidebar level (`PORTAL_CRM` / `EXTERNAL_HR`) |
| `companyId` scope | `portfolioCompanyId` passed down from the HR Portal shell (the company selected in the top switcher); falls back to `getCompanyId()` if not supplied |
| Entry | Left sidebar → "Enrolment" (`id: "enrollment-status"`, icon `ClipboardCheck`) |

> **Route naming note:** the path is deliberately `enrollment-status`, not
> `enrollment` — `/hr-portal/enrollment` is already used by the pre-existing
> `HRPortalEnrolmentV2` endorsement-management feature. Reusing that path
> caused a route collision during development; renaming this feature's route
> was the fix.

### 1.2 Framework API Contracts

| Operation | Method | Path | Success |
|---|---|---|---|
| Generate / fetch report | POST | `/hr-module/generate/:report` | 201 |

**Generate — success response (201):**
```json
{
  "statusCode": 201,
  "message": "Report generated successfully.",
  "data": {
    "data": [ /* array of StatusRow objects, one per (period, policy) pair */ ],
    "count": 12
  }
}
```

> **Frontend binding rule:** this screen's `useHRReport` hook reads
> `data.data` (not `data.rows` — see `useHRReport.ts` doc-comment: the
> envelope for this hook is `{ data: { data: T[], count?: number } }`).
> `limit=0` is passed as a query param to disable the framework's default
> 10-row page cap, since this is a small, ungrouped result set that the
> frontend groups itself.

### 1.3 Common Request Body Fields

| Placeholder | Type | Required | Description |
|---|---|---|---|
| `###companyId###` | integer | Yes | Company currently selected in the HR Portal switcher — scopes every period/policy/employee in the result to this company |

---

## 2. Screen-to-Report-Key Mapping

| Screen section | Report key / endpoint | Widget type | Reads from | Call pattern |
|---|---|---|---|---|
| Period cards + per-policy counts table | `policy_enrollment_period_status_summary` | Flat table (client-groups by `periodStart`+`periodEnd`) | `data.data` | `useHRReport` on mount + on `companyId` change |
| "Send Reminder" action | `POST /onboarding/enrollment-reminder` | N/A (fire-and-forget action) | HTTP status / success flag | `apiRequest` on button click |

There is no filter/search interaction on this screen (§7 confirms this
explicitly, per Framework §9.2 item 7), no row-expand-to-fetch (policies are
already present in the single report response), and no tab switching.

---

## 3. Schema Notes (Verified from Entity Definitions / Migration SQL)

All table and column names below are confirmed from
`database-migrations/sql/policy_enrollment_period_status_summary_setup.sql`
and the entity files referenced in prior sessions' verification work.

| Table | Key columns used | Notes |
|---|---|---|
| `document_processing_file` (`dpf`) | `id`, `document_id`, `endorsement_id`, `enrollment_start_date`, `enrollment_end_date` | Source of enrolment periods. **`document_id` is the FK that matches `policy_enrollment_employee_policy_map.enrollment_addition_batch_id`** — `dpf.id` is only the period's own display/dropdown identifier and must never be used for the employee-matching join. |
| `endorsement` (`e`) | `id`, `policy_id`, `company_id` | Bridges `document_processing_file` to a policy and company — `dpf.endorsement_id = e.id`. No `deleted_at` column referenced in this query. |
| `policy_enrollment_employee_policy_map` (`pepm`) | `policy_id`, `employee_id`, `enrollment_addition_batch_id`, `deleted_at` | Maps an employee to a policy for a specific enrolment batch. `deleted_at IS NULL` enforced. |
| `policy_enrollment_employee` (`pee`) | `id`, `deleted_at`, `user_status_key` | Employee master row. `deleted_at IS NULL AND user_status_key = 'USER_STATUS_ACTIVE'` enforced — terminated/deleted employees are excluded from every bucket. |
| `policy_employee_enrollment` (`pe`) | `employee_id`, `policy_id`, `employee_enrollment_status_key`, `deleted_at` | Holds the actual enrolment status per employee+policy. Left-joined — an employee with no row here counts as Not Enrolled (`COALESCE(..., 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED')`). `deleted_at IS NULL` enforced. |
| `policy` (`p`) | `id`, `policy_name`, `insurer_policy_number` | Policy master, for display name/number. No `deleted_at` filter needed for this query's purposes (left-joined for display fields only). |

### 3.1 Status Value Reference

| `employee_enrollment_status_key` value | Bucket |
|---|---|
| `EMPLOYEE_ENROLLMENT_STATUS_ENROLLED` | Enrolled |
| `EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS` | In Progress |
| `EMPLOYEE_ENROLLMENT_STATUS_ENDORSEMENT_SENT` | In Progress |
| `EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED` (or no row) | Not Enrolled |

### 3.2 Plain vs Encrypted Field Rule (Framework §9.5)

This report does not select any PII field (`email`, `phone_number`,
`date_of_birth`) — it returns only counts and policy/period identifiers. No
plain-vs-encrypted column decision applies to this report.

---

## 4. `admin_reports` Insert/Upsert Plan

Seed script location: `database-migrations/sql/policy_enrollment_period_status_summary_setup.sql`

Unlike the plain-`INSERT` pattern used by the CD/Portfolio modules, this
script uses a **drop-and-recreate** pattern: it first deletes any existing
`admin_reports` row named `policy_enrollment_period_status_summary` (and its
child `admin_reports_parameters` / `admin_reports_results_mappings` rows),
then always inserts fresh. This was a deliberate choice made while the report
was still under active iteration, to keep the script safely re-runnable
without manual cleanup between iterations.

```sql
DO $$
DECLARE
    v_old_report_id INTEGER;
BEGIN
    FOR v_old_report_id IN
        SELECT id FROM admin_reports WHERE name = 'policy_enrollment_period_status_summary'
    LOOP
        DELETE FROM admin_reports_results_mappings WHERE admin_report_id = v_old_report_id;
        DELETE FROM admin_reports_parameters WHERE admin_report_id = v_old_report_id;
        DELETE FROM admin_reports WHERE id = v_old_report_id;
    END LOOP;
END $$;
```

`admin_reports` insert columns: `name`, `label`, `end_point`, `query`,
`created_by`, `updated_by`, `order_no` (`order_no = 33`).

---

## 5. Report — `policy_enrollment_period_status_summary`

### 5.1 Purpose

Returns one row per (enrolment period, policy) pair for the given company,
restricted to current/future periods, with Total/Enrolled/In Progress/Not
Enrolled counts for that specific period's employee batch.

### 5.2 `admin_reports_parameters`

| `parameter_name` | `label` | `query_parameter` | `data_type` | `input_field_type` | `option_type` | `order_no` |
|---|---|---|---|---|---|---|
| `companyId` | Company | `###companyId###` | `number` | `hidden` | `none` | 1 |

### 5.3 `admin_reports_results_mappings`

| `query_parameter_name` | `variable_name` | `label` | `data_type` | `alignment` |
|---|---|---|---|---|
| `periodId` | `periodId` | Period ID | `number` | `right` |
| `periodStart` | `periodStart` | Period Start | `date` | `left` |
| `periodEnd` | `periodEnd` | Period End | `date` | `left` |
| `policyId` | `policyId` | Policy ID | `number` | `right` |
| `policyName` | `policyName` | Policy Name | `string` | `left` |
| `policyNumber` | `policyNumber` | Policy Number | `string` | `left` |
| `total` | `total` | Total | `number` | `right` |
| `enrolled` | `enrolled` | Enrolled | `number` | `right` |
| `inProgress` | `inProgress` | In Progress | `number` | `right` |
| `notEnrolled` | `notEnrolled` | Not Enrolled | `number` | `right` |

### 5.4 Response Fields

| API field | Type | Description |
|---|---|---|
| `periodId` | integer | `document_processing_file.id` — the period's display identifier |
| `periodStart` | string (`YYYY-MM-DD`) | Enrolment window start date |
| `periodEnd` | string (`YYYY-MM-DD`) | Enrolment window end date |
| `policyId` | integer | Policy database ID — used for policy-summary navigation |
| `policyName` | string | Policy display name |
| `policyNumber` | string \| null | Insurer-assigned policy number; frontend falls back to `POL-<policyId>` when null |
| `total` | integer | All active, non-deleted employees mapped to this policy for this period's batch |
| `enrolled` | integer | Subset of `total` with status Enrolled |
| `inProgress` | integer | Subset of `total` with status In Progress or Endorsement Sent |
| `notEnrolled` | integer | Subset of `total` with no status row, or explicit Not Started |

### 5.5 SQL

```sql
WITH period_scope AS (
  SELECT DISTINCT
    dpf.id                       AS period_id,
    dpf.document_id              AS batch_document_id,
    dpf.enrollment_start_date,
    dpf.enrollment_end_date,
    e.policy_id,
    e.company_id
  FROM document_processing_file dpf
  INNER JOIN endorsement e ON e.id = dpf.endorsement_id
  WHERE e.company_id = ###companyId###
    AND dpf.enrollment_start_date IS NOT NULL
    AND dpf.enrollment_end_date IS NOT NULL
    -- Current + future only — a period whose end date has already passed is
    -- closed, so it's excluded (nothing left to enroll/remind for).
    AND dpf.enrollment_end_date >= CURRENT_DATE
),
period_employees AS (
  SELECT
    ps.period_id,
    ps.policy_id,
    pee.id                             AS employee_id,
    pe.employee_enrollment_status_key
  FROM period_scope ps
  INNER JOIN policy_enrollment_employee_policy_map pepm
    ON pepm.policy_id = ps.policy_id
   AND pepm.enrollment_addition_batch_id = ps.batch_document_id
   AND pepm.deleted_at IS NULL
  INNER JOIN policy_enrollment_employee pee
    ON pee.id = pepm.employee_id
   AND pee.deleted_at IS NULL
   AND pee.user_status_key = 'USER_STATUS_ACTIVE'
  LEFT JOIN policy_employee_enrollment pe
    ON pe.employee_id = pee.id
   AND pe.policy_id = ps.policy_id
   AND pe.deleted_at IS NULL
)
SELECT
  ps.period_id                                                                             AS "periodId",
  TO_CHAR(ps.enrollment_start_date, 'YYYY-MM-DD')                                          AS "periodStart",
  TO_CHAR(ps.enrollment_end_date, 'YYYY-MM-DD')                                             AS "periodEnd",
  p.id                                                                                      AS "policyId",
  p.policy_name                                                                             AS "policyName",
  p.insurer_policy_number                                                                   AS "policyNumber",
  COUNT(DISTINCT pe2.employee_id)                                                           AS "total",
  COUNT(DISTINCT pe2.employee_id) FILTER (
    WHERE pe2.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
  )                                                                                          AS "enrolled",
  COUNT(DISTINCT pe2.employee_id) FILTER (
    WHERE pe2.employee_enrollment_status_key IN (
      'EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS', 'EMPLOYEE_ENROLLMENT_STATUS_ENDORSEMENT_SENT'
    )
  )                                                                                          AS "inProgress",
  COUNT(DISTINCT pe2.employee_id) FILTER (
    WHERE COALESCE(pe2.employee_enrollment_status_key, 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED')
        = 'EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED'
  )                                                                                          AS "notEnrolled"
FROM period_employees pe2
INNER JOIN period_scope ps ON ps.period_id = pe2.period_id AND ps.policy_id = pe2.policy_id
LEFT JOIN policy p ON p.id = pe2.policy_id
GROUP BY ps.period_id, ps.enrollment_start_date, ps.enrollment_end_date, p.id, p.policy_name, p.insurer_policy_number
ORDER BY ps.enrollment_start_date DESC, p.policy_name
```

**Pagination:** none applied server-side for this report — the frontend
always calls with `limit=0`, and the framework returns every row. This is
safe because the row count is bounded by (open periods × policies per
company), not by employee count.

**`deleted_at IS NULL` confirmation (Framework §9.3.7):** enforced on
`policy_enrollment_employee_policy_map`, `policy_enrollment_employee`, and
`policy_employee_enrollment` — the three soft-deletable tables touched by
this query. `endorsement` and `policy` are not filtered on `deleted_at` (no
such column is used by this query for those tables).

**Indexing note (Framework §8, Performance):** the `WHERE` clause filters on
`endorsement.company_id`, `document_processing_file.enrollment_end_date`, and
the join keys `dpf.document_id` / `pepm.enrollment_addition_batch_id` /
`pepm.policy_id`. Confirm these columns are indexed before this report goes
to a company with a large employee base.

---

## 6. Reminder Action — `POST /onboarding/enrollment-reminder`

This is **not** a report-framework endpoint — it's a standard NestJS REST
route that triggers a side effect (sending emails), documented here because
it's part of this screen's required backend integration.

### 6.1 Endpoint

| Property | Value |
|---|---|
| Method / Path | `POST /onboarding/enrollment-reminder` |
| Controller | `OnboardingController` (`apps/services/ibp-service/src/app/onboarding/onboarding.controller.ts`) |
| Endpoint constant | `endPoints.sendReminderEmail` |
| Body DTO | `SendEnrollmentReminderDto` |

### 6.2 Request Body (as sent from this screen)

```json
{
  "policies": [<policyId>],
  "forceImmediate": true,
  "includeAllEmployees": true
}
```

### 6.3 Server-Side Flow

`SendEnrollmentReminderDto` → `processImmediateReminder(...)` →
`getPolicyEmployeesNotEnrolled(...)` → notification dispatch.

Recipients = every employee on the given policy whose enrolment status is
**not** `EMPLOYEE_ENROLLMENT_STATUS_ENROLLED` — i.e. both Not Enrolled and In
Progress employees, scoped to the whole policy (not the specific period row
the button was clicked from). This is the same mechanism used by the
scheduled `HANDLE_ENROLLMENT_REMINDER_NOTIFICATIONS` cron
(`end-user-onboarding.scheduler.ts`), invoked here on demand instead of on a
schedule.

---

## 7. Frontend Integration

### 7.1 Endpoint Registration

No new endpoint constant was required for the report call — it reuses the
existing framework constant:

```ts
generateHRReports: environment.ibpUrl + `/hr-module/generate/`,
```

The reminder action uses its own dedicated constant:

```ts
sendReminderEmail: environment.ibpUrl + `/onboarding/enrollment-reminder`,
```

### 7.2 `companyId` Source

```ts
export function HRPortalEnrollment({ companyId: companyIdProp }: { companyId?: number | null } = {}) {
  const companyId = (companyIdProp ?? getCompanyId() ?? null) as number | null;
  ...
}
```

`companyIdProp` is supplied by the HR Portal shell's route element
(`portfolioCompanyId`, tied to the top company switcher). `getCompanyId()`
(reads `sessionStorage`) is the fallback, matching the pattern used by
sibling pages such as `HRPortalComplaints`.

### 7.3 API Call Pattern — Report Load

```ts
const { data: statusRows, isLoading: statusLoading } = useHRReport<StatusRow>(
  "policy_enrollment_period_status_summary",
  { companyId: companyId ?? 0 },
  !!companyId,
  { limit: 0 },
);
```

`useHRReport` wraps `POST {generateHRReports}policy_enrollment_period_status_summary?limit=0`
behind React Query (`staleTime: 30_000`, `placeholderData` keep-previous so
switching company doesn't flash an empty state mid-refetch).

### 7.4 API Call Pattern — Send Reminder

```ts
await apiRequest(endPoints.sendReminderEmail, {
  method: "POST",
  data: { policies: [row.policyId], forceImmediate: true, includeAllEmployees: true },
});
```

Guarded client-side by `reminderLoadingPolicyId != null || row.notEnrolled === 0`
(a single in-flight tracker, not a per-row map — only one reminder send can
be in progress across the whole page at a time).

### 7.5 Client-Side Data Assembly (Period Grouping)

The report returns flat (period, policy) rows; grouping into period cards
happens entirely client-side:

```ts
const periodGroups = useMemo(() => {
  const map = new Map<string, PeriodGroup>();   // key = `${periodStart}|${periodEnd}`
  for (const row of statusRows) {
    const key = `${row.periodStart}|${row.periodEnd}`;
    const existing = map.get(key);
    if (existing) existing.rows.push(row);
    else map.set(key, { periodStart: row.periodStart, periodEnd: row.periodEnd, rows: [row] });
  }
  return [...map.values()].sort((a, b) => b.periodStart.localeCompare(a.periodStart));
}, [statusRows]);
```

Grouping is done client-side (rather than trusting SQL row order) because two
periods could share a start date and interleave under the backend's
`ORDER BY (enrollment_start_date, policy_name)`.

### 7.6 Navigation

| User action | Frontend navigation |
|---|---|
| Click policy name | `navigate(\`/hr-portal/policy-summary/${row.policyId}?companyId=${companyId}\`, { state: { tab: "enrollment" } })` |

The destination page reads `location.state.tab` to default its internal tab
selector to "Enrolment" instead of its default "CD Balance" tab.

### 7.7 Routing / Nav Registration

- Route: `apps/ui/ibp/src/app/pages/HRPortal/index.tsx` —
  `<Route path="enrollment-status" element={<HRPortalEnrollment companyId={portfolioCompanyId} />} />`
- Sidebar: `apps/ui/ibp/src/app/components/HRPortalSidebar/index.tsx` —
  `{ id: "enrollment-status", label: "Enrolment", path: "/hr-portal/enrollment-status", Icon: ClipboardCheck }`

### 7.8 Shared Control Change

`PortalHeroHeader` (`apps/ui/ibp/src/app/pages/HRPortal/controls.tsx`) gained
an optional `showLastSynced` prop (default `true`, preserving all existing
pages' behaviour unchanged). This page passes `showLastSynced={false}`.

---

## 8. Filter, Search, and Reset Behaviour Contract (Framework §9.2 item 7)

This screen has **no filter, search, or reset controls** — an explicit
product decision (see PRD §9, Out of Scope). The only user-driven state that
changes what's on screen is:

| Interaction | Effect |
|---|---|
| Company switch (top switcher) | Re-fetches `policy_enrollment_period_status_summary` scoped to the new `companyId`; resets accordion expand state via full component prop change |
| Expand/Collapse All | Client-side only — toggles `expandedPeriods` Set; does not re-fetch |
| Individual period expand/collapse | Client-side only — no re-fetch |

There is no reset action because there is nothing to reset.

---

## 9. Export Contract (Framework §9.2 item 8)

**Not implemented.** This page has no export (CSV/Excel/PDF) capability in
v1 — see PRD §9, Out of Scope. If added later, it should follow the same
`POST /hr-module/download/:report` framework contract used by other modules,
using the same `policy_enrollment_period_status_summary` report key.

---

## 10. Error Handling Contracts

| Scenario | HTTP code | Frontend behaviour |
|---|---|---|
| JWT missing or expired | 401 | Redirect to login page (shell-level behaviour, not page-specific) |
| No `companyId` resolvable | — | Report call is disabled (`enabled: !!companyId`); page shows loading/empty state, no request fired |
| Unknown report key | 400 | Not expected in production (report key is hardcoded, not user-input) |
| DB query error (report service) | 500 | React Query surfaces `isError`; page currently falls through to the "no periods found" empty state rather than a distinct error state — acceptable for v1 given the low-stakes, read-only nature of this screen |
| Reminder send fails | 4xx/5xx | Error toast: "Failed to send reminder emails. Please try again." Button re-enables. |
| Reminder send succeeds | 200/201 | Success toast naming the `notEnrolled` count reminded |
| Empty result set | 201 (success) with empty `data` array | "No enrolment periods found for this company" empty state |

---

## 11. Security

| Control | Value |
|---|---|
| Auth guard | `JwtAuthGuard` — 401 for missing or invalid JWT |
| Role scoping | Enforced at the HR Portal shell/sidebar level (`PORTAL_CRM` / `EXTERNAL_HR`); no additional per-page role guard was added |
| Company scoping | `###companyId###` is supplied by the frontend from the shell's selected company context and substituted into the SQL; this report does not independently re-derive/validate `companyId` against the caller's JWT claim, consistent with how sibling HR report pages currently work |
| SQL injection | Framework performs placeholder substitution, not string concatenation; `###companyId###` is the only placeholder and is always integer-typed |
| Reminder endpoint authorization | Standard `JwtAuthGuard` on `OnboardingController`; no additional per-policy ownership check beyond the company scoping already implied by the HR admin's session |

---

## 12. Files Affected

| File | Change |
|---|---|
| `database-migrations/sql/policy_enrollment_period_status_summary_setup.sql` | **New file** — seed script for the report (drop-and-recreate pattern) |
| `apps/ui/ibp/src/app/pages/HRPortalEnrollment/index.tsx` | **New file** — page component |
| `apps/ui/ibp/src/app/pages/HRPortal/index.tsx` | Added `enrollment-status` route |
| `apps/ui/ibp/src/app/components/HRPortalSidebar/index.tsx` | Added "Enrolment" nav item |
| `apps/ui/ibp/src/app/pages/HRPortal/controls.tsx` | Added optional `showLastSynced` prop to `PortalHeroHeader` (default `true`) |
| `database-migrations/sql/policy_enrollment_status_summary_setup.sql` | Superseded by the period-grouped report above; left in place, not yet cleaned up |

---

## 13. QA Checklist

- [ ] Only current/future enrolment periods are shown (a period with `enrollment_end_date` in the past does not appear)
- [ ] Periods are sorted most-recent-start-date first
- [ ] Each period card shows the correct number of policies
- [ ] Total/Enrolled/In Progress/Not Enrolled counts sum correctly per policy row
- [ ] Only active, non-deleted employees are counted (verify against a company with terminated employees)
- [ ] An employee added under a *different* period's batch does not count toward this period's numbers
- [ ] Policy number falls back to `POL-<policyId>` when not set
- [ ] Expand/Collapse All toggles every period card correctly
- [ ] Individual period expand/collapse works independently
- [ ] Clicking a policy name navigates to `/hr-portal/policy-summary/{policyId}?companyId={companyId}` and lands on the Enrolment tab
- [ ] "Send Reminder" is disabled when `notEnrolled === 0`
- [ ] "Send Reminder" success toast shows the correct not-enrolled count
- [ ] "Send Reminder" failure shows an error toast and re-enables the button
- [ ] Switching company in the top switcher reloads data scoped to the new company
- [ ] Empty state shown when a company has no open enrolment periods
- [ ] 401 returned / redirect occurs for unauthenticated requests
- [ ] No search, filter, or export controls are present (confirms intentional scope)

---

# END OF TRD
