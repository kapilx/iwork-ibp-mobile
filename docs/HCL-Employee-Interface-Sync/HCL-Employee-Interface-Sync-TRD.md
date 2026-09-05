# HCL Employee Interface — RiskWatch Sync — TRD

**Scope:** Inbound HCL API → validation → intake table → RiskWatch review/selection → xlsx generation via the existing per-policy template → existing enrollment-upload/endorsement pipeline → endorsement created → intake records reconciled to `PROCESSED`/`FAILED`.
**Companion:** [HCL-Employee-Interface-Sync-PRD.md](./HCL-Employee-Interface-Sync-PRD.md) for business requirements and scope.

---

## 1. High-level architecture

```
┌───────────────────┐
│   HCL HR System    │
└─────────┬───────────┘
          │ POST (UserName/Password, Flag_operationType, objEMPLOYEE_DATA)
          ▼
┌────────────────────────────────────────────────────────────────┐
│ api-gateway                                                     │
│   AuthGuard  — JWT-bypass entry scoped to this one path (§12)   │
│   AclGuard   — matching bypass for this service's routes (§12)  │
└─────────┬────────────────────────────────────────────────────────┘
          ▼
┌────────────────────────────────────────────────────────────────┐
│ external-integration-service — hcl-integration/ module           │
│  (dedicated service for inbound, external-system-initiated       │
│   integrations — HCL today, any future partner gets a sibling    │
│   module here, not a new service — see PRD/architecture note)    │
│  HclIntegrationController → HclIntegrationService                │
│    1. Authenticate (UserName/Password vs. env)                  │
│    2. Validate shape for Flag_operationType (§4)                │
│    3. Duplicate check (§7)                                       │
│    4. Resolve policy/company from policyno — reject if unresolved│
│    5. Insert HCL Employee/Dependent Intake row(s), status RECEIVED│
│    6. Return documented GetStatus/GetEmpStatus response          │
└─────────┬────────────────────────────────────────────────────────┘
          │ read (list/preview)
          ▼
┌────────────────────────────────────────────────────────────────┐
│ RiskWatch (IBP UI) — "HCL" integration card                      │
│   - lists intake records: operation, employee/dependent detail,  │
│     status, received date, endorsement ID, failure reason        │
│   - admin selects eligible (RECEIVED/FAILED) records for a policy│
│   - "Create Endorsement" action                                  │
└─────────┬────────────────────────────────────────────────────────┘
          │ navigates with mapped employee data (as-built — §8)
          ▼
┌────────────────────────────────────────────────────────────────┐
│ ZohoEndorsementPage (existing IBP frontend page, REUSED not      │
│ rebuilt) — admin picks the policy, page fetches that policy's    │
│ existing enrollment template, builds the xlsx client-side,       │
│ uploads it, and calls the existing enrollment-upload endpoint,   │
│ exactly as it already does for Zoho-sourced data. On success it  │
│ calls back into external-integration-service's mark-processing   │
│ endpoint with the resulting document_processing_file/endorsement │
│ ids (generic hook, not Zoho- or HCL-specific — §8).               │
└─────────┬────────────────────────────────────────────────────────┘
          ▼
┌────────────────────────────────────────────────────────────────┐
│ Existing Enrollment/Endorsement Pipeline (UNCHANGED)              │
│   PolicyRepository.createEnrollmentUpload → Endorsement +          │
│   document_processing_file (status CREATED)                        │
│   → EnrollmentUploadScheduler (cron) → processEmployeeUpload        │
│   → policy_enrollment_employee / policy_enrollment_dependent        │
│   → document_processing_file.process_status → COMPLETED | FAILED    │
└─────────┬────────────────────────────────────────────────────────┘
          │ polled
          ▼
┌────────────────────────────────────────────────────────────────┐
│ Intake Reconciliation Poller (scheduler-service, new, small)      │
│   - watches document_processing_file rows created by this feature │
│   - COMPLETED → linked intake rows → PROCESSED, endorsement_id set │
│   - FAILED    → linked intake rows → FAILED, failure reason stored │
└────────────────────────────────────────────────────────────────┘
```

No `mstr_ext_application_ref`, no `document-service` magic-url call, no `generic-tpa-sync.scheduler.ts` involvement — that framework assumes IBP is the caller, which is not true here (PRD §2, Finding 2).

**Why a dedicated service, not a module inside `ibp-service` (as originally built):** this endpoint is reached directly by an external, unauthenticated caller — it bypasses the normal JWT/ACL flow by design (§12). Housing that alongside `ibp-service`'s much larger, JWT-protected HR-portal surface made the exception harder to reason about and audit. `external-integration-service` is the dedicated, minimal home for this shape of integration; a future external system (any other TPA/client HR system pushing data to us) gets its own sibling module here, not a new service and not another exception carved into `ibp-service`.

## 2. End-to-end sequence flow

1. HCL HR System → `POST /integrations/hcl/process-enroll-data` (external-integration-service).
2. `HclIntegrationController` validates the request shape (§4). Credential check against `HCL_USERNAME`/`HCL_PASSWORD` exists in `HclIntegrationService` but is currently disabled (commented out) — not re-enabled as part of this pass.
3. `HclIntegrationService` resolves `policyno` → `policy_id`/`company_id`; rejects the whole request (no intake row inserted) if unresolvable (PRD FR-10).
4. Duplicate check against existing intake rows (§7); if a duplicate, return the previously-computed response without inserting again.
5. Insert one HCL Employee/Dependent Intake row per entry in `objEMPLOYEE_DATA[]`, storing that entry's dependents together as a `parsed_dependents` JSON array on the same row (as-built — simpler than the row-per-dependent model originally sketched here; see §5.1) with `status = RECEIVED`.
6. Return the documented response shape (`GetStatus`/`GetEmpStatus`) to HCL.
7. RiskWatch calls `GET /integrations/hcl/company/:companyId/intake`; admin reviews and selects one or more `RECEIVED`/`FAILED` rows via checkboxes, constrained in the UI to a single resolved `policyId` per selection (`HclIntakeDialog.tsx`).
8. Admin clicks "Create Endorsement." As-built, this does **not** call a new server-side endorsement-generation endpoint — it maps the selected rows into the same employee shape `ZohoEndorsementPage` already consumes and navigates there (§8). On that existing page the admin picks the policy, the page fetches that policy's template, builds the xlsx, uploads it, and calls the existing `POST /:policyId/enrollment-upload` — creating an `Endorsement` row and a `document_processing_file` row exactly as it does for Zoho-sourced data.
9. On that submission's success, `ZohoEndorsementPage` calls a generic post-success hook (not Zoho- or HCL-specific) which POSTs to `external-integration-service`'s `/integrations/hcl/intake/mark-processing` with the selected intake ids + the resulting `document_processing_file_id`/`endorsement_id`. This moves the selected intake rows to `PROCESSING` and records that linkage — never `PROCESSED` at this point (PRD FR-7).
10. The existing `EnrollmentUploadScheduler` (unmodified, cron-driven) picks up the `document_processing_file` row, parses it, and writes into `policy_enrollment_employee` / `policy_enrollment_dependent`, finishing with `process_status = COMPLETED` or `FAILED`.
11. The Intake Reconciliation Poller (scheduler-service) observes that `process_status` transition and updates the linked intake rows:
    - `COMPLETED` → intake rows → `PROCESSED`, `endorsement_id` populated.
    - `FAILED` → intake rows → `FAILED`, failure reason populated (§11 on granularity limits).
12. RiskWatch reflects the final status on next read (admin clicks "Refresh" in the dialog) — no separate push/notification mechanism is proposed (consistent with this codebase's existing scheduler/poll-based patterns; no event bus was found in this area).

## 3. Component/service responsibilities

| Component | Status | Responsibility |
|---|---|---|
| `HclIntegrationController` / `HclIntegrationService` (`apps/services/external-integration-service/src/app/hcl-integration/`) | New, dedicated service | Auth, validation, dedup, intake persistence, documented response |
| HCL Employee/Dependent Intake table + repository | New | Durable staging store, status lifecycle, source of truth for RiskWatch |
| RiskWatch "HCL" card + intake dialog (`apps/ui/ibp/src/app/components/SettingsIntegrationsTab/index.tsx`, `HclIntakeDialog.tsx`) | New | List, select, trigger "Create Endorsement", show outcome |
| `ZohoEndorsementPage` (`apps/ui/ibp/src/app/pages/ZohoEndorsementPage/index.tsx`) | Existing, reused (extended with a generic post-success hook — §8) | Policy selection, template fetch, xlsx build, upload, enrollment-upload call — for HCL exactly as it already does for Zoho, no new "Endorsement File Builder" service was built |
| `POST /:policyId/enrollment-upload` (`policy.controller.ts:4398`) → `PolicyRepository.createEnrollmentUpload` | Existing, unchanged | Creates `Endorsement` + `document_processing_file` |
| `EnrollmentUploadScheduler` (`apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts`) → `processEmployeeUpload` | Existing, unchanged | Parses the uploaded file, writes `policy_enrollment_employee`/`policy_enrollment_dependent`, sets `document_processing_file.process_status` |
| `HclIntakeReconciliationScheduler` (`apps/services/scheduler-service/src/app/scheduler/hcl-intake-reconciliation.scheduler.ts`) | New, small scheduler | Bridges `document_processing_file.process_status` back onto intake row status — this link does not exist elsewhere in the codebase |

## 4. HCL inbound API specification

**Endpoint:** `POST /integrations/hcl/process-enroll-data`, served by `external-integration-service` — not the literal `broker.integratedbenefitsportal.com/...` path (matching that literal path is a go-live decision, out of scope here per PRD §6), and not `ibp-service` (moved out into its own dedicated service — see §1 for why).

**Authentication:** `UserName`/`Password` fields in the request body, checked against configured credentials (§12). No separate auth handshake — matches the document's own shape (credentials on every call, no session/token).

**Request DTO** — matches the document's shape field-for-field, nothing added or renamed at the wire level:

```ts
class HclProcessEnrollDataDto {
  UserName: string;
  Password: string;
  Flag_operationType: "AD" | "BI" | "DD" | "ED" | "ES" | "ET" | "NA";
  Groupcode: string;
  policyno: string;
  SelfCount: number;
  Del_hcldepid: number;
  wef: string;
  Del_deletionremarks: string;
  prom_ctc: number;
  prom_grade: string;
  prom_companyid: number;
  prom_basesi: number;
  objEMPLOYEE_DATA: {
    E_EMP_HCL: {
      EIN: string; ENCRYPT_EIN?: string; INSUREDNAME: string; EMAIL: string;
      MOBILE: string; CTC: number; NO_OF_DEPENDENTS: number; IS_ESI: number;
      HCL_ENTITY: string; TRIGGER_FLAG: number; IS_SEZ: number; IS_EMCP?: number;
      IS_EMPAD?: number; GRADE: string; DOB: string; DOJ: string;
      INDIANADDRESS: string; MARITAL_STATUS: string; GENDER: string;
      OLDEMPID: number; LOCATION: string; CHECK_SUM: string; BLOOD_GROUP: number;
    };
    E_DEP_HCL?: Array<{
      HCL_DEPID: number; DEP_NAME: string; HCL_DEPADDON: string; HCL_DEPREL: number;
      DEP_DOB: string; DEP_GENDER: string; MARITAL_STATUS: string;
      CHECK_SUM: string; TRIGGER_FLAG: number; IS_DEP_EMCP?: number;
    }>;
  }[];
}
```

**Per-operation required-field rules** (validated before any persistence — PRD FR-1):

| `Flag_operationType` | Required on `E_EMP_HCL` beyond common fields | `E_DEP_HCL[]` |
|---|---|---|
| `AD` | `EIN`, `IS_EMPAD`, `IS_EMCP` | Optional; full shape if present |
| `BI` | `EIN`, `INSUREDNAME` | Optional; full shape if present |
| `DD` | `EIN`; root-level `Del_hcldepid` required | Not used to identify the deletion target (the document's own `DD` sample sends placeholder/empty dependent entries alongside the real `Del_hcldepid`) |
| `ED` | `EIN` | Not present in this operation |
| `ES` | `EIN` | Not present in this operation |
| `ET` | `EIN` | Optional; full shape if present |
| `NA` | `EIN` (identifies the existing employee) | Required — `DEP_NAME`, `HCL_DEPREL`, `DEP_DOB`, `DEP_GENDER` |

Common rules: `Flag_operationType` must be one of the seven documented values; date-shaped fields (`DOB`, `DOJ`, `wef`, `DEP_DOB`) are validated as dates but an empty string is treated as "not provided" rather than an invalid date, since several of the document's own samples (`DD`, `ES`) send empty strings for fields that operation doesn't use. `CHECK_SUM` is required and stored, never algorithmically verified (undocumented algorithm).

**Response shapes** — exactly as documented, per operation and (for `AD`) per `IS_EMCP`/`IS_EMPAD` combination; see PRD §1 for the message table. `BI` additionally populates `GetEmpStatus[]`, one entry per employee in the batch, matching the document's own sample.

**`policyno` rejection (PRD FR-10, decided not TBD)** — checked once per request, before any per-employee validation or intake insert, since `policyno` lives at the request root, not per-`E_EMP_HCL` entry:

| Condition | HTTP | `GetStatus.returnMessage` |
|---|---|---|
| `policyno` absent from the request | 400 | `"policyno is missing in the request."` |
| `policyno` present but no `policy.insurer_policy_number` matches it | 400 | `"Policy number \"<value>\" is not available in IIRM database."` |

Both are hard rejections — no `hcl_employee_intake` row is inserted for the request. This means HCL's own document sample payloads (which use placeholder values like `"900020001111"`/`"NA"`) are rejected outright by this endpoint, not landed with a null `policy_id`/`company_id` as an earlier draft of this design did — test payloads must use a real `policy.insurer_policy_number` from the target environment.

## 5. Intake database/table design and relationships

### 5.1 `hcl_employee_intake` — the staging table (PRD's "HCL Employee/Dependent Intake Table")

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `flag_operation_type` | varchar(2) | `AD`, `BI`, `DD`, `ED`, `ES`, `ET`, `NA` |
| `groupcode` | varchar | from request root |
| `policy_no` | varchar | from request root, as received |
| `policy_id` | int, FK → `policy(id)` | resolved from `policy_no` — **required at intake, not nullable in practice**: `HclIntegrationService.processEnrollData` rejects the request before insert if this doesn't resolve (see §4 error table), so no row with a null `policy_id` should ever be created going forward. Column itself stays nullable at the schema level only because a small number of rows inserted before this check existed may still carry `NULL` here. |
| `company_id` | int, FK → `company(id)` | resolved alongside `policy_id`, same non-null-in-practice note |
| `ein` | varchar | from `E_EMP_HCL.EIN`, indexed |
| `hcl_depid` | int, nullable | from `E_DEP_HCL[].HCL_DEPID` or root `Del_hcldepid`; null for employee-only records |
| `check_sum` | varchar | from the relevant `CHECK_SUM` field — used for dedup, not verified (§7) |
| `raw_payload` | jsonb | full request body, for traceability and re-processing |
| `parsed_employee` | jsonb | flattened `E_EMP_HCL` |
| `parsed_dependents` | jsonb array | **as-built:** flattened `E_DEP_HCL[]` as a single JSON array on the employee's own row — simpler than the row-per-dependent model this section originally proposed (one row per employee entry in `objEMPLOYEE_DATA[]`, not a separate row per dependent). Trades away per-dependent status/endorsement granularity for a much simpler write path; revisit only if per-dependent tracking becomes a real requirement. |
| `status` | varchar | `RECEIVED` / `PROCESSING` / `PROCESSED` / `FAILED` (§6) |
| `failure_reason` | text, nullable | populated when `status = FAILED` (§11) |
| `endorsement_id` | int, nullable, FK → `endorsement(id)` | populated once the linked endorsement is created |
| `document_processing_file_id` | int, nullable, FK → `document_processing_file(id)` | set at `PROCESSING`, used by the reconciliation poller (§10) |
| `created_at` / `updated_at` / `processed_at` | timestamptz | `processed_at` set on transition to `PROCESSED` or `FAILED` |

**As-built:** one row per entry in `objEMPLOYEE_DATA[]` (so an `AD`/`BI`/`ET` payload with dependents produces one intake row total per employee, with all of that employee's dependents nested in `parsed_dependents`) — not one row per dependent as originally sketched. `DD`'s target dependent is identified via `hcl_depid` on the same employee-level row, not a dedicated dependent row.

### 5.2 `hcl_employee_external_ref` — identifier mapping, for traceability and duplicate/update detection (**designed, not yet built**)

Not implemented in this pass — no migration, no entity, no code references it. Documented here as the design for when the reconciliation poller needs to resolve `policy_enrollment_employee`/`policy_enrollment_dependent` ids back to the originating `EIN`/`HCL_DEPID` (§10's "exact resolution strategy is an implementation detail to confirm during build" note still applies). Currently the reconciliation poller only updates `hcl_employee_intake.status`/`endorsement_id` — it does not yet populate anything resembling this table.

**Naming note:** this codebase already uses `employee_tpa_id`/`dependent_tpa_id` (on `policy_enrollment_employee`/`policy_enrollment_dependent`) to mean the ID assigned by an insurer's **claims-TPA** — an unrelated concept. This mapping intentionally avoids that name.

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `ein` | varchar | indexed |
| `company_id` | int, FK → `company(id)` | |
| `employee_id` | int, nullable, FK → `policy_enrollment_employee(id)` | populated once the employee has actually been created by the existing pipeline (i.e., after an intake row referencing this `EIN` reaches `PROCESSED`) |
| `hcl_depid` | int, nullable | |
| `dependent_id` | int, nullable, FK → `policy_enrollment_dependent(id)` | populated the same way, for dependent-scoped mappings |
| `created_at` / `updated_at` | timestamptz | |

**Unique constraints:** `(ein, company_id)` for employee-level rows; `(hcl_depid, employee_id)` for dependent-level rows.

Purpose: once an `EIN` has produced a real `policy_enrollment_employee` row, a later HCL request for the same `EIN` should be recognized as "this person already exists" (for RiskWatch display and for building the correct xlsx row — e.g. whether the template needs to treat it as a new addition or an update). This table is populated by the reconciliation poller (§10) at the same time an intake row moves to `PROCESSED`, not at intake time — before that point we do not yet know the internal `employee_id`.

Migration files (standalone `.sql`, matching this repo's convention under `database-migrations/sql/`): `hcl-employee-intake-table.sql`, `hcl-employee-external-ref-table.sql`.
Entities: `apps/services/service-lib/src/lib/entities/hcl-employee-intake.entity.ts`, `hcl-employee-external-ref.entity.ts`.

## 6. Processing-status lifecycle

```
                 ┌───────────┐
   valid, stored │ RECEIVED  │◄──────────────────────────┐
                 └─────┬─────┘                            │
                        │ admin selects + triggers          │ admin retries
                        │ "Create Endorsement"               │ a FAILED record
                        ▼                                    │
                 ┌────────────┐                        ┌─────┴─────┐
                 │ PROCESSING │───────────────────────►│  FAILED   │
                 └─────┬──────┘   downstream pipeline    └───────────┘
                        │           reports FAILED
                        │ downstream pipeline
                        │ reports COMPLETED
                        ▼
                 ┌────────────┐
                 │ PROCESSED  │  (terminal — endorsement_id set)
                 └────────────┘
```

- `RECEIVED`: default state on successful intake (§2 step 5). Not yet selected for endorsement.
- `PROCESSING`: selected by an admin and submitted into the existing enrollment-upload pipeline; awaiting the scheduler's outcome.
- `PROCESSED`: terminal success — the linked `document_processing_file` reached `COMPLETED`, `endorsement_id` is set. Per PRD FR-7, this transition happens **only** after the reconciliation poller confirms the pipeline's own success, never optimistically at selection time.
- `FAILED`: the linked `document_processing_file` reached `FAILED`, or a pre-submission error occurred (e.g., template fetch failure). Carries a `failure_reason` and is retryable — an admin can re-select a `FAILED` record and trigger generation again, moving it back to `PROCESSING`.

## 7. Idempotency and duplicate-handling strategy

**What the document actually supports:** `EIN` (employee identity) and `CHECK_SUM` (an opaque hash whose derivation HCL has not documented). There is no explicit request ID, transaction ID, or sequence number anywhere in the document's request shape.

**Mechanism used:** dedup key `(ein, check_sum)` for employee-level records, `(hcl_depid, check_sum)` scoped under the employee for dependent-level records — same approach as this codebase's existing external-data dedup patterns (`ON CONFLICT ... DO NOTHING` on a natural key, as used for `external_hr_policy_map`; `ON CONFLICT ... DO UPDATE` as used for `tpa_claim_data`). A request matching an existing intake row's `(ein, check_sum)` is treated as a repeat: return the same response as the original call, do not insert a second intake row.

**TBD / To Be Confirmed:** because `CHECK_SUM`'s algorithm is undocumented, this mechanism cannot be verified to have the property an idempotency key needs — that it's stable for identical data and different for changed data. It is the best mechanism the document supports, but it is a best effort, not a guarantee, until HCL confirms the algorithm. If HCL can supply a genuine per-request identifier in a future revision of the interface, that should replace this mechanism.

## 8. RiskWatch UI/data flow

`apps/ui/ibp/src/app/components/SettingsIntegrationsTab/` — "HCL Employee Interface" card alongside the existing Zoho card, opening `HclIntakeDialog.tsx`:

- `GET /integrations/hcl/company/:companyId/intake?status=` (external-integration-service) → list of intake rows for a company, each with `ein`, `flagOperationType`, employee/dependent detail (from `parsedEmployee`/`parsedDependents`), `status`, `createdAt`, `endorsementId`, `failureReason`. (A parallel `GET .../policy/:policyId/intake` and a `GET .../intake/unresolved` — for rows whose `policyno` never resolved, from before FR-10's hard rejection was added — also exist.)
- List view columns: EIN, Employee/Dependent, Operation, Status, Received, Endorsement ID, Failure Info — matching the PRD's required display fields (FR-4).
- Selection: checkboxes on `RECEIVED`/`FAILED` rows; the dialog computes the distinct `policyId`s among currently-checked rows and disables checking any row whose `policyId` differs, so a selection can never span more than one policy (the existing enrollment-upload endpoint is per-`policyId`).
- **"Create Endorsement" action — as-built, differs from this section's original plan:** rather than a new server-side generate-endorsement endpoint, the selected rows are mapped into the `ZohoEmployee` shape and the admin is navigated to the existing `ZohoEndorsementPage` (`/hr-portal/zoho-endorsement`) with that data pre-loaded (§9). That page — unmodified in its core flow — handles policy selection, template fetch, xlsx build, and the `enrollment-upload` call itself. On success it invokes a generic (non-Zoho-specific) hook back to `POST /integrations/hcl/intake/mark-processing` with the selected intake ids and the resulting `document_processing_file_id`/`endorsement_id`, which is what actually moves those rows to `PROCESSING`.
- No "Preview, don't write" dialog carried over from earlier draft thinking — review now happens directly against durable intake rows, and the admin's selection-and-generate action is itself the approval step (see PRD §11).

## 9. Employee/dependent → endorsement-file mapping

**As-built:** there is no separate "Endorsement File Builder" service or template-column-mapping code written for HCL. Selected intake rows are converted, client-side in `HclIntakeDialog.tsx`, into the same `ZohoEmployee`-shaped object `ZohoEndorsementPage` already accepts (`employeeId`, `firstName`, `lastName`, `email`, `mobile`, `dateOfBirth`, `gender`, `designation`, `department`, `dateOfJoining`, `employmentStatus`, `ctc`), then that existing page's own template-fetch + `FIELD_PATTERNS` fuzzy-match logic (unmodified) does the real mapping onto the policy's template — the same mechanism it already uses for Zoho data, not a new implementation.

The conversion from HCL's fields is a best-effort approximation, not a verified mapping:
- `firstName`/`lastName` — naive split of `INSUREDNAME` on the first space.
- `designation` — `GRADE` used as a stand-in; HCL has no actual designation field.
- `department` — left blank; HCL's document has no equivalent field at all.
- `employmentStatus` — derived as `"Inactive"` for `ED`/`ES`/`AD` with `IS_EMPAD=0`, `"Active"` otherwise; not a field HCL sends directly.
- `email`/`mobile`/`dateOfBirth`/`dateOfJoining`/`gender`/`ctc` — direct pass-through of `EMAIL`/`MOBILE`/`DOB`/`DOJ`/`GENDER`/`CTC`.

**Fixed — dependents are now carried through.** `HclIntakeDialog.tsx`'s `mapDependentToRow()` converts each selected record's `parsedDependents[]` into its own row, linked to its employee via a shared `employeeId` (EIN) — the same convention the template/enrollment-upload pipeline already uses to associate a dependent row with its employee. `ZohoEndorsementPage` gained a `dependents` state (parallel to `employees`, read from the same navigation-state object) and an optional `ZohoEmployee.relation` field; both employee and dependent rows are concatenated before being mapped onto the template's columns, and `dependentCount` in the submission form now defaults to the real count instead of a hardcoded `0`.

**Deliberately not resolved — `HCL_DEPREL` mapping.** HCL's numeric relationship code (e.g. `1`, `4`, `7`, `9` in the document's own samples) has no legend anywhere in the interface document. Rather than guess a Spouse/Child/Parent mapping — which risks silently mis-classifying a dependent for a health policy, affecting real eligibility/sum-insured rules — each dependent row's `relation` is filled with a clearly-flagged placeholder (`"NEEDS REVIEW (HCL code <n>)"`), visible in the existing inline-edit preview grid, so an admin must correct it manually before submitting. **TBD:** get the actual code legend from HCL and replace this placeholder with a real mapping. Also still TBD: whether `GRADE`-as-designation and the blank `department` are acceptable, or whether the real per-policy templates need a different/additional field — not verified against a real template in this pass.

## 10. Existing enrollment/endorsement pipeline integration

Reused exactly as-is, with no modification:
- `POST /:policyId/enrollment-upload` (`policy.controller.ts:4398`) → `PolicyRepository.createEnrollmentUpload` (`policy.repository.ts:9436`) creates the `Endorsement` row and the `document_processing_file` row (`process_status = CREATED`).
- `EnrollmentUploadScheduler` (`apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts`) picks it up on its existing cron cycle, transitions `process_status` `CREATED → PROCESSING`, calls `processEmployeeUpload` (`company-employee-upload.util.ts:2891`) to parse and write into `policy_enrollment_employee`/`policy_enrollment_dependent`, and finishes at `COMPLETED` or `FAILED` (`DOCUMENT_PROCESS_STATUS` constant, `constants.ts:1155`).

**New, and the one piece with no existing precedent:** nothing in this pipeline today notifies an external caller when a `document_processing_file` finishes — the scheduler simply updates its own row. The **Intake Reconciliation Poller** is a small new scheduled job (same architectural style as the rest of this codebase's scheduler-service jobs) that periodically reads `document_processing_file` rows referenced by `hcl_employee_intake.document_processing_file_id` with `process_status IN (COMPLETED, FAILED)` that haven't yet been reconciled, and:
- On `COMPLETED`: sets the linked intake rows to `PROCESSED`, stores `endorsement_id` (from the `document_processing_file.endorsement_id` column, which already exists), and upserts the corresponding `hcl_employee_external_ref` rows once the created `policy_enrollment_employee`/`policy_enrollment_dependent` records can be resolved (e.g. by `company_employee_id`/name+DOB matching against what was submitted — exact resolution strategy is an implementation detail to confirm during build, not specified here).
- On `FAILED`: sets the linked intake rows to `FAILED` with a failure reason (§11 on why this is necessarily batch-level, not per-employee, with today's pipeline).

## 11. Success, failure, retry, and partial-processing scenarios

- **Full success:** all selected intake records' underlying data is written by `processEmployeeUpload`, `document_processing_file` reaches `COMPLETED` → all linked intake records become `PROCESSED` with the same `endorsement_id`.
- **Full batch failure:** `processEmployeeUpload` throws before completing (confirmed in code: the whole job's `process_status` is set to `FAILED` in a single top-level catch, e.g. `enrollment-upload.scheduler.ts` around its `catch (err) { ... FAILED }` blocks) → all linked intake records become `FAILED` with the caught error's message as the failure reason. Admin can retry the same selection (or a corrected subset) as a new "Generate Endorsement" action.
- **Partial success — important constraint, not an oversight:** the existing `EnrollmentUploadScheduler`/`processEmployeeUpload` pipeline reports success or failure **at the level of the whole upload/batch** (`document_processing_file.process_status`), not per individual employee/dependent row within it. This means that if a batch of, say, 5 selected intake records is submitted together and one row's data is rejected deep inside `processEmployeeUpload`, today's pipeline does not expose which row caused it as a structured, machine-readable result back to a caller — only pass/fail for the whole file, plus whatever human-readable remarks it writes into its own internal error-reporting output. **This is a genuine architectural limitation of the pipeline being reused, not a gap in this design.** Two options, **neither chosen here — TBD:**
  1. Submit one endorsement per intake record (or small groups) to get failure isolation, at the cost of many small endorsements instead of one batched one.
  2. Accept batch-level granularity: a failure marks every record in that submission `FAILED`, and the admin re-selects a smaller/corrected subset to retry.
- **Retry:** any `FAILED` intake record can be re-selected for another "Create Endorsement" action — this creates a *new* `document_processing_file`/potentially new `Endorsement`, not a resurrection of the failed one, consistent with how the existing pipeline works for any other failed upload today.

## 12. Security, authentication, and audit logging

- **Gateway routing:** `apps/services/service-lib/src/lib/auth.guard.ts` (`AuthGuard`) has a bypass entry for `path.includes("/integrations/hcl/process-enroll-data")` — without it, the gateway demands a JWT before the request ever reaches `external-integration-service`. Because this route no longer lives under `hr-module` (it did when this was inside `ibp-service`), it also needed a **new, explicit** `AclGuard` bypass — `apps/services/service-lib/src/lib/acl.guard.ts` now matches `path.includes("/integrations/hcl")` (the whole prefix, not just the inbound route) to preserve the same no-ACL-check behavior the RiskWatch-facing routes had for free under the old generic `hr-module` bypass. That's a carried-forward gap (Zoho's `hr-module/zoho/*` admin routes have the same lack of real ACL mapping today), not a new hole introduced by this move.
- **Credential check:** `UserName`/`Password` validated against configured credentials inside `HclIntegrationService` — no prior example in this codebase validates inbound body credentials as sole authentication (confirmed by search), so this is a net-new pattern, built as an explicit check in the service layer rather than a new generic guard, following the existing *bypass-JWT-then-self-validate* shape used by `/external-app-sso/magic-url`. **Currently disabled** (the check is commented out in `HclIntegrationService.processEnrollData`) — re-enabling it is a deliberate follow-up, not an oversight this doc is hiding.
- **Credential storage:** environment-configured, distinct from any other secret, so rotating/replacing them is a config change, not a code change. **TBD:** production credential provisioning/rotation process with HCL is not addressed here.
- **Audit logging:** every accepted request's full `raw_payload` is retained on its intake row(s) indefinitely, giving a complete record of what HCL sent. Status transitions (`RECEIVED → PROCESSING → PROCESSED/FAILED`) are timestamped (`updated_at`, `processed_at`) on the same row. **TBD:** whether a separate change-log table (mirroring the `@Auditable()` pattern used elsewhere in this codebase, e.g. on `CompanyApprovalConfig`) is wanted for a full history of status transitions per row, versus relying on the current-state-plus-timestamps design above — not specified by any requirement here, and not built by default.

## 13. Data flow and traceability

Every stage of the journey from an HCL request to a final endorsement is traceable through a single chain of foreign keys and stored identifiers, with no stage that loses the link back to the original request:

```
HCL request
   → hcl_employee_intake row (raw_payload retained; ein/hcl_depid/check_sum indexed)
       → [admin selects, generation triggered]
       → document_processing_file_id stored on the intake row
           → document_processing_file row (documentId → the generated xlsx's file_upload row)
               → Endorsement row (endorsement_id)
                   → endorsement_id stored back on the intake row (on PROCESSED)
                       → policy_enrollment_employee / policy_enrollment_dependent rows
                           (created by the existing, unmodified pipeline)
                               → hcl_employee_external_ref row [NOT YET BUILT — §5.2]
                                 (employee_id/dependent_id
                                 linked to the original ein/hcl_depid, populated once resolved)
```

Given any HCL request (identified by `ein`/`hcl_depid`/`check_sum`), an admin can trace forward to the endorsement it produced and the internal employee/dependent record it created. Given any internal employee/dependent record that originated from HCL, the reverse lookup (`hcl_employee_external_ref` → `hcl_employee_intake`) recovers the original raw payload.

## 14. Explicitly deferred / TBD summary

| Item | Status | Where it plugs in |
|---|---|---|
| Checksum verification | Deferred — algorithm undocumented by HCL | §7 |
| True idempotency guarantee | TBD — best-effort only, pending HCL confirmation | §7 |
| `ET` transfer semantics beyond attribute update | TBD — not specified by the source document | §7 (PRD) |
| `HCL_DEPREL` → relation name mapping | TBD — no legend in HCL's document; dependent rows ship with a flagged placeholder requiring manual admin correction, not a guessed mapping | §9 |
| Template column mapping confirmation (`GRADE`→designation, blank `department`) | TBD — not verified against real templates in this pass | §9 |
| Partial-processing granularity (Option 1 vs 2) | TBD — real pipeline constraint, needs a decision | §11 |
| Approval/review gate beyond admin selection | TBD — assumed none beyond the selection action itself | PRD §11 |
| Credential check re-enablement | Currently disabled in code (commented out) | §12 |
| Real HCL production credentials/path | Deferred | §12 |
| Audit change-log table (vs. current-state + timestamps) | TBD | §12 |
| Generic inbound-TPA framework support | Not pursued — `tpa-external-integration-spec.md` §16 explicitly excludes webhook-style pushes | Revisit only if a second push-style client appears |

---

## 15. CRM/HR notification on endorsement upload completion

**Gap found**: tracing the full path from `createEnrollmentUpload` through `EnrollmentUploadScheduler`/`processEmployeeUpload` confirmed that `Endorsement.endorsementStatus`/`currentEndorsementStep` are only ever written at creation (frozen at `ENDORSEMENT_REQUEST_RECEIVED`) and by the separate, human-triggered `EndorsementCreationScheduler` — the employee-data upload path never advances them, and nothing on this path ever creates a `Task` or fires a notification. A Zoho/HCL-originated endorsement could sit unreviewed indefinitely with no one told to go look, even though iWork's own "Create Endorsement" step already gates progress behind a human opening it (see PRD/iWork-alignment notes).

**Fix**: `notifyEndorsementReadyForReview` (exported from `company-employee-upload.util.ts`, DataSource-based so any service can call it):

- **Trigger point — explicit product decision, changed once already**: originally fired once the `policy_employee_data` upload batch finished (`COMPLETED`/`FAILED`), but that meant waiting on `EnrollmentUploadScheduler`'s ~2-minute poll plus however long processing itself took. Changed to fire **immediately when the `Endorsement` row is created**, inside `PolicyRepository.createEnrollmentUpload` (policy-service), right after its transaction commits — not from inside the transaction (a notification-service round-trip has no business holding DB locks open), and only for a genuinely new endorsement (not when reusing an existing `endorsementId`). Consequence: `successCount`/`errorCount`/`status` are dropped entirely from the payload/template — they're not knowable yet at creation time, only at completion.
- **Recipients**: the company's CRM (`Company.leadCrm`, falling back to `accountManager`) and the RiskWatch admin who actually submitted the endorsement (`Endorsement.createdBy`) — resolved via one raw SQL lookup joining `company`/`users`. Also resolves each recipient's internal `userId` (not just their email) — notification-service's `NOTIFICATION_CHANNEL_IN_APP` handler does `dto.userId.forEach(...)` completely unguarded and crashes without it (confirmed against real `notification_log` rows: email succeeded, in-app failed with `Cannot read properties of undefined (reading 'forEach')`, from the same call, before this fix).
- **Channel**: both `NOTIFICATION_CHANNEL_EMAIL` and `NOTIFICATION_CHANNEL_IN_APP`, via the standard `POST {URL_NOTIFICATION_SERVICE}/notifications` call — event type `Endorsement_Upload_Ready_For_Review` (`NOTIFICATION_EVENT_TYPES.ENDORSEMENT_UPLOAD_READY_FOR_REVIEW`).
- **Payload/parameters**: `companyName`, `recipientName` (CRM's name — shared across both recipients since they get one rendered email in one call, so the submitting HR admin also sees the CRM's name, not their own), `endorsementId`, `policyId`, `iworkUrl` (deep link), `iirmLogoUrl`, `currentYear`.
- **Email template**: full branded HTML matching this codebase's other notification emails (top color strip, logo header, hero heading, bordered info-card section, footer) — see `database-migrations/sql/hcl-endorsement-review-notification-seed.sql`. In-app stays short plain text.
- **Failure mode**: best-effort only (mirrors `ApprovalNotificationService`/`MirReportService.sendMirNotification`) — swallows all errors so a notification-service outage or an endorsement with no resolvable `companyId` never blocks endorsement creation.
- **DB seed required**: `database-migrations/sql/hcl-endorsement-review-notification-seed.sql` (event type, parameters, event/parameter mapping, default email+in-app templates, plus `UPDATE` statements for environments that seeded an earlier version of the template text) — without it every call fails closed with "Event type not found" (logged, swallowed, so the only symptom is silence). Not run automatically — hand this to whoever manages that environment's DB.
- **Known caveat**: `company-employee-upload.util.ts` has a long-standing split-brain — most of its imports resolve constants/messages from a separate, older `libs/service-lib/src/lib/constants.ts` (not `apps/services/service-lib/src/lib/constants.ts`), which has diverged and doesn't define `NOTIFICATION_EVENT_TYPES` at all. `NOTIFICATION_EVENT_TYPES`/`NOTIFICATION_EMAIL`/`NOTIFICATION_IN_APP` are imported directly from the correct (`apps/`) file instead of duplicating them into the legacy one — pre-existing technical debt, not something this feature attempts to resolve.

## 16. Per-request API audit log (`hcl_api_request_log`)

Separate from `hcl_employee_intake` (one row per employee/dependent — a single HTTP call carrying multiple employees duplicates the same `raw_payload` across each of those rows on purpose, for per-record traceability, and that stays exactly as-is). `hcl_api_request_log` adds one row **per inbound HTTP call** to `process-enroll-data`, regardless of how many (if any) `hcl_employee_intake` rows it produced: `endpoint`, `http_method`, `request_ip`, `request_headers` (including `Authorization` if HCL ever sends one — this route is on `AuthGuard`'s bypass list, so this table is the only record of what, if anything, arrived there), `request_payload`, `response_status`, `response_payload`, `created_at`. Written from `HclIntegrationService.processEnrollData` after computing the response (success or the top-level catch's failure shape) — best-effort, logs and swallows its own errors (`HclIntegrationRepository.logApiRequest`), never affects the actual response sent back to HCL. Migration: `database-migrations/sql/hcl-api-request-log-table.sql`.

---
See [HCL-Employee-Interface-Sync-PRD.md](./HCL-Employee-Interface-Sync-PRD.md) for business requirements, scope, and open questions.
