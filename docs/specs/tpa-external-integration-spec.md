# TPA External Integration Framework — Spec Document

**Version:** 2.0
**Status:** Implementation in progress
**Scope:** iWork (admin config) + IBP (employee-facing) + Scheduler (data sync)

---

## 1. Purpose

Different TPAs expose different APIs for features like Claims, E-cards, Hospital Networks, and TPA Portal Login. Today, integrating a new TPA requires code changes and a new deployment.

This framework allows **admins to configure TPA integrations entirely from iWork** — no code changes needed per TPA. Once configured, IBP automatically shows the right buttons for each employee based on their policy's TPA and calls the correct APIs with the correct data. Scheduled sync (hospital network, claims) is also driven entirely by admin config.

---

## 2. Problem Being Solved

### Today (without this framework)
- New TPA integration = developer writes code, deploys, tests
- Changing a payload field = code change + deployment
- Hospital network sync = hardcoded scheduler for one TPA (Good Health only)
- Claims sync = disabled, hardcoded for one TPA
- IBP button handler = hardcoded switch/case for 4 feature keys only
- Response field extraction = one hardcoded key per API — cannot handle multiple fields

### After this framework
- New TPA integration = admin fills forms in iWork, no code
- Changing a payload field = admin updates mapping in iWork
- Any TPA's hospital/claims data syncs automatically via generic scheduler
- IBP handles any feature dynamically via standard key system
- Response mappings handle multiple fields, any nesting depth, auto-discovered from test run

---

## 3. Three Flow Types

Every API config (`mstr_ext_application_ref`) has a **flow type** that determines what happens after the API call:

| Flow Type | What happens | Example |
|---|---|---|
| **REDIRECT** | API returns a URL → IBP opens it in new tab | E-card download, TPA portal SSO, magic link |
| **DISPLAY** | API returns data → IBP shows it to employee | Member card details, balance, validity |
| **SYNC** | API returns data → system maps fields → stores in our DB | Hospital network list, claims history |

---

## 4. Concepts

### 4.1 Feature Types
A TPA can offer multiple services. Each service is a **Feature Type** stored in `mstr_ext_feature_type` — admin-managed, no code needed to add new types.

**Pre-seeded:**

| Key | Label | Flow Type |
|---|---|---|
| `ECARD` | E-card | REDIRECT |
| `CLAIMS` | Claims | SYNC |
| `HOSPITAL_NETWORK` | Hospital Network | SYNC |
| `TPA_PORTAL_LOGIN` | TPA Portal Login | REDIRECT |

Admin can add more (e.g. `WELLNESS`, `GRIEVANCE`, `PREAUTH`) from iWork at any time.

---

### 4.2 API Config (`mstr_ext_application_ref`)
Stores **how to call the external API** — URLs, auth method, payload templates, response mappings.

One API config can be shared across multiple TPA features.

---

### 4.3 Request Field Mappings (Payload side)
For each `{{placeholder}}` in the API payload template, admin specifies where to get the value at runtime:

| source_type | Meaning | Example |
|---|---|---|
| `STATIC` | Hardcoded value, same every call | `userName = "IIRMHO"` |
| `POLICY` | From our `policy` table | `insurer_policy_number`, `policy_from` |
| `EMPLOYEE` | From `policy_enrollment_employee` | `email`, `full_name` |
| `ENROLLMENT` | From employee-policy map | `employee_tpa_id` |
| `USER_INPUT` | Employee provides at runtime | Date range for claims |

---

### 4.4 Response Mappings (NEW — replacing single response key fields)
After the API call, the TPA response needs to be interpreted. Instead of one hardcoded key, admins configure a **response mapping table** — one row per field they want to extract.

**Step 1 response mappings** — what to extract from the auth response:
- Each row maps a TPA response field (dot-notation path) to a **placeholder name**
- Those placeholder names become available as `{{placeholderName}}` in the Step 2 payload
- One row is marked `is_auth_token = true` — that field is used as the Bearer header for Step 2

**Step 2 response mappings** — what to extract from the data response:
- For REDIRECT/DISPLAY: maps TPA field → **standard key** (IBP always reads standard keys)
- For SYNC: maps TPA field → **our DB table + column** (written to DB by scheduler)

---

### 4.5 Standard Keys (REDIRECT / DISPLAY flows)
IBP always reads these standard keys from Step 2 response mappings. Same standard keys work for any TPA.

| Standard Key | What IBP does |
|---|---|
| `REDIRECT_URL` | Open in new browser tab |
| `DOWNLOAD_URL` | Trigger file download |
| `MEMBER_ID` | Display as label |
| `MEMBER_NAME` | Display as label |
| `POLICY_NUMBER` | Display as label |
| `VALID_TILL` | Display as label (date) |
| `BALANCE` | Display as label (currency) |
| `PATIENT_NAME` | Display as label |
| `TPA_ID` | Display as label |

---

### 4.6 Auth Types

| Auth Type | What happens |
|---|---|
| `DIRECT` | No auth step. Credentials go in Step 2 payload directly (e.g. userName + password). |
| `JWT` | System generates JWT internally → Step 1: send JWT to TPA verify endpoint → get token → Step 2: use token |
| `SESSION` | Step 1: call token endpoint with credentials → get access token → Step 2: call data API with access token |

---

### 4.7 Response Dot-Notation (nested extraction)
Both step 1 and step 2 response extraction supports **dot-notation** for any depth of nesting.

Admin writes the path, system extracts using:
```
"response.data.member.id".split(".").reduce((obj, key) => {
  if (Array.isArray(obj)) return obj[Number(key)];  // numeric key = array index
  return obj?.[key];
}, tpaResponse)
```

Arrays: use `.0.` notation for first item. System auto-discovers with index included.

```
TPA response:  { "members": [{ "id": "MBR123", "name": "John" }] }
Discovered:    members.0.id = "MBR123"
               members.0.name = "John"
```

**Array Phase 2** (family members, multiple e-cards) — not in scope now. Needs IBP member-picker UI. Tracked separately.

---

## 5. Database Tables

### 5.1 `mstr_ext_feature_type` (existing)
Admin-managed list of feature types.

| Column | Type | Description |
|---|---|---|
| `id` | INT PK | |
| `key` | VARCHAR(50) UNIQUE | Machine key e.g. `CLAIMS`, `ECARD` |
| `label` | VARCHAR(100) | Human label shown in iWork dropdowns |
| `description` | TEXT | Help text |
| `is_active` | BOOLEAN | |
| `display_order` | INT | |

---

### 5.2 `mstr_ext_application_ref` (existing + new columns)
API-level config — URLs, auth type, payload templates.

**Existing columns:**

| Column | Description |
|---|---|
| `label` | Unique name e.g. `good-health-claims` |
| `description` | Human description |
| `verification_token_api_url` | Step 1 URL (auth) — blank for DIRECT |
| `verification_token_api_method` | GET / POST |
| `verification_token_api_payload` | JSONB payload template with `{{placeholders}}` |
| `magic_url_api_url` | Step 2 URL (data/magic link) |
| `magic_url_api_method` | GET / POST |
| `magic_url_api_payload` | JSONB payload template |
| `auth_type` | DIRECT / JWT / SESSION |
| `step1_response_token_key` | **DEPRECATED** — replaced by response mappings |
| `step2_response_data_key` | **DEPRECATED** — replaced by response mappings |
| `iss` | JWT issuer (JWT type only) |
| `expires_in` | JWT token expiry e.g. `"10m"` |
| `field_hints` | JSONB — pre-fill hints for feature config field mappings |
| `is_active` | BOOLEAN |

**New columns (to add via migration):**

| Column | Type | Description |
|---|---|---|
| `flow_type` | VARCHAR(20) | `REDIRECT` \| `DISPLAY` \| `SYNC` (default: REDIRECT) |
| `sync_target_table` | VARCHAR(100) | SYNC only — primary DB table e.g. `mstr_hospital` |
| `sync_dedup_column` | VARCHAR(100) | SYNC only — column used for upsert dedup e.g. `external_hospital_id` |
| `sync_scope` | VARCHAR(20) | SYNC only — `PER_POLICY` \| `PER_TPA` \| `GLOBAL` |
| `sync_schedule` | VARCHAR(50) | SYNC only — cron expression e.g. `"30 13 * * *"` |
| `sync_ttl_hours` | INT | SYNC only — skip if synced within N hours (default 24) |

---

### 5.3 `tpa_external_feature_config` (existing)
Links a TPA to a feature type and its API config.

| Column | Type | Description |
|---|---|---|
| `id` | INT PK | |
| `tpa_id` | INT FK | Which TPA |
| `feature_type_id` | INT FK | Which feature type |
| `app_ref_id` | INT FK NULLABLE | Which API config |
| `label` | VARCHAR | Internal name |
| `button_label` | VARCHAR | Text on IBP button |
| `display_order` | INT | |
| `is_active` | BOOLEAN | |
| `field_mappings` | relation | → `tpa_payload_field_mapping` rows |

---

### 5.4 `tpa_payload_field_mapping` (existing — request side)
Maps each `{{placeholder}}` in the API payload to a data source.

| Column | Type | Description |
|---|---|---|
| `feature_config_id` | INT FK | Which feature |
| `external_field_name` | VARCHAR | Placeholder name in payload e.g. `policyNo` |
| `source_type` | VARCHAR | STATIC / POLICY / EMPLOYEE / ENROLLMENT / USER_INPUT |
| `source_field` | VARCHAR | DB column to read |
| `static_value` | VARCHAR | Hardcoded value (STATIC only) |
| `is_required` | BOOLEAN | |

---

### 5.5 `mstr_ext_app_response_mapping` (NEW — response side)
One table for both step 1 and step 2 response mappings across all flow types.

| Column | Type | Description |
|---|---|---|
| `id` | INT PK | |
| `app_ref_id` | INT FK → `mstr_ext_application_ref` | |
| `step` | INT | `1` or `2` |
| `response_key` | VARCHAR(200) | Dot-notation path in TPA JSON response e.g. `"access_token"`, `"response.data.ecard_url"`, `"members.0.id"` |
| `target_type` | VARCHAR(20) | `PLACEHOLDER` \| `STANDARD_KEY` \| `DB_COLUMN` |
| `output_key` | VARCHAR(100) | Name — meaning depends on target_type (see below) |
| `target_table` | VARCHAR(100) NULLABLE | DB_COLUMN only — which table e.g. `"mstr_hospital_address"` |
| `is_auth_token` | BOOLEAN | Step 1 only — marks which field goes as Bearer header to Step 2 |
| `transform` | JSONB NULLABLE | Optional transformation config |
| `display_order` | INT | UI sort order |

**`output_key` meaning by `target_type`:**

| target_type | output_key means | Example |
|---|---|---|
| `PLACEHOLDER` | Placeholder name → becomes `{{name}}` in Step 2 payload | `"accessToken"`, `"sessionId"` |
| `STANDARD_KEY` | IBP standard key | `"REDIRECT_URL"`, `"MEMBER_ID"` |
| `DB_COLUMN` | Column in `target_table` | `"city_name"`, `"claim_amount"` |

**`transform` examples:**
```json
{ "type": "SPLIT", "delimiter": "|", "output": "ARRAY" }
{ "type": "DATE_FORMAT", "from": "DD/MM/YYYY", "to": "YYYY-MM-DD" }
{ "type": "NUMBER_PARSE" }
{ "type": "UPPERCASE" }
```

**Why not reuse `MappingTemplateVersion` + `MappingTemplateColumn`?**
Those tables are built for Excel file uploads — `source_column_id` is an Excel column index (1, 2, 3...), `source_column_name` is an Excel header. They have company-level versioning designed for file processing. Completely wrong shape for API JSON response paths. Our dedicated table is cleaner and purpose-built.

---

### 5.6 All Tables Summary

| Table | Role | Status |
|---|---|---|
| `tpa` | TPA master | Existing |
| `policy_tpa_map` | Links policy → TPA | Existing |
| `policy` | Policy details | Existing |
| `policy_enrollment_employee` | Employee details | Existing |
| `mstr_ext_feature_type` | Admin-managed feature types | Existing |
| `mstr_ext_application_ref` | API config (URLs, auth, payload templates) | Existing + new columns pending |
| `tpa_external_feature_config` | TPA + feature type + API config link | Existing |
| `tpa_payload_field_mapping` | Request payload field mappings | Existing |
| `mstr_ext_app_response_mapping` | Response field mappings (step 1 + step 2) | **NEW — pending** |
| `mstr_hospital`, `mstr_hospital_address` | Hospital network data | Existing |
| `policy_claim`, `tpa_claim_data` | Claims data | Existing |

---

## 6. Architecture — Updated

```
┌─────────────────────────────────────────────────────────────────┐
│                        iWORK (Admin)                            │
│                                                                 │
│  External API Configs (/admin-settings)                         │
│    └── Create app ref: URLs + auth + payload builder            │
│    └── Run test → auto-discover response keys                   │
│    └── Map step 1 response fields → placeholders                │
│    └── Map step 2 response fields → standard keys / DB columns  │
│    └── Set flow type: REDIRECT / DISPLAY / SYNC                 │
│    └── If SYNC: set schedule, target table, dedup column        │
│                                                                 │
│  TPA → External Features (/tpa/:id/external-features)           │
│    └── Select feature type + API config                         │
│    └── Map request payload placeholders → DB columns            │
│    └── Test inline                                              │
└─────────────────────────────┬───────────────────────────────────┘
                              │ saves to DB
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATABASE                                │
│  mstr_ext_application_ref + mstr_ext_app_response_mapping       │
│  tpa_external_feature_config + tpa_payload_field_mapping        │
└──────┬──────────────────────────────────────────┬──────────────┘
       │ read at runtime (REDIRECT/DISPLAY)        │ read by scheduler (SYNC)
       ▼                                           ▼
┌──────────────────────┐               ┌───────────────────────────┐
│  document-service    │               │  Generic Sync Scheduler   │
│  /external-app-sso   │               │  (replaces hardcoded ones)│
│  /magic-url          │               │  → auth + API call        │
│                      │               │  → flatten response        │
│  Auth (JWT/SESSION/  │               │  → apply response mappings│
│  DIRECT) + API call  │               │  → upsert to target table │
│  + response mapping  │               └───────────────────────────┘
│  → normalised output │
└──────────┬───────────┘
           │ returns { REDIRECT_URL, MEMBER_ID, ... }
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      IBP (Employee)                             │
│  Dashboard → buttons driven by tpa_external_feature_config      │
│  Click → generic handler → reads standard keys from response    │
│    REDIRECT_URL → open tab                                      │
│    DOWNLOAD_URL → download                                      │
│    MEMBER_* / POLICY_* / VALID_* → show info card              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Auth Flows

### DIRECT
```
Step 1: SKIPPED
Step 2: POST TPA API with resolved payload (credentials as STATIC fields)
      ← Response mapped via step 2 response mappings
```

### SESSION
```
Step 1: POST token endpoint with credentials (STATIC fields)
      ← Response: extract fields via step 1 mappings
        e.g. access_token → placeholder "accessToken" (is_auth_token = true)
             session_id   → placeholder "sessionId"
Step 2: POST data API
        Bearer header = value of is_auth_token field from step 1
        Payload includes {{accessToken}}, {{sessionId}} resolved from step 1
      ← Response mapped via step 2 response mappings
```

### JWT
```
Step 1: System generates JWT (using iss + expiresIn)
        POST verify endpoint with JWT
      ← Response: extract token via step 1 mappings
Step 2: POST data API with token
      ← Response mapped via step 2 response mappings
```

---

## 8. Response Mapping — Auto-Discover from Test Run

Admin does NOT manually type dot-notation paths. After clicking "Run Test":

1. System makes the actual API call to TPA
2. Response is captured
3. System **flattens the response** into all dot-notation leaf paths:
   ```
   { "response": { "data": { "url": "https://...", "member": { "id": "123" } } } }
   →
   { "response.data.url": "https://...", "response.data.member.id": "123" }
   ```
   Arrays: first item used as sample, index included in path (`members.0.id`)
4. Response mapping table **auto-populates** with discovered keys + actual sample values
5. Admin only needs to:
   - Step 1 rows: name each placeholder, mark one as `is_auth_token`
   - Step 2 rows: assign `target_type` and `output_key` (standard key or DB column)

**Why:** Asking admin to manually type `response.data.ecard.download_url` is error-prone and requires knowledge of TPA response structure upfront. Auto-discover eliminates both problems.

---

## 9. Admin Configuration Flow (Complete — with Response Mappings)

### Step 1 — Create API Config (iWork → Admin Settings → External API Configs)
1. Config Name, Description, Auth Type, Payload Format, Flow Type
2. If SYNC: sync scope, cron schedule, target table, dedup column
3. Build Step 1 payload (if SESSION/JWT) using PayloadBuilder — add static/dynamic fields
4. Build Step 2 payload using PayloadBuilder
5. Run Test → system executes API call
6. **Step 1 Response Mappings** auto-populate:
   - Admin marks which field is `is_auth_token`
   - Admin names other fields as placeholders (become `{{name}}` in Step 2)
7. **Step 2 Response Mappings** auto-populate:
   - REDIRECT/DISPLAY: admin assigns standard key (REDIRECT_URL, MEMBER_ID, etc.)
   - SYNC: admin picks target table → picks DB column from that table's column list
   - Optional: set transform (SPLIT, DATE_FORMAT, NUMBER_PARSE)
8. Save

### Step 2 — Assign to TPA (iWork → Manage TPA → External Features)
1. Select Feature Type (ECARD, CLAIMS, custom)
2. Select API Config (from Step 1)
3. Set label, button label, display order, active
4. Field mappings auto-populate from `field_hints` on the API config:
   - STATIC hints → pre-filled
   - DYNAMIC hints → row shown, admin picks DB column
5. Test inline
6. Save → immediately live in IBP

---

## 10. Generic Sync Scheduler (replaces hardcoded schedulers)

**Replaces:**
- `external-hospital-sync.scheduler.ts` (hardcoded GoodHealth only)
- `tpa-claims-sync.scheduler.ts` (disabled, hardcoded)

**Logic:**
```
Query all mstr_ext_application_ref WHERE flow_type = SYNC

For each SYNC config:
  1. Determine scope:
     GLOBAL    → one API call (hospital network — same data for all)
     PER_TPA   → one call per TPA using that config
     PER_POLICY → loop all active policies for that TPA

  2. Stale check: skip if synced within sync_ttl_hours

  3. Auth + API call using existing JWT/SESSION/DIRECT framework

  4. Flatten response → apply step 2 response mappings (target_type = DB_COLUMN)
     → extract each response_key → apply transform → get output_key + target_table

  5. Upsert into target_table using sync_dedup_column

  6. Special post-processing:
     → mstr_hospital target: trigger geocoding for new records (Google Maps)

  7. Throttle: respect per-config delay between iterations

Cron: driven by sync_schedule column — each config has its own cron expression
```

**Multi-table writes (e.g. claims):**
Response mappings can have different `target_table` values — system groups by target_table and writes each group separately. Child table rows (e.g. `policy_claim_settlement`) written after parent (`policy_claim`) using inserted parent ID.

---

## 11. IBP — Generic Feature Button Handler (pending)

**Current (hardcoded):**
```typescript
switch (feature.featureKey) {
  case "ECARD": navigate("/e-card"); break;
  case "CLAIMS": navigate("/claims-corner"); break;
  case "HOSPITAL_NETWORK": navigate("/hospital"); break;
  case "TPA_PORTAL_LOGIN": handleWebAceSso(); break;
  default: toast("not available yet");   // ← any new feature fails here
}
```

**Required (generic):**
```typescript
// tpa-features API response must include appRefId + flowType
const handleFeatureClick = async (feature) => {
  if (!feature.appRefId) {
    // navigate to local route for static features
    return navigateByFeatureKey(feature.featureKey);
  }
  const result = await callSso(feature.appRefId, userInputValues);
  // result = { REDIRECT_URL, MEMBER_ID, MEMBER_NAME, ... } (flat standard keys)
  if (result.REDIRECT_URL) window.open(result.REDIRECT_URL, "_blank");
  if (result.DOWNLOAD_URL) triggerDownload(result.DOWNLOAD_URL);
  // else show result keys as info card
};
```

---

## 12. What Is Implemented vs Pending

### ✅ Done
- iWork UI: External API Configs list — full-width, paginated, clickable cards → view mode
- iWork UI: TPA External Features list — full-width, paginated, clickable cards → view mode, dead state cleaned
- iWork UI: TpaAppRefForm — FormSection pattern, no accordion, view/edit/new modes
- iWork UI: TpaExternalFeatureForm — FormSection pattern, view/edit/new modes
- View routes: `/tpa/external-api-configs/:id/view`, `/tpa/:id/external-features/:configId/view`
- Backend: `external-app-sso/magic-url` endpoint (document-service) — executes JWT/SESSION/DIRECT
- Backend: `step1ResponseTokenKey` dot-notation extraction (single field only)
- Backend: policy-service CRUD for app refs, feature types, feature configs
- DB: `mstr_ext_application_ref`, `mstr_ext_feature_type`, `tpa_external_feature_config`, `tpa_payload_field_mapping`
- IBP: `GET /employee/:id/tpa-features` → returns active feature buttons
- Existing schedulers: hospital sync (Good Health only), claims sync skeleton (disabled)

### ⏳ Pending
- DB migration: `mstr_ext_app_response_mapping` table
- DB migration: new columns on `mstr_ext_application_ref` (flow_type, sync_*)
- Backend: update SSO executor to use response mapping table (replace single key fields)
- Backend: generic sync scheduler (replace hardcoded hospital + claims schedulers)
- iWork UI: Response Mappings section in TpaAppRefForm (auto-discover + map)
- iWork UI: flow_type selector, SYNC-specific fields in TpaAppRefForm
- IBP: update `tpa-features` API to return `appRefId` + `flowType`
- IBP: replace hardcoded switch/case with generic feature handler

---

## 13. Scenarios — Adding a New TPA Integration

### Scenario A: New TPA with E-card (REDIRECT)
1. Admin creates API config — flow_type: REDIRECT, auth: SESSION
2. Builds step 1 payload (client_id, client_secret as STATIC)
3. Builds step 2 payload (employee_id as DYNAMIC → mapped to ENROLLMENT.employee_tpa_id)
4. Runs test — step 1 response auto-populated, marks `access_token` as auth token
5. Step 2 response auto-populated — maps `download_url` → `REDIRECT_URL`
6. Goes to TPA → External Features → adds ECARD feature with this API config
7. Employee sees "E-card" button in IBP → click → session auth → get URL → new tab opens

### Scenario B: New TPA with Hospital Network (SYNC)
1. Admin creates API config — flow_type: SYNC, auth: DIRECT
2. Builds step 2 payload (username + password as STATIC)
3. sync_scope: GLOBAL, sync_schedule: `"30 13 * * *"`, sync_target_table: `mstr_hospital`, sync_dedup_column: `external_hospital_id`
4. Runs test — step 2 response auto-populated
5. Maps response fields: HOSPITAL_NAME → `name` (mstr_hospital), CITY → `city_name` (mstr_hospital_address), etc.
6. Sets transforms where needed: INSURANCECOMPANY → SPLIT by `|` → ARRAY
7. Save — generic scheduler picks this up, runs daily, syncs all hospitals

### Scenario C: New TPA with Claims (SYNC, PER_POLICY)
1. Admin creates API config — flow_type: SYNC, auth: DIRECT
2. sync_scope: PER_POLICY (iterates each active policy for that TPA)
3. Payload: policyNo → POLICY.insurer_policy_number, userName → STATIC "IIRMHO"
4. Runs test with one policy number — response auto-discovered
5. Maps: TPA_CLAIM_NO → `tpa_claim_no` (policy_claim), HOSPITAL_NAME → `clm_hospital` (policy_claim), PAID_AMOUNT → `settlement_amount` (policy_claim_settlement)
6. Save — generic scheduler loops all policies daily, syncs claims

---

## 14. iWork Pages

| Page | URL | Purpose |
|---|---|---|
| Admin Settings | `/admin-settings` | Tabbed admin module |
| External API Configs | `/admin-settings?tab=external-api-configs` | Manage `mstr_ext_application_ref` |
| TPA External Features | `/tpa/:id/external-features` | Per-TPA feature config |
| API Config detail/view | `/tpa/external-api-configs/:id/view` | View mode |
| API Config edit | `/tpa/external-api-configs/:id/edit` | Edit mode |
| API Config new | `/tpa/external-api-configs/new` | Create |
| Feature detail/view | `/tpa/:id/external-features/:configId/view` | View mode |
| Feature edit | `/tpa/:id/external-features/:configId/edit` | Edit mode |
| Feature new | `/tpa/:id/external-features/new` | Create |

---

## 15. API Endpoints

### policy-service (`/tpa-external-feature/...`)

| Method | Path | Purpose |
|---|---|---|
| GET | `/app-refs` | List all API configs |
| GET | `/app-refs/:id` | Get one |
| POST | `/app-refs` | Create |
| PUT | `/app-refs/:id` | Update |
| DELETE | `/app-refs/:id` | Delete |
| POST | `/app-refs/test` | Test inline — executes step1 + step2, returns response + flattened keys |
| GET | `/feature-types` | List feature types |
| POST | `/feature-types` | Create feature type |
| PUT | `/feature-types/:id` | Update |
| GET | `/configs/all` | All feature configs (admin settings page) |
| GET | `/tpa/:tpaId/configs` | Feature configs for one TPA |
| POST | `/configs` | Create feature config |
| PUT | `/configs/:id` | Update |
| DELETE | `/configs/:id` | Delete |
| GET | `/db-schema` | DB table+column list (for mapping UI dropdowns) |
| **GET** | **`/app-refs/:id/response-mappings`** | **List response mappings — PENDING** |
| **POST** | **`/app-refs/:id/response-mappings`** | **Create response mapping — PENDING** |
| **PUT** | **`/response-mappings/:id`** | **Update response mapping — PENDING** |
| **DELETE** | **`/response-mappings/:id`** | **Delete response mapping — PENDING** |

### document-service
| Method | Path | Purpose |
|---|---|---|
| POST | `/external-app-sso/magic-url` | Execute SSO — auth + API call + response mapping → returns normalised standard keys |

### ibp-service
| Method | Path | Purpose |
|---|---|---|
| GET | `/employee/:id/tpa-features` | Active feature buttons for employee (must add appRefId + flowType to response) |

---

## 16. Edge Cases Not Yet Covered

| Case | Status |
|---|---|
| **Family/multiple members in response** (arrays beyond first item) | Phase 2 — needs IBP member-picker UI |
| **Refresh token / token expiry** | Not handled — no auto-refresh in live SSO flow |
| **TPA API rate limiting** | Per-policy 2s delay exists in scheduler, but no per-TPA config |
| **Geocoding for non-GoodHealth hospital syncs** | Hardcoded post-process hook for GoodHealth only |
| **SYNC partial failure recovery** | No rollback if sync fails mid-batch |
| **3+ step APIs** | Framework assumes max 2 steps |
| **Webhook-based TPAs** (TPA pushes data to us) | Framework covers only outbound calls |
| **File-based SYNC** (SFTP/email) | Framework covers API-based sync only |
| **MappingTemplateVersion reuse** | **Decided: NO** — those tables are for Excel file uploads (source_column_id = Excel index). Our dedicated `mstr_ext_app_response_mapping` table is the correct approach. |

---

## 17. Implementation Order

1. **DB migration** — `mstr_ext_app_response_mapping` + new columns on `mstr_ext_application_ref`
2. **service-lib** — new entity `MstrExtAppResponseMapping`
3. **policy-service** — CRUD for response mappings, `flow_type` + SYNC columns on app-refs, update test endpoint to return flattened response keys
4. **document-service** — update SSO executor: replace single key extraction with response mapping loop; return normalised flat object to IBP
5. **iWork UI** — add Response Mappings section to `TpaAppRefForm` (auto-discover UI + mapping table), add flow_type selector + SYNC fields
6. **Generic sync scheduler** — new scheduler in scheduler-service, replaces hardcoded hospital + claims schedulers
7. **IBP** — update `tpa-features` response to include `appRefId` + `flowType`; replace switch/case with generic handler

---

## 18. Key Files

| Purpose | File |
|---|---|
| Admin API Configs list | `apps/ui/iwork/src/app/pages/TpaAppRefsPage/index.tsx` |
| Admin API Config form | `apps/ui/iwork/src/app/pages/TpaAppRefsPage/TpaAppRefForm/index.tsx` |
| TPA external features list | `apps/ui/iwork/src/app/pages/InsurerPage/TpaExternalFeatures/index.tsx` |
| TPA external feature form | `apps/ui/iwork/src/app/pages/InsurerPage/TpaExternalFeatures/TpaExternalFeatureForm/index.tsx` |
| Routes | `apps/ui/iwork/src/app/routes/insurer.route.tsx` |
| SSO executor | `apps/services/document-service/src/app/external-app/external-app.service.ts` |
| Hospital sync (hardcoded — to be replaced) | `apps/services/scheduler-service/src/app/scheduler/external-hospital-sync.scheduler.ts` |
| Claims sync skeleton (disabled) | `apps/services/scheduler-service/src/app/scheduler/tpa-claims-sync.scheduler.ts` |
| TPA feature admin API | `apps/services/policy-service/src/app/tpa-external-feature/` |
| IBP dashboard buttons | `apps/ui/ibp/src/app/components/DashboardBenifitsSection/index.tsx` |
| IBP e-card page | `apps/ui/ibp/src/app/pages/ECardPage/index.tsx` |
| App ref entity | `apps/services/service-lib/src/lib/entities/mstr-ext-application-ref.entity.ts` |
| Feature config entity | `apps/services/service-lib/src/lib/entities/tpa-external-feature-config.entity.ts` |

---

*End of Spec — v2.0*
