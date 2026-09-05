# IBP Zoho People Integration — Product Requirements Document

**Module:** ZOHO-INTEGRATION
**Product:** Integrated Benefits Portal (IBP) — HR Portal
**Client:** IIRM
**Stage:** 40a — Module PRD
**Authored:** 2026-07-20
**Audience:** Product owners, HR admins, client stakeholders, QA leads

---

This document specifies the product behavior for the **Zoho People Integration** module within the IBP HR Portal, using the reverse engineering method to understand the implemented business logic. The module lets an HR Admin connect their organization's Zoho People account to IBP and bring employee data already maintained there into a specific policy, instead of manually re-keying it or preparing a CSV/Excel file by hand. Anyone reading this doc cold should be able to determine what the module does, who it serves, and how to verify it is working correctly.

---

## Scope

### In scope

- OAuth2 authorization-code connection between a company and its Zoho People organization (India data center — `zoho.in` — only)
- Encrypted, per-company storage of the resulting Zoho access and refresh tokens
- Automatic access-token refresh ahead of expiry
- **Preview** of the company's Zoho People employee roster ("Sync Now") — a read-only fetch, not a database write
- **Push to a policy** — converting the previewed roster into a specific policy's own configured enrollment Excel template and submitting it through the existing bulk-endorsement-upload pipeline as a financial endorsement
- Manual disconnect, with best-effort token revocation at Zoho
- "Go to Zoho People" deep link from the portal, requiring no re-authentication

### Out of scope

- Any automatic or scheduled write from Zoho into `policy_enrollment_employee` (or any other table) without an HR Admin explicitly reviewing and confirming a target policy
- A single action that pushes data across multiple policies or the whole company at once — every push is scoped to one policy
- Two-way sync (IBP data flowing back into Zoho)
- Any Zoho module other than People (no Zoho CRM, Books, Recruit, etc.)
- Zoho data centers other than India — US/EU/AU/CN Zoho orgs are not supported
- Scheduled/cron-triggered sync — every preview and every push is a manual HR Admin action today
- The internal validation/processing logic of the enrollment-upload pipeline itself — Zoho Integration is a producer of a file into that pipeline; the pipeline's own behavior is owned by the Endorsement Management module (`docs/implementation/ibp-service/inception-endorsement/`)

---

## Flow Overview

The module has **two pages** that are easy to conflate but behave very differently, and no dedicated backend write path connects them directly.

**Settings → Integrations tab** (`/hr-portal/settings?tab=integrations` → `SettingsIntegrationsTab`): where an HR Admin connects, previews, disconnects, and jumps to Zoho People. This is also the redirect target of the OAuth callback (`?zoho=connected` / `?zoho=error&reason=...`).

**Zoho Endorsement page** (`/hr-portal/zoho-endorsement` → `ZohoEndorsementPage` → `ZohoEndorsementDialog`): reached only via a handoff from the Settings tab (`navigate(..., { state: { employees } })`, carrying the previewed employee list in React Router state — not a fresh API call). Here the HR Admin picks one target policy; the system downloads that policy's configured enrollment template, fills it client-side with the previewed Zoho data, and submits it through the platform's existing enrollment-upload endpoint as a `FINANCIAL_ENDORSEMENT`.

**On submission, the existing Endorsement Management pipeline takes over** exactly as it would for a manually-authored bulk-upload file (see `docs/implementation/ibp-service/inception-endorsement/hr-portal-inception-endorsement-trd.md` for that pipeline's internals). Zoho Integration does not create, own, or track the resulting endorsement's lifecycle — it only produces the file that starts it.

There is no page, route, or endpoint for "sync all employees for this company" — every persist requires a policy selection and a manual submit.

---

## Implementation Status

BRs without a status marker are **Implemented**. Rules tagged `Partial` or `Not Built` are noted inline on each BR and detailed in the [Gap Register](#gap-register).

- **Reverse-engineered from code:** BR-ZOHO-001 through BR-ZOHO-012. All are working as coded; several have defects or gaps flagged inline.
- **No new product decisions have been layered on top of this PRD yet** — unlike some other reverse-engineered modules, every BR here reflects existing code, not a forward-looking design decision.

---

## User Stories

MODULE code is **ZOHO**.

---

### Connect

**US-ZOHO-001** — As an **HR Admin**, I want to connect our organization's Zoho People account to IBP via OAuth, so that I don't have to manage or share separate Zoho credentials with anyone else.

- Traces to: UC-CONNECT-01 / FR-CONNECT-01

**US-ZOHO-002** — As an **HR Admin**, I want re-authorizing an already-connected integration to not silently lose our stored refresh token, so that the connection doesn't unexpectedly break the next time the access token expires.

- Traces to: UC-CONNECT-02 / FR-CONNECT-02

---

### Preview

**US-ZOHO-003** — As an **HR Admin**, I want to preview our current Zoho People employee roster from within IBP, so that I can see what data is available before deciding whether to use it.

- Traces to: UC-PREVIEW-01 / FR-PREVIEW-01

**US-ZOHO-004** — As an **HR Admin**, I want to be clearly told if the Zoho fetch failed, so that I never mistake placeholder or fallback data for my organization's real roster.

- Traces to: UC-PREVIEW-02 / FR-PREVIEW-02
- Note: this story documents intended behavior; current implementation does **not** satisfy it — see BR-ZOHO-007 (`Not Built` as a hard error) and GAP-01.

---

### Push to a Policy

**US-ZOHO-005** — As an **HR Admin**, I want to push the previewed Zoho roster into a specific policy, using the exact same review and validation experience as a manual bulk upload, so that Zoho-sourced data is held to the same standard as any other data entering the system.

- Traces to: UC-PUSH-01 / FR-PUSH-01

**US-ZOHO-006** — As an **HR Admin**, I want the pushed file to automatically match the target policy's own configured template columns, so that I don't have to manually reformat Zoho's export to fit each policy.

- Traces to: UC-PUSH-02 / FR-PUSH-02

---

### Disconnect & Portal Access

**US-ZOHO-007** — As an **HR Admin**, I want to disconnect the Zoho integration at any time, so that IBP's access to our Zoho data can be revoked whenever we choose.

- Traces to: UC-DISCONNECT-01 / FR-DISCONNECT-01

**US-ZOHO-008** — As an **HR Admin**, I want a one-click link to open our Zoho People portal directly, so that I don't have to remember or re-navigate to a separate URL.

- Traces to: UC-PORTAL-01 / FR-PORTAL-01

---

## Business Rules

The rules below govern the connection lifecycle, data fetch, and hand-off to persistence. They are derived directly from the implemented logic and must be preserved in any future change.

---

**BR-ZOHO-001 — One active connection per company**
`company_zoho_integration.company_id` is unique. A company can have at most one active Zoho connection at a time; re-connecting updates the existing row (`upsertTokens`) rather than creating a second one.

---

**BR-ZOHO-002 — Refresh token is preserved across re-authorization**
Zoho only returns a `refresh_token` on the *first* authorization of the app; subsequent re-authorizations omit it. On callback, if Zoho's response has no `refresh_token`, the service loads the existing connection row and reuses its already-encrypted `refreshToken` rather than overwriting it with `undefined`. Without this, a routine re-authorization (e.g., an admin re-clicking Connect to fix a scope issue) would silently break the integration the next time the access token needed refreshing.

---

**BR-ZOHO-003 — Proactive access-token refresh**
Before any call to the Zoho Employee API, the stored access token is refreshed if it is within 5 minutes of `token_expires_at` (or if `token_expires_at` is null). This happens inline, adding one extra round-trip to Zoho only when needed — not on every request.

---

**BR-ZOHO-004 — Preview never writes to the database**
The "Sync Now" action (`POST /sync`) is read-only against Zoho's live API. It does not insert, update, or upsert any row in `policy_enrollment_employee` or any other application data table. The only way Zoho-sourced employee data reaches a persisted table is BR-ZOHO-008 (push to a policy).

---

**BR-ZOHO-005 — Zoho role requirement for authorization**
The Zoho user who clicks Accept on the OAuth consent screen must be either a Zoho People Super Admin, or a user whose role has **API Access** explicitly enabled in Zoho People's own admin settings. This is enforced entirely on Zoho's side — IBP has no way to check or grant this in advance. A regular employee authorizing results in every subsequent API call failing with Zoho error 7077 (`403`).

---

**BR-ZOHO-006 — Pagination and rate-limit compliance**
Employees are fetched from Zoho in batches of 200 (`sindex`/`limit` params), with a 400ms delay between pages to stay under Zoho's 25 requests/minute cap. A `429` response triggers a single 60-second wait and retry of that same page — there is no further backoff or retry limit beyond this one retry.

---

**BR-ZOHO-007 — Dummy-data fallback on Zoho API failure** `Not Built` (as a hard error)
If the Zoho Employee API call fails for any reason (expired auth, wrong scope, network error, exhausted retry), the current implementation does **not** surface a hard error to the HR Admin. Instead, `syncEmployees` silently substitutes 3 hardcoded sample employees ("Rahul Sharma", "Priya Nair", "Amit Patel") and returns them exactly as if they were a genuine preview. The only signal that this happened is a string embedded in the response's `errors` array — there is no UI-blocking warning confirmed, and nothing distinguishes a real preview from a fallback preview once it reaches the Zoho Endorsement page.

**Decision needed (not yet made):** whether this fallback should be removed entirely, kept only behind a non-production flag with an unmissable UI banner, or replaced with a hard error. Until this is decided and implemented, an HR Admin can push fabricated sample data into a real policy's endorsement without realizing the source data was fake. See GAP-01.

---

**BR-ZOHO-008 — Persistence is exclusively via the existing endorsement pipeline**
There is no direct-write code path from Zoho data into `policy_enrollment_employee`. The only way Zoho-sourced data is persisted is: an HR Admin, on the Zoho Endorsement page, selects one target policy; the system downloads that policy's own configured enrollment template, fills it client-side with the previewed employee data, uploads the filled file, and submits it via `POST /policy/:policyId/enrollment-upload` with `endorsementType: "FINANCIAL_ENDORSEMENT"` — the identical request shape a manual bulk upload would send.

**Why this design, not a direct write:** every policy can have its own configured data template with different required columns and validation rules. Building a file that conforms to the target policy's template and handing it to the existing, already-validated upload pipeline means Zoho data goes through the exact same business rules, row-level validation, and audit trail as any manually-authored file — nothing about Zoho-sourced data is treated as more or less trusted than data an HR Admin types in by hand.

---

**BR-ZOHO-009 — Sync stats are not tracked** `Not Built`
`company_zoho_integration.last_synced_at` and `last_sync_stats` are designed to be written after a sync (a repository method, `updateSyncStats`, exists for exactly this purpose), but it is never called from anywhere in the codebase. `GET /status` will therefore never reflect a real sync history, no matter how many times "Sync Now" or a push-to-policy has succeeded. See GAP-02.

---

**BR-ZOHO-010 — Best-effort disconnect**
Disconnecting attempts to revoke the refresh token at Zoho (`POST /oauth/v2/token/revoke`) but does not require that call to succeed — local deactivation (`is_active = false`, tokens cleared) proceeds regardless of whether Zoho's revocation responds successfully. This ensures an HR Admin can always locally disable the integration even if Zoho's revocation endpoint is unreachable.

---

**BR-ZOHO-011 — `companyId` is caller-supplied, not JWT-derived** `Partial`
`/sync`, `/status`, `/portal-url`, and `/disconnect` all accept `companyId` as a query parameter and act on it directly, without verifying it matches the authenticated caller's own company (as most other IBP modules do — deriving `companyId` from the JWT or explicitly checking ownership before acting). Any authenticated HR Admin JWT can currently query or mutate another company's Zoho connection state by supplying a different `companyId`. See GAP-03.

---

**BR-ZOHO-012 — Field mapping is fixed, not template-aware, at the fetch layer**
`ZohoPeopleApiService.mapRecord` maps a fixed set of Zoho form field names (`EmployeeID`, `FirstName`, `Date_of_birth`, etc.) into the internal `ZohoEmployee` shape. This mapping has not been validated against any real customer's actual Zoho People form configuration, which Zoho allows organizations to customize per-org. Template-awareness only enters the flow later, at the Zoho Endorsement page, where the *target policy's* template headers determine what gets written into the filled file — but the initial Zoho→`ZohoEmployee` mapping itself is not configurable per company.

---

## Acceptance Criteria

Each criterion maps to one or more user stories above. Written in Given/When/Then format for direct use in QA and client sign-off.

---

**AC-ZOHO-001** (→ US-ZOHO-001) `Built`
**Given** an HR Admin who has not yet connected Zoho for their company,
**When** they click "Connect Zoho People" and complete the Zoho consent screen as a Super Admin (or API-access-enabled role),
**Then** IBP stores an encrypted access token and refresh token for that company and redirects back to Settings → Integrations with `?zoho=connected`.

---

**AC-ZOHO-002** (→ US-ZOHO-002, BR-ZOHO-002) `Built`
**Given** a company with an existing Zoho connection,
**When** the HR Admin re-authorizes and Zoho's token response omits a new `refresh_token`,
**Then** the previously stored (encrypted) refresh token remains intact and usable for subsequent access-token refreshes.

---

**AC-ZOHO-003** (→ US-ZOHO-003, BR-ZOHO-004) `Built`
**Given** a connected company with a working Zoho token,
**When** the HR Admin clicks "Sync Now",
**Then** the company's real Zoho People employees are returned as a preview, and no row is written to `policy_enrollment_employee` or any other data table as a result.

---

**AC-ZOHO-004** (→ US-ZOHO-004, BR-ZOHO-007) `Not Built`
**Given** a connected company whose Zoho token has been revoked externally (or any other Zoho API failure condition),
**When** the HR Admin clicks "Sync Now",
**Then** the HR Admin should see an unmissable, blocking error indicating the fetch failed — **not** a preview populated with fake sample employees. *(Current behavior fails this criterion — see GAP-01.)*

---

**AC-ZOHO-005** (→ US-ZOHO-005, US-ZOHO-006, BR-ZOHO-008) `Built`
**Given** a previewed employee list handed off to the Zoho Endorsement page,
**When** the HR Admin selects a target policy and submits,
**Then** a file matching that policy's own configured template column order is generated, uploaded, and submitted as a `FINANCIAL_ENDORSEMENT` via the same endpoint a manual bulk upload would use.

---

**AC-ZOHO-006** (→ US-ZOHO-007) `Built`
**Given** a connected company,
**When** the HR Admin clicks "Disconnect",
**Then** the local connection is deactivated regardless of whether Zoho's token-revocation call succeeds or fails.

---

**AC-ZOHO-007** (→ US-ZOHO-008) `Built`
**Given** a connected company,
**When** the HR Admin clicks "Go to Zoho People",
**Then** they are taken to the Zoho People portal URL without being asked to re-authenticate.

---

**AC-ZOHO-008** (→ BR-ZOHO-005) `Built`
**Given** a Zoho user without Super Admin or API Access authorizing the connection,
**When** IBP subsequently calls any Zoho API,
**Then** the failure surfaces referencing Zoho error 7077, with guidance to enable API Access for that role in Zoho People settings.

---

## Data Contract

This section defines what the Zoho Integration module consumes and produces. It does not describe internal implementation — that belongs in the TRD (Stage 40b).

### Consumed by Zoho Integration

| Source | Shape | Purpose |
|---|---|---|
| `accounts.zoho.in/oauth/v2/auth` + `/oauth/v2/token` | OAuth2 authorization-code + token exchange | Connect flow |
| `people.zohoapis.in/api/forms/employee/getRecords` | Paginated Zoho form records | Employee preview data |
| `company_zoho_integration` (own table) | `{ accessToken, refreshToken, tokenExpiresAt, scopes, isActive }` | Connection state read on every preview/refresh/disconnect |
| React Router state (`{ employees }`) | `ZohoEmployee[]` | Handoff from Settings tab to Zoho Endorsement page — no API call |
| `GET /policy/:policyId/template` (policy-service) | `{ documentId }` | Target policy's configured template document |
| `GET /file-upload/:documentId/download` (org-service) | `.xlsx` binary | The template file to be filled |

### Produced by Zoho Integration

| Destination | Shape | Purpose |
|---|---|---|
| `company_zoho_integration` (own table) | Encrypted tokens, scopes, `zohoDomain`, `isActive` | Written on connect/refresh/disconnect |
| `POST /file-upload/upload` (org-service) | Multipart `.xlsx` | The filled endorsement file |
| `POST /policy/:policyId/enrollment-upload` (policy-service) | `{ documentId, documentType, endorsementType: "FINANCIAL_ENDORSEMENT", ... }` | Hands off to the existing Endorsement Management pipeline — this is the only write of Zoho-originated employee data into the platform |

### Cross-module contract items

- **Endorsement Management module** (`docs/implementation/ibp-service/inception-endorsement/`): Zoho Integration is a *producer* into this module's existing upload pipeline. It does not create, own, or advance an endorsement's lifecycle after submission — that is entirely the receiving module's responsibility, identical to a manual upload. Any change to the `enrollment-upload` request contract must be validated against both modules.
- **Policy Configuration module** (template ownership): the exact columns Zoho data gets mapped into at push time are owned by whichever policy the HR Admin selects, via that policy's configured template document. Zoho Integration has no fixed, company-wide output schema for employee data — it always defers to the target policy's own template.
- **`FieldEncryptionService`** (shared, `service-lib`): Zoho access/refresh tokens are encrypted using this shared service, the same one used for other PII/secret-at-rest fields across the platform. Any change to its key management or algorithm affects this module's stored tokens.

---

## Gap Register

Tech Lead reference: every BR tagged `Partial` or `Not Built` maps to a row below. Ordered by fix effort — defects/risks first, enhancements last.

| GAP | Group | BRs | Description | Files |
|---|---|---|---|---|
| GAP-01 | Defect / Risk | BR-ZOHO-007 | Silent dummy-data fallback on any Zoho API failure; no hard error, no unmissable UI warning. Must be resolved before any real customer relies on this. | `zoho-integration.service.ts` (`syncEmployees`, `DUMMY_EMPLOYEES`) |
| GAP-02 | Defect | BR-ZOHO-009 | `updateSyncStats` repository method is unused; `last_synced_at`/`last_sync_stats` never persist. `GET /status` is permanently stale. | `zoho-integration.repository.ts`, `zoho-integration.service.ts` |
| GAP-03 | Security | BR-ZOHO-011 | `companyId` accepted as a caller-supplied query param on 4 endpoints without verifying it against the JWT-authenticated caller's own company. | `zoho-integration.controller.ts` |
| GAP-04 | Defect | — | OAuth CSRF `state` is stored in a process-local in-memory `Map`, not Redis — breaks in any multi-instance deployment where the callback lands on a different pod than the one that issued `auth-url`. | `zoho-integration.service.ts` (`oauthStateStore`) |
| GAP-05 | Enhancement | — | `/hr-portal/zoho-endorsement` has no guard for direct navigation, refresh, or back-button — it relies entirely on router state from the Settings tab handoff and shows no data if reached any other way. | `ZohoEndorsementPage/index.tsx` |
| GAP-06 | Validation gap | BR-ZOHO-012 | Zoho field-name mapping (`EmployeeID`, `Date_of_birth`, etc.) unconfirmed against any real customer's Zoho People form configuration. | `zoho-people-api.service.ts` (`mapRecord`) |
| GAP-07 | Process | — | Feature branch (`feature/zoho-api-integration-hr-module`) is 251 commits ahead / 527 behind `production`, no PR opened. | n/a |

---

## Open Questions

These items were unresolved during reverse engineering and must be answered before Stage 40b (TRD) is finalized.

1. **Dummy-data fallback disposition** (GAP-01) — should it be removed entirely, kept as an explicit non-production demo mode with a mandatory UI banner, or replaced outright with a hard error? This blocks closing BR-ZOHO-007/AC-ZOHO-004.

2. **`last_synced_at` semantics** (GAP-02) — once `updateSyncStats` is wired up, should it record the last *preview* fetch, or the last successful *push to a policy*? These are materially different events and the answer changes what `GET /status` should communicate to the HR Admin.

3. **Company-wide push** — is a "push previewed employees across multiple policies in one action" a real future requirement, or is the current one-policy-at-a-time design sufficient long-term? Affects whether GAP-05's navigation guard should simply redirect back to Settings, or whether the page needs its own independent data-loading capability.

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

---

# END OF PRD
