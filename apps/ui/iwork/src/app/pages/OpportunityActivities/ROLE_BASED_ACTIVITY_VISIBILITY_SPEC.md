# Implementation Spec: Role-Based Activity Visibility (BD / ISG)

## 1. Goal

Hide opportunity activities from users who do not belong to the owning role:

- ISG users must not see BD activities (BD Planning + all BD-stage activities).
- BD users must not see ISG activities (ISG Planning + all ISG-stage activities).

### The catch

The last BD activity (step 6, `rfp_details_entry_activity` — "RFP Details Entry")
renders the BD→ISG handover information once it is approved:

- "This activity was approved by `<name>` on `<date>` at `<time>`"
- "ISG activities assigned to: `<isgOwner.name>`" (or the pending variant
    "ISG assignment pending: `<isgAssignee.name>`")

When BD activities are hidden from ISG users, this handover block disappears with
them. ISG users still need to see who approved the BD work and who the ISG work was
assigned to. This spec therefore also relocates that block into a banner that is
visible to ISG users above their own section.

## 2. Current behavior (reference)

- Activities are produced by `transformActivities` in
    [Constants/activityConstants.ts](Constants/activityConstants.ts). Each
    `TransformedActivity` carries a `role` field (`"BD"` or `"ISG"`), and one
    `"<role> Planning"` entry is pushed per role before that role's activities.
- [index.tsx](index.tsx) maps over `transformedActivities` and renders one
    accordion per activity. Activity ordering is:
    1. BD Planning
    2. Data Validation
    3. KDM Meeting
    4. Mandate Details Entry
    5. RFP Data Collection
    6. RFP Details Entry (`rfp_details_entry_activity`) — last BD activity, holds the handover block
    7. ISG Planning
    8. ISG activities...
- The handover block is rendered inside
    [CommonActivities/CommonActivityV1.tsx](CommonActivities/CommonActivityV1.tsx)
    (around lines 2620-2651), gated on
    `isActivityApproveForApprovalStatus && activity.activityKey === "rfp_details_entry_activity"`.
    It reads `getActivityData.data.approverDetails`, `getActivityData.data.isgOwner`,
    and `getActivityData.data.isgAssignee` from
    `endPoints.opportunityActivitiesByopportunityActivityId(opportunityActivityId)`.
- Role-scoped permissions already exist and are read via
    `selectHasPermission(FeatureKey.X)` from
    [permissionSlice.ts](../../../../../ui-lib/src/lib/redux/permissionSlice.ts).
    Relevant keys in
    [permissionMap.ts](../../../../../ui-lib/src/lib/rbac/permissionMap.ts):
    - BD: `EDIT_BD_OPTY_ACTIVITY`, `PLAN_BD_ACTIVITY`, `ASSIGN_BD_ACTIVITY`, `APPROVE_BD_OPPORTUNITY`
    - ISG: `EDIT_ISG_OPTY_ACTIVITY`, `PLAN_ISG_ACTIVITY`, `ASSIGN_ISG_ACTIVITY`, `APPROVE_ISG_OPPORTUNITY`

## 3. Role detection — by "BD/ISG activities read" ACL capability

Visibility is determined by the user's **read** ACL capability for each team —
`BD_ACTIVITY/BD_READ_001` and `ISG_ACTIVITY/ISG_READ_001`. The **specific read
action** is used (not the broad BD/ISG category): a BD manager may hold ISG
approve/assign ACL, but as long as they do not have **ISG read**, they stay BD-only.
(An earlier attempt used the broad ISG_ACTIVITY *category*, which a BD manager had
via Approve/Assign ISG — that caused a manager-leak. The specific read action fixes
it, provided the ACL seed grants ISG read only to ISG roles.)

Two FeatureKeys are wired for this (added in `permissionMap.ts`):
`VIEW_BD_ACTIVITY → BD_READ_001`, `VIEW_ISG_ACTIVITY → ISG_READ_001`.

Rule (`apps/ui/ui-lib/src/lib/rbac/useActivityRoleVisibility.ts`):

- BD read only  -> `{ canViewBD: true,  canViewISG: false }`
- ISG read only -> `{ canViewBD: false, canViewISG: true }`
- both reads, or neither (leadership / super user / CS) -> both `true` (unrestricted)

The hook uses `selectHasPermission(VIEW_BD_ACTIVITY / VIEW_ISG_ACTIVITY)` against the
existing `access` object in the permissions slice — no extra slice/auth plumbing.
The backend mirrors the same rule in `ScopeService.getActivityRoleVisibility(userId)`
(counts `RoleAclCategoryActionMap` rows for actions `BD_READ_001` / `ISG_READ_001`)
so the listing, summary card, and accordion all agree.

## 4. Filtering the activity list

Filter in [index.tsx](index.tsx) with a `useMemo`, keeping `transformActivities`
pure. Filter by the `role` field. Keep the original (unfiltered) list available — the
handover banner needs the BD `rfp_details_entry_activity` id even when BD is hidden.

```ts
const { canViewBD, canViewISG } = useActivityRoleVisibility();

const visibleActivities = useMemo(
    () =>
        transformedActivities.filter((a) => {
            if (a.role === "BD") return canViewBD;
            if (a.role === "ISG") return canViewISG;
            return true; // roles other than BD/ISG are always shown
        }),
    [transformedActivities, canViewBD, canViewISG]
);
```

Then render over `visibleActivities` instead of `transformedActivities` in the
`.map(...)` at the bottom of the component.

### Index-dependent logic to re-check

Several derived values use positional indices over the activity list. After
filtering, indices shift. Audit and update each to operate on `visibleActivities`:

- `accordionRefs.current[index]` and the auto-scroll effect.
- `breadCumbSep` / `setBreadCumbStep` — currently an index into the full list.
    Confirm the breadcrumb stepper and `location.state.accordionStep` are computed
    against the same (filtered) list the user sees, otherwise the wrong accordion
    opens.
- `lastIndex`, `BD_PLANNING_INDEX`, `ISG_PLANNING_INDEX`, `initialBreadCumb`
    (lines ~694-729) — recompute these from `visibleActivities`.
- The `getRoleColors` uniqueness ordering uses the activity list; pass
    `visibleActivities` for consistent coloring.

Acceptance: opening, auto-scroll, and the initial expanded step must all line up
with what is rendered.

## 5. Relocating the BD→ISG handover block (the catch)

### 5.1 Extract a shared banner component

Create `CommonActivities/BdToIsgHandoverBanner.tsx`. Move the JSX currently at
[CommonActivityV1.tsx](CommonActivities/CommonActivityV1.tsx) lines ~2620-2651 (the
`THIS_ACTIVITY_WAS_APPROVED_BY` / `ISG_ASSIGNED_TO_TEXT` / `ISG_ASSIGNMENT_PENDING_TEXT`
block) into it. The component takes the BD `rfp_details_entry_activity`'s
`opportunityActivityId`, fetches it with the existing
`endPoints.opportunityActivitiesByopportunityActivityId`, and renders only when
that activity is approved.

```tsx
interface Props { opportunityActivityId: number; }

const BdToIsgHandoverBanner = ({ opportunityActivityId }: Props) => {
    const { data } = useApiQuery({
        queryKey: ["bdHandover", opportunityActivityId],
        url: endPoints.opportunityActivitiesByopportunityActivityId(
            Number(opportunityActivityId)
        ),
        enabled: !!opportunityActivityId,
    });

    const approver = data?.data?.approverDetails;
    if (!approver?.name) return null; // not yet approved -> nothing to show

    const isgOwner = data?.data?.isgOwner;
    const isgAssignee = data?.data?.isgAssignee;
    // ...render the two lines (approved-by + assigned-to/pending) using the
    // existing constants and formatDate, copied verbatim from CommonActivityV1.
};
```

### 5.2 Use the banner in both places

- In `CommonActivityV1`, replace the inline block with
    `<BdToIsgHandoverBanner opportunityActivityId={activity.opportunityActivityId} />`
    so BD users keep seeing it in-context (step 6). No behavior change for BD users.
- In [index.tsx](index.tsx), when `!canViewBD && canViewISG` (ISG-only user), find
    the BD RFP Details Entry activity in the **unfiltered** `transformedActivities`
    and render the banner above the activities list (recommended placement: directly
    above the first ISG accordion / ISG Planning card).

```ts
const bdHandoverActivity = transformedActivities.find(
    (a) => a.activityKey === "rfp_details_entry_activity"
);

// in render, when ISG-only:
{!canViewBD && canViewISG && bdHandoverActivity && (
    <BdToIsgHandoverBanner
        opportunityActivityId={bdHandoverActivity.opportunityActivityId}
    />
)}
```

Decision required: banner placement for ISG users (one):

1. Above the whole activities list (top of the section). (Recommended)
2. Immediately above the ISG Planning accordion.
3. Inside the ISG Planning accordion header.

Default if unanswered: option 1.

### 5.3 Data availability (verified — no backend change required)

The backend was checked. The handover data is reachable by an ISG user today:

- `GET /opportunity/activity-data/:opportunityActivityId`
    ([opportunity.controller.ts](../../../../../services/opportunity-service/src/app/opportunity/opportunity.controller.ts)
    line ~2062) has **no role guard** and the controller class has **no
    class-level `@UseGuards`**. It only requires authentication, so an ISG user can
    fetch the BD `rfp_details_entry_activity` and read `approverDetails`,
    `isgOwner`, and `isgAssignee`.
- `GET /opportunity/activities/:opportunityId` (the list consumed by
    `transformActivities`, controller line ~1578) gates only on the opportunity
    `edit` resource scope (`scopeService.validateResourceScope(... "opportunity",
    "edit" ...)`), not on BD/ISG role. So ISG users already receive the BD activity
    entries — including the BD RFP Details Entry `opportunityActivityId` the banner
    needs.

Conclusion: implement the banner with the existing per-activity GET. No backend
change is required.

Optional backend enhancement (nice-to-have, not required): add `approverDetails`,
`isgOwner`, and `isgAssignee` for the BD RFP Details Entry activity to the
`activities/:opportunityId` list response. This would let the banner read from the
already-fetched list and avoid one extra GET. Defer unless the extra request proves
to be a problem.

## 6. Edge cases

- User with both BD and ISG permissions: sees all activities and the in-context
    handover block (current behavior). The top banner is not shown (guarded by
    `!canViewBD`).
- User with neither permission: sees no BD/ISG activities. Confirm the empty state
    (`OPPORTUNITIES_ACTIVITY_NO_DATA`) renders rather than a blank list.
- Renewal opportunities (`isRenewal`): labels are remapped via
    `getRenewalAwareActivityLabel`; filtering by `role` is unaffected, but re-test
    the renewal flow.
- BD RFP Details Entry not yet approved: banner returns `null`; ISG users see no
    handover line (correct — there is nothing to hand over yet). Verify ISG planning
    is still reachable in this state, or confirm with product whether ISG should be
    blocked until BD approval.

## 7. Files touched

- `apps/ui/ui-lib/src/lib/rbac/useActivityRoleVisibility.ts` (new) + barrel export.
- `apps/ui/iwork/.../OpportunityActivities/index.tsx` (filter list, render banner,
    fix index-dependent logic).
- `apps/ui/iwork/.../OpportunityActivities/CommonActivities/BdToIsgHandoverBanner.tsx`
    (new).
- `apps/ui/iwork/.../OpportunityActivities/CommonActivities/CommonActivityV1.tsx`
    (replace inline handover block with the shared banner).
- `apps/ui/iwork/.../OpportunityActivities/Constants/activityRoleVisibility.ts`
    (new — shared `filterActivitiesByRole` predicate; see section 9).
- `apps/ui/iwork/.../OpportunitiesPage/OpportunitiesDetails/index.tsx`
    (filter the summary card's activities; see section 9).
- Backend `opportunity-service` + `service-lib` (listing role-aware display
    activity; see section 10).
- `apps/ui/ui-lib/.../rbac/permissionMap.ts` (new FeatureKeys
    `VIEW_BD_ACTIVITY → BD_READ_001`, `VIEW_ISG_ACTIVITY → ISG_READ_001`).
- `apps/ui/ui-lib/.../rbac/useActivityRoleVisibility.ts` (read-ACL detection via
    `selectHasPermission`).
- `libs/service-lib/.../utils/scope.utils.ts` (`getActivityRoleVisibility` counts
    `RoleAclCategoryActionMap` for `BD_READ_001` / `ISG_READ_001`).
- No auth/permissionSlice plumbing needed (detection reads the existing `access`
    object). The earlier `roleKeys` additions to the permissions response and slice
    were reverted.

## 8. Test plan

- ISG-only user: BD Planning + BD activities hidden; ISG Planning + ISG activities
    visible; handover banner visible at top once BD RFP Details Entry is approved,
    showing approver + ISG assignee/pending.
- BD-only user: ISG Planning + ISG activities hidden; step 6 still shows the
    in-context handover block.
- Dual-role user: everything visible, no duplicate banner.
- Breadcrumb stepper, auto-scroll, and initial expanded accordion align with the
    filtered list for each role.
- Renewal opportunity sanity pass.

## 9. Detail-page summary card (progress stepper)

The summary card at the top of the opportunity detail page is the
`OpportunityCard` (`components/OpportunityProgressStepper`) rendered by
[OpportunitiesDetails/index.tsx](../OpportunitiesPage/OpportunitiesDetails/index.tsx).
It receives `transformedActivities` and renders the step/breadcrumb progress. BD and
ISG users must see only their respective activities here too.

### 9.1 Shared filter predicate

The role filter predicate used by the accordion (section 4) is extracted into a
reusable helper so the accordion and the summary card stay in sync:

- `Constants/activityRoleVisibility.ts` exports
    `filterActivitiesByRole(activities, canViewBD, canViewISG)`. BD-role activities
    require `canViewBD`, ISG-role require `canViewISG`, anything else always shows.
- `index.tsx` (accordion) now uses this helper for `visibleActivities`.

### 9.2 Filtering the card

In `OpportunitiesDetails/index.tsx`:

- Call `useActivityRoleVisibility()` and compute
    `visibleActivities = filterActivitiesByRole(transformedActivities, canViewBD, canViewISG)`.
- Pass `visibleActivities` (not the full list) to `<OpportunityCard transformedActivities=... />`.
- Continue passing the **full** `transformedActivities` to `<OpportunityActivities />`
    — it filters internally with the same predicate and needs the unfiltered list to
    locate the BD RFP Details Entry for the ISG handover banner (section 5).

### 9.3 Why this also fixes a sync bug

After section 4, the accordion indexes into its internally-filtered list while the
card still indexed into the full list — so `breadCumbSep` referred to different
activities in each for single-role users. Because the card and the accordion now
apply the identical predicate to the same source list, their filtered lists are
element-for-element equal and `breadCumbSep` stays consistent across both.

## 10. Opportunity listing — role-aware display activity

Decision confirmed (see
[ROLE_BASED_ACTIVITY_VISIBILITY_LISTING_DASHBOARD_PLAN.md](ROLE_BASED_ACTIVITY_VISIBILITY_LISTING_DASHBOARD_PLAN.md)
A.3): the listing's single "Activity name"/"stage" cell reflects the viewer's role.
A BD-only user sees the latest BD activity; an ISG-only user sees the ISG one; users
who can view both (or neither — e.g. leadership) see the true current activity. This
is implemented entirely in the backend; the listing frontend is unchanged (it already
renders `activityName` from the response, and the `userid` header is already sent).

### 10.1 Backend role resolver (reusable)

`ScopeService.getActivityRoleVisibility(userId)` in
[scope.utils.ts](../../../../../../libs/service-lib/src/lib/utils/scope.utils.ts)
returns `{ canViewBD, canViewISG }`, mirroring the frontend hook — from the user's
**read** ACL capabilities (counts `RoleAclCategoryActionMap` for the user's roles
under actions `BD_READ_001` / `ISG_READ_001`):

- BD read only → BD only.
- ISG read only → ISG only.
- both reads, or neither (leadership / super user / CS) → both true (unrestricted).

The specific read action (not the broad BD/ISG category) is used so a BD manager
holding ISG approve/assign ACL stays BD-only — provided the ACL seed grants ISG read
only to ISG roles. The display-activity filter then matches the activity `roleKey`
on `OpportunityActivityMap` (`ROLE_BD_EXECUTIVE` / `ROLE_ISG_EXECUTIVE`).

### 10.2 Threading

- `OpportunityService.getAllOpportunityList` resolves visibility from the
    **logged-in** user (captured before `loggedInUserId` may be reassigned to a
    searched owner) and maps it to `visibleActivityRoleKeys`:
    `BD-only → [ROLE_BD_EXECUTIVE]`, `ISG-only → [ROLE_ISG_EXECUTIVE]`, otherwise
    `null` (no restriction).
- Passed as a new trailing optional arg into
    `OpportunityRepository.getAllOpportunities` (both funnel and non-funnel calls).
- Threaded to `resolveDisplayActivityForOpportunity` → both
    `getWorkInProgressActivityNameByOpportunityId` (see §10.2.1) and
    `getPendingActivityDetailsForDisplay` → `createPendingActivityFilterSubquery`
    (adds `roleKey IN (...)` before the ROW_NUMBER ranking, so rank=1 is the first
    activity the viewer may see).
- `null`/empty role keys means no filter — preserves current behavior for dual-role
    and non-BD/ISG roles.

### 10.2.1 Display-activity resolver — role filtering of every branch

`getWorkInProgressActivityNameByOpportunityId` resolves the single display activity
through a sequence of status fallbacks. **Every branch** must respect the role
filter, not just the first, otherwise a cross-team state leaks (the original bug:
BD users saw "Opportunity Won"). Rules:

- **Work-In-Progress, Submitted, Rejected** queries all apply `roleKey In(...)` so a
    single-team viewer only ever matches their own team's activity in those states.
- **"Opportunity Won"** is an ISG-stage outcome. The won-detection branch runs only
    when the viewer can see ISG — i.e. `visibleActivityRoleKeys` is null/empty
    (unrestricted) OR includes `ROLE_ISG_EXECUTIVE`. A **BD-only** viewer skips it.
- **BD-only fallback:** when a BD-only viewer has no WIP/Submitted/Rejected BD
    activity (e.g. the opportunity is won or mid-ISG), show the **latest BD activity
    reached** (`order: activityOrder DESC`, e.g. "RFP Details Entry") — never "Won"
    and never an ISG activity.

Resulting display for a won opportunity:

| Viewer | Display activity |
| ------ | ---------------- |
| BD-only | latest BD activity (e.g. RFP Details Entry) — never "Won" |
| ISG-only | "Opportunity Won" |
| Dual-role / leadership (unrestricted) | "Opportunity Won" (unchanged) |

Edge: the final status-text fallback (`opportunity.status` → e.g. "Won") is only
reached when no activity at all is found; every opportunity has BD activities, so a
BD-only viewer always resolves to a BD activity first.

### 10.3 Follow-up (not yet implemented)

The "Activity name" multiselect filter dropdown (`getAllActivityIdAndName` /
`activity-details`) still lists activities for both roles. Scoping it by role needs
an activity→role mapping (the master `Activity` has no role; role lives on
`OpportunityActivityMap`/stage). Tracked as a follow-up; the display activity — the
primary requirement — is role-aware.

### 10.4 Listing test plan

- BD-only user: each row's activity/stage cell shows the BD activity even when the
    opportunity is mid-ISG-stage; never shows an ISG activity name.
- **BD-only user, WON opportunity: shows the latest BD activity, NOT "Opportunity
    Won" (§10.2.1).**
- ISG-only user: mirror; a WON opportunity still shows "Opportunity Won".
- Dual-role / leadership: true current activity incl. "Won" (no regression).
- Funnel and non-funnel listing paths both honor the filter.
- Renewal (RO) listing parity with sales (SO).
