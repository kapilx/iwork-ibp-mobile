# Zoho People Integration — Technical Document

**Module:** IBP Service → HR Portal → Settings → Integrations
**Branch:** `feature/zoho-api-integration-hr-module`
**Status as of 2026-07-20:** 251 commits ahead of `production` / 527 commits behind — not merged, no PR opened, not rebased recently.
**PRD:** `zoho-integration-PRD.md`
**TRD:** `zoho-integration-TRD.md`
**Relationship to those two documents:** this doc is the low-level call-sequence and reference companion — full request/response shapes, error codes, and env vars. The PRD owns *what/why* (business rules, user stories, acceptance criteria, gap register). The TRD owns *how* at the architecture level (route inventory, data model, security review) and cross-references this doc's sequences by phase number.

---

## Overview

The Zoho People integration lets an HR Admin:

1. **Connect** their Zoho People organization via OAuth2 (one-time authorization).
2. **Preview** employees from Zoho People without writing anything to the DB yet.
3. **Push** that previewed employee list into a specific policy as a bulk endorsement, reusing the existing enrollment-upload pipeline.
4. **Open Zoho People** directly from the portal without re-entering credentials.
5. **Disconnect** the integration and revoke the OAuth tokens.

The integration targets the **Zoho India Data Center** (`zoho.in`).

> **Correction vs earlier draft of this doc:** the previous version of this document described Zoho sync as writing directly into `policy_enrollment_employee`. That is **not** what the code does. See [Sync & Persistence Flow](#sync--persistence-flow-step-by-step) below for the actual (two-stage, endorsement-based) flow.

---

## OAuth2 Connect Flow — Step by Step

Connecting Zoho is a **two-call process**. The tokens do NOT arrive in the browser redirect — they come in a separate backend-to-backend call.

### Step 1 — Browser redirect (gets only a short-lived code, NOT tokens)

```
HR Admin clicks "Connect Zoho People" (on /hr-portal/settings?tab=integrations)
  → Frontend calls:
    GET /iirm/ibp-service/hr-module/zoho/auth-url
      ?companyId=364776
      &frontendOrigin=http://testing.localhost:4201   ← window.location.origin

  → ibp-service (ZohoIntegrationController.getAuthUrl → ZohoIntegrationService.buildAuthUrl):
      - Generates a random 16-byte state token (CSRF protection)
      - Stores { companyId, frontendOrigin, expiresAt: now+10min } in an in-memory Map
      - Returns the Zoho OAuth2 URL

  → Frontend does: window.location.href = that URL
  → Browser navigates to Zoho:

    https://accounts.zoho.in/oauth/v2/auth
      ?response_type=code
      &client_id=<ZOHO_CLIENT_ID>
      &scope=ZohoPeople.forms.READ
      &redirect_uri=http://localhost:3000/iirm/ibp-service/hr-module/zoho/callback
      &access_type=offline        ← ensures Zoho also issues a refresh_token
      &state=<random_hex>

  → Admin sees Zoho consent screen → ticks checkbox → clicks Accept
  → Zoho redirects browser back to our callback URL:

    http://localhost:3000/iirm/ibp-service/hr-module/zoho/callback
      ?code=1000.abc123...    ← one-time code, valid ~2 min, NOT the token
      &state=<same_random_hex>
```

### Step 2 — Backend token exchange (access_token and refresh_token arrive here)

```
ibp-service /callback (ZohoIntegrationController.callback → ZohoIntegrationService.handleCallback):

  1. Validate state against the in-memory oauthStateStore — must match and not be expired (CSRF check)

  2. Server-to-server call to Zoho (browser not involved):

     POST https://accounts.zoho.in/oauth/v2/token
       grant_type    = authorization_code
       client_id     = <ZOHO_CLIENT_ID>
       client_secret = <ZOHO_CLIENT_SECRET>
       redirect_uri  = <ZOHO_REDIRECT_URI>
       code          = 1000.abc123...

  3. Zoho responds:
     {
       "access_token":  "1000.xxxxx",   ← valid 1 hour
       "refresh_token": "1000.yyyyy",   ← valid 30 days (ONLY on first authorization)
       "expires_in":    3600,
       "api_domain":    "https://www.zohoapis.in"
     }

  4. ibp-service encrypts both tokens (AES-256-GCM via FieldEncryptionService) → upserts into
     company_zoho_integration table (ZohoIntegrationRepository.upsertTokens)

     If Zoho didn't return a refresh_token (re-authorization case), the existing encrypted
     refresh_token is preserved from DB instead of being overwritten with null.

  5. Returns HTTP 200 HTML with JS redirect back to frontend:
     window.location.replace(
       "http://testing.localhost:4201/hr-portal/settings?tab=integrations&zoho=connected"
     )
```

> **Why JS redirect instead of HTTP 302?**
> The API gateway proxies via axios, which follows HTTP 302 redirects server-side. That causes it to serve the frontend SPA HTML from the wrong origin. A `200` HTML response with `window.location.replace` bypasses this — the browser follows it client-side.

> **Why frontendOrigin as a query param?**
> The HR Admin may access the portal at `testing.localhost:4201` or `localhost:4201`. `window.location.origin` is passed explicitly so the callback redirects back to the correct domain. The `Origin` header cannot be relied on because the API gateway may strip or change it.

> **Refresh token — only on first authorization**
> Zoho only returns `refresh_token` the very first time the admin authorizes the app. Re-authorizing later skips it. The code handles this by preserving the existing refresh token from DB if Zoho doesn't send a new one.

---

## Sync & Persistence Flow — Step by Step

This is a **two-stage** flow: stage 1 previews data (no DB write), stage 2 persists it via the existing endorsement pipeline for one specific policy.

### Stage 1 — Preview (Settings → Integrations tab)

```
HR Admin clicks "Sync Now" (on /hr-portal/settings?tab=integrations)
  → Frontend calls:
    POST /iirm/ibp-service/hr-module/zoho/sync?companyId=364776
    Authorization: Bearer <JWT>

ibp-service ZohoIntegrationService.syncEmployees():

  1. Look up company_zoho_integration row for this companyId (must be connected already)

  2. getValidAccessToken(): if access_token expires within 5 minutes, refresh it via
     POST /oauth/v2/token (grant_type=refresh_token), save the new token; else decrypt
     and reuse the stored access_token.

  3. ZohoPeopleApiService.getAllEmployees(): fetch employees from Zoho in batches of 200:
       GET https://people.zohoapis.in/api/forms/employee/getRecords
         Authorization: Zoho-oauthtoken <access_token>
         sindex=1, limit=200
       → next page: sindex=201, limit=200 ...
       → stops when a batch returns fewer than 200 records
       (400ms delay between pages — Zoho rate limit: 25 req/min)
       (auto retry after 60s on HTTP 429 rate limit error)

  4. ✅ (Fixed 2026-07-20 — GAP-01) If the Zoho API call throws for ANY reason (bad
     scope, network error, expired refresh token, etc.), the service now rethrows a
     `BadRequestException`: "Failed to fetch employees from Zoho: <reason>. Please
     try again, or reconnect from Settings → Integrations if the problem persists."
     The controller's existing catch-all maps this to a 400 response with that exact
     message in the top-level `message` field, which the frontend's `handleSync`
     catch block already surfaces via a toast. There is no more silent dummy-data
     substitution — the previous 3-hardcoded-employee fallback (DUMMY_EMPLOYEES) and
     the `usedDummyData` flag have been removed from both the service and the DTO.

  5. Returns { synced, created: 0, updated: 0, skipped: 0, errors: [], durationMs,
     employees } to the frontend on success. NOTHING is written to the database
     at this point, and `company_zoho_integration.last_synced_at` / `last_sync_stats`
     are NOT updated (ZohoIntegrationRepository.updateSyncStats exists but is never
     called anywhere — dead code, GAP-02, still open).

  → Frontend (SettingsIntegrationsTab) shows the previewed employees, then on
    confirmation does:
       navigate("/hr-portal/zoho-endorsement", { state: { employees: previewEmployees } })
```

### Stage 2 — Persist as a policy endorsement (`/hr-portal/zoho-endorsement`)

```
ZohoEndorsementPage → ZohoEndorsementDialog, employees passed in via router state.

handlePreview() — build a filled Excel matching the target policy's own template:
  1. GET /iirm/policy-service/policy/:policyId/template
       → get that policy's configured data-template document id
  2. GET /iirm/org-service/file-upload/:documentId/download?moduleKey=inception
       → download the template as an .xlsx (arraybuffer)
  3. Parse Sheet 1's header row (row 0) with the `xlsx` library
  4. Map each header to a Zoho employee field (headerToField) and build data rows
     from the previewed `employees` list
  5. Write a NEW workbook: header row + employee rows (no dummy/example rows),
     keep the original column widths

handleSubmit() — upload the filled file and submit it as a real endorsement:
  1. POST /iirm/org-service/file-upload/upload (multipart, the filled .xlsx)
       → returns a documentId
  2. POST /iirm/policy-service/policy/:policyId/enrollment-upload
       {
         documentId,
         documentType: "policy_employee_data",
         employeeCount, dependentCount,
         enrollmentStartDate, enrollmentEndDate,
         endorsementRequestReceivedDate,
         endorsementType: "FINANCIAL_ENDORSEMENT",
         osTicketNumber, isInception, ...
       }
       → this is the SAME endpoint used for manual bulk-upload endorsements elsewhere
         in the app. All existing validation/business rules for endorsements apply.
```

**Net effect:** Zoho-sourced employee data only reaches `policy_enrollment_employee` (or wherever the endorsement pipeline ultimately writes it) if an HR Admin explicitly walks through Stage 2 for a specific policy. There is no "sync all employees for this company" action that writes directly to the DB — every persist is scoped to one policy, one endorsement, one manual confirmation.

---

## Architecture

```
Browser (HR Admin at testing.localhost:4201)
        │
        ├─ /hr-portal/settings?tab=integrations   (SettingsIntegrationsTab — connect/sync/disconnect)
        └─ /hr-portal/zoho-endorsement             (ZohoEndorsementPage — pick policy, build & submit endorsement)
        │
        ▼
API Gateway  (localhost:3000)  — route prefix: /iirm/ibp-service/  (and /iirm/policy-service/, /iirm/org-service/)
        │
        ▼
IBP Service  (localhost:3025)
  ├── ZohoIntegrationController   /hr-module/zoho/*   (auth-url, callback, status, sync, portal-url, disconnect)
  ├── ZohoIntegrationService      OAuth + token refresh + preview-only "sync"
  ├── ZohoPeopleApiService        Zoho REST API calls (paginated, rate-limit aware)
  └── ZohoIntegrationRepository   DB read/write for company_zoho_integration
        │
  ┌─────┴──────────────┬───────────────────────────────────┐
  ▼                     ▼                                   ▼
PostgreSQL DB      Zoho India DC                    Policy/Org services (existing pipeline)
company_zoho_      accounts.zoho.in (OAuth)         file-upload service, policy enrollment-upload
integration        people.zohoapis.in (Employee API)  → this is what actually writes employee data
```

---

## Frontend Routes

Both mounted under `/hr-portal/*` (`app.tsx:180`):

| Route | Component | Purpose |
|---|---|---|
| `/hr-portal/settings?tab=integrations` | `SettingsIntegrationsTab` | Connect / Sync Now (preview) / Disconnect / Go to Zoho People |
| `/hr-portal/zoho-endorsement` | `ZohoEndorsementPage` → `ZohoEndorsementDialog` | Pick a policy, build filled Excel from previewed employees, submit as endorsement |

The handoff between them is via React Router state (`navigate("/hr-portal/zoho-endorsement", { state: { employees } })`), not a fresh API call — so the endorsement page only ever sees whatever Stage 1 returned (including, if it silently failed, the 3 dummy employees).

---

## Backend API Endpoints

Base: `/iirm/ibp-service/hr-module/zoho/`

| Method | Path | Auth | What it does |
|---|---|---|---|
| GET | `/auth-url` | Public | Returns the Zoho OAuth2 URL for browser redirect |
| GET | `/callback` | Public | Receives code from Zoho, exchanges for tokens, saves to DB, redirects to frontend |
| GET | `/status` | JWT | Returns connected status + last sync info (currently always stale — see gap below) |
| POST | `/sync` | JWT | Fetches/previews employees from Zoho — **does not write to DB** |
| GET | `/portal-url` | JWT | Returns Zoho People portal URL |
| DELETE | `/disconnect` | JWT | Revokes tokens, deactivates the integration |

`/callback` and `/auth-url` are explicitly excluded from the JWT auth guard in `service-lib/src/lib/auth.guard.ts`.

Persistence of employee data happens through **pre-existing, unrelated** endpoints, reused as-is:

| Method | Path | Purpose |
|---|---|---|
| GET | `/iirm/policy-service/policy/:policyId/template` | Get the policy's configured data-template document id |
| GET | `/iirm/org-service/file-upload/:documentId/download` | Download that template |
| POST | `/iirm/org-service/file-upload/upload` | Upload the filled-in Excel |
| POST | `/iirm/policy-service/policy/:policyId/enrollment-upload` | Submit the upload as a `FINANCIAL_ENDORSEMENT` |

---

## What Is Implemented

| Feature | Status |
|---|---|
| OAuth2 Authorization Code flow (Connect) | ✅ Done |
| Token exchange — code → access_token + refresh_token | ✅ Done |
| Encrypted token storage (AES-256-GCM) | ✅ Done |
| Auto token refresh on expiry | ✅ Done |
| Employee preview — Zoho People → API response | ✅ Done |
| Employee **sync to DB** (direct) | ❌ Not implemented — no code path writes `policy_enrollment_employee` directly |
| Employee data reaching the DB (indirect, via endorsement) | ✅ Done, but per-policy and requires manual confirmation each time |
| Sync stats tracking (`last_synced_at`, `last_sync_stats`) | ❌ Not implemented — repository method exists (`updateSyncStats`) but is never called |
| "Go to Zoho People" portal URL | ✅ Done |
| Disconnect + token revocation | ✅ Done |
| Frontend Integrations tab (Settings page) | ✅ Done |
| JWT auto-injection in API client | ✅ Done |

## What Is Pending / Risks

| Item | Description |
|---|---|
| ~~Silent dummy-data fallback~~ | ✅ **Resolved 2026-07-20** — `/sync` now throws a hard, visible error ("Failed to fetch employees from Zoho: ...") instead of substituting fake employees. See §"Sync & Persistence Flow" step 4. |
| End-to-end sync validation | Zoho People **Super Admin** must authorize. Regular employee accounts return error 7077. |
| Redis state store | `oauthStateStore` is an in-memory `Map`. Must move to Redis for multi-instance deployments — otherwise a callback can land on a different instance than the one that generated the `state`, breaking the CSRF check. |
| Field mapping validation | Zoho field names must be verified against the actual org's Zoho People configuration. |
| Dead code | `ZohoIntegrationRepository.updateSyncStats` is unused; either wire it up (call it after a real sync) or remove it. |
| Stale `/status` | Since sync stats are never persisted, `GET /status` will never show a real `lastSyncedAt`/`lastSyncStats` even after a successful preview+endorsement flow. |
| Branch hygiene | 251 commits ahead / 527 behind `production`, no open PR. Needs a rebase before this can be reviewed/merged. |

---

## Required Environment Variables

| Variable | Purpose | Value for India DC |
|---|---|---|
| `ZOHO_CLIENT_ID` | OAuth app identifier | From Zoho API Console |
| `ZOHO_CLIENT_SECRET` | OAuth app secret | From Zoho API Console |
| `ZOHO_REDIRECT_URI` | Callback URL — must exactly match API Console | `http://localhost:3000/iirm/ibp-service/hr-module/zoho/callback` |
| `ZOHO_SCOPE` | OAuth permission scope | `ZohoPeople.forms.READ` |
| `ZOHO_ACCOUNTS_URL` | Zoho OAuth base URL | `https://accounts.zoho.in` |
| `ZOHO_BASE_URL` | Zoho People API base URL | `https://people.zohoapis.in` |
| `FRONTEND_IBP_URL` | Fallback redirect URL after OAuth | `http://localhost:4201` |

> `ZOHO_CLIENT_ID` and `ZOHO_CLIENT_SECRET` belong to the OAuth **application**, not to any user. They stay the same regardless of which admin authorizes.

### Scope History

| Scope | OAuth Consent | API Result |
|---|---|---|
| `ZohoPeople.forms.READ` | ✅ Valid | ✅ Correct — use this |
| `ZohoPeople.employee.READ` | ✅ Valid | ❌ Error 7218 — covers employee module API, not Forms API |
| `ZohoPeople.forms.ALL` | ✅ Valid | ❌ Error 7218 — covers form schema management, not record reading |
| `ZohoPeople.people.ALL` | ❌ Does not exist in India DC | — |
| `ZohoPeople.people.READ` | ❌ Does not exist in India DC | — |

---

## Zoho API Console Setup

1. Go to `https://api-console.zoho.in`
2. Click **Add Client → Server-based Applications** (this app calls the Zoho People API from `ibp-service`, a backend, so it must be a **Server-based Application** client — not a Client-based/Mobile/Self Client — since only this type issues both a client secret and a refresh token via the authorization-code flow that `handleCallback` implements).
3. Fill in the client registration form:

   | Field | What to enter | Notes |
   |---|---|---|
   | **Client Name** | Any descriptive name, e.g. `IBP HR Portal — Zoho People Integration` | Display name only; shown to the authorizing admin on the consent screen. Does not affect functionality. |
   | **Homepage URL** | The IBP frontend's public URL for this environment, e.g. `https://<env>.your-domain.com` | Zoho requires a homepage URL per client; use the environment's actual HR Portal URL (not `localhost` for staging/production). |
   | **Authorized Redirect URIs** | Must exactly match `ZOHO_REDIRECT_URI` for every environment this client will serve — e.g. `http://localhost:3000/iirm/ibp-service/hr-module/zoho/callback` for dev, and the equivalent on each environment's own domain for staging/production | Zoho allows multiple redirect URIs on one client — add one per environment rather than provisioning a separate client per environment, unless you want per-environment isolation/rotation. Must match **character-for-character**, including protocol, host, and path — a mismatch here is the most common cause of the OAuth exchange failing. |

4. Save → Zoho displays the **Client ID** and **Client Secret** for this client. Copy them into the environment's `.env` as `ZOHO_CLIENT_ID` / `ZOHO_CLIENT_SECRET` respectively — these values stay constant across every environment sharing the client (per step 3); only `ZOHO_REDIRECT_URI` changes per environment.
5. Confirm the remaining Zoho env vars are set to the India DC values documented in [Required Environment Variables](#required-environment-variables) above: `ZOHO_SCOPE=ZohoPeople.forms.READ`, `ZOHO_ACCOUNTS_URL=https://accounts.zoho.in`, `ZOHO_BASE_URL=https://people.zoho.in/people`.
6. Before the integration will actually work end-to-end, the Zoho user who clicks **Accept** on the OAuth consent screen must be a Zoho People **Super Admin** or have **API Access** explicitly enabled on their role — see [Zoho People Role Requirement](#zoho-people-role-requirement) below. This is separate from the API Console registration above and cannot be granted from api-console.zoho.in.

---

## Zoho People Role Requirement

The Zoho user who authorizes the OAuth app (clicks Accept on the consent screen) must be either:
- **Super Admin** of the Zoho People organization, OR
- A user whose role has **API Access** enabled in Zoho People admin settings

If a regular employee authorizes, every API call returns:
```
HTTP 403 — Error 7077: "Sorry! your role is not allowed to access API's."
```

**To enable API access for a non-Super-Admin role:**
1. Log in to Zoho People as Super Admin
2. Go to **Settings → Security → Roles**
3. Select the role → enable **API Access**
4. Disconnect and reconnect the integration

---

## Database Schema

### `company_zoho_integration` — one row per company, stores connection and tokens

| Column | Type | Purpose |
|---|---|---|
| `company_id` | INTEGER UNIQUE | Links to the company |
| `zoho_organization_id` | VARCHAR(100) | Zoho org identifier |
| `zoho_domain` | VARCHAR(50) | Derived from `api_domain` on token exchange, defaults to `zoho.in` |
| `access_token` | TEXT | Encrypted. Valid 1 hour. Used in every API call. |
| `refresh_token` | TEXT | Encrypted. Valid 30 days. Used to get new access tokens. |
| `token_expires_at` | TIMESTAMPTZ | When the access token expires |
| `scopes` | TEXT[] | Granted OAuth scopes |
| `is_active` | BOOLEAN | Whether the integration is currently connected |
| `last_synced_at` | TIMESTAMPTZ | Intended for last successful sync — currently never written |
| `last_sync_stats` | JSONB | Intended `{ synced, created, updated, skipped, errors[], durationMs }` — currently never written |

Migration: `database-migrations/sql/company_zoho_integration.sql` (not yet applied to any shared environment as of this writing — confirm before relying on the table existing).

### Employee data — populated indirectly via endorsement, not directly by this module

The `ZohoEmployee` shape returned by `/sync` (`zoho-people-api.service.ts`):

| Zoho field | `ZohoEmployee` property | Notes |
|---|---|---|
| `EmployeeID` | `employeeId` | |
| `FirstName` / `LastName` | `firstName` / `lastName` | |
| `EmailID` | `email` | |
| `Mobile` | `mobile` | |
| `Date_of_birth` | `dateOfBirth` | Raw `DD-MMM-YYYY` string, not parsed here |
| `Gender` | `gender` | |
| `Designation` | `designation` | |
| `Department` | `department` | |
| `Dateofjoining` | `dateOfJoining` | |
| `Employeestatus` | `employmentStatus` | |
| `Annual_Salary` | `ctc` | |

These fields are mapped to whichever columns the **target policy's own Excel template** defines (`headerToField` in `ZohoEndorsementDialog.tsx`), not to a fixed DB column mapping — the actual destination columns depend on that policy's configured template, and can differ policy to policy.

---

## Error Reference

| Code | HTTP | Message | Fix |
|---|---|---|---|
| 7218 | 401 | Invalid OAuth Scope | Use `ZohoPeople.forms.READ`. Disconnect and reconnect. |
| 7077 | 403 | Role not allowed to access APIs | Authorizing user must be Super Admin or have API Access role |
| 7201 | 404 | Incorrect URL | API endpoint path is wrong |
| 7068 | 401 | Invalid/expired token | Refresh token missing or expired — reconnect |
