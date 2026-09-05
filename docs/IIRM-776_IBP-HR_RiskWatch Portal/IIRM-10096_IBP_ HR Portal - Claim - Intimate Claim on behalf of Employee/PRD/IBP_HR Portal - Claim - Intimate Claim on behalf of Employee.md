<<<<<<< Updated upstream
# **PRD: Claim Intimation (HR on Behalf of Employee) ( IIRM-10096)**

---

# **1\. Objective**

To enable HR users to **intimate claims on behalf of employees and their dependents**, ensuring a **seamless and guided process** for submitting claim requests with accurate details, including **hospital information, diagnosis, and admission details**, with support for both **cashless and reimbursement claims**.

---

# **2\. Functional Requirements**

---

## **2.1 Entry Point**

* Claim Intimation should be available under the **Claims module**  
* HR user initiates claim on behalf of employee

---

## **2.2 Employee Search**

* Search employee using:  
  * Employee ID  
  * Employee Name  
  * Email ID  
  * Phone Number  
* Display matching results  
* Allow user to select employee

---

## **2.3 Dependent Selection**

* Display list of:  
  * Employee (Self)  
  * Dependents  
* Allow HR to select the member for whom the claim is being intimated

---

## **2.4 Claim Type Selection**

* Select claim type:  
  * Cashless  
  * Reimbursement

---

## **2.5 Diagnosis / Reason**

* Input field (Free text)  
* Mandatory field

---

## **2.6 Estimated Amount**

* Input field (Free text / numeric)  
* Mandatory field

---

## **2.7 Admission Details**

* Date of Admission *(Calendar selection)*  
* Proposed Date of Discharge *(Calendar selection)*

---

## **2.8 Hospital Selection**

### **Search Flow:**

* Search by:  
  * Hospital Name  
  * City  
* Display hospital list  
* Allow selection

---

### **Manual Entry (If Hospital Not Found)**

Allow user to add hospital details:

* Hospital Name  
* Address  
* State  
* City  
* Email / Phone

---

## **2.9 Submission**

* Submit claim intimation form  
* System should:  
  * Validate all mandatory fields  
  * Create claim intimation record  
  * Trigger integration (if applicable with TPA)

---

# **3\. Business Rules**

* HR should be able to:  
  * Intimate claim only for employees within their access scope (RBAC)  
* Dependent list should:  
  * Be fetched from active enrolment data  
* Claim type must be:  
  * Mandatory selection  
* Diagnosis and estimated amount:  
  * Must be captured before submission  
* Admission date must:  
  * Not be in the future *(configurable if required)*  
* Discharge date must:  
  * Be greater than or equal to admission date  
* Hospital selection:  
  * Prefer network hospital selection  
  * Allow manual entry only if not available  
* Manual hospital entry:  
  * Must be validated for required fields  
* Claim record must:  
  * Be tagged with source \= “HR Intimation”  
* System should:  
  * Prevent duplicate claim intimation for same member and same admission date *(configurable)*  
* Data must:  
  * Be integrated with TPA system where applicable

---

# **4\. User Stories & Acceptance Criteria**

---

## **User Story 1: Search Employee**

**As an HR user,**  
 I want to search for an employee,  
 so that I can initiate a claim on their behalf.

**Acceptance Criteria**

* **Given** employee exists  
* **When** HR searches using ID/name/email/phone  
* **Then** system should display matching employees

---

## **User Story 2: Select Member**

**As an HR user,**  
 I want to select employee or dependent,  
 so that claim can be raised for the correct member.

**Acceptance Criteria**

* **Given** employee is selected  
* **When** dependent list loads  
* **Then** system should display all active dependents

---

## **User Story 3: Enter Claim Details**

**As an HR user,**  
 I want to enter claim details,  
 so that claim can be processed accurately.

**Acceptance Criteria**

* **Given** form is open  
* **When** HR enters diagnosis, amount, and dates  
* **Then** system should accept valid inputs

---

## **User Story 4: Select Hospital**

**As an HR user,**  
 I want to select a hospital,  
 so that claim is linked to the correct provider.

**Acceptance Criteria**

* **Given** hospital exists  
* **When** HR searches hospital  
* **Then** system should display results  
* **When** hospital is not found  
* **Then** system should allow manual entry

---

## **User Story 5: Submit Claim Intimation**

**As an HR user,**  
 I want to submit claim intimation,  
 so that claim process can be initiated.

**Acceptance Criteria**

* **Given** all mandatory fields are filled  
* **When** HR clicks submit  
* **Then** claim intimation should be created  
* **And** system should validate:  
  * Required fields  
  * Date conditions

---

## **User Story 6: Prevent Invalid Submission**

**As a system,**  
 I want to validate data before submission,  
 so that incorrect claims are avoided.

**Acceptance Criteria**

* **Given** invalid or incomplete data  
* **When** user submits form  
* **Then** system should show validation errors 

=======
# PRD - Phase 1

## 1. Module Overview

- **Purpose:** Enable HR users to intimate claims on behalf of employees and their dependents through a guided, multi-step form.
- **Business Value:** Reduces delays in claim initiation when employees are unable to submit claims themselves (e.g., during hospitalization), ensuring faster TPA processing and better coverage utilization.
- **User Value:** HR administrators can quickly find an employee, select the affected member, enter clinical and hospital details, and submit a claim intimation in a single workflow without switching systems.
- **Module Type:** Feature
- **Phase 1 Scope:** Employee search, member selection (self/dependents), claim type selection, diagnosis entry, estimated amount, admission/discharge dates, hospital search with manual entry fallback, and form submission with validation.

---

## 2. Scope & Boundaries

- **In Scope:**
    - Entry point within the Claims module
    - Employee search by Employee ID, Name, Email ID, Phone Number
    - Display of employee and active dependents for member selection
    - Claim type selection: Cashless / Reimbursement
    - Diagnosis / reason entry (free text, mandatory)
    - Estimated amount entry (numeric, mandatory)
    - Admission date and Proposed Discharge date selection
    - Hospital search by name and city with network hospital selection
    - Manual hospital entry if the hospital is not found in the network
    - Form submission with server-side validation
    - Claim record tagged as "HR Intimation" source

- **Out of Scope:**
    - Claim processing, approval, or payment
    - Document upload at the time of intimation (future scope)
    - Reimbursement claim document submission
    - Tracking of intimated claims within this module (visible in the Claims listing)
    - Employee self-service claim intimation (handled in Employee Portal)

- **Dependencies:**
    - Enrolment module — to fetch active dependents for the selected employee
    - Hospital Network module — to provide the network hospital search list
    - Claims module — to store the resulting claim intimation record
    - TPA integration — to trigger downstream claim notification where applicable
    - RBAC module — to enforce that HR can only intimate claims for employees within their access scope

- **Dependents:**
    - Claims listing module — displays the submitted claim intimation in the claims table

---

## 3. User Personas & Contexts

- **Persona:** HR Administrator
    - **Goals:** Initiate a claim intimation on behalf of an employee who is hospitalized or otherwise unable to submit it themselves, ensuring the TPA is notified promptly.
    - **Context:** Accesses Claim Intimation when an employee or their family member contacts HR about a hospitalization, or proactively when HR is informed of an admission.
    - **Pain Points:** Currently has to call or email the TPA directly to intimate a claim on behalf of an employee; no structured self-service form exists in the HR Portal.

---

## 4. User Stories

### HR Administrator

- **US-CI-001:** As an HR user, I want to search for an employee so that I can initiate a claim on their behalf.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given the HR user opens the Claim Intimation screen, when they enter a search term (Employee ID, Name, Email ID, or Phone Number), then the system should display all matching employees within the HR user's RBAC scope.
        - Given matching results are shown, when the HR user selects an employee, then the form should advance to the member selection step.

- **US-CI-002:** As an HR user, I want to select the employee or a dependent as the claimant so that the claim is raised for the correct member.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given an employee is selected, when the dependent list loads, then the system should display the employee (Self) and all of their active dependents.
        - Given the list is displayed, when the HR user selects a member, then the selected member is set as the claimant for the rest of the form.
        - Given a dependent is deleted or inactive, when the list renders, then that dependent must not appear as a selectable option.

- **US-CI-003:** As an HR user, I want to enter claim details (type, diagnosis, estimated amount, dates) so that the claim can be processed accurately.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given the member is selected, when the HR user selects claim type (Cashless or Reimbursement), then the form must require this selection before advancing.
        - Given the form is open, when the HR user enters the diagnosis (free text) and estimated amount (numeric), then both fields must be validated as mandatory before submission.
        - Given the HR user enters admission and discharge dates, when the dates are validated, then the Date of Admission must not be in the future, and the Proposed Date of Discharge must be greater than or equal to the Date of Admission.

- **US-CI-004:** As an HR user, I want to select a hospital from the network so that the claim is linked to the correct provider.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given the HR user searches by Hospital Name or City, when results are returned, then a list of matching network hospitals should be displayed for selection.
        - Given the HR user selects a hospital from the list, when the selection is confirmed, then the hospital details are attached to the claim form.

- **US-CI-005:** As an HR user, I want to manually enter a hospital if it is not found in the network so that the claim intimation is not blocked.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given the HR user searches for a hospital and it is not found, when the "Hospital Not Found" option is available, then the system should present a manual entry form with fields: Hospital Name, Address, State, City, Email, Phone.
        - Given the manual entry form is shown, when the HR user submits, then Hospital Name must be mandatory and all provided fields must be validated.

- **US-CI-006:** As an HR user, I want to submit the claim intimation so that the claim process is initiated.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given all mandatory fields are completed, when the HR user clicks Submit, then a claim intimation record should be created, tagged with source = "HR Intimation", and the TPA integration should be triggered where applicable.
        - Given mandatory fields are missing or invalid data is present, when the HR user clicks Submit, then the system should display inline validation errors and prevent submission.
        - Given submission is successful, when the record is created, then a success confirmation is shown to the HR user.

- **US-CI-007:** As a system, I want to validate data before submission so that incorrect or duplicate claim intimations are avoided.
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given all mandatory fields are filled, when the HR user submits, then the system should check for a duplicate intimation for the same member and same admission date.
        - Given a potential duplicate is detected, when the user submits, then the system should warn the HR user and require explicit confirmation to proceed (duplicate prevention is configurable).

---

## 5. Functional Requirements

- **FR-CI-001:** Claim Intimation must be accessible as an entry point within the Claims module.

- **FR-CI-002:** The system must provide an employee search accepting Employee ID, Employee Name, Email ID, and Phone Number, scoped to the HR user's RBAC access.

- **FR-CI-003:** After employee selection, the system must display a member list containing the employee (Self) and all active dependents fetched from the Enrolment module.

- **FR-CI-004:** The form must require selection of Claim Type (Cashless or Reimbursement) as a mandatory step.

- **FR-CI-005:** The form must include a mandatory free-text Diagnosis/Reason field.

- **FR-CI-006:** The form must include a mandatory numeric Estimated Amount field.

- **FR-CI-007:** The form must include Date of Admission (calendar picker, must not be a future date) and Proposed Date of Discharge (calendar picker, must be >= admission date).

- **FR-CI-008:** The form must include a hospital search accepting Hospital Name and City, returning network hospitals for selection.

- **FR-CI-009:** If the required hospital is not found in the network search, the system must provide a manual entry form with fields: Hospital Name (mandatory), Address, State, City, Email, Phone.

- **FR-CI-010:** On submission, the system must validate all mandatory fields, enforce date rules, create the claim intimation record tagged as source = "HR Intimation", and trigger TPA integration where applicable.

- **FR-CI-011:** Duplicate intimation detection must check for the same member and same admission date; if a duplicate is detected, the user must be warned before proceeding (behavior is configurable).

---

## 6. Business Rules & Logic

- **BR-CI-001:** HR can only intimate claims for employees within their RBAC-defined access scope.
    - **Example:** A branch-level HR user can only search for and select employees from their branch.
    - **Edge Cases:** If the searched employee is outside the HR user's scope, no results should be returned.

- **BR-CI-002:** The dependent list must be fetched from active enrolment data only; deleted or inactive dependents must not appear.
    - **Example:** If a spouse was removed in a deletion endorsement, they must not appear in the member selection list.
    - **Edge Cases:** If the enrolment data is temporarily unavailable, the form should show an error and prevent submission until the list can be loaded.

- **BR-CI-003:** Claim Type selection is mandatory; no other form fields should be processed before this is selected.

- **BR-CI-004:** Date of Admission must not be set to a future date (configurable if required).
    - **Example:** Today is 6 April 2026; the admission date must be on or before 6 April 2026.
    - **Edge Cases:** If the configuration allows future admission dates, the rule must be relaxed accordingly.

- **BR-CI-005:** Proposed Date of Discharge must be greater than or equal to Date of Admission.
    - **Example:** Admission on 3 April; Discharge cannot be set to 2 April.
    - **Edge Cases:** Same-day admission and discharge (day-care procedure) is valid; discharge date = admission date is allowed.

- **BR-CI-006:** Network hospital selection is preferred; manual entry is permitted only when the hospital is not available in the network search.
    - **Example:** HR searches for "ABC Clinic" and it does not appear; manual entry form is then enabled.
    - **Edge Cases:** Manual entry fields must require Hospital Name at minimum; partial information is accepted for other fields.

- **BR-CI-007:** The submitted claim intimation record must be tagged with source = "HR Intimation" to distinguish it from employee-submitted intimations.

- **BR-CI-008:** Duplicate intimation check: same member + same admission date = potential duplicate. HR must be warned; submission is blocked or confirmed (configurable).

- **BR-CI-009:** All submitted data must be integrated with the TPA system where applicable; the claim should not be considered complete until TPA acknowledgement is received (or logged as pending if TPA is unavailable).

---

## 7. User Interface Requirements

- **Screen:** Claim Intimation — Employee Search
    - **Purpose:** Allow HR to find the employee for whom the claim is being intimated.
    - **Key Elements:** Search input (Employee ID, Name, Email, Phone), results list, select action.
    - **User Flow:** HR opens intimation → enters search term → selects employee from results.
    - **Validation Rules:** Minimum 3 characters required before search executes; show empty state if no match found within HR's scope.

- **Screen:** Claim Intimation — Member Selection
    - **Purpose:** Identify the specific member (employee or dependent) for the claim.
    - **Key Elements:** List of employee (Self) and active dependents with name and relation.
    - **User Flow:** After employee selection → member list loads → HR selects member → form advances.
    - **Validation Rules:** Only active members are shown; at least one member must be selected to proceed.

- **Screen:** Claim Intimation — Claim Details Form
    - **Purpose:** Capture all required clinical and financial details for the claim.
    - **Key Elements:** Claim Type toggle (Cashless / Reimbursement), Diagnosis text field, Estimated Amount input, Date of Admission picker, Proposed Date of Discharge picker.
    - **User Flow:** HR fills all mandatory fields → validation runs inline → advances to hospital selection.
    - **Validation Rules:** All mandatory fields display inline errors on blur and on submit attempt.

- **Screen:** Claim Intimation — Hospital Selection
    - **Purpose:** Link the claim to the treating hospital.
    - **Key Elements:** Hospital Name search input, City search input, results list, manual entry toggle/form.
    - **User Flow:** HR searches hospital → selects from results or triggers manual entry → hospital attached to form.
    - **Validation Rules:** Network hospital is preferred; manual entry requires Hospital Name at minimum.

- **Screen:** Claim Intimation — Submission Confirmation
    - **Purpose:** Confirm successful submission of the claim intimation.
    - **Key Elements:** Success message, Claim Intimation reference number (if available), option to return to Claims listing.
    - **User Flow:** HR submits → success screen appears → HR navigates back to Claims.

---

## 8. Data Requirements

- **Input Data:**
    - Employee records from Enrolment module (name, ID, email, phone, active dependents)
    - Network hospital list from Hospital Network module (name, city, state)
    - HR user's RBAC scope definition for search filtering

- **Output Data:**
    - Claim intimation record with all form fields, member reference, claim type, hospital details, and source tag
    - TPA notification payload (where integration exists)

- **Stored Data:**
    - Claim intimation record persisted in the Claims module data store
    - Manual hospital entry stored as a non-network hospital reference linked to the claim

---

## 9. Integration Specifications

- **APIs/Interfaces:**
    - `GET /enrolment/search?query=...&scope={rbacScope}` — employee search
    - `GET /enrolment/members/{employeeId}/dependents` — active dependents for the employee
    - `GET /hospital-network?search=...` — network hospital search
    - `POST /claims/intimate` — submit claim intimation record
    - TPA webhook / API call triggered on successful submission (where applicable)

- **Data Flow:**
    - HR searches employee → scoped employee search API → results displayed.
    - HR selects member → dependent list API loaded → list displayed.
    - HR searches hospital → hospital network API queried → results displayed.
    - HR submits form → POST to claims/intimate → record created → TPA notified.

- **Error Handling:**
    - If dependent list fails to load, the form must show an error and block submission until resolved.
    - If TPA integration fails on submission, the claim intimation record must still be saved and the failure logged for retry; the HR user should see a warning: "Claim saved but TPA notification is pending."

---

## 10. Performance & Quality Requirements

- **Performance:**
    - Employee search results must return within 1 second.
    - Hospital search results must return within 1 second.
    - Form submission must complete within 3 seconds.

- **Reliability:**
    - TPA integration failure must not block claim intimation creation; the record must always be persisted locally.

- **Security:**
    - HR users must only be able to search and select employees within their RBAC scope; server-side enforcement is mandatory.
    - Claim intimation data must not be accessible to employees until it appears as a claim in their portal (if applicable).

- **Usability:**
    - Multi-step form must show clear progress indication.
    - Inline validation errors must appear immediately on field blur and on submit attempt.
    - Manual hospital entry must be clearly labeled as a fallback option, not the primary path.

---

## 11. Success Metrics

- **Business Metrics:**
    - Reduction in time between hospitalization and claim intimation for HR-initiated claims.
    - Increase in timely TPA notifications for employee hospitalizations.

- **User Metrics:**
    - % of Claims module sessions that include a Claim Intimation action.
    - Average form completion time.

- **Technical Metrics:**
    - Form submission success rate above 99%.
    - TPA notification delivery success rate above 95%.

- **Adoption Metrics:**
    - Number of HR-initiated claim intimations per month.
    - % of HR users who use the feature at least once per quarter.

---

## 12. Edge Cases & Error Scenarios

- **Error Case 1:** Employee search returns no results within the HR user's RBAC scope.
    - **User Experience:** Empty state message: "No employees found. Please refine your search."
    - **System Behavior:** No results are shown; form does not advance.

- **Error Case 2:** Active dependent list fails to load.
    - **User Experience:** Error message: "Unable to load member list. Please try again."
    - **System Behavior:** Form is blocked at the member selection step; submission is prevented.

- **Error Case 3:** TPA integration fails on submission.
    - **User Experience:** Warning: "Claim intimation saved. TPA notification is pending — please follow up if not resolved shortly."
    - **System Behavior:** Claim intimation record is persisted; TPA call is queued for retry.

- **Edge Case 1:** Employee has no active dependents.
    - **Business Logic:** Only "Self" (employee) appears in the member selection list.
    - **User Impact:** HR can still proceed to intimate a claim for the employee directly.

- **Edge Case 2:** HR submits a potential duplicate (same member, same admission date).
    - **Business Logic:** System detects the duplicate and presents a warning with the existing intimation reference.
    - **User Impact:** HR confirms intentional re-submission or cancels to review the existing record.

- **Edge Case 3:** The hospital is a day-care facility (admission date = discharge date).
    - **Business Logic:** Discharge date = admission date is valid; no validation error is raised.
    - **User Impact:** HR can complete the form without workarounds.

---

## 13. Future Considerations

- **Enhancement 1:** Document upload at the time of intimation — attach discharge summary, prescription, or bills for reimbursement claims.
- **Enhancement 2:** Pre-population of hospital details based on the employee's last claim for repeat claims at the same hospital.
- **Enhancement 3:** Real-time TPA acknowledgement display — show TPA reference number immediately after successful submission.
- **Enhancement 4:** Claim intimation status tracking — allow HR to view the progress of submitted intimations directly in this module.
- **Enhancement 5:** Bulk intimation for mass hospitalization events (e.g., group accident), allowing HR to submit multiple intimations simultaneously.

---

## 14. Acceptance Criteria Summary

- [ ] Claim Intimation is accessible as a clear entry point within the Claims module.
- [ ] Employee search accepts ID, Name, Email, and Phone with results scoped to HR user's RBAC access.
- [ ] Member selection displays employee (Self) and all active dependents; inactive/deleted dependents are excluded.
- [ ] Claim Type (Cashless / Reimbursement) is a mandatory selection before the rest of the form can be completed.
- [ ] Diagnosis and Estimated Amount are mandatory fields with inline validation.
- [ ] Date of Admission must not be in the future; Proposed Discharge Date must be >= Admission Date.
- [ ] Hospital search returns network hospital results by name and city.
- [ ] Manual hospital entry is available as a fallback when the hospital is not found; Hospital Name is mandatory.
- [ ] Submission validates all mandatory fields, creates the claim record tagged as "HR Intimation", and triggers TPA integration.
- [ ] Duplicate intimation warning is shown for same member and same admission date submissions.
- [ ] TPA integration failure does not block record creation; a warning is shown to the HR user.
- [ ] Form shows inline validation errors on submit attempt.

---

## 15. Open Questions

- **Question 1:** Should the Date of Admission be allowed to be a future date (e.g., for planned surgical admissions), or is it always restricted to on/before today?
- **Question 2:** Is TPA notification triggered synchronously during form submission, or is it a background/async process?
- **Question 3:** What happens to the claim intimation if no TPA integration exists for the policy type — is it stored as a pending intimation for manual follow-up?
- **Question 4:** Should the HR user receive a confirmation notification (email/in-app) after successful submission?
- **Question 5:** Should the duplicate detection logic be enforced strictly (block submission) or as a soft warning (proceed with confirmation)?
>>>>>>> Stashed changes
