# Policy Configurator — Technical Requirements Document (Phase 2)

> **Feature:** Phase 2 — Dependent Attribute Parameter (`internalType: dependent-attribute`); Phase 2.1 — DependentCount "All" Category (Family Floater Per-Life Rater); Phase 2.2 — DA Premium Pro-ration & Batch Path Bug Fix
> **BRD Reference:** Policy-Configurator-BRD-v2.md (v2.3) — FR-054 through FR-063, BR-032 through BR-042
> **Date:** 14 July 2026
> **Status:** T-01 through T-13 — **Implemented**. T-14 — **Superseded** (original plan was incorrect — see T-15). T-15 — **Implemented** (batch path DA fix + debugger removal).

---

## 1. Overview

Phase 2 introduces the **Dependent Attribute** parameter type to Stage 4 of the Policy Configurator. This parameter:
- Targets a specific relation category (e.g., Parents, Children)
- Evaluates a custom range or list attribute on each enrolled dependent of that category
- Adds a per-dependent **additional premium** on top of the base policy option premium from Stage 5
- Does **not** expand the Cartesian product — Stage 5 policy option count is unchanged

**Business example:**
> Base policy option = ₹17,000 (Employee + Children + Spouse). Admin adds a "Dependent Attribute" parameter targeting Parents, `attributeKind: range`, bands: 51–60 → ₹5,000 / 61–70 → ₹8,000.
> Enrolment: Employee + Mother (58) + Father (65) → Total = ₹17,000 + ₹5,000 + ₹8,000 = **₹30,000**

---

## 2. Scope

### In-Scope (Phase 2)

- Stage 4 UI: new "Dependent Attribute" parameter type form component
- Stage 4 parameter state management, validation, and serialisation
- Backend constant for the new internal type
- Enrollment-time premium resolution for `dependent-attribute` parameters
- Per-dependent age-based resolution (range type with `targetAttributeName: "Age"`)

### Out-of-Scope (Phase 3 or later)

- Capture of list-type custom dependent attributes on the employee-facing enrollment form (ibp-service)
- Stage 6 Final Review display of Dependent Attribute parameter summaries
- Bulk premium import via Excel for Dependent Attribute bands

---

## 3. Data Model Changes

### 3.1 New TypeScript Interfaces

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/policytypes.ts`

```typescript
// Add after DependentCountBandConfig interface

interface DependentAttributeRangeBand {
  id: string;
  displayName: string;
  min: string;            // numeric string, inclusive lower bound
  max: string | null;     // numeric string, inclusive upper bound; null = unlimited
  companyAdditionalPremium: string;
  employeeAdditionalPremium: string;
}

interface DependentAttributeListOption {
  id: string;
  value: string;          // categorical string value the dependent record carries
  companyAdditionalPremium: string;
  employeeAdditionalPremium: string;
}

interface DependentAttributeDetailConfig {
  targetRelationCategory: string;   // "Self" | "Spouse/Partner" | "Children" | "Parents" | "Siblings"
  attributeKind: "range" | "list";
  targetAttributeName: string;      // e.g., "Age", "Health Tier"
  rangeBands: DependentAttributeRangeBand[];
  listOptions: DependentAttributeListOption[];
  nextBandId: number;
}
```

### 3.2 Update ConfiguredPolicyParameter

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/policytypes.ts`

```typescript
// Extend the type union:
type: "range" | "list" | "relation" | "dependent-count" | "dependent-attribute";

// Add optional field:
dependentAttributeConfig?: DependentAttributeDetailConfig;
```

### 3.3 New Backend Constant

**File:** `apps/services/service-lib/src/lib/constants.ts`

```typescript
export const DEPENDENT_ATTRIBUTE_INTERNAL_TYPE = "dependent-attribute";
```

Also add to the shared constants if duplicated in `libs/service-lib/src/lib/constants.ts`.

---

## 4. Implementation Tasks

### Task T-01 — Policy Parameter Master Entry

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/policytypes.ts`
**Description:** Add "Dependent Attribute" to the `PolicyParameterMaster` array so it appears in the Stage 4 parameter type dropdown.

```typescript
{
  name: "Dependent Attribute",
  type: "dependent-attribute",
  internalType: "dependent-attribute",
  repeatable: true,    // multiple DA params allowed per policy
}
```

**AC:** "Dependent Attribute" appears in the Stage 4 parameter-type dropdown. It can be added multiple times.

---

### Task T-02 — DependentAttributeDetailItem UI Component

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyParametersSection.tsx`
**Description:** Add a new sub-component `DependentAttributeDetailItem` rendered when `param.type === "dependent-attribute"`. Model it on the existing `DependentCountDetailItem` (~Line 516).

**UI layout:**

| Element | Notes |
|---|---|
| Target Relation Category (dropdown) | Options: Self, Spouse/Partner, Children, Parents, Siblings |
| Attribute Kind (radio/toggle) | Range \| List |
| Target Attribute Name (text input) | Free text, e.g., "Age" |
| Range bands table (shown when Kind = Range) | Columns: Band Name, Min Value, Max Value (blank = unlimited), Company Premium (₹), Employee Premium (₹), Remove |
| List options table (shown when Kind = List) | Columns: Option Value, Company Premium (₹), Employee Premium (₹), Remove |
| Add Band / Add Option button | Appends a new blank row |

**AC:** Switching Attribute Kind between Range and List shows/hides the correct table. Existing data is preserved when switching back.

---

### Task T-03 — Parameter State Management Handlers

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/hooks/usePolicyParametersManager.ts`

**Handlers to add:**

| Handler | Trigger | Action |
|---|---|---|
| `initDependentAttributeConfig` | Called from `handleAddConfiguredParameterWithSelection` when type is `dependent-attribute` | Initialises `dependentAttributeConfig` with empty `rangeBands: []`, `listOptions: []`, `nextBandId: 1` |
| `onDependentAttributeTargetCategoryChange(paramId, category)` | Target relation category dropdown | Updates `dependentAttributeConfig.targetRelationCategory` |
| `onDependentAttributeKindChange(paramId, kind)` | Attribute Kind toggle | Updates `dependentAttributeConfig.attributeKind`; clears `rangeBands` or `listOptions` for the other kind |
| `onDependentAttributeNameChange(paramId, name)` | Attribute Name input | Updates `dependentAttributeConfig.targetAttributeName` |
| `onAddDependentAttributeRangeBand(paramId)` | Add Band button (range) | Appends new band `{ id: "da-band-{nextBandId}", displayName: "", min: "", max: null, companyAdditionalPremium: "0", employeeAdditionalPremium: "0" }`; increments `nextBandId` |
| `onAddDependentAttributeListOption(paramId)` | Add Option button (list) | Appends new option `{ id: "da-opt-{nextBandId}", value: "", companyAdditionalPremium: "0", employeeAdditionalPremium: "0" }`; increments `nextBandId` |
| `onDependentAttributeBandChange(paramId, bandId, field, value)` | Any band cell edit | Updates the specified field on the matching range band |
| `onDependentAttributeOptionChange(paramId, optId, field, value)` | Any option cell edit | Updates the specified field on the matching list option |
| `onRemoveDependentAttributeBand(paramId, bandId)` | Remove button on range band row | Removes the band from `rangeBands` |
| `onRemoveDependentAttributeOption(paramId, optId)` | Remove button on list option row | Removes the option from `listOptions` |

**AC:** All state updates propagate correctly and do not mutate other parameters.

---

### Task T-04 — Stage 4 Validation

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/hooks/usePolicyParametersManager.ts`

**Location:** Inside `validateParameters`, add a new validation block for `param.type === "dependent-attribute"`.

**Validation rules:**

| Rule | Error message |
|---|---|
| `targetRelationCategory` is empty | "Target Relation Category is required" |
| `attributeKind` is not set | "Attribute Kind (Range or List) is required" |
| `targetAttributeName` is empty | "Attribute Name is required" |
| Range: no bands defined | "At least one range band is required" |
| Range: band `displayName` is empty | "Band name is required" |
| Range: band `min` is empty or non-numeric | "Minimum value must be a valid number" |
| Range: bands are overlapping | "Range bands must not overlap" |
| Range: bands have gaps | "Range bands must be contiguous (no gaps)" |
| Range: `companyAdditionalPremium` or `employeeAdditionalPremium` is negative | "Premium amounts must be ≥ 0" |
| List: no options defined | "At least one list option is required" |
| List: option `value` is empty | "Option value is required" |
| List: `companyAdditionalPremium` or `employeeAdditionalPremium` is negative | "Premium amounts must be ≥ 0" |

**Reuse** the existing `validateRangeDetails` overlap/gap checking logic (or extract it into a shared utility) for the Dependent Attribute range bands.

**AC:** All above conditions trigger field-level errors. Stage 4 cannot be completed while any error exists.

---

### Task T-05 — Cartesian Product Exclusion (Confirm)

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/hooks/usePolicyChoicesManager.ts`

**Description:** Verify that the existing `buildPolicyChoicesStructure` function handles unknown parameter types gracefully (skips them) and that a Dependent Attribute parameter does not generate new policy option dimensions.

**Expected behaviour:** The Cartesian product loop (`generateCombinations`) already filters by known types. Confirm the `dependent-attribute` type falls through the existing filter. If the filter is an allowlist, add `"dependent-attribute"` to the exclusion list explicitly.

**AC:** Adding a Dependent Attribute parameter to a policy with 3 existing options still produces exactly 3 options in Stage 5.

---

### Task T-06 — Backend Constant

**File:** `apps/services/service-lib/src/lib/constants.ts`

```typescript
export const DEPENDENT_ATTRIBUTE_INTERNAL_TYPE = "dependent-attribute";
```

**AC:** The constant is importable by `enrollment-processing.util.ts` and `per-dependent-resolution.util.ts`.

---

### Task T-07 — `resolveDependentAttributePremium` Utility

**File:** `apps/services/service-lib/src/lib/utils/per-dependent-resolution.util.ts`

**New function:**

```typescript
function resolveDependentAttributePremium(
  enrolledLives: EnrolledLife[],                // all enrolled lives (employee + dependents)
  parameter: DependentAttributeParameter,       // the DA parameter config
): { companyAdditional: number; employeeAdditional: number }
```

**Algorithm:**
1. Filter `enrolledLives` to those whose `relationCategory` matches `parameter.dependentAttributeConfig.targetRelationCategory`.
2. If no matching lives, return `{ companyAdditional: 0, employeeAdditional: 0 }`.
3. For each matching dependent:
   - If `attributeKind === "range"`:
     - If `targetAttributeName === "Age"`: compute age from dependent's DOB at enrolment date using existing age-resolution logic.
     - Iterate through `rangeBands` sorted by `min`. Match the first band where `min ≤ age ≤ max` (or `max === null` and `age ≥ min`).
     - If no band matches: throw an enrolment error ("Dependent attribute value [X] does not fall within any configured band for parameter [label]").
     - Accumulate `+companyAdditionalPremium` and `+employeeAdditionalPremium` for the matched band.
   - If `attributeKind === "list"`:
     - Look up dependent's value for `targetAttributeName` from their enrolment record.
     - Match against `listOptions` by exact string equality on `value`.
     - If no option matches: throw an enrolment error.
     - Accumulate premiums for the matched option.
4. Return total `{ companyAdditional, employeeAdditional }`.

**AC:** 
- Father (65) + Mother (58) with bands 51–60 → ₹5,000 and 61–70 → ₹8,000 returns `{ companyAdditional: 13000, employeeAdditional: 0 }`.
- No parents enrolled returns `{ companyAdditional: 0, employeeAdditional: 0 }`.
- Dependent with age outside all bands throws with a descriptive error.

---

### Task T-08 — Enrollment Processing Integration

**File:** `apps/services/service-lib/src/lib/utils/enrollment-processing.util.ts`

**Description:** After the base policy option premium is resolved (existing logic), detect and apply Dependent Attribute parameters.

**Location:** After the existing `applyToDependents` resolution block, before final premium assembly.

**Code pattern:**

```typescript
import { DEPENDENT_ATTRIBUTE_INTERNAL_TYPE } from "../constants";
import { resolveDependentAttributePremium } from "./per-dependent-resolution.util";

// --- Dependent Attribute additional premium ---
const dependentAttributeParams = (policyConfig?.parameters ?? []).filter(
  (p: any) =>
    p.internalType === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE ||
    p.type?.toLowerCase() === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE
);

for (const daParam of dependentAttributeParams) {
  const { companyAdditional, employeeAdditional } = resolveDependentAttributePremium(
    allEnrolledLives,  // the full enrolled lives array already available in scope
    daParam
  );
  choice.companyPay  = (choice.companyPay  ?? 0) + companyAdditional;
  choice.employeePay = (choice.employeePay ?? 0) + employeeAdditional;
  choice.premium     = choice.companyPay + choice.employeePay;
}
```

**AC:**
- Enrollment with a Dependent Attribute parameter: total premium = Stage 5 base + dependent-attribute additional.
- Enrollment with no Dependent Attribute parameters: behaviour unchanged from current implementation.
- Error thrown from `resolveDependentAttributePremium` propagates to the caller and blocks enrollment with a clear message.

---

---

## 4.1 Phase 2.1 — DependentCount "All" Category (Family Floater Per-Life Rater)

**BRD Reference:** FR-060, BR-038, BR-039
**Problem solved:** Insurers issue family-floater raters where each life's premium is looked up from a 2D table (SI slab × age band). The SI slab row depends on the total number of enrolled lives (not one specific relation category). The existing DependentCount parameter only supports targeting a single named category. This phase adds `"All"` as a valid target, enabling the 2D rater model to be configured via the existing Cartesian product mechanism combined with `applyToDependents: true` on the Age parameter.

---

### Task T-09 — DependentCount "All" UI Option

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyParametersSection.tsx`

**Change:** In `DependentCountDetailItem`, update `RELATION_CATEGORIES` (currently at line ~533) to include `"All"` as the first option:

```typescript
const RELATION_CATEGORIES = ["All", "Self", "Spouse/Partner", "Children", "Parents", "Siblings"];
```

Also add a conditional informational `Alert` (MUI, already imported) rendered immediately after the `CommonSelect` when `config.targetRelationCategory === "All"`:

```tsx
{config.targetRelationCategory === "All" && (
  <Alert severity="info" variant="outlined" sx={{ mt: 0.5, mb: 1 }}>
    Counts all enrolled lives (employee + all dependents). Use this for
    family-floater raters where the SI slab depends on total enrolled headcount.
  </Alert>
)}
```

**AC:**
- "All" appears first in the dropdown
- Selecting "All" renders the info alert
- Selecting any other category hides the alert
- Existing category options are unaffected

---

### Task T-10 — Backend Constant for "All" Category

**File:** `apps/services/service-lib/src/lib/constants.ts`

```typescript
export const DEPENDENT_COUNT_ALL_CATEGORY = "All";
```

Add directly after the existing `DEPENDENT_COUNT_INTERNAL_TYPE` constant (line ~2279).

**AC:** `DEPENDENT_COUNT_ALL_CATEGORY` is importable by `enrollment-processing.util.ts`.

---

### Task T-11 — Enrollment Resolution for "All" Category

**File:** `apps/services/service-lib/src/lib/utils/enrollment-processing.util.ts`

**Import:** Add `DEPENDENT_COUNT_ALL_CATEGORY` to the existing import from constants.

**Two code sites to modify** — both follow the identical pattern of computing `enrolledCount` by filtering dependents by `targetRelationCategory`. In both sites, prepend an `"All"` shortcut:

**Site 1** — `filterPolicyOptions` / choice-matching block (~line 1015–1029, 12-space indent):

```typescript
// Before (existing):
const enrolledCount = (dependents ?? []).filter((dep) => {
  const relNorm = (dep.relation ?? dep.relationshipType ?? "")
    .toLowerCase().trim().replace(/[^a-z]/g, "");
  return relNorm === targetNorm || ...;
}).length;

// After:
const enrolledCount =
  targetNorm === DEPENDENT_COUNT_ALL_CATEGORY.toLowerCase()
    ? 1 + (dependents ?? []).length          // employee + all dependents
    : (dependents ?? []).filter((dep) => {
        const relNorm = (dep.relation ?? dep.relationshipType ?? "")
          .toLowerCase().trim().replace(/[^a-z]/g, "");
        return relNorm === targetNorm || relNorm.includes(targetNorm) || targetNorm.includes(relNorm);
      }).length;
```

**Site 2** — `validateComponentChoices` / band-validation block (~line 1442–1452, 6-space indent): same replacement pattern.

**Note:** In both sites, `dependents` is the array of enrolled dependents (not including the employee). The employee is always exactly 1 additional life. Therefore `1 + dependents.length` is the correct total enrolled lives count.

**AC:**
- Employee alone: `dependents.length = 0` → `enrolledCount = 1`
- Employee + spouse + child: `dependents.length = 2` → `enrolledCount = 3`
- Employee + spouse + 2 children + 2 parents: `dependents.length = 5` → `enrolledCount = 6`
- Named-category parameters (Parents, Children) resolve using category filter as before — unchanged

---

### Task T-12 — Refactor `resolveDependentAttributePremium` to Return Per-Dependent Breakdown *(Phase 2.2)* — **IMPLEMENTED**

**File:** `apps/services/service-lib/src/lib/utils/per-dependent-resolution.util.ts`

**Problem:** The original implementation returned a single summed total `{ companyAdditional, employeeAdditional }`. Pro-ration downstream used the employee's effective date for the entire lump — incorrect when dependents enrolled on different dates.

**Actual implementation (differs from original plan):** Rather than an optional `returnPerDependent?: true` flag, the function was refactored to *always* return a `perDependent` array alongside the totals. The `DependentAttributePremiumResult` interface now includes:

```typescript
export interface DependentAttributePremiumResult {
  companyAdditional: number;
  employeeAdditional: number;
  perDependent: Array<{
    depRef: LifeRecord;
    companyAdditional: number;
    employeeAdditional: number;
  }>;
}
```

All existing callers that destructure only `{ companyAdditional, employeeAdditional }` continue to work unchanged — the added `perDependent` field is ignored. The `LifeRecord` interface was also updated to include `deletedAt?: Date | string | null` so the scheduler's `activeDependents` filter (`!(dep as any).deletedAt`) is type-safe.

**Implementation status:** Done. `perDependent` is always built and returned.

**Note:** `perDependent` is not yet consumed by `calculateProratedPremiumsForEnrollment` (T-13 deferred). It is available for future use.

---

### Task T-13 — DA Premium Pro-ration Inside `calculateProratedPremiumsForEnrollment` *(Phase 2.2)* — **IMPLEMENTED**

**File:** `apps/services/service-lib/src/lib/utils/enrollment-processing.util.ts`

**Context:** `calculateProratedPremiumsForEnrollment` is an inner function called during endorsement PDC computation. It computes `additionPremiumPortion` (incremental premium for newly added lives) and `deletionPremiumPortion` (refund for removed lives), used to derive `netPremium` and `grossPremium` for the endorsement.

**Architecture note:** C-4 and the scheduler DA block (T-15) remain — they bake DA into `choice.premium` for DB storage (first-time enrollment). T-13 is additive: it makes the endorsement PDC calculation accurate by pro-rating each dep's DA using their own `effectiveDate`/`deletedAt`, without double-counting (C-4 DA already in `choice.premium` applies to first-time enrollment, while T-13 applies only to mid-policy dep endorsements where the DA is incremental).

**Implementation:** Two additions to `enrollment-processing.util.ts`:

1. Before the `forEach` loop — compute `daParams` and `daRelationNameToTypeMap` once per enrollment:
```typescript
const daParams = policyConfig
  ? (policyConfig.parameters ?? []).filter(
      (p: any) =>
        p.internalType === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE ||
        p.type?.toLowerCase() === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE,
    )
  : [];
const daRelationNameToTypeMap = new Map<string, string>();
if (daParams.length > 0) {
  for (const rel of policyConfig?.relationships?.enabledPolicyRelations ?? []) {
    for (const opt of rel.configuredOptions ?? []) {
      if (opt.name) {
        daRelationNameToTypeMap.set(String(opt.name).toLowerCase().trim(), rel.type ?? "");
      }
    }
  }
}
```

2. Inside the `forEach` loop, after the PPL/non-PPL branches — DA pro-ration block for **non-PPL** choices only (the PPL per-dep loop already iterates with `dep.effectiveDate`; applying DA again would double-count):
```typescript
// Per-dep DA pro-ration: each dep's DA pro-rated by their own effectiveDate / deletedAt.
// Non-PPL only — PPL branch already iterates deps with their own effectiveDate.
if (daParams.length > 0 && !isPPL) {
  const endorsementDeps = (enrollment.employee?.dependents ?? []) as PolicyEnrollmentDependent[];
  for (const daParam of daParams) {
    try {
      const { perDependent } = resolveDependentAttributePremium(
        endorsementDeps as any[],
        daParam as DependentAttributeParam,
        additionEffectiveDate,
        daRelationNameToTypeMap,
      );
      for (const { depRef, companyAdditional, employeeAdditional } of perDependent) {
        const daTotal = companyAdditional + employeeAdditional;
        if (daTotal === 0) continue;
        const dep = depRef as PolicyEnrollmentDependent;
        const depHasClaim = hasReportedClaim(
          (dep as any).additionalParams?.claimStatus ?? (dep as any).claimStatus,
        );
        if (!dep.deletedAt) {
          const depAddDate = dep.effectiveDate
            ? new Date(dep.effectiveDate as any)
            : additionEffectiveDate;
          additionPremiumPortion += totalPolicyDays > 0
            ? Math.round(daTotal * applicableDaysFor(depAddDate) / totalPolicyDays * 100) / 100
            : daTotal;
        } else if (isProratedChoice && adjustedDeletionLivesCount > 0 && !depHasClaim) {
          const depDelDate = new Date(dep.deletedAt as any);
          deletionPremiumPortion += totalPolicyDays > 0
            ? Math.round(daTotal * applicableDaysFor(depDelDate) / totalPolicyDays * 100) / 100
            : 0;
        }
      }
    } catch {
      // DA resolution failure: skip this param, don't block endorsement
    }
  }
}
```

**Scope:** Applied only to endorsement PDC calculation. Does not change what is stored in `choice.premium` in the database.

**AC:**
- Father enrolled day 1 of 365-day policy, DA band ₹8,000, `proRationEnabled = true` → DA addition = ₹8,000 (365/365)
- Father enrolled on day 181 (185 remaining days), DA band ₹8,000, `proRationEnabled = true` → DA addition = ₹8,000 × 185/365 = ₹4,054.79
- Father deleted on day 181 (185 remaining days), `proRationEnabled = true`, no active claim → DA refund = ₹4,054.79
- Father deleted, `proRationEnabled = true`, active claim present → DA refund = ₹0
- `proRationEnabled = false` → DA full amount charged; deletion → DA refund = ₹0
- `policyConfig` is `undefined` (reporting call sites that omit it) → `daParams` is empty; DA block skipped; no regression
- Non-DA policy → `daParams` empty; zero overhead

---

### Task T-14 — Remove Flat DA Accumulation from Earlier Resolution Stages *(Phase 2.2)* — **SUPERSEDED by T-15**

**Status: Original plan was incorrect. Do NOT implement as written.**

**Original intent:** With T-13 in place, remove the flat DA blocks from `validateComponentChoices` (C-4) and from the scheduler's `processEnrollmentChoices`, since `calculateProratedPremiumsForEnrollment` would own DA resolution.

**Why this was wrong:** The original plan assumed `calculateProratedPremiumsForEnrollment` would be called by the IBP batch endpoint path in a way that passes `policyConfig`. Investigation revealed that the IBP batch endpoint (`POST /company-employee/policy/enrollment/batch`, resolved in `company-employee.service.ts`) calls `processEnrollmentData` with `skipValidations: true`, which bypasses `validateComponentChoices` entirely — so C-4 never runs for batch enrollments. With T-13 not implemented, removing C-4 without another DA mechanism in place would mean DA premiums are never applied on the batch path.

**The actual fix is T-15.** The correct architecture for Phase 2.2 keeps C-4 in place (for the direct UI path) and re-adds DA to the scheduler (for the batch path). T-14 can only be safely implemented once T-13 is in place and the `skipValidations: true` constraint is either resolved or bypassed in both paths.

---

### Task T-15 — Re-add DA to Scheduler Batch Path; Remove Debugger Statements *(Phase 2.2 Bug Fix)* — **IMPLEMENTED**

**Root cause of regression ("contribution is not summing up"):**

The IBP batch endpoint (`POST /company-employee/policy/enrollment/batch`) is processed in `apps/services/ibp-service/src/app/company-employee/company-employee.service.ts` (~line 6263). It calls:

```typescript
processEnrollmentData(dto, userId, true, { skipValidations: true }, endorsementId)
```

Inside `processEnrollmentData`, the validation gate is:

```typescript
if (submit && !options?.skipValidations) {
  await this.validateComponentChoices(...);   // C-4 runs here
}
```

With `skipValidations: true`, `validateComponentChoices` (and therefore C-4) is **never called** for batch-enrolled employees. The scheduler was sending base-only premiums to IBP, and IBP stored them without DA. The UI/direct path worked correctly because it goes through `processEnrollmentData(skipValidations: false)` → C-4 runs → DA added.

**Dual-path DA architecture (implemented):**

| Path | How DA is computed |
|---|---|
| Direct UI: `POST /policy/enrollment` | `processEnrollmentData(skipValidations=false)` → `validateComponentChoices` → C-4 adds DA to `choice.premium` |
| Batch/scheduler: scheduler → `POST /policy/enrollment/batch` | `processEnrollmentChoices` DA block adds DA to `matchedComponents.premium` → IBP batch endpoint stores with DA (`skipValidations=true`, C-4 skipped) |

The two paths are mutually exclusive — no double-counting.

**Changes made in `enrollment-upload.scheduler.ts` (`processEnrollmentChoices`):**

1. **Removed 2 `debugger` statements** from the body of `processEnrollmentChoices`
2. **Removed 1 `debugger` statement** from `filterPolicyOptions`
3. **Added DA computation block** (mirrors C-4 exactly) before `return { matchedComponents, invalidComponents }`:

```typescript
// C-4 equivalent: Apply DA additive premiums.
// IBP batch endpoint uses skipValidations=true → validateComponentChoices bypassed.
// DA must be resolved here so matchedComponents.premium already includes DA.
const daParams = (policyConfig.parameters ?? []).filter(
  (p: any) =>
    p.internalType === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE ||
    p.type?.toLowerCase() === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE,
);
if (daParams.length > 0 && matchedComponents.length > 0) {
  const relationNameToTypeMap = new Map<string, string>();
  for (const rel of policyConfig.relationships?.enabledPolicyRelations ?? []) {
    for (const opt of rel.configuredOptions ?? []) {
      if (opt.name) {
        relationNameToTypeMap.set(String(opt.name).toLowerCase().trim(), rel.type ?? "");
      }
    }
  }
  const effectiveDate = (employeeDetails as any).effectiveDate ?? null;
  const activeDependents = dependents.filter((dep) => !(dep as any).deletedAt);
  for (const daParam of daParams) {
    try {
      const { companyAdditional, employeeAdditional } = resolveDependentAttributePremium(
        activeDependents,
        daParam as DependentAttributeParam,
        effectiveDate,
        relationNameToTypeMap,
      );
      if (companyAdditional !== 0 || employeeAdditional !== 0) {
        for (const mc of matchedComponents) {
          mc.companyPay  = (mc.companyPay  ?? 0) + companyAdditional;
          mc.employeePay = (mc.employeePay ?? 0) + employeeAdditional;
          mc.premium     = (mc.premium     ?? 0) + companyAdditional + employeeAdditional;
        }
      }
    } catch (daErr) {
      throw new BadRequestException(
        daErr instanceof Error
          ? daErr.message
          : `Dependent attribute premium resolution failed for parameter "${(daParam as any).label ?? (daParam as any).displayName}"`,
      );
    }
  }
}
```

**Additional imports added to `enrollment-upload.scheduler.ts`:**
- `resolveDependentAttributePremium` and `DependentAttributeParam` from `per-dependent-resolution.util`
- `DEPENDENT_ATTRIBUTE_INTERNAL_TYPE` from `service-lib/constants`

**AC:**
- Employee enrolled via scheduler batch path has DA included in `matchedComponents.premium`
- Employee enrolled via direct IBP call has DA included via C-4 in `validateComponentChoices`
- Both paths produce identical `choice.premium` values for the same enrollment configuration
- Soft-deleted dependents (`deletedAt` set) are excluded from DA computation on the batch path (via `activeDependents` filter)
- No `debugger` statement remains in `enrollment-upload.scheduler.ts`

---

## 5. File Impact Summary

| File | Change type | Task(s) |
|---|---|---|
| `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/policytypes.ts` | Modify | T-01, types |
| `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyParametersSection.tsx` | Modify | T-02 |
| `apps/ui/iwork/src/app/pages/PolicyPage/hooks/usePolicyParametersManager.ts` | Modify | T-03, T-04 |
| `apps/ui/iwork/src/app/pages/PolicyPage/hooks/usePolicyChoicesManager.ts` | Verify / minor modify | T-05 |
| `apps/services/service-lib/src/lib/constants.ts` | Modify | T-06 |
| `apps/services/service-lib/src/lib/utils/per-dependent-resolution.util.ts` | Modify | T-07 |
| `apps/services/service-lib/src/lib/utils/enrollment-processing.util.ts` | Modify | T-08 |
| `libs/service-lib/src/lib/constants.ts` | Verify / modify | T-06 (if applicable) |
| `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyParametersSection.tsx` | Modify | T-09 (Phase 2.1) |
| `apps/services/service-lib/src/lib/constants.ts` | Modify | T-10 (Phase 2.1) |
| `apps/services/service-lib/src/lib/utils/enrollment-processing.util.ts` | Modify | T-11 (Phase 2.1) |
| `apps/services/service-lib/src/lib/utils/per-dependent-resolution.util.ts` | Modify | T-12 ✓ — `perDependent` always returned; `LifeRecord.deletedAt` added |
| `apps/services/service-lib/src/lib/utils/enrollment-processing.util.ts` | Modify | T-13 ✓ — `daParams` pre-computed before forEach; DA pro-ration block added inside forEach (non-PPL choices) |
| `apps/services/service-lib/src/lib/utils/enrollment-processing.util.ts` | No change | T-14 ✗ — superseded; C-4 kept intentionally |
| `apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts` | Modify | T-14 ✗ — superseded; T-15 ✓ — DA block re-added; 3 `debugger` statements removed |

---

## 6. Verification & Testing

### Manual Verification Scenarios

| # | Scenario | Expected Result |
|---|---|---|
| V-01 | Add a Dependent Attribute parameter (range, target: Parents, attributeName: Age, bands: 51–60 → ₹5,000 / 61–70 → ₹8,000) in Stage 4 | Validation passes; Stage 5 shows same options as before; no new policy options added |
| V-02 | Enrol Employee + Father (65) + Mother (58) | Total = Base Premium + ₹8,000 + ₹5,000 |
| V-03 | Enrol Employee + Spouse only (no parents) | Total = Base Premium only; no additional premium |
| V-04 | Enrol Employee + Father (65) with only band 51–60 configured; 65 is out of range | Enrolment blocked with a band-not-found validation error |
| V-05 | Configure DA parameter with overlapping range bands (51–60 and 58–70) | Stage 4 validation rejects with overlap error |
| V-06 | Configure DA parameter with gap in range bands (51–60 and 62–70) | Stage 4 validation rejects with gap error |
| V-07 | Add two DA parameters (Parents age-range + Children health-tier list) | Both are evaluated independently; total additional premium = sum from both parameters |
| V-08 | Add a DA parameter to a policy that already has Age + Grade parameters (6 existing options in Stage 5) | Stage 5 still shows exactly 6 options; DA parameter does not add new dimensions |
| V-09 | Configure DA parameter with `attributeKind: list`, option "High Risk" → ₹4,000; enrol dependent with attribute value "High Risk" | ₹4,000 additional premium applied |
| V-10 | Remove the last range band from a DA parameter and try to complete Stage 4 | Validation error: "At least one range band is required" |

### Phase 2.1 Verification Scenarios (DependentCount "All")

| # | Scenario | Expected Result |
|---|---|---|
| V-11 | DependentCount "All" parameter with bands (1→SI 200K, 2→SI 300K, 3→SI 400K, 4+→SI 500K) + Age (9 bands, `applyToDependents: true`): verify Stage 5 generates 36 options | Exactly 36 policy options generated |
| V-12 | Employee (age 36) alone: DependentCount "All" count = 1 → 1-life band matches | Resolves to SI 200K slab; premium = rater[200K][36-45] |
| V-13 | Employee (36) + Spouse (24) + Child (3): count = 3 → 3-lives band | Resolves to SI 400K slab; total = rater[400K][36-45] + rater[400K][00-25] + rater[400K][00-25] = 9302.55 + 4442.21 + 4442.21 = **₹18,186.97** |
| V-14 | Same family + Child 2 (age 7) added: count = 4 → 4+ band | Resolves to SI 500K slab; each life re-resolved at 500K row |
| V-15 | Named-category DependentCount (Parents) and DependentCount "All" coexist on same policy | Both parameters participate in Cartesian product independently; no interference |
| V-16 | DependentCount "All" with gap in bands (e.g., 1–1 and 3–99, missing count 2) | Stage 4 validation rejects with gap error (FR-045 applies) |

### Phase 2.2 Verification Scenarios (Batch Path DA Fix — T-15)

| # | Scenario | Expected Result |
|---|---|---|
| V-17 | Enrol Employee + Father (65) via **scheduler batch path** (enrollment-upload.scheduler sends to IBP batch endpoint), DA band ₹8,000 | `matchedComponents.premium` = Base + ₹8,000; stored `choice.premium` includes DA |
| V-18 | Same policy: Enrol Employee + Father (65) via **direct UI** (`POST /policy/enrollment`) | `choice.premium` = Base + ₹8,000 (added by C-4); matches V-17 result exactly |
| V-19 | Batch path enrollment: dependent with `deletedAt` set (soft-deleted) present in dependents array | Soft-deleted dependent excluded from DA computation via `activeDependents` filter; no DA attributed to deleted dep |
| V-20 | Scheduler processes enrollment with no DA parameters on the policy | DA block skipped (empty `daParams` filter); `matchedComponents` unchanged |

### Integration Checks

- [ ] Existing `applyToDependents` enrolments unaffected by DA parameter changes
- [ ] Existing `DependentCount` enrolments unaffected
- [ ] Policy without any DA parameters behaves identically to pre-Phase 2 behaviour
- [ ] `DEPENDENT_ATTRIBUTE_INTERNAL_TYPE` constant imported correctly in both util files
- [ ] No `debugger` statement in `enrollment-upload.scheduler.ts` (`processEnrollmentChoices`, `filterPolicyOptions`)

---

## 7. Dependencies & Blockers

| Item | Status | Notes |
|---|---|---|
| Phase 3 — List-type attribute capture on enrollment form | Not started | Required for `attributeKind: list` to work end-to-end; Phase 2 backend wires the resolution logic but the dependent record attribute field may not be populated until Phase 3 |
| Existing `resolveOptionIdForLife` age-resolution logic | Available | Reuse DOB-to-age computation from `per-dependent-resolution.util.ts` |
| `validateRangeDetails` overlap/gap logic | Available | Reuse or extract from `usePolicyParametersManager.ts` for DA range band validation |

---

## 8. Open Questions (Technical)

| # | Question | Owner |
|---|---|---|
| TQ-01 | Should the DA parameter additional premium be applied per-component (base, parental, add-on separately) or only to the base component? Current design assumes it is applied at the component level for whichever component the choice is being resolved. | Engineering |
| TQ-02 | For `attributeKind: list`, where exactly in the dependent enrolment record is the custom attribute stored? Which column or JSON field does the resolver look up? | Engineering / Data |
| TQ-03 | Should `resolveDependentAttributePremium` throw hard (block enrolment) or return 0 + warn (allow enrolment) when a dependent's attribute falls outside all configured bands? Current spec says hard-throw. | Product |
| TQ-04 | ~~How does pro-ration interact with DA additional premiums? Is the additional premium also prorated, or is it charged in full regardless of the enrolment date?~~ **RESOLVED:** DA premiums follow the same `proRationEnabled` gate as the component's base premium. When `true`, each dependent's DA premium is pro-rated using that dependent's own effective enrollment date and deletion date — NOT the employee's effective date. Resolution: implement per-dependent DA pro-ration inside `calculateProratedPremiumsForEnrollment` (Task T-13). See FR-061/FR-062/FR-063 and BR-040/BR-041/BR-042 in BRD v2.2. | **Closed** |
| TQ-05 | When a DependentCount "All" parameter is active and a dependent is added mid-policy (endorsement), the SI slab may shift (e.g., 3→4 lives). The premium delta between the old slab and new slab for existing enrolled lives must be reconciled. Does the existing endorsement pro-ration logic in `enrollment-processing.util.ts:2889–3006` handle this automatically, or does it need a fix? | Engineering |
| TQ-06 | Should the `siEnhancement` on DependentCount "All" bands be cumulative (e.g., band-1 = 0, band-2 = +100K, band-3 = +200K) or delta-only (i.e., +100K per member regardless of band)? Current design assumes the admin enters explicit enhancement values per band (same as existing DependentCount). Confirm with Product. | Product |
| TQ-07 | ~~T-13 deferred — per-dep DA pro-ration pending.~~ **RESOLVED:** T-13 implemented (14 July 2026). DA is now pro-rated per dep's own `effectiveDate`/`deletedAt` inside `calculateProratedPremiumsForEnrollment` for non-PPL choices. PPL + DA interaction uses an approximation (the per-dep loop in the PPL branch already iterates with dep effectiveDate; correcting PPL `choicePremium` DA contamination requires the full dep history and is a separate concern). | **Closed** |

---

*Document updated: 14 July 2026 — T-01 through T-15 implemented; T-12 (always-perDependent); T-13 (per-dep DA pro-ration in calculateProratedPremiumsForEnrollment, non-PPL); T-14 superseded; T-15 (batch path DA fix + debugger removal); V-17 through V-20 added; TQ-07 closed*
