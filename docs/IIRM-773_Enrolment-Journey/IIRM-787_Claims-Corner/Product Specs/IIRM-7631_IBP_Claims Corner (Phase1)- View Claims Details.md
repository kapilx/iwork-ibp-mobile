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

Claim data is periodically shared by TPA in an Excel file containing details of all claims for all employees covered under a policy.

### **Step 2: Claim Upload in IIRM Portal**

* User uploads the received file into the **IIRM → Claims Upload** section (already implemented).  
* The IIRM portal stores all uploaded claims and links them to the corresponding policy and employees.  
* These uploaded records are internally tracked under the **“Track Claims”** section of the IIRM portal.

---

## **3\. Dashboard Claims Summary Widget**

Display policy-level claim statistics relevant to the logged-in employee and their dependents.

**Note:**

1. If multiple Policies available for the user show multiple policies as per the design 
2. For GTL and GPA policies do not show “Family members covered” section  
3. Do not show “hospital docs” which is shown in design  
4. If no claims available show the empty state as shown in the design
5. If the GMC policy and if the parent plan is available show on the same card divided with saperate biferfication of calculations (Follow design)
6. Sum Insured and other fields for Base vs add on policies should be combine.

---

#### **Claim Status Summary Bar**

| Item | Source System | Source Logic |
| :---- | :---- | :---- |
| **Total Claims** | Claims Table| Count of all claims synced for the employee \+ dependents |
| **Settled** | Claims Table | Count of claims where Claim Status \= "Settled" |
| **Pending** | Claims Table | Count of claims where Claim Status \= "Pending" |

#### **Policy Information**

| Item | Source System | Source Field |
| :---- | :---- | :---- |
| **Policy Number (Per plan)** | Policy Table| Policy Number |
| **Policy Expiry Date** | Policy Table| Policy End Date |
| **Total Sum Insured (Policy Level)** | Policy Table | Total Sum Insured / Sum Insured |
| **Policy Type (Base vs Parent)** | Claims Data File | Policy Type (Base/Parent) |
| **Available Amount** | Claims Table| Available Amount (Total Sum Insured − Sum of Approved Claims) |
| **Total Claimed Amount** |Claims Table| Sum(Claim Amount for all claims of employee \+ dependents) |

#### **Recent Claims List**

For each claim:

| Field | Source System | Source Field |
| :---- | :---- | :---- |
| **Name (Self / Dependent)** | Claims Data File| Member Name / Dependent Name |
| **Claim Requested Date** | Claims Data File | Claim Received Date |
| **Claim Amount** | Claims Data File | Claim Amount |
| **Current Status** |Claims Data File | Claim Status ( Status as per latest upload file) |
| **Claim Reference Number** | IIRM Claims Data | Claim No |

#### **Recent Claims List**

| Field | Source System | Source Field |
| :---- | :---- | :---- |
| **Family Members Covered** |As per Enrolment| Member Name / Dependent Name with relationship |




 

# **Claims Corner**

## **1\. Purpose**

The **Claims Corner** module provides employees with a detailed, policy-wise view of their insurance claim information and coverage utilization.


This section ensures complete transparency and gives employees a consolidated view of all active insurance coverages.

 

## **2\. Navigation Flow**

**Dashboard → Claims Corner Tab (Click) → Claims Corner Screen**

When users click on the claim corners tab from the Dashboard, they are redirected to the **Claims Corner** screen, where detailed information is displayed **policy-type-wise** (GMC, GPA, GTL). (Whichever are available)

 

## **3\. Screen Structure Overview**

The **Claims Corner** screen is divided into **three primary sections:**

1. **Policy Information & Coverage Utilization (Applicable for all policy types)**  
2. **Life Event Update (Dependent Update Card) ( Applicable for all the policies)**  
3. **Parental Policy**

### Future Compatibility

- Optional plans will be implemented in next phases. The system should be designed to accommodate optional plan configurations and display without structural changes to the widget/cards.

### Display Ordering & Layout (GMC)

- Order: Always show Base GMC policy card first, followed by Parent Policy card.
- Layout: As per the design.
- Data Separation: Each card must use its own policy dataset and calculations, with no mixing across cards.

 

## **4\. Section 1 – Policy Information & Coverage Utilization**

This section provides a detailed summary of claims and coverage for the selected policy type (GMC, GPA, GTL).  
For GMC, it includes both employee and dependent claims; for GPA and GTL, only employee data will be displayed.

( The section is same as the “Claims Summary”  widget on the dashboard)




## **5\. Section 2 – Life Event Update (Dependent Update Card show for all The Policy types)**

Encourages employees to update their dependents in case of a life event (e.g., marriage, childbirth, loss of a family member) under the **Group Mediclaim Policy (GMC)**. ( For now “Update Now CTA should be Clickable and navigate to In-Progress page)

 

## **6\. Section 3 – Parental Policy ( Parental policy only in case of GMC)**

### Parental Policy Card (GMC only) - Show same like base policy but for the parent plan, all the calculations should be saperate for the Parent policy. 
Same like depect in the design



