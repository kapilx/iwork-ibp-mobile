

## **1\. Overview**

This section defines the functional behavior for sending **Inception / Endorsement** files to insurers and companies from the CRM. The flow ensures that emails are sent to the **correct contacts**, leverages existing contact master data, enforces creation of missing contacts where required, and persists selected email IDs for future reuse.

---

## **2\. User Journey (High Level)**

1. Policy is created in with assigned lead insurer  
2. Employee data is uploaded / updated  
3. User initiates one of the actions:  
   * **Send Inception / Endorsement to Insurer**  
   * **Send Inception / Endorsement to Company**  
4. System resolves relevant contact and email details  
5. User validates or updates recipient selection  
6. Email is sent and details are persisted for future use

---

## **3\. Functional Requirements**

### **3.1 Send to Insurer - Unified Popup Interface**

**Business Rule:**

* Inception / Endorsement emails must be sent **only to the Lead Insurer** for the policy.

**System Behavior:**

When user clicks **Send to Insurer**, a unified popup opens that dynamically adapts to handle all contact and email scenarios within the same interface.

#### **Unified Popup Interface - Handles All Scenarios**

**Popup Opens and Displays Based on Available Data:**

**Dynamic Display Logic:**
* **If contact(s) and email(s) available**: Shows existing contact(s) with email(s) and selection options
* **If contact(s) available but no emails**: Shows contact(s) with empty email fields and options to add emails
* **If no contacts available**: Shows empty state with options to add new contacts
* **If multiple contacts available**: Shows all contacts with selection checkboxes
* **If multiple emails per contact**: Shows email selection options for each contact

**Inline Editing Capabilities Within Popup:**

1. **Add New Contact**: 
   - Click "Add New Contact" button within popup
   - Inline form appears in the same popup with the following fields:
     - First Name (mandatory)
     - Last Name (mandatory)
     - Department
     - Designation
     - Email (mandatory)
   - Save button updates the popup display immediately without page redirect

2. **Edit Existing Contact**:
   - Click "Edit" icon next to any contact within popup
   - Inline form appears in the same popup with pre-filled editable fields:
     - First Name
     - Last Name
     - Department
     - Designation
     - Emails (can add/edit/remove multiple email addresses)
   - Save button updates the popup display immediately

3. **Add Email to Existing Contact**:
   - Click "Add Email" button next to contact within popup
   - Inline email input field appears in the same popup
   - Enter new email address and save
   - New email appears in the contact's email list immediately

4. **Edit Email Address**:
   - Click "Edit" icon next to any email within popup
   - Inline email input field appears for editing
   - Modify email address and save
   - Updated email is reflected immediately in the popup

5. **Remove Email/Contact**:
   - Delete icons available next to emails and contacts
   - Confirmation dialog appears within popup
   - Upon confirmation, item is removed and popup updates immediately

**Selection and Proceeding:**
* **Contact Selection**: Checkboxes to select one or multiple contacts
* **Email Selection**: When contact has multiple emails, radio buttons or checkboxes to select desired email(s)
* **Proceed Button**: Always visible when at least one contact with email is selected
* **Validation**: Real-time validation within popup before allowing proceed

**Post-Save Conditions:**

1. **Newly Added Email for Contact:**
   - The newly added email should be saved in the Insurer Contact table (for Send to Insurer)
   - The newly added email should be saved in the Company Contact table (for Send to Company)
   - Email should be linked to the existing contact record

2. **Edited Email:**
   - When email is edited, the same should be updated in the Insurer Contact table (for Send to Insurer)
   - When email is edited, the same should be updated in the Company Contact table (for Send to Company)
   - Existing email record should be modified, not duplicated

3. **New Contact Addition (Insurer):**
   - New contact should be mapped with the current policy
   - Contact should inherit policy-related details using already available insurer contact details:
     - Insurer Name (from existing insurer contact details)
     - Insurer Location (from existing insurer contact details)
     - Insurer Branch (from existing insurer contact details)
   - All user-entered fields (First Name, Last Name, Department, Designation, Email) should be saved
   - New contact record should be created in Insurer Contact table

4. **New Contact Addition (Company):**
   - New contact should be mapped with the current policy
   - Contact should inherit policy-related details using already available company contact details:
     - Company Name (from existing company contact details)
     - Company Location (from existing company contact details)
     - Company Branch (from existing company contact details)
   - All user-entered fields (First Name, Last Name, Department, Designation, Email) should be saved
   - New contact record should be created in Company Contact table

5. **Contact Edit and Save Integration:**
   - When any contact is edited and saved, the updated contact should be saved in the Policy Details screen
   - For Insurer contacts: Updated contact should appear in Policy Details screen - Insurer Contact section
   - For Company contacts: Updated contact should appear in Policy Details screen - Company Contact section
   - Updated contact should also be reflected in the Contacts tab
   - Changes should be synchronized across all screens where the contact is displayed

---

### **3.2 Send to Company - Unified Popup Interface**

* Same unified popup behavior defined in **Section 3.1** applies
* Uses **Company Contact table** instead of Insurer Contact table
* Popup opens when user clicks **Send to Company**
* All CTAs open inline forms within the popup instead of redirecting to separate screens
* Same 3 cases apply:
  * Case 1: Company contact available but email not available - inline form opens within popup
  * Case 2: Company contact available with email available - inline edit forms within popup
  * Case 3: Company contact information not available - inline add form within popup
* All editing and saving happens within the same popup without navigation
* Email is sent to the selected company contact(s)

--- 

## **User Story 1**

### **Unified Popup Interface for Contact Management**

**User Story**  
As a **CRM Operations User**,  
I want to use a unified popup interface that adapts to all contact scenarios when sending inception/endorsement files,  
So that I can efficiently manage contacts and emails within a single interface.

### **Acceptance Criteria**

**AC 1.1 – Dynamic popup display**

* **Given** I click **Send to Insurer** or **Send to Company**  
* **When** the popup opens  
* **Then** the popup should dynamically display based on available contact and email data  
* **And** show appropriate options based on the scenario

**AC 1.2 – Inline editing capabilities**

* **Given** I need to add or edit contact details  
* **When** I click any add/edit CTA within the popup  
* **Then** inline forms should appear within the same popup  
* **And** I should not be redirected to separate screens

**AC 1.3 – Real-time popup updates**

* **Given** I save any contact or email changes inline  
* **When** the save operation completes  
* **Then** the popup should immediately reflect the updated information  
* **And** I should be able to continue with the send flow

---

## **User Story 2**

### **Inline Contact Form Management**

**User Story**  
As a **CRM Operations User**,  
I want to add and edit contact details using inline forms with specific required fields,  
So that I can maintain complete and accurate contact information.

### **Acceptance Criteria**

**AC 2.1 – Add New Contact Form Fields**

* **Given** I click "Add New Contact" within the popup  
* **When** the inline form appears  
* **Then** I should see the following fields:
  * First Name (mandatory)
  * Last Name (mandatory)
  * Department
  * Designation
  * Email (mandatory)
* **And** mandatory fields should be validated before allowing save

**AC 2.2 – Edit Contact Form Fields**

* **Given** I click "Edit Contact Details" within the popup  
* **When** the inline form appears with pre-filled data  
* **Then** I should be able to edit the following fields:
  * First Name
  * Last Name
  * Department
  * Designation
  * Emails (can add/edit/remove multiple email addresses)

**AC 2.3 – Email Management within Contact**

* **Given** I am adding or editing a contact  
* **When** managing email addresses  
* **Then** I should be able to add multiple emails for the same contact  
* **And** edit existing email addresses  
* **And** remove unwanted email addresses

---

## **User Story 3**

### **Data Persistence and Contact Mapping**

**User Story**  
As a **CRM Operations User**,  
I want contact and email changes to be properly saved and mapped to existing data,  
So that contact information is maintained accurately across the system.

### **Acceptance Criteria**

**AC 3.1 – Email additions and updates**

* **Given** I add a new email to an existing contact  
* **When** I save the changes  
* **Then** the email should be saved in the appropriate contact table (Insurer/Company)  
* **And** linked to the existing contact record

**AC 3.2 – Email editing**

* **Given** I edit an existing email address  
* **When** I save the changes  
* **Then** the existing email record should be updated (not duplicated)  
* **And** changes should be reflected in the appropriate contact table

**AC 3.3 – New contact mapping with existing details**

* **Given** I add a new contact  
* **When** the contact is saved  
* **Then** the contact should be mapped with the current policy  
* **And** inherit existing details (Name, Location, Branch) from available contact details  
* **And** be saved in the appropriate contact table (Insurer Contact or Company Contact)

---

## **User Story 4**

### **Multiple Selection and Consistent Experience**

**User Story**  
As a **CRM Operations User**,  
I want to select from multiple contacts and emails, and have consistent experience across insurer and company workflows,  
So that I can efficiently send files to multiple recipients with a familiar interface.

### **Acceptance Criteria**

**AC 4.1 – Multiple contact and email selection**

* **Given** multiple contacts are available with multiple emails  
* **When** I view the popup  
* **Then** I should be able to select one or multiple contacts using checkboxes  
* **And** select specific email IDs for each selected contact  
* **And** see a "Proceed" button when at least one contact with email is selected

**AC 4.2 – Consistent experience across insurer and company**

* **Given** I use **Send to Company** flow  
* **When** the popup opens  
* **Then** it should behave exactly like **Send to Insurer** flow  
* **But** use Company Contact table instead of Insurer Contact table  
* **And** all inline forms and field requirements should be identical

**AC 4.3 – Selection persistence and validation**

* **Given** I make contact and email selections  
* **When** I complete the send operation  
* **Then** my selections should be persisted for future sends  
* **And** real-time validation should prevent proceeding without valid selections

