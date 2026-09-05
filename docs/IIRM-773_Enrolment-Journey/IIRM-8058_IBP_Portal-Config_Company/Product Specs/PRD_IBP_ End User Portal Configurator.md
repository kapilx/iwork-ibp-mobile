Portal Configuration Module (Employer Portal)

1. Overview
The Portal Configuration module enables brokerage admins to configure company-specific employer portals in a controlled and brand-safe manner.
The module supports configuration of:
Login methods


Company branding (logo only)


Portal URL


Policy enrollment settings


Wellness benefit structure


Admins can preview the complete portal experience (login, wellness, policy enrollment) using Preview Mode before publishing.
The module intentionally restricts customization to prevent UI inconsistencies, onboarding errors, and support overhead.

2. Problem Statement
The current configuration experience:
Allows excessive customization (colors, SSO, HRMS, access rules, claims UI behavior, document logic)


Leads to inconsistent portal experiences across employers


Increases onboarding time and configuration errors


Lacks a unified structure for:


Wellness benefits


Login methods


Enrollment windows


Notification rules


There is no guardrail-driven system to ensure portals remain:
Brand-safe


UX-consistent


Easy to configure and maintain



3. Objective
Provide a streamlined, guardrail-based portal configuration experience that:
Allows admins to configure only permitted elements:


Logo


Login methods


Policies


Wellness benefits


Enforces consistency via:


Controlled logo usage (no themes/colors)


Fixed character limits for text


Standardized login behavior


Unified breadcrumb navigation


Explicit notification rules per login type


Clearly defines wellness structure:


Corporate Wellness → Mandatory


Insurance Wellness → Allowed / Not Allowed


If allowed → Corporate or Retail variant



4. In Scope
Area
Included
Company branding (logo only)
✔
Header & tagline text (character-limited)
✔
Portal URL configuration + preview
✔
Login method configuration
✔
Notification rules by login type
✔
Wellness configuration (Corporate + Insurance)
✔
Sub-configuration per wellness benefit
✔
Policy assignment & enrollment window
✔
Financial settings (policy-level)
✔
Family eligibility
✔
Preview Mode
✔
Unified breadcrumb navigation
✔

Explicitly Out of Scope
❌ Color/theme configuration


❌ SSO / HRMS integrations


❌ Access rule engines


❌ Claims UI behavior


❌ Document rule configuration


❌ Employer contribution setup



5. User Interface (High-Level)
Admin Portal Sections
Company Branding


Logo upload


Header text


Tagline text


Portal URL


Login Configuration


Allowed login methods


2FA configuration


Login-specific messaging rules


Wellness Configuration


Corporate Wellness (mandatory)


Insurance Wellness (Allowed / Not Allowed)


Wellness benefit sub-configurations


Policy Setup


Policy assignment


Enrollment window


Financial settings


Family eligibility


Preview Mode


Login experience


Wellness experience


Policy enrollment experience



6. Functional Requirements (Detailed)
Branding & Portal Identity

FR-01: Logo Upload
The system shall allow admins to upload only a company logo as the sole branding element.
Supported formats: PNG, JPG, SVG


Logo is used in:


Login page


Portal header


No color, font, or layout customization is permitted



FR-02: Header & Tagline Text
The system shall allow admins to configure:
Header text


Tagline text


Both fields must:
Enforce system-defined maximum character limits


Prevent save if limits are exceeded


Display character counter while typing



FR-03: Portal URL Configuration
The system shall allow admins to configure a portal slug that forms the employer portal URL.

FR-03.1: Portal URL Preview
The system shall display a real-time, read-only preview of the portal URL as the admin types the slug.
Rules:
Always prefixed with https://


Uses system-defined base domain (e.g., iirm.com)


Slug appended as subdomain or path


Clearly labeled as:


“Preview URL”


“Not Production”


Example:
 https://payline-india.iirm.com

FR-03.2: Portal URL Validation
The system shall validate the portal slug in real time.
Validation Rules:
Mandatory field


Lowercase letters (a–z), numbers (0–9), hyphens only


Cannot start or end with hyphen


No spaces or special characters


UX Behavior:
Inline error messages


Save/Publish disabled until resolved


Preview updates instantly on valid input



Login Configuration

FR-04: Login Method Configuration
The system shall allow admins to enable one or more of the following login methods:
Email + Password


Mobile Number + OTP


Employee ID + Year of Birth



FR-05: 2FA Enforcement
If Email + Password login is enabled:
Admin must configure at least one 2FA channel:


Email


Mobile


System blocks publish if 2FA is not configured



FR-06: Login-Specific Notification Rules
The system shall automatically enforce notification behavior based on login method:
Login Type
Notification
Email + Password
Welcome email + password reset
Mobile + OTP
Welcome SMS
Employee ID + YOB
No communication

Admins cannot modify these rules.

Wellness Configuration

FR-07: Corporate Wellness (Mandatory)
The system shall always enable Corporate Wellness.
Admin cannot disable or hide this section


At least one wellness benefit must be configured



FR-08: Insurance Wellness Toggle
The system shall allow admins to mark Insurance Wellness as:
Allowed


Not Allowed



FR-09: Insurance Wellness Type
If Insurance Wellness = Allowed:
Admin must select:


Corporate Policy


Retail Policy


Save/Publish blocked until selection is made



FR-10: Wellness Benefit Sub-Configuration
Each wellness benefit must have:
Its own configuration section


Mandatory fields completed before publish


System must display label:
“Benefits available under selected wellness program”

Policy Configuration

FR-11: Policy Assignment
The system shall allow admins to assign one or more policies to the company portal.

FR-12: Enrollment Window Configuration
Admins must configure:
Enrollment start date


Enrollment end date


Rules:
Dates mandatory


Start date < end date


No overlapping enrollment windows



FR-13: Financial Settings
The system shall allow configuration of policy financial settings excluding employer contribution.

FR-14: Family Eligibility
The system shall allow admins to configure:
Eligible family relationships


Dependent limits (if applicable)


7. Business Rules
Branding
Only logo upload permitted


No themes, colors, fonts


Login
Password login requires 2FA


Notification rules are system-defined and non-editable


Wellness
Corporate Wellness is mandatory


Insurance Wellness optional but strictly typed


Each benefit must be configured independently


Policy
Enrollment windows mandatory


Employer contribution not configurable


Claims & document rules excluded



8. Validations
ID
Rule
V-01
Logo format & size validation
V-02
Header & tagline character limits
V-03
URL format & hyphen rules
V-04
2FA mandatory for password login
V-05
Employee ID + YOB requires both fields
V-06
Insurance wellness type mandatory
V-07
Wellness sub-config must be complete
V-08
Enrollment dates mandatory
V-09
Start date < end date



