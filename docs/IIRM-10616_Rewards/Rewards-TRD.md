# Rewards — Technical Design Document (Phase 1)

**Jira:** IIRM-10616 · **Source PRD:** `Rewards-PRD.md` · **UI ref:** `Rewards-Prototype-v3_25-June-2026.html`
**Status:** Draft for build · **Last updated:** 2026-06-26

This TRD maps the PRD onto the existing repo conventions. It uses our own components and code structure; the prototype is reference only. The privilege toggle in the prototype is dropped — gating is permission-based via `PermissionGuard` / `useHasPermission`, like every other page.

---

## 1. Decisions (locked)

| # | Decision | Rationale |
|---|---|---|
| D1 | Page lives in the **iwork** MFE, grouped under the "Admin Module" sidebar nav. | The standalone `admin` MFE is unwired boilerplate (not a container remote). Every existing admin page — InsurerPage, CompanyPage — already lives in iwork. No federation plumbing. |
| D2 | Backend lives in **org-service**, new `reward` module. | Reward references `insurer`, which org-service owns. Mirror the `insurer` module layout. |
| D3 | Schema ships as a raw **`.sql` script** at repo root, not a TypeORM migration. | Repo convention: there is no migrations dir; schema/seed changes are `.sql` files (`hr-module-scripts.sql`, `scripts/*.sql`). `synchronize:false`. |
| D4 | Soft-delete via `deleted_at` (`DeleteDateColumn`) = "Inactive" (BR-010). | Matches `insurer`, `file_uploads`. |
| D5 | Documents link via a new **`reward_doc_map`** join table (mirror `company_doc_map`), file stored in `file_uploads` with `company_type='REWARD'`. | Verified: the `file_uploads` "generic" columns are literally `company_id`/`company_type`; every parent links through a dedicated `*_doc_map` table. `file-upload.service.ts` also branches on `entityType` strings — needs a small `'reward'` branch added. |
| D6 | `income_month` is **not stored** — derived from `date_of_income` (BR-006). | Don't persist derived data; month-range filters run against `date_of_income`. |
| D7 | Build order: **Rewards page CRUD first**, BizDone changes second (specced in §7, implemented after). | Per scope decision. |

---

## 2. Where it lives (frontend wiring)

Mirror `apps/ui/iwork/src/app/routes/insurer.route.tsx`.

- **New route file:** `apps/ui/iwork/src/app/routes/reward.route.tsx`
- **Register** in `apps/ui/iwork/src/app/app.routes.tsx` (add `...rewardRoutes` to the `filterRoutesByFeature([...])` block alongside `insurerRoutes`).
- **Pages dir:** `apps/ui/iwork/src/app/pages/RewardPage/`

Routes (each wrapped in `PermissionGuard`):

| Path | Component | Guard |
|---|---|---|
| `/insurer-rewards` | `RewardPage` (listing) | `VIEW_REWARD` |
| `/insurer-rewards/new` | `RewardForm key="new"` | `CREATE_REWARD` |
| `/insurer-rewards/:id/edit` | `RewardForm key="edit"` | `EDIT_REWARD` |

> **No standalone details page.** Clicking a row in the listing opens the **edit** form directly (prefilled). The read-only `RewardDetails` page/route was dropped — view and edit are the same screen.

Sidebar: add the "Insurer Rewards" item under the Admin Module nav group (same place the existing admin links are registered). Visibility follows `VIEW_REWARD`.

Pages folder structure (mirror `InsurerPage/`):

```
RewardPage/
  index.tsx                 listing page shell (smart search + KPI + table)
  RewardTable/
    index.tsx               useTableController + table render
    tableConfig.ts          columns, getTableSearchConfig(), KPI calc
  RewardForm/
    index.tsx               full-page add/edit form (react-hook-form + DynamicForm)
    formConfig.ts           field defs + validation rules
```

---

## 3. Data model

### 3.1 New tables

**`reward`** — one row per reward record.

| Column | Type | Notes |
|---|---|---|
| `id` | `int` PK auto | |
| `reward_category_lid` | `int` FK → `lookup_data(id)` | Lookup `REWARD_CATEGORY_*`. Phase 1 always Generic; Specific reserved (BR-001). Immutable after save. |
| `reward_type_lid` | `int` FK → `lookup_data(id)` | Lookup `REWARD_TYPE_*`. Hidden, stored only; Fixed in P1, Percentage in P2 (BR-007). |
| `insurer_id` | `int` FK → `insurer(id)` | Customer/payee = insurer (BR-003). Active or inactive (BR-004). |
| `date_of_income` | `date` not null | Income Month derived from this (BR-006). |
| `reward_amount` | `numeric(15,2)` not null | Positive only (BR-016). Cumulative across selected months (BR-005). |
| `remarks` | `varchar(500)` null | Optional free text; shown above Documents in the form. |
| `created_at` | `timestamp` default now | |
| `created_by` | `int` not null | user id |
| `updated_at` | `timestamp` | |
| `updated_by` | `int` | |
| `deleted_at` | `timestamp` null | Soft-delete = Inactive (BR-010). |

**`reward_business_month`** — child, one row per selected business month (BR-005 multi-select).

| Column | Type | Notes |
|---|---|---|
| `id` | `int` PK auto | |
| `reward_id` | `int` FK → `reward(id)` on delete cascade | |
| `business_month` | `date` not null | Stored as first-of-month (e.g. `2026-05-01`). Range filters compare on this. |
| `start_date` | `date` null | Month bound, first day (= `business_month`). Derived server-side in `buildMonths`. |
| `end_date` | `date` null | Month bound, last day (e.g. `2026-05-31`). Derived server-side via `Date.UTC(y, mo, 0)`. |

For each selected month the backend stores the explicit range: `start_date` = 1st, `end_date` = last day of that month (handles 28/29/30/31). Nullable so pre-existing rows are unaffected; both are `ADD COLUMN IF NOT EXISTS` in the schema script.

Index: `reward(insurer_id)`, `reward(date_of_income)`, `reward_business_month(reward_id)`, `reward_business_month(business_month)`.

### 3.2 Documents

**`reward_doc_map`** — join table, mirror `company_doc_map.entity.ts`.

| Column | Type | Notes |
|---|---|---|
| `id` | `int` PK auto | |
| `reward_id` | `int` FK → `reward(id)` on delete cascade | |
| `doc_id` | `int` FK → `file_uploads(id)` on delete cascade | |

- File bytes stored in `file_uploads` (`company_type='REWARD'`, `company_id=reward.id`, `upload_type`/`document_type_lid` per convention) via the existing `file-upload` controller+service (org-service) and the `DocumentUploadField` ui-lib component.
- **One small backend change:** `file-upload.service.ts` branches on `entityType` to pick a module key — add a `'reward'` branch and write `reward_doc_map` rows on upload (same as the company path).

### 3.3 Entities to add

Add to `apps/services/service-lib/src/lib/entities/`: `reward.entity.ts`, `reward-business-month.entity.ts`, `reward-doc-map.entity.ts` — following `insurer.entity.ts` / `company-document-map.entity.ts` conventions (`@Auditable()`, snake_case columns, `DeleteDateColumn`, `OneToMany` to business months and doc maps). Add the `RewardDocMap` `OneToMany` back-reference to `file-upload.entity.ts`.

### 3.4 SQL script

`scripts/rewards-phase1-schema.sql` — `CREATE TABLE reward`, `reward_business_month`, `reward_doc_map`, indexes, FKs, the `lookup_data` rows (`REWARD_CATEGORY_*`, `REWARD_TYPE_*`), plus the ACL seed rows (§6). `reward_category`/`reward_type` are lookup IDs (repo convention), resolved server-side by `findByLookUpKey`.

---

## 4. Backend (org-service `reward` module)

Mirror `apps/services/org-service/src/app/insurer/` layout:

```
reward/
  reward.controller.ts
  reward.service.ts
  reward.repository.ts
  reward.module.ts
  dto/
    create-reward.dto.ts
    update-reward.dto.ts
    get-all-rewards.dto.ts
```

### 4.1 Endpoints

| Method | Path | Body / Query | Guard | Notes |
|---|---|---|---|---|
| GET | `/reward` | `GetAllRewardsDto` (page, limit, sort, search, + filters) | view | Returns `{ data, count, kpisData }`. |
| GET | `/reward/:id` | — | view | Single record incl. business months + documents. |
| GET | `/reward/by-insurer/:insurerId` | — | view | Active rewards for an insurer (form history, BR-017). Loads `businessMonths` **and** `docMaps` + their `file_uploads` row (filename for the documents column). |
| POST | `/reward` | `CreateRewardDto` | create | Duplicate detection (BR-018). |
| PUT | `/reward/:id` | `UpdateRewardDto` | edit | Records `updated_by`/`updated_at`. Category immutable. |
| DELETE | `/reward/:id` | — | delete | Soft-delete (set `deleted_at`). Confirmation is a UI concern. |
| GET | `/reward/export` | same filters as list | view | Excel of current filtered list. |

Add endpoint constants to `apps/ui/ui-lib/src/lib/constants/endPoints.ts`.

### 4.2 Filters (GetAllRewardsDto → repository)

PRD §3.2. Implement via `ScopeService.validateMasterScope` (like `insurer.repository.ts`):

- `reward_category_lid` (Generic only selectable in P1)
- `insurer_id`
- `period_type` = `BUSINESS_MONTH | INCOME_MONTH` + `from` / `to` dates:
    - `BUSINESS_MONTH` → join `reward_business_month`, filter `business_month BETWEEN from..to`.
    - `INCOME_MONTH` → filter `date_of_income` month range.
- search string over insurer name.

### 4.3 KPIs (PRD §3.1, computed over the active filter)

- `totalRewardAmount` = SUM(reward_amount)
- `genericRewardAmount` = SUM where category=GENERIC
- `specificRewardAmount` = 0 (greyed, future)

### 4.4 Business-rule enforcement (server-side, not just UI)

- **BR-015** mandatory: insurer_id, ≥1 business_month, date_of_income, reward_amount.
- **BR-016** reward_amount > 0.
- **BR-018 duplicate detection** on create/update:
    - Hard block (409): same `insurer_id` + same set of `business_month`s + same `reward_amount`.
    - Soft warn: same `insurer_id` + same `date_of_income`. Return a warning flag; client confirms and re-POSTs with `confirmDuplicate=true`.
- Category immutable after save (reject category change in PUT).

### 4.5 RBAC / ACL

Enforced by the global `AclGuard` (path `reward` × HTTP method) — same model as `insurer`. Register ACL rows in the seed script (§6). Resource-level checks via `ScopeService.validateResourceScope(userId, "reward", "edit"|"delete", id)` in PUT/DELETE, mirroring `insurer.controller.ts`.

---

## 5. Frontend

### 5.1 Listing (`RewardPage`)

Reuse, exactly like `InsurerTable`:
- `useTableController({ endpoint: endPoints.allRewards, ... })` — pagination, sort, smart search.
- `SmartSearch` + `getTableSearchConfig()` for the filter panel (Reward Category, Insurer via `selectFieldByApi`, Period type toggle, From/To dates).
- `KPICards` for the three cards (Specific greyed, value 0).
- `Table` (AG Grid wrapper) with columns per PRD §3.3; `Created By` hidden by default via Table Settings.
- Export button → `endPoints.rewardExport`, gated by `VIEW_REWARD`.
- Add button via `Table` `primaryActionPermission={FeatureKey.CREATE_REWARD}`.
- **Row click** (on the Reward Category cell) navigates to the edit form. **Actions column = Delete only** (no edit icon — editing is the row click), gated by `DELETE_REWARD`; red MUI `DeleteOutlineRounded`, centered, "Delete" tooltip, opens a confirm dialog (BR-010).
- **Sort:** only scalar columns are sortable — `dateOfIncome` (Income month), `rewardAmount`, `createdAt`. Relation/array columns (Reward category, Insurer, Business month, Documents) are `sortable:false` because the backend orders by `r.<field>` and can't order on a relation/`OneToMany`. (Sorting those would need an explicit join+order — deferred.)
- **Period type filter** default is the object form `{ value: "BUSINESS_MONTH", label: "Business month" }` (the smart-search select binds on `value.value`); `buildRewardQueryParam` extracts `.value` for the request.

Columns: Reward Category (tag), Insurer, Business Month (joined list), Income Month (derived), Reward Amount (INR locale), Documents (count), Created Date, Actions (delete), [Created By — hidden default].

### 5.2 Form (`RewardForm`) — full page (BR-001)

react-hook-form + `DynamicForm` from `formConfig.ts`. Fields in order:

1. **Reward Category** — radio, Generic active, Specific disabled (BR-001).
2. **Insurer** — `selectFieldByApi` against `/insurers/select-list` (already returns active+inactive: it filters only on `deletedAt IS NULL`). To show `Name (Inactive)` (BR-004) the dropdown must also return active/inactive status: extend `fetchInsurerDropdown` to select `statusLid`/status and return an `isActive` flag (additive, existing consumers ignore it).
3. **Business Month** — **`multiSelect`** dropdown (PRD/feedback: not chips), one or more, options = the 12-month window (BR-005).
4. **Date of Income** — `date` field (BR-006).
5. **Income Month** — read-only, auto-derived from Date of Income (display only).
6. **Reward Amount** — number, positive only, Indian locale grouping on blur (BR-016).
7. **Remarks** — optional free-text (maxlength 500), shown above Documents.
8. **Documents** — `DocumentUploadField`, optional, multiple, preview + delete (BR-008).

Below inputs: **Rewards list** (BR-017), heading "Rewards (existing rewards for the selected insurer)" — read-only history of existing rewards for the selected insurer; fetched on insurer change. Implementation details:

- Reuses the shared `Table` (AG Grid wrapper) with the listing's `getColumns()`, not a hand-rolled MUI table. **Insurer** and **Reward category** columns are filtered out (redundant — scoped to one insurer); all columns `sortable:false` (static client data).
- The table **always renders** regardless of state; its `emptyDataMessage` adapts: no insurer → "Select an insurer…", error → "Could not load rewards…", empty → "No existing rewards…". `loading`/`showLoader` wired to the query's `isLoading` so it shows a spinner while fetching (must not use `domLayout="autoHeight"` — that collapses the grid to zero height on an empty result, hiding the overlay).
- **Documents cell:** 0 → "--"; 1 → the filename directly (download on click); >1 → "N file(s)" link that opens a `CustomModal` listing every document, each a download link. Filenames are derived from `file_uploads.file_key` (last path segment, strip the `<timestamp>_` prefix). Download = `apiRequest(endPoints.fileUploadDownloadById(id), {responseType:"blob"})` → object URL → anchor click (same pattern as FAQ/Hospital listings).

Validation: rules in `formConfig.ts` (required + positive amount); duplicate handling driven by the API response (hard block → inline error; soft warn → confirm dialog then re-submit with `confirmDuplicate=true`).

### 5.3 Permissions

Add to `apps/ui/ui-lib/src/lib/rbac/permissionMap.ts`:
`VIEW_REWARD`, `CREATE_REWARD`, `EDIT_REWARD`, `DELETE_REWARD` (+ map each to `{scope, category:'insurer_rewards', action}`). Export follows `VIEW_REWARD`. Four PRD tiers (BR-009) collapse onto these four keys; "View Only" = has only `VIEW_REWARD`.

---

## 6. ACL / permission seed (in the SQL script)

- `acl_categories`: one row, key `insurer_rewards`.
- `acl_actions`: `view`, `create`, `edit`, `delete`.
- `role_acl_category_action_map`: grant the relevant roles. Confirm the target roles with the client before seeding prod.

---

## 7. BizDone impact (spec now, implement after the page)

Generation lives in `apps/services/policy-service/src/app/policy/policy.service.ts` + `policy.repository.ts`. Changes (PRD §8, BR-012/013/014), all privilege-gated on `VIEW_REWARD`:

1. **New "Rewards" sheet** — reward records grouped per insurer; columns mirror the form fields. Hidden from users without reward-view privilege.
2. **"Rewards" column on Summary-Insurer Classification** — SUM(reward_amount) per insurer, shown as a separate column (never merged into brokerage totals/variance).
3. **Income Type dropdown** gains a **"Rewards"** value (privilege-gated). Comp / Policy Classification + Details-Policy sheets unchanged.

Amounts bucket by **Income Month** (= month of `date_of_income`). Soft-deleted rewards excluded. Already-downloaded reports are point-in-time, not restated (BR-010).

---

## 8. Out of scope (Phase 2 — PRD §11)

Specific Reward category; period aggregation / % calculation / Reward Base / snapshot / Policies Considered; dashboard With/Without Rewards toggle; OCR extraction; target notifications; payment-status lifecycle; clawback / report restatement.

### 8.1 Phase-2 readiness — additive-only, no harm to existing code/data

When the Specific category (PRD §11A) or the Generic % enhancements (PRD §11B) are built, the change **must be backward-compatible**: the existing Phase-1 Generic/Fixed code paths and all rows already in `reward` / `reward_business_month` / `reward_doc_map` must keep working unchanged. Concretely:

- **Schema is additive only.** New columns are **nullable** (or carry a safe default) and added via `ADD COLUMN IF NOT EXISTS`; new relationships go in **new tables** (e.g. a `reward_policy_map` for "Policies Considered" / policy-bound Specific). Never repurpose, rename, or drop an existing column, and never backfill in a way that changes the meaning of an existing Generic row.
- **Lookups already exist** — `reward_category_lid` (Generic/Specific) and `reward_type_lid` (Fixed/Percentage) are stored on every row today. Phase 2 reads them; it does not need to alter them. Existing rows stay `Generic` / `Fixed`.
- **Branch on category/type, don't fork the model.** Specific/% logic (period aggregation, snapshot-on-save, base selection) keys off `reward_type_lid = Percentage` / `reward_category_lid = Specific`. Generic/Fixed must continue to skip all of it — a missing percentage/base/snapshot column on an old row is expected and must be tolerated (treat as "Fixed, amount as entered").
- **What Phase 2 will add (none of it exists today, all absent-tolerant):** `reward_percentage`, `reward_base`, snapshot columns (`total_net_premium`, `total_brokerage`, `period_start`, `period_end`), and a reward↔policy mapping table. The BizDone "Rewards" sheet and the listing must render fine when these are null (Phase-1 rows).
- **Snapshots are immutable** (BR-P2-001): once written they are not auto-recomputed, so adding the feature must not retroactively touch existing rows.

Net: Phase 1 was built so Specific/Phase-2 is a **superset** — added columns/tables and category/type-gated logic — never a migration that rewrites or invalidates Phase-1 data.

---

## 9. Build sequence

1. Entities (`reward`, `reward_business_month`) + `scripts/rewards-phase1-schema.sql` (tables + ACL seed).
2. org-service `reward` module: repository → service → controller → DTOs; wire duplicate detection + KPIs + filters.
3. Permission keys + endpoints in ui-lib.
4. iwork: route file + nav item; `RewardTable` listing (row click → edit, delete-only action); `RewardForm` (add/edit + insurer history table with downloadable documents); document upload via existing `DocumentUploadField`.
5. Export endpoint + button.
6. BizDone changes (separate pass).

---

## 10. UI contract: Insurer Rewards (iwork MFE)

- Components (all new unless noted):
    - `RewardPage` — `apps/ui/iwork/src/app/pages/RewardPage/index.tsx` (listing shell, title "Insurer Rewards")
    - `RewardListing` (table + SmartSearch + KPIs + delete) — `apps/ui/iwork/src/app/pages/RewardPage/RewardTable/index.tsx`
    - Table/search/KPI config — `apps/ui/iwork/src/app/pages/RewardPage/RewardTable/tableConfig.ts`
    - `RewardForm` (add/edit + insurer history table + documents modal + duplicate dialog) — `apps/ui/iwork/src/app/pages/RewardPage/RewardForm/index.tsx`
    - Form field config — `apps/ui/iwork/src/app/pages/RewardPage/RewardForm/formConfig.ts`
    - Shared constants (period type, business-month options Apr 2026–Mar 2027) — `apps/ui/iwork/src/app/pages/RewardPage/constants.ts`
    - Reused: `Table`, `SmartSearch`, `KPICards`, `CardBackground`, `DynamicForm`, `FormSection`, `FormActionsContainer`, `CommonBreadcrumb`, `Button`, `CustomModal`, `DocumentUploadField` (via `type: "documentupload"`), `useTableController`, `useApiMutation`, `useApiQuery`, `useApi`, `formatNumberByLocalization`, `PermissionGuard`, `selectHasPermission` — all from `@ui/ui-lib`. `insurerSelectListUtilityFunction` reused from InsurerPage.
- Screens/routes wired — `apps/ui/iwork/src/app/routes/reward.route.tsx`, registered in `apps/ui/iwork/src/app/app.routes.tsx` (same `filterRoutesByFeature` block as `insurerRoutes`):
    - `/insurer-rewards` (VIEW_REWARD) → listing
    - `/insurer-rewards/new` (CREATE_REWARD) → form
    - `/insurer-rewards/:id/edit` (EDIT_REWARD) → form (also the target of a listing row click; no separate details route)
    - Nav: "Insurer Rewards" under Admin Module — `apps/ui/ui-lib/src/lib/commonComponents/SideBar/config.ts` (permissionKey `viewRewardManagement`), wired in `apps/ui/iwork/src/app/components/Layout/index.tsx` from `FeatureKey.VIEW_REWARD`.
- API calls used:
    - GET `endPoints.allRewards` (`/reward`) via `useTableController`, with `rewardCategoryLid/insurerId/periodType/from/to` as direct query params
    - GET `endPoints.rewardsByInsurer(insurerId)` (`/reward/by-insurer/:id`) — form history table (incl. documents)
    - GET `endPoints.fileUploadDownloadById(id)` (`/file-upload/:id/download`, blob) — history document download
    - GET `endPoints.rewardById(id)` (`/reward/:id`) — edit prefill
    - POST `endPoints.allRewards` / PUT `endPoints.rewardById(id)` — create/update (with `confirmDuplicate` on soft 409)
    - DELETE `endPoints.rewardById(id)` — soft delete (confirmation dialog)
    - GET `endPoints.lookUpByName("REWARD_CATEGORY")` — category options (Generic only selectable)
    - GET `endPoints.insurerSelectList` — insurer dropdown
