# Tech Spec: Replace Policy Locations Step with Address-Type-Driven Sync

**Branch:** TBD
**Date:** 2026-05-22
**Supersedes:** the previous version of this document, which described enhancements to the 7th policy-configurator step (`policyLocations`). That step is now being removed.

---

## Background

The 7th policy-configurator step (`policyLocations`) was introduced to let users manage a per-policy list of "policy locations" stored in `company_policy_configuration_location`. That step is being retired. Policy locations will instead be modelled as ordinary company addresses tagged with a new `ADDRESS_TYPE_POLICY_LOCATION` lookup value; the `company_policy_configuration_location` table is now auto-synced from those addresses on company save.

The enablement toggle (`enablePolicyLocations`) on the policy configuration stays — it still gates the "Policy Location" column in the inception template and upload validation. Only the manual location-list step/UI is removed.

---

## Scope of Changes

### Requirement 1 — Add `ADDRESS_TYPE_POLICY_LOCATION` lookup value

**What:**
- Add a new row to `lookup_data`:
    - `lookup_key = "ADDRESS_TYPE_POLICY_LOCATION"`
    - `lookup_value = "Policy Location"`
    - same `lookup_type` as existing `ADDRESS_TYPE_OFFICE` / `ADDRESS_TYPE_BRANCH` rows
- Add a constant `ADDRESS_TYPE_POLICY_LOCATION = "ADDRESS_TYPE_POLICY_LOCATION"` to `libs/service-lib/src/lib/constants.ts` for backend references.

**Files to change:**

| File | Change |
|------|--------|
| `database-migrations/sql/add-address-type-policy-location.sql` (new) | `INSERT INTO lookup_data` with `ON CONFLICT (lookup_key) DO NOTHING` |
| `libs/service-lib/src/lib/constants.ts` | Export `ADDRESS_TYPE_POLICY_LOCATION` |

**Data shape:**
```sql
INSERT INTO lookup_data (lookup_key, lookup_value, lookup_type, lookup_order, status, created_at, updated_at, created_by, updated_by)
VALUES ('ADDRESS_TYPE_POLICY_LOCATION', 'Policy Location', '<address_type lookup_type>', <order>, 'ACTIVE', NOW(), NOW(), 1, 1)
ON CONFLICT (lookup_key) DO NOTHING;
```

> The exact `lookup_type` and `lookup_order` values are read from one of the existing `ADDRESS_TYPE_*` rows during implementation.

**Behaviour rules:**
- Seed is idempotent (`ON CONFLICT DO NOTHING`).
- No schema change.

---

### Requirement 2 — Auto-sync `company_policy_configuration_location` from company addresses

**What:**
On company create/update, after the regular `companyData.addresses` save loop, sync `company_policy_configuration_location` so it mirrors the set of company addresses whose `addressTypeLid` matches the new policy-location lookup id:
- Insert one row per policy-location address that is not yet in the table.
- Soft-delete rows whose `address_id` is no longer a policy-location address (or whose address was removed).
- `is_primary` stays `null` on insert (matches today's behaviour).

The dedicated `companyData.policyLocations` branch (and its DTO field) is removed entirely.

**Files to change:**

| File | Change |
|------|--------|
| `apps/services/org-service/src/app/company/comapny.service.ts` (~lines 780–820) | Delete the existing `policyLocations` branch (create-from-`policyLocations` + corresponding `deleteEntityTableMapIds`). After the `companyData.addresses` save block, add the sync step using the new lookup id. |
| `apps/services/org-service/src/app/company/dto/update-company.dto.ts` | Remove `policyLocations?: UpdateAddressDto[]`. Apply the same to the create DTO if it carries it. |
| `apps/services/org-service/src/app/company/company.repository.ts` | No change for writes. `getCompanyById` keeps returning `policyConfigurationLocations` (read paths are unaffected — the table still exists). |

**Sync algorithm (sketch):**
```ts
const policyLocationLid = await this.lookupRepository.findOneByKey(ADDRESS_TYPE_POLICY_LOCATION).id;

const policyLocationAddressIds = await entityManager.createQueryBuilder(CompanyAddress, "ca")
    .innerJoin("ca.address", "a")
    .where("ca.companyId = :companyId", { companyId })
    .andWhere("a.addressTypeLid = :lid", { lid: policyLocationLid })
    .select("a.id")
    .getRawMany<{ a_id: number }>()
    .then(rows => new Set(rows.map(r => r.a_id)));

const existingMapAddressIds = await entityManager.find(CompanyPolicyConfigurationLocation, {
    where: { company: { id: companyId } },
    select: ["id", "addressId"],
}).then(rows => new Map(rows.map(r => [r.addressId, r.id])));

const toInsert = [...policyLocationAddressIds].filter(id => !existingMapAddressIds.has(id));
const toRemove = [...existingMapAddressIds.keys()].filter(id => !policyLocationAddressIds.has(id));

// insert
for (const addressId of toInsert) {
    await entityManager.save(entityManager.create(CompanyPolicyConfigurationLocation, {
        company: { id: companyId },
        address: { id: addressId },
        isPrimary: null,
    }));
}
// soft-delete via existing helper
if (toRemove.length) {
    await this.companyRepository.deleteEntityTableMapIds(
        COMPANY_MAP_TABLE_DELETE_FIELDS.COMPANY_POLICY_CONFIG_LOCATION,
        toRemove,
        COMPANY_MAP_TABLE_DELETE_FIELDS.ADDRESS_ID,
        MAPPED_DATA_DELETION.MAP_REMOVED,
    );
}
```

**Behaviour rules:**
- The sync runs in the same transaction as the `companyData.addresses` save.
- A regular company address whose type is later changed away from "Policy Location" is soft-deleted from the mapping table on the next save.
- Existing rows are preserved when re-saving with no changes (set semantics).

---

### Requirement 3 — Remove the 7th step from the policy configurator

**What:**
- Drop the `policyLocations` step from `getSteps()` unconditionally.
- Delete `PolicyLocationsSection.tsx`.
- Delete the parked `PolicyLocationsTab` directory entirely.
- Remove the `FF_IWORK_POLICY_LOCATIONS` feature flag read; the step never renders.
- Move the **`enablePolicyLocations` checkbox** to an existing policy configuration step (the basic-details / constraints step — exact location chosen during implementation, near other policy-level flags). State plumbing (`enablePolicyLocations`, `onEnablePolicyLocationsChange`) is unchanged; only the rendering location moves.

**Files to change:**

| File | Change |
|------|--------|
| `apps/ui/iwork/src/app/pages/PolicyPage/Constants/index.ts` | Remove the `if (enablePolicyLocations) base.push("policyLocations")` branch. Keep `enablePolicyLocations: false` in `getInitialPolicyConfiguration()`. |
| `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/index.tsx` | Remove the `policyLocations` case from the step-renderer switch; remove `FF_IWORK_POLICY_LOCATIONS` usage; render the `enablePolicyLocations` checkbox inside the chosen existing step. |
| `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/PolicyLocationsSection.tsx` | **Delete.** |
| `apps/ui/iwork/src/app/pages/CompanyPage/PortalConfiguration/PolicyLocationsTab/` | **Delete entire directory.** |
| Any other consumer of `FF_IWORK_POLICY_LOCATIONS` | Remove the read. |

**Behaviour rules:**
- The `selectedLocationIds` field inside `policyConfiguration.configuration` is no longer written. (It can be left in saved JSON blobs — readers ignore it.)
- `enablePolicyLocations` continues to be persisted via the existing Next/Save flow.

---

### Requirement 4 — Stricter normalization for policy-location validation

**What:**
Tighten the case-/whitespace-insensitive comparison in the enrollment upload to strip **all** whitespace (not just leading/trailing) before comparing the excel cell against configured `addr_1` values.

**Files to change:**

| File | Change |
|------|--------|
| `apps/services/scheduler-service/src/app/scheduler/enrollment-upload.scheduler.ts` (~lines 1095 and 1685) | Replace both `.toLowerCase().trim()` calls with a new `normalizePolicyLocation` helper. |

**Helper:**
```ts
private normalizePolicyLocation(value: unknown): string {
    return String(value ?? "").toLowerCase().replace(/\s+/g, "");
}
```

**Behaviour rules:**
- `"  House  No 12  "` and `"houseno12"` are treated as equal.
- The `enablePolicyLocations` gate on the policy configuration still skips the validation block when off.
- `POLICY_LOCATION_REQUIRED_ERROR` / `POLICY_LOCATION_MISMATCH_ERROR` messages are unchanged.

---

### Requirement 5 — Guard against empty Policy Location pool when toggle is on

**Why:**
If `enablePolicyLocations = true` on a policy but the company has zero addresses of type `Policy Location`, every inception upload row fails the mismatch check. Block this state up-front instead of letting it surface late.

**What:**

- **UI (policy configurator):** disable the `Enable Policy Locations` checkbox when the loaded company has no address of type `ADDRESS_TYPE_POLICY_LOCATION`. Show a tooltip: `"Add at least one company address of type 'Policy Location' before enabling this."`
- **Backend (policy configuration save):** on save, if the incoming `enablePolicyLocations === true`, count company addresses whose `addressTypeLid === policyLocationLid`. If zero, reject the save with `400 BadRequest`: `"Cannot enable Policy Locations: no company address of type 'Policy Location' exists."`

**Files to change:**

| File | Change |
|------|--------|
| `apps/ui/iwork/src/app/pages/PolicyPage/PolicyConfigurator/index.tsx` (or whichever step we moved the checkbox into) | Fetch the company's address list (already in scope); compute `hasPolicyLocationAddress`; pass `disabled={!hasPolicyLocationAddress}` and a `Tooltip` to the `CommonCheckbox` |
| `apps/services/policy-service/src/app/policy/policy.service.ts` (policy configuration update method) | Before persisting, when `enablePolicyLocations === true`, run the address-count query; throw `BadRequestException` on zero |

**Behaviour rules:**

- The check runs only on transitions to `true`. Saving with `enablePolicyLocations` already true and unchanged still validates (defence in depth).
- If a company later loses all its policy-location addresses, the next save attempt that keeps the flag true will fail; the user must either add an address or turn the flag off.

---

### Requirement 6 — Block address-type change away from Policy Location when in use

**Why:**
Soft-deleting a `company_policy_configuration_location` row that is referenced by `companyEmployee.policyConfigLocationId` (or other consumers) leaves stale references. Block the change so users reassign before retyping.

**What:**

- During the company-update sync step (Requirement 2), before soft-deleting any `cpcl` row, check whether `companyEmployee` has any non-deleted rows referencing that `cpcl.id`. If yes, reject the entire save with `400 BadRequest`.
- The error names the address(es) being blocked and the count of affected employees, e.g.:
    `"Cannot remove 'Policy Location' from address \"<addr_1>, <city>\": 12 employees are currently assigned to it. Reassign those employees first."`

**Files to change:**

| File | Change |
|------|--------|
| `apps/services/org-service/src/app/company/comapny.service.ts` (new sync step) | Before issuing `deleteEntityTableMapIds` for `toRemove`, query `company_employee` for rows whose `policy_config_location_id` is in the to-be-deleted `cpcl.id` set with `deleted_at IS NULL`. If any, throw `BadRequestException` with the formatted message. |

**Query (rejection check):**
```sql
SELECT cpcl.id AS cpcl_id, a.addr_1, c.name AS city_name, COUNT(ce.id) AS in_use
FROM company_policy_configuration_location cpcl
JOIN address a ON a.id = cpcl.address_id
LEFT JOIN city c ON c.id = a.city_id
JOIN company_employee ce ON ce.policy_config_location_id = cpcl.id AND ce.deleted_at IS NULL
WHERE cpcl.id = ANY(:cpclIdsToRemove)
GROUP BY cpcl.id, a.addr_1, c.name
HAVING COUNT(ce.id) > 0;
```

> Column names (`policy_config_location_id`, the city relation) are verified against the actual `company_employee` entity during implementation; the conceptual query stays the same.

**Behaviour rules:**

- The check runs inside the same transaction as the sync, so a failed check aborts the whole company save.
- "In use" excludes soft-deleted employee rows.
- Other consumers of `cpcl.id` (if any are added later) should be added to this rejection check — note left in the helper's JSDoc.

---

### Requirement 7 — SO risk-location dropdown (verification only)

**What:**
Confirm that addresses of type `ADDRESS_TYPE_POLICY_LOCATION` appear automatically in the SO creation form's `riskLocations` multi-select.

**Why no code change:**
`riskLocationUtilityFunction` in `apps/ui/iwork/src/app/pages/OpportunitiesPage/OpportunitiesForm/formConfig.ts` already maps every `company.companyAddresses[*]` to an option with no `addressType` filter, and `companyDetailsById` returns all company addresses. New policy-location addresses flow through unchanged.

**Files to change:** none. Smoke-test only.

---

## Task Breakdown

| # | Task | Files Touched | Effort |
|---|------|---------------|--------|
| T1 | SQL seed for `ADDRESS_TYPE_POLICY_LOCATION` + backend constant | `database-migrations/sql/add-address-type-policy-location.sql`, `libs/service-lib/src/lib/constants.ts` | Small |
| T2 | Auto-sync `company_policy_configuration_location` from policy-location addresses; remove `policyLocations` DTO field and branch | `comapny.service.ts`, `update-company.dto.ts` | Medium |
| T3 | Block address-type change away from Policy Location when referenced by `companyEmployee` (Req 6) | `comapny.service.ts` | Small |
| T4 | Remove `policyLocations` step from configurator; delete `PolicyLocationsSection.tsx` and `PolicyLocationsTab/`; move `enablePolicyLocations` checkbox into an existing step; remove `FF_IWORK_POLICY_LOCATIONS` | `Constants/index.ts`, `PolicyConfigurator/index.tsx`, plus deletions | Medium |
| T5 | Guard `enablePolicyLocations` toggle (Req 5): UI disable + tooltip; backend reject save when no policy-location address exists | `PolicyConfigurator/index.tsx`, `policy.service.ts` | Small |
| T6 | Replace policy-location normalization with whitespace-stripping helper | `enrollment-upload.scheduler.ts` | Small |
| T7 | Smoke-test SO risk-location dropdown still shows policy-location addresses | none | Trivial |

---

## Execution Order

```
T1 → T2 → T3     (backend: lookup → sync → in-use rejection check)
T4 → T5          (frontend: configurator cleanup → toggle guard)
T6               (backend, scheduler — independent of the above)
T7               (verification — last)
```

---

## Key Constraints

- **`company_policy_configuration_location` schema unchanged.** Sync just writes/soft-deletes rows.
- **No data migration required by spec.** Existing rows in the mapping table that reference non-policy-location addresses will be soft-deleted on the next company save. (Optional one-shot SQL to flip those addresses' `addressTypeLid` to the new lookup id can be added if we want them retained without manual editing — call out before merge.)
- **No new DB column.** `enablePolicyLocations` continues to live inside the existing `policy_configuration` JSONB.
- **Toggle stays.** Validation gating on the policy configuration toggle is unchanged.
- **Backward compatibility.** Policies without `enablePolicyLocations` default to `false` during hydration (existing behaviour).
- **Minimal blast radius.** No changes to entities, no schema migrations, no contract changes outside the company update payload (`policyLocations` field removal).
