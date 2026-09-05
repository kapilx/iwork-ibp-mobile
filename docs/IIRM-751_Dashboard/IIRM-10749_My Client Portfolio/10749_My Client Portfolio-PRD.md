# My Client Portfolio — Module PRD

| | |
|---|---|
| **Jira** | IIRM-10749 (parent: IIRM-751 Dashboard) |
| **Module code** | MCP |
| **Mode** | Reverse-engineered from production code |
| **Production URL** | https://iworkedge.indiainsure.com/my-client-portfolio |
| **Route** | `/my-client-portfolio` (iWork) |
| **Primary code** | `apps/ui/iwork/src/app/pages/ClientPortfolio/` + `apps/services/policy-service` (portfolio, policies, service TAT) + `apps/services/opportunity-service` (RO/SO drill-down) |
| **Status** | Draft — as-is behavior record |
| **Date** | 10-Jul-2026 |

> **Reading note.** This PRD documents what the screen *does today*, formula by
> formula, traced through front-end, API, and database. It is the baseline against
> which the V2 changes (client feedback of 23-Jun-2026, kept separately in this
> folder) will be specified. Where the implementation contains dead controls or
> internal inconsistencies, they are recorded as-is in section 9 and raised in
> Open Questions — they are **not** silently corrected in the formulas.
> Any fix to items in section 9 is a code change and must go through Tech Lead review.

---

## 1. Why This Module Exists

My Client Portfolio is the account manager's book-of-business view inside iWork.
It answers, for whichever slice of the organisation the user is allowed to see:
*which companies do we currently serve, how much premium and brokerage do they
represent, what renewal and sales pipeline is attached to them, how much have
they claimed, and how well are we servicing them month by month?*

The screen is policies-first: a company appears because it has at least one
**active policy** (or an active renewal opportunity) matching the filters — not
because a company record exists. This distinguishes it from My Companies
(IIRM-774), which lists CRM company records regardless of policy state.

Readers of this document: product owners validating V2 changes against current
behavior, the Tech Lead writing the TRD, QA deriving test scenarios, and any
developer touching `ClientPortfolio/*` cold.

## 2. Scope

### In scope

- The `/my-client-portfolio` page: Smart search filter panel, 4 KPI cards,
  Companies overview table, Past companies toggle, Save view / Table settings.
- Per-company drill-downs rendered on the same page after **View details**:
  Policy details, Renewal opportunities, Sales opportunities, Service score,
  and Service score details (per-month TAT breakdown).
- Navigation contracts out of the page (company details, policy details,
  opportunity details, upload claims).
- Exact column/KPI formulas: UI source field → API field → DB entity/column,
  including aggregation, scoping, null handling, and display formatting.

### Out of scope (deferred / owned elsewhere)

- The destination pages navigated to (Company page, Policy page, Opportunity
  page, Upload claims) — separate modules.
- CD Management and Endorsement listing (same route file, different pages).
- The V2 redesign from client feedback dated 23-Jun-2026 (RO-premium-only
  results, quarterly brokerage breakup, KPI TAT cards, trend graphs) — will be
  specified as a delta PRD once this baseline is approved.
- Service TAT data *production* internals (scheduler) beyond what is needed to
  explain the numbers users see.

## 3. Personas & Data Visibility

The page is used by three effective roles; visibility is enforced server-side
on every list and KPI query (`policy.service.ts:1764-1906`,
`libs/service-lib/src/lib/utils/scope.utils.ts:84-107, 697-716`):

| Persona | Effective scope |
|---|---|
| Leadership / Super User (`ROLE_LEADERSHIP`, `ROLE_SUPER_USER`), no Owner filter | **Unscoped** — sees every company/policy in the system that matches filters. |
| Leadership with an Owner selected | Scoped to that owner per View by. |
| Everyone else (BD / ISG / account managers) | Scoped to self (or the selected Owner) per View by: **Manager** = policies the user created, owns, or participates in (`policy_participant_map`); **Manager + Team** = the same, extended to the user's recursive reportees — or, for AM/ISG roles, everyone in the user's branch, and for CS roles the whole organisation (`entity-service.utils.ts:874-961`). |

Two rules worth calling out because they are easy to miss:

- **BR-MCP-001 — Default scope is Manager + Team.** If View by is left empty,
  the backend treats it as `team` (`policy.service.ts:1895-1905`).
- **BR-MCP-002 — Owner substitution, not intersection.** Selecting an Owner
  replaces the logged-in user as the scope root (`userId = ownerId ?? loggedInUserId`,
  `policy.service.ts:1889`); you view *their* book, subject to your role.

The RO/SO drill-down lists additionally apply the BD/ISG **stage gate**
(`opportunity.repository.ts:12349-12358`): ISG-only viewers see only
opportunities that have reached ISG; BD-only viewers stop seeing an opportunity
once it is handed to ISG unless they (or their reportees) own it.

## 4. Screen Anatomy & Flows

Top to bottom, one page (`CompanyOverView/index.tsx:341-429`):

1. **Title** — "My client portfolio" (h1). When arriving from the Dashboard,
   a breadcrumb `Dashboard / My client portfolio` renders instead.
2. **Smart search** card — filter form in four titled groups (Organisation,
   Period (Policy from), Company, Policy) plus a free-text search box.
   Buttons: Reset, Collapse, Run.
3. **KPI cards** — Total companies, Total policies, Total premium, Total brokerage.
4. **Companies overview** table — paginated, sortable (subset of columns),
   with Past companies / Save view / Table settings actions.
5. **Drill-down stack** (appears when a row's **View details** is clicked, and
   auto-scrolls into view; any non-link cell click also selects the row):
   - Policy details — the company's active policies matching current filters.
   - Renewal opportunities — the company's Open/WIP ROs.
   - Sales opportunities — the company's Open/WIP SOs.
   - Service score — 12 months of the (client-side hardcoded) year 2025,
     with **View details** per month opening Service score details.
   In **Past companies** view the RO/SO sections are hidden
   (`CompanyOverView/index.tsx:410-425`).

Navigation out:

| Click | Destination | Carried state |
|---|---|---|
| Company name (overview or policy table) | `/companies/:companyId` | breadcrumb trail + current filters + company row (restored on back-navigation) |
| Policy number (policy details) | `/policies/:policyId` | breadcrumb + company data |
| RO/SO id | `/opportunities/:opportunityId` | breadcrumb |
| Policy number (RO row) | `/policies/:refPolicyId` | breadcrumb |
| Upload claim icon (non-group policy) | `/:policyId/upload-claims` | policyId |

## 5. User Stories

Grouped by capability. (BRD traceability is inherited — the Daksh stage-20 BRD
does not exist for this brownfield module; stories trace to production behavior
and Jira IIRM-10749.)

### 5.1 Filter & search

- **US-MCP-001** — As an account manager, I want to filter my client portfolio
  by organisation structure (org / SBU / vertical / branch), owner, and view
  mode, so that I see exactly my (or my team's) book.
- **US-MCP-002** — As an account manager, I want to filter by policy period
  (financial year, named period, month, or explicit date range on policy start),
  so that I can look at a specific underwriting window.
- **US-MCP-003** — As an account manager, I want to filter by company type,
  company priority, policy type, IIRM policy type, industry, renewal period,
  policy expiry window, and ISG manager, so that I can slice the book by
  business attributes.
- **US-MCP-004** — As a user, I want a free-text search that matches company
  name (and policy number/id), applied together with the filters, so that I can
  jump to a specific client.
- **US-MCP-005** — As a user, I want filters to apply only when I press **Run**
  (or Enter / the magnifier icon), so that a half-configured filter set doesn't
  fire queries.

### 5.2 KPI summary

- **US-MCP-006** — As a manager, I want headline counts (companies, policies)
  and monetary totals (premium, brokerage) for the filtered result set, so that
  I can size the book at a glance.

### 5.3 Companies overview

- **US-MCP-007** — As a user, I want one row per company with premium/count,
  RO and SO pipeline, priority, claims, and service score, so that I can rank
  and triage clients.
- **US-MCP-008** — As a user, I want to switch to **Past companies** (expired
  policies only), so that I can see lapsed clients for win-back.
- **US-MCP-009** — As a user, I want to persist my column layout and current
  filters as my default view (**Save view**, **Table settings**), so the screen
  opens the way I work.

### 5.4 Drill-downs

- **US-MCP-010** — As a user, I want to open a company's active policies
  inline, inheriting my current filters, so the list reconciles with the row's
  policy count.
- **US-MCP-011** — As a user, I want the company's open renewal and sales
  opportunities inline, so I can see pipeline behind the numbers.
- **US-MCP-012** — As a user, I want the company's monthly service score and
  its per-service TAT breakdown, so I can explain service quality to the client.

## 6. Business Rules & Formulae

This section is the heart of the document: every filter, KPI, and column, with
its end-to-end formula. Notation: *UI* = React component/config, *API* = query
param / endpoint, *DB* = TypeORM entity property (table `policy`, `opportunity`,
`policy_claim`, `org_service_tat_summary`, etc.).

### 6.1 The company universe (what makes a row)

**BR-MCP-003 — Active policy definition.** A policy is "active" for this screen
iff **all** of: `policyStatusLid = <Active lookup>` **and** `policyTo >= today
(00:00)` **and** `enabledForPerformanceLid = Yes`
(`policy.repository.ts:2432-2451, 2163-2176`). The enabled-for-performance flag
is applied to *every* query on this screen — policies excluded from performance
never appear or count here.

**BR-MCP-004 — Row universe.** Companies shown = companies with ≥ 1 matching
active policy **∪** companies with ≥ 1 active (Open/Work-In-Progress) RO in the
user's scope (`policy.repository.ts:2640-2643`). An SO alone never adds a
company. A company with active ROs but zero matching active policies shows
`0 (#0)` in the policy column — this is why production shows many
`0 (#0)` rows.

**BR-MCP-005 — Past companies.** Toggling **Past companies** flips the expiry
predicate to `policyTo < today` (status still Active, still
enabled-for-performance) and **drops the RO/SO buckets entirely** — the union
is policy-companies only, RO/SO columns are 0, and the RO/SO drill-down
sections are hidden (`policy.repository.ts:2436-2451, 2553-2556`;
`CompanyOverView/index.tsx:410-425`).

**BR-MCP-006 — RO/SO bucket definition.** "Active" opportunities are those with
status **Open** or **Work In Progress** only (`policy.repository.ts:2542-2551`).
Won / Lost / Closed / Completed opportunities are excluded from both the column
aggregates and the drill-down lists. *(Flagged in Open Questions — product
expectation stated by the client includes won/lost/closed.)*

**BR-MCP-007 — RO respects policy filters via its referenced policy.** When any
policy-attribute filter is active (policy type, IIRM type, insurer, industry,
company type/priority, expiry window — anything beyond pure org/owner scope),
an RO is counted only if its `refPolicyId` points at a policy that passes those
same filters (`policy.repository.ts:2571-2615`). SOs have no ref policy and are
never attribute-filtered — org/owner scope only.

### 6.2 Filter application mechanics

**BR-MCP-008 — Run-gated.** Editing a field changes only the form and chips;
the query fires when **Run**, **Enter** in the search box, or the magnifier icon
is pressed (`useTableController.ts:79-217`; `SmartSearch/index.tsx:341-375`).
Every applied change resets pagination to page 1.

**BR-MCP-009 — Reset restores, it does not refetch.** Reset returns the form to
the default values; the table keeps showing the last Run's results until Run is
pressed again (`useFormWatcher.ts:57-62`).

**BR-MCP-010 — Defaults and saved views.** On first load the page waits for the
default filter config, then runs it: the user's saved view
(`userDefaultConfig.smartSearchValues.CLIENT_PORTFOLIO`) wins over the system
default, which carries the org scope (e.g. Organisation = IIRM India) and
current financial year (`CompanyOverView/index.tsx:75-89, 175-198`). Navigating
back from a company page restores the filters you left with (`location.state.filters`).

**BR-MCP-011 — Client-side sanitization.** Two form fields are stripped before
the query is built (`CompanyOverView/index.tsx:158-167`): `status` (the screen
is active-only by construction) and `serviceScore` (**display-only filter** —
no backend mapping exists; selecting it changes nothing).

**BR-MCP-012 — Lookup filters send labels, not ids.** Smart-search lookup
selects (company type, priority, policy type, IIRM type, industry…) put the
**display label** on the wire (`useApiSelectField.ts:92-100`) as
`search=key:[Label]`; the backend maps each key to a DB column via
`ATTRIBUTE_FIELD_MAP` (`service-lib/src/lib/constants.ts:87-180`) and matches
on the lookup **value text**, not the id.

**BR-MCP-013 — Date-window precedence.** Server-side precedence when several
period inputs arrive (`policy.repository.ts:2073-2121`):

1. `month` / `financialYear` → window on **policyFrom** (FY = 01-Apr → 31-Mar;
   month within FY, Jan–Mar mapped to FY+1);
2. else `renewalPeriod` → **forward-looking** window on **policyTo**: expiring
   between today and today+N (an upcoming-renewals filter);
3. else `period` → **forward-looking** window on **policyFrom**: incepting
   between today and today+N (not a lookback);
4. else explicit `from`/`to` → window on **policyFrom** (`field=policyFrom`).
   Caveat: the guard for this branch checks month/FY/period but **not**
   renewalPeriod, so renewalPeriod and an explicit from/to range can apply
   simultaneously (`policy.repository.ts:2109`).

Policy-expiry From/To dates are an independent second window on **policyTo**
(`policy.repository.ts:2117-2129`) and combine with whichever primary window won.
The UI additionally auto-computes `from`/`to` whenever FY/period/month change
(`SmartSearch/index.tsx:183-275`), and enforces mutual exclusivity by clearing
counterpart fields (see per-field table).

### 6.3 Filter field reference

Prose first, then one row per control. "Applied as" shows the wire format;
"Server rule" is the DB predicate it becomes. Grid: all selects are
single-choice; all date fields are DD/MM/YYYY pickers storing `YYYY-MM-DD`.

**Free-text search** — placeholder "Search by company name". Debounced 300 ms
into the form (min 3 chars), sent as `searchBy=<text>`; despite the placeholder
it matches **company name OR insurer policy number OR internal policy id**,
case-insensitive substring (`policy.repository.ts:2153-2161`).

#### Organisation group

| Field | UI key | Options source | On-change cascades | Applied as | Server rule |
|---|---|---|---|---|---|
| Organisation | `organisationId` | GET master organisations | clears SBU, Vertical, Branch | `search=organisationId:[id]` | Expanded to the org **and its child organisations** (parent-org lookup, `policy.service.ts:1832-1866`), matched on `policy.organisationId` |
| SBU | `sbuId` | GET SBUs of selected org (dependent) | clears Vertical | `sbuId=<id>` | `policy.sbuId = id` |
| Vertical | `verticalId` | GET verticals of selected SBU (dependent) | — | `verticalId=<id>` | `policy.verticalId = id` |
| Branch | `branchId` | GET branches of selected org (dependent) | — | `branchId=<id>` | `policy.branchId = id` |
| Owner | `ownerId` | Employee hierarchy tree (`employeeHirarcy`) | — | `ownerId=<userId>` | Scope root becomes this user (BR-MCP-002) |
| View by | `viewBy` | Static: Manager / Manager + Team | — | `viewBy=manager\|team` | Manager = owner only; Team (or empty) = owner + reporting hierarchy; ignored for leadership with no owner (BR-MCP-001/002) |

Note: org-dimension filters match the **policy row's own org columns**
(`policy.repository.ts:2235-2253` normalizes `owner.*Id` → direct columns), so a
policy written under a branch counts there even if its owner has since moved.

#### Period (Policy from) group

| Field | UI key | Options source | On-change cascades | Applied as | Server rule |
|---|---|---|---|---|---|
| Financial Year | `financialYear` | Generated year list; default = current FY | clears Period; clearing FY clears Month, From, To | `financialYear=<startYear>` + derived `from`/`to` | policyFrom ∈ [01-Apr-Y, 31-Mar-Y+1] (precedence 1) |
| Period | `period` | Lookup `POLICY_DURATION` (e.g. "3 Months", "30days") | clears FY, Month; clearing clears From, To | `period=<label>` + derived `from`/`to` (today → today+N−1d) | policyFrom ∈ [today, today+N] — **forward-looking** (precedence 3) |
| Month | `month` | Static month list | clears Period; auto-sets current FY if FY empty | `month=<value>` | With FY: policyFrom ∈ that calendar month (Jan–Mar → FY+1) (precedence 1) |
| From date | `from` | Date picker; max = To date | clears FY, Period, Month | `from=YYYY-MM-DD&field=policyFrom` | policyFrom ≥ from (precedence 4) |
| To date | `to` | Date picker; min = From date | clears FY, Period, Month | `to=YYYY-MM-DD` | policyFrom ≤ to (precedence 4) |

#### Company group

| Field | UI key | Options source | Applied as | Server rule |
|---|---|---|---|---|
| Company type | `policyCompanyType` | Lookup `COMPANY_TYPE` | `search=policyCompanyType:[Label]` | `company.companyType.lookUpValue = Label` |
| Company priority | `policyCompanyPriority` | Lookup `PRIORITY` | `search=policyCompanyPriority:[Label]` | `company.priority.lookUpValue = Label` |
| Service score | `serviceScore` | Static: >90%, >80%, >70%, <70% | **not sent** | **None — display-only** (BR-MCP-011) |

#### Policy group

| Field | UI key | Options source | Applied as | Server rule |
|---|---|---|---|---|
| Policy type | `policyType` | Lookup `POLICY_TYPE` | `search=policyType:[Label]` | `policy.policyType.lookUpValue = Label` |
| IIRM Policy type | `iirmPolicyType` | Lookup `IIRM_POLICY_TYPE` | `search=iirmPolicyType:[Label]` | Label → `policy_type_segregation` → set of `policyTypeLid`; no match → empty result (`policy.service.ts:1808-1830`) |
| Company industry | `industry` | Lookup `INDUSTRY_SEGMENT` | `search=industry:[Label]` | `company.industrySegment.lookUpValue = Label` |
| Renewal period | `renewalPeriod` | Lookup `POLICY_RENEWAL_PERIOD` | `renewalPeriod=<label>` | policyTo ∈ [today, today+N] — expiring in the next N (precedence 2) |
| Policy expiry (From date) | `policyExpiryFromDate` | Date picker | `search=policyExpiryFromDate:[YYYY-MM-DD]` | With To date: policyTo BETWEEN from AND to; alone: policyTo ≥ date |
| Policy expiry (To date) | `policyExpiryToDate` | Date picker | `search=policyExpiryToDate:[YYYY-MM-DD]` | **Alone it degenerates to an exact-date match** (backend sets from = to, `policy.repository.ts:2117-2128`) — see D-12 |
| Business month | `businessMonth` | Static month list | `businessMonth=<Month>` | **Ignored** — the portfolio controller passes `undefined` for businessMonth (`policy.controller.ts:437`); dead filter on this screen |
| ISG manager | `isgManager` | Employee hierarchy tree | `search=isgManager:[userId]` | `policy.isgId = userId` |

### 6.4 KPI card formulae

The four cards summarize the **entire filtered result set** (not the current
page). Source: `kpiData` of `GET /policy/portfolio/companies`
(`policy.repository.ts:2726-2757`); card config `CompanyOverView/tableConfig.ts:51-78`;
formatting `KPICards/index.tsx:72-86`, `utils/index.tsx:683-723`.

| Card | Formula | Format |
|---|---|---|
| Total companies | `COUNT(DISTINCT companyId)` over the union in BR-MCP-004 | Integer, Indian grouping (e.g. 27,373) |
| Total policies | `COUNT(policy.id)` over matching active policies (BR-MCP-003 + all filters + scope) | Integer, Indian grouping |
| Total premium | `Σ policy.premiumAtInception` over the same policy set | Compact currency: ≥1 Cr → `X.XX Cr`; ≥1 L → `X.XX L`; ≥1 K → `X.XX K`; else 2 decimals. No currency symbol |
| Total brokerage | `Σ policy.basicBrokerageAmount` over the same policy set | Same compact format |

Notes: card colors are purple / yellow / teal / orange respectively; percentage
suffixes are disabled (`showPercentage=false`). The API also returns
`totalRoCount/totalRoPremium/totalSoCount/totalSoPremium` — computed but **not
displayed** by any card today. Companies contributed only by ROs add to Total
companies but nothing to premium/brokerage (those sum policies only).

### 6.5 Companies overview — column formulae

Endpoint: `GET /policy/portfolio/companies` (policy-service), grouped in
application code per company (`policy.repository.ts:2383-2786`). Column config:
`CompanyOverView/tableConfig.ts:80-207`.

| Column | DB source | Formula | Display & null rule |
|---|---|---|---|
| Company name | `company.companyName` | Display name of the aggregated company | Pinned left; click navigates to company page; `--` if null |
| Policy premium (#count) | `policy.premiumAtInception` | `Σ premiumAtInception` and `COUNT(*)` of the company's matching active policies (BR-MCP-003 + filters) | `<grouped premium> (#count)`; premium `--` when null, count defaults 0; hidden by default in production's saved view |
| RO premium (#count) | `opportunity.premiumPaid` | `Σ premiumPaid` and `COUNT(*)` over the company's **Open/WIP** ROs in scope (BR-MCP-006/007) | Same format; ROs of past-companies view: always 0 |
| SO premium (#count) | `opportunity.premiumPaid` | Same over Open/WIP SOs (never attribute-filtered) | Same format; hidden by default in production's saved view |
| Priority | `company.priority.lookUpValue` | Company's priority lookup | Chip with dot; style keys (case-insensitive): vimp=green, high=orange, medium=yellow, low=pale yellow, imp=red; `--` if null |
| Claim amount | `policy_claim.claimAmount` | `Σ COALESCE(claimAmount,0)` over **all claims of all policies of the company** — not restricted by the active-policy set, the period filters, or scope (`policy.repository.ts:2670-2683`) | Grouped number; 0 when no claims |
| Service score | — | **No backend field.** Column reads `ServiceScore`, which the API never returns | Always `--` (dead column) |
| Actions | — | **View details** button (eye icon) | Opens drill-down stack, auto-scrolls |

Table-level rules:

- **BR-MCP-014 — Default order & sortable subset.** Default sort is policy
  count descending. Header sorting works only for Company name, Policy premium
  (and its count), Claim amount, and Priority (in-memory map
  `PORTFOLIO_COMPANY_SORT_FIELD_MAP`, `service-lib/constants.ts:222-231`).
  Clicking RO premium, SO premium, or Service score headers falls back to the
  default order — visually a no-op.
- **BR-MCP-015 — Pagination on companies.** Page sizes 5 / 10 / 20 (default 10);
  `count` = distinct companies in the union. Title shows
  `Companies overview (<count>)`, subtitle "Select a company to view policy details".
- **BR-MCP-016 — Priority sort is alphabetical**, not severity-ordered
  (in-memory `localeCompare` on the label: High < Low < Medium < VIMP).

### 6.6 Drill-down: Policy details — column formulae

Title: `Policy details - <Company name>`. Endpoint:
`GET /policy/company/:companyId?activeOnly=true[&pastCompanies=true]` + **all
currently applied portfolio filters**, so the list reconciles with the row's
policy count (`CompanyPolicies/index.tsx:54-67`; `policy.service.ts:1601-1683`).
Rows are the same policy set as BR-MCP-003 scoped to the company.

| Column | DB source | Formula / rule | Display & null |
|---|---|---|---|
| Policy number | `policy.insurerPolicyNumber` | As stored | Pinned left, clickable → policy page; `--` if null |
| Company name | `company.companyName` | As stored | Pinned left, clickable → company page |
| Contact | — | Mapped from `policy.contact`, **which the row transform never emits** (it emits `contacts[]`; `policy.service.ts:1667` vs `policy.repository.ts:4805-4811`) | Always `--` (dead column) |
| Policy type | `policyType.lookUpValue` | Lookup label | `--` if null |
| Status | `policyStatus.lookUpValue` | Always "Active" by construction (BR-MCP-003) | — |
| Sum insured | `policy.sumInsured` | As stored | Grouped number, `--` if null |
| Premium | `policy.premiumAtInception` | Inception premium (endorsement premiums NOT included) | Grouped number, `--` if null |
| Policy from | `policy.policyFrom` | As stored | DD/MM/YYYY |
| Policy to | `policy.policyTo` | As stored | DD/MM/YYYY |
| Account manager | `company.accountManagerInfo` | `firstName + " " + lastName` of the **company's** account manager (not the policy owner) | `--` if unset |
| Action | — | "Activate policy" button → reveals icons: Create endorsement, Upload claim (non-group) / Create claim (group) | See BR-MCP-017 |

**BR-MCP-017 — Action column behaves as a reveal, not an activation.** The
"Activate policy" button only exposes the icon set; it calls no API. Of the
icons: *Upload claim* navigates to `/:policyId/upload-claims`; *Create
endorsement* attempts the same navigation but reads a field (`policyId`) the
row doesn't carry, so it always toasts "Unable to navigate: Policy ID not
found"; *Create claim* (group policies) has no handler at all
(`CompanyPolicies/index.tsx:126-193`). Recorded as-is; see Open Questions.

### 6.7 Drill-downs: Renewal / Sales opportunities — column formulae

Titles: `Renewal opportunities - <Company>` / `Sales opportunities - <Company>`.
Endpoint: `GET /opportunity/company/:companyId?type=RO|SO&activeOnly=true`
(opportunity-service, `opportunity.repository.ts:12255-12472`). Status scope =
Open/WIP; BD/ISG stage gate applies (section 3). **The portfolio page's
filters are NOT passed to these lists** — they show all in-scope active
opportunities of the company regardless of the filter panel.

| Column | RO | SO | DB source & formula |
|---|---|---|---|
| RO id / SO id | ✓ | ✓ | `opportunity.opportunityId`; clickable → opportunity page |
| Policy number | ✓ | — | `refPolicy.insurerPolicyNumber`; clickable → referenced policy |
| Policy type | ✓ | ✓ | `policyType.lookUpValue` |
| Premium | ✓ | ✓ | RO: `refPolicy.premiumAtInception + Σ refPolicy.endorsements[].premiumAtInception`; SO (no ref policy): `opportunity.premiumPaid` (`opportunity.repository.ts:12425-12435`) |
| Sum insured | ✓ | ✓ | `opportunity.sumInsured` |
| Status | ✓ | ✓ | `status.lookUpValue` (only Open / Work In Progress possible here) |
| Expiry date / Expected close | ✓ | ✓ | Both read `opportunity.expiryDate` — the SO column is a relabel, not a different field |
| Assigned to | ✓ | ✓ | `owner.firstName + " " + lastName` |

**BR-MCP-018 — Two RO premium formulas coexist.** The overview column sums
`opportunity.premiumPaid`; this drill-down computes ref-policy inception +
endorsements. Unless `premiumPaid` is maintained to equal that sum, the
drill-down premiums will not reconcile with the row aggregate. Flagged in Open
Questions.

### 6.8 Drill-down: Service score — model & column formulae

Title: "Service score". Endpoint:
`GET /service-tat/monthly-summary?year=2025&companyId=<id>` — **the year is
hardcoded to 2025 in the UI** (`endPoints.ts:669-670`); the API itself accepts
any year ≥ 2000.

This drill-down renders the **Service TAT Score** (policy-service `service-tat`
module; a scheduler aggregates service events daily into
`org_service_tat_summary` per service, TAT bucket, company, and month). All
formulae — the 11-service list and weightages, TAT bucket weights, monthly
summary math (`marks`, `marksScored`, dynamic-denominator `totalMarks`,
`percentage`), column formulae, and the RAG indicator thresholds — are defined
canonically in the **[Service Score PRD
§3](../../Service-Score/Service-Score-PRD.md)** (§3.1–§3.4) and must not be
restated or modified here. Code anchor: `service-tat.service.ts:204-262`.

**BR-MCP-019 — Company access for scores is CRM-lead-based, not policy-based:**
accessible companies = those whose `leadCrm` is the user or a reportee (or
created by them when leadCrm is empty). An out-of-scope company returns
all-zero months with HTTP 200 — the table shows 12 RED rows, not an error
(`service-tat.service.ts:135-147, 551-584`).

### 6.9 Drill-down: Service score details — column formulae

Title: "Service score details". Endpoint:
`GET /service-tat/monthly-details?month=YYYY-MM&companyId=<id>`. One row per
service (all 11, fixed display order), for the chosen month
(`service-tat.service.ts:394-461`; UI dynamic columns
`ServiceScoreDetails/tableConfig.ts:81-191`).

Column formulae (No. of request, per-bucket TAT counts, Scored, Weighted
scored, Max. weightage), null rules, and the `--` footnote are defined
canonically in the **[Service Score PRD
§3.5](../../Service-Score/Service-Score-PRD.md)** and must not be restated or
modified here.

### 6.10 Save view & Table settings

**BR-MCP-020.** *Table settings* opens a drawer listing all columns with
checkboxes (show/hide) and drag handles (reorder); Save/Discard apply to the
session. *Save view* persists, per user under entity key `CLIENT_PORTFOLIO`:
the column order + visibility array **and the currently selected filter
values** (`Table/index.tsx:622-635`). Persisted config is what makes production
hide Policy premium and SO premium by default while the code ships them
visible. Saved smart-search values are re-normalized on restore (period/FY
mutual exclusion re-applied).

## 7. Acceptance Criteria

Given/When/Then per story; these are the sign-off checks for the **as-is**
baseline (QA regression pack for V2).

- **AC-MCP-001** (US-001/002/003) — Given a non-leadership user with defaults
  loaded, when the page first renders, then exactly one portfolio query fires,
  scoped to Organisation = system default, FY = current, viewBy = Manager + Team.
- **AC-MCP-002** (US-005) — Given edited filter fields, when Run is not yet
  pressed, then the table and KPIs do not change; when Run is pressed, then the
  query fires once and pagination resets to page 1.
- **AC-MCP-003** (US-001) — Given View by = Manager, then only policies whose
  owner is the scope root are counted; given Manager + Team, the owner's
  reporting hierarchy is included; given a Leadership user with no Owner
  selected, results are unscoped.
- **AC-MCP-004** (US-002) — Given FY 2026 selected, then policy windows filter
  on policyFrom ∈ [01-Apr-2026, 31-Mar-2027]; picking a Month narrows to that
  month (Jan–Mar mapped to 2027); picking explicit From/To clears FY/Period/Month.
- **AC-MCP-005** (US-003) — Given IIRM Policy type = X, then only policies whose
  policy type belongs to X's segregation set are counted; if X maps to nothing,
  the result set is empty (not unfiltered).
- **AC-MCP-006** (US-004) — Given "acme" in the search box and Run, then rows
  are companies having an active policy whose company name, insurer policy
  number, or policy id contains "acme" (case-insensitive).
- **AC-MCP-007** (US-006) — Given the filtered set, then Total companies equals
  the distinct-company union of BR-MCP-004, Total policies the active-policy
  count, Total premium `Σ premiumAtInception`, Total brokerage
  `Σ basicBrokerageAmount`, formatted `X.XX Cr/L/K`.
- **AC-MCP-008** (US-007) — Given a company with 3 matching active policies of
  premium 10L each and 2 open ROs of premiumPaid 5L each, then its row reads
  Policy premium `30,00,000 (#3)`, RO premium `10,00,000 (#2)`.
- **AC-MCP-009** (US-007) — Given a company whose only matching pipeline is
  active ROs, then it still appears with Policy premium `0 (#0)`; given only
  active SOs, it does not appear.
- **AC-MCP-010** (US-008) — Given Past companies toggled on, then rows are
  companies with Active-status policies whose policyTo < today; RO/SO columns
  are 0; the RO/SO drill-down sections do not render; the button relabels to
  "Show active companies".
- **AC-MCP-011** (US-010) — Given View details on a company, then Policy
  details lists exactly the policies making up its Policy count (same filters
  inherited), and clicking a policy number navigates to that policy with a
  breadcrumb back to the portfolio (filters restored on return).
- **AC-MCP-012** (US-011) — Given the RO drill-down, then only Open/WIP ROs of
  that company appear (stage-gate applied), with RO Premium = ref-policy
  inception + endorsements.
- **AC-MCP-013** (US-012) — Given a month row with 40 endorsement events, 30 in
  0–7 d and 10 in 22–30 d, and no other service events, then Scored (details) =
  30×1.00 = 30.00, No. of request = 40, Weighted scored = 30/40×0.10 = 0.075→0.08,
  and the month's Total marks = 0.10.
- **AC-MCP-014** (US-009) — Given a column hidden via Table settings and Save
  view pressed, then reloading the page (and any other session of the same
  user) shows the saved layout and re-applies the saved filter values.
- **AC-MCP-015** (US-007) — Sorting: clicking Company name / Policy premium /
  Claim amount / Priority headers re-orders the full result set (not just the
  page); clicking RO premium / SO premium / Service score leaves the default
  policy-count-descending order.

## 8. Data Contract

### 8.1 Consumed (this module reads)

| Endpoint | Service | Purpose |
|---|---|---|
| `GET /policy/portfolio/companies` | policy-service | Company rows + KPI data. Params: `page,limit,sort,searchBy,search,field,from,to,period,month,financialYear,sbuId,verticalId,branchId,ownerId,viewBy,renewalPeriod,iirmPolicyTypeLid,insurerId,pastCompanies` |
| `GET /policy/company/:companyId?activeOnly=true` | policy-service | Policy details drill-down (inherits portfolio filters, `pastCompanies` passthrough) |
| `GET /opportunity/company/:companyId?type=RO\|SO&activeOnly=true` | opportunity-service | RO/SO drill-downs |
| `GET /service-tat/monthly-summary?year=2025&companyId=` | policy-service | Service score months (year hardcoded client-side) |
| `GET /service-tat/monthly-details?month=YYYY-MM&companyId=` | policy-service | Per-service TAT breakdown |
| Lookups `COMPANY_TYPE, PRIORITY, POLICY_TYPE, IIRM_POLICY_TYPE, INDUSTRY_SEGMENT, POLICY_RENEWAL_PERIOD, POLICY_DURATION` | config | Filter options (label-valued) |
| Master org / SBU-by-org / verticals-by-SBU / branches-by-org / employee hierarchy | org-service | Organisation-group filter options |
| User/system default config (`smartSearchValues`, `tableDefaultSettings` for `CLIENT_PORTFOLIO`) | config | Default filters, saved views |

### 8.2 Produced (this module writes)

Only user preferences: `updateUserDefaultConfig` with
`{ entityKey: CLIENT_PORTFOLIO, selectedFilterValues, columns[] }` on Save view.
No business data is created or mutated from this screen (the Action buttons
that imply mutation are inert or navigate away — BR-MCP-017).

### 8.3 Portfolio row shape (for the TRD)

```
{ companyId, companyName, priority,
  policyCount, policyPremium, brokerage,
  roCount, roPremium, soCount, soPremium,
  claimAmount }
```
KPI payload additionally carries `totalCompanyCount, totalPolicyCount,
totalCompaniesPremium, totalCompaniesBrokerage, totalRoCount, totalRoPremium,
totalSoCount, totalSoPremium`.

### 8.4 Cross-module contract items

- RO premium reconciliation between opportunity-service (drill-down) and
  policy-service (aggregate) — see OQ-2.
- `enabledForPerformance` flag semantics are shared with Business Performance
  dashboards; changing its usage here affects both.
- Service TAT company scoping (leadCrm) differs from policy scoping (owner) —
  any V2 unification is a cross-service change.

## 9. Known Discrepancies & Dead Controls (as-is)

Recorded so the baseline is honest; each is a candidate V2 fix, and every fix
is a code change requiring Tech Lead review.

| # | Item | Behavior today | Where |
|---|---|---|---|
| D-1 | Service score filter | UI renders it; value is stripped before query — filtering does nothing | `CompanyOverView/index.tsx:158-167` |
| D-2 | Service score column | Always `--`; API sends no such field (field name `ServiceScore` unmapped) | `CompanyOverView/tableConfig.ts:180-194` |
| D-3 | Contact column (Policy details) | Always `--`; transform emits `contacts[]`, mapper reads `contact` | `policy.service.ts:1667` |
| D-4 | Business month filter | Sent by UI, discarded by portfolio controller (`undefined` passthrough) | `policy.controller.ts:437` |
| D-5 | RO premium formula split | Overview sums `premiumPaid`; drill-down computes ref-policy inception + endorsements | BR-MCP-018 |
| D-6 | Claim amount scope | Sums every claim of every policy of the company — ignores period/attribute filters and active-only | `policy.repository.ts:2670-2683` |
| D-7 | Service score year | Hardcoded `year=2025` in UI endpoint constant | `endPoints.ts:669-670` |
| D-8 | "Activate policy" action | Reveal-only; Create endorsement always toasts an error; Create claim icon has no handler | `CompanyPolicies/index.tsx:126-193` |
| D-9 | Sort coverage | RO/SO premium & Service score headers don't sort (silent fallback) | `service-lib/constants.ts:222-231` |
| D-10 | Reset button | Restores form defaults without refetching — table shows stale results until Run | `useFormWatcher.ts:57-62` |
| D-11 | Opportunity status scope | Only Open/WIP counted — client's stated expectation includes won/lost/closed/completed | BR-MCP-006 |
| D-12 | Policy expiry To-date alone | Filters `policyTo BETWEEN to AND to` (exact day) instead of "expiring on or before" | `policy.repository.ts:2117-2128` |

## 10. Open Questions

1. **OQ-1 (D-11)** — Should RO premium/count include Won/Lost/Closed/Completed
   opportunities (client's 23-Jun feedback wording), or stay Open/WIP-only?
   Decision changes BR-MCP-006 and the V2 quarterly brokerage math.
2. **OQ-2 (D-5)** — Which RO premium formula is canonical: `premiumPaid` or
   ref-policy inception + endorsements? Is `premiumPaid` guaranteed to be kept
   equal to the latter?
3. **OQ-3 (D-6)** — Should Claim amount respect the active-policy set and the
   period filters (V1 shows lifetime claims of the whole company)?
4. **OQ-4 (D-1/D-2)** — Service score in the results table: V2 requires a real
   value and a working filter. Source should presumably be the service-TAT
   percentage — for which period (latest month? FY average?)?
5. **OQ-5 (D-7)** — Service score year: switch to the selected FY / current
   year? (API already supports it.)
6. **OQ-6 (D-4)** — Business month: wire it up for the portfolio query or drop
   the field from this screen?
7. **OQ-7 (D-8)** — What is the intended Action set on Policy details rows?
   ("Activate policy" currently activates nothing.)
8. **OQ-8** — Should the RO/SO drill-downs inherit the portfolio filters
   (today they ignore them), so pipeline reconciles with the filtered columns?
9. **OQ-9 (D-10)** — Should Reset also re-run with defaults?
10. **OQ-10** — Service-TAT visibility uses `leadCrm`-based company access while
    the rest of the page uses policy-owner scope — is a user seeing zeros for a
    company whose policies they own acceptable?

## 11. Approval

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```
