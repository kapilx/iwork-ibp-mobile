# PRD: External HR User Management (EXTHR)

**Module:** EXTHR — External HR Role Enhancement  
**Parent Module:** HR User Management (`hr_user_management`)  
**Version:** 1.0  
**Status:** Draft  
**Date:** 2026-05-13

---

## 1. Overview

### 1.1 Problem Statement

The existing HR User Management module supports a single role type: `HR_ADMIN`. Companies like IIRM's broker clients (EY, BlueYonder, etc.) need to grant restricted portal access to external personnel — payroll agencies, third-party HR consultants, or group administrators — who should see only specific policies and employees at specific locations, without any admin privileges.

There is currently no mechanism to create scoped, restricted HR users. All HR users today get full `HR_ADMIN` access to the company's data.

### 1.2 Goal

Extend the `hr_user_management` module to support a new role type `EXTERNAL_HR` that allows admins to create HR users with policy-level and location-level access restrictions.

### 1.3 Non-Goals

- Creating additional restricted role types beyond `EXTERNAL_HR` in this iteration.
- Modifying the authentication or login mechanism for existing IBP/HR_ADMIN users. *(Note: auth-service and ibp-service required fixes for EXTERNAL_HR login — JWT role ID, 2FA phone OTP, and company-employee-details — these are covered in the TRD §10c.)*
- Changing the access rules for existing `HR_ADMIN` users.
- Building a self-service registration flow for external users.

### 1.4 Success Criteria

- An `HR_ADMIN` can create an `EXTERNAL_HR` user scoped to one or more policies and company locations.
- An `EXTERNAL_HR` user, when logged in, sees only policies and employees within their granted scope.
- No existing `HR_ADMIN` functionality is broken.
- Duplicate `EXTERNAL_HR` user records for the same email are blocked.

---

## 2. Background & Context

### 2.1 Existing System

The `hr_user_management` table tracks users with HR portal access:

```
hr_user_management
  id, user_id, user_name, email_id, phone_number,
  role_key (HR_ADMIN | EXTERNAL_HR), company_id,
  company_name, created_at, updated_at, created_by,
  updated_by, deleted_at
```

Role resolution logic (in the `company-employee-details` API):

| Presence | isEmployee | isHR |
|---|---|---|
| `policy_enrollment_employee` only | true | false |
| `hr_user_management` only | false | true |
| Both tables | true | true |

The `user` table holds core authentication identity. Creating an HR user requires a row in both `user` and `hr_user_management`.

### 2.2 Report Framework

All data-fetch operations in the HR module use the metadata-driven `POST /hr-module/generate/:report` pattern (see `hr-module-report-framework-tech-spec.md`). SQL is stored in `admin_reports`, parameters in `admin_reports_parameters`. This approach is used for all GET-style lookups in this feature.

---

## 3. User Stories

### US-01 — Create External HR User

> As an `HR_ADMIN`, I want to create an External HR user by providing their basic info, assigning them to specific policies of a company, and restricting them to specific company locations, so that they can only see the employees and policies relevant to their scope.

**Acceptance Criteria:**

- Creation uses a dedicated multi-step page (not a drawer or modal): Basic Info → Assign Policies & Locations → Review & Save.
- Basic Info fields: First Name, Last Name, Email, Status, Company.
- Company selection uses a checkbox-based list with a "Select All" option. Selecting "All" checks every company; deselecting "All" clears all selections. Only one company is expected in practice, but the pattern is consistent.
- After company is confirmed, step 2 loads policies and locations for the selected company.
- Policies are displayed as a checkbox list with a "Select All" option. Selecting "All" checks every policy; deselecting "All" clears all policy selections.
- Locations are displayed as a checkbox list with a "Select All" option. Selecting "All" checks every location; deselecting "All" clears all location selections.
- Step 3 (Review) shows a summary of all selections before final save.
- On submit: creates a row in `user`, creates a row in `hr_user_management` with `role_key = 'EXTERNAL_HR'`, inserts rows into `external_hr_policy_map` and `external_hr_location_map`.
- Validation: Email must be unique (not already in `user` with `EXTERNAL_HR` mapping), all required fields present.
- Success: user appears in the External HR list.

### US-02 — Update External HR User

> As an `HR_ADMIN`, I want to edit an existing External HR user's policy and location assignments without recreating the user, so that scope adjustments don't require deleting and re-creating the record.

**Acceptance Criteria:**

- Pre-fill all fields from the existing record.
- Policy and location assignments can be added or removed.
- Update applies soft-delete + re-insert strategy for mapping tables (delete old rows, insert new ones).
- `user` and `hr_user_management` core fields (name, email, status) can also be updated.

### US-03 — View External HR Users

> As an `HR_ADMIN`, I want to see a paginated list of all External HR users for my company, with their assigned policies and locations visible, so I can audit and manage access.

**Acceptance Criteria:**

- List shows: Name, Email, Status, Company, Assigned Policy count, Created Date.
- Supports search by name or email.
- Supports pagination (page / limit).
- Clicking a row navigates to the Edit External HR page with all data pre-filled across the same multi-step flow.

### US-04 — Scoped Access for External HR Users

> As an `EXTERNAL_HR` user, I want to log in and see only the policies I have been granted access to, and only employees who belong to my assigned company locations.

**Acceptance Criteria:**

- Policy list shown to `EXTERNAL_HR` is filtered to `external_hr_policy_map` rows for the user.
- Employee list is filtered to employees whose `company_location_id` is in `external_hr_location_map` for the user.
- Admin-only modules (policy configuration, endorsement approval, insurer management) are not shown.
- No cross-company data is accessible.

---

## 4. Functional Requirements

### 4.1 Creation Flow

The creation experience is a dedicated multi-step page. No drawers, side panels, or modals are used.

**Step 1 — Basic Info**

1. Admin enters First Name, Last Name, Email, Status.
2. Admin selects a **Company** using a checkbox list with a "Select All" toggle.
   - Clicking "Select All" checks every item; clicking it again (or deselecting all individual items) clears all selections.
3. Admin advances to Step 2. Company selection is locked once Step 2 loads.

**Step 2 — Assign Policies & Locations**

4. System fetches active policies and locations for the selected company (parallel calls).
5. **Policies** are shown as a checkbox list with a "Select All" toggle. Behavior mirrors Step 1 company selection.
6. **Locations** are shown as a checkbox list with a "Select All" toggle. If no locations exist, an empty state message is shown; the step is not blocked.
7. Admin advances to Step 3.

**Step 3 — Review & Save**

8. Admin reviews a summary: user details, selected company, policy list, location list.
9. Admin clicks Save → system creates user, HR management record, and mapping rows.
10. On success: redirect to the External HR user list.
11. If the email already exists in `user` with an active `EXTERNAL_HR` record for the same company → return validation error at Step 1 email field; do not create duplicate.

### 4.2 Policy Fetch Logic

- Source: `admin_policy` or `policy` table filtered by `company_id`.
- No location mapping required for policy listing; absent location data does not block policy assignment.
- Response shape: `[ { id: number, name: string } ]`.

### 4.3 Location Fetch Logic

- Source: `company_policy_configuration_location` joined to `address`.
- Filter by `company_id`.
- Return: `address.id` as `id`, `address.address1` as `address1`.
- If no locations exist for the company, return empty array. Do not show an error.

### 4.4 Status Values

Valid `status` values for an External HR user in `hr_user_management`:

| Value | Meaning |
|---|---|
| `ACTIVE` | User can log in and access scoped data |
| `INACTIVE` | User cannot access the HR portal |

### 4.5 Deactivation Behavior

- Setting Status to `INACTIVE` sets the user record to inactive (does not soft-delete mapping rows).
- Reactivation sets status back to `ACTIVE`.
- Hard-delete is not exposed via UI; soft-delete (`deleted_at`) is admin-only.

### 4.6 Duplicate Handling

- Two External HR users with the same email for the same company are not allowed.
- If an email exists in `user` but not in `hr_user_management`, a new HR record can be created (linking to the existing user).
- If an email already has an active `hr_user_management` row with `role_key = 'EXTERNAL_HR'` for the same company, block the creation.

---

## 5. Database Design

### 5.1 Existing Tables Modified

**`hr_user_management`** — No schema change required. The existing `role_key` column accepts `EXTERNAL_HR` as a value. The unique index `uq_hr_user_management_user_id_active` ensures one active HR record per user.

**`user`** — No schema change required. New External HR users are inserted as regular users.

### 5.2 New Tables

#### `external_hr_policy_map`

Maps an External HR user to specific policies they are allowed to access.

```sql
CREATE TABLE IF NOT EXISTS external_hr_policy_map (
  id          SERIAL      PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users(user_id),
  policy_id   INTEGER     NOT NULL,
  company_id  INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ext_hr_policy_map_user_policy
  ON external_hr_policy_map (user_id, policy_id)
  WHERE true;

CREATE INDEX IF NOT EXISTS idx_ext_hr_policy_map_user_id
  ON external_hr_policy_map (user_id);

CREATE INDEX IF NOT EXISTS idx_ext_hr_policy_map_company_id
  ON external_hr_policy_map (company_id);
```

#### `external_hr_location_map`

Maps an External HR user to specific company locations they are allowed to see employees from.

```sql
CREATE TABLE IF NOT EXISTS external_hr_location_map (
  id          SERIAL      PRIMARY KEY,
  user_id     INTEGER     NOT NULL REFERENCES users(user_id),
  address_id  INTEGER     NOT NULL,
  company_id  INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ext_hr_location_map_user_address
  ON external_hr_location_map (user_id, address_id)
  WHERE true;

CREATE INDEX IF NOT EXISTS idx_ext_hr_location_map_user_id
  ON external_hr_location_map (user_id);

CREATE INDEX IF NOT EXISTS idx_ext_hr_location_map_company_id
  ON external_hr_location_map (company_id);
```

### 5.3 Entity Relationship

```
user (user_id) ──< hr_user_management (user_id)
user (user_id) ──< external_hr_policy_map (user_id)
user (user_id) ──< external_hr_location_map (user_id)
```

- `external_hr_policy_map.user_id` → `users.user_id` (FK only; no cascade — deletions handled by the application layer)
- `external_hr_location_map.user_id` → `users.user_id` (FK only; no cascade — deletions handled by the application layer)
- Mapping rows must be explicitly deleted by the service before deleting a user to avoid FK constraint violations.
- `company_id` is denormalized for fast company-scoped queries without joins.

---

## 6. API Design

### 6.1 Fetch Company Policies — Report Framework

**Report Key:** `external_hr_company_policies`

**Call:**

```
POST /hr-module/generate/external_hr_company_policies
Content-Type: application/json

{
  "companyId": "123"
}
```

**Response:**

```json
{
  "statusCode": 201,
  "message": "...",
  "data": {
    "data": [
      { "id": 45, "name": "Mediclaim GMC 2024-25" },
      { "id": 46, "name": "GPA Accidental Cover" }
    ],
    "count": 2
  }
}
```

### 6.2 Fetch Company Locations — Report Framework

**Report Key:** `external_hr_company_locations`

**Call:**

```
POST /hr-module/generate/external_hr_company_locations
Content-Type: application/json

{
  "companyId": "123"
}
```

**Response:**

```json
{
  "statusCode": 201,
  "message": "...",
  "data": {
    "data": [
      { "id": 11276, "address1": "gachibowli anjaiah nagar" },
      { "id": 11277, "address1": "ameerpet" }
    ],
    "count": 2
  }
}
```

Empty response (no locations): `{ "data": [], "count": 0 }` — do not show error.

### 6.3 Fetch External HR User List — Report Framework

**Report Key:** `external_hr_user_list`

**Call:**

```
POST /hr-module/generate/external_hr_user_list
Query: ?page=1&limit=20&sort=created_at:desc
Content-Type: application/json

{
  "companyId": "123",
  "search": "john"
}
```

**Response columns:** `user_id`, `full_name`, `email`, `status`, `company_name`, `policy_count`, `created_at`

### 6.4 Fetch External HR User Detail — Report Framework

**Report Key:** `external_hr_user_detail`

**Call:**

```
POST /hr-module/generate/external_hr_user_detail
Content-Type: application/json

{
  "userId": "456"
}
```

**Response:** Single row with assigned policies and locations as JSON arrays in the response.

### 6.5 Create External HR User — Custom POST

**Endpoint:** `POST /hr-module/external-hr`

**Authorization:** `HR_ADMIN` role only.

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@ey.com",
  "status": "ACTIVE",
  "companyId": 123,
  "policyIds": [45, 46],
  "locationIds": [11276, 11277]
}
```

**Validation:**

| Field | Rule |
|---|---|
| `firstName` | Required, non-empty string |
| `lastName` | Required, non-empty string |
| `email` | Required, valid email format, unique per company in `hr_user_management` with `role_key = EXTERNAL_HR` |
| `status` | Required, one of `ACTIVE \| INACTIVE` |
| `companyId` | Required, positive integer |
| `policyIds` | Required, non-empty array of integers |
| `locationIds` | Optional, array of integers (empty allowed) |

**Success Response (201):**

```json
{
  "statusCode": 201,
  "message": "External HR user created successfully.",
  "data": {
    "userId": 789,
    "hrManagementId": 42
  }
}
```

**Error Responses:**

| HTTP | Scenario |
|---|---|
| 400 | Validation error (missing fields, invalid email) |
| 409 | Email already exists as `EXTERNAL_HR` for this company |
| 403 | Caller does not have `HR_ADMIN` role |

### 6.6 Update External HR User — Custom POST

**Endpoint:** `PUT /hr-module/external-hr/:userId`

**Authorization:** `HR_ADMIN` role only.

**Request Body:** Same shape as Create. `email` is not updatable — omit or ignore if sent.

**Behavior:**

1. Update `hr_user_management` row (name, status, `updated_at`).
2. Delete all rows from `external_hr_policy_map` for `user_id`.
3. Insert new rows from `policyIds`.
4. Delete all rows from `external_hr_location_map` for `user_id`.
5. Insert new rows from `locationIds`.

**Success Response (200):**

```json
{
  "statusCode": 200,
  "message": "External HR user updated successfully.",
  "data": { "userId": 789 }
}
```

---

## 7. Access Rules

### 7.1 What EXTERNAL_HR Can Do

| Action | Allowed |
|---|---|
| View own assigned policies | Yes |
| View employees at own assigned locations | Yes |
| Download employee/claims reports scoped to their access | Yes |
| View claim history for their policy scope | Yes |

### 7.2 What EXTERNAL_HR Cannot Do

| Action | Blocked |
|---|---|
| Access policy configuration / endorsements | No |
| Access insurer management | No |
| Create or manage HR users | No |
| View employees outside assigned locations | No |
| View policies outside assigned scope | No |
| Access other companies | No |

### 7.3 UI Gating

On frontend, role check: if `role_key === 'EXTERNAL_HR'`, hide admin navigation items and apply scoped API calls using `user_id` as an additional filter.

---

## 8. Edge Cases

| Scenario | Behavior |
|---|---|
| Company has no locations | Location checkbox list shows empty state message on Step 2; creation proceeds without location assignments |
| Policy has no mapped locations | Policy still assignable; location selection is independent |
| External HR user is set to INACTIVE | Login is blocked; existing mapping rows are retained |
| Policy is later deactivated/deleted | Mapping row is orphaned but not auto-deleted; scoped queries exclude inactive policies |
| Location is later removed | Mapping row retained; query joins exclude the removed address |
| Admin removes all policies from an EXTERNAL_HR user | User has empty scope; sees empty data on login |
| Duplicate mapping insert attempt | Unique index on `(user_id, policy_id)` and `(user_id, address_id)` prevents duplicates |

---

## 9. UI Requirements

### 9.1 HR User Management Screen Enhancement

- Add an **"External HR"** tab (or section) alongside the existing HR Admin user list.
- Tab shows the paginated External HR user list (report `external_hr_user_list`).

### 9.2 Multi-Step Page Flow

Creation and editing use a full-page multi-step flow. Drawers, side panels, and modals are not used.

**Navigation path:**
```
HR User Management List  →  Create / Edit External HR  →  Assign Policies & Locations  →  Review & Save
```

A breadcrumb or step indicator shows the current position at all times. The user can navigate back to any previous step without losing data.

---

#### Step 1 — Basic Info

| Field | Type | Notes |
|---|---|---|
| First Name | Text input | Required |
| Last Name | Text input | Required |
| Email | Email input | Required; disabled on edit |
| Status | Dropdown | Active / Inactive |
| Company | Checkbox list | See below |

**Company selection — checkbox list with "Select All":**

- All accessible companies are rendered as a scrollable checkbox list.
- A "Select All" checkbox sits above the list. Checking it selects every company; unchecking it (or individually deselecting all items) clears all selections.
- Individual company checkboxes deselect "Select All" automatically if not all are checked.
- Once the admin advances to Step 2, the company selection is locked to prevent cascade reload confusion.

**"Next" button** is enabled only when all required fields are valid.

---

#### Step 2 — Assign Policies & Locations

Loads after Step 1 is confirmed. Both lists are fetched in parallel for the selected company.

**Policies — checkbox list with "Select All":**

- All active policies for the company are rendered as a scrollable checkbox list.
- A "Select All" checkbox at the top: checking selects every policy; unchecking clears all.
- At least one policy must be selected to advance to Step 3.

**Locations — checkbox list with "Select All":**

- All locations from `company_policy_configuration_location` joined to `address` are rendered as a scrollable checkbox list.
- A "Select All" checkbox at the top: checking selects every location; unchecking clears all.
- If no locations are configured for the company, show: **"No locations configured for this company."** The step is not blocked; the admin can proceed with no locations selected.
- Location selection is optional.

**Loading states:** Show a skeleton list while policies and locations are fetching. Do not show the "Next" button until both lists have loaded or returned empty.

---

#### Step 3 — Review & Save

Displays a read-only summary before the final write:

- **User details:** Full Name, Email, Status
- **Company:** Selected company name
- **Assigned Policies:** List of selected policy names (count shown if list is long)
- **Locations:** List of selected location address1 values, or "None selected"

Two buttons: **Back** (returns to Step 2) and **Save** (triggers the create / update API call).

On success: redirect to the External HR user list with a success toast.  
On error: stay on Step 3 and surface the error message inline.

### 9.3 Role-Based UI for EXTERNAL_HR Users

When the logged-in user has `role_key = EXTERNAL_HR`:

- Hide: Policy Configuration, Endorsements, Insurer Management, HR User Management.
- Show: Dashboard (scoped), Employee List (scoped), Claims (scoped), Policy List (scoped to their policies).

### 9.4 Portfolio Scoping for EXTERNAL_HR

All portfolio reports (`portfolio_kpi_summary`, `portfolio_policies`, `portfolio_group_companies`, `portfolio_individual_companies`, `portfolio_company_policies`) automatically scope their results when the caller is an `EXTERNAL_HR` user. The backend injects the caller's `userId` as `externalHrUserId` into the report parameters before SQL execution. Non-`EXTERNAL_HR` callers receive the unfiltered full-portfolio view.

| Report | Filter applied for EXTERNAL_HR |
|---|---|
| `portfolio_kpi_summary` | Counts only assigned policies; derives company count from those policies |
| `portfolio_policies` | Returns only policies in `external_hr_policy_map` for the user |
| `portfolio_group_companies` | Returns only companies that have ≥1 assigned policy |
| `portfolio_individual_companies` | Returns only companies that have ≥1 assigned policy |
| `portfolio_company_policies` | Returns only assigned policies within the requested company |

---

## 10. Security Considerations

- All External HR API calls must verify the caller's `role_key` via the existing auth guard.
- `POST /hr-module/external-hr` and `PUT /hr-module/external-hr/:userId` require `HR_ADMIN`.
- Scoped data endpoints must filter by `user_id` from the request `userid` header (set by the auth middleware), not from the request body, to prevent horizontal privilege escalation.
- Email input must be sanitized (trim, lowercase) before insert to prevent near-duplicate accounts.
- `externalHrUserId` is injected server-side based on the authenticated `userid` header; the client cannot override it.

---

## 11. Migration & Backward Compatibility

- `hr_user_management.role_key` already accepts any `VARCHAR(100)` value. Inserting `EXTERNAL_HR` requires no schema change.
- New tables `external_hr_policy_map` and `external_hr_location_map` are additive; no existing table is modified.
- Existing `HR_ADMIN` users are unaffected; all new `externalHrUserId` filters are no-ops when the parameter is NULL.
- Portfolio report SQL is patched in place via UPDATE in `external-hr-scripts.sql` (Section 6); re-running is safe.
- The `externalHrUserId` parameter is added to each portfolio report in `admin_reports_parameters` using `ON CONFLICT DO NOTHING`; existing parameter rows are not modified.

---

## 12. Open Questions

| # | Question | Owner |
|---|---|---|
| 1 | Should EXTERNAL_HR users receive an email invite on creation, or is manual credential sharing sufficient? | Product |
| 2 | Should the policy scope be enforced at the API middleware level, or only at the SQL query level? | Backend Tech Lead |
| 3 | When a policy is deleted/deactivated, should the mapping row be auto-cleaned or left for audit trail? | Product / DBA |
| 4 | Is location assignment mandatory, or always optional (current spec: optional)? | Product |
| 5 | Should the EXTERNAL_HR user list be visible only to the HR Admin who created them, or all HR Admins of that company? | Product |

---

## 13. Approval

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```

---

*EXTHR PRD — External HR User Management — ibp-service — May 2026*
