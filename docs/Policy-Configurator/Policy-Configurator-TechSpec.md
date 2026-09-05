# Policy Configurator — Technical Specification (Incremental Updates)

**Feature:** Policy Configurator — Benefit/Waiver Component, Dependent Count Parameter & applyToDependents
**BRD Reference:** Policy-Configurator-BRD.md (FR-042 through FR-053; BR-024 through BR-031)
**Spec Reference:** Policy-Configurator-Product-Spec.md (updated 26 May 2026)
**Date:** 2026-05-26
**Status:** Draft

---

## 1. Overview

This document covers four new capabilities added to the existing six-stage **Policy Configurator** wizard:

0. **Optional Component SI=0 Unconditional Acceptance (NEW — FR-054)** — For any component whose `type === "optional"`, a Sum Insured value of `0` MUST be accepted everywhere (Stage 1 configuration, Stage 5 choice selection, enrollment-time validation in ibp-service, batch upload premium calculation, and bypass-mode aggregation) **irrespective of any other condition** — without requiring `isBenefitComponent=true`, without locking Stage 5 contributions, and without raising "sum insured must be positive" errors during the inception/enrollment flow. This generalises the FR-048 benefit-component carve-out: it removes the SI-positivity precondition for *all* optional components, not just benefit ones.

    **FR-054.1 — Blank SI ⇒ 0 for optional components**: a blank/empty SI input on an optional component is treated as `0`. The Stage 1 SI input does not flag "SI Amount must be > 0" when left empty; on blur the value is normalised to the string `"0"` so downstream persistence, premium calculation, and enrollment all see a numeric value (never an empty string). Base / parental components retain the existing "blank is invalid" behaviour.

    See §11 for the full impact analysis.

1. **Benefit/Waiver Component (`isBenefitComponent`)** — Allows an optional (add-on) component to be designated as a fixed-charge benefit (e.g., Co-pay Waiver). Stage 5 contribution fields remain fully editable for benefit components when `isAvailable: true`.

    **FR-054.3 — `isBenefitComponent` is a pure semantic marker (UPDATED, supersedes FR-054.2)**: all UI locks and backend value constraints previously tied to the flag have been removed. A waiver-flagged component now behaves exactly like any other optional component:

    - SI model toggle (FLAT / MULTIPLE) is **editable**.
    - "Add Sum Insured" `+` button is **shown** — multiple SI options are permitted.
    - SI input is **editable**; blank falls back to `0` per FR-054.1; any non-negative value is accepted (FR-054).
    - Toggling the flag does NOT mutate `sumInsuredModel` or `sumInsuredOptions` — only the boolean flag flips.

    Backend validation is reduced to a single rule: **ERR-BC-001** — the flag may only be set on `type === "optional"` components. **ERR-BC-002** (FLAT lock) and **ERR-BC-003** (single SI option / value=0) are **removed**; the existing optional-component rules (FR-054, FR-054.1) govern SI shape and values.

    The `BENEFIT_COMPONENT_SI_VALUE` constant is no longer referenced by validation logic.

2. **Dependent Count Parameter Type** — A new parameter type (`internalType: dependent-count`) in Stage 4. The admin targets a relation category (e.g., Parents) and defines count bands (minCount / maxCount / siEnhancement). Each band participates in the Cartesian product exactly like other parameter options. Stage 5 displays the effective SI (`base SI + siEnhancement`) per count-band option for the admin's reference.

3. **`applyToDependents` Parameter Flag** — A new optional boolean field on every Stage 4 parameter (default `false`). When `true`, each enrolled life — employee and every dependent — is independently evaluated against the parameter bands using their own attribute value, and their individually resolved Stage 5 premiums are summed to produce the total component premium. This supersedes the `premiumPerLife` flag's multiplication behaviour for that parameter. No new database columns are required; the flag is stored in the existing JSONB `policyConfiguration` blob.

None of these changes require new API endpoints. All three are additive to existing stages and follow established patterns in the codebase.

### 1.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Frontend (apps/ui/iwork)                                        │
│                                                                  │
│  PolicyConfigurator/index.tsx (6-stage wizard orchestrator)      │
│                                                                  │
│  Stage 1 — PolicyComponentsSection.tsx                           │
│    ├── isBenefitComponent checkbox (NEW)                         │
│    │     when true: lock SI model to FLAT, enforce SI = 0        │
│    │     blocked on base/parental components                     │
│    └── existing: SI model, SI options, proRation, premiumPerLife │
│                                                                  │
│  Stage 4 — PolicyParametersSection.tsx                           │
│    ├── DependentCountDetailItem component (NEW)                  │
│    │     targetRelationCategory dropdown                         │
│    │     count bands table: display name | minCount |            │
│    │       maxCount | siEnhancement                              │
│    │     validation: contiguous from 0, non-overlapping          │
│    ├── applyToDependents checkbox per parameter row (NEW)        │
│    │     advisory warning for employee-level-only types          │
│    │     (Grade, Designation, MaritalStatus, CustomList, Range)  │
│    └── existing: range / list / relation parameter rendering     │
│                                                                  │
│  Stage 5 — PolicyChoicesSection.tsx                              │
│    ├── Benefit component: contributions editable when            │
│    │     isAvailable=true even when SI=0 (NEW)                   │
│    └── Dependent Count options: show effective SI label (NEW)    │
│          effectiveSI = baseSI + siEnhancement                    │
│                                                                  │
│  policytypes.ts — type interface additions (NEW)                 │
│    isBenefitComponent on PolicyComponent                         │
│    DependentCountBandConfig, DependentCountDetailConfig          │
│    "dependent-count" in ConfiguredPolicyParameter.type union     │
│    "Dependent Count" in PolicyParameterMaster                    │
│                                                                  │
│  Cartesian product: built on frontend (policyOptions / optionMeta│
│    count bands participate as dimensions same as other params)   │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ REST — existing policy-config endpoints
┌────────────────────────────────▼─────────────────────────────────┐
│  policy-service (apps/services/policy-service)                   │
│    PUT  /policy-configuration/:id  (existing — no change)        │
│    GET  /policy-configuration/:id  (existing — no change)        │
│                                                                  │
│  Service-level validation (new):                                 │
│    ├── isBenefitComponent: type=optional only; SI=0, FLAT model  │
│    ├── FR-048: benefit component isAvailable=true contributions  │
│    │     NOT zeroed regardless of SI value                       │
│    └── dependent-count: bands contiguous from 0, non-overlapping │
│                                                                  │
│  Persistence (new):                                              │
│    └── internalType + dependentCountConfig JSONB on parameter    │
└────────────────────────────────┬─────────────────────────────────┘
                                 │ Enrollment-time parameter eval
┌────────────────────────────────▼─────────────────────────────────┐
│  ibp-service (apps/services/ibp-service)                         │
│    company-employee.service.ts                                   │
│    ├── Dependent Count: count enrolled members of target         │
│    │     category → match band → apply siEnhancement to SI       │
│    │     block enrollment if count outside all bands             │
│    ├── applyToDependents=true: resolve each enrolled life's      │
│    │     own attribute → individual Stage 5 premium lookup →     │
│    │     sum all per-life premiums (NEW)                         │
│    │     per-life attrs (Age, Gender): dependent's own value     │
│    │     employee-level attrs (Grade, Designation, etc.):        │
│    │       employee's resolved band applied to all dependents    │
│    └── Benefit component: SI=0 + isBenefitComponent=true does   │
│          not block choice selection                              │
│                                                                  │
│  service-lib (apps/services/service-lib)                         │
│    per-dependent-resolution.util.ts (NEW)                        │
│    └── shared resolution algorithm used by both ibp-service      │
│          and premium-calculator.util.ts (scheduler batch path)  │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
┌────────────────────────────────▼─────────────────────────────────┐
│  Database (PostgreSQL)                                           │
│    policy_configuration_components_detail  (+ is_benefit_component)│
│    policy_enrollment_parameters            (+ internal_type,     │
│                                              dependent_count_config)│
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Cartesian product generation | Frontend builds `policyOptions` (optionMeta) | Existing pattern; count bands participate as dimensions the same way as range/list bands |
| `dependentCountConfig` storage | JSONB column on `policy_enrollment_parameters` | Consistent with how `policyConfiguration` is stored; avoids new join tables for a nested config structure |
| Migration format | Raw SQL files | Matches existing project convention |
| `isBenefitComponent` zero-lock fix (FR-048) | Service-level guard: skip zero-lock when `isBenefitComponent=true && isAvailable=true` | The existing zero-lock only applies to `isAvailable=false`; benefit components need positive contributions |
| `internal_type` as separate column | New `internal_type varchar(50)` rather than overloading the existing 20-char `type` column | Safer to add alongside; `type` retains its existing 20-char values for other parameter types |
| `applyToDependents` storage | JSONB field in `policyConfiguration.parameters[*].applyToDependents` | No new DB column; stored within existing JSONB blob; all existing rows treated as `false` at runtime without back-fill |
| Employee-level attribute fallback (FR-052) | Use employee's resolved band for all dependents when parameter is Grade/Designation/MaritalStatus/CustomList/CustomRange | These attributes have no per-dependent equivalent; silent fallback prevents enrollment errors without requiring dependent-level data |
| `premiumPerLife` interaction (FR-053) | `applyToDependents=true` supersedes `premiumPerLife` multiplication for that parameter | Sum of individually resolved premiums inherently accounts for all lives; double-multiplication (per-life × individual-sum) must not occur |
| Shared resolution utility | New `per-dependent-resolution.util.ts` in service-lib | Prevents duplication between ibp-service (portal enrollment) and premiumCalculator (batch upload); single algorithm to maintain |

---

## 2. Database Changes

### 2.1 Table: `policy_configuration_components_detail`

Add one new column:

| Column | Type | Constraints | Default |
|---|---|---|---|
| `is_benefit_component` | `boolean` | NOT NULL | `false` |

**SQL Migration:**

```sql
-- File: add-is-benefit-component-to-policy-components.sql
ALTER TABLE policy_configuration_components_detail
  ADD COLUMN IF NOT EXISTS is_benefit_component BOOLEAN NOT NULL DEFAULT false;
```

### 2.2 Table: `policy_enrollment_parameters`

Add two new columns:

| Column | Type | Constraints | Default |
|---|---|---|---|
| `internal_type` | `varchar(50)` | NULLABLE | `NULL` |
| `dependent_count_config` | `jsonb` | NULLABLE | `NULL` |

`internal_type` stores `"dependent-count"` for the new parameter type. All existing rows remain `NULL` (no back-fill needed — existing parameters use only the `type` column for dispatch).

`dependent_count_config` is only populated when `internal_type = 'dependent-count'`. Shape:

```json
{
  "targetRelationCategory": "Parents",
  "countBands": [
    { "id": "uuid", "displayName": "No Parents",  "minCount": 0, "maxCount": 0,    "siEnhancement": 0       },
    { "id": "uuid", "displayName": "1–2 Parents", "minCount": 1, "maxCount": 2,    "siEnhancement": 500000  },
    { "id": "uuid", "displayName": "3+ Parents",  "minCount": 3, "maxCount": null, "siEnhancement": 1000000 }
  ]
}
```

**SQL Migration:**

```sql
-- File: add-dependent-count-columns-to-policy-enrollment-parameters.sql
ALTER TABLE policy_enrollment_parameters
  ADD COLUMN IF NOT EXISTS internal_type           VARCHAR(50)  NULL,
  ADD COLUMN IF NOT EXISTS dependent_count_config  JSONB        NULL;
```

### 2.3 `applyToDependents` — JSONB Storage (No Migration Required)

The `applyToDependents` boolean is stored within the existing `policyConfiguration` JSONB blob on the `PolicyConfiguration` entity — **no SQL migration is required**. The field is added at the parameter level in the serialised JSON:

```json
// policyConfiguration.parameters[*]:
{
  "id": "string",
  "parameterType": "Age | Grade | RelationshipGroup | ...",
  "internalType": "list | range | relation | dependent-count",
  "label": "string",
  "applyToDependents": false,   // ← NEW boolean, default false
  ...
}
```

All existing parameter records that do not carry `applyToDependents` are treated as `false` at runtime — no back-fill of stored JSONB is needed.

---

## 3. Shared Constants & Utilities

### 3.1 New Constants — service-lib

**File:** `apps/services/service-lib/src/lib/constants.ts`

```typescript
export const DEPENDENT_COUNT_INTERNAL_TYPE = "dependent-count";
export const BENEFIT_COMPONENT_SI_VALUE = 0;
```

### 3.2 New Frontend Constants

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/policytypes.ts` (inline — added as const, not a separate file)

```typescript
// Label constants (add alongside existing POLICY_COMPONENTS constants)
export const BENEFIT_COMPONENT_LABEL    = "Benefit / Waiver Component";
export const DEPENDENT_COUNT_PARAM_NAME = "Dependent Count";
export const ADD_COUNT_BAND             = "Add Count Band";
```

---

## 4. Backend — policy-service

### 4.1 Entity Updates

**File:** `apps/services/service-lib/src/lib/entities/policy-components-configuration-detail.entity.ts`

Add after the `proRationEnabled` column (line 48):

```typescript
@Column({ name: "is_benefit_component", type: "boolean", default: false })
isBenefitComponent!: boolean;
```

---

**File:** `apps/services/service-lib/src/lib/entities/policy-enrollment-parameter.entity.ts`

Add after the `displayName` column (line 29):

```typescript
@Column({ name: "internal_type", type: "varchar", length: 50, nullable: true })
internalType?: string | null;

@Column({ name: "dependent_count_config", type: "jsonb", nullable: true })
dependentCountConfig?: Record<string, unknown> | null;
```

### 4.2 Service Validation — isBenefitComponent

**File:** `apps/services/policy-service/src/app/policy/policy.service.ts`

Locate the section that validates `policyConfiguration.components` before saving Stage 1.

**Add validation block:**

```
For each component in policyConfiguration.components:
  IF isBenefitComponent === true:
    1. Reject if component.type !== "optional"
       → HTTP 400: "ERR-BC-001: isBenefitComponent may only be set on optional components"

  (FR-054.3) ERR-BC-002 and ERR-BC-003 are REMOVED. The waiver flag no longer restricts
  the SI model, SI option count, or SI value — the standard optional-component rules
  (FR-054, FR-054.1) apply. The Stage 1 validator therefore only retains ERR-BC-001.
```

### 4.2a Service Validation — Optional Component SI=0 Unconditional Acceptance (FR-054)

**File:** `apps/services/policy-service/src/app/policy/policy.service.ts`

In the same Stage 1 validation block that processes `policyConfiguration.components`:

```
For each component in policyConfiguration.components:
  IF component.type === "optional":
    1. Any sumInsuredOption with value === "0" MUST be accepted.
       → DO NOT reject "SI value cannot be zero" or "SI must be positive" for optional components.
       → DO NOT require isBenefitComponent=true as a precondition for SI=0.
    2. The existing ERR-BC-003 ("Benefit components must have exactly one SI option with value 0")
       remains scoped only to components where isBenefitComponent === true (it asserts equality,
       not that SI=0 is otherwise illegal).
    3. For non-benefit optional components, sumInsuredOptions MAY contain a mix of 0 and positive
       values under either FLAT or MULTIPLE model. No new error is raised for SI=0 entries.
    4. FR-054.1: a sumInsuredOption with value === "" (empty string) on an optional component
       is treated as 0 and must not be rejected. The frontend normalises empty → "0" on blur,
       but persisted JSONB may still contain "" for legacy or partial saves; the backend MUST
       coerce "" → 0 when parsing SI for optional components rather than throwing.

For component.type === "base" or "parental":
  Existing SI > 0 enforcement is unchanged. SI=0 remains illegal on mandatory components.
  Blank SI on mandatory components remains invalid (existing behaviour).
```

> **Rationale:** Inception/enrollment uploads (both portal and batch) currently fail when an optional component carries SI=0 unless `isBenefitComponent=true`. FR-054 removes this coupling so any optional add-on may have SI=0 (e.g., zero-coverage placeholder, voluntary opt-out tier, or fixed-charge benefit without the semantic flag set).

### 4.3 Service Validation — Stage 5 Contribution Zero-Lock (FR-048, FR-054)

**File:** `apps/services/policy-service/src/app/policy/policy.service.ts`

Locate the Stage 5 save validation that checks `isAvailable === false → contributions must be 0`.

**Current logic (pseudocode):**
```
if choice.isAvailable === false:
  if choice.companyContribution !== 0 OR choice.employeeContribution !== 0:
    → error: contributions must be 0 when unavailable
```

**Add optional-component guard (FR-054) — do NOT change the isAvailable=false rule. Instead verify:**
```
if choice.isAvailable === true AND component.type === "optional":
  → accept any non-negative contribution value (positive contributions valid)
  → do NOT apply any zero-lock, regardless of the choice's SI value (including SI = 0)
  → do NOT require isBenefitComponent=true as a precondition
```

> This generalises the prior benefit-component carve-out to ALL optional components. Mandatory (base / parental) components retain SI > 0 with the usual contribution rules. Optional components with `isAvailable=false` still have contributions locked to 0 per FR-032 (unchanged).

### 4.4 Service Validation — Dependent Count Bands

**File:** `apps/services/policy-service/src/app/policy/policy.service.ts`

Locate the section that validates `policyConfiguration.parameters` before saving Stage 4.

**Add validation for `internalType === "dependent-count"` parameters:**

```
For each parameter WHERE internalType === "dependent-count":
  LET bands = parameter.dependentCountConfig.countBands (sorted by minCount ASC)

  1. At least one band required:
     IF bands.length === 0:
       → ERR-DC-001: "At least one count band is required"

  2. First band must start at 0:
     IF bands[0].minCount !== 0:
       → ERR-DC-002: "First count band must start at minCount = 0"

  3. No overlapping bands (check consecutive pairs):
     FOR i = 0 to bands.length - 2:
       IF bands[i].maxCount >= bands[i+1].minCount:
         → ERR-DC-003: "Count bands must not overlap"

  4. No gaps between consecutive bands:
     FOR i = 0 to bands.length - 2:
       IF bands[i].maxCount === null:
         → ERR-DC-004: "Only the last band may have maxCount = null (unlimited)"
       IF bands[i].maxCount + 1 !== bands[i+1].minCount:
         → ERR-DC-005: "Count bands must be contiguous — gap detected between bands"

  5. Last band may have maxCount = null (unlimited upper bound):
     → null is valid only at bands[bands.length - 1].maxCount

  6. siEnhancement must be >= 0:
     FOR each band:
       IF band.siEnhancement < 0:
         → ERR-DC-006: "siEnhancement must be 0 or a positive integer"
```

### 4.6 Service Validation — `applyToDependents` (FR-050)

**File:** `apps/services/policy-service/src/app/policy/policy.service.ts`

In the same section that validates `policyConfiguration.parameters` before saving Stage 4 (alongside §4.4):

```
For each parameter in policyConfiguration.parameters:
  IF applyToDependents is undefined or null:
    → SET applyToDependents = false  (default — no error, no rejection)

  IF applyToDependents is present AND is not a boolean:
    → HTTP 400: "ERR-ATD-001: applyToDependents must be a boolean value (true or false)"
```

No further backend validation is required for `applyToDependents` at Stage 4 save time. The per-dependent resolution algorithm is enforced at enrollment time (ibp-service §5.3) and in the batch upload premium calculator (§5.4).

### 4.5 Persist internalType and dependentCountConfig

**File:** `apps/services/policy-service/src/app/policy/policy.service.ts`

In the section that saves parameters to `policy_enrollment_parameters`:

```
When saving a parameter WHERE type === "dependent-count":
  SET internal_type   = "dependent-count"
  SET dependent_count_config = JSON.stringify(parameter.dependentCountConfig)

For all other parameter types:
  internal_type and dependent_count_config remain NULL (no change to existing logic)
```

---

## 5. Backend — ibp-service

### 5.1 Enrollment-Time Dependent Count Resolution

**File:** `apps/services/ibp-service/src/app/company-employee/company-employee.service.ts`

After the existing parameter-matching logic that resolves the employee's `optionMeta` values, add a new handler for `internalType === "dependent-count"` parameters:

```
1. IDENTIFY dependent-count parameter:
   LET dcParam = policy.parameters.find(p => p.internalType === "dependent-count")
   IF dcParam is null → skip (no dependent-count parameter on this policy)

2. COUNT enrolled members of targetRelationCategory:
   LET targetCategory = dcParam.dependentCountConfig.targetRelationCategory
   LET enrolledCount  = enrolledDependents.filter(
     d => d.relationCategory === targetCategory
   ).length

3. MATCH count against bands (sorted by minCount ASC):
   LET matchedBand = dcParam.dependentCountConfig.countBands.find(band =>
     enrolledCount >= band.minCount &&
     (band.maxCount === null || enrolledCount <= band.maxCount)
   )

4. VALIDATE:
   IF matchedBand === undefined:
     → block enrollment with error:
       "Enrolled count of {targetCategory} ({enrolledCount}) does not match any
        configured count band. Please adjust your selection."

5. APPLY siEnhancement:
   LET effectiveSI = baseComponentSI + matchedBand.siEnhancement
   Use effectiveSI as the sum insured for this enrollment record

6. RECORD optionMeta for dependent-count dimension:
   Include { parameterId: dcParam.id, parameterOptionId: matchedBand.id }
   in the employee's optionMeta array to resolve the correct Stage 5 premium choice
```

### 5.2 Benefit Component Choice Handling

**File:** `apps/services/ibp-service/src/app/company-employee/company-employee.service.ts`

Locate any existing guard that blocks a component choice when `sumInsured === 0` or `sumInsured is null`.

**Change (FR-054 — broadened):** If the component has `type === "optional"`, the SI value of `0` is expected and must NOT trigger a validation error — irrespective of `isBenefitComponent`, the parameter combination resolved for the life, or any other condition. The `isAvailable` flag governs whether the option is selectable, as it does for all other components.

```
IF component.type === "optional" AND choice.sumInsuredId has value === 0:
  → treat as valid; proceed with contribution amounts as configured
  → do NOT raise "sum insured must be positive" / "SI cannot be zero" errors
  → applies to all enrollment paths: portal employee enrollment, dependent add/edit,
    HR-initiated enrollment, and re-enrollment after corrections
  → applies whether or not isBenefitComponent is true

IF component.type === "base" OR "parental":
  Existing SI > 0 enforcement is unchanged.
```

**Additional downstream guards to relax (search and confirm):**

- Any "Sum insured cannot be zero" / "SI must be greater than 0" assertion on the optional-component enrollment path (e.g., choice-selection guard, dependent-add SI revalidation, endorsement diff validation).
- Any contribution-derivation rule that divides by SI or scales premium by SI — for SI=0 optional components, the configured Stage 5 contribution amount is used verbatim (no SI-multiplier path).
- Any premium-tier matcher that filters out choices with `sumInsuredId.value === 0` before option resolution — this must not exclude SI=0 entries for optional components.

### 5.3 Per-Dependent Attribute Resolution — `applyToDependents` (FR-051, FR-052, FR-053)

**File:** `apps/services/ibp-service/src/app/company-employee/company-employee.service.ts`

After the existing parameter-matching logic that resolves the employee's `optionMeta` values, add per-dependent attribute resolution for parameters where `applyToDependents === true`.

> **Context:** The current enrollment flow resolves one policy option from the Cartesian product for the employee using their own attribute values, then multiplies the matched Stage 5 premium by the enrolled life count when `premiumPerLife: true`. When `applyToDependents: true`, each enrolled dependent independently resolves their own policy option, and all per-life premiums are summed instead.

#### Resolution Algorithm

```typescript
async function resolveApplyToDependentsPremium(
  parameter: ConfiguredPolicyParameter,
  employee: EnrolledEmployee,
  dependents: EnrolledDependent[],
  policyOptions: PolicyOption[],
  stage5Choices: PolicyChoice[],
  componentId: string,
): Promise<number> {
  const allLives = [employee, ...dependents];
  let totalPremium = 0;

  for (const life of allLives) {
    // 1. Determine attribute value for this life
    let attrValue: string | number;

    if (isPerLifeAttribute(parameter)) {
      // Age: compute from dateOfBirth at effectiveDate; Gender: read from enrollment row
      attrValue = getLifeAttributeValue(parameter, life);
    } else {
      // FR-052: employee-level attribute (Grade, Designation, MaritalStatus, CustomList, CustomRange)
      // Use employee's own attribute value for all dependents — no per-dependent lookup
      attrValue = getEmployeeAttributeValue(parameter, employee);
    }

    // 2. Match attribute value against parameter bands / options
    const matchedOptionId = matchParameterOption(parameter, attrValue);
    if (!matchedOptionId) {
      throw new Error(
        `ERR-ATD-002: ${(life as EnrolledDependent).relation ?? "Employee"}'s ` +
        `${parameter.label} value "${attrValue}" does not match any configured band/option.`
      );
    }

    // 3. Build optionMeta for this life: override only this parameter's dimension
    const lifeOptionMeta = buildOptionMetaWithOverride(
      employee.optionMeta,  // base from employee's resolved option
      parameter.id,
      matchedOptionId
    );

    // 4. Look up Stage 5 premium for this life's resolved optionMeta
    const option = policyOptions.find(o =>
      optionMetaMatches(o.optionMeta, lifeOptionMeta)
    );
    if (!option) {
      throw new Error(`ERR-ATD-003: No policy option found for resolved parameter combination`);
    }

    const choice = stage5Choices.find(c =>
      c.optionId === option.optionId && c.componentId === componentId
    );
    if (!choice) {
      throw new Error(`ERR-ATD-004: No Stage 5 choice configured for option ${option.optionId}`);
    }

    totalPremium += (choice.companyContribution ?? 0) + (choice.employeeContribution ?? 0);
  }

  // FR-053: total is the algebraic sum of individually resolved premiums.
  // Do NOT apply premiumPerLife multiplier on top of this result.
  return totalPremium;
}
```

#### Helper Functions

```typescript
// Returns true for parameters whose value resolves per enrolled dependent (not employee-level)
function isPerLifeAttribute(parameter: ConfiguredPolicyParameter): boolean {
  return parameter.parameterMasterName === "Age" || parameter.parameterMasterName === "Gender";
}

// For Age: compute whole-year age at effectiveDate.
// For Gender: read from dependent's enrollment row gender field.
function getLifeAttributeValue(
  parameter: ConfiguredPolicyParameter,
  life: EnrolledLife,
): string | number {
  if (parameter.parameterMasterName === "Age") {
    return computeAgeInYears(life.dateOfBirth, life.effectiveDate);
  }
  if (parameter.parameterMasterName === "Gender") {
    return life.gender ?? "";
  }
  throw new Error(`Per-life resolution not supported for parameter type: ${parameter.parameterMasterName}`);
}

// Override one dimension in the optionMeta array; leave all other dimensions unchanged
function buildOptionMetaWithOverride(
  baseOptionMeta: OptionMeta[],
  parameterId: string,
  newOptionId: string
): OptionMeta[] {
  return baseOptionMeta.map(meta =>
    meta.parameterId === parameterId
      ? { ...meta, parameterOptionId: newOptionId }
      : meta
  );
}
```

#### Integration Point in Existing Enrollment Flow

```
EXISTING (applyToDependents=false):
  1. Resolve employee optionMeta → match policy option → lookup Stage 5 choice
  2. IF premiumPerLife: componentPremium = choice.totalPremium × enrolledLifeCount
     ELSE:             componentPremium = choice.totalPremium  (flat family rate)

MODIFIED (applyToDependents=true on parameter P):
  1. Resolve employee optionMeta as above
  2. For each component where parameter P contributes to the optionMeta dimension:
     componentPremium = resolveApplyToDependentsPremium(P, employee, dependents, ...)
     // premiumPerLife multiplier NOT applied for this component (FR-053)
  3. Components whose parameters all have applyToDependents=false: unchanged
```

### 5.4 `premiumCalculator` Update for `applyToDependents` (Batch Upload Path)

**File:** `apps/services/service-lib/src/lib/utils/premium-calculator.util.ts`

The `premiumCalculator()` utility is invoked by the scheduler's `processEnrollmentUpload` after enrollment records are upserted (normal mode, `bypassMode = false`). When the policy configuration contains any parameter with `applyToDependents: true`, the calculator must dispatch to the per-dependent resolution path rather than the standard per-life multiplication.

#### New Shared Utility

To avoid duplicating the resolution algorithm between ibp-service (§5.3) and the scheduler batch path, extract it into a shared module:

**File:** `apps/services/service-lib/src/lib/utils/per-dependent-resolution.util.ts`

```typescript
export function resolveApplyToDependentsPremium(
  parameter: ConfiguredPolicyParameter,
  employee: BatchEnrolledEmployee,
  dependents: BatchEnrolledDependent[],
  policyOptions: PolicyOption[],
  stage5Choices: PolicyChoice[],
  componentId: string,
): number {
  // Same algorithm as §5.3 — see that section for full implementation.
  // Employee-level attribute types use employee's resolved band for all dependents.
  // Per-life attribute types (Age, Gender) use each dependent's own value.
  // Returns sum of all per-life premiums; caller must NOT apply premiumPerLife on top.
}
```

#### Change to `premiumCalculator.util.ts`

Within the per-component premium computation loop:

```
FOR each component IN enrollment:
  LET applyToDependentsParams = policyConfiguration.parameters
    .filter(p => p.applyToDependents === true)

  IF applyToDependentsParams.length > 0:
    // New path: per-dependent resolution for each applyToDependents=true parameter
    FOR each param IN applyToDependentsParams:
      componentTotal += resolveApplyToDependentsPremium(
        param, employee, dependents, policyOptions, stage5Choices, component.id
      )
    // Parameters without applyToDependents still contribute via standard lookup
    // (handle remaining parameters with existing per-life multiplication logic)
  ELSE:
    // Existing path unchanged: per-life multiplication or flat family rate
    LET matchedChoice = lookupStage5Choice(employee.optionMeta, component)
    componentTotal = matchedChoice.totalPremium × (premiumPerLife ? enrolledLifeCount : 1)
```

> **Note:** The `bypassMode = true` path in `processEnrollmentUpload` does **not** call `premiumCalculator()` — it aggregates signed `bypassPremiumAmount` values directly (see Enrollment-Without-Policy-Configuration-TechSpec.md §5.2 Phase 8). The `applyToDependents` interaction is therefore relevant only to the `bypassMode = false` path.

---

## 6. Frontend — apps/ui/iwork

### 6.1 Type Interface Additions

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/policytypes.ts`

#### 6.1.1 Extend `PolicyComponent`

```typescript
export interface PolicyComponent {
  id: string;
  label?: string;
  type: string;
  sumInsuredModel: SumInsuredModel;
  siMultipleLabel: string;
  siMultipleMin?: number;
  siMultipleMax?: number;
  sumInsuredOptions: SumInsuredOption[];
  nextSumInsuredId: number;
  showCompanyContribution: boolean;
  premiumPerLife: boolean;
  proRationEnabled: boolean;
  isBenefitComponent?: boolean;              // NEW — default false
}
```

#### 6.1.2 New Interfaces — Dependent Count

```typescript
export interface DependentCountBandConfig {
  id: string;
  displayName: string;
  minCount: string;        // stored as string (same pattern as range min/max)
  maxCount: string | null; // null = unlimited upper bound
  siEnhancement: string;   // stored as formatted number string
}

export interface DependentCountDetailConfig {
  targetRelationCategory: string; // e.g. "Parents", "Children"
  countBands: DependentCountBandConfig[];
  nextCountBandId: number;
}
```

#### 6.1.3 Extend `ConfiguredPolicyParameter`

```typescript
export interface ConfiguredPolicyParameter {
  id: string;
  parameterMasterName: string;
  type: "range" | "list" | "relation" | "dependent-count"; // extended union
  displayName: string;
  applyToDependents?: boolean;                             // NEW — default false
  rangeDetails: RangeDetailConfig[];
  nextRangeDetailId: number;
  lovDetails: LovDetailConfig[];
  nextLovDetailId: number;
  relationGroupDetails: RelationGroupDetailConfig[];
  nextRelationGroupDetailId: number;
  dependentCountConfig?: DependentCountDetailConfig;       // added previously
}
```

#### 6.1.4 Add to `PolicyParameterMaster`

```typescript
// Add after the existing "Custom Range" entry (line 118):
{
  name: "Dependent Count",
  type: "dependent-count",
  values: ["Self", "Spouse/Partner", "Children", "Parents", "Siblings"],
}
```

### 6.2 PolicyComponentsSection.tsx — isBenefitComponent

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyComponentsSection.tsx`

#### 6.2.1 Add Checkbox UI

Insert immediately after the existing `proRationEnabled` checkbox block (after line 697):

```tsx
{/* Benefit / Waiver Component — only for optional add-on components */}
{comp.type === "optional" && (
  <StyledFormControlForCompanyContribution
    data-testid={`${comp.id}-is-benefit-component`}
    control={
      <CommonCheckbox
        checked={comp.isBenefitComponent ?? false}
        onChange={(e) =>
          onIsBenefitComponentChange(comp.id, e.target.checked)
        }
        disabled={!isEditable || isExistingComp}
        size="small"
      />
    }
    label={
      <Typography variant="body2">
        {POLICY_COMPONENTS.IS_BENEFIT_COMPONENT}
      </Typography>
    }
    disabled={!isEditable || isExistingComp}
  />
)}
```

Add `IS_BENEFIT_COMPONENT: "Benefit / Waiver Component (SI = ₹0)"` to the `POLICY_COMPONENTS` constants object.

#### 6.2.2 Handler: `onIsBenefitComponentChange`

In the component's manager hook (or inline in the section), add:

```typescript
const onIsBenefitComponentChange = (compId: string, checked: boolean) => {
  updateComponent(compId, (comp) => {
    if (checked) {
      return {
        ...comp,
        isBenefitComponent: true,
        sumInsuredModel: SumInsuredModel.FLAT,
        // Reset SI options to a single entry with value "0"
        sumInsuredOptions: [{ id: comp.nextSumInsuredId, value: "0" }],
        nextSumInsuredId: comp.nextSumInsuredId + 1,
      };
    }
    return { ...comp, isBenefitComponent: false };
  });
};
```

#### 6.2.3 Conditional Locks When `isBenefitComponent === true`

When `comp.isBenefitComponent === true`:

- Disable the SI model toggle (lock to FLAT):
  ```tsx
  disabled={!isEditable || isExistingComp || comp.isBenefitComponent === true}
  ```
  Apply to both the FLAT and MULTIPLE toggle buttons and the `handleSumInsuredModelChange` handler.

- Disable "Add Sum Insured" button (only SI = 0 allowed):
  ```tsx
  disabled={!isEditable || isExistingComp || comp.isBenefitComponent === true}
  ```
  Apply to the `StyledAddSumInsuredIconButton`.

- Keep SI option value field non-editable (display "₹0") when benefit:
  Lock the SI input to read-only when `comp.isBenefitComponent === true`.

### 6.3 PolicyParametersSection.tsx — Dependent Count

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyParametersSection.tsx`

#### 6.3.1 New: `DependentCountDetailItem` Component

Create this component inline in the same file (following the pattern of `RangeDetailItem` and `RelationGroupDetailItem`):

```tsx
interface DependentCountDetailItemProps {
  paramId: string;
  config: DependentCountDetailConfig;
  isEditable: boolean;
  showHighlights: boolean;
  formErrors: Record<string, unknown>;
  onTargetCategoryChange: (paramId: string, category: string) => void;
  onAddCountBand: (paramId: string) => void;
  onRemoveCountBand: (paramId: string, bandId: string) => void;
  onCountBandChange: (
    paramId: string,
    bandId: string,
    field: keyof DependentCountBandConfig,
    value: string | null
  ) => void;
}

const DependentCountDetailItem: React.FC<DependentCountDetailItemProps> = ({
  paramId, config, isEditable, showHighlights, formErrors,
  onTargetCategoryChange, onAddCountBand, onRemoveCountBand, onCountBandChange,
}) => (
  <Stack spacing={2}>
    {/* Target Relation Category selector */}
    <CommonSelect
      label="Target Relation Category"
      value={config.targetRelationCategory}
      options={["Self", "Spouse/Partner", "Children", "Parents", "Siblings"]}
      onChange={(val) => onTargetCategoryChange(paramId, val)}
      disabled={!isEditable}
      error={showHighlights && !config.targetRelationCategory}
    />

    {/* Count bands table */}
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Band Name</TableCell>
          <TableCell>Min Count</TableCell>
          <TableCell>Max Count (blank = unlimited)</TableCell>
          <TableCell>SI Enhancement (₹)</TableCell>
          {isEditable && <TableCell />}
        </TableRow>
      </TableHead>
      <TableBody>
        {config.countBands.map((band, idx) => (
          <TableRow key={band.id}>
            <TableCell>
              <CommonTextField
                value={band.displayName}
                onChange={(e) =>
                  onCountBandChange(paramId, band.id, "displayName", e.target.value)
                }
                disabled={!isEditable}
                error={showHighlights && !band.displayName?.trim()}
              />
            </TableCell>
            <TableCell>
              <CommonTextField
                type="number"
                value={band.minCount}
                onChange={(e) =>
                  onCountBandChange(paramId, band.id, "minCount", e.target.value)
                }
                disabled={!isEditable || idx === 0} // first band always starts at 0
                inputProps={{ min: 0 }}
              />
            </TableCell>
            <TableCell>
              <CommonTextField
                type="number"
                value={band.maxCount ?? ""}
                placeholder="Unlimited"
                onChange={(e) =>
                  onCountBandChange(
                    paramId, band.id, "maxCount",
                    e.target.value === "" ? null : e.target.value
                  )
                }
                disabled={!isEditable}
                inputProps={{ min: 0 }}
              />
            </TableCell>
            <TableCell>
              <CommonTextField
                type="number"
                value={band.siEnhancement}
                onChange={(e) =>
                  onCountBandChange(paramId, band.id, "siEnhancement", e.target.value)
                }
                disabled={!isEditable}
                inputProps={{ min: 0 }}
              />
            </TableCell>
            {isEditable && config.countBands.length > 1 && (
              <TableCell>
                <IconButton
                  size="small"
                  onClick={() => onRemoveCountBand(paramId, band.id)}
                >
                  <RemoveIcon />
                </IconButton>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>

    {isEditable && (
      <Button
        startIcon={<AddIcon src={addIcon} alt="Add" />}
        onClick={() => onAddCountBand(paramId)}
        size="small"
        sx={{ color: "#0A73E9", fontWeight: "300" }}
        data-testid={`add-count-band-btn-${paramId}`}
      >
        {ADD_COUNT_BAND}
      </Button>
    )}
  </Stack>
);
```

#### 6.3.2 Add Rendering Block

In the parameter table cell where type-specific content is rendered (after the `{parameterType === "relation" && ...}` block, before the `{!parameterType && ...}` fallback — around line 417):

```tsx
{parameterType === "dependent-count" && param.dependentCountConfig && (
  <DependentCountDetailItem
    paramId={param.id}
    config={param.dependentCountConfig}
    isEditable={isEditable}
    showHighlights={showHighlights}
    formErrors={formErrors[param.id]?.dependentCountConfig || {}}
    onTargetCategoryChange={onTargetCategoryChange}
    onAddCountBand={onAddCountBand}
    onRemoveCountBand={onRemoveCountBand}
    onCountBandChange={onCountBandChange}
  />
)}
```

#### 6.3.3 Frontend Band Validation

In the manager hook that handles Stage 4 validation (called when the user attempts to proceed), add for `type === "dependent-count"` parameters:

```typescript
function validateCountBands(bands: DependentCountBandConfig[]): string | null {
  if (bands.length === 0) return "At least one count band is required";

  const sorted = [...bands].sort(
    (a, b) => parseInt(a.minCount) - parseInt(b.minCount)
  );

  if (parseInt(sorted[0].minCount) !== 0)
    return "First count band must start at 0";

  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];
    if (curr.maxCount === null)
      return "Only the last band may have an unlimited (blank) max count";
    const currMax = parseInt(curr.maxCount);
    const nextMin = parseInt(next.minCount);
    if (currMax >= nextMin) return "Count bands must not overlap";
    if (currMax + 1 !== nextMin) return "Count bands must be contiguous (no gaps)";
  }
  return null;
}
```

#### 6.3.4 New Callbacks in Manager Hook

Add these callbacks to the manager hook that owns `configuredParameters`:

```typescript
// Initialize a new dependent-count parameter
const onAddDependentCountParameter = (paramId: string) => {
  updateParameter(paramId, (p) => ({
    ...p,
    dependentCountConfig: {
      targetRelationCategory: "",
      countBands: [
        { id: generateId(), displayName: "", minCount: "0", maxCount: null, siEnhancement: "0" },
      ],
      nextCountBandId: 2,
    },
  }));
};

const onTargetCategoryChange = (paramId: string, category: string) =>
  updateParameter(paramId, (p) => ({
    ...p,
    dependentCountConfig: { ...p.dependentCountConfig!, targetRelationCategory: category },
  }));

const onAddCountBand = (paramId: string) =>
  updateParameter(paramId, (p) => {
    const cfg = p.dependentCountConfig!;
    const lastBand = cfg.countBands[cfg.countBands.length - 1];
    const newMin = lastBand.maxCount !== null
      ? String(parseInt(lastBand.maxCount) + 1)
      : "";
    return {
      ...p,
      dependentCountConfig: {
        ...cfg,
        countBands: [
          ...cfg.countBands,
          { id: generateId(), displayName: "", minCount: newMin, maxCount: null, siEnhancement: "0" },
        ],
        nextCountBandId: cfg.nextCountBandId + 1,
      },
    };
  });

const onRemoveCountBand = (paramId: string, bandId: string) =>
  updateParameter(paramId, (p) => ({
    ...p,
    dependentCountConfig: {
      ...p.dependentCountConfig!,
      countBands: p.dependentCountConfig!.countBands.filter((b) => b.id !== bandId),
    },
  }));

const onCountBandChange = (
  paramId: string,
  bandId: string,
  field: keyof DependentCountBandConfig,
  value: string | null
) =>
  updateParameter(paramId, (p) => ({
    ...p,
    dependentCountConfig: {
      ...p.dependentCountConfig!,
      countBands: p.dependentCountConfig!.countBands.map((b) =>
        b.id === bandId ? { ...b, [field]: value } : b
      ),
    },
  }));
```

### 6.4 PolicyChoicesSection.tsx — Benefit Component & Effective SI

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyChoicesSection.tsx`

The choices section must receive the component list from Stage 1 to determine `isBenefitComponent` and the parameter list from Stage 4 to determine `siEnhancement` per option.

**Ensure these props are passed from the parent wizard (already available in `PolicyConfiguration.configuration`):**
- `components: PolicyComponent[]`
- `parameters: ConfiguredPolicyParameter[]`

#### 6.4.1 Remove Contribution Zero-Lock for ANY Optional Component (FR-054)

Locate the rendering of contribution input fields. The current logic likely locks inputs to `0` when `isAvailable === false`. Ensure the guard is ONLY based on `isAvailable`, not on `sumInsuredId.value === "0"`:

```typescript
// Correct guard — do NOT add a condition like `&& component.isBenefitComponent !== true`
// because the existing rule already handles this correctly:
const isLocked = !choice.isAvailable; // the ONLY condition that locks contributions
```

If there is existing code that reads `sumInsured.value === "0"` and locks the contribution fields, broaden the exception to cover **all optional components**, not just benefit components:

```typescript
const component = components.find((c) => c.id === policyChoice.policyId);
const isOptionalComp = component?.type === "optional";

// FR-054: optional components accept SI=0 unconditionally; the only thing
// that locks contributions is isAvailable=false.
const isLocked = !choice.isAvailable && !isOptionalComp
  // isAvailable=false still locks for optional components too (FR-032),
  // so combine with the existing rule rather than replacing it:
  ? true
  : !choice.isAvailable;

// Equivalent simplified form:
const isLockedSimplified = !choice.isAvailable;
//   The SI=0 → locked rule is removed entirely for optional components.
//   For base/parental components SI cannot be 0 anyway (Stage 1 validation),
//   so this single check is now sufficient across the board.
```

> **Important:** Any optional component (benefit or not) with `isAvailable: false` MUST still have locked contributions at `0` (FR-032 applies). FR-054 only removes locking based on SI=0 alone. Base/parental components are unaffected because their SI must always be > 0.

#### 6.4.2 Effective SI Display for Dependent Count Options

For each policy option in Stage 5, check if any parameter in `optionMeta` belongs to a `dependent-count` parameter. If so, find the matching count band and calculate effective SI:

```typescript
function getEffectiveSI(
  option: ConfiguredPolicyOption,
  parameters: ConfiguredPolicyParameter[],
  baseSIValue: number
): number | null {
  const dcMeta = option.optionMeta.find((meta) => {
    const param = parameters.find((p) => p.id === meta.parameterId);
    return param?.type === "dependent-count";
  });
  if (!dcMeta) return null;

  const dcParam = parameters.find((p) => p.id === dcMeta.parameterId);
  const band = dcParam?.dependentCountConfig?.countBands.find(
    (b) => b.id === dcMeta.parameterOptionId
  );
  if (!band) return null;

  return baseSIValue + parseInt(band.siEnhancement || "0");
}
```

Render the effective SI label alongside the component's SI header in Stage 5:

```tsx
{effectiveSI !== null && (
  <Typography variant="caption" color="text.secondary">
    Effective SI: ₹{formatNumberForDisplay(effectiveSI)}
    {" "}(Base ₹{formatNumberForDisplay(baseSIValue)} +
    Enhancement ₹{formatNumberForDisplay(effectiveSI - baseSIValue)})
  </Typography>
)}
```

### 6.6 PolicyParametersSection.tsx — `applyToDependents` Toggle (FR-050, FR-052)

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyParametersSection.tsx`

#### 6.6.1 Add Toggle UI in Parameter Row

After the existing parameter display-name input for each parameter row, add:

```tsx
{/* Apply to Dependents checkbox */}
<StyledFormControlForCompanyContribution
  data-testid={`${param.id}-apply-to-dependents`}
  control={
    <CommonCheckbox
      checked={param.applyToDependents ?? false}
      onChange={(e) => onApplyToDependentsChange(param.id, e.target.checked)}
      disabled={!isEditable}
      size="small"
    />
  }
  label={
    <Typography variant="body2">
      {POLICY_PARAMETERS.APPLY_TO_DEPENDENTS}
    </Typography>
  }
/>

{/* Advisory warning for employee-level-only attribute types (FR-052) */}
{(param.applyToDependents ?? false) && isEmployeeLevelOnlyParam(param) && (
  <Alert severity="info" variant="outlined" sx={{ mt: 0.5, mb: 1 }}>
    {POLICY_PARAMETERS.APPLY_TO_DEPENDENTS_ADVISORY}
  </Alert>
)}
```

Add constants to the `POLICY_PARAMETERS` constants object:

```typescript
APPLY_TO_DEPENDENTS: "Apply to Dependents (per-life attribute resolution)",
APPLY_TO_DEPENDENTS_ADVISORY:
  "This parameter uses an employee-level attribute (Grade, Designation, Marital Status, " +
  "or a Custom field). When 'Apply to Dependents' is enabled, the employee's resolved " +
  "band will be applied to all dependents for this parameter — no per-dependent attribute " +
  "lookup is performed. This is non-blocking and follows the design in FR-052.",
```

The advisory is **non-blocking** — it informs the admin without preventing Stage 4 from being completed.

#### 6.6.2 Helper: `isEmployeeLevelOnlyParam`

```typescript
// Returns true for parameter types where per-dependent attribute lookup is not meaningful.
// Age and Gender resolve per-life (DOB → age; gender from enrollment row).
// All others use the employee's attribute value for dependents.
const isEmployeeLevelOnlyParam = (param: ConfiguredPolicyParameter): boolean =>
  !["Age", "Gender"].includes(param.parameterMasterName ?? "");
```

#### 6.6.3 Callback: `onApplyToDependentsChange`

Add to the manager hook that owns `configuredParameters`:

```typescript
const onApplyToDependentsChange = (paramId: string, checked: boolean) =>
  updateParameter(paramId, (p) => ({ ...p, applyToDependents: checked }));
```

### 6.5 Cartesian Product — Include Dependent Count Bands

**File:** Wherever `policyOptions` (optionMeta) are built from `configuredParameters` in the wizard.

Add dependent-count bands as a dimension in the Cartesian product:

```typescript
// When building the list of "options" for a parameter to include in the product:
const getParameterOptions = (param: ConfiguredPolicyParameter): string[] => {
  switch (param.type) {
    case "range":    return param.rangeDetails.map((d) => d.id);
    case "list":     return param.lovDetails.map((d) => d.id);
    case "relation": return param.relationGroupDetails.map((d) => d.id);
    case "dependent-count":
      return (param.dependentCountConfig?.countBands ?? []).map((b) => b.id);
    default:         return [];
  }
};
```

Each count band ID becomes a `parameterOptionId` in `optionMeta` for that dimension — exactly the same as range bands or LOV options.

---

## 7. API Contract Summary

No new endpoints. The existing `PUT /policy-configuration/:id` endpoint accepts `policyConfiguration` as type `unknown` (JSONB stored as-is). The shape changes are:

| Location | Change |
|---|---|
| `policyConfiguration.components[*]` | New optional field `isBenefitComponent: boolean` |
| `policyConfiguration.parameters[*]` | New optional field `internalType: "dependent-count"` and `dependentCountConfig: { targetRelationCategory, countBands[] }` |
| `policyConfiguration.parameters[*]` | New optional field `applyToDependents: boolean` (default `false`); stored in JSONB, no migration required — see §2.3 |
| `policyConfiguration.policyOptions[*].optionMeta` | Count band IDs appear as `parameterOptionId` for dependent-count dimensions |
| Stage 5 choice validation (server response) | New error codes ERR-BC-001 through ERR-BC-003, ERR-DC-001 through ERR-DC-006, ERR-ATD-001 through ERR-ATD-004 (see §8) |

---

## 8. Error Response Reference

### API-Level (HTTP 400) — New Validation Errors

#### Benefit Component Errors

| Error Code | Error Message | Trigger |
|---|---|---|
| ERR-BC-001 | `isBenefitComponent may only be set on optional (add-on) components` | `isBenefitComponent: true` on a `base` or `parental` component |
| ~~ERR-BC-002~~ | *Removed (FR-054.3)* — SI model is no longer locked for benefit components. | n/a |
| ~~ERR-BC-003~~ | *Removed (FR-054.3)* — SI option count / value rules follow the standard optional-component path. | n/a |

#### Dependent Count Parameter Errors

| Error Code | Error Message | Trigger |
|---|---|---|
| ERR-DC-001 | `At least one count band is required for a Dependent Count parameter` | `countBands` array is empty |
| ERR-DC-002 | `First count band must start at minCount = 0` | `countBands[0].minCount !== 0` |
| ERR-DC-003 | `Count bands must not overlap` | Adjacent bands have overlapping min/max ranges |
| ERR-DC-004 | `Only the last count band may have maxCount = null (unlimited)` | A non-final band has `maxCount: null` |
| ERR-DC-005 | `Count bands must be contiguous — gap detected between bands` | `bands[i].maxCount + 1 !== bands[i+1].minCount` |
| ERR-DC-006 | `siEnhancement must be 0 or a positive integer` | Any band has `siEnhancement < 0` |

#### applyToDependents Errors

| Error Code | Error Message | Trigger |
|---|---|---|
| ERR-ATD-001 | `applyToDependents must be a boolean value (true or false)` | `applyToDependents` present but not a boolean in Stage 4 save payload |
| ERR-ATD-002 | `{relation}'s {paramLabel} value "{attrValue}" does not match any configured band/option` | Dependent's per-life attribute value falls outside all parameter bands at enrollment time |
| ERR-ATD-003 | `No policy option found for the resolved parameter combination` | Combined `optionMeta` for this life doesn't match any Cartesian product option |
| ERR-ATD-004 | `No Stage 5 choice configured for option {optionId}` | Matching policy option exists but has no Stage 5 premium configured for the component |

#### Enrollment-Time Errors (ibp-service)

| Scenario | Error Message |
|---|---|
| Employee's enrolled count falls outside all configured Dependent Count bands | `"Enrolled count of {targetCategory} ({enrolledCount}) does not match any configured count band. Please review your dependent selections."` |

---

## 9. Task Breakdown

All tasks within the same group can be worked in parallel. Groups must be completed in order.

---

### Group A — Database & Entities (no dependencies)

| # | Task | File(s) |
|---|---|---|
| A-1 | Create SQL migration: add `is_benefit_component boolean NOT NULL DEFAULT false` to `policy_configuration_components_detail` | New file: `apps/services/policy-service/migrations/add-is-benefit-component-to-policy-components.sql` |
| A-2 | Create SQL migration: add `internal_type varchar(50) NULL` and `dependent_count_config jsonb NULL` to `policy_enrollment_parameters` | New file: `apps/services/policy-service/migrations/add-dependent-count-columns-to-policy-enrollment-parameters.sql` |
| A-3 | Update `PolicyComponentsConfigurationDetail` entity — add `isBenefitComponent` column decorator | `apps/services/service-lib/src/lib/entities/policy-components-configuration-detail.entity.ts` — see §4.1 |
| A-4 | Update `PolicyEnrollmentParameter` entity — add `internalType` and `dependentCountConfig` column decorators | `apps/services/service-lib/src/lib/entities/policy-enrollment-parameter.entity.ts` — see §4.1 |
| A-5 | Add `DEPENDENT_COUNT_INTERNAL_TYPE` and `BENEFIT_COMPONENT_SI_VALUE` constants to service-lib | `apps/services/service-lib/src/lib/constants.ts` — see §3.1 |

---

### Group B — Backend: policy-service (depends on A)

| # | Task | File(s) | Notes |
|---|---|---|---|
| B-1 | Add server-side validation for `isBenefitComponent`: block on base/parental, enforce FLAT model and SI=0 | `apps/services/policy-service/src/app/policy/policy.service.ts` | See §4.2; errors ERR-BC-001 to ERR-BC-003 |
| B-2 | Verify Stage 5 contribution zero-lock: confirm it is based only on `isAvailable=false`, NOT on SI value. Document the FR-048 guard. | `apps/services/policy-service/src/app/policy/policy.service.ts` | See §4.3 — this may be a no-op if zero-lock is already implemented correctly |
| B-3 | Add validation for dependent-count count bands: contiguous from 0, non-overlapping, null maxCount only at last band, siEnhancement ≥ 0 | `apps/services/policy-service/src/app/policy/policy.service.ts` | See §4.4; errors ERR-DC-001 to ERR-DC-006 |
| B-4 | Persist `internalType` and `dependentCountConfig` when saving parameters | `apps/services/policy-service/src/app/policy/policy.service.ts` | See §4.5 |
| B-5 | Verify GET `/policy-configuration/:id` returns `internalType` and `dependentCountConfig` in parameter payload | `apps/services/policy-service/src/app/policy/policy.service.ts` or repository | Needed for frontend Stage 4 load on edit |
| B-6 | Add `applyToDependents` boolean type validation in Stage 4 save: default to `false` if absent; reject non-boolean with ERR-ATD-001 | `apps/services/policy-service/src/app/policy/policy.service.ts` | See §4.6; `applyToDependents` stored in JSONB — no entity column change needed |
| B-7 | Verify GET `/policy-configuration/:id` returns `applyToDependents` in parameter payload | Same file or repository | Required for Stage 4 UI to reload existing configurations with the toggle state |

---

### Group C — Backend: ibp-service + service-lib (depends on A)

| # | Task | File(s) | Notes |
|---|---|---|---|
| C-1 | Add enrollment-time dependent-count resolution: count members → match band → apply siEnhancement → block if unmatched | `apps/services/ibp-service/src/app/company-employee/company-employee.service.ts` | See §5.1 |
| C-2 | Fix benefit component choice handling: SI=0 with `isBenefitComponent=true` must not trigger "sum insured must be positive" error | `apps/services/ibp-service/src/app/company-employee/company-employee.service.ts` | See §5.2 |
| C-3 | Implement per-dependent attribute resolution in ibp-service: `isPerLifeAttribute` dispatch; Age/Gender use dependent's own value; all other types fall back to employee's band | `apps/services/ibp-service/src/app/company-employee/company-employee.service.ts` | See §5.3; errors ERR-ATD-002 to ERR-ATD-004 |
| C-4 | Create shared utility `per-dependent-resolution.util.ts` in service-lib to avoid duplication between ibp-service and premiumCalculator | `apps/services/service-lib/src/lib/utils/per-dependent-resolution.util.ts` (new file) | See §5.4 note; exports `resolveApplyToDependentsPremium` |
| C-5 | Update `premiumCalculator.util.ts` to dispatch to per-dependent resolution path when any policy parameter has `applyToDependents=true` | `apps/services/service-lib/src/lib/utils/premium-calculator.util.ts` | See §5.4; uses shared utility from C-4; only affects `bypassMode=false` scheduler path |

---

### Group D — Frontend (depends on A; B + C needed for end-to-end testing)

| # | Task | File(s) | Notes |
|---|---|---|---|
| D-1 | Extend `PolicyComponent` interface — add `isBenefitComponent?: boolean` | `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/policytypes.ts` | See §6.1.1 |
| D-2 | Add `DependentCountBandConfig` and `DependentCountDetailConfig` interfaces; extend `ConfiguredPolicyParameter.type`; add entry to `PolicyParameterMaster` | `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/policytypes.ts` | See §6.1.2 – §6.1.4 |
| D-3 | Add `isBenefitComponent` checkbox to Stage 1 component form; implement `onIsBenefitComponentChange` handler; lock SI model + SI options when enabled | `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyComponentsSection.tsx` | See §6.2 |
| D-4 | Create `DependentCountDetailItem` component; add rendering block in parameter table; add manager callbacks | `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyParametersSection.tsx` | See §6.3 |
| D-5 | Add band validation logic (`validateCountBands`) in Stage 4 completion guard | `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyParametersSection.tsx` or manager hook | See §6.3.3 |
| D-6 | Include count-band options in Cartesian product when building `policyOptions` | `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/` (wherever Cartesian product is built) | See §6.5 |
| D-7 | Fix Stage 5: ensure contribution fields are not locked by SI=0 alone; add `isBenefitComponent` check | `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyChoicesSection.tsx` | See §6.4.1 |
| D-8 | Add effective SI display label for Dependent Count options in Stage 5 | `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyChoicesSection.tsx` | See §6.4.2 |
| D-9 | Add `applyToDependents?: boolean` to `ConfiguredPolicyParameter` interface | `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/policytypes.ts` | See §6.1.3 updated |
| D-10 | Add `applyToDependents` checkbox toggle per parameter row in Stage 4; wire `onApplyToDependentsChange` callback | `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyParametersSection.tsx` | See §6.6.1 – §6.6.3 |
| D-11 | Add advisory warning (non-blocking, `Alert severity="info"`) when `applyToDependents=true` on Grade/Designation/MaritalStatus/CustomList/CustomRange parameters | Same file | See §6.6.1 – §6.6.2; uses `isEmployeeLevelOnlyParam` helper |

---

### Group E — Testing (depends on B, C, D)

| # | Task | Type | Description |
|---|---|---|---|
| E-1 | Unit test | Backend | `isBenefitComponent` on base component → ERR-BC-001 |
| E-2 | Unit test | Backend | `isBenefitComponent` with MULTIPLE model → ERR-BC-002 |
| E-3 | Unit test | Backend | `isBenefitComponent` with SI ≠ 0 → ERR-BC-003 |
| E-4 | Unit test | Backend | Count bands overlapping → ERR-DC-003 |
| E-5 | Unit test | Backend | Count band gap → ERR-DC-005 |
| E-6 | Unit test | Backend | Count bands not starting at 0 → ERR-DC-002 |
| E-7 | Unit test | Frontend | `validateCountBands` — valid 3-band config returns null |
| E-8 | Unit test | Frontend | `validateCountBands` — gap between bands returns error string |
| E-9 | Integration test | Full-stack | Stage 1: add optional component with `isBenefitComponent=true`; save and reload; verify SI locked to 0 and model locked to FLAT |
| E-10 | Integration test | Full-stack | Stage 5: benefit component with `isAvailable=true` and SI=0; verify contribution inputs are editable and accept positive values |
| E-11 | Integration test | Full-stack | Stage 5: benefit component with `isAvailable=false`; verify contributions locked to 0 |
| E-12 | Integration test | Full-stack | Stage 4: add "Dependent Count" parameter targeting Parents with 3 bands; verify `2 × 3 = 6` policy options (with one other parameter of 2 options) |
| E-13 | Integration test | Full-stack | Stage 5: Dependent Count option shows effective SI label (base + enhancement) |
| E-14 | Integration test | Enrollment | Employee enrolls with 2 parents; SI enhancement applied; correct premium tier selected |
| E-15 | Integration test | Enrollment | Employee enrolls with 5 parents (outside all bands); enrollment blocked with correct error message |
| E-16 | Unit test | ibp-service | `applyToDependents=true` on Age parameter; employee 25 y (₹2,000 band) + dependent son 16 y (₹1,000 band) → total ₹3,000 (not ₹4,000) |
| E-17 | Unit test | ibp-service | `applyToDependents=false` (default); same employee + dependent with `premiumPerLife=true` → ₹2,000 × 2 lives = ₹4,000 (existing behaviour unchanged) |
| E-18 | Unit test | ibp-service | `applyToDependents=true` on Grade parameter; employee's grade band is applied to all dependents; no per-dependent Grade lookup attempted |
| E-19 | Unit test | ibp-service | `applyToDependents=true` on Gender parameter; female dependent matches Female band even when employee is male |
| E-20 | Unit test | service-lib | `resolveApplyToDependentsPremium` returns correct sum for mixed family batch (addition + deletion) |
| E-21 | Integration test | scheduler | `premiumCalculator()` in `processEnrollmentUpload` (bypassMode=false) dispatches to per-dependent resolution when `applyToDependents=true`; correct `grossPremium` written to endorsement |
| E-22 | Frontend | Stage 4 UI | `applyToDependents` checkbox appears for all parameter types; defaults to unchecked |
| E-23 | Frontend | Stage 4 UI | Checking `applyToDependents` on a Grade parameter shows advisory `Alert`; checking on an Age parameter does not show advisory |
| E-24 | Frontend | Stage 4 UI | Unchecking `applyToDependents` removes the advisory alert |

---

## 10. Validation Rules Summary

### Optional Component SI=0 Acceptance Rules (FR-054 — NEW)

| Rule | Validated In |
|---|---|
| Any component with `type === "optional"` MAY have one or more `sumInsuredOption.value === "0"` entries, with or without `isBenefitComponent=true` | Frontend (Stage 1 allows 0 in SI input for optional) + Backend policy-service (§4.2a) |
| FR-054.1: A blank/empty SI input on an optional component is treated as `0` — no "SI Amount must be > 0" error is shown. On blur the field is normalised to the string `"0"` so downstream code never sees an empty string. | Frontend [ConfiguratorFields.tsx](apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/ConfiguratorFields.tsx) (`handleInputBlur` + `isInvalidValue` guard) + [PolicyComponentsSection.tsx](apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyComponentsSection.tsx) form-level validator + Backend coercion (§4.2a #4) |
| Stage 5 contribution fields for optional components with `isAvailable=true` are editable regardless of SI value (including 0) | Frontend Stage 5 (§6.4.1) + Backend policy-service (§4.3) |
| Enrollment / dependent add / re-enrollment must NOT raise "sum insured must be positive" for optional components with SI=0 | ibp-service company-employee.service (§5.2) |
| Batch upload `premiumCalculator` returns the configured Stage 5 contribution amount for SI=0 optional components (no SI-multiplier path, no divide-by-SI) | service-lib `premium-calculator.util.ts` (§11.3) |
| Bypass-mode aggregation (`bypassPremiumAmount`) is unaffected by SI value — already independent of SI | scheduler `processEnrollmentUpload` (§11.3) |
| `applyToDependents=true` resolution sums per-life premiums correctly when one or more resolved Stage 5 choices have SI=0 (zero contributions contribute zero, not "skip life") | ibp-service + shared `per-dependent-resolution.util.ts` (§11.3) |
| Base / parental components retain SI > 0 enforcement (unchanged) | Frontend + Backend |
| Optional components with `isAvailable=false` retain contribution zero-lock per FR-032 (unchanged) | Frontend + Backend |

### Benefit Component Rules (FR-042, FR-043, FR-048)

| Rule | Validated In |
|---|---|
| `isBenefitComponent` may only be `true` on `optional` type components | Frontend (UI disables checkbox for non-optional) + Backend (ERR-BC-001) |
| (FR-054.3) `isBenefitComponent` is a pure semantic marker — no UI locks, no extra backend constraints. SI model, SI option count, and SI value follow the standard optional-component rules (FR-054 / FR-054.1). Toggling the flag does NOT mutate `sumInsuredModel` or `sumInsuredOptions`. | Frontend [PolicyComponentsSection.tsx](apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyComponentsSection.tsx) (no `isBenefitComponent` gates on model toggle / Add Sum Insured / SI input) + Frontend [usePolicyComponentsManager.ts](apps/ui/iwork/src/app/pages/PolicyPage/hooks/usePolicyComponentsManager.ts) (`handleIsBenefitComponentChange` only flips the boolean) + Backend [policy.service.ts](apps/services/policy-service/src/app/policy/policy.service.ts) (`validateBenefitComponents` retains only ERR-BC-001) |
| Stage 5 contributions are NOT locked to 0 when `isBenefitComponent=true && isAvailable=true` | Frontend + Backend |
| Contributions ARE locked to 0 when `isAvailable=false` (applies to all components including benefit components) | Frontend + Backend |

### Dependent Count Band Rules (FR-044, FR-045)

| Rule | Validated In |
|---|---|
| At least one count band required | Frontend + Backend (ERR-DC-001) |
| First band: `minCount = 0` | Frontend (first row min locked) + Backend (ERR-DC-002) |
| Bands non-overlapping | Frontend + Backend (ERR-DC-003) |
| Bands contiguous (no gaps) | Frontend + Backend (ERR-DC-005) |
| Only last band may have `maxCount = null` | Frontend + Backend (ERR-DC-004) |
| `siEnhancement ≥ 0` | Frontend (min=0 on input) + Backend (ERR-DC-006) |

### Enrollment-Time Dependent Count Rules (BR-028)

| Rule | Validated In |
|---|---|
| Enrolled member count must fall into exactly one band | ibp-service (enrollment blocked if unmatched) |
| `effectiveSI = baseSI + siEnhancement` applied at enrollment | ibp-service |

### `applyToDependents` Rules (FR-050, FR-051, FR-052, FR-053; BR-029, BR-030, BR-031)

| Rule | Validated In |
|---|---|
| `applyToDependents` is an optional boolean; absent or `null` treated as `false` | Backend (ERR-ATD-001 for non-boolean value) |
| When `applyToDependents=true` on Age or Gender parameter: each dependent's own attribute value (DOB → age; gender field) is used to resolve their policy option independently | ibp-service + premiumCalculator (via shared utility) |
| When `applyToDependents=true` on Grade/Designation/MaritalStatus/CustomList/CustomRange: employee's resolved attribute band is silently applied to all dependents (FR-052 fallback) | ibp-service + premiumCalculator (ERR-ATD-002 not triggered for these types) |
| When `applyToDependents=true`: `premiumPerLife` multiplier is NOT applied on top of the summed individual premiums (FR-053) | ibp-service + premiumCalculator |
| `applyToDependents=true` and `applyToDependents=false` parameters can coexist in the same policy; each component's premium is computed independently | ibp-service + premiumCalculator |
| Advisory warning (non-blocking) shown in Stage 4 UI for employee-level-only attribute types when `applyToDependents=true` | Frontend only — no server-side rejection |
| `applyToDependents` has no effect in bypass-mode batch uploads — see Enrollment-Without-Policy-Configuration-TechSpec.md §5.4 and ASM-007 | N/A (bypass path does not call premiumCalculator) |

---

## 11. Impact Analysis — Optional Component SI=0 Unconditional Acceptance (FR-054)

This section enumerates every code path that today gates on `sumInsured > 0` or couples SI=0 acceptance to `isBenefitComponent=true`, and prescribes the minimum change to make SI=0 universally valid for `type === "optional"` components without breaking inception or enrollment.

### 11.1 Inventory of Affected Code Paths

| # | Layer | File | Existing Behaviour | Required Change |
|---|---|---|---|---|
| 1 | policy-service (Stage 1 save) | `apps/services/policy-service/src/app/policy/policy.service.ts` | SI=0 only permitted when `isBenefitComponent=true` (ERR-BC-003 family) | Allow SI=0 on any optional component; see §4.2a |
| 2 | policy-service (Stage 5 save) | same | Contribution zero-lock keyed off `isAvailable === false`; benefit-component carve-out added in §4.3 | Broaden carve-out to all `type==="optional"`; see §4.3 |
| 3 | ibp-service (employee enrollment) | `apps/services/ibp-service/src/app/company-employee/company-employee.service.ts` | "Sum insured must be positive" guard during choice selection (currently bypassed only when `isBenefitComponent=true`) | Bypass for any `type==="optional"`; see §5.2 |
| 4 | ibp-service (dependent add / edit) | same service + dependent handlers | Same SI > 0 revalidation on dependent-side endpoints | Apply identical relaxation; verify no separate guard exists in `dependent.service.ts` |
| 5 | service-lib (batch premium calc) | `apps/services/service-lib/src/lib/utils/premium-calculator.util.ts` | Computes per-component premium from Stage 5 `companyContribution + employeeContribution`; does not divide by SI on the configurator-driven path — but verify no `if (sumInsured === 0) skip` short-circuit exists | Remove any SI > 0 short-circuit that drops optional components with SI=0 from the totals |
| 6 | service-lib (per-dependent resolution) | `apps/services/service-lib/src/lib/utils/per-dependent-resolution.util.ts` (new — §5.4) | Sums per-life premiums | No code change required, but tests must cover a per-life premium where the resolved choice has SI=0 — that life contributes 0, not "skip" |
| 7 | service-lib (bypass-mode aggregation) | `processEnrollmentUpload` in scheduler / `service-lib` | Aggregates `bypassPremiumAmount` (signed) independently of SI | No code change — already SI-agnostic; document confirmation in §11.3 |
| 8 | Frontend Stage 1 | `PolicyComponentsSection.tsx` + `ConfiguratorFields.tsx` | SI input for optional components allows 0 today only when `isBenefitComponent=true` is set first; blank input is flagged as invalid ("SI Amount must be > 0") on form submit | (a) Allow 0 as a free-form value for optional components irrespective of the benefit flag; (b) **FR-054.1**: treat blank SI as 0 for optional components — skip the "blank" branch of `isInvalidValue`, and normalise blank → `"0"` in `handleInputBlur` so persisted JSONB carries `"0"` not `""`. Keep the benefit flag's existing locks (FLAT + single SI=0 entry) intact when toggled on. |
| 9 | Frontend Stage 5 | `PolicyChoicesSection.tsx` | Contribution-lock check possibly includes `sumInsured.value === "0"` | Drop SI=0 from the lock condition for optional components; see §6.4.1 |
| 10 | Frontend Stage 5 (validation guard) | manager hook | "All choices must have SI > 0" rule may exist as a Stage 5 completion guard | Restrict the guard to base/parental components; allow SI=0 choices for optional |
| 11 | Frontend Stage 4 (Cartesian product) | wizard cartesian builder | Builds options purely from parameter dimensions × SI options | No change — SI=0 already participates as an SI option ID; verify the resulting `optionMeta` resolves to a valid Stage 5 row |
| 12 | Frontend enrollment UI (iwork employee portal) | wherever the optional add-on selector renders | May display SI in the option label; SI=0 may render as "₹0" already | Confirm display string treats 0 sensibly (e.g., "₹0 (Benefit)") — non-blocking polish |
| 13 | Frontend enrollment validation | same | "Please select a non-zero SI" warning may appear | Remove for optional components |
| 14 | Endorsement / re-enrollment | `apps/services/ibp-service/src/app/endorsement/*` and re-enrollment handlers | Endorsement diff may classify SI=0 → SI=0 as a no-op but reject the choice during validation | Ensure endorsement validators inherit the relaxed rule from §5.2 |
| 15 | Reports / exports | wherever SI is displayed in dashboards | None blocking; SI=0 must render gracefully | Display sanity only |
| 16 | Insurer payload generation | bulk-data export / insurer-formatted CSV writers | Some insurer schemas require SI > 0 on a component row | Document downstream constraint; out of scope for this spec but flagged in §11.4 |

### 11.2 End-to-End Inception → Enrollment Flow Walkthrough

Trace of a single zero-SI optional component end-to-end to confirm no break:

```
1. Admin creates policy in PolicyConfigurator wizard
   Stage 1: adds "Wellness Allowance" optional component with FLAT model, SI = [0]
            → policy-service §4.2a: ACCEPTED (FR-054)
   Stage 4: adds Age parameter with 3 ranges
   Stage 5: for each (Age, SI=0) row, sets companyContribution=500, employeeContribution=0
            → policy-service §4.3: ACCEPTED (isAvailable=true + optional → no zero-lock)
   Stage 6: review & publish → policy saved

2. HR initiates enrollment for employee E1 (age 30, no dependents)
   ibp-service company-employee.service:
   - Resolves Age band → matches Stage 5 choice (SI=0, premium=500)
   - §5.2 guard: component.type==="optional" + SI=0 → ACCEPTED (no "SI must be positive" error)
   - Persists enrollment row with sumInsured=0, premium=500

3. Employee E1 self-enrolls a dependent in the optional component
   - Same guard path; dependent enrollment row saved with sumInsured=0

4. Batch upload monthly endorsement (bypassMode=false)
   service-lib premiumCalculator:
   - Per-component loop reaches "Wellness Allowance"
   - §11.1 row 5: no SI>0 short-circuit; uses Stage 5 contribution verbatim
   - Total premium for this component = 500 (no per-life multiplication unless premiumPerLife=true)
   - grossPremium aggregated correctly

5. Endorsement reflection / re-enrollment
   - §11.1 row 14: endorsement diff inherits §5.2 relaxation → no rejection
```

Each step is now SI=0-safe for optional components. The only mandatory code edits are §4.2a, §4.3 (broaden), §5.2 (broaden), and the Stage 1 / Stage 5 frontend lock relaxations.

### 11.3 Specific Modules to Audit (Search Targets)

When implementing FR-054, perform a repository-wide search for the following patterns and apply the relaxed rule to each match where the surrounding context is an optional-component path:

- `sumInsured > 0`
- `sumInsuredValue > 0`
- `parseInt(sumInsuredId.value) > 0`
- `value === "0"` in proximity to "contribution" or "premium" or "lock"
- `Sum insured must be` / `SI must be` / `cannot be zero` (string literals — error messages)
- `isBenefitComponent` (every existing reference is a candidate for broadening to `type === "optional"`)
- `bypassSumInsured` and `bypassPremiumAmount` aggregation — confirm independence from SI (already true; flagged for memory cross-check with `[[project_bypass_deletion_pending]]`)

Each match should be triaged: if the surrounding component is `optional`, relax; if `base` / `parental`, leave alone.

### 11.4 Out-of-Scope / Downstream Considerations

- **Insurer payload schemas** (CSV / XML exports to insurance partners) may reject rows with SI=0. This is an external contract; FR-054 does not modify exporters. A separate spec should address per-insurer mapping (e.g., emit "BENEFIT" SI placeholder or omit the row).
- **Premium reconciliation reports** that compute `premium / SI` ratios must guard against division-by-zero. Out of scope for this spec; if such reports exist, they should branch on `SI === 0 → display "—"`.
- **Bypass-mode batch deletion** handling for SI=0 optional components — cross-reference `[[project_bypass_deletion_pending]]` memory; expected to be addressed in the bypass deletion follow-up, not here.

### 11.5 New Task Group F — FR-054 Rollout (depends on B + C + D)

| # | Task | File(s) | Notes |
|---|---|---|---|
| F-1 | Broaden policy-service Stage 1 validation: accept SI=0 for any `type==="optional"` component | `apps/services/policy-service/src/app/policy/policy.service.ts` | See §4.2a |
| F-2 | Broaden policy-service Stage 5 contribution lock carve-out from benefit-only to all optional | same file | See §4.3 updated block |
| F-3 | Broaden ibp-service enrollment SI=0 acceptance to all optional components | `apps/services/ibp-service/src/app/company-employee/company-employee.service.ts` + dependent handlers | See §5.2 updated block; covers portal + HR-initiated + dependent add/edit |
| F-4 | Audit `premium-calculator.util.ts` for any SI > 0 short-circuit on optional components; remove if present | `apps/services/service-lib/src/lib/utils/premium-calculator.util.ts` | See §11.1 row 5 |
| F-5 | Audit endorsement / re-enrollment validators for SI > 0 assertions; relax for optional components | `apps/services/ibp-service/src/app/endorsement/*` | See §11.1 row 14 |
| F-6 | Frontend Stage 1: allow SI=0 in SI option input for optional components irrespective of `isBenefitComponent`; also treat blank SI as 0 for optional components (FR-054.1) — skip blank-invalid branch and normalise blank → `"0"` on blur | `PolicyComponentsSection.tsx` + `ConfiguratorFields.tsx` | See §11.1 row 8 |
| F-7 | Frontend Stage 5: drop `sumInsured.value === "0"` from contribution lock condition for optional components | `PolicyChoicesSection.tsx` | See §6.4.1 |
| F-8 | Frontend Stage 5 completion guard: restrict "SI > 0 required" to base/parental components | manager hook | See §11.1 row 10 |
| F-9 | Frontend enrollment validator: remove "select non-zero SI" warning on optional add-on selector | iwork enrollment pages | See §11.1 row 13 |
| F-10 | Integration test: create optional component with SI=0 (NO benefit flag); complete Stage 5 with positive contributions; publish; enroll employee + dependent end-to-end; assert no errors and correct premium | full-stack | New E-25 |
| F-11 | Integration test: batch upload (bypassMode=false) for the same policy; assert `grossPremium` correctly reflects SI=0 optional component contributions | scheduler | New E-26 |
| F-12 | Integration test: optional component with SI=0 + `applyToDependents=true` on Age; assert per-life sum is correct (SI=0 lives contribute 0, not skipped) | ibp-service | New E-27 |
| F-13 | Regression test: optional component with SI > 0 still behaves identically to today | full-stack | New E-28 |
| F-14 | Regression test: base/parental component still rejects SI=0 at Stage 1 save | backend | New E-29 |
| F-15 | Integration test (FR-054.1): create optional component, leave SI input blank, blur the field — assert no error shown, input displays `"0"`, and saved JSONB has `sumInsuredOptions[0].value === "0"` (not `""`) | frontend + backend | New E-30 |
| F-16 | Regression test (FR-054.1): base/parental SI left blank still shows "SI Amount must be > 0" error | frontend | New E-31 |

### 11.6 Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Hidden SI > 0 assertion in a downstream service (e.g., reports, exports) causes silent data loss | Medium | §11.3 audit + grep checklist; F-4/F-5 explicitly audit |
| Insurer payload rejection on SI=0 row | High for some insurers | Out of scope (§11.4); flag to product team before rollout |
| Existing dashboards display "SI: ₹0" confusingly | Low | UI copy review during F-6/F-9 |
| Premium-per-SI ratio reports divide by zero | Low | §11.4 — separate report-layer fix |
| Migration: existing policies with `isBenefitComponent=true` continue to work | Zero — FR-054 is purely additive | Backwards-compatible by construction |

---

*Document generated: 2026-05-26*
*Updated: 2026-05-26 — Added Feature 3: `applyToDependents` parameter flag (FR-050 through FR-053; BR-029 through BR-031)*
*Updated: 2026-05-28 — Added Feature 0 / FR-054: Optional Component SI=0 Unconditional Acceptance; broadened benefit-component SI=0 carve-outs to all `type==="optional"` components; added §4.2a, §11 impact analysis, Task Group F, and updated §4.3 / §5.2 / §6.4.1 / Validation Rules Summary*
*Updated: 2026-05-28 — Added FR-054.1: blank SI input on optional components is treated as 0 (no "must be > 0" error) and normalised to `"0"` on blur. Updated Feature 0 overview, §4.2a #4, §10 rules, §11.1 row 8, Task F-6, and new tests F-15/F-16.*
*Updated: 2026-05-29 — Added FR-054.2: relaxed the historical "benefit component SI must equal 0" rule. Admin may now leave the SI input blank (falls back to `0`) or supply any non-negative value, stored verbatim. Toggling the benefit flag preserves the existing SI value and only seeds `"0"` when blank. Updated Feature 1 overview, §4.2 #3/#3a/#3b, ERR-BC-003 error table, and Benefit-Component rules summary.*
*Updated: 2026-05-29 — Added FR-054.3 (supersedes FR-054.2): `isBenefitComponent` is now a pure semantic marker. Removed all UI locks (SI model toggle, "Add Sum Insured" button, single-option enforcement) and all backend value validators tied to the flag (ERR-BC-002 and ERR-BC-003 deleted). Only ERR-BC-001 remains. `handleIsBenefitComponentChange` simplified to flip the boolean only. Updated Feature 1 overview, §4.2, ERR table, rules summary, and removed `BENEFIT_COMPONENT_SI_VALUE` import in policy.service.ts.*
*Features: Optional Component SI=0 (FR-054) + Benefit/Waiver Component (FR-042, FR-043, FR-048) + Dependent Count Parameter (FR-044 through FR-049) + applyToDependents (FR-050 through FR-053)*
