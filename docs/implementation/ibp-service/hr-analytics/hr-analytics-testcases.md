# HR Portal HR Analytics Module — Test Case Suite

**Document Version:** 1.1
**Date:** 2026-05-08
**Module:** HR Analytics (IBP HR Portal)
**Jira Reference:** IIRM-9479
**Source Documents:** hr-analytics-prd.md v2.1 · hr-analytics-sds.md v1.1 · hr-analytics-trd.md v1.1

---

## Table of Contents

1. [Functional Test Cases](#1-functional-test-cases)
2. [Edge Test Cases](#2-edge-test-cases)
3. [Negative Test Cases](#3-negative-test-cases)
4. [Security Test Cases](#4-security-test-cases)
5. [Performance Test Cases](#5-performance-test-cases)
6. [Integration Test Cases](#6-integration-test-cases)
7. [Accessibility Test Cases](#7-accessibility-test-cases)
8. [Regression Test Cases](#8-regression-test-cases)
9. [Data Integrity Test Cases](#9-data-integrity-test-cases)
10. [API Test Cases](#10-api-test-cases)

---

## Summary Table

| TC ID | Title | Category | Priority | Status |
|-------|-------|----------|----------|--------|
| TC-FUNC-001 | HR Dashboard loads with all KPI sections populated | Functional | Critical | — |
| TC-FUNC-002 | Policy type filter refreshes all widgets simultaneously | Functional | Critical | — |
| TC-FUNC-003 | Premium Summary KPI values are computed correctly | Functional | Critical | — |
| TC-FUNC-004 | Policy cards grid renders one card per matching policy | Functional | High | 🔁 **Updated** |
| TC-FUNC-005 | Claims Analysis KPI cards display correct values | Functional | Critical | — |
| TC-FUNC-006 | Claims Monthly Trend renders Cashless/Reimbursement stacked bars | Functional | High | — |
| TC-FUNC-007 | Enrollment Status KPI cards display count and percent | Functional | High | — |
| TC-FUNC-008 | Demographics Breakdown shows employee/dependent split | Functional | High | — |
| TC-FUNC-009 | Top 10 Insights tab switching between Employees/Hospitals/Diseases | Functional | High | — |
| TC-FUNC-010 | Policy Drilldown opens from "View Details" on policy card | Functional | Critical | — |
| TC-FUNC-011 | Policy Drilldown global KPI bar blocks tab access until resolved | Functional | Critical | — |
| TC-FUNC-012 | Policy Drilldown Overview tab loads all sections | Functional | High | — |
| TC-FUNC-013 | Claims Analytics tab filters apply cumulatively | Functional | High | — |
| TC-FUNC-014 | Member Analytics tab renders all charts and member table | Functional | High | — |
| TC-FUNC-015 | Financial Insights Loss Ratio > 100% triggers red flag | Functional | High | — |
| TC-FUNC-016 | Enrollment tab KPI cards display with active/inactive split | Functional | High | — |
| TC-FUNC-017 | Enrollment search by employee name, ID, email, phone | Functional | High | — |
| TC-FUNC-018 | Enrollment filter chips apply cumulatively; reset clears only list filters | Functional | High | — |
| TC-FUNC-019 | "See Details" navigates to Employee Detail view | Functional | High | — |
| TC-FUNC-020 | Employee Detail journey stages show correct progression state | Functional | Medium | — |
| TC-FUNC-021 | Employee Detail five accordion sections load correct data | Functional | High | — |
| TC-FUNC-022 | E-Card modal opens from Enrollment list "View" action | Functional | Medium | — |
| TC-FUNC-023 | Endorsement tab overview metrics and cumulative employee metrics | Functional | High | — |
| TC-FUNC-024 | Endorsement accordion expand shows employee and premium snapshots | Functional | Medium | — |
| TC-FUNC-025 | Employee Analytics Claims by Tenure bar chart renders | Functional | Medium | — |
| TC-FUNC-026 | Employee Analytics High Claim Employees ranked table | Functional | Medium | — |
| TC-FUNC-027 | Claims Module All Claims tab with 6 KPIs and full table | Functional | Critical | — |
| TC-FUNC-028 | Process Claim tab shows active pipeline with stage breakdown | Functional | Critical | — |
| TC-FUNC-029 | Process Claim Refresh reloads KPIs and pipeline list | Functional | High | — |
| TC-FUNC-030 | Claims Insights tab 4 KPIs and 5 analytic views | Functional | High | — |
| TC-FUNC-031 | Claim Procedure tab renders in Cashless and Reimbursement modes | Functional | High | — |
| TC-FUNC-032 | Hospital Network Hospitals tab directory with search and filters | Functional | High | — |
| TC-FUNC-033 | Hospital Claims by Hospital top 6 cards render | Functional | Medium | — |
| TC-FUNC-034 | Hospital Performance tab Risk Level classification | Functional | High | — |
| TC-FUNC-035 | Hospital Agreements tab 60-day expiry KPI and registry | Functional | High | — |
| TC-FUNC-036 | Dashboard export — Policies (Excel, PDF), Claims (Excel, PDF), Top 10 (Excel) | Functional | High | — |
| TC-FUNC-037 | Enrollment export supports PDF, CSV, Excel, Word | Functional | High | — |
| TC-FUNC-038 | Claims module export — Excel and PDF only (no CSV/Word) | Functional | High | — |
| TC-FUNC-039 | Hospital Network export — all 4 sections (Excel, PDF) | Functional | Medium | — |
| TC-FUNC-040 | YoY toggle default On shows badges on all KPI cards | Functional | Critical | — |
| TC-FUNC-041 | YoY toggle Off hides all badges and overlays without re-fetching data | Functional | Critical | — |
| TC-FUNC-042 | YoY positive growth shows green upward badge | Functional | High | — |
| TC-FUNC-043 | YoY decline shows red downward badge | Functional | High | — |
| TC-FUNC-044 | YoY trend chart renders dashed prior-year line overlay | Functional | High | — |
| TC-FUNC-045 | YoY ranked list shows prior-year amount, rank change, and NEW badge | Functional | High | — |
| TC-FUNC-046 | Claims Insights "View All" navigates to All Claims with pre-applied filter | Functional | Medium | — |
| TC-FUNC-047 | Document checklist counter in Claim Procedure updates live | Functional | Low | — |
| TC-FUNC-048 | Sidebar navigation highlights active route | Functional | Medium | — |
| TC-FUNC-049 | Back button on Policy Drilldown returns to Dashboard | Functional | Medium | — |
| TC-FUNC-050 | Policy Drilldown Financial Summary table includes YoY columns when YoY is On | Functional | High | — |
| TC-FUNC-051 | HR Portal Reports page renders report cards (Claims History, Endorsement) | Functional | High | 🆕 **New** |
| TC-FUNC-052 | Claims History table loads after policy selection with correct columns | Functional | Critical | 🆕 **New** |
| TC-FUNC-053 | Claims History Claim Type and Status filters narrow table rows | Functional | High | 🆕 **New** |
| TC-FUNC-054 | Endorsement Report table loads without policy selection | Functional | High | 🆕 **New** |
| TC-FUNC-055 | Backend CSV download for Claims History triggers browser save-file dialog | Functional | High | 🆕 **New** |
| TC-FUNC-056 | Backend CSV download for Endorsement Report downloads correctly | Functional | High | 🆕 **New** |
| TC-EDGE-001 | loggedIn count exceeds totalEligible — percent capped at 100% | Edge | High | — |
| TC-EDGE-002 | Loss Ratio exactly equals 100% — no red flag | Edge | Medium | — |
| TC-EDGE-003 | Agreement end date is exactly 60 days from today — shows red | Edge | Medium | — |
| TC-EDGE-004 | Agreement end date is 61 days from today — no red flag | Edge | Medium | — |
| TC-EDGE-005 | Process Claim 5 stage KPIs sum equals Total In Process | Edge | High | — |
| TC-EDGE-006 | Policy with no claims in window — hospital row stays in directory | Edge | Medium | — |
| TC-EDGE-007 | Employee with no dependents — section shows empty list | Edge | Medium | — |
| TC-EDGE-008 | First policy year — YoY indicators suppressed (not shown as 0%) | Edge | Critical | — |
| TC-EDGE-009 | Company with no empanelled hospitals | Edge | Medium | — |
| TC-EDGE-010 | Pagination at maximum 500 rows per page | Edge | Medium | — |
| TC-EDGE-011 | Custom date range spanning policy year boundary | Edge | Medium | — |
| TC-EDGE-012 | Top 10 Insights — entity in current top 10 absent from prior year (NEW badge) | Edge | High | — |
| TC-EDGE-013 | Sum Insured YoY badge suppressed when tier unchanged | Edge | Medium | — |
| TC-EDGE-014 | Claims Analysis local date filter does not affect other widgets | Edge | Medium | — |
| TC-EDGE-015 | Prior-year window with no records — YoY null not zero | Edge | Critical | — |
| TC-FUNC-057 | Enrollment Report card expands and loads employee data without filter | Functional | High | 🆕 **New** |
| TC-FUNC-058 | Enrollment Status filter narrows enrollment table rows | Functional | High | 🆕 **New** |
| TC-FUNC-059 | Premium Report card expands and loads policy premium data | Functional | High | 🆕 **New** |
| TC-FUNC-060 | Disabled "Coming soon" cards cannot be expanded or clicked | Functional | High | 🆕 **New** |
| TC-EDGE-016 | Claims History table stays empty when no policy is selected | Edge | High | 🆕 **New** |
| TC-EDGE-017 | Policy with no claims in selected filters shows empty state (no error) | Edge | Medium | 🆕 **New** |
| TC-NEG-001 | Request with invalid/expired JWT returns 401 | Negative | Critical | — |
| TC-NEG-002 | Request with valid JWT but wrong role returns 403 | Negative | Critical | — |
| TC-NEG-003 | Unknown report key returns 400 (not 404) | Negative | High | — |
| TC-NEG-004 | Missing companyId in request body returns 400 | Negative | High | — |
| TC-NEG-005 | Export with unsupported format (e.g., csv) for Claims module | Negative | High | — |
| TC-NEG-006 | Export with entirely invalid format string returns 400 | Negative | Medium | — |
| TC-NEG-007 | Search with SQL special characters does not crash or return error | Negative | High | — |
| TC-NEG-008 | Pagination offset beyond total record count returns empty rows | Negative | Medium | — |
| TC-NEG-009 | Policy selector with invalid policyType value returns 400 | Negative | Medium | — |
| TC-NEG-010 | Partial export failure — no partial file delivered | Negative | High | — |
| TC-NEG-011 | RBAC failure on Policy Drilldown returns access-denied screen | Negative | High | — |
| TC-NEG-012 | Missing E-Card record — "View" button is disabled with tooltip | Negative | Medium | — |
| TC-NEG-013 | policy_claim_history called without policyId returns 400 | Negative | High | 🆕 **New** |
| TC-NEG-014 | Download API with zero rows returns an empty CSV (no crash) | Negative | Medium | 🆕 **New** |
| TC-SEC-001 | No Authorization header — request rejected with 401 | Security | Critical | — |
| TC-SEC-002 | JWT with mismatched companyId — cannot access another company's data | Security | Critical | — |
| TC-SEC-003 | SQL injection via report placeholder field | Security | Critical | — |
| TC-SEC-004 | Brute-force JWT token tampering | Security | High | — |
| TC-SEC-005 | RBAC: non-HR_ADMIN role (e.g. EMPLOYEE) cannot access any HR Analytics endpoint | Security | Critical | — |
| TC-SEC-006 | XSS attempt via search/filter fields | Security | High | — |
| TC-PERF-001 | HR Dashboard initial load completes within 2 seconds | Performance | Critical | — |
| TC-PERF-002 | Policy Drilldown global KPI + Overview loads within 2 seconds | Performance | Critical | — |
| TC-PERF-003 | Section/tab switch first load completes within 1 second | Performance | High | — |
| TC-PERF-004 | Data load of up to 1,000 records completes within 2 seconds | Performance | High | — |
| TC-PERF-005 | Export file generation completes within 5 seconds | Performance | High | — |
| TC-PERF-006 | Simultaneous widget reload on policy selector change | Performance | High | — |
| TC-INT-001 | All data loads exclusively through POST /hr/report/generate/:report | Integration | Critical | — |
| TC-INT-002 | All exports route through POST /hr/report/download/:report | Integration | Critical | — |
| TC-INT-003 | Policy selector change triggers simultaneous reload of all page widgets | Integration | Critical | — |
| TC-INT-004 | Single widget API failure does not break the rest of the page | Integration | High | — |
| TC-INT-005 | Policy Drilldown global KPI bar failure shows full-page error with retry | Integration | High | — |
| TC-INT-006 | Claims Insights Hospital widget "View All" passes hospital filter to All Claims | Integration | High | — |
| TC-INT-007 | GET /hr/report/reports_list returns discovery catalogue | Integration | Medium | — |
| TC-INT-008 | YoY toggle state never triggers a re-fetch | Integration | High | — |
| TC-ACC-001 | Sidebar is fully keyboard-navigable with Tab and Enter | Accessibility | High | — |
| TC-ACC-002 | Policy selector dropdown is operable by keyboard | Accessibility | High | — |
| TC-ACC-003 | KPI cards have ARIA labels readable by screen reader | Accessibility | High | — |
| TC-ACC-004 | Threshold-driven colour flags have sufficient colour contrast | Accessibility | High | — |
| TC-ACC-005 | Table columns have correct ARIA role and scope attributes | Accessibility | Medium | — |
| TC-ACC-006 | Dashboard renders correctly on tablet viewport | Accessibility | High | — |
| TC-REG-001 | YoY badge never shows "0%" or "—" when prior data is absent | Regression | Critical | — |
| TC-REG-002 | Enrollment filter reset does not clear global policy selector | Regression | High | — |
| TC-REG-003 | Process Claim tab has no YoY indicators | Regression | High | — |
| TC-REG-004 | Claim Procedure tab makes no API calls | Regression | High | — |
| TC-REG-005 | Partial export failure delivers no file and shows error toast | Regression | High | — |
| TC-REG-006 | Soft-deleted records never appear in any list or aggregate | Regression | Critical | — |
| TC-DATA-001 | Soft-deleted policy/claim/employee records excluded from all queries | Data Integrity | Critical | — |
| TC-DATA-002 | YoY change percent returns NULL (not 0) when prior-year window has no data | Data Integrity | Critical | — |
| TC-DATA-003 | Missing claim financial values render as "—" not "0" | Data Integrity | High | — |
| TC-DATA-004 | Total Premium formula: Inception + Addition − Deletion + Top-Up | Data Integrity | Critical | — |
| TC-DATA-005 | TAT for closed/paid claims = settlement date − claim date | Data Integrity | High | — |
| TC-DATA-006 | TAT for open claims = today − claim date | Data Integrity | High | — |
| TC-DATA-007 | Risk Level Low/Medium/High derived correctly from approval/rejection/settlement thresholds | Data Integrity | High | — |
| TC-DATA-008 | Claim Ratio = Incurred Claims / Earned Premium × 100 | Data Integrity | High | — |
| TC-DATA-009 | Avg Claim = Total Claim Amount / Claim Count | Data Integrity | Medium | — |
| TC-DATA-010 | Net Liability = Paid + Outstanding + Admin Charges | Data Integrity | Medium | — |
| TC-API-001 | GET on /hr/report/generate/:report returns 405 Method Not Allowed | API | High | — |
| TC-API-002 | POST /hr/report/generate/:report without Authorization header returns 401 | API | Critical | — |
| TC-API-003 | POST /hr/report/generate/:report with malformed JSON body returns 400 | API | High | — |
| TC-API-004 | POST /hr/report/download/:report without format query param returns 400 | API | High | — |
| TC-API-005 | GET /hr/report/reports_list with valid JWT returns 200 with report catalogue | API | Medium | — |
| TC-API-006 | POST /hr/report/generate/nonexistent_key returns 400 (not 404) | API | High | — |
| TC-API-007 | Successful POST /hr/report/generate returns 201 with data.rows envelope | API | Critical | — |
| TC-API-008 | Export success returns 200 with binary file and Content-Disposition header | API | High | — |
| TC-API-009 | Pagination params: default 50 rows; max 500 rows enforced by DTO | API | Medium | 🔁 **Updated** |
| TC-API-010 | companyId in request body mismatch with JWT session company returns 400 | API | Critical | — |
| TC-API-011 | POST /hr/report/generate/policy_claim_history with valid policyId returns 201 with data.rows | API | Critical | 🆕 **New** |
| TC-API-012 | POST /hr/report/generate/endorsement_list with valid companyId and empty policyId returns all endorsements | API | High | 🆕 **New** |
| TC-API-013 | POST /hr-module/generate/ibp_hr_employee_listing with all 6 params returns employee rows | API | High | 🆕 **New** |
| TC-API-014 | POST /hr-module/generate/company_policy_details_summary with companyId returns policy rows | API | High | 🆕 **New** |
| TC-API-015 | POST /hr-module/download/:reportKey returns blob with Content-Disposition: attachment header | API | Critical | 🆕 **New** |

---

## 1. Functional Test Cases

### TC-FUNC-001 — HR Dashboard loads with all KPI sections populated

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin user is authenticated. Active GMC policy exists for the company. Claims, enrollment, and demographic data are present for the current policy period.
**Test Data:** Valid HR_ADMIN JWT. Company with GMC, GTL, GPA policies. Policy period: 01 Apr 2025 – 31 Mar 2026.

**Test Steps:**
1. Log in as an HR Admin user.
2. Navigate to `/hr/dashboard`.
3. Observe all widget sections: Premium Summary, Policies & Sub-Components, Claims Analysis, Enrollment Status, Demographics Breakdown, Top 10 Claim Insights.

**Expected Result:** All 6 widget sections render with populated data. No empty or error states on any widget. The policy type filter defaults to the first active GMC policy. Page load completes without console errors.

---

### TC-FUNC-002 — Policy type filter refreshes all widgets simultaneously

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin is on `/hr/dashboard`. Company has at least two policy types (e.g. GMC and GTL).
**Test Data:** Policy type selector options: All Policies, GMC, GTL, GPA.

**Test Steps:**
1. With the dashboard fully loaded (default GMC), change the policy type filter to "GTL".
2. Observe loading state across all data-driven widgets.
3. Observe final loaded state of all widgets.

**Expected Result:** All data-driven widgets simultaneously show a loading skeleton. All widgets reload in parallel and reflect GTL policy data once resolved. The Claim Procedure tab (if present) and the Welcome/Header strip do not trigger any reload.

---

### TC-FUNC-003 — Premium Summary KPI values are computed correctly

**Category:** Functional
**Priority:** Critical
**Preconditions:** Dashboard loaded with GMC policy selected. Known premium values in the database for the current policy period.
**Test Data:** Inception Premium = ₹10,00,000; Addition Premium = ₹2,00,000; Deletion Premium = ₹50,000; Top-Up Premium = ₹1,00,000.

**Test Steps:**
1. Navigate to `/hr/dashboard`.
2. Observe the five Premium Summary KPI cards.
3. Verify each card value against known database values.

**Expected Result:** Cards display: Inception = ₹10,00,000; Addition = ₹2,00,000; Deletion = ₹50,000; Top-Up = ₹1,00,000; Total = ₹12,50,000 (10,00,000 + 2,00,000 − 50,000 + 1,00,000). Formula per PRD §5.2.

---

### TC-FUNC-004 — Policy cards grid renders one card per matching policy

🔁 **Updated** — "Claim Utilisation" field renamed to ICR (Incurred Claim Ratio) per TRD §5.3 (icrPercent replaces claimUtilisationPercent). Enrollment breakdown expanded to three states. CD safe-limit companion field added.

**Category:** Functional
**Priority:** High
**Preconditions:** Company has 3 GMC policies active in the current period.
**Test Data:** Policy type filter set to "GMC".

**Test Steps:**
1. Navigate to `/hr/dashboard`.
2. Set policy type filter to "GMC".
3. Observe the Policies & Sub-Components grid.

**Expected Result:** Exactly 3 policy cards are shown in the grid. Each card contains: Policy Name, Insurer, Total Lives, Net Premium, CD Balance (with CD Safe-Limit warning badge when cdBalance < cdSafeLimit), Total Claims, Policy Period, Sub-Plans count, Enrollment breakdown (enrolledPercent / inProgressPercent / notEnrolledPercent — three enrollment states), ICR (icrPercent — current period incurred claim ratio; companion fields: icrSamePeriodLYPercent, icrFullYearAvgLY, icrForecastPercent), Member Activity (memberAdditions / memberDeletions). A "View Details →" button is present on each card footer. Per TRD §5.3 SQL seed (`dashboard_policy_cards`).

---

### TC-FUNC-005 — Claims Analysis KPI cards display correct values

**Category:** Functional
**Priority:** Critical
**Preconditions:** Known claim data seeded: Total Claims = ₹38,50,000 (45 claims); Paid = ₹22,00,000; Pending = ₹16,50,000; Earned Premium = ₹50,00,000.
**Test Data:** Active GMC policy. Claim data per above.

**Test Steps:**
1. Navigate to `/hr/dashboard`.
2. Observe Claims Analysis section KPI row.
3. Verify Total Claims, Paid Claims, Pending Claims, and Claim Ratio values.

**Expected Result:** Total Claims = ₹38,50,000; Paid Claims = ₹22,00,000; Pending Claims = ₹16,50,000; Claim Ratio = 77.0% (38,50,000 / 50,00,000 × 100). Claim Ratio is rendered as a small donut inline in the card (per SDS §4.1.4).

---

### TC-FUNC-006 — Claims Monthly Trend renders Cashless/Reimbursement stacked bars

**Category:** Functional
**Priority:** High
**Preconditions:** Monthly claim data exists for at least 3 months. Dashboard loaded.
**Test Data:** Sub-filter set to "Last 3 Months". Claim Type = "All".

**Test Steps:**
1. Navigate to `/hr/dashboard`, Claims Analysis section.
2. Select "Last 3 Months" filter chip.
3. Observe the stacked bar chart.

**Expected Result:** Three bars render, one per month. Each bar is split into Cashless (one colour) and Reimbursement (another colour) segments. X-axis shows month labels (e.g. "Mar '26"). Toolbar shows Amount/Count toggle and Stacked/Table view toggle.

---

### TC-FUNC-007 — Enrollment Status KPI cards display count and percent

**Category:** Functional
**Priority:** High
**Preconditions:** Enrollment data seeded: 200 eligible members, 150 logged in, 50 never logged in, 130 enrollment confirmed.
**Test Data:** Active GMC policy with above enrollment data.

**Test Steps:**
1. Navigate to `/hr/dashboard`.
2. Observe the Enrollment Status widget (3 KPI cards).

**Expected Result:** "Logged In" card = 150 members, 75%; "Not Logged In" card = 50 members, 25%; "Enrollment Confirmed" card = 130 members, 65%. YoY badges rendered if prior-year data exists.

---

### TC-FUNC-008 — Demographics Breakdown shows employee/dependent split

**Category:** Functional
**Priority:** High
**Preconditions:** Demographic data exists: 80 employees at inception, 20 new additions (15 employees + 5 dependents), 5 deletions, 95 total active.
**Test Data:** Active GMC policy.

**Test Steps:**
1. Navigate to `/hr/dashboard`.
2. Observe the Demographics Breakdown quadrant cards.

**Expected Result:** Four cards: Inception Members, New Additions, Deletions, Total Active. Each card shows total count plus employee count, dependent count, and respective percentages. Stacked horizontal bar renders within each card. Inception Members has no YoY badge. Additions, Deletions, Total Active carry YoY badges when prior data exists.

---

### TC-FUNC-009 — Top 10 Insights tab switching between Employees/Hospitals/Diseases

**Category:** Functional
**Priority:** High
**Preconditions:** Claim data exists across multiple employees, hospitals, and disease categories.
**Test Data:** Active GMC policy. Claim Type = "All"; Status = "All"; Member Type = "All".

**Test Steps:**
1. Navigate to `/hr/dashboard`, Top 10 Claim Insights widget.
2. Click "Employees" tab — observe horizontal bar chart.
3. Click "Hospitals" tab — observe chart reloads with hospital data.
4. Click "Diseases" tab — observe chart reloads with disease data.

**Expected Result:** Each tab switch triggers a fresh API call to the corresponding report key (`dashboard_top10_employees`, `dashboard_top10_hospitals`, `dashboard_top10_diseases`). Charts render top 10 entities by claim amount. Bar colours per SDS §4.1.7: Employees = blue, Hospitals = purple, Diseases = green. Shared filters (Claim Type, Status, Member Type) apply across all tabs.

---

### TC-FUNC-010 — Policy Drilldown opens from "View Details" on policy card

**Category:** Functional
**Priority:** Critical
**Preconditions:** Dashboard is loaded with at least one GMC policy card visible.
**Test Data:** Policy ID = `pol_gmc_001`.

**Test Steps:**
1. Navigate to `/hr/dashboard`.
2. Click "View Details →" on a policy card.
3. Observe navigation and page content.

**Expected Result:** Browser navigates to `/hr/dashboard/policy/pol_gmc_001`. Policy Drilldown page loads with the policy name displayed prominently, an Active/Inactive/Expired status badge, and the global KPI bar loading as a skeleton first.

---

### TC-FUNC-011 — Policy Drilldown global KPI bar blocks tab access until resolved

**Category:** Functional
**Priority:** Critical
**Preconditions:** User has navigated to a Policy Drilldown page. The `policy_header_kpi` API call is in-flight (simulate slow network).
**Test Data:** Policy ID with known KPI data. Network throttled to simulate 1.5 s delay.

**Test Steps:**
1. Navigate to `/hr/dashboard/policy/:policyId` with network throttled.
2. Attempt to click any tab (Overview, Claims Analytics, Member Analytics, Financial Insights) while the KPI bar is still loading.
3. Wait for KPI bar to fully resolve.
4. Attempt to click a tab again.

**Expected Result:** While the KPI bar is loading, tab content area shows a skeleton/loading state and tab interactions are blocked (no data fetch initiated). Once the KPI bar resolves, tabs become accessible and clicking a tab loads its data. Null KPI values render as "—".

---

### TC-FUNC-012 — Policy Drilldown Overview tab loads all sections

**Category:** Functional
**Priority:** High
**Preconditions:** Policy Drilldown is loaded. The Overview tab is the default active tab.
**Test Data:** Policy with sub-components, enrollment data, claims data, top hospitals, and disease categories.

**Test Steps:**
1. Navigate to `/hr/dashboard/policy/:policyId`.
2. Wait for KPI bar to resolve.
3. Observe Overview tab content.

**Expected Result:** The following sections all render: Policy Sub-Components (table with columns per SDS §4.2.3), Enrollment Progress (full-width progress bar + 3 stat boxes), Claim Utilisation (donut + 3 KPIs), Monthly Claim Trend (dual-line chart, last 12 months), Top 5 Hospitals Used (ranked list with YoY rank-change badge), Disease Category Breakdown (horizontal bars, top 6).

---

### TC-FUNC-013 — Claims Analytics tab filters apply cumulatively

**Category:** Functional
**Priority:** High
**Preconditions:** Policy Drilldown is open. Claims Analytics tab is active.
**Test Data:** Claims data with mixed statuses (Paid, Outstanding, Rejected) and types (Cashless, Reimbursement).

**Test Steps:**
1. Navigate to Claims Analytics tab.
2. Set Period filter to "Last 6 Months".
3. Set Claim Type to "Cashless".
4. Set Status to "Paid".
5. Observe chart and table updates.
6. Click "Reset".

**Expected Result:** Each filter narrows the data cumulatively (AND logic). After all three filters, only cashless paid claims from the last 6 months appear. Clicking Reset clears all three filters and data reverts to the unfiltered state for the section; global policy selector is unchanged.

---

### TC-FUNC-014 — Member Analytics tab renders all charts and member table

**Category:** Functional
**Priority:** High
**Preconditions:** Policy Drilldown open. Member data with age diversity, both genders, multiple departments.
**Test Data:** 100 members across 5 departments, ages ranging 22–62, 60% male/40% female.

**Test Steps:**
1. Click Member Analytics tab.
2. Observe all 5 sub-sections.

**Expected Result:** Members by Age Group grouped bar chart renders with 6 age bands (15-25, 26-35, 36-45, 46-55, 56-65, 65+), each bar split into Employees (blue) and Dependents (green). Gender Distribution donut renders with male/female split. Employees vs Dependents donut renders. Department-wise Enrollment shows progress bars per department. Member Table is searchable, with Excel export available.

---

### TC-FUNC-015 — Financial Insights Loss Ratio > 100% triggers red flag

**Category:** Functional
**Priority:** High
**Preconditions:** Policy Drilldown open. Financial data seeded: Total Claim Paid = ₹55,00,000; Total Premium = ₹50,00,000.
**Test Data:** Loss Ratio will compute to 110%.

**Test Steps:**
1. Click Financial Insights tab on Policy Drilldown.
2. Observe the Loss Ratio KPI card.

**Expected Result:** Loss Ratio displays "110.0%". The KPI value is rendered in red to signal an at-risk condition (per SDS §4.6.4 and PRD §6.6). Other financial KPIs (Total Premium, Total Claim Paid, Outstanding Claims) are unaffected visually.

---

### TC-FUNC-016 — Enrollment tab KPI cards display with active/inactive split

**Category:** Functional
**Priority:** High
**Preconditions:** Enrollment data seeded: 300 total lives (250 active, 50 inactive), 180 employees, 120 dependents, 30 additions, 10 deletions, 270 total enrolled.
**Test Data:** Active GMC policy.

**Test Steps:**
1. Navigate to `/hr/enrollment`.
2. Observe the 6 KPI cards at the top.

**Expected Result:** Cards: Total Lives = 300 (sub-line: 250 active / 50 inactive), Employees = 180, Dependents = 120, Total Addition = 30, Total Deletion = 10, Total Enrolled = 270. YoY badges visible on all 6 cards where prior-year data exists.

---

### TC-FUNC-017 — Enrollment search by employee name, ID, email, phone

**Category:** Functional
**Priority:** High
**Preconditions:** Enrollment list has 50+ employee records including employee "Priya Sharma" with ID EMP-0042, email priya@example.com, phone 9876543210.
**Test Data:** Search term = "Priya".

**Test Steps:**
1. Navigate to `/hr/enrollment`, Enrollment tab.
2. Type "Priya" in the search bar.
3. Observe filtered results.
4. Clear search. Search by "EMP-0042". Observe results.
5. Clear search. Search by "priya@example.com". Observe results.

**Expected Result:** Each search returns exactly the matching record(s). The 15-column employee table reflects the filtered results. Searching by partial name ("Priya") returns all employees whose name contains "Priya".

---

### TC-FUNC-018 — Enrollment filter chips apply cumulatively; reset clears only list filters

**Category:** Functional
**Priority:** High
**Preconditions:** Enrollment list loaded with diverse member data.
**Test Data:** Policy selector = GMC (globally set). Filters: Member Type = "Employee"; Status = "Active"; Gender = "Female".

**Test Steps:**
1. Navigate to `/hr/enrollment`.
2. Apply Member Type = "Employee", Status = "Active", Gender = "Female".
3. Observe filtered results.
4. Click "Reset" button.
5. Observe state of filters and global policy selector.

**Expected Result:** After applying filters, only active female employees appear. After Reset, all three list-level filters clear and the full enrollment list reloads. The global policy selector remains unchanged at GMC (per PRD §7.1).

---

### TC-FUNC-019 — "See Details" navigates to Employee Detail view

**Category:** Functional
**Priority:** High
**Preconditions:** Enrollment list is loaded with at least one employee row.
**Test Data:** Employee ID = EMP-0042.

**Test Steps:**
1. Navigate to `/hr/enrollment`.
2. Locate an employee row and click the Actions menu.
3. Click "See Details".

**Expected Result:** Browser navigates to `/hr/enrollment/employee/EMP-0042`. Employee Detail page loads with the correct employee's profile information, journey stage strip, summary cards, and 5 accordion sections.

---

### TC-FUNC-020 — Employee Detail journey stages show correct progression state

**Category:** Functional
**Priority:** Medium
**Preconditions:** An employee who has completed Application, Document, and HR Verification stages (stage 4 = Insurer Approval is active).
**Test Data:** Employee at "Insurer Approval" stage.

**Test Steps:**
1. Navigate to `/hr/enrollment/employee/:employeeId` for the above employee.
2. Observe the journey stage strip at the top.

**Expected Result:** Stages 1–3 (Application, Document, HR Verification) are shown as checked (completed). Stage 4 (Insurer Approval) is filled/active. Stages 5–6 (E-Card, Coverage Active) are shown as outlined (future). Per SDS §4.3.2.

---

### TC-FUNC-021 — Employee Detail five accordion sections load correct data

**Category:** Functional
**Priority:** High
**Preconditions:** Employee with dependents, at least one claim, and activity log entries exists.
**Test Data:** Employee EMP-0042 with 2 dependents, 3 claims, 5 activity log entries.

**Test Steps:**
1. Navigate to Employee Detail for EMP-0042.
2. Expand "Employee Details" section — verify all fields per PRD §7.2.
3. Expand "Insurance & Policy Details" — verify policy name, enrollment status, sum insured, dates.
4. Expand "Dependents/Beneficiaries" — verify 2 dependent rows.
5. Expand "Claims History" — verify 3 claims with policy number, hospital, type, amounts, status.
6. Expand "Activity Log" — verify 5 timestamped entries with actor/source.

**Expected Result:** Each section renders the correct data from its respective report key (`ibp_hr_employee_profile_summary`, `ibp_hr_employee_dependents`, `ibp_hr_employee_claims_history`, `ibp_hr_employee_activity_log`). All fields match the seeded test data.

---

### TC-FUNC-022 — E-Card modal opens from Enrollment list "View" action

**Category:** Functional
**Priority:** Medium
**Preconditions:** Employee has a valid E-Card record in the system.
**Test Data:** Employee EMP-0042 with active E-Card.

**Test Steps:**
1. Navigate to `/hr/enrollment`, Enrollment tab.
2. Locate EMP-0042 in the list.
3. Click "View" in the E-Card column.
4. Observe the modal.
5. Close modal by clicking the × button.
6. Close modal by clicking the backdrop.

**Expected Result:** Modal opens with E-Card preview (front/back), member details, and a PDF download button. Modal closes on both × click and backdrop click.

---

### TC-FUNC-023 — Endorsement tab overview metrics and cumulative employee metrics

**Category:** Functional
**Priority:** High
**Preconditions:** Endorsement data seeded with Inception + 2 Addition endorsements. Net Gross Premium known.
**Test Data:** Net Gross Premium = ₹45,00,000; Total Endorsements = 3; Employees at inception = 200, in addition = 30, in deletion = 10, active = 220.

**Test Steps:**
1. Navigate to `/hr/enrollment`.
2. Click "Endorsement" tab.
3. Observe overview block and 4×2 cumulative metric tiles.

**Expected Result:** Two large stat tiles show Net Gross Premium = ₹45,00,000 and Total Endorsements = 3. The 4×2 grid shows employee and lives metrics per seeded data. Premium Information table shows 10 rows of premium components.

---

### TC-FUNC-024 — Endorsement accordion expand shows employee and premium snapshots

**Category:** Functional
**Priority:** Medium
**Preconditions:** At least one Addition endorsement exists.
**Test Data:** Endorsement #2 (Addition type, 5 additions, 2 deletions, net gross = ₹4,50,000).

**Test Steps:**
1. Navigate to Endorsement tab.
2. Locate endorsement #2 in the accordion (collapsed state).
3. Click to expand.
4. Observe the two snapshot tables.

**Expected Result:** Collapsed card shows: endorsement number, "Addition" type chip, date, summary strip (5 additions, 2 deletions, active count, net gross). Expanded state reveals Employee info snapshot table and Premium component snapshot table reflecting values at the time of that endorsement.

---

### TC-FUNC-025 — Employee Analytics Claims by Tenure bar chart renders

**Category:** Functional
**Priority:** Medium
**Preconditions:** Employee Analytics tab accessible. Claims data spans multiple tenure buckets.
**Test Data:** Claims distributed across 0-1yr, 1-2yr, 2-5yr, 5-10yr, 10+yr buckets.

**Test Steps:**
1. Navigate to `/hr/enrollment`, Employee Analytics tab.
2. Select "Claims by Tenure" sub-tab.
3. Toggle between "By Count" and "By Amount" modes.
4. Apply Department filter.

**Expected Result:** Bar chart renders with 5 tenure buckets on X-axis. "By Count" shows claim counts; "By Amount" shows claim amounts. Applying Department filter updates the chart. YoY prior-year series visible as ghost bars (per SDS §4.6.2).

---

### TC-FUNC-026 — Employee Analytics High Claim Employees ranked table

**Category:** Functional
**Priority:** Medium
**Preconditions:** Claims data exists for multiple employees.
**Test Data:** Top claimers known: Employee A = ₹5,00,000 (rank 1), Employee B = ₹3,50,000 (rank 2).

**Test Steps:**
1. Navigate to Employee Analytics tab.
2. Click "High Claim Employees" sub-tab.
3. Observe ranked table.

**Expected Result:** Table rows show: Employee, Department, City, Age, Claim Count, Total Spent. Employee A appears at rank 1. YoY columns (Total Spent Prev Year, YoY Change %, Rank Change badge) are visible. Per SDS §4.3.4 and PRD §7.4.

---

### TC-FUNC-027 — Claims Module All Claims tab with 6 KPIs and full table

**Category:** Functional
**Priority:** Critical
**Preconditions:** Claims data exists: 45 total claims — 20 Paid, 10 Outstanding, 8 Rejected, 4 Closed, 3 Denied.
**Test Data:** Active policy with above claim distribution.

**Test Steps:**
1. Navigate to `/hr/claims`.
2. Observe the 6 KPI cards and the claims table.

**Expected Result:** KPI cards: Total Claims = 45, Paid = 20, Outstanding = 10, Rejected = 8, Closed = 4, Denied = 3. Claims table shows 11 columns: Claim Number, Employee ID, Employee Name (with department subtext), Relation, TPA ID, Claim Type, Claim Date, Claim Amount, Settled Amount, Status, TAT/Aging. Pagination defaults to 10 records per page (per SDS §4.4.1). YoY badges on all 6 KPI cards.

---

### TC-FUNC-028 — Process Claim tab shows active pipeline with stage breakdown

**Category:** Functional
**Priority:** Critical
**Preconditions:** Active claims exist in the processing pipeline across multiple stages.
**Test Data:** Total In Process = 15; Under Review = 5; Medical Assessment = 3; Approval Pending = 4; Settlement = 3.

**Test Steps:**
1. Navigate to `/hr/claims`.
2. Click "Process Claim" tab.
3. Observe KPI row, pipeline table, and footer.

**Expected Result:** Subtitle shows "15 of Y claims in active processing pipeline." KPI row: Total In Process = 15, Under Review = 5, Medical Assessment = 3, Approval Pending = 4, Settlement = 3. The 5 stage KPIs sum to 15 (critical per PRD §8.3). Pipeline table shows per-claim stage progress bar. Footer shows total ₹ value. No export controls present (per PRD §8.3). No YoY badges on this tab.

---

### TC-FUNC-029 — Process Claim Refresh reloads KPIs and pipeline list

**Category:** Functional
**Priority:** High
**Preconditions:** Process Claim tab is active. A new claim has entered the pipeline since the last load.
**Test Data:** One new claim enters "Under Review" stage between initial load and refresh.

**Test Steps:**
1. Navigate to Process Claim tab. Note KPI counts.
2. Click the Refresh button (top-right).
3. Observe loading state and updated data.

**Expected Result:** On refresh click, both the KPI row and the pipeline table show loading skeletons simultaneously. After resolve, both reflect the updated pipeline state including the new claim. The Under Review count increases by 1 and Total In Process increases by 1.

---

### TC-FUNC-030 — Claims Insights tab 4 KPIs and 5 analytic views

**Category:** Functional
**Priority:** High
**Preconditions:** Claims data available across hospitals, cities, departments, and amount bands.
**Test Data:** 45 total claims, ₹38,50,000 total amount; Approval Rate = 82%.

**Test Steps:**
1. Navigate to `/hr/claims`.
2. Click "Insights" tab.
3. Observe KPI row and all 5 chart widgets.

**Expected Result:** KPI row: Total Claims = 45, Total Amount = ₹38,50,000, Avg Claim Amount = ₹85,556, Approval Rate = 82%. Five widgets render: Claims Trend (line chart), Claims by Hospital (horizontal bar), Claims by City (vertical bar), Claims by Amount Band (vertical bar with 4 bands), Claims by Department (donut + legend). Each widget has a "View All" CTA and an Excel export icon.

---

### TC-FUNC-031 — Claim Procedure tab renders in Cashless and Reimbursement modes

**Category:** Functional
**Priority:** High
**Preconditions:** User is on the Claims module.
**Test Data:** No API calls expected. Static content only.

**Test Steps:**
1. Navigate to `/hr/claims`.
2. Click "Claim Procedure" tab.
3. Observe default mode (Cashless).
4. Click "Reimbursement" mode toggle.
5. Open browser network tab and verify no API calls are triggered.

**Expected Result:** Both modes render all panels: 7-step accordion, Helpline Numbers, Download Forms (4 buttons), Policy Notes, Escalation Contact, Document Checklist (interactive checkboxes with counter), Expected Approval Timeline. Claims Status Meaning Table (7 rows per PRD §8.5) appears in both modes. Zero API calls are made. No dependence on policy/period global controls.

---

### TC-FUNC-032 — Hospital Network Hospitals tab directory with search and filters

**Category:** Functional
**Priority:** High
**Preconditions:** 50 empanelled hospitals exist across 10 cities and multiple specialties.
**Test Data:** Search term = "Apollo". Filter: Cashless = "Yes"; Status = "Active".

**Test Steps:**
1. Navigate to `/hr/hospitals`.
2. Observe the Network Hospitals tab.
3. Search for "Apollo".
4. Apply Cashless = "Yes" and Status = "Active" filters.

**Expected Result:** Directory table shows all 50 hospitals on initial load (paginated). Searching "Apollo" narrows results to Apollo-named hospitals. Applying Cashless + Status filters further narrows results. Each row shows: Hospital Name (avatar + name + type), City (with state), Specialties (tag pills), Cashless badge, Total Claims, Total Amount, Avg Claim, Status, "View Details" action. Default sort: Total Claims descending.

---

### TC-FUNC-033 — Hospital Claims by Hospital top 6 cards render

**Category:** Functional
**Priority:** Medium
**Preconditions:** At least 6 hospitals have claims in the current period.
**Test Data:** Top hospital = Apollo Mumbai (₹12,00,000, 30 claims, top disease = Cardiac).

**Test Steps:**
1. Navigate to `/hr/hospitals`.
2. Click "Claims by Hospital" tab.
3. Observe the 2×3 card grid.

**Expected Result:** 6 hospital cards rendered in a 2×3 grid. Rank 1 card has a gold rank badge, rank 2 silver, rank 3 bronze, ranks 4–6 blue. Apollo Mumbai card shows at rank 1 with amber-coloured total claims count, total amount, and "Cardiac" disease chip. Each card shows prior-year amount and rank-change badge (YoY per §4A.6). New entrants show "NEW" badge.

---

### TC-FUNC-034 — Hospital Performance tab Risk Level classification

**Category:** Functional
**Priority:** High
**Preconditions:** Hospital performance data seeded with known approval/rejection/settlement values.
**Test Data:** Hospital A: Approval = 92%, Rejection = 8%, Avg Settlement = 5 days → Low risk. Hospital B: Approval = 87%, Rejection = 12%, Avg Settlement = 7 days → Medium risk. Hospital C: Approval = 82%, Rejection = 18%, Avg Settlement = 10 days → High risk.

**Test Steps:**
1. Navigate to Hospital Network → Performance tab.
2. Observe the performance table rows for Hospitals A, B, C.

**Expected Result:** Hospital A has "Low" green badge. Hospital B has "Medium" amber badge. Hospital C has "High" red badge. Approval Rate columns use green/amber/red bar fill per SDS §4.6.4. Default sort is Approval Rate descending. High Risk Hospitals KPI card = 1.

---

### TC-FUNC-035 — Hospital Agreements tab 60-day expiry KPI and registry

**Category:** Functional
**Priority:** High
**Preconditions:** 10 agreements exist. 2 agreements expire within 60 days. Today's date = 2026-05-05.
**Test Data:** Agreement 1 end date = 2026-06-01 (27 days away). Agreement 2 end date = 2026-07-03 (59 days away). Agreement 3 end date = 2026-07-05 (61 days away).

**Test Steps:**
1. Navigate to Hospital Network → Agreements tab.
2. Observe KPI cards.
3. Observe Agreement Registry table.

**Expected Result:** "Expiring in 60 Days" KPI = 2 (Agreements 1 and 2). Card uses amber warning accent styling (count > 0). In the registry, Agreement 1 and 2 end dates are rendered in red. Agreement 3 end date is rendered in normal styling. Registry sorted by Agreement End ascending (soonest first).

---

### TC-FUNC-036 — Dashboard export — Policies (Excel, PDF), Claims (Excel, PDF), Top 10 (Excel)

**Category:** Functional
**Priority:** High
**Preconditions:** Dashboard is loaded with data.
**Test Data:** Active GMC policy with claim and Top 10 data.

**Test Steps:**
1. Navigate to `/hr/dashboard`.
2. Click export icon on Policies & Sub-Components widget. Select "Excel". Download file.
3. Click export on same widget. Select "PDF". Download file.
4. Click export icon on Claims Analysis widget. Select "Excel". Download.
5. Click export icon on Top 10 Claim Insights. Observe available formats.

**Expected Result:** Policies widget exports succeed in both Excel and PDF. Claims Analysis exports succeed in Excel and PDF. Top 10 Insights export icon only offers Excel (PDF not listed for this widget per PRD §5.8). All exported files are non-empty with correct `Content-Disposition` headers.

---

### TC-FUNC-037 — Enrollment export supports PDF, CSV, Excel, Word

**Category:** Functional
**Priority:** High
**Preconditions:** Enrollment list has records.
**Test Data:** Enrollment list with 20 records.

**Test Steps:**
1. Navigate to `/hr/enrollment`, Enrollment tab.
2. Click export controls. Observe available format options.
3. Export as CSV. Verify download.
4. Export as Word. Verify download.

**Expected Result:** All four formats available: PDF, CSV, Excel, Word. Each export produces a valid downloadable file. This is the only module offering Word and CSV formats (per PRD §7.1 and PRD §11).

---

### TC-FUNC-038 — Claims module export — Excel and PDF only (no CSV/Word)

**Category:** Functional
**Priority:** High
**Preconditions:** Claims module loaded.
**Test Data:** All Claims tab active.

**Test Steps:**
1. Navigate to `/hr/claims`, All Claims tab.
2. Click the export control.
3. Observe the available format options.

**Expected Result:** Only Excel and PDF formats are offered. CSV and Word options are absent. This enforces PRD §8.6.

---

### TC-FUNC-039 — Hospital Network export — all 4 sections (Excel, PDF)

**Category:** Functional
**Priority:** Medium
**Preconditions:** Hospital Network loaded with data in all 4 tabs.
**Test Data:** Active policy with hospital data.

**Test Steps:**
1. Navigate to Hospital Network → Network Hospitals tab. Export as Excel, then PDF.
2. Claims by Hospital tab. Export as Excel.
3. Performance tab. Export as Excel, then PDF.
4. Agreements tab. Export as Excel, then PDF.

**Expected Result:** All exports succeed per PRD §9.5. Network Hospitals: Excel + PDF. Claims by Hospital: Excel only. Performance: Excel + PDF. Agreements: Excel + PDF. All exported files are non-empty.

---

### TC-FUNC-040 — YoY toggle default On shows badges on all KPI cards

**Category:** Functional
**Priority:** Critical
**Preconditions:** Prior-year data exists for the active policy. User navigates to any analytics page.
**Test Data:** Active GMC policy with prior-year data available.

**Test Steps:**
1. Navigate to `/hr/dashboard` (fresh page load).
2. Observe the YoY toggle state in the page header.
3. Observe Premium Summary KPI cards.

**Expected Result:** YoY toggle is On by default. All KPI cards that carry YoY comparisons display badges (↑ green for growth, ↓ red for decline, neutral for no change). Toggle is labelled "Compare vs Prior Year" positioned right of the policy selector.

---

### TC-FUNC-041 — YoY toggle Off hides all badges and overlays without re-fetching data

**Category:** Functional
**Priority:** Critical
**Preconditions:** Dashboard loaded with YoY On. Network monitoring active.
**Test Data:** Active GMC policy with prior-year data.

**Test Steps:**
1. Load `/hr/dashboard`. Note YoY badges are visible on KPI cards.
2. Open browser Network tab to monitor API calls.
3. Click the YoY toggle to Off.
4. Observe KPI cards and chart overlays.
5. Observe Network tab for any new API calls.

**Expected Result:** All YoY badges disappear from KPI cards. Ghost bar overlays disappear from trend charts. Prior-year columns disappear from ranked lists. Zero new API calls are triggered. The toggle is a pure display-layer control (per PRD §4A.2 and SDS §4.6.5).

---

### TC-FUNC-042 — YoY positive growth shows green upward badge

**Category:** Functional
**Priority:** High
**Preconditions:** Current year total claims amount = ₹38,50,000; prior year = ₹32,00,000.
**Test Data:** YoY change = +20.3%.

**Test Steps:**
1. Navigate to `/hr/dashboard`. Ensure YoY is On.
2. Observe Total Claims KPI card in Claims Analysis.

**Expected Result:** Badge shows "↑ +20.3% vs last year" in green. Hovering the badge shows a tooltip with the absolute prior-year value (₹32,00,000).

---

### TC-FUNC-043 — YoY decline shows red downward badge

**Category:** Functional
**Priority:** High
**Preconditions:** Current year paid claims = ₹22,00,000; prior year = ₹28,00,000.
**Test Data:** YoY change = −21.4%.

**Test Steps:**
1. Navigate to `/hr/dashboard`. Ensure YoY is On.
2. Observe Paid Claims KPI card in Claims Analysis.

**Expected Result:** Badge shows "↓ −21.4% vs last year" in red. Tooltip shows prior-year absolute value (₹28,00,000).

---

### TC-FUNC-044 — YoY trend chart renders dashed prior-year line overlay

**Category:** Functional
**Priority:** High
**Preconditions:** Monthly Claim Trend chart has prior-year data available.
**Test Data:** 12 months of current-year data + 12 months of corresponding prior-year data.

**Test Steps:**
1. Navigate to Policy Drilldown → Overview tab.
2. Observe Monthly Claim Trend dual-line chart with YoY On.

**Expected Result:** Current-year lines render as solid. Prior-year data renders as dashed lines at 40% opacity, same colour family. Legend includes a "Prior Year" entry. Clicking the "Prior Year" legend entry hides/shows prior-year series independently of the global YoY toggle.

---

### TC-FUNC-045 — YoY ranked list shows prior-year amount, rank change, and NEW badge

**Category:** Functional
**Priority:** High
**Preconditions:** Top 10 Employees data includes entities from both current and prior year. One entity is new to the current top 10.
**Test Data:** Employee X = rank 3 (was rank 5 last year → rank change = +2). Employee Y = new entrant (no prior-year rank).

**Test Steps:**
1. Navigate to `/hr/dashboard`, Top 10 Claim Insights → Employees tab.
2. Observe rows for Employee X and Employee Y.

**Expected Result:** Employee X row shows: Prior Year Amount, YoY Change %, Rank Change badge "↑2" in green. Employee Y row shows: Prior Year Amount = 0, YoY Change % = N/A or null, Rank Change badge = "NEW" in blue. Per SDS §4.6.3 and PRD §4A.6.

---

### TC-FUNC-046 — Claims Insights "View All" navigates to All Claims with pre-applied filter

**Category:** Functional
**Priority:** Medium
**Preconditions:** Claims Insights tab is active. "Claims by Hospital" widget is visible.
**Test Data:** Hospital "Apollo Mumbai" appears in the Claims by Hospital chart.

**Test Steps:**
1. Navigate to `/hr/claims` → Insights tab.
2. Click "View All" CTA on the Claims by Hospital widget.
3. Observe navigation target and active filters.

**Expected Result:** Browser navigates to the All Claims tab (`/hr/claims` on the All Claims tab). The Hospital filter is pre-applied with "Apollo Mumbai". Claims table shows only claims for Apollo Mumbai.

---

### TC-FUNC-047 — Document checklist counter in Claim Procedure updates live

**Category:** Functional
**Priority:** Low
**Preconditions:** Claim Procedure tab is active. Document Checklist panel is visible.
**Test Data:** Checklist has 8 items, none checked initially.

**Test Steps:**
1. Navigate to Claims → Claim Procedure tab.
2. Open Document Checklist panel.
3. Check 3 items sequentially.
4. Observe counter.

**Expected Result:** Counter updates live: "0/8 ready" → "1/8 ready" → "2/8 ready" → "3/8 ready" after each check. No API calls are made (purely UI-local state).

---

### TC-FUNC-048 — Sidebar navigation highlights active route

**Category:** Functional
**Priority:** Medium
**Preconditions:** HR Admin is authenticated and on any HR Analytics page.
**Test Data:** Navigate between Dashboard, Enrollment, Claims, Hospitals.

**Test Steps:**
1. Navigate to `/hr/dashboard`. Observe sidebar.
2. Click "Enrolment" in sidebar. Observe sidebar.
3. Click "Claims" in sidebar. Observe sidebar.
4. Click "Hospitals" in sidebar. Observe sidebar.

**Expected Result:** The sidebar item corresponding to the active route is highlighted at all times. Sidebar order: Dashboard | Enrolment | Claims | Reports | Hospitals | Risk Watch | CD Manage.

---

### TC-FUNC-049 — Back button on Policy Drilldown returns to Dashboard

**Category:** Functional
**Priority:** Medium
**Preconditions:** User has navigated to a Policy Drilldown from the Dashboard.
**Test Data:** Policy ID = `pol_gmc_001`.

**Test Steps:**
1. Navigate to `/hr/dashboard`.
2. Click "View Details →" on a policy card.
3. On the Policy Drilldown, click the ← Back button.

**Expected Result:** Browser navigates back to `/hr/dashboard`. Dashboard loads in its previous state.

---

### TC-FUNC-050 — Policy Drilldown Financial Summary table includes YoY columns when YoY is On

**Category:** Functional
**Priority:** High
**Preconditions:** Policy Drilldown open on Financial Insights tab. Prior-year financial data available. YoY toggle = On.
**Test Data:** Financial Summary: Policy Premium = ₹50L, Claim Paid YTD = ₹38L, Outstanding = ₹8L, Loss Ratio = 76%, Admin Charges = ₹2L, Net Liability = ₹48L.

**Test Steps:**
1. Navigate to Policy Drilldown → Financial Insights tab.
2. Scroll to Financial Summary table. Ensure YoY is On.
3. Observe table columns.
4. Toggle YoY to Off. Observe table columns.

**Expected Result:** With YoY On: table has 4 columns: Row Label, Amount, Prior Year Amount, YoY Δ%. All 6 rows populated. With YoY Off: Prior Year Amount and YoY Δ% columns are hidden; only Row Label and Amount remain. Excel/PDF export available from the table.

---

## 2. Edge Test Cases

### TC-EDGE-001 — loggedIn count exceeds totalEligible — percent capped at 100%

**Category:** Edge
**Priority:** High
**Preconditions:** Data anomaly seeded: Logged In = 220, Total Eligible = 200.
**Test Data:** `loggedIn = 220`, `totalEligible = 200`.

**Test Steps:**
1. Navigate to `/hr/dashboard`.
2. Observe the Enrollment Status "Logged In" KPI card.

**Expected Result:** KPI card displays count = 220 (underlying count preserved). Percentage displayed = 100% (capped, not 110%). No error or warning thrown. Per PRD §5.5 and §10.

---

### TC-EDGE-002 — Loss Ratio exactly equals 100% — no red flag

**Category:** Edge
**Priority:** Medium
**Preconditions:** Total Claim Paid = ₹50,00,000; Total Premium = ₹50,00,000.
**Test Data:** Loss Ratio = exactly 100%.

**Test Steps:**
1. Navigate to Policy Drilldown → Financial Insights.
2. Observe Loss Ratio KPI card.

**Expected Result:** Loss Ratio = 100.0%. Value is rendered in normal (non-red) styling. The red flag threshold is strictly > 100% per PRD §6.6 and SDS §4.6.4.

---

### TC-EDGE-003 — Agreement end date is exactly 60 days from today — shows red

**Category:** Edge
**Priority:** Medium
**Preconditions:** Today = 2026-05-05. Agreement end date = 2026-07-04 (exactly 60 days away).
**Test Data:** Agreement with end_date = 2026-07-04.

**Test Steps:**
1. Navigate to Hospital Network → Agreements tab.
2. Locate the agreement with end date 2026-07-04.

**Expected Result:** End date rendered in red. The 60-day threshold is inclusive (within 60 days includes day 60 itself). Agreement counts toward "Expiring in 60 Days" KPI. Per PRD §9.4.

---

### TC-EDGE-004 — Agreement end date is 61 days from today — no red flag

**Category:** Edge
**Priority:** Medium
**Preconditions:** Today = 2026-05-05. Agreement end date = 2026-07-05 (61 days away).
**Test Data:** Agreement with end_date = 2026-07-05.

**Test Steps:**
1. Navigate to Hospital Network → Agreements tab.
2. Locate the agreement with end date 2026-07-05.

**Expected Result:** End date rendered in normal styling (not red). Agreement does NOT count toward "Expiring in 60 Days" KPI.

---

### TC-EDGE-005 — Process Claim 5 stage KPIs sum equals Total In Process

**Category:** Edge
**Priority:** High
**Preconditions:** Claims in pipeline: Under Review = 5, Medical Assessment = 3, Approval Pending = 4, Settlement = 3.
**Test Data:** Total In Process should equal 15.

**Test Steps:**
1. Navigate to `/hr/claims` → Process Claim tab.
2. Read all 5 KPI values.
3. Sum the 4 stage KPIs (Under Review + Medical Assessment + Approval Pending + Settlement).

**Expected Result:** Sum of 4 stage KPIs (5+3+4+3 = 15) equals the Total In Process KPI (15). This reconciliation is an acceptance criterion per PRD §14.10.

---

### TC-EDGE-006 — Policy with no claims in window — hospital remains in directory

**Category:** Edge
**Priority:** Medium
**Preconditions:** Hospital "City Hospital" is empanelled but has zero claims in the selected period.
**Test Data:** Hospital with `total_claims = 0` for the active window.

**Test Steps:**
1. Navigate to Hospital Network → Network Hospitals tab.
2. Search for "City Hospital".

**Expected Result:** "City Hospital" appears in the directory with Total Claims = 0, Total Amount = ₹0, Avg Claim = ₹0. Hospital is not hidden or suppressed. Per PRD §10.

---

### TC-EDGE-007 — Employee with no dependents — section shows empty list

**Category:** Edge
**Priority:** Medium
**Preconditions:** Employee EMP-0099 has no registered dependents.
**Test Data:** Employee ID = EMP-0099.

**Test Steps:**
1. Navigate to `/hr/enrollment/employee/EMP-0099`.
2. Expand "Dependents/Beneficiaries" accordion section.

**Expected Result:** Dependent count = 0. Section body shows "No dependents on file" empty state. Per SDS §7 and PRD §10.

---

### TC-EDGE-008 — First policy year — YoY indicators suppressed (not shown as 0%)

**Category:** Edge
**Priority:** Critical
**Preconditions:** Company has no policy records in the prior-year window (this is their first policy year).
**Test Data:** Policy start = 01 Apr 2025; no data exists for 01 Apr 2024 – 31 Mar 2025.

**Test Steps:**
1. Navigate to `/hr/dashboard` for this company.
2. Observe all KPI cards with YoY toggle On.

**Expected Result:** No YoY badges are rendered on any KPI card. The badge is entirely absent — not shown as "0%" or "—". This applies to all 40 YoY-enhanced reports. Per PRD §4A.4 (suppression rule) and SDS §4.6.1.

---

### TC-EDGE-009 — Company with no empanelled hospitals

**Category:** Edge
**Priority:** Medium
**Preconditions:** Company has zero hospitals in the empanelment list.
**Test Data:** Company with empty hospital_empanelment table.

**Test Steps:**
1. Navigate to `/hr/hospitals`.
2. Observe the Network Hospitals tab.

**Expected Result:** Empty-state card renders: "No hospitals empanelled for this policy". KPI cards show 0 values. No table body renders. Per PRD §10 and SDS §7.

---

### TC-EDGE-010 — Pagination at maximum 500 rows per page

**Category:** Edge
**Priority:** Medium
**Preconditions:** Claims list has 600 records.
**Test Data:** Pagination request: `limit = 500`, `offset = 0`.

**Test Steps:**
1. Navigate to Claims → All Claims tab.
2. Issue API call with `limit = 500` parameter.
3. Issue API call with `limit = 501` parameter.

**Expected Result:** `limit = 500` returns 500 rows successfully. `limit = 501` is rejected at the DTO layer — returns 400 with a validation error. Per TRD §3.2.

---

### TC-EDGE-011 — Custom date range spanning policy year boundary

**Category:** Edge
**Priority:** Medium
**Preconditions:** Dashboard loaded. Claims data exists across two policy years.
**Test Data:** Custom date range = 01 Jan 2026 – 30 Jun 2026 (straddles policy year end of 31 Mar 2026).

**Test Steps:**
1. Navigate to Dashboard, Claims Analysis section.
2. Select "Custom" filter chip and enter a date range that spans the policy year boundary.
3. Observe results.

**Expected Result:** Claims data for the full custom date range is returned correctly. No error. The local date filter only affects the Claims Analysis widget; other dashboard widgets are unaffected.

---

### TC-EDGE-012 — Top 10 Insights — entity absent from prior year receives NEW badge

**Category:** Edge
**Priority:** High
**Preconditions:** An employee "Rahul Nair" appears in the current top 10 claim amount list but had no claims in the prior year.
**Test Data:** Rahul Nair: current year = ₹4,80,000 (rank 4); prior year = ₹0 (not in top 10).

**Test Steps:**
1. Navigate to Dashboard, Top 10 Claim Insights → Employees tab.
2. Locate Rahul Nair's row.

**Expected Result:** Rahul Nair's row shows Rank Change badge = "NEW" in blue. Prior Year Amount = ₹0. YoY Change % = null (no basis for comparison since prior is zero). Per PRD §4A.6 and SDS §4.6.3.

---

### TC-EDGE-013 — Sum Insured YoY badge suppressed when tier unchanged

**Category:** Edge
**Priority:** Medium
**Preconditions:** Policy has the same sum insured tier this year as last year (e.g. ₹3,00,000 both years).
**Test Data:** Sum insured = ₹3,00,000 in both current and prior year.

**Test Steps:**
1. Navigate to Policy Drilldown.
2. Observe the Sum Insured KPI card in the global KPI bar.

**Expected Result:** No YoY badge is rendered on the Sum Insured card even though prior-year data exists. Badge only appears when the sum insured tier has changed year-over-year. Per PRD §6.2 and SDS §4.2.2.

---

### TC-EDGE-014 — Claims Analysis local date filter does not affect other widgets

**Category:** Edge
**Priority:** Medium
**Preconditions:** Dashboard loaded with "All Policies" selected.
**Test Data:** Claims Analysis sub-filter changed to "Last 3 Months".

**Test Steps:**
1. Navigate to `/hr/dashboard`.
2. In Claims Analysis, change the period sub-filter to "Last 3 Months".
3. Observe other dashboard widgets (Premium Summary, Enrollment Status, Demographics).

**Expected Result:** Only the Claims KPI cards and the Monthly Trend chart reload. Premium Summary, Enrollment Status, Demographics, and Policy Cards are unaffected. Per TRD §4 "Propagation contract".

---

### TC-EDGE-015 — Prior-year window with no records — YoY null not zero

**Category:** Edge
**Priority:** Critical
**Preconditions:** Company has prior-year policy records but zero claims in the prior-year window.
**Test Data:** Prior year window = 01 Apr 2024 – 31 Mar 2025. Zero claims in this window.

**Test Steps:**
1. Navigate to `/hr/dashboard`. YoY toggle = On.
2. Observe Total Claims KPI card in Claims Analysis.

**Expected Result:** The YoY badge is fully suppressed (not shown at all). The server returns `totalClaimsAmountYoYChangePercent = NULL` (not 0), and the frontend hides the badge entirely. Per PRD §4A.4, TRD §3A.3, and SDS §4.6.1.

---

## 3. Negative Test Cases

### TC-NEG-001 — Request with invalid/expired JWT returns 401

**Category:** Negative
**Priority:** Critical
**Preconditions:** An expired JWT token is available.
**Test Data:** `Authorization: Bearer <expired_jwt>`.

**Test Steps:**
1. Send `POST /hr/report/generate/dashboard_premium_summary` with an expired JWT in the Authorization header.
2. Observe the response.

**Expected Result:** HTTP 401 response. Response body follows the error envelope. The `JwtAuthGuard` rejects the request before it reaches the report service. Per TRD §3.1.

---

### TC-NEG-002 — Request with valid JWT but wrong role returns 403

**Category:** Negative
**Priority:** Critical
**Preconditions:** A valid JWT exists for a user with role `EMPLOYEE` (not `HR_ADMIN`).
**Test Data:** `Authorization: Bearer <valid_employee_jwt>`.

**Test Steps:**
1. Send `POST /hr/report/generate/dashboard_premium_summary` with the employee JWT.
2. Observe the response.

**Expected Result:** HTTP 403 response. The `RolesGuard(HR_ADMIN)` rejects the request. Per TRD §3.1 and PRD §10.

---

### TC-NEG-003 — Unknown report key returns 400 (not 404)

**Category:** Negative
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT available.
**Test Data:** Report key = `nonexistent_report_xyz`.

**Test Steps:**
1. Send `POST /hr/report/generate/nonexistent_report_xyz` with valid JWT and valid request body.
2. Observe the HTTP status code and response body.

**Expected Result:** HTTP 400 response (not 404). Response body: `{ "statusCode": 400, "message": "Failed to generate report.", "error": "..." }`. The failure occurs at the SQL metadata lookup stage. Per TRD §1.2.

---

### TC-NEG-004 — Missing companyId in request body returns 400

**Category:** Negative
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** Request body omits `companyId` field entirely.

**Test Steps:**
1. Send `POST /hr/report/generate/dashboard_premium_summary` with valid JWT but no `companyId` in body.
2. Observe response.

**Expected Result:** HTTP 400 response. The DTO validation layer rejects the request. Per TRD §3.1.

---

### TC-NEG-005 — Export with unsupported format for Claims module

**Category:** Negative
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT. Claims module export endpoint.
**Test Data:** `POST /hr/report/download/ibp_hr_claims_list?format=csv` with valid body.

**Test Steps:**
1. Attempt to export Claims All Claims data as CSV.
2. Observe response.

**Expected Result:** Request is rejected. HTTP 400 or the UI prevents the option from being offered. CSV and Word are explicitly not supported for the Claims module per PRD §8.6.

---

### TC-NEG-006 — Export with entirely invalid format string returns 400

**Category:** Negative
**Priority:** Medium
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** `POST /hr/report/download/dashboard_premium_summary?format=xml`.

**Test Steps:**
1. Send export request with `format=xml`.
2. Observe response.

**Expected Result:** HTTP 400 response. Invalid format is rejected by the DTO/query param validator. No file is returned.

---

### TC-NEG-007 — Search with SQL special characters does not crash or return error

**Category:** Negative
**Priority:** High
**Preconditions:** Enrollment search is accessible.
**Test Data:** Search strings: `'; DROP TABLE employees; --`, `" OR 1=1`, `<script>alert(1)</script>`.

**Test Steps:**
1. Navigate to `/hr/enrollment`.
2. Enter each malicious search string in the search bar.
3. Observe the results and any errors.

**Expected Result:** No SQL error, no data corruption, no JavaScript execution. Either zero results are returned (no match) or a safe error message. The application handles all inputs safely through parameterised queries.

---

### TC-NEG-008 — Pagination offset beyond total record count returns empty rows

**Category:** Negative
**Priority:** Medium
**Preconditions:** Claims list has exactly 45 records.
**Test Data:** `limit = 10`, `offset = 100` (beyond total).

**Test Steps:**
1. Send `POST /hr/report/generate/ibp_hr_claims_list` with `limit = 10`, `offset = 100`.
2. Observe response.

**Expected Result:** HTTP 201. `data.rows = []` (empty array). `data.count = 45`. No error. Frontend renders empty-state "No data for selected filters".

---

### TC-NEG-009 — Policy selector with invalid policyType value returns 400

**Category:** Negative
**Priority:** Medium
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** Request body: `{ "companyId": "...", "policyType": "INVALID_TYPE" }`.

**Test Steps:**
1. Send `POST /hr/report/generate/dashboard_premium_summary` with `policyType = "INVALID_TYPE"`.
2. Observe response.

**Expected Result:** HTTP 400 response with validation error. Valid values are: empty string (All Policies), "GMC", "GPA", "GTL".

---

### TC-NEG-010 — Partial export failure — no partial file delivered

**Category:** Negative
**Priority:** High
**Preconditions:** Export is triggered but the server fails mid-generation (simulate a DB timeout).
**Test Data:** Force a DB timeout during export of `ibp_hr_claims_list` as Excel.

**Test Steps:**
1. Trigger an export that will fail mid-generation.
2. Observe the UI response.

**Expected Result:** No partial file is delivered to the user. An error toast is shown in the UI. Per PRD §10 and SDS §7.

---

### TC-NEG-011 — RBAC failure on Policy Drilldown returns access-denied screen

**Category:** Negative
**Priority:** High
**Preconditions:** User has a JWT that fails the `RolesGuard(HR_ADMIN)` check on the Policy Drilldown endpoint.
**Test Data:** JWT with no roles claim.

**Test Steps:**
1. Navigate to `/hr/dashboard/policy/pol_gmc_001` with an unauthorized session.
2. Observe the page rendered.

**Expected Result:** User is redirected to the global access-denied screen. A return link to `/hr/dashboard` is present. Per SDS §9.

---

### TC-NEG-012 — Missing E-Card record — "View" button is disabled with tooltip

**Category:** Negative
**Priority:** Medium
**Preconditions:** Employee EMP-0099 has no E-Card record.
**Test Data:** Employee EMP-0099 in the enrollment list.

**Test Steps:**
1. Navigate to `/hr/enrollment`.
2. Locate EMP-0099 in the list.
3. Observe the E-Card column.
4. Hover over the "View" button (if any).

**Expected Result:** "View" button is rendered in a disabled state. Hovering shows tooltip "Unavailable". Clicking the disabled button has no effect. Per SDS §7.

---

## 4. Security Test Cases

### TC-SEC-001 — No Authorization header — request rejected with 401

**Category:** Security
**Priority:** Critical
**Preconditions:** None.
**Test Data:** `POST /hr/report/generate/dashboard_premium_summary` with no Authorization header.

**Test Steps:**
1. Send a bare POST request to `/hr/report/generate/dashboard_premium_summary` with valid JSON body but no Authorization header.
2. Observe response status and body.

**Expected Result:** HTTP 401. The `JwtAuthGuard` rejects the request at the controller level. No report data is returned. Per TRD §3.1.

---

### TC-SEC-002 — JWT with mismatched companyId — cannot access another company's data

**Category:** Security
**Priority:** Critical
**Preconditions:** Two companies exist: Company A (companyId = `co_A`) and Company B (companyId = `co_B`). HR Admin of Company A has a valid JWT scoped to `co_A`.
**Test Data:** Company A JWT. Request body: `{ "companyId": "co_B", ... }`.

**Test Steps:**
1. Send `POST /hr/report/generate/dashboard_premium_summary` using Company A's JWT but with `companyId = "co_B"` in the body.
2. Observe response.

**Expected Result:** HTTP 400. The server validates `companyId` in the request body against the JWT session company. Mismatch is rejected — Company B's data is not returned. Per TRD §3.1.

---

### TC-SEC-003 — SQL injection via report placeholder field

**Category:** Security
**Priority:** Critical
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** Request body: `{ "companyId": "'; DROP TABLE policy; --", "policyType": "" }`.

**Test Steps:**
1. Send `POST /hr/report/generate/dashboard_premium_summary` with an SQL injection payload in the `companyId` field.
2. Observe response and database state.

**Expected Result:** HTTP 400 or the injection string is safely handled through parameterised query bindings. No SQL execution occurs. Database tables remain intact. The `###placeholder###` substitution mechanism must use safe binding, not string concatenation.

---

### TC-SEC-004 — Brute-force JWT token tampering

**Category:** Security
**Priority:** High
**Preconditions:** Attacker has a valid HR_ADMIN JWT and attempts to tamper with its payload.
**Test Data:** Valid JWT with `companyId` claim modified to another company's ID, signature invalid.

**Test Steps:**
1. Decode the JWT payload. Modify the `companyId` claim to another company's ID.
2. Re-encode without valid signature (tampered token).
3. Send `POST /hr/report/generate/dashboard_premium_summary` with tampered JWT.

**Expected Result:** HTTP 401. JWT signature verification fails. No data is returned.

---

### TC-SEC-005 — RBAC: non-HR_ADMIN role cannot access any HR Analytics endpoint

**Category:** Security
**Priority:** Critical
**Preconditions:** Valid JWT with role = `EMPLOYEE` (not `HR_ADMIN`).
**Test Data:** Employee-role JWT. Target: all 5 HR Analytics feature area generate endpoints.

**Test Steps:**
1. Using the EMPLOYEE-role JWT, send POST requests to:
   - `/hr/report/generate/dashboard_premium_summary`
   - `/hr/report/generate/ibp_hr_enrollment_employee_list`
   - `/hr/report/generate/ibp_hr_claims_list`
   - `/hr/report/generate/hospital_network_kpi`
2. Observe each response.

**Expected Result:** All four requests return HTTP 403. No data is returned for any endpoint. The `RolesGuard(HR_ADMIN)` enforces this at the controller class level. Per TRD §3.1.

---

### TC-SEC-006 — XSS attempt via search/filter fields

**Category:** Security
**Priority:** High
**Preconditions:** HR Admin is logged in with a valid session.
**Test Data:** Search input: `<img src=x onerror=alert('xss')>`.

**Test Steps:**
1. Navigate to `/hr/enrollment`.
2. Enter `<img src=x onerror=alert('xss')>` in the employee search bar.
3. Observe the results area and browser console.

**Expected Result:** The input is treated as a literal string. No JavaScript executes. No alert box appears. Search results show "No data for selected filters" or matching results with the string safely escaped/sanitised in the output.

---

## 5. Performance Test Cases

### TC-PERF-001 — HR Dashboard initial load completes within 2 seconds

**Category:** Performance
**Priority:** Critical
**Preconditions:** Typical dataset: company with 500 employees, 45 claims, 3 policies. Standard server load.
**Test Data:** Target: < 2 seconds for first meaningful paint with all above-the-fold data resolved.

**Test Steps:**
1. Measure time from navigation to `/hr/dashboard` until `dashboard_premium_summary` and `dashboard_policy_cards` are resolved and visible.
2. Record using browser performance tooling or synthetic test.

**Expected Result:** Total time from navigation to all above-the-fold KPI cards populated ≤ 2 seconds under standard load. Per PRD §12.

---

### TC-PERF-002 — Policy Drilldown global KPI + Overview loads within 2 seconds

**Category:** Performance
**Priority:** Critical
**Preconditions:** Typical dataset. Policy with 12 months of claim history.
**Test Data:** Same dataset as TC-PERF-001.

**Test Steps:**
1. Navigate to a Policy Drilldown page.
2. Measure time until the global KPI bar AND Overview tab first section are both resolved.

**Expected Result:** Combined load time ≤ 2 seconds. Per PRD §12.

---

### TC-PERF-003 — Section/tab switch first load completes within 1 second

**Category:** Performance
**Priority:** High
**Preconditions:** Policy Drilldown is open. Overview tab has been loaded.
**Test Data:** Typical dataset.

**Test Steps:**
1. With Policy Drilldown loaded on Overview tab, click "Claims Analytics" tab.
2. Measure time from tab click until the Claims Analytics section data is rendered.

**Expected Result:** Time from tab click to first data render ≤ 1 second. Per PRD §12.

---

### TC-PERF-004 — Data load of up to 1,000 records completes within 2 seconds

**Category:** Performance
**Priority:** High
**Preconditions:** Claims list has 1,000 records.
**Test Data:** `limit = 500` (max allowed). Run two pages.

**Test Steps:**
1. Send `POST /hr/report/generate/ibp_hr_claims_list` with `limit = 500`, `offset = 0`. Measure response time.
2. Send same with `offset = 500`. Measure response time.

**Expected Result:** Each paginated response of 500 records returns in ≤ 2 seconds. Per PRD §12.

---

### TC-PERF-005 — Export file generation completes within 5 seconds

**Category:** Performance
**Priority:** High
**Preconditions:** Claims list has 1,000 records eligible for export.
**Test Data:** `POST /hr/report/download/ibp_hr_claims_list?format=excel` with full result set.

**Test Steps:**
1. Trigger Excel export for the full claims dataset.
2. Measure time from request to file download completion.

**Expected Result:** File is generated and returned within 5 seconds. Per PRD §12.

---

### TC-PERF-006 — Simultaneous widget reload on policy selector change

**Category:** Performance
**Priority:** High
**Preconditions:** Dashboard loaded with 9 report widgets active.
**Test Data:** Change policy type from GMC to GTL.

**Test Steps:**
1. On `/hr/dashboard`, switch policy type from GMC to GTL.
2. Measure how many parallel API calls are initiated and how long until all widgets resolve.

**Expected Result:** All 9 dashboard report calls are initiated simultaneously (not sequentially). Total time to resolve all widgets ≤ 2× the single-report load time (parallel execution benefit). No widget blocks another from loading.

---

## 6. Integration Test Cases

### TC-INT-001 — All data loads exclusively through POST /hr/report/generate/:report

**Category:** Integration
**Priority:** Critical
**Preconditions:** Browser network monitor is active. HR Admin navigates through all 5 feature areas.
**Test Data:** Full walkthrough: Dashboard → Policy Drilldown (all tabs) → Enrollment (all tabs) → Claims (all tabs) → Hospital Network (all tabs).

**Test Steps:**
1. Open browser DevTools Network tab filtering for XHR/Fetch.
2. Navigate through every page and tab listed above.
3. Inspect every data-fetching request.

**Expected Result:** Every data-fetching request uses `POST /hr/report/generate/:reportKey` or `POST /hr/report/download/:reportKey` exclusively. No custom controller endpoints, hardcoded SQL calls, or alternative API paths are used. Per PRD §14.9 and TRD §1.

---

### TC-INT-002 — All exports route through POST /hr/report/download/:report

**Category:** Integration
**Priority:** Critical
**Preconditions:** Browser network monitor active.
**Test Data:** Trigger exports across all feature areas (Dashboard, Enrollment, Claims, Hospital Network).

**Test Steps:**
1. Trigger at least one export from each of the 5 feature areas.
2. Inspect each export network request.

**Expected Result:** All export requests use `POST /hr/report/download/:reportKey?format=excel|pdf|csv|word`. The same filter body used for the generate call is sent with the download call. No format conversion happens in the frontend.

---

### TC-INT-003 — Policy selector change triggers simultaneous reload of all page widgets

**Category:** Integration
**Priority:** Critical
**Preconditions:** Dashboard loaded. Network monitor active.
**Test Data:** Change policy type selector from "GMC" to "All Policies".

**Test Steps:**
1. On Dashboard, change policy type to "All Policies".
2. Observe the network requests initiated.

**Expected Result:** All 9 dashboard data-widget API calls are initiated within the same event loop tick (or within 50ms of each other). Requests are fired in parallel. A page-level loading skeleton is shown while calls are in-flight. Per SDS §2.5.

---

### TC-INT-004 — Single widget API failure does not break the rest of the page

**Category:** Integration
**Priority:** High
**Preconditions:** The `dashboard_top10_employees` API call is mocked to return 500.
**Test Data:** All other dashboard reports return normally.

**Test Steps:**
1. Mock `dashboard_top10_employees` to return HTTP 500.
2. Navigate to `/hr/dashboard`.
3. Observe the page state.

**Expected Result:** All other widgets (Premium Summary, Policy Cards, Claims Analysis, Enrollment Status, Demographics) load and display data normally. The Top 10 Claim Insights widget shows a section-level error toast/error state. No full-page crash. Per SDS §7.

---

### TC-INT-005 — Policy Drilldown global KPI bar failure shows full-page error with retry

**Category:** Integration
**Priority:** High
**Preconditions:** `policy_header_kpi` API call is mocked to return 500.
**Test Data:** Navigate to any Policy Drilldown page.

**Test Steps:**
1. Mock `policy_header_kpi` to return HTTP 500.
2. Navigate to `/hr/dashboard/policy/pol_gmc_001`.
3. Observe the page state.

**Expected Result:** Full-page error state is shown. No tab body renders (all four tabs remain inaccessible). A Retry button is visible. Clicking Retry re-fires the `policy_header_kpi` call. Per SDS §7.

---

### TC-INT-006 — Claims Insights Hospital widget "View All" passes hospital filter to All Claims

**Category:** Integration
**Priority:** High
**Preconditions:** Claims Insights is loaded. "Apollo Mumbai" appears in Claims by Hospital widget.
**Test Data:** Hospital name = "Apollo Mumbai".

**Test Steps:**
1. Navigate to Claims → Insights tab.
2. Click "View All" on Claims by Hospital widget.
3. On All Claims tab, observe filter state and table content.

**Expected Result:** Navigating to All Claims pre-applies the Hospital filter for "Apollo Mumbai". The table shows only claims for that hospital. The filter chip is visually active in the filter bar.

---

### TC-INT-007 — GET /hr/report/reports_list returns discovery catalogue

**Category:** Integration
**Priority:** Medium
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** `GET /hr/report/reports_list`.

**Test Steps:**
1. Send `GET /hr/report/reports_list` with valid HR_ADMIN JWT.
2. Observe response.

**Expected Result:** HTTP 200. Response body contains a catalogue of all available report keys. The 62 report keys defined in TRD §2 should be represented. Per TRD §1.2.

---

### TC-INT-008 — YoY toggle state never triggers a re-fetch

**Category:** Integration
**Priority:** High
**Preconditions:** Dashboard loaded with all widgets. Network monitor active.
**Test Data:** YoY toggle switched On → Off → On three times.

**Test Steps:**
1. Load `/hr/dashboard`. Wait for all widgets to load.
2. Open Network monitor.
3. Toggle YoY Off. Observe network.
4. Toggle YoY On. Observe network.
5. Toggle YoY Off again. Observe network.

**Expected Result:** Zero API calls are triggered by any of the three toggle operations. The YoY toggle is a display-layer control only. Per PRD §4A.2, TRD §3A.8, and SDS §4.6.5.

---

## 7. Accessibility Test Cases

### TC-ACC-001 — Sidebar is fully keyboard-navigable with Tab and Enter

**Category:** Accessibility
**Priority:** High
**Preconditions:** HR Admin is on any HR Analytics page.
**Test Data:** Keyboard-only interaction (no mouse).

**Test Steps:**
1. Press Tab repeatedly to cycle through focusable elements until sidebar items are reached.
2. Use arrow keys or Tab to move between sidebar items (Dashboard, Enrolment, Claims, etc.).
3. Press Enter on "Claims".
4. Verify navigation.

**Expected Result:** Each sidebar item receives visible focus indicator. Pressing Enter navigates to the corresponding route. No mouse interaction required. Per PRD §12 (keyboard-navigable analytics).

---

### TC-ACC-002 — Policy selector dropdown is operable by keyboard

**Category:** Accessibility
**Priority:** High
**Preconditions:** User is on `/hr/dashboard`.
**Test Data:** Keyboard-only interaction.

**Test Steps:**
1. Tab to the Policy Selector dropdown in the page header.
2. Press Enter or Space to open the dropdown.
3. Use arrow keys to navigate options (All Policies, GMC, GTL, GPA).
4. Press Enter to select "GTL".

**Expected Result:** Dropdown opens and closes via keyboard. Option navigation works with arrow keys. Selection is confirmed with Enter. The page data reloads after selection.

---

### TC-ACC-003 — KPI cards have ARIA labels readable by screen reader

**Category:** Accessibility
**Priority:** High
**Preconditions:** Browser with screen reader (e.g. NVDA or VoiceOver) active.
**Test Data:** Navigate to `/hr/dashboard`, Premium Summary section.

**Test Steps:**
1. Activate screen reader.
2. Navigate to the Premium Summary KPI row.
3. Tab through each KPI card.

**Expected Result:** Screen reader announces each card's label and value (e.g. "Inception Premium: 10 lakh rupees"). ARIA labels are present per PRD §12 (ARIA labels requirement). YoY badge is announced as supplemental information.

---

### TC-ACC-004 — Threshold-driven colour flags have sufficient colour contrast

**Category:** Accessibility
**Priority:** High
**Preconditions:** Hospital Performance tab is loaded with High Risk hospitals.
**Test Data:** Risk Level = High (red badge).

**Test Steps:**
1. Navigate to Hospital Network → Performance tab.
2. Inspect the "High" risk badge.
3. Use a colour contrast checker tool on the badge text against background.

**Expected Result:** Contrast ratio meets WCAG AA minimum (4.5:1 for normal text, 3:1 for large text). The risk level information is not conveyed by colour alone (badge also shows text label "High", "Medium", "Low"). Per PRD §12 (sufficient colour contrast).

---

### TC-ACC-005 — Table columns have correct ARIA role and scope attributes

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** Claims All Claims table is rendered.
**Test Data:** Standard claims dataset.

**Test Steps:**
1. Navigate to `/hr/claims` → All Claims tab.
2. Inspect the claims table HTML markup.

**Expected Result:** Table has `role="table"` (or is a semantic `<table>`). Column headers use `<th scope="col">`. Row headers (if any) use `<th scope="row">`. Screen reader can associate data cells with their column headers.

---

### TC-ACC-006 — Dashboard renders correctly on tablet viewport

**Category:** Accessibility
**Priority:** High
**Preconditions:** Browser set to tablet viewport (e.g. 768×1024px).
**Test Data:** iPad portrait viewport dimensions.

**Test Steps:**
1. Set browser viewport to 768×1024.
2. Navigate to `/hr/dashboard`.
3. Observe layout of all widgets.

**Expected Result:** Policy cards grid renders 1 card per row (not 3 per row as on desktop) per SDS §4.1.3. All KPI cards, charts, and tables remain legible. No horizontal scroll on the main content area. Global KPI bar on Policy Drilldown is horizontally scrollable on tablet per SDS §4.2.2. Per PRD §12 (Desktop + tablet responsiveness).

---

## 8. Regression Test Cases

### TC-REG-001 — YoY badge never shows "0%" or "—" when prior data is absent

**Category:** Regression
**Priority:** Critical
**Preconditions:** Company is in their first policy year. Zero prior-year data.
**Test Data:** Same as TC-EDGE-008.

**Test Steps:**
1. Navigate to `/hr/dashboard` for a first-year company.
2. Inspect all KPI cards across all feature areas.

**Expected Result:** No KPI card shows "0% vs last year" or "— vs last year". Badges are entirely absent where prior data does not exist. This was a specific PRD requirement (§4A.4) to prevent misleading zero-change display.

---

### TC-REG-002 — Enrollment filter reset does not clear global policy selector

**Category:** Regression
**Priority:** High
**Preconditions:** Global policy selector is set to "GPA". Enrollment list filters (Member Type, Status, Gender) are active.
**Test Data:** Global selector = GPA. Section filters = Member Type: Employee, Status: Active.

**Test Steps:**
1. Set global policy selector to GPA.
2. Apply section filters on the Enrollment tab.
3. Click "Reset" button.
4. Observe global policy selector value.

**Expected Result:** Global policy selector remains "GPA" after Reset. Only section-level filters (Member Type, Status, etc.) are cleared. Per PRD §7.1.

---

### TC-REG-003 — Process Claim tab has no YoY indicators

**Category:** Regression
**Priority:** High
**Preconditions:** Process Claim tab is loaded with active pipeline data.
**Test Data:** YoY toggle = On.

**Test Steps:**
1. Navigate to `/hr/claims` → Process Claim tab.
2. Observe all 5 KPI cards with YoY toggle On.

**Expected Result:** No YoY badges appear on any of the 5 KPI cards in the Process Claim tab. No prior-year data is shown in the pipeline table. This section is explicitly excluded from YoY per PRD §4A.7.

---

### TC-REG-004 — Claim Procedure tab makes no API calls

**Category:** Regression
**Priority:** High
**Preconditions:** Network monitor is active.
**Test Data:** Navigate to Claim Procedure tab with any policy selected.

**Test Steps:**
1. Open Network monitor.
2. Navigate to `/hr/claims` → Claim Procedure tab.
3. Switch between Cashless and Reimbursement modes.
4. Observe all network requests.

**Expected Result:** Zero API calls are made to any `/hr/report/` endpoint when loading or interacting with the Claim Procedure tab. All content is static. Per PRD §8.5.

---

### TC-REG-005 — Partial export failure delivers no file and shows error toast

**Category:** Regression
**Priority:** High
**Preconditions:** Export for Enrollment triggers a server-side failure mid-generation.
**Test Data:** Mock export endpoint to fail after partial generation.

**Test Steps:**
1. Trigger an Enrollment export (Excel).
2. Mock the server to throw a 500 mid-stream.
3. Observe browser download and UI.

**Expected Result:** No partial file is downloaded. The browser download bar does not show a corrupt/partial file. An error toast message is shown in the UI. Per PRD §10 and SDS §7.

---

### TC-REG-006 — Soft-deleted records never appear in any list or aggregate

**Category:** Regression
**Priority:** Critical
**Preconditions:** A policy record has `deleted_at IS NOT NULL` in the database.
**Test Data:** Soft-deleted policy `pol_deleted_001`.

**Test Steps:**
1. Navigate to `/hr/dashboard`. Observe policy cards.
2. Check Premium Summary KPIs.
3. Check Claims Analysis KPIs.

**Expected Result:** `pol_deleted_001` does not appear in any dashboard widget, aggregate, or report. Soft-delete enforcement (`AND <table>.deleted_at IS NULL`) is present on every query per TRD §3.3.

---

## 9. Data Integrity Test Cases

### TC-DATA-001 — Soft-deleted policy/claim/employee records excluded from all queries

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Database has soft-deleted records for all three entity types.
**Test Data:** policy.deleted_at = timestamp, claim.deleted_at = timestamp, employee.deleted_at = timestamp.

**Test Steps:**
1. Verify via database query that `deleted_at` is set on selected records.
2. Navigate through Dashboard, Enrollment, Claims, and Hospital Network.
3. Search for the deleted employee by ID.
4. Check claim counts — deleted claims should not be counted.

**Expected Result:** Deleted records are absent from all UI lists, counts, aggregates, and reports. No manual exclusion needed at the application layer — the SQL `deleted_at IS NULL` clause handles it. Per TRD §3.3.

---

### TC-DATA-002 — YoY change percent returns NULL (not 0) when prior-year window has no data

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Database query returns `prev_year.total_amount = 0` (NULL or genuinely zero).
**Test Data:** SQL formula: `ROUND((current - prev) * 100.0 / NULLIF(prev, 0), 1)` with `prev = 0`.

**Test Steps:**
1. Set up a scenario where prior-year claims amount = 0 (no prior data).
2. Call `POST /hr/report/generate/dashboard_claims_analysis_kpi`.
3. Inspect `totalClaimsAmountYoYChangePercent` in the response.

**Expected Result:** `totalClaimsAmountYoYChangePercent = null` (not 0). The `NULLIF(prev, 0)` in the SQL formula ensures division by zero is avoided and returns NULL. Per TRD §3A.3.

---

### TC-DATA-003 — Missing claim financial values render as "—" not "0"

**Category:** Data Integrity
**Priority:** High
**Preconditions:** A claim exists with `claim_amount = NULL` and `settled_amount = NULL`.
**Test Data:** Claim record with null financial fields.

**Test Steps:**
1. Navigate to Claims → All Claims tab.
2. Locate the claim row with null financials.
3. Observe Claim Amount and Settled Amount cells.

**Expected Result:** Both cells display "—" (em-dash), not "0" or empty string. This distinguishes "missing data" from "genuine zero". Per PRD §10 and SDS §7 ("'—' not '0'" principle).

---

### TC-DATA-004 — Total Premium formula: Inception + Addition − Deletion + Top-Up

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Known premium components in DB. Inception = ₹10,00,000; Addition = ₹2,00,000; Deletion = ₹50,000; Top-Up = ₹1,00,000.
**Test Data:** Per above.

**Test Steps:**
1. Call `POST /hr/report/generate/dashboard_premium_summary`.
2. Inspect `totalPremium` in the response.
3. Manually compute: 10,00,000 + 2,00,000 − 50,000 + 1,00,000 = 12,50,000.

**Expected Result:** `totalPremium = 12,50,000`. SQL formula matches PRD §5.2: `inception_premium + addition_premium - deletion_premium + top_up_premium`. Per TRD §5.3 SQL seed.

---

### TC-DATA-005 — TAT for closed/paid claims = settlement date − claim date

**Category:** Data Integrity
**Priority:** High
**Preconditions:** A paid claim exists: claim_date = 2026-01-10, settlement_date = 2026-01-17.
**Test Data:** Per above. Expected TAT = 7 days.

**Test Steps:**
1. Navigate to Claims → All Claims tab.
2. Locate the paid claim.
3. Observe the TAT/Aging column.

**Expected Result:** TAT = "7d". Computed as settlement_date − claim_date. Per PRD §8.2.

---

### TC-DATA-006 — TAT for open claims = today − claim date

**Category:** Data Integrity
**Priority:** High
**Preconditions:** An outstanding claim: claim_date = 2026-04-25. Today = 2026-05-05.
**Test Data:** Expected TAT = 10 days.

**Test Steps:**
1. Navigate to Claims → All Claims tab.
2. Locate the outstanding claim submitted on 2026-04-25.
3. Observe the TAT/Aging column.

**Expected Result:** TAT = "10d" (2026-05-05 − 2026-04-25 = 10 days). Per PRD §8.2.

---

### TC-DATA-007 — Risk Level Low/Medium/High derived correctly from thresholds

**Category:** Data Integrity
**Priority:** High
**Preconditions:** Three hospitals seeded with specific performance metrics (per TC-FUNC-034 data).
**Test Data:** Hospital A: Approval=92%, Rejection=8%, Settlement=5d → Low. Hospital B: Approval=87%, Rejection=12%, Settlement=7d → Medium. Hospital C: Approval=82%, Rejection=18%, Settlement=10d → High.

**Test Steps:**
1. Call `POST /hr/report/generate/hospital_performance_overview`.
2. Inspect `riskLevel` field for each hospital in `data.rows`.

**Expected Result:** Hospital A → `riskLevel = "Low"`. Hospital B → `riskLevel = "Medium"`. Hospital C → `riskLevel = "High"`. Thresholds applied per PRD §9.3.1 (High: Approval < 85% OR Rejection > 15% OR Settlement > 8 days).

---

### TC-DATA-008 — Claim Ratio = Incurred Claims / Earned Premium × 100

**Category:** Data Integrity
**Priority:** High
**Preconditions:** Total incurred claims = ₹38,50,000; earned premium = ₹50,00,000.
**Test Data:** Expected Claim Ratio = 77.0%.

**Test Steps:**
1. Call `POST /hr/report/generate/dashboard_claims_analysis_kpi`.
2. Inspect `claimRatioPercent` in `data.rows[0]`.

**Expected Result:** `claimRatioPercent = 77.0`. Formula: `38,50,000 / 50,00,000 × 100 = 77.0`. Per PRD §5.4.

---

### TC-DATA-009 — Avg Claim = Total Claim Amount / Claim Count

**Category:** Data Integrity
**Priority:** Medium
**Preconditions:** Total Claim Amount = ₹38,50,000; Total Claims Count = 45.
**Test Data:** Expected Avg Claim = ₹85,556.

**Test Steps:**
1. Call `POST /hr/report/generate/ibp_hr_claims_insights_kpi`.
2. Inspect `avgClaimAmount` in `data.rows[0]`.

**Expected Result:** `avgClaimAmount ≈ 85556` (rounded to nearest rupee). Per PRD §8.4.

---

### TC-DATA-010 — Net Liability = Paid + Outstanding + Admin Charges

**Category:** Data Integrity
**Priority:** Medium
**Preconditions:** Financial data: Paid = ₹22,00,000; Outstanding = ₹8,00,000; Admin Charges = ₹2,00,000.
**Test Data:** Expected Net Liability = ₹32,00,000.

**Test Steps:**
1. Navigate to Policy Drilldown → Financial Insights → Financial Summary table.
2. Observe the "Net Liability" row value.

**Expected Result:** Net Liability = ₹32,00,000 (22,00,000 + 8,00,000 + 2,00,000). Per PRD §6.6.

---

## 10. API Test Cases

### TC-API-001 — GET on /hr/report/generate/:report returns 405 Method Not Allowed

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** `GET /hr/report/generate/dashboard_premium_summary`.

**Test Steps:**
1. Send a `GET` request (not POST) to `/hr/report/generate/dashboard_premium_summary` with valid JWT and empty body.
2. Observe response.

**Expected Result:** HTTP 405 Method Not Allowed. The endpoint only accepts POST. Per TRD §1.2.

---

### TC-API-002 — POST /hr/report/generate/:report without Authorization header returns 401

**Category:** API
**Priority:** Critical
**Preconditions:** None.
**Test Data:** `POST /hr/report/generate/dashboard_premium_summary` with valid JSON body, no Authorization header.

**Test Steps:**
1. Send POST request with valid body and no Authorization header.
2. Observe response.

**Expected Result:** HTTP 401. `JwtAuthGuard` rejects the request at the controller entry point. Per TRD §3.1.

---

### TC-API-003 — POST /hr/report/generate/:report with malformed JSON body returns 400

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** Body = `{ "companyId": "co_A", "policyType": }` (invalid JSON — missing value).

**Test Steps:**
1. Send `POST /hr/report/generate/dashboard_premium_summary` with valid JWT and malformed JSON.
2. Observe response.

**Expected Result:** HTTP 400. JSON parse error or DTO validation error. No report data is returned.

---

### TC-API-004 — POST /hr/report/download/:report without format query param returns 400

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** `POST /hr/report/download/ibp_hr_claims_list` (no `?format=` query param).

**Test Steps:**
1. Send POST download request with valid JWT and body but no `format` query parameter.
2. Observe response.

**Expected Result:** HTTP 400. The format query parameter is required. No file is returned.

---

### TC-API-005 — GET /hr/report/reports_list with valid JWT returns 200 with report catalogue

**Category:** API
**Priority:** Medium
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** `GET /hr/report/reports_list`.

**Test Steps:**
1. Send `GET /hr/report/reports_list` with valid HR_ADMIN JWT.
2. Inspect response body.

**Expected Result:** HTTP 200. Response includes the list of available report keys. Should contain the 62 report keys catalogued in TRD §2. Per TRD §1.2.

---

### TC-API-006 — POST /hr/report/generate/nonexistent_key returns 400 (not 404)

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** Report key = `unknown_report_xyz`.

**Test Steps:**
1. Send `POST /hr/report/generate/unknown_report_xyz` with valid JWT and valid body.
2. Observe HTTP status code.

**Expected Result:** HTTP 400 (not 404). The failure occurs at the SQL metadata lookup — the report name is not found in `admin_reports` table, which triggers a 400 error per the framework contract. Per TRD §1.2.

---

### TC-API-007 — Successful POST /hr/report/generate returns 201 with data.rows envelope

**Category:** API
**Priority:** Critical
**Preconditions:** Valid HR_ADMIN JWT. Active company data exists.
**Test Data:** `POST /hr/report/generate/dashboard_premium_summary` with valid companyId, policyType, policyPeriodStart, policyPeriodEnd.

**Test Steps:**
1. Send a correctly formed POST request to generate `dashboard_premium_summary`.
2. Inspect response HTTP status and body structure.

**Expected Result:** HTTP 201. Response body matches the framework envelope: `{ "statusCode": 201, "message": "Report generated successfully.", "data": { "rows": [...], "count": <n> } }`. KPI data is in `data.rows[0]`. Per TRD §1.2.

---

### TC-API-008 — Export success returns 200 with binary file and Content-Disposition header

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT. Claims data available.
**Test Data:** `POST /hr/report/download/ibp_hr_claims_list?format=excel` with valid body.

**Test Steps:**
1. Send the download request.
2. Inspect HTTP status, response headers, and response body.

**Expected Result:** HTTP 200. `Content-Disposition: attachment; filename="ibp_hr_claims_list-<timestamp>.xlsx"` header present. Response body is a non-empty binary Excel file. Per TRD §1.2.

---

### TC-API-009 — Pagination params: default 50 rows; max 500 rows enforced by DTO

🔁 **Updated** — Clarified report key: use `ibp_hr_enrollment_employee_list` (TRD §3.2 general default = 50). `ibp_hr_claims_list` has a SQL-level override of 10 rows default (tested separately in TC-FUNC-027 per SDS §4.4.1) and must not be used for this general pagination contract test.

**Category:** API
**Priority:** Medium
**Preconditions:** Enrollment list has 600 records. Valid HR_ADMIN JWT.
**Test Data:** Report key: `ibp_hr_enrollment_employee_list`. Request A: no limit/offset params. Request B: `limit = 500`. Request C: `limit = 501`.

**Test Steps:**
1. Send Request A: `POST /hr/report/generate/ibp_hr_enrollment_employee_list` with valid JWT, valid companyId, no limit/offset. Count rows in `data.rows`.
2. Send Request B: same endpoint with `limit = 500`. Count rows in `data.rows`.
3. Send Request C: same endpoint with `limit = 501`. Observe response.

**Expected Result:** Request A: `data.rows.length = 50` (framework default per TRD §3.2 SQL pattern). `data.count = 600`. Request B: `data.rows.length = 500`. Request C: HTTP 400 (DTO rejects limit > 500). Note: `ibp_hr_claims_list` overrides the default to 10 at the SQL level (`LIMIT COALESCE(NULLIF(###limit###,'')::int, 10)`) — that specific default is covered by TC-FUNC-027. Per TRD §3.2.

---

### TC-API-010 — companyId mismatch with JWT session company returns 400

**Category:** API
**Priority:** Critical
**Preconditions:** HR Admin of Company A (JWT scoped to `co_A`).
**Test Data:** Request body: `{ "companyId": "co_B", "policyType": "" }`.

**Test Steps:**
1. Send `POST /hr/report/generate/dashboard_premium_summary` with Company A's JWT but `companyId = "co_B"` in the request body.
2. Observe response.

**Expected Result:** HTTP 400. The server validates `companyId` from the request body against the `companyId` extracted from the JWT. Mismatch triggers a 400 error — no data from Company B is returned. Per TRD §3.1.

---

## 11. HR Portal Reports — Test Cases

### TC-FUNC-051 — HR Portal Reports page renders report cards

**Description:** Verify the Reports page shows all 15 cards grouped correctly.

**Preconditions:** Authenticated HR Admin; company has at least one policy.

**Steps:**
1. Navigate to `/hr-portal/reports`.
2. Observe the category chip bar and card grid.

**Expected:**
- Category chips visible: All · Endorsement Reports · Employee Reports · Claim Reports · Finance Reports · Communication Reports.
- 4 cards at full opacity with a chevron icon: Claims History, Endorsement Report, Enrollment Report, Premium Report.
- 11 cards at 50% opacity with a "Coming soon" pill badge; clicking them does nothing.

**Pass criteria:** Correct card count in each state; no console errors.

---

### TC-FUNC-052 — Claims History table loads after policy selection with correct columns

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin on the Reports page. Company has a GMC policy with at least 5 claim records.
**Test Data:** Valid HR_ADMIN JWT. `policyId` of a GMC policy with known claims.

**Test Steps:**
1. Expand the "Claims History" card.
2. Observe the table state — should be empty with a prompt to select a policy.
3. Select a policy from the policy dropdown.
4. Observe the table.

**Expected Result:** After policy selection, the table loads and displays rows with columns: Claim No, Patient Name, Relation, Hospital, Claim Date, Type, Claimed (₹), Approved (₹), Status. Claim Date shows `DD Mon YYYY` format (e.g. `14 Jan 2025`), not a raw timestamp. Per TRD §9B.2.

---

### TC-FUNC-053 — Claims History Claim Type and Status filters narrow table rows

**Category:** Functional
**Priority:** High
**Preconditions:** Claims History table is loaded with a policy that has both Cashless and Reimbursement claims.
**Test Data:** Policy with mixed claim types and mixed statuses.

**Test Steps:**
1. With the table loaded, change Claim Type filter to "Cashless".
2. Observe table rows.
3. Change Status filter to "Closed".
4. Observe table rows.
5. Reset both filters to "All".

**Expected Result:** Step 2: Only Cashless claims are visible. Step 4: Only Closed Cashless claims are visible. Step 5: All claims reload. Filter changes trigger a new API call each time. Per TRD §9B.2.

---

### TC-FUNC-054 — Endorsement Report table loads without policy selection

**Category:** Functional
**Priority:** High
**Preconditions:** Company has at least 3 endorsement records across multiple policies.
**Test Data:** Valid HR_ADMIN JWT.

**Test Steps:**
1. Expand the "Endorsement Report" card.
2. Observe the table — no policy selection required.

**Expected Result:** Table loads immediately showing all endorsements for the company. Columns: Endorsement ID, Policy No, Type, Start Date, End Date, Status, Uploads, Successful. Date columns show `DD Mon YYYY`. Per TRD §9B.3.

---

### TC-FUNC-055 — Backend CSV download for Claims History

**Description:** Verify that the Export Report button calls the backend download API and triggers a file save.

**Preconditions:** Claims History card expanded; policy selected; at least one claim row returned.

**Steps:**
1. Select a policy in the Claims History card.
2. Verify table shows claim rows.
3. Click "Export Report" button.
4. Observe browser behaviour and network request.

**Expected:**
- Button label changes to "Downloading..." during request.
- `POST /hr-module/download/policy_claim_history` is called with the same body used for generate.
- Response is a blob with `Content-Type: text/csv` and `Content-Disposition: attachment; filename=policy_claim_history.csv`.
- Browser prompts save-file dialog (or auto-downloads based on browser setting).
- Downloaded file contains more columns than the UI table (all DB result columns).

**Pass criteria:** File downloads; contains header row; no client-side CSV code executed.

---

### TC-FUNC-056 — Backend CSV download for Endorsement Report

**Description:** Verify that the Endorsement Report Export button calls the backend download API.

**Preconditions:** Endorsement Report card expanded; at least one endorsement record exists.

**Steps:**
1. Expand the Endorsement Report card.
2. Verify table loads endorsement rows.
3. Click "Export Report".

**Expected:**
- `POST /hr-module/download/endorsement_list` called with `{ companyId, policyId: "" }`.
- File downloads as CSV with all DB columns.
- Date columns in file appear as `DD/MM/YYYY` (already formatted by SQL).

**Pass criteria:** File downloads without error.

---

### TC-FUNC-057 — Enrollment Report loads without a required filter

**Description:** Verify the Enrollment Report card loads employee data on expand with no filter selected.

**Preconditions:** Company has enrolled employees in the DB.

**Steps:**
1. Click the Enrollment Report card.
2. Observe the expand panel and data load.

**Expected:**
- Panel opens with an Enrollment Status dropdown (default: All).
- Table loads with columns: Emp ID, Name, Gender, Email, Status, Sum Insured (₹), Dependents, Last Login.
- "Export Report" button is active.
- `POST /hr-module/generate/ibp_hr_employee_listing` called with `{ companyId, search: "", gender: "", enrollStatus: "", limit: "", offset: "" }`.

**Pass criteria:** Table renders rows; no 400/500 errors.

---

### TC-FUNC-058 — Enrollment Status filter narrows enrollment table rows

**Description:** Verify that selecting an enrollment status re-fetches data filtered to that status.

**Preconditions:** TC-FUNC-057 passed; company has employees in multiple enrollment states.

**Steps:**
1. Expand Enrollment Report card.
2. Change Enrollment Status dropdown to "Enrolled".
3. Observe re-fetch and table update.

**Expected:**
- `POST /hr-module/generate/ibp_hr_employee_listing` re-called with `enrollStatus: "EMPLOYEE_ENROLLMENT_STATUS_ENROLLED"`.
- Table rows reflect only enrolled employees.
- Row count decreases (or stays same if all enrolled).

**Pass criteria:** Network call made with correct param; table updates.

---

**Expected:**
- No filter bar shown.
- Table loads with columns: Policy, Type, Period From, Period To, Inception (₹), Additions (₹), Deletions (₹), Total Premium (₹), Total Lives.
- One row per policy.
- `POST /hr-module/generate/company_policy_details_summary` called with `{ companyId }`.

**Pass criteria:** Table renders rows; no errors.

---

### TC-FUNC-060 — Disabled "Coming soon" cards cannot be expanded

**Description:** Verify that cards without a reportKey are non-interactive.

**Steps:**
1. Navigate to Reports page.
2. Click a "Coming soon" card (e.g. Demography Report).
3. Observe behaviour.

**Expected:**
- Card does not expand.
- No network request fired.
- No console error.
- Card shows 50% opacity and "Coming soon" pill badge.

**Pass criteria:** No interaction, no API call.

---

### TC-EDGE-016 — Claims History table stays empty when no policy is selected

**Category:** Edge
**Priority:** High
**Preconditions:** Reports page loaded. Claims History card expanded.

**Test Steps:**
1. Expand the Claims History card without selecting a policy.
2. Observe table state.
3. Observe network requests.

**Expected Result:** Table shows an empty/prompt state — no rows, no error toast. No API call is made to `policy_claim_history` until a policy is selected. Per PRD §9A.5 and TRD §9B.4.

---

### TC-EDGE-017 — Policy with no claims in selected filters shows empty state

**Category:** Edge
**Priority:** Medium
**Preconditions:** A policy exists that has no Reimbursement claims.
**Test Data:** `policyId` of a policy with only Cashless claims.

**Test Steps:**
1. Load Claims History with the policy selected.
2. Change Claim Type filter to "Reimbursement".
3. Observe table.

**Expected Result:** Table shows an empty state (no rows, no error). The empty state does not trigger an error toast or console error. Per PRD §9A.6.

---

### TC-NEG-013 — policy_claim_history called without policyId returns 400

**Category:** Negative
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** Request body omitting `policyId` or sending `policyId: ""`.

**Test Steps:**
1. Send `POST /hr/report/generate/policy_claim_history` with an empty `policyId`.
2. Observe response.

**Expected Result:** HTTP 400. Error response matches framework envelope: `{ "statusCode": 400, "message": "Failed to generate report.", "error": "..." }`. No data returned. Per TRD §9B.2.

---

### TC-NEG-014 — Download API with zero rows returns empty CSV

**Description:** Verify that downloading a report with no data rows does not crash the frontend or backend.

**Preconditions:** Report exists in DB but returns zero rows for current companyId/filters.

**Steps:**
1. Expand a live report card (e.g. Endorsement Report) with no data.
2. Click "Export Report".

**Expected:**
- `POST /hr-module/download/:reportKey` called.
- Backend returns an empty string or header-only CSV (not a 500).
- Frontend receives blob; save-file dialog opens (file may be empty).
- No JavaScript error thrown.

**Pass criteria:** No crash; response received.

---

### TC-API-011 — POST policy_claim_history with valid policyId returns 201 with data.rows

**Category:** API
**Priority:** Critical
**Preconditions:** Valid HR_ADMIN JWT. Policy with at least one claim record.
**Test Data:** `POST /hr/report/generate/policy_claim_history` with `{ "policyId": "<valid id>", "claimStatus": "", "claimType": "", "startYear": "", "endYear": "", "search": "" }`.

**Test Steps:**
1. Send the request with a valid `policyId`.
2. Inspect HTTP status and response body.

**Expected Result:** HTTP 201. Body: `{ "statusCode": 201, "message": "Report generated successfully.", "data": { "rows": [...], "count": <n> } }`. Each row in `data.rows` contains at minimum: `claimNumber`, `patientName`, `claimDate`, `claimType`, `claimedAmount`, `approvedAmount`, `status`. Per TRD §9B.2.

---

### TC-API-012 — POST endorsement_list with valid companyId and empty policyId returns all endorsements

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT. Company has endorsement records across multiple policies.
**Test Data:** `POST /hr/report/generate/endorsement_list` with `{ "companyId": <valid id>, "policyId": "" }`.

**Test Steps:**
1. Send the request with `policyId: ""` (empty — means all policies).
2. Inspect response.

**Expected Result:** HTTP 201. `data.rows` contains endorsements from all policies. Each row contains: `endorsementId`, `policyNumber`, `endorsementType`, `enrollmentStartDate`, `enrollmentEndDate`, `endorsementStatus`, `uploadCount`, `totalSuccessCount`. `data.count` equals total endorsement record count for the company. Per TRD §9B.3.

---

### TC-API-013 — POST ibp_hr_employee_listing with all 6 params returns employee rows

**Preconditions:** `ibp_hr_employee_listing` registered in `admin_reports`; company has employees.

**Request:**
```json
POST /hr-module/generate/ibp_hr_employee_listing
{
  "companyId": <valid id>,
  "search": "",
  "gender": "",
  "enrollStatus": "",
  "limit": "",
  "offset": ""
}
```

**Expected:** HTTP 201; `data.data` is an array of employee objects; `data.count` ≥ 0.

**Failure case — missing param:** If any of the 6 params is absent, the SQL placeholder `###param###` remains unsubstituted and the query fails with a DB error → HTTP 400.

**Pass criteria:** 201 with non-empty data array.

---

### TC-API-014 — POST company_policy_details_summary with companyId returns policy rows

**Preconditions:** `company_policy_details_summary` seeded via the idempotent script in `hr-module-employee-support-scripts.sql`; company has at least one policy.

**Request:**
```json
POST /hr-module/generate/company_policy_details_summary
{
  "companyId": <valid id>
}
```

**Expected:** HTTP 201; `data.data` contains one object per policy with `policyName`, `totalPremium`, `totalLives` etc.

**Pass criteria:** 201 with rows.

---

### TC-API-015 — POST /hr-module/download/:reportKey returns blob with attachment header

**Preconditions:** Report exists and returns at least one row.

**Request:**
```
POST /hr-module/download/endorsement_list
Body: { "companyId": <valid id>, "policyId": "" }
```

**Expected:**
- HTTP 200.
- `Content-Type: text/csv` (or `application/octet-stream` if password-protected).
- `Content-Disposition: attachment; filename=endorsement_list.csv`.
- Body is valid CSV text; first line is a comma-separated header of all DB column names; subsequent lines are data rows.

**Pass criteria:** 200; correct headers; parseable CSV body.

---

*HR Analytics Test Case Suite — IBP HR Portal — May 2026 | v1.2*
*Source: hr-analytics-prd.md v2.2 · hr-analytics-sds.md v1.1 · hr-analytics-trd.md v1.2*
*Total test cases: 143 across 11 categories (v1.2: TC-FUNC-051–056, TC-EDGE-016–017, TC-NEG-013–014, TC-API-011–012; v1.3: TC-FUNC-057–060, TC-API-013–015)*