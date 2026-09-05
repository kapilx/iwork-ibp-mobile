# HR Portal CD Management — Test Case Suite

**Document Version:** 1.1
**Date:** 2026-05-08
**Source Documents:**
- PRD v1.3: `hr-portal-cd-management-PRD.md`
- SDS v2.1: `hr-portal-cd-management-SDS.md`
- TRD v2.1: `hr-portal-cd-management-TRD.md`
**Jira Reference:** IIRM-9479

> When any source document is updated, affected test cases must be updated, added, or removed. Changed test cases are flagged with 🔁 **Updated** and a brief change note.

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
| TC-FUNC-001 | Page loads all three sections in parallel | Functional | Critical | — |
| TC-FUNC-002 | KPI — Total Deposit Balance displayed correctly | Functional | Critical | — |
| TC-FUNC-003 | KPI — Utilised Amount displayed correctly | Functional | Critical | — |
| TC-FUNC-004 | KPI — Utilisation percentage calculated correctly | Functional | Critical | — |
| TC-FUNC-005 | KPI — Last Deposit Date, amount, and bank displayed | Functional | High | — |
| TC-FUNC-006 | KPI — Quarter-over-quarter change indicator | Functional | High | — |
| TC-FUNC-007 | KPI — 6-month net balance trend data renders | Functional | High | — |
| TC-FUNC-008 | Account Details — active accounts only | Functional | Critical | — |
| TC-FUNC-009 | Account Details — all required fields displayed | Functional | High | — |
| TC-FUNC-010 | Account Details — Total row computed client-side | Functional | High | — |
| TC-FUNC-011 | Account Details — utilisation urgency indicator (Normal) | Functional | High | — |
| TC-FUNC-012 | Account Details — utilisation urgency indicator (Caution) | Functional | High | — |
| TC-FUNC-013 | Account Details — utilisation urgency indicator (Warning) | Functional | High | — |
| TC-FUNC-014 | Account Details — utilisation indicator (Over-utilised) | Functional | High | — |
| TC-FUNC-015 | Account Details — Search by CD account name | Functional | High | — |
| TC-FUNC-016 | Account Details — Search by insurer policy number | Functional | High | — |
| TC-FUNC-017 | Account Details — Search triggers API call (not client-side) | Functional | High | — |
| TC-FUNC-018 | Account Details — Clear search restores all accounts | Functional | Medium | — |
| TC-FUNC-019 | Account Details — View Transactions pre-filters transactions section | Functional | Critical | — |
| TC-FUNC-020 | Account Details — View Transactions scrolls to transactions section | Functional | High | — |
| TC-FUNC-021 | Account Details — Export as Excel | Functional | High | — |
| TC-FUNC-022 | Account Details — Export as CSV | Functional | High | — |
| TC-FUNC-023 | Account Details — Export as PDF | Functional | High | — |
| TC-FUNC-024 | Transactions — Default load (Last 6 Months, no policy pre-filter, All Types) | Functional | Critical | — |
| TC-FUNC-025 | Transactions — policyId navigation context persists across filter changes | Functional | High | — |
| TC-FUNC-026 | Transactions — Filter by Date Range Last 1 Month | Functional | High | — |
| TC-FUNC-027 | Transactions — Filter by Date Range Last 3 Months | Functional | High | — |
| TC-FUNC-028 | Transactions — Filter by Date Range Last 12 Months | Functional | High | — |
| TC-FUNC-029 | Transactions — Filter by Date Range Custom | Functional | High | — |
| TC-FUNC-030 | Transactions — Filter by Type Deposit (Credit) | Functional | High | — |
| TC-FUNC-031 | Transactions — Filter by Type Deduction (Debit) | Functional | High | — |
| TC-FUNC-032 | Transactions — Search by Reference ID | Functional | High | — |
| TC-FUNC-033 | Transactions — Search by Remarks | Functional | High | — |
| TC-FUNC-034 | Transactions — All filters applied simultaneously (AND logic) | Functional | Critical | — |
| TC-FUNC-035 | Transactions — Reset clears all filters to defaults | Functional | High | — |
| TC-FUNC-036 | Transactions — Record count updates on filter change | Functional | Medium | — |
| TC-FUNC-037 | Transactions — Expand Debit row shows correct fields | Functional | High | — |
| TC-FUNC-038 | Transactions — Expand Credit row shows correct fields | Functional | High | — |
| TC-FUNC-039 | Transactions — Collapse expanded row | Functional | Medium | — |
| TC-FUNC-040 | Transactions — Expand row requires no additional API call | Functional | High | — |
| TC-FUNC-041 | Transactions — Pagination default 50 rows per page | Functional | High | — |
| TC-FUNC-042 | Transactions — Navigate to page N | Functional | Medium | — |
| TC-FUNC-043 | Transactions — Export as Excel respects active filters | Functional | High | — |
| TC-FUNC-044 | Transactions — Export as PDF respects active filters | Functional | High | — |
| TC-FUNC-045 | Transactions — Amount sign display (positive credit, negative debit) | Functional | High | — |
| TC-FUNC-046 | Navigation — HR Admin enters CD Management tab from Policy Details | Functional | Critical | — |
| TC-EDGE-001 | CD account with zero balance — displays ₹0 and 0% utilisation | Edge | High | — |
| TC-EDGE-002 | No active CD accounts for company — KPI shows zeros | Edge | High | — |
| TC-EDGE-003 | No credit transactions — lastDepositDate shows as not available | Edge | High | — |
| TC-EDGE-004 | Utilisation exceeds 100% — over-utilised state shown as warning | Edge | Critical | — |
| TC-EDGE-005 | Deduction with no linked endorsement — endorsement ref not available | Edge | High | — |
| TC-EDGE-006 | Deposit with no bank name — bank shown as not available | Edge | High | — |
| TC-EDGE-007 | Running balance null — shown as not available | Edge | High | — |
| TC-EDGE-008 | balanceTrendData fewer than 6 entries — renders available points only | Edge | Medium | — |
| TC-EDGE-009 | No transactions match active filters — empty state shown | Edge | High | — |
| TC-EDGE-010 | Maximum page size (500 rows per page) | Edge | Medium | — |
| TC-EDGE-011 | Search with special regex characters | Edge | Medium | — |
| TC-EDGE-012 | Search string that matches zero accounts | Edge | Medium | — |
| TC-EDGE-013 | Company has exactly one active CD account | Edge | Medium | — |
| TC-EDGE-014 | Transaction date on exact boundary of date range filter | Edge | Medium | — |
| TC-EDGE-015 | Export when active filter returns exactly 1 row | Edge | Low | — |
| TC-EDGE-016 | utilisedPercent null when totalDepositBalance = 0 — not available | Edge | High | — |
| TC-NEG-001 | Access without JWT token — returns 401 | Negative | Critical | — |
| TC-NEG-002 | Valid JWT with non-HR_ADMIN role — returns 403 | Negative | Critical | — |
| TC-NEG-003 | Export with no matching data — rejected with user message | Negative | High | — |
| TC-NEG-004 | companyId in request body mismatches session company — returns 400 | Negative | Critical | — |
| TC-NEG-005 | Unknown report key — returns 400 (not 404) | Negative | High | — |
| TC-NEG-006 | Invalid txnType value sent as filter | Negative | Medium | — |
| TC-NEG-007 | Non-integer policyId sent as filter | Negative | Medium | — |
| TC-NEG-008 | Limit exceeding framework maximum (>500) | Negative | Medium | — |
| TC-NEG-009 | Offset greater than total matching row count | Negative | Medium | — |
| TC-NEG-010 | Invalid date format in startDate / endDate | Negative | Medium | — |
| TC-NEG-011 | startDate greater than endDate in custom range | Negative | Medium | — |
| TC-SEC-001 | Expired JWT token rejected — 401 | Security | Critical | — |
| TC-SEC-002 | SQL injection via search parameter | Security | Critical | — |
| TC-SEC-003 | Cross-company data access attempt via companyId tampering | Security | Critical | — |
| TC-SEC-004 | RBAC — non-HR_ADMIN cannot access any CD report endpoint | Security | Critical | — |
| TC-SEC-005 | XSS payload in search and remarks fields | Security | High | — |
| TC-SEC-006 | No PII columns (email, phone, DOB) exposed in CD SQL | Security | High | — |
| TC-SEC-007 | Tampered JWT payload (altered role claim) | Security | Critical | — |
| TC-SEC-008 | SQL injection via policyId filter | Security | Critical | — |
| TC-SEC-009 | Insecure direct object reference — requesting another company's report | Security | Critical | — |
| TC-PERF-001 | Page initial load — KPI + Account Details < 2 seconds | Performance | Critical | — |
| TC-PERF-002 | Transaction table default load < 2 seconds | Performance | Critical | — |
| TC-PERF-003 | Export generation < 5 seconds | Performance | High | — |
| TC-PERF-004 | All three sections fetch in parallel on page load | Performance | High | — |
| TC-PERF-005 | Filter change response time with large dataset | Performance | High | — |
| TC-PERF-006 | Page availability — 99.9% uptime target | Performance | High | — |
| TC-PERF-007 | Concurrent users from same company | Performance | Medium | — |
| TC-INT-001 | ibp-service reads caution_deposit tables from policy-service domain | Integration | Critical | — |
| TC-INT-002 | Generate endpoint returns correct response envelope shape | Integration | Critical | — |
| TC-INT-003 | Download endpoint returns binary file with correct Content-Disposition | Integration | High | — |
| TC-INT-004 | Policy table has no deleted_at column — no deleted_at filter applied on joins | Integration | Critical | — |
| TC-INT-005 | Endorsement join for DEBIT transactions | Integration | High | — |
| TC-INT-006 | Users table join for createdBy field | Integration | High | — |
| TC-INT-007 | Database unavailability — section-level error state with retry | Integration | High | — |
| TC-INT-008 | View Transactions cross-section interaction triggers fresh API call | Integration | High | — |
| TC-INT-009 | Reset in Transactions section retains policyId navigation context | Integration | High | — |
| TC-ACC-001 | KPI cards keyboard accessible | Accessibility | High | — |
| TC-ACC-002 | Utilisation indicator has ARIA state labels | Accessibility | High | — |
| TC-ACC-003 | Table headers have correct scope attribute | Accessibility | High | — |
| TC-ACC-004 | Expand/collapse row accessible via keyboard | Accessibility | High | — |
| TC-ACC-005 | Filter controls labelled for screen readers | Accessibility | High | — |
| TC-ACC-006 | Error states announced by assistive technology | Accessibility | Medium | — |
| TC-ACC-007 | Empty state announced by assistive technology | Accessibility | Medium | — |
| TC-ACC-008 | Export button accessible and labelled | Accessibility | Medium | — |
| TC-ACC-009 | Page layout responsive on mobile viewport | Accessibility | Medium | — |
| TC-REG-001 | No deleted_at filter applied against caution_deposit table | Regression | Critical | — |
| TC-REG-002 | companyId substituted as bare integer (no quotes in SQL) | Regression | Critical | — |
| TC-REG-003 | Frontend reads data.rows not bare data array | Regression | Critical | — |
| TC-REG-004 | txnStatus placeholder absent — no column-not-found error | Regression | Critical | — |
| TC-REG-005 | admin_reports uses name column, not report_name | Regression | High | — |
| TC-REG-006 | Expand row null fields show "—" not blank or "null" string | Regression | High | — |
| TC-REG-007 | utilisedPercent null when balance is zero — not divide-by-zero | Regression | Critical | — |
| TC-REG-008 | runningBalance rendered as-is (varchar, not cast to number) | Regression | High | — |
| TC-DATA-001 | totalDepositBalance equals sum of balance_amount across active accounts | Data Integrity | Critical | — |
| TC-DATA-002 | KPI utilisedAmount equals sum of all DEBIT_TRANSACTION amounts | Data Integrity | Critical | — |
| TC-DATA-003 | Account-level utilisationPercent calculation accuracy (±0.1%) | Data Integrity | High | — |
| TC-DATA-004 | Credit rows have positive amount; Debit rows have negative amount | Data Integrity | Critical | — |
| TC-DATA-005 | balanceTrendData monthly net = credits minus debits per month | Data Integrity | High | — |
| TC-DATA-006 | Account Details Total row = client-side sum of displayed rows | Data Integrity | High | — |
| TC-DATA-007 | data.count = total filtered rows across all pages | Data Integrity | Critical | — |
| TC-DATA-008 | Account Details ordered by utilisationPercent DESC NULLS LAST | Data Integrity | Medium | — |
| TC-DATA-009 | Only CD_ACCOUNT_ACTIVE accounts appear in Account Details | Data Integrity | Critical | — |
| TC-DATA-010 | Exported data matches table data for identical filters | Data Integrity | High | — |
| TC-API-001 | POST generate endpoint returns 201 on success | API | Critical | — |
| TC-API-002 | POST download endpoint returns 200 with binary file | API | Critical | — |
| TC-API-003 | GET reports_list returns 200 | API | Medium | — |
| TC-API-004 | Missing Content-Type header on generate request | API | Medium | — |
| TC-API-005 | Malformed JSON body on generate request | API | High | — |
| TC-API-006 | Missing required companyId in request body | API | High | — |
| TC-API-007 | Unknown report key returns 400 not 404 | API | High | — |
| TC-API-008 | HTTP GET on generate endpoint returns 405 | API | Medium | — |
| TC-API-009 | Correct placeholder coverage — all ###token### have matching parameter rows | API | Critical | — |
| TC-API-010 | Export format query parameter — invalid value rejected | API | Medium | — |
| TC-API-011 | Export path removes LIMIT/OFFSET — full result set returned | API | High | — |
| TC-API-012 | KPI report returns single-row array (data.rows length = 1) | API | Critical | — |

---

## 1. Functional Test Cases

---

### TC-FUNC-001 — Page loads all three sections in parallel

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin is authenticated with a valid JWT. Company has at least one active CD account and transaction records.
**Test Data:** Valid HR_ADMIN JWT for company ID 42.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Open browser network tab and observe outbound requests.
3. Confirm that all three POST requests fire simultaneously: `cd_kpi_summary`, `cd_account_details`, `cd_transactions`.

**Expected Result:** All three API calls are made in parallel (overlapping request timelines). Each section renders independently as its response resolves. No section waits for another section to complete before fetching.

---

### TC-FUNC-002 — KPI — Total Deposit Balance displayed correctly

**Category:** Functional
**Priority:** Critical
**Preconditions:** Company has 3 active CD accounts with balance_amount values of ₹100,000, ₹250,000, and ₹50,000.
**Test Data:** companyId = 42; expected Total Deposit Balance = ₹400,000.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Wait for the KPI section to load.
3. Read the "Total Deposit Balance" KPI card value.

**Expected Result:** KPI card displays ₹4,00,000 (sum of all active CD account balances). Value sourced from `data.rows[0].totalDepositBalance`.

---

### TC-FUNC-003 — KPI — Utilised Amount displayed correctly

**Category:** Functional
**Priority:** Critical
**Preconditions:** Company has DEBIT_TRANSACTION entries totalling ₹80,000 across all CD accounts.
**Test Data:** companyId = 42; cumulative debit total = ₹80,000.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Wait for the KPI section to load.
3. Read the "Utilised Amount" KPI card value.

**Expected Result:** KPI card displays ₹80,000. Value sourced from `data.rows[0].utilisedAmount`.

---

### TC-FUNC-004 — KPI — Utilisation percentage calculated correctly

**Category:** Functional
**Priority:** Critical
**Preconditions:** totalDepositBalance = ₹400,000; utilisedAmount = ₹80,000.
**Test Data:** Expected utilisedPercent = 20.0%.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Observe the utilisation percentage shown on the KPI card.

**Expected Result:** Utilisation percentage displays 20.0%. Value matches ROUND(80000 × 100.0 / 400000, 1). Sourced from `data.rows[0].utilisedPercent`.

---

### TC-FUNC-005 — KPI — Last Deposit Date, amount, and bank displayed

**Category:** Functional
**Priority:** High
**Preconditions:** The most recent CREDIT_TRANSACTION for the company is dated 15 Apr 2026, amount ₹50,000, bank "HDFC Bank".
**Test Data:** companyId = 42.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Read the "Last Deposit Date" KPI card.

**Expected Result:** Card displays "15 Apr 2026", amount ₹50,000, and bank name "HDFC Bank". Fields sourced from `lastDepositDate`, `lastDepositAmount`, `lastDepositBank`.

---

### TC-FUNC-006 — KPI — Quarter-over-quarter change indicator

**Category:** Functional
**Priority:** High
**Preconditions:** Current quarter deposit balance is higher than the previous quarter.
**Test Data:** Current Q balance = ₹400,000; previous Q balance = ₹350,000; expected change = +₹50,000 / +14.3%.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Observe the secondary indicator on each KPI card.

**Expected Result:** Each KPI card shows a quarter-over-quarter direction indicator (increase/decrease) and magnitude alongside the primary value. Positive change is communicated distinctly from negative.

---

### TC-FUNC-007 — KPI — 6-month net balance trend data renders

**Category:** Functional
**Priority:** High
**Preconditions:** `balanceTrendData` contains 6 monthly net values (credits minus debits) ordered oldest to newest.
**Test Data:** balanceTrendData = [10000, -5000, 20000, 15000, -3000, 25000].

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Observe the trend visual on the KPI cards.

**Expected Result:** A trend visualization (sparkline or equivalent) renders 6 data points in chronological order. The frontend uses `balanceTrendData` from `data.rows[0]` directly as the input array. No manipulation other than rendering.

---

### TC-FUNC-008 — Account Details — active accounts only

**Category:** Functional
**Priority:** Critical
**Preconditions:** Company has 2 active CD accounts (status = CD_ACCOUNT_ACTIVE) and 1 inactive account (status = CD_ACCOUNT_INACTIVE).
**Test Data:** companyId = 42; 3 total accounts, 2 active.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Count the rows in the Account Details table.

**Expected Result:** Table shows exactly 2 rows — only the accounts with `status = 'CD_ACCOUNT_ACTIVE'`. The inactive account does not appear.

---

### TC-FUNC-009 — Account Details — all required fields displayed

**Category:** Functional
**Priority:** High
**Preconditions:** At least one active CD account exists.
**Test Data:** Account row with known values: cdAccountName = "Main CD", policyNumber = "POL-001", depositBalance = ₹100,000, utilisedAmount = ₹40,000, utilisationPercent = 40.0%, lastUpdated = "01 May 2026".

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Inspect a row in the Account Details table.

**Expected Result:** Each row displays CD Account Name, Policy Number, Deposit Balance (₹), Utilised Amount (₹), Utilisation (%), and Last Updated date. All fields match API response values.

---

### TC-FUNC-010 — Account Details — Total row computed client-side

**Category:** Functional
**Priority:** High
**Preconditions:** Account Details has 3 rows with depositBalance values of ₹100,000, ₹250,000, ₹50,000 and utilisedAmount values of ₹40,000, ₹80,000, ₹10,000.
**Test Data:** Expected totals: depositBalance = ₹400,000; utilisedAmount = ₹130,000.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Scroll to the bottom of the Account Details table.
3. Read the Total row values.

**Expected Result:** A Total row appears at the bottom displaying the sum of all Deposit Balance (₹400,000) and Utilised Amount (₹130,000) values. This row is computed in the frontend — no API call is made for it.

---

### TC-FUNC-011 — Account Details — utilisation urgency indicator (Normal)

**Category:** Functional
**Priority:** High
**Preconditions:** An account has utilisationPercent = 40%.
**Test Data:** utilisationPercent = 40.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Locate the account row with 40% utilisation.
3. Observe the utilisation indicator.

**Expected Result:** Indicator shows Normal/Healthy state (green, ≤50%). No urgency styling applied.

---

### TC-FUNC-012 — Account Details — utilisation urgency indicator (Caution)

**Category:** Functional
**Priority:** High
**Preconditions:** An account has utilisationPercent = 65%.
**Test Data:** utilisationPercent = 65.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Locate the account row with 65% utilisation.
3. Observe the utilisation indicator.

**Expected Result:** Indicator shows Caution state (amber, 51–80%). Communicates account is approaching risk.

---

### TC-FUNC-013 — Account Details — utilisation urgency indicator (Warning)

**Category:** Functional
**Priority:** High
**Preconditions:** An account has utilisationPercent = 85%.
**Test Data:** utilisationPercent = 85.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Locate the account row with 85% utilisation.
3. Observe the utilisation indicator.

**Expected Result:** Indicator shows Warning state (red, >80%). Communicates account needs attention.

---

### TC-FUNC-014 — Account Details — utilisation indicator (Over-utilised)

**Category:** Functional
**Priority:** High
**Preconditions:** An account has utilisationPercent = 115%.
**Test Data:** utilisationPercent = 115.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Locate the account row with 115% utilisation.
3. Observe the indicator.

**Expected Result:** Indicator shows Over-utilised state (>100%). Visually distinct from all other states. Clearly communicates an abnormal critical condition.

---

### TC-FUNC-015 — Account Details — Search by CD account name

**Category:** Functional
**Priority:** High
**Preconditions:** Two accounts exist: "Main CD Account" and "Backup CD Account".
**Test Data:** Search input: "Main".

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Type "Main" in the Account Details search field.
3. Wait for debounce (300 ms) and API response.

**Expected Result:** Table refreshes and shows only "Main CD Account". Search is case-insensitive and partial. "Backup CD Account" is not shown.

---

### TC-FUNC-016 — Account Details — Search by insurer policy number

**Category:** Functional
**Priority:** High
**Preconditions:** Accounts are linked to policy numbers "INS-POL-001" and "INS-POL-002".
**Test Data:** Search input: "POL-001".

**Test Steps:**
1. Type "POL-001" in the Account Details search field.
2. Wait for API response.

**Expected Result:** Table shows only the account linked to policy "INS-POL-001". Search matches against `policyNumber` (ILIKE).

---

### TC-FUNC-017 — Account Details — Search triggers API call (not client-side filter)

**Category:** Functional
**Priority:** High
**Preconditions:** Account Details is loaded.
**Test Data:** Any search string.

**Test Steps:**
1. Open the browser network tab.
2. Type a search term in the Account Details search input.
3. Observe the network requests fired.

**Expected Result:** A new POST request to `/hr/report/generate/cd_account_details` is made with the search term in the request body. No client-side filtering of existing data occurs.

---

### TC-FUNC-018 — Account Details — Clear search restores all accounts

**Category:** Functional
**Priority:** Medium
**Preconditions:** A search filter is active showing 1 of 3 accounts.
**Test Data:** Clear search field.

**Test Steps:**
1. Clear the search field in Account Details.
2. Wait for API response.

**Expected Result:** API is called with `search: ''`. Table shows all active CD accounts (3 rows). Total row recalculates.

---

### TC-FUNC-019 — Account Details — View Transactions pre-filters transactions section

**Category:** Functional
**Priority:** Critical
**Preconditions:** Account Details shows at least two accounts. Transactions section is loaded showing "All Accounts".
**Test Data:** Click "View Transactions" on account with policyId = 7.

**Test Steps:**
1. Click "View Transactions" on the first account row (policyId = 7).
2. Observe the CD Account filter in the Deposit Transactions section.
3. Observe the network request made.

**Expected Result:** The Transactions section CD Account filter is set to policyId = 7. A new POST to `/hr/report/generate/cd_transactions` fires with `policyId: 7`. The Transactions table re-renders showing only that policy's transactions.

---

### TC-FUNC-020 — Account Details — View Transactions scrolls to transactions section

**Category:** Functional
**Priority:** High
**Preconditions:** Page is scrolled to the top. Account Details section is visible.
**Test Data:** Any account row.

**Test Steps:**
1. Click "View Transactions" on any account row.
2. Observe page scroll position.

**Expected Result:** Page scrolls to bring the Deposit Transactions section into view. No page navigation occurs.

---

### TC-FUNC-021 — Account Details — Export as Excel

**Category:** Functional
**Priority:** High
**Preconditions:** Account Details has loaded with data.
**Test Data:** No active search filter.

**Test Steps:**
1. Click the Export button in the Account Details section.
2. Select "Excel" format.
3. Wait for download.

**Expected Result:** POST to `/hr-module/download/cd_account_details?format=excel` fires with `{ companyId, search: '' }`. A `.xlsx` file downloads with all account rows. File has `Content-Disposition: attachment` header.

---

### TC-FUNC-022 — Account Details — Export as CSV

**Category:** Functional
**Priority:** High
**Preconditions:** Account Details has loaded with data.
**Test Data:** Active search filter: "Main".

**Test Steps:**
1. With "Main" in the search field, click Export → CSV.

**Expected Result:** POST to `/hr-module/download/cd_account_details?format=csv` fires with `{ companyId, search: 'Main' }`. A `.csv` file downloads containing only rows that match the search filter.

---

### TC-FUNC-023 — Account Details — Export as PDF

**Category:** Functional
**Priority:** High
**Preconditions:** Account Details has loaded.
**Test Data:** No active filter.

**Test Steps:**
1. Click Export → PDF in the Account Details section.

**Expected Result:** POST to `/hr-module/download/cd_account_details?format=pdf` fires. A `.pdf` file downloads.

---

### TC-FUNC-024 — Transactions — Default load (Last 6 Months, no policy pre-filter, All Types)

🔁 **Updated** — Removed "All Policies" label; policyId is navigation context (not a user-facing filter). On initial page load policyId = '' (no filter), which changes to viewPolicyId once "View Transactions" is clicked.

**Category:** Functional
**Priority:** Critical
**Preconditions:** Company has transaction records across multiple policies.
**Test Data:** companyId = 42; default filters applied; no "View Transactions" click yet.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Wait for the Deposit Transactions section to load.
3. Inspect the active filter values and observe the outbound API request body.

**Expected Result:** Transactions section loads with `policyId: ''` (no policy pre-filter on initial load), `txnType: ''`, `startDate` = 6 months ago, `endDate` = today, `search: ''`. Default page size is 50. Section shows transaction count. There is no user-facing policy-selection dropdown in the Transactions section — policy scope is set only via "View Transactions" navigation context (TRD §6.3).

---

### TC-FUNC-025 — Transactions — policyId navigation context persists across filter changes

🔁 **Updated** — There is no user-facing Policy dropdown in the Transactions section per TRD §6.3. policyId is navigation context set by "View Transactions" and is not changeable via filter controls. Test now verifies policyId is retained when other filters are changed.

**Category:** Functional
**Priority:** High
**Preconditions:** "View Transactions" has been clicked on an account with policyId = 7. Transactions section is showing results scoped to policyId = 7. Transactions also exist for policyId = 12.
**Test Data:** viewPolicyId = 7; change Transaction Type filter to "Deposit (Credit)".

**Test Steps:**
1. Click "View Transactions" on an account row with policyId = 7 (establishes navigation context).
2. Verify the Transactions section loads scoped to policyId = 7.
3. Change the Transaction Type filter to "Deposit (Credit)".
4. Wait for API response.
5. Inspect the policyId in the outbound request body.

**Expected Result:** After changing the Type filter, POST fires with `{ companyId, policyId: '7', txnType: 'CREDIT_TRANSACTION', startDate, endDate, search }`. policyId = 7 is retained — it is navigation context, not a user-selectable filter. Transactions for policyId = 12 do not appear. The Transactions section exposes no dropdown to change the policyId (TRD §6.3).

---

### TC-FUNC-026 — Transactions — Filter by Date Range Last 1 Month

**Category:** Functional
**Priority:** High
**Preconditions:** Transactions exist within and outside the last 1 month.
**Test Data:** Select "Last 1 Month" preset.

**Test Steps:**
1. Open the Date Range dropdown.
2. Select "Last 1 Month".
3. Wait for API response.

**Expected Result:** POST fires with startDate = `NOW() - INTERVAL '1 month'` and endDate = `NOW()`. Only transactions within the last month appear.

---

### TC-FUNC-027 — Transactions — Filter by Date Range Last 3 Months

**Category:** Functional
**Priority:** High
**Preconditions:** Transactions span more than 3 months of history.
**Test Data:** Select "Last 3 Months" preset.

**Test Steps:**
1. Select "Last 3 Months" from Date Range dropdown.

**Expected Result:** POST fires with startDate = `NOW() - INTERVAL '3 months'`. Only transactions within the last 3 months appear.

---

### TC-FUNC-028 — Transactions — Filter by Date Range Last 12 Months

**Category:** Functional
**Priority:** High
**Preconditions:** Transactions span more than 12 months.
**Test Data:** Select "Last 12 Months" preset.

**Test Steps:**
1. Select "Last 12 Months" from Date Range dropdown.

**Expected Result:** POST fires with startDate = `NOW() - INTERVAL '12 months'`. All transactions within the last year are returned.

---

### TC-FUNC-029 — Transactions — Filter by Date Range Custom

**Category:** Functional
**Priority:** High
**Preconditions:** Transactions exist.
**Test Data:** Custom start = 2026-01-01; custom end = 2026-01-31.

**Test Steps:**
1. Select "Custom" from Date Range dropdown.
2. Enter start date 2026-01-01 and end date 2026-01-31.
3. Wait for API response.

**Expected Result:** POST fires with `startDate: '2026-01-01'` and `endDate: '2026-01-31'`. Only January 2026 transactions appear.

---

### TC-FUNC-030 — Transactions — Filter by Type Deposit (Credit)

**Category:** Functional
**Priority:** High
**Preconditions:** Company has both CREDIT and DEBIT transactions.
**Test Data:** Select "Deposit (Credit)" from Transaction Type dropdown.

**Test Steps:**
1. Open Transaction Type dropdown.
2. Select "Deposit (Credit)".
3. Wait for API response.

**Expected Result:** POST fires with `txnType: 'CREDIT_TRANSACTION'`. Only Deposit rows appear. No Deduction rows present. `txnType` displays as "Deposit".

---

### TC-FUNC-031 — Transactions — Filter by Type Deduction (Debit)

**Category:** Functional
**Priority:** High
**Preconditions:** Company has both CREDIT and DEBIT transactions.
**Test Data:** Select "Deduction (Debit)" from Transaction Type dropdown.

**Test Steps:**
1. Select "Deduction (Debit)" from the Transaction Type dropdown.

**Expected Result:** POST fires with `txnType: 'DEBIT_TRANSACTION'`. Only Deduction rows appear. `txnType` displays as "Deduction".

---

### TC-FUNC-032 — Transactions — Search by Reference ID

**Category:** Functional
**Priority:** High
**Preconditions:** A CREDIT_TRANSACTION exists with referenceId = "NEFT202601010001".
**Test Data:** Search input: "NEFT2026".

**Test Steps:**
1. Type "NEFT2026" in the Transactions search input.
2. Wait for API response (300 ms debounce).

**Expected Result:** Only the transaction with referenceId containing "NEFT2026" appears. POST fires with `search: 'NEFT2026'`. Match is case-insensitive.

---

### TC-FUNC-033 — Transactions — Search by Remarks

**Category:** Functional
**Priority:** High
**Preconditions:** A DEBIT_TRANSACTION has remarks = "Q1 endorsement addition".
**Test Data:** Search input: "Q1 endorsement".

**Test Steps:**
1. Type "Q1 endorsement" in the Transactions search input.
2. Wait for API response.

**Expected Result:** Only transactions whose `remarks` contains "Q1 endorsement" appear. Match is partial and case-insensitive.

---

### TC-FUNC-034 — Transactions — All filters applied simultaneously (AND logic)

**Category:** Functional
**Priority:** Critical
**Preconditions:** Transactions exist across multiple policies, types, and dates.
**Test Data:** policyId = 7, txnType = CREDIT_TRANSACTION, startDate = 2026-01-01, endDate = 2026-03-31, search = "HDFC".

**Test Steps:**
1. Set Policy = policyId 7.
2. Set Type = Deposit (Credit).
3. Set Date Range = Custom: 2026-01-01 to 2026-03-31.
4. Type "HDFC" in the search box.
5. Wait for API response.

**Expected Result:** Only transactions satisfying ALL four conditions simultaneously are returned (AND logic). Each filter is applied together in a single API call.

---

### TC-FUNC-035 — Transactions — Reset clears all filters to defaults except policyId

🔁 **Updated** — policyId (navigation context) is never cleared by Reset per TRD §8.7. Previous expected result incorrectly showed policyId resetting to ''.

**Category:** Functional
**Priority:** High
**Preconditions:** "View Transactions" has been clicked (viewPolicyId = 7). Additional filters are active: txnType = CREDIT_TRANSACTION, custom date range, search = "test".
**Test Data:** viewPolicyId = 7; click Reset.

**Test Steps:**
1. Click "View Transactions" on an account (sets viewPolicyId = 7).
2. Apply: txnType = CREDIT_TRANSACTION, custom date range, search = "test".
3. Click the Reset control.
4. Observe the filter state and the outbound API request body.

**Expected Result:** Date Range resets to Last 6 Months, Transaction Type resets to All, Search clears to empty. **policyId = 7 is retained** — it is navigation context and is never cleared by Reset (TRD §8.7). Pagination resets to page 1. POST fires with `{ companyId, policyId: '7', startDate: '<6 months ago>', endDate: '<today>', txnType: '', search: '' }`.

---

### TC-FUNC-036 — Transactions — Record count updates on filter change

**Category:** Functional
**Priority:** Medium
**Preconditions:** Transactions section is loaded showing 120 total records.
**Test Data:** Apply policy filter reducing results to 35 records.

**Test Steps:**
1. Note the record count display (120).
2. Apply a Policy filter.
3. Observe the count after the API responds.

**Expected Result:** The count display adjacent to the section title updates to reflect the new total (35). Count sources from `data.count` in the API response.

---

### TC-FUNC-037 — Transactions — Expand Debit row shows correct fields

**Category:** Functional
**Priority:** High
**Preconditions:** A DEBIT_TRANSACTION row is visible in the Transactions table. Row has endorsementNumber = "END-001", endorsementType = "Addition", referenceId = "CHQ-999", ifscCode = "HDFC0001234", createdBy = "Ops User", remarks = "April addition".
**Test Data:** Click "›" on a Deduction row.

**Test Steps:**
1. Locate a Deduction (DEBIT_TRANSACTION) row.
2. Click the expand chevron "›".
3. Observe the expanded detail panel.

**Expected Result:** Expanded panel shows: Endorsement Reference (END-001), Endorsement Type (Addition), Reference ID (CHQ-999), IFSC Code (HDFC0001234), Created By (Ops User), Remarks (April addition). No additional API call is made.

---

### TC-FUNC-038 — Transactions — Expand Credit row shows correct fields

**Category:** Functional
**Priority:** High
**Preconditions:** A CREDIT_TRANSACTION row is visible. Row has referenceId = "NEFT001", bankName = "HDFC Bank", transactionValueDate = "01 Jan 2026", ifscCode = "HDFC0001234", createdBy = "Finance Ops", remarks = "Initial deposit".
**Test Data:** Click "›" on a Deposit row.

**Test Steps:**
1. Locate a Deposit (CREDIT_TRANSACTION) row.
2. Click the expand chevron "›".

**Expected Result:** Expanded panel shows: Reference Number (NEFT001), Bank (HDFC Bank), Value Date (01 Jan 2026), IFSC Code (HDFC0001234), Created By (Finance Ops), Remarks (Initial deposit). No additional API call.

---

### TC-FUNC-039 — Transactions — Collapse expanded row

**Category:** Functional
**Priority:** Medium
**Preconditions:** A row is expanded (chevron shows "˅").
**Test Data:** Click "˅" on an expanded row.

**Test Steps:**
1. Expand a transaction row.
2. Click the chevron again (now "˅").

**Expected Result:** The detail panel collapses. Chevron returns to "›". No API call made.

---

### TC-FUNC-040 — Transactions — Expand row requires no additional API call

**Category:** Functional
**Priority:** High
**Preconditions:** Transactions section loaded with data.
**Test Data:** Open network tab; click any expand chevron.

**Test Steps:**
1. Open browser network tab.
2. Click the expand chevron on any transaction row.
3. Inspect for new network requests.

**Expected Result:** No new network request is fired. All expand-row fields (endorsementNumber, endorsementType, referenceId, ifscCode, transactionValueDate, createdBy, remarks) were already included in the initial list response.

---

### TC-FUNC-041 — Transactions — Pagination default 50 rows per page

**Category:** Functional
**Priority:** High
**Preconditions:** Company has 80 transactions matching the default filters.
**Test Data:** companyId = 42; 80 total transactions.

**Test Steps:**
1. Load Transactions section with default filters.
2. Count visible rows.
3. Observe pagination controls.

**Expected Result:** First page shows 50 rows. Pagination control communicates "1–50 of 80". `data.count` = 80.

---

### TC-FUNC-042 — Transactions — Navigate to page N

**Category:** Functional
**Priority:** Medium
**Preconditions:** Transactions table has multiple pages.
**Test Data:** Navigate to page 2 (offset = 50, limit = 50).

**Test Steps:**
1. Click page 2 in the pagination control.
2. Observe the API request and rendered rows.

**Expected Result:** POST fires with `limit: 50` and offset = (2 - 1) × 50 = 50. Rows 51–80 render. Active filters remain unchanged.

---

### TC-FUNC-043 — Transactions — Export as Excel respects active filters

**Category:** Functional
**Priority:** High
**Preconditions:** Transactions section has active filters: policyId = 7, txnType = CREDIT_TRANSACTION.
**Test Data:** Click Export → Excel.

**Test Steps:**
1. Apply filters: Policy = 7, Type = Deposit.
2. Click Export → Excel.
3. Inspect the network request.

**Expected Result:** POST to `/hr-module/download/cd_transactions?format=excel` fires with `{ companyId, policyId: '7', txnType: 'CREDIT_TRANSACTION', startDate, endDate, search }`. No LIMIT/OFFSET in the download SQL. File contains all matching rows, not just the current page.

---

### TC-FUNC-044 — Transactions — Export as PDF respects active filters

**Category:** Functional
**Priority:** High
**Preconditions:** Active search filter: "NEFT".
**Test Data:** Click Export → PDF.

**Test Steps:**
1. Type "NEFT" in search.
2. Click Export → PDF.

**Expected Result:** POST to `/hr-module/download/cd_transactions?format=pdf` fires with `search: 'NEFT'`. File contains only matching rows across all pages.

---

### TC-FUNC-045 — Transactions — Amount sign display (positive credit, negative debit)

**Category:** Functional
**Priority:** High
**Preconditions:** Both CREDIT and DEBIT transactions are visible.
**Test Data:** CREDIT row amount = ₹50,000; DEBIT row amount = -₹10,000 (as returned by API).

**Test Steps:**
1. Load Transactions section.
2. Observe the Amount column for a Deposit row and a Deduction row.

**Expected Result:** Deposit row: amount displayed as "+₹50,000" (green text). Deduction row: amount displayed as "−₹10,000" (red text). Deposits and deductions are visually distinguishable.

---

### TC-FUNC-046 — Navigation — HR Admin enters CD Management tab from Policy Details

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin is on the HR Portal Dashboard.
**Test Data:** Valid HR_ADMIN session.

**Test Steps:**
1. Navigate to the HR Portal Dashboard.
2. Click on a policy to open the Policy Details page.
3. Click the "CD Management" tab.

**Expected Result:** The CD Management tab becomes active. All CD account data is scoped to the selected policy. No policy selector appears within the tab — policy context is inherited from the navigation.

---

## 2. Edge Test Cases

---

### TC-EDGE-001 — CD account with zero balance — displays ₹0 and 0% utilisation

**Category:** Edge
**Priority:** High
**Preconditions:** One active CD account has balance_amount = 0.
**Test Data:** companyId = 42; account "Zero Balance CD" with depositBalance = 0.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Locate the "Zero Balance CD" account in Account Details.

**Expected Result:** Deposit Balance displays ₹0. Utilised Amount displays ₹0. Utilisation percentage displays 0% (or "not available" if `utilisationPercent` is null per NULLIF guard). Account remains visible in the table.

---

### TC-EDGE-002 — No active CD accounts for company — KPI shows zeros

**Category:** Edge
**Priority:** High
**Preconditions:** Company exists but has no CD accounts with status = CD_ACCOUNT_ACTIVE.
**Test Data:** companyId = 99 (no active accounts).

**Test Steps:**
1. Navigate to `/hr/cd-manage` as HR Admin for company 99.
2. Observe KPI cards and Account Details table.

**Expected Result:** KPI cards show ₹0 for Total Deposit Balance, Utilised Amount. `utilisedPercent` is null — displayed as "not available". Trend shows no-data state. Account Details table is empty with an appropriate empty state message.

---

### TC-EDGE-003 — No credit transactions — lastDepositDate shows as not available

**Category:** Edge
**Priority:** High
**Preconditions:** Company has active CD accounts with DEBIT_TRANSACTION records but no CREDIT_TRANSACTION records.
**Test Data:** companyId = 42; 0 credit transactions.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Observe the "Last Deposit Date" KPI card.

**Expected Result:** `lastDepositDate`, `lastDepositAmount`, and `lastDepositBank` are all null. KPI card displays "not available" (not blank, not "null" string) for all three fields.

---

### TC-EDGE-004 — Utilisation exceeds 100% — over-utilised state shown as warning

**Category:** Edge
**Priority:** Critical
**Preconditions:** An account has utilisedAmount > depositBalance (e.g., utilisationPercent = 115%).
**Test Data:** depositBalance = ₹100,000; utilisedAmount = ₹115,000; utilisationPercent = 115.0.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Locate the over-utilised account row.
3. Observe the utilisation indicator and percentage value.

**Expected Result:** Utilisation percentage shows 115.0% accurately. The indicator is in the over-utilised state, visually distinct and clearly communicating a critical abnormal condition. No capping at 100%.

---

### TC-EDGE-005 — Deduction with no linked endorsement — endorsement ref shows not available

**Category:** Edge
**Priority:** High
**Preconditions:** A DEBIT_TRANSACTION row has endorsement_id = NULL.
**Test Data:** Deduction row with no linked endorsement.

**Test Steps:**
1. Find a Deduction row in the Transactions section.
2. Expand the row.
3. Observe the Endorsement Reference and Endorsement Type fields.

**Expected Result:** Both "Endorsement Reference" and "Endorsement Type" show "not available" (or "—"). Neither field is blank or shows "null".

---

### TC-EDGE-006 — Deposit with no bank name — bank shows not available

**Category:** Edge
**Priority:** High
**Preconditions:** A CREDIT_TRANSACTION row has bank_name = NULL.
**Test Data:** Deposit row with no bank_name.

**Test Steps:**
1. Locate a Deposit row in Transactions table.
2. Check the Bank column in the main list view.
3. Expand the row and check the Bank field in the detail panel.

**Expected Result:** Both the Bank column in the list and the Bank field in the expanded detail show "not available". Not blank, not "null".

---

### TC-EDGE-007 — Running balance null — shows not available

**Category:** Edge
**Priority:** High
**Preconditions:** A transaction has cd_balance_amount = NULL (legacy record).
**Test Data:** Transaction with runningBalance = null.

**Test Steps:**
1. Load Transactions section.
2. Find a row where Running Balance is null.
3. Observe the Running Balance cell.

**Expected Result:** Running Balance cell displays "not available" (or "—"). Not blank, not "null". Field is varchar — no cast to number attempted.

---

### TC-EDGE-008 — balanceTrendData fewer than 6 entries — renders available points only

**Category:** Edge
**Priority:** Medium
**Preconditions:** Company has transaction history for only 3 months (not 6).
**Test Data:** balanceTrendData = [10000, -5000, 20000] (3 entries).

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Observe the trend visualization on KPI cards.

**Expected Result:** Trend visualization renders the 3 available data points. No error, no placeholder for missing months. Chart adapts to fewer data points.

---

### TC-EDGE-009 — No transactions match active filters — empty state shown

**Category:** Edge
**Priority:** High
**Preconditions:** Transactions section is loaded.
**Test Data:** Apply filter for a date range where no transactions exist (e.g., future date range).

**Test Steps:**
1. Set Date Range custom filter: startDate = 2099-01-01, endDate = 2099-12-31.
2. Wait for API response.

**Expected Result:** Transactions section shows an empty state message communicating "no data available for the selected criteria". Record count shows 0. This is not an error state — it is a valid no-results condition. `data.rows = []`, `data.count = 0`.

---

### TC-EDGE-010 — Maximum page size (500 rows per page)

**Category:** Edge
**Priority:** Medium
**Preconditions:** Company has more than 500 transactions.
**Test Data:** Set limit = 500 via API request body.

**Test Steps:**
1. Send POST to `/hr/report/generate/cd_transactions` with `limit: 500`.
2. Observe the response.

**Expected Result:** Response returns up to 500 rows for the current page. No error. `data.count` reflects the total matching rows (may exceed 500).

---

### TC-EDGE-011 — Search with special regex characters

**Category:** Edge
**Priority:** Medium
**Preconditions:** Account Details and Transactions sections loaded.
**Test Data:** Search inputs: "%", "_", "'", "\\".

**Test Steps:**
1. Type "%" in the Account Details search field.
2. Wait for API response.
3. Repeat with "_", "'", "\\".

**Expected Result:** No SQL error occurs. The system safely handles special characters. Results match only rows containing the literal character. No unexpected wildcard behaviour.

---

### TC-EDGE-012 — Search string that matches zero accounts

**Category:** Edge
**Priority:** Medium
**Preconditions:** Account Details loaded with 3 accounts.
**Test Data:** Search input: "ZZZNOMATCH".

**Test Steps:**
1. Type "ZZZNOMATCH" in the Account Details search field.
2. Wait for API response.

**Expected Result:** Account Details table shows empty state ("no data available"). Total row disappears or shows ₹0. No error thrown.

---

### TC-EDGE-013 — Company has exactly one active CD account

**Category:** Edge
**Priority:** Medium
**Preconditions:** Company has exactly 1 active CD account.
**Test Data:** companyId = 55; 1 active account.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Observe Account Details and KPI cards.

**Expected Result:** KPI cards reflect data for the single account. Account Details shows 1 row. Total row equals the single account's values. View Transactions filters to that account's policy.

---

### TC-EDGE-014 — Transaction date on exact boundary of date range filter

**Category:** Edge
**Priority:** Medium
**Preconditions:** A transaction exists with transaction_date = 2026-01-01.
**Test Data:** Custom date range: startDate = 2026-01-01, endDate = 2026-01-31.

**Test Steps:**
1. Set custom date range: 2026-01-01 to 2026-01-31.
2. Wait for API response.

**Expected Result:** The transaction dated exactly 2026-01-01 is included in the results (boundary inclusive). SQL condition: `cdt.transaction_date >= '2026-01-01'::date`.

---

### TC-EDGE-015 — Export when active filter returns exactly 1 row

**Category:** Edge
**Priority:** Low
**Preconditions:** A filter combination matches only 1 transaction.
**Test Data:** Specific referenceId search matching 1 record.

**Test Steps:**
1. Apply search matching 1 transaction.
2. Click Export → Excel.

**Expected Result:** Export is generated with 1 data row. File downloads successfully. No "no data" rejection since 1 row exists.

---

### TC-EDGE-016 — utilisedPercent null when totalDepositBalance = 0 — displayed as not available

**Category:** Edge
**Priority:** High
**Preconditions:** totalDepositBalance = 0 (all active accounts have zero balance).
**Test Data:** NULLIF guard triggers; utilisedPercent = null.

**Test Steps:**
1. Navigate to `/hr/cd-manage` for a company where all active CD balances are 0.
2. Observe the Utilisation (%) KPI card.

**Expected Result:** Utilisation KPI card displays "not available". No division attempted. No NaN, Infinity, or blank displayed.

---

## 3. Negative Test Cases

---

### TC-NEG-001 — Access without JWT token — returns 401

**Category:** Negative
**Priority:** Critical
**Preconditions:** No JWT token in the request.
**Test Data:** API call to POST `/hr/report/generate/cd_kpi_summary` with no Authorization header.

**Test Steps:**
1. Send POST `/hr/report/generate/cd_kpi_summary` without an Authorization header.
2. Observe the HTTP response.

**Expected Result:** HTTP 401 Unauthorized. `JwtAuthGuard` rejects the request before any method executes. No data is returned.

---

### TC-NEG-002 — Valid JWT with non-HR_ADMIN role — returns 403

**Category:** Negative
**Priority:** Critical
**Preconditions:** User is authenticated but has role = EMPLOYEE (not HR_ADMIN).
**Test Data:** Valid JWT with role claim = "EMPLOYEE".

**Test Steps:**
1. Obtain a valid JWT for a user with EMPLOYEE role.
2. Send POST `/hr/report/generate/cd_kpi_summary` with this JWT.
3. Observe the HTTP response.

**Expected Result:** HTTP 403 Forbidden. `RolesGuard` rejects the request. No data is returned.

---

### TC-NEG-003 — Export with no matching data — rejected with user message

**Category:** Negative
**Priority:** High
**Preconditions:** Active filter combination returns 0 rows.
**Test Data:** Search term "ZZZNOMATCH" yields 0 results. Click Export.

**Test Steps:**
1. Apply a filter that returns 0 transactions.
2. Click Export → Excel.

**Expected Result:** Export is not generated. No file download occurs. User is informed that there is no data to export (informational toast or inline message). API returns 400.

---

### TC-NEG-004 — companyId in request body mismatches session company — returns 400

**Category:** Negative
**Priority:** Critical
**Preconditions:** Authenticated HR Admin belongs to companyId = 42. Sends request with companyId = 99.
**Test Data:** JWT company = 42; request body companyId = 99.

**Test Steps:**
1. Authenticate as HR Admin for company 42.
2. Manually craft a POST to `/hr/report/generate/cd_kpi_summary` with `{ companyId: 99 }`.
3. Observe the response.

**Expected Result:** HTTP 400. Service layer validates that the `companyId` in the request matches the session's company. Mismatch results in rejection. No data from company 99 is returned.

---

### TC-NEG-005 — Unknown report key — returns 400 (not 404)

**Category:** Negative
**Priority:** High
**Preconditions:** Authenticated HR Admin.
**Test Data:** POST `/hr/report/generate/cd_nonexistent_report`.

**Test Steps:**
1. Send POST to `/hr/report/generate/cd_nonexistent_report` with valid JWT and companyId.
2. Observe the HTTP response code.

**Expected Result:** HTTP 400 (not 404). The unknown key fails at SQL metadata lookup time. The error response clearly indicates the report key was not found.

---

### TC-NEG-006 — Invalid txnType value sent as filter

**Category:** Negative
**Priority:** Medium
**Preconditions:** Authenticated HR Admin.
**Test Data:** POST `/hr/report/generate/cd_transactions` with `{ txnType: 'INVALID_TYPE' }`.

**Test Steps:**
1. Send the transactions report request with `txnType: 'INVALID_TYPE'`.
2. Observe the response.

**Expected Result:** DTO validation rejects the invalid value before SQL substitution. HTTP 400 returned. No raw SQL executed with the invalid value.

---

### TC-NEG-007 — Non-integer policyId sent as filter

**Category:** Negative
**Priority:** Medium
**Preconditions:** Authenticated HR Admin.
**Test Data:** POST with `{ policyId: 'abc' }`.

**Test Steps:**
1. Send the transactions report request with `policyId: 'abc'`.
2. Observe the response.

**Expected Result:** DTO validation catches the non-integer value. HTTP 400 returned. The SQL cast `cdt.policy_id::text = 'abc'` is never executed (or returns safely with no matches).

---

### TC-NEG-008 — Limit exceeding framework maximum (>500)

**Category:** Negative
**Priority:** Medium
**Preconditions:** Authenticated HR Admin.
**Test Data:** POST with `{ limit: 1000 }`.

**Test Steps:**
1. Send the transactions report request with `limit: 1000`.
2. Observe the response.

**Expected Result:** Framework enforces maximum of 500 rows per page. Request is rejected (400) or limit is capped at 500. No more than 500 rows returned.

---

### TC-NEG-009 — Offset greater than total matching row count

**Category:** Negative
**Priority:** Medium
**Preconditions:** Total matching rows = 30.
**Test Data:** POST with `{ offset: 100, limit: 50 }`.

**Test Steps:**
1. Send request with offset beyond the total row count.
2. Observe the response.

**Expected Result:** API returns 200 with `data.rows = []` and `data.count = 30`. No error. Empty page is a valid state.

---

### TC-NEG-010 — Invalid date format in startDate / endDate

**Category:** Negative
**Priority:** Medium
**Preconditions:** Authenticated HR Admin.
**Test Data:** POST with `{ startDate: '01-01-2026' }` (non-ISO format).

**Test Steps:**
1. Send the transactions request with `startDate: '01-01-2026'`.
2. Observe the response.

**Expected Result:** DTO validation rejects the invalid date format before SQL execution. HTTP 400 returned with a clear validation error.

---

### TC-NEG-011 — startDate greater than endDate in custom range

**Category:** Negative
**Priority:** Medium
**Preconditions:** Authenticated HR Admin.
**Test Data:** POST with `{ startDate: '2026-12-31', endDate: '2026-01-01' }`.

**Test Steps:**
1. Set custom date range where start > end.
2. Submit (or send API request directly).
3. Observe the response or UI behaviour.

**Expected Result:** Validation prevents submission. Either DTO rejects the invalid range (400) or the UI prevents submission with an inline validation message before the API call is made.

---

## 4. Security Test Cases

---

### TC-SEC-001 — Expired JWT token rejected — 401

**Category:** Security
**Priority:** Critical
**Preconditions:** A JWT token that was valid but has passed its expiry time.
**Test Data:** Expired JWT (exp claim in the past).

**Test Steps:**
1. Use an expired JWT to send POST `/hr/report/generate/cd_kpi_summary`.
2. Observe the HTTP response.

**Expected Result:** HTTP 401. `JwtAuthGuard` validates the token expiry. The request is rejected before any controller method executes.

---

### TC-SEC-002 — SQL injection via search parameter

**Category:** Security
**Priority:** Critical
**Preconditions:** Authenticated HR Admin.
**Test Data:** Search input: `'; DROP TABLE caution_deposit; --`.

**Test Steps:**
1. Type `'; DROP TABLE caution_deposit; --` in the Account Details search field.
2. Observe whether any SQL error occurs or unusual behaviour results.
3. Verify `caution_deposit` table is unaffected.

**Expected Result:** The search value is passed through DTO validation and substituted as a literal string in the ILIKE pattern. No SQL execution error occurs. No tables are dropped or affected. The ILIKE condition safely returns 0 matches for the literal string. All `###placeholder###` values are DTO-validated before substitution.

---

### TC-SEC-003 — Cross-company data access attempt via companyId tampering

**Category:** Security
**Priority:** Critical
**Preconditions:** HR Admin authenticated for company 42. Company 99 has sensitive CD data.
**Test Data:** POST with `{ companyId: 99 }` using company-42 JWT.

**Test Steps:**
1. Authenticate as HR Admin for company 42.
2. Send POST to `/hr/report/generate/cd_account_details` with `{ companyId: 99 }`.
3. Observe whether company 99's data is returned.

**Expected Result:** HTTP 400. Service layer validates that the request `companyId` matches the session company. Company 99 data is never returned. No data leakage occurs.

---

### TC-SEC-004 — RBAC — non-HR_ADMIN cannot access any CD report endpoint

**Category:** Security
**Priority:** Critical
**Preconditions:** User has roles: EMPLOYEE, HR_VIEWER, SUPER_ADMIN, INSURER_ADMIN (each tested separately).
**Test Data:** Valid JWTs for each non-HR_ADMIN role.

**Test Steps:**
1. For each non-HR_ADMIN role, send POST to `/hr/report/generate/cd_kpi_summary`.
2. Send POST to `/hr/report/generate/cd_account_details`.
3. Send POST to `/hr/report/generate/cd_transactions`.
4. Send POST to `/hr-module/download/cd_account_details`.

**Expected Result:** HTTP 403 for every request. `RolesGuard` enforces `HR_ADMIN` role check on all endpoints. No data returned for any non-HR_ADMIN role.

---

### TC-SEC-005 — XSS payload in search and remarks fields

**Category:** Security
**Priority:** High
**Preconditions:** Authenticated HR Admin.
**Test Data:** Search input: `<script>alert('xss')</script>`.

**Test Steps:**
1. Type `<script>alert('xss')</script>` in the Transactions search field.
2. Wait for API response.
3. Observe whether the script executes in the browser.

**Expected Result:** No script executes. The input is treated as a literal string for ILIKE matching. If displayed in the UI, it is rendered as escaped text. No XSS vulnerability present.

---

### TC-SEC-006 — No PII columns exposed in CD report SQL

**Category:** Security
**Priority:** High
**Preconditions:** Review the SQL bodies in the TRD §3.
**Test Data:** Inspect all three SQL queries.

**Test Steps:**
1. Review the `cd_kpi_summary` SQL — confirm no email, phone, DOB, or national ID columns are selected.
2. Review the `cd_account_details` SQL — same check.
3. Review the `cd_transactions` SQL — confirm only `first_name` and `last_name` are used from `users` (no encrypted columns).

**Expected Result:** No encrypted or PII columns (email, phone, DOB) from the `users` table are referenced in any CD Management report SQL. Only `first_name` and `last_name` (plain text) are used for `createdBy`.

---

### TC-SEC-007 — Tampered JWT payload (altered role claim)

**Category:** Security
**Priority:** Critical
**Preconditions:** User has EMPLOYEE role. They alter the JWT payload to claim HR_ADMIN role.
**Test Data:** JWT with tampered `roles: ["HR_ADMIN"]` claim but invalid signature.

**Test Steps:**
1. Decode a valid EMPLOYEE JWT.
2. Alter the `roles` claim to `["HR_ADMIN"]`.
3. Re-encode without valid signature.
4. Send POST `/hr/report/generate/cd_kpi_summary` with this JWT.

**Expected Result:** HTTP 401. `JwtAuthGuard` detects the invalid signature and rejects the token. The tampered role claim is never evaluated.

---

### TC-SEC-008 — SQL injection via policyId filter

**Category:** Security
**Priority:** Critical
**Preconditions:** Authenticated HR Admin.
**Test Data:** POST with `{ policyId: "7 OR 1=1" }`.

**Test Steps:**
1. Send POST to `/hr/report/generate/cd_transactions` with `policyId: "7 OR 1=1"`.
2. Observe whether all company transactions are returned or an error occurs.

**Expected Result:** DTO validation rejects the non-integer policyId value (400). The SQL is never executed with the injected value. No expanded result set returned.

---

### TC-SEC-009 — Insecure direct object reference — requesting another company's report

**Category:** Security
**Priority:** Critical
**Preconditions:** Two companies: A (companyId=42) and B (companyId=99). HR Admin authenticated for A.
**Test Data:** HR Admin of company A sends request with companyId=99.

**Test Steps:**
1. Authenticate as HR Admin for company A.
2. Send multiple report requests each with `{ companyId: 99 }`.
3. Also attempt to guess report-specific IDs belonging to company B.

**Expected Result:** HTTP 400 on all attempts. Server enforces `companyId` scoping from the JWT session. No cross-tenant data exposure. All SQL uses `WHERE cd.company_id = ###companyId###` scoped to the session company.

---

## 5. Performance Test Cases

---

### TC-PERF-001 — Page initial load — KPI + Account Details < 2 seconds

**Category:** Performance
**Priority:** Critical
**Preconditions:** Average production dataset: company with 5 active CD accounts.
**Test Data:** Measure time from navigation to `/hr/cd-manage` until KPI cards and Account Details are fully rendered.

**Test Steps:**
1. Open browser performance tools.
2. Navigate to `/hr/cd-manage`.
3. Record time from navigation start to both KPI cards and Account Details sections rendering with data.

**Expected Result:** KPI cards and Account Details section fully render within 2 seconds from page navigation. This is the NFR target defined in PRD §6.

---

### TC-PERF-002 — Transaction table default load < 2 seconds

**Category:** Performance
**Priority:** Critical
**Preconditions:** Company has up to 500 transactions in the last 6 months.
**Test Data:** Default filters; up to 500 transactions.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Measure time from page load to Transactions section displaying first 50 rows.

**Expected Result:** Deposit Transactions section renders within 2 seconds of page navigation when using default filters (Last 6 Months, All Policies, All Types). This is the NFR target.

---

### TC-PERF-003 — Export generation < 5 seconds

**Category:** Performance
**Priority:** High
**Preconditions:** Export dataset of up to 1,000 transaction rows.
**Test Data:** Click Export on Transactions with up to 1,000 matching records.

**Test Steps:**
1. Apply filters yielding ~1,000 transactions.
2. Click Export → Excel.
3. Measure time from click to file download initiation.

**Expected Result:** Export file is generated and download begins within 5 seconds. This is the NFR target defined in PRD §6.

---

### TC-PERF-004 — All three sections fetch in parallel on page load

**Category:** Performance
**Priority:** High
**Preconditions:** Fresh page load.
**Test Data:** Network waterfall chart from browser dev tools.

**Test Steps:**
1. Navigate to `/hr/cd-manage`.
2. Capture the network waterfall.
3. Compare start timestamps of the three report API calls.

**Expected Result:** All three API calls (`cd_kpi_summary`, `cd_account_details`, `cd_transactions`) have overlapping request timelines (parallel). No sequential dependency between them on initial load.

---

### TC-PERF-005 — Filter change response time with large dataset

**Category:** Performance
**Priority:** High
**Preconditions:** Company has 5,000 transaction records.
**Test Data:** Apply a Policy filter on a large dataset.

**Test Steps:**
1. Load Transactions section (5,000 total records).
2. Apply a Policy filter.
3. Measure time from filter change to table re-render.

**Expected Result:** Filter response renders within 2 seconds. Section shows loading state while the API responds. Other sections (KPI, Account Details) remain unaffected and functional.

---

### TC-PERF-006 — Page availability — 99.9% uptime target

**Category:** Performance
**Priority:** High
**Preconditions:** Production environment monitoring enabled.
**Test Data:** Uptime logs over a 30-day period.

**Test Steps:**
1. Monitor availability of the CD Management endpoint over 30 days.
2. Calculate uptime percentage.

**Expected Result:** Availability ≥ 99.9% (max ~43 minutes of downtime per 30-day period). This matches the NFR target in PRD §6.

---

### TC-PERF-007 — Concurrent users from same company

**Category:** Performance
**Priority:** Medium
**Preconditions:** Multiple HR Admins from the same company access the page simultaneously.
**Test Data:** 10 concurrent users, same companyId.

**Test Steps:**
1. Simulate 10 concurrent users navigating to `/hr/cd-manage`.
2. Measure response times and check for data correctness.

**Expected Result:** All 10 users receive correct, consistent data. Response times remain within the 2-second target. No race conditions or data inconsistencies occur.

---

## 6. Integration Test Cases

---

### TC-INT-001 — ibp-service reads caution_deposit tables from policy-service domain

**Category:** Integration
**Priority:** Critical
**Preconditions:** `caution_deposit`, `caution_deposit_transaction`, and `caution_deposit_policy_mapping` tables exist in the shared PostgreSQL database.
**Test Data:** Seed known data in caution_deposit tables.

**Test Steps:**
1. Insert test data into `caution_deposit` and `caution_deposit_transaction`.
2. Call POST `/hr/report/generate/cd_account_details` via ibp-service.
3. Verify the response reflects the seeded data.

**Expected Result:** ibp-service successfully reads from the policy-service-owned tables via raw SQL in `admin_reports.query`. Response data matches seeded values. No cross-service HTTP call is made — data is accessed via direct SQL.

---

### TC-INT-002 — Generate endpoint returns correct response envelope shape

**Category:** Integration
**Priority:** Critical
**Preconditions:** Report `cd_kpi_summary` exists in `admin_reports` table.
**Test Data:** Valid POST to `/hr/report/generate/cd_kpi_summary`.

**Test Steps:**
1. Send POST `/hr/report/generate/cd_kpi_summary` with valid JWT and `{ companyId: 42 }`.
2. Inspect the response body structure.

**Expected Result:** Response is `{ "statusCode": 201, "message": "Report generated successfully.", "data": { "rows": [...], "count": N } }`. `data` is NOT a bare array. `statusCode` = 201. `data.rows` for `cd_kpi_summary` is a 1-element array.

---

### TC-INT-003 — Download endpoint returns CSV file with correct Content-Disposition

🔁 **Updated** — TRD §10 and §8.10 specify the download endpoint returns CSV (`Content-Type: text/csv`). Previous test expected an Excel file.

**Category:** Integration
**Priority:** High
**Preconditions:** `cd_account_details` report has data.
**Test Data:** POST `/hr-module/download/cd_account_details` body: `{ "companyId": 42, "search": "" }`.

**Test Steps:**
1. Send POST to `/hr-module/download/cd_account_details` with valid JWT and companyId.
2. Inspect response headers.
3. Verify file content is CSV.

**Expected Result:** HTTP 200. `Content-Type: text/csv`. `Content-Disposition: attachment; filename=cd_account_details.csv`. Response body is a valid CSV file. No pagination applied — all matching rows present.

---

### TC-INT-004 — Policy table has no deleted_at column — no deleted_at filter applied on joins

🔁 **Updated** — TRD §3 explicitly states the `policy` table has **no `deleted_at` column**. The previous test incorrectly expected `p.deleted_at IS NULL` to exclude soft-deleted policies; adding that condition causes a column-not-found SQL error. The correct behaviour is that no such filter exists.

**Category:** Integration
**Priority:** Critical
**Preconditions:** `admin_reports.query` for `cd_account_details` and `cd_transactions` are seeded per TRD §3. A live database with policy data is accessible.
**Test Data:** Inspect the SQL bodies for `cd_account_details` and `cd_transactions` in `admin_reports.query`.

**Test Steps:**
1. Review the `cd_account_details` SQL — confirm there is no `p.deleted_at IS NULL` condition on the `policy` table join.
2. Review the `cd_transactions` SQL — same check.
3. Execute each report query against the database (with a valid companyId).
4. Verify both queries complete without a "column deleted_at does not exist on table policy" error.

**Expected Result:** Neither `cd_account_details` nor `cd_transactions` SQL includes `p.deleted_at IS NULL` on the `policy` join. The `policy` table has no `deleted_at` column per TRD §3 — adding such a filter causes a column-not-found SQL error. Both queries execute successfully. CD account filtering is performed by `cd.status = 'CD_ACCOUNT_ACTIVE'` only; policy records are not filtered by soft-delete.

---

### TC-INT-005 — Endorsement join for DEBIT transactions

**Category:** Integration
**Priority:** High
**Preconditions:** A DEBIT_TRANSACTION row has endorsement_id referencing an endorsement record with insurer_endorsement_number = "END-2026-001".
**Test Data:** DEBIT_TRANSACTION with endorsement_id = 5; endorsement record id = 5, insurer_endorsement_number = "END-2026-001".

**Test Steps:**
1. Call POST `/hr/report/generate/cd_transactions`.
2. Find the deduction row in the response.
3. Verify `endorsementNumber` field.

**Expected Result:** `endorsementNumber` = "END-2026-001". `endorsementType` matches the endorsement record's type. LEFT JOIN ensures the transaction still appears even if endorsement_id is null.

---

### TC-INT-006 — Users table join for createdBy field

**Category:** Integration
**Priority:** High
**Preconditions:** A transaction has created_by = 10; users table has user id=10, first_name="Ops", last_name="Admin".
**Test Data:** transaction.created_by = 10.

**Test Steps:**
1. Call POST `/hr/report/generate/cd_transactions`.
2. Find the transaction row.
3. Verify `createdBy` field.

**Expected Result:** `createdBy` = "Ops Admin" (TRIM(first_name || ' ' || COALESCE(last_name, ''))). LEFT JOIN ensures the transaction row appears even if `created_by` is null.

---

### TC-INT-007 — Database unavailability — section-level error state with retry

**Category:** Integration
**Priority:** High
**Preconditions:** Database temporarily unavailable (simulated).
**Test Data:** Simulate DB connection failure for one section only.

**Test Steps:**
1. Simulate database unavailability when the `cd_transactions` report query runs.
2. Observe the page state.

**Expected Result:** Only the Deposit Transactions section shows an error state with a retry action. KPI cards and Account Details sections (if already loaded) continue to function. Sections are independent — one failure does not cascade to others.

---

### TC-INT-008 — View Transactions cross-section interaction triggers fresh API call

**Category:** Integration
**Priority:** High
**Preconditions:** Account Details and Transactions sections are loaded.
**Test Data:** Click View Transactions on account row with policyId = 7.

**Test Steps:**
1. Open network tab.
2. Click "View Transactions" on a row with policyId = 7.
3. Observe the API calls triggered.

**Expected Result:** A fresh POST to `/hr/report/generate/cd_transactions` fires with `policyId: '7'`. The Transactions section re-renders with the pre-filtered results. No changes are made to KPI or Account Details sections.

---

### TC-INT-009 — Reset in Transactions section retains policyId navigation context

🔁 **Updated** — TRD §8.7 explicitly states policyId is never cleared by Reset. Previous expected result incorrectly asserted policyId would reset to ''.

**Category:** Integration
**Priority:** High
**Preconditions:** "View Transactions" has been clicked on an account with policyId = 7, setting the navigation context. Additional filters (txnType, date, search) are active.
**Test Data:** viewPolicyId = 7; additional active filters: txnType = CREDIT_TRANSACTION, custom date range, search = "NEFT".

**Test Steps:**
1. Click "View Transactions" on an account (policyId = 7).
2. Apply additional filters: Type = Deposit, custom date range, search = "NEFT".
3. Click Reset in the Transactions section.
4. Inspect the filter state and outbound API request body.

**Expected Result:** Date Range resets to Last 6 Months, Transaction Type resets to All, Search clears to empty. **policyId = 7 is retained** — it is navigation context and is never cleared by Reset per TRD §8.7. POST fires with `{ companyId, policyId: '7', startDate: '<6 months ago>', endDate: '<today>', txnType: '', search: '' }`. The Transactions section continues to show only policyId = 7 transactions.

---

## 7. Accessibility Test Cases

---

### TC-ACC-001 — KPI cards keyboard accessible

**Category:** Accessibility
**Priority:** High
**Preconditions:** Page is loaded.
**Test Data:** Use keyboard-only navigation (Tab, Enter).

**Test Steps:**
1. Load `/hr/cd-manage`.
2. Tab through the KPI cards section using keyboard only.
3. Verify each KPI card is reachable and its values are readable.

**Expected Result:** All KPI cards are reachable via Tab key. Values and trend indicators are announced correctly by screen readers. Focus indicators are visible.

---

### TC-ACC-002 — Utilisation indicator has ARIA state labels

**Category:** Accessibility
**Priority:** High
**Preconditions:** Account Details loaded with accounts at different utilisation levels.
**Test Data:** Screen reader (NVDA or VoiceOver) active.

**Test Steps:**
1. Navigate to Account Details with screen reader active.
2. Focus on the utilisation indicator for a "Warning" state account.

**Expected Result:** Screen reader announces the urgency state (e.g., "Utilisation 85% — Warning"). The visual state (colour/icon) is complemented by an ARIA label or text alternative. Colour alone is not the only indicator.

---

### TC-ACC-003 — Table headers have correct scope attribute

**Category:** Accessibility
**Priority:** High
**Preconditions:** Account Details and Transactions tables loaded.
**Test Data:** Inspect HTML source.

**Test Steps:**
1. Inspect Account Details table headers in the DOM.
2. Check that `<th>` elements have `scope="col"`.
3. Repeat for Transactions table.

**Expected Result:** All column headers have `scope="col"`. Screen readers correctly associate data cells with their headers.

---

### TC-ACC-004 — Expand/collapse row accessible via keyboard

**Category:** Accessibility
**Priority:** High
**Preconditions:** Transactions section loaded.
**Test Data:** Keyboard-only navigation.

**Test Steps:**
1. Tab to a transaction row's expand chevron.
2. Press Enter or Space to expand.
3. Verify the expanded content is announced.
4. Press Enter/Space again to collapse.

**Expected Result:** Expand/collapse is fully operable via keyboard. Screen reader announces expanded/collapsed state (aria-expanded="true/false"). Expanded content is read in logical order.

---

### TC-ACC-005 — Filter controls labelled for screen readers

**Category:** Accessibility
**Priority:** High
**Preconditions:** Transactions section filter bar loaded.
**Test Data:** Screen reader active.

**Test Steps:**
1. Navigate to each filter control (Policy dropdown, Date Range, Type, Search) using keyboard.
2. Verify the screen reader announces the label for each control.

**Expected Result:** Every filter control has an associated label (via `<label for>` or `aria-label`). Screen reader announces "Policy", "Date Range", "Transaction Type", "Search reference, remarks…" appropriately.

---

### TC-ACC-006 — Error states announced by assistive technology

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** An API error occurs for one section.
**Test Data:** Simulate API failure for Transactions section.

**Test Steps:**
1. Trigger an API error for the Transactions section.
2. Observe how the error state is presented.
3. Verify screen reader announces the error.

**Expected Result:** Error state is announced by assistive technology (e.g., via `role="alert"` or `aria-live="assertive"`). The retry action is keyboard accessible. Error message is descriptive.

---

### TC-ACC-007 — Empty state announced by assistive technology

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** Filter returns zero results.
**Test Data:** Apply filter yielding 0 results.

**Test Steps:**
1. Apply a filter that returns 0 results.
2. Verify screen reader announces the empty state.

**Expected Result:** Empty state message ("No transactions found") is announced by assistive technology. Message is rendered as readable text, not only as a visual-only element.

---

### TC-ACC-008 — Export button accessible and labelled

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** Page loaded.
**Test Data:** Keyboard focus on Export button; screen reader active.

**Test Steps:**
1. Tab to the Export button in Account Details.
2. Verify screen reader announces the button's purpose.
3. Activate with Enter/Space.
4. Verify format selection is accessible.

**Expected Result:** Export button has descriptive label ("Export Account Details"). Format selection (Excel/CSV/PDF) is announced and selectable via keyboard.

---

### TC-ACC-009 — Page layout responsive on mobile viewport

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** Simulate mobile viewport (375px width).
**Test Data:** Resize browser to 375px or use device emulation.

**Test Steps:**
1. Open `/hr/cd-manage` in mobile viewport (375px).
2. Verify KPI cards, Account Details table, and Transactions table are legible.
3. Test filter controls usability on mobile.

**Expected Result:** Page layout adapts to mobile viewport. KPI cards stack or scroll horizontally. Tables are scrollable horizontally. Filter controls are usable on touch. No content is cut off or overlapping.

---

## 8. Regression Test Cases

---

### TC-REG-001 — No deleted_at filter applied against caution_deposit table

**Category:** Regression
**Priority:** Critical
**Preconditions:** `caution_deposit` table exists (confirmed to have no `deleted_at` column per TRD §3 note).
**Test Data:** Execute the `cd_account_details` SQL query directly.

**Test Steps:**
1. Review the `cd_account_details` SQL in `admin_reports.query`.
2. Confirm the WHERE clause does not contain `AND cd.deleted_at IS NULL`.
3. Execute the query against the database.

**Expected Result:** No `deleted_at IS NULL` filter is applied to `caution_deposit` or `caution_deposit_transaction`. Query executes without "column does not exist" error. Results are scoped by `cd.status = 'CD_ACCOUNT_ACTIVE'` only.

---

### TC-REG-002 — companyId substituted as bare integer (no quotes in SQL)

**Category:** Regression
**Priority:** Critical
**Preconditions:** The `cd_kpi_summary` and other reports are seeded correctly.
**Test Data:** Execute report with companyId = 42.

**Test Steps:**
1. Examine the substituted SQL after `###companyId###` replacement.
2. Verify the WHERE clause reads `WHERE cd.company_id = 42` (not `= '42'`).

**Expected Result:** `companyId` is substituted as a bare integer without surrounding quotes. The `company_id` column on `caution_deposit` is INT — no type mismatch or implicit cast issue. Query executes without error.

---

### TC-REG-003 — Frontend reads data.rows not bare data array

**Category:** Regression
**Priority:** Critical
**Preconditions:** All three reports return the framework response envelope.
**Test Data:** Inspect frontend code binding for each report.

**Test Steps:**
1. For `cd_kpi_summary`: verify frontend reads `data.rows[0]` (not `data[0]`).
2. For `cd_account_details`: verify frontend reads `data.rows` (not `data`).
3. For `cd_transactions`: verify frontend reads `data.rows` and `data.count`.

**Expected Result:** Frontend correctly accesses the nested `data.rows` array per Framework §4.1. No binding to a bare `data` array. No "undefined is not iterable" runtime errors.

---

### TC-REG-004 — txnStatus placeholder absent — no column-not-found error

**Category:** Regression
**Priority:** Critical
**Preconditions:** `cd_transactions` report is seeded (v2.1 seed script).
**Test Data:** POST `/hr/report/generate/cd_transactions`.

**Test Steps:**
1. Call the `cd_transactions` report with all required parameters.
2. Verify the SQL executes without error.
3. Confirm `admin_reports_parameters` for `cd_transactions` has no row for `###txnStatus###`.

**Expected Result:** No `###txnStatus###` placeholder exists in the SQL or parameters table (removed in v2.1). Query runs without any "column 'status' does not exist on caution_deposit_transaction" error.

---

### TC-REG-005 — admin_reports uses name column, not report_name

**Category:** Regression
**Priority:** High
**Preconditions:** Database schema updated per Framework §3.
**Test Data:** Inspect `admin_reports` table schema.

**Test Steps:**
1. Run `\d admin_reports` or equivalent schema inspect.
2. Verify the column is named `name` (not `report_name`).
3. Verify the seed script upserts using `ON CONFLICT (name)`.

**Expected Result:** `admin_reports` table has column `name` (unique), not `report_name`. Upsert conflicts resolve on `name`. No "column report_name does not exist" error.

---

### TC-REG-006 — Expand row null fields show "—" not blank or "null" string

**Category:** Regression
**Priority:** High
**Preconditions:** A DEBIT_TRANSACTION row has endorsementNumber = null, createdBy = null.
**Test Data:** Expand a Deduction row with null detail fields.

**Test Steps:**
1. Find a Deduction row with null endorsementNumber.
2. Expand the row.
3. Observe the Endorsement Reference and Created By fields.

**Expected Result:** Both fields show "—" (or "not available" per SDS wording). Not blank. Not the string "null". Consistent with TRD §6.3 and SDS §4.4 specification.

---

### TC-REG-007 — utilisedPercent null when balance is zero — not divide-by-zero

**Category:** Regression
**Priority:** Critical
**Preconditions:** A CD account has balance_amount = 0.
**Test Data:** Account with depositBalance = 0 and utilisedAmount = 0.

**Test Steps:**
1. Load Account Details for a company where one account has balance = 0.
2. Observe the utilisation percentage for that account.
3. Verify no JavaScript NaN or Infinity appears.

**Expected Result:** `utilisationPercent` is null (NULLIF guard in SQL). Frontend displays "not available" or 0% as per SDS §3.4 note. No division by zero. No NaN, Infinity, or unhandled exception.

---

### TC-REG-008 — runningBalance rendered as-is (varchar, not cast to number)

**Category:** Regression
**Priority:** High
**Preconditions:** A transaction has `cd_balance_amount` stored as a formatted string (e.g., "1,00,000").
**Test Data:** Transaction with runningBalance = "1,00,000" (varchar).

**Test Steps:**
1. Load the Transactions section.
2. Observe the Running Balance column for this transaction.
3. Verify the value is not processed or reformatted.

**Expected Result:** Running Balance displays exactly as stored in the DB: "1,00,000". No numeric cast, no reformatting, no parsing error. The field is stored as varchar per TRD §6.3 and rendered as-is.

---

## 9. Data Integrity Test Cases

---

### TC-DATA-001 — totalDepositBalance equals sum of balance_amount across active accounts

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Company has 3 active CD accounts with balance_amount: 100000, 250000, 50000.
**Test Data:** Expected totalDepositBalance = 400000.

**Test Steps:**
1. Query the database directly: `SELECT SUM(balance_amount) FROM caution_deposit WHERE company_id = 42 AND status = 'CD_ACCOUNT_ACTIVE'`.
2. Call POST `/hr/report/generate/cd_kpi_summary` and read `data.rows[0].totalDepositBalance`.
3. Compare the two values.

**Expected Result:** `totalDepositBalance` from the API matches the direct database sum exactly (400000). No discrepancy. Only `CD_ACCOUNT_ACTIVE` accounts are included.

---

### TC-DATA-002 — KPI utilisedAmount equals sum of all DEBIT_TRANSACTION amounts

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Company has DEBIT_TRANSACTION records totalling 80000.
**Test Data:** Direct DB query for sum of debit amounts.

**Test Steps:**
1. Query DB: `SELECT SUM(transaction_amount) FROM caution_deposit_transaction cdt JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id WHERE cd.company_id = 42 AND cdt.transaction_type = 'DEBIT_TRANSACTION'`.
2. Compare with `data.rows[0].utilisedAmount` from the KPI API response.

**Expected Result:** API `utilisedAmount` matches the direct DB sum exactly (80000). All DEBIT_TRANSACTION entries across all company accounts are included (not filtered by account status).

---

### TC-DATA-003 — Account-level utilisationPercent calculation accuracy (±0.1%)

**Category:** Data Integrity
**Priority:** High
**Preconditions:** An account has depositBalance = 150000 and utilisedAmount = 75000.
**Test Data:** Expected utilisationPercent = 50.0%.

**Test Steps:**
1. Call `/hr/report/generate/cd_account_details`.
2. Find the account row.
3. Read `utilisationPercent`.
4. Verify: ROUND(75000 × 100.0 / 150000, 1) = 50.0.

**Expected Result:** `utilisationPercent` = 50.0. Calculation is accurate to ±0.1%. ROUND to 1 decimal place applied.

---

### TC-DATA-004 — Credit rows have positive amount; Debit rows have negative amount

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Transactions table has both CREDIT and DEBIT rows.
**Test Data:** CREDIT_TRANSACTION with transaction_amount = 50000; DEBIT_TRANSACTION with transaction_amount = 10000.

**Test Steps:**
1. Call `/hr/report/generate/cd_transactions`.
2. Find the CREDIT row and check `amount`.
3. Find the DEBIT row and check `amount`.

**Expected Result:** CREDIT row `amount` = +50000 (positive). DEBIT row `amount` = -10000 (negative, negated in SQL CASE). The sign convention is enforced in SQL: credits are positive, debits are negated.

---

### TC-DATA-005 — balanceTrendData monthly net = credits minus debits per month

**Category:** Data Integrity
**Priority:** High
**Preconditions:** January 2026: CREDIT = 50000, DEBIT = 20000. February 2026: no transactions. March 2026: CREDIT = 30000.
**Test Data:** Expected trendData = [{"month": Jan, "monthly_balance": 30000}, {"month": Mar, "monthly_balance": 30000}] (only months with activity).

**Test Steps:**
1. Call `/hr/report/generate/cd_kpi_summary`.
2. Inspect `balanceTrendData`.
3. Verify each entry's monthly_balance = credits_that_month - debits_that_month.

**Expected Result:** Each entry in `balanceTrendData` has monthly_balance = (SUM of CREDIT_TRANSACTION amounts) - (SUM of DEBIT_TRANSACTION amounts) for that calendar month. Only months within the last 6 months with transactions are included. Ordered oldest to newest.

---

### TC-DATA-006 — Account Details Total row = client-side sum of displayed rows

**Category:** Data Integrity
**Priority:** High
**Preconditions:** Account Details shows 3 rows after a search filter.
**Test Data:** Row 1: depositBalance=100000, utilisedAmount=40000. Row 2: depositBalance=200000, utilisedAmount=80000. Row 3: depositBalance=50000, utilisedAmount=10000.

**Test Steps:**
1. Apply a search filter showing 3 rows.
2. Read the Total row values.
3. Manually verify: sum of depositBalance = 350000; sum of utilisedAmount = 130000.

**Expected Result:** Total row shows depositBalance = ₹350,000 and utilisedAmount = ₹130,000. Computed client-side from `data.rows`. Updates whenever the search filter changes.

---

### TC-DATA-007 — data.count = total filtered rows across all pages

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Transactions with filter returning 80 total rows. Page 1 shows 50 rows.
**Test Data:** 80 total matching transactions; page 1 of 2.

**Test Steps:**
1. Call `/hr/report/generate/cd_transactions?page=1&limit=50`.
2. Read `data.count`.
3. Read `data.rows.length`.

**Expected Result:** `data.count` = 80 (total matching rows, not page size). `data.rows.length` = 50 (current page). The UI displays "1–50 of 80 transactions".

---

### TC-DATA-008 — Account Details ordered by utilisationPercent DESC NULLS LAST

**Category:** Data Integrity
**Priority:** Medium
**Preconditions:** Multiple accounts with varying utilisationPercent values including one null.
**Test Data:** Accounts: 80%, 45%, null (balance=0), 95%.

**Test Steps:**
1. Call `/hr/report/generate/cd_account_details`.
2. Inspect the order of rows in `data.rows`.

**Expected Result:** Rows appear in order: 95%, 80%, 45%, null (last). SQL `ORDER BY "utilisationPercent" DESC NULLS LAST` is applied. Highest utilisation accounts appear first, prompting attention.

---

### TC-DATA-009 — Only CD_ACCOUNT_ACTIVE accounts appear in Account Details

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Company has accounts: 2 with status=CD_ACCOUNT_ACTIVE, 1 with status=CD_ACCOUNT_INACTIVE.
**Test Data:** Direct DB query to confirm status values.

**Test Steps:**
1. Query DB: `SELECT id, status FROM caution_deposit WHERE company_id = 42`.
2. Call `/hr/report/generate/cd_account_details` and read `data.rows`.
3. Verify only active accounts appear.

**Expected Result:** API response contains exactly 2 rows (matching the 2 active accounts). The inactive account is excluded. `cd.status = 'CD_ACCOUNT_ACTIVE'` filter is applied in SQL.

---

### TC-DATA-010 — Exported data matches table data for identical filters

**Category:** Data Integrity
**Priority:** High
**Preconditions:** Transactions section shows 35 rows with a specific filter combination.
**Test Data:** Same filter applied to both table and export.

**Test Steps:**
1. Apply filters: policyId=7, txnType=CREDIT_TRANSACTION, startDate=2026-01-01.
2. Note the 35 rows visible in the table (across all pages).
3. Export as Excel with the same filters.
4. Open the Excel file and count rows.

**Expected Result:** Excel file contains exactly 35 data rows matching all 35 from the paginated table. No rows added or missing. Field values are identical. Export uses the same SQL without LIMIT/OFFSET.

---

## 10. API Test Cases

---

### TC-API-001 — POST generate endpoint returns 201 on success

**Category:** API
**Priority:** Critical
**Preconditions:** Valid HR_ADMIN JWT; `cd_kpi_summary` report exists in `admin_reports`.
**Test Data:** POST `/hr/report/generate/cd_kpi_summary` body: `{ "companyId": 42 }`.

**Test Steps:**
1. Send POST `/hr/report/generate/cd_kpi_summary` with Authorization header and body.
2. Inspect HTTP status code.
3. Inspect response body structure.

**Expected Result:** HTTP 201. Response body: `{ "statusCode": 201, "message": "Report generated successfully.", "data": { "rows": [...], "count": N } }`. Framework §4 envelope is returned.

---

### TC-API-002 — POST download endpoint returns 200 with CSV file

🔁 **Updated** — TRD §10 and §8.10 specify the download endpoint returns CSV only (`Content-Type: text/csv`). Previous test expected an Excel response.

**Category:** API
**Priority:** Critical
**Preconditions:** Valid HR_ADMIN JWT; `cd_account_details` has data.
**Test Data:** POST `/hr-module/download/cd_account_details` body: `{ "companyId": 42, "search": "" }`.

**Test Steps:**
1. Send POST to `/hr-module/download/cd_account_details` with valid Authorization header and body.
2. Inspect HTTP status code and response headers.
3. Verify response body is a CSV file.

**Expected Result:** HTTP 200. `Content-Type: text/csv`. `Content-Disposition: attachment; filename=cd_account_details.csv`. Response body is a valid CSV file containing all matching account rows. No pagination applied — full result set returned.

---

### TC-API-003 — GET reports_list returns 200

**Category:** API
**Priority:** Medium
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** GET `/hr/report/reports_list`.

**Test Steps:**
1. Send GET `/hr/report/reports_list` with valid Authorization header.
2. Inspect response.

**Expected Result:** HTTP 200. Response lists available reports including `cd_kpi_summary`, `cd_account_details`, and `cd_transactions`.

---

### TC-API-004 — Missing Content-Type header on generate request

**Category:** API
**Priority:** Medium
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** POST `/hr/report/generate/cd_kpi_summary` without `Content-Type: application/json` header.

**Test Steps:**
1. Send POST request without Content-Type header.
2. Observe the response.

**Expected Result:** HTTP 400 or 415. Server rejects or fails to parse the request body. Descriptive error returned.

---

### TC-API-005 — Malformed JSON body on generate request

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** POST body: `{ "companyId": 42` (missing closing brace).

**Test Steps:**
1. Send POST to `/hr/report/generate/cd_kpi_summary` with malformed JSON body.
2. Observe the HTTP response.

**Expected Result:** HTTP 400. JSON parse error returned. No SQL execution attempted. Error message indicates invalid request body.

---

### TC-API-006 — Missing required companyId in request body

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** POST body: `{}` (companyId omitted).

**Test Steps:**
1. Send POST to `/hr/report/generate/cd_kpi_summary` with empty body `{}`.
2. Observe the response.

**Expected Result:** HTTP 400. DTO validation detects missing `companyId`. Error response lists the missing field. No SQL with unresolved `###companyId###` placeholder executes.

---

### TC-API-007 — Unknown report key returns 400 not 404

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** POST `/hr/report/generate/cd_nonexistent`.

**Test Steps:**
1. Send POST to `/hr/report/generate/cd_nonexistent` with valid body.
2. Note the HTTP status code.

**Expected Result:** HTTP 400 (not 404). The unknown key fails at SQL metadata lookup time — the framework looks up the `name` column in `admin_reports` and fails to find a match, returning 400. This is a key contract from TRD §1.2.

---

### TC-API-008 — HTTP GET on generate endpoint returns 405

**Category:** API
**Priority:** Medium
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** GET `/hr/report/generate/cd_kpi_summary`.

**Test Steps:**
1. Send GET (instead of POST) to `/hr/report/generate/cd_kpi_summary`.
2. Observe the HTTP status code.

**Expected Result:** HTTP 405 Method Not Allowed. The generate endpoint only accepts POST. Response may include `Allow: POST` header.

---

### TC-API-009 — Correct placeholder coverage — all tokens have matching parameter rows

**Category:** API
**Priority:** Critical
**Preconditions:** All three reports are seeded in the database.
**Test Data:** Query `admin_reports_parameters` for each report.

**Test Steps:**
1. For `cd_kpi_summary`: verify `admin_reports_parameters` has 1 row: `###companyId###`.
2. For `cd_account_details`: verify 2 rows: `###companyId###`, `###search###`.
3. For `cd_transactions`: verify 8 rows: `###companyId###`, `###policyId###`, `###startDate###`, `###endDate###`, `###txnType###`, `###search###`, `###limit###`, `###offset###`.
4. Count SQL placeholders in each query and confirm the count matches parameter rows.

**Expected Result:** Every `###placeholder###` token in each SQL body has exactly one matching row in `admin_reports_parameters`. No unmatched placeholders exist. A mismatch is a release blocker per Framework §9.4.

---

### TC-API-010 — Export format query parameter — invalid value rejected

**Category:** API
**Priority:** Medium
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** POST `/hr-module/download/cd_account_details?format=xml`.

**Test Steps:**
1. Send export request with `format=xml` (not a supported format).
2. Observe the response.

**Expected Result:** HTTP 400. The framework download endpoint outputs CSV only per TRD §10. An unsupported or unrecognised format query parameter is rejected. No file is generated.

---

### TC-API-011 — Export path removes LIMIT/OFFSET — full result set returned

**Category:** API
**Priority:** High
**Preconditions:** 200 transactions match the filter criteria.
**Test Data:** POST `/hr-module/download/cd_transactions` with the same active filter body that shows 50 rows on page 1 of the paginated table.

**Test Steps:**
1. Note that the paginated table shows 50 of 200 rows on page 1.
2. Trigger the export with the same active filters.
3. Open the CSV file and count rows.

**Expected Result:** CSV file contains all 200 matching rows (not just 50). The download path applies no LIMIT/OFFSET — the framework passes `limit: 0` internally so the full result set is returned. Full matching result set is exported per TRD §6.3 and §10.

---

### TC-API-012 — KPI report returns single-row array (data.rows length = 1)

**Category:** API
**Priority:** Critical
**Preconditions:** `cd_kpi_summary` report seeded and company data exists.
**Test Data:** POST `/hr/report/generate/cd_kpi_summary` body: `{ "companyId": 42 }`.

**Test Steps:**
1. Send POST to `/hr/report/generate/cd_kpi_summary`.
2. Inspect `data.rows` in the response.
3. Check `data.rows.length`.

**Expected Result:** `data.rows.length` = 1 (exactly one aggregate row). `data.rows[0]` contains all KPI fields: `totalDepositBalance`, `activeCdAccountsCount`, `utilisedAmount`, `utilisedPercent`, `lastDepositDate`, `lastDepositAmount`, `lastDepositBank`, `balanceTrendData`. Frontend must read `data.rows[0]`, not `data.rows`.

---

# END OF TEST CASE SUITE

**Total Test Cases:** 137
**Coverage by Category:**

| Category | Count |
|----------|-------|
| Functional | 46 |
| Edge | 16 |
| Negative | 11 |
| Security | 9 |
| Performance | 7 |
| Integration | 9 |
| Accessibility | 9 |
| Regression | 8 |
| Data Integrity | 10 |
| API | 12 |
| **Total** | **137** |

> **Sync note:** When PRD, SDS, or TRD is updated, identify changed sections, then update/add/remove affected test cases and mark them with 🔁 **Updated — [brief reason]**.
