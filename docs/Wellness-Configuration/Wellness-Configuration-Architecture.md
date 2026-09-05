# Wellness Configuration — Architecture

**Product:** Insurance Wellness Hub — iWork (admin) → IBP (employee portal)
**Status:** Draft — for review before implementation
**Related:** `Wellness-Configuration-PRD.md`, `Wellness-Configuration-TRD.md`

---

## 1. Problem

The IBP dashboard's "Wellness Hub" (Health assessment KPIs, Benefits from your organisation, Explore by need, Explore more programmes) is currently **100% hardcoded** in `apps/ui/ibp/src/app/components/Dashboard/WellnessHub/mockData.ts`, gated behind `PREVIEW_MODE = true`. Every domain (teamleasemidland, iirmgss, ...) sees the same static content — there is no way for an ops/admin user to configure what a given company's employees see.

We are extending the **existing, already-shipped** "Configure IBP Portal" screen in iWork (`apps/ui/iwork/src/app/pages/CompanyPage/PortalConfiguration/`) with a new **"Wellness Configuration"** tab, following the exact same per-domain, JSON-config, draft→approval pattern already used by its sibling tabs (Company / Policy / Dashboard Configuration). This is a **company-level, domain-scoped** config — not the unrelated policy-level `PortalConfigurationTab`.

## 2. Why extend the existing pattern instead of building new

The research below is load-bearing for every decision in this doc — re-verify against the live code before implementing, since it may have moved:

- `ConfigCompany` (`company-portal-configuration.entity.ts`-style, table `company_portal_configuration`) already models **one row per domain**, with a status lookup (DRAFT / UNDER_REVIEW / ACTIVE / REJECTED) and submit/approve endpoints.
- Its child, `CompanyPortalConfigurationDetail` (table `company_portal_configuration_detail`), already stores **sibling JSON blobs** per domain: `companyPortalDashboardConfig` (jsonb), `companyPolicyConfig` (jsonb array), `companyPortalBrandingConfig` (jsonb). Wellness config is the same shape of thing — a fourth jsonb column, not a new entity or a new microservice.
- IBP already resolves the current domain (`getSubdomainFromUrl()` / `useCompanyConfig()`) and fetches its **ACTIVE** config via `GET /auth-config/company?subdomain=X`, which already flattens `companyPortalConfigurationDetail` into the response. Adding `portalWellnessConfig` to that same response is the entire "how does IBP get the data" story — no new fetch path, no new tenant plumbing.
- `apps/services/wellness-service` exists as an unused Nx stub. We are **not** using it for config storage — config storage stays with `config-service` (`company-config` module) alongside its siblings, for the same reason Dashboard/Policy/Branding config live there: it's one domain's config, one detail row, one save/approve transaction. `wellness-service` remains reserved for future *runtime* wellness-vendor integration logic (e.g. brokering the Alyve SSO handshake), which is a distinct concern from *what content an admin configured*.

This means the bulk of the "architecture" here is additive to a system that already exists, not a new subsystem.

## 3. High-level data flow

```
┌─────────────────────────┐        ┌──────────────────────────┐        ┌─────────────────────────┐
│  iWork admin             │        │  config-service           │        │  IBP employee portal      │
│  Configure IBP Portal >  │  save  │  company-config module    │  read  │  WellnessHub components   │
│  Wellness Configuration  │──────▶│  ConfigCompany +           │───────▶│  (Section A/B/C/D)        │
│  tab (form + preview)    │ draft  │  CompanyPortalConfig       │ ACTIVE │                           │
│                          │◀──────│  urationDetail.            │  only  │  merges config JSON with  │
│                          │ submit │  companyPortalWellness     │        │  live per-user wellness   │
│                          │  for   │  Config (jsonb)            │        │  data (Section A scores)  │
│                          │ appr.  │                            │        │                           │
└─────────────────────────┘        └──────────────────────────┘        └─────────────────────────┘
          │                                    │
          │ thumbnail upload                   │ approve/reject (existing
          ▼                                    │ config-company submission/
┌─────────────────────────┐                    │ approval endpoints, reused
│  org-service              │                    │ as-is)
│  file-upload module       │                    ▼
│  (existing, reused as-is) │        status flips DRAFT → UNDER_REVIEW → ACTIVE
└─────────────────────────┘
```

## 4. Section model (fixed, per PRD)

Four fixed sections, matching the current IBP Wellness Hub 1:1 so the "replace mock data with real config" migration is section-for-section:

| Key | Screen label | Maps to existing IBP type (`WellnessHub/types.ts`) |
|---|---|---|
| `healthAssessment` | Section A — Health assessment | `HealthAssessment` / `HealthReport` / `Appointment` stat tiles |
| `organisationBenefits` | Section B — Benefits from our organisation | `OrganisationBenefit` |
| `exploreByNeed` | Section C — Explore by need | `ExploreNeed` (4 fixed ids: assessment/nutrition/care/fitness) |
| `explorePrograms` | Section D — Explore more programmes | `Programme` |

**Sections and their field sets are fixed** (no admin-defined new sections/fields in v1, per your confirmation). **Cards within B and D are a variable, admin-managed list** (add/remove/reorder). Cards within C are a fixed set of exactly 4 (the tile identity — icon, gradient, category id — is code-owned, not admin-owned; only its copy and link are configurable). Section A is **not a card list at all** — see §5, this is the one section that structurally diverges from "generic card" and is flagged as an assumption to confirm.

## 5. ⚠️ Key assumption to confirm: Section A is live data, not admin content

Unlike B/C/D, the Section A screenshot ("72% Good", "3 health reports", "Fitness review · Physiotherapy session") is **per-employee runtime data** — an individual's actual health-assessment score, actual report count, actual enrolled sessions. An admin cannot author "72%" for every employee; that number comes from a live wellness-data source at render time (today, mocked in `mockData.ts`; in production presumably fed by the same integration behind `alyveWellnessUrl` SSO, or a future `wellness-service`).

**Proposed treatment:** Section A's admin config is the tile **chrome only** — which of the (up to 3) stat tiles are enabled, their heading/subheading label text, and the CTA (navigation/service-organiser URL) that deep-links into the actual assessment tool. The score/count/session values are *not* stored in the JSON; IBP overlays them from live data at render time, keyed by a fixed `statKey` per tile (`healthAssessmentScore` / `healthCheckup` / `wellnessActivity`). If a tile has config but no live data (or vice versa), it's hidden.

This reuses the same generic card fields (`heading`, `subheading`, `navigationUrl`, `serviceOrganiserUrl`) you specified for Benefits, just without `thumbnail`/`tags` (the current UI has an icon + progress ring here, not a photo). **Please confirm this reading before we build Section A's form** — if you intended Section A to also carry a thumbnail/photo, that's a small schema change, not a big one, but changes the preview component.

## 6. Card schema (shared across B, C, D; reduced for A)

One generic card shape, reused everywhere, with fields optional per section:

```ts
type WellnessCard = {
  id: string;                 // client-generated slug/uuid, stable across edits (needed for reorder + live-data keying in A)
  order: number;               // 0-based position within its section's card array
  thumbnailFileId?: string;    // returned by org-service file-upload; omitted for Section A/C
  thumbnailUrl?: string;       // resolved download URL, denormalized for fast render (see TRD open question on signed-URL expiry)
  heading: string;             // single-line, e.g. max 60 chars
  subheading?: string;         // multi-line, e.g. max 150 chars
  tags?: string[];             // rendered as grey chips; omitted for Section A/C
  link: {
    type: 'DIRECT_URL' | 'SSO_REDIRECT';
    url?: string;              // when type = DIRECT_URL — the "navigation url" field
    ssoAppKey?: string;        // when type = SSO_REDIRECT — e.g. "alyve-wellness"; the "service organiser url" field is actually an SSO vendor handshake today, not a plain URL (see §7)
  };
  statKey?: string;            // Section A only — binds this card's chrome to a live-data key
};
```

Stored per domain as:

```json
{
  "healthAssessment": { "cards": [ /* WellnessCard, statKey required, no thumbnail/tags */ ] },
  "organisationBenefits": { "cards": [ /* WellnessCard[] */ ] },
  "exploreByNeed": { "cards": [ /* WellnessCard[], fixed 4 ids, no thumbnail */ ] },
  "explorePrograms": { "cards": [ /* WellnessCard[] */ ] }
}
```

This whole object is one new jsonb column (`companyPortalWellnessConfig`) on `company_portal_configuration_detail`, sibling to the existing dashboard/policy/branding jsonb columns. See TRD §3 for the literal column/DTO diff.

## 7. ⚠️ Second assumption to confirm: "service organiser URL" is an SSO handshake, not a static link

Today, the only real network call in `WellnessHub` is `apiRequest(endPoints.alyveWellnessUrl, { appKey: "alyve-wellness", dynamicFields: {...} })`, which returns a `redirect_url` the browser then navigates to — i.e. clicking a benefit card doesn't go to a fixed URL, it triggers a per-user SSO handshake with the wellness vendor (Alyve), and *that* handshake's response is the URL. A plain "service organiser URL" text field would be wrong for any card that needs this flow.

The `link.type: 'SSO_REDIRECT' | 'DIRECT_URL'` split in §6 handles both: cards that go straight to an external/internal URL use `DIRECT_URL`; cards that need the vendor SSO handshake use `SSO_REDIRECT` + a vendor key (`ssoAppKey`), resolved through the existing `alyveWellnessUrl`-style endpoint at click time. **If Alyve is the only vendor today and will remain so, this can simplify to a boolean toggle instead of a vendor-key field** — flagging so you can pick before the form is built, since it changes the admin UI (URL text box vs. a vendor dropdown vs. a toggle).

## 8. Approval lifecycle (reused as-is)

Wellness Configuration rides the exact same per-domain lifecycle already visible in your screenshot (Draft → chip states → "Submit for Approval"):

- Same `ConfigCompany.companyConfigurationStatusLid` (`LookUp`: DRAFT/UNDER_REVIEW/ACTIVE/REJECTED) — no new status table.
- Same submit endpoint (`POST /config-company/submission`) and approve endpoint (`PUT /config-company/approval`) — the wellness jsonb travels inside the same `companyPortalConfigurationDetail` row those endpoints already promote/reject as a whole. There is no independent "approve wellness only" — the whole domain config (company/policy/dashboard/wellness) advances together, matching current behavior for the other three tabs.
- IBP only ever reads the **ACTIVE** row via the existing `auth-config` endpoint — draft wellness edits are invisible to employees until approved, same guarantee the other tabs already give you.

## 9. Card preview parity (iWork ↔ IBP)

To guarantee the live preview in iWork actually matches what IBP renders (not a lookalike that drifts), the **presentational leaf components** for each card type (thumbnail + heading + subheading + chips + CTA button) should move from `apps/ui/ibp/src/app/components/Dashboard/WellnessHub/cards.tsx` into `apps/ui/ui-lib`, and both `iwork` (preview pane) and `ibp` (real render) import the same component. iWork feeds it the in-progress form state (with a skeleton/placeholder fallback before any field is filled); IBP feeds it the saved+approved JSON (merged with live data for Section A). One component, two data sources — no visual drift between "what the admin saw" and "what the employee sees." See TRD §5 for the exact extraction plan.

## 10. Thumbnail storage

Reuses the existing generic upload endpoint (`POST /file-upload/upload`, `org-service`), the same mechanism already powering "Upload Policy Feature Document." Tag uploads with a distinct `companyType` (e.g. `WELLNESS_CARD`) so they're namespaced separately in S3 (`uploads/company/WELLNESS_CARD/{companyId}/...`). Unlike policy documents, wellness thumbnails don't need a formal doc-map/approval trail — the returned `documentId`/URL is simply stored inline in the card's JSON. **Open risk:** if the existing download endpoint returns signed URLs with an expiry, a URL baked into jsonb at save time will go stale before it's re-edited — flagged in TRD §7 as needing either a public-read bucket path or a proxy endpoint that doesn't expire.

## 11. Non-goals (v1)

- Admin-defined new sections or new field types (dynamic form-builder) — deferred, per your "fixed sections" decision.
- Personalization/targeting (different wellness config per employee segment within a domain) — out of scope; config is per-domain only, same granularity as the other three tabs.
- Section A live-data source integration itself (the actual health-score computation/API) — out of scope for this feature; we only build the config *chrome* and the merge point. Wiring a real score API is a separate effort.
- Multi-language content — not addressed; matches current state of the other Configure IBP Portal tabs.
