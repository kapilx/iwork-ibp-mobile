# **1\. Purpose**

To provide a **Documents** tab inside the **Policy Details** page that displays all documents uploaded during the **Inception** and **Endorsement** stages of a policy.  
 This ensures users can view and download all policy-related files from one place.

---

# **2\. Scope**

### **In Scope**

* Add a **Documents** tab under Policy Details.

* Retrieve and display documents uploaded during:

  * Group Policy Inception stages

  * Group Policy Endorsement stages

  * Non-Group Policies (same fields except TPA ID Upload does not apply)

* Display a unified table with these columns:  
   **OS Ticket Number | File Name | Document Type | Activity Name | Uploaded By | Uploaded Date | Download**

* Provide single file download per row.

* Show an empty state when no records exist.

* Use existing document-service APIs.

---

# **3\. Functional Requirements**

### **FR-001: Consolidated Document Retrieval**

System must fetch all documents linked to the policy ID across all stages (inception \+ endorsement).

### **FR-002: Document Listing Table**

The table must include the following columns in order:

1. OS Ticket Number

2. File Name

3. Document Type

4. Activity Name

5. Uploaded By

6. Uploaded Date

7. Download

### **FR-003: File Download**

Each document row must show a download icon/button using the document-service download API.

### **FR-004: Empty State**

When there are zero documents, display:  
 **"No documents available for this policy."**

### **FR-005: Stage-to-Document Type Mapping**

Document Type and Activity Name must follow the mapping below for **Group Policies**.

### **FR-006: Non-Group Policy Handling**

* All fields and mappings remain the same as Group Policies.

* **TPA ID Upload stage does NOT apply for Non-Group Policies.**

### **FR-007: Activity Click Navigation**

When a user clicks on the "Activity Name" value in any row, the system must redirect the user to the corresponding activity detail view within the Inception or Endorsement workflows for that policy, based on the mappings defined below.

---

## **Activity Name & Document Type Mapping**

### **A. Group Policies – Inception Stages**

| Activity Name | Document Type |
| ----- | ----- |
| Inception Request Received | Inception Document |
| Send Inception to Insurer | Inception Document |
| Receive Acknowledgement from Insurer | Insurer Acknowledgement Document |
| Client Confirmation | Inception Document |
| Client Confirmation | Insurer Acknowledgement Document |
| TPA ID Upload | **TPA ID Document** |

---

### **B. Group Policies – Endorsement Stages**

| Activity Name | Document Type |
| ----- | ----- |
| Endorsement Request Received | Endorsement Document |
| Send Endorsement to Insurer | Endorsement Document |
| Receive Acknowledgement from Insurer | Insurer Acknowledgement Document |
| Client Confirmation | Endorsement Document |
| Client Confirmation | Insurer Acknowledgement Document |
| TPA ID Upload | **TPA ID Document** |

