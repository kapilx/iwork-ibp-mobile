## **1\. Objective**

The objective of this PRD is to define a **standardized end-user onboarding experience** for employees based on the configured login method. The onboarding flow is triggered once the login configuration is approved by the Manager and becomes live, ensuring users can securely access the platform with minimal friction.

---

## **2\. Scope**

This PRD covers onboarding for the following login methods:

* Email \+ Password  
* Email \+ OTP  
* Phone Number \+ Password  
* Phone Number \+ OTP

---

## **3\. Preconditions**

* Users (employees) are already created in the system at the time of Inception / Endorsement  
* Login method configured.

---

## **4\. Communication Emails /  Messages and Trigger Points**

* **Onboarding Communication ( Mail & Message)**  
  * Trigger Point \- When User Created at the time of Inception / Endorsement  
  * Communication Channel :   
    * Mail \- If Login Method \- ( Mail \+ Password, Mail \+ OTP)  
    * Phone Message \- If Login Method \- ( Phone \+ Password, Phone \+ OTP)  
  * Onboarding Mail Template will differ based on the scenarios:
    * **Scenario 1:** Initial user creation with Employee Only Data (Inception/Endorsement)
    * **Scenario 2:** Initial user creation with Employee + Dependent Data (Inception/Endorsement)
    * **Scenario 3:** Enrollment edited/updated or new file upload with dependent data
  * Please refer to Template section for detailed email content for each scenario  
* **Password Reset link ( Email)**  
  * Trigger Point \- When User performs Password Reset  
  * Communication  Channel : Email  
  * Supported Login Type \- Mail \+ Password Only  
* **OTP Communication (Mail)**  
  * Trigger Point \- When User Perform Login  
  * Communication Channel \- Mail  
  * Supported Login Type \- Email \+ OTP  
* **OTP Communication \- For reset Password ( Message)**  
  * Trigger Point \- When User Perform Password reset  
  * Communication Channel \- Phone Message  
  * Supported Login Type \-  Phone \+ Password  
* **OTP Communication ( Message)**  
  * Trigger Point \- When User Perform Login  
  * Communication Channel \- Phone Message  
  * Supported Login Type \- Phone \+ OTP  
* Enrolment Start date Communication ( Mail & Message)  
  * Trigger Point \- On Enrolment Start Date  
  * Communication Channel   
    * Mail \- If Login Method \- ( Mail \+ Password, Mail \+ OTP)  
    * Phone Message \- If Login Method \- ( Phone \+ Password, Phone \+ OTP)  
* Enrolment Reminder Communication ( Mail & Message)  
  * Trigger Point \- current \- 7/3/2/1 days from date of enrolment start date  
  * Communication Channel   
    * Mail \- If Login Method \- ( Mail \+ Password, Mail \+ OTP)  
    * Phone Message \- If Login Method \- ( Phone \+ Password, Phone \+ OTP)  
* Enrolment confirmation Communication ( Mail & Message)  
  * Trigger Point \- Enrolment confirmed   
  * Communication Channel   
    * Mail \- If Login Method \- ( Mail \+ Password, Mail \+ OTP)  
    * Phone Message \- If Login Method \- ( Phone \+ Password, Phone \+ OTP)  
* TPA Card Generated Communication ( Mail & Message)  
  * TPA Card Generated (TBD)  
  * Communication Channel   
    * Mail \- If Login Method \- ( Mail \+ Password, Mail \+ OTP)  
    * Phone Message \- If Login Method \- ( Phone \+ Password, Phone \+ OTP)  
* Policy Doc Generated Communication ( Mail & Message)  
  * Trigger Point \- Policy Feature document uploaded   
  * Communication Channel   
    * Mail \- If Login Method \- ( Mail \+ Password, Mail \+ OTP)  
    * Phone Message \- If Login Method \- ( Phone \+ Password, Phone \+ OTP)  
* Life Event Communication ( Mail & Message)  
  * Trigger Point \- Life Event processed (New Child Born, Marriage, Divorce, Loss of Dependent)  
  * Communication Channel   
    * Mail \- If Login Method \- ( Mail \+ Password, Mail \+ OTP)  
    * Phone Message \- If Login Method \- ( Phone \+ Password, Phone \+ OTP)

# **User Stories**

## **1\. User Creation & Onboarding Communication**

### **User Story 1.1 – Onboarding Communication on User Creation**

**As an employee**,  
 I want to receive onboarding instructions when my profile is created,  
 So that I know how to access the platform based on the configured login method.

#### **Acceptance Criteria**

**Given**

* The employee user is created during Inception or Endorsement

* A login method is configured and approved by the Manager

**When**

* The user creation process is completed successfully

**Then**

* An onboarding communication is triggered automatically

* If login method is **Email \+ Password** or **Email \+ OTP**, onboarding **email** is sent

* If login method is **Phone \+ Password** or **Phone \+ OTP**, onboarding **phone message (SMS/WhatsApp)** is sent

* The content of the onboarding message matches the configured login method

* The communication includes:

  * Portal access link

  * Login instructions

  * Support contact details

---

## **2\. Login Using Email \+ Password**

### **User Story 2.1 – First-Time Login with Email and Password**

**As an employee**,  
 I want to log in using my email and password,  
 So that I can securely access the platform.

#### **Acceptance Criteria**

**Given**

* The login method is configured as **Email \+ Password**

* The user has received onboarding email

**When**

* The user enters registered email and password on the login screen

**Then**

* The system authenticates the credentials

* The user is logged in successfully

* The user is redirected to the dashboard

---

## **3\. Password Reset (Email \+ Password)**

### **User Story 3.1 – Password Reset via Email**

**As an employee**,  
 I want to reset my password using email,  
 So that I can regain access if I forget my password.

#### **Acceptance Criteria**

**Given**

* The login method is **Email \+ Password**

* The user exists and has a registered email ID

**When**

* The user clicks on “Forgot Password”

* The user submits their registered email ID

**Then**

* A password reset email with a secure reset link is sent

* The reset link is time-bound and single-use

* On successful reset, the user can log in using the new password

---

## **4\. Login Using Email \+ OTP**

### **User Story 4.1 – Login via Email OTP**

**As an employee**,  
 I want to log in using an OTP sent to my email,  
 So that I can access the platform without remembering a password.

#### **Acceptance Criteria**

**Given**

* The login method is configured as **Email \+ OTP**

* The user has a valid registered email ID

**When**

* The user enters their email ID and clicks “Send OTP”

**Then**

* An OTP is sent to the registered email

* The OTP is valid for a configurable duration

* The user is logged in successfully upon OTP verification

---

## **5\. Login Using Phone Number \+ Password**

### **User Story 5.1 – Login with Phone Number and Password**

**As an employee**,  
 I want to log in using my phone number and password,  
 So that I can access the platform using my mobile credentials.

#### **Acceptance Criteria**

**Given**

* The login method is configured as **Phone \+ Password**

* The user has a registered phone number

**When**

* The user enters phone number and password

**Then**

* The system validates the credentials

* The user is logged in successfully

---

### **User Story 5.2 – Password Reset via Phone OTP**

**As an employee**,  
 I want to reset my password using an OTP sent to my phone,  
 So that I can recover access securely.

#### **Acceptance Criteria**

**Given**

* The login method is **Phone \+ Password**

**When**

* The user initiates password reset

* The system sends OTP to the registered phone number

**Then**

* OTP is validated successfully

* The user can set a new password

* A confirmation message is sent upon successful reset

---

## **6\. Login Using Phone Number \+ OTP**

### **User Story 6.1 – Login via Phone OTP**

**As an employee**,  
 I want to log in using an OTP sent to my phone number,  
 So that I can access the platform without using a password.

#### **Acceptance Criteria**

**Given**

* The login method is configured as **Phone \+ OTP**

**When**

* The user enters their registered phone number and requests OTP

**Then**

* OTP is sent via phone message

* OTP is validated within the allowed time

* The user is logged in successfully

---

## **7\. Enrolment Start Communication**

### **User Story 7.1 – Enrolment Start Notification**

**As an employee**,  
 I want to be notified when the enrolment window opens,  
 So that I can take timely action to enrol in the policy.

#### **Acceptance Criteria**

**Given**

* Enrolment start date is configured

* The user is eligible for enrolment

**When**

* The enrolment start date is reached

**Then**

* A notification is sent automatically

* Email is sent for **Email-based login methods**

* Phone message is sent for **Phone-based login methods**

* Communication includes:

  * Enrolment start date

  * CTA to enrol

  * Deadline information

---

## **8\. Enrolment Reminder Communication**

### **User Story 8.1 – Enrolment Reminder Notifications**

**As an employee**,  
 I want to receive reminders before enrolment closes,  
 So that I don’t miss the enrolment deadline.

#### **Acceptance Criteria**

**Given**

* The enrolment window is open

* The user has not completed enrolment

**When**

* The system reaches reminder milestones (7/3/2/1 days)

**Then**

* Reminder notifications are triggered automatically

* Delivery channel is based on login method

* Reminder content includes:

  * Days remaining

  * Enrolment CTA

  * Support contact details

---

## **9\. Enrolment Confirmation Communication**

### **User Story 9.1 – Enrolment Confirmation Notification**

**As an employee**,  
 I want to receive confirmation once my enrolment is completed,  
 So that I know my policy enrolment was successful.

#### **Acceptance Criteria**

**Given**

* The user has successfully submitted enrolment

**When**

* Enrolment status changes to “Confirmed”

**Then**

* Confirmation notification is sent

* Email or phone message is chosen based on login method

* Message includes:

  * Policy name

  * Enrolment status

  * Next steps information

---

## **10\. TPA Card Generation Communication**

### **User Story 10.1 – TPA Card Generated Notification**

**As an employee**,  
 I want to be informed when my TPA card is generated,  
 So that I can access it for healthcare services.

#### **Acceptance Criteria**

**Given**

* TPA card generation is completed (TBD trigger)

**When**

* The TPA card is available in the system

**Then**

* Notification is sent via configured channel

* The message includes:

  * TPA name

  * Instructions to view/download the card

  * Portal access link

---

## **11\. Policy Document Generated Communication**

### **User Story 11.1 – Policy Document Upload Notification**

**As an employee**,  
 I want to be notified when the policy document is uploaded,  
 So that I can review my insurance coverage details.

#### **Acceptance Criteria**

**Given**

* Policy feature document is uploaded to the system

**When**

* The document upload is completed successfully

**Then**

* Notification is sent via email or phone message

* Communication includes:

  * Policy name

  * Document availability confirmation

  * Link to access the document

## **TEMPLATE- ONBOARDING MAIL**

### **Scenario 1**

**Login Type:** Email \+ Password  
 **Inception / Endorsement Type:** Employee Only Data

Email  
---

Subject \- Welcome to Your Employee Insurance Coverage  
---

Dear {{Employee Name}},  
Welcome\! 👋  
We’re pleased to inform you that you have been added to your organization’s employee insurance policy. This email will help you understand your coverage and get started with the Employee Insurance Portal.

🏥 Your Policy Details  
Policy Name: {{Policy Name}}  
Policy Period: {{Policy Start Date}} to {{Policy End Date}}

🏢 Your Insurance Partners  
Insurer: {{Insurer Name}}  
TPA (Third Party Administrator): {{TPA Name}}  
Insurance Broker: {{Broker Name}}

🌐 Your Employee Insurance Portal  
The Employee Insurance Portal is your one-stop place to manage your insurance benefits. You can use the portal to:  
Enroll for a policy  
View your policy and coverage details  
Check enrolled member information (self and dependents, if applicable)  
Access important policy documents  
Stay informed about your insurance benefits and support options

🔐 How to Access the Portal  
Getting started is easy:  
Click the portal link provided below  
On the login screen, click “Forgot Password”  
Enter your registered {{Email ID}}  
A password reset link will be sent to your email address  
Click the reset link received in your email  
Set a new password and confirm it  
Once your password is reset, you can log in anytime using your email ID and new password  
👉 Access the Portal: {{Portal Signup URL}}

If you have any questions or need assistance, you may reach out to your HR team or our support desk.  
We’re happy to welcome you and support you in making the most of your insurance benefits.  
Warm regards,  
{{Broker Company Name}}  
Customer Support Team  
{{Support Email}} | {{Support Phone}}

---

## **TEMPLATE \- ONBOARDING MAIL**

### **Scenario 2**

**Login Type:** Email \+ Password  
 **Inception / Endorsement Type:** Employee \+ Dependent Data

Email  
---

Subject \- Welcome to Your Employee Insurance Coverage  
---

Dear {{Employee Name}},  
Welcome\! 👋  
We’re pleased to inform you that you have been added to your organization’s employee insurance policy. This email will help you understand your coverage and get started with the Employee Insurance Portal.

🏥 Your Policy Details  
Policy Name: {{Policy Name}}  
Policy Period: {{Policy Start Date}} to {{Policy End Date}}  
Total Lives (Count)  
Dependent details  
Dependent Relation  
Dependent Name  
Premium  
Self paid  
Company paid ( If Configuration Allows)  
Sum insured

🏢 Your Insurance Partners  
Insurer: {{Insurer Name}}  
TPA (Third Party Administrator): {{TPA Name}}  
Insurance Broker: {{Broker Name}}

🌐 Your Employee Insurance Portal  
The Employee Insurance Portal is your one-stop place to manage your insurance benefits. You can use the portal to:  
Enroll for a policy  
View your policy and coverage details  
Check enrolled member information (self and dependents, if applicable)  
Access important policy documents  
Stay informed about your insurance benefits and support options

🔐 How to Access the Portal  
Getting started is easy:  
Click the portal link provided below  
On the login screen, click “Forgot Password”  
Enter your registered {{Email ID}}  
A password reset link will be sent to your email address  
Click the reset link received in your email  
Set a new password and confirm it  
Once your password is reset, you can log in anytime using your email ID and new password  
👉 Access the Portal: {{Portal Signup URL}}

If you have any questions or need assistance, you may reach out to your HR team or our support desk.  
We’re happy to welcome you and support you in making the most of your insurance benefits.  
Warm regards,  
{{Broker Company Name}}  
Customer Support Team  
{{Support Email}} | {{Support Phone}}

---

## **TEMPLATE \- ONBOARDING ( When enrolment edited / updated and when new file upload with dependent)**

### **Scenario 3**

**Login Type:** Email \+ Password  
 **Case:** Enrolment Edited / Updated

Inception / Endorsement type \- ( Employee only & Employee \+ Dependent)

Email  
---

Subject \- Your Employee Insurance Coverage Has Been Updated  
---

Dear {{Employee Name}},  
Welcome\! 👋  
We’re pleased to inform you that you are enrolled under your organization’s employee insurance policy. Your enrolment details have been updated, and this email will help you review your coverage and access the Employee Insurance Portal.

🏥 Your Policy Details (Updated)  
Policy Name: {{Policy Name}}  
Policy Period: {{Policy Start Date}} to {{Policy End Date}}  
Total Lives (Count)  
Dependent details  
Dependent Relation  
Dependent Name  
Premium  
Self paid  
Company paid ( If Configuration Allows)  
Sum insured

🏢 Your Insurance Partners  
Insurer: {{Insurer Name}}  
TPA (Third Party Administrator): {{TPA Name}}  
Insurance Broker: {{Broker Name}}

🌐 Your Employee Insurance Portal  
The Employee Insurance Portal is your one-stop place to manage your insurance benefits. You can use the portal to:  
Review your enrolment details  
View your policy and coverage information  
Access important policy documents  
Stay informed about your insurance benefits and support options

🔐 How to Access the Portal  
Getting started is easy:  
Click the portal link provided below  
On the login screen, click “Forgot Password”  
Enter your registered {{Email ID}}  
A password reset link will be sent to your email address  
Click the reset link received in your email  
Set a new password and confirm it  
Once your password is reset, you can log in anytime using your email ID and new password  
👉 Access the Portal: {{Portal Signup URL}}

If you have any questions or need assistance, you may reach out to your HR team or our support desk.  
We're happy to support you in managing your insurance benefits.  
Warm regards,  
{{Broker Company Name}}  
Customer Support Team  
{{Support Email}} | {{Support Phone}}

---

## **TEMPLATE - ONBOARDING (Life Events - Generic)**

### **Scenario 4**

**Login Type:** Email \+ Password  
**Case:** Life Event - Coverage Update (New Child Born, Marriage, Divorce, Loss of Dependent)

Email  
---

Subject \- {{Life Event Action}} \- Insurance Coverage Updated \- {{Policy Name}}  
---

Dear {{Employee Name}},  
{{Life Event Greeting}}  
We're writing to inform you that your life event request has been processed successfully, and your insurance coverage has been updated accordingly. This email will help you review your updated coverage and access the Employee Insurance Portal.

🏥 Your Updated Policy Details  
Policy Name: {{Policy Name}}  
Policy Period: {{Policy Start Date}} to {{Policy End Date}}  
Life Event Type: {{Life Event Type}} (New Child Born/Marriage/Divorce/Loss of Dependent)  
Effective Date: {{Life Event Effective Date}}  

📋 Coverage Summary  
Total Lives Covered: {{Updated Total Lives Count}}  
{{Coverage Change Details}}

Current Active Members:  
{{Current Active Member Details}}

💰 Premium Information  
{{Premium Status}}: {{Updated Premium Amount}}  
Employee Contribution: {{Employee Premium}}  
Company Contribution: {{Company Premium}} (If Configuration Allows)  
Effective From: {{Premium Effective Date}}

🏢 Your Insurance Partners  
Insurer: {{Insurer Name}}  
TPA (Third Party Administrator): {{TPA Name}}  
Insurance Broker: {{Broker Company Name}}

🌐 Your Employee Insurance Portal  
The Employee Insurance Portal is your one-stop place to manage your insurance benefits. You can use the portal to:  
View updated enrolment details for all covered members  
Access TPA E-cards for covered members  
Download updated policy documents  
Stay informed about your insurance benefits and support options

🔐 How to Access the Portal  
Getting started is easy:  
Click the portal link provided below  
On the login screen, click "Forgot Password"  
Enter your registered {{Email ID}}  
A password reset link will be sent to your email address  
Click the reset link received in your email  
Set a new password and confirm it  
Once your password is reset, you can log in anytime using your email ID and new password  
👉 Access the Portal: {{Portal Signup URL}}

📞 Important Notes  
{{Life Event Specific Notes}}  

If you have any questions or need assistance, you may reach out to your HR team or our support desk.  
{{Life Event Closing Message}}  
Warm regards,  
{{Broker Company Name}}  
Customer Support Team  
{{Support Email}} | {{Support Phone}}

---

## **TEMPLATE- Password reset link**

### **Password Reset Link**

**Login Type:** Email \+ Password

Email  
---

Subject \- Reset Your Insurance Benefit  Portal Password  
---

Dear {{Employee Full Name}},  
We received a request to reset the password for your Employee Insurance Portal account.  
To proceed, please click the link below to reset your password:  
👉 Reset Password Link: {{Reset Password URL}}

🔐 Important Information  
This link is valid for {{Link Expiry Duration}}  
The link can be used only once  
For security reasons, please do not share this link with anyone  
If you did not request a password reset, please ignore this email. Your account will remain secure.

🌐 Need Help?  
If you face any issues while resetting your password or accessing the portal, please contact your HR team or reach out to our support desk.  
Warm regards,  
{{Broker Company Name}}  
Customer Support Team  
{{Support Email}} | {{Support Phone}}

---

## **TEMPLATE** 

### **Email Login OTP**

Email  
---

Subject \- Your One-Time Password (OTP) for Login  
---

Dear {{Employee Name}},  
To proceed with logging in to the employee portal, please use the One-Time Password (OTP) provided below.

🔐 Login OTP  
Your OTP: {{Login OTP}}  
This OTP is valid for {{OTP Expiry Duration}} minutes and can be used only once.

⚠️ Security Notice  
Do not share this OTP with anyone.  
If you did not attempt to log in, please ignore this email or contact support immediately.  
This OTP is required to securely verify your identity and protect your account.

🔗 Portal Access  
Once verified, you will be redirected to your account.  
👉 Login URL: {{Login Screen URL}}

If you face any issues while logging in, please reach out to your HR team or support desk for assistance.  
Warm regards,  
IIRM

---

## **TEMPLATE**

### **Enrolment Window Open**

Email  
---

Subject \- Enrolment Window Open – Action Required to Enrol Your Insurance Policy  
---

Dear {{Employee Name}},  
We’re writing to inform you that the enrolment window for your insurance policy has now begun. Please review the details below and complete your enrolment within the specified timeline.

📄 Policy Details  
Policy Name: {{Policy Name}}  
Policy Period: {{Policy Start Date}} to {{Policy End Date}}  
Enrolment Period: {{Enrolment Start Date}} to {{Enrolment End Date}}  
Insurer: {{Insurer Name}}  
TPA: {{TPA Name}}  
📞 TPA Support  
TPA Coordinator: {{Coordinator Name}}  
Contact Number: {{Coordinator Phone Number}}

🧾 What You Need to Do  
The enrolment window is now open. We request you to:  
Log in to the employee portal  
Review your policy details  
Add or update dependent information (if applicable)  
Select applicable coverage options  
Submit your enrolment before the enrolment end date  
Failure to complete enrolment within the defined window may result in missing coverage.

🔐 How to Access the Portal  
You can access the portal using the link below:  
👉 Login URL: {{Login Screen URL}}  
Use your registered email ID or mobile number to log in. If this is your first time logging in, please follow the on-screen instructions to set up your access.

If you need any assistance during enrolment, please reach out to your HR team or the TPA contact shared above.  
We recommend completing your enrolment at the earliest to ensure uninterrupted coverage.  
Warm regards,  
IIRM

---

## **TEMPLATE**

### **Enrolment Confirmation**

Email  
---

Subject \- Enrolment Confirmed – {{Policy Name}}  
---

Dear {{Employee Name}},  
Thank you for completing your enrolment.  
We’re pleased to confirm that your insurance enrolment has been successfully submitted for the policy mentioned below.  
Please find the enrolment details for your reference.

📄 Policy Details  
Policy Name: {{Policy Name}}  
Policy Period: {{Policy Start Date}} to {{Policy End Date}}  
Total Lives (Count)  
Dependent details  
Dependent Relation  
Dependent Name  
Premium  
Self paid  
Company paid ( If Configuration Allows)  
Sum insured

✅ Enrolment Status  
Enrolment Status: Successfully Completed  
Enrolment Date: {{Enrolment Submission Date}}  
Your coverage will be effective as per the policy start date and applicable terms and conditions.

🧾 What Happens Next  
Your enrolment details will be processed by the insurer/TPA  
The TPA E-Card will be generated and shared separately once available  
Policy documents and other related information will be accessible via the employee portal

🔐 Access via Employee Portal  
You can view your enrolment summary, policy details, and related documents anytime from the employee portal:  
👉 Login URL: {{Login Screen URL}}

📞 Support  
For any queries related to enrolment, coverage, or claims, please contact:  
TPA Coordinator: {{Coordinator Name}}  
Contact Number: {{Coordinator Phone Number}}  
You may also reach out to your HR team for further assistance.

We recommend keeping this email for your records.  
Thank you for completing your enrolment on time.  
Warm regards,  
IIRM

---

## **TEMPLATE**

### **TPA Card Generated**

Email  
---

Subject \- Your TPA E-Card Is Now Available – {{Policy Name}}  
---

Dear {{Employee Name}},  
We’re pleased to inform you that your TPA E-Card has been successfully generated for the insurance policy mentioned below.  
This card can be used to avail cashless medical services at network hospitals, as per policy terms and conditions.

📄 Policy Details  
Policy Name: {{Policy Name}}  
Policy Period: {{Policy Start Date}} to {{Policy End Date}}  
Insurer: {{Insurer Name}}  
TPA: {{TPA Name}}

🪪 TPA E-Card Details  
The TPA E-Card for you (and your enrolled dependents, if applicable) is attached with this email / available on the employee portal.  
You may download and save a copy of the card on your mobile device for easy access during medical emergencies.  
👉 TPA Card File: {{TPA Card Download Link / Attachment}}

🏥 How to Use the TPA Card  
Present the TPA E-Card at the network hospital during admission  
The hospital will coordinate directly with the TPA for cashless authorization  
Ensure your ID proof is carried along with the card

📞 TPA Support  
For hospitalization support or queries related to network hospitals, please contact:  
TPA Coordinator: {{Coordinator Name}}  
Contact Number: {{Coordinator Phone Number}}

🔐 Access via Employee Portal  
You can also view or download your TPA E-Card anytime from the employee portal:  
👉 Login URL: {{Login Screen URL}}

We recommend reviewing your policy coverage details and keeping the TPA card handy for future reference.  
Warm regards,  
IIRM

---

## **TEMPLATE**

### **Policy Document Available**

Email  
---

Subject \- Policy Document Available – {{Policy Name}}  
---

Dear {{Employee Name}},  
We’re writing to inform you that the policy document for your insurance coverage has been generated and is now available for your reference.  
This document contains detailed information about your coverage, benefits, exclusions, and claim-related terms. We recommend reviewing it carefully and keeping a copy for future use.

📄 Policy Details  
Policy Name: {{Policy Name}}  
Policy Period: {{Policy Start Date}} to {{Policy End Date}}  
Insurer: {{Insurer Name}}  
TPA: {{TPA Name}}

📑 Policy Document  
The Policy Feature / Policy Wording document is attached with this email or can be accessed through the employee portal.  
This document outlines:  
Coverage benefits  
Sum insured details  
Exclusions and waiting periods  
Claim procedures and conditions  
👉 Policy Document File: {{Policy Document Download Link / Attachment}}

🔐 Access via Employee Portal  
You can also view or download the policy document anytime from the employee portal using the link below:  
👉 Login URL: {{Login Screen URL}}

📞 Support  
For any questions related to policy coverage or claims, please reach out to:  
TPA Coordinator: {{Coordinator Name}}  
Contact Number: {{Coordinator Phone Number}}  
You may also contact your HR team for policy-related clarifications.

We recommend keeping the policy document saved for easy reference during claims or medical emergencies.  
Warm regards,  
IIRM

# 

# **Template for Communication channel ( Message)**

**Onboarding Communication ( Message)**

**Insurance Onboarding**

Your employee insurance account has been created successfully.  
Log in to the portal to access your insurance benefits and details.

Login Instruction

1. Click the portal link provided below  
2. On the login screen, click “Forgot Password”  
3. Enter your registered {{Phone Number}}  
4. A password reset OTP will be sent to your phone number  
5. Enter OTP  
6. Set a new password and confirm it  
7. Once your password is reset, you can log in anytime using your email ID and new password

Login here: {{Portal Login Short URL}}

---

**Password Reset OTP**

Your OTP to reset your portal password is {{OTP}}.  
This OTP is valid for {{OTP Expiry Duration}} minutes.

Do not share this OTP with anyone.

---

**Login OTP**

Your OTP to log in to the Employee Insurance Portal is {{OTP}}.  
Valid for {{OTP Expiry Duration}} minutes.

Do not share this OTP with anyone.

---

**Enrolment Open**

Your insurance enrolment window is now open.  
Please complete your enrolment within the allowed timeline.

Start enrolment: {{Enrolment Short URL}}

---

**Enrolment Reminder**

This is a reminder to complete your insurance enrolment.  
Last date to submit enrolment: {{Enrolment End Date}}.

Complete now: {{Enrolment Short URL}}

---

**Enrolment Confirmed**

Your insurance enrolment has been successfully completed.  
You can view your enrolment summary in the portal.

View summary: {{Enrolment Summary Short URL}}

---

**TPA E-Card Available**

Your TPA E-Card is now available.  
You can view or download it from the employee portal.

Access card: {{TPA Card Short URL}}

---

**Policy Document Available**

Your insurance policy document has been generated.  
You can view or download it from the employee portal.

View document: {{Policy Doc Short URL}}

