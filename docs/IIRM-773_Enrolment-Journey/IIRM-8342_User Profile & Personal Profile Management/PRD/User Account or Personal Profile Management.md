# **Product Requirements Document (PRD)**

**Module: User Profile & Personal Profile Management**

---

## **1\. Overview**

The User Profile Management module enables employees to view and manage their personal profile information. This includes basic demographic details, contact information, address details, and security settings such as password management. The module aims to provide a simple, secure, and self-service experience for employees to maintain accurate profile data.

---

## **2\. Objectives**

* Provide employees with a centralized view of their key profile details.  
* Enable employees to update specific personal information to ensure data accuracy.  
* Enhance security by allowing users to change their own passwords (in case of login if it includes password).  
* Ensure data integrity and validation across all editable fields.

---

## **3\. Scope**

**This PRD covers:**

* Viewing user profile details  
* Viewing contact details and add secondary contact details  
* Updating address details  
* Authentication & password change  
* Profile picture management

---

## **4\. Functional Requirements**

### **4.1 View User Profile**

**Description:**  
 **The system shall display all essential employee profile details in a read-only format.**

**Requirements:**

* The system shall display the following basic information:  
  * Full Name  
  * Date of Birth  
  * Gender  
  * Marital Status  
  * Designation  
* These fields shall not be editable.

---

### **4.2 View Contact Information**

**Description:**  
 The system shall display the user’s contact information in a read-only format. Users will not be allowed to edit or update these details.

**Requirements:**

* The system shall display the following contact details:  
  * Mobile Number  
  * Email ID  
* All contact fields shall be marked as non-editable.  
* The UI shall clearly indicate that contact details are view only and cannot be modified by the user.  
* The system shall handle the following states:  
  * Only phone number available  
  * Only email ID available  
  * Both phone number and email not available  
  * Both phone number and email available  
* User should be able to add secondary phone number and mail id  
  * Users should be able to edit these secondary contact details in the future.

---

### **4.3 Authentication & Security (Applicable for only Password-based logins)**

**Description:**  
 User Account – Change Password Access

**Requirements:**

* The “Change Password” option should be available only for users who have a password-based login enabled (e.g., Email \+ Password, Phone \+ Password, Employee Username \+ Password).

**Password Change Rules Enforcement:**

* If the user is eligible to change their password, the Change Password CTA should be displayed.  
* When changing the password, the system must enforce the password policy rules configured for that company (e.g., length, character type, uppercase, special characters, expiry).

---

### **4.4 Address Management**

**Description:**  
 Users shall be able to enter and maintain their address details in the system.

Requirements:

Initial Address Entry:

* For first-time users, the system shall prompt the user to enter both Current and Permanent addresses.  
* Address fields shall include:  
  * Address Line 1  
  * Address Line 2  
  * City  
  * State  
  * Country  
  * Pincode

**Address Validation:**

* **The system shall validate mandatory fields and pincode format before saving.**

**Address Management:**

* **Once added, the Current and Permanent addresses shall be visible in the Address section.**  
* **Users shall be able to update/change their addresses in the future.**

**Record Keeping:**

* **All address entries and updates shall be captured and stored in the backend, maintaining a history of changes.**

**Confirmation:**

* **The system shall display a confirmation message upon successful addition or update of address details.**

---

### **4.5 Profile Picture Management ( Provide only design, Development not required )**

**Description:**  
 **Users shall be able to upload, view, and update their profile pictures.**

**Requirements:**

* **Upload: Users can upload a profile image in supported formats (JPEG, PNG).**  
* **Validation:**  
  * **Maximum file size: 5 MB**  
  * **Supported file formats: JPG, JPEG, PNG**  
  * **Minimum image dimensions: 200x200 pixels**  
  * **Maximum image dimensions: 2000x2000 pixels**  
* **Preview: System shall allow users to preview the uploaded image before saving.**  
* **Update/Delete: Users can update or remove the existing profile picture.**  
* **Storage: Profile picture shall be stored securely in the backend and linked to the user profile.**  
* **UI Display: Profile picture shall be displayed on the user profile page in a standard format (circular or square) and shall automatically resize/crop to fit UI constraints.**  
* **Error Handling: The system shall display a clear error message for invalid file type, size, or dimensions.**

# **User Stories – User Profile & Personal Profile Management**

---

## **1\. View User Profile (Basic Details)**

### **User Story 1: View Basic Profile Details**

**As a user**,  
 I want to view my basic personal details in my profile,  
 so that I can verify that my core demographic information is accurate.

#### **Acceptance Criteria**

**Given** I am logged in to the portal  
 **When** I navigate to the User Profile screen  
 **Then** the system should display the following details in read-only mode:

* Full Name

* Date of Birth

* Gender

* Marital Status  
* Designation

**And** none of these fields should be editable  
 **And** the UI should clearly indicate that these fields are view-only

---

## **2\. View Contact Information**

### **User Story 2: View Primary Contact Information**

**As a user**,  
 I want to view my registered contact details,  
 so that I know which contact information is linked to my account.

#### **Acceptance Criteria**

**Given** I am on the User Profile screen  
 **When** my contact details are available  
 **Then** the system should display:

* Mobile Number (if available)

* Email ID (if available)

**And** all primary contact fields should be non-editable  
 **And** the UI should clearly label these fields as “View Only”

---

### **User Story 3: Handle Contact Information Availability States**

**As a user**,  
 I want the system to correctly display different contact availability states,  
 so that I clearly understand what contact information exists in my profile.

#### **Acceptance Criteria**

**Given** my profile has only a phone number  
 **Then** only the phone number should be displayed

**Given** my profile has only an email ID  
 **Then** only the email ID should be displayed

**Given** my profile has neither phone number nor email ID  
 **Then** the system should display a message:  
 “No primary contact details available.”

**Given** my profile has both phone number and email ID  
 **Then** both should be displayed

---

## **3\. Secondary Contact Information**

### **User Story 4: Add Secondary Contact Details**

**As a user**,  
 I want to add a secondary phone number and email ID,  
 so that alternate contact information is available if needed.

#### **Acceptance Criteria**

**Given** I am on the Contact Information section  
 **When** I click on “Add Secondary Contact”  
 **Then** the system should allow me to enter:

* Secondary Mobile Number

* Secondary Email ID

**And** the system should validate:

* Phone number format

* Email format

**When** I save valid secondary contact details  
 **Then** the system should store and display them successfully

---

### **User Story 5: Edit Secondary Contact Details**

**As a user**,  
 I want to update my secondary contact details,  
 so that I can keep them current.

#### **Acceptance Criteria**

**Given** secondary contact details already exist  
 **When** I edit and save updated values  
 **Then** the system should persist the latest information

**And** show a confirmation message:  
 “Secondary contact details updated successfully.”

---

## **4\. Authentication & Security – Change Password**

### **User Story 6: View Change Password Option**

**As a user**,  
 I want to see the Change Password option only when applicable,  
 so that the profile screen is relevant to my login method.

#### **Acceptance Criteria**

**Given** I am logged in using a password-based login method  
 **Then** the Change Password CTA should be visible

**Given** I am logged in using a non-password method (OTP / Google)  
 **Then** the Change Password CTA should not be displayed

---

### **User Story 7: Change Password**

**As a user**,  
 I want to change my password securely,  
 so that my account remains protected.

#### **Acceptance Criteria**

**Given** I am eligible to change my password  
 **When** I enter:

* Current Password

* New Password

* Confirm New Password

**Then** the system should validate:

* Current password correctness

* Password policy rules (length, complexity, expiry)

* New password ≠ current password

* New password matches confirmation

**When** validation succeeds  
 **Then** the password should be updated securely

**And** the system should show confirmation:  
 “Your password has been changed successfully.”

---

## **5\. Address Management**

### **User Story 8: Add Address for First-Time Users**

**As a user**,  
 I want to add my current and permanent addresses,  
 so that my address information is available in the system.

#### **Acceptance Criteria**

**Given** I am a first-time user without address details  
 **When** I access the Address section  
 **Then** the system should prompt me to enter:

* Current Address

* Permanent Address

**And** both addresses should include:

* Address Line 1

* Address Line 2

* City

* State

* Country

* Pincode

---

### **User Story 9: Validate Address Details**

**As a user**,  
 I want my address details to be validated before saving,  
 so that incorrect data is not stored.

#### **Acceptance Criteria**

**Given** I attempt to save address details  
 **When** mandatory fields are missing or pincode format is invalid  
 **Then** the system should display inline validation errors

**When** all validations pass  
 **Then** the system should allow saving

---

### **User Story 10: Update Address Details**

**As a user**,  
 I want to update my current or permanent address,  
 so that my address remains accurate.

#### **Acceptance Criteria**

**Given** address details already exist  
 **When** I update and save changes  
 **Then** the system should persist the updated address

**And** display confirmation:  
 “Address details updated successfully.”

---

### **User Story 11: Maintain Address History**

**As a system**,  
 I want to maintain a history of address changes,  
 so that audit and tracking requirements are met.

#### **Acceptance Criteria**

**Given** a user adds or updates address details  
 **Then** the system should store:

* Previous address values

* Updated address values

* Timestamp of change

---

## **6\. Profile Picture Management (Design Only)**

### **User Story 12: Upload Profile Picture**

**As a user**,  
 I want to upload a profile picture,  
 so that my profile is visually identifiable.

#### **Acceptance Criteria**

**Given** I choose an image to upload  
 **When** the image meets format, size, and dimension requirements  
 **Then** the system should allow preview before saving

**When** I save the image  
 **Then** it should be displayed on my profile page

---

### **User Story 13: Validate Profile Picture Upload**

**As a user**,  
 I want clear validation messages for invalid images,  
 so that I know how to correct the issue.

#### **Acceptance Criteria**

**Given** the selected image exceeds 5 MB  
 **Then** the system should show:  
 “Maximum file size allowed is 5 MB.”

**Given** the file format is unsupported  
 **Then** the system should show:  
 “Only JPG, JPEG, and PNG formats are allowed.”

**Given** image dimensions are outside allowed limits  
 **Then** the system should show an appropriate error message

---

### **User Story 14: Update or Remove Profile Picture**

**As a user**,  
 I want to update or remove my profile picture,  
 so that my profile reflects my current preference.

#### **Acceptance Criteria**

**Given** a profile picture already exists  
 **When** I update or delete it  
 **Then** the system should reflect the change immediately

