# employeesupport — Test Case Suite

**Module:** HR Portal — Employee Support
**Jira Reference:** IIRM-10102
**Document Version:** 1.1
**Date:** 2026-05-08
**Source Documents:** PRD v2.0 · SDS v2.0 · TRD v1.0

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
| TC-FUNC-001 | KPI Summary Cards Render on Page Load | Functional | Critical | — |
| TC-FUNC-002 | KPI Values Reflect Correct Counts | Functional | Critical | — |
| TC-FUNC-003 | KPI Cards Update Dynamically When Filter Is Applied | Functional | Critical | — |
| TC-FUNC-004 | Employee Listing Renders All Expected Columns | Functional | Critical | 🔁 **Updated** |
| TC-FUNC-005 | Default Sort Is by Employee ID Descending (Most Recent First) | Functional | High | 🔁 **Updated** |
| TC-FUNC-006 | Dynamic Filters Rendered from Policy Configuration | Functional | Critical | — |
| TC-FUNC-007 | Multi-Select Within Single Filter Dimension Applies OR Logic | Functional | High | — |
| TC-FUNC-008 | Multiple Active Filter Dimensions Apply AND Logic | Functional | High | — |
| TC-FUNC-009 | Reset Filters Clears All Active Filters and Restores Full Listing | Functional | High | — |
| TC-FUNC-010 | Search by Employee Name Returns Matching Records | Functional | High | — |
| TC-FUNC-011 | Search by Employee ID Returns Matching Records | Functional | High | — |
| TC-FUNC-012 | Send eCard Email Action Dispatches Successfully | Functional | Critical | — |
| TC-FUNC-013 | Send Reset Password Link Action Dispatches Successfully | Functional | Critical | — |
| TC-FUNC-014 | Send Enrollment Extension Email Action Dispatches Successfully | Functional | High | — |
| TC-FUNC-015 | Send Welcome Email Action Dispatches Successfully | Functional | High | — |
| TC-FUNC-016 | Send Reminder Email Action Dispatches Successfully (Menu and Row Button) | Functional | High | 🔁 **Updated** |
| TC-FUNC-017 | Deactivate Employee — Full Modal Flow and Status Update | Functional | Critical | 🔁 **Updated** |
| TC-FUNC-018 | Cancel Deactivation Modal Does Not Commit Any Change | Functional | High | — |
| TC-FUNC-019 | Pagination Controls Navigate Correctly Through Employee Listing | Functional | High | — |
| TC-FUNC-020 | Three Dots Menu Opens Action Dropdown and Closes on Outside Click | Functional | Medium | 🔁 **Updated** |
| TC-FUNC-021 | Disabled Actions Remain Visible in Greyed-Out State | Functional | High | 🔁 **Updated** |
| TC-FUNC-022 | Active Filter Indicator Displayed on Filter Control | Functional | Medium | — |
| TC-FUNC-023 | KPI Reset to Zero When All Employees Filtered Out | Functional | High | — |
| TC-EDGE-001 | Employee With No Registered Email — All Email Actions Disabled | Edge | Critical | 🔁 **Updated** |
| TC-EDGE-002 | Already Deactivated Employee — All Actions Disabled | Edge | Critical | 🔁 **Updated** |
| TC-EDGE-003 | Company With Zero Employees — Empty State and Zero KPIs | Edge | High | — |
| TC-EDGE-004 | All Employees Filtered Out — Empty State Message and Zero KPIs | Edge | High | — |
| TC-EDGE-005 | No Policy Parameters Configured — Filter Bar Shows Only Search and Reset | Edge | High | — |
| TC-EDGE-006 | Email Action Triggered Immediately After In-Session Deactivation | Edge | Critical | — |
| TC-EDGE-007 | Employee With Null user_id (No Portal Account) — Deactivate Returns 400 | Edge | High | — |
| TC-EDGE-008 | Pagination on Last Page Shows Correct Count | Edge | Medium | — |
| TC-EDGE-009 | Single Filter Dimension With All Available Options Selected | Edge | Medium | — |
| TC-EDGE-010 | KPI Cards Show Zero After Filtering to a Single Inactive Employee | Edge | Medium | — |
| TC-EDGE-011 | Listing Load When Employee Count Is Exactly 5,000 | Edge | High | — |
| TC-EDGE-012 | Email Action With Maximum Allowed Employee Name Length in Toast | Edge | Low | — |
| TC-NEG-001 | Non-HR-Admin Role Cannot Trigger Deactivate Action | Negative | Critical | — |
| TC-NEG-002 | Email Action on a Deactivated Employee Is Blocked | Negative | Critical | — |
| TC-NEG-003 | Email Action on Employee With No Email Returns 400 | Negative | Critical | — |
| TC-NEG-004 | Deactivating an Already Inactive Employee Returns 400 | Negative | High | — |
| TC-NEG-005 | Send Email With Invalid actionType Returns 400 | Negative | High | — |
| TC-NEG-006 | Send Email With Missing actionType Body Returns 400 | Negative | High | — |
| TC-NEG-007 | Deactivate With Unknown employeeId Returns 400 | Negative | High | — |
| TC-NEG-008 | Employee From Different Company Returns 400 (Cross-Company Attempt) | Negative | Critical | — |
| TC-NEG-009 | Page Parameter as Negative Integer Returns 400 | Negative | Medium | — |
| TC-NEG-010 | Limit Parameter Exceeding Max 100 Returns 400 | Negative | Medium | — |
| TC-NEG-011 | Deactivation Modal Confirm Button Disabled Until User Explicitly Confirms | Negative | High | — |
| TC-NEG-012 | Email Delivery Service Unavailable — Returns 503 With Retry Option | Negative | High | — |
| TC-SEC-001 | Unauthenticated Request to Employee Listing Returns 401 | Security | Critical | — |
| TC-SEC-002 | Expired JWT Returns 401 on All Endpoints | Security | Critical | — |
| TC-SEC-003 | Non-HR-Admin JWT Returns 403 on All Endpoints | Security | Critical | — |
| TC-SEC-004 | Cross-Company employeeId Access Blocked at Service Layer | Security | Critical | — |
| TC-SEC-005 | SQL Injection in Search Parameter Is Neutralised | Security | Critical | — |
| TC-SEC-006 | SQL Injection in Filter Parameter Is Neutralised | Security | Critical | — |
| TC-SEC-007 | Caller-Supplied companyId in Query Param Is Ignored | Security | Critical | — |
| TC-SEC-008 | Deactivation Double-Check — Service Layer Enforces HR_ADMIN Even if Guard Is Misconfigured | Security | High | — |
| TC-SEC-009 | Decrypted Email Address Not Present in Audit Log | Security | High | — |
| TC-SEC-010 | Encrypted email_enc Not Exposed via Raw SQL Path | Security | High | 🔁 **Updated** |
| TC-PERF-001 | Employee Listing Loads in Under 3 Seconds for 5,000 Employees | Performance | Critical | — |
| TC-PERF-002 | Filter Application Updates Listing and KPIs Within 1 Second | Performance | Critical | — |
| TC-PERF-003 | Email Action Returns Success or Failure Within 3 Seconds | Performance | High | — |
| TC-PERF-004 | Deactivation Reflects Updated Status Within 3 Seconds | Performance | High | — |
| TC-PERF-005 | Concurrent Requests From Multiple HR Admins Do Not Degrade Response | Performance | High | — |
| TC-PERF-006 | Pagination Does Not Reload Full Dataset | Performance | Medium | — |
| TC-PERF-007 | Filter Metadata Endpoint Responds Within Acceptable Time | Performance | Medium | — |
| TC-PERF-008 | KPI Summary Report Responds Within 3 Seconds on Maximum Dataset | Performance | High | — |
| TC-INT-001 | KPI Framework Endpoint Returns Correct 201 Envelope on Page Load | Integration | Critical | — |
| TC-INT-002 | Employee Listing Returns Raw email_enc Values (Encryption Not Active in Dev) | Integration | Critical | 🔁 **Updated** |
| TC-INT-003 | Notification Service Unavailable — 503 Surfaced Without Silent Drop | Integration | Critical | — |
| TC-INT-004 | Database Unavailable During Deactivation — No Partial Commit | Integration | Critical | — |
| TC-INT-005 | Audit Log Written After Every Triggered Action | Integration | Critical | — |
| TC-INT-006 | Filter Metadata Derived From policy_enrollment_parameters Correctly | Integration | High | — |
| TC-INT-007 | KPI Recomputes After Deactivation in Same Session | Integration | High | — |
| TC-INT-008 | policy_employee_enrollment Joined With deleted_at IS NULL Guard | Integration | High | — |
| TC-INT-009 | Three Parallel Page-Load Requests Complete and Render Independently | Integration | High | — |
| TC-INT-010 | No Email Template Configured for Action Returns 400 | Integration | High | — |
| TC-ACC-001 | KPI Cards Have Descriptive ARIA Labels for Screen Readers | Accessibility | High | — |
| TC-ACC-002 | Filter Bar Controls Are Keyboard-Navigable | Accessibility | High | — |
| TC-ACC-003 | Disabled Action Items Have Accessible Tooltip Text | Accessibility | High | — |
| TC-ACC-004 | Deactivation Confirmation Modal Traps Focus Correctly | Accessibility | High | — |
| TC-ACC-005 | Status and Enrollment Badges Meet Colour Contrast Requirements | Accessibility | High | — |
| TC-ACC-006 | Empty State Messages Are Announced by Screen Readers | Accessibility | Medium | — |
| TC-ACC-007 | Pagination Controls Are Keyboard-Accessible and Labelled | Accessibility | Medium | — |
| TC-ACC-008 | Three Dots Action Menu Keyboard-Accessible and Dismissable | Accessibility | Medium | — |
| TC-REG-001 | KPI Counts Reflect Filtered Subset, Not Static Company Total | Regression | Critical | — |
| TC-REG-002 | Deactivated Employee Remains Visible in Listing With Inactive Badge | Regression | Critical | 🔁 **Updated** |
| TC-REG-003 | All Email Actions Immediately Disabled After In-Session Deactivation | Regression | Critical | 🔁 **Updated** |
| TC-REG-004 | Deactivate Action Shown Disabled for Non-HR-Admin (Not Hidden) | Regression | High | — |
| TC-REG-005 | Resetting Filters After Search Restores Full Unfiltered Listing | Regression | High | — |
| TC-REG-006 | Company Scoping Remains Intact After Filter Change | Regression | Critical | — |
| TC-REG-007 | Session Re-Entry Does Not Carry Over Previously Applied Filters | Regression | Medium | — |
| TC-REG-008 | Email Actions Are Stateless — Same Action Can Be Triggered Multiple Times | Regression | High | — |
| TC-DAT-001 | Audit Log Entry Created for Every Email Action With Correct Fields | Data Integrity | Critical | — |
| TC-DAT-002 | Audit Log Entry Created for Deactivation With Correct Fields | Data Integrity | Critical | — |
| TC-DAT-003 | Deactivation Only Sets user_status_key = USER_STATUS_INACTIVE — Record Not Deleted | Data Integrity | Critical | 🔁 **Updated** |
| TC-DAT-004 | Decrypted Email Is Not Written to Audit Log or Any Logged Field | Data Integrity | Critical | — |
| TC-DAT-005 | All Queries Scope to company_id From JWT — No Raw Joins Without Scope | Data Integrity | Critical | — |
| TC-DAT-006 | policy_employee_enrollment Reads Always Include deleted_at IS NULL | Data Integrity | High | 🔁 **Updated** |
| TC-DAT-007 | policy_enrollment_employee Reads Always Include deleted_at IS NULL | Data Integrity | High | — |
| TC-DAT-008 | KPI Enrolled Count Uses DISTINCT employee_id to Prevent Duplicate Counting | Data Integrity | High | 🔁 **Updated** |
| TC-API-001 | GET /employees Without Auth Token Returns 401 | API | Critical | — |
| TC-API-002 | GET /employees With Valid HR_ADMIN JWT Returns 200 With Expected Shape | API | Critical | 🔁 **Updated** |
| TC-API-003 | GET /employees With Non-HR-Admin JWT Returns 403 | API | Critical | — |
| TC-API-004 | POST /send-email With Valid Payload Returns 200 | API | Critical | — |
| TC-API-005 | POST /send-email With Missing actionType Returns 400 | API | High | — |
| TC-API-006 | POST /send-email With Invalid actionType String Returns 400 | API | High | — |
| TC-API-007 | POST /deactivate With Non-HR-Admin Role Returns 403 | API | Critical | — |
| TC-API-008 | POST /deactivate For Already Inactive Employee Returns 400 | API | High | 🔁 **Updated** |
| TC-API-009 | GET /filter-metadata Returns 200 With data.filters Array | API | High | — |
| TC-API-010 | POST /report/generate/emp_support_kpi_summary Returns 201 With data.rows[0] | API | Critical | — |
| TC-API-011 | GET /employees With limit Exceeding 100 Returns 400 | API | Medium | — |
| TC-API-012 | POST /employees Wrong HTTP Method Returns 405 | API | Medium | — |

---

## 1. Functional Test Cases

---

### TC-FUNC-001 — KPI Summary Cards Render on Page Load

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Administrator is authenticated with a valid JWT. The company has at least one employee record.
**Test Data:** HR Admin JWT for company ID 101. Company has 240 employees: 198 Active, 42 Inactive, 180 Enrolled, 60 Not Enrolled.

**Test Steps:**
1. Navigate to `/hr/employee-support`.
2. Wait for the page to fully load.
3. Inspect the KPI Summary Row at the top of the page.

**Expected Result:** Five KPI cards are displayed in a single horizontal row with equal width. Each card shows the correct title and numeric value: **Total Employees: 240**, **Active Employees: 198**, **Inactive / Deactivated: 42**, **Enrolled: 180**, **Not Yet Enrolled: 60**. Card border colours are Blue, Green, Red, Teal, and Amber respectively. No error state is displayed.

---

### TC-FUNC-002 — KPI Values Reflect Correct Counts

**Category:** Functional
**Priority:** Critical
**Preconditions:** Company has a known fixture dataset with precise status and enrollment breakdown.
**Test Data:** Fixture: 50 Active + email, 10 Active + no email, 20 Inactive, 35 Enrolled (active), 45 Not Enrolled. Total = 80 employees.

**Test Steps:**
1. Log in as HR Admin for the fixture company.
2. Navigate to `/hr/employee-support`.
3. Read the value on each KPI card.
4. Compare each value against the known fixture counts.

**Expected Result:** Total Employees = 80, Active Employees = 60 (50 + 10), Inactive / Deactivated = 20, Enrolled = 35, Not Yet Enrolled = 45. All values match the fixture exactly.

---

### TC-FUNC-003 — KPI Cards Update Dynamically When Filter Is Applied

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin is on `/hr/employee-support` with no active filters. Company has 240 employees: 100 Active + Female, 98 Active + Male, 42 Inactive.
**Test Data:** Gender filter set to "Female". Expected filtered counts: Total = 100, Active = 100, Inactive = 0, Enrolled = 65 (fixture), Not Yet Enrolled = 35.

**Test Steps:**
1. Note the unfiltered KPI values (Total = 240).
2. In the Filter Bar, select "Female" from the Gender filter dropdown.
3. Wait for the listing to refresh.
4. Observe all five KPI cards.

**Expected Result:** All five KPI cards immediately recompute to reflect only the 100 Female employees currently visible in the listing. The previously displayed values (e.g., Total = 240) are replaced. No page navigation occurs.

---

### TC-FUNC-004 — Employee Listing Renders All Expected Columns

🔁 **Updated** — Added missing SDS §6.1 columns: DOB, Age, Mobile, Sum Insured, Dependents count, E-card link, and Reminder row button.

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin authenticated. Company policy configuration has "Gender" and "Designation" as active parameters.
**Test Data:** Fixture employee: Name = "Arjun Sharma", ID = "EMP-00421", DOB = 1990-03-15, Age = 36, Email = "arjun.sharma@domain.com", Mobile = "+91-9876543210", Status = Active, Enrollment = Enrolled, Sum Insured = ₹500,000, Dependents = 2, Gender = Male, Designation = Manager.

**Test Steps:**
1. Navigate to `/hr/employee-support`.
2. Inspect the column headers in the employee listing table.
3. Locate the row for Arjun Sharma.
4. Verify all field values match the fixture.

**Expected Result:** Table displays all SDS §6.1 columns: Employee ID, Employee Name, Gender, Date of Birth, Age, Email Address (readable plain text), Mobile, Enrollment Status (teal "Enrolled" badge), Sum Insured, Dependents (count "2" as a clickable link), E-card ("View" link), Status (green "Active" badge), Reminder ("Send" row button), Actions ("…"), plus policy configuration columns (Gender, Designation). All values for Arjun Sharma match the fixture data. The Reminder "Send" button is enabled (employee is Active with email). The E-card "View" link is present.

---

### TC-FUNC-005 — Default Sort Is by Employee ID Descending (Most Recent First)

🔁 **Updated** — Sort order was incorrectly stated as alphabetical by name ASC. Per SDS §6.2 and TRD §8 reference query, the default sort is `employeeId DESC` (most recent employee first).

**Category:** Functional
**Priority:** High
**Preconditions:** HR Admin authenticated. Company has multiple employees with sequential employee IDs: EMP-0001 (ID 1), EMP-0002 (ID 2), EMP-0003 (ID 3), EMP-0004 (ID 4).
**Test Data:** Employees with `pee.id` values 1, 2, 3, 4 corresponding to names "Zara Ahmed" (ID 4), "Arjun Sharma" (ID 3), "Meera Nair" (ID 2), "Brijesh Patel" (ID 1).

**Test Steps:**
1. Navigate to `/hr/employee-support` without applying any sort or filter.
2. Observe the order of employee rows in the listing.

**Expected Result:** Employees are listed in descending order by `employeeId` (DB primary key): Zara Ahmed (ID 4), Arjun Sharma (ID 3), Meera Nair (ID 2), Brijesh Patel (ID 1). The most recently added employee appears first. The SQL ORDER BY clause is `ORDER BY pee.id DESC`.

---

### TC-FUNC-006 — Dynamic Filters Rendered from Policy Configuration

**Category:** Functional
**Priority:** Critical
**Preconditions:** Company policy configuration has three active parameters: "Gender" (categorical), "Designation" (text), and "Region" (categorical).
**Test Data:** Policy configuration for company 101 with Gender, Designation, Region parameters active.

**Test Steps:**
1. Navigate to `/hr/employee-support`.
2. Inspect the Filter Bar between the KPI row and the employee listing.
3. Identify all filter controls rendered.

**Expected Result:** Three filter controls are rendered in addition to the always-present Search and Reset Filters controls. Gender renders as a multi-select dropdown with options derived from distinct values (e.g., Male, Female, Other). Region renders as a multi-select dropdown. Designation renders as a text input. No hardcoded filters beyond Status and Enrollment Status appear.

---

### TC-FUNC-007 — Multi-Select Within Single Filter Dimension Applies OR Logic

**Category:** Functional
**Priority:** High
**Preconditions:** HR Admin on `/hr/employee-support`. Company has 30 Male and 40 Female employees.
**Test Data:** Gender filter with both "Male" and "Female" selected simultaneously.

**Test Steps:**
1. Navigate to `/hr/employee-support`.
2. In the Gender filter dropdown, select "Male".
3. Still in the same dropdown, additionally select "Female".
4. Observe the listing count and KPI total.

**Expected Result:** Listing shows all 70 employees who are either Male OR Female. The Total Employees KPI reads 70. The OR logic is applied within the Gender dimension — both selections are satisfied independently.

---

### TC-FUNC-008 — Multiple Active Filter Dimensions Apply AND Logic

**Category:** Functional
**Priority:** High
**Preconditions:** Company has: 30 Active Female employees, 20 Inactive Female employees, 40 Active Male employees.
**Test Data:** Status filter = "ACTIVE", Gender filter = "Female".

**Test Steps:**
1. Navigate to `/hr/employee-support`.
2. Select "ACTIVE" from the Status filter dropdown.
3. Select "Female" from the Gender filter dropdown.
4. Observe the listing and KPI Total.

**Expected Result:** Listing shows only the 30 employees who are both Active AND Female. The Total Employees KPI reads 30. Employees who are Inactive Female (20) or Active Male (40) are excluded — confirming AND logic across dimensions.

---

### TC-FUNC-009 — Reset Filters Clears All Active Filters and Restores Full Listing

**Category:** Functional
**Priority:** High
**Preconditions:** HR Admin has applied a Status = "ACTIVE" filter and entered "Arjun" in the Search field. Listing shows 5 filtered results.
**Test Data:** Company with 240 total employees, 5 matching "Arjun" + "ACTIVE" filter.

**Test Steps:**
1. Confirm the listing shows 5 filtered employees and KPI Total = 5.
2. Click the "Reset Filters" button.
3. Observe the listing and filter controls.

**Expected Result:** All filter values and the search text are cleared simultaneously. The full unfiltered employee listing reloads, showing all 240 employees. KPI cards recompute to the full company totals. The Status filter and Search field both revert to their default (empty) state.

---

### TC-FUNC-010 — Search by Employee Name Returns Matching Records

**Category:** Functional
**Priority:** High
**Preconditions:** Company has employees including "Arjun Sharma", "Arjun Mehta", "Meera Nair".
**Test Data:** Search term: "Arjun" (partial match).

**Test Steps:**
1. Navigate to `/hr/employee-support`.
2. Type "Arjun" in the Search input field.
3. Wait for the listing to refresh.
4. Observe the returned rows.

**Expected Result:** Listing shows only "Arjun Sharma" and "Arjun Mehta". "Meera Nair" is excluded. Partial match is applied on `employee.full_name`. KPI cards recompute to show Total = 2.

---

### TC-FUNC-011 — Search by Employee ID Returns Matching Records

**Category:** Functional
**Priority:** High
**Preconditions:** Company has employees with IDs "EMP-00421", "EMP-00422", "EMP-00500".
**Test Data:** Search term: "EMP-0042" (partial match on employee ID).

**Test Steps:**
1. Navigate to `/hr/employee-support`.
2. Type "EMP-0042" in the Search input field.
3. Wait for the listing to refresh.

**Expected Result:** Listing returns "EMP-00421" and "EMP-00422" employees. "EMP-00500" is excluded. Partial match operates on `company_employee_id`. KPI Total = 2.

---

### TC-FUNC-012 — Send eCard Email Action Dispatches Successfully

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin authenticated. Target employee is Active with a registered email address on file.
**Test Data:** Employee ID 1042, email = "arjun.sharma@domain.com", status = ACTIVE. Notification service is available and company has `HR_ECARD` template configured.

**Test Steps:**
1. Navigate to `/hr/employee-support`.
2. Locate employee Arjun Sharma (ID 1042) in the listing.
3. Click the "…" menu on that row.
4. Select "Send eCard" from the dropdown.
5. Observe the UI response.

**Expected Result:** No intermediate confirmation step appears. The action dispatches immediately. A success toast notification appears: "Send eCard sent to arjun.sharma@domain.com." The listing row does not change state. The action may be triggered again without restriction.

---

### TC-FUNC-013 — Send Reset Password Link Action Dispatches Successfully

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin authenticated. Target employee is Active with a registered email address. `HR_RESET_PASSWORD` email template is configured.
**Test Data:** Employee ID 1055, email = "priya.nair@domain.com", status = ACTIVE.

**Test Steps:**
1. Click the "…" menu for employee Priya Nair.
2. Select "Send Reset Password Link".
3. Observe feedback.

**Expected Result:** Toast appears: "Send Reset Password Link sent to priya.nair@domain.com." No navigation occurs. No confirmation modal is displayed before dispatch.

---

### TC-FUNC-014 — Send Enrollment Extension Email Action Dispatches Successfully

**Category:** Functional
**Priority:** High
**Preconditions:** HR Admin authenticated. Target employee is Active with email on file. `HR_ENROLLMENT_EXTENSION` template is configured.
**Test Data:** Employee ID 1060, email = "raj.kumar@domain.com".

**Test Steps:**
1. Click the "…" menu for the employee.
2. Select "Extend Enrollment Window".
3. Observe feedback.

**Expected Result:** Toast appears: "Extend Enrollment Window sent to raj.kumar@domain.com." Action dispatches without additional steps.

---

### TC-FUNC-015 — Send Welcome Email Action Dispatches Successfully

**Category:** Functional
**Priority:** High
**Preconditions:** HR Admin authenticated. Target employee is Active with email on file. `HR_WELCOME` template is configured.
**Test Data:** Employee ID 1070, email = "new.joiner@domain.com".

**Test Steps:**
1. Click the "…" menu for the employee.
2. Select "Send Welcome Email".
3. Observe feedback.

**Expected Result:** Toast appears: "Send Welcome Email sent to new.joiner@domain.com." No navigation or confirmation is required.

---

### TC-FUNC-016 — Send Reminder Email Action Dispatches Successfully (Menu and Row Button)

🔁 **Updated** — Added test for the row-level "Send" Reminder button per SDS §6.1 and PRD §4.3. Reminder is accessible both from the "…" menu and as a dedicated row-level button.

**Category:** Functional
**Priority:** High
**Preconditions:** HR Admin authenticated. Target employee is Active with email on file. `HR_REMINDER` template is configured.
**Test Data:** Employee ID 1080, email = "pending.enrollment@domain.com".

**Test Steps (Path A — "…" menu):**
1. Click the "…" menu for the employee.
2. Select "Send Reminder Email".
3. Observe feedback.

**Expected Result (Path A):** Toast appears: "Send Reminder Email sent to pending.enrollment@domain.com." Dispatch is immediate and stateless. Calls `POST /hr/employee-support/employees/1080/send-reminder`.

**Test Steps (Path B — Row-level "Send" button):**
1. Without opening the "…" menu, locate the Reminder "Send" button in the Reminder column for employee 1080.
2. Click the "Send" button directly on the row.
3. Observe feedback.

**Expected Result (Path B):** Toast appears: "Send Reminder Email sent to pending.enrollment@domain.com." The reminder dispatches immediately without opening any menu. Identical behaviour and API call as Path A. The "Send" button is disabled if the employee is Inactive or has no email on file.

---

### TC-FUNC-017 — Deactivate Employee — Full Modal Flow and Status Update

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin authenticated. Target employee is Active with a linked portal account (`user_id` is not null).
**Test Data:** Employee: Name = "Arjun Sharma", ID = 1042, status = ACTIVE, user_id = 388, user_status_key = "ACTIVE".

**Test Steps:**
1. Click the "…" menu for Arjun Sharma.
2. Select "Deactivate" from the dropdown.
3. Observe the confirmation modal.
4. Confirm the modal title reads "Deactivate Arjun Sharma?" and body contains "This will immediately revoke Arjun Sharma's portal access."
5. Click the red "Deactivate" confirm button.
6. Observe the listing row and KPI cards.

**Expected Result:** The confirmation modal appears with correct title, body text, a red "Deactivate" button, and a "Cancel" button. After confirming, the modal closes without navigation. Arjun Sharma's Status badge in the listing changes to red "Inactive" in-place. All actions in the "…" menu (Block/Unblock, Tag VIP, Edit Employee, Reset Password, Send eCard Email, Extend Enrollment Window, Send Welcome Email, and Deactivate itself) become greyed-out/disabled. The row-level Reminder "Send" button also becomes disabled. All five KPI cards recompute: Active Employees decreases by 1, Inactive / Deactivated increases by 1. `users.user_status_key` in the database is set to `'USER_STATUS_INACTIVE'` (not `'INACTIVE'`).

> 🔁 **Updated** — Corrected status literal to `USER_STATUS_INACTIVE`. Expanded "six actions" to the full menu item set per PRD §4.4.

---

### TC-FUNC-018 — Cancel Deactivation Modal Does Not Commit Any Change

**Category:** Functional
**Priority:** High
**Preconditions:** HR Admin authenticated. Target employee is Active.
**Test Data:** Employee ID 1042, status = ACTIVE.

**Test Steps:**
1. Click the "…" menu and select "Deactivate" for employee 1042.
2. When the confirmation modal appears, click the "Cancel" button.
3. Observe the listing row and database state.

**Expected Result:** The modal dismisses immediately. The employee's Status badge remains "Active" (unchanged). All actions remain in their pre-modal state. No write is made to `users.user_status_key`. No audit log entry is created.

---

### TC-FUNC-019 — Pagination Controls Navigate Correctly Through Employee Listing

**Category:** Functional
**Priority:** High
**Preconditions:** Company has 75 employees. Page size is 25.
**Test Data:** 75 employees, 3 pages expected.

**Test Steps:**
1. Navigate to `/hr/employee-support`.
2. Verify the pagination footer reads "Showing 1–25 of 75 employees."
3. Click the "Next" button.
4. Verify the pagination footer reads "Showing 26–50 of 75 employees."
5. Click "Next" again.
6. Verify "Showing 51–75 of 75 employees."
7. Click "Previous" once.

**Expected Result:** Each navigation updates the listing to the correct page slice. The pagination string correctly reflects the start/end/total. The "Previous" button on page 1 and "Next" button on the last page are disabled. Going back to page 2 from page 3 shows rows 26–50.

---

### TC-FUNC-020 — Three Dots Menu Opens Action Dropdown and Closes on Outside Click

**Category:** Functional
**Priority:** Medium
**Preconditions:** HR Admin on the employee listing page.
**Test Data:** Any active employee row in the listing.

**Test Steps:**
1. Click the "…" icon on any employee row.
2. Confirm the dropdown opens showing all actions.
3. Click anywhere outside the dropdown (not on a menu item).
4. Observe the dropdown state.

**Expected Result:** Dropdown appears anchored to the row without page navigation. It lists all actions: Block/Unblock, Tag as VIP, Edit Employee, Reset Password, Send eCard Email, Extend Enrollment Window, Send Welcome Email, and Deactivate. Clicking outside the dropdown closes it without triggering any action. No other rows' menus are affected.

> 🔁 **Updated** — Replaced "all six actions" with the full action set per PRD §4.4.

---

### TC-FUNC-021 — Disabled Actions Remain Visible in Greyed-Out State

**Category:** Functional
**Priority:** High
**Preconditions:** HR Admin authenticated. One deactivated employee exists in the listing.
**Test Data:** Employee ID 2001, status = INACTIVE.

**Test Steps:**
1. Navigate to the listing and locate the Inactive employee.
2. Click the "…" menu for that employee.
3. Observe all action items in the dropdown.

**Expected Result:** All action items (Block/Unblock, Tag as VIP, Edit Employee, Reset Password, Send eCard Email, Extend Enrollment Window, Send Welcome Email, and Deactivate) are visible in the dropdown in a greyed-out/disabled state. None of the items are hidden. Clicking a disabled item produces no effect. The Deactivate item shows tooltip: "Employee is already inactive." The five email actions show tooltip: "Employee is inactive."

> 🔁 **Updated** — Replaced "six action items" with the full menu item set per PRD §4.4.

---

### TC-FUNC-022 — Active Filter Indicator Displayed on Filter Control

**Category:** Functional
**Priority:** Medium
**Preconditions:** HR Admin on the employee listing with no active filters.
**Test Data:** Status filter to be set to "ACTIVE".

**Test Steps:**
1. Navigate to `/hr/employee-support`.
2. Verify no filter indicator is visible on any filter control.
3. Select "ACTIVE" from the Status filter dropdown.
4. Observe the Status filter control appearance.

**Expected Result:** Once "ACTIVE" is selected, the Status filter control displays a visible active indicator (e.g., highlighted border or active-filter badge). The indicator is absent from other filter controls that have not been set. The indicator is removed from the Status filter if the selection is cleared.

---

### TC-FUNC-023 — KPI Reset to Zero When All Employees Filtered Out

**Category:** Functional
**Priority:** High
**Preconditions:** Company has 240 employees. No employee has Region = "Antarctica".
**Test Data:** Region filter set to "Antarctica" (a value that matches zero employees).

**Test Steps:**
1. Navigate to `/hr/employee-support`.
2. Apply the Region filter with value "Antarctica".
3. Observe the listing and KPI cards.

**Expected Result:** The employee listing shows the empty state message: "No employees match the active filters." with a "Clear filters" link. All five KPI cards display 0. No error state is shown.

---

## 2. Edge Test Cases

---

### TC-EDGE-001 — Employee With No Registered Email — All Email Actions Disabled

🔁 **Updated** — Clarified that non-email actions (Block/Unblock, Tag VIP, Edit Employee, Deactivate) remain enabled. PRD §4.4 only disables actions that require email; the row-level Reminder "Send" button is also disabled. Removed `hasEmail` field reference per TRD 2026-05-06 note.

**Category:** Edge
**Priority:** Critical
**Preconditions:** HR Admin authenticated. One Active employee exists with `email_enc` = null.
**Test Data:** Employee ID 3001, status = ACTIVE, email = null (Email column shows "—").

**Test Steps:**
1. Navigate to the employee listing.
2. Confirm the Email column shows "—" for employee 3001.
3. Confirm the row-level Reminder "Send" button is disabled for employee 3001.
4. Click the "…" menu for employee 3001.
5. Observe the state of each action item.

**Expected Result:** The five email actions (Reset Password, Send eCard Email, Extend Enrollment Window, Send Welcome Email, Send Reminder Email) are visible but greyed-out/disabled. Each shows tooltip: "No email address on file for this employee." The non-email actions (Block/Unblock, Tag as VIP, Edit Employee) and the Deactivate action remain fully enabled. The row-level Reminder "Send" button in the listing row is disabled for the same reason.

---

### TC-EDGE-002 — Already Deactivated Employee — All Actions Disabled

🔁 **Updated** — Title corrected from "All Six Actions" to "All Actions". Full action set per PRD §4.4 applied.

**Category:** Edge
**Priority:** Critical
**Preconditions:** A pre-existing deactivated employee (set inactive before current session).
**Test Data:** Employee ID 4001, status = INACTIVE, email = "old.employee@domain.com".

**Test Steps:**
1. Navigate to the employee listing.
2. Locate employee 4001 with the red "Inactive" badge.
3. Confirm the row-level Reminder "Send" button is disabled.
4. Click the "…" menu for that employee.
5. Observe all action states.

**Expected Result:** All action items (Block/Unblock, Tag as VIP, Edit Employee, Reset Password, Send eCard Email, Extend Enrollment Window, Send Welcome Email, and Deactivate) are visible but displayed in greyed-out/disabled state. Deactivate shows tooltip: "Employee is already inactive." The five email actions show tooltip: "Employee is inactive." The Deactivate action is permanently disabled — the confirmation modal is never triggered. The row-level Reminder "Send" button in the listing row is also disabled.

---

### TC-EDGE-003 — Company With Zero Employees — Empty State and Zero KPIs

**Category:** Edge
**Priority:** High
**Preconditions:** A valid HR Admin JWT for a company with no employee records.
**Test Data:** Company ID 999 with 0 employees in `policy_enrollment_employee`.

**Test Steps:**
1. Log in as HR Admin for company 999.
2. Navigate to `/hr/employee-support`.
3. Observe both the KPI row and the employee listing.

**Expected Result:** All five KPI cards display the value 0 with no error state. The employee listing shows the empty state illustration with message: "No employees found for your company." No error is thrown. The Filter Bar renders normally (with Search and Reset Filters controls).

---

### TC-EDGE-004 — All Employees Filtered Out — Empty State Message and Zero KPIs

**Category:** Edge
**Priority:** High
**Preconditions:** Company has 240 employees. Active filter produces zero matches.
**Test Data:** Designation filter = "NonExistentRole" (no employee has this designation).

**Test Steps:**
1. Apply the Designation filter with text "NonExistentRole".
2. Observe the listing area and KPI cards.
3. Click the "Clear filters" link.
4. Observe the listing after clearing.

**Expected Result:** Listing shows: "No employees match the active filters." with a "Clear filters" link. All five KPIs show 0. After clicking "Clear filters", the full listing of 240 employees restores and KPIs recompute to the company totals.

---

### TC-EDGE-005 — No Policy Parameters Configured — Filter Bar Shows Only Search and Reset

**Category:** Edge
**Priority:** High
**Preconditions:** Company has employees but no parameters are selected in the policy configuration.
**Test Data:** Company ID 202. `policy_enrollment_parameters` has no rows for this company. Company has 50 employees.

**Test Steps:**
1. Log in as HR Admin for company 202.
2. Navigate to `/hr/employee-support`.
3. Observe the Filter Bar.
4. Verify the employee listing renders.

**Expected Result:** The Filter Bar displays only the Search input and the Reset Filters button. No dimension-based filter controls (gender, designation, region, etc.) are rendered. The listing renders all 50 employees unfiltered with default columns (no policy config columns). KPIs show correct company totals.

---

### TC-EDGE-006 — Email Action Triggered Immediately After In-Session Deactivation

**Category:** Edge
**Priority:** Critical
**Preconditions:** HR Admin in active session. Employee is deactivated in the same session.
**Test Data:** Employee ID 1042 is Active at session start. HR Admin deactivates them during the session.

**Test Steps:**
1. Deactivate employee 1042 via the confirmation modal.
2. Confirm the listing row updates to Inactive and all actions are disabled.
3. Attempt to directly call `POST /hr/employee-support/employees/1042/send-email` with `{ actionType: "WELCOME_EMAIL" }` (e.g., via API tool or intercepted request before UI disables).
4. Observe the API response.

**Expected Result:** The service re-validates the employee's `user_status_key` before dispatch. Since status is now INACTIVE, the service returns HTTP 400: "Employee is inactive." The email action is not dispatched. The UI prevents triggering the action from the "…" menu (all items are disabled). No audit log entry for a successful send is created.

---

### TC-EDGE-007 — Employee With Null user_id (No Portal Account) — Deactivate Returns 400

**Category:** Edge
**Priority:** High
**Preconditions:** An employee record exists in `policy_enrollment_employee` with `user_id = NULL` (never registered on the portal).
**Test Data:** Employee ID 5001, `user_id` = null, status visually shown as Active.

**Test Steps:**
1. Click the "…" menu for employee 5001.
2. Select "Deactivate".
3. Confirm in the modal.
4. Observe the API response and UI behaviour.

**Expected Result:** The service returns HTTP 400: "Employee has no portal account to deactivate." The modal stays open with an inline error message: "Unable to deactivate. Please try again." (or equivalent informative message). The employee's status in the listing does not change. No audit log entry is written.

---

### TC-EDGE-008 — Pagination on Last Page Shows Correct Count

**Category:** Edge
**Priority:** Medium
**Preconditions:** Company has exactly 51 employees. Page size = 25.
**Test Data:** 51 employees, page 3 expected to show 1 employee.

**Test Steps:**
1. Navigate to `/hr/employee-support`.
2. Click through to the last page (page 3).
3. Verify the pagination string and the number of displayed rows.

**Expected Result:** Page 3 shows exactly 1 employee row. Pagination reads: "Showing 51–51 of 51 employees." The "Next" button is disabled on this page. The "Previous" button navigates back to page 2 correctly.

---

### TC-EDGE-009 — Single Filter Dimension With All Available Options Selected

**Category:** Edge
**Priority:** Medium
**Preconditions:** Status filter has two options: ACTIVE and INACTIVE. Company has 200 Active and 40 Inactive employees.
**Test Data:** Status filter: both "ACTIVE" and "INACTIVE" selected.

**Test Steps:**
1. In the Status filter dropdown, select both "ACTIVE" and "INACTIVE".
2. Observe the listing and KPI Total.

**Expected Result:** Listing shows all 240 employees (OR logic within Status dimension). Total Employees KPI = 240. This is functionally equivalent to no filter being applied for the Status dimension, though the active filter indicator remains visible on the Status control.

---

### TC-EDGE-010 — KPI Cards Show Zero After Filtering to a Single Inactive Employee

**Category:** Edge
**Priority:** Medium
**Preconditions:** Company has one uniquely named Inactive employee, zero enrolled.
**Test Data:** Search term = "John Doe Inactive". Employee ID = 6001, Status = INACTIVE, Enrollment = NOT_ENROLLED.

**Test Steps:**
1. Search for "John Doe Inactive" in the Search field.
2. Observe KPI cards.

**Expected Result:** Total = 1, Active = 0, Inactive = 1, Enrolled = 0, Not Yet Enrolled = 1. Cards do not display negative values or error states. All values are valid non-negative integers.

---

### TC-EDGE-011 — Listing Load When Employee Count Is Exactly 5,000

**Category:** Edge
**Priority:** High
**Preconditions:** Company has exactly 5,000 employee records, representing the maximum stated in the PRD NFR.
**Test Data:** 5,000 employees in `policy_enrollment_employee` for company 101.

**Test Steps:**
1. Log in as HR Admin for the 5,000-employee company.
2. Navigate to `/hr/employee-support`.
3. Start a timer at the moment of navigation.
4. Stop the timer when the employee listing and KPI cards are fully rendered.

**Expected Result:** The listing loads successfully with correct data within 3 seconds. KPI cards display correctly. Pagination shows "Showing 1–25 of 5000 employees." No timeout or error occurs.

---

### TC-EDGE-012 — Email Action With Maximum Allowed Employee Name Length in Toast

**Category:** Edge
**Priority:** Low
**Preconditions:** An employee record exists with an extremely long full name.
**Test Data:** Employee name = "Bartholomew Christophersen-Johannesburg Wellington III" (52 characters), email = "long.name@domain.com", status = ACTIVE.

**Test Steps:**
1. Trigger "Send Welcome Email" for this employee.
2. Observe the toast notification.

**Expected Result:** The toast notification displays without truncation issues or layout overflow. Text reads: "Send Welcome Email sent to long.name@domain.com." The toast is fully readable and does not obscure other UI elements.

---

## 3. Negative Test Cases

---

### TC-NEG-001 — Non-HR-Admin Role Cannot Trigger Deactivate Action

**Category:** Negative
**Priority:** Critical
**Preconditions:** A user authenticated with a non-HR-Admin role (e.g., "HR_VIEWER") has access to the Employee Support module.
**Test Data:** JWT with role = HR_VIEWER. Target employee ID 1042, status = ACTIVE.

**Test Steps:**
1. Log in as HR_VIEWER.
2. Navigate to `/hr/employee-support`.
3. Click the "…" menu for an active employee.
4. Observe the Deactivate action item.
5. Attempt to trigger `POST /hr/employee-support/employees/1042/deactivate` directly via API.

**Expected Result:** In the UI, the Deactivate action is visible but permanently disabled with tooltip: "Deactivation requires HR Administrator role." Clicking it has no effect. Direct API call returns HTTP 403: "Deactivation requires HR Administrator role." No change is made to the employee's status. No audit log entry is written.

---

### TC-NEG-002 — Email Action on a Deactivated Employee Is Blocked

**Category:** Negative
**Priority:** Critical
**Preconditions:** Employee 4001 has status = INACTIVE.
**Test Data:** `POST /hr/employee-support/employees/4001/send-email` with `{ actionType: "WELCOME_EMAIL" }`.

**Test Steps:**
1. Send the API request directly with a valid HR Admin JWT.
2. Observe the response code and message.

**Expected Result:** HTTP 400 is returned with message: "Employee is inactive." No email is dispatched to the notification service. No audit log entry for a successful send is created.

---

### TC-NEG-003 — Email Action on Employee With No Email Returns 400

**Category:** Negative
**Priority:** Critical
**Preconditions:** Employee 3001 is Active but `email_enc` is null.
**Test Data:** `POST /hr/employee-support/employees/3001/send-email` with `{ actionType: "ECARD_EMAIL" }`.

**Test Steps:**
1. Send the API request with a valid HR Admin JWT.
2. Observe the response.

**Expected Result:** HTTP 400 is returned with message: "No email address on file." The notification service is never called. No email is dispatched. No audit log entry is written for a successful send.

---

### TC-NEG-004 — Deactivating an Already Inactive Employee Returns 400

**Category:** Negative
**Priority:** High
**Preconditions:** Employee 4001 has `users.user_status_key = 'USER_STATUS_INACTIVE'`.
**Test Data:** `POST /hr/employee-support/employees/4001/deactivate` with valid HR Admin JWT.

**Test Steps:**
1. Send the API request with a valid HR Admin JWT.
2. Observe the response code and message.

**Expected Result:** HTTP 400 is returned with message: "Employee is already inactive." No write operation is executed on the `users` table. No audit log entry is written. The UI — if triggered through the "…" menu — would never reach this state because the Deactivate item is already disabled with the "already inactive" tooltip.

---

### TC-NEG-005 — Send Email With Invalid actionType Returns 400

**Category:** Negative
**Priority:** High
**Preconditions:** HR Admin authenticated. Employee 1042 is Active with email on file.
**Test Data:** `POST /hr/employee-support/employees/1042/send-email` with `{ actionType: "INVALID_ACTION" }`.

**Test Steps:**
1. Send the POST request with an unrecognised `actionType` value.
2. Observe the API response.

**Expected Result:** HTTP 400 is returned. The service does not look up any email template for the unknown action type. No dispatch is made to the notification service. The response body includes a descriptive error.

---

### TC-NEG-006 — Send Email With Missing actionType Body Returns 400

**Category:** Negative
**Priority:** High
**Preconditions:** HR Admin authenticated. Employee 1042 is Active with email on file.
**Test Data:** `POST /hr/employee-support/employees/1042/send-email` with empty body `{}` or no body.

**Test Steps:**
1. Send the POST request with no `actionType` field in the body.
2. Observe the API response.

**Expected Result:** HTTP 400 is returned. The DTO validation rejects the request before any service logic runs. The error message indicates `actionType` is required.

---

### TC-NEG-007 — Deactivate With Unknown employeeId Returns 400

**Category:** Negative
**Priority:** High
**Preconditions:** HR Admin authenticated.
**Test Data:** `POST /hr/employee-support/employees/99999/deactivate` — employee ID 99999 does not exist.

**Test Steps:**
1. Send the POST request with HR Admin JWT and a non-existent employee ID.
2. Observe the response.

**Expected Result:** HTTP 400 is returned with message indicating the employee was not found. No database write occurs. No audit log entry is written.

---

### TC-NEG-008 — Employee From Different Company Returns 400 (Cross-Company Attempt)

**Category:** Negative
**Priority:** Critical
**Preconditions:** HR Admin for company 101 is authenticated. Employee ID 7001 belongs to company 202.
**Test Data:** Valid HR Admin JWT (company 101). `POST /hr/employee-support/employees/7001/send-email` with `{ actionType: "WELCOME_EMAIL" }`.

**Test Steps:**
1. Send the request using company 101's HR Admin JWT but targeting employee 7001 (company 202).
2. Observe the response.

**Expected Result:** HTTP 400 is returned. The service verifies that `employee.company_id` matches the JWT session `companyId` before processing. The mismatch is detected and the request is rejected. No email is dispatched. No data from company 202 is exposed in the error response.

---

### TC-NEG-009 — Page Parameter as Negative Integer Returns 400

**Category:** Negative
**Priority:** Medium
**Preconditions:** HR Admin authenticated.
**Test Data:** `GET /hr/employee-support/employees?page=-1&limit=25`.

**Test Steps:**
1. Send the GET request with `page=-1`.
2. Observe the API response.

**Expected Result:** HTTP 400 is returned. The DTO validation or query parameter guard rejects negative page values. No database query is executed with an invalid offset.

---

### TC-NEG-010 — Limit Parameter Exceeding Max 100 Returns 400

**Category:** Negative
**Priority:** Medium
**Preconditions:** HR Admin authenticated.
**Test Data:** `GET /hr/employee-support/employees?page=1&limit=500`.

**Test Steps:**
1. Send the GET request with `limit=500`.
2. Observe the response.

**Expected Result:** HTTP 400 is returned indicating the maximum allowed limit is 100. The server does not attempt to execute a query fetching 500 rows.

---

### TC-NEG-011 — Deactivation Modal Confirm Button Requires Explicit User Confirmation

**Category:** Negative
**Priority:** High
**Preconditions:** HR Admin on the deactivation confirmation modal for employee 1042.
**Test Data:** Modal is open, confirm button visible.

**Test Steps:**
1. Open the deactivation modal by clicking "Deactivate" in the "…" menu.
2. Do not click "Deactivate" confirm — instead press Escape key or click Cancel.
3. Observe the employee status.

**Expected Result:** Pressing Escape or clicking Cancel dismisses the modal. No deactivation call is made to the API. Employee status remains Active. The confirmation step cannot be bypassed (e.g., via keyboard shortcut or pressing Enter on modal open).

---

### TC-NEG-012 — Email Delivery Service Unavailable — Returns 503 With Retry Option

**Category:** Negative
**Priority:** High
**Preconditions:** Notification service is unreachable / returns a 5xx error.
**Test Data:** Employee ID 1042, ACTIVE, valid email. Notification service mocked to be unavailable.

**Test Steps:**
1. Attempt to trigger "Send Welcome Email" for employee 1042 while the notification service is down.
2. Observe the UI feedback.

**Expected Result:** An error toast or banner appears: "Send Welcome Email failed. Please try again." The action is NOT silently dropped. The user can retry by triggering the same action from the "…" menu again. The response returns HTTP 503. No partial state is left (no audit log for a failed dispatch that was not delivered).

---

## 4. Security Test Cases

---

### TC-SEC-001 — Unauthenticated Request to Employee Listing Returns 401

**Category:** Security
**Priority:** Critical
**Preconditions:** No JWT or session token is present in the request.
**Test Data:** `GET /hr/employee-support/employees` with no Authorization header.

**Test Steps:**
1. Send the GET request without any Authorization header.
2. Observe the response code.

**Expected Result:** HTTP 401 is returned before any controller method executes. No employee data is returned. The `JwtAuthGuard` at the controller class level intercepts the request.

---

### TC-SEC-002 — Expired JWT Returns 401 on All Endpoints

**Category:** Security
**Priority:** Critical
**Preconditions:** A previously valid JWT has expired.
**Test Data:** JWT with `exp` timestamp in the past. Target: `GET /hr/employee-support/employees`.

**Test Steps:**
1. Send a request using the expired JWT.
2. Repeat for `GET /hr/employee-support/filter-metadata`, `POST /send-email`, and `POST /deactivate`.

**Expected Result:** All four requests return HTTP 401. No data is returned. The token expiry is validated by `JwtAuthGuard` before any route handler runs.

---

### TC-SEC-003 — Non-HR-Admin JWT Returns 403 on All Endpoints

**Category:** Security
**Priority:** Critical
**Preconditions:** A valid JWT exists but the user's role is not HR_ADMIN (e.g., "EMPLOYEE" or "BROKER").
**Test Data:** JWT with `user_type_key = EMPLOYEE`.

**Test Steps:**
1. Send requests to: `GET /hr/employee-support/employees`, `GET /hr/employee-support/filter-metadata`, `POST /hr/employee-support/employees/1042/send-email`, `POST /hr/employee-support/employees/1042/deactivate`, `POST /hr/report/generate/emp_support_kpi_summary`.
2. Observe each response.

**Expected Result:** All five requests return HTTP 403. The `RolesGuard(HR_ADMIN)` rejects the requests after JWT validation. No data is returned in any response. No service-layer logic executes.

---

### TC-SEC-004 — Cross-Company employeeId Access Blocked at Service Layer

**Category:** Security
**Priority:** Critical
**Preconditions:** HR Admin for company 101 is authenticated. Attempts to act on an employee belonging to company 202.
**Test Data:** HR Admin JWT (company 101). Employee ID 7001 (company 202). Both a read via listing and a write via deactivation.

**Test Steps:**
1. Attempt `GET /hr/employee-support/employees` — confirm only company 101 employees are returned.
2. Attempt `POST /hr/employee-support/employees/7001/deactivate` with company 101 JWT.
3. Observe the response.

**Expected Result:** The employee listing returns only company 101 employees (company 202 employees are excluded at the query level via `WHERE pee.company_id = {session companyId}`). The deactivation attempt returns HTTP 400 because the service verifies `employee.company_id === session.companyId` and rejects the mismatch. No company 202 data is modified or exposed.

---

### TC-SEC-005 — SQL Injection in Search Parameter Is Neutralised

**Category:** Security
**Priority:** Critical
**Preconditions:** HR Admin authenticated.
**Test Data:** `GET /hr/employee-support/employees?search='; DROP TABLE policy_enrollment_employee; --`

**Test Steps:**
1. Send the GET request with the SQL injection string in the `search` parameter.
2. Observe the response and database state.

**Expected Result:** The request is handled safely. The TypeORM parameterized query treats the injection string as a literal search value (no match found). HTTP 200 is returned with an empty or normal result set. No database table is altered. The injected SQL is never executed.

---

### TC-SEC-006 — SQL Injection in Filter Parameter Is Neutralised

**Category:** Security
**Priority:** Critical
**Preconditions:** HR Admin authenticated. Company has a "gender" filter parameter.
**Test Data:** `GET /hr/employee-support/employees?gender=Male' OR '1'='1`

**Test Steps:**
1. Send the GET request with a SQL injection string in a filter parameter.
2. Observe the response.

**Expected Result:** The TypeORM parameterized query (using `additional_params->>'gender'`) treats the injected string as a literal value. The query returns only employees with gender literally matching the injected string (likely zero results). No extra records are returned. Database integrity is maintained.

---

### TC-SEC-007 — Caller-Supplied companyId in Query Param Is Ignored

**Category:** Security
**Priority:** Critical
**Preconditions:** HR Admin for company 101 is authenticated.
**Test Data:** `GET /hr/employee-support/employees?companyId=202` (attempting to pull data for company 202).

**Test Steps:**
1. Send the request with `companyId=202` as a query parameter.
2. Observe the employees returned.

**Expected Result:** The service ignores the caller-supplied `companyId` parameter entirely. The query executes with `companyId` derived from the JWT session only (company 101). Only company 101 employees are returned. Company 202 data is not accessible.

---

### TC-SEC-008 — Deactivation Double-Check at Service Layer Enforces HR_ADMIN

**Category:** Security
**Priority:** High
**Preconditions:** The `RolesGuard` configuration is hypothetically loosened or removed from the deactivate endpoint.
**Test Data:** Valid JWT with `user_type_key = HR_VIEWER`. Direct call to `POST /hr/employee-support/employees/1042/deactivate`.

**Test Steps:**
1. In a test environment, bypass the guard-level role check (simulate misconfiguration).
2. Send the deactivation request with an HR_VIEWER JWT.
3. Observe the service-layer response.

**Expected Result:** The service-layer check (`if (sessionUser.user_type_key !== 'HR_ADMIN') return 403`) independently rejects the request with HTTP 403: "Deactivation requires HR Administrator role." Defense-in-depth ensures deactivation cannot proceed even if the guard is misconfigured.

---

### TC-SEC-009 — Decrypted Email Address Not Present in Audit Log

**Category:** Security
**Priority:** High
**Preconditions:** HR Admin triggers a "Send Welcome Email" action for employee 1042.
**Test Data:** Employee email = "arjun.sharma@domain.com". Action succeeds.

**Test Steps:**
1. Trigger "Send Welcome Email" for employee 1042.
2. Confirm the action succeeds (toast shown).
3. Query `user_activity_log` for the corresponding audit entry.
4. Inspect all columns of the audit log row.

**Expected Result:** The audit log row contains: `action_type = 'WELCOME_EMAIL'`, `target_employee_id = 1042`, `triggered_by = {sessionUserId}`, `company_id`, `timestamp`. The decrypted email address "arjun.sharma@domain.com" is NOT present in any column of the audit log entry. PII handling per TRD §13.5 is enforced.

---

### TC-SEC-010 — Encrypted email_enc Not Exposed via Raw SQL Path

**Category:** Security
**Priority:** High
**Preconditions:** The KPI report SQL executes via raw SQL execution (framework path, not TypeORM entity).
**Test Data:** Company with employees who have `email_enc` values. KPI summary report endpoint called.

**Test Steps:**
1. Call `POST /hr/report/generate/emp_support_kpi_summary`.
2. Inspect the full response payload.

**Expected Result:** The KPI report response contains only aggregate numeric values (counts): `totalEmployees`, `activeEmployees`, `inactiveEmployees`, `enrolledEmployees`, `notEnrolledEmployees`. No `email_enc` or any email-related values are present in the response. The KPI SQL does not SELECT `email_enc` at all — counts are derived from `user_status_key` and `employee_enrollment_status_key`. No PII leaks via the report framework path.

> 🔁 **Updated** — Removed reference to `IS NULL / IS NOT NULL` email_enc checks; KPI SQL does not reference `email_enc` per TRD §4.3 and §6.

---

## 5. Performance Test Cases

---

### TC-PERF-001 — Employee Listing Loads in Under 3 Seconds for 5,000 Employees

**Category:** Performance
**Priority:** Critical
**Preconditions:** Company is seeded with exactly 5,000 active employee records. Database has an index on `pee.company_id` and `pee.deleted_at`.
**Test Data:** 5,000 employees, page=1, limit=25. No active filters.

**Test Steps:**
1. Log in as HR Admin for the 5,000-employee company.
2. Record timestamp immediately before navigating to `/hr/employee-support`.
3. Record timestamp when the listing first row is rendered.
4. Calculate elapsed time.

**Expected Result:** The initial employee listing (first 25 rows) renders within 3 seconds of page navigation. The response time for `GET /hr/employee-support/employees?page=1&limit=25` is under 3,000ms. No timeout errors occur.

---

### TC-PERF-002 — Filter Application Updates Listing and KPIs Within 1 Second

**Category:** Performance
**Priority:** Critical
**Preconditions:** HR Admin viewing the employee listing for a 5,000-employee company.
**Test Data:** Status filter applied to "ACTIVE". Expected to filter to ~4,000 records.

**Test Steps:**
1. With the full listing loaded, select "ACTIVE" from the Status filter.
2. Record the time from filter selection to listing re-render with updated KPIs.

**Expected Result:** The listing updates and all five KPI cards recompute within 1 second of the filter selection. The 300ms debounce is included in the 1-second budget. Response time for the filtered `GET /employees` request does not exceed 700ms after debounce.

---

### TC-PERF-003 — Email Action Returns Success or Failure Within 3 Seconds

**Category:** Performance
**Priority:** High
**Preconditions:** Notification service is available and responding normally. Employee is Active with email on file.
**Test Data:** 10 consecutive email action dispatches for different employees.

**Test Steps:**
1. Trigger each of the five email action types for two different employees (10 total dispatches).
2. Record the time from each action trigger to the corresponding toast notification appearing.

**Expected Result:** Each action's success or failure toast appears within 3 seconds of triggering. No request hangs indefinitely. 503 errors (notification service issues) are surfaced within the same 3-second window.

---

### TC-PERF-004 — Deactivation Reflects Updated Status Within 3 Seconds

**Category:** Performance
**Priority:** High
**Preconditions:** HR Admin with a target Active employee. Database write path is available.
**Test Data:** Employee ID 1042, status = ACTIVE.

**Test Steps:**
1. Initiate the deactivation flow and confirm in the modal.
2. Record time from "Deactivate" confirm click to the in-place status badge update in the listing.

**Expected Result:** The listing row reflects "Inactive" status within 3 seconds of the HR admin confirming. The deactivation `POST` request completes and the UI updates within this window.

---

### TC-PERF-005 — Concurrent Requests From Multiple HR Admins Do Not Degrade Response

**Category:** Performance
**Priority:** High
**Preconditions:** Load testing environment available. Database has 5,000 employees across multiple companies.
**Test Data:** 20 concurrent HR Admin users from different companies each loading the Employee Support page simultaneously.

**Test Steps:**
1. Simulate 20 concurrent `GET /hr/employee-support/employees?page=1&limit=25` requests from 20 different company JWTs simultaneously.
2. Record response times for each request.

**Expected Result:** All 20 requests return HTTP 200 within 3 seconds. Average response time does not exceed 1.5 seconds under this concurrent load. Each response contains only data for the respective company (no cross-company data bleed).

---

### TC-PERF-006 — Pagination Does Not Reload Full Dataset

**Category:** Performance
**Priority:** Medium
**Preconditions:** 5,000-employee company. Page size = 25.
**Test Data:** Navigate from page 1 to page 100.

**Test Steps:**
1. From page 1, click to page 100 (`?page=100&limit=25`).
2. Observe network payload size and response time.

**Expected Result:** Only 25 rows are returned in the payload (rows 2476–2500). The full 5,000-row dataset is not loaded. Response time for page navigation is under 1 second (no full re-fetch). Server-side offset computation: `(100 - 1) × 25 = 2475`.

---

### TC-PERF-007 — Filter Metadata Endpoint Responds Within Acceptable Time

**Category:** Performance
**Priority:** Medium
**Preconditions:** Company has 10 active policy parameters across multiple policies.
**Test Data:** `GET /hr/employee-support/filter-metadata` for a company with 10 parameters and 5,000 employees (to test distinct value resolution).

**Test Steps:**
1. Send the filter metadata request.
2. Measure response time.

**Expected Result:** Response is received within 2 seconds. The `data.filters` array contains 12 items (10 policy parameters + `status` + `enrollmentStatus` prepended). Deduplication of parameters across policies is performed server-side.

---

### TC-PERF-008 — KPI Summary Report Responds Within 3 Seconds on Maximum Dataset

**Category:** Performance
**Priority:** High
**Preconditions:** 5,000-employee company with varied status and enrollment distributions.
**Test Data:** `POST /hr/report/generate/emp_support_kpi_summary` with `{ companyId: 101 }`.

**Test Steps:**
1. Send the KPI summary request.
2. Measure response time.
3. Verify the response envelope.

**Expected Result:** HTTP 201 is returned within 3 seconds. `data.rows[0]` contains all five keys: `totalEmployees`, `activeEmployees`, `inactiveEmployees`, `enrolledEmployees`, `notEnrolledEmployees` — all as non-negative integers.

---

## 6. Integration Test Cases

---

### TC-INT-001 — KPI Framework Endpoint Returns Correct 201 Envelope on Page Load

**Category:** Integration
**Priority:** Critical
**Preconditions:** Real PostgreSQL test instance seeded with fixture employees. `emp_support_kpi_summary` is seeded in `admin_reports`.
**Test Data:** Company 101: 50 Total, 40 Active, 10 Inactive, 30 Enrolled, 20 Not Enrolled.

**Test Steps:**
1. Call `POST /hr/report/generate/emp_support_kpi_summary` with `{ companyId: 101 }`.
2. Parse the response envelope.
3. Read `data.rows[0]` and compare against fixture.

**Expected Result:** HTTP 201. Response body: `{ statusCode: 201, message: "Report generated successfully.", data: { rows: [{ totalEmployees: 50, activeEmployees: 40, inactiveEmployees: 10, enrolledEmployees: 30, notEnrolledEmployees: 20 }], count: 1 } }`. Values match fixture exactly. Company 102's employees are not included.

---

### TC-INT-002 — Employee Listing Returns Raw email_enc Values (Encryption Not Active in Dev)

🔁 **Updated** — Per TRD §4.3 implementation note (2026-05-06): `email_enc`, `date_of_birth_enc`, and `phone_number_enc` are NOT actively encrypted in the current dev environment. The SQL scripts select these columns directly as raw values. The `IS NOT NULL AS "hasEmail"` boolean pattern has been removed from the implementation. This TC has been updated to match the current implementation.

**Category:** Integration
**Priority:** Critical
**Preconditions:** Real PostgreSQL instance. Employee ID 1042 has `email_enc` stored as plain-text raw value (encryption not active in dev).
**Test Data:** Employee ID 1042, `email_enc` = raw stored value "arjun.sharma@domain.com" (not encrypted bytes).

**Test Steps:**
1. Call `GET /hr/employee-support/employees?page=1&limit=25`.
2. Locate employee 1042 in `data.rows`.
3. Inspect the `email` field in the row.
4. Verify no `hasEmail` boolean field is present in the row object.

**Expected Result:** The `email` field in the response contains the plain-text value "arjun.sharma@domain.com" read directly from the `email_enc` column via SQL. No `hasEmail` boolean field is present in the row — the `IS NOT NULL AS "hasEmail"` pattern has been removed. The response correctly reflects the current implementation where column values are selected as-is without `@SensitiveField` decryption.

---

### TC-INT-003 — Notification Service Unavailable — 503 Surfaced Without Silent Drop

**Category:** Integration
**Priority:** Critical
**Preconditions:** Notification service is mocked to be unreachable (connection refused or 5xx).
**Test Data:** Employee ID 1042, ACTIVE, valid email. Action: `WELCOME_EMAIL`.

**Test Steps:**
1. Trigger `POST /hr/employee-support/employees/1042/send-email` with `{ actionType: "WELCOME_EMAIL" }`.
2. Observe the HTTP response.
3. Check the UI for feedback.

**Expected Result:** HTTP 503 is returned from the service. The UI displays an error toast: "Send Welcome Email failed. Please try again." The action is not silently dropped or acknowledged as success. No audit log entry for a successful dispatch is written. The user can retry via the same "…" menu.

---

### TC-INT-004 — Database Unavailable During Deactivation — No Partial Commit

**Category:** Integration
**Priority:** Critical
**Preconditions:** Database write path fails midway through deactivation (e.g., connection drops after the employee load but before the UPDATE).
**Test Data:** Employee ID 1042, ACTIVE, linked user_id = 388.

**Test Steps:**
1. Mock the database to fail on the UPDATE statement in the deactivation flow.
2. Trigger deactivation via `POST /hr/employee-support/employees/1042/deactivate`.
3. Check `users.user_status_key` for user 388 in the database.
4. Observe the UI state.

**Expected Result:** HTTP 503 is returned. `users.user_status_key` remains "ACTIVE" — no partial update is committed. The deactivation modal remains open with inline error: "Unable to deactivate. Please try again." No audit log entry is written. Retry is available.

---

### TC-INT-005 — Audit Log Written After Every Triggered Action

**Category:** Integration
**Priority:** Critical
**Preconditions:** Real PostgreSQL instance. HR Admin (user ID 500) triggers all auditable action types against active fixture employees.
**Test Data:** Five email actions + one deactivation. All actions successful.

**Test Steps:**
1. Trigger each of the five email actions for different employees.
2. Trigger deactivation for one employee.
3. Query `user_activity_log` for entries with `triggered_by = 500`.
4. Verify each entry's fields.

**Expected Result:** Six `user_activity_log` rows are created. Each row contains: `action_type` (matching the triggered action), `target_employee_id`, `triggered_by = 500`, `company_id`, and a `timestamp` within the test window. The deactivation row additionally contains `target_user_id`. No entry is missing for any successfully triggered action.

---

### TC-INT-006 — Filter Metadata Derived From policy_enrollment_parameters Correctly

**Category:** Integration
**Priority:** High
**Preconditions:** Real PostgreSQL instance. Company 101 has two policies; combined parameters: Gender (select), Designation (text), Region (select, from policy 2 only).
**Test Data:** `policy_enrollment_parameters` rows for policies linked to company 101.

**Test Steps:**
1. Call `GET /hr/employee-support/filter-metadata`.
2. Inspect `data.filters`.

**Expected Result:** `data.filters` contains: `status` (prepended, type=select, options=[ACTIVE, INACTIVE]), `enrollmentStatus` (prepended, type=select, options from DB), `gender` (type=select, options from distinct JSONB values), `designation` (type=text), `region` (type=select). Parameters from both policies are included; duplicates are deduplicated. Total: 5 filter objects.

---

### TC-INT-007 — KPI Recomputes After Deactivation in Same Session

**Category:** Integration
**Priority:** High
**Preconditions:** Company has 40 Active, 10 Inactive employees at session start.
**Test Data:** Deactivate employee 1042 (previously Active).

**Test Steps:**
1. Note KPI: Active = 40, Inactive = 10.
2. Deactivate employee 1042.
3. Observe KPI cards after the modal closes.

**Expected Result:** KPI Active Employees decreases to 39. KPI Inactive / Deactivated increases to 11. Total Employees remains 50. The recomputation occurs in-place without a full page reload.

---

### TC-INT-008 — policy_employee_enrollment Joined With deleted_at IS NULL Guard

**Category:** Integration
**Priority:** High
**Preconditions:** Real PostgreSQL instance. One soft-deleted enrollment record exists for an employee (deleted_at IS NOT NULL).
**Test Data:** Employee ID 1042 has an enrollment row with `deleted_at = '2026-01-01'` and a valid active enrollment row with `deleted_at IS NULL`.

**Test Steps:**
1. Call `GET /hr/employee-support/employees` and locate employee 1042.
2. Inspect the `enrollmentStatus` value.
3. Run the KPI report and check enrolled counts.

**Expected Result:** The soft-deleted enrollment row is excluded from all queries. Employee 1042's enrollment status reflects only the active (non-deleted) enrollment row. KPI enrolled counts do not double-count or include soft-deleted records. All queries include `AND pee_enroll.deleted_at IS NULL`.

---

### TC-INT-009 — Three Parallel Page-Load Requests Complete and Render Independently

**Category:** Integration
**Priority:** High
**Preconditions:** Full stack available. HR Admin navigates to `/hr/employee-support`.
**Test Data:** Company with fixture employees, policy parameters, and known KPI counts.

**Test Steps:**
1. Open browser DevTools Network panel.
2. Navigate to `/hr/employee-support`.
3. Observe the three initial requests fired in parallel.
4. Verify all three complete successfully.
5. Verify that KPI, filter bar, and listing each render correctly from their respective responses.

**Expected Result:** Three requests are fired in parallel: KPI report (201), employee listing (200), filter metadata (200). Each request completes independently. If the filter metadata request is slower, the listing still renders (and vice versa). The page does not wait for all three sequentially.

---

### TC-INT-010 — No Email Template Configured for Action Returns 400

**Category:** Integration
**Priority:** High
**Preconditions:** `company_email_template_map` has no entry for company 101 and event type `HR_ECARD`.
**Test Data:** `POST /hr/employee-support/employees/1042/send-email` with `{ actionType: "ECARD_EMAIL" }`.

**Test Steps:**
1. Ensure no template mapping exists for `HR_ECARD` for company 101.
2. Send the send-email API request.
3. Observe the response.

**Expected Result:** HTTP 400 is returned with message: "No email template configured for this action." The notification service is never called. An appropriate error toast is displayed to the HR Admin.

---

## 7. Accessibility Test Cases

---

### TC-ACC-001 — KPI Cards Have Descriptive ARIA Labels for Screen Readers

**Category:** Accessibility
**Priority:** High
**Preconditions:** HR Admin on `/hr/employee-support`. Screen reader enabled (e.g., NVDA or VoiceOver).
**Test Data:** KPI cards with known values.

**Test Steps:**
1. Navigate to the page using a screen reader.
2. Tab to each KPI card or use heading navigation.
3. Listen to the announced text for each card.

**Expected Result:** Each card is announced with both its title and value, e.g., "Total Employees: 240", "Active Employees: 198", etc. Cards have appropriate `aria-label` or `role="region"` with accessible names. The colour-coding (Blue, Green, Red, Teal, Amber) is not the sole means of conveying information.

---

### TC-ACC-002 — Filter Bar Controls Are Keyboard-Navigable

**Category:** Accessibility
**Priority:** High
**Preconditions:** HR Admin on `/hr/employee-support`. Keyboard-only navigation (no mouse).
**Test Data:** Filter Bar with Status, Enrollment, Gender dropdowns and Search input.

**Test Steps:**
1. Tab from the last KPI card into the Filter Bar.
2. Use Tab to move between filter controls.
3. Use Enter or Space to open a dropdown filter.
4. Use arrow keys to select a value within the dropdown.
5. Press Enter to confirm selection.
6. Tab to the "Reset Filters" button and activate with Enter.

**Expected Result:** All filter controls receive keyboard focus in logical order. Dropdowns open and close with keyboard input. Values can be selected without a mouse. The "Reset Filters" button is reachable and activatable via keyboard. Focus is not trapped unexpectedly.

---

### TC-ACC-003 — Disabled Action Items Have Accessible Tooltip Text

**Category:** Accessibility
**Priority:** High
**Preconditions:** HR Admin viewing the "…" menu for an Inactive employee.
**Test Data:** Employee ID 4001, status = INACTIVE.

**Test Steps:**
1. Open the "…" menu for the Inactive employee.
2. Use screen reader to navigate the menu items.
3. Focus on the disabled Deactivate item.
4. Focus on any disabled email action item.

**Expected Result:** The screen reader announces the disabled state and the tooltip text for each item. "Deactivate" is announced as disabled with reason "Employee is already inactive." Email actions are announced as disabled with reason "No email address on file" (if applicable). Disabled items are not skipped by keyboard navigation.

---

### TC-ACC-004 — Deactivation Confirmation Modal Traps Focus Correctly

**Category:** Accessibility
**Priority:** High
**Preconditions:** HR Admin has triggered the deactivation modal for an Active employee.
**Test Data:** Modal open for employee "Arjun Sharma".

**Test Steps:**
1. Open the deactivation modal via keyboard.
2. Verify that focus is moved to the modal when it opens.
3. Tab through all interactive elements within the modal.
4. Verify that Tab does not exit the modal to the page behind.
5. Press Escape to close the modal.

**Expected Result:** Focus moves to the modal title or first interactive element when the modal opens. Tabbing cycles through: title text, body text, "Cancel" button, "Deactivate" button (and back). Focus is trapped within the modal while it is open. Pressing Escape closes the modal and returns focus to the "…" menu trigger that opened it.

---

### TC-ACC-005 — Status and Enrollment Badges Meet Colour Contrast Requirements

**Category:** Accessibility
**Priority:** High
**Preconditions:** HR Admin viewing the employee listing.
**Test Data:** Rows with Active (green), Inactive (red), Enrolled (teal), Not Enrolled (amber), Pending (grey) badges.

**Test Steps:**
1. Inspect the colour contrast ratio of text on each badge type using a contrast analysis tool.
2. Verify each badge against WCAG 2.1 AA standard (minimum 4.5:1 for normal text, 3:1 for large text).

**Expected Result:** All badge colour combinations (text on background) meet at least 4.5:1 contrast ratio. The badge label text alone communicates the status (not relying on colour alone). Screen reader announces the badge text ("Active", "Inactive", "Enrolled", etc.) without requiring visual colour interpretation.

---

### TC-ACC-006 — Empty State Messages Are Announced by Screen Readers

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** All employees are filtered out by an active filter.
**Test Data:** Designation filter = "NonExistentRole".

**Test Steps:**
1. Apply a filter that returns zero employees.
2. Navigate to the listing area using a screen reader.
3. Listen to what is announced.

**Expected Result:** The screen reader announces the empty state message: "No employees match the active filters." The "Clear filters" link is also announced and keyboard-accessible. The empty state region has an appropriate `aria-live` region or is reachable via heading navigation.

---

### TC-ACC-007 — Pagination Controls Are Keyboard-Accessible and Labelled

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** Company with 75 employees, 3 pages.
**Test Data:** HR Admin on page 1 of the listing.

**Test Steps:**
1. Tab to the pagination controls.
2. Verify each control is accessible and labelled.
3. Activate "Next" via keyboard.
4. Verify focus moves appropriately.

**Expected Result:** "Previous", page number buttons, and "Next" are all keyboard-accessible. Each button has an `aria-label` (e.g., "Go to page 2", "Previous page", "Next page"). The current page button is indicated with `aria-current="page"`. Disabled "Previous" on page 1 is announced as disabled.

---

### TC-ACC-008 — Three Dots Action Menu Keyboard-Accessible and Dismissable

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** HR Admin viewing the employee listing.
**Test Data:** Any employee row with an active "…" menu.

**Test Steps:**
1. Tab to the "…" button in an employee row.
2. Press Enter or Space to open the dropdown.
3. Use arrow keys to navigate action items.
4. Press Escape to close the dropdown.
5. Verify focus returns to the "…" button.

**Expected Result:** The "…" button has an `aria-label` (e.g., "Actions for Arjun Sharma"). The dropdown opens and is navigable by keyboard. Pressing Escape closes the menu and returns focus to the "…" button. The expanded/collapsed state is communicated via `aria-expanded`.

---

## 8. Regression Test Cases

---

### TC-REG-001 — KPI Counts Reflect Filtered Subset, Not Static Company Total

**Category:** Regression
**Priority:** Critical
**Preconditions:** Company has 240 total employees. A filter is active.
**Test Data:** Status filter = "ACTIVE". 198 Active employees.

**Test Steps:**
1. Apply Status = "ACTIVE" filter.
2. Read all five KPI card values.
3. Verify they do not show the unfiltered company totals.

**Expected Result:** KPI Total = 198 (not 240). KPI Active = 198. KPI Inactive = 0. KPI values are derived from the filtered dataset, not from a separate aggregate query over all company employees. This confirms BR-EMPSUPPORT-006 is correctly implemented and hasn't regressed.

---

### TC-REG-002 — Deactivated Employee Remains Visible in Listing With Inactive Badge

**Category:** Regression
**Priority:** Critical
**Preconditions:** An employee has just been deactivated in-session.
**Test Data:** Employee ID 1042, just deactivated. DB: `users.user_status_key = 'USER_STATUS_INACTIVE'`.

**Test Steps:**
1. After deactivating employee 1042, scroll through the listing.
2. Locate employee 1042.
3. Inspect the Status badge.

**Expected Result:** Employee 1042 is still present in the listing (not removed or hidden). The Status badge shows red "Inactive". The employee record is NOT deleted from `policy_enrollment_employee`. Soft-delete only affects `users.user_status_key` which is set to `'USER_STATUS_INACTIVE'` (not `'INACTIVE'`). This confirms the soft-deactivation rule has not regressed into a hard delete.

> 🔁 **Updated** — Status literal corrected to `USER_STATUS_INACTIVE` per TRD §5.

---

### TC-REG-003 — All Email Actions Immediately Disabled After In-Session Deactivation

**Category:** Regression
**Priority:** Critical
**Preconditions:** HR Admin deactivates employee 1042 in the current session.
**Test Data:** Employee ID 1042: was Active, now deactivated in-session.

**Test Steps:**
1. Confirm deactivation via the modal.
2. Immediately open the "…" menu for employee 1042 (same session, no page refresh).
3. Inspect all action items.

**Expected Result:** All action items (Block/Unblock, Tag as VIP, Edit Employee, Reset Password, Send eCard Email, Extend Enrollment Window, Send Welcome Email, and Deactivate) are immediately in a disabled/greyed-out state. The row-level Reminder "Send" button is also immediately disabled. The Deactivate action shows "Employee is already inactive." No page refresh was required for the state to update. This ensures in-session state propagation has not regressed.

> 🔁 **Updated** — "All six action items" expanded to the full menu item set per PRD §4.4. Row-level Reminder button added.

---

### TC-REG-004 — Deactivate Action Shown Disabled for Non-HR-Admin (Not Hidden)

**Category:** Regression
**Priority:** High
**Preconditions:** Non-HR-Admin user (HR_VIEWER) is authenticated and views the listing.
**Test Data:** HR_VIEWER JWT. Any Active employee row.

**Test Steps:**
1. Log in as HR_VIEWER.
2. Open the "…" menu for an Active employee.
3. Inspect the Deactivate menu item.

**Expected Result:** The Deactivate item is visible in the dropdown but rendered in a disabled/greyed-out state. It is NOT hidden or removed from the menu. Tooltip: "Deactivation requires HR Administrator role." This confirms the SDS requirement that disabled actions remain visible has not regressed.

---

### TC-REG-005 — Resetting Filters After Search Restores Full Unfiltered Listing

**Category:** Regression
**Priority:** High
**Preconditions:** HR Admin has applied a search and a filter. Listing shows 3 results.
**Test Data:** Search = "Arjun", Status = "ACTIVE", 3 matching employees. Company total = 240.

**Test Steps:**
1. Confirm the listing shows 3 filtered employees.
2. Click "Reset Filters".
3. Verify both the search term and the Status filter are cleared.
4. Verify the listing shows all 240 employees.

**Expected Result:** Both the search input and the filter dropdown revert to empty/default. The listing reloads with all 240 employees. KPIs reflect the company totals. Partial reset (e.g., only clearing search but not the filter) does not occur.

---

### TC-REG-006 — Company Scoping Remains Intact After Filter Change

**Category:** Regression
**Priority:** Critical
**Preconditions:** HR Admin for company 101. Company 202 also has employees in the database.
**Test Data:** Apply and then remove a filter while logged in as company 101 HR Admin.

**Test Steps:**
1. Apply Status = "ACTIVE" filter. Observe listing.
2. Click Reset Filters. Observe listing.
3. Apply Status = "INACTIVE". Observe listing.
4. In each state, check that no employees from company 202 appear.

**Expected Result:** In all three listing states (active filter, no filter, inactive filter), only company 101 employees are returned. Company scoping is re-applied with every new query (not cached after the first request). Cross-company data never appears in any listing state.

---

### TC-REG-007 — Session Re-Entry Does Not Carry Over Previously Applied Filters

**Category:** Regression
**Priority:** Medium
**Preconditions:** HR Admin applied multiple filters in a previous session, then logged out and back in.
**Test Data:** Previous session had Status = "ACTIVE", Gender = "Female" filters active.

**Test Steps:**
1. Log out of the HR Admin session.
2. Log back in.
3. Navigate to `/hr/employee-support`.
4. Observe the Filter Bar state.

**Expected Result:** The Filter Bar renders with no active filters. All filter controls are in their default (empty) state. The full unfiltered listing loads. No previously applied filters persist across sessions (unless URL-based filter state is intentionally implemented — and in that case, clearing the URL should clear all filters).

---

### TC-REG-008 — Email Actions Are Stateless — Same Action Can Be Triggered Multiple Times

**Category:** Regression
**Priority:** High
**Preconditions:** HR Admin authenticated. Employee 1042 is Active with email on file.
**Test Data:** "Send Welcome Email" triggered twice for the same employee in the same session.

**Test Steps:**
1. Trigger "Send Welcome Email" for employee 1042.
2. Observe success toast.
3. Immediately trigger "Send Welcome Email" for employee 1042 again.
4. Observe the second toast.

**Expected Result:** Both dispatches succeed and return success toasts. No cooldown, block, or error is applied on the second trigger. The listing row does not display any persistent "sent" indicator after the first dispatch. Two audit log entries are created (one per dispatch). This confirms the stateless trigger model per BR-EMPSUPPORT-004 has not regressed.

---

## 9. Data Integrity Test Cases

---

### TC-DAT-001 — Audit Log Entry Created for Every Email Action With Correct Fields

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Real PostgreSQL instance. HR Admin (user ID 500) for company 101 triggers "Send eCard" for employee 1042.
**Test Data:** Action: ECARD_EMAIL. Employee ID: 1042. Session user ID: 500. Company ID: 101.

**Test Steps:**
1. Trigger "Send eCard" for employee 1042.
2. Confirm success toast.
3. Query: `SELECT * FROM user_activity_log WHERE triggered_by = 500 AND target_employee_id = 1042 ORDER BY timestamp DESC LIMIT 1`.
4. Verify all required fields.

**Expected Result:** Exactly one new row exists with: `action_type = 'ECARD_EMAIL'`, `target_employee_id = 1042`, `triggered_by = 500`, `company_id = 101`, `timestamp` within the last 10 seconds. No `email` field is present in the log row (PII not stored).

---

### TC-DAT-002 — Audit Log Entry Created for Deactivation With Correct Fields

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** HR Admin (user ID 500) deactivates employee 1042 (linked user ID 388).
**Test Data:** Deactivation action. Employee ID: 1042. User ID: 388. Session user ID: 500.

**Test Steps:**
1. Deactivate employee 1042 via the modal.
2. Query `user_activity_log` for the most recent entry from user 500.
3. Verify all fields.

**Expected Result:** Audit log row contains: `action_type = 'DEACTIVATE'`, `target_employee_id = 1042`, `target_user_id = 388`, `triggered_by = 500`, `company_id = 101`, `timestamp` within the last 10 seconds. The deactivation audit entry includes the `target_user_id` field (unlike email action entries).

---

### TC-DAT-003 — Deactivation Only Sets user_status_key = USER_STATUS_INACTIVE — Record Not Deleted

🔁 **Updated** — Status literals corrected to `USER_STATUS_ACTIVE` / `USER_STATUS_INACTIVE` per TRD §5.

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Employee 1042 is Active. Deactivation is triggered and confirmed.
**Test Data:** Before: `users.user_status_key = 'USER_STATUS_ACTIVE'`, `policy_enrollment_employee.deleted_at IS NULL`.

**Test Steps:**
1. Deactivate employee 1042.
2. Query: `SELECT user_status_key, status_lid, deleted_at FROM users WHERE id = 388`.
3. Query: `SELECT deleted_at FROM policy_enrollment_employee WHERE id = 1042`.

**Expected Result:** `users.user_status_key = 'USER_STATUS_INACTIVE'` and `status_lid` is updated to the corresponding INACTIVE LookUp ID. `users.deleted_at` is NOT set (user record not deleted). `policy_enrollment_employee.deleted_at` remains NULL — the employee record is not deleted. Reactivation is possible in future phases because no data is destroyed.

---

### TC-DAT-004 — Decrypted Email Is Not Written to Any Logged Field

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** All auditable action types triggered for employee 1042 whose email = "arjun.sharma@domain.com".
**Test Data:** Five email actions + one deactivation dispatched for employee 1042.

**Test Steps:**
1. Trigger all five email actions and one deactivation for employee 1042.
2. Query all new rows in `user_activity_log` for employee 1042.
3. Inspect every column across all rows.

**Expected Result:** None of the audit log rows contain "arjun.sharma@domain.com" or any variant of the email address in any column. The decrypted email is used only transiently (for dispatch to notification service and display in toast/UI) and is never persisted in the audit log. PII handling per TRD §13.5 is enforced.

---

### TC-DAT-005 — All Queries Scope to company_id From JWT — No Cross-Company Rows

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Database has employees for companies 101 and 202. HR Admin is for company 101.
**Test Data:** `GET /hr/employee-support/employees`, KPI report, filter metadata — all using company 101 JWT.

**Test Steps:**
1. Call each of the three read endpoints with company 101 JWT.
2. Inspect all employee IDs and company_id values in the responses.

**Expected Result:** Every employee row in `data.rows` has `company_id = 101`. No employee belonging to company 202 appears in any response. KPI counts match only company 101 totals. Filter metadata options are derived only from company 101's policy parameters.

---

### TC-DAT-006 — policy_employee_enrollment Reads Always Include deleted_at IS NULL

**Category:** Data Integrity
**Priority:** High
**Preconditions:** A fixture employee has one active and one soft-deleted enrollment record.
**Test Data:** Employee ID 1042: enrollment row A (`deleted_at IS NULL`, `employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'`), enrollment row B (`deleted_at = '2025-12-01'`, status = NOT_ENROLLED).

**Test Steps:**
1. Call `GET /hr/employee-support/employees` and locate employee 1042.
2. Read `enrollmentStatus` in the response.
3. Call `POST /hr/report/generate/emp_support_kpi_summary` and read `enrolledEmployees`.

**Expected Result:** Employee 1042's `enrollmentStatus` reflects the active row only: `EMPLOYEE_ENROLLMENT_STATUS_ENROLLED`. The soft-deleted NOT_ENROLLED row is excluded. KPI enrolled count includes employee 1042. The `AND pee_enroll.deleted_at IS NULL` join condition is applied in all queries.

> 🔁 **Updated** — Enrollment status literal corrected to `EMPLOYEE_ENROLLMENT_STATUS_ENROLLED` per TRD §5.

---

### TC-DAT-007 — policy_enrollment_employee Reads Always Include deleted_at IS NULL

**Category:** Data Integrity
**Priority:** High
**Preconditions:** An employee record in `policy_enrollment_employee` has `deleted_at` set (soft-deleted from the system).
**Test Data:** Employee ID 9001 has `policy_enrollment_employee.deleted_at = '2025-11-01'`.

**Test Steps:**
1. Call `GET /hr/employee-support/employees` for the company.
2. Search for employee ID 9001 in the response rows.

**Expected Result:** Employee 9001 does not appear in the listing or KPI counts. The `AND pee.deleted_at IS NULL` filter on the primary employee table excludes soft-deleted employee records from all read paths.

---

### TC-DAT-008 — KPI Enrolled Count Uses DISTINCT employee_id to Prevent Duplicate Counting

**Category:** Data Integrity
**Priority:** High
**Preconditions:** One employee has two active enrollment records for different policies (both with status = ENROLLED).
**Test Data:** Employee ID 1042 has two rows in `policy_employee_enrollment`, both with `employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'` and `deleted_at IS NULL`.

**Test Steps:**
1. Call `POST /hr/report/generate/emp_support_kpi_summary`.
2. Read `enrolledEmployees` from `data.rows[0]`.
3. Verify the count does not double-count employee 1042.

**Expected Result:** Employee 1042 is counted exactly once in `enrolledEmployees` (not twice). The KPI SQL uses `COUNT(DISTINCT pee.id) FILTER (WHERE pee_enroll.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED')` to prevent duplicate counting when an employee has multiple enrollment records.

> 🔁 **Updated** — Enrollment status literal corrected to `EMPLOYEE_ENROLLMENT_STATUS_ENROLLED` per TRD §5.

---

## 10. API Test Cases

---

### TC-API-001 — GET /employees Without Auth Token Returns 401

**Category:** API
**Priority:** Critical
**Preconditions:** None.
**Test Data:** `GET /hr/employee-support/employees` — no Authorization header.

**Test Steps:**
1. Send the request without any Authorization header.
2. Observe the HTTP status code and response body.

**Expected Result:** HTTP 401. Response body follows the standard `createErrorResponse` envelope. No employee data is returned. The response does not reveal implementation details.

---

### TC-API-002 — GET /employees With Valid HR_ADMIN JWT Returns 200 With Expected Shape

**Category:** API
**Priority:** Critical
**Preconditions:** HR Admin JWT is valid and not expired.
**Test Data:** `GET /hr/employee-support/employees?page=1&limit=25`. Company has 50 employees.

**Test Steps:**
1. Send the request with a valid HR_ADMIN JWT.
2. Inspect the full response envelope.

**Expected Result:** HTTP 200. Response body: `{ statusCode: 200, message: "Employees fetched successfully.", data: { rows: [...], count: 50 } }`. Each row in `rows` contains at minimum: `employeeId`, `companyEmployeeId`, `employeeName`, `email` (raw value or null), `status`, `enrollmentStatus`, `additionalParams`. The `hasEmail` boolean field is NOT present (the `IS NOT NULL AS "hasEmail"` pattern was removed per TRD §4.3 2026-05-06 note). `count` is the total number of employees for the company.

> 🔁 **Updated** — Removed `hasEmail` from expected response shape per TRD §4.3 2026-05-06 note.

---

### TC-API-003 — GET /employees With Non-HR-Admin JWT Returns 403

**Category:** API
**Priority:** Critical
**Preconditions:** Valid JWT with a role other than HR_ADMIN.
**Test Data:** `GET /hr/employee-support/employees` with JWT `user_type_key = EMPLOYEE`.

**Test Steps:**
1. Send the request with the non-HR-Admin JWT.
2. Observe the response.

**Expected Result:** HTTP 403. Standard error envelope. No employee data is present in the response. The `RolesGuard` fires before any service logic.

---

### TC-API-004 — POST /send-email With Valid Payload Returns 200

**Category:** API
**Priority:** Critical
**Preconditions:** HR Admin JWT valid. Employee 1042 is Active with email on file. `HR_WELCOME` template configured.
**Test Data:** `POST /hr/employee-support/employees/1042/send-email` body: `{ "actionType": "WELCOME_EMAIL" }`.

**Test Steps:**
1. Send the POST request.
2. Inspect the response.

**Expected Result:** HTTP 200. Response: `{ statusCode: 200, message: "Email dispatched successfully.", data: { actionType: "WELCOME_EMAIL", employeeId: 1042 } }`. The notification service received the dispatch. An audit log entry is created.

---

### TC-API-005 — POST /send-email With Missing actionType Returns 400

**Category:** API
**Priority:** High
**Preconditions:** HR Admin JWT valid. Employee 1042 is Active with email.
**Test Data:** `POST /hr/employee-support/employees/1042/send-email` body: `{}`.

**Test Steps:**
1. Send the POST request with an empty body.
2. Observe the response.

**Expected Result:** HTTP 400. The DTO validation layer rejects the request before the service is called. Error message references the missing `actionType` field. No notification service call is made.

---

### TC-API-006 — POST /send-email With Invalid actionType String Returns 400

**Category:** API
**Priority:** High
**Preconditions:** HR Admin JWT valid. Employee 1042 Active.
**Test Data:** `POST /hr/employee-support/employees/1042/send-email` body: `{ "actionType": "SEND_GIFT_CARD" }`.

**Test Steps:**
1. Send the POST request with an unrecognised `actionType` value.
2. Observe the response.

**Expected Result:** HTTP 400. The service (or DTO) rejects the unrecognised action type. No template lookup is attempted. No dispatch to the notification service. Error envelope describes the invalid action type.

---

### TC-API-007 — POST /deactivate With Non-HR-Admin Role Returns 403

**Category:** API
**Priority:** Critical
**Preconditions:** Valid JWT with role HR_VIEWER.
**Test Data:** `POST /hr/employee-support/employees/1042/deactivate`. No request body.

**Test Steps:**
1. Send the POST request with the HR_VIEWER JWT.
2. Observe the response.

**Expected Result:** HTTP 403 from the `RolesGuard`. Message: "Deactivation requires HR Administrator role." No database change occurs. No audit log entry is written.

---

### TC-API-008 — POST /deactivate For Already Inactive Employee Returns 400

🔁 **Updated** — Status literal corrected to `USER_STATUS_INACTIVE` per TRD §5.

**Category:** API
**Priority:** High
**Preconditions:** HR Admin JWT valid. Employee 4001 has `users.user_status_key = 'USER_STATUS_INACTIVE'`.
**Test Data:** `POST /hr/employee-support/employees/4001/deactivate`.

**Test Steps:**
1. Send the POST request.
2. Observe the response code and message.

**Expected Result:** HTTP 400. Message: "Employee is already inactive." No UPDATE is executed on `users`. No audit log entry is written. Response uses the standard error envelope.

---

### TC-API-009 — GET /filter-metadata Returns 200 With data.filters Array

**Category:** API
**Priority:** High
**Preconditions:** HR Admin JWT valid. Company has two policy parameters configured.
**Test Data:** `GET /hr/employee-support/filter-metadata`.

**Test Steps:**
1. Send the GET request.
2. Inspect `data.filters`.

**Expected Result:** HTTP 200. Response: `{ statusCode: 200, message: "Filter metadata fetched successfully.", data: { filters: [...] } }`. The `filters` array always contains `status` and `enrollmentStatus` as the first two entries, followed by policy-derived parameters. Each filter object has at minimum: `name`, `displayName`, `type`. Select-type filters include `options`.

---

### TC-API-010 — POST /report/generate/emp_support_kpi_summary Returns 201 With data.rows[0]

**Category:** API
**Priority:** Critical
**Preconditions:** HR Admin JWT valid. `emp_support_kpi_summary` report is seeded in `admin_reports`.
**Test Data:** `POST /hr/report/generate/emp_support_kpi_summary` body: `{ "companyId": 101 }`.

**Test Steps:**
1. Send the POST request.
2. Inspect the full response envelope.
3. Read `data.rows[0]`.

**Expected Result:** HTTP 201. Envelope: `{ statusCode: 201, message: "Report generated successfully.", data: { rows: [{ totalEmployees, activeEmployees, inactiveEmployees, enrolledEmployees, notEnrolledEmployees }], count: 1 } }`. All five keys present in `data.rows[0]` as non-negative integers. `count` is exactly 1 (single-row aggregate report).

---

### TC-API-011 — GET /employees With limit Exceeding 100 Returns 400

**Category:** API
**Priority:** Medium
**Preconditions:** HR Admin JWT valid.
**Test Data:** `GET /hr/employee-support/employees?page=1&limit=500`.

**Test Steps:**
1. Send the request with `limit=500`.
2. Observe the response.

**Expected Result:** HTTP 400. The query parameter validation layer rejects the request because 500 exceeds the maximum allowed limit of 100. Error message indicates the allowed range. No database query with limit 500 is executed.

---

### TC-API-012 — POST /employees Wrong HTTP Method Returns 405

**Category:** API
**Priority:** Medium
**Preconditions:** HR Admin JWT valid.
**Test Data:** `POST /hr/employee-support/employees` (the listing endpoint expects GET, not POST).

**Test Steps:**
1. Send a POST request to the employee listing endpoint.
2. Observe the response code.

**Expected Result:** HTTP 405 Method Not Allowed. The framework rejects the incorrect HTTP method before any controller logic runs. An appropriate error response is returned. The response does not expose internal routing information.

---

*End of Test Case Suite — employeesupport*

---

**Document Maintenance Note:**
If the PRD, SDS, or TRD is updated, identify affected sections and:
- Update test cases whose preconditions, steps, or expected results are invalidated.
- Add new test cases for newly introduced requirements.
- Remove test cases for descoped features.
- Tag all changed test cases with 🔁 **Updated** and a one-line note stating what changed and why.
