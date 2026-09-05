# IBP — Go-Live Definition (Production)

**Date:** 15 June 2026
**Version:** v2 — expanded from functional-features-only (v1) to include pre-requisites and full configuration inventory.
**Source of truth:** Production codebase (`apps/ui/ibp`, `apps/services/ibp-service`), verified against the `production` branch.
**Purpose:** Complete reference for onboarding a new client company to the IBP portal. Covers three areas:
1. **Pre-requisites** — what must be set up before a client can go live.
2. **Configuration by domain** — every setting that must be provided or confirmed per client (Authentication, Policy, Constraints, Enrollment, Strapi content, Integrations).
3. **Functional features** — every feature available to the client in production today.

The companion Excel (`IBP-Go-Live-Definition-v2.xlsx`) is the client-shareable version of this document, generated from `docs/IBP_Go-Live-Checklist/generate_ibp_docs.py golive-xlsx`.

---

## 1. What IBP Is

IBP (**Integrated Benefits Portal**) is the client-facing benefits platform. The "Integrated" reflects its offering pillars:

1. **Corporate benefits** — group insurance (GMC/GPA/GTL) enrollment, claims, e-cards, hospital network.
2. **Wellness** — hand-off to the external wellness platform.
3. **Policy Porting** — Corporate ↔ Retail insurance porting (and vice versa).
4. **Retail products for employees** — future: selling retail insurance products to enrolled employees.

It is a single application serving two portals on the same domain:

| Portal | Who logs in | Base path |
| --- | --- | --- |
| **HR Portal — branded "Risk Watch" on screen** | Client HR teams, external HR partners, IIRM CRM/broker users | `/hr-portal/*` |
| **Employee Portal** | Employees enrolled under the client's group policies | `/` (root routes) |

> **Naming note:** "Risk Watch" is the on-screen brand name of the HR Portal — the Portfolio header titles the workspace "Risk Watch", and employees who also hold an HR role see **"Switch to Risk Watch"** in their profile menu. In this document, HR Portal = Risk Watch.

**Policy types supported:** GMC (Group Mediclaim), GPA (Group Personal Accident), GTL (Group Term Life).

### Production access — one subdomain per client company

Each client company gets a dedicated subdomain on the production domain, e.g. **`https://democorporation.iwh.indiainsure.com`**. The subdomain drives multi-tenancy:

- The frontend extracts the subdomain and resolves it via config-service (`company-auth-config/subdomain/{subdomain}`) to the company.
- The resolved config controls per-company **branding** (logo, welcome text), **enabled authentication methods**, **password rules**, and portal dashboard/policy configuration.
- All data access is scoped to the resolved company; country-specific logos exist for India, Kenya, and Sri Lanka.

---

## 2. Portal User Roles

| Role key | Label shown on screen | Who it is | Access summary |
| --- | --- | --- | --- |
| `PORTAL_CRM` | CRM / Broker | IIRM internal CRM user managing multiple client companies (arrives via iWork token hand-off) | Full HR Portal incl. multi-company Portfolio and User Management |
| `HR_ADMIN` | HR Admin | Client-side HR administrator | Full HR Portal for their company/group, except User Management |
| `ONLY_HR` | HR User | Client-side standard HR user | Same screens as HR Admin (no separate screen-level restriction in production today) |
| `EXTERNAL_HR` | External HR | Outsourced/partner HR user | HR Portal minus **Reports** and **User Management** |
| `ROLE_COMPANY_EMPLOYEE` | Employee | Enrolled employee | Employee Portal only |
| Hybrid (employee + HR/CRM) | — | User who is both enrolled employee and HR/CRM | Can switch between Employee Portal and Risk Watch from the profile menu |

Role gating is enforced in the sidebar/menu and routes (`apps/ui/ibp/src/app/components/HRPortalSidebar/index.tsx`).

---

## 3. Login & Authentication (both portals)

- Login with email/phone + password, or OTP-based sign-in.
- OTP delivery method selection — Email OTP or Phone OTP (**flag-gated:** `FF_MULTI_AUTH`).
- Forgot password — OTP to registered email/phone, then reset.
- Password complexity rules enforced on set/change (**flag-gated:** `FF_PASSWORD_RULES`).
- First-time onboarding — password-readiness check and initial password set.
- Terms & Conditions acceptance popup on first login; consent can be viewed/withdrawn from Profile (**flag-gated:** `FF_IBP_CONSENT_MANAGEMENT`).
- CRM users land in the portal via a short-lived iWork token exchanged for a portal session.
- Session timeout with automatic logout; refresh-token rotation.

---

## 4. HR Portal (Risk Watch) — Features by Module

Sidebar navigation in production: **Portfolio, Dashboard, Reports, Hospitals, Support Ticket, User Mgmt** (User Mgmt visible to CRM only). **CD Management** (`/hr-portal/finance`) is built but has no sidebar entry yet — reachable only by direct URL. Each module below lists the roles that can access it.

### 4.1 Portfolio Overview
**Roles:** PORTAL_CRM, HR_ADMIN, ONLY_HR, EXTERNAL_HR
*(CRM sees all managed companies and groups; HR roles see their own company/group only)*

- View all companies (CRM: every managed company + group hierarchies; HR Admin: own group companies).
- KPI summary cards across the portfolio (companies, policies, premium, lives).
- Drill into a company → opens its Dashboard.
- View company details: policies held, employee counts, premium.

### 4.2 Dashboard
**Roles:** All HR Portal roles

- Policy cards: policy name, type (GMC/GPA/GTL), sum insured, validity, status; click-through to policy detail.
- KPIs: total premium, claims amounts, enrollment %, active employees.
- Charts: premium summary, claims KPIs (paid/outstanding/rejected), monthly claims trend, top diseases, top hospitals by claims, top employees by claims.
- Policy renewal alert banner (days to expiry).
- Filter everything by company (group selector) and policy location (header filters).

### 4.3 Enrollment & Employee Management
**Roles:** All HR Portal roles

Three tabs:
1. **Enrollment** — employee roster: search, paginate, filter by status (Enrolled / Pending / Not Enrolled / Inactive); click an employee to open their profile.
2. **Endorsement** — view endorsement requests/history; initiate inception endorsement (add lives via the enrollment flow); endorsement progress stats per location; uploaded-data summary per endorsement.
3. **Analytics** — employee count KPIs (total/active/inactive/enrolled), age distribution, gender distribution.

Bulk operations (backed by `ibp-service`):
- Upload employee data file (bulk roster/enrollment upload) and trigger processing.
- Download uploaded files (single or ZIP).

### 4.4 Employee Profile (drill-down)
**Roles:** All HR Portal roles

- View personal details, dependents, enrolled policies with sum insured and validity.
- Download e-cards for the employee and each dependent.
- Edit employee details.
- Disable user / mark active-inactive.
- Trigger password reset for the employee.
- View activity log.

### 4.5 Claims
**Roles:** All HR Portal roles

- Claims list with search and status filters (sourced from TPA with smart 24-hour caching).
- Claim detail: status timeline, documents, employee and policy info.
- **Intimate claim on behalf of an employee** (**flag-gated:** `FF_CLAIM_INTIMATION_MANAGEMENT`): select employee/policy/member, enter claim details, upload supporting documents, submit, receive reference number.

### 4.6 Hospital Network
**Roles:** All HR Portal roles

- Network hospital directory: search by name/city, filter by location/policy.
- Hospital contact details.
- Export hospital network list to Excel.

### 4.7 Reports
**Roles:** PORTAL_CRM, HR_ADMIN, ONLY_HR — **hidden for EXTERNAL_HR**

Live downloadable reports in production (CSV/Excel via report service):
| Report | Category | Notes |
| --- | --- | --- |
| Enrollment Report | Employees | Filter by enrollment status, location |
| Claims Report | Claims | Per policy; filter by claim status/type |
| Endorsement Summary Report | Endorsement | Endorsement listing |

Visible in the catalog but **not yet downloadable** (no live report key — shown as disabled/preview): Renewal Report, DNR Report, Enrollment Communication Report, Life Events Report, Premium Report.

### 4.8 CD Management (Cash Deposit)
**Roles:** All HR Portal roles

> **Nav note:** The page (`/hr-portal/finance`) is fully built and wired to live APIs but currently has no sidebar navigation entry. Users cannot reach it without a direct URL. This is a known gap — the sidebar entry needs to be added.

- **CD Account Details table** — all CD accounts mapped to the company: CD account number, linked policy number(s), deposit amount, minimum balance (value or %), running/deposit balance, utilised amount, utilisation %; aggregate total row at the bottom; search by account name or policy number.
- **View Transactions** — per-account CTA navigates to the transaction ledger pre-scoped to that account.
- **Transaction ledger / history** — paginated transaction history: date, policy, amount, type (Deposit / Deduction), bank, running balance, reference; expandable row with endorsement reference, IFSC, value date and remarks.
- **Filters** — date range presets (1/3/6/12 months or custom; default last 6 months) and transaction type (All / Deposit / Deduction); resets retain account scope.
- **Export** — account details and filtered transaction list downloadable as Excel; export disabled when no records visible.
- **KPI summary cards** — Total Deposit Balance, Utilised Amount, Total Deductions, Last Deposit Date (with amount and bank). *(KPI card UI built; verify with DevOps whether `cd_kpi_summary` report is deployed.)*
- Read-only: no transaction may be modified or deleted from the portal.

### 4.9 Support Ticket (Complaints)
**Roles:** All HR Portal roles

- View support tickets with status/category filters.
- Create new ticket with attachments.
- View ticket detail and track resolution status.

### 4.11 User Management
**Roles:** PORTAL_CRM only

- View all HR users (HR Admin / HR / External HR) across companies, with search and pagination.
- Create HR users with role selection — HR Admin ("Full HR module access") or HR ("Standard HR access").
- Create and manage External HR users.
- Edit user details and role; deactivate users.

### 4.12 Settings
**Roles:** All HR Portal roles

Tabs: **Profile** (edit own details), **Security** (change password), **Preferences** (notification preferences), **Employee**, **Subscription**.

### 4.13 Global / Cross-Module Features
**Roles:** All HR Portal roles unless noted

- **Company selector** — switch between group companies (header).
- **Policy location filter** — filter all data by location(s), incl. "No Location"; employee counts per location shown.
- **Global search** — live search across employees, claims, and policies; results grouped, click-through to detail.
- **Quick Actions panel** — Employee Details lookup, Insurance E-Card lookup/download, Claim Status lookup, Claim Submission shortcut.
- **Switch to Employee Portal** — hybrid users only (HR/CRM who are also enrolled employees).

---

## 5. Role → Functionality Matrix (HR Portal)

| Functionality | PORTAL_CRM | HR_ADMIN | ONLY_HR (HR User) | EXTERNAL_HR |
| --- | :-: | :-: | :-: | :-: |
| Portfolio overview (multi-company) | Yes — all managed companies | Yes — own group | Yes — own group | Yes — own group |
| Dashboard (KPIs, charts, policy cards) | Yes | Yes | Yes | Yes |
| Enrollment roster + analytics | Yes | Yes | Yes | Yes |
| Endorsement view / inception endorsement | Yes | Yes | Yes | Yes |
| Bulk employee data upload | Yes | Yes | Yes | Yes |
| Employee profile (view/edit/disable, e-card, reset password) | Yes | Yes | Yes | Yes |
| Claims list + claim detail | Yes | Yes | Yes | Yes |
| Intimate claim on behalf of employee *(flag-gated)* | Yes | Yes | Yes | Yes |
| Hospital network + Excel export | Yes | Yes | Yes | Yes |
| CD Management — account details & transaction history | Yes | Yes | Yes | Yes |
| Reports (download) | Yes | Yes | Yes | **No** |
| Support tickets | Yes | Yes | Yes | Yes |
| User Management (create/manage HR users) | **Yes — only role** | No | No | No |
| Settings (profile, password, preferences) | Yes | Yes | Yes | Yes |
| Global search / quick actions / location filter | Yes | Yes | Yes | Yes |
| Switch to Employee Portal | If also enrolled | If also enrolled | If also enrolled | — |

> HR_ADMIN vs ONLY_HR: in production today there is **no screen-level difference** between the two — both see the same HR Portal modules. The role labels exist for classification in User Management ("Full HR module access" vs "Standard HR access"); finer-grained restrictions are not yet enforced on screens.

---

## 6. Employee Portal — Features by Module

Header navigation: **Dashboard, Claims Corner, Claim Submission** *(flag-gated)*, **E-card, FAQs, Support, Policy Porting** (external), **Wellness** (external). Quick-links rail: Hospital Network, My Documents, Policy Features, Life Events, TPA Login, Chat Support (WhatsApp).

### 6.1 Dashboard (Home)
- Coverage summary across active policies; benefits overview per policy type.
- Enrollment status banner — Start / Continue / View Enrollment with deadline ("Closes by …").
- T&C acceptance popup (if pending), wellness banner, policy-porting banner.
- Action cards: hospital network, claim intimation & tracking, TPA cards, documents, policy features, enrollment, schedule callback, support.

### 6.2 Enrollment
**Single-policy flow:** validate personal details → manage family members/dependents (relation and age constraints enforced) → select coverage and optional top-ups with live premium calculation (company vs employee contribution shown) → review & declaration → submit → confirmation email.

**Unified multi-policy flow:** the same steps across all eligible policies (GMC/GPA/GTL) in one journey, finishing with **OTP identity verification** (mobile/email) before final submission.

- Save draft and resume later; progress tracked per step.
- View submitted enrollment summary (single or unified).
- Edit enrollment while window is open (`EDIT_ENROLL` status); read-only after lock.
- **Cut-off behavior:** incomplete enrollments are auto-submitted after the cut-off date (backend job).

### 6.3 E-Card
- View e-cards per policy and per member (self + dependents): TPA ID, coverage dates.
- Download e-card PDF per member.

### 6.4 Claims Corner
- Claims status across policies (TPA-synced) with KPIs and filters.
- Claim detail drill-down.
- Add-on coverage and limits; family members covered per policy.

### 6.5 Claim Intimation *(flag-gated: `FF_CLAIM_INTIMATION_MANAGEMENT`)*
- Multi-step submission: claim type (cashless/reimbursement) → policy & member → hospital (network search or manual) → diagnosis and estimate → document upload → review & submit with reference number.
- Confirmation email on submission.

### 6.6 Hospital Network
- Search empanelled hospitals by name, city, pincode, specialty; filter by state/district/city/agreement type.
- List and map views; export to Excel.

### 6.7 My Documents & Policy Features
- View/download policy feature documents (per policy and company-level documents).
- Upload, preview, and delete personal documents.
- Inline document preview.

### 6.8 Life Events *(flag-gated: `FF_LIFE_EVENT_DEPENDENT_MANAGEMENT`; GMC)*
- Post-enrollment dependent changes driven by life events: marriage, child birth, adoption, divorce, dependent death, eligibility changes.
- Flow: select event → add/remove dependent → choose benefits/top-up → review updated premium → upload proof documents → submit; confirmation email.

### 6.9 Profile
- Tabs: Profile (edit personal details), Employee (read-only company info), Security (change password), Preferences (notifications), Subscription.
- Activity log (logins, enrollment, profile changes) with email-notification previews.
- Consent management — view/accept/withdraw T&C *(flag-gated: `FF_IBP_CONSENT_MANAGEMENT`)*.

### 6.10 Support, FAQs & Contacts
- Raise support tickets with attachments; track status and history; confirmation email.
- Schedule a callback (date/time).
- FAQs searchable by category and keyword.
- Contact matrix — TPA, broker, HR, DPO, and grievance contacts per enrolled policy with escalation levels.

### 6.11 External Hand-offs
- **TPA Login** — one-click SSO (magic link) into the TPA portal, no re-login.
- **Wellness** — redirect to the external wellness platform with profile hand-off.
- **Policy Porting** — link to iirmwellness.co.in.

### 6.12 Hybrid Users
- Employees who also hold an HR/CRM role get **"Switch to Risk Watch"** in the profile menu → lands on HR Portal Portfolio. The reverse switch is available from the HR Portal profile menu.

---

## 7. SSO & External Integrations

### 7.1 Inbound SSO (how users get in)

| Integration | Mechanism | Notes |
| --- | --- | --- |
| **Google OAuth 2.0** | OAuth authorization-code flow via auth-service; tokens returned to `/auth/callback` | Available as a per-company authentication method (auth methods are DB-configured per subdomain) |
| **iWork CRM → IBP token exchange** | CRM user's short-lived iWork JWT exchanged at `crm-session` for IBP session tokens | Only `PORTAL_CRM` role accepted; this is how broker/CRM users land in Risk Watch without re-login |
| **Email OTP** | 6-digit OTP delivered via AWS SES | Login, first-time onboarding, password reset |
| **Phone OTP** | 6-digit OTP via SMS (SMSCountry Bulk API) | Method choice gated by `FF_MULTI_AUTH` |
| **Username / password** | Standard credential login | Default method; complexity rules gated by `FF_PASSWORD_RULES` |

Authentication methods are configured **per company** in the database and surfaced according to the subdomain — different clients can have different login options enabled.

### 7.2 Outbound SSO (magic-link hand-offs to external apps)

A generic, DB-configured external-app SSO engine (`external-app-sso/magic-url`, document-service) signs users into third-party platforms without re-login. Two patterns: **JWT** (signed token per app secret) and **SESSION** (authenticate first, then call data API with the session token). External apps are registered in the database, so new ones can be added without code changes.

| Target | Pattern | What the user gets |
| --- | --- | --- |
| **Good Health TPA (GHPL) portal** | SESSION | "TPA Login" quick link — auto-logged into the TPA portal for claims/e-card; also used for e-card fetch |
| **Alyve wellness platform** | Magic link | "Wellness" banner/menu — opens the wellness portal in a new tab with the user's profile handed off |
| **iConnect / Poppins** | JWT | DB-registered external app hand-offs |

### 7.3 TPA data integrations (behind the scenes, user-visible results)

| Integration | What it powers |
| --- | --- |
| **TPA claims sync (GHPL)** | Claims Corner (employee) and HR Claims list — claims fetched from the TPA, cached 24h with concurrency locking; scheduler keeps data fresh |
| **Hospital network sync** | Hospital directory in both portals — TPA hospital lists synced into the platform on a schedule (synced hospitals gated by `FF_SHOW_SYNCED_HOSPITALS`) |
| **E-card retrieval** | E-card pages — TPA-generated e-card PDFs delivered via signed URLs |

### 7.4 Other external services

| Service | Used for |
| --- | --- |
| **Google Maps** (Maps JS, Geocoding, Directions) | Hospital network map view, location search, "get directions" links |
| **AWS SES** | All transactional email (OTP, enrollment confirmations, claim/ticket confirmations, reminders) |
| **SMSCountry** | All SMS/OTP delivery |
| **AWS S3 (signed URLs)** | Secure document delivery — e-cards, policy documents, uploads, report downloads |
| **WhatsApp chat support** | "Chat Support" quick link — QR code (GHPL-hosted) opening a WhatsApp support chat |
| **Policy Porting site** | Header link to `iirmwellness.co.in` (external) |

---

## 8. Feature Flags (deploy-time configuration)

These features exist in the production build but are switched per environment at deploy time. **Production ON/OFF values are not stored in the repo — confirm with DevOps before treating any of these as client-visible.**

| Flag | Feature gated |
| --- | --- |
| `FF_CLAIM_INTIMATION_MANAGEMENT` | Claim intimation (Employee Portal "Claim Submission" + HR "Intimate Claim") |
| `FF_LIFE_EVENT_DEPENDENT_MANAGEMENT` | Life Events dependent management |
| `FF_IBP_CONSENT_MANAGEMENT` | T&C consent popup + consent section in Profile |
| `FF_MULTI_AUTH` | OTP delivery method choice (email vs phone) at login |
| `FF_PASSWORD_RULES` | Password complexity enforcement |
| `FF_COMPANY_LOGO` | Company logo/branding customization |
| `FF_SHOW_SYNCED_HOSPITALS` | TPA-synced hospitals in hospital network |

---

## 9. Known Exclusions & Notes

- **Insights / Risk Watch analytics page** (`/hr-portal/insights`): the page exists in code but its sidebar entry is commented out — it is **not reachable from production navigation** and is excluded from this definition.
- **CD Management / Finance page** (`/hr-portal/finance`): fully built with live APIs (report keys `cd_kpi_summary`, `cd_account_details`, `cd_transactions`), documented in section 4.8 — but has **no sidebar navigation entry** in production. Users cannot reach it without a direct URL. Action required: add sidebar entry to make it accessible.
- **Reports catalog**: only Enrollment, Claims, and Endorsement Summary reports are live; the other listed reports are visible but disabled (see 4.7).
- Country-specific branding exists for India, Kenya, and Sri Lanka (logo per country).
- This document describes the portal as built; it is not a roadmap. Anything flag-gated needs DevOps confirmation of the production flag value before being committed to a client.

---

## 10. Excel Layout — v2 (Three Sections)

The client-shareable Excel (`IBP-Go-Live-Definition-v2.xlsx`) is a single unified sheet.
Regenerate at any time: `python3 "docs/IBP_Go-Live-Checklist/generate_ibp_docs.py golive-xlsx"`

**Columns:** Ref | Group / Area | Item / Feature | Description — what's needed | Allowed Values / Options | Owner / Access | Where Configured | Feature Flag | Status

---

### Section A — Pre-requisites (Portal Go-Live)

12 items that must be completed before any client goes live. All sourced from the hand-edited v1 xlsx.

| Ref | Group / Area | Item / Feature | Owner / Access | Status |
| :-: | --- | --- | --- | --- |
| A1 | Tenant Setup | Company subdomain provisioning | DevOps | Mandatory |
| A2 | Tenant Setup | Portal configuration & branding | CRM | Mandatory |
| A3 | Tenant Setup | Authentication method configuration | CRM | Mandatory |
| A4 | Data Setup | Policy configuration | Service Team | Mandatory |
| A5 | Data Setup | Employee data upload | Service Team + HR | Mandatory |
| A6 | Data Setup | Enrollment window & cut-off dates | Service Team | Mandatory |
| A7 | Data Setup | Initial HR user accounts | CRM | Mandatory |
| A8 | Integrations | TPA registration (e.g., Good Health TPA) | IT | Conditional |
| A9 | Integrations | Wellness platform hand-off | IT | Mandatory |
| A10 | Content Setup | Contact matrix | CRM + HR | Mandatory |
| A11 | Content Setup | FAQs & company documents | CRM + HR | Mandatory |
| A12 | Content Setup | Terms & Conditions / consent content | CRM + HR | Mandatory |

---

### Section B — Configuration by Domain

163 rows of code-grounded configuration items across 6 sub-sections. These are the settings each owner must provide or confirm per client engagement.

| Sub-section | Rows | Owner(s) |
| --- | :-: | --- |
| B1. Authentication & Password Policy | 27 | IIRM / DevOps |
| B2. Policy Master & Policy-Portal Configuration | 24 | Service Team / CRM |
| B3. Policy Configuration — Constraints (Dependent Eligibility) | 24 | IIRM / Client |
| B4. Policy Configuration — Enrollment & Premium | 15 | IIRM / Client |
| B5. Content Management (Strapi) | 34 | Service Team / Client / IIRM |
| B6. Integrations, SSO & Notifications | 39 | IIRM / DevOps / Service Team |

**Amber rows** (Status = "Verify w/ Tech Lead"): 6 items that exist in the codebase but are not fully wired to a UI control or are orphaned legacy components — confirm with the Tech Lead before committing to a client.

> **Note:** Company creation and tenant provisioning are not in Section B — these are handled internally by IIRM as part of onboarding and are covered by Section A pre-requisites.

---

### Section C — Functional Features (In Production)

47 features across Login & Security, HR Portal (Risk Watch), Employee Portal, SSO & Integrations, and Cross-cutting. Sourced from the hand-edited v1 xlsx.

See sections 3–7 of this document for full feature descriptions.
| 8 | CD Management (HR) | CD Statement Filters | HR | Filter transactions by date range (presets: 1/3/6/12 months or custom; default last 6 months) and type (All / Deposit / Deduction). | — | Built — nav entry missing | |
| 9 | CD Management (HR) | CD Export | HR | Download account details and filtered transaction list as Excel. Export disabled when no records visible. | — | Built — nav entry missing | |

> Full Excel will contain ~55 feature rows across: Login & Security, HR Portal (Risk Watch) modules (incl. CD Management), Employee Portal modules, SSO & Integrations, and Cross-cutting features — plus the complete pre-requisites section.
