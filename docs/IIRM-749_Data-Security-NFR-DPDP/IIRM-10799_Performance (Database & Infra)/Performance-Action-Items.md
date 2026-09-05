Date: 24-July-2026
Topic: Discussion for Demo Env. Setup
Participants: Gopal, Rama, Tharun, Nithin

List of items to be taken care:
--------------------------------
1. In Pre-PROD, Stop all the Job; Make sure emails & SMS are working as expected.
2. In Pre-PROD, Record the application/Infrastruction/DevOps situation when application is in Zero state
3. SCS - Notifications - Check what is the configuration. (Scenario: For the very first time Email or SMS is taking time then rest are instant)
4. Database Vaccum - Schedule a periodic acitvity in all the env.
5. Database - Partitioning
6. Database - Indexing
7. Database - SQL Functions for all the reports
8. Infra - Season based bumping (Example: When policies are expiring, need to bump the infra/DB because load will be more). Identify the data and plan this acitivity.
9. Optimal allocate the memory/infra size based on the service operational usage rather than generic size for all
10. Service Split
    1.  Start with Risk Watch because it should run on it own and NOT impact other iWork or IBP services
    2.  Identify service areas because either iWork or IBP utilization should not impact other services
11. Health Check
    1.  Identify the key areas of the IBP Portal for health check
    2.  Set the thresholds
    3.  Any deviations, then send alerts
12. Production Database - Perform validation & clean-up acitivites
13. BizDone & Dashboard - Performance & fine tuning
    1.  Query optimization

---

## Action Plan

This is the parent/whole plan for all 13 items above. Items that are ops/config work are actioned directly below. Items that require an engineering design decision get their own TRD in this same folder — reviewed and approved by TL/PTL before any build starts — and are only referenced here.

| # | Item | Type | Owner | Reference |
|---|---|---|---|---|
| 1 | Pre-PROD: stop jobs, verify email/SMS | Direct | DevOps + Backend | [§1](#1-pre-prod-stop-all-jobs-verify-email--sms) |
| 2 | Pre-PROD: record zero-state baseline | Direct | DevOps | [§2](#2-pre-prod-record-the-zero-state-baseline) |
| 3 | SCS/Notification first-call latency | Direct (investigation) | Backend — `notification-service` | [§3](#3-scs--notifications-first-call-latency) |
| 4 | Database Vacuum — scheduled activity | Direct | DBA + DevOps | [§4](#4-database-vacuum--scheduled-activity) |
| 5 | Database Partitioning | **TRD** | Backend + DBA | [DB-Partitioning-Indexing-TRD.md](./DB-Partitioning-Indexing-TRD.md) |
| 6 | Database Indexing | **TRD** | Backend + DBA | same file as #5 — [DB-Partitioning-Indexing-TRD.md](./DB-Partitioning-Indexing-TRD.md) |
| 7 | SQL Functions for all reports | **TRD** | Backend | [SQL-Functions-Reports-TRD.md](./SQL-Functions-Reports-TRD.md) |
| 8 | Infra — season-based bumping | **TRD** | DevOps/Infra | [Infra-Capacity-Planning-TRD.md](./Infra-Capacity-Planning-TRD.md) |
| 9 | Optimal memory/infra allocation per service | **TRD** | DevOps/Infra | same file as #8 — [Infra-Capacity-Planning-TRD.md](./Infra-Capacity-Planning-TRD.md) |
| 10 | Service Split (Risk Watch first) | **TRD** | Backend architecture | [Service-Split-TRD.md](./Service-Split-TRD.md) |
| 11 | Health Check | **TRD** | Backend + DevOps | [Health-Check-TRD.md](./Health-Check-TRD.md) |
| 12 | Production DB — validation & clean-up | Direct | DBA | [§12](#12-production-database--validation--clean-up) |
| 13 | BizDone & Dashboard — performance | **TRD** | Backend — `policy-service` | [BizDone-Dashboard-Performance-TRD.md](./BizDone-Dashboard-Performance-TRD.md) |

Current state grounding all of the above (verified against the actual codebase, not assumed): Postgres is the engine everywhere, reached via three separate databases (shared core DB used by nearly every NestJS service, a separate `config-service` DB config, and a separate analytics DB for `ai-utility-service`), plus Strapi's own DB. There is no partitioning, no autovacuum tuning, no message queue, and no Kubernetes manifests/Terraform in this repo — deployments are `kubectl set image` against pre-existing Deployments via Jenkins, on a single generic `Dockerfile-all` image for every service. "iWork" and "IBP" are frontend-only branding (`apps/ui/iwork`, `apps/ui/ibp` under one Module Federation shell) — the backend is fully shared across both products today, with `ibp-service` carrying most but not all IBP-specific logic.

### 1. Pre-PROD: Stop all jobs; verify email & SMS

Two job mechanisms exist in `scheduler-service` and both must be stopped: static `@Cron(...)` decorators (e.g. `enrollment-upload.scheduler.ts`, `opportunity-status.scheduler.ts`) and the DB-driven `DynamicCronService`, which loads every row from the `application_scheduler_configuration` table (`is_enabled` flag) and schedules it at runtime.

1. In Pre-PROD, set `is_enabled = false` for every row in `application_scheduler_configuration` (covers all dynamic jobs — TPA sync, enrollment upload, hospital sync, etc.) rather than touching code.
2. For the remaining static `@Cron` schedulers not yet migrated to the dynamic pattern, disable via environment/deploy config for the Pre-PROD `scheduler-service` pod (do not comment out code — that risks an accidental commit to a shared branch).
3. Confirm via `service-registry`'s health-poll (`checkServicesHealth`, every `HEALTH_CHECK_DURATION`s) that `scheduler-service` is still reporting healthy with all jobs disabled — a disabled job should not equal an unhealthy service.
4. Manually trigger one test email (via `EmailService.sendEmail`, AWS SES) and one test SMS (via SMS Country's bulk API in `sms.service.ts`) end-to-end in Pre-PROD to confirm both channels are reachable and functioning independent of the disabled cron jobs.
5. Record pass/fail for both channels before proceeding to the zero-state baseline capture (#2).

### 2. Pre-PROD: Record the zero-state baseline

No metrics/dashboard stack exists in this repo (no Prometheus/Grafana, no k8s manifests to read resource requests from) — this baseline has to be captured manually against the live EKS cluster.

1. With all jobs stopped (#1) and no user traffic, snapshot per-service pod resource usage: `kubectl top pods -n <preprod-namespace>` for every one of the 14 backend services deployed via the Jenkins pipeline (api-gateway, service-registry, auth-service, org-service, opportunity-service, knowledge-service, notification-service, ai-service, policy-service, scheduler-service, document-service, ibp-service, ai-utility-service, config-service, strapi-cms-service).
2. Capture current pod counts/replicas per service (`kubectl get deployments -n <preprod-namespace>`) as the "zero-state" replica baseline — there's no HPA in this repo, so whatever is running now is a static baseline, not an autoscaled floor.
3. Capture DB-side zero state: active connection count per database (shared core DB, config-service DB, Strapi DB, analytics DB) via `pg_stat_activity`; note this is a good moment to also check autovacuum's last-run stats (`pg_stat_user_tables.last_autovacuum`) since #4 will change that.
4. Save all of the above into a dated snapshot file in this folder (e.g. `Pre-PROD-Zero-State-Baseline_<date>.md`) so future performance work has a documented "nothing running" reference point to diff against.

### 3. SCS / Notifications: first-call latency

"SCS" isn't defined anywhere else in this repo — treating it as the meeting-notes' shorthand for `notification-service`, the only service that sends Email/SMS. There is no message queue (no Bull/SQS/RabbitMQ in this codebase) — sends are synchronous, inline in the request that triggers them. `EmailService`'s `SESClient` is a NestJS-singleton, constructed once per pod lifetime; `sms.service.ts` calls SMS Country over a plain GET. Neither has any code-level warm-up, connection pre-establishment, or template-cache priming today — this is genuinely unresolved, not previously investigated.

1. Reproduce the reported scenario in Pre-PROD on a freshly-restarted `notification-service` pod: send one email, time it; send a second immediately after, time it. Confirm the "first slow, rest instant" pattern actually reproduces before assuming a root cause.
2. If it reproduces, the leading candidate given the singleton-client, no-queue, no-warm-up setup is a cold TCP/TLS handshake to AWS SES / SMS Country's endpoint on the first outbound call from a fresh pod — confirm by capturing connection timing (e.g. wrap the first call with a raw `https` timing probe, or check SES/SMS Country response headers for connection reuse).
3. If confirmed as a cold-connection issue: add a lightweight startup warm-up call in `notification-service`'s `onModuleInit()` (a cheap SES `GetSendQuota`-style no-op call, and an equivalent no-op/ping to SMS Country) so the connection is already warm before the first real user-triggered send.
4. If it's not a connection issue, check the Handlebars template compile path (`notification.service.ts`, `Handlebars.compile(body)` runs per-call with no cache) — this wouldn't normally explain a "first call only" pattern, but rule it out.
5. This is scoped as direct investigation + a small fix. If the root cause turns out to require a queue/async-dispatch redesign (not expected, but possible), escalate to a TRD rather than forcing a workaround here.

### 4. Database Vacuum — scheduled activity

No autovacuum tuning, manual VACUUM schedule, or DB-maintenance job of any kind exists anywhere in this repo today — confirmed by direct search. This is a straightforward operational gap, not a design decision.

1. Audit current Postgres `autovacuum` settings on the shared core DB (and the three other DBs — config-service, Strapi, analytics) — RDS defaults are often too conservative for high-write tables like `policy`, `claim`, `opportunity` given `policy.repository.ts` alone is ~34k lines of query surface against those tables.
2. Identify the highest-churn tables (largest row counts / update-delete rates) as priority candidates for tuned per-table `autovacuum_vacuum_scale_factor`/`autovacuum_analyze_scale_factor`, rather than a blanket instance-wide setting.
3. Add a new scheduled job in `scheduler-service`, following the existing `DynamicCronService` registration pattern (same shape as `external-hospital-sync.scheduler.ts`'s `registerHandlers()` call), that runs a periodic `VACUUM (ANALYZE)` pass — or, preferably, just correctly tunes autovacuum thresholds so manual VACUUM isn't needed except as a backstop.
4. Roll out to all environments (dev/uat/preprod/prod), each registered independently via `application_scheduler_configuration` so cadence can differ per environment (e.g. lighter/less frequent in dev).

### 12. Production Database — validation & clean-up

This repo's migration story is split across two disconnected mechanisms: 5 timestamped TypeORM `MigrationInterface` files in `database-migrations/`, and 67 hand-written raw `.sql` scripts in `database-migrations/sql/` applied manually per environment — with no TypeORM CLI config or automated migration runner found anywhere. That gap is itself a production-data-integrity risk worth validating against, not just a cleanup exercise.

1. Cross-check schema state across dev/uat/preprod/prod using `information_schema` (columns, indexes, constraints) to confirm all 67 raw SQL scripts were actually applied consistently everywhere — schema drift between environments is the most likely failure mode given no automated runner exists.
2. Audit soft-deleted/audit-log tables that only grow (e.g. `audit_history_log`, `authentication_audit_log`) for retention — confirm there's an agreed retention policy before deleting anything in production.
3. Validate referential integrity on tables touched by the recent ad hoc migrations (`AddCompanyEmployeeIdToClaim`, `AddToBeMappedPostUploadToEndorsement`, etc.) — spot-check for orphaned rows the migration may not have backfilled.
4. Any clean-up step that deletes or mutates production rows must go through a written runbook with a rollback plan and DBA + PTL sign-off before execution — this is production data, so "direct action" here means "documented and reviewed," not "improvised."