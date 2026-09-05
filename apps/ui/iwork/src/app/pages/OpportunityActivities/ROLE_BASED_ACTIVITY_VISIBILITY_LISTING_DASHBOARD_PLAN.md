# Plan: Role-Based Activity Visibility — Listing and Dashboard

Extends the detail-page work (see
[ROLE_BASED_ACTIVITY_VISIBILITY_SPEC.md](ROLE_BASED_ACTIVITY_VISIBILITY_SPEC.md))
to the opportunity listing pages and the dashboard. Same rule: BD users do not see
ISG activities and ISG users do not see BD activities; users holding both capability
sets see everything. Reuse the existing `useActivityRoleVisibility` hook
(`{ canViewBD, canViewISG }`) on the frontend.

## 0. Key difference from the detail page

The detail endpoint (`/opportunity/activities/:opportunityId`) already returns
activities grouped by role, so filtering was purely frontend. The listing and
dashboard responses do **not** carry any BD/ISG discriminator today, so each needs a
backend change to expose `role` before the frontend can filter. The underlying data
exists:

- `OpportunityActivityMap.roleKey` (`ref_role_key`) holds
    `ROLE_BD_EXECUTIVE` / `ROLE_ISG_EXECUTIVE`
    ([opportunity-activity-map.entity.ts](../../../../../services/service-lib/src/lib/entities/opportunity-activity-map.entity.ts)).
- `Task` has `@ManyToOne(() => OpportunityActivityMap)` on `activity_id`
    ([task.entity.ts](../../../../../services/service-lib/src/lib/entities/task.entity.ts) line ~139),
    so a task's activity role is one join away.

Map `roleKey` to the `"BD"` / `"ISG"` discriminator the same way the detail
repository already does (`ROLE_KEY.ROLE_BD_EXECUTIVE ? ROLES.BD : ROLES.ISG`,
[opportunity.repository.ts](../../../../../services/opportunity-service/src/app/opportunity/opportunity.repository.ts) ~line 3615).

## Part A — Opportunity Listing

### A.1 Affected files

- Sales:
    [OpportunitiesListing/index.tsx](../OpportunitiesPage/OpportunitiesListing/index.tsx),
    [OpportunitiesListing/tableConfig.ts](../OpportunitiesPage/OpportunitiesListing/tableConfig.ts)
- Renewal:
    [RenewalOpportunityListing/index.tsx](../RenewalOpportunityPage/RenewalOpportunityListing/index.tsx),
    [RenewalOpportunityListing/tableConfig.ts](../RenewalOpportunityPage/RenewalOpportunityListing/tableConfig.ts)
- Backend listing: `getAllOpportunities` /
    `resolveDisplayActivityForOpportunity` /
    `getWorkInProgressActivityNameByOpportunityId` /
    `getPendingActivityDetailsForDisplay` in
    [opportunity.repository.ts](../../../../../services/opportunity-service/src/app/opportunity/opportunity.repository.ts)
- Activity filter dropdown source: `getAllActivityIdAndName` (controller
    `activity-details`, ~line 838).

### A.2 What the listing shows today

Each opportunity row shows a single "Activity name" / "stage name" — the current
display activity, chosen by `resolveDisplayActivityForOpportunity`: the pending
activity if any, else the work-in-progress activity. There is no per-row role, and
the row is one activity, not a list. The "Activity name" column also has a
multiselect filter populated from `getAllActivityIdAndName` (all activities,
SO or RO), with no role scoping.

### A.3 Listing behavior — CONFIRMED: role-aware display activity

Decision (confirmed): the backend computes the display activity per the requesting
user's visible role(s). A BD-only user sees the most recent/relevant BD activity for
that opportunity; an ISG-only user sees the ISG one; dual-role users see the true
current activity (today's behavior). Nothing in the row is hidden — the activity cell
just reflects the viewer's role. This drives the backend shape in A.4.

Rejected alternatives (for the record): expose-role-and-blank-cell (cells can go
empty, inconsistent sorting/filtering) and hide-whole-rows (a BD user would lose
mid-ISG-stage opportunities entirely).

### A.4 Backend changes (option 1)

- Thread the requesting `userId` (already available in the controller via
    `req.headers.userid`) and the derived visible roles into `getAllOpportunities`
    and down to `resolveDisplayActivityForOpportunity`.
    - Resolving "visible roles" on the backend: reuse the same RBAC the frontend
        hook uses. Confirm the opportunity-service can read the user's
        BD/ISG activity permissions (via the auth/permission service or the
        `scopeService` already injected in this controller). If backend RBAC for
        these specific feature keys is not readily available server-side, fall back
        to option 2 (send `activityRole`, filter on frontend) — see A.7.
- In `getWorkInProgressActivityNameByOpportunityId` and
    `getPendingActivityDetailsForDisplay`, add `roleKey` to the `select` and to the
    `where` (filter `roleKey IN visibleRoleKeys`) so the chosen activity already
    respects the viewer's roles. Keep ordering (`activityOrder`) so "most recent
    visible activity" is well-defined.
- Add `activityRole` (`"BD"` / `"ISG"`) to the `OpportunityDto` row for display/
    debugging and to support option 2 if chosen.

### A.5 Activity-name filter dropdown

Scope `getAllActivityIdAndName` to the viewer's visible roles so a BD user's filter
list contains only BD activities (and vice versa). Add a `roleKeys`/`role` query
param to `activity-details` (and `activity-details?type=RO`) and pass the visible
roles from the listing component. The `Activity` master must expose role; if it does
not, derive the role set from `OpportunityActivityMap`/stage-role mapping instead.
Dual-role users get the full list.

### A.6 Frontend changes

- In both listing `index.tsx` files, call `useActivityRoleVisibility()` and pass the
    visible roles to the listing query (new request param) and to the activity-filter
    dropdown query.
- No row-level filtering needed under option 1 (backend already role-aware). Under
    option 2, blank/replace the activity cell in `tableConfig` when
    `row.activityRole` is not visible.

### A.7 Fallback if backend cannot resolve user roles server-side

Implement option 2: backend returns `activityRole` per row (cheap — just map
`roleKey`), and the frontend hides/replaces the cell using
`useActivityRoleVisibility`. The filter dropdown is still scoped client-side by
omitting non-visible activities. Document the limitation (empty activity cell) and
confirm with product.

## Part B — Dashboard ("My Actionable" / ManageEngagements)

### B.1 Affected files

- [ManageEngagements/index.tsx](../ManageEngagements/index.tsx) — the "My Actionable"
    widget embedded in [Dashboard/index.tsx](../Dashboard/index.tsx) (~lines 304-308).
    Tabs: All, Sales activities, Approvals, Assignments.
- [TaskCard](../ManageEngagements) component (renders each item).
- Backend: task list query/transform in
    [task.repository.ts](../../../../../services/opportunity-service/src/app/task/task.repository.ts)
    (transform ~lines 694-773), controller `/task`
    ([task.controller.ts](../../../../../services/opportunity-service/src/app/task/task.controller.ts) ~line 115).

### B.2 What the dashboard shows today

`endPoints.getTasks` (`/task?page=1&limit=1000`) returns tasks scoped by `viewBy`
(self / self_team / self_org) and `taskType` (Activity / Task / Approval /
Assignment). The "Sales activities" tab shows `taskType === "Activity"` items. The
task transform does **not** include the activity's role. With `viewBy = self`, tasks
are the user's own (already role-appropriate), but `self_team` / `self_org` views can
surface other-role activities.

### B.3 Backend change

- In the task query, join `task.activity` (→ `OpportunityActivityMap`) and select
    `activity.roleKey`. Add `role` (`"BD"` / `"ISG"` / `null` for non-activity tasks)
    to the task transform output.
- Optionally accept a `roleKeys` filter param on `/task` so the server can filter
    Activity-type tasks by role directly (preferred for the team/org views, avoids
    over-fetching). Non-activity task types (pure Task/Approval/Assignment with no
    `activity_id`) are unaffected — `role` is `null` and they always show.

### B.4 Frontend change

- In `ManageEngagements`, call `useActivityRoleVisibility()`.
- When distributing tasks into tabs, filter `taskType === "Activity"` items by role:
    keep an item if its `role` is `null` (not an activity-bound task) or if its role
    is visible (`role === "BD" ? canViewBD : canViewISG`).
- Apply the same filter to the "All" tab's activity entries so counts stay
    consistent. Approvals/Assignments tabs already gate on their own permissions;
    only add role filtering there if those items are activity-bound and product wants
    it.

### B.5 Decision required — team/org views

For `self_team` / `self_org`, confirm whether role filtering should still apply
(a BD manager viewing the team might legitimately want to see ISG activity tasks).

Default if unanswered: apply the same role filter in all views for consistency with
the detail page; revisit if product wants managers to see across roles.

## Part C — Cross-cutting

- **Dual-role users**: `canViewBD && canViewISG` → everything visible, no filtering.
    Consistent across detail, listing, dashboard.
- **Role-source single point of truth**: the frontend hook derives roles from RBAC
    feature keys. If backend filtering is added (A.4 / B.3), the backend must derive
    the same set from the same permissions, or we risk listing/dashboard disagreeing
    with the detail page. Decide one canonical resolver.
- **Counts and funnels**: `sales-funnel` / `pending-activities-summary` /
    `brokerage-summary` are aggregate counts, not per-activity lists. Out of scope
    unless product wants the aggregates role-scoped too — flag as a follow-up
    question rather than silently changing totals.
    **Update:** rather than role-scoping the existing aggregates (which would make
    a BD funnel incomplete), the ISG side gets its own **Placement** aggregates —
    a Placement funnel, Placement Schedule by SBU and Placement Follow-Up, all
    gated on "reached ISG Planning" rather than on the viewer's role. See
    [[MANAGE_QUOTES_SPEC]] §12. `pending-activities-summary` is already
    viewer-role-scoped (Part F table below); §12.3-D revisits its row grouping so
    ISG rows don't appear twice for unrestricted viewers.

## Part D — Sequencing

1. Backend: add `roleKey`→`role` exposure on the task query (B.3) and the listing
    display-activity resolver (A.4), plus role-scoping for the activity-name filter
    (A.5). Land behind the existing endpoints (additive fields/params, backward
    compatible).
2. Frontend: wire `useActivityRoleVisibility` into `ManageEngagements` (B.4) and the
    two listing pages (A.6), passing role params to queries.
3. Verify per the test plan below.

## Part E — Test plan

- BD-only user: listing activity cell/filter shows BD activities only; dashboard
    "Sales activities" and "All" tabs exclude ISG activity tasks; non-activity tasks
    still show.
- ISG-only user: mirror of the above.
- Dual-role user: listing, dashboard, and detail all show everything (no regression).
- `viewBy` = self vs team vs org behaves per the B.5 decision.
- Renewal (RO) listing parity with sales (SO).
- Aggregate funnels/counts unchanged (unless C decision says otherwise).

## Open decisions (confirm before building)

1. ~~**A.3** — Listing behavior.~~ CONFIRMED: role-aware display activity (see A.3).
2. **Role resolver (now the critical one)** — Can opportunity-service resolve the
    user's BD/ISG activity permissions server-side? A.3's role-aware display activity
    requires the backend to know the viewer's visible roles. Needs investigation: can
    the opportunity-service reach the permission/auth service (or the injected
    `scopeService`) for these feature keys, or is a new call/contract required?
3. **B.5** — Whether role filtering applies to team/org dashboard views.
4. **C** — Whether aggregate funnels/summary counts should also be role-scoped.

## Part F — Activity-name leak audit (all surfaces)

Audit of every surface that shows a per-opportunity activity/stage name, and
whether it applies the role filter (`getActivityRoleVisibility` →
`visibleActivityRoleKeys` → `roleKey IN (...)`). Goal: ISG users never see BD
activities and BD users never see ISG activities, everywhere — not just the
detail page.

| Surface | API | Kind | Role-filtered? |
| --- | --- | --- | --- |
| Opportunity listing | `/opportunity` | per-opty display activity | ✅ done (commit `537f736796`) |
| Company Details opportunities | `/opportunity/company/:companyId` | per-opty display activity | ✅ **done now** (see below) |
| My Follow-up | `/opportunity/pending-activities-summary` | aggregate counts | ❌ gap |
| Sales / Renewal funnel | `/opportunity/sales-funnel` | aggregate pipeline | ❌ gap (see caveat) |
| Business-performance-listing | `/opportunity/brokerage-summary` | aggregate | ❌ gap |
| Manage Engagements (tasks) | `/task` | per-task activity name | ❌ gap |

### F.0 Done — Activity-type LOV (`activity-details`, smart-search filter)

`GET /opportunity/activity-details` (the activity-type dropdown in smart search)
previously listed ALL activities for both roles. Now role-filtered:

- Controller reads `userId`; service resolves `visibleActivityRoleKeys` via the
    shared `resolveVisibleActivityRoleKeys`; repo `getAllActivityIdAndName` takes
    it and, when single-role, restricts to activities whose **stage** carries a
    visible role — joining `mstr_stage_activity_template` → `mstr_stage`
    (`ref_role_key IN (...)`), since the role lives on the stage, not the activity.
- Null/unrestricted → all activities (unchanged). So ISG users no longer see BD
    activities in the filter LOV, and BD users no longer see ISG activities.

Status LOV (smart-search "Opty Status") — done **frontend** (it's a static
constant, not an API): `filterStatusOptionsByRole(options, canViewBD, canViewISG)`
in `constants/index.ts` drops BD/Renewal Planning when `!canViewBD` and ISG
Planning when `!canViewISG` (Active/Won/Lost stay). `tableSearchConfig` (SO + RO)
takes `canViewBD`/`canViewISG`; the listings pass them from
`useActivityRoleVisibility()`.

### F.1 Done — Company Details endpoint (per-opty, clean reuse)

`/opportunity/company/:companyId` now threads the viewer's role keys into the
display-activity resolver, identical to the listing:

- `opportunity.controller.ts` — `getOpportunitiesByCompanyId` reads `userId` from
    the request header and passes it down.
- `opportunity.service.ts` — extracted a shared private helper
    `resolveVisibleActivityRoleKeys(userId)` (BD-only → `[BD]`, ISG-only → `[ISG]`,
    both/neither → `null`). The main listing path was refactored to use it too, so
    the derivation lives in one place. `getOpportunitiesByCompanyId` now accepts
    `userId`, resolves the keys, and passes `visibleActivityRoleKeys` to the repo.
- `opportunity.repository.ts` — `getOpportunityByCompanyId` accepts
    `visibleActivityRoleKeys` and forwards it to
    `getWorkInProgressActivityNameByOpportunityId(opportunityId, visibleActivityRoleKeys)`
    (the method already supported the param).

Note: the Company Details SO/RO opportunity tabs are currently commented out in
`CompanyDetails/detailsConfig.ts` — this fix makes the API correct for when they
are re-enabled. Company Details is NOT hidden from ISG (they use "My Companies"),
so the data-level filter — not hiding — is the right fix here.

### F.2 Remaining — per-task and aggregate surfaces

- **`/task` (Manage Engagements / My Actionable)** — per-task activity name; same
    pattern as B.3 (join `task.activity`, filter/scope by `roleKey`). This one is
    LIVE for ISG users (My Actionable shows their tasks), so it matters most.
- **`/opportunity/pending-activities-summary` (My Follow-up)** and
    **`/opportunity/sales-funnel`**, **`/opportunity/brokerage-summary`** —
    resolved for the ISG side by the Placement widgets ([[MANAGE_QUOTES_SPEC]]
    §12): stage-gated ISG aggregates instead of role-filtered BD aggregates. These
    are **aggregate** counts/pipelines, not per-record activity names. For Manage
    Quotes we HIDE the funnels + My Follow-up from ISG (see Manage Quotes spec §11),
    which covers the ISG side. **Caveat (Part C decision):** role-filtering a sales
    *funnel* changes its totals — a BD pipeline naturally spans BD→ISG stages, so
    excluding ISG stages would make the funnel incomplete. Confirm with product
    before filtering aggregates; the per-record surfaces (listing, company, tasks)
    are the unambiguous ones.

## Part G — ISG users cannot create opportunities — via ACL (DONE)

Rule: ISG users may not create opportunities — origination is a BD responsibility.

**Approach: rely on the `CREATE_OPPORTUNITY` capability, not a code-level ISG
block.** ISG roles must simply NOT be granted `CREATE_OPPORTUNITY` (ACL config —
same family as the §5.0.4 read-grant requirement). Then the existing
permission checks already block them, and dual-role (BD+ISG) users still create
because they hold it via their BD role. (An earlier `blockIsgOnly` /
`useCanCreateOpportunity` hook approach was implemented then **reverted** — it was
redundant with the ACL and hardcoded policy that belongs in role grants.)

What the existing checks cover once ISG lacks `CREATE_OPPORTUNITY`:

- `OpportunitiesListing`, `RenewalOpportunityListing`, `ContactSelector` —
    already gated by `selectHasPermission(CREATE_OPPORTUNITY)` (unchanged).
- Route `opportunities/new` — already guarded by
    `PermissionGuard feature={CREATE_OPPORTUNITY}` (unchanged).

Additive fixes made (needed regardless of ISG — these were unprotected before):

- `CompanyOpportunities` / `ContactOpportunities` "Add opportunity" buttons were
    **ungated**; now gated with `selectHasPermission(CREATE_OPPORTUNITY)`.
- Legacy route `opportunities/new1` was **unguarded**; now wrapped in
    `PermissionGuard feature={CREATE_OPPORTUNITY}`.

Dependencies / follow-ups:

- **ACL config:** confirm `CREATE_OPPORTUNITY` is not granted to ISG roles.
- Backend `POST` create endpoint is not role-guarded (defense-in-depth follow-up).

## Part H — Required ACL grants (admin config)

This feature works only if the role→ACL grants below are configured in the DB
(they are NOT seeded in the repo). ActionKey values: `READ`=`READ_001`,
`WRITE`=`WRITE_001`, `UPDATE`=`UPDATE_001`; scope is `iWork` for all.

### H.1 Component → permission it renders / behaves on

| Component / surface | FeatureKey | ACL (scope · category · action) |
| --- | --- | --- |
| Any opportunity listing (Manage SO / RO / Quote) renders | `VIEW_OPPORTUNITY` | iWork · `OPPORTUNITY` · `READ_001` |
| Manage Quotes menu item + route (ISG) | `VIEW_ISG_ACTIVITY` | iWork · `ISG_ACTIVITY` · `ISG_READ_001` |
| Sees BD activities (names, stages, BD-Planning option, BD funnel) | `VIEW_BD_ACTIVITY` | iWork · `BD_ACTIVITY` · `BD_READ_001` |
| Sees ISG activities (names, stages, ISG-Planning option) | `VIEW_ISG_ACTIVITY` | iWork · `ISG_ACTIVITY` · `ISG_READ_001` |
| Add / Create opportunity buttons + create routes (`/opportunities/new`, `new1`) | `CREATE_OPPORTUNITY` | iWork · `OPPORTUNITY` · `WRITE_001` |
| Edit opportunity route (`/opportunities/:id/edit`) | `EDIT_OPPORTUNITY` | iWork · `OPPORTUNITY` · `UPDATE_001` |

### H.2 How the BD/ISG read pair drives the filtered surfaces

The listing row gate, activity-name display, activity LOV, and status LOV always
render but filter their CONTENT by the COMBINATION of the two reads:

| Reads held | Treated as | Behaviour |
| --- | --- | --- |
| `BD_READ_001` only | BD-only | BD activities only; sees all stages |
| `ISG_READ_001` only | ISG-only | ISG activities only; ISG-Planning row gate applies |
| both | unrestricted | everything (no filtering) |
| neither | unrestricted | everything (no filtering) |

A single-role user must hold EXACTLY ONE of the two reads. Both/neither = unrestricted.

### H.3 Grant matrix per role (the config to apply)

| Role | `VIEW_OPPORTUNITY` (READ) | `BD_READ_001` | `ISG_READ_001` | `CREATE_OPPORTUNITY` (WRITE) |
| --- | --- | --- | --- | --- |
| `ROLE_BD_EXECUTIVE` / `ROLE_BD_MANAGER` | yes | yes | NO | yes |
| `ROLE_ISG_EXECUTIVE` / `ROLE_ISG_MANAGER` | yes | NO | yes | NO |
| Leadership / Super / CS (unrestricted) | yes | both or neither | both or neither | per policy |

Must-not rules that make the gating correct:

- A BD role must NOT hold `ISG_READ_001` (else it sees Manage Quotes / is mis-detected).
- An ISG role must NOT hold `BD_READ_001` or `CREATE_OPPORTUNITY` (else the
    ISG-Planning gate is skipped / they can create opportunities).
