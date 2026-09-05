# SDS: External HR User Management (EXTHR)

**Module:** EXTHR — External HR Role Enhancement
**Version:** 1.0
**Status:** In Progress
**Date:** 2026-05-20
**Related Documents:**
- PRD: `prd.md`
- TRD: `trd.md`
- Tasks: `tasks.md`

---

## 1. Overview

This document describes the UI layout, component behaviour, data field mappings, and interaction patterns for the External HR User Management feature within the IBP HR Portal.

| Concern | Owner |
|---|---|
| Business rules, acceptance criteria, scope | PRD |
| Screen layouts, field definitions, interaction flows, data mappings | SDS (this document) |
| API contracts, database schema, auth design | TRD |

---

## 2. Information Architecture

### 2.1 Location in HR Portal

External HR Management lives at: **HR Portal → HR User Management → External HR tab**

### 2.2 Routes

| Route | Description |
|---|---|
| `/hr-module/user-management?tab=external-hr` | External HR listing tab |
| `/hr-module/external-hr/create` | Multi-step create page |
| `/hr-module/external-hr/:hrManagementId/edit` | Multi-step edit page |

### 2.3 Screen Inventory

| Screen | Purpose | PRD Ref |
|---|---|---|
| S1 — External HR Listing | Paginated table of External HR users with search | US-EXTHR-03 |
| S2 — Create/Edit Step 1 | Basic Info — name, email, phone, status | US-EXTHR-01, US-EXTHR-02 |
| S3 — Create/Edit Step 2 | Assign Policies and Locations | US-EXTHR-01, US-EXTHR-02 |
| S4 — Create/Edit Step 3 | Review & Save | US-EXTHR-01, US-EXTHR-02 |
| S5 — EXTERNAL_HR Portal View | Scoped dashboard/reports for External HR users | US-EXTHR-04 |

---

## 3. Screen 1 — External HR Listing (S1)

### 3.1 Entry Point

Tab labelled **"External HR"** added to the existing HR User Management screen alongside the existing HR Admin user list tabs.

### 3.2 Header Row

| Element | Detail |
|---|---|
| Page title | "External HR Users" |
| Primary action button | "Create External HR User" → navigates to `/hr-module/external-hr/create` |
| Search input | Free text; debounced 300ms; clears on × button |

### 3.3 Table Columns

| Column | Source field | Notes |
|---|---|---|
| Full Name | `fullName` | |
| Email | `email` | |
| Status | `roleKey` | Display as "Active" / "Inactive" badge |
| Company | `companyName` | |
| Policy Count | `policyCount` | Integer |
| Created Date | `createdAt` | Format: DD MMM YYYY |
| Actions | — | Edit icon → navigates to edit page |

### 3.4 API

- **Endpoint:** `POST /hr-module/generate/external_hr_user_list`
- **Request body:** `{ companyId, search?, page, limit }`
- **Response:** `{ data: [...], count: number }`

### 3.5 States

| State | UI |
|---|---|
| Loading | Skeleton rows (5 rows) |
| Empty (count = 0) | Illustration + "No External HR users found." |
| Search with no results | "No results for '{search}'." |
| Error | Toast error message; table shows last successful data |

### 3.6 Pagination

- Default page size: 10
- Page size options: 10, 25, 50
- Shows "Showing X–Y of Z results"

---

## 4. Screen 2–4 — Multi-Step Create/Edit Page

### 4.1 Page Layout

Full-page layout (not a drawer or modal). Always shows:
- Breadcrumb: `HR User Management > External HR > Create` (or `Edit`)
- Step indicator: Step 1 · Step 2 · Step 3

### 4.2 Step Indicator States

| Step | Create initial state | Edit initial state |
|---|---|---|
| Step 1 — Basic Info | Active | Active (pre-filled) |
| Step 2 — Policies & Locations | Inactive | Inactive (pre-filled after load) |
| Step 3 — Review & Save | Inactive | Inactive |

Completed steps show a check icon. Current step is highlighted. Future steps are greyed.

---

## 5. Step 1 — Basic Info (S2)

### 5.1 Fields

| Field | Type | Required | Validation | Notes |
|---|---|---|---|---|
| First Name | Text input | Yes | Non-empty after trim | |
| Last Name | Text input | Yes | Non-empty after trim | |
| Email | Email input | Yes | Valid email format | Disabled in edit mode |
| Phone | Text input | No | 7–20 chars, digits/+/spaces/dashes | |
| Date of Birth | Date picker | No | Past date only | |
| Status | Dropdown | Yes | Active / Inactive | |

### 5.2 Navigation

| Action | Behaviour |
|---|---|
| "Next" (enabled) | Validates all required fields; advances to Step 2; locks fields for edit (email always locked) |
| "Next" (disabled) | Greyed out until all required fields valid |
| "Cancel" | Returns to listing page; unsaved data is discarded (confirm dialog if any field is filled) |

### 5.3 Edit Mode Pre-fill

On edit page load, call `POST /hr-module/generate/external_hr_user_detail` with `{ userId: hrManagementId }`. Map response fields:

| Response field | Form field |
|---|---|
| `fullName` | Split into First Name / Last Name on space |
| `email` | Email (disabled) |
| `phoneNumber` | Phone |
| `dateOfBirth` | Date of Birth |
| `roleKey` | Status (EXTERNAL_HR = Active; other = Inactive) |
| `policies` | Pre-selected policy IDs in Step 2 |
| `locations` | Pre-selected address IDs in Step 2 |

---

## 6. Step 2 — Policies & Locations (S3)

### 6.1 On Mount

Fire two parallel API calls:

| Call | Endpoint | Params |
|---|---|---|
| Policies list | `POST /hr-module/generate/external_hr_company_policies` | `{ companyId }` |
| Locations list | `POST /hr-module/generate/external_hr_company_locations` | `{ companyId }` |

Show skeleton loaders in both sections until both calls complete. "Next" button hidden until both resolve.

### 6.2 Policies Section

| Element | Detail |
|---|---|
| Section title | "Assign Policies" |
| "Select All" checkbox | Checks/unchecks all policies; reflects indeterminate state when some are checked |
| Policy items | Checkbox + policy name. At least one must be selected to advance. |
| Empty state | Not possible — policies are required for company (if empty, show error and block Step 2) |

### 6.3 Locations Section

| Element | Detail |
|---|---|
| Section title | "Assign Locations (Optional)" |
| "Select All" checkbox | Same toggle behaviour as policies |
| Location items | Checkbox + `address1` string |
| Empty state | Show: "No locations configured for this company." Hide checkboxes. Step 3 can proceed with no locations. |

### 6.4 Navigation

| Action | Behaviour |
|---|---|
| "Next" | Enabled only when ≥1 policy selected; advances to Step 3 |
| "Back" | Returns to Step 1; all selections retained |

---

## 7. Step 3 — Review & Save (S4)

### 7.1 Review Summary

Read-only display of all collected data:

| Section | Fields shown |
|---|---|
| Basic Info | Full Name, Email, Phone, Date of Birth, Status |
| Policies | List of selected policy names |
| Locations | List of selected location `address1` values; or "None selected" if empty |

### 7.2 Save Action

| Event | API call | Success | Error |
|---|---|---|---|
| Create → Save | `POST /hr-module/external-hr` | Redirect to listing + success toast | Show inline error |
| Edit → Save | `PUT /hr-module/external-hr/:hrManagementId` | Redirect to listing + success toast | Show inline error |

**Request body:**
```json
{
  "firstName": "string",
  "lastName": "string",
  "email": "string",
  "phone": "string",
  "dateOfBirth": "string | null",
  "status": "EXTERNAL_HR | INACTIVE",
  "companyId": 123,
  "policyIds": [1, 2, 3],
  "locationIds": [10, 11]
}
```

### 7.3 Error Handling

| HTTP status | Inline message |
|---|---|
| 409 Conflict | "An External HR user with this email already exists for this company." |
| 400 Bad Request | Show API `message` field |
| 5xx | "Something went wrong. Please try again." |

### 7.4 Navigation

| Action | Behaviour |
|---|---|
| "Back" | Returns to Step 2; selections retained |
| "Save" | Disabled during in-flight request (loading spinner on button) |

---

## 8. Screen 5 — EXTERNAL_HR Portal View (S5)

When the logged-in user's role is `EXTERNAL_HR`, the HR portal applies the following UI gating:

### 8.1 Hidden Navigation Items

The following nav items are removed from the DOM (not just hidden) for `EXTERNAL_HR` users:

- Policy Configuration
- Endorsement Management
- Insurer Management
- HR User Management (including the External HR tab)

### 8.2 Visible & Scoped Items

| Nav item | Scoping applied |
|---|---|
| Dashboard | Reports filtered to assigned policies via `hr_management_id` in `external_hr_policy_map` |
| Employee List | Filtered to employees under assigned policies/locations |
| Claims | Filtered to claims under assigned policies |
| Portfolio / Policy List | Filtered to assigned policies |

### 8.3 Role Detection

Role is read from the JWT-decoded session store — **not** from the URL or an API call.

---

## 9. Data Flow Diagrams

### 9.1 Create Flow

```
User fills Step 1 → clicks Next
  → Step 2 mounts: parallel fetch policies + locations
  → User selects policies (required) + locations (optional)
  → clicks Next → Step 3 shows review
  → clicks Save
    → POST /hr-module/external-hr
    → 201 → redirect to listing
    → 409 → inline error on Step 3
```

### 9.2 Edit Flow

```
User navigates to /hr-module/external-hr/:id/edit
  → Page mounts: fetch external_hr_user_detail
  → Pre-fill all steps with existing data
  → User edits Step 1/2 → clicks through to Step 3
  → clicks Save
    → PUT /hr-module/external-hr/:id
    → 200 → redirect to listing
```

---

## 10. API Reference (Frontend-relevant)

| Purpose | Method | Endpoint | Key params |
|---|---|---|---|
| List External HR users | POST | `/hr-module/generate/external_hr_user_list` | `companyId`, `search`, `page`, `limit` |
| Get user detail (edit pre-fill) | POST | `/hr-module/generate/external_hr_user_detail` | `userId` (= hrManagementId) |
| Get company policies (Step 2) | POST | `/hr-module/generate/external_hr_company_policies` | `companyId` |
| Get company locations (Step 2) | POST | `/hr-module/generate/external_hr_company_locations` | `companyId` |
| Create External HR user | POST | `/hr-module/external-hr` | Full DTO body |
| Update External HR user | PUT | `/hr-module/external-hr/:hrManagementId` | Partial DTO body |
| Get logged-in user details | GET | `/company-employee/company-employee-details` | JWT auth header |

---

## 11. Component Checklist

| Component | Reuse existing? | Notes |
|---|---|---|
| Tab container | Yes | Extend existing HR User Management tabs |
| Data table with pagination | Yes | Reuse existing paginated table component |
| Search input with debounce | Yes | Reuse existing search component |
| Multi-step page shell | New or adapt | Step indicator + breadcrumb |
| Checkbox list with "Select All" | New or adapt | Used in Step 1 (company) and Step 2 (policies, locations) |
| Review summary card | New | Read-only field display |
| Role-gated nav | Adapt existing | Add EXTERNAL_HR condition to nav guard |

---

*EXTHR SDS — External HR User Management — IBP HR Portal — May 2026*
