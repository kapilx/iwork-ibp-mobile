# **Authorization Configuration – PRD**

**IBP (IIRM Corporate Client Portal)**

---

## **1\. Overview**

IIRM provides a client-specific Insurance Benefits Portal (IBP) for multiple corporate customers. Each corporate client requires unique authentication rules based on their internal IT and security policies.

The **Authorization Configuration** module allows each corporate tenant to configure which authentication methods their employees can use to access the portal.

This PRD defines:

* Supported authentication methods  
* End-to-end flows (first-time password creation, login, password reset, OTP login)  
* Configurable items  
* Validations and edge cases

---

## **2\. Authentication Methods Supported**

A tenant can enable one or more of the following:

**Primary Authentication Methods:**

* Email \+ Password  
* Email \+ OTP  
* Phone Number \+ Password  
* Phone Number \+ OTP  
* Universal URL Default Login (Username = Employee ID, Password = Date of Birth)

**Secondary / Strong Authentication:**

* Multi-Factor Authentication – Email (Email \+ Password \+ OTP)  
* Multi-Factor Authentication – Phone (Phone \+ Password \+ OTP)

**Third-Party Authentication:**

* Google Authentication (OAuth)

**Note:** Conflicting combinations are restricted (see Validations section).

---

## **3\. Authentication Configuration Options (Per Login Method)**

### **3.1 Email \+ Password Login (with MFA Settings)**

| Section | Parameter | Control Type | Options / Description |
| ----- | ----- | ----- | ----- |
| Login Method (Tab Option) | Email \+ Password Login | Tab | Appears as one of the authentication method tabs along with OTP Login, MFA, SSO, etc. |
| **Password Policy** | Minimum Password Length | Dropdown | 4–20 characters |
|  | Character Type | Dropdown | Numbers / Alphabets / Alphanumeric |
|  | Uppercase Requirement | Dropdown | None / First Character Uppercase / Last Character Uppercase |
|  | Special Character Requirement | Dropdown | Allowed set: \! @ \# $ % ^ & \* |
| Password Expiry | Expiry Duration | Dropdown | 30 / 60 / 90 / 120 days |
| **Change Password Policy** | Require Old Password to Change Password | Dropdown | Yes / No |
| **Session Timeout** | Timeout Duration | Dropdown | 15 / 20 / 25 / 30 / 35 / 40 / 45 / 50 / 55 / 60 minutes |
| **MFA Settings** | Enable MFA After Password Login | Dropdown | Yes / No |
|  | MFA Behavior (auto) | Derived Rule | If Yes, enforce OTP validation via user’s registered Mail after password login. |

---

### **3.2 Email \+ OTP Login (Passwordless)**

| Section | Parameter | Control Type | Values / Options |
| ----- | ----- | ----- | ----- |
| Login Method (Tab Option) | Enable Email \+ OTP Login | Toggle / Tab Selection | ON / OFF |
| **OTP Configuration** | OTP Validity Duration | Dropdown | 2, 3, 4, 5, 6, 7, 8, 9, 10 minutes |
|  | OTP Resend Cooldown | Dropdown | 30 sec / 60 sec / 90 sec / 120 sec |
| **Session Settings** | Session Timeout | Dropdown | 15 min / 30 min / 60 min |

---

### **3.3 Phone Number \+ Password Login (with MFA Logic)**

| Section | Parameter | Control Type | Values / Options |
| ----- | ----- | ----- | ----- |
| Login Method (Tab Option) | Phone Number \+ Password Login | Tab Selection | Appears as one of the authentication method tabs (Email+Password, Email+OTP, Phone+Password, MFA, SSO, etc.) |
| **Password Policy** | Minimum Password Length | Dropdown | 4–20 characters |
|  | Character Type | Dropdown | Numbers / Alphabets / Alphanumeric |
|  | Uppercase Requirement | Dropdown | None / First Letter Uppercase / Last Letter Uppercase |
|  | Special Characters | Dropdown | \! @ \# $ % ^ & \* |
| Password Expiry | Expiry Duration | Dropdown | 30 / 60 / 90 / 120 days |
| **Session Settings** | Session Timeout | Dropdown | n15 / 30 / 60 minutes |
| **MFA Settings** | Enable MFA After Password Login | Dropdown | Yes / No |
|  | If MFA \= Yes → OTP Validation Required | Derived Rule | System-triggered OTP to phone |

---

### **3.4 Phone Number \+ OTP Login**

| Section | Parameter | Control Type | Values / Options |
| ----- | ----- | ----- | ----- |
| Login Method (Tab Option) | Phone Number \+ OTP Login | Tab Selection | Appears as one of the authentication method tabs (Email+Password, Email+OTP, Phone+Password, Phone+OTP, MFA, SSO, etc.) |
| **OTP Configuration** | OTP Validity Duration | Dropdown | 2, 3, 4, 5, 6, 7, 8, 9, 10 minutes |
|  | Resend OTP Cooldown | Dropdown | 30 sec / 60 sec / 90 sec / 120 sec |
| **Session Settings** | Session Timeout | Dropdown | 15 / 30 / 60 minutes |

---

### **3.5 Google Authentication (OAuth) — Simplified**

| Setting | Description | Values / Options |
| ----- | ----- | ----- |
| Enable Google OAuth Login | Enable or disable Google sign-in for users | Yes / No |
| Session Timeout | Auto-logout duration after inactivity | 15 / 30 / 60 mins |

---

### **3.6 Universal URL Default Login (Username = Employee ID, Password = Date of Birth)**

**Use Case**  
This authentication method is designed for companies that:
* Do not require specific portal customization
* Want to use a universal URL for employee access
* Prefer simple, standardized authentication without complex configuration
* Need immediate access without extensive setup

**Authentication Details**
* **Username**: Employee ID (as stored in Employee Master)
* **Password**: Employee Date of Birth (YYYY-MM-DD format)
* **Configuration**: No settings required - works with default system parameters

---

## **4\. Detailed Process Flow (Employee Login)**

### **4.1 Email \+ Password**

### **4.1.1 First-Time Password Creation / Reset Password**

**Trigger Scenarios**

* First-time user account activation  
* User-initiated password reset

**Flow Steps**

1. User enters their **registered email address**.  
2. System validates:  
   * Email format is valid.  
   * Email exists and is active in the system.  
3. If valid, system generates a **secure, time-bound password reset token**.  
4. System sends a **Password Reset email** containing a reset link.  
   * Link validity: configurable (e.g., 15–30 minutes).  
5. User clicks the reset link.  
6. System validates:  
   * Token authenticity.  
   * Token expiry.  
   * Token not previously used.  
7. User is redirected to the **Create / Reset Password screen**.  
8. User enters:  
   * New Password  
   * Confirm Password  
9. System validates password against configured **password policy**:  
   * Minimum length  
   * Uppercase, lowercase, numeric, special character rules  
   * No reuse of last *N* passwords (if applicable)  
10. On successful validation:  
    * Password is securely updated.  
    * Reset token is invalidated.  
    * All existing active sessions for the user are logged out.

11. System displays confirmation message:  
    * **“Your password has been successfully reset.”**  
12. User is redirected to the **Login screen**.

**Failure Scenarios**

* Invalid or expired reset link → show “Link expired. Please request a new reset link.”  
* Password policy violation → show inline validation errors.

---

### **4.1.2 Login**

**Flow Steps**

1. User enters:  
   * Email  
   * Password  
2. System validates:  
   * Email exists and account is active.  
   * Password matches stored credentials.  
3. If credentials are valid:  
   * Login is successful.  
   * User is redirected to the authorized landing page.  
4. If credentials are invalid:  
   * System displays error:  
     * **"Invalid email or password."**

---

### **4.2 Email \+ OTP**

**Flow Steps**

1. User enters their **registered Email ID** on the login screen.  
2. User clicks **“Get OTP”**.  
3. System validates:  
   * Email format is valid.  
   * Email exists and the account is active.  
4. If the email does not exist:  
   * System displays error message:  
     * **“Email ID not found. Please check and try again.”**  
5. If the email is valid:  
   * System generates a **secure, time-bound OTP**.  
   * OTP is sent to the user’s registered email address.  
   * System displays message:  
     * **“An OTP has been sent to your registered email.”**  
6. User enters the received **OTP**.  
7. System validates:  
   * OTP correctness.  
   * OTP expiry.  
   * OTP has not been previously used.  
8. If OTP is valid:  
   * Login is successful.  
   * OTP is invalidated.  
   * User is redirected to the authorized landing page.  
9. If OTP is invalid or expired:  
   * System displays error message:  
     * **“Invalid or expired OTP. Please try again.”**  
   * User is given an option to **Request New OTP**.

---

### **4.3 Phone Number \+ Password**

### **4.3.1 First-Time Password Creation / Reset Password (Phone \+ OTP)**

**Trigger Scenarios**

* First-time user onboarding  
* User-initiated password reset  
* Admin-forced password reset

**Flow Steps**

1. User enters **registered phone number**.  
2. System validates:  
   * Phone number format.  
   * Phone number exists and is active in the system.  
3. If the phone number does not exist:  
   * System displays error:  
     * **“Phone number not found. Please check and try again.”**

4. If valid:  
   * System generates a **secure, time-bound OTP**.  
   * OTP is sent to the registered phone number via SMS.  
5. User enters the received **OTP**.  
6. System validates:  
   * OTP correctness.  
   * OTP expiry.  
   * OTP has not been previously used.  
7. If OTP is valid:  
   * User is redirected to the **Create New Password** screen.  
8. User enters:  
   * New Password  
   * Confirm Password  
9. System validates password against configured **password policy**.  
10. On successful validation:  
    * Password is updated securely.  
    * OTP is invalidated.  
    * All existing active sessions for the user are logged out.  
11. System displays confirmation message:  
    * **“Your password has been successfully set.”**  
12. User is redirected to the **Login screen**.

### **4.3.2 Login (Phone \+ Password)**

**Flow Steps**

1. User enters:  
   * Registered Phone Number  
   * Password  
2. System validates:  
   * Phone number exists and account is active.  
   * Password matches stored credentials.  
3. If credentials are valid:  
   * Login is successful.  
   * User is redirected to the authorized landing page.  
4. If credentials are invalid:  
   * System displays error:  
     * **"Invalid phone number or password."**

## **4.3.3 Forgot Password (Phone \+ OTP)**

### **Flow Steps**

1. **Initiate Forgot Password**  
   * User clicks **“Forgot Password”** on the Login screen.  
   * System redirects the user to the **Forgot Password (Phone)** screen.  
2. **Enter Mobile Number**  
   * User enters their **registered mobile number**.  
   * User clicks **“Get OTP”**.  
3. **Mobile Number Validation**  
   * System validates:  
     * Mobile number format.  
     * Mobile number exists and is active in the system.  
   * If mobile number does not exist:  
     * System displays error message:  
       * **“Mobile number not found. Please check and try again.”**  
4. **OTP Generation & Delivery**  
   * If mobile number is valid:  
     * System generates a **secure, time-bound OTP**.  
     * OTP is sent via SMS to the registered mobile number.  
     * System displays confirmation message:  
       * **“An OTP has been sent to your registered mobile number.”**  
5. **OTP Verification**  
   * User enters the received **OTP**.  
   * System validates:  
     * OTP correctness.  
     * OTP expiry.  
     * OTP has not been previously used.  
   * If OTP is invalid or expired:  
     * System displays error:  
       * **“Invalid or expired OTP. Please try again.”**  
     * Option to **Resend OTP** is provided (subject to retry limits).  
6. **Create New Password**  
   * Upon successful OTP verification, user is redirected to the **Create New Password** screen.  
   * User enters:  
     * New Password  
     * Confirm Password  
7. **Password Policy Validation**  
   * System validates the new password against configured password policies:  
     * Minimum length  
     * Character complexity (uppercase, lowercase, number, special character)  
     * Password history (no reuse of last *N* passwords), if applicable  
   * Inline error messages are shown for policy violations.  
8. **Password Update**  
   * If validation passes:  
     * Password is securely updated.  
     * OTP is invalidated.  
     * All existing active sessions for the user are logged out.  
9. **Confirmation & Redirection**  
   * System displays confirmation message:  
     * **“Your password has been successfully reset.”**  
   * User is redirected to the **Login screen**.

---

### **4.4 Phone Number \+ OTP**

### **Flow Steps**

1. User enters their **registered mobile number** on the login screen.  
2. User clicks **“Get OTP”**.  
3. System validates:  
   * Mobile number format is valid.  
   * Mobile number exists and is active in the system.  
4. If the mobile number does **not** exist:  
   * System displays error message:  
      **“Phone number not found. Please check and try again.”**  
5. If the mobile number is valid:  
   * System generates a **secure, time-bound OTP**.  
   * OTP is sent to the registered mobile number via SMS.  
   * System displays confirmation message:  
      **“An OTP has been sent to your registered mobile number.”**  
6. User enters the received **OTP**.  
7. System validates:  
   * OTP correctness.  
   * OTP expiry.  
   * OTP has not been previously used.  
8. If OTP is valid:  
   * OTP is invalidated.  
   * Login is successful.  
   * User is redirected to the authorized landing page.  
9. If OTP is invalid or expired:  
   * System displays error message:  
      **“Invalid or expired OTP. Please try again.”**  
   * User is given the option to **Resend OTP**.

---

### **4.5 Google Authentication (OAuth)**

### **Flow Steps**

1. User clicks **“Login with Google”** on the login screen.  
2. System redirects the user to the **Google authentication page**.  
3. User selects or signs in with their Google account.  
4. Google completes authentication and redirects the user back to the application with:  
   * Verified email ID  
   * Authentication token  
5. System validates:  
   * Google authentication token is valid.  
   * Email ID received from Google exists in the **Employee Master**.  
   * Employee account status is active.  
6. If the email ID is **not found** in the Employee Master:  
   * System denies access.  
   * Error message is displayed:  
     * **“Your Google account is not linked with this portal.”**  
7. If the email ID **exists and is active**:  
   * User login is successful.  
   * A secure session is created.  
   * User is redirected to the authorized landing page.

---

## **4.5 Universal URL Default Login (Employee ID + Date of Birth)**

**Use Case**  
This authentication method is designed for companies that:
* Do not require specific portal customization
* Want to use a universal URL for employee access
* Prefer simple, standardized authentication without complex configuration
* Need immediate access without extensive setup

**Flow Steps**

1. User accesses the universal URL portal.
2. User enters:
   * **Username**: Employee ID (as registered in Employee Master)
   * **Password**: Date of Birth in YYYY-MM-DD format
3. System validates:
   * Employee ID exists in Employee Master
   * Account status is active
   * Date of Birth matches the stored value
4. If credentials are valid:
   * Login is successful
   * User is redirected to the standard portal landing page
5. If credentials are invalid:
   * System shows error: **"Invalid Employee ID or Date of Birth."**
6. If account lockout threshold is reached:
   * Account is locked for configured duration
   * System shows error: **"Account locked due to multiple failed attempts. Please try after [lockout duration]."**

**Key Characteristics**
* No password policy configuration required (Date of Birth is standardized)
* No password reset functionality (Date of Birth is fixed)
* Compatible with MFA for enhanced security
* Suitable for bulk employee onboarding without individual password setup
* Requires Date of Birth field to be mandatory in Employee Master data

---

## **4.6 Multi-Factor Authentication (MFA)**

**Overview**  
 Multi-Factor Authentication (MFA) adds an additional verification step (OTP) after successful credential validation. MFA is applicable only when **Password-based login** is enabled.

**General Rules**

* MFA is triggered **only after correct Email/Phone \+ Password validation**.  
* OTP is **mandatory** for completing login.  
* OTP is **time-bound** and **single-use**.  
* Login is successful **only after OTP verification**.

---

## **4.6.1 Email \+ Password \+ OTP (Email-based MFA)**

**Flow Steps**

1. User enters:  
   * Registered Email ID  
   * Password  
2. User clicks **Login**.  
3. System validates:  
   * Email exists and account is active.  
   * Password matches stored credentials.  
4. If credentials are invalid:  
   * System shows error:  
     * **“Invalid email or password.”**  
5. If credentials are valid:  
   * System generates a secure, time-bound OTP.  
   * OTP is sent to the user’s registered **Email ID**.  
   * System displays message:  
     * **“An OTP has been sent to your registered email.”**  
6. User enters the received OTP.  
7. System validates:  
   * OTP correctness.  
   * OTP expiry.  
   * OTP not previously used.  
8. If OTP is valid:  
   * OTP is invalidated.  
   * Login is successful.  
   * User is redirected to the authorized landing page.  
9. If OTP is invalid or expired:  
   * System displays error:  
     * **“Invalid or expired OTP. Please try again.”**  
   * Option to **Resend OTP** is shown (subject to limits).

---

## **4.6.2 Phone \+ Password \+ OTP (Phone-based MFA)**

**Flow Steps**

1. User enters:  
   * Registered Mobile Number  
   * Password  
2. User clicks **Login**.  
3. System validates:  
   * Mobile number exists and account is active.  
   * Password matches stored credentials.  
4. If credentials are invalid:  
   * System shows error:  
     * **“Invalid phone number or password.”**  
5. If credentials are valid:  
   * System generates a secure, time-bound OTP.  
   * OTP is sent to the user’s registered **Mobile Number**.  
   * System displays message:  
     * **“An OTP has been sent to your registered mobile number.”**  
6. User enters the received OTP.  
7. System validates:  
   * OTP correctness.  
   * OTP expiry  
   * OTP not previously used.  
8. If OTP is valid:  
   * OTP is invalidated.  
   * Login is successful.  
   * User is redirected to the authorized landing page.  
9. If OTP is invalid or expired:  
   * System displays error:  
     * **“Invalid or expired OTP. Please try again.”**  
   * User may request a **New OTP** (within configured limits)..

---

## **5\. Validations — Login Configuration**

| Validation Type | Parameter / Check | Behavior | Message |
| ----- | ----- | ----- | ----- |
| Identifier Validations | Email must exist | Reject login | "Email ID not found. Please check and try again." |
|  | Phone must exist | Reject login | "Phone number not found. Please check and try again." |
|  | Employee ID must exist (Universal URL) | Reject login | "Employee ID not found. Please check and try again." |
|  | Date of Birth must match (Universal URL) | Reject login | "Invalid Employee ID or Date of Birth." |
| OTP Validations | OTP must match | Reject login if incorrect | "Invalid OTP. Please try again." |
|  | OTP must not be expired | Reject login if expired | "OTP expired. Please request a new OTP." |
| Password Validations | Must satisfy password policy | Reject login or password change | “Password does not meet policy requirements.” |
|  | New password ≠ old password | Reject password change | “New password cannot be same as old password.” |
|  | New password must match confirm password | Reject password change | “Confirm password does not match new password.” |
| System / Config Validations | Email \+ Password AND Email \+ OTP together | Prevent configuration | “Cannot enable Email \+ Password and Email \+ OTP simultaneously.” |
|  | Phone \+ Password AND Phone \+ OTP together | Prevent configuration | “Cannot enable Phone \+ Password and Phone \+ OTP simultaneously.” |
|  | MFA Email without Email \+ Password | Prevent configuration | “MFA Email requires Email \+ Password to be enabled first.” |
|  | MFA Phone without Phone \+ Password | Prevent configuration | “MFA Phone requires Phone \+ Password to be enabled first.” |
|  | At least one primary login method must exist | Prevent configuration | “At least one primary login method must be enabled.” |
| Google Authentication Validations | Google email must exist in Employee Master | Reject login | “Your Google account is not linked with this portal.” |

---

## **6\. Login Configuration — Data Mandatory Rules**

1. **Phone-based Login Rules**  
* If user enables **Phone \+ Password** or **Phone \+ OTP**, the **Phone Number** field is mandatory in all **Inception** and **Endorsement** files.  
2. **Email-based Login Rules**  
* If user enables **Email \+ Password** or **Email \+ OTP**, the **Email ID** field is mandatory in all **Inception** and **Endorsement** files.  
3. **Google Authentication Rules**  
* If user enables **Google OAuth Login**, the **Email ID** field is mandatory in all **Inception** and **Endorsement** files.
4. **Universal URL Default Login Rules**  
* If company uses **Universal URL Default Login**, both **Employee ID** and **Date of Birth** fields are mandatory in all **Inception** and **Endorsement** files.

  