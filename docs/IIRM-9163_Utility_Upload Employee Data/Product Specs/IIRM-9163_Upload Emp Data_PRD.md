## Jira ID: IIRM-9163
##### Jira Title: Utility - File Transformation - Client - Inbound - Employee Data (Inception/Endorsement - Upload Employee Data)
##### Purpose of the document: Feature specification and business scenarios

---

## Entrypoint
**Policy Details Screen:** In the policy details screen introduce a tab called "Employee data template config"

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Scope and Boundaries](#2-scope-and-boundaries)
3. [User Personas and Contexts](#3-user-personas-and-contexts)
4. [User Stories](#4-user-stories)
5. [Technical Specifications](#5-technical-specifications)
6. [User Interface Requirements](#6-user-interface-requirements)
7. [Data Requirements](#7-data-requirements)
8. [Future Considerations](#8-future-considerations)
9. [Open Questions](#9-open-questions)

---

## 1. Module Overview

- **Purpose:** Enable ISG teams to define custom column mappings for client employee data files, transforming varied client formats into standardized system templates for seamless Inception and Endorsement processing
- **Business Value:** Reduces manual data transformation effort by 80%, eliminates data entry errors, and accelerates policy enrollment from days to hours by automating client-specific Excel/CSV file processing
- **User Value:** ISG teams can configure once and reuse mappings across multiple uploads, eliminating repetitive manual data transformation and reducing enrollment processing time
- **Module Type:** Feature
- **Phase 1 Scope:** File upload interface, drag-drop column mapping UI, data transformation rules (Gender, Date, Phone, Relation, Boolean), validation engine, approval workflow, and version history management

## 2. Scope and Boundaries

- **In Scope:**
    - File upload interface supporting Excel (.xlsx, .xls) and CSV formats up to 25MB
    - Drag-and-drop column mapping UI with mandatory field indicators
    - Field-level transformation configuration with modal dialogs
    - Real-time transformation preview with sample data (if available in uploaded file)
    - Data transformation rules for Indian insurance context (Gender codes, Date formats, Phone numbers, Relationship types, Boolean values)
    - Validation engine with reject-on-error strategy
    - Approval workflow: ISG Executive creates → ISG Manager approves → Becomes active
    - Version history management with view, restore, duplicate, and replace template capabilities
    - Download configured template functionality
    - Visual mapping progress indicator showing required fields completion
    - Automatic mapping application during Inception/Endorsement uploads
    - Default template fallback when no custom mapping exists
    - Post-Policy-Activation prompt to create mapping
    
- **Out of Scope:**
    - Bulk mapping operations across multiple companies simultaneously
    - AI-powered automatic mapping suggestion
    - Custom transformation rule creation (limited to predefined rules)
    - Multi-step approval workflows (only 2-level: Executive → Manager)
    - Mapping export/import across different environments
    
- **Dependencies:**
    - Policy Configuration module (provides default template structure)
    - Policy Service (enrollment/endorsement template generation)
    - Authentication Service (ISG role verification)
    - Organization Service (company context)
    - Document Service (file storage and retrieval)
    
- **Dependents:**
    - Inception Upload Process (consumes approved mappings)
    - Endorsement Upload Process (consumes approved mappings)
    - Enrollment Processing Scheduler (applies transformations)

## 3. User Personas and Contexts

### ISG Executive
- **Goals:** 
    - Quickly configure employee data mappings for new client formats
    - Test and validate mappings work correctly before production use
    - Update existing mappings when client formats change
    - Minimize manual data transformation work during enrollment periods
    
- **Context:** 
    - Works during policy setup phase after Policy Configuration is complete
    - Handles multiple client companies with varying Excel/CSV formats
    - Under time pressure during enrollment seasons
    - May need to create mappings urgently when new client formats arrive
    
- **Pain Points:** 
    - Clients send employee data in inconsistent formats (different column names, date formats, gender codes)
    - Manual reformatting takes hours for large files (1000+ employees)
    - High error rate when manually transforming data
    - Need to remember each client's specific format quirks

### ISG Manager
- **Goals:**
    - Ensure mapping configurations are correct before they go live
    - Maintain data quality standards across all client uploads
    - Monitor team's mapping creation activity
    - Prevent incorrect mappings from causing enrollment failures
    
- **Context:**
    - Reviews mapping submissions from ISG Executives
    - Responsible for data integrity in enrollment process
    - May need to reject mappings with errors and request corrections
    - Approves mappings during business hours
    
- **Pain Points:**
    - Difficult to verify mapping correctness without seeing sample data
    - Need clear visibility into what fields are mapped and transformation rules applied
    - Risk of approving incorrect mappings that cause downstream issues
    - Version confusion when multiple iterations exist

### Policy Administrator (Indirect User)
- **Goals:**
    - Complete Inception/Endorsement uploads successfully
    - Ensure employee data is correctly formatted before submission
    - Minimize upload failures and data correction cycles
    
- **Context:**
    - Uses the mapping indirectly when uploading employee data files
    - May not be aware of underlying mapping configuration
    - Expects system to automatically handle file format differences
    
- **Pain Points:**
    - Upload failures due to incorrect file formats
    - Not knowing which template format to use for specific companies
    - Having to manually fix data before re-uploading

## 4. User Stories

### ISG Executive User Stories

#### US-IIRM-9163-001: Post-Policy Activation Mapping Prompt
**As an** ISG Executive  
**I want to** be prompted to create employee data mapping immediately after Policy Activation  
**So that** I can prepare for upcoming Inception/Endorsement uploads without delay


**Acceptance Criteria:**
- System displays prompt after policy activation: "Would you like to Create employee data mapping aka Inception or Endorsement file to streamline uploads?"
- "Create Now" button navigates to mapping creation interface
- "Skip" or "Later" button allows continuing without creating mapping

---

#### US-IIRM-9163-002: File Upload and Column Detection
**As an** ISG Executive  
**I want to** upload client employee data files and see detected column headers  
**So that** I can analyze file structure and start mapping to our system template


**Acceptance Criteria:**
- System accepts Excel files (.xlsx, .xls) and CSV files up to 25MB
- System rejects files exceeding 25MB with error: "File size exceeds 25MB limit"
- System rejects unsupported formats with error: "Unsupported file format. Please upload Excel or CSV file"
- System automatically detects and displays column headers from first row of uploaded file

---

#### US-IIRM-9163-003: Field Mapping Configuration
**As an** ISG Executive  
**I want to** map client file columns to system fields using drag-and-drop interface  
**So that** I can define how their data structure translates to our standard template


**Acceptance Criteria:**
- **Drag-and-Drop Mapping:**
    - Source fields - Client columns displayed on left side as draggable elements
    - Target fields - System fields displayed on right side with mandatory indicators (*)
    - Visual checkmarks (✓) appear next to successfully mapped fields
    - Progress counter displays "X of Y required fields mapped"
    - Drag action highlights valid drop zones on system fields side

- **Mapping Validation:**
    - System prevents mapping multiple client columns to single system field
    - System prevents submission if mandatory fields (*) remain unmapped
    - Error message displays: "Please map all mandatory fields marked with (*)"
    - Hover tooltip on mandatory fields shows: "This field is required for enrollment processing"

- **Mapping Management:**
    - "Clear All" button removes all field mappings at once for fresh start
    - System saves mapping relationships for future use

---

#### US-IIRM-9163-004: Transformation Rules Configuration
**As an** ISG Executive  
**I want to** configure transformation rules for each mapped field via modal dialog  
**So that** I can define how to convert client data formats to system formats with preview


**Acceptance Criteria:**
- **Modal Dialog Interaction:**
    - Clicking on mapped field opens transformation configuration modal
    - Modal displays source format dropdown (client format options)
    - Modal displays target format dropdown (system format options)
    - "Apply Configuration" button saves and closes modal
    - "Cancel" button discards changes and closes modal

- **Transformation Preview:**
    - When file contains sample data: Modal shows 3-5 real transformation examples
        - Example: "15/03/1990 → 1990-03-15" (date transformation)
        - Example: "M → Male" (gender transformation)
    - When file contains only headers: Modal shows format conversion pattern without actual data
        - Example: "DD/MM/YYYY → YYYY-MM-DD"

- **Supported Transformations:**
    - **Gender:** M→Male, F→Female, 1→Male, 2→Female, Male→Male, Female→Female
    - **Date Formats:** DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD → ISO format
    - **Phone Numbers:** Add +91 prefix, remove formatting, validate 10-digit format
    - **Relationships:** S→Self, SP→Spouse, CH→Child, F→Father, M→Mother
    - **Boolean:** Yes/No→true/false, Y/N→true/false, 1/0→true/false

---

#### US-IIRM-9163-005: Mapping Draft Management
**As an** ISG Executive  
**I want to** save my mapping configuration as draft and resume later  
**So that** I can complete complex mappings across multiple sessions without losing progress


**Acceptance Criteria:**
- "Save as Draft" button saves current mapping state without validation
- Draft mappings remain editable by creator only
- System automatically loads existing draft when returning to mapping screen
- System validates all mandatory fields only when "Submit for Approval" is clicked
- Creator can edit draft until submission

---

#### US-IIRM-9163-006: Mapping Submission for Approval
**As an** ISG Executive  
**I want to** submit completed mapping for ISG Manager approval  
**So that** it can be validated and activated for production use


**Acceptance Criteria:**
- System validates all mandatory fields are mapped before allowing submission
- "Submit for Approval" changes mapping status from "Draft" to "Pending Approval"
- System sends notification to ISG Manager roles upon submission
- Submitted mapping becomes read-only (not editable) until approved or rejected
- System prevents new version submission if another version is already "Pending Approval"

---

#### US-IIRM-9163-007: Mapping Version Management
**As an** ISG Executive  
**I want to** view all mapping versions and perform version operations (restore, duplicate, edit, delete)  
**So that** I can maintain mapping configurations and handle client format changes


**Acceptance Criteria:**
- **Version List View:**
    - System displays all versions with: Version number, Status (Draft/Pending Approval/Approved/Rejected), Created Date, Created By
    - Clicking version opens detail view showing complete field mappings and transformation rules

- **Version Operations:**
    - **Restore:** Creates new draft version as copy of selected approved version
    - **Duplicate:** Creates new draft version as copy of any existing version
    - **Edit:** Allows editing draft or rejected versions only (not approved/pending versions)
    - **Delete:** Allows deleting draft versions only (with confirmation prompt)
    - **Replace Template:** Uploads new template file and reconfigures mapping (creates new version)
    - **Download:** Downloads configured template as Excel file for reference or distribution

- **New Version Creation:**
    - "Create New Version" button creates draft from latest approved version
    - Only one version can be in "Pending Approval" status at a time per company
    - During approval process, current approved version continues to be used for uploads

---

### ISG Manager User Stories

#### US-IIRM-9163-008: Approval Notifications and Dashboard
**As an** ISG Manager  
**I want to** receive notifications when mappings are submitted for approval  
**So that** I can review and approve them promptly


**Acceptance Criteria:**
- System sends in-app notification to all ISG Manager roles when mapping submitted
- Clicking notification navigates directly to mapping review screen
- Dashboard displays count of pending approvals: "X mappings pending your approval"
- Notification includes: Company name, Submitted by, Submission date

---

#### US-IIRM-9163-009: Mapping Review and Validation
**As an** ISG Manager  
**I want to** review mapping details including all field mappings and transformation rules  
**So that** I can verify correctness before approving for production use


**Acceptance Criteria:**
- **Review Screen Display:**
    - Complete list of mapped fields showing: Client Column Name → System Field Name
    - Transformation rules displayed for each field (e.g., "Gender: M→Male, F→Female, 1→Male, 2→Female")
    - Mandatory fields highlighted with (*) indicator
    - Visual confirmation that all mandatory fields are mapped

- **Review Information:**
    - Submitted by (ISG Executive name and date)
    - Company name and policy context
    - Version number (if updating existing mapping)
    - Configuration summary: "X fields mapped · Y transformations configured"

---

#### US-IIRM-9163-010: Mapping Approval/Rejection with Comments
**As an** ISG Manager  
**I want to** approve or reject mapping submissions with mandatory comments  
**So that** ISG Executives understand my decision and can correct issues if rejected


**Acceptance Criteria:**
- **Approval Flow:**
    - "Approve" button changes status to "Approved" and activates mapping immediately
    - Approved mapping automatically becomes active for future employee uploads
    - System sends confirmation notification to ISG Executive who created mapping
    - Only one manager approval required (not multiple approvers)

- **Rejection Flow:**
    - "Reject" button prompts for mandatory rejection reason (comment field required)
    - System prevents rejection submission if comment field is empty
    - Status changes to "Rejected" after rejection reason submitted
    - System sends notification to ISG Executive with rejection comments
    - Rejected mapping can be edited and resubmitted by creator

- **Audit Trail:**
    - System records: Approver/Rejector name, Action date/time, Comments
    - Audit information visible in version history

---

#### US-IIRM-9163-011: Mapping Version History and Audit Trail
**As an** ISG Manager  
**I want to** view complete approval history for all mapping versions  
**So that** I can audit changes, decisions, and maintain compliance records


**Acceptance Criteria:**
- Version history displays: Version number, Status, Created By, Created Date, Approved/Rejected By, Approved/Rejected Date, Comments
- Filter options available: Status (All/Draft/Pending/Approved/Rejected), Date range, Created By
- Export functionality generates Excel report with complete audit trail
- History is read-only (cannot be modified or deleted)

---

### Policy Administrator User Stories (Indirect Users)

#### US-IIRM-9163-012: Automatic Mapping Application During Upload
**As a** ISG User  
**I want** the system to automatically apply the correct mapping when I upload employee or employee with dependents data at the time of Inception or Endorsement process step-1  
**So that** I don't need to manually transform file formats or worry about data structure


**Acceptance Criteria:**
- **Automatic Mapping Selection:**
    - System automatically applies latest approved mapping for company during Inception/Endorsement upload
    - If no custom mapping exists, system falls back to default Policy Configuration template
    - System displays which mapping version is being used: "Using approved mapping v3 (created 2025-12-15)"

- **Post-Upload Success:**
    - Success message displays: "Upload successful. X records processed using mapping vY"
    - System validates data against mapping rules before processing
    - Transformed data is applied to enrollment process automatically

- **Missing Mapping Handling:**
    - If policy activated but no mapping configured, system displays prompt: "No custom mapping found. Create mapping to simplify future uploads?"
    - Prompt includes "Create Mapping" and "Use Default Template" options

---

#### US-IIRM-9163-013: File Validation During Upload
**As a** Policy Administrator  
**I want** the system to validate uploaded files against existing Inception/Endorsement constraints plus new transformation rules  
**So that** data quality is maintained across both custom mappings and standard validations


**Acceptance Criteria:**
- System applies all existing Inception/Endorsement business rules to uploaded data
- System additionally validates data against configured transformation rules
- If file passes both validations, upload proceeds successfully
- If any validation fails, upload is rejected with combined error report

---

### Error Handling & Edge Case User Stories

#### US-IIRM-9163-014: File Upload Error Handling
**As an** ISG Executive  
**I want** the system to validate file quality and structure before processing  
**So that** I can catch common file issues early and get clear error messages


**Acceptance Criteria:**
- **Empty File Detection:** System rejects files with only headers, no data rows → Error: "File contains no data rows. Please upload file with at least one employee record."
- **Merged Cell Detection:** System detects merged cells in header row → Warning: "Merged cells detected in header row. Please unmerge cells and ensure each column has unique header."
- **Special Characters in Headers:** System accepts UTF-8 characters in column names and displays them as-is in mapping interface
- **Inconsistent CSV Delimiters:** System detects delimiter from first 10 rows; rejects if inconsistent → Error: "Inconsistent delimiters detected. Please ensure all rows use same delimiter."
- **Duplicate Column Headers:** System automatically renames duplicates: "Phone Number", "Phone Number (2)", "Phone Number (3)"

---

#### US-IIRM-9163-015: Mapping Configuration Error Handling
**As an** ISG Executive  
**I want** the system to handle unusual mapping scenarios gracefully  
**So that** I can create flexible mappings while maintaining data integrity


**Acceptance Criteria:**
- **One-to-Many Mapping:** System allows mapping same client column to multiple compatible system fields (e.g., "Name" → both "Full Name" and "Employee Name")
- **Optional Field Unmapped:** System displays unmapped optional fields in gray; saves mapping without error; populates fields with null during upload
- **Incomplete Transformation Rules:** If transformation rule doesn't cover input value → Upload validation error: "Row 45, Gender: Invalid value 'Other'. Expected M, F, Male, Female, 1, or 2."
- **Already Active Version Restore:** System prevents restoring currently active mapping → Message: "This version is already active. No action needed."

---

#### US-IIRM-9163-016: Approval Workflow Error Handling
**As an** ISG Manager  
**I want** the system to handle edge cases in approval process  
**So that** approval decisions are consistent and audit-safe


**Acceptance Criteria:**
- **Approver Account Disabled:** If ISG Manager account disabled after approval → Mapping remains approved and active; historical approval record preserved with approver name at approval time
- **Inactive Policy Warning:** If policy deactivated before approval → System shows warning: "Associated policy is inactive. Approve anyway?" → Mapping approved but not activated until policy reactivated
- **Concurrent Approval Attempts:** If two managers try to approve/reject simultaneously → First action succeeds; second displays error: "Mapping already approved/rejected by [Manager Name]."
- **Duplicate Version During Pending Approval:** System allows creating v5 draft while v4 is "Pending Approval"; only one can be active eventually

---

#### US-IIRM-9163-017: Data Validation Error Handling
**As a** Policy Administrator  
**I want** the system to validate data formats strictly and provide detailed errors  
**So that** I can quickly identify and fix data quality issues


**Acceptance Criteria:**
- **Ambiguous Date Formats:** System uses configured transformation rule as source of truth (e.g., DD/MM/YYYY interprets "01/02/2024" as Feb 1); rejects if doesn't match configured format
- **International Phone Numbers:** System rejects non-Indian phone formats → Error: "Row 23, Phone Number: Invalid format. Expected Indian phone number with +91 or 10 digits."
- **Empty Mandatory Fields:** System rejects rows with null required fields → Error: "Row 67, Gender: Required field is empty."
- **Leading Zeros in IDs:** System preserves leading zeros if text-formatted; warns if numeric formatting detected → Warning: "Column 'Employee ID' appears numeric. Leading zeros may be lost. Format as text in Excel."
- **Data Type Mismatch:** If date field contains text like "Pending" → Error: "Row 145, Date of Birth: Invalid date value 'Pending'. Expected date in format DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, or YYYY-MM-DD."

---

#### US-IIRM-9163-018: Upload Processing Error Handling
**As a** Policy Administrator  
**I want** the system to handle timing and version conflicts during upload  
**So that** uploads are processed consistently regardless of concurrent changes


**Acceptance Criteria:**
- **Version Lock During Upload:** Upload locks mapping version at start; continues with locked version even if new version approved mid-processing → UI shows: "Processing with mapping v2 (active at upload time)"
- **No Mapping Available:** If no custom mapping and no default template → Error: "No mapping configuration available. Please complete Policy Configuration or create custom mapping."
- **File Structure Mismatch:** If file structure doesn't match approved mapping → Error: "File structure doesn't match approved mapping. Expected 3 columns, found 5 columns. Please update mapping or correct file."
- **Dependent/Family Member Data:** System uses Relation field to distinguish (Relation=Self → Employee record; Relation=Spouse/Child/etc → Dependent record)
- **Wide File Performance:** System handles files with 100+ columns efficiently using virtual scrolling; processes only mapped columns
- **Concurrent Upload During Version Switch:** If upload starts at 2:59 PM with v2, v3 approved at 3:00 PM → Upload completes with v2; next upload uses v3

---

## 5. Technical Specifications

### File Processing Constraints

| Specification | Value | Rationale |
|--------------|-------|-----------|
| **Supported Formats** | Excel (.xlsx, .xls), CSV | Common enterprise data export formats |
| **Maximum File Size** | 25MB | Accommodates ~5,000 employee records without performance issues |
| **Header Row** | First row contains column names | Standard Excel/CSV structure |
| **Data Rows** | Start from row 2 onwards | Data follows header row |
| **Column Order** | Order-independent (name-based mapping) | Client files can have columns in any sequence |
| **Delimiter for CSV** | Comma (,) or Semicolon (;) | Supports both regional standards |

### System Field Requirements
- Note: Technical team have to add more details after analysis.
**Mandatory Fields (Must be mapped):**
- Employee ID
- Full Name
- Date of Birth
- Gender
- Relationship/Relation
- Sum Insured
- Policy Start Date

**Optional Fields (Can remain unmapped):**
- Email
- Phone Number
- Designation
- Marital Status
- Relationship Group
- Effective From/To dates

### Transformation Rules

| Data Type | Source Formats | Target Format | Example |
|-----------|---------------|---------------|---------|
| **Gender** | M, F, 1, 2, Male, Female | Male/Female | M → Male, 2 → Female |
| **Date** | DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY, YYYY-MM-DD | YYYY-MM-DD (ISO) | 15/03/1990 → 1990-03-15 |
| **Phone** | Various formats with/without +91 | +91XXXXXXXXXX (10 digits) | 98765 43210 → +919876543210 |
| **Relationship** | S, SP, CH, SON, DAU, F, M, etc. | Self, Spouse, Child, Father, Mother | SP → Spouse, CH → Child |
| **Boolean** | Yes/No, Y/N, 1/0, True/False | true/false | Yes → true, 0 → false |

### Validation Rules

1. **Reject-on-Error Strategy:** If any row fails validation, entire file is rejected (no partial imports)
2. **Error Reporting:** System generates detailed report with:
   - Row number
   - Field name
   - Current value
   - Error description
   - Expected format
3. **Mandatory Field Validation:** All mandatory fields must be mapped before submission
4. **Data Type Validation:** Values must conform to transformation rules or validation fails
5. **Empty String Handling:** Empty strings in optional fields normalized to NULL

### Authorization & Access Control

| Role | Permissions |
|------|-------------|
| **ISG Executive** | Create mappings, Edit own drafts, Submit for approval, Duplicate/Restore versions |
| **ISG Manager** | Approve/Reject mappings, View all mappings, Access audit history |
| **Policy Administrator** | Use approved mappings during upload (read-only), View error reports |
| **Other Roles** | No access to mapping configuration |

### Version Management Rules

1. **One Active Mapping:** Only one approved mapping per company at any time
2. **One Pending Approval:** Only one version can be "Pending Approval" per company at a time
3. **Concurrent Edit Prevention:** Optimistic locking prevents multiple users editing same draft
4. **Automatic Activation:** Approved mapping immediately becomes active for future uploads
5. **Version History:** All versions (Draft, Pending, Approved, Rejected) retained for audit trail
6. **Ownership Transfer:** Draft mappings automatically transfer when company reassigned to different ISG member
7. **Unsaved Changes Warning:** Navigating away shows warning; data only saved on "Save Configuration" click

### Integration Constraints

- **Applies to:** Both Inception and Endorsement upload processes
- **Fallback Behavior:** If no custom mapping exists, system uses default Policy Configuration template
- **Mapping Scope:** Company-level (Phase 1); Architecture supports policy-level (Phase 2+)
- **Upload Lock:** Mapping version locked at upload start; remains immutable during processing
- **Post-Activation Prompt:** System suggests mapping creation after Policy Activation (optional, skippable)

---

## 6. User Interface Requirements

### Mapping Creation Screen

- **Screen/Page:** Employee Data Mapping Configuration
    - **Purpose:** Enable ISG Executives to configure column mappings between client file format and system template
    - **Key Elements:**
        - Company selector dropdown (to identify which company mapping is for)
        - File upload zone (drag-drop or browse button)
        - Two-column layout:
            - Left column: Client file columns (draggable) with lock icon, e.g., "EMP_ID", "EMPLOYEE_NAME", "DOB", "SEX", "START_DT", "COVERAGE_AMT", "DEPARTMENT"
            - Right column: System fields with mandatory indicators (*) and checkmarks (✓) when mapped
        - Mapping progress counter: "X of Y required fields mapped" at bottom
        - Data preview table showing sample records with actual data and transformations
        - Clear All button (to remove all mappings)
        - Save Configuration button (primary action)
        - Cancel button
    - **User Flow:**
        1. Select company from dropdown
        2. Upload sample client file (Excel/CSV)
        3. System displays detected columns on left and system fields on right
        4. Drag client columns onto system fields on right
        5. Click mapped field to open transformation configuration modal
        6. Configure transformation rules with preview
        7. Monitor progress counter showing required fields completion
        8. Review sample data preview table at bottom
        9. Click "Save Configuration" when all required fields are mapped
    - **Validation Rules:**
        - Company must be selected before file upload
        - File size must not exceed 25MB
        - File must be .xlsx, .xls, or .csv format
        - All mandatory system fields (*) must be mapped before saving
        - Progress counter updates dynamically as fields are mapped
        - Checkmarks (✓) appear automatically when field successfully mapped

### Data Transformation Configuration Modal

- **Screen/Page:** Configure Data Transformation (Modal Dialog)
    - **Purpose:** Configure field-level transformation rules with real-time preview
    - **Key Elements:**
        - Modal title: Field name being configured (e.g., "Date Of Birth")
        - Subtitle: "Configure Data Transformation"
        - Source Column: Display selected client column name (e.g., "DOB")
        - Source Format: Dropdown with format options (e.g., "DD/MM/YYYY", "DD-MM-YYYY", "YYYY-MM-DD")
        - Target Format: Dropdown with target format options
        - Preview Transformation section:
            - Format conversion pattern display (e.g., "Format: DD/MM/YYYY → YYYY-MM-DD")
            - Sample data transformations (if available):
                - Shows 3-5 example rows with before → after transformation
                - E.g., "15/03/1990 → 15/03/1990", "22/07/1985 → 22/07/1985"
            - If no sample data: Shows only format pattern without actual values
        - Cancel button (secondary action)
        - Apply Configuration button (primary action, dark background)
    - **User Flow:**
        1. User clicks on mapped field in main screen
        2. Modal opens showing current field configuration
        3. User selects source format from dropdown
        4. User selects target format from dropdown
        5. System displays preview transformation immediately
        6. If sample data exists in uploaded file: Shows actual data transformations
        7. If no sample data: Shows format pattern only
        8. User reviews preview and clicks "Apply Configuration" to save
        9. Modal closes and field mapping updated with transformation rule
    - **Validation Rules:**
        - Source format selection is mandatory for date, phone, and other format-sensitive fields
        - Preview updates automatically when format selections change
        - Sample data shown only if uploaded file contains data rows (not just headers)
        - At least 3 sample rows shown in preview (if available in file)

### Post-Configuration Success Banner

- **Screen/Page:** Mapping Configuration Success Banner
    - **Purpose:** Confirm successful mapping configuration and provide quick actions
    - **Key Elements:**
        - Green checkmark icon indicating success
        - Success message: "Employee Template Configured"
        - Configuration summary: "X fields mapped · Ready to use"
        - Action buttons (icon buttons):
            - Edit (pencil icon) - Modify mapping configuration
            - Delete (trash icon) - Remove mapping
            - Download (download icon) - Download configured template as Excel
        - Replace Template button (text button) - Upload new template file
    - **User Flow:**
        1. After successful Save Configuration, banner appears at top
        2. User can quickly access actions without navigating away
        3. Click Edit to modify mapping
        4. Click Download to get configured template file
        5. Click Replace Template to upload new client file and reconfigure
    - **Validation Rules:**
        - Banner appears only after successful configuration save
        - Edit action available for creator or users with edit permissions
        - Delete action requires confirmation dialog
        - Download generates Excel file with configured field mappings

- **Screen/Page:** Mapping Approval Review
    - **Purpose:** Enable ISG Managers to review and approve/reject mapping submissions
    - **Key Elements:**
        - Mapping details summary (Company, Created By, Submitted Date, Version)
        - Field mapping table showing:
            - Client Column Name
            - System Field Name
            - Transformation Rule
            - Mandatory indicator (*)
        - Sample data preview (first 5 rows from uploaded file with transformations applied)
        - Comments text area (for approval/rejection notes)
        - Approve button
        - Reject button (requires comment)
        - Cancel button
    - **User Flow:**
        1. Receive notification of pending mapping
        2. Navigate to review screen
        3. Review field mappings and transformation rules
        4. Preview sample transformed data
        5. Decide: Approve (with optional comment) or Reject (with mandatory comment)
    - **Validation Rules:**
        - Rejection comment is mandatory (minimum 10 characters)
        - Approval comment is optional
        - Only ISG Managers can approve/reject

### Version History Screen

- **Screen/Page:** Mapping Version History
    - **Purpose:** Display all mapping versions for a company with status and actions
    - **Key Elements:**
        - Company name header
        - Version list table with columns:
            - Version Number
            - Status (Draft, Pending Approval, Approved, Rejected)
            - Created By
            - Created Date
            - Approved/Rejected By
            - Approved/Rejected Date
            - Actions (View, Restore, Duplicate)
        - Active version indicator badge
        - Create New Version button
        - Filter by status dropdown
        - Export History button
    - **User Flow:**
        1. Navigate to mapping management screen
        2. Select company
        3. View version history list
        4. Filter by status (optional)
        5. Click version to view details
        6. Perform actions: Restore previous version or Duplicate for editing
    - **Validation Rules:**
        - Only approved versions can be restored
        - Any version can be duplicated
        - Restore/Duplicate creates new draft version

### Mapping Detail View Screen

- **Screen/Page:** Mapping Configuration Details
    - **Purpose:** Display read-only view of complete mapping configuration
    - **Key Elements:**
        - Mapping metadata (Version, Status, Created By, Date, Approved By, Date)
        - Field mapping table (same structure as creation screen)
        - Transformation rules for each field
        - Approval/Rejection comments (if applicable)
        - Close button
    - **User Flow:**
        1. Navigate from version history
        2. Click on specific version
        3. View complete mapping details
        4. Close to return to version history
    - **Validation Rules:**
        - Read-only view; no editing allowed

### Post-Policy-Activation Prompt

- **Screen/Page:** Mapping Creation Prompt Modal
    - **Purpose:** Encourage ISG users to create mapping immediately after policy activation
    - **Key Elements:**
        - Modal dialog with message: "Create employee data mapping to streamline uploads?"
        - Description text: "Custom mapping helps automatically transform client file formats during Inception and Endorsement uploads."
        - Create Now button (primary action)
        - Skip/Later button (secondary action)
        - Don't show again checkbox (optional)
    - **User Flow:**
        1. ISG user completes Policy Activation
        2. System displays modal prompt
        3. User chooses: Create Now (navigates to mapping screen) or Skip (dismisses modal)
    - **Validation Rules:**
        - Modal appears only once per policy activation
        - "Don't show again" preference is user-specific

### Upload Progress & Error Display

- **Screen/Page:** Employee Data Upload Results
    - **Purpose:** Show upload validation results and errors for correction
    - **Key Elements:**
        - Upload summary (Total Rows, Successful, Failed)
        - Error table with columns:
            - Row Number
            - Field Name
            - Error Description
            - Current Value
        - Download Error Report button (Excel format)
        - Upload Corrected File button
        - Close button
    - **User Flow:**
        1. Upload employee data file
        2. System validates against mapping
        3. If errors exist, display error table
        4. User downloads error report
        5. User corrects file offline
        6. User re-uploads corrected file
    - **Validation Rules:**
        - If any errors exist, entire file is rejected
        - Error report includes all validation failures
        - User must correct and re-upload complete file

## 7. Data Requirements

### Input Data

- **Client Employee Data File:**
    - **Format:** Excel (.xlsx, .xls) or CSV
    - **Structure:** First row contains column headers, subsequent rows contain employee data
    - **Size Limit:** Maximum 25MB
    - **Validation:** Must have at least one data row (excluding header row)
    - **Source:** Provided by client/company
    - **Example Columns:** "Emp ID", "Name", "Gender", "DOB", "Mobile", "Email", "Relation", "Designation"

- **Mapping Configuration Submission:**
    - **Company ID:** Reference to company entity (foreign key)
    - **Created By User ID:** ISG Executive who created mapping
    - **Field Mapping Array:** JSON structure containing:
        - Client column name
        - System field name
        - Transformation rule ID (if applicable)
        - Is mandatory flag
    - **Sample File Reference:** Storage path to uploaded sample file
    - **Status:** Draft, Pending Approval, Approved, Rejected
    - **Version Number:** Sequential integer starting from 1

## 8. Future Considerations

### Enhancement 1: AI-Powered Mapping Suggestions
- **Description:** Use machine learning to analyze uploaded file and suggest likely field mappings based on column names, data patterns, and historical mappings
- **Rationale:** Reduce mapping configuration time from 15 minutes to <5 minutes; improve accuracy for new ISG users
- **Complexity:** High (requires ML model training, pattern recognition, confidence scoring)
- **Dependencies:** Sufficient historical mapping data (100+ mappings) for model training
- **Timeline:** Phase 3 (6-9 months post-Phase 1 launch)

### Enhancement 2: Bulk Mapping Operations
- **Description:** Enable ISG Managers to copy/apply mappings across multiple similar companies (e.g., all companies in same industry sector)
- **Rationale:** Save time for companies with identical file formats; reduce duplicate configuration effort
- **Complexity:** Medium (requires mapping template library, selective field override)
- **Dependencies:** Robust version control, conflict resolution logic
- **Timeline:** Phase 2 (3-6 months post-Phase 1 launch)

### Enhancement 3: Custom Transformation Rule Builder
- **Description:** Allow ISG users to define custom transformation rules beyond predefined options (e.g., custom date formats, company-specific codes)
- **Rationale:** Handle edge cases and unique client requirements without developer intervention
- **Complexity:** High (requires rule definition language, validation engine, security controls)
- **Dependencies:** Comprehensive testing framework to prevent incorrect custom rules
- **Timeline:** Phase 4 (9-12 months post-Phase 1 launch)

### Enhancement 4: Mapping Import/Export Across Environments
- **Description:** Enable export of mapping configuration from UAT to Production, or backup/restore mappings
- **Rationale:** Simplify environment promotion, disaster recovery, and mapping portability
- **Complexity:** Low (JSON export/import with validation)
- **Dependencies:** Environment-specific field validation, company ID remapping
- **Timeline:** Phase 2 (3-6 months post-Phase 1 launch)

### Enhancement 5: Multi-Step Approval Workflow
- **Description:** Support complex approval chains (ISG Executive → Senior ISG Executive → ISG Manager) with delegation and escalation
- **Rationale:** Handle larger organizations with more governance requirements
- **Complexity:** High (requires workflow engine, role hierarchy, SLA tracking)
- **Dependencies:** Organizational hierarchy module, notification service enhancements
- **Timeline:** Phase 4 (9-12 months post-Phase 1 launch)

### Enhancement 6: Mapping Diff/Comparison View
- **Description:** Side-by-side comparison of two mapping versions showing added/removed/changed field mappings
- **Rationale:** Help ISG Managers quickly understand what changed between versions during approval review
- **Complexity:** Low (UI enhancement, data comparison logic)
- **Dependencies:** Version history storage with detailed field-level metadata
- **Timeline:** Phase 2 (3-6 months post-Phase 1 launch)

### Enhancement 7: Scheduled Mapping Activation
- **Description:** Allow ISG users to schedule future activation date/time for approved mappings (e.g., activate new mapping on policy renewal date)
- **Rationale:** Align mapping changes with policy lifecycle events; reduce manual coordination
- **Complexity:** Medium (requires scheduler service integration, activation queue)
- **Dependencies:** Cron job scheduler, timezone handling
- **Timeline:** Phase 3 (6-9 months post-Phase 1 launch)

### Enhancement 8: Manual Mapping Version Selection for Historical Data Re-processing
- **Description:** Allow users to select specific historical mapping version when uploading Inception/Endorsement files for past periods
- **User Story:** As a Policy Administrator, I want to re-upload employee data for June 2024 enrollment using the mapping configuration that was active in June 2024 (not current mapping), so that historical data processing maintains original transformation rules
- **UI Addition:** Dropdown selector on upload screen: "Use Mapping Version: [ Latest Active v5 ▼ ]" with option to select from approved historical versions
- **Business Rules:**
    - Only approved mapping versions available for selection
    - Default selection: Latest active mapping
    - Version selection locked once upload starts
    - Audit trail records which mapping version used for each upload
- **Use Cases:**
    - Re-processing rejected files from 6 months ago with original mapping rules
    - Correcting historical enrollment data without applying current transformation logic
    - Comparing upload results using different mapping configurations
- **Rationale:** Historical accuracy, support for data corrections, regulatory compliance for backdated enrollments
- **Complexity:** Medium (requires mapping version dropdown UI, validation against archived versions, version locking mechanism)
- **Timeline:** Phase 2 (3-6 months post-Phase 1 launch)
- **Dependencies:** Mapping version history preservation (already covered in Phase 1)

### Architectural Note: Column Order Independence
- **Context:** Phase 1 implementation for **inbound file processing** (employee data upload) uses name-based column mapping, making column order irrelevant
- **Clarification:** When company provides file with columns [Name, DOB, Gender], system identifies fields by header name regardless of sequence
- **Future Scope:** For **outbound file generation** where external systems (payroll, HRMS) expect specific column sequences, column order preservation and sequencing requirements will be addressed in separate PRD
- **Phase 1 Decision:** No column order constraints for inbound processing; flexibility in client file structure

## 9. Open Questions

### Business Logic Clarifications

- **Question 1: Handling of dependents vs. employees**
    - **Issue:** Current requirements focus on employee data, but insurance policies typically include dependents (spouse, children). Should mapping support separate dependent fields?
    - **Impact:** May require additional fields like "Relationship Type" to distinguish employee row from dependent rows
    - **Suggested Resolution:** Confirm if Phase 1 should handle only employees, or both employees and dependents in same file
    - **Priority:** High

- **Question 2: Multi-policy companies**
    - **Issue:** If a company has multiple active policies (e.g., Health, Life, Group Accident), should mapping be policy-specific or company-wide?
    - **Impact:** Database schema design (mapping linked to company vs. policy), UI navigation changes
    - **Suggested Resolution:** Clarify mapping scope—one mapping per company (used for all policies) or one mapping per policy
    - **Priority:** High

### Technical Implementation Questions

- **Question 3: Real-time validation during mapping creation**
    - **Issue:** Should system validate sample file data against mapping rules during configuration, or only during actual employee upload?
    - **Impact:** If real-time validation included, Phase 1 scope increases; provides better user experience
    - **Suggested Resolution:** Consider deferring to Phase 2 as "Real-Time Data Transformation Preview" enhancement
    - **Priority:** Medium

- **Question 4: Maximum number of columns supported**
    - **Issue:** No limit specified for number of columns in client file (e.g., 50 columns, 100 columns?)
    - **Impact:** UI scrolling/pagination design, performance considerations
    - **Suggested Resolution:** Define reasonable limit (e.g., 50 columns max) based on typical client file complexity
    - **Priority:** Low

- **Question 5: Handling of extra unmapped columns**
    - **Issue:** If client file has 30 columns but only 15 are mapped to system fields, what happens to remaining 15 columns?
    - **Impact:** Data storage decisions, audit trail requirements
    - **Suggested Resolution:** Clarify if extra columns should be ignored, stored in raw format, or flagged as warning
    - **Priority:** Medium

### User Experience Questions

- **Question 6: Mapping validation before submission**
    - **Issue:** Should system run validation on sample file data before allowing submission, or rely on ISG Manager to verify during approval?
    - **Impact:** Reduces rejection rate but increases submission time
    - **Suggested Resolution:** Implement basic validation (mandatory fields mapped) in Phase 1; defer data validation to Phase 2
    - **Priority:** Medium

- **Question 7: Bulk rejection reason templates**
    - **Issue:** ISG Managers may reject mappings for common reasons. Should system provide rejection reason templates (e.g., "Incorrect Gender mapping", "Missing mandatory fields")?
    - **Impact:** Improves consistency of feedback, saves time for managers
    - **Suggested Resolution:** Implement as quick enhancement in Phase 1 or defer to Phase 2
    - **Priority:** Low

### Integration Questions

- **Question 8: Notification delivery channels**
    - **Issue:** Should approval notifications be in-app only, or also via email/SMS?
    - **Impact:** Integration with notification service complexity
    - **Suggested Resolution:** Start with in-app notifications in Phase 1; add email in Phase 2
    - **Priority:** Low

- **Question 9: Audit trail granularity**
    - **Issue:** Should system track every field-level change during mapping creation (e.g., "Gender mapping changed from M→Male to 1→Male"), or only major events (Created, Submitted, Approved)?
    - **Impact:** Storage requirements, audit report complexity
    - **Suggested Resolution:** Start with major events in Phase 1; add field-level tracking in Phase 2 if required for compliance
    - **Priority:** Low

### Scope Boundary Questions

- **Question 10: Policy Configuration template structure**
    - **Issue:** How is the "default template from Policy Configuration" generated? Is it stored as downloadable Excel file, or dynamic based on policy fields?
    - **Impact:** Fallback mechanism implementation approach
    - **Suggested Resolution:** Review existing Policy Configuration module to understand template generation; ensure compatibility
    - **Priority:** High

---

**Document Version:** 1.0  
**Created By:** Product Manager (AI Assistant)  
**Created Date:** 2026-01-24  
**Status:** Draft - Awaiting Stakeholder Review  
**Next Steps:** Schedule review meeting with ISG team leads and technical architects to address open questions
