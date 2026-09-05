# Spec: Additional Columns in Details-Policy Based Sheet

**Sheet:** Details-Policy Based (biz done Excel report)
**Scope:** Backend query + mapping + constants; no frontend changes required.

---

## How the Sheet Is Populated

The Details-Policy Based sheet is built from **two sources of rows**, combined with `UNION ALL`:

- **Policy rows** — one row per `policy` record.
- **Endorsement rows** — one row per endorsement, linked to its parent policy via `endorsement.policy_id`. The endorsement source is itself a `UNION ALL` of `endorsement` and `policy_asset_endorsement`, built in `buildUnifiedEndorsementSource`.

Both are unioned in `getPolicyReport` → `case "policyDetails"` in `policy.repository.ts`. The final sheet is a mix of policy rows and endorsement rows, not one row per policy.

Fields that come from `policy` (e.g. `policy.net_premium`) appear on policy rows. Fields that come from `endorsement` (e.g. `endorsement.net_premium`) appear on endorsement rows. Fields sourced from `company` are common to both because both queries join back to `policy.company`.

---

## New Columns

| Field key | Excel header | Nullable |
| --- | --- | --- |
| `parentCompanyName` | Parent Company Name | yes |
| `leadCrm` | Lead Crm | yes |
| `accountManager` | Account Manager | yes |
| `policyOwnerReportingManager` | Policy Owner Reporting Manager | yes |
| `iworkUniqueId` | Iwork Unique Id | yes |

For `parentCompanyName`, `leadCrm`, `accountManager`, and `policyOwnerReportingManager` the source is the same on both policy rows and endorsement rows — both queries already join `policy.company` and `policy`.

For `iworkUniqueId`, each row reads from its own table's column: `policy.iwork_unique_id` on a policy row, `endorsement.iwork_unique_id` on an endorsement row. These are independent columns and may differ in value.

---

## Data Model / Join Path

### parentCompanyName

`group_company_map` maps a child company to a parent company via `company_id` → `group_company_id`. A company may have no row — join LEFT and return `null` if missing.

```sql
LEFT JOIN group_company_map gcm ON gcm.company_id = company.id
LEFT JOIN company parentCompany ON parentCompany.id = gcm.group_company_id
-- select
parentCompany.company_name AS parentCompanyName
```

Applies identically to both queries since both already join `policy.company` as `company`.

### leadCrm

`company.lead_crm` is a nullable FK to `user.user_id`. Join through `employee` to get the display name.

```sql
LEFT JOIN employee leadCrmEmployee ON leadCrmEmployee.user_id = company.lead_crm
-- select
CONCAT(leadCrmEmployee.first_name, ' ', leadCrmEmployee.last_name) AS leadCrm
```

### accountManager

`company.account_manager` is a nullable FK to `user.user_id`. Same pattern as `leadCrm`.

```sql
LEFT JOIN employee accountManagerEmployee ON accountManagerEmployee.user_id = company.account_manager
-- select
CONCAT(accountManagerEmployee.first_name, ' ', accountManagerEmployee.last_name) AS accountManager
```

### policyOwnerReportingManager

`policy.owner_id` references `user.user_id`. `employee` self-references via `reporting_manager_employee_id`.

```sql
LEFT JOIN employee policyOwnerEmployee ON policyOwnerEmployee.user_id = policy.owner_id
LEFT JOIN employee reportingManagerEmployee
    ON reportingManagerEmployee.id = policyOwnerEmployee.reporting_manager_employee_id
-- select
CONCAT(reportingManagerEmployee.first_name, ' ', reportingManagerEmployee.last_name) AS policyOwnerReportingManager
```

For the endorsement query `policy` is already joined, so the same chain applies.

### iworkUniqueId

`iwork_unique_id` is a nullable `VARCHAR(255)` on both the `policy` table and the `endorsement` table.

**Note:** The column exists in the `policy` DB schema but is not yet mapped in `policy.entity.ts`. Add the property there before implementation. On the endorsement side it is already mapped as `iworkUniqueId` in `endorsement.entity.ts` (line 653).

```sql
-- policy query
policy.iwork_unique_id AS iworkUniqueId

-- endorsement query
endorsement.iwork_unique_id AS iworkUniqueId
```

---

## Files to Change

### 1. `apps/services/service-lib/src/lib/constants.ts`

**Location:** `DEFAULT_POLICY_REPORT_FIELDS.POLICY_DETAILS_FIELDS` array (line ~1033).

Append five new field keys at the end of the array:

```typescript
"parentCompanyName",
"leadCrm",
"accountManager",
"policyOwnerReportingManager",
"iworkUniqueId",
```

### 2. `apps/services/service-lib/src/lib/entities/policy.entity.ts`

Add the missing column mapping for `iwork_unique_id`:

```typescript
@Column({ name: "iwork_unique_id", type: "varchar", length: 255, nullable: true })
iworkUniqueId?: string;
```

No migration needed — the column already exists in the DB.

### 3. `apps/services/policy-service/src/app/policy/policy.repository.ts`

**Location:** `case "policyDetails":` block (line ~13159).

#### 3a. Add LEFT JOINs to `policyQuery`

After the existing joins (`.leftJoin("policy.dealConfirmed", "dealConfirmed")`), add:

```typescript
.leftJoin("company.groupCompanyMaps", "gcm")
.leftJoin("gcm.groupCompany", "parentCompany")
.leftJoin(Employee, "leadCrmEmployee", "leadCrmEmployee.userId = company.leadCrm")
.leftJoin(Employee, "accountManagerEmployee", "accountManagerEmployee.userId = company.accountManager")
.leftJoin(Employee, "policyOwnerEmployee", "policyOwnerEmployee.userId = policy.ownerId")
.leftJoin(Employee, "reportingManagerEmployee", "reportingManagerEmployee.employeeId = policyOwnerEmployee.reportingManagerEmployeeId")
```

Add to `.select([...])`:

```typescript
"parentCompany.companyName AS parentCompanyName",
"CONCAT(leadCrmEmployee.firstName, ' ', leadCrmEmployee.lastName) AS leadCrm",
"CONCAT(accountManagerEmployee.firstName, ' ', accountManagerEmployee.lastName) AS accountManager",
"CONCAT(reportingManagerEmployee.firstName, ' ', reportingManagerEmployee.lastName) AS policyOwnerReportingManager",
"policy.iworkUniqueId AS iworkUniqueId",
```

#### 3b. Add the same LEFT JOINs to `endorsementQb`

The endorsement query builder already joins `policy.company` as `company` and `policy` as `policy`. Apply the same six LEFT JOINs and the same five SELECT additions as in 3a. For `iworkUniqueId`, use the endorsement alias:

```typescript
"endorsement.iworkUniqueId AS iworkUniqueId",
```

`iworkUniqueId` is already mapped on `Endorsement` entity at `endorsement.entity.ts` line 653.

#### 3c. Extend the data mapping object (line ~13269)

Add to the object returned in `data.map(...)`:

```typescript
parentCompanyName: item.parentcompanyname ?? null,
leadCrm: item.leadcrm?.trim() || null,
accountManager: item.accountmanager?.trim() || null,
policyOwnerReportingManager: item.policyownerreportingmanager?.trim() || null,
iworkUniqueId: item.iworkuniqueid ?? null,
```

---

## Excel Output

Headers are auto-generated by the `formatHeader` utility in `file-management.utils.ts` (splits camelCase on capital letters). No changes needed there.

| Field key | Auto header |
| --- | --- |
| `parentCompanyName` | Parent Company Name |
| `leadCrm` | Lead Crm |
| `accountManager` | Account Manager |
| `policyOwnerReportingManager` | Policy Owner Reporting Manager |
| `iworkUniqueId` | Iwork Unique Id |

These five columns appear at the end of the sheet, after `uniqueExternalReference`.

---

## Edge Cases

- A company with no row in `group_company_map`: `parentCompanyName` is `null`.
- A company whose `lead_crm` or `account_manager` is `null`: the name column is `null`.
- A policy with no `owner_id`, or whose owner has no employee record, or whose reporting manager does not exist: `policyOwnerReportingManager` is `null`.
- `CONCAT` with two null parts returns `' '` in some DB engines — the `.trim() || null` guard converts that to `null`.
- `iworkUniqueId` is independent per row: a policy row reads `policy.iwork_unique_id`; an endorsement row reads `endorsement.iwork_unique_id`. Either can be `null`.

---

## Out of Scope

- No API contract change — the Excel download endpoint streams the file directly.
- No frontend changes required.
- No new DB migrations required — all columns already exist in the schema.
- Adding `iworkUniqueId` to `policy.entity.ts` is a read-only property mapping; it does not alter the table.
