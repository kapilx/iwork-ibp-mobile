# Manage Quotes — Combined SO & RO Listing (ISG) — Spec

## 1. Goal

Build a single **Manage Quotes** screen for ISG users that merges **SO** (Sales
Opportunity) and **RO** (Renewal Opportunity) records into one paginated list,
governed by role-based visibility and an "ISG Planning or beyond" stage gate.

This screen lives under the existing **Manage Placements** menu group and
replaces the two current children "Manage Quote RO" and "Manage Quote SO".

## 2. Context — current state

- Menu config: `apps/ui/ui-lib/src/lib/commonComponents/SideBar/config.ts`
    - `My Sales Portfolio` group has `excludeRolePatterns: ["ISG"]` (BD-only),
      with children `My RO` (`/renewal-opportunities`) and `Manage SO`
      (`/opportunities`).
    - `Manage Placements` group (lines ~186-228) currently has children
      `Manage Quote RO` (`/renewal-opportunities`) and `Manage Quote SO`
      (`/opportunities`).
- SO listing: `apps/ui/iwork/src/app/pages/OpportunitiesPage/OpportunitiesListing/index.tsx`
  (route `/opportunities`, title `Manage SO`, entity key `soEntity`).
- RO listing: `apps/ui/iwork/src/app/pages/RenewalOpportunityPage/RenewalOpportunityListing/index.tsx`
  (route `/renewal-opportunities`, title `Manage RO`, entity key `roEntity`,
  calls list endpoint with `type=RO`).
- Both lists call `endPoints.allOpurtunities` (`GET /opportunity`) via
  `useTableController`, differing only by `customPathParam` (`type=SO` vs
  `type=RO`) and `entityKey`.
- Backend list: `opportunity.service.ts::getAllOpportunityList` →
  `opportunity.repository.ts::getAllOpportunities`. Query DTO:
  `opportunity-query-param.dto.ts` — `type?: "SO" | "RO"` enum param exists.
- Role detection — **now ACL-read based** (commit `537f736796`, already merged):
    - Frontend `apps/ui/ui-lib/src/lib/rbac/useActivityRoleVisibility.ts` reads
      `selectHasPermission(VIEW_BD_ACTIVITY)` / `(VIEW_ISG_ACTIVITY)` →
      `{ canViewBD, canViewISG }` (role keys no longer used; `roleKeys` /
      `selectRoleKeys` plumbing has been removed).
    - FeatureKeys `VIEW_BD_ACTIVITY` → `BD_ACTIVITY`/`BD_READ_001` and
      `VIEW_ISG_ACTIVITY` → `ISG_ACTIVITY`/`ISG_READ_001` exist in
      `permissionMap.ts`.
    - Backend `ScopeService.getActivityRoleVisibility(userId)`
      (`libs/service-lib/src/lib/utils/scope.utils.ts:120`) mirrors it by counting
      `RoleAclCategoryActionMap` rows for the user's roles under the specific
      `BD_READ_001` / `ISG_READ_001` actions.
    - The opportunity list path already consumes this:
      `opportunity.service.ts:706` calls `getActivityRoleVisibility`, derives
      `visibleActivityRoleKeys` (BD-only / ISG-only / null=unrestricted), and
      threads it into `getAllOpportunities(...)` and
      `getWorkInProgressActivityNameByOpportunityId(...)` so the **display
      activity** is already role-filtered per requesting user.
- Activity / stage model: `opportunity-activity-map.entity.ts` has
  `activityName`, `stageName`, `activityOrder`, `roleKey`, `statusLid`,
  `plannedAt`. `ACTIVITY_NAME.ISG_PLANNING = "ISG Planning"` in
  `service-lib/src/lib/constants.ts`. BD/ISG Planning are **synthesized** from
  `plannedAt` (repo ~3807-3841), not real rows. `roleKey` on each activity row is
  seeded from the stage template (`createStageActivityMap`, repo ~3344).

## 3. Decisions (confirmed)

1. **ISG stage gate** — derived from EXISTING data, **no migration**: an
   opportunity has "reached or crossed ISG Planning" iff it has at least one
   ISG-role activity that has been planned —
   `EXISTS(opportunity_activity_map WHERE opportunity_id = X AND roleKey =
   ROLE_ISG_EXECUTIVE AND plannedAt IS NOT NULL)`. This is the **same signal**
   the app already uses to synthesize the "ISG Planning" stage row
   (`opportunity.repository.ts` ~lines 3784-3819, `isgPlanned`). It works for both
   SO and RO and needs no new activity/seed/backfill. (Supersedes the earlier
   activity_order/real-activity approach — see §5.0.1.)
2. **Backend** — **extend the existing `/opportunity` list endpoint** with a
   combined mode and the ISG-gate filter; return both SO and RO in one
   paginated, sorted, counted result. No new endpoint, no client-side merge.
3. **Menu** — **replace** `Manage Quote RO` and `Manage Quote SO` under
   `Manage Placements` with a single `Manage Quotes` item.
4. **Visibility gating via ACL read capability (CONFIRMED — supersedes the
   role-key approach).** Detection uses the **"BD/ISG activities read"** ACL
   capabilities (`BD_ACTIVITY/BD_READ_001`, `ISG_ACTIVITY/ISG_READ_001`). Today
   there is **no FeatureKey** mapped to these, so we add `VIEW_BD_ACTIVITY` /
   `VIEW_ISG_ACTIVITY` (§5.0.2). This is the single detection mechanism for the
   menu, the Manage Quotes data gate, AND the existing activity-visibility work —
   replacing the role-key detection so everything is consistent and the
   already-built role-key plumbing can be removed (§5.0.3). **Prerequisite:** the
   ACL seed must grant `ISG_READ_001` only to ISG roles and `BD_READ_001` only to
   BD roles (a BD manager must NOT carry ISG read), otherwise the old
   manager-leak returns. This is config the team controls in the role-ACL admin
   screen.
5. **Activity LOV naming** — show generic (SO) activity names; strip the
   "Renewal " prefix for RO. **Exception:** the Data Validation activity is
   labeled **"RSR Creation/Data Validation"** (SO calls it "Data Validation",
   RO calls it "RSR Creation"; show both). See §5.4.
6. **Route/label** — route `/manage-quotes`, menu label `Manage Quotes`.
7. **KPI cards** — for now show only **Total Companies** and **Total
   Opportunities**. Premium / brokerage cards deferred.
8. **Other surfaces unchanged** — Policy listing, My Client Portfolio, and the
   Dashboard funnels are **ownership/hierarchy-scoped**, not BD/ISG-activity
   scoped, so they need **no changes** (see §10).

## 4. Visibility rules (menu + data)

### 4.1 Menu visibility

Gated on the **"ISG activities read"** ACL capability (`VIEW_ISG_ACTIVITY` →
`ISG_READ_001`, added in §5.0.2). This matches the existing
`selectHasPermission(FeatureKey...)` + Sidebar `permissionKey` pattern and
avoids brittle role-name matching.

| User capability         | My Sales Portfolio | Manage Placements → Manage Quotes |
| ----------------------- | ------------------ | --------------------------------- |
| BD read only            | Visible            | **Hidden**                        |
| ISG read only           | Hidden             | Visible                           |
| BD + ISG read           | Visible            | Visible                           |
| Neither (leader, both)  | Visible            | Visible                           |

- Add a `viewIsgActivity` boolean (from `VIEW_ISG_ACTIVITY`) to the Sidebar
  `permissions` prop and set the `Manage Quotes` child's
  `permissionKey: "viewIsgActivity"`.
- Resolved (was §8 Q1): we use the **read** ACL capability as the single
  detection mechanism (decision §3.4). The earlier manager-leak was caused by the
  broad `ISG_ACTIVITY` *category*; the specific `ISG_READ_001` *action* does not
  leak **provided** the ACL seed gives ISG read only to ISG roles (§5.0.2).

### 4.2 Data-row visibility (per opportunity)

An opportunity appears in Manage Quotes only if BOTH hold:

1. **Role gate** — the requesting user can view ISG activities (`canViewISG`,
   from `ISG_READ_001`), AND
2. **Stage gate** — relaxed when the user can also view BD (`canViewBD`): an
   ISG-only user sees only opportunities that reached ISG Planning (§5.0.1 EXISTS
   predicate); a BD+ISG user sees all stages.

Worked examples from the requirement:

| User roles | Opty stage | Show? |
| ---------- | ---------- | ----- |
| ISG only   | BD stage   | No    |
| ISG only   | ISG stage  | Yes   |
| BD + ISG   | BD stage   | Yes   |
| BD + ISG   | ISG stage  | Yes   |
| BD only    | any        | Menu not visible |

Note: the BD+ISG / BD-stage = Yes case means the stage gate is **conditional on
role**. Concretely: if the user can view BD activities (`canViewBD`), the stage
gate is relaxed (show all stages); if the user is ISG-only, the stage gate
applies (`>= ISG Planning`). See §5.2.

## 5. Backend changes

### 5.0 Prerequisites (shared, affect SO + RO too)

#### 5.0.1 ISG-Planning gate — derive from existing data (NO migration)

`BD Planning` / `ISG Planning` are **not** rows in `opportunity_activity_map`;
they are synthesized from `plannedAt` on role-tagged activities
(`opportunity.repository.ts` ~lines 3784-3819: `isgPlanned = activities where
roleKey === ROLE_ISG_EXECUTIVE && plannedAt`). We reuse exactly that signal as
the stage gate, so **no master-template change, no migration, no backfill**:

> An opportunity has reached/crossed ISG Planning iff
> `EXISTS(opportunity_activity_map WHERE opportunity_id = X
> AND roleKey = ROLE_ISG_EXECUTIVE AND plannedAt IS NOT NULL)`.

- This is consistent with how the UI already decides to show the "ISG Planning"
  stage, so list membership matches what users see elsewhere.
- Works for both SO and RO (same table, same `roleKey`). **Confirmed:** SO and RO
  share one master template (selected by `policyTypeLid` only; no RO-specific
  template), and `roleKey` is written from `stage.refRoleKey` on every row
  regardless of type (`createStageActivityMap`, repo ~3342-3344). `plannedAt` is
  set the same way for both on planning submission (repo ~3461). The existing
  synthetic ISG-Planning rendering already runs for RO using this exact signal,
  so RO opportunities that did ISG planning carry an `ROLE_ISG_EXECUTIVE` row with
  `plannedAt` set. (The `mstr_stage` seed is DB-seeded, not in-repo; no design
  risk since both types use it identically.)
- Implemented as an `EXISTS` sub-predicate in the list query; nothing to seed.

##### The gate is NOT the opportunity "status" — it's whether ISG Planning was reached

Important distinction (a common point of confusion): the gate keys off an
ISG-role activity having `plannedAt`, **not** off the opportunity's status value
(`Open` / `Work In Progress` / etc.). Status and BD/ISG stage are **orthogonal**:

- The opportunity status flips to **Work In Progress right after KDM Meeting** and
    stays Work In Progress through the rest of the **BD** stage (Mandate, RFP Data
    Collection, RFP Details Entry). RFP Details Entry does NOT change the status.
- So "Work In Progress" does **not** mean ISG-reached. An opportunity at, say,
    **KDM Meeting** is Work In Progress but still entirely in the BD stage.

Worked example: opportunity status = Work In Progress, current activity = KDM
Meeting → no ISG-role activity has been planned yet → `EXISTS` is false →
**an ISG-only user does NOT see it.** It becomes visible to ISG only once **ISG
Planning is submitted** (which sets `plannedAt` on the ISG activities). BD-only /
dual-role / unrestricted users see it throughout (no stage gate).

Status lifecycle for reference (opportunity `status_lid`, driven by activity
completion): created → **BD Planning**; Data Validation done → **Open**; KDM
Meeting done → **Work In Progress**; ISG Planning submitted → **ISG Planning**;
then Won / Lost. (`Default` appears in the "Active" status-filter mapping but no
code path sets it — treat as legacy.)

(This supersedes the previous activity_order/real-activity design and removes the
entire migration + reconcile-synthetic-planning workstream.)

##### Why planning stays synthetic (don't promote it to a real activity)

"BD/ISG Planning" is the *act of scheduling* the role's activities, not a unit of
work: submitting the planning form stamps `dueDate` + `plannedAt` on each **real**
activity (`updateActivityDueDate`, repo ~3454-3464), and the planning label is
derived from that (`buildPlanningRow`, repo ~3806-3842). Modeling it as a discrete
`opportunity_activity_map` row is modeling a verb as a noun, and for this feature
it is **all cost, no benefit** (the EXISTS gate already gives the signal we need).
Issues it would introduce:

- **Undefined lifecycle** — a real row needs a `statusLid` lifecycle and something
  to drive it; today its status is a synthetic `"Planned"` with no `statusLid`.
- **Migration + backfill** on live data — new master-template rows (SO + RO) plus
  inserting a planning row into every in-flight opportunity at the right order.
- **Double-render** — planning is synthesized in two places (backend
  `buildPlanningRow` and frontend `transformActivities`); both must be reconciled.
- **Display-activity shift** — a low-`activityOrder` row with a live status could
  become the "current activity" shown on the existing SO/RO listings.
- **`plannedAt` stays anyway** (drives due dates), so it is added state, not less.
- **Counts/KPIs/pending-activity** logic (keyed on `plannedAt`, repo ~829-877) and
  the just-merged visibility feature (commit `537f736796`) would all need re-validation.

Only revisit this if **product** wants planning to become a first-class, assignable,
trackable, approvable workflow step — a separate initiative, not part of Manage Quotes.

#### 5.0.2 READ FeatureKeys (RBAC wiring) — DONE (commit `537f736796`)

Already implemented; nothing to build here:

- `FeatureKey.VIEW_ISG_ACTIVITY` → `ISG_ACTIVITY`/`ISG_READ_001` and
  `FeatureKey.VIEW_BD_ACTIVITY` → `BD_ACTIVITY`/`BD_READ_001` exist in
  `permissionMap.ts`.
- `useActivityRoleVisibility` consumes them via `selectHasPermission`.
- Backend `ScopeService.getActivityRoleVisibility` mirrors them.

**Remaining for Manage Quotes:** add a `viewIsgActivity` boolean (from
`VIEW_ISG_ACTIVITY`) in `Layout/index.tsx` and pass it through the Sidebar
`permissions` prop for the menu gate (§4.1).

#### 5.0.4 ACL data seed — HARD PREREQUISITE (DB/ops, not in repo)

> Full component→permission tables and the per-role grant matrix live in
> [[ROLE_BASED_ACTIVITY_VISIBILITY_LISTING_DASHBOARD_PLAN]] **Part H** — hand that
> to whoever configures the role-ACL grants.

Confirmed (Q8): the ACL **rows** that the read capabilities depend on are **not
seeded anywhere in the repo** — no migration/fixture creates the `BD_READ_001` /
`ISG_READ_001` actions, the `BD_ACTIVITY` / `ISG_ACTIVITY` category-action
mappings, or the role→action grants. They exist only where an admin has
configured them in the DB. This is the single biggest go-live risk:

- If `ISG_READ_001` is **not** granted to ISG roles, `VIEW_ISG_ACTIVITY` is false
  for everyone → the **Manage Quotes menu never appears** for the users who need
  it. Meanwhile the data gate (`getActivityRoleVisibility`) treats "neither read"
  as unrestricted — so menu-hidden but data-unrestricted, an inconsistent state.
- A BD manager who is mistakenly granted `ISG_READ_001` (or the broad
  `ISG_ACTIVITY` category) would wrongly see Manage Quotes (the manager-leak).

Actions:

- Add a checked-in seed SQL (alongside the other `database-migrations/sql/*-rbac.sql`
  files) that creates the `BD_READ_001` / `ISG_READ_001` actions + `BD_ACTIVITY`/
  `ISG_ACTIVITY` category-action maps if missing, and grants: ISG roles →
  `ISG_READ_001`, BD roles → `BD_READ_001`, leadership/super/CS → both or neither.
- Add an integration check that asserts these grants before the feature is
  considered live. Verify the existing (already-merged) activity-visibility
  feature is relying on the same rows — if it works in the test env, the rows
  already exist there but still need to be reproducible for new environments.

#### 5.0.3 Detection unified on read-ACL — DONE (commit `537f736796`)

Already implemented; no further change:

- `useActivityRoleVisibility` switched from role keys to
  `selectHasPermission(VIEW_BD_ACTIVITY/VIEW_ISG_ACTIVITY)`.
- `ScopeService.getActivityRoleVisibility` counts `RoleAclCategoryActionMap`
  rows under the **specific** `BD_READ_001` / `ISG_READ_001` actions (not the
  broad category — that was the original manager-leak bug).
- The role-key plumbing has been removed: `roleKeys` is gone from the
  `/permissions` response and from `permissionSlice` (`selectRoleKeys` no longer
  exists anywhere). One consistent ACL-based mechanism everywhere.

### 5.1 Query DTO — `opportunity-query-param.dto.ts`

- Extend `type` to accept a combined value. Add `"ALL"` to the enum
  (`type?: "SO" | "RO" | "ALL"`), OR introduce a dedicated boolean/flag
  `combined?: boolean`. Recommended: add `"ALL"` to keep one param.
- Add optional `optyType` filter param re-using the same value space — this
  backs the hidden "Opty. Type" toggle (§6.3). When the toggle is hidden and
  unset, it defaults to combined behavior.
- Existing filter params remain unchanged and apply across both types:
  org/SBU/vertical/department/branch, period/expiry (`field`,`from`,`to`,
  `period`,`financialYear`,`quarter`,`month`), `search` (company name),
  `ownerId` (ISG Manager), status, etc.

### 5.2 Repository — `opportunity.repository.ts::getAllOpportunities`

Builds on the **existing** role-visibility threading: `opportunity.service.ts`
already computes `{ canViewBD, canViewISG }` via `getActivityRoleVisibility` and
passes `visibleActivityRoleKeys` into `getAllOpportunities`. Manage Quotes adds
two things to that path:

- When `type === "ALL"` (combined mode): do **not** constrain by
  `opportunityTypeLid`; include both SO and RO rows in the same query so
  pagination, sorting and counts are server-correct. (Display activity is already
  role-filtered by the existing `visibleActivityRoleKeys` threading — no change
  needed there.)
- **Default sort = Expiry Date ascending across BOTH types.** SO and RO are
  interleaved into one list ordered by `expiryDate ASC` (the SO/RO expiry date is
  the same column). This must be the **server-side** default sort so it holds
  across pagination — not a per-page client sort. User column sorting still
  overrides it.
- **Apply the stage gate** using the already-computed `canViewBD` / `canViewISG`:
    - ISG-only (`canViewISG && !canViewBD`): add the EXISTS predicate from §5.0.1
      — keep only opportunities with an ISG-role activity that has `plannedAt`.
    - Can view BD (`canViewBD === true`, i.e. BD+ISG or unrestricted): no stage
      gate — show all stages (matches the requirement's BD+ISG examples).
- The gate is a single `EXISTS` sub-predicate on `opportunity_activity_map`
  (`roleKey = ROLE_ISG_EXECUTIVE AND plannedAt IS NOT NULL`); no per-row activity
  resolution and no `activityOrder` lookup needed.

### 5.3 Result shape — `opportunity-list-response.dto.ts`

- Returned per-row fields stay as today (companyName, priority, policyType,
  expectedCloseDate, premium, activityName, assignedTo, branch, policyId,
  state, opportunityId, etc.).
- Add `opportunityType` ("SO" | "RO") to each row so the frontend can render
  the hidden "Opty. Type" column and substitute Policy Number for SO.
- `policyId` (Policy Number) will be null/absent for SO rows — frontend renders
  `--` (§6.4).

### 5.4 Activity LOV (filter dropdown)

- The "Opty. Activity" filter shows the **unique union** of SO and RO activity
  names, using **generic (SO) names**. For RO names, **strip the "Renewal "
  prefix** (e.g. "Renewal KDM Meeting" → "KDM Meeting") so SO and RO collapse to
  one label. Reuse `getRenewalAwareActivityLabel` (RO `tableConfig.ts` ~line 98).
- **Exception — Data Validation:** SO names it "Data Validation", RO names it
  "RSR Creation". These do **not** collapse to a generic name; the LOV entry is
  labeled **"RSR Creation/Data Validation"** and, when selected, must match
  rows of either name (the option value maps to both underlying activity names).
- **Source — frontend assembly (decided, Q3):** the LOV is composed on the
  frontend from the existing SO + RO activity option lists (no new backend
  endpoint). Reuse `getRenewalAwareActivityLabel` for the "Renewal" stripping.
  Each option's *value* carries the underlying activity name(s) it represents;
  combined entries map to multiple names (e.g. Data Validation →
  `["Data Validation","RSR Creation"]`) and the backend matches any of them.

### 5.5 Status filter mapping (Active / Won / Lost)

Reuse the existing `mapOpportunityState()` (`libs/service-lib/src/lib/utils/
helper.utils.ts:427`). It already maps `active → ["Open","Default","Work In
Progress"]` and `lost → ["AUTO CLOSE(lost)","CLOSE(lost)","Lost"]`. SO and RO
share the same underlying status values (only the planning *label* differs).

- The existing SO/RO LOVs expose 5 options (Active, BD/Renewal Planning, ISG
  Planning, Won, Lost) where "Active" is the **narrow** set above (excludes
  planning). Manage Quotes shows only **3** (Active, Won, Lost), dropping the two
  planning options.
- **Decided (Q9) — no backend change to `mapOpportunityState`:**
    - **Won / Lost** reuse the **exact option values SO/RO already send today**
      (those already work), so there is nothing new to confirm about the DB
      "Won" value — it is whatever the existing Won option sends.
    - **Active** is broadened purely on the frontend: the Manage Quotes "Active"
      option expands to the union the existing mapper already understands
      individually — `active` + `bd/renewal planning` + `isg planning`. So
      planning-state opportunities still match, and SO/RO behavior is untouched
      because the shared mapper is not modified.

## 6. Frontend changes

### 6.1 New page

- New folder: `apps/ui/iwork/src/app/pages/ManageQuotes/ManageQuotesListing/`
    - `index.tsx` — combined listing component.
    - `tableConfig.ts` — columns (follows RO columns; see §6.4).
- New route: `apps/ui/iwork/src/app/routes/manageQuotes.route.tsx`, path
  `/manage-quotes` (confirm path name — Open Question Q4). Register in
  `app.routes.tsx`.
- New title constant `MANAGE_QUOTES = "Manage Quotes"` in iwork `constants`.
- New `TABLE_CONTROLLER_ENTITY_KEY.manageQuotesEntity` for column/smart-search
  persistence (independent of `soEntity`/`roEntity`).

Implementation: clone `RenewalOpportunityListing` as the base (it already wires
KPI cards, SmartSearch, breadcrumbs, table controller), then:

- Set `customPathParam` to `type=ALL` (combined mode).
- Use `manageQuotesEntity` for entity key and smart-search defaults.
- Title `Manage Quotes`.
- **Default sort:** `useTableController` `defaultFieldName: "expiryDate"` with
  ascending order, so on open the combined SO+RO list is ordered by Expiry Date
  ascending (server-side, §5.2). (RO already uses `expiryDate` as its sort field;
  Manage Quotes keeps the same field but ascending as the default direction.)

### 6.2 Role-driven rendering

- Route reachable only by users with the ISG read capability
  (`VIEW_ISG_ACTIVITY`, §5.0.2) — same gate as the menu (§4.1). BD-only users
  get redirected/404. The data gate is enforced server-side regardless.

### 6.5 KPI cards

- Show only two cards (per decision §3.8): **Total Companies** and **Total
  Opportunities**. These map to the list response fields already returned
  (`opportunityLeads` = unique companies, `opportunityProspects` = all
  opportunities), now computed across the combined SO+RO gated result.
- Premium / brokerage cards are deferred.

### 6.3 Filters

Match RO filter sections, with these changes:

- **Org.** — no change.
- **Period (Opty. Expiry)** — no change.
- **Opportunity** section:
    - Add new **Opty. Type** toggle (SO & RO). **Built but hidden in the UI**
      (render-gated behind a constant/flag so it can be revealed later). When
      hidden, it does not send `optyType` and the list stays combined.
    - **Opty. Activity** — unique union of SO + RO activities, "Renewal" prefix
      stripped (§5.4).
    - **Opty. Status** — LOV limited to **Active, Won, Lost** (trim the existing
      5-option list). "Active" means all non-Won/non-Lost incl. planning states —
      backend mapping per §5.5.
- **ISG Manager** — no change.
- Company Name, Company Priority, Company Contact, Company Industry, Policy Type
  — no change (same as RO).

### 6.4 Result table columns

Default sequence and naming, with the first three **frozen** (pinned left):

1. **Opty. ID** — hyperlink, navigates to the opportunity. *(frozen)*
2. **Activity Name** — hyperlink, navigates to the opportunity at the
   respective activity. RO labels rendered with "Renewal" stripped via
   `getRenewalAwareActivityLabel`. *(frozen)*
3. **Opty. Expiry** — `expectedCloseDate`, formatted. *(frozen)*

   ----- columns above are frozen -----

4. Remaining columns follow the existing **RO** column set
   (`RenewalOpportunityListing/tableConfig.ts`): Company name, Priority,
   Policy type, Premium, Assigned to, Branch, **Policy Number**, etc.
    - For **SO** rows, **Policy Number renders `--`** (SO has no policy number).
5. **Opty. Type** — new column ("SO"/"RO"). **Hidden by default** (`hide: true`)
   but available via the column chooser.

Navigation targets reuse existing opportunity detail routing, branching on each
row's `opportunityType` (SO vs RO detail route) so both types open correctly.

## 7. Out of scope / unchanged

- Existing `/opportunities` (Manage SO) and `/renewal-opportunities` (RO) pages
  remain for BD users under `My Sales Portfolio`.
- No change to opportunity detail pages beyond ensuring row navigation routes by
  type.

## 8. Open questions

All resolved — no open questions remain:

- Q1 (use read-ACL — §3.4/§4.1)
- Q2 (RO carries `roleKey = ROLE_ISG_EXECUTIVE` + `plannedAt` — confirmed, §5.0.1)
- Q3 (activity LOV assembled on the **frontend** — §5.4)
- Q4 (route/label)
- Q5 (KPIs)
- Q6 (ISG-Planning migration **dropped** — derived from existing data, §5.0.1)
- Q7 (status mapping via `mapOpportunityState` — §5.5)
- Q8 (ACL grants are DB-only and not in repo — elevated to hard prerequisite §5.0.4)
- Q9 ("Active" broadened on the frontend; Won/Lost reuse existing values; no
  backend mapper change — §5.5)

Only standing dependency is the **ops/DB prerequisite §5.0.4** (seed/verify the
ACL read grants), which is configuration, not a design question.

## 9. Implementation order (suggested)

DONE (commit `537f736796`): READ FeatureKeys (§5.0.2), detection unified on
read-ACL + role-key plumbing removed (§5.0.3), and the existing listing already
threads `visibleActivityRoleKeys` for display-activity filtering. Remaining:

0. **Ops/DB prereq (§5.0.4):** seed + verify `BD_READ_001` / `ISG_READ_001`
   grants (ISG roles → ISG read, BD roles → BD read, no cross-grant). Without
   this the menu never shows. Do/confirm before or alongside the menu step.
1. Backend: DTO `type=ALL` + `opportunityType` in the response. (API-testable)
   The §5.0.1 ISG-Planning EXISTS gate is **DONE** — applied in
   `getAllOpportunityList`: when the viewer is ISG-only
   (`visibleActivityRoleKeys === [ROLE_ISG_EXECUTIVE]`), an `isgPlanningCondition`
   bracket (`main.opportunityId IN (SELECT opportunity_id FROM
   opportunity_activity_map WHERE ref_role_key = ROLE_ISG_EXECUTIVE AND planned_at
   IS NOT NULL)`) is merged into `combinedCondition`. Applies to the existing
   listing endpoint (so Manage Quote SO/RO for ISG users), ahead of the combined
   screen. **Fires only when the user is detected ISG-only — depends on the ACL
   read grants (§5.0.4): `ROLE_ISG_MANAGER`/`ROLE_ISG_EXECUTIVE` must carry
   `ISG_READ_001` and not `BD_READ_001`, else they're unrestricted and the gate
   is skipped.**
2. Backend: activity LOV union + RO "Renewal" prefix handling + "RSR Creation/
   Data Validation" special case (if backend-sourced); status mapping per §5.5.
3. Frontend: new route `/manage-quotes` + page (clone RO) wired to `type=ALL`,
   `manageQuotesEntity`, default sort Expiry Date ascending (§6.1).
4. Frontend: tableConfig — column order, freeze first 3, SO Policy Number `--`,
   hidden Opty. Type column.
5. Frontend: filters — status LOV (Active/Won/Lost, §5.5), unique activity LOV,
   hidden Opty. Type toggle.
6. Frontend: navigation — row→detail by `opportunityType`, and back-nav returns
   to `/manage-quotes` via the state breadcrumb trail / origin marker (§11.2b).
7. Menu: replace Manage Quote RO/SO with single Manage Quotes gated on
   `viewIsgActivity` (add the boolean in `Layout`, §5.0.2).
8. Dashboard: hide SO/RO funnels + My Follow-up for ISG via the config map +
   `useDashboardWidgetVisibility` hook (§11.1).
9. Tests + manual verification of the four visibility example cases.

## 10. Other surfaces — no changes needed (verified)

These are scoped by the logged-in user's **ownership/hierarchy** (via
`ScopeService`), independent of BD/ISG activity role, so an ISG user already sees
only their own records and **no changes are required**:

- **Policy listing** and **My Client Portfolio** — owner/hierarchy scoped
  (`validateResourceScope` / `validateOpportunityScope`).

(Dashboard funnels and My Follow-up are addressed in §11 — they DO need an ISG
visibility change.)

## 11. Dashboard & cross-page navigation gating (ISG)

The only proactive cross-page entries into the SO/RO listings are the **dashboard
funnels** and **My Follow-up**. CompanyDetails navigates only to the *detail*
page (`/opportunities/:id`); its `/opportunities` breadcrumb is a return-trail
that renders only when the user arrived from the listing, so ISG never hits it —
no change. My Follow-up ([`MyFollowUp/index.tsx:113`]) and the Company breadcrumb
route type-specifically but are covered below / not reachable.

### 11.1 Hide SO/RO funnels + My Follow-up for ISG (frontend, configurable)

> **Superseded in part by §12.** §11.1 hid the SO/RO funnels and left ISG with
> nothing of their own; §12 adds the three **Placement** widgets (funnel,
> Placement Schedule by SBU, Placement Follow-Up) and moves the SO/RO *tables*
> under the same config map. The mechanism below (single config map + one hook)
> is unchanged — §12 only adds keys to it. `myFollowUp` splits into
> `soFollowUp` / `roFollowUp`.

For ISG-only users, hide the **Sales funnel**, **Renewal funnel**, and the **My
Follow-up** table so they are never routed to a listing not in their menu. Today
all three render together off a single `VIEW_OPPORTUNITY` check
(`BusinessPerformance/index.tsx:105, 867-893`) with no role split.

- Drive visibility from a **single config map** + one hook (easily flipped later):

    ```ts
    export const DASHBOARD_WIDGET_VISIBILITY = {
        salesFunnel:   { bd: true, isg: false },
        renewalFunnel: { bd: true, isg: false },
        myFollowUp:    { bd: true, isg: false },
    };
    ```

- `useDashboardWidgetVisibility()` reads `useActivityRoleVisibility()`
  (`canViewBD` / `canViewISG`) and returns a boolean per widget from the map.
  `BusinessPerformance` and `MyFollowUp` just check `visible.salesFunnel`, etc.
- This reuses the same ACL-based mechanism as the menu/listing — no role-name
  patterns — and is the one place to change when product later wants ISG to see a
  combined "Manage Quotes" funnel (out of scope now).

**Why not just withhold the dashboard permission?** Considered and rejected:
`VIEW_DASHBOARD` (`DASHBOARD`/`READ_001`) only gates the Celebrations and
Announcements widgets (`Dashboard/index.tsx:383-398`); the funnels
(`BusinessPerformance`) and My Follow-up / My Actionable render **regardless** of
it — so withholding it would NOT hide the funnels or follow-up (the actual goal)
and would only remove two harmless info widgets. Also the dashboard is the
post-login **landing page** (`auth.route.tsx:12`) and its **My Actionable**
widget shows the ISG user's own tasks/approvals/assignments — content ISG needs.
A blunt permission switch is the wrong granularity; the per-widget config map
hides exactly the BD-oriented widgets while keeping ISG's landing + My Actionable.

### 11.2 Manage Quotes gating confirmed

Menu item and route gated on `VIEW_ISG_ACTIVITY` (`viewIsgActivity`), NOT
`VIEW_OPPORTUNITY` — the opportunity-list API has **no backend ACL guard** (JWT
only, `opportunity.controller.ts:313`), and ISG users are identified by ISG read.

### 11.2b Back-navigation from the detail page (build task)

Row → detail navigation routes by `opportunityType` (§6.4). The **return** path,
however, is currently type-based: the detail breadcrumb
(`OpportunitiesDetails/detailsConfig.ts` `opportunityBreadcrumbs`) sends SO →
`/opportunities` and RO → `/renewal-opportunities`. So an ISG user who opens an
opportunity from Manage Quotes and clicks back would land on the type-specific
listing (which isn't in their menu), **not** on `/manage-quotes`.

Fix (part of the build): forward navigation from the Manage Quotes list already
passes a breadcrumb trail in `location.state` (`buildBreadcrumbState` /
`getBreadcrumbsFromState`, as the SO/RO listings do). Make the detail page prefer
that **state-provided origin/trail** over the hardcoded type-based breadcrumb when
present, so back returns to `/manage-quotes`. Pass an explicit origin marker (e.g.
`from: "MANAGE_QUOTES"` + the breadcrumb crumb) from the Manage Quotes list's
`onCellClicked`, mirroring how SO passes `from: "SO"`.

### 11.3 Known gap (separate workstream, not this spec)

Hiding the widgets for ISG removes the ISG-sees-BD-activity-name leak on the
dashboard. It does NOT fix the reverse: a **BD-only** user's funnel / My Follow-up
/ tasks can still surface an opportunity sitting in an ISG activity, leaking the
ISG activity name — because these APIs are NOT role-filtered:

- `/opportunity/pending-activities-summary` (My Follow-up)
- `/opportunity/sales-funnel` (funnels)
- `/opportunity/brokerage-summary` (business-performance-listing)
- `/task` (Manage Engagements)
- `/opportunity/company/:companyId` (Company Details opportunity tabs) — **FIXED**
  (now threads `visibleActivityRoleKeys`; see
  [[ROLE_BASED_ACTIVITY_VISIBILITY_LISTING_DASHBOARD_PLAN]] Part F.1). Was a gap;
  dormant (tabs commented out) but corrected for when re-enabled. Not hidden from
  ISG — data-level filter is the right fix here. Navigation is detail-only.

Only `/opportunity` (the listing) applies `getActivityRoleVisibility` /
`visibleActivityRoleKeys` today. Closing the BD→ISG leak means threading that
filter into the endpoints above — this belongs to the **dashboard
activity-visibility workstream** ([[ROLE_BASED_ACTIVITY_VISIBILITY_LISTING_DASHBOARD_PLAN]]
Part B/C), tracked separately from Manage Quotes.

## 12. Placement widgets on the dashboard (new)

ISG has a listing of its own (Manage Quotes) but no dashboard of its own: §11.1
hid the BD widgets and put nothing in their place. §12 adds the **Placement**
trio — the ISG mirror of the SO trio — and finishes the visibility split.

### 12.1 What gets added

| # | Widget | Mirrors | Data |
| --- | --- | --- | --- |
| 1 | **My Placement Funnel** | `SalesFunnel` | `sales-funnel?type=PLACEMENT` |
| 2 | **Placement Schedule by SBU** | `SbuPolicyExpiryTable` (Sales Schedule by SBU) | `sales-schedule-by-sbu?scope=PLACEMENT` |
| 3 | **Placement Follow Up** | `MyFollowUp status="SO"` | `pending-activities-summary?type=PLACEMENT` |

Confirmed decisions:

- **Scope = combined SO + RO.** "Placement" means *any* opportunity that has
    reached ISG Planning, regardless of type — the same population Manage Quotes
    lists. All three widgets drill into `/manage-quotes` with **no** `optyType`
    narrowing (unlike §11's SO-only drilldowns).
- **Funnel bars = ISG Planning + 6 placement milestones — FINAL (2026-07-31).**
    First bar counts every opportunity past the ISG gate (`stageName:
    "ISG Planning"`, `table: null`), then Broking Slip Generation → QCR
    Generation → Placement Slip Generation → Held Cover Note → Policy Hard Copy
    Receipt → Policy Confirmation. 7 bars.
    History, because it went back and forth: the first cut had 3 activity bars
    (mirroring the SO funnel's abbreviated 5-bar list — wrong), then all 11
    ISG-role stages derived from the stage template (12 bars — too many), now this
    explicit 6. **Deliberately excluded** ISG-role stages: Enter Quote, Meeting
    for Final Negotiation, Premium Calculation, Policy Docket, Hand over Meet.
    Hardcoded, like the SO/RO lists — the bars are a product choice, not
    "whatever the template contains", so the DB-derived version was dropped.
- **Audience = ISG + unrestricted (leadership / super / CS).** BD-only users do
    not see the Placement trio.

### 12.2 The gate is the existing one — reuse, don't re-derive

"Reached ISG" already has exactly one definition:
`buildActivityRoleStageGate(visibleActivityRoleKeys, forceIsgReached)` in
[opportunity.repository.ts](../../../../../services/opportunity-service/src/app/opportunity/opportunity.repository.ts)
(~line 12294) — an `opportunity_activity_map` row with
`ref_role_key = ROLE_ISG_EXECUTIVE AND planned_at IS NOT NULL`, OR
`statusLid = ISG_PLANNING` (see §5.0.1 for why planning stays synthetic).

Call it with `forceIsgReached = true` for all three placement queries. That flag
already exists and already ignores the viewer's role, which is precisely what
leadership needs: the widget is scoped by *stage*, not by *who is looking*.

> Alias caveat: the gate emits `main.opportunityId` / `main.statusLid`, while the
> funnel and SBU builders alias the root as `opportunity`. Add an `alias` param
> to `buildActivityRoleStageGate` (default `"main"`) rather than string-replacing
> at the call site.

### 12.3 Backend — three additive params, no new endpoints

**A. `sales-funnel?type=PLACEMENT`** —
`getActivityBrokerageSummary` / `getSalesFunnelData` (repo ~line 15020) take
`type: "SO" | "RO" | "PLACEMENT"`. When `PLACEMENT`:

- Skip the `opportunityTypeLid` equality filter (both types are in scope).
- Replace the `type === "RO"` `refPolicyId IS NOT NULL` rule with
    `(opportunityTypeLid = SO OR refPolicyId IS NOT NULL)` — an RO without a
    linked policy still isn't real pipeline.
- Use the ISG stage list (12.1) instead of the 5-stage BD list:
    `OpportunityRepository.ISG_FUNNEL_STAGES`, a static array of
    `{ stageName, table }` — ISG Planning with `table: null` then the six
    milestones. `stageName` values must stay in sync with the keys of
    `ACTIVITY_NAME_TABLE_MAP`, because that is what `getActivityTableName`
    resolves a bar's drilldown through; use the `ACTIVITY_NAME` /
    `OPPORTUNITY_ACTIVITY` constants and they will. Note the label is
    "Policy Hard Copy **Receipt**" (the activity's real name) even though product
    shorthand says "Policy Hard Copy".
    An earlier version derived this list from `mstr_stage_activity_template` →
    `mstr_stage` by `ref_role_key`; dropped, since the bar set is narrower than
    "all ISG stages" and can't be derived from role alone.
    Labels are safe as SO names — **verified 2026-07-29**:
    the ISG activities are spelled identically in `RO_ACTIVITY_NAME`
    ([constants.ts:1499, 1524](../../../../../services/service-lib/src/lib/constants.ts#L1499)),
    so the combined funnel needs no per-type label split. Only BD-side activities
    are renamed for RO (`Data Validation`→`RSR Creation`,
    `KDM Meeting`→`Renewal KDM Meeting`) and those bars are not in this funnel.
- **No combined `"SO / RO"` labels — NOT BUILT (decided 2026-07-30).** Every ISG
    activity is named identically in both workflows, so there is nothing to
    disambiguate and the code was removed rather than kept for a case that does
    not exist. The rule if one ever diverges: show both, SO first, separated by
    `/` (`"Data Validation / RSR Creation"`) — the house pattern in
    `PENDING_ACTIVITIES_ALL_TYPE_LABELS` (constants.ts ~1543) and the Manage
    Quotes activity LOV (§5.4). Two places would need to change:
    `getIsgFunnelStages` (build the label from `name` + `roName`) and
    `getActivityTableName`, which is exact-match-only and would resolve no table
    for a combined label — silently widening the drilldown.
- `andWhere(await this.buildActivityRoleStageGate(null, true, undefined, "opportunity"))`.
- Everything else (expiry window ±`EXPIRY_BUFFER_DAYS`, `completedAt` stage
    membership, `enabledForPerformanceLid`, owner/leadership scoping, insurer
    subquery) is untouched — the placement funnel must reconcile with the SO
    funnel's ISG bars for SO opportunities, so it cannot fork that logic.

**B. `sales-schedule-by-sbu?scope=PLACEMENT`** —
`getSalesScheduleBySbu` (repo ~line 19449) currently hardcodes the SO type
lookup. Under `PLACEMENT`: drop that filter, apply the same
`(SO OR refPolicyId IS NOT NULL)` rule and the ISG gate. Buckets, buffer, and
lost/closed exclusion stay as-is.

**C. `pending-activities-summary?type=PLACEMENT`** —
`getPendingActivitiesSummary` (repo ~line 15823) already builds the rows in two
groups (`bdActivityItems`, `isgActivityItems` + the two synthetic planning rows)
and picks groups by the **viewer's** `canViewBD` / `canViewISG` (~line 16905).
Add `PLACEMENT` to the `type` union:

- No `opportunityTypeLid` filter (SO + RO), plus the ISG gate.
- Return `[isgPlanningItem, ...isgActivityItems]` regardless of viewer role, so
    leadership sees it too. Summary totals derive from `items`, so they follow.

**D. No row de-duplication (CONFIRMED 2026-07-29).** An unrestricted viewer
sees the ISG rows twice — once inside SO/RO Follow-Up (which returns both groups
for them) and once in Placement Follow-Up. Accepted: the two tables answer
different questions (per-type pipeline vs placement workload), and leaving SO/RO
Follow-Up alone means **no existing totals change for anyone**. Do not add group
scoping to the SO/RO callers. BD-only and ISG-only viewers see one group each,
as today.

**Invariant for all three widgets:** rows/bars/buckets count **only**
ISG-Planning-stage work — the ISG gate is mandatory on every query, and the
follow-up returns only the ISG row group. Every drilldown lands on
`/manage-quotes`; none of them may route to `/opportunities` or
`/renewal-opportunities`.

### 12.4 Frontend — config map does the visibility work

[useDashboardWidgetVisibility.ts](../../../../../ui-lib/src/lib/rbac/useDashboardWidgetVisibility.ts)
stays the only visibility switch. New map (note `myFollowUp` splits, and the two
SBU tables come under the map — `salesScheduleBySbu` and `renewalScheduleBySbu`
render **ungated** today, `BusinessPerformance/index.tsx:1119, 1206`):

```ts
export const DASHBOARD_WIDGET_VISIBILITY = {
  salesFunnel:            { bd: true,  isg: false },
  salesScheduleBySbu:     { bd: true,  isg: false },
  soFollowUp:             { bd: true,  isg: false },
  // RO widgets ARE shown to ISG — revised 2026-07-30, see 12.4a
  renewalFunnel:          { bd: true,  isg: true  },
  renewalScheduleBySbu:   { bd: true,  isg: true  },
  roFollowUp:             { bd: true,  isg: true  },
  placementFunnel:        { bd: false, isg: true  },
  placementScheduleBySbu: { bd: false, isg: true  },
  placementFollowUp:      { bd: false, isg: true  },
  myBusinessPerformance:  { bd: true,  isg: false },
} as const;
```

`{ bd: false, isg: true }` gives the Placement trio to ISG-only users **and** to
leadership / super / CS, because the hook resolves unrestricted viewers as
`canViewBD && canViewISG` — the exact inverse of the `myBusinessPerformance`
trick already in the file. No new mechanism, no role-name matching.

The two SBU tables are hidden by the **same mechanism as the SO funnel**
(CONFIRMED 2026-07-29) — a config-map key and a `{visible.x && ...}` wrapper,
nothing new.

Net visibility for ISG-only users: the SO trio is hidden, the RO trio and the
Placement trio are shown. Nothing changes for BD-only users, and nothing changes
for leadership except the three new widgets appearing.

### 12.4a RO widgets for ISG — REVISED 2026-07-30

§11.1 hid the Renewal funnel from ISG, and the first cut of §12 hid RO by SBU
and RO Follow-Up too. **Reversed:** renewals are part of ISG's book, so all
three RO widgets are now `{ bd: true, isg: true }`.

**RO drilldowns go to `/renewal-opportunities` for everyone, ISG included**
(confirmed 2026-07-30). They were briefly routed to Manage Quotes narrowed to
`optyType: [RO]` — by analogy with the SO widgets, which do route ISG-only
viewers away because the SO listing isn't in their menu — and that was reverted.

Why the RO case is genuinely different from SO, despite the same menu situation:

- The `/renewal-opportunities` **route carries no PermissionGuard**
    (`renewalOpportunitiesRoutes.tsx`), so an ISG user can open it even though the
    menu doesn't list it. Nothing 403s.
- The RO listing **role-gates its own rows**: for an ISG-only viewer
    `getAllOpportunityList` applies the ISG-Planning gate, so they see only
    ISG-reached ROs. There is no data leak to route around.

So the routing split is: SO widgets → Manage Quotes (narrowed to SO) for ISG-only
viewers; RO widgets → RO listing for everyone; Placement widgets → Manage Quotes
with no narrowing, always. The flag is still named `routeToManageQuotes` (renamed
from `routeSoToManageQuotes` when it briefly covered RO); condition unchanged,
`canViewISG && !canViewBD`.

Components:

- **Funnel:** no third clone. `SalesFunnel.tsx` and `RenewalFunnel.tsx` differ
    only by endpoint + `chartKey`; give `SalesFunnel` a `type` prop
    (`"SO" | "PLACEMENT"`, default `SO`) that appends `&type=PLACEMENT` and sets
    `chartKey="PLACEMENT"`.
- **SBU table:** reuse `SbuPolicyExpiryTable` with the placement URL and a
    `handlePlacementScheduleBucketClick` cloned from
    `handleSalesScheduleBucketClick` but routing to `/manage-quotes` with no
    `optyType`.
- **Follow-up:** `MyFollowUp` accepts `status="PLACEMENT"`; in `onCellClicked`,
    `PLACEMENT` routes to `/manage-quotes` (`BREADCRUMB_KEYS.MANAGE_QUOTES`)
    without the `optyType: [SO]` narrowing, and keeps the existing planning-row
    `createdAt` handling (ISG Planning is a planning row — see the
    `PLANNING_ACTIVITY_NAMES` branch, [MyFollowUp/index.tsx:124](../../components/MyFollowUp/index.tsx#L124)).
- **`onFunnelClick`** (`BusinessPerformance/index.tsx:662`): add the `PLACEMENT`
    branch → `/manage-quotes`. The bar named `"ISG Planning"` must send
    `activityName: ["ISG Planning"]` with **no** `state: ["Active"]` (synthetic
    planning row, same rule as My Follow-up), unlike the `"SO"`/`"RO"` head bars
    which send no activity name at all.
- **Labels:** `BUSINESS_PERFORMANCE.LABELS` += `MY_PLACEMENT_FUNNEL`,
    `PLACEMENT_SCHEDULE_BY_SBU`, `PLACEMENT_FOLLOW_UP`. Copy says "Placement",
    never "SO".
- **Placement in the page:** the trio renders as one block immediately after the
    SO trio (funnel → SBU → follow-up), so an ISG-only user's dashboard opens on
    Placement.

### 12.5 Build order — ALL STEPS DONE 2026-07-29

Implementation notes worth keeping:

- The funnel DTO (`GetOpportunityBrokerageSummaryDto`) is **inherited** by
    `GetOpportunityMonthlyBrokerageBreakdown` (brokerage-summary), so widening
    `type` leaked PLACEMENT there; brokerage-summary now 400s on it.
- `SalesFunnel` took a `type` prop and `handleSalesScheduleBucketClick` took an
    `isPlacement` flag instead of cloning either — the placement variants differ
    only in the type param and the drilldown target.
- `ui-lib` must be rebuilt (`npx nx build ui-lib`) before iwork typechecks: iwork
    resolves `@ui/ui-lib` to `dist`, so new config-map keys and labels are
    invisible until then.


1. Backend A (funnel `type=PLACEMENT`) + the `alias` param on the gate.
2. Backend C (`pending-activities-summary` `type=PLACEMENT`) — additive only, the
     SO/RO/ALL paths are not touched (12.3-D).
3. Backend B (`sales-schedule-by-sbu?scope=PLACEMENT`).
4. Frontend: config map keys + gate the two SBU tables and split `myFollowUp`.
5. Frontend: the three widgets, drilldowns, labels.
6. Verify per 12.6.

### 12.6 Test plan

- **ISG-only:** sees exactly the Placement trio (+ My Actionable, Celebrations,
    Announcements); no SO/RO funnel, SBU or follow-up widget anywhere.
- **BD-only:** unchanged from today, including the SO/RO SBU tables that were
    previously ungated.
- **Leadership / super:** sees all nine widgets; Placement numbers are org-wide,
    not self-scoped, and an explicit owner pick scopes them (same
    `explicitOwnerSelected` demotion as the SO funnel).
- **Reconciliation:** for a single SO opportunity past the ISG gate, its
    Broking Slip / QCR / Placement Slip bars must match the SO funnel's bars for
    the same filters. A divergence means the placement path forked the shared
    query instead of reusing it.
- **Drilldowns:** every Placement bar/bucket/cell lands on `/manage-quotes` with
    both types present and the count matching the widget.
- **RO-without-policy** is excluded from all three Placement widgets.
- **ISG-gate only:** an opportunity sitting in a BD stage (e.g. KDM Meeting,
    WIP status, no ISG `plannedAt`) appears in **no** Placement widget — the
    trap here is `Work In Progress` status, which does *not* mean ISG-reached
    (§5.0.1).
- **Existing widgets unchanged:** SO/RO Follow-Up row counts and totals are
    byte-identical before and after, for every role (12.3-D).

### 12.7a Post-build fixes (2026-07-30)

Found on first look at the rendered funnel:

1. **Only 4 bars** — the stage list was built by analogy with the SO funnel, which
     charts 5 of 18 stages. Placement wants ALL ISG stages; now derived
     (`getIsgFunnelStages`, 12.3-A). 12 bars in the current template.
2. **Drilldown counts under the funnel counts.** Two causes:
     - **The funnel counts and the funnel drilldown are SEPARATE query builders.**
         `getActivityBrokerageSummary` builds its predicates inline;
         `buildFunnelStageDrilldownCondition` → `buildFunnelStageQuery` builds them
         again. The "single source of truth" comment on `buildFunnelStageQuery` is
         **stale** — the two are copies that happen to agree, so ANY funnel scoping
         change must be made in both. The placement rules had landed only on the
         counts side; `buildFunnelStageQuery` now takes `placementSoTypeLid` +
         `isgGate`.
     - The service resolved a combined (`type=ALL`) funnel drill as `"SO"`, which
         dropped every RO row. It now maps `ALL` → `PLACEMENT` — Manage Quotes is
         the only combined screen, so a combined funnel drill can only be a
         placement drill. `performanceCondition` gained the matching
         `(SO OR refPolicyId)` rule for `ALL`.
     - The **head bar** sent `activityName: ["ISG Planning"]`, which the listing
         treats as a planning-status drilldown (a different question: "rows
         displaying that stage"). It now sends no activity name, like the SO/RO
         head bars, so the listing reproduces the funnel's own set.
3. **Combined labels — built, then removed the same day (2026-07-30).** Bars
     briefly rendered `"<name> / <roName>"` when the two columns differed, with a
     matching `/`-aware lookup in `getActivityTableName`. Removed on confirmation
     that no ISG activity's names diverge: the branch could never fire, so it was
     pure speculative complexity in a shared helper. `helper.utils.ts` is back to
     its original state. See 12.3-A for what to change if that ever stops holding.
     Worth keeping in mind though: the funnel reads `mstr_activity.name` /
     `.roName`, so comparing the `ACTIVITY_NAME` / `RO_ACTIVITY_NAME` **constants**
     is not by itself proof the DB rows agree.

Frontend count-sensitivity found in `Funnel.tsx` (all of it latent before, since
nothing had more than 5 stages): `fillColors` was indexed directly and holds 10
colours (bars 11-12 rendered unfilled — now cycles); the chart height was pinned
at 400px while the stage list grows per row (now scales by row count, baseline 7
rows = 400px so SO/RO are pixel-identical); the `fixedVisuals` duplicate-shape
fallback held 6 entries and fell back to computed values beyond that, mixing two
scales mid-funnel (now decays at the series' final ratio).

### 12.7 Open items

1. ~~Confirm the ISG activity names match across SO and RO.~~ VERIFIED — they
     match; combined-label policy is `SO / RO` when any label does diverge (12.3-A).
2. §11.3's BD→ISG leak is still open: a BD-only user's SO funnel and follow-up
     can still name ISG activities. Placement widgets don't change that.

Nothing blocking. Spec is implementation-ready.
