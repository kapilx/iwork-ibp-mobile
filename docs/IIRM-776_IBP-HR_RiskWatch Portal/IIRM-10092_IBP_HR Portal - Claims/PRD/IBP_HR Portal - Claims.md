# PRD - Phase 1

## 1. Module Overview

- **Purpose:** Enable HR users to view, track, and analyze employee claims data across policies through a centralized module.
- **Business Value:** Provides HR administrators with full visibility into claim status, financials, and processing timelines, reducing dependency on TPA systems for status updates.
- **User Value:** HR users can quickly locate, filter, and export claims data to monitor cost exposure and identify processing delays.
- **Module Type:** Core
- **Phase 1 Scope:** Claim listing with all financial columns, filters (time period, status, claim type), search (name, claim number, e-card), CSV export, and status/aging display.

---

## 2. Scope & Boundaries

- **In Scope:**
    - Tabular claim listing with all defined columns
    - Filters: Time Period, Claim Status, Claim Type
    - Search by Employee Name, Claim Number, E-Card Number
    - CSV export of filtered/searched claims
    - TAT/Aging calculation and display per claim
    - Claim status display (latest state)

- **Out of Scope:**
    - Detailed claim view / full lifecycle drill-down (future scope — TBD)
    - Claim filing or processing
    - TPA integration configuration
    - Document upload or management

- **Dependencies:**
    - Policy module — to scope claims by selected policy
    - TPA/claims system — source of claim records, statuses, and financial data
    - Enrolment module — to resolve employee and member identity

- **Dependents:**
    - Dashboard module — consumes claims data for insights and claim ratio
    - Claim Intimation module — creates claim records visible in this listing

---

## 3. User Personas & Contexts

- **Persona:** HR Administrator
    - **Goals:** Monitor claim activities across the policy, track outstanding and rejected claims, and export data for reporting.
    - **Context:** Accesses Claims module when reviewing policy utilization, following up on pending claims, or preparing reports for management.
    - **Pain Points:** Currently has no centralized view of all employee claims; must rely on TPA portals or manual reports to get claim status.

---

## 4. User Stories

### HR Administrator

- **US-CLM-001:** As an HR user, I want to view all claims in a structured table so that I can monitor claim activities across the policy.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given claims data exists for the selected policy, when the user opens the Claims module, then the system should display a tabular listing with all required columns: Claim Number, Employee ID, Employee Name, Relation, TPA ID, Claim Type, Claim Date, Claim Amount, Paid Amount, Outstanding Amount, Rejected Amount, Closed Amount, Denied Amount, Status, and TAT/Aging.
        - Given claims are loaded, when no filters are applied, then all claims for the selected policy should be visible.

- **US-CLM-002:** As an HR user, I want to filter claims by time period, status, and claim type so that I can analyze specific datasets.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given claims are available, when the user applies a filter (Time Period, Status, or Claim Type), then the listing should update dynamically to reflect only matching records.
        - Given multiple filters are applied simultaneously, when the listing renders, then only records matching all applied filters should be shown.

- **US-CLM-003:** As an HR user, I want to search claims by employee name, claim number, or e-card number so that I can quickly find specific records.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given claims data exists, when the user enters a search term (employee name, claim number, or e-card number), then the system should display all matching records supporting both partial and exact matches.
        - Given a search is active, when filters are also applied, then results should reflect both the search term and filters combined.

- **US-CLM-004:** As an HR user, I want to export claims data to CSV so that I can use it for external reporting.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given filtered or searched data is displayed, when the user clicks the export button, then the system should download a CSV file containing only the currently visible (filtered) data.
        - Given no filters are applied, when the user exports, then the full claims dataset for the selected policy should be included in the CSV.

- **US-CLM-005:** As an HR user, I want to view claim status and TAT/aging so that I can track claim processing timelines.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given a claim exists, when it is displayed in the listing, then the system should show the latest available status and the TAT/Aging in days.
        - Given a claim is closed or settled, when aging is displayed, then it should reflect days from claim date to closure date, not to today.
        - Given a claim is still open, when aging is displayed, then it should reflect days from claim date to today.

- **US-CLM-006:** As an HR user, I want to view detailed claim information so that I can understand the full claim lifecycle.
    - **Priority:** Low
    - **Acceptance Criteria:**
        - Given a claim record exists, when the user clicks on a claim row, then the system should navigate to a detailed claim view (scope TBD in a future phase).

---

## 5. Functional Requirements

- **FR-CLM-001:** The Claims module must display a tabular listing of all claims for the selected policy with the following columns: Claim Number, Employee ID, Employee Name, Relation, TPA ID, Claim Type, Claim Date, Claim Amount, Paid Amount, Outstanding Amount, Rejected Amount, Closed Amount, Denied Amount, Status, and TAT/Aging (days).
    - **Module Context:** Data must be scoped to the currently selected policy and the logged-in HR user's company.

- **FR-CLM-002:** The system must provide filters for Time Period (year-wise), Claim Status (Claim Amount / Paid / Outstanding / Rejected / Closed / Denied), and Claim Type (Cashless / Reimbursement).
    - **Module Context:** Filters must work in combination and update the listing dynamically without a page reload.

- **FR-CLM-003:** The system must provide a search bar that accepts Employee Name, Claim Number, and E-Card Number, supporting partial and exact matches.

- **FR-CLM-004:** The system must provide a CSV export function that downloads the currently filtered and searched claims dataset.

- **FR-CLM-005:** TAT/Aging must be calculated as: days from Claim Date to Closure Date for closed claims, and days from Claim Date to today for open claims.

- **FR-CLM-006:** Claim Status must always reflect the latest available state from the TPA or claims system.

---

## 6. Business Rules & Logic

- **BR-CLM-001:** Claims data must be policy-specific and accessible only to HR users within their RBAC scope.
    - **Example:** An HR user with branch-level access should only see claims for employees under their branch.
    - **Edge Cases:** If the HR user's scope changes mid-session, the listing must refresh to reflect the updated scope.

- **BR-CLM-002:** Financial fields must follow defined semantics: Claim Amount = total claimed; Paid Amount = settled amount; Outstanding = pending amount; Rejected and Denied are tracked separately.
    - **Example:** A claim of 50,000 with 30,000 paid and 20,000 outstanding must show all three figures separately.
    - **Edge Cases:** A claim can have partial payments; fields must not be summed or merged.

- **BR-CLM-003:** Rejected and Denied claims must be tracked as separate statuses and not aggregated.
    - **Example:** Rejected = claim sent back due to incomplete documentation; Denied = claim refused on policy grounds.
    - **Edge Cases:** A claim transitioning from Rejected to resubmitted must update its status accordingly.

- **BR-CLM-004:** Closed claims represent approved claims pending final settlement or documentation and must not be treated as fully paid.

- **BR-CLM-005:** Search must support partial and exact matches across Employee Name, Claim Number, and E-Card Number simultaneously if all three fields are queried.

- **BR-CLM-006:** Export must include only data visible after applying current filters and search; it must not export the full unfiltered dataset when filters are active.

- **BR-CLM-007:** Claims data must be synchronized with TPA systems where applicable; stale data older than the configured refresh interval should be flagged.

---

## 7. User Interface Requirements

- **Screen:** Claims Listing
    - **Purpose:** Provide a comprehensive tabular view of all claims for quick monitoring and action.
    - **Key Elements:** Data table with all 15 columns, filter bar (Time Period, Status, Claim Type), search input, export button.
    - **User Flow:** User opens Claims module → table loads with default view → user applies filters/search → table updates → user exports if needed.
    - **Validation Rules:** Table must show a loading state while data fetches; show an empty state message if no results match filters/search.

- **Screen:** Claim Detail View (Future Scope)
    - **Purpose:** Show full lifecycle details for a selected claim.
    - **Key Elements:** TBD in future phase.
    - **User Flow:** User clicks a row in the listing → navigates to claim detail screen.

---

## 8. Data Requirements

- **Input Data:**
    - Claim records from TPA/claims system (claim number, type, status, amounts, dates, member info)
    - Policy and member data from Policy and Enrolment modules for context and scoping
    - E-Card numbers from Enrolment module for search

- **Output Data:**
    - Filtered and paginated claims listing
    - Computed TAT/Aging per claim
    - CSV export file

- **Stored Data:**
    - Claims module does not own claim records; it reads from the TPA or claims data source.
    - Applied filter preferences may be stored in session state.

---

## 9. Integration Specifications

- **APIs/Interfaces:**
    - `GET /claims?policyId={id}&filters=...` — returns paginated claims listing with all columns
    - `GET /claims/export?policyId={id}&filters=...` — returns CSV download of filtered claims

- **Data Flow:**
    - HR user selects policy → `policyId` passed to claims API → listing renders.
    - HR user applies filters → filter parameters added to query → listing re-renders.
    - HR user exports → same query sent to export endpoint → CSV downloaded client-side.

- **Error Handling:**
    - If the TPA/claims data source is unavailable, the listing must show an error state with a retry option.
    - If export fails, a user-facing error message must be shown without disrupting the listing view.

---

## 10. Performance & Quality Requirements

- **Performance:**
    - Claims listing must load within 3 seconds for a standard dataset on a normal connection.
    - Filter and search changes must update the listing within 1 second.
    - CSV export must initiate download within 3 seconds for datasets up to 10,000 rows.

- **Reliability:**
    - Listing must degrade gracefully if TPA data is stale or temporarily unavailable.

- **Security:**
    - Claims data must be scoped to the logged-in HR user's RBAC access level; cross-company data access must be prevented.
    - All API endpoints must require authenticated sessions.

- **Usability:**
    - Table must support horizontal scroll for wide column sets on standard desktop screens.
    - Column headers must clearly label each financial field to prevent confusion.

---

## 11. Success Metrics

- **Business Metrics:**
    - Reduction in time HR spends gathering claim status from TPA portals manually.
    - Increase in HR-initiated follow-ups on aged outstanding claims.

- **User Metrics:**
    - % of HR sessions that include a Claims module visit.
    - Average time to locate a specific claim record.

- **Technical Metrics:**
    - API response time for claims listing under 3 seconds at p95.
    - Export success rate above 99%.

- **Adoption Metrics:**
    - % of HR users who use the export feature at least once per month.
    - Filter usage rate across sessions.

---

## 12. Edge Cases & Error Scenarios

- **Error Case 1:** TPA system is down or claims data is unavailable.
    - **User Experience:** Claims listing shows an error state with a retry button.
    - **System Behavior:** No stale data is shown; error is scoped to the claims section only.

- **Error Case 2:** Export fails due to a server-side error.
    - **User Experience:** A toast or inline error message is shown: "Export failed. Please try again."
    - **System Behavior:** The listing view remains intact; no partial file is downloaded.

- **Error Case 3:** No claims exist for the selected policy and filters.
    - **User Experience:** Empty state with message: "No claims found for the selected criteria."
    - **System Behavior:** Export button is disabled when no records are visible.

- **Edge Case 1:** A claim has zero values across all financial fields.
    - **Business Logic:** All financial columns display "0" rather than blank.
    - **User Impact:** HR can distinguish between missing data and genuinely zero-value claims.

- **Edge Case 2:** Two claims have the same claim number (duplicate from TPA).
    - **Business Logic:** Both records must be shown; deduplication is not applied at the HR portal level.
    - **User Impact:** HR can identify the discrepancy and escalate to TPA.

- **Edge Case 3:** A claim's status changes while the HR user is viewing the listing.
    - **Business Logic:** The listing reflects the state at the time of the last data fetch; a manual refresh or filter re-apply will load the latest state.
    - **User Impact:** HR is not shown real-time push updates unless they refresh.

---

## 13. Future Considerations

- **Enhancement 1:** Detailed claim view with full lifecycle, document references, and status history (currently marked TBD).
- **Enhancement 2:** Real-time status sync with TPA systems to eliminate manual refresh dependency.
- **Enhancement 3:** Bulk action support — e.g., flag multiple claims for follow-up.
- **Enhancement 4:** Claim aging alerts — notify HR when a claim exceeds a configured TAT threshold.
- **Enhancement 5:** Claims analytics summary at the top of the listing (total outstanding, total paid, average aging).

---

## 14. Acceptance Criteria Summary

- [ ] Claims listing displays all 15 required columns for the selected policy.
- [ ] Filters for Time Period, Status, and Claim Type work individually and in combination.
- [ ] Search supports Employee Name, Claim Number, and E-Card Number with partial and exact matches.
- [ ] CSV export downloads the currently filtered and searched dataset.
- [ ] TAT/Aging is calculated correctly for both open and closed claims.
- [ ] Claim status reflects the latest state from the TPA/claims system.
- [ ] Claims data is scoped to the HR user's RBAC access level; no cross-company leakage.
- [ ] Empty states and error states are displayed correctly when no data or service failure occurs.
- [ ] Export is disabled when no records are visible.

---

## 15. Open Questions

- **Question 1:** What is the exact definition of "Closed" status — is it an intermediate state before full payment, or does it represent a finalized non-paid outcome?
- **Question 2:** Should TAT/Aging be calculated from claim intimation date or from the date received by TPA?
- **Question 3:** Is pagination required for the claims listing, and if so, what is the default page size?
- **Question 4:** Should the Claims module support real-time sync with TPA, or is a periodic refresh (e.g., nightly batch) acceptable?
- **Question 5:** What is the scope of the Claim Detail View — which fields and documents should it display?
