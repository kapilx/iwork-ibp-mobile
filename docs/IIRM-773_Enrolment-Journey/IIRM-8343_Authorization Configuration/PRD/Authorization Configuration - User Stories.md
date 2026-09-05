# **Authorization Configuration – User Stories**

**IBP (IIRM Corporate Client Portal)**

---

## **1. Overview**

This document contains user stories for the Authorization Configuration module that allows corporate tenants to configure authentication methods for their employees accessing the IBP portal.

**Actors:**
- **BD Executive**: Corporate tenant administrator who configures authentication settings
- **End User**: Corporate employee who uses the configured authentication methods to access the portal
- **System**: The IBP platform that enforces the configured authentication rules

---

## **2. Epic: Authentication Method Configuration**

### **User Story 2.1: Enable Email + Password Authentication**
**As a** BD Executive  
**I want to** configure Email + Password authentication for my corporate tenant  
**So that** my employees can login using their email address and password  

**Acceptance Criteria:**
- I can enable/disable Email + Password authentication from the admin panel
- I can configure password policy settings (length, character types, special characters)
- I can set password expiry duration (30/60/90/120 days)
- I can enable/disable MFA after password login
- I can set session timeout duration (15-60 minutes)
- System validates that conflicting authentication methods are not enabled together

**Story Points:** 8

---

### **User Story 2.2: Enable Email + OTP Authentication**
**As a** BD Executive  
**I want to** configure Email + OTP passwordless authentication  
**So that** my employees can login using only their email and OTP verification  

**Acceptance Criteria:**
- I can enable/disable Email + OTP authentication
- I can set OTP validity duration (2-10 minutes)
- I can configure OTP resend cooldown (30-120 seconds)
- I can configure session timeout (15/30/60 minutes)
- System prevents enabling Email + OTP when Email + Password is already enabled

**Story Points:** 5

---

### **User Story 2.3: Enable Phone + Password Authentication**
**As a** BD Executive  
**I want to** configure Phone + Password authentication  
**So that** my employees can login using their phone number and password  

**Acceptance Criteria:**
- I can enable/disable Phone + Password authentication
- I can configure password policy settings identical to email-based password login
- I can set session timeout duration
- I can enable/disable MFA after password login
- System enforces phone number as mandatory in employee data files

**Story Points:** 8

---

### **User Story 2.4: Enable Phone + OTP Authentication**
**As a** BD Executive  
**I want to** configure Phone + OTP passwordless authentication  
**So that** my employees can login using only their phone number and SMS OTP  

**Acceptance Criteria:**
- I can enable/disable Phone + OTP authentication
- I can set OTP validity duration and resend cooldown
- I can set session timeout duration
- System prevents enabling Phone + OTP when Phone + Password is already enabled
- System enforces phone number as mandatory in employee data files

**Story Points:** 5

---

### **User Story 2.5: Enable Google OAuth Authentication**
**As a** BD Executive  
**I want to** enable Google OAuth authentication  
**So that** my employees can login using their Google accounts  

**Acceptance Criteria:**
- I can enable/disable Google OAuth login
- I can configure session timeout for OAuth sessions
- System validates that Google email exists in Employee Master during login
- System enforces email as mandatory in employee data files when Google OAuth is enabled

**Story Points:** 3

---

### **User Story 2.6: Enable Universal URL Default Login (Employee ID + Date of Birth)**
**As a** BD Executive  
**I want to** use Universal URL Default Login for companies that don't require specific portal configuration  
**So that** employees can access the portal using a standardized universal URL with their Employee ID and Date of Birth  

**Acceptance Criteria:**
- Universal URL Default Login is available for companies wanting simple, standardized authentication
- Username is automatically Employee ID from Employee Master (non-configurable)
- Password is automatically Date of Birth in YYYY-MM-DD format (non-configurable)
- No configuration settings are required - works with default system parameters
- System enforces Employee ID and Date of Birth as mandatory fields in Employee Master
- No password policy configuration is needed (standardized format)
- No password reset functionality is available (Date of Birth is fixed)
- Compatible with MFA for enhanced security if needed

**Story Points:** 3

---

## **3. Epic: Multi-Factor Authentication (MFA)**

### **User Story 3.1: Configure Email-based MFA**
**As a** BD Executive  
**I want to** enable Multi-Factor Authentication using email OTP  
**So that** employees must verify their identity with both password and email OTP  

**Acceptance Criteria:**
- I can enable Email MFA only when Email + Password authentication is enabled
- MFA triggers automatically after successful password validation
- System sends OTP to registered email address
- I can configure OTP validity duration and resend settings for MFA
- Login is completed only after successful OTP verification

**Story Points:** 5

---

### **User Story 3.2: Configure Phone-based MFA**
**As a** BD Executive  
**I want to** enable Multi-Factor Authentication using SMS OTP  
**So that** employees must verify their identity with both password and SMS OTP  

**Acceptance Criteria:**
- I can enable Phone MFA only when Phone + Password authentication is enabled
- MFA triggers automatically after successful password validation
- System sends OTP to registered mobile number
- I can configure OTP validity duration and resend settings for MFA
- Login is completed only after successful OTP verification

**Story Points:** 5

---

## **4. Epic: End User Authentication Flows**

### **User Story 4.1: First-time Password Setup (Email)**
**As an** End User  
**I want to** set up my password for the first time using email verification  
**So that** I can access the portal with my credentials  

**Acceptance Criteria:**
- I receive a password reset email with a secure, time-bound link
- I can click the link to access the password creation screen
- I must enter a password that meets the configured policy requirements
- System validates password against all policy rules
- My password is securely saved and I'm redirected to login
- All validation errors are clearly displayed

**Story Points:** 5

---

### **User Story 4.2: Login with Email + Password**
**As an** End User  
**I want to** login using my email and password  
**So that** I can access the portal securely  

**Acceptance Criteria:**
- I can enter my email and password on the login screen
- System validates my credentials and grants access if correct
- Clear error messages are shown for invalid credentials
- I'm redirected to the appropriate landing page after successful login

**Story Points:** 3

---

### **User Story 4.3: Login with Email + OTP**
**As an** End User  
**I want to** login using my email and OTP  
**So that** I can access the portal without remembering a password  

**Acceptance Criteria:**
- I can enter my email and request an OTP
- I receive an OTP at my registered email address
- I can enter the OTP to complete login
- I can request a new OTP if the current one expires
- Clear error messages are shown for invalid/expired OTP
- I'm redirected to the portal after successful OTP verification

**Story Points:** 5

---

### **User Story 4.4: Login with Phone + Password**
**As an** End User  
**I want to** login using my phone number and password  
**So that** I can access the portal with my mobile-based credentials  

**Acceptance Criteria:**
- I can enter my phone number and password on the login screen
- System validates my credentials and grants access if correct
- Clear error messages are shown for invalid credentials
- I'm redirected to the portal after successful login

**Story Points:** 3

---

### **User Story 4.5: Login with Phone + OTP**
**As an** End User  
**I want to** login using my phone number and SMS OTP  
**So that** I can access the portal without a password  

**Acceptance Criteria:**
- I can enter my phone number and request an OTP
- I receive an SMS OTP on my registered mobile number
- I can enter the OTP to complete login
- I can request a new OTP if needed (within limits)
- Clear error messages are shown for invalid/expired OTP
- I'm redirected to the portal after successful verification

**Story Points:** 5

---

### **User Story 4.6: Login with Google OAuth**
**As an** End User  
**I want to** login using my Google account  
**So that** I can access the portal without separate credentials  

**Acceptance Criteria:**
- I can click "Login with Google" on the login screen
- I'm redirected to Google's authentication page
- After Google verification, I'm returned to the portal
- System validates my Google email exists in Employee Master
- Clear error message if Google account is not linked
- I'm redirected to the portal after successful authentication

**Story Points:** 3

---

### **User Story 4.7: Login with Universal URL (Employee ID + Date of Birth)**ployee ID + Date of Birth)**
**As an** End User  
**I want to** login using my Employee ID and Date of Birth on the universal URL  
**So that** I can access the portal without complex authentication setup  

**Acceptance Criteria:**
- I can access the portal through a universal URL
- I can enter my Employee ID and Date of Birth (YYYY-MM-DD format) to login
- System validates my credentials against Employee Master data
- Clear error messages for invalid Employee ID or Date of Birth
- I'm redirected to the standard portal landing page after successful login
- No password reset option is available (Date of Birth is fixed)

**Story Points:** 4

---

### **User Story 4.8: Complete MFA Login (Email)**
**As an** End User  
**I want to** complete Multi-Factor Authentication using email OTP  
**So that** I can securely access the portal after password verification  

**Acceptance Criteria:**
- After successful password login, I'm prompted for email OTP
- I receive an OTP at my registered email address
- I must enter the correct OTP to complete login
- I can request a new OTP if needed (within limits)
- Clear error messages for invalid/expired OTP
- Login is completed only after successful OTP verification

**Story Points:** 3

---

### **User Story 4.9: Complete MFA Login (Phone)**
**As an** End User  
**I want to** complete Multi-Factor Authentication using SMS OTP  
**So that** I can securely access the portal after password verification  

**Acceptance Criteria:**
- After successful password login, I'm prompted for SMS OTP
- I receive an OTP on my registered mobile number
- I must enter the correct OTP to complete login
- I can request a new OTP if needed (within limits)
- Clear error messages for invalid/expired OTP
- Login is completed only after successful OTP verification

**Story Points:** 3

---

## **5. Epic: Password Management**

### **User Story 5.1: Reset Password (Phone + OTP)**
**As an** End User  
**I want to** reset my password using phone OTP verification  
**So that** I can regain access using my mobile number  

**Acceptance Criteria:**
- I can initiate password reset from the login screen
- I can enter my phone number to receive an OTP
- I receive an SMS OTP on my registered mobile number
- After OTP verification, I can set a new password
- New password must meet all policy requirements
- My password is updated and all sessions are logged out
- Clear confirmation message is shown

**Story Points:** 5

---

## **6. Epic: Session Management**

### **User Story 6.1: Automatic Session Timeout**
**As an** End User  
**I want to** be automatically logged out after inactivity  
**So that** my account remains secure if I forget to log out  

**Acceptance Criteria:**
- My session expires after the configured timeout period
- I receive a warning before session expiry
- I'm redirected to the login screen when session expires
- Clear message explains why I was logged out
- Session timeout applies to all authentication methods

**Story Points:** 3

---

### **User Story 6.2: Concurrent Session Management**
**As an** End User  
**I want to** have my other sessions logged out when I reset my password  
**So that** my account security is maintained  

**Acceptance Criteria:**
- All my active sessions are terminated when I reset my password
- All my active sessions are terminated when BD executive resets my password
- I must login again from all devices after password reset
- Clear notification is provided about session termination

**Story Points:** 2

---

## **7. Epic: Validation and Error Handling**

### **User Story 7.1: Authentication Method Validation**
**As a** BD Executive  
**I want to** receive validation errors for conflicting authentication configurations  
**So that** I can maintain a consistent authentication setup  

**Acceptance Criteria:**
- System prevents enabling Email + Password and Email + OTP together
- System prevents enabling Phone + Password and Phone + OTP together
- System prevents enabling MFA without corresponding password authentication
- System requires at least one primary authentication method to be enabled
- Clear error messages explain configuration conflicts

**Story Points:** 3

---

### **User Story 7.2: Data Mandatory Field Validation**
**As a** BD Executive  
**I want to** be notified about mandatory field requirements based on authentication configuration  
**So that** I can ensure employee data completeness  

**Acceptance Criteria:**
- System enforces email as mandatory when email-based authentication is enabled
- System enforces phone as mandatory when phone-based authentication is enabled
- System validates employee data files against authentication requirements
- Clear warnings are shown for missing mandatory fields
- Bulk upload validations include authentication-specific field checks

**Story Points:** 3

---

### **User Story 7.3: Comprehensive Error Messages**
**As an** End User  
**I want to** receive clear and helpful error messages during authentication  
**So that** I understand what went wrong and how to fix it  

**Acceptance Criteria:**
- Specific error messages for different failure scenarios
- Clear guidance on next steps for each error type
- No exposure of sensitive system information in error messages
- Consistent error message format across all authentication methods
- Support for multiple languages (if applicable)

**Story Points:** 2

---

### **User Story 7.4: Universal URL Data Validation**
**As a** BD Executive  
**I want to** receive validation for Universal URL authentication requirements for companies that don't choose company-specific portals  
**So that** I can ensure employee data completeness for companies using standard URL access with universal login methods  

**Acceptance Criteria:**
- System identifies companies that don't choose company-specific portals and automatically enables universal login
- System enforces Employee ID as mandatory for companies using universal login (standard URL)
- System enforces Date of Birth as mandatory for companies using universal login (standard URL)
- System validates employee data files against universal login requirements (Employee ID as username, Date of Birth as password)
- Clear warnings are shown for missing Employee ID or Date of Birth fields for universal login companies
- Bulk upload validations include universal login-specific field checks for companies using standard URL
- System prevents companies from using universal login if Employee ID or Date of Birth fields are missing in existing data
- System automatically assigns standard login method (Employee ID + Date of Birth) for companies not choosing specific portal configuration

**Story Points:** 3

---

### **User Story 7.5: Universal URL Error Handling**
**As an** End User  
**I want to** receive clear error messages during Universal URL authentication  
**So that** I understand authentication issues and can resolve them  

**Acceptance Criteria:**
- Specific error message for invalid Employee ID: "Employee ID not found. Please check and try again."
- Specific error message for invalid Date of Birth: "Invalid Employee ID or Date of Birth."
- Clear account lockout message with duration information
- Consistent error message format with other authentication methods
- No exposure of sensitive employee information in error messages

**Story Points:** 2

---

## **8. Technical Stories**

### **User Story 8.1: OTP Security Implementation**
**As a** System  
**I want to** generate and validate secure OTPs  
**So that** authentication remains secure and reliable  

**Acceptance Criteria:**
- OTPs are cryptographically secure and unpredictable
- OTPs are time-bound and single-use only
- OTP generation follows industry security standards
- OTP delivery is tracked and logged
- Failed OTP attempts are monitored and limited

**Story Points:** 5

---

### **User Story 8.2: Password Security Implementation**
**As a** System  
**I want to** securely handle password storage and validation  
**So that** user credentials remain protected  

**Acceptance Criteria:**
- Passwords are hashed using industry-standard algorithms
- Password policies are enforced consistently
- Password history is maintained securely
- Account lockout mechanisms prevent brute force attacks
- All password operations are logged securely

**Story Points:** 5

---

### **User Story 8.3: Audit Trail Implementation**
**As a** System  
**I want to** maintain comprehensive audit logs for authentication events  
**So that** security incidents can be tracked and investigated  

**Acceptance Criteria:**
- All login attempts (successful and failed) are logged
- Configuration changes by BD executives are tracked
- Password reset activities are audited
- OTP generation and validation events are logged
- Logs include relevant metadata (IP, timestamp, user agent)

**Story Points:** 3

---

### **User Story 8.4: Universal URL Security Implementation**
**As a** System  
**I want to** securely handle Universal URL authentication  
**So that** employee data remains protected while providing simplified access  

**Acceptance Criteria:**
- Date of Birth validation is performed securely without exposing actual values
- Employee ID validation follows consistent security patterns
- All Universal URL login attempts are logged with relevant metadata
- Session management follows standard security practices
- Date of Birth format validation is consistent (YYYY-MM-DD)

**Story Points:** 4

---

## **9. Summary**

**Total User Stories:** 24  
**Total Story Points:** 95

**Epic Breakdown:**
- Authentication Method Configuration: 28 points (6 stories)
- Multi-Factor Authentication: 10 points (2 stories)
- End User Authentication Flows: 25 points (9 stories)
- Password Management: 5 points (1 story)
- Session Management: 5 points (2 stories)
- Validation and Error Handling: 13 points (5 stories)
- Technical Stories: 16 points (4 stories)

**Priority Levels:**
- High Priority: Authentication flows, password management, core validations
- Medium Priority: MFA, session management, comprehensive error handling
- Low Priority: Advanced audit features, technical optimizations