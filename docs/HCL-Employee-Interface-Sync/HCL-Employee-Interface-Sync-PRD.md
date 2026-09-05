# HCL Employee Interface — RiskWatch Sync — PRD

**Doc type:** Inbound TPA/client employee-and-dependent lifecycle intake, surfaced and actioned in RiskWatch (IBP HR portal), feeding the existing endorsement/enrollment pipeline
**Status:** Draft — finalized single-flow architecture (supersedes the earlier "Phase 1 preview-only" framing; see §7 for what remains genuinely undecided)
**Source:** HCL Interface Document v1.4 (05-Feb-2024) — "Employee Activate and Deactivation Service," "Bulk Insert Service," "Dep Delete Service," "Employee Demise Service," "Employee Separation Service," "Employee Transfer Service," "Employee Natural Addition Service"

---

## 1. Background

HCL has handed over an interface document describing seven employee-lifecycle operations, all posted to a single endpoint:

```
POST https://broker.integratedbenefitsportal.com/HRMService/api/IIRMHCLService/HCLProcessEnrollData
```

| `Flag_operationType` | Operation | Sample outcome message |
|---|---|---|
| `AD` | Activate/Deactivate (4 sub-cases via `IS_EMCP`/`IS_EMPAD`) | "Employee EMCP activated successfully." etc. |
| `BI` | Bulk Insert | "Employee and dependents successfully updated" |
| `DD` | Dependent Delete | "Employee dependents deleted successfully" |
| `ED` | Employee Demise | "Employee deleted successfully." |
| `ES` | Employee Separation | "Employee deleted successfully." |
| `ET` | Employee Transfer | "Employee Transferred TO EMCP Successfully" |
| `NA` | Natural Addition (new dependent) | "Natural addition added successfully." |

## 2. Feasibility findings (unchanged from earlier analysis, still hold)

**Finding 1 — this is not a fetch API.** `broker.integratedbenefitsportal.com` is *our own* domain (this codebase is IBP — Integrated Benefits Portal). Every one of the seven operations is a push-style mutation, and every sample `OUTPUT Response` in the document returns `"GetEmpDetails": null` — there is no "list employees" read call anywhere in this spec. **HCL pushes data to us; we do not fetch employees from HCL.** What this document describes is an endpoint **we must build and expose**.

**Finding 2 — the existing generic TPA framework doesn't cover this shape.** The codebase's config-driven TPA integration framework (`docs/specs/tpa-external-integration-spec.md`) is built entirely around IBP calling *out* to a TPA. Its own edge-case list states: *"Webhook-based TPAs (TPA pushes data to us) — Framework covers only outbound calls."* This endpoint is therefore a bespoke, net-new build, independent of that framework.

## 3. Objective

Let HCL's HR system push employee and dependent lifecycle changes to our system via the documented API, have those changes land safely and durably, let an HR/Ops admin review and select them from RiskWatch, and turn the selected changes into a real endorsement using our existing per-policy enrollment/endorsement machinery — with full traceability from the original HCL request through to the resulting endorsement.

## 4. Architecture summary (business view)

```
HCL HR System
   │  pushes employee/dependent lifecycle events
   ▼
HCL Inbound API  →  Validation  →  HCL Employee/Dependent Intake Table
                                          │
                                          ▼
                                     RiskWatch (admin reviews, selects records)
                                          │
                                          ▼
                                   Endorsement File (xlsx, existing
                                   policy-specific template)
                                          │
                                          ▼
                          Existing Enrollment/Endorsement Flow (unchanged)
                                          │
                                          ▼
                                  Endorsement Created
                                          │
                                          ▼
                          Intake Records marked Processed (or Failed, with reason)
```

Full technical detail, including the reconciliation mechanism between the existing endorsement pipeline and the intake table, is in the TRD.

## 5. Actors

| Actor | Role |
|---|---|
| HCL HRMS (TPA/client system) | Calls our API whenever an employee/dependent lifecycle event occurs on their side |
| Our inbound API (this feature) | Authenticates, validates, and durably stores every incoming request in the intake table |
| HR/Ops admin (RiskWatch) | Reviews intake records, selects eligible/pending ones, triggers endorsement generation, sees outcome and failures |
| Existing enrollment/endorsement pipeline | Consumes the generated endorsement file exactly as it does today for manual or Zoho-sourced uploads — unchanged by this feature |

## 6. Scope

**In scope:**
- The documented inbound endpoint, supporting all seven operation types (`AD` in its 4 sub-cases, `BI`, `DD`, `ED`, `ES`, `ET`, `NA`).
- Authentication and field-level validation of every incoming request before it is stored.
- Durable storage of every accepted request in a **dedicated HCL intake/staging table** — not a direct write into the existing employee/endorsement tables.
- A processing-status lifecycle on every intake record (`RECEIVED` / `PROCESSING` / `PROCESSED` / `FAILED`).
- Duplicate-request handling using whatever mechanism the HCL document actually supports (see §11 — the document does not define an explicit idempotency key, so this is only partially resolvable and is marked TBD where it isn't).
- A RiskWatch "HCL" integration card/view: list of received records with operation type, employee/dependent details, status, received date, endorsement ID, and failure reason where applicable.
- Admin-driven selection of eligible/pending intake records and triggering of endorsement generation for the selected set.
- Endorsement file (xlsx) generation using the **existing policy-specific template mechanism** — no new template system.
- Reuse of the **existing enrollment-upload → endorsement pipeline** end-to-end — no parallel/new write path into `policy_enrollment_employee` / `policy_enrollment_dependent`.
- Marking intake records `PROCESSED` only once the resulting endorsement has actually been created successfully, storing the resulting `endorsement_id` against them.
- Retaining `FAILED` records with a failure reason, available for retry.

**Out of scope for this document:**
- Real HCL production credentials/connectivity and the literal `broker.integratedbenefitsportal.com` path — this document specifies the contract and processing behavior; go-live mechanics with HCL are a separate exercise.
- Checksum **verification** — `CHECK_SUM`'s hashing algorithm is undocumented; it continues to be stored, not algorithmically verified.
- Any change to the generic outbound TPA framework — this remains a bespoke, HCL-shaped endpoint, per Finding 2.
- Per-employee (sub-batch) partial-success granularity beyond what the existing enrollment/endorsement pipeline itself exposes — see TRD §11 for why this is a real constraint, not an oversight.

## 7. Use cases

| # | HCL operation | Business meaning | Expected intake/processing outcome |
|---|---|---|---|
| 1 | `AD`, `IS_EMPAD=1` | Employee added/activated (EMCP or GHMI, per `IS_EMCP`) | Intake record(s) created for the employee and any dependents in the payload; eligible for endorsement as an addition |
| 2 | `AD`, `IS_EMPAD=0` | Employee deactivated | Intake record created; eligible for endorsement as a removal |
| 3 | `BI` | Bulk onboarding of multiple employees (with or without dependents) | One intake record per entry in `objEMPLOYEE_DATA[]` |
| 4 | `DD` | Remove a specific dependent (`Del_hcldepid`) | Intake record created identifying the dependent to remove |
| 5 | `ED` | Employee deceased | Intake record created; eligible for endorsement as a removal |
| 6 | `ES` | Employee separated from company | Intake record created; eligible for endorsement as a removal |
| 7 | `ET` | Employee transferred | Intake record created; **exact downstream meaning of "transfer" is not fully specified by the sample payload — see §11 TBD** |
| 8 | `NA` | New dependent added to an existing employee | Intake record created for the new dependent, linked to the existing employee |

## 8. Functional requirements

- **FR-1:** Every incoming request is authenticated and validated against the documented shape for its `Flag_operationType` before anything is stored — an invalid or unauthenticated request produces the documented failure response and creates no intake record.
- **FR-2:** Every accepted request is stored in the HCL intake table, never written directly into `policy_enrollment_employee` / `policy_enrollment_dependent` at intake time.
- **FR-3:** Every intake record carries a processing status: `RECEIVED` (on arrival) → `PROCESSING` (once selected for endorsement generation) → `PROCESSED` (endorsement created successfully) or `FAILED` (endorsement generation or downstream processing failed).
- **FR-4:** RiskWatch shows, per intake record: operation type, employee/dependent detail, status, received date, endorsement ID (once available), and failure reason (when `FAILED`).
- **FR-5:** An admin can select one or more eligible (`RECEIVED` or `FAILED`) intake records and trigger endorsement generation for that selection.
- **FR-6:** Endorsement generation produces an xlsx using the policy's existing template mechanism, then routes through the existing enrollment-upload → endorsement pipeline unchanged.
- **FR-7:** An intake record is marked `PROCESSED` only after the resulting endorsement has actually been created — never optimistically at selection time — and the resulting `endorsement_id` is stored against it.
- **FR-8:** If endorsement generation or downstream processing fails, the intake record(s) involved are marked `FAILED` with a failure reason and remain available for retry — they are not deleted or silently dropped.
- **FR-9:** Duplicate handling: re-sending an already-processed or already-received request must not create a second intake record or a second endorsement for the same underlying change (see §11 for the limits of what the document lets us guarantee here).
- **FR-10:** A request for a `policyno` that does not resolve to a known policy is rejected at intake time with a clear error ("Policy number is not available in IIRM database") — it does not create an orphaned intake record. A missing `policyno` entirely is rejected the same way ("policyno is missing in the request.").

## 9. End-to-end flow

```
HCL HR System
   │ POST (Flag_operationType, E_EMP_HCL, E_DEP_HCL[])
   ▼
HCL Inbound API — authenticate, validate shape
   │
   ├─ invalid/unauthenticated ──► documented failure response, nothing stored
   │
   ▼ valid
HCL Employee/Dependent Intake Table — new row, status = RECEIVED
   │
   ▼
RiskWatch — admin reviews intake records for a policy, selects eligible ones
   │
   ▼
Endorsement File generated (xlsx, existing per-policy template) — selected
records move to status = PROCESSING, endorsement reference attached
   │
   ▼
Existing Enrollment/Endorsement Flow (unchanged: enrollment-upload endpoint →
scheduler → policy_enrollment_employee/policy_enrollment_dependent)
   │
   ├─ succeeds ──► Endorsement Created ──► intake records → PROCESSED,
   │                                        endorsement_id stored
   │
   └─ fails ──► intake records → FAILED, failure reason stored, retryable
```

## 10. Acceptance criteria

- [ ] POSTing each of the document's sample payloads (all 4 `AD` sub-cases, `BI`, `DD`, `ED`, `ES`, `ET`, `NA`) with correct credentials returns the documented response and creates the corresponding intake record(s) with status `RECEIVED`.
- [ ] Invalid credentials or a malformed payload for its operation type return a failure response and create no intake record.
- [ ] RiskWatch's HCL card lists intake records with operation type, employee/dependent detail, status, received date, endorsement ID, and failure reason where applicable.
- [ ] An admin can select eligible intake records for a single policy and trigger endorsement generation.
- [ ] A successful endorsement generation results in: the endorsement existing in the system exactly as a manual/Zoho-sourced enrollment upload would produce it, the selected intake records marked `PROCESSED`, and `endorsement_id` populated on them.
- [ ] A failed endorsement generation leaves the selected intake records `FAILED` with a non-empty failure reason, and they remain selectable for retry.
- [ ] Re-sending an identical HCL request does not create a duplicate intake record (to the extent the document's fields allow detecting this — see §11).

## 11. Assumptions and TBDs

Per explicit instruction, nothing below is assumed into a business rule — each is called out as open:

- **TBD — Idempotency guarantee:** the HCL document defines no explicit request ID or transaction identifier. `EIN` + `CHECK_SUM` is the best available natural key, but `CHECK_SUM`'s derivation is undocumented, so we cannot confirm it changes if and only if the underlying data changes. Duplicate detection based on it is a reasonable best effort, not a guarantee — see TRD §7.
- **TBD — "Transfer" semantics (`ET`):** the sample payload carries the same shape as `AD`, with no field that unambiguously states what is being transferred (entity, policy, grade). What this should mean for endorsement generation is not specified and needs confirmation before implementation.
- **Decided — Unresolvable `policyno`:** rejected outright at intake (FR-10), implemented in `HclIntegrationService.processEnrollData` — a missing `policyno`, or one that doesn't match any `policy.insurer_policy_number`, returns a failure response and creates **no** intake record at all (not even an unresolved one). No hold-for-manual-resolution path exists; if that's later wanted it would need to be built as a new feature, not assumed.
- **TBD — Approval/review gate:** whether any additional sign-off is required before an admin's endorsement-generation action actually creates the endorsement, beyond the admin's own selection action. Not specified by the source document; assumed here that the admin's selection *is* the approval step.
- **TBD — Partial-processing granularity:** whether a batch containing several intake records that partially succeed/fail during downstream processing can be reflected as such, given the existing enrollment pipeline's own granularity (see TRD §11) — flagged as a real technical constraint, not a business decision this document can resolve alone.
- **Assumption (stated, not hidden):** the RiskWatch selection-and-generate action is the trigger point for endorsement creation — this is not a fully automatic, no-human-in-the-loop pipeline. If a fully automatic flow is later wanted, that is a different, explicitly separate requirement from what is specified here.

---
See [HCL-Employee-Interface-Sync-TRD.md](./HCL-Employee-Interface-Sync-TRD.md) for the technical architecture, API specification, database design, and processing logic.
