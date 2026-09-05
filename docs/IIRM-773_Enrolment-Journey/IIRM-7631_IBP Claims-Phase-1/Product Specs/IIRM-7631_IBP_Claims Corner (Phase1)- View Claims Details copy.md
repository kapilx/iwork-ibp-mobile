# **Claims Summary – Product Specification**

## **1\. Purpose**

The purpose of the **Claims Summary module** is to provide employees with clear, accurate, and real-time visibility of their insurance claim information within the Employee Enrolment Portal.  
This module enables:

* Summary of policy-level claim data on the dashboard  
* Detailed employee-level claim tracking (claim listing page)  
* Seamless sync of claim data uploaded via CRM

**Phase 1 Scope:**  
✅ Claims Summary on Dashboard  
✅ Claims Corner screen view  
---

## **2\. Existing Flow (IIRM Portal Side – Already Available)**

### **Step 1: Claim Data Received**

Claim data is periodically shared in an Excel file containing details of all claims for all employees covered under a policy.

### **Step 2: Claim Upload in IIRM Portal**

* User uploads the received file into the **IIRM → Claims Upload** section (already implemented).  
* The IIRM portal stores all uploaded claims and links them to the corresponding policy and employees.  
* These uploaded records are internally tracked under the **“Track Claims”** section of the IIRM portal.

---

## **3\. Dashboard Claims Summary Widget**

Display policy-level claim statistics relevant to the logged-in employee and their dependents.

**Note:**

1. If multiple Policies available for the user show one below the other.  
2. For GTL and GPA policies do not show “Family members covered” section  
3. Do not show “hospital docs” which is shown in design  
4. If no claims available do not show the widget

---

#### **Claim Status Summary Bar**

| Item | Source System | Source Logic |
| :---- | :---- | :---- |
| **Total Claims** | IIRM Portal (Claims Upload Data) | Count of all claims synced for the employee \+ dependents |
| **Settled** | IIRM Portal | Count of claims where Claim Status \= "Settled" |
| **Pending** | IIRM Portal | Count of claims where Claim Status \= "Pending" |

#### **Policy Information**

| Item | Source System | Source Field |
| :---- | :---- | :---- |
| **Policy Number** | Policy Master (IIRM Portal) → Synced to Enrolment Portal | Policy Number |
| **Policy Expiry Date** | Policy Master (IIRM Portal) | Policy End Date |
| **Total Sum Insured (Policy Level)** | Policy Master | Total Sum Insured / Sum Insured |
| **Available Amount** | Derived (Enrolment Portal Calculation) | Total Sum Insured − Sum of Approved Claims |
| **Total Claimed Amount** | IIRM Portal (Claims data) | Sum(Claim Amount for all claims of employee \+ dependents) |

#### **Recent Claims List**

For each claim:

| Field | Source System | Source Field |
| :---- | :---- | :---- |
| **Name (Self / Dependent)** | IIRM Claims Data | Member Name / Dependent Name |
| **Claim Requested Date** | IIRM Claims Data | Claim Received Date |
| **Claim Amount** | IIRM Claims Data | Claim Amount |
| **Current Status** | IIRM Claims Data | Claim Status ( Status as per latest upload file) |
| **Claim Reference Number** | IIRM Claims Data | Claim No |

#### **Recent Claims List**

| Field | Source System | Source Field |
| :---- | :---- | :---- |
| **Family Members Covered** | IIRM Claims Upload data | Member Name / Dependent Name with relationship |

 

# **Claims Corner**

## **1\. Purpose**

The **Claims Corner** module provides employees with a detailed, policy-wise view of their insurance claim information and coverage utilization.

* Policy-level coverage and utilization data ( **Same Like Claims Summary Widget**)  
* Recent claim details for each member  
* Parental and Add-on policy utilization (for GMC only)  
* Premium summary across all plans

This section ensures complete transparency and gives employees a consolidated view of all active insurance coverages.

 

## **2\. Navigation Flow**

**Dashboard → Claims Corner Tab (Click) → Claims Corner Screen**

When users click on the claim corners tab from the Dashboard, they are redirected to the **Claims Corner** screen, where detailed information is displayed **policy-type-wise** (GMC, GPA, GTL). (Whichever are available)

 

## **3\. Screen Structure Overview**

The **Claims Corner** screen is divided into **three primary sections:**

1. **Policy Information & Coverage Utilization (Applicable for all policy types)**  
2. **Life Event Update (Dependent Update Card) ( Applicable for all the policies)**  
3. **Parental Policy & Add-on Coverage (Parent Policy is only for GMC)**  
4. **Premium Summary (Applicable for all policy types)**

 

## **4\. Section 1 – Policy Information & Coverage Utilization**

This section provides a detailed summary of claims and coverage for the selected policy type (GMC, GPA, GTL).  
For GMC, it includes both employee and dependent claims; for GPA and GTL, only employee data will be displayed.

( The section is same as the “Claims Summary”  widget on the dash board

 

## **5\. Section 2 – Life Event Update (Dependent Update Card show for all The Policy types)**

Encourages employees to update their dependents in case of a life event (e.g., marriage, childbirth, loss of a family member) under the **Group Mediclaim Policy (GMC)**. ( For now “Update Now CTA should be Clickable and navigate to In-Progress page)

 

## **6\. Section 3 – Parental Policy & Add-on Coverage ( Parental policy only in case of GMC)**

Displays additional insurance coverages linked to the employee’s policy — such as **Parental Policy** and **Other Add-ons**.

| Element | Description |
| :---- | :---- |
| **Parental Policy Card** | Displays parental medical coverage with total, claimed, and available limits. |
| **Other Add-on Card** | Shows per-day private room entitlement and available amount. |
| **Conditional Display** | Parental Policy appears only for GMC; Add-ons appear if mapped in policy. |

 

## **7\. Section 4 – Premium Summary**

Summarizes premium contribution details across all policies and add-ons applicable to the employee.

| Field | Description |
| :---- | :---- |
| **Total Premium** | Combined premium across all policies (GMC \+ GPA \+ GTL \+ add-ons). |
| **Company Contribution** | Amount paid by the employer. |
| **Employee Contribution** | Amount deducted from employee’s payroll. |
| **Total Tax** | Tax component on premium. |

