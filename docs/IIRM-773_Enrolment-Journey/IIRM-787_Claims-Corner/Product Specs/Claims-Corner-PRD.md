# Claims Module — Product Requirements Document

This document specifies the product behavior for the **Claims Corner**, **Claim Intimation**, and **Claim Submission** modules within the IBP Employee Portal. It is written for the IIRM Integrated Benefits Platform (IBP) and is targeted at Product Leads, UI Engineers, QA Engineers, and client stakeholders who need to understand what the module does and how to verify it is working correctly.

The Claims module gives enrolled employees a single place to view their insurance claim history (Claims Corner), file a pre-admission Claim Intimation, and submit a post-treatment claim (Reimbursement). This document covers only the **employee-facing** surfaces. The HR Administrator view of claims is covered separately under the HR Portal Claims PRD.

> **Revision — 4 Jun 2026:** Requirements updated based on meeting with Nithin Krishna Sirigiri, Surya Mohan, Kapil Dikshit, and Neeraj Joshi. Changes include: two-stage claim process (Intimation vs Submission), overnight batch sync with manual refresh, SSO triggers on claim row interactions, TPA Name label, insurer policy number hiding, WhatsApp QR support, dashboard awareness banner, conversational UX, and TPA departure warning. Phase-2 scope added for Claim Intelligence.

---

## Scope

### In Scope

- Dashboard Claims Summary Widget — per-policy claim statistics, coverage utilization, and recent claims displayed inline on the employee dashboard
- **Dashboard Claims Corner awareness banner** — banner promoting Claims Corner with a CTA navigating to Claim Submission
- Claims Corner page — policy-wise claims view, coverage utilization, add-on coverage, premium summary, Life Event CTA, and manual claim status refresh
- **Conversational/interactive Claims Corner UX** — purpose statement, guided action list, and how-to guidance displayed prominently on the page
- **WhatsApp QR code support widget** — scannable QR code with step-by-step usage instructions displayed in Claims Corner
- **Claim Intimation (pre-admission)** — 3-step guided wizard filed before hospital admission; submitted to TPA for pre-authorisation
- **Claim Submission (post-treatment, reimbursement)** — two paths: (a) linked to an existing Claim Intimation with pre-filled data, (b) direct submission with AI-assisted document extraction (Claim Form, Discharge Summary, etc.) followed by TPA API submission
- Policy and dependent selection in both Intimation and Submission flows
- Diagnosis, accident details, and claim amount capture
- Hospital selection (all GMC submissions) and document upload (all claim types)
- Claim summary sidebar updated in real-time as the employee fills the form
- TPA portal SSO redirect from Claims Corner — triggered by clicking claim number, claim status, or TPA name button
- **TPA departure confirmation** — modal informing employee they are leaving the IBP platform before SSO redirect
- Post-submission confirmation trigger (email/notification)

### Out of Scope

- HR Administrator claims listing, filtering, and CSV export (covered in HR Portal Claims PRD)
- Claim detail drill-down page (future scope)
- TPA integration configuration and credential management (ops concern)
- Claims upload batch processing via CRM/Excel (IIRM back-office, not employee-facing)
- GTL death/disability claims (handled offline)
- Non-group claims (covered under iWork module)

### Development Status Note

- **Claim Submission** wizard is an existing feature being extended to support the two-stage process, Path A (intimation-linked), and Path B (AI extraction). Net new behaviors are added on top of the existing foundation.
- **Claim Intimation** is a completely new feature — no existing UX, UI, or backend. Requires full design, build, and development from scratch.

### Deferred

- Claim status real-time push notifications
- Claim re-submission or document addition after initial submission
- FIR copy conditional requirement for accident claims (commented out in code, pending field addition)
- **Claim Intelligence (Phase 2)** — AI-driven validation of submitted diagnosis and services against policy coverage; claimed-vs-accepted amount reconciliation using AI-extracted document data
- **Direct TPA API submission with full AI-extracted details (Phase 2)** — after AI document extraction and Claim Intelligence validation, submit complete claim details directly to TPA API programmatically

---

## User Stories

The following stories cover the two authenticated employee personas: an **Employee** accessing their own claims, and an **HR representative** acting on behalf of an employee (out of scope for this PRD — see HR Portal Claims PRD).

### Dashboard Claims Summary Widget

**US-CLAIMS-001**
> **🟢 Implemented**
As an enrolled employee, I want to see a claims summary widget on my dashboard so that I can monitor my coverage utilization and recent claim status without navigating away.

- Priority: High
- Traces to: Claims Summary on Dashboard — Phase 1 scope

**US-CLAIMS-002**
> **🟢 Implemented**
As an enrolled employee, I want the dashboard claims widget to be hidden when I have no claims so that my dashboard is not cluttered with an empty panel.

- Priority: Medium
- Traces to: Empty state handling requirement

### Claims Corner

**US-CLAIMS-003**
> **🟡 Partial**
As an enrolled employee, I want to see a consolidated view of my insurance claims for all active policies so that I understand my coverage utilization at a glance.

- Priority: High
- Traces to: Employee self-service; core claims visibility requirement

**US-CLAIMS-004**
> **🟡 Partial**
As an enrolled employee, I want to manually trigger a claim status refresh so that I can see the latest live status from my TPA on demand, without waiting for the next overnight sync.

- Priority: High
- Traces to: Manual refresh requirement (4-Jun-2026 meeting); replaces auto-polling behavior

**US-CLAIMS-005**
> **🟢 Implemented**
As an enrolled employee, I want to see a loading indicator while my manual refresh is in progress so that I am not confused about whether the system is responding.

- Priority: Medium
- Traces to: UX requirement; manual refresh loading state

**US-CLAIMS-006**
> **🟢 Implemented**
As an enrolled employee, I want to view add-on coverage details (sub-limits, claimed amounts, available balance) so that I understand my total benefit beyond the base sum insured.

- Priority: Medium
- Traces to: Add-on coverage display requirement

**US-CLAIMS-007**
> **🟢 Implemented**
As an enrolled employee, I want to view my total premium summary (company contribution, employee contribution, tax) so that I understand the cost structure of my coverage.

- Priority: Low
- Traces to: Premium transparency requirement

**US-CLAIMS-008**
> **🟡 Partial**
As an enrolled employee, I want clicking on a claim number, claim status, or the TPA name button to launch my TPA portal via SSO so that I can take detailed action on any claim directly within the TPA system.

- Priority: Medium
- Traces to: TPA Portal SSO requirement; updated to cover all row-level SSO triggers (4-Jun-2026)

**US-CLAIMS-009**
> **🟢 Implemented**
As an enrolled employee, I want to navigate to the Life Event update flow from Claims Corner so that I can update my dependents after a qualifying life event (marriage, childbirth, bereavement).

- Priority: Medium
- Traces to: Life Event dependent management requirement

### Claim Intimation (Pre-Admission)

**US-CLAIMS-010**
> **🟡 Partial** — Wizard steps built for Claim Submission (existing code); Claim Intimation pre-admission equivalent is yet to start.
As an enrolled employee, I want to select the policy and the claimant (self or dependent) in the first step of the claim submission so that the form is pre-scoped to the correct coverage.

- Priority: High
- Traces to: Claim intimation — policy & dependent scoping

**US-CLAIMS-011**
> **🟡 Partial** — Wizard steps built for Claim Submission (existing code); Claim Intimation pre-admission equivalent is yet to start.
As an enrolled employee filing a GMC claim, I want to provide diagnosis details, estimated claim amount, and admission/discharge dates so that the TPA has the information needed to process my Reimbursement claim.

- Priority: High
- Traces to: Claim intimation — GMC diagnosis & claim type

**US-CLAIMS-012**
> **🟡 Partial** — Wizard steps built for Claim Submission (existing code); Claim Intimation pre-admission equivalent is yet to start.
As an enrolled employee filing a GPA claim, I want to provide accident details, estimated amount, date of accident, and place of accident so that the accidental injury claim can be processed.

- Priority: High
- Traces to: Claim intimation — GPA accident details

**US-CLAIMS-013**
> **🟡 Partial** — Wizard steps built for Claim Submission (existing code); Claim Intimation pre-admission equivalent is yet to start.
As an enrolled employee filing a GMC claim, I want to search for and select the hospital where I will be treated so that my claim is associated with the correct facility.

- Priority: High
- Traces to: Claim intimation — hospital search/selection

**US-CLAIMS-014**
> **🟡 Partial** — Wizard steps built for Claim Submission (existing code); Claim Intimation pre-admission equivalent is yet to start.
As an enrolled employee, I want to upload the required claim documents in step 3 so that my submission is complete and actionable by the TPA.

- Priority: High
- Traces to: Claim intimation — document upload

**US-CLAIMS-015**
> **🟡 Partial** — Wizard steps built for Claim Submission (existing code); Claim Intimation pre-admission equivalent is yet to start.
As an enrolled employee, I want to see a real-time Claim Summary sidebar as I fill the form so that I can review my inputs before submitting.

- Priority: Medium
- Traces to: UX requirement — live summary panel

**US-CLAIMS-016**
> **🟡 Partial**
As an enrolled employee, I want to receive a confirmation after submitting my claim so that I have proof the intimation was received.

- Priority: High
- Traces to: Post-submission confirmation requirement

### Claim Submission (Post-Treatment, Reimbursement)

**US-CLAIMS-017**
> **🔴 Yet to start**
As an enrolled employee who has an existing Claim Intimation on file, I want to select that intimation record when submitting a claim so that my policy, claimant, diagnosis, hospital, and admission details are pre-filled and I do not have to re-enter them.

- Priority: High
- Traces to: Linked submission path (Path A) — 4-Jun-2026 meeting

**US-CLAIMS-018**
> **🔴 Yet to start**
As an enrolled employee without a prior Claim Intimation, I want to upload my post-treatment documents (Claim Form, Discharge Summary, etc.) and have the system auto-extract and pre-fill the claim details using AI so that I can submit my reimbursement claim quickly and accurately.

- Priority: High
- Traces to: Direct submission path with AI extraction (Path B) — 4-Jun-2026 meeting

**US-CLAIMS-019**
> **🔴 Yet to start**
As an enrolled employee using AI-assisted direct claim submission, I want the extraction to be accurate enough that I can submit with minimal correction, and I want the ability to re-trigger extraction if the initial result is wrong, so that I am never forced to submit inaccurate data.

- Priority: High
- Traces to: AI extraction quality and re-trigger requirement — 9-Jun-2026
- Note: The AI model, service provider, accepted document types, extractable fields, and confidence thresholds are defined in the Technical Specification (TRD), not this PRD. See AC-CLAIMS-023e for re-trigger acceptance criteria.

### Enrollment Eligibility & Dependent Coverage

**US-CLAIMS-020**
> **🔴 Yet to start**
As an enrolled employee whose new policy has not yet started, I want to see a clear explanation when I try to file a claim so that I understand why submission is not available for that policy and know from which date it will be.

- Priority: High
- Traces to: Enrollment period claim eligibility rule — 9-Jun-2026

**US-CLAIMS-021**
> **🔴 Yet to start**
As an enrolled employee, I want the claimant selector to clearly show when a dependent is awaiting insurer approval so that I am not confused about why I cannot select them and understand the next step.

- Priority: High
- Traces to: Endorsement process dependency on dependent eligibility — 9-Jun-2026
- Cross-module: Depends on Endorsement module approval status

**US-CLAIMS-022**
> **🔴 Yet to start**
As an enrolled employee who has both an existing active policy and a new not-yet-started policy of the same type, I want to see my existing claim history and the new policy card clearly separated in Claims Corner so that I can read historical claims without confusion about the new policy status.

- Priority: High
- Traces to: Claims Corner bifurcation during enrollment period — 9-Jun-2026

**US-CLAIMS-023**
> **🔴 Yet to start**
As an enrolled employee with optional GMC policy components (e.g. Maternity, OPD, Hospital Daily Allowance), I want to claim against a specific component I opted into during enrollment so that the claim amount is validated against that component's sub-limit and not the base sum insured.

- Priority: High
- Traces to: Optional policy component claim eligibility — 9-Jun-2026

### Conversational UX & Support

**US-CLAIMS-024**
> **🔴 Yet to start**
As an enrolled employee visiting Claims Corner, I want the page to explain its purpose, available actions, and how to use it so that I understand what I can do without needing external support.

- Priority: High
- Traces to: Conversational/interactive UX requirement — 4-Jun-2026 meeting

**US-CLAIMS-025**
> **🔴 Yet to start**
As an enrolled employee, I want to scan a QR code in Claims Corner to launch a WhatsApp support chat so that I can ask claims or TPA-related questions directly without leaving the platform.

- Priority: Medium
- Traces to: WhatsApp QR support requirement — 4-Jun-2026 meeting

**US-CLAIMS-026**
> **🔴 Yet to start**
As an enrolled employee, I want to see a banner on my dashboard about Claims Corner so that I am aware of the feature and can navigate directly to Claim Submission from the dashboard.

- Priority: Medium
- Traces to: Dashboard awareness banner — 4-Jun-2026 meeting

**US-CLAIMS-027**
> **🔴 Yet to start**
As an enrolled employee, I want to see a confirmation message informing me I am leaving the IBP platform before being redirected to my TPA's website so that I am not surprised by the external navigation.

- Priority: Medium
- Traces to: TPA portal departure warning — 4-Jun-2026 meeting

---

## Business Rules

Business rules govern the behavior of the module at the data and workflow layer. They are distinct from UX rules, which belong in the acceptance criteria.

**BR-CLAIMS-001 — Policy-scoped claim data**
> **🟢 Implemented**
Claims displayed in Claims Corner are scoped to the logged-in employee and their enrolled dependents. No cross-employee or cross-company data may be shown. Claims are grouped by policy (GMC, GPA, GTL); each policy card uses only its own dataset.

*Example:* An employee enrolled in GMC + GPA sees two separate policy cards with independent coverage figures.
*Edge case:* If a base GMC and a Parent/Top-Up GMC both exist, they are shown as separate cards, Base policy first.

**BR-CLAIMS-002 — Claims sync cadence and manual refresh**
> **🟡 Partial**
Claims data in the IBP database is refreshed via an **overnight batch process** that syncs the previous day's claim records from the TPA. The Claims Corner page does **not** initiate any automatic data sync on page load. Live claim status from the TPA is retrieved only when the employee explicitly clicks the **"Refresh Claim Status"** button. The date range for a manual refresh call is from one year before policy expiry + 1 day to policy expiry date. The "Last Synced At" timestamp shown in the page header reflects the most recent overnight batch sync time.

*Edge case:* If policy number is absent, the Refresh button is hidden for that policy card. There is no rate limit on manual refresh; employees may check status as frequently as they wish.

**BR-CLAIMS-003 — Coverage calculation**
> **🟡 Partial**
Available amount = Sum Insured − Sum of all approved/settled claim amounts. Claimed amount = sum of all claim amounts regardless of status. These values are sourced from TPA data where available, falling back to stored IIRM claims data.

**BR-CLAIMS-004 — GTL exclusion from claim submission**
> **🟡 Partial**
GTL (Group Term Life) policies are excluded from the employee-initiated claim submission flow. The policy selector in Claim Intimation and Claim Submission excludes GTL policies. GTL claims relate to death or disability of the insured; they are always initiated by HR on behalf of the employee (or nominee) through the HR Portal, not the employee portal.

Claims Corner displays GTL claim records as read-only history received from the TPA/IIRM, so the employee (or their family) can see claim status and amounts. No claim submission CTAs are shown on a GTL policy card.

*Note:* The employee-facing Claims Corner shows GTL history for tracking purposes only. Any GTL claim creation or management is handled exclusively by HR in the HR Portal Claims module.

**BR-CLAIMS-005 — All portal submissions are Reimbursement; Cashless is display-only**
> **🟡 Partial**
All claims filed through the IBP employee portal (both Claim Intimation and Claim Submission) are implicitly **Reimbursement** claims. The Cashless / Reimbursement claim type selector is **removed** from the submission wizard. Cashless treatment is arranged directly at the hospital (the employee presents their TPA card at the hospital; the hospital bills the insurer directly). Cashless claim records may subsequently appear in Claims Corner as historical entries received from the TPA, and must be displayed correctly with their claim type label, but no Cashless submission is possible through the portal.

**BR-CLAIMS-006 — Estimated amount cap**
> **🟢 Implemented**
The estimated claim amount entered in step 2 must not exceed the sum insured of the selected policy. If the sum insured is known, validation rejects amounts above it with an explicit message showing the limit.

**BR-CLAIMS-007 — Discharge date ordering**
> **🟢 Implemented**
Proposed Discharge Date must be strictly after the Date of Admission. Same-day is not valid.

**BR-CLAIMS-008 — Document requirements for Reimbursement submissions**
> **🟡 Partial**
Since all portal submissions are Reimbursement (BR-CLAIMS-005), only Reimbursement document requirements apply. The base mandatory documents are Claim Form Part A & B and Final Bill. All other document types are optional.

The document list is **dynamic** based on the policy type and the optional policy component being claimed (see BR-CLAIMS-031). A hardcoded list is a stop-gap for V1 only; the target implementation reads document requirements from policy configuration.

*Edge case:* Cashless claim records shown in Claims Corner history do not require document upload — they are read-only records from the TPA and have no document submission UI.

**BR-CLAIMS-009 — Hospital selection for GMC**
> **🟢 Implemented**
Hospital name is **mandatory for all GMC submissions** (Reimbursement). The employee must either search and select a network hospital or enter hospital details manually. Submit is blocked if hospital name is absent for a GMC claim.

For GPA claims, no hospital section is shown — the claim relates to an accident, not a hospital admission. Hospital details are not required for GPA.

**BR-CLAIMS-010 — Dependent scoping per policy**
> **🟢 Implemented**
When the employee changes the selected policy in step 1, the dependent list updates to show only dependents enrolled under that specific policy. If the previously selected dependent is not in the new list, the dependent selection is cleared.

**BR-CLAIMS-011 — Policy sort order and Top-Up GMC treatment**
> **🟢 Implemented**
In the claim submission policy selector, policies are sorted: GMC (1) → GMC Top-Up (2) → GPA (3). The system defaults to the first available GMC policy on load.

**Top-Up GMC is a separate, independent policy** — not a sub-component of Base GMC. In Step 1:
- Base GMC and Super Top-Up GMC appear as distinct, separately selectable policy entries (e.g. "Base Policy - ES2C Plan" and "Super Top-up - ES2C").
- Each Top-Up policy has its own sum insured, its own members covered, and its own set of optional components. A Parental Top-Up (e.g. "Super Top-up - Parental") is a distinct policy covering only the Parental member — it is not combined with the employee's base policy.
- Optional components (if any) belong to the specific policy they were enrolled under. Components from Base GMC do not appear when Top-Up GMC is selected, and vice versa.
- Submission behavior (3-step wizard, amount validation, hospital section, document upload) is identical for Base GMC and Top-Up GMC. The same wizard flow handles both; the difference is which policy's sum insured and components are used for validation.

**BR-CLAIMS-012 — Confirmation notification and error handling**
> **🟡 Partial**
After a claim submission succeeds and a claim number is returned, the system sends a confirmation notification carrying the key claim details: employee, policy, claimant name and relation, diagnosis, estimated claim amount, admission and discharge dates, and hospital name and location.

**Notification channels:**
- **Email** — always sent to the employee's registered email address.
- **SMS** — sent if a mobile phone number is available on the employee's profile.

The confirmation call is **not fire-and-forget**. If the call fails, a clear, user-friendly error message must be shown in plain English. The message must not expose technical error codes or stack traces. Example: "We couldn't send your claim confirmation. Please contact your HR team if you don't receive confirmation shortly." The employee must always know whether their submission succeeded or failed — ambiguity is not acceptable.

**BR-CLAIMS-013 — File upload constraints**
> **🟢 Implemented**
Accepted formats: PDF, JPG, JPEG, PNG. Maximum file size per file: 5 MB. Multi-file document types (Investigation Reports, Pharmacy Bills, Treatment Daily Sheet) have per-type maximums of 20, 20, and 10 files respectively. Other document types are single-file.

**BR-CLAIMS-014 — Dashboard widget visibility**
> **🟢 Implemented**
The Dashboard Claims Summary widget is not rendered when the employee and all enrolled dependents have zero claim records. Once any claim exists, the widget appears automatically on next dashboard load.

*Example:* A newly enrolled employee with no claims sees no widget. After their first claim is uploaded via IIRM, the widget appears.
*Edge case:* If claims exist for one policy but not another, only the policies with claims render a widget card.

**BR-CLAIMS-015 — GMC combined card on Dashboard vs separate cards on Claims Corner**
> **🟡 Partial**
The Dashboard widget displays GMC base policy and parent policy as a single combined card with distinct bifurcation of calculations (separate rows for base vs. parent within the same card). On the Claims Corner dedicated page, base and parent policies render as separate, independent policy cards. The "Hospital Documents" section visible in some design variants is excluded from both surfaces.

*Example:* Dashboard shows one GMC card with "Base Policy" and "Parent Policy" sub-sections. Claims Corner shows two separate GMC cards.

**BR-CLAIMS-016 — Recent claims display cap**
> **🟡 Partial**
The recent claims list in both the Dashboard widget and Claims Corner is limited to the most recent N claims per policy, sorted by claim date descending. The cap is configurable; current default is 5 per policy. Overflow claims are not shown and there is no "view more" in V1.

**BR-CLAIMS-017 — Claim row displayed fields**
> **🟡 Partial**
Each claim row in the employee-facing view displays: Claim Reference Number, Member Name (Self / Dependent Name), Relation, Claim Requested Date, Claim Amount, Approved Amount, Status, Last Updated At, and TAT (Turnaround Time in days). Hospital-level documents are not shown in the claim row.

**BR-CLAIMS-018 — Last synced timestamp**
> **🟡 Partial**
The Claims Corner page header displays a "Last synced at" timestamp showing the date and time the stored claim data was most recently refreshed. The timestamp reflects the stored-data sync time, not the TPA live-sync completion time. Format: `DD MMM YYYY, HH:MM AM/PM` based on the employee country because we have India, Sri Lanka, Maldives, and Singapore.

**BR-CLAIMS-019 — Insurer policy number must not be displayed**
> **🟡 Partial**
The insurer policy number (as issued by the insurance company and printed on the policy certificate) must not be shown anywhere in the employee-facing application — including Claims Corner, Claim Intimation, Claim Submission, the Dashboard Claims Summary widget, and any other employee-facing screen across the IBP portal. Internal IIRM policy IDs are used for API calls only and must not surface in the UI.

**BR-CLAIMS-020 — TPA name label replaces "TPA Portal"**
> **🔴 Yet to start**
Where the UI previously showed the generic label "TPA Portal," it must now show the actual TPA Name (e.g., "GHPL Portal" for a GHPL-administered policy). The TPA name is sourced from the policy data returned by the TPA integration. If no TPA name is available, fall back to "TPA Portal."

**BR-CLAIMS-021 — TPA SSO triggers**
> **🟡 Partial**
A TPA SSO redirect is triggered when the employee clicks any of the following: (a) a Claim Reference Number in a claim row, (b) a Claim Status badge in a claim row, (c) the TPA Name/Portal button in the policy card header. All three interactions trigger the TPA SSO redirect and open the TPA portal in a new browser tab. The departure confirmation (BR-CLAIMS-022) must fire before the redirect in all three cases.

**BR-CLAIMS-022 — TPA portal departure confirmation**
> **🔴 Yet to start**
Before initiating any TPA SSO redirect, the system must display a departure confirmation modal. The modal must include: the TPA name, a statement that the employee is navigating to an external website, and two actions — "Continue" (proceeds with redirect) and "Cancel" (dismisses the modal without any API call). No redirect call is made unless the employee confirms.

**This rule applies platform-wide.** TPA SSO is triggered from three surfaces in the IBP portal — Claims Corner (claim row / TPA name button), the main navigation header (Claims Corner quick-link), and the Dashboard Benefits section (per-policy card). The departure modal must fire before the redirect on all three surfaces, not just Claims Corner. Any surface that triggers TPA SSO without showing this modal is non-compliant with this rule.

**BR-CLAIMS-023 — Dashboard Claims Corner awareness banner**
> **🔴 Yet to start**
The employee dashboard must display a prominent banner promoting the Claims Corner feature. The banner communicates the purpose of Claims Corner (view claim history, file a claim, check status) and includes a primary CTA. Clicking the CTA navigates the employee to the Claim Submission entry point.

**BR-CLAIMS-024 — Conversational/interactive Claims Corner UX**
> **🔴 Yet to start**
The Claims Corner page must open with a visible introductory section that: (a) states the purpose of the Claims Corner, (b) lists the key actions available to the employee (view claims, file an intimation, submit a claim, refresh claim status, contact TPA), and (c) provides brief how-to guidance for each action. This introductory section is persistently visible and is not hidden after first visit.

**BR-CLAIMS-025 — TPA WhatsApp chat support widget (TPA-conditional)**
> **🔴 Yet to start**
Claims Corner includes a "Chat Support" widget that allows employees to scan a QR code and open a WhatsApp chat directly with their TPA. This feature is **TPA-dependent** — not all TPAs offer WhatsApp support:

- **If the TPA has WhatsApp chat configured** — the widget is shown in Claims Corner. It displays: (a) a heading stating the purpose (chat with your TPA via WhatsApp), (b) the TPA-specific QR code image, (c) numbered step-by-step instructions for scanning, and (d) a brief description of what the employee receives after scanning (e.g. claims status help, document queries).
- **If the TPA does not have WhatsApp chat configured** — the widget is hidden entirely. No empty state or placeholder is shown.

The QR code image URL is **read from TPA configuration** — it is not hardcoded. Each TPA that supports this feature has their own WhatsApp QR configured in the system.

**Existing implementation note:** The Header navigation already has a "Chat Support" Quick Link that opens a modal with a QR code (currently hardcoded to GHPL's WhatsApp QR). The Claims Corner widget follows the same interaction pattern — click/scan → opens TPA WhatsApp chat. The QR modal component from the Header can be reused; the data source must be made dynamic and TPA-driven.

**BR-CLAIMS-026 — Two-stage claim process**
> **🟡 Partial**
The claim process consists of two distinct stages:

1. **Claim Intimation (Pre-Admission)** — Filed before hospital admission. Employee selects policy, specifies claimant, enters diagnosis or accident details, selects hospital (for GMC), and uploads required pre-admission documents. All intimations through the portal are for Reimbursement treatment. The completed intimation is submitted to the TPA to initiate pre-authorisation.
2. **Claim Submission (Post-Treatment, Reimbursement)** — Filed after hospital discharge. Two entry paths:
   - **Path A — Linked submission:** If a Claim Intimation exists for this employee, a list of intimations is shown. Selecting one pre-fills policy, claimant, diagnosis, claim type, hospital, and admission dates. The employee adds post-treatment documents and submits.
   - **Path B — Direct submission:** Employee fills details manually, uploads documents (Claim Form, Discharge Summary, and others). AI reads the uploaded documents and pre-fills extracted claim fields. Employee reviews and confirms the extracted data, then submits via TPA API. On success, the claim number and details are returned and the claim appears in Claims Corner.

**BR-CLAIMS-027 — Claim submission blocked during enrollment period for unstarted policies**
> **🔴 Yet to start**
When an employee's policy is in an active enrollment period (enrollment window is open and the policy start date is in the future), claim submission is blocked for that policy:
- The "File Intimation" and "Submit Claim" CTAs remain visible on the policy card but trigger an inline contextual warning on click rather than navigating to the submission flow.
- The warning must state: (a) the policy has not yet started, (b) claims can only be filed on or after the policy start date, and (c) the exact policy start date.
- **TPA Portal SSO is not blocked** — the employee may still click the TPA Name button to access the TPA portal and view pre-existing records for that policy. The departure modal (BR-CLAIMS-022) still applies.

**Data source (confirmed 9-Jun-2026):** Two fields from existing backend data are sufficient:
- **Policy Start Date** — from Policy Details (`Policy from` field). If current date < Policy Start Date, the policy has not yet started.
- **Enrollment Start Date / Enrollment End Date** — from the active Endorsement record. If current date is between Enrollment Start Date and Enrollment End Date, the enrollment window is open.

The claim block applies when both conditions are true simultaneously: enrollment window is open AND policy has not yet started.

*Example:* New GMC policy start date: 1 Jul 2026. Employee clicks "File Intimation" on 20 Jun 2026 → inline warning: "Your GMC policy is not yet active. Claims can be filed from 1 Jul 2026." TPA portal link remains accessible.
*Edge case:* If the employee has an overlapping active policy of the same type (e.g. a prior GMC still running), that policy is fully claimable. The block applies only to the future-dated policy.

**BR-CLAIMS-028 — Newly added dependents ineligible for claims until endorsement is approved**
> **🔴 Yet to start**
A dependent added via the Life Events or CD Management flow is subject to the Endorsement Process (insurer approval). Until the endorsement is fully approved, that dependent is ineligible for claim submission. The full specification for how dependents are added, the Life Event types supported, and the endorsement flow triggered is in the [Life Events PRD](../../implementation/ibp-service/life-events/IBP-Life%20Events-PRD.md). The Claims module reads the result of that process to determine claimant eligibility.
- The dependent appears in the claimant selection list with a visual "Pending Insurer Approval" indicator (badge or lock icon). They are not hidden from the list.
- Attempting to select a pending-approval dependent as the claimant triggers an inline message: "This dependent's coverage is pending insurer approval. Claims can be filed once the endorsement is approved."
- The claimant selection cannot be confirmed and the wizard cannot advance while a pending dependent is selected.
- Self and all claimable dependents are not affected and remain fully selectable.
- A dependent becomes claimable once the **"Receive Acknowledgement from Insurer" step (Step 4 of 5)** on their Life Event endorsement is marked Completed. This is the insurer approval gate.
- If the endorsement process stalls or is rejected before Step 4 completes, the dependent remains in "Pending Insurer Approval" state and cannot be selected as a claimant.

**Approval gate (confirmed 9-Jun-2026):** The Claims module must read the completion status of the "Receive Acknowledgement from Insurer" step on the endorsement associated with the dependent's Life Event. There is no separate boolean approval flag — the step completion IS the approval signal. The Endorsement module (iWorkEdge) tracks this in 5 sequential steps:
1. Endorsement Request Received
2. Create Endorsement
3. Send Endorsement to Insurer
4. **Receive Acknowledgement from Insurer** ← this step's completion = dependent is claimable
5. Client Confirmation

*Example:* Employee adds a newborn on 1 Jun 2026 via Life Events. Endorsement created. Steps 1–3 complete but Step 4 pending. Filing a GMC claim for the newborn on 5 Jun is blocked. When Step 4 is marked Completed on 15 Jun, the newborn becomes selectable as a claimant.

**BR-CLAIMS-029 — Claims Corner visual bifurcation: active policy vs unstarted enrollment-period policy**
> **🔴 Yet to start**
When an employee has both an active (or recently expired) policy with claim records AND a new not-yet-started policy of the same coverage type, the Claims Corner must display both as clearly separate, visually distinct policy cards. They must never be merged:

1. **Active / historical policy card** — Rendered in the standard style with all claim rows, coverage metrics, Refresh button (if applicable), and all claim submission CTAs enabled. The policy card header shows the active policy period. This card is rendered first.
2. **Unstarted policy card (enrollment period active)** — Rendered in a distinct pending visual style with a "Not yet active" badge prominently shown and the policy start date displayed. No claims rows are shown. Claim submission CTAs are present but trigger the enrollment-period warning on click (BR-CLAIMS-027). A note reads: "Claims available from [Policy Start Date]." Detection logic: current date < Policy Start Date AND current date is within the Enrollment Start Date – Enrollment End Date window of the active Endorsement (confirmed 9-Jun-2026).

Sort order: active/recently expired policy cards first, then future-dated policy cards last, regardless of coverage type.

*Example:* GMC Policy A (Jan–Dec 2025, 3 settled claims) + GMC Policy B (Jul 2026 – Jun 2027, enrollment open). Claims Corner shows: Policy A card (normal, full claims) → Policy B card (pending style, "Not yet active — claims available from 1 Jul 2026").
*Edge case:* If the employee has only a future-dated policy with no active policy, the page renders that single card in pending state with no claims rows and the enrollment-period note.
*Edge case — expired policies:* Claims Corner displays claim records for all policies regardless of how long ago the policy expired. There is no time-based cutoff. An expired GMC policy from 3 years ago will still show its claims if records exist in the system. The policy card is shown in a standard expired style (not the pending style), and all historical claims are listed.

**BR-CLAIMS-030 — Optional GMC policy component claim eligibility**
> **🔴 Yet to start**
A GMC policy may have optional components (e.g. Maternity, OPD, Hospital Daily Allowance) alongside its base coverage. A claim can only be filed against an optional component when ALL of the following conditions are true:

1. **Opted-in during enrollment**: The employee actively selected this component during their enrollment window. Components not opted into are not claimable and must not appear in the claim component selector.
2. **Available balance > ₹0**: The component's sub-limit has not been fully exhausted. If available balance is ₹0, claim submission against that component is blocked.
3. **Waiting period elapsed**: If the component has a configured waiting period (e.g. Maternity typically has a 9-month or policy-defined waiting period), the waiting period end date must have passed. During a waiting period the component is visible but claim submission is blocked with an explanation.

**Claim Submission — Step 2 behaviour with optional components:**
- When a GMC policy with opted-in optional components is selected in Step 1, a **"Claim Category"** selector is added to Step 2, listing the base GMC coverage and each eligible opted-in component (those meeting all 3 conditions above).
- Components that are not opted-in, exhausted, or in a waiting period are excluded from the selector (not shown as disabled options — they simply do not appear).
- The **estimated claim amount** entered in Step 2 is validated against the sub-limit of the selected Claim Category, not the base sum insured. If the entered amount exceeds the component's available balance, validation fails with: "Amount exceeds [Component Name] coverage limit of ₹[available balance]."
- If the selected policy has no opted-in optional components, the Claim Category selector is not shown and validation uses the base sum insured as before (BR-CLAIMS-006).

**Claims Corner — Add-on Coverage section display:**
- Opted-in, active components: shown with sub-limit, total claimed, and available balance.
- Exhausted components: shown with ₹0 available and a "Fully utilised" label.
- Opted-in components in waiting period: shown with sub-limit and a "Waiting period — available from [date]" label.
- Components not opted into: not shown in the employee-facing view.

*Example:* Employee's GMC has 3 optional components — Maternity (opted in, ₹50,000 limit, ₹20,000 used → ₹30,000 available), OPD (not opted in), HDA (opted in, ₹500/day, ₹0 used). In Step 2, Claim Category shows: "Base GMC", "Maternity (₹30,000 available)", "Hospital Daily Allowance". OPD is absent. A Maternity claim for ₹35,000 fails validation with: "Amount exceeds Maternity coverage limit of ₹30,000."
*Edge case:* If the employee partially exhausts a component mid-session (e.g. a prior claim settles while they are filling the form), the validation uses the available balance fetched on page load. A warning may be shown at submit time if the TPA rejects the amount due to an updated balance.

**Data availability confirmed (9-Jun-2026):** Policy Configuration already tracks each optional component as a distinct policy with its own sum insured and opted-in status — confirmed via the enrollment page (see OQ-2 resolution). The "Claim Category" selector in Step 2 is a new UI element requiring design and data contract definition (Tech Lead / UX input still needed for the selector itself).

**BR-CLAIMS-031 — Document list is database-driven per Policy Component**
> **🔴 Yet to start**
The list of documents shown in Step 3 of Claim Intimation and Claim Submission must be **database-driven**, not hardcoded. The documents required for a claim are determined by the **Policy Component** selected in Steps 1–2.

**Each document entry in the configuration must carry:**
1. **Document name** — the label shown to the employee (e.g. "Claim Form Part A & B", "Discharge Summary")
2. **Required / Optional flag** — whether the document is mandatory before the Submit button enables
3. **Has Template flag** — whether a downloadable blank template exists for this document type:
   - **Has Template = Yes** → the document row shows a "Download Template" link alongside the upload control. The employee can download the blank form, fill it, and upload it. *Example: Claim Form Part A & B.*
   - **Has Template = No** → the document row shows only the upload control. No download link is shown. *Example: Discharge Summary, Final Bill, FIR Copy.*

**Document list is scoped per Policy Component:**
- The same claim type (e.g. GMC Reimbursement) under different components shows different document lists.
- Base GMC documents ≠ Maternity component documents ≠ GPA documents.
- Documents are not inherited across components unless explicitly configured.

*Example — Base GMC Reimbursement:*
| Document | Required | Template |
|---|---|---|
| Claim Form Part A & B | Required | Download Template + Upload |
| Discharge Summary | Required | Upload only |
| Final Bill | Required | Upload only |
| Investigation Reports | Optional | Upload only |

*Example — GPA (Accident):*
| Document | Required | Template |
|---|---|---|
| Claim Form | Required | Download Template + Upload |
| Accident Certificate | Required | Upload only |
| FIR Copy | Optional | Upload only |
| Medical Records | Required | Upload only |

**Current status (confirmed 9-Jun-2026):** The document requirements configuration table **does not currently exist** in the database. The current V1 implementation is hardcoded in the frontend. This is a **net new build item**:
1. Design the configuration schema: Policy Component → [{ documentName, required, hasTemplate, templateFileRef }]
2. Build the configuration table and admin UI in Policy Configuration (iWorkEdge)
3. Expose via API for the Claims wizard to consume

Until the database-driven config is built, the V1 hardcoded list is the stop-gap. The V1 list must still follow the Has Template rule above for documents that have known templates (Claim Form Part A & B).

**BR-CLAIMS-032 — Club SI flag for optional component sum insured pooling**
> **🔴 Yet to start**
Some GMC policies have a **"Club SI"** flag configured in Policy Configuration. When the Club SI flag is on, the sum insured is shared (pooled) across the base policy and all its optional components — the employee can use the entire pool for any claim regardless of which component it falls under. When the Club SI flag is off, each component has its own isolated sum insured and claims are validated against the individual component's SI only.

The "Claim Category" selector (BR-CLAIMS-030) must respect this flag:
- **Club SI on** → Show "Claim Category" selector but validate the entered amount against the combined remaining pool SI, not the individual component sub-limit.
- **Club SI off** → Show "Claim Category" selector and validate against the selected component's available balance only.

**Confirmed available (9-Jun-2026):** Both data points are present in Policy Configuration:
- **Club Sum Insured flag** — visible on the Policy Template screen as "Club Sum Insured: No / Yes". The current example policy has this set to No (independent SI per component).
- **Per-component SI amounts** — configured on the Policy Components screen. Each component (Base Policy, Parental Optional, Super Top-Up Optional, etc.) has its own list of SI amount options. These are available to read at claim time.

**BR-CLAIMS-033 — Claim Intimation record displayed in Claims Corner**
> **🔴 Yet to start**
A successfully submitted Claim Intimation appears as a claim record in the employee's claim history in Claims Corner — it is not a separate list or a separate section. The record is displayed like a standard claim row with the following distinction:

- Where a standard claim row shows a "Claimed Amount," a Claim Intimation record shows a **"Claim Initiated"** label in place of the amount (since the actual claimed amount is not yet confirmed at intimation stage).
- The status reflects the intimation state (e.g. "Intimation Submitted," "Pending TPA Response") until the corresponding Claim Submission is processed.

When the employee later files a linked Claim Submission (Path A), the intimation record transitions to a full claim record with the actual claimed and approved amounts populated.

**BR-CLAIMS-034 — Available balance displayed to employees must never be negative**
> **🔴 Yet to start**
Regardless of the underlying data received from the TPA or Policy Configuration, the employee-facing display of any available balance (base sum insured available, optional component available balance, or add-on coverage available) must be floored at ₹0.

- If a TPA sync or data integration returns a negative available balance (e.g. due to a claim processing timing issue, data lag, or integration error), the UI must display ₹0, not the negative value.
- This is a display-layer rule. The raw negative value is not written back to the database or forwarded to the TPA; it is only suppressed in the rendered output.
- The ₹0 floor applies to: the main policy coverage available balance, each optional component's available balance, and any add-on coverage available balance shown in the Claims Corner.

*Rationale:* Displaying a negative balance (e.g. "₹−5,000 available") would be meaningless and alarming to employees. Data integrity errors in the TPA sync must not surface as confusing UI states.

---

## Acceptance Criteria

All criteria follow Given/When/Then format. These are the client sign-off criteria for each user story.

---

### AC-CLAIMS-001 — Policy-wise claims view
> **🟡 Partial**

**AC-CLAIMS-001a**
Given an employee is authenticated and has at least one enrolled policy with claims data,
When they navigate to `/claims-corner`,
Then the system displays one policy card per enrolled policy, each showing: policy type (GMC/GPA/GTL), policy expiry, sum insured, available amount, total claimed, claim status counts (total/settled/pending), and a list of individual claims with member name, relation, claim number, claim requested date, claim amount, approved amount, status, last updated at, and TAT. The insurer policy number is NOT displayed. The "Last synced at" timestamp is displayed in the page header.

**AC-CLAIMS-001b**
Given an employee has no claims data across any enrolled policy,
When they navigate to `/claims-corner`,
Then the system displays an empty state with the message "No claims found" and a subtitle encouraging the employee about their health.

**AC-CLAIMS-001c**
Given an employee has multiple policy types (e.g. GMC + GPA),
When the Claims Corner loads,
Then each policy is shown as a separate card; no data from one policy is merged into another.

---

### AC-CLAIMS-002 — Manual claim status refresh
> **🔴 Yet to start**

**AC-CLAIMS-002a**
Given an employee's policy has a policy number,
When the Claims Corner page loads,
Then the system does NOT auto-initiate a TPA sync. A "Refresh Claim Status" button is shown per eligible policy card. The "Last Synced At" timestamp in the page header reflects the most recent overnight batch sync time.

**AC-CLAIMS-002b**
Given the employee clicks "Refresh Claim Status" for a policy,
When the manual TPA sync call returns claims,
Then the Claims Corner updates the live claims section for that policy card with the returned claims, showing patient name, claim ID, registration date, claim amount, approved amount, and claim status.

**AC-CLAIMS-002c**
Given the employee clicks "Refresh Claim Status",
When the refresh is in progress,
Then the "Refresh Claim Status" button is replaced with a spinner/loading state and a "Refreshing…" label. The button is disabled until the API call resolves. The rest of the UI remains interactive.

**AC-CLAIMS-002d**
Given a policy has no policy number,
When the Claims Corner renders that policy card,
Then no "Refresh Claim Status" button is shown for that card.

**AC-CLAIMS-002e**
Given the employee clicks "Refresh Claim Status" and the manual TPA sync returns no claims,
When the refresh state changes to done,
Then the loading state is cleared and the TPA claims section for that policy shows an empty state message.

**AC-CLAIMS-002f**
Given the employee clicks "Refresh Claim Status" and the TPA sync call times out or returns a server error,
When the failure is caught,
Then the loading state is cleared, the Refresh button is re-enabled, and the toast error message (MSG-023) is shown. The "Last Synced At" timestamp in the page header is NOT updated — it continues to reflect the last successful overnight batch sync time.

**AC-CLAIMS-002g**
Given the employee clicks "Refresh Claim Status" multiple times in rapid succession,
When the second click fires while the first call is already in progress,
Then only one API call is active at a time. The button remains disabled while a call is in progress, preventing duplicate concurrent requests.

---

### AC-CLAIMS-004 — Add-on coverage display
> **🟢 Implemented**

**AC-CLAIMS-004a**
Given a policy has add-on coverage configured (e.g. Maternity, Hospital Daily Allowance),
When the Claims Corner displays that policy,
Then an "Add-on Coverage" section appears below the main claims summary, showing each add-on with: title, subtitle, total coverage (or per-day limit if applicable), claimed amount, and available balance.

**AC-CLAIMS-004b**
Given a policy has no add-ons,
When the Claims Corner renders that policy,
Then the Add-on Coverage section is not shown.

---

### AC-CLAIMS-005 — Premium summary
> **🟢 Implemented**

**AC-CLAIMS-005a**
Given a policy has premium summary data available,
When the Claims Corner renders that policy,
Then a Premium Summary card is shown with: total premium, company contribution, employee (your) contribution, and tax — all formatted as ₹ amounts in Indian locale.

---

### AC-CLAIMS-006 — TPA SSO and portal navigation
> **🟡 Partial**

**AC-CLAIMS-006a**
Given an employee is on the Claims Corner page,
When they click a Claim Reference Number, a Claim Status badge, or the TPA Name button,
Then a departure confirmation modal is shown displaying: "You are navigating to [TPA Name] website. Do you want to continue?" with "Continue" and "Cancel" actions.

**AC-CLAIMS-006b**
Given the departure confirmation modal is displayed,
When the employee clicks "Continue",
Then the modal closes, a new browser tab opens, the TPA SSO service is called, and the tab redirects to the TPA portal.

**AC-CLAIMS-006c**
Given the departure confirmation modal is displayed,
When the employee clicks "Cancel",
Then the modal closes. No SSO request is made and the employee remains on Claims Corner.

**AC-CLAIMS-006d**
Given the TPA SSO service returns an error or no redirect URL,
When the redirect fails,
Then the new tab is closed and a toast error message is shown in the original tab.

**AC-CLAIMS-006e — TPA name label**
Given a policy card has a non-empty TPA name in the policy data,
When the Claims Corner renders the policy card header,
Then the portal button/label shows the TPA name (e.g. "GHPL Portal") rather than the generic "TPA Portal". If no TPA name is available, the fallback label "TPA Portal" is used.

**AC-CLAIMS-006f — Departure modal applies platform-wide**
Given an employee triggers TPA portal navigation from any surface in the application — including the Header navigation quick-link or the Dashboard Benefits section — and not only from Claims Corner,
When the navigation is triggered,
Then the same departure confirmation modal (BR-CLAIMS-022) must appear before any SSO redirect is executed, regardless of which surface initiated the navigation.

---

### AC-CLAIMS-007 — Life Event CTA
> **🟢 Implemented**

**AC-CLAIMS-007a**
Given the Life Events feature flag is enabled and the employee has at least one qualifying policy,
When they click "Update now" on the Life Event card,
Then the user is navigated to `/life-events`.

**AC-CLAIMS-007b**
Given the Life Events feature flag is disabled or the employee has no qualifying policy,
When they click "Update now",
Then a toast error message is displayed: "The Life Events feature can be accessed only after the enrolment period is completed."

---

### AC-CLAIMS-008 
> **🟡 Partial** — Wizard steps built for Claim Submission (existing code); Claim Intimation pre-admission equivalent is yet to start.

**AC-CLAIMS-008a**
Given an employee has multiple enrolled policies (GMC + GPA),
When they land on `/claims-intimation` Step 1,
Then the system displays policy cards for GMC and GPA (GTL excluded). The GMC policy card is auto-selected. Dependent cards show Self and all enrolled dependents with: name, relation, date of birth, and enrolled policies count.

**AC-CLAIMS-008b**
Given the employee selects a different policy (e.g. GPA),
When the policy changes,
Then the dependent list updates to show only dependents enrolled under the GPA policy. If the previously selected dependent is not in this list, the dependent selection is cleared.

**AC-CLAIMS-008c**
Given neither a policy nor a dependent has been selected,
When the employee tries to click "Continue",
Then the system shows inline errors: "Please select a policy" and/or "Please select who you are intimating for". Navigation to step 2 is blocked.

---

### AC-CLAIMS-009 — GMC diagnosis & claim details (Step 2)
> **🟡 Partial**

**AC-CLAIMS-009a**
Given a GMC policy is selected,
When step 2 loads,
Then the system shows: Description text field, Estimated Claim Amount field, Date of Admission date picker, and Proposed Discharge Date date picker. No Cashless/Reimbursement claim type selector is shown — all portal submissions are Reimbursement. If the policy has eligible opted-in optional components, a "Claim Category" selector is shown above the fields (see AC-CLAIMS-027a).

**AC-CLAIMS-009b**
Given the employee enters an estimated claim amount that exceeds the applicable sum insured (base SI, or component SI if a Claim Category is selected and the Club SI flag is off),
When they try to advance past step 2,
Then validation fails with the message: "Amount should not exceed the sum insured of ₹[X]."

**AC-CLAIMS-009c**
Given a Proposed Discharge Date equal to or before the Date of Admission,
When the employee tries to advance,
Then validation fails with: "Proposed Discharge Date must be after Date of Admission."

---

### AC-CLAIMS-010 
> **🟡 Partial** — Wizard steps built for Claim Submission (existing code); Claim Intimation pre-admission equivalent is yet to start.

**AC-CLAIMS-010a**
Given a GPA policy is selected,
When step 2 loads,
Then the heading changes to "Accident & Claim Details" and the fields shown are: Accident Details (text), Estimated Claim Amount, Date of Accident, Place of Accident. Claim Type selector is not shown.

**AC-CLAIMS-010b**
Given all four GPA fields are filled with valid data,
When the employee clicks "Continue",
Then they advance to step 3 without errors.

**AC-CLAIMS-010c**
Given the employee enters a Date of Accident that is in the future,
When they try to advance past step 2,
Then validation fails with the message: "Date of Accident cannot be a future date." The Continue button is disabled until a valid past or present date is entered.

---

### AC-CLAIMS-011 
> **🟡 Partial** — Wizard steps built for Claim Submission (existing code); Claim Intimation pre-admission equivalent is yet to start.

**AC-CLAIMS-011a**
Given a GMC policy is selected and the employee is on step 3,
When the Hospital Details section renders,
Then a hospital search input is displayed. The employee can search for a network hospital by name; selecting one auto-fills Hospital Name, Location, City, State, Pincode, Country, Email, and Phone.

**AC-CLAIMS-011b**
Given the employee cannot find their hospital in search results,
When they manually enter hospital details (Name, Country, State, City, Location, Pincode),
Then the Hospital Name field becomes required. Country, State, and City are cascading dropdowns (Country → State → City).

**AC-CLAIMS-011c**
Given no hospital name is entered for a GMC claim (both Reimbursement and any future claim type),
When the employee tries to submit,
Then the submit button is disabled and the error "Hospital name is required" is set on the field. This applies to all GMC submissions — hospital entry is mandatory regardless of treatment type.

**AC-CLAIMS-011d**
Given the employee types a hospital name in the search field and the search returns zero results,
When the empty result set is displayed,
Then an empty state message appears below the search field (e.g. "No hospitals found. You may enter the details manually below.") and the manual entry fields remain visible and enabled so the employee can proceed without a network hospital selection.

---

### AC-CLAIMS-012 — Document upload (Step 3)
> **🟡 Partial**

**AC-CLAIMS-012a**
Given a claim is being submitted (all portal submissions are Reimbursement),
When step 3 loads,
Then the document checklist is loaded dynamically based on the policy type and selected Claim Category (per BR-CLAIMS-031). For a base GMC Reimbursement claim, the checklist includes "Claim Form Part A & B" (required) and "Final Bill" (required) along with optional document types. Submit is disabled until all mandatory documents are uploaded.

**AC-CLAIMS-012b — Dynamic document list by claim category**
Given the employee has selected an optional component as the Claim Category (e.g. Maternity),
When step 3 loads,
Then the document checklist shows the document types configured for that component in Policy Configuration, not the generic GMC Reimbursement list. The required/optional status per document also reflects the component-specific configuration.

**AC-CLAIMS-012c**
Given the employee uploads a file larger than 5 MB,
When the upload is attempted,
Then an error message is shown: "[filename] exceeds 5 MB limit." No upload request is sent.

**AC-CLAIMS-012d**
Given a file of an unsupported type (e.g. `.docx`) is selected,
When the upload is attempted,
Then an error message is shown: "[filename] is not a supported file type." Supported types are PDF, JPG, JPEG, PNG.

**AC-CLAIMS-012e**
Given a document is successfully uploaded,
When the upload completes,
Then the document row shows a green check icon, the file name, and the upload timestamp. The row also shows View, Replace, and Delete actions.

**AC-CLAIMS-012f**
Given the employee uploads multiple files for a multi-file document type (e.g. Investigation Reports, max 20),
When files are added,
Then each file is appended to the list for that document type. Upload is blocked once the max count is reached.

**AC-CLAIMS-012g**
Given the employee has uploaded one or more documents in step 3 and then navigates back to step 2 (via the "Back" button or step indicator),
When they return to step 3,
Then all previously uploaded documents are still present in the document list — no files are lost due to back-navigation. The upload state is preserved in memory for the duration of the wizard session.

**AC-CLAIMS-012h — Template download for applicable document types**
Given a document type in the Step 3 checklist has a downloadable template configured (e.g. Claim Form Part A & B),
When the document row renders,
Then a "Download Template" link or button is shown alongside the upload control. Clicking it downloads the blank template file. The upload control is also present — the employee fills the template and uploads the completed copy.

**AC-CLAIMS-012i — Upload-only for documents without a template**
Given a document type in the Step 3 checklist does not have a downloadable template configured (e.g. Discharge Summary, Final Bill, FIR Copy),
When the document row renders,
Then only the upload control is shown. No "Download Template" link appears. The row behaves identically to AC-CLAIMS-012e in all other respects.

---

### AC-CLAIMS-013 — Claim Summary sidebar
> **🟡 Partial**

**AC-CLAIMS-013a**
Given the employee is on step 1,
When they select a policy and a dependent,
Then the Claim Summary sidebar updates in real time to show: Policy label, Claimant Name, and Relation.

**AC-CLAIMS-013b**
Given the employee is on step 2,
When they fill Claim Category (if shown), Diagnosis, Admission/Discharge dates,
Then the sidebar updates to reflect: Claim Category (if applicable), Diagnosis, Date of Admission, Date of Release. Claim Type is not shown in the sidebar since all submissions are Reimbursement.

---

### AC-CLAIMS-014 — Submission and confirmation
> **🟡 Partial**

**AC-CLAIMS-014a**
Given all required fields and documents are filled and the employee clicks "Submit",
When the claim submission succeeds and a claim number is returned,
Then the system triggers a confirmation notification. If the confirmation succeeds, the employee is navigated to Claims Corner with a success toast. If the confirmation fails, a plain-English error message is shown: "We couldn't send your claim confirmation. Please contact your HR team if you don't receive confirmation shortly." The employee must not be left in an ambiguous state.

**AC-CLAIMS-014b**
Given the submit API returns an error,
When the failure is caught,
Then the employee remains on step 3 and a user-friendly error message is shown in plain English (e.g. "Your claim submission failed. Please check your details and try again, or contact your HR team."). Technical error codes must not be shown to the employee.

---

### AC-CLAIMS-015 — Dashboard Claims Summary Widget
> **🟡 Partial**

**AC-CLAIMS-015a**
Given an employee has at least one active policy with claims data,
When the dashboard loads,
Then a Claims Summary widget is rendered per policy showing: policy type, policy expiry, sum insured, available amount, total claimed, claim status counts (total/settled/pending), and the most recent N claims per policy. The insurer policy number is NOT displayed. GPA and GTL cards do not show a "Family members covered" section. Hospital document references are not shown.

**AC-CLAIMS-015b**
Given an employee has both a GMC base and a GMC parent policy,
When the dashboard Claims Summary widget renders,
Then both policies appear as a single combined card with clearly separated sub-sections for base and parent — each with independent coverage figures. They are not shown as two separate cards on the dashboard.

**AC-CLAIMS-015c**
Given an employee has only a GMC base policy with no parent policy,
When the dashboard widget renders,
Then only the base policy section is shown within the GMC card. No parent sub-section or placeholder is rendered.

---

### AC-CLAIMS-016 — Widget empty state
> **🟢 Implemented**

**AC-CLAIMS-016a**
Given an employee has enrolled policies but zero claim records across all policies and dependents,
When the dashboard loads,
Then the Claims Summary widget is not rendered. No empty card or placeholder for the widget appears on the dashboard.

**AC-CLAIMS-016b**
Given claims data for the employee is subsequently uploaded to IIRM and synced to IBP,
When the dashboard is refreshed,
Then the Claims Summary widget appears automatically with the newly available claims data.

---

### AC-CLAIMS-017 — Conversational Claims Corner UX
> **🔴 Yet to start**

**AC-CLAIMS-017a**
Given an employee navigates to the Claims Corner page,
When the page renders,
Then an introductory section is prominently displayed above the policy cards, containing: (1) a heading stating the purpose of Claims Corner, (2) a list of available actions (view claims, file an intimation, submit a claim, refresh status, contact TPA via WhatsApp), and (3) brief how-to guidance for each action.

**AC-CLAIMS-017b**
Given the employee has used Claims Corner before (a prior visit in session),
When they return to the Claims Corner page,
Then the introductory section is still visible — it is not collapsed or hidden based on visit history.

---

### AC-CLAIMS-018 — TPA WhatsApp chat support widget
> **🔴 Yet to start**

**AC-CLAIMS-018a — TPA-conditional display**
Given the employee is on the Claims Corner page and their TPA has a WhatsApp chat feature configured (TPA WhatsApp QR URL is present in TPA configuration),
When the page renders,
Then the Chat Support widget is visible. It contains: (1) a heading stating they can chat with their TPA via WhatsApp, (2) the TPA-specific QR code image loaded from TPA configuration, (3) numbered step-by-step instructions for scanning, and (4) a description of what help is available after scanning.

**AC-CLAIMS-018b — Widget hidden when TPA has no WhatsApp support**
Given the employee is on the Claims Corner page and their TPA does not have a WhatsApp chat feature configured (no QR URL in TPA configuration),
When the page renders,
Then the Chat Support widget is not shown at all. No placeholder, no empty card, and no fallback text appears in its place.

**AC-CLAIMS-018c — Scanning opens TPA WhatsApp chat**
Given the widget is visible and the employee scans the QR code with a phone camera app,
When WhatsApp opens,
Then the employee is taken directly into a WhatsApp chat with the TPA's configured support number.

**AC-CLAIMS-018d — Mobile deep-link replaces QR**
Given an employee is accessing the Claims Corner from a mobile device (viewport width below the desktop breakpoint) and their TPA has WhatsApp chat configured,
When the Chat Support widget renders,
Then the QR code image is replaced by a "Chat on WhatsApp" deep-link button that opens the TPA's WhatsApp number directly in the WhatsApp app. The QR code is not shown on mobile because it cannot be scanned from the same device.

---

### AC-CLAIMS-019 — Dashboard Claims Corner awareness banner
> **🔴 Yet to start**

**AC-CLAIMS-019a**
Given an enrolled employee logs in and views the dashboard,
When the dashboard loads,
Then a Claims Corner awareness banner is rendered on the dashboard. The banner contains a description of the Claims Corner feature and a primary CTA button.

**AC-CLAIMS-019b**
Given the Claims Corner banner is visible on the dashboard,
When the employee clicks the CTA button,
Then they are navigated to the Claim Submission entry page.

**AC-CLAIMS-019c**
Given an employee has previously dismissed the Claims Corner banner,
When they log out and log back in (or return in a new browser session),
Then the banner remains dismissed. The dismissed state is persisted across sessions (not reset on logout) so the employee is not repeatedly shown a banner they have already acted on.

---

### AC-CLAIMS-021 — Claim Intimation (pre-admission)
> **🟡 Partial**

**AC-CLAIMS-021a**
Given an employee wants to file a Claim Intimation before hospital admission,
When they navigate to the Claim Intimation flow,
Then a 3-step wizard is displayed: Step 1 — policy and claimant selection; Step 2 — diagnosis or accident details; Step 3 — required pre-admission document upload. For GMC claims, Step 3 also includes a hospital selection section above the document upload. For GPA claims, Step 3 shows document upload only — no hospital section is shown. No Claim Submission document types (e.g. Final Bill, Discharge Summary) are shown.

**AC-CLAIMS-021b**
Given all required steps are completed and the employee submits the Claim Intimation,
When the TPA submission succeeds,
Then the employee sees a success confirmation and the intimation is listed in Claims Corner.

---

### AC-CLAIMS-022 — Claim Submission linked to existing intimation (Path A)
> **🔴 Yet to start**

**AC-CLAIMS-022a**
Given the employee has one or more existing Claim Intimation records,
When they start a Claim Submission,
Then a list of their existing Claim Intimations is shown. Each entry displays the intimation reference, policy, claimant, and date. The employee can select one to continue.

> ⚠️ **Pending UX** — The display format for the intimations list (table, cards, search/filter) and whether already-linked intimations are shown or hidden must be decided with the UX team before development begins.

**AC-CLAIMS-022b**
Given the employee selects an existing Claim Intimation,
When the Claim Submission form loads,
Then the following fields are pre-filled from the intimation: policy, claimant, diagnosis, claim type, hospital details, and date of admission. The employee can review and modify these before adding post-treatment documents and submitting.

**AC-CLAIMS-022c**
Given a Claim Intimation has already been linked to a completed Claim Submission,
When another employee (or the same employee) attempts to start a new Claim Submission and selects that same intimation from the list,
Then the system blocks the selection with an inline message: "This intimation has already been linked to a claim submission. Please select a different intimation or start a new submission." The intimation is not removed from the list but is marked as unavailable.

**AC-CLAIMS-022d**
Given the employee has completed all steps of a Path A Claim Submission and submitted,
When the submission API returns a failure (network error, TPA rejection, or server error),
Then no partial claim record is created in the system. The employee remains on the review step and sees the appropriate error toast. The linked Claim Intimation remains unaffected and is still available for future submission attempts.

---

### AC-CLAIMS-023 — Direct Claim Submission with AI extraction (Path B)
> **🔴 Yet to start**

**AC-CLAIMS-023a**
Given the employee has no prior Claim Intimation and selects direct submission,
When they upload their Claim Form, Discharge Summary, and other supporting documents,
Then the system processes the documents through an AI extraction engine and pre-fills the following fields (to the extent extractable): diagnosis, hospital name, admission and discharge dates, claimed amount, and other structured attributes found in the documents.

**AC-CLAIMS-023b**
Given AI extraction completes and fields are pre-filled,
When the employee reviews the extracted data,
Then each pre-filled field is clearly marked as AI-extracted and editable. The employee can confirm or correct any field before proceeding.

**AC-CLAIMS-023c**
Given the employee confirms the extracted data and submits,
When the TPA API call succeeds,
Then the returned claim number, status, and amounts are shown in a success confirmation and the claim appears in Claims Corner.

**AC-CLAIMS-023d**
Given the TPA API call fails or returns an error,
When the submission error is caught,
Then the employee remains on the review screen and a user-friendly error in plain English is shown. Technical error codes are not displayed.

**AC-CLAIMS-023e — AI re-trigger option**
Given AI extraction has completed and the employee is reviewing the pre-filled data,
When the employee finds the extracted data inaccurate or incomplete,
Then a "Re-extract" or "Try Again" action is available on the review screen. Triggering it re-runs the AI extraction against the same uploaded documents and re-populates the fields. The employee can re-trigger extraction as many times as needed before submitting. The specific AI model or service used for extraction is a TRD decision.

**AC-CLAIMS-023f**
Given the AI extraction call fails (service unavailable, extraction timeout, or unreadable document),
When the failure response is received,
Then the extraction result is explicitly shown as failed — all pre-fill fields remain empty and an inline message informs the employee that automatic extraction was unsuccessful. Manual entry fields are enabled and accessible immediately. The "Re-extract" option remains available if the employee wants to retry.

**AC-CLAIMS-023g**
Given the AI extraction is currently in progress (spinner or loading state shown),
When the employee clicks the "Re-extract" / "Try Again" button again,
Then the button is disabled for the duration of the active call. No second concurrent extraction request is fired. The button re-enables only after the in-progress call completes (successfully or with failure).

**AC-CLAIMS-023h**
Given the employee uploads a file that is not a medical document (e.g. a tax form, a personal photo) or uploads the correct document type but with illegible or corrupt content,
When the AI extraction engine processes it,
Then the system returns an empty or low-confidence result set, not an unhandled error or crash. The employee is shown a message indicating that extraction produced no useful data and is prompted to verify or enter details manually. The submission flow can still be completed via manual entry.

---

### AC-CLAIMS-024 — Enrollment period claim block
> **🔴 Yet to start**

**AC-CLAIMS-024a**
Given an employee's policy has a start date in the future and the enrollment window is active,
When the employee clicks "File Intimation" or "Submit Claim" on that policy card,
Then no navigation to the submission flow occurs. Instead, an inline contextual warning appears on the policy card containing: (1) a statement that the policy is not yet active, (2) the exact policy start date, and (3) confirmation that claims can be filed on or after that date.

**AC-CLAIMS-024b**
Given the enrollment-period warning is active on a policy card,
When the employee clicks the TPA Name button on the same card,
Then the standard departure confirmation modal is shown (AC-CLAIMS-006a) and SSO proceeds normally if confirmed. The enrollment-period block does not apply to TPA portal navigation.

**AC-CLAIMS-024c**
Given a policy's policy start date has been reached (current date ≥ policy start date) and the enrollment window has closed,
When the employee views Claims Corner,
Then the inline enrollment-period warning is no longer shown on that policy card and the claim submission CTAs function without restriction.

**AC-CLAIMS-024d**
Given an employee has both an enrollment-blocked policy and a separate active policy of a different coverage type,
When they navigate to the Claim Intimation or Claim Submission flow,
Then only the active policies are available for selection. The enrollment-blocked policy does not appear in the policy selector.

---

### AC-CLAIMS-025 — Dependent endorsement eligibility
> **🔴 Yet to start**

**AC-CLAIMS-025a**
Given a dependent was added via Life Events or CD Management and their endorsement is pending insurer approval,
When the employee opens the claimant selection step in Claim Intimation or Claim Submission,
Then the pending dependent appears in the claimant list with a visible "Pending Approval" badge or lock icon next to their name. The dependent row is shown, not hidden.

**AC-CLAIMS-025b**
Given a dependent has a "Pending Approval" indicator,
When the employee taps or attempts to select that dependent as the claimant,
Then the system prevents the selection from being confirmed and shows an inline message: "This dependent's coverage is pending insurer approval. Claims can be filed once the endorsement is approved." The Continue button remains disabled.

**AC-CLAIMS-025c**
Given a dependent's endorsement has been approved by the insurer,
When the employee next opens the claimant selection step,
Then the "Pending Approval" indicator is absent and the dependent is fully selectable as a claimant without any restriction.

**AC-CLAIMS-025d**
Given a dependent's endorsement has been rejected by the insurer,
When the employee next opens the claimant selection step,
Then the rejected dependent is either removed from the claimant list entirely or shown in a read-only "Not Covered" state that cannot be selected.

---

### AC-CLAIMS-026 — Claims Corner bifurcation during enrollment period
> **🔴 Yet to start**

**AC-CLAIMS-026a**
Given an employee has an active (or recently expired) policy with at least one claim record AND a new future-dated policy of the same coverage type with enrollment open,
When they navigate to `/claims-corner`,
Then two separate, visually distinct policy cards are shown for that coverage type — one in the standard active style and one in a pending/muted style. They are never merged into a single card.

**AC-CLAIMS-026b**
Given the future-dated policy card is displayed,
When the employee reads the card,
Then it shows: the policy type label, future start and end dates, a "Not yet active" badge, and an informational note: "Claims available from [policyStartDate]". No claim rows are present. Claim submission CTAs are present but show the enrollment warning on click (AC-CLAIMS-024a).

**AC-CLAIMS-026c**
Given the employee has only a future-dated policy with no currently active policy of any type,
When they navigate to `/claims-corner`,
Then the page renders the single pending policy card in the muted style with no claim rows and an explanatory note about when claims will be available. The introductory empty-state message is not shown (the card itself is shown instead).

**AC-CLAIMS-026d**
Given both an active policy card and a future-dated policy card are rendered,
When the page layout is applied,
Then the active/historical policy card appears first (higher in the page), followed by the future-dated policy card, regardless of coverage type. This order is fixed and not user-configurable.

**AC-CLAIMS-026e**
Given a policy has passed its coverage end date and is expired,
When the policy card is rendered in Claims Corner,
Then both the "File Claim" and "File Intimation" CTA buttons are removed from the card entirely — not disabled, not shown in a greyed state, but absent from the DOM. An expired policy card is read-only: claim history is visible, TPA portal navigation remains functional, but no new submission can be initiated.

**AC-CLAIMS-026f**
Given a policy is expired and the TPA returns a data value for available balance that is greater than zero (e.g. due to a data integrity issue or delayed sync),
When the policy card renders the available balance field,
Then the displayed value is ₹0 or the label "N/A" — never a positive figure. The system must not surface misleading coverage figures on an expired policy regardless of what the underlying data says.

---

### AC-CLAIMS-027 — Optional GMC policy component claim eligibility
> **🔴 Yet to start**

**AC-CLAIMS-027a — Opted-in components appear in Claim Category selector**
Given an employee selects a GMC policy in Step 1 of Claim Intimation or Claim Submission, and that policy has at least one opted-in optional component that is not exhausted and not in a waiting period,
When Step 2 loads,
Then a "Claim Category" selector is shown listing the base GMC coverage and each eligible opted-in component with its available balance (e.g. "Maternity — ₹30,000 available"). Components not opted into do not appear in this list.

**AC-CLAIMS-027b — Not opted-in components are absent**
Given the employee's GMC policy includes an optional component that they did not opt into during enrollment,
When the Claim Category selector is shown in Step 2,
Then that component does not appear in the selector at all. It is not shown as a disabled/greyed option — it is simply absent.

**AC-CLAIMS-027c — Amount validated against selected component sub-limit**
Given the employee selects an optional component (e.g. "Maternity") as the Claim Category in Step 2,
When they enter an estimated claim amount that exceeds the component's available balance,
Then validation fails with the message: "Amount exceeds [Component Name] coverage limit of ₹[available balance]." Navigation to Step 3 is blocked until the amount is corrected.

**AC-CLAIMS-027d — Exhausted components are blocked**
Given an optional component has an available balance of ₹0 (fully utilised),
When the employee views the Claim Category selector,
Then the exhausted component does not appear as a selectable option. In Claims Corner, the component is shown in the Add-on Coverage section with ₹0 available and a "Fully utilised" indicator.

**AC-CLAIMS-027e — Waiting period block**
Given an optional component has a waiting period end date that is in the future,
When the employee views the Claim Category selector,
Then the waiting-period component does not appear as a selectable option. In Claims Corner's Add-on Coverage section, the component is shown with sub-limit details and a "Waiting period — available from [waiting period end date]" label.

**AC-CLAIMS-027f — No optional components opted in**
Given the employee's GMC policy has optional components configured but the employee did not opt into any of them during enrollment,
When Step 2 of Claim Intimation or Submission loads,
Then no "Claim Category" selector is shown. Amount validation uses the base sum insured as per BR-CLAIMS-006.

**AC-CLAIMS-027g — Claims Corner Add-on Coverage display**
Given a GMC policy with multiple optional components in various states (opted-in active, exhausted, waiting period),
When the Claims Corner renders the Add-on Coverage section for that policy,
Then: opted-in active components show sub-limit, claimed amount, and available balance; exhausted components show ₹0 available and "Fully utilised"; components in a waiting period show the sub-limit and "Waiting period — available from [date]"; components not opted into are not shown.

---

### AC-CLAIMS-028 — Available balance display floor (BR-CLAIMS-034)
> **🔴 Yet to start**

**AC-CLAIMS-028a**
Given the TPA data for a policy returns an available balance value that is less than zero (negative),
When the Claims Corner renders the coverage summary for that policy,
Then the available balance displayed to the employee shows ₹0, not the negative value. No error state is thrown; the card renders normally with ₹0 as the floor.

**AC-CLAIMS-028b**
Given a policy has an optional component with a negative available balance returned by the TPA sync,
When the Add-on Coverage section renders that component,
Then the component's available balance displays as ₹0. The "Fully utilised" label is applied — the same visual treatment as a zero-balance component.

**AC-CLAIMS-028c**
Given an expired policy returns a non-zero available balance from the TPA (as covered by AC-CLAIMS-026f),
When the policy card renders,
Then the ₹0 floor applies independently of expiry status. The expired policy card rule (AC-CLAIMS-026f) and the negative-value floor rule (this AC) are both active simultaneously — the more restrictive display always wins.

---

## Data Contract

This section defines what the Claims module needs from other parts of the platform and what it produces. It surfaces cross-module dependencies for the roadmap and the Technical Specification (Stage 40b). Shapes are described in product terms — implementation details belong in the TRD.

### What this module needs

| Data needed | Source module | Purpose |
|---|---|---|
| Policy list — type (GMC/GPA/GTL), coverage, sum insured, TPA name, policy start and end dates, enrollment window status | Policy Configuration + TPA Integration | Policy cards in Claims Corner; enrollment period eligibility (BR-CLAIMS-027, BR-CLAIMS-029) |
| Optional component details per policy — opted-in status, sub-limit amount, available balance, waiting period end date | Policy Configuration | Claim Category selector and amount validation in Step 2 (BR-CLAIMS-030, BR-CLAIMS-032) |
| Club SI flag per policy | Policy Configuration | Determines whether SI is pooled or per-component when validating claim amount (BR-CLAIMS-032) |
| Document requirements per Policy Component — list of document types with: required/optional flag, and whether a downloadable template exists for that document type | Policy Configuration ⚠️ **Config table does not exist yet — net new build item; must be designed and built as part of this feature** | Dynamic document checklist in Step 3 (BR-CLAIMS-031); Download Template vs Upload-only behavior per document (AC-CLAIMS-012h, AC-CLAIMS-012i) |
| Dependent list — name, relation, date of birth, and whether their Life Event endorsement has reached "Receive Acknowledgement from Insurer" (Step 4 of 5) status Completed | Endorsement Module (dependents added via Life Events flow — see [Life Events PRD](../../implementation/ibp-service/life-events/IBP-Life%20Events-PRD.md)) | Claimant selection and eligibility gating (BR-CLAIMS-028) |
| Claims history for the employee — all policies, all statuses, overnight batch | TPA Integration → IBP Database | Claims Corner display |
| Live claim status on demand — triggered by employee | TPA Integration | Manual Refresh (BR-CLAIMS-002) |
| TPA SSO redirect URL | TPA Integration | Claims Corner → TPA portal navigation (BR-CLAIMS-021) |
| TPA WhatsApp chat configuration — whether the TPA has WhatsApp support enabled, and if so, the QR code image URL for that TPA | TPA Configuration | Chat Support widget show/hide and QR rendering (BR-CLAIMS-025) |
| Network hospital list — searchable by name | TPA / Hospital Network | Hospital search in Step 3 (BR-CLAIMS-009) |
| Location reference data — countries, states, cities | IIRM Reference Data | Manual hospital entry dropdowns |
| Existing Claim Intimations filed by this employee | Claims Service | Linked submission Path A — intimation selection list (BR-CLAIMS-026) |
| Employee's registered phone number | Employee Profile | SMS confirmation delivery (BR-CLAIMS-012) |
| AI-extracted claim fields from uploaded documents | AI Extraction Service | Path B pre-fill — diagnosis, hospital, dates, amounts (US-CLAIMS-018, US-CLAIMS-019) |

> ⚠️ **Cross-module dependency note** — The claims overview data is consumed independently by three surfaces: Claims Corner, the Dashboard Claims Summary widget, and the Dashboard Benefits section (per-policy claim amount badges). Each makes its own separate data call rather than sharing a single store. Any change to the shape of the claims overview response must be validated across all three consumers, not just Claims Corner. Similarly, TPA SSO is triggered from Claims Corner, the main navigation header, and the Dashboard Benefits section — changes to the SSO flow must be applied consistently in all three locations.

### What this module produces

| Output | Recipient | When |
|---|---|---|
| Claim Intimation record | TPA (pre-authorisation request) | On successful Claim Intimation submission |
| Claim Submission record with attached documents | TPA API | On successful Claim Submission (both paths) |
| Uploaded claim documents | Document Store / Claims Service | During Step 3 document upload (both flows) |
| Confirmation notification — email always; SMS if phone number available | Employee | After each successful submission (BR-CLAIMS-012) |

---

## Open Items

The following UX and UI design items are unresolved. Each one must have a finalized design before the corresponding feature can be built. Items are grouped by surface. The relevant AC or BR reference is noted so the engineer and QA know exactly where to look once the design is ready.

---

### New Screens — Full UX Design Required

These are net-new surfaces with no existing design. Nothing can be built until wireframes and specs are delivered.

| # | Item | Affects |
|---|---|---|
| UI-001 | **Claim Intimation wizard** — 3-step flow (Step 1: Policy & Claimant; Step 2: GMC Diagnosis or GPA Accident details; Step 3: Hospital selection + document upload). Full screen design required. | US-CLAIMS-010–016, BR-CLAIMS-026 |
| UI-002 | **Path B AI extraction review screen** — the screen where AI-extracted claim fields are displayed for employee review and edit. Each field must be visually marked as AI-extracted and editable. Includes the "Re-extract" trigger and failure/empty extraction states. | AC-CLAIMS-023a–023h |

---

### Claim Submission — Path A Intimations List

| # | Item | Affects |
|---|---|---|
| UI-003 | **Intimations list display format** — When the employee has existing intimations, how is the list shown? Options: sortable table, card list, or searchable view. Additional decisions: (a) are already-linked intimations hidden or shown as unavailable? (b) is there a display cap, and if so what is the empty-state when all are linked? | AC-CLAIMS-022a, AC-CLAIMS-022c |

---

### New UI Components — Within Existing Screens

These are new elements to be added to screens that already exist. They need component-level design (states, layout, interaction).

| # | Item | Affects |
|---|---|---|
| UI-004 | **Claim Category selector** — New field in Step 2 of both Claim Intimation and Claim Submission when the employee's GMC policy has eligible optional components. Needs: dropdown vs radio treatment, how the available balance is shown per option, empty state when no components are eligible. | BR-CLAIMS-030, AC-CLAIMS-027a–027f |
| UI-005 | **Document row — Download Template + Upload vs Upload only** — Two visual treatments for document rows in Step 3. "Has template" rows show a Download Template action alongside upload. "No template" rows show upload only. Needs a design that makes the distinction clear without cluttering the checklist. | BR-CLAIMS-031, AC-CLAIMS-012h, AC-CLAIMS-012i |
| UI-006 | **Chat Support widget — TPA-conditional design** — The widget shows only when the TPA has WhatsApp chat configured. Needs: (a) desktop layout of the widget within Claims Corner (heading + QR + instructions); (b) mobile treatment — QR replaced by a "Chat on WhatsApp" deep-link button with the responsive breakpoint defined; (c) no placeholder when TPA has no WhatsApp (confirm the layout doesn't leave a gap). Note: the Header "Chat Support" Quick Link modal is the existing reference pattern — same interaction, same QR modal component. | BR-CLAIMS-025, AC-CLAIMS-018a–018d |

---

### Claims Corner Page — Visual Treatment Changes

| # | Item | Affects |
|---|---|---|
| UI-007 | **Claim Intimation record row** — An intimation that has been submitted appears in Claims Corner as a claim row. Instead of "Claimed Amount," it shows "Claim Initiated." The row must be visually distinguishable from a settled or in-progress claim row. Needs: the label treatment, status badge wording (e.g. "Intimation Submitted"), and how it transitions to a full claim record once the linked submission is processed. | BR-CLAIMS-033, AC-CLAIMS-022a |
| UI-008 | **Future-dated (unstarted) policy card** — A policy where enrollment is open but the start date is in the future is shown in a "pending/muted" visual style with a "Not yet active" badge. Needs: the exact muted style, badge colour and position, and whether it collapses the claims rows section entirely. | BR-CLAIMS-029, AC-CLAIMS-026a–026d |
| UI-009 | **Expired policy card** — An expired policy's "File Claim" and "File Intimation" CTAs are hidden (not disabled). Needs: confirmation of the exact card layout without those CTAs, and whether an expiry notice replaces them or the space is simply removed. | AC-CLAIMS-026e, AC-CLAIMS-026f |

---

### iWorkEdge Admin (Policy Configuration)

| # | Item | Affects |
|---|---|---|
| UI-010 | **Document configuration admin UI** — A new admin interface in Policy Configuration (iWorkEdge) where the IIRM team maps each Policy Component to its required document list (document name, required/optional, has-template flag, template file). Needs: admin screen design, table structure, and upload/edit flows for template files. | BR-CLAIMS-031 |

---

### Product Decisions Required

| # | Item | Affects |
|---|---|---|
| PD-001 | **GTL policy card display treatment** — BR-CLAIMS-004 states GTL claim records are shown as read-only history with no submission CTAs, but the exact visual treatment is unspecified. Decisions needed: (a) Does the GTL card use the same card layout as GMC/GPA with CTAs simply removed, or a distinct read-only card style? (b) Is there a label or notice explaining why no claim can be filed (e.g. "GTL claims are managed by your HR team")? (c) Does the GTL card show all the same columns (claim amount, approved amount, status, TAT) as other policies? | BR-CLAIMS-004, AC-CLAIMS-001a |

---

## Error & Warning Messages

All user-facing messages are catalogued here. Copy must be implemented exactly as written. Any change to wording requires product sign-off. Messages are grouped by type and surface.

---

### Inline Validation (shown near the failing field, blocks progression)

| ID | Trigger | Message |
|---|---|---|
| MSG-001 | No policy selected in Step 1 | "Please select a policy." |
| MSG-002 | No claimant selected in Step 1 | "Please select who you are filing this claim for." |
| MSG-003 | Estimated amount exceeds base sum insured | "Amount should not exceed the sum insured of ₹[X]." |
| MSG-004 | Estimated amount exceeds optional component available balance | "Amount exceeds [Component Name] coverage limit of ₹[available balance]." |
| MSG-005 | Proposed Discharge Date is on or before Date of Admission | "Proposed Discharge Date must be after Date of Admission." |
| MSG-006 | GMC claim submitted without hospital name | "Hospital name is required." |
| MSG-007 | File upload exceeds 5 MB | "[filename] exceeds the 5 MB file size limit." |
| MSG-008 | Unsupported file format uploaded | "[filename] is not a supported file type. Accepted formats: PDF, JPG, JPEG, PNG." |
| MSG-009 | Pending dependent selected as claimant | "This dependent's coverage is pending insurer approval. Claims can be filed once the endorsement is approved." |

---

### Contextual Warnings (inline on policy card or wizard, non-blocking unless noted)

| ID | Trigger | Message |
|---|---|---|
| MSG-010 | Employee clicks "File Intimation" or "Submit Claim" on a not-yet-started policy | "Your [Policy Type] policy is not yet active. Claims can be filed from [policy start date]." |
| MSG-011 | Optional component has ₹0 available balance | "This benefit has been fully utilised." *(shown in Add-on Coverage section)* |
| MSG-012 | Optional component is within waiting period | "Waiting period active — available from [waiting period end date]." *(shown in Add-on Coverage section)* |
| MSG-013 | Employee dismisses the Life Events feature when enrollment is not complete | "The Life Events feature can be accessed only after the enrolment period is completed." |
| MSG-014 | AI extraction returned empty or low-confidence fields | "We couldn't extract all details from your documents. Please review and fill in the highlighted fields manually." |
| MSG-015 | Available balance may be stale at time of submission | "Your available balance may have changed since you opened this form. Please verify before submitting." |

---

### Toast Notifications (dismissible, shown after an action)

| ID | Trigger | Message | Type |
|---|---|---|---|
| MSG-016 | Claim Intimation submitted successfully | "Claim Intimation submitted successfully." | Success |
| MSG-017 | Claim Submission submitted successfully | "Claim submitted successfully." | Success |
| MSG-018 | Manual Refresh returns updated data | "Claim status refreshed successfully." | Success |
| MSG-019 | Claim Intimation submission fails | "Your claim intimation could not be submitted. Please check your details and try again, or contact your HR team." | Error |
| MSG-020 | Claim Submission submission fails | "Your claim submission failed. Please check your details and try again, or contact your HR team." | Error |
| MSG-021 | Confirmation notification fails to send after successful submission | "We couldn't send your claim confirmation. Please contact your HR team if you don't receive confirmation shortly." | Warning |
| MSG-022 | TPA SSO redirect fails | "We couldn't connect to the TPA portal. Please try again or contact your HR team." | Error |
| MSG-023 | Manual Refresh API call fails | "Claim status refresh failed. Please try again." | Error |
| MSG-024 | Document upload fails (network/server error) | "Document upload failed. Please check your connection and try again." | Error |
| MSG-025 | AI re-extraction triggered successfully | "Extracting details from your documents…" | Info |

---

### Modal Messages

| ID | Surface | Message |
|---|---|---|
| MSG-026 | TPA departure confirmation modal | "You are about to leave the IBP platform and navigate to [TPA Name]. Any unsaved changes will not be carried over. Do you want to continue?" |

---

### Email Notification Templates

The following email notifications must be designed and implemented as part of this module. Template files must exist for each before the module goes to QA.

| Template | Trigger | Recipient | Key content |
|---|---|---|---|
| **Claim Intimation Confirmation** | Successful Claim Intimation submission | Employee (+ CC HR if configured) | Policy name, claimant name, diagnosis, estimated amount, admission/discharge dates, hospital name, intimation reference number, next steps |
| **Claim Submission Confirmation** | Successful Claim Submission | Employee (+ CC HR if configured) | Policy name, claimant name, diagnosis, claim amount, hospital name, claim reference number, expected TAT, TPA contact details |

**Claim Intimation Confirmation email template already exists** at `apps/services/notification-service/src/templates/claim-intimation-notification-template.html` (Handlebars format) with its DB seed migration at `claim-intimation-notification-template.sql`. It currently covers GMC (cashless/reimbursement) and GPA (accident) claim types with dynamic sections for hospital details, claim type badge, patient and diagnosis info, and submission summary.

> ⚠️ **Review required** — The existing template references **Cashless** claim type sections (e.g. `{{#if isCashless}}`). Since Cashless has been removed from portal submissions (BR-CLAIMS-005), the template must be audited and those branches removed or updated. Additionally, a **Claim Submission Confirmation** email template (post-treatment, not just intimation) does not yet exist and must be created.

---

## Approval

```
Approved by: Nithin Krishna Sirigiri
Role: TL / Product Owner
Date: 9-June-2026

Approved by: Nithin Krishna Sirigiri
Role: Delivery Manager
Date: 9-June-2026
```
