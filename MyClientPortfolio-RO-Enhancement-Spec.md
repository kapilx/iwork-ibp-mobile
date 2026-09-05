# Specification — My Client Portfolio: RO Enhancement

| | |
|---|---|
| **Feature** | My Client Portfolio (policy-driven) — RO support |
| **Status** | Draft |
| **Screen** | `apps/ui/iwork/.../ClientPortfolio/CompanyOverView` + `CompanyPolicies` |
| **Services** | `policy-service` (primary), Opportunity domain (RO source) |

---

## 1. Background

The My Client Portfolio screen was reworked to be policy-driven: it lists companies derived from their **active, not-expired** policies, with all Manage-Policies filters and a per-company drill-down. This spec covers the next phase — introducing **Renewal Opportunities (RO)** into the client definition, columns, and drill-down, plus a "Past Companies" view and an insurer-branch filter.

## 2. Definitions

| Term | Definition |
|---|---|
| **Active policy** | `policyStatusLid = POLICY_STATUS_MIG_ACTIVE` **AND** not expired (`policyTo >= today`). |
| **Expired policy** | Active status but `policyTo < today` (used by "Past Companies"). |
| **RO (Renewal Opportunity)** | An active Opportunity of type RO. Carries `ref_policy_no` (= policy id) linking back to the policy it renews. |
| **SO (Sales Opportunity)** | An active Opportunity of type SO (new business; **no** `ref_policy_no`). Shown as a **column + drill-down table only** — it does **not** make a company visible. |
| **Active RO/SO** | Open opportunity status — exact status key TBD (to confirm from existing KPI logic). |
| **Client (company shown)** | A company with **≥1 active policy OR ≥1 active RO**. SO is ignored for visibility. |

## 3. Scope

**In scope:** Policy/RO/SO premium columns (with counts), visibility by Policy OR RO, Past Companies toggle, insurer-branch filter, RO list + SO list in drill-down.
**Out of scope:** SO as a visibility driver — SO-only companies (no active policy, no active RO) are **not** shown, even though their SO premium would otherwise display.

## 4. Functional Requirements

### FR-1 — Data set
Return only Active/Not-Expired policies (DONE in prior phase).

### FR-2 — Client (visibility) rule
Show a company when `activePolicyCount > 0` **OR** `activeRoCount > 0`. A company with only SO (no policy, no RO) is **not** shown.

### FR-3 — Table columns
- Remove: current "Policy" and "Count" columns.
- Add **Policy Premium (# count)** — like My Company.
- Add **RO Premium (# count)** — like My Company; premium **includes inception + endorsement** premium (via the RO's referenced policy).
- Add **SO Premium (# count)** — like My Company (SO opportunities' own premium). Display only; does not affect visibility.
- Add **Brokerage (RO)** — SUM of each active RO's **referenced policy** `basic_brokerage_amount` (the brokerage of the policy being renewed). **Not** the opportunity's `estimated_brokerage` (BD forecast, not booked). Basic (not total) to stay consistent with the Our-portfolio policy table.
- Add **Q1–Q4 (RO brokerage)** — the same RO brokerage bifurcated into fiscal quarters (April-start FY) by each RO's `expiry_date`. Invariant: Q1+Q2+Q3+Q4 = Brokerage.
- Retain existing columns (company name, priority, service score, actions). **Policy Premium, SO Premium and Claim amount are hidden by default** (still toggleable); RO Premium, Total brokerage and Q1–Q4 are shown.

### FR-4 — Filters
- **FR-4.1 Past Companies:** a button/link toggling a view that shows **expired policies only** (`policyTo < today`).
- **FR-4.2 Insurer branch filter:** filter by insurer branch; option label = **concat(Branch Code + Branch Name + Address1)**.

### FR-5 — View Details (drill-down)
- Add **RO list** table (active RO opportunities for the company; each row navigates via `ref_policy_no` into the existing policy detail flow).
- Add **SO list** table (active SO opportunities for the company).
- **Both lists are filtered to active (`OPEN` + `WORK_IN_PROGRESS`)** so they match the portfolio RO/SO counts (Won and Lost are excluded; WIP/Planning is kept). Implemented via an opt-in `activeOnly=true` query param on `GET /opportunity/company/:companyId` (default off, so other consumers of that endpoint are unaffected).

### FR-6 — "Our portfolio" table (Company Details page — adjacent scope)

The **Company Details** page (`CompanyPage/CompanyDetails`, not the Client Portfolio screen) renders an **"Our portfolio"** policy table via `CompanyProfileSection` -> `PolicyList`, fed by `GET /policy/company/:companyId`. Reshaped to match the portfolio brokerage direction:

- **Columns** (replaces Policy number/type/from/to/premium/brokerage/RO Id): **Policy no** (clickable -> policy detail) · **Policy type** · **Expiry date** (`policyTo`) · **Premium (WOST)** · **Brokerage** · **Ins comp** · **TPA** · **Claims amount** · **RO Id** (clickable -> opportunity, retained).
- Column config lives in `CompanyProfileSection/config.ts` (`columns`), passed as `tableConfig` override to the shared `PolicyList`. The `PolicyList` default config (used by Contact Details) is **left unchanged**.
- **Backend** (`getPoliciesByCompanyId` -> `transformPoliciesResponse`): `brokerage` stays `policy.basic_brokerage_amount` (unchanged — kept basic, NOT total, to avoid altering other consumers of this shared transform); added `insurerCompany` (comma-joined insurer displayName across co-insurers), `tpa` (comma-joined, null when none), `claimAmount` (grouped `SUM(policy_claim.claimAmount)` per policy, scoped to `getPoliciesByCompanyId` only). Relations `insurerMappings.insurer` + `tpaMappings.tpa` added to the fetch.
- `transformPoliciesResponse` is shared by `getPoliciesByCompanyId`, `getPoliciesByContactId`, `getPoliciesByOpportunityId`. The `insurerCompany`/`tpa` fields are additive (null where those relations aren't loaded) so other consumers (Contact Details, opportunity policies) are unaffected. Brokerage left as basic for this reason.

## 5. Data model & sources

| Bucket | Source | Count | Premium |
|---|---|---|---|
| Policy | `Policy` (active, not-expired) | count of policies | sum `premiumAtInception` |
| RO | `Opportunity` (type RO, active) joined to ref policy via `ref_policy_no` | count of RO records | sum of ref policy `premiumAtInception` + endorsement premium |
| SO | `Opportunity` (type SO, active) | count of SO records | SO opportunity premium (per existing My Company / KPI logic) |
| RO brokerage | active RO joined to ref policy via `ref_policy_id` | — | sum of ref policy `basic_brokerage_amount`; bifurcated Q1–Q4 by the RO's `expiry_date` (April-start FY) |

Policy / RO / SO are distinct entities → **no double counting**.
Policy filters (policy type, insurer, branch) **also constrain RO** via its referenced policy. SO is display-only/unfiltered.

### 5.1 Findings from current code (My Company / KPI logic)

- **My Company values are DENORMALISED + batch-refreshed + UNFILTERED.** `findAllCompanyList` reads `company.soCount/roCount/policyCount/...` columns; a job `refreshCompanyAnalytics()` recomputes them. It counts **all** opportunities/policies — no active-status, no not-expired, no filter. ⇒ **We cannot reuse those columns** for this live, filtered portfolio; counts/premiums must be computed live.
- **Opportunity types:** `OPPORTUNITY_TYPE.SO = "OPPORTUNITY_TYPE_FRESH"`, `OPPORTUNITY_TYPE.RO = "OPPORTUNITY_TYPE_RENEWAL"`.
- **Opportunity statuses:** `OPPORTUNITY_STATUS_OPEN`, `..._WORK_IN_PROGRESS`, `..._WON`, `..._LOST`. My Company applies **no** status filter to SO/RO counts → "active RO/SO" definition is **ours to set** (see Q).
- **My Company premium calc:** SO premium = `SUM(opportunity.premiumPaid)`; RO premium = `SUM(opportunity.premiumPaid)` — **endorsement is NOT included** anywhere today. Policy premium = `SUM(policy.premiumAtInception)`; brokerage = `SUM(policy.basicBrokerageAmount)`; claim = `SUM(policy_claim.claimAmount)`.
- **RO→policy link:** `Opportunity.refPolicyId` (`ref_policy_id`) + `refPolicy` OneToOne to `Policy`. Endorsement premium lives on `Endorsement` entity (`premium_at_inception`, `gross_premium`) — **no existing RO-includes-endorsement calc**, so it's net-new.
- **Brokerage fields:** `Opportunity.estimated_brokerage` is a **BD forecast** entered at RO creation — rejected as the brokerage source. RO brokerage is read off the **referenced** policy (`ref_policy_id`) using `Policy.basic_brokerage_amount` (base brokerage). `total_brokerage_amount` (basic + terrorism/srcc/tc) was considered but dropped in favour of `basic` to stay consistent with the Our-portfolio policy table's Brokerage column. A prior quarterly aggregator exists (`getEstimatedBrokerageByQuarter`, opportunity-service) but scopes by activity/participant and excludes Won/Lost — **not reused**, since portfolio brokerage must reconcile with the portfolio's own RO set (owner-scope, Open/WIP/BD-Planning/Won).
- **Drill-down already exists:** `GET /opportunities/company/:companyId?type=SO|RO` (`getOpportunityByCompanyId`) returns paginated SO/RO rows incl. `refPolicy` → directly usable for the RO/SO drill-down lists (req 5).

### 5.2 Brokerage decision & shared-endpoint impact (IMPORTANT)

**Decision: brokerage is `basic_brokerage_amount` (base) everywhere. `total_brokerage_amount` is NOT used.**

Reasoning — the `total` vs `basic` choice cannot be made per-screen without care, because the policy-listing transform is shared:

- **`transformPoliciesResponse`** (policy-service) is the single function that builds each policy row (premium, brokerage, etc.). It is called by **three** methods, each feeding different screens:

    | Method | Endpoint | Screen(s) | Shows brokerage? |
    |---|---|---|---|
    | `getPoliciesByCompanyId` | `GET /policy/company/:id` | "Our portfolio" (Company Details) + Client Portfolio drill-down (`CompanyPolicies`) | Our portfolio: yes; drill-down: no column |
    | `getPoliciesByContactId` | `GET /policy/.../contact` | Contact Details "Our portfolio" | yes (shares `PolicyList` default columns) |
    | `getPoliciesByOpportunityId` | `GET /policy/opportunity/:id` | opportunity's policies (no active iwork UI found) | — |

- Because the brokerage field lives in that shared transform, switching it to `total` would silently change **Contact Details** (and any opportunity view) too. To avoid that leak, brokerage was kept **basic** in the transform.
- For consistency, the **listing** page's RO brokerage (`aggregateActiveCompaniesByPolicies` → `refBrokerageMap`, a separate code path) also reads the ref policy's **`basic_brokerage_amount`**, not total. Listing column header is **"Brokerage"** (not "Total brokerage").
- The other added fields — `insurerCompany`, `tpa` (in the shared transform) and `claimAmount` (scoped to `getPoliciesByCompanyId` only) — are **additive**: they resolve to `null`/absent where the relations aren't loaded, so the other two consumers are unaffected.

**Net:** no brokerage semantic change leaks to any screen outside My Client Portfolio and the two "Our portfolio" tables; all brokerage figures are base brokerage.

## 6. Backend design (policy-service)

Extend `aggregateActiveCompaniesByPolicies`:
1. **Policy pass** (exists) → `{policyCount, policyPremium}` per company.
2. **RO pass** (new) → active RO opportunities for in-scope companies → `{roCount, roPremium}`; resolve `ref_policy_no` → policy for premium (inception + endorsement).
3. **Union** company set (`policyCount>0 OR roCount>0`); group, sort, paginate over the union (in memory, as today).
4. Row shape adds `policyCount, policyPremium, roCount, roPremium` (drop old policy/count fields).
5. Reuse `validateOpportunityScope`, `mapSearchParams`, `mapSortParams`; TypeORM only.

**Params (additions):**
- `pastCompanies=true` → expired-policy mode (`policyTo < today`), RO pass off.
- insurer-branch filter param → sub-query on `policy_insurer_map` → insurer branch/address.

## 7. Frontend design (iwork)

- **Columns:** swap to Policy Premium / RO Premium via `soRoPremiumCell`; keep priority/claim/service/actions.
- **Past Companies:** button/link setting the `pastCompanies` flag on the query.
- **Insurer branch:** new select filter (concat label) in the filter panel.
- **Drill-down:** add an RO list table component; row → policy detail via `ref_policy_no`.

## 8. Business rules

- Visibility per FR-2.
- RO premium per §5 (inception + endorsement).
- "Active" = status + not expired; "Past" = status + expired.

## 9. Open questions / assumptions

1. ~~Policy filters also constrain RO?~~ **Resolved: Yes** — via the RO's referenced policy.
2. ~~RO premium definition~~ **Resolved (a):** RO premium = referenced policy's `premiumAtInception` + sum of that policy's `Endorsement` premiums.
6. ~~Active RO/SO status~~ **Resolved:** active = `OPPORTUNITY_STATUS_OPEN` + `OPPORTUNITY_STATUS_WORK_IN_PROGRESS`.
7. ~~SO premium~~ **Resolved:** `SUM(opportunity.premiumPaid)` (same as My Company).
8. **Live computation** of RO/SO: query the `Opportunity` entity from policy-service via `dataSource.getRepository(Opportunity)`. Decided.
3. ~~Does any filter apply to SO?~~ **Resolved: No** — SO is display-only (premium/count column + drill-down list), unfiltered, and never affects visibility.
4. KPI cards: keep "Total companies / Total policies", or also add RO/SO totals? — **TBD**.
5. ~~Past Companies rule~~ **Resolved:** purely companies with EXPIRED policies (`policyTo < today`); RO/SO buckets are off in this view.

## 10. Acceptance criteria

- Companies with only an active RO (no active policy) appear; SO-only companies do not.
- Policy, RO and SO Premium columns show premium + count; old Policy/Count columns gone.
- Brokerage column shows SUM of ref-policy `basic_brokerage_amount` over the active RO set; Q1–Q4 bifurcate it by RO `expiry_date` and sum back to the brokerage total.
- Policy Premium, SO Premium and Claim amount are hidden by default (toggleable); the default hidden set is enforced in frontend column config, the system-default seed, and existing `filter_preference` rows.
- RO Premium includes endorsement premium; premium calcs match the existing KPI/My Company logic.
- "Past Companies" lists companies with expired policies only.
- Insurer-branch filter narrows results; option label is the concat string.
- Drill-down shows an RO list (rows open the referenced policy) and an SO list, both restricted to active (`OPEN`+`WIP`) opportunities so they match the RO/SO counts.
- Existing Manage Policies behavior unaffected; no raw SQL; common methods reused.

## 11. Constraints

Minimal code changes; do not break existing functionality; reuse common sort/filter/search utilities and common UI components; TypeORM (not raw queries).
