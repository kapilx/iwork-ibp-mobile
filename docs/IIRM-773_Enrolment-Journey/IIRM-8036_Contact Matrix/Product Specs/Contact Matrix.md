# **Product Requirements Document (PRD)**

## **Module: Contact Matrix Configuration**

---

## **1\. Overview**

The Contact Matrix is a centralized, policy-specific list of escalation contact persons displayed to Employees (end users) in the policyholder portal.

Each policy can have different escalation contacts for **TPA** and **Insurer**. Only **contact person–level details** are supported (phone and email), with **primary (L1)** and **next-level (L2)** escalation.

This PRD defines the requirements for configuring, storing, and displaying Contact Matrix details through the **Portal Configuration** section within **Policy Details**.

---

## **2\. Objective**

To enable administrators to:

* Configure **policy-specific contact persons** for TPA and Insurer  
* Define **Primary (L1)** and **Secondary (L2)** escalation levels  
* Configure **phone number (mandatory)** and **email (optional)** per contact person  
* Ensure contacts are selectable from master contact person tables  
* Make this information available to employees under  “**Customer Care”**

---

## **3\. Entry Point**

**Admin Portal Navigation:**  
Manage Policies → Policy Details → **Portal Configuration** Tab

A new tile **“Contact Matrix”** will be available (similar to Hospital Network, FAQs, Policy Features).

---

## **4\. Scope**

### **In-Scope**

* New **Contact Matrix** tile under Portal Configuration  
* Admin functionality to **add / update / view** contact matrix per policy  
* Configuration limited to:  
  * **TPA Contact Person – Phone & Email (L1 & L2)**  
  * **Insurer Contact Person – Phone & Email (L1 & L2)**  
* Selection of contact persons from **respective master contact person tables**  
* Create / Edit contact persons via redirection from configuration screen  
* Creation of Contact person via redirection  
* Read-only display of configured contacts in Employee Portal

---

## **5\. User Roles**

### **Super Admin (IIRM User)**

* Can configure and update contact matrix per policy  
* Can create or edit contact persons via redirection to master contact screens

### **Employee / End User**

* Can only **view** configured contact matrix  
* No edit access

---

## **6\. Functional Requirements**

### **6.1 Contact Matrix Tile (Admin Portal)**

**Tile Details:**

* Title: Contact Matrix  
* Last Updated (timestamp)  
* Updated By (Admin name)  
* Status:  
  * Configured  
  * Not Configured

**Actions:**

* Configure – shown when no data exists  
* View / Edit – shown when data exists  
* View screen must display an **Edit CTA** on the top-right

---

### **6.2 Configuration Screen – Fields & Rules**

#### **TPA Contact Person**

| Field | Escalation Level | Mandatory | Notes |
| ----- | ----- | ----- | ----- |
| Contact Person (Dropdown) | Primary (L1) | Yes | Select from TPA Contact Person master |
| Phone Number | Primary (L1) | Yes | Auto-filled from master |
| Email | Primary (L1) | No | Auto-filled from master |
| Contact Person (Dropdown) | Secondary (L2) | Yes | Select from TPA Contact Person master |
| Phone Number | Secondary (L2) | Yes | Auto-filled from master |
| Email | Secondary (L2) | No | Auto-filled from master |

---

#### **Insurer Contact Person**

| Field | Escalation Level | Mandatory | Notes |
| :---- | :---- | :---- | :---- |
| Contact Person (Dropdown) | Primary (L1) | Yes | Select from Insurer Contact Person master |
| Phone Number | Primary (L1) | Yes | Auto-filled from master |
| Email | Primary (L1) | No | Auto-filled from master |
| Contact Person (Dropdown) | Secondary (L2) | Yes | Select from Insurer Contact Person master |
| Phone Number | Secondary (L2) | Yes | Auto-filled from master |
| Email | Secondary (L2) | No | Auto-filled from master |

---

### **6.3 Dropdown & Contact Management Behavior**

**Note:** Create and Edit actions do not happen inline on the Contact Matrix screen. The configuration screen only provides redirection. All create/edit actions are performed on the respective Contact Create/Edit screens.

#### **Contact Selection**

* User selects a **Contact Person** from a dropdown  
* Dropdown is populated from the **respective master contact person tables**:  
  * TPA Contact Person Master  
  * Insurer Contact Person Master  
* On selection, **Name, Phone Number, and Email** auto-fill

#### **Create Contact Person**

* If the desired contact person is **not available** in the dropdown:  
  * User Creates on “Create CTA  
  * Clicking **Create** redirects the user to the **Contact Listing / Create screen** of the respective entity  
  * User can add:  
    * Name  
    * Phone Number  
    * Email  
  * On save:  
    * Contact is stored in the master table  
    * User is redirected back to Contact Matrix configuration  
    * Newly created contact appears in the dropdown

#### **Edit Contact Person**

* If the selected contact person exists but:  
  * Phone number is missing or incorrect, or  
  * Email is missing or incorrect  
* User can click **“Edit” CTA**  
* System redirects to the same **Contact Edit screen**  
* After saving updates:  
  * Master table is updated  
  * User is redirected back  
  * Updated values are reflected automatically

---

### **6.4 Validation Rules**

* Phone number: Mandatory, numeric, length as per system standard  
* Email: Optional, valid email format  
* L1 and L2 contact persons must be selected independently

---

## **7\. Employee Portal Display**

### **Visibility**

* Read-only  
* Policy-specific

### **Fields Displayed**

#### **TPA**

* Contact Person Phone – L1 (mandatory)  
* Contact Person Phone – L2 (mandatory)  
* Contact Person Email – L1 (optional)  
* Contact Person Email – L2 (optional)

#### **Insurer**

* Contact Person Phone – L1 (mandatory)  
* Contact Person Phone – L2 (mandatory)  
* Contact Person Email – L1 (optional)  
* Contact Person Email – L2 (optional)

### **Display Format**

* Clearly grouped by:  
  * TPA  
  * Insurer  
* Each group shows:  
  * Primary Escalation (L1)  
  * Next-Level Escalation (L2)  
* All fields displayed as **read-only**

