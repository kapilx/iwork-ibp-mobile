# Spec: SBU-Driven Renewal Opportunity Creation with Policy Type Suppression

**Feature:** Enhance `handlePoliciesCloseToExpiry` to scope RO creation by SBU flag and suppress specific policy types per SBU  
**Services:** `scheduler-service`, `service-lib` (shared utility)  
**Date:** 2026-05-04

---

## 1. Background

The `handlePoliciesCloseToExpiry` logic runs daily and creates a Renewal Opportunity (RO) for every policy expiring within the next 365 days. This gives the renewal team enough lead time to initiate renewals before a policy lapses.

**Current behaviour:**

1. Computes `thresholdDate = today + 365 days`
2. Queries policies where `policy_to BETWEEN now AND thresholdDate`
3. Excludes policies that already have a linked RO (`ref_policy_id` present in `opportunity`)
4. Excludes policies where `nature_of_bussiness_lid ≠ INSURANCE_ONLY` (and not NULL)
5. Processes in batches (`DEFAULT_RO_CRON_BATCH_SIZE`)
6. For each qualifying policy → calls `createRenewalOpportunity` with the constructed RO payload

**Problems:**

- No SBU-level control — the job runs against all policies regardless of which SBU they belong to
- No way to suppress RO creation for a specific policy type within a specific SBU without a code change
- The same logic is duplicated across two files (see Section 2)

**Decisions made:**

| Question | Decision |
|---|---|
| Policies with `sbu_id = NULL` | **Excluded** — only policies with a valid `sbu_id` are processed; no legacy fallback pass |
| `nature_of_bussiness_lid` filter | **Retained** — existing `INSURANCE_ONLY` filter stays active alongside SBU scoping |
| `opportunity.sbu_id` column | **Already exists** — no changes needed to the opportunity entity or API |
| Admin management of config/suppression | **Direct DB only** — no admin API endpoints; changes made via SQL when required |

---

## 2. Code Architecture — Single Source of Truth

The RO creation logic currently exists in **two places** that must be consolidated:

| File | Role | Current SBU handling |
|---|---|---|
| `libs/service-lib/src/lib/utils/ro-creation.utils.ts` | **Shared utility** — canonical implementation. Uses a `deps` injection pattern (`RoCreationDeps`). | Filters by SBU via a JOIN on the policy owner's user record + `ENV.RENEWAL_OPPORTUNITY_SBU_NAME` (ENV-driven, hardcoded SBU name) |
| `apps/services/scheduler-service/src/app/scheduler/opportunity-status.scheduler.ts` | **Scheduler** — should be a thin caller only | Duplicate inline implementation; flat query with no SBU filtering |

**Target architecture after this change:**

```
OpportunityStatusScheduler.handlePoliciesCloseToExpiry()
  │
  └─ calls → handlePoliciesCloseToExpiry(deps)   ← ro-creation.utils.ts
               (all logic lives here)
```

- The **utility** (`ro-creation.utils.ts`) owns all policy fetching, SBU loop, suppression filtering, and RO construction
- The **scheduler** only assembles the `deps` object (repositories, logger, `createRenewalOpportunity` callback) and delegates — no duplicate query logic
- The ENV-based SBU filter (`RENEWAL_OPPORTUNITY_SBU_NAME`) in the utility is **replaced** by the `is_ro_generation_enabled` flag-driven approach

---

## 3. Data Model Changes

### 3.1 Add `is_ro_generation_enabled` to `org_sbu` — **NEW column**

**DB migration:**

```sql
ALTER TABLE org_sbu
  ADD COLUMN is_ro_generation_enabled BOOLEAN NOT NULL DEFAULT FALSE;
```

**Entity change** (`service-lib/src/lib/entities/org-sbu.entity.ts`):

```typescript
@Column({
  name: "is_ro_generation_enabled",
  type: "boolean",
  default: false,
})
isRoGenerationEnabled: boolean;
```

### 3.2 New suppression table: `sbu_ro_policy_type_suppression` — **NEW table**

Stores `(sbu_id, policy_type_lid)` pairs for which RO generation must be **skipped**. Acts as a denylist — if a row exists for a pair, no ROs are created for policies of that type within that SBU.

| Entity field    | DB column         | Type          | Nullable | Notes                          |
|-----------------|-------------------|---------------|----------|--------------------------------|
| `id`            | `id`              | `int`         | No       | Primary key, auto-increment    |
| `sbuId`         | `sbu_id`          | `int`         | No       | FK → `org_sbu.id`              |
| `policyTypeLid` | `policy_type_lid` | `int`         | No       | FK → `look_up.id`              |
| `createdBy`     | `created_by`      | `int`         | No       | FK → `user.user_id`            |
| `updatedBy`     | `updated_by`      | `int`         | Yes      | FK → `user.user_id`            |
| `createdAt`     | `created_at`      | `timestamptz` | No       | Auto-set on insert             |
| `updatedAt`     | `updated_at`      | `timestamptz` | No       | Auto-set on update             |

**Unique constraint:** `(sbu_id, policy_type_lid)`

**TypeORM entity** (`service-lib/src/lib/entities/sbu-ro-policy-type-suppression.entity.ts`):

```typescript
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

**Migration:**

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

### 3.3 Existing entities — no changes required

- `policy.entity.ts` — `sbuId`, `organisationId`, `verticalId`, `departmentId`, `branchId` already present
- `opportunity.entity.ts` — `sbuId`, `organisationId`, `verticalId`, `departmentId`, `branchId` already present

---

## 4. Updated `RoCreationDeps` Interface

The shared utility's dependency interface gains two new repositories:

```typescript
export interface RoCreationDeps {
  traceId:                              string;
  logger:                               any;
  lookUpRepository:                     Repository<LookUp>;
  policyRepository:                     Repository<Policy>;
  policyTypeSegregationRepository:      Repository<PolicyTypeSegregation>;
  orgSbuRepository:                     Repository<OrgSbu>;              // NEW
  sbuRoPolicyTypeSuppressionRepository: Repository<SbuRoPolicyTypeSuppression>; // NEW
  createRenewalOpportunity:             (opportunity: Partial<Opportunity>) => Promise<void>;
}
```

---

## 5. Detailed Flow

The entire flow lives in `ro-creation.utils.ts`. The scheduler is a thin caller.

```
[Scheduler] handlePoliciesCloseToExpiry()
│
├─ Guard: HANDLE_RENEWAL_OPPORTUNITY_CRON env flag enabled? No → return
├─ Assemble deps (repositories + createRenewalOpportunity callback)
└─ await handlePoliciesCloseToExpiry(deps)   ← delegates to utility

[Utility] handlePoliciesCloseToExpiry(deps)
│
├─ Fetch required lookups:
│    optyTypeRO                    (OPPORTUNITY_TYPE.RO)
│    isPolicyMined                 (MINED_POLICY)
│    natureOfBusinessInsuranceOnly (NATURE_OF_BUSSINESS / INSURENCE_ONLY)
│  Any missing → log error, return
│
├─ Compute date window:
│    now           = new Date()
│    thresholdDate = now + ONE_YEAR_IN_DAYS
│
├─ Fetch all SBUs where is_ro_generation_enabled = true          ← NEW
│    orgSbuRepository.find({ where: { isRoGenerationEnabled: true } })
│  No enabled SBUs → log info, return
│
└─ For each enabled SBU:                                         ← NEW outer loop
   │
   ├─ Fetch suppressed policy_type_lid values for this SBU       ← NEW
   │    sbuRoPolicyTypeSuppressionRepository.find({ where: { sbuId: sbu.id } })
   │    → suppressedIds: number[]
   │
   ├─ Build WHERE clause:
   │    policy.policy_to BETWEEN :now AND :thresholdDate
   │    AND NOT EXISTS (
   │      SELECT 1 FROM opportunity
   │      WHERE opportunity_type_lid = :optyTypeRO
   │        AND ref_policy_id = policy.id
   │    )
   │    AND (nature_of_bussiness_lid = :insuranceOnlyId OR NULL)
   │    AND policy.sbu_id = :sbuId
   │    [AND policy.policy_type_lid NOT IN (:...suppressedIds)]   ← omit if empty
   │
   ├─ Count qualifying policies (for batch pagination)
   │
   └─ For each batch (offset += DEFAULT_RO_CRON_BATCH_SIZE):
      │
      ├─ Fetch policies with WHERE clause above
      │  ORDER BY policy.policy_to ASC, LIMIT batchSize OFFSET offset
      │
      ├─ Resolve policy type mappings via PolicyTypeSegregation
      │
      └─ For each policy → createRenewalOpportunity({
           opportunityTypeLid:           optyTypeRO.id,
           companyId:                    policy.companyId,
           policyTypeLid:                mappingMap.get(policy.policyTypeLid)
                                           ?? policy.policyTypeLid,
           refPolicyId:                  policy.id,
           estimatedBrokerage:           policy.basicBrokerageAmount,
           estimatedBrokeragePercentage: policy.basicBrokeragePercentage,
           premiumPaid:                  policy.grossPremium ?? 0,
           expiryDate:                   policy.policyTo,
           sumInsured:                   policy.sumInsured,
           estimatedFee:                 policy.feeAmount ?? 0,
           ownerId:                      policy.ownerId ?? policy.createdBy,
           isPolicyMinedLid:             isPolicyMined.id,
           organisationId:               policy.organisationId,   ← carry-through
           sbuId:                        policy.sbuId,            ← carry-through
           verticalId:                   policy.verticalId,       ← carry-through
           departmentId:                 policy.departmentId,     ← carry-through
           branchId:                     policy.branchId,         ← carry-through
         })
         On error → log policyId + error, continue to next policy
```

---

## 6. Opportunity Object Fields

All five organisational context fields must be carried through from `policy` → `opportunity` on every RO creation path:

| Field            | Source on `policy` | Destination on `opportunity` | Already in utility? |
|------------------|--------------------|------------------------------|---------------------|
| `organisationId` | `policy.organisationId` | `opportunity.organisationId` | ✅ Yes (line 238) |
| `sbuId`          | `policy.sbuId`      | `opportunity.sbuId`          | ✅ Yes (line 239) |
| `verticalId`     | `policy.verticalId` | `opportunity.verticalId`     | ✅ Yes (line 240) |
| `departmentId`   | `policy.departmentId` | `opportunity.departmentId` | ✅ Yes (line 241) |
| `branchId`       | `policy.branchId`   | `opportunity.branchId`       | ✅ Yes (line 242) |

The scheduler's inline duplicate also sets all five fields correctly. Once the scheduler is refactored to delegate to the utility, these fields are carried through consistently by the utility alone.

---

## 7. Query Changes

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

### Per-SBU batch query

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
```

> **Note:** The dedup check uses `NOT EXISTS` (consistent with the utility's existing pattern) rather than the `NOT IN` sub-query used in the scheduler's current inline code.

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

## 9. Edge Cases & Guards

| Scenario | Handling |
|---|---|
| No SBUs have `is_ro_generation_enabled = true` | Log info: `"No SBUs enabled for RO generation"`, return early |
| An enabled SBU has no suppression rows | `suppressedIds = []` — `NOT IN` clause omitted; all policy types processed |
| An enabled SBU has all policy types suppressed | Count = 0 for that SBU; batch loop skipped, log info |
| RO creation fails for a policy | Log error with `policyId`; continue to next policy |
| Policy already has a linked RO | Excluded by `NOT EXISTS` dedup check |
| Policy `sbu_id = NULL` | Excluded by design — `AND policy.sbu_id = :sbuId` won't match NULL |
| Scheduler login or user lookup fails | Existing error handling — log + throw `BadRequestException` |

---

## 10. Logging

| Event | Level | Message template |
|---|---|---|
| No enabled SBUs | `info` | `No SBUs enabled for RO generation. Skipping.` |
| Enabled SBUs loaded | `info` | `Found {n} SBU(s) enabled for RO generation` |
| SBU processing start | `info` | `Processing SBU id={id} name={name}, suppressed policyTypes={suppressedIds}` |
| Batch fetched | `info` | `Fetched {n} policies in batch at offset {offset} for SBU id={id}` |
| SBU complete | `info` | `Completed SBU id={id}: {success}/{total} ROs created` |
| RO creation failure | `error` | `Failed to create RO for policyId={id}, sbuId={sbuId}: {error.message}` |

---

## 11. Affected Files

| File | Change Type | Description |
|---|---|---|
| `service-lib/src/lib/entities/org-sbu.entity.ts` | **Update** | Add `isRoGenerationEnabled` boolean column (default `false`) |
| `service-lib/src/lib/entities/sbu-ro-policy-type-suppression.entity.ts` | **New file** | TypeORM entity for the suppression table |
| `service-lib/src/lib/entities/index.ts` | **Update** | Export `SbuRoPolicyTypeSuppression` and `OrgSbu` (if not already exported) |
| `libs/service-lib/src/lib/utils/ro-creation.utils.ts` | **Update** | Replace ENV-based SBU filter with `is_ro_generation_enabled` flag loop; add suppression query; extend `RoCreationDeps` with two new repositories; remove `ROForDefinedPolicySetFlag` path if superseded |
| `scheduler-service/.../opportunity-status.scheduler.ts` | **Refactor** | Remove duplicate inline `handlePoliciesCloseToExpiry` implementation; inject `OrgSbu` + `SbuRoPolicyTypeSuppression` repositories; assemble `deps` and delegate to `ro-creation.utils.ts` |
| `scheduler-service` module file | **Update** | Register `OrgSbu` and `SbuRoPolicyTypeSuppression` in `TypeOrmModule.forFeature([...])` |
| DB migration | **New file** | `ALTER TABLE org_sbu ADD COLUMN is_ro_generation_enabled`; `CREATE TABLE sbu_ro_policy_type_suppression` |

No changes required to:
- The opportunity service API endpoint
- The cron schedule or `HANDLE_RENEWAL_OPPORTUNITY_CRON` env flag
- Any other scheduler jobs
- `policy.entity.ts` or `opportunity.entity.ts` — all required fields already present

---

## 12. Resolved Decisions

| # | Question | Resolution |
|---|---|---|
| 1 | **Policies with `sbu_id = NULL`** | **Excluded.** Only policies with a valid `sbu_id` belonging to an SBU with `is_ro_generation_enabled = true` are processed. No legacy fallback pass. |
| 2 | **`nature_of_bussiness_lid` filter** | **Retained unchanged.** The existing `INSURANCE_ONLY` filter continues to apply alongside SBU scoping. |
| 3 | **`opportunity.sbu_id` column** | **Already exists** on the opportunity entity — no changes needed to the opportunity service or its API. |
| 4 | **Admin management** | **Direct DB only.** No admin API endpoints. The `is_ro_generation_enabled` flag and suppression rows are managed via SQL scripts when required. |
| 5 | **Duplicate logic in two files** | **Consolidate into `ro-creation.utils.ts`.** The scheduler becomes a thin caller; all query and construction logic lives in the shared utility. |

---

## 13. Endorsement-Triggered RO Premium Update

### Background

When an endorsement is processed that modifies the premium of a policy (via the `endorsement` / `policy_asset_endorsement` tables), any linked Renewal Opportunity (RO) would otherwise hold the stale premium from when it was first created. This causes the RO to misrepresent the actual renewal premium the broker should be quoting.

This requirement ensures that whenever an endorsement is processed, the RO for that policy is immediately updated with the recalculated total premium.

### Trigger

This update fires within the enrollment upload processing flow — specifically in the bypass mode endorsement update path — after the endorsement premium aggregation is written to the endorsement record.

### Behavior

1. After the endorsement record is updated with aggregated premiums (bypass mode):
2. Look up the `OPPORTUNITY_TYPE.RO` value from the `look_up` table
3. Find the existing RO linked to the policy: `opportunityTypeLid = roLookup.id` AND `refPolicyId = policy.id`
4. If an RO exists:
   - Sum all `grossPremium` values from the `endorsement` table for the policy
   - Calculate: `newPremiumPaid = policy.grossPremium + SUM(endorsement.grossPremium)`
   - Update `opportunity.premiumPaid = newPremiumPaid`
5. If no RO exists: skip silently — no update is performed
6. Any error during this step: log the error with `policyId` and continue — this update is non-blocking and must not interrupt the main endorsement processing flow

### Premium Calculation

```
newPremiumPaid = policy.grossPremium + SUM(endorsement.grossPremium WHERE endorsement.policyId = policy.id)
```

Both components default to `0` if null/undefined.

### Edge Cases

| Scenario | Handling |
|---|---|
| No RO linked to the policy | Skip silently — no update performed |
| `OPPORTUNITY_TYPE.RO` lookup not found | Skip silently — guard on `roLookup` presence |
| Endorsement table has no rows for policy | Sum treated as `0`; `newPremiumPaid = policy.grossPremium` |
| `policy.grossPremium` is null | Treated as `0` — `Number(null ?? 0)` |
| Update operation fails | Log error with `policyId` + `error.message`; continue (non-blocking) |

### Affected File

| File | Change Type | Description |
|---|---|---|
| `scheduler-service/.../enrollment-upload.scheduler.ts` | **Update** | After endorsement bypass update: look up RO, recalculate premium, update `opportunity.premiumPaid` |
