# HR Portal — Employee Support

**Document Version:** 2.0
**Date:** 2026-05-04
**Author:** IIRM Product Team
**Jira Reference:** IIRM-10102
**Related Documents:**

- SDS: `IBP_HR Portal - Employee Support-SDS.md`

> This document captures business requirements only. UI layout, component behaviour, navigation patterns, field mappings, and interaction details are in the SDS. This document does not prescribe implementation approach — that is the TRD's responsibility.

---

## Relationship to Enrollment Module

> **Note on spec origin:** The per-employee action capabilities described in this PRD (Reset Password, Extend Enrollment Window, email communications) were previously described under the HR Analytics Enrollment Module PRD (§7.1). Those actions have been extracted and relocated here because Employee Support is the correct owner: it is a dedicated operational surface for HR administrators to act on individual employees, independent of report generation.
>
> The existing enrollment listing page (`HRPortalEnrolmentV2` at `/hr-portal/enrollment`) implements a functionally similar employee table with an action menu (Reset Password, Send Reminder, Block Access). That component is the **visual reference pattern** for the Employee Support listing — the column structure (Emp ID, Name, Gender, DOB, Email, Enroll Status, Actions column), action menu styling, e-card interaction, and filter bar should all inform the Employee Support implementation. **Employee Support is a new, separately routed page** — it is not a repurposing of `HRPortalEnrolmentV2`.

---

## 1. Objective

The Employee Support module gives HR administrators a single location to view all employees under their company, understand the state of the workforce at a glance, and take direct action on individual employees. The two core capabilities are:

- A KPI-level summary of the current employee base
- A per-employee listing with direct access to outreach email actions and account deactivation

Deactivation is restricted to the HR Administrator role. All email actions are available to authorized portal roles with access to this module. Filters in the employee listing are not hardcoded — they are derived from the parameters selected in the company's policy configuration.

---

## 2. Business Rules and Constraints

| Rule | Description |
| --- | --- |
| Company scoping | All employee data is scoped to the authenticated user's company via JWT. The company ID is not user-changeable. Cross-company data access is prevented at the data layer. |
| Dynamic filter source | The filter dimensions available in the employee listing are driven exclusively by the parameters selected in the company's policy configuration. No filter dimension is hardcoded. |
| Policy configuration dependency | Filters are derived from policy configuration at listing load time. If no parameters are configured in the policy, no filter dimensions are shown. |
| Email actions require a registered email address | All five email actions can only be dispatched to the employee's registered email address on file. If no address exists for an employee, all email actions for that employee are disabled. |
| Email actions are stateless triggers | Each email action is a discrete one-time send request. This module does not schedule, batch, or track delivery outcomes. A service acceptance confirmation is treated as a successful dispatch. |
| Email actions blocked on deactivated employees | Once an employee is deactivated, all five email actions are disabled for that employee. This applies regardless of how or when the inactive status was set (in-session or pre-existing). |
| Deactivation is restricted to the HR Administrator role | Only users with the HR Administrator role may trigger the Deactivate action. Other roles with access to this module may view the listing and trigger email actions but cannot deactivate employees. |
| Deactivation requires explicit confirmation | The Deactivate action requires the HR administrator to confirm intent before the system commits the change. This prevents accidental deactivation from an unintended trigger. |
| Deactivation is a soft operation | Deactivating an employee revokes portal access but does not delete or archive the employee record. The employee remains visible in the listing with Inactive status. Reactivation is out of scope for Phase 1. |
| Filters apply AND logic across dimensions | When multiple filter dimensions are active simultaneously, only employees satisfying all conditions are shown. Within a single dimension, multi-select applies OR logic. |
| KPIs reflect the current filtered state | KPI counts are not fixed system-wide totals. When filters are active, all KPI values recompute to reflect the subset currently displayed in the listing. |

---

## 3. Section 1 — Employee KPI Summary

### 3.1 Purpose

Provides a count-based summary of the employee base at the top of the Employee Support module. All counts update dynamically when filters are applied to the listing, keeping the summary contextually aligned with what the HR administrator is viewing.

### 3.2 KPI Metrics

| # | Metric | Definition |
| --- | --- | --- |
| 1 | Total Employees | Count of all employees belonging to the company |
| 2 | Active Employees | Count of employees with Active status |
| 3 | Inactive / Deactivated Employees | Count of employees with Inactive or Deactivated status |
| 4 | Enrolled Employees | Count of employees whose enrollment status is Enrolled |
| 5 | Not Yet Enrolled Employees | Count of employees whose enrollment status is not yet Enrolled |

> **Open question:** Confirm the complete enrollment status vocabulary (e.g., Enrolled, Not Enrolled, Pending, Exempted, Waived) before the TRD begins — KPI bucket definitions and filter options depend on this list being finalized.

---

## 4. Section 2 — Employee Listing

### 4.1 Purpose

Displays all employees belonging to the company as a filterable list with one record per employee. Each employee record provides direct access to per-employee actions, allowing the HR administrator to act without navigating away from the listing.

### 4.2 Filters

Filter dimensions are dynamic and derived entirely from the company's policy configuration. Whatever parameters are selected in the policy configuration appear as filter options in the employee listing. No filter dimension is fixed or hardcoded.

| Behaviour | Description |
| --- | --- |
| Filter source | Parameters active in the company's policy configuration |
| Availability | Only parameters selected in the policy configuration are exposed as filter options in the listing |
| Multi-select within a dimension | Allowed; applies OR logic within that dimension |
| Cross-dimension logic | AND — an employee must satisfy all active filter conditions simultaneously |
| KPI sync | Applying any filter updates both the listing and the KPI summary to reflect the filtered subset |
| Reset | Clears all active filters and restores the full unfiltered employee listing |

### 4.3 Data Per Employee Record

| Field | Description |
| --- | --- |
| Employee Name | Full name of the employee; click navigates to the employee detail page |
| Employee ID | Unique company-assigned employee code; click navigates to the employee detail page |
| Gender | Employee gender |
| Date of Birth | Employee DOB |
| Age | Derived from DOB |
| Email Address | Registered email address on file (display only; `—` if absent) |
| Mobile | Phone number |
| Enrollment Status | Current enrollment state per the enrollment service |
| Sum Insured | Insured amount from latest enrollment record |
| Dependents | Count of dependents; clicking the count opens a Dependents modal listing each dependent's name, relation, age, and coverage |
| E-card | "View" link — opens the E-card PDF modal for that employee |
| Status | Active / Inactive (portal access status) |
| Reminder | "Send" button — immediately dispatches a reminder email to that employee (shortcut; does not require opening the action menu) |
| Actions | "…" overflow menu — see §4.4 |
| Policy configuration fields | Any additional fields corresponding to active policy configuration parameters |

### 4.4 Per-Employee Actions

Actions are split across two surfaces: **row-level controls** (always visible in the row) and the **"…" overflow action menu** (opened on click).

**Row-level controls:**

| Control | Trigger | Effect |
| --- | --- | --- |
| Employee Name / Employee ID | Click | Navigate to `/hr-portal/enrollment/:employeeId` — Employee Detail page (4 tabs) |
| Dependents count | Click | Opens Dependents modal — lists each dependent's name, relation, age, and coverage |
| E-card — "View" | Click | Opens E-card PDF modal — shows the employee's insurance card with download option |
| Reminder — "Send" | Click | Dispatches reminder email immediately (same behaviour as "Send Reminder Email" from the action menu); button disabled when employee is Inactive or has no email |

**"…" action menu items:**

| Action | Effect | Available To | Requires Email |
| --- | --- | --- | --- |
| Block Access | Sets employee portal status to Blocked; toggles to "Unblock Access" after | HR Administrator only | No |
| Unblock Access | Restores employee portal access; toggles to "Block Access" after | HR Administrator only | No |
| Tag as VIP | Marks the employee as VIP (flags the record; visual indicator appears in the listing row) | All authorized roles | No |
| Edit Employee | Opens Edit Employee panel / modal — allows updating employee details | All authorized roles | No |
| Reset Password | Sends a password reset link email to the employee's registered email address | All authorized roles | Yes |
| Send eCard Email | Sends an eCard email to the employee | All authorized roles | Yes |
| Extend Enrollment Window | Sends an enrollment window extension notification email | All authorized roles | Yes |
| Send Welcome Email | Sends a welcome email to the employee | All authorized roles | Yes |

Actions are disabled (greyed out, with tooltip) when the employee is Blocked/Inactive or when the required precondition (email on file) is not met. HR-only actions are invisible or permanently disabled for non-HR roles.

### 4.5 Employee Detail Page

Accessible by clicking any employee's name or Employee ID in the listing. Route: `/hr-portal/enrollment/:employeeId` — uses the numeric DB ID (`pee.id`) as the URL parameter.

The detail page (`HRPortalEmployeeProfile`) is structured as **4 tabs:**

| Tab | Contents |
| --- | --- |
| Employee Details | Full profile — name, Employee ID, DOB, age, gender, department, location, joining date, email, phone |
| Insurance & Policy Details | Policy name/status, enrollment status, sum insured, effective/expiry dates, last activity date |
| Dependents / Beneficiaries | Per dependent: name, relation, age, coverage amount |
| Claims History | Per claim: policy number, hospital, claim type, date, claimed amount, settled amount, status; total claimed shown |

> **2026-05-06 implementation note:** Profile data is fetched via the report framework (`POST /hr-module/generate/ibp_hr_employee_profile_summary?limit=0`). Contact fields (`email`, `phone`, `dateOfBirth`) return raw column values. The **Reset Password** action in the profile Actions menu is live — it calls `endPoints.ibpSendResetMailByEmail(email, domain)` and shows a success/error snackbar. If no email is on file, the action shows an error message instead of dispatching the API call.

---

## 5. Non-Functional Requirements

| Requirement | Target |
| --- | --- |
| Employee listing load | < 3 seconds for companies with up to 5,000 employees |
| Filter application | Updates listing and KPI summary within 1 second of filter change |
| Email action confirmation | Success or failure confirmation returned within 3 seconds of trigger |
| Deactivate action | Listing reflects updated status within 3 seconds of HR administrator's confirmation |
| Audit logging | Every triggered action produces an audit log entry: action type, target employee, triggering user identity, and timestamp |
| Data isolation | All data and actions are scoped to the authenticated user's company; cross-company access is blocked at the data layer |

---

## 6. User Stories

| # | Story |
| --- | --- |
| US-EMPSUPPORT-001 | As an HR administrator, I can view a KPI summary of my company's employee base — total, active, inactive, enrolled, and not yet enrolled — so that I can assess workforce status at a glance without reviewing individual records. |
| US-EMPSUPPORT-002 | As an HR administrator, I can filter the employee listing using dimensions derived from the company's policy configuration so that I can narrow my view to a specific employee group and act on them efficiently. |
| US-EMPSUPPORT-003 | As an HR administrator, I can send an eCard email to an active employee with a registered email address directly from the employee listing so that I can deliver recognition or communications without leaving the module. |
| US-EMPSUPPORT-004 | As an HR administrator, I can send a password reset link to an active employee's registered email so that I can assist employees who have lost portal access without routing the request through a separate system. |
| US-EMPSUPPORT-005 | As an HR administrator, I can send an enrollment window extension notification to an active employee so that I can inform them of additional enrollment time without leaving the module. |
| US-EMPSUPPORT-006 | As an HR administrator, I can send a welcome email to an active employee so that I can onboard new joiners or resend the initial welcome communication when needed. |
| US-EMPSUPPORT-007 | As an HR administrator, I can send a reminder email to an active employee using a single-click row button so that I can prompt them to complete a pending action without opening the action menu. |
| US-EMPSUPPORT-008 | As an HR administrator, I can block or unblock an active employee's portal access so that I can temporarily revoke access without permanently deactivating their account. |
| US-EMPSUPPORT-009 | As an authorized portal user, I can tag an employee as VIP so that the employee record is flagged for priority handling. |
| US-EMPSUPPORT-010 | As an authorized portal user, I can edit an employee's details directly from the listing so that I can correct or update records without navigating to a separate admin screen. |
| US-EMPSUPPORT-011 | As an HR administrator, I can view an employee's e-card PDF from the listing row so that I can verify or share the employee's insurance card without navigating away. |
| US-EMPSUPPORT-012 | As an HR administrator, I can click on an employee's name or ID to view their full detail page with four tabs (Employee Details, Insurance & Policy Details, Dependents, Claims History) so that I can review a complete picture of that employee without leaving the module flow. |
| US-EMPSUPPORT-013 | As an HR administrator, I can view the dependent list for an employee by clicking the dependents count in the listing so that I can review coverage details for each family member without navigating away. |

---

## 7. Edge Cases

| Scenario | Expected Behaviour |
| --- | --- |
| Employee has no registered email address | All five email actions are disabled for that employee. The Deactivate action remains available to HR Administrator. |
| Employee is already deactivated | All six actions are shown in a disabled state. A second Deactivate trigger is blocked with a clear indication that the employee is already inactive. |
| Company has zero employees | Listing displays an empty state. All KPI values display as zero. No error state is shown. |
| All employees are filtered out by active filters | Listing displays an empty state with a message that no employees match the active filters. KPI values display as zero within the filtered context. Clearing filters restores the full listing. |
| No policy configuration parameters selected | No filter dimensions are shown. The listing renders unfiltered and displays all employees. |
| Email action triggered immediately after deactivation in the same session | Once deactivation is committed and the listing reflects Inactive status, all email actions for that employee must be immediately disabled. The system re-validates the employee's active state before dispatching any email action if status propagation has latency. |
| Email delivery service unavailable | A failure confirmation is surfaced. The action is not silently dropped. The user is able to retry. |
| Identity service unavailable during deactivation | The operation is not partially committed. The employee's status does not change. A failure message with a retry option is shown. |

---

## 8. Out of Scope — Phase 1

- Bulk actions across multiple employees simultaneously
- Employee record creation or import
- Reactivation / Unblock via a separate admin flow (Unblock is in-scope as a toggle on the same Block action)
- Email template authoring or configuration
- Email template creation or customization
- Enrollment window date configuration (handled in a separate configuration module)
- Reactivation of deactivated employees
- Any analytics, trend views, or reporting beyond the KPI summary

---

## 9. Stakeholders

| Role | Interest |
| --- | --- |
| HR Administrator | Primary user — monitors employee status, triggers email actions, and deactivates employees |
| IBP Operations | Monitors employee support usage and audit trail |
| Product Manager | Acceptance and sign-off |
| Engineering Lead | Technical delivery |

---

## 10. Open Questions

The following items must be resolved before or during the TRD stage.

1. **Enrollment status vocabulary:** What are the exact enrollment status values the system recognizes (e.g., Enrolled, Not Enrolled, Pending, Exempted, Waived)? Filter options and KPI bucket definitions depend on this list being finalized.
2. **Policy configuration parameters:** Which specific fields in policy configuration drive the dynamic filter set? Is this a defined list or fully open-ended? Does a change to policy configuration immediately update the available filters for active HR sessions?
3. **Reset password mechanics:** Does the identity service generate and send the reset link directly when this module calls the endpoint, or does this module receive the link and pass it to the email service as a separate step?
4. **Deactivation scope:** Does deactivating an employee in the HR Portal affect only portal access, or does it propagate to the insurer system and enrollment platform as well? The answer changes the deactivation endpoint contract.
5. **Audit log ownership:** Which system is responsible for storing the audit log of triggered actions — this module, the downstream email delivery service, or a shared audit service?
6. **Enrollment window extension mechanics:** When the HR administrator triggers "Extend Enrollment Window Email," does the enrollment service automatically extend the window for that employee, or does it only send a notification email for an extension already configured elsewhere?
7. **Roles with access to this module:** Beyond HR Administrator, which other portal roles have read or partial-action access to the Employee Support module? This is needed to fully scope the per-role action availability defined in Section 4.4.

---

## Approval

Leave blank. Client and PTL sign-off required before TRD can proceed.

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```
