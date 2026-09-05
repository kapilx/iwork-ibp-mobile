# **Unified Enrolment Process – PRD**

**Product Requirements Document (PRD)**  
 **Version:** 1.1 (Updated based on final user stories)

---

## **1\. Objective**

The objective of the **Unified Enrolment Process** is to enable employees to enrol into one or more insurance policies through a **single, consolidated enrolment experience**, while continuing to fully support **existing single-policy enrolment behaviour**.

---

## **2\. Scope**

This module applies to **all employee insurance policies** available on the platform and supports:

* ✅ Single policy enrolment (existing behaviour – unchanged)  
* ✅ Multiple policy enrolment via a unified **“Enroll All”** flow  
* ✅ Policy-level and unified-level CTA orchestration  
* ✅ Consolidated enrolment summaries (current & past cycles)

---

## **3\. Enrolment Modes**

### **3.1 Single Policy Enrolment (Existing Behaviour)**

* Users shall be able to enrol into a **single policy independently**  
* The flow, screens, and validations shall remain unchanged  
* Policy-level eligibility, cutoff, and edit rules shall apply  
* Unified enrolment shall **not** be triggered

---

### **3.2 Unified Enrolment (“Enroll All”)**

* Users shall be able to enrol into **multiple policies together**  
* The unified enrolment screen shall display **all policies mapped to the employee**  
* Only **eligible policies** shall be editable and selectable  
* Ineligible policies shall be shown in **read-only mode** with status indicators

---

## **4\. Policy Eligibility Rules**

### **4.1 Eligibility Determination**

Policy eligibility shall be evaluated **independently per policy** based on:

* Enrolment start and end dates  
* Cutoff date and auto-lock configuration
* Employee enrolment status  
* Policy configuration flags
* Mid-year enrollment permissions
* Lock-after-confirmation settings

**Detailed Eligibility Matrix:**

| Condition | Result/State |
|-----------|-------------|
| Date < enrolment start date | Policy is ineligible, read-only, tag: "Enrolment Opens on <Date>" |
| Date > enrolment end date | Policy is ineligible, locked, tag: "Enrolment Closed" |
| Date within enrolment period, not yet enrolled | Policy is eligible, editable, included in submission |
| Date within enrolment period, already enrolled | Policy editability as per configuration |
| Cutoff passed, auto-lock enabled | Policy is read-only, tag: "Enrolment Closed"; but if not enrolled, auto-enrol with default selection |
| Enrolment submitted, auto-lock-after-confirmation | Policy is read-only regardless of cutoff date |
| Mid-year period, mid-year enrollment disabled | Policy CTA disabled, message: "Mid-year enrolment is not allowed for this policy" |

A policy shall be considered **ineligible** if:

* Enrolment period has not started  
* Enrolment period has ended and locking conditions apply  
* Enrolment Period Not ended but (Configured as - Lock Policy immediately after employee confirms enrolment)
* Mid-year enrollment is attempted but not permitted for the policy

---

### **4.2 Handling Ineligible Policies**

* Ineligible policies shall be displayed in the unified enrolment screen  
* Such policies shall be **non-editable**  
* Clear status tags shall be shown

**Status Tags**

* *Enrolment Opens On \<Date\>* – enrolment not started  
* *Enrolment Closed* – enrolment period ended or locked

---

## **5\. Unified-Level CTA Behaviour (Dashboard & My Insurance)**

### **5.1 No Enrolment Started**

**Condition**

* User has not enrolled or saved any enrolment

**Behaviour**

* Display only one CTA: **“Enroll All”**  
* Clicking initiates unified enrolment

---

### **5.2 Enrolment Started but Not Confirmed**

**Condition**

* User has saved enrolment but not submitted

**Behaviour**

* Primary CTA changes to: **“Continue Enrolment”**  
* Resumes unified enrolment from last saved step

---

### **5.3 At Least One Policy Enrolled**

**Condition**

* User has completed enrolment for ≥1 policy

**Behaviour**

* Additional CTA displayed: **“View Past Enrolment Summaries”**  
* Available on Dashboard and My Insurance

---

### **5.4 No New Enrolment Available but Edit Allowed**

**Condition**

* No policies open for new enrolment  
* ≥1 enrolled policy eligible for edit

**Behaviour**

* Primary CTA shown: **“Edit Enrolment”**  
* Opens unified enrolment in edit mode

---

### **5.5 No Enrolment and No Edit Allowed**

**Condition**

* No policies open for enrolment  
* No policies eligible for edit

**Behaviour**

* Primary CTA disabled

---

## **6\. Policy-Level CTA Behaviour**

### **6.1 Enrolled & Eligible for Edit**

* Status Tag: **Enrolled**  
* CTA: **Show Summary**  
* Redirects to enrolment submission screen  
* Editable fields enabled (existing behaviour)

---

### **6.2 Enrolled & Not Eligible for Edit**

* Status Tag: **Enrolled**  
* CTA: **Show Summary**  
* Redirects to **read-only enrolment summary**  
* No edits allowed

---

### **6.3 Not Enrolled & Within Enrolment Period**

* Show enrolment close date  
* CTA: **Enroll Now**  
* Redirects to **single policy enrolment flow**

---

### **6.4 Enrolment Period Not Started**

* Show enrolment open date

* CTA:

  * **Notify** (if email available)

  * TBD (if email unavailable)

---

## **7\. Post-Enrolment Edit Behaviour**

* Edit permissions shall be governed **per policy**  
* Lock precedence order:  
  1. Auto-lock after confirmation  
  2. Auto-lock after cutoff  
  3. Policy-level edit configuration

**Behaviour**

* Editable policies load in edit mode  
* Locked policies load in read-only mode

---

## **8\. Subsequent Eligibility Changes**

* Policies that become eligible later:  
  * Become editable in unified enrolment  
* Previously enrolled editable policies remain editable  
* Locked policies remain locked

---

## 

## **9\. Enrolment Summary Screens**

### **9.1 Unified & Past Summary Behaviour**

* Summary screens always load in **view-only mode**  
* No edit or submission actions allowed

---

### **9.2 Calculation rules and Information Visibility**

* Aggregated calculations shall be displayed as per design  
  * Total Aggrated premium  
  * Company Contribution ( If for any policy, employer contribution visibility is disabled, don't add that calculation in the aggregate company contribution and show the that “ Respective policy’s company contribution is not included )  
  * Employee contribution \- Aggrigated  
* Followings entities to be visible as per each policies as depicted in the design  
  * Sum Insured \- If Configuration allows  
  * Total Premium  
  * Company Contribution \- If Configuration allows  
  * Employee Contribution  
  * Policy Period  
  * Enrolled Date

---

## **10\. Conflicting Configuration Handling (Policy-Level)**

### **10.1 Sum Insured Visibility**

* If enabled → show actual value  
* If disabled → show placeholder (“—”)  
* Applies to:  
  * Policy card  
  * Summary  
  * Confirmation screen

---

### **10.2 Automatic Enrolment Lock After Cutoff Date**

* If enabled → lock after cutoff  
* If disabled → follow edit configuration  
* Applied per policy (not globally)

---

### **10.3 Automatic Lock After Employee Confirmation**

* If enabled → immediate lock post-confirmation  
* Cutoff date becomes irrelevant

---

### **10.4 Employer Contribution Visibility**

* If enabled → show contribution  
* If disabled:  
  * Show placeholder  
  * Exclude from aggregate calculations

---

### **10.5 Enrolment Confirmation & Disclaimer Handling**

* Disclaimers are policy-specific  
* Displayed in **single aggregated step**  
* Submission allowed only after:  
  * All confirmations accepted  
  * All disclaimers acknowledged

---

### **10.7 Mid-Year Enrolment ( TBD)**

* If allowed → enrolment enabled  
* If not allowed:  
  * CTA disabled  
  * Message shown:  
     *“Mid-year enrolment is not allowed for this policy.”*

---

## **11\. Unified Enrolment – Detailed Flow**

### **Functional Requirements**

### **11.1 Unified Enrolment Screen Initialization**

**FR-11.1.1**  
 The system shall load the Unified Enrolment screen when the employee clicks **“Enroll All”** or **“Continue”** from a saved unified enrolment.

**FR-11.1.2**  
 The system shall fetch and display **all insurance policies applicable** to the employee for the current enrolment context (annual or mid-year).

**FR-11.1.3**  
 Employee personal details shall be **pre-populated** from the master employee profile and displayed in a non-editable state unless explicitly configurable.

**FR-11.1.4**  
 Dependent details shall be displayed per policy and shall be **editable only for eligible policies** and as per dependent configuration rules. ( GMC Policies)

**FR-11.1.5**  
 For each policy, the system shall determine eligibility independently and render:

* **Editable mode** for eligible policies  
* **View-only mode** for ineligible policies

**FR-11.1.6**  
 Ineligible policies shall display:

* A status tag (e.g., *Enrolment Closed*, *Enrolment Opens On \<Date\>*)  
* A descriptive message explaining the restriction

---

### **11.2 Policy, Plan, and Option Rendering**

**FR-11.2.1**  
 The system shall render policies in a stacked list format on the unified enrolment screen.

**FR-11.2.2**  
 The **first plan of the first listed eligible policy** shall be expanded by default on initial load.

**FR-11.2.3**  
 All other policies and plans shall be collapsed by default.

**FR-11.2.4**  
 The employee shall be able to expand or collapse:

* Any eligible policy  
* Any plan within an eligible policy

**FR-11.2.5**  
 For policies with multiple plans and selectable options:

* The system shall auto-select **one default option per plan**  
* Default selections shall be system-configured

**FR-11.2.6**  
 Ineligible policies shall not allow plan or option expansion or modification.

---

### **11.3 Policy-Level and Plan-Level Information Display**

**FR-11.3.1**  
 At the policy level, the system shall display:

* Sum Insured  
* Total Premium  
* Company Contribution  
* Employer contribution  
* Policy Period  
* Status based CTAs  
  * Edit  
  * Notify  
  * Lock icon

**FR-10.3.2**  
 Sum Insured values shall be displayed **only if Sum Insured Visibility \= Yes** for that policy.

**FR-10.3.3**  
 If Sum Insured Visibility \= No, the system shall display a placeholder (e.g., `--`) instead of actual values.

**FR-10.3.4**  
 Total premium displayed at policy level shall be calculated based on:

* Selected plan  
* Selected options  
* Selected dependents

**FR-10.3.5**  
 Employer contribution shall be:

* Displayed only if Employer Contribution Visibility \= Yes  
* Hidden and excluded from employee-facing aggregates if visibility \= No

---

### **10.4 Default Selection Handling**

**FR-10.4.1**  
 If an employee does not expand a policy or plan, the system shall:

* Retain all default-selected plans and options  
* Consider them as final selections upon enrolment

**FR-10.4.2**  
 Default-selected plan and option summaries shall be visible in the collapsed policy view.

---

### **10.5 Dynamic Premium Summary Widget**

**FR-10.5.1**  
 The system shall display a **side premium summary widget** on the unified enrolment screen.

**FR-10.5.2**  
 The premium summary widget shall dynamically update when:

* Plans are changed  
* Options are modified  
* Dependents are added or removed  
* Any premium-impacting input changes

**FR-10.5.3**  
 The widget shall reflect consolidated premiums across all **currently selected and eligible policies**.

**FR-10.5.4**  
 Premiums for policies whose enrolment period has not started shall not be included in aggregates.

---

### **10.6 Save and Exit Functionality**

**FR-10.6.1**  
 The system shall provide a **“Save and Exit”** CTA on the unified enrolment screen.

**FR-10.6.2**  
 On Save and Exit:

* All current selections shall be persisted at policy level  
* Data shall be stored as a draft enrolment state

**FR-10.6.3**  
 Saved enrolment data shall be retrievable from:

* Unified enrolment flow  
* Single policy enrolment flow (policy-specific)

---

### **10.7 Resume Enrolment via Continue CTA**

**FR-10.7.1**  
 If the employee resumes via **Continue** from unified enrolment:

* All previously selected policies and choices shall be preloaded

**FR-10.7.2**  
 If the employee resumes via **Continue** from a single policy:

* Only that policy shall be loaded  
* Previously saved selections for that policy shall be prefilled

---

### **10.8 Enrolment Summary Navigation**

**FR-10.8.1**  
 On clicking **Continue** from the unified enrolment screen, the system shall navigate to the **Enrolment Summary screen**.

**FR-10.8.2**  
 The summary screen shall display:

* All selected policies  
* Selected plans and options  
* Consolidated premium breakdowns

**FR-10.8.3**  
 Policy-level visibility rules (Sum Insured, Employer Contribution) shall continue to apply on the summary screen.

---

### **10.9 Back Navigation and Final Confirmation**

**FR-10.9.1**  
 On clicking **Back** from the summary screen:

* The system shall return the employee to the unified enrolment screen  
* All selections shall be retained

**FR-10.9.2**  
 On clicking **Confirm**:

* The system shall validate all selections  
* Enforce all policy-level constraints and disclaimers  
* Submit enrolment for all selected policies

**FR-10.9.3**  
 Post-confirmation, policies shall be locked based on:

* Cutoff date configuration  
* Immediate lock after confirmation configuration

---

### **11\. Separate Dependent Handling for Current and Upcoming GMC Policies**

**FR-11.1**  
 The system shall treat each GMC policy as an independent entity, even if both belong to the same employee.

**FR-11.2**  
 Each GMC policy shall maintain:

* Its own dependent list  
* Independent eligibility validation  
* Separate submission records

**FR-11.3**  
 Dependents added or modified under one GMC policy shall not appear under another GMC policy.

**FR-11.4**  
 Dependent data shall be saved and submitted strictly against the respective GMC policy.

---

## **12. Policy Configuration & Constraints**

### **12.1 Policy-Level Configuration Fields**

The following configuration options shall be supported per policy:

| Field | Visibility/Behavior |
|-------|---------------------|
| **Sum Insured Visibility** | Show actual value if enabled, else show "—" placeholder |
| **Employer Contribution Visibility** | Show actual value if enabled, else show "—" and exclude from aggregated calculations |
| **Enrollment Confirmation Required** | If enabled: disclaimer is mandatory before submission; If disabled: disclaimer is not mandatory |
| **Lock Policy Behavior** | **Option 1 - Immediately Lock After Confirmation:** Policy becomes locked immediately after employee confirms enrollment, no further edits allowed regardless of cutoff date<br>**Option 2 - Lock After Cutoff Date:** Policy remains editable until cutoff date is exceeded, then becomes locked automatically |
| **Mid-Year Enrollment Permission** | If allowed: enable enrollment actions; If disabled: disable CTA and show explanatory message |
| **Disclaimer Requirements** | All policy-specific disclaimers displayed in single step, mapped to respective policies; acceptance required for submission |
| **Submission Inclusion** | Only eligible/editable policies included in submission and premium aggregates |

### **12.2 Enhanced Eligibility Matrix**

| Condition | Result/State |
|-----------|-------------|
| Date < enrolment start date | Policy is ineligible, read-only, tag: "Enrolment Opens on <Date>" |
| Date > enrolment end date | Policy is ineligible, locked, tag: "Enrolment Closed" |
| Date within enrolment period, not yet enrolled | Policy is eligible, editable, included in submission |
| Date within enrolment period, already enrolled | Policy editability as per configuration |
| Cutoff passed, auto-lock enabled | Policy is read-only, tag: "Enrolment Closed"; but if not enrolled, auto-enrol with default selection |
| Enrolment submitted, auto-lock-after-confirmation | Policy is read-only regardless of cutoff date |
| Mid-year period, mid-year enrollment disabled | Policy CTA disabled, message: "Mid-year enrolment is not allowed for this policy" |

### **12.3 Auto-Enrollment Rules**

* If enrollment cutoff date approaches and employee has not submitted enrollment
* System shall automatically enroll employee with default policy choices
* Default selections shall be applied and marked as system-generated
* Employee shall be notified of auto-enrollment action

---

## **13. Unified Enrollment Flow - Detailed Steps**

### **13.1 Flow Navigation & Behavior**

| Step | Behavior/Validation |
|------|---------------------|
| **Landing Screen** | All policies shown, employee details prefilled, dependents editable per policy |
| **Plan/Option Selection** | First plan of first policy expanded, one option per plan selected by default, others collapsed |
| **Policy Info Visibility** | Show/hide fields as per configuration (sum insured, premium, employer contribution) |
| **Default Selection Handling** | If policy not expanded, default selections are applied and visible to user |
| **Dynamic Premium Summary** | Updates in real-time as selections/dependents change across all policies |
| **Save and Exit** | Saves all current selections, accessible via Continue CTA |
| **Resume via Continue** | Preloads previous selections in unified or single policy flow |
| **Summary Screen** | Shows consolidated summary of all selected policies with totals |
| **Final Navigation** | Back button retains selections, Confirm validates and locks as per policy configuration |
| **Auto-Enrollment Trigger** | If enrollment not submitted and cutoff date approached, system enrolls with default choices |

### **13.2 Save and Resume Functionality**

**Save Draft Behavior:**
* All current selections across multiple policies shall be saved as draft
* Draft shall be accessible from both unified and individual policy flows
* System shall maintain separate draft states per employee

**Resume Behavior:**
* Continue from unified enrollment: All previously selected policies and choices preloaded
* Continue from individual policy: Only that specific policy loaded with previous selections
* Cross-device consistency: Latest saved draft state available across all devices

---

## **14. Disclaimer Management & Confirmation**

### **14.1 Disclaimer Consolidation**

* All policy-specific disclaimers shall be displayed in a single consolidated step
* Each disclaimer shall be clearly mapped to its respective policy
* Employee must accept all applicable disclaimers before submission is enabled
* Submission shall be blocked until all required confirmations are accepted

### **14.2 Confirmation Requirements**

**Policy-Level Configuration:**
* Policies with "Enrollment Confirmation Required = Enabled": Disclaimer acceptance is mandatory
* Policies with "Enrollment Confirmation Required = Disabled": Disclaimer acceptance is not mandatory
* Mixed configurations supported within single unified enrollment session

### **14.3 Final Confirmation Process**

* Back navigation retains all selections without loss
* Confirm action validates all policies and applies locking per configuration
* Post-confirmation, policies are locked based on:
  - Immediate lock configuration (locked immediately)
  - Cutoff date configuration (locked when date exceeded)
* Success confirmation displays policy-specific lock status to employee

---

## **15. Error Handling & Edge Cases**

### **15.1 System Failure Management**

**Save/Submission Failures:**
* System shall display appropriate error message indicating failure
* No partial or corrupt data shall be saved during failures
* Employee shall be able to retry the failed action
* Draft state shall be preserved during system failures

### **15.2 Session Management**

**Session Expiry:**
* Unauthenticated or expired session access redirects to login
* Message displayed: "Your session has expired. Please log in again."
* Draft data preserved across session renewals

**Concurrent Sessions:**
* System shall warn employee if unsaved changes exist in another session
* Only latest saved or submitted data shall be retained
* Conflict resolution prioritizes most recent valid submission

### **15.3 Data Consistency**

**Cross-Device Synchronization:**
* Latest saved draft state accessible across all devices
* Real-time synchronization of enrollment selections
* Automatic conflict resolution for simultaneous edits

---

## **16. Premium Calculation & Summary**

### **16.1 Dynamic Premium Widget**

**Real-Time Updates:**
* Side premium summary widget shall update dynamically as employee makes selections
* Widget reflects consolidated premiums across all currently selected eligible policies
* Premium calculations exclude policies whose enrollment period has not started
* Employer contribution visibility follows policy-level configuration

### **16.2 Aggregate Calculations**

**Inclusion Rules:**
* Only eligible/editable policies included in submission and aggregates
* Policies with employer contribution visibility disabled: contributions excluded from aggregate totals
* Note displayed indicating which policies are excluded from calculations
* Separate totals shown for employee premium and employer contribution (where visible)

### **16.3 Premium Summary Display**

**Employee Premium:**
* Total across all selected policies
* Breakdown by policy (where configured for visibility)
* Real-time updates during selection process

**Employer Contribution:**
* Displayed only for policies with contribution visibility enabled
* Excluded from totals for policies with visibility disabled
* Clear indication of excluded policies in summary