# Policy Endorsement Member Upload — PRD

**Doc type:** `policy_endorsement_member_upload`
**Cron:** every 2 minutes
**Status:** implemented

## Problem & Goals

Today, the Endorsement Data Upload screen (Step 1 of the endorsement wizard) locks as soon as Step 2 (Create Endorsement) is complete, and every upload path eventually feeds premium/choice calculations. There is no supported way to add member records to an already-acknowledged policy without either reopening the whole endorsement or risking a premium recalculation.

**Goals:**

- Let a company submit employee + dependent data for a policy **after** Step 4 (Insurer Acknowledgement) is complete.
- Reuse the existing Endorsement Data Upload UI rather than building a new screen.
- Land captured data in the same core tables (`policy_enrollment_employee`, `policy_enrollment_employee_policy_map`, `policy_enrollment_dependent`) other enrollment flows use, so it stays queryable/reportable the same way.
- Guarantee the policy's premium is never affected by this flow.

## Non-Goals

- No `PolicyEmployeeEnrollment` / `PolicyEmployeeEnrollmentChoice` records are created — no premium or benefit-choice data.
- No member **deletions** — a row with intake type "deletion" is rejected outright.
- No IBP login/user account creation for newly added employees (see [Risks](#risks--open-questions)).
- No recalculation of the endorsement's `netPremium`/`grossPremium` under any circumstance.

## User Stories

- As an HR/Ops admin, once the insurer has acknowledged an endorsement, I want Step 1 to become editable again so I can add member data without creating a whole new endorsement.
- As an HR/Ops admin, I want a clearly-labeled "Member Data Upload" option in the Data Type dropdown — but only once it's actually safe to use (post-acknowledgement) — so I don't accidentally pick it too early.
- As an HR/Ops admin, after uploading a file under this option, I want the system to validate and enroll employees/dependents automatically, the same way other uploads report progress.
- As an HR/Ops admin, I want specific per-row error feedback (bad relation, invalid age, unsupported intake type) so I can fix and re-upload instead of guessing what failed.

## UI Behavior

| Trigger | Behavior |
|---|---|
| Step 4 (`receiveInsurerAcknowledgement.isCompleted`) becomes `true` | Step 1 form fields unlock (`disableAllFields` flips back to `false`), even though Step 2 already completed with `stepOrder >= 2`. |
| Step 4 complete | "Member Data Upload" option appears in the Step 1 Data Type dropdown. |
| File selected under "Member Data Upload" | Same upload mechanics as every other Data Type: file goes to org-service, then registers against the policy — no new UI, no new upload widget. |
| Cron finishes processing | Existing "Endorsement Uploaded Data Table" (Total / Success / Failed cards + batch table) shows results — reused as-is, no changes needed here. |

## Acceptance Criteria

- Step 1 is read-only while Step 4 is incomplete and Step 2 is done (unchanged prior behavior).
- Step 1 becomes editable the moment Step 4 completes, regardless of Step 2's status.
- "Member Data Upload" is absent from the Data Type dropdown until Step 4 completes; present after.
- A valid file (correct headers, valid rows) results in matching employee/dependent/map rows appearing in the database within one cron cycle (≤ 2 minutes) of upload.
- A row with an unconfigured relation (e.g. "Parent" when not enabled on the policy), an unsupported intake type ("deletion"), an out-of-range age, or a missing required field is rejected with a specific reason in the generated error file — the rest of the file still processes.
- No endorsement's `netPremium`/`grossPremium` changes as a result of any Member Data Upload, regardless of file contents.

## Risks & Open Questions

**No login account for new employees.** This flow writes `policy_enrollment_employee` directly — it does not create a `users`/`roles` row the way the standard enrollment upload does. If a company expects newly added members to also get IBP portal access, that's not covered here and needs a decision.

**Strict, fail-closed relationship validation.** If a policy's live configuration can't be loaded, or has zero enabled relationships, the **entire upload** is rejected rather than partially processed. This was a deliberate choice ("if I don't configure Parent, strictly I won't allow it") but is worth confirming as the intended operational behavior versus a softer partial-failure mode.

**Template reuse may confuse users.** The frontend's "Download Template" button for this option reuses the same "Employee + Dependents Data with Insurance Benefits" template as the standard enrollment flow — which includes premium/choice columns this flow ignores entirely. Worth a dedicated, trimmed-down template if user confusion becomes an issue.

---
See [TRD.md](./TRD.md) for the technical implementation details.
