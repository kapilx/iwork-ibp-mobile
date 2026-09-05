# FlyingDuck Pre-PROD — Security Findings & Remediation

**Repo:** new-insurance-wellness-hub (divamidesignlabs)
**Branch:** pre-production-ibp
**Commit:** 78a83fc3 (Merge #6680)
**Scanned:** 12-Jun-2026
**Totals:** 225 findings — SCA 139, SAST 85, Secrets 1 · SBOM 3393 pkgs, 63 vulnerable.

After deduping by package and reading every flagged file, the real work is **~25 dependency bumps** (mostly one `npm install`), **1 CORS config change**, and **~3 small code guards**. The rest is dev-only, already-mitigated, no-fix-yet, or scanner noise.

Scope below:
**P0 + P1 dependencies** at CVE granularity; 
**Every SAST finding** read against the actual code and classified.
Medium/low deps kept compact.

Legend:
**Direct** = declared in a `package.json` (edit it).
**Transitive** = pulled by another dep (fix via root `overrides`).
**Reachable** = runs in shipped product.
**Dev** = build/test only, not in runtime image.

---

## PART A — Dependencies (P0 / P1)

### A0. Paste-ready remediation

**Direct edits — `apps/services/strapi-cms-service/package.json`:**
```jsonc
"axios": "1.16.0",                          // was 1.13.5
"@strapi/strapi": "5.37.0",                 // was 5.36.0
"@strapi/plugin-users-permissions": "5.45.0", // was 5.36.0
"@strapi/plugin-cloud": "5.37.0"            // was 5.36.0 (keep aligned with strapi)
```

**Direct edits — wherever declared (root / ui app):** 
`jspdf` → `4.2.1`, 
`vitest` → `3.2.6` (dev), 
`vite` → `6.4.2`

**Root `package.json` `overrides` block (transitive criticals + highs):**
```jsonc
"overrides": {
  "axios": "1.16.0",
  "handlebars": "4.7.9",
  "flatted": "3.4.2",
  "@strapi/plugin-users-permissions": "5.45.0",
  "undici": "6.24.0",
  "basic-ftp": "5.3.1",
  "shell-quote": "1.8.4",
  "fast-uri": "3.1.2",
  "uuid": "11.1.1",
  "tmp": "0.2.6",
  "path-to-regexp": "0.1.13",
  "@babel/plugin-transform-modules-systemjs": "7.29.4",
  "defu": "6.1.5",
  "serialize-javascript": "7.0.5",
  "koa": "2.16.4",
  "brace-expansion": "5.0.6",
  "lodash": "4.18.0",
  "lodash-es": "4.18.0",
  "picomatch": "4.0.4"
}
```
Then: `npm install` → commit refreshed `package-lock.json` → re-run FlyingDuck.
Caveat: confirm each target version exists on npm before pinning (some "recommended" versions sit ahead of current public releases).

---

### A1. axios — **P0 / Critical / Reachable**
- **Current:** `1.13.5` (Direct — `strapi-cms-service/package.json`), `1.13.6` (Transitive — root lock).
- **Target:** `1.16.0`. **23 CVEs** per copy (46 of the 139 SCA rows).
- **Criticals:** CVE-2025-62718, CVE-2026-42044, CVE-2026-42043
- **Highs:** CVE-2026-42035, -42033, -42038, -42264, -42039, -44486, -44487, -44488, -44492, -44494, -44495, -44496
- **Mediums:** CVE-2026-42041, -42042, -42036, -42034, -42037, -40175, -44490 · **Low:** CVE-2026-42040
- **Action:** bump direct in strapi-cms-service; `overrides` forces the root transitive copy.

### A2. handlebars — **P0 / Critical / Transitive**
- **Current:** `4.7.7` & `4.7.8` (lock) → **`4.7.9`**.
- **Critical:** CVE-2026-33937 · **High:** -33938, -33940, -33939, -33941 · **Medium:** -33916
- **Action:** single `overrides` entry covers both copies.

### A3. flatted — **P0 / Critical / Transitive (Dev-leaning)**
- **Current:** `3.4.1` → **`3.4.2`**. **Critical:** CVE-2026-33228. Pulled via test/cache tooling; low runtime exposure but trivial to patch.

### A4. @strapi/strapi + plugins — **P0 / High / Direct / Reachable (CMS)**
- `@strapi/strapi` `5.36.0` → **`5.37.0`** — **High** CVE-2026-27886.
- `@strapi/plugin-users-permissions` `5.36.0` (pkg) & `5.39.0` (lock) → **`5.45.0`** — **Medium** CVE-2025-64526 (auth/permissions plugin — treat as high-priority despite medium rating).

### A5. vitest — **P0 / Critical / Dev only**
- `3.2.4` → **`3.2.6`**. **Critical** CVE-2026-47429. Test runner — **not in runtime image**, so P0 by score but low real risk. Patch in the same dep PR.

### A6. High-severity transitive batch — **P1**
| Package | Current | Target | CVEs (sev) | Reach |
|---|---|---|---|---|
| undici | 6.23.0 | 6.24.0 | -1528 H, -2229 H, -1526 H, -1527 M | Reachable (HTTP) |
| basic-ftp | 5.2.0 | 5.3.1 | -39983 H, -41324 H, -44240 H | Reachable if FTP used |
| shell-quote | 1.8.3 | 1.8.4 | -9277 H | Build/tooling |
| fast-uri | 3.1.0 | 3.1.2 | -6321 H, -6322 H | Reachable (Fastify/ajv) |
| uuid | 8.0.0/8.3.2/9.0.1/11.1.0 | 11.1.1 | -41907 H | Reachable |
| path-to-regexp | 0.1.12 | 0.1.13 | -4867 H | Reachable (Express) |
| tmp | 0.0.33/0.2.5 | 0.2.6 | -44705 H, -54798 M | Reachable |
| @babel/plugin-transform-modules-systemjs | 7.29.0 | 7.29.4 | -44728 H | Dev/build |
| defu | 6.1.4 | 6.1.5 | -35209 H | Reachable |
| serialize-javascript | 6.0.2 | 7.0.5 | -34043 H | Reachable |
| koa | 2.15.4 | 2.16.4 | -27959 H, -32379 M, -8129 M | Reachable (Strapi) |
| vite | 6.4.1 | 6.4.2 | -39363 H, -39365 M | Dev/build |
| brace-expansion | 5.0.4 | 5.0.6 | -45149 H, -33750 M | Reachable |
| jspdf | 4.2.0 | 4.2.1 | -31898 H, -31938 M | Reachable (Direct) |
| lodash / lodash-es | 4.17.23 | 4.18.0 | -4800 H | Reachable |
| picomatch | 2.3.1/4.0.1/4.0.2/4.0.3 | 4.0.4 / 2.3.2 | -33671 H, -33672 M | Build/glob |

> Version sanity note: `lodash 4.17.23 → 4.18.0` is ahead of the public `4.17.21` line. Verify on npm before pinning; if the advisory DB is in-house-future, confirm the fixed release is actually published.

### A7. Medium/low deps — **P2, single `npm update` pass**
file-type→21.3.2
postcss→8.5.10
dompurify→3.4.0
ws→8.20.1
yaml→2.8.3
ajv→8.18.0
fast-xml-parser→5.7.0
react-router→6.30.4
ip-address→10.1.1
qs→6.15.2
formidable→3.5.3
bn.js→5.2.3
yauzl→3.2.1
@ai-sdk/provider-utils (CVE-2026-8769**no fix yet — track**)
elliptic 6.6.1 (**no fix — track**)
quill 1.3.7 (**no fix; legacy — plan migration**).
**Major-version (defer, breaking):**
`@nestjs/core` 10.4.22 → 11.x (CVE-2026-35515 medium) — schedule as its own upgrade.

---

## PART B — SAST (every finding, read against code)

### B1. Wildcard CORS — **REAL / Fix · `service-lib/.../common-bootstrap.ts:77`**
```ts
app.enableCors({ origin: "*" });
```
Shared bootstrap → applies to **every** microservice.
**Fix:** read `ALLOWED_ORIGINS` env (comma-split allowlist), fall back to `*` only when `NODE_ENV !== 'production'`. **[code change — Tech Lead review]**

### B2. ai-utility-service CORS + NL2SQL SQL — **REAL · `ai-utility-service/src/main.py`**
- **L166:** `allow_origins=["*"]` **with** `allow_credentials=True` — invalid combo (browsers reject it) and over-permissive. Set an explicit origin list.
- **L770 / L773:** f-string SQL wrappers around `sql_query` (LLM-generated text-to-SQL). The wrapping isn't the injection point — the generated SQL is. **Fix:** run NL2SQL against a **read-only DB role**; ensure `limit`/`offset` are int-cast (they derive from numeric pagination, verify upstream); keep the result-count cap.

### B3. TLS verification disabled — **DELIBERATE / Sign-off · `document-service/.../external-app.service.ts:15`**
```ts
const externalApiAgent = new https.Agent({ keepAlive: false, rejectUnauthorized: false });
```
Documented: self-signed TPA certs on non-standard ports. **Action:** security sign-off on MITM exposure for those TPA calls; preferred hardening = pin the TPA CA cert rather than disable verification globally. Not a blind fix.

### B4. dangerouslySetInnerHTML — **ALREADY MITIGATED (close)**
- `iwork/.../CompanyDetailsOverview/ComponentRender.tsx:78` — `__html: sanitizedDisplayText` where `sanitizedDisplayText = useMemo(() => sanitizeHtml(displayText))`. Tagged `// fd_secret_ignore`.
- `iwork/.../TemplatePage/TemplatePreviewCommon/index.tsx:85,97` — `__html: sanitizeHtml(processContent(...))`.
- **Verdict:** input is sanitized via `sanitize-html` (strips `<script>` by default). **One check:** confirm the `sanitizeHtml` config doesn't allow-list `script`/`onerror`. Otherwise close as handled.

### B5. var-in-script-tag — **MITIGATED PATTERN (verify escaping) · document-service placement-slip HTML:456**
```html
<script id="placement-slip-data" type="application/json">{{JSON_SERIALIZED_DATA}}</script>
```
Non-executing JSON island (the recommended `json_script` approach), tagged `fd_secret_ignore`. **One check:** the serializer must escape `<`/`</script>` (and `
/
`) so the payload can't break out of the tag. If it uses a safe JSON encoder, close. Same for `sriLanka-placement-slip.html`.

### B6. var-in-href in email templates — **LOW / Validate · notification-service**
`enrollment-reminder` L509, `enrollment-start` L241, `initial-onboarding` L298: `<a href="{{portalLink}}">`. **Risk** only if a link var can carry a `javascript:`/attacker URL. These are server-built portal URLs. **Action:** confirm link vars are server-constructed (not reflected user input) and prefix-validate to `https://`. Low.

### B7. path-join traversal — **LOW-MED / Add guard · policy-service/.../policy.service.ts:4555 (also 6020, 9134)**
```ts
const targetPath = path.join(this.docRepoPath, fileKey);
```
`fileKey` flows into a local filesystem write. **Fix:** reject/normalize `fileKey` containing `..` or absolute segments before `path.join` (or assert `targetPath.startsWith(this.docRepoPath)` after resolve). Applies to all 3 sites (S3-vs-local fallback writes).

### B8. prototype-pollution-loop — **MOSTLY FALSE / 1 cheap guard**
- `OpportunityActivities/Constants/autoPopulateFields.ts:272` & `OpportunityActivities/.../autoPopulateFields.ts:221,252` — **L272 is read-only** traversal guarded by `hasOwnProperty` → **false positive**.
- `assignNestedValue` (L303 region) assigns `current[part] = {}` from an **internal `FieldPath`** config (not user input) → low. **Cheap hardening:** skip `part` when it equals `__proto__`/`constructor`/`prototype`.
- Same pattern in `ui-lib/.../CommonDetailsSection`, `DetailsSection`, `FormComponent/Fields/SelectFieldByApi.tsx` — internal form-config paths. Add the same guard or dismiss.

### B9. detect-non-literal-regexp (ReDoS) — **LOW / patterns are trusted config**
All construct `new RegExp(<var>)` where the **pattern** comes from trusted sources (the test *target* may be user input, but ReDoS needs an attacker-controlled *pattern*):
- `service-lib/utils/password-validation.util.ts:41,50,59,70,75` — patterns from **admin password-policy config**.
- `ui-lib/utils/index.tsx:208,210` (`parseRegexString`) & `fieldLocalizationUtil.ts:38` — from **i18n/localization config**; already in try/catch.
- `iwork/Utils/smartSearchPrefill.ts:71` — pattern built from `key` (a **constant field name** from callers), not the user's `decodedSearch`.
- `ibp/EnrollmentChangePassword` (formConfig:25, index:67), `ibp-service/hr.service.ts:705`, `opportunity.repository.ts:15357`, `PolicyPage/{PolicyChoicesSection:181, formatters:10,36}`, `service-lib/file-management.utils.ts:932` — config/internal rule strings.
- **Action:** verify none accept end-user regex; for password-policy regexes optionally add a length/complexity cap on the configured pattern. Otherwise dismiss as low.

### B10. incomplete-sanitization — **LOW / cosmetic**
`.replace("x", ...)` (single-occurrence) in `iwork/HRPortalPolicyDetailV2:484`, `iwork/Nl2sqlChatbotPage/PieChart:90`, `ui-lib/CommonDetailsSection:112`, `ui-lib/DetailsSection:65`. These strip `\n` / `]` / `%` for **display formatting**, not security escaping. If any feeds a security decision, switch to a global-flag regex; otherwise dismiss.

### B11. unsafe-formatstring (55 findings) — **NOISE / close as won't-fix**
Sampled `org-service/master.repository.ts:151,173` → `console.warn(\`...${fieldKey}...\`, error.message)`. All 55 are template-literal/concatenation inside `console.*`/logger calls — no `util.format` specifier sink, message is the literal arg. **Lint-grade across the board** (ai-service, org-service, config-service, ibp, ibp-service, iwork, ui-lib, scheduler-service, strapi-cms-service, service-lib, scripts/decrypt-pii-fields.ts). Suppress the rule or batch-clean opportunistically; no security action.

### B12. nestjs-header-cors-any — **DUP of B1 · service-lib/common-bootstrap.ts:77**
Same `origin:"*"` finding from the NestJS rule. Fixed by B1.

### B13. Secret (1) — **FALSE POSITIVE / close · devops/Dockerfiles/Dockerfile:24**
```dockerfile
&& chown -R app_user:app_group /app
```
`app_user` is the non-root Unix user (good practice), flagged as a "Username" secret. **No credential. Dismiss.**

---

## PART C — Execution order

1. **PR-1 (deps):** A0 direct edits + root `overrides` → `npm install` → commit lockfile. Closes ~130 SCA rows.
2. **PR-2 (CORS):** B1 + B2 origin allowlist (all services) — Tech Lead review.
3. **Backlog ticket (SAST):** B7 path guard, B8 `__proto__` guard, B2 NL2SQL read-only role, B5/B6 escaping/validation checks, B3 TLS sign-off.
4. **Close as noise:** B4 (after sanitizeHtml-config check), B11, B13, and dismissed B8/B9/B10 items.
5. **Re-scan** after PR-1 to confirm SCA collapses to low double digits; remaining should be no-fix-available trackers (elliptic, quill, @ai-sdk/provider-utils).


----

## Surya Mohan (Client) notes on 12-June-2026

### 🔴 Critical (10 issues) — Relatively Easy to Fix

Almost all critical issues are in axios (versions 1.13.5 and 1.13.6) and handlebars (4.7.7 and 4.7.8).

The fix is straightforward — just upgrade the package version. One line change in package.json, test, and deploy.

**Effort: Low** — maybe half a day for a developer, mostly spent on regression testing after the upgrade.

### 🟠 High (63 issues) — Mostly Easy, One Tricky One

The bulk are again axios version upgrades (same fix as above — you get these for free when you upgrade axios). Other packages involved:

- picomatch, uuid, lodash, undici, basic-ftp, handlebars, koa, tmp, shell-quote, fast-uri, path-to-regexp, strapi — most just need a version bump
- @strapi/strapi 5.36.0 — this one could be trickier if your app is tightly coupled to Strapi's API, as major Strapi upgrades sometimes have breaking changes

**Effort: Low to Medium** — 1–3 days total. Most are just npm update <package>. Strapi might need extra care.

### 🧠 The Real Challenge Isn't the Fix — It's the Testing

| Risk | Why |
|---|---|
| Upgrading axios | It's used everywhere in your app — any upgrade could break API calls |
| Upgrading handlebars | Template rendering could behave differently |
| Upgrading Strapi | Could have breaking changes in admin/API layer |
| Regression testing | You need to make sure nothing breaks after upgrades |

**Practical Recommendation**

- Phase 1 (1–2 days): Upgrade axios and handlebars — this alone wipes out ~70% of critical + high issues.
- Phase 2 (2–3 days): Upgrade remaining packages one by one with testing.
- Phase 3: Handle Strapi carefully — test in staging before pushing to pre-prod.

Overall, a competent Node.js/JavaScript developer can knock out most of these in a week or less, assuming you have a proper staging environment to test in. The fixes themselves are simple — the time goes into validating nothing breaks.

Based on the SAST findings in your report, here's the prioritization by external exploitability — meaning what a customer/attacker could actually exploit from outside:

### 🚨 Fix These First (Externally Exploitable)

**1. react-dangerouslySetInnerHTML — 3 instances**
- What it is: Your React app is rendering raw HTML directly into the page without sanitization.
- What attacker can do: Inject malicious scripts (XSS) — steal session tokens, impersonate users, redirect to phishing pages.
- Fix: Replace with safe alternatives like DOMPurify before rendering, or restructure the component to avoid raw HTML entirely.

**2. wildcard-cors — 1 instance**
- What it is: Your server accepts API requests from any website (Access-Control-Allow-Origin: *).
- What attacker can do: A malicious website can make API calls to your portal using a logged-in customer's browser session.
- Fix: Restrict CORS to only your known domains (e.g., your portal URL and admin URLs only).

**3. bypass-tls-verification — 1 instance**
- What it is: Your code is skipping SSL/HTTPS certificate validation somewhere.
- What attacker can do: Man-in-the-middle attacks — intercept data between your server and another service it talks to.
- Fix: Remove rejectUnauthorized: false or equivalent from your HTTPS/request config.

**4. path-join-resolve-traversal — 3 instances**
- What it is: File paths are being constructed using user input without proper validation.
- What attacker can do: Access files outside the intended directory — e.g., reading config files, credentials, or system files.
- Fix: Validate and sanitize all user-supplied path inputs; use path.resolve() with a whitelist check.

**5. tainted-sql-string — 2 instances**
- What it is: User input is being passed into database queries without proper sanitization.
- What attacker can do: SQL injection — extract data, bypass authentication, or corrupt records.
- Fix: Use parameterized queries or an ORM's built-in query methods instead of string concatenation.

### ⚠️ Fix These Next (Partially Exploitable)

**6. var-in-href — 3 instances & var-in-script-tag — 2 instances**
- What it is: Dynamic variables being injected into links or script tags.
- What attacker can do: Could lead to XSS or open redirect attacks depending on what the variable contains.
- Fix: Encode/escape all dynamic values before placing them in href or script contexts.

**7. nestjs-header-cors-any — 1 instance**
- Similar to wildcard-cors but specifically in your NestJS backend layer. Same risk, same fix — restrict allowed origins.

---

## PART D — Reconciliation with Client Notes (gap analysis)

The client's notes work from the **scanner labels**; Parts A/B above work from **reading the code**. Where they diverge, the code is the source of truth. We agree on the dependency story; we differ on three SAST severities, and each side has one blind spot.

### Where we fully agree
- **Criticals are axios + handlebars; upgrade is the fix.** Matches A1–A2. Client's Phase-1 (axios+handlebars first) = our PR-1 ordering.
- **Testing is the real cost, not the edit.** Correct, and our report under-stated this — see gap D-5.
- **Strapi needs extra care.** Agreed (A4), with one correction — see D-2.
- **wildcard / nestjs-header-cors-any must be restricted.** Matches B1/B12.

### Gaps in the CLIENT notes (our report already covers)
- **D-1 — Two criticals missed.** Client says "almost all criticals are axios + handlebars." The other 2 of 10 are **`flatted` 3.4.1 (CVE-2026-33228)** and **`vitest` 3.2.4 (CVE-2026-47429)** — both **dev/build-only**, not runtime. Patch them in PR-1 but they carry near-zero production risk. (Report A3, A5.)
- **D-2 — Strapi 5.36→5.37 is a MINOR bump, not a major.** Client warns of "major Strapi upgrades / breaking changes." 5.36→5.37 is minor; the larger jump is `plugin-users-permissions` 5.36→**5.45**, still within v5. Lower breakage risk than implied — but yes, test the admin/auth flows.
- **D-3 — `dangerouslySetInnerHTML` is already sanitized.** Client's #1 "externally exploitable" assumes "raw HTML **without** sanitization." Verified: `ui-lib/utils/sanitizeHtml.ts` = `DOMPurify.sanitize(dirty)`, and all 3 sinks call it before render. **DOMPurify is exactly the fix the client recommends — it's already in place.** This is the biggest divergence: not a live XSS. (One residual: confirm no custom DOMPurify allow-list re-enables `script`; default config is safe.)
- **D-4 — "Remove `rejectUnauthorized:false`" would break production.** Client's prescribed fix for bypass-tls-verification is a blind removal. The flag is **deliberate** (self-signed TPA certs on non-standard ports, documented in `external-app.service.ts:15`). Removing it outright breaks TPA integrations. Correct fix = **pin the TPA CA cert** + security sign-off (B3), not delete the line.

### Gaps in OUR report (client surfaces these)
- **D-5 — No effort/timeline sizing.** Client adds it; adopt it: **~½ day criticals, 1–3 days highs, ~1 week total with staging validation.** Add to PR planning.
- **D-6 — axios blast radius.** Client rightly flags axios is used app-wide; an upgrade can break API calls. Our report listed the version bump but not the regression surface. Action: smoke-test all axios call sites (interceptors, file upload, external APIs) post-upgrade.

### Where BOTH sides need a fact to finalize severity (now resolved)
- **D-7 — CORS real exploitability = LOW (not high).** Client's "malicious site rides a logged-in session" attack needs **cookie/session auth**. Verified: `common-bootstrap.ts` sets **no `credentials:true`**, and auth is **JWT/Bearer** (passport-jwt). A cross-origin site cannot read a victim's bearer token, so wildcard CORS is **defense-in-depth, not a live account-takeover vector**. Exception: `ai-utility-service/main.py` sets `allow_origins=["*"]` **with** `allow_credentials=True` — invalid combo (browsers reject it) and must be fixed, but not browser-exploitable as-is. **Still fix CORS — just re-rate it Medium, not Critical.**
- **D-8 — path-traversal severity = LOW.** Client assumes "user input" builds the path. Verified at `policy.service.ts`: `fileKey = uploads/company/policy/templates/${fileName}`, where `fileName` is **server-generated from `policyId`** (typed number), not a raw user filename. Traversal is unlikely; keep the `..`/`startsWith` guard (B7) as cheap defense-in-depth, but it is not an externally-driven file-read today. (Confirm the other 2 sites follow the same pattern.)
- **D-9 — tainted-sql fix doesn't fit the feature.** Client says "use parameterized queries / ORM." The 2 hits are in the **NL2SQL text-to-SQL chatbot** (`ai-utility-service/main.py`) — the SQL is **LLM-generated by design**, so you can't parameterize an arbitrary generated statement. Correct control = **read-only DB role** for the chatbot + int-cast `limit/offset` + statement allow-listing (B2). Parameterization applies only to the pagination wrappers.

### Net
No gap that changes the **plan** — PR-1 (deps) and PR-2 (CORS) stand. The gaps change **severity ratings and sequencing of the SAST items**: of the client's five "fix first" items, **#1 (XSS) is already fixed**, **#2 (CORS) is Medium not Critical**, **#3 (TLS) needs sign-off not deletion**, **#4 (traversal) is Low**, and **#5 (SQL) needs a read-only role, not parameterization**. Adopt the client's effort sizing (D-5) and axios regression scope (D-6) into PR-1.