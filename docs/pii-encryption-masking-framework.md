# PII Encryption & Masking Framework

Developer reference for the field-level encryption, response masking, and role-gated reveal system
protecting PII across the `users`, `employee`, and `contact_communication` tables.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture & File Map](#2-architecture--file-map)
3. [How Encryption Works](#3-how-encryption-works)
4. [How Decryption Works](#4-how-decryption-works)
5. [How Masking Works](#5-how-masking-works)
6. [How the Reveal Endpoint Works](#6-how-the-reveal-endpoint-works)
7. [Role-Based Access Control for Reveal](#7-role-based-access-control-for-reveal)
8. [Environment Variables](#8-environment-variables)
9. [Adding a New Encrypted Field](#9-adding-a-new-encrypted-field)
10. [Adding Masking to a New Table](#10-adding-masking-to-a-new-table)
11. [Full Checklist for a Brand-New Table](#11-full-checklist-for-a-brand-new-table)
12. [Running the Migration Script](#12-running-the-migration-script)
13. [SQL Decrypt Function (DBA Use)](#13-sql-decrypt-function-dba-use)
14. [Reference: Masking Patterns](#14-reference-masking-patterns)
15. [Currently Protected Fields](#15-currently-protected-fields)

---

## 1. Overview

Three layers of protection work together:

| Layer | What it does | Where it runs |
|---|---|---|
| **Encryption at rest** | AES-256-GCM encrypts each sensitive field before every DB write; auto-decrypts on read via a TypeORM `afterLoad` hook | `FieldEncryptionSubscriber` |
| **Response masking** | Replaces real values with masked strings (`u***@gmail.com`) in HTTP responses; injects `_reveal` metadata only when the requesting user has the reveal permission | `ResponseMaskingInterceptor` |
| **Reveal on demand** | Authenticated, role-gated endpoint returns the real value; every access is recorded in the audit log | `POST /reveal` in `config-service` |

### Key design decisions

- **DB schema is additive-only.** New `_enc` columns sit alongside the originals. Original columns remain as an untouched backup.
- **Feature flag.** Masking is controlled by `FF_FIELD_MASKING_EXPERIMENTAL=true` in env. If unset, the interceptor passes through unmasked data.
- **`_reveal` metadata is permission-gated at the server.** The masking interceptor checks whether the requesting user's current roles have reveal access before injecting `_reveal` keys. Users without the `PII_REVEAL` permission receive masked values with no eye-icon metadata — the reveal endpoint is also blocked by the ACL guard.
- **Never trust stale JWT roles.** The interceptor fetches the user's current roles live from the `user_role` table (using `userId` from the request header) rather than reading the JWT payload, so role changes take effect immediately without requiring a re-login.

---

## 2. Architecture & File Map

```
apps/services/service-lib/src/lib/
│
├── field-encryption/                       ← DB-level encrypt/decrypt
│   ├── decorators/
│   │   └── sensitive-field.decorator.ts    @SensitiveField({ deterministic? })
│   ├── services/
│   │   └── field-encryption.service.ts     encrypt() / encryptDeterministic() / decrypt() / isEncrypted()
│   ├── subscribers/
│   │   └── field-encryption.subscriber.ts  beforeInsert / beforeUpdate + afterLoad hooks
│   ├── field-encryption.module.ts
│   └── index.ts
│
├── field-masking/                          ← HTTP response masking + reveal RBAC
│   ├── constants/
│   │   ├── masking-patterns.constants.ts   MaskingPattern enum + MaskingConfig types (incl. CONDITIONAL)
│   │   └── masking-registry.constants.ts   ★ EDIT THIS to add/modify masked tables/fields ★
│   ├── decorators/
│   │   ├── apply-masking.decorator.ts      @ApplyMasking('tableName')
│   │   └── skip-masking.decorator.ts       @SkipMasking()
│   ├── interceptors/
│   │   └── response-masking.interceptor.ts ResponseMaskingInterceptor (recursive, RBAC-aware)
│   ├── utils/
│   │   └── masking.util.ts                 maskValue() pure function
│   ├── field-masking.module.ts             Provides AclService + UserRole repo for RBAC check
│   └── index.ts
│
├── acl.service.ts                          hasAccess(roleIds, method, path) → boolean
├── acl.guard.ts                            AclGuard — role-based route protection
│
├── entities/
│   ├── user-role.entity.ts                 user_role table (userId, roleId)
│   ├── acl-categories.entity.ts
│   ├── acl-category-action-map.entity.ts
│   ├── acl-category-action-api-map.entity.ts
│   └── role-acl-category-action-map.entity.ts
│
└── audit-history/
    └── audit-history.constants.ts          AuditHistoryAction.REVEALED

apps/services/config-service/src/app/
└── reveal/                                 ← Reveal endpoint
    ├── dto/
    │   ├── reveal-request.dto.ts           { table, field, id }
    │   └── reveal-response.dto.ts          { field, value }
    ├── reveal.controller.ts                POST /reveal
    ├── reveal.service.ts                   validate → fetch record → decrypt → audit log
    └── reveal.module.ts                    TypeOrmModule.forFeature([User, Employee, ContactCommunicationDetails])

apps/ui/iwork/src/app/pages/
├── EmployeePage/EmployeeListing/
│   └── RevealCellRenderer.tsx              Eye icon for employee PII columns
└── ContactPage/ContactListing/
    └── ContactRevealCellRenderer.tsx       Eye icon for nested contact communication details

apps/ui/ui-lib/src/lib/rbac/
└── permissionMap.ts                        FeatureKey.REVEAL_PII → CategoryKey.PII_REVEAL

scripts/
├── phase0-add-enc-columns.sql              Idempotent ALTER TABLE — adds _enc columns
├── encrypt-pii-fields.ts                   One-time data migration (plaintext → _enc)
├── acl-pii-reveal-seed.sql                 ★ Run once — inserts ACL DB rows for PII_REVEAL
├── pii-decrypt.sql                         DBA SQL function — decrypt ciphertext in DB console
└── pii-lookup.sql                          DBA SQL — lookup encrypted rows by plaintext value
```

`FieldEncryptionModule` and `FieldMaskingModule` are imported and re-exported from
`InsuranceWellnessHubServiceLibModule`, so every service that imports `service-lib` gets them
automatically.

---

## 3. How Encryption Works

### The decorator: `@SensitiveField`

```typescript
// apps/services/service-lib/src/lib/field-encryption/decorators/sensitive-field.decorator.ts

export type SensitiveFieldOptions = {
  deterministic?: boolean;    // true → same plaintext always produces same ciphertext
  lookupHashColumn?: string;  // legacy: writes HMAC hash to a separate column (search index)
};
```

Attach `@SensitiveField` to any entity property. TypeORM will automatically encrypt it on every
`INSERT` and `UPDATE`.

```typescript
@SensitiveField({ deterministic: true })
@Column({ name: 'email_id_enc', unique: true, nullable: true, type: 'text' })
emailId: string;
```

### Two encryption modes

| Mode | Decorator | Payload version | IV derivation | Use case |
|---|---|---|---|---|
| **Random IV** | `@SensitiveField()` | `v:1` | `crypto.randomBytes(12)` | Fields never searched — maximum confidentiality (SSN, passport) |
| **Deterministic** | `@SensitiveField({ deterministic: true })` | `v:2` | `HMAC-SHA256(pepper, plaintext)[0:12]` | Fields used in `WHERE` or `UNIQUE` constraints (email, mobile) |

Both modes use **AES-256-GCM** — authenticated encryption. The GCM auth tag is stored in the
payload and validated on every decryption, making silent tampering impossible.

### Encrypted payload structure

Every encrypted value stored in the DB is a **base64-encoded JSON string**:

```
base64( JSON.stringify({ v, iv, tag, ct }) )
```

| Field | Type | Description |
|---|---|---|
| `v` | `1` or `2` | Version — `1` = random IV, `2` = deterministic HMAC-derived IV |
| `iv` | base64 string | 12-byte initialization vector |
| `tag` | base64 string | 16-byte GCM authentication tag |
| `ct` | base64 string | Encrypted ciphertext |

Example stored value: `eyJ2IjoyLCJpdiI6Ik1LWFV2bVdEa0JldVVpM...`

### The subscriber: `FieldEncryptionSubscriber`

TypeORM entity subscriber registered globally via `FieldEncryptionModule`. Hooks:

- **`beforeInsert`** — encrypts all `@SensitiveField` properties before a new row is inserted
- **`beforeUpdate`** — encrypts all `@SensitiveField` properties before a row is updated

Behaviour per field:
1. Skip if value is `null`, `undefined`, or `''`
2. Skip if already encrypted (prevents double-encryption on re-saves)
3. If `lookupHashColumn` is set → write `HMAC-SHA256(pepper, plaintext)` to that column (legacy search index)
4. Encrypt with the correct mode and overwrite the property value

### Date field serialisation

Before encryption, all field values are serialised to string via a `serializeValue()` helper.
`Date` objects are formatted as `YYYY-MM-DD` (not locale string) so decryption returns the
original ISO format:

```typescript
private serializeValue(value: unknown): string {
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return String(value);
}
```

---

## 4. How Decryption Works

Decryption is **fully automatic** via the `afterLoad` hook in `FieldEncryptionSubscriber`:

```
DB row loaded ──▶ afterLoad(entity)
                       │
         for each @SensitiveField property:
           if isEncrypted(value):
             entity[field] = fieldEncryptionService.decrypt(value)
                       │
         Controller / Service receives plaintext ✓
```

No service code ever calls `decrypt()` manually. `user.emailId` is always plaintext by the time
any application code touches it.

### `decrypt()` internals

1. Base64-decode → JSON-parse → extract `iv`, `tag`, `ct`
2. `crypto.createDecipheriv('aes-256-gcm', encKey, iv)` with `authTagLength: 16`
3. Set auth tag → `decipher.update(ct)` + `decipher.final()` (validates GCM tag — throws on tamper)
4. Return UTF-8 string

Works identically for `v:1` and `v:2` because the IV is embedded in the payload in both cases.

---

## 5. How Masking Works

### Overview

Masking happens **only at the HTTP boundary** — it never touches the DB or service layer. The
`ResponseMaskingInterceptor` intercepts controller responses, walks the entire response object
recursively, and replaces sensitive field values with masked strings.

For users who have the reveal permission, it also injects a `{field}_reveal` companion key
containing the metadata needed to call the reveal endpoint:

```json
{
  "employeeId": 42,
  "emailId": "j***@gmail.com",
  "emailId_reveal": { "table": "employee", "field": "emailId", "id": 42 },
  "mobile": "xxxxxx3210",
  "mobile_reveal": { "table": "employee", "field": "mobile", "id": 42 }
}
```

Users without the reveal permission receive:

```json
{
  "employeeId": 42,
  "emailId": "j***@gmail.com",
  "mobile": "xxxxxx3210"
}
```

No `_reveal` keys, no eye icon in the UI.

### Masking registry

**File:** `apps/services/service-lib/src/lib/field-masking/constants/masking-registry.constants.ts`

```typescript
export const MASKING_REGISTRY: Record<string, TableMaskingConfig> = {

  users: {
    _primaryKey: 'userId',
    fields: {
      emailId: { pattern: MaskingPattern.EMAIL_STANDARD },
      mobile:  { pattern: MaskingPattern.LAST_N_VISIBLE, visibleCount: 4 },
    },
  },

  employee: {
    _primaryKey: 'employeeId',
    fields: {
      emailId:     { pattern: MaskingPattern.EMAIL_STANDARD },
      mobile:      { pattern: MaskingPattern.LAST_N_VISIBLE, visibleCount: 4 },
      dateOfBirth: { pattern: MaskingPattern.DIGITS_MASK },
    },
  },

  // Nested array case — each item in communicationDetails[] is matched independently.
  // The _discriminator prevents generic { id } objects from being mistakenly matched.
  contact_communication: {
    _primaryKey: 'id',
    _discriminator: { field: 'communicationType' },
    fields: {
      communicationDetails: {
        pattern: MaskingPattern.CONDITIONAL,
        typeField: 'communicationType',
        typeMap: {
          email: { pattern: MaskingPattern.EMAIL_STANDARD },
          phone: { pattern: MaskingPattern.LAST_N_VISIBLE, visibleCount: 4 },
        },
      },
    },
  },

};
```

**`_primaryKey`** — entity property name of the record's primary key. Used to detect which
registry entry applies and as the `id` in `_reveal` metadata.

**`_discriminator`** — optional guard. If set, the interceptor only applies this registry entry
to objects that also have the named field. Prevents false matches on generic `{ id }` shapes.

**`CONDITIONAL` pattern** — selects the effective masking config at runtime by reading a sibling
field's value (e.g. `communicationType`) and looking it up in `typeMap`.

### The interceptor: `ResponseMaskingInterceptor`

**File:** `apps/services/service-lib/src/lib/field-masking/interceptors/response-masking.interceptor.ts`

#### Activation conditions (all must be true)

1. `FF_FIELD_MASKING_EXPERIMENTAL=true` in environment
2. `@ApplyMasking('tableName')` decorator is present on the handler or class
3. `@SkipMasking()` is **not** present on the handler

#### RBAC check (per request)

Before processing the response, the interceptor performs a live ACL lookup:

```
request header userid
       │
       ▼
user_role table  →  current roleIds[]
                           │
                           ▼
              AclService.hasAccess(roleIds, 'POST', 'reveal')
                           │
              ┌────────────┴─────────────┐
             true                       false
              │                          │
    mask + inject _reveal          mask only
    metadata for each field        (no _reveal keys)
```

The `userid` header is read directly (not from JWT) so role changes take effect on the next
request without requiring a re-login.

#### `maskDeep` recursive algorithm

```
maskDeep(value, includeRevealMeta):
  if primitive → return as-is
  if array    → maskDeep() each element
  if object:
    for each table in MASKING_REGISTRY:
      if object has _primaryKey:
        if _discriminator defined and field absent → skip
        for each registered field present on the object:
          resolve CONDITIONAL pattern if needed
          replace field value with maskValue(value, pattern)
          if includeRevealMeta:
            inject { field }_reveal = { table, field, id }
    recurse into all nested values (skip keys ending in '_reveal')
```

Works at any nesting depth and handles all response shapes: plain objects, arrays,
`{ status, message, data }` API wrappers, `{ data: [...], count }` pagination wrappers.

#### Critical: do not use `@Res()` on masked routes

NestJS interceptors are **bypassed** when `@Res() res: Response` is used with `res.json()`.
Always return the value directly from the controller method:

```typescript
// ✅ correct — interceptor runs
@UseInterceptors(ResponseMaskingInterceptor)
@ApplyMasking('employee')
@Get()
async getEmployees() {
  return this.employeeService.findAll();
}

// ❌ wrong — interceptor is bypassed
@UseInterceptors(ResponseMaskingInterceptor)
@ApplyMasking('employee')
@Get()
async getEmployees(@Res() res: Response) {
  return res.status(200).json(await this.employeeService.findAll());
}
```

---

## 6. How the Reveal Endpoint Works

### Access is role-based

`POST /reveal` is **not a public endpoint**. Every request passes through `AclGuard`, which
checks whether the requesting user's role has the `PII_REVEAL / Read` permission mapped to the
`reveal` API in the ACL tables. If the role does not have this permission, the request is
rejected with `401 Unauthorized` — the plaintext value is never returned regardless of whether
the caller has a valid JWT.

This means:
- Assigning the `PII_REVEAL` permission to a role via `/roles` enables reveal for all users of that role.
- Removing the permission from a role immediately revokes reveal access — no re-login required.
- Every successful reveal call is written to the audit log (`AuditHistoryAction.REVEALED`).

See [Section 7](#7-role-based-access-control-for-reveal) for setup instructions.

### Location

The reveal endpoint lives in **`config-service`**:

```
apps/services/config-service/src/app/reveal/
```

Registered in `config-service/src/app/app.module.ts` via `RevealModule`.

### Request / Response

```
POST /reveal
Authorization: Bearer <jwt>         (required — global AuthGuard)
userid: <userId>                    (request header — set by API gateway)
Content-Type: application/json

Body:
{
  "table": "employee",              registry key from MASKING_REGISTRY
  "field": "emailId",               field name as registered in registry
  "id": 42                          record primary key value
}

Response 200:
{
  "field": "emailId",
  "value": "john.doe@gmail.com"
}

Response 400: unknown table or field
Response 401: role does not have PII_REVEAL permission (AclGuard blocks the request)
Response 404: record not found
```

### Supported tables

| Registry key | Entity | Repository |
|---|---|---|
| `users` | `User` | `UserRepository` |
| `employee` | `Employee` | `EmployeeRepository` |
| `contact_communication` | `ContactCommunicationDetails` | `ContactCommunicationDetailsRepository` |

### Internals (`RevealService`)

1. Validates `table` exists in `MASKING_REGISTRY` and `field` is registered under that table
2. Fetches the record via the appropriate `@InjectRepository`
3. TypeORM `afterLoad` fires automatically — the entity field is already plaintext
4. Writes an audit log entry via `AuditHistoryService.createAuditLog()`:
   - `action: AuditHistoryAction.REVEALED`
   - `entityType`: table name, `entityName`: field name, `entityId`: record id
   - `userId`, `ipAddress`, `userAgent`, `requestId` from request headers
5. Returns `{ field, value }` — value is the decrypted plaintext string

### Frontend integration flow

```
1. GET /employees/paginate
     → { emailId: "j***@gmail.com", emailId_reveal: { table, field, id } }
        (emailId_reveal is present only if user has reveal permission)

2. RevealCellRenderer renders eye icon
     → condition: revealMeta !== undefined
        (if _reveal key is absent, no eye icon is shown)

3. User clicks eye icon
     → POST /reveal { table: "employee", field: "emailId", id: 42 }
     → { field: "emailId", value: "john.doe@gmail.com" }

4. Cell shows plaintext; second click reverts to masked value
```

---

## 7. Role-Based Access Control for Reveal

The reveal feature is protected at two independent levels:

### Level 1 — API protection (AclGuard)

`AclGuard` in `service-lib` checks every request to `POST /reveal` against the ACL tables.
The reveal path is **not** in the bypass list, so any role that does not have the `PII_REVEAL`
permission mapped to the `reveal` API will receive `401 Unauthorized`.

The ACL lookup chain:

```
role_acl_category_action_map (role_id IN user's roles)
  ↕ acl_category_action_id
acl_category_action_map       (PII_REVEAL category × READ_001 action)
  ↕ id
acl_category_action_api_map   (api = 'reveal', method = 'POST')
```

All three rows must exist for access to be granted.

### Level 2 — Response masking (interceptor)

The same ACL lookup runs inside `ResponseMaskingInterceptor` when generating the list API
response. If the user does not have reveal access, `_reveal` metadata keys are **not emitted**,
so the frontend never receives the eye-icon metadata in the first place.

### Setting up the permission

**Step 1 — Run the seed script (one time per environment):**

```bash
psql -h <host> -U <user> -d <db> -f scripts/acl-pii-reveal-seed.sql
```

This creates the three required ACL rows:
- `acl_categories` — `PII_REVEAL` category, scope `config-service`
- `acl_category_action_map` — `PII_REVEAL × READ_001`
- `acl_category_action_api_map` — `api='reveal'`, `method='POST'`

**Step 2 — Assign the permission to roles via the admin UI:**

Navigate to `/roles` → select the desired role → enable **PII Reveal / Read** → Save.

This creates a `role_acl_category_action_map` row linking the role to the action map entry.

### Frontend permission map

`FeatureKey.REVEAL_PII` is registered in `permissionMap.ts` (for future frontend-only checks
if needed), but the UI currently relies purely on the server — if `_reveal` is absent in the
response, the eye icon is not rendered.

```typescript
// apps/ui/ui-lib/src/lib/rbac/permissionMap.ts
FeatureKey.REVEAL_PII → {
  scope: ScopeKey.CONFIG_SERVICE,
  category: CategoryKey.PII_REVEAL,
  action: ActionKey.READ,
}
```

---

## 8. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `FF_FIELD_ENCRYPTION_EXPERIMENTAL` | Yes | `true` enables encryption. If absent, fields stored as plaintext. |
| `FF_FIELD_MASKING_EXPERIMENTAL` | Yes | `true` enables response masking. If absent, all data flows unmasked. |
| `FIELD_ENC_KEY_BASE64` | Yes (encryption on) | AES-256 key — base64 of exactly 32 random bytes. |
| `FIELD_HASH_PEPPER` | Yes (encryption on) | Secret pepper — used to derive deterministic IVs via HMAC. |

**Generating keys for a new environment:**

```bash
# AES-256 key (32 bytes → base64)
node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64'))"

# Pepper (32 bytes → hex)
node -e "process.stdout.write(require('crypto').randomBytes(32).toString('hex'))"
```

> **Critical:** Never change `FIELD_ENC_KEY_BASE64` or `FIELD_HASH_PEPPER` after data has been
> encrypted with them. Changing the key makes all existing ciphertext permanently unreadable.
> Store in AWS Secrets Manager or equivalent — never commit to source control.

---

## 9. Adding a New Encrypted Field

### Step 1 — Add `_enc` column to DB

```sql
ALTER TABLE <table_name> ADD COLUMN IF NOT EXISTS <field_name>_enc TEXT;
```

### Step 2 — Update the entity

```typescript
import { SensitiveField } from '../field-encryption/decorators/sensitive-field.decorator';

// Before (plaintext):
@Column({ name: 'pan_number' })
panNumber: string;

// After (encrypted):
@SensitiveField({ deterministic: true })   // use deterministic if searchable / unique
@Column({ name: 'pan_number_enc', type: 'text', nullable: true })
panNumber: string;
```

**Use `deterministic: true` when:** the field has a `UNIQUE` constraint or is queried with `WHERE`.

**Use plain `@SensitiveField()` when:** the field is never queried directly (SSN, passport, etc.).

The subscriber handles everything else automatically — no other code changes needed for encryption.

### Step 3 — Migrate existing data

Add the field to `scripts/encrypt-pii-fields.ts` TASKS array and run the migration.
See [Section 12](#12-running-the-migration-script).

---

## 10. Adding Masking to a New Table

### Step 1 — Add entry to masking registry

**File:** `apps/services/service-lib/src/lib/field-masking/constants/masking-registry.constants.ts`

**Standard flat table:**

```typescript
policy_holder: {
  _primaryKey: 'id',
  fields: {
    email:    { pattern: MaskingPattern.EMAIL_STANDARD },
    mobileNo: { pattern: MaskingPattern.LAST_N_VISIBLE, visibleCount: 4 },
    panNo:    { pattern: MaskingPattern.ALTERNATE_CHARS },
  },
},
```

**Table with a nested typed array** (like `contact_communication`):

```typescript
my_table: {
  _primaryKey: 'id',
  _discriminator: { field: 'someTypeField' },  // prevents false matches
  fields: {
    value: {
      pattern: MaskingPattern.CONDITIONAL,
      typeField: 'someTypeField',
      typeMap: {
        email: { pattern: MaskingPattern.EMAIL_STANDARD },
        phone: { pattern: MaskingPattern.LAST_N_VISIBLE, visibleCount: 4 },
      },
    },
  },
},
```

### Step 2 — Apply the interceptor to the controller

```typescript
import { ResponseMaskingInterceptor, ApplyMasking, SkipMasking } from '@app/service-lib';

@Controller('policy-holders')
export class PolicyHolderController {

  // Masked route — do NOT use @Res() + res.json()
  @UseInterceptors(ResponseMaskingInterceptor)
  @ApplyMasking('policy_holder')
  @Get()
  findAll() {
    return this.policyHolderService.findAll();
  }

  // Bypass masking for a specific route
  @UseInterceptors(ResponseMaskingInterceptor)
  @ApplyMasking('policy_holder')
  @SkipMasking()
  @Get('export')
  export() {
    return this.policyHolderService.export();
  }
}
```

### Step 3 — Register in the reveal service

Add a repository injection and a case to `getRecord()` in `reveal.service.ts`:

```typescript
// constructor
@InjectRepository(PolicyHolder)
private readonly policyHolderRepo: Repository<PolicyHolder>,

// getRecord() switch
case 'policy_holder':
  return this.policyHolderRepo.findOne({ where: { [pk]: id } as any });
```

And add the entity to `RevealModule`'s `TypeOrmModule.forFeature([...])`.

---

## 11. Full Checklist for a Brand-New Table

```
□ 1. DB migration
       ALTER TABLE <table> ADD COLUMN IF NOT EXISTS <field>_enc TEXT;
       (repeat for each PII field)

□ 2. Entity
       @SensitiveField({ deterministic: true }) on each PII property
       @Column({ name: '<field>_enc', type: 'text', nullable: true })
       Remove old @Column({ name: '<field>' }) references

□ 3. masking-registry.constants.ts
       Add new entry with _primaryKey, optional _discriminator, and fields map

□ 4. Controller
       @UseInterceptors(ResponseMaskingInterceptor) + @ApplyMasking('<table>')
       Return value directly — no @Res() + res.json()

□ 5. reveal.service.ts
       @InjectRepository(NewEntity) in constructor
       case '<table>': in getRecord() switch

□ 6. reveal.module.ts
       Add NewEntity to TypeOrmModule.forFeature([...])

□ 7. Migration script
       Add a task entry in scripts/encrypt-pii-fields.ts TASKS array
       Run dry-run, verify counts, then run for real (Section 12)

□ 8. ACL seed (if not already run)
       psql ... -f scripts/acl-pii-reveal-seed.sql

□ 9. Future cleanup (after data confidence)
       ADD UNIQUE CONSTRAINT on _enc columns (if deterministic)
       DROP original plaintext columns
```

---

## 12. Running the Migration Script

**Script:** `scripts/encrypt-pii-fields.ts`

Reads plaintext from source columns, encrypts deterministically, writes to `_enc` columns.
Safe to re-run — skips rows where `_enc` is already populated.

### Prerequisites

- `_enc` columns already exist in DB
- Env vars: `FIELD_ENC_KEY_BASE64`, `FIELD_HASH_PEPPER`, `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`

### Dry run (recommended first)

```bash
DRY_RUN=true \
FIELD_ENC_KEY_BASE64="<value>" \
FIELD_HASH_PEPPER="<value>" \
DB_HOST="<host>" DB_PORT=5432 DB_USER="<user>" DB_PASSWORD="<pass>" DB_NAME="<db>" \
npx tsx scripts/encrypt-pii-fields.ts
```

Verify the expected row counts in the output, then run without `DRY_RUN`.

### Real run

```bash
FIELD_ENC_KEY_BASE64="<value>" \
FIELD_HASH_PEPPER="<value>" \
DB_HOST="<host>" DB_PORT=5432 DB_USER="<user>" DB_PASSWORD="<pass>" DB_NAME="<db>" \
npx tsx scripts/encrypt-pii-fields.ts
```

### Verify completion

```sql
-- Should return 0 after a complete migration
SELECT COUNT(*)
FROM <table>
WHERE <source_field> IS NOT NULL
  AND <source_field> <> ''
  AND <field>_enc IS NULL;
```

### Script properties

| Property | Detail |
|---|---|
| **Idempotent** | Skips rows where `_enc` column is already non-null |
| **Pagination** | Keyset (`WHERE pk > lastSeenId ORDER BY pk LIMIT 100`) — never skips rows |
| **Date serialisation** | `Date` objects formatted as `YYYY-MM-DD` before encryption |
| **Source columns** | Never modified — only `_enc` destination columns are written |

---

## 13. SQL Decrypt Function (DBA Use)

**Script:** `scripts/pii-decrypt.sql`

Pure `plpgsql` + `pgcrypto` implementation of AES-256-GCM decryption for use directly in a
PostgreSQL DB console (e.g. AWS RDS where `plpython3u` and `plv8` are unavailable).

AES-GCM decryption = AES-CTR (keystream XOR) — the auth tag verification is skipped for
read-only DBA inspection. AES-CTR is implemented using `pgcrypto`'s `encrypt()` as an AES-ECB
primitive to generate keystream blocks.

### Functions created

| Function | Purpose |
|---|---|
| `pii_decrypt(ciphertext text)` | Decrypts using key from `set_config('app.field_enc_key', ..., false)` |
| `pii_decrypt_with_key(ciphertext text, key_b64 text)` | Decrypts using key passed directly |
| `pii_is_encrypted(value text)` | Returns true if value matches the `{v, iv, tag, ct}` payload structure |

### Usage

```sql
-- Set the key for the session
SELECT set_config('app.field_enc_key', '<FIELD_ENC_KEY_BASE64>', false);

-- Decrypt a specific row
SELECT pii_decrypt(email_id_enc) AS email, pii_decrypt(mobile_enc) AS mobile
FROM users WHERE id = 42;

-- Check whether a column is encrypted
SELECT pii_is_encrypted(email_id_enc) FROM users LIMIT 1;
```

> **Note:** This function performs no GCM tag verification. Use only for read-only DBA inspection,
> not in application code.

---

## 14. Reference: Masking Patterns

All patterns are defined in `masking-patterns.constants.ts`.

| Pattern | Config | Example input | Example output | Typical use |
|---|---|---|---|---|
| `FULL` | `{ pattern: MaskingPattern.FULL }` | `John` | `xxxx` | Names in low-trust contexts |
| `LAST_N_VISIBLE` | `{ ..., visibleCount: 4 }` | `9876543210` | `xxxxxx3210` | Mobile / phone numbers |
| `FIRST_N_VISIBLE` | `{ ..., visibleCount: 4 }` | `9876543210` | `9876xxxxxx` | Prefixed identifiers |
| `EMAIL_STANDARD` | `{ pattern: MaskingPattern.EMAIL_STANDARD }` | `user@gmail.com` | `u***@g***.com` | Email addresses |
| `DIGITS_MASK` | `{ pattern: MaskingPattern.DIGITS_MASK }` | `1990-05-20` | `****-**-**` | Dates of birth, numeric IDs |
| `ALTERNATE_CHARS` | `{ pattern: MaskingPattern.ALTERNATE_CHARS }` | `AAACH1104K` | `AxAxCx1x0x` | Alphanumeric IDs (PAN) |
| `MIDDLE_MASK` | `{ ..., visibleEachSide?: 1 }` | `John` | `J**n` | Short names |
| `CONDITIONAL` | `{ ..., typeField, typeMap }` | _(runtime value)_ | _(delegated to typeMap entry)_ | Typed arrays (communication details) |

**`EMAIL_STANDARD` detail:**
- Local part: first character visible + `***`
- Domain label: first character visible + `***`
- TLD: shown as-is (`.com`, `.in`, etc.)

**`CONDITIONAL` detail:**
- At runtime, reads `object[typeField]` to select an entry from `typeMap`
- Falls back to `{ pattern: FULL }` if no matching key in `typeMap`

---

## 15. Currently Protected Fields

### Encrypted fields (at rest)

| Table | Entity property | DB column | Encryption mode |
|---|---|---|---|
| `users` | `emailId` | `email_id_enc` | deterministic (`v:2`) |
| `users` | `mobile` | `mobile_enc` | deterministic (`v:2`) |
| `employee` | `emailId` | `email_id_enc` | deterministic (`v:2`) |
| `employee` | `mobile` | `mobile_enc` | deterministic (`v:2`) |
| `employee` | `dateOfBirth` | `date_of_birth_enc` | deterministic (`v:2`) |

Both `email_id_enc` and `mobile_enc` columns carry `UNIQUE` constraints in their entities.

### Masked fields (HTTP response)

| Registry key | Field | Pattern | Example output | Eye icon in UI |
|---|---|---|---|---|
| `users` | `emailId` | `EMAIL_STANDARD` | `u***@g***.com` | — |
| `users` | `mobile` | `LAST_N_VISIBLE (4)` | `xxxxxx3210` | — |
| `employee` | `emailId` | `EMAIL_STANDARD` | `u***@g***.com` | `RevealCellRenderer` |
| `employee` | `mobile` | `LAST_N_VISIBLE (4)` | `xxxxxx3210` | `RevealCellRenderer` |
| `employee` | `dateOfBirth` | `DIGITS_MASK` | `****-**-**` | `RevealCellRenderer` |
| `contact_communication` | `communicationDetails` (email type) | `EMAIL_STANDARD` | `u***@g***.com` | `ContactRevealCellRenderer` |
| `contact_communication` | `communicationDetails` (phone type) | `LAST_N_VISIBLE (4)` | `xxxxxx3210` | `ContactRevealCellRenderer` |

The eye icon is rendered only when the API response includes `_reveal` metadata for that field,
which only happens when the requesting user's role has the `PII_REVEAL / Read` ACL permission.
