# Business Targets — Build Plan

_Status: Draft · Owner: Karan · Last updated: 2026-08-18_

Ordered so each phase is independently testable and the diff stays small. Backend
contract lands before any UI. **No migration.**

## Phase 0 — Confirm (blocks nothing but OQs)
- Resolve PRD OQ-1 (Target = SUM per entity_type+kpi) and OQ-2 (non-leadership access).
- Confirm delete is hard-delete (no `deleted_at`).

## Phase 1 — Backend write-path (CRUD)  [data + logic]
1. `constants.ts` — add `UserBizdoneReportType.BUSINESS_TARGET`.
2. DTO `upsert-business-target.dto.ts` (enum-guarded).
3. Repo `upsertBusinessTarget` (find-by-tuple → update/insert) + `deleteBusinessTarget`.
4. Service `upsertBusinessTarget` / `deleteBusinessTarget` with `ScopeService` check.
5. Controller `POST /policy/business-target`, `DELETE /policy/business-target/:id`.
6. Confirm `Employee`/`OrgSbu`/`OrgVertical` in `policy.module.ts` forFeature.
- **Verify**: DTO enum-reject test + upsert idempotency test. Manual: POST edits a seeded
  row, dashboard figure changes.

## Phase 2 — Backend report list  [logic]
1. DTO `business-target-report-query.dto.ts`.
2. Repo `getBusinessTargetReport` (join employee/org_sbu/org_vertical, group, paginate).
3. Service `getBusinessTargetReportList` (scope → repo).
4. Controller `GET /policy/business-target-report-list`.
- **Verify**: repo join test (one row → correct SBU/Vertical/name); scope test.

## Phase 3 — Backend export  [logic]
1. Service `generateBusinessTargetExcel(filters, uid)` → single data sheet + Applied
   Filters sheet via `policyReportExcelSheetGenerationBatch`.
2. Wire `UserBizdoneReportType.BUSINESS_TARGET` into `enqueueReportExport`.
3. Controller 4 export endpoints (enqueue / exports / status / download) mirroring
   `bizdone-report-excel/*`.
- **Verify**: enqueue → poll COMPLETED → download returns non-empty buffer matching filters.

## Phase 4 — Frontend Add/Edit  [ui]
1. `endPoints.ts`: `businessTargetUpsert`, `businessTargetDelete`.
2. `AddEditTarget/` screen (config-driven form, enums + scoped user select).
3. Route for add/edit; entry point (button) on the report screen.
- **Verify**: create + edit + delete round-trip against Phase 1 API.

## Phase 5 — Frontend Report  [ui]
1. `endPoints.ts`: report list + 4 export endpoints; `EXPORT_REPORT_TYPE.BUSINESS_TARGET`.
2. `BusinessTargetReport/` screen: `tableConfig` (5 cols), `useApiQuery` list, filter bar
   (`OrgFinancialFilter` + `FilterDrawer`), `useReportExports` download tray.
3. Route `business-targets-report`; nav entry.
- **Verify**: filters change rows; download yields Excel equal to filtered on-screen set.

## Phase 6 — Wrap
- Wire ACL/menu visibility (leadership-only per OQ-2).
- Smoke test end-to-end; update this folder's docs with any deviations.

## Agent split (if using /build-feature)
- **data-agent**: Phase 1.1–1.3 (constants, DTO, entity confirm).
- **logic-agent**: Phase 1.4–1.5, Phase 2, Phase 3 (service/controller/repo/export).
- **test-agent**: verification checks across Phases 1–3.
- **ui-agent**: Phase 4 + Phase 5.

## Sequencing note
Phases 1→2→3 are strictly ordered (report needs the join; export needs the list logic).
Phase 4 and 5 can run in parallel once Phase 1 (add/edit) and Phase 2–3 (report) APIs
exist respectively. Frontend must not start until the API contract (Phase 1–3) is merged
or stubbed.
