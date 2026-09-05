# IBP Dashboard — Product Requirements Document

**Module:** IBP-DASHBOARD  
**Product:** Integrated Benefits Portal (IBP)  
**Client:** IIRM  
**Stage:** 40a — Module PRD  
**Authored:** 2026-07-20  
**Audience:** Product owners, HR admins, client stakeholders, QA leads

---

This document specifies the product behavior for the **Dashboard** module within the IBP using the Reverse Engineering method to understand the implemented business logic. The Dashboard is the authenticated landing screen of the employee app — the first thing an employee sees after login. Its job is orientation: in one screen it answers *what do I need to do* (enrollment), *what am I covered for* (policies), *how do I use my benefits* (quick links, FAQ), and *what is happening with my claims*. The screen is not static — it reshapes across the enrollment lifecycle. Anyone reading this doc cold should be able to determine what the module does, who it serves, and how to verify it is working correctly.

---

## Scope

### In scope

- The authenticated dashboard screen at route `/` and its behavior
- The greeting / employee-details header: resolved primary CTA, six-step enrollment stepper, days-left counter
- Three header layouts keyed off overall enrollment status (not-started, in-progress, enrolled)
- Alternate email / phone display in the header, live-synced from the session user record
- DOB masking in the header (month + year) and dependent surfaces (hidden with reveal toggle)
- Benefits section: fixed quick-access tiles, admin-configured dynamic TPA feature buttons, policy-period badge, available-benefits accordions (compulsory / optional / flex), enrolled-policy accordions (enroled / currently-active / expired), per-section contribution summary, claim summary table, wellness banner
- The two enrollment banners (window-open and window-closed copy)
- FAQ section (company-template FAQs)
- Policy-porting banner and the terms-and-conditions consent popup
- Enrollment-state resolution that drives the primary CTA and the before/after-enrollment reshaping of the whole screen

### Out of scope

- The `/unified-enrollment` flow the CTA routes into (owned by the UNIFIED-ENROLLMENT module)
- The quick-link **destination** pages themselves (E-Cards, Policy Features, Hospital Network, My Documents, Life Events, TPA portal — documented in their own modules)
- Claims detail pages and `/manage-dependents`
- Backend / API implementation (owned by `ibp-service` and `config-service`)
- The HR / admin portal (`apps/ui/iwork`)
- Known legacy not treated as features: the unrouted `DashboardPage` and the imported-but-unused `useDashboardContent` hook (see Gap Register / Open Questions)

---

## Flow Overview

The module is a single screen at `/` (`Dashboard`) with no wizard. On mount it loads employee details and policies, resolves overall enrollment status, and renders in three regions.

**Header** (`DashboardEmployeeDetails`): greeting, employee meta (with masked DOB), alternate contact, the six-step enrollment stepper, the resolved primary CTA, and — in the in-progress layout — a days-left counter. The header renders one of three layouts depending on overall enrollment status: not-started, in-progress, or enrolled.

**Benefits section** (`DashboardBenefitsSection`): the quick-access tiles + dynamic TPA feature buttons (visible only after the employee has a viewable policy), the policy-period badge, the available-benefits accordions (compulsory / optional / flex), the enrolled-policy accordions (enroled / currently-active / expired) each with a per-section contribution summary, and the claim summary table.

**Support & consent**: the two enrollment banners, the FAQ accordion, the policy-porting banner, the wellness banner, and — on fresh login when the consent flag is on — a blocking terms-and-conditions popup that must be accepted or declined before the employee proceeds.

The dashboard is a **launch point**: the resolved CTA navigates to `/unified-enrollment` (or `/manage-dependents` in add-dependents-only mode), and the quick tiles route to the benefit destinations. It writes little of its own — enrollment-progress init/update, a consent record, and a logout activity on decline.

---

## Implementation Status

BRs without a status marker are **Implemented**. Rules tagged `Partial`, `Defect`, or `Doc-drift` are noted inline on each BR and detailed in the [Gap Register](#gap-register). Everything in this PRD is **reverse-engineered from the shipped code** — no new product decisions are introduced here.

- **Reverse-engineered from code:** BR-DB-001 through BR-DB-018. Most are working as intended; a handful diverge from the previous doc revision (corrected here to match code) or carry known defects.

---

## User Stories

The following stories are traced to use cases and functional requirements derived from the existing implementation. MODULE code is **DB**.

---

### Orientation & Landing

**US-DB-001** — As an **employee**, I want a single landing screen after login, so that I immediately understand my benefits and what I need to do.

- Traces to: UC-LAND-01 / FR-LAND-01

**US-DB-002** — As an **employee**, I want a step-by-step progress indicator (login → review benefits → add dependents → select optional plans → submit → confirmation), so that I know where I am in the enrollment journey.

- Traces to: UC-LAND-02 / FR-STEP-01

**US-DB-003** — As an **employee**, I want the header to change shape depending on whether my enrollment is not-started, in-progress, or complete, so that the screen always reflects my current state.

- Traces to: UC-LAND-03 / FR-HDR-01

**US-DB-004** — As an **employee**, I want to see my alternate email and phone on the header and have them stay current, so that my contact details are accurate without a page reload.

- Traces to: UC-LAND-04 / FR-HDR-02

---

### Enrollment Call-to-Action

**US-DB-005** — As an **employee** with enrollment available, I want a clear "Start/Continue Enrolment" action, so that I can complete enrollment before the window closes.

- Traces to: UC-CTA-01 / FR-CTA-01

**US-DB-006** — As an **enrolled employee**, I want to edit (if editable) or view (if locked) my enrollment, so that I can review or change my choices.

- Traces to: UC-CTA-02 / FR-CTA-02

**US-DB-007** — As an **employee** whose window has not opened, I want to see that action is not yet available, so that I am not confused.

- Traces to: UC-CTA-03 / FR-CTA-03

**US-DB-008** — As an **employee** whose window is closing, I want to see how many days are left, so that I feel the urgency to complete enrollment.

- Traces to: UC-CTA-04 / FR-CTA-04

---

### Benefits & Coverage

**US-DB-009** — As an **employee**, I want to browse the compulsory / optional / flex benefits available to me, so that I know what I can choose.

- Traces to: UC-BEN-01 / FR-BEN-01

**US-DB-010** — As an **enrolled employee**, I want to see my enroled / currently-active / expired policies, so that I know my current coverage.

- Traces to: UC-BEN-02 / FR-BEN-02

**US-DB-011** — As an **enrolled employee**, I want a claim summary, so that I can see claim status at a glance.

- Traces to: UC-BEN-03 / FR-CLAIM-01

**US-DB-012** — As an **enrolled employee**, I want quick-access tiles and any TPA-specific feature buttons my company has configured, so that I can reach hospital network, e-cards, documents, life events, and the TPA portal.

- Traces to: UC-BEN-04 / FR-TILE-01

**US-DB-013** — As an **employee**, I want my date of birth and my dependents' dates of birth masked by default with a reveal toggle, so that sensitive data is not shown casually.

- Traces to: UC-BEN-05 / FR-PII-01

---

### Support & Consent

**US-DB-014** — As an **employee**, I want frequently-asked questions on the dashboard, so that I can self-serve common answers.

- Traces to: UC-SUP-01 / FR-FAQ-01

**US-DB-015** — As an **employee** on fresh login, I want to accept or decline terms, so that consent is recorded before I proceed.

- Traces to: UC-SUP-02 / FR-CONSENT-01

**US-DB-016** — As an **employee**, I want a wellness entry point and (if my company offers it) a policy-porting banner, so that I can access wellness and porting services.

- Traces to: UC-SUP-03 / FR-WELL-01

---

## Business Rules

The rules below govern eligibility, resolution, and display. They are derived directly from the implemented logic and must be preserved in any future change.

---

**BR-DB-001 — Primary CTA resolution ladder**  
The primary CTA is resolved to **one** action from the mix of per-policy statuses using a fixed priority ladder: `CAN_ENROLL` → `EDIT_ENROLL` → `NOT_STARTED` → `LOCKED` → all-`NOTIFY` → fallback. The most urgent actionable thing wins. Per-policy status is computed by `getEmployeePolicyStatus` / `flattenPoliciesWithStatus`.

**BR-DB-002 — CAN_ENROLL requires in-progress status** `Doc-drift`  
`CAN_ENROLL` is returned **only** when a policy's `employeeEnrollmentStatusKey` is `IN_PROGRESS`. An open window with a `NOT_STARTED` status resolves to `NOT_STARTED`, not `CAN_ENROLL`. (The previous doc revision described CAN_ENROLL as the generic "window open" state; corrected here to match code.)

**BR-DB-003 — CTA progress-flip to Continue**  
A `NOT_STARTED` policy whose saved enrollment progress has already advanced beyond login (a progress step ≥ "add dependents" is complete) is treated as **in-progress**: the CTA reads "Continue Enrolment" rather than "Start Your Enrolment".

**BR-DB-004 — Progress write on CTA click**  
Clicking the CTA — for any action other than VIEW or DISABLED — records enrollment progress (marks the `reviewBenefits` step complete when an enrollment batch key exists) **before** navigating. Navigation carries `source:"dashboard"` route state.

**BR-DB-005 — LOCKED resolves to view-only, same route** `Doc-drift`  
A `LOCKED`-only state resolves to a **View** action that opens the same `/unified-enrollment` route in view-only mode (route state `isViewOnly` / `openSummary`). There is no separate read-only summary screen. (The previous revision implied a distinct read-only surface; corrected.)

**BR-DB-006 — Quick-access gating**  
All six fixed quick-access tiles (E-Cards, Policy Features, Hospital Network, My Documents, Life Events, TPA SSO) are gated on `hasViewablePolicies` — an `EDIT_ENROLL` or `LOCKED` policy exists. Before enrollment the entire quick-access row is hidden.

**BR-DB-007 — GMC-specific tile gating is inert** `Defect`  
The previous revision required GMC-gated tiles to additionally check for a GMC policy. In the current code no tile sets `requiresGMC`, and the Life-Events `requiresNonEditableGMC` filter is commented out — so GMC gating is effectively dead and all six tiles gate only on `hasViewablePolicies`. Documented as-is; the dead gating is a defect to resolve (see Gap Register).

**BR-DB-008 — Add-dependents-only mode**  
Add-dependents-only mode activates only when *every* policy has `addOnlyDependents === true`. In this mode the CTA reroutes to `/manage-dependents`, and enrollment banner #2 plus the Policy-Features / E-Cards tiles are hidden. A mixed set (some true, some false) or no policies keeps the normal flow. The same `addOnlyDependents` flag disables the add/edit/delete dependent actions in the Profile module.

**BR-DB-009 — Three header layouts + days-left counter**  
The header renders one of three layouts based on overall enrollment status:
- **Not-started** — start CTA + illustration.
- **In-progress** — continue CTA + a days-left counter.
- **Enrolled** — enrolled confirmation + an "Explore Wellness" button (shown only when the wellness flag is on).

The days-left counter counts down to the window **close** date normally, or to the window **open** date in the all-`NOTIFY` state.

**BR-DB-010 — Enrolled-policy classification (enroled / active / expired)**  
Enrolled policies are classified into **Enroled**, **Currently Active**, and **Expired** accordion groups. An eligible policy (`employeePolicies` entry) that is not present in `enrolledPolicies` and is past its due date is moved to **Expired** and excluded from enrollment.

**BR-DB-011 — Dynamic TPA feature buttons**  
Beyond the six fixed tiles, admin-configured TPA feature buttons are rendered from the tenant's TPA feature list. Each button behaves per its type: external **REDIRECT** (SSO), inline **BASE64 PDF**, **DISPLAY** (data modal), or **SYNC**. The TPA Login tile performs a live SSO fetch and shows a "Redirecting…" disabled state while fetching.

**BR-DB-012 — Contribution totals and GST** `Doc-drift`  
Per-section contribution totals show the company contribution and the employee's total. GST is applied to the **employee** contribution only (at 18%) and **only when** the tenant/policy constraints enable it (`gstApplicable` / `showGstToEmployee`); when enabled, the employee total is labelled "(incl. GST)". The company contribution is never grossed. (The previous revision stated totals are shown "including 18% GST" unconditionally; corrected to match code.) Available-benefits and enrolled-policy sections render only when non-empty.

**BR-DB-013 — GMC per-life multiplier and sum-insured MULTIPLE model**  
For GMC policies, contributions are multiplied by covered-member count (premium-per-life × members). Sum-insured may follow a MULTIPLE model derived from an `additionalDetails` factor (e.g. CTC) bounded by configured min/max.

**BR-DB-014 — Claim summary**  
When enrolled sections, viewable policies, and at least one claim row exist, a claim summary table renders with columns: Claim Number, Policy, Name, Date, Claim Amount, Status, Last Updated At. Status is normalized to Approved / Action Required / Pending. The claim-number cell navigates to `/claims-corner`. Otherwise the table is omitted.

**BR-DB-015 — FAQ source and cap** `Doc-drift`  
FAQ content is sourced from the **company template only** (`companyTemplate.config.faqs`), sorted by `sequencenumber`; the list is a single continuous accordion, capped at 5 with a "View More" link when more than 5 exist. Policy-template FAQs are **not** merged in the current implementation (the previous revision described a company + policy-template merge via `usePolicyTemplateFaqs`; that utility is unused). The `> 5` "View More" threshold is fixed and independent of the `limit` prop.

**BR-DB-016 — Accordion auto-expand and scroll**  
On initial mount the first available-benefits accordion and its first nested group auto-expand, and the view scrolls to the expanded accordion; the scroll re-anchors when an accordion shrinks.

**BR-DB-017 — Consent gate behavior**  
When `FF_IBP_CONSENT_MANAGEMENT` is on and `showLoginWelcomePopup` is set, the T&C popup opens on mount and cannot be dismissed via backdrop or escape. **Accept** records consent (`acceptTerms` with `tcVersion`). **Decline** logs a `LOGGED_OUT` activity, dispatches `clearPortalConfiguration`, removes the `user` and `sessionStartedAt` session keys, and navigates to `/landing`.

**BR-DB-018 — Tenant feature flags**  
The wellness banner, the policy-porting banner, and the T&C popup are shown only when their respective tenant config / feature flag is enabled (`wellnessBanner.enabled`, `portingBanner.enabled`, `FF_IBP_CONSENT_MANAGEMENT`). The policy-porting banner CTA opens the external IIRM wellness site.

---

## Acceptance Criteria

Each criterion maps to one or more user stories above. Written in Given/When/Then format for direct use in QA and client sign-off.

---

**AC-DB-001** (→ US-DB-001) `Built`  
**Given** an authenticated employee,  
**When** they land on `/`,  
**Then** the greeting header, benefits section, enrollment banner #1, and FAQ render; a full-screen loader shows only while employee-details or policies are still loading.

---

**AC-DB-002** (→ US-DB-002, BR-DB-003) `Built`  
**Given** the enrollment journey,  
**When** the header renders,  
**Then** a six-step stepper (login → review benefits → add dependents → select optional plans → submit → confirmation) shows each step as completed, in-progress, or not-started based on saved enrollment progress.

---

**AC-DB-003** (→ US-DB-003, BR-DB-009) `Built`  
**Given** overall enrollment status,  
**When** the header renders,  
**Then** the not-started, in-progress, or enrolled layout is shown accordingly, each with its own CTA / illustration / counter arrangement.

---

**AC-DB-004** (→ US-DB-004) `Built`  
**Given** the employee has an alternate email/phone,  
**When** the header renders,  
**Then** they display and update live when the session user record changes (`ibp:user-updated`), without a page reload.

---

**AC-DB-005** (→ US-DB-005, BR-DB-001, BR-DB-002, BR-DB-004) `Built`  
**Given** at least one `CAN_ENROLL` policy (or a `NOT_STARTED` policy with advanced progress per BR-DB-003),  
**When** the dashboard resolves the CTA,  
**Then** it reads "Continue Enrolment", records the `reviewBenefits` progress step on click, and navigates to `/unified-enrollment`.

---

**AC-DB-006** (→ US-DB-006, BR-DB-005) `Built`  
**Given** only `EDIT_ENROLL` policies,  
**Then** the CTA reads "Edit Enrolment" and opens `/unified-enrollment`;  
**Given** only `LOCKED` policies,  
**Then** it reads "View Enrolment" and opens `/unified-enrollment` in view-only mode (`isViewOnly`).

---

**AC-DB-007** (→ US-DB-007) `Built`  
**Given** all policies are `NOTIFY`,  
**When** the CTA resolves,  
**Then** it reads "Enrollment Opens Soon", is disabled, and a days-until-open counter is shown.

---

**AC-DB-008** (→ US-DB-008, BR-DB-009) `Built`  
**Given** an open window with a close date,  
**When** the in-progress header renders,  
**Then** a days-left counter counts down to the close date; in the all-`NOTIFY` state it counts down to the open date instead.

---

**AC-DB-009** (→ US-DB-009, BR-DB-016) `Built`  
**Given** available benefits exist,  
**When** the benefits section renders,  
**Then** the compulsory / optional / flex accordions render, empty sections are omitted, and the first accordion and its first nested group auto-expand with the view scrolled to it.

---

**AC-DB-010** (→ US-DB-010, BR-DB-010, BR-DB-012) `Built`  
**Given** the employee has enrolled / viewable policies,  
**When** the section renders,  
**Then** the enroled / currently-active / expired accordions render with per-section contribution totals (employee total labelled "(incl. GST)" only when GST is enabled per BR-DB-012), and the quick-access row becomes visible.

---

**AC-DB-011** (→ US-DB-011, BR-DB-014) `Built`  
**Given** enrolled sections, viewable policies, and ≥1 claim row,  
**When** the section renders,  
**Then** the claim summary table renders (Claim Number, Policy, Name, Date, Claim Amount, Status, Last Updated At) with normalized statuses, and the claim-number cell navigates to `/claims-corner`; otherwise the table is omitted.

---

**AC-DB-012** (→ US-DB-012, BR-DB-006, BR-DB-011) `Built`  
**Given** `hasViewablePolicies`,  
**When** the benefits section renders,  
**Then** the six fixed tiles and any admin-configured TPA feature buttons render; each TPA button behaves per its type (redirect / PDF / display / sync); the TPA Login tile shows a "Redirecting…" state during SSO fetch.

---

**AC-DB-013** (→ US-DB-013, BR-DB-012) `Built`  
**Given** employee and dependent DOBs,  
**When** they render,  
**Then** the header DOB is shown masked as month + year and dependent DOBs are hidden by default, each with a reveal toggle.

---

**AC-DB-014** (→ US-DB-014, BR-DB-015) `Built`  
**Given** company FAQs,  
**When** the FAQ section renders,  
**Then** they show sorted by sequence, capped at 5 with a "View More" link when more than 5 exist; an empty-state message shows when there are none.

---

**AC-DB-015** (→ US-DB-015, BR-DB-017) `Built`  
**Given** `FF_IBP_CONSENT_MANAGEMENT` is on and `showLoginWelcomePopup` is set,  
**When** the dashboard mounts,  
**Then** the T&C popup opens (not dismissable via backdrop/escape); Accept records consent (`acceptTerms`, `tcVersion`); Decline logs a `LOGGED_OUT` activity, clears portal config and session (`user`, `sessionStartedAt`), and navigates to `/landing`.

---

**AC-DB-016** (→ US-DB-016, BR-DB-018) `Built`  
**Given** the wellness / porting tenant flags,  
**When** the dashboard renders,  
**Then** the wellness banner and/or policy-porting banner render; the porting CTA opens the external IIRM wellness site.

---

## Data Contract

This section defines what the Dashboard module consumes and produces. It does not describe internal implementation — that belongs in the TRD (Stage 40c).

### Consumed by Dashboard

| Source | Shape | Purpose |
|---|---|---|
| Strapi CMS — company template (`companyTemplate.config`) | FAQs, enrollment banners, note text, section headings, year range, contact matrix | Dashboard content and copy |
| Strapi CMS — policy templates (per-policy `config`) | info points, `showCompanyContribution`, GST flags | Per-policy display config |
| `ibp-service` — employee details | employee meta, `policyEnrollmentStatuses`, alternate contact | Header + status resolution |
| `ibp-service` — policies | `employeePolicies` + `enrolledPolicies` | Accordions + CTA resolution |
| `ibp-service` — enrollment progress | progress steps + batch key | Stepper + progress-flip |
| `ibp-service` — claims overview | claim rows + settled/intimated amounts | Claim summary |
| `ibp-service` — relation details / TPA | relation config, TPA feature list, TPA SSO | Relation filtering + TPA buttons |
| `config-service` (via `useCompanyConfig`, subdomain-keyed) | `portalDashboardConfig` (`wellnessBanner.enabled`, `portingBanner.enabled`), password rules, branding | Tenant feature flags |
| Environment config | `FF_IBP_CONSENT_MANAGEMENT` | Consent gate |
| `sessionStorage.user` | `{ id, companyId }` + alternate contact | Identity / query enablement / live contact sync |

### Produced by Dashboard

| Destination | Shape | Purpose |
|---|---|---|
| `ibp-service` — enrollment progress | `initializeEnrollmentProgress` (gated on actionable policies) / `updateEnrollmentProgress` (`reviewBenefits` on CTA click) | Progress init/update |
| `ibp-service` — consent | `acceptTerms` with `tcVersion` | Consent record on Accept |
| `ibp-service` — activity | `LOGGED_OUT` activity on T&C decline | Audit |
| UNIFIED-ENROLLMENT | route state `{ openSummary, isViewOnly, policyInfo, source:"dashboard" }` at `/unified-enrollment` | Hand-off to enrollment |

### Cross-module contract items

- **UNIFIED-ENROLLMENT**: the navigation-state contract (`openSummary`, `isViewOnly`, `policyInfo`, `source`) handed to `/unified-enrollment`. Any change to the enrollment route's expected state must be validated against this producer.
- **PROFILE**: the `addOnlyDependents` flag (all policies have it) governs both the dashboard CTA reroute (BR-DB-008) and the Profile module's add/edit/delete gating. The flag's meaning must remain consistent across both.
- **config-service**: the `portalDashboardConfig` flag shape (subdomain-keyed). Flag names (`wellnessBanner.enabled`, `portingBanner.enabled`) must remain stable.
- **Claims module**: the claim-summary rows link to `/claims-corner`; the claim row shape and status vocabulary must remain stable.

---

## Gap Register

Tech Lead reference: every BR tagged `Doc-drift`, `Defect`, or `Partial` maps to a row below, plus dead-code items found during reverse engineering. Ordered by fix effort — defects/cleanups first.

| GAP | Group | BRs | Description | Files |
|---|---|---|---|---|
| GAP-DB-01 | Defect | BR-DB-007 | GMC-specific tile gating is inert — no tile sets `requiresGMC`; the Life-Events `requiresNonEditableGMC` filter is commented out. Decide whether GMC gating is still required or remove the dead gating. | `DashboardBenifitsSection/index.tsx` |
| GAP-DB-02 | Cleanup | — | `getEnrollmentButtonLabel` (`flattenPolicies.ts`) is not imported/used by the live dashboard; CTA labels are computed inline. Remove the dead utility or wire it in. | `flattenPolicies.ts`, `Dashboard/index.tsx` |
| GAP-DB-03 | Cleanup | BR-DB-015 | `usePolicyTemplateFaqs` and the company + policy-template FAQ merge described in the prior doc are not implemented; the live page passes company FAQs only. Remove the unused hook or implement the merge if still desired. | `Dashboard/index.tsx`, `FAQ/index.tsx` |
| GAP-DB-04 | Cleanup | — | FAQ answers are rendered without a visible DOMPurify sanitize in this path (the prior TRD claimed sanitization at the FAQ render boundary; only the T&C popup sanitizes). Confirm sanitization requirement for FAQ HTML. | `FAQ/index.tsx` |
| GAP-DB-05 | Cleanup | — | `useDashboardContent` is imported into the live dashboard but never invoked; it also contains a duplicate `companyTemplate` fetch and console logs. Drop the import and the hook. | `hooks/useDashboardContent.ts`, `Dashboard/index.tsx` |
| GAP-DB-06 | Cleanup | — | Stray `console.log` statements exist in the live path (flattened-policies dump, all TPA handlers). Strip them. | `Dashboard/index.tsx`, `DashboardBenifitsSection/index.tsx` |
| GAP-DB-07 | Cleanup | — | The unrouted `DashboardPage` (`DashboardTopSection`) is imported in `app.tsx` but attached to no route, yet the live dashboard imports styled containers from its `styles`. Relocate the styles and remove the dead page. | `app.tsx`, `pages/DashboardPage/*` |

---

## Open Questions

These items were unresolved during reverse engineering and should be answered before Stage 40c (TRD) is finalized.

1. **Mixed-policy presentation** — For employees holding a mix of policies (one enrollable, one enrolled), before- and after-enrollment UI appears together (single CTA + mixed accordions). Is this clear enough, or is explicit per-policy grouping needed? (Product)
2. **GMC gating intent** — Is GMC-specific tile gating (BR-DB-007 / GAP-DB-01) still a product requirement, or should the dead gating be removed outright? (Product/Tech)
3. **FAQ sanitization & merge** — Should FAQ HTML be sanitized (GAP-DB-04), and should policy-template FAQs be merged in (GAP-DB-03), or is company-only the intended final behavior? (Product/Tech)

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
