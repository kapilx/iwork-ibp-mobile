# usermanagement — Test Case Suite

**Module:** HR Portal — User Management
**Jira Reference:** IIRM-10416
**Document Version:** 1.1
**Date:** 2026-05-08
**Source Documents:** PRD v1.0 (updated) · SDS v1.0 (updated) · TRD v1.0 (updated)

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
| TC-FUNC-001 | User List Renders All Columns for a Company | Functional | Critical | — |
| TC-FUNC-002 | Active User Row Shows Blank Inactive Date and Reason | Functional | Critical | — |
| TC-FUNC-003 | Inactive User Row Shows Populated Inactive Date and Reason | Functional | Critical | — |
| TC-FUNC-004 | Empty State Shown When No Users Provisioned for Company | Functional | High | — |
| TC-FUNC-005 | Real-Time Search by Name Filters User List | Functional | High | — |
| TC-FUNC-006 | Real-Time Search by Email Filters User List | Functional | High | — |
| TC-FUNC-007 | Create Non-Employee User — Happy Path | Functional | Critical | — |
| TC-FUNC-008 | Create Non-Employee User With All Policies Scope | Functional | Critical | — |
| TC-FUNC-009 | Create Non-Employee User from Policy-Level Entry (Policy Field Locked) | Functional | Critical | — |
| TC-FUNC-010 | Portal-Access Email Sent on Non-Employee User Creation | Functional | Critical | — |
| TC-FUNC-011 | Assign Existing Employee to HR Role — Happy Path | Functional | Critical | — |
| TC-FUNC-012 | Two Emails Sent When Employee Assigned HR Role for First Time | Functional | Critical | — |
| TC-FUNC-013 | One Email Sent When Previously Onboarded Employee Assigned HR Role | Functional | Critical | — |
| TC-FUNC-014 | Policy Field Pre-Populated and Locked on Policy-Level Entry | Functional | High | — |
| TC-FUNC-015 | Policy-Level Entry Expands to Company-Level Edit for Additional Policies | Functional | High | — |
| TC-FUNC-016 | All Policies Auto-Extension When New Policy Added to Company | Functional | Critical | — |
| TC-FUNC-017 | Specific Policies User Does Not Auto-Gain New Policy | Functional | High | — |
| TC-FUNC-018 | Edit User Role (Pre-Activation) — All Fields Editable | Functional | High | — |
| TC-FUNC-019 | Edit User Role (Post-Activation) — Only Role and Policy Editable | Functional | High | — |
| TC-FUNC-020 | Role Change Takes Effect on Next Navigation Without Session Termination | Functional | High | — |
| TC-FUNC-021 | Reduce Policy Access — Immediate Effect on User Session | Functional | Critical | — |
| TC-FUNC-022 | Expand Policy Access — Effect on Next Navigation or Refresh | Functional | High | — |
| TC-FUNC-023 | Email Change (Pre-Activation) Sends Fresh Invitation and Invalidates Old Link | Functional | Critical | — |
| TC-FUNC-024 | Deactivate User — Session Terminated Immediately | Functional | Critical | — |
| TC-FUNC-025 | Reactivate User With Valid Role — Prior Role and Policy Restored | Functional | Critical | — |
| TC-FUNC-026 | Deactivated User Cannot Log In | Functional | Critical | — |
| TC-FUNC-027 | Add New Role — Role Appears in Creation Dropdown | Functional | High | — |
| TC-FUNC-028 | Edit Role Name — All Assigned Users Reflect New Name Immediately | Functional | High | — |
| TC-FUNC-029 | Delete Role With No Assigned Users — Succeeds | Functional | Medium | — |
| TC-FUNC-030 | Send Password Reset Email — CRM Admin Triggered | Functional | High | — |
| TC-FUNC-031 | Password Reset Email Targets Company-Context Email Only | Functional | High | — |
| TC-FUNC-032 | Multi-Company Non-Employee User — Same Identity Linked to Second Company | Functional | High | — |
| TC-FUNC-033 | Company Selector Loads All IBP-Enabled Companies | Functional | High | — |
| TC-FUNC-034 | Tab Bar Appears After Company Selection | Functional | Medium | — |
| TC-FUNC-035 | Add User Button Opens User Type Selection Modal | Functional | High | — |
| TC-EDGE-001 | User With More Than Two Policies Shows +N More Chip | Edge | Medium | — |
| TC-EDGE-002 | Reactivate User Whose Role Was Deleted — Blocked Without Replacement | Edge | Critical | — |
| TC-EDGE-003 | Reactivate User Whose Role Was Deleted — Succeeds With Valid Replacement | Edge | Critical | — |
| TC-EDGE-004 | All Policies User When Policy Removed From Company | Edge | High | — |
| TC-EDGE-005 | Switch User From All Policies to Specific Subset — Auto-Extension Stops | Edge | High | — |
| TC-EDGE-006 | Email Change to Corrected Address Just Before Activation | Edge | High | — |
| TC-EDGE-007 | Deactivated Employee Also Holds HR Role — Both Revoked Simultaneously | Edge | High | — |
| TC-EDGE-008 | Role With No Dimensions Available (No Approved Policy Config) | Edge | High | — |
| TC-EDGE-009 | Company With Exactly 5,000 Users — Listing Loads Successfully | Edge | High | — |
| TC-EDGE-010 | Policy Removed From Company After User Was Created for It | Edge | High | — |
| TC-EDGE-011 | Non-Employee User Assigned to Multiple Companies With Different Emails | Edge | Medium | — |
| TC-EDGE-012 | auth-service Session Termination Times Out at 2-Second Threshold | Edge | High | — |
| TC-EDGE-013 | Pending Activation User Appears in List With Amber Badge | Edge | Medium | — |
| TC-EDGE-014 | Role Renamed While a User Holds That Role — User List Reflects New Name | Edge | Medium | — |
| TC-EDGE-015 | Inactive User Counted in Role Deletion Guard | Edge | High | — |
| TC-NEG-001 | Create User With Empty Required Fields — Inline Validation Errors Shown | Negative | Critical | — |
| TC-NEG-002 | Create User With Invalid Email Format — Inline Error Shown | Negative | High | — |
| TC-NEG-003 | Create Non-Employee With Duplicate Identity (Same Name + Email + Phone) | Negative | Critical | — |
| TC-NEG-004 | Create User When Selected Policy Config Is Not Approved — Blocked | Negative | Critical | — |
| TC-NEG-005 | Assign Not-Yet-Activated Employee — Assignment Disabled | Negative | Critical | — |
| TC-NEG-006 | Delete Role With Active Users Assigned — Blocked | Negative | Critical | — |
| TC-NEG-007 | Delete Role With Only Inactive Users Assigned — Still Blocked | Negative | High | — |
| TC-NEG-008 | Create Role With Duplicate Name Within Same Company — Rejected | Negative | High | — |
| TC-NEG-009 | Deactivate User Without Providing Inactive Reason — Confirm Button Disabled | Negative | Critical | — |
| TC-NEG-010 | Reactivate User With Deleted Role and No Replacement Provided — 422 | Negative | High | — |
| TC-NEG-011 | Edit Contact Info After Account Activation — Fields Are Read-Only | Negative | High | — |
| TC-NEG-012 | Create User for Policy With Pending Configuration (Policy-Level Entry) — Blocked | Negative | High | — |
| TC-NEG-013 | Create Role Without Selecting Any Policy Type — Form Rejects | Negative | Medium | — |
| TC-NEG-014 | Create Role Without Selecting Any Access Dimension — Form Rejects | Negative | Medium | — |
| TC-NEG-015 | Search With No Matching Results — Empty Filtered State Shown | Negative | Medium | — |
| TC-SEC-001 | Unauthenticated Request to Any Write Endpoint Returns 401 | Security | Critical | — |
| TC-SEC-002 | Expired JWT Returns 401 on All Endpoints | Security | Critical | — |
| TC-SEC-003 | Non-CRM_ADMIN Role Returns 403 on All Write Endpoints | Security | Critical | — |
| TC-SEC-004 | CRM Admin Cannot Access Another Company's Users | Security | Critical | — |
| TC-SEC-005 | SQL Injection Attempt in Search Field Is Neutralized | Security | Critical | — |
| TC-SEC-006 | XSS Payload in Full Name Field Is Escaped on Render | Security | High | — |
| TC-SEC-007 | Deactivated Admin Cannot Create or Edit Users | Security | Critical | — |
| TC-SEC-008 | Session Terminated Immediately on User Deactivation | Security | Critical | — |
| TC-SEC-009 | Password Reset Email Restricted to Company-Context Email — No Cross-Company Leak | Security | High | — |
| TC-SEC-010 | companyId in Path Validated Against Admin's Authorized Companies | Security | Critical | — |
| TC-SEC-011 | Soft-Delete Enforced — No Hard DELETE Statement Reachable | Security | High | — |
| TC-SEC-012 | IDOR — CRM Admin Cannot Access User Records From Unauthorized Company | Security | Critical | — |
| TC-PERF-001 | User List Loads Within 2 Seconds for Company With 5,000 Users | Performance | High | — |
| TC-PERF-002 | Search Filter Debounce Fires After 300ms — Result Arrives Within 1 Second | Performance | High | — |
| TC-PERF-003 | Deactivation Commits Within 3 Seconds End-to-End | Performance | High | — |
| TC-PERF-004 | Password Reset Email Dispatched Within 3 Seconds | Performance | High | — |
| TC-PERF-005 | Concurrent User Creation Requests Do Not Produce Duplicate Records | Performance | High | — |
| TC-PERF-006 | auth-service Timeout (2 s) During Deactivation Returns 503 Without DB Write | Performance | Critical | — |
| TC-INT-001 | Policy Configuration Approval Gate Called Synchronously on Every Create | Integration | Critical | — |
| TC-INT-002 | auth-service Unreachable During Deactivation — 503, No DB Write | Integration | Critical | — |
| TC-INT-003 | auth-service Account Creation Called on Non-Employee User Creation | Integration | Critical | — |
| TC-INT-004 | Portal-Access Invitation Dispatched via auth-service on Creation | Integration | Critical | — |
| TC-INT-005 | Policy Module Event: New Policy Added — All-Policies User Auto-Extends | Integration | High | — |
| TC-INT-006 | Policy Module Event: Policy Removed — CRM Admin Receives Email Notification | Integration | High | — |
| TC-INT-007 | auth-service Fails During Pre-Activation Email Change — DB Rolled Back | Integration | Critical | — |
| TC-INT-008 | Dual-Role Email Dispatch Sequence Correct via auth-service | Integration | High | 🔁 Updated |
| TC-INT-009 | Employee Records Consumed Read-Only From ibp-service Inception Process | Integration | High | — |
| TC-INT-010 | Policy Configuration Module Exposes Approval Status Per Policy Correctly | Integration | High | — |
| TC-ACC-001 | Full Keyboard Navigation Through User List Table | Accessibility | High | — |
| TC-ACC-002 | Status Badges Announced Correctly by Screen Readers | Accessibility | High | — |
| TC-ACC-003 | Inline Validation Errors Announced by Screen Reader on Submit | Accessibility | High | — |
| TC-ACC-004 | Deactivation Modal Accessible via Keyboard Only | Accessibility | High | — |
| TC-ACC-005 | Color Contrast on Status Badges Meets WCAG AA | Accessibility | Medium | — |
| TC-ACC-006 | Responsive Layout — Module Usable on Tablet-Width Viewport | Accessibility | Medium | — |
| TC-ACC-007 | Role Deletion Blocking Modal Announces Count to Screen Reader | Accessibility | Medium | — |
| TC-REG-001 | Company Selector Pre-Selected and Read-Only When Entering from IBP Portal Config | Regression | Critical | — |
| TC-REG-002 | Policy Field Locked in All Forms When Entering From Policy Context | Regression | Critical | — |
| TC-REG-003 | User List Refreshes After New User Is Created | Regression | High | — |
| TC-REG-004 | Toast Notification Appears on Successful User Creation | Regression | High | — |
| TC-REG-005 | Inactive Date and Reason Cleared When User Is Reactivated | Regression | High | — |
| TC-REG-006 | Password Reset Timestamp Visible on User Record After Successful Send | Regression | High | — |
| TC-REG-007 | New Role Immediately Available in Creation Dropdown After Save | Regression | High | — |
| TC-REG-008 | Switching Company in Standalone View Resets All Context | Regression | Medium | — |
| TC-REG-009 | Back Navigation From Add User Form Preserves Company and Policy Context | Regression | Medium | — |
| TC-REG-010 | Email Delivery Failure Indicator Appears on User Record Row | Regression | High | — |
| TC-DATA-001 | ibp_company_user Has Exactly One of portal_user_id or employee_id Set | Data Integrity | Critical | — |
| TC-DATA-002 | deactivation_reason Non-Null When status = inactive | Data Integrity | Critical | — |
| TC-DATA-003 | all_policies = TRUE User Has No ibp_user_policy_mapping Rows | Data Integrity | High | — |
| TC-DATA-004 | Switching to All Policies Deletes Existing ibp_user_policy_mapping Rows | Data Integrity | High | — |
| TC-DATA-005 | Duplicate Email Within Same Company Blocked by DB Unique Constraint | Data Integrity | Critical | — |
| TC-DATA-006 | Role Deletion Blocked at Application Layer When Assigned Users Exist | Data Integrity | Critical | — |
| TC-DATA-007 | Role Name Uniqueness Within Company Enforced | Data Integrity | High | — |
| TC-DATA-008 | Deactivation Sets deactivated_at, deactivated_by, deactivation_reason Atomically | Data Integrity | High | — |
| TC-DATA-009 | Soft Delete — deleted_at Set, Record Never Removed From DB | Data Integrity | Critical | — |
| TC-DATA-010 | All Queries Include deleted_at IS NULL Filter on Every Joined Table | Data Integrity | Critical | — |
| TC-API-001 | GET /companies Returns 200 With IBP-Enabled Company List | API | High | — |
| TC-API-002 | POST /users — 201 Happy Path Non-Employee Creation | API | Critical | — |
| TC-API-003 | POST /users — 409 Duplicate Identity Within Company | API | Critical | — |
| TC-API-004 | POST /users — 422 Policy Config Not Approved | API | Critical | — |
| TC-API-005 | POST /users/assign — 422 Employee Not Yet Activated | API | Critical | — |
| TC-API-006 | PATCH /users/:id — Pre-Activation: All Fields Accepted | API | High | — |
| TC-API-007 | PATCH /users/:id — Post-Activation: Contact Fields Silently Ignored | API | High | — |
| TC-API-008 | POST /deactivate — 503 When auth-service Unreachable | API | Critical | — |
| TC-API-009 | POST /activate — 422 Deleted Role With No Replacement | API | High | — |
| TC-API-010 | DELETE /roles/:id — 409 Role Assigned to Users | API | High | — |
| TC-API-011 | DELETE /roles/:id — 200 Role With No Assigned Users | API | Medium | — |
| TC-API-012 | Missing Authorization Header Returns 401 | API | Critical | — |
| TC-API-013 | Wrong HTTP Method on Endpoint Returns 405 | API | Medium | — |
| TC-API-014 | Malformed JSON Payload Returns 400 | API | Medium | — |
| TC-API-015 | GET /employees?q= — Minimum 2 Characters Before Search Fires | API | Medium | — |
| TC-API-016 | POST /reset-password — 502 When Email Delivery Fails | API | High | — |
| TC-API-017 | GET /roles — 200 With usersAssigned Count Including Inactive Users | API | High | — |
| TC-API-018 | POST /roles — 409 Duplicate Role Name Within Company | API | High | — |

---

## 1. Functional Test Cases

### TC-FUNC-001 — User List Renders All Columns for a Company

**Category:** Functional
**Priority:** Critical
**Preconditions:** CRM Admin is logged in. Company "TCS" has IBP Portal access and has at least two provisioned users (one active, one inactive).
**Test Data:** Company = TCS; users include an active non-employee and a deactivated employee.

**Test Steps:**
1. Navigate to iWork → Admin Module → IBP User Management.
2. Select "TCS" from the company dropdown.
3. Observe the user list table.

**Expected Result:** Table renders with all nine columns visible: Name, Email, Role, Policy Access, Status, Date Added, Inactive Date, Inactive Reason, and Actions ("…" menu).

---

### TC-FUNC-002 — Active User Row Shows Blank Inactive Date and Reason

**Category:** Functional
**Priority:** Critical
**Preconditions:** CRM Admin is logged in. Company has at least one active user.
**Test Data:** Active user "Ramesh Kumar" with status = active.

**Test Steps:**
1. Open User Management for the company.
2. Locate the active user row.
3. Observe the Inactive Date and Inactive Reason columns.

**Expected Result:** Both Inactive Date and Inactive Reason cells display "—".

---

### TC-FUNC-003 — Inactive User Row Shows Populated Inactive Date and Reason

**Category:** Functional
**Priority:** Critical
**Preconditions:** At least one user has been deactivated with reason "Contract ended".
**Test Data:** Deactivated user "Priya Sharma"; reason = "Contract ended"; deactivated_at = 2026-04-10.

**Test Steps:**
1. Open User Management for the company.
2. Locate the inactive user row.
3. Observe Inactive Date and Inactive Reason columns.

**Expected Result:** Inactive Date shows "10 Apr 2026" and Inactive Reason shows "Contract ended". Status badge shows "Inactive" in red.

---

### TC-FUNC-004 — Empty State Shown When No Users Provisioned for Company

**Category:** Functional
**Priority:** High
**Preconditions:** CRM Admin is logged in. Company "NewCorp" has IBP Portal access but zero provisioned HR Portal users.
**Test Data:** Company = NewCorp.

**Test Steps:**
1. Open User Management and select "NewCorp".
2. Observe the Users tab content.

**Expected Result:** Empty state message "No users have been added yet." is displayed with an "Add First User" CTA button that behaves identically to the "Add User" button.

---

### TC-FUNC-005 — Real-Time Search by Name Filters User List

**Category:** Functional
**Priority:** High
**Preconditions:** Company has multiple users including "Amit Verma" and "Anita Roy".
**Test Data:** Search input = "Amit".

**Test Steps:**
1. Open User Management and select the company.
2. Type "Amit" in the search input.
3. Observe the list without pressing Enter.

**Expected Result:** List filters in real time to show only users whose name contains "Amit" (case-insensitive, partial match). No full page reload occurs.

---

### TC-FUNC-006 — Real-Time Search by Email Filters User List

**Category:** Functional
**Priority:** High
**Preconditions:** Company has users with emails including "amit@tcs.com" and "anita@tcs.com".
**Test Data:** Search input = "amit@".

**Test Steps:**
1. Open User Management and select the company.
2. Type "amit@" in the search input.
3. Observe the list.

**Expected Result:** List filters to show only users whose email contains "amit@". Record count updates to reflect filtered results.

---

### TC-FUNC-007 — Create Non-Employee User — Happy Path

**Category:** Functional
**Priority:** Critical
**Preconditions:** CRM Admin is logged in. Company "TCS" has at least one active role. GMC policy has an approved configuration.
**Test Data:** Full Name = "Suresh Consultant"; Email = "suresh@ext.com"; Phone = "9988776655"; Role = "HR Consultant"; Policy Access = GMC only.

**Test Steps:**
1. Open User Management for TCS.
2. Click "Add User" → select "Create Non-Employee User".
3. Fill in all required fields with the provided test data.
4. Click Submit.

**Expected Result:** Account created with status `pending_activation`. Admin is returned to user list. Toast: "User created. An access invitation has been sent to suresh@ext.com." New user row appears in the list.

---

### TC-FUNC-008 — Create Non-Employee User With All Policies Scope

**Category:** Functional
**Priority:** Critical
**Preconditions:** CRM Admin logged in. TCS has three policies (GMC, GPA, GTL), all with approved configurations.
**Test Data:** Full Name = "Preet HR"; Email = "preet@hr.com"; Role = "HR Manager"; Policy Access = "All Policies" toggle selected.

**Test Steps:**
1. Open Add User form (non-employee path) for TCS.
2. Fill all required fields and toggle "All Policies".
3. Submit the form.

**Expected Result:** User created. `ibp_company_user.all_policies = TRUE`. No rows inserted in `ibp_user_policy_mapping` for this user. Policy Access column shows "All Policies" in the user list.

---

### TC-FUNC-009 — Create Non-Employee User from Policy-Level Entry (Policy Field Locked)

**Category:** Functional
**Priority:** Critical
**Preconditions:** CRM Admin is in the GMC policy context within TCS. GMC has an approved configuration.
**Test Data:** Entry from GMC policy context.

**Test Steps:**
1. Navigate to TCS → Policies → GMC → User Management.
2. Click "Add User" → select "Create Non-Employee User".
3. Observe the policy field in the form.
4. Attempt to change the policy field.

**Expected Result:** Policy field shows "GMC" as a read-only label. The multi-select Policy Access field is hidden. The field cannot be changed. On submit, the user is created with access to GMC only.

---

### TC-FUNC-010 — Portal-Access Email Sent on Non-Employee User Creation

**Category:** Functional
**Priority:** Critical
**Preconditions:** Non-employee user successfully created.
**Test Data:** User = "Suresh Consultant"; email = "suresh@ext.com"; company auth method = username/password.

**Test Steps:**
1. Create a non-employee user (refer TC-FUNC-007).
2. Check the email received at "suresh@ext.com".

**Expected Result:** Exactly one email received. Subject references "HR Portal access". Email body contains login instructions per the company's authentication method. Email contains no policy benefit, coverage, claims, or premium content.

---

### TC-FUNC-011 — Assign Existing Employee to HR Role — Happy Path

**Category:** Functional
**Priority:** Critical
**Preconditions:** Employee "Arun Singh" has an active IBP account at TCS. GMC has approved configuration.
**Test Data:** Employee = "Arun Singh" (employee ID: EMP001); Role = "HR Manager"; Policy Access = GMC.

**Test Steps:**
1. Open User Management for TCS.
2. Click "Add User" → select "Assign Existing Employee".
3. Search for "Arun Singh" — select his record.
4. Configure Role = "HR Manager" and Policy Access = GMC.
5. Submit.

**Expected Result:** HR role assigned to Arun's existing account. Toast: "HR access granted to Arun Singh." Arun appears in the user list. His name and email in the form were pre-filled and read-only.

---

### TC-FUNC-012 — Two Emails Sent When Employee Assigned HR Role for First Time

**Category:** Functional
**Priority:** Critical
**Preconditions:** Employee "Arun Singh" has never been assigned an HR role before (no prior onboarding email sent).
**Test Data:** Employee = "Arun Singh"; first-time HR assignment.

**Test Steps:**
1. Assign Arun to an HR role (refer TC-FUNC-011).
2. Check emails received at Arun's registered email.

**Expected Result:** Two separate emails arrive: (1) HR portal-access email with independent subject referencing HR Portal; (2) Standard employee onboarding email (existing template). The two emails have distinct subjects and bodies and are never merged.

---

### TC-FUNC-013 — One Email Sent When Previously Onboarded Employee Assigned HR Role

**Category:** Functional
**Priority:** Critical
**Preconditions:** Employee "Kavya Nair" was onboarded previously (employee onboarding email already sent). She is now being assigned an HR role for the first time.
**Test Data:** Employee = "Kavya Nair"; previously_onboarded = true.

**Test Steps:**
1. Assign Kavya to an HR role.
2. Check emails received.

**Expected Result:** Only one email received — the HR portal-access email. The employee onboarding email is not resent.

---

### TC-FUNC-014 — Policy Field Pre-Populated and Locked on Policy-Level Entry

**Category:** Functional
**Priority:** High
**Preconditions:** CRM Admin navigates to User Management from within the GPA policy screen of TCS.
**Test Data:** Source policy = GPA.

**Test Steps:**
1. Open GPA policy within TCS → open User Management.
2. Click "Add User" → choose either user type.
3. Inspect the policy field.

**Expected Result:** Policy field shows "GPA" and is disabled. Admin cannot deselect or change it during this creation flow.

---

### TC-FUNC-015 — Policy-Level Entry Expands to Company-Level Edit for Additional Policies

**Category:** Functional
**Priority:** High
**Preconditions:** User "Suresh" was created via GMC policy-level entry and has access to GMC only.
**Test Data:** User = "Suresh Consultant".

**Test Steps:**
1. Navigate to TCS company-level User Management.
2. Locate "Suresh Consultant" and click Edit.
3. Observe the Policy Access field.

**Expected Result:** Policy Access field is fully editable at company level. Admin can add GPA, GTL, or switch to "All Policies".

---

### TC-FUNC-016 — All Policies Auto-Extension When New Policy Added to Company

**Category:** Functional
**Priority:** Critical
**Preconditions:** User "Preet HR" has `all_policies = TRUE` at TCS. TCS currently has GMC and GPA.
**Test Data:** New policy GTL added to TCS.

**Test Steps:**
1. Confirm "Preet HR" has "All Policies" access.
2. Add GTL policy to TCS (via Policy module).
3. Log in as Preet HR and observe accessible policies.

**Expected Result:** Preet HR automatically has access to GTL without any admin action. No manual update to the user record was required.

---

### TC-FUNC-017 — Specific Policies User Does Not Auto-Gain New Policy

**Category:** Functional
**Priority:** High
**Preconditions:** User "Ravi HR" has specific access to GMC only at TCS. TCS has GMC and GPA.
**Test Data:** New policy GTL added to TCS.

**Test Steps:**
1. Confirm "Ravi HR" has only GMC access (specific, not All Policies).
2. Add GTL policy to TCS.
3. Check Ravi's user record.

**Expected Result:** Ravi HR's policy access remains GMC only. GTL is not automatically added. No `ibp_user_policy_mapping` row for GTL is created for Ravi.

---

### TC-FUNC-018 — Edit User Role (Pre-Activation) — All Fields Editable

**Category:** Functional
**Priority:** High
**Preconditions:** User "Deepa Ext" has status = `pending_activation` (has not yet set a password).
**Test Data:** User = "Deepa Ext"; status = pending_activation.

**Test Steps:**
1. Open User Management, locate "Deepa Ext", click Edit.
2. Observe the form.
3. Change Full Name to "Deepa External", Role to another available role, and Policy Access.
4. Save.

**Expected Result:** All fields (Full Name, Email, Phone, Role, Policy Access) are editable. Contextual note at form top reads: "This user has not yet set a password. All fields are editable." Changes save successfully.

---

### TC-FUNC-019 — Edit User Role (Post-Activation) — Only Role and Policy Editable

**Category:** Functional
**Priority:** High
**Preconditions:** User "Suresh Consultant" has status = `active` (has set a password).
**Test Data:** User = "Suresh Consultant"; status = active.

**Test Steps:**
1. Open edit form for "Suresh Consultant".
2. Attempt to modify Full Name, Email, Phone.
3. Modify Role and Policy Access.
4. Save.

**Expected Result:** Full Name, Email, and Phone are read-only. Role and Policy Access are editable and saved successfully. Contextual note reads: "Contact information is locked after account activation. Only role and policy access can be changed."

---

### TC-FUNC-020 — Role Change Takes Effect on Next Navigation Without Session Termination

**Category:** Functional
**Priority:** High
**Preconditions:** User "Suresh" is actively browsing the HR Portal. CRM Admin changes his role.
**Test Data:** Role changed from "HR Consultant" to "HR Manager".

**Test Steps:**
1. CRM Admin opens Suresh's edit form and changes his role to "HR Manager".
2. Saves without terminating Suresh's session.
3. Suresh navigates to the next page within his active session.

**Expected Result:** Suresh's new role permissions apply on his next server round-trip. His session is not terminated and he is not prompted to log out.

---

### TC-FUNC-021 — Reduce Policy Access — Immediate Effect on User Session

**Category:** Functional
**Priority:** Critical
**Preconditions:** User "Suresh" has access to GMC and GPA. He is actively browsing GPA data.
**Test Data:** Remove GPA from Suresh's policy access.

**Test Steps:**
1. CRM Admin opens Suresh's edit form and removes GPA from his policy access.
2. Saves.
3. Suresh attempts to access GPA-scoped data.

**Expected Result:** Suresh immediately loses access to GPA, including any active session data scoped to GPA. GMC access remains intact.

---

### TC-FUNC-022 — Expand Policy Access — Effect on Next Navigation or Refresh

**Category:** Functional
**Priority:** High
**Preconditions:** User "Suresh" has access to GMC only.
**Test Data:** Add GPA to Suresh's policy access.

**Test Steps:**
1. CRM Admin adds GPA to Suresh's policy access and saves.
2. Suresh navigates to a new page or refreshes his session.

**Expected Result:** Suresh gains access to GPA upon his next navigation or session refresh. No immediate session termination required.

---

### TC-FUNC-023 — Email Change (Pre-Activation) Sends Fresh Invitation and Invalidates Old Link

**Category:** Functional
**Priority:** Critical
**Preconditions:** User "Deepa Ext" was created with email "deepa@acme.con" (typo), status = `pending_activation`. An invitation was already sent.
**Test Data:** Old email = "deepa@acme.con"; new email = "deepa@acme.com".

**Test Steps:**
1. Open edit form for "Deepa Ext".
2. Change Email to "deepa@acme.com".
3. Save.
4. Attempt to use the original invitation link.

**Expected Result:** Login identity updated to "deepa@acme.com". Old invitation link is invalidated. A fresh portal-access invitation is automatically sent to "deepa@acme.com". Toast: "Email updated. A new access invitation has been sent to deepa@acme.com."

---

### TC-FUNC-024 — Deactivate User — Session Terminated Immediately

**Category:** Functional
**Priority:** Critical
**Preconditions:** User "Priya HR" is actively browsing the HR Portal (active session).
**Test Data:** Inactive Reason = "Contract terminated".

**Test Steps:**
1. CRM Admin opens "…" menu for Priya HR → clicks "Deactivate".
2. Enters reason "Contract terminated" in the modal.
3. Clicks "Deactivate" (red confirm button).
4. Observe Priya's session within seconds.

**Expected Result:** Priya's session terminates within seconds. She is redirected to the login screen. User list row updates: Status = Inactive, Inactive Date = today, Inactive Reason = "Contract terminated". Toast: "User deactivated. Their session has been terminated."

---

### TC-FUNC-025 — Reactivate User With Valid Role — Prior Role and Policy Restored

**Category:** Functional
**Priority:** Critical
**Preconditions:** User "Priya HR" is inactive. Her previously assigned role "HR Manager" still exists.
**Test Data:** User = "Priya HR"; prior role = "HR Manager"; prior policies = GMC.

**Test Steps:**
1. Open "…" menu for Priya HR (inactive) → click "Activate".
2. Confirm the direct reactivation (no modal shown for valid role).

**Expected Result:** Priya's account is reinstated with the same role "HR Manager" and GMC policy access. Status changes to Active. Inactive Date and Inactive Reason are cleared. No reconfiguration required.

---

### TC-FUNC-026 — Deactivated User Cannot Log In

**Category:** Functional
**Priority:** Critical
**Preconditions:** User "Priya HR" has been deactivated.
**Test Data:** Priya's login credentials.

**Test Steps:**
1. Attempt to log in to the HR Portal as Priya HR.
2. Enter valid credentials.

**Expected Result:** Login is rejected. Message displayed: "Your account is inactive. Please contact your administrator." No session is created.

---

### TC-FUNC-027 — Add New Role — Role Appears in Creation Dropdown

**Category:** Functional
**Priority:** High
**Preconditions:** CRM Admin is on the Roles tab for TCS. At least one policy has an approved configuration.
**Test Data:** Role Name = "Senior HR Lead"; Policy Type = Both; Dimensions = Vertical: Retail, Department: HR.

**Test Steps:**
1. Open Roles tab → click "Add Role".
2. Fill in all fields with test data and save.
3. Navigate to Add User (non-employee) form.
4. Open the Role dropdown.

**Expected Result:** "Senior HR Lead" appears in the role dropdown and is selectable. Toast on save: "Role 'Senior HR Lead' saved."

---

### TC-FUNC-028 — Edit Role Name — All Assigned Users Reflect New Name Immediately

**Category:** Functional
**Priority:** High
**Preconditions:** Role "HR Consultant" is assigned to three users at TCS.
**Test Data:** Old role name = "HR Consultant"; new name = "External HR Consultant".

**Test Steps:**
1. Open Roles tab → click on "HR Consultant" to edit.
2. Change Role Name to "External HR Consultant".
3. Save.
4. Return to the Users tab.

**Expected Result:** All three users' Role column immediately reflects "External HR Consultant" with no reassignment required. No data migration needed.

---

### TC-FUNC-029 — Delete Role With No Assigned Users — Succeeds

**Category:** Functional
**Priority:** Medium
**Preconditions:** Role "Temp Role" exists at TCS with zero users assigned (active or inactive).
**Test Data:** Role = "Temp Role"; users assigned = 0.

**Test Steps:**
1. Open Roles tab → click "…" on "Temp Role" → select Delete.
2. Confirm the deletion in the confirmation modal.

**Expected Result:** Confirmation modal: "Delete Temp Role? This cannot be undone." On confirm: role soft-deleted (`deleted_at` set). Role no longer appears in the list or role dropdowns.

---

### TC-FUNC-030 — Send Password Reset Email — CRM Admin Triggered

**Category:** Functional
**Priority:** High
**Preconditions:** User "Suresh Consultant" has status = active.
**Test Data:** User = "Suresh Consultant"; registered email = "suresh@ext.com".

**Test Steps:**
1. Open Suresh's user detail view.
2. Scroll to the Password Reset section at the bottom.
3. Click "Send Reset Email".
4. Confirm in the inline prompt.

**Expected Result:** Password reset email dispatched to "suresh@ext.com". Button state changes to disabled with label "Reset Email Sent". Timestamp "Last reset email sent: {DD MMM YYYY HH:MM}" appears below the button.

---

### TC-FUNC-031 — Password Reset Email Targets Company-Context Email Only

**Category:** Functional
**Priority:** High
**Preconditions:** User "Ramesh" is assigned to TCS with email "ramesh@abc.com" and to Wipro with email "ramesh@wipro.com".
**Test Data:** Current company context = TCS.

**Test Steps:**
1. Open User Management for TCS.
2. Open Ramesh's detail view.
3. Send a password reset email.

**Expected Result:** Reset email sent to "ramesh@abc.com" (TCS context email only). "ramesh@wipro.com" (Wipro context) is not used.

---

### TC-FUNC-032 — Multi-Company Non-Employee User — Same Identity Linked to Second Company

**Category:** Functional
**Priority:** High
**Preconditions:** Consultant "Ramesh" (ramesh@abc.com, 9876543210) is already provisioned at TCS.
**Test Data:** Wipro CRM Admin adds Full Name = "Ramesh", Email = "ramesh@abc.com", Phone = "9876543210".

**Test Steps:**
1. CRM Admin for Wipro opens Add User (non-employee) form.
2. Enters same name, email, and phone as Ramesh's existing TCS record.
3. Submits.

**Expected Result:** System recognises matching identity. A new `ibp_company_user` row is created for Wipro linking to the existing `ibp_portal_user`. No new `ibp_portal_user` row is created. Ramesh appears in both TCS's and Wipro's user lists. Login credentials unchanged.

---

### TC-FUNC-033 — Company Selector Loads All IBP-Enabled Companies

**Category:** Functional
**Priority:** High
**Preconditions:** CRM Admin is on the standalone User Management landing page.
**Test Data:** Three companies with IBP access: TCS, Wipro, Infosys. One company without IBP access: LocalCorp.

**Test Steps:**
1. Open iWork → Admin Module → IBP User Management.
2. Click the Company dropdown.

**Expected Result:** Dropdown shows TCS, Wipro, and Infosys. LocalCorp (no IBP access) is not listed.

---

### TC-FUNC-034 — Tab Bar Appears After Company Selection

**Category:** Functional
**Priority:** Medium
**Preconditions:** CRM Admin is on the User Management landing with no company selected.
**Test Data:** Company = TCS.

**Test Steps:**
1. Open User Management landing.
2. Observe page before company selection.
3. Select "TCS" from dropdown.

**Expected Result:** Before selection: no tab bar, no user list. After selection: "Users" and "Roles" tabs appear. Users tab is active by default. URL updates to `?companyId={id}`.

---

### TC-FUNC-035 — Add User Button Opens User Type Selection Modal

**Category:** Functional
**Priority:** High
**Preconditions:** CRM Admin has selected a company.
**Test Data:** Company = TCS.

**Test Steps:**
1. Open User Management for TCS.
2. Click the "Add User" button.

**Expected Result:** A modal appears with exactly two options: "Create Non-Employee User" and "Assign Existing Employee". Selecting either option closes the modal and opens the respective form.

---

## 2. Edge Test Cases

### TC-EDGE-001 — User With More Than Two Policies Shows +N More Chip

**Category:** Edge
**Priority:** Medium
**Preconditions:** User "Multi HR" is assigned to GMC, GPA, GTL, GCI (four specific policies).
**Test Data:** User = "Multi HR"; policies = [GMC, GPA, GTL, GCI].

**Test Steps:**
1. Open User Management for the company.
2. Locate "Multi HR" in the user list.
3. Observe the Policy Access column.

**Expected Result:** Policy Access column shows two policy names (e.g., "GMC, GPA") followed by a "+2 more" chip. Full list shown on hover or expansion.

---

### TC-EDGE-002 — Reactivate User Whose Role Was Deleted — Blocked Without Replacement

**Category:** Edge
**Priority:** Critical
**Preconditions:** User "Old HR" is inactive. Their previously assigned role "Defunct Role" has been deleted (soft-deleted) since deactivation.
**Test Data:** User = "Old HR"; deleted role = "Defunct Role".

**Test Steps:**
1. Open "…" menu for "Old HR" → click "Activate".
2. Observe the system response.

**Expected Result:** Blocking modal appears: "This user's role (Defunct Role) no longer exists. Select a new role to reactivate this user." A role dropdown is shown. The user remains inactive until a replacement role is selected and saved.

---

### TC-EDGE-003 — Reactivate User Whose Role Was Deleted — Succeeds With Valid Replacement

**Category:** Edge
**Priority:** Critical
**Preconditions:** Same as TC-EDGE-002. Replacement role "External HR" is available.
**Test Data:** User = "Old HR"; replacement role = "External HR".

**Test Steps:**
1. Click "Activate" for "Old HR".
2. In the blocking modal, select "External HR" from the role dropdown.
3. Click "Reactivate".

**Expected Result:** User's `role_id` updated to "External HR". Status set to active. Inactive Date and Reason cleared. User account is fully restored.

---

### TC-EDGE-004 — All Policies User When Policy Removed From Company

**Category:** Edge
**Priority:** High
**Preconditions:** User "All-Access HR" has `all_policies = TRUE`. TCS has GMC, GPA, GTL.
**Test Data:** GTL policy removed from TCS.

**Test Steps:**
1. Remove GTL from TCS's policy list.
2. CRM Admin checks their email.
3. "All-Access HR" attempts to access GTL data.

**Expected Result:** "All-Access HR" no longer has GTL access (consistent with the company no longer having GTL). The `all_policies = TRUE` flag remains unchanged. CRM Admin receives an email notification listing all affected users including "All-Access HR".

---

### TC-EDGE-005 — Switch User From All Policies to Specific Subset — Auto-Extension Stops

**Category:** Edge
**Priority:** High
**Preconditions:** User "Preet HR" has `all_policies = TRUE` at TCS.
**Test Data:** Admin changes Preet's access to specific policies: GMC, GPA only.

**Test Steps:**
1. Open edit form for "Preet HR".
2. Toggle off "All Policies" and manually select GMC and GPA.
3. Save.
4. Add a new policy GTL to TCS.
5. Check Preet's access.

**Expected Result:** After edit, `all_policies = FALSE`. `ibp_user_policy_mapping` rows created for GMC and GPA. After GTL is added, Preet does NOT auto-gain GTL access. Only GMC and GPA remain.

---

### TC-EDGE-006 — Email Change to Corrected Address Just Before Activation

**Category:** Edge
**Priority:** High
**Preconditions:** User "Deepa Ext" created with email "deepa@acme.con" (typo). She has not clicked the invitation link yet.
**Test Data:** Old email = "deepa@acme.con"; new email = "deepa@acme.com".

**Test Steps:**
1. Open edit form for "Deepa Ext" (status = pending_activation).
2. Correct the email to "deepa@acme.com".
3. Save.
4. Attempt to use the original invitation link.

**Expected Result:** Auth-service credential updated to "deepa@acme.com". Old activation token invalidated. New portal-access invitation sent to "deepa@acme.com" automatically. Old link returns an error/expired page.

---

### TC-EDGE-007 — Deactivated Employee Also Holds HR Role — Both Revoked Simultaneously

**Category:** Edge
**Priority:** High
**Preconditions:** Employee "Raj" holds both an employee account and an HR role at TCS. His employee account is deactivated via the Inception/Endorsement process.
**Test Data:** Employee = "Raj"; dual-role user.

**Test Steps:**
1. Deactivate Raj's employee account (outside User Management module).
2. Observe the User Management list for TCS.

**Expected Result:** Both Raj's employee access and HR role access are revoked simultaneously. The HR role record is preserved in `ibp_company_user` but marked inactive (status = inactive).

---

### TC-EDGE-008 — Role With No Dimensions Available (No Approved Policy Config)

**Category:** Edge
**Priority:** High
**Preconditions:** No policy at the company has an approved configuration.
**Test Data:** Company = "StartupCo" with all policy configs in draft state.

**Test Steps:**
1. Open Roles tab for StartupCo.
2. Click "Add Role".
3. Observe the Access Dimensions field.

**Expected Result:** Access Dimensions field displays: "No dimensions available — at least one policy configuration must be approved before a role can be configured." The form cannot be completed or submitted without valid dimensions.

---

### TC-EDGE-009 — Company With Exactly 5,000 Users — Listing Loads Successfully

**Category:** Edge
**Priority:** High
**Preconditions:** Test company seeded with exactly 5,000 `ibp_company_user` rows.
**Test Data:** Company = "LargeCorpTest"; 5,000 active users.

**Test Steps:**
1. Open User Management and select "LargeCorpTest".
2. Measure the time from company selection to user list rendering.

**Expected Result:** User list renders within 2 seconds. Pagination works correctly. Record count shows "5000 users".

---

### TC-EDGE-010 — Policy Removed From Company After User Was Created for It

**Category:** Edge
**Priority:** High
**Preconditions:** User "Policy HR" was created with access to GTL at TCS. GTL is later removed from TCS.
**Test Data:** Policy = GTL; affected user = "Policy HR".

**Test Steps:**
1. Remove GTL from TCS policies.
2. Observe the CRM Admin notification.
3. Check "Policy HR"'s user record.

**Expected Result:** CRM Admin receives an email notification listing "Policy HR" as affected. "Policy HR" is NOT automatically deactivated or reassigned — admin must take manual action. No automatic access change is made.

---

### TC-EDGE-011 — Non-Employee User Assigned to Multiple Companies With Different Emails

**Category:** Edge
**Priority:** Medium
**Preconditions:** "Ramesh" is at TCS with ramesh@abc.com and at Wipro with ramesh@wipro.com.
**Test Data:** Two separate records with different emails.

**Test Steps:**
1. Confirm Ramesh at TCS uses ramesh@abc.com.
2. Add "Ramesh" at Wipro with ramesh@wipro.com (different email).
3. Deactivate Ramesh at Wipro.
4. Check Ramesh's TCS record.

**Expected Result:** System creates two independent `ibp_portal_user` and `ibp_company_user` records (different email = no link). Deactivating at Wipro has no effect on TCS record. Each company's deactivation is fully scoped.

---

### TC-EDGE-012 — auth-service Session Termination Times Out at 2-Second Threshold

**Category:** Edge
**Priority:** High
**Preconditions:** auth-service is configured to respond slowly (>2 seconds) in a test environment.
**Test Data:** User to deactivate; auth-service simulated latency = 2500ms.

**Test Steps:**
1. Attempt to deactivate a user.
2. auth-service call exceeds 2-second timeout.
3. Observe the outcome.

**Expected Result:** Service aborts the auth-service call after 2 seconds. Returns 503 to the frontend. No `ibp_company_user` record is updated. Toast: "Session termination failed. Deactivation not committed. Please retry."

---

### TC-EDGE-013 — Pending Activation User Appears in List With Amber Badge

**Category:** Edge
**Priority:** Medium
**Preconditions:** A user was just created and has not yet set a password.
**Test Data:** User = "New Consultant"; status = pending_activation.

**Test Steps:**
1. Create a new non-employee user.
2. Observe the user list immediately after creation.

**Expected Result:** User row appears with an amber badge labelled "Pending Activation" in the Status column.

---

### TC-EDGE-014 — Role Renamed While a User Holds That Role — User List Reflects New Name

**Category:** Edge
**Priority:** Medium
**Preconditions:** User "Kavya" is assigned role "Consultant HR". CRM Admin renames the role.
**Test Data:** Old name = "Consultant HR"; new name = "External HR Advisor".

**Test Steps:**
1. Rename "Consultant HR" to "External HR Advisor" in the Roles tab.
2. Navigate to Users tab.
3. Locate Kavya's row.

**Expected Result:** Role column for Kavya shows "External HR Advisor" immediately via the JOIN in the listing query. No reassignment needed.

---

### TC-EDGE-015 — Inactive User Counted in Role Deletion Guard

**Category:** Edge
**Priority:** High
**Preconditions:** Role "Old Role" has 2 active users and 1 inactive user (3 total).
**Test Data:** Role = "Old Role"; active users = 2; inactive users = 1.

**Test Steps:**
1. Attempt to delete "Old Role" from the Roles tab.
2. Observe the blocking modal.

**Expected Result:** Blocking modal appears: "Cannot delete Old Role. 3 user(s) are assigned to this role, including inactive users. Reassign or deactivate all users before deleting." Count includes the inactive user.

---

## 3. Negative Test Cases

### TC-NEG-001 — Create User With Empty Required Fields — Inline Validation Errors Shown

**Category:** Negative
**Priority:** Critical
**Preconditions:** CRM Admin opens the Add Non-Employee User form.
**Test Data:** All required fields left empty.

**Test Steps:**
1. Open Add User form (non-employee path).
2. Leave Full Name, Email, Role, and Policy Access empty.
3. Click Submit.

**Expected Result:** Form does not submit. Inline validation errors appear below each required field on blur and on submit. No API call is made.

---

### TC-NEG-002 — Create User With Invalid Email Format — Inline Error Shown

**Category:** Negative
**Priority:** High
**Preconditions:** CRM Admin opens the Add Non-Employee User form.
**Test Data:** Full Name = "Test User"; Email = "not-an-email"; Role = valid; Policy = valid.

**Test Steps:**
1. Enter "not-an-email" in the Email field.
2. Tab out of the field (blur).
3. Observe the validation error.

**Expected Result:** Inline error appears below the Email field: "Enter a valid email address". Form does not submit.

---

### TC-NEG-003 — Create Non-Employee With Duplicate Identity (Same Name + Email + Phone) in Company

**Category:** Negative
**Priority:** Critical
**Preconditions:** User "Ramesh Kumar" (ramesh@tcs.com, 9876543210) already exists at TCS.
**Test Data:** Same Full Name = "Ramesh Kumar"; Email = "ramesh@tcs.com"; Phone = "9876543210".

**Test Steps:**
1. Open Add User form for TCS.
2. Enter the same name, email, and phone.
3. Click Submit.

**Expected Result:** Form-level error on submit: "A user with these details already exists for this company." Submission is rejected. No duplicate record created.

---

### TC-NEG-004 — Create User When Selected Policy Config Is Not Approved — Blocked

**Category:** Negative
**Priority:** Critical
**Preconditions:** GPA policy at TCS has a pending configuration. GMC has an approved configuration.
**Test Data:** Policy Access = [GMC, GPA] (one approved, one pending).

**Test Steps:**
1. Open Add User form.
2. Select both GMC and GPA in Policy Access.
3. Submit the form.

**Expected Result:** Submission blocked. Error: "GPA policy configuration is not yet approved. User cannot be created until all selected policies have approved configurations." GMC is not flagged.

---

### TC-NEG-005 — Assign Not-Yet-Activated Employee — Assignment Disabled

**Category:** Negative
**Priority:** Critical
**Preconditions:** Employee "New Hire" exists in the IBP system but has not been activated through the Inception/Endorsement process.
**Test Data:** Employee = "New Hire"; activation status = not activated.

**Test Steps:**
1. Open Add User → Assign Existing Employee.
2. Search for "New Hire".
3. Observe the search result row.

**Expected Result:** "New Hire" appears in results with an amber badge "Not yet activated". The row is visually dimmed and the select/assign action is disabled. The admin cannot proceed with this employee until their account is activated.

---

### TC-NEG-006 — Delete Role With Active Users Assigned — Blocked

**Category:** Negative
**Priority:** Critical
**Preconditions:** Role "HR Manager" at TCS has 2 active users assigned.
**Test Data:** Role = "HR Manager"; active users = 2; inactive users = 0.

**Test Steps:**
1. Navigate to Roles tab.
2. Click "…" on "HR Manager" → Delete.
3. Observe the system response.

**Expected Result:** Blocking modal: "Cannot delete HR Manager. 2 user(s) are assigned to this role, including inactive users. Reassign or deactivate all users before deleting." Delete action does not proceed.

---

### TC-NEG-007 — Delete Role With Only Inactive Users Assigned — Still Blocked

**Category:** Negative
**Priority:** High
**Preconditions:** Role "Legacy Role" has 0 active users and 2 inactive users.
**Test Data:** Role = "Legacy Role"; active users = 0; inactive users = 2.

**Test Steps:**
1. Navigate to Roles tab.
2. Click "…" on "Legacy Role" → Delete.

**Expected Result:** Blocking modal still appears: "Cannot delete Legacy Role. 2 user(s) are assigned to this role, including inactive users." Role deletion is blocked. Inactive users count toward the guard.

---

### TC-NEG-008 — Create Role With Duplicate Name Within Same Company — Rejected

**Category:** Negative
**Priority:** High
**Preconditions:** Role "HR Manager" already exists at TCS.
**Test Data:** New role name = "HR Manager" (same company).

**Test Steps:**
1. Open Add Role form for TCS.
2. Enter Role Name = "HR Manager".
3. Fill remaining fields and submit.

**Expected Result:** Error returned: "A role with this name already exists for this company." Role is not created. The `(company_id, name)` unique constraint is enforced.

---

### TC-NEG-009 — Deactivate User Without Providing Inactive Reason — Confirm Button Disabled

**Category:** Negative
**Priority:** Critical
**Preconditions:** CRM Admin opens the deactivation modal for an active user.
**Test Data:** Inactive Reason field = empty.

**Test Steps:**
1. Click "Deactivate" from the "…" menu for an active user.
2. Leave the Inactive Reason field empty.
3. Observe the Confirm button.

**Expected Result:** The "Deactivate" confirm button remains disabled while the Inactive Reason field is empty. Admin cannot proceed until a reason is entered.

---

### TC-NEG-010 — Reactivate User With Deleted Role and No Replacement Provided — 422

**Category:** Negative
**Priority:** High
**Preconditions:** Inactive user "Old HR" had role "Defunct Role" which has been deleted. Admin calls the activate endpoint without providing a replacement roleId.
**Test Data:** POST `/activate` with no `roleId` in body.

**Test Steps:**
1. Send POST request to `/admin/user-management/:companyId/users/:companyUserId/activate` with empty body.
2. Observe the response.

**Expected Result:** 422 response: `{"statusCode": 422, "message": "User's previously assigned role no longer exists. Provide a valid roleId to reactivate."}`. No status change in DB.

---

### TC-NEG-011 — Edit Contact Info After Account Activation — Fields Are Read-Only

**Category:** Negative
**Priority:** High
**Preconditions:** User "Suresh" has status = active (has set a password).
**Test Data:** User = "Suresh Consultant"; status = active.

**Test Steps:**
1. Open edit form for "Suresh Consultant".
2. Attempt to click into the Full Name, Email, or Phone fields.

**Expected Result:** Fields are rendered as read-only (non-interactive). No input is accepted. Contextual note confirms lock: "Contact information is locked after account activation."

---

### TC-NEG-012 — Create User for Policy With Pending Configuration (Policy-Level Entry) — Blocked

**Category:** Negative
**Priority:** High
**Preconditions:** Admin navigates from within the GPA policy which has a pending configuration.
**Test Data:** Source policy = GPA; config status = pending.

**Test Steps:**
1. Navigate to GPA policy context → open User Management.
2. Attempt to open the Add User form.

**Expected Result:** System blocks user creation entirely when the form opens. Message: "GPA policy configuration must be approved first." No form is displayed. (Per AC-HPUM-004-b)

---

### TC-NEG-013 — Create Role Without Selecting Any Policy Type — Form Rejects

**Category:** Negative
**Priority:** Medium
**Preconditions:** CRM Admin opens the Add Role form.
**Test Data:** Role Name = "Test Role"; Policy Type Access = none selected.

**Test Steps:**
1. Open Add Role form.
2. Enter a role name but leave Policy Type Access unchecked.
3. Attempt to submit.

**Expected Result:** Form rejects submission with a validation error on Policy Type Access. At least one of "Health Policies" or "Non-Health Policies" must be selected.

---

### TC-NEG-014 — Create Role Without Selecting Any Access Dimension — Form Rejects

**Category:** Negative
**Priority:** Medium
**Preconditions:** At least one policy has an approved configuration (dimensions are available). CRM Admin opens Add Role form.
**Test Data:** Role Name = "No Dimension Role"; Policy Type = Health; Dimensions = none selected.

**Test Steps:**
1. Open Add Role form.
2. Fill role name and policy type, but leave all dimensions unselected.
3. Submit.

**Expected Result:** Form rejects submission: at least one access dimension must be selected.

---

### TC-NEG-015 — Search With No Matching Results — Empty Filtered State Shown

**Category:** Negative
**Priority:** Medium
**Preconditions:** Company has users, none of whom match the search term.
**Test Data:** Search input = "ZZZNOTEXIST".

**Test Steps:**
1. Open User Management for a company.
2. Type "ZZZNOTEXIST" in the search field.

**Expected Result:** User list becomes empty. An appropriate empty-search state message is displayed. Record count updates to "0 users". No error is thrown.

---

## 4. Security Test Cases

### TC-SEC-001 — Unauthenticated Request to Any Write Endpoint Returns 401

**Category:** Security
**Priority:** Critical
**Preconditions:** No Authorization header is included.
**Test Data:** POST `/admin/user-management/:companyId/users` with no JWT.

**Test Steps:**
1. Send a POST request to create a user without any Authorization header.
2. Observe the HTTP response.

**Expected Result:** 401 Unauthorized. `JwtAuthGuard` applied at controller class level rejects the request before it reaches the service. No data is created.

---

### TC-SEC-002 — Expired JWT Returns 401 on All Endpoints

**Category:** Security
**Priority:** Critical
**Preconditions:** An expired CRM Admin JWT is available.
**Test Data:** Authorization: Bearer {expired_token}.

**Test Steps:**
1. Send any request to a User Management endpoint using the expired JWT.
2. Observe the response.

**Expected Result:** 401 Unauthorized returned. Expired token is not accepted. No operation proceeds.

---

### TC-SEC-003 — Non-CRM_ADMIN Role Returns 403 on All Write Endpoints

**Category:** Security
**Priority:** Critical
**Preconditions:** Valid JWT for a user with role = "HR_ADMIN" (not CRM_ADMIN).
**Test Data:** Authorization: Bearer {hr_admin_token}.

**Test Steps:**
1. Send POST to create a user using the HR_ADMIN token.
2. Send PATCH to edit a user using the same token.
3. Observe responses.

**Expected Result:** Both requests return 403 Forbidden. `RolesGuard` blocks access. CRM_ADMIN claim is required for all write-path endpoints.

---

### TC-SEC-004 — CRM Admin Cannot Access Another Company's Users

**Category:** Security
**Priority:** Critical
**Preconditions:** CRM Admin is authorized only for TCS. Wipro has a separate user list.
**Test Data:** Request: GET `/admin/user-management/wipro_company_id/users`; CRM Admin token scoped to TCS.

**Test Steps:**
1. Send GET request for Wipro's user list using a TCS-scoped CRM Admin token.
2. Observe the response.

**Expected Result:** 400 or 403 returned. Cross-company access is denied. The `companyId` in the request is validated against the admin's authorized companies before any query executes.

---

### TC-SEC-005 — SQL Injection Attempt in Search Field Is Neutralized

**Category:** Security
**Priority:** Critical
**Preconditions:** User list is open for a company.
**Test Data:** Search input = `'; DROP TABLE ibp_company_user; --`.

**Test Steps:**
1. Enter the SQL injection string in the search input.
2. Observe the result.

**Expected Result:** The input is treated as a literal string search. No query manipulation occurs. The `###search###` substitution uses parameterized queries — raw string interpolation never reaches the DB driver. No data is deleted or altered.

---

### TC-SEC-006 — XSS Payload in Full Name Field Is Escaped on Render

**Category:** Security
**Priority:** High
**Preconditions:** CRM Admin creates a user with a malicious name.
**Test Data:** Full Name = `<script>alert('xss')</script>`.

**Test Steps:**
1. Create a non-employee user with Full Name = `<script>alert('xss')</script>`.
2. View the user list and user detail screen.

**Expected Result:** The script tag is rendered as escaped HTML text, not executed. No alert dialog fires. The value is stored and displayed safely.

---

### TC-SEC-007 — Deactivated Admin Cannot Create or Edit Users

**Category:** Security
**Priority:** Critical
**Preconditions:** CRM Admin "AdminOld" has been deactivated at the auth layer.
**Test Data:** AdminOld's previously valid JWT (now invalidated).

**Test Steps:**
1. Attempt to use AdminOld's token to create a user.
2. Observe the response.

**Expected Result:** 401 returned. Auth-service has invalidated the session. No user is created or edited.

---

### TC-SEC-008 — Session Terminated Immediately on User Deactivation

**Category:** Security
**Priority:** Critical
**Preconditions:** "Priya HR" has an active session browsing the HR Portal.
**Test Data:** Deactivation triggered by CRM Admin.

**Test Steps:**
1. CRM Admin deactivates "Priya HR" with a reason.
2. Within seconds, Priya attempts any action in her active session.

**Expected Result:** Priya's session is terminated by auth-service. Her next request returns an authentication error and she is redirected to the login page. The session termination must succeed before the DB record is updated (two-phase operation).

---

### TC-SEC-009 — Password Reset Email Restricted to Company-Context Email — No Cross-Company Leak

**Category:** Security
**Priority:** High
**Preconditions:** "Ramesh" has ramesh@abc.com at TCS and ramesh@wipro.com at Wipro.
**Test Data:** CRM Admin in TCS context triggers password reset.

**Test Steps:**
1. Open User Management for TCS.
2. Open Ramesh's user detail.
3. Click "Send Reset Email".

**Expected Result:** Reset email sent only to "ramesh@abc.com" (TCS context). "ramesh@wipro.com" is never exposed or targeted from the TCS context. The endpoint uses `ibp_company_user.email` for the current company_id, not any global email.

---

### TC-SEC-010 — companyId in Path Validated Against Admin's Authorized Companies

**Category:** Security
**Priority:** Critical
**Preconditions:** CRM Admin token is a super-admin or scoped token.
**Test Data:** companyId in path = a valid UUID for a company the admin is not authorized to manage.

**Test Steps:**
1. Construct a POST request to `/admin/user-management/{unauthorized_company_id}/users`.
2. Include a valid CRM Admin JWT.
3. Observe the response.

**Expected Result:** Request is rejected before the query executes. The service layer validates `companyId` against authorized companies. Returns 400 or 403.

---

### TC-SEC-011 — Soft-Delete Enforced — No Hard DELETE Statement Reachable

**Category:** Security
**Priority:** High
**Preconditions:** Any user management operation that removes a record.
**Test Data:** Delete role with 0 assigned users.

**Test Steps:**
1. Delete a role with 0 users from the Roles tab.
2. Query the database directly: `SELECT * FROM ibp_user_role WHERE id = {role_id}`.

**Expected Result:** The row is still present in the database with `deleted_at` set to the deletion timestamp. No `DELETE FROM` statement was executed. The role is excluded from application queries via `deleted_at IS NULL` filter.

---

### TC-SEC-012 — IDOR — CRM Admin Cannot Access User Records From Unauthorized Company

**Category:** Security
**Priority:** Critical
**Preconditions:** `companyUserId` from Wipro is known. CRM Admin is authorized for TCS only.
**Test Data:** GET `/admin/user-management/tcs_id/users/{wipro_company_user_id}`.

**Test Steps:**
1. Send GET request for a specific user using TCS's companyId but Wipro's companyUserId.
2. Observe the response.

**Expected Result:** 404 or 403 returned. The query filters by `company_id = tcs_id AND id = wipro_cu_id`, which returns no rows. Wipro user data is not exposed.

---

## 5. Performance Test Cases

### TC-PERF-001 — User List Loads Within 2 Seconds for Company With 5,000 Users

**Category:** Performance
**Priority:** High
**Preconditions:** Test database seeded with 5,000 `ibp_company_user` rows for a single company. Composite index on `(company_id, deleted_at, status)` is present.
**Test Data:** Company = "LargeCorpTest"; 5,000 users; default page size = 50.

**Test Steps:**
1. Select "LargeCorpTest" from the company dropdown.
2. Measure time from selection to first render of the user list.

**Expected Result:** User list renders within 2 seconds. Composite index on `(company_id, deleted_at, status)` ensures efficient query execution.

---

### TC-PERF-002 — Search Filter Debounce Fires After 300ms — Result Arrives Within 1 Second

**Category:** Performance
**Priority:** High
**Preconditions:** Company has 5,000 users loaded. Index on `(full_name, email)` is present.
**Test Data:** Search input = "Raj" (matches ~50 users).

**Test Steps:**
1. Type "Raj" in the search input.
2. Observe when the API call is triggered.
3. Measure time from API call to list update.

**Expected Result:** Debounce of 300ms prevents premature firing. Result list updates within 1 second of the debounced call completing.

---

### TC-PERF-003 — Deactivation Commits Within 3 Seconds End-to-End

**Category:** Performance
**Priority:** High
**Preconditions:** auth-service responds within the 2-second timeout. DB write is fast.
**Test Data:** User to deactivate; auth-service simulated response time = 500ms.

**Test Steps:**
1. Trigger deactivation for a user.
2. Measure time from confirm click to user list update reflecting "Inactive" status.

**Expected Result:** End-to-end deactivation (auth-service call + DB update) completes within 3 seconds.

---

### TC-PERF-004 — Password Reset Email Dispatched Within 3 Seconds

**Category:** Performance
**Priority:** High
**Preconditions:** auth-service accepts the dispatch request synchronously and is responsive.
**Test Data:** User = "Suresh Consultant".

**Test Steps:**
1. Open user detail for "Suresh Consultant".
2. Click "Send Reset Email" and confirm.
3. Measure time from confirm to the "Reset Email Sent" button state.

**Expected Result:** Reset email is accepted by auth-service within 3 seconds. SMTP delivery is async and not awaited. Button state updates to "Reset Email Sent" with timestamp within 3 seconds.

---

### TC-PERF-005 — Concurrent User Creation Requests Do Not Produce Duplicate Records

**Category:** Performance
**Priority:** High
**Preconditions:** Race condition scenario: two CRM Admins submit the same user details simultaneously.
**Test Data:** Two simultaneous POST requests with identical Full Name, Email, Phone for the same company.

**Test Steps:**
1. Fire two concurrent POST `/users` requests with identical identity data.
2. Observe DB state after both complete.

**Expected Result:** Exactly one `ibp_company_user` row is created. The `(company_id, email)` unique constraint or application-layer duplicate check ensures only one succeeds. The second request returns 409.

---

### TC-PERF-006 — auth-service Timeout (2 s) During Deactivation Returns 503 Without DB Write

**Category:** Performance
**Priority:** Critical
**Preconditions:** auth-service is configured to respond after 2.5 seconds (exceeding the 2-second timeout).
**Test Data:** Deactivation request for an active user.

**Test Steps:**
1. Trigger deactivation.
2. auth-service call times out after 2 seconds.
3. Observe response and DB state.

**Expected Result:** Service returns 503: "Session termination failed. Deactivation not committed. Please retry." `ibp_company_user.status` remains `active`. No partial state exists in the database.

---

## 6. Integration Test Cases

### TC-INT-001 — Policy Configuration Approval Gate Called Synchronously on Every Create

**Category:** Integration
**Priority:** Critical
**Preconditions:** Policy Configuration module exposes an approval status endpoint. One policy is approved, one is pending.
**Test Data:** PolicyIds = [GMC (approved), GPA (pending)].

**Test Steps:**
1. Create a user with GMC and GPA in the policy access.
2. Inspect the service call log.

**Expected Result:** `UserManagementService` calls `PolicyConfigModule.checkApprovalStatus([GMC_id, GPA_id])` synchronously before any DB write. Response identifies GPA as pending. Creation is blocked with 422. No cached approval state is used.

---

### TC-INT-002 — auth-service Unreachable During Deactivation — 503, No DB Write

**Category:** Integration
**Priority:** Critical
**Preconditions:** auth-service is down or unreachable.
**Test Data:** Deactivation of an active user.

**Test Steps:**
1. Shut down auth-service.
2. Attempt to deactivate a user.
3. Check `ibp_company_user` in the database.

**Expected Result:** `UserManagementService.deactivateUser()` catches the connection error, rolls back any pending transaction, and returns 503. `ibp_company_user.status` remains `active`.

---

### TC-INT-003 — auth-service Account Creation Called on Non-Employee User Creation

**Category:** Integration
**Priority:** Critical
**Preconditions:** auth-service is running. New non-employee user details are valid.
**Test Data:** Email = "suresh@ext.com"; companyId = TCS.

**Test Steps:**
1. Create a non-employee user via the API.
2. Inspect auth-service call logs.

**Expected Result:** After inserting `ibp_portal_user` and `ibp_company_user` records, the service calls `AuthService.createAccount(email, companyId)`. An activation token is returned and stored. No account is created in auth-service before the DB inserts succeed.

---

### TC-INT-004 — Portal-Access Invitation Dispatched via auth-service on Creation

**Category:** Integration
**Priority:** Critical
**Preconditions:** Non-employee user has been created. auth-service email dispatch is available.
**Test Data:** Email template type = `non_employee`.

**Test Steps:**
1. Create a non-employee user.
2. Verify auth-service received a dispatch call.

**Expected Result:** `AuthService.dispatchPortalAccessEmail(email, token, templateType='non_employee')` is called. The email contains no policy/benefits content. Email delivery is queued in auth-service.

---

### TC-INT-005 — Policy Module Event: New Policy Added — All-Policies User Auto-Extends

**Category:** Integration
**Priority:** High
**Preconditions:** User "Preet HR" has `all_policies = TRUE`. TCS has GMC and GPA.
**Test Data:** New policy GTL added to TCS via Policy module event.

**Test Steps:**
1. Publish a "policy added" event from the Policy module for TCS/GTL.
2. Log in as "Preet HR" and navigate to the HR Portal.

**Expected Result:** Preet HR has access to GTL without any `ibp_user_policy_mapping` row being inserted. The dynamic query (no rows = all policies when `all_policies = TRUE`) provides access automatically. No event consumer or record update is required in User Management.

---

### TC-INT-006 — Policy Module Event: Policy Removed — CRM Admin Receives Email Notification

**Category:** Integration
**Priority:** High
**Preconditions:** Policy module publishes a "policy removed" event for TCS/GTL. Three users have GTL-only access; one has GTL as part of multi-policy access.
**Test Data:** GTL removed from TCS; 4 affected users.

**Test Steps:**
1. Trigger "policy removed" event for GTL at TCS.
2. Check CRM Admin's email inbox.

**Expected Result:** CRM Admin receives one email listing all 4 affected users. No in-app alert is shown. No automatic access change is made to any user record. Admin must take manual action.

---

### TC-INT-007 — auth-service Fails During Pre-Activation Email Change — DB Rolled Back

**Category:** Integration
**Priority:** Critical
**Preconditions:** User "Deepa" is in pending_activation state. Admin changes her email. auth-service rejects the credential update.
**Test Data:** New email = "deepa@acme.com"; auth-service returns error.

**Test Steps:**
1. Attempt to change Deepa's email.
2. auth-service call to update the login credential fails.
3. Check DB state.

**Expected Result:** DB change is rolled back. `ibp_company_user.email` remains the old value. No new invitation is sent. 500 or 502 returned to the admin. The system remains consistent — auth-service and DB are never out of sync.

---

### TC-INT-008 — Dual-Role Email Dispatch Sequence Correct via auth-service

🔁 **Updated** — Precondition note added per TRD OQ-TRD-01.

**Category:** Integration
**Priority:** High
**Preconditions:** Employee "Arun" is being assigned an HR role for the first time. The prior onboarding status is determined by a `was_employee_email_sent` flag per TRD §6.3 (`SELECT was_employee_email_sent FROM ibp_company_user WHERE employee_id=?`).

> **⚠ Open Question — OQ-TRD-01 (Unresolved):** `was_employee_email_sent` is referenced in TRD §6.3 but is **not present** in the `ibp_company_user` schema defined in TRD §3.1. The flag's location is unresolved — it may live on `ibp_company_user` (assumed by the §6.3 query) or be queried from `auth-service`'s email log. This test assumes the flag is on `ibp_company_user` per the current §6.3 flow. **The precondition and DB setup must be revisited once OQ-TRD-01 is resolved.**

**Test Data:** Employee = "Arun"; previously_onboarded = false (i.e., `was_employee_email_sent = false` on the `ibp_company_user` row, pending OQ-TRD-01 resolution).

**Test Steps:**
1. Assign Arun to an HR role.
2. Inspect auth-service dispatch calls in sequence.

**Expected Result:** First, `dispatchEmail(templateType='hr_portal_access')` is called. Then, because `previously_onboarded = false`, `dispatchEmail(templateType='employee_onboarding')` is called. Both are independent dispatches with distinct subjects. Order is HR portal access first, then employee onboarding.

---

### TC-INT-009 — Employee Records Consumed Read-Only From ibp-service Inception Process

**Category:** Integration
**Priority:** High
**Preconditions:** Employee records are managed exclusively by the Inception/Endorsement process.
**Test Data:** Search for "Raj" in the Assign Existing Employee search.

**Test Steps:**
1. Open Assign Existing Employee flow.
2. Search for "Raj".
3. Observe data source for search results.

**Expected Result:** Search results are fetched from ibp-service employee records via `GET /admin/user-management/:companyId/employees?q=Raj`. No employee record is created or modified by the User Management module. The module only reads these records.

---

### TC-INT-010 — Policy Configuration Module Exposes Approval Status Per Policy Correctly

**Category:** Integration
**Priority:** High
**Preconditions:** Policy Configuration module is running and has policies in various states.
**Test Data:** PolicyIds = [GMC (approved), GPA (draft), GTL (rejected)].

**Test Steps:**
1. Attempt to create a user with access to GMC, GPA, and GTL.
2. Observe which policies are flagged.

**Expected Result:** Approval check identifies both GPA (draft) and GTL (rejected) as non-approved. Error message identifies both blocking policies. Only when all selected policies return `status = 'approved'` does user creation proceed.

---

## 7. Accessibility Test Cases

### TC-ACC-001 — Full Keyboard Navigation Through User List Table

**Category:** Accessibility
**Priority:** High
**Preconditions:** User Management is open with a company selected and multiple users in the list.
**Test Data:** Keyboard: Tab, Arrow keys, Enter, Escape.

**Test Steps:**
1. Click into the user list area.
2. Use Tab to move between rows and the "…" menu.
3. Open the "…" menu with Enter/Space.
4. Navigate menu items with arrow keys.
5. Dismiss with Escape.

**Expected Result:** All interactive elements are reachable via keyboard. Focus order is logical. "…" menu opens and closes with keyboard. User detail can be opened without a mouse.

---

### TC-ACC-002 — Status Badges Announced Correctly by Screen Readers

**Category:** Accessibility
**Priority:** High
**Preconditions:** User list has users with all three status values: Active, Inactive, Pending Activation.
**Test Data:** Screen reader (NVDA or VoiceOver).

**Test Steps:**
1. Enable screen reader.
2. Navigate to the Status column for each user type.

**Expected Result:** Screen reader announces: "Active" (green badge), "Inactive" (red badge), "Pending Activation" (amber badge). Color alone is not the only indicator — text label is present in all badges.

---

### TC-ACC-003 — Inline Validation Errors Announced by Screen Reader on Submit

**Category:** Accessibility
**Priority:** High
**Preconditions:** Screen reader is enabled. Add User form is open.
**Test Data:** Submit with empty required fields.

**Test Steps:**
1. Open the Add Non-Employee User form.
2. Click Submit with required fields empty.
3. Observe screen reader announcements.

**Expected Result:** Screen reader announces each validation error. Errors are programmatically associated with their respective form fields using `aria-describedby` or equivalent. Focus moves to the first error field.

---

### TC-ACC-004 — Deactivation Modal Accessible via Keyboard Only

**Category:** Accessibility
**Priority:** High
**Preconditions:** An active user exists in the list.
**Test Data:** Keyboard navigation to deactivation modal.

**Test Steps:**
1. Navigate to a user row via keyboard.
2. Open the "…" menu with keyboard.
3. Select "Deactivate" with keyboard.
4. Complete the deactivation flow without using a mouse.

**Expected Result:** Deactivation modal opens with focus trapped inside. All elements (reason input, Deactivate button, Cancel button) are keyboard-accessible. Escape closes the modal. Focus returns to the triggering element on close.

---

### TC-ACC-005 — Color Contrast on Status Badges Meets WCAG AA

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** Status badges are rendered on screen.
**Test Data:** Green (Active), Red (Inactive), Amber (Pending Activation) badges.

**Test Steps:**
1. Inspect the color contrast ratio of badge text against badge background for all three status values using a contrast checker.

**Expected Result:** All three badge combinations meet the WCAG AA minimum contrast ratio of 4.5:1 for normal text.

---

### TC-ACC-006 — Responsive Layout — Module Usable on Tablet-Width Viewport

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** Browser set to 768px width (tablet viewport).
**Test Data:** Viewport = 768px.

**Test Steps:**
1. Open User Management at 768px viewport.
2. Navigate the user list, open Add User form, and open a user's edit view.

**Expected Result:** All UI elements are visible and usable without horizontal scrolling on critical actions. Table may horizontally scroll but primary actions (Add User, Edit, Deactivate) remain accessible.

---

### TC-ACC-007 — Role Deletion Blocking Modal Announces Count to Screen Reader

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** Role "HR Manager" has 3 users assigned. Screen reader enabled.
**Test Data:** Attempt to delete "HR Manager".

**Test Steps:**
1. Attempt to delete "HR Manager".
2. Observe the blocking modal with screen reader active.

**Expected Result:** Screen reader announces the modal title and the blocking message including the count: "Cannot delete HR Manager. 3 user(s) are assigned to this role, including inactive users." The modal is focus-trapped.

---

## 8. Regression Test Cases

### TC-REG-001 — Company Selector Pre-Selected and Read-Only When Entering from IBP Portal Config

**Category:** Regression
**Priority:** Critical
**Preconditions:** CRM Admin navigates to User Management from TCS's IBP Portal Config screen.
**Test Data:** Entry point = IBP Portal Config for TCS.

**Test Steps:**
1. Navigate to Admin Module → Companies → TCS → IBP Portal Config → User Management.
2. Observe the company selector.

**Expected Result:** Company dropdown shows "TCS" and is read-only (disabled). URL contains `?companyId={tcs_id}`. Breadcrumb: Admin Module > Companies > TCS > IBP Portal Config > User Management.

---

### TC-REG-002 — Policy Field Locked in All Forms When Entering From Policy Context

**Category:** Regression
**Priority:** Critical
**Preconditions:** CRM Admin enters User Management from within the GMC policy screen of TCS.
**Test Data:** Entry point = GMC policy context.

**Test Steps:**
1. Navigate from GMC policy → User Management.
2. Open both Add Non-Employee User and Assign Existing Employee forms.
3. Observe the policy field in each form.

**Expected Result:** In both forms, the policy field is locked to "GMC" and is non-editable. URL contains `?companyId={id}&policyId={gmc_id}`.

---

### TC-REG-003 — User List Refreshes After New User Is Created

**Category:** Regression
**Priority:** High
**Preconditions:** User list is loaded for TCS with N users.
**Test Data:** New user = "Fresh Consultant".

**Test Steps:**
1. Create a new non-employee user "Fresh Consultant".
2. Observe the user list after being returned to it.

**Expected Result:** User list includes "Fresh Consultant" at the top (sorted by created_at DESC). Record count increases by 1.

---

### TC-REG-004 — Toast Notification Appears on Successful User Creation

**Category:** Regression
**Priority:** High
**Preconditions:** CRM Admin successfully creates a user.
**Test Data:** New user email = "fresh@ext.com".

**Test Steps:**
1. Complete the non-employee user creation flow.
2. Observe the screen immediately after redirect to the user list.

**Expected Result:** Toast message appears: "User created. An access invitation has been sent to fresh@ext.com." Toast disappears after a brief duration.

---

### TC-REG-005 — Inactive Date and Reason Cleared When User Is Reactivated

**Category:** Regression
**Priority:** High
**Preconditions:** User "Priya HR" is inactive with Inactive Date = "10 Apr 2026" and Inactive Reason = "Contract ended".
**Test Data:** Reactivation of "Priya HR".

**Test Steps:**
1. Reactivate "Priya HR".
2. Observe her row in the user list.

**Expected Result:** Status changes to Active. Inactive Date and Inactive Reason columns both show "—". `deactivated_at` and `deactivation_reason` are cleared in the DB.

---

### TC-REG-006 — Password Reset Timestamp Visible on User Record After Successful Send

**Category:** Regression
**Priority:** High
**Preconditions:** Password reset email sent successfully for "Suresh Consultant".
**Test Data:** Reset sent at 2026-05-05 14:30.

**Test Steps:**
1. Send a password reset email for "Suresh Consultant".
2. Observe the user detail view.

**Expected Result:** "Last reset email sent: 05 May 2026 14:30" is displayed below the "Send Reset Email" button. The button is in the disabled "Reset Email Sent" state.

---

### TC-REG-007 — New Role Immediately Available in Creation Dropdown After Save

**Category:** Regression
**Priority:** High
**Preconditions:** CRM Admin just saved a new role "Senior HR Lead".
**Test Data:** Role = "Senior HR Lead".

**Test Steps:**
1. Save "Senior HR Lead" in the Roles tab.
2. Immediately open Add User (non-employee) form.
3. Open the Role dropdown.

**Expected Result:** "Senior HR Lead" appears in the dropdown without requiring a page refresh. No caching delay.

---

### TC-REG-008 — Switching Company in Standalone View Resets All Context

**Category:** Regression
**Priority:** Medium
**Preconditions:** CRM Admin is on the standalone User Management screen with TCS selected, viewing its users.
**Test Data:** Switch to company = Wipro.

**Test Steps:**
1. Select "Wipro" from the company dropdown while TCS user list is shown.
2. Observe the screen state.

**Expected Result:** All TCS context is cleared. Wipro's user list loads. URL updates to `?companyId={wipro_id}`. No TCS data is visible.

---

### TC-REG-009 — Back Navigation From Add User Form Preserves Company and Policy Context

**Category:** Regression
**Priority:** Medium
**Preconditions:** CRM Admin opened Add User form from TCS's GMC policy context.
**Test Data:** Entry = GMC policy context of TCS.

**Test Steps:**
1. Open the Add Non-Employee User form from GMC policy context.
2. Click "Back" without completing the form.

**Expected Result:** Admin is returned to the user list with TCS company and GMC policy context preserved. URL retains `?companyId={id}&policyId={gmc_id}`.

---

### TC-REG-010 — Email Delivery Failure Indicator Appears on User Record Row

**Category:** Regression
**Priority:** High
**Preconditions:** Portal-access invitation email failed to deliver for "New Consultant".
**Test Data:** Email delivery failure flagged on record.

**Test Steps:**
1. Simulate email delivery failure after user creation.
2. View the user list.

**Expected Result:** An amber warning icon or indicator appears on "New Consultant"'s user list row flagging delivery failure. The CRM Admin can trigger a resend from the user detail view or from a bulk resend action.

---

## 9. Data Integrity Test Cases

### TC-DATA-001 — ibp_company_user Has Exactly One of portal_user_id or employee_id Set

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** User Management module creates users of both types.
**Test Data:** Non-employee user and dual-role employee user.

**Test Steps:**
1. Create a non-employee user.
2. Query: `SELECT portal_user_id, employee_id FROM ibp_company_user WHERE id = {id}`.
3. Assign an employee to an HR role.
4. Query the resulting row.

**Expected Result:** For non-employee: `portal_user_id` is set, `employee_id` is NULL. For dual-role employee: `employee_id` is set, `portal_user_id` is NULL. Neither row has both populated or both NULL.

---

### TC-DATA-002 — deactivation_reason Non-Null When status = inactive

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** A user has been deactivated with reason "Contract ended".
**Test Data:** Deactivated user; reason = "Contract ended".

**Test Steps:**
1. Deactivate a user with a reason.
2. Query: `SELECT status, deactivation_reason FROM ibp_company_user WHERE id = {id}`.

**Expected Result:** `status = 'inactive'` and `deactivation_reason = 'Contract ended'` (non-null). Service-layer invariant: `deactivation_reason` must be non-null whenever `status = inactive`.

---

### TC-DATA-003 — all_policies = TRUE User Has No ibp_user_policy_mapping Rows

**Category:** Data Integrity
**Priority:** High
**Preconditions:** User "Preet HR" has `all_policies = TRUE`.
**Test Data:** User = "Preet HR".

**Test Steps:**
1. Create user with "All Policies" scope.
2. Query: `SELECT COUNT(*) FROM ibp_user_policy_mapping WHERE company_user_id = {id}`.

**Expected Result:** Count = 0. No `ibp_user_policy_mapping` rows exist for this user. Access to all policies is computed dynamically from the company's policy list.

---

### TC-DATA-004 — Switching to All Policies Deletes Existing ibp_user_policy_mapping Rows

**Category:** Data Integrity
**Priority:** High
**Preconditions:** User "Ravi HR" has specific policies [GMC, GPA] and 2 `ibp_user_policy_mapping` rows.
**Test Data:** Edit: switch Ravi to "All Policies".

**Test Steps:**
1. Edit "Ravi HR" and toggle "All Policies".
2. Save.
3. Query: `SELECT COUNT(*) FROM ibp_user_policy_mapping WHERE company_user_id = {id}`.

**Expected Result:** Count = 0. Both GMC and GPA mapping rows are deleted. `ibp_company_user.all_policies = TRUE`.

---

### TC-DATA-005 — Duplicate Email Within Same Company Blocked by DB Unique Constraint

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** User with email "duplicate@tcs.com" already exists at TCS.
**Test Data:** Attempt to insert another `ibp_company_user` with `company_id = TCS` and `email = 'duplicate@tcs.com'`.

**Test Steps:**
1. Attempt a direct DB insert (bypassing application logic) with the duplicate email.
2. Observe the DB error.

**Expected Result:** PostgreSQL raises a unique constraint violation on `(company_id, email)`. The insert is rejected at the DB level as a final safety net.

---

### TC-DATA-006 — Role Deletion Blocked at Application Layer When Assigned Users Exist

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Role "HR Manager" has 3 assigned users (active or inactive). No FK constraint at DB level blocking deletion.
**Test Data:** Role = "HR Manager"; assigned users = 3.

**Test Steps:**
1. Attempt to delete "HR Manager" via the API (DELETE `/roles/:roleId`).
2. Inspect the service layer check.

**Expected Result:** Service executes `COUNT(*) FROM ibp_company_user WHERE role_id = :roleId AND deleted_at IS NULL`. Count = 3. Returns 409 before any `deleted_at` update is made. Role remains intact.

---

### TC-DATA-007 — Role Name Uniqueness Within Company Enforced

**Category:** Data Integrity
**Priority:** High
**Preconditions:** Role "HR Manager" exists at TCS. Role "HR Manager" also exists at Wipro (different company).
**Test Data:** Attempt to create "HR Manager" again at TCS.

**Test Steps:**
1. Attempt to create role "HR Manager" at TCS via POST `/roles`.
2. Attempt to create role "HR Manager" at Wipro.

**Expected Result:** First attempt at TCS: 409 (duplicate within company). Second attempt at Wipro: 201 (unique constraint is `(company_id, name)` — same name is allowed across companies).

---

### TC-DATA-008 — Deactivation Sets deactivated_at, deactivated_by, deactivation_reason Atomically

**Category:** Data Integrity
**Priority:** High
**Preconditions:** User "Priya HR" is active. CRM Admin ID = "admin-uuid-001".
**Test Data:** Reason = "Role eliminated"; admin = admin-uuid-001.

**Test Steps:**
1. Deactivate "Priya HR" with the provided reason.
2. Query: `SELECT status, deactivated_at, deactivated_by, deactivation_reason FROM ibp_company_user WHERE id = {id}`.

**Expected Result:** All four fields updated in a single transaction: `status = 'inactive'`, `deactivated_at = NOW()`, `deactivated_by = 'admin-uuid-001'`, `deactivation_reason = 'Role eliminated'`. No partial update is possible.

---

### TC-DATA-009 — Soft Delete — deleted_at Set, Record Never Removed From DB

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** A user exists and is "removed" via deactivation (only removal method).
**Test Data:** Deactivated user "Priya HR".

**Test Steps:**
1. Deactivate "Priya HR".
2. Execute: `SELECT id, status, deleted_at FROM ibp_company_user WHERE id = {id}` directly in the DB.

**Expected Result:** Row is present. `status = 'inactive'`. `deleted_at` is NULL (deactivation ≠ soft-delete; soft-delete is a separate operation). Record is preserved in full. No `DELETE FROM` statement was executed per BR-HPUM-010.

---

### TC-DATA-010 — All Queries Include deleted_at IS NULL Filter on Every Joined Table

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Soft-deleted role and soft-deleted user records exist in the DB.
**Test Data:** Role with `deleted_at` set; user with `deleted_at` set.

**Test Steps:**
1. Verify the report SQL: check for `deleted_at IS NULL` on `ibp_company_user cu` (WHERE clause) and `ibp_user_role r` (JOIN ON clause).
2. Soft-delete a role in the DB directly.
3. Fetch the user list via the API.

**Expected Result:** Soft-deleted records do not appear in the user list. JOIN conditions and WHERE clauses contain `deleted_at IS NULL` on every table in the join path, as per the mandatory framework standard.

---

## 10. API Test Cases

### TC-API-001 — GET /companies Returns 200 With IBP-Enabled Company List

**Category:** API
**Priority:** High
**Preconditions:** Valid CRM Admin JWT. Three companies with IBP access; one without.
**Test Data:** GET `/admin/user-management/companies`; Authorization: Bearer {crm_admin_token}.

**Test Steps:**
1. Send GET `/admin/user-management/companies` with a valid CRM Admin JWT.
2. Observe response body.

**Expected Result:**
```json
{
  "statusCode": 200,
  "message": "Companies fetched successfully.",
  "data": [
    { "id": "uuid", "name": "TCS", "ibpEnabled": true }
  ]
}
```
Only IBP-enabled companies are returned. Company without IBP access is excluded.

---

### TC-API-002 — POST /users — 201 Happy Path Non-Employee Creation

**Category:** API
**Priority:** Critical
**Preconditions:** CRM Admin JWT valid. Role exists. Policy has approved config.
**Test Data:**
```json
{
  "fullName": "Test User",
  "email": "testuser@ext.com",
  "phone": "9988776655",
  "roleId": "valid-role-uuid",
  "allPolicies": false,
  "policyIds": ["approved-policy-uuid"]
}
```

**Test Steps:**
1. POST `/admin/user-management/{companyId}/users` with the above payload.
2. Verify response status and body.

**Expected Result:** HTTP 201; body: `{"statusCode": 201, "message": "User created successfully.", "data": {"companyUserId": "uuid"}}`. `ibp_company_user` row created with `status = 'pending_activation'`. Portal-access email dispatch triggered.

---

### TC-API-003 — POST /users — 409 Duplicate Identity Within Company

**Category:** API
**Priority:** Critical
**Preconditions:** User with name "Test User", email "testuser@ext.com", phone "9988776655" already exists at TCS.
**Test Data:** Same payload as TC-API-002.

**Test Steps:**
1. POST the same payload again to create a duplicate.
2. Observe HTTP response.

**Expected Result:** HTTP 409; `{"statusCode": 409, "message": "A user with these details already exists for this company."}`. No new record created.

---

### TC-API-004 — POST /users — 422 Policy Config Not Approved

**Category:** API
**Priority:** Critical
**Preconditions:** GPA policy has a pending configuration.
**Test Data:** Payload includes `"policyIds": ["gpa-policy-uuid"]`.

**Test Steps:**
1. POST to create a user with GPA in policyIds.
2. Observe response.

**Expected Result:** HTTP 422; `{"statusCode": 422, "message": "GPA policy configuration is not yet approved."}`. No user created.

---

### TC-API-005 — POST /users/assign — 422 Employee Not Yet Activated

**Category:** API
**Priority:** Critical
**Preconditions:** Employee "New Hire" exists in ibp-service but has not been activated.
**Test Data:** `{"employeeId": "new-hire-uuid", "roleId": "valid-role-uuid", "allPolicies": true}`.

**Test Steps:**
1. POST to `/admin/user-management/{companyId}/users/assign` with the above payload.
2. Observe response.

**Expected Result:** HTTP 422; `{"statusCode": 422, "message": "Employee account is not yet activated."}`. No HR role assignment created.

---

### TC-API-006 — PATCH /users/:id — Pre-Activation: All Fields Accepted

**Category:** API
**Priority:** High
**Preconditions:** User is in `pending_activation` status.
**Test Data:** `{"fullName": "Updated Name", "email": "updated@ext.com", "phone": "1234567890", "roleId": "new-role-uuid"}`.

**Test Steps:**
1. PATCH `/admin/user-management/{companyId}/users/{companyUserId}` while user status = pending_activation.
2. Query the DB for the updated row.

**Expected Result:** HTTP 200. All fields (`fullName`, `email`, `phone`, `roleId`) updated in `ibp_company_user`. Fresh invitation sent to the new email automatically.

---

### TC-API-007 — PATCH /users/:id — Post-Activation: Contact Fields Silently Ignored

**Category:** API
**Priority:** High
**Preconditions:** User status = `active`.
**Test Data:** `{"fullName": "Ignored Name", "email": "ignored@ext.com", "roleId": "new-role-uuid"}`.

**Test Steps:**
1. PATCH to active user with `fullName` and `email` in the payload.
2. Query the DB for the user row.

**Expected Result:** HTTP 200 (no error). `fullName` and `email` remain unchanged in DB. Only `roleId` is updated. The service silently ignores contact fields when `status != pending_activation`.

---

### TC-API-008 — POST /deactivate — 503 When auth-service Unreachable

**Category:** API
**Priority:** Critical
**Preconditions:** auth-service is down.
**Test Data:** `{"reason": "Test deactivation"}`.

**Test Steps:**
1. POST to `/admin/user-management/{companyId}/users/{companyUserId}/deactivate`.
2. auth-service is unreachable.

**Expected Result:** HTTP 503; `{"statusCode": 503, "message": "Session termination failed. Deactivation not committed. Please retry."}`. `ibp_company_user.status` remains `active`.

---

### TC-API-009 — POST /activate — 422 Deleted Role With No Replacement

**Category:** API
**Priority:** High
**Preconditions:** Inactive user whose `role_id` references a soft-deleted role. No `roleId` in the request body.
**Test Data:** Empty body `{}`.

**Test Steps:**
1. POST to `/admin/user-management/{companyId}/users/{companyUserId}/activate` with empty body.
2. Observe response.

**Expected Result:** HTTP 422; `{"statusCode": 422, "message": "User's previously assigned role no longer exists. Provide a valid roleId to reactivate."}`.

---

### TC-API-010 — DELETE /roles/:id — 409 Role Assigned to Users

**Category:** API
**Priority:** High
**Preconditions:** Role has 3 assigned users (active or inactive).
**Test Data:** DELETE `/admin/user-management/{companyId}/roles/{roleId}`.

**Test Steps:**
1. Send DELETE request for a role with assigned users.
2. Observe response.

**Expected Result:** HTTP 409; `{"statusCode": 409, "message": "Cannot delete role. 3 user(s) are currently assigned to it."}`. Role `deleted_at` remains NULL.

---

### TC-API-011 — DELETE /roles/:id — 200 Role With No Assigned Users

**Category:** API
**Priority:** Medium
**Preconditions:** Role "Empty Role" has 0 assigned users (active or inactive).
**Test Data:** DELETE `/admin/user-management/{companyId}/roles/{emptyRoleId}`.

**Test Steps:**
1. Send DELETE request for "Empty Role".
2. Observe response and DB state.

**Expected Result:** HTTP 200; `{"statusCode": 200, "message": "Role deleted."}`. `ibp_user_role.deleted_at` is set. Role no longer appears in role lists.

---

### TC-API-012 — Missing Authorization Header Returns 401

**Category:** API
**Priority:** Critical
**Preconditions:** No Authorization header in request.
**Test Data:** Any endpoint, e.g., GET `/admin/user-management/companies`.

**Test Steps:**
1. Send request without any Authorization header.
2. Observe HTTP response.

**Expected Result:** HTTP 401 Unauthorized. `JwtAuthGuard` rejects the request before it reaches the service or database.

---

### TC-API-013 — Wrong HTTP Method on Endpoint Returns 405

**Category:** API
**Priority:** Medium
**Preconditions:** Valid CRM Admin JWT.
**Test Data:** DELETE `/admin/user-management/{companyId}/users` (no such DELETE endpoint — POST is correct for creation).

**Test Steps:**
1. Send a DELETE request to an endpoint that only accepts POST.
2. Observe response.

**Expected Result:** HTTP 405 Method Not Allowed. NestJS framework returns standard method-not-allowed response.

---

### TC-API-014 — Malformed JSON Payload Returns 400

**Category:** API
**Priority:** Medium
**Preconditions:** Valid CRM Admin JWT.
**Test Data:** Body = `{fullName: "Missing quotes on key"}` (invalid JSON).

**Test Steps:**
1. Send POST to create a user with malformed JSON body.
2. Observe response.

**Expected Result:** HTTP 400 Bad Request. NestJS body parser rejects malformed JSON before it reaches any DTO validation.

---

### TC-API-015 — GET /employees?q= — Minimum 2 Characters Before Search Fires

**Category:** API
**Priority:** Medium
**Preconditions:** Valid CRM Admin JWT. Company has employees.
**Test Data:** q = "A" (1 character), then q = "Am" (2 characters).

**Test Steps:**
1. Send GET `/admin/user-management/{companyId}/employees?q=A`.
2. Send GET `/admin/user-management/{companyId}/employees?q=Am`.
3. Compare responses.

**Expected Result:** 1-character query: empty results or client-side debounce prevents firing (per SDS §5.1 — minimum 2 characters). 2-character query: returns matching employee records. 300ms debounce applies on the frontend.

---

### TC-API-016 — POST /reset-password — 502 When Email Delivery Fails

**Category:** API
**Priority:** High
**Preconditions:** auth-service accepts the request but email delivery fails.
**Test Data:** POST `/admin/user-management/{companyId}/users/{companyUserId}/reset-password`.

**Test Steps:**
1. Trigger a password reset where auth-service reports delivery failure.
2. Observe response and user record.

**Expected Result:** HTTP 502; `{"statusCode": 502, "message": "Password reset email failed to deliver.", "data": {"lastResetFailed": true}}`. `ibp_company_user.last_reset_failed = true` set in DB.

---

### TC-API-017 — GET /roles — 200 With usersAssigned Count Including Inactive Users

**Category:** API
**Priority:** High
**Preconditions:** Role "HR Manager" has 2 active and 1 inactive user (3 total).
**Test Data:** GET `/admin/user-management/{companyId}/roles`.

**Test Steps:**
1. Send GET roles request.
2. Find "HR Manager" in the response.
3. Check the `usersAssigned` field.

**Expected Result:** HTTP 200. `usersAssigned: 3` (includes inactive users). This count drives the deletion guard accurately in the UI.

---

### TC-API-018 — POST /roles — 409 Duplicate Role Name Within Company

**Category:** API
**Priority:** High
**Preconditions:** Role "HR Manager" exists at TCS.
**Test Data:** `{"name": "HR Manager", "policyType": "health", "dimensions": [{"type": "vertical", "value": "Retail"}]}`.

**Test Steps:**
1. POST to create role "HR Manager" at TCS again.
2. Observe response.

**Expected Result:** HTTP 409; `{"statusCode": 409, "message": "A role with this name already exists for this company."}`. No duplicate role created.

---

*User Management Test Case Suite — ibp-service — v1.1 — 2026-05-08*