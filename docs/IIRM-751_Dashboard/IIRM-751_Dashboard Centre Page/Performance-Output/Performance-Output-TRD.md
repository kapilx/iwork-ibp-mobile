# Performance Output Generation — TRD

> Technical Requirements Document for the `generate-performance-output` job.
> Business context, glossary, and business rules (BR-1…BR-7) live in the companion
> [Performance-Output-BRD.md](./Performance-Output-BRD.md). Reflects the system as
> implemented; use as the baseline for future changes.

- **Owning service:** `policy-service`
- **Primary entry point:** `GET /policy/generate-performance-output`
- **Output store:** `performance_output` table (`PerformanceOutput` entity)
- **Consumers:** rewards now fold into `roAchieved` of the two quarterly dashboard endpoints (see §12).

---

## 1. Architecture overview

```
GET /generate-performance-output
        │
        ▼
generatePerformanceOutputForAllUsers(month?, year?)      [orchestrator]
        │  getDateRanges() ─────────► [ {start, end, performanceMonth}, ... ]
        │  findAllUsers()  ─────────► activeUserIds (employees)
        ▼
processPolicyRange(activeUserIds, range)                 [per-range aggregator]
        │
        ├─ Promise.all:
        │    getPolicyPerformanceData          (SO/RO/Mined brokerage — policies)
        │    getEndorsementPerformanceData     (SO/RO/Mined brokerage — endorsements)
        │    getPolicyPremiumPerformanceData   (premium target vs collected)
        │    getPolicyBrokeragePerformanceData (brokerage target vs collected)
        │    getRewardPerformanceData          (reward income)          ◄── added
        │
        ├─ fold into dataMap keyed by composite key
        ├─ emit PerformanceOutput rows (one per entity-type bucket)
        ├─ deletePerformanceOutputsByMonth(performanceMonth)
        └─ savePerformanceOutputs(records)   [chunked insert]
```

It is an **ETL job**, not a report file. HTTP response is a success/failure message.

## 2. Endpoint contract

- **Route:** `GET /policy/generate-performance-output`
  ([policy.controller.ts:1012](../../apps/services/policy-service/src/app/policy/policy.controller.ts))
- **Query DTO:** `GeneratePerformanceDto` — `month?: number (1-12)`, `year?: number`
  ([get-policy.dto.ts:376](../../apps/services/policy-service/src/app/policy/dto/get-policy.dto.ts))
- **Behaviour of params:**
  - `month` + `year` → that single month.
  - `month` only → that month of current year.
  - `year` only → 12 monthly ranges (**see §9 KI-1**).
  - neither → trailing ~30 days, split at month boundary.
- **Response:** `200` "Performance output generated successfully" / `400` on failure.

## 3. Data sources

| Source | Table(s) | Owning service | Key fields used |
|--------|----------|----------------|-----------------|
| Policy brokerage | `policy` | policy-service | `owner_id`, `opportunity_type`, `is_policy_mined_lid`, `basic_brokerage_amount`, `date_of_income`, `enabled_for_performance_lid`, org dims |
| Endorsement brokerage | `endorsement` ∪ `policy_asset_endorsement` (unified) joined to `policy` | policy-service | same shape via `buildUnifiedEndorsementSource` |
| Premium | `policy` / unified endorsements | policy-service | `gross_premium` (target), `premium_collected` |
| Brokerage collected | `policy` / unified endorsements | policy-service | `basic_brokerage_amount` (target), `brokerage_collected` |
| **Reward** | `reward` joined to `users` | **org-service (shared DB)** | `created_by`, `reward_amount`, `date_of_income`, `deleted_at`; org dims from `users` |

**Cross-service access (rewards):** the `reward` table belongs to org-service but
lives in the **same Postgres database**; all services load one shared entity
registry (`service-lib/.../entities/index.ts`) via
`TypeOrmModule.forRoot(typeOrmConfig)`. policy-service reads `Reward` through the
shared entity manager — the sanctioned read pattern in this repo
(precedent: `getRewardsForReport`). No HTTP/RPC to org-service.

## 4. Aggregation grain (composite key)

All sources fold into a `dataMap` keyed by:

```
userId | organisationId | sbuId | verticalId | departmentId | branchId
```

Policy/endorsement rows carry org dims from the policy row. **Reward rows source
all five dims from the creator's `users` record** (single source of truth = the
user), so a user's reward rows co-locate with their policy rows even if
`reward.organisation_id` drifted after creation.

## 5. KPI × Entity-type matrix

| KPI | Entity types | `value_of_target` | `entity_count` |
|-----|--------------|-------------------|----------------|
| `BROKERAGE` | `SO_POLICY`, `RO_POLICY`, `MINED_POLICY`, `TOTAL_POLICY`, `SO_ENDORSEMENT`, `RO_ENDORSEMENT`, `MINED_ENDORSEMENT`, `TOTAL_ENDORSEMENT` | Σ `basic_brokerage_amount` | count of policies/endorsements |
| `PREMIUM_COLLECTED` | `POLICY_PREMIUM_POLICY`, `POLICY_PREMIUM_ENDORSEMENT` | Σ `gross_premium` (target) | Σ `premium_collected` |
| `BROKERAGE_COLLECTED` | `BROKERAGE_COLLECTED_POLICY`, `BROKERAGE_COLLECTED_ENDORSEMENT` | Σ `basic_brokerage_amount` (target) | Σ `brokerage_collected` |
| **`REWARD`** | **`TOTAL_REWARD`** | **Σ `reward_amount`** | **count of rewards** |

> Note the `entity_count` overloading: for count-based buckets it is a row count;
> for premium/brokerage-collected buckets it holds the achieved/collected amount.
> For `TOTAL_REWARD` it is the reward row count.

Constants:
`BUSINESS_TARGET_ENTITY_TYPE` and `POLICY_PERFORMANCE_FIELDS`
([constants.ts](../../libs/service-lib/src/lib/constants.ts)) — `TOTAL_REWARD` and
`REWARD` were added here.

## 6. Output table — `PerformanceOutput`

([performance-output.entity.ts](../../apps/services/service-lib/src/lib/entities/performance-output.entity.ts))

| Column | Meaning |
|--------|---------|
| `user_id` | owner (policy/endo) or creator (reward) |
| `entity_type` | bucket (see matrix) |
| `kpi` | metric family |
| `type_of_target` | `AMOUNT` |
| `value_of_target` | numeric(15,2) — see matrix |
| `entity_count` | numeric(15,2) — see matrix |
| `performance_month` | first-of-month date |
| `organisation_id`, `sbu_id`, `vertical_id`, `department_id`, `branch_id` | org hierarchy |
| `created_at`, `updated_at` | timestamps |

Each `user × org-dimension combo` produces one row per entity-type bucket per
`performance_month`.

## 7. Rewards integration (as implemented)

**Repository** — `getRewardPerformanceData(activeUserIds, start, end)`
([policy.repository.ts](../../apps/services/policy-service/src/app/policy/policy.repository.ts), after `getPolicyPerformanceData`):

```
createQueryBuilder(Reward, "r")
  .leftJoin(User, "u", "u.id = r.createdBy")
  select r.createdBy AS userId, COUNT(r.id) AS count, SUM(r.rewardAmount) AS total,
         u.organisationId/sbuId/verticalId/departmentId/branchId
  where r.deletedAt IS NULL
    and r.createdBy IN (:...activeUserIds)      -- excludes null / out-of-universe creators
    and DATE(r.dateOfIncome) BETWEEN :start AND :end
  group by r.createdBy + the 5 org dims
```

Chunked at 5000 IDs; aggregated across chunks; returns
`{ userId, count, total, organisationId, sbuId, verticalId, departmentId, branchId }[]`.

**Service** — five insertions in `processPolicyRange`
([policy.service.ts:~10208](../../apps/services/policy-service/src/app/policy/policy.service.ts)):

1. 5th call in `Promise.all` → `rewardData`.
2. `reward: { count, total }` added to the `dataMap` value type.
3. `reward: { count: 0, total: 0 }` in the `getOrCreateEntry` initializer.
4. Fold loop: `entry.reward.{count,total} += row.{count,total}` (userId wrapped in `String()`).
5. Emission: `{ type: TOTAL_REWARD, ...rStats }` appended to `entityStats`, and the
   KPI ternary maps `TOTAL_REWARD → REWARD`.

No change to delete/insert — reward rows regenerate with the month (BRD BR-7).

## 8. Edge cases encoded

- Reward with `created_by` NULL or outside `activeUserIds` → excluded by the `IN` filter.
- Rewards have no `enabled_for_performance` flag → all non-deleted rewards in range count.
- Rewards never populate SO/RO/Mined buckets (no opportunity type).
- A user with rewards but no policies this month → still gets a row set (reward-only entry via `getOrCreateEntry`).

## 9. Known issues / limitations

- **KI-1 — Year-only requests process one month.** `generatePerformanceOutputForAllUsers`
  returns inside the first loop iteration
  ([policy.service.ts:~10069](../../apps/services/policy-service/src/app/policy/policy.service.ts)),
  so a `year`-only call only processes the first month. Pre-existing; not fixed in
  the rewards change. Fix = move the `return` outside the range loop.
- **KI-2 — Reward attribution is `created_by`.** Meaningful only if RMs enter their
  own rewards. If business wants true earner attribution or a distribution rule, a
  new rule + likely a schema change is required.
- **KI-3 — Repo has a non-clean strict `tsc` baseline.** Bare
  `tsc -p tsconfig.app.json` reports many pre-existing errors; the rewards change
  adds none. Build via the project's nx/webpack pipeline.

## 10. Extension guide (future changes)

**To add a new KPI / entity-type bucket:**

1. Add the entity-type key to `BUSINESS_TARGET_ENTITY_TYPE` and (if new) the KPI to
   `POLICY_PERFORMANCE_FIELDS` in `constants.ts`.
2. Add a repository method returning rows shaped
   `{ userId, count, total, ...5 org dims }` (model on `getRewardPerformanceData`
   or `getPolicyPerformanceData`; chunk by 5000; filter by date of income).
3. In `processPolicyRange`: add the call to `Promise.all`; extend the `dataMap`
   value type + `getOrCreateEntry` initializer; add a fold loop; append to
   `entityStats`; extend the KPI mapping ternary.
4. No delete/insert change needed — new rows regenerate per month.

**To change attribution or time bucketing:** update the repository query's join
(`created_by` / `owner_id`) or the `DATE(... ) BETWEEN` predicate, and reflect the
rule in BRD §4.

## 11. Verification

1. Seed a `reward` with a known `created_by` (an employee in `findAllUsers`), a
   `date_of_income` inside the target month, and a known `reward_amount`.
2. Call `GET /policy/generate-performance-output?month=<m>&year=<y>` → expect `200`.
3. Query `performance_output` for that `performance_month` and `user_id = <created_by>`:
   - one row with `kpi='REWARD'`, `entity_type='TOTAL_REWARD'`, `type_of_target='AMOUNT'`,
     `value_of_target = Σ reward_amount`, `entity_count = count`.
   - org dims match the creator's employee hierarchy.
4. Negative: reward with null `created_by` or a non-employee creator → no reward row.
5. Regression: existing `BROKERAGE` / `PREMIUM_COLLECTED` / `BROKERAGE_COLLECTED`
   rows for the month are unchanged.

## 12. Dashboard consumers — rewards folded into RO achieved (IMPLEMENTED)

Business decision: **reward income is included in the `roAchieved` figure** of the
quarterly dashboard (not shown as a separate stacked series). This supersedes the
earlier "reward as its own stacked segment" idea.

**Consuming endpoints** ([policy.repository.ts](../../apps/services/policy-service/src/app/policy/policy.repository.ts)):

| Endpoint | Repository method | Grain |
|----------|-------------------|-------|
| `GET /policy/quarterly-dashboard-business-performance` | `getQuarterlyDashboardBusinessPerformance` | per quarter |
| `GET /policy/quarterly-dashboard-business-performance-by-sbu-basis` | `getQuarterlyDashboardBusinessPerformanceBySbu` | per SBU |

**How rewards fold in (both methods, identical pattern):**

1. **Fetch** — the achieved query widened from `kpi = BROKERAGE` to
   `kpi IN (BROKERAGE, REWARD)`, and `TOTAL_REWARD` added to the fetched
   `entityTypes`. Reward rows have `kpi=REWARD` + `entityType=TOTAL_REWARD`, so the
   cross-combinations produce no extra rows (no double counting).
2. **Aggregate** — `TOTAL_REWARD` added to the `roAchievedTypes` set, so
   `Σ value_of_target` for reward rows adds into `roAchieved` alongside `RO_POLICY`
   and `RO_ENDORSEMENT`. `soAchieved` and targets are unaffected.

So `roAchieved` = RO brokerage (policy + endorsement) **+ reward income** for the
period/scope. `roTarget`, `soAchieved`, `soTarget` are unchanged.

## 13. Dashboard UI — RO rewards disclaimer (IMPLEMENTED)

An *italic* caption disclaimer — `*Rewards are included in the RO achieved
figures.` — is rendered beneath the business-performance widget so it covers both
the quarterly and SBU charts.

- **Copy:** `TARGET_VS_ACTUAL_COPY.rewardsNote`
  (`apps/ui/iwork/src/app/pages/Dashboard/TargetVsActualBreakdown/constants.ts`).
- **Placement:** inside the shared `DashboardSection`, after
  `<BusinessPerformanceQuarterlyView />`, as a muted MUI
  `Typography variant="caption"` (`fontStyle: italic`)
  (`.../TargetVsActualBreakdown/TargetVsActualBreakdownCommon.tsx`).
- One location covers both views (single shared container).

---

## File index

| Concern | File |
|---------|------|
| Route | `apps/services/policy-service/src/app/policy/policy.controller.ts` |
| Query DTO | `apps/services/policy-service/src/app/policy/dto/get-policy.dto.ts` |
| Orchestrator + aggregator | `apps/services/policy-service/src/app/policy/policy.service.ts` |
| Source queries + `getRewardPerformanceData` | `apps/services/policy-service/src/app/policy/policy.repository.ts` |
| Output entity | `apps/services/service-lib/src/lib/entities/performance-output.entity.ts` |
| Reward entities | `apps/services/service-lib/src/lib/entities/reward*.entity.ts` |
| Constants | `libs/service-lib/src/lib/constants.ts` |
