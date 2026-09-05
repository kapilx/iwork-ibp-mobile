<<<<<<< Updated upstream
# **PRD: Hospital Network Module (IIRM-10093)**

---

# **1\. Objective**

To provide HR users with access to the **hospital network information**, ensuring visibility of **network hospitals available under the policy**, consistent with the Employee Portal, and sourced from centralized configuration.

---

# **2\. Functional Requirements**

---

## **2.1 Navigation & Access**

* The **Hospital Network** module should be available in the menu  
* On click, the system should:  
  * Open the **same screen and experience as the Employee Portal**

---

## **2.2 Data Source**

* Hospital network data should be:  
  * Configured and uploaded via **Portal Configuration (IWork)**  
* The same data should be:  
  * Reflected in both:  
    * Employee Portal  
    * HR Portal

---

## **2.3 Hospital Listing**

* Display list of network hospitals with relevant details *(as per employee portal)*  
* Data should include:  
  * Hospital Name  
  * Location (City / State)  
  * Other details as configured

---

## **2.4 Search & Filter**

* Provide search functionality:  
  * Hospital Name  
  * City  
* Filters should be aligned with:  
  * Employee portal behavior

---

## **2.5 Consistency**

* UI/UX should:  
  * Be identical to Employee Portal  
* Any updates in configuration:  
  * Should reflect in both portals in real-time or near real-time

---

# **3\. Business Rules**

* Hospital network is:  
  * Applicable primarily for **GMC policies**  
* Data should:  
  * Be centrally managed via IWork configuration  
* No manual modification should be allowed from HR portal  
* HR portal should:  
  * Act as a read-only view for hospital network  
* Data consistency must be maintained:  
  * Between Employee Portal and HR Portal  
* Updates in configuration:  
  * Must reflect without requiring separate uploads

---

# **4\. User Stories & Acceptance Criteria**

---

## **User Story 1: Access Hospital Network**

**As an HR user,**  
 I want to access hospital network details,  
 so that I can assist employees.

**Acceptance Criteria**

* **Given** user clicks on Hospital Network  
* **When** module opens  
* **Then** system should display hospital list same as employee portal

---

## **User Story 2: View Hospital List**

**As an HR user,**  
 I want to view network hospitals,  
 so that I can identify available providers.

**Acceptance Criteria**

* **Given** hospital data is configured  
* **When** screen loads  
* **Then** system should display hospital list

---

## **User Story 3: Search Hospitals**

**As an HR user,**  
 I want to search hospitals,  
 so that I can quickly find specific providers.

**Acceptance Criteria**

* **Given** hospital data exists  
* **When** user searches by name or city  
* **Then** system should display matching results

---

## **User Story 4: Data Consistency**

**As a system,**  
 I want to ensure consistent hospital data across portals,  
 so that users see the same information.

**Acceptance Criteria**

* **Given** hospital data is updated in IWork  
* **When** HR or employee accesses the module  
* **Then** both portals should reflect the updated data 

=======
# PRD - Phase 1

## 1. Module Overview

- **Purpose:** Provide HR users with read-only access to the network hospital list available under the policy, consistent with the Employee Portal experience.
- **Business Value:** Enables HR administrators to assist employees with hospital network queries without requiring access to separate TPA portals or configuration systems.
- **User Value:** HR users can quickly look up network hospitals by name or city to guide employees on cashless claim eligibility.
- **Module Type:** Feature
- **Phase 1 Scope:** Hospital listing with search by hospital name and city, read-only view identical to the Employee Portal, data sourced from IWork portal configuration.

---

## 2. Scope & Boundaries

- **In Scope:**
    - Hospital Network module accessible from the menu
    - Hospital listing with name, location (City/State), and configured details
    - Search by Hospital Name and City
    - Read-only view consistent with Employee Portal

- **Out of Scope:**
    - Hospital data entry or modification from the HR Portal
    - Hospital network configuration (managed in IWork only)
    - Cashless claim initiation from the hospital network view
    - Hospital accreditation or quality data

- **Dependencies:**
    - IWork (Portal Configuration) — source of hospital network data; changes here must reflect in both portals
    - Employee Portal module — HR Portal must mirror the same hospital data and UX

- **Dependents:**
    - Claim Intimation module — HR may reference the hospital network when selecting a hospital during claim intimation

---

## 3. User Personas & Contexts

- **Persona:** HR Administrator
    - **Goals:** Assist employees in identifying network hospitals for cashless claims under their GMC policy.
    - **Context:** Accesses Hospital Network module when an employee asks for nearby network hospitals or when verifying cashless eligibility for a specific hospital.
    - **Pain Points:** Currently has to check TPA portals or call the insurer to confirm if a hospital is in-network; there is no consolidated HR-facing view.

---

## 4. User Stories

### HR Administrator

- **US-HN-001:** As an HR user, I want to access hospital network details so that I can assist employees with cashless claim queries.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given the user clicks on Hospital Network in the menu, when the module opens, then the system should display the hospital list using the same screen and experience as the Employee Portal.
        - Given the module is open, when hospital data is not yet loaded, then a loading state must be shown.

- **US-HN-002:** As an HR user, I want to view the list of network hospitals so that I can identify available providers for employees.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given hospital data is configured in IWork, when the screen loads, then the system should display the hospital list with Hospital Name, Location (City/State), and other configured details.
        - Given the hospital list is displayed, when no search is active, then all configured hospitals should be visible.

- **US-HN-003:** As an HR user, I want to search for hospitals by name or city so that I can quickly find specific providers.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given hospital data exists, when the user enters a search term in the Hospital Name or City field, then the system should display all matching results supporting partial and exact matches.
        - Given a search returns no results, when the listing renders, then an empty state message should be shown.

- **US-HN-004:** As a system, I want to ensure consistent hospital data across portals so that HR and employees always see the same information.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given hospital data is updated in IWork configuration, when an HR user or employee accesses the Hospital Network module, then both portals should reflect the updated data in real-time or near-real-time.
        - Given data is updated in IWork, when no separate upload or sync action is required in the HR Portal, then the update must propagate automatically.

---

## 5. Functional Requirements

- **FR-HN-001:** The Hospital Network module must be accessible from the main navigation menu.
    - **Module Context:** On click, the system must open the same screen and experience as the Employee Portal hospital network view.

- **FR-HN-002:** The hospital listing must display Hospital Name, Location (City and State), and any additional fields as configured in IWork.

- **FR-HN-003:** The system must provide a search function accepting Hospital Name and City as search terms, with support for partial and exact matches.

- **FR-HN-004:** Hospital data must be sourced exclusively from IWork portal configuration; no manual modification is permitted from the HR Portal.

- **FR-HN-005:** Any update to hospital data in IWork must be reflected in both the Employee Portal and the HR Portal without requiring a separate upload or action.

---

## 6. Business Rules & Logic

- **BR-HN-001:** The Hospital Network module applies primarily to GMC (Group Medical Cover) policies; it may not be relevant for GTL or GPA policies.
    - **Example:** An HR user viewing a GMC policy should see the hospital network; if viewing only a GTL policy, this module may show an empty or N/A state.
    - **Edge Cases:** If a company has both GMC and non-GMC policies, the module must only show hospital data relevant to the GMC policy.

- **BR-HN-002:** Hospital data is centrally managed in IWork; no manual modification is allowed from the HR Portal.
    - **Example:** HR cannot add or remove hospitals from the listing; they can only view and search.
    - **Edge Cases:** If IWork data is temporarily unavailable, the HR Portal must show the last successfully fetched data or an appropriate error state.

- **BR-HN-003:** Data consistency must be maintained between the Employee Portal and the HR Portal for all hospital records.
    - **Example:** If a hospital is deactivated in IWork, it must disappear from both portals simultaneously.
    - **Edge Cases:** If a sync delay occurs, the portal should indicate the last updated timestamp to set user expectations.

- **BR-HN-004:** Search must align with the search behavior implemented in the Employee Portal to maintain UX consistency.

---

## 7. User Interface Requirements

- **Screen:** Hospital Network — Listing View
    - **Purpose:** Display the full list of network hospitals for the selected policy.
    - **Key Elements:** Hospital listing table/cards with Hospital Name, City, State, and configured details; search bar for Hospital Name and City.
    - **User Flow:** User clicks Hospital Network in menu → module opens → listing loads → user searches if needed.
    - **Validation Rules:** Loading state must be shown while data fetches; empty state message must be shown if no data is configured or search returns no results.
    - **Consistency Rule:** Layout, components, and interactions must be identical to the Employee Portal's hospital network view.

---

## 8. Data Requirements

- **Input Data:**
    - Hospital records from IWork configuration (name, city, state, additional configured fields)
    - Policy context to scope relevance (GMC policies only)

- **Output Data:**
    - Filtered hospital listing based on search input
    - Read-only display of hospital details

- **Stored Data:**
    - Hospital Network module does not own or persist data; all data is read from IWork configuration.
    - No HR Portal-side caching beyond standard browser or API caching.

---

## 9. Integration Specifications

- **APIs/Interfaces:**
    - `GET /hospital-network?policyId={id}&search=...` — returns hospital list filtered by search term, scoped to the policy's insurer network

- **Data Flow:**
    - HR user opens Hospital Network → policy context passed to API → hospital list renders from IWork data.
    - IWork configuration is updated → API data source reflects changes → both portals show updated data on next request.

- **Error Handling:**
    - If IWork data is unavailable, the listing must show an error state with a retry option.
    - No partial or stale data must be shown without a visible timestamp or warning.

---

## 10. Performance & Quality Requirements

- **Performance:**
    - Hospital listing must load within 2 seconds for a standard dataset.
    - Search results must update within 1 second of input.

- **Reliability:**
    - Module must gracefully handle IWork unavailability without crashing other portal sections.

- **Security:**
    - Hospital data is not sensitive; no special access restrictions beyond standard authenticated session.
    - All API endpoints must require authenticated sessions.

- **Usability:**
    - UI must be identical to the Employee Portal to ensure HR users can guide employees through the same view.
    - Search must be clearly labeled with "Search by Hospital Name or City".

---

## 11. Success Metrics

- **Business Metrics:**
    - Reduction in HR time spent manually looking up network hospitals via external channels.

- **User Metrics:**
    - % of HR sessions that include a Hospital Network module visit.
    - Average search queries per session.

- **Technical Metrics:**
    - API response time for hospital listing under 2 seconds at p95.
    - Data sync lag between IWork update and HR Portal reflection under 5 minutes.

- **Adoption Metrics:**
    - % of HR users who use the search feature at least once per month.

---

## 12. Edge Cases & Error Scenarios

- **Error Case 1:** IWork configuration data is unavailable.
    - **User Experience:** Module displays an error state: "Hospital network data is currently unavailable. Please try again later."
    - **System Behavior:** No stale or partial data is shown; other portal modules remain unaffected.

- **Error Case 2:** Hospital data is configured in IWork but no hospitals are assigned to the selected policy's network.
    - **User Experience:** Empty state message: "No network hospitals configured for this policy."
    - **System Behavior:** Search is disabled; no listing is rendered.

- **Edge Case 1:** HR user searches for a hospital name that partially matches multiple records.
    - **Business Logic:** All partial matches are returned and displayed.
    - **User Impact:** HR user can browse results and identify the specific hospital.

- **Edge Case 2:** Hospital data is updated in IWork while an HR user has the listing open.
    - **Business Logic:** The update is not pushed in real-time; the HR user will see updated data on the next page load or manual refresh.
    - **User Impact:** A last-updated timestamp should be shown to indicate data freshness.

---

## 13. Future Considerations

- **Enhancement 1:** Map view of network hospitals by geolocation to help HR and employees find the nearest network hospital.
- **Enhancement 2:** Filter by specialty or type of facility (e.g., super-specialty, day-care) if IWork supports such attributes.
- **Enhancement 3:** Export hospital list to CSV or PDF for offline sharing with employees.
- **Enhancement 4:** Deep link from Claim Intimation hospital search to the Hospital Network listing for a consistent lookup experience.

---

## 14. Acceptance Criteria Summary

- [ ] Hospital Network module is accessible from the main navigation menu.
- [ ] Hospital listing displays all hospitals configured in IWork for the relevant policy with Name, City, State, and configured details.
- [ ] Search by Hospital Name and City returns partial and exact matches.
- [ ] Module UI is identical to the Employee Portal hospital network view.
- [ ] Data updates in IWork are reflected in both portals in real-time or near-real-time without a separate HR Portal action.
- [ ] No hospital data modification is permitted from the HR Portal.
- [ ] Loading state is shown while data fetches; empty state is shown when no data is available.
- [ ] Module shows an error state with retry option when IWork data is unavailable.

---

## 15. Open Questions

- **Question 1:** Should the Hospital Network module be policy-period-aware — i.e., does the hospital network change between policy periods, and if so, should the view reflect the selected period?
- **Question 2:** What is the acceptable data sync interval between IWork updates and portal reflection — real-time, near-real-time (under 5 minutes), or batch (nightly)?
- **Question 3:** Are there any hospital attributes beyond Name, City, and State that need to be displayed (e.g., contact number, cashless desk details, accreditation)?
- **Question 4:** Should the module be hidden or disabled for HR users whose company does not have a GMC policy?
- **Question 5:** Is there a pagination requirement for the hospital listing, or should all hospitals be loaded at once?
>>>>>>> Stashed changes
