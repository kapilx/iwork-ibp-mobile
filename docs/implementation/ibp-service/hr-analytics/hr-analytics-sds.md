# Solution Design Spec — IBP HR Portal HR Analytics Module

**Document Version:** 1.1
**Date:** 2026-05-04
**Author:** IIRM Product Team
**Jira Reference:** IIRM-9479
**PRD Reference:** `./hr-analytics-prd.md`
**TRD Reference:** `./hr-analytics-trd.md`
**Framework Reference:** `../hr-module-report-framework-tech-spec.md`

> **Scope of this document.** This SDS owns the *how it looks and behaves on screen* for HR Analytics. The PRD owns *what the module must do and why* (business rules, formulas, KPI definitions, acceptance criteria). The TRD owns *how data is fetched* (report keys, SQL, API contract). Any new screen or widget added here must have a corresponding KPI/widget definition in the PRD and a report key in the TRD.

---

## 0. Introduction

HR Analytics is delivered as one navigable surface composed of five feature areas: HR Dashboard, Policy Drilldown, Enrollment, Claims, and Hospital Network. They share a common data API (the HR Report Framework), common global context controls (policy and period), a shared Year-over-Year (YoY) display layer, and a single left-sidebar navigation model.

This SDS describes the screen inventory, information architecture, layout, navigation, empty/error UI states, and visual conventions (including YoY display patterns and threshold-driven visual flagging) needed to implement the module.

Cross-document split:

| Concern | Owner |
|---|---|
| Business outcome, scope, persona | PRD §1–3 |
| KPI definitions, formulas, business thresholds | PRD §5–9 |
| YoY math, prior-year window, suppression rules, export contract | PRD §4A |
| Screen layouts, tab inventory, columns, chart types | SDS §4 |
| Visual styling (colours, badges, dashed/ghost overlays) | SDS §4.7 |
| Threshold-driven visual flags (red on >100% loss ratio, etc.) | SDS §4.7 |
| Empty/error UI behaviour | SDS §7 |
| Routes and cross-area navigation | SDS §2.2, §10 |
| Report keys, SQL, API envelope | TRD |

---

## 1. Personas & Workflows

### 1.1 Primary Persona — HR Admin

See PRD §3 for full persona description. The HR Admin is the only persona served by HR Analytics screens. All other roles (Finance, Compliance, Operations, Network/TPA) are downstream consumers of exports.

### 1.2 Workflows

TBD. To be expanded with explicit per-task screen flows (e.g. "monitor monthly claim utilisation", "investigate a stuck claim", "review hospital risk before renewal", "export a compliance pack"). Each flow should map to one or more screens in §4.

---

## 2. Information Architecture

### 2.1 Module-level IA — HR Analytics is one surface

HR Analytics is a single module spanning five feature areas. The user perceives it as one product with a persistent left sidebar; each feature area is reached from the sidebar. Within a feature area, content is organised either as a single page (HR Dashboard) or as a tabbed page (Policy Drilldown, Enrollment, Claims, Hospital Network).

### 2.2 Routes

| Route | Feature Area | Entry |
|---|---|---|
| `/hr/dashboard` | HR Dashboard | Default landing after HR Portal login |
| `/hr/dashboard/policy/:policyId` | Policy Drilldown | "View Details →" on a policy card in HR Dashboard |
| `/hr/enrollment` | Enrollment Module | Sidebar "Enrolment" |
| `/hr/enrollment/employee/:employeeId` | Employee Detail | "See Details" in Enrollment row Actions menu |
| `/hr/claims` | Claims Module | Sidebar "Claims" |
| `/hr/hospitals` | Hospital Network | Sidebar "Hospitals" |
| `/hr/hospitals/:hospitalId` | Hospital Drilldown | (Future scope — link from Claims by Hospital cards) |
| `/hr-portal/reports` | HR Portal Reports | Sidebar "Reports" |

All routes require JWT auth; `companyId` is enforced server-side.

### 2.3 Sidebar (always visible)

Items, in order: Dashboard | Enrolment | Claims | Reports | Hospitals | Risk Watch | CD Manage. The active item is highlighted based on current route.

> **Scope note:** "Risk Watch" and "CD Manage" are sidebar items rendered for navigation completeness but are outside the HR Analytics PRD scope. The "Reports" sidebar item navigates to `/hr-portal/reports` — see §4.6 for its screen spec.

### 2.4 Tab Model per Feature Area

| Feature Area | Tabs |
|---|---|
| HR Dashboard | (No tabs — single scrollable page) |
| Policy Drilldown | Overview · Claims Analytics · Member Analytics · Financial Insights |
| Enrollment | Enrollment · Endorsement · Employee Analytics |
| Enrollment → Employee Analytics (sub-tabs) | Claims by Tenure · Claims by Relation · Claims by Age Band · High Claim Employees · Resigned Employees · Frequent Claimers |
| Claims | All Claims · Process Claim · Insights · Claim Procedure |
| Hospital Network | Network Hospitals · Claims by Hospital · Performance · Agreements |

### 2.5 Global Context Controls — Layout

The global controls (policy selector, YoY toggle) sit in the page header, in this order from left to right:

```
[ Page Title ]   [ Policy Selector ▾ ]   [ Compare vs Prior Year ⏵ ]
```

> **No period selector.** The PRD (§4) explicitly removes policy period selection. The system uses the active policy period automatically; the prior-year window is derived server-side from the active policy's dates. No date range picker or period dropdown exists anywhere in the global header.

**Policy Selector behaviour by page:**

| Page | Selector options |
|---|---|
| HR Dashboard | All Policies / GMC / GTL / GPA (policy type level) |
| All other pages | Individual policy selection |

Scope: control values apply to all data-driven widgets on the current page. They do **not** apply to the Claim Procedure tab (static) or to the HR Dashboard's Header/Welcome strip (UI only). Changing the policy selector triggers a simultaneous reload of all data-driven widgets on the page; a page-level loading skeleton is shown while in-flight.

### 2.6 Persona Mapping

Single primary persona (HR Admin) — no role-based screen variation in the current scope. RBAC failures redirect to a global access-denied screen (see §7).

---

## 3. Workflow Execution

TBD. To be expanded once §1.2 workflows are defined. Each workflow will reference the relevant screens in §4 and specify entry, key actions, and exit.

---

## 4. Screen Inventory

This section is the visual and structural source of truth. For every metric or KPI mentioned, the *definition and formula* live in the PRD; the *layout, chart type, and styling* live here.

### 4.1 HR Dashboard (`/hr/dashboard`)

#### 4.1.1 Page Header

Top strip, left to right:

- **Search bar** — placeholder "Search employees, claims, hospitals…" (UI only; not backed by the report framework).
- **Welcome text** — "Welcome back, {firstName}" (UI only).
- **Policy Type Filter** — "All Policies | GMC | GTL | GPA". Active selection highlighted; passes `policyType` to all data-driven widgets. This is the manifestation of the global policy selector on the Dashboard page. No date range or period picker is present — data is shown for active policies per the active policy period automatically (PRD §4, §5.1).
- **Notification Bell · Settings · Profile Menu** — UI only.

#### 4.1.2 Premium Summary Cards

Five horizontally aligned KPI cards in a single row across the top of the content area. Card content per definition in PRD §5.3. Each card displays the primary value, a YoY badge (per §4.7.1), and a tooltip with absolute prior-year value.

#### 4.1.3 Policies & Sub-Components

One card per matching policy, arranged in a responsive grid (3 cards per row on desktop, 1 per row on tablet). Each policy card has four distinct layout zones:

**Zone 1 — Card Header (top strip, single row):**
Policy name (large, bold) · Status badge (Active = green, Inactive = grey, Expired = red) · Policy ID (subdued) · TPA · Insurer · Period · Annual Premium (right-aligned, large, accent colour). A "→" arrow icon on the right navigates to Policy Drilldown.

**Zone 2 — Middle row (two columns, equal width):**

*Left column — CD Balance:*
- Large primary value: current CD balance (₹X.XL)
- Sub-label: "Current Balance · Total: ₹X.XL"
- Horizontal progress bar showing current balance position relative to total deposit; a marker pin indicates the safe-limit threshold
- **Below safe-limit state** (when `cdBalance < safeLimit`): label "Below safe limit" in red · sub-text "Top up ₹X.XL now — claims may be delayed". Neither label nor sub-text is shown when balance is above the threshold.

*Right column — Enrollment:*
- Three stat tiles in a single row: **Total Lives** · **Total Employees** · **Total Dependents** (each showing count only)
- Three enrollment status blocks below the stat tiles, side by side:
  - **ENROLLED** — label in green · percentage (large) · total count · "Emp N Dep N" sub-line
  - **IN PROGRESS** — label in amber · percentage (large) · total count · "Emp N Dep N" sub-line
  - **NOT ENROLLED** — label in red · percentage (large) · total count · "Emp N Dep N" sub-line
- Deadline alert strip (below status blocks): "⏱ N pending · Ends DD Mon YYYY" — amber background when pending count > 0

**Zone 3 — Claim Ratio (ICR) (full-width, below Zone 2):**
- Section label: "Claim Ratio (ICR)"
- Primary value: current ICR % (large) · sub-label: "vs last year · N claims" · YoY direction badge (↓N% improvement = green, ↑N% deterioration = red; direction is inverted vs standard KPI — per PRD §5.3)
- **ICR Comparison block** — three columns side by side:
  - **Full Year Avg** (label + prior-year date range) — Claim count · ₹ Incurred · ICR %
  - **Same Period LY** (label + equivalent LY date range) — Claim count · ₹ Incurred · ICR %
  - **Current** (label + current period date range) — Claim count · ₹ Incurred · ICR % · YoY Δ badge
- **Forecast card** (right of ICR comparison, distinct visual treatment — dashed border, "FORECAST" chip in purple): "PREDICTED · Next Year" · ~N Claims · ₹X.XL Incurred · ICR ~N%

#### 4.1.4 Claims Analysis

Composite widget with three vertically stacked elements:

- **KPI row (4 cards):** Total Claims, Paid Claims, Pending Claims, Claim Ratio. Claim Ratio is rendered as a small donut inline in the card.
- **Stacked Bar Chart — Monthly Trend:** X-axis = month label (e.g. "Sep '25"). Stacked bars per month split into two segments — Cashless and Reimbursement.
- **Toolbar above chart:** Amount/Count toggle · Stacked/Table view toggle · Filter chips (Last 3 Months · Last 6 Months · Custom · Claim Type · Status · Member Type).

YoY rendering for the chart: per §4.7.2 (ghost bars).

#### 4.1.5 Enrollment Status

Three KPI cards in a single row: Logged In · Not Logged In · Enrollment Confirmed. Each shows count, percent of total eligible, and a YoY badge.

#### 4.1.6 Demographics Breakdown

Four quadrant cards in a 2×2 grid: Inception Members · New Additions · Deletions · Total Active. Each card includes total count, employee/dependent split rendered as a stacked horizontal bar, and a YoY badge (current YoY rules: total count carries the badge except for Inception, which is point-in-time and has no badge).

#### 4.1.7 Top 10 Claim Insights

Tabbed widget with three tabs — Employees · Hospitals · Diseases. The active tab renders a horizontal bar chart, top 10 entities by claim amount. Bar colour per tab: Employees = blue, Hospitals = purple, Diseases = green. Filters bar above chart: Claim Type · Status · Member Type (shared across tabs). Switching tabs calls the corresponding report key. Per-row YoY rendering per §4.7.3.

#### 4.1.8 Dashboard Export Buttons

Per-widget export icons in each widget's top-right corner. Format options exposed per the PRD §5.9 export contract.

---

### 4.2 Policy Drilldown (`/hr/dashboard/policy/:policyId`)

#### 4.2.1 Page Header

Top strip:

- Back button (←) returns to `/hr/dashboard`
- Policy Name (large)
- Status badge — Active (green) · Inactive (grey) · Expired (red)
- Export button (right) — opens format picker (Excel / PDF) for full-page export
- Cancel button (right of Export) — returns to dashboard

#### 4.2.2 Global KPI Bar (always visible across all tabs)

Nine KPI cards in a single horizontal strip, equal-width on desktop, scrollable on tablet. Cards in this order (definitions in PRD §6.2): Total Lives · Sum Insured · Net Premium · Employees · Dependents · Active Claims · Claim Util. · Total Claims · Avg Claim.

Behaviour: KPI bar must resolve before any tab body renders. Loading skeleton while in-flight. Null values render as "—". YoY badges per §4.7.1.

**YoY card exceptions (per PRD §6.2):**
- **Sum Insured** — YoY badge is shown only when the sum insured tier changed year-over-year. If the tier is unchanged, no badge is rendered even when prior-year data exists.
- **Total Lives, Employees, Dependents** — carry YoY on headcount; badge shows headcount change, not a financial metric.

#### 4.2.3 Tab 1 — Overview

Vertically stacked sections:

- **Policy Sub-Components** — table. Columns: Sub-Component · Enrolled · Coverage · Premium/Mo · Claims · Status.
- **Enrollment Progress** — full-width progress bar with three stat boxes below (Enrolled · Pending · Dependents).
- **Claim Utilisation** — donut chart on the left (centre label: % utilised), three KPI rows on the right (Total Claims · Avg Claim · Outstanding).
- **Monthly Claim Trend** — dual-line chart, X-axis = last 12 months default. Blue line = claims raised, green line = claims settled. YoY overlay per §4.7.2.
- **Top Hospitals Used** — ranked list, top 5. Row layout: Rank · Hospital Name · Total Amount · Claim Count, with a horizontal progress bar inside each row (width proportional to amount/max). YoY rank-change badge per §4.7.3.
- **Disease Category Breakdown** — horizontal bars, top 6. Per row: Disease · % bar · Claim Count. YoY overlay per §4.7.2 (prior-year series per PRD §6.3).

#### 4.2.4 Tab 2 — Claims Analytics

- **Filter bar** — Period (Last 3 Mo · Last 6 Mo · Last 12 Mo · Custom) · Claim Type (All · Cashless · Reimbursement) · Status (All · Paid · Outstanding · Rejected · Closed · Denied) · Reset button.
- **Claims Insights Stacked Bar** — monthly claim amounts stacked by status. Status colours: Paid = green, Outstanding = blue, Rejected = red, Closed = dark grey, Denied = neutral grey. Toggles: Stacked/Table view · Amount/Count/Avg Claim. Per-widget Excel/PDF export.
- **Claims by Month Line Chart** — single blue line; metric follows the stacked bar's toggle.
- **Cashless vs Reimbursement Donut** — two arcs: blue (Cashless) + green (Reimbursement) with count labels.
- **Claims by Hospital Grouped Bar** — per hospital, two adjacent bars: blue (Cashless), green (Reimbursement). Top 10 hospitals.
- **Claims by Employee Table** — search box (employee · claim no · hospital). Columns: Claim No · Employee · Hospital · Type · Claim Amt · Settled Amt · Status · TAT. TAT format: "3d"; null → "—". Settled Amt null → "—". Per-widget Excel export.

#### 4.2.5 Tab 3 — Member Analytics

- **Members by Age Group** — grouped bar chart. X-axis = age groups (15-25 · 26-35 · 36-45 · 46-55 · 56-65 · 65+). Two bars per group: blue (Employees), green (Dependents).
- **Gender Distribution** — donut, blue (Male) + pink (Female) with count labels.
- **Employees vs Dependents** — donut, blue (Employees) + green (Dependents).
- **Department-wise Enrollment** — list of progress bars. Row: Department · progress bar · ratio (enrolled/total).
- **Member Table** — searchable (name · emp ID · department). Columns: Emp ID · Name · Department · Sum Insured · Dependents · Claims · Total Claim Amt. Excel export.

#### 4.2.6 Tab 4 — Financial Insights

- **Financial KPI row (4 cards):** Total Premium · Total Claim Paid · Outstanding Claims · Loss Ratio. Loss Ratio threshold visual flag — see §4.7.4.
- **Premium vs Claim Trend** — dual-line chart, last 12 months. Blue dashed line = monthly premium. Red solid line = monthly claim amount. YoY overlay per §4.7.2.
- **Policy Utilisation** — single horizontal progress bar with subtitle "of sum insured utilised this policy year". YoY: prior-year utilisation rendered as a lighter-shaded bar segment behind the current-year bar.
- **Financial Summary Table** — six rows (per PRD §6.6): Policy Premium · Claim Paid (YTD) · Outstanding Claims · Loss Ratio % · Admin Charges · Net Liability. Columns: Row label · Amount · (Prior Year, when YoY On) · (YoY Δ%, when YoY On). Excel/PDF export.

---

### 4.3 Enrollment Module (`/hr/enrollment`)

#### 4.3.1 Tab 1 — Enrollment

- **KPI row (6 cards):** Total Lives · Employees · Dependents · Total Addition · Total Deletion · Total Enrolled. Each card shows primary count and a sub-line (active/inactive split where applicable).
- **Search bar** — Employee # / Name / Email / Phone.
- **Filter chips** — Member Type · Status · Enrollment Status · Gender · Addition Type. Reset button appears only after a filter or search is active and clears list-level state only.
- **Employee List Table — 15 columns:** Emp # · Employee Name · Gender · DOB · Age · Email · Mobile · Enroll Status · Addition Type · Sum Insured · Dependents · E-Card · Status · Last Login · Actions.
- **Row interactions:**
  - Dependents cell click — expands inline dependent rows beneath the employee row.
  - E-Card "View" — opens E-Card modal (see §4.3.5).
  - Actions menu — dropdown with: See Details · Add Favourite · Move to Trash.

  > **Spec relocation note:** "Reset Password" and "Extend Enrollment Window" are no longer part of this Actions menu. They have been relocated to the [Employee Support module](../employee-support/employee-support-SDS.md) and are implemented there. The existing enrollment listing component (`HRPortalEnrolmentV2`) is the visual reference pattern adopted by the Employee Support page — not this Enrollment Analytics module.
- **Export controls** — exposes PDF · CSV · Excel · Word (Enrollment is the only module with Word/CSV).

#### 4.3.2 Employee Detail View (`/hr/enrollment/employee/:employeeId`)

- **Top strip:** Profile identity (avatar · name · ID) · Enrollment status chip · Active/Inactive chip · Journey stage strip — six segmented chips: Application → Document → HR Verification → Insurer Approval → E-Card → Coverage Active. The currently active stage is filled; completed stages are checked; future stages are outlined.
- **Summary cards (3):** Total enrolled policies · Total sum insured · Available balance.
- **Section accordion (5 sections):** Employee Details · Insurance & Policy Details · Dependents/Beneficiaries · Claims History · Activity Log. Each section is independently expandable. Section field lists per PRD §7.3.

#### 4.3.3 Tab 2 — Endorsement

> **Spec moved.** The complete screen design for the Endorsement tab — layout, section structure, field rendering, expanded card states, upload form, and uploaded files table — has been consolidated into:
>
> **`../inception-endorsement/hr-portal-inception-endorsement-sds.md`**
>
> Do not add new Endorsement tab screen descriptions to this file. All layout and interaction changes belong in the inception-endorsement SDS above.

#### 4.3.4 Tab 3 — Employee Analytics

Six sub-tabs in a horizontal tab strip. Each sub-tab is a single chart or table view:

| Sub-Tab | Output |
|---|---|
| Claims by Tenure | Bar chart — buckets: 0-1yr · 1-2yr · 2-5yr · 5-10yr · 10+yr |
| Claims by Relation | Donut — Employee · Spouse · Parent · Child · Other |
| Claims by Age Band | Bar chart — bands: 20-30 · 31-40 · 41-50 · 51-60 · 60+ |
| High Claim Employees | Ranked table — Employee · Department · City · Age · Claim Count · Total Spent |
| Resigned Employees | Table — Employee · Last Day · Tenure · Claims · Diseases · Amount |
| Frequent Claimers | Table — Employee · Age · Tenure · Claim Count · Diseases · Total |

**Shared controls (above the active sub-tab):** By Count / By Amount toggle · Department filter · City filter.

YoY rendering per §4.7.2/§4.7.3 for the first four sub-tabs; Resigned and Frequent Claimers are excluded (per PRD §4A.7).

#### 4.3.5 E-Card Modal

Modal opened from the E-Card "View" action. Contents: card preview (front/back), member details, PDF download button. Close on backdrop click or × button.

---

### 4.4 Claims Module (`/hr/claims`)

#### 4.4.1 Tab 1 — All Claims

- **KPI row (6 cards):** Total Claims · Paid · Outstanding · Rejected · Closed · Denied.
- **Search bar** — Employee Name / Claim Number.
- **Filter chips** — Year · Claim Status · Claim Type. All filters apply cumulatively with search.
- **Table — 11 columns:** Claim Number · Employee ID · Employee Name (with department subtext) · Relation · TPA ID · Claim Type · Claim Date · Claim Amount · Settled Amount · Status · TAT/Aging.
- **Pagination:** 10 records per page (default).
- **Export:** Excel · PDF only. Follows active filter/search state.

#### 4.4.2 Tab 2 — Process Claim

- **Subtitle row:** "X of Y claims in active processing pipeline." with a Refresh button (top-right) that reloads both the KPI row and the process list.
- **KPI row (5 cards):** Total In Process · Under Review · Medical Assessment · Approval Pending · Settlement.
- **Search bar** — Employee Name / Claim Number / Hospital.
- **Filter chips** — Stage · Claim Type.
- **Table — 11 columns:** Claim No · Employee (avatar + name + ID subtext) · Hospital · Diagnosis · Type · Amount · Stage · Assigned To · Submitted Date · Last Updated · Pending Docs.
- **Stage progress bar** (within each row): five-segment bar, 20% per segment. Segment fill colour:
  - Documents Submitted / Under Review — blue
  - Medical Assessment / Approval Pending — amber/orange
  - Settlement — green
- **Footer:** "Total value ₹X,XX,XXX" for all claims currently in pipeline.
- **No export controls in this tab** (per PRD §8.3 — live operational state).

#### 4.4.3 Tab 3 — Insights

- **KPI row (4 cards):** Total Claims · Total Amount · Avg Claim Amount · Approval Rate.
- **Five chart widgets** (each calls its own report key):

| Widget | Chart Type | Notes |
|---|---|---|
| Claims Trend | Line chart | Two lines: Cashless (blue), Reimbursement (green); FY year filter |
| Claims by Hospital | Horizontal bar | Top hospitals; By Count / By Amount toggle |
| Claims by City | Vertical bar | All / Cashless / Reimbursement filter |
| Claims by Amount Band | Vertical bar | Bands: <₹50K · ₹50K–₹2L · ₹2L–₹5L · >₹5L; By Count / By Amount toggle |
| Claims by Department | Donut + legend | Legend shows dept name, count, % |

- **"View All" CTA** on each widget — navigates to All Claims tab. Hospital and Department widgets pre-apply the relevant filter on navigation.
- **Per-widget Excel export.**

YoY per §4.7.

#### 4.4.4 Tab 4 — Claim Procedure (Static)

Entirely static content. No API calls. No dependence on the global policy/period controls.

- **Mode toggle** at top: Cashless / Reimbursement. The whole tab body re-renders for the selected mode.
- **Per-mode panels (vertically stacked):**
  - **Process Steps** — 7-step accordion (each step expandable with detail body).
  - **Helpline Numbers** panel.
  - **Download Forms** panel — buttons for Cashless Claim Form · Reimbursement Claim Form · Pre-Auth Request Form · Grievance Redressal Form.
  - **Policy Notes** panel.
  - **Escalation Contact** panel.
  - **Document Checklist** panel — interactive checkboxes; counter "X/8 ready" updates live as boxes are checked.
  - **Expected Approval Timeline** panel.
- **Claims Status Meaning Table** (same in both modes) — content per PRD §8.4.

---

### 4.5 Hospital Network (`/hr/hospitals`)

#### 4.5.1 Page Header

- Page title — "Network Hospital Directory" (the title text changes per active tab).
- Subtitle — "{count} empanelled hospitals · {policyNumber}".
- Sidebar item "Hospitals" highlighted as active.

#### 4.5.2 Tab 1 — Network Hospitals

- **KPI row (4 cards):**

| Card | Sub-label | Accent |
|---|---|---|
| Total Network Hospitals | "Across {n} cities" | Blue |
| Hospitals Used This Year | "{n}% network utilisation" | Green |
| Top Claim Hospital | "{n} claims · ₹{amount}" | Amber |
| Avg Claim per Hospital | "Across all active hospitals" | Red |

- **Hospital Directory Table:**
  - **Search:** hospital name / city.
  - **Filters:** Cities · Specialties · Status (Active/Inactive) · Cashless (Yes/No).
  - **Columns:** Hospital Name (avatar · name · type) · City (with state subtext) · Specialities (tag pills with "+n" overflow chip) · Cashless (badge) · Total Claims · Total Amount · Avg Claim · Status · Action ("View Details").
  - **Pagination:** "Showing {start}–{end} of {total}". Default sort: Total Claims descending.

#### 4.5.3 Tab 2 — Claims by Hospital

2×3 grid of clickable hospital cards (top 6). Each card:

- **Rank badge** in top-left: 1 = gold, 2 = silver/grey, 3 = bronze, 4–6 = blue.
- Hospital name · City.
- **Total Claims** — large numeric, amber colour for rank 1.
- **Total Amount** (₹).
- **Top Disease** — chip.
- YoY: prior-year amount and rank-change badge per §4.7.3. New entrants show "NEW" badge.
- **Card click:** navigates to `/hr/hospitals/:hospitalId` (future scope).

#### 4.5.4 Tab 3 — Performance

- **KPI row (4 cards):**

| Card | Sub-label | Accent |
|---|---|---|
| Avg Approval Rate | "Across all network hospitals" | Green |
| Avg Settlement Time | "End-to-end claim settlement" | Blue |
| Total Complaints | "{n} high-risk hospital(s)" | Amber |
| High Risk Hospitals | "Require immediate attention" | Red |

- **Performance Overview Table:**
  - **Columns:** Hospital Name · City · Approval Rate (progress bar + % value) · Rejection Rate · Avg Settlement (days) · Complaints · Risk Level (badge).
  - **Default sort:** Approval Rate descending.
  - **Threshold-driven visual flagging** per §4.7.4 (Approval Rate colours, Rejection Rate red threshold, Settlement Time colours, Risk Level badge palette).

#### 4.5.5 Tab 4 — Agreements

- **KPI row (4 cards):**

| Card | Sub-label | Accent |
|---|---|---|
| Total Agreements | "Active empanelment contracts" | Blue |
| Expiring in 60 Days | "Renewal action required" | Amber (or warning style when count > 0) |
| Cashless Enabled | "Direct cashless settlement" | Green |
| Cities Covered | "Geographic network spread" | Purple |

- **Agreement Registry Table:**
  - **Columns:** Hospital Name (with city · specialty subtext) · Agreement Start · Agreement End · Contact Person · Phone · Email (mailto: link) · Document (Download → PDF).
  - **Default sort:** Agreement End ascending (expiring soonest first).
  - **Threshold-driven visual flagging** per §4.7.4 (Agreement End red within 60 days).

---

### 4.6 HR Portal Reports (`/hr-portal/reports`)

#### 4.6.1 Page Header

Hero strip (`PortalHeroHeader`) with title "Reports" and subtitle "View and download reports across endorsements, claims, employees, and finance". Below it: a category chip bar (`PortalControlBar`) with chips for All · Endorsement Reports · Employee Reports · Claim Reports · Finance Reports · Communication Reports. Active chip: filled blue (`#1d57b7`). Page background: `#EBF6FF`.

#### 4.6.2 Report Cards Layout

The page body renders a two-column masonry grid of collapsible report cards. Cards are rendered in two columns (alternating by index). Each card is independently expandable. Selecting a category chip filters the visible cards to that category; the "All" chip shows all 15.

**Card visual states:**

| State | Visual |
|---|---|
| Live — collapsed | White/grey gradient, chevron-down icon (right), full opacity |
| Live — expanded | Blue border (`#BDD4F8`), chevron rotated 180°, expanded panel below |
| Disabled ("Coming soon") | 50% opacity (`opacity: 0.5`), `pointer-events: none`, "Coming soon" pill badge replaces chevron |

**Live report cards (4):**

| Card | Report Key | Category | Expand Trigger |
|---|---|---|---|
| Claims History | `policy_claim_history` | Claims | Card click — table stays empty until policy selected |
| Endorsement Report | `endorsement_list` | Endorsement | Card click — table loads immediately |
| Enrollment Report | `ibp_hr_employee_listing` | Employees | Card click — table loads immediately |
| Premium Report | `company_policy_details_summary` | Finance | Card click — table loads immediately |

**Disabled report cards (11):** Demography, Employee Diff, Login Credential, Cashless TAT, Reimbursement TAT, DNR, Enrollment Communication, Life Events, Midterm Addition, Midterm Deletion, Endorsement Status Tracker.

#### 4.6.3 Claims History Card (expanded state)

**Filter bar (above table, only visible when expanded):**

Three inline filters in a single row:

| Filter | Control | Default | Notes |
|---|---|---|---|
| Policy | Dropdown | — (prompt: "Select a policy") | Required. Shows `policyName (policyNumber)`. Populated from `dashboard_policy_cards`. |
| Claim Type | Dropdown | All | Values: All · Cashless · Reimbursement |
| Status | Dropdown | All | Values: All · Active · Closed · Rejected |

**Table columns:**

| Column | Key | Align | Display |
|---|---|---|---|
| Claim No | `claimNumber` | Left | Text |
| Patient Name | `patientName` | Left | Text |
| Relation | `relation` | Left | Text |
| Hospital | `hospital` | Left | Text |
| Claim Date | `claimDate` | Left | `DD Mon YYYY` — never raw timestamp |
| Type | `claimType` | Left | Badge |
| Claimed (₹) | `claimedAmount` | Right | Numeric |
| Approved (₹) | `approvedAmount` | Right | Numeric |
| Status | `status` | Left | Badge |

**Empty state (no policy selected):** Placeholder text "Select a policy to view claim history." No error state.

**Export:** "Export Report" button in the expanded panel (right-aligned). Active (dark blue `#1C3A6E`) when `hasRealData` is true and a policy is selected. Grey and non-clickable otherwise. On click: `POST /hr-module/download/policy_claim_history` → blob → browser save-file dialog. Button label changes to "Downloading..." with a spinner while the request is in flight.

#### 4.6.4 Endorsement Report Card (expanded state)

**No additional filter bar.** Table loads immediately on expand.

**Table columns:**

| Column | Key | Align | Display |
|---|---|---|---|
| Endorsement ID | `endorsementId` | Left | Text |
| Policy No | `policyNumber` | Left | Text; may be empty if policy has no insurer_policy_number |
| Type | `endorsementType` | Left | Text |
| Start Date | `enrollmentStartDate` | Left | Pre-formatted `DD/MM/YYYY` from SQL — rendered as-is |
| End Date | `enrollmentEndDate` | Left | Pre-formatted `DD/MM/YYYY` from SQL — rendered as-is |
| Status | `endorsementStatus` | Left | Badge; raw enum string (e.g. `ENDORSEMENT_REQUEST_RECEIVED`) |
| Uploads | `uploadCount` | Right | Numeric |
| Successful | `totalSuccessCount` | Right | Numeric |

**Export:** "Export Report" button → `POST /hr-module/download/endorsement_list`. All DB columns included.

#### 4.6.4b Enrollment Report Card (expanded state)

**Filter bar (above export button, only visible when expanded):**

| Filter | Control | Default | Notes |
|---|---|---|---|
| Enrollment Status | Dropdown | All | Values: All · Enrolled · Not Started · In Progress. Maps to `enrollStatus` param. |

**Table columns:**

| Column | Key | Align | Display |
|---|---|---|---|
| Emp ID | `companyEmployeeId` | Left | Text |
| Name | `employeeName` | Left | Text |
| Gender | `gender` | Left | Text |
| Email | `email` | Left | Text |
| Status | `enrollStatus` | Left | Badge; raw enum key |
| Sum Insured (₹) | `sumInsured` | Right | Numeric |
| Dependents | `dependentsCount` | Right | Numeric |
| Last Login | `lastLoginAt` | Left | ISO timestamp → `DD Mon YYYY` |

**Export:** "Export Report" button → `POST /hr-module/download/ibp_hr_employee_listing`. All DB columns included.

#### 4.6.5 Empty / Error States for Reports Page

| Scenario | UI |
|---|---|
| Claims History expanded, no policy selected | Inline prompt "Select a policy to view claim history." |
| Selected policy has no matching claims | Empty state "No claims found for the selected filters." |
| Company has no endorsements | Empty state "No endorsement records found." |
| API error on fetch | Widget-level error toast; card stays expanded. |
| Disabled card clicked | No-op — `pointer-events: none` on the outer Box prevents interaction |
| Export in flight | Button shows "Downloading..." with spinner; grey background; non-clickable |

---

### 4.7 YoY and Threshold Visual Patterns

This subsection consolidates display rules that recur across screens. The PRD owns *when* a pattern applies (suppression rules, exclusions); this section owns *how* it looks.

#### 4.6.1 KPI Card YoY Badge

- **Position:** Below the primary value of the card.
- **States and styling:**

| State | Display | Colour |
|---|---|---|
| Positive growth | `↑ +12.3% vs last year` | Green |
| Decline | `↓ −5.1% vs last year` | Red |
| No change | `0% vs last year` | Neutral grey |
| Suppressed (no prior data, first policy year) | Badge not rendered | — |

- **Tooltip on hover:** absolute prior-year value.
- The badge shows percentage change only; absolute change is in the tooltip.
- Inversion case: where a *decrease* is favourable (e.g. Avg Settlement Time, Rejection Rate), the arrow direction follows the numeric movement but the colour follows business interpretation — green for improvement, red for deterioration.

#### 4.6.2 Trend & Chart Widget Overlays

| Chart type | Prior-year rendering | Colour |
|---|---|---|
| Line chart | Dashed line, same colour family at 40% opacity | Matches current-year line |
| Stacked bar chart | Ghost bars rendered behind current-year bars at 30% opacity | Matches current-year bar |
| Donut chart | No overlay; tooltip on segment hover shows prior-year count/percent | — |

A "Prior Year" entry is added to the chart legend. Clicking the legend entry hides/shows the prior-year series independently of the global YoY toggle.

#### 4.6.3 Ranked List & Top-N Patterns

Each row gains:

- **Prior Year Amount** column to the right of the current-year amount.
- **YoY Change %** column — signed, green/red coloured per direction.
- **Rank Change badge** — `↑2` (green), `↓1` (red), `NEW` (blue, when entity had no prior-year rank), `—` (neutral grey, rank unchanged).

For 2×3 card grids (e.g. Hospital Network Tab 2), the same fields are laid out within each card rather than as columns.

#### 4.6.4 Threshold-Driven Visual Flagging

Visual-only rules for surfacing at-risk values. Thresholds and colours below are display rules; the PRD references them as "flag at-risk thresholds visually" without specifying the cut-points.

| Surface | Rule | Visual |
|---|---|---|
| Loss Ratio KPI (Policy Drilldown — Financial Insights) | Value > 100% | KPI value rendered in red |
| Approval Rate (Hospital Performance) | ≥ 90% / 85–89% / < 85% | Green / amber / red bar fill and value |
| Rejection Rate (Hospital Performance) | ≤ 10% / 11–15% / > 15% | Green / amber / red value (per PRD §9.3.1) |
| Avg Settlement Time (Hospital Performance) | ≤ 6d / 6–8d / > 8d | Green / amber / red value (per PRD §9.3.1) |
| Risk Level badge (Hospital Performance) | Low / Medium / High (criteria per PRD §9.3.1) | Green / amber / red badge |
| Agreement End (Hospital Agreements) | Within 60 days of today | Date rendered in red; row highlight optional |
| Expiring in 60 Days KPI card | Count > 0 | Card uses warning (amber) accent styling |
| Status badge (Policy Drilldown header) | Active / Inactive / Expired | Green / grey / red badge |

#### 4.6.5 YoY Toggle

- **Label:** "Compare vs Prior Year".
- **Default:** On.
- **Position:** Page header, right of the policy selector.
- **Behaviour:** Display-layer only. Toggling Off hides all YoY badges, overlays, and prior-year columns; it does **not** alter API request parameters.
- **Persistence:** Per-session; resets to On on page reload.

---

## 5. System Behaviors & Data Contracts

TBD. Data contracts (entities, IDs, response envelope, pagination) are owned by the TRD and the framework spec. This section will, in a later revision, summarise the screen-side assumptions about those contracts (e.g. how the UI reacts to partial data, response-envelope conventions consumed by widgets).

---

## 6. APIs & Events (Contract Outline)

All data on HR Analytics screens is loaded exclusively through the HR Report Framework:

- `POST /hr/report/generate/:reportKey` — read.
- `POST /hr/report/download/:reportKey?format=excel|pdf|csv|word` — export.

The full report-key catalogue, request/response envelope, and SQL definitions are owned by the TRD (`./hr-analytics-trd.md`). This SDS does not duplicate that contract.

Events: TBD. Real-time refresh (e.g. Process Claim live updates) is currently triggered by an explicit user-driven Refresh button (no push channel).

---

## 7. Empty, Error & Edge UI States

| Scenario | UI Behaviour |
|---|---|
| No data for selected filters | Empty-state placeholder inside the widget — illustration + message "No data for selected filters". |
| API returns 4xx/5xx for a single widget | Section-level error toast at the widget; other widgets continue to render normally. |
| Policy Drilldown — Global KPI Bar fails | Full-page error state with retry button; no tab body renders. |
| No hospitals empanelled | Hospital Network Tab 1 shows empty-state card: "No hospitals empanelled for this policy". |
| Agreement end date within 60 days | End date in red (per §4.7.4); "Expiring in 60 Days" KPI card uses warning accent when count > 0. |
| Missing E-Card for an employee | "View" button rendered disabled with "Unavailable" tooltip. |
| Employee with no dependents | Dependents section shows count 0 and an empty list with "No dependents on file". |
| Process Claims Refresh fails | Error toast; existing data remains visible (no destructive replacement). |
| Hospital with no claims | Total Claims = 0, Avg Claim = 0; row remains in directory. |
| RBAC failure (403) | Redirect to global access-denied screen. |
| Missing claim financial values | Render "—" rather than "0" (unless the true value is genuinely zero). |
| Partial page export failure | Toast error; no partial file delivered to the user. |
| `loggedIn > totalEligible` (data anomaly) | Cap displayed percent at 100; underlying count preserved. |
| No prior-period data | YoY badge suppressed entirely (no "0%" or "—"). |
| Loading state | Per-widget skeleton matching the widget's shape (card skeleton, chart axis skeleton, table-row skeleton). |

---

## 8. Notifications

TBD. Currently no in-app notification surfaces are owned by HR Analytics — the bell icon in the dashboard header is UI-only (per §4.1.1).

---

## 9. Access Control

- **Authentication:** JWT required on every screen and every report-framework call.
- **Authorisation:** `companyId` scope is enforced server-side; the UI does not gate by role within HR Admin (single persona).
- **403 handling:** redirect to global access-denied screen with a return link to `/hr/dashboard`.

Role-based UI variation: TBD (none in current scope).

---

## 10. Navigation Integration

### 10.1 Routes

See §2.2 for the full route table.

### 10.2 Cross-Module Navigation

| From | To | Trigger |
|---|---|---|
| HR Dashboard | Policy Drilldown | "View Details →" on a policy card |
| HR Dashboard | Claims Module | Sidebar "Claims" |
| Claims Insights widget | All Claims tab | Per-widget "View All" CTA — Hospital and Department widgets pre-apply the relevant filter |
| Hospital Network — Claims by Hospital card | Hospital Drilldown | Card click (future scope) |
| Enrollment row Actions menu | Employee Detail view | "See Details" |
| Any page | Sidebar destinations | Sidebar link click |

### 10.3 Navigation Tree (visual)

```
HR Portal
├── /hr/dashboard                          ← Feature Area 1: HR Dashboard
│   └── /hr/dashboard/policy/:policyId     ← Feature Area 2: Policy Drilldown
├── /hr/enrollment                         ← Feature Area 3: Enrollment Module
│   └── /hr/enrollment/employee/:id        ← Employee Detail view
├── /hr/claims                             ← Feature Area 4: Claims Module
├── /hr/hospitals                          ← Feature Area 5: Hospital Network
│   └── /hr/hospitals/:hospitalId          ← Future: Hospital Detail Drilldown
└── /hr-portal/reports                     ← Feature Area 6: HR Portal Reports
```

---

## 11. UI Routing Model

TBD. To capture: deep-linkable filter state (which filters survive in URL params vs. reset on navigation), tab state in URL fragment vs. local state, back-button behaviour for tab switches inside a feature area.

Working assumptions, to be ratified:

- Active feature area is reflected in the path (already true).
- Active tab within a feature area is **not** in the URL today — back button does not traverse tabs. To be confirmed.
- Filter state inside a tab is local (resets on navigation away from the tab). To be confirmed.

---

## 12. Page Responsibility Matrix

TBD. To be filled when §1.2 workflows are defined. Will map each user task to the page that owns it and the read/write APIs it calls.

---

## 13. UI Architecture Specification

TBD. Will cover:

- 13.1 UI State Model (per page: server data, filter state, UI-only state)
- 13.2 View Model contract (PRD widget → frontend view model shape)
- 13.3 Interaction Contracts (toggle behaviour, drill-down, export)
- 13.4 Permission-to-UI mapping (currently single persona; placeholder for future)
- 13.5 Metadata & Lookup Handling (policy list, departments, cities, statuses)
- 13.6 Data Fetching, Caching & Server-Driven List Rules
- 13.7 Refresh & Synchronization Model (Process Claim refresh button; YoY toggle as display-layer only)
- 13.8 URL & State Persistence (resolve §11 working assumptions)
- 13.9 Error Handling UX Rules (cross-references §7)
- 13.10 Frontend Architecture Guidelines (routing, state library, chart library, component library — TBD)

---

## 14. Design Principles Summary

TBD. Candidate principles, to be ratified:

- **One module, one surface.** HR Analytics is not five products glued together; the global controls and YoY toggle behave identically across all five feature areas.
- **Definition lives in PRD; appearance lives in SDS.** A KPI's formula and suppression rules are PRD; its colour, position, and badge style are SDS.
- **YoY is a display layer.** Toggling YoY never changes API parameters.
- **Operational data does not get YoY.** Pipelines, activity logs, and contractual data are excluded from YoY (per PRD §4A.7).
- **"—" not "0".** Distinguish "missing" from "zero" everywhere a number can be missing.

---

## Open Questions

1. Workflow inventory (§1.2) — which HR Admin workflows do we walk through end-to-end as the spec narrative?
2. URL & state persistence (§11) — should active tab and filter state be deep-linkable for sharing with finance/management?
3. Notification surface (§8) — is the dashboard bell genuinely UI-only forever, or does it become a real notification surface in a later phase?
4. Hospital Drilldown (`/hr/hospitals/:hospitalId`) is referenced but out of scope. Confirm the placeholder behaviour when a user clicks a hospital card today.
5. Tab-switch unsaved-changes prompt — does any tab in HR Analytics currently have writable state that would warrant this? (None obvious in the PRD; confirming.)
6. Approval Rate / Avg Settlement YoY direction inversion (§4.7.1) — confirm the "improvement is green" rule is acceptable or whether we keep colour purely numeric.
7. Mobile/phone responsiveness — PRD NFR says "Desktop + tablet". Confirm phone is genuinely out of scope for v1.

---

## Approval

TBD.

---

*HR Analytics SDS — IBP HR Portal — May 2026 | v1.0: Initial split from PRD v1.1*
