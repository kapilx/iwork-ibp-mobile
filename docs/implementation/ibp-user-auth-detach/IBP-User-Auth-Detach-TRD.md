# IBP User Authentication Detach — Technical Requirements Document (TRD)

**Document Version:** 1.2
**Date:** 2026-05-19
**Author:** IIRM Engineering Team
**Status:** Draft
**PRD Reference:** `IBP-User-Auth-Detach-PRD.md`
**SDS Reference:** `IBP-User-Auth-Detach-SDS.md`

---

## 1. Scope

This document covers all backend changes required to detach `USER_TYPE_COMPANY_EMPLOYEE` authentication from the `users` table and route it through `policy_enrollment_employee`. It includes:

- Database schema changes and migration
- Auth service routing changes (phone OTP, password login)
- Enrollment upload util changes (credential creation)
- IBP service changes (employee lookups)
- Org service changes (password reset)
- Task breakdown with file paths and acceptance criteria per task

**No frontend changes are required.** No API contract shapes change. No JWT payload structure changes.

---

## 2. Architecture Change Summary

### Current Flow (all company employees)

```
Enrollment Upload
  └─► Create User { userTypeKey: COMPANY_EMPLOYEE, loginName, password }
  └─► Create PolicyEnrollmentEmployee { userId: newUser.userId }

IBP Login
  └─► Domain → companyId
  └─► users.findByPhone(phone)          ← users table
  └─► Validate credentials from users
  └─► Generate JWT

IBP Service
  └─► PolicyEnrollmentEmployee.userId → users JOIN → get name/email/phone
```

### New Flow (company employees only — IIRM employees unchanged)

```
Enrollment Upload
  └─► Write credentials to PolicyEnrollmentEmployee directly
      { loginName, password, isPasswordSet: false, companyId }
  └─► No User record created
  └─► PolicyEnrollmentEmployee.userId = null

IBP Login
  └─► Domain → companyId
  └─► policy_enrollment_employee.findByPhone(phone, companyId)  ← new table
  └─► Validate credentials from PolicyEnrollmentEmployee
  └─► Generate JWT (same structure)

IBP Service
  └─► Read name/email/phone directly from PolicyEnrollmentEmployee
  └─► No users JOIN for COMPANY_EMPLOYEE type
```

### IIRM Employee / Dual-Role — Unchanged

```
IIRM Employee login: users table → unchanged
Dual-role (COMBINED) login:
  iWork path: users table → unchanged
  IBP path: policy_enrollment_employee WHERE userId = X AND companyId = Y
            → credentials from users (via userId FK, still populated for COMBINED)
Promotion/revert in upload: modifies users.userTypeKey → unchanged
```

---

## 3. Schema Changes

### 3.1 `policy_enrollment_employee` — New Columns

**File:** `apps/services/service-lib/src/lib/entities/policy-enrollment-employee.entity.ts`

| Column | Type | Nullable | Default | Notes |
|---|---|---|---|---|
| `login_name` | `varchar(255)` | YES (nullable during migration) | `null` | Employee's login credential identifier |
| `password` | `varchar(255)` | YES | `null` | Hashed password (SkipAudit decorator required) |
| `ibp_password` | `varchar(255)` | YES | `null` | IBP-specific password (mirrors users.ibpPassword) |
| `is_password_set` | `boolean` | NO | `false` | First-login flag |
| `is_password_hashed` | `boolean` | NO | `false` | Migration safety flag |
| `password_expires_at` | `timestamp` | YES | `null` | Password expiry enforcement |
| `auth_version` | `bigint` | NO | `1` | Incremented on role/permission change for session invalidation |
| `user_status_key` | `varchar(100)` | NO | `'USER_STATUS_ACTIVE'` | Account status |

**No new unique index** — `policy_enrollment_employee` has multiple rows per employee (one per policy enrollment). A unique index on `(login_name, company_id)` would violate when the same employee is enrolled in multiple policies under the same company. Auth lookups use `ORDER BY id DESC` to resolve the most recent active row per employee.

### 3.2 `policy_enrollment_employee.user_id` — Make Nullable

The `userId` column already exists. Post-migration it will be:
- `NOT NULL` for `COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE` employees (they have a `users` record)
- `NULL` for new `COMPANY_EMPLOYEE` enrollments

No column type change needed — verify it is already nullable; if not, alter to nullable in the migration script.

### 3.3 Migration Script

**File:** `database-migrations/YYYYMMDD_ibp_auth_detach.sql`

```sql
-- Step 1: Add new columns to policy_enrollment_employee
ALTER TABLE policy_enrollment_employee
  ADD COLUMN IF NOT EXISTS login_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS password VARCHAR(255),
  ADD COLUMN IF NOT EXISTS ibp_password VARCHAR(255),
  ADD COLUMN IF NOT EXISTS is_password_set BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_password_hashed BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS auth_version BIGINT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS user_status_key VARCHAR(100) NOT NULL DEFAULT 'USER_STATUS_ACTIVE';

-- Step 2: Copy credentials from users table for all COMPANY_EMPLOYEE records
UPDATE policy_enrollment_employee pee
SET
  login_name         = u.login_name,
  password           = u.password,
  ibp_password       = u.ibp_password,
  is_password_set    = u.is_password_set,
  is_password_hashed = u.is_password_hashed,
  password_expires_at = u.password_expires_at,
  auth_version       = u.auth_version,
  user_status_key    = u.user_status_key
FROM users u
WHERE pee.user_id = u.user_id
  AND u.user_type_key = 'USER_TYPE_COMPANY_EMPLOYEE'
  AND pee.deleted_at IS NULL;

-- Step 3: No unique index added (multiple pee rows per employee per company — see Section 3.1)
```

---

## 4. Task Breakdown

Tasks are ordered by dependency. Tasks within the same phase can be parallelized.

---

### PHASE 1 — Schema & Entity (No logic changes)

---

#### TASK-1: Add credential fields to `PolicyEnrollmentEmployee` entity ✅ IMPLEMENTED

**File:** `apps/services/service-lib/src/lib/entities/policy-enrollment-employee.entity.ts`

**Changes:**
1. Added `@SkipAudit()` decorated `@Column` for `password`
2. Added `@Column({ nullable: true })` for `ibpPassword`
3. Added `@Column({ default: false })` for `isPasswordSet`
4. Added `@Column({ default: false })` for `isPasswordHashed`
5. Added `@Column({ nullable: true, type: 'timestamptz' })` for `passwordExpiresAt`
6. Added `@Column({ type: 'bigint', default: 1 })` for `authVersion`
7. Added `@Column({ default: 'USER_STATUS_ACTIVE' })` for `userStatusKey`
8. Added `@Column({ nullable: true })` for `loginName`
9. **No unique index added** — multiple rows per employee per company (see Section 3.1)

**Acceptance:** Entity compiles. Existing entity tests pass. New columns present in generated migration.

---

#### TASK-2: Write and run DB migration ✅ IMPLEMENTED

**File:** `database-migrations/YYYYMMDD_ibp_auth_detach.sql` (new file)

**Content:** Full migration script as defined in Section 3.3.

**Steps:**
1. Run against dev DB
2. Verify row counts: `SELECT COUNT(*) FROM policy_enrollment_employee WHERE login_name IS NOT NULL` should match `SELECT COUNT(*) FROM users WHERE user_type_key = 'USER_TYPE_COMPANY_EMPLOYEE'`
3. Spot-check: pick 5 random company employees, verify credentials copied correctly

**Acceptance:** Migration runs without error. No data loss. `login_name` populated for all existing `COMPANY_EMPLOYEE` linked records.

---

### PHASE 2 — Repository Layer

---

#### TASK-3: Add auth-lookup methods to `PolicyEnrollmentEmployeeRepository` ✅ IMPLEMENTED

Create or extend the repository for `policy_enrollment_employee` in auth-service (or service-lib if shared).

**New Methods Required:**

```typescript
// Find by phone + companyId for OTP login
findByPhoneAndCompany(phone: string, companyId: number): Promise<PolicyEnrollmentEmployee | null>

// Find by loginName + companyId for password login
findByLoginNameAndCompany(loginName: string, companyId: number): Promise<PolicyEnrollmentEmployee | null>

// Find by email + companyId for email OTP login
findByEmailAndCompany(email: string, companyId: number): Promise<PolicyEnrollmentEmployee | null>

// Find by id (for token refresh / user-details endpoint)
findByIdWithCompany(id: number): Promise<PolicyEnrollmentEmployee | null>
```

**Fields to select in each query:**
`id`, `loginName`, `email`, `phoneNumber`, `employeeName`, `companyId`, `password`, `ibpPassword`, `isPasswordSet`, `isPasswordHashed`, `passwordExpiresAt`, `authVersion`, `userStatusKey`, `userId` (for COMBINED type fallback)

**File location:** `apps/services/auth-service/src/app/pee-auth/pee-auth.repository.ts` ✅

**Acceptance:** Repository methods return decrypted email/phone (SensitiveField decorator handles this). Unit tests cover: found by phone, found by email, found by loginName, not found returns null, soft-deleted record not returned.

---

#### TASK-4: Add `PolicyEnrollmentEmployee` entity to auth-service module ✅ IMPLEMENTED

**File:** `apps/services/auth-service/src/app/auth.module.ts` (or equivalent module file)

**Change:** Register `PolicyEnrollmentEmployee` entity in `TypeOrmModule.forFeature([...])`. Import the new `PeeAuthRepository`.

**Acceptance:** Auth service starts without error. New repository injectable in services.

---

### PHASE 3 — Auth Service Changes

---

#### TASK-5: Update Phone OTP Service — `sendPhoneOtp()` ✅ IMPLEMENTED

**File:** `apps/services/auth-service/src/app/phone-otp/phone-otp.service.ts`

**Current behavior (lines ~350, ~367–373):**
```typescript
const user = await this.userRepository.findByPhoneNumber(normalizedPhone);
// ...
const pee = await this.peeRepo.findOne({ where: { userId: user.userId, companyId } });
```

**New behavior:**
```typescript
const employee = await this.findEmployeeByPhoneWithHrFallback(normalizedPhone, companyId);
if (!employee) throw new UnauthorizedException('No account found with this phone number.');
if (employee.userStatusKey === USER_STATUS_DELETED) throw new UnauthorizedException('Account deactivated');
// OTP generation continues unchanged — still stored in Redis
```

**`findEmployeeByPhoneWithHrFallback` (private helper):**
```typescript
private async findEmployeeByPhoneWithHrFallback(phone: string, companyId: number) {
  // 1. Try IBP employee (pee) table first
  const pee = await this.ibpEmployeeAuthRepository.findByPhoneAndCompany(phone, companyId);
  if (pee) return pee;

  // 2. Fallback: EXTERNAL_HR user in hr_user_management
  //    Try 4 phone variants to handle +91 format mismatches between stored and sent values
  const digits = phone.replace(/\D/g, '');
  const phoneVariants = Array.from(new Set([
    phone,
    phone.startsWith('+') ? phone.slice(1) : `+${phone}`,
    digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : null,
    digits.length === 10 ? `+91${digits}` : null,
  ].filter(Boolean)));

  for (const variant of phoneVariants) {
    const hrUser = await this.hrUserManagementRepository.findOne({
      where: { phoneNumber: variant, companyId, deletedAt: IsNull() },
    });
    if (hrUser) return this.hrUserToAuthResult(hrUser);
  }
  return null;
}
```

**`hrUserToAuthResult` maps `HrUserManagement` → `IbpEmployeeAuthResult`:**
- `id` = `hrUser.id` (hr_management_id)
- `email` = `hrUser.emailId`
- `companyId` = `hrUser.companyId`
- Role fetched from `roles` table using `ROLE_` prefix fallback on `hrUser.roleKey`

**What does NOT change:**
- OTP generation logic
- Redis key structure (`auth:otp:phone:{domain}:{phone}`)
- SMS delivery via notification service
- Retry limits, TTL, resend cooldown

**Acceptance:** Send OTP returns 200 for valid IBP employee OR External HR user. Returns 401 if phone not found in either table for that company. `users` table not queried.

---

#### TASK-6: Update Phone OTP Service — `verifyPhoneOtpAndGenerateTokens()` ✅ IMPLEMENTED

**File:** `apps/services/auth-service/src/app/phone-otp/phone-otp.service.ts` (lines ~469–640)

**Current behavior:**
- OTP verified from Redis (unchanged)
- `userRepository.findByPhoneNumber()` called for user details
- Token generated from `user` object

**New behavior:**
- OTP verified from Redis (unchanged)
- `findEmployeeByPhoneWithHrFallback(phone, companyId)` called (see TASK-5 for implementation — same helper used by both send and verify)
- Token generated from `employee` object

**Token generation — field mapping:**

| JWT field | IBP employee (pee) source | EXTERNAL_HR source |
|---|---|---|
| `userId` | `pee.id` | `hrUser.id` (hr_management_id) |
| `emailId` | `pee.email` | `hrUser.emailId` |
| `organisationId` | `pee.companyId` | `hrUser.companyId` |
| `roles` | `user_role WHERE pee_id = pee.id` | `roles` table via `ROLE_` prefix fallback on `hrUser.roleKey` |
| `authVersion` | `pee.authVersion` | `1` (constant; HR users have no auth_version) |
| `portal` | `'IBP'` | `'IBP'` |
| `companyId` | `pee.companyId` | `hrUser.companyId` |
| `loginMethod` | `'PHONE_OTP'` | Unchanged |

> **Key principle (OQ-3):** IBP auth reads `policy_enrollment_employee` ONLY — for all IBP users including COMBINED. The `pee.userId` FK is never used in auth. No `users` table lookup happens during any IBP login path.

**Acceptance:** OTP verify returns accessToken + refreshToken. JWT `portal: 'IBP'`, `companyId` present. `users` table not queried — including for COMBINED-type employees logging into IBP.

---

#### TASK-7: Update Simple Auth Service — password login for company employees ✅ IMPLEMENTED

**File:** `apps/services/auth-service/src/app/simple-auth/simple-auth.service.ts`
**File:** `apps/services/auth-service/src/app/simple-auth/simple-auth.repository.ts`

**Current behavior:**
- `findByLoginNameOrEmail()` queries `users` table for all user types

**New behavior in `validateUser()`:**

```
Step 1: Try to resolve companyId from request context (domain header or clientScopeId)
  IF companyId available (IBP login context):
    query peeAuthRepository.findByLoginNameAndCompany(loginName, companyId)
    IF found → validate password from PolicyEnrollmentEmployee.password
    IF not found → return 401
  ELSE (iWork login context — no companyId):
    query userRepository.findByLoginNameOrEmail(loginName) as before
    validate password from users.password as before
```

**How to detect login context (OQ-2 resolved — server-side from domain):**
- `domain` field in `CreateSimpleAuthDto` (already optional field on the DTO)
- `validateUser()` now accepts `domain?: string` as 5th parameter
- `resolveCompanyIdByDomain(domain)` — returns `companyId` if IBP domain, null if iWork
- If `companyId` resolved → IBP path → `peeAuthRepository.findByIdentifierAndCompany(loginName, companyId)`
- If `companyId` is null → iWork path → `userRepository.findByLoginNameOrEmail(loginName)` as before
- Controller passes `loginDto.domain` — no frontend contract change.

**Acceptance:** iWork password login unchanged. IBP password login queries `PolicyEnrollmentEmployee`. Both return 401 for wrong password. 403 for expired password.

---

#### TASK-8: Update Email OTP Service ✅ IMPLEMENTED

**File:** `apps/services/auth-service/src/app/email-otp/email-otp.service.ts`

**Changes implemented:**
- Removed `UserRepository` dependency — `users` table no longer queried
- Added `PeeAuthRepository` — `sendOTP` and `verifyOTPAndGenerateTokens` now query `peeAuthRepository.findByEmailAndCompany(email, domainCompanyId)`
- `getTokens()` now accepts `PeeAuthResult` and builds JWT from PEE fields (`employee.id` as `userId`, `employee.companyId` as `organisationId`, `employee.authVersion`, `employee.roles`)
- `email-otp.module.ts` updated: removed `User` entity, added `UserRole`; replaced `UserRepository` with `PeeAuthRepository`

**Acceptance:** Email OTP login for IBP company employees works. `users` table not queried.

---

#### TASK-9: Roles for company employees — extend `user_role` table (Option B) ✅ IMPLEMENTED

**Decision:** Extend existing `user_role` table with a nullable `ibp_employee_id` FK (OQ-1 resolved).
**Column name:** `ibp_employee_id` (renamed from `pee_id` — clearer meaning for readers unfamiliar with the `pee` alias).

**Schema change (idempotent — handles both fresh run and re-run after old `pee_id` column):**
```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_role' AND column_name = 'pee_id') THEN
    ALTER TABLE user_role RENAME COLUMN pee_id TO ibp_employee_id;
  ELSE
    ALTER TABLE user_role ADD COLUMN IF NOT EXISTS ibp_employee_id INTEGER REFERENCES policy_enrollment_employee(id);
  END IF;
END;
$$;
```

**Migration — populate `ibp_employee_id` for existing company employee role rows:**
```sql
INSERT INTO user_role (ibp_employee_id, role_id, user_id)
SELECT DISTINCT pee.id AS ibp_employee_id, ur.role_id, NULL AS user_id
FROM user_role ur
JOIN users u ON ur.user_id = u.id
JOIN policy_enrollment_employee pee ON pee.user_id = u.id
WHERE u.user_type_key = 'USER_TYPE_COMPANY_EMPLOYEE'
  AND pee.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM user_role e WHERE e.ibp_employee_id = pee.id AND e.role_id = ur.role_id);
```

**For new company employee role assignment (in upload util / scheduler, TASK-10/11):**
```typescript
userRoleRepo.insert({ ibpEmployeeId: pee.id, userId: null, roleId: companyEmployeeRole.id });
```

**Role fetch during token generation:**
```typescript
// IBP context (portal = 'IBP'): fetch by ibpEmployeeId
const roles = await userRoleRepo.find({ where: { ibpEmployeeId: employee.id } });
// iWork context: fetch by userId (unchanged)
const roles = await userRoleRepo.find({ where: { userId: user.userId } });
```

**Entity:**
- `user-role.entity.ts` — column `ibp_employee_id`, TypeScript property `ibpEmployeeId`
- `userId` made nullable: `@Column({ nullable: true })`

**Acceptance:** Token generation for company employees includes correct `roles` array. Role-based access guards work post-migration. IIRM employee role rows unaffected (`ibp_employee_id = null` for all existing iWork rows).

---

### PHASE 4 — Enrollment Upload Changes

---

#### TASK-10: Stop creating `User` records for `COMPANY_EMPLOYEE` in scheduler ✅ IMPLEMENTED

**Files:**
- `apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts` — two locations

**Without-choice path (lines ~2734–2870):**

**Previous behavior:** Created `users` record with `userTypeKey: USER_TYPE_COMPANY_EMPLOYEE`, then created `UserRole` with `userId`.

**New behavior:**
```typescript
let ibpCredentials: { loginName: string; password: string } | null = null;

if (!transactionalUser) {
  // ... compute loginName, password ...
  ibpCredentials = { loginName, password };
  // transactionalUser and userId stay null — NO users record created
}
// ... pee creation (employeeId known after this) ...

// After pee is created/found:
if (ibpCredentials && employeeId) {
  await manager.update(PolicyEnrollmentEmployee, { id: employeeId }, {
    loginName: ibpCredentials.loginName,
    password: ibpCredentials.password,
    isPasswordSet: false, authVersion: 1, userStatusKey: USER_STATUS_ACTIVE,
  });
  // Create UserRole with ibpEmployeeId (not userId)
  await userRoleRepo.save(userRoleRepo.create({ ibpEmployeeId: employeeId, roleId: role.id }));
}
```

**With-choice path (lines ~6015–6155):** Same pattern applied — `ibpCredentials` collected, no users record, credentials + UserRole written after pee is saved.

**IIRM employee promotion path:** **NO CHANGE** — when `existingUser` is found (type `IIRM_EMPLOYEE`), it is promoted to `COMBINED` via `ensureCompanyAndIirmAssociation`. `transactionalUser` is set, `userId` is set, `UserRole` with `userId` is created as before. IBP-detach logic does not affect this path.

**Acceptance:**
- New company employee upload → no new `users` record created
- `policy_enrollment_employee` has `loginName`, `password`, `isPasswordSet = false`
- `policy_enrollment_employee.userId = null` for new records; `ibp_employee_id` in `user_role` set to `pee.id`
- IIRM employee promotion still creates `users` FK correctly
- With-choice and without-choice file types both work

---

#### TASK-11: Update `UserRole` creation in upload util ✅ IMPLEMENTED (via scheduler fix above)

For new IBP-only employees, `UserRole` is now created with `ibpEmployeeId = employeeId` instead of `userId`. Implemented in the same edit as TASK-10 above.

**Note:** The `company-employee-upload.util.ts` (service-lib) is used by the ibp-service directly and still creates users records. Fixing that util is a follow-up once the scheduler fix is validated.

---

### PHASE 5 — IBP Service Changes

---

#### TASK-12: Update auth lookups in IBP service ✅ IMPLEMENTED

**File:** `apps/services/ibp-service/src/app/company-employee/company-employee.repository.ts`

**Methods updated:**

**`findByEmail(email, companyId?)`** — now queries `policy_enrollment_employee` instead of `users`:
```typescript
const pee = await this.companyEmployeeRepository.findOne({
  where: { email: email.trim().toLowerCase(), userStatusKey: Not(USER_STATUS_DELETED), deletedAt: IsNull(), ...(companyId ? { companyId } : {}) },
  order: { id: "DESC" },
});
return this.mapPeeToAuthResult(pee);
```
Return shape: `{ userId: pee.id, emailId: pee.email, mobile: pee.phoneNumber, password: pee.password, ibpPassword: pee.ibpPassword, ... }` — `userId` field = `pee.id` for downstream JWT compatibility.

**`findByPhoneNumber(phone, companyId?)`** — same pattern, queries `pee.phoneNumber`.

**`findByLoginName(loginName, companyId?)`** — queries `pee.loginName` (auth credential field), not `pee.companyEmployeeId`.

**`findUserById(userId)`** — now returns `PolicyEnrollmentEmployee | null` by `id`, used in `updateUserPassword`.

**`updateUserPassword(userId, hashed)`** — updates `pee.ibpPassword` WHERE `pee.id = userId`.

**`updateCompanyEmployeePassword(userId, hashed)`** — same fix.

**Private helper `mapPeeToAuthResult(pee)`** — maps `pee.id → userId`, `pee.companyId → organisationId`, fetches roles by `ibpEmployeeId`.

**Service changes (`company-employee.service.ts`):**
- `validateUser` and `checkPasswordReadiness` now pass `companyId` (derived from domain) to `findByEmail`/`findByPhoneNumber`/`findByLoginName`
- `ensureEmployeeBelongsToCompany` only called for HR users (fallback path) — for pee-sourced users the company scope was already applied in the lookup

**Acceptance:** IBP login via email/phone/loginName queries `policy_enrollment_employee`. Password update writes to `pee.ibpPassword`. `users` table not touched for `COMPANY_EMPLOYEE` auth.

---

### PHASE 6 — Org Service Changes

---

#### TASK-13: Password reset for company employees

**File:** `apps/services/org-service/src/app/employee/employee.service.ts` (lines ~368–373)

Currently queries `users` by `userTypeKey IN [COMPANY_EMPLOYEE, COMBINED]` for password reset.

**New behavior:**
```
IF userTypeKey === COMPANY_EMPLOYEE:
  update policy_enrollment_employee.password WHERE (loginName, companyId)
IF userTypeKey === COMBINED:
  update users.password (stays in users table)
```

**File:** `apps/services/org-service/src/app/employee/employee.repository.ts`

Update password reset query to route by user type.

**Acceptance:** Password reset for IBP employee updates `policy_enrollment_employee`. Password reset for iWork / COMBINED employee updates `users` table.

---

### PHASE 7 — Validation & Cleanup

---

#### TASK-14: Auth version increment for company employees

**File:** `apps/services/auth-service/src/app/` (wherever `authVersion` is incremented today)

When a company employee's roles change, `policy_enrollment_employee.authVersion` must be incremented (not `users.authVersion`). This triggers session invalidation on the next token refresh.

**Acceptance:** Changing a company employee's role increments `pee.authVersion`. Their existing session is invalidated on next refresh.

---

#### TASK-15: `user-details` endpoint — company employee support

**File:** `apps/services/auth-service/src/app/simple-auth/simple-auth.service.ts` (`getUserDetails()`, lines ~399–442)

Currently fetches user details from `users` table by `userId` from JWT.

**New behavior:**
- If JWT contains `portal: 'IBP'` and no `userId` (pure company employee): fetch from `peeAuthRepository.findByIdWithCompany(peeId, companyId)`
- If JWT contains `userId` (iWork or COMBINED): fetch from `userRepository.findById(userId)` as before

**Acceptance:** `GET /user-details` returns correct data for all user types.

---

#### TASK-16: Integration tests

Write/update integration tests covering:

| Test | File |
|---|---|
| IBP phone OTP send + verify — users table NOT hit | `auth-service-e2e` |
| IBP password login — users table NOT hit | `auth-service-e2e` |
| iWork login — unchanged | `auth-service-e2e` |
| COMBINED user — both login paths | `auth-service-e2e` |
| Enrollment upload without choice — no User record created | `scheduler-service-e2e` |
| Enrollment upload with choice — no User record created | `scheduler-service-e2e` |
| IIRM employee promotion in upload — users record still updated | `scheduler-service-e2e` |
| IBP service employee lookup — no users JOIN | `ibp-service-e2e` |
| Password reset for company employee | `org-service-e2e` |

---

## 5. Data Flow: IBP Login (Post-Change)

```
IBP Portal (company-abc.iirm.com)
  │
  ▼
API Gateway → Auth Service
  │
  ├─ POST auth/phone-otp/send-phone { phone, domain }
  │     │
  │     ├─ resolveCompanyIdByDomain(domain) → companyId = 101
  │     ├─ pee_auth_repo.findByPhoneAndCompany(phone, 101)
  │     │     → SELECT * FROM policy_enrollment_employee
  │     │       WHERE phone_number_enc = encrypt(phone)
  │     │         AND company_id = 101
  │     │         AND deleted_at IS NULL
  │     ├─ check userStatusKey ≠ DELETED
  │     ├─ generate OTP → Redis key: auth:otp:phone:company-abc:{phone}
  │     └─ SMS via notification-service
  │
  └─ POST auth/phone-otp/verify-phone { phone, otp, domain }
        │
        ├─ resolveCompanyIdByDomain(domain) → companyId = 101
        ├─ retrieve OTP from Redis → validate
        ├─ pee_auth_repo.findByPhoneAndCompany(phone, 101)
        ├─ build JWT payload:
        │     { peeId, emailId, organisationId: companyId, roles, authVersion,
        │       portal: 'IBP', loginMethod: 'PHONE_OTP', companyId }
        └─ return { accessToken, refreshToken }
```

---

## 6. Entity Relationship (Post-Change)

```
users
  ├── userId (PK)
  ├── userTypeKey: IIRM_EMPLOYEE | COMBINED
  └── ...credentials, roles

policy_enrollment_employee
  ├── id (PK)
  ├── companyId (FK → config_company)
  ├── userId (FK → users, NULLABLE — populated only for COMBINED type)
  ├── loginName (unique per companyId, partial index)
  ├── password (SkipAudit)
  ├── isPasswordSet
  ├── authVersion
  ├── userStatusKey
  └── ...enrollment fields (email, phone, name, dependents, etc.)

pee_role (new — or user_role extended)
  ├── peeId (FK → policy_enrollment_employee)
  └── roleId (FK → role)
```

---

## 7. Impacted Files — Complete List

| File | Type of Change | Task |
|---|---|---|
| `service-lib/src/lib/entities/policy-enrollment-employee.entity.ts` | Add credential columns + index | TASK-1 |
| `database-migrations/YYYYMMDD_ibp_auth_detach.sql` | New migration file | TASK-2 |
| `auth-service/src/app/policy-enrollment-employee/pee-auth.repository.ts` | New file | TASK-3 |
| `auth-service/src/app/auth.module.ts` | Register new entity + repository | TASK-4 |
| `auth-service/src/app/phone-otp/phone-otp.service.ts` | Replace users lookup with pee lookup | TASK-5, TASK-6 |
| `auth-service/src/app/simple-auth/simple-auth.service.ts` | Route IBP password login to pee | TASK-7 |
| `auth-service/src/app/simple-auth/simple-auth.repository.ts` | Add pee lookup method | TASK-7 |
| `auth-service/src/app/email-otp/email-otp.service.ts` | Replace users lookup with pee lookup | TASK-8 |
| `auth-service/src/app/simple-auth/simple-auth.service.ts` | user-details for pee users | TASK-15 |
| `service-lib/src/lib/utils/company-employee-upload.util.ts` | Stop creating User records for COMPANY_EMPLOYEE | TASK-10, TASK-11 |
| `ibp-service/src/app/company-employee/company-employee.repository.ts` | Remove users JOIN for COMPANY_EMPLOYEE | TASK-12 |
| `org-service/src/app/employee/employee.service.ts` | Route password reset by user type | TASK-13 |
| `org-service/src/app/employee/employee.repository.ts` | Password reset query update | TASK-13 |
| `database-migrations/` | pee_role table (or user_role extension) | TASK-9 |

---

## 8. Non-Breaking Guarantees

| Guarantee | How Ensured |
|---|---|
| iWork login unchanged | Simple-auth only queries `users` when no `companyId` in context |
| COMBINED user both paths work | iWork login uses `users` table (unchanged). IBP login uses `policy_enrollment_employee` only — no `users` lookup even for COMBINED users. `pee.userId` FK exists only for promotion/revert logic in enrollment upload, never used in auth. |
| Existing `users` records not deleted | Migration copies data; original records remain until cleanup pass |
| JWT structure identical | Same payload fields, different source objects |
| API contracts unchanged | No DTO changes, no route changes, no response shape changes |
| Enrollment upload file formats unchanged | No column mapping changes |
| Choice validation logic unchanged | Only credential creation part of upload util changes |

---

## 9. Decisions — Open Questions Resolved

| # | Question | Decision | Rationale |
|---|---|---|---|
| OQ-1 | Roles storage: new `pee_role` table or extend `user_role`? | **Option B — extend `user_role`** | Add nullable `pee_id` column to existing `user_role`. Company employee rows: `pee_id` set, `user_id = null`. Zero new table, existing role guards and JWT role-fetch work without change. Lower migration risk. |
| OQ-2 | Should `companyId` be sent in login DTO from IBP portal, or resolved server-side? | **Resolve server-side from domain** | Auth-service already does `resolveCompanyIdByDomain()` for phone OTP. Apply same pattern to password login — read `Origin` or `domain` header, resolve `companyId` internally. No DTO change, no frontend change, consistent across all IBP auth methods. |
| OQ-3 | For COMBINED users logging into IBP — validate credentials from `policy_enrollment_employee` or `users`? | **`policy_enrollment_employee` only — no `users` lookup at all** | The entire purpose of detaching is zero dependency on `users` for any IBP auth. IBP = `policy_enrollment_employee` only. iWork = `users` only. `pee.userId` FK is preserved only for enrollment upload promotion/revert logic — it is never used in auth or JWT generation. JWT for all IBP users (including COMBINED) comes entirely from `pee` fields. |
| OQ-4 | Should existing `USER_TYPE_COMPANY_EMPLOYEE` records in `users` be deleted after migration? | **Keep as-is during migration; delete in a future cleanup pass** | Migration copies credentials to `pee`. Original `users` records remain intact until all flows are verified stable. Deletion is a separate future task — no timeline defined yet. |
| OQ-5 | JWT `userId` field — use `peeId` for pure company employees, or keep `userId` field name? | **Reuse the `userId` field, put `pee.id` as its value** | IBP JWT already has `portal: 'IBP'`. Rule: if `portal = 'IBP'`, `userId` in JWT means `policy_enrollment_employee.id`; otherwise it means `users.userId`. Downstream services do not need to change — they read `userId` as before; only IBP-specific services need to be aware of the portal context (which they already check today). |
