# Cover & Cover-Template Mapping — Technical Spec

## 1. Goal

Add a new **"Covers"** entity to the `/master` route's "Select Entity" dropdown and
introduce a two-step flow:

1.  **Step 1 — Create Cover:** insert a base cover into `mstr_cover`.
2.  **Step 2 — Map Policy Type → Covers:** pick a policy type and one or more existing
    covers, then insert the resulting rows into `mstr_cover_template`.

Both steps reuse the existing master-module UI components and the generic master backend
where possible.

## 2. Data Model (existing entities — do not redefine)

### 2.1 `mstr_cover` — base cover catalog

File: `apps/services/service-lib/src/lib/entities/mstr-cover.entity.ts`

| Column         | TS field      | Type        | Notes                                         |
| -------------- | ------------- | ----------- | --------------------------------------------- |
| `id`           | `id`          | int PK      | auto                                          |
| `name`         | `name`        | varchar(200), not null | Cover name. Must be **unique**.    |
| `description`  | `description` | text, null  |                                               |
| `cover_type`   | `coverTypeLid`| int, null (FK LookUp) | lookup, `lookup_key = COVER_TYPE`   |
| `input_type`   | `inputType`   | varchar(100), null | for now: `text`, `textarea`            |
| `input_lov`    | `inputLov`    | jsonb, null | list-of-values (see §6)                       |
| `covers_meta`  | `coversMeta`  | jsonb, null | render metadata (see §6)                      |
| `created_by` / `updated_by` | | int, null | set from `userid` header                    |

### 2.2 `mstr_cover_template` — policy-type ↔ cover mapping

File: `apps/services/service-lib/src/lib/entities/mstr-cover-template.entity.ts`

| Column            | TS field          | Type        | Source in Step 2                                  |
| ----------------- | ----------------- | ----------- | ------------------------------------------------- |
| `id`              | `id`              | int PK      | auto                                              |
| `ref_cover_id`    | `refCoverId`      | int, not null | = `mstr_cover.id` of the selected cover         |
| `cover_name`      | `coverName`       | varchar(200)| copied from `mstr_cover.name`                     |
| `cover_description`| `coverDescription`| text       | copied from `mstr_cover.description`              |
| `mandatory`       | `mandatory`       | varchar(10), default "Yes" | **user-set** per cover             |
| `organization_id` | `organizationId`  | int, not null | **user-set / context** (see §5.4)               |
| `policy_type_id`  | `policyTypeId`    | int, not null | from Step-2 policy-type dropdown                 |
| `display_sequence`| `displaySequence` | int, null   | **user-set** (order in side panel)                |
| `display_category`| `displayCategory` | varchar(100)| optional, copy/derive (open — §8)                 |
| `cover_type`      | `coverTypeLid`    | int, null   | copied from `mstr_cover.cover_type`               |
| `input_type`      | `inputType`       | varchar(100)| copied from `mstr_cover.input_type`               |
| `input_lov`       | `inputLov`        | jsonb, null | copied from `mstr_cover.input_lov`                |
| `covers_meta`     | `coversMeta`      | jsonb, null | copied from `mstr_cover.covers_meta`              |
| `section_id`      | `sectionId`       | int, null   | optional (`mstr_cover_section`) — open (§8)       |

**Mapping principle:** everything that can be carried over from `mstr_cover` is copied
automatically (`ref_cover_id`, `cover_name`, `cover_description`, `cover_type`,
`input_type`, `input_lov`, `covers_meta`). The user only supplies `policy_type_id`,
`mandatory`, `organization_id`, and `display_sequence`.

**Confirmed from a real row (`mstr_cover_template` id 5032):**

-   `ref_cover_id` = source `mstr_cover.id` (e.g. 5032).
-   `cover_name` = source `mstr_cover.name`; `cover_description` = source `description`.
-   `cover_type`, `input_type`, `input_lov`, **`covers_meta` are copied VERBATIM** from the
    source cover — `covers_meta` is NOT regenerated in Step 2 (it is generated once, at
    cover creation in Step 1). So Step 2 is a pure copy + the four user/context fields.
-   `policy_type_id` is a `POLICY_TYPE` lookup id (e.g. 18543).
-   `created_by` / `updated_by` are **NOT NULL, default 0** on this table (set from the
    `userid` header).

### 2.3 Lookups & policy types

-   `cover_type` options: lookup with `lookup_key = COVER_TYPE`. Frontend endpoint
    `endPoints.lookUpByName("COVER_TYPE")` / `lookUpValuesByName`.
-   Policy types: **DECIDED — use the `POLICY_TYPE` lookup** (not `policy_type_segregation`).
    Step 2 fetches policy types via the `POLICY_TYPE` lookup and uses each value's id as
    `policy_type_id`.

## 3. Existing system we build on

-   Route: `apps/ui/iwork/src/app/routes/master.route.tsx` (`/master`, `/master/:entity/new`, etc.).
-   Entity dropdown is fed by `GET /master/entities` → `endPoints.masterEntities`.
    Page: `apps/ui/iwork/src/app/pages/MasterPage/MasterView/index.tsx`.
-   Generic backend CRUD lives in `org-service`:
    -   `master.controller.ts` — `@Controller("master")`, generic `POST/GET/PUT/DELETE :entity`.
    -   `master.service.ts` — `getEntitiesList()` (entity dropdown source), `createRecord()`.
    -   `master.repository.ts` — `buildEntityMetadata()` auto-derives form/grid from TypeORM columns.
    -   Entity name → class resolved by `getEntityByName()` in
        `apps/services/service-lib/src/lib/utils/get-entity.utils.ts`.
-   Reusable UI: `AutocompleteStyles`, `SelectFieldByApi`, `CommonSelect`, and the
    `ProgressWizard`/`Stepper` (`apps/ui/ui-lib/src/lib/commonComponents/Stepper/`,
    hook `useStepper.ts`).

## 4. Step 1 — Create Cover (writes `mstr_cover`)

### 4.1 Fields

1.  **Cover name** — text input with API-backed uniqueness check (see §4.2). Required.
2.  **Description** — multi-line text. Optional.
3.  **Cover type** — `SelectFieldByApi` populated from `COVER_TYPE` lookup. Stores `coverTypeLid`.
4.  **Input type** — dropdown, options for now: `Text` (`text`), `Text Area` (`textarea`).
5.  **Input LOV** — see §6. Hidden/not required for `text` / `textarea`.
6.  **Covers meta** — see §6. Auto-handled; not a free-form JSON box for end users.

### 4.2 Cover-name uniqueness ("search by API field")

**DECIDED — reuse the generic list filter** (no new endpoint). As the user types, query
`GET /master/cover?searchBy=name&search=<text>` (`endPoints.masterList("cover")` with query
params). If an exact (case-sensitive) match is returned, mark the field invalid and block
submit. Debounce the lookup. A DB unique index on `mstr_cover.name` remains the final guard.

### 4.3 Backend

Reuse the generic `POST /master/cover` path:

-   Register `cover` in `getEntityByName()` → `return MstrCover;`.
-   Add `{ name: "cover", label: "Covers" }` to `getEntitiesList()` so it appears in the dropdown.
-   `createRecord()` already sets `createdBy`/`updatedBy` from column metadata.
-   Add server-side uniqueness validation on `name` (DB unique index + pre-insert check)
    so the UI check is not the only guard.

## 5. Step 2 — Map Policy Type → Covers (writes `mstr_cover_template`)

### 5.1 Layout (single screen, two panes)

-   **Left (selection):**
    -   Organisation dropdown (single select) — reused from smart-search filters (§5.4).
    -   Policy-type dropdown (single select) — from the `POLICY_TYPE` lookup.
    -   Cover dropdown (searchable) — all `mstr_cover` rows, by name.
    -   **Add** button beside the cover dropdown → pushes selected cover into the right pane.
-   **Right (mapped covers panel):**
    -   On policy-type select, fetch and show covers already mapped to it
        (`mstr_cover_template` where `policy_type_id = X`). Each row shows cover name +
        editable `mandatory` and `display_sequence`, with an **unmap/remove** action.
    -   Newly added covers (not yet saved) appear here too, visually distinct from
        already-persisted ones.
-   **Submit** button → persists the panel to `mstr_cover_template`.

### 5.2 Behavior

-   Selecting a policy type loads existing mappings → user sees current state.
-   Add appends a cover; prevent duplicates (same `ref_cover_id` already in panel for this
    policy type).
-   Unmap removes a row; if it was already persisted it is deleted on submit.
-   Per-row editable: `mandatory` (Yes/No), `display_sequence` (auto-incremented default,
    user-adjustable).

### 5.3 Data carried automatically vs. user-supplied

-   **Auto from `mstr_cover`:** `ref_cover_id`, `cover_name`, `cover_description`,
    `cover_type`, `input_type`, `input_lov`, `covers_meta`.
-   **User/context:** `policy_type_id`, `mandatory`, `display_sequence`, `organization_id`.

### 5.4 `organization_id` — DECIDED

**Add an Organisation dropdown to Step 2**, reusing the same organisation dropdown used in
the smart-search filters (sends `organisationId`; populated via `endPoints.masterOrganisation`
= `/master/organisation`). The selected org id is written to `mstr_cover_template.organization_id`
for every row in the submit.

### 5.5 Backend

The bulk map/unmap is not a single-record CRUD, so it has **dedicated endpoints**. They live
on `MasterController` (`@Controller("master")`) under the `master` path — declared before the
`:entity` param routes so the static path wins — so they inherit the **master module ACL**
(the gateway `AclGuard` keys authorization off the first path segment; a standalone `/cover`
route returns 401 "Access denied" because no `cover` ACL module is mapped). The handlers
delegate to `CoverService` / `CoverRepository`.

-   `GET /master/cover-templates?policyTypeId=X&organizationId=Y` → existing mappings for the
    right pane (`organizationId` optional).
-   `POST /master/cover-templates/sync` with body:
    ```json
    {
      "policyTypeId": 12,
      "organizationId": 3,        // from the Step-2 organisation dropdown
      "covers": [
        { "refCoverId": 101, "mandatory": "Yes", "displaySequence": 1 },
        { "refCoverId": 102, "mandatory": "No",  "displaySequence": 2 }
      ]
    }
    ```
    Server resolves each `refCoverId` against `mstr_cover`, copies the carry-over fields,
    upserts rows for this `policy_type_id`, and deletes rows that were removed.
-   Mirror the existing copy pattern in
    `opportunity.repository.ts:1646-1671` (template → cover-map construction).

## 6. Handling `input_lov` and `covers_meta` (my recommendation)

These two jsonb columns are render-time metadata consumed downstream (see
`buildSectionAwareCoverConfig.ts`, which reads `coversMeta.formConfig` /
`coversMeta.sectionRenderPlan`). They are NOT meant to be hand-authored by a master-data
user.

### 6.1 `input_lov`

Observed shape — a **flat `{ key: label }` map**, e.g.:

```json
{ "cover_type_no": "No", "cover_type_yes": "Yes" }
```

-   This is the option set for **choice-style** inputs (select/radio/checkbox). For the
    current scope (`text`, `textarea`) there is no LOV → **store `null` and hide the field**.
-   Build the UI so a key/label LOV editor appears only when `input_type` becomes a choice
    type later. The editor would produce exactly this `{ key: label }` object. This keeps
    Step 1 simple now and forward-compatible.

### 6.2 `covers_meta`

`covers_meta` holds a `formConfig` array (and optional `sectionRenderPlan.blocks`) consumed
by `buildSectionAwareCoverConfig.ts` to render the cover at point of use. We **auto-generate**
it from the cover's `name` + `input_type` at creation — never a raw JSON box for users.

**Locked shapes (from real samples):**

`input_type = text`:

```json
{
  "formConfig": [
    {
      "key": "72HoursClause",
      "name": "72HoursClause",
      "type": "text",
      "label": "72 Hours Clause",
      "rules": { "required": { "value": true, "message": "This is required field" } },
      "gridColumn": 9,
      "componentProps": { "fullWidth": true }
    }
  ]
}
```

`input_type = textarea`:

```json
{
  "formConfig": [
    {
      "key": "72HoursSuddenAndAccidentalPollution",
      "name": "72HoursSuddenAndAccidentalPollution",
      "type": "textarea",
      "label": "72 Hours Sudden and Accidental Pollution",
      "rules": { "required": { "value": true, "message": "This is required field" } },
      "gridColumn": 9,
      "componentProps": { "rows": 3, "fullWidth": true, "multiline": true }
    }
  ]
}
```

**Generation rules:**

-   `key` = `name` = cover name in PascalCase with spaces removed, leading digits preserved
    (e.g. `"72 Hours Sudden and Accidental Pollution"` → `"72HoursSuddenAndAccidentalPollution"`;
    every word capitalised, including small words like "and").
-   `type` = the cover's `input_type` (`text` | `textarea`).
-   `label` = the original cover name (spaces preserved).
-   `rules.required` = `{ "value": true, "message": "This is required field" }`.
-   `gridColumn` = default `9` (real rows show both `9` and `5`; `9` is the default the
    generator emits — make it overridable later if needed, not v1).
-   `componentProps`: `text` → `{ "fullWidth": true }`;
    `textarea` → `{ "rows": 3, "fullWidth": true, "multiline": true }`.
-   When `input_lov` is present (future choice types), the LOV `{ key: label }` map feeds the
    field's options; out of scope for v1 (`text`/`textarea` only).

Verified against `mstr_cover` id 5275 ("24 Hours Cover", text): generated `covers_meta`
matched this rule set exactly.

**Generation runs ONCE — at cover creation (Step 1) on `mstr_cover`.** Step 2 copies
`covers_meta` verbatim into `mstr_cover_template`; it does not regenerate. The generator
belongs in a shared `service-lib` helper used by Step 1. If an advanced/raw override is
ever needed, gate it behind an "Advanced" toggle — not v1.

## 7. Reuse checklist (per CLAUDE.md code-reuse priority)

-   Backend: extend `getEntityByName` + `getEntitiesList`; reuse `createRecord`; new
    cover-template endpoints follow existing controller/service/repository structure.
-   Frontend: reuse `AutocompleteStyles`, `SelectFieldByApi`, `CommonSelect`, `ProgressWizard`,
    `useStepper`; do not introduce new dropdown components.

## 8. Decisions (resolved) & remaining input

Resolved:

1.  **`organization_id`:** Organisation dropdown in Step 2, reused from smart search (§5.4).
2.  **Step 2 hosting:** same flow — `ProgressWizard` hosts Step 1 → Step 2 as a stepper (§5/§9).
3.  **Policy-type source:** `POLICY_TYPE` lookup (§2.3).
4.  **Cover-name uniqueness:** reuse generic list filter, no new endpoint (§4.2).
5.  **`display_category` / `section_id`:** optional — include only if low-cost; otherwise
    defer. Not blocking.
6.  **`covers_meta.formConfig`:** shape locked from real samples; auto-generated (§6.2).

All decisions resolved — spec is build-ready.

## 9. Phased implementation plan

1.  **DB / entity:** confirm `mstr_cover.name` unique index; no entity field changes expected.
2.  **Backend Step 1:** register `cover` entity + label; add name-uniqueness validation.
3.  **Backend Step 2:** `GET /cover-template` and `POST /cover-template/sync` with copy logic.
4.  **Frontend Step 1:** "Covers" appears in entity dropdown; create-cover form with
    API-search name field, cover-type + input-type dropdowns.
5.  **Frontend Step 2:** two-pane mapping screen with organisation + policy-type + cover
    dropdowns, Add, side panel with unmap + per-row mandatory/sequence, Submit.
6.  **Wire the stepper:** `ProgressWizard` hosts Step 1 → Step 2 as a single flow (decided).
7.  **Tests:** service/repository specs mirroring existing `master.*.spec.ts`.

## 10. Frontend component architecture (decided)

**Integration:** `MasterView/index.tsx` keeps the "Select Entity" dropdown. When
`selectedEntity?.name === "cover"`, the body swaps from the generic filters + `ServerSideGrid`
to a dedicated `<CoverTemplateMap />`. All other entities are unchanged. Covers never uses
the generic `MasterForm` / `/master/cover/new` route.

**Stepper flow:** Free navigation — both steps always available; Step 2 works with existing
covers without forcing a Step-1 create.

**New tree** under `apps/ui/iwork/src/app/pages/MasterPage/CoverTemplateMap/`:

-   `index.tsx` — hosts `ProgressWizard` + `useStepper`; owns step state; renders steps.
-   `CreateCoverStep/index.tsx` — Step 1: cover name (debounced uniqueness via
    `masterList("cover")`), description, cover type (`SelectFieldByApi` ← `COVER_TYPE`),
    input type (`CommonSelect` ← Text/Text Area). Submits `POST /master/cover`.
-   `MapCoverStep/index.tsx` — Step 2 left pane: organisation dropdown (smart-search reuse),
    policy-type dropdown (`POLICY_TYPE`), searchable cover dropdown + **Add**.
-   `MapCoverStep/MappedCoversPanel.tsx` — Step 2 right pane: mapped covers with per-row
    `mandatory` + `display_sequence`, unmap action, **Submit** → `POST /cover-template/sync`.
-   `types.ts` — shared types.

Reuse only `@ui/ui-lib` primitives (`AutocompleteStyles`, `SelectFieldByApi`, `CommonSelect`,
`Button`, `ProgressWizard`, `useStepper`). No new primitives.
