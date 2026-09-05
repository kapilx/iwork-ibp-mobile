# **Product Requirements Document (PRD)**

**Module: User Profile & Personal Profile Management**

---

## **1\. Overview**

**The User Profile Management module enables employees to view and manage their personal profile information. This includes basic demographic details, contact information, address details, and security settings such as password management. The module aims to provide a simple, secure, and self-service experience for employees to maintain accurate profile data.**

---

## **2\. Objectives**

* **Provide employees with a centralized view of their key profile details.**  
* **Enable employees to update specific personal information to ensure data accuracy.**  
* **Enhance security by allowing users to change their own passwords.**  
* **Ensure data integrity and validation across all editable fields.**

---

## **3\. Scope**

**This PRD covers:**

* **Viewing user profile details**  
* **Viewing contact details**  
* **Updating address details**  
* **Authentication & password change**

---

## **4\. Functional Requirements**

---

### **4.1 View User Profile**

**Description:**  
 **The system shall display all essential employee profile details in a read-only format.**

**Requirements:**  
 **The system shall display the following basic information:**

* **Full Name**  
* **Date of Birth**  
* **Gender**  
* **Marital Status**

**These fields should not be allowed to edit.**

---

### **4.2 View Contact Information**

**Description:**  
 **The system shall display the user’s contact information in a read-only format. Users will not be allowed to edit or update these details.**

**Requirements:**  
 **The system shall display the following contact details:**

* **Mobile Number**  
* **Email IDAll contact fields shall be marked as non-editable.**  
   **The UI shall clearly indicate that contact details are view only and cannot be modified by the user.**

---

### **4.3 Authentication & Security**

**Description:**  
 **The system shall empower users to securely manage their login credentials.**

---

#### **Password Reset Requirements**

* **The “Forgot Password” option shall be displayed only if the tenant has at least one password-based login method enabled.**

* **The user shall initiate password reset by entering their registered email ID or phone number, depending on the tenant’s enabled login methods.**

##### **Email-Based Password Reset**

* **If the user initiates reset using email, the system shall send a secure, time-bound password reset link to the registered email.**  
* **When the user clicks the reset link, they shall be redirected to the Set New Password page.**  
* **The user shall set a new password after completing all validations.**

##### **Phone-Based Password Reset**

* **If the user initiates reset using phone number, the system shall send a 6-digit OTP to the registered mobile number.**  
* **The user must enter and verify the OTP.**  
* **Upon successful OTP validation, the system shall allow the user to set a new password.**

##### **Common Reset Rules**

* **Password reset link / OTP shall expire after a configurable time period (e.g., 15 min for link, 5 min for OTP).**  
* **The user shall be allowed to set a new password only after successful verification (valid link or OTP).**  
* **The system shall validate the new password as per the configured password policy (minimum length, character complexity, previous password restriction).**  
* **The system shall require the user to confirm the new password before submission.**  
* **Upon successful password reset, all active sessions for the user shall be logged out (recommended).**  
* **The system shall send a notification (email or SMS) confirming successful password reset.**  
* **All password reset attempts (successful and failed) shall be logged for audit.**

---

#### **Change Password Requirements**

* **The user shall be able to change their password from within the logged-in session.**  
* **Changing the password shall redirect the user to the Change Password screen.**

**The user must enter:**

* **Current Password**  
* **New Password**  
* **Confirm New Password**  
* **The system shall validate the current password before accepting the new password.**  
* **The new password must comply with the password policy configured for the tenant.**  
* **The system may optionally require OTP validation before changing the password (TBD — needs discussion).**

**Upon successful password change:**

* **The new password shall be updated.**  
* **All active sessions may be logged out (recommended).**  
* **The user shall receive a change confirmation notification (email/SMS).**

---

### **4.4 Address Management**

**Description:**  
 **Users shall be able to maintain accurate address details.**

**Requirements:**  
 **The system shall allow users to update:**

* **Current Address**  
* **Permanent Address**

**Address update fields may include:**

* **Address Line 1**  
* **Address Line 2**  
* **City**  
* **State**  
* **Country**  
* **Pincode**

**The system shall provide validation for pincode and mandatory fields.**  
 **The system shall store both addresses independently.**  
 **The user shall be shown a confirmation message upon successful update.**

