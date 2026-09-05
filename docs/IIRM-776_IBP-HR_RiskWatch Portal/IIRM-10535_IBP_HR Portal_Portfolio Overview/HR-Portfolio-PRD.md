# HR Portal — Portfolio View: Product Requirements

**Module:** HR-PORTAL · **Feature:** Portfolio Overview
**Product:** India Insure Risk Management (IIRM) — Integrated Benefits Portal (IBP)
**Mode:** Reverse-engineered from production code at `apps/ui/ibp/src/app/pages/HRPortalPortfolio/index.tsx`
**Audience:** Product owners, QA leads, and client stakeholders signing off on the Portfolio feature

This document defines what the Portfolio view does, for whom, and what "done" means for each behaviour. It does not describe how any of it is built — that is the TRD's job.

---

## Scope

### In scope

The Portfolio view is the landing screen inside the HR Portal (`/hr-portal/portfolio`). It gives authorised users a bird's-eye view of every client company and its insurance policies.

| Area | Included |
|---|---|
| KPI summary header (sticky) | Companies, Active Policies, Active Premium, Policies Expiring ≤ 60 days |
| Company list — Group mode | Accordion showing parent + subsidiary companies |
| Company list — Standalone mode | Single-company card for HR Admins without group structure |
| Company list — CRM mode | Multiple group accordions + individual company cards |
| Policy drill-down | Expandable policy table per company (inline, not a separate page) |
| Company-level search | Client-side search by company name |
| Location filter | Passed in from the parent shell; Portfolio respects it |
| Navigation to Dashboard | "View Dashboard" from company and policy rows |
| Role-based data scoping | HR_ADMIN sees own company/group; PORTAL_CRM sees all managed companies |

### Out of scope (deferred)

- Policy creation or editing from Portfolio
- Export / download of Portfolio data
- Sorting or filtering the policy table columns
- Pagination of policy rows (all active policies are shown)
- Direct claims or endorsement actions from this screen

---

## User Stories

The three roles that access Portfolio are **HR Admin** (`HR_ADMIN`), **CRM Agent** (`PORTAL_CRM`), and implicitly the **HR-only / employee-hybrid** user — all of whom share the HR_ADMIN path.

### KPI Summary

**US-HRP-001**
As an HR Admin, I want to see a sticky summary bar at the top of Portfolio so that I always know my company's policy health at a glance, even while scrolling the company list.

*Traces to: UC-portfolio-summary / FR-display-kpi*

**US-HRP-002**
As a CRM Agent, I want the KPI bar to reflect all companies I manage (not just one), so that I get an aggregate view of my entire book of business.

*Traces to: UC-portfolio-summary / FR-role-scoped-kpi*

### Company List — Group Mode

**US-HRP-003**
As an HR Admin whose company belongs to a corporate group, I want to see all group companies in a collapsible accordion so that I can navigate from the parent company down to subsidiaries without leaving the Portfolio screen.

*Traces to: UC-portfolio-group / FR-group-accordion*

**US-HRP-004**
As an HR Admin, I want the parent company ("Group Co.") to appear at the top of the accordion with a visible badge, so that I can clearly distinguish the holding entity from subsidiaries.

*Traces to: UC-portfolio-group / FR-parent-badge*

**US-HRP-005**
As an HR Admin, I want to collapse all expanded company rows in one click, so that I can reset the view quickly when I'm done reviewing policies.

*Traces to: UC-portfolio-group / FR-collapse-all*

### Company List — Standalone Mode

**US-HRP-006**
As an HR Admin whose company is not part of a group, I want to see a single company card, so that the Portfolio view is still useful and consistent with the group experience.

*Traces to: UC-portfolio-standalone / FR-individual-card*

### Company List — CRM Mode

**US-HRP-007**
As a CRM Agent, I want to see all groups I manage as separate accordions, and all non-group companies as individual cards below them, so that I can navigate my full portfolio without additional filtering.

*Traces to: UC-portfolio-crm / FR-crm-multi-group*

### Policy Drill-down

**US-HRP-008**
As an HR Admin or CRM Agent, I want to expand any company row to see its active policy table inline, so that I can review policy details without navigating away from Portfolio.

*Traces to: UC-portfolio-policies / FR-policy-table*

**US-HRP-009**
As an HR Admin or CRM Agent, I want policies expiring within 60 days to appear at the top of the table and be visually flagged with a countdown, so that renewal actions are never missed.

*Traces to: UC-portfolio-policies / FR-expiry-highlighting*

**US-HRP-010**
As an HR Admin or CRM Agent, I want to navigate directly from a policy row to the HR Dashboard pre-filtered to that policy, so that I can view detailed analytics in one click.

*Traces to: UC-portfolio-policies / FR-policy-to-dashboard*

**US-HRP-011**
As an HR Admin or CRM Agent, I want companies that have no active policies (all expired) to be visually de-emphasised and show an "All policies expired" indicator, so that I don't investigate them unnecessarily.

*Traces to: UC-portfolio-policies / FR-all-expired-state*

### Search

**US-HRP-012**
As an HR Admin or CRM Agent, I want to search for a company by name within the Portfolio list, so that I can find a specific subsidiary or client company quickly without scrolling.

*Traces to: UC-portfolio-search / FR-company-search*

### Location Filter

**US-HRP-013**
As an HR Admin, I want the Portfolio view to respect the location filter set in the portal header, so that I see only the companies and policies relevant to a specific office or region.

*Traces to: UC-portfolio-filter / FR-location-filter*

### Navigation to Dashboard

**US-HRP-014**
As an HR Admin or CRM Agent, I want every company card to have a "View Dashboard" button that takes me to the HR Dashboard scoped to that company, so that I can move from portfolio overview to deep analytics fluidly.

*Traces to: UC-portfolio-nav / FR-company-to-dashboard*

---

## Business Rules

### Role scoping

**BR-HRP-001 — HR_ADMIN scope**
An HR Admin sees only the company (or group) their account is associated with. The portfolio is filtered using the domain `companyId`, not the `companyId` on the user's employee record — these can differ when an HR Admin switches companies via the iWork portal.

**BR-HRP-002 — PORTAL_CRM scope**
A CRM Agent sees all companies they manage. The data is fetched using their `crmUserId`. The `companyId` and `hrCompanyId` parameters are explicitly cleared in CRM requests to prevent single-company scoping.

**BR-HRP-003 — Hybrid user**
A user who is both an employee and an HR Admin (or CRM agent) accesses Portfolio through the HR portal path with their HR role. No special Portfolio behaviour applies.

### Active vs. expired policy definition

**BR-HRP-004 — Active policy**
A policy is "active" if its `endDate` is on or after today's date (midnight-normalised, local time). Expired policies are excluded from Active Policies counts and Active Premium totals.

**BR-HRP-005 — Expiring soon**
A policy is "expiring soon" if it is currently active and its `endDate` falls within the next 60 calendar days (inclusive of today). The countdown is the ceiling of `(endDate - now) / 86400s`.

**BR-HRP-006 — Expired policy visibility**
Expired policies are not shown in the inline policy table. A company with no active policies shows an "All policies expired" state; its row is visually de-emphasised (reduced opacity, muted colors, no action buttons).

### Policy sorting

**BR-HRP-007 — Expiry-first sort**
Within each company's expanded policy table, expiring-soon policies appear before all others. Among expiring-soon policies, the one with the fewest days left appears first. Policies not expiring soon are shown in the order returned by the API.

### Currency display

**BR-HRP-008 — INR abbreviation**
Premium amounts are displayed as abbreviated INR:
- ≥ ₹1 Cr (10,000,000): `₹X.XXCr`
- ≥ ₹1 L (100,000): `₹X.XXL`
- Otherwise: `₹X,XX,XXX` (Indian locale format)

A zero premium is shown as `—`.

### Group structure

**BR-HRP-009 — Parent company position**
In a group accordion, the parent company (Group Co.) always appears first, before subsidiaries. It carries a blue "GROUP CO." badge.

**BR-HRP-010 — Group logo**
The group header uses a colour-coded initials avatar derived deterministically from the parent company's ID. The same group always gets the same colour across sessions.

**BR-HRP-011 — Group stats**
The group header shows aggregate statistics (Companies, Active Policies, Active Premium) derived from the policy cache, not from the KPI API. These display as `—` until all member companies' policies have loaded.

### Location filter

The Policy Location dropdown lives in the HR Portal shell header, not in the Portfolio component. Portfolio is a consumer — it receives the resolved `locationIds` string as a prop and does not own or render the dropdown itself. All rules below describe the dropdown's behaviour as it affects Portfolio.

**BR-HRP-012 — Filter scope**
The `locationIds` parameter is passed to every Portfolio API call (KPI summary, group companies, individual companies, and per-company policies). Changing the applied location filter invalidates the full policy cache and refetches all data from scratch.

**BR-HRP-013 — Empty string = All Locations**
When no location is selected, `locationIds` is an empty string `""`. The backend treats an empty value as "no filter" — i.e. return data across all locations. The dropdown trigger button shows "All Locations" in this state.

**BR-HRP-014 — Selection model: radio + checkboxes**
The dropdown has two distinct selection layers:
- **All Locations** — radio button at the top (sticky, outside scroll). Selecting it clears all named and "No Location" selections. It is the default state.
- **Named Locations** — one checkbox per location code (fetched dynamically). Multiple named locations may be selected simultaneously.
- **No Location** — a separate checkbox in an "Other" section below named locations. Selects employees or policies whose `policy_config_location_id` is `NULL` in the database.

These are mutually structured: "All Locations" and the checkboxes cannot be simultaneously active — choosing "All Locations" clears checkboxes; ticking any checkbox deselects "All Locations".

**BR-HRP-015 — Sentinel value for No Location**
"No Location" is transmitted to the backend as the integer `0` appended to the `locationIds` list. For example, if locations 5 and 12 are selected with "No Location" included, the effective string is `"5,12,0"`.

**BR-HRP-016 — Staged commit (pending → Apply)**
Selections inside the dropdown are staged in a pending state. They do not propagate to Portfolio APIs until the user clicks the **Apply** button at the bottom of the dropdown. Closing the dropdown without applying discards pending changes. Opening the dropdown re-initialises the pending state from the currently applied selection.

**BR-HRP-017 — Location options fetched per company**
Location options are loaded from the `external_hr_company_locations` report scoped to the currently viewed company (the company whose Dashboard is active, or the domain company on Portfolio). Each option carries an employee count. Options reload whenever the active company changes (e.g. navigating from Portfolio to a specific company's Dashboard).

**BR-HRP-018 — Stale selection pruning**
When location options reload (due to company change), any selected location IDs that no longer appear in the fresh options list are silently removed from both the applied and pending selections. This prevents sending IDs that are invalid for the current company.

**BR-HRP-019 — Location search within dropdown**
The dropdown includes a search field that filters the named location list client-side by `location_code` (case-insensitive, partial match). The search does not affect the "All Locations" radio or the "No Location" checkbox — those are always visible. The search resets when the dropdown closes.

**BR-HRP-020 — Count badges**
Each named location option displays a count badge showing the **employee count** for that location (`employee_count` from the `external_hr_company_locations` API). For example, `Chennai(45)` means 45 employees are assigned to Chennai. The "No Location" option displays `no_location_employee_count` — the count of employees with no location assigned. The badge turns blue when the option is in a pending-selected state. The "All Locations" option shows the static label "All policies" instead of a count.

**BR-HRP-021 — Trigger button label format**
The count shown in brackets in the trigger label is the **employee count** for that location. The dropdown trigger shows:
- `All Locations` — when nothing is selected.
- `LocationCode(employeeCount)` — when exactly one named location is selected and "No Location" is not.
- `LocationCode(employeeCount) | LocationCode(employeeCount)` — for multiple named locations (pipe-separated).
- `None (noLocationEmployeeCount)` — when only "No Location" is selected.
- `LocationCode(employeeCount) | None(noLocationEmployeeCount)` — when named locations and "No Location" are both selected.

**BR-HRP-022 — Location state preserved across navigation**
When the user navigates from Portfolio to a company's Dashboard (via "View Dashboard"), the current `locationIds` is passed as React Router state. If the user navigates back, the location filter is restored to the same selection, provided those location IDs still exist in the reloaded options. Invalid IDs are pruned per BR-HRP-018.

**BR-HRP-023 — Portfolio does not trigger location options reload**
On the Portfolio route, the location options are not refetched. The options already loaded (from the last Dashboard visit or initial login) remain in place. A refetch happens only when a company-scoped page (Dashboard, home) loads.

### Search behaviour

**BR-HRP-024 — Client-side search**
Company search is performed client-side against the already-loaded company list. Search is committed on Enter keypress or Search button click. A clear (×) button resets the search term. The search filters company names within the group body; the group header itself also matches the search.

### Loading and error states

**BR-HRP-025 — Skeleton states**
While KPI data is loading, four shimmer skeleton cards are shown in place of the KPI bar. While company list data is loading, four skeleton rows are shown in place of the company list.

**BR-HRP-026 — Per-company policy loading**
Policy data for each company is fetched on-demand when the company row is expanded. All companies visible on load are pre-fetched in the background so expansion is instant. A spinner is shown inside the expanded row while its policies are loading.

**BR-HRP-027 — Retry on error**
Both KPI and portfolio list errors display an inline error banner with a "Retry" link. Clicking Retry re-issues only the failed request.

**BR-HRP-028 — Empty state**
If a CRM Agent has no managed companies at all, an "No companies found" empty state is shown with a building icon.

---

## Acceptance Criteria

### KPI bar

**AC-HRP-001** — Given the user opens Portfolio and KPI data is loading, When the page renders, Then four shimmer skeleton cards appear in place of the KPI values.

**AC-HRP-002** — Given KPI data has loaded, When the user views the header, Then they see: Companies count, Active Policies count, Active Premium (formatted INR), and Policies Expiring In 60 Days count — all accurate to the scoped data.

**AC-HRP-003** — Given the user scrolls down the company list, When they scroll past the fold, Then the KPI bar remains pinned to the top of the viewport.

**AC-HRP-004** — Given KPI data fails to load, When the error occurs, Then an inline error banner appears with a Retry link; clicking Retry re-fetches the KPI data.

**AC-HRP-005** — Given the user is a PORTAL_CRM agent, When Portfolio loads, Then the Companies count reflects the total across all managed groups and individual companies (not scoped to a single companyId).

### Company list — Group mode

**AC-HRP-006** — Given the logged-in user is an HR_ADMIN whose company is part of a group, When Portfolio loads, Then a single GroupCard accordion is shown containing the parent company and all subsidiaries.

**AC-HRP-007** — Given a GroupCard is rendered, When the user views it, Then the parent company appears first with a "GROUP CO." blue badge; subsidiaries appear below a divider.

**AC-HRP-008** — Given a GroupCard is expanded, When the user clicks "Hide Companies", Then the entire company list within the group collapses.

**AC-HRP-009** — Given multiple company rows are expanded within a group, When the user clicks "Collapse All", Then all expanded company rows collapse simultaneously.

**AC-HRP-010** — Given policies for all group members have loaded, When the user views the GroupCard header, Then it shows the correct aggregate: total member companies, total active policies across all members, and total active premium across all members.

### Company list — Standalone mode

**AC-HRP-011** — Given the logged-in user is an HR_ADMIN whose company is not part of a group, When Portfolio loads, Then a single IndividualCompanyCard is shown for their company.

### Company list — CRM mode

**AC-HRP-012** — Given the logged-in user is a PORTAL_CRM agent who manages multiple groups and individual companies, When Portfolio loads, Then all managed groups appear as separate GroupCard accordions, followed by non-group companies as IndividualCompanyCards.

**AC-HRP-013** — Given a PORTAL_CRM user manages no companies, When Portfolio loads, Then an empty state is shown with "No companies found".

### Policy drill-down

**AC-HRP-014** — Given a company row is visible and has active policies, When the user clicks "View Policies" or clicks anywhere on the company row, Then the row expands to show the inline policy table.

**AC-HRP-015** — Given a company row is expanded, When the user views the policy table, Then expiring-soon policies appear first (sorted ascending by days remaining), followed by non-expiring policies.

**AC-HRP-016** — Given a policy expires within 60 days, When it appears in the policy table, Then its row has a yellow background, a yellow left border, and the status badge reads "Expiring Soon (Xd)" where X is the days remaining.

**AC-HRP-017** — Given a policy's end date is in the past, When it is evaluated, Then it does not appear in the inline policy table (expired policies are filtered out).

**AC-HRP-018** — Given a company has no active policies, When the user expands its row, Then the policy panel shows "No active policies found — All policies for this company have expired."

**AC-HRP-019** — Given a company has no policies at all, When the user expands its row, Then the policy panel shows "No policies found — No policies linked to this company."

**AC-HRP-020** — Given an active policy row is rendered, When the user clicks "View Dashboard" on that row, Then they are navigated to `/hr-portal/dashboard` with the company's `companyId`, `companyName`, `locationIds`, and the policy's `policyId` pre-applied.

**AC-HRP-021** — Given a company has all expired policies, When the user views its card, Then the card is rendered at reduced opacity, action buttons are replaced by an "All policies expired" indicator (red), and the company card is not expandable.

### Policy table columns

**AC-HRP-022** — Given the policy table is visible, When the user views the column headers, Then they are: POLICY NO. | POLICY TYPE | INSURER | TPA | PREMIUM | POLICY PERIOD | STATUS | (action column).

**AC-HRP-023** — Given a policy premium is zero or null, When it is displayed in the table, Then the Premium column shows `—`.

**AC-HRP-024** — Given a policy row's text overflows its column, When the user hovers over the cell, Then a tooltip shows the full text.

### Search

**AC-HRP-025** — Given the user types a company name in the search box and presses Enter (or clicks Search), When the input is committed, Then only companies whose names contain the search term (case-insensitive) are shown in the list.

**AC-HRP-026** — Given there is text in the search box, When the user clicks the × button, Then the search term is cleared and the full company list is restored.

**AC-HRP-027** — Given a search term matches no companies within a group, When the filter is applied, Then the group body shows "No companies match your search." (the group card header remains visible).

### Location filter

**AC-HRP-028** — Given the user changes the location filter in the portal header, When the new `locationIds` value propagates to Portfolio, Then the policy cache is cleared, all API calls re-issue with the new `locationIds`, and the company list and KPI bar refresh.

**AC-HRP-030** — Given the user opens the Policy Location dropdown, When no selection has been made previously, Then "All Locations" is pre-selected (radio) and all named location checkboxes are unchecked.

**AC-HRP-031** — Given the user opens the Policy Location dropdown, When they tick one or more named location checkboxes, Then clicking Apply commits the selection — the trigger button updates to show `LocationCode(count) | …` and all Portfolio API calls re-issue with the selected IDs.

**AC-HRP-032** — Given the user has named locations checked, When they click "All Locations" (radio), Then all named location and "No Location" checkboxes are cleared, and the pending state reverts to "All Locations".

**AC-HRP-033** — Given the user opens the dropdown, makes changes, and then closes it without clicking Apply, When they reopen the dropdown, Then the pending state reflects the last *applied* selection, not the abandoned one.

**AC-HRP-034** — Given the user ticks "No Location" in the dropdown and clicks Apply, When Portfolio API calls are made, Then `0` is included in the `locationIds` string sent to the backend.

**AC-HRP-035** — Given multiple named locations and "No Location" are all selected, When the user views the trigger button label, Then it shows `LocationCode(count) | … | None(count)` (pipe-separated, No Location at the end).

**AC-HRP-036** — Given the dropdown is open, When the user types in the search field, Then only named locations whose `location_code` contains the search term (case-insensitive) are shown; "All Locations" and "No Location" remain visible.

**AC-HRP-037** — Given the dropdown is open with a search term active, When the user closes the dropdown, Then the search field is cleared and the full list is shown on the next open.

**AC-HRP-038** — Given the active company changes (Portfolio → Dashboard navigation), When location options reload, Then any previously selected location IDs that are not present in the new options are silently removed from both applied and pending selections.

**AC-HRP-039** — Given the user navigates from Portfolio to a company's Dashboard via "View Dashboard", When they navigate back to Portfolio, Then the location filter is restored to the same selection that was active at the time of navigation (subject to stale-ID pruning per AC-HRP-038).

### Navigation to Dashboard

**AC-HRP-029** — Given a company card has active policies, When the user clicks "View Dashboard" on the company card (not a policy row), Then they are navigated to `/hr-portal/dashboard` with the company's `companyId`, `companyName`, and `locationIds` — but no `policyId`.

---

## Data Contract

The Portfolio view is a consumer of four report APIs. It does not own or mutate any of this data.

### Consumed APIs

| Report Key | Verb | Purpose | Role param |
|---|---|---|---|
| `portfolio_kpi_summary` | POST | Aggregate KPI totals for the header | `hrCompanyId` or `crmUserId` |
| `portfolio_group_companies` | POST | Companies belonging to the logged-in user's group | `hrCompanyId` or `crmUserId` |
| `portfolio_individual_companies` | POST | Standalone (non-group) companies | `hrCompanyId` or `crmUserId` |
| `portfolio_company_policies` | POST | All policies for a specific company | `companyId` (the target company, not the user's company) |

All calls go through `POST /hr-module/generate/:reportKey?page=1&limit=0` via the `useHRReport` hook or direct `apiRequest`.

### KPI response shape (consumed)

```
KpiRow {
  totalCompanies:    number
  totalPolicies:     number
  activePolicies:    number
  inactivePolicies:  number
  totalLives:        number
  totalPremium:      number
}
```

### Company response shape (consumed)

```
{
  companyId:         number
  companyName:       string
  groupId?:          number          // present only in portfolio_group_companies
  groupName?:        string
  industry?:         string
  city?:             string
  state?:            string
  rmName?:           string
  policyCount?:      number
  activePolicyCount?: number
  inactivePolicyCount?: number
  lhPolicyCount?:    number
}
```

### Policy response shape (consumed)

```
PolicyApiRow {
  policyId:      number
  companyId:     number
  policyTypeCode: string            // e.g. "POLICY_TYPE_GMC"
  policyTypeName: string
  insurerName:   string | null
  tpaName:       string | null
  policyNumber:  string | null
  premiumAmount: number | string | null
  startDate:     string | null      // DD/MM/YYYY from SQL TO_CHAR
  endDate:       string | null      // DD/MM/YYYY
  policyStatus:  'Active' | 'Renewal Due' | 'Expired'
}
```

### Produced navigation state (cross-module contract)

When the user clicks "View Dashboard", Portfolio pushes the following state to React Router. The HR Dashboard (`/hr-portal/dashboard`) is the downstream consumer.

```
{
  companyId:    number
  companyName:  string
  locationIds:  string        // may be empty string
  policyId?:    number        // only present when navigating from a policy row
}
```

> **Contract note for TRD:** The `endDate` field arrives as `DD/MM/YYYY` (SQL `TO_CHAR` format). The frontend parser also handles ISO 8601 as a fallback. Any change to the date format in the report SQL must be coordinated with this parsing logic.

---

## Open Questions

The following items were unresolvable from code inspection alone and must be resolved before or during Stage 40b (TRD):

**OQ-HRP-001 — Policy table shows only active policies; where do expired policies live?**
The policy table intentionally hides expired policies. Is there a planned "All Policies" toggle or separate view where expired policies can be reviewed? Currently there is no such UI.

**OQ-HRP-002 — KPI vs. cache discrepancy**
The KPI bar is sourced from `portfolio_kpi_summary` (an API call), while the group header stats are derived from the client-side policy cache. These can transiently disagree (e.g., during a location filter change). Is this acceptable, or should the group header stats also come from the KPI API?

**OQ-HRP-003 — `totalLives` and `totalPolicies` KPI fields are fetched but not displayed**
The API returns `totalLives` and `totalPolicies` but the UI currently only shows `activePolicies`. Is there a planned addition of "Total Lives" and "Total Policies" KPI cards, or should these fields be dropped?

**OQ-HRP-004 — Active/Inactive policy filter buttons are commented out**
The `PolicySplitStatCard` contains commented-out "Active" / "Inactive" filter toggle buttons. Is this feature deferred, or permanently removed? If deferred, what is the target state?

**OQ-HRP-005 — Policy table scrollability**
The policy table has `minWidth: 1300px` and scrolls horizontally inside the expanded card. On viewports narrower than ~1300px this creates a scroll within a scroll UX. Is a responsive column layout planned?

**OQ-HRP-006 — CRM user with no group companies but individual companies**
If a CRM agent manages only individual companies (no groups), the `crmGroups` array is empty and only `IndividualCompanyCard`s render. Is this a supported scenario? There is no specific "No groups" messaging; it falls through to the individual cards silently.

**OQ-HRP-007 — `rmName` field**
The company data includes an `rmName` (Relationship Manager name) field that is fetched but not rendered anywhere in the current Portfolio UI. Is this intentional (future use), or was it removed mid-implementation?

**OQ-HRP-008 — Location count badges: query gap**
The frontend expects `employee_count` and `no_location_employee_count` fields from the `external_hr_company_locations` API. However, the SQL registered for this report in all migration scripts only selects `id` and `addr_1` — there is no `employee_count` column in the query. The frontend fallback (`?? 0`) means all location badges would show `0` unless the production database has a manually applied query update not captured in source control. Two questions need resolution:
1. Has the production query been updated outside these scripts? If yes, the scripts must be updated to match.
2. Is the count intended to be **active employees only** or **all employees (active + inactive)** for that location?

---

## Approval

Leave blank. Client sign-off required from two parties before this document is locked.

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```
