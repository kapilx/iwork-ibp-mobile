# Policy Location Filter — Full Stack Analysis

## 1. What "Policy Location" Actually Means

Each policy can have `enablePolicyLocations: true` in its `policy_configuration.policyConfiguration` JSONB.  
When enabled, the policy is linked to one or more `address` rows via `company_policy_configuration_location`.  
During employee enrollment upload, the employee's `policy_location` column (free text) is validated against `address.addr_1` (lowercased) for those linked addresses.  
The `policy_enrollment_employee.policy_location` column stores the **raw text value** the HR typed — it matches `address.addr_1`.

```
company_policy_configuration_location
  ├── company_id  →  company.id
  ├── address_id  →  address.id
  └── is_primary

address
  ├── id
  ├── addr_1      ← shown in dropdown (e.g. "Amazon", "Flipkart")
  ├── addr_2
  ├── branch_name
  └── ...

policy_configuration
  └── policyConfiguration (JSONB)
        {
          "enablePolicyLocations": true,
          "selectedLocationIds": [326865, 326866, 326867],   ← address.id values
          "userDetailsSection": { ... }
        }

policy_enrollment_employee
  └── policy_location  (varchar 255)  ← stores addr_1 text (e.g. "Amazon")
```

---

## 2. Data Flow: From Dropdown Selection → Filtered Data

```
User selects "Amazon" in Policy Location dropdown
        │
        ▼
address.id WHERE addr_1 = 'Amazon'  →  e.g. id = 326865
        │
        ├─► Filter POLICIES:
        │     policy_configuration WHERE policyConfiguration->'selectedLocationIds' @> '[326865]'
        │
        ├─► Filter ENROLLMENT:
        │     policy_enrollment_employee WHERE LOWER(TRIM(policy_location)) = 'amazon'
        │
        ├─► Filter ENDORSEMENTS:
        │     Same employee set from enrollment → endorsement_employee_metrics
        │
        ├─► Filter CD BALANCE:
        │     Policy IDs from above → cd_account_details / cd_kpi_summary
        │
        └─► Filter CLAIMS:
              Same employee/policy set → policy_claim_history
```

---

## 3. What Currently Works vs What Is Missing

| Feature | Status | Notes |
|---------|--------|-------|
| Location table + entity | ✅ | `company_policy_configuration_location` + `CompanyPolicyConfigurationLocation` |
| Address entity | ✅ | `address.addr_1` is the display label |
| Location fetch SQL report | ✅ | Admin Report 55: `external_hr_company_locations` — already fetches `id, addr_1` |
| Location used in enrollment upload validation | ✅ | Validated against `addr_1` (lowercased) |
| `policy_enrollment_employee.policy_location` stores addr_1 text | ✅ | Set during upload |
| `policy_configuration` stores `selectedLocationIds` (address IDs) | ✅ | JSONB field |
| External HR policy scoping in 9 reports | ✅ | Via `externalHrUserId` + `external_hr_policy_map` |
| External HR location mapping table | ✅ | `external_hr_location_map(user_id, address_id, company_id)` |
| **`REGION_OPTIONS` in dashboard** | ❌ | **Hardcoded** `["Flipkart","Amazon"]` — must be dynamic from API |
| **`selectedRegions` passed to report APIs** | ❌ | **State exists but never sent** to any `useHRReport` call |
| **`locationIds` param in admin_reports_parameters** | ❌ | **Not registered** for any dashboard report |
| **SQL location filtering in dashboard reports** | ❌ | **No WHERE clause** for location in any report |
| **`dashboard_policy_cards` location filter** | ❌ | Policy cards shown without location scoping |

---

## 4. Implementation Plan

### Step A — Frontend: Make Location Dropdown Dynamic

**File:** `apps/ui/ibp/src/app/pages/HRPortal/index.tsx`

Replace:
```ts
// REMOVE this
const REGION_OPTIONS = ["Flipkart", "Amazon"];
const [selectedRegions, setSelectedRegions] = useState<string[]>(["All Locations"]);
```

Add:
```ts
// New state — stores {id: number, addr_1: string}[]
const [locationOptions, setLocationOptions] = useState<{ id: number; addr_1: string }[]>([]);
const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]); // empty = All Locations

// Fetch from existing report (already in DB as Admin Report 55)
useEffect(() => {
  if (!companyId) return;
  void apiRequest(
    `${endPoints.generateHRReports}external_hr_company_locations?page=1&limit=0`,
    { method: 'POST', data: { companyId: String(companyId) } }
  ).then((res: any) => {
    const rows: { id: number; addr_1: string }[] = res?.data?.data ?? [];
    setLocationOptions(rows);
  }).catch(() => {});
}, [companyId]);
```

Dropdown renders `locationOptions.map(o => o.addr_1)` with "All Locations" as first option.  
Selection stores `o.id` values in `selectedLocationIds`.

---

### Step B — Frontend: Pass locationIds to All Report Calls

In every `useHRReport` / `apiRequest` call that fetches dashboard data, add:

```ts
const locationParam = selectedLocationIds.length === 0
  ? ''
  : selectedLocationIds.join(',');

// Example for dashboard_policy_cards:
const params = {
  companyId: String(companyId),
  locationIds: locationParam,   // ← NEW
  // ...other params
};
```

Reports that need `locationIds` wired in frontend:
- `dashboard_policy_cards`
- `dashboard_enrollment_status`
- `portfolio_kpi_summary`
- `portfolio_company_policies`
- `endorsement_overview`
- `endorsement_employee_metrics`
- `cd_kpi_summary`
- `cd_account_details`
- `cd_transactions`
- `policy_claim_history`

---

### Step C — Backend: SQL Location Filtering Pattern

The SQL filter checks `policy_enrollment_employee.policy_location` (for enrollment-based reports)
OR `policy_configuration.policyConfiguration->'selectedLocationIds'` (for policy-based reports).

**Pattern A — Employee-level reports** (enrollment, endorsements, claims):
```sql
AND (
  ###locationIds### = ''
  OR LOWER(TRIM(pee.policy_location)) IN (
    SELECT LOWER(TRIM(a.addr_1))
    FROM address a
    WHERE a.id = ANY(
      string_to_array(###locationIds###, ',')::INTEGER[]
    )
    AND a.deleted_at IS NULL
  )
)
```

**Pattern B — Policy-level reports** (policy_cards, CD balance):
```sql
AND (
  ###locationIds### = ''
  OR pc.policyConfiguration->'selectedLocationIds' ?| 
     ARRAY(SELECT jsonb_array_elements_text(to_jsonb(string_to_array(###locationIds###, ','))))
)
```

Or simpler using EXISTS:
```sql
AND (
  ###locationIds### = ''
  OR EXISTS (
    SELECT 1
    FROM jsonb_array_elements_text(pc.policyConfiguration->'selectedLocationIds') loc_id
    WHERE loc_id::INTEGER = ANY(string_to_array(###locationIds###, ',')::INTEGER[])
  )
)
```

---

### Step D — Backend: Register `locationIds` Parameter

In `admin_reports_parameters`, register `locationIds` for each report that needs it.

**See the accompanying SQL script:** `policy-location-filter-script.sql`

---

### Step E — External HR + Location Combined Scoping

For External HR users, combine BOTH policy scoping AND location scoping:

```sql
-- Policy scope (existing)
AND (
  ###externalHrUserId### IS NULL
  OR p.id IN (SELECT policy_id FROM external_hr_policy_map WHERE user_id = ###externalHrUserId###::INTEGER)
)
-- Location scope (new)
AND (
  ###locationIds### = ''
  OR elm.address_id = ANY(string_to_array(###locationIds###, ',')::INTEGER[])
)
```

Where `elm` comes from:
```sql
LEFT JOIN external_hr_location_map elm ON elm.user_id = ###externalHrUserId###::INTEGER
```

Or if the user is NOT external HR, just use the text-based location filter via `policy_enrollment_employee.policy_location`.

---

## 5. Per-Report Impact Map

### dashboard_policy_cards (id varies)
- **Filter by:** `policy_configuration.policyConfiguration->'selectedLocationIds'` contains selected address ID(s)
- **Join needed:** Already joins `policy_configuration pc ON pc.policy_id = p.id`
- **Pattern:** B (policy-level)

### dashboard_enrollment_status (id=25)
- **Filter by:** `policy_enrollment_employee.policy_location` matches `address.addr_1` of selected IDs
- **Pattern:** A (employee-level)

### portfolio_kpi_summary (id=47)
- **Filter by:** policy_location on enrolled employees
- **Pattern:** A

### endorsement_overview (id=40), endorsement_employee_metrics (id=41), endorsement_list (id=42)
- **Filter by:** endorsement employee's policy_location
- These reports join `policy_enrollment_employee` → add Pattern A filter

### cd_kpi_summary (id=44), cd_account_details (id=45), cd_transactions (id=46)
- **Filter by:** CD accounts are per-policy → filter policies by location config
- **Pattern:** B (policy-level)

### policy_claim_history (id=31)
- **Filter by:** claim's employee policy_location
- **Pattern:** A (employee-level)

---

## 6. portfolio_company_policies SQL (new report needed)

This report fetches policies per company for the Portfolio page.  
Location filter: show only policies whose `selectedLocationIds` contain the selected address IDs.

```sql
SELECT
  p.id AS "policyId",
  p.policy_number AS "policyNumber",
  p.policy_type_lid AS "policyTypeCode",
  -- ... other fields
  pc.policyConfiguration->>'selectedLocationIds' AS "locationIds"
FROM policy p
JOIN policy_configuration pc ON pc.policy_id = p.id
WHERE p.company_id = ###companyId###::INTEGER
  AND p.deleted_at IS NULL
  AND (
    ###locationIds### = ''
    OR EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(pc.policyConfiguration->'selectedLocationIds') loc_id
      WHERE loc_id::INTEGER = ANY(string_to_array(###locationIds###, ',')::INTEGER[])
    )
  )
```

---

## 7. Summary of Script Changes (see SQL file)

1. **Register `locationIds` parameter** in `admin_reports_parameters` for 9 reports
2. **Patch `dashboard_policy_cards`** — add policy-level location filter
3. **Patch `dashboard_enrollment_status`** — add employee-level location filter
4. **Patch `endorsement_*` reports** — add employee-level location filter
5. **Patch `cd_kpi_summary`, `cd_account_details`, `cd_transactions`** — add policy-level filter
6. **Patch `policy_claim_history`** — add employee-level location filter
7. **Patch `portfolio_kpi_summary`** — add employee-level location filter

All patches follow the same DO-block pattern as `external-hr-report-filters.sql`.
