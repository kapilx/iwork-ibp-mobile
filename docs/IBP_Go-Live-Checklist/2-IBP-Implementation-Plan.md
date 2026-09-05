# IBP — Implementation Plan (Internal)

**Audience:** IIRM Implementation Team, DevOps, QA — **not for client distribution.**
**Provenance:** Extracted verbatim from `IBP_Setup_Checklist_v9_DRAFT.md` Part B (25-May-2026) when the
draft-checklist lineage (v7/v8/v9) was retired in favour of the intake form
(`intake-form/IBP-Intake-Form.md` → `IBP-Intake-Form.html`).
**Field ID note:** `A-*`/`B-*`/`C-*`... codes below reference v9 Part A fields. The intake form
supersedes Part A — map codes to intake-form question IDs when this plan is next revised
(e.g. C-01 sub-domain → P1, B-01 logo → B1, E*-07/08 enrollment window → PL8/PL9).

---

# PART B — IIRM Implementation Plan (Internal — Not for Client Distribution)

> **Scope:** Application-level configuration, infrastructure provisioning, integration wiring, QA, and cutover work performed by IIRM. Each row links back to Part A Field IDs where applicable.

## How to use Part B

1. Part B is organised into **phases**. Execute roughly in order; some tasks can run in parallel.
2. Where a row maps to a Client Field ID (e.g., `B-01`), wait for client input before starting that row.
3. Internal-only rows (DevOps, integrations) carry IIRM codes: `INF-*`, `INT-*`, `QA-*`, `CUT-*`.
4. **Source** column points to the codebase target (entity, Strapi path, iWork screen, or env file).

---

## Phase 1 — Infrastructure & Provisioning (DevOps)

| Code | Task | Source / Target | Depends on | Status |
|---|---|---|---|---|
| INF-01 | Create DNS record (CNAME or A-record) for client sub-domain in each environment (UAT + Prod). Same slug across envs; base domain (`iwh.indiainsure.com` vs UAT equivalent) set per env at deploy-time. | DevOps DNS provider | `C-01` | Pending |
| INF-02 | Issue and bind SSL/TLS certificate for the sub-domain in each environment; verify HTTPS end-to-end | DevOps cert pipeline | `C-01`, INF-01 | Pending |
| INF-03 | Provision tenant database; create `DatabaseConnect` entry; link `ConfigCompany.companyDatabaseId` | `apps/services/service-lib/.../entities/ConfigCompany.ts` | — | Pending |
| INF-04 | Verify reachability of all 17 microservices (API Gateway 3000, Auth 3003, Config 3001, Policy 3017, Wellness 3021, Notification 3015, etc.) | `/environments/.env.dev` | INF-03 | Pending |
| INF-05 | Configure Notification Service SMTP relay (client mail server or IIRM default) | Notification Service env | — | Pending |
| INF-06 | Confirm SMS / OTP gateway credentials present | Notification Service env | — | Pending |
| INF-07 | Set feature flag `FEATURE_AUTH_FAILURE_TRACKING_ENABLED=true` | `apps/services/service-lib/.../config/feature-flag.service.ts` | — | Pending |
| INF-08 | Configure security headers (CSP, HSTS, X-Frame-Options) at edge/proxy | DevOps reverse-proxy config | INF-02 | Pending |
| INF-09 | Set up backup schedule (daily DB snapshots) and document restore RTO/RPO | DevOps backup system | INF-03 | Pending |
| INF-10 | Configure monitoring + alerting (uptime, error rate, p95 latency) | DevOps observability stack | INF-04 | Pending |

---

## Phase 2 — Application Configuration (Implementation Team)

> Each row maps a Client Field ID from Part A to its target in the codebase.

**Before starting Phase 2 — IIRM Pre-dispatch Checklist**

| Code | Task | Status |
|---|---|---|
| PRE-C01 | Dispatch hospital network Excel template to client (along with the questionnaire or separately) | Pending |
| PRE-C02 | Dispatch FAQ Excel template to client (company-level + one copy per policy) | Pending |
| PRE-C03 | Confirm client questionnaire has been returned with inception file confirmation ticked for each policy | Pending |

> **Config approval:** Once IIRM Impl submits company/policy configuration in iWork, the system automatically routes it to the submitting user's manager for approval. No manual assignment needed.

### 2.1 Company-Level Records

| Client Field | Configuration Target | Status |
|---|---|---|
| A-01 to A-10 | Create company master record; populate ConfigCompany row | Pending |
| B-01 (Logo) | iWork → Company Details → Edit Company → Upload Logo. Stores in `ConfigCompany.companyLogoFileId`. | Pending |
| B-02 / B-03 (Welcome heading + body) | `CompanyPortalConfigurationDetail.companyPortalBrandingConfig.loginWelcomeMessage` (heading, bodyText) | Pending |
| B-04 / B-05 / B-06 (Footer texts) | Strapi CMS → Content Manager → Company Template → search by Company ID → `footer` component (companyName, license, copyright) | Pending |
| B-07 / B-08 (Privacy + ToU URLs) | Strapi CMS → Company Template → `footer-point` (repeatable rich-text) | Pending |
| C-01 (Sub-domain) | `ConfigCompany.subDomain`; also drives `companyPortalUrl` | Pending |
| C-02 to C-07 (Auth + password) | `CompanyAuthenticationConfig` (authenticationMethodId, companyPortalAuthConfig); password rules in `CompanyConfig.passwordRules`. *Note: SSO (C-02 option b) is not in current phase — set to future.* | Pending |
| C-08 (Session policy) | Portal logic — confirm default single-session enforcement | Pending |
| C-09 (Deactivation feed) | Wire up at HRMS connector (see INT-01) | Pending |
| D-01 (Support timings) | Strapi → Company Template → `contactMatrix.supportTimings` | Pending |
| D-02 / D-03 (HR contacts) | Strapi → Company Template → `contactMatrix.hrContacts` (primary + secondary) | Pending |
| D-04 / D-05 (DPO) | Strapi → `contactMatrix.dpoContacts` | Pending |
| D-06 / D-07 (Grievance) | Strapi → `contactMatrix.grievanceContacts` | Pending |
| D-08 / D-09 (TPA) | Strapi → `contactMatrix.tpa` | Pending |
| D-10 / D-11 (Broker) | Strapi → `contactMatrix.broker` | Pending |
| G-01 to G-04 (Dashboard modules) | `CompanyPortalConfigurationDetail.companyPortalDashboardConfig` (wellness, retailInsurance, etc.) JSONB | Pending |
| G-05 / G-06 (Company disclaimer) | Strapi → Company Template → `disclaimerNotes` (text). Acceptance mode (Mandatory / Optional) configured in Strapi on the same record. | Pending |
| G-07 (Cookie consent) | Frontend tenant config | Pending |
| H-01 (Company FAQs) | IIRM provides FAQ Excel template to client → Client fills and returns → Impl enters data into Strapi → Company Template → `faqs` (question, answer, category, sequencenumber) | Pending |

### 2.2 Per-Policy Pre-requisites (Service Flow Checklist)

> Confirm all items below are complete **before** beginning application-level policy configuration.

| Code | Pre-requisite Check | Status |
|---|---|---|
| PRE-01 | Policy configuration completed and approved in iWork Service Flow | Pending |
| PRE-02 | Policy activated in the system | Pending |
| PRE-03 | Inception process completed (inception file received from client and processed) | Pending |
| PRE-04 | Insurer policy number / provisional policy number assigned | Pending |
| PRE-05 | TPA assigned and TPA policy number confirmed (GMC only) | Pending |
| PRE-06 | CD (Corporate Deposit) balance confirmed with insurer (GMC only) | Pending |
| PRE-07 | Any other service-flow pre-requisites confirmed with Service Team | Pending |

### 2.3 Per-Policy Records (repeat for each policy)

| Client Field | Configuration Target | Status |
|---|---|---|
| E*-01 to E*-03 (Policy name, insurer, type) | `PolicyConfiguration` (companyId, policyTypeLid, policyId) | Pending |
| E*-04 (Sum Insured slabs + model) | `PolicyComponentsConfigurationDetail.sumInsuredModel`, `multipleSumInsuredLabel`, `clubSumInsuredLid` | Pending |
| E*-05 / E*-06 (Coverage summary + highlights) | Strapi → Policy Template → `infoPoints` (repeatable text) | Pending |
| E*-07 / E*-08 (Enrolment window) | `PolicyConfiguration.policyConfiguration` JSONB → enrolmentPeriod | Pending |
| E*-09 to E*-11 (Dependent rules) | iWork → Policy Config → Enrolment & Dependent Rules Tab; persisted in `PolicyConfiguration` JSONB | Pending |
| E*-12 (Show company contribution) | Strapi → Policy Template → `showCompanyContribution` | Pending |
| E*-13 (Premium display) | iWork → Policy Config → Pricing & Premium Tab | Pending |
| E*-14 (Pro-rate) | `PolicyComponentsConfigurationDetail.proRationEnabled` | Pending |
| F*-01 to F*-06 (Per-policy docs) | iWork → Policy Config → Document Library Tab | Pending |
| F*-07 / F*-08 (Hospital network + exclusion) | iWork → Policy Config → Hospital Network Tab → upload Excel | Pending |
| F-01 (Consolidated features PDF) | iWork → Policy Details → Portal Configuration Tab → Policy Feature → upload | Pending |
| G*-01 to G*-13 (Feature toggles) | `PolicyConfiguration.policyConfiguration` JSONB → feature toggles | Pending |
| G*-14 (HR-on-behalf claims) | iWork → HR Portal config (per IIRM-10096) | Pending |
| G*-15 / G*-16 (Policy disclaimer) | Strapi → Policy Template → `disclaimerNotes` | Pending |
| G*-17 to G*-20 (TAT / SLA / claim docs / instructions) | iWork → Policy Config → Claim Module Tab | Pending |
| H-02 (Policy FAQs) | IIRM provides FAQ Excel template to client → Client fills one copy per policy → Impl enters data into Strapi → Policy Template → `faqs`. *(All FAQ data flows through Strapi — iWork FAQ Tab is not the entry point.)* | Pending |

### 2.3 Localisation

| Code | Task | Source | Status |
|---|---|---|---|
| LOC-01 | Confirm country flag set per policy (India / Sri Lanka) | Frontend portal logic | Pending |
| LOC-02 | Verify currency, date format, number formatting render correctly | Frontend filters | Pending |
| LOC-03 | Confirm localised relationship labels appear in dependent dropdowns | Frontend filters | Pending |
| LOC-04 | Upload H-03 country-specific FAQs if provided | Strapi → FAQ entries with country field | Pending |

---

## Phase 3 — Integrations (Implementation + DevOps)

| Code | Task | Depends on | Status |
|---|---|---|---|
| INT-01 | HRMS / payroll connector — employee data sync + deactivation feed | `C-09` | Pending |
| INT-02 | *(Client SSO integration — not in current phase. Reserved for future.)* | — | Future |
| INT-03 | Insurer API credentials — cashless network fetch + claims API | Per-policy basis | Pending |
| INT-04 | Analytics injection (Google Analytics / Mixpanel) — if client supplied property ID | Client-supplied | Pending |
| INT-05 | TPA workflow integration — per IIRM-10092 / IIRM-10096 specs | `D-08`, `D-09` | Pending |

---

## Phase 4 — QA & Verification (Implementation Team)

| Code | Task | Notes | Status |
|---|---|---|---|
| QA-01 | WCAG 2.1 AA accessibility audit | Axe / Lighthouse scan + keyboard testing | Pending |
| QA-02 | VAPT / security scan sign-off | Pre-go-live penetration test | Pending |
| QA-03 | Cross-browser + mobile responsiveness check | iOS Safari, Android Chrome, desktop Chrome/Edge/Firefox | Pending |
| QA-04 | Performance SLO check | Page load + API p95 within target | Pending |
| QA-05 | Approval workflow verification | Draft → Under Review → Approved/Rejected works end-to-end | Pending |
| QA-06 | Audit logging verification | Confirm CRUD on config writes audit rows (created_by, updated_by, approved_by + timestamps) | Pending |
| QA-07 | DPDP compliance verification | No "Remember Me", consent captured, data-localisation honoured (per IIRM-10385) | Pending |
| QA-08 | Email notification template review — approve or reject each template before go-live | Review checklist below | Pending |
| QA-09 | Custom 404 / 500 error page check | Branded error pages render | Pending |

**QA-08 — Email Template Review Checklist**

| Template | Content check | Branding check (logo + colours) | Status |
|---|---|---|---|
| Welcome email (HR admin) | ☐ Approved ☐ Rejected | ☐ Approved ☐ Rejected | Pending |
| Employee enrollment confirmation | ☐ Approved ☐ Rejected | ☐ Approved ☐ Rejected | Pending |
| OTP / login verification | ☐ Approved ☐ Rejected | ☐ Approved ☐ Rejected | Pending |
| E-Card availability notification | ☐ Approved ☐ Rejected | ☐ Approved ☐ Rejected | Pending |
| Claim submitted confirmation | ☐ Approved ☐ Rejected | ☐ Approved ☐ Rejected | Pending |
| Claim status update | ☐ Approved ☐ Rejected | ☐ Approved ☐ Rejected | Pending |
| Enrollment period closing reminder | ☐ Approved ☐ Rejected | ☐ Approved ☐ Rejected | Pending |

---

## Phase 5 — Cutover (Implementation + DevOps + Client)

| Code | Task | Owner | Status |
|---|---|---|---|
| CUT-01 | UAT environment ready; client signs off | Client + Impl | Pending |
| CUT-02 | Communication plan to employees (launch email/intranet) | Client | Pending |
| CUT-03 | Create HR admin portal account using details from client form (Employee ID, First Name, Last Name, Work Email) | Impl | Pending |
| CUT-04 | Send HR admin welcome email — include portal URL, login instructions, and HR portal walkthrough guide *(HR context, not employee context)* | Impl | Pending |
| CUT-05 | HR admin training session | Impl | Pending |
| CUT-06 | Day-1 support tree documented (who handles incidents, escalation) | Client + Impl | Pending |
| CUT-07 | Rollback plan documented (how to revert if go-live fails) | DevOps | Pending |
| CUT-08 | Production cutover — DNS swap, monitoring active | DevOps | Pending |
| CUT-09 | Post-go-live observation window (first 72 hours) | All | Pending |
| CUT-10 | *(Go-live confirmation notification to client HR — placeholder for future automated step)* | Future | Future |

---

## IIRM Sign-Off

| Field | Value |
|---|---|
| Implementation Manager | |
| Date | |
| DevOps Lead | |
| Date | |
| QA Lead | |
| Date | |
| Go-Live Date | |
| Status | Draft |

---

## Appendix — Source Reference

| Section | Codebase / Doc source |
|---|---|
| Branding (B-*) | `Strapi: company-template/footer` + `ConfigCompany.companyLogoFileId` + `CompanyPortalConfigurationDetail.companyPortalBrandingConfig` + spec docs/IIRM-8058 |
| Portal URL (C-01) | `ConfigCompany.subDomain` + DevOps DNS/SSL pipeline |
| Auth & Security (C-02 to C-09) | `CompanyAuthenticationConfig` + `CompanyConfig.passwordRules` + docs/IIRM-10385 |
| Dashboard Modules (G-01 to G-04) | `CompanyPortalConfigurationDetail.companyPortalDashboardConfig` JSONB + docs/IIRM-8058 |
| FAQs (H-*) | `Strapi: company-template/faq-item` + iWork FAQ Tab + docs/IIRM-7591 |
| Contact Matrix (D-*) | `Strapi: company-template/contact-matrix` + `contact-group` + `contact-person` |
| Disclaimers (G-05/06, G*-15/16) | `Strapi: company-template/disclaimer-note` + `policy-template/disclaimer-note` |
| Info Points (E*-05/06) | `Strapi: policy-template/info-point` |
| Feature Toggles (G*-*) | `PolicyConfiguration.policyConfiguration` JSONB + docs/IIRM-8059 |
| Document Library (F-*) | iWork → Policy Configuration → Document Library + docs/IIRM-7931 |
| Hospital Network (F*-07/08) | iWork → Hospital Network Tab + docs/IIRM-7589, IIRM-10093 |
| Enrolment Rules (E*-07 to E*-14) | `Strapi: policy-template-config` + `PolicyConfiguration` + docs/IIRM-10091 |
| Claims Config (G*-17 to G*-20) | iWork → Claim Module Tab + docs/IIRM-10092, IIRM-10096 |
| Localisation (LOC-*) | Frontend portal logic + API filters |
| Infrastructure (INF-*) | `/environments/.env.*` + DevOps runbook |
| Integrations (INT-*) | docs/IBP-API Integrations + connector service |
| QA / Compliance (QA-*) | DPDP Act 2026, WCAG 2.1, OWASP guidance |

---

*End of v9 DRAFT.*
