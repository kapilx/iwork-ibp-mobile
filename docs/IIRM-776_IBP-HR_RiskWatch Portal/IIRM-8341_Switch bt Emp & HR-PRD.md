# **HR Portal – Product Requirements Document (PRD)**

**Version:** 1.1

---

## **1\. Introduction**

The HR Portal enables corporate HR teams to manage, monitor, and administer employee insurance policies from a centralized platform. A corporate organization may have multiple insurance policies, and employees may be enrolled in one or more of these policies.

Users with dual roles (**Employee \+ HR Admin**) can access both the **Employee Portal** and the **HR Portal** using a **single login ID**, ensuring a seamless experience across both roles.

---

## **2\. User Types & Access Model**

### **2.1 HR Admin (Also an Employee)**

* HR Admin is an employee with additional administrative privileges.  
* A single login ID provides access to:  
  * Employee Portal  
  * HR Portal

### **2.2 Portal Switching**

* The system shall allow users to **switch between Employee Portal and HR Portal** from the **User Account / Profile screen**.  
* Switching portals shall not require re-authentication.

---

## **3\. HR Portal Landing Page**

### **3.1 Purpose**

* Provide a consolidated, organization-level overview across **all insurance policies**.  
* Enable HR Admins to quickly assess enrollment status, coverage, claims, and financial exposure.

---

### **3.2 Corporate Summary Dashboard (All Policies Combined)**

When an HR Admin switches to the HR Portal, the landing page shall display the following aggregated metrics across **all policies**:

#### **3.2.1 Member & Enrollment Metrics**

| Metric Name | Source Table | Uniqueness / Count Logic | Definition / Notes |
| ----- | ----- | ----- | ----- |
| **Total Employees** | Employee Table | Count **distinct Employee ID** across all policies | Total number of unique employees mapped to the corporate, irrespective of policy enrollment status |
| **Total Dependents** | Dependent Table | Count **distinct (Employee ID \+ Dependent ID \+ Policy ID)** | Total number of dependents linked to employees across all policies |
| **Total Active Members (Employee \+ Dependent)** | Employee Map Table | Count records where **Status \= Active** | Includes both employees and dependents who are currently active under at least one policy |
| **Total Inactive Members (Employee \+ Dependent)** | Employee Map Table | Count records where **Status \= Inactive** | Includes employees and dependents marked inactive (policy exited, endorsement removal, or coverage ended) |
| **Total Enrollments (All Policies Combined)** | Enrollment Table | Count **Enrollment ID** across all policies | Each policy enrollment is counted once. An employee enrolled in multiple policies is counted multiple times |
| **Total Enrollment Pending (All Policies Combined)** | Enrollment Table | Count **Enrollment ID** where status \= Draft / In-Progress / Pending | Enrollment journeys initiated but not yet submitted or approved |

#### **3.2.2 Claims & Coverage Metrics**

* Total Sum Insured (All policies combined)  
* Total Claims Count (All policies combined)  
* Total Claimed Amount (All policies combined)  
* Total Available Balance (All policies combined)

---

### **3.3 CD Account Summary (All Policies)**

The landing page shall display CD account details:

* Opening Balance  
* Minimum Balance  
* Total Premium  
* Premium Paid

#### **3.3.1 CD Transaction Summary**

* When the HR Admin clicks on the CD account section, the system shall display a transaction summary with:  
  * Date  
  * Transaction Type (Debit / Credit)  
  * Amount  
  * Remarks  
  * Opening Balance  
  * Closing Balance

---

### **3.4 Policy Cards**

The landing page shall display **policy cards** for all policies mapped to the corporate.

Each policy card shall display:

* Policy Name  
* Policy Number  
* Enrollment Start Date  
* Enrollment End Date  
  * If enrollment has not started, show **Enrollment Start Date** prominently  
* Policy Status (Active / Inactive)  
* CTA to **Extend Enrollment Closing Date** (subject to permissions)

---

## **4\. Policy Details Dashboard**

### **4.1 Navigation**

* When an HR Admin clicks on a policy card, the system shall redirect the user to the **Policy Details Dashboard** for the selected policy.

---

### **4.2 Claims Information (Per Policy)**

The Policy Details Dashboard shall display:

* Sum Insured  
* Claims Count  
* Total Claim Amount  
* Settled Amount  
* Pending Amount  
* Available Balance

---

### **4.3 Member Summary (Per Policy)**

* Total Employees  
* Total Dependents  
* Total Lives  
* Active Members  
* Inactive Members

---

### **4.4 Enrollment Details (Per Policy)**

* Total Enrollments  
* Enrollment In-Progress  
* Enrollment Not Started

---

### **4.5 Member Management**

The Policy Details Dashboard shall include a member management table with the following columns:

* Employee ID  
* Name  
* Relationship (Self / Dependent)  
* Enrollment Status (Not Started / In-Progress / Submitted / Registered)  
* UHID  
* Date of Birth  
* Status (Active / Inactive)  
* Download TPA Card  
* Actions:  
  * Resend Enrollment Email  
    * Enrollment Invitation Not Received  
    * Welcome / Onboarding  Email Not Received  
    * Employee Onboarded Late (After Enrollment Launch)  
    * Policy Eligibility Changed for One Employee  
  * Should be configurable to resend more options

---

### **4.6 Contact Matrix (Per Policy)**

The system shall display a comprehensive contact matrix including:

**Insurer Contacts**

* Branch Phone Number  
* Branch Email  
* Contact Person Name  
* Contact Person Phone Number  
* Contact Person Email

**TPA Contacts**

* TPA Contact person phone number and Email ( primary and second level of escalation)  
* Insurer Contact person Phone number and Email ( Primary and secondary level of escalation )

---

### **4.7 Hospital Network**

The Policy Details Dashboard shall display:

* Included Hospital Network List  
* Excluded Hospital List

---

## **5\. Search & Filters**

### **5.1 Filters**

HR Admins shall be able to filter members using:

* Active  
* Inactive  
* Enrollment – Registered  
* Enrollment – Submitted / Closed  
* Enrollment – In-Progress  
* Enrollment – Not Started

### **5.2 Search**

HR Admins shall be able to search by:

* Employee Name  
* Employee ID  
* UHID  
* Phone Number

---

## **6\. Export**

* HR Admins shall be able to export member data in **CSV format**.  
* Exported data shall respect applied filters and search criteria.

# **User Stories & Acceptance Criteria**

---

## **EPIC 1: HR Portal Access & Role Switching**

---

### **User Story 1: Access HR Portal with Single Login**

**As an HR Admin (who is also an employee),**  
 I want to access both the Employee Portal and HR Portal using a single login,  
 so that I can manage my responsibilities without maintaining multiple credentials.

#### **Acceptance Criteria**

**Given** I am logged in with a valid employee login  
 **And** I have HR Admin privileges  
 **When** I access the application  
 **Then** I should be authorized to access both:

* Employee Portal

* HR Portal

**And** no additional authentication should be required

---

### **User Story 2: Switch Between Employee Portal and HR Portal**

**As an HR Admin,**  
 I want to switch between Employee Portal and HR Portal,  
 so that I can perform employee and administrative tasks seamlessly.

#### **Acceptance Criteria**

**Given** I am logged in  
 **When** I navigate to the User Account / Profile screen  
 **Then** I should see an option to switch portals

**When** I select “Switch to HR Portal”  
 **Then** I should be redirected to the HR Portal landing page  
 **And** I should not be asked to log in again

---

## **EPIC 2: HR Portal Landing Page – Corporate Summary Dashboard**

---

### **User Story 3: View Corporate Summary Dashboard**

**As an HR Admin,**  
 I want to view an aggregated corporate-level dashboard,  
 so that I can quickly assess overall enrollment, membership, and claims status.

#### **Acceptance Criteria**

**Given** I switch to the HR Portal  
 **When** the landing page loads  
 **Then** the system should display a Corporate Summary Dashboard

---

### **User Story 4: View Member & Enrollment Metrics**

**As an HR Admin,**  
 I want to view consolidated member and enrollment metrics across all policies,  
 so that I can understand organizational coverage at a glance.

#### **Acceptance Criteria**

**Given** I am on the HR Portal landing page  
 **Then** the system should display:

* Total Employees

* Total Dependents

* Total Active Members

* Total Inactive Members

* Total Enrollments

* Total Enrollment Pending

**And** all metrics should follow the defined uniqueness and count logic  
 **And** metrics should aggregate data across all policies

---

### **User Story 5: View Claims & Coverage Metrics**

**As an HR Admin,**  
 I want to view consolidated claims and coverage metrics,  
 so that I can assess financial exposure and utilization.

#### **Acceptance Criteria**

**Given** I am on the Corporate Summary Dashboard  
 **Then** the system should display:

* Total Sum Insured

* Total Claims Count

* Total Claimed Amount

* Total Available Balance

**And** values should be aggregated across all active policies

---

## **EPIC 3: CD Account Summary**

---

### **User Story 6: View CD Account Summary**

**As an HR Admin,**  
 I want to view the CD account summary across all policies,  
 so that I can track premium utilization and balances.

#### **Acceptance Criteria**

**Given** CD account data exists  
 **When** I view the HR Portal landing page  
 **Then** the system should display:

* Opening Balance

* Minimum Balance

* Total Premium

* Premium Paid

---

### **User Story 7: View CD Transaction Summary**

**As an HR Admin,**  
 I want to view detailed CD account transactions,  
 so that I can audit debits and credits.

#### **Acceptance Criteria**

**Given** I click on the CD Account section  
 **When** the transaction view opens  
 **Then** the system should display:

* Date

* Transaction Type

* Amount

* Remarks

* Opening Balance

* Closing Balance

---

## **EPIC 4: Policy Cards & Policy Navigation**

---

### **User Story 8: View Policy Cards**

**As an HR Admin,**  
 I want to view all insurance policies mapped to my organization,  
 so that I can access policy-level details easily.

#### **Acceptance Criteria**

**Given** policies are mapped to the corporate  
 **When** I view the HR Portal landing page  
 **Then** a policy card should be displayed for each policy

**And** each card should show:

* Policy Name

* Policy Number

* Enrollment Start Date

* Enrollment End Date

* Policy Status (Active / Inactive)

---

### **User Story 9: Extend Enrollment Closing Date**

**As an HR Admin,**  
 I want to extend the enrollment closing date for a policy (if permitted),  
 so that late enrollments can be accommodated.

#### **Acceptance Criteria**

**Given** I have permission to extend enrollment  
 **When** I view an active policy card  
 **Then** I should see a CTA to extend the enrollment date

---

### **User Story 10: Navigate to Policy Details Dashboard**

**As an HR Admin,**  
 I want to open a detailed dashboard for a selected policy,  
 so that I can manage policy-specific data.

#### **Acceptance Criteria**

**Given** I click on a policy card  
 **Then** I should be redirected to the Policy Details Dashboard for that policy

---

## **EPIC 5: Policy Details Dashboard**

---

### **User Story 11: View Claims Information Per Policy**

**As an HR Admin,**  
 I want to view claims and coverage information for a policy,  
 so that I can monitor policy utilization.

#### **Acceptance Criteria**

**Given** I am on the Policy Details Dashboard  
 **Then** the system should display:

* Sum Insured

* Claims Count

* Total Claim Amount

* Settled Amount

* Pending Amount

* Available Balance

---

### **User Story 12: View Member Summary Per Policy**

**As an HR Admin,**  
 I want to view member statistics for a specific policy,  
 so that I can track coverage status.

#### **Acceptance Criteria**

**Then** the system should display:

* Total Employees

* Total Dependents

* Total Lives

* Active Members

* Inactive Members

---

### **User Story 13: View Enrollment Summary Per Policy**

**As an HR Admin,**  
 I want to view enrollment progress for a policy,  
 so that I can track participation levels.

#### **Acceptance Criteria**

**Then** the system should display:

* Total Enrollments

* Enrollment In-Progress

* Enrollment Not Started

---

## **EPIC 6: Member Management**

---

### **User Story 14: View Member Management Table**

**As an HR Admin,**  
 I want to view a detailed member list for a policy,  
 so that I can manage employee and dependent enrollments.

#### **Acceptance Criteria**

**Given** I am on the Policy Details Dashboard  
 **Then** the member table should display:

* Employee ID

* Name

* Relationship

* Enrollment Status

* UHID

* Date of Birth

* Status

* Download TPA Card option

---

### **User Story 15: Perform Member-Level Actions**

**As an HR Admin,**  
 I want to perform actions on individual members,  
 so that enrollment issues can be resolved.

#### **Acceptance Criteria**

**Given** I select a member  
 **When** I open the Actions menu  
 **Then** I should see configurable options such as:

* Resend Enrollment Email

* Enrollment Invitation Not Received

* Welcome / Onboarding Email Not Received

* Employee Onboarded Late

* Policy Eligibility Changed

---

## **EPIC 7: Contact Matrix & Hospital Network**

---

### **User Story 16: View Contact Matrix**

**As an HR Admin,**  
 I want to view insurer and TPA contact details,  
 so that I know whom to reach out to for support and escalation.

#### **Acceptance Criteria**

**Then** the system should display:

* Insurer Contacts

* Branch Phone & Email

* Contact Person details

* TPA Primary & Secondary Escalation contacts

---

### **User Story 17: View Hospital Network**

**As an HR Admin,**  
 I want to view included and excluded hospitals for a policy,  
 so that I can guide employees correctly.

#### **Acceptance Criteria**

**Then** the system should display:

* Included Hospital List

* Excluded Hospital List

---

## **EPIC 8: Search, Filters & Export**

---

### **User Story 18: Filter Members**

**As an HR Admin,**  
 I want to filter members by status and enrollment state,  
 so that I can narrow down relevant records.

#### **Acceptance Criteria**

**Given** I am viewing the member list  
 **When** I apply filters such as Active, Inactive, Enrollment status  
 **Then** the list should update accordingly

---

### **User Story 19: Search Members**

**As an HR Admin,**  
 I want to search members using identifiers,  
 so that I can quickly locate specific records.

#### **Acceptance Criteria**

**When** I search by:

* Employee Name

* Employee ID

* UHID

* Phone Number  
   **Then** matching records should be displayed

---

### **User Story 20: Export Member Data**

**As an HR Admin,**  
 I want to export member data,  
 so that I can use it for reporting and audits.

#### **Acceptance Criteria**

**Given** filters or search are applied  
 **When** I export data  
 **Then** a CSV file should be generated  
 **And** exported data should reflect applied filters

