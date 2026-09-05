## **Module:**

CRM Policy Details → Portal Configuration (iWork, admin-side)

> **Note:** This is the CRM/admin-side half of ticket IIRM-7589. The employee-facing "Hospital Network" viewing/search feature (Employee Enrolment Portal → Dashboard → Hospital Network) has moved to `docs/IIRM-773_Enrolment-Journey/IIRM-7589_IBP Hospital Mgmt/Product Specs/`. The full-stack Technical Specs (shared backend/DB serving both flows) remain in this folder's `Technical Specs/`.

---

## **Portal Configuration – Hospital Network Setup**

### **Overview**

Each Policy record in CRM will include a **“Portal Configuration”** CTA in Policy *Details* screen.  
When a user clicks this CTA, the system will open the **Portal Configuration Landing Page**, which will contain multiple configuration tabs for the Employee Enrolment Portal setup.


### **Landing Page – Summary Screen**

* Upon clicking the “Portal Configuration” CTA, users will land on the **Summary Screen**.  
* For now, this screen will be non-functional (work in progress).  
* It will display the following placeholder message:  
  “Summary view under development – details will be available once all tabs are implemented.”


### **Tab Structure under Portal Configuration**

The **Portal Configuration** section will contain **separate tabs** for each configurable attribute related to the policy.  
Examples include:

* Summary  
* Network Hospital Upload  
* FAQ Upload  
* Claim Information and tracking
* TPA Cards
* Documents
* Policy Feature
* Enrolment Status
* Support Request


For this phase, **two tabs** will be implemented:

1. **Network Hospital Upload**  
2. **FAQ**



### **Network Hospital Upload Tab**

---

#### **4. Save CTA**

**Purpose:**
Allow users to save all changes and trigger the sync to the Enrolment Portal.

**Features:**
* A **“Save”** button (CTA) should be available on the configuration screen.
* The Save button should be enabled only after all required activities (such as uploading, editing, or configuring data) are completed and all validations pass.
* On clicking **Save**, all details should be saved in the system and immediately trigger the sync so that the latest data is visible on the Enrolment Portal.
* Show a confirmation message: “Configuration saved and changes are now visible on the Enrolment Portal.”

---

#### **1\. Upload Functionality**

**Purpose:**  
Allows users to upload Network Hospital data through File.

**Features:**

* Upload supported via a **standard downloadable template**.  
* A **“Download Template”** link will be provided to guide users on the required format.

**Template Columns:**

| Column Name | Description |
| ----- | ----- |
| Policy ID | Auto-linked or uploaded per policy (must be GMC) |
| Hospital Name | Full hospital name |
| State / UT | State or Union Territory name |
| City / Location | City or locality name |
| Address with Pincode | Full address of the hospital |
| Hospital Category | Network Hospital / Excluded Hospital |

**Note:** Uploads for GTL or GPA policies are not allowed. System should validate and prevent upload for these policy types.

**Preview**
Once click on upload CTA, show preview screen, and show number of file pass validation and number of fields fail validation and show the error file and correct before upload ( Please follow design)

**Upload Rules:**

* Multiple uploads allowed per policy.  
* Each new upload will **update or replace** existing hospital data.  
* **Duplicate entries** (same Policy ID \+ Hospital Name \+ Address \+ Pin Code) are not allowed.  
* System will validate **mandatory fields** and **pin code format** before saving.  
* On successful upload, system displays:  
  “Hospital data uploaded successfully and synced with the Enrolment Portal.”  
* If validation or duplication errors occur, descriptive error messages will be shown and the system will prevent saving.  
* All hospitals listed under the **Network Hospital** column will be added to the **Network Hospital list**, and those listed under the **Excluded Hospital** column will be added to the **Excluded Hospital list**.

**Duplicate Hospital Handling**

- The system must check for duplicate hospital records during upload and manual entry.
- Duplicate identification is based on the combination: **Policy ID + Hospital Name + Address + Pin Code**.


- If a duplicate already exists in the CRM database for the same policy, the record will be flagged or skipped according to the agreed upload handling logic (e.g., skip, flag for review, or update existing).
- All duplicate checks must be case-insensitive and ignore leading/trailing whitespace.

- Clear error messages are shown for duplicates in the upload file.

**Delete Option**
- When one or more hospitals are selected and the user clicks the Delete CTA:
- The system will prompt the user with a confirmation asking whether the deleted hospital(s) should be added to the Excluded Hospital list.
- If the user selects "Yes" → The selected hospital(s) will be removed from the current list and added to the Excluded Hospital list.
- If the user selects "No" → The selected hospital(s) will be removed from the current list but will not be added to the Excluded Hospital list.


---

#### **2\. Transaction History Section**

A **Transaction History Table** will be displayed above the list of hospitals, showing all past uploads for the selected policy.


**Columns:**

| Column Name | Description |
| ----- | ----- |
| File Name | Name of the uploaded file |
| No. of Network Hospitals | Count of network hospitals in the upload |
| No. of Excluded Hospitals | Count of excluded hospitals in the upload |
| Uploaded By | User who performed the upload |
| Upload Date | Date and time of upload |
| Download | Option to download the original uploaded file |
| Error File | Download link for error file generated during upload validation (if any) |
**Purpose:**  
This section allows users to **track upload activity** and **audit all hospital data uploads** over time.

---

#### **3\. Hospital List View**

Below the Transaction History, the system will display a **list of uploaded Network Hospitals**.

**Features:**

* **Search and Filter Options:**  
  * Keyword Search (by Hospital Name, Address, )  
  * Filters  
    * State and City  
    * State / Union Territory  
    * City / Location  
    * Pin Code  
* **Table Columns:**  
  * Hospital Name  
  * Address  
  * City / State  
  * Pin Code
**Note:**  
The layout and interaction behavior will mirror the **Hospital Listing View** provided in the Employee Enrolment Portal for consistency.

---

### **Data Sync Behavior**
* The **Employee Enrolment Portal** will fetch hospital data from **iWork CRM** based on the employee’s linked Policy Number.  
* Any new upload or update in CRM will automatically reflect in the Enrolment Portal through **real-time API integration** or a **scheduled sync**.

---


### **Audit & History Tracking**

Each upload and configuration change will be logged with the following details:

* File Name
* Uploaded By
* Upload Timestamp
* Record Count (Network / Excluded)
* Action Type (Upload, Edit, Delete, Save, etc.)
* Change Summary (what was changed, added, or removed)
* Previous Value and New Value (for edits)

**Audit Log Features:**
* All actions (uploads, edits, saves, deletions) related to hospital network data and configuration should be recorded in an audit log.
* Each log entry should include: user, timestamp, action type, affected records, and a summary of changes.
* Audit logs should be exportable to Excel for compliance and review.
* Retain audit logs for a minimum of 1 year.

---


### **Expected System Behavior**

| Scenario | System Response |
| ----- | ----- |
| **Successful Upload** | “Hospital data uploaded successfully and synced with the Enrolment Portal.” |
| **Successful Save** | “Configuration saved and changes are now visible on the Enrolment Portal.” |
| **Error (Duplicate / Validation Failure)** | System displays appropriate error message and prevents saving. **1\. Mandatory Field Validation Rule:**All required columns must be filled before upload. **Mandatory Columns:** Policy ID Hospital Name Address Pin Code At least one of the columns — *Network Hospital* or *Excluded Hospital* — must contain a valid entry. **Error Messages:** “Policy ID is missing. Please provide a valid Policy ID.” “Hospital Name cannot be blank.” “Address field is mandatory.” “Pin Code is required.” “Please specify whether the hospital belongs to Network or Excluded list.” **2\. Invalid Pin Code Format Rule:**Pin Code must be a **6-digit numeric value**. **Error Messages:** “Invalid Pin Code format. Please enter a valid 6-digit Pin Code.” “Pin Code cannot contain alphabets or special characters.” **3\. Duplicate Entry Validation Rule:**Duplicate entries within the same upload file or existing data are not allowed.Duplicate is defined as having the same combination of:**Policy ID \+ Hospital Name \+ Address \+ Pin Code Error Messages:** “Duplicate record found in the upload file – \[Hospital Name\], \[Address\].” “Duplicate record already exists for this Policy ID in the system.” **4\. Network / Excluded Column Validation Rule:**A hospital cannot be marked as both Network and Excluded in the same record. **Error Messages:** “Invalid classification – A hospital cannot be listed under both Network and Excluded columns.” **5\. File Format Validation Rule:**The uploaded file must be in **Excel format (.xls or .xlsx)** and follow the standard template structure. **Error Messages:** “Invalid file format. Please upload a valid Excel file (.xls or .xlsx).” “Uploaded file does not match the required template structure. Please download and use the standard template.” **6\. Blank File / No Valid Records Rule:**System should not accept an upload with no valid rows or an empty Excel file. **Error Messages:** “The uploaded file contains no valid records.” “File is empty. Please upload a valid file with hospital data.” **7\. Invalid State / City / Location Rule:**State, Union Territory, and City names must be valid text values. **Error Messages:** “Invalid State/UT name. Please enter a valid value.” “Invalid City/Location. Please verify and correct.” |
| **Dynamic Sync** | Enrolment Portal always reflects the latest hospital data without manual refresh or intervention. |

---

# **User Stories**

## Policy Type Scenarios

**As an admin:**
- I should not be able to upload hospital network data for GTL or GPA policies. The system should prevent this and show an error message.

## **Module 2: Portal Configuration – Hospital Network Setup (CRM)**

### **Epic: Hospital Network Data Management**

As an **admin**, I want to upload, validate, and manage hospital data per policy so that it stays synchronized with the Employee Enrolment Portal.

---

### **User Story 1 – Access Portal Configuration**
**As an** admin user  
**I want to** access the “Portal Configuration” CTA from the Policy Details screen  
**So that** I can manage portal-level configurations for each policy.

**Acceptance Criteria:**
* “Portal Configuration” CTA is available for each Policy Details view.
* Clicking opens the Portal Configuration landing page.
* Summary screen appears with a placeholder message.

---

### **User Story 2 – View Tab Structure**
**As an** admin  
**I want to** see separate configuration tabs  
**So that** I can manage different portal features independently.

**Acceptance Criteria:**
* Tabs: Summary, Hospital Network Upload, FAQ Upload (others can be added later).

---

### **User Story 3 – Upload Hospital Data via Excel**
**As an** admin  
**I want to** upload Hospital Network and Excluded Hospital lists via Excel  
**So that** I can easily manage hospital data for each policy.

**Acceptance Criteria:**
* “Download Template” link is provided.
* Mandatory fields: Policy ID, Hospital Name, State/UT, City/Location, Address, Pin Code, Hospital Network, Excluded Hospital.
* System rejects duplicates (same Policy ID + Hospital Name + Address + Pin Code).
* On successful upload, show: “Hospital data uploaded successfully and synced with the Enrolment Portal.”

---

### **User Story 4 – Save Configuration**
**As an** admin  
**I want to** click a “Save” CTA after performing all required activities  
**So that** all details are saved and changes are visible on the Enrolment Portal.

**Acceptance Criteria:**
* “Save” button is enabled only after all required activities and validations are complete.
* Clicking Save triggers sync to the Enrolment Portal.
* Show confirmation or error messages as appropriate.

---

### **User Story 5 – View Audit Logs and Transaction History**
**As an** admin  
**I want to** view a detailed audit log and transaction history of all actions performed on hospital network data and configuration  
**So that** I can track, review, and export all changes for compliance and troubleshooting.

**Acceptance Criteria:**
* Audit log records all uploads, edits, saves, and deletions with user, timestamp, action type, and change summary.
* Audit log is accessible from Portal Configuration.
* Audit log can be exported to Excel and retained for at least 1 year.
* Transaction history table shows: File Name, No. of Hospital Networks, No. of Excluded Hospitals, Uploaded By, Upload Date, Download link.

---

### **User Story 6 – View Uploaded Hospital List**
**As an** admin  
**I want to** view the uploaded Hospital Network in a searchable table  
**So that** I can verify and manage the current data.

**Acceptance Criteria:**
* Table columns: Hospital Name, Address, City/State, Pin Code.
* Filters: State/UT, City/Location, State and City, Pin Code, Keyword Search.
* Behavior and layout mirror the Employee Portal Hospital Listing.
* System prevents duplicate hospital records for a policy.

---

### **User Story 7 – Validate Upload Data**
**As an** admin  
**I want to** ensure uploaded data follows business rules  
**So that** no invalid or conflicting entries are saved.

**Acceptance Criteria (Validation Rules):**
* Mandatory fields must be filled.
* Invalid Pin Code (non-6-digit numeric) triggers error.
* Duplicate Policy ID + Hospital Name + Address + Pin Code combinations are blocked.
* Invalid Classification: A hospital cannot be both Hospital Network and Excluded.
* Only Excel (.xls or .xlsx) in template structure is allowed.
* Blank files or uploads with no valid records are rejected.
* Invalid State/City values trigger specific error messages.

---

### **User Story 8 – Sync Data to Portal**
**As an** admin  
**I want to** ensure hospital data automatically syncs with the Employee Enrolment Portal  
**So that** employees always see the most recent data.

**Acceptance Criteria:**
* Any successful upload in CRM triggers automatic sync to the Enrolment Portal.
* Sync occurs in real-time or through scheduled batch integration.
* Portal always reflects the latest uploaded data without manual refresh.
