# IBP HR Portal — HR Analytics Module PRD

**Document Version:** 2.1
**Date:** 2026-05-04
**Author:** IIRM Product Team
**Jira Reference:** IIRM-9479
**Framework Reference:** `../hr-module-report-framework-tech-spec.md`
**SDS Reference:** `./hr-analytics-sds.md`
**TRD Reference:** `./hr-analytics-trd.md`

> **Document split.** This PRD owns *what the module must do and why* — business outcomes, scope, KPI semantics and formulas, business rules, YoY math and suppression rules, export contract, NFRs, user stories, and acceptance criteria. The SDS owns *how it looks and behaves on screen* — routes, section inventory, screen layouts, data field placement, visual styling, threshold-driven visual treatment, empty/error states, and navigation. The TRD owns *how data is fetched* — report keys, SQL, response envelope.
>
> **Dependency rule.** Any update to the framework spec (API paths, export formats, response envelope) must be reflected in the TRD. Any new requirement here requires (a) a screen entry in the SDS and (b) a report-key entry in the TRD.

---

## 1. Module Overview

HR Analytics is the analytics and operational intelligence layer of the IBP HR Portal. It gives HR administrators a single, coherent view of everything happening across their company's insurance policies — from premium flows and enrollment health to live claims, hospital network utilisation, and member demographics.

This module replaces five independently-scoped feature documents (Dashboard, Policy Drilldown, Enrollment, Claims, Hospital Network) with one unified spec. All five areas share a common data API (the HR Report Framework), common global context controls (policy and period), and a unified navigation model. They are delivered together as HR Analytics.

**Business outcomes this module delivers:**

1. A single surface that gives HR decision-makers an at-a-glance view of policy, claims, and member health.
2. Drill-down capability from summary to individual policy, employee, claim, and hospital level.
3. Operational views for enrollment management and claims tracking that reduce dependence on TPA portals.
4. Hospital network intelligence for informed empanelment decisions.
5. Exportable reports for finance, management, and compliance.

---

## 2. Scope

**In scope:**

- HR Dashboard (main analytics landing surface)
- Policy Drilldown (single-policy deep dive)
- Enrollment Module (enrollment list, employee detail, endorsements, member analytics)
- Claims Module (all claims, active pipeline, insights, claim procedure guide)
- Hospital Network (directory, claims, performance, agreements)
- Export functionality per section
- Year-over-Year (YoY) analytics across all data-driven KPI metrics, trends, and ranked reports
- HR Portal Reports page (4 live reports: claims history, endorsement, enrollment, premium; backend CSV download via `POST /hr-module/download/:reportKey`; 11 further report cards shown as "Coming soon")

**Out of scope:**

- Employee self-service portal (separate app)
- TPA portal integration beyond data display
- Custom widget creation by end users
- Intimate Claim tab (pending clarification — excluded from current build)
- Hospital detail drilldown page (separate future scope)

---

## 3. User Persona

**Primary:** HR Admin

The HR Admin is responsible for their company's group insurance policy management. They spend time across three concerns:

1. **Monitoring** — Are premiums correct? Are employees enrolled? Are claims being processed?
2. **Operating** — Who needs endorsements? Which claims are stuck? Which employees haven't logged in?
3. **Reporting** — Finance wants claim utilisation. Management wants risk summary. Compliance needs audit data.

HR Analytics serves all three concerns from one module.

---

## 4. Global Context Controls

One control applies globally across HR Analytics. Its placement and visual design are owned by the SDS; its semantics are defined here.

| Control | Options | Default | Scope |
|---|---|---|---|
| **Policy selector** | Individual policy / GMC / GPA / GTL / All Policies | First active policy (GMC) | All data-driven sections on the current page |

Changing the policy selector reloads all data-driven content on the page simultaneously. All data is scoped to active policies by default — there is no policy period selection; the system uses the active policy period automatically.

Global context does **not** apply to:

- Claim Procedure view (static content, no data dependency)
- HR Dashboard welcome and header elements (informational only)

---

## 4A. Year-over-Year Analytics

Year-over-Year (YoY) analysis is a first-class business feature of HR Analytics. It is enabled by default across all data-driven KPI metrics, trends, and ranked-list views. The HR Admin can disable the prior-year comparison at any time.

> Visual treatment of YoY indicators (styling, overlay conventions, rank-change presentation) is owned by the SDS. This section owns *when YoY applies*, the *math*, the *suppression rules*, and the *export contract*.

### 4A.1 Why YoY

Group insurance decisions — premium renewals, claims cost projections, hospital network reviews — are meaningless without a reference year. An HR Admin looking at ₹38.5L in claims this year needs to know whether that is an improvement or deterioration relative to last year before deciding whether to raise, lower, or renegotiate the policy premium. YoY is the primary comparison frame for all operational metrics in this domain.

### 4A.2 YoY Toggle Semantics

| Property | Detail |
|---|---|
| Default state | **On** — prior-year data is included by default |
| Scope | Applies to all data-driven content on the current page |
| Persistence | Per-session; resets to On on page reload |
| Behaviour | Toggling off hides prior-year comparisons from view without reloading data |

### 4A.3 Prior-Year Window

The prior-year window is derived automatically from the active policy's start and end dates: `policyPeriodStart − 1 year` to `policyPeriodEnd − 1 year`. No date range input is required from the user — the server computes the prior window from the active policy record.

**Example:** If the active policy runs 01 Apr 2025 – 31 Mar 2026, the prior-year window is 01 Apr 2024 – 31 Mar 2025.

**Suppression when prior window has no data:** If the company has no policy records within the derived prior window (e.g., the active policy is the company's first policy year), YoY comparisons are suppressed per §4A.4. The server must verify actual data availability — the absence of prior-window records cannot be reliably inferred from dates alone.

### 4A.4 KPI Metric YoY — Math & Suppression

For every KPI carrying a numeric aggregate, the system computes:

```
yoyChangePct = (current − prior) / prior × 100
```

| Condition | Behaviour |
|---|---|
| Current > Prior year | Show positive-growth indicator with `yoyChangePct` |
| Current < Prior year | Show decline indicator with `yoyChangePct` |
| Current = Prior year | Show no-change indicator |
| Prior window has no records | **Suppress** indicator entirely — do not show "0%" or "—" |
| Prior window predates any policy data (first policy year) | **Suppress** indicator entirely |

The indicator always shows percentage change, not absolute change. The absolute prior-year value is available on demand (treatment owned by SDS).

### 4A.5 Trend Views — What is Compared

Trend views present prior-year data alongside current-year data. Both the current-year and prior-year series are independently togglable from within the view, independent of the global YoY toggle. Visual treatment is owned by the SDS.

### 4A.6 Ranked Lists — What is Compared

Ranked and top-N lists include per-entry prior-year context:

| Field | Meaning |
|---|---|
| Prior Year Amount | Amount or count for the same entity in the prior-year window |
| YoY Change % | `(current − prior) / prior × 100`, signed |
| Rank Change | Improved / Declined / New entrant (no prior-year rank) / Unchanged |

Visual styling is owned by the SDS.

### 4A.7 Sections Excluded from YoY

| Section | Reason for exclusion |
|---|---|
| Claim Procedure view | Static content — no data |
| Process Claim view (active pipeline) | Live operational state — prior-year pipeline is not meaningful |
| Employee Detail — Activity Log | Timestamped event log, not an annual aggregate |
| Hospital Agreements Registry | Contractual data, not annual aggregates |
| E-card view | Point-in-time document |
| Resigned Employees, Frequent Claimers (Employee Analytics) | Row-level operational data, not annual aggregates |

### 4A.8 Export Behaviour

When YoY is on, exported files include both current-year and prior-year data. Excel exports include the YoY Δ% values; PDF exports present summary-level data only and omit the Δ% values.

When YoY is off, exports include current-year data only.

---

## 5. Feature Area 1 — HR Dashboard

The HR Dashboard is the default landing surface after HR Portal login. It gives the HR Admin an at-a-glance view across premium flows, policies, claims, enrollment health, demographics, and ranked claim insights, filtered by the active policy type and reporting window.

Screen layout and section arrangement are owned by the SDS.

### 5.1 Header Filter Semantics

- **Policy Type filter** — All Policies / GMC / GTL / GPA. Applies to all data-driven content on the page. Data is shown for active policies; no policy period selection is available.

### 5.2 Widget — Premium Summary

Five KPI metrics summarising premium flows for the selected policy type and window.

| KPI | Definition |
|---|---|
| Inception Premium | Sum of premiums at policy start |
| Addition Premium | Sum of premiums for member additions in window |
| Deletion Premium | Sum of premium refunds for deletions in window |
| Top-Up Premium | Sum of top-up policy premiums (₹0 if none) |
| Total Premium | `Inception + Addition − Deletion + Top-Up` |

**YoY:** All 5 KPIs per §4A.4. Prior-year value is the corresponding premium for the same policy type across the prior policy year.

### 5.3 Widget — Policies & Sub-Components

One summary per policy matching the active policy type. Each card is divided into three panels: a policy header strip, an enrollment panel, and a claim ratio panel.

**Policy header fields:**

| Field | Definition |
|---|---|
| Policy Name | Display name |
| Status | Active / Inactive / Expired |
| Policy ID | Insurer policy number |
| TPA | TPA name |
| Insurer | Insurer name |
| Policy Period | Start – End |
| Annual Premium | Net premium for the policy |

**CD Balance (left panel):**

| Field | Definition |
|---|---|
| CD Balance | Current CD account balance |
| Total CD Deposit | Total deposited amount (denominator for the balance bar) |
| Safe Limit | Configured minimum safe balance threshold |
| Safe Limit Warning | Shown when current balance < safe limit — displays deficit top-up amount and a caution message "claims may be delayed" |

**Enrollment (right panel):**

| Field | Definition |
|---|---|
| Total Lives | Active members on the policy (employees + dependents) |
| Total Employees | Active employees on the policy |
| Total Dependents | Active dependents on the policy |
| Enrolled | Members with confirmed enrollment — count, percentage of total lives, and employee/dependent split |
| In Progress | Members with enrollment in progress — count, percentage of total lives, and employee/dependent split |
| Not Enrolled | Members not yet enrolled — count, percentage of total lives, and employee/dependent split |
| Pending Enrollment | Count of members with pending enrollment; enrollment window end date shown as a deadline alert |

**Enrollment percentages** are computed as `status_count / total_lives × 100`. The three status percentages are displayed independently; they need not sum to exactly 100% (rounding).

**Claim Ratio — ICR (bottom panel):**

| Field | Definition |
|---|---|
| ICR % | `Incurred Claims / Net Premium × 100` for the current policy period |
| Claim Count | Total claim count for the current period |
| YoY Change | `(ICR_current − ICR_prior) / ICR_prior × 100` — decrease is favourable (green indicator) |
| Full Year Avg (LY) | ICR %, claim count, and incurred amount across the prior full policy year |
| Same Period LY | ICR %, claim count, and incurred amount for the equivalent date window one year prior |
| Forecast — Next Year | Projected claim count, incurred amount, and ICR % for the forthcoming policy year (trend projection) |

**YoY:** ICR carries a YoY comparison per §4A.4, with direction inversion — a *decrease* in ICR is treated as an improvement (green). The comparison frames (Full Year Avg LY, Same Period LY) are shown inline within the ICR panel, independent of the global YoY toggle.

Each policy card provides access to its Policy Drilldown view.

### 5.4 Widget — Claims Analysis

Composite section combining KPIs and a monthly breakdown, backed by the same claims analysis data.

**KPIs (4):**

| KPI | Definition |
|---|---|
| Total Claims | Total claim amount and count |
| Paid Claims | Sum of paid/settled amounts |
| Pending Claims | Sum of outstanding amounts |
| Claim Ratio | `Incurred Claims / Earned Premium × 100` |

**Monthly Breakdown:**

- Per-month split by Cashless and Reimbursement.
- Sub-filters: Last 3 Months / Last 6 Months / Custom; Claim Type; Status; Member Type.

**YoY:** All 4 KPIs and the monthly breakdown are YoY-enabled per §4A.4 / §4A.5. Prior period is the same date window shifted back by one year, consistent with §4A.3.

### 5.5 Widget — Enrollment Status

Three KPIs summarising portal adoption.

| KPI | Definition |
|---|---|
| Logged In | Members who have logged into the portal at least once |
| Not Logged In | Members who have never logged in |
| Enrollment Confirmed | Members who have completed enrollment confirmation |

Each KPI shows count and percent of total eligible members. **YoY:** All 3 KPIs per §4A.4. The data anomaly `loggedIn > totalEligible` is capped at 100% for the percentage display; underlying counts are preserved.

### 5.6 Widget — Demographics Breakdown

Four KPIs showing member lifecycle distribution with employee/dependent split.

| KPI | Definition |
|---|---|
| Inception Members | Members present at policy inception |
| New Additions | Members added after policy start, within the window |
| Deletions | Members removed during the window |
| Total Active | All currently active members |

Each KPI exposes employee count, dependent count, and their respective percentages.

**YoY:** Total counts on Additions, Deletions, and Total Active carry YoY comparisons (§4A.4). Inception Members is point-in-time and does not carry a YoY comparison.

### 5.7 Widget — Top 10 Claim Insights

Three ranked top-10 lists by claim amount, one per dimension: Employees / Hospitals / Diseases. Only one dimension is active at a time; sub-filters (Claim Type, Status, Member Type) apply to the active dimension.

**YoY:** All three dimensions show prior-year amount and rank-change per entry (§4A.6). Entries present in the current top 10 but absent in the prior-year top 10 are marked as new entrants.

### 5.8 Dashboard Export

| Section | Formats |
|---|---|
| Policies & Sub-Components | Excel, PDF |
| Claims Analysis | Excel, PDF |
| Top 10 Insights | Excel |

---

## 6. Feature Area 2 — Policy Drilldown

The Policy Drilldown is a four-section deep-dive view for a single policy, accessed from a policy summary in the HR Dashboard. Section layout is owned by the SDS.

### 6.1 Page-Level Behaviour

- Authentication is required on all calls; company scoping is enforced server-side.
- The global KPI summary (§6.2) must resolve before any sub-section is accessible. Missing KPI values are treated as not available (see §10).

### 6.2 Global KPI Summary (always visible)

Nine KPIs summarising the policy at the top level.

| # | KPI | Definition |
|---|---|---|
| 1 | Total Lives | Employees + Dependents active on this policy |
| 2 | Sum Insured | Per-member sum insured |
| 3 | Net Premium | Net premium for the policy |
| 4 | Employees | Enrolled employees |
| 5 | Dependents | Enrolled dependents |
| 6 | Active Claims | Claims currently in progress |
| 7 | Claim Utilisation | `Claim Amount / Net Premium × 100` |
| 8 | Total Claims | Total claim amount |
| 9 | Avg Claim | `Total Claim Amount / Claim Count` |

**YoY:** KPIs 3, 6, 7, 8, 9 carry YoY comparisons (§4A.4). KPIs 1, 4, 5 carry YoY on headcount. KPI 2 (Sum Insured) is a contract value — YoY comparison shown only when the sum insured tier changed year-over-year.

### 6.3 Section — Overview

- **Policy Sub-Components** — per sub-component: name, employees enrolled, sum insured, monthly premium, claims count, status (Active/Inactive).
- **Enrollment Progress** — enrolled vs total eligible, with counts of Enrolled, Pending, and Dependents.
- **Claim Utilisation** — `Claim Amount / Net Premium × 100`, with supporting KPIs: Total Claims (₹), Avg Claim (₹), Outstanding (₹).
- **Monthly Claim Trend** — claims raised per month and claims settled per month, last 12 months default. **YoY** per §4A.5.
- **Top Hospitals Used** — top 5 hospitals on this policy by total claim amount, with claim count. **YoY** per §4A.6.
- **Disease Category Breakdown** — top 6 disease categories with percent share and claim count. **YoY** per §4A.5.

### 6.4 Section — Claims Analytics

**Filters (shared across this section):** Period (Last 3 Months / Last 6 Months / Last 12 Months / Custom); Claim Type (All / Cashless / Reimbursement); Status (All / Paid / Outstanding / Rejected / Closed / Denied); Reset.

**Analytics views:**

- **Claims Insights** — monthly claim amounts split by status. Metric modes: Amount / Count / Avg Claim. Excel/PDF export.
- **Claims by Month** — single monthly trend over the same window. Metric follows the Claims Insights selection.
- **Cashless vs Reimbursement** — claim split by type, with count.
- **Claims by Hospital** — top 10 hospitals; per hospital the Cashless/Reimbursement breakdown.
- **Claims by Employee** — searchable by employee name, claim number, hospital. Per claim: Claim No, Employee, Hospital, Claim Type, Claim Amount, Settled Amount, Status, TAT. TAT computed per §8.2; missing TAT and missing Settled Amount are treated as not available. Excel export.

### 6.5 Section — Member Analytics

- **Members by Age Group** — distribution split by Employees vs Dependents across age bands (15–25, 26–35, 36–45, 46–55, 56–65, 65+).
- **Gender Distribution** — Male / Female counts.
- **Employees vs Dependents** — counts of each.
- **Department-wise Enrollment** — per department, ratio of enrolled to total eligible.
- **Member List** — searchable by name, employee ID, department. Per member: Employee ID, Name, Department, Sum Insured, Dependents, Claims count, Total Claim Amount. Excel export.

### 6.6 Section — Financial Insights

**KPIs (4):**

| KPI | Definition |
|---|---|
| Total Premium | Net premium for this policy |
| Total Claim Paid | Total settled + paid claims (YTD) |
| Outstanding Claims | Sum of pending/outstanding claims |
| Loss Ratio | `Total Claim Paid / Total Premium × 100` |

When Loss Ratio exceeds 100%, the system treats this as an at-risk condition. Visual treatment is owned by the SDS.

**Analytics views:**

- **Premium vs Claim Trend** — monthly premium and monthly claim amount, last 12 months default. **YoY** per §4A.5.
- **Policy Utilisation** — percent of sum insured utilised this policy year. **YoY** per §4A.5.
- **Financial Summary** — six metrics: Policy Premium · Claim Paid (YTD) · Outstanding Claims · Loss Ratio % · Admin Charges · Net Liability, where `Net Liability = Paid + Outstanding + Admin Charges`. Excel/PDF export. When YoY is on, prior-year values and YoY Δ% are included.

**YoY (section-level):** All 4 KPIs carry YoY comparisons per §4A.4.

### 6.7 Policy Drilldown Export

| Section | Formats |
|---|---|
| Full page (header export) | Excel (multi-sheet), PDF |
| Claims Insights | Excel, PDF |
| Claims by Employee | Excel |
| Member List | Excel |
| Financial Summary | Excel, PDF |

---

## 7. Feature Area 3 — Enrollment Module

The Enrollment Module is the operational surface for enrollment management. It comprises an Enrollment view, an Endorsement view, and an Employee Analytics view. Layout and section structure are owned by the SDS.

### 7.1 Section — Enrollment

**KPIs (6):**

| KPI | Definition |
|---|---|
| Total Lives | Employees + Dependents (with active/inactive split) |
| Employees | Employee count (active/inactive split) |
| Dependents | Dependent count |
| Total Addition | Inception + Endorsement additions in window |
| Total Deletion | Resigned / Inactive count in window |
| Total Enrolled | Active enrollments |

**YoY:** All 6 KPIs carry YoY comparisons per §4A.4. Total Addition and Total Deletion reflect endorsement activity within the prior-year window.

**Search:** Employee #, Name, Email, Phone — matched against active enrollment records on this policy/period.

**Filter capabilities:** Member Type · Status (Active/Inactive) · Enrollment Status · Gender · Addition Type. All filters apply cumulatively with search. Reset clears section-level filters only; global policy and period selections are unchanged.

**Per-employee actions:** See Details · Add Favourite · Move to Trash.

> **Spec relocation note:** "Reset Password" and "Extend Enrollment Window" have been moved to the [Employee Support module](../employee-support/employee-support-PRD.md). Those actions are now owned, specified, and implemented under Employee Support. The enrollment listing table (`HRPortalEnrolmentV2` at `/hr-portal/enrollment`) is the visual reference pattern for the Employee Support page — the column structure, action menu, and filter bar in that component should inform the Employee Support implementation.

**Export:** Enrollment is the only module supporting Word and CSV exports. Supported formats: PDF, CSV, Excel, Word.

### 7.2 Employee Detail View

A focused per-employee view accessed from "See Details" on an enrollment record.

- **Identity & status** — full name, Employee ID, enrollment status, Active/Inactive status.
- **Journey progression** — six stages: Application → Document → HR Verification → Insurer Approval → E-Card → Coverage Active.
- **Summary metrics** — Total enrolled policies, Total sum insured, Available balance.
- **Sections (5):**
  1. **Employee Details** — Full name, Employee ID, DOB, Age, Gender, Department, Location, Joining Date, Email, Phone, E-Card No, Addition Type.
  2. **Insurance & Policy Details** — Policy name/status, Enrollment status, Sum insured, Effective/expiry date, Last activity.
  3. **Dependents/Beneficiaries** — Per dependent: Name, Relation, Age, Coverage.
  4. **Claims History** — Per claim: Policy number, Hospital, Claim type, Date, Claimed amount, Settled amount, Status. Total claimed shown.
  5. **Activity Log** — Action entries with date/time and actor/source.

### 7.3 Section — Endorsement

> **Spec moved.** The full Endorsement tab product spec — overview KPIs, cumulative employee/lives metrics, premium component breakdown, individual endorsement listing, and member data upload capability — has been consolidated into the Inception/Endorsement module documents:
>
> - **PRD:** `../inception-endorsement/hr-portal-inception-endorsement-prd.md` (§3 Feature Area 1 and §4–§5 Feature Areas 2–3)
> - **SDS:** `../inception-endorsement/hr-portal-inception-endorsement-sds.md` (§4–§8)
> - **TRD:** `../inception-endorsement/hr-portal-inception-endorsement-trd.md`
>
> Do not add new Endorsement tab requirements to this file. All changes belong in the inception-endorsement documents above.

### 7.4 Section — Employee Analytics

Six analytic views:

| View | Output |
|---|---|
| Claims by Tenure | Claim count/amount by tenure bucket (0–1yr, 1–2yr, 2–5yr, 5–10yr, 10+yr) |
| Claims by Relation | Claim distribution across Employee / Spouse / Parent / Child / Other |
| Claims by Age Band | Claim count/amount by age band (20–30, 31–40, 41–50, 51–60, 60+) |
| High Claim Employees | Ranked — Employee, Department, City, Age, Claim Count, Total Spent |
| Resigned Employees | Employee, Last Day, Tenure, Claims, Diseases, Amount |
| Frequent Claimers | Employee, Age, Tenure, Claim Count, Diseases, Total |

**Shared controls (all 6 views):** By Count / By Amount metric mode · Department filter · City filter.

**YoY:**

- Claims by Tenure, Claims by Relation, Claims by Age Band — YoY per §4A.5.
- High Claim Employees — YoY per §4A.6 (prior-year total spent and rank change per entry).
- Resigned Employees, Frequent Claimers — excluded from YoY (per §4A.7; operational data).

---

## 8. Feature Area 4 — Claims Module

The Claims Module surfaces all claims activity for the selected policy and period. It comprises an All Claims view, a Process Claim live-pipeline view, an Insights analytics view, and a static Claim Procedure view. Layout is owned by the SDS.

### 8.1 Section — All Claims

**KPIs (6):** Total Claims · Paid · Outstanding · Rejected · Closed · Denied. Each is a count for the selected policy and period.

**YoY:** All 6 KPIs per §4A.4.

**Search:** Employee Name / Claim Number.

**Filter capabilities:** Year (All Years / specific policy year) · Claim Status (All / Paid / Outstanding / Rejected / Closed / Denied) · Claim Type (All / Cashless / Reimbursement). All filters apply cumulatively with search.

**Per-claim data:** Claim Number, Employee ID, Employee Name with department, Relation, TPA ID, Claim Type, Claim Date, Claim Amount, Settled Amount, Status, TAT/Aging.

### 8.2 TAT / Aging Computation Rule

| Claim state | TAT |
|---|---|
| Closed / Paid | Days from claim date to settlement/closure date |
| Open | Days from claim date to today |

Display conventions are owned by the SDS.

### 8.3 Section — Process Claim

Live operational view of claims currently in the active processing pipeline. Excludes terminal statuses (Paid, Settled, Rejected, Denied, Closed).

**KPIs (5):** Total In Process · Under Review · Medical Assessment · Approval Pending · Settlement.

The five KPIs sum to Total In Process (§14 acceptance criterion).

**Refresh:** A user-driven refresh reloads both the KPI summary and the claim list. Data reflects a point-in-time snapshot; a manual refresh is required to see the current pipeline state.

**Search:** Employee Name / Claim Number / Hospital.

**Filter capabilities:** Stage · Claim Type.

**Per-claim data:** Claim No, Employee, Hospital, Diagnosis, Claim Type, Amount, Stage, Assigned To, Submitted Date, Last Updated, Pending Document count.

**Pipeline stages (in order):** Documents Submitted → Under Review → Medical Assessment → Approval Pending → Settlement.

**Footer total:** Total ₹ value across all claims currently in the pipeline.

**No export.** This is live operational state — exports are not applicable.

**YoY:** Excluded entirely (per §4A.7).

### 8.4 Section — Insights

**KPIs (4):**

| KPI | Definition |
|---|---|
| Total Claims | Claim count |
| Total Amount | Total claim ₹ |
| Avg Claim Amount | `Total Amount / Total Claims` |
| Approval Rate | `(Settled + Approved) / Total Claims × 100` |

**YoY:** All 4 KPIs per §4A.4.

**Analytic views (5):**

| View | Dimension |
|---|---|
| Claims Trend | Monthly Cashless vs Reimbursement; filterable by FY |
| Claims by Hospital | Top hospitals; By Count / By Amount metric mode |
| Claims by City | City distribution; filterable by All / Cashless / Reimbursement |
| Claims by Amount Band | Bands: <₹50K / ₹50K–₹2L / ₹2L–₹5L / >₹5L; By Count / By Amount metric mode |
| Claims by Department | Department distribution with count and percent share |

Each view provides access to the All Claims section. Hospital and Department views carry the relevant filter into the All Claims context.

**YoY:**

- Claims Trend — per §4A.5 (prior-year Cashless and Reimbursement series).
- Claims by Hospital — per §4A.6 (prior-year amount and rank change per hospital).
- Claims by City, Claims by Amount Band — per §4A.5.
- Claims by Department — prior-year count available on demand per §4A.5.

### 8.5 Section — Claim Procedure (Static)

Entirely static reference content. No data dependencies. No dependence on the global policy/period controls.

**Modes:** Cashless and Reimbursement. The same content categories appear under each mode:

- 7-step process walkthrough
- Helpline numbers
- Downloadable forms (Cashless Claim Form, Reimbursement Claim Form, Pre-Auth Request Form, Grievance Redressal Form)
- Policy coverage notes
- Escalation contact
- Document checklist — items required per claim type
- Expected approval timeline

**Claims Status Meaning Table (same in both modes):**

| Status | Meaning |
|---|---|
| Submitted | Documents received by TPA |
| Under Review | TPA verifying docs and eligibility |
| Query Raised | Additional info required |
| Approved | Full amount approved |
| Partial Approval | Part of claim approved |
| Rejected | Claim denied |
| Settled | Payment released |

**YoY:** Excluded entirely (per §4A.7).

### 8.6 Claims Module Export

| Section | Formats |
|---|---|
| All Claims | Excel, PDF |
| Insights views | Excel (per view) |

CSV and Word are **not** supported for the Claims module.

---

## 9. Feature Area 5 — Hospital Network

The Hospital Network module surfaces the empanelled hospital network — directory, claims by hospital, performance, and agreements. Layout is owned by the SDS.

### 9.1 Section — Network Hospitals

**KPIs (4):**

| KPI | Definition |
|---|---|
| Total Network Hospitals | Count of empanelled hospitals, with city count |
| Hospitals Used This Year | Count of hospitals with at least one claim in window; network utilisation % = used / total × 100 |
| Top Claim Hospital | Highest claim-amount hospital in window, with claim count and total amount |
| Avg Claim per Hospital | `Total Claim Amount / Hospitals Used This Year` |

**YoY:** KPIs 2, 3 (amount), and 4 carry YoY per §4A.4. KPI 1 carries a YoY comparison only when the empanelment count changed.

**Hospital Directory — per hospital:** Name (with type), city (with state), specialities, cashless capability (Yes/No), Total Claims count, Total Amount, Avg Claim, Status (Active/Inactive).

**Search:** Hospital name / city. **Filters:** Cities · Specialties · Status · Cashless.

### 9.2 Section — Claims by Hospital

Top 6 hospitals by total claim amount in the window. Per hospital: rank, name, city, total claims count, total amount, top disease.

**YoY:** Per-hospital prior-year amount and rank change per §4A.6. New entrants are identified.

Hospital-level drill-down is future scope and out of scope for this PRD.

### 9.3 Section — Performance

**KPIs (4):**

| KPI | Definition |
|---|---|
| Avg Approval Rate | Average approval rate across all network hospitals |
| Avg Settlement Time | Average end-to-end claim settlement time (days) |
| Total Complaints | Sum of complaint counts across hospitals, with count of high-risk hospitals (Risk Level High per §9.3.1) |
| High Risk Hospitals | Count of hospitals at Risk Level High (per §9.3.1) |

**YoY:** All 4 KPIs per §4A.4. For Avg Approval Rate and Avg Settlement Time, an improvement in the metric (Approval Rate up; Settlement Time down) is treated as a positive YoY direction.

**Per-hospital performance data:** Hospital, City, Approval Rate, Rejection Rate, Avg Settlement Time, Complaints count, Risk Level.

#### 9.3.1 Risk Level Classification

Risk Level is a derived business classification used across the Hospital Network module. It is computed per hospital from claim performance data.

| Level | Criteria |
|---|---|
| Low | Approval ≥ 90% **AND** Rejection ≤ 10% **AND** Avg Settlement ≤ 6 days |
| Medium | Approval 85–89% **OR** Rejection 11–15% **OR** Avg Settlement 6–8 days |
| High | Approval < 85% **OR** Rejection > 15% **OR** Avg Settlement > 8 days |

Visual treatment of at-risk thresholds is owned by the SDS.

### 9.4 Section — Agreements

**KPIs (4):**

| KPI | Definition |
|---|---|
| Total Agreements | Count of active empanelment contracts |
| Expiring in 60 Days | Count of agreements whose end date is within 60 days of today |
| Cashless Enabled | Count of hospitals with cashless settlement enabled |
| Cities Covered | Count of distinct cities across the agreement set |

The 60-day window is the business definition that drives the "Expiring in 60 Days" KPI. Visual treatment of at-risk expiry dates is owned by the SDS.

**Agreement Registry — per agreement:** Hospital name, agreement start date, agreement end date, contact person, phone, email, downloadable agreement document.

**YoY:** Excluded — agreements are contractual data, not annual aggregates (per §4A.7).

### 9.5 Hospital Network Export

| Section | Formats |
|---|---|
| Hospital Directory | Excel, PDF |
| Claims by Hospital | Excel |
| Performance Overview | Excel, PDF |
| Agreement Registry | Excel, PDF |

---

## 9A. Feature Area 6 — HR Portal Reports

### 9A.1 Overview

The HR Portal Reports page (`/hr-portal/reports`) provides HR Admins with downloadable, tabular data exports covering claims, endorsements, enrollment, and premium data. It surfaces 15 report cards grouped by category (Endorsement, Employees, Claims, Finance, Communication). Four cards are live and expandable; eleven cards are disabled ("Coming soon") and rendered at 50% opacity with a "Coming soon" badge in place of the expand chevron. Disabled cards cannot be clicked. Export triggers a backend download (`POST /hr-module/download/:reportKey`) which returns a full-column CSV covering all columns returned by the underlying SQL query — not just the UI-visible subset.

### 9A.2 Report Cards

**Live report cards (4):**

| Report Name | Report Key | Category | Scope | Filters Available |
|---|---|---|---|---|
| Claims History | `policy_claim_history` | Claims | Per policy (required) | Policy (required), Claim Type, Status |
| Endorsement Report | `endorsement_list` | Endorsement | Company-wide | None |
| Enrollment Report | `ibp_hr_employee_listing` | Employees | Company-wide | Enrollment Status |
| Premium Report | `company_policy_details_summary` | Finance | Company-wide | None |

**Disabled report cards (11 — "Coming soon"):** Demography, Employee Diff, Login Credential, Cashless TAT, Reimbursement TAT, DNR, Enrollment Communication, Life Events, Midterm Addition, Midterm Deletion, Endorsement Status Tracker. These cards are rendered but non-interactive until their backend SQL is registered and a `reportKey` is wired in the frontend.

### 9A.3 Filters

**Claims History filters:**

| Filter | Values | Default | Behaviour |
|---|---|---|---|
| Policy | Dropdown from `dashboard_policy_cards` | — (prompt) | Required — report does not load until a policy is selected |
| Claim Type | Cashless / Reimbursement / All | All | Passed as `claimType` param |
| Status | Pending / Settled / Repudiated / All | All | Passed as `claimStatus` param |

**Enrollment Report filters:**

| Filter | Values | Default | Behaviour |
|---|---|---|---|
| Enrollment Status | All / Enrolled / Not Started / In Progress | All | Mapped to `enrollStatus` param; `""` = all |

**Endorsement Report filters:** None — scoped to `companyId` automatically.

**Premium Report filters:** None — scoped to `companyId` automatically.

### 9A.4 Export

Export is triggered via the backend download API: `POST /hr-module/download/:reportKey` with the same param body used for the generate call. The backend runs the full SQL query (no pagination), converts all result columns to CSV, and streams the file with `Content-Disposition: attachment; filename=<reportKey>.csv`. All columns returned by the SQL are included — not just the subset shown in the UI table. The frontend uses `responseType: blob` via `apiRequest` and triggers the browser save-file dialog. Date columns for claims and enrollment are ISO timestamps formatted server-side or client-side; endorsement date columns (`enrollmentStartDate`, `enrollmentEndDate`) are pre-formatted by the SQL layer as `DD/MM/YYYY` strings and passed through as-is.

### 9A.5 Business Rules

- Policy dropdown shows `policyName (policyNumber)` to distinguish same-name policies across different years.
- Claims History requires a policy selection; the table remains empty and the Export button is disabled until a policy is chosen.
- Endorsement date fields (`enrollmentStartDate`, `enrollmentEndDate`) are pre-formatted as `DD/MM/YYYY` by the SQL layer (`TO_CHAR`); the frontend renders them as-is with no further transformation.
- Claim dates (`claimDate`) are ISO timestamps formatted client-side as `DD Mon YYYY` for table display.
- Monetary values are displayed with `₹` prefix, right-aligned.
- The Enrollment Report requires all six SQL params: `companyId`, `search`, `gender`, `enrollStatus`, `limit`, `offset`. Empty string defaults are passed for optional params so no SQL placeholder is left unsubstituted.
- Cards without a `reportKey` are rendered at 50% opacity with `pointer-events: none` and a "Coming soon" pill badge — they cannot be expanded or exported.
- The Export button is grey and non-clickable when `hasRealData` is false (no companyId, no policy selected for claims, or no reportKey).

### 9A.6 Data Edge Behaviour

| Scenario | Rule |
|---|---|
| No policy selected (Claims History) | Empty table with prompt to select a policy |
| Policy has no claims in selected filters | Empty state — no rows, no error |
| Company has no endorsements | Empty state — no rows |
| Claim date is null | Displayed as `—` in table and CSV |

---

## 10. Data Edge Behaviour

These rules govern how the system handles data edges. Presentation of empty, error, and loading states is owned by the SDS.

| Scenario | Rule |
|---|---|
| Missing claim financial values | Value is treated as not available — distinguished from a genuine zero |
| `loggedIn > totalEligible` (data anomaly) | Percentage is capped at 100; underlying counts are preserved |
| No prior-period data | YoY comparisons return null; indicators are suppressed — do not show as "0%" or absent value (see §4A.4) |
| Hospital with no claims in window | Total Claims = 0, Avg Claim = 0; hospital remains in the directory |
| Employee with no dependents | Dependent count = 0; dependent section is empty |
| No hospitals empanelled | System informs the user that no empanelled hospitals are available |
| Missing E-Card | E-Card access is unavailable for that employee |
| RBAC failure | User is denied access with a 403 response |
| Partial export failure | No partial file is delivered; an error is communicated to the user |

---

## 11. Export Functionality Summary

| Feature Area | Sections | Formats |
|---|---|---|
| HR Dashboard | Policy Overview, Claims Analysis, Top 10 | Excel, PDF |
| Policy Drilldown | Full page, Claims Insights, Claims by Employee, Member List, Financial Summary | Excel, PDF |
| Enrollment | Employee list | PDF, CSV, Excel, Word |
| Claims | All Claims, Insights views | Excel, PDF |
| Hospital Network | All 4 sections | Excel, PDF |
| HR Portal Reports | Claims History, Endorsement Report, Enrollment Report, Premium Report | CSV (backend API — all DB columns) |

**Framework export contract:** All exports use `POST /hr/report/download/:reportKey?format=excel|pdf|csv|word` with the same filter body as the generate call. No format conversions in the frontend.

**HR Portal Reports export exception:** HR Portal Reports use `POST /hr-module/download/:reportKey` (no `format` query param; always CSV). The backend converts all result rows to CSV via `convertToCsv()` and streams the file directly. All database columns are included.

YoY export rule: see §4A.8.

---

## 12. Non-Functional Requirements

| Requirement | Target |
|---|---|
| HR Dashboard initial load | < 2 seconds (typical dataset) |
| Policy Drilldown initial load (Global KPI Summary + Overview) | < 2 seconds |
| Section switch (first load) | < 1 second |
| Data load (up to 1,000 records) | < 2 seconds |
| Export file generation | < 5 seconds |
| Availability | 99.9% |
| Authentication | JWT on all report-service calls |
| Accessibility | Keyboard-navigable analytics, ARIA labels, sufficient colour contrast |
| Responsiveness | Desktop + tablet |

---

## 13. User Stories

| # | Story |
|---|---|
| US-01 | As an HR Admin, I can see a consolidated summary of premium flows, claims, enrollment health, and demographics across all my policies in one place, so I can monitor overall insurance health without switching between multiple tools. |
| US-02 | As an HR Admin, I can access a detailed analytics view for any individual policy across financial, claims, enrollment, and member dimensions, so I can understand the full performance of each policy. |
| US-03 | As an HR Admin, I can see which sub-plans my policy has and how many members are on each, so I can manage plan composition and allocation. |
| US-04 | As an HR Admin, I can track claim utilisation, monthly claim trends, and financial metrics for any policy, so I can make informed decisions at renewal time. |
| US-05 | As an HR Admin, I can view enrollment progress and identify pending enrollment by department, so I can follow up with employees who have not completed enrollment. |
| US-06 | As an HR Admin, I can search, filter, and export the full employee enrollment list, so I can manage and share enrollment status with my HR team. |
| US-07 | As an HR Admin, I can access a complete profile for any individual employee — covering dependents, policy details, claims history, and activity — so I can resolve employee-specific issues without contacting the insurer. |
| US-08 | As an HR Admin, I can view all claims with their current status, processing time, and financial details, so I can track claim progress and identify stalled cases. |
| US-09 | As an HR Admin, I can see all claims currently in the active processing pipeline with their stage, so I can identify and follow up on claims that are delayed. |
| US-10 | As an HR Admin, I can view claim analytics broken down by hospital, city, amount band, and department, so I can identify cost patterns and take proactive action. |
| US-11 | As an HR Admin, I can access a reference guide for cashless and reimbursement claim procedures, so I can advise employees on the correct process without consulting external documentation. |
| US-12 | As an HR Admin, I can see all empanelled hospitals with their specialties, cashless capability, and claim volumes, so I can direct employees to appropriate network hospitals. |
| US-13 | As an HR Admin, I can assess hospital performance by approval rate, settlement time, and risk level, so I can raise concerns about underperforming hospitals with the TPA or insurer. |
| US-14 | As an HR Admin, I can view all empanelment agreements and identify which ones are expiring within the next 60 days, so I can initiate renewals before coverage lapses. |
| US-15 | As an HR Admin, I can export any section as Excel or PDF, so I can share accurate data with finance, management, or compliance teams. |
| US-16 | As an HR Admin, I can change the active policy or financial year and have all analytics data refresh to reflect the new context simultaneously. |
| US-17 | As an HR Admin, I can see year-over-year comparisons on every key metric so I can immediately tell whether a metric is improving or deteriorating relative to the prior policy year. |
| US-18 | As an HR Admin, I can compare current-year patterns against the same period in the prior year across all trend views, so I can identify seasonal or structural shifts in claims and enrollment. |
| US-19 | As an HR Admin, I can see which hospitals, employees, and diseases have risen or fallen in claim impact compared to the prior year, so I can focus action on emerging risk areas. |
| US-20 | As an HR Admin, I can choose to view current-year data only, without prior-year comparisons, when I want a focused view of present-period performance. |
| US-21 | As an HR Admin, I can export any section with prior-year data included, so I can share a complete year-over-year comparison with finance and management. |
| US-22 | As an HR Admin, I can view the full claim transaction history for any selected policy as a searchable, filterable table, so I can review individual claim records without accessing the TPA portal. |
| US-23 | As an HR Admin, I can export the claims history or endorsement report as a CSV file, so I can share raw data with finance or compliance teams for offline analysis. |

---

## 14. Acceptance Criteria

HR Analytics is accepted for release when all of the following hold:

1. **HR Dashboard** loads with all metric sections populated; policy type changes refresh all data simultaneously.
2. **Policy Drilldown** global KPI summary resolves before any sub-section is accessible; all 4 sections load their data on first access.
3. **Enrollment** supports search, filter, reset, employee detail access, and e-card access as defined; reset does not affect global policy/period selection.
4. **Enrollment** employee detail shows all 5 data sections with correct content from their respective report keys.
5. **Claims** All Claims section shows 6 KPIs and full claim data; Process Claim shows the active pipeline with stage breakdown; Insights shows 4 KPIs and 5 analytic views.
6. **Claims** Procedure section operates without any data dependencies and renders correctly in both Cashless and Reimbursement modes.
7. **Hospital Network** all 4 sections load correctly; Risk Levels compute from claim data per §9.3.1; Expiring in 60 Days KPI applies the 60-day threshold correctly.
8. **Export** works for all sections; CSV/Word available for Enrollment only; PDF/Excel for all others; Claims module enforces no CSV/Word.
9. **Framework compliance** — all data loads exclusively through `POST /hr/report/generate/:report` and `POST /hr/report/download/:report`. No custom controller endpoints.
10. **Data consistency** — KPI totals reconcile with corresponding data: Process Claim 5 KPIs sum to Total In Process; Hospital Network KPIs match section-level aggregates; HR Dashboard totals match underlying data.
11. **Year-over-Year** —
    - All KPI metrics in Dashboard, Policy Drilldown, Enrollment, Claims Insights, and Hospital Network show YoY comparisons when prior-year data is available.
    - Comparisons are suppressed when the prior-year window has no records — not shown as zero or absent value.
    - Trend views show prior-year data alongside current-year data.
    - Ranked views show prior-year amount and rank change.
    - Switching YoY off does not reload data.
    - Exports include prior-year data when YoY is on; PDF exports present summary-level data only.
12. **HR Portal Reports** — Claims History table loads only after a policy is selected; Endorsement Report loads company-wide without a policy filter; both tables support search and CSV export; claim dates render as `DD Mon YYYY` (not raw timestamps) in both table and export.

---

## 15. Stakeholders

| Role | Interest |
|---|---|
| HR Admin | Primary user of all 5 feature areas |
| Finance Team | Premium summaries, claim utilisation, financial insights |
| IBP Operations | Claims pipeline, hospital network analytics |
| Network / TPA Team | Hospital agreements, performance data |
| Compliance | Audit trails, export data |
| Product Manager | Acceptance criteria |
| Engineering Lead | Framework compliance, technical delivery |
| Design Lead | SDS authority — screen inventory, visual conventions |

---

## 16. Dependency Sync Rule

This PRD depends on:

1. **`../hr-module-report-framework-tech-spec.md`** — Any change to the framework (API paths, export formats, response envelope, placeholder naming) must be reflected in:
    - This PRD (Sections 4A, 5–9, 11)
    - The TRD (`./hr-analytics-trd.md`) — all sections
2. **`./hr-analytics-sds.md`** — This PRD is the functional authority. Any new screen behaviour, section, or visual rule added in the SDS must trace back to a requirement in this PRD. Any new requirement here with a screen implication requires a corresponding entry in the SDS.
3. **`./hr-analytics-trd.md`** — Any new requirement here requires a corresponding report key and SQL entry in the TRD.

---

*HR Analytics PRD — IBP HR Portal — May 2026 | v2.1: Removed all chart types, UI components, navigation mechanics, API parameters, sort orders, and display-level details. PRD now strictly owns business semantics, formulas, rules, and acceptance criteria.*
