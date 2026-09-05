# IBP Life Events — Product Requirements Document

**Module:** LIFE-EVENTS  
**Product:** Integrated Benefits Portal (IBP)  
**Client:** IIRM  
**Stage:** 40a — Module PRD  
**Authored:** 2026-05-07  
**Audience:** Product owners, HR admins, client stakeholders, QA leads

---

This document specifies the product behavior for the **Life Events** module within the IBP using Reverse Engineering method to understand the implemented business logic. Life Events is the mechanism through which an employee updates their benefit coverage when a qualifying personal event occurs — such as marriage, childbirth, or loss of a dependent. It is the only channel available to employees for modifying their dependents outside of an open enrollment window. Anyone reading this doc cold should be able to determine what the module does, who it serves, and how to verify it is working correctly.

---

## Scope

### In scope

- Employee-initiated dependent **addition** triggered by qualifying life events (marriage, childbirth, adoption, age-based eligibility)
- Employee-initiated dependent **removal** triggered by qualifying life events (divorce, death, age limit exceeded, ineligibility)
- Policy choice selection and premium recalculation following dependent changes
- Supporting document upload and association with a life event request
- Activity logging for audit trail on every submitted request
- Access control: only employees who have completed enrollment on at least one policy (any type — GMC, GPA, GTL, etc.) can access this module
- **Endorsement creation on submission** — every submitted life event creates an Endorsement record in the existing 6-step Endorsement workflow, which the Service Team then progresses
- **Email notifications** to the employee on submission and on every endorsement status change; emails to HR when an HR Email is configured at the company level (Contacts module)
- **Life Events history screen** — a sub-menu under Life Events listing the employee's submitted requests with their current endorsement status, plus a read-only drill-down stepper showing the 6-step Endorsement progress

### Out of scope

- Open enrollment flows (separate module)
- Dependent edits outside a life event context
- Policy creation or modification
- Claims or wellness modules
- Batch/bulk dependent updates
- The HR Admin's own UI surface for submitting and tracking life events on behalf of employees — this lives in the **HR Portal**, which is yet to be developed and will have its own PRD. When that PRD is published, it must be linked from this PRD as a sibling reference.
- The 6-step Endorsement progression itself (Service Team workflow in iwork) — Life Events is the producer of the endorsement record; the Endorsement module owns the lifecycle.
- The visual email template / copy — deferred to a separate decision (see open question on email content)
- The internal structure of the company-level Contacts module that holds the HR Email — Life Events is a consumer

---

## Flow Overview

The module has one **landing page** and one **wizard** with two flow types.

**Landing page** (`/life-events` → `LifeEventsMain`): a carousel grouping events into "Add a Dependent" and "Remove a Dependent" sections. Selecting a card determines the flow type and routes the user into the wizard. The landing page is not part of the wizard step counter.

**Addition wizard — three steps** (`ADDITION_STEP_CONFIG`):
1. Add Dependent Details (includes inline document upload)
2. Choose Components
3. Review Premium

**Deletion wizard — three steps** (`DELETION_STEP_CONFIG`):
1. Select Dependent
2. Confirm & Upload Documents
3. Review Premium

After submission, both flows show a shared success page with the request ID and submission timestamp. The success page includes a link to the Life Events history screen so the employee can immediately track the status of the request they just submitted.

**Sub-menu under Life Events** (`/life-events/history` — exact path TBD by Tech Lead): lists the employee's previously submitted life events with current endorsement status. A row drill-down opens a read-only view of the 3-step either Addition & Deletion wizard stepper for that request — no separate detail screen, the same stepper UI is reused in read-only mode.

**On submission, an Endorsement record is created** of type "addition" or "deletion" (matching the flow), linked to the employee + policy via `PolicyEmployeeEndorsement`, and handed off to the existing 6-step Service Team workflow in iwork. The IBP only mirrors the resulting status; it does not advance the steps.

---

## Implementation Status

BRs without a status marker are **Implemented**. Rules tagged `Partial` or `Not Built` are noted inline on each BR and detailed in the [Gap Register](#gap-register).

- **Reverse-engineered from code:** BR-LE-001 (and BR-LE-001b) through BR-LE-019, BR-LE-026 through BR-LE-028. Most are working; a few have defects or gaps.
- **New product decisions (this PRD):** BR-LE-020 through BR-LE-025, BR-LE-029 through BR-LE-041. None implemented yet.

---

## User Stories

The following stories are traced to use cases and functional requirements derived from the existing implementation. MODULE code is **LE**.

---

### Access & Eligibility

**US-LE-001** — As an **employee**, I want to see the Life Events section only when I have completed enrollment on at least one policy (regardless of policy type), so that the feature is not accessible before I have any active coverage to modify.

- Traces to: UC-ACCESS-01 / FR-ACCESS-01

**US-LE-002** — As an **employee**, I want each life event card to display whether I am eligible to use it, so that I do not attempt a flow I cannot complete.

- Traces to: UC-ACCESS-02 / FR-ELIG-01

---

### Addition Flow

**US-LE-003** — As an **employee**, I want to add a new dependent to my coverage after a qualifying event (marriage, childbirth, adoption, age eligibility), so that my family member receives the benefits they are entitled to.

- Traces to: UC-ADD-01 / FR-ADD-01

**US-LE-004** — As an **employee**, I want to enter the dependent's personal details (name, relationship, gender, date of birth) in a guided form, so that the system can validate and record accurate dependent information.

- Traces to: UC-ADD-02 / FR-ADD-02

**US-LE-005** — As an **employee**, I want to select the policy components (benefit choices) to assign to my new dependent, so that the coverage level is explicitly chosen rather than defaulted silently.

- Traces to: UC-ADD-03 / FR-ADD-03

**US-LE-006** — As an **employee**, I want to review the updated annual and monthly premium before submitting, so that I can make an informed decision before the change is locked in.

- Traces to: UC-ADD-04 / FR-ADD-04

**US-LE-007** — As an **employee**, I want to upload supporting documents (e.g., marriage certificate, birth certificate) inline while entering dependent details, so that the HR team has proof of the qualifying event.

- Traces to: UC-ADD-05 / FR-DOC-01
- Note: In the addition flow, document upload is part of the Dependent Details step (not a separate step). The wizard has three steps total: Add Dependent Details, Choose Components, Review Premium.

---

### Removal Flow

**US-LE-008** — As an **employee**, I want to remove an existing dependent after a qualifying event (divorce, death, age limit, ineligibility), so that coverage and premiums reflect the current household accurately.

- Traces to: UC-DEL-01 / FR-DEL-01

**US-LE-009** — As an **employee**, I want to select which enrolled dependent(s) to remove, filtered by the life event's eligible relationship types, so that I only see relevant options and cannot accidentally remove the wrong person.

- Traces to: UC-DEL-02 / FR-DEL-02

**US-LE-010** — As an **employee**, I want to upload proof documents for the removal event (e.g., divorce decree, death certificate) on a dedicated step, so that the request is substantiated for HR review.

- Traces to: UC-DEL-03 / FR-DOC-02
- Note: In the deletion flow, document upload is its own step. The wizard has three steps total: Select Dependent, Confirm & Upload Documents, Review Premium.

**US-LE-011** — As an **employee**, I want to see a clear, irreversible-action warning before confirming a removal, so that I am not surprised by a change that cannot be undone.

- Traces to: UC-DEL-04 / FR-DEL-03

---

### Submission & Confirmation

**US-LE-012** — As an **employee**, I want to receive a unique request ID and submission timestamp on the success screen, so that I have a reference for follow-up with HR.

- Traces to: UC-SUB-01 / FR-SUB-01

**US-LE-013** — As an **HR admin** (via audit trail), I want every submitted life event to be logged with the event type, dependent names, policy names, and request ID, so that I can audit and trace changes without asking the employee.

- Traces to: UC-AUDIT-01 / FR-AUDIT-01

---

### Notifications & Status Tracking

**US-LE-014** — As an **employee**, I want to receive an email when I submit a life event and again whenever its endorsement status changes, so that I know my request was received and I can follow its progress without logging in.

- Traces to: UC-NOTIFY-01 / FR-NOTIFY-01

**US-LE-015** — As an **HR contact** (when an HR Email is configured at the company level), I want to receive a copy of the same notifications the employee receives, so that I can stay aware of life-event activity without polling the system.

- Traces to: UC-NOTIFY-02 / FR-NOTIFY-02

**US-LE-016** — As an **employee**, I want a "History" sub-menu under Life Events that lists my previously submitted requests with their current status, so that I can see at a glance where each request stands.

- Traces to: UC-HIST-01 / FR-HIST-01

**US-LE-017** — As an **employee**, I want to drill into any submitted life event from the history list and see a read-only view of the 6-step endorsement progress, so that I understand exactly which stage my request is at.

- Traces to: UC-HIST-02 / FR-HIST-02

**US-LE-018** — As an **HR admin** logged into the IBP as an employee, I want to see only my own life-event requests in the history view, just like any other employee, so that role separation is clear. (When the HR role is active in the HR Portal, the same person sees company-wide endorsement activity through the Endorsement module — out of scope for this PRD; covered in the forthcoming HR Portal PRD.)

- Traces to: UC-HIST-03 / FR-HIST-03

---

### Drafts (Save & Resume)

**US-LE-019** — As an **employee** filling in a life event, I want to save my partial progress as a draft and exit, so that I don't lose work if I'm interrupted or need to gather more documents.

- Traces to: UC-DRAFT-01 / FR-DRAFT-01

**US-LE-020** — As an **employee** with a saved draft, I want to resume it from where I left off the next time I open Life Events, so that I don't have to redo any work.

- Traces to: UC-DRAFT-02 / FR-DRAFT-02

**US-LE-021** — As an **employee** with a saved draft, I want a clear warning if I try to start a different life event, so that I don't accidentally lose the work in my draft and so the system can't end up with conflicting concurrent requests.

- Traces to: UC-DRAFT-03 / FR-DRAFT-03

---

## Business Rules

The rules below govern eligibility, validation, and calculation. They are derived directly from the implemented logic and must be preserved in any future change.

---

**BR-LE-001 — Policy eligibility gate: Life Events is disabled until enrollment is locked**  
Life Events is a generic feature: it applies to any policy type (GMC, GPA, GTL, or any other), because different companies offer Life Events on different product lines. The only gate is enrollment completion. Specifically, the route guard requires at least one policy in the user's `enrolledPolicies` list with `isEditable = false`. Policies that are still editable (the user is in an open enrollment window and has not yet locked their selections) do not satisfy the gate.

**In effect, this means Life Events is disabled for a policy for as long as its open enrollment window is still active.** Only once enrollment closes and the policy's selections are locked (`isEditable` flips to `false`) does that policy start satisfying the gate. An employee with only editable (in-progress-enrollment) policies sees no usable Life Events access at all — this is the same rule as above, restated from the "when is it disabled" angle for clarity.

Policy-type-specific behavior — for example, which life events are exposed for which policy type — must be expressed through the policy's configuration (enabled relationships, components, capacity), not by hardcoding policy types into Life Events itself.

---

**BR-LE-001b — Expired policies are excluded from Life Events eligibility** `Partial`  
A policy that has passed its own end date (`policyTo` in the past, i.e. the policy term itself has expired) does not count toward Life Events eligibility and is excluded from the set of policies an employee can add/remove dependents against, even if that policy would otherwise satisfy BR-LE-001's `isEditable = false` gate.

This is currently enforced only inside the wizard's own policy-source filtering (the frontend computes `effectiveLifeEventChoicePolicySources` by filtering `state.policyData.relationDependentData` down to policies where `isEditable === false` **and** the policy is not expired), not at the route-guard/landing-page level (BR-LE-001's gate check does not itself re-verify expiry — see Gap Register). The practical effect today is: an employee whose *only* eligible-looking policy (`isEditable = false`) has actually expired may still pass the coarse route gate and land on the Life Events carousel, but will find no usable policy source once they reach the wizard step that applies this filter.

**Why:** an expired policy's coverage has already ended — adding or removing a dependent against it has no real-world effect and would create an Endorsement against a policy the Service Team can no longer action through the normal insurer/TPA channels.

**BR-LE-002 — Life event card eligibility**  
A life event card is shown as eligible only when at least one of its `requiredRelationships` satisfies the applicable flow rule (BR-LE-003 for addition, BR-LE-004 for deletion). Cards that fail this check are rendered with a "Not Eligible" badge and cannot be selected.

**BR-LE-003 — Addition capacity rule**  
A relationship type is eligible for addition if and only if:
1. It is enabled in the policy configuration, AND
2. The employee's current dependent count for that relationship type is less than `maxCount` defined in the policy.

Example: If a policy allows max 2 children and the employee already has 2, the "Child Birth" card is ineligible.

**BR-LE-004 — Deletion eligibility rule**  
A relationship type is eligible for deletion if and only if at least one enrolled dependent with that relationship type exists on the employee's policy.

**BR-LE-005 — Capacity is governed solely by policy configuration**  
There is no hardcoded singleton rule for any relationship type — including spouse/partner. Whether an employee can add another spouse, child, or parent is determined entirely by the policy's `enabledPolicyRelations[].maxCount`. If `maxCount` is missing or non-numeric in the policy config, capacity is treated as unlimited (`Infinity`).

For spouse/partner enforcement to be a true singleton, the policy configuration must explicitly set `maxCount = 1` for the spouse-group relation. This is **the responsibility of the Policy Configurations module** (the place where policies are authored), not Life Events.

**Decision (intentional):** Life Events does not add a defensive singleton check, even though spouse/partner is universally singleton in real-world usage. The product position is that all relationship counts and per-relationship validations are driven by the policy configuration; embedding relationship semantics in Life Events would split the source of truth and make it harder to reason about behavior. If a policy is authored without `maxCount = 1` for spouse, the resulting permissive behavior is a configuration defect — caught and corrected at the Policy Configurations layer, not patched over in Life Events.

**BR-LE-006 — Gender-based relationship filtering**  
Relationship options in the dependent form are filtered based on the employee's gender:
- Male employees do not see "wife" as a selectable option (system uses "spouse").
- Female employees do not see "husband" as a selectable option (system uses "spouse").
- Mismatch entries are rejected at form validation.

**BR-LE-007 — Relationship alias normalization**  
The system resolves relationship names through alias groups before applying eligibility logic:
- Spouse group: `spouse`, `wife`, `husband`, `partner`, `spouse/partner`
- Parent group: `parent`, `parents`, `father`, `mother`
- Child group: `child`, `children`, `son`, `daughter`

A policy enabling "children" implicitly enables "son" and "daughter".

**BR-LE-008 — Dependent deduplication across policies**  
An employee enrolled in multiple policies may have the same dependent on each. The system deduplicates dependents using the fingerprint: `name | relationship | gender | date-of-birth`. Each unique combination appears only once in the dependent selection UI.

**BR-LE-009 — Compulsory choices are auto-selected**  
Policy components marked as `section: "compulsory"` are pre-selected and cannot be deselected by the employee. Optional components require an explicit selection.

**BR-LE-010 — Relationship-group policy refresh**  
For policies flagged as `isRelationshipGroup = true`, the premium and available choices must be re-fetched from the backend whenever the dependent selection changes. The UI must not show stale pricing during this recalculation.

**Failure handling — hard block:** if the refresh call (`endPoints.policyConfigurationByDependents`) fails (network error, non-2xx response, timeout), the wizard must **block forward navigation** at the current step and surface an error message: *"We couldn't recalculate your premium. Please try again."* The Next / Submit button is disabled until a subsequent refresh succeeds. The user may **Retry** (re-issues the same request) or navigate **Back** to change their dependent selection. Stale pricing must never be used as a fallback at submission time, because the difference between a stale family bucket and the true bucket can amount to thousands of rupees, and the user would be locked into the wrong premium without consent.

This rule applies at every refresh trigger — not just the final Review Premium step.

**BR-LE-011 — Document file constraints** `Partial`  
- Accepted formats: PDF, JPG, PNG only.
- Maximum file size: **5 MB per file in both the addition and deletion flows.** Both flows must enforce the same limit and surface the same toast copy ("Please upload PDF, JPG, or PNG files up to 5 MB only."). The current code's 10 MB allowance in the addition flow is a defect against this rule and must be reduced to 5 MB.
- At least one document is required before submission in both flows.

**BR-LE-012 — Deletion is irreversible**  
A dependent removal submission cannot be undone through the IBP. The employee must be shown a prominent warning before confirming. The warning must use language that makes the permanence unambiguous.

**BR-LE-013 — Premium calculation: per-life pricing**  
Applies when `choice.premiumPerLife = true` — each enrolled life has its own premium charge.

Addition flow:
- `Additional Premium = (number of new dependents being added) × choice premium per life`
- `New Total Premium = Current Annual Premium + Additional Premium`
- `Monthly Deduction = New Total Premium ÷ 12`

Deletion flow:
- `Premium Reduction = (number of dependents being removed) × choice premium per life`
- `Remaining Annual Premium = Current Annual Premium − Premium Reduction`
- `Monthly Deduction = Remaining Annual Premium ÷ 12`

**Review Premium screen labels:** "Additional Premium" (addition flow) / "Premium Reduction" (deletion flow).

---

**BR-LE-013b — Premium calculation: family bucket pricing (relationship-group policies)** `Partial`  
Applies when `policy.configuration.isRelationshipGroup = true`. Premium is a fixed bucket amount for a given family composition, not a per-life charge. The backend returns the new bucket price via the relationship-group refresh (BR-LE-010). The UI derives the delta — it does not compute a sum.

Addition flow:
- `New Total Premium` = backend response from BR-LE-010 refresh (the new bucket price)
- `Additional Premium = New Total Premium − Current Annual Premium`
- `Monthly Deduction = New Total Premium ÷ 12`

Deletion flow:
- `Remaining Annual Premium` = backend response from BR-LE-010 refresh (the new bucket price after removal)
- `Premium Reduction = Current Annual Premium − Remaining Annual Premium`
- `Monthly Deduction = Remaining Annual Premium ÷ 12`

**Review Premium screen labels:** "Additional Premium" (addition) / "Premium Reduction" (deletion) — same label pattern as BR-LE-013 for visual consistency.

**Family-floater edge case:** If the old and new buckets resolve to the same price (e.g., a floater that covers "1 or 2 parents" at the same rate, and only one parent is being removed), then `Additional Premium = ₹0` / `Premium Reduction = ₹0`. The Review Premium screen must display an explanatory note: *"Your premium does not change because this policy uses a family-floater pricing structure that covers up to [N] members at the same rate."* The user must understand this is expected, not a system error.

**Technical changes implied (for Tech Lead review):**

- **Code (UI)** — The Review Premium step must branch on whether the policy is `isRelationshipGroup`. For per-life policies (BR-LE-013), compute `Additional Premium = Σ (choice premium × new dependent count)` locally. For bucket policies (BR-LE-013b), derive `Additional Premium = newBucketPrice − currentBucketPrice` from the cached BR-LE-010 refresh response. No new API call is required for the bucket delta — the refresh response already carries the new total.
- **UI labels** — Apply "Additional Premium" for additions and "Premium Reduction" for deletions consistently across both policy types. No other label changes.
- **API / Database** — No changes.

---

**BR-LE-014 — Endorsement creation on submission**  
Every successful Life Event submission creates a record in the existing **Endorsement** module ([endorsement.entity.ts](apps/services/service-lib/src/lib/entities/endorsement.entity.ts)) and links it to the employee via [policy-employee-endorsement.entity.ts](apps/services/service-lib/src/lib/entities/policy-employee-endorsement.entity.ts). The created record carries:

- `endorsementType` = `"addition"` for the addition flow, `"deletion"` for the deletion flow.
- `policyId`, `companyId`, `endorsementEffectiveDate`, and counters (`employeeEndorsementAdditionCount` / `employeeEndorsementDeletionCount`) populated from the submitted payload.
- `currentEndorsementStep` initialized to step 1 (`endorsementRequestReceived`).
- `endorsementStatus` initialized to the workflow's starting status (typically `"Pending Acknowledgement"`).

For deletion-flow submissions, the link uses the `deletionEndorsementId` field on `PolicyEmployeeEndorsement`; for addition-flow submissions, the `endorsementId` field. Both can be valid concurrently, allowing a single employee+policy pair to have an in-flight addition and an in-flight deletion at the same time.

**Why:** Life Events is the producer of endorsement records; the Service Team owns the lifecycle via the existing iwork workflow. Reusing the established Endorsement module avoids creating a parallel queue and ensures that all downstream concerns (insurer dispatch, TPA upload, brokerage tracking) work without modification.

---

**BR-LE-015 — Status mirror (Life Events is a read-only consumer of endorsement state)** `Partial`  
After the Endorsement record is created at submission time (BR-LE-014), Life Events does not write to the endorsement again. The IBP UI surfaces:

- The endorsement's `endorsementStatus` (one of: `"Pending Acknowledgement"`, `"Pending TPA Upload"`, `"Acknowledged"`, `"Processed"` — values from `ENDORSEMENT_STATUS` in [iwork constants](apps/ui/iwork/src/app/constants/index.ts)).
- The endorsement's `currentEndorsementStep` (1–6, mapped to a label from `ENDORSEMENT_STEP_KEYS`: `endorsementRequestReceived`, `createEndorsement`, `sendEndorsementToInsurer`, `receiveInsurerAcknowledgement`, `clientConfirmation`, `tpaIdUpload`).

Status transitions, step advancements, file uploads to the insurer, TPA acknowledgements, and client confirmations are all written by the iwork-side Service Team flows and are out of scope for this module.

---

**BR-LE-016 — Email notification triggers** `Backend only`  
Emails are sent in two cases:

1. **On submission** — when a Life Event is submitted (i.e., the Endorsement record is created per BR-LE-014).
2. **On every endorsement status change** — whenever `endorsementStatus` changes and on every `currentEndorsementStep` advancement.

There is no batching, no opt-out, and no quiet hours in v1.

---

**BR-LE-017 — Email recipients** `Backend only`  
For every email triggered by BR-LE-016:

- **The submitting employee** is always a recipient.
- **The HR contact** is added as a recipient only if an HR Email is configured at the **company level** in the **Contacts module**. If the company has no HR Email configured, no HR copy is sent (this is a valid configuration, not an error).

The HR Email is a single address sourced from the company-level Contacts module. Distribution-list or multi-recipient HR routing is out of scope for v1.

---

**BR-LE-018 — Life Events history sub-menu** `Not Built`  
A new sub-menu under Life Events lists the submitting employee's life-event requests (both addition and deletion flows). Each row displays the request's current status, mirrored from the linked Endorsement record per BR-LE-015. The exact column set is defined by the Tech Lead in the TRD; the only invariants required at the PRD level are that **`Current Status`** and a **stable identifier (Request ID)** be visible, and that the list is sorted with the latest submission first.

The success page rendered after submission must include a link that navigates to this history sub-menu, so the user can immediately track the request they just submitted.

---

**BR-LE-019 — Drill-down: read-only stepper view** `Not Built`  
Selecting a row in the history list opens a **read-only** view of the same 6-step Endorsement stepper used by the Service Team in iwork. No separate detail screen, no additional UI components — the existing stepper is reused with all interactive controls disabled. The view shows:

- All 6 steps from `ENDORSEMENT_STEP_KEYS` in their canonical order.
- The current step highlighted, prior steps marked complete, later steps shown as upcoming.
- The current `endorsementStatus` and any associated metadata exposed by the stepper.

The employee cannot upload, edit, advance, or comment from this view. Read-only enforcement applies regardless of the employee's role — even if the same user has HR permissions in the HR Portal, the IBP-side history view remains read-only.

---

**BR-LE-020 — Save Draft action** `Not Built`  
A **Save Draft** button is available on every step of both the addition and deletion wizards. Clicking it persists the current wizard state (selected event, partial dependent details, selected choices, uploaded document IDs, current step index) to a server-side draft store and exits the wizard back to the Life Events landing page. The Save Draft action does not validate the partial data — it accepts whatever the user has filled in so far.

---

**BR-LE-021 — Server-side draft storage and singleton constraint** `Not Built`  
Drafts are stored in a server-side data store (entity name TBD by Tech Lead — e.g., `LifeEventDraft`) keyed by `employeeId`. **At most one draft per employee can exist at any time across both addition and deletion flows.** This singleton constraint is the IBP's policy, not a database limit, and matches the industry-standard pattern (Workday, SAP SuccessFactors, Gusto, bswift) of single-threaded life-event handling.

The draft record carries enough information to reconstruct the wizard exactly: flow type, selected life-event id, current step index, dependent form values, selected choice ids, dependent-to-choice mapping, and the list of uploaded `documentIds`. The draft also references the `policyId` on which the life event is being submitted.

---

**BR-LE-022 — Draft lifetime tied to policy period** `Not Built`  
A draft is bound to the policy on which it was started. The draft is automatically discarded by a scheduled cleanup job when the policy reaches its end date (policy expiry / renewal). Drafts do not roll over to a new policy term.

A draft is also discarded when:
- The user **submits** the life event (the draft is consumed and replaced by the submitted Endorsement record per BR-LE-014).
- The user **explicitly discards** the draft via the Resume / Discard banner (BR-LE-024) or the second-event warning (BR-LE-023).

There is no time-based auto-expiry independent of policy period; a user who returns to a draft six months later will still see it as long as the policy is still active.

---

**BR-LE-023 — Single-draft enforcement on second-event attempt** `Not Built`  
If an employee has an existing draft and initiates a different life event from the carousel, a **warning dialog** is shown:

> *"You have a saved draft for [Life Event Title]. Continue with the existing draft, or discard it to start a new one."*

The dialog has two actions:
- **Continue Draft** — closes the dialog and routes the user into the existing draft (skipping the carousel selection).
- **Discard & Start New** — deletes the existing draft (per BR-LE-025 file cleanup), then proceeds with the new life event the user selected.

Because of BR-LE-021's singleton constraint, the user cannot bypass this dialog to create a second draft.

---

**BR-LE-024 — Draft resume banner on landing page** `Not Built`  
When an employee navigates to the Life Events landing page (`/life-events`) and a draft exists for them, a **banner** is rendered at the top of the page:

> *"You have a saved draft for [Life Event Title] — [Resume Draft] [Discard]"*

- **Resume Draft** — opens the wizard at the saved step with all previously entered values restored.
- **Discard** — deletes the draft (per BR-LE-025 file cleanup) and dismisses the banner; the carousel remains usable.

The banner does not block the rest of the page; the user can browse the carousel or open the History sub-menu without acting on it. If the user starts a new life event from the carousel without first acting on the banner, BR-LE-023's warning dialog fires.

---

**BR-LE-025 — Document lifecycle in drafts** `Not Built`  
Files uploaded during a draft's lifetime have their returned `fileId` stored on the draft record. Behavior:

- **On Resume** — the previously uploaded files are visible in the wizard exactly as they were when saved. The user can keep them, replace them, or remove them.
- **On Discard** (whether via banner, second-event warning, or via the Discard control inside the wizard) — a background job cleans up the file records that were referenced only by the draft (no other entity holds them).
- **On Policy expiry / renewal** (BR-LE-022 cleanup) — the same file cleanup applies.
- **On Submit** — the `documentIds` transfer with the submission payload to the Endorsement record (per BR-LE-014). The draft is consumed; files now belong to the endorsement and must not be cleaned up.

---

**BR-LE-026 — Age constraints driven by policy configuration** `Partial`  
Per-relationship age constraints (`minAge`, `maxAge`) are sourced **exclusively** from the policy's `configuration.relationships.enabledPolicyRelations[*]` entries. Life Events does not hardcode defaults; if the policy configuration omits an age range for a relationship, no age check is enforced for that relationship.

**UI behavior (front-line validation):**

- The Dependent Details form reads `minAge` / `maxAge` for the selected relationship via the existing helper `getAgeConstraintsForRelationship` ([LifeEventsDependentManagement.tsx:855](apps/ui/ibp/src/app/pages/LifeEvents/LifeEventsDependentManagement.tsx#L855)).
- When `minAge` and/or `maxAge` is defined, the DOB field shows the allowed age band as helper text (e.g., *"Age must be between 18 and 25"*).
- When the user enters a DOB whose computed age falls outside the band, the form shows an inline error (e.g., *"Age must be at most 25 for child"*) and disables the **Add Dependent** button until the DOB is corrected. The current code silently clears the DOB when relationship changes invalidate it — this defensive behavior remains, but the inline error is added so the user understands why.
- If the relationship changes after a valid DOB was entered, the existing logic re-validates: if the new relationship's bounds reject the DOB, the field is cleared and the user is informed.

**Backend behavior (defense in depth):**

- The backend re-validates against the same `minAge` / `maxAge` from the policy configuration on submit ([policy.repository.ts:28938](apps/services/policy-service/src/app/policy/policy.repository.ts#L28938) and [enrollment-upload.scheduler.ts:9057](apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts#L9057)). A submission that bypasses UI validation must still be rejected.

**Single source of truth:** the policy configuration UI (Policy Configurations module) is the only place where these constraints are authored. Life Events does not redefine them.

---

**BR-LE-027 — "Age Limit Exceeded" deletion event scope** `Partial`  
The deletion event titled **"Age Limit Exceeded"** applies *exclusively* to age-related removals — when a dependent's age has crossed the policy's `maxAge` for that relationship (e.g., son turning 25 on a policy with child max-age 25; father turning 80 on a policy with parent max-age 80).

All other eligibility-loss reasons — loss of dependency, dependent taking up alternate coverage, change in personal status, or any non-age reason — are handled by the separate **"No Longer Eligible"** deletion event.

The event's internal identifier and human-readable title must agree: both are `age_limit_exceeded`. The current divergence (where the internal `key` field reads `eligibility_change` but the `id` reads `age_limit_exceeded`) is a defect to be corrected.

**Technical changes implied (for Tech Lead review):**

- **Code (UI)** — In [apps/ui/ibp/src/app/pages/LifeEvents/constants.ts](apps/ui/ibp/src/app/pages/LifeEvents/constants.ts) within `DELETION_LIFE_EVENTS`, change the third entry's `key` from `'eligibility_change'` to `'age_limit_exceeded'` so it matches its `id`. Search the codebase for any string references to `'eligibility_change'` (UI conditionals, switch statements, lookups) and update or remove them.
- **API** — No changes. The persisted/wire value (the `id`) is already `age_limit_exceeded`; the `key` field is internal to the UI constant and is not transmitted.
- **Database** — No schema changes. Existing records that reference this event already use `age_limit_exceeded` (the `id`).
- **Migration** — None required. No historical data uses the `eligibility_change` value.
- **UI labels** — No visible changes. The card's title ("Age Limit Exceeded") and description remain as-is.

---

**BR-LE-028 — "No Longer Eligible" deletion event scope** `Partial`  
The deletion event titled **"No Longer Eligible"** covers all cases where a dependent loses a policy-defined eligibility condition that is **not purely age-based**. The event's `requiredRelationships` list intentionally includes every enrolled relationship type (spouse, son, daughter, father, mother, and aliases), because non-age eligibility conditions can apply to any relationship.

The two primary triggers, confirmed by the Policy Configuration constraints visible in the Policy Configure → Constraints screen, are:

1. **Study-status loss (Studying Son / Son Study Extension)** — A son enrolled under the "Studying Son Age Limit Extension" was permitted to remain on the policy beyond the policy's base child `maxAge` while in full-time education. When he stops studying (graduates, drops out, or the extension period runs out), his eligibility condition is gone — not his age ceiling. This is "No Longer Eligible," not "Age Limit Exceeded," even if he is still below `maxAge`.

2. **Marital-status change (Unmarried Daughter / Daughter Marital Status Change)** — A daughter enrolled under the "Unmarried Daughter Age Limit Extension" was permitted beyond the base child `maxAge` while unmarried. When she marries, she is immediately ineligible under the policy — the trigger is the change in personal status, not her age. This is the canonical "daughter gets married" use case.

3. **Any other non-age eligibility loss** — e.g., a parent or spouse gaining their own independent insurance coverage on a policy that has an "exclusive coverage" clause, or any other policy-defined condition.

**Clean distinction from "Age Limit Exceeded" (BR-LE-027):**

| Trigger | Correct event |
|---|---|
| Dependent's age > policy `maxAge` for that relationship | Age Limit Exceeded |
| Dependent's age is within bounds but a non-age condition (study status, marital status, other) is lost | No Longer Eligible |

A son who is 26 on a policy with child `maxAge` = 25 is an "Age Limit Exceeded" case. The same son who is 24 and dropped out of college on a policy with child `maxAge` = 25 but a "Studying Son Age Limit Extension" requirement is a "No Longer Eligible" case — his age is fine, but his study-status condition is not.

**The relationship list for this card must remain broad.** Narrowing it to children-only would break the spouse and parent cases. Narrowing it to "children only" would prevent a valid use case where a parent loses their dependent status. The card surface area is governed by which enrolled dependents actually satisfy the `requiredRelationships` filter at the time the card loads — not by hardcoding a narrow list.

**Technical changes implied (for Tech Lead review):**

- **Code (UI)** — No changes to the relationship filter list in the "No Longer Eligible" card — the current broad list is correct. The card's tooltip or description text should be updated (or supplemented) to include the study-extension and marital-status examples, so employees understand when to use this event vs. "Age Limit Exceeded." This is a copy/label change only.
- **API** — No changes. The event identifier `no_longer_eligible` is already correct.
- **Database** — No schema change needed for this scope decision. If a future requirement needs to record *which* condition was lost (study vs. marital vs. other), that would require an additional metadata field on the Endorsement record — deferred.
- **Policy Configuration UI** — The "Studying Son Age Limit Extension" and "Unmarried Daughter Age Limit Extension" config fields remain as-is; Life Events reads the enrolled dependent data, not these config fields directly. No change to Policy Configure.

---

**BR-LE-029 — Terminal deletion events: automatic cross-policy cascade** `Not Built`  
Three deletion events are classified as **terminal** because they reflect an irreversible real-world fact about the dependent — the underlying reality holds regardless of how many policies the dependent is enrolled on:

| Event | Terminal? | Reason |
|---|---|---|
| Dependent Death (`dependent_death`) | Yes | A deceased person cannot be on any policy |
| Divorce (`divorce`) | Yes | A divorced spouse is ineligible across all policies |
| No Longer Eligible (`no_longer_eligible`) | Yes | The ineligibility condition (study loss, marriage, etc.) applies person-wide, not per-policy |
| Age Limit Exceeded (`age_limit_exceeded`) | No | Each policy has its own `maxAge`; see BR-LE-030 |

For all three terminal events, the submission must remove the dependent from **every policy** on which they are enrolled — not just the one visible in the UI's deduplicated selection list. The employee does not choose which policies are affected; the cascade is automatic.

**Policy impact summary (required before final submit):** The deletion wizard's final confirmation screen must show a "Policy impact" section listing every affected policy by name (e.g., "This will remove [Father] from 2 policies: GMC, GPA") along with the premium change per policy. The employee reviews this summary and confirms once. No additional per-policy confirmation is needed.

**Technical changes implied (for Tech Lead review):**

- **Code (UI)** — `prepareDeletionPayload` in [index.tsx:906–939](apps/ui/ibp/src/app/pages/LifeEvents/index.tsx#L906-L939) currently marks `lifeEventAction: "DELETE"` only on the single `existingDependents` record whose `id` matches the selected row. For terminal events, change this so **all** records in `existingDependents` whose deduplication fingerprint (`name | relationship | gender | dob`, per BR-LE-008) matches the selected row are marked `lifeEventAction: "DELETE"`. The uploaded `documentIds` must be attached to every affected record.
- **UI** — Add a "Policy impact" summary section to the deletion Review Premium step (or as a sub-section before the submit button) showing each affected policy and its premium delta. Single-policy enrollments still show this section (it shows one policy) so the layout is consistent.
- **API** — The `updateEnrollmentData` PUT already receives the full `existingDependents` payload from all policies. Changing which records carry `lifeEventAction: "DELETE"` is a content change to the existing payload, not a schema change. No new endpoint required.
- **Database** — Confirm with Tech Lead whether one `PolicyEmployeeEndorsement` row is created per affected policy (e.g., two rows for GMC and GPA) or a single combined endorsement record covers all. The Endorsement entity and `PolicyEmployeeEndorsement` entity may need a many-to-one or JSON array approach for multi-policy deletions — this is a Tech Lead decision.

---

**BR-LE-030 — "Age Limit Exceeded" is policy-specific, not a cascade** `Not Built`  
The "Age Limit Exceeded" event is **not** a terminal event. Each policy defines its own `maxAge` per relationship type (via policy configuration, per BR-LE-026). When the employee submits an "Age Limit Exceeded" removal:

1. The system evaluates the dependent's age against each enrolled policy's `maxAge` for that relationship independently.
2. **Only** policies where the dependent's computed age ≥ the policy's `maxAge` are included in the removal.
3. Policies where the dependent's age is still within the allowed range are not affected by this submission and the dependent remains enrolled on those policies.

Example: a son turns 25. The GMC policy has child `maxAge` = 25 → he is removed from GMC. The GPA policy has child `maxAge` = 30 → he stays on GPA. The employee does not manually select which policies; the system applies the filter automatically based on policy configuration.

**Technical changes implied (for Tech Lead review):**

- **Code (UI)** — `prepareDeletionPayload` for `age_limit_exceeded` events should mark `lifeEventAction: "DELETE"` only on `existingDependents` records belonging to policies where `dependent.age >= policy.maxAge` for that relationship. The age and `maxAge` values are already available via `state.policyData.relationDependentData` (the policy configuration per BR-LE-026). The filtering logic is a frontend addition; no new backend call required.
- **UI** — The Policy impact summary (BR-LE-029) still applies: show which policies are affected and which are not (e.g., "This will remove [Son] from GMC. He will remain enrolled on GPA, where the age limit is 30."). This gives the employee a clear picture.
- **API / Database** — No changes. The behavior follows from the existing payload construction; the difference is only which records get the DELETE flag.

---

**BR-LE-031 — Event Date and Effective Date: two distinct fields in the addition flow** `Not Built`  
The addition wizard captures two separate dates, which serve different purposes:

| Field | What it captures | Who sets it | Used for |
|---|---|---|---|
| **Event Date** | The date the qualifying life event occurred (e.g., wedding date for Marriage, adoption finalization date for Adoption, eligibility start date for Age-Dependent Addition) | Employee — mandatory input | Audit trail, HR/Service Team review, stored on the Endorsement record |
| **Effective Date** | The date from which the new dependent's coverage begins on the policy | System — automatically set to the submission timestamp, **read-only**, not editable by the employee | Backend pro-rata premium calculation, age-band resolution |

**For Child Birth and Adoption:** the child's date of birth (already collected in the Dependent Details form) serves as the Event Date. No separate Event Date input is needed for these two events — the DOB field carries both meanings.

**For all other addition events** (Marriage, Age-Dependent Addition): a dedicated "Event Date" input is required in the Dependent Details step, positioned alongside the DOB field. The label must clearly read "Event Date" (not "Effective Date") to avoid confusion with the system-set field.

The employee is responsible for submitting promptly after the qualifying event. No retroactive backdating of the Effective Date is supported. If an employee submits weeks after the event, the system uses the submission date as the Effective Date — and the pro-rata calculation and coverage start reflect that submission date.

**Technical changes implied (for Tech Lead review):**

- **Code (UI)** — Add an "Event Date" input to the Dependent Details step ([LifeEventsDependentManagement.tsx](apps/ui/ibp/src/app/pages/LifeEvents/LifeEventsDependentManagement.tsx)) for Marriage and Age-Dependent Addition events. For Child Birth and Adoption, skip this field (DOB = Event Date). Show "Effective Date: [today's date]" as a read-only label on the same form.
- **API** — Add `eventDate` (ISO date string) to the dependent payload sent via `endPoints.updateEnrollmentData`. The existing `effectiveDate` field in the DTO already defaults to `new Date()` at the backend — this behavior is correct and intentional; no backend change needed for `effectiveDate`.
- **Database** — A new `eventDate` column is needed on the Endorsement entity (or as a field within the dependent payload stored against the endorsement) to persist the event date for audit and HR review. Tech Lead to determine the exact entity and column.
- **UI (form)** — Event Date input bounds: not in the future; not before the current policy period start date. Validation error if the employee enters a future date.

---

**BR-LE-032 — Review Premium screen: show employee contribution, before and after** `Partial`  
The Review Premium screen must display the **employee's own premium contribution** — the share of the total policy premium that is deducted from the employee's salary. This is distinct from the full policy premium, which includes the employer's contribution.

The screen must show, for each affected policy:

| Line item | Addition flow | Deletion flow |
|---|---|---|
| **Before** | Current employee contribution (annual) | Current employee contribution (annual) |
| **After** | New employee contribution after adding the dependent (annual) | New employee contribution after removing the dependent (annual) |
| **Change** | **Additional Premium** = After − Before (positive) | **Premium Reduction** = Before − After (positive) |
| **Monthly** | New monthly deduction = New annual ÷ 12 | New monthly deduction = New annual ÷ 12 |

The "Additional Premium" and "Premium Reduction" labels refer to the **employee contribution delta**, not the full policy premium delta. The employer's share changes in parallel but is not displayed to the employee.

For the current policy year, the employee's first deduction will be pro-rated from the Effective Date (submission date) to the policy period end. The screen may optionally note the pro-rated first-year deduction as an informational line (e.g., *"Amount deducted this policy year: ₹3,485"*), but the primary display is the full annual contribution going forward.

---

**BR-LE-033 — Deletion flow: Event Date capture** `Not Built`  
The deletion wizard captures the same two date concepts as the addition flow (BR-LE-031), applied to the deletion context:

| Field | What it captures | Who sets it | Used for |
|---|---|---|---|
| **Event Date** | The date the qualifying deletion event occurred — date of death, date of the divorce decree, date the daughter married, date the son stopped studying, date the dependent exceeded the age limit | Employee — mandatory input | Audit trail, HR/Service Team review, stored on the Endorsement record |
| **Effective Date** | The date from which the dependent's coverage ends on the policy | System — automatically set to the submission timestamp, **read-only**, not editable | Backend pro-rata refund calculation, `deletedAt` field in the deletion payload |

The Event Date input appears on the first deletion step (Select Dependent or Confirm step — exact placement decided by Tech Lead). Validation: not in the future; not before the current policy period start. The read-only Effective Date label shows today's date with the note "(automatically set to submission date)."

**Technical changes implied (for Tech Lead review):**

- **Code (UI)** — Add an "Event Date" input to the deletion wizard's first step. Show "Effective Date: [today's date] (automatically set to submission date)" as a read-only label alongside it.
- **API** — The `deletedAt` field on the dependent payload (currently absent from `prepareDeletionPayload` in [index.tsx:906–965](apps/ui/ibp/src/app/pages/LifeEvents/index.tsx#L906-L965)) must be populated from the employee-entered Event Date, then sent per affected dependent record. The backend's refund gate at [enrollment-processing.util.ts:2603](apps/services/service-lib/src/lib/utils/enrollment-processing.util.ts#L2603) is gated on a truthy `deletedAt` — without this field the refund branch never fires. No schema change needed; the field already exists in the DTO.
- **Database** — No schema changes. `deletedAt` already exists on the dependent entity.

---

**BR-LE-034 — Deletion Review Premium: refund display and claim-status handling** `Not Built`  
The deletion flow's Review Premium screen extends the before/after contribution display (BR-LE-032) with refund information derived from the dependent's claim status.

**When no claim has been made (refund eligible):**
- Employee contribution Before (annual)
- Employee contribution After removing the dependent (annual)
- **Premium Reduction** = Before − After (employee delta, per BR-LE-032 label convention)
- **Employee refund this policy year** = employee-share of the pro-rated refund from Event Date to policy period end
- **Employer refund this policy year** = employer-share of the pro-rated refund — displayed **only when the company-level "show employer contribution" flag is enabled**. If the flag is off, the employer refund line is hidden. This flag governs employer-contribution visibility across the entire application; Life Events must read and respect it.
- New monthly deduction going forward

**When a claim has been made on the policy (refund blocked):**
- Employee contribution Before and After, and Premium Reduction line — shown as normal
- A prominent disclaimer replaces all refund line items: *"No premium refund will be issued for [Dependent Name] — a claim was made on this policy during the coverage period."*
- The deletion is **not blocked** — the dependent is removed from coverage going forward regardless of claim status. The claim-status message is informational only.

**When the premium does not change (family-floater edge case per BR-LE-013b):**
- Premium Reduction = ₹0; refund = ₹0
- Note: *"Your premium does not change because this policy uses a family-floater pricing structure that covers up to [N] members at the same rate."*

**Technical changes implied (for Tech Lead review):**

- **Code (UI)** — Read each affected dependent's `claimStatus` from `state.policyData.relationDependentData` before rendering the Review Premium step. Branch rendering: refund lines vs. claim-made disclaimer. Read the company-level "show employer contribution" flag (location of this flag in the Redux store to be confirmed by Tech Lead) and conditionally render the employer refund line.
- **API** — No new endpoints. `claimStatus` is already in the data model (read as `dep.additionalParams?.claimStatus ?? dep.claimStatus` at the backend). Confirm the field is included in the policy data returned to the UI; if not, a backend data-shape change is required.
- **Database** — No schema changes.

---

**BR-LE-035 — Concurrent life event conflict model: three-tier framework** `Not Built`  
When an employee submits a new life event while a previous one is still in-flight, the system applies a three-tier conflict model:

| Tier | Name | Behavior | Applies when |
|---|---|---|---|
| 1 | **Hard Block** | Submission is rejected with a specific error message naming the conflicting in-flight request. Submit button disabled. | Direct contradictions, singleton-slot conflicts, terminal event precedence, capacity overshoot |
| 2 | **Warn + Reason** | Submission is allowed but gated behind a mandatory Reason dropdown (+ optional free-text). Submit is disabled until a reason is selected. The selected reason is stored on the Endorsement record. | Cross-event pairs with unusual date order (not a contradiction, just chronologically unlikely) |
| 3 | **Allow** | No friction. Submission proceeds normally. | Independent events on different dependents; no logical clash |

---

**BR-LE-036 — "In-flight" endorsement definition** `Not Built`  
An endorsement is in-flight for conflict detection as long as its `endorsementStatus` is any value other than `"Processed"` — covering `"Pending Acknowledgement"`, `"Pending TPA Upload"`, and `"Acknowledged"`. The conflict check evaluates all in-flight endorsements linked to the employee across all policies.

A slot is freed only when `endorsementStatus` reaches `"Processed"`. Earlier status transitions (Acknowledgement, TPA Upload) do not free the slot.

---

**BR-LE-037 — Hard Block: singleton relationship slot conflict** `Not Built`  
An employee cannot have two in-flight endorsements that both affect the spouse/partner relationship slot simultaneously. If any in-flight endorsement targets the spouse slot (Marriage, Divorce, Dependent Death with spouse target, No Longer Eligible with spouse target), submitting any further event that also targets the spouse slot is blocked.

Error message: *"You have an in-flight [Event Name] for your spouse. Please wait for that request to be processed before submitting a new one."*

---

**BR-LE-038 — Hard Block: same-dependent identity conflict** `Not Built`  
Two in-flight endorsements that target the same dependent — matched by the BR-LE-008 deduplication fingerprint (`name | relationship | gender | dob`) — are not permitted simultaneously. Any second event on the same person is blocked until the first is Processed.

Error message: *"You have an in-flight request for [Dependent Name]. Please wait for it to be processed before submitting a new request for the same person."*

---

**BR-LE-039 — Hard Block: terminal event in-flight precedence** `Not Built`  
Once a terminal deletion event (Dependent Death, Divorce, or No Longer Eligible — per BR-LE-029) is in-flight on a dependent, no further event of any kind may be submitted for that same dependent until the terminal event is Processed. A person being recorded as deceased, divorced, or permanently ineligible must not have any concurrent modifications.

Error message: *"You have a pending [Event Name] request for [Dependent Name]. No further changes to this person's coverage are allowed until that request is processed."*

---

**BR-LE-040 — Hard Block: cumulative capacity overshoot** `Not Built`  
When evaluating whether an employee can add a new dependent of a given relationship type, the system counts both currently enrolled dependents **and** all in-flight additions for that relationship type. If the cumulative total equals or would exceed the policy's `maxCount` for that relationship, the new addition is blocked.

Example: `maxCount` = 2 children; enrolled = 1; one Child Birth in-flight (+1). Cumulative = 2 = limit. A new Adoption would make cumulative 3 → blocked.

Error message: *"Your policy allows a maximum of [N] [relationship]. You already have [enrolled count] enrolled and [in-flight count] pending. This addition would exceed the limit."*

---

**BR-LE-041 — Warn + Reason: child addition while Marriage is in-flight with unusual dates** `Not Built`  
When an employee submits a child addition event — Child Birth, Adoption, or Age-Dependent Addition for a child relationship — while a Marriage endorsement is in-flight, and the child's event date / DOB predates the pending wedding date by more than 9 months, the system triggers the Tier-2 Warn + Reason prompt before allowing submission.

Prompt shown to the employee: *"Your child's date of birth / event date appears to predate your pending marriage. Please confirm the reason for this."*

The employee must select one reason from the following dropdown before submitting:
- Child existed before this marriage
- Blended family / step-child
- Marriage registration was delayed
- Other (free-text field required)

The selected reason plus any free-text is stored as a field on the Endorsement record and is visible to the HR/Service Team when reviewing the endorsement in iwork. Once a reason is provided, the submission proceeds without further friction.

**Technical changes implied (for Tech Lead review — applies to BR-LE-035 through BR-LE-041):**

- **API** — A server-side conflict check must be executed at the `updateEnrollmentData` submission endpoint (or a dedicated pre-submit check endpoint). The check queries all endorsements for the employee via `PolicyEmployeeEndorsement` where `endorsementStatus !== "Processed"` and evaluates the four Hard Block rules (BR-LE-037–040) and the Soft Warn rule (BR-LE-041) before accepting the new submission. The endpoint should return a structured error response — error code + message — so the UI can distinguish tier 1 (block) from tier 2 (warn).
- **Code (UI)** — The wizard's final step calls the conflict check before enabling Submit. On Hard Block response: disable Submit, render the specific error message. On Warn+Reason response: surface the reason dropdown; enable Submit only after a reason is selected. The reason (dropdown value + optional free text) is included in the submission payload.
- **Database** — A nullable `concurrentEventReason` field (or equivalent) on the Endorsement entity to store the Warn+Reason text when tier-2 was triggered. Tech Lead to decide exact field name and entity location.
- **No changes** to existing endorsement status values, the 6-step workflow, or the `ENDORSEMENT_STATUS` / `ENDORSEMENT_STEP_KEYS` constants.

---

## Acceptance Criteria

Each criterion maps to one or more user stories above. Written in Given/When/Then format for direct use in QA and client sign-off.

---

**AC-LE-001** (→ US-LE-001) `Built`  
**Given** an employee who has not completed enrollment on any policy (no policy with `isEditable = false` in `enrolledPolicies`),  
**When** they navigate to the Life Events section,  
**Then** they are redirected to the dashboard with no Life Events UI rendered.

---

**AC-LE-001b** (→ US-LE-001, BR-LE-001b) `Partial`  
**Given** an employee whose only policy satisfying `isEditable = false` has an end date (`policyTo`) in the past,  
**When** they navigate to Life Events,  
**Then** that expired policy is excluded from the eligible policy set — it does not count toward carousel card eligibility (BR-LE-002) and cannot be selected as the target of an addition or deletion. Today this exclusion is only enforced once the wizard computes its policy source (mid-flow), not at the initial route-guard check — see Gap Register (GAP-15) for closing that gap so an employee in this exact situation is redirected at the landing page instead of reaching an empty/unusable wizard.

---

**AC-LE-002** (→ US-LE-002) `Built`  
**Given** an employee with an eligible policy but where all dependent slots are filled,  
**When** the Life Events carousel loads,  
**Then** the relevant addition life event card displays a "Not Eligible" badge and cannot be clicked.

---

**AC-LE-003** (→ US-LE-003, BR-LE-003, BR-LE-005) `Built`  
**Given** an employee who selects "Marriage" as their life event,  
**When** the addition wizard loads,  
**Then** only the "spouse/partner" relationship type is available in the dependent form, and the Marriage card is rendered as ineligible (with badge) when the policy's spouse `maxCount` has already been reached by enrolled dependents.

---

**AC-LE-004** (→ US-LE-004, BR-LE-006) `Built`  
**Given** a male employee filling in the dependent form,  
**When** they open the relationship dropdown,  
**Then** "wife" does not appear; only "spouse" (or equivalent normalized option) is available for the spouse group.

---

**AC-LE-005** (→ US-LE-004) `Built`  
**Given** an employee entering a dependent's details,  
**When** they submit the form with a missing required field (name, relationship, gender, or DOB),  
**Then** the form displays a field-level error and does not advance to the next step.

---

**AC-LE-006** (→ US-LE-005, BR-LE-009) `Built`  
**Given** an employee on the benefit choices step,  
**When** choices load,  
**Then** compulsory components are pre-selected and cannot be deselected; optional components are deselected by default and user-selectable.

---

**AC-LE-007** (→ US-LE-005, BR-LE-010) `Built`  
**Given** a relationship-group policy,  
**When** the employee changes their dependent selection on the choices screen,  
**Then** the system fetches updated pricing from the backend before displaying premiums, and stale values are not shown.

---

**AC-LE-007b** (→ US-LE-005, US-LE-006, BR-LE-010) `Built`  
**Given** a relationship-group policy where the pricing-refresh call (`endPoints.policyConfigurationByDependents`) fails (network error, non-2xx response, or timeout),  
**When** the failure occurs at any refresh trigger (dependent selection change, choice change, or arrival at Review Premium),  
**Then** the wizard displays the error message *"We couldn't recalculate your premium. Please try again."*, disables the Next and Submit buttons, and offers a **Retry** action (re-issues the refresh request). The user may also navigate Back. Submission is impossible until a refresh succeeds; stale pricing is never used as a fallback.

---

**AC-LE-008** (→ US-LE-006, BR-LE-013, BR-LE-013b) `Partial`  
**Given** an employee on the Review Premium screen for a **per-life policy** (addition flow),  
**When** the screen renders,  
**Then** it shows: Current Annual Premium, **Additional Premium** (new lives × choice premium per life), New Total Premium, and Monthly Deduction — all calculated per BR-LE-013.

---

**AC-LE-008b** (→ US-LE-006, BR-LE-013b) `Partial`  
**Given** an employee on the Review Premium screen for a **family bucket policy** (addition flow, `isRelationshipGroup = true`),  
**When** the screen renders,  
**Then** it shows: Current Annual Premium (old bucket price), **Additional Premium** (new bucket price minus old bucket price, derived from the BR-LE-010 refresh response), New Total Premium (new bucket price), and Monthly Deduction. If the old and new bucket prices are identical (family-floater edge case), the screen shows Additional Premium = ₹0 with the note: *"Your premium does not change because this policy uses a family-floater pricing structure that covers up to [N] members at the same rate."*

---

**AC-LE-008c** (→ US-LE-006, BR-LE-013, BR-LE-013b) `Partial`  
**Given** an employee on the Review Premium screen for a deletion flow (either per-life or bucket policy),  
**When** the screen renders,  
**Then** it shows: Current Annual Premium, **Premium Reduction** (the decrease amount, positive value), Remaining Annual Premium, and Monthly Deduction — calculated per BR-LE-013 (per-life) or BR-LE-013b (bucket) as applicable.

---

**AC-LE-009** (→ US-LE-007, BR-LE-011) `Partial`  
**Given** an employee uploading a document in the addition flow,  
**When** they select a file larger than 5 MB or of an unsupported type (anything other than PDF/JPG/PNG),  
**Then** the upload is rejected with the toast "Please upload PDF, JPG, or PNG files up to 5 MB only." and the submission button remains disabled.

---

**AC-LE-009b** (→ US-LE-010, BR-LE-011) `Built`  
**Given** an employee uploading a document in the deletion flow,  
**When** they select a file larger than 5 MB or of an unsupported type,  
**Then** the upload is rejected with the toast "Please upload PDF, JPG, or PNG files up to 5MB only." and the submission button remains disabled.

---

**AC-LE-010** (→ US-LE-008, BR-LE-004) `Built`  
**Given** an employee selecting "Divorce" as their life event,  
**When** the deletion wizard loads,  
**Then** only dependents with a spouse/partner relationship who are currently enrolled are shown in the removal table.

---

**AC-LE-010b** (→ US-LE-008, US-LE-009, US-LE-010, BR-LE-004, BR-LE-007, BR-LE-008, BR-LE-011) `Partial`  
**Given** an employee whose father is enrolled as a dependent on at least one policy (any policy type — Parent Policy, GMC, GTL, etc.) where `isEditable = false`,  
**When** the employee opens Life Events, selects the "Dependent Death" card, picks the father in the (deduplicated) removal table, uploads a Death Certificate (PDF / JPG / PNG, ≤ 5 MB), acknowledges the irreversibility warning, and submits,  
**Then** the system:
1. Submits a `PUT` to `endPoints.updateEnrollmentData` with the father's dependent record(s) carrying `lifeEventAction: "DELETE"` and the uploaded `documentIds`,
2. Excludes the father's coverage from the recalculated annual premium on the affected policy,
3. Writes an activity log with `activityKey = "LIFE_EVENT_DELETION_SUBMITTED"`, `lifeEventType = "dependent_death"`, `lifeEventTitle = "Dependent Death"`, the relevant `policyName`, and `dependentNames` containing the father's name,
4. Renders the success page with the returned `requestId`, `submittedAt`, the reason "Dependent Death", and the new annual premium.

If the same father is enrolled on multiple policies, the system automatically removes him from **all** enrolled policies in a single submission (per BR-LE-029 — Dependent Death is a terminal event). The confirmation screen shows a "Policy impact" summary listing every affected policy before the final submit (per AC-LE-032).

---

**AC-LE-011** (→ US-LE-011, BR-LE-012) `Built`  
**Given** an employee on the deletion confirmation screen,  
**When** the screen renders,  
**Then** a prominent irreversibility warning is displayed before the submit button, and the employee must explicitly acknowledge it before submission is enabled.

---

**AC-LE-012** (→ US-LE-012) `Built`  
**Given** an employee who successfully submits a life event request,  
**When** the success screen renders,  
**Then** it displays a unique request ID, the submission timestamp, the life event reason title, and the new annual premium.

---

**AC-LE-013** (→ US-LE-013) `Built`  
**Given** a submitted life event (addition or deletion),  
**When** submission succeeds,  
**Then** an activity log entry is created containing: `activityKey`, `referenceId` (request ID), `flowType`, `lifeEventType`, `lifeEventTitle`, `policyName`, and `dependentNames`.

---

**AC-LE-014** (→ US-LE-003, BR-LE-008) `Built`  
**Given** an employee enrolled in two policies with the same dependent,  
**When** the dependent removal screen loads,  
**Then** the dependent appears only once, not duplicated across policies.

---

**AC-LE-015** (→ US-LE-012, BR-LE-014) `Built`  
**Given** an employee who successfully submits a life event (addition or deletion),  
**When** the submission completes,  
**Then** the system creates exactly one new `Endorsement` record with `endorsementType` = `"addition"` for the addition flow or `"deletion"` for the deletion flow, links it to the employee and policy via a `PolicyEmployeeEndorsement` row (using `endorsementId` for addition, `deletionEndorsementId` for deletion), initializes `currentEndorsementStep = 1` (`endorsementRequestReceived`), and sets `endorsementStatus` to the workflow's starting status (typically `"Pending Acknowledgement"`).

---

**AC-LE-016** (→ US-LE-014, BR-LE-016, BR-LE-017) `Partial`  
**Given** an employee submits a life event,  
**When** the Endorsement record is created (per AC-LE-015),  
**Then** an email is sent to the employee's registered email address. If an HR Email is configured for the company in the Contacts module, the same email is sent to that HR address. If no HR Email is configured, only the employee receives the email and no error is raised.

---

**AC-LE-017** (→ US-LE-014, US-LE-015, BR-LE-016, BR-LE-017) `Partial`  
**Given** a submitted life event with a linked Endorsement record,  
**When** the endorsement's `endorsementStatus` changes or its `currentEndorsementStep` advances,  
**Then** an email is sent to the employee, plus to the company HR Email if configured. Recipient resolution per status-change email follows the same rules as the submission email (AC-LE-016). One email per status-change event; no batching.

---

**AC-LE-018** (→ US-LE-016, BR-LE-018) `Not Built`  
**Given** an employee in the IBP Life Events area,  
**When** they open the Life Events History sub-menu,  
**Then** they see a list of their previously submitted life-event requests, sorted with the most recent submission first. Each row shows at minimum the Request ID and the Current Status (mirrored from the linked Endorsement's `endorsementStatus`). The exact column set is defined by the Tech Lead in the TRD.

---

**AC-LE-019** (→ US-LE-012, US-LE-016, BR-LE-018) `Not Built`  
**Given** an employee on the Life Events success page after a successful submission,  
**When** the page renders,  
**Then** it includes a navigable link to the Life Events History sub-menu. Clicking the link navigates to that sub-menu and the just-submitted request is visible at the top of the list.

---

**AC-LE-020** (→ US-LE-017, BR-LE-019) `Not Built`  
**Given** an employee on the Life Events History list,  
**When** they select a row,  
**Then** the same 6-step Endorsement stepper used in iwork opens **in read-only mode**, showing all six steps in canonical order with the current step highlighted, prior steps marked complete, and later steps shown as upcoming. No upload, edit, advance, or comment controls are available.

---

**AC-LE-021** (→ US-LE-018) `Not Built`  
**Given** a user who has both employee and HR Admin roles, currently logged in as the employee,  
**When** they open the Life Events History sub-menu,  
**Then** they see only the requests they have personally submitted as an employee — never the company-wide endorsement list. Company-wide endorsement visibility is available only when the same user switches to their HR role in the HR Portal (out of scope for this PRD; covered by the forthcoming HR Portal PRD).

---

**AC-LE-022** (→ US-LE-019, BR-LE-020, BR-LE-021) `Not Built`  
**Given** an employee on any step of the addition or deletion wizard with partial data entered,  
**When** they click **Save Draft**,  
**Then** the system persists the wizard state to the server-side draft store keyed by `employeeId` (flow type, selected event, current step, dependent values, selected choices, document IDs, policy reference) and routes the user back to the Life Events landing page. No partial-data validation is enforced at Save time.

---

**AC-LE-023** (→ US-LE-020, BR-LE-024) `Not Built`  
**Given** an employee with an existing draft,  
**When** they navigate to the Life Events landing page,  
**Then** a banner is rendered at the top of the page reading "You have a saved draft for [Life Event Title]" with two actions: **Resume Draft** and **Discard**. Clicking **Resume Draft** opens the wizard at the saved step with all values restored. Clicking **Discard** deletes the draft (and its linked uploaded files per BR-LE-025) and dismisses the banner. The banner does not block interaction with the rest of the page.

---

**AC-LE-024** (→ US-LE-021, BR-LE-021, BR-LE-023) `Not Built`  
**Given** an employee with an existing draft,  
**When** they select a different life event from the carousel,  
**Then** a warning dialog appears: "You have a saved draft for [Life Event Title]. Continue with the existing draft, or discard it to start a new one." with two actions: **Continue Draft** (resumes the existing draft) and **Discard & Start New** (deletes the existing draft per BR-LE-025 and proceeds with the newly selected event).

---

**AC-LE-025** (→ US-LE-019, US-LE-020, BR-LE-025) `Not Built`  
**Given** an employee resumes a draft that previously had documents uploaded,  
**When** the wizard renders the Documents area,  
**Then** the previously uploaded files are visible with their original metadata (file name, size). The user can keep, replace, or remove them. On final submission, the `documentIds` are sent with the submission payload (BR-LE-014). On Discard, a background job cleans up the file records that were referenced only by the draft.

---

**AC-LE-026** (→ BR-LE-022) `Not Built`  
**Given** an employee has a draft on Policy P,  
**When** Policy P reaches its end date (expiry or renewal),  
**Then** a scheduled cleanup job discards the draft and removes any uploaded file records that were referenced only by the draft. The user is not notified at the moment of cleanup; if they next visit the Life Events landing page and no draft exists, no banner is shown and the carousel is shown normally.

---

**AC-LE-027** (→ US-LE-004, BR-LE-026) `Partial`  
**Given** an employee in the Dependent Details form selecting a relationship whose policy configuration defines `minAge` and/or `maxAge` constraints,  
**When** the relationship is selected,  
**Then** the DOB field displays the allowed age band as helper text (e.g., "Age must be between 18 and 25"). When the user enters a DOB whose computed age is outside the band, the form shows an inline error and the **Add Dependent** button is disabled until the DOB is corrected.

---

**AC-LE-028** (→ US-LE-004, BR-LE-026) `Partial`  
**Given** an employee with a previously valid dependent DOB,  
**When** the relationship is changed to one whose age constraints reject the existing DOB,  
**Then** the DOB field is cleared and an inline message informs the user that the DOB must be re-entered to fit the new relationship's age constraints.

---

**AC-LE-029** (→ US-LE-004, BR-LE-026) `Built`  
**Given** an attempt to submit a Life Event with a dependent DOB that violates the policy configuration's age constraints,  
**When** the submission reaches the backend (`endPoints.updateEnrollmentData`),  
**Then** the backend rejects the submission and returns a validation error referencing the violating field; the UI surfaces this error to the user. (This is the defense-in-depth case — the UI should normally have caught this before submission per AC-LE-027.)

---

**AC-LE-030** (→ US-LE-008, US-LE-009, BR-LE-028) `Partial`  
**Given** an employee whose daughter is enrolled on a policy under the "Unmarried Daughter Age Limit Extension" and the daughter subsequently marries,  
**When** the employee opens Life Events,  
**Then** the "No Longer Eligible" card is selectable (because the daughter is an enrolled dependent with a matching relationship type), the "Age Limit Exceeded" card is not selected for this scenario, and the removal list shows the daughter as a candidate for removal under the "No Longer Eligible" flow.

---

**AC-LE-031** (→ US-LE-008, US-LE-009, BR-LE-028) `Partial`  
**Given** an employee whose son is enrolled on a policy under the "Studying Son Age Limit Extension" and the son subsequently stops being a full-time student,  
**When** the employee opens Life Events and selects "No Longer Eligible",  
**Then** the removal list shows the son as an eligible candidate; the "Age Limit Exceeded" card is not the correct path for this scenario (son's age is still within the base `maxAge` or the age itself is not the trigger).

---

**AC-LE-032** (→ US-LE-008, US-LE-010, BR-LE-029) `Not Built`  
**Given** an employee whose father is enrolled on two policies (e.g., GMC and GPA) and the father passes away,  
**When** the employee selects "Dependent Death", picks the father from the removal list, uploads the death certificate, and reaches the final confirmation screen,  
**Then** the confirmation screen shows a "Policy impact" summary: "This will remove [Father] from 2 policies: GMC, GPA" with the premium change for each policy. On submission, the father's enrollment record on **both** GMC and GPA is marked for deletion — not just one. A single Endorsement record is created covering both policies.

---

**AC-LE-033** (→ US-LE-008, US-LE-009, BR-LE-030) `Not Built`  
**Given** an employee whose son (age 25) is enrolled on GMC (child `maxAge` = 25) and GPA (child `maxAge` = 30), and the employee selects "Age Limit Exceeded",  
**When** the deletion wizard loads and the employee picks the son,  
**Then** the Policy impact summary shows "This will remove [Son] from GMC. He will remain enrolled on GPA (age limit: 30)." On submission, only the GMC enrollment is marked for deletion; the GPA enrollment is untouched.

---

**AC-LE-034** (→ US-LE-004, BR-LE-031) `Not Built`  
**Given** an employee filling in the Dependent Details step for a **Marriage** life event,  
**When** the form renders,  
**Then** a mandatory **Event Date** field is present (labelled "Event Date", not "Effective Date"), a read-only **Effective Date** label shows today's date with the note "(automatically set to submission date)", and the Event Date field rejects any future date or any date before the current policy period start.

---

**AC-LE-035** (→ US-LE-003, BR-LE-031) `Not Built`  
**Given** an employee filling in the Dependent Details step for a **Child Birth** or **Adoption** life event,  
**When** the form renders,  
**Then** no separate Event Date field is shown; the child's Date of Birth field serves as the event date. The read-only Effective Date label still shows today's date with the note "(automatically set to submission date)".

---

**AC-LE-036** (→ US-LE-006, BR-LE-032) `Not Built`  
**Given** an employee on the Review Premium screen (addition flow),  
**When** the screen renders,  
**Then** it shows, per affected policy: the employee's current annual contribution (Before), the employee's new annual contribution after adding the dependent (After), the **Additional Premium** (After − Before, positive), and the new monthly deduction (New annual ÷ 12). The employer's contribution is not displayed.

---

**AC-LE-037** (→ US-LE-006, BR-LE-032) `Not Built`  
**Given** an employee on the Review Premium screen (deletion flow),  
**When** the screen renders,  
**Then** it shows, per affected policy: the employee's current annual contribution (Before), the employee's new annual contribution after removing the dependent (After), the **Premium Reduction** (Before − After, positive), and the new monthly deduction. The employer's contribution is not displayed.

---

**AC-LE-038** (→ US-LE-008, BR-LE-033) `Not Built`  
**Given** an employee on the first step of any deletion wizard (Dependent Death, Divorce, No Longer Eligible, Age Limit Exceeded),  
**When** the step renders,  
**Then** a mandatory **Event Date** field is visible (labelled "Event Date"), and a read-only **Effective Date** label shows today's date with the note "(automatically set to submission date)". The Event Date field rejects any future date and any date before the current policy period start. The wizard cannot advance without a valid Event Date.

---

**AC-LE-039** (→ US-LE-008, US-LE-011, BR-LE-034) `Not Built`  
**Given** an employee on the deletion Review Premium screen where the dependent being removed **has no claim** on the policy,  
**When** the screen renders,  
**Then** it shows: employee contribution Before, employee contribution After, **Premium Reduction** (Before − After), **Employee refund this policy year** (employee share of the pro-rated refund from Event Date to policy end), and — if the company's "show employer contribution" flag is enabled — an **Employer refund this policy year** line. If the flag is off, the employer refund line is not shown.

---

**AC-LE-040** (→ US-LE-008, US-LE-011, BR-LE-034) `Not Built`  
**Given** an employee on the deletion Review Premium screen where the dependent being removed **has made a claim** on the policy during the current coverage period,  
**When** the screen renders,  
**Then** no refund line items are shown. Instead, a prominent disclaimer is displayed: *"No premium refund will be issued for [Dependent Name] — a claim was made on this policy during the coverage period."* The employee contribution Before/After and Premium Reduction lines are still shown. The **Submit** button remains enabled — the deletion is not blocked.

---

**AC-LE-041** (→ BR-LE-036, BR-LE-037) `Not Built`  
**Given** an employee with a **Marriage** endorsement whose `endorsementStatus` is `"Acknowledged"` (not yet `"Processed"`),  
**When** the employee tries to submit a **Divorce** life event,  
**Then** the submission is blocked (Hard Block) with the message: *"You have an in-flight Marriage request for your spouse. Please wait for that request to be processed before submitting a new one."* The Submit button is disabled. The Acknowledged status counts as in-flight; it does not free the spouse slot.

---

**AC-LE-042** (→ BR-LE-038) `Not Built`  
**Given** an employee with a **Child Birth** endorsement in-flight for dependent "Arjun" (child, Male, DOB 2020-05-01),  
**When** the employee tries to submit an **Age Limit Exceeded** deletion for the same "Arjun" (matched by fingerprint: name | relationship | gender | dob),  
**Then** the submission is blocked with the message: *"You have an in-flight request for Arjun. Please wait for it to be processed before submitting a new request for the same person."*

---

**AC-LE-043** (→ BR-LE-039) `Not Built`  
**Given** an employee with a **Dependent Death** endorsement in-flight for their father,  
**When** the employee tries to submit any further life event (addition or deletion) targeting the same father,  
**Then** the submission is blocked with the message: *"You have a pending Dependent Death request for [Father's Name]. No further changes to this person's coverage are allowed until that request is processed."*

---

**AC-LE-044** (→ BR-LE-040) `Not Built`  
**Given** a policy where `maxCount` = 2 children, the employee has 1 enrolled child, and one Child Birth addition endorsement is already in-flight (cumulative = 2 = limit),  
**When** the employee tries to submit a new **Adoption** event,  
**Then** the submission is blocked with a message indicating the policy maximum of 2 children would be exceeded when the in-flight addition is counted. The block applies even though only 1 child is currently enrolled.

---

**AC-LE-045** (→ BR-LE-041) `Not Built`  
**Given** an employee with an in-flight **Marriage** endorsement (wedding date = 1 Mar 2026),  
**When** the employee submits a **Child Birth** with child DOB = 1 Apr 2025 (more than 9 months before the wedding date),  
**Then** the wizard shows the Warn + Reason prompt: *"Your child's date of birth appears to predate your pending marriage. Please confirm the reason for this."* The mandatory dropdown presents: "Child existed before this marriage", "Blended family / step-child", "Marriage registration was delayed", "Other". The Submit button is disabled until a reason is selected. Once selected, the submission proceeds; the selected reason is stored on the Endorsement record and visible to HR/Service Team in iwork.

---

**AC-LE-046** (→ BR-LE-041) `Not Built`  
**Given** the same in-flight Marriage scenario (AC-LE-045),  
**When** the employee submits an **Adoption** or **Age-Dependent Addition (child)** whose event date / DOB predates the wedding date by more than 9 months,  
**Then** the same Warn + Reason prompt fires. The trigger applies to all three child-addition event types (Child Birth, Adoption, Age-Dependent Addition for a child relationship), not only Child Birth.

---

## Data Contract

This section defines what the Life Events module consumes and produces. It does not describe internal implementation — that belongs in the TRD (Stage 40b).

### Consumed by Life Events

| Source | Shape | Purpose |
|---|---|---|
| `state.policyData.relationDependentData` | `LifeEventPolicySource[]` | All eligible policies with their configurations, existing dependents, and relationship constraints |
| `state.user` | `{ employeeId, companyId, gender, name }` | Employee identity and gender for relationship filtering |
| `endPoints.ibpFileUpload` | POST → `{ id, name, size }` | Upload supporting documents; returns file ID for submission |
| `endPoints.policyConfigurationByDependents` | POST → refreshed `LifeEventPolicySource` | Recalculated pricing when dependent roster changes (relationship-group policies) |

### Produced by Life Events

| Destination | Shape | Purpose |
|---|---|---|
| `endPoints.updateEnrollmentData` | PUT with combined choices + dependents payload | Submits the life event change; receives `{ requestId, submittedAt }` |
| `endPoints.getActivityLogs` | POST with activity metadata | Audit trail entry written on successful submission |
| `sessionStorage` (7 keys) | Flow state (type, step, dependents, choices, documents, submission meta) | Preserves wizard progress across browser navigation |

### Cross-module contract items

- **Enrollment module**: Life Events reuses the same `updateEnrollmentData` endpoint as open enrollment. Any change to that endpoint's payload schema must be validated against both modules.
- **Activity History module**: Consumes the activity log entries created by Life Events. The `activityKey` values `LIFE_EVENT_ADDITION_SUBMITTED` and `LIFE_EVENT_DELETION_SUBMITTED` must remain stable.
- **Policy Data store**: Life Events reads `relationDependentData` from the Redux store. Any changes to how this data is fetched or structured will break eligibility logic.
- **Endorsement module** ([endorsement.entity.ts](apps/services/service-lib/src/lib/entities/endorsement.entity.ts), [policy-employee-endorsement.entity.ts](apps/services/service-lib/src/lib/entities/policy-employee-endorsement.entity.ts)): Life Events writes an `Endorsement` row + a `PolicyEmployeeEndorsement` link on every submission (BR-LE-014). After creation, Life Events is read-only over `endorsementStatus` and `currentEndorsementStep` (BR-LE-015). The 6-step keys (`ENDORSEMENT_STEP_KEYS`) and 4-status enum (`ENDORSEMENT_STATUS`) live in [iwork constants](apps/ui/iwork/src/app/constants/index.ts) and must remain stable; Life Events imports these rather than redefining them.
- **iwork stepper UI**: The drill-down read-only view (BR-LE-019, AC-LE-020) reuses the existing iwork Endorsement stepper component. Any breaking change to that component's props or rendering must be reflected in Life Events.
- **Contacts module (company-level)**: Life Events reads the HR Email from the company's Contacts module (BR-LE-017). The HR Email field's location and shape must remain stable; if it changes, Life Events email routing must be updated.
- **Notification / email service**: Life Events triggers emails on submission and on every endorsement status change (BR-LE-016). The email payload must include at minimum the Request ID, life event type, dependent name, and current status — exact template owned by the notification module (see open question on email content).
- **HR Portal (forthcoming)**: HR Admin's surface for tracking and acting on life-event endorsements lives in the HR Portal, which is yet to be developed and will have its own PRD. Life Events does not depend on the HR Portal at runtime, but the HR Portal will consume the same Endorsement records this module produces. Cross-link the two PRDs once the HR Portal PRD is published.

---

## Gap Register

Tech Lead reference: every BR tagged `Partial` or `Not Built` maps to a row below. Ordered by fix effort — defects first, new features last.

| GAP | Group | BRs | Description | Files |
|---|---|---|---|---|
| GAP-01 | Defect | BR-LE-011 | Addition flow enforces 10 MB; both flows must enforce 5 MB and update copy. | `LifeEventsDependentManagement.tsx:902`, `constants.ts` |
| GAP-02 | Defect | BR-LE-027 | `DELETION_LIFE_EVENTS[2].key` is `eligibility_change`; must match `id: age_limit_exceeded`. Grep and update all references. | `constants.ts` |
| GAP-03 | Enhancement | BR-LE-013b, BR-LE-032 | Review Premium missing before/after employee-contribution format and "Additional Premium" / "Premium Reduction" labels. | `PremiumSummary.tsx` |
| GAP-04 | Enhancement | BR-LE-028 | "No Longer Eligible" card description missing study-extension and marriage-status examples. | `constants.ts` |
| GAP-05 | Enhancement | BR-LE-026 | Age constraint helper text ("Age must be between X and Y") and inline DOB error not confirmed per spec. | `LifeEventsDependentManagement.tsx:855` |
| GAP-06 | New: History | BR-LE-015, BR-LE-018, BR-LE-019 | New `/life-events/history` route + table of past requests + read-only iwork stepper drill-down. Success page must link here. | New route + component |
| GAP-07 | New: Save Draft | BR-LE-020–025 | Save Draft button, server-side singleton storage, resume banner, discard dialog, file lifecycle on discard/expiry. | New entity + endpoints + UI |
| GAP-08 | New: Event Dates | BR-LE-031 | Addition flow missing "Event Date" input for Marriage and Age-Dependent Addition. `eventDate` not in submission payload. | `LifeEventsDependentManagement.tsx` |
| GAP-09 | New: Event Dates | BR-LE-033 | Deletion flow missing "Event Date" input. `deletedAt` never sent → backend refund gate never fires. | `index.tsx:906–939`, `enrollment-processing.util.ts:2603` |
| GAP-10 | New: Cross-Policy | BR-LE-029 | Terminal events must cascade DELETE to all policies; current code marks one record only. | `index.tsx:906–939` |
| GAP-11 | New: Cross-Policy | BR-LE-030 | Age-out DELETE must filter only policies where `dependent.age >= policy.maxAge`; current code marks one record only. | `index.tsx:906–939` |
| GAP-12 | New: Refund | BR-LE-034 | Deletion Review Premium missing refund lines, employer refund (flag-gated), and claim-made disclaimer. | `PremiumSummary.tsx` |
| GAP-13 | New: Conflicts | BR-LE-035–040 | Four Hard Block rules: singleton slot, same identity, terminal precedence, capacity overshoot. Server check + UI block needed. | New endpoint + `index.tsx` |
| GAP-14 | New: Conflicts | BR-LE-041 | Warn + Reason: child DOB predates in-flight Marriage wedding date by >9 months. Reason dropdown + storage on Endorsement. | New endpoint + `index.tsx` |
| GAP-15 | Defect | BR-LE-001b | Expired-policy exclusion is enforced only inside the wizard's policy-source filter, not at the route-guard/landing-page eligibility check (BR-LE-001). An employee whose only `isEditable = false` policy is expired can reach the carousel/wizard before finding no usable policy. | Route guard / `LifeEventsMain.tsx` eligibility check |

---

## Open Questions

These items were unresolved during reverse engineering and must be answered before Stage 40b (TRD) is finalized.

1. **Email template content** (deferred per stakeholder input) — BR-LE-016 and BR-LE-017 establish *when* emails are sent and *to whom*. The actual email content — subject line, body copy, formatting, dynamic fields included (Request ID, life event type, dependent name, current status, link to status screen, etc.), and whether the format differs by status-change type — has not yet been decided.

    To be answered before TRD finalization: define the canonical template fields per email trigger (submission, each status-change), and whether the Life Events PRD owns the template specification or hands it off to the notification module's standard template registry.

---

## Approval

Leave blank. Client sign-off authority.

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```
