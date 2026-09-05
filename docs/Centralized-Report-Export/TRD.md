# Centralized Report Export — TRD

**Status:** Draft — Phase 1 (extract + prove on one new consumer)
**PRD:** [PRD.md](./PRD.md)

## 1. Overview

The BizDone Excel export already implements the exact mechanism this PRD asks for — async job queue, fire-and-forget trigger, safety-net cron, pre-signed-URL download, polling hook, Downloads tray. It lives entirely inside `policy-service` today, keyed to one `reportType` value (`BIZDONE`). The entity that backs it was explicitly designed for this moment:

```typescript
// libs/service-lib/src/lib/constants.ts:2364-2367
// Leaves room for other heavy exports to reuse the same table/worker later.
export enum UserBizdoneReportType {
  BIZDONE = "BIZDONE",
}
```

This TRD extracts the reusable 80% into a shared library, keeps report *generation* owned by whichever service produces that report, and adds the frontend generalization needed for a single cross-module Downloads tray. **No new tables.**

## 2. Scope

### In scope (Phase 1)
- Extract the generic job-queue/state-machine logic out of `policy.service.ts`/`policy.repository.ts` into a shared, reusable module in `service-lib`.
- Refactor the existing BizDone export onto the shared module with **no behavioral change** (regression-free by construction — same table, same columns, same endpoints).
- Extend `UserBizdoneReportType` with new values for SO/RO/Policy-list reports.
- Wire up **one** new consumer (recommend: SO page, per OQ-002 in the PRD — whichever already has a synchronous export query to reuse) end-to-end, to prove the abstraction before rolling to RO/Policy.
- Generalize `useReportExports` to accept a per-module endpoint adapter, and make the Downloads tray's Redux state module-agnostic (already close to this — see §6).

### Out of scope (Phase 1)
- RO and Policy-page wiring (Phase 2/3, once the SO proof-of-concept validates the shared runner).
- A unified single set of HTTP routes across services (each service keeps its own route prefix — see §7 for why).
- Retention/cleanup jobs for old rows/files (PRD OQ-001).

## 3. Current State (what's being extracted)

All of this lives in `apps/services/policy-service/src/app/policy/`:

| Piece | File:Line |
|---|---|
| Entity (`user_bizdone_report`) | `apps/services/service-lib/src/lib/entities/user-bizdone-report.entity.ts` |
| `reportType`/`status` enums | `apps/services/service-lib/src/lib/constants.ts:2357-2367` |
| Enqueue + dedup | `policy.repository.ts:1141` `createReportExportJob` |
| Atomic claim (by cron) | `policy.repository.ts:1212` `claimNextReportExportJob` |
| Atomic claim (by trigger-on-enqueue) | `policy.repository.ts:1237` `claimReportExportJob` |
| Stuck-job recovery | `policy.repository.ts` `recoverStuckReportExportJobs` (referenced by the scheduler) |
| Mark complete/failed | `policy.repository.ts:1249,1268` |
| List jobs for a user | `policy.repository.ts:1193` `listReportExportJobs` |
| Enqueue orchestration + fire-and-forget trigger | `policy.service.ts:9203` `enqueueReportExport`, `:9234` `triggerReportExportJob` |
| Generation + completion | `policy.service.ts:9512` `processReportExportJob` (the only piece with BizDone-specific content: the call to `generateBizDoneExcelFromQuery`) |
| Pre-signed URL re-minting | `policy.service.ts:9253` `toDownloadUrl` |
| Cron safety net | `report-export-job.scheduler.ts` (`@Cron("0 */2 * * * *")`) |
| Controller routes | `policy.controller.ts:1762,1786,1803` |
| Frontend hook | `apps/ui/ui-lib/src/lib/hooks/useReportExports.ts` |
| Frontend endpoint URLs | `apps/ui/ui-lib/src/lib/constants/endPoints.ts:831-836` |

Everything in this list except `processReportExportJob`'s one line (`generateBizDoneExcelFromQuery(...)`) is generic — none of it references anything BizDone-specific.

## 4. Data Model — no schema change

Extend the enum only:

```typescript
// libs/service-lib/src/lib/constants.ts
export enum UserBizdoneReportType {
  BIZDONE = "BIZDONE",
  SALES_OPPORTUNITY_LIST = "SALES_OPPORTUNITY_LIST",   // naming per PRD OQ-003
  RENEWAL_OPPORTUNITY_LIST = "RENEWAL_OPPORTUNITY_LIST",
  POLICY_LIST = "POLICY_LIST",
}
```

Column is already `varchar(30)` (`user-bizdone-report.entity.ts:26-31`) — values above fit without a migration. The table/entity name (`user_bizdone_report`) stays as-is; renaming it is a purely cosmetic follow-up with no functional benefit, and would touch every reference in policy-service for no behavioral gain — not worth doing in Phase 1.

## 5. Shared Runner — new module in service-lib

New file: `apps/services/service-lib/src/lib/utils/report-export-job.util.ts` (name TBD to avoid clashing with the existing scheduler filename). Exposes a small factory, not a NestJS-injectable class, so each service wires it with its own TypeORM `DataSource`/repos:

```typescript
interface ReportExportJobRunnerConfig<TFilters = Record<string, unknown>> {
  reportType: UserBizdoneReportType;
  dataSource: DataSource;
  generate: (filters: TFilters, userId: number) => Promise<string>; // returns S3 file key
  createFileUploadRecord: (args: {...}) => Promise<FileUpload>; // each service's own file-registry call
}

function createReportExportJobRunner(config: ReportExportJobRunnerConfig) {
  return {
    enqueue(userId, filtersApplied): Promise<{ jobId: number; status: string; alreadyInProgress: boolean }>,
    triggerIfPending(jobId): Promise<void>,          // fire-and-forget path
    claimNext(): Promise<UserBizdoneReport | null>,   // for the owning module's cron
    recoverStuck(): Promise<number>,
    process(job): Promise<void>,                      // calls config.generate(), marks complete/failed
    getStatus(jobId, userId): Promise<{...}>,
    listForUser(userId, limit?): Promise<UserBizdoneReport[]>,
  };
}
```

This is a direct lift of the current `policy.repository.ts`/`policy.service.ts` methods, parameterized by `reportType` and `generate`. `toDownloadUrl`'s re-signing logic moves in unchanged.

**Why a factory, not a shared NestJS provider**: `policy-service` and `opportunity-service` are separately deployed apps with their own DI containers and DB connections (same physical Postgres database, but not the same running process or module graph). A factory function that each service's own module instantiates — passing in that service's own `DataSource` and generator — avoids needing a shared NestJS module registered across service boundaries, which `service-lib` (a plain shared library, not a service) isn't set up for today.

## 6. Per-Module Thin Layer — stays decentralized

Each owning service keeps:
- Its own 3 routes, under its own existing controller (e.g. `opportunity.controller.ts` gets `GET /opportunity/so-report-excel/export`, `/export/:jobId`, `/exports`), each just calling the shared runner instance.
- Its own `@Cron` scheduler class (mirrors `ReportExportJobScheduler`, ~80 lines today, becomes ~30 once the claim/recover logic moves into the shared runner).
- Its own `generate` callback, wrapping whatever repository method already builds that module's report (per PRD OQ-002 — reuse the existing sync-export query if one exists, don't write a new one).

**Listing is the one exception** (per PRD BR-CRE-003): since every job row lives in the same table regardless of which service enqueued it, `GET .../exports` for the unified Downloads tray can be served by **any one** service that already has a runner instance pointed at the shared table — no need to fan out to multiple services and merge. Recommendation: keep it on policy-service (where it already lives) as the single source for the "list all my jobs" call, and have SO/RO's own `/export`+`/export/:jobId` routes handle only enqueue+status for jobs of their own `reportType`.

## 7. Why not one central "reports service"

Considered and rejected for Phase 1: a single service owning all `generate()` implementations would need to import opportunity-service's and policy-service's internal repositories, creating exactly the kind of cross-service coupling this monorepo already suffers from in other areas. The existing precedent — `report-export-job.scheduler.ts` living inside policy-service rather than the shared `scheduler-service` app — was a deliberate choice for the same reason (see its own file comment) and this TRD follows it.

## 8. Frontend Changes

| File | Change |
|---|---|
| `apps/ui/ui-lib/src/lib/hooks/useReportExports.ts` | `enqueueExport`/`pollInFlight`/`refreshExports` currently hardcode `endPoints.policyReportExcelExport*`. Add an `endpoints` param (or a `module` key resolved via a small registry) so SO/RO pages can point the same hook at their own routes while `refreshExports`/the tray keep pointing at the one shared list endpoint (§6). |
| `apps/ui/ui-lib/src/lib/constants/endPoints.ts:831-836` | Add SO/RO endpoint builders alongside the existing policy ones, same naming pattern. |
| `apps/ui/ui-lib/src/lib/redux/exportsSlice.ts` | Already module-agnostic (`ExportJob` has no BizDone-specific fields) — no change expected, confirm during implementation. |
| SO page | New "Generate Report" button wired to `useReportExports({ ... })` with SO's filters, mirroring however the BizDone trigger is wired today. |

## 9. Migration / Rollout

1. **Extract, no behavior change**: move the generic methods into the shared runner; `policy.service.ts`/`policy.repository.ts` call through it for `BIZDONE`. Verify existing BizDone export still works identically (same routes, same responses) — this step is pure refactor risk, not new-feature risk.
2. **Add enum values**, wire up SO end-to-end (routes, cron, generator, frontend hook usage) as the second consumer — this is what actually proves the abstraction holds for a module outside policy-service.
3. **Generalize the frontend hook + confirm the unified Downloads tray** shows both BizDone and SO jobs together.
4. **Roll out RO and Policy** once step 2/3 are validated in production.

## 10. Known Limitations / Risks

- **No retention policy** (PRD OQ-001) — job rows and S3 files accumulate indefinitely today; this TRD doesn't change that, just spreads the same unbounded growth across more report types. Worth addressing before wide rollout, not blocking for the SO proof-of-concept.
- **`generate()` reuse depends on PRD OQ-002's answer** — if SO/RO don't already have a synchronous export query to replay, the generator itself is net-new work outside this TRD's estimate.
- **Enum values are a shared, cross-service contract** — once `SALES_OPPORTUNITY_LIST` etc. exist in `service-lib`'s constants, both opportunity-service and policy-service (and anything reading job rows generically, e.g. an admin view) depend on that exact string; changing it later requires a coordinated deploy, not a single-service change.
