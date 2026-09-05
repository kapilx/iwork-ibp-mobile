# Business Targets — Technical Specification

_Status: Draft · Owner: Karan · Last updated: 2026-08-18_

Grounded in the existing codebase. All new work **mirrors existing patterns**
(caution-deposit CRUD, Biz Done report/export). **No DB migration.**

## 1. Summary of changes

| Layer | Change | Mirror / reuse |
|---|---|---|
| Entity | none (reuse `BusinessTarget`) | `business-target.entity.ts` |
| Constants | add `BUSINESS_TARGET` to `UserBizdoneReportType` | `constants.ts:2448` |
| DTO | `upsert-business-target.dto.ts`, `business-target-report-query.dto.ts` | `create-caution-deposit.dto.ts`, `get-policy.dto.ts` |
| Controller | CRUD + list + 4 export endpoints | caution-deposit + `bizdone-report-excel/*` |
| Service | upsert/delete + report-list + `generateBusinessTargetExcel` | `enqueueReportExport`, `generateBizDoneExcelFromQuery` |
| Repository | upsert + join query (`business_target → employee → org_sbu/org_vertical`) | `policy.repository.ts:11598` |
| Frontend | Add/Edit screen + Report screen | `AddCompany/`, `BizDownReportEnhancedListing/` |
| Frontend consts | endpoint constants + `EXPORT_REPORT_TYPE.BUSINESS_TARGET` | `endPoints.ts`, `exportsSlice.ts` |
| Routes | `add-business-target`, `business-targets-report` | `report.route.tsx` |

## 2. Backend — `policy-service`

### 2.1 DTOs
`apps/services/policy-service/src/app/policy/dto/`

**`upsert-business-target.dto.ts`** — `class-validator` (mirror `create-caution-deposit.dto.ts`):
```ts
id?: number                      // presence → update, absence → upsert-by-key
userId: number                   @IsNumber
month: string                    @IsDateString   // 'YYYY-MM-01'
entityType: string               @IsIn(Object.values(BUSINESS_TARGET_ENTITY_TYPE))
kpi: string                      @IsIn(Object.values(POLICY_PERFORMANCE_FIELDS))
typeOfTarget: string             @IsIn(['AMOUNT','PERCENTAGE'])
valueOfTarget: number            @IsNumber @Min(0) + @Transform coercion
```
`@IsIn` against the shared enums is the BR-2 integrity control — do not skip.

**`business-target-report-query.dto.ts`** — mirror the relevant subset of
`GetPolicyListDto`: `page`, `limit`, `sbuId`, `verticalId` (CSV), `userId` (CSV),
`financialYear`, `month`/`from`/`to`, `entityType` (default `TOTAL_POLICY`),
`kpi` (default `BROKERAGE`), `columns`, `appliedFilters`.

### 2.2 Controller — `policy.controller.ts`
Mirror caution-deposit (create/update folded on `id`) and `bizdone-report-excel/*`:
```
POST   /policy/business-target                     upsertBusinessTarget(@Body dto, userid)
DELETE /policy/business-target/:id                 deleteBusinessTarget
GET    /policy/business-target-report-list         getBusinessTargetReportList(@Query dto)
GET    /policy/business-target-report/export       enqueue  → enqueueReportExport(...)
GET    /policy/business-target-report/exports      list tray
GET    /policy/business-target-report/export/:id   status poll
GET    /policy/business-target-report/export/:id/download   → { fileName, mimeType, buffer }
```
Every handler uses `@Res() res`, `req.headers.userid`, `createResponse`/`createErrorResponse`.
Apply the ACL guard already used on peer endpoints. Enforce scope via `ScopeService`
before any write (BR-4).

### 2.3 Service — `policy.service.ts`
- `upsertBusinessTarget(dto, userId)`: scope-check target owner, then repo upsert.
- `deleteBusinessTarget(id, userId)`: scope-check, hard delete.
- `getBusinessTargetReportList(dto, requesterId)`: resolve scoped user set via
  `ScopeService`, call repo join query, return `{ rows, total, page, limit }`.
- `generateBusinessTargetExcel(filters, uid)`: the **one** generator to write. Resolve
  scope, stream join rows, feed `policyReportExcelSheetGenerationBatch` with a single data
  sheet (SBU/Vertical/Team Member/Month/Target) + Applied Filters sheet. Register the type
  in `enqueueReportExport` switch keyed on `UserBizdoneReportType.BUSINESS_TARGET`.

The entire job framework (`report-export-job.util.ts`: enqueue/dedup/poll/S3/FileUpload)
is reused unchanged — only the generator function differs.

### 2.4 Repository — `policy.repository.ts`
- `upsertBusinessTarget(dto)`: `INSERT ... ON CONFLICT` is unavailable without a unique
  index on the tuple, so upsert = `findOne({userId, month, entityType, kpi, typeOfTarget})`
  → update `valueOfTarget`, else `save(new)`. _(ponytail: app-level upsert; add a partial
  unique index + `ON CONFLICT` only if concurrent double-writes become real.)_
- `getBusinessTargetReport(scopedUserIds, filters, paging)`: query builder from
  `business_target`, `innerJoin employee ON employee.user_id = businessTarget.userId`,
  `leftJoin employee.sbu`, `leftJoin employee.vertical`. `WHERE userId IN (scoped)`,
  `month BETWEEN`, `entityType = :et`, `kpi = :kpi`, optional `sbuId`/`verticalId IN`.
  `SELECT org_sbu.name, org_vertical.name, first+last name, month,
  SUM(value_of_target) GROUP BY sbu, vertical, user, month`. Paginate + `getCount`.

### 2.5 Module — `policy.module.ts`
`BusinessTarget` already registered (L94). Confirm `Employee`, `OrgSbu`, `OrgVertical` are
in `TypeOrmModule.forFeature`; add if missing.

## 3. Frontend — `apps/ui/iwork`

### 3.1 Constants
- `endPoints.ts`: add `businessTargetUpsert`, `businessTargetDelete`,
  `businessTargetReportList`, and 4 export endpoints (mirror `policyReportExcelExport*`).
- `exportsSlice.ts`: add `EXPORT_REPORT_TYPE.BUSINESS_TARGET`.

### 3.2 Add / Edit screen
`pages/Dashboard/BusinessTargets/AddEditTarget/` — mirror `CompanyPage/AddCompany/`:
config-driven `FormComponent` (`formConfig.ts` with `FormFieldConfig[]`). Fields: Team
Member (`SelectFieldByApi` → scoped users), Month picker, Entity Type / KPI / Type of
Target selects (options from enums), Target value number. Submit → `apiRequest` POST to
`businessTargetUpsert`. Edit route pre-loads a row by id.

### 3.3 Report screen
`pages/Dashboard/BusinessTargets/BusinessTargetReport/` — mirror
`BizDownReportEnhancedListing/`:
- `tableConfig.ts`: 5 columns (SBU, Vertical, Team Member, Month, Target) — copy the SBU
  (L97) / Vertical (L106) column shapes from Biz Done's `tableConfig.ts`.
- Data via `useApiQuery`/`apiRequest` → `businessTargetReportList`.
- Filters via `OrgFinancialFilter` + `FilterDrawer` (SBU, Vertical, Team Member, Month/FY,
  Entity Type, KPI), held in `react-hook-form`, sent as query params.
- Download via `useReportExports({ reportType: 'BUSINESS_TARGET', endpoints })` → tray +
  `saveBufferAsFile`. Reused verbatim.

### 3.4 Routes
`routes/report.route.tsx`: add `business-targets-report`; add the add/edit route where the
Dashboard sub-routes live.

## 4. Validation / tests (ponytail: one runnable check per non-trivial path)

- **DTO enum guard**: unit test that a bad `entityType` / negative `valueOfTarget` is
  rejected (protects BR-2).
- **Upsert idempotency**: repo test — saving the same tuple twice yields one row, updated
  value (protects BR-1).
- **Report join**: repo test — one target row resolves to correct SBU/Vertical/name.
- **Scope**: service test — out-of-scope userId write is rejected (BR-4).

## 5. Explicitly skipped (add when needed)

- No migration / new columns — reuse table. Add `deleted_at` only if audit-delete demanded.
- No approval workflow, no bulk upload, no new caching — dashboard read-path untouched.
- App-level upsert over DB `ON CONFLICT` until concurrency is a real problem.
