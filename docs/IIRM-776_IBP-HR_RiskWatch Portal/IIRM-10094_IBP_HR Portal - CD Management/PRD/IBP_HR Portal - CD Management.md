<<<<<<< Updated upstream
# **PRD: CD Account Module**

IIRM-10094  
---

# **1\. Objective**

To enable HR users to **view and track Caution Deposit (CD) accounts and related financial transactions**, including **account-level balances and detailed transaction statements**, ensuring transparency in fund utilization and policy-level financial activities.

---

# **2\. Functional Requirements**

---

## **2.1 Module Structure**

The CD Account module should have **two sections**:

1. **Caution Deposit Account Details**  
2. **Caution Deposit Statement**

---

## **2.2 Caution Deposit Account Details**

Display a table with the following columns:

* Sr \#  
* CD Account Number *(Show list of CD accounts mapped to the company)*  
* Policy Number *(List of policies under each CD account)*  
* Amount *(Total amount per CD account)*  
* Min. Balance *(Minimum balance required per CD account – value / %)*  
* Running Balance *(TBD – current available balance)*  
* View Statement *(CTA to view statement of respective CD account)*

---

### **2.2.1 View Statement**

* On click of “View Statement”:  
  * Navigate to **Caution Deposit Statement section**  
  * Apply filter for selected CD Account

---

## **2.3 Caution Deposit Statement**

Display transaction-level details in a table with the following columns:

* Sr \#  
* Group Code (Entity)  
* Date Sent to Insurer  
* Transaction Description (Particulars)  
* Transaction Type  
* Credit  
* Debit  
* Balance  
* Type of Product  
* Policy Number  
* Endorsement Number  
* Endorsement Type  
* Total Employees in Addition  
* Total Lives in Addition  
* Total Employees in Deletion  
* Total Lives in Deletion  
* NEFT/RTGS Number  
* NEFT/RTGS Date  
* NEFT/RTGS Remark

---

## **2.4 Navigation & Interaction**

* Default view:  
  * Show **Caution Deposit Account Details**  
* On selecting “View Statement”:  
  * Navigate to statement view  
* Allow:  
  * Back navigation to account details

---

## **2.5 Filters (Statement Section) *(Recommended)***

* CD Account Number  
* Policy Number  
* Date Range  
* Transaction Type  
* Endorsement Type

---

## **2.6 Search *(Statement Section)***

* Search by:  
  * Policy Number  
  * Endorsement Number  
  * NEFT/RTGS Number

---

## **2.7 Export**

* Export statement data to CSV  
* Export should reflect:  
  * Applied filters  
  * Search results

---

# **3\. Business Rules**

* CD accounts should:  
  * Be mapped at company level  
* Policy mapping:  
  * Each CD account may have multiple policies  
* Running balance:  
  * Should be dynamically calculated *(Credits − Debits)*  
* Minimum balance:  
  * Should be configurable *(value or %)*  
* Statement data:  
  * Should include all financial transactions linked to CD account  
* Credit/Debit:  
  * Must reflect actual fund movement  
* NEFT/RTGS details:  
  * Should be captured for all bank transactions  
* Endorsement-related transactions:  
  * Must include member movement details  
* Data should:  
  * Be auditable and time-stamped  
* Export:  
  * Must match visible dataset

---

# **4\. User Stories & Acceptance Criteria**

---

## **User Story 1: View CD Accounts**

**As an HR user,**  
 I want to view CD account details,  
 so that I can track available funds

**Acceptance Criteria**

* **Given** CD accounts exist  
* **When** user opens module  
* **Then** system should display account details table

---

## **User Story 2: View Account Statement**

**As an HR user,**  
 I want to view transaction history,  
 so that I can track financial movements

**Acceptance Criteria**

* **Given** account is selected  
* **When** user clicks “View Statement”  
* **Then** system should display statement filtered by account

---

## **User Story 3: Track Transactions**

**As an HR user,**  
 I want to view credit/debit transactions,  
 so that I understand fund utilization

**Acceptance Criteria**

* **Given** statement is available  
* **When** data loads  
* **Then** system should display all transaction details

---

## **User Story 4: Filter Statement Data**

**As an HR user,**  
 I want to filter transactions,  
 so that I can analyze specific data

**Acceptance Criteria**

* **Given** data exists  
* **When** user applies filters  
* **Then** system should display filtered results

---

## **User Story 5: Export Statement**

**As an HR user,**  
 I want to export statement data,  
 so that I can use it externally

**Acceptance Criteria**

* **Given** filtered data  
* **When** user exports  
* **Then** system should download CSV

---

## **User Story 6: Validate Balance**

**As a system,**  
 I want to maintain accurate balances,  
 so that financial data is reliable

**Acceptance Criteria**

* **Given** transactions exist  
* **When** balance is calculated  
* **Then** balance \= previous balance \+ credit − debit

=======
# PRD - Phase 1

## 1. Module Overview

- **Purpose:** Enable HR users to view and track Caution Deposit (CD) accounts and related financial transactions, including account-level balances and detailed transaction statements.
- **Business Value:** Provides HR administrators with transparency into CD fund utilization and policy-level financial activity, reducing dependency on insurer or broker teams for balance and transaction information.
- **User Value:** HR users can independently monitor available CD balances, review transaction history, and export statements for internal financial reporting.
- **Module Type:** Core
- **Phase 1 Scope:** CD Account Details view (account list with balances), Caution Deposit Statement view (transaction-level detail), filters, search, and CSV export.

---

## 2. Scope & Boundaries

- **In Scope:**
    - CD Account Details section: list of CD accounts mapped to the company with balance and policy details
    - Caution Deposit Statement section: transaction-level listing with all defined columns
    - Navigation from CD Account Details to Statement filtered by selected account
    - Filters on Statement: CD Account Number, Policy Number, Date Range, Transaction Type, Endorsement Type
    - Search on Statement: Policy Number, Endorsement Number, NEFT/RTGS Number
    - CSV export of filtered/searched statement data

- **Out of Scope:**
    - CD top-up or fund transfer initiation
    - CD account creation or modification
    - Insurer-side transaction management
    - Automated low-balance alerts (future consideration)

- **Dependencies:**
    - Policy module — to map CD accounts to the correct policies
    - Financial/CD ledger system — source of account balances and transaction records
    - Endorsement module — transaction records linked to endorsement activities

- **Dependents:**
    - Dashboard module — consumes CD Balance per component for policy card display

---

## 3. User Personas & Contexts

- **Persona:** HR Administrator
    - **Goals:** Monitor available CD balance to ensure sufficient funds for upcoming endorsements, review transaction history to reconcile premium payments, and export statements for finance team reporting.
    - **Context:** Accesses CD Management module after receiving endorsement invoices, before initiating large bulk additions, or during monthly financial reconciliation.
    - **Pain Points:** Currently calls or emails the insurer/broker to get CD balance and transaction history; no self-service financial view exists.

---

## 4. User Stories

### HR Administrator

- **US-CD-001:** As an HR user, I want to view CD account details so that I can track available funds for each account.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given CD accounts exist for the logged-in company, when the user opens the CD Management module, then the system should display a table with: Sr #, CD Account Number, Policy Number(s), Amount, Minimum Balance, Running Balance, and a View Statement CTA.
        - Given multiple CD accounts exist, when all are displayed, then each account should show its own balance independently.

- **US-CD-002:** As an HR user, I want to view the transaction statement for a CD account so that I can track financial movements.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given a CD account is listed, when the user clicks "View Statement", then the system should navigate to the Caution Deposit Statement section with a filter pre-applied for the selected CD account.
        - Given the statement is displayed, when all transaction data loads, then it should show all columns: Sr #, Group Code, Date Sent to Insurer, Transaction Description, Transaction Type, Credit, Debit, Balance, Type of Product, Policy Number, Endorsement Number, Endorsement Type, Total Employees in Addition, Total Lives in Addition, Total Employees in Deletion, Total Lives in Deletion, NEFT/RTGS Number, NEFT/RTGS Date, NEFT/RTGS Remark.

- **US-CD-003:** As an HR user, I want to view all credit and debit transactions so that I understand fund utilization.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given the statement is available, when data loads, then the system should display all transaction details with correct Credit, Debit, and running Balance per row.
        - Given transactions are displayed, when the Balance column is shown, then it must equal the previous row's balance plus Credit minus Debit for each transaction row.

- **US-CD-004:** As an HR user, I want to filter transactions so that I can analyze specific data segments.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given statement data exists, when the user applies one or more filters (CD Account Number, Policy Number, Date Range, Transaction Type, Endorsement Type), then the listing should dynamically update to show only matching transactions.
        - Given multiple filters are active, when the listing renders, then only records satisfying all filters should be shown.

- **US-CD-005:** As an HR user, I want to export the statement data to CSV so that I can use it for finance reporting.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given filtered data is displayed, when the user clicks the export button, then the system should download a CSV file containing only the currently visible (filtered) dataset.
        - Given no filters are applied, when the user exports, then all statement records for the selected CD account should be included.

- **US-CD-006:** As a system, I want to maintain accurate running balances so that financial data is reliable.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given transactions exist for a CD account, when the balance is calculated per transaction row, then Balance = previous balance + Credit − Debit must hold true for every row.
        - Given a new transaction is recorded, when the statement loads, then the running balance must update to reflect it.

---

## 5. Functional Requirements

- **FR-CD-001:** The CD Management module must have two sections: Caution Deposit Account Details (default view) and Caution Deposit Statement.

- **FR-CD-002:** The CD Account Details section must display a table with: Sr #, CD Account Number, Policy Number(s) mapped to the account, Amount (total per account), Minimum Balance (value or %), Running Balance, and a "View Statement" CTA per row.

- **FR-CD-003:** Clicking "View Statement" must navigate to the Caution Deposit Statement section with the selected CD Account pre-filtered.

- **FR-CD-004:** The Caution Deposit Statement section must display transaction-level data with all 19 columns defined in US-CD-002.

- **FR-CD-005:** The Statement section must support filters for: CD Account Number, Policy Number, Date Range, Transaction Type, and Endorsement Type.

- **FR-CD-006:** The Statement section must support search by: Policy Number, Endorsement Number, and NEFT/RTGS Number.

- **FR-CD-007:** CSV export must download the currently filtered and searched statement dataset.

- **FR-CD-008:** Running Balance must be dynamically calculated as: Credits minus Debits, accumulated row by row from the oldest to the most recent transaction.

- **FR-CD-009:** The module must allow back navigation from the Statement section to the Account Details section.

---

## 6. Business Rules & Logic

- **BR-CD-001:** CD accounts must be mapped at the company level; each account may have multiple policies associated with it.
    - **Example:** One CD account may cover both GMC and GTL policies for the same company.
    - **Edge Cases:** If a policy is not yet mapped to any CD account, it should not appear in the CD Management view.

- **BR-CD-002:** Running Balance must be calculated dynamically as cumulative Credits minus Debits from the account's inception.
    - **Example:** If the opening balance is 500,000 and a debit of 50,000 is recorded, the running balance is 450,000.
    - **Edge Cases:** If a transaction has neither Credit nor Debit (e.g., a remark-only entry), the balance must remain unchanged.

- **BR-CD-003:** Minimum Balance must be configurable as either a fixed value or a percentage of the total amount, as set during account setup.
    - **Example:** Minimum balance of 10% on a 1,000,000 account = 100,000 minimum required.
    - **Edge Cases:** If Minimum Balance is not configured, the column should display "N/A".

- **BR-CD-004:** NEFT/RTGS details must be captured for all bank transactions; endorsement-related transactions must include member movement details (employees and lives added/deleted).
    - **Example:** An endorsement addition transaction must show Total Employees in Addition and Total Lives in Addition.
    - **Edge Cases:** For non-endorsement transactions (e.g., a direct fund transfer), member movement columns should display zero or N/A.

- **BR-CD-005:** Statement data must be auditable and time-stamped; no transaction record may be deleted or modified from the HR Portal.

- **BR-CD-006:** Export must include only the data currently visible after applying active filters and search.

---

## 7. User Interface Requirements

- **Screen:** CD Account Details
    - **Purpose:** Display a summary of all CD accounts with balances and quick access to statements.
    - **Key Elements:** Table with columns defined in FR-CD-002; "View Statement" CTA per row.
    - **User Flow:** User opens CD Management → Account Details table loads → user reviews balances → clicks "View Statement" for a specific account.
    - **Validation Rules:** Running Balance must be clearly labeled; Minimum Balance must indicate whether it is a value or percentage.

- **Screen:** Caution Deposit Statement
    - **Purpose:** Display full transaction history for the selected CD account with filtering and export capabilities.
    - **Key Elements:** Transaction table with all 19 columns, filter bar (CD Account, Policy, Date Range, Transaction Type, Endorsement Type), search input (Policy Number, Endorsement Number, NEFT/RTGS Number), export button, back navigation.
    - **User Flow:** User clicks "View Statement" on an account → Statement section loads pre-filtered → user refines filters/search → exports if needed → clicks back to return to Account Details.
    - **Validation Rules:** Table must show a loading state while data fetches; empty state message must display if no transactions match filters/search.

---

## 8. Data Requirements

- **Input Data:**
    - CD account records from the financial/CD ledger system (account number, policies, amounts, balances)
    - Transaction records per CD account (all 19 columns defined in the statement)
    - Endorsement metadata for transaction linkage (endorsement number, type, member movement)

- **Output Data:**
    - CD Account Details table
    - Filtered and paginated transaction statement
    - Dynamically computed running balance per transaction row
    - CSV export file

- **Stored Data:**
    - CD Management module does not own financial records; all data is read from the source ledger system.
    - Applied filter preferences may be preserved in session state during navigation.

---

## 9. Integration Specifications

- **APIs/Interfaces:**
    - `GET /cd-accounts?companyId={id}` — returns CD account details for the company
    - `GET /cd-statement?accountId={id}&filters=...` — returns transaction statement for the selected account with filters applied
    - `GET /cd-statement/export?accountId={id}&filters=...` — returns CSV export of filtered statement

- **Data Flow:**
    - HR user opens module → company `companyId` passed to accounts API → Account Details table renders.
    - HR clicks "View Statement" → `accountId` passed to statement API with pre-applied account filter → Statement section renders.
    - HR applies additional filters → updated filter parameters sent to statement API → table re-renders.

- **Error Handling:**
    - If the CD ledger is unavailable, both sections must show an error state with a retry option.
    - If export fails, a user-facing error message must be shown without disrupting the statement view.

---

## 10. Performance & Quality Requirements

- **Performance:**
    - CD Account Details must load within 2 seconds.
    - Statement must load within 3 seconds for datasets up to 2,000 transactions.
    - Filter and search changes must update the statement within 1 second.
    - CSV export must initiate within 3 seconds for datasets up to 5,000 rows.

- **Reliability:**
    - Running balance calculation must be deterministic; same input data must always produce the same balance sequence.

- **Security:**
    - CD account and transaction data must be scoped to the logged-in HR user's company; cross-company access must be prevented.
    - All API endpoints must require authenticated sessions.
    - No transaction record may be modified or deleted through the HR Portal.

- **Usability:**
    - Running Balance column must be highlighted or formatted to distinguish it from Credit and Debit columns.
    - Statement table must support horizontal scrolling for the wide column set.

---

## 11. Success Metrics

- **Business Metrics:**
    - Reduction in HR time spent requesting balance and statement information from insurers or brokers.
    - Increase in financial reconciliation accuracy through self-service statement access.

- **User Metrics:**
    - % of HR sessions that include a CD Management module visit.
    - Average number of statement exports per month per company.

- **Technical Metrics:**
    - API response time for statement under 3 seconds at p95.
    - Export success rate above 99%.

- **Adoption Metrics:**
    - % of HR users who view the CD statement at least once per policy cycle.

---

## 12. Edge Cases & Error Scenarios

- **Error Case 1:** CD ledger system is unavailable.
    - **User Experience:** Both Account Details and Statement sections display an error state with a retry button.
    - **System Behavior:** No stale data is shown; error is scoped to the CD module only.

- **Error Case 2:** Export fails due to a server-side error.
    - **User Experience:** Toast or inline error: "Export failed. Please try again."
    - **System Behavior:** Statement view remains intact; no partial file is downloaded.

- **Error Case 3:** No transactions exist for the selected CD account and filters.
    - **User Experience:** Empty state message: "No transactions found for the selected criteria."
    - **System Behavior:** Export button is disabled when no records are visible.

- **Edge Case 1:** A CD account has a running balance below its configured Minimum Balance.
    - **Business Logic:** Balance is shown as-is; no automatic alert is triggered (alerts are a future consideration).
    - **User Impact:** HR user can visually identify that the balance is below the minimum and take action.

- **Edge Case 2:** A transaction has both Credit and Debit values (e.g., a correction entry).
    - **Business Logic:** Both values are shown in their respective columns; the net impact is reflected in the Running Balance.
    - **User Impact:** HR user sees the full picture of the transaction without ambiguity.

- **Edge Case 3:** An endorsement transaction has no associated NEFT/RTGS details.
    - **Business Logic:** NEFT/RTGS columns display "N/A" or empty; this is a valid state for non-bank transactions.
    - **User Impact:** HR user understands the transaction was not a bank transfer.

---

## 13. Future Considerations

- **Enhancement 1:** Low-balance alerts — notify HR when the running balance falls below the configured Minimum Balance threshold.
- **Enhancement 2:** Visual balance trend chart showing CD balance over time.
- **Enhancement 3:** Downloadable PDF statement in formatted layout for submission to finance or audit teams.
- **Enhancement 4:** Comparative view showing balance utilization across policy periods.
- **Enhancement 5:** Drill-down from a transaction row to the linked endorsement record for full traceability.

---

## 14. Acceptance Criteria Summary

- [ ] CD Account Details section displays all accounts mapped to the company with Sr #, Account Number, Policy Number(s), Amount, Minimum Balance, Running Balance, and View Statement CTA.
- [ ] Clicking "View Statement" navigates to the Statement section pre-filtered for the selected account.
- [ ] Statement section displays all 19 required columns for every transaction.
- [ ] Running Balance is correctly calculated (previous balance + Credit − Debit) for every row.
- [ ] Filters (CD Account, Policy, Date Range, Transaction Type, Endorsement Type) work individually and in combination.
- [ ] Search supports Policy Number, Endorsement Number, and NEFT/RTGS Number.
- [ ] CSV export downloads the currently filtered and searched dataset.
- [ ] Back navigation from Statement section returns user to Account Details.
- [ ] No data modification is permitted from the HR Portal.
- [ ] All data is scoped to the logged-in HR user's company; no cross-company leakage.
- [ ] Error states and empty states are displayed correctly when no data or service failure occurs.

---

## 15. Open Questions

- **Question 1:** What defines the "opening balance" for a CD account — is it established at policy inception or configured separately?
- **Question 2:** Should the Running Balance in the Account Details section reflect the real-time balance from the ledger, or should it be calculated from the transaction statement?
- **Question 3:** Is pagination required for the Statement listing, and if so, what is the default page size?
- **Question 4:** Should the module show CD accounts for all policy periods or only the currently selected period?
- **Question 5:** Are there any user roles within HR who should have restricted access to CD financial data (e.g., junior HR staff vs. HR Manager)?
>>>>>>> Stashed changes
