# **Product Specs**

## **Module:**

Employee Enrolment Portal  → FAQ

---



## **Feature Overview:**

The *FAQ* (Frequently Asked Questions) feature provides employees with quick access to important information related to their insurance policies. Each policy (GMC, GTL, GPA) will have its own separate portal configuration and FAQ upload in iWork CRM under Policy Details. FAQs can also be configured country-wise, so Question, Answer, and Category may differ for different countries. For now, implementation is required for India and Sri Lanka. In the Employee Enrolment Portal, the FAQ section will display all FAQs configured across all policies and countries linked to the employee, combined in a single FAQ section. This ensures employees see a comprehensive list of FAQs relevant to all their policies and country context.

Currently, the FAQ hyperlink on the enrolment portal displays **dummy static FAQs**. The new requirement is to **enable policy-wise and country-wise FAQ upload/import through CRM, and aggregate all FAQs for the employee in the portal FAQ section.**

## **Functional Requirements**

### **1\. Placement & Navigation**

* On the **Employee Enrolment Portal login screen**, display a **hyperlink labeled “FAQ”** positioned near the **Login CTA (Call-to-Action)**.  
* When the user clicks on the **FAQ hyperlink**, the system should open a new screen or modal titled **“Frequently Asked Questions”**.  
* This screen will display all FAQs associated with the employee’s policy.

---

### **2\. FAQ Listing**

#### **2.1 Layout**

* The FAQ screen should list all the FAQs in a structured format:  
  * Each FAQ should include:  
    * **Question** – displayed in bold or as an expandable heading.  
    * **Answer** – displayed below the question or upon expanding the question.
    * **Category** - Q&A to be shown category wise

#### **2.2 Interaction / listing**

* FAQs to be shown : FAQs should be displayed **category-wise**, with each category containing its own list of FAQs.  
  Each category should be presented in a **collapsible accordion format** for improved readability and user experience.  
* No editing or commenting option is required for employees.  
* FAQs should be **read-only**.


#### **2.3 Policy Mapping**

* The FAQs displayed will depend on all **policy numbers** linked to the employee.  
* When the FAQ hyperlink is clicked, the system should identify all policies (GMC, GTL, GPA, etc.) associated with the employee (via backend mapping) and fetch all FAQs uploaded for those policies from iWork CRM.
* The Employee Enrolment Portal will aggregate and display all FAQs from all configured policies in a single FAQ section, grouped by category as usual.

---

### **3\. Portal Configuration – Policy Level**

### **Overview**

Each Policy record in CRM will include a **“Portal Configuration”** CTA in Policy *Details* screen.  
When a user clicks this CTA, the system will open the **Portal Configuration Landing Page**, which will contain multiple configuration tabs for the Employee Enrolment Portal setup.

---


### **Tab Structure under Portal Configuration**

The **Portal Configuration** section will contain **separate tabs** for each configurable attribute related to the policy.  

Examples include:

* Hospital Network
* FAQ

---

### **FAQ Upload Tab**

**Purpose**  
The **FAQ Upload** tab allows users to upload or manage Frequently Asked Questions (FAQs) for a specific policy. These FAQs are displayed on the Employee Enrolment Portal for employee reference.

---

### **A. Screen Structure**

The **FAQ Upload** screen will be divided into three main sections:

#### **1\. Upload Action Section**


This section enables users to perform FAQ-related file upload activities. It includes:

* **Upload FAQ File** – Allows users to bulk upload FAQs through an Excel template.  
* **Upload FAQ File** – Allows users to bulk upload FAQs through an Excel template. The upload functionality should support two scenarios: (1) **Add to Existing** – new FAQs are appended to the current list, and (2) **Replace All** – all existing FAQs for the policy are deleted and replaced with the uploaded file.
* **Download Template** – Lets users download a sample Excel file that defines the required upload structure. The template must include the following columns: **Category**, **Question**, and **Answer**.

#### **2\. Upload Tracker Section**

Applicable only for bulk uploads via Excel, this section displays the upload history for reference and monitoring.  
Each upload entry includes the following details:

* **File Name** – The name of the uploaded Excel file.  
* **FAQ Count** – The total number of FAQs included in the uploaded file.  
* **Uploaded By** – Name of the user who performed the upload.  
* **Uploaded On** – Date and time of the upload.  
* **Download Option** – Allows users to download a copy of the uploaded file for review.

#### **3\. View All FAQs Section**

This section displays the complete list of FAQs linked to the selected policy — similar to how they appear in the Employee Enrolment Portal.

Each record in this list shows:

* **Question** – The text of the frequently asked question.  
* **Answer** – The explanation or response to the question.  
Both **Question** and **Answer** fields are mandatory for each entry.




### **C. Upload Behavior**

* Multiple uploads are allowed. The user must select whether to **Add to Existing** (append new FAQs to the current list) or **Replace All** (delete all existing FAQs for the policy and replace with the uploaded file).
* Duplicate FAQs (same Policy ID \+ Question) are flagged during validation.  
* The system validates all mandatory fields before saving.  
* A successful upload triggers a **portal sync flag** to ensure the FAQs are updated in the Employee Enrolment Portal.

---

### **D. System Messages**

* **Successful upload:** “FAQ data uploaded successfully and flagged for portal sync.”  
* **Validation failure:** “Missing or invalid data. Please verify and retry.”  
* **Duplicate found:** “Duplicate question(s) found. Please review the file.”

---

### **E. Edge Cases & Validations**

* If no FAQs exist for a policy, display: “No FAQs available for this policy.”  
* If CRM sync fails, display: “Unable to load FAQs at this moment. Please try again later.”  
* For a large FAQ list, enable vertical scrolling (pagination not required).  
* Duplicate questions uploaded within CRM will appear as separate rows — no deduplication logic is applied.




# **User Stories**

## **Epic: Policy-wise FAQ Management & Display**

**Epic Description:**
Enable policy-specific FAQs to be uploaded, managed, and displayed in the Employee Enrolment Portal through CRM configuration, ensuring employees can access accurate, read-only FAQs relevant to their insurance policy.

---

### **User Story 1: FAQ Link and Access on Portal**
**As an** Employee
**I want** to see a “FAQ” hyperlink near the login button on the Employee Enrolment Portal
**So that** I can easily access frequently asked questions related to my insurance policy before or during login.

**Acceptance Criteria:**
1. “FAQ” hyperlink is placed near the Login CTA on the login screen.
2. Clicking the FAQ hyperlink opens a modal or new screen titled “Frequently Asked Questions.”
3. The FAQ modal/screen displays all FAQs associated with the employee’s policy.
4. The screen is view-only with no edit or comment options.
5. If no FAQs are available, the system displays: “No FAQs available for this policy.”

---

### **User Story 2: Category-wise FAQ Display in Accordion**
**As an** Employee
**I want** to view FAQs grouped by category in a collapsible accordion layout
**So that** I can easily browse and read FAQs by topic in an organized and readable format.

**Acceptance Criteria:**
1. FAQs are displayed category-wise (e.g., “Claims”, “Coverage”, “Enrollment”).
2. Each category is shown as a collapsible accordion section.
3. Clicking a category expands it to show the list of questions and answers under it.
4. Each question is displayed as a bold or highlighted heading.
5. The answer is visible upon expanding the question.
6. The layout is scrollable if the FAQ list is lengthy.
7. The FAQ section is fully responsive and accessible on desktop and mobile screens.

---

### **User Story 1: Aggregate and Display All FAQs for Employee (Country-wise)**
**As an** Employee
**I want** the portal to display all FAQs configured across all my policies and countries (GMC, GTL, GPA, etc.; India, Sri Lanka)
**So that** I see a comprehensive list of relevant information in one place, specific to my country context.

**Acceptance Criteria:**
1. When the FAQ hyperlink is clicked, the system identifies all policies and the country context linked to the employee (via backend mapping).
2. The portal fetches and aggregates FAQs uploaded for all those policies and countries from iWork CRM.
3. FAQs are displayed grouped by country and category in a single FAQ section.
4. If CRM sync fails, show: “Unable to load FAQs at this moment. Please try again later.”
5. The system always displays the most recently uploaded FAQs for each policy and country.

---

### **User Story 2: Upload FAQs via Excel Template (Country-wise)**
**As an** Admin User (CRM)
**I want** to bulk upload FAQs for each policy and country using an Excel file
**So that** I can efficiently manage policy- and country-specific FAQs in the CRM.

**Acceptance Criteria:**
1. “FAQ Upload” tab is available under “Portal Configuration” in the Policy Details screen.
2. Users can download a predefined Excel template with columns: Country, Category, Question, Answer.
3. The system validates the uploaded file for missing mandatory fields and duplicate questions (same Question for a policy and country).
4. Validation messages:
  - Success: “FAQ data uploaded successfully and flagged for portal sync.”
  - Missing/invalid data: “Missing or invalid data. Please verify and retry.”
  - Duplicates: “Duplicate question(s) found. Please review the file.”
5. On upload, the user selects whether to Add to Existing (append) or Replace All (overwrite) FAQs for the policy and country.
6. The system triggers a portal sync flag to update FAQs on the Employee Enrolment Portal.

---

### **User Story 3: Track FAQ Upload History**
**As an** Admin User (CRM)
**I want** to view the upload history for FAQs
**So that** I can track when and by whom each upload was done.

**Acceptance Criteria:**
1. “Upload Tracker” section lists all FAQ upload history for the selected policy.
2. Each record displays: File Name, FAQ Count, Uploaded By, Uploaded On, Download Option (to download the uploaded Excel file).
3. Upload history is displayed in reverse chronological order.

---


### **User Story 4: FAQ Portal Sync**
**As an** Admin User
**I want** the system to automatically sync FAQ data from CRM to the Employee Enrolment Portal
**So that** employees always see the latest published FAQs.

**Acceptance Criteria:**
1. Any successful upload flags the FAQs for sync.
2. The Employee Enrolment Portal fetches the updated FAQs during the next sync cycle.
3. After sync, the portal displays the latest FAQs aggregated across all policies for the employee.

