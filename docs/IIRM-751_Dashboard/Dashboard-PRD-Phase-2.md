# Dashboard — Product Requirements Document (Phase 2)

**Module:** DASH
**Phase:** 2
**Status:** As-built (reverse-engineered from code)
**Author:** Product Team
**Last Updated:** 2026-07-13

---

## Overview

The Dashboard is the landing surface of the iwork MFE for BD executives, ISG executives, managers, and leadership. It renders a shared Smart Search filter bar followed by eleven widgets covering business performance, the sales/renewal pipeline, expiry schedules, collections, TAT, and portfolio distribution. Every clickable widget drills into the matching listing page carrying the widget's own filters, so the count a user clicks equals the count the listing shows.

Phase 2 extends the Phase-1 foundation with: the quarterly Target-vs-Actual view with SBU breakdown, Sales/Renewal Schedule-by-SBU expiry tables, the Endorsement + Claims TAT-by-SBU table, three new filters (Insurer, Business Month, Income Type), role-based widget visibility, and a systematic widget↔listing count-reconciliation contract. This document records the CURRENT behavior of the dashboard as implemented; it is the spec of record for regression.

---

## Scope

### In Scope

- Quarterly Target vs Actual view (`businessPerformanceQuarterlyData`) with per-quarter SBU breakdown (`businessPerformanceSbuData`).
- Sales Schedule by SBU and Renewal Schedule by SBU (`SbuPolicyExpiryTable`, endpoints `salesScheduleBySbu` / `renewalScheduleBySbu`) with 30/60/90/Beyond-90-day policy-expiry buckets.
- Endorsement TAT + Claims TAT by SBU (`SbuTatSummaryTable`, endpoint `tatSummaryData`) with TAT-range drill-downs.
- Insurer filter (with "N/A" placeholder behavior on unsupported widgets).
- Business Month filter (applies to exactly four widgets; all others render "--" placeholders).
- Income Type filter (applies to `businessPerformanceData` only; stripped from every other widget query).
- Role-based widget visibility (`useDashboardWidgetVisibility`): BD-pipeline widgets hidden for ISG-only users.
- Widget↔listing count reconciliation: drill-down period windows, the ±5-day expiry buffer, IIRM Holdings (organisation 0) resolution, the pending-activity table set, and the open-ended next30 follow-up window.
- Breadcrumb trail with return-scroll to the originating widget.

### Out of Scope

- Re-specifying Phase-1 widgets (see baseline below); only their Phase-2 behavior changes are covered.
- Changing business definitions pending client confirmation: follow-up bucket semantics ("days pending" vs "due date"), inclusion of Lost opportunities in funnel stage counts, and the funnel's expiry-date period basis. Tracked in Open Questions.
- Unifying the three team-set computations used across widgets and listings (tracked as a ticket; see Open Questions).

### Phase 1 Baseline (Do Not Re-specify)

- Page frame, Smart Search filter bar, Save View.
- My Actionable widget with tabs, time buckets and manager toggle.
- Target vs Actual (total overview), Business Performance bar chart, Business Collection Summary.
- My Sales Funnel, My Renewal Funnel.
- Brokerage to Collect, My Follow Up (SO/RO), Policy Type Distribution.
- Renewal Schedule by SBU (initial version), Endorsement TAT by SBU (initial version).

---

## User Roles

| Role | Description |
|------|-------------|
| BD Executive | Works the sales pipeline; sees SO funnel, SO follow-up, schedules, brokerage widgets scoped to own book ("Manager") or reporting tree ("Manager + Team"). |
| ISG Executive | Services placement/ISG activities; BD-pipeline widgets (SO/RO funnels, follow-ups, brokerage) are hidden for ISG-only users. |
| Manager / Team Lead | Uses "Manager + Team" view to see the reporting tree's numbers; owner tree-select narrows to a specific subordinate. |
| Leadership | Organisation-wide scope; org/SBU/vertical/department/branch filters resolve across the hierarchy, including the virtual "IIRM Holdings" (all organisations) selection. |

---

## User Stories

### US-DASH-201 — Quarterly performance with SBU breakdown

> As a **manager**, I want the Target vs Actual widget to show quarterly bars and, on clicking a quarter, the SBU-level breakdown for that quarter, so that I can locate which SBU is behind plan.

Clicking the total bar navigates to the Business Performance detail page with breadcrumbs preserved.

---

### US-DASH-202 — Sales/Renewal Schedule by SBU

> As a **BD executive**, I want per-SBU counts of policies expiring in 30/60/90/Beyond-90-day windows for both SO and RO pipelines, so that I can plan renewals and new-business follow-ups by SBU.

Each bucket count is a link that drills into the SO or RO opportunity listing pre-filtered to that SBU and expiry window.

---

### US-DASH-203 — Endorsement and Claims TAT by SBU

> As a **leadership user**, I want TAT distribution (by TAT ranges) for endorsements and claims per SBU, so that I can spot servicing bottlenecks.

Bucket counts drill into `/manage-endorsements` with the SBU and TAT range applied. When Business Month is applied, the Claims section renders "--" (not supported).

---

### US-DASH-204 — Insurer filter

> As a **manager**, I want to filter dashboard widgets by insurer, so that I can review the book placed with a specific insurer.

Widgets that cannot honour an insurer filter (Target vs Actual) render "--" placeholders instead of misleading unfiltered numbers. On the funnel, insurer selection is meaningful only at Placement Slip stage; other stages show 0 when drilling from the dashboard with an insurer applied.

---

### US-DASH-205 — Business Month filter

> As a **finance-oriented user**, I want a Business Month filter for collection- and servicing-oriented widgets, so that I can review a specific income month.

Applies to exactly: Renewal Schedule by SBU, Endorsement TAT by SBU, Brokerage to Collect, Policy Type Distribution. Every other widget renders "--" placeholders while Business Month is active, and their drill-downs are blocked.

---

### US-DASH-206 — Income Type filter

> As a **manager**, I want to split business performance numbers by Policy vs Endorsement income, so that I can distinguish new premium from endorsement premium.

Income Type feeds only `businessPerformanceData`; it is stripped from every other widget's query so that changing it alone does not refetch unrelated widgets.

---

### US-DASH-207 — Role-based widget visibility

> As an **ISG executive**, I want the dashboard to hide BD-pipeline widgets I cannot act on, so that my landing page is relevant to my role.

`useDashboardWidgetVisibility` gates SO/RO funnels and follow-ups; `VIEW_OPPORTUNITY` permission gates funnel rendering (Unauthorized otherwise).

---

### US-DASH-208 — Drill-down counts match widget counts

> As **any dashboard user**, I want the listing I land on after clicking a widget number to contain exactly the records that number counted, so that I can trust the dashboard.

See BR-DASH-201…207 for the reconciliation contract.

---

### US-DASH-209 — Return-to-widget navigation

> As **any dashboard user**, I want the back navigation from a drill-down to return me to the dashboard scrolled to the widget I came from, with my filters intact.

Implemented via breadcrumb state (`fromDashboard`, `lastRemovedBreadcrumb`) and per-widget scroll refs.

---

## Business Rules

### BR-DASH-201 — Filter cascading and validation

Organisation clears SBU/vertical/department/branch; SBU clears vertical/department; vertical clears department. Financial Year, Quarter and Month each clear the from/to dates; picking from/to clears Financial Year/Quarter/Month (the period fields are mutually exclusive). Run validates that from/to are provided as a pair and from ≤ to; violations show a toast and do not run.

**Example:** Selecting Q1 then typing a From date clears Q1; selecting Q2 afterwards clears the dates.

---

### BR-DASH-202 — Funnel drill-down period window

Clicking a funnel stage passes the raw filter selection (quarter/month/financialYear, or the user's explicit from/to dates) to the listing; the frontend derives no dates. The backend funnel drilldown computes the window with the same `getDateRange` used by the funnel endpoint — explicit from/to pair first, then month, then quarter (clipped to today when current), then full financial year — so the drilled listing always queries the exact window the funnel bar was computed for.

**Example:** FY 2026 + Q1 selected → drill carries quarter=Q1 & financialYear=2026; the backend resolves 2026-04-01 → 2026-06-30 on both the funnel and the listing.

---

### BR-DASH-203 — IIRM Holdings (organisation 0)

`organisationId=0` is a virtual id meaning "all organisations under IIRM Holdings". Both the funnel endpoint and the opportunity listing resolve it to the set of organisations with `parent_organisation_id = 0` and filter `organisation_id IN (...)`, for all roles. A raw `organisation_id = 0` equality must never reach SQL.

**Example:** IIRM Holdings + team view shows the union of all child-organisation opportunities in both the funnel and its drill-down.

---

### BR-DASH-204 — Expiry ±5-day buffer

Wherever a widget or listing filters on policy expiry date, the window is widened by `EXPIRY_BUFFER_DAYS` (5) on both sides, consistently on the widget count and the drill-down, so the two always agree. Consequence: Schedule-by-SBU buckets overlap by up to 5 days and deliberately do not sum to a distinct total.

---

### BR-DASH-205 — Follow-up (pending activities) counting

A pending activity is the FIRST incomplete activity of an opportunity (`completed_at IS NULL`, `planned_at NOT NULL`, sequence-gated), ranked across the full 16-table pending set (`PENDING_ACTIVITY_TABLES`); the widget and the drill-down must use the same table set. Buckets measure age = today − planned date: 30 = ≤30 days (including all future-planned, whose age is negative), 60 = 31–60, 90 = 61–90, beyond 90 = >90. Only performance-enabled opportunities in live statuses (Open/Default/WIP) with `expiry_date ≥ today−5` count; RO additionally requires a linked policy. BD/ISG Planning rows are synthetic (status-based, no activity row) and drill through the plain listing without a state filter.

**Example:** An RFP Data Collection activity planned for next week counts in the 30 bucket today.

---

### BR-DASH-206 — Follow-up next30 drill window is open-ended

Because the 30 bucket includes future-planned activities, its drill-down sends only `from = today−30` with NO upper bound; the backend applies `planned/created ≥ from`. The SO/RO listings accept a from-only range when arriving from a follow-up drill (`pendingActivities` navigation state); a to-only range remains invalid everywhere.

---

### BR-DASH-207 — Placeholder ("--") consistency

A widget that cannot honour the currently applied filter set must render "--" placeholders and block its drill-downs, never silently ignore the filter. Current matrix: Business Month → all widgets except Renewal Schedule by SBU, Endorsement TAT by SBU, Brokerage to Collect, Policy Type Distribution; Insurer → Target vs Actual.

---

### BR-DASH-208 — Funnel content

A funnel stage counts performance-enabled opportunities (RO also requires `ref_policy_id`) in team scope whose policy expires in the selected period (±5) and which completed that stage's activity in the period; expired opportunities re-enter if they were lost/closed in the period, won at placement in the period, or are still open. Lost opportunities with expiry in the window are intentionally included. Bars may be non-monotonic because won opportunities are attributed to Placement Slip only.

---

### BR-DASH-209 — Widget scoping

Widget team scope = the logged-in (or selected) user's reporting tree; `owner`/`userId` filters map to `viewBy`/`ownerId` on every drill-down. The follow-up widget applies organisation filters against the activity owner's organisation, while listings filter the opportunity's organisation (see Open Questions #2).

---

## Acceptance Criteria

### AC-DASH-201 — Quarterly view drill

**Given** the quarterly Target vs Actual view is displayed
**When** the user clicks a quarter bar
**Then** the SBU breakdown for that quarter loads; clicking the total bar navigates to Business Performance detail with breadcrumbs intact.

---

### AC-DASH-202 — Schedule-by-SBU bucket equals its drill count

**Given** the Sales or Renewal Schedule by SBU table shows N in a bucket
**When** the user clicks the bucket link
**Then** the SO/RO listing shows exactly N rows, filtered to that SBU and the bucket's ±5-buffered expiry window.

---

### AC-DASH-203 — TAT drill

**Given** the Endorsement TAT table shows a count for an SBU and TAT range
**When** the user clicks it
**Then** `/manage-endorsements` opens pre-filtered to that SBU and TAT range (plus Business Month when applied).

---

### AC-DASH-204 — Insurer N/A behavior

**Given** an insurer filter is applied
**When** the dashboard renders
**Then** Target vs Actual shows "--"; funnel drill-downs from the dashboard show non-placement stages as 0.

---

### AC-DASH-205 — Business Month isolation

**Given** a Business Month is selected and Run is pressed
**When** widgets refresh
**Then** only the four supported widgets show data; all others render "--" and their clicks do nothing.

---

### AC-DASH-206 — Income Type isolation

**Given** the user changes only Income Type and presses Run
**Then** only `businessPerformanceData`-backed panels refetch; all other widget queries are unchanged.

---

### AC-DASH-207 — ISG-only visibility

**Given** a user whose roles resolve to ISG-only
**When** the dashboard loads
**Then** SO/RO funnels and follow-ups are absent; a user without VIEW_OPPORTUNITY sees Unauthorized in funnel slots.

---

### AC-DASH-208 — Funnel stage drill parity

**Given** a funnel bar shows N for a stage under any period selection (FY, quarter, month, or custom dates)
**When** the user clicks the bar
**Then** the listing URL carries the funnel's exact period (per BR-DASH-202) and shows N rows, for IIRM Holdings as well as any concrete organisation.

---

### AC-DASH-209 — Follow-up next30 parity

**Given** the SO follow-up widget shows N for an activity in the 30 bucket, including future-planned activities
**When** the user clicks the count
**Then** the listing shows N rows; pressing Run on the landed listing with the from-only window does not raise a date-pair validation toast.

---

### AC-DASH-210 — Return scroll

**Given** the user drilled into a listing from any widget
**When** they navigate back via the breadcrumb
**Then** the dashboard restores the previously applied filters and scrolls to the originating widget.

---

## Data Contract

### Inputs

| Data Point | Source | Notes |
|------------|--------|-------|
| Business performance metrics | `businessPerformanceData`, `businessPerformanceQuarterlyData`, `businessPerformanceSbuData` (performance-service) | Only consumer of `incomeType` |
| Funnel stage counts | `opportunity-service /opportunity/sales-funnel?type=SO\|RO` | Sums `premium_paid` / `estimated_brokerage` deduped per opportunity |
| Pending activities summary | `opportunity-service /opportunity/pending-activities-summary` | Age buckets per BR-DASH-205 |
| Expiry schedules | `salesScheduleBySbu`, `renewalScheduleBySbu` | ±5-buffered expiry bands |
| TAT summary | `tatSummaryData` (policy-service) | Endorsement + claims sections |
| Brokerage to collect | `brokerageToCollect` | Business-month aware |
| Policy distribution | `policySummaryData` | Business-month aware |
| Filter option lists | `masterOrganisation`, `sbuByOrg`, `verticalsBySbu`, `departmentsByVertical`, `branchesByOrg`, `employeeHirarcy`, `insurersList`, shared `getAllMonths()` | Cascading per BR-DASH-201 |

### Outputs / State Changes

| Data Point | Consumer | Notes |
|------------|----------|-------|
| Drill-down navigation state (`filters`, `fromDashboard`, `pendingActivities`, breadcrumbs) | SO/RO opportunity listings, biz-done report, manage-endorsements, client portfolio | Listings trust these filters; they do not recompute periods |
| Saved default view | `updateUserDefaultConfig` (dashboard entity key) | Restored on next dashboard load |

---

## Open Questions

| # | Question | Owner | Due |
|---|----------|-------|-----|
| 1 | Listing team scope: the pending drill-down applied no owner/team clause in captured SQL, and three team-set computations disagree (widget hierarchy vs reportees vs scope.utils). Unify on one computation? | Tech Lead | Ticketed |
| 2 | Follow-up widget filters by the activity OWNER's organisation; listings filter the OPPORTUNITY's organisation. Align on one definition? | PM + Tech Lead | — |
| 3 | Follow-up bucket semantics: keep "days pending" (current, with future-planned in the 30 bucket) and rename columns, or switch to due-date buckets with an Overdue column? | Client | Awaiting reply |
| 4 | Funnel period basis (policy expiry ±5) and inclusion of Lost opportunities in stage counts — formal client sign-off pending. | Client | Awaiting reply |

---

## Approval

_Client sign-off is required before Stage 40b (TRD) begins._

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```
