# PRD - Excel Transformation Utility

**Product Requirements Document**  
**Version:** 1.0  
**Last Updated:** 6 January 2026

---

## 1. Overview

### 1.1 Purpose
The Excel Transformation Utility enables users to map and transform client-provided Excel files into the system's required format through an intuitive drag-and-drop interface. This utility eliminates manual data reformatting and ensures seamless data import across multiple entities (Company, TPA, Insurer, Employee Enrollment, Policy, Endorsement, and Claims).

### 1.2 Business Value
- **Reduces Manual Effort:** Eliminates hours of manual data reformatting and copy-paste operations
- **Increases Accuracy:** Minimizes human errors in data transformation
- **Accelerates Onboarding:** Speeds up client, insurer, and TPA data migration
- **Reusability:** Template-based mapping can be reused across multiple entities
- **Flexibility:** Accommodates diverse client data formats without code changes

### 1.3 User Value
- **Time Savings:** Transform data in minutes instead of hours
- **User-Friendly:** Visual drag-and-drop interface requires no technical expertise
- **Transparency:** Preview transformed data before final upload
- **Consistency:** Standardized data format across all uploads

---

## 2. Scope & Boundaries

### 2.1 In Scope
- Excel file upload and column header extraction (.xlsx format)
- Visual drag-and-drop column mapping interface
- Mapping template creation and management
- Template reuse across multiple entities (Company, TPA, Insurer)
- Data transformation rule configuration (date formats, gender codes, amount formats)
- Mapping preview before actual data processing
- Backend file transformation during Inception/Endorsement/Claims upload
- Support for the following entity types:
    - Employee Enrollment
    - Policy Inception
    - Endorsement
    - Claims
    - Company/TPA/Insurer master data

### 2.2 Out of Scope
- File formats other than .xlsx (e.g., .xls, .csv)
- Automated column name matching/suggestion
- Complex data validation beyond format transformation
- Data cleansing or deduplication
- Bulk upload of multiple files simultaneously
- Real-time data sync with external systems

### 2.3 Dependencies
- **File Upload Service:** For handling .xlsx file uploads
- **Excel Parser Library:** For reading Excel file structure and data
- **Entity-Specific Upload Modules:** Inception, Endorsement, Claims upload modules
- **Template Storage:** Database to store mapping templates

---

## 3. User Personas

### 3.1 Primary Persona: Operations Manager
- **Role:** Creates and manages Company, TPA, and Insurer profiles
- **Goals:** 
    - Quickly onboard new companies with minimal manual data entry
    - Standardize data import process across all entities
    - Reduce errors in data transformation
- **Pain Points:**
    - Each client provides data in different formats
    - Manual reformatting is time-consuming and error-prone
    - No easy way to reuse transformation logic

### 3.2 Secondary Persona: Insurance Service Executive
- **Role:** Manages employee enrollment, policy, endorsement, and claims data uploads
- **Goals:**
    - Efficiently process large volumes of client data
    - Ensure data consistency across multiple uploads
    - Save time on repetitive data transformation tasks
- **Pain Points:**
    - Different clients use different column names and formats
    - Date and amount formats vary across sources
    - Need to manually verify data after transformation

---

## 4. Feature Requirements

### 4.1 File Upload & Validation

#### FR-4.1.1: File Format Support
- The system shall accept only .xlsx file format
- The system shall reject files with unsupported formats and display an appropriate error message

#### FR-4.1.2: Column Header Extraction
- The system shall read and extract column headers from the first row of the uploaded Excel file
- The system shall display all extracted column headers in the "Source" (left) panel

#### FR-4.1.3: File Size Validation
- The system shall validate that uploaded files do not exceed 10MB in size
- The system shall reject files exceeding the size limit
- The system shall display error message "File size exceeds maximum limit of 10MB" when validation fails

---

### 4.2 Visual Mapping Interface

#### FR-4.2.1: Split-Screen Layout
- The system shall display a split-screen interface with two panels:
    - **Left Panel (Source):** Displays columns from the uploaded client file
    - **Right Panel (Target):** Displays system-required columns for the selected entity type

#### FR-4.2.2: Entity Type Selection
- The system shall allow users to select the entity type before mapping:
    - Employee Enrollment
    - Policy Inception
    - Endorsement
    - Claims
    - Company Master Data
    - TPA Master Data
    - Insurer Master Data
- The system shall load the corresponding target column set based on selection

#### FR-4.2.3: File Direction Selection
- The system shall allow users to select file direction:
    - **Inbound:** Client file → System format (for data import)
    - **Outbound:** System format → Client file (for data export/email)
- For inbound templates:
    - Source columns = Client file columns
    - Target columns = System columns
- For outbound templates:
    - Source columns = System columns
    - Target columns = Client custom columns
- The system shall store the file direction in the template configuration

#### FR-4.2.4: Drag-and-Drop Mapping
- The system shall allow users to drag a target cell and drop at the source cell.
- The system shall visually indicate the mapping with a connecting line or indicator
- The system shall support one-to-one mapping only (one source column maps to one target column)
- The system shall prevent multiple source columns from mapping to the same target column

#### FR-4.2.5: Unmapped Columns
- The system shall allow source columns to remain unmapped
- Unmapped source columns shall be ignored during transformation
- The system shall visually differentiate mapped vs. unmapped columns

#### FR-4.2.6: Clear Mapping
- The system shall provide an option to clear individual mappings
- The system shall provide an option to clear all mappings at once

#### FR-4.2.7: Entity Type Change Confirmation
- When a user changes entity type after mappings have been created, the system shall prompt for confirmation
- The confirmation message shall be: "Changing entity type will clear current mappings. Continue?"
- Upon user confirmation, the system shall clear all existing mappings and transformation rules
- Upon user confirmation, the system shall reload target columns for the newly selected entity type
- If user cancels, the system shall retain current entity type and mappings

#### FR-4.2.8: Mapping Progress Indicator
- The system shall display a mapping count indicator showing "X of Y columns mapped"
- The count shall update in real-time as mappings are created or removed
- X represents the number of target columns that have been mapped
- Y represents the total number of target columns available

#### FR-4.2.9: Unmapped Column Warning
- When source columns remain unmapped, the system shall display a message
- The message shall indicate: "N source columns will be ignored during transformation"
- N represents the count of unmapped source columns

---

### 4.3 Transformation Rules

#### FR-4.3.1: Date Format Transformation
- For date columns, the system shall provide options to specify:
    - **Source Format:** DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY, etc.
    - **Target Format:** System's expected date format (YYYY-MM-DD)
- The system shall validate and transform dates according to the specified rules

#### FR-4.3.2: Gender Code Transformation
- For gender columns, the system shall provide options to specify:
    - **Source Format:** Male/Female, M/F, 1/2, etc.
    - **Target Format:** System's expected gender codes (e.g., M/F or 1/0)
- The system shall map and transform gender values according to the specified rules

#### FR-4.3.3: Amount Format Transformation
- For amount/numeric columns, the system shall provide options to specify:
    - **Source Format:** 1,000.00, 1.000,00, 1000, etc.
    - **Decimal Separator:** Comma or Period
    - **Thousand Separator:** Comma, Period, or None
    - **Target Format:** System's expected numeric format
- The system shall parse and transform amounts according to the specified rules

---

### 4.4 Mapping Templates

#### FR-4.4.1: Save Mapping Template
- The system shall allow users to save the current mapping configuration as a template
- The system shall require a unique template name
- The system shall store the following in the template:
    - Entity type
    - Column mappings (source to target)
    - Transformation rules for each mapped column
    - Template name and description

#### FR-4.4.2: Load Mapping Template
- The system shall allow users to load a previously saved mapping template
- The system shall filter templates by entity type
- The system shall apply all stored mappings and transformation rules when a template is loaded

#### FR-4.4.3: Template Reusability
- The system shall allow the same template to be used across multiple:
    - Companies
    - TPAs
    - Insurers
- The system shall associate templates with entity types, not specific entity instances

#### FR-4.4.4: Edit and Delete Templates
- The system shall allow users to edit existing templates
- The system shall allow users to delete templates
- The system shall prompt for confirmation before deletion

#### FR-4.4.5: Template Versioning
- The system shall maintain version history for each template
- When a user edits and saves an existing template:
    - The system shall create a new version with incremented version number
    - The previous version shall be retained for audit and rollback purposes
- The system shall display version information:
    - Version number (e.g., v1.0, v1.1, v2.0)
    - Created/Modified date
    - Modified by (user)
    - Change description (optional)
- Users shall be able to:
    - View version history for a template
    - Compare versions (column mappings and rules)
    - Restore a previous version
    - Set a specific version as "Active"
- Only the "Active" version shall be used for automatic transformations
- The system shall retain all versions indefinitely for audit purposes

#### FR-4.4.6: Template Export/Import
- The system shall allow users to export templates for sharing across environments
- Export format: JSON file containing:
    - Template name and description
    - Entity type and file direction
    - Column mappings
    - Transformation rules
    - Version information
    - Metadata (created by, created date)
- The system shall provide an "Export Template" option:
    - Export single template
    - Export multiple templates in bulk
    - Export all templates for an entity type
- The system shall provide an "Import Template" option:
    - Upload exported JSON file
    - Validate template structure and compatibility
    - Check for naming conflicts
    - Allow user to rename template during import if conflict exists
- Import validation rules:
    - Ensure entity type exists in target environment
    - Verify transformation rule compatibility
    - Check for required system columns
- The system shall log all import/export operations for audit

---

### 4.5 Mapping Preview

#### FR-4.5.1: Preview Transformed Data
- After mapping is complete, the system shall provide a "Preview" option
- The system shall display:
    - Source column name → Target column name
    - Sample source data (first 5-10 rows)
    - Transformed target data
    - Any transformation errors or warnings

#### FR-4.5.2: Validation Messages
- The system shall highlight any validation errors in the preview (e.g., invalid date format)
- The system shall display clear error messages for each validation failure
- The system shall allow users to go back and modify mappings/rules if errors are found

#### FR-4.5.3: Error Report Export
- When preview contains multiple validation errors, the system shall provide an "Export Error Report" option
- The error report shall be downloadable in a readable format (.xlsx or .csv)
- The error report shall include:
    - Row number with error
    - Column name
    - Source value
    - Error description
    - Expected format
- The error report filename shall follow the pattern: `transformation_errors_YYYYMMDD_HHMMSS.xlsx`

---

### 4.6 Backend Transformation

#### FR-4.6.1: Transformation During Upload
- When users upload files in Inception/Endorsement/Claims modules, the system shall:
    - Check if a mapping template exists for the entity
    - Apply the saved mapping and transformation rules
    - Transform the uploaded file in the backend
    - Proceed with standard upload validation and processing

#### FR-4.6.2: Transformation Logging
- The system shall log all transformation operations
- The system shall capture:
    - Template used
    - Number of rows processed
    - Number of successful transformations
    - Number of failed transformations with reasons
    - Timestamp and user details

#### FR-4.6.3: No Template Found Handling
- When a user uploads a file in entity-specific modules without an existing template:
    - The system shall display informational message: "No transformation template found. File will be processed as-is."
    - The system shall proceed with standard upload validation
    - The system shall suggest creating a template for future uploads
- When transformation errors occur during backend upload:
    - The system shall provide a downloadable error report with failed row details
    - The system shall display error summary: "X rows uploaded, Y rows failed transformation"


---

## 5. User Interface Requirements

### 5.1 Mapping Screen Layout

#### UI-5.1.1: Page Structure
- **Header:**
    - Page title: "Excel Transformation Utility"
    - Entity type selector (dropdown)
    - File direction selector (radio buttons: Inbound/Outbound)
    - "Upload File" button
    - "Load Template" button
    - "Save Template" button
    - "Export Template" button
    - "Import Template" button
- **Main Content:**
    - Split-screen with draggable column panels
    - Left: Source columns
    - Right: Target columns
- **Footer:**
    - "Clear All" button
    - "Preview" button
    - "Cancel" button

#### UI-5.1.2: Column Display
- Each column shall display:
    - Column name
    - Data type indicator (text, number, date)
    - Sample data (first value)
    - Mapping status (mapped/unmapped)

#### UI-5.1.4: Mapping Count Indicator
- The interface shall display a mapping progress indicator
- The indicator shall show "X of Y columns mapped" format
- The indicator shall be prominently displayed in the header or main content area
- The count shall update dynamically as mappings change

#### UI-5.1.5: Unmapped Columns Message
- When unmapped source columns exist, the interface shall display a warning message
- The message shall indicate: "N source columns will be ignored during transformation"
- The message shall be color-coded (e.g., yellow/orange) to indicate informational warning

#### UI-5.1.3: Mapping Indicator
- Mapped columns shall show:
    - Visual connector (line or arrow) between source and target
    - Transformation rule icon (if any rules applied)
    - "Edit Rules" button

#### UI-5.1.6: Entity Type Change Confirmation Dialog
- When user changes entity type after mappings exist, display confirmation dialog
- Dialog title: "Confirm Entity Type Change"
- Dialog message: "Changing entity type will clear current mappings. Continue?"
- Dialog buttons: "Continue" and "Cancel"
- Dialog shall be modal and require user response

---

### 5.2 Preview Screen

#### UI-5.2.1: Preview Layout
- Display preview in tabular format with columns:
    - Source Column Name
    - Target Column Name
    - Sample Source Data (5-10 rows)
    - Transformed Data
    - Status (Success/Error)
- Error rows shall be highlighted in red
- Success rows shall have neutral or green indication

#### UI-5.2.2: Error Summary Panel
- Display error summary at the top of preview
- Show total count: "X errors found in Y rows"
- Show error breakdown by type (date errors, gender errors, amount errors, etc.)
- Provide "Export Error Report" button when errors exist

#### UI-5.2.3: Error Report Export
- "Export Error Report" button shall be enabled only when errors exist
- Button shall download a detailed error report file
- File format: .xlsx or .csv
- Filename pattern: `transformation_errors_YYYYMMDD_HHMMSS.xlsx`

---

### 5.3 Template Management Screen

#### UI-5.3.1: Template List
- Display all saved templates in a table:
    - Template Name
    - Entity Type
    - File Direction (Inbound/Outbound)
    - Version (Active version number)
    - Created Date
    - Modified Date
    - Actions (Load, Edit, Delete, View History, Export)
- Filter options:
    - Entity Type
    - File Direction
    - Created Date Range

#### UI-5.3.2: Template Save Dialog
- Template name input (required)
- Template description (optional)
- Entity type (auto-filled based on current selection)
- File direction (auto-filled based on current selection)
- Version change description (optional, for edit operations)
- "Save" and "Cancel" buttons

#### UI-5.3.3: Template Version History Dialog
- Display version history in a table:
    - Version Number
    - Modified Date
    - Modified By
    - Change Description
    - Status (Active/Archived)
    - Actions (View Details, Compare, Restore, Set as Active)
- "Close" button

#### UI-5.3.4: Template Export Dialog
- Select templates to export (multi-select checkbox list)
- Export format: JSON
- "Export" and "Cancel" buttons
- Download exported file with naming convention: `templates_export_YYYYMMDD_HHMMSS.json`

#### UI-5.3.5: Template Import Dialog
- File upload field (accepts .json files only)
- After upload, display preview of templates to be imported:
    - Template Name
    - Entity Type
    - File Direction
    - Conflict Status (New/Overwrite/Rename Required)
    - Rename field (if conflict exists)
- "Import" and "Cancel" buttons
- Import summary after successful import

---

## 6. Business Rules

### BR-6.1: Mapping Rules
- **BR-6.1.1:** One source column can map to only one target column
- **BR-6.1.2:** One target column can receive mapping from only one source column
- **BR-6.1.3:** Source columns can remain unmapped (ignored during transformation)
- **BR-6.1.4:** Target columns can remain unmapped (will be empty in transformed data)

### BR-6.2: Template Rules
- **BR-6.2.1:** Template names must be unique within the system
- **BR-6.2.2:** Templates are entity-type-specific and file-direction-specific
- **BR-6.2.3:** Templates can be reused across multiple entity instances
- **BR-6.2.4:** Only users with "Create Company/TPA/Insurer" permission can create/edit templates
- **BR-6.2.5:** Only one version of a template can be marked as "Active" at a time
- **BR-6.2.6:** Deleting a template shall archive all versions (soft delete), not permanently remove
- **BR-6.2.7:** Template versioning is automatic; users cannot manually create versions
- **BR-6.2.8:** Template names cannot contain special characters except underscore (_) and space
- **BR-6.2.9:** When attempting to save a template with invalid characters, the system shall suggest valid name format

### BR-6.3: Transformation Rules
- **BR-6.3.1:** Date transformation rules are mandatory for date columns
- **BR-6.3.2:** Invalid date transformations shall be flagged as errors
- **BR-6.3.3:** Gender transformation rules are mandatory for gender columns
- **BR-6.3.4:** Amount transformation rules are mandatory for numeric/amount columns

### BR-6.4: File Processing Rules
- **BR-6.4.1:** Only .xlsx files are accepted
- **BR-6.4.2:** File size must not exceed 10MB
- **BR-6.4.3:** First row of Excel file is always treated as header row
- **BR-6.4.4:** Empty columns in source file are ignored

### BR-6.5: File Direction Rules
- **BR-6.5.1:** Inbound templates are used for importing client data into the system
- **BR-6.5.2:** Outbound templates are used for exporting system data to client format
- **BR-6.5.3:** Outbound templates allow custom column names for client-specific reporting
- **BR-6.5.4:** The same entity type can have multiple templates for different file directions

### BR-6.6: Transformation Log Retention Rules
- **BR-6.6.1:** All transformation logs shall be retained indefinitely
- **BR-6.6.2:** Logs shall not be automatically purged or archived
- **BR-6.6.3:** Logs shall be available for audit and troubleshooting at any time

### BR-6.7: Session Management Rules
- **BR-6.7.1:** When network failure occurs during template save, the system shall retain mappings in browser session
- **BR-6.7.2:** Users shall be allowed to retry saving after network failure recovery
- **BR-6.7.3:** The system shall not create partial template records during save failures

### BR-6.8: Concurrent Editing Rules
- **BR-6.8.1:** When multiple users edit the same template concurrently, the system shall detect version conflicts
- **BR-6.8.2:** Only the first user's save shall succeed
- **BR-6.8.3:** Subsequent users shall be prompted to reload the template before making changes
- **BR-6.8.4:** The system shall prevent overwriting changes made by another user

### BR-6.9: Empty Column Handling Rules
- **BR-6.9.1:** Empty columns in uploaded Excel files shall be automatically ignored
- **BR-6.9.2:** Only non-empty columns shall be available for mapping
- **BR-6.9.3:** The mapping interface shall indicate how many columns are available versus total columns in file

---

## 10. User Workflows

### 10.1 Workflow: Create New Mapping Template

**Steps:**
1. User navigates to "Excel Transformation Utility" from iWork
2. User selects entity type (e.g., "Company", "Insurer", "TPA")
3. Select inbound or outbound file type
4. User clicks "Upload File" and selects a client-provided .xlsx file
5. System extracts and displays source columns in the left panel
6. System displays target columns for entity type in the right panel
7. User drags each target column to the corresponding souce column (Assume once you header then it will be transposed into rows to drag & Drop)
8. For date columns, user clicks "Edit Rules" and specifies source/target date format
9. For gender columns, user specifies source/target gender codes
10. For amount columns, user specifies decimal and thousand separators
11. User clicks "Preview" to see sample transformed data
12. System displays preview with of transformed column headers
13. User verifies transformation and clicks "Save Template"
14. User enters template name (e.g., "ABC Corp Employee Format")
15. System saves the template and displays success message

**Expected Outcome:**
- Template is saved and available for reuse
- User can apply this template to future uploads from the same client

---

### 10.2 Workflow: Reuse Existing Template

**Steps:**
1. User navigates to "Excel Transformation Utility"
2. User selects entity type (e.g., "Company", "Insurer", "TPA")
3. User clicks "Load Template"
4. System displays a list of available templates for "Company"
5. User selects "ABC Corp Employee Format" template
6. System loads all saved mappings and transformation rules
7. User clicks "Upload File" and selects a new file from the same client
8. System applies the template and displays preview
9. User verifies and proceeds with upload in the respective module

**Expected Outcome:**
- Mapping is reused without manual configuration
- File is transformed automatically during upload

---

### 10.3 Workflow: Transform During Endorsement Upload

**Steps:**
1. User navigates to "Endorsement" module
2. User selects a policy and clicks "Upload Endorsement Data"
3. User uploads a client-provided .xlsx file
4. System checks if a transformation template exists for this entity
5. System applies the template and transforms the file in the backend
6. System validates the transformed data
7. System proceeds with standard endorsement data processing
8. User receives confirmation of successful upload

**Expected Outcome:**
- File is automatically transformed using the saved template
- No manual intervention required for data formatting

---

### 10.4 Workflow: Export Template for UAT/Production

**Steps:**
1. User navigates to "Excel Transformation Utility"
2. User clicks "Template Management" or "View Templates"
3. User selects one or more templates to export (checkboxes)
4. User clicks "Export Selected" button
5. System generates a JSON file containing all selected templates with their configurations
6. System downloads the file: `templates_export_20260106_143022.json`
7. User shares this file with DevOps or admin team for deployment to UAT/Production

**Expected Outcome:**
- Templates are exported in a portable JSON format
- Templates can be imported into other environments without data loss

---

### 10.5 Workflow: Import Template in New Environment

**Steps:**
1. User (Admin) navigates to "Excel Transformation Utility" in UAT/Production environment
2. User clicks "Import Template" button
3. User uploads the exported JSON file from Dev environment
4. System validates the file structure and displays import preview:
    - Template: "ABC Corp Employee Format"
    - Entity: Company - Inbound
    - Status: New (no conflict)
5. User reviews and clicks "Import"
6. System imports the template and creates version 1.0
7. System displays success message with imported template count
8. Template is now available for use in the new environment

**Expected Outcome:**
- Templates are successfully migrated across environments
- No manual reconfiguration required

---

### 10.6 Workflow: Edit Template and Create New Version

**Steps:**
1. User navigates to "Template Management"
2. User selects "ABC Corp Employee Format" template
3. User clicks "Edit" button
4. System loads the template with existing mappings
5. User modifies a date format rule from DD/MM/YYYY to DD-MM-YYYY
6. User clicks "Save Template"
7. System prompts: "Save as new version? Enter change description (optional)"
8. User enters: "Updated date format to use dashes instead of slashes"
9. System creates version 2.0 and sets it as Active
10. System displays success message: "Template updated to version 2.0"

**Expected Outcome:**
- Version 1.0 is retained for audit/rollback
- Version 2.0 is now active and used for future transformations
- Version history is maintained

---

### 10.7 Workflow: Restore Previous Template Version

**Steps:**
1. User discovers that version 2.0 of "ABC Corp Employee Format" has an issue
2. User navigates to "Template Management"
3. User selects the template and clicks "View History"
4. System displays version history:
    - v2.0 (Active) - Modified 06/01/2026 - "Updated date format"
    - v1.0 (Archived) - Created 05/01/2026 - "Initial template"
5. User selects v1.0 and clicks "Restore"
6. System prompts: "Set version 1.0 as Active? Version 2.0 will be archived."
7. User confirms
8. System sets v1.0 as Active and archives v2.0
9. Future transformations now use v1.0 configuration

**Expected Outcome:**
- Previous working version is restored without data loss
- Issue with v2.0 is mitigated immediately
- v2.0 remains in history for future reference

---

### 10.8 Workflow: Outbound File Generation for Client Reporting

**Steps:**
1. System processes policy inception data
2. System needs to send enrollment confirmation file to client in their format
3. System checks for outbound template: "ABC Corp Enrollment Confirmation"
4. System applies the outbound template:
    - Maps system columns (Employee_ID, First_Name, DOB) → Client columns (EMP CODE, EMPLOYEE NAME, BIRTH DATE)
    - Applies transformation rules (date format, gender codes)
5. System generates .xlsx file in client's format
6. System sends email to client with attached transformed file

**Expected Outcome:**
- Client receives data in their preferred format automatically
- No manual file reformatting required

---

## 11. User Stories (Gherkin Format)

### Feature: File Upload and Column Extraction

#### Scenario 1: Upload Valid Excel File
**Given** I am an Operations Manager on the Excel Transformation Utility page  
**And** I have selected entity type as "Company"  
**And** I have selected file direction as "Inbound"  
**When** I click "Upload File" and select a valid .xlsx file  
**Then** the system should extract column headers from the first row  
**And** the system should display all source columns in the left panel  
**And** the system should display target system columns in the right panel

#### Scenario 2: Reject Invalid File Format
**Given** I am on the Excel Transformation Utility page  
**And** I have selected entity type as "Employee Enrollment"  
**When** I attempt to upload a .csv file  
**Then** the system should reject the file  
**And** the system should display error message "Only .xlsx file format is supported"  
**But** the mapping interface should not be displayed

#### Scenario 3: Reject Oversized File
**Given** I am on the Excel Transformation Utility page  
**When** I attempt to upload a .xlsx file larger than 10MB  
**Then** the system should reject the file  
**And** the system should display error message "File size exceeds maximum limit of 10MB"

---

### Feature: Entity Type and File Direction Selection

#### Scenario 4: Select Entity Type for Inbound Mapping
**Given** I am on the Excel Transformation Utility page  
**When** I select "Policy Inception" from the entity type dropdown  
**And** I select "Inbound" as file direction  
**Then** the system should load system-defined target columns for Policy Inception  
**And** the source panel should be ready to display client file columns  
**And** the mapping interface should indicate "Client → System" direction

#### Scenario 5: Select Entity Type for Outbound Mapping
**Given** I am on the Excel Transformation Utility page  
**When** I select "Claims" from the entity type dropdown  
**And** I select "Outbound" as file direction  
**Then** the system should load system columns as source  
**And** the target panel should allow custom column name definition  
**And** the mapping interface should indicate "System → Client" direction

#### Scenario 6: Change Entity Type After File Upload
**Given** I have uploaded a file for "Company" entity  
**And** column mappings are displayed  
**When** I change entity type to "TPA"  
**Then** the system should prompt "Changing entity type will clear current mappings. Continue?"  
**And** upon confirmation, the system should clear all existing mappings  
**And** the system should reload target columns for "TPA"

---

### Feature: Drag-and-Drop Column Mapping

#### Scenario 7: Map Single Column Successfully
**Given** I have uploaded a client file with columns displayed  
**And** the target panel shows system columns  
**When** I drag target column "Employee ID" and drop it on source column "EMP_CODE"  
**Then** the system should create a visual mapping indicator between the columns  
**And** both columns should be marked as "Mapped"  
**And** the mapping should be stored in the current session

#### Scenario 8: Map Multiple Columns
**Given** I have uploaded a client file  
**When** I drag target column "First Name" to source column "FNAME"  
**And** I drag target column "Last Name" to source column "LNAME"  
**And** I drag target column "Date of Birth" to source column "DOB"  
**Then** all three mappings should be visually indicated  
**And** all mapped columns should show "Mapped" status  
**And** the mapping count should display "3 of 15 columns mapped"

#### Scenario 9: Prevent Duplicate Target Mapping
**Given** I have mapped target column "Employee ID" to source column "EMP_CODE"  
**When** I attempt to drag target column "Employee ID" to another source column "EMPLOYEE_NO"  
**Then** the system should display error message "Target column already mapped to EMP_CODE"  
**And** the system should prevent the duplicate mapping  
**But** the original mapping should remain intact

#### Scenario 10: Allow Unmapped Source Columns
**Given** I have a client file with 20 source columns  
**And** the system has 15 target columns  
**When** I map only 12 target columns  
**And** I leave 8 source columns unmapped  
**Then** the system should allow me to proceed  
**And** unmapped source columns should be visually differentiated (grayed out)  
**And** the system should display message "8 source columns will be ignored during transformation"

---

### Feature: Transformation Rules Configuration

#### Scenario 11: Configure Date Format Transformation
**Given** I have mapped target column "Date of Birth" to source column "DOB"  
**And** the source column contains dates in DD/MM/YYYY format  
**When** I click "Edit Rules" for the "Date of Birth" mapping  
**And** I select source format as "DD/MM/YYYY"  
**And** I select target format as "YYYY-MM-DD"  
**Then** the system should save the date transformation rule  
**And** the mapping should show a transformation icon  
**And** the preview should display transformed dates in YYYY-MM-DD format

#### Scenario 12: Configure Gender Code Transformation
**Given** I have mapped target column "Gender" to source column "SEX"  
**And** the source column contains values "Male"/"Female"  
**When** I click "Edit Rules" for the "Gender" mapping  
**And** I configure mapping: "Male" → "M", "Female" → "F"  
**Then** the system should save the gender transformation rule  
**And** the preview should display transformed gender codes as M/F

#### Scenario 13: Configure Amount Format Transformation
**Given** I have mapped target column "Premium Amount" to source column "PREMIUM"  
**And** the source column contains amounts in format "1,000.00"  
**When** I click "Edit Rules" for the "Premium Amount" mapping  
**And** I set decimal separator as "Period"  
**And** I set thousand separator as "Comma"  
**And** I set target format as system numeric format  
**Then** the system should save the amount transformation rule  
**And** the preview should display correctly parsed numeric values

#### Scenario 14: Mandatory Transformation Rule for Date Column
**Given** I have mapped a target date column to a source column  
**And** I have not configured any date transformation rule  
**When** I attempt to save the template or preview  
**Then** the system should display error "Date transformation rule is mandatory for date columns"  
**And** the system should prevent saving until rule is configured

---

### Feature: Mapping Preview

#### Scenario 16: Preview with Transformation Errors
**Given** I have mapped date columns with transformation rules  
**And** the source file contains invalid date values in row 5  
**When** I click "Preview" button  
**Then** the system should display the preview  
**And** row 5 should be highlighted in red  
**And** the system should display error message "Invalid date format in row 5: '32/13/2025'"  
**And** the error count should show "1 error found"  
**But** I should be able to go back and modify mappings

#### Scenario 17: Preview with Multiple Validation Errors
**Given** I have completed mappings with transformation rules  
**And** the source file has 3 rows with invalid dates and 2 rows with invalid gender codes  
**When** I click "Preview" button  
**Then** the system should display all 5 errors with row numbers  
**And** each error should show the specific validation failure  
**And** the system should display summary "5 errors found in 100 rows"  
**And** I should be able to export error report

---

### Feature: Template Management - Save and Load

#### Scenario 18: Save New Mapping Template
**Given** I have completed all column mappings and transformation rules  
**And** the preview shows no errors  
**When** I click "Save Template" button  
**And** I enter template name as "ABC Corp Employee Format"  
**And** I enter description as "Standard employee enrollment format for ABC Corp"  
**And** I click "Save"  
**Then** the system should save the template with version 1.0  
**And** the system should display success message "Template saved successfully"  
**And** the template should appear in the template list

#### Scenario 19: Prevent Duplicate Template Names
**Given** a template named "ABC Corp Employee Format" already exists for "Company - Inbound"  
**When** I attempt to save a new template with the same name, entity type, and file direction  
**Then** the system should display error "Template name already exists for this entity type and file direction"  
**And** the system should prompt me to enter a different name  
**But** the system should allow the same name for different entity types or file directions

#### Scenario 20: Load Existing Template
**Given** I am on the Excel Transformation Utility page  
**And** I have selected entity type as "Company" and direction as "Inbound"  
**When** I click "Load Template" button  
**And** I select "ABC Corp Employee Format" from the template list  
**Then** the system should load all saved column mappings  
**And** the system should load all transformation rules  
**And** the system should display the active version number  
**And** all mapped columns should show visual indicators

#### Scenario 21: Load Template and Upload File
**Given** I have loaded template "ABC Corp Employee Format"  
**And** the template shows pre-configured mappings  
**When** I upload a new client file with matching column structure  
**Then** the system should automatically apply the template mappings  
**And** the system should display preview with transformed data  
**And** I should be able to proceed without manual mapping

---

### Feature: Template Versioning

#### Scenario 22: Edit Template and Create New Version
**Given** I have loaded template "ABC Corp Employee Format" version 1.0  
**And** the template is currently active  
**When** I modify the date format rule from "DD/MM/YYYY" to "DD-MM-YYYY"  
**And** I click "Save Template"  
**And** I enter change description as "Updated date format to use dashes"  
**Then** the system should create version 2.0 automatically  
**And** version 2.0 should be set as active  
**And** version 1.0 should be archived  
**And** both versions should be retained in version history

#### Scenario 23: View Template Version History
**Given** template "ABC Corp Employee Format" has multiple versions  
**When** I select the template from the list  
**And** I click "View History" button  
**Then** the system should display version history table showing:
    - Version Number (2.0, 1.0)
    - Modified Date
    - Modified By
    - Change Description
    - Status (Active/Archived)
**And** I should see version 2.0 marked as "Active"

#### Scenario 24: Restore Previous Template Version
**Given** template "ABC Corp Employee Format" has version 2.0 as active  
**And** I discover that version 2.0 has issues  
**When** I open version history  
**And** I select version 1.0  
**And** I click "Restore" button  
**And** I confirm the restoration  
**Then** the system should set version 1.0 as active  
**And** version 2.0 should be archived  
**And** all future transformations should use version 1.0 configuration  
**And** the system should display confirmation "Version 1.0 restored successfully"

#### Scenario 25: Compare Template Versions
**Given** template "ABC Corp Employee Format" has versions 1.0 and 2.0  
**When** I open version history  
**And** I select versions 1.0 and 2.0 for comparison  
**And** I click "Compare" button  
**Then** the system should display side-by-side comparison showing:
    - Changed mappings (highlighted)
    - Modified transformation rules
    - Added/removed columns
**And** differences should be clearly marked

---

### Feature: Backend Transformation During Upload

#### Scenario 31: Automatic Transformation for Inception Upload
**Given** I have saved template "ABC Corp Employee Format" for "Policy Inception - Inbound"  
**And** the template is active  
**When** I navigate to Policy Inception module  
**And** I select a policy and click "Upload Enrollment Data"  
**And** I upload a client file in ABC Corp format  
**Then** the system should automatically detect the template  
**And** the system should apply mappings and transformation rules in the backend  
**And** the system should transform the file before processing  
**And** I should receive confirmation "100 rows transformed and uploaded successfully"

#### Scenario 32: Upload Without Template
**Given** no template exists for "Endorsement - Inbound" for a specific client  
**When** I navigate to Endorsement module  
**And** I attempt to upload a client file  
**Then** the system should display message "No transformation template found. File will be processed as-is."  
**And** the system should proceed with standard upload validation  
**But** the system should suggest creating a template for future uploads

#### Scenario 33: Transformation Error During Backend Upload
**Given** I upload an endorsement file using an active template  
**And** the file has 5 rows with invalid date formats  
**When** the system applies transformation in the backend  
**Then** the system should log the transformation errors  
**And** the system should process 95 valid rows successfully  
**And** the system should display error summary "95 rows uploaded, 5 rows failed transformation"  
**And** the system should provide downloadable error report with failed row details

---

### Feature: Outbound File Generation

#### Scenario 34: Generate Outbound File for Client Reporting
**Given** a template "ABC Corp Enrollment Confirmation - Outbound" exists  
**And** the template maps system columns to client custom column names  
**When** the system processes policy inception for ABC Corp  
**And** the system triggers enrollment confirmation email  
**Then** the system should apply the outbound template  
**And** the system should transform system data to client format  
**And** the system should generate .xlsx file with client column names  
**And** the system should attach the file to the email sent to client

#### Scenario 35: Outbound Transformation with Custom Columns
**Given** an outbound template maps:
    - "employee_id" → "EMP CODE"
    - "first_name" → "EMPLOYEE NAME"
    - "date_of_birth" → "BIRTH DATE"
**When** the system generates outbound file  
**Then** the generated Excel file should have columns named "EMP CODE", "EMPLOYEE NAME", "BIRTH DATE"  
**And** the data should be transformed according to configured rules  
**And** the file should be in client's preferred format

---

### Feature: Clear Mappings

#### Scenario 36: Clear Individual Mapping
**Given** I have mapped 5 columns  
**When** I click the "X" icon on the mapping indicator for "Employee ID"  
**Then** the system should remove only that specific mapping  
**And** the "Employee ID" columns should return to "Unmapped" status  
**But** the other 4 mappings should remain intact

#### Scenario 37: Clear All Mappings
**Given** I have completed mappings for 15 columns  
**And** I have configured transformation rules  
**When** I click "Clear All" button  
**And** I confirm the action  
**Then** the system should remove all column mappings  
**And** the system should remove all transformation rules  
**And** all columns should return to "Unmapped" status  
**But** the uploaded file should remain loaded

---

### Feature: Template Access Control

#### Scenario 41: Authorized User Creates Template
**Given** I am logged in as Operations Manager  
**And** I have "Create Company/TPA/Insurer" permission  
**When** I complete mappings and click "Save Template"  
**Then** the system should allow me to save the template  
**And** the template should be created successfully

#### Scenario 42: Unauthorized User Cannot Create Template
**Given** I am logged in as Insurance Service Executive  
**And** I do NOT have "Create Company/TPA/Insurer" permission  
**When** I navigate to Excel Transformation Utility  
**Then** the "Save Template" button should be disabled or hidden  
**And** the system should display message "You do not have permission to create templates"  
**But** I should be able to use existing templates for uploads

#### Scenario 43: Authorized User Deletes Template
**Given** I am logged in with template management permissions  
**And** template "Old Client Format" exists  
**When** I select the template and click "Delete"  
**And** I confirm the deletion  
**Then** the system should soft-delete (archive) the template  
**And** the template should no longer appear in active template list  
**But** all versions should be retained for audit  
**And** transformation logs should retain reference to deleted template

---

### Feature: Edge Cases and Error Handling

#### Scenario 47: Upload File with Empty Columns
**Given** I upload a .xlsx file  
**And** columns 3, 5, and 8 are completely empty  
**When** the system extracts columns  
**Then** the system should ignore empty columns  
**And** the system should display only non-empty columns  
**And** the mapping interface should show "15 of 18 columns available for mapping"

#### Scenario 48: Template Name with Special Characters
**Given** I attempt to save a template  
**When** I enter template name as "ABC Corp - Employee@2024 #Format"  
**Then** the system should display error "Template name cannot contain special characters: @ # - except underscore and space"  
**And** the system should suggest valid name format

#### Scenario 49: Network Failure During Template Save
**Given** I have completed all mappings  
**When** I click "Save Template"  
**And** a network failure occurs during save  
**Then** the system should display error "Network error. Template not saved."  
**And** the system should retain my mappings in the browser session  
**And** the system should allow me to retry saving  
**But** the system should not create a partial template record

#### Scenario 50: Concurrent Template Edit by Multiple Users
**Given** User A is editing template "ABC Corp Employee Format"  
**And** User B also opens the same template for editing  
**When** User A saves changes and creates version 2.0  
**And** User B attempts to save changes  
**Then** the system should detect version conflict  
**And** the system should display message to User B "Template was modified by another user. Please reload and retry."  
**And** the system should prevent overwriting User A's changes

---

**Total User Stories:** 38 scenarios covering all PRD features

---

## 12. Acceptance Criteria

### 12.1 Functional Acceptance
- [ ] User can upload .xlsx file and view source columns
- [ ] User can upload only files under 10MB size limit
- [ ] User can select entity type and view target columns
- [ ] User can select file direction (Inbound/Outbound)
- [ ] User can drag-and-drop to map source to target columns
- [ ] User receives confirmation prompt when changing entity type after creating mappings
- [ ] User can see mapping progress count (X of Y columns mapped)
- [ ] User can see warning message for unmapped source columns
- [ ] User can configure transformation rules for date, gender, and amount columns
- [ ] User can preview transformed template before saving
- [ ] User can export error report when preview contains validation errors
- [ ] User can save mapping as a reusable template
- [ ] User can load and reuse existing templates
- [ ] User can edit templates and create new versions automatically
- [ ] User can view template version history
- [ ] User can restore previous template versions
- [ ] User can export templates as JSON files
- [ ] User can import templates from JSON files
- [ ] System automatically transforms files during Inception/Endorsement/Claims upload using active template version
- [ ] System displays informational message when no template is found during upload
- [ ] System generates outbound files in client format using outbound templates
- [ ] System logs all transformation operations indefinitely
- [ ] System handles transformation errors gracefully
- [ ] System retains mappings in browser session during network failures
- [ ] System prevents concurrent editing conflicts
- [ ] System ignores empty columns in uploaded files
- [ ] System validates template names for special characters

### 12.2 Non-Functional Acceptance
- [ ] Interface is responsive and provides visual feedback
- [ ] Error messages are clear and actionable
- [ ] Only authorized users can create/edit templates

---

**Document Status:** Draft  
**Next Review Date:** TBD  
**Approvals Required:** Product Manager, Tech Lead, Business Stakeholder
