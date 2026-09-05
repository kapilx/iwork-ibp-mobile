# Manage SO Enhanced — Page PRD

**Module:** Enhanced Listing Pages · Manage SO Enhanced
**Product:** iWork — IIRM Insurance CRM
**Stage:** 40a · Product Requirements
**Mode:** Reverse-engineered from production code
**Last updated:** 2026-08-08
**Author:** Pushyami Divami

> Read [prd-00-overview.md](prd-00-overview.md) first. The shared scope widget, period popover, owner accordion, report gating, toolbar/drawer split and Save View behaviour are specified there and are **not** repeated here. This document covers only what is specific to Manage SO Enhanced.

---

## 1. Why This Page Exists

Manage SO lists sales opportunities — new-business pursuits with no policy behind them yet. The original screen presented a flat filter panel in which Organisation, SBU, Branch and Owner sat as ordinary dropdowns beside SO status, activity and industry.

For a BD leader the question is almost always hierarchical: *which branch is carrying the pipeline, and who inside it?* The Enhanced page reshapes the screen around that question. The scope widget shows SO count and brokerage per node, so the user drills toward volume; the table then opens **companies first**, because a sales pipeline is read per client, not per record.

## 2. Scope

### In scope

- Org → SBU → Branch → Owner drill-down with SO count and brokerage per node
- Companies-grain primary table; per-company SO records revealed on demand
- Company toolbar filter; SO-specific filters in the drawer
- Create SO call to action
- Bulk edit of SO records via row selection
- Save View isolated under `SALES_OPPORTUNITY_ENHANCED`

### Out of scope

- Any change to the original Manage SO screen
- Export / download (not present on this page)
- Insurer filters (RO Enhanced has them; SO does not)

---

## 3. Route & Access

| Item | Value |
|---|---|
| Route | `/opportunities-enhanced` |
| Page title | "Manage SO Enhanced" |
| Route guard | `VIEW_OPPORTUNITY` **and** `VIEW_BD_ACTIVITY` (nested guards) |
| Sidebar | "Manage SO Enhanced", under Admin Module, `permissionKey: viewBDActivity` |
| Breadcrumb key | `SALES_OPPORTUNITY` |

Additional permissions used in-page:

| Capability | Permission |
|---|---|
| Create SO button | `CREATE_OPPORTUNITY` |
| Row selection / bulk edit | `BULK_EDIT_WRITE` |
| SO status option visibility | activity-role visibility (`canViewBD`, `canViewISG`) |

---

## 4. Scope Configuration

| Level | Label | Query param | Notes |
|---|---|---|---|
| `organisation` | Organisation | `organisationId` | locked for every role |
| `unit` | SBU | `sbuId` | |
| fork: `vertical` | Vertical | `verticalId` | not rendered — served as a drawer filter, see §6 |
| fork: `branch` (default) | Branch | `branchId` | `multiSelect` implemented but commented out (2026-08-06) |
| `owner` (after Branch) | Owner | `userId` | no self-prefill; picked by hand |

**Card metrics**

| Key | Label | Format |
|---|---|---|
| `totalRos` | Total SOs | localized number |
| `brokerage` | Brokerage | compact currency |

**Aggregate:** `/opportunity/scope-summary`, `type=SO`.
Owner cards use the shared employee-hierarchy mapper (viewer + active downline in the selected branch).

---

## 5. Screen Composition

### 5.1 KPI cards

Fed by a dedicated listing query that receives every committed filter **except** the selected company — so expanding a company never moves the KPIs.

| Card | Source field |
|---|---|
| Total Companies | `opportunityLeads` |
| Total SOs | `opportunityProspects` |
| Total Premium Amount | `opportunityQcr` |
| Total Brokerage Amount | `opportunityClients` |

### 5.2 Primary table — Companies

| Column | Field |
|---|---|
| Company Name | `companyName` (clickable) |
| Total SOs | `totalRos` |
| Premium | `premium` |
| Brokerage | `brokerage` |
| Actions | View details |

Row behaviour: clicking **Company Name** navigates to the company detail page; clicking any other cell (or View details) selects the row in place and reveals the records table below, scrolled into view.

**Sorting** (added 2026-08-06): the Companies table sorts server-side on every column except **Actions**. Sorting is applied to the companies query, so it orders the whole result set rather than the current page.

### 5.3 Secondary table — `List of records - {company}`

Visible by default: Company name, Priority (chip), Policy type, SO expiry date (status dot), Activity name, Premium, Estimated brokerage, Assigned to, Branch, Opportunity ID.

Hidden by default (toggleable): Stage name, SO creation date, SO Status, Industry segment, Sum insured.

Clickable cells: Company name → company; Policy type / Activity name / Opportunity ID → the opportunity.

This table carries sorting, column reorder, and row selection for bulk edit. The companies table carries none of those.

---

## 6. Filters

**Toolbar:** Company name only (API-backed select, applies on selection).

**Drawer** — titled "SO filters", 420px:

| Field | Label | Type |
|---|---|---|
| `verticalId` | Vertical | multiselect, options scoped to the applied SBU |
| `opportunityPriority` | Company priority | select |
| `opportunityContact` | Company contact | select by API |
| `opportunityPolicyType` | Policy type | select |
| `opportunityIndustrySegment` | Company industry | select |
| `activityName` | SO activity | multiselect |
| `state` | SO status | multiselect (role-filtered) |
| `isgManager` | ISG manager | tree select |

No Owner field and no period fields — both belong to the scope widget.

**Vertical** *(added 2026-08-06)* leads the drawer. The accordion's Vertical step is not rendered, so this is the page's only Vertical control. It reuses the non-Enhanced listing's shared field config verbatim — multiselect, `dependentField: sbuId`, `storeSelectedOption` so chips read names. Because its options hang off `sbuId` and this page has no visible SBU control, two hidden fields (`organisationId`, `sbuId`) are registered on the form and kept in sync with the applied scope. They render nothing.

One consequence worth knowing when reading the code: the form reset that runs when a scope is applied must carry those hidden ids explicitly. They are written with `setValue`, which never marks the form dirty, so a reset seeded from `defaultValues` alone would blank them and leave the Vertical lookup with nothing to query.

**Default SO status is Active + Lost** *(added 2026-08-06)*. It seeds only when the user's own saved values carry no `state` selection, so a saved view still wins. This mirrors the legacy listing's default.

**SO status options are role-filtered:** BD Planning / Renewal Planning are hidden without BD visibility; ISG Planning / Won are hidden without ISG visibility.

---

## 7. Data Contract

All three queries hit `/opportunity`, search field `companyName23`, default date field `expiryDate`.

| Query | Path params | Enabled when |
|---|---|---|
| Companies (primary) | timeline + `companyGrain=true` | report applied |
| KPI | timeline | report applied |
| Records | timeline | report applied **and** a company is selected |

Org hierarchy rides the structured `search` param (`organisationId`, `sbuId`, `verticalId`, `branchId`), not the path. Owner rides `ownerId` + `viewBy`. The selected company is injected into the records query only. Toolbar company rides `companyName23`.

`verticalId` in that search string now comes from the **drawer**, not the accordion. The accordion contributes only the levels it has actually selected — unselected non-root levels are omitted rather than sent as `undefined`, which would otherwise wipe the drawer's Vertical value during the merge.

The applied owner is sent to the **listing only**. It is deliberately not passed to `/opportunity/scope-summary`, so the Organisation / SBU / Branch cards keep showing hierarchy totals rather than collapsing to the selected person's numbers.

Stripped before querying: `incomeType`, `orgScope`, `companyName`, `ownerId`; plus all empty values.

**Save View:** writes `SALES_OPPORTUNITY_ENHANCED`; reads system defaults from `SALES_OPPORTUNITY`, stripped of `orgScope` and `ownerId`.

---

## 8. Business Rules

- The report area (KPIs, both tables, toolbar and drawer) is hidden until **View Report** is clicked, and hides again whenever the scope drifts from the applied one
- KPI cards always reflect the whole applied scope, never the selected company
- Selecting an owner scopes the listing but leaves the scope-card metrics at hierarchy totals
- SO status defaults to Active + Lost unless the user's saved values already carry a status
- The records table appears only for a selected company and is scoped to it exactly
- Create SO is visible only with `CREATE_OPPORTUNITY`
- Row selection is available only with `BULK_EDIT_WRITE`, and is cleared whenever drawer filters are applied
- A 504 from the listing raises the standard unavailable-service toast
- Reset restores drawer fields to system defaults and preserves the toolbar company and the accordion-owned owner

---

## 9. Acceptance Criteria

- Landing on the page shows the scope widget with the user's org locked, and no table
- Drilling to any depth reveals nothing until **View Report** is clicked; editing the scope afterwards hides the report again
- The Owner accordion opens with no owner selected
- Each scope card shows SO count and brokerage for that node, unchanged by the owner selection
- Every Companies column except Actions is sortable, and sorting reorders the full result set
- The Companies table lists one row per company in scope with SO count, premium and brokerage
- Clicking Company Name opens the company; clicking elsewhere on the row opens the records table below and scrolls to it
- The records table title reads `List of records - {company name}`
- Expanding a company does not change the KPI cards
- Opportunity ID, Policy type and Activity name in the records table open the opportunity
- Company chosen in the toolbar filters immediately without opening the drawer
- Vertical is the first drawer field, offers only the applied SBU's verticals, and produces name-bearing chips
- SO status is pre-filled with Active + Lost on a first-time load
- Drawer changes take effect only on Apply; Apply closes the drawer
- Applied-filter chips appear for each active drawer filter; removing one re-queries
- SO status options exclude BD/ISG-only statuses for users without those roles
- Create SO appears only with permission and opens the create flow
- Bulk edit is offered only on the records table and only with `BULK_EDIT_WRITE`
- Save view restores scope, filters and column order on next load
- The original Manage SO screen behaves exactly as before

---

## 10. Open Questions & Known Gaps

**Q-SO-01 — The listing does not send `type=SO`.** *(High)*
My RO Enhanced seeds its path with `type=RO`; Manage SO Enhanced seeds an empty list and never adds `type=SO`. Unless the endpoint defaults to SO, this page's companies, KPIs and records may include renewal opportunities. **This needs verification against a live response before sign-off** — if confirmed, every number on the page is overstated.

**Q-SO-02 — `OpportunitiesEnhancedPage/index.tsx` is dead code.**
A wrapper component exists but nothing imports it; the route renders the listing directly. Delete or adopt.

**Q-SO-03 — `SO_ENHANCED_TOOLBAR_FIELD_NAMES` comment is stale.**
It states that Owner remains a plain toolbar field with the view-by toggle in the drawer. Neither is true — Owner was removed in favour of the accordion.

**Q-SO-10 — Active + Lost as a default is a product decision made in code.** *(New, 2026-08-06)*
The default was introduced to mirror the legacy listing, but it means the page opens pre-filtered in a way the empty-looking drawer does not advertise on first read. Confirm it is intended, and that "Lost" belongs in a default working view.

**Q-SO-04 — No KPI skeleton.**
RO Enhanced shows skeleton cards while KPIs load; this page renders KPI cards unconditionally, so they flash zeros on first load.

**Q-SO-05 — No from/to validation.**
RO Enhanced blocks Apply when only one of from/to is set. This page does not.

**Q-SO-06 — `contacts` column is commented out but its click handler remains.**
Dead navigation branch for a hidden column.

**Q-SO-07 — Create SO passes `originPath: "/opportunities"`.**
The create flow will return the user to the *original* screen, not the Enhanced one.

**Q-SO-08 — `opportunityCompanySummary` endpoint is referenced but unused.**
A tableConfig comment names `/opportunity/company-summary`, but the companies grid actually uses `/opportunity?...companyGrain=true`. Misleading for maintainers.

**Q-SO-09 — Metric key naming.** See Q-ENH-03 in the overview: SO counts are read from a field named `totalRos`.

---

## 11. Approval

| Role | Name | Date | Status |
|---|---|---|---|
| Product | | | Pending |
| Engineering | | | Pending |
| QA | | | Pending |
| Client | | | Pending |
