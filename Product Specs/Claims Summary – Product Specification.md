# IIRM-7613: Claims Summary – Product Specification

## **1\. Purpose**

The purpose of the **Claims Summary module** is to provide employees with clear, accurate, and real-time visibility of their insurance claim information within the Employee Enrolment Portal.  
This module enables:

* Summary of policy-level claim data on the dashboard  
* Detailed employee-level claim tracking (claim listing page)  
* Seamless sync of claim data uploaded via CRM

**Phase 1 Scope:**  
✅ Claims Summary on Dashboard  
✅ Claims Listing & Tracking Section

---

## **2\. Existing Flow (IIRM Portal Side – Already Available)**

### **Step 1: Claim Data Received**

Claim data is periodically shared in an Excel file containing details of all claims for all employees covered under a policy.

### **Step 2: Claim Upload in IIRM Portal**

* User uploads the received file into the **IIRM → Claims Upload** section (already implemented).  
* The IIRM portal stores all uploaded claims and links them to the corresponding policy and employees.  
* These uploaded records are internally tracked under the **“Track Claims”** section of the IIRM portal.

---

## **3\. New Functionality to Be Built (Employee Enrolment Portal)**

### **Feature Name: Employee Claim Tracking (in IBP Portal)**

When the user clicks on **“Intimation and Tracking”**, the following actions will be available:

* View Claim Track  
* Intimate Claim

In the current phase, **only the “Track Claim” functionality** will be implemented.  
The remaining features will be introduced in subsequent phases.

### **Purpose**

To display claim records (uploaded via IIRM Portal) that are relevant to the logged-in employee and their dependents.

---

## **4\. Functional Workflow**

### **Data Flow**

* Claims uploaded in the IIRM portal are automatically synced to the Enrolment Portal.  
* The sync process filters and maps claim data based on:  
  * Employee ID  
  * Policy Number  
  * Dependent Name  
* When an employee logs into the Enrolment Portal → **Track Claims**, the system fetches only their own and dependents’ claim records from the synced dataset.

---

### **Summary Listing and Mapping**

**Header:** Track Claim

| IIRM Field | Enrolment Portal Field | Notes |
| ----- | ----- | ----- |
| Claim No | Claim No | Direct mapping |
| Employee ID | Employee ID | Direct mapping |
| Member / Dependent Name | Name | Direct mapping (for dependent linkage) |
| Claim Type | Claim Type | Direct mapping |
| Claim Amount | Claim Amount | Direct mapping |
| Claim Status | Claim Status | Direct mapping |
| Claim Received Date | Received Date | Direct mapping |

---

### **Filters and Features**

* Search by **Claim No**, **Dependent Name**, or **Status**  
* Pagination (default **10 records** per page)  
* Sorting by **Claim Date** or **Status**  
* Note/Disclaimer displayed at the top (as per UI):

Claim will be processed and settled within 10 days from complete receipt of documents. TAT may exceed in cases such as “Under Investigation”, “IR Pending”, “Insurer Error”, “UTR not received”, or “Refer to Insurer Others.”

---

## **4\. Dashboard Claims Summary Widget**

### **4.1.1 Purpose**

Display policy-level claim statistics relevant to the logged-in employee and their dependents.

---

### **4.1.2 UI Elements**

#### **Claim Status Summary Bar**

| Item | Source System | Source Logic |
| ----- | ----- | ----- |
| **Total Claims** | IIRM Portal (Claims Upload Data) | Count of all claims synced for the employee \+ dependents |
| **Approved** | IIRM Portal | Count of claims where Claim Status \= "Approved" |
| **Pending** | IIRM Portal | Count of claims where Claim Status \= "Pending" / "Processing" |
| **Action Required** | IIRM Portal | TBD |

#### **Policy Information**

| Item | Source System | Source Field |
| ----- | ----- | ----- |
| **Policy Number** | Policy Master (IIRM Portal) → Synced to Enrolment Portal | Policy Number |
| **Policy Expiry Date** | Policy Master (IIRM Portal) | Policy End Date |
| **Total Sum Insured (Policy Level)** | Policy Master | Total Sum Insured / Sum Insured |
| **Available Amount** | Derived (Enrolment Portal Calculation) | Total Sum Insured − Sum of Approved Claims |
| **Total Claimed Amount** | IIRM Portal (Claims data) | Sum(Claim Amount for all claims of employee \+ dependents) |

#### **Family Member Claims Summary**

| Item | Source System | Source Field / Logic |
| ----- | ----- | ----- |
| **Dependent Names** | Employee-Dependent Master | Dependent Name |
| **Claim Count per Dependent** | IIRM Claims Data | Count of claims where DependentName matches |
| **Claim Amount per Dependent** | IIRM Claims Data | Sum of Claim Amount for that dependent |

#### **Recent Claims List**

For each claim:

| Field | Source System | Source Field |
| ----- | ----- | ----- |
| **Name (Self / Dependent)** | IIRM Claims Data | Member Name / Dependent Name |
| **Claim Requested Date** | IIRM Claims Data | Claim Received Date |
| **Claim Amount** | IIRM Claims Data | Claim Amount |
| **Documents Count** |  | TBD |
| **Current Status** | IIRM Claims Data | Claim Status |
| **Claim Reference Number** | IIRM Claims Data | Claim No |

---

## **5\. Data Integration & Synchronization**

| Parameter | Description |
| ----- | ----- |
| Source System | iWork Portal |
| Destination System | Employee Enrolment Portal (IBP) |
| Sync Trigger | On-demand job |
| Identifiers Used for Mapping | Policy Number, Employee ID, Dependent Name |

---

## **6\. System Behavior & Validations**

* Only claims **uploaded in the IIRM portal** will appear in the Enrolment Portal.  
* If no claims exist for the employee, the system displays:  
  **“No claim records found.”**  
* Each claim entry must be linked to a valid employee ID in the policy master.  
* Claims without matching employee records are excluded from display.  
* Employees will **only** see claims where:  
  * Their Employee ID matches, or  
  * Dependent Name matches their registered dependents.

# **User Stories:**

# **User Stories & Acceptance Criteria – Claims Summary Module**

---

# **Epic: Claims Summary & Tracking for Employees**

As an employee,  
I want to view and track my insurance claims  
So that I can easily monitor claim status, amounts, and dependent-wise details.

---

# **User Story 1: Syncing Claims Data from IIRM Portal**

### **User Story**

As a system,  
I want to sync claim data uploaded in the IIRM portal to the Employee Enrolment Portal  
So that employees always see the latest claim information.

### **Acceptance Criteria**

✅ AC1: System must fetch claim records from the IIRM Portal based on:

* Employee ID  
* Policy Number  
* Dependent Name

✅ AC2: Only the claims that match the logged-in employee or their dependents should be synced.

✅ AC3: Claims with no matching Employee ID or Dependent Name must be excluded.

✅ AC4: Sync must run using an **on-demand job trigger**.

✅ AC5: Synced records should be stored in the Enrolment Portal for display.

✅ AC6: If sync fails, system must log an error for review.

---

# **User Story 2: View Claim Tracking Page**

### **User Story**

As an employee,  
I want to view all my claims and my dependents’ claims in the *Track Claims* page  
So that I can monitor the progress of each claim.

### **Acceptance Criteria**

✅ AC1: On clicking **Intimation & Tracking → Track Claim**, the system must display the claims listing table.

✅ AC2: The listing must show the following fields:

| IIRM Field | Enrolment Portal Field |
| ----- | ----- |
| Claim No | Claim No |
| Employee ID | Employee ID |
| Member / Dependent Name | Name |
| Claim Type | Claim Type |
| Claim Amount | Claim Amount |
| Claim Status | Claim Status |
| Claim Received Date | Received Date |

✅ AC3: The system must show claims only for:

* Logged-in employee  
* Their registered dependents

✅ AC4: Table must support:

* Search by Claim No, Name, Status  
* Sorting by Date or Status  
* Pagination (10 records per page)

✅ AC5: Display disclaimer at top:  
“Claim will be processed and settled within 10 days ...”

✅ AC6: If no claim records are available, show:  
**“No claim records found.”**

---

# **User Story 3: Claims Summary Widget on Dashboard**

### **User Story**

As an employee,  
I want to see a summary of my claims on the dashboard  
So that I can quickly understand my claim count, status, and available sum insured.

### **Acceptance Criteria**

✅ AC1: The dashboard must display the summary bar with:

* Total Claims  
* Approved  
* Pending  
* Action Required

✅ AC2: Summary must be calculated using synced IIRM claims data.

✅ AC3: Policy Information must show:

* Policy Number  
* Policy Expiry Date  
* Total Sum Insured  
* Available Amount (calculated: Total SI – Approved Claims)

✅ AC4: Claim amount should be summed correctly for employee \+ dependents.

✅ AC5: Only claims related to:

* employee  
* dependents  
  should be included.

---

# **User Story 4: Dependent-wise Claim Summary**

### **User Story**

As an employee,  
I want to see a dependent-wise breakdown of claims  
So that I know how much each family member has claimed.

### **Acceptance Criteria**

✅ AC1: System must fetch dependent names from Employee–Dependent Master.

✅ AC2: For each dependent, system shows:

* Name  
* Number of claims  
* Total claim amount

✅ AC3: Dependent claim mapping must use **Dependent Name** from IIRM claim data.

---

# **User Story 5: Recent Claims List on Dashboard**

### **User Story**

As an employee,  
I want to see the most recent claim filed  
So that I can quickly track the latest activity.

### **Acceptance Criteria**

✅ AC1: Recent Claims widget should list each claim with:

* Name (Self/Dependent)  
* Claim Requested Date  
* Claim Amount  
* Claim Status  
* Claim Reference Number

✅ AC2: Claims must be sorted by **Claim Received Date (DESC)**.

✅ AC3: Only the most recent 3–5 claims (configurable) must be displayed.

---

# **User Story 6: UI Behaviour**

### **User Story**

As a user,  
I want the system to show clear messaging and consistent UI behaviours  
So that I can easily understand the claim status and navigation.

### **Acceptance Criteria**

✅ AC1: "Track Claim" header must be displayed.  
✅ AC2: Status labels must match IIRM portal values.  
✅ AC3: All dates must be shown in DD-MM-YYYY format.  
✅ AC4: Amounts must show ₹ symbol (or system-configured currency).  
✅ AC5: Loading indicators must appear while fetching claim data.

---

# **User Story 7: Error Handling**

### **User Story**

As a user,  
I want the system to handle missing or invalid data gracefully  
So that I don’t see incorrect or broken screens.

### **Acceptance Criteria**

✅ AC1: If a claim has missing mandatory fields (Claim No / Status / Date), show:  
**“Incomplete claim record – please contact admin.”**

✅ AC2: If the sync job fails, dashboard should show:  
**“Claim data is temporarily unavailable.”**

✅ AC3: Claims list must not display duplicate records.

