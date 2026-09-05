# Dashboard — Product Requirements Document (Phase 1)

**Module:** DASHBOARD (`IIRM-751`)
**Product:** iWork (iWorkedge) — IIRM Sales & Operations Platform
**Author:** Nithin Sirigiri (TL / Product Owner)
**Date:** 2026-06-30
**Status:** In Progress — reverse-engineered from production

---

This document captures the product behavior contract for the iWork Dashboard — the entry screen every sales and operations user lands on after sign-in. The Dashboard is the central command surface: it surfaces actionable items that need attention today, business performance against targets, pipeline health, team delivery TAT, and renewal exposure — all in one scroll. This PRD is a reverse-engineering of the live production implementation at `/dashboard` and is intended to serve as the authoritative product specification for Phase 1. A developer, QA engineer, or new team member reading this cold should find every behavioral rule and acceptance criterion needed to build or test the feature without supplementary conversations.

> **Note on scope boundary:** The "My Team Celebrations" and "Announcements & Alerts" sections visible in the right column of the Dashboard are intentionally excluded from this PRD. They are governed by a separate product specification. A reference to that PRD will be added here once it is published.

---

## Scope

### In scope for this PRD

- Dashboard page header and welcome copy
- Smart Search global filter bar — all filter fields, cascading dependencies, sticky behavior, Save View, and Run/Reset
- **My Actionable** widget — tabs, time-bucket columns, item cards, Manager/Manager+Team toggle, list/calendar view toggle, drag-and-drop, navigation
- **My Business Performance** composite section — all active sub-widgets:
  - Target vs Actual Breakdown (quarterly performance + SBU drilldown)
  - Business Performance Bar Chart
  - My Sales Funnel (SO pipeline, permission-gated)
  - My Renewal Funnel (RO pipeline, permission-gated)
  - Renewal Schedule by SBU
  - Business Collection Summary
  - Brokerage to Collect
  - Endorsement TAT by SBU
  - My Follow Up (permission-gated)
  - Policy Type Distribution
- Permission-gating behavior for each widget
- Filter context propagation on drilldown navigation
- Business month filter scoping rules

### Out of scope (deferred — not rendered in Phase 1)

The following widgets exist in the codebase but are commented out and not rendered in production. They are out of scope for this PRD and must not be built against without a separate change record:

- Smart Actions quick-access panel (New Policy, Process Claim, Endorsement)
- Endorsement TAT aggregate (right-column card)
- Claims TAT aggregate (right-column card)
- Policy Expiry Timeline (right-column card)
- Client Service Analysis
- Business Overview card / Claims Overview card
- My Delivery Performance

---

## User Stories

The stories below are grouped by widget. Each traces to a functional requirement of the Dashboard module.

### Page Frame

**US-DASH-001 — View Dashboard welcome header**
As a logged-in iWork user, I want to see a welcome header when I navigate to the Dashboard so that I know I am in the right place and understand what the page provides.

**US-DASH-002 — Persist filter context on navigation return**
As a user who drills into a detail page (opportunities, policies, endorsements, claims) from the Dashboard and then navigates back, I want the Dashboard to restore the filter state I had applied before leaving so that I do not have to re-apply my filters.

---

### Smart Search Filter Bar

The Smart Search filter bar is the global control surface for the My Business Performance section. It gates all sub-widgets: any filter applied here propagates to every active sub-widget simultaneously.

**US-DASH-003 — Apply hierarchical filters**
As a manager or team lead, I want to filter the Dashboard by organisation, SBU, vertical, department, branch, and owner so that I can focus on a specific part of the business hierarchy.

**US-DASH-004 — Filter by financial period**
As a user, I want to filter the Dashboard by financial year, quarter, month, or a custom from/to date range so that I can view performance for a specific time window.

**US-DASH-005 — Filter by income type and insurer**
As a user, I want to filter performance data by income type (Policy / Endorsement / All) and by a specific insurer so that I can analyse a targeted slice of the business.

**US-DASH-006 — Save current filter state as default view**
As a user, I want to save my current filter selections as my personal default view so that the Dashboard opens with those filters pre-applied on my next visit.

**US-DASH-007 — Reset filters to default**
As a user, I want to reset all filters to their default values with a single action so that I can quickly return to the standard view after exploration.

**US-DASH-008 — Use sticky filter bar when scrolled**
As a user who has scrolled past the filter bar, I want a floating filter icon to appear at the top of the page so that I can re-open the filters without scrolling back to the top.

---

### My Actionable Widget

**US-DASH-009 — View all pending actionable items**
As a user, I want to see all my pending meetings, approvals, assignments, tasks, sales activities, and notes grouped into time buckets (Overdue & Today / Next 7 Days / Future) so that I know what requires my attention and when.

**US-DASH-010 — Filter actionable items by type**
As a user, I want to switch between tabs (All, Meetings, Approvals, Assignments, Tasks, Sales activities, Notes) so that I can focus on one category of work at a time.

**US-DASH-011 — Toggle scope between Manager and Manager + Team**
As a manager, I want to toggle the My Actionable view between "Manager" (my own items only) and "Manager + Team" (my items plus my team's items) so that I can oversee team activity or focus on my own workload.

**US-DASH-012 — Navigate to an actionable item's detail**
As a user, I want to click the navigate icon on any actionable item card so that I am taken directly to the detail record for that item.

**US-DASH-013 — Switch between list and calendar view**
As a user, I want to toggle between a list view and a calendar view for my actionable items so that I can see my schedule in a time-oriented layout.

---

### Target vs Actual Breakdown

**US-DASH-014 — View quarterly business performance vs target**
As a manager, I want to see my brokerage achievement vs target for each quarter (Q1–Q4) displayed as a grouped bar chart so that I can assess how performance is trending across the financial year.

**US-DASH-015 — View overall total performance summary**
As a manager, I want to see a "Total Overview" panel showing overall achievement percentage, variance amount, and a total bar chart so that I can understand my cumulative position at a glance.

**US-DASH-016 — Drill into a quarter to see SBU-level breakdown**
As a manager, I want to click on a quarter bar to see the breakdown of performance by SBU for that quarter so that I can identify which business units are above or below target.

**US-DASH-017 — Navigate to Business Performance detail from total bar**
As a manager, I want to click the total overview bar or a navigation control to land on the full Business Performance detail page so that I can analyse month-level data with additional drill-down options.

---

### My Business Performance Bar Chart

**US-DASH-018 — View performance bar chart summary**
As a manager, I want to see a bar chart representation of my business performance metrics (brokerage: SO, RO, Mined, Total) so that I have a visual summary of performance alongside the quarterly table.

---

### My Sales Funnel

**US-DASH-019 — View SO pipeline funnel**
As a sales user with opportunity access, I want to see a funnel chart of my SO (Sales Opportunity) pipeline stages so that I understand where deals are stalling or progressing.

**US-DASH-020 — Drill into a funnel stage**
As a sales user, I want to click on a funnel stage to navigate to the Opportunities listing pre-filtered to that stage and my current Dashboard filters so that I can work on the relevant records immediately.

---

### My Renewal Funnel

**US-DASH-021 — View RO pipeline funnel**
As a sales user with opportunity access, I want to see a funnel chart of my RO (Renewal Opportunity) pipeline stages so that I can monitor renewal conversion health.

**US-DASH-022 — Drill into a renewal funnel stage**
As a sales user, I want to click on a renewal funnel stage to navigate to the Renewal Opportunities listing pre-filtered to that stage and my current Dashboard filters.

---

### Renewal Schedule by SBU

**US-DASH-023 — View upcoming policy renewals bucketed by expiry timeline**
As a manager, I want to see a table showing how many policies are expiring in the next 30 days, 30–60 days, 60–90 days, and beyond 90 days, broken down by SBU, so that I can prioritise renewal effort.

**US-DASH-024 — Drill into a renewal expiry bucket**
As a manager, I want to click on a bucket cell in the Renewal Schedule table to navigate to the Renewal Opportunities listing pre-filtered to that SBU and expiry date range.

---

### Business Collection Summary

**US-DASH-025 — View premium and brokerage collection status**
As a manager, I want to see a summary table of premium collection (target vs achieved vs %) so that I can monitor cash flow against expectations.

---

### Brokerage to Collect

**US-DASH-026 — View brokerage outstanding to collect**
As a manager, I want to see brokerage amounts that are due or outstanding so that I can follow up with clients and insurers to close collection gaps.

---

### Endorsement TAT by SBU

**US-DASH-027 — View endorsement and claims turnaround time by SBU**
As a manager, I want to see a table showing how many endorsements and claims are open at each TAT bucket (<3 days, <7 days, <14 days, >14 days) for each SBU so that I can identify processing bottlenecks.

**US-DASH-028 — Drill into a TAT bucket**
As a manager, I want to click on a TAT bucket cell to navigate to the Manage Endorsements or Manage Claims listing pre-filtered to that SBU and TAT range so that I can take action on overdue items.

---

### My Follow Up

**US-DASH-029 — View follow-up activities pending for SO or RO**
As a sales user, I want to see a list of follow-up activities that are pending for my Sales Opportunities (SO) or Renewal Opportunities (RO) so that I can track what outreach is due.

**US-DASH-030 — Toggle follow-up between SO and RO**
As a sales user, I want to toggle between the SO and RO views of my follow-up list so that I can focus on one category at a time.

---

### Policy Type Distribution

**US-DASH-031 — View policy portfolio breakdown by policy type**
As a manager, I want to see a bar chart showing the distribution of my policies by type, along with count, premium, and brokerage values, so that I understand the composition of my portfolio.

**US-DASH-032 — Navigate to full client portfolio**
As a manager, I want a "View Portfolio" button on the Policy Type Distribution widget that takes me to the My Client Portfolio page with my current Dashboard filters pre-applied.

---

## Business Rules

### Filter Bar Behavior

**BR-DASH-001 — Hierarchical filter cascading**
The Organisation, SBU, Vertical, Department, and Branch filters cascade. A child dropdown is disabled until its parent field has a specific (non-"All") value, and its options are fetched scoped to the parent's value. The clear-on-change cascade is asymmetric — changing a field clears exactly the fields listed below, nothing more:

| Field | Options fetched by | Enabled when | Changing it clears |
|---|---|---|---|
| Organisation | master organisation list | always | SBU, Vertical, Department, Branch |
| SBU | SBUs of the selected organisation | Organisation selected | Vertical, Department |
| Vertical | verticals of the selected SBU | SBU selected | Department |
| Department | departments of the selected vertical | Vertical selected | — |
| Branch | branches of the selected organisation | Organisation selected | — |

Note Branch depends on **Organisation**, not on SBU — an SBU change does not clear Branch.

**BR-DASH-002 — ViewBy scope controls ownership**
The "View by" filter has two values: `Manager` (returns data owned by the selected owner only) and `Manager + Team` (returns data owned by the selected owner and all direct/indirect reports). This filter is independent of the organisational hierarchy filters — both can be applied simultaneously.

**BR-DASH-003 — Business Month filter scope is limited**
The Business Month filter applies only to four widgets: Renewal Schedule by SBU, Endorsement TAT by SBU, Brokerage to Collect, and Policy Type Distribution. All other widgets on the Dashboard ignore this filter. When Business Month is applied, widgets that do not support it display a "not applicable" (--) placeholder rather than stale or incorrect data.

**BR-DASH-004 — Insurer filter renders N/A for unsupported widgets**
When an insurer filter is applied, widgets that do not support insurer-level segmentation (e.g. Target vs Actual Breakdown, Business Performance Bar Chart) display a "not applicable" placeholder.

**BR-DASH-005 — From/To dates require both fields**
If the user provides only a From date or only a To date, the system must show a validation error and must not run the query. The From date must be earlier than or equal to the To date; otherwise an error is shown.

**BR-DASH-006 — Financial year default**
The financial year filter defaults to the current financial year. The calendar year is used as the default identifier when a financial year is not specified by the user.

**BR-DASH-007 — Filter context propagates on drilldown navigation**
When a user navigates from any Dashboard widget to a detail page (opportunities, policies, endorsements, claims), the applicable Dashboard filters must be passed as pre-applied filters on the destination listing. Filters that the destination does not support (e.g. `businessMonth` for the opportunities listing; `incomeType` for TAT endpoints) must be stripped before the request is made to the destination service.

**BR-DASH-008 — Save View persists per user per entity key**
Save View stores the current filter selections as the user's personal default for the Dashboard entity key. The next time the user opens the Dashboard, the stored filters are automatically applied and the data is fetched with those filters in effect.

**BR-DASH-058 — Filter panel layout and control types**
The expanded Smart Search panel groups fields under two bold section titles — **Organisation** (Organisation, SBU, Vertical, Department, Branch, Owner, View by, Income Type, Insurer) and **Period** (Financial Year, Quarter, Month, From date, To date, Business month). Control types:
- All fields are dropdowns except: **Owner** — a searchable employee tree ("Select employee" placeholder); **View by** — a two-button segmented toggle (Manager / Manager + Team), not a dropdown; **From/To dates** — date pickers (DD/MM/YYYY with calendar icon).
- The From/To date labels carry the suffix "(Applied on date of income)" — the range filters on the income booking date, not the policy period.
- The action row at the bottom-right shows: **Save View | Reset | Collapse | Run**.
- A summary line at the bottom-left of the expanded panel lists the current selections, **including default "All" values** (e.g. "Organisation: IIRM India | View by: Manager + Team | Income Type: All | Quarter: All | Month: All").

**BR-DASH-059 — Owner tree source**
The Owner field is fed by the employee-hierarchy API and rendered as a searchable tree of the user's reporting hierarchy. Reset returns Owner to the logged-in user.

**BR-DASH-060 — Period modes are mutually exclusive**
There are two ways to express a period, and they clear each other:
- Selecting a **Financial Year** clears From/To dates. Selecting a **Quarter** clears Month and From/To dates. Selecting a **Month** clears From/To dates.
- Setting **either** From or To date clears Financial Year, Quarter, and Month.
A user can therefore never have both an FY/Quarter/Month selection and an explicit date range active at the same time.

**BR-DASH-061 — Financial Year options**
FY options are generated from the configured start year (default 2024) up to the **next** financial year (current FY + 1), labelled as ranges (e.g. "2025-2026"). The financial year boundary is April: from April onward the current calendar year is the FY start; January–March belong to the previous FY start.

**BR-DASH-062 — Month options are coupled to Quarter**
When a specific Quarter is selected, the Month dropdown offers only that quarter's months on the **financial-year calendar**: Q1 = April–June, Q2 = July–September, Q3 = October–December, Q4 = January–March. When Quarter is "All", all 12 months plus "All" are offered.

**BR-DASH-063 — Business month is a dashboard-only field**
The Business month dropdown (All + 12 month names) is appended to the filter config only on the Dashboard. Other screens that reuse the shared business-performance filter config do not see this field.

**BR-DASH-064 — Filters are staged until Run**
Selecting or changing filter fields has no data effect by itself (aside from the clear-on-change cascades). No widget re-fetches until the user clicks **Run**. The exception is initial page load: saved default filters (Save View or system defaults) are applied and fetched automatically without a Run click.

**BR-DASH-065 — Financial Year semantics**
The FY value is the start year (selecting "2025-2026" stores `2025`). For period-driven widgets the backend resolves it to the range April 1 of the start year through March 31 of the following year. FY combines with Quarter and Month as progressive narrowing (FY 2025-26 + Q2 = July–September 2025); it clears only the From/To dates, never Quarter or Month. A fully elapsed FY renders all four quarters with actuals in Target vs Actual — the hatched "upcoming" placeholder appears only for quarters with zero actual.

**BR-DASH-066 — Today-relative widgets do not shift with period filters**
Two widgets compute their column windows relative to **today**, not to the selected period:
- **Renewal Schedule by SBU** — expiry buckets are always "next 30/60/90 days from today" over RO opportunity expiry dates. Its drilldown strips financialYear, quarter, month, and from/to, passing only the bucket's expiry date range. Selecting a past FY does not shift the buckets.
- **Brokerage to Collect** — "Current Month" and "Last Month" are always the current and previous calendar months regardless of selected FY; only "Prior to that" is bounded by the selected FY (April 1 of the FY through the day before last month's start, capped at FY end). With a past FY selected, the Current/Last Month columns fall outside the selected FY — whether the underlying rows are FY-filtered server-side is unconfirmed (Open Question 9).

---

### My Actionable Rules

**BR-DASH-009 — Time bucket classification**
Items in the My Actionable list are classified into three time buckets by their due date or scheduled date: (1) Overdue & Today — items due on or before today; (2) Next 7 Days — items due between tomorrow and 7 days from today; (3) Future — items due more than 7 days from today. The bucket count in the column header updates to reflect the number of items in that bucket.

**BR-DASH-010 — Manager scope vs Manager + Team scope**
When "Manager" is selected, the widget fetches only items owned by or assigned to the current user (`viewBy=self`). When "Manager + Team" is selected, the widget fetches items owned by or assigned to the current user and all team members (`viewBy=self_team`).

**BR-DASH-011 — Tab filtering**
The "All" tab shows every item type together. Each named tab (Meetings, Approvals, Assignments, Tasks, Sales activities, Notes) shows only items of that type. The active tab is visually indicated with an underline and dot marker. Switching tabs does not reset the time bucket columns — items re-render in the same three-column layout filtered to the selected type.

**BR-DASH-012 — Navigate icon context**
The navigate icon on each item card takes the user to the specific detail record for that item (policy, opportunity, endorsement, or task as appropriate). The destination must receive a breadcrumb entry pointing back to the Dashboard so the user can return without losing context.

---

### Business Performance Sub-widget Rules

**BR-DASH-013 — TAT bucket columns and link styling**
In the Endorsement TAT by SBU table, the TAT bucket column headers come from the API bucket labels: **< 3 Days, < 7 Days, < 14 Days, > 14 Days** (exclusive ranges — see BR-DASH-068 for the exact formulas). Bucket cells in data rows render as blue underlined links (clickable); cells in the pinned Total row render as plain right-aligned text (not clickable). There is **no per-bucket color coding** in this table.

**BR-DASH-014 — Renewal Schedule bucket labels and their real ranges**
The Renewal Schedule by SBU column headers are: **Next 30 Days, Next 60 Days, Next 90 Days, Beyond 90 Days**. Despite the cumulative-sounding labels, the buckets are **mutually exclusive** ranges — 0–30, 31–60, 61–90, and 90+ days from today — and the drilldown date ranges use those exclusive boundaries. Bucket cells in data rows render as blue underlined links (including cells with value 0); the pinned Total row is plain text. There is **no per-bucket color coding** in this table.

**BR-DASH-015 — Business Collection Summary row derivation**
The Premium Collection row in the Business Collection Summary table derives its target from `targetPremiumCollected` and its achieved from `premiumCollected` in the business performance API response. Percentage is calculated as `(achieved / target) × 100`. If target is zero, percentage displays as `--`.

**BR-DASH-016 — SBU drilldown in Quarterly Performance**
Clicking on a specific quarterly bar loads the SBU breakdown for that quarter. The SBU breakdown query appends the selected `quarter` parameter to the existing filter query string. Clicking away from a selected quarter (or clicking the same quarter again) resets the SBU view to the unfiltered all-quarter state.

**BR-DASH-017 — My Follow Up SO/RO toggle**
The My Follow Up widget defaults to the RO (Renewal Opportunity) view. Toggling to SO switches the API call to fetch SO-related pending activities. The widget fires a scroll-into-view if the user arrived at the Dashboard after navigating back from an SO follow-up, and sets the toggle to SO automatically. The equivalent applies for RO.

**BR-DASH-018 — Permission gates**
The following widgets require specific permissions:
- My Sales Funnel and My Renewal Funnel require `VIEW_OPPORTUNITY`. If not granted, the widget placeholder shows "Unauthorized".
- My Follow Up visibility is controlled by `dashboardWidgetVisibility.myFollowUp`. ISG-only users do not see this widget.
- My Sales Funnel visibility is controlled by `dashboardWidgetVisibility.salesFunnel`.
- My Renewal Funnel visibility is controlled by `dashboardWidgetVisibility.renewalFunnel`.
- My Team Celebrations and Announcements & Alerts require `VIEW_DASHBOARD`. These are out of scope for this PRD (see note at top).

**BR-DASH-019 — Sticky filter bar activation threshold**
The floating filter icon appears when the bottom edge of the Smart Search container has scrolled above the top edge of the scroll container's visible area. The icon opens an expanded inline filter panel (the same fields as the main Smart Search). Running or collapsing the inline panel hides the floating icon.

**BR-DASH-020 — Smart Search collapsed chip summary view**
After the user applies filters and clicks Run (or Collapse), the Smart Search bar renders in a collapsed summary mode. The current filter values are displayed inline as labelled chips — **including default "All" values** (e.g. "Organisation: IIRM India | View by: Manager + Team | Income Type: All"). When the chips exceed the visible width, the overflow collapses to "+N more". The full filter panel re-expands when the user clicks the filter expand icon or the chip summary area. The same summary line also appears at the bottom of the expanded panel (see BR-DASH-058).

---

### My Actionable Widget Rules

**BR-DASH-021 — Item card anatomy**
Each item card in the My Actionable list renders the following fields in order:
1. **Activity type icon** — an icon representing the item type (e.g. phone icon for meetings/KDM meetings). The icon color uses the product's primary/brand palette for overdue or active items.
2. **Title and date** — displayed on the same line, separated by a middle dot. Both are rendered in the primary brand color.
3. **Company › Category breadcrumb** — the associated company name followed by the activity category (e.g. "Demo Corporation › KDM Meeting"), rendered in small secondary text.
4. **Agenda or description** — a single line of descriptive text below the breadcrumb (e.g. "Agenda: KDM Meeting").
5. **Navigate icon (↗)** — pinned to the top-right corner of the card. Clicking it navigates to the item's detail record.

A card with a highlighted/selected state renders with a light blue background. Cards whose due date is in the past (overdue) appear in the "Overdue & Today" bucket regardless of how far past they are.

**BR-DASH-022 — Empty state text per time bucket**
When a time-bucket column has zero items (count = 0), the column body renders a centred text placeholder. The text follows the pattern:
- "Overdue & Today" column with 0 items: no empty state text (items here imply overdue; show nothing when empty).
- "Next 7 Days (0)": "No Tasks for next 7 days"
- "Future (0)": "No Tasks for future"

These strings are static and do not vary by the active tab.

---

### Business Performance Bar Chart Rules

**BR-DASH-023 — Bar chart metrics and series**
The Business Performance Bar Chart shows exactly two business metrics: **New Business** (SO brokerage) and **Retention** (RO brokerage). Each metric is rendered as a horizontal dual-bar row with two series: Target (gray, `#94a3b8`) and Achieved (blue, `#2563eb`). The chart subtitle reads "Performance metrics with target vs achieved comparison". Clicking anywhere on the chart navigates to the `/business-performance` detail page with the current filter state. When the N/A placeholder is active (insurer or businessMonth filter applied), all bar values display as "--" and no navigation fires on click.

---

### Business Collection Summary Rules

**BR-DASH-024 — Table structure and Phase 1 data availability**
The Business Collection Summary table has four columns: **Name | Target | Achieved | Percentage**. It contains six fixed rows in order: Business booked, Premium, Business billed, Business unbilled, Invoiced, Not collected. As of Phase 1, only the **Premium** row is populated from the live API (`targetPremiumCollected` and `premiumCollected` from the business performance data). All other rows display "--" across Target, Achieved, and Percentage.

Value formatting: Target and Achieved render as full amounts in Indian digit grouping (e.g. `1,03,72,16,079`), **not** in Cr/L short format. Percentage = `(Achieved ÷ Target) × 100` formatted to **two decimals** (e.g. `2.87%`); "--" when Target is 0 or either value is missing. The table shows standard pagination controls (page sizes 5/10/20) and does not support drill-through navigation.

---

### Brokerage to Collect Rules

**BR-DASH-025 — Table structure and column date definitions**
The Brokerage to Collect table shows outstanding brokerage grouped by insurer. Columns are: **Insurer Name | Current Month | Last Month | Prior to that | Total**. Column date boundaries are calculated relative to today's date at render time:
- **Current Month** — the full current calendar month (1st to last day of month).
- **Last Month** — the full previous calendar month.
- **Prior to that** — from the start of the selected financial year (April 1) up to the day before the start of last month.

The **Total** column is the sum of the three period columns and is not clickable. A pinned summary row at the bottom shows the total across all insurers per column.

**BR-DASH-026 — Drilldown from Brokerage to Collect**
Clicking any of the three period columns (Current Month, Last Month, Prior to that) in a data row navigates to the **Biz Done Report** (`/business-performance`) with the date range for that column pre-applied as the `from`/`to` filter. The financial year filter from the Dashboard is retained so the Biz Done Report's FY dropdown pre-fills correctly. Clicking a pinned summary row cell does not trigger navigation. The "Prior to that" date range upper boundary is capped at the end of the selected financial year to prevent bleed into a future period.

---

### My Follow Up Rules

**BR-DASH-027 — Table structure**
The My Follow Up table shows pending follow-up activities by activity type. Columns are: **Activity Name | Last Week | >1 Week | >2 Weeks | 30 Days | 45 Days | Total**. Each time-bucket column represents the count of activities that have been pending for at least that long. A pinned summary row at the bottom shows totals per column.

**BR-DASH-028 — Drilldown behavior by SO/RO toggle state**
Clicking a time-bucket cell when the toggle is set to **SO** navigates to `/opportunities`; when set to **RO** it navigates to `/renewal-opportunities`. The clicked cell passes the `activityName` (with "Planning" mapped to "Data Validation") and a computed date range matching the column's time window. The state flag is `pendingActivities: true` to signal to the destination listing that this is a follow-up drill.

When the toggle is set to **ALL**, time-bucket cells are non-clickable (cursor is default, no navigation fires). The Activity Name column remains non-clickable in all toggle states.

**BR-DASH-029 — N/A placeholder when businessMonth applied**
When the Business Month filter is active, the My Follow Up widget does not fetch data and renders an empty table. This is consistent with BR-DASH-003 (businessMonth not supported by this widget).

---

### Policy Type Distribution Rules

**BR-DASH-030 — Pie chart data and rendering**
The widget renders a donut/pie chart where each slice represents a distinct policy type sized proportionally by policy count. Slices are assigned colors from the product color palette in the order the data is returned (sorted descending by policy count). A legend on the right side of the chart lists each policy type with its corresponding color dot. **Policy types with a count of zero are excluded from the chart.** The chart renders a "No data available" state when the full dataset is empty.

**BR-DASH-031 — Hover tooltip fields**
Hovering over a pie slice reveals a tooltip card with the following fields: policy type name, policy count, premium amount (formatted with localisation), brokerage amount (formatted with localisation), and endorsement count. The tooltip disappears when the user moves the cursor off the slice.

**BR-DASH-032 — Slice click drilldown to policy listing**
Clicking a slice navigates to `/policies` pre-filtered to that `iirmPolicyType`. The filter mapping rule for the date range is:
- If a specific **Quarter** filter is active, the date range is resolved to that quarter's start/end boundaries within the selected financial year (Q1 = Apr 1 – Jun 30; Q2 = Jul 1 – Sep 30; Q3 = Oct 1 – Dec 31; Q4 = Jan 1 – Mar 31 of the following year).
- If no quarter is selected but a **Financial Year** is active, the financial year value is passed directly.
- `userId` → remapped to `ownerId`; `owner` → remapped to `viewBy` for the destination.

---

### Renewal Schedule by SBU Rules

**BR-DASH-033 — Table structure**
The Renewal Schedule by SBU table has columns: **SBU | Next 30 Days | Next 60 Days | Next 90 Days | Beyond 90 Days** (there is no Total column). The SBU column is pinned left. A "Total" summary row is pinned at the bottom showing column-level sums across all SBUs; its cells are not clickable. Every bucket cell in a data row — including zeros — renders as a clickable link and triggers drilldown. The table shows pagination controls (page sizes 5/10/20). When businessMonth-driven N/A mode is active, all bucket cells render "--" and are not clickable.

---

### Endorsement TAT by SBU Rules

**BR-DASH-034 — Table structure**
The Endorsement TAT by SBU table has an SBU column, TAT bucket columns for endorsements, TAT bucket columns for claims (same ranges), and a Total column per section. A "Total" summary row is pinned at the bottom. Both the endorsement section and the claims section occupy the same table — the column grouping differentiates them visually. The bucket column headers reflect the configured TAT ranges.

---

### My Actionable — Actions, Permission Gating & Routing Rules

**BR-DASH-035 — In-card actions by item type**
Beyond viewing, item cards support type-specific actions:
- **Tasks** — edit (opens the Task/Meeting/Notes side drawer), delete, and mark complete (checkbox on the card). Completing shows a success toast and flips the card's status to completed in place.
- **Meetings** — edit (opens drawer on the Meeting tab) and **post-meeting feedback** (opens a dedicated feedback drawer).
- **Notes** — edit only.
- **Approvals / Assignments / Sales activities** — not editable via the drawer. Clicking opens the drawer only when the item is a plain Task or is flagged editable (`taskIsEditable = "yes"`); otherwise the click is a navigation. Assignments additionally support mark-complete.

**BR-DASH-036 — Drag-and-drop rescheduling**
Cards can be dragged between the three time-bucket columns. Dropping a card persists the new due date to the backend and shows a success toast ("date updated") or an error toast on failure. This applies across all draggable item types in list view.

**BR-DASH-037 — Tab-level permission gating**
- **Approvals tab** is rendered only when the user holds `APPROVE_BD_OPPORTUNITY` or `APPROVE_ISG_OPPORTUNITY`.
- **Assignments tab** is rendered only when the user holds `ASSIGN_BD_ACTIVITY` or `ASSIGN_ISG_ACTIVITY`.
- **Notes tab** exists only in list view; it disappears when calendar view is active.
Users without the permissions simply do not see those tabs — no unauthorized placeholder.

**BR-DASH-038 — View toggle resets the active tab**
Switching between list view and calendar view resets the active tab to "All". The calendar date also resets to today whenever the toggle or the active tab changes.

**BR-DASH-039 — Navigate routing by task origin**
The navigate action routes by the item's `taskOrigin`:
- `policy_section_approval` → `/policies/{policyId}`, opening the tab named by the item's `taskLabel`.
- `policy_configuration_approval` → `/policies/configure/{policyId}`.
- Item linked to an opportunity **and** an activity → `/opportunities/{opportunityId}?{activityId}`.
- Item linked to an opportunity only → `/opportunities/{opportunityId}`.
- An "ISG Planning Task" always navigates directly to its opportunity detail (never opens the edit drawer).

**BR-DASH-040 — Two independent scope controls on the page**
The Dashboard has two separate "view by" controls that must not be conflated:
1. The **Manager / Manager + Team radio inside My Actionable** — affects only the My Actionable items (`viewBy=self` / `viewBy=self_team`).
2. The **View by field in the Smart Search bar** — affects only the My Business Performance sub-widgets (`owner=manager` / `owner=team`).
Changing one has no effect on the other.

---

## Widget Data Derivation Rules

Every number on the Dashboard has a defined derivation. This section is the contract for how each figure is computed — QA should validate values against these formulas, not against another screen.

### Target vs Actual — Total Overview panel

**BR-DASH-041 — Achievement %**
`Achievement = round((Total Actual ÷ Total Target) × 100)`, displayed as a whole number. When Total Target is 0, Achievement displays **0%**. Note the rounding consequence: a small actual against a large target legitimately displays 0% (e.g. Actual 19.03 L vs Target 67.83 Cr → 0%). This is expected behavior, not a defect.

**BR-DASH-042 — Variance**
`Variance = Total Actual − Total Target`, currency-formatted (Cr/L per localisation). Positive variance is prefixed `+` and rendered green; negative variance renders red with the `−` sign.

**BR-DASH-043 — Totals source**
Total Target and Total Actual are the sums of the per-quarter `target` and `achieved` values from the quarterly performance API, **excluding** any row whose quarter is labelled "total". The two overview bars (Target gray, Actual blue) are height-scaled relative to the larger of the two values; the values animate on load.

### Target vs Actual — Quarterly Performance panel

**BR-DASH-044 — Quarter bar rendering and visual scaling**
Each quarter (Q1–Q4) renders a Target bar and an Actual bar with the numeric values printed above (Target on top in gray, Actual below in blue). Bar heights use **square-root scaling with a minimum height** — heights are indicative of relative size, not linearly proportional. The printed values are the authoritative figures.

**BR-DASH-045 — Upcoming / no-actual quarter placeholder**
A quarter whose Actual is 0 is treated as "upcoming": the Actual bar renders as a hatched/dashed placeholder (40% of the Target bar height, minimum height applied), no Actual value is printed, and the placeholder is not hoverable. The Target bar and value still render normally.

**BR-DASH-046 — Quarter selection and locking**
Clicking a quarter card selects it and loads the SBU breakdown for that quarter (`quarter` param appended to the SBU API call). When exactly **one** quarter has any data (target or actual > 0), that quarter is auto-selected and locked. Deselecting returns the lower panel to "Overall SBU breakdown" (no quarter param).

**BR-DASH-047 — Hover tooltip**
Hovering a quarter's bars shows a tooltip with three rows: Target, Actual, and Variance (`actual − target`, `+`-prefixed and green when ≥ 0, red otherwise).

### Target vs Actual — SBU breakdown panel

**BR-DASH-048 — SBU bar rules**
The panel title shows the selected quarter (e.g. "Q1 SBU breakdown") or "Overall SBU breakdown" when no quarter is selected. Only SBUs with `target + achieved > 0` are rendered. An SBU with a target but zero achieved shows "--" in place of the Actual value with no actual bar. While a new quarter's SBU data is loading, the previous bars remain visible (no flicker to empty).

### Business performance metric definitions (bar chart + collection summary)

**BR-DASH-049 — Metric source formulas (all six metric groups)**
The business performance API returns six metric groups, all derived from the `business_target` table (targets) and the `performance_output` table (achieved), filtered by the applied period and hierarchy filters. Targets sum `value_of_target` from `business_target` by entity type; achieved values sum from `performance_output`; counts sum `entity_count`. Percentage is `(Achieved ÷ Target) × 100` in every group.

| # | Metric | Target entity type(s) | Achieved entity type(s) |
|---|---|---|---|
| 1 | New Business | `SO_POLICY` | `SO_POLICY` + `SO_ENDORSEMENT` |
| 2 | Retention | `RO_POLICY` | `RO_POLICY` + `RO_ENDORSEMENT` |
| 3 | Mined Business | `MINED_POLICY` | `MINED_POLICY` + `MINED_ENDORSEMENT` |
| 4 | Total Business | `TOTAL_POLICY` | `TOTAL_POLICY` + `TOTAL_ENDORSEMENT`, **or** the sum of all SO/RO policy + endorsement types |
| 5 | Premium Collection | Expected = `POLICY_PREMIUM` (`value_of_target`) | Collected = `POLICY_PREMIUM` (`entity_count` field carries the collected amount) |
| 6 | Brokerage Collection | Expected = total-policy entity types (as row 4) | Collected = `BROKERAGE_COLLECTED` (`entity_count`) |

Row-level date filtering applies `performance_month BETWEEN` the range resolved from the period filters (FY/quarter/month or from/to). User scoping: individual view filters by `userIds`; leadership view filters by the organisational hierarchy (organisationId, sbuId, verticalId, departmentId, branchId).

**Where each metric surfaces on the Dashboard (Phase 1):**
- **Business Performance Bar Chart** renders metrics 1 and 2 only (New Business, Retention) — metrics 3–6 are returned by the same API call but not charted here.
- **Business Collection Summary** Premium row renders metric 5.
- Metrics 3, 4, and 6 are consumed by the **Business Performance detail page** (`/business-performance`), reached via drilldown — they are part of this data contract even though the Dashboard itself does not render them.
- The **Target vs Actual (Total Overview + Quarterly)** widget is served by the separate quarterly endpoint; its target/achieved composition is expected to equal Total Business (metric 4) per quarter, but this equivalence is **unverified against backend code** — tracked in Open Question 9.

Full derivation detail: [business-performance-detailed-analysis.md](../Dashboard/business-performance-detailed-analysis.md).

### My Sales Funnel / My Renewal Funnel

**BR-DASH-050 — Stage sequences**
- **Sales funnel (SO):** SO → Data Validation → KDM Meeting → Broking Slip Generation → QCR Generation → Placement Slip.
- **Renewal funnel (RO):** RO → RSR Creation → Renewal KDM Meeting → Broking Slip Generation → QCR Generation → Placement Slip.
The top stage (SO / RO) is the total count of open opportunities of that type under the applied filters.

**BR-DASH-051 — The two percentages**
Each funnel shows two distinct conversion figures:
1. **Inside the funnel slice** — `count | %` where % = **overall conversion**: `round((stage count ÷ first-stage count) × 100)`. The first stage shows `--` for its percentage.
2. **In the left stage rail** — **stage-to-stage conversion**: `round((stage count ÷ previous-stage count) × 100)`.
A stage with count 0 shows 0%. If the reference stage (first or previous) has count 0, the percentage shows `--`. An info icon next to the funnel discloses that percentages are rounded.

**BR-DASH-052 — Funnel slice widths are not proportional**
Slice widths are visually normalized (scaled into a fixed min/max band, smoothed against the previous stage, with a fixed fallback width series when three or more stages tie). Widths exist for readability only — the printed counts are authoritative. QA must not compare slice geometry to counts.

**BR-DASH-053 — Per-stage Premium and Est. brokerage table**
The right-hand legend lists each stage with its color dot, **Premium**, and **Est. brokerage** (localized short format, Cr/L). A null premium renders "--" with Est. brokerage 0 (visible on renewal stages with no data). The top row (SO/RO) shows the totals across all open opportunities of that type.

**BR-DASH-054 — Conversion to Next Stage cards**
Below the funnel, one card per stage shows `Conversion to Next Stage = round((next-stage count ÷ this-stage count) × 100)`. Conversion > 50% renders the badge **"On Target"**; ≤ 50% renders **"Below Target"**. The final stage (no next) shows "—" and no badge.

**BR-DASH-055 — Funnel drilldown activity mapping**
Clicking a funnel stage navigates per AC-DASH-017, with this `activityName` mapping: the top stage (SO/RO) sends **no** activityName (all opportunities of the type); "Placement Slip" maps to **"Placement Slip Generation"**; every other stage passes its display name verbatim.

**BR-DASH-056 — Funnel error handling**
The funnel fetch appends `fromDashboard=true`. A gateway timeout (HTTP 504) shows a service-unavailable toast; other errors render the widget's no-data state ("No data available for the funnel graph.").

### My Follow Up

**BR-DASH-057 — Activity name aliasing on drilldown**
When drilling from a My Follow Up cell, the activity name "Planning" is sent to the destination listing as **"Data Validation"** — the listing filters by the aliased name. All other activity names pass verbatim, along with `state: ["Active"]`.

### Endorsement TAT by SBU — TAT formulas (verified against policy-service)

**BR-DASH-067 — TAT age formula and counted populations**
`TAT days = floor(end date − start date)` in whole calendar days, both dates normalized to UTC midnight; a negative difference counts as 0. Only **open** items are counted, so the end date is always **today**:

| Section | Counted population | Start date | End date |
|---|---|---|---|
| Endorsements | Endorsement entry date present **and** client confirmation date absent | `endorsementEntryDate` | `clientConfirmationDate`; null → today |
| Claims | Not deleted, claim date present, **and** no settlement exists | `claimDate` (fallback: record creation date) | earliest `settlementDate`; null → today |

An endorsement is "closed" for TAT purposes the moment its client confirmation date is set; a claim closes at its first settlement. Closed items never appear in any bucket.

**BR-DASH-068 — Bucket boundaries are mutually exclusive**
The four buckets partition the open items by TAT days. Despite the "<" labels, each bucket is an exclusive range — "< 7 Days" does **not** include items under 3 days:

| Bucket label | Actual range (TAT days) |
|---|---|
| < 3 Days | 0 – 2 |
| < 7 Days | 3 – 6 |
| < 14 Days | 7 – 13 |
| > 14 Days | 14 and above |

Each open item lands in exactly one bucket; the section's Total = sum of the four buckets. The same boundaries apply to endorsements and claims.

**BR-DASH-069 — Filter behavior on the TAT widget**
The period filter (from/to, or FY resolved to Apr 1 – Mar 31) applies to the **intake date** (endorsement entry date / claim date) — it narrows *which* items are counted, while the age is still always measured to today. Business month matches the endorsement's business month by month name (endorsements only). Insurer filters via the policy–insurer mapping. Owner scoping: `viewBy=team` resolves the owner's **full reporting subtree** (all levels, not just direct reports) plus the owner; `viewBy=manager` is the owner alone. A leadership user with no explicit owner gets the unfiltered org-wide view.

---

## Acceptance Criteria

### AC-DASH-001 — Dashboard header renders correctly
- **Given** a user navigates to `/dashboard`
- **When** the page loads
- **Then** the header shows the title "Welcome to Your Dashboard" and the subtitle "An overview of your business performance, tasks and team updates"
- **And** the header is displayed against the dark background banner

### AC-DASH-002 — Smart Search filter bar is present and shows all fields
- **Given** the user is on the Dashboard
- **When** the My Business Performance section is visible
- **Then** the Smart Search bar is rendered with the following fields: Organisation, SBU, Vertical, Department, Branch, Owner, View by, Income Type, Insurer, Financial Year, Quarter, Month, From Date, To Date, Business Month
- **And** the Run button and Reset button are visible

### AC-DASH-003 — Filter cascading disables child when parent is empty
- **Given** the user has not selected an Organisation
- **When** the SBU dropdown is rendered
- **Then** the SBU field is disabled
- **And** when an Organisation is selected, the SBU field becomes enabled and its options are fetched from the API scoped to that organisation

### AC-DASH-004 — Running filters updates all supported sub-widgets
- **Given** the user has selected filters and clicks Run
- **When** the run completes
- **Then** Target vs Actual, Business Performance Bar Chart, Sales Funnel, Renewal Funnel, Renewal Schedule by SBU, Business Collection Summary, Brokerage to Collect, Endorsement TAT by SBU, My Follow Up, and Policy Type Distribution all refresh their data using the applied filter query string
- **And** the floating filter icon is hidden if the filter bar is in view

### AC-DASH-005 — Business Month filter only updates supported widgets
- **Given** the user applies a Business Month filter and clicks Run
- **When** data loads
- **Then** Renewal Schedule by SBU, Endorsement TAT by SBU, Brokerage to Collect, and Policy Type Distribution update with the business month applied
- **And** Target vs Actual and Business Performance Bar Chart show a "not applicable" placeholder

### AC-DASH-006 — Insurer filter renders N/A on unsupported widgets
- **Given** the user applies an Insurer filter and clicks Run
- **When** data loads
- **Then** Target vs Actual and Business Performance Bar Chart show a "not applicable" placeholder
- **And** widgets that support insurer filtering update normally

### AC-DASH-007 — Date validation prevents one-sided range
- **Given** the user enters a From date but leaves the To date empty (or vice versa)
- **When** the user clicks Run
- **Then** the system shows an error toast "Please select from and to dates before running the search"
- **And** no API calls are fired

### AC-DASH-008 — Save View persists current filters as default
- **Given** the user has applied custom filters
- **When** the user clicks Save View
- **Then** the current filter values are stored as the user's personal Dashboard default
- **And** on the next Dashboard load, the stored filters are pre-applied and data is fetched automatically

### AC-DASH-009 — My Actionable shows time buckets with counts
- **Given** the user is on the Dashboard with the "All" tab active
- **When** the My Actionable widget loads
- **Then** three columns are shown: "Overdue & Today", "Next 7 Days", "Future"
- **And** each column header shows the count of items in that bucket
- **And** items are placed in the correct bucket based on their due/scheduled date

### AC-DASH-010 — Tab filtering isolates item type
- **Given** the user clicks the "Meetings" tab
- **When** the tab becomes active
- **Then** only meeting items are shown across the three time-bucket columns
- **And** the dot indicator and underline appear on the "Meetings" tab
- **And** the count in each column header reflects only meeting items

### AC-DASH-011 — My Actionable Manager toggle changes data scope
- **Given** the user toggles from "Manager" to "Manager + Team"
- **When** the widget re-fetches
- **Then** the items shown include both the current user's items and their team members' items
- **And** toggling back to "Manager" returns to the user's items only

### AC-DASH-012 — Clicking navigate icon on an item card opens detail
- **Given** an item card is visible in My Actionable
- **When** the user clicks the navigate icon on that card
- **Then** the user is navigated to the detail record for that item
- **And** a breadcrumb entry pointing back to the Dashboard is created

### AC-DASH-013 — Target vs Actual shows quarterly chart with correct totals
- **Given** the Dashboard loads with default or applied filters
- **When** the Target vs Actual widget renders
- **Then** a grouped bar chart shows Target and Actual bars for Q1, Q2, Q3, and Q4
- **And** the left panel shows Total Overview with Achievement %, Variance, and total bar
- **And** all amounts are formatted using the active localisation currency format

### AC-DASH-014 — Clicking a quarterly bar loads SBU breakdown
- **Given** the user clicks on the Q2 bar in the quarterly chart
- **When** the SBU breakdown loads
- **Then** the widget shows an SBU-level breakdown of performance for Q2
- **And** the quarter parameter `Q2` is appended to the SBU API query string

### AC-DASH-015 — Clicking total bar navigates to Business Performance detail
- **Given** the user clicks the total overview bar or the detail navigation control
- **When** the navigation fires
- **Then** the user is taken to `/business-performance`
- **And** the applied Dashboard filters are passed as the initial filter state for that page
- **And** a breadcrumb entry for the Dashboard is included

### AC-DASH-016 — Sales Funnel visible only with VIEW_OPPORTUNITY permission
- **Given** the logged-in user does not have the `VIEW_OPPORTUNITY` feature permission
- **When** the Dashboard renders
- **Then** the My Sales Funnel section shows an "Unauthorized" message instead of the funnel chart

### AC-DASH-017 — Funnel stage click navigates to opportunities with pre-applied filters
- **Given** the user clicks on a funnel stage in the Sales Funnel
- **When** the navigation fires
- **Then** the user is taken to `/opportunities`
- **And** the destination listing is pre-filtered with: the activity stage, the owner/viewBy from the Dashboard filters, and the financial year date range
- **And** filters not applicable to the opportunities listing (incomeType, businessMonth) are stripped

### AC-DASH-018 — Renewal Schedule table shows expiry buckets by SBU as clickable links
- **Given** the Dashboard loads
- **When** the Renewal Schedule by SBU table renders
- **Then** each SBU row shows counts under: Next 30 Days, Next 60 Days, Next 90 Days, Beyond 90 Days
- **And** every bucket cell in a data row (including zeros) renders as a blue underlined link
- **And** clicking a bucket cell navigates to `/renewal-opportunities` with the SBU and that bucket's exclusive date range (0–30 / 31–60 / 61–90 / 90+) pre-applied
- **And** the pinned Total row cells are plain text and not clickable

### AC-DASH-019 — TAT table shows endorsement and claims buckets as clickable links
- **Given** the Dashboard loads
- **When** the Endorsement TAT by SBU table renders
- **Then** each SBU row shows endorsement and claims counts per TAT bucket (bucket labels from the API; ranges bounded at 3, 7, 14, and over 14 days)
- **And** bucket cells in data rows render as blue underlined links; the pinned Total row is plain text
- **And** clicking an endorsement bucket navigates to `/manage-endorsements` with SBU and TAT range pre-applied
- **And** clicking a claims bucket navigates to `/manage-claims` with SBU and open-TAT flag or TAT range pre-applied

### AC-DASH-020 — Sticky filter icon appears when filter bar is scrolled out of view
- **Given** the user has scrolled past the Smart Search bar
- **When** the bottom edge of the Smart Search is above the scroll container's top edge
- **Then** a floating filter icon appears at the top of the page
- **And** clicking it opens an expanded inline version of the filter bar
- **And** clicking Run or collapsing the filter closes the inline panel and hides the floating icon

### AC-DASH-021 — Filter state is restored when user navigates back to Dashboard
- **Given** the user navigated to a detail page from the Dashboard (e.g. opportunities)
- **When** the user navigates back to the Dashboard (via breadcrumb or browser back)
- **Then** the Dashboard Smart Search fields are populated with the filters that were applied before leaving
- **And** all widgets re-fetch using those restored filters

### AC-DASH-022 — Policy Type Distribution shows View Portfolio button
- **Given** the Dashboard loads
- **When** the Policy Type Distribution widget renders
- **Then** a "View Portfolio" button is visible alongside the section header
- **And** clicking it navigates to `/my-client-portfolio` with the current Dashboard filters pre-applied (excluding incomeType and businessMonth)

### AC-DASH-023 — My Follow Up SO/RO toggle changes data
- **Given** the My Follow Up widget is visible
- **When** the user toggles from RO to SO
- **Then** the widget re-fetches follow-up activities for SO opportunities using the current filter query string
- **And** toggling back to RO restores the RO view

### AC-DASH-024 — Smart Search chip summary shows applied filters after Run
- **Given** the user has selected Organisation = "IIRM India" and View by = "Manager + Team" and clicked Run
- **When** the filter bar renders in collapsed mode
- **Then** the bar displays "Organisation: IIRM India · View by: Manager + Team" as labelled chips
- **And** if additional filters are set beyond the visible area, they appear as "+N more"
- **And** clicking the expand/filter icon re-opens the full filter panel with those values populated

### AC-DASH-025 — My Actionable empty state text per bucket
- **Given** the user has no tasks due in the next 7 days
- **When** the My Actionable widget loads with "Next 7 Days (0)" in the column header
- **Then** the "Next 7 Days" column body shows the text "No Tasks for next 7 days"
- **And** the "Future (0)" column body shows "No Tasks for future" when that column is also empty

### AC-DASH-026 — My Actionable item card renders all fields
- **Given** there is a KDM Meeting item in the "Overdue & Today" bucket
- **When** the card renders
- **Then** the card shows: (1) a phone/meeting icon in brand color; (2) the meeting title and date on one line in brand color (e.g. "KDM Meeting · 30 Jun"); (3) a company › category breadcrumb in secondary text; (4) an agenda/description line; (5) a navigate icon (↗) pinned to the top-right
- **And** clicking the navigate icon takes the user to that meeting's detail page

### AC-DASH-027 — Business Performance Bar Chart shows New Business and Retention
- **Given** the Dashboard loads with business performance data available
- **When** the Business Performance Bar Chart renders
- **Then** two horizontal bar rows are shown: "New Business" and "Retention"
- **And** each row has a gray Target bar and a blue Achieved bar
- **And** the section subtitle reads "Performance metrics with target vs achieved comparison"
- **And** clicking anywhere on the chart navigates to `/business-performance`

### AC-DASH-028 — Business Performance Bar Chart shows N/A when insurer or businessMonth applied
- **Given** the user applies an Insurer filter and clicks Run
- **When** the Business Performance Bar Chart renders
- **Then** all bar values display "--" and the chart is in a not-applicable state
- **And** clicking the chart does not trigger navigation

### AC-DASH-029 — Business Collection Summary shows 6 rows with only Premium populated
- **Given** the Dashboard loads
- **When** the Business Collection Summary table renders
- **Then** six rows are shown in order: Business booked, Premium, Business billed, Business unbilled, Invoiced, Not collected
- **And** only the "Premium" row has numeric values in Target, Achieved, and Percentage columns
- **And** Target and Achieved render in full Indian digit grouping (e.g. "1,03,72,16,079") and Percentage to two decimals (e.g. "2.87%")
- **And** all other rows show "--" in every column

### AC-DASH-030 — Brokerage to Collect renders with 4 columns and insurer rows
- **Given** the Dashboard loads with brokerage data
- **When** the Brokerage to Collect table renders
- **Then** columns shown are: Insurer Name, Current Month, Last Month, Prior to that, Total
- **And** each data row represents one insurer
- **And** a pinned Total summary row is visible at the bottom
- **And** the Total column cells are not clickable

### AC-DASH-031 — Brokerage to Collect cell click navigates to Biz Done Report with date range
- **Given** the user clicks the "Current Month" cell for an insurer row
- **When** the navigation fires
- **Then** the user is taken to `/business-performance` (Biz Done Report)
- **And** the from/to dates correspond to the first and last day of the current calendar month
- **And** the financial year filter from the Dashboard is preserved
- **And** a breadcrumb entry for the Dashboard is included

### AC-DASH-032 — My Follow Up renders columns: Activity Name + 5 time buckets + Total
- **Given** the Dashboard loads with follow-up data
- **When** the My Follow Up table renders
- **Then** columns shown are: Activity Name, Last Week, >1 Week, >2 Weeks, 30 Days, 45 Days, Total
- **And** a pinned summary row is visible at the bottom

### AC-DASH-033 — My Follow Up cell click (SO) navigates to opportunities
- **Given** the My Follow Up toggle is set to SO
- **When** the user clicks the ">2 Weeks" cell for the activity "Follow Up" 
- **Then** the user is taken to `/opportunities`
- **And** the filter includes `activityName: ["Follow Up"]` and the date range for ">2 Weeks"
- **And** `pendingActivities: true` is included in the navigation state

### AC-DASH-034 — My Follow Up ALL toggle disables cell drilldown
- **Given** the My Follow Up toggle is set to ALL
- **When** the user clicks a time-bucket cell
- **Then** no navigation fires
- **And** the cursor for those cells is default (not pointer)

### AC-DASH-035 — Policy Type Distribution renders pie slices for each policy type
- **Given** the Dashboard loads with policy distribution data containing Health (100 policies), Motor (80 policies), and Fire (20 policies)
- **When** the Policy Type Distribution widget renders
- **Then** three slices are shown, sized proportionally (Health largest, Fire smallest)
- **And** a legend on the right lists each policy type with its color dot
- **And** no slice is shown for types with zero policies

### AC-DASH-036 — Policy Type Distribution hover tooltip shows all fields
- **Given** a slice for "Health" is visible in the pie chart
- **When** the user hovers over that slice
- **Then** a tooltip card appears showing: policy type name, policy count, premium amount (formatted), brokerage amount (formatted), endorsement count
- **And** the tooltip disappears when the cursor leaves the slice

### AC-DASH-037 — Policy Type Distribution slice click with quarter filter passes date range
- **Given** the user has applied Quarter = Q1 and Financial Year = 2025 in the Dashboard filters
- **When** the user clicks the "Health" slice
- **Then** the user is taken to `/policies` with `iirmPolicyType = Health`, `from = 2025-04-01`, `to = 2025-06-30`

### AC-DASH-038 — Renewal Schedule by SBU shows 4 expiry buckets per SBU
- **Given** the Dashboard loads with renewal schedule data
- **When** the Renewal Schedule by SBU table renders
- **Then** columns shown are: SBU (pinned left), Next 30 Days, Next 60 Days, Next 90 Days, Beyond 90 Days — no Total column
- **And** a pinned Total row is shown at the bottom with column sums, not clickable
- **And** clicking any bucket cell in a data row (including zeros) navigates to `/renewal-opportunities` with that SBU and the bucket's exclusive expiry date range pre-applied
- **And** pagination controls are shown (page sizes 5/10/20)

### AC-DASH-039 — Endorsement TAT table shows endorsement and claims buckets per SBU
- **Given** the Dashboard loads with TAT data
- **When** the Endorsement TAT by SBU table renders
- **Then** TAT bucket columns appear for both endorsements and claims (same time ranges)
- **And** bucket cells in data rows render as blue underlined links (no color coding)
- **And** a pinned Total row is shown at the bottom, not clickable
- **And** clicking an endorsement bucket cell navigates to `/manage-endorsements` with SBU + TAT range pre-applied
- **And** clicking a claims bucket cell navigates to `/manage-claims` with SBU + open-TAT or TAT range pre-applied

---

## Data Contract

The Dashboard is a consumer of multiple backend services. It produces no persistent data of its own; it assembles read-only views from the following data sources and propagates filter context to destination pages on drilldown.

### Consumed APIs (read)

| Widget | Endpoint key | Key parameters |
|---|---|---|
| Target vs Actual (quarterly) | `businessPerformanceQuarterlyData` | queryString (org/SBU/period/owner) |
| Target vs Actual (SBU breakdown) | `businessPerformanceSbuData` | queryString + optional `quarter` |
| Business Performance Bar Chart | `businessPerformanceData` | queryString |
| Business Collection Summary | `businessPerformanceData` (index 4) | queryString |
| Sales Funnel | opportunities endpoint | queryString (without incomeType, businessMonth) |
| Renewal Funnel | renewal opportunities endpoint | queryString (without incomeType, businessMonth) |
| Renewal Schedule by SBU | `renewalScheduleBySbu` | queryString (without incomeType) |
| Endorsement TAT by SBU | `tatSummaryData` | businessMonthQueryString |
| Brokerage to Collect | brokerage endpoint | businessMonthQueryString |
| Policy Type Distribution | `policySummaryData` | businessMonthQueryString |
| My Actionable (ManageEngagements) | tasks/meetings/approvals endpoint | `viewBy`, `ownerId` |

### Filter query string construction rules

Two distinct query strings are maintained:
- `queryString` — built from all applied filters excluding `businessMonth`. Used by most widgets.
- `businessMonthQueryString` — built from filters excluding `incomeType`, then re-adding `businessMonth` if present. Used by the four business-month-aware widgets.
- `queryStringWithoutIncomeType` — `queryString` minus `incomeType`. Used by widgets that don't support income-type segmentation.

### Produced context (drilldown)

On drilldown navigation, the Dashboard passes a `filters` object in router state to the destination page. This object contains the applied filter values stripped of any parameters the destination service does not support. A breadcrumb entry for the Dashboard is always included in the `breadcrumbs` array so the user can return.

### Cross-module contracts

- **Opportunities listing** (`IIRM-797_Manage-Opportunities`): receives `filters` state on navigation from Sales Funnel and Renewal Funnel. Must accept `viewBy`, `ownerId`, `financialYear`, `activityName` and standard date range parameters.
- **Manage Endorsements**: receives `filters` state including `sbuId`, `tatRange`, and optionally `businessMonth` on drilldown from Endorsement TAT by SBU.
- **Manage Claims**: receives `filters` state including `sbuId`, `tatRange`, and optionally `openTatOnly` on drilldown from Endorsement TAT by SBU.
- **Renewal Opportunities**: receives `filters` state including `sbuId`, `from`, `to` (expiry date range) on drilldown from Renewal Schedule by SBU.
- **My Client Portfolio**: receives `filters` state (without `incomeType`, `businessMonth`) on navigation from the Policy Type Distribution "View Portfolio" button.
- **Business Performance detail** (`/business-performance`): receives full `filters` state on navigation from the quarterly performance total click.

---

## Open Questions

1. **Business Month filter label and UX** — The Business Month filter applies to only 4 of the ~10 widgets. The "not applicable" placeholder on other widgets may confuse users who don't understand why some widgets are showing `--`. Should there be inline tooltip or help text explaining the scoping? _Assigned to: Product/UX_

2. **My Actionable — drag-and-drop persistence** — Does dragging a task card between time-bucket columns persist the new due date to the backend, or is it a local UI re-arrangement only? The codebase has drag-and-drop infrastructure (react-beautiful-dnd) but the persistence contract is not confirmed. _Assigned to: TL/BE_

3. **My Actionable — completed item visibility** — The listing view has a `showCompleted` prop and a `completedLimit` per column (default 5). Is there a user-visible toggle to show/hide completed items on the Dashboard? If so, what is the default state? _Assigned to: Product_

4. **Permission for My Follow Up** — `dashboardWidgetVisibility.myFollowUp` gates this widget. ISG-only users do not see it. Is the exact role/permission mapping documented for all visibility flags? A complete permission matrix needs to be agreed before QA can test this. _Assigned to: TL/BE_

5. **Deferred right-column widgets** — The Endorsement TAT aggregate, Claims TAT aggregate, Policy Expiry Timeline, and Smart Actions widgets are coded but commented out. Is Phase 2 planned for these, or are they being abandoned? They should either be scheduled or deleted from the codebase to avoid confusion. _Assigned to: Product_

6. **Business Performance Bar Chart vs Target vs Actual** — Both widgets appear to display performance data. The bar chart uses `businessPerformanceData` and the quarterly breakdown uses `businessPerformanceQuarterlyData` (with a fallback to `businessPerformanceData`). What is the intentional visual distinction between these two widgets for the user? _Assigned to: Product/UX_

7. **My Team Celebrations & Announcements PRD reference** — These sections are live in the right column but excluded from this PRD. Once the separate PRD is published, insert the reference link here and ensure the permission model (`VIEW_DASHBOARD`) is documented consistently across both. _Assigned to: Nithin_

8. **Currency localisation** — Amounts throughout the Dashboard are formatted via `formatLargeCurrency` using `localizationData`. Is the localisation configuration (currency symbol, decimal precision, lakh/crore notation vs millions) finalised and consistent across all widgets? _Assigned to: TL/FE_

9. **Backend contract verification** — The filter dependencies, drilldown parameter mappings, and metric formulas in this PRD are documented from the UI layer (component/config code) and the DB-level analysis doc (`performance_output` / `business_target` entity types). Partially resolved: the TAT summary endpoint has been audited (BR-DASH-067 → 069) — `viewBy=team` is confirmed to resolve the **full reporting subtree** there, and FY resolves to Apr 1 – Mar 31 server-side. Still to verify on the remaining endpoints (business performance, quarterly, funnels, brokerage-to-collect): server-side defaults, unknown-param rejection behavior, whether the quarterly endpoint's target/achieved equals Total Business (metric 4), and whether brokerage-to-collect rows are FY-filtered. _Assigned to: TL/BE_

---

## Approval

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```
