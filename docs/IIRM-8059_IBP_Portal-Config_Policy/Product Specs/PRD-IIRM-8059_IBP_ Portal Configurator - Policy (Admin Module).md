## **Module: IBP: Portal Configurator \- Policy (Admin Module)**

## **Version: 1.0**

---

# **1\. Overview**

The *Portal Configurator – Policy* module allows IIRM admins to configure **policy-specific settings** for each corporate client in the IBP (Insurance Business Portal).

 While the Company Configurator controls portal setup at the company level, **this module configures how each insurance policy appears and behaves** in the employee portal.

This ensures that different policies (GMC, GTL, GPA, CI, OPD, Travel, etc.) can have individualized features, rules, and content tailored to the corporate client.

---

# **2\. Problem Statement**

Today, policy-level configurations are scattered across systems or maintained manually.  
 There is **no unified place** to control what an employee should see or do for a specific policy.  
 This leads to:

* Inconsistent experience across corporates

* Manual effort for updates

* Dependency on tech teams

* Risk of showing incorrect or irrelevant features to employees

A centralized **Policy Configurator** is needed to define policy-level visibility, rules, features, and content.

---

# **3\. Objective**

To create a **central admin module** where IIRM teams can configure all policy-specific settings—features, visibility, documents, rules, FAQs, benefits—so the employee portal dynamically shows correct information per policy and customer.

---

# **4\. In-Scope**

* Policy-level configurations inside IBP Admin

* Feature enablement/disablement for each policy

* Policy content setup (summary, benefits, documents, FAQs)

* Enrollment rules and dependent rules

* Claim module configuration

* E-card & hospital network visibility

* Renewal/endorsement-related settings

* Portal behavior for that policy

* Versioning and audit history

    
  ---

  # **6\. User Personas and User Flow**

  ### **Persona 1: IIRM Policy Admin**

**Context:** Sets up policies for each corporate.  
 **Goals:** Ensure each policy shows the correct benefits, rules, and features.  
 **User Flow:**

1. Login to IBP Admin

2. Open “Policy Configurator” under a Company

3. Select a Policy (GMC/GPA/GTL etc.)

4. Configure visibility, features, rules, documents, FAQs

5. Save & publish configuration

   ---

### **Persona 2: Customer Servicing Team**

**Context:** Needs to quickly update policy documents or FAQs.  
 **User Flow:**

1. Search corporate → Select policy

2. Update FAQs/documents

3. Save → Sync to employee portal

   ---

   # **7\. User Interface (High-level)**

If detailed design is unavailable, the UI will contain:

* **Left Panel:** List of policy configuration sections

* **Main Area:** Editable configuration details

* **Tabs example:**

  * Policy Summary

  * Benefits

  * Claims Module Configuration

  * Enrollment & Dependent Rules

  * E-card Visibility

  * Hospital Network

  * Document Library

  * FAQs

  * Pricing/Premiums Visibility

  * Renewal Rules

  * Feature Toggles

  * Audit Logs

Each section is independent and can be updated separately.

---

# **8\. Functional Requirements (FR)**

### **FR-1: Policy Summary Configuration**

Admin should be able to upload and edit:

* Policy name

* Insurer

* Coverage summary

* Start & end dates

* Policy features

* Exclusions & inclusions

  ---

  ### **FR-2: Benefits & Coverage Configuration**

Admin can define and manage:

* Coverage limits

* Sum insured slabs

* Disease/benefit level limits

* Sub-limits

* Co-pay & deductible rules

  ---

  ### **FR-3: Feature Enable/Disable (Feature Toggles)**

Admin should choose which features appear in the employee portal:

* Policy summary

* Benefits

* E-card

* Hospital network

* Claim submission

* Claim tracking

* Add dependent

* Downloads

* Premium visibility

* Renewal visibility

  ---

  ### **FR-4: Enrollment & Dependent Rules**

Admin sets:

* Enrollment window (start–end dates)

* Add/remove dependent permissions

* Dependent age rules

* Mandatory document rules

* Self/Parents/Spouse visibility rules

  ---

  ### **FR-5: Claim Module Configuration**

Admin configures for each policy:

* Upload claim Y/N

* Track claim Y/N

* Claim form template

* Required documents

* TAT and SLA display

* Claim instructions

  ---

  ### **FR-6: E-Card Configuration**

Admin decides:

* E-card visibility Y/N

* Single/multiple e-card types

* Custom disclaimers (optional)

  ---

  ### **FR-7: Hospital Network Configuration**

Admin can:

* Allow insurer network fetch

* Upload custom network

* Hide/show OPD hospitals

* Search filters

  ---

  ### **FR-8: Document Library Configuration**

Admin uploads policy documents:

* Policy Wordings

* Benefit Summary

* Claim Forms

* Brochures

* T\&Cs

  ---

  ### **FR-9: FAQ Management (Policy Level)**

Admins can upload FAQs via Excel or manually.  
 Features include:

* Add, edit, delete FAQs

* Country-wise FAQs

* Category-based display

* Portal sync

  ---

  ### **FR-10: Renewal & Endorsement Settings**

Admin configures:

* Renewal countdown display

* Endorsement rules

* Enrollment re-open rules

  ---

  ### **FR-11: Pricing & Premium Visibility**

Admin chooses:

* Per-member premium visibility

* Family premium visibility

* Payroll deduction visibility

  ---

  ### **FR-12: Audit & Version History**

Record every policy configuration update:

* Before/After values

* Who changed

* When

* Ability to export

  ---

  # **9\. Business Rules**

1. A configuration change becomes active only after **Save & Publish**.

2. Each policy must be tied to one active insurer.

3. Feature toggles override default rules (e.g., disabling claim module hides all claim pages).

4. Dependent rules must follow insurer's master policy rules.

5. If multiple FAQ uploads occur, the latest replaces previous unless “Add to Existing” is selected.

   ---

   # **10\. Validations**

* Mandatory fields must be filled before saving.

* Policy end date cannot be earlier than start date.

* Duplicate FAQ questions must be flagged.

* Enrollment window dates must be valid and not overlap with previous windows.

* Max file size validation for uploaded documents.

* Premium visibility cannot be enabled if premium is not mapped.

* A feature cannot be enabled without mandatory configuration (e.g., Claim Upload requires required documents list).

  ## **Edge Cases & Solutions** 

  ### **1\. Missing Mandatory Fields**

* **Edge Case:** Admin forgets to fill mandatory fields (e.g., policy name, insurer, product type).

* **Solution:** Inline validation \+ disable “Save/Publish” until mandatory fields are complete.

  ### **2\. Duplicate Policy Codes**

* **Edge Case:** Admin enters a policy code that already exists.

* **Solution:** System should auto-check for duplicates and show a “Policy Code Already Exists” error.

  ### **3\. Invalid Date Ranges**

* **Edge Case:** Policy start date is after end date or overlaps with previously active versions.

* **Solution:** Date range validation \+ warning for overlapping or conflicting versions.

  ### **4\. Conflicting Configurations**

* **Edge Case:** Entered fields contradict existing broker/insurer rules (e.g., sum insured bands, premium table formats).

* **Solution:** Highlight conflicting fields and show rule-based error messages with corrective guidance.

  ### **5\. Incorrect or Corrupt File Uploads**

* **Edge Case:** Admin uploads wrong format (e.g., .jpg instead of .xlsx) or a corrupted file.

* **Solution:** Validate file type, size, and integrity; reject with descriptive error message.

  ### **6\. Policy Deactivation While Active in Business Flow**

* **Edge Case:** Admin tries to deactivate a policy used in quotes/renewals.

* **Solution:** Show a warning with dependency list \+ require forced confirmation or block deactivation.

  ### **7\. Concurrent Editing (Two Admins Editing Same Policy)**

* **Edge Case:** Two admins open the same configuration and overwrite changes.

* **Solution:** Apply edit-locking or version control with “Another admin is editing this policy” alert.

  ### **8\. API Integration Issues**

* **Edge Case:** Publishing policy configuration fails due to insurer API downtime.

* **Solution:** Rollback to last saved state \+ notify admin \+ queue retry.

  ### **9\. Partial Save or Interrupted Save**

* **Edge Case:** Admin loses internet mid-save.

* **Solution:** Auto-save draft locally \+ allow recovery on next login.

  ### **10\. Unauthorized Access**

* **Edge Case:** User without proper permissions tries to edit a policy.

* **Solution:** Role-based access control \+ “You do not have permission” message.

  ### **11\. Unsupported Field Combinations**

* **Edge Case:** Admin selects a combination not supported (e.g., Policy Type "Group" with Individual-only fields).

* **Solution:** Dynamic field enable/disable rules based on selections.

  ### **12\. Policy Name Changes Affecting Downstream Systems**

* **Edge Case:** Admin renames a policy already mapped in multiple modules.

* **Solution:** Maintain unique IDs; allow renaming only at UI level, not internal mapping.

  ### **13\. Multi-Step Config Incomplete**

* **Edge Case:** Admin configures Step 1 but forgets Step 3\.

* **Solution:** Step-based completeness indicator \+ prevent publish until all steps marked complete.

  ### **14\. Incorrect Premium Table Entries**

* **Edge Case:** Invalid numeric entries, negative values, or mismatched ranges in rate tables.

* **Solution:** Numeric validation, range checks, and real-time preview before save.

  ### **15\. Conflicts with Company-Level Configuration**

* **Edge Case:** Policy defaults contradict company-level or insurer-level rules.

* **Solution:** Override confirmation popup or restrict changes based on hierarchy.


