# **Manage Inception / Endorsement Only "Employee data upload handling"**

## 

## **1\. Purpose**

To introduce an additional tracking and control step in the inception / Endorsement flow for cases where “only employee data” is uploaded, and dependents and choices are collected through the employee enrolment portal.

## **2\. Enhancement Overview**

In the **Only Employee Upload** scenario, the **“Create Inception”** step should not be immediately available after upload.  
Instead, the system should introduce an **intermediate step** to monitor enrolment completion before enabling the Create Inception CTA.

---

## **3\. New Step – “Enrolment Completion Tracking”**

### **Step Name: Enrolment Completion Tracking (Applicable only for Employee-Only Upload Case)**

### **Step Position:**

Between “File Upload” and “Create Inception / Endorsement”

### **Objective:**

To ensure all employees complete their enrolment (add dependents and select choices) before policy inception / Endorsement can proceed.

---

## **4\. Functionality Details**

| Functionality | Description |
| :---- | :---- |
| **Trigger Condition** | Triggered automatically when user select “Employee only data” from dropdown. |
| **Screen View** | Displays real-time enrolment progress and restricts **next** step until enrolment closure. |
| **Displayed Metrics** | **Total Employees Uploaded** – Total number of employee records uploaded. **Employees Completed Enrolment** – Number of employees who have completed dependent addition and choice selection. **Enrolment Close Date** – Date configured for completion window. **% Completion** – Auto-calculated \= (Completed / Uploaded) × 100\. |
| **CTA Behavior** | “Next CTA” on Create Inception screen remains **disabled** (greyed out) until enrolment close date is reached. |
| **Post Closure Action** | Once the enrolment closure date passes : System finalizes all enrolment data. Displays final summary (Total Uploaded & Completed). \- **Same as current scenario** Enables “Next “ CTA |
| **Incomplete Enrolments Handling** | Employees who do not complete enrolment before closure are auto-marked with default choices.” |
| **Data Source** | Enrolment Portal (dependent and choice completion flags). \- Enrolment Portal should provides real-time dependent and choice completion flags for each employee, enabling the CRM to track enrolment progress and automatically unlock the next step once all employees have completed their enrolment. |

---

## **5\. UI Behavior**

### **Screen Layout (for Employee Only Upload Case)**

* Header: *“Enrolment Completion Tracking”*  
* Summary Table:

| Metric | Value | Remarks |
| :---- | :---- | :---- |
| Total Employees Uploaded | \[count\] | Pulled from upload file |
| Employees Completed Enrolment | \[count\] | Updated from enrolment portal |
| % Completion | \[calculated\] | Auto-updating until closure |
| Enrolment Close Date | \[date\] | TBD |

*   
  Below the table:  
  * **Status Message (Dynamic):**  
    * **For Inception**  
      * “Enrolment is in progress. Further processes will be enabled after the enrolment closure.”  
    * **For Endorsement**  
      * “Enrolment is in progress. Further processes will be enabled after the enrolment closure.”  
    * *Before closure:* “Next CTA “ on Create Inception / Endorsement screen is disabled and don't allow to next step  
    * *After closure:* “Next CTA enable and allow for next step

---

## **6\. Automation & System Logic**

| Event | System Action |
| :---- | :---- |
| File upload detected as “Employee Only” type | System creates enrolment logins for each employee and activates this new tracking step. |
| Enrolment closure date reached | System freezes enrolment portal, finalizes dependent and choice data. |
| CTA Enablement | Post closure date, enable CTA for next step. |
| Data Update | Real-time sync of completed enrolments from enrolment portal on each enrolment completion |

---

## **7\. Edge Cases & Validations**

| Scenario | Expected Behavior |
| :---- | :---- |
| User tries to create inception before closure / All employees not completed enrolment | “Enrolment period not closed. Please wait until \[closure date\] to proceed.” |
| Enrolment window extended | Admin can update closure date; CTA re-checks condition dynamically. |
| Multiple uploads (same case) | System tracks latest upload batch for completion metrics. |

