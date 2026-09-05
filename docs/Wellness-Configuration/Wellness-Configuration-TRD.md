# Wellness Configuration — Technical Design Document (v1)

**Source PRD:** `Wellness-Configuration-PRD.md` · **Architecture:** `Wellness-Configuration-Architecture.md`
**Status:** Draft for build

This TRD maps the PRD/Architecture onto the exact existing files. All line numbers/snippets below were read live from the repo on 2026-07-28 — re-check before editing in case they've moved since.

---

## 1. Decisions (locked)

| # | Decision | Rationale |
|---|---|---|
| D1 | Wellness config storage is a **new jsonb column** on the existing `company_portal_configuration_detail` table, not a new entity/table. | Sibling columns (`company_portal_dashboard_config`, `company_policy_config`, `company_portal_branding_config`) are the exact same "one domain, one jsonb blob" shape. No new migration complexity, no new join. |
| D2 | Backend lives in **`config-service`**, `company-config` module — same controller/service/repository already handling the other 3 tabs. **Not** `wellness-service` (still an unused Nx stub; reserved for future runtime vendor-integration logic, not config storage). | Wellness config shares the exact save/approve/reject transaction as company/policy/dashboard config — splitting it into a separate service would mean two-phase-commit across services for one form save. |
| D3 | Frontend tab lives in **`apps/ui/iwork`**, inside the existing `PortalConfiguration/` folder, mirroring `DashboardConfiguration/`. | Every sibling tab already lives here; no new route/module needed, just a new tab entry + component folder. |
| D4 | Card preview leaf components are **extracted from `apps/ui/ibp/.../WellnessHub/cards.tsx` into `apps/ui/ui-lib`** and imported by both apps. | Guarantees the iWork preview and the IBP production render are pixel-identical — one component, two data sources (form state vs. saved+approved JSON). Avoids building a second "lookalike" card renderer that silently drifts. |
| D5 | Approval lifecycle is **not duplicated** — wellness jsonb rides inside the same `CompanyPortalConfigurationDetail` row that `submitCompanyConfigForApproval`/`approveCompanyConfig` already promote as a whole. | Matches current behavior: there is no independent "approve dashboard config only" today either. |
| D6 | Thumbnails reuse the existing generic `POST /file-upload/upload` (`org-service`), tagged with a new `companyType: "WELLNESS_CARD"`, **no new doc-map table**. | Thumbnails aren't formal reviewable documents like policy PDFs; storing the returned file reference inline in the card JSON is sufficient and avoids an unnecessary join table. |
| D7 | IBP's `WellnessHub` fetches config the same way it fetches everything else — via `useCompanyConfig()` / the existing `auth-config` company response — with one new field added to that response (`portalWellnessConfig`). `mockData.ts` becomes the **fallback only when no config exists** (e.g. a brand-new domain that hasn't configured wellness yet), not the default path. | Reuses domain-resolution plumbing that already exists; `PREVIEW_MODE` flag and mock builder are retired from the main render path. |
| D8 | Section A ("Health Assessment") stores **chrome only** (heading/subheading/link) per stat tile, keyed by a fixed `statKey`. The actual score/count/session values continue to come from whatever live source IBP already renders — this feature does not touch that source. | Per Architecture §5 — these are per-employee runtime values, not admin content. Storing them in jsonb would be both wrong (stale) and impossible (per-user, not per-domain). |

---

## 2. Data model

### 2.1 Entity change

`apps/services/service-lib/src/lib/entities/company-portal-configuration-detail.entity.ts` — add one column, sibling to the three that already exist there (`companyPortalDashboardConfig` at line 17-22, `companyPolicyConfig` at 24-29, `companyPortalBrandingConfig` at 31-36):

```ts
@Column({
  name: "company_portal_wellness_config",
  type: "jsonb",
  nullable: true,
})
companyPortalWellnessConfig: Record<string, any> | null;
```

Schema change: this repo has no TypeORM migrations dir (per existing convention seen elsewhere in `docs/`, schema changes ship as `.sql` scripts). Add:

```sql
ALTER TABLE company_portal_configuration_detail
  ADD COLUMN IF NOT EXISTS company_portal_wellness_config JSONB NULL;
```

**Verify before writing this migration**: confirm this repo's actual `synchronize` setting and migration convention for `config-service` specifically (the `.sql`-script convention was observed in a different service's TRD; `config-service` may differ) — check for a `migrations/` folder or existing `.sql` files scoped to this service before assuming.

### 2.2 JSON shape (stored in `company_portal_wellness_config`)

```ts
interface WellnessPortalConfig {
  healthAssessment?: { cards: HealthAssessmentTile[] };
  organisationBenefits?: { cards: WellnessCard[] };
  exploreByNeed?: { cards: WellnessCard[] };       // exactly 4, ids fixed
  explorePrograms?: { cards: WellnessCard[] };
}

interface WellnessCardLink {
  type: 'DIRECT_URL' | 'SSO_REDIRECT';
  url?: string;        // type = DIRECT_URL
  ssoAppKey?: string;  // type = SSO_REDIRECT, e.g. "alyve-wellness"
}

interface WellnessCard {
  id: string;            // stable client-generated id (slug or uuid) — used for React keys and reorder persistence
  order: number;
  thumbnailFileId?: string;
  thumbnailUrl?: string; // denormalized at save time for fast render — see §7 risk on staleness
  heading: string;
  subheading?: string;
  tags?: string[];
  link: WellnessCardLink;
}

interface HealthAssessmentTile {
  id: string;
  order: number;
  statKey: 'healthAssessmentScore' | 'healthCheckup' | 'wellnessActivity';
  heading: string;
  subheading?: string;
  link: WellnessCardLink;
}
```

`exploreByNeed.cards[].id` is constrained to the 4 existing fixed ids already used in `apps/ui/ibp/.../WellnessHub/types.ts` (`'assessment' | 'nutrition' | 'care' | 'fitness'`) — enforce this in the DTO/validation, not just by convention, so a bad save can't desync from the fixed icon/gradient mapping in the shared card component.

### 2.3 DTO change

`apps/services/config-service/src/app/company-config/dto/update-company-portal-config.dto.ts` — add, mirroring the existing `companyPortalDashboardConfig` field (line 60-63):

```ts
@ApiPropertyOptional()
@IsOptional()
@IsObject()
companyPortalWellnessConfig?: Record<string, any>;
```

(A stricter nested-DTO validation of the full `WellnessPortalConfig` shape, mirroring `SelectedLocationDto`'s `@ValidateNested`, is preferable to a bare `@IsObject()` once the shape is confirmed — flagged as a follow-up, don't block v1 on it.)

### 2.4 Response interface change

`apps/services/config-service/src/app/company-config/company-config.service.ts`:

- `CompanyConfigResponse` interface (line 47-68) — add `portalWellnessConfig?: Record<string, any> | null;` alongside `portalDashboardConfig`/`portalBrandingConfig` (line 59/61).
- `mapToResponse()` (line 744-773) — add `portalWellnessConfig: portalDetail?.companyPortalWellnessConfig ?? null,` alongside the existing `portalDashboardConfig`/`companyPolicyConfig` lines (765-766).
- `persistPortalConfigurationDetail()` (line 866-916+) — extend the `hasDetailPayload` check (line 872-877) to also check `payload.companyPortalWellnessConfig !== undefined`, and add an assignment block mirroring the `companyPortalDashboardConfig` block (line 894-896):

```ts
if (payload.companyPortalWellnessConfig !== undefined) {
  detail.companyPortalWellnessConfig = payload.companyPortalWellnessConfig;
}
```

No merge logic needed (unlike `companyPolicyConfig`'s array-merge dance for `selectedLocationIds`) — wellness config is saved as a whole object per section, same as dashboard config.

### 2.5 Exposing it to IBP

`apps/services/config-service/src/app/auth-config/auth-config.controller.ts`, the `trimmedConfig` object (line 108-118) — add `portalWellnessConfig: companyConfig.portalWellnessConfig ?? null,` alongside `portalDashboardConfig`/`portalBrandingConfig` (lines 114-115). This is the entire backend change needed for IBP to receive it — `getConfigBySubDomain` → `mapToResponse` already flows through once §2.4 is done.

---

## 3. Approval lifecycle — no changes needed

`submitCompanyConfigForApproval` / `approveCompanyConfig` (`company-config.service.ts`, ~line 395/471 per prior investigation) operate on the `ConfigCompany` row and its attached `companyPortalConfigurationDetail` as a whole — since wellness config lives in that same detail row, it is automatically included in submission/approval with **zero code changes** to those two methods. Confirm this by reading them once before implementation, but no diff is anticipated here.

---

## 4. Frontend — iWork (admin form + preview)

### 4.1 New tab wiring

`apps/ui/iwork/src/app/pages/CompanyPage/PortalConfiguration/constants.ts` — add a new tab label/key alongside `TAB_LABELS.DASHBOARD` etc., e.g.:

```ts
TAB_LABELS.WELLNESS = 'Wellness Configuration for IBP Portal';
```

Register it in the tab list inside `PortalConfigurationScreen` (`index.tsx`) the same way `DASHBOARD`/`POLICY` are registered — this file is large (2289 lines observed); locate the existing tab-array/switch that renders `<DashboardConfiguration />` for its tab key and add a matching case for the new tab.

### 4.2 New component folder

Mirror `DashboardConfiguration/` + `DashboardConfigurationContent/` (currently `index.tsx` + `styles.ts` each, ~24 lines for the outer shell):

```
PortalConfiguration/
  WellnessConfiguration/
    index.tsx                 tab shell: fetches/holds companyPortalWellnessConfig for the active domain, save/submit wiring
    styles.ts
  WellnessConfigurationContent/
    index.tsx                 renders the 4 fixed sections
    SectionHealthAssessment/
      index.tsx                form (fixed 3 tiles, no add/remove) + preview using shared ui-lib tile component
    SectionOrganisationBenefits/
      index.tsx                form + variable card list (add/remove/reorder) + preview
    SectionExploreByNeed/
      index.tsx                form (fixed 4 tiles, no add/remove) + preview
    SectionExplorePrograms/
      index.tsx                form + variable card list (add/remove/reorder) + preview
    WellnessCardForm/
      index.tsx                shared field-set form (thumbnail/heading/subheading/tags/link) reused by B & D, and a reduced variant for A/C
    styles.ts
```

### 4.3 Save/submit wiring

Follow the exact pattern already used for dashboard config in `handleSaveAndPublish` (main `index.tsx`): the existing `portalConfigurationData` payload object already assembles `companyId`, `configId`, `companyPortalConfig`, `companyPortalDashboardConfig`, `companyPolicyConfig`, `status`, `submittedAt`. Add `companyPortalWellnessConfig: wellnessState` to that same object, sent through the same `savePortalConfig` (`useApiMutation`) call to the existing upsert endpoint (`PUT /config-company/portal`). **No new endpoint, no new mutation hook.**

### 4.4 Live preview + skeleton

The preview pane renders the **shared ui-lib card component** (see §5) fed directly from the in-memory form state for that card (not a round-trip to the server). Before any field has a value, render the same component with a `skeleton` prop/variant (grey placeholder blocks matching the card's layout) rather than a separate mocked-up placeholder component — this keeps "empty state" and "filled state" as one component with one prop, not two components that can drift from each other.

### 4.5 Thumbnail upload

Reuse the exact flow in `CompanyPolicyFeatureDocumentTab/index.tsx`:
1. `POST {orgUrl}/file-upload/upload` (`endPoints.fileUpload`), multipart, with `companyType: "WELLNESS_CARD"`, `companyId`.
2. Store the returned `{id, fileName, ...}` directly into the card's `thumbnailFileId`/`thumbnailUrl` fields in local form state — **no second "map to entity" call** like the policy-document flow's step 2, since the thumbnail isn't a separate entity row, it's inline JSON.

---

## 5. Shared card component extraction (ui-lib)

Source: `apps/ui/ibp/src/app/components/Dashboard/WellnessHub/cards.tsx` (821 lines) — the presentational sub-components rendering `OrganisationBenefit`, `Programme`, and `ExploreNeed` cards (chip rendering ~line 473, 544-550; thumbnail resolution via `photo(imageKey)`/`BANNER_ART[imageKey]`).

**Plan:**
1. Extract the pure presentational leaf renderers (card shell, thumbnail, heading, subheading, chip row, CTA button) into `apps/ui/ui-lib`, parameterized by the `WellnessCard` shape in §2.2 (not the current `Programme`/`OrganisationBenefit`/`ExploreNeed` types, which assume local bundled image assets via `imageKey` — these become `thumbnailUrl`-driven instead).
2. Add a `skeleton?: boolean` prop for the empty/loading state.
3. `ibp`'s `WellnessHub/cards.tsx` imports and uses the extracted component for real rendering; `iwork`'s new `WellnessCardForm`/section preview panes import the same component for the live preview.
4. `ExploreNeed`'s fixed icon/gradient-per-id mapping stays code-owned (in the shared component, keyed by the fixed `id`), not admin-configurable — the extracted component receives `id` and looks up its own icon/gradient, ignoring any thumbnail field for this card type.

This is the highest-effort, highest-payoff piece of the frontend work — budget real review time here since a mismatch between preview and production defeats the point of the preview.

---

## 6. Frontend — IBP (consuming the config)

`apps/ui/ibp/src/app/components/Dashboard/WellnessHub/`:

- `index.tsx` — currently `PREVIEW_MODE = true` builds everything from `buildResponse(employeeState, benefitCount)` in `mockData.ts`. Change to: read `portalWellnessConfig` from `useCompanyConfig()` (already fetches the rest of `companyConfig` per §2.5); if present, map each section's `cards[]` through the extracted ui-lib components (§5); if a section is absent/empty, fall back to that section's slice of `mockData.ts` (graceful degradation for domains that haven't configured wellness yet, rather than an empty hub).
- **Section A merge**: for each configured `HealthAssessmentTile`, look up its live value by `statKey` from whatever currently supplies `HealthAssessment`/`HealthReport`/`Appointment` data (today mocked in the same file) and render the existing stat-tile visual (progress ring / count) using the *admin-configured* heading/subheading/link as the tile's chrome. If a `statKey` has no admin config, don't render that tile (rather than falling back to a hardcoded label) — v1 assumes an admin will configure all tiles they want shown.
- `types.ts` — no changes needed to the *live-data* types (`HealthAssessment` etc.); the new `WellnessCard`/`WellnessPortalConfig` types live in `ui-lib` per §5 and are imported here.
- Retire `PREVIEW_MODE` and the "preview control bar is design-review only" comment/behavior from the shipped path once config-driven rendering is live — leaving a dead preview toggle in production code is exactly the kind of drift §5 is designed to avoid.

---

## 7. Risks / open technical questions

| # | Risk | Notes |
|---|---|---|
| R1 | **Thumbnail URL staleness** — `thumbnailUrl` is denormalized into jsonb at save time (§2.2). If `org-service`'s file-upload/download endpoint returns **signed URLs with an expiry**, a URL baked in months ago will 404 on IBP long after. | Before building thumbnail upload, confirm whether `file-management.utils.ts`'s S3 access pattern returns public-read paths or expiring signed URLs. If expiring, either (a) store only `thumbnailFileId` and resolve to a URL at IBP render time via a live download-proxy call (adds a network hop per card), or (b) make the wellness upload bucket path public-read (no signing) since thumbnails aren't sensitive documents. Recommend (b) for simplicity unless a security/compliance reason rules it out. |
| R2 | **"Service organiser URL" = SSO handshake, not a plain link** — confirmed today only for the Alyve integration (`endPoints.alyveWellnessUrl`, `appKey: "alyve-wellness"`). The `link.type: SSO_REDIRECT` design (§2.2) assumes more vendors may exist later; if Alyve is and will remain the only one, this can simplify to a boolean `useSsoRedirect` instead of a vendor-key field — **needs a product decision before the link-field form UI is built** (PRD §9.2). |
| R3 | **Validation on submit** — DTO currently accepts any object shape (`@IsObject()`). Malformed wellness JSON (e.g. a card missing `heading`) would currently save/submit successfully and only fail visibly when IBP tries to render it. Recommend adding nested-DTO validation (mirroring `SelectedLocationDto`) before "Submit for Approval" is wired to real users — don't ship silent-fail JSON. |
| R4 | **`exploreByNeed` id integrity** — nothing today stops an admin payload from sending a 5th tile or a typo'd id that doesn't match the shared component's fixed icon/gradient map, resulting in a tile that silently fails to render on IBP. Validate the exact 4-id set server-side, not just client-side. |
| R5 | **Migration convention for `config-service`** — the `.sql`-script convention (D1/§2.1) was confirmed for a different service in a past TRD; verify `config-service` follows the same convention (no ORM `synchronize: true`, no separate migrations tool) before writing the schema change. |
| R6 | **Card-preview extraction (§5) touches shipped IBP code** — refactoring `cards.tsx` to take `thumbnailUrl` instead of bundled `imageKey` assets is a behavior change to a component currently in production (behind `PREVIEW_MODE`, but the code path is real). Test the extraction against the existing mock data first (props-compatible shim) before wiring the new admin JSON through, so the ibp side doesn't regress independently of the new iWork tab shipping. |

---

## 8. Build order

1. Backend: entity column + DTO field + service read/write (§2) + auth-config exposure (§2.5) — smallest, independently testable via Postman/curl against the existing upsert/fetch endpoints before any UI exists.
2. ui-lib: extract shared card components (§5), prop-compatible with current IBP mock data first (no behavior change yet).
3. IBP: swap `WellnessHub` to read `portalWellnessConfig` with mock-data fallback (§6) — ships safely since fallback preserves current behavior for domains with no config yet.
4. iWork: new tab, forms, live preview, save/submit wiring (§4) — last, since it depends on the shared components from step 2 and the backend fields from step 1.
5. Resolve R1–R4 (thumbnail URL strategy, SSO link semantics, validation, id integrity) before enabling this for a real customer domain — none of them block internal/dev testing, but all four are "will bite in production" risks.

---

## 9. IBP render — as-built (supersedes §5/§6 where they differ)

The IBP side shipped **differently** from the §5 (ui-lib extraction) / §6 (mock fallback + Section-A live merge) plan. What actually shipped:

### 9.1 Standalone config-driven renderer — no ui-lib extraction
`apps/ui/ibp/.../Dashboard/WellnessHub/index.tsx` is a **self-contained** renderer. It does **not** import the old `cards.tsx` and there is **no** shared ui-lib card component. `cards.tsx`, `mockData.ts`, `Illustrations.tsx` remain as **dead code** (unused); `wellness-response.json` / `wellness-config.json` were deleted. Consequence: the iWork preview and the IBP render are two separate components — preview/prod parity is maintained by hand (see §6 R5 in the as-built risks).

### 9.2 Data source
```ts
const { portalWellnessConfig } = useCompanyConfig();   // from GET /auth-config/company?subdomain=…
```
`useCompanyConfig` was extended to expose `portalWellnessConfig` (alongside `portalDashboardConfig` etc.). No mock fallback — the page renders only from this config.

### 9.3 Master switch
```ts
const wellnessEnabled = portalWellnessConfig?.enabled !== false;
if (!wellnessEnabled) return null;   // hides the entire hub
```

### 9.4 Section build + layout
- `buildSections(cfg)` walks `SECTION_META` (`healthAssessment`, `organisationBenefits`, `exploreByNeed`, `explorePrograms`, `wellnessLibrary`), drops cards with an empty heading and empty sections.
- `SECTION_COLUMNS` fixes columns per section (3-up; 4-up for needs/library) so cards are ~⅓/¼ width → the 16:9 `Media` (overridden to a fixed 170px in `CardThumb`) renders at a consistent height.

### 9.5 Section-specific render
- **Colour** (A/C tiles): each card applies `gradient` as background + `textColor` + a `colorCode` top-accent (legacy name→hex `ACCENT` fallback for old cards).
- **Explore programmes (D):** footer shows `₹price` + struck `originalPrice`.
- **Benefits (B):** footer shows the partner logo (`PartnerLogoThumb`).
- **View all:** header link on B/D/E → `openPortal` (SSO), matching the top header CTA.
- **Wellness Library (E):** branches to the **media-card layout** (`MediaCard`/`Thumb`/`MediaBody`/`MediaFormat`/`FormatTagIcon`/`PlayDot`/`MoreBtn`) — a format+duration badge with a colour type-icon, a ▶ play overlay for `VIDEO`/`WEBINAR`/`AUDIO`, and **no "View" button**.

### 9.6 Image download (differs from §6 plan)
Thumbnails and partner logos are **downloaded by file id at render time** (not a `thumbnailUrl` baked into the JSON — so §2.2's `thumbnailUrl` denormalization and R1 staleness risk don't apply):
```ts
// useDownloadedImage(fileId)
apiRequest(endPoints.ibpFileUploadDownloadById(fileId), { responseType: "blob" })
  → URL.createObjectURL(blob) → revoke on unmount
```
Note the required **`company-employee`** path segment (`ibpFileUploadDownloadById`, same route as the header company logo); employee auth (Authorization + `userid`) is applied by the axios interceptor. `CardThumb` and `PartnerLogoThumb` both use this hook.

### 9.7 Section A — no live-data merge (differs from D8/§6)
Section A renders as **plain admin-authored coloured cards**. The planned merge of live per-user KPI values (score %, report count, appointments) by `statKey` was **not** built — deferred. `types.ts`/`mockData.ts`/`cards.tsx` (the old rich KPI/derive logic) are unused.

### 9.8 Deferred on IBP
- **Promotional banner carousel** — `BannerCarouselSection` + `Carousel*` styled components still exist in `cards.tsx`/`styles.ts` but are **not rendered**.
- **Live per-user KPI data** in the top cards.

---

## 10. iWork — as-built additions (beyond §1–§8)

> §1–§8 is the original design. These shipped in addition, all in `apps/ui/iwork/.../WellnessConfigurationContent/` + `PortalConfiguration/index.tsx`.

### 10.1 Data model (`types.ts`)
`WellnessConfigState` gained `enabled: boolean` + a 5th section `wellnessLibrary: { cards }`. `WellnessCard` gained: `colorTemplate` / `colorCode` / `gradient` / `textColor` (tiles A/C), `format` + `durationLabel` (Library E), `price` + `originalPrice` (Programmes D), `partnerLogoFileId` (Benefits B). `mapWellnessConfigFromApi` normalises all of them (defaults `enabled` true unless explicitly false; each section seeds 1 starter card).

### 10.2 Editor flags
`WellnessCardEditorRow` / `SectionCardList` take `showMedia` (format+duration), `showPrice` (price fields), `showPartnerLogo` (second upload), `ctaLabel`. Composition in `WellnessConfigurationContent/index.tsx`: B=`showPartnerLogo`, D=`showPrice`, E=`showMedia`. Tile colour is written in `TileEditorRow` on swatch pick (`colorCode`/`gradient`/`textColor` resolved from `tileColorPalette.ts` by `intensity`).

### 10.3 Master toggle
`WellnessConfigurationContent/index.tsx` renders a `Switch` bound to `config.enabled`; disabled in view mode. (A change to also lock the sub-sections when off was added, then reverted — sections stay editable.)

### 10.4 Domain-scoping fix (the important one)
`PortalConfiguration/index.tsx` — `handleSaveAndPublish` now sets `portalConfigurationData.configId = resolvedConfigId (activeConfigId ?? portalConfigId)` before the PUT (and `configId: null` is declared on the payload literal so the assignment type-checks). Backend resolves the target row as `configId ? findById(configId) : findByCompanyId(companyId)` — without `configId` the save hit a company-level fallback and the domain-scoped reads returned null. DTO already accepts `configId?: number`.

### 10.5 Prefill
`setWellnessConfig(mapWellnessConfigFromApi(configData.companyPortalWellnessConfig))` (from `companyPortalConfigByConfigId`). A temporary `?? sampleWellnessConfig` fallback was added and **reverted**; `sampleWellnessConfig.json` remains unwired. `tsconfig.app.json` gained `resolveJsonModule` + `src/**/*.json` for that import.

### 10.6 Open issue — save 502
Some saves return a **502** from config-service. Wellness is stored opaquely (§2.4 — blind jsonb assignment, no section iteration) and no backend code changed, so this is a backend crash/timeout, not the wellness payload. Needs: which request 502s (PUT `config-company/portal` vs `domain-config-scope` vs `onboarding-mail-mode`) + the config-service log.
