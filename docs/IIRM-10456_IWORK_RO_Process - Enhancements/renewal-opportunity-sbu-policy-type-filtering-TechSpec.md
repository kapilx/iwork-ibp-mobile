# SBU-Driven Renewal Opportunity Creation with Policy Type Suppression — Technical Specification

**Feature:** Enhance `handlePoliciesCloseToExpiry` to scope RO creation by SBU flag and suppress specific policy types per SBU  
**BRD Reference:** renewal-opportunity-sbu-policy-type-filtering.md  
**Date:** 2026-05-11  
**Status:** Draft

---

## 1. Overview

This document describes the technical design and implementation plan for SBU-driven Renewal Opportunity (RO) creation. It translates every requirement from the feature spec into concrete code changes across the database, shared utility, and scheduler layers.

### 1.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│  scheduler-service                                                   │
│  apps/services/scheduler-service/src/app/scheduler/                 │
│    opportunity-status.scheduler.ts                                   │
│      handlePoliciesCloseToExpiry()                                   │
│        ├── Guard: HANDLE_RENEWAL_OPPORTUNITY_CRON enabled?           │
│        ├── Assemble deps (repositories + createRenewalOpportunity)   │
│        └── delegate → handlePoliciesCloseToExpiry(deps)  ← utility  │
└───────────────────────────┬──────────────────────────────────────────┘
                            │ delegates all logic
┌───────────────────────────▼──────────────────────────────────────────┐
│  service-lib shared utility                                          │
│  libs/service-lib/src/lib/utils/ro-creation.utils.ts                │
│    handlePoliciesCloseToExpiry(deps)                                 │
│      ├── Fetch required lookups (optyTypeRO, isPolicyMined,          │
│      │   natureOfBusinessInsuranceOnly)                              │
│      ├── Fetch SBUs where is_ro_generation_enabled = true  ← NEW    │
│      └── For each enabled SBU:                            ← NEW loop │
│           ├── Fetch suppressed policy_type_lid list       ← NEW     │
│           ├── Build per-SBU WHERE clause                             │
│           ├── Count + batch paginate qualifying policies             │
│           └── For each policy → createRenewalOpportunity(...)       │
└───────────────────────────┬──────────────────────────────────────────┘
                            │
┌───────────────────────────▼──────────────────────────────────────────┐
│  Database (PostgreSQL)                                               │
│    policy                           (existing, no changes)           │
│    opportunity                      (existing, no changes)           │
│    org_sbu                          (existing, add 1 column)  ← NEW │
│    sbu_ro_policy_type_suppression   (new table)               ← NEW │
└──────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| SBU scoping mechanism | `is_ro_generation_enabled` flag on `org_sbu` | DB-flag approach is operationally simple; no code change needed to enable/disable per SBU |
| Policy type suppression | New `sbu_ro_policy_type_suppression` denylist table | Decoupled from SBU table; allows per-SBU per-type control without schema changes per new suppression rule |
| Policies with `sbu_id = NULL` | Excluded by design | `AND policy.sbu_id = :sbuId` never matches NULL; no legacy fallback pass needed |
| `nature_of_bussiness_lid` filter | Retained unchanged | Existing INSURANCE_ONLY filter continues to apply alongside SBU scoping |
| Duplicate logic in two files | Consolidate into `ro-creation.utils.ts` | Scheduler becomes a thin caller; utility owns all query + construction logic |
| ENV-based SBU filter | Replaced by `is_ro_generation_enabled` flag loop | DB flag is more operational and avoids hardcoded ENV values |
| Dedup check | `NOT EXISTS` sub-query (existing utility pattern) | Consistent with `ro-creation.utils.ts`; replaces scheduler's `NOT IN` pattern |
| Admin management | Direct DB SQL only | No API endpoints needed; changes are infrequent, SQL is sufficient |

---

## 2. Database Changes

### 2.1 Add `is_ro_generation_enabled` to `org_sbu` — NEW column

**Migration SQL:**

```sql
ALTER TABLE org_sbu
  ADD COLUMN is_ro_generation_enabled BOOLEAN NOT NULL DEFAULT FALSE;
```

**Entity change** ([apps/services/service-lib/src/lib/entities/org-sbu.entity.ts](apps/services/service-lib/src/lib/entities/org-sbu.entity.ts)):

Add the following column decorator after the existing `updatedBy` field (line 54):

```typescript
@Column({
  name: "is_ro_generation_enabled",
  type: "boolean",
  default: false,
})
isRoGenerationEnabled: boolean;
```

### 2.2 New table: `sbu_ro_policy_type_suppression` — NEW table

Stores `(sbu_id, policy_type_lid)` pairs for which RO generation must be skipped. Acts as a denylist — if a row exists for a pair, no ROs are created for policies of that type within that SBU.

| Entity field      | DB column           | Type          | Nullable | Notes                       |
|-------------------|---------------------|---------------|----------|-----------------------------|
| `id`              | `id`                | `int`         | No       | Primary key, auto-increment |
| `sbuId`           | `sbu_id`            | `int`         | No       | FK → `org_sbu.id`           |
| `policyTypeLid`   | `policy_type_lid`   | `int`         | No       | FK → `look_up.id`           |
| `createdBy`       | `created_by`        | `int`         | No       | FK → `user.user_id`         |
| `updatedBy`       | `updated_by`        | `int`         | Yes      | FK → `user.user_id`         |
| `createdAt`       | `created_at`        | `timestamptz` | No       | Auto-set on insert          |
| `updatedAt`       | `updated_at`        | `timestamptz` | No       | Auto-set on update          |

**Unique constraint:** `(sbu_id, policy_type_lid)`

**Migration SQL:**

```sql
CREATE TABLE sbu_ro_policy_type_suppression (
  id               SERIAL PRIMARY KEY,
  sbu_id           INT NOT NULL REFERENCES org_sbu(id),
  policy_type_lid  INT NOT NULL REFERENCES look_up(id),
  created_by       INT NOT NULL,
  updated_by       INT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (sbu_id, policy_type_lid)
);
```

**New TypeORM entity** ([apps/services/service-lib/src/lib/entities/sbu-ro-policy-type-suppression.entity.ts](apps/services/service-lib/src/lib/entities/sbu-ro-policy-type-suppression.entity.ts)):

```typescript
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
  UpdateDateColumn,
} from "typeorm";
import { LookUp } from "./look-up.entity";
import { OrgSbu } from "./org-sbu.entity";

@Entity("sbu_ro_policy_type_suppression")
export class SbuRoPolicyTypeSuppression {
  @PrimaryGeneratedColumn({ name: "id", type: "int" })
  id: number;

  @Column({ name: "sbu_id", type: "int", nullable: false })
  sbuId: number;

  @Column({ name: "policy_type_lid", type: "int", nullable: false })
  policyTypeLid: number;

  @Column({ name: "created_by", type: "int", nullable: false })
  createdBy: number;

  @Column({ name: "updated_by", type: "int", nullable: true })
  updatedBy?: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ManyToOne(() => OrgSbu)
  @JoinColumn({ name: "sbu_id", referencedColumnName: "id" })
  sbu: Relation<OrgSbu>;

  @ManyToOne(() => LookUp)
  @JoinColumn({ name: "policy_type_lid", referencedColumnName: "id" })
  policyType: Relation<LookUp>;
}
```

### 2.3 Existing entities — no changes required

- [apps/services/service-lib/src/lib/entities/org-sbu.entity.ts](apps/services/service-lib/src/lib/entities/org-sbu.entity.ts) — only add `isRoGenerationEnabled` column (§2.1)
- `policy.entity.ts` — `sbuId`, `organisationId`, `verticalId`, `departmentId`, `branchId` already present
- `opportunity.entity.ts` — `sbuId`, `organisationId`, `verticalId`, `departmentId`, `branchId` already present

---

## 3. Updated `RoCreationDeps` Interface

The shared utility's dependency interface gains two new repositories.

**File:** [libs/service-lib/src/lib/utils/ro-creation.utils.ts](libs/service-lib/src/lib/utils/ro-creation.utils.ts)

**Current interface (line 22–29):**

```typescript
export interface RoCreationDeps {
    traceId: string;
    logger: any;
    lookUpRepository: Repository<LookUp>;
    policyRepository: Repository<Policy>;
    policyTypeSegregationRepository: Repository<PolicyTypeSegregation>;
    createRenewalOpportunity: (opportunity: Partial<Opportunity>) => Promise<void>;
}
```

**Updated interface:**

```typescript
export interface RoCreationDeps {
    traceId:                              string;
    logger:                               any;
    lookUpRepository:                     Repository<LookUp>;
    policyRepository:                     Repository<Policy>;
    policyTypeSegregationRepository:      Repository<PolicyTypeSegregation>;
    orgSbuRepository:                     Repository<OrgSbu>;                      // NEW
    sbuRoPolicyTypeSuppressionRepository: Repository<SbuRoPolicyTypeSuppression>;  // NEW
    createRenewalOpportunity:             (opportunity: Partial<Opportunity>) => Promise<void>;
}
```

**Required new imports in `ro-creation.utils.ts`:**

```typescript
import { OrgSbu } from "../../../../../apps/services/service-lib/src/lib/entities/org-sbu.entity";
import { SbuRoPolicyTypeSuppression } from "../../../../../apps/services/service-lib/src/lib/entities/sbu-ro-policy-type-suppression.entity";
```

---

## 4. Detailed Flow

### 4.1 Updated Utility: `handlePoliciesCloseToExpiry(deps)` 

**File:** [libs/service-lib/src/lib/utils/ro-creation.utils.ts](libs/service-lib/src/lib/utils/ro-creation.utils.ts)

The entire `handlePoliciesCloseToExpiry` function is rewritten. The `ROForDefinedPolicySetFlag` code path, the ENV-based `sbuName` JOIN on the `users` table, and the `PolicySetForRoCreation` branch are all removed and replaced with the SBU-flag loop below.

```
[Utility] handlePoliciesCloseToExpiry(deps)
│
├─ Fetch required lookups:
│    optyTypeRO                    (OPPORTUNITY_TYPE.RO)
│    isPolicyMined                 (MINED_POLICY)
│    natureOfBusinessInsuranceOnly (NATURE_OF_BUSSINESS / INSURENCE_ONLY)
│  Any lookup missing → log error, return
│
├─ Compute date window:
│    now           = new Date()
│    thresholdDate = now + ONE_YEAR_IN_DAYS
│
├─ Fetch all SBUs where is_ro_generation_enabled = true          ← NEW
│    orgSbuRepository.find({ where: { isRoGenerationEnabled: true } })
│  No enabled SBUs → log info ("No SBUs enabled for RO generation. Skipping."), return
│
└─ For each enabled SBU:                                         ← NEW outer loop
   │
   ├─ Fetch suppressed policy_type_lid values for this SBU       ← NEW
   │    sbuRoPolicyTypeSuppressionRepository.find({ where: { sbuId: sbu.id } })
   │    → suppressedIds: number[]
   │
   ├─ Log: "Processing SBU id={id} name={name}, suppressed policyTypes={suppressedIds}"
   │
   ├─ Build WHERE clause:
   │    policy.policy_to BETWEEN :now AND :thresholdDate
   │    AND NOT EXISTS (
   │      SELECT 1 FROM opportunity
   │      WHERE opportunity_type_lid = :optyTypeRO
   │        AND ref_policy_id = policy.id
   │    )
   │    AND (
   │      policy.nature_of_bussiness_lid = :insuranceOnlyId
   │      OR policy.nature_of_bussiness_lid IS NULL
   │    )
   │    AND policy.sbu_id = :sbuId
   │    [AND policy.policy_type_lid NOT IN (:...suppressedIds)]   ← omit clause if suppressedIds is empty
   │
   ├─ Count qualifying policies (for batch pagination)
   │  Count = 0 → log info, continue to next SBU
   │
   └─ For each batch (offset += DEFAULT_RO_CRON_BATCH_SIZE):
      │
      ├─ Fetch policies with WHERE clause above
      │  ORDER BY policy.policy_to ASC, LIMIT batchSize OFFSET offset
      │  Log: "Fetched {n} policies in batch at offset {offset} for SBU id={id}"
      │
      ├─ Resolve policy type mappings via PolicyTypeSegregation
      │
      └─ For each policy → createRenewalOpportunity({
           opportunityTypeLid:           optyTypeRO.id,
           companyId:                    policy.companyId,
           policyTypeLid:                mappingMap.get(policy.policyTypeLid) ?? policy.policyTypeLid,
           refPolicyId:                  policy.id,
           estimatedBrokerage:           policy.basicBrokerageAmount,
           estimatedBrokeragePercentage: policy.basicBrokeragePercentage,
           premiumPaid:                  policy.grossPremium ?? 0,
           expiryDate:                   policy.policyTo,
           sumInsured:                   policy.sumInsured,
           estimatedFee:                 policy.feeAmount ?? 0,
           ownerId:                      policy.ownerId ?? policy.createdBy,
           isPolicyMinedLid:             isPolicyMined.id,
           organisationId:               policy.organisationId,
           sbuId:                        policy.sbuId,
           verticalId:                   policy.verticalId,
           departmentId:                 policy.departmentId,
           branchId:                     policy.branchId,
         })
         On error → log error (policyId + sbuId + error.message), continue to next policy
      │
      └─ Log on SBU complete: "Completed SBU id={id}: {success}/{total} ROs created"
```

### 4.2 Updated Scheduler: `handlePoliciesCloseToExpiry()` (thin caller)

**File:** [apps/services/scheduler-service/src/app/scheduler/opportunity-status.scheduler.ts](apps/services/scheduler-service/src/app/scheduler/opportunity-status.scheduler.ts)

The current inline implementation (lines 547–790) is **deleted in full** and replaced with a thin delegation block:

```typescript
@Cron("15 00 * * *")
async handlePoliciesCloseToExpiry() {
  this.logger.log("handlePoliciesCloseToExpiry - cron job started");

  if (ENV.HANDLE_RENEWAL_OPPORTUNITY_CRON !== "true") {
    return;
  }

  const traceId = this.traceIdService.traceId;

  const login = await this.login(
    `${ENV.SCHEDULER_LOGIN_USERNAME}`,
    `${ENV.SCHEDULER_LOGIN_PASSWORD}`
  );
  const userDetails = await this.userRepository.findOne({
    where: { loginName: ENV.SCHEDULER_LOGIN_USERNAME },
  });
  if (!userDetails) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId,
        status: "failure",
        location: "OpportunityStatusScheduler",
        method: "handlePoliciesCloseToExpiry",
        messageData: `No user found with username: ${ENV.SCHEDULER_LOGIN_USERNAME}`,
      }),
    });
    return;
  }

  await handlePoliciesCloseToExpiry({
    traceId,
    logger: this.logger,
    lookUpRepository:                     this.lookUpRepository,
    policyRepository:                     this.policyRepository,
    policyTypeSegregationRepository:      this.policyTypeSegregationRepository,
    orgSbuRepository:                     this.orgSbuRepository,                     // NEW
    sbuRoPolicyTypeSuppressionRepository: this.sbuRoPolicyTypeSuppressionRepository, // NEW
    createRenewalOpportunity: async (opportunity) => {
      await axios.post(
        `${ENV.URL_OPPORTUNITY_SERVICE}/opportunity/renewal-opportunity`,
        { ...opportunity, optyType: "RO", injectedBy: "SYSTEM" },
        {
          headers: {
            Authorization: `Bearer ${login.accessToken.accessToken}`,
            userid: userDetails.userId,
            "x-bypass-timeout": "true",
          },
        }
      );
    },
  });
}
```

---

## 5. Query Reference

### Fetch enabled SBUs

```typescript
const enabledSbus = await deps.orgSbuRepository.find({
  where: { isRoGenerationEnabled: true },
  select: ["id", "name"],
});
```

### Fetch suppressed policy types for an SBU

```typescript
const suppressions = await deps.sbuRoPolicyTypeSuppressionRepository.find({
  where: { sbuId: sbu.id },
  select: ["policyTypeLid"],
});
const suppressedIds = suppressions.map((s) => s.policyTypeLid);
```

### Per-SBU count + batch query

```typescript
const whereClause = `
  policy.policy_to BETWEEN :now AND :thresholdDate
  AND NOT EXISTS (
    SELECT 1 FROM opportunity
    WHERE opportunity_type_lid = :optyTypeRO
      AND ref_policy_id = policy.id
  )
  AND (
    policy.nature_of_bussiness_lid = :insuranceOnlyId
    OR policy.nature_of_bussiness_lid IS NULL
  )
  AND policy.sbu_id = :sbuId
  ${suppressedIds.length > 0
    ? "AND policy.policy_type_lid NOT IN (:...suppressedIds)"
    : ""}
`;

const params = {
  now,
  thresholdDate,
  optyTypeRO: optyTypeRO.id,
  insuranceOnlyId: natureOfBusinessInsuranceOnly.id,
  sbuId: sbu.id,
  ...(suppressedIds.length > 0 ? { suppressedIds } : {}),
};

// Count
const totalPoliciesCount = await deps.policyRepository
  .createQueryBuilder("policy")
  .where(whereClause, params)
  .getCount();

// Batch fetch
const policies = await deps.policyRepository
  .createQueryBuilder("policy")
  .where(whereClause, params)
  .orderBy("policy.policy_to", "ASC")
  .offset(offset)
  .limit(batchSize)
  .getMany();
```

---

## 6. Logging

| Event | Level | Message template |
|---|---|---|
| No enabled SBUs | `info` | `No SBUs enabled for RO generation. Skipping.` |
| Enabled SBUs loaded | `info` | `Found {n} SBU(s) enabled for RO generation` |
| SBU processing start | `info` | `Processing SBU id={id} name={name}, suppressed policyTypes={suppressedIds}` |
| Batch fetched | `info` | `Fetched {n} policies in batch at offset {offset} for SBU id={id}` |
| SBU complete | `info` | `Completed SBU id={id}: {success}/{total} ROs created` |
| RO creation failure | `error` | `Failed to create RO for policyId={id}, sbuId={sbuId}: {error.message}` |

---

## 7. Edge Cases & Guards

| Scenario | Handling |
|---|---|
| No SBUs have `is_ro_generation_enabled = true` | Log info: `"No SBUs enabled for RO generation. Skipping."`, return early |
| An enabled SBU has no suppression rows | `suppressedIds = []` — `NOT IN` clause omitted; all policy types processed |
| An enabled SBU has all policy types suppressed | Count = 0 for that SBU; batch loop skipped, log info |
| RO creation fails for a policy | Log error with `policyId` + `sbuId`; continue to next policy |
| Policy already has a linked RO | Excluded by `NOT EXISTS` dedup check |
| Policy `sbu_id = NULL` | Excluded by design — `AND policy.sbu_id = :sbuId` never matches NULL |
| Lookup value missing (optyTypeRO / isPolicyMined / insuranceOnly) | Log error, return early |
| Scheduler user not found | Log error, return early — consistent with existing behaviour |

---

## 8. Operational Guide

> All configuration changes are made directly via SQL — no admin API endpoints are provided.

### Controlling which SBUs generate ROs

| Action | SQL |
|---|---|
| Enable RO generation for an SBU | `UPDATE org_sbu SET is_ro_generation_enabled = true WHERE id = :sbuId;` |
| Disable RO generation for an SBU | `UPDATE org_sbu SET is_ro_generation_enabled = false WHERE id = :sbuId;` |

### Suppressing specific policy types within an SBU

| Action | SQL |
|---|---|
| Suppress a policy type for an SBU | `INSERT INTO sbu_ro_policy_type_suppression (sbu_id, policy_type_lid, created_by) VALUES (:sbuId, :policyTypeLid, :userId);` |
| Remove a suppression (re-enable that type) | `DELETE FROM sbu_ro_policy_type_suppression WHERE sbu_id = :sbuId AND policy_type_lid = :policyTypeLid;` |

---

## 9. Task Breakdown

All tasks are listed in dependency order. Tasks within the same group can be worked in parallel.

---

### Group A — Database (no dependencies)

| # | Task | File(s) | Notes |
|---|---|---|---|
| A-1 | Write SQL migration: `ALTER TABLE org_sbu ADD COLUMN is_ro_generation_enabled BOOLEAN NOT NULL DEFAULT FALSE` | New migration SQL file | See §2.1 |
| A-2 | Write SQL migration: `CREATE TABLE sbu_ro_policy_type_suppression` with all columns, FK constraints, and unique constraint | Same or separate migration SQL file | See §2.2 |

---

### Group B — Shared Entities & Exports (no dependencies)

| # | Task | File(s) | Notes |
|---|---|---|---|
| B-1 | Add `isRoGenerationEnabled` boolean column decorator to `OrgSbu` entity | [apps/services/service-lib/src/lib/entities/org-sbu.entity.ts](apps/services/service-lib/src/lib/entities/org-sbu.entity.ts) | See §2.1; add after `updatedBy` field (line 54) |
| B-2 | Create new `SbuRoPolicyTypeSuppression` TypeORM entity file | [apps/services/service-lib/src/lib/entities/sbu-ro-policy-type-suppression.entity.ts](apps/services/service-lib/src/lib/entities/sbu-ro-policy-type-suppression.entity.ts) | See §2.2 full entity definition |
| B-3 | Export `SbuRoPolicyTypeSuppression` from the entities barrel | [apps/services/service-lib/src/lib/entities/index.ts](apps/services/service-lib/src/lib/entities/index.ts) | Add `export * from "./sbu-ro-policy-type-suppression.entity"` and add class to the `entities` array |

---

### Group C — Shared Utility Rewrite (depends on B)

| # | Task | File(s) | Notes |
|---|---|---|---|
| C-1 | Extend `RoCreationDeps` interface: add `orgSbuRepository` and `sbuRoPolicyTypeSuppressionRepository` fields | [libs/service-lib/src/lib/utils/ro-creation.utils.ts](libs/service-lib/src/lib/utils/ro-creation.utils.ts) | See §3; add new imports for `OrgSbu` and `SbuRoPolicyTypeSuppression` at top of file |
| C-2 | Remove the `ROForDefinedPolicySetFlag` parameter and the `PolicySetForRoCreation` branch from `handlePoliciesCloseToExpiry` | Same file | Lines 35, 121–172, 196–199 in current file — delete entire flag + branch |
| C-3 | Remove ENV-based SBU filter: delete the `innerJoin("org_sbu", "sbu", "sbu.id = usr.sbu_id AND sbu.name = :sbuName")` join and the `innerJoin("users", "usr")` join from the count and batch queries | Same file | Lines 124–137 and 178–194 in current file |
| C-4 | Add enabled-SBU fetch: query `orgSbuRepository.find({ where: { isRoGenerationEnabled: true } })` with early-exit guard if empty | Same file | See §4.1 and §5 |
| C-5 | Add per-SBU outer loop: wrap the existing count + batch query logic inside `for (const sbu of enabledSbus)` | Same file | See §4.1 |
| C-6 | Add suppression fetch inside the SBU loop: query `sbuRoPolicyTypeSuppressionRepository.find({ where: { sbuId: sbu.id } })` → build `suppressedIds` array | Same file | See §4.1 and §5 |
| C-7 | Update WHERE clause: replace `sbu.name = :sbuName` JOIN condition with `AND policy.sbu_id = :sbuId`; add conditional `AND policy.policy_type_lid NOT IN (:...suppressedIds)` clause | Same file | See §5; omit the NOT IN clause entirely when `suppressedIds.length === 0` |
| C-8 | Add structured logging at each key event (enabled SBUs loaded, SBU start, batch fetched, SBU complete, RO failure) | Same file | See §6 logging table; use existing `buildLogMessage` pattern |

---

### Group D — Scheduler Refactor (depends on B, C)

| # | Task | File(s) | Notes |
|---|---|---|---|
| D-1 | Register `OrgSbu` and `SbuRoPolicyTypeSuppression` entities in the scheduler module's `TypeOrmModule.forFeature([...])` | [apps/services/scheduler-service/src/app/app.module.ts](apps/services/scheduler-service/src/app/app.module.ts) | Import both from `../../../../services/service-lib/src/lib/entities`; add to the `TypeOrmModule.forFeature` array (currently line 80–134) |
| D-2 | Inject `orgSbuRepository` and `sbuRoPolicyTypeSuppressionRepository` into `OpportunityStatusScheduler` constructor | [apps/services/scheduler-service/src/app/scheduler/opportunity-status.scheduler.ts](apps/services/scheduler-service/src/app/scheduler/opportunity-status.scheduler.ts) | Add `@InjectRepository(OrgSbu)` and `@InjectRepository(SbuRoPolicyTypeSuppression)` constructor params; import entity classes |
| D-3 | Delete the inline `handlePoliciesCloseToExpiry` implementation in the scheduler (lines 547–790 in current file) | Same file | Remove all inline lookup fetches, the whereClause, the count query, the batch loop, and the axios RO creation call |
| D-4 | Import `handlePoliciesCloseToExpiry` from `ro-creation.utils.ts` | Same file | Add import at top of file |
| D-5 | Rewrite `handlePoliciesCloseToExpiry()` in the scheduler as a thin caller: guard check → login → assemble `deps` → delegate to utility | Same file | See §4.2 for the full replacement body; `createRenewalOpportunity` callback wraps the existing `axios.post` call |

---

### Group F — Endorsement-Triggered RO Premium Sync (no dependencies on A–D)

| # | Task | File(s) | Notes |
|---|---|---|---|
| F-1 | After the endorsement bypass update block, add `try/catch` block: look up `OPPORTUNITY_TYPE.RO`, find linked RO, sum `endorsement.grossPremium` for policy, update `opportunity.premiumPaid` | [apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts](apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts) | See §11.3 and §11.4 for full flow and queries; must be non-blocking |
| F-2 | Add `logInfo` on successful RO premium update and `logError` on failure using existing helpers | Same file | See §11.5 logging table |

---

### Group E — Validation & Smoke Testing (depends on C, D)

| # | Task | Description |
|---|---|---|
| E-1 | Manual smoke test: enable one SBU via SQL, run the scheduler method, verify ROs are created only for policies belonging to that SBU | |
| E-2 | Manual smoke test: add a suppression row for a specific policy type, re-run, verify policies of that type are skipped | |
| E-3 | Manual smoke test: set `is_ro_generation_enabled = false` for all SBUs, verify scheduler logs `"No SBUs enabled for RO generation. Skipping."` and exits without creating any ROs | |
| E-4 | Verify that policies with `sbu_id = NULL` are never processed regardless of SBU configuration | |
| E-5 | Verify that policies already linked to an RO (`ref_policy_id` exists in `opportunity`) are excluded by the `NOT EXISTS` check | |

---

## 10. Affected Files Summary

| File | Change Type | Description |
|---|---|---|
| [apps/services/service-lib/src/lib/entities/org-sbu.entity.ts](apps/services/service-lib/src/lib/entities/org-sbu.entity.ts) | **Update** | Add `isRoGenerationEnabled` boolean column (default `false`) |
| [apps/services/service-lib/src/lib/entities/sbu-ro-policy-type-suppression.entity.ts](apps/services/service-lib/src/lib/entities/sbu-ro-policy-type-suppression.entity.ts) | **New file** | TypeORM entity for the `sbu_ro_policy_type_suppression` denylist table |
| [apps/services/service-lib/src/lib/entities/index.ts](apps/services/service-lib/src/lib/entities/index.ts) | **Update** | Export `SbuRoPolicyTypeSuppression`; add to `entities` array |
| [libs/service-lib/src/lib/utils/ro-creation.utils.ts](libs/service-lib/src/lib/utils/ro-creation.utils.ts) | **Rewrite** | Extend `RoCreationDeps` with two new repos; replace ENV-based SBU filter + `ROForDefinedPolicySetFlag` branch with `is_ro_generation_enabled` flag loop + suppression query |
| [apps/services/scheduler-service/src/app/scheduler/opportunity-status.scheduler.ts](apps/services/scheduler-service/src/app/scheduler/opportunity-status.scheduler.ts) | **Refactor** | Delete duplicate inline `handlePoliciesCloseToExpiry` body; inject `OrgSbu` + `SbuRoPolicyTypeSuppression` repositories; delegate to utility |
| [apps/services/scheduler-service/src/app/app.module.ts](apps/services/scheduler-service/src/app/app.module.ts) | **Update** | Register `OrgSbu` and `SbuRoPolicyTypeSuppression` in `TypeOrmModule.forFeature([...])` |
| New SQL migration file | **New file** | `ALTER TABLE org_sbu ADD COLUMN is_ro_generation_enabled`; `CREATE TABLE sbu_ro_policy_type_suppression` |
| [apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts](apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts) | **Update** | After endorsement bypass premium update: look up RO, sum endorsement premiums, update `opportunity.premiumPaid` (non-blocking, see §11) |

**No changes required to:**
- The opportunity service API endpoint
- The cron schedule expression or `HANDLE_RENEWAL_OPPORTUNITY_CRON` env flag
- Any other scheduler jobs
- `policy.entity.ts` or `opportunity.entity.ts` — all required fields already present
- No new entities, migrations, or module registrations for the endorsement RO sync (§11)

---

## 11. Endorsement-Triggered RO Premium Sync

### 11.1 Overview

When an endorsement is processed that modifies a policy's premium, any linked RO must have its `premiumPaid` field updated to reflect the new total premium (`policy.grossPremium` + sum of all endorsement premiums). This is a non-blocking side-effect appended to the existing endorsement bypass update path in `EnrollmentUploadScheduler`.

### 11.2 Trigger Point

The update is appended **immediately after** the endorsement record is written with aggregated premiums in the bypass mode path:

**File:** [apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts](apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts)

The block is inserted after `this.endorsementRepo.update(...)` completes inside the bypass endorsement processing branch.

### 11.3 Implementation Flow

```
[EnrollmentUploadScheduler] processEnrollmentUpload() — bypass mode path
│
├─ ... (existing endorsement premium aggregation + update)
│
└─ [NEW] Endorsement-triggered RO premium sync
   │
   ├─ Look up roLookup = lookUpRepository.findOne({ where: { lookUpKey: OPPORTUNITY_TYPE.RO } })
   │  roLookup missing → skip (no RO type in system)
   │
   ├─ Find roOpportunity = opportunityRepo.findOne({
   │    where: { opportunityTypeLid: roLookup.id, refPolicyId: policy.id },
   │    select: ["opportunityId"],
   │  })
   │  No RO found → skip silently
   │
   ├─ Sum endorsement premiums:
   │    SELECT SUM(e.grossPremium) AS total
   │    FROM endorsement e
   │    WHERE e.policyId = :policyId
   │    → totalEndorsementPremium (default 0 if null)
   │
   ├─ newPremiumPaid = Number(policy.grossPremium ?? 0) + totalEndorsementPremium
   │
   ├─ opportunityRepo.update(roOpportunity.opportunityId, { premiumPaid: newPremiumPaid })
   │
   └─ Log success: "Updated RO premiumPaid after endorsement update"
      On any error → log error (policyId + error.message), continue (non-blocking)
```

### 11.4 Query Reference

**Sum endorsement premiums for a policy:**

```typescript
const premiumRow = await this.endorsementRepo
  .createQueryBuilder("e")
  .select("SUM(e.grossPremium)", "total")
  .where("e.policyId = :policyId", { policyId: policy?.id })
  .getRawOne<{ total: string }>();

const totalEndorsementPremium = parseFloat(premiumRow?.total ?? "0") || 0;
const policyGrossPremium = Number(policy?.grossPremium ?? 0);
const newPremiumPaid = policyGrossPremium + totalEndorsementPremium;
```

**Update the RO:**

```typescript
await this.opportunityRepo.update(roOpportunity.opportunityId, {
  premiumPaid: newPremiumPaid,
});
```

### 11.5 Logging

| Event | Level | Message template |
|---|---|---|
| RO premium updated | `info` | `Updated RO premiumPaid after endorsement update — opportunityId={id}, policyId={id}, newPremiumPaid={value}` |
| Update failed | `error` | `Failed to update RO premiumPaid — policyId={id}: {error.message}` |

Uses the existing `logInfo` / `logError` helpers already present in `EnrollmentUploadScheduler`.

### 11.6 Edge Cases & Guards

| Scenario | Handling |
|---|---|
| `OPPORTUNITY_TYPE.RO` not found in `look_up` | Guard on `roLookup` presence → skip |
| No RO linked to the policy | `opportunityRepo.findOne` returns `null` → skip silently |
| No endorsement rows exist for policy | `SUM` returns `NULL` → `parseFloat("0")` → `totalEndorsementPremium = 0` |
| `policy.grossPremium` is `null` / `undefined` | `Number(null ?? 0)` → `0` |
| `opportunityRepo.update` throws | Caught in `try/catch` → `logError` → continue; does not interrupt main endorsement flow |

### 11.7 No New Dependencies

This feature reuses repositories already injected into `EnrollmentUploadScheduler`:
- `lookUpRepository` — already present
- `opportunityRepo` — already present
- `endorsementRepo` — already present

No new entities, migrations, or module registrations are required.

---

## 12. Resolved Decisions

| # | Question | Resolution |
|---|---|---|
| 1 | **Policies with `sbu_id = NULL`** | **Excluded.** `AND policy.sbu_id = :sbuId` never matches NULL. No legacy fallback pass. |
| 2 | **`nature_of_bussiness_lid` filter** | **Retained unchanged.** The existing INSURANCE_ONLY filter continues alongside SBU scoping. |
| 3 | **`opportunity.sbu_id` column** | **Already exists** on the opportunity entity — no changes needed to the opportunity service or API. |
| 4 | **Admin management** | **Direct DB only.** No admin API endpoints. The flag and suppression rows are managed via SQL when required. |
| 5 | **Duplicate logic in two files** | **Consolidate into `ro-creation.utils.ts`.** The scheduler becomes a thin caller; all query and RO construction logic lives in the shared utility. |
| 6 | **ENV-based SBU filter (`RENEWAL_OPPORTUNITY_SBU_NAME`)** | **Replaced.** The ENV variable and the `innerJoin("users")`/`innerJoin("org_sbu")` on the owner's user record are removed entirely. SBU scope is now driven by the `is_ro_generation_enabled` DB flag. |
| 7 | **`ROForDefinedPolicySetFlag` / `PolicySetForRoCreation` path** | **Removed.** The flag parameter and the `PolicySetForRoCreation` branch are deleted from the utility. The new SBU-flag loop supersedes this mechanism. |
| 8 | **Endorsement RO sync — blocking vs non-blocking** | **Non-blocking.** The RO premium update is wrapped in `try/catch`; any failure is logged but does not interrupt the endorsement processing flow. |
| 9 | **Endorsement RO sync — new dependencies needed?** | **None.** `lookUpRepository`, `opportunityRepo`, and `endorsementRepo` are already injected into `EnrollmentUploadScheduler`. No new entities, migrations, or module changes required. |
