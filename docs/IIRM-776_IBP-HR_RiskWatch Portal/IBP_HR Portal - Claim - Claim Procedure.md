# **PRD: Claim Procedure Module**

---

# **1\. Objective**

To provide users (HR and Employees) with a **clear, step-by-step guided process** for completing both **Cashless and Reimbursement claims**, ensuring better understanding, reduced errors, and improved claim success rates through structured instructions, document guidance, and support information.

---

# **2\. Functional Requirements**

---

## **2.1 Navigation & Access**

* Claim Procedure module should be available under:  
  * Claims section  
* On click:  
  * Open a dedicated **Claim Procedure screen**

---

## **2.2 Claim Type Toggle**

* Provide toggle option:  
  * Cashless  
  * Reimbursement  
* Default selection:  
  * Configurable  
* On toggle:  
  * Display respective process steps

---

## **2.3 Claim Process Steps**

---

### **2.3.1 Cashless Claim Process**

| Step \# | Step Name | Description | Note |
| ----- | ----- | ----- | ----- |
| 1 | Get Admitted to a Network Hospital | Visit a TPA-empanelled network hospital. Present your Insurance E-Card or policy number at the insurance / billing desk on arrival. Confirm the hospital is covered under your policy before admission. | Search network hospitals by clicking on Hospital Network |
| 2 | Hospital Sends Cashless Request to TPA | The hospital's billing team submits a Pre-Authorisation (PA) request to the TPA on your behalf, sharing diagnosis details, estimated cost, and treating doctor's information. | For planned procedures, ensure the request is sent at least 48 hours in advance. For emergencies, within 24 hours of admission. |
| 3 | Coordinate with Customer Service Team | The TPA's customer service team may reach out to you or your employer's HR for additional information — employment verification, previous medical history, or policy clarifications. | Keep your Employee ID and policy number handy. HR will be notified in parallel. |
| 4 | TPA Authorises Cashless | After reviewing the request, the TPA issues a Cashless Authorisation Letter specifying the approved amount. Non-medical and excluded charges are flagged for direct payment by you. | Review the letter carefully. You can request enhancement if the cost exceeds the initial estimate. |
| 5 | Avail Treatment & Discharge | Receive treatment as approved. At discharge, review the final bill, sign it, and pay only the non-admissible portion (co-pay, consumables, registration charges, etc.). | Always collect the discharge summary, original bills, and pharmacy receipts — even for cashless claims. |
| 6 | Hospital Sends Final Bill to TPA | Post-discharge, the hospital submits the complete itemised bill along with medical records to the TPA for final settlement. This process is managed entirely by the hospital. | Track this step in the HR portal under Claims → Process Claim. Any shortfall will be communicated to you. |
| 7 | TPA Processes Claim & Pays Hospital | The TPA verifies the final documents, applies policy deductions, and releases payment directly to the hospital. A settlement advice is sent to you and your HR team. | Disputes on deductions can be raised within 30 days of the settlement advice. |

---

### **2.3.2 Reimbursement Claim Process**

| Step \# | Step Name | Description | Note |
| ----- | ----- | ----- | ----- |
| 1 | Intimate Claim to TPA | Notify the TPA within 24 hours of discharge via the HR portal (Claims → Intimate Claim) or by calling the helpline. Provide your Employee ID, hospital name, and estimated treatment cost. | Late intimation can result in partial or full denial of the claim. Do not delay. |
| 2 | Get Admitted & Pay for Treatment | Receive treatment at any hospital — network or non-network. Pay all bills upfront and collect every original document: bills, receipts, discharge summary, lab reports, and doctor certificates. | Non-network hospitals are eligible for reimbursement only — cashless is not available. |
| 3 | Submit Claim Documents to TPA | Complete the claim form and submit all original documents to the TPA within 15 days of discharge. Documents can be submitted physically at the TPA office or via the HR portal. | Photocopies are not accepted. Ensure all originals are intact and the claim form is signed and dated. |
| 4 | TPA Scrutinises Claim | The TPA reviews the documents for medical necessity, policy coverage, and excluded expenses. They may raise queries requiring additional information or clarification from you. | Respond to any TPA query within 7 days to avoid delays or denial. |
| 5 | Coordinate with Customer Support | If a query is raised, the TPA's support team will contact you or HR. Provide the requested information promptly — additional records, prescriptions, or clarifications. | HR can assist with escalation if the query response window is critical. |
| 6 | Claim Approved | Once satisfied with the documents, the TPA approves the admissible claim amount, applies deductions for excluded expenses, and generates a settlement advice for your records. | The approval amount may differ from the claimed amount due to policy sub-limits or exclusions. |
| 7 | Amount Transferred to Bank Account | The approved amount is credited to your registered bank account via NEFT within 3–5 working days of approval. A payment confirmation is sent to your registered email. | Ensure your bank details in the employee portal are up to date to avoid failed transfers. |

---

## **2.4 Helpline & Escalation**

* Display:  
  * Primary Escalation *(Source: Contact Matrix)*  
  * Secondary Escalation *(Source: Contact Matrix)*

---

## **2.5 Download Forms**

* Cashless Claim Form  
* Reimbursement Claim Form  
* Pre-Auth Request Form  
* Grievance Redressal Form

---

## **2.6 Document Checklist**

* Completed claim form (signed & dated)  
* Original hospital bills & receipts  
* Discharge summary with ICD-10 diagnosis  
* Treating doctor's certificate of illness  
* Lab / investigation reports (original)  
* Original pharmacy bills with prescription  
* Cancelled cheque or bank passbook copy  
* Employee ID / policy copy

---

# **3\. Business Rules**

* Content must be configurable via CMS  
* Steps must not be altered in structure or wording  
* Toggle should dynamically switch claim types  
* Escalation contacts must be configurable  
* Forms must be downloadable  
* This module is informational (no transactions)

---

# **4\. User Stories & Acceptance Criteria**

---

## **User Story 1: View Claim Procedure**

**As a user,**  
 I want to view claim procedures,  
 so that I understand the claim process

**Acceptance Criteria**

* **Given** user opens module  
* **When** screen loads  
* **Then** system displays claim steps

---

## **User Story 2: Toggle Claim Type**

**As a user,**  
 I want to switch between claim types,  
 so that I can view relevant process

**Acceptance Criteria**

* **Given** user is on screen  
* **When** toggle is changed  
* **Then** system displays respective steps

---

## **User Story 3: View Support Information**

**As a user,**  
 I want to view escalation contacts,  
 so that I can seek help

**Acceptance Criteria**

* **Given** contact matrix exists  
* **When** screen loads  
* **Then** escalation contacts are displayed

---

## **User Story 4: Download Forms**

**As a user,**  
 I want to download claim forms,  
 so that I can submit claims

**Acceptance Criteria**

* **Given** forms are available  
* **When** user clicks download  
* **Then** form is downloaded

---

## **User Story 5: View Document Checklist**

**As a user,**  
 I want to view required documents,  
 so that I can ensure complete submission

**Acceptance Criteria**

* **Given** checklist exists  
* **When** user views section  
* **Then** all required documents are displayed 

