# PRD - Phase 1

## 1. Objective

To enable HR users to view, manage, and monitor employee enrolment and member data for policies through a centralized module. The module should provide comprehensive visibility of employees, dependents, enrolment status, and activity, along with operational controls such as access management, tagging, and data export.

## 1.1 Module Overview

- **Purpose:** Enable HR users to view, manage, and monitor employee enrolment and member data across policies through a centralized module with comprehensive employee drill-down capabilities.
- HR or IIRM Admin should have a feature to send welcome email reminders to employees with 2 options. 1-send to all and 2-Send to people who haven't logged in. In future we will have different cases to send reminders.
- **Business Value:** Gives HR administrators comprehensive visibility of employees, dependents, enrolment status, and activity, reducing manual tracking and improving policy management efficiency with detailed employee profiles.
- **User Value:** HR users can quickly identify enrolment gaps, manage access, tag priority members, upload bulk data, export member records, and drill down into individual employee details — all from a single screen.
- **Module Type:** Core
- **Phase 1 Scope:** Enrolment tab with KPI cards, employee listing table, filters, search, comprehensive employee actions (block/unblock access, VIP tagging, edit details, reset password), e-card view, dependent view, employee details drill-down, CSV export, and bulk upload entry point.

---

## 2. Scope & Boundaries

- **In Scope:**
    - Enrolment module accessible from the left menu with tabs: Enrolment, Endorsement, Employee Analytics (TBD), Reports (TBD)
    - KPI cards: Total Lives, Employees, Dependents, Total Additions, Total Deletions, Total Enrolled
    - Employee listing table with all defined columns including tags (VIP/Blocked)
    - Filters: Member Type, Status, Enrolment Status, Gender, Addition Type
    - Search by Employee Name, Email ID, Phone Number
    - Actions: Block Access, Tag as VIP, Edit Employee, Reset Password, View E-Card, View Dependents
    - Employee Details drill-down view with Quick Info and tab-wise sections
    - Bulk upload entry point for inception and endorsement files
    - CSV export of filtered/searched employee data

- **Out of Scope:**
    - Endorsement tab (separate specification)
    - Employee Analytics tab (TBD)
    - Reports tab (TBD)
    - Extend Window Period (TBD)

- **Dependencies:**
    - Policy module — to scope member data by selected policy
    - Enrolment data source — source of member records, statuses, and E-Card data
    - Authentication module — to enforce block access at login level

- **Dependents:**
    - Endorsement Management module — reads member baseline from Enrolment
    - Dashboard module — consumes enrolment counts and status for KPIs
    - Claim Intimation module — fetches active dependents from Enrolment

---

## 3. User Personas & Contexts

- **Persona:** HR Administrator
    - **Goals:** Monitor member enrolment health, manage employee portal access, identify unenrolled members, and maintain accurate member records.
    - **Context:** Accesses the Enrolment module when onboarding new employees, managing endorsements, or responding to employee portal access issues.
    - **Pain Points:** Currently tracks enrolment status through spreadsheets or separate TPA systems; has no single place to view, act on, and export member data.

---

## 4. User Stories

### HR Administrator

- **US-ENR-001:** As an HR user, I want to view employee and dependent enrolment details so that I can monitor enrolment status across the policy.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given the user is on the Enrolment tab, when the screen loads, then the system should display KPI cards (Total Lives, Employees, Dependents, Total Additions, Total Deletions, Total Enrolled) and the employee listing table with all required columns.
        - Given the KPI cards are displayed, when an employee is deleted from the policy, then the active KPIs must not include that employee.

- **US-ENR-002:** As an HR user, I want to filter and search employees so that I can find specific records easily.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given employee data exists, when the user applies one or more filters (Member Type, Status, Enrolment Status, Gender, Addition Type), then the listing should update dynamically to show only matching records.
        - Given the user searches by Employee Name, Email ID, or Phone Number, when results render, then the system should support partial and exact matches.
        - Given both filters and search are active simultaneously, when the listing renders, then results must satisfy all active criteria.

- **US-ENR-003:** As an HR user, I want to view dependents of an employee so that I can understand their coverage.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given an employee has dependents, when the user clicks the dependent count in the listing, then the system should display the list of dependents with their details.
        - Given an employee has no dependents, when the user views the employee row, then the dependent count column should show 0 and the click should either be disabled or show an empty state.

- **US-ENR-004:** As an HR user, I want to view an employee's e-card so that I can validate policy coverage.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given an employee has an e-card, when the user clicks "View" in the E-Card column, then the e-card should open in the same format as the Employee Portal e-card view.
        - Given an employee does not have an e-card, when the row is displayed, then the View option should be disabled or absent.

- **US-ENR-005:** As an HR user, I want to block an employee's portal access so that unauthorized login can be prevented.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given an employee is active, when the HR user clicks "Block Access" and confirms "Yes" in the popup, then the employee should be blocked from logging into the Employee Portal, and a "Blocked" tag should be displayed on their name in the listing.
        - Given the confirmation popup is shown, when the HR user selects "No", then the action is cancelled and the employee status remains unchanged.
        - Given a blocked employee attempts to log in, when login is attempted, then the system should display: "Your access is blocked. Please contact your HR."

- **US-ENR-006:** As an HR user, I want to tag an employee as VIP so that they can be identified easily.
    - **Priority:** Medium
    - **Acceptance Criteria:**
        - Given an employee exists, when the HR user clicks "Tag as VIP" and confirms "Yes", then the VIP tag should be displayed on the employee's name in the listing.
        - Given an employee is already tagged as VIP, when the listing renders, then the VIP tag should remain visible without any additional action required.
        - Given VIP tagging is applied, when the employee accesses the portal, then their system functionality should remain unchanged (visual indicator only).

- **US-ENR-007:** As an HR user, I want to export employee data to CSV so that I can use it for external reporting.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given filters and/or search are applied, when the user clicks the export button, then the system should download a CSV file containing only the currently visible (filtered/searched) data.
        - Given no filters are applied, when the user exports, then the full employee dataset for the selected policy should be included.

- **US-ENR-008:** As an HR user, I want to upload inception and endorsement files so that policy member data can be updated in bulk.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given the user clicks the bulk upload option, when the upload is successful, then the file should be stored, linked to the appropriate record type (inception or endorsement), and auditable with user, timestamp, and file reference.
        - Given the upload fails validation, when the user submits the file, then the system should display a descriptive error message indicating the reason for failure.

- **US-ENR-009:** As an HR user, I want to view detailed employee information so that I can access comprehensive employee data in one place.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given an employee exists in the listing, when I click on the Employee ID or Employee Name, then the system should open an Employee Details screen.
        - Given the Employee Details screen is opened, when it loads, then it should display a Quick Info section at the top showing Total Dependents, Total Claims, Net Premium, and Total Sum Insured.
        - Given the Employee Details screen is opened, when I view the tab sections, then I should see Personal Info, Dependents, Policy Enrolment, and Claim History tabs.
        - Given I am on the Personal Info tab, when it loads, then it should display Full Name, Employee ID, Date of Joining, Department, Email, Phone, Age, and Gender.
        - Given I am on the Dependents tab, when it loads, then it should display Name, Relationship, Gender, and Date of Birth for each dependent.
        - Given I am on the Policy Enrolment tab, when it loads, then it should display Policy Name, Sum Insured, Effective Date, Expiry Date, Policy Status, and Enrolment Status.
        - Given I am on the Claim History tab, when it loads, then it should display claim details similar to the Claims Corner in the Employee Portal.

- **US-ENR-010:** As an HR user, I want to edit employee details so that I can maintain accurate employee information.
    - **Priority:** Medium
    - **Acceptance Criteria:**
        - Given I have access to edit an employee, when I select the edit option, then I should be able to add or update the Alternate Phone number.
        - Given I have access to edit an employee, when I select the edit option, then I should be able to add or update the Alternate Mail ID.
        - Given I edit employee details, when I save changes, then the updated information should be reflected immediately in the system.

- **US-ENR-011:** As an HR user, I want to reset employee passwords so that employees can regain access to their portal.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given an employee needs password reset, when I click the Reset Password action, then the system should generate and send a reset password link to the employee.
        - Given the reset password link is sent, then the employee should receive the link with functionality similar to current reset password process.
        - Given the employee receives the reset link, when they use it, then they should be able to reset their password successfully.

---

## 5. Functional Requirements

### 5.1 Navigation & Structure
- **FR-ENR-001:** The Enrolment module must be accessible from the left menu and open a screen with tabs: Enrolment (active), Endorsement, Employee Analytics (TBD), Reports (TBD).

### 5.2 KPI Cards
- **FR-ENR-002:** The Enrolment tab must display six KPI cards with the following metrics:
    - **Total Lives**: Total active lives under the policy (Till Date)
    - **Employees**: Total employee count (Employee only count)
    - **Dependents**: Total dependent count (Only Dependent Counts)
    - **Total Additions**: Additions from inception + endorsements (Total Employee + Dependents)
    - **Total Deletions**: Deletions from endorsements (Total Employee + Dependents)
    - **Total Enrolled**: Total enrolled lives
    - All counts must reflect only active (non-deleted) members.

### 5.3 Bulk Upload
- **FR-ENR-003:** Support upload of Inception files and Endorsement files. Uploaded files should be stored and tracked with audit metadata.

### 5.4 Employee Listing Table
- **FR-ENR-004:** The employee listing table must include the following columns:
    - Employee Number
    - Employee Name (with tags: VIP / Blocked)
    - Gender
    - DOB (Month & Year only)
    - Age
    - Email
    - Mobile
    - Enrolment Status
    - Addition Type (Inception / Endorsement)
    - Sum Insured
    - Dependents (Display count, On click show dependent list)
    - E-Card (View option, Opens E-Card similar to Employee Portal)
    - Status (Active / Inactive)
    - Last Login (timestamp)
    - Actions

### 5.5 Filters
- **FR-ENR-005:** The system must provide filters for:
    - Member Type (Employee / Parent / Spouse / Partner / Siblings)
    - Status (Active / Inactive)
    - Enrolment Status (Enrolled / In Progress / Not Enrolled)
    - Gender (Male / Female / Others)
    - Addition Type (Inception / Endorsement)

### 5.6 Search
- **FR-ENR-006:** The system must provide a search bar accepting Employee Name, Email ID, and Phone Number with partial and exact match support.

### 5.7 Actions
- **FR-ENR-007:** Block Access Action:
    - CTA: Block Access
    - Show confirmation popup: "Do you wish to block access for Employee <Name>?"
    - Options: Yes / No
    - On Yes: Block user login, Show "Blocked" tag on employee name, Prevent login to employee portal
    - On No: Return to listing screen
    - Error message for blocked users: "Your access is blocked. Please contact your HR."

- **FR-ENR-008:** Tag as VIP Action:
    - CTA: Tag as VIP
    - Show confirmation popup: "Do you want to tag this employee as VIP?"
    - Options: Yes / No
    - On Yes: Tag employee as VIP, Display VIP tag in employee name column

- **FR-ENR-009:** Edit Employee Action:
    - Allow editing of following employee details:
        - Alternate Phone number (Add / Update)
        - Alternate Mail ID (Add / Update)

- **FR-ENR-010:** Reset Password Action:
    - Generate and share reset password link to the employee
    - Employee should receive reset password link similar to current functionality
    - Employee should be able to reset password using the link

### 5.8 Export
- **FR-ENR-011:** Export employee data as CSV file. Export should respect applied filters and search results.

### 5.9 Employee Details (Drill-down View)
- **FR-ENR-012:** When HR user clicks on Employee ID / Employee Name from the enrolment listing table, the system should open an Employee Details screen with:
    - **Quick Info Section (Top):**
        - Total Dependents
        - Total Claims
        - Net Premium
        - Total Sum Insured
    - **Tab-wise Sections:**
        - **Personal Info**: Full Name, Employee ID, Date of Joining, Department, Email, Phone, Age, Gender
        - **Dependents**: Name, Relationship, Gender, Date of Birth
        - **Policy Enrolment**: Policy Name, Sum Insured, Effective Date, Expiry Date, Policy Status, Enrolment Status
        - **Claim History**: Display claim details similar to the Claims Corner in the Employee Portal

---

## 6. Business Rules & Logic

- **BR-ENR-001:** Only active employees (non-deleted) should be counted in Total Lives and all KPI cards.
    - **Example:** An employee deleted via an endorsement must not appear in Total Lives.
    - **Edge Cases:** An employee pending deletion in an open endorsement should still be counted as active.

- **BR-ENR-002:** Dependent count must be derived from linked active dependents only.
    - **Example:** If a dependent is deleted, the count in the employee row must decrease accordingly.
    - **Edge Cases:** Dependents added in an open (unprocessed) endorsement should not yet be counted.

- **BR-ENR-003:** Blocked users must not be allowed to log in to the Employee Portal and must be visually marked with a "Blocked" tag in the HR listing.
    - **Example:** A blocked employee who attempts login sees: "Your access is blocked. Please contact your HR."
    - **Edge Cases:** If the HR user who blocked the employee loses access, the block must persist until explicitly removed by another authorized HR user.

- **BR-ENR-004:** VIP tagging is a visual indicator only and must not affect any system functionality, permissions, or data processing.

- **BR-ENR-005:** Enrolment status must reflect the real-time state: Enrolled, In Progress, or Not Enrolled.
    - **Example:** An employee who has completed enrolment steps should show "Enrolled"; one who has partially completed should show "In Progress".
    - **Edge Cases:** If enrolment status cannot be determined, display "Not Enrolled" as the default.

- **BR-ENR-006:** Addition Type must distinguish inception members from endorsement-added members, and this distinction must be preserved throughout the lifecycle of the member record.

- **BR-ENR-007:** Bulk uploads must maintain an audit log including user identity, timestamp, file name, and linked record type (inception or endorsement).

- **BR-ENR-008:** CSV export must include only the data currently visible after applying active filters and search; it must not bypass filter constraints.

- **BR-ENR-009:** Employee Details drill-down must display real-time data and maintain data consistency across all tabs.
    - **Example:** If an employee's dependent count changes, it must be reflected in both the listing table and the Employee Details Quick Info section.
    - **Edge Cases:** If claim data is unavailable, the Claim History tab should display an appropriate empty state.

- **BR-ENR-010:** Edit Employee functionality must validate data integrity and maintain audit trails for all changes.
    - **Example:** When alternate contact details are updated, the old values should be preserved in an audit log.
    - **Edge Cases:** If duplicate contact information is detected, the system should warn but allow the update.

- **BR-ENR-011:** Reset Password action must generate secure, time-limited reset links and log all password reset requests for security auditing.

---

## 7. User Interface Requirements

- **Screen:** Enrolment Tab — Navigation Structure
    - **Purpose:** Provide organized access to different enrolment-related functionalities.
    - **Key Elements:** Tab navigation with Enrolment (active), Endorsement, Employee Analytics (TBD), Reports (TBD).
    - **User Flow:** User selects Enrolment module from left menu → screen opens with Enrolment tab active by default.
    - **Validation Rules:** Only implemented tabs should be clickable; future tabs should be visually distinguishable as "TBD".

- **Screen:** Enrolment Tab — KPI Cards
    - **Purpose:** Provide a quick numerical summary of member activity for the selected policy.
    - **Key Elements:** Six metric tiles (Total Lives, Employees, Dependents, Total Additions, Total Deletions, Total Enrolled).
    - **User Flow:** Renders automatically on policy selection; no interaction required.
    - **Validation Rules:** Counts must exclude deleted members; display 0 for any metric with no data.

- **Screen:** Enrolment Tab — Employee Listing Table
    - **Purpose:** Display all members with their details, status, and available actions.
    - **Key Elements:** Table with all columns defined in FR-ENR-004, filter bar, search input, export button, bulk upload button.
    - **User Flow:** Table loads on tab open → user filters/searches → clicks actions as needed → exports if required.
    - **Validation Rules:** VIP and Blocked tags must be visually distinct; DOB must show Month & Year only (not full date); action buttons must be contextually enabled/disabled.

- **Screen:** Employee Details — Drill-down View
    - **Purpose:** Provide comprehensive view of individual employee information across multiple categories.
    - **Key Elements:** Quick Info section at top, tab navigation (Personal Info, Dependents, Policy Enrolment, Claim History), detailed information panels.
    - **User Flow:** User clicks Employee ID/Name from listing → Employee Details screen opens → user navigates between tabs as needed.
    - **Validation Rules:** Quick Info must display real-time calculated values; tabs must load data independently; claim history must match Employee Portal format.

- **Screen:** Dependent List Popup
    - **Purpose:** Show the list of active dependents for a selected employee.
    - **Key Elements:** Popup or inline expanded row with dependent name, relation, DOB, and status.
    - **User Flow:** User clicks dependent count → popup opens → user closes popup to return to listing.

- **Screen:** Action Confirmation Popups
    - **Purpose:** Confirm HR's intent before executing critical actions (Block Access, Tag as VIP).
    - **Key Elements:** Employee name in confirmation message, Yes and No buttons.
    - **User Flow:** HR clicks action → popup renders → HR confirms or cancels.
    - **Validation Rules:** Actions must not execute without explicit "Yes" confirmation.

- **Screen:** Edit Employee Modal
    - **Purpose:** Allow HR to update specific employee contact information.
    - **Key Elements:** Form fields for Alternate Phone number and Alternate Mail ID, Save/Cancel buttons.
    - **User Flow:** HR clicks Edit action → modal opens with current values → HR modifies fields → saves or cancels.
    - **Validation Rules:** Form validation must ensure proper email and phone formats; changes must be immediately reflected in the listing.

---

## 8. Data Requirements

- **Input Data:**
    - Member records (employees and dependents) from the enrolment data source with status, type, enrolment state, and contact details
    - E-Card data linked to each active member
    - Last login timestamps from the authentication system
    - Policy and component data for context scoping
    - Employee personal information (Full Name, Employee ID, Date of Joining, Department)
    - Dependent relationship and demographic data
    - Policy enrolment details (Policy Name, Sum Insured, Effective Date, Expiry Date, Policy Status)
    - Claim history data compatible with Employee Portal Claims Corner format

- **Output Data:**
    - Rendered KPI card values
    - Filtered and paginated employee listing
    - Dependent lists per employee
    - E-Card view per employee
    - Employee Details drill-down view with Quick Info and tabbed sections
    - CSV export file
    - Block/VIP status updates written back to the member record
    - Updated alternate contact information (phone/email)
    - Password reset confirmation and audit logs

- **Stored Data:**
    - Block Access status persisted on the member record
    - VIP tag persisted on the member record
    - Bulk upload file records stored with audit metadata
    - Employee alternate contact information updates with audit trail
    - Password reset request logs with timestamps and user information

---

## 9. Integration Specifications

- **APIs/Interfaces:**
    - `GET /enrolment/kpis?policyId={id}` — returns six KPI card values
    - `GET /enrolment/members?policyId={id}&filters=...` — returns paginated member listing
    - `GET /enrolment/members/{id}/dependents` — returns dependent list for a member
    - `GET /enrolment/members/{id}/ecard` — returns e-card data for a member
    - `GET /enrolment/members/{id}/details` — returns comprehensive employee details for drill-down view
    - `GET /enrolment/members/{id}/personal-info` — returns personal information tab data
    - `GET /enrolment/members/{id}/policy-enrolment` — returns policy enrolment tab data
    - `GET /enrolment/members/{id}/claim-history` — returns claim history tab data
    - `POST /enrolment/members/{id}/block` — blocks portal access for a member
    - `POST /enrolment/members/{id}/vip` — tags a member as VIP
    - `PUT /enrolment/members/{id}/contact-info` — updates alternate phone and email
    - `POST /enrolment/members/{id}/reset-password` — initiates password reset process
    - `GET /enrolment/export?policyId={id}&filters=...` — returns CSV export
    - `POST /enrolment/upload` — handles bulk file upload with metadata

- **Events:**
    - Block Access action triggers an auth system event to revoke the member's login session immediately.
    - Password reset action triggers email notification to employee with secure reset link.
    - Employee contact information updates trigger audit log events.

- **Data Flow:**
    - HR selects policy → `policyId` passed to KPI and listing APIs → screen renders.
    - HR applies filters/search → parameters added to listing query → table re-renders.
    - HR clicks Employee ID/Name → `GET /enrolment/members/{id}/details` → Employee Details screen opens.
    - HR navigates between tabs in Employee Details → respective tab APIs called → tab content renders.
    - HR edits employee → `PUT /enrolment/members/{id}/contact-info` → listing refreshes.
    - HR resets password → `POST /enrolment/members/{id}/reset-password` → reset email sent.

- **Error Handling:**
    - If the block action fails, display an error message and do not update the listing tag.
    - If e-card data is unavailable for a member, the View button must be disabled.
    - If Employee Details data is unavailable, show appropriate error states for each tab.
    - If password reset fails, display error message and provide retry option.

---

## 10. Performance & Quality Requirements

- **Performance:**
    - Employee listing must load within 3 seconds for datasets up to 5,000 members.
    - Filter and search changes must update the listing within 1 second.
    - CSV export must initiate within 3 seconds for datasets up to 10,000 rows.

- **Reliability:**
    - Block Access and VIP Tag actions must be idempotent; repeated submissions must not create duplicate state changes.

- **Security:**
    - Member data must be scoped to the HR user's RBAC access level (Branch / Unit / Location / All).
    - Block Access must propagate to the authentication system in real-time to prevent login immediately after action.
    - All API endpoints must require authenticated sessions.

- **Usability:**
    - VIP and Blocked tags must be visually distinct and clearly readable in the table.
    - DOB must display Month & Year only to protect PII.

---

## 11. Success Metrics

- **Business Metrics:**
    - Reduction in time HR spends tracking enrolment status through external tools.
    - Increase in timely identification and resolution of unenrolled employees.

- **User Metrics:**
    - % of HR sessions that include an Enrolment module visit.
    - Average time to locate and act on a specific employee record.

- **Technical Metrics:**
    - API response time for member listing under 3 seconds at p95.
    - Block Access action success rate above 99.9%.

- **Adoption Metrics:**
    - % of HR users who use filter or search at least once per session.
    - Bulk upload usage frequency per policy cycle.

---

## 12. Edge Cases & Error Scenarios

- **Error Case 1:** Enrolment data source is unavailable.
    - **User Experience:** KPI cards and listing show an error state with a retry option.
    - **System Behavior:** No stale data is displayed; error is scoped to the Enrolment tab only.

- **Error Case 2:** Block Access API call fails after HR confirms.
    - **User Experience:** Error message shown: "Failed to block access. Please try again."
    - **System Behavior:** Listing tag is not updated; employee's access remains unchanged.

- **Error Case 3:** Bulk upload file fails validation.
    - **User Experience:** Error message with specific failure reason (e.g., missing mandatory columns, invalid format).
    - **System Behavior:** File is not stored; no partial records are created.

- **Error Case 4:** Employee Details data is partially unavailable.
    - **User Experience:** Affected tabs show specific error states while other tabs continue to function normally.
    - **System Behavior:** Quick Info section displays available metrics; unavailable data shows "N/A" or empty state.

- **Error Case 5:** Password reset email delivery fails.
    - **User Experience:** Error message: "Failed to send reset email. Please verify employee's email address and try again."
    - **System Behavior:** Reset request is logged but not processed; employee's current password remains active.

- **Error Case 6:** Edit Employee API call fails during save.
    - **User Experience:** Error message displayed with option to retry; form data is preserved.
    - **System Behavior:** No changes are persisted; original contact information remains unchanged.

- **Edge Case 1:** Employee has zero dependents.
    - **Business Logic:** Dependent count shows 0; clicking the count shows an empty state or the click is disabled.
    - **User Impact:** HR can confirm the employee has no dependents on record.

- **Edge Case 2:** Employee is both VIP-tagged and Blocked.
    - **Business Logic:** Both tags are displayed simultaneously; VIP status does not override block access.
    - **User Impact:** HR can identify priority employees who are currently blocked.

- **Edge Case 3:** Employee Details opened for recently deleted employee.
    - **Business Logic:** Employee Details screen shows archived data with clear indication of "Inactive" status.
    - **User Impact:** HR can access historical data for audit purposes.

- **Edge Case 4:** Multiple HR users attempt to edit the same employee simultaneously.
    - **Business Logic:** Last saved changes take precedence; system logs all concurrent edit attempts.
    - **User Impact:** HR users receive warning about concurrent edits and can choose to overwrite or cancel.

- **Edge Case 5:** Employee has no claim history.
    - **Business Logic:** Claim History tab displays empty state with appropriate message.
    - **User Impact:** HR can confirm no claims have been filed by the employee.
    - **Business Logic:** Both tags are displayed simultaneously on the employee name.
    - **User Impact:** HR can see both statuses at a glance without ambiguity.

- **Edge Case 3:** HR user searches for a term that matches no records.
    - **Business Logic:** Empty state message shown: "No members found matching your search."
    - **User Impact:** Export button is disabled; no CSV is generated for empty results.

---

## 13. Future Considerations

- **Enhancement 1:** Edit Employee details — allow HR to update specific fields (scope and fields TBD).
- **Enhancement 2:** Reset Password — allow HR to trigger a password reset for an employee.
- **Enhancement 3:** Extend Window Period — allow HR to extend the enrolment window for individual employees.
- **Enhancement 4:** Employee Analytics tab — aggregated demographic and enrolment analytics (TBD).
- **Enhancement 5:** Reports tab — downloadable and scheduled report generation for enrolment data (TBD).

---

## 14. Acceptance Criteria Summary

- [ ] Enrolment module is accessible from the left menu with Enrolment and Endorsement tabs.
- [ ] KPI cards display correct active-only counts for all six metrics.
- [ ] Employee listing table displays all required columns with VIP and Blocked tags where applicable.
- [ ] Filters (Member Type, Status, Enrolment Status, Gender, Addition Type) work individually and in combination.
- [ ] Search supports Employee Name, Email ID, and Phone Number with partial and exact matches.
- [ ] Clicking dependent count displays the active dependent list.
- [ ] Clicking E-Card View opens the e-card in Employee Portal format.
- [ ] Block Access shows confirmation popup, blocks login on confirmation, and displays Blocked tag.
- [ ] Tag as VIP shows confirmation popup, displays VIP tag on confirmation, with no functional impact.
- [ ] CSV export downloads the filtered/searched dataset.
- [ ] Bulk upload stores files with user, timestamp, and file reference for auditability.
- [ ] All data is scoped to the HR user's RBAC access level.

---

## 15. Open Questions

- **Question 1:** What fields should be included in the dependent list popup — only name and relation, or also DOB, gender, and enrolment status?
- **Question 2:** Should the Block Access action also send a notification to the employee (email/SMS)?
- **Question 3:** Is there an "Unblock" action required, and if so, does it follow the same confirmation pattern?
- **Question 4:** What is the maximum file size and accepted formats for bulk upload?
- **Question 5:** Should DOB display only Month & Year across all views, or only in the listing table (with full DOB visible in a detail view)?
