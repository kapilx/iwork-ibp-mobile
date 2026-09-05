# **Claims Upload Process – PRD (Enhanced)**

---

## **1\. Overview**

The Claims Upload process enables the broker insurance company to upload claim data received from TPAs into the CRM system for tracking and visibility across internal screens and the employee portal.

Currently, claims can only be uploaded at a policy level without validations, which limits scalability and data accuracy.

This enhancement introduces validations, error handling, template standardization, and a new **TPA-level multi-policy claim upload flow**, while enhancing the existing **policy-level upload process**.

**Goal:** Ensure accurate claim data ingestion, operational efficiency, and consistent visibility across all system touchpoints.

---

## **5\. In Scope**

* Policy-level claim upload enhancements

* New TPA-level multi-policy claim upload flow

* Claim upload validations

* Template standardization

* Error handling and error file generation

* Uploaded file tracking and batch-level reporting

* Data persistence across:

  * Track Claims

  * Claims Upload Data

  * Claims Management

* Employee Portal visibility

---

## **7.1 Claim Upload Entry Points**

### **7.1.1 Policy-Level Upload (Existing – Enhanced)**

* Upload Claim Data CTA remains available on the **Policy Details screen**.

* On clicking the CTA, the user is redirected directly to the **Claim Upload screen**.

* The uploaded file must contain claims related **only to the selected policy**.

* New validations and error handling apply to this flow.

---

### **7.1.2 TPA-Level Upload (New)**

* Introduce a new CTA **“Upload Claim Data”** on the **Manage Claims screen**.

* On clicking the CTA, the system must prompt the user to **select the TPA** (TPA name) for which claims are being uploaded.

* After TPA selection, the user is redirected to the **Claim Upload screen** for the selected TPA.

* This flow allows uploading a single file containing claim data for:

  * One policy, or

  * Multiple policies associated with the selected TPA.

---

## **7.2 Upload Flow Behavior**

* The claim upload flow UI is the **same for both policy-level and TPA-level uploads**.

* System determines the upload context based on the entry point:

  * **Policy Details screen → Policy-level upload**

  * **Manage Claims screen → TPA-level upload**

**Data count, calculations, and aggregations**:

* **Policy-level:** Data shown only for the selected policy

* **TPA-level:** Data shown for all policies associated with the selected TPA

---

## **7.3 Claims Uploaded – Quick Cards Section**

The Claims Uploaded section must display the following **quick cards**:

| Quick Card | Description |
| ----- | ----- |
| Total Records | Total claim records combined across all upload batches for the selected Policy or TPA |
| Total Success Records | Total successfully processed claim records combined across all upload batches for the selected Policy or TPA |
| Total Failed Records | Total failed claim records combined across all upload batches for the selected Policy or TPA |
| Settled Claims Count | Total settled claim records combined across all upload batches for the selected Policy or TPA |
| Settled Claimed Amount | Amount corresponding to all settled claim records combined across all upload batches for the selected Policy or TPA |
| Claimed Amount Pending | Total pending claim amount corresponding to all pending claim records combined across all upload batches for the selected Policy or TPA |

**Calculation Rules:**

* Counts and amounts are calculated for **all uploads till date**.

* Values are shown based on **upload context**:

  * Policy-level upload → counts reflect only that policy

  * TPA-level upload → counts reflect all policies under the TPA

---

## **7.4 Uploaded Claim Data Table**

The **Uploaded Claim Data table** must display **batch-level details** with the following columns:

| Column | Description |
| ----- | ----- |
| Claim Batch | Unique Batch ID for every upload. Batch IDs maintained separately for policy-level and TPA-level uploads |
| File Name | Name of the uploaded claim data file |
| Claim Created Date | Date on which the claim file is uploaded (TBD) |
| Status | Processing status of the upload batch (e.g., Processing, Completed, Failed) |
| Processing completed at | Timestamp when the file processing was completed |
| Total Claim Records | Total claim records present in the uploaded file |
| Total Success | Total claim records that successfully pass all validations and are processed |
| Total Fail | Total claim records that fail validation and are rejected |
| Total Pending Claims | Total processed claim records with claim status Pending |
| Total Settled | Total processed claim records with claim status Settled |
| Actions | Download error file for failed records (available when Total Fail > 0) |

**Behavior:**

* Each row represents a **single claim upload batch**

* Pending and Settled counts are calculated **per batch**

* Table data respects **upload context**:

  * Policy-level → batches for that policy only

  * TPA-level → batches for all policies under the TPA

---

## **7.5 Claim Upload Steps**

1. User clicks on the **“Upload Claim Data” CTA** and lands on the Claims Upload screen.

2. User clicks on the **upload action image** and uploads the claim file.

3. The system **validates all claim records**:

   * Records that pass validation → **uploaded successfully**

   * Records that fail validation → **not uploaded**

4. If any records fail validation:

   * An **error file** is created

   * The error file contains all failed records along with respective **error messages** as defined in the PRD

---

## **7.6 Template Handling**

* System enforces **standardization of claim upload template**

* Even if TPAs send different templates, uploaded data must be **mapped to the standard template** before processing

* Claims upload **fails if mandatory fields** as per the standard template are missing

---

## **7.7 Navigation Flow (New)**

User can navigate to the Claim Upload screen from:

* Relevant column/action from the **Claims Management table** on the Manage Claims screen

* Relevant column/action from the **Uploaded Claims Data table** on the Policy Details screen

**Behavior:**

* Navigation redirects the user to the **same Claim Upload screen**

* Upload context (Policy-level or TPA-level) is determined based on the **source screen**

---

## **5.1 Claim Upload Validations (Applicable to Both Upload Scenarios)**

* **Policy Validation**

  * Policy ID exists

  * Policy is active

* **Employee Validation**

  * Employee ID exists

  * Employee is associated with the policy

* **TPA–Policy Association Validation**

  * Policy is associated with the selected TPA

* **Claim Status Validation**

  * Allowed values: Pending, Settled

* **Duplicate Claim Record Validation**

  * Only one Pending record per Claim ID

  * Only one Settled record per Claim ID

  * Additional record with same Claim ID & status → rejected

---

## **Validation Failure & Error Messages**

| Scenario | Error Message |
| ----- | ----- |
| Policy Not Found | “Invalid Policy ID: Policy does not exist in the system.” |
| Inactive Policy | “Policy ID \<Policy ID\> is not active. Claims can only be uploaded for active policies.” |
| Employee Not Found | “Invalid Employee ID: Employee does not exist in the system.” |
| Employee Not Associated with Policy | “Employee ID \<Employee ID\> is not associated with Policy ID \<Policy ID\>.” |
| Policy Not Associated with Selected TPA | “Policy ID \<Policy ID\> is not linked to the selected TPA. Please upload claims under the correct TPA.” |
| Invalid Claim Status | “Invalid Claim Status. Allowed values are Pending or Settled.” |
| Duplicate Claim Record | “Duplicate Claim detected for Claim ID \<Claim ID\>. Record already exists in the system.” |
| Mandatory fields missing | “One or more mandatory fields required by the standard template are missing. Please review the file and re-upload” |

---

## **7.8 Current Issues / Bugs to be Resolved**

| Issue | Description | Expected Behavior |
| ----- | ----- | ----- |
| Duplicate Upload | File processed twice per batch | Each file must be processed **only once per batch** |
| Incorrect Table Label | Claims Upload Data table shown as Endorsement Uploaded Data table | Table label must be **“Claim Uploaded Data Table”** |
| Missing Previously Uploaded Batches | Previously uploaded batches not visible on landing | **All previously uploaded batches** (policy-level or TPA-level) must be visible when navigating to the Upload Claims screen |

---

## **7.9 Data Persistence & Visibility**

Claims uploaded via both **Policy-Level** and **TPA-Level** flows must be captured and displayed consistently:

1. **Track Claims Table – Policy Details Screen**

   * Only data related to the **respective policy** is updated

   * Applies to both **Policy-Level** and **TPA-Level** uploads (for policies under TPA)

2. **Claims Upload Data Table – Policy Details Screen**

   * Only data related to the **respective policy** is updated

   * **Remove Action column**

   * Table must reflect **success, failure, pending, and settled counts per batch**

3. **Claims Management Table – Manage Claims Screen**

   * All claims across **all policies and all TPAs** must be captured

   * Table reflects both **Policy-Level** and **TPA-Level** uploads

---

## **7.10 Employee Portal Visibility**

* All successfully uploaded claim data must be visible to the respective employee

* Displayed data includes:

  * Policy number

  * Policy expiry

  * Total Sum Insured

  * Total Claimed amount

  * Total Settled amount

  * Available balance

  * Claim status (Total, Settled, Pending)

  * Policy type

  * Claim number

  * Claim requested date

  * Claim amount per claim

  * Family members covered

**Note:** All values must be updated **as per claim data received**, not system-calculated

---

## **Popup handling**

### **Important Notice**

Claims can now be submitted at two levels based on your requirement:

### **Policy-level Claims**
If you want to submit a claim for a specific policy, please go to the Policy Details screen and submit the claim from there.

### **TPA-level Claims (Bulk across policies)**
If you want to submit claims at the TPA level for multiple / all policies associated with the selected TPA, you can submit them directly from this screen using the TPA-level upload option.

### **How to create / update a Claim?**

#### **Option 1: Policy-level Claim**
1. Go to manage Policies
2. Select relevant policy  
3. Click Upload Claim / Create Claim

#### **Option 2: TPA-level Claim (Multiple policies)**
1. Stay on the Manage Claims screen
2. Click Upload Claims at TPA Level
3. Select the TPA from the dropdown
4. Upload claims for one or more policies associated with the selected TPA

**Available CTAs:** 
- CTA 1 - "Go to Policies"
- CTA 2 - "Upload TPA-Level Claims"

---

# **User Story and Acceptance Criteria**

## **1\. Policy-Level Claim Upload**

**User Story:**  
 As a user, I want to upload claim data for a single policy from the Policy Details screen, so that I can update claim records for that specific policy in the system.

**Acceptance Criteria:**

**AC1 – Entry Point:**

* **Given** I am on the Policy Details screen

* **When** I click on the “Upload Claim Data” CTA

* **Then** I should be redirected to the Claim Upload screen

* **And** the upload context should be set to Policy-Level

**AC2 – Upload Initiation:**

* **Given** I am on the Claim Upload screen for a policy

* **When** I select a claim file and click the upload action

* **Then** the system should validate all claim records

* **And** successfully validated records should be uploaded

* **And** records failing validation should not be uploaded and should be added to the error file

---

## **2\. TPA-Level Claim Upload**

**User Story:**  
 As a user, I want to upload claim data for one or multiple policies associated with a TPA from the Manage Claims screen, so that I can efficiently upload claims for all policies under a TPA at once.

**Acceptance Criteria:**

**AC1 – Entry Point & TPA Selection:**

* **Given** I am on the Manage Claims screen

* **When** I click on the “Upload Claim Data” CTA

* **Then** the system must prompt me to select the TPA name

* **And** after TPA selection, I should be redirected to the Claim Upload screen for the selected TPA

**AC2 – Upload Initiation:**

* **Given** I am on the Claim Upload screen for the selected TPA

* **When** I upload a claim file containing claims for one or multiple policies

* **Then** the system validates all records

* **And** uploads successfully validated records

* **And** generates an error file for records that fail validation

---

## **3\. Data Count Calculation and Aggregation**

**User Story:**  
 As a user, I want the system to calculate and aggregate claim data counts for Policy or TPA-level uploads, so that I can see accurate totals across all uploaded batches.

**Acceptance Criteria:**

* **Given** multiple claim upload batches exist

* **When** I view the claim upload quick cards or tables

* **Then** for Policy-Level, counts must include **only that policy**

* **And** for TPA-Level, counts must include **all policies under the selected TPA**

* **And** totals include: Total Records, Total Success, Total Fail, Settled Claims, Settled Amount, Pending Amount

---

## **4\. Claim Upload Quick Cards Behavior**

**User Story:**  
 As a user, I want to view quick summary cards for uploaded claims, so that I can understand overall upload success, failures, and claim status at a glance.

**Acceptance Criteria:**

* **Given** I am on the Claim Upload screen

* **When** I upload a file or land on the screen

* **Then** the quick cards must show:

  * Total Records

  * Total Success Records

  * Total Failed Records

  * Settled Claims Count

  * Settled Claimed Amount

  * Claimed Amount Pending

* **And** calculation context should respect Policy or TPA upload context

---

## **5\. Uploaded Claims Data Table Behavior**

**User Story:**  
 As a user, I want to see uploaded claim batches in a table with batch-level details, so that I can track each upload.

**Acceptance Criteria:**

* **Given** a claim file has been uploaded

* **When** I view the Uploaded Claims Data table

* **Then** each row represents a batch

* **And** columns include:

  * Claim Batch (unique ID, separate for Policy and TPA)

  * Claim Created Date

  * Total Claim Records

  * Total Success

  * Total Fail

  * Total Pending

  * Total Settled

* **And** table shows only relevant data for Policy or TPA context

---

## **6\. Error File Handling**

**User Story:**  
 As a user, I want the system to generate an error file with failed records and reasons, so that I can correct and re-upload invalid claims.

**Acceptance Criteria:**

* **Given** a claim file is uploaded

* **When** some records fail validation

* **Then** an error file must be generated

* **And** the error file contains:

  * All failed records

  * Corresponding error messages as per PRD

* **And** successfully validated records must still be uploaded

---

## **7\. Template Handling**

**User Story:**  
 As a user, I want the system to enforce standard claim file templates, so that all uploaded data follows a consistent structure.

**Acceptance Criteria:**

* **Given** TPAs send different file templates

* **When** I upload the file

* **Then** the system should map it to the standard template

* **And** the upload must fail if **mandatory fields are missing**

* **And** display the error message: “One or more mandatory fields required by the standard template are missing. Please review the file and re-upload”

---

## **8\. Navigation Flow**

**User Story:**  
 As a user, I want to navigate to the Claim Upload screen from other tables, so that I can view or re-upload claims quickly.

**Acceptance Criteria:**

* **Given** I am on the Manage Claims table or Uploaded Claims Data table

* **When** I click the relevant column/action

* **Then** I should be redirected to the Claim Upload screen

* **And** the upload context is determined automatically (Policy or TPA)

---

## **9\. Claim Upload Validations**

**User Story:**  
 As a user, I want the system to validate all uploaded claim data, so that only accurate and consistent claims are uploaded.

**Acceptance Criteria:**  
 **Validations and Error Messages:**

1. **Policy Validation:**

   * Policy exists → “Invalid Policy ID: Policy does not exist in the system.”

   * Policy active → “Policy ID \<Policy ID\> is not active. Claims can only be uploaded for active policies.”

2. **Employee Validation:**

   * Employee exists → “Invalid Employee ID: Employee does not exist in the system.”

   * Employee associated → “Employee ID \<Employee ID\> is not associated with Policy ID \<Policy ID\>.”

3. **TPA–Policy Association:**

   * Correct TPA → “Policy ID \<Policy ID\> is not linked to the selected TPA. Please upload claims under the correct TPA.”

4. **Claim Status Validation:**

   * Pending or Settled → “Invalid Claim Status. Allowed values are Pending or Settled.”

5. **Duplicate Claim Record:**

   * Only one Pending/Settled per Claim ID → “Duplicate Claim detected for Claim ID \<Claim ID\>. Record already exists in the system.”

6. **Mandatory Fields:**

   * All mandatory fields present → “One or more mandatory fields required by the standard template are missing. Please review the file and re-upload”

**Given** a claim file is uploaded  
 **When** validation fails  
 **Then** the record is not uploaded  
 **And** added to the error file

---

## **10\. Data Persistence & Visibility**

**User Story:**  
 As a user, I want uploaded claims to be visible across all system screens, so that policy and TPA-level claims are tracked and reported accurately.

**Acceptance Criteria:**

1. **Track Claims Table – Policy Details Screen**

   * Only updates for the respective policy

   * Reflects both Policy and TPA uploads (for policies under TPA)

2. **Claims Upload Data Table – Policy Details Screen**

   * Only updates for respective policy

   * Remove Action column

   * Reflect batch-level success, failure, pending, and settled counts

3. **Claims Management Table – Manage Claims Screen**

   * Updates all policies and all TPAs

   * Reflects both Policy-Level and TPA-Level uploads

---

## **11\. Employee Portal Visibility**

**User Story:**  
 As a user, I want uploaded claims to be visible in the Employee Portal, so that employees can view updated claim information.

**Acceptance Criteria:**

* **Given** a claim is successfully uploaded

* **When** the employee logs into the Employee Portal

* **Then** the portal displays:

  * Policy number

  * Policy expiry

  * Total Sum Insured

  * Total Claimed amount

  * Total Settled amount

  * Available balance

  * Claim status (Total, Settled, Pending)

  * Policy type

  * Claim number

  * Claim requested date

  * Claim amount per claim

  * Family members covered

* **And** all values are updated based on uploaded claim data

