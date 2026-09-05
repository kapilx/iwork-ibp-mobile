# My Business Performance - Detailed Analysis

### Data Sources
1. **performance_output table** - field name: `performance_month` (YYYY-MM-DD format)
2. **business_target table** - field name: `month`  
3. **User table** (for organizational filtering)

### Date Filtering
- Based on `timeFilter` parameter and `financialYear` parameter
- Uses `getDateRangeWithoutTimestamp()` function
- Applied as: `performance_month BETWEEN :start AND :end`

### KPIs Used For Filtering
- `BROKERAGE`
- `PREMIUM_COLLECTED` 
- `BROKERAGE_COLLECTED`

### Business Metrics
### 1. **New Business**
- **Target:**  
  Sum of `value_of_target` from `business_target` table where `entity_type = 'SO_POLICY'`
- **Achieved:**  
  Sum of `value_of_target` from `performance_output` table where `entity_type IN ('SO_POLICY', 'SO_ENDORSEMENT')`
- **Count:**  
  Sum of `entity_count` from `performance_output` table where `entity_type IN ('SO_POLICY', 'SO_ENDORSEMENT')`
- **Percentage:**  
  `(Achieved / Target) * 100`

---

### 2. **Retention**
- **Target:**  
  Sum of `value_of_target` from `business_target` table where `entity_type = 'RO_POLICY'`
- **Achieved:**  
  Sum of `value_of_target` from `performance_output` table where `entity_type IN ('RO_POLICY', 'RO_ENDORSEMENT')`
- **Count:**  
  Sum of `entity_count` from `performance_output` table where `entity_type IN ('RO_POLICY', 'RO_ENDORSEMENT')`
- **Percentage:**  
  `(Achieved / Target) * 100`

---

### 3. **Mined Business**
- **Target:**  
  Sum of `value_of_target` from `business_target` table where `entity_type = 'MINED_POLICY'`
- **Achieved:**  
  Sum of `value_of_target` from `performance_output` table where `entity_type IN ('MINED_POLICY', 'MINED_ENDORSEMENT')`
- **Count:**  
  Sum of `entity_count` from `performance_output` table where `entity_type IN ('MINED_POLICY', 'MINED_ENDORSEMENT')`
- **Percentage:**  
  `(Achieved / Target) * 100`

---

### 4. **Total Business**
- **Target:**  
  Sum of `value_of_target` from `business_target` table where `entity_type = 'TOTAL_POLICY'`
- **Achieved:**  
  Sum of `value_of_target` from `performance_output` table where  
  `entity_type IN ('TOTAL_POLICY', 'TOTAL_ENDORSEMENT')`  
  **OR**  
  `entity_type IN ('SO_POLICY', 'SO_ENDORSEMENT', 'RO_POLICY', 'RO_ENDORSEMENT')`
- **Count:**  
  Sum of `entity_count` from `performance_output` table using the same entity types as Achieved
- **Percentage:**  
  `(Achieved / Target) * 100`

---

### 5. **Premium Collection**
- **Expected:**  
  Sum of `value_of_target` from `performance_output` table where `entity_type = 'POLICY_PREMIUM'`
- **Collected:**  
  Sum of `entity_count` from `performance_output` table where `entity_type = 'POLICY_PREMIUM'`
- **Total Policy Count:**  
  Sum of `entity_count` from `performance_output` table where  
  `entity_type IN ('TOTAL_POLICY', 'TOTAL_ENDORSEMENT')`  
  **OR**  
  `entity_type IN ('SO_POLICY', 'SO_ENDORSEMENT', 'RO_POLICY', 'RO_ENDORSEMENT')`
- **Percentage:**  
  `(Collected / Expected) * 100`

---

### 6. **Brokerage Collection**
- **Expected:**  
  Sum of `value_of_target` from `performance_output` table where  
  `entity_type IN ('TOTAL_POLICY', 'TOTAL_ENDORSEMENT')`  
  **OR**  
  `entity_type IN ('SO_POLICY', 'SO_ENDORSEMENT', 'RO_POLICY', 'RO_ENDORSEMENT')`
- **Collected:**  
  Sum of `entity_count` from `performance_output` table where `entity_type = 'BROKERAGE_COLLECTED'`
- **Total Policy Count:**  
  Sum of `entity_count` from `performance_output` table using total policy entity types
- **Percentage:**  
  `(Collected / Expected) * 100`

---

## Filtering Logic

### User-based Filtering
- **Individual Users**: When `isLeadership = false`, filters by `userIds`
- **Leadership View**: When `isLeadership = true`, filters by organizational hierarchy:
  - organisationId
  - sbuId  
  - verticalId
  - departmentId
  - branchId

### Data Aggregation
- Groups results by `entity_type`
- Uses `COALESCE(SUM())` for safe aggregation
- Combines policy and endorsement data for each entity type

### Return Structure
The method returns an array of **6 objects**, each representing a specific business metric group:

1. **New Business (SO) Metrics**
   - `countOfSO` → Total number of SO policies and endorsements
   - `sumOfBrokerageAmountOfSO` → Achieved brokerage amount for SO
   - `targetOfSO` → Target brokerage amount for SO

2. **Retention (RO) Metrics**
   - `countOfRO` → Total number of RO policies and endorsements
   - `sumOfBrokerageAmountOfRO` → Achieved brokerage amount for RO
   - `targetOfRO` → Target brokerage amount for RO

3. **Mined SO Metrics**
   - `countOfSOisMined` → Total number of mined SO policies and endorsements
   - `sumOfBrokerageAmountOfSOisMined` → Achieved brokerage amount for mined SO
   - `targetOfSOMined` → Target brokerage amount for mined SO

4. **Total Business Metrics**
   - `totalPolicyCount` → Total number of policies and endorsements
   - `totalSumOfBrokerage` → Total achieved brokerage amount
   - `totalTarget` → Total brokerage target

5. **Premium Collection Metrics**
   - `targetPremiumCollected` → Expected premium amount to be collected
   - `premiumCollected` → Actual premium collected
   - `totalPolicyCount` → Total number of policies considered

6. **Brokerage Collection Metrics**
   - `targetBrokerageCollected` → Expected brokerage amount to be collected
   - `brokerageCollected` → Actual brokerage collected
   - `totalPolicyCount` → Total number of policies considered

## Funnel & Schedule-by-SBU — Count Logic & Drilldown Reconciliation

Goal: every widget count must equal the count on the opportunities listing it drills
into. Status: SO/RO Funnel and SO/RO Schedule-by-SBU are reconciled;
Follow-up-by-activity and Brokerage-to-collect are not yet reviewed.

> Pending business sign-off: the funnel period basis was changed from opportunity
> creation date to **policy expiry date**.

### Shared principles
- **Single source of truth**: funnel count and its drilldown are built from one query
  (`OpportunityRepository.buildFunnelStageQuery`), so they cannot drift.
- **Expiry buffer**: the listing widens any `expiryDate` filter by
  `EXPIRY_BUFFER_DAYS` each side and every widget applies the same amount, so counts
  line up whatever it is set to. Business has since disabled the grace window
  (`EXPIRY_BUFFER_ENABLED = false` → 0 days), so today the window is the picked range
  exactly; flipping the flag widens both sides together.
- **Performance-enabled only**: count only `enabledForPerformanceLid = TOGGLE_TYPE_YES`;
  RO additionally requires `refPolicyId IS NOT NULL`.
- **Scope**: manager/team via the employee reporting tree + org/sbu/vertical/branch.
  "The team's opportunity" means **involvement**, NOT `opportunity.owner_id`: the team
  created it, owns or participates in one of its activities, or holds a task on it
  (`buildOpportunityInvolvementScope`, entity-service.utils.ts — one predicate shared by
  the listing, the funnel counts and the funnel drilldown). Renewals are
  system-generated with `owner_id` pre-filled, so the old `owner_id IN (team)` match
  counted ROs nobody on the team had touched and the listing never showed.
- **Organisation filter — IIRM Holdings**: `organisationId=0` is a virtual id (no
  organisation row has id 0). Both the listing and the funnel resolve it to the ids of
  the child organisations (`parent_organisation_id = 0`) and filter
  `organisation_id IN (...)`. The funnel (`getActivityBrokerageSummary`,
  opportunity.service.ts) performs this resolution for ALL roles before the
  leadership/non-leadership branch; a raw `organisation_id = 0` equality must
  never reach SQL (it matches no rows).
- **Drill-down period**: clicking a funnel stage (`onFunnelClick`,
  apps/ui/iwork/src/app/components/BusinessPerformance/index.tsx) passes the raw
  filter selection (quarter/month/financialYear, or the user's explicit from/to)
  to the listing — it derives NO dates itself. The backend funnel drilldown
  (`getAllOpportunityList`, funnel branch) computes the window with the same
  `getDateRange` the funnel endpoint uses, honouring an explicit from/to pair
  first. The frontend must never stamp derived/hardcoded dates into the
  navigation — that overwrites the user's selection in the listing's filter
  panel.

### SO / RO Funnel (`getActivityBrokerageSummary`, `/opportunity/sales-funnel?type=`)
- Top SO/RO bar = performance-enabled opps (team scope) whose **policy expires inside
  the selected period**. No stage filter.
- A stage bar = that same base set, narrowed to those that have **reached that stage by
  the period end** — `COALESCE(reportingPeriod, completedAt) <= :to`, upper bound only.
  Deliberately NOT "completed the activity inside the period": renewals are planned
  months ahead, so an RO that finished RSR Creation in May and QCR in August would score
  0 on RSR and 1 on QCR for an Aug-Sep window — earlier bars reading lower than later
  ones, which is not a funnel. With the lower bound dropped each stage set is a superset
  of the next, so **bars decrease** and an opportunity legitimately appears in several
  bars at once (bars nest inside the top bar; they do not sum to it).
- Residual non-monotonicity is now only ever real: a genuinely **skipped** step (a flow
  that does not require RSR Creation, say) still dips below the stage after it. That is
  data, not bucketing.
- **Lost/Closed excluded** (`Lost`, `Close`, `Auto Close`) — the same default hide the
  listing applies when no `state:` filter is sent.
- **No carry-forward**: an opportunity whose expiry predates the window is NOT pulled
  in. The old base arms did exactly that (lost-in-window / won+placement-in-window /
  **still-open**), and the still-open arm had no age bound, so an Aug–Sep 2026 RO card
  read 187 against a listing of 13 — the extra ~174 were open ROs whose policies had
  expired in earlier periods. Each opportunity now counts only in the period its policy
  expires in.
- Drilldown (`funnel=true`): `buildFunnelStageDrilldownCondition` injects the same
  predicate as `main.opportunityId IN (<subquery>)`, so list count == bar.

### SO / RO Schedule by SBU (`getSalesScheduleBySbu` / `getRenewalScheduleBySbu`)
- Per SBU, one count per expiry band, **buffered ±5**, over performance-enabled,
  **non-lost** opps (RO also requires `refPolicyId`), no future-only floor:
  - "30 Days" = expiry `[today−5, today+35]`; "60 Days" = `[today+26, today+65]`;
    "90 Days" = `[today+56, today+95]`; "Beyond 90 Days" = `>= today+86`.
- Source bands = frontend `POLICY_EXPIRY_BUCKET_DAY_RANGES`, each widened ±5.
- **Bands overlap by ±5** (a near-boundary policy counts in two buckets), so bucket
  counts do NOT sum to a clean SBU total — intended, so each band matches its drill.

### Validation (Postgres; `4401` = SO type lid)
Funnel — approximate check. The `JOIN users ON u.id = o.owner_id` below is a stand-in
for the real team scope, which is involvement-based (see **Scope** above), so treat a
small delta as expected and reconcile against the `funnel=true` drilldown instead:
```sql
SELECT COUNT(*) FILTER (WHERE o.enabled_for_performance_lid IS DISTINCT FROM
  (SELECT id FROM look_up WHERE look_up_key='TOGGLE_TYPE_YES')) AS not_perf_enabled
FROM opportunity o JOIN users u ON u.id=o.owner_id
WHERE o.opportunity_type_lid=4401
  AND (o.status_lid IS NULL OR o.status_lid NOT IN
       (SELECT id FROM look_up WHERE look_up_key IN
        ('OPPORTUNITY_STATUS_LOST','OPPORTUNITY_STATUS_AUTO_CLOSE','OPPORTUNITY_STATUS_CLOSE')))
  AND o.expiry_date BETWEEN DATE :from AND DATE :to;   -- ± EXPIRY_BUFFER_DAYS, now 0
```
SBU "30 Days" band (== widget bucket == its drill):
```sql
SELECT COUNT(*)
FROM opportunity o JOIN users u ON u.id=o.owner_id
WHERE o.opportunity_type_lid=4401
  AND o.enabled_for_performance_lid=(SELECT id FROM look_up WHERE look_up_key='TOGGLE_TYPE_YES')
  AND o.sbu_id=:sbuId
  AND (o.status_lid IS NULL OR o.status_lid NOT IN
       (SELECT id FROM look_up WHERE look_up_key IN
        ('OPPORTUNITY_STATUS_LOST','OPPORTUNITY_STATUS_AUTO_CLOSE','OPPORTUNITY_STATUS_CLOSE')))
  AND o.expiry_date BETWEEN CURRENT_DATE - INTERVAL '5 days' AND CURRENT_DATE + INTERVAL '35 days';
```

### Known residuals
- A consistent ±1 at some funnel stages (boundary/dedup edge).
- ~~Count vs drill can differ if the listing owner-scope diverges from the funnel team
  scope~~ — fixed: `applyFunnelOpportunityCommonfilters` and the funnel counts both call
  `buildOpportunityInvolvementScope` now, so there is one owner-scope predicate.
- Still open on the **Placement** funnel only: the counts build the ISG stage gate
  role-blind (`buildActivityRoleStageGate(null, true, …)`, deliberate so leadership sees
  the ISG population), while the `type=ALL` listing builds it from the viewer's role
  keys — so a BD-only or ISG-only viewer can still see card ≠ list there.
- The funnel rejects a half-open range with a 400; with no dates AND no
  financialYear/quarter/month it builds `new Date(undefined)` and the expiry BETWEEN
  gets an Invalid Date bound. Pre-existing; needs an early return of zeroed stages.

## My Follow-up (pending activities)
Endpoint: `GET /opportunity/pending-activities-summary` (`getPendingActivitiesSummary`).
Aging buckets by activity age (`CURRENT_DATE - COALESCE(planned_at, created_at)`):
30=0-30d, 60=31-60d, 90=61-90d, beyond90=>90d. A pending activity = first activity
with `completedAt IS NULL, plannedAt IS NOT NULL`.

Reconciled with the drilldown by adding to the widget (`getPendingActivitiesSummary`):
- `enabledForPerformanceLid = YES` (+ RO `refPolicyId`) — all rows.
- Non-planning rows: `expiryDate >= today-5` expiry floor (mirrors the drill sending
  `state:["Active"]`); planning rows (BD/ISG) get NO floor.
Result: **non-planning activities match the drill exactly** (verified Data Validation).

**Table coverage**: the drilldown's pending subquery is scoped by
`PENDING_ACTIVITY_TABLES` (opportunity.repository.ts), which must list the same
16 activity tables the widget counts. A missing table both returns 0 for its
own drilldown and skews the rank-1 "first pending" attribution of every other
stage, so any new table-backed activity must be added to this constant.

Bucket → drill window mapping (MyFollowUp `onCellClicked` + ui-lib `getDateRange`,
applied by the listing to `COALESCE(planned_at, created_at)`; `field=expiryDate` is
ignored on `isPendingActivity=true` requests):
- `next30` = age <= 30 days, which **includes every future-planned activity**
  (negative age). The drill therefore sends ONLY `from = today-30` with no
  upper bound (the backend applies `>= from`). The SO/RO listings' Run
  validation normally requires from/to as a pair; it allows from-only when
  `location.state.pendingActivities` is set (i.e. on follow-up drilldowns).
  Capping `to` (at today or FY end) would silently drop future-planned
  activities from the drill.
- `next60` = drill `[today-60, today-31]`; `next90` = `[today-90, today-61]`;
  `beyond90` = `[1900-01-01, today-91]` — pure past windows, both bounds sent.

Organisation filter semantics (verified, no org-0 zero-count bug here): the widget
passes org filters to the repository only for leadership users, and that path
resolves `organisationId=0` (IIRM Holdings) to child org ids; for non-leadership
the raw 0 never reaches SQL — it only skips the reportee-list org filter, i.e.
counts the whole team (cumulative), which is the intended IIRM Holdings meaning.
Residual parity gap by design: the widget's org filter applies to the activity
OWNER's org (`pendingOwner.organisationId`), while the drill filters the
OPPORTUNITY's org (`opportunity.organisationId`) — an owner in org A holding an
org-B opportunity counts under A in the widget but under B in the drill. Also note
ui-lib `buildQueryString` drops `value === 0`, so an IIRM Holdings selection never
reaches the widget request as a param at all.

BD/ISG Planning rows are counted separately by `statusLid IN (BD/ISG_PLANNING) AND NOT
EXISTS an activity in WIP/SUBMITTED/REJECTED`, scoped to the team via `ownerId`.

### OPEN BUG — planning drilldown loses team scope (listing side)
For BD/ISG Planning the follow-up click routes through the PLAIN listing
(`isPlanningDrilldown` -> `customPath=""`). Captured runtime SQL shows the drill applies
`opportunity_type_lid`, `enabled_for_performance_lid`, `status_lid=BD_PLANNING AND NOT
EXISTS(active activity)`, `organisation_id`, `created_at BETWEEN`, `deleted_at IS NULL`
— but **NO owner/team scope at all** (no `ownerId IN`, no reportee CTE), despite
`ownerId=2&viewBy=team`. So the drill counts the whole org, not the team.
- The **widget is correct** (team-scoped, 669); the **drill under-scopes** (659).
- Root cause is in shared `libs/service-lib/src/lib/utils/scope.utils.ts`
  `validateOpportunityScope` (opportunity branch ~632-730): role-dependent
  `taggedResourceIds` + `applyCommonfilterForOpportunity` produced no owner clause here.
- Exact match is further blocked by THREE different team-set computations that disagree:
  `getEmployeeHierarchyByUserId` (widget)=669, `fetchReporteeUserIds`/raw=671,
  `scope.utils` tagged=659.
- Fix is NOT safe blind: `scope.utils` is shared by every entity listing. Needs a
  focused, DB-tested change that unifies the team-scope computation. Tracked as a ticket.
- Impact: ~10 rows (0.7%) on synthetic planning rows only; real activities are exact.

