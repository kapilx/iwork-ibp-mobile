
## **Module:**

Employee Enrolment Portal → Dashboard → Hospital Network

---



## **Feature Overview:**

The *Hospital Network* feature allows employees to view and search the list of **Hospital Network** and **Excluded Hospitals** associated with their insurance policy, but only for GMC policies. Users can filter hospitals based on geographical parameters, search by keywords, and export the filtered data to Excel. They can also download standard claim-related forms. For GTL and GPA policies, this feature is not available.

---

## Localization: India vs Sri Lanka

The system must handle localization-specific entities and business rules for India and Sri Lanka in the Hospital Network module, including:

- Currency (INR for India, LKR for Sri Lanka)
- Policy number format (country-specific)
- Date format (DD-MM-YYYY for India, DD/MM/YYYY or as per Sri Lanka standard)
- Number formatting (thousand/lakh/crore for India, thousand/million for Sri Lanka)
- Policy type names (localized terminology)
- TPA involvement (country-specific logic)
- GST, TAX (India: GST, Sri Lanka: relevant tax)
- Relationship labels (localized family relationship terms)
- Currency symbol in UI/exports (₹ for India, Rs for Sri Lanka)

---

# Policy Types and Hospital Network Applicability

**Note:** Employees may have one or more of the following policy types:

- **GMC (Group Mediclaim/Health):**
  - Hospital Network feature is available.
- **GTL (Group Term Life) and GPA (Group Personal Accident):**
  - Hospital Network feature is **not** available. These policies do not have a hospital network.

**System Behavior:**
- If the employee has at least one GMC policy, show the Hospital Network card and allow access to the feature for those policies only.
- If the employee has only GTL and/or GPA policies (no GMC), do **not** show the Hospital Network card/tab. If accessed directly, display: "No hospital network is available for your policy type."
- When multiple policies are present, allow the user to select a policy. Only GMC policies will show hospital network data; GTL/GPA will show a message: "No hospital network is available for this policy type."

**Validation & Edge Cases:**
| Scenario | Expected Behavior |
| ----- | ----- |
| Employee has only GTL/GPA | Hide Hospital Network card/tab. Show message |
| Employee has both GMC and GTL/GPA | Show Hospital Network for GMC only. For GTL/GPA, show message as above. |
| Admin tries to upload hospital network for GTL/GPA | System should prevent upload and show: "Hospital network is not applicable for GTL or GPA policies." |

---

## **Functional Requirements**

### **1. Navigation**
* On the Employee Dashboard, a card titled **“Hospital Network”** will be available **only if the employee has a GMC policy**.  
* On clicking the **“Hospital Network”** card, the user will be navigated to the **“Hospital Network”** screen.  
* The screen will have **two tabs**:  
  1. **Hospital Network** *(Default Tab)*  
  2. **Excluded Hospitals**
* If the employee has only GTL/GPA policies, the card/tab will not be shown. If accessed directly, display a message: "No hospital network is available for your policy type."

---

### **2. Tab 1 – Hospital Network**
#### **2.1 Default Behavior**
* The **Hospital Network** tab will open by default when the screen loads, **if the selected policy is GMC**.
* If the selected policy is GTL or GPA, display: "No hospital network is available for this policy type."

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
* The listing dynamically filters and displays hospitals whose names contain the entered keyword
* No restrictions for Keywords entry. 

#### **2.4 Listing Section**

Once search results are fetched, show them as depect in the figma design

**Hospital Information required:**

| ----- | ----- |
| Hospital Name | Full name of the hospital |
| Address | Complete address as available in CRM data |
| Phone number | Display hospital phone number(s) |
| Map Navigation hyperlink - Upon click, redirect user to the location on map in new tab.



---

#### **2.5 Export to Excel**

* Provide a button **“Export to Excel”** above the table.  
* When clicked, the system should export **all hospitals listed in the current search results** (not limited to visible rows).  
* The Excel file should include all visible columns in the same order.
* **Suggested file name:** `hospital-network-<policy-id>-<date>.xlsx` 

---

### **3. Tab 2 – Excluded Hospitals**

#### **3.1 Default Behavior**

* When the user clicks the **Excluded Hospitals** tab, display the complete list of excluded hospitals for the policy, **if the selected policy is GMC**.
* If the selected policy is GTL or GPA, display: "No hospital network is available for this policy type."

#### **3.2 Listing View **

Same like "Hospital Network" as depect in the design

#### **3.3 Export to Excel** File Name should be - 

* Include the same **“Export to Excel”** capability to export all excluded hospitals displayed under this tab.
**Suggested file name:** `excluded-hospital-<policy-id>-<date>.xlsx` 

#### **3.4 Validation & Edge Cases**

| Scenario | Expected Behavior |
| ----- | ----- |
| No results found for selected filters | Display “No hospitals found for the selected criteria.” |
| Invalid pin code entered | Display “Please enter a valid pin code.” |
| CRM data unavailable | Display a system message: “Hospital network data not available. Please contact administrator.” |

---

> **Note:** This ticket also includes a CRM/admin-side "Portal Configuration – Hospital Network Setup" module (Excel upload, validation, transaction history, audit logs) reached from the Policy Details screen in iWork. That content, plus the full-stack Technical Specs (shared backend/DB serving both flows), remains at `docs/IIRM-7589_IBP Hospital Mgmt/`.


# **User Stories**

## Policy Type Scenarios
**As an employee:**
- If I have a GMC policy, I want to view and search the hospital network for my policy.
- If I have only GTL or GPA policies, I should not see the Hospital Network feature, and if I try to access it, I should see a message: "No hospital network is available for your policy type."
- If I have multiple policies, I should only see the hospital network for GMC policies. For GTL/GPA, I should see a message as above.

**As an admin:**
- I should not be able to upload hospital network data for GTL or GPA policies. The system should prevent this and show an error message.

## **Module 1: Employee Enrolment Portal → Dashboard → Hospital Network**

### **Epic: Hospital Network Viewing and Search**

As an **employee**, I want to view and search hospitals associated with my insurance policy so that I can easily find a nearby or preferred hospital for treatment or claim processing.

---

### **User Story 1 – Access Hospital Network Screen**
**As an** employee  
**I want to** access the “Hospital Network” screen from my Dashboard  
**So that I can** view the list of hospitals linked to my policy (if applicable).

**Acceptance Criteria:**
* A “Hospital Network” card should be visible on the employee dashboard **only if the employee has a GMC policy**.  
* On clicking the card, the user is navigated to the “Network Hospital” screen.  
* The screen should contain two tabs — *Network Hospitals* (default) and *Excluded Hospitals* (for GMC only).
* If the employee has only GTL/GPA, the card/tab is not shown. If accessed directly, display: "No hospital network is available for your policy type."
* When multiple policies are present, allow the user to select a policy. Only GMC policies will show hospital network data; GTL/GPA will show a message: "No hospital network is available for this policy type."

---

### **User Story 2 – Default Tab Load**
**As an** employee  
**I want to** see the “Network Hospitals” tab by default  
**So that** I can view available network hospitals upon search criteria (if applicable).

**Acceptance Criteria:**
* When the page loads, the “Network Hospitals” tab is active by default **for GMC policies**.  
* If the selected policy is GTL or GPA, display: "No hospital network is available for this policy type."
* The system displays a blank state, upon filter or search show list.

---

### **User Story 3 – Filter and Search by Location**
**As an** employee  
**I want to** filter hospitals by State, City, or Pin Code  
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

### **User Story 5 – View Hospital Listing and Map**
**As an** employee  
**I want to** view search results in a table and see hospital locations on a map  
**So that** I can compare details and get directions.

**Acceptance Criteria:**
* Table columns: Hospital Name, Address, and Phone Number.  
* Pagination should show 10 results per page.  
* Navigation options (Next / Previous or page numbers) should be available.
* Map icon next to address opens Google Maps in a new tab.

---

### **User Story 6 – Export Search Results**
**As an** employee  
**I want to** export the filtered list of hospitals to Excel  
**So that I can download and refer to them offline.**

**Acceptance Criteria:**
* “Export to Excel” button should be available above the table.  
* Clicking the button should export all search results (not just visible rows).  
* The exported file should include all visible columns in the same order.
* Suggested file name: `hospital-network-upload-<policy-id>-<date>.xlsx`

---

### **User Story 7 – View Excluded Hospitals**
**As an** employee  
**I want to** view the list of excluded hospitals  
**So that** I know which hospitals are not covered under my policy (if applicable).

**Acceptance Criteria:**
* View, search, filter, and validations will be the same as “Network Hospitals” listing **for GMC policies only**.
* If the selected policy is GTL or GPA, display: "No hospital network is available for this policy type." (Do not show the Icon")
* Export to Excel is available for excluded hospitals. Suggested file name: `excluded-hospitals-upload-<policy-id>-<date>.xlsx`

