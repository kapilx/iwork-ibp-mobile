# PRD - Phase 2

## What We're Building
• Complete email management system for companies to manage email templates and triggers
• Handles all employee email communications automatically based on business events
• Supports multiple policies and complex employee-policy relationships

## Main Features

### Email Configuration Setup
• Add "Email Configuration" section in Portal Configuration → Company Configuration
• Configure all email types in one place
• Easy interface for CRM teams to manage templates
• Preview functionality before going live

### Email Types & Categories
• **Onboarding Mails**
    • Employee + Dependents and Benefits version
    • Employee Only version
    • Sub-types: User Created, Enrollment Start, Enrollment Reminders, Enrollment Confirmation, Enrollment Updates
• **Authentication Mails**
    • Password Reset Link, Password Reset Status, OTP Mail, 2FA
• **Documents Generated**
    • Policy Info, Policy Features, Ecards, Hospital Network
• **Claims**
    • Pre Auth Doc, Pre Auth Approved/Rejected, Claim Initiated, Claim Status
• **Life Events**
    • Child Born, Marriage, Divorce, Dependent Expiry
• **Future Year Policy**
    • User Created, Enrollment Opens, Enrollment Reminders, Enrollment Confirmation, Enrollment Updates

### Template Management
• Dropdown list of templates for each email type
• "Create New Template" option in dropdown
• Templates save automatically and appear in future selections
• Template preview before selection
• Version control for templates
• Templates go live immediately after creation/editing

### Smart Email Targeting
• Only send emails to employees associated with relevant policies
• Handle multiple policies per employee correctly
• Respect different enrollment dates for different policies
• Send batch emails to all company employees or individual emails
• Don't send policy-specific emails to employees not on that policy

### Automatic Trigger System
• Configure when emails should be sent automatically
• Business event triggers (enrollment, claims, document generation, etc.)
• Timing rules (immediate, scheduled, reminder sequences)
• Policy association rules
• Employee eligibility rules

## User Experience

### For CRM Team Administrators
• Access email config through existing Portal Configuration menu
• Choose email type from organized categories
• Select template from dropdown or create new one
• Set up trigger rules with simple interface
• Preview templates before activating
• Manage template library easily
• Templates go live immediately after saving

### For Employees
• Receive relevant emails based on their policy associations
• Get timely notifications for important events
• Clear, consistent branding across all communications

## Complex Multi-Policy Email Scenarios

### Brokerage Company Email Management
• **Broker Role**: Insurance brokerage company sends emails to client company employees about their specific policy benefits
• **Client Companies**: Each client company may have single or multiple policies from the broker
• **Employee Targeting**: Emails sent to client company employees based on their individual policy enrollments
• **Brand Management**: All emails maintain broker company branding while delivering client-specific policy information

### Multi-Policy Employee Targeting Rules

#### Scenario 1: Single Policy Company
• Company has only one policy (e.g., GMC only)
• All employees enrolled in that single policy
• All email triggers apply to all employees
• Template content focuses on single policy benefits and features
• Example: "Welcome to your GMC policy" email goes to all employees

#### Scenario 2: Multiple Policy Company  
• Company offers multiple policies (e.g., GMC, GTL, GPA, OPD)
• Employees can enroll in one, some, or all available policies
• Email triggers must check employee's specific policy enrollments
• Only send policy-specific emails to employees enrolled in that policy
• Example: GTL claim notification only goes to employees who have GTL coverage

#### Scenario 3: Policy with Multiple Plans (Sub-Policies)
• Single policy type has multiple plan options (e.g., GMC Basic, GMC Premium, GMC Family)
• Each plan may have different benefits, coverage, and enrollment periods
• Employees enrolled in specific plan receive plan-specific communications
• Template content varies based on plan features and benefits
• Example: "GMC Premium network hospital update" only goes to Premium plan members

### Enrollment Date-Based Email Automation

#### Different Enrollment Periods Management
• **Policy Level Dates**: Each policy type has its own enrollment start/end dates
• **Plan Level Dates**: Sub-policies within same policy can have different enrollment periods  
• **Employee Level Dates**: Track when each employee enrolled in each policy/plan
• **Trigger Matching**: System matches trigger timing with relevant enrollment periods

#### Enrollment Start Date Email Logic
• **Automatic Trigger**: System automatically sends emails when enrollment periods begin
• **Policy Filtering**: Only employees eligible for the specific policy receive enrollment start emails
• **Content Personalization**: Email template includes details for the specific policy/plan opening enrollment
• **Multi-Policy Handling**: If multiple policies start enrollment on same date, separate emails sent for each policy
• **Example Flow**:
    - GMC enrollment starts January 1st
    - GTL enrollment starts January 15th  
    - Employees get GMC enrollment email on Jan 1st (only if eligible for GMC)
    - Same employees get GTL enrollment email on Jan 15th (only if eligible for GTL)

#### Enrollment Reminder Email Logic
• **Policy-Specific Reminders**: Reminders sent only for policies with active enrollment periods
• **Employee Eligibility**: Only employees eligible for specific policy receive reminders
• **Enrollment Status Check**: Don't send reminders to employees who already completed enrollment
• **Multiple Policy Reminders**: Employees may receive reminders for multiple policies if enrolled in multiple plans
• **Example**: Employee gets GMC reminder on day 5, GTL reminder on day 3, based on their individual enrollment status for each policy

### Email Targeting Intelligence

#### Per-Employee Targeting
• **Individual Triggers**: System evaluates each employee's policy associations individually
• **Personal Timeline**: Each employee has unique timeline based on their policy enrollment dates
• **Event-Based**: Personal events (marriage, child birth) trigger emails only for policies that cover those events
• **Example**: Employee adds new child - only sends dependent addition email for policies that include dependent coverage

#### Batch Email with Smart Filtering  
• **Company-Wide Campaigns**: Send emails to all company employees but filter based on policy relevance
• **Automatic Filtering**: System automatically excludes employees not enrolled in relevant policies
• **Policy-Aware Content**: Same email template adapts content based on recipient's specific policy enrollments
• **Example**: "Annual policy update" email sent to all employees but content shows only policies each employee is enrolled in

#### Automatic Trigger System Intelligence
• **Date-Based Triggers**: Monitor enrollment dates, policy effective dates, renewal dates for each policy/plan
• **Event-Based Triggers**: Monitor business events (claims, life events, document generation) and match to relevant policies
• **Employee-Policy Matching**: Always verify employee is enrolled in relevant policy before sending email
• **Multi-Policy Coordination**: Handle cases where single event affects multiple policies (e.g., marriage affects both GMC and GTL)

### Template and Content Management

#### Policy-Specific Templates
• **Policy Categories**: Separate template libraries for each policy type (GMC, GTL, GPA, etc.)
• **Plan Variations**: Template variations for different plans within same policy
• **Dynamic Content**: Templates automatically populate policy-specific information (benefits, coverage amounts, network details)
• **Content Rules**: Templates include only information relevant to recipient's enrolled policies

#### Multi-Policy Email Consolidation
• **Smart Consolidation**: When multiple policies trigger emails on same day, system can consolidate into single email
• **Sectioned Content**: Consolidated emails clearly separate information by policy type
• **Priority Rules**: Critical emails (claims, urgent notifications) sent separately even if other emails are pending
• **User Preference**: Allow employees to choose consolidated vs. separate emails for different communication types

### Practical Implementation Examples

#### Example 1: Enrollment Start Email Flow
1. **Setup**: Company has GMC (Jan 1 start) and GTL (Jan 15 start) policies
2. **Employee Status**: Employee A eligible for both, Employee B eligible for GMC only
3. **Jan 1 Trigger**: 
   - Employee A gets GMC enrollment email
   - Employee B gets GMC enrollment email
   - Template shows GMC-specific benefits and enrollment steps
4. **Jan 15 Trigger**:
   - Employee A gets GTL enrollment email  
   - Employee B gets no email (not eligible for GTL)
   - Template shows GTL-specific benefits and enrollment steps

#### Example 2: Claim Notification Email Flow
1. **Event**: Claim submitted for GMC policy
2. **System Check**: Identify all employees with GMC coverage
3. **Content Generation**: Template uses GMC claim process information
4. **Email Delivery**: Only GMC-enrolled employees receive claim process update
5. **Other Policies**: Employees with only GTL/GPA coverage receive no email for this GMC-specific event

#### Example 3: Life Event Email Flow  
1. **Event**: Employee reports marriage
2. **Policy Analysis**: System checks all employee's policies for dependent coverage options
3. **Relevant Policies**: GMC and GTL allow dependent addition, GPA does not
4. **Email Generation**: 
   - Send "Add spouse to coverage" email mentioning GMC and GTL options
   - Include specific steps for each policy type
   - No mention of GPA since it doesn't offer dependent coverage
5. **Follow-up**: Track enrollment changes and send confirmation emails for each policy updated

## Business Rules
• Only send emails for policies the employee is enrolled in at the time of trigger
• Use employee's policy status at time of trigger, not when trigger was set up
• Each email type needs at least one active template before triggers work
• Template changes go live immediately after saving
• Only CRM team administrators can create and modify templates
• Multiple policies can share templates if business rules are the same
• Failed emails get retried automatically
• Employees can't get duplicate emails for the same event
• **Policy-Specific Targeting**: Emails only sent to employees enrolled in the specific policy that triggered the event
• **Date-Based Intelligence**: System automatically matches enrollment periods with trigger dates
• **Multi-Policy Coordination**: Handle overlapping policy events intelligently without spam
• **Plan-Level Granularity**: Support different email rules for sub-policies within same policy type
• **Broker-Client Relationship**: All emails maintain broker branding while delivering client company policy information

## Technical Requirements
• Template creation and editing tools
• Email delivery system integration
• Employee and policy data integration
• Business event monitoring system
• Email tracking and delivery status
• Error handling and retry logic
• Security and permissions management

## Success Criteria
• CRM teams can set up email templates in under 30 minutes
• 99% of emails deliver successfully
• Employees receive relevant emails within 5 minutes of trigger events
• Zero manual email management needed for routine communications
• All company communications maintain consistent branding
• System handles complex multi-policy scenarios correctly

## What's Out of Scope
• SMS/WhatsApp templates (separate module handles this)
• Email analytics and reporting (analytics module handles this)
• External email service integrations (infrastructure handles this)
• Marketing campaign features beyond basic employee communications

## Email Template Master Library

### Template Configuration Rules
• Each email type has minimum 2 template options (Template A & Template B)
• Templates support dynamic field insertion using {{Field_Name}} syntax
• All templates include broker company branding placeholders
• Policy-specific templates automatically populate relevant policy information
• Multi-policy templates consolidate information for employees with multiple policies

| **Email Category** | **Email Type** | **Template ID** | **Template Name** | **Subject Line** | **Key Content Elements** | **Dynamic Fields** |
|-------------------|----------------|-----------------|-------------------|------------------|--------------------------|-------------------|
| **ONBOARDING** | Employee + Dependents | OBD-EMP-DEP-001 | Comprehensive Family Welcome | Welcome to Your Family Insurance Coverage - {{Policy_Name}} | Welcome message, family coverage details, dependent info, portal access, support contacts | {{Employee_Name}}, {{Policy_Name}}, {{Total_Lives}}, {{Dependent_Details}}, {{Portal_URL}} |
| | | OBD-EMP-DEP-002 | Simple Family Onboarding | Your Insurance Coverage Is Active - {{Policy_Name}} | Basic welcome, family summary, quick access guide, essential contacts | {{Employee_Name}}, {{Policy_Name}}, {{Family_Count}}, {{Portal_URL}}, {{Support_Phone}} |
| | Employee Only | OBD-EMP-ONLY-001 | Individual Welcome Package | Welcome to Your Personal Insurance Benefits - {{Policy_Name}} | Personal welcome, individual coverage, benefits summary, portal guide | {{Employee_Name}}, {{Policy_Name}}, {{Coverage_Details}}, {{Portal_URL}}, {{TPA_Name}} |
| | | OBD-EMP-ONLY-002 | Quick Individual Setup | Your Insurance Account Is Ready - {{Policy_Name}} | Brief welcome, key benefits, quick login guide, support info | {{Employee_Name}}, {{Policy_Name}}, {{Login_Instructions}}, {{Support_Email}} |
| | User Created | OBD-USER-001 | Complete Registration Guide | Your Insurance Portal Account Has Been Created | Account creation confirmation, detailed login steps, feature overview, support | {{Employee_Name}}, {{Email_ID}}, {{Portal_URL}}, {{Broker_Company}} |
| | | OBD-USER-002 | Simple Account Setup | Insurance Portal Access Ready | Basic account info, simple login steps, quick start guide | {{Employee_Name}}, {{Login_URL}}, {{Support_Contact}} |
| | Enrollment Start | OBD-ENROLL-START-001 | Enrollment Window Opens | Enrollment Now Open - Action Required for {{Policy_Name}} | Enrollment period details, policy info, steps to enroll, deadline reminder | {{Policy_Name}}, {{Enrollment_Start}}, {{Enrollment_End}}, {{TPA_Coordinator}} |
| | | OBD-ENROLL-START-002 | Quick Enrollment Alert | Time to Enroll - {{Policy_Name}} Coverage | Simple enrollment notice, key dates, direct action button | {{Policy_Name}}, {{Enrollment_End}}, {{Enrollment_URL}} |
| | Enrollment Reminder | OBD-ENROLL-REM-001 | Detailed Enrollment Reminder | Reminder: Complete Your Enrollment - {{Days_Remaining}} Days Left | Days remaining, consequences of missing deadline, step-by-step guide, support | {{Employee_Name}}, {{Policy_Name}}, {{Days_Remaining}}, {{Enrollment_URL}} |
| | | OBD-ENROLL-REM-002 | Urgent Enrollment Notice | Final Reminder - Enrollment Closes Soon | Urgent tone, deadline emphasis, quick enrollment link | {{Employee_Name}}, {{Days_Remaining}}, {{Enrollment_URL}} |
| | Enrollment Confirmation | OBD-ENROLL-CONF-001 | Complete Enrollment Confirmation | Enrollment Confirmed - {{Policy_Name}} Coverage Secured | Confirmation details, coverage summary, next steps, document timeline | {{Employee_Name}}, {{Policy_Name}}, {{Enrollment_Date}}, {{Coverage_Details}} |
| | | OBD-ENROLL-CONF-002 | Simple Enrollment Success | Enrollment Complete - {{Policy_Name}} | Basic confirmation, effective date, portal access | {{Employee_Name}}, {{Policy_Name}}, {{Effective_Date}} |
| **AUTHENTICATION** | Password Reset Link | AUTH-PWD-RESET-001 | Secure Password Reset | Reset Your Insurance Portal Password | Security-focused message, reset link, expiry info, security tips | {{Employee_Name}}, {{Reset_URL}}, {{Link_Expiry}}, {{Support_Contact}} |
| | | AUTH-PWD-RESET-002 | Quick Password Reset | Password Reset Requested | Simple reset instructions, reset link, basic security note | {{Employee_Name}}, {{Reset_URL}}, {{Expiry_Time}} |
| | Password Reset Status | AUTH-PWD-STATUS-001 | Password Reset Successful | Password Successfully Updated | Success confirmation, login instructions, security reminders | {{Employee_Name}}, {{Reset_Date}}, {{Login_URL}} |
| | | AUTH-PWD-STATUS-002 | Password Reset Failed | Password Reset Unsuccessful | Failure notification, retry instructions, support contact | {{Employee_Name}}, {{Error_Reason}}, {{Support_Email}} |
| | OTP Mail | AUTH-OTP-001 | Secure Login OTP | Your One-Time Password for Portal Access | OTP code, validity period, security warnings, portal link | {{Employee_Name}}, {{OTP_Code}}, {{Expiry_Minutes}}, {{Login_URL}} |
| | | AUTH-OTP-002 | Quick Login Code | Login Verification Code | Simple OTP delivery, expiry time, login link | {{OTP_Code}}, {{Expiry_Minutes}}, {{Login_URL}} |
| | 2FA Authentication | AUTH-2FA-001 | Two-Factor Authentication | Verify Your Identity - 2FA Code | 2FA explanation, verification code, step-by-step guide | {{Employee_Name}}, {{2FA_Code}}, {{Device_Info}}, {{Verification_URL}} |
| | | AUTH-2FA-002 | Identity Verification | Security Verification Required | Basic 2FA code, verification instructions | {{2FA_Code}}, {{Verification_Steps}} |
| **DOCUMENTS** | Policy Info | DOC-POLICY-001 | Complete Policy Package | Your Policy Documents Are Ready - {{Policy_Name}} | Policy details, document attachments, download links, coverage summary | {{Policy_Name}}, {{Policy_Period}}, {{Document_Links}}, {{Coverage_Summary}} |
| | | DOC-POLICY-002 | Policy Documents Available | Policy Information Now Available | Simple document notification, download link, key details | {{Policy_Name}}, {{Download_Link}}, {{Policy_Period}} |
| | Policy Features | DOC-FEATURES-001 | Comprehensive Benefits Guide | Explore Your Policy Features - {{Policy_Name}} | Detailed feature breakdown, benefit explanations, usage guide | {{Policy_Name}}, {{Feature_List}}, {{Benefit_Details}}, {{Usage_Guide}} |
| | | DOC-FEATURES-002 | Policy Benefits Summary | Your Coverage Benefits - {{Policy_Name}} | Quick benefits overview, key features, access link | {{Policy_Name}}, {{Key_Benefits}}, {{Features_URL}} |
| | E-Cards | DOC-ECARD-001 | TPA E-Card Package | Your TPA E-Cards Are Ready - {{Policy_Name}} | E-card availability, usage instructions, network hospitals, download links | {{Policy_Name}}, {{TPA_Name}}, {{Card_Links}}, {{Network_Info}} |
| | | DOC-ECARD-002 | E-Card Ready | TPA E-Cards Now Available | Simple e-card notification, download link, basic usage | {{TPA_Name}}, {{Card_Download}}, {{Usage_Tips}} |
| | Hospital Network | DOC-NETWORK-001 | Complete Network Guide | Hospital Network Directory - {{Policy_Name}} | Network hospital list, search functionality, location details, contact info | {{Policy_Name}}, {{Network_Count}}, {{Search_URL}}, {{Download_Link}} |
| | | DOC-NETWORK-002 | Hospital Network Update | Updated Hospital Network Available | Network update notification, access link, key changes | {{Policy_Name}}, {{Update_Date}}, {{Network_URL}} |
| **CLAIMS** | Pre-Auth Document | CLAIM-PREAUTH-DOC-001 | Pre-Authorization Guide | Pre-Authorization Required - {{Policy_Name}} | Pre-auth process, required documents, submission steps, timeline | {{Policy_Name}}, {{Required_Docs}}, {{Submission_Process}}, {{Timeline}} |
| | | CLAIM-PREAUTH-DOC-002 | Pre-Auth Requirements | Pre-Authorization Documents Needed | Simple pre-auth notice, document list, submission link | {{Policy_Name}}, {{Document_List}}, {{Submit_URL}} |
| | Pre-Auth Status | CLAIM-PREAUTH-STATUS-001 | Pre-Authorization Decision | Pre-Auth {{Status}} - {{Policy_Name}} Claim | Detailed status, approval/rejection reasons, next steps, appeal process | {{Status}}, {{Policy_Name}}, {{Decision_Details}}, {{Next_Steps}} |
| | | CLAIM-PREAUTH-STATUS-002 | Pre-Auth Update | Pre-Authorization {{Status}} | Simple status update, basic details, contact info | {{Status}}, {{Claim_Number}}, {{Contact_Info}} |
| | Claim Initiated | CLAIM-INIT-001 | Claim Submission Confirmation | Claim Successfully Submitted - {{Policy_Name}} | Submission confirmation, claim number, processing timeline, status tracking | {{Policy_Name}}, {{Claim_Number}}, {{Submission_Date}}, {{Tracking_URL}} |
| | | CLAIM-INIT-002 | Claim Received | Your Claim Has Been Received | Simple confirmation, claim number, expected timeline | {{Claim_Number}}, {{Processing_Time}}, {{Status_URL}} |
| | Claim Status | CLAIM-STATUS-001 | Detailed Claim Update | Claim Status Update - {{Status}} for {{Policy_Name}} | Comprehensive status, processing details, payment info, appeal options | {{Status}}, {{Policy_Name}}, {{Claim_Number}}, {{Payment_Details}} |
| | | CLAIM-STATUS-002 | Claim Update | Claim {{Status}} - Reference {{Claim_Number}} | Basic status update, key information, next steps | {{Status}}, {{Claim_Number}}, {{Next_Action}} |
| **LIFE EVENTS** | Child Born | LIFE-CHILD-001 | New Baby Coverage Guide | Congratulations! Add Your Newborn to {{Policy_Name}} | Congratulations message, dependent addition process, timeline, coverage details | {{Employee_Name}}, {{Policy_Name}}, {{Addition_Process}}, {{Coverage_Details}} |
| | | LIFE-CHILD-002 | Baby Addition Notice | Add Your New Child to Insurance Coverage | Simple addition notice, required steps, deadline | {{Employee_Name}}, {{Addition_Steps}}, {{Deadline}} |
| | Marriage | LIFE-MARRIAGE-001 | Spouse Coverage Welcome | Marriage Coverage Update - {{Policy_Name}} | Marriage congratulations, spouse addition guide, benefit changes, process | {{Employee_Name}}, {{Policy_Name}}, {{Spouse_Benefits}}, {{Addition_Guide}} |
| | | LIFE-MARRIAGE-002 | Spouse Addition | Add Your Spouse to Insurance Coverage | Basic spouse addition notice, simple steps | {{Employee_Name}}, {{Addition_Process}} |
| | Divorce | LIFE-DIVORCE-001 | Coverage Change Notice | Important: Update Your Coverage After Divorce | Sensitive tone, dependent removal process, deadline, coverage impact | {{Employee_Name}}, {{Policy_Name}}, {{Removal_Process}}, {{Impact_Details}} |
| | | LIFE-DIVORCE-002 | Dependent Removal | Update Insurance After Life Change | Simple dependent removal notice, required actions | {{Employee_Name}}, {{Removal_Steps}} |
| | Dependent Expiry | LIFE-EXPIRE-001 | Dependent Coverage Update | Coverage Change - Dependent Eligibility Update | Age-out or eligibility change, coverage impact, action required, alternatives | {{Employee_Name}}, {{Dependent_Name}}, {{Expiry_Reason}}, {{Alternatives}} |
| | | LIFE-EXPIRE-002 | Coverage Change Notice | Dependent Coverage Ending | Simple expiry notice, effective date, impact | {{Dependent_Name}}, {{Expiry_Date}}, {{Coverage_Impact}} |
| **FUTURE YEAR** | User Created | FUTURE-USER-001 | Next Year Portal Access | Your Future Year Portal Access Is Ready | Next year setup, new features, timeline, preparation steps | {{Employee_Name}}, {{Policy_Year}}, {{New_Features}}, {{Timeline}} |
| | | FUTURE-USER-002 | Annual Portal Setup | Portal Ready for {{Policy_Year}} | Simple annual setup notice, access info | {{Employee_Name}}, {{Policy_Year}}, {{Access_URL}} |
| | Enrollment Opens | FUTURE-OPEN-001 | Annual Enrollment Begins | {{Policy_Year}} Enrollment Now Open - Review Your Options | Annual enrollment start, policy changes, decision timeline, comparison tools | {{Policy_Year}}, {{Changes_Summary}}, {{Enrollment_End}}, {{Comparison_URL}} |
| | | FUTURE-OPEN-002 | Annual Enrollment Alert | Time for {{Policy_Year}} Enrollment | Simple annual enrollment notice, key dates | {{Policy_Year}}, {{Enrollment_Period}}, {{Enroll_URL}} |
| | Enrollment Reminders | FUTURE-REM-001 | Annual Enrollment Reminder | Don't Miss {{Policy_Year}} Enrollment - {{Days_Remaining}} Days Left | Annual deadline reminder, coverage gaps warning, action steps | {{Policy_Year}}, {{Days_Remaining}}, {{Coverage_Gap_Warning}}, {{Enroll_URL}} |
| | | FUTURE-REM-002 | Enrollment Deadline Alert | {{Policy_Year}} Enrollment Closing Soon | Urgent annual reminder, deadline, quick action | {{Policy_Year}}, {{Days_Remaining}}, {{Quick_Enroll_URL}} |
| | Enrollment Confirmation | FUTURE-CONF-001 | Annual Enrollment Confirmed | {{Policy_Year}} Enrollment Complete - Coverage Confirmed | Annual confirmation, coverage summary, effective dates, changes from previous year | {{Policy_Year}}, {{Coverage_Summary}}, {{Effective_Date}}, {{Changes}} |
| | | FUTURE-CONF-002 | Annual Enrollment Success | {{Policy_Year}} Coverage Confirmed | Simple annual confirmation, effective date | {{Policy_Year}}, {{Effective_Date}} |

### Template Usage Guidelines

#### Multi-Policy Template Logic
• **Policy-Specific Templates**: When employee has single policy, use policy-specific content and branding
• **Consolidated Templates**: When employee has multiple policies, templates automatically section content by policy type
• **Dynamic Field Population**: Templates automatically populate only fields relevant to employee's enrolled policies
• **Content Filtering**: Irrelevant sections are automatically hidden based on employee's policy associations

#### Trigger-Based Template Selection
• **Automatic Selection**: System selects appropriate template based on configured rules for each company
• **A/B Options**: CRM teams can choose Template A (comprehensive) or Template B (simple) for each email type
• **Policy-Aware Content**: Templates automatically adapt content based on policy type (GMC, GTL, GPA, etc.)
• **Enrollment Date Logic**: Templates respect different enrollment dates for different policies

#### Template Customization Rules
• **Company Branding**: All templates include {{Broker_Company}} placeholders for consistent branding
• **Dynamic Content**: Templates support conditional content based on policy features and employee data
• **Multi-Language Support**: Templates can be created in multiple languages for diverse employee bases
• **Version Control**: Each template maintains version history for audit and rollback purposes