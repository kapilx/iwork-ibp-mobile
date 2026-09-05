# IBP User Authentication Detach — Product Requirements Document (PRD)

**Document Version:** 1.0
**Date:** 2026-05-19
**Author:** IIRM Product Team
**Status:** Draft — Pending Approval
**Related Documents:**
- TRD: `IBP-User-Auth-Detach-TRD.md`
- SDS: `IBP-User-Auth-Detach-SDS.md`

---

## 1. Objective

The `users` table currently holds credential and identity records for all user types — internal IIRM staff (iWork), pure IBP company employees, and dual-role employees who are both. This coupling means every company employee enrolled through an IBP file upload creates a record in `users`, a table that was designed for and is semantically owned by the iWork platform.

This initiative detaches IBP-only company employees from the `users` table. After this change:

- The `users` table is authoritative for **iWork users only**: `USER_TYPE_IIRM_EMPLOYEE` and `USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE`.
- IBP-only company employees (`USER_TYPE_COMPANY_EMPLOYEE`) authenticate entirely via `policy_enrollment_employee`, with credentials scoped per company.
- No existing login flow, enrollment flow, or platform behavior changes from the end-user perspective.

---

## 2. Background — Current System

### 2.1 User Types Today

| User Type Constant | Who | Portal Access |
|---|---|---|
| `USER_TYPE_IIRM_EMPLOYEE` | Internal IIRM staff | iWork only |
| `USER_TYPE_COMPANY_EMPLOYEE` | Company employees enrolled via IBP | IBP only |
| `USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE` | IIRM staff also enrolled in a company policy | Both iWork + IBP |

### 2.2 How `USER_TYPE_COMPANY_EMPLOYEE` Records Are Created Today

Two scheduler crons (every 2 minutes) process enrollment upload files:

1. **Without-choice cron** (`handleUploads`) — processes `DOCUMENT_TYPE_POLICY_EMPLOYEE_DATA`. Creates base employee + user records without enrollment choices.
2. **With-choice cron** (`handleEnrollmentUploads`) — processes `DOCUMENT_TYPE_POLICY_EMPLOYEE_ENROLLMENT_DATA`. Validates policy choices (sumInsured, parent policy, label) before processing. With-choice and without-choice are two separate file types.

For each employee row in a file, the cron calls `processEmployeeUpload()` which:
- Looks up the `users` table by employeeId / email / phone
- If the existing user is `USER_TYPE_IIRM_EMPLOYEE` → promotes them to `USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE` (stays in `users` table, no change to this path)
- If no user found → creates a new `User` record (`userTypeKey = USER_TYPE_COMPANY_EMPLOYEE`) with a generated password, `isPasswordSet = false`
- Links `policy_enrollment_employee.userId` to that new user record

### 2.3 How `USER_TYPE_COMPANY_EMPLOYEE` Users Log In Today

**Method 1 — Phone OTP (primary):**
1. User opens IBP portal at `{company-subdomain}.portal.iirm.com`
2. Domain resolved to `companyId` via `ConfigCompany`
3. `users` table queried by phone number
4. OTP generated, stored in Redis (5-minute TTL), sent via SMS
5. On verify: OTP validated, `users` table queried again, JWT generated with `portal: 'IBP'`, `companyId`, `loginMethod: 'PHONE_OTP'`

**Method 2 — Employee ID + Password / Email + Password:**
1. User enters credentials on IBP portal
2. `users` table queried by `loginName` or `emailId`
3. Password validated against `users.password`
4. JWT generated as above

### 2.4 HR Users in IBP

There is no separate `USER_TYPE_HR`. HR administrators in the IBP portal are company employees with an HR-specific `roleKey` in their roles array. Their login flow is identical to all other company employees. Role-based access is enforced post-login via JWT roles.

### 2.5 `PolicyEnrollmentEmployee` Today

- Has `userId` FK → `users` table (links company employee to their user record)
- Stores enrollment data: `email`, `phoneNumber`, `employeeName`, `companyId`, `companyEmployeeId`, `dependents`, `enrollments`
- **Does not** store credentials (password, loginName, authVersion)
- `companyEmployeeId` is globally unique (soft-delete aware index)
- `email` and `phoneNumber` have **no uniqueness constraints** — same email/phone can exist across multiple companies

---

## 3. Problem Statement

| Problem | Impact |
|---|---|
| Every IBP company employee enrollment creates a `User` record, polluting the iWork user space | `users` table grows with records that are not iWork users; admin queries, user-management UIs, and reports must filter by `userTypeKey` |
| Company employee credentials are global — a person enrolled in two companies shares one `User` record | Cannot support independent per-company credentials, per-company password policy, or per-company session management |
| IBP auth queries hit the `users` table even though company employees have no iWork access | Tight coupling; any schema change to `users` impacts IBP auth |
| `policy_enrollment_employee.userId` FK creates a hard dependency on `users` | Cannot independently evolve the two tables |

---

## 4. Proposed Change

### 4.1 Core Principle

> When a user logs into the IBP portal, the domain resolves to a `companyId`. Authentication for company employees is looked up from `policy_enrollment_employee` using `(loginName/phone/email, companyId)`. The `users` table is never consulted for `USER_TYPE_COMPANY_EMPLOYEE` authentication.

### 4.2 What Changes

**`policy_enrollment_employee` gets credential fields:**
- `loginName` — unique per company (composite unique with `companyId`)
- `password` — hashed credential
- `ibpPassword` — optional IBP-specific password field (mirrors current `users.ibpPassword`)
- `isPasswordSet` — flag for first-login password setup
- `isPasswordHashed` — migration safety flag
- `passwordExpiresAt` — nullable, for company password policy enforcement
- `authVersion` — for session invalidation on role change
- `userStatusKey` — account status (ACTIVE / DELETED)

**Enrollment upload stops creating `User` records for company employees:**
- For new company employees: write credentials to `policy_enrollment_employee` directly
- For IIRM employee matches: promotion to `COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE` continues unchanged (those users stay in `users` table)

**Auth service routes IBP login to `policy_enrollment_employee`:**
- Phone OTP, password login, email OTP for company employees → query `policy_enrollment_employee` by `(identifier, companyId)`

**`policy_enrollment_employee.userId` becomes nullable:**
- Only populated for `COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE` employees who have an existing iWork `User` record
- `null` for pure `USER_TYPE_COMPANY_EMPLOYEE` employees post-migration

### 4.3 What Does Not Change

| Area | Reason |
|---|---|
| iWork login flow (`USER_TYPE_IIRM_EMPLOYEE`) | Entirely on `users` table — untouched |
| `USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE` login | User record exists in `users`; both iWork and IBP login paths continue to work |
| Promotion / revert logic in enrollment upload | Operates on `users` table for IIRM employees — no change |
| OTP storage (Redis) | Not in `users` table today; stays in Redis |
| JWT payload structure | Same fields, different source |
| HR user login | HR is a role, not a user type; no change to login flow |
| Scheduler cron schedules | No change to timing or triggering |

---

## 5. User Scenarios

### 5.1 iWork Only User (post-change — no difference)

Employee logs into `iwork.iirm.com`. Simple-auth queries `users` table. Validates password. Returns iWork JWT. No change.

### 5.2 IBP Company Employee Only (post-change)

Employee logs into `company-abc.portal.iirm.com`.
- Domain → `companyId = 101`
- Phone / loginName / email + companyId → lookup in `policy_enrollment_employee`
- Credentials validated from `policy_enrollment_employee`
- JWT returned with `portal: 'IBP'`, `companyId: 101`
- `users` table is never queried

### 5.3 IBP Company Employee in Two Different Companies (post-change)

Same person uploaded to Company A (companyId 101) and Company B (companyId 202):
- Two independent `policy_enrollment_employee` records: one for companyId 101, one for companyId 202
- Each has its own `loginName`, `password`, `isPasswordSet`
- Login to company-a portal authenticates against companyId 101 record
- Login to company-b portal authenticates against companyId 202 record
- No shared credential; independent password policies per company

### 5.4 IIRM Employee Also Enrolled in Company (post-change — no difference)

`USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE` user:
- iWork login: `users` table → works as before
- IBP login: `policy_enrollment_employee` WHERE `userId = X AND companyId = Y` → validated via user's `users` record (userId FK still populated for this type)
- Promotion/revert from enrollment upload: still modifies `users.userTypeKey` — unchanged

### 5.5 HR Admin User in IBP (post-change — no difference)

HR admins are `USER_TYPE_COMPANY_EMPLOYEE` with an HR `roleKey`. Login flow is identical to Scenario 5.2. Role-based access enforced post-login. No separate flow.

---

## 6. Business Rules

| Rule | Description |
|---|---|
| BR-01 | `users` table is authoritative only for `USER_TYPE_IIRM_EMPLOYEE` and `USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE` after migration |
| BR-02 | Company employee credentials are scoped per company. Same person enrolled in two companies has two independent credential sets. |
| BR-03 | `loginName` in `policy_enrollment_employee` must be unique within a company (`loginName + companyId` composite unique, soft-delete aware) |
| BR-04 | Email and phone remain non-unique at DB level (same as today) — lookup is by `(email/phone, companyId)` during auth |
| BR-05 | `isPasswordSet = false` on first enrollment. User must set password on first login. This behavior is unchanged. |
| BR-06 | OTP continues to be stored in Redis — no change to OTP mechanism |
| BR-07 | JWT payload structure is unchanged — same fields, different source table for company employees |
| BR-08 | `COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE` promotion/revert continues to modify `users` table — this path is unaffected |
| BR-09 | No existing API contract changes — all endpoints keep the same request/response shape |
| BR-10 | Existing `USER_TYPE_COMPANY_EMPLOYEE` records in `users` must be migrated; data must not be lost |

---

## 7. Acceptance Criteria

| ID | Scenario | Acceptance Criterion |
|---|---|---|
| AC-01 | iWork login | IIRM employee logs in via username+password; JWT returned; `users` table used; behavior identical to today |
| AC-02 | IBP company employee login — phone OTP | Company employee sends OTP; OTP delivered; verify returns IBP JWT with companyId; `users` table not queried |
| AC-03 | IBP company employee login — password | Company employee logs in with employeeId+password; JWT returned with `portal: IBP`; `users` table not queried |
| AC-04 | IBP company employee in two companies | Same phone enrolled in Company A and Company B; can log in to each independently; credentials are independent |
| AC-05 | Dual-role login — iWork path | COMBINED user logs into iWork; password login works; iWork JWT returned |
| AC-06 | Dual-role login — IBP path | COMBINED user logs into IBP portal; phone OTP works; IBP JWT returned with companyId |
| AC-07 | Enrollment upload — new employee (no choice) | File upload creates `policy_enrollment_employee` record with credentials; no `User` record created for company employees |
| AC-08 | Enrollment upload — new employee (with choice) | Same as AC-07; valid choices stored; invalid choices return row-level error; no change in choice validation behavior |
| AC-09 | Enrollment upload — IIRM employee in file | Existing `IIRM_EMPLOYEE` found by email/phone; promoted to `COMBINED` type in `users` table; `policy_enrollment_employee.userId` populated |
| AC-10 | Enrollment upload — employee removed | Revert logic runs; `COMBINED` user reverts to `IIRM_EMPLOYEE` in `users` table; unchanged |
| AC-11 | HR admin login | HR admin (company employee with HR role) logs in via phone OTP; JWT contains HR roleKey; IBP portal serves HR-specific views |
| AC-12 | First login password setup | `isPasswordSet = false` on first enrollment; user prompted to set password; `policy_enrollment_employee.isPasswordSet` updated to `true` |
| AC-13 | No `users` table growth from IBP uploads | After migration, new IBP enrollment uploads do not add records to `users` table (except IIRM employee promotions) |
| AC-14 | Data migration | All existing `USER_TYPE_COMPANY_EMPLOYEE` credential data successfully migrated to `policy_enrollment_employee`; no data loss |

---

## 8. Out of Scope

- Password policy enforcement changes (expiry behavior stays the same)
- Session management changes
- HR portal UI changes
- iWork portal changes
- Email OTP flow changes (follows same pattern as phone OTP)
- Google OAuth changes
- Notification templates

---

## 9. Dependencies

| Dependency | Owner | Notes |
|---|---|---|
| `policy_enrollment_employee` entity migration | Backend | New columns + DB migration script |
| Auth service changes | Backend | Route IBP auth to new table |
| Enrollment upload util changes | Backend | Stop creating `User` records for company employees |
| IBP service changes | Backend | Remove `userId` joins for pure company employees |
| Data migration script | Backend/DBA | Copy credentials from `users` → `policy_enrollment_employee` for all `COMPANY_EMPLOYEE` records |

---

## 10. Risks

| Risk | Mitigation |
|---|---|
| Migration leaves `users` records orphaned | Keep `USER_TYPE_COMPANY_EMPLOYEE` records in `users` table intact until migration is verified; mark as migrated via a flag or delete in a separate cleanup pass |
| Dual-role users (`COMBINED`) auth broken | `policy_enrollment_employee.userId` remains populated for all COMBINED users; IBP auth falls back to `users` table for these users via userId |
| Same phone in multiple companies causes lookup ambiguity | All lookups are `(phone, companyId)` — companyId from domain resolution prevents ambiguity |
| `companyEmployeeId` global uniqueness conflict during same-person multi-company upload | Already allowed today; no change to this behavior |
