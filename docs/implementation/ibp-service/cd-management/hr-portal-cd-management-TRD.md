# HR Portal – CD Management Page – Technical Requirement Document (TRD)

**Document Version:** 2.1
**Date:** 2026-04-30
**Author:** IIRM Engineering Team
**Jira Reference:** IIRM-9479
**PRD Reference:** `docs/hr-portal-cd-management-PRD.md`
**Framework Reference:** `docs/implementation/ibp-service/hr-module-report-framework-tech-spec.md`

> **Dependency Note (Framework Spec §9):** This TRD follows the mandatory module-level format defined in `hr-module-report-framework-tech-spec.md §9`. Any update to the framework spec must be reflected here immediately. Sections affected by framework changes are called out explicitly in Section 13.

**Changelog from v1.0:**
- Updated response envelope: `data` → `data.rows` / `data.count` (Framework §4.1)
- Updated `admin_reports` schema: uses `name` (not `report_name`), adds `query` TEXT field, removes `is_active` / `description` (Framework §3)
- Updated `admin_reports_parameters` schema: uses `report_id` FK, `query_parameter`, `parameter_value` (Framework §3)
- Updated `admin_reports_results_mappings` schema: uses `report_id` FK, `source_key`, `target_key`, `data_type` (Framework §3)
- Soft-delete only on `admin_reports`; parameters and mappings now deleted + re-inserted on upsert (Framework §3 invariants)
- Added `###limit###` and `###offset###` placeholders for paginated reports (Framework §9.4)
- Pagination defaults: 50 rows per page, max 500 (Framework §8)
- Export: no pagination applied on download path; SQL row cap required (Framework §8)
- Security: `JwtAuthGuard` + `RolesGuard` (`HR_ADMIN`) — 401 for unauth, 403 for wrong role (Framework §7)

---

## 1. Architecture Overview

The CD Management page is a single-scroll page with no tabs. All three sections (KPI cards, Account Details, Deposit Transactions) are backed by the HR Report Framework. No hardcoded report logic exists in the controller or service — all report definitions live in the database and are resolved at runtime.

```
POST /hr/report/generate/:report
```

Data is sourced from the `caution_deposit` family of tables, which are owned by the **policy-service** domain but reside in the shared PostgreSQL database. The ibp-service HR report framework queries them directly via raw SQL in `admin_reports.query`.

Data is always scoped to the session's `companyId` (integer from JWT). The Transactions section additionally accepts user-driven filters for policy, date range, type, and search.

### 1.1 Route & Entry Point

| Property | Value |
|---|---|
| Route | `/hr/cd-manage` |
| Auth | `JwtAuthGuard` (401 if no valid JWT) + `RolesGuard` `HR_ADMIN` (403 if wrong role) |
| `companyId` scope | Validated server-side — caller's session company must match request body `companyId` |
| Entry | Left sidebar → CD Manage |

### 1.2 Framework API Contracts (from tech spec §4)

| Operation | Method | Path | Success |
|---|---|---|---|
| Generate / fetch report | POST | `/hr-module/generate/:report` | 201 |
| Export report as CSV | POST | `/hr-module/download/:report` | 200 file |

**Generate — success response (201):**
```json
{
  "statusCode": 201,
  "message": "Report generated successfully.",
  "data": {
    "rows": [ /* array of row objects */ ],
    "count": 20
  }
}
```

> **Frontend binding rule (Framework §4.1):** Read `data.rows` for list/table reports. Read `data.rows[0]` for single-row aggregate reports (KPI cards). Never assume `data` is a bare array.

**Unknown report key:** Returns 400 (not 404) — the key fails at SQL metadata lookup time.

**Export — success response (200):** CSV binary with `Content-Type: text/csv` and `Content-Disposition: attachment; filename=<report-name>.csv`. No pagination applied — `limit: 0` is passed internally so all matching rows are returned. The endpoint is provided by the existing HR module framework (`hr.controller.ts` → `hr.service.ts`); no new backend implementation is needed for CD Management export.

### 1.3 Common Request Body Fields

| Placeholder | Type | Required | Description |
|---|---|---|---|
| `###companyId###` | integer | Yes | From JWT — scopes all queries to the HR user's company. **Integer, not UUID — no quotes in SQL.** |

---

## 2. Screen-to-Report-Key Mapping

| Screen Section | Report Key | Widget Type | Reads from |
|---|---|---|---|
| KPI Summary Cards (4) | `cd_kpi_summary` | KPI cards with sparklines | `data.rows[0]` |
| Account Details Table | `cd_account_details` | Table (one row per active CD account) | `data.rows` |
| Deposit Transactions Table | `cd_transactions` | Paginated table with expand-row | `data.rows`, `data.count` |

---

## 3. `admin_reports` Insert/Upsert Plan

The `admin_reports` table stores one row per report key. The `query` column holds the full SQL body with `###placeholder###` tokens. The `name` column is the URL path parameter handle and must be unique.

> **No soft-delete on source tables (v2.1 note):** `caution_deposit`, `caution_deposit_transaction`, and `caution_deposit_policy_mapping` have **no `deleted_at`** column. Do not add `deleted_at IS NULL` filters against these tables — it will cause a column-not-found error. The `policy` table also has **no `deleted_at`** column — do not add `p.deleted_at IS NULL` on policy joins.

> **Integer IDs:** `company_id` on `caution_deposit` is an **INT**, not UUID. The `###companyId###` placeholder is substituted directly as a bare integer — no surrounding quotes in the SQL.

> **Framework table column names (validated against entity definitions):**
> - `admin_reports_parameters`: FK is `admin_report_id` (not `report_id`). Required columns: `parameter_name`, `label`, `query_parameter`, `data_type`, `created_by`, `updated_by`, `input_field_type`, `option_type`, `option`, `order_no`. There is no `parameter_value` column.
> - `admin_reports_results_mappings`: FK is `admin_report_id` (not `report_id`). Result columns are `query_parameter_name` and `variable_name` (not `source_key` / `target_key`). Required columns also include `label` and `alignment`.

```sql
-- Reset sequences before inserting
DO $$
BEGIN
  PERFORM setval(
    pg_get_serial_sequence('admin_reports', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0),
    true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0),
    true
  );
END $$;

-- ──────────────────────────────────────────────
-- 1) cd_kpi_summary
-- ──────────────────────────────────────────────
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name, label, end_point, query, created_by, updated_by, order_no
  )
  VALUES (
    'cd_kpi_summary',
    'CD Management KPI Summary',
    'cd_kpi_summary',
    $q$
WITH account_totals AS (
  SELECT
    COUNT(DISTINCT cd.id)               AS active_accounts_count,
    COALESCE(SUM(cd.balance_amount), 0) AS total_deposit_balance
  FROM caution_deposit cd
  WHERE cd.company_id = ###companyId###
    AND cd.status = 'CD_ACCOUNT_ACTIVE'
),
utilisation AS (
  SELECT
    COALESCE(SUM(CASE WHEN cdt.transaction_type = 'DEBIT_TRANSACTION'
                      THEN cdt.transaction_amount ELSE 0 END), 0) AS total_utilised
  FROM caution_deposit_transaction cdt
  INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
  WHERE cd.company_id = ###companyId###
),
last_credit AS (
  SELECT
    cdt.transaction_date,
    cdt.transaction_amount,
    cdt.bank_name
  FROM caution_deposit_transaction cdt
  INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
  WHERE cd.company_id = ###companyId###
    AND cdt.transaction_type = 'CREDIT_TRANSACTION'
  ORDER BY cdt.transaction_date DESC
  LIMIT 1
),
balance_trend AS (
  SELECT json_agg(monthly_balance ORDER BY month_start) AS trend_data
  FROM (
    SELECT
      date_trunc('month', cdt.transaction_date)                          AS month_start,
      SUM(CASE WHEN cdt.transaction_type = 'CREDIT_TRANSACTION'
               THEN cdt.transaction_amount ELSE 0 END)
      - SUM(CASE WHEN cdt.transaction_type = 'DEBIT_TRANSACTION'
                 THEN cdt.transaction_amount ELSE 0 END)                 AS monthly_balance
    FROM caution_deposit_transaction cdt
    INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
    WHERE cd.company_id = ###companyId###
      AND cdt.transaction_date >= date_trunc('month', NOW() - INTERVAL '5 months')
    GROUP BY date_trunc('month', cdt.transaction_date)
    ORDER BY month_start
    LIMIT 6
  ) t
)
SELECT
  at.total_deposit_balance                                                AS "totalDepositBalance",
  at.active_accounts_count                                               AS "activeCdAccountsCount",
  ut.total_utilised                                                      AS "utilisedAmount",
  ROUND(ut.total_utilised * 100.0 / NULLIF(at.total_deposit_balance, 0), 1) AS "utilisedPercent",
  TO_CHAR(lc.transaction_date, 'DD/MM/YYYY')                            AS "lastDepositDate",
  lc.transaction_amount                                                  AS "lastDepositAmount",
  lc.bank_name                                                           AS "lastDepositBank",
  bt.trend_data                                                          AS "balanceTrendData"
FROM account_totals at
CROSS JOIN utilisation ut
LEFT JOIN last_credit lc ON true
LEFT JOIN balance_trend bt ON true
$q$,
    'SYSTEM', 'SYSTEM', 10
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0), true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0), true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id, parameter_name, label, query_parameter,
    data_type, created_by, updated_by, input_field_type, option_type, option, order_no
  )
  VALUES (
    report_id, 'companyId', 'Company ID', '###companyId###',
    'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 1
  );

  INSERT INTO admin_reports_results_mappings (
    admin_report_id, query_parameter_name, variable_name, label,
    data_type, created_by, updated_by, alignment
  )
  VALUES
    (report_id, 'totalDepositBalance',   'totalDepositBalance',   'Total Deposit Balance',    'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'activeCdAccountsCount', 'activeCdAccountsCount', 'Active CD Accounts Count', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'utilisedAmount',        'utilisedAmount',        'Utilised Amount',          'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'utilisedPercent',       'utilisedPercent',       'Utilised Percent',         'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'lastDepositDate',       'lastDepositDate',       'Last Deposit Date',        'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'lastDepositAmount',     'lastDepositAmount',     'Last Deposit Amount',      'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'lastDepositBank',       'lastDepositBank',       'Last Deposit Bank',        'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'balanceTrendData',      'balanceTrendData',      'Balance Trend Data',       'string', 'SYSTEM', 'SYSTEM', 'left');
END $$;

-- ──────────────────────────────────────────────
-- 2) cd_account_details
-- ──────────────────────────────────────────────
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name, label, end_point, query, created_by, updated_by, order_no
  )
  VALUES (
    'cd_account_details',
    'CD Account Details',
    'cd_account_details',
    $q$
SELECT
  cd.id                                                                  AS "cdAccountId",
  cd.cd_account_number                                                   AS "cdAccountNumber",
  cd.cd_account_name                                                     AS "cdAccountName",
  p.insurer_policy_number                                                AS "policyNumber",
  p.id                                                                   AS "policyId",
  COALESCE(cd.balance_amount, 0)                                         AS "depositBalance",
  COALESCE(SUM(CASE WHEN cdt.transaction_type = 'DEBIT_TRANSACTION'
                    THEN cdt.transaction_amount ELSE 0 END), 0)          AS "utilisedAmount",
  ROUND(
    COALESCE(SUM(CASE WHEN cdt.transaction_type = 'DEBIT_TRANSACTION'
                      THEN cdt.transaction_amount ELSE 0 END), 0)
    * 100.0 / NULLIF(cd.balance_amount, 0), 1
  )                                                                      AS "utilisationPercent",
  TO_CHAR(cd.updated_at, 'DD/MM/YYYY')                                  AS "lastUpdated"
FROM caution_deposit cd
INNER JOIN caution_deposit_policy_mapping cdpm ON cdpm.caution_deposit_id = cd.id
INNER JOIN policy p ON p.id = cdpm.policy_id
LEFT JOIN caution_deposit_transaction cdt ON cdt.caution_deposit_id = cd.id
WHERE cd.company_id = ###companyId###
  AND cd.status = 'CD_ACCOUNT_ACTIVE'
  AND (
    ###search### = ''
    OR cd.cd_account_name      ILIKE '%' || ###search### || '%'
    OR p.insurer_policy_number ILIKE '%' || ###search### || '%'
  )
GROUP BY cd.id, cd.cd_account_number, cd.cd_account_name, cd.balance_amount,
         cd.updated_at, p.insurer_policy_number, p.id
ORDER BY "utilisationPercent" DESC NULLS LAST
$q$,
    'SYSTEM', 'SYSTEM', 11
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0), true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0), true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id, parameter_name, label, query_parameter,
    data_type, created_by, updated_by, input_field_type, option_type, option, order_no
  )
  VALUES
    (report_id, 'companyId', 'Company ID', '###companyId###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 1),
    (report_id, 'search',    'Search',     '###search###',    'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 2);

  INSERT INTO admin_reports_results_mappings (
    admin_report_id, query_parameter_name, variable_name, label,
    data_type, created_by, updated_by, alignment
  )
  VALUES
    (report_id, 'cdAccountId',        'cdAccountId',        'CD Account ID',       'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'cdAccountNumber',    'cdAccountNumber',    'CD Account Number',   'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'cdAccountName',      'cdAccountName',      'CD Account Name',     'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'policyNumber',       'policyNumber',       'Policy Number',       'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'policyId',           'policyId',           'Policy ID',           'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'depositBalance',     'depositBalance',     'Deposit Balance',     'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'utilisedAmount',     'utilisedAmount',     'Utilised Amount',     'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'utilisationPercent', 'utilisationPercent', 'Utilisation Percent', 'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'lastUpdated',        'lastUpdated',        'Last Updated',        'string', 'SYSTEM', 'SYSTEM', 'left');
END $$;

-- ──────────────────────────────────────────────
-- 3) cd_transactions
-- ──────────────────────────────────────────────
DO $$
DECLARE
  report_id INT;
BEGIN
  INSERT INTO admin_reports (
    name, label, end_point, query, created_by, updated_by, order_no
  )
  VALUES (
    'cd_transactions',
    'CD Deposit Transactions',
    'cd_transactions',
    $q$
SELECT
  cdt.id                                                                 AS "txnId",
  TO_CHAR(cdt.transaction_date, 'DD/MM/YYYY')                           AS "txnDate",
  CASE
    WHEN cdt.transaction_type = 'CREDIT_TRANSACTION' THEN 'Deposit'
    ELSE 'Deduction'
  END                                                                    AS "txnType",
  CASE
    WHEN cdt.transaction_type = 'CREDIT_TRANSACTION' THEN  cdt.transaction_amount
    ELSE                                                   -cdt.transaction_amount
  END                                                                    AS "amount",
  p.insurer_policy_number                                                AS "policyNumber",
  cdt.bank_name                                                          AS "bankName",
  COALESCE(NULLIF(TRIM(cdt.cheque_number), ''), cdt.transaction_reference_id) AS "referenceId",
  cdt.cd_balance_amount                                                  AS "runningBalance",
  e.insurer_endorsement_number                                           AS "endorsementNumber",
  e.endorsement_type                                                     AS "endorsementType",
  TO_CHAR(cdt.cheque_date, 'DD/MM/YYYY')                                AS "transactionValueDate",
  TRIM(u.first_name || ' ' || COALESCE(u.last_name, ''))               AS "createdBy",
  cdt.remarks                                                            AS "remarks",
  cdt.ifsc_code                                                          AS "ifscCode"
FROM caution_deposit_transaction cdt
INNER JOIN caution_deposit cd ON cd.id = cdt.caution_deposit_id
LEFT JOIN policy p            ON p.id  = cdt.policy_id
LEFT JOIN endorsement e       ON e.id  = cdt.endorsement_id
LEFT JOIN users u             ON u.id  = cdt.created_by
WHERE cd.company_id = ###companyId###
  AND (###policyId###  = '' OR cdt.policy_id::text = ###policyId###)
  AND (###txnType###   = '' OR cdt.transaction_type = ###txnType###)
  AND (###startDate### = '' OR cdt.transaction_date >= ###startDate###::date)
  AND (###endDate###   = '' OR cdt.transaction_date <= ###endDate###::date)
  AND (
    ###search### = ''
    OR COALESCE(NULLIF(TRIM(cdt.cheque_number), ''), cdt.transaction_reference_id) ILIKE '%' || ###search### || '%'
    OR cdt.remarks ILIKE '%' || ###search### || '%'
  )
ORDER BY cdt.transaction_date DESC
$q$,
    'SYSTEM', 'SYSTEM', 12
  )
  RETURNING id INTO report_id;

  PERFORM setval(
    pg_get_serial_sequence('admin_reports_parameters', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_parameters), 0), true
  );
  PERFORM setval(
    pg_get_serial_sequence('admin_reports_results_mappings', 'id'),
    COALESCE((SELECT MAX(id) FROM admin_reports_results_mappings), 0), true
  );

  INSERT INTO admin_reports_parameters (
    admin_report_id, parameter_name, label, query_parameter,
    data_type, created_by, updated_by, input_field_type, option_type, option, order_no
  )
  VALUES
    (report_id, 'companyId', 'Company ID', '###companyId###', 'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 1),
    (report_id, 'policyId',  'Policy ID',  '###policyId###',  'number', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 2),
    (report_id, 'startDate', 'Start Date', '###startDate###', 'date',   'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 3),
    (report_id, 'endDate',   'End Date',   '###endDate###',   'date',   'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 4),
    (report_id, 'txnType',   'Txn Type',   '###txnType###',   'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 5),
    (report_id, 'search',    'Search',     '###search###',    'string', 'SYSTEM', 'SYSTEM', 'input', 'none', '{}'::jsonb, 6);

  INSERT INTO admin_reports_results_mappings (
    admin_report_id, query_parameter_name, variable_name, label,
    data_type, created_by, updated_by, alignment
  )
  VALUES
    (report_id, 'txnId',                'txnId',                'Transaction ID',         'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'txnDate',              'txnDate',              'Transaction Date',        'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'txnType',              'txnType',              'Transaction Type',        'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'amount',               'amount',               'Amount',                  'number', 'SYSTEM', 'SYSTEM', 'right'),
    (report_id, 'policyNumber',         'policyNumber',         'Policy Number',           'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'bankName',             'bankName',             'Bank Name',               'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'referenceId',          'referenceId',          'Reference ID',            'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'runningBalance',       'runningBalance',       'Running Balance',         'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'endorsementNumber',    'endorsementNumber',    'Endorsement Number',      'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'endorsementType',      'endorsementType',      'Endorsement Type',        'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'transactionValueDate', 'transactionValueDate', 'Transaction Value Date',  'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'createdBy',            'createdBy',            'Created By',              'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'remarks',              'remarks',              'Remarks',                 'string', 'SYSTEM', 'SYSTEM', 'left'),
    (report_id, 'ifscCode',             'ifscCode',             'IFSC Code',               'string', 'SYSTEM', 'SYSTEM', 'left');
END $$;
```

---

## 4. Placeholder Summary

Every `###placeholder###` token in each SQL body must have a matching row in `admin_reports_parameters`. A mismatch is a **release blocker** (Framework §9.4).

| Report Key | Placeholder | Default `parameter_value` | Notes |
|---|---|---|---|
| `cd_kpi_summary` | `###companyId###` | `''` | Required — integer, substituted without quotes |
| `cd_account_details` | `###companyId###` | `''` | Required |
| | `###search###` | `''` | Empty = no filter |
| `cd_transactions` | `###companyId###` | `''` | Required |
| | `###policyId###` | `''` | Empty = all policies. Integer — compared via `::text` cast |
| | `###startDate###` | `''` | Empty = no lower bound |
| | `###endDate###` | `''` | Empty = no upper bound |
| | `###txnType###` | `''` | Empty = all types. Values: `CREDIT_TRANSACTION` / `DEBIT_TRANSACTION` |
| | `###search###` | `''` | Empty = no search |
| | `###limit###` | `'50'` | Framework default |
| | `###offset###` | `'0'` | Framework default |

> **v2.1 removal:** `###txnStatus###` removed — `caution_deposit_transaction` has no status column.

---

## 5. Source Table Mapping & Join Notes

| Table | Alias | Purpose |
|---|---|---|
| `caution_deposit` | `cd` | CD account master — holds balance, status, account name/number, company scope |
| `caution_deposit_transaction` | `cdt` | Individual credit/debit ledger entries |
| `caution_deposit_policy_mapping` | `cdpm` | Links a caution deposit account to one or more policies |
| `policy` | `p` | Policy master — insurer policy number, policy type |
| `endorsement` | `e` | Endorsement that triggered a deduction transaction (optional FK) |
| `users` | `u` | IIRM ops user who recorded the transaction (`cdt.created_by`) |

**Foreign key notes:**
- `caution_deposit.company_id → company.id` (integer FK)
- `caution_deposit_transaction.caution_deposit_id → caution_deposit.id`
- `caution_deposit_transaction.policy_id → policy.id` (nullable — direct policy reference on transaction)
- `caution_deposit_transaction.endorsement_id → endorsement.id` (nullable — only for DEBIT_TRANSACTION)
- `caution_deposit_transaction.created_by → users.id`
- `caution_deposit_policy_mapping.caution_deposit_id → caution_deposit.id`
- `caution_deposit_policy_mapping.policy_id → policy.id`

**No soft-delete on CD tables:**

| Table | `deleted_at` present? | Notes |
|---|---|---|
| `caution_deposit` | **No** | Filter by `status = 'CD_ACCOUNT_ACTIVE'` instead |
| `caution_deposit_transaction` | **No** | No filter needed — all rows are active |
| `caution_deposit_policy_mapping` | **No** | No filter needed |
| `policy` | **No** | `policy` entity has no `deleted_at` column. Do **not** add `p.deleted_at IS NULL` on policy joins — it will cause a column-not-found error |

**LookUp keys used in SQL (do not use the display values):**

| Field | LookUp key for "Credit/Deposit" | LookUp key for "Debit/Deduction" | LookUp name |
|---|---|---|---|
| `caution_deposit_transaction.transaction_type` | `CREDIT_TRANSACTION` | `DEBIT_TRANSACTION` | — |
| `caution_deposit.status` | `CD_ACCOUNT_ACTIVE` | `CD_ACCOUNT_INACTIVE` | `CD_ACCOUNT_STATUS` |

---

## 6. Report Specifications — Behaviour Notes

Full SQL bodies are embedded in the `admin_reports.query` column via the seed script in Section 3. This section records the behavioural contracts that are not expressible in SQL alone.

### 6.1 `cd_kpi_summary`

**Pagination:** None. Returns a single row. Frontend reads `data.data[0]`.

**Export:** Not applicable — KPI cards are not exported.

**Sparkline data:** `balanceTrendData` is a PostgreSQL `json_agg` of 6 monthly net values (credits − debits per month, last 6 months). Ordered chronologically oldest → newest. Frontend passes directly to the sparkline renderer.

**Active account filter:** Uses `cd.status = 'CD_ACCOUNT_ACTIVE'` (LookUp key constant). Only active accounts contribute to `totalDepositBalance` and `activeCdAccountsCount`.

**Utilisation:** Total of all `DEBIT_TRANSACTION` amounts across ALL transactions for the company (regardless of account status). This gives cumulative historical deduction, matching the KPI intent.

**`utilisedPercent`:** `ROUND(utilisedAmount × 100 / totalDepositBalance, 1)`. `NULLIF` guards divide-by-zero when `totalDepositBalance = 0`.

**`lastDepositDate` / `lastDepositBank`:** Sourced from the most recent `CREDIT_TRANSACTION` across all company CD accounts. `LEFT JOIN last_credit ON true` spreads the single-row CTE result. If no credit transaction exists, both fields are null.

---

### 6.2 `cd_account_details`

**Pagination:** None. Pass `?limit=0` in the URL query string so the framework does not cap the result. Frontend reads `data.data`.

**Total row:** Not returned by the API. Frontend computes it client-side by summing `depositBalance` and `utilisedAmount` across all `data.rows`.

**GROUP BY requirement:** The query aggregates `DEBIT_TRANSACTION` amounts per CD account using `SUM` and `GROUP BY`. The `GROUP BY` clause includes all non-aggregated SELECT columns: `cd.id`, `cd.cd_account_number`, `cd.cd_account_name`, `cd.balance_amount`, `cd.updated_at`, `p.insurer_policy_number`, `p.id`.

**Utilisation progress bar colour (frontend):**
- `utilisationPercent ≤ 50` → green (`#22C55E`)
- `utilisationPercent 51–80` → amber (`#F59E0B`)
- `utilisationPercent > 80` → red (`#EF4444`)
- `utilisationPercent = null` (when `balance_amount = 0`) → show 0%; no divide-by-zero

**"View Transactions" link:** Sets the Transactions section `policyId` filter to the `policyId` from the row and scrolls. No additional API call — pre-applies the existing filter.

**Search:** Matches `cd_account_name` ILIKE or `p.insurer_policy_number` ILIKE. Empty string = no filter.

---

### 6.3 `cd_transactions`

**Pagination:** Handled via URL query params `?page=N&limit=N` passed to the framework's built-in pagination (DTO defaults: `page=1`, `limit=10`). The SQL template does **not** include `LIMIT`/`OFFSET` — the framework appends them after parameter substitution, which also ensures the `COUNT(*)` query wraps the un-paged base query. Frontend reads `data.data` (rows) and `data.count` (total).

**Export:** Download path passes `?limit=0` to skip framework pagination — full result returned. No SQL row cap imposed; review if a company has > 10,000 transactions in a period.

**`txnType` filter values (placeholder `###txnType###`):**
- Empty string `''` → all types
- `CREDIT_TRANSACTION` → deposits only
- `DEBIT_TRANSACTION` → deductions only

Frontend dropdown displays "Deposit" / "Deduction" but sends the LookUp key (`CREDIT_TRANSACTION` / `DEBIT_TRANSACTION`) as the filter value.

**Amount sign (frontend):**
- Positive (Credit) → prefix `+₹`, text colour green
- Negative (Debit) → prefix `−₹`, text colour red

**`runningBalance`:** Stored as `varchar` on `caution_deposit_transaction.cd_balance_amount`. Display as-is; do not cast to number as it may contain formatted strings.

**Expand-row rendering (no additional API call):** All expand-row fields (`endorsementNumber`, `endorsementType`, `referenceId`, `ifscCode`, `transactionValueDate`, `createdBy`, `remarks`) are returned in every row response. Toggle display on chevron click:
- `txnType = 'Deduction'` → show: Endorsement Ref, Endorsement Type, Reference ID, IFSC, Created By, Remarks
- `txnType = 'Deposit'` → show: Reference ID, Bank, Value Date, IFSC, Created By, Remarks
- Any field null or empty string → display `--` (never blank, never the string "null"; see §6.4)

**No transaction status:** `caution_deposit_transaction` has no status column. All rows retrieved are posted/final transactions.

**`policyId` — navigation context (not a filter):** The Transactions view is always opened from a specific CD account row. `policyId` is fixed to that account's integer ID for the lifetime of the view. It is **never empty** and **never cleared by Reset**. The frontend uses `viewPolicyId` state (set by "View Transactions" click) and always sends `String(viewPolicyId)`. There is no "All Policies" dropdown on the Transactions screen. Cast to text for comparison: `cdt.policy_id::text = ###policyId###`.

---

### 6.4 Display Rules (applies to all three reports)

These rules govern how the frontend renders values returned by any CD Management report endpoint. They are non-negotiable — a blank cell or the string "null" is a defect.

**Null / empty string fallback**

Any field value that is `null`, `undefined`, or an empty / whitespace-only string must render as `--` (two ASCII hyphens). This applies to every text cell in every table and every expand-row field. The `dash()` helper in `HRPortalFinance/index.tsx` encodes this rule:

```ts
const dash = (value: string | null | undefined) =>
  value && value.trim() ? value : "--";
```

Apply `dash()` to all nullable string fields before rendering. Do **not** render raw API values directly.

**Date format**

All dates returned by CD Management SQL queries use `TO_CHAR(column, 'DD/MM/YYYY')`. The frontend renders them as-is (already formatted). Do **not** re-format dates in JavaScript. If a date column is `null`, `TO_CHAR` returns `null` and `dash()` renders `--`.

**Numeric fields**

Monetary amounts use the `fmt()` helper (lakhs shorthand ≥ 1 L, Indian locale below). Utilisation percent renders with `%` suffix; if `utilisationPercent` is `null` (balance is zero), render `0%`.

**Loading state**

While any section is loading, KPI card values render `--`. Once data arrives, values update in-place.

---

## 7. Security

All three endpoints inherit the security controls defined in Framework §7:

| Control | Behaviour |
|---|---|
| `JwtAuthGuard` | Applied at controller class level. Requests without a valid JWT receive **401** before any method executes. |
| `RolesGuard` | Checks `roles` claim in JWT. Users without `HR_ADMIN` role receive **403**. |
| `companyId` scope | Service layer validates that the `companyId` in the request body matches the company in the authenticated user's session. Mismatch → **400**. |
| SQL injection | All `###placeholder###` values are DTO-validated before substitution. No raw string interpolation from unvalidated input reaches the DB driver. |
| PII | `users.first_name` / `users.last_name` are plain text. No encrypted columns (email, phone, DOB) are referenced in any CD Management report SQL. |

---

## 8. Frontend-to-Backend Call Sequence (Framework §9.6)

### 8.1 Initial Screen Load

```
1. User navigates to /hr/cd-manage (JWT validated by guard)
2. [PARALLEL] Fire all three report fetches:
   a. POST /hr/report/generate/cd_kpi_summary
      Body: { companyId }
      Read: data.rows[0]

   b. POST /hr/report/generate/cd_account_details
      Body: { companyId, search: '' }
      Read: data.rows

   c. POST /hr/report/generate/cd_transactions?page=1&limit=50
      Body: { companyId, policyId: '', startDate: '<6 months ago>',
              endDate: '<today>', txnType: '', search: '' }
      Read: data.rows, data.count
3. Render all three sections as each resolves (progressive)
```

### 8.2 Account Details — Search (Filter Apply)

```
User types in "Search account, policy..." (debounce 300ms):
POST /hr/report/generate/cd_account_details
Body: { companyId, search: '<typed value>' }
Read: data.rows
Re-render Account Details table only.
```

### 8.3 Account Details — Reset

```
User clears the search field:
POST /hr/report/generate/cd_account_details
Body: { companyId, search: '' }
Read: data.rows
```

### 8.4 "View Transactions" Link Click

```
User clicks "View Transactions" on an account row:
1. Set viewPolicyId = row.policyId (integer — navigation context, not a filter)
2. Navigate to Transactions view (header shows account name)
3. POST /hr/report/generate/cd_transactions?page=1&limit=8
   Body: { companyId, policyId: String(viewPolicyId),
           startDate: '<6 months ago>', endDate: '<today>',
           txnType: '', search: '' }
4. Read: data.data, data.count
5. Render Transactions table — policyId is fixed for this view
```

### 8.5 Transactions — Filter Apply

```
User changes Date Range / All Types (debounce 300ms):
POST /hr/report/generate/cd_transactions?page=1&limit=8
Body: { companyId, policyId: String(viewPolicyId), startDate, endDate, txnType, search }
Read: data.data, data.count
Reset pagination to page 1.
Note: policyId is always the viewPolicyId — it is not changed by filter controls.
```

### 8.6 Transactions — Search

```
User types in "Search reference, remarks..." (debounce 300ms):
POST /hr/report/generate/cd_transactions?page=1&limit=8
Body: { companyId, policyId: String(viewPolicyId), startDate, endDate, txnType, search: '<typed>' }
Read: data.data, data.count
Reset pagination to page 1.
```

### 8.7 Transactions — Reset

```
User clicks Reset:
1. Retain: policyId = String(viewPolicyId)  ← never cleared
   Reset:  startDate → '<6 months ago>', endDate → '<today>',
           txnType → '', search → ''
2. POST /hr/report/generate/cd_transactions?page=1&limit=8
   Body: { companyId, policyId: String(viewPolicyId), startDate: '<6 months ago>',
           endDate: '<today>', txnType: '', search: '' }
3. Read: data.data, data.count
```

### 8.8 Transactions — Pagination

```
User clicks page N:
POST /hr/report/generate/cd_transactions?page=N&limit=8
Body: { companyId, ...all active filter values }
offset computed by service: (N - 1) × 8
Read: data.data, data.count
```

### 8.9 Row Expand / Collapse (inline — no API call)

```
User clicks "›" on a transaction row:
- All detail fields already present in data.rows entry
- Toggle expanded UI state for that row
- Rotate chevron to "˅" (expanded) or "›" (collapsed)
- No API call made
```

### 8.10 Export — Account Details

> Uses the existing `POST /hr-module/download/:report` framework endpoint. No new backend code is required — wire the Export button in the frontend.

```
User clicks Export:
POST /hr-module/download/cd_account_details
Body: { companyId, search: '<current search value>' }
Response: CSV file (Content-Type: text/csv, Content-Disposition: attachment; filename=cd_account_details.csv)
No pagination applied — full result set returned.
Frontend: apiRequest(endPoints.downloadHRReports + 'cd_account_details',
           { method: 'POST', data: { companyId, search }, responseType: 'blob' })
```

### 8.11 Export — Deposit Transactions

> Uses the existing `POST /hr-module/download/:report` framework endpoint. No new backend code is required — wire the Export button in the frontend.

```
User clicks Export:
POST /hr-module/download/cd_transactions
Body: { companyId, policyId: String(viewPolicyId), startDate, endDate, txnType, search }
Response: CSV file (Content-Type: text/csv, Content-Disposition: attachment; filename=cd_transactions.csv)
No pagination applied — full result set returned. policyId always set (viewPolicyId).
Frontend: apiRequest(endPoints.downloadHRReports + 'cd_transactions',
           { method: 'POST', data: { companyId, policyId, startDate, endDate, txnType, search }, responseType: 'blob' })
```

---

## 9. Filter / Search / Reset Behaviour Contract

| Filter | Report | Sent as | Empty = |
|---|---|---|---|
| companyId | All 3 | `###companyId###` | Never empty (from JWT) |
| search (account) | `cd_account_details` | `###search###` | No filter |
| policyId | `cd_transactions` | `###policyId###` | Navigation context — always sent as `String(viewPolicyId)`; never empty |
| startDate | `cd_transactions` | `###startDate###` | No lower bound |
| endDate | `cd_transactions` | `###endDate###` | No upper bound |
| txnType | `cd_transactions` | `###txnType###` | All types (`CREDIT_TRANSACTION` or `DEBIT_TRANSACTION` when set) |
| search (transactions) | `cd_transactions` | `###search###` | No filter |

**Date range presets:**

| Label | startDate value | endDate value |
|---|---|---|
| Last 1 Month | `NOW() - INTERVAL '1 month'` | `NOW()` |
| Last 3 Months | `NOW() - INTERVAL '3 months'` | `NOW()` |
| Last 6 Months (default) | `NOW() - INTERVAL '6 months'` | `NOW()` |
| Last 12 Months | `NOW() - INTERVAL '12 months'` | `NOW()` |
| Custom | user-selected start | user-selected end |

---

## 10. Export Contract

> Both export endpoints are served by the existing HR module framework (`POST /hr-module/download/:report`). Output format is **CSV only**. No new backend endpoint, service method, or SQL change is required for CD Management export — the work is purely frontend wiring.

| Report Key | Endpoint | Format | Row cap |
|---|---|---|---|
| `cd_account_details` | `POST /hr-module/download/cd_account_details` | CSV | None needed (bounded by active CD accounts) |
| `cd_transactions` | `POST /hr-module/download/cd_transactions` | CSV | None enforced; review if > 10,000 rows |

**endPoints.ts key:** `downloadHRReports = environment.ibpUrl + '/hr-module/download/'`

**Export column rules:**
- `amount` — signed number: positive = deposit, negative = deduction
- `txnType` — display label: "Deposit" / "Deduction"
- `runningBalance` — output as-is (varchar); may be a formatted string
- `createdBy` — plain text; `null` → "—"
- `endorsementNumber` — `null` → "—"
- `Content-Disposition: attachment; filename="cd-transactions-<companyId>-<date>.<ext>"`
- Status 400 on failure → frontend shows error toast, no file generated

---

## 11. QA Checklist

### Data Consistency

- [ ] `totalDepositBalance` = SUM of `balance_amount` across all active CD accounts for the company
- [ ] `utilisedAmount` KPI = SUM of all DEBIT_TRANSACTION amounts across all company CD accounts
- [ ] `utilisedPercent` = utilisedAmount / totalDepositBalance × 100 ± 0.1%
- [ ] Account Details `utilisedAmount` per row = SUM of DEBIT_TRANSACTION for that specific CD account
- [ ] Account Details `utilisationPercent` per row = row utilisedAmount / depositBalance × 100 ± 0.1%
- [ ] `data.count` on Transactions = total filtered rows (not just current page)
- [ ] Credit rows have positive `amount`; Debit rows have negative `amount`
- [ ] `balanceTrendData` has ≤ 6 entries (monthly, oldest → newest)

### Response Shape

- [ ] `cd_kpi_summary` response: `data.data` is a 1-element array; component reads `data.data[0]`
- [ ] `cd_account_details` response: `data.data` is an array; `data.count` = row count
- [ ] `cd_transactions` response: `data.data` is page slice; `data.count` = total matching rows

### Filter Behaviour

- [ ] policyId always equals viewPolicyId (integer from "View Transactions" click); never empty, never cleared by Reset
- [ ] Date Range "Last 6 Months" → no transaction older than 6 months in results
- [ ] Type = `CREDIT_TRANSACTION` → only deposit rows; Type = `DEBIT_TRANSACTION` → only deduction rows
- [ ] Search by reference ID → matching rows only
- [ ] Search by remarks text → matching rows only
- [ ] Reset → date/type/search reverted to defaults, page = 1; policyId unchanged (viewPolicyId retained)

### Expand Row

- [ ] Clicking "›" expands; chevron becomes "˅"
- [ ] Clicking again collapses
- [ ] No API call made on expand/collapse
- [ ] Deduction row expanded: shows Endorsement Ref, Endorsement Type, Reference ID, IFSC, Created By, Remarks
- [ ] Deposit row expanded: shows Reference ID, Bank, Value Date, IFSC, Created By, Remarks
- [ ] Any null field shows "—" (not blank, not "null")

### Navigation

- [ ] "View Transactions" sets viewPolicyId to clicked account's policyId; Transactions view loads scoped to that account

### Export

- [ ] Account Details export with search active → only filtered rows in file
- [ ] Transactions export respects all active filters
- [ ] Signed amounts correct in export (+ deposit, − deduction)
- [ ] Null `endorsementNumber` → "—" in exported file (not empty cell)
- [ ] Export of 0 rows → "No data to export" toast; no file generated

### Edge Cases

- [ ] `balance_amount = 0` → `utilisationPercent = 0`; no divide-by-zero
- [ ] All transactions filtered out → "No transactions found" empty state
- [ ] `cd_balance_amount` (varchar) is null or empty → display "—"
- [ ] Unknown report key in URL → 400 returned (not 404)
- [ ] Request without JWT → 401 before method executes
- [ ] Request with valid JWT but non-HR_ADMIN role → 403

---

## 12. Implementation File Locations

| Artefact | Path |
|---|---|
| Report controller | `apps/services/ibp-service/src/app/hr/report.controller.ts` |
| Report service | `apps/services/ibp-service/src/app/hr/hr-report.service.ts` |
| `AdminReport` entity | `apps/services/ibp-service/src/app/hr/entities/admin-report.entity.ts` |
| `AdminReportParameter` entity | `apps/services/ibp-service/src/app/hr/entities/admin-report-parameter.entity.ts` |
| `AdminReportResultsMapping` entity | `apps/services/ibp-service/src/app/hr/entities/admin-report-results-mapping.entity.ts` |
| SQL seed script | `apps/services/ibp-service/src/app/hr-module/hr-module-cd-scripts.sql` |
| `CautionDeposit` entity | `apps/services/service-lib/src/lib/entities/caution-deposit.entity.ts` |
| `CautionDepositTransaction` entity | `apps/services/service-lib/src/lib/entities/caution-deposit-transaction.entity.ts` |
| `CautionDepositPolicyMapping` entity | `apps/services/service-lib/src/lib/entities/caution-deposit-policy-mapping.entity.ts` |
| CD constants (LookUp keys) | `libs/service-lib/src/lib/constants.ts` (lines 1102–1106) |
| Response utilities | `libs/service-lib/src/lib/utils/response.utils.ts` |
| Frontend CD page | `apps/portals/ibp-portal/src/app/hr/cd-manage/` |

---

## 13. Dependency Sync Rule

This TRD depends on two upstream documents. When either changes, the sections listed must be updated before the TRD is signed off again.

| Upstream change | Sections to update in this TRD |
|---|---|
| **Framework spec** — API paths | §1.2 |
| **Framework spec** — response envelope shape | §1.2, §8 (all call sequences) |
| **Framework spec** — `admin_reports` schema | §3 (upsert script) |
| **Framework spec** — `admin_reports_parameters` schema | §3, §4 |
| **Framework spec** — `admin_reports_results_mappings` schema | §3 (result mappings inline in DO block) |
| **Framework spec** — placeholder naming standard | §4, SQL in §3 |
| **Framework spec** — export formats or pagination defaults | §9, §10 |
| **Framework spec** — security controls | §7 |
| **PRD** — new KPI, filter, or table section added | §2, §3 (new report key), §4, §6, §8, §10, §11 |
| **Schema change** — `caution_deposit` columns added/removed | §3 (SQL), §4, §5, §6 |
| **Schema change** — `caution_deposit_transaction` columns added/removed | §3 (SQL), §4, §5, §6 |
| **LookUp key change** — `CREDIT_TRANSACTION` / `DEBIT_TRANSACTION` / `CD_ACCOUNT_ACTIVE` | §3 (SQL hardcoded values), §4, §6.3 |

---

# END OF TRD
