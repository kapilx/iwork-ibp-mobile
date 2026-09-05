# Product Requirements Document — Claim Intimation → TPA Delivery Reliability

**Module:** CLAIMS / TPA-INTEGRATION
**Product:** Insurance Wellness Hub (IBP — Employee Portal)
**Stage:** Reliability fix + async delivery redesign
**Created Date:** 2026-08-12

---

## 1. Overview

When an employee raises a claim (claim intimation) through the portal, the platform must record it in TPA's (Third Party Administrator's) system as well as our own, so the claim can be tracked and eventually settled. The employee's action is happening on **our** application — once they submit, as far as they're concerned, the claim exists.

**The problem this fixes:** the old flow called the TPA's API *first*, and only saved the claim to our own database *after* that call succeeded. If the TPA call failed for any reason outside the employee's control — a timeout, a TPA outage, an edge case (e.g. a claim raised on the very last valid day of a policy) — the claim was **never stored anywhere**, even though the employee had successfully completed every step on our side. There was no record, no claim number, nothing to retry from. The employee had to be told to try again, with no visibility into why it failed.

This is a reliability problem, not a business-logic problem: our own application must never lose an employee's claim because a downstream partner's API had a bad moment.

**Scope note:** this same failure mode exists at TWO points in the claim journey — **intimation** (raising the claim) and **submission** (the later step where bills/documents/bank details are sent to the TPA, for MULTI-flow TPAs like FHPL/Health India). Both are now covered by this fix — see §8.

---

## 2. Goals

1. **Never lose a claim.** Once an employee submits, the claim is saved in our database immediately and unconditionally — before any TPA call is attempted.
2. **Deliver to the TPA reliably, not synchronously.** TPA delivery happens in the background, with automatic retries, instead of blocking the employee's request or risking total data loss on a single failed attempt.
3. **Bounded retries, not infinite ones.** A claim that can't be delivered after a few attempts is flagged for manual follow-up ("fix it with the TPA later"), not retried forever.
4. **Full traceability.** Support/ops must be able to see exactly what we intended to send the TPA, and — when something fails — exactly what request was attempted, without having to reverse-engineer internal templating logic.
5. **No regression for the employee.** The submission experience (validation, error messages for missing/invalid fields) must feel identical to before — only the TPA network call moves to the background.

---

## 3. Problem Statement (Before)

```
Employee submits claim
        ↓
Call TPA API synchronously
        ↓
   TPA call fails? ──Yes──▶ Claim is LOST. Nothing saved. Employee sees a generic error.
        │
        No
        ↓
Save claim to our DB
```

Real-world trigger: an employee raised a claim on the last day their policy was valid. The TPA's API rejected/timed out on that specific edge case. Because our own save happened *after* the TPA call, the claim simply vanished — no claim number, no record, no way to retry without the employee resubmitting from scratch (which, by the next day, they could no longer even do, since the policy had lapsed).

---

## 4. Solution (After)

```
Employee submits claim
        ↓
Validate input (unchanged — same field checks, same error messages)
        ↓
Save claim to our DB immediately (status: "CLAIM INTIMATION" — received by us)
        ↓
Queue a TPA-delivery job (full payload snapshot, ready to replay)
        ↓
Return success to employee: "We've received it — TPA delivery is in progress"
        ↓
  ── (background, decoupled from the employee's request) ──
        ↓
Scheduler picks up the job every 2 minutes
        ↓
Attempt TPA delivery
        ↓
   Success? ──Yes──▶ Advance claim status (INTIMATED / PENDING) + store TPA's claim reference
        │
        No
        ↓
   Retries left? ──Yes──▶ Leave PENDING, retry next tick (up to 3 attempts total)
        │
        No
        ↓
   Mark job FAILED — claim record still exists, safe for manual TPA follow-up
```

The claim is **never** lost. The only thing that can now fail is *delivery timing* to the TPA — which is retried automatically, and falls back to a clearly-flagged manual-follow-up state rather than silent data loss.

---

## 5. High-Level Data Flow (tables involved)

```
User submits Claim Intimation
        ↓
Policy / employee / dependent / hospital details are identified
   (policy, policy_enrollment_employee, policy_enrollment_dependent,
    mstr_hospital, mstr_hospital_address)
        ↓
Check the policy's TPA configuration
   (policy_tpa_map → gives policyTpaId)
        ↓
tpa_external_feature_config
   (filtered by policyTpaId + api_type='INTIMATE_CLAIM' → one row, e.g. id=1 "ISBS Claim Intimation")
        ↓
Get mstr_ext_application_ref using app_ref_id
   (gives the "appKey" — e.g. id=10 "isbs-claim-intimate" — and the TPA's URL/auth config)
        ↓
Build the canonical dynamicFields object (our own field names, from the tables above + the employee's form input)
        ↓
Claim saved to policy_claim (status: CLAIM INTIMATION) + policy_claim_audit, in the SAME transaction as:
        ↓
claim_tpa_submission_job created (status: PENDING) — the delivery queue row
        ↓
   ── request returns to the employee here — everything below is background ──
        ↓
Scheduler (every 2 min) calls ibp-service's internal processor for each PENDING job
        ↓
ibp-service calls document-service's generic TPA proxy (POST /external-app-sso/magic-url)
        ↓
document-service loads mstr_ext_application_ref again (URL, auth type, payload template)
        ↓
tpa_payload_field_mapping (admin-configurable — currently unused for claims; dynamicFields covers all fields today)
        ↓
Map dynamicFields → TPA's own field names via the DB-stored payload template (e.g. hospitalCity → clmCity)
        ↓
Build the final, TPA-shaped payload (adds TPA static credentials from config)
        ↓
Call the real TPA API
        ↓
mstr_ext_app_response_mapping maps the TPA's response back to our standard fields (e.g. ISBS's ccn → TPA_CLAIM_REF)
        ↓
Success → policy_claim status advances (INTIMATED/PENDING), tpa_claim_no stored, tpa_claim_data updated
Failure → claim_tpa_submission_job retried (up to 3x) or marked FAILED for manual follow-up
```

Full technical detail (every table, every field's source, every code path) is in the companion TRD: `Claim-Intimation-TPA-Reliability-TRD.md`.

---

## 6. Scope

### In scope
- `intimateClaim` (claim intimation) — full redesign to persist-first, deliver-async.
- New `claim_tpa_submission_job` table — the delivery queue.
- New scheduler (`ClaimTpaSubmissionScheduler`) polling every 2 minutes, bounded to 3 attempts per job.
- Crash recovery for jobs stuck mid-delivery (e.g. ibp-service restarted mid-attempt).
- System-level authentication for the background job's call to document-service (a background job has no live employee session token).
- Full audit trail: both "our own payload" and "TPA-bound payload" stored per claim, plus the exact resolved/final request (including TPA secrets) captured on every delivery attempt for support/debugging.
- Fix: `policy_claim.policy_number` was incorrectly storing the internal DB row ID instead of the actual insurer policy number.
- Frontend: Claims Corner's status label and "Submit Claim" button visibility updated to account for the new `CLAIM INTIMATION` interim status — see TRD §8.
- Frontend: Claims Corner now has a manual refresh action (top of page) since the page has no live polling.
- Scheduler: `FAILED` jobs auto-resurrect after a 24h cooldown, since static TPA config is always re-fetched fresh and may have been corrected in the meantime — see TRD §4.3.1.
- The "Claim Intimation Confirmation" email now fires once the TPA has genuinely accepted the claim, not immediately on DB save — see TRD §12.

- `submitClaim` (the later "submit bills/documents" step) — now gets the identical async-delivery treatment as intimation. See §8 (updated).

### Out of scope (explicitly deferred)
- Document fetching for single-call TPA flows (`getDocumentAsBase64`) is still synchronous at *intimation* time — if fetching a document itself fails, the claim intimation still fails before the DB write. Different root cause than the original problem; not addressed in this pass. (Submission-time document fetching, by contrast, IS now deferred to delivery time — see §8.)
- Admin UI for configuring `tpa_payload_field_mapping` for claims specifically (the mechanism already exists and works for other features — just has no claim-specific rows configured yet).
- Claims Corner dashboard counts (`deriveClaimStatusCounts`) don't yet classify the new interim statuses (`CLAIM INTIMATION`, `CLAIM BILLS PENDING`) into "in progress" — they're currently counted in `total` only. Minor, cosmetic, not addressed in this pass.

---

## 7. Success Criteria

- A TPA outage or timeout during claim intimation results in a **saved claim** with a **PENDING/queued** delivery job — never a lost submission. ✅ Verified live.
- The employee sees a clear "received, delivering in background" message instead of a generic failure. ✅ Implemented.
- A claim that fails all 3 delivery attempts is visible in `claim_tpa_submission_job` with `status = FAILED` and a human-readable `last_error`, ready for manual TPA follow-up. ✅ Verified live (real ISBS validation rejection observed).
- Every delivery attempt (success or failure) leaves behind the exact resolved request that was sent/attempted, so support can either confirm what happened or manually replay it against the TPA. ✅ Verified live (see TRD §9).
- The employee-facing claim status never displays as ambiguous "Pending" while delivery is still in progress, and cannot see a "Submit Claim" action before the TPA has genuinely accepted the claim. ✅ Implemented (TRD §8).

See TRD §9 ("Live Verification Log") for the specific evidence backing each item above.
