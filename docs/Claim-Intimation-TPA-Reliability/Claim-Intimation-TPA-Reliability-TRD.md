# Technical Requirements Document — Claim Intimation → TPA Delivery Reliability

**Module:** CLAIMS / TPA-INTEGRATION
**PRD Reference:** `Claim-Intimation-TPA-Reliability-PRD.md`
**Services touched:** `ibp-service`, `scheduler-service`, `document-service`, `service-lib`
**Date:** 2026-08-12

---

## 1. Architecture Summary

| Before | After |
|---|---|
| `intimateClaim` calls the TPA synchronously, saves to DB only on success | `intimateClaim` saves to DB unconditionally, queues a delivery job, returns immediately |
| No record survives a TPA failure | A `claim_tpa_submission_job` row always exists once the employee submits |
| No retry | Scheduler retries up to `max_attempts` (default 3), every 2 minutes |
| No visibility into what was actually sent to the TPA | Every attempt (success or failure) persists the exact resolved request |

Precedent followed: this reuses the same job-queue shape (`PENDING → PROCESSING → COMPLETED/FAILED`, bounded retries, stuck-job recovery) already established by `GenericTpaSyncScheduler` in this codebase, and the same "scheduler calls the owning service's internal HTTP endpoint directly, bypassing api-gateway" convention.

---

## 2. New / Changed Data Model

### 2.1 New table: `claim_tpa_submission_job`

File: `apps/services/service-lib/src/lib/entities/claim-tpa-submission-job.entity.ts`
Migration: `database-migrations/sql/claim-tpa-submission-job-table.sql`

| Column | Type | Purpose |
|---|---|---|
| `id` | serial PK | |
| `policy_claim_id` | int, FK → `policy_claim(id)` | Which claim this delivery job belongs to |
| `job_type` | varchar(20) | `INTIMATION` \| `SUBMIT_CLAIM` (only `INTIMATION` is wired up today) |
| `status` | varchar(20) | `PENDING` → `PROCESSING` → `COMPLETED` / `FAILED` |
| `attempt_count` | int, default 0 | Incremented each delivery attempt |
| `max_attempts` | int, default 3 | Matches `GenericTpaSyncScheduler`'s existing `DEFAULT_RETRY_COUNT` convention |
| `source_payload` | jsonb, NOT NULL | The raw incoming DTO exactly as the employee submitted it — support/debug traceability only, never read by the processor |
| `request_payload` | jsonb, NOT NULL | The intermediate payload sent to document-service (`{flow, appKey, dynamicFields, ...}`) — replayed as-is on every attempt |
| `resolved_tpa_request` | jsonb, nullable | **The exact, fully-resolved request actually sent to the TPA** (method/url/headers/body, TPA secrets included) — captured on every attempt, success or failure (see §5) |
| `last_error` | text, nullable | Human-readable failure reason from the most recent failed attempt |
| `last_attempted_at` | timestamptz, nullable | Used for stuck-job crash recovery (§4.3) |
| `completed_at` | timestamptz, nullable | |
| `created_by` / `updated_by` | int, default 0 | |
| `created_at` / `updated_at` | timestamptz | |

Indexes: `status`, `policy_claim_id`.

### 2.2 Existing tables — no schema changes, reused as-is

- `policy_claim` — reuses existing `claim_status` values; claim is saved with status `CLAIM INTIMATION` (a pre-existing, previously-unused status row, id 11) at intimation, then advanced to `INTIMATED`/`PENDING` once delivery succeeds.
- `policy_claim_status` — no new rows needed; `CLAIM INTIMATION` already existed but was unused anywhere before this feature.
- `policy_claim_audit` — one row written at intimation (status = `CLAIM INTIMATION`), one more written when delivery succeeds (status = final, `userId: 0` = system-driven transition).

### 2.3 Bug fix: `policy_claim.policy_number`

**Found while auditing this flow, pre-existing (confirmed via `git diff` against the pre-refactor baseline — not introduced by this change).**

`company-employee.service.ts` (`intimateClaim`, claim payload construction) was setting:
```ts
policyNumber: String(policy.id),   // ❌ the internal DB primary key
```
instead of:
```ts
policyNumber: policy.insurerPolicyNumber ?? String(policy.id),   // ✅ fixed
```
This field feeds `linkTpaClaimData`'s correlation key into `tpa_claim_data` (keyed by `policy_number` + `tpa_claim_no`). Every claim processed before this fix would have written the wrong key there. The sibling field used for the actual TPA payload (`dynamicFields.policyNumber`, built in `buildGenericIntimationFields`) was already correct — only the DB-side copy used for this codebase's own downstream correlation was wrong.

---

## 3. End-to-End Table & Field Lineage

### 3.1 Tables touched, start to finish (ibp-service side)

| # | Table | Used for |
|---|---|---|
| 1 | `policy` | Root policy lookup; `insurerPolicyNumber`, `policyFrom`/`policyTo`, `company`, `tpaMappings` |
| 2 | `lookup_data` | Resolves `policy.policyType` / `policy.policyStatus` |
| 3 | `policy_tpa_map` | Gives `policyTpaId` — the key used to resolve which TPA config applies |
| 4 | `company` | `companyName` for the saved claim row |
| 5 | `policy_enrollment_employee_policy_map` | Confirms enrollment; source of `employeeTpaId` |
| 6 | `policy_enrollment_employee` | Employee record — email, phone, employee code, name |
| 7 | `policy_enrollment_dependent` | Dependent record, only if the claim is for a dependent |
| 8 | `policy_claim_status` | Looks up `PENDING` / `CLAIM INTIMATION` / `INTIMATED` status rows |
| 9 | `tpa_external_feature_config` | Resolves the appKey + `claim_form_type` + `legacy_handler` for `api_type='INTIMATE_CLAIM'`, filtered by `policyTpaId` |
| 10 | `mstr_ext_application_ref` | The full TPA API config: URL, method, auth type, payload template |
| 11 | `mstr_hospital` | Hospital master record |
| 12 | `mstr_hospital_address` | Hospital address (eager-loaded) |
| 13 | `policy_claim` | The claim row itself |
| 14 | `policy_claim_audit` | Status-transition audit trail |
| 15 | `claim_tpa_submission_job` | The async delivery queue row (new, this feature) |

### 3.2 Tables touched, document-service side (during delivery)

| # | Table | Used for |
|---|---|---|
| 16 | `mstr_ext_application_ref` | Loaded again by `label` (the appKey) to get URL/method/auth/template |
| 17 | `tpa_payload_field_mapping` | Admin-configurable DB→placeholder field mapping, joined via `feature_config_id → tpa_external_feature_config.id`. **Currently has zero rows for any claim-intimation appKey** — dormant for claims today; all fields come from `dynamicFields` instead. Architecturally ready for an admin to add DB-backed overrides without a code change. |
| 18 | `mstr_ext_app_response_mapping` | Maps the TPA's raw response field to our standard key (e.g. ISBS's `ccn` → `TPA_CLAIM_REF`) |
| 19 | `tpa_claim_data` | Upserted after successful delivery with the raw TPA response, keyed by `(policy_number, tpa_claim_no)` |
| 20 | `tpa` | Referenced via `tpa_external_feature_config.tpa_id` FK |

> **Note on `tpa_payload_field_mapping.feature_config_id`:** this FKs to `tpa_external_feature_config.id`, not to `mstr_ext_application_ref.id` — easy to confuse since both tables can independently have a row with the same numeric id (e.g. `feature_config_id=10` is unrelated to `mstr_ext_application_ref.id=10`; for ISBS claim intimation the relevant `feature_config_id` is `1`).

### 3.3 `dynamicFields` — field-by-field source (`buildGenericIntimationFields`, `company-employee.service.ts`)

| Field | Source |
|---|---|
| `policyNumber` | `policy.insurer_policy_number` |
| `memberCardId` | `policy_enrollment_employee_policy_map.employee_tpa_id` |
| `employeeCode` | `policy_enrollment_employee.employee_company_id` |
| `patientName` | `policy_enrollment_dependent.name` (if dependent) else employee name |
| `patientMobile` | `policy_enrollment_employee.phone_number_enc` (decrypted, normalized to bare 10-digit) |
| `patientEmail` | `policy_enrollment_employee.email` |
| `hospitalCode` / `hospitalName` | `mstr_hospital.external_hospital_id` / `.name` |
| `hospitalCity` / `hospitalState` / `hospitalPincode` / `hospitalPhone` / `hospitalAddress` | `mstr_hospital_address` columns |
| `claimType`, `benefitType`, `estimatedClaimAmount`, `dateOfAdmission`, `dateOfDischarge`, `diagnosis`, `hospitalId` | **Not DB-sourced** — straight from the employee's `IntimateClaimDto` request body |

### 3.4 Final TPA-shaped payload — built entirely inside document-service

document-service loads `mstr_ext_application_ref.magic_url_api_payload` (an admin-configured JSON template with `{{placeholder}}` tokens) and resolves it using `dynamicFields` (+ any `tpa_payload_field_mapping` overrides, currently none for claims). Example, ISBS claim intimation (`mstr_ext_application_ref.id=10`):

```json
{
  "clmCity": "{{hospitalCity}}",
  "ptEmail": "{{patientEmail}}",
  "clmState": "{{hospitalState}}",
  "moduleId": "1",
  "policyNo": "{{policyNumber}}",
  "clmHospTo": "{{dateOfDischarge}}",
  "clmPincode": "{{hospitalPincode}}",
  "clmSubtype": "{{claimType|map:CASHLESS:IP-1,REIMBURSEMENT:IP-2}}",
  "ptGhCardId": "{{memberCardId}}",
  "ptMobileNo": "{{patientMobile}}",
  "clmHospFrom": "{{dateOfAdmission}}",
  "clmHospName": "{{hospitalName}}",
  "brokerAPIKey": "<static secret, from config>",
  "ghHospitalId": "{{hospitalCode|number}}",
  "brokerPassword": "<static secret, from config>",
  "brokerUsername": "<static secret, from config>",
  "clmHospAddress": "{{hospitalAddress}}",
  "clmPatientName": "{{patientName}}",
  "clmRequestedAmt": "{{estimatedClaimAmount|number}}",
  "clmReasonAdmission": "{{diagnosis}}",
  "clmTypeOfAdmission": "Emergency",
  "clmNatureOfLossCode": "Illness",
  "clmCommunicationRemarks": "{{diagnosis}}"
}
```

Template filter support (`payload-template.util.ts`): `|number` (string → JSON number), `|date:FMT`, `|map:FROM:TO,...` (value substitution). All placeholders above resolve 1:1 against `dynamicFields` keys — nothing is missing.

Auth handling per TPA (`mstr_ext_application_ref.auth_type`):

| `auth_type` | Behavior | Used by |
|---|---|---|
| `DIRECT` | No separate auth step — credentials embedded directly in the payload template | ISBS/GHPL claims |
| `SESSION` | 2-step: auth API → session token → data API with that token | FHPL claims |
| `BASIC_AUTH` | Basic-auth on data call directly, or 2-step if a separate token endpoint is configured | Health India claims |

---

## 4. New Components

### 4.1 `ClaimTpaSubmissionJob` entity

`apps/services/service-lib/src/lib/entities/claim-tpa-submission-job.entity.ts` — see §2.1. Exports `CLAIM_TPA_JOB_TYPE` and `CLAIM_TPA_JOB_STATUS` as const enums.

### 4.2 `CompanyEmployeeService.processClaimTpaJob(jobId)`

`apps/services/ibp-service/src/app/company-employee/company-employee.service.ts`. Called by the scheduler via an internal-only HTTP route. Responsibilities:

1. Idempotency guard — no-ops if the job isn't `PENDING` (protects against a racing duplicate trigger).
2. Increments `attempt_count`, flips status to `PROCESSING`.
3. Replays `request_payload` exactly as stored — mints a short-lived **system JWT** (see §5) and calls either `callIsbsBrokerClaimApi` (ISBS legacy flow) or `callGenericExternalApp` (generic MULTI/SINGLE flow) — the same TPA-calling methods the old synchronous code used, unchanged.
4. On success: advances `policy_claim.claim_status` (`INTIMATED` for MULTI-flow TPAs, `PENDING` for SINGLE-flow), stores `tpa_claim_no`, writes a `policy_claim_audit` row, best-effort links the raw TPA response into `tpa_claim_data`.
5. On failure: if attempts remain, resets to `PENDING` for the next cron tick; if exhausted, marks `FAILED` with `last_error` set.
6. Either way, persists `resolved_tpa_request` (§5) onto the job row.

`SUBMIT_CLAIM` job type is modeled but rejected with `BadRequestException` if encountered — not yet implemented (see PRD §6, out of scope).

### 4.3 `ClaimTpaSubmissionScheduler`

`apps/services/scheduler-service/src/app/scheduler/claim-tpa-submission.scheduler.ts`. `@Cron("*/2 * * * *")`:

1. **Crash recovery** (`recoverStuckJobs`) — any job stuck in `PROCESSING` for more than 10 minutes (ibp-service crashed/restarted mid-attempt) is reset to `PENDING` (or `FAILED` if attempts are exhausted). Mirrors `GenericTpaSyncScheduler`'s existing stuck-job pattern.
2. **24h resurrection** (`resurrectFailedJobs`) — see §4.3.1 (revision to the original "FAILED is terminal" design).
3. Queries up to 20 `PENDING` jobs, oldest first.
4. For each, POSTs to `ibp-service`'s internal route directly (bypassing api-gateway, matching this codebase's existing internal service-to-service convention).
5. A network failure reaching ibp-service itself (not a TPA failure) leaves the job untouched — still `PENDING`, retried next tick.

#### 4.3.1 `resurrectFailedJobs` — FAILED is no longer permanently terminal

**Revision to the original design:** the entity's own header comment originally documented `FAILED` as deliberately terminal — "a claim stuck here needs a human to fix it with the TPA later... not an endless retry loop." Per explicit follow-up product decision, this is now revised: a `FAILED` job (attempts exhausted) is given a fresh attempt budget automatically, 24 hours after it failed, rather than requiring manual intervention to requeue it.

**Why this is safe, not just convenient:** document-service re-fetches ALL of a TPA's static config fresh from the DB on **every** delivery attempt — `ExternalAppRepository.findByLabel` (loading `mstr_ext_application_ref`: credentials, URL, payload template) is a plain `findOne`, never cached across calls, and the same is true for `tpa_payload_field_mapping`. So if an admin corrects a wrong static value — a stale `brokerAPIKey`, a fixed hospital/TPA config row — after a job has already failed, the very next attempt automatically picks up that fix with zero additional code or manual requeue needed. `resurrectFailedJobs` exists purely to make sure that next attempt actually happens instead of the job sitting `FAILED` forever.

**Mechanism:**
```ts
private async resurrectFailedJobs(jobRepo: Repository<ClaimTpaSubmissionJob>): Promise<void> {
  const cooldownThreshold = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const failed = await jobRepo.find({ where: { status: FAILED, updatedAt: LessThan(cooldownThreshold) } });
  for (const job of failed) {
    await jobRepo.update(job.id, {
      status: PENDING,
      attemptCount: 0,   // full fresh 3-attempt budget, not "one last gasp"
      lastError: `[Auto-resurrected after 24h cooldown] Previous failure: ${job.lastError ?? "(no error recorded)"}`,
    });
  }
}
```
`updated_at` is the correct timestamp to cool down against — it's bumped exactly once, at the moment a job transitions to `FAILED` (the idempotency guard in `processClaimTpaJob` means a `FAILED` job is never touched again by normal processing, so `updated_at` stays frozen at the failure time until this method touches it).

**What this does NOT fix:** dynamic, per-claim fields frozen into `request_payload` at intimation/submission time (`patientMobile`, `hospitalCode`, the specific member card ID, etc.) are replayed exactly as originally captured — resurrection re-fetches static TPA-side config, not per-claim data. A claim that failed because of a genuinely wrong dynamic field (e.g. a typo'd mobile number) will fail identically on resurrection; only a fresh intimation/submission re-derives those.

**Trade-off, explicitly accepted:** 24 hours is a cooldown, not a cap. `attemptCount` resets to 0 every time, so a claim that keeps genuinely failing (bad data, not fixable by an admin) will keep resurrecting once a day indefinitely rather than settling into a permanent `FAILED` state. If this proves noisy in practice, consider capping total resurrection count (e.g. a `resurrectionCount` column, stop after N).

### 4.4 Internal route: `POST /company-employee/internal/claim-tpa-jobs/:jobId/process`

`company-employee.controller.ts` — not registered in the frontend's `endPoints` constants; internal-only, called exclusively by the scheduler.

---

## 5. Resolved-Request Capture (debug/support traceability)

**Problem this solves:** `claim_tpa_submission_job.request_payload` only stores the *intermediate* shape sent to document-service (`{flow, appKey, dynamicFields}`), not the final TPA-shaped body — that's only ever computed transiently inside document-service. If a delivery fails, there was no way to see (or replay) the exact request that was actually attempted without manually re-running the templating logic.

**Design:** a mutable out-parameter, `debugCapture: { resolvedRequest?: {method, url, headers, body} }`, threaded through the call chain by reference:

```
ExternalAppController (document-service)
   creates debugCapture = {}
        ↓
ExternalAppService.executeExternalAppSSO(..., debugCapture)
        ↓ (whichever auth branch runs — DIRECT/SESSION/BASIC_AUTH/etc.)
callDataApi / callDataApiWithHeaders(..., debugCapture)
   → populates debugCapture.resolvedRequest RIGHT BEFORE the axios call fires
     (so it's captured even if the call throws)
        ↓
Controller includes resolvedRequest in BOTH the success response
   and the error response body
        ↓
ibp-service (callGenericExternalApp / callIsbsBrokerClaimApi)
   reads response.data.resolvedRequest (success) or
   err.response.data.resolvedRequest (failure) into its own debugCapture
        ↓
processClaimTpaJob persists debugCapture.resolvedRequest into
   claim_tpa_submission_job.resolved_tpa_request — on BOTH the
   COMPLETED and FAILED/PENDING status updates
```

**Deliberate trade-off — secrets are stored in plaintext.** `resolved_tpa_request` includes the TPA's static credentials (e.g. ISBS's `brokerAPIKey`/`brokerUsername`/`brokerPassword`) exactly as they'd be sent, so the stored JSON is directly usable — copy it into Postman/curl and it works standalone, no need to look up credentials separately. This is a deliberate departure from this codebase's usual "never log resolved payload values, only keys" convention (see `callDataApi`'s `buildRedactedCurlLog` used for its own log lines, which stays redacted). Accepted because:
- The alternative (redacting secrets) makes the stored payload non-functional for its stated purpose.
- `claim_tpa_submission_job` is an internal, DB-access-only table — the same trust boundary as `mstr_ext_application_ref.basic_auth_password`, which already stores TPA credentials in plaintext in this same database.

Files touched for this: `external-app.service.ts`, `external-app.controller.ts` (document-service); `company-employee.service.ts` (`callGenericExternalApp`, `callIsbsBrokerClaimApi`, `processClaimTpaJob`) (ibp-service); `claim-tpa-submission-job.entity.ts` + migration SQL (service-lib).

---

## 6. Authentication for Background Delivery

**Problem found during testing:** document-service's `POST /external-app-sso/magic-url` endpoint mandates a valid `Authorization: Bearer <jwt>` header (401s with `"Authorization token not provided"` otherwise) — it does not treat auth as optional. The original design assumed a missing header would be tolerated by the receiving endpoint; it is not.

**Fix:** `CompanyEmployeeService.buildSystemAuthHeader()` mints a short-lived (5 min) system-identified JWT via the already-injected `JwtService`, signed with the same `JWT_SECRET` document-service verifies against:
```ts
this.jwtService.signAsync({ userDetails: { emailId: "system-claim-tpa-job@iirm.com" } }, { expiresIn: "5m" })
```
This mirrors the identical pattern already used by `GenericTpaSyncScheduler` for its own unattended calls to the same endpoint. document-service only checks the JWT is validly signed and shaped (`userDetails.emailId`) — it does not validate against a live session store, so this is safe to mint fresh per delivery attempt.

---

## 7. Logging

Every layer logs at every transition (entry, each branch decision, success, failure), per this codebase's structured-logging convention (`createLogger` + `buildLogMessage`, or `logInfo`/`logError` helper wrappers in `company-employee.service.ts`):

- **`intimateClaim`** — unchanged step-by-step logging (STEP 1 through STEP 9).
- **`processClaimTpaJob`** — request received, job-not-found, skip-if-not-pending, delivery start, TPA response received, delivery succeeded/failed (with attempt count and whether exhausted).
- **`ClaimTpaSubmissionScheduler`** — pending-job count found, stuck-job recovery count, per-job success/failure.
- **document-service** (`callDataApi`/`callDataApiWithHeaders`) — logs a redacted curl representation of the outbound request for debugging without leaking secrets into log aggregators (separate from `resolved_tpa_request`, which deliberately does include secrets, scoped to the DB only).

---

## 8. Frontend: Claim Status Label & Submit-Claim Button Gating

**Gap found during live testing:** the new `CLAIM INTIMATION` interim status (claim saved, delivery still in progress) is not one of the statuses the frontend recognized. `ClaimSummary`'s `mapStatus()` (`apps/ui/ibp/src/app/components/Dashboard/ClaimSummary/index.tsx`) only special-cased the literal string `INTIMATED` — everything else, including `CLAIM INTIMATION`, fell through to a generic `"Pending"` bucket, indistinguishable from a claim the TPA already has and is processing. Combined with Claims Corner having no polling/auto-refresh (`useApiQuery` has no `refetchInterval`; window-focus refetch is globally disabled), an employee who just submitted a claim would see it sitting as unexplained "Pending" with no Submit Claim button, with no indication delivery was still in flight.

**First fix (iteration 1):** mapped `CLAIM INTIMATION` to the same `"Intimated"` label as the genuinely-confirmed `INTIMATED` status, and gated the Submit button separately on `tpaClaimNo`.

**Follow-up gap found in live testing of iteration 1:** merging both statuses into one label ("Intimated") meant a claims list with several claims — some still queued/retrying/failed in the background, one genuinely TPA-confirmed — displayed **all of them identically** as "Intimated", with only the confirmed one showing the Submit button. From the claims list alone there was no way to tell which cards were actually confirmed vs still in flight (or silently stuck after exhausting retries) — the same class of ambiguity as the original "Pending" problem, just shifted to a different label.

**Fix (iteration 2 — current):** gave the interim state its own distinct label instead of reusing "Intimated":
- `mapStatus()`: `CLAIM INTIMATION` → `"Processing"` (its own `ClaimItem["status"]` union member); `INTIMATED` (literal) still → `"Intimated"`.
- `styles.ts` (`StyledClaimLabelWithStatus`): `"Processing"` styled the same orange as `"Pending"` (signals "not yet confirmed, still in motion"), keeping `"Intimated"` blue (TPA has confirmed it) — visually distinct confirmation states now have visually distinct colors, not just distinct-but-identical-looking labels.
- The **Submit Claim button's condition is unchanged and was already correct** — it requires `status === "Intimated"` AND `tpaClaimNo` non-empty:
  ```tsx
  {displayClaim.status === "Intimated" && displayClaim.rawClaimId && displayClaim.tpaClaimNo && ( ... <Button>Submit Claim</Button> )}
  ```
  Since `"CLAIM INTIMATION"` no longer maps to `"Intimated"` at all, a claim still in that interim state now correctly shows neither the "Intimated" label nor the button — resolving the ambiguity without touching the button logic itself.
- Backend already exposed `tpaClaimNo` in `ClaimSummaryDto` (`buildClaimSummary`, `company-employee.service.ts`) — no backend/DTO change was needed for either iteration.

**Still open (not fixed in this pass):**
- Claims Corner still has no live polling — an employee must leave and re-open (or reload) the page to see a claim move from "Processing" to "Intimated" once the background job succeeds.
- A job that's exhausted all retries and sits `FAILED` looks identical, from `claim_status` alone, to one still actively retrying — both are `CLAIM INTIMATION` → "Processing" on the frontend, since `claim_status` never reflects job-level exhaustion. Distinguishing these would require exposing job status (not just claim status) in `ClaimSummaryDto`, not attempted in this pass.

---

## 9. Live Verification Log

Verified against the live (read-only) `iirm_cust_ref_anon` DB during testing, confirming each fix independently:

| Check | Evidence |
|---|---|
| Migration applied | `claim_tpa_submission_job` table exists with all columns including `resolved_tpa_request` |
| Auth fix (system JWT) working | Job attempts progressed past `"Authorization token not provided"` to genuine TPA business-validation responses |
| `policy_claim.policy_number` fix live | `request_payload.policyNumber` (top-level) shows the real insurer policy number (e.g. `"0723002826P106482513"`), not the internal DB row id |
| TPA round-trip actually happening | Real ISBS validation rejection observed end-to-end: `"Missing mandatory fields: Patient contact mobile number is not valid, Invalid GH Card ID or Policy Number, Invalid Hospital ID"` — for test submissions using placeholder mobile/card/hospital values not registered in ISBS's system; not a mapping defect (field names all resolved correctly, matching §3.4's template) |
| `resolved_tpa_request` capture working | Populated correctly once **both** ibp-service and document-service were restarted on the latest build (initially null immediately after only a partial restart — see §5, this is a deployment-sequencing detail, not a logic bug) |
| End-to-end timing | Confirmed delay between claim creation and `resolved_tpa_request` population is explained by the scheduler's 2-minute poll interval plus per-attempt network round-trip time — not a stuck job |

---

## 11. `submitClaim` — Async Delivery (completes the full flow)

**What changed:** `submitClaim` (`company-employee.service.ts`) now follows the identical persist-first, deliver-async pattern as `intimateClaim`, closing the same reliability gap at the submission step (bills/documents/bank details for MULTI-flow TPAs).

### 11.1 New interim status: `CLAIM BILLS PENDING`

Mirrors `CLAIM INTIMATION`'s role for the intimation job. `policy_claim_status.id = 9`, confirmed via full-codebase grep to be completely unused before this change — same adoption process, no schema change, no migration needed (the row already existed in the master table).

```
INTIMATED (claim ready for submission)
        ↓
Employee submits bills/documents/bank details
        ↓
Save immediately: claim_status = CLAIM BILLS PENDING, documentIds/discharge date/amount persisted
        ↓
Queue a SUBMIT_CLAIM job (claim_tpa_submission_job) — returns to employee here
        ↓
   ── background, scheduler-driven, same as intimation ──
        ↓
Success → claim_status = PENDING (enters the normal claims pipeline)
Failure → retried up to 3x, then FAILED for manual follow-up
```

### 11.2 Job payload shape (`request_payload` for `jobType = SUBMIT_CLAIM`)

```ts
{
  appKey, executionMode,              // 'SINGLE_CALL' | 'PER_DOCUMENT', from tpa_external_feature_config
  userEmail, employeeId, policyId,
  tpaClaimRef, tpaClaimRefExt,        // parsed from claim.tpaClaimNo at submission time
  originalIntimationFields,           // reconstructed via buildOriginalIntimationFieldsFromClaim (DB-only, no network)
  documentIds: [{ documentId, documentType }, ...],   // IDs ONLY — see 11.3
  submissionFields: { dateOfDischarge, finalClaimedAmount, payeeName, bankAccountNo, accountType, ifscCode },
  extraFields,
}
```

### 11.3 Improvement over intimation: document fetching deferred to delivery time

Unlike intimation's SINGLE-flow (which still fetches/base64-encodes documents *synchronously*, a known residual gap — PRD §6), submission's `deliverSubmitClaimJob` fetches each document (`getDocumentAsBase64`) **at delivery time**, not at submission time. Documents live in our own S3-backed storage — fetching them later carries none of the "TPA is down" risk a live TPA call does, and keeps `claim_tpa_submission_job` rows small (document ids only, never base64 blobs, until actually needed).

### 11.4 `processClaimTpaJob` refactor

The single INTIMATION-only body was split into two private methods sharing one outer retry/attempt/`resolved_tpa_request` scaffold:
- `deliverIntimationJob(job, debugCapture)` — byte-identical to the old inline logic, just extracted.
- `deliverSubmitClaimJob(job, debugCapture)` — new. Branches on `executionMode`:
  - **`PER_DOCUMENT`** (Health India-style): loops one TPA call per document. If ANY document fails, the whole job throws — the scheduler retries the **entire submission** next attempt, mirroring the old synchronous code's "any document fails → reject the whole submission, nothing marked SUBMITTED" semantics, just retried automatically instead of by the employee. `resolved_tpa_request` stores an array (`{executionMode: 'PER_DOCUMENT', documents: [{documentId, documentType, request}, ...]}`) so every per-document request is visible, not just the last one.
  - **`SINGLE_CALL`** (FHPL-style): one call carrying all documents together via the `$forEach` payload-template mechanism, same as before.
- `processClaimTpaJob` itself now just dispatches by `job.jobType` and handles the shared success/failure bookkeeping — no jobType-specific logic left in the outer method.

**Known trade-off, explicitly accepted:** a retried `PER_DOCUMENT` job resends every document, not just the one(s) that failed — this assumes TPA submission endpoints are safe to resend, the same assumption the bounded-retry design already makes for intimation. Not verified against every TPA's actual dedup behavior; flagged for future hardening if a TPA proves not idempotent here.

### 11.5 Scheduler / controller — no changes needed

`ClaimTpaSubmissionScheduler` and the internal `POST /company-employee/internal/claim-tpa-jobs/:jobId/process` route are already job-type-agnostic (poll any `PENDING` row, POST to the same endpoint, let `processClaimTpaJob` dispatch) — confirmed no changes required for either.

### 11.6 Frontend — no changes needed

`ClaimSummary`'s `mapStatus()` already defaults any unrecognized status (including the new `CLAIM BILLS PENDING`) to `"Pending"` — a reasonable label for "documents submitted, awaiting TPA," and since the Submit-Claim button only ever showed for `"Intimated"` + `tpaClaimNo` (§8), it correctly disappears once a claim moves past `INTIMATED` into submission, with no code change needed.

---

## 12. Claim Intimation Confirmation Email — Retimed to Actual TPA Acceptance

**Gap found:** the "Claim Intimation Confirmation" email (template: `claim-intimation-notification-template.html`, event: `CLAIM_INTIMATION_CONFIRMATION_EMAIL`) was triggered from the **frontend** (`ClaimsIntimation/index.tsx`, `HRPortalIntimateClaimPage/index.tsx`), immediately after `intimateClaim()`'s response — via a separate, decoupled endpoint (`onboarding/claim-intimation-confirmation` → `OnboardingService.sendClaimIntimationConfirmationNotification`). Before this feature's redesign, `intimateClaim()` only returned success after the TPA call itself succeeded, so firing the email on that response was accurate. After the redesign, `intimateClaim()` returns success as soon as the claim is saved and queued — **before** the TPA has been contacted — so the frontend was firing an email that says *"Status: Successfully Intimated"* for a claim the TPA hadn't actually seen yet, with no corresponding email if delivery subsequently failed.

**Fix:** moved the trigger from the frontend into `deliverIntimationJob` (backend), firing only once execution reaches that point *after* the TPA call has actually succeeded (i.e. after the ISBS/generic TPA call returns without error, and BEFORE the method returns) — content/template unchanged, only the trigger point moved:

```ts
// deliverIntimationJob, after the status-update transaction + linkTpaClaimData:
try {
  await this.onboardingService.sendClaimIntimationConfirmationNotification({
    employeeId: claim.employeeId, policyId: claim.policyId,
    claimNumber: claim.claimNumber ?? String(claim.id),
    claimType: claim.claimType ?? undefined,
    patientName: claim.patientName ?? "", patientRelation: claim.patientRelation ?? "",
    diagnosis: claim.claimDescription ?? "",
    estimatedClaimAmount: Number(claim.claimAmount ?? 0),
    dateOfAdmission: ..., proposedDischargeDate: ..., placeOfAccident: claim.placeOfAccident ?? undefined,
    hospitalName: claim.claimHospital ?? undefined, hospitalLocation: claim.claimHospitalLocation ?? undefined,
    // policyTypeKey omitted — the service already resolves it from the policy it loads internally
  });
} catch (emailErr) {
  this.logError("deliverIntimationJob", { message: "[JOB] Claim intimation confirmation email failed (non-fatal)", jobId: job.id, error: emailErr });
}
```

No module wiring was needed — `CompanyEmployeeModule` already imports `OnboardingModule` (which exports `OnboardingService`), and `CompanyEmployeeService` already had `OnboardingService` injected (used for `sendEnrollmentConfirmationNotification`) — this reuses the exact same existing method (`sendClaimIntimationConfirmationNotification`), just called from a new call site.

**Frontend cleanup:** removed the now-dead trigger from both `ClaimsIntimation/index.tsx` and `HRPortalIntimateClaimPage/index.tsx` (function + `useApiMutation` hook + call site in each) — left explicitly, since leaving it would double-send the email (once prematurely from the frontend, once correctly from the backend).

**Still not covered:** no email/notification fires when a job exhausts all retries and is marked `FAILED` — the employee currently has no way to know delivery ultimately failed unless they check Claims Corner and see the claim still stuck on "Processing." Not addressed in this pass — flagged as a candidate for a future "delivery failed" notification, fired from `processClaimTpaJob`'s catch block when `exhausted === true`.

---

## 13. `ref_claim_id` and `tpa_claim_ref_id` Reliability

Two distinct, previously-unreliable columns on `policy_claim`, both fixed:

**`ref_claim_id` (varchar) — was never mapped on the entity at all.** This column already existed live in the DB (with its own index, `idx_pc_ref_claim_id`) — it's the dedup key the pull-side sync mechanism's admin-configured "Dedup column (`ref_claim_id`)" setting (`TpaAppRefForm`, iWork) matches against to detect "this claim already exists, update don't duplicate" on re-sync. Because `PolicyClaim` never declared this column, nothing in the push-side flow (`deliverIntimationJob`) could ever write to it — a claim delivered via this flow was invisible to that dedup check. Fixed: added `refClaimId` to the entity (`policy-employee-claim.entity.ts`), and it's now set alongside `tpaClaimNo` in `deliverIntimationJob`'s main status-update transaction, same value, same time.

**`tpa_claim_ref_id` (int, FK → `tpa_claim_data.id`) — was set, but silently and unreliably.** `linkTpaClaimData` previously caught its own errors internally and never rethrew — so the very first failure (a transient DB blip, or any other exception during the `tpa_claim_data` upsert) left the column permanently null with only a log line, no retry, no other recovery path. Fixed:
- `linkTpaClaimData` no longer swallows its own errors — it now lets them propagate.
- The caller (`deliverIntimationJob`) retries it up to 2 times before giving up, logging each attempt — still non-fatal to the job overall (a failure here must not fail the whole delivery and force a TPA re-submission just to fix internal bookkeeping).
- Widened the trigger condition from `tpaClaimRef && tpaRawResponse` to just `tpaClaimRef` — a missing raw response object no longer blocks linking; `claimData` falls back to `{}` so `tpa_claim_data` still gets a row (and `tpa_claim_ref_id` still gets set) even without response content to store alongside it.

---

## 14. Known Gaps (carried forward from PRD §6, restated for engineering visibility)

1. `getDocumentAsBase64` (used by SINGLE-flow generic claims) still runs synchronously during *intimation*, before the DB write. A failure there still blocks the claim from being saved — same symptom class as the original bug, different root cause (document fetch, not TPA call). Note: this is now fixed for *submission* (§11.3) — only intimation's SINGLE-flow still has it.
2. `tpa_payload_field_mapping` has no rows configured for any claim-intimation/-submission appKey today — the mechanism is fully wired and working (confirmed via document-service code trace) but dormant until an admin configures it via iWork's field-mapping UI.
3. `deriveClaimStatusCounts` (Claims Corner dashboard KPI counts) doesn't classify `CLAIM INTIMATION` or `CLAIM BILLS PENDING` into "in progress" — both currently fall to `default: break`, counted in `total` only. Cosmetic, not addressed in this pass.
4. `PER_DOCUMENT` submission retries resend every document on failure, not just the failed one(s) — see §11.4's trade-off note.
