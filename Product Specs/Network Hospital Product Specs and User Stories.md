## **Module:**

Employee Enrolment Portal → Dashboard → Hospital Network

---

## **Feature Overview:**

The *Hospital Network* feature allows employees to view and search the list of **Network Hospitals** and **Excluded Hospitals** associated with their insurance policy. Users can filter hospitals based on geographical parameters, search by keywords, and export the filtered data to Excel. They can also download standard claim-related forms.

---

## **Functional Requirements**

### **1\. Navigation**

* On the Employee Dashboard, a card titled **“Hospital Network”** will be available.  
* On clicking the **“Hospital Network”** card, the user will be navigated to the **“Network Hospital”** screen.  
* The screen will have **two tabs**:  
  1. **Network Hospitals** *(Default Tab)*  
  2. **Excluded Hospitals**

---

### **2\. Tab 1 – Network Hospitals**

#### **2.1 Default Behavior**

* The **Network Hospitals** tab will open by default when the screen loads.

#### **2.2 Search Filters**

Users should be able to search hospitals using one or more of the following filters:

* **State and City**  
* **State / Union Territory**  
* **City / Location**  
* **Pin Code (**When a pin code is entered in the search, the system should display a list of hospitals located within the specified pin code area as well as those nearby to Pin code )

**Behavior:**

* The **Search** button remains **disabled** until any of the above search fields is populated.  
* Once a valid input is provided, the **Search** button becomes **enabled**.  
* On clicking the **Search** button, the system should display a list of all network hospitals matching the search criteria.

#### **2.3 Keyword Search**

* A **Keyword Search** field should be provided above the listing table, allowing users to search using **hospital name** or **address**.  
* Users can type partial or full hospital names.  
* The listing dynamically filters and displays hospitals whose names contain the entered keyword.

#### **2.4 Listing Section**

Once search results are fetched, display them in a tabular format with pagination.

**Table Columns:**

| Column Name | Description |
| ----- | ----- |
| Hospital Name | Full name of the hospital |
| Address | Complete address as available in CRM data |
| Phone number | Display hospital phone number(s) |

**Pagination:**

* Show **10 results per page**.  
* Include navigation controls (*Next / Previous* buttons or page numbers\*).

#### **2.5 Export to Excel**

* Provide a button **“Export to Excel”** above the table.  
* When clicked, the system should export **all hospitals listed in the current search results** (not limited to visible rows).  
* The Excel file should include all visible columns in the same order.

---

### **3\. Tab 2 – Excluded Hospitals**

#### **3.1 Default Behavior**

* When the user clicks the **Excluded Hospitals** tab, display the complete list of excluded hospitals for the policy.

#### **3.2 Listing Layout**

Use the **same table structure** and **pagination rules** as in the “Network Hospitals” tab:

| Column | Description |
| ----- | ----- |
| Hospital Name | Name of the excluded hospital |
| Address | Complete address |
| Contact Details | Hospital phone number(s) |

#### **3.3 Export to Excel**

* Include the same **“Export to Excel”** capability to export all excluded hospitals displayed under this tab.

#### **3.4 Validation & Edge Cases**

| Scenario | Expected Behavior |
| ----- | ----- |
| No results found for selected filters | Display “No hospitals found for the selected criteria.” |
| Invalid pin code entered | Display “Please enter a valid pin code.” |
| CRM data unavailable | Display a system message: “Hospital network data not available. Please contact administrator.” |

---

## **Portal Configuration – Hospital Network Setup**

### **Overview**

Each Policy record in CRM will include a **“Portal Configuration”** CTA in Policy *Details* screen.  
When a user clicks this CTA, the system will open the **Portal Configuration Landing Page**, which will contain multiple configuration tabs for the Employee Enrolment Portal setup.

---

### **Landing Page – Summary Screen**

* Upon clicking the “Portal Configuration” CTA, users will land on the **Summary Screen**.  
* For now, this screen will be non-functional (work in progress).  
* It will display the following placeholder message:  
  “Summary view under development – details will be available once all tabs are implemented.”

---

### **Tab Structure under Portal Configuration**

The **Portal Configuration** section will contain **separate tabs** for each configurable attribute related to the policy.  
Examples include:

* Summary  
* Network Hospital Upload  
* FAQ Upload  
* TPA Configuration  
* Others (to be added in later phases)

For this phase, **two tabs** will be implemented:

1. **Network Hospital Upload**  
2. **FAQ**

---

### **Network Hospital Upload Tab**

When the user clicks the **Network Hospital Upload** tab, the screen will be divided into three main sections:

---

#### **1\. Upload Functionality**

**Purpose:**  
Allows users to upload Network Hospital data through Excel.

**Features:**

* Upload supported via a **standard downloadable template**.  
* A **“Download Template”** link will be provided to guide users on the required format.

**Template Columns:**

| Column Name | Description |
| ----- | ----- |
| Policy ID | Auto-linked or uploaded per policy |
| Hospital Name | Full hospital name |
| State / UT | State or Union Territory name |
| City / Location | City or locality name |
| Address | Full address of the hospital |
| Pin Code | 6-digit pin code |
| Network Hospital | List of Network hospital to be added in Network hospital list |
| Excluded Hospital | List of Excluded hospitals to be added in Excluded hospital list |

**Upload Rules:**

* Multiple uploads allowed per policy.  
* Each new upload will **update or replace** existing hospital data.  
* **Duplicate entries** (same Policy ID \+ Hospital Name \+ Address \+ Pin Code) are not allowed.  
* System will validate **mandatory fields** and **pin code format** before saving.  
* On successful upload, system displays:  
  “Hospital data uploaded successfully and synced with the Enrolment Portal.”  
* If validation or duplication errors occur, descriptive error messages will be shown and the system will prevent saving.  
* All hospitals listed under the **Network Hospital** column will be added to the **Network Hospital list**, and those listed under the **Excluded Hospital** column will be added to the **Excluded Hospital list**.

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

Each upload will be logged with the following details:

* File Name  
* Uploaded By  
* Upload Timestamp  
* Record Count (Network / Excluded)

---

### **Expected System Behavior**

| Scenario | System Response |
| ----- | ----- |
| **Successful Upload** | “Hospital data uploaded successfully and synced with the Enrolment Portal.” |
| **Error (Duplicate / Validation Failure)** | System displays appropriate error message and prevents saving. **1\. Mandatory Field Validation Rule:**All required columns must be filled before upload. **Mandatory Columns:** Policy ID Hospital Name Address Pin Code At least one of the columns — *Network Hospital* or *Excluded Hospital* — must contain a valid entry. **Error Messages:** “Policy ID is missing. Please provide a valid Policy ID.” “Hospital Name cannot be blank.” “Address field is mandatory.” “Pin Code is required.” “Please specify whether the hospital belongs to Network or Excluded list.” **2\. Invalid Pin Code Format Rule:**Pin Code must be a **6-digit numeric value**. **Error Messages:** “Invalid Pin Code format. Please enter a valid 6-digit Pin Code.” “Pin Code cannot contain alphabets or special characters.” **3\. Duplicate Entry Validation Rule:**Duplicate entries within the same upload file or existing data are not allowed.Duplicate is defined as having the same combination of:**Policy ID \+ Hospital Name \+ Address \+ Pin Code Error Messages:** “Duplicate record found in the upload file – \[Hospital Name\], \[Address\].” “Duplicate record already exists for this Policy ID in the system.” **4\. Network / Excluded Column Validation Rule:**A hospital cannot be marked as both Network and Excluded in the same record. **Error Messages:** “Invalid classification – A hospital cannot be listed under both Network and Excluded columns.” **5\. File Format Validation Rule:**The uploaded file must be in **Excel format (.xls or .xlsx)** and follow the standard template structure. **Error Messages:** “Invalid file format. Please upload a valid Excel file (.xls or .xlsx).” “Uploaded file does not match the required template structure. Please download and use the standard template.” **6\. Blank File / No Valid Records Rule:**System should not accept an upload with no valid rows or an empty Excel file. **Error Messages:** “The uploaded file contains no valid records.” “File is empty. Please upload a valid file with hospital data.” **7\. Invalid State / City / Location Rule:**State, Union Territory, and City names must be valid text values. **Error Messages:** “Invalid State/UT name. Please enter a valid value.” “Invalid City/Location. Please verify and correct.” |
| **Dynamic Sync** | Enrolment Portal always reflects the latest hospital data without manual refresh or intervention. |

# **User Stories**

## **Module 1: Employee Enrolment Portal → Dashboard → Hospital Network**

### **Epic: Hospital Network Viewing and Search**

As an **employee**, I want to **view and search hospitals associated with my insurance policy** so that I can easily find a nearby or preferred hospital for treatment or claim processing.

---

### **User Story 1 – Access Hospital Network Screen**

**As an** employee  
**I want to** access the “Hospital Network” screen from my Dashboard  
**So that I can** view the list of hospitals linked to my policy.

**Acceptance Criteria:**

* A “Hospital Network” card should be visible on the employee dashboard.  
* On clicking the card, the user is navigated to the “Network Hospital” screen.  
* The screen should contain two tabs — *Network Hospitals* (default) and *Excluded Hospitals*.

---

### **User Story 2 – Default Tab Load**

**As an** employee  
**I want to** see the “Network Hospitals” tab by default  
**So that** I can view available network hospitals upon search criteria**.**

**Acceptance Criteria:**

* When the page loads, the “Network Hospitals” tab is active by default.  
* The system displays a blank state, upon filter or search show list.

---

### **User Story 3 – Filter and Search by Location**

**As an** employee  
**I want to** filter hospitals by State, City, or Pin Code or State and city  
**So that I can find hospitals in my preferred or nearby locations.**

**Acceptance Criteria:**

* Filters for State/UT, City/Location, and Pin Code should be available.  
* The Search button should remain disabled until at least one field has input.  
* On entering a valid pin code, hospitals within that area and nearby areas should be shown.  
* If no results are found, display “No hospitals found for the selected criteria.”  
* If an invalid pin code is entered, display “Please enter a valid pin code.”

---

### **User Story 4 – Keyword Search**

**As an** employee  
**I want to** search hospitals by name or address using keywords  
**So that I can quickly locate a specific hospital.**

**Acceptance Criteria:**

* A keyword search bar should be provided above the listing table.  
* The search should dynamically filter the listing by hospital name or address.  
* Partial keyword matches should be supported.

---

### **User Story 5 – View Hospital Listing**

**As an** employee  
**I want to** view the search results in a tabular format  
**So that I can read and compare hospital details easily.**

**Acceptance Criteria:**

* Table columns include Hospital Name, Address, and Phone Number.  
* Pagination should show 10 results per page.  
* Navigation options (Next / Previous or page numbers) should be available.

---

### **User Story 6 – Export Search Results**

**As an** employee  
**I want to** export the filtered list of hospitals to Excel  
**So that I can download and refer to them offline.**

**Acceptance Criteria:**

* “Export to Excel” button should be available above the table.  
* Clicking the button should export all search results (not just visible rows).  
* The exported file should include all visible columns in the same order.

---

### **User Story 7 – View Excluded Hospitals**

**As an** employee  
**I want to** view the list of excluded hospitals  
**So that I know which hospitals are not covered under my policy.**

**Acceptance Criteria:**

* View, search, Filter and validations will be same like “Network Hospitals” Listing

---

## **⚙️ Module 2: Portal Configuration – Hospital Network Setup (CRM)**

### **Epic: Hospital Network Data Management**

As an **admin**, I want to **upload, validate, and manage hospital data per policy** so that it stays synchronized with the Employee Enrolment Portal.

---

### **User Story 1 – Access Portal Configuration**

**As an** admin user  
**I want to** access the “Portal Configuration” CTA from the Policy Details screen  
**So that I can manage portal-level configurations for each policy.**

**Acceptance Criteria:**

* A “Portal Configuration” CTA is available for each Policy Details view.  
* On click, the system opens the Portal Configuration landing page.  
* A Summary screen appears with a placeholder message:  
  *“Summary view under development – details will be available once all tabs are implemented.”*

---

### **User Story 2 – View Tab Structure**

**As an** admin  
**I want to** see separate configuration tabs  
**So that I can manage different portal features independently.**

**Acceptance Criteria:**

* Tabs displayed include: Summary, Network Hospital Upload, and FAQ Upload.  
* Additional tabs (e.g., TPA Configuration) can be added later.

---

### **User Story 3 – Upload Hospital Data (Network Hospital Tab)**

**As an** admin  
**I want to** upload Network and Excluded Hospital lists via Excel  
**So that I can easily manage hospital data for each policy.**

**Acceptance Criteria:**

* “Download Template” link provided with required format.  
* Mandatory fields for template  
  * Policy ID  
    Hospital Name  
    State / UT  
    City / Location  
    Address  
    Pin Code  
    Network Hospital  
    Excluded Hospital  
* System should reject duplicates (same Policy ID \+ Hospital Name \+ Address \+ Pin Code).  
* On successful upload, display confirmation:  
  *“Hospital data uploaded successfully and synced with the Enrolment Portal.”*

---

### **User Story 4 – View Upload History**

**As an** admin  
**I want to** see the transaction history of uploads  
**So that I can track all past data updates and audit changes.**

**Acceptance Criteria:**

* A transaction history table should show:  
  * File Name,  
  * No. of Network Hospitals,  
  * No. of Excluded Hospitals,  
  * Uploaded By,  
  * Upload Date, and  
  * Download link.  
* Clicking Download should retrieve the original uploaded file.

---

### **User Story 5 – View Uploaded Hospital List**

**As an** admin  
**I want to** view the uploaded Network Hospitals in a searchable table  
**So that I can verify and manage the current data.**

**Acceptance Criteria:**

* Table columns: Hospital Name, Address, City/State, Pin Code.  
* Filters: State/UT, City/Location, State snd City, Pin Code, Keyword Search.  
* Behavior and layout should mirror the Employee Portal Hospital Listing for consistency.

---

### **User Story 6 – Validate Upload Data**

**As an** admin  
**I want to** ensure uploaded data follows business rules  
**So that no invalid or conflicting entries are saved.**

**Acceptance Criteria (Validation Rules):**

* **Mandatory Field Validation:** Missing mandatory fields.  
* **Invalid Pin Code:** Non-6-digit numeric values should trigger “Invalid Pin Code format” message.  
* **Duplicate Entry:** Duplicate Policy ID \+ Hospital Name \+ Address \+ Pin Code combinations should be blocked.  
* **Invalid Classification:** A hospital cannot be both Network and Excluded.  
* **File Format:** Only Excel (.xls or .xlsx) in template structure is allowed.  
* **Blank File:** Uploads with no valid records are rejected.  
* **Invalid State/City:** Text values must be valid; otherwise, show specific error messages.

---

### **User Story 7 – Sync Data to Portal**

**As an** admin  
**I want to** ensure hospital data automatically syncs with the Employee Enrolment Portal  
**So that employees always see the most recent data.**

**Acceptance Criteria:**

* Any successful upload in CRM triggers an automatic sync to the Enrolment Portal.  
* Sync occurs in real-time or through scheduled batch integration.  
* Portal should always reflect the latest uploaded data without manual refresh.

