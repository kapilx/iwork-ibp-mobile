# Policy Endorsement Member Upload — TRD

**Doc type:** `policy_endorsement_member_upload`
**Cron:** every 2 minutes
**Status:** implemented

See [PRD.md](./PRD.md) for the product-level goals, non-goals, and open questions this design serves.

## Architecture / Data Flow

```
1. UI: Step 1 -> Data Type = "Member Data Upload" -> choose file
2. org-service    PUT /file-upload/upload                 creates file_uploads row
3. policy-service POST/PUT /policy/:policyId/enrollment-upload
                                                           creates document_processing_file row
                                                           documentType = "policy_endorsement_member_upload"
                                                           process_status = "CREATED"
4. scheduler-service cron (every 2 min) polls for CREATED rows
   handleMemberDataUploads()
     -> getPendingMemberDataUpload()                       atomic claim: CREATED -> PROCESSING
     -> processMemberDataUpload(upload)                     class method, thin wrapper
       -> processMemberDataUpload(upload, deps)             company-employee-upload.util.ts (core logic)
            -> validate policy + policy config
            -> parse Excel, validate rows
            -> write policy_enrollment_employee(_policy_map) / policy_enrollment_dependent
            -> write error file + PolicyEnrollmentUploadSummary
            -> document_processing_file.process_status = COMPLETED | FAILED
```

No new HTTP endpoints were introduced. Steps 2–3 reuse the identical transport already used by every other Data Type option — `document_processing_file` is document-type-driven, so tagging the row with a new `documentType` was sufficient to route it to a dedicated cron without touching the upload endpoints themselves.

## Frontend Changes

| File | Change |
|---|---|
| `apps/ui/iwork/src/app/constants/index.ts` | `DOCUMENT_TYPE_POLICY_ENDORSEMENT_MEMBER_UPLOAD = "policy_endorsement_member_upload"`; `MEMBER_UPLOAD_TEMP_NUM = 789014` (dropdown placeholder value, next unused slot after existing `TEMP_NUM`/`ENROLLMENT_TEMP_NUM`/`BYPASS_ENROLLMENT_TEMP_NUM`/`POLICY_EXTENSION_NUM`). |
| `EndorsementPage/utils/endorsementDocTypeMap.ts` | Added `"policy_endorsement_member_upload"` to the `DocTypeKey` union and a map entry — label "Member Data Upload", `download`/`process` intentionally reuse the same endpoints as `policy_employee_enrollment_data` (`downloadEmployeeEnrollmentTemplate` / `processEmployeeData`). |
| `EndorsementDataUpload/config.ts` | `getEndorsementDataUploadConfig(isEnrolmentPremiumBased, showMemberDataUpload)` — new second param adds the "Member Data Upload" option to `documentTypeOptions` only when true. |
| `EndorsementDataUpload/EndorsementDataUploadPage.tsx` | New prop `showMemberDataUpload`, threaded into the config call; `docTypeMap` gains `[MEMBER_UPLOAD_TEMP_NUM]: "policy_endorsement_member_upload"` so both template download and upload-success handling resolve it. |
| `EndorsementDetails/RenderEndorsementRequestStep/index.tsx` | `disableAllFields` gains a third condition, `!overAllData?.receiveInsurerAcknowledgement?.isCompleted`; new `showMemberDataUpload` derived flag passed down to `EndorsementDataUploadPage`. |

```ts
// RenderEndorsementRequestStep/index.tsx
let disableAllFields = false;
if (
  overAllData?.createEndorsement?.isCompleted &&
  overAllData?.createEndorsement?.stepOrder >= 2 &&
  !overAllData?.receiveInsurerAcknowledgement?.isCompleted   // <- added
) {
  disableAllFields = true;
}

const showMemberDataUpload = !!overAllData?.receiveInsurerAcknowledgement?.isCompleted;
```

## Backend Changes

| File | Change |
|---|---|
| `libs/service-lib/src/lib/constants.ts` | `DOCUMENT_TYPE_POLICY_ENDORSEMENT_MEMBER_UPLOAD`; `SCHEDULER_HANDLERS.HANDLE_MEMBER_DATA_UPLOADS: "handleMemberDataUploads"`. |
| `scheduler-service/.../enrollment-upload.scheduler.ts` | New `@Cron("*/2 * * * *") handleMemberDataUploads()`; new `getPendingMemberDataUpload()` poller; new `processMemberDataUpload(upload)` class method delegating to the core function below; `"HANDLE_MEMBER_DATA_UPLOADS"` added to `ENROLLMENT_UPLOAD_KEYS` for `DynamicCronService` registration. |
| `service-lib/src/lib/utils/company-employee-upload.util.ts` | New exported `processMemberDataUpload(upload, deps)` — a from-scratch implementation, **not** a call into the existing `processEmployeeUpload` pipeline (see rationale below). |

## Data Model

Only these three tables are written. No enrollment/choice/premium tables and no endorsement tables are touched.

| Table | Written for | Key behavior |
|---|---|---|
| `policy_enrollment_employee` | rows where Relation = "Self" | Upsert matched on `(company_id, company_employee_id)` — restores a soft-deleted row rather than duplicating. |
| `policy_enrollment_employee_policy_map` | rows where Relation = "Self" | Upsert matched on `(employee_id, policy_id)`; `enrollment_addition_batch_id` set to the upload's document id. |
| `policy_enrollment_dependent` | rows where Relation != "Self" | Parent employee resolved from an earlier Self row in the same file, or an existing DB record for that Employee ID; deduped on `(employee_id, policy_id, relation, name)`. |

**Never written:** `policy_employee_enrollment`, `policy_employee_enrollment_choice`, `endorsement` (no netPremium/grossPremium update), `users`/`roles`/`user_roles`.

## Validation Rules

| Field | Rule | Failure scope |
|---|---|---|
| Policy duration (whole file) | `policy.policyTo >= today` | Whole upload rejected |
| Policy configuration (whole file) | Must load successfully and have ≥ 1 enabled relationship | Whole upload rejected (fail-closed) |
| Employee ID / Full Name / Relation | Must be present | Row rejected |
| Relation | Must match an enabled `configuredOption` under an enabled relation type in `policyConfig.relationships.enabledPolicyRelations` — e.g. "Parent" rejected if not enabled | Row rejected |
| Date of Birth | Must parse to a valid date | Row rejected |
| Gender | Must be one of `GENDER_VALUES` (male / female / other) | Row rejected |
| Intake Type | Must be `inception` or `addition`; `deletion` explicitly rejected | Row rejected |
| Effective Date | Optional column (defaults to policy start); if present, must fall within `policyFrom`–`policyTo` | Row rejected |
| Age (derived from DOB) | 0–100; for Self rows, additionally checked against the policy config's Self min/max age | Row rejected |

Header detection reuses existing alias lists (`ENROLLMENT_FIELD_HEADERS`, `POSSIBLE_EMPLOYEE_ID_HEADERS_FOR_TPA_FILE`, `POSSIBLE_EMPLOYEE_NAME_HEADERS_FOR_TPA_FILE`, `POSSIBLE_EMPLOYEE_GENDER_HEADERS_FOR_TPA_FILE`) plus two new local alias lists for Intake Type and Effective Date. Missing a required header fails the whole file before any row is read.

## Cron & Concurrency

- **Schedule:** `@Cron("*/2 * * * *")` — every 2 minutes, matching every other upload poller in this scheduler.
- **Claiming:** `getPendingMemberDataUpload()` finds the oldest `CREATED` row for this document type, then atomically flips it to `PROCESSING` via `UPDATE ... WHERE id = :id AND process_status != 'PROCESSING'` — if the affected-row count isn't exactly 1, another poller already claimed it and this cycle no-ops. Same pattern as `getPendingUploads`/`getPendingTpaIdUpload`.
- **One file at a time:** each cron tick claims and processes exactly one document; a backlog drains one file per 2-minute tick per running scheduler instance.
- **Row processing:** all rows in one file are processed inside a single DB transaction.

## Error Handling & Idempotency

- **File/policy/config-level failure** (missing file, missing policy, expired policy, unloadable config, no enabled relations, missing required header): the whole upload throws, `document_processing_file.process_status` → `FAILED`, nothing is written.
- **Row-level failure:** the row is appended to an in-memory error list with a specific reason; processing continues to the next row.
- **On completion:** if any row errors, an Excel error file is generated and uploaded to S3, tracked via a new `FileUpload` row and a `PolicyEnrollmentUploadSummary` row (`successCount`/`errorCount`/`processCount`); `process_status` → `COMPLETED` regardless of partial row failures.
- **Re-processing safety:** employee and map upserts are keyed on stable unique constraints (`company_id`+`company_employee_id`; `employee_id`+`policy_id`), and dependents are deduped on `(employee_id, policy_id, relation, name)` — re-running the same file after a partial failure updates existing rows rather than duplicating them.

## Known Limitations

- **Not built** — No user/login (IBP) account creation for newly added employees.
- **Not built** — No dedicated "member data only" upload template — the UI currently reuses the full enrollment template, including premium/choice columns this flow ignores.
- **By design** — No support for member deletions via this flow — "deletion" intake rows are hard-rejected.
- **Confirmed** — Verified via code reading that `processEmployeeUpload`'s premium-recalculation call is unreachable for pure-addition uploads today — the new dedicated function removes the dependency on that guard entirely rather than relying on it.
