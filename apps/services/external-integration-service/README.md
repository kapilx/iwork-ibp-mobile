# External Integration Service

Dedicated home for **inbound, external-system-initiated integrations** — a TPA/client HR system pushing data *to* us, as opposed to this codebase's existing outbound-only TPA framework (`docs/specs/tpa-external-integration-spec.md`), which only supports IBP calling *out*. HCL's employee interface is the first (and, as of this writing, only) tenant. When another such integration comes along, it gets its own sibling module here (e.g. `src/app/<partner>-integration/`), not a new service.

Runs on port `3027` locally (`PORT_EXTERNAL_INTEGRATION_SERVICE` / `URL_EXTERNAL_INTEGRATION_SERVICE` in `environments/.env.dev`), reached through the gateway at `/iirm/external-integration-service/...`.

Full design docs: [docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-PRD.md](../../../docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-PRD.md) and [...TRD.md](../../../docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-TRD.md). This README is the quick-reference API surface; the TRD is the source of truth for *why* things are built this way.

---

## What this service does, end to end

```
HCL HR System
   │ POST (UserName/Password, Flag_operationType, employee/dependent data)
   ▼
HclIntegrationController — auth + shape validation + dedup
   ▼
hcl_employee_intake table — durable staging row, status = RECEIVED
   ▼
RiskWatch (IBP UI, Settings → Integrations → "HCL Employee Interface")
   admin reviews intake records, selects RECEIVED/FAILED rows for one policy
   ▼
"Create Endorsement" — reuses the existing ZohoEndorsementPage flow
   (template fetch, xlsx build, enrollment-upload — same pipeline Zoho uses)
   ▼
intake rows → PROCESSING (documentProcessingFileId + endorsementId recorded)
   ▼
Existing EnrollmentUploadScheduler (unmodified) writes the real
policy_enrollment_employee / policy_enrollment_dependent rows
   ▼
HclIntakeReconciliationScheduler (scheduler-service) polls the result and
flips intake rows to PROCESSED or FAILED — only once the real outcome is known
```

HCL pushes data to us; **we never fetch from HCL** — every operation in HCL's interface document is a push-style mutation (see PRD §2).

---

## API reference

Base path: `/hr-module/hcl` was the original design; **as built, the controller is mounted at `integrations/hcl`** (moved out of `ibp-service`'s `hr-module` grouping when this became its own service). All routes below are relative to `integrations/hcl`.

### 1. `POST integrations/hcl/process-enroll-data`

The one inbound endpoint HCL's HRMS calls. Dispatches on `Flag_operationType`. **No JWT** — this route has an explicit bypass in `auth.guard.ts`/`acl.guard.ts` since HCL has no IBP session; authenticated instead by `UserName`/`Password` fields in the body (checked against `HCL_USERNAME`/`HCL_PASSWORD` env vars — **currently disabled/commented out** in `HclIntegrationService`, pending a decision on when to re-enable it).

**Request** — matches HCL's interface document field-for-field (verbatim casing, no camelCase translation):

```json
{
  "UserName": "iirmhclwebservice",
  "Password": "iirmhcl$123",
  "Flag_operationType": "AD",
  "Groupcode": "HTLC",
  "policyno": "G0001957",
  "SelfCount": 0,
  "Del_hcldepid": 0,
  "wef": "2021-08-03",
  "Del_deletionremarks": "",
  "prom_ctc": 0, "prom_grade": "", "prom_companyid": 0, "prom_basesi": 0,
  "objEMPLOYEE_DATA": [
    {
      "E_EMP_HCL": {
        "EIN": "51854879", "INSUREDNAME": "Gulam Mazhar", "EMAIL": "...",
        "IS_EMCP": 1, "IS_EMPAD": 1, "CHECK_SUM": "...", "...": "..."
      },
      "E_DEP_HCL": [
        { "HCL_DEPID": 35, "DEP_NAME": "NEHA", "HCL_DEPREL": 7, "...": "..." }
      ]
    }
  ]
}
```

`Flag_operationType` is one of: `AD` (Activate/Deactivate — 4 sub-cases via `IS_EMCP`/`IS_EMPAD`), `BI` (Bulk Insert), `DD` (Dependent Delete), `ED` (Employee Demise), `ES` (Employee Separation), `ET` (Employee Transfer), `NA` (Natural Addition). Per-operation required fields are in the TRD §4 table.

**Response** — exactly as HCL's document specifies per operation:

```json
{
  "GetEmpDetails": null,
  "GetEmpStatus": [],
  "GetStatus": {
    "callStatus": true,
    "procedureStatus": true,
    "returnMessage": "Employee EMCP activated successfully.",
    "returnValue": 1
  }
}
```

`BI`/`DD` populate `GetEmpStatus[]` (one entry per employee) instead, with the top-level `GetStatus.callStatus` left `false` — reproduced verbatim from HCL's own sample even though it looks like a quirk, since their HRMS client code may depend on it exactly.

**Processing, in order:**
1. Shape validation against the DTO (`class-validator`) — malformed request → `400`.
2. Per-`Flag_operationType` required-field check (TRD §4 table) — missing field → `400`.
3. **`policyno` resolution — hard requirement, not best-effort.** Looked up against `policy.insurer_policy_number`. Missing or unresolvable → `400`, **no intake row is created at all**. (This was originally best-effort/nullable; changed to a hard rejection per explicit decision — see PRD FR-10.)
4. Dedup check on `(EIN, CHECK_SUM)` per employee entry — a repeat of an already-received request returns the same response without inserting a second row. **Best-effort only**: HCL's `CHECK_SUM` algorithm is undocumented, so this can't be verified to be a true idempotency key (TRD §7).
5. One `hcl_employee_intake` row inserted per entry in `objEMPLOYEE_DATA[]` (dependents nested as a `parsed_dependents` JSON array on that same row — not one row per dependent), `status = RECEIVED`.

### 2. `GET integrations/hcl/company/:companyId/intake?status=`

Admin-facing (JWT required). Lists intake rows for a company, optionally filtered by `status` (`RECEIVED`/`PROCESSING`/`PROCESSED`/`FAILED`). Backs the RiskWatch "HCL Employee Interface" card.

```json
{ "records": [
  { "id": 1, "ein": "51854879", "flagOperationType": "AD", "status": "RECEIVED",
    "parsedEmployee": {...}, "parsedDependents": [...],
    "policyId": 1032156, "companyId": 190550,
    "endorsementId": null, "failureReason": null, "createdAt": "..." }
] }
```

### 3. `GET integrations/hcl/policy/:policyId/intake?status=`

Same shape, scoped by policy instead of company.

### 4. `GET integrations/hcl/intake/unresolved?status=`

Rows whose `policyno` never resolved (`company_id`/`policy_id` are `NULL`) — invisible to the two routes above since both filter on a non-null id. Mostly relevant to test payloads sent before FR-10's hard rejection was added, or any row inserted before that check existed; **no new unresolved rows can be created going forward**, since #1 now rejects them outright.

### 5. `POST integrations/hcl/intake/mark-processing`

```json
{ "intakeIds": [1, 2], "documentProcessingFileId": 4010, "endorsementId": 30794 }
```

Called by the frontend (`ZohoEndorsementPage`'s generic post-submit hook, not HCL-specific) once the selected records have been driven through the real enrollment-upload endpoint. Moves eligible (`RECEIVED`/`FAILED`) rows to `PROCESSING`, records the linkage, and **clears any stale `failureReason`** from a prior failed attempt. Does **not** mark anything `PROCESSED` — that only happens once `HclIntakeReconciliationScheduler` confirms the real outcome (see below).

---

## Processing-status lifecycle

```
RECEIVED ──(admin selects + "Create Endorsement")──▶ PROCESSING
PROCESSING ──(reconciliation: real success)──▶ PROCESSED   (terminal, endorsementId set)
PROCESSING ──(reconciliation: real failure)──▶ FAILED       (retryable — reselect and resubmit)
FAILED ──(admin retries)──▶ PROCESSING (loop)
```

`PROCESSED` is never set optimistically — only after `HclIntakeReconciliationScheduler` (in `scheduler-service`, see `apps/services/scheduler-service/src/app/scheduler/hcl-intake-reconciliation.scheduler.ts`) confirms the underlying `document_processing_file` actually succeeded. That scheduler runs every 2 minutes and:

- Checks `policy_enrollment_upload_summary.success_count`/`error_count` for the linked `document_processing_file_id` — **`process_status = COMPLETED` alone is not trusted as success**, since the existing enrollment-upload pipeline marks a job `COMPLETED` even when every row failed validation (confirmed against real data: a batch with `success_count = 0, error_count = 3` still showed `COMPLETED`).
- `error_count > 0`: rather than blanket-failing every row in the batch, addition-style operations (`AD`/`BI`/`ET`/`NA`) are individually re-verified against `policy_enrollment_employee` + `policy_enrollment_employee_policy_map` — if that specific EIN actually landed there for that policy, its row is marked `PROCESSED` even though other rows in the same batch failed. This was a real, confirmed bug: an employee (`EIN 90089`) was genuinely created by the pipeline, yet its intake row was marked `FAILED` because a *different* row in the same batch was rejected. `DD`/`ED`/`ES` rows can't be verified this way (the employee still existing proves nothing about whether a removal/deactivation succeeded) and keep the batch-level failure.
- A hard pipeline crash (`process_status = FAILED`) has **no structured reason available anywhere in the database** — the exception only goes to `scheduler-service`'s application logs, never a DB column. The failure message says this explicitly rather than implying more detail exists.
- Since no failure path exposes per-row detail an HR admin can act on directly, every `failureReason` ends with the same actionable line: *"Please share Endorsement ID `<id>` and Policy ID `<id>` with your CRM — they can check the failure details on the Endorsement page."*

---

## Endorsement generation — reuses existing infrastructure, doesn't duplicate it

There is no "Endorsement File Builder" service. Selected intake records are mapped (client-side, in `HclIntakeDialog.tsx`) into the same shape `ZohoEndorsementPage` already consumes, and the admin is navigated there — template fetch, xlsx generation, and the `enrollment-upload` call are all the **existing, unmodified** Zoho code path. Two things were added to that shared page to support this:

- An optional `relation` field per row, so dependent rows aren't forced to `"SELF"`.
- A `lockedPolicyId` mode: when the caller (HCL) already knows the correct policy, the dropdown is filtered to just that one and disabled — previously nothing stopped submitting HCL's employees against an unrelated, manually-picked policy.
- A generic (not HCL-specific) post-submit-success hook that calls back into `intake/mark-processing`.

**Known, deliberately-not-guessed gap**: HCL's dependent relationship code (`HCL_DEPREL` — numeric, e.g. `1`, `4`, `7`, `9`) has no legend anywhere in HCL's interface document. Rather than fabricate a Spouse/Child/Parent mapping, each dependent row's Relation cell ships as `"NEEDS REVIEW (HCL code 7)"`, visible in the endorsement preview's inline-edit grid, forcing a manual admin correction before submission.

---

## Local setup gotcha (not related to this service's own code)

Enrollment-upload processing (the shared, pre-existing pipeline this service's endorsement flow submits into) has two code paths depending on whether Redis/Valkey is configured:
- **Redis configured** → reads the uploaded xlsx with the same library (`xlsx`/SheetJS) the browser used to write it. Works.
- **Redis not configured** (default local `.env.dev` — `VALKEY_HOST`/`STORAGE_TYPE` are commented out) → falls back to a legacy path that reads the file with `exceljs`'s **streaming** reader, which cannot parse zip files SheetJS writes (confirmed via direct reproduction — a zip-entry-ordering incompatibility between the two libraries, not anything about this service's data). Every enrollment submission, HCL or Zoho, will crash locally with `Cannot read properties of undefined (reading 'sheets')` until Redis/Valkey is configured.

Fix: install/run Redis or Valkey locally and set `VALKEY_HOST`, `VALKEY_PORT`, `STORAGE_TYPE=valkey` in `environments/.env.dev`.

---

## Testing

- `src/app/hcl-integration/fixtures/*.json` — HCL's own document sample payloads, verbatim, for all 10 operation cases. **Edit `policyno` to a real `policy.insurer_policy_number`** before using — the samples' placeholder values (`"900020001111"`, `"NA"`) are now hard-rejected (see API #1, step 3).
- `src/app/hcl-integration/scripts/test-hcl-endpoint.ts` — posts all 10 fixtures, checks the response against HCL's documented message per case, verifies dedup. `npx ts-node apps/services/external-integration-service/src/app/hcl-integration/scripts/test-hcl-endpoint.ts`.
- `src/app/hcl-integration/scripts/curl-examples.txt` — same 10 cases as ready-to-paste curl commands against the real gateway path.

---

## Related, but lives elsewhere

`GET /policy/company/:companyId/policy-options?page=&limit=` (in `policy-service`, not here) — a new, lightweight paginated `{policyId, policyName, policyNumber}` endpoint that replaced the heavy `dashboard_policy_cards` report as the data source for `ZohoEndorsementPage`'s "Select Policy" dropdown. Not HCL-specific, but built as part of making this flow usable.

## Explicitly deferred / open items

See TRD §14 for the full table. Headline items: checksum verification (algorithm undocumented by HCL), true idempotency guarantee, `ET` transfer semantics beyond a plain attribute update, `HCL_DEPREL` relation-code mapping, template column mapping confirmation against a real per-policy template, partial-processing granularity when a batch partially fails, and whether an approval gate is needed beyond the admin's own selection action.
