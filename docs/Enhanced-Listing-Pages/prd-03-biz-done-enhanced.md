# Biz Done Enhanced — Page PRD

**Module:** Enhanced Listing Pages · Biz Done Enhanced
**Product:** iWork — IIRM Insurance CRM
**Stage:** 40a · Product Requirements
**Mode:** Reverse-engineered from production code
**Last updated:** 2026-08-08
**Author:** Pushyami Divami

> Read [prd-00-overview.md](prd-00-overview.md) first. The shared scope widget, period popover, owner accordion, report gating, toolbar/drawer split and Save View behaviour are specified there and are **not** repeated here.

---

## 1. Why This Page Exists

Biz Done is the income report: business actually booked, with premium, brokerage, fees and rewards. It is the page finance and leadership use to answer "what did we earn, where, and has it been collected?"

Two things make it the most complex of the four Enhanced pages.

**It has two legitimate notions of time.** *Income month* is when the money was recognised; *business month* is when the deal was written. Reconciliation work needs both, and they do not agree. The Enhanced page keeps a **Filter by** toggle for exactly this reason: Income Month mode takes its period from the shared popover, while Business Month mode replaces it with a month multi-select plus an optional from/to override bounded by the selected months.

**Its money has more than one shape.** A single policy contributes premium, basic brokerage, terrorism brokerage, fees and — separately — rewards. So this page's scope cards carry six metrics rather than two, split by whether the brokerage came from a fresh sale or a renewal.

## 2. Scope

### In scope

- Org → SBU → Branch → Owner drill-down with policy count, total, SO/RO brokerage, fee and reward per node
- Income Month / Business Month period modes
- Companies-grain primary table; per-company policy records revealed on demand
- Insurer, insurer-branch and policy filters in the drawer; Vertical as the drawer's first field; Rewards as an income type
- **Asynchronous** Excel export with a per-sheet picker, a background job and a Downloads tray
- Save View isolated under `BIZ_DONE_REPORT_ENHANCED`
- Deep-link entry from the Business Performance dashboard (brokerage-to-collect and performance-type drill-throughs)

### Out of scope

- Any change to the original Biz Done Report screen
- A separate Rewards table or Rewards KPIs — rewards are unioned into the main listing by the API
- Bulk edit (not applicable to income rows)

---

## 3. Route & Access

| Item | Value |
|---|---|
| Route | `/biz-done-report-enhanced` |
| Page title | "Biz Done Report Enhanced" |
| Route guard | `VIEW_BUSINESS_PERFORMANCE_REPORT` |
| Sidebar | "Biz Done Enhanced", `permissionKeys: [canViewBizDoneReport]` |
| Breadcrumb key | `BIZ_DONE_REPORT` |

| Capability | Permission |
|---|---|
| Generate Report (export) | `DOWNLOAD_BUSINESS_PERFORMANCE_REPORT` |

---

## 4. Scope Configuration

| Level | Label | Query param | Notes |
|---|---|---|---|
| `organisation` | Organisation | `organisationId` | locked for every role |
| `unit` | SBU | `sbuId` | |
| fork: `vertical` | Vertical | `verticalId` | not rendered — served as a drawer filter, see §6 |
| fork: `branch` (default) | Branch | `branchId` | `multiSelect` implemented but commented out (2026-08-06) |
| `owner` (after Branch) | Owner | `userId` | no self-prefill; picked by hand |

**Card metrics** — rendered in tabular mode (labels once as a column header row, values aligned beneath):

| Key | Label | Meaning |
|---|---|---|
| `policyCount` | Policies | count |
| `total` | Total | SO + RO brokerage + fee + reward, computed server-side per node |
| `soBrokerage` | SO Brokerage | brokerage from fresh-sale policies |
| `roBrokerage` | RO Brokerage | brokerage from renewals |
| `feeAmount` | Fee | fees, which belong to neither bucket |
| `rewardAmount` | Reward | rewards, likewise |

**Aggregate:** `/policy/scope-summary`. `defaultViewBy` is explicitly `team`.

**The applied owner is not passed into the org aggregates** *(changed 2026-08-06)*. The first build fed the selected owner and view-by into `/policy/scope-summary` so cards and table would agree. In practice it re-scoped the Organisation, SBU and Branch cards *as that person*, collapsing every one of them to a single desk's numbers the moment View Report was clicked — destroying the comparison the user had just made to pick the branch. Those cards now always show hierarchy totals. The Owner level carries its own Manager/Team scoping through a separate aggregate channel, so the owner cards still tie out to the table.

---

## 5. Screen Composition

### 5.1 KPI cards

Computed from the **companies** query's `kpiDetails`, so they stay whole-report-scope and are unaffected by drilling into a company. Skeleton cards render while the first load is in flight.

| Card | Source field |
|---|---|
| Gross Premium | `grosspremium` |
| Brokerage Amount | `commissionamount` |
| Net Premium | `netpremium` |
| Brokerage to collect | `brokeragetobecollected` |

### 5.2 Primary table — Companies

> [!note]
> Column-rename/resequence (2026-08-09): the Companies table's "Net Premium" and "Brokerage Amount" headers are renamed to "Basic Premium" and "Basic Brokerage Amount". The **records table** on-screen (Section 5.3, reused verbatim from the original screen) still shows the original headers for now — its rename is pending. The Download Report workbook's renames/resequence are documented in the main BizDone PRD's "Revision — Column rename, resequence & cleanup (2026-08-09)" section.

| Column | Field | Notes |
|---|---|---|
| Customer Name | `customerName` | clickable |
| Basic Premium | `netPremium` | *renamed 2026-08-09 (was "Net Premium")* |
| Basic Brokerage Amount | `commissionAmount` | *renamed 2026-08-09 (was "Brokerage Amount")*; falls back across brokerage / commission / total / basic brokerage |
| Brokerage Collected | `brokerageCollected` | case-variant fallback |
| IIRM Organisation | `iirmOrganisation` | |
| SBU | `sbuName` | *added 2026-08-06* |
| Vertical | `verticalName` | *added 2026-08-06* |
| Actions | — | View details |

**All company columns are now sortable** *(changed 2026-08-06)* — the blanket `disableSort` was removed. Gross Premium and Premium Collected exist but are commented out.

**SBU and Vertical columns** were added because the companies query runs at a `company × org × sbu × vertical` grain: a company doing business across two SBUs produces two rows. Without those columns the rows read as duplicates of each other. This is a display fix for a grain that was always there, not a change in the numbers.

Clicking Customer Name opens the company; any other cell selects the row and reveals the policy records below, scrolled into view.

### 5.3 Secondary table — `List of records - {company}`

Forty columns, reused verbatim from the original Biz Done Report screen. Visible by default: IIRM Policy Number, Opportunity ID, SBU, Policy From/To dates, Business Month, Date Of Business, Customer Name, Broker Agent, Policy Name, Insurer Name, IIRM Organisation, IIRM Branch, Employee Name, Reward Category, Remarks, Premium Collected, Net Premium, Gross Premium, Brokerage Amount, Policy Status (chip).

Hidden by default (25 columns), including IIRM Reference Number, Insurer Policy/Endorsement Number, Income Type, Income Month, Date Of Income, Customer/Policy Category, Insurer Branch, Department, Status, Share Percentage, Terrorism, Service Tax, Brokerage Percentage, Brokerage Collected, Brokerage Amount as entered by ISG / as per iWork, Fees, Deal Confirmed, Policy Group, Terrorism Brokerage amount and percentage, Company Vertical.

Clickable cells: Customer Name → company; IIRM Policy Number → policy; Opportunity ID → opportunity.

---

## 6. Filters

**Toolbar:** Company name only.

**Drawer** — titled "Biz done report filters", 420px. Contents, in order:

| Field | Label | Type |
|---|---|---|
| `verticalId` | Vertical | multiselect, options scoped to the applied SBU |
| `departmentId` | Department | select |
| `incomeType` | Income Type | select — All / Policy / Endorsement / **Rewards** |
| `periodMode` | Filter by | segmented: Income Month / Business Month |
| `businessMonth` | Business month | multiselect *(Business Month mode only)* |
| `from` | From date (Applied on date of business) | date *(Business Month mode only)* |
| `to` | To date (Applied on date of business) | date *(Business Month mode only)* |
| — | **Insurer** | section title |
| `insurerId` | Insurer | select by API |
| `insurerBranchId` | Branch | select by API (depends on insurer) |
| `branchViewBy` | View by | segmented: Branch / Branch + sub-branches |
| — | **Policy** | section title |
| `groupCompanyId` | Group company | select by API |
| `policyType` | Policy type | select |
| `brokerId` | Broker agent | select by API |

Removed relative to the original screen: Organisation, SBU, Branch, Owner, View by, Financial Year, Quarter, Month, From, To — all now owned by the scope widget. `userId` stays registered on the hidden form (the accordion drives it) but is not rendered, so it cannot become a competing Owner control.

**Vertical came back to the drawer** *(2026-08-06)*. It was removed with the rest of the hierarchy on the assumption the accordion would carry it, but the accordion's Vertical step is not rendered — so the page had no Vertical control at all. It now leads the drawer, using the original screen's field config verbatim (multiselect, options scoped to `sbuId`, name-bearing chips), and sits immediately above Department, which depends on it. Consequently `verticalId` was dropped from the hidden org-sync fields: writing the accordion's (always empty) vertical into the form would only clobber the user's pick.

**Insurer "View by" is no longer seeded.** It is set to "Branch" when an insurer branch is selected and cleared when the branch — or the insurer above it — is removed, matching My RO Enhanced. The resolver ignores `branchViewBy` without an `insurerBranchId`, so a seeded value advertised a scope the query never applied.

**Rewards** is a filter value only: the API unions reward rows into the main listing, and the existing Reward Category column carries their category. There is no separate table or KPI treatment.

### 6.1 Period modes

**Income Month (default).** The scope widget's popover is the sole period source. No period fields appear in the drawer.

**Business Month.** The drawer gains a month multiselect plus a from/to override. Selecting "All" expands to all twelve months; deselecting it clears the selection. The derived range is computed from the selected months against the applied financial year and bounds the from/to pickers. Applying in this mode sends `filterByBusinessDate=true` and blocks with a toast if no month is selected.

---

## 7. Data Contract

Both listing queries hit `/policy/policy-report-list`, search field `companyName`.

| Query | Path params | Enabled when |
|---|---|---|
| Companies (primary) | `entityType=companySummary&allowAllInsurer=true` | report applied |
| Policy records | `entityType=policyDetails&allowAllInsurer=true` | report applied **and** a company is selected |

The org scope is written into hidden `organisationId` / `sbuId` / `branchId` form fields, so it rides `selectedValues` into the search string like any other filter. `sbuId` additionally feeds the drawer's Vertical lookup, which in turn feeds Department. `verticalId` is **not** written here — it belongs to the drawer now.

The selected company rides the policy query's `companyName` key as `{value: companyId}` → `searchBy=<id>`, overriding any toolbar company pick: the clicked card wins.

**Deep-link entry.** Navigation state may carry `fromBrokerageToCollect` (adds `insurerId` and disables the Insurer field) or `businessPerformanceType`, mapped to `ACTUAL`, `SO` (from `NEW_BIZ`) or `RO` (from `RENEWAL`).

**Save View:** writes `BIZ_DONE_REPORT_ENHANCED`; reads system defaults from `BIZ_DONE_REPORT`, stripped of `organisationId`, `sbuId`, `verticalId`, `branchId`, `userId` and `companyName`.

### 7.1 Export — asynchronous as of 2026-08-06

The synchronous download is gone. It held the request open for the entire generation, which meant a large report was a 504 waiting to happen and the user could not touch the page while it ran. The flow is now enqueue-and-collect: fire a job, keep working, pick the file up from a tray.

**The button.** "Download Report" is now **Generate Report**. While a job is in flight it reads "Preparing report…" and is disabled; clicking anyway raises "Report is being generated, please wait." A **Downloads** action appears alongside it once any export exists, badged with the number of finished-but-unseen files.

**The sheet picker.** Generate Report opens a modal — "Select sheets to download" — with six options, **Policy Details pre-selected**:

| Value | Label |
|---|---|
| `policyDetails` | Policy Details wise Bizdone |
| `companySummary` | Company Summary wise Bizdone |
| `policySummary` | Policy Summary wise Bizdone |
| `insurerSummary` | Insurer Summary wise Bizdone |
| `coInsurerDetails` | Co-Insurer Details wise Bizdone |
| `rewards` | Rewards wise Bizdone |

A select-all toggle covers the set. Continue is disabled with nothing ticked, and the selection resets to the default every time the modal opens. This is what closes Q-BD-01: the export is no longer locked to policy rows.

**The request.** `GET /policy/policy-report-excel/export?entityType=policyDetails&search=…&sheets=<csv>` — a GET rather than a POST so it passes the same export ACL the synchronous download used. It returns a `jobId`; the tray polls `/policy/policy-report-excel/export/status/{jobId}` and hydrates history from `/policy/policy-report-excel/exports`. `periodMode` and `businessMonth` are still excluded from the exported query; Business Month mode contributes its derived from/to and `filterByBusinessDate=true` instead.

**The Applied Filters sheet.** The request also carries an `appliedFilters` payload — Period, Filter by, Organisation, SBU, Vertical, Branch, Owner, View, Company, plus every drawer chip, assembled from the *same* builder the on-screen chip row uses. The server writes these verbatim with no id→name resolution, so the sheet reads exactly like the screen the user exported from. Org names come off the scope nodes; the id-only form fields cannot supply them.

**Toasts.** Enqueue → "Your report is being prepared. We'll notify you in Downloads when it's ready." Completion → "Your report is ready — open Downloads to get it." Failure at enqueue → "Could not start the export. Please try again."

---

## 8. Business Rules

- The report area is hidden until **View Report** is clicked, and hides again whenever the scope drifts — unlike the original screen, which queried on load
- KPI cards are computed from the companies query and never change when a company is expanded
- Income Month mode takes its period exclusively from the scope widget; Business Month mode overrides it with the derived month range
- Business Month mode requires at least one month; Apply is blocked with a toast otherwise
- Applying with only one of from/to set, or with from later than to, is blocked with a toast
- The export emits whichever sheets the user ticks; Policy Details is the default
- Only one export may be in flight at a time per user; a second attempt is refused with a toast
- The org-hierarchy scope cards always show hierarchy totals and are never re-scoped by the selected owner
- Reset clears only drawer fields and persists the cleared state to the user's saved view. It no longer persists the applied scope, nor `userId` / `owner`
- A restored Business Month view re-derives its from/to range and re-sends `filterByBusinessDate=true`, so a saved business-month scope reloads on the same window it was saved on

---

## 9. Acceptance Criteria

- Landing shows the scope widget with the user's org locked, and no table or KPI cards
- Scope cards render in tabular layout with metric labels appearing once as a header row
- Each card shows policy count, total, SO brokerage, RO brokerage, fee and reward
- Nothing appears until **View Report** is clicked; the Owner accordion opens with no owner selected
- Editing any card after a report is showing hides the report until View Report is clicked again
- Changing the Manager / Manager + Team toggle updates the owner cards and the table, and leaves the Organisation / SBU / Branch cards at their hierarchy totals
- The Companies table lists customer name, basic premium, basic brokerage amount, brokerage collected, IIRM organisation, SBU and Vertical (the "Basic Premium" / "Basic Brokerage Amount" headers were renamed 2026-08-09 to match the download workbook)
- Every Companies column is sortable
- A company spanning two SBUs shows one row per SBU, distinguishable by the SBU and Vertical columns
- Clicking Customer Name opens the company; clicking elsewhere opens the policy records below
- Expanding a company does not change the KPI cards
- IIRM Policy Number opens the policy; Opportunity ID opens the opportunity
- Switching Filter by to Business Month reveals the month multiselect and business-date from/to fields
- Selecting "All" months selects all twelve; clearing it empties the selection
- Applying in Business Month mode with no month selected shows a toast and does not query
- Business-date from/to pickers are bounded by the derived month range
- Income Type offers All, Policy, Endorsement and Rewards; Rewards rows appear in the main listing with their Reward Category
- Vertical is the first drawer field, offers only the applied SBU's verticals, and feeds Department
- Insurer branch and its View-by appear only after an insurer is chosen; View-by shows "Branch" only once a branch is picked, and clears when it is removed
- Arriving from the Business Performance dashboard pre-applies the corresponding insurer or performance-type filter
- Generate Report appears only with export permission and opens the sheet picker with Policy Details ticked
- Continue is disabled with no sheet ticked; the picker resets to Policy Details each time it opens
- Enqueueing an export returns immediately, leaves the page usable, and confirms with the "being prepared" toast
- The button reads "Preparing report…" and is disabled while a job runs; a second attempt raises the in-progress toast
- The Downloads action appears once any export exists and badges the count of finished, unseen files
- The generated workbook contains one sheet per ticked option plus an Applied Filters sheet matching the on-screen chips
- Save view restores scope, filters and column order
- The original Biz Done Report screen behaves exactly as before

---

## 10. Open Questions & Known Gaps

**Q-BD-01 — Export grain does not match the visible table.** *(Resolved 2026-08-06)*
The sheet picker lets the user choose any of six grains, including Company Summary. `entityType=policyDetails` remains the query's own grain; the `sheets` parameter decides what the workbook contains. See §7.1.

**Q-BD-06 — Export jobs have no visible expiry or retention rule.** *(New)*
The Downloads tray hydrates history from the server, but nothing in the UI states how long a generated file stays available or how many are kept. A user who exports weekly will accumulate rows with no stated lifecycle.

**Q-BD-07 — One in-flight export per user is a hard limit.** *(New)*
Reasonable as a load guard, but a user who wants Policy Details *and* Insurer Summary as separate workbooks must wait for the first to finish. Should concurrent jobs be allowed, or is the multi-sheet picker considered the answer?

**Q-BD-08 — The Applied Filters sheet is written verbatim from the client.** *(New)*
The server does no id→name resolution, so the sheet is exactly as trustworthy as the labels the page happened to have loaded. A filter applied from a deep link, before its option list resolves, could export as an id.

**Q-BD-02 — `brokeragetobecollected` is undeclared.**
The KPI reads a response field that is absent from the declared response interface, so a rename would silently produce a blank card.

**Q-BD-03 — `vertical` column is declared twice** in the records column config, with the same field. One is dead.

**Q-BD-04 — `activePolicies` KPI is commented out.** Deferred or abandoned?

**Q-BD-05 — Two `businessMonthField` builders exist** with different types (multiselect here, plain select in the business-performance config). Easy to import the wrong one.

---

## 11. Approval

| Role | Name | Date | Status |
|---|---|---|---|
| Product | | | Pending |
| Engineering | | | Pending |
| QA | | | Pending |
| Client | | | Pending |
