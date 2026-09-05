# Live Application Security Validation — Pre-Handoff Check

**App tested:** https://democorporation.iwh.preprod.indiainsure.com/ (IBP portal, pre-prod)
**API:** https://api.newiwork.indiainsure.com/iirm/*
**Date:** 22-June-2026 · **By:** Internal team (before client InfoSec validation)
**Account used:** a standard "Company Employee" test login (user 292110, company 363907)
**Type of test:** Live black-box checks (headers, exposure, and authorization) — this is **different** from the FlyingDuck code scan, which cannot see runtime behaviour.

> Plain-English summary: The code scan is now clean, but a live check found **one serious problem** — a logged-in user can open **other people's** insurance data by changing a number in the web address. Everything else we checked looked reasonable. We found this **before** the client did, and it is fixable.

---

## 1. Area / module tested

- **Login / authentication** — is a valid login required?
- **Authorization (the big one)** — once logged in, can a user reach data that isn't theirs? (changing the employee ID in the URL)
- **Public exposure** — admin panels, API docs, source maps, server/tech info leakage.
- **Browser security headers & CORS** — clickjacking, HTTPS enforcement, who can call the API.

---

## 2. What we found

### 🔴 FINDING 1 — Other people's data is accessible (IDOR / Broken Object-Level Authorization) — **CRITICAL**

**What it is, in simple terms:** When you log in, the system correctly asks "are you a valid user?" — but it does **not** ask "does this record actually belong to you?" So by changing the ID number in the web address, a logged-in employee can pull up **someone else's** records.

> Analogy: a coat-check that checks you have *a* ticket, but lets you walk off with *any* coat by changing the number on it — not just your own.

**How we proved it (on `/employees/{id}/policies`):**
| Test | Result | Meaning |
|---|---|---|
| Ask for data with **no login token** | **401 Unauthorized** | Login is required ✓ (good) |
| Ask for **my own** ID (292110) | 200 OK, my data | Normal |
| Ask for a **different** ID, same token | **200 OK, different person's data** | **Authorization is broken** ✗ |

We also saw the system trusts a `userid` value sent **by the browser** — which anyone can change.

### 🟠 FINDING 2 — Strapi admin panel is open to the internet — **Medium**
The content-management admin login (`/strapi-cms-service/admin`) is reachable by anyone on the internet, and it leaks the technology (`X-Powered-By: Strapi`, edition info).
Mitigating point: registration is **already closed** (`hasAdmin: true`), so no one can create the first super-admin. But an open admin login is still a brute-force target.

### 🟡 FINDING 3 — Weak Content-Security-Policy (frontend) — **Low/Medium**
The site sets only `frame-ancestors none` (clickjacking protection). It has **no `script-src`/`default-src`**, so it gives **no extra protection against script-injection (XSS)**.

### 🟡 FINDING 4 — Config hygiene: dev URL inside pre-prod build — **Low**
The pre-prod app bundle references `api.dev.indiainsure.com` alongside the real API. Pre-prod builds should not point at dev. Confirm dev endpoints aren't reachable/used.

### ✅ Things that were GOOD (worth showing the client)
- **Login is enforced** — no token = 401 (not wide open).
- **A WAF / rate-limiter is active** — it started blocking our repeated requests automatically (this is why testing stopped).
- **Strong frontend headers** — HSTS (with preload), `X-Frame-Options`, `nosniff`, `X-XSS-Protection`.
- **Source maps are NOT exposed** (`.js.map` → 403) — source code isn't downloadable.
- **First-admin registration is closed** on Strapi.

---

## 3. Where is the impact

- **Module:** `ibp-service` → `company-employee` (the employee/HR portal data layer).
- **Endpoints:** any route that takes an employee/object **ID in the URL** or trusts the **`userid` header** — policies, dependents, claims, employee details.
- **Data at risk:** employees' **policy details, insurance claims (health-related), and dependents' (family members') personal information** — and, based on a far-ID test, potentially **across companies**, not just within one.

---

## 4. How much is the impact (severity)

**Critical (P1).** This is the highest-value issue a penetration tester looks for in a multi-tenant insurance app, because:
- It exposes **sensitive personal and health-related data** of people who are not the logged-in user.
- It needs **no special tools** — just changing a number in the browser.
- It is **systemic** — the same pattern repeats across many endpoints.
- It has **privacy/regulatory** weight (personal + health data).

If the client tests the live app, this is **the finding they will almost certainly report.**

---

## 5. Action items (for the dev team)

1. **Add an ownership check on every record-by-ID endpoint.** Use the identity inside the verified login token (JWT: `userId`, `companyId`) to decide access — an employee may read **only their own** records; HR/admin may read **only within their own company**. Anything else → return 403/404.
2. **Stop trusting the `userid` header for authorization.** It is sent by the browser and can be faked. Authorization must come from the token only.
3. **This is systemic — audit the whole module.** Review every route in `ibp-service/company-employee` (and other services) that takes an `:id`, `employeeId`, `policyId`, or a `userid` header. A single shared guard/interceptor (compare record-owner vs token identity) is the clean fix.
4. **Restrict the Strapi admin panel** to office IPs/VPN; remove the `X-Powered-By` header.
5. **Tighten the Content-Security-Policy** to include `default-src`/`script-src`.
6. **Remove the dev API reference** from pre-prod builds.
7. **Re-test after fix** — confirm a different ID now returns 403/404, not data.

---

## 6. How each endpoint you provided was validated

**Important honesty note:** only the first endpoint was tested fully. The platform's **WAF then began blocking our requests**, so the rest could not be individually confirmed in this session — they are **assessed as the same vulnerability by pattern** (identical `{id}`-in-URL design). They should be **re-tested individually after the WAF cools down / from an allowed test runner.**

| # | Endpoint | What it returns | Validation status |
|---|---|---|---|
| 1 | `…/company-employee/employees/292110/policies` | Employee's policies | ✅ **CONFIRMED VULNERABLE** — different ID returned a different person's data; 401 without token |
| 2 | `…/config-service/auth-config/company?subdomain=…` | Company login config (no token sent) | ⏸ **Not confirmed** — WAF returned 403 before testing. To check: does another `subdomain` value leak other companies' config without login? |
| 3 | `…/company-employee/company-employee-details` | Logged-in employee's details (uses `userid` header) | ⏸ **Not confirmed** — WAF blocked. Suspected vulnerable (trusts client `userid`). |
| 4 | `…/company-employee/employee/292110/relations-constraints-dependents` | Dependents (family PII) | ⏸ **Not confirmed** — WAF blocked. Same `{id}` pattern → **high likelihood + high sensitivity**. |
| 5 | `…/company-employee/employee/292110/policy/claims-overview` | Insurance claims (health) | ⏸ **Not confirmed** — WAF blocked. Same `{id}` pattern → **high likelihood + high sensitivity**. |

**Bottom line:** 1 of 5 confirmed vulnerable; 4 of 5 strongly suspected (same design) but blocked before confirmation. Fixing the root cause (point 1–3 above) closes all five at once.

---

## 7. What to tell the client (framing)

- We ran a **proactive internal security validation** before handover and **caught a Critical authorization issue ourselves**, plus a few medium/low items.
- We have a **clear, single root-cause fix** that closes the whole class of issue, not a patchwork.
- The platform already has solid basics: **enforced login, an active WAF, strong HTTPS headers, no source-code exposure.**
- We are remediating the authorization gap and will **re-test before the validation window**.

*Note: testing was non-destructive (read-only), used a demo/test account, and all retrieved data has been treated as sensitive and not stored.*
