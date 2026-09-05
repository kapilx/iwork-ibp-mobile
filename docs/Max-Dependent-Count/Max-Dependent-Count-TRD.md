# Max Dependent Count Parameter — TRD

**Internal type:** `max-dependent-count`
**Status:** Implemented

## 1. Overview

Policies can already cap dependents **per relation type** (e.g. max 2 "Child" per employee) via `enabledPolicyRelations[].maxCount`. That cap is fixed for every family on the policy and can't vary by plan tier.

"Max Dependent Count" adds a second, independent cap on the **total** number of dependents (across all relation types combined) a single family may enroll — with the twist that the limit itself is **variable per family**: the admin configures one or more named `{label, max}` options on the policy, and the enrollment upload template exposes a "Max Dependent Count" dropdown column where the uploader picks which option applies to that specific employee's family. Validation resolves the cap from whichever label was chosen, not a single fixed number.

**Example:** Admin configures options `D1-2` (max 2), `D1-4` (max 4). An uploaded row for Employee E1 sets Max Dependent Count = `D1-2`. If E1's file contains 3 dependent rows, the whole employee is rejected with `ER0071`.

This is purely an **additive validation layer** — it runs on top of, not instead of, the existing per-relation-type `maxCount` checks and the twin/triplet override logic.

## 2. Scope

### In scope
- Policy Configurator: new, single-instance-per-policy parameter type with a repeatable `{label, max}` option list (no `min` — see §5).
- Enrollment template generation: dynamic "Max Dependent Count" column, populated as a dropdown of configured labels.
- `processEnrollmentUpload` (`enrollment-upload.scheduler.ts`): reads the label from the employee's own row, resolves the matching option, and rejects the employee (with the rest of the batch continuing) if their total dependent count exceeds that option's max.

### Out of scope
- `updatedProcessEnrollmentUpload`, `EnrollmentProcessingService.validateDependentAges` (real-time API path), and `processEnrollmentFile` (`enrollment-file-upload.util.ts`) — the other three independent implementations of relation-level maxCount/twin-triplet validation in this codebase — do **not** enforce this new check. Only the legacy/bypass-capable `processEnrollmentUpload` path was wired up, matching what was explicitly requested.
- The "mapped template" variant (`generateEnrollmentMappedTemplate`, used only when an org has a custom column-mapping template configured) will only surface the new column if that org's mapping template already has an entry for it — the same pre-existing limitation every other dynamically-configured parameter has in that path. Not fixed here.
- A floor/minimum dependent count is not enforced — only exceeding `max` is a validation failure.
- `bypassMode` uploads: skipped entirely, consistent with every other config-driven check in this function (bypass is a "trust the file" fast path that never loads the LIVE policy config for validation).

## 3. Data Model

**File:** `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/policytypes.ts`

```typescript
export interface MaxDependentCountOption {
  id: string;
  label: string;   // matched against the value the user types in the upload template column
  max: string;      // total dependents allowed for that label; exceeding it fails the employee
}

export interface MaxDependentCountDetailConfig {
  options: MaxDependentCountOption[];
  nextOptionId: number;
}

// ConfiguredPolicyParameter:
type: "range" | "list" | "relation" | "dependent-count" | "dependent-attribute" | "max-dependent-count";
maxDependentCountConfig?: MaxDependentCountDetailConfig; // only for type === "max-dependent-count"
```

This is exactly what gets JSON-serialized into `policyConfiguration.parameters[]` on save (`PolicyParametersSection.validateAndGetData`) — no server-side transform, same as `dependent-count`/`dependent-attribute`.

**Backend constant** (duplicated in both `libs/service-lib/src/lib/constants.ts:2091` and the drifted copy `apps/services/service-lib/src/lib/constants.ts:2485`, matching the existing pattern for `DEPENDENT_COUNT_INTERNAL_TYPE`):

```typescript
export const MAX_DEPENDENT_COUNT_INTERNAL_TYPE = "max-dependent-count";
```

## 4. Frontend Changes (Policy Configurator)

| File | Change |
|---|---|
| `PolicyConfigurator/policytypes.ts` | `"Max Dependent Count"` entry added to `PolicyParameterMaster` (`policytypes.ts:132`), **not** added to the `isRepeatable` list in `PolicyParametersSection.tsx` — so once configured it drops out of the "Select Parameter" dropdown (added-once semantics). New interfaces per §3. |
| `hooks/usePolicyParametersManager.ts` | Init block seeds one blank option on add. New handlers `onAddMaxDependentCountOption`, `onRemoveMaxDependentCountOption`, `onMaxDependentCountOptionChange` (mirrors the existing `onAddCountBand`/`onRemoveCountBand`/`onCountBandChange` triad for Dependent Count bands). Validation branch in `validateParameters`: label required + unique across options (labels are the lookup key at upload time — duplicates would make the match ambiguous), max required and non-negative. |
| `PolicyConfigurator/PolicyParametersSection.tsx` | "Apply to Dependents" toggle hidden for this type (same block/rationale as `dependent-attribute`/`dependent-count`, `PolicyParametersSection.tsx:~317-323`). New `MaxDependentCountDetailItem` sub-component: an info `Alert` plus a table of options (Label, Max, remove icon) and an "Add Option" button — modeled directly on `DependentCountDetailItem`'s band table, minus the target-relation-category select and the Min column. |
| `constants/index.ts` | `POLICY_PARAMETERS.MAX_DEPENDENT_COUNT_INFO` — the info banner copy. |

## 5. Design Decision: No `min`, Multiple Named Options

The feature went through two iterations before landing here:

1. **v1:** single `{label, min, max}` on the parameter, applied uniformly to every employee. Rejected — `min` was never actually enforced (only exceeding `max` fails an upload; a floor doesn't map to an upload-time rejection), and a single global value can't express "this plan tier allows more dependents than that one."
2. **v2 (current):** `min` dropped entirely; the parameter now holds a **list** of `{label, max}` options, and the enrollment template's "Max Dependent Count" column lets the uploader pick which option applies **per employee** by label. This is what's implemented.

## 6. Enrollment Template Column Injection

**File:** `apps/services/policy-service/src/app/policy/policy.service.ts`

Two new private helpers (`policy.service.ts:6200`, `:6208`), modeled on the existing `isSezConstraintEnabled`/`buildSezApplicableField` pair:

```typescript
private getMaxDependentCountParam(config: any): any {
  return (config?.parameters || []).find(
    (p: any) =>
      p.type === MAX_DEPENDENT_COUNT_INTERNAL_TYPE ||
      p.internalType === MAX_DEPENDENT_COUNT_INTERNAL_TYPE,
  );
}

private buildMaxDependentCountField(param: any): DataTemplateField {
  const options = (param?.maxDependentCountConfig?.options || [])
    .map((opt: any) => String(opt.label ?? "").trim())
    .filter((label: string) => label.length > 0);
  return {
    fieldName: param?.displayName?.trim() || "Max Dependent Count",
    fieldType: "list",
    options,
  };
}
```

This codebase independently builds the enrollment-template field list in **three** places — the shared `buildEnrollmentTemplateFieldList` helper (used by `generateEnrollmentMappedTemplate` and one other caller), and two further inline duplicates inside `generateTemplate` and `generateEnrollmentTemplate`. All three needed the identical two-part change:

1. The generic "Add parameter fields" loop (which turns every `config.parameters` entry into a template column) already special-cases `parameterMasterName === "Age"` and `type === "relation"` to skip them — `type === "max-dependent-count"` was added to that same exclusion, since this parameter needs its own field shape (`options` = labels, not `lovDetails`), not the generic range/list treatment.
2. A `getMaxDependentCountParam`/`buildMaxDependentCountField` block was inserted immediately after each existing SEZ-field injection point, so the column only appears when the parameter is actually configured with ≥ 1 option.

**Sample-row population** (`generateEnrollmentTemplate`'s `generateRow` closure, the "unmapped"/default template path): mirrors the SEZ field's employee-only convention — the Self row gets the first configured option's label as a sample value; every dependent row gets blank, since the label is a per-family, employee-level attribute.

## 7. Upload Validation

**File:** `apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts`, function `processEnrollmentUpload` (`:1101`).

### 7.1 Config load

```typescript
const maxDependentCountParam = !bypassMode
  ? ((config?.policyConfiguration as any)?.parameters || []).find(
      (p: any) =>
        p.type === MAX_DEPENDENT_COUNT_INTERNAL_TYPE ||
        p.internalType === MAX_DEPENDENT_COUNT_INTERNAL_TYPE
    )
  : null;
const maxDependentCountOptions = (maxDependentCountParam?.maxDependentCountConfig?.options || [])
  .map((opt) => ({ label: String(opt.label ?? "").trim(), max: Number(opt.max) }))
  .filter((opt) => opt.label && !Number.isNaN(opt.max));
const maxDependentCountFieldName =
  maxDependentCountParam?.displayName?.trim() || "Max Dependent Count";
```

### 7.2 Column location

The column isn't a fixed/mapped field like `relation`/`date_of_birth` — it's dynamically named after `param.displayName`, exactly as it was written into the template (§6). It's located the same way the file's `SI`/`Premium` bypass columns are (`headerValues.findIndex` + `normalizeHeader`), not via the `mappings`/`getColumnIndex` path used for fixed core fields:

```typescript
const maxDependentCountIdx = maxDependentCountOptions.length
  ? headerValues.findIndex(
      (h) => normalizeHeader(h) === normalizeHeader(maxDependentCountFieldName)
    )
  : -1;
```

### 7.3 Capture

The label is stored on the in-memory `RowCollect` object as `maxDependentCountLabel`, resolved one of two ways depending on whether this upload includes the employee's Self row:

- **Self + dependent(s) added in the same file:** read directly from `values[maxDependentCountIdx]` when the Self row is built.
- **Dependent-only upload (Self was enrolled in an earlier file):** `currentEmployee` is reconstructed from the DB via `getEmployeeDetailsWithDependentsIfExists` instead of this file's Self row, so there's no current-file cell to read. The label is recovered from the employee's persisted `additionalParams` JSON column instead — the column's raw value already flows into `additionalParams` via the generic per-header capture loop (any header without a fixed `staticKey` mapping falls into `additional[header] = val`, which becomes `companyEmployee.additionalParams` and gets saved with the employee record), so it's recoverable on any later upload as long as the original Self-row upload included the column. `resolveMaxDependentCountLabelFromAdditionalParams()` does a `normalizeHeader`-tolerant key lookup against `maxDependentCountFieldName` to find it. Both DB-reconstruction sites (`existingEmployeeRowIndex === -1` branches) populate `maxDependentCountLabel` this way.

Dependent rows within a file never carry their own value for this column — matches the template's employee-only convention. If the parameter was configured *after* an employee's original enrollment (so their stored `additionalParams` never had this key), the label resolves to `undefined` and the check is skipped for that employee — same as any other blank-label case (§7.4).

### 7.4 Validation

`validateMaxDependentCountForEmployee()` runs at every point `currentEmployee`'s dependent set is known to be complete — the same employee-boundary flush points already used by the twin/triplet `flushPendingChildOverrides()` deferred-validation mechanism (4 call sites: end of previous employee's Self row processing, and 3 places at the end of the file/queue loop).

```typescript
const validateMaxDependentCountForEmployee = () => {
  if (!currentEmployee || !maxDependentCountOptions.length) return;
  const label = currentEmployee.maxDependentCountLabel;
  if (!label) return; // no label given — nothing to enforce
  const matchedOption = maxDependentCountOptions.find(
    (opt) => normalizeValue(opt.label) === normalizeValue(label)
  );
  if (!matchedOption) {
    // ER0072 — label doesn't match any configured option
  }
  const totalDependents = (currentEmployee.dependents || []).length;
  if (totalDependents > matchedOption.max) {
    // ER0071 — exceeded
  }
};
```

`normalizeValue` (lowercase, strip non-alphanumerics) is the same matcher already used throughout this file for relation-name comparisons — consistent tolerance for casing/spacing differences between the configured label and what a user typed.

| Condition | Behavior |
|---|---|
| No "Max Dependent Count" parameter configured on the policy | Check is a no-op (`maxDependentCountOptions.length === 0`) |
| Column present in file, employee's cell blank | Check skipped for that employee — not mandatory |
| Label given, doesn't match any configured option (typo) | Employee rejected — `ER0072` |
| Label matches an option, total dependents ≤ option's max | Passes |
| Label matches an option, total dependents > option's max | Employee rejected — `ER0071` |
| `bypassMode` upload | Check entirely skipped (config never loaded for validation in this mode) |

### 7.5 Failure semantics

Reuses the existing rejection pipeline verbatim — no new mechanism was added. Setting `currentEmployee.hasError = true` causes the employee's row **and every one of their dependent rows** to be pushed into the in-memory `errors` array (via the existing per-employee grouping/rejection logic), which becomes an Excel error file uploaded to S3 and tracked on the upload's summary record (`errorCount`/`errorFileUploadId`). The rest of the batch is unaffected — the outer row-processing loop simply `continue`s to the next employee.

## 8. New Messages

**File:** `libs/service-lib/src/lib/messages.ts:1096-1097`

```
ER0071: "Total dependents added exceed the policy's configured Max Dependent Count limit for this family."
ER0072: "Max Dependent Count value does not match any configured option label for this policy."
```

## 9. Known Limitations

- **Single upload path.** Only `processEnrollmentUpload` enforces this — the other three parallel relation-maxCount implementations in this codebase (see §2, out of scope) do not. An employee added via a different upload path (e.g. real-time API enrollment) is not subject to this cap today.
- **Mapped-template gap.** Orgs using a custom column-mapping template won't see the new column until their mapping template is updated to include it — pre-existing behavior for any dynamically-added parameter, not specific to this feature.
- **No floor enforcement.** `min` was deliberately removed (§5) — a family with fewer dependents than "expected" for their label is never rejected.
- **Silent skip on blank label.** If the parameter is configured but an employee's upload leaves the column blank, no cap is enforced for that employee rather than defaulting to the most restrictive (or any) option.
- **Deletions are not netted against the cap.** Dependent rows with `intakeType === "deletion"` are diverted into a separate `dependentDeletionRows` array and processed in a wholly separate block (`enrollment-upload.scheduler.ts:~2784+`) that never touches `currentEmployee.dependents` or calls `validateMaxDependentCountForEmployee`. A deletion-only or mixed addition+deletion upload does not have its net effect on family size reflected in this check.
- **Label lookup via a renamed mapped column will miss.** `resolveMaxDependentCountLabelFromAdditionalParams` (§7.3) matches keys in the employee's stored `additionalParams` against `maxDependentCountFieldName` via `normalizeHeader`. If an org's column-mapping template renames the source header to a different `target_column_name` before it's captured into `additionalParams`, the stored key won't match and the label will resolve to `undefined` on a later dependent-only upload — same root cause as the mapped-template gap above, not separately fixed.
