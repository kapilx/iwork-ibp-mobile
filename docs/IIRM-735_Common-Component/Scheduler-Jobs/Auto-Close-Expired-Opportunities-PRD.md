# Auto-Close Expired Opportunities — Module PRD

**Module:** EXPCLOSE · Auto-Close Expired Opportunities
**Product:** iWork — IIRM Insurance CRM
**Stage:** 40a · Product Requirements
**Mode:** Reverse-engineered from production code
**Last updated:** 2026-07-27
**Author:** Daksh · Nithin Sirigiri

---

## 1. Why This Module Exists

Every Opportunity in iWork carries an expiry date, but nothing in the day-to-day UI forces anyone to look at one the day after it expires. This module is the nightly scheduler job that does that looking, automatically. `handleExpiredOpportunities` (`scheduler_key = HANDLE_EXPIRED_OPPORTUNITIES`) sweeps every non-Won, non-Lost opportunity past its expiry date, closes the ones that never progressed past the Placement Slip stage immediately, and gives the ones that reached Placement Slip a short grace window before closing them too — and, critically, opens a fresh Sales Opportunity referencing the one it just closed, so the account is never simply dropped. This job is currently switched **off** in production pending business and CTO sign-off — this document exists to give that sign-off something precise to review. It has a sibling job, **Auto-Create Renewal Opportunities** (covered in its own PRD, `Auto-Create-Renewal-Opportunities-PRD.md`), which runs the same night looking the other direction — from policies toward renewals rather than from opportunities toward closure — and shares this job's scheduling architecture but is otherwise independent; it is not covered here except where the two share infrastructure. By the end of this document, the reader will know exactly which opportunities this job touches, what it creates in their place and how that new record is valued, and a scheduling-architecture finding that changes what "disabling this job" actually means operationally.

---

## 2. Scope

### In scope

- The `handleExpiredOpportunities` method (`scheduler_key = HANDLE_EXPIRED_OPPORTUNITIES`), its two Lost-detection queries (instant vs. grace-period), and the `POST /opportunity/opportunity-lost` call it makes per matched opportunity.
- The continuity Sales Opportunity that `createOpportunityLost` creates as a direct, unconditional consequence of marking an opportunity Lost — including the seeded activity map on that new opportunity.
- The dual-trigger scheduling architecture (`@Cron` decorator vs. `DynamicCronService`) as it applies specifically to this job's `scheduler_key`.

### Out of scope (deferred)

- **Auto-Create Renewal Opportunities** (`scheduler_key = HANDLE_POLICIES_CLOSE_TO_EXPIRY`) — this job's sibling; covered in its own PRD, `Auto-Create-Renewal-Opportunities-PRD.md`.
- The Application Scheduler / Scheduler Management admin screen and its `cron-configurations` API — an existing, separately built system; referenced here only as the operational control surface this job is (partially) subject to.
- The other four scheduler methods in the same file — `handlePoliciesCloseToExpiry`, `handleOpportunityActivitiesCloseToExpiry`, `handleOpportunitiesCloseToExpiry`, `generatePerformanceOutputForAllUsers`, `refreshCompanyAnalytics` — adjacent jobs sharing the same file (and, for two of them, the same dual-trigger risk), but not otherwise designed here.
- The generic `createOpportunity` / `createStageActivityMap` creation pipeline itself, and manual (human-initiated) opportunity creation — shared infrastructure, not redesigned here.
- The Application Scheduler admin screen's own permission model — noted as a gap in Open Questions, not designed here.

---

## 3. User Personas

| Persona | Role in this module |
|---|---|
| BD Executive / Sales Opportunity owner | Owns the opportunities this job evaluates and closes; inherits the auto-created continuity Sales Opportunity |
| System (the scheduler itself) | The actual actor executing this job nightly — no human triggers a run under normal operation |
| CTO / CIO / Admin | Decides, via ENV feature flags, whether this job runs in a given environment at all; sets the grace-period value |
| Central OPS / Admin (Application Scheduler screen) | Operates the visible admin toggle for this job, believing it fully controls execution — per Section 5.3, that belief is only partially correct |

---

## 4. User Stories

Each story traces to a specific behavior observed in the codebase — there is no BRD for this module; traceability is to the Business Rules and citations in Section 5, not to a UC/FR pair.

### 4.1 Nightly Detection & Closure

**US-EXPCLOSE-001**
As the System, I want to nightly evaluate every non-Won, non-Lost opportunity against its expiry date so that stale opportunities don't linger indefinitely in the active pipeline.

**US-EXPCLOSE-002**
As the System, I want to mark an opportunity Lost immediately once its expiry date passes if the Placement Slip stage was never completed, so that deals that never progressed are closed without delay.

**US-EXPCLOSE-003**
As the System, I want to apply a configurable grace period beyond expiry before marking an opportunity Lost when Placement Slip is done but Premium Calculation is not, so that opportunities further along the pipeline get a short buffer before being closed.

**US-EXPCLOSE-004**
As a CTO/CIO/Admin, I want the grace period to be configurable via environment variable rather than hardcoded, so that the business can tune how much slack in-progress deals get before being marked Lost.

### 4.2 Continuity Sales Opportunity

**US-EXPCLOSE-005**
As the System, I want to automatically open a new Sales Opportunity referencing the one I just closed, with its own fresh one-year expiry, so that the account isn't dropped and BD/Sales retains a live opportunity to keep pursuing it.

**US-EXPCLOSE-006**
As a BD Executive / Sales Opportunity owner, I want the newly created continuity Sales Opportunity to carry the same risk locations and contacts as the expired opportunity, so that I don't have to re-enter known account information.

---

## 5. Business Rules

### 5.1 Expiry Detection & Grace Period

**BR-EXPCLOSE-001**
This job is gated by `ENV.HANDLE_EXPIRED_OPPORTUNITY_CRON`; unless this env var is the exact string `"true"`, `handleExpiredOpportunities` returns immediately and evaluates nothing (opportunity-status.scheduler.ts:220-222).

**BR-EXPCLOSE-002**
Before any opportunity is evaluated, the job resolves the `OPPORTUNITY_STATUS_LOST` and `OPPORTUNITY_STATUS_WON` lookups from the `OPPORTUNITY_STATUS` lookup group; if the group is empty or either specific key is missing, the entire run aborts (logs an error and returns) without touching any opportunity (opportunity-status.scheduler.ts:224-261).

**BR-EXPCLOSE-003**
The grace period, in days, is computed as `Math.max(Number.parseInt(ENV.OPPORTUNITY_LOST_GRACE_PERIOD_DAYS ?? "0", 10) || 0, 0)` — an unset, non-numeric, or negative configured value all resolve to a 0-day grace period (opportunity-status.scheduler.ts:264-270).

**BR-EXPCLOSE-004**
"Instant Lost": an opportunity with `expiry_date < now`, whose `status_lid` is `NULL` or not Lost, whose `status_lid` is not Won, and for which no `opportunity_activity_map` row exists with `opportunity_table` = the Placement Slip activity key (`opportunity_placement_slip_generation`) and a non-null `completed_at`, is marked Lost with no grace period (opportunity-status.scheduler.ts:277-300).

**BR-EXPCLOSE-005**
"Grace-Period Lost": an opportunity with `expiry_date` more than the grace-period number of days in the past, whose `status_lid` is not Lost and not Won, for which a completed Placement Slip activity row EXISTS but a completed Premium Calculation activity row (`opportunity_premium_calculation`) does NOT, is only marked Lost once expiry date + grace period has passed (opportunity-status.scheduler.ts:304-338).

**BR-EXPCLOSE-006**
Opportunities already Won, already Lost, or that have completed both Placement Slip and Premium Calculation, satisfy neither Query A's nor Query B's WHERE conditions and are therefore left untouched by this job (opportunity-status.scheduler.ts:277-338).

### 5.2 Continuity via New Sales Opportunity

**BR-EXPCLOSE-007**
Each matched opportunity is closed via its own `POST {URL_OPPORTUNITY_SERVICE}/opportunity/opportunity-lost` call (`statusLid` = Lost, `injectedBy` = `"SYSTEM"`), wrapped in its own try/catch; a failure on one opportunity is logged (with `group` = `instant-lost` or `grace-period-lost`, plus the `opportunityId`) and does not stop the loop from attempting the remaining opportunities in either batch (opportunity-status.scheduler.ts:396-459).

**BR-EXPCLOSE-008**
Inside `createOpportunityLost`, immediately after creating the `opportunity_lost` record and firing the `OPPORTUNITY_LOST` notification, the service unconditionally calls `this.createRenewalOpportunity(opportunity, SALES_OPPORTUNITY)` — every successful Lost-closure creates a new Sales Opportunity, with no branch that skips this (opportunity.service.ts:8144-8152).

**BR-EXPCLOSE-009**
For this SO-continuity path (`opportunityId` present on the input), `createRenewalOpportunity` copies risk locations and contacts from the original (now-Lost) opportunity's own `opportunity_risk_locations` / `opportunity_contact_map` rows, and sets the new SO's `refOpportunityId` to the id of the opportunity just marked Lost (opportunity.service.ts:8174-8189).

**BR-EXPCLOSE-010**
The new SO's `expiryDate` is always forced to `now + ONE_YEAR_IN_DAYS` (365 days), computed fresh at creation time in `YYYY-MM-DD` format — it is never copied from the expired opportunity's own expiry date (opportunity.service.ts:8232-8240).

**BR-EXPCLOSE-011**
The new SO, like every opportunity created through the shared `createOpportunity` method, automatically receives a full set of `OpportunityActivityMap` stage/activity rows seeded from `mstr_stage_activity_template` for its `policyTypeLid`, each initialized to `OPEN` status — the identical mechanism used for manually-created opportunities, gated only on `if (opportunity)`, with no special-case skip for system-injected records (opportunity.service.ts:1645-1656).

### 5.3 Scheduling & Execution Control

**BR-EXPCLOSE-012**
This job is registered twice, through two independent mechanisms that write into the same NestJS `SchedulerRegistry`: (a) a hardcoded `@Cron("30 21 * * *")` decorator directly on `handleExpiredOpportunities`, and (b) a DB-driven registration performed by `DynamicCronService.loadCronJobs()`, which reads the `application_scheduler_configuration` row keyed by `scheduler_key = HANDLE_EXPIRED_OPPORTUNITIES` during `onModuleInit` (opportunity-status.scheduler.ts:207-208,93-131).

**BR-EXPCLOSE-013**
Because the `@Cron(...)` call site does not pass a `name` option, `@nestjs/schedule`'s `SchedulerOrchestrator.addCron` assigns the decorator-based job a random `crypto.randomUUID()` registry key, regenerated fresh on every application boot. This key can never collide with, and is never discoverable via, the literal `scheduler_key` string (`HANDLE_EXPIRED_OPPORTUNITIES`) the Application Scheduler admin UI and `DynamicCronService` operate on (node_modules/@nestjs/schedule/dist/scheduler.orchestrator.js:89-95).

**BR-EXPCLOSE-014**
Consequently, disabling this job via the Application Scheduler admin screen (`PUT /cron-configurations/:id` with `isEnabled=false`, which calls `DynamicCronService.stopCron("HANDLE_EXPIRED_OPPORTUNITIES")`) only stops the `DynamicCronService`-registered entry; the `@Cron`-decorated entry keeps firing daily at `30 21 * * *` UTC regardless of the admin UI's Enabled/Disabled state, because `stopCron` can only look up the registry by the literal `scheduler_key`, not by the decorator's random UUID (apps/services/scheduler-service/src/app/cron-configuration/dynamic-cron.service.ts:69-77,193-205).

**BR-EXPCLOSE-015**
Only the `DynamicCronService`-triggered execution path writes to `application_scheduler_configuration.last_run_status`/`last_successful_run_at`/`last_failed_run_at` and to `scheduler_audit_log`, via `CronConfigurationRepository.updateExecutionStatus`/`createAuditLog`; the `@Cron`-decorated path's outcome is visible only in application logs, inside `@nestjs/schedule`'s own generic try/catch that has no repository or audit-log call at all (apps/services/scheduler-service/src/app/cron-configuration/cron-configuration.repository.ts:101-134; node_modules/@nestjs/schedule/dist/schedule.explorer.js:116-125).

**BR-EXPCLOSE-016**
The `cron-configurations` admin API (`GET /cron-configurations`, `GET /cron-configurations/:id`, `PUT /cron-configurations/:id`) — the endpoint that controls this job's admin-visible on/off state — has no `@UseGuards` or role check on the controller or any of its three routes; an unauthenticated `PUT` request does not get rejected — it falls back to `const userId = (req as any).user?.userId || 1`, silently attributing the configuration change to `userId = 1` (apps/services/scheduler-service/src/app/cron-configuration/cron-configuration.controller.ts:22,97-105).

---

## 6. Acceptance Criteria

### 6.1 Nightly Detection & Closure

**AC-EXPCLOSE-001** — Feature flag disabled
Given `ENV.HANDLE_EXPIRED_OPPORTUNITY_CRON` is not exactly `"true"`,
When the nightly `@Cron("30 21 * * *")` fires,
Then `handleExpiredOpportunities` returns immediately and no opportunity is evaluated or modified.

**AC-EXPCLOSE-002** — Instant Lost
Given an opportunity with `expiry_date` in the past, `status_lid` not Won and not Lost, and no completed Placement Slip activity,
When the job runs,
Then:
- the opportunity is included in the "instant lost" result set,
- a `POST /opportunity/opportunity-lost` call is made for it with `statusLid` = Lost and `injectedBy` = `"SYSTEM"`.

**AC-EXPCLOSE-003** — Grace-period Lost
Given an opportunity with `expiry_date` more than the configured grace-period number of days in the past, `status_lid` not Won and not Lost, Placement Slip completed, Premium Calculation not completed,
When the job runs,
Then:
- the opportunity is included in the "grace period lost" result set and the same opportunity-lost API call is made for it,
- an opportunity meeting the same stage criteria but whose expiry date is in the past by *fewer* days than the grace period is NOT yet included in this run.

**AC-EXPCLOSE-004** — Untouched opportunities
Given an opportunity that is already Won, already Lost, or has completed both Placement Slip and Premium Calculation,
When the job's two queries run,
Then that opportunity appears in neither the instant-lost nor grace-period-lost result sets and is not modified in any way.

### 6.2 Continuity Sales Opportunity

**AC-EXPCLOSE-005** — Continuity SO created on Lost
Given an opportunity is successfully marked Lost via the opportunity-lost API,
When `createOpportunityLost`'s transaction completes,
Then a new Sales Opportunity is created with:
- `refOpportunityId` = the id of the opportunity just marked Lost,
- risk locations and contacts copied from the lost opportunity,
- `expiryDate` = today + 365 days,
- a full `OpportunityActivityMap` stage/activity set seeded for its `policyTypeLid`, all rows `OPEN`.

**AC-EXPCLOSE-006** — Per-item isolation
Given the opportunity-lost API call fails for one opportunity in either the instant-lost or grace-period-lost batch,
When the failure occurs,
Then the error is logged with the `opportunityId` and its group (`instant-lost` or `grace-period-lost`), and the loop continues to the next opportunity in the batch without aborting the run.

### 6.3 Scheduling & Execution Control

**AC-EXPCLOSE-007** — Admin-disable does not stop the decorator-triggered run
Given an Admin sets `isEnabled = false` for `scheduler_key = HANDLE_EXPIRED_OPPORTUNITIES` via the Application Scheduler admin screen,
When the nightly hardcoded `@Cron("30 21 * * *")` fires,
Then `handleExpiredOpportunities` still executes in full — the `DynamicCronService`-registered entry is stopped, but the decorator-registered entry (keyed by a random UUID) is unaffected — and no `application_scheduler_configuration`/`scheduler_audit_log` row reflects this run.

---

## 7. Data Contract

### 7.1 Inputs (consumed by this module)

| Source | Data |
|---|---|
| `opportunity` | `status_lid`, `expiry_date` — source rows for both Lost-detection queries |
| `opportunity_activity_map` | `opportunity_table`, `completed_at` on Placement Slip / Premium Calculation activity rows — determines instant-lost vs. grace-period-lost |
| `look_up` | `OPPORTUNITY_STATUS_LOST`/`WON` — resolved once per run before any query executes |
| ENV vars | `HANDLE_EXPIRED_OPPORTUNITY_CRON`, `OPPORTUNITY_LOST_GRACE_PERIOD_DAYS`, `SCHEDULER_LOGIN_USERNAME`/`PASSWORD`, `URL_OPPORTUNITY_SERVICE` — gate and configure this job |
| `application_scheduler_configuration` | Row keyed `scheduler_key = HANDLE_EXPIRED_OPPORTUNITIES` — the DB-driven half of the dual-trigger schedule |

### 7.2 Outputs (produced / written by this module)

| Consumer | What it uses |
|---|---|
| **Opportunity** table | This job writes `status_lid` = Lost on matched rows and creates a new SO row per closure |
| **opportunity_lost** | One row created per closed opportunity (`reasonForLossLid`, `remarks`, `injectedBy` = `SYSTEM`) |
| **opportunity_activity_map** | The new continuity SO gets a full seeded stage/activity template set via `createStageActivityMap` |
| **Notification service** | The opportunity-lost flow fires an `OPPORTUNITY_LOST` notification (in-app + email) |
| **scheduler_audit_log** / `application_scheduler_configuration.last_run_status` | Only the `DynamicCronService`-triggered runs write here — the decorator-triggered runs of the same method do not (Section 5.3) |
| **My Companies listing** (SO premium rollup) | Every SO this job creates feeds directly into the company listing's `soPremium`/`salesOpportunityCount` aggregates |

### 7.3 Cross-module contract items for stage 40b

- Exact retry/idempotency semantics when an `opportunity-lost` API call throws mid-batch — today it is logged and skipped, with no retry and no dead-letter queue.
- Exact resolution plan for the dual-trigger scheduling risk (BR-EXPCLOSE-012 through 015) — whether to add an explicit `{ name: schedulerKey }` option to the `@Cron(...)` call, remove the decorator entirely in favor of `DynamicCronService`, or another approach. This same fix is needed for the sibling Auto-Create Renewal Opportunities job — a single unified fix across both, not two independent ones, is strongly implied.
- Exact, per-environment (dev/staging/prod) source of truth for `OPPORTUNITY_LOST_GRACE_PERIOD_DAYS` and `HANDLE_EXPIRED_OPPORTUNITY_CRON` — not resolvable from code, needs AWS/deploy-config confirmation.
- Whether/how the `cron-configurations` admin API should be secured (currently no guard on any of its three routes; an unauthenticated `PUT` attributes the change to `userId = 1`).

---

## 8. Downstream Impact Summary

Because this job is currently switched off, none of the effects below happen today. The moment it is switched on, these effects begin happening automatically, nightly, without a human touching individual opportunities — which is exactly why the scheduling question in Section 9 needs to be closed out before sign-off.

Enabling this job directly changes Opportunity pipeline reporting: any report that counts "open" opportunities by expiry date will start losing rows to Lost status every night, and a corresponding new-SO row appears for each one — so pipeline headcount does not shrink, it re-labels and re-dates itself. Because every auto-created SO also gets a seeded `OpportunityActivityMap`, BD Executives will see new opportunities appear in their queues with a full stage/activity checklist already attached, exactly as if they had created it manually. This feeds the **My Companies** module's company-level rollups directly: per that module's own Data Contract, the company listing's SO Premium cell aggregates `soPremium`/`salesOpportunityCount` per company — every SO this job creates increases those numbers for the owning company without any manual action.

The adjacent notification jobs in the same file — `handleOpportunityActivitiesCloseToExpiry` and `handleOpportunitiesCloseToExpiry` — are not part of this module's scope, but share the identical dual-trigger scheduling risk described in Section 5.3 (both are also plain `@Cron`-decorated methods keyed in `OPPORTUNITY_STATUS_KEYS`), so any operational fix applied to this job's scheduling architecture should be evaluated against these two as well — and against the sibling Auto-Create Renewal Opportunities job, which has the identical issue.

| Downstream area | Impact once enabled |
|---|---|
| Opportunity pipeline reporting | Expired, under-progressed opportunities disappear from "open" counts nightly; each is replaced by a new SO |
| BD Executive workload | New SO backlog to work (continuity opportunities), pre-seeded with activities |
| My Companies SO premium rollup | Company-level SO premium/count increases per new SO created |
| Application Scheduler admin visibility | Only the DB-cron half of each run is auditable; the decorator half runs invisibly (Section 5.3) |

---

## 9. Open Questions

| # | Question | Owner | Impact |
|---|---|---|---|
| OQ-01 | Confirmed in code: does disabling this job via the Application Scheduler admin screen actually stop all execution, or only the DB-driven trigger? Per BR-EXPCLOSE-012 to 015, the hardcoded `@Cron` decorator keeps firing daily regardless of the admin UI's Enabled/Disabled toggle, with zero audit trail for that path. | Tech Lead / CTO | Changes what "toggle off in production" actually guarantees — currently it does not guarantee the job stops running |
| OQ-02 | What are the currently deployed values, per environment (dev/staging/prod), of `HANDLE_EXPIRED_OPPORTUNITY_CRON` and `OPPORTUNITY_LOST_GRACE_PERIOD_DAYS`? Not visible in code — needs AWS/deploy-config confirmation. | Tech / DevOps | Determines actual current behavior per environment, not just intended behavior |
| OQ-03 | Does `application_scheduler_configuration` currently have a row for `scheduler_key = HANDLE_EXPIRED_OPPORTUNITIES`, and what are its current `is_enabled` and `scheduler_expression` values? Needs a DB query or a check of the admin screen. | Tech | Confirms whether the DB-driven half of the dual trigger is even configured today |
| OQ-04 | Does `scheduler-service` run multiple replicas/pods in production? If so, and the dual-trigger issue is confirmed (it is, per Section 5.3), actual execution multiplicity per night could be higher than 2x. | Tech / DevOps | Determines real-world blast radius of the dual-trigger finding |
| OQ-05 | Confirmed implemented: the new continuity SO gets a full `OpportunityActivityMap` seeded (BR-EXPCLOSE-011). Within that seeding, `ownerId` on a seeded activity row is only set when `stage.refRoleKey = ROLE_BD_EXECUTIVE`; otherwise it is `NULL`. Is that acceptable for system-injected (`injectedBy = "SYSTEM"`) opportunities, or does the business expect a specific fallback owner (e.g., the original opportunity's owner) for activities that would otherwise go unowned? | Product | Determines whether the auto-created SO's activities are actionable by anyone on day one |
| OQ-06 | In `createOpportunityLost`, any error — including the `NotFoundException` thrown when the target opportunity doesn't exist — is caught and re-wrapped as a `BadRequestException`. Does "opportunity not found" on this endpoint currently surface as HTTP 400 rather than 404 to callers, and is that acceptable, or should the `NotFoundException` pass through unwrapped (as it does in the sibling `updateOpportunityLost` method)? | Tech Lead | Affects error-handling contract for any caller of `/opportunity/opportunity-lost`, including this job itself |
| OQ-07 | The `cron-configurations` admin API has no `@UseGuards`/role check on any of its three routes, and an unauthenticated `PUT` is silently attributed to `userId = 1` rather than rejected. Is a gateway-level guard assumed to sit in front of this service, and has that assumption been verified against the actual production network/API-gateway topology? | Tech Lead / Security | Determines who can actually flip this job on/off in production today |

---

## 10. Approval

*To be completed by the client after review.*

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```
