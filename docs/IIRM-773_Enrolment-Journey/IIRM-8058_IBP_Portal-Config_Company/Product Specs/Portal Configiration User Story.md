# **Portal Preference Module – User Stories **

**Module Name:** Portal Preference  
 **System:** IIRM CRM  
 **Portal:** IBP (Insurance Benefits Platform)

---

## **1\. Module Overview**

### **Objective**

The Portal Preference Module enables administrators to configure **company-level, dashboard-level, and policy-level settings** for the IBP portal. These configurations control how the IBP portal behaves, appears, and enforces enrolment rules for employees of a specific company.  
 All configurations follow an **approval workflow** before being published.

### **Portal URL Types**

The system supports two types of portal access:

1. **Company-Specific Portal URL** - Customized portal with full configuration capabilities
2. **Universal Portal URL** - Generic portal with limited configuration options and default behaviors

Configuration options and behaviors vary based on the portal URL type being used.

---

## **2\. Module Structure**

The module consists of **three configurable sections**, each displayed under a separate tab:

1. **Company Configuration for IBP Portal**  
2. **Dashboard Configuration for IBP Portal**  
3. **Policy Configuration for IBP Portal**

Each section supports:

* View mode (default)  
* Edit mode (via Edit CTA)  
* Save & Submit For Approval  
* Approval lifecycle with status tracking  
* Manager Approval Flow  
* Comment view button

---

**3\. User Roles**

*  **BD Executive**  
  The  **BD Executive** is responsible for configuring portal preferences. They can submit configurations for approval and resubmit them in case of rejection after making the required changes.

* **Manager**  
   The Manager reviews the configurations submitted by the Admin. They have the authority to approve or reject the submissions and provide comments or feedback during the review process.

---

## **4\. User Stories & Acceptance Criteria**

---

## **4.1 Company Configuration for IBP Portal**

### **4.1.1 View Company Configuration**

**User Story**  
 As a **BD Executive**, I want to view  all company-level portal configurations in a read-only format, so that I can understand the current IBP portal setup.

**Acceptance Criteria**

* System displays all configured values in view-only mode on initial load.  
* Sections are visually separated:  
  * Portal URL & Domain  
  * Login & Authentication  
  * Branding & Appearance

---

### **4.1.2 Portal URL and Domain Configuration**

#### **Company-Specific Portal URL (View Only)**

**User Story**  
 As a BD Executive, I want to view the company-specific portal URL and domain, so that I know how employees access the customized IBP portal.

**Acceptance Criteria**

* Company-specific portal URL is auto-generated in backend using company display name as slug.
* URL field is:
  * Visible
  * Non-editable
* URL format: `https://portal.domain.com/[company-slug]`
* No Add/Edit CTA available for this section.

#### **Universal Portal URL (View Only)**

**User Story**  
 As a BD Executive, I want to view the universal portal URL, so that I know the generic access point for the IBP portal.

**Acceptance Criteria**

* Universal portal URL is displayed as a standard generic URL.
* URL field is:
  * Visible
  * Non-editable
* URL format: `https://portal.domain.com/universal` or similar generic endpoint
* No Add/Edit CTA available for this section.
* Clear indication that this is the universal access point without company-specific customization.

---

### **4.1.3 Login and Authentication Configuration**

#### **Company-Specific Portal - Authentication Configuration**

**User Story**  
 As a Lead CRM Owner, I want to configure login and authentication methods for the company-specific IBP portal, so that access policies match company security requirements.

**Note \- Please refer "Authorization Configuration" module PRD**

**Acceptance Criteria**

* Full authentication configuration options available as per Authorization Configuration module.
* BD Executive can configure multiple login methods and security policies.
* Configuration applies only to company-specific portal URL access.

#### **Universal Portal - Authentication Configuration (View Only)**

**User Story**  
 As a BD Executive, I want to view the default authentication method for universal portal access, so that I understand how employees can access the generic portal.

**Acceptance Criteria**

* All login configuration options are disabled and shown in view-only mode.
* Default login method displayed:
  * **Method:** Employee ID and Date of Birth
  * **Status:** Active (non-editable)
* Clear indication that this is the default authentication for universal portal access.
* No customization options available for universal portal authentication.
* Login method cannot be changed or modified for universal portal.

---

### **4.1.4 Branding and Appearance Configuration**

#### **Company-Specific Portal - Full Branding Configuration**

**User Story**  
 As a Lead CRM Owner, I want to configure branding elements for the company-specific portal, so that the IBP portal reflects the company's identity from login to dashboard.

**Acceptance Criteria**

* BD Executive can upload a company logo.
* Logo validation:
  * Max size: 200 × 200 pixels
  * Allowed formats: PNG, SVG
* Uploaded logo is displayed on:
  * Employee portal login screen
  * HR portal login screen
  * Employee dashboard after login
* BD Executive can configure:
  * Welcome message for login screen
  * Body text for login screen
* Welcome message and body text appear on the company-specific IBP login screen.

#### **Universal Portal - Limited Branding Configuration**

**User Story**  
 As a Lead CRM Owner, I want to configure company branding that appears after login for universal portal users, so that employees see company identity after authentication.

**Acceptance Criteria**

* BD Executive can upload a company logo.
* Logo validation:
  * Max size: 200 × 200 pixels
  * Allowed formats: PNG, SVG
* Logo behavior for universal portal:
  * **NOT displayed** on universal login screen
  * **Displayed** on employee dashboard after successful login
  * **Displayed** throughout the portal experience after login
* Welcome message and body text configuration:
  * Fields are **disabled** and not editable
  * Universal login screen shows default generic welcome content
  * Company-specific content appears only after login
* Clear indication that branding applies post-login only for universal portal access.

---

### **4.1.5 Portal Type Detection and Configuration Behavior**

**User Story**  
 As a BD Executive, I want the system to automatically detect the portal type and show appropriate configuration options, so that I can configure settings relevant to the portal access method.

**Acceptance Criteria**

* System automatically detects portal type based on URL structure:
  * Company-specific: Contains company identifier/slug
  * Universal: Generic endpoint without company identifier
* Configuration interface adapts based on detected portal type:
  * **Company-Specific Portal:**
    * Full configuration options available
    * All sections editable as per defined permissions
    * Custom branding applies to login screen
  * **Universal Portal:**
    * Limited configuration options
    * Authentication locked to default method
    * Welcome/body text disabled
    * Logo applies post-login only
* Clear visual indication of current portal type being configured.
* Dashboard and Policy configurations remain fully available for both portal types.
* Help text explains the differences between portal types and configuration limitations.

---

## **4.2 Dashboard Configuration for IBP Portal**

**Note:** Dashboard configuration behavior is **identical** for both Company-Specific and Universal portal types. All dashboard settings apply equally regardless of portal access method.

### **4.2.1 View Dashboard Configuration**

**User Story**  
 As a Lead CRM Owner,, I want to view dashboard module configurations, so that I understand what sections employees can see.

**Acceptance Criteria**

* Dashboard configuration loads in view-only mode by default.  
* Two sections displayed:  
  * Wellness Module Configuration  
  * Retail Insurance Configuration

---

### **4.2.2 Wellness Module Configuration**

#### **Insurance Wellness**

**User Story**  
 As an admin, I want to view the Insurance Wellness configuration, so that I know its current status.

**Acceptance Criteria**

* Insurance Wellness section is visible.  
* Configuration is locked for edit.

---

#### **Emotional & Physical Wellness**

**User Story**  
 As a Lead CRM Owner,, I want to enable or disable emotional and physical wellness modules, so that employees see only relevant wellness content.

**Acceptance Criteria**

* Admin can enable/disable:  
  * Emotional Wellness  
  * Physical Wellness  
* When enabled:  
  * Options shown as per design  
  * Same options visible on employee portal  
* When disabled:  
  * Section hidden completely from employee portal

---

### **4.2.3 Retail Insurance Configuration**

**User Story**  
 As a Lead CRM,, I want to control the visibility of retail insurance offerings, so that employees see only permitted products.

**Acceptance Criteria**

* Lead CRM Owner, can toggle Retail Insurance visibility:  
  * Enabled  
  * Disabled  
* If disabled:  
  * Retail insurance section hidden from employee portal  
* If enabled:  
  * Retail insurance section visible  
  * Currently shows default retail insurance offerings  
* Future configuration support acknowledged but not enforced.

---

## **4.3 Policy Configuration for IBP Portal**

**Note:** Policy configuration behavior is **identical** for both Company-Specific and Universal portal types. All policy settings, sequencing, and enrollment rules apply equally regardless of portal access method.

### **4.3.1 View Policy-Level Configuration**

**User Story**  
 As a Lead CRM Owner, I want to configure enrolment behaviour and display sequence for multiple policies with their plan components, so that rules can differ across policies and the presentation order is controlled.

**Acceptance Criteria**

* All company policies listed in configured sequence order.
* Each policy displays:
  * Policy name and details
  * Current sequence position
  * Associated plan components in their configured order
  * Configurable settings per policy:
    * Auto-lock after confirmation
    * Confirmation required
    * Auto-lock after cutoff date
* Each plan component within a policy shows:
  * Plan component name
  * Current sequence position within the policy
* Configuration applies independently per policy.
* Drag-and-drop handles visible for reordering in edit mode.

---

### **4.3.2 Policy Sequence Configuration**

**User Story**  
 As a Lead CRM Owner, I want to configure the display sequence of policies, so that employees see policies in the intended priority order during enrolment.

**Acceptance Criteria**

* In edit mode, each policy displays a drag handle icon.
* BD Executive can drag and drop policies to reorder them.
* Real-time visual feedback during drag operation:
  * Highlight drop zones
  * Show policy being moved
  * Update sequence numbers dynamically
* After dropping:
  * System automatically updates sequence numbers
  * All affected policies get new sequence positions
  * Visual confirmation of new order
* Sequence changes are saved with the configuration.
* Employee portal displays policies in the configured sequence order.

---

### **4.3.3 Plan Component Sequence Configuration**

**User Story**  
 As a Lead CRM Owner, I want to configure the display sequence of plan components within each policy, so that employees see plan options in the intended order.

**Acceptance Criteria**

* Each policy section shows its plan components as expandable/collapsible list.
* In edit mode, each plan component displays a drag handle icon.
* BD Executive can drag and drop plan components within the same policy to reorder them.
* Plan components cannot be dragged between different policies.
* Real-time visual feedback during drag operation:
  * Highlight valid drop zones within the policy
  * Show plan component being moved
  * Update sequence numbers dynamically within policy scope
* After dropping:
  * System automatically updates plan component sequence numbers within that policy
  * Visual confirmation of new order within the policy
* Sequence changes are saved with the policy configuration.
* Employee portal displays plan components in the configured sequence order within each policy.

---

### **4.3.4 Multi-Policy Management**

**User Story**  
 As a Lead CRM Owner, I want to manage configurations for multiple policies efficiently, so that I can handle complex policy structures with multiple plan components.

**Acceptance Criteria**

* System displays all company policies in a structured format:
  * Policy header with expand/collapse functionality
  * Plan components listed under each policy
  * Clear visual hierarchy between policies and plan components
* Each policy section shows:
  * Policy name, effective dates, and status
  * Number of plan components (e.g., "3 plan components")
  * Individual configuration settings for that policy
* Plan component details include:
  * Plan component name and type
  * Current sequence position within the policy
  * Any plan-specific settings if applicable
* Bulk operations available:
  * Expand/collapse all policies
  * Apply common settings across multiple policies (if supported)
* Search and filter capabilities:
  * Filter by policy name
  * Filter by policy status
  * Search within plan component names

---

### **4.3.5 Enrolment Lock and Confirmation Settings**

**User Story**  
 As a Lead CRM Owner, I want to define enrolment lock rules per policy independently, so that enrolment behaviour is strictly controlled and can vary between different policies.

**Acceptance Criteria**

* For each policy, BD Executive can configure:
  * Automatically lock enrollment immediately after employee confirms:
    * Yes / No
  * Require confirmation before final submission:
    * Yes / No
    * If Yes, show disclaimer text box specific to that policy
  * Auto-lock enrollment after cut-off date:
    * Yes / No
* Each policy can have different enrolment rules.
* Disclaimer text can be customized per policy.
* Disclaimer is enabled only if "Required confirmation before submission" is set to Yes for that policy.
* System enforces these rules during employee enrolment based on the specific policy being enrolled.
* Settings are clearly labeled with policy name to avoid confusion when multiple policies exist.

---

## **5\. Edit, “Save” & “Submit for Approval” Workflow**

### **5.1 Enter Edit Mode**

**User Story**  
 As a BD executive, I want to edit portal preferences, so that I can update configurations when needed.

**Acceptance Criteria**

* Edit CTA visible in view mode.  
* On clicking Edit:  
  * All editable sections become editable  
  * Status changes to “Draft” if not published

---

### **5.2.1 Save ( Option)**

**User Story**  
As a BD Executive, I want to save my configurations, so that when I return later, all previously edited fields are retained and available for further review or update

### Acceptance Criteria

1. The system shall provide a **Save** option for configurations edited by the BD Executive.  
2. On clicking **Save**, all edited configuration fields shall be **persisted successfully**.  
3. When the BD Executive revisits the configuration screen, the system shall **preload all previously saved values**.  
4. No edited field should be lost when the user navigates away and returns to the screen.  
5. The system shall display a **confirmation message** indicating that configurations have been saved successfully.  
6. Saved configurations shall remain editable until they are **submitted for approval** (if applicable).  
7. In case of a save failure, the system shall display an **appropriate error message** and retain the entered data on the screen.

### **5,2.2 Submit for Approval**

**User Story**  
 As BD Executive, I want to submit configurations for approval with proper confirmation, so that I understand the implications and changes are reviewed before going live.

**Acceptance Criteria**

* "Submit for Approval" CTA visible in edit mode.  
* On click:  
  * System displays confirmation popup with warning message:
    * **Title:** "Confirm Submission for Approval"
    * **Message:** "⚠️ **Important Notice:** Once you submit these configurations for approval, you will not be able to edit them until the review process is complete. Please ensure all settings are correct before proceeding.
    
    **What happens next:**
    • Your configurations will be sent to the Manager for review
    • Status will change to 'Under Review'
    • Edit functionality will be disabled during review
    • If rejected, you can modify and resubmit
    • If approved, configurations will be published to the IBP portal
    
    Are you sure you want to submit these configurations for approval?"
    * **Actions:** "Cancel" and "Yes, Submit for Approval" buttons
* On confirmation:  
  * Configuration submitted to manager approval queue  
  * Status changes to "Under Review"  
  * Comment box displayed for BD Executive notes (optional)  
  * Edit option disabled immediately
  * Success message: "Configuration successfully submitted for approval. You will be notified once the review is complete."
* On cancel:
  * Popup closes and user remains in edit mode
  * No changes to configuration status

---

## **6\. Approval Workflow (Manager)**

### **6.1 Manager Review**

**User Story**  
 As a manager, I want to review portal configurations, so that only approved changes are published.

**Acceptance Criteria**

* Manager sees pending items in **My Approvals**.

* Configuration opens in view-only mode.

* Two CTAs visible:  
  * Approve  
  * Reject

---

### **6.2 Approve / Reject Action**

**User Story**  
 As a manager, I want to approve or reject configurations with proper confirmation and comments, so that feedback is documented and I understand the impact of my decision.

**Acceptance Criteria**

* On Approve or Reject click:  
  * System displays confirmation popup with action-specific message:
    
    **For Approve Action:**
    * **Title:** "Confirm Configuration Approval"
    * **Message:** "✅ **Approve Configuration**
    
    You are about to approve these portal configurations. Once approved:
    • Configurations will be **immediately published** to the IBP portal
    • All employees will see the new portal settings
    • BD Executive will be notified of approval
    • Changes will go live and affect user experience"
    * **Actions:** "Cancel" and "Confirm Approval" buttons
    * **Note:** No comment box required for approval action
    
    **For Reject Action:**
    * **Title:** "Confirm Configuration Rejection"
    * **Message:** "❌ **Reject Configuration**
    
    Please provide your feedback to help the BD Executive improve the configuration."
    * **Comment Box:** Mandatory text area with placeholder "Please provide clear feedback explaining the rejection reason..."
    * **Actions:** "Cancel" and "Confirm Rejection" buttons
    
  * Comment box is mandatory only for rejection action
* On confirmation:
  * If approved:  
    * Status changes to "Approved"  
    * Configuration is published to IBP portal immediately
    * Success message: "Configuration approved and published successfully. BD Executive has been notified."
  * If rejected:  
    * Status changes to "Rejected"  
    * Comments visible to BD Executive
    * Success message: "Configuration rejected. BD Executive has been notified and can make modifications."
* On cancel:
  * Popup closes and no action is taken
  * Configuration remains in "Under Review" status

---

## **7\. Status Lifecycle**

| Status | Meaning |
| ----- | ----- |
| Draft | Edited but not saved or submitted for approval |
| Under Review | Submitted for approval |
| Approved | Approved and published |
| Rejected | Rejected with comments |

---

## **8\. Resubmission After Rejection**

**User Story**  
 As an BD Executive, I want to update and resubmit rejected configurations, so that I can address feedback.

**Acceptance Criteria**

* BD Executive can view rejection comments.  
* Edit CTA enabled.  
* Admin can modify configuration and resubmit.  
* Status changes back to “Under Review”.

