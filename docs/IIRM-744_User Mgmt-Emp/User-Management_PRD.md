# Employee Management — Product Requirements Document

**Module:** IIRM-744_User-Mgmt-Emp  
**Module Code:** EMP  
**Product:** iWork Edge — Insurance CRM (Admin Module)  
**Client:** IIRM  
**Document type:** PRD (Stage 40a)  
**Status:** Draft  
**Date:** 2026-05-26  
**Author:** Nithin Krishna Sirigiri  
**Source:** Reverse-engineered from live implementation at `https://iworkedge.indiainsure.com/employee`

---

## 1. Purpose

The Employee Management module is the **user directory and organisational backbone** of iWork Edge. It lives under the Admin Module and is the single authoritative place where platform administrators register, organise, and maintain all human users of the system — both internal staff and client-facing personnel.

Every other module that involves a named user (Roles & Permissions, Opportunity Management, Service Portfolio, Approvals, My Mails, IBP Policy Enrollment) depends on a record existing here first. The Employee record is also the identity anchor: creating an employee automatically creates a linked User account with login credentials.

This PRD is reverse-engineered from the live `org-service` backend and the iWork Edge frontend. It documents what the system currently does and formalises it into a verifiable product contract. It is read by product, development, and QA teams and is the client sign-off document for scope and acceptance criteria.

---

## 2. Scope

### In scope

- View and search the employee directory (smart search, column filters by designation and organisation)
- KPI stat card showing total active employee count
- Add a new employee with full profile including organisational hierarchy placement
- Assign one or more roles to an employee during creation and edit
- Assign reportees (direct reports) to an employee
- Edit an existing employee's profile
- View an employee's full details including their reporting manager and direct reports
- Soft-delete (deactivate) an employee with ownership delegation
- PII masking of email and mobile in the list view, with audited reveal
- Rebuild the organisational reporting hierarchy
- Save per-user table view preferences (column order, filters)
- Password reset — trigger reset email for any employee
- IBP-specific password reset flow
- Bulk employee creation via inception endpoint (admin/system use)

### Out of scope (deferred)

| Item | Reason |
|---|---|
| CSV-based bulk import via UI | No UI surface exists; inception endpoint is API-only |
| Org chart graphical visualisation | Hierarchy rebuild is backend recalculation only; no tree UI |
| Employee self-service profile edits | IBP Employee Portal scope |
| HRMS integration (SAP, Workday, etc.) | Phase 2 |
| Document management per employee | Separate Document Management sub-module in Admin |
| Two-factor authentication setup | Handled by Auth module |
| Leave management and attendance | Out of scope for iWork Edge |
| Payroll data | Out of scope |

---

## 3. User Roles

Role definitions and permission flags are managed in the Roles module. This section records the access levels relevant to Employee Management only.

| Role | Access Level | Notes |
|---|---|---|
| System Admin | Full CRUD + hierarchy rebuild + password reset | Platform super-user; always has access |
| HR Admin | Full CRUD + password reset | Cannot trigger hierarchy rebuild |
| Team Lead / Manager | Read-only | Can search and view; cannot create or edit |
| Regular User | No access | Module not visible in their navigation |

Route protection uses `VIEW_EMPLOYEE` and `CREATE_EMPLOYEE` permission feature keys.

---

## 4. Employee Data Model

The full employee record is richer than the 5 columns visible in the list. Understanding the complete model is essential for scoping the form and the data contract.

### 4.1 Core Identity Fields

| Field | Required | Constraints | PII |
|---|---|---|---|
| `iirmEmpId` | Yes | Unique, max 10 chars | No |
| `salutation` | No | Lookup (Mr, Ms, Dr, etc.) | No |
| `firstName` | Yes | 3–100 chars, alphabets only | No |
| `lastName` | Yes | 1–100 chars, alphabets only | No |
| `emailId` | Yes | Valid email, unique, encrypted | Yes — masked in UI |
| `mobile` | Yes | 10–12 digits, unique, encrypted | Yes — masked in UI |
| `loginName` | No | Defaults to email if not provided | No |
| `dateOfBirth` | No | Cannot be a future date, encrypted | Yes |
| `dateOfJoining` | No | Cannot be a future date | No |
| `profileUrl` | No | URL to profile photo | No |

### 4.2 Organisational Placement Fields

These fields control where an employee sits in the org tree. Their required/optional status depends on the organisation.

| Field | Required (non-IIRM Holdings) | Required (IIRM Holdings) |
|---|---|---|
| `organisationId` | Yes | Yes |
| `sbuId` (Strategic Business Unit) | Yes | No |
| `verticalId` | Yes | No |
| `departmentId` | Yes | No |
| `designationId` | Yes (from master) | Yes (from master) |
| `branchId` | Yes | No |

### 4.3 Hierarchy Fields

| Field | Notes |
|---|---|
| `reportingManagerEmployeeId` | FK to another Employee; the direct manager |
| `reportingUserId` | FK to the User record of the reporting manager |
| `reportees` | OneToMany self-reference; employees who report to this record |

### 4.4 Status

| Status Value | Meaning |
|---|---|
| `ACTIVE` | In service; can log in |
| `INACTIVE` | Deactivated; cannot log in |
| `LEAVE` | On leave; access status depends on configuration |

### 4.5 System and Audit Fields

`createdAt`, `updatedAt`, `createdBy`, `updatedBy`, `deletedAt` (soft delete). The entity carries an `@Auditable()` decorator — all creates and updates are written to the activity history log.

---

## 5. User Stories

Each story traces to a feature area. Stories are independent deliverables; each must have passing ACs before it ships.

### 5.1 Employee Directory

**US-EMP-001 — View Employee List**  
As an Admin, I want to see a paginated list of all employees with key identifiers and organisational attributes so that I can scan the directory and act on any record.

**US-EMP-002 — Smart Search**  
As an Admin, I want to type a keyword in the smart search bar and have the list filter by first name so that I can locate an employee quickly without knowing their exact ID.

**US-EMP-003 — Filter by Designation and Organisation**  
As an Admin, I want to filter the employee list by Designation or Organisation from the filter panel so that I can scope the list to a specific team or role group.

**US-EMP-004 — Total Employee Stat Card**  
As an Admin, I want to see the total active employee count in a KPI card so that I have an immediate sense of platform user base size without running a report.

**US-EMP-005 — Navigate to Employee Details**  
As an Admin, I want to click on an Employee ID in the list to open that employee's full profile so that I can review all attributes and relationships in one view.

### 5.2 Employee Lifecycle

**US-EMP-006 — Add Employee**  
As a System Admin or HR Admin, I want to create a new employee record by filling in a multi-section form so that the new user is onboarded to the platform with a linked login account.

**US-EMP-007 — Assign Roles During Creation**  
As an Admin, I want to assign one or more system roles to an employee while creating or editing their record so that access control is set at the time of onboarding, not as a separate step.

**US-EMP-008 — Access Level Warning for Elevated Roles**  
As an Admin, I want to see a confirmation warning when I assign a Leadership or Super User role to an employee so that I consciously acknowledge the elevated access being granted before confirming.

**US-EMP-009 — Assign Reportees**  
As an Admin, I want to add direct reports to an employee's profile so that the reporting hierarchy is correctly represented in the system.

**US-EMP-010 — Edit Employee Profile**  
As an HR Admin or System Admin, I want to edit any field on an employee's profile so that I can reflect organisational changes, correct data errors, or update contact details.

**US-EMP-011 — View Employee Details**  
As an Admin, I want to open a full details page for any employee that shows their profile summary, organisational placement, reporting manager, and reportees so that I have a complete relationship view.

**US-EMP-012 — Delete (Soft-Deactivate) Employee**  
As a System Admin, I want to delete/deactivate an employee and designate a delegate owner and a new manager for their reportees so that work ownership is transferred before the record is deactivated.

**US-EMP-013 — PII Reveal**  
As an Admin, I want to reveal a masked email or mobile number by clicking an eye icon so that I can view the actual value when needed, with the reveal action logged for audit.

### 5.3 Hierarchy

**US-EMP-014 — Rebuild Reporting Hierarchy**  
As a System Admin, I want to trigger a hierarchy rebuild with a confirmation step so that the system recalculates all reporting chains after structural changes, keeping downstream modules (Approvals, Notifications) consistent.

### 5.4 View Customisation & Preferences

**US-EMP-015 — Save Custom Table View**  
As an Admin, I want to select which columns are visible and save that configuration so that every time I return to the employee list, my preferred layout is retained.

**US-EMP-016 — Persist Smart Search and Filter State**  
As an Admin, I want my search keyword and applied filters to be preserved when I navigate away and return (e.g. after viewing an employee's details) so that I do not have to re-enter my filter context.

### 5.5 Password Management

**US-EMP-017 — Trigger Password Reset Email**  
As a System Admin, I want to trigger a password reset email for any employee so that I can assist users who are locked out without requiring them to go through self-service.

---

## 6. Business Rules

Business rules are enforced by the backend and validated by the frontend. Frontend validation is a UX convenience; backend validation is the authoritative gate.

**BR-EMP-001 — IIRM Employee ID Uniqueness**  
`iirmEmpId` must be unique platform-wide. Creation or update must be rejected if the submitted ID matches an existing record (active or inactive).

**BR-EMP-002 — Email Uniqueness**  
`emailId` must be unique across all employee records. Email is the login credential anchor; duplicate emails create ambiguous authentication.

**BR-EMP-003 — Mobile Uniqueness**  
`mobile` must be unique across all employee records.

**BR-EMP-004 — Name Character Constraints**  
`firstName`: 3–100 characters, alphabets only. `lastName`: 1–100 characters, alphabets only.

**BR-EMP-005 — Mobile Digit Constraint**  
Mobile must be 10–12 digits, optionally prefixed with `+`.

**BR-EMP-006 — Organisation-Dependent Required Fields**  
If the selected organisation is `iirm_holdings` (matched by organisation key), then SBU, Vertical, Department, and Branch are optional. For all other organisations, these four fields are required.

**BR-EMP-007 — Cascading Dropdown Logic**  
Organisational placement fields have a cascade dependency: Organisation → SBU → Vertical → Department. Branch depends only on Organisation. When a parent field changes, all dependent child fields must be cleared and their options refetched.

**BR-EMP-008 — Cannot Report to Self**  
An employee cannot be set as their own reporting manager. The Reporting Manager picker must exclude the employee being edited.

**BR-EMP-009 — Leadership/Super User Role Warning**  
When an admin assigns a role with key `ROLE_LEADERSHIP` or `ROLE_SUPER_USER` (or whose name contains "LEADERSHIP" or "SUPER USER"), the system must display an access level confirmation modal before saving. The modal text: _"Assigning the Leadership or Super User role will give the user complete access to all information. Do you want to proceed?"_

**BR-EMP-010 — Soft Delete with Delegation**  
Deleting an employee does not remove the record (soft delete via `deletedAt`). The delete action must collect two delegation parameters: `delegateOwnerUserId` (who inherits the employee's owned work) and `newManagerUserId` (who becomes the manager of the deleted employee's reportees).

**BR-EMP-011 — Auto-Create User Account on Employee Creation**  
Creating an employee automatically creates a linked User record. The login name defaults to the email address if not explicitly provided. A password is auto-generated.

**BR-EMP-012 — Date Constraints**  
Date of Birth and Date of Joining cannot be future dates. The system must reject saves where either date is after today.

**BR-EMP-013 — PII Encryption and Masking**  
`emailId`, `mobile`, and `dateOfBirth` are encrypted at rest via the `@SensitiveField` decorator. In the list and details views, email and mobile are displayed masked (e.g. `a***@example.com`). Reveal requires an explicit user action and is logged to the audit trail via the config-service reveal endpoint.

**BR-EMP-014 — Status Values**  
Employee status is a three-value lookup: `ACTIVE`, `INACTIVE`, `LEAVE`. The KPI stat card counts only `ACTIVE` employees.

**BR-EMP-015 — Hierarchy Rebuild Scope**  
The rebuild operation recalculates the full org tree across all active employees. It is idempotent. The UI must show a loader with the message _"Rebuilding employee hierarchy, it may take few minutes…"_ for the duration of the operation.

**BR-EMP-016 — Saved View is User-Scoped**  
Table view preferences (column visibility, order, filters) are stored per user account under entity key `EMPLOYEE`. One admin's saved view does not affect another's.

**BR-EMP-017 — Roles are Required**  
At least one role must be assigned to an employee before the record can be saved.

---

## 7. Acceptance Criteria

**AC-EMP-001 — List loads with correct columns** _(US-EMP-001)_  
Given the Admin navigates to `/employee`  
When the page loads  
Then a table displays paginated employee records with at minimum these columns: Employee ID, First Name, Last Name, Email (masked), Mobile (masked), Designation, Organisation, SBU, Vertical, Department, Branch, Status, Role(s)  
And the stat card shows the count of employees with status `ACTIVE`

**AC-EMP-002 — Smart search filters by first name** _(US-EMP-002)_  
Given the employee list is visible  
When the Admin types `Rao` in the smart search bar  
Then the list updates to show only records where First Name contains `Rao` (case-insensitive)  
And the active employee stat card count is unaffected by the search filter

**AC-EMP-003 — Filter panel narrows by designation and organisation** _(US-EMP-003)_  
Given the filter panel is open  
When the Admin applies a Designation filter  
Then only employees with that designation are shown  
And a visual indicator (filter chip or icon badge) confirms an active filter

**AC-EMP-004 — Add employee creates record and user account** _(US-EMP-006, BR-EMP-011)_  
Given the Admin fills all required fields with valid data and submits  
When the form is saved  
Then a new employee record appears in the list  
And a linked User record with auto-generated credentials is created  
And the active employee count increments by 1  
And a success toast is shown

**AC-EMP-005 — Duplicate IIRM Employee ID rejected** _(US-EMP-006, BR-EMP-001)_  
Given the Admin enters an `iirmEmpId` that already exists on another record  
When they attempt to save  
Then the system rejects the submission with an inline error on the Employee ID field  
And no record is created

**AC-EMP-006 — Organisation-dependent required fields** _(US-EMP-006, BR-EMP-006)_  
Given the Admin selects the IIRM Holdings organisation (`iirm_holdings` key)  
Then SBU, Vertical, Department, and Branch fields are not required and can be left blank  
Given the Admin selects any other organisation  
Then SBU, Vertical, Department, and Branch are required and submission is blocked if any are empty

**AC-EMP-007 — Cascading dropdowns clear on parent change** _(US-EMP-006, BR-EMP-007)_  
Given the Admin has selected Organisation X and SBU Y  
When the Admin changes the Organisation to Organisation Z  
Then SBU, Vertical, Department are cleared  
And their dropdown options refresh to those belonging to Organisation Z

**AC-EMP-008 — Leadership role assignment triggers warning** _(US-EMP-007, US-EMP-008, BR-EMP-009)_  
Given the Admin selects a role with key `ROLE_LEADERSHIP` or `ROLE_SUPER_USER`  
When they attempt to save  
Then a confirmation modal appears with the text about complete access being granted  
And the record is only saved after the Admin confirms the modal

**AC-EMP-009 — Cannot assign self as reporting manager** _(US-EMP-006, BR-EMP-008)_  
Given the Admin is editing employee record X  
When the Reporting Manager dropdown is rendered  
Then employee X is not present as an option

**AC-EMP-010 — PII reveal is audited** _(US-EMP-013, BR-EMP-013)_  
Given email or mobile is displayed as masked in the list  
When the Admin clicks the eye icon to reveal  
Then the actual value is displayed for that cell  
And the reveal action is recorded in the audit trail via the config-service

**AC-EMP-011 — Hierarchy rebuild with confirmation and loader** _(US-EMP-014, BR-EMP-015)_  
Given the Admin clicks "Rebuild hierarchy"  
When the confirmation modal is accepted  
Then a loader with the message _"Rebuilding employee hierarchy, it may take few minutes…"_ is shown  
And on success, a toast with _"Hierarchy rebuilt successfully."_ is shown  
And on failure, a toast with _"Failed to rebuild hierarchy."_ is shown

**AC-EMP-012 — Soft delete requires delegation** _(US-EMP-012, BR-EMP-010)_  
Given the Admin initiates a delete on an employee  
When the delete action is confirmed  
Then the system collects `delegateOwnerUserId` and `newManagerUserId` before proceeding  
And the record's `deletedAt` is set (soft delete) — the record is not physically removed  
And the employee count decrements by 1

**AC-EMP-013 — Saved view persists across sessions** _(US-EMP-015, BR-EMP-016)_  
Given the Admin saves a custom column configuration  
When they log out and log back in  
Then the employee list renders with their saved column settings  
And a different Admin's session is unaffected

**AC-EMP-014 — Filter state preserved on return navigation** _(US-EMP-016)_  
Given the Admin has applied a filter and navigated to an employee's detail page  
When they navigate back to the list  
Then the previously applied filter and search keyword are still active

**AC-EMP-015 — Employee details page shows all sections** _(US-EMP-011)_  
Given the Admin clicks on an Employee ID in the list  
When the details page loads  
Then a summary card shows Name, Employee ID, Department, Designation, and assigned Roles  
And an Employee Info section shows all profile and organisational fields  
And a Reporting To section shows the manager's equivalent details  
And a Reportees section shows a grid of all direct reports

---

## 8. Data Contract

### 8.1 Employee Record Shape

The canonical shape consumed and produced by this module. Implementation types live in `apps/services/service-lib/src/lib/entities/employee.entity.ts` and the DTO files in `apps/services/org-service/src/app/employee/dto/`.

| Field | Type | Notes |
|---|---|---|
| `employeeId` | UUID (PK) | System-generated |
| `iirmEmpId` | string (max 10) | Business-defined, unique |
| `salutationLid` | FK → LookUp | Optional |
| `firstName` | string | Required |
| `lastName` | string | Required |
| `emailId` | string (encrypted) | Required, unique |
| `mobile` | string (encrypted) | Required, unique |
| `loginName` | string | Defaults to email |
| `dateOfBirth` | date (encrypted) | Optional |
| `dateOfJoining` | date | Optional |
| `profileUrl` | string | Optional |
| `organisationId` | FK → Organisation | Required |
| `sbuId` | FK → OrgSbu | Conditional |
| `verticalId` | FK → OrgVertical | Conditional |
| `departmentId` | FK → OrgDepartment | Conditional |
| `branchId` | FK → OrgBranch | Conditional |
| `designationId` | FK → OrgDesignation | Required |
| `reportingManagerEmployeeId` | FK → Employee (self) | Optional |
| `statusLid` | FK → LookUp (ACTIVE/INACTIVE/LEAVE) | Required |
| `userId` | FK → User | System-set on creation |
| `createdAt`, `updatedAt` | timestamps | System-set |
| `createdBy`, `updatedBy` | string | Audit |
| `deletedAt` | timestamp | Soft delete; null = active |

### 8.2 API Endpoint Summary

All endpoints under `{orgServiceUrl}/employee`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/employee` | Paginated list; query: page, limit, searchBy, searchId, sort |
| POST | `/employee` | Create employee + auto-create User |
| GET | `/employee/{employeeId}` | Single employee with relations |
| PUT | `/employee/{employeeId}` | Update employee |
| DELETE | `/employee/{employeeId}` | Soft delete; query: delegateOwnerUserId, newManagerUserId |
| GET | `/employee/list-of-values` | Name-value pairs for dropdowns |
| POST | `/employee/rebuild-hierarchy` | Recalculate full org tree |
| GET | `/employee/hierarchy` | Flat hierarchy array |
| GET | `/employee/all-users-hierarchy` | Full hierarchical tree structure |
| POST | `/employee/password-reset` | Trigger reset email |
| GET | `/employee/password-reset/validate` | Validate reset token |
| POST | `/employee/{emailId}/password-reset-mail` | Send reset email by email address |
| POST | `/employee/ibp-password-reset` | IBP-specific password reset |
| POST | `/employee/inception-create-employee` | Bulk create (array payload) |

### 8.3 Master Data Dependencies

The Add/Edit form fetches options from these master endpoints:

| Dropdown | Endpoint |
|---|---|
| Roles | `GET /master/role?page=1&limit=100` |
| Organisation | `GET /master/organisation` |
| Designation | `GET /master/org_designation` |
| SBU | `GET /master/org_sbu?searchBy=organisationId` |
| Vertical | `GET /master/org_vertical?searchBy=sbuId` |
| Department | `GET /master/org_department?searchBy=verticalId` |
| Branch | `GET /master/org_branch?searchBy=organisationId` |
| Reporting Manager | `GET /employee/list-of-values` (excludes self) |

### 8.4 Cross-Module Contracts

| Downstream Module | Dependency | Contract |
|---|---|---|
| ROLE-PERMISSION-LOGOUT | Employee deactivation invalidates sessions | EMP emits status change; auth module force-logs out |
| Opportunity Management | BD exec assignment uses employee records | Read from EMP directory |
| Approvals | Reporting hierarchy used for escalation routing | EMP hierarchy rebuilt; Approvals reads it |
| My Mails / Notifications | `emailId` used for delivery | EMP is canonical email store |
| IBP Policy Enrollment | `PolicyEnrollmentEmployee` table FKs to employee | EMP is the identity source for enrollment |
| Activity History | All EMP creates/updates written via `@Auditable()` | Audit log consumers read from activity_history |
| Config Service | PII reveal events logged | EMP calls reveal endpoint; config-service writes audit |

---

## 9. Open Questions

| ID | Question | Owner | Priority |
|---|---|---|---|
| OQ-EMP-001 | What is the expected maximum employee count per organisation? This informs pagination defaults and hierarchy rebuild performance SLA. | Engineering | High |
| OQ-EMP-002 | Should the `LEAVE` status restrict login access the same way `INACTIVE` does, or is the user still allowed to log in while on leave? | Product / IIRM Client | High |
| OQ-EMP-003 | Is the `delegateOwnerUserId` and `newManagerUserId` collection on delete done via a modal form before confirming the delete? The current API accepts them as query params — confirm the UX flow. | Product / UX | High |
| OQ-EMP-004 | The `inception-create-employee` bulk endpoint exists but has no UI. Is there a planned admin screen for bulk import, or is this permanently an API-only / ops tool? | Product | Medium |
| OQ-EMP-005 | Should inactive/deleted employees appear in the list when an Admin applies a status filter, or are they permanently hidden from the UI? | Product / UX | Medium |
| OQ-EMP-006 | What is the complete set of salutation lookup values (Mr, Ms, Dr, …)? Needed to validate the dropdown options against the LookUp table. | IIRM Client | Low |
| OQ-EMP-007 | Is there a "Reset to default view" action for saved table views? Current code saves preferences but no reset behaviour is defined. | UX | Low |

---

## 10. Approval

_Leave blank. Client sign-off required before Stage 40b (TRD) begins._

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```
