# My Client Portfolio Enhanced — Page PRD

**Module:** Enhanced Listing Pages · My Client Portfolio Enhanced
**Product:** iWork — IIRM Insurance CRM
**Stage:** 40a · Product Requirements
**Mode:** Reverse-engineered from production code
**Last updated:** 2026-08-08
**Author:** Pushyami Divami

> Read [prd-00-overview.md](prd-00-overview.md) first. The shared scope widget, period popover, owner accordion, report gating, toolbar/drawer split and Save View behaviour are specified there and are **not** repeated here.

---

## 1. Why This Page Exists

My Client Portfolio answers a different question from the other three pages. Manage SO, My RO and Biz Done are all **record** reports — pipeline, renewals, income. This page is a **client** report: *who are my clients, and what do we hold for each of them?*

That difference drives its shape. A company is "my client" if it has at least one active, unexpired policy **or** at least one active renewal opportunity. Sales opportunities are shown as a column but never make a company visible, because a prospect is not yet a client. Each client row then carries the whole relationship — policy premium, RO premium, SO premium, brokerage split into fiscal quarters, claims and service score — and expanding one reveals four detail tables rather than one.

This was the fourth Enhanced page and the last to be built. It is also the only one whose scope cards were given a **purpose-built aggregate** so that the card figures and the KPI figures come from the same engine and reconcile.

## 2. Scope

### In scope

- Org → SBU → Branch → Owner drill-down with policy count, premium and brokerage per node
- Clients listing with policy / RO / SO premium and counts, RO brokerage bifurcated Q1–Q4, claim amount, priority and service score
- Past Companies view (expired policies)
- Per-company drill-down: policies, renewal opportunities, sales opportunities, service score detail
- Company toolbar filter; company and policy filters in the drawer
- Save View isolated under `CLIENT_PORTFOLIO_ENHANCED`

### Out of scope

- Any change to the original My Client Portfolio screen
- SO as a visibility driver — SO-only companies are not listed
- Insurer-branch and business-month filters (the shared endpoint does not forward them; see §10)
- Export / download

---

## 3. Route & Access

| Item | Value |
|---|---|
| Route | `/my-client-portfolio-enhanced` |
| Page title | "My client portfolio enhanced" |
| Sidebar | "My Client Portfolio Enhanced", `permissionKey: viewOpportunity` — the same gate as the original screen |
| Breadcrumb key | `CLIENT_PORTFOLIO` |

---

## 4. Scope Configuration

| Level | Label | Query param | Notes |
|---|---|---|---|
| `organisation` | Organisation | `organisationId` | locked for every role |
| `unit` | SBU | `sbuId` | |
| fork: `vertical` | Vertical | `verticalId` | not rendered — served as a drawer filter, see §6 |
| fork: `branch` (default) | Branch | `branchId` | `multiSelect` implemented but commented out (2026-08-06) |
| `owner` (after Branch) | Owner | `userId` | no self-prefill; picked by hand |

**Card metrics** — tabular layout:

| Key | Label |
|---|---|
| `policyCount` | Policies |
| `premium` | Premium |
| `brokerage` | Brokerage |

**Aggregate:** `/policy/portfolio/scope-summary` — a **portfolio-specific** endpoint, not the income engine the Biz Done cards use. It applies the same "active book" definition as this page's listing: active status, not expired, enabled-for-performance, premium at inception and basic brokerage, over the same financial-year window. This is deliberate so the cards reconcile with the KPI cards rather than being merely indicative.

`defaultViewBy` is explicitly `team`.

---

## 5. Screen Composition

### 5.1 KPI cards

Read from the listing response's own `kpiData`, so a single query feeds both the table and the cards. Skeleton cards render during the first load.

| Card | Source field |
|---|---|
| Total companies | `totalCompanyCount` |
| Total policies | `totalPolicyCount` |
| Total premium | `totalCompaniesPremium` |
| Total brokerage | `totalCompaniesBrokerage` |

### 5.2 Primary table — Companies overview

| Column | Field | Default |
|---|---|---|
| Company name | `companyName` | visible, pinned left |
| Policy premium (#count) | `policyPremium` + `policyCount` | **hidden**, pinned left |
| RO premium (#count) | `roPremium` + `roCount` | visible |
| SO premium (#count) | `soPremium` + `soCount` | **hidden** |
| Brokerage (RO) | `roBrokerage` | visible |
| Q1 / Q2 / Q3 / Q4 | `roBrokerageQ1..Q4` | visible |
| Priority | `priority` | visible (chip) |
| Claim amount | `claimAmount` | **hidden** |
| Service score | `serviceScoreSummary.totalServiceScore` | visible, shown as % |
| Actions | — | View details |

Premium columns render as `premium (#count)` in a single cell. Q1–Q4 bifurcate the RO brokerage by the renewal's expiry date on an April-start financial year, and must sum to the Brokerage (RO) total.

A **Past companies** / **Show active companies** toggle sits in the table's secondary action slot. It switches the whole listing to companies whose policies have expired, resets to page 1, and closes any open drill-down.

### 5.3 Drill-down

Selecting a row reveals, scrolled into view:

1. **Company policies** — filtered to the same criteria, honouring the Past companies mode
2. **Renewal opportunities** — active ROs only *(hidden in Past companies mode)*
3. **Sales opportunities** — active SOs only *(hidden in Past companies mode)*
4. **Service score** detail

These four sections are reused unchanged from the original screen; they are prop-driven and are not duplicated for this page.

---

## 6. Filters

**Toolbar:** Company name only, reusing the standard policy company select. The value rides the search string as a company id, and changing it closes any open drill-down.

**Drawer** — titled "Client portfolio filters", 420px:

| Field | Label | Type |
|---|---|---|
| `verticalId` | Vertical | multiselect, options scoped to the applied SBU |
| — | **Company** | section title |
| `policyCompanyType` | Company type | select |
| `policyCompanyPriority` | Company priority | select |
| `serviceScore` | Service score | select — >90% / >80% / >70% / <70% |
| — | **Policy** | section title |
| `policyType` | Policy type | select |
| `iirmPolicyType` | IIRM policy type | select |
| `industry` | Industry | select |
| `renewalPeriod` | Renewal period | select |
| `policyExpiryFromDate` | Policy expiry from | date |
| `policyExpiryToDate` | Policy expiry to | date |
| `isgManager` | ISG manager | tree select |
| — | **Insurer** | section title |
| `insurerId` | Insurer | select by API |

Removed relative to the original screen: the Organisation/SBU/Branch/Owner dropdowns and the "Period (Policy from)" range — all now owned by the scope widget. Deliberately **not** offered: insurer branch, branch view-by and business month, because the endpoint accepts them on its request contract but never forwards them, so they would be dead controls.

**Vertical leads the drawer** *(added 2026-08-06)*. The accordion's Vertical step is not rendered, so removing it with the rest of the hierarchy left the page with no Vertical control at all. It now uses the non-Enhanced listing's field config verbatim — multiselect, options scoped to `sbuId`, name-bearing chips — backed by hidden `organisationId` / `sbuId` fields synced from the applied scope. Those two are registered on the shared form purely to feed the lookup and are filtered out of the rendered drawer.

`serviceScore` is not a search key — it is extracted and sent as its own query parameter.

---

## 7. Data Contract

One query, `/policy/portfolio/companies`, feeding both the table and the KPI cards. Search field is a dummy so the Company select can ride the structured search string; the default date field is `policyFrom`, matching the original screen's "Period (Policy from)" semantics.

| Channel | Params |
|---|---|
| Path | `recursiveTeam=true`, plus `pastCompanies=true` and `serviceScore=<threshold>` when active |
| Search string | `organisationId`, `sbuId`, `verticalId`, `branchId`, company id, and every drawer filter |
| Hoisted query params | `ownerId`, `viewBy`, `insurerId`, `from`/`to`, `financialYear` |

**Client visibility rule:** a company appears when it has ≥1 active, unexpired policy **or** ≥1 active renewal opportunity. SO never confers visibility.

**`recursiveTeam` — the one page-specific backend flag.** This page shares its endpoint with the original My Client Portfolio. Manager + Team on the shared listing historically meant *direct reports only*, while the Owner cards enumerate the whole reporting subtree — so a senior leader who personally owns nothing saw an empty card with their organisation's entire book one level below. `recursiveTeam=true` expands the listing's owner scope to the whole subtree so the two agree. It is **opt-in per request**: the original screen never sends it and therefore keeps its existing behaviour unchanged. Every hop defaults to false, so an omitted flag can only ever produce the legacy path.

**Save View:** writes `CLIENT_PORTFOLIO_ENHANCED`; reads system defaults from `CLIENT_PORTFOLIO`, stripped of `orgScope`, `organisationId`, `sbuId`, `verticalId`, `branchId`, `departmentId`, `ownerId`, `viewBy` and `companyName`.

---

## 8. Business Rules

- The report area is hidden until **View Report** is clicked, and hides again whenever the scope drifts from the applied one
- No level and no owner is ever auto-selected
- A company is a client if it has an active unexpired policy **or** an active RO; SO-only companies are excluded
- RO premium includes the referenced policy's inception premium plus its endorsement premium
- Brokerage is **basic** brokerage throughout, never total, to stay consistent with the policy tables
- RO brokerage is read from the renewal's *referenced* policy, not the opportunity's estimated brokerage, which is a forecast rather than booked value
- Q1–Q4 bifurcate RO brokerage by the renewal's expiry date on an April-start financial year and must sum to the RO brokerage total
- Policy premium, SO premium and Claim amount are hidden by default but remain toggleable
- Past companies mode lists companies with expired policies only, and hides the RO and SO drill-down sections
- Service score is applied as its own threshold parameter, not as a search filter
- Changing the toolbar company, applying drawer filters, or toggling Past companies all close any open drill-down
- Owner scope on this page means the whole reporting subtree, matching the Owner cards
- Reset clears only drawer fields, persists the cleared state to the saved view, and preserves the applied scope in navigation state. **Clear all** runs the same path but confirms with "Filters updated successfully"

---

## 9. Acceptance Criteria

- Landing shows the scope widget with the user's org locked, and no table or KPI cards
- Scope cards show policy count, premium and brokerage per node
- Nothing appears until **View Report** is clicked; the Owner accordion opens with no owner selected
- Editing any card after a report is showing hides the report until View Report is clicked again
- **Owner card figures match the KPI cards for the same scope** — this page's cards and listing use the same engine and must reconcile
- Vertical is the first drawer field, offers only the applied SBU's verticals, and produces name-bearing chips
- A leadership or super user selecting their own owner card sees populated figures, not zeros
- Companies with only an active RO appear; companies with only an SO do not
- Premium columns render as `premium (#count)`
- Q1+Q2+Q3+Q4 equals Brokerage (RO) on every row
- Policy premium, SO premium and Claim amount are hidden on first load and can be re-enabled from table settings
- Service score renders as a percentage
- Past companies lists only companies with expired policies, and the RO and SO drill-down sections are hidden in that mode
- Selecting a row reveals policies, renewal opportunities, sales opportunities and service score, scrolled into view
- RO and SO drill-down lists show active opportunities only, so they agree with the RO and SO counts in the row
- Company name in the table opens the company detail page
- Company chosen in the toolbar applies immediately and closes any open drill-down
- Drawer changes apply only on Apply; Apply closes the drawer
- Applied-filter chips reflect active drawer filters; Clear all behaves as Reset
- Save view restores scope, filters and column order
- **The original My Client Portfolio screen returns identical numbers to before** — it shares this endpoint and must be regression-checked explicitly

---

## 10. Open Questions & Known Gaps

**Q-CP-01 — `insurerBranchId`, `branchViewBy` and `businessMonth` are accepted but never forwarded.**
The endpoint's request contract declares them; the handler does not pass them on. They are omitted from the drawer for that reason. Should the endpoint forward them so an insurer-branch filter becomes possible?

**Q-CP-02 — The RO leg ignores org, SBU, vertical and branch scope.** *(High — affects the ORIGINAL screen too)*
The renewal/sales opportunity passes receive only the owner scope; the four hierarchy keys are dropped. Because the client count is the union of policy-companies and RO-companies, **drilling into a branch does not narrow the company count** — RO-only companies from every other branch remain in scope. Observed live: 5,306 companies against 88 policies.

**This is not Enhanced-specific.** The filter sits in unconditional shared code inside `aggregateActiveCompaniesByPolicies`, which both this page and the original My Client Portfolio reach through the same endpoint. The original screen also exposes Organisation/SBU/Vertical/Branch dropdowns, so it has the same defect and always has — it predates the Enhanced work.

**It is intermittent, which makes it worse.** The ref-policy pass *does* apply the full hierarchy filter to renewals, but only runs when `hasPolicyAttributeFilters` is true — i.e. when an insurer, a free-text search, or any non-scope search key is present. So:

| User filters by | RO leg scoped? |
|---|---|
| Only org / SBU / branch / owner | **No** — full leak |
| Plus any policy attribute | Yes — masked by the ref-policy pass |

The unmasked case is the default page state, since `status` and `serviceScore` are stripped before the query on both screens. A fix must therefore be scoped as a shared-endpoint change affecting both screens, not as an Enhanced-only opt-in.

**Q-CP-03 — `totalCompanyCount` and `totalPolicyCount` count different populations.**
Company count is the policy ∪ RO union; policy count is the policy leg alone. The two KPI cards can therefore never be internally consistent, which reads as a bug to users.

**Q-CP-04 — `totalCompaniesBrokerage` excludes RO brokerage** while the table's visible column *is* Brokerage (RO). The Total brokerage KPI can never equal the sum of the visible column. Should the KPI include `roBrokerage`?

**Q-CP-05 — Service score filtering is applied after pagination.**
The threshold is applied to the current page's already-computed scores, so the count and KPI figures do not reflect it, and page size changes the result set.

**Q-CP-06 — Sorting and pagination are performed in memory** over the whole matched policy set. Correct, but it does not bound memory as the book grows.

**Q-CP-07 — `totalSoPremium` has returned implausible values.**
A live response showed roughly 1.1 quadrillion. This points at a unit or double-count problem in the SO premium aggregation, independent of the filter work.

**Q-CP-08 — Owner-card attribution is not additive.**
With the whole-subtree definition, a policy owned three levels down counts in that owner's card *and* every ancestor's card. Cards are nested, not partitioned, so sibling cards must not be summed. Should the UI signal this?

**Q-CP-09 — `recursiveTeam` makes this page's Manager + Team definition differ from the other three.**
See Q-ENH-08. Should the other pages adopt it, or should this one revert for consistency?

**Q-CP-10 — The recursive downline is resolved per query with no caching.**
A single page load can resolve it up to five times, and for a top-of-tree user that is the entire employee base each time. Both a latency risk and, at extreme scale, a query-parameter-count risk.

**Q-CP-11 — Reference policy lookup bypasses scope.**
The brokerage lookup for referenced policies applies no scope, active-status or enabled-for-performance filter. Confirm this is intended.

---

## 11. Approval

| Role | Name | Date | Status |
|---|---|---|---|
| Product | | | Pending |
| Engineering | | | Pending |
| QA | | | Pending |
| Client | | | Pending |
