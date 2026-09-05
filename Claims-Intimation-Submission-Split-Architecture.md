# Claims Flow Redesign — Split Intimation & Submission (TPA-Driven, Generic)

Status: **v3 — in implementation.** Priority order decided: build the generic MULTI-step engine end-to-end for **FHPL + Health India first** (iWork TPA config → IBP intimation → IBP submission). **ISBS/GHPL is deprioritized to last** — it's SINGLE-step but with a much larger field surface (nested arrays: billing lines, ICU days, contact details), so it becomes its own follow-up form variant once the generic engine is proven on the two MULTI-step TPAs. The flow-type field is named `claimFormType: 'SINGLE' | 'MULTI'`.

---

## 1. Why this change (unchanged from v1)

Today, a claim is raised in **one shot**: the user fills a 3-section form and hits Submit once. The backend (`CompanyEmployeeService.intimateClaim`, `apps/services/ibp-service/.../company-employee.service.ts:9359`) synchronously calls a **hardcoded ISBS-only function** (`callIsbsBrokerClaim`, line 9614) before saving to DB. That worked with one TPA. Now we have three, and they don't share a shape:

- **FHPL** — genuinely two-step: small intimation call → returns a claim ID → separate submission call with bank details + documents.
- **Health India** — offers three endpoints; the two-step pairing is intimation-only → then **one document-submission call per document** (not a batch call).
- **ISBS/GHPL** — one comprehensive single call, but far richer than today's version (nested insured/hospital/billing/document sections, several new fields not collected anywhere today).

So three TPAs, three different shapes of "not single-step-simple." The architecture has to express all three without hardcoding any of them.

---

## 2. Concrete TPA API inventory

### 2.1 FHPL — clean two-step

| | Endpoint | Auth |
|---|---|---|
| Intimate | `POST https://brk-api-uat-v1.fhpl.net/api/ClaimIntimation` | `Authorization: Bearer {{fhpl-token}}` — **static pre-shared token, no login/fetch step** |
| Submit | `POST https://brk-api-uat-v1.fhpl.net/api/ClaimSubmission` | Same static bearer token |

Intimate request: `Member_UHID, Date_of_Admission, Policy_Number, Type_of_Claim (int enum), Diagnosis, Mobile_number, Email_id, Name_of_hospital, Hospital_address, HospitalID`. Flat, single-level object.

Submit request: `Userid, PolicyNo, UhidNo, ClaimID, IssueID, Slno, DOA, DateofDischarge, ClaimedAmount, DocumentType, PayeeName, HospitalName, MobileNo, AccountType, BankAccountNo, Documents: [{documentName, documentCategory, File(base64)}]`. Flat object + one array field (`Documents`) holding **all** documents in a single call.

`ClaimID` in the submit payload is clearly the value FHPL's intimation response must return — needs confirming (see §7.2).

### 2.2 Health India — three endpoints, pick the two-step pairing

| Endpoint | Role |
|---|---|
| `POST .../Intimation/GetClaimIntimation` | Intimation only — flat fields, no documents |
| `POST .../Document/GetClaimDocumentSubmission` | Submits **one document at a time**, keyed by `CCN`/`CCN_EXT` returned from intimation |
| `POST .../IntimationDMS/GetClaimIntimationWithDMS` | Single-shot alternative: intimation fields + `pdF_BYTES` combined — a **SINGLE** option for this same TPA |

Intimation request fields: `policY_NUMBER, employeE_CODE, membeR_ID, claiM_TYPE, benefiT_TYPE, claimeD_AMOUNT, datE_OF_ADMISSION, ailmenT_DESCRIPTION, hospitaL_CODE, hospitaL_NAME, hospitaL_ADDRESS, hospitaL_NUMBER`. (Casing is exactly as given — odd mixed-case, not a typo on our side, must be preserved verbatim.)

Document-submission request: `CCN, CCN_EXT, documenT_TYPE, pdF_BYTES: [...]` — **one call per document type**, not an array of documents in one call. This is a structurally different "submission" shape than FHPL's.

**No `Authorization` header appears in either curl.** Needs confirming — IP-whitelisted, or omitted from the shared example (§7.3).

**Decided**: MULTI, using Intimation + N×Document-Submission calls. Reasoning: the combined `GetClaimIntimationWithDMS` endpoint requires all documents to be in hand at the moment of intimation — which defeats the actual point of splitting the form (intimate early with minimal data, gather and submit bills later, possibly over multiple sessions). The per-document endpoint is the one Health India provides specifically for "documents arrive after intimation," which is exactly the real-world case this feature exists for. This also keeps Health India and FHPL on the same conceptual shape (two-step), differing only in `submit_execution_mode` (`PER_DOCUMENT` vs `SINGLE_CALL`) — one consistent pattern, not a third bespoke one. `GetClaimIntimationWithDMS` stays unused for now; worth keeping in mind only if a future case needs "everything ready at once" (e.g. OCR-assisted intake where docs are already uploaded before the user even starts the form).

### 2.3 ISBS/GHPL — one comprehensive call, richer than today

`POST https://dev.isbsindia.in/WebServ/api/Intermediary/ClaimsDigitizationProcess`

Auth/identity fields live **in the body**, not headers: `brokerUsername, brokerPassword, brokerAPIKey, ChecksumValue`, alongside `policyNo`, `ptGhCardId`, and a `claimsDigitizationdetails` object containing:
- `insuredDetails` (object)
- `insuredContactDetails` (**array**)
- `hospitalContactDetails` (**array**)
- `claimsDetails` (large flat object — ~30 fields: admission/discharge dates, diagnosis ×2, doctor details, room type, service type, ICD/procedure codes, etc.)
- `maternityDetails`, `accidentDetails`, `investigationReport` (conditional-use objects)
- `hospitalizationDetails` (object)
- `icuDetails` (**array**)
- `claimsBankDetails` (object)
- `claimBillingDetails` (**array**, one entry per bill line item)
- `docDigitizationDetails` (**array** — document *names* + remarks only, **no file bytes** — this call doesn't carry actual document content, just a checklist)

This is a **single-step, all-in-one submission**, but with a much bigger field surface than the current `callIsbsBrokerClaim` (which sends ~15 flat fields). Four of its sections are variable-length arrays.

---

## 3. Flow classification (confirmed against real payloads)

| TPA | Flow | Notes |
|---|---|---|
| **FHPL** | **MULTI** | Intimate → `ClaimID` → Submit (bank details + all docs in one array) |
| **Health India** | **MULTI** (recommended) | Intimate → `CCN`/`CCN_EXT` → Submit **once per document** (fan-out, not a single call) |
| **ISBS/GHPL** | **SINGLE**, expanded | One call, but the field surface grows substantially vs. today — this is a bigger frontend form, not a flow-split |

This validates the v1 design's core premise (`claim_form_type` per TPA feature config) but surfaces two things v1 didn't anticipate:

1. **"Submission" isn't always one call.** Health India needs the framework to execute the submit step **N times** (once per required document), not once. Nothing in the codebase does this today inside a single request — the only fan-out precedent is scheduler jobs looping over queued rows (`tpa-claims-worker.scheduler.ts:127-138`), not an inline loop serving one live user request. This needs new (small) capability: a "repeat this call once per item in array X" execution mode, held in the `SUBMIT_CLAIM` feature config as a flag (e.g. `submitExecutionMode: 'SINGLE_CALL' | 'PER_DOCUMENT'`).
2. **Flat `dynamicParamMapping` (key→key rename) is insufficient for ISBS.** Its payload has 4 variable-length arrays; the existing/extended templating engine (`payload-template.util.ts`) only substitutes placeholders inside a **fixed-shape** template — it cannot repeat an array block once per caller-supplied item. See §5.2 for the resolution.

---

## 4. Canonical field mapping — Intimation stage

Mapping our internal canonical field (mostly = today's `ClaimsIntimationFormValues`, `apps/ui/ibp/.../ClaimsIntimationStepper/types.ts`) to each TPA's param. This is the field-config data that will seed `tpa_claim_field_config` (§6.2).

| Canonical field | Already in our form today? | FHPL param | Health India param | ISBS param (path) |
|---|---|---|---|---|
| `policyNumber` | yes (via `policyId` → resolved) | `Policy_Number` | `policY_NUMBER` | `policyNo` |
| `memberCardId` | yes (`patientTpaId`, resolved server-side) | `Member_UHID` | `membeR_ID` | `ptGhCardId` / `insuredDetails.selfCardId` |
| `employeeCode` | not a form field (resolvable server-side from employee record) | — | `employeE_CODE` | — |
| `claimType` | yes | `Type_of_Claim` (int enum — **mapping TBD, §7.4**) | `claiM_TYPE` (string: `Reimbursement`/`Cashless`) | `claimsDetails.subType` equivalent |
| `benefitType` | **no — new field** | — | `benefiT_TYPE` (e.g. `IPD`) | `claimsDetails.treatmentType`/`serviceType` |
| `estimatedClaimAmount` | yes | — (not sent at intimation) | `claimeD_AMOUNT` | `claimsDetails.claimedAmountAsPerClaim` / `requestedAmount` |
| `dateOfAdmission` | yes | `Date_of_Admission` | `datE_OF_ADMISSION` | `claimsDetails.dateOfAdmission` + `hospitalizationDetails.dateOfAdmission` |
| `diagnosis` | yes | `Diagnosis` | `ailmenT_DESCRIPTION` | `claimsDetails.provisionalDiagnosis` / `finalDiagnosis` (two separate fields — **new**, we only have one today) |
| `patientMobile` | not a form field today (exists on employee/dependent profile) | `Mobile_number` | — | `insuredContactDetails[].mobileNumber` |
| `patientEmail` | not a form field today (exists on profile) | `Email_id` | — | `insuredContactDetails[].emailId` |
| `hospitalId`/code | yes | `HospitalID` | `hospitaL_CODE` | — (ISBS uses name/address only here) |
| `hospitalName` | yes | `Name_of_hospital` | `hospitaL_NAME` | `claimsDetails.hospitalName` |
| `hospitalAddress`/location | yes | `Hospital_address` | `hospitaL_ADDRESS` | `claimsDetails.hospitalAddress` |
| `hospitalPhone` | yes | — | `hospitaL_NUMBER` | `hospitalContactDetails[].hospitalMobile` |

**Takeaway**: the intimation-stage field set you already collect covers FHPL and Health India almost completely — `benefitType` is the only genuinely new field needed for those two. `patientMobile`/`patientEmail` don't need new form inputs; they should be pulled server-side from the employee/dependent record, same as `patientTpaId` already is.

ISBS's intimation-equivalent fields mostly already exist too — the *expansion* for ISBS is almost entirely in stage-adjacent detail (bank details, billing breakdown, ICU, maternity/accident, document checklist) that today's form doesn't ask for at all, addressed below.

## 5. Canonical field mapping — Submission stage

| Canonical field | FHPL param | Health India (per-document call) | ISBS (same call as intimation) |
|---|---|---|---|
| `claimReferenceId` (from intimation response) | `ClaimID` | `CCN` + `CCN_EXT` | n/a (single call) |
| `dateOfDischarge` | `DateofDischarge` | — (not part of doc submission) | `claimsDetails.dateOfDischarge` |
| `finalClaimedAmount` | `ClaimedAmount` | — | `claimsDetails.claimedAmountAsPerClaim` |
| `payeeName` — **new field** | `PayeeName` | — | (not present — ISBS pays to bank details only) |
| `bankAccountNo` — **new field** | `BankAccountNo` | — | `claimsBankDetails.accountNo` |
| `accountType` — **new field** | `AccountType` | — | `claimsBankDetails.accountType` |
| `ifscCode` — **new field** | — (not in FHPL payload) | — | `claimsBankDetails.IFSCCode` |
| documents | `Documents[]` (all in one array, base64) | one call per doc: `documenT_TYPE` + `pdF_BYTES` | `docDigitizationDetails[]` — **names/remarks only, no bytes** |

**Takeaway**: submission-stage requirements genuinely differ by TPA — FHPL needs bank/payee details + a document bundle in one call; Health India needs *only* documents, fired one call per document; ISBS doesn't have a separate submission stage at all, but wants bank details and a billing/document checklist bundled into its one big call. This confirms the per-TPA field-config table from v1 is the right shape — a single hardcoded submission form would not fit all three.

**New fields needed across the frontend that don't exist today, regardless of TPA choice**: `benefitType`, `payeeName`, `bankAccountNo`, `accountType`, `ifscCode`. For ISBS specifically, also: itemized billing lines (repeatable rows: head, sub-head, bill no/date/amount, deduction, paid amount), ICU day count + from/to dates, ICD/procedure codes, treating-doctor details, maternity/accident conditional sections, and ambulance/service-type classification. **This is a materially bigger form for ISBS than exists today** — flagging as a scope item, not folding it in silently.

---

## 6. Data model changes (revised from v1)

### 6.1 Claim flow type + submission execution mode

On `TpaExternalFeatureConfig`:

```
tpa_external_feature_config
  + claim_form_type: 'SINGLE' | 'MULTI'          (on the INTIMATE_CLAIM row)
  + submit_execution_mode: 'SINGLE_CALL' | 'PER_DOCUMENT' (on the SUBMIT_CLAIM row; only meaningful for MULTI)
```

Seed values from §3: FHPL → `MULTI` / `SINGLE_CALL`. Health India → `MULTI` / `PER_DOCUMENT` (decided, §2.2). ISBS → `SINGLE` / n/a.

### 6.2 Per-TPA, per-stage field configuration — unchanged concept, confirmed necessary by real data

Still the new `tpa_claim_field_config` table from v1 (`tpaId, stage, fieldKey, label, dataType, required, section, sortOrder, validation, tpaParamName`). Real payloads confirm this is needed — not merely "nice to have" — because, as shown in §4-5, the three TPAs genuinely disagree on which fields exist at which stage.

**Refinement for repeatable sections** (ISBS's billing lines, ICU days, contact-detail arrays): add a `isRepeatable: boolean` + `repeatGroupKey` to a field-config row. Rows sharing a `repeatGroupKey` render as one repeatable row-group in the frontend (e.g. "Add another bill line") and, on the backend, get collected into an array before payload assembly — this is plain application code building the array, **not** a job for the flat templating engine (see §6.3).

### 6.3 Payload assembly — split responsibility instead of one generic templater

v1 assumed the existing `payload-template.util.ts` could do everything. It can't — confirmed by reading it: it substitutes `{{placeholders}}` inside a **fixed-shape** template, with no repeat-block construct (`apps/services/document-service/src/app/external-app/payload-template.util.ts:41-67`).

Revised approach:
- **Flat payloads (FHPL, Health India)** — these need nothing beyond what already exists: build a flat `{ [tpaParamName]: value }` object from field-config + `dynamicParamMapping`, feed it straight into the existing template resolution. No engine changes needed.
- **ISBS's nested/array payload** — build the nested object in application code (a dedicated `buildIsbsClaimPayload(fieldConfig, values)` function that assembles `insuredContactDetails`, `icuDetails`, `claimBillingDetails`, `docDigitizationDetails` arrays from the repeatable field groups), rather than trying to force it through the generic per-key templater. This keeps ISBS technically "config-driven" (field list/labels/validation still come from `tpa_claim_field_config`) without requiring a repeat-block feature to be built into the shared templating engine just for one TPA's shape.
- If a **future** TPA needs another nested/array payload, revisit whether the repeat-block feature is worth building into `payload-template.util.ts` generically at that point — not before, since building generic array-repeat support speculatively for a single current user (ISBS) is the kind of premature abstraction worth avoiding.

### 6.4 ISBS checksum — needs to be built from scratch, and needs input from you

`ChecksumValue` has **no existing implementation anywhere in this repo** (confirmed by search). Before this can be coded, we need from ISBS's own integration docs: the exact algorithm (HMAC-SHA256? plain SHA256? something else), which fields get concatenated and in what order, and what secret/key is used. Once known, this becomes a small utility (`isbs-checksum.util.ts`) invoked just before building the ISBS payload — architecturally a non-issue, just blocked on the algorithm spec (§7.5).

### 6.5 Auth strategy mapping — confirmed against `ExternalAppService`

| TPA | `authType` to configure | Why |
|---|---|---|
| FHPL | `HEADER_CREDENTIALS` | Static pre-shared bearer token, no login/token-fetch step — `HEADER_CREDENTIALS` goes straight to the data call with a static header template (`external-app.service.ts:456-491`); `JWT` doesn't fit since it *generates* a signed token per call rather than sending a literal static one |
| Health India | **TBD, pending §7.3** | No auth header shown in the sample curls at all — if genuinely none (IP-allowlist), `DIRECT` fits (no auth step, nothing added); if a header does exist, likely `HEADER_CREDENTIALS` like FHPL |
| ISBS | `DIRECT` | Credentials (`brokerUsername`/`brokerPassword`/`brokerAPIKey`/checksum) live as plain body fields, no separate login call — `DIRECT` is exactly this shape (`external-app.service.ts:422-454`) |

### 6.6 `PolicyClaim` — unchanged from v1

Still just the new `INTIMATED` status value between existing `PENDING` and the rest of the lifecycle; `tpaClaimNo`/`tpaClaimRefId` columns already exist and are reused as-is (for Health India, `tpaClaimRefId` needs to hold both `CCN` and `CCN_EXT` — either concatenate or add one more nullable column if kept separate; recommend concatenating as `"<CCN>:<CCN_EXT>"` to avoid a schema change for one TPA's quirk, revisit if a second TPA needs a second correlation value).

---

## 7. Open items — need answers before coding starts

1. **FHPL's exact intimation response shape** — need the actual response body (not just request) to confirm the field name that becomes `ClaimID` in the submission payload.
2. **Health India auth** — confirm whether there's genuinely no Authorization step (IP-allowlisted?) or whether a header was simply left out of the shared examples.
3. **FHPL `Type_of_Claim` int enum** — need the value→meaning mapping (e.g. `1 = ?`, `2 = ?`) to translate our `claimType` (`CASHLESS`/`REIMBURSEMENT`) correctly.
4. **ISBS checksum algorithm + secret** — blocking item for ISBS payload building (§6.4); needs to come from ISBS's technical documentation.
5. **Time-gap / expiry** between intimation and submission — still open from v1, applies to FHPL and Health India.
6. **HR-portal proxy flow** — still open from v1: does `HRPortalIntimateClaimPage` need the same split treatment? Likely yes since it's the same TPA underneath, but confirm.

---

## 8. Implementation order (revised — starts where you asked: iWork's TPA config screens)

1. **iWork admin, no new screens needed** — the `TpaAppRefsPage` / `TpaExternalFeatureForm` admin UI already exists (`apps/ui/iwork/src/app/pages/TpaAppRefsPage/`, `InsurerPage/TpaExternalFeatures/`). Use it to create:
   - One `MstrExtApplicationRef` each for: FHPL-Intimate, FHPL-Submit, Health-India-Intimate, Health-India-Submit(-per-doc), ISBS-ClaimsDigitization.
   - One `TpaExternalFeatureConfig` each binding `(tpaId, apiType)` → the above app-refs, with `apiType = INTIMATE_CLAIM`/`SUBMIT_CLAIM` as appropriate.
   - This alone requires the two new columns (`claim_form_type`, `submit_execution_mode`) and the `DIRECT`/`HEADER_CREDENTIALS` auth wiring to exist on the backend first — so step 2 needs to land before this can be fully exercised, but the entity/migration work is small.
2. **Backend**: migration for `claim_form_type`, `submit_execution_mode`, new `tpa_claim_field_config` table (with `isRepeatable`/`repeatGroupKey`), `INTIMATED` claim status row.
3. **Backend**: generic flat-payload builder (FHPL, Health India) reading `tpa_claim_field_config` + `dynamicParamMapping`; dedicated `buildIsbsClaimPayload` for the nested/array case; ISBS checksum utility once §7.5 is answered.
4. **Backend**: `POST .../claims/:id/submit` endpoint with `submitExecutionMode`-aware execution (single call vs. per-document loop for Health India); `GET .../claims/field-config` endpoint for the frontend.
5. **Backend**: extend `tpa-external-feature` admin CRUD (already has a UI shell) with the new field-config table — this is the one genuinely new admin screen needed.
6. **Frontend (IBP)**: fetch-and-merge field-config into `ClaimsIntimationStepper`; branch on `flowType`; build new `ClaimSubmission` page; add repeatable-row-group support to the shared `DynamicForm` for ISBS's billing lines/ICU days (check if it already supports repeatable groups before building new).
7. **Frontend**: wire "Continue Submission" into `ClaimsCorner`/`HRPortalClaimsV2` for claims sitting in `INTIMATED`.
8. **Per TPA, roll out one at a time**: configure real endpoints in UAT via the admin UI, dry-run with the existing "test API config" tool, verify end-to-end in IBP staging, then go live — FHPL and ISBS have complete-enough specs to start now; Health India blocked on confirming auth (§7.2).
