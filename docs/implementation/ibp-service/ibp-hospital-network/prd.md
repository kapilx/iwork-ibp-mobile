# IBP Hospital Network — Product Requirements Document

**Module:** IBP-HOSPITAL-NETWORK  
**Product:** Integrated Benefits Portal (IBP)  
**Client:** IIRM  
**Stage:** 40a — Module PRD  
**Authored:** 2026-07-20  
**Audience:** Product owners, HR admins, client stakeholders, QA leads

---

This document specifies the product behavior for the employee-facing **Hospital Network** module within the IBP using the Reverse Engineering method to understand the implemented business logic. Hospital Network is the screen where an insured employee finds the hospitals covered under their policy — searching and filtering the TPA-provided network, viewing hospitals as a list or on a map, seeing distance from their location, and getting directions. It is reached from the Dashboard's "Hospital Network" quick-access tile. Anyone reading this doc cold should be able to determine what the module does, who it serves, and how to verify it is working correctly.

**Scope note.** This PRD covers the **employee-facing** network at route `/hospital` (`pages/HospitalNetworkV1`). The HR-portal hospital management surface (`HRPortalHospitals`) and the backend external-sync ingestion pipeline are separate modules; this flow only *reads* the synced network.

---

## Scope

### In scope

- The `/hospital` employee screen (`HospitalNetworkV1`): its composition and behavior
- Card / list view with infinite scroll, and Map view (Google Maps) with a toggle between them
- Free-text search (hospital name / address) and the filter panel (hospital type Included/Excluded, State, City, Pincode)
- Policy scoping: the network is scoped to the employee's policies, with a policy picker when the employee has more than one
- Geolocation, per-hospital distance, and "Get Directions"
- Surfacing of TPA-synced hospitals (`source = API_SYNC`) under a feature flag
- The "last synced at" transparency indicator and the total network count

### Out of scope

- The HR-portal hospital management surface (`HRPortalHospitals` / `HRPortalHospitalsV2`: Network / Claims / Agreements / Performance tabs) — separate module
- The external hospital **sync pipeline** and file-upload ingestion (scheduler-service cron, master-data tables, geocoding) — this module only reads the resulting network (see `docs/external-hospital-sync.md`)
- Claims-intimation hospital search (`ClaimsIntimation/HospitalSearchSelector`) — separate flow
- Backend / API implementation (owned by `ibp-service` and `policy-service`)
- The legacy mock `HospitalNetwork` page (unrouted dead code — see Gap Register)

---

## Flow Overview

The employee reaches the screen from the Dashboard "Hospital Network" tile → route `/hospital` → `HospitalNetworkV1`, a single stateful controller.

**Header**: back-to-dashboard arrow, title with the localized total network count, a subtitle ("List of Network hospitals as provided by the TPA…"), a Card/Map view toggle, a policy dropdown (shown only when the employee has more than one policy), and a Filter button.

**Search & filter**: a debounced free-text search over hospital name/address, a "Last synced at" timestamp, and an inline filter panel (Hospital Type Included/Excluded, State, City, Pincode) with Clear and Apply.

**Card view** (default): a scrollable list of hospital cards (name, location, phone, a "show on map" action), loaded 25 at a time via infinite scroll. **Map view**: a Google map with a marker per hospital, info windows with distance and a Directions link, a "Your Location" dot, and a results side-panel; the visible radius is derived from the map bounds and drives refetching.

The list is always **scoped to the employee's policies**; a Group Mediclaim policy is preferred as the primary policy for the geospatial map path.

---

## Implementation Status

BRs without a status marker are **Implemented**. Rules tagged `Partial`, `Defect`, `Doc-drift`, `Feature-flagged`, or `Dead` are noted inline and detailed in the [Gap Register](#gap-register). Everything in this PRD is **reverse-engineered from the shipped code** — no new product decisions are introduced here.

- **Reverse-engineered from code:** BR-HN-001 through BR-HN-016. Several correct the existing `hospital-network-map-flow.md` note, which drifted from the shipped endpoints and paths.

---

## User Stories

The following stories are traced to use cases and functional requirements derived from the existing implementation. MODULE code is **HN**.

---

### Access & Orientation

**US-HN-001** — As an **insured employee**, I want to see the hospitals covered under my policy, so that I know where I can seek cashless treatment.

- Traces to: UC-HN-01 / FR-HN-01

**US-HN-002** — As an **employee**, I want to see the total count and when the network was last synced, so that I trust the list is current.

- Traces to: UC-HN-02 / FR-HN-02

**US-HN-003** — As an **employee with more than one policy**, I want to pick which policy's network I'm viewing, so that I see the hospitals relevant to that cover.

- Traces to: UC-HN-03 / FR-HN-03

### Browse & Search

**US-HN-004** — As an **employee**, I want to browse network hospitals as a scrollable list, so that I can skim many hospitals quickly.

- Traces to: UC-HN-04 / FR-HN-04

**US-HN-005** — As an **employee**, I want to search by hospital name or address, so that I can quickly find a specific hospital.

- Traces to: UC-HN-05 / FR-HN-05

**US-HN-006** — As an **employee**, I want to filter by hospital type (included/excluded), state, city, and pincode, so that I can narrow the network to my area.

- Traces to: UC-HN-06 / FR-HN-06

### Map & Navigation

**US-HN-007** — As an **employee**, I want to view network hospitals on a map, so that I can see which are near me.

- Traces to: UC-HN-07 / FR-MAP-01

**US-HN-008** — As an **employee**, I want to see each hospital's distance from my location and get directions, so that I can travel there.

- Traces to: UC-HN-08 / FR-MAP-02

**US-HN-009** — As an **employee**, I want the map to center on my current location (with a sensible fallback), so that nearby hospitals are shown first.

- Traces to: UC-HN-09 / FR-MAP-03

---

## Business Rules

The rules below govern policy scoping, search/filter, list and map behavior. They are derived directly from the implemented logic and must be preserved in any future change.

---

### Policy Scoping

**BR-HN-001 — Network is scoped to the employee's policies**  
The hospital list is scoped to the policies the employee holds. `hospitalPolicyIds` is built from `policiesData.employeePolicies` + `enrolledPolicies`; a "Group Mediclaim Policy" is preferred as the `primaryHospitalPolicyId`. When the employee has more than one policy, a policy dropdown lets them filter to a single policy; the card search sends `policyIds[]`. **Caveat:** the map geospatial path uses `primaryHospitalPolicyId` (the GMC policy, or the first policy), derived independently of the dropdown selection — so selecting a non-GMC policy re-scopes the card list but **not** the geo map (`index.tsx:317-318`). See GAP-HN-11. All requests also require a `userid` header (except `policy/locations`), returning 400 if absent — see TRD §11.

**BR-HN-002 — No-policy guard**  
When the employee has no resolvable hospital policy, the screen renders a "No policies found…" empty state rather than an unscoped list.

---

### Search & Filter

**BR-HN-003 — Debounced free-text search**  
Search is debounced (400 ms). In **card view** the term is sent to the server (`search` param), where it matches across `name`, `code`, `addressLine1`, `addressLine2`, and `landmark` (case-insensitive; `portal-configuration.util.ts:508-529`) — broader than the "name/address" placeholder implies. In **map view** the term is additionally applied **client-side** on hospital name only over the fetched set. Backend also supports `state`/`city` partial match, `pinCode` **prefix** match (`LIKE 'pin%'`), and a `sort` param — though the UI never sends `sort` (default order `createdAt DESC`).

**BR-HN-004 — Filter fields**  
The filter panel exposes: Hospital Type as an Included/Excluded segmented control (maps to `isNetworkHospital` true/false), State (server-sourced select), City (server-sourced select, dependent on the selected State), and Pincode (text, PIN-code regex-validated; Enter applies). There is no cashless/speciality filter in the employee UI. Clear resets to `initialHospitalFilterValues`; Apply commits the draft.

**BR-HN-005 — Included vs Excluded** `Defect`  
The Included/Excluded distinction is intended to be driven by `isNetworkHospital`. In practice it is currently **non-functional** for card search on two counts: (1) in synced-only mode (the default, BR-HN-013) the backend skips the `isNetworkHospital` filter; (2) even outside synced mode, the UI sends `isNetworkHospital` as a JSON **boolean**, but the DTO transform only accepts the strings `'true'`/`'false'` and otherwise yields `undefined` — so the filter is dropped and the "Excluded" tab returns all hospitals (`search-hospital.dto.ts:88-94`, `index.tsx:474`). The GET geospatial path sends it as a query string, so the transform works there. (The former explicit tab buttons are retired into the filter's segmented control.) See GAP-HN-08.

---

### Card / List View

**BR-HN-006 — Infinite scroll, 25 per page**  
The card list loads `ITEMS_PER_PAGE = 25` at a time via a window-scroll listener (200 px threshold, with a short-content fallback that auto-loads the next page when the list is shorter than the viewport). Pages are accumulated and de-duplicated by id, or by name + address + pincode when id is absent.

**BR-HN-007 — Show on map**  
Each card offers a "View on map" action that switches to map view focused on that hospital; toggling back restores the previous filters when the user arrived via a card click.

---

### Map View

**BR-HN-008 — Geospatial vs card-search sourcing** `Doc-drift` `Defect`  
Map view is *designed* to use the **policy-service geospatial** endpoint (`GET …/portal-configuration/policy/hospitals/search/:policyId`) with `latitude`, `longitude`, and a `radius` derived from the map bounds — **except** when filters are applied or the synced-hospitals flag is on, in which case it falls back to the **card search POST** endpoint. Because the synced flag **defaults ON** (BR-HN-013), in the shipped config the geospatial result is **always discarded** and the map uses the card-POST fallback (`index.tsx:548`). The card POST returns no `distanceInMeters`, so **per-hospital distance is not shown by default** (BR-HN-012 is effectively dormant) and directions fall back to the marker position only. The geospatial query still fires and is thrown away (its `enabled` guard omits `!showSyncedHospitals`) — a wasted call. See GAP-HN-09.

**BR-HN-009 — Radius from map bounds; refetch on move/zoom**  
The search radius is auto-derived from the current map bounds (default 5 km; `mapLimit` starts at 12 and doubles up to 200 on zoom-out); panning/zooming refetches. Markers are individual Google Maps markers — **clustering is not implemented**.

**BR-HN-010 — Coordinate resolution with geocode fallback**  
A hospital's map position is resolved from `address.latitude/longitude` → `hospital.latitude/longitude` → `location.lat/lng` → `lat/lng`; if none are present, the address string is geocoded client-side via the Google Geocoder.

**BR-HN-011 — Geolocation with fallback**  
The map centers on the browser's current location; if permission is denied or unavailable, it falls back to Hyderabad (17.385044, 78.486671). A blue "Your Location" marker is shown, and the view fits bounds to include hospitals plus the user.

**BR-HN-012 — Distance & directions**  
Distance is formatted from `distanceInMeters` returned by the geospatial search. "Directions" opens Google Maps directions (`/maps/dir/?api=1&origin=…&destination=…`) resolved from the marker's actual position at click time.

---

### Data Source & Transparency

**BR-HN-013 — Synced-only mode (the default) shows *only* TPA-synced hospitals** `Feature-flagged` `Defect`  
Hospitals ingested from the **external GoodHealth TPA API** (`POST https://webserv.goodhealthtpa.in/api/Intermediary/GetHospitalInfo`) are stored with `source = "API_SYNC"`. When `VITE_FF_SHOW_SYNCED_HOSPITALS !== "false"` (**default ON**), the card search sends `source: "API_SYNC"`, which puts the backend into **synced-only mode**: it returns *only* `source = 'API_SYNC'` hospitals joined by TPA, does **not** join the policy-hospital mapping, and **skips the Included/Excluded (`isNetworkHospital`) filter entirely** (`portal-configuration.util.ts:485-506`). So in the shipped default config the employee sees only API-synced hospitals — **not** the policy-mapped / file-uploaded network — and the Included/Excluded toggle (BR-HN-005) is inert. This is the only third-party API in the chain, and the employee UI never calls it directly — it reads the synced rows via ibp-service/policy-service. Ingestion runs via the config-driven `GenericTpaSyncScheduler` (the older dedicated `ExternalHospitalSyncScheduler` is disabled). See TRD §10; whether this synced-only default is intended is an Open Question. Ingestion pipeline itself is out of scope — see `docs/external-hospital-sync.md` (stale, GAP-HN-06).

**BR-HN-014 — Last synced indicator & count**  
The header shows the total network count (localized) and a "Last synced at" timestamp sourced from the card search response (`lastSyncedAt`). The card response also returns `networkHospitalCount` and `excludedHospitalCount` (undocumented in the prior note). When the API omits `lastSyncedAt`, the UI derives it client-side from `MAX(createdAt)` of the returned rows. In synced-only mode the server computes `lastSyncedAt` / `networkHospitalCount` **globally over all `API_SYNC` rows**, not scoped to the returned (TPA-filtered) set, so the count can diverge from what is listed.

**BR-HN-015 — State/city options are server-sourced and policy-scoped**  
State and City filter options come from the locations endpoint scoped to the employee's `policyIds`; City options are re-fetched for the selected State.

**BR-HN-016 — Address shape tolerance**  
Hospital records may carry `addresses` as either an array or a single object; the UI renders either shape.

---

## Acceptance Criteria

Each criterion maps to one or more user stories above. Written in Given/When/Then format for QA and client sign-off.

---

**AC-HN-001** (→ US-HN-001, BR-HN-001) `Built`  
**Given** an employee with at least one hospital-bearing policy,  
**When** they open `/hospital`,  
**Then** the card list renders the network hospitals scoped to their policies, with the total count in the header.

---

**AC-HN-002** (→ US-HN-001, BR-HN-002) `Built`  
**Given** an employee with no resolvable hospital policy,  
**When** they open `/hospital`,  
**Then** a "No policies found…" empty state is shown instead of a list.

---

**AC-HN-003** (→ US-HN-003, BR-HN-001) `Built`  
**Given** an employee with more than one policy,  
**When** the header renders,  
**Then** a policy dropdown is shown and selecting a policy re-scopes the list; with a single policy, the dropdown is hidden.

---

**AC-HN-004** (→ US-HN-004, BR-HN-006) `Built`  
**Given** the card view,  
**When** the employee scrolls to the bottom,  
**Then** the next 25 hospitals load and append, de-duplicated; a loader shows while fetching and "No hospitals found for selected filters." shows when empty.

---

**AC-HN-005** (→ US-HN-005, BR-HN-003) `Built`  
**Given** the card view,  
**When** the employee types a hospital name or address,  
**Then** after a 400 ms debounce the list re-queries the server with the search term.

---

**AC-HN-006** (→ US-HN-006, BR-HN-004, BR-HN-015) `Built`  
**Given** the filter panel,  
**When** the employee selects Hospital Type / State / City / Pincode and clicks Apply,  
**Then** the list re-queries with those filters; City options depend on the selected State; an invalid pincode is rejected; Clear resets the filters.

---

**AC-HN-007** (→ US-HN-007, BR-HN-008, BR-HN-009) `Built`  
**Given** the map view with no filters and the synced flag off,  
**When** the map loads or is moved/zoomed,  
**Then** hospitals within the bounds-derived radius are fetched via the geospatial endpoint and rendered as markers; with filters applied or the synced flag on, the card-search endpoint is used instead.

---

**AC-HN-008** (→ US-HN-008, BR-HN-012) `Built`  
**Given** a hospital marker/info window,  
**When** the employee views it,  
**Then** the distance from their location is shown and a "Directions" link opens Google Maps directions from their location to the hospital.

---

**AC-HN-009** (→ US-HN-009, BR-HN-011) `Built`  
**Given** the map view,  
**When** geolocation is granted,  
**Then** the map centers on the employee with a "Your Location" marker; when denied/unavailable it falls back to Hyderabad.

---

**AC-HN-010** (→ US-HN-002, BR-HN-014) `Built`  
**Given** a loaded network,  
**When** the header renders,  
**Then** the total count and the "Last synced at" timestamp from the response are shown.

---

## Data Contract

This section defines what Hospital Network consumes and produces. It does not describe internal implementation — that belongs in the TRD (Stage 40c).

### Consumed by Hospital Network

| Source | Shape | Purpose |
|---|---|---|
| `state.policyData.policiesData` | `employeePolicies` / `enrolledPolicies` | Policy scoping (`hospitalPolicyIds`, primary GMC policy) |
| `POST getHospitalNetworks()` (`ibp-service` `/company-employee/policy/hospitals/search`) | `{ ...filters, policyIds[], isNetworkHospital, source?, page, limit:25 }` → `{ data[], count, lastSyncedAt }` | Card/list search |
| `GET getHospitalNetworksGeospatial(policyId)` (`policy-service` `/portal-configuration/policy/hospitals/search/:policyId`) | `?isNetworkHospital&<filters>&latitude&longitude&radius&page&limit` → `{ data[] (with distanceInMeters, lat/lng), count }` | Map geospatial search |
| `POST hospitalNetworkLocations()` (`ibp-service` `/company-employee/policy/locations`) | `{ policyIds, state? }` → `{ states[] }` / `{ cities[] }` | Filter options |
| `GET hospitalNetworkExport(policyId)` (`ibp-service`) | blob | Excel export (currently unreachable in UI — see Gap Register) |
| Google Maps JS API + Geocoding | `VITE_GOOGLE_MAPS_API_KEY` | Map render, geocode fallback, directions |
| Browser Geolocation | lat/lng | Map centering, distance |

### Produced by Hospital Network

| Destination | Shape | Purpose |
|---|---|---|
| Toast (`setToastMessage`) | export success/error | User feedback |
| Google Maps (external) | directions URL | Navigation hand-off |

*The module produces no durable server state; it is read-only over the network plus an on-demand export blob.*

### Cross-module contract items

- **IBP-DASHBOARD**: the "Hospital Network" quick tile routes here (`/hospital`, gated on `hasViewablePolicies`).
- **External Hospital Sync** (scheduler-service / master-data): the source of `source = "API_SYNC"` hospitals, populated from the third-party **GoodHealth TPA `GetHospitalInfo`** API via the config-driven `GenericTpaSyncScheduler`. The `source` field and the `mstr_hospital` / address shape must remain stable; the `VITE_FF_SHOW_SYNCED_HOSPITALS` flag governs employee visibility. The employee UI does not call GoodHealth directly.
- **policy-service** (`portal-configuration`): owns the geospatial search (raw-SQL Haversine, not PostGIS); its `:policyId` contract and `distanceInMeters` field must remain stable.
- **ibp-service** (`company-employee`): owns the card search, locations, and export endpoints.

---

## Gap Register

Tech Lead reference: every BR tagged `Doc-drift`, `Dead`, `Feature-flagged`, or `Partial`, plus dead code and doc mismatches found during reverse engineering.

| GAP | Group | BRs | Description | Files |
|---|---|---|---|---|
| GAP-HN-01 | Dead | — | The legacy `pages/HospitalNetwork/` tree (mock JSON, GSAP demo, ~34 KB `sampleJson.ts`) is imported in `app.tsx` but never routed. Delete. | `pages/HospitalNetwork/*`, `app.tsx:24` |
| GAP-HN-02 | Dead | — | The Export-to-Excel button and the Network/Excluded tab buttons are inside a large commented-out JSX block, so `handleExportClick` and the `hospitalNetworkExport` endpoint are fully implemented but **unreachable**. Decide: restore the export button or remove the dead handler/endpoint. | `pages/HospitalNetworkV1/index.tsx:879-912,814-863` |
| GAP-HN-03 | Dead | — | `handleBackNavigation` is defined but unused (back uses inline `navigate("/dashboard")`); `sentinelRef` is attached but its IntersectionObserver was removed (now a no-op). Remove. | `HospitalNetworkV1/index.tsx:775-777`, `HospitalCards/index.tsx:35,154` |
| GAP-HN-04 | Cleanup | — | Stray `console.log` (short-content fallback) and `console.error` (geocode failure) in the live path. Strip or gate. | `HospitalCards/index.tsx:65`, `HospitalMapView.tsx:580` |
| GAP-HN-05 | Doc-drift | BR-HN-008 | `hospital-network-map-flow.md` describes the card view as `GET …/hospitals/search/:policyId`; the shipped card endpoint is a **POST** to `/company-employee/policy/hospitals/search` with `policyIds[]` in the **body**. Also undocumented: the map non-geospatial fallback and the extra client-side name filter in map view. Reconcile the note (or supersede it with this PRD/TRD). | `docs/hospital-network-map-flow.md`, `endPoints.ts:67-69` |
| GAP-HN-06 | Doc-drift | BR-HN-013 | `hospital-network-map-flow.md` predates the external TPA sync and never mentions `source="API_SYNC"` or `VITE_FF_SHOW_SYNCED_HOSPITALS`. Separately, `external-hospital-sync.md` is now stale: it documents the **disabled** `ExternalHospitalSyncScheduler` (its `@Cron("30 13 * * *")` is commented, "replaced by GenericTpaSyncScheduler") and a cadence that no longer matches the code. Reconcile both against the active config-driven `GenericTpaSyncScheduler`. | `docs/hospital-network-map-flow.md`, `docs/external-hospital-sync.md`, `external-hospital-sync.scheduler.ts:57`, `generic-tpa-sync.scheduler.ts` |
| GAP-HN-07 | Partial | BR-HN-009 | Map markers are individual (no clustering); large networks in a zoomed-out view may render hundreds of markers. Consider clustering for scale. | `HospitalMapView.tsx` |
| GAP-HN-08 | Defect | BR-HN-005 | `isNetworkHospital` is sent as a JSON boolean on the card POST, but the DTO transform only accepts the strings `'true'`/`'false'` → becomes `undefined` → Included/Excluded filter is dropped and "Excluded" returns all hospitals. Send as string, or fix the transform to accept booleans. | `search-hospital.dto.ts:88-94`, `HospitalNetworkV1/index.tsx:474` |
| GAP-HN-09 | Defect | BR-HN-008, BR-HN-013 | Synced flag defaults ON → (a) card search is synced-only (policy-mapped network hidden, Included/Excluded skipped), and (b) the map geospatial result is discarded in favor of the card-POST fallback, so `distanceInMeters`/distance is never shown by default and the geospatial query fires but is thrown away. Confirm intended default; fix the wasted geo query's `enabled` guard. | `HospitalNetworkV1/index.tsx:469-478,524,548`, `portal-configuration.util.ts:485-506` |
| GAP-HN-10 | Doc-drift | — | Backend geospatial distance is a raw-SQL **Haversine** approximation "to avoid PostGIS", and pagination is **in-memory** (`getMany()` + `.slice`; multi-policy path fetches `limit:10000` per policy then dedups in JS). (Earlier TRD text wrongly said PostGIS + DB paging; corrected.) | `portal-configuration.repository.ts:1167,1201-1248`, `portal-configuration.service.ts:1367-1410` |
| GAP-HN-11 | Defect | BR-HN-001 | The policy dropdown re-scopes the card list but **not** the geo map: `primaryHospitalPolicyId` is the GMC/first policy, derived independently of `selectedPolicyId`. | `HospitalNetworkV1/index.tsx:277-291,317-318` |
| GAP-HN-12 | Gap | BR-HN-002, BR-HN-013 | An employee with no resolvable policy sees "No policies found" and never gets synced hospitals, even though the synced flag is ON and the DTO comment claims `policyIds` may be empty in synced mode. Reconcile the UI guard vs the synced-mode contract. | `HospitalNetworkV1/index.tsx:865-873`, `search-hospitals-by-policies.dto.ts:8`, `portal-configuration.util.ts:458-465` |

---

## Open Questions

These items were unresolved during reverse engineering and should be answered before Stage 40c (TRD) is finalized.

1. **Excel export** — is the network export (GAP-HN-02) meant to be a live employee feature (restore the button) or was it deliberately hidden (remove the dead code)? (Product)
2. **Synced-only default** — `VITE_FF_SHOW_SYNCED_HOSPITALS` defaults ON, which puts the whole screen into synced-only mode: employees see **only** informational API-synced hospitals (not the policy-mapped network), the Included/Excluded filter is skipped, and the geospatial/distance path is bypassed. Is this the intended production behavior, or should the default be OFF (policy-mapped network) with synced hospitals additive? (Product) — this is the single most important decision here.
3. **Map clustering** — is marker clustering required for large networks, or is the current bounds-radius fetch sufficient? (Product/Tech)
4. **Search parity** — should map-view search query the server (like card view) rather than filtering client-side on name only? (Product/Tech)

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
