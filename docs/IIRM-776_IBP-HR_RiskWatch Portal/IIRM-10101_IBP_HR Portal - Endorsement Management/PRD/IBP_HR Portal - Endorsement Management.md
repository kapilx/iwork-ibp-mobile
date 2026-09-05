# **PRD: Endorsement Management Module**

---

# **1\. Objective**

To provide HR users with a centralized module to **track, analyze, and manage all policy-level inception and endorsement activities**, including **member movements (additions/deletions) and premium impact**, with both **high-level summaries and detailed endorsement-level insights**.

---

# **2\. Functional Requirements**

---

## **2.1 Navigation & Structure**

* Endorsement Management should be the **second tab under the Enrolment module**  
* The screen should display:  
  1. **Overview Section (KPIs \+ Premium Summary)**  
  2. **Endorsement Listing (Detailed View per transaction)**

---

## **2.2 Overview Section (KPIs)**

### **2.2.1 Premium Overview**

* Net Premium  
* Gross Premium  
* Total Endorsements  
* Active Lives

---

### **2.2.2 Employee Information**

* Employees at Inception *(Source: Inception data upload)*  
* Employees in Addition *(Source: Endorsements \+ Natural Additions)*  
* Employees in Deletion *(Source: Endorsements \+ Natural Deletions)*  
* Active Employees *(Calculated: Inception \+ Additions − Deletions)*

---

### **2.2.3 Dependent Information**

* Dependents at Inception *(Source: Inception data upload)*  
* Dependents in Addition *(Source: Endorsements \+ Natural Additions)*  
* Dependents in Deletion *(Source: Endorsements \+ Natural Deletions)*  
* Active Dependents *(Calculated: Inception \+ Additions − Deletions)*

---

### **2.2.4 Total Lives**

* Total Lives at Inception *(Source: Inception data upload)*  
* Total Lives in Addition *(Source: Endorsements \+ Natural Additions)*  
* Total Lives in Deletion *(Source: Endorsements \+ Natural Deletions)*  
* Active Lives *(Calculated: Inception \+ Additions − Deletions)*

---

## **2.3 Premium Information (All-Time Cumulative)**

Display aggregated premium metrics:

* Base Premium *(Source: Inception \+ Endorsements)*  
* Tax Amount *(Source: Inception \+ Endorsements)*  
* Gross Premium *(Source: Inception \+ Endorsements)*  
* Addition Premium *(Source: Endorsements – Additions)*  
* Deletion Premium *(Source: Endorsements – Deletions)*  
* Correction Addition Premium *(Source: Endorsements – Corrections)*  
* Correction Deletion Premium *(Source: Endorsements – Corrections)*  
* Net Premium *(Calculated: Base \+ Additions − Deletions ± Corrections)*  
* Tax Amount *(Post adjustments)*  
* Gross Premium *(Post adjustments)*

---

## **2.4 Endorsement Listing**

* Display a list of:  
  * Inception record  
  * All endorsement transactions

---

### **Each record should include:**

#### **2.4.1 Employee Information**

* Employees Added *(Source: Endorsement transaction)*  
* Employees Deleted *(Source: Endorsement transaction)*  
* Dependents Added *(Source: Endorsement / Life Events)*  
* Dependents Deleted *(Source: Endorsement / Life Events)*  
* Total Lives Added/Deleted *(Calculated)*

---

#### **2.4.2 Premium Information**

* Base Premium *(Source: Transaction)*  
* Tax Amount *(Source: Transaction)*  
* Gross Premium *(Source: Transaction)*  
* Addition Premium *(Source: Transaction)*  
* Deletion Premium *(Source: Transaction)*  
* Net Premium Impact *(Calculated per transaction)*

---

## **2.5 Bulk Upload**

* Same functionality as Enrolment module:  
  * Upload inception files  
  * Upload endorsement files  
* Files should be:  
  * Stored  
  * Linked to endorsement records *(Source: Upload metadata)*  
  * Auditable *(User, timestamp, file reference)*

---

# **3\. Business Rules**

* Inception should be treated as the **baseline dataset** *(Source: Initial upload)*  
* Endorsements should:  
  * Capture **additions, deletions, and corrections** *(Source: Endorsement transactions)*  
* Natural additions/deletions should:  
  * Be treated as part of endorsements *(Source: Life Events module)*  
* Active counts must be calculated as:  
  * **Inception \+ Additions − Deletions**  
* Premium calculations must:  
  * Reflect both **cumulative and transaction-level values**  
* Correction premiums must:  
  * Be tracked separately from standard additions/deletions  
* Deleted members must:  
  * Be excluded from active counts  
* Bulk uploads must:  
  * Maintain audit logs *(User, timestamp, file)*  
* All-time premium values must:  
  * Be cumulative across inception and all endorsements

---

# **4\. User Stories & Acceptance Criteria**

---

## **User Story 1: View Endorsement Overview**

**As an HR user,**  
 I want to view overall endorsement metrics,  
 so that I can understand policy-level changes.

**Acceptance Criteria**

* **Given** policy is selected  
* **When** user navigates to Endorsement tab  
* **Then** system should display KPI overview with correct source mapping

---

## **User Story 2: View Member Movement**

**As an HR user,**  
 I want to view employee and dependent additions/deletions,  
 so that I can track member changes.

**Acceptance Criteria**

* **Given** endorsement and life event data exists  
* **When** overview loads  
* **Then** system should display counts derived from respective sources

---

## **User Story 3: View Premium Summary**

**As an HR user,**  
 I want to view cumulative premium details,  
 so that I can understand financial impact.

**Acceptance Criteria**

* **Given** premium data exists  
* **When** overview loads  
* **Then** system should display all premium metrics with correct aggregation

---

## **User Story 4: View Endorsement Listing**

**As an HR user,**  
 I want to view all endorsement transactions,  
 so that I can track historical changes.

**Acceptance Criteria**

* **Given** endorsement records exist  
* **When** listing loads  
* **Then** system should display inception \+ all endorsements

---

## **User Story 5: Analyze Individual Endorsement**

**As an HR user,**  
 I want to see transaction-level details,  
 so that I can analyze impact.

**Acceptance Criteria**

* **Given** endorsement record is selected  
* **When** viewed  
* **Then** system should display employee and premium data for that transaction

---

## **User Story 6: Upload Endorsement Files**

**As an HR user,**  
 I want to upload endorsement files,  
 so that policy updates can be recorded.

**Acceptance Criteria**

* **Given** user uploads file  
* **When** upload is successful  
* **Then** file should be stored with audit metadata and linked to endorsement

---

## **User Story 7: Validate Active Counts**

**As an HR user,**  
 I want accurate active member counts,  
 so that reporting is reliable.

**Acceptance Criteria**

* **Given** inception and endorsement data  
* **When** system calculates totals  
* **Then** active counts should follow defined formula and source mapping

