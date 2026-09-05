# HR Portal – CD Management Page – Product Requirements Document (PRD)

**Document Version:** 1.3
**Date:** 2026-05-04
**Author:** IIRM Product Team
**Jira Reference:** IIRM-9479
**Related Documents:**
- SDS: `hr-portal-cd-management-SDS.md`
- TRD: `hr-portal-cd-management-TRD.md`
- Framework Reference: `docs/implementation/ibp-service/hr-module-report-framework-tech-spec.md`

> This document captures business requirements only. UI layout, component behaviour, navigation patterns, field mappings, and interaction details are in the SDS. Any update to the framework spec must be reflected in the TRD and the API endpoint contracts described there.

----

## 1. Objective

The CD Management (Caution Deposit Management) page gives HR administrators a consolidated view of their company's caution deposit accounts across all active policies. It enables HR teams to:

- Monitor CD account health and total deposit balances
- Track deduction utilisation against available balance
- Review the complete transaction ledger (credits and debits)
- Reconcile CD account balances with finance

---

## 2. Business Rules and Constraints

| Rule | Description |
|---|---|
| Company scoping | All data is scoped to the authenticated HR Admin's company via JWT. The company ID is not user-changeable. |
| Active accounts only | The Account Details section shows only active CD accounts (`status = 'CD_ACCOUNT_ACTIVE'`). |
| Transaction finality | A caution deposit transaction is final when recorded. There is no pending or draft transaction state. |
| Deduction linkage | CD deductions are recorded at the endorsement level (member addition/deletion events), not at the individual claim level. |
| No pending-claim balance | The caution deposit account does not carry a pending-claims field. If pending claim data is required, it must be sourced from the Claims module via a separate call. |
| Utilised Amount definition | Utilised Amount = cumulative sum of all DEBIT_TRANSACTION entries for the account. |
| Utilisation percentage | Utilisation % = Utilised Amount ÷ Deposit Balance × 100. |
| Running balance | Each transaction record carries the running CD balance after that transaction. |

---

## 3. Section 1 — KPI Summary

Four key performance indicators are always visible at the top of the page.

| # | Metric | Definition |
|---|---|---|
| 1 | Total Deposit Balance | Sum of current balances across all active CD accounts for the company |
| 2 | Utilised Amount | Sum of all debit (DEBIT_TRANSACTION) entries across all active CD accounts |
| 3 | Total Deductions | Cumulative debited amount from all CD accounts |
| 4 | Last Deposit Date | Date of the most recent credit (CREDIT_TRANSACTION), with its amount and bank name |

Each KPI includes:
- A **quarter-over-quarter change indicator** (current quarter vs previous quarter)
- A **6-month net balance trend** (credits minus debits per month)

---

## 4. Section 2 — Account Details

### 4.1 Purpose

Provides a per-account breakdown of all active CD accounts linked to the company's policies.

### 4.2 Filter

| Filter | Behaviour |
|---|---|
| Search | Filters rows by CD account name or insurer policy number |

### 4.3 Data Per Account

| Field | Description |
|---|---|
| CD Account Name | Name of the caution deposit account |
| Policy Number | Insurer policy number linked to this CD account |
| Deposit Balance | Current balance of the CD account |
| Utilised Amount | Cumulative debit transactions against this account |
| Utilisation (%) | Utilised Amount ÷ Deposit Balance × 100 |
| Last Updated | Date the CD account record was last updated |

A **Total row** at the bottom of the table shows aggregate Deposit Balance and Utilised Amount across all displayed accounts.

### 4.4 Actions

- **View Transactions** (per account row) — opens the full transaction ledger scoped to that account's policy. The policy scope is fixed for the duration of the view and is not exposed as a user-facing filter.

### 4.5 Export

The Account Details table can be exported as Excel or PDF, respecting the active search filter.

---

## 5. Section 3 — Deposit Transactions

### 5.1 Purpose

Full transaction ledger for a specific CD account, scoped to the account selected from the Account Details view. Filterable by date range and transaction type.

### 5.2 Filters

| Filter | Options | Default |
|---|---|---|
| Date Range | Last 1 Month / Last 3 Months / Last 6 Months / Last 12 Months / Custom date range | Last 6 Months |
| Type | All Types / Deposit (Credit) / Deduction (Debit) | All Types |
| Search | Searches by reference ID and remarks | Empty |

All filters apply simultaneously and refresh the table on change. A **Reset** option clears Date Range, Type, and Search back to defaults — the account scope (policyId) is retained.

### 5.3 Data Per Transaction

| Field | Description |
|---|---|
| Date | Transaction date |
| Policy | Insurer policy number |
| Amount | Transaction amount (positive for credits, negative for debits) |
| Type | Credit (Deposit) or Debit (Deduction) |
| Bank | Bank name associated with the transaction |
| Running Balance | Running CD balance after this transaction |
| Reference | NEFT/RTGS reference number or cheque number |

### 5.4 Transaction Detail (Expanded View)

Each transaction row can be expanded to show additional detail.

**For Deductions (DEBIT_TRANSACTION):**

| Field | Description |
|---|---|
| Endorsement Reference | Insurer endorsement number |
| Endorsement Type | Addition or Deletion |
| Reference ID | Transaction reference or cheque number |
| IFSC Code | Bank IFSC code |
| Created By | IIRM ops user who posted the transaction |
| Remarks | Notes on the deduction |

**For Deposits (CREDIT_TRANSACTION):**

| Field | Description |
|---|---|
| Reference Number | NEFT/RTGS inward reference or cheque number |
| Bank | Bank name |
| Value Date | Cheque or NEFT value date |
| IFSC Code | Bank IFSC code |
| Created By | IIRM ops user who posted the deposit |
| Remarks | Notes on the deposit |

### 5.5 Export

The transaction list can be exported as Excel or PDF, respecting all active filters.

---

## 6. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Page initial load | < 2 seconds (KPI cards + Account Details) |
| Transaction table load | < 2 seconds (default: Last 6 Months, scoped to selected account) |
| Export generation | < 5 seconds |
| Availability | 99.9% |

---

## 7. User Stories

| # | Story |
|---|---|
| US-01 | As an HR Admin, I can view a consolidated health summary of my company's CD accounts — covering total deposit balance, utilisation, cumulative deductions, and the most recent deposit — so I can monitor CD account status without depending on separate finance systems. |
| US-02 | As an HR Admin, I can view a breakdown of each active CD account's balance and utilisation, and access the full transaction history for any account, so I can understand per-account financial standing and investigate specific accounts when needed. |
| US-03 | As an HR Admin, I can access the complete transaction ledger for a specific CD account by navigating from the account summary, narrow it down by time period and transaction type, search by reference or remarks, and view the full detail of any transaction — so I can track deposits and deductions and reconcile activity for that account. |
| US-04 | As an HR Admin, I can export account balance summaries and filtered transaction history so I can share accurate data with my finance team for reconciliation. |

---

## 8. Edge Cases

| Scenario | Expected Behaviour |
|---|---|
| CD account has zero balance | Deposit Balance is shown as ₹0 and utilisation as 0%; the account remains visible in the account summary. |
| No transactions match the selected filter criteria | The system communicates that no data is available for the selected criteria; no transaction data is returned. |
| A deduction has no linked endorsement | The endorsement reference for that transaction is shown as not available. |
| A deposit has no bank name recorded | The bank name for that transaction is shown as not available. |
| Utilisation exceeds 100% | The utilisation percentage is displayed accurately; the system communicates the over-utilisation state as a warning condition. |
| Export requested with no data matching active filters | The export is not generated; the system informs the user that there is no data to export. |
| Running balance is unavailable for a transaction | The running balance for that transaction is shown as not available. |

---

## 9. Out of Scope

- Initiating new deposits from the portal
- Approving or rejecting CD deductions
- CD account creation or management
- Bank account configuration
- Alerts or notifications for low CD balance
- Claim-level drill-down from CD transactions (Claims module scope)

---

## 10. Stakeholders

| Role | Interest |
|---|---|
| HR Admin | Primary user — monitors balances and tracks transactions |
| Finance Team | Reconciliation via exports |
| IBP Operations | Monitors CD utilisation |
| Product Manager | Acceptance criteria |
| Engineering Lead | Technical delivery |

---

# END OF PRD
