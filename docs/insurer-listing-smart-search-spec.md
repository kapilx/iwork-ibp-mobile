# Insurer Listing — Smart Search & New Columns Spec

## Overview

Add smart search filters and new table columns to the insurer listing page (`InsurerPage`). Uses existing shared infrastructure (`SmartSearch` component, `mapSearchParams`, `scopeService`) with minimal new code.

---

## Filter Fields

| # | Label | Type | Backend path |
|---|-------|------|-------------|
| 1 | Organisation | dropdown | `insurer.countryId` via `organisation.countryId` (see Task 2) |
| 2 | Branch type | dropdown | `insurerAddresses.address.branchTypeLid` — lookup key: `INSURER_BRANCH_TYPE` |
| 3 | Insurance name | text | `insurer.insurerName` |
| 4 | Branch code | text | `insurerAddresses.address.branchCode` |
| 5 | City | dropdown | `insurerAddresses.address.cityId.id` |

---

## New Table Columns

City already exists. Add:

| Column | Source path in response |
|--------|------------------------|
| Branch type | `insurerAddresses[0].branchType.lookUpValue` |
| Branch code | `insurerAddresses[0].branchCode` |

---

## Organisation Filter — Design

The `insurer` table has `country_id` but no `organisation_id`. The `organisation` table also has `country_id`. The link is:

```
organisation.countryId === insurer.countryId
```

**Approach:** Accept `organisationId` as a query param in the listing endpoint. In the service layer, fetch `organisation.countryId` for that org, then inject `{ searchBy: "countryId", searchValue: countryId }` into the `searchArray` passed to `scopeService.validateMasterScope`. The frontend sends `organisationId` as it does on every other page — the backend resolves the indirection.

---

## Tasks

---

### Task 1 — Backend: add new columns to `Address` entity

**File:** `apps/services/service-lib/src/lib/entities/address.entity.ts`

> **Note:** `branch_type_lid`, `branch_code`, and `branch_name` columns were added to the `address` table via migration. Confirm these are already mapped in the entity from the other branch before doing this task. If not, add:

```typescript
@Column({ name: "branch_type_lid", type: "int", nullable: true })
branchTypeLid?: number;

@Column({ name: "branch_code", type: "varchar", length: 300, nullable: true })
branchCode?: string;

@Column({ name: "branch_name", type: "varchar", length: 300, nullable: true })
branchName?: string;

@OneToOne(() => LookUp)
@JoinColumn({ name: "branch_type_lid", referencedColumnName: "id" })
branchType?: Relation<LookUp>;
```

Do not add these to the positional constructor — they are nullable additions.

---

### Task 2 — Backend: resolve `organisationId` → `countryId` in insurer service

**File:** `apps/services/org-service/src/app/insurer/insurer.service.ts`

- Inject `Organisation` repository.
- Add optional `organisationId?: number` param to `getAllInsurers()`.
- When `organisationId` is provided, fetch `organisation.countryId` and push `{ searchBy: "countryId", searchValue: countryId }` into the parsed `searchArray` before passing it to the repository.

---

### Task 3 — Backend: expose `organisationId` query param in controller

**File:** `apps/services/org-service/src/app/insurer/insurer.controller.ts`

- In the `GET /` listing handler, add:
  ```typescript
  @Query('organisationId', new ParseIntPipe({ optional: true })) organisationId?: number
  ```
- Pass `organisationId` down to `insurerService.getAllInsurers()`.

---

### Task 4 — Backend: load `branchType` relation and update transform in repository

**File:** `apps/services/org-service/src/app/insurer/insurer.repository.ts`

1. Add `"insurerAddresses.address.branchType"` to the `relations` array in `fetchAllInsurersWithAddress` so the LookUp is eager-loaded.

2. In the `transformedData` map, extend the mapped address object to include:
    ```typescript
    branchType: address.address?.branchType
        ? { id: address.address.branchType.id, lookUpValue: address.address.branchType.lookUpValue }
        : null,
    branchCode: address.address?.branchCode ?? null,
    ```

---

### Task 5 — Backend: extend `InsurerSearchObject`

**File:** `apps/services/service-lib/src/lib/constants.ts`

Add to `InsurerSearchObject`:

```typescript
"insurerAddresses.address.branchCode",
"insurerAddresses.address.branchType.lookUpValue",
```

The branch type dropdown sends a numeric ID (`branchTypeLid`) which is handled by the exact-match path in `buildWhereCondition`. The two additions above cover the free-text `searchBy` path.

---

### Task 6 — Frontend: update `getTableSearchConfig` insurer case

**File:** `apps/ui/iwork/src/app/pages/InsurerPage/InsurerTable/tableConfig.ts`

Replace the current two-field insurer config with:

```typescript
case "insurer":
    return [
        {
            key: "organisationId",
            name: "organisationId",
            label: "Organisation",
            type: "select",
            gridColumn: 2.9,
            componentProps: { fullWidth: true },
            placeholder: "Select organisation",
            apiDependencies: {
                endPoint: endPoints.masterOrganisation,
                utilityFunction: (data: any[]) => organisationUtility(data),
            },
        },
        {
            key: "branchTypeLid",
            name: "branchTypeLid",
            label: "Branch type",
            type: "select",
            gridColumn: 2.9,
            placeholder: "Select branch type",
            apiDependencies: {
                endPoint: endPoints.lookUpByName("INSURER_BRANCH_TYPE"),
                isSmartSearch: true,
            },
            componentProps: { fullWidth: true },
        },
        {
            key: "insurerName",
            name: "insurerName",
            label: "Insurance name",
            type: "text",
            gridColumn: 2.9,
            componentProps: { fullWidth: true, placeholder: "Enter insurance name" },
        },
        {
            key: "branchCode",
            name: "branchCode",
            label: "Branch code",
            type: "text",
            gridColumn: 2.9,
            componentProps: { fullWidth: true, placeholder: "Enter branch code" },
        },
        {
            key: "cityId",
            name: "cityId",
            label: "City",
            type: "select",
            gridColumn: 2.9,
            placeholder: "Select city",
            apiDependencies: {
                endPoint: endPoints.cityList,
                isSmartSearch: true,
            },
            componentProps: { fullWidth: true },
        },
    ];
```

Also update `searchDefaultValues`:

```typescript
export const searchDefaultValues = {
    insurerName: "",
    organisationId: "",
    branchTypeLid: "",
    branchCode: "",
    cityId: "",
};
```

---

### Task 7 — Frontend: add Branch type and Branch code columns

**File:** `apps/ui/iwork/src/app/pages/InsurerPage/InsurerTable/tableConfig.ts`

In `getColumns` insurer case, add after the Phone column:

```typescript
{
    headerName: "Branch type",
    field: "branchType",
    valueGetter: (params) =>
        params.data.insurerAddresses?.[0]?.branchType?.lookUpValue ?? "--",
    flex: 1,
    headerTooltip: "Branch type",
    tooltipValueGetter: (params) =>
        params.data.insurerAddresses?.[0]?.branchType?.lookUpValue ?? "--",
},
{
    headerName: "Branch code",
    field: "branchCode",
    valueGetter: (params) =>
        params.data.insurerAddresses?.[0]?.branchCode ?? "--",
    flex: 1,
    headerTooltip: "Branch code",
    tooltipValueGetter: (params) =>
        params.data.insurerAddresses?.[0]?.branchCode ?? "--",
},
```

---

### Task 8 — Frontend: verify filter values flow to the API call

**File:** `apps/ui/iwork/src/app/pages/InsurerPage/InsurerTable/index.tsx`

Trace `selectedValues` → `setSmartSearch` → API call and confirm all five filter keys (`organisationId`, `branchTypeLid`, `branchCode`, `insurerName`, `cityId`) are serialised into the `search` query param string in `key:value` format. Fix any that are dropped.

---

## Files Changed

| Layer | File |
|-------|------|
| Backend entity | `apps/services/service-lib/src/lib/entities/address.entity.ts` |
| Backend constants | `apps/services/service-lib/src/lib/constants.ts` |
| Backend controller | `apps/services/org-service/src/app/insurer/insurer.controller.ts` |
| Backend service | `apps/services/org-service/src/app/insurer/insurer.service.ts` |
| Backend repository | `apps/services/org-service/src/app/insurer/insurer.repository.ts` |
| Frontend table config | `apps/ui/iwork/src/app/pages/InsurerPage/InsurerTable/tableConfig.ts` |
| Frontend table component | `apps/ui/iwork/src/app/pages/InsurerPage/InsurerTable/index.tsx` |
