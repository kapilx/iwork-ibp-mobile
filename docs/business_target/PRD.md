# Business Targets — Product Requirements (PRD)

_Status: Draft · Owner: Karan · Last updated: 2026-08-18_

## 1. Problem

Business targets (`business_target` table, 3.5k rows) are populated **out of band**
today — there is no in-app way to create or edit them, and no way to see them as a
report. Leadership currently edits target rows directly in the database. We need:

1. An in-app **Add / Edit** screen for business targets.
2. A **Business Targets report** (SBU, Vertical, Team Member, Month, Target) with
   **filters** and **Excel download**, matching the existing Biz Done report UX.

This is **not greenfield**. The table, entity, and the dashboard read-path already
exist (`business_target.entity.ts`; dashboard aggregation in
`policy.repository.ts:11598`). We are adding the **write path** and a **report view**
on top of the existing schema — no schema change.

## 2. Goals

- Leadership/admin can create and edit target values without touching the DB.
- A filterable, downloadable report of targets by SBU / Vertical / Team Member / Month.
- Zero disruption to the existing dashboard read-path (same enum values, same keys).

## 3. Non-goals (explicitly out of scope)

- No approval workflow (set-and-live). _Defer until asked._
- No new schema columns / no migration. Targets stay **user + month** scoped.
- No bulk CSV upload of targets. _Defer._
- No changes to how the dashboard consumes targets.

## 4. Users & roles — PRIVILEGE-BASED (admin module)

The feature lives in the **admin module**, and access is **privilege-based**, not
role-hardcoded. Two privileges (category `BUSINESS_TARGET`, scope `iWork`):

- **`READ_001` / VIEW_BUSINESS_TARGET** — see the Business Targets report + download.
- **`WRITE_001` / MANAGE_BUSINESS_TARGET** — create / edit / delete targets.

Enforcement:
- **Backend**: the api-gateway `AclGuard` gates each endpoint by `(sub-path, method)`
  → privilege, seeded via `service-lib/scripts/business-target-acl.sql`. New sub-paths
  registered in the `subPaths` constant. No controller-level guard.
- **Frontend**: `PermissionGuard` on routes + `useHasPermission` on nav/buttons
  (`ui-lib/rbac/permissionMap.ts`).
- A request reaching the service is already authorized → the service operates
  **org-wide** (no hierarchy scoping); UI filters (SBU / Vertical / Team Member) narrow.
  _Org-level scoping (limit an admin to their own org) can be added if needed — see OQ-2._

## 5. The data model as it exists (context for product)

One target row = one `(user_id, month, entity_type, kpi, type_of_target)` combination
with a numeric `value_of_target`. Rows are **pre-seeded** per user × month × metric
(mostly `0.00`), so in practice "adding a target" is usually **editing** an existing
seeded row. Enum values are fixed in `libs/service-lib/src/lib/constants.ts`
(`BUSINESS_TARGET_ENTITY_TYPE`, `POLICY_PERFORMANCE_FIELDS`).

- `entity_type`: SO_POLICY, RO_POLICY, MINED_POLICY, TOTAL_POLICY, POLICY_PREMIUM,
  BROKERAGE_COLLECTED, …, TOTAL_REWARD
- `kpi`: BROKERAGE, AMOUNT, PREMIUM_COLLECTED, REWARD, …
- `type_of_target`: AMOUNT | PERCENTAGE

## 6. Features

### 6.1 Add / Edit Target screen
- Select **Team Member** (user within requester's scope), **Month**, **Entity Type**,
  **KPI**, **Type of Target** — all dropdowns driven from the fixed enums / scoped user
  list. Enter **Target value**.
- Save is an **upsert** on `(user_id, month, entity_type, kpi, type_of_target)`:
  edits the seeded row if present, else creates it.
- Edit mode pre-fills from an existing row id.
- Delete a target row (leadership only).

### 6.2 Business Targets report
- Columns: **SBU · Vertical · Team Member · Month · Target**.
- Filters (working, applied server-side): SBU, Vertical, Team Member, Month range /
  Financial Year, and metric selectors (Entity Type + KPI) that define what "Target"
  sums to. Filter bar mirrors Biz Done's `OrgFinancialFilter` + `FilterDrawer`.
- **Download**: Excel export via the existing async export-job tray (enqueue → poll →
  download), identical UX to Biz Done. An "Applied Filters" sheet is included.
- **Target** column = `SUM(value_of_target)` for the selected Entity Type + KPI, grouped
  per Team Member per Month. _(See OQ-1.)_

## 7. Success criteria

- Leadership edits a target in-app; the dashboard reflects the new value with no code
  change (same read query).
- Report renders correct SBU/Vertical/name per row and downloads an Excel matching the
  on-screen filtered set.
- No orphaned or invalid `entity_type`/`kpi` values can be written (DTO enum-validated).

## 8. Open questions

- **OQ-1 — "Target" definition**: single row's `value_of_target`, or `SUM` grouped by
  user+month for a chosen entity_type/kpi? _Default: SUM for chosen entity_type+kpi,
  defaulting to TOTAL_POLICY / BROKERAGE._
- **OQ-2 — Non-leadership access**: can a member see their own targets/report, or is the
  whole feature leadership-only? _Default: leadership-only for edit; report scoped-read._
- **OQ-3 — Month granularity in UI**: expose true monthly rows, or roll up to quarter for
  editing convenience? _Default: monthly (matches table)._
