# My RO Enhanced — Page PRD

**Module:** Enhanced Listing Pages · My RO Enhanced
**Product:** iWork — IIRM Insurance CRM
**Stage:** 40a · Product Requirements
**Mode:** Reverse-engineered from production code
**Last updated:** 2026-08-08
**Author:** Pushyami Divami

> Read [prd-00-overview.md](prd-00-overview.md) first. The shared scope widget, period popover, owner accordion, report gating, toolbar/drawer split and Save View behaviour are specified there and are **not** repeated here.

---

## 1. Why This Page Exists

My RO lists renewal opportunities — each one attached to an expiring policy, each with a hard date. Unlike a sales pipeline, a renewal book is fundamentally a **calendar**: the question is always "what expires in this window, and is anyone on it?"

That makes the period control the centre of this page rather than an afterthought, and it is why the RO listing keys its date filtering on **expiry date** rather than creation date. The scope widget then answers the second half — which branch and which owner carries the expiring book — with RO count and brokerage per node.

My RO Enhanced was the **first** of the four Enhanced pages, and the others were forked from it. Several shared behaviours (the employee-hierarchy card mapper, the hidden-SmartSearch pattern, the drawer-only Reset) originate here.

## 2. Scope

### In scope

- Org → SBU → Branch → Owner drill-down with RO count and brokerage per node
- Period popover driving `field=expiryDate` on the listing
- Companies-grain primary table; per-company RO records revealed on demand
- Company toolbar filter; RO and insurer filters in the drawer
- Bulk edit of RO records via row selection
- Save View isolated under `RENEWAL_OPPORTUNITY_ENHANCED`

### Out of scope

- Any change to the original My RO screen
- Export / download (not present on this page)

---

## 3. Route & Access

| Item | Value |
|---|---|
| Route | `/renewal-opportunities-enhanced` |
| Page title | "Manage Renewal Opportunities" |
| Sidebar | "My RO Enhanced", `permissionKey: viewOpportunity` |
| Breadcrumb key | `RENEWAL_OPPORTUNITY` |

| Capability | Permission |
|---|---|
| Create opportunity action | `CREATE_OPPORTUNITY` |
| Row selection / bulk edit | `BULK_EDIT_WRITE` |
| RO status option visibility | activity-role visibility (`canViewBD`, `canViewISG`) |

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
| `totalRos` | Total ROs | localized number |
| `brokerage` | Brokerage | compact currency |

**Aggregate:** `/opportunity/scope-summary`, `type=RO`.

This page defines `mapEmployeeHierarchyMaster`, the shared owner-card mapper used by every Enhanced page: the logged-in user is **always** shown (they head their own hierarchy even when they sit in another branch), plus active downline members belonging to the selected branch. Inactive or out-of-branch members are dropped as cards but their records still roll up into their in-branch manager's Manager + Team figures — history must not vanish with the person.

The mapper now reads the branch selection as a **list**: with Branch multi-select enabled the owner cards are the union of the selected branches' members, and an empty branch selection means no branch restriction at all. It behaves identically for a single branch, which is why the parked multi-select flag changes nothing today.

---

## 5. Screen Composition

### 5.1 KPI cards

Fed by a dedicated listing query carrying every committed filter **except** the selected company. Skeleton cards render while the first load is in flight.

| Card | Source field |
|---|---|
| Total Companies | `opportunityLeads` |
| Total ROs | `opportunityProspects` |
| Total Expected Premium Amount | `opportunityQcr` |
| Total Expected Brokerage Amount | `opportunityClients` |

Note the "Expected" wording — a renewal's premium and brokerage are forecasts until the policy is booked.

### 5.2 Primary table — Companies

| Column | Field |
|---|---|
| Company Name | `companyName` (clickable) |
| Total ROs | `totalRos` |
| Premium | `premium` |
| Brokerage | `brokerage` |
| Actions | View details |

Clicking Company Name opens the company; any other cell selects the row and reveals the records table below, scrolled into view.

**Sorting** (added 2026-08-06): the Companies table sorts server-side on every column except **Actions**, ordering the whole result set rather than the current page. On the records table, **Opportunity ID** is explicitly non-sortable.

### 5.3 Secondary table — `List of records - {company}`

Visible by default: Company name, Priority (chip), Policy type, **RO/Policy expiry** (status dot), Premium, Activity name, Assigned to, Branch, Policy Number, Opportunity ID.

Hidden by default: Estimated brokerage, Stage name, RO creation date, RO Status, Industry segment, Sum insured.

Clickable cells: Company name → company; Policy type / Activity name / Opportunity ID → the renewal opportunity.

Sorting, column reorder and bulk-edit row selection live on this table only.

---

## 6. Filters

**Toolbar:** Company name only (API-backed select). This page captures the pick directly from the select's own change handler as well as via form subscription, so the filter cannot be missed by subscription timing.

**Drawer** — titled "RO filters", 420px:

| Field | Label | Type |
|---|---|---|
| `verticalId` | Vertical | multiselect, options scoped to the applied SBU |
| `opportunityPriority` | Company priority | select |
| `opportunityContact` | Company contact | select by API |
| `opportunityPolicyType` | Policy type | select |
| `opportunityIndustrySegment` | Company industry | select |
| `activityName` | RO activity | multiselect |
| `state` | RO status | multiselect (role-filtered) |
| `isgManager` | ISG manager | tree select |
| — | **Insurer** section | title |
| `insurerId` | Insurer | select by API |
| `insurerBranchId` | Branch | select by API (depends on insurer) |
| `branchViewBy` | View by | segmented: Branch / Branch + sub-branches |

**Vertical** *(added 2026-08-06)* leads the drawer — the accordion's Vertical step is not rendered, so this is the page's only Vertical control. Same shared field config as the non-Enhanced listing (multiselect, `dependentField: sbuId`, name-bearing chips), backed by hidden `organisationId` / `sbuId` fields kept in sync with the applied scope so its lookup has something to read. See prd-00 §4.6.

**`branchViewBy` is no longer seeded** *(changed 2026-08-06)*. It is selected as "Branch" the moment an insurer branch is picked, and cleared when that branch — or the insurer above it — is removed. Seeding it in `defaultValues` showed a scope the query never applied: the resolver ignores `branchViewBy` when there is no `insurerBranchId`, so the control was advertising a filter that did nothing. The user can still switch to "Branch + sub-branches" once a branch is chosen.

**Default RO status is Active + Lost** *(added 2026-08-06)*, seeded only when the user's own saved values carry no `state`, so a saved view still wins.

---

## 7. Data Contract

All queries hit `/opportunity`, search field `companyName23`, default date field `expiryDate`.

| Query | Path params | Enabled when |
|---|---|---|
| Companies (primary) | `type=RO` + timeline + `companyGrain=true` | report applied |
| KPI | `type=RO` + timeline | report applied |
| Records | `type=RO` + timeline | report applied **and** a company is selected |

Timeline contributes `field=expiryDate&from=…&to=…`, or `financialYear=…` for a whole-FY selection.

Org hierarchy rides the structured `search` param; the root level is sent as `0` when unset, and **unselected non-root levels are omitted entirely** so they cannot overwrite a drawer field sharing their key — `verticalId` being exactly that case. Owner rides `ownerId` + `viewBy`. Selected company rides `companyId` on the records query only.

The applied owner reaches the **listing only**, never `/opportunity/scope-summary`, so the Organisation / SBU / Branch cards keep their hierarchy totals when an owner is picked.

Stripped before querying: `incomeType`, `orgScope`, `companySearch`, `ownerSearch`, `companyName`, `ownerId`, `ownerViewBy`; plus all empty values.

**Save View:** writes `RENEWAL_OPPORTUNITY_ENHANCED`; reads system defaults from `RENEWAL_OPPORTUNITY`, stripped of `orgScope`, `companySearch`, `ownerSearch`, `companyName`, `ownerId`, `ownerViewBy`.

---

## 8. Business Rules

- The report area is hidden until **View Report** is clicked, and hides again whenever the scope drifts from the applied one
- Period filters on **RO expiry date**, not creation date
- KPI cards reflect the whole applied scope, never the selected company
- An explicitly applied owner scopes the listing server-side even for leadership roles, so the table matches the selected card — but the scope cards above stay at hierarchy totals
- RO status defaults to Active + Lost unless the user's saved values already carry a status
- Insurer "View by" is set only once an insurer branch is selected, and cleared when it is removed
- Apply is blocked with a toast when exactly one of from/to is set, or when from is later than to
- Row selection is cleared whenever drawer filters are applied
- A 504 from the listing raises the standard unavailable-service toast
- Reset restores drawer fields to system defaults and preserves the toolbar company and accordion-owned owner

---

## 9. Acceptance Criteria

- Landing shows the scope widget with the user's org locked, and no table
- Nothing appears until **View Report** is clicked; editing the scope afterwards hides the report again
- The Owner accordion opens with no owner selected
- Scope cards show RO count and brokerage per node, unchanged by the owner selection
- Every Companies column except Actions is sortable; Opportunity ID on the records table is not
- KPI skeletons render during the first load rather than zeros
- The Companies table lists one row per company with RO count, premium and brokerage
- The records table title reads `List of records - {company name}`
- RO/Policy expiry shows a status dot reflecting proximity to expiry
- Period changes re-filter on expiry date and update cards, KPIs and both tables
- Selecting a whole financial year sends `financialYear`; narrower selections send from/to
- Applying with only one of from/to set shows a validation toast and does not query
- Insurer branch and its View-by appear only after an insurer is selected; View-by shows "Branch" only once a branch is picked, and clears when it is removed
- Vertical is the first drawer field, offers only the applied SBU's verticals, and produces name-bearing chips
- RO status is pre-filled with Active + Lost on a first-time load
- Company chosen in the toolbar applies immediately
- Drawer changes apply only on Apply; Apply closes the drawer
- Applied-filter chips reflect active drawer filters, including one chip per multi-select item
- Bulk edit is offered on the records table only, with `BULK_EDIT_WRITE`
- Save view restores scope, filters and column order
- The original My RO screen behaves exactly as before

---

## 10. Open Questions & Known Gaps

**Q-RO-01 — `premium` scope metric is commented out.**
The config carries a Premium metric that is disabled, so cards show only count and brokerage while the table shows premium. Intentional?

**Q-RO-02 — Owner default view-by is implicit.**
Unlike Biz Done and Client Portfolio, this config sets no `defaultViewBy`; the page falls back to `"team"` in its comparison logic. Should it be explicit to match the others?

**Q-RO-03 — Root scope level is sent as `0` when unset.**
`organisationId:[0]` reaches the backend as a real filter value. Harmless while the org is always preselected, but it is not a valid organisation id.

**Q-RO-04 — `contacts` column is commented out.**
Dead column definition retained in the config.

**Q-RO-05 — Manager + Team depth.** See Q-ENH-08 in the overview. This page's listing expands **direct reports only**, while its scope cards roll up the whole subtree, so a manager with indirect reports can see card and table disagree.

**Q-RO-06 — Scope-card / KPI reconciliation.** See Q-ENH-05. The scope cards and the KPI cards are produced by different queries; exact reconciliation is not currently guaranteed on this page.

---

## 11. Approval

| Role | Name | Date | Status |
|---|---|---|---|
| Product | | | Pending |
| Engineering | | | Pending |
| QA | | | Pending |
| Client | | | Pending |
