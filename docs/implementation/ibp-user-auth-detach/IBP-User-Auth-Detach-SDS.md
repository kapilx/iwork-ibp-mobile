# IBP User Authentication Detach — Software Design Specification (SDS)

**Document Version:** 1.1
**Date:** 2026-05-19
**Author:** IIRM Engineering Team
**Status:** Draft
**PRD Reference:** `IBP-User-Auth-Detach-PRD.md`
**TRD Reference:** `IBP-User-Auth-Detach-TRD.md`

---

## 1. Overview

This document describes the system architecture, data models, API contracts, and flow diagrams for the IBP user authentication detach initiative. It is the structural companion to the PRD (what) and TRD (how). No UI changes are required for this initiative.

| Concern | Document |
|---|---|
| Business rules, acceptance criteria, scope | PRD |
| Task breakdown, file-level changes, migration scripts | TRD |
| Architecture, data models, flow diagrams, API contracts | SDS (this document) |

---

## 2. Current Architecture

### 2.1 User Type Distribution in `users` Table

```
┌─────────────────────────────────────────────────────────┐
│                      users table                        │
├──────────────────────────┬──────────────────────────────┤
│ USER_TYPE_IIRM_EMPLOYEE  │ USER_TYPE_COMPANY_EMPLOYEE   │
│ (internal staff)         │ (IBP company employees)      │
│ → iWork portal           │ → IBP portal only            │
├──────────────────────────┴──────────────────────────────┤
│   USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE          │
│   (IIRM staff also enrolled in a company policy)        │
│   → both portals                                        │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Current Auth Flow — All Paths

```
┌─────────────────────────────────────────────────────────────┐
│                   CURRENT: auth-service                     │
│                                                             │
│  POST /login (simple-auth)                                  │
│    loginName/email/phone ──► users table ──► validate       │
│    ALL user types route through users                       │
│                                                             │
│  POST auth/phone-otp/send-phone                             │
│    phone ──► users table ──► get userId                     │
│         └──► policy_enrollment_employee (userId, companyId) │
│                                                             │
│  POST auth/phone-otp/verify-phone                           │
│    Redis OTP ──► users table ──► JWT                        │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Current Enrollment Upload Flow

```
Scheduler cron (every 2 min)
  └─► processEmployeeUpload()
        ├─ IF IIRM employee found in users → promote → create pee { userId }
        └─ IF new employee:
              ├─ Create User { userTypeKey: COMPANY_EMPLOYEE }
              ├─ Create UserRole { userId, roleKey: ROLE_COMPANY_EMPLOYEE }
              └─ Create PolicyEnrollmentEmployee { userId: newUser.userId }
```

---

## 3. Target Architecture

### 3.1 User Type Distribution Post-Change

```
┌───────────────────────────────────────────────────────────────┐
│                     users table                               │
│   (iWork ONLY after migration)                                │
├──────────────────────────┬────────────────────────────────────┤
│ USER_TYPE_IIRM_EMPLOYEE  │ USER_TYPE_COMPANY_EMPLOYEE_AND_    │
│ (internal staff)         │ IIRM_EMPLOYEE                      │
│ → iWork portal           │ (IIRM staff + company enrolled)    │
│                          │ → both portals                     │
└──────────────────────────┴────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│              policy_enrollment_employee table                  │
│   (IBP company employees — credentials live here now)         │
├───────────────────────────────────────────────────────────────┤
│  companyId, loginName, password, isPasswordSet, authVersion   │
│  + existing: email, phone, name, dependents, enrollments      │
│  userId = NULL for pure COMPANY_EMPLOYEE                      │
│  userId = populated for COMBINED (still links to users)       │
└───────────────────────────────────────────────────────────────┘
```

### 3.2 Target Auth Flow ✅ IMPLEMENTED

```
┌──────────────────────────────────────────────────────────────────┐
│                  TARGET: auth-service                            │
│                                                                  │
│  POST /login (simple-auth)                                       │
│    domain (from DTO) ──► resolveCompanyIdByDomain()              │
│    IF companyId resolved (IBP context):                          │
│      loginName + companyId ──► policy_enrollment_employee        │
│      validate password ──► IBP JWT (portal: 'IBP')              │
│    ELSE (iWork context):                                         │
│      loginName ──► users table  (unchanged)                     │
│                                                                  │
│  POST auth/phone-otp/send-phone                                  │
│    domain ──► companyId                                          │
│    phone + companyId ──► policy_enrollment_employee              │
│    (users table NOT queried)                                     │
│                                                                  │
│  POST auth/phone-otp/verify-phone                                │
│    Redis OTP ──► policy_enrollment_employee ──► IBP JWT          │
│    (users table NOT queried)                                     │
│                                                                  │
│  POST auth/email-otp/send                                        │
│    domain ──► companyId                                          │
│    email + companyId ──► policy_enrollment_employee              │
│    (users table NOT queried)                                     │
│                                                                  │
│  POST auth/email-otp/verify                                      │
│    Redis OTP ──► policy_enrollment_employee ──► IBP JWT          │
│    (users table NOT queried)                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Target Enrollment Upload Flow

```
Scheduler cron (every 2 min)
  └─► processEmployeeUpload()
        ├─ IF IIRM employee found in users → promote → create pee { userId }
        │    (NO CHANGE — this path still modifies users table)
        └─ IF new company employee:
              └─ Create PolicyEnrollmentEmployee {
                   loginName, password, isPasswordSet: false,
                   isPasswordHashed: false, authVersion: 1,
                   userStatusKey: ACTIVE, userId: null
                 }
                 (NO User record created)
```

---

## 4. Data Models

### 4.1 `policy_enrollment_employee` — Columns (Post-Migration)

| Column | Type | Nullable | Description |
|---|---|---|---|
| `id` | `int4` | NO | Primary key |
| `company_employee_id` | `varchar` | YES | External employee identifier |
| `employee_company_id` | `varchar` | YES | Alternative company employee reference |
| `company_id` | `int4` | YES | FK to `config_company` |
| `user_id` | `int4` | YES | FK to `users` — NULL for pure COMPANY_EMPLOYEE, populated for COMBINED |
| `employee_name` | `varchar` | YES | Encrypted employee name |
| `full_name` | `varchar` | YES | Encrypted full name |
| `email_enc` | `varchar` | YES | Encrypted email (`@SensitiveField`) |
| `phone_number_enc` | `varchar` | YES | Encrypted phone (`@SensitiveField`) |
| `designation` | `varchar` | YES | Job title |
| `additional_params` | `jsonb` | YES | Flexible key-value store |
| `enrollment_progress` | `jsonb` | YES | Enrollment state |
| `login_name` | `varchar(255)` | YES | **NEW** — Login credential identifier |
| `password` | `varchar(255)` | YES | **NEW** — Hashed password (`@SkipAudit`) |
| `ibp_password` | `varchar(255)` | YES | **NEW** — IBP-specific password field |
| `is_password_set` | `boolean` | NO | **NEW** — Default: false |
| `is_password_hashed` | `boolean` | NO | **NEW** — Default: false |
| `password_expires_at` | `timestamptz` | YES | **NEW** — Password expiry |
| `auth_version` | `int8` | NO | **NEW** — Default: 1 |
| `user_status_key` | `varchar(100)` | NO | **NEW** — Default: USER_STATUS_ACTIVE |
| `deleted_at` | `timestamptz` | YES | Soft-delete |
| `created_at`, `updated_at`, `created_by`, `updated_by` | audit | NO | Standard audit columns |

**Indexes:**

| Index Name | Columns | Unique | Condition |
|---|---|---|---|
| `uq_pee_company_employee` | `company_employee_id` | YES | `deleted_at IS NULL` |
| `idx_pee_employee_company_id` | `employee_company_id` | NO | — |

> **No new unique index on `(login_name, company_id)`** — the table has multiple rows per employee (one per policy enrollment). Auth lookups use `ORDER BY id DESC` to resolve the most recent active row.

### 4.2 Role Association — Option B (extend `user_role`) ✅ SELECTED

Nullable `pee_id` column added to existing `user_role` table (`user_id` made nullable). IBP company employee role rows have `user_id = null`, `pee_id = {pee.id}`. iWork user role rows remain unchanged (`user_id = populated`, `pee_id = null`).

**Implemented in:**
- `apps/services/service-lib/src/lib/entities/user-role.entity.ts` — `peeId` nullable FK, `userId` made nullable, `policyEnrollmentEmployee` ManyToOne relation
- `database-migrations/sql/ibp_auth_detach_migration.sql` — Step 2 and Step 4

---

## 5. API Contracts

No existing API contracts change. Endpoint paths, HTTP methods, request DTOs, and response shapes are identical before and after this change.

### 5.1 Phone OTP Send

```
POST /auth/phone-otp/send-phone

Request (unchanged):
{
  "phoneNumber": "+919876543210",
  "domain": "company-abc",
  "scenario": "LOGIN",           // optional
  "passwordMethodCode": "PHONE_OTP"  // optional
}

Response (unchanged):
{
  "message": "OTP sent successfully",
  "expiresInSeconds": 300
}
```

**Internal routing change:** `users.findByPhoneNumber(phone)` → `peeAuthRepo.findByPhoneAndCompany(phone, companyId)`

### 5.2 Phone OTP Verify

```
POST /auth/phone-otp/verify-phone

Request (unchanged):
{
  "phoneNumber": "+919876543210",
  "otp": "123456",
  "domain": "company-abc"
}

Response (unchanged):
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "userId": ...,    // peeId post-migration (see OQ-5 in TRD)
    "emailId": "...",
    "roles": [...],
    "portal": "IBP",
    "companyId": 101
  }
}
```

### 5.3 Password Login

```
POST /login

Request (updated — IBP portal adds optional companyId):
{
  "userName": "EMP001",
  "password": "...",
  "companyId": 101      // optional — sent by IBP portal, absent for iWork
}

Response (unchanged):
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

**Internal routing:** If `companyId` present → query `policy_enrollment_employee`; else → query `users`.

---

## 6. Authentication Flow Diagrams

### 6.1 IBP Phone OTP Login (Post-Change)

```
Browser (company-abc.iirm.com)
  │
  │ POST /auth/phone-otp/send-phone { phone, domain: "company-abc" }
  ▼
api-gateway → auth-service
  │
  ├─[1] resolveCompanyIdByDomain("company-abc")
  │       → SELECT company_id FROM config_company WHERE domain = "company-abc"
  │       → companyId = 101
  │
  ├─[2] peeAuthRepo.findByPhoneAndCompany(phone, 101)
  │       → SELECT * FROM policy_enrollment_employee
  │         WHERE phone_number_enc = encrypt(phone)
  │           AND company_id = 101
  │           AND deleted_at IS NULL
  │       → employee record found
  │
  ├─[3] check employee.userStatusKey ≠ USER_STATUS_DELETED
  │
  ├─[4] generate 6-digit OTP
  │
  ├─[5] store in Redis: key=auth:otp:phone:company-abc:{phone}, TTL=300s
  │
  ├─[6] call notification-service → send SMS
  │
  └─ return 200 { message: "OTP sent", expiresInSeconds: 300 }

  ─────────────────────────────────────────────────────────

  │ POST /auth/phone-otp/verify-phone { phone, otp, domain: "company-abc" }
  ▼
auth-service
  │
  ├─[1] resolveCompanyIdByDomain("company-abc") → companyId = 101
  │
  ├─[2] retrieve OTP from Redis key=auth:otp:phone:company-abc:{phone}
  │       → validate OTP matches, not expired, retry limit not exceeded
  │
  ├─[3] delete OTP from Redis (consumed)
  │
  ├─[4] peeAuthRepo.findByPhoneAndCompany(phone, 101) → employee
  │
  ├─[5] fetch roles: peeRoleRepo.findByPeeId(employee.id) → roles[]
  │
  ├─[6] build JWT payload:
  │       {
  │         sub: employee.id,
  │         userDetails: {
  │           userId: employee.id,
  │           emailId: employee.email,
  │           organisationId: employee.companyId,
  │           roles: roles,
  │           authVersion: employee.authVersion
  │         },
  │         portal: 'IBP',
  │         loginMethod: 'PHONE_OTP',
  │         companyId: 101
  │       }
  │
  ├─[7] sign accessToken (expiry from CompanyAuthenticationConfig)
  ├─[8] sign refreshToken
  │
  └─ return 200 { accessToken, refreshToken, user: {...} }
```

### 6.2 iWork Password Login (Unchanged)

```
Browser (iwork.iirm.com)
  │
  │ POST /login { userName: "john.doe", password: "..." }
  │ (no companyId — iWork context)
  ▼
auth-service → simple-auth.service.validateUser()
  │
  ├─[1] no companyId in request → iWork path
  │
  ├─[2] userRepo.findByLoginNameOrEmail("john.doe")
  │       → SELECT * FROM users
  │         WHERE (login_name = ... OR email_id_enc = ... OR mobile_enc = ...)
  │           AND user_status_key ≠ 'USER_STATUS_DELETED'
  │
  ├─[3] isPasswordMatch(inputPassword, user.password)
  │
  ├─[4] check passwordExpiresAt
  │
  ├─[5] single-session enforcement (if enabled)
  │
  ├─[6] build JWT { userDetails: { userId, emailId, roles, authVersion, ... } }
  │
  └─ return 200 { accessToken, refreshToken, user: {...} }
```

### 6.3 Enrollment Upload — New Company Employee (Post-Change)

```
Scheduler (every 2 min) → handleUploads() / handleEnrollmentUploads()
  │
  ├─ fetch pending upload documents
  │
  └─ for each employee row in file:
        │
        ├─[1] lookup by companyEmployeeId / email / phone
        │       in policy_enrollment_employee (NOT users table)
        │
        ├─[2] IF found in policy_enrollment_employee:
        │         update existing pee record (name, email, etc.)
        │         (no User creation)
        │
        ├─[3] IF found in users with userTypeKey = IIRM_EMPLOYEE:
        │         → PROMOTION PATH (unchanged):
        │           update users.userTypeKey = COMBINED
        │           create/update pee { userId: existingUser.userId }
        │
        └─[4] IF not found anywhere (new employee):
                  create PolicyEnrollmentEmployee {
                    companyId,
                    loginName: sanitizedEmployeeId,
                    password: generatedPassword,
                    isPasswordSet: false,
                    isPasswordHashed: false,
                    authVersion: 1,
                    userStatusKey: USER_STATUS_ACTIVE,
                    userId: null   ← no users record
                  }
                  create pee_role { peeId, roleId: COMPANY_EMPLOYEE_ROLE }
```

### 6.4 COMBINED User — IBP Login (Post-Change)

```
Browser (company-abc.iirm.com) — user is COMBINED type
  │
  │ POST /auth/phone-otp/verify-phone
  ▼
auth-service
  │
  ├─ peeAuthRepo.findByPhoneAndCompany(phone, companyId)
  │     → finds pee record (pee.userId is populated for COMBINED, but NOT used here)
  │
  ├─ ALL JWT fields come from pee — same as any other IBP user:
  │     { userId: pee.id, emailId: pee.email,
  │       organisationId: pee.companyId, roles (from user_role.pee_id),
  │       authVersion: pee.authVersion,
  │       portal: 'IBP', companyId }
  │
  │   NOTE: users table is NOT queried. pee.userId FK is not used in auth.
  │         It exists only for enrollment upload promotion/revert logic.
  │
  └─ return tokens

  ─────────────────────────────────────────────────────────────────
  COMBINED user iWork login (unchanged):
  Browser (iwork.iirm.com) → POST /login → users table → iWork JWT
  ─────────────────────────────────────────────────────────────────
```

---

## 7. Lookup Behavior — By Identifier Type

| Login Method | IBP Context Lookup | iWork Context Lookup |
|---|---|---|
| Phone | `pee WHERE phone_enc = ? AND company_id = ?` | `users WHERE mobile_enc = ?` |
| Email | `pee WHERE email_enc = ? AND company_id = ?` | `users WHERE email_id_enc = ?` |
| Login Name / Employee ID | `pee WHERE login_name = ? AND company_id = ?` | `users WHERE login_name = ?` |
| Token Refresh | `pee WHERE id = ? AND company_id = ?` | `users WHERE user_id = ?` |

---

## 8. Security Considerations

### 8.1 Credential Isolation
Company employee credentials in `policy_enrollment_employee` are scoped to `company_id`. Cross-company lookup is structurally prevented — all auth queries include `company_id` derived from the domain. A user with the same phone in two companies cannot accidentally authenticate to the wrong company.

### 8.2 Password Handling
- Passwords stored hashed (bcrypt) — same as current `users` table approach
- `@SkipAudit()` decorator on `password` column prevents logging
- `isPasswordHashed` flag prevents double-hashing during migration

### 8.3 Session Invalidation
`authVersion` on `policy_enrollment_employee` serves the same role as `users.authVersion`. When a company employee's roles change, `pee.authVersion` is incremented. On the next token refresh, the JWT's `authVersion` is compared against the DB value — mismatch forces re-login.

### 8.4 OTP Security
No change — OTP continues to be stored in Redis with TTL. Not stored in any DB table.

---

## 9. Migration Strategy

### Phase 1 — Parallel Run (Zero Downtime)
1. Deploy entity changes (new columns nullable)
2. Run migration script: populate new columns from `users` table
3. New columns have data; old `users` records still exist
4. Auth service continues to use `users` table (no code change deployed yet)

### Phase 2 — Switch Auth to New Table
1. Deploy auth-service changes (TASK-5 through TASK-8)
2. Deploy enrollment upload changes (TASK-10, TASK-11)
3. Deploy IBP service changes (TASK-12)
4. Verify all auth flows working via integration tests
5. Monitor for 48 hours

### Phase 3 — Cleanup (Future)
1. `USER_TYPE_COMPANY_EMPLOYEE` records in `users` table are now stale
2. Mark them as deprecated or soft-delete in a separate release
3. Remove `userId` FK from `policy_enrollment_employee` for `COMPANY_EMPLOYEE` records (optional — can remain nullable)

---

## 10. Configuration

No new environment variables required. No changes to `CompanyAuthenticationConfig` (OTP settings, session timeout, retry limits all remain unchanged).

---

## 11. Dependent Services

| Service | Impact |
|---|---|
| `notification-service` | None — SMS and email delivery unchanged |
| `policy-service` | None — user lookups in policy service are for iWork approvers only |
| `org-service` | TASK-13 — password reset routing |
| `api-gateway` | None — no route changes |
| `scheduler-service` | Calls `processEmployeeUpload` from `service-lib` — picks up change via TASK-10 |
| `config-service` | None |
| `ibp-service` | TASK-12 — remove users JOIN |
