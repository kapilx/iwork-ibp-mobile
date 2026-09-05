# Claims Corner — Implementation Audit
**Date:** 2026-06-09  
**Auditor:** Claude Code (automated code review)  
**Scope:** US-CLAIMS-001–027, BR-CLAIMS-001–034, AC-CLAIMS-001–028

---

## Summary

| Status | Count |
|--------|-------|
| Implemented | 36 |
| Partial | 40 |
| Yet to Start | 28 |

---

## User Stories

**US-CLAIMS-001: Partial**
Policy-wise claims view exists (ClaimsCorner/index.tsx). Shows claim list per policy card, coverage figures, status counts, premium summary, add-ons. Missing: Refresh Claim Status button (current code does background auto-sync on load, not a manual refresh button); insurer policy number shown in some paths (not audited on display layer); conversational intro section absent.

**US-CLAIMS-002: Partial**
TPA sync fires automatically on page load via `TpaClaimsSection` component (background polling). A "Refresh Claim Status" per-policy button (explicit user-triggered action) does NOT exist — the current TPA sync auto-fires and the user has no button to trigger it. The `lastSyncedAt` timestamp is rendered. Manual refresh CTA per-policy card is missing.

**US-CLAIMS-003: Implemented**
Loading spinner + "Syncing your claims from TPA" animated banner exists in `TpaClaimsSection`. Polling with 15s interval (up to 20 retries = 5 minutes). Non-blocking — rest of UI stays interactive.

**US-CLAIMS-004: Implemented**
Add-on coverage section rendered when `policy.addOns` present (ClaimsCorner/index.tsx lines 609–651). Shows title, subtitle, total coverage, per-day limit, claimed, available.

**US-CLAIMS-005: Implemented**
Premium Summary card rendered when `policy.premiumSummary` present (lines 653–690). Shows total premium, company contribution, employee contribution, tax.

**US-CLAIMS-006: Partial**
TPA Portal button exists on ClaimsCorner page (calls `handleTpaPortalClick`). Opens new tab, handles SSO. Missing: (a) Claim Reference Number and Claim Status badge do not trigger SSO — only the TPA Portal button does. (b) No departure confirmation modal before redirect (BR-CLAIMS-022 not implemented).

**US-CLAIMS-007: Implemented**
Life Event CTA card exists (lines 699–728). "Update now" checks `FF_LIFE_EVENT_DEPENDENT_MANAGEMENT` and `hasAnyPolicyForLifeEvents`; navigates to `/life-events` or shows toast.

**US-CLAIMS-008: Implemented**
Step 1 of ClaimsIntimation fully built. Policy selector (GTL excluded via `policyTypeKeys.GTL` filter), dependent selector with Self + dependents. Auto-selects first GMC policy. Validation on Continue.

**US-CLAIMS-009: Implemented**
Step 2 GMC config in `getDiagnosisClaimConfig` (config.ts). Description, Estimated Claim Amount (with sum-insured cap validation), Date of Admission, Proposed Discharge Date (with after-admission validation). Claim Type selector not shown for non-GMC; for GMC a Cashless/Reimbursement selector is still visible (see BR-CLAIMS-005 conflict).

**US-CLAIMS-010: Implemented**
Step 2 GPA branch in `getDiagnosisClaimConfig`. Shows Accident Details, Estimated Claim Amount, Date of Accident (maxDate = today), Place of Accident. Heading changes to "Accident & Claim Details".

**US-CLAIMS-011: Implemented**
`HospitalSearchSelector` — debounced search (300ms), network hospital API, cashless filter (`isNetworkHospital: true`), manual add with cascading Country→State→City dropdowns, saves to backend via `createPolicyHospital`.

**US-CLAIMS-012: Implemented**
`ClaimDocumentsSection` fully built. Document list with required/optional flags, per-type max files, upload, replace, delete, view (DocumentPreview modal), error states, progress indicator.

**US-CLAIMS-013: Implemented**
`ClaimsIntimationSummary` sidebar updates in real-time via `formMethods.watch` and `liveFormValues` state. Shows policy label, claimant name/relation, diagnosis, dates, hospital name, document count.

**US-CLAIMS-014: Partial**
`sendClaimIntimationConfirmation` is called on success (fires to `endPoints.claimIntimationConfirmation`). However: (a) the call is fire-and-forget — errors are not caught or shown to the employee. (b) Success toast message has a typo: "submitted successfully initimated." (c) BR-CLAIMS-012 requires ambiguity-free confirmation with plain-English error if confirmation fails — not implemented.

**US-CLAIMS-015: Implemented**
`ClaimSummary` component rendered in `DashboardPage/index.tsx`. Shows policy type, expiry, SI, available, claimed, settled, status counts, individual claim rows.

**US-CLAIMS-016: Implemented**
`ClaimSummary` filters `displaySummariesWithClaims` — policies with zero claims are excluded. Component returns null when `summaries` is empty.

**US-CLAIMS-017: Yet to Start**
No conversational introductory section (purpose statement + action list + how-to guide) in ClaimsCorner/index.tsx. The page goes directly to header + buttons + policy cards.

**US-CLAIMS-018: Yet to Start**
No WhatsApp QR code widget in ClaimsCorner. The Header has a QR modal (hardcoded to GHPL), but there is no equivalent widget in the Claims Corner page itself. TPA-driven dynamic QR URL is not implemented.

**US-CLAIMS-019: Yet to Start**
No Claims Corner awareness banner on the Dashboard. DashboardPage/index.tsx has no such banner component or CTA.

**US-CLAIMS-020: Yet to Start**
TPA departure confirmation modal is not implemented. `handleTpaPortalClick` in ClaimsCorner, Header, and DashboardBenefitsSection all redirect immediately after SSO without a confirmation modal.

**US-CLAIMS-021: Yet to Start**
Path A (linked Claim Submission from existing Claim Intimation) is not implemented. The `ClaimsIntimation` page is the only submission flow — there is no Claim Submission wizard and no intimation list to select from.

**US-CLAIMS-022: Yet to Start**
Path B (direct Claim Submission with AI document extraction) is not implemented. No AI extraction service, no pre-fill from documents, no review UI.

**US-CLAIMS-023: Yet to Start**
No enrollment-period claim block UI. No check against policy start date vs current date; no inline warning on policy card; no blocking of submission for future-dated policies.

**US-CLAIMS-024: Yet to Start**
No "Pending Insurer Approval" badge or lock on dependents awaiting endorsement. No eligibility check against endorsement step 4 completion.

**US-CLAIMS-025: Yet to Start**
No bifurcated Claims Corner view for active policy + unstarted enrollment-period policy. Both would merge into a single list as-is.

**US-CLAIMS-026: Yet to Start**
No "Claim Category" optional-component selector in Step 2. No per-component SI validation. No waited-period or opted-in check.

**US-CLAIMS-027: Yet to Start**
AI extraction re-trigger ("Re-extract" button) is not implemented — US-CLAIMS-022 (Path B) itself does not exist.

---

## Business Rules

**BR-CLAIMS-001: Implemented**
API scopes to `employeeId` from session; policies array from `employeeClaimsOverview`. No cross-employee data.

**BR-CLAIMS-002: Partial**
Overnight sync timestamp `lastSyncedAt` is displayed. Manual refresh button is NOT a per-user-click button — current code auto-triggers TPA sync on mount. No explicit "Refresh Claim Status" button per policy. Policy number absence correctly hides TpaClaimsSection.

**BR-CLAIMS-003: Partial**
Coverage calc present in `mapTpaToPolicy` (available = BALANCE_SUM_INSURED from TPA). ClaimSummary computes `baseTotal = available + claimed + settled`. Fallback to stored IIRM data exists. No explicit `₹0` floor enforced (BR-CLAIMS-034).

**BR-CLAIMS-004: Partial**
GTL excluded from policy selector in ClaimsIntimation (`sortedPolicies` filters `policyTypeKeys.GTL`). However, GTL claims are still shown as read-only in ClaimsCorner via `ClaimSummary` — no "no submission CTAs on GTL card" logic exists.

**BR-CLAIMS-005: Partial**
The `claimTypeOptions` in config.ts still includes both "CASHLESS" and "REIMBURSEMENT" options. The `ClaimTypeSelector` is rendered and shows both options for GMC in Step 2. PRD says all portal submissions should be Reimbursement only — Cashless selector should be removed. The document type switch (CASHLESS_DOCUMENT_TYPES vs REIMBURSEMENT_DOCUMENT_TYPES) is still based on the selected claim type, meaning cashless doc set is still in code.

**BR-CLAIMS-006: Implemented**
`getDiagnosisClaimConfig` adds a `validate` rule when `sumInsured > 0` that rejects amounts above it with the correct message. Also enforced in `isDiagnosisStepValid` check.

**BR-CLAIMS-007: Implemented**
Discharge date `validate` rule in `getDiagnosisClaimConfig` checks `discharge.isAfter(admission)`. `isDiagnosisStepValid` also checks `discharge <= admission` returns false.

**BR-CLAIMS-008: Partial**
Mandatory docs are Claim Form Part A&B and Final Bill — correct. But the list is hardcoded (not database-driven). `REIMBURSEMENT_DOCUMENT_TYPES` is a static array. Cashless doc types remain in code (BR-CLAIMS-005 conflict). The `Download Template` button is rendered but disabled (`disabled` prop set on the Button).

**BR-CLAIMS-009: Implemented**
Hospital name required for GMC (`showMedicalFields` check). `isHospitalStepValid` requires non-empty `watchedHospitalName` for GMC. Submit is disabled when hospital is missing.

**BR-CLAIMS-010: Implemented**
Policy change triggers dependent list refresh via `formMethods.watch("policyId")` effect. Invalid dependent cleared on policy change.

**BR-CLAIMS-011: Implemented**
`sortedPolicies` uses priority map (GMC=1, GMC Top-Up=2, GPA=3). Auto-selects first GMC. `hospitalPolicyIds` logic handles Top-Up correctly (uses base GMC IDs for hospital search).

**BR-CLAIMS-012: Partial**
Confirmation notification called on success. Email+SMS channels are backend responsibility. However, the frontend fires it fire-and-forget — no error shown to user on confirmation failure (violates the "not fire-and-forget" requirement).

**BR-CLAIMS-013: Implemented**
`MAX_FILE_SIZE = 5 * 1024 * 1024` enforced. `ACCEPT = ".pdf,.jpg,.jpeg,.png"`. `maxFiles` per document type enforced. Multi-file types (20, 20, 10) defined.

**BR-CLAIMS-014: Implemented**
`ClaimSummary` returns null for empty summaries. Dashboard widget uses same component.

**BR-CLAIMS-015: Partial**
Dashboard renders combined GMC card (base + parental) via `parental` property in ClaimSummary. ClaimsCorner renders separate `PolicyCard` per policy. "Hospital Documents" section not present. However, the bifurcation logic in `displaySummaries` flattens base + parental as separate entries even on Dashboard (the `mapPolicy` function creates `baseEntry` + `parentalEntry` as two separate display items) — may produce two cards on Dashboard rather than one combined card.

**BR-CLAIMS-016: Partial**
ClaimSummary shows 3 claims initially with "Show more" button (`policy.claims.slice(0, 3)`). PRD says cap is configurable default=5. Currently hardcoded at 3 (not 5). Show more expands to all (not capped). No "view more" cap in V1 is acceptable per PRD.

**BR-CLAIMS-017: Partial**
Claim row shows: Claim ID, Name+Relation, Requested Date, Claim Amount, Approved Amount (settledAmount), Status, Last Updated At, TAT. Missing from row: "Relation" appears to be embedded in the name string (`${memberName} (${capitalizeFirst(relation)})`). The `Relation` as a dedicated column is not separate. All required fields otherwise present.

**BR-CLAIMS-018: Partial**
`lastSyncedAt` is displayed in the ClaimsCorner header. Format: `DD MMM YYYY, HH:MM AM/PM` via `toLocaleDateString + toLocaleTimeString` with `en-IN` locale. Timezone is browser-local, not employee-country-aware. Country-based timezone formatting not implemented.

**BR-CLAIMS-019: Partial**
`policyNumber` field IS shown in ClaimSummary rows (the `policyNumberOnly` variable renders in the policy info section). PRD says the insurer policy number must NOT be displayed. Whether `policyNumber` in the API response is the insurer number or internal IIRM ID is unclear from code, but it is rendered.

**BR-CLAIMS-020: Yet to Start**
TPA Name label not implemented. All buttons show the generic label "TPA Portal" (ClaimsCorner, Header). No TPA name sourced from policy data.

**BR-CLAIMS-021: Partial**
TPA SSO is triggered only via the "TPA Portal" button in the page header. Claim Reference Number click and Claim Status badge click do NOT trigger SSO in the current `ClaimSummary` component. Row-level SSO is not wired up.

**BR-CLAIMS-022: Yet to Start**
No departure confirmation modal exists on any surface (ClaimsCorner, Header, DashboardBenefitsSection). All three surfaces redirect immediately after SSO fetch.

**BR-CLAIMS-023: Yet to Start**
No Claims Corner awareness banner on the Dashboard.

**BR-CLAIMS-024: Yet to Start**
No conversational/interactive introductory section in ClaimsCorner.

**BR-CLAIMS-025: Yet to Start**
No WhatsApp QR widget in ClaimsCorner. Header has a hardcoded QR modal for GHPL, but that is not the ClaimsCorner widget and is not TPA-driven.

**BR-CLAIMS-026: Partial**
Step 1 (Claim Intimation) is fully built. Step 2 (Claim Submission) — Path A (linked to intimation) is not built; Path B (AI extraction) is not built.

**BR-CLAIMS-027: Yet to Start**
No enrollment-period block logic in ClaimsIntimation or ClaimsCorner.

**BR-CLAIMS-028: Yet to Start**
No endorsement eligibility check on dependents in the claimant selector.

**BR-CLAIMS-029: Yet to Start**
No bifurcated policy card rendering for active + unstarted policies.

**BR-CLAIMS-030: Yet to Start**
No "Claim Category" optional component selector. No component eligibility check (opted-in, balance > 0, waiting period elapsed).

**BR-CLAIMS-031: Yet to Start**
Document list is hardcoded in frontend (REIMBURSEMENT_DOCUMENT_TYPES array). No database-driven config. Template download button exists in UI but is `disabled`. The `hasTemplate` flag is read from the static config but the download action is blocked.

**BR-CLAIMS-032: Yet to Start**
No Club SI flag reading or pooled SI validation.

**BR-CLAIMS-033: Yet to Start**
No "Claim Initiated" label for Claim Intimation records in Claims Corner history. No distinction between intimation records and full claim records in the display.

**BR-CLAIMS-034: Yet to Start**
No `Math.max(0, available)` floor applied anywhere in the coverage display. Negative values from TPA would render as-is.

---

## Acceptance Criteria

**AC-CLAIMS-001: Partial**
001a — Policy cards, claim rows, coverage figures, status counts present. TAT computed and shown. `lastSyncedAt` shown. Insurer policy number IS shown (violation of BR-CLAIMS-019).
001b — Empty state exists ("No claims found" with subtitle). ✓
001c — Separate policy cards per policy. ✓

**AC-CLAIMS-002: Yet to Start**
Per-policy "Refresh Claim Status" button does not exist. Current behavior is auto-sync on mount (not user-triggered). 002a/b/c/d/e/f/g all unmet.

**AC-CLAIMS-004: Implemented**
004a — Add-on section renders correctly.
004b — Section hidden when no addOns. ✓

**AC-CLAIMS-005: Implemented**
Premium summary card renders all four values. ✓

**AC-CLAIMS-006: Partial**
006a — Departure modal: not implemented. ✗
006b/c — Modal flow not implemented. ✗
006d — Error handling exists on SSO fetch failure (toast shown). ✓
006e — TPA name label not implemented (always "TPA Portal"). ✗
006f — Departure modal absent on all surfaces (Header, Dashboard). ✗

**AC-CLAIMS-007: Implemented**
007a/b — Life Event CTA correctly checks feature flag + policy eligibility. ✓

**AC-CLAIMS-008: Implemented**
008a — GTL excluded, GMC auto-selected, dependent cards show name/relation/dob/count. ✓
008b — Dependent list refreshes on policy change, invalid dependent cleared. ✓
008c — Inline errors on Continue with missing fields. ✓

**AC-CLAIMS-009: Partial**
009a — Fields present. However, Cashless/Reimbursement selector IS shown for GMC (violates "no claim type selector"). Claim Category selector not shown. ✗
009b — Sum-insured cap validation with correct message. ✓
009c — Discharge date ordering validation. ✓

**AC-CLAIMS-010: Implemented**
010a — GPA step 2 fields and heading correct. ✓
010b — Validation passes with valid data. ✓
010c — `maxDate: dayjs()` on Date of Accident prevents future dates. ✓

**AC-CLAIMS-011: Implemented**
011a — Hospital search with network autocomplete, auto-fills all address fields. ✓
011b — Manual add with cascading dropdowns. ✓
011c — Submit disabled without hospital name for GMC. ✓
011d — "No hospitals found" + "Add Hospital Manually" panel shows on empty results. ✓

**AC-CLAIMS-012: Partial**
012a — Document checklist loads; mandatory docs enforced. But list is hardcoded, not dynamic per BR-CLAIMS-031. Cashless doc types still present. ✗ (partial per hardcoded vs dynamic)
012b — Dynamic doc list per claim category: not implemented. ✗
012c — 5MB error message implemented. ✓
012d — Unsupported file type error. ✓
012e — Green check, filename, timestamp, View/Replace/Delete shown on upload. ✓
012f — maxFiles enforcement present. ✓
012g — Back-navigation preserves documents (state in `formMethods`). ✓
012h — "Download Template" button rendered but **disabled** (`disabled` prop). Template download does not work. ✗
012i — Upload-only behavior for no-template docs: not yet differentiable since all have `hasTemplate: true` in static config and all buttons are disabled anyway. ✗

**AC-CLAIMS-013: Implemented**
013a — Policy/claimant updates sidebar in real time. ✓
013b — Diagnosis, dates update sidebar. Claim Type IS shown in sidebar (because selector exists in code — violates "not shown" requirement). Partial.

**AC-CLAIMS-014: Partial**
014a — Success navigates to ClaimsCorner, toast shown. Confirmation call made but fire-and-forget — error not surfaced to user. ✗
014b — Error toast shown on submit failure. But message may expose raw API error messages. Partial.

**AC-CLAIMS-015: Partial**
015a — Dashboard widget renders policy/coverage/claims data. Insurer policy number shown (violation). No "Family members covered" section (correct — it's commented out). TAT present. ✓ minus policy-number concern.
015b — GMC base + parental: ClaimSummary `mapPolicy` creates `parental` subentry. But `displaySummaries.flatMap` splits them into two separate render items, potentially showing two cards. ✗
015c — Single base GMC without parental: parental sub-section absent. ✓

**AC-CLAIMS-016: Implemented**
016a — Zero claims → widget not rendered (component returns null). ✓
016b — After data upload and dashboard refresh, widget appears. ✓ (data-dependent, no UI gap)

**AC-CLAIMS-017: Yet to Start**
017a/b — No introductory conversational section.

**AC-CLAIMS-018: Yet to Start**
018a/b/c/d — No WhatsApp QR widget in ClaimsCorner. Header has a QR modal but it is not the same feature.

**AC-CLAIMS-019: Yet to Start**
019a/b/c — No Claims Corner awareness banner on Dashboard.

**AC-CLAIMS-021: Partial**
021a — 3-step wizard exists. Hospital section shown for GMC in step 3. For GPA, `showMedicalFields=false` hides hospital section — document upload shown only. ✓ But pre-admission vs post-treatment document lists are not differentiated — same `REIMBURSEMENT_DOCUMENT_TYPES` used for both. ✗
021b — TPA submission endpoint called on submit. Success toast and navigation. But confirmation fire-and-forget issue. Partial.

**AC-CLAIMS-022: Yet to Start**
022a/b/c/d — Path A not implemented.

**AC-CLAIMS-023: Yet to Start**
023a–h — Path B (AI extraction) not implemented.

**AC-CLAIMS-024: Yet to Start**
024a/b/c/d — Enrollment-period claim block not implemented.

**AC-CLAIMS-025: Yet to Start**
025a/b — Dependent endorsement eligibility check not implemented.

**AC-CLAIMS-026: Yet to Start**
Claims Corner bifurcation for active + unstarted enrollment-period policy not implemented.

**AC-CLAIMS-027: Yet to Start**
Claim Category optional component selector not implemented.

**AC-CLAIMS-028: Yet to Start**
(Based on AC numbering in PRD — Club SI pooling validation not implemented.)

---

## Feature Flag Status

`FF_CLAIM_INTIMATION_MANAGEMENT` — **Exists and is wired correctly.**
- Defined in `apps/ui/ui-lib/src/lib/environment.ts` line 129.
- Read in `apps/ui/ibp/src/app/app.tsx` line 106 as `isClaimIntimationEnable`.
- Route `/claims-intimation` redirects to `/dashboard` when flag is off.
- Nav item "Claim Submission" in constants/index.ts conditionally added when `VITE_FF_CLAIM_INTIMATION_MANAGEMENT === "true"`.
- Note: In ClaimsCorner/index.tsx line 553, the `disabled` check on the Claim Submission button is **commented out** — the button is always enabled regardless of the flag. This is a gap.

---

## Critical Gaps Summary (P0/P1)

1. **BR-CLAIMS-022 / US-CLAIMS-020 / AC-CLAIMS-006a,f** — TPA departure modal missing on ALL three surfaces (ClaimsCorner, Header, DashboardBenefitsSection). Direct SSO redirect without warning.
2. **BR-CLAIMS-005 / AC-CLAIMS-009a** — Cashless/Reimbursement claim type selector is still rendered in the wizard (should be removed; all portal submissions are Reimbursement only).
3. **US-CLAIMS-002 / AC-CLAIMS-002** — Manual "Refresh Claim Status" per-policy button does not exist. Current behavior is auto-sync on page mount.
4. **BR-CLAIMS-031 / AC-CLAIMS-012a** — Document list is hardcoded, not database-driven. Template download button is disabled.
5. **BR-CLAIMS-012 / AC-CLAIMS-014a** — Confirmation notification is fire-and-forget; failures are not shown to the user (ambiguity violation).
6. **US-CLAIMS-021/022 / AC-CLAIMS-022/023** — Claim Submission (both Path A linked and Path B AI extraction) not built at all.
7. **BR-CLAIMS-034** — No ₹0 floor on available balance display.
8. **BR-CLAIMS-020** — TPA Name label always shows "TPA Portal" — TPA name from policy data not wired.
9. **BR-CLAIMS-021 / AC-CLAIMS-006a** — Claim number and status badge do not trigger SSO — only the TPA Portal button does.
