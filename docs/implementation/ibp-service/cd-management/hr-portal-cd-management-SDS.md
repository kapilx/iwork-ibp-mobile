# HR Portal – CD Management Tab – Software Design Specification (SDS)

**Document Version:** 2.1
**Date:** 2026-05-04
**Author:** IIRM Engineering Team
**Jira Reference:** IIRM-9479
**Related Documents:**
- PRD: `hr-portal-cd-management-PRD.md`
- TRD: `hr-portal-cd-management-TRD.md`

> This document defines what the CD Management tab must show and how it must behave. Presentation details — specific chart types, component libraries, colour tokens, layout choices — are implementation decisions owned by the frontend team. Where a data field has a business-meaningful visual state (e.g., over-utilisation is a warning condition), this document specifies the state and its meaning; it does not prescribe how that state is rendered.

---

## 1. Navigation and Entry Point

| Step | Action | Result |
|---|---|---|
| 1 | HR Admin is on the HR Portal Dashboard | Dashboard displays the list of company policies |
| 2 | HR Admin clicks on a policy | Navigates to the Policy Details page for that policy |
| 3 | HR Admin selects the **CD Management** tab | The tab becomes active; CD account data for the selected policy is displayed |

The policy context is established by the Dashboard → Policy Details navigation. All data within the tab is scoped to that policy. No policy selection control exists within the tab.

---

## 2. Tab Overview

The CD Management tab gives HR Admins a consolidated view of the caution deposit accounts and transaction ledger for the selected policy. The tab comprises two sections:

1. **CD Account Summary** — CD accounts linked to the selected policy, with balance and utilisation indicators
2. **Deposit Transactions** — complete filterable transaction ledger for all CD accounts under the selected policy

All data is scoped to the selected policy and the authenticated HR Admin's company.

---

## 3. Section 1 — CD Account Summary

### 3.1 Purpose

Provides a per-account view of every active CD account linked to the selected policy. Enables HR Admins to assess which accounts are under-funded or approaching over-utilisation, and to navigate directly to the filtered transaction view for any account.

### 3.2 Aggregate KPIs

Before the account list, four key metrics are shown for the selected policy as a whole:

| # | Metric | API field | Notes |
|---|---|---|---|
| 1 | Total Deposit Balance | `totalDepositBalance` | Sum of current balance across all active CD accounts for the selected policy |
| 2 | Utilised Amount | `utilisedAmount` | Cumulative sum of all debit transactions for the selected policy |
| 3 | Utilisation (%) | `utilisedPercent` | `utilisedAmount ÷ totalDepositBalance × 100`; null when `totalDepositBalance = 0` |
| 4 | Last Deposit Date | `lastDepositDate`, `lastDepositAmount`, `lastDepositBank` | Date, amount, and bank of the most recent credit transaction for this policy |

Each KPI must communicate two additional supporting data points:

- **Quarter-over-quarter change** — direction and magnitude of change vs the previous quarter; presented as a secondary indicator alongside the primary value.
- **6-month net balance trend** — `balanceTrendData` is a time-ordered array of up to 6 monthly net values (credits minus debits per calendar month). The frontend must represent this trend visually in a format appropriate to the component; the exact type is not prescribed.

**Data availability states:**

| Condition | Expected behaviour |
|---|---|
| No active CD accounts for the policy | KPI values show zero; trend shows no data state |
| No credit transactions exist | `lastDepositDate`, `lastDepositAmount`, `lastDepositBank` are null → display as not available |
| `totalDepositBalance = 0` | `utilisedPercent` is null → display utilisation as not available |
| `balanceTrendData` has fewer than 6 entries | Render available data points only |

### 3.3 Fields Per Account Row

| Field | API field | Notes |
|---|---|---|
| CD Account Name | `cdAccountName` | — |
| Policy Number | `policyNumber` | Insurer policy number (confirms the account–policy linkage) |
| Deposit Balance | `depositBalance` | All amounts in ₹ |
| Utilised Amount | `utilisedAmount` | Cumulative debit total for this account; shown as a distinct value, not just a percentage |
| Utilisation (%) | `utilisationPercent` | Proportional indicator (see §3.4) |
| Last Updated | `lastUpdated` | Date the CD account record was last updated |

### 3.4 Utilisation Indicator

Utilisation must be presented as a proportional visual indicator alongside the percentage value. The indicator communicates urgency:

| Utilisation range | Urgency state | Semantic meaning |
|---|---|---|
| ≤ 50% | Normal | Account is healthy |
| 51% – 80% | Caution | Account is approaching risk |
| > 80% | Warning | Account needs attention |
| > 100% | Over-utilised | Critical — utilisation exceeds the deposited balance |

The over-utilised state (> 100%) must be visually distinct and clearly communicate an abnormal condition. Specific colours, icons, or styling are frontend implementation decisions.

### 3.5 Aggregate Summary Row

A summary row must appear at the bottom of the account list showing:
- Total of `depositBalance` across all displayed rows
- Total of `utilisedAmount` across all displayed rows

This row is computed client-side from the API response.

### 3.6 Search Behaviour

A search input filters the account list by `cdAccountName` or `policyNumber`. Matching is case-insensitive and partial. The search triggers a new API call; it is not a client-side filter.

Empty search = no filter applied.

### 3.7 "View Transactions" Action

Each account row provides an action to view the full transaction ledger for that specific CD account. Invoking this action must:

1. Pre-apply the CD Account filter in the Deposit Transactions section to the selected account.
2. Navigate the user's focus to the Deposit Transactions section.
3. Trigger a fresh fetch of the transactions with the pre-applied account filter.

No separate page navigation is required.

### 3.8 Export

The account list can be exported as Excel, CSV, or PDF. The export applies the active search filter. If no rows match the current filter, the export must not be generated; the user must be informed that there is no data to export.

---

## 4. Section 2 — Deposit Transactions

### 4.1 Purpose

Full transaction ledger for all CD accounts linked to the selected policy. HR Admins use this section to investigate specific deposits or deductions, reconcile account activity, and export records for the finance team.

### 4.2 Filters

| Filter | Type | Default | Behaviour |
|---|---|---|---|
| CD Account | Dropdown — "All Accounts" + one entry per active CD account linked to the policy | All Accounts | Restricts transactions to the selected CD account |
| Date Range | Preset options + custom date range | Last 6 Months | `startDate` / `endDate` applied to transaction date |
| Transaction Type | Dropdown — All / Deposit (Credit) / Deduction (Debit) | All | Maps to `CREDIT_TRANSACTION` / `DEBIT_TRANSACTION` |
| Search | Text input | Empty | Matches `referenceId` or `remarks` (partial, case-insensitive) |

**Date Range preset values:**

| Label | startDate | endDate |
|---|---|---|
| Last 1 Month | today − 1 month | today |
| Last 3 Months | today − 3 months | today |
| Last 6 Months (default) | today − 6 months | today |
| Last 12 Months | today − 12 months | today |
| Custom | user-selected | user-selected |

All filters apply simultaneously (AND logic). Any filter change triggers a fresh API call and resets pagination to page 1. A **Reset** control clears all filters to their defaults.

A count of matched records is displayed alongside the section title and updates on every filter change.

### 4.3 Transaction Fields

| Field | API field | Display notes |
|---|---|---|
| Date | `txnDate` | — |
| Amount | `amount` | Positive value = Deposit; negative value = Deduction. Deposits and deductions must be visually distinguishable. |
| Type | `txnType` | Display as "Deposit" / "Deduction" |
| Bank | `bankName` | Null → display as not available |
| Running Balance | `runningBalance` | Null → display as not available; field is stored as varchar, render as-is |
| Reference | `referenceId` | NEFT/RTGS reference or cheque number |

### 4.4 Transaction Detail

Each transaction has additional fields that are returned in every API row but are not shown in the primary list view. These fields are available for display when the user requests more detail for a specific transaction. **No additional API call is required** — all detail fields are already present in the list response.

The fields shown depend on transaction type:

**For Deduction (DEBIT_TRANSACTION) rows:**

| Field | API field | Null display |
|---|---|---|
| Endorsement Reference | `endorsementNumber` | Not available |
| Endorsement Type | `endorsementType` | Not available |
| Reference ID | `referenceId` | Not available |
| IFSC Code | `ifscCode` | Not available |
| Created By | `createdBy` | Not available |
| Remarks | `remarks` | Not available |

**For Deposit (CREDIT_TRANSACTION) rows:**

| Field | API field | Null display |
|---|---|---|
| Reference Number | `referenceId` | Not available |
| Bank | `bankName` | Not available |
| Value Date | `transactionValueDate` | Not available |
| IFSC Code | `ifscCode` | Not available |
| Created By | `createdBy` | Not available |
| Remarks | `remarks` | Not available |

All null or missing detail fields must be shown as "not available". Never display a blank cell or the string "null".

### 4.5 Pagination

The transaction list is paginated. The view must communicate:
- How many records match the current filters (total count)
- Which subset is currently visible

Default page size: 50 rows. Maximum: 500 rows per page.

### 4.6 Empty State

When no transactions match the active filter criteria, the section must communicate that no data is available for the selected combination. This is not an error state — it is a valid "no results" condition.

### 4.7 Export

The transaction list can be exported as Excel, CSV, or PDF. The export applies all active filters and is not paginated — the full matching result set is returned. If no rows match, the export must not be generated; the user must be informed that there is no data to export.

---

## 5. Cross-Section Interaction

| Trigger | Effect |
|---|---|
| "View Transactions" action on an account row | Sets the Transactions CD Account filter to the selected account; refreshes the Transactions section; brings the Transactions section into view |
| Reset in Transactions section | Clears all Transactions filters to defaults, including any CD Account pre-applied via "View Transactions" |

---

## 6. Loading and Error States

| State | Scope | Expected behaviour |
|---|---|---|
| Tab activation | Both sections | Each section renders independently as its data resolves; sections load in parallel |
| Filter change | Affected section only | The section being filtered shows a loading state; other sections are unaffected |
| API error | Per section | The affected section shows an error state with a retry action; other sections continue to function |
| Export error | Export action | The export is not triggered; the user is notified of the failure |

---

## 7. Data Contracts and Null Handling

| Field | Null / missing value treatment |
|---|---|
| `lastDepositDate`, `lastDepositAmount`, `lastDepositBank` | Show as not available when null |
| `utilisedPercent` | Show as not available when null (`totalDepositBalance = 0`); do not attempt to render a percentage |
| `runningBalance` | Show as not available when null or empty (legacy records may not carry this field) |
| `endorsementNumber`, `endorsementType` | Show as not available — deductions may not always have a linked endorsement |
| `bankName` | Show as not available — some transactions may not carry a bank name |
| `createdBy` | Show as not available when null |
| All amounts | Displayed in ₹ |

---

# END OF SDS
