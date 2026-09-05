# IBP Unified Enrollment — Product Requirements Document

**Module:** UNIFIED-ENROLLMENT  
**Product:** Integrated Benefits Portal (IBP)  
**Client:** IIRM  
**Stage:** 40a — Module PRD  
**Authored:** 2026-07-20  
**Audience:** Product owners, HR admins, client stakeholders, QA leads

---

This document specifies the product behavior for the **Unified Enrollment** module within the IBP using the Reverse Engineering method to understand the implemented business logic. Unified Enrollment is the flow through which an employee reviews the benefits offered to them, selects coverage across one or more policies, manages the dependents covered on each, reviews the resulting premium, verifies their identity, and submits a single combined enrollment. It is the primary path from the Dashboard's enrollment CTA. Anyone reading this doc cold should be able to determine what the module does, who it serves, and how to verify it is working correctly.

**Two code trees, one module.** The route `/unified-enrollment` renders the multi-policy orchestrator (`pages/MultiEnrollment`), which owns the view state machine, identity verification, combined submit, repricing, GST, and progress. A second, older single-policy flow (`pages/Enrollment` at route `/enrollment`) still exists and **shares the dependent rule engine** (`components/Enrollment/EnrollmentFlow/FamilyMembersManagement` + `relationshipFilters` + `policyControlUtils` + `dateValidations`) with the orchestrator. This PRD documents the orchestrator as the primary surface, the shared dependent engine that both consume, and the distinct behaviors of the legacy single-policy flow where they diverge.

---

## Scope

### In scope

- The `/unified-enrollment` multi-policy flow (`MultiEnrollment`): Configuration → Summary → success view states, plus the identity-verification overlay
- The Configuration view: per-policy accordions, component (choice) selection, sum-insured cards, the premium footer calculator, and the employee-details header
- The shared **dependent rule engine** (used by unified enrollment, the legacy single-policy flow, and Life Events): add / edit / delete, relationship eligibility, `maxCount`, parent-combination rules, age & age-gap validation, studying-son / unmarried-daughter extensions, twin/triplet composition, locked dependents, self-exclusion, DOB masking
- The Summary view: selected plans, member coverage, premium banner with GST, declarations/disclaimers
- Identity verification / OTP: method selection (email/mobile), send, verify, resend, cooldown, and the no-auth submit path
- Combined enrollment: save vs submit, payload of choices + dependents + deleted IDs
- Relationship-group per-policy premium repricing
- The enrollment progress pipeline (batch key + step updates)
- The confirmation surface (reference number + submission count)
- The legacy single-policy `/enrollment` flow's distinct selection and confirmation behaviors

### Out of scope

- The Dashboard that routes into this flow (owned by the IBP-DASHBOARD module)
- Life Events dependent changes outside the enrollment window (owned by the LIFE-EVENTS module — shares the same dependent engine)
- Backend / API implementation (owned by `ibp-service` and `auth-service`)
- Policy authoring (relationships, components, constraints, GST flags) — owned by the Policy Configurations module; this flow only *reads* that configuration
- The HR / admin portal (`apps/ui/iwork`)
- The 6-step Endorsement / Service Team workflow

---

## Flow Overview

**Route `/unified-enrollment` → `MultiEnrollment`.** The orchestrator runs a two-view state machine with a verification overlay.

**Configuration view** (`EnrollmentStep.Configuration`): the employee-details header, per-policy accordions (base / optional / compulsory / flex components) each hosting the dependent rule engine, and a sticky premium footer (`Bottomfooter`) showing plans selected, members covered, total/company/your premium. Footer actions: Back, Save & Exit, Continue to Summary (gated on all compulsory components being selected).

**Summary view** (`EnrollmentStep.Summary`): the combined review — selected plans per policy, covered members, a premium banner (with GST grossing), and declarations/disclaimers. Actions: Back, Save & Exit, Confirm Enrollment.

**Verification overlay** (`EnrollmentStep.success` + `VerificationStep`): Confirm Enrollment opens an identity-verification overlay over the summary — method picker (`SelectMethod`) → OTP entry (`EnterOtp`) → success (`Success`). On success the combined **submit** fires and the confirmation (reference number + submission count) renders. When no auth methods are configured, OTP is skipped and submit fires directly.

**Legacy single-policy flow** — Route `/enrollment` → `pages/Enrollment` renders the shared `EnrollmentFlow` + a static `ConfirmationPage`. It has no summary, no OTP, no combined submit, no footer calculator, and no GST grossing; selection is toggle-based with per-accordion Cancel/Continue. It exists primarily as the host of the shared dependent engine and is not the current production enrollment path.

---

## Implementation Status

BRs without a status marker are **Implemented**. Rules tagged `Partial`, `Defect`, `Doc-drift`, or `Feature-flagged` are noted inline and detailed in the [Gap Register](#gap-register). Everything in this PRD is **reverse-engineered from the shipped code** — no new product decisions are introduced here.

- **Reverse-engineered from code:** BR-UE-001 through BR-UE-032. Most work as intended; several correct the previous doc revision (which pointed at the wrong code tree and described a confirmation/premium behavior that lives in a different component).

---

## User Stories

The following stories are traced to use cases and functional requirements derived from the existing implementation. MODULE code is **UE**.

---

### Configuration & Selection

**US-UE-001** — As an **employee**, I want to review the benefits offered to me across all my policies in one flow, so that I can make my coverage choices in a single session.

- Traces to: UC-CONF-01 / FR-CONF-01

**US-UE-002** — As an **employee**, I want to select a sum-insured / benefit option per policy component, so that my coverage level is explicit rather than defaulted silently.

- Traces to: UC-CONF-02 / FR-SEL-01

**US-UE-003** — As an **employee**, I want compulsory components pre-selected and clearly marked, so that I cannot accidentally opt out of mandatory coverage.

- Traces to: UC-CONF-03 / FR-SEL-02

**US-UE-004** — As an **employee**, I want a running premium summary as I make choices, so that I always know the cost impact of my selections.

- Traces to: UC-CONF-04 / FR-PREM-01

---

### Dependent Management

**US-UE-005** — As an **employee**, I want to add a dependent to a policy component, so that my eligible family members are covered.

- Traces to: UC-DEP-01 / FR-DEP-01

**US-UE-006** — As an **employee**, I want to edit a dependent's details, so that I can correct information without losing their coverage selections.

- Traces to: UC-DEP-02 / FR-DEP-02

**US-UE-007** — As an **employee**, I want to remove a dependent and see which coverage that affects before I confirm, so that I understand the impact of the removal.

- Traces to: UC-DEP-03 / FR-DEP-03

**US-UE-008** — As an **employee** covered on multiple policies with the same dependent, I want that dependent to appear once, so that I am not confused by duplicates.

- Traces to: UC-DEP-04 / FR-DEP-04

**US-UE-009** — As an **employee**, I want dependents that are locked (already enrolled / not editable) shown read-only, so that I cannot remove coverage I am not allowed to change.

- Traces to: UC-DEP-05 / FR-DEP-05

**US-UE-010** — As an **employee**, I want to optionally exclude myself from an optional component, so that I only pay for coverage I want.

- Traces to: UC-DEP-06 / FR-DEP-06

---

### Eligibility & Relationship Rules

**US-UE-011** — As an **employee**, I want only the relationship types my policy allows to be selectable, so that I do not add ineligible dependents.

- Traces to: UC-ELIG-01 / FR-ELIG-01

**US-UE-012** — As an **employee**, I want the number of dependents per relationship capped to what my policy allows, so that I stay within policy limits.

- Traces to: UC-ELIG-02 / FR-ELIG-02

**US-UE-013** — As an **employee**, I want parent / in-law and gender combinations enforced per my policy's rules, so that only valid family structures are covered.

- Traces to: UC-ELIG-03 / FR-ELIG-03

---

### Age & Multiple-Birth Rules

**US-UE-014** — As an **employee**, I want dependent ages validated against the policy's age bands and age-gap rules, so that only eligible dependents are added.

- Traces to: UC-AGE-01 / FR-AGE-01

**US-UE-015** — As an **employee** with a studying son or unmarried daughter, I want the policy's age extension applied with an explicit confirmation, so that I can cover them beyond the base age limit when the policy allows it.

- Traces to: UC-AGE-02 / FR-AGE-02

**US-UE-016** — As an **employee** with twins or triplets, I want to add multiple children sharing a birth event when the policy permits, so that all my children born together are covered.

- Traces to: UC-AGE-03 / FR-TWIN-01

---

### Premium & GST

**US-UE-017** — As an **employee**, I want the premium to reflect the number of covered members (per-life pricing) where the policy uses it, so that the cost is accurate for my family size.

- Traces to: UC-PREM-01 / FR-PREM-02

**US-UE-018** — As an **employee**, I want GST shown on my contribution when my policy applies it, so that I see the true amount I will pay.

- Traces to: UC-PREM-02 / FR-GST-01

---

### Summary, Verification & Submission

**US-UE-019** — As an **employee**, I want a combined summary of all my selections, covered members, cost, and declarations before I submit, so that I can review everything in one place.

- Traces to: UC-SUB-01 / FR-SUM-01

**US-UE-020** — As an **employee**, I want to save my progress and exit, so that I can resume later without submitting.

- Traces to: UC-SUB-02 / FR-SAVE-01

**US-UE-021** — As an **employee**, I want to verify my identity via an OTP before my enrollment is submitted, so that my submission is authenticated.

- Traces to: UC-SUB-03 / FR-OTP-01

**US-UE-022** — As an **employee**, I want a confirmation with a reference number after submitting, so that I have proof and a reference for follow-up.

- Traces to: UC-SUB-04 / FR-CONF-02

**US-UE-023** — As an **employee** whose enrollment is locked, I want the flow to open directly to a read-only summary, so that I can review what I submitted without editing.

- Traces to: UC-SUB-05 / FR-VIEW-01

---

## Business Rules

The rules below govern the flow state machine, selection, dependent eligibility, premium, verification, and submission. They are derived directly from the implemented logic and must be preserved in any future change.

---

### Flow & View State

**BR-UE-001 — Two-view state machine + verification overlay**  
The flow runs `EnrollmentStep` = `Configuration` → `Summary` → `success`. `Configuration → Summary` (Continue) is gated on all compulsory components being selected and marks the `selectTopUps` progress step. `Summary → success` (Confirm Enrollment) opens the verification overlay driven by `VerificationStep` = `SelectMethod` → `EnterOtp` → `Success`. The combined **submit** fires on entry to verification Success; the confirmation renders in the same `success` view.

**BR-UE-002 — Auto-open summary**  
The flow opens directly in the Summary view (read-only) when navigated in with `openSummary` route state, or when every policy is `LOCKED` (view-only). This is how the Dashboard's View action lands the employee on a read-only summary.

---

### Component Selection

**BR-UE-003 — Compulsory components auto-selected**  
Components marked compulsory are pre-selected and cannot be deselected. Optional components require an explicit selection. Continue to Summary is blocked until all compulsory selections are made (`hasAllCompulsoryOptionsSelected`).

**BR-UE-004 — Toggle selection, no single-choice auto-default** `(legacy single-policy flow)`  
In the legacy single-policy `EnrollmentFlow`, selecting a sum-insured card toggles it (re-click deselects), and a single-choice accordion does **not** auto-select a default — a default is never pre-committed. Selection uses a pending/committed/dirty model; Cancel reverts to the committed selection or clears it; Continue auto-advances to the next valid accordion (skipping choice-less policies). Read-only mode disables selection, cancel, and enroll and shows only the selected card.

---

### Dependent Management

**BR-UE-005 — Add-dependent gating**  
The Add Dependent action is available only while at least one eligible relationship remains (`canAddMoreDependents`). When every policy-allowed relationship is exhausted, the action is disabled.

**BR-UE-006 — Edit preserves coverage selections**  
Editing a dependent preserves its existing component `choices`; a dependent's coverage changes only via the component checkbox, never as a side effect of editing name/DOB/relationship.

**BR-UE-007 — Same-person merge**  
Adding a dependent that matches an existing one by person (name + DOB + gender) merges their `choices` rather than creating a duplicate row.

**BR-UE-008 — Delete shows impacted choices**  
Removing a dependent opens a confirmation modal listing the coverage components the removal affects, before the dependent is removed.

**BR-UE-009 — Deletability rules (`canDeleteDependent`)**  
Regular dependents are always deletable. **Self** (the employee) is deletable only from explicitly optional components — never from a base/compulsory policy.

**BR-UE-010 — Self-exclusion from optional components**  
The employee can exclude themselves from an optional component; when no members remain on a component, the component is removed from the selection (`onEmployeeExclusionChange` / `onPolicyComponentRemoval`).

**BR-UE-011 — Locked dependents are read-only**  
Dependents flagged as locked (already enrolled / not editable) are rendered read-only, auto-enrolled, and never deletable; they are synced idempotently into the roster.

---

### Eligibility & Relationship Rules

**BR-UE-012 — Eligible relations from policy template**  
The relationships an employee may add are resolved from the policy template per component (base/parental main vs addon, disambiguated by parent id). Relationship names are normalized through alias groups (spouse/partner/wife/husband; parent/father/mother; child/son/daughter) before eligibility is applied.

**BR-UE-013 — Per-relationship `maxCount`**  
The count of dependents per relationship type is capped by the policy's `maxCount` (enforced on dropdown options and checkboxes). Single-select parent relationships (father, mother, father-in-law, mother-in-law) can each be added once. If `maxCount` is missing/non-numeric, capacity is treated as unlimited.

**BR-UE-014 — Parent-combination rules**  
Parent / in-law eligibility is governed by policy constraints: `crossParentsAllowed`, `sameGenderParentsAllowed`, and the male/female-employee cover-parents / cover-in-laws gates. A generic "Parent" selection is constrained to one Male + one Female (via gender-dropdown filtering) unless all cover flags are enabled.

**BR-UE-015 — GMC-only family section**  
The dependent (family) section is shown only for GMC policies that have valid relationship options (`isPolicyGMC && hasValidRelationshipOptions`).

**BR-UE-016 — Parental lock-in note** `Feature-flagged`  
A parental 2-year lock-in note is rendered on any parent-eligible component, gated by `FF_IBP_PARENTAL_LOCK_IN`.

---

### Age & Multiple-Birth Rules

**BR-UE-017 — Age bands & age-gap validation**  
Each relationship has policy-defined min/max age. A parent must be at least `ageGapBetweenParentAndEmployee` years older than the employee; a child must be at most `ageGapBetweenChildrenAndEmployee` years younger. Ages are sourced exclusively from policy configuration; no hardcoded defaults. The DOB field shows the allowed age band as helper text and rejects out-of-band dates inline (disabling Add), and the DOB is cleared/re-validated when the relationship changes.

**BR-UE-018 — Studying-son / unmarried-daughter age extensions**  
When the policy configures `studyingSonAgeExtension` / `unmarriedDaughterAgeExtension`, a son/daughter may exceed the base child max age. Selecting such a dependent shows a confirmation popup (studying-assumption / unmarried-assumption) that the employee must accept.

**BR-UE-019 — Twin / triplet composition**  
Three independent policy flags let children exceed the base `maxCount` by sharing a birth event: `allowFirstChildAsTwin` (eldest pair), `twinsSecondChildAllowed` (youngest pair), `tripletsSecondChildAllowed` (youngest trio). The full set of child DOBs is validated (`isChildDobSetValid`): distinct birth events must not exceed base `maxCount`, and each DOB group must not exceed its cap. An extra (beyond-`maxCount`) child's DOB must match an eligible existing birth event; the DOB field shows helper text naming the allowed birth events. Children sharing a DOB are labelled Twin/Triplet (numbered when multiple groups of a type exist).

**BR-UE-020 — Name validation & DOB masking**  
The dependent name field enforces a Unicode-letter regex (letters, hyphen, apostrophe, spaces; no double spaces; 2–100 chars). Dependent DOBs are masked by default with a per-member reveal (eye) toggle.

---

### Premium & GST

**BR-UE-021 — Premium footer calculator**  
The Configuration footer (`Bottomfooter`) shows plans selected, members covered (self + dependents), total premium, company pays, and your pay — computed over actionable policies (`CAN_ENROLL` / `NOT_STARTED` / `EDIT_ENROLL`), formatted in ₹.

**BR-UE-022 — Per-life member multiplier**  
A component's premium is multiplied by covered-member count only when the component is `premiumPerLife` **and** the policy is GMC. Non-GMC per-life policies remain self-only. Self is counted when the component's eligible relations include "self".

**BR-UE-023 — GST grossing** `Doc-drift`  
GST defaults to a rate of **18%** and is applied to the employee (and company) contribution separately in the Summary. GST is `applicable` unless the policy constraint `gstApplicable === false`, and shown to the employee unless `showGstToEmployee === false`. The summary reports base / GST / total per party. (Company-contribution visibility is additionally gated by the `showCompanyContribution` component flag and the `showEmployeeContribution` constraint.) This logic lives in the `MultiEnrollment` summary, not the legacy `EnrollmentFlow` (which does no GST grossing) — the prior doc placed it in the wrong component.

---

### Verification, Submission & Progress

**BR-UE-024 — OTP method resolution** `Feature-flagged`  
When `FF_MULTI_AUTH` is off, a single `EMAIL_PASSWORD` method is used and **no** OTP methods are derived (see BR-UE-027 no-auth path). When on, auth methods are fetched (`companyAuthConfigBySubdomain`); the allowed verification methods are derived from each password method's two-factor `otpDeliveryMethod` (email / mobile / both).

**BR-UE-025 — OTP send & verify**  
Email OTP: `POST /auth/email-otp/send` then `/auth/email-otp/verify` with `{email, otp, domain}`. Mobile OTP: `POST /auth/phone-otp/send-phone` then `/auth/phone-otp/verify-phone` with `{phoneNumber, otp, domain}`; the phone is formatted (+91). OTP send uses scenario `ENROLLMENT_VERIFICATION`.

**BR-UE-026 — OTP resend cooldown**  
After sending, a resend cooldown (from `resendOtpCooldownSeconds`, default 60s) disables the resend link and counts down; resend re-issues the send. The verified state fires the combined submit.

**BR-UE-027 — No-auth submit path**  
When no verification methods are configured (e.g. `FF_MULTI_AUTH` off), the flow skips OTP entirely: Confirm Enrollment calls submit directly, and on success renders the confirmation.

**BR-UE-028 — Combined save vs submit**  
Both save and submit use a single `PUT /company-employee/policy/combined-enrollment` with `{ employeeId, companyId, action: "save" | "submit", dependents[], combinedChoices[], deletedDependentIds?, disclaimersAccepted? }`. `combinedChoices` is grouped per policy with per-component dedup (newest wins) and filtered to non-`LOCKED`/non-`NOTIFY` policies. **Save & Exit** persists progress and returns to the dashboard. **Submit** (after OTP or via the no-auth path) records `submitEnrollment`, triggers the confirmation mail, and advances to the confirmation view. `disclaimersAccepted` is sent only on submit when non-empty.

**BR-UE-029 — Relationship-group repricing**  
For policies where `configuration.isRelationshipGroup === true`, changing the policy's dependent set triggers a repricing call `POST /company-employee/company-employee-policy-components` with `{ policyId, employeeId, dependents[], isModified }`; the response patches that policy's components and enrollment choices. The call is deduped by a pricing key (relation / relationshipType / gender) and skipped for self-only policies.

**BR-UE-030 — Progress pipeline**  
Progress is tracked against a per-employee `enrollmentBatchKey` (from `GET /company-employee/enrollment-progress/{employeeId}`, stored in `sessionStorage`). Steps are marked via `PUT` enrollment-progress with `{enrollmentBatchKey, stepName, completed}`: `reviewBenefits` (on mount), `selectTopUps` (Continue / save-with-choices / submit), `addDependents` (≥1 dependent / save-with-choices / submit), `submitEnrollment` (submit success), `receiveConfirmation` (confirmation-mail success).

**BR-UE-031 — Confirmation reference & submission count** `Doc-drift`  
On submit, the confirmation captures `referenceNumber` and `submissionCount` from the submit response (falling back to `GET /company-employee/enrollment-submission/latest`), and the orchestrator's `ConfirmationPage` displays "Ref Id" and "Submission #", with a CTA to `/dashboard`. Note: the **legacy** single-policy `ConfirmationPage` (`components/Enrollment/ConfirmationPage`) shows only a static congratulations title + "Go to Dashboard" — no reference number, count, or feature grid. The previous doc revision attributed reference-number/count behavior to that legacy component; corrected — it lives in the orchestrator's `VerifyIdentityFlow/ConfirmationPage`.

**BR-UE-032 — Same-person dependent merge (±1 day DOB)**  
Across policies, dependent records are merged as the same person when name + relation + relationshipType + gender match and DOBs are within ±1 day (`mergeDependentsByPersonFuzzyDob`); their `choices` arrays are merged and the earliest DOB is preferred. A dependent's identity key deliberately excludes the backend `id` (the same person has different ids per policy).

---

## Acceptance Criteria

Each criterion maps to one or more user stories above. Written in Given/When/Then format for QA and client sign-off.

---

**AC-UE-001** (→ US-UE-001, BR-UE-001) `Built`  
**Given** an employee with one or more actionable policies,  
**When** they open `/unified-enrollment`,  
**Then** the Configuration view renders the employee header, per-policy accordions, and the premium footer.

---

**AC-UE-002** (→ US-UE-003, BR-UE-003) `Built`  
**Given** policy components with compulsory and optional sections,  
**When** the accordions render,  
**Then** compulsory components are pre-selected and cannot be deselected, optional components require explicit selection, and Continue to Summary is disabled until all compulsory selections are made.

---

**AC-UE-003** (→ US-UE-002, BR-UE-004) `Built`  
**Given** the legacy single-policy flow,  
**When** the employee clicks a sum-insured card,  
**Then** the card toggles (re-click deselects); a single-option component is not auto-selected; Cancel reverts to the last committed selection.

---

**AC-UE-004** (→ US-UE-005, BR-UE-005) `Built`  
**Given** an eligible relationship remaining,  
**When** the employee opens the dependent form,  
**Then** Add Dependent is enabled; when all policy-allowed relationships are exhausted, the action is disabled.

---

**AC-UE-005** (→ US-UE-006, BR-UE-006) `Built`  
**Given** an existing dependent with coverage selections,  
**When** the employee edits its name/DOB/relationship,  
**Then** the dependent's component `choices` are preserved unchanged.

---

**AC-UE-006** (→ US-UE-007, BR-UE-008) `Built`  
**Given** a dependent with coverage,  
**When** the employee removes it,  
**Then** a confirmation modal lists the coverage components affected before the removal is applied.

---

**AC-UE-007** (→ US-UE-010, BR-UE-009, BR-UE-010) `Built`  
**Given** an optional component that includes the employee,  
**When** the employee excludes themselves,  
**Then** Self is removed from that component; if no members remain, the component is removed from the selection. Self cannot be removed from a base/compulsory policy.

---

**AC-UE-008** (→ US-UE-009, BR-UE-011) `Built`  
**Given** a locked (already enrolled / non-editable) dependent,  
**When** the roster renders,  
**Then** the dependent is shown read-only and cannot be deleted.

---

**AC-UE-009** (→ US-UE-008, BR-UE-032) `Built`  
**Given** the same dependent enrolled on multiple policies,  
**When** the dependent roster renders,  
**Then** the dependent appears once (merged by person, DOB within ±1 day), with choices merged across policies.

---

**AC-UE-010** (→ US-UE-011, US-UE-012, BR-UE-012, BR-UE-013) `Built`  
**Given** a policy's enabled relationships and `maxCount`,  
**When** the relationship dropdown renders,  
**Then** only eligible relationships appear, single-select parents can be added once each, and a relationship at its `maxCount` is not offered (except twin/triplet slots per BR-UE-019).

---

**AC-UE-011** (→ US-UE-013, BR-UE-014) `Built`  
**Given** a policy with parent-combination constraints,  
**When** the employee adds parents/in-laws,  
**Then** the cross-parent, same-gender, and cover-in-laws/parents rules are enforced, and a generic "Parent" is constrained to one Male + one Female unless the cover flags permit otherwise.

---

**AC-UE-012** (→ US-UE-014, BR-UE-017) `Built`  
**Given** a relationship with policy-defined min/max age and age-gap rules,  
**When** the employee enters a DOB,  
**Then** the allowed band shows as helper text and an out-of-band DOB is rejected inline (Add disabled); changing the relationship re-validates or clears the DOB.

---

**AC-UE-013** (→ US-UE-015, BR-UE-018) `Built`  
**Given** a policy with a studying-son / unmarried-daughter age extension,  
**When** the employee adds a son/daughter beyond the base child max age,  
**Then** a confirmation popup (studying / unmarried assumption) is shown and must be accepted before the dependent is added.

---

**AC-UE-014** (→ US-UE-016, BR-UE-019) `Built`  
**Given** a policy that permits twins/triplets,  
**When** the employee adds an extra child beyond base `maxCount`,  
**Then** the child's DOB must match an eligible existing birth event (helper text names it), the full child-DOB set is validated against the group caps, and shared-DOB children are labelled Twin/Triplet.

---

**AC-UE-015** (→ US-UE-017, BR-UE-022) `Built`  
**Given** a GMC policy component priced per-life,  
**When** the premium is computed,  
**Then** it is multiplied by covered-member count (self + matching dependents); non-GMC per-life components remain self-only.

---

**AC-UE-016** (→ US-UE-018, BR-UE-023) `Built`  
**Given** a policy where GST is applicable and shown to the employee,  
**When** the Summary premium banner renders,  
**Then** the employee contribution is grossed by 18% GST and labelled accordingly; when `gstApplicable === false` or `showGstToEmployee === false`, no GST is shown.

---

**AC-UE-017** (→ US-UE-019, BR-UE-001) `Built`  
**Given** valid selections with all compulsory components chosen,  
**When** the employee clicks Continue to Summary,  
**Then** the Summary view renders selected plans, covered members, the premium banner, and declarations, and the `selectTopUps` progress step is recorded.

---

**AC-UE-018** (→ US-UE-020, BR-UE-028) `Built`  
**Given** the employee on Configuration or Summary,  
**When** they click Save & Exit,  
**Then** a `combined-enrollment` PUT with `action:"save"` persists their choices/dependents and the flow returns to the dashboard, without requiring OTP.

---

**AC-UE-019** (→ US-UE-021, BR-UE-024, BR-UE-025, BR-UE-026) `Built`  
**Given** configured verification methods,  
**When** the employee clicks Confirm Enrollment,  
**Then** the method picker opens (email/mobile), sending an OTP; the OTP entry accepts a 6-digit code with a resend cooldown; a correct code advances to Success and fires the combined submit.

---

**AC-UE-020** (→ US-UE-021, BR-UE-027) `Built`  
**Given** no verification methods configured (`FF_MULTI_AUTH` off),  
**When** the employee clicks Confirm Enrollment,  
**Then** OTP is skipped and the combined submit fires directly.

---

**AC-UE-021** (→ US-UE-022, BR-UE-028, BR-UE-030, BR-UE-031) `Built`  
**Given** a successful submit,  
**When** the confirmation renders,  
**Then** it shows the reference number and submission count (with a fallback fetch when absent), the `submitEnrollment` and `receiveConfirmation` progress steps are recorded, and the confirmation-mail trigger fires.

---

**AC-UE-022** (→ US-UE-023, BR-UE-002) `Built`  
**Given** a fully `LOCKED` enrollment (or navigation with `openSummary`),  
**When** the flow opens,  
**Then** it lands directly on the read-only Summary view with editing disabled.

---

**AC-UE-023** (→ US-UE-007, BR-UE-029) `Built`  
**Given** a relationship-group policy (`isRelationshipGroup = true`),  
**When** the employee changes that policy's dependent set,  
**Then** a repricing call refreshes that policy's components and premium; the call is deduped by pricing key and skipped for self-only policies.

---

## Data Contract

This section defines what Unified Enrollment consumes and produces. It does not describe internal implementation — that belongs in the TRD (Stage 40c).

### Consumed by Unified Enrollment

| Source | Shape | Purpose |
|---|---|---|
| `state.policyData.relationDependentData` | policy configs + existing dependents + relationship constraints | Primary policy/config source (`overAllData`) — eligibility, constraints, choices |
| `state.policyData.policiesData` | `employeePolicies` / `enrolledPolicies` (flattened with status) | Actionable-policy resolution, footer stats |
| `GET employeePolicies(employeeId)` + `getRelationDetails(employeeId)` | via `fetchEmployeePolicies` thunk | Loads the two above |
| `GET enrollmentProgress(employeeId)` | progress + `enrollmentBatchKey` | Progress pipeline |
| `useAuthConfig` → `companyAuthConfigBySubdomain(subdomain)` | enabled password methods + 2FA OTP delivery | OTP method resolution |
| `sessionStorage.user` | `{ employeeId, employeeCompanyId, email, phone }` | Identity, OTP masking |
| policy `configuration` | `isRelationshipGroup`, `gstApplicable`, `showGstToEmployee`, `showCompanyContribution`, `premiumPerLife`, relationship constraints (`maxCount`, age, parent-combination, twin/triplet flags) | Selection, pricing, eligibility |

### Produced by Unified Enrollment

| Destination | Shape | Purpose |
|---|---|---|
| `PUT updateEnrollmentData` (`/company-employee/policy/combined-enrollment`) | `{ employeeId, companyId, action, dependents[], combinedChoices[], deletedDependentIds?, disclaimersAccepted? }` | Combined save/submit |
| `POST policyConfigurationByDependents` (`/company-employee/company-employee-policy-components`) | `{ policyId, employeeId, dependents[], isModified }` | Relationship-group repricing |
| `PUT updateEnrollmentProgress(employeeId)` | `{ enrollmentBatchKey, stepName, completed }` | Progress step updates |
| `POST sendEmailOtp` / `verifyEmailOtp`, `sendPhoneOtp` / `verifyPhoneOtp` | `{ email/phoneNumber, otp?, domain, scenario, passwordMethodCode }` | Identity verification |
| `POST enrollmentConfirmation` (`/onboarding/enrollment-confirmation`) | confirmation trigger | Confirmation mail + `receiveConfirmation` |
| `POST getActivityLogs` (`/company-employee/user-activity-log`) | `SUBMITTED_ENROLLMENT` activity | Audit |
| `GET latestEnrollmentSubmissionMeta(employeeId, companyId)` | `{ referenceNumber, submissionCount }` | Confirmation fallback |
| `sessionStorage` | `user`, `enrollment_batch_key_${employeeId}` | Identity + progress batch key |

### Cross-module contract items

- **IBP-DASHBOARD**: consumes the dashboard's navigation state (`openSummary`, `isViewOnly`, `policyInfo`, `source`). The Dashboard is the primary entry point; its CTA resolution and this flow's auto-open-summary (BR-UE-002) must stay aligned.
- **LIFE-EVENTS**: shares the dependent rule engine (`FamilyMembersManagement`, `relationshipFilters`, `policyControlUtils`, `dateValidations`) and reuses `updateEnrollmentData` / `policyConfigurationByDependents`. Any change to the engine or those endpoints must be validated against both modules.
- **auth-service**: the OTP send/verify endpoints and `companyAuthConfigBySubdomain` shape. `FF_MULTI_AUTH` governs whether OTP is required.
- **Policy Configurations module**: authors the relationship/component/constraint/GST configuration this flow reads. Constraint field names (`maxCount`, `isRelationshipGroup`, `gstApplicable`, `showGstToEmployee`, twin/triplet flags, age fields) must remain stable.
- **ibp-service enrollment**: owns the `combined-enrollment`, progress, and submission-meta endpoints and their payload schemas.

---

## Gap Register

Tech Lead reference: every BR tagged `Doc-drift`, `Defect`, `Partial`, or `Feature-flagged`, plus dead-code and doc-mismatch items found during reverse engineering.

| GAP | Group | BRs | Description | Files |
|---|---|---|---|---|
| GAP-UE-01 | Doc-drift | — | The previous PRD/TRD pointed at `pages/MultiEnrollment` + `components/MultiEnrollment/*` as the only tree and cited file paths that did not match; the shared dependent engine in `components/Enrollment/*` was undocumented. Corrected: both trees documented here. | `pages/MultiEnrollment`, `components/Enrollment/*` |
| GAP-UE-02 | Doc-drift | BR-UE-031 | Prior doc attributed "reference number + submission count" to the legacy `components/Enrollment/ConfirmationPage`, which actually renders only a static title. The real behavior is in the orchestrator's `VerifyIdentityFlow/ConfirmationPage`. | `components/Enrollment/ConfirmationPage/index.tsx`, `components/MultiEnrollment/VerifyIdentityFlow/ConfirmationPage/index.tsx` |
| GAP-UE-03 | Cleanup | — | Commented-out dead code: the employee-edit form in `EmployeeDetails.tsx` and the `ConfirmationPage` feature-grid + its orphaned styles in the legacy tree. Remove. | `components/Enrollment/EnrollmentFlow/EmployeeDetails.tsx`, `components/Enrollment/ConfirmationPage/*` |
| GAP-UE-04 | Cleanup | — | Ungated `console.log` / `console.error` in the live path (in addition to the `window.__ENROLL_DEBUG__`-gated `debugLog`). Strip the ungated logs. | `components/Enrollment/EnrollmentFlow/index.tsx`, `FamilyMembersManagement.tsx` |
| GAP-UE-05 | Feature-flagged | BR-UE-016 | The parental lock-in note is gated by `FF_IBP_PARENTAL_LOCK_IN`; confirm the flag's default per environment and whether it should be permanent. | `FamilyMembersManagement.tsx` |
| GAP-UE-06 | Doc-drift | BR-UE-023 | Prior doc placed GST grossing and the footer premium calculator in the legacy `EnrollmentFlow`; both actually live in the `MultiEnrollment` orchestrator (`calculateEnrollmentSummary`, `Bottomfooter`). The legacy flow does no GST grossing. | `pages/MultiEnrollment/index.tsx`, `components/Enrollment/EnrollmentFlow/index.tsx` |

---

## Open Questions

These items were unresolved during reverse engineering and should be answered before Stage 40c (TRD) is finalized.

1. **Legacy single-policy flow** — Is `/enrollment` (the legacy single-policy `EnrollmentFlow` + static `ConfirmationPage`) still a supported route, or is it retained only as the host of the shared dependent engine? If unsupported, should it be retired and the engine relocated? (Product/Tech)
2. **Repricing failure handling** — On a relationship-group repricing failure, does the flow hard-block forward navigation and force a retry (as Life Events specifies), or does it currently allow proceeding with stale pricing? Behavior must be confirmed and, if needed, hardened. (Tech)
3. **GST rate configurability** — The 18% GST rate is hardcoded in the summary calculation. Should it be sourced from configuration for future rate changes? (Product/Tech)
4. **`FF_MULTI_AUTH` default** — With the flag off, submission proceeds with no OTP. Confirm the intended production default and whether OTP-less submission is acceptable for any tenant. (Product/Security)

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
