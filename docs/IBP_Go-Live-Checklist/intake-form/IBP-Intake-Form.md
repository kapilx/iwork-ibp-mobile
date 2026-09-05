---
form_title: Integrated Wellness Hub (IWH) — Portal Setup
form_subtitle: Client intake for company & policy configuration (internal name: IBP)
form_version: v3
form_date: 06-July-2026
output_html: intake-form/IBP-Intake-Form.html
portal_domain_suffix: .iwh.indiainsure.com
header_logo: docs/IBP_Go-Live-Checklist/intake-form/iirm-logo.svg
header_logo_position: left
footer_logo: docs/IBP_Go-Live-Checklist/intake-form/iirm-logo.svg
footer_company_name: India Insure Risk Management & Insurance Broking Private Limited
footer_license: Composite Broker IRDA Licence No. 101•Valid till 29.01.2027•CIN No: U67120TG1999PTC031412
footer_copyright: Copyright © 2026.
footer_link_terms: https://indiainsure.iirmholdings.in/terms-and-conditions/
footer_link_privacy: https://indiainsure.iirmholdings.in/privacy-policy/
footer_link_grievance: https://indiainsure.iirmholdings.in/report-grievance/
---

<!--
HOW TO EDIT THIS FILE
=====================
This file is the single source of truth for the intake form. Edit questions here,
then run:  python3 "docs/IBP_Go-Live-Checklist/generate_ibp_docs.py" form
to regenerate the HTML form.

FORM FLOW = FOUR PARTS ("# Part:" chapters), ordered for easy filling:
  A — Company & Portal Basics (identity, sub-domain, login screen)
  B — Employee Journey (what employees see, in screen order: T&C ->
      dashboard policy cards -> enrollment -> documents -> services -> support)
  C — Communications & Content (messages, footer, benefits year)
  D — Access & Go-Live (HR admins, readiness, review/export)
Stage chips ({stage=N}) are independent of part order — they say when each
section's inputs must be READY, not when they are filled.

STRUCTURE RULES (the generator parses these exactly):
- "# Welcome"        : free prose, rendered as the welcome panel.
- "# Pre-requisites" : intro line, then "### Stage: <title>" sub-headings, each
                       followed by "- [ ]" checklist items (soft checklist —
                       stages mirror the go-live gating chain, do not block the form).
- "# Part: <title>"    : chapter divider — renders a part band in the page and
                         groups the sidebar entries under it.
- "# Section: <title>"                   : one form section, in page order.
- "# Section: <title> {repeat=<label>}"  : repeatable section — filler can click "Add another <label>".
- "# Section: <title> {stage=<1|2|3>}"   : tags the section with the pre-requisites stage it feeds —
                                           renders a colored Stage chip on the section header and in the
                                           sidebar. Attributes combine: {repeat=Policy} {stage=2}.
- "### Group: <title>" : visual sub-group inside a section; each group has its own question table.
- "> Help: ..."        : intro/help text shown under the section or group title.
- "# Out of Scope"     : parking-lot appendix — the generator STOPS PARSING at this
                         heading; nothing after it appears in the HTML form.
- Question tables must keep this exact column order:
  | ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |

COLUMN MEANING:
- "Help text (user)"  : shown beside the field, always visible. Write in simple,
  layman terms — assume the reader knows nothing about insurance or iWork.
- "Where configured (IIRM internal)" : internal note for the IIRM ops team; the form
  shows it only when the "Show IIRM notes" toggle is on.

FIELD TYPES:
- text, textarea, email, phone, number, date
- yesno                      : Yes / No radio pair
- select(A, B, C)            : dropdown, options comma-separated
- multiselect(A, B, C)       : checkboxes, options comma-separated
- file(ext; max)             : file attachment — prototype captures filename only
- contact                    : renders Name / Phone / Email triple
- list                       : multi-line bullet entry (one item per line)
- info                       : display-only note, no input
- rows(colA, colB, ...)      : repeatable table rows with the named columns
- relmatrix(Cat: a, b; Cat2: c, ...) : fixed relationship matrix — tick to allow,
  then min/max age + notes unlock on that row. List mirrors iWork policytypes.ts.
- Add "template=<file>" in a question's Options / Format cell to embed
  intake-form/templates/<file> as a "Download template" button on that question.

OWNER VALUES: Client | IIRM | Client+IIRM
  IIRM-owned questions render greyed with an "IIRM to fill" badge.
REQUIRED VALUES: Yes | No

IDs are stable identifiers — they keep their prefix even if a question moves to a
different section. Per-policy sections (4, 5, 6) each repeat per policy; EN1/DC1
tie an Enrollment/Documents block back to its Dashboard policy card by name.
-->

# Welcome

Welcome to the **Integrated Wellness Hub (IWH)** (Internally it is called as IBP - Integrated Benefits Portal) setup form.

This form collects everything IIRM team needs to configure your company group insurance policies (Refer below for policy types) on the portal. The sections follow the same order your employees will experience the portal — from the login screen, through first login and the dashboard, to enrollment — so you can picture each answer on the screen it shapes.

1. Group Mediclaim
2. Group Mediclaim Top-up
3. Group Personal Accidental
4. Group Personal Accidental Top-up
5. Group Term Life 
6. Group Term Life Top-up
7. Parental
8. Parental Top-up
9. Any other health related

**Who fills this:** your CRM contact at IIRM, or your HR team — sections are
labelled with an owner badge so you always know whose input is needed. Fields marked **IIRM to fill** are completed by IIRM and are shown only for transparency.

**Time needed:** roughly 30–45 minutes if the pre-requisites below are ready. Your entries stay in this page until you export — nothing is submitted automatically.

# Pre-requisites

Please keep the following ready before you start. The three stages mirror how the portal comes alive: employees can only log in after stage 1 is done, can only enroll after stage 2, and see full content once stage 3 is in. This checklist is for your convenience — it does not block the form.

### Stage: 1 — Before anyone can log in

- [ ] Company logo file (PNG / JPG / SVG, max 2 MB, ideally 200×200 px)
- [ ] Preferred portal sub-domain name
- [ ] Decision on employee login methods and password policy
- [ ] Employee data has the Email / Mobile columns filled that your chosen login methods require
- [ ] List of FAQ's in IIRM template (question/answer form)
- [ ] Escalation contacts — HR, DPO, Grievance, TPA, Broker (primary & secondary: name, phone, email)
- [ ] Email template choices — welcome, password reset, OTP, reminders — and custom wording if any
- [ ] Inception / endorsement files submitted to IIRM for every policy
- [ ] Enrollment drive start & end dates agreed per policy 
- [ ] Footer text — company name and copyright line

### Stage: 2 — Before employees can enroll

- [ ] Policy category per policy — Compulsory / Optional / Flex — and its component list (which employees each component covers)
- [ ] Policy Level constaints
- [ ] Full policy document (PDF) for each policy
- [ ] Short policy feature document (1–2 page PDF) for each policy
- [ ] Key highlights — 3 to 5 bullet points for each policy
- [ ] Network hospital list in the IIRM Excel template (per policy)
- [ ] Network hospital list from TPA using API integration
- [ ] Additional documents: Claim Form Part A & B, claim intimation form, NME list
- [ ] Company-wide disclaimer text and Terms & Conditions content
- [ ] Policy-level disclaimer text (if any)

### Stage: 3 — Portal content & support
- [ ] Decision on Wellness offering
- [ ] Decision on Policy Porting to employees
- [ ] HR Admin user details (Employee ID, name, work email, designation)

# Part: A — Company & Portal Basics

# Section: 1. Company & Portal Address {stage=1}

> Help: Who you are, who IIRM should talk to, and the web address your portal will live at.

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C1 | Company / Organisation legal name | text | 3–200 characters | Client | Yes | The official registered name of your company, exactly as it appears on legal and statutory documents. | iWork → Companies → Add/Edit Company; company master record. |
| C2 | Primary contact — Name | text | — | Client | Yes | The person IIRM should reach out to for anything about this setup. | Saved as main point of contact in the project record. |
| C3 | Primary contact — Email | email | — | Client | Yes | Their work email address. | — |
| C4 | Primary contact — Phone | phone | — | Client | Yes | Their mobile or office phone number. | — |
| C5 | Number of employees (approx.) | number | — | Client | Yes | A rough headcount of employees who will use the portal. An estimate is fine. | Used for capacity planning. |
| P1 | Preferred sub-domain | text | Lowercase letters, numbers, hyphens | Client | Yes | The first part of your portal's web address. If you choose "democorporation", employees will visit https://democorporation.iwh.indiainsure.com. | Portal Configuration → Company tab → sub-domain; DevOps provisions DNS. |
| P2 | Target go-live date | date | DD-MMM-YYYY | Client | Yes | The date you would like the portal to be live for your employees. | Tracked against implementation milestones. |
| C6 | Date this form is submitted | date | Defaults to today | Client | Yes | Today's date — when you are filling in this form. | Record of receipt date. |

# Section: 2. Login Screen — Branding & Sign-in {stage=1}

> Help: The first screen every user sees at your portal address (for example https://democorporation.iwh.indiainsure.com/). These inputs decide what that screen shows and how employees sign in from it.

### Group: Branding

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B1 | Company logo | file(PNG, JPG, SVG; max 2 MB) | Ideally 200×200 px | Client | Yes | Your company logo image file. It appears on the portal login page and in the header your employees see every day. | iWork → Company Details → Edit Company → logo upload. |
| B2 | Login welcome message — heading | text | e.g. "Welcome to Your Benefits Portal" | Client | No | A short greeting line employees see on the login page. Leave blank to use the standard greeting. | Portal Configuration — welcome heading. |
| B3 | Login welcome message — body text | textarea | 1–2 sentences | Client | No | One or two friendly sentences under the greeting, telling employees what they can do on the portal. | Portal Configuration — welcome body text. |

### Group: Login Options

> Help: Choose how employees sign in. You can enable more than one method; each enabled method has its own settings in the groups below.

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L1 | How should employees log in? | multiselect(Email + Password, Email + OTP, Mobile + OTP, Phone Number + Password, Employee ID + Year of Birth) | Tick every method to enable | Client | Yes | The sign-in methods your employees can use on the portal. | iWork Edge → My Company → Configure IBP Portal → Login & Authentication — method cards. |
| L7 | Login data requirement | info | **IMPORTANT:** If a chosen method uses Email (Email + Password, Email + OTP), the Email column is mandatory for every employee in the inception / endorsement data. If it uses Phone (Phone Number + Password, Mobile + OTP), the Mobile number column is mandatory. Employees missing that data cannot log in. | Client | No | Make sure your employee data has these columns filled before go-live. | Login identifiers come from inception / endorsement records. |

### Group: Password Settings

> Help: Answer only if a chosen method includes a password (Email + Password, Phone Number + Password).

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L4 | Password — minimum length | number | e.g. 8 | Client | No | The smallest number of characters a password must have. 8 is the default. | iWork Edge → My Company → Configure IBP Portal → Login & Authentication — Password Policy. |
| L6 | Password — must include | multiselect(Uppercase, Lowercase, Number, Special character) | Tick all that apply | Client | No | What every password must contain — capital letter, small letter, number, special character. | iWork Edge → My Company → Configure IBP Portal → Login & Authentication — Password Policy must-include toggles. |
| L8 | Password expiry | select(30 days, 60 days, 90 days, 120 days, Never) | — | Client | No | How often employees must set a new password. 90 days is the default. | iWork Edge → My Company → Configure IBP Portal → Login & Authentication — Password Expiry. |
| L9 | Require old password to change password? | yesno | — | Client | No | When changing their password, must employees first enter their current one? | iWork Edge → My Company → Configure IBP Portal → Login & Authentication — Change Password Policy. |
| L2 | Enable 2 Factor Authentication? | yesno | — | Client | No | An extra security step: after the password, employees also enter a one-time code (OTP). | iWork Edge → My Company → Configure IBP Portal → Login & Authentication — 2 Factor Authentication toggle. |

### Group: OTP Settings

> Help: Answer if a chosen method includes OTP (Email + OTP, Mobile + OTP), or if you enabled 2 Factor Authentication above.

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L3 | 2FA OTP delivery | multiselect(Email, Mobile Number) | Only if 2FA is Yes — select one or more | Client | No | Where the one-time code goes after a successful password login. | iWork Edge → My Company → Configure IBP Portal → Login & Authentication — 2FA OTP Delivery Method. |
| L10 | OTP validity duration (minutes) | number | 1–15, e.g. 5 | Client | No | How long a one-time code stays valid before it expires. 5 minutes is the default. | iWork Edge → My Company → Configure IBP Portal → Login & Authentication — OTP Configuration. |
| L11 | Resend OTP cooldown | select(30 sec, 60 sec, 90 sec, 120 sec) | — | Client | No | How long an employee must wait before asking for a new code. | iWork Edge → My Company → Configure IBP Portal → Login & Authentication — OTP Configuration. |

### Group: Employee ID Settings

> Help: Answer only if you chose Employee ID + Year of Birth. Note — this method sends no welcome message and no reminders, since there is no email or phone to send them to.

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L12 | Validate employee ID format at login? | yesno | — | Client | No | Should the portal check that the typed employee ID matches your company's ID pattern? | iWork Edge → My Company → Configure IBP Portal → Login & Authentication — Employee ID Format Validation toggle. |
| L13 | Employee ID format mask | text | e.g. EMP-XXXXX — X = any character, 9 = digit | Client | No | Your employee ID pattern. Use X for any character and 9 for a digit — for example EMP-99999 for "EMP-" followed by five digits. | iWork Edge → My Company → Configure IBP Portal → Login & Authentication — format mask field. |

### Group: Session

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L14 | Session timeout | select(15 minutes, 30 minutes, 60 minutes) | — | Client | Yes | How long the portal stays signed in with no activity before logging the employee out. 30 minutes is the default. | iWork Edge → My Company → Configure IBP Portal → Login & Authentication — Session Timeout (applies to every method). |

# Section: 3. First Login — Terms & Conditions and Disclaimer {stage=2}

> Help: The first time an employee logs in, the portal shows the Terms & Conditions popup for acceptance, along with any company-wide disclaimer. This is the content of that moment.

### Group: Terms & Conditions

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CW5 | T&C version | text | e.g. v1.0 | Client+IIRM | Yes | A version label for the Terms & Conditions, so acceptance can be tracked if the T&C change later. | Strapi T&C content type — version. |
| CW6 | T&C effective date | date | DD-MMM-YYYY | Client+IIRM | Yes | The date from which these Terms & Conditions apply. | Strapi T&C content type — effective date. |
| CW7 | T&C introduction text | textarea | Shown above the sections | Client+IIRM | Yes | An opening paragraph shown before the detailed Terms & Conditions sections. | Strapi T&C content type — introduction. |
| CW8 | T&C sections | rows(Section title, Content, Display order) | Add one row per section | Client+IIRM | Yes | The Terms & Conditions broken into titled sections, in reading order. Employees accept these when they first log in. | Strapi T&C content type — sections. |

### Group: Company-wide Disclaimer

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CW1 | Company-wide disclaimer text | textarea | Type N/A if none | Client | Yes | A note shown across the portal that applies to everything — not tied to one policy. Type N/A if you do not need one. | Content Management → Company Template → Disclaimer Notes. |
| CW2 | Company-wide disclaimer — acceptance mode | select(Mandatory, Non-mandatory) | — | Client | Yes | Mandatory means employees must accept it before using the portal. Non-mandatory means it is simply displayed. | Acceptance mode field on the same Disclaimer Notes record. |

# Section: 4. Policy Details & Coverage {repeat=Policy} {stage=2}

> Help: One block per policy — the card employees see on their dashboard, and who the policy can cover. Fields marked "IIRM to fill" are completed by IIRM from the insurer's records.

### Group: Policy Card (Dashboard)

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PL1 | Policy type | select(Group Mediclaim, Group Mediclaim Top-up, Group Personal Accident, Group Personal Accident Top-up, Group Term Life, Group Term Life Top-up, Parental, Parental Top-up, Other health policy) | — | Client | Yes | The kind of policy this block is about — health (GMC), accident (GPA) or life cover (GTL). | Verified by IIRM against the placement records. |
| PL2 | Policy name | text | — | IIRM | Yes | The name of the policy — IIRM fills this in from the insurer's records. | iWork → Policy Details — Basic Details. |
| PL3 | Policy number | text | — | IIRM | Yes | The policy number issued by the insurer — IIRM fills this in. | iWork → Policy Details — Basic Details. |
| PL4 | Policy start date | date | DD-MMM-YYYY | IIRM | Yes | The date coverage begins — IIRM fills this in. | iWork → Policy Details — Policy From. |
| PL5 | Policy end date | date | DD-MMM-YYYY | IIRM | Yes | The date coverage ends — IIRM fills this in. | iWork → Policy Details — Policy To. |
| PL7 | Key highlights — 3 to 5 bullet points for the policy card | list | One highlight per line | Client | Yes | Three to five short selling points of this policy, shown to employees on the policy card. Example: "Covers spouse and 2 children up to Rs 5 lakh". | Content Management → Policy Template → Info Points. |

### Group: Relationships & Age Limits

> Help: Select ONLY the relationships this policy allows — leave everything else unticked. Employees will only be able to add the relationships ticked here. For each ticked relationship, give the allowed age range as per the policy document.

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PL32 | Relationships allowed under this policy — with age limits | relmatrix(Self: Self; Spouse/Partner: Husband, Wife, Spouse, Partner, Same-sex Spouse, Same-sex Partner; Children: Son, Daughter, Child; Parents: Father, Mother, Father-in-law, Mother-in-law, Parent; Siblings: Brother, Sister, Sibling) | Tick only what the policy allows | Client | Yes | Tick a relationship to allow it, then enter its minimum and maximum age as per the policy — for example Son: 0 to 25, Father: up to 80. Use Notes for conditions like "studying" or "unmarried". Twins count under Son / Daughter — the twins rule below handles that case. | iWork → Policy Configuration → Relationship Groups (policytypes.ts relations master) + Constraints age rules. |

### Group: Parent & In-law Rules

> Help: Which parent combinations the policy allows. IIRM loads the starting values from the placement files — your answers confirm or correct them.

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PL10 | Allow male employees to cover their own parents? | yesno | — | Client | Yes | Can a male employee add his own father and mother to this policy? | iWork → Policy Configuration → Constraints. |
| PL11 | Allow male employees to cover their parents-in-law? | yesno | — | Client | Yes | Can a male employee add his wife's parents instead? | iWork → Policy Configuration → Constraints. |
| PL12 | Allow female employees to cover their own parents? | yesno | — | Client | Yes | Can a female employee add her own father and mother? | iWork → Policy Configuration → Constraints. |
| PL13 | Allow female employees to cover their parents-in-law? | yesno | — | Client | Yes | Can a female employee add her husband's parents instead? | iWork → Policy Configuration → Constraints. |
| PL14 | Allow coverage for same-gender parent and parent-in-law? | yesno | — | Client | Yes | Can an employee cover both their own parent and the matching in-law — for example their father AND their father-in-law? | iWork → Policy Configuration → Constraints. |
| PL15 | Allow cross-selection of parents? | yesno | — | Client | Yes | Can an employee pick one parent from their own side and one from their spouse's side — for example their mother and their father-in-law? | iWork → Policy Configuration → Constraints. |
| PL17 | Minimum age gap between employee and their parent (years) | number | e.g. 18 | Client | Yes | How much older a parent must be than the employee for the system to accept them as a parent. 18 years is the standard default. | iWork → Policy Configuration → Constraints. |
| PL43 | Parental lock-in period (years) | number | e.g. 0, 1, 2 | Client | Yes | Once an employee adds parents to the policy, how many years must they stay covered before they can be removed? Enter 0 for no lock-in. | Production Policy Configure screen — not in current constraints master; verify field mapping w/ Tech Lead. |

### Group: Children Rules

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PL16 | Allow a second child born as twins to be covered? | yesno | — | Client | Yes | If an employee's second childbirth turns out to be twins, can both babies be covered even though that makes three children in total? | iWork → Policy Configuration → Constraints. |
| PL34 | Allow the first child born as twins to be covered? | yesno | — | Client | Yes | If an employee's very first childbirth is twins, can both babies be covered? | iWork → Policy Configuration → Constraints — allowFirstChildAsTwin (default No). |
| PL35 | Allow a second child born as triplets to be covered? | yesno | — | Client | Yes | If the second childbirth turns out to be triplets, can all three children be covered? | iWork → Policy Configuration → Constraints — tripletsSecondChildAllowed (default No). |
| PL18 | Studying son — age limit extension (years) | number | e.g. 5 | Client | Yes | Extra years of coverage for a son who is still studying, added on top of the normal child age limit. Enter 0 for none. | iWork → Policy Configuration → Constraints — studyingSonAgeExtension (default 0). |
| PL19 | Unmarried daughter — age limit extension (years) | number | e.g. 5 | Client | Yes | Extra years of coverage for an unmarried daughter, added on top of the normal child age limit. Enter 0 for none. | iWork → Policy Configuration → Constraints — unmarriedDaughterAgeExtension (default 0). |
| PL20 | Minimum age gap between employee and their child (years) | number | e.g. 18 | Client | Yes | How much older an employee must be than their child. 18 years is the standard default. | iWork → Policy Configuration → Constraints. |

### Group: Policy Disclaimer

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PL26 | Policy-level disclaimer text | textarea | Type N/A if none | Client | Yes | A note employees must read before submitting enrollment for this policy — for example about tax or coverage conditions. Type N/A if you do not need one. | Content Management → Policy Template → Disclaimer Notes. (The iWork constraint field 'custom disclaimer before submission' is deprecated — disclaimer content lives in Strapi.) |
| PL27 | Disclaimer acceptance mode | select(Mandatory, Optional) | — | Client | Yes | Mandatory means employees must tick "I agree" before proceeding. Optional means the note is shown for information only. | Acceptance mode field on the same Disclaimer Notes record. |

# Section: 5. Enrollment — Drive & Rules {repeat=Policy Enrollment} {stage=2}

> Help: From the dashboard, employees enter enrollment — while its window is open. One block here per policy: the drive dates, the family-member rules, and the disclaimer employees see before submitting.

### Group: Which Policy

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EN1 | Which policy is this enrollment setup for? | text | Same name/type as its Policy Details block, e.g. GMC | Client | Yes | Repeat this block once per policy, and write the same policy name or type you used in its Policy Details block so the two match up. | Links this block to the policy record in iWork. |

### Group: Policy Category & Components

> Help: A policy is offered to employees in one of three ways. Compulsory — every eligible employee is covered automatically. Optional — employees choose whether to opt in. Flex — employees pick from a menu of benefit choices. One policy can contain several components that behave differently.

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EN2 | Policy category | select(Compulsory, Optional, Flex, Mixed — detailed in components below) | — | Client | Yes | How this policy is offered to employees: automatically for everyone (Compulsory), by choice (Optional), or as part of a flexible-benefits menu (Flex). If different parts of this policy behave differently, choose Mixed and list each part in the components table below. | iWork → Policy Configuration → components/parameters in policyConfiguration; drives enrollment behavior per component. |
| EN3 | Components in this policy | rows(Component name, Category — Compulsory / Optional / Flex, Who is covered, Notes) | Add one row per component | Client | Yes | A policy can have more than one component — for example a base cover for all employees (Compulsory) and a parents top-up (Optional). List each component, its category, and who it covers. Employees see only the components they belong to, based on the inception / endorsement data submitted for them. | iWork → Policy Configuration → Components; per-component SI options, premium basis and contribution split hang off each component. |

### Group: Enrollment Drive (Window)

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PL8 | Enrollment window — Start date | date | DD-MMM-YYYY | Client | Yes | The first day employees can start enrolling in this policy. | iWork → Policy Details → Inception/Endorsements → Enrollment dates. |
| PL9 | Enrollment window — End date (hard cut-off) | date | DD-MMM-YYYY | Client | Yes | The last day for enrollment. After this date, employees who have not finished are enrolled automatically with the policy default choices. | iWork → Policy Details → Inception/Endorsements → Enrollment dates; auto-submit job runs at cut-off. |

### Group: Confirmation & Locking

> Help: How submission, confirmation and locking behave during the enrollment drive.

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PL22 | Is enrollment confirmation required before final submission? | yesno | — | Client | Yes | Should employees see a final review screen and press "Confirm" before their enrollment is submitted? | iWork → Policy Configuration → Enrollment tab. |
| PL23 | Lock employee choices immediately after they confirm? | yesno | — | Client | Yes | Once an employee confirms, should their choices be locked so they cannot make further changes? | iWork → Policy Configuration → Enrollment tab — auto-lock on confirm. |
| PL24 | Automatically lock enrollment for everyone after the cut-off date? | yesno | — | Client | Yes | After the enrollment end date, should everyone's enrollment be locked automatically? | iWork → Policy Configuration → Enrollment tab — auto-lock at cut-off. |
| PL44 | Allow employees to modify and resubmit before enrollment is locked? | yesno | — | Client | Yes | Before enrollment is locked, can employees change and resubmit their choices? | iWork → Policy Configuration → Constraints / Enrollment — allowResubmissionBeforeLock (default Yes). |
| PL37 | Make enrollment confirmation status visible to HR/Admins? | yesno | — | Client | Yes | Should HR and admins be able to see which employees have confirmed their enrollment? | iWork → Policy Configuration → Constraints — confirmationStatusVisibleToHR (default Yes). |

### Group: Contribution Display

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PL25 | Show the company's contribution to employees? | yesno | — | Client | Yes | Should employees see how much of the premium your company is paying on their behalf? | Content Management → Policy Template → Show Company Contribution toggle. |
| PL45 | Show the employee's own contribution to employees? | yesno | — | Client | Yes | Should employees see their own share of the premium? | iWork → Policy Configuration → Constraints — showEmployeeContribution (default Yes). |

### Group: Life-Event Documents & TPA

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PL38 | Require document upload for additions after life events? | yesno | — | Client | Yes | When employees add a family member after a life event — like a child's birth or marriage — must they upload proof documents? | iWork → Policy Configuration → Constraints — documentUploadForAdditionsRequired (default Yes). |
| PL39 | Require document upload for removals after life events? | yesno | — | Client | Yes | When employees remove a family member after a life event, must they upload proof documents? | iWork → Policy Configuration → Constraints — documentUploadForDeletionsRequired (default Yes). |
| PL40 | Is TPA upload mandatory? | yesno | — | Client+IIRM | Yes | Must the enrollment data be uploaded to the TPA (claims administrator) as part of this policy's process? IIRM will normally decide this with you. | Production Policy Configure screen — not in current constraints master; verify field mapping w/ Tech Lead. |

### Group: Premium & Tax

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PL21 | Number of payroll instalments for premium deduction | number | e.g. 1, 4, 12 | Client | Yes | If employees pay part of the premium, over how many salary cycles should it be deducted? Enter 1 for a single deduction. | iWork → Policy Configuration → Constraints / Enrollment. |
| PL36 | Is SEZ-based tax discount applicable? | yesno | — | Client | Yes | Is your company in a Special Economic Zone (SEZ) with a tax discount that applies to this premium? | iWork → Policy Configuration → Constraints — sezApplicable (default No). |
| PL41 | Is GST applicable? | yesno | — | Client+IIRM | Yes | Does GST apply to this policy's premium? | Production Policy Configure screen — verify field mapping w/ Tech Lead. |
| PL42 | Show GST to employees? | yesno | — | Client | Yes | Should employees see the GST amount as part of their premium breakup? | Production Policy Configure screen — verify field mapping w/ Tech Lead. |

# Section: 6. Documents & Hospital Network {repeat=Policy Documents} {stage=2}

> Help: What employees find under My Documents, Policy Features, and Hospital Network. One block here per policy.

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| DC1 | Which policy are these documents for? | text | Same name/type as its Policy Details block, e.g. GMC | Client | Yes | Repeat this block once per policy, and write the same policy name or type you used in its Policy Details block so the two match up. | Links this block to the policy record in iWork. |
| PL28 | Full policy document | file(PDF) | Write filename here | Client | Yes | The complete policy wording PDF from the insurer. Employees can download it from My Documents on the portal. | Set at company level; appears in My Documents. |
| PL29 | Short policy feature document | file(PDF; 1–2 pages) | Write filename here | Client | Yes | A short, easy-to-read summary of the policy benefits. Shown to employees under Policy Features. | iWork → Policy Details → Portal Configuration → Policy Features. |
| PL30 | Additional templates / documents | file(PDF, Excel) | e.g. Claim Form Part A & B, claim intimation form, NME list | Client | No | Any other useful files for employees — claim forms, the claim intimation form, the list of non-payable expenses (NME list). | Set at company level — Additional Documents section. |
| PL31 | Network hospital list | file(Excel — IIRM template) | Write filename here, or N/A; template=IIRM-Hospital-Network-Template.xlsx | Client | No | The list of hospitals where employees can get cashless treatment under this policy, in the IIRM Excel template. Write N/A if not applicable. | iWork → Policy Details → Portal Configuration → Hospital Network. |

# Section: 7. Portal Services — Wellness & Policy Porting {stage=3}

> Help: Optional services shown on the portal. Switch them on or off for your company.

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| W1 | Show Wellness to employees? | yesno | — | Client | Yes | The portal can include a Wellness section that takes employees to the wellness partner's platform — health programs, check-ups, fitness content. Choose Yes to show it. | Alyve wellness SSO hand-off (external app registry, label alyve-wellness); pre-requisite A9. |
| W2 | Show Policy Porting to employees? | yesno | — | Client | Yes | Policy Porting lets employees explore converting their group cover into a personal policy — useful when someone leaves the company or wants extra cover. Choose Yes to show the link. | Header nav + dashboard banner link to the policy porting site (iirmwellness.co.in). |

# Section: 8. Support — FAQs & Contact Matrix {stage=1}

> Help: Employees see Support both on the login screen and inside the portal. We collect this content up front so it is ready before the portal is set up. The Primary contact is the first point of contact; the Secondary contact is the escalation step.

### Group: FAQs

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CW3 | Completed IIRM FAQ template | file(Excel) | Write filename here, or fill FAQs below; template=IIRM-FAQ-Template.xlsx | Client | No | If you have filled in the IIRM FAQ template, write its filename here. Otherwise, add your FAQs one by one in the next field. | Content Management → Company Template → FAQs. |
| CW4 | FAQs | rows(Question, Answer, Category, Display order) | Add one row per FAQ | Client | No | Questions your employees are likely to ask, with answers. Category groups them (e.g. Enrollment, Claims); display order sets the sequence they appear in. | Content Management → Company Template → FAQs. |

### Group: Contact Matrix

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CM1 | Support hours | text | e.g. Mon–Fri, 9:30–18:30 IST | Client | Yes | The days and times your support contacts are available. Employees see this at the top of the Contacts page. | Content Management → Company Template → Contact Matrix → support timings. |
| CM2 | HR Primary | contact | Name, Phone, Email | Client | Yes | The main HR person employees should contact for benefits questions. | Content Management → Company Template → Contact Matrix. |
| CM3 | HR Secondary | contact | Name, Phone, Email | Client | No | A backup HR contact if the primary person is unavailable. | Content Management → Company Template → Contact Matrix. |
| CM4 | Data Protection Officer (DPO) Primary | contact | Name, Phone, Email | Client | No | The person responsible for employee data privacy in your company, if you have one. | Content Management → Company Template → Contact Matrix. |
| CM5 | DPO Secondary | contact | Name, Phone, Email | Client | No | A backup contact for data privacy matters. | Content Management → Company Template → Contact Matrix. |
| CM6 | Grievance Officer Primary | contact | Name, Phone, Email | Client | Yes | The person employees can escalate complaints to when normal support has not resolved them. | Content Management → Company Template → Contact Matrix. |
| CM7 | Grievance Secondary | contact | Name, Phone, Email | Client | No | A backup contact for escalated complaints. | Content Management → Company Template → Contact Matrix. |
| CM8 | TPA Primary | contact | Name, Phone, Email | IIRM | Yes | The claims administrator (TPA) contact — IIRM fills this in from the TPA agreement. | Content Management → Company Template → Contact Matrix. |
| CM9 | TPA Secondary | contact | Name, Phone, Email | IIRM | No | Backup TPA contact — IIRM fills this in. | Content Management → Company Template → Contact Matrix. |
| CM10 | Broker (IIRM) Primary | contact | Name, Phone, Email | IIRM | Yes | Your IIRM broker contact — IIRM fills this in. | Content Management → Company Template → Contact Matrix. |
| CM11 | Broker (IIRM) Secondary | contact | Name, Phone, Email | IIRM | No | Backup broker contact — IIRM fills this in. | Content Management → Company Template → Contact Matrix. |

# Part: C — Communications & Content

# Section: 9. Communications — Email, SMS & WhatsApp {stage=1}

> Help: Every message the portal sends your employees, in one place. For each event, choose the wording — the ready-made IIRM template or your own — and tick the channels it should go out on. Email is always available; SMS and WhatsApp delivery depend on your arrangement with IIRM.

### Group: Message Branding

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N1 | Show your company logo at the top of emails? | yesno | — | Client | Yes | Portal emails carry the IIRM logo. Choose Yes if your company logo should also appear at the top of each email, the way it does on the portal itself. | Per-company email template overrides (mstr_email_template); template builder branding. |

### Group: Welcome Email

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N2 | Welcome message — wording | select(Standard IIRM template, Custom template) | — | Client | Yes | Sent when an employee's account is created, with their first-time login details. Use the standard IIRM wording, or your own. | Notification events — onboarding/welcome. |
| N3 | Welcome message — channels | multiselect(Email, SMS, WhatsApp) | Tick all that apply | Client | Yes | Where this message should reach the employee. Note: delivery follows the login method — email methods send email, phone methods send SMS; Employee ID + Year of Birth sends no welcome message. | Notification channels; send-email-alongside-SMS flag; WhatsApp via template builder. |

### Group: Enrollment Reminder

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N4 | Enrollment reminders — needed? | yesno | — | Client | Yes | Should employees who have not finished enrolling receive reminders before the cut-off date? (Not available when the only login method is Employee ID + Year of Birth.) | Enrollment reminder email days — Authorization Configuration. |
| N5 | Reminder schedule — days before cut-off | multiselect(1 day, 2 days, 3 days, 5 days, 7 days) | Tick all that apply | Client | No | If reminders are on: on which days before the enrollment cut-off should they go out? | Enrollment Reminder Days per auth method — Configure IBP Portal → Login & Authentication. |
| N6 | Reminder message — wording | select(Standard IIRM template, Custom template) | — | Client | No | The reminder text employees receive. | Notification events — enrollment reminders. |
| N7 | Reminder message — channels | multiselect(Email, SMS, WhatsApp) | Tick all that apply | Client | No | Where the reminders should reach the employee. | Notification channels. |

### Group: Enrollment Confirmation

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N8 | Confirmation message — wording | select(Standard IIRM template, Custom template) | — | Client | Yes | Sent when an employee completes and submits their enrollment, summarising their choices. | Notification events — enrollment confirmation. |
| N9 | Confirmation message — channels | multiselect(Email, SMS, WhatsApp) | Tick all that apply | Client | Yes | Where the confirmation should reach the employee. | Notification channels. |

### Group: Support Request / Ticket

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N10 | Support ticket message — wording | select(Standard IIRM template, Custom template) | — | Client | Yes | Sent when an employee raises a support ticket, confirming receipt with the ticket number. | Notification events — support ticket confirmation. |
| N11 | Support ticket message — channels | multiselect(Email, SMS, WhatsApp) | Tick all that apply | Client | Yes | Where the ticket confirmation should reach the employee. | Notification channels. |

### Group: Claims Submission

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N12 | Claim submission message — wording | select(Standard IIRM template, Custom template) | — | Client | Yes | Sent when a claim is submitted on the portal, with its reference number. | Notification events — claim submission confirmation. |
| N13 | Claim submission message — channels | multiselect(Email, SMS, WhatsApp) | Tick all that apply | Client | Yes | Where the claim confirmation should reach the employee. | Notification channels. |

### Group: Life Events

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N14 | Life event message — wording | select(Standard IIRM template, Custom template) | — | Client | Yes | Sent when an employee submits a life-event change — marriage, child birth, adoption — confirming the update request. | Notification events — life event confirmation. |
| N15 | Life event message — channels | multiselect(Email, SMS, WhatsApp) | Tick all that apply | Client | Yes | Where the life-event confirmation should reach the employee. | Notification channels. |

### Group: Sign-in Messages

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N16 | Password reset email — wording | select(Standard IIRM template, Custom template) | — | Client | Yes | Sent when someone asks to reset their password. | Notification events — auth/password. |
| N17 | OTP message — wording | select(Standard IIRM template, Custom template) | — | Client | Yes | The short message carrying the one-time code at sign-in or verification. Its channel follows your MFA delivery choice in the Login Screen section. | Notification events — OTP; SMSCountry for SMS delivery. |

### Group: Custom Wording

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| N18 | Custom message wording | textarea | Only if any wording above is Custom | Client | No | Paste the wording for each message you marked as Custom, or write the filename of the document that contains it. | Generic notification template builder (iWork) with approval workflow. |

# Section: 10. Portal Footer & Benefits Year {stage=3}

> Help: The footer appears at the bottom of every portal page; the benefits year frames the enrollment period the portal displays.

### Group: Portal Footer

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CW9 | Footer — company name | text | — | Client | Yes | The company name to show at the bottom of every portal page. | Content Management → Company Template → Footer. |
| CW10 | Footer — license text | text | e.g. IRDAI license line | IIRM | Yes | The insurance license line shown in the footer — IIRM fills this in. | Content Management → Company Template → Footer. |
| CW11 | Footer — copyright text | text | e.g. © 2026 Acme. All rights reserved. | Client | Yes | The copyright line for the footer. | Content Management → Company Template → Footer. |

### Group: Enrollment Year

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CW12 | Enrollment year range — Start date | date | DD-MMM-YYYY | IIRM | Yes | The start of the overall benefits year the portal displays — IIRM fills this in. | Content Management → Company Template → Enrollment Year Range. |
| CW13 | Enrollment year range — End date | date | DD-MMM-YYYY | IIRM | Yes | The end of the benefits year — IIRM fills this in. | Content Management → Company Template → Enrollment Year Range. |

# Part: D — Access & Go-Live

# Section: 11. HR Admin Users {repeat=HR Admin User} {stage=3}

> Help: Portal accounts for your HR team on Risk Watch (the HR side of the portal). Add one entry per HR admin.

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| HR1 | Employee ID | text | Must match the employee data file | Client | Yes | This person's employee ID in your company records. It must match the ID in the employee data file you share with IIRM. | Used to create the HR Admin portal account. |
| HR2 | First name | text | — | Client | Yes | Their first name, as it should appear on the portal account. | — |
| HR3 | Last name | text | — | Client | Yes | Their last name. | — |
| HR4 | Work email | email | — | Client | Yes | Their official work email. The account welcome email is sent here. | Welcome email sent after account creation. |
| HR5 | Designation / Role | text | e.g. HR Manager | Client | Yes | Their job title. | — |

# Section: 12. Go-Live Readiness {stage=1}

> Help: The switch-on checks. Employees can only log in after the inception/endorsement files are processed (that is what creates their accounts) and can only enroll while a drive is open. Confirm these are in place.

| ID | Question | Type | Options / Format | Owner | Required | Help text (user) | Where configured (IIRM internal) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GL1 | Inception / endorsement files submitted and processed for all policies? | yesno | — | Client+IIRM | Yes | The inception (and any endorsement) files are the employee data sent to the insurer at the start of each policy. IIRM processes them to create employee records — without this, nobody can log in. | Service Flow — Inception / Endorsement processing. |
| GL2 | Employee roster / data file | file(Excel — IIRM template) | Write filename here | Client | Yes | The employee data file in the IIRM upload template. This is what creates portal accounts for your employees. If your login methods use Email or Phone, those columns are mandatory for every employee — anyone missing them cannot log in. | Bulk roster upload via ibp-service; processing scheduler. |
| GL3 | Approximate number of employees in the roster | number | e.g. 1200 | Client | No | A quick sanity check — roughly how many employees are in the file you are sharing. IIRM validates the upload against this. | Compared with processed-record count after upload. |
| GL4 | Enrollment drive dates set and agreed for every policy? | yesno | — | Client+IIRM | Yes | Each policy's enrollment window (Section 8) must be agreed and configured before employees can enroll. Confirm this is done. | iWork → Inception/Endorsements → Enrollment dates per policy. |

# Section: 13. Review & Export

> Help: Fixed section — the generator renders a read-only summary of all answers here, with Download JSON and Download Excel/CSV buttons. Database submission will be added when the storage specs are written. No questions in this section.

# Out of Scope — Parked Requirements

<!-- The generator STOPS PARSING at the "# Out of Scope" heading — nothing below this
line appears in the HTML form. This is the parking lot for requirements collected in
the earlier drafts (Setup Checklist v7/v8/v9, Client Questionnaire v1/v2) that are not
active intake questions yet. To activate one: move it into a section above as a proper
question row (ID, type, owner, help text) and regenerate.
IIRM-internal execution work (DNS/SSL, QA, cutover) is NOT here — it lives in
2-IBP-Implementation-Plan.md (extracted from v9 Part B). -->

| Theme | Requirement | Source | Notes |
| --- | --- | --- | --- |
| Company | Project / engagement name | v9 A-02 | — |
| Company | Display name shown on the portal (friendlier than legal name) | form v3 C2, removed 15-Jul-2026 | Company master — display name |
| Company | Country (India / Kenya / Sri Lanka) — drives portal localization & logo | form v3 C3, removed 15-Jul-2026 | IIRM sets country internally during company creation |
| Company | Portal type — company-specific vs universal tenant | v9 A-09, v8 §0 | Decides whether branding shows pre-login or only post-login |
| Company | Multi-country serving (India / Sri Lanka / Both) | v9 A-07, v8 §14, Questionnaire Q4 | Form asks one country; multi-country adds localization + per-country FAQs |
| Footer | Client Privacy Policy URL and Terms of Use URL | v9 B-07/B-08, Questionnaire Q8/Q9 | Client-specific links instead of IIRM defaults |
| Login | Employee ID + Date of Birth login method | v9 C-02, Questionnaire Q11 | Form offers password/OTP methods only |
| Login | SSO (SAML/OAuth) with IdP metadata, ACS/SLO, attribute mapping | v9 C-02/C-03, v8 §3 | Explicitly future phase per v9 |
| Login | Single active session per user | v9 C-08, Questionnaire Q17 | Default today: single session |
| Login | Maximum password length | form L5, removed 16-Jul-2026 | No counterpart in Configure IBP Portal config — only minimum length exists |
| Login | Account lockout policy (allowed attempts + lockout duration) | code AccountLockoutSection | In code but not in the shared config screenshots — confirm before asking clients |
| Login | OTP length + maximum OTP attempts | code OTPConfigSection fields | In code but not in the shared config screenshots |
| HR ops | Employee deactivation feed (file / API / manual) on exit | v9 C-09, v8 §3 | Related: HRMS/payroll sync connector (v8 §15) |
| Policy | Insurer / underwriter name shown to client | v9 E1-02 | Form keeps insurer mapping IIRM-internal |
| Policy | Sum Insured slabs + model (single / multiple) | v9 E1-04, v8 §12 | In config inventory B4; not asked in form |
| Policy | Coverage summary — 1–3 sentences for policy card | v9 E1-05 | Form asks key highlights only |
| Policy | Mandatory documents per dependent type (marriage/birth certificates) | v9 E1-11, v8 §12 | — |
| Policy | Premium display options (per-member / family / payroll breakup) | v9 E1-13, v8 §9 | — |
| Policy | Pro-ration for mid-year additions (Yes/No) | v9 E1-14, v8 §9 | Backend default: enabled |
| Documents | Per-policy extras: benefit summary, brochure, T&C doc, policy-details doc, excluded-hospital list | v9 F1-02..08, v8 §10/§11 | Form asks full doc, feature doc, claim forms, network list |
| Documents | Company-wide extras: HR handbook, wellness guides | v9 F-02, Questionnaire Q55 | — |
| Documents | Consolidated all-policies features PDF | v9 F-01, Questionnaire Q54 | — |
| Dashboard | Wellness split into Emotional / Physical modules + sub-options | v9 G-02/G-03, v8 §4 | Form has a single Wellness toggle (W1) |
| Dashboard | Retail Insurance module + product list (motor, travel, top-up) | v9 G-04, v8 §4 | — |
| Dashboard | Cookie consent banner — custom copy + categories | v9 G-07, v8 R.1, Questionnaire Q58 | — |
| Per-policy toggles | Feature visibility: policy summary, benefits page, e-card (+ card types), hospital network, OPD hospitals, claim submission, claim tracking, add/remove dependent, downloads, renewal countdown | v9 G1-01..11, v8 §9 | — |
| Claims | HR raise-claims-on-behalf permission | v9 G1-14, v8 §13 | Exists in portal, flag-gated FF_CLAIM_INTIMATION_MANAGEMENT |
| Claims | TAT display, SLA display, required-documents list, claim instructions | v9 G1-17..20, v8 §13 | — |
| FAQs | Policy-level FAQs + upload mode (add / replace) | v9 H-02/H-04, v8 §5 | Form asks company-level FAQs only |
| Notifications | Remaining per-event alerts: e-card ready, claim status updates, HR-side alerts (claim submitted, enrollment window closing) | Questionnaire §7, v8 §15 | Core events now in the Communications section (wording + Email/SMS/WhatsApp channels per event) |
| Notifications | Client SMTP relay option; analytics property ID (GA/Mixpanel) | v8 §15 | — |
| Compliance | DPDP acknowledgement (fiduciary/processor), data-retention period, DSR contact, anonymised-usage-data permission | v9 I-01..04, v8 R.1 | — |
| Process | Client sign-off block (prepared / reviewed / authorised signatory + dates) | Questionnaire, v9 §I | Could become a form section before Review & Export |
