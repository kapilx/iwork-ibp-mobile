

# **Product Requirements Document (PRD)**

## **Unified Enrollment Process for Employee Insurance Policies**

---

## **1\. Overview**

Employees currently have three types of insurance policies under the corporate benefits program:

* **GMC** – Group Medical Coverage (includes dependents & parental plan options)  
* **GTL** – Group Term Life (no dependents)  
* **GPA** – Group Personal Accident (no dependents)

Today, employees must enroll **separately** for each policy. Once enrolled, editing is not allowed for that specific policy, but the employee may still enroll in other policies.

The goal is to provide a **unified, streamlined enrollment experience** where users can enroll in multiple/all policies at once and review a consolidated premium summary.

---

## **2\. Problem Statement**

The current enrollment flow forces employees to complete three separate processes, leading to:

* Redundant navigation  
* Multiple confirmations  
* Repetitive data review  
* Fragmented understanding of total contribution across policies

A unified flow will improve user efficiency, reduce errors, and give better visibility into combined benefits and financial impact.

---

## **3\. Proposed Experience**

The system should support **two configuration options** (TBD), depending on business decision:

### **Option 1 – User Chooses “Enroll All” or “Enroll Separately”**

After clicking **Enroll Now**, the user lands on **My Insurance** screen and is asked:

*Do you want to enroll in all policies together or enroll individually?*

Options:

* “Enroll for all policies”  
* “Enroll separately for each policy”

### **Option 2 – Only Unified Enrollment (Recommended)**

After clicking **Enroll Now**, the user lands on **My Insurance** screen and can initiate **one unified enrollment flow**.  
 No option to enroll separately.

---

## **4\. Revised Enrollment Flow (Unified)**

### **Step 1: Employee Logs In**

Employee authenticates and reaches dashboard.

### **Step 2: Clicks “Enroll Now”**

User lands on **My Insurance** screen.

### **Step 3: Enrollment Start (Based on Option 1 or 2\)**

* User enters a **single unified enrollment flow**.  
* All available policies (GMC, GTL, GPA) appear together.

### **Step 4: Enrollment Form – All Policies**

The enrollment screen displays:

#### **GMC Section**

* Employee details (pre-populated)  
* Dependent addition (spouse, children, parents – as per plan configured)  
* Parental plan selection (if eligible)  
* Plan selection (coverage tiers)

#### **GTL Section**

* Employee details  
* Plan/coverage selection  
* No dependents

#### **GPA Section**

* Employee details  
* Plan/coverage selection  
* No dependents

User can complete all policies in one form.

### **Step 5: Consolidated Summary Screen**

After clicking **Submit**, show a unified summary:

* Total Premium (all policies combined)  
* Company Contribution (combined)  
* Employee Contribution (combined)  
* Policy-wise breakdown sections:  
  * GMC Breakdown  
  * GTL Breakdown  
  * GPA Breakdown

### **Step 6: Final Confirmation**

User reviews the consolidated summary and clicks **Confirm Enrollment**.

### **Step 7: Post-Submission View**

The **Enrollment Summary View Page** should always display:

* All enrolled policies together  
* Their individual and combined contributions  
* Coverage selections  
* Dependent list (only for GMC)

---

## **5\. Functional Requirements**

### **5.1 Enrollment Trigger**

* Employee can initiate enrollment only once for the cycle.  
* If enrollment is partially completed (for any policy), editing is not permitted unless the window is open for changes.

### **5.2 Unified Form Requirements**

* Display all policy sections in a single page/flow.  
* Show/Hide dependent section based on policy type.  
* Ensure validations per policy remain intact.

### **5.3 Summary Requirements**

* Must combine:  
  * Premiums  
  * Company contribution  
  * Employee contribution  
* Show itemized breakdown per policy.  
* All calculations must be accurate and reflect plan rules.

### **5.4 Confirmation Rules**

* Enrollment should be confirmed **once** for all policies.  
* Once confirmed: Enrollment status reflects "Completed" for all policies enrolled.  
* Show summary screen should be combined only one

### **5.5 Post-Enrollment View**

* Enrollment details page should show:  
  * All enrolled policies together  
  * GMC dependents  
  * Chosen plans  
  * Premium \+ contribution summary

# **User Stories & Acceptance Criteria (AC)**

### ***(For Unified Insurance Enrollment – GMC, GTL, GPA)***

---

# **1\. User Story: Start Enrollment**

### **Story**

As an employee, I want to start the enrollment process from the **My Insurance** screen so that I can initiate enrollment for all my policies.

### **Acceptance Criteria**

* **AC1:** When the user clicks **Enroll Now**, they should land on the **My Insurance** screen.  
* **AC2:** Based on configuration:  
  * Option 1 → User should see:  
    * “Enroll All Policies”  
    * “Enroll Individually”  
  * Option 2 → User should see only:  
    * “Enroll for All Policies”  
* **AC3:** The system must not initiate partial enrollment unless configured under Option 1\.  
* **AC4:** User cannot bypass the “My Insurance” screen to directly access any policy-specific enrollment.

---

# **2\. User Story: Unified Enrollment Form**

### **Story**

As an employee, I want to complete enrollment for all eligible policies (GMC, GTL, GPA) in a single flow so that I don’t have to repeat steps multiple times.

### **Acceptance Criteria**

* **AC1:** The unified enrollment screen must display **all policies for which the user is eligible**.  
* **AC2:** For **GMC**, the system should display:  
  * Dependent details section  
  * Parental plan option  
  * GMC plan tiers  
* **AC3:** For **GTL & GPA**, the system should show only:  
  * Employee details  
  * Plan/coverage options  
* **AC4:** Dependent details section must appear **only for GMC**.  
* **AC5:** The user must be able to add/edit/delete dependents (only within GMC).  
* **AC6:** All mandatory fields must be validated before submission.  
* **AC7:** The system should save selected plan choices for all three policies simultaneously.

---

# **3\. User Story: Premium & Contribution Calculation**

### **Story**

As an employee, I want to see combined premium and contribution amounts for all selected policies so that I understand the total cost.

### **Acceptance Criteria**

* **AC1:** System must calculate premium for each policy independently.  
* **AC2:** System must calculate:  
  * Total Premium (GMC \+ GTL \+ GPA)  
  * Total Company Contribution  
  * Total Employee Contribution  
* **AC3:** Summary screen must display both **combined** and **policy-wise** breakdowns.  
* **AC4:** Premium values must update instantly when user changes plan options or dependents (GMC).  
* **AC5:** Backend calculations must be accurate and match existing premium rules.

---

# **4\. User Story: Review & Confirm Enrollment**

### **Story**

As an employee, I want to review a consolidated summary before submitting so that I can confirm everything is correct.

### **Acceptance Criteria**

* **AC1:** After clicking “Submit”, the system must open the **Consolidated Enrollment Summary Screen**.  
* **AC2:** The summary page must show:  
  * GMC Summary (dependents, coverage, premium, contribution)  
  * GTL Summary  
  * GPA Summary  
  * Total combined contributions  
* **AC3:** User must see a “Confirm Enrollment” button on the summary page.  
* **AC4:** User must not be able to confirm unless all mandatory fields across all policies are complete.  
* **AC5:** Once confirmed, enrollment cannot be edited.

---

# **5\. User Story: Post-Enrollment View**

### **Story**

As an employee, I want to view all my enrolled policies together after submission so that I can easily review what I enrolled for.

### **Acceptance Criteria**

* **AC1:** After final confirmation, user should be redirected to the **Enrollment View Screen**.  
* **AC2:** The view screen must show:  
  * GMC \+ Dependents  
  * GTL  
  * GPA  
  * Premium and contribution breakdown  
  * Total combined contribution  
* **AC3:** Editing should be disabled for all policies after confirmation.  
* **AC4:** Each policy should clearly show a status such as **“Enrolled”**.  
* **AC5:** Dependents (GMC) must be visible exactly as added.

---

# **6\. User Story: Prevent Partial Enrollment**

### **Story**

As an employee, I want to ensure that if I cancel during the unified flow, no policy is partially enrolled so that I don’t get stuck with incomplete enrollment.

### **Acceptance Criteria**

* **AC1:** Enrollment must only be saved when user clicks **Confirm Enrollment**.  
* **AC2:** If the user exits mid-flow, the system must not save any policy state.  
* **AC3:** No policy enrollment status should show as completed until final confirmation is done.

---

# **7\. User Story: Administration Configurations**

### **Story**

As an admin, I want to control whether users can enroll separately or only through unified flow.

### **Acceptance Criteria**

* **AC1:** Admin must be able to configure:  
  * Option 1 → Allow both “Enroll All” and “Enroll Individually”  
  * Option 2 → Allow only “Enroll All”  
* **AC2:** The front-end must dynamically reflect available options based on admin settings.  
* **AC3:** Summary calculations must remain consistent regardless of configuration.

---

# **8\. User Story: Validation & Errors**

### **Story**

As an employee, I want clear validation and error messages so that I can fix missing details quickly.

### **Acceptance Criteria**

* **AC1:** If a required field is missing, user must see an inline error.  
* **AC2:** GMC dependent-related validations must trigger only within GMC.  
* **AC3:** If premium calculation fails due to API issues, show fallback message without blocking form completion.  
* **AC4:** “Confirm Enrollment” must remain disabled until all errors are resolved.

---

# **9\. User Story: Accessibility & Usability**

### **Story**

As a user, I want a seamless experience so that the enrollment is easy and intuitive.

### **Acceptance Criteria**

* **AC1:** User should be able to scroll between policies easily (accordion/tab design).  
* **AC2:** All policy sections must remain editable until “Confirm Enrollment” is clicked.  
* **AC3:** Mobile-responsive layout must support unified enrollment flow.

---

## **\*\*\*. Open Questions / TBD**

1. Should Option 1 (choice-based) or Option 2 (only unified) be implemented?  
2. Should system allow future partial edits (if design permits) before enrollment window closes?  
3. Should there be a save-as-draft option?  
4. How will back-end APIs return premiums for multiple policies simultaneously?

