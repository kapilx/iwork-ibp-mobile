# PRD - Phase 1

## 1. Objective

Provide TPA E-cards to employees through the employee portal for easy access and download. TPAs provide pre-generated E-cards for all policy members which brokers/HR administrators bulk upload through the policy configurator. Each policy has one designated TPA that provides E-cards for all employees and dependents under that policy. Employees can then view and download their specific E-cards through member-wise navigation. The solution reduces administrative overhead for E-card distribution and improves employee access to insurance documentation by providing 24/7 self-service access.

## 2. In Scope

- Large-scale bulk upload of TPA-provided E-cards (PDF files) for thousands of employees and dependents through policy configurator
- Support for multiple upload formats and methods optimized for large volumes:
  - Single large ZIP archive (up to 2GB) containing thousands of PDF E-cards
  - Multiple batch ZIP files processed sequentially (500-1000 E-cards per batch)
  - Folder upload with automatic organization and extraction
  - Excel mapping file integration for employee/member association
  - Flexible file naming conventions and organization structures
  - Cloud storage integration for direct import from TPA shared folders
- Background processing with progress tracking, email notifications, and resume capability
- Policy-to-TPA association (each policy has one TPA)
- Automated employee/dependent identification and mapping during upload process
- Display E-cards to employees in employee portal per member navigation
- PDF download functionality for E-cards (original TPA-provided PDF files)
- TPA-provided E-card format with standard member details (UHID, Name, Age, Employee ID, TPA details, Instructions, TPA address, Terms and conditions)
- Member-to-E-card mapping and association validation with bulk error handling
- Upload status tracking, progress monitoring, and comprehensive reporting
- E-card access control ensuring employees see only their own and dependents' cards
- File validation, virus scanning, and secure storage for large datasets

## 3. User Personas & Contexts

### Broker/HR Administrator
- **Goals:** Efficiently bulk upload TPA-provided E-cards for entire policy with thousands of employees and ensure all can access their cards
- **Context:** Receives large volumes of E-card files from TPA (often 5000+ employees with 10,000+ total E-cards including dependents), needs reliable bulk upload with progress tracking and error handling
- **Pain Points:** Manual distribution impossible for large populations, system timeouts during large uploads, difficulty tracking progress and errors in massive datasets, employees calling when cards are missing

### Policy Administrator
- **Goals:** Ensure all policy members have their TPA E-cards properly uploaded and accessible
- **Context:** Managing policy setup and ensuring TPA-provided documentation is available to all enrolled members
- **Pain Points:** Tracking upload status for large employee populations, identifying unmapped or failed E-cards, ensuring data accuracy between TPA files and system records

### Employee
- **Goals:** Access and download their family members' E-cards quickly and easily
- **Context:** Need E-card for hospital visits, claims, or verification purposes
- **Pain Points:** Cannot access E-cards outside office hours, need to contact HR for copies, difficulty finding E-cards for dependents

## 5. User Flow

### TPA E-card File Organization (Before Upload)
**Recommended File Structure from TPA:**
```
Policy_ABC123_Ecards/
├── Employees/
│   ├── EMP001_John_Smith_Self.pdf
│   ├── EMP002_Jane_Doe_Self.pdf
│   └── ...
├── Spouses/
│   ├── EMP001_Mary_Smith_Spouse.pdf
│   ├── EMP002_Bob_Doe_Spouse.pdf
│   └── ...
├── Children/
│   ├── EMP001_Tom_Smith_Child1.pdf
│   ├── EMP001_Lisa_Smith_Child2.pdf
│   └── ...
└── Mapping_File.xlsx
```

**Alternative Flat Structure:**
```
All_Ecards/
├── EMP001_Self.pdf
├── EMP001_Spouse.pdf
├── EMP001_Child1.pdf
├── EMP002_Self.pdf
└── Ecard_Mapping.xlsx
```

### Broker/HR Administrator Flow - Large-Scale TPA E-card Bulk Upload
1. **Receive Files from TPA:**
   - TPA provides files via secure FTP, cloud drive, or physical media
   - Files organized in ZIP archives or folder structures
   - Includes Excel mapping file with employee associations

2. **Prepare Files for Upload:**
   - **Option A:** Use TPA-provided ZIP archive (up to 2GB)
   - **Option B:** Create your own ZIP from organized folders
   - **Option C:** Upload folders directly if system supports folder upload
   - Verify Excel mapping file format matches system requirements

3. **System Login and Navigation:**
   - Login to system and navigate to Policy Configurator
   - Select specific policy for E-card upload
   - Access E-card Management section for selected policy

4. **Choose Upload Method:**
   - **Method 1 - Single Large ZIP (Recommended for 1000+ E-cards):**
     * Upload ZIP archive (up to 2GB) containing all PDFs
     * Include Excel mapping file in ZIP or upload separately
     * System extracts and processes all files automatically
   
   - **Method 2 - Multiple Batch ZIP Files:**
     * Split large dataset into smaller ZIP files (500-1000 E-cards each)
     * Upload batches sequentially with progress tracking
     * Useful when single ZIP exceeds size limits
   
   - **Method 3 - Cloud Integration (Future Enhancement):**
     * Connect to TPA's cloud storage (Google Drive, Dropbox, etc.)
     * Direct import from shared folders
     * Automated sync for updated E-cards

5. **System Processing:**
   - System initiates background processing for large uploads
   - Upload progress bar with estimated completion time
   - Email notification when processing begins
   - Chunked processing (e.g., 500 E-cards per batch)
6. System automatically attempts to map E-cards to employees/dependents using:
   - Employee ID from PDF filename (e.g., "EMP001_Self.pdf", "EMP001_Spouse.pdf", "EMP001_Child1.pdf")
   - UHID matching extracted from PDF content
   - Name matching with employee records
   - Excel mapping file data (if provided) with columns: Employee_ID, Member_Type, PDF_Filename
7. Receive progress notifications during processing:
   - Batch completion notifications (every 500-1000 E-cards)
   - Real-time dashboard showing mapped vs unmapped counts
   - Intermediate success/error reports
8. Review comprehensive mapping results:
   - Successfully mapped E-cards (bulk view with filtering)
   - Unmapped E-cards requiring manual intervention (sortable/searchable)
   - Duplicate or conflicting mappings with resolution options
9. Bulk resolve mapping issues:
   - Filter unmapped E-cards by common patterns
   - Bulk assign E-cards using pattern matching
   - Export unmapped list for offline resolution
10. Confirm final upload and mapping for all E-cards
11. Receive final completion notification with comprehensive upload report
12. Access detailed summary dashboard showing total uploaded, mapped, errors, and policy coverage statistics

### Employee Flow - E-card Access and Download
1. Login to Employee Portal
2. Navigate to My Insurance section
3. Select E-cards from available options
4. View available members (self, spouse, children) with E-card indicators
5. Select specific member to view their E-card
6. Preview E-card with all TPA-provided details
7. Click download button to get PDF copy
8. Save or print downloaded E-card file

## 4. Functional Requirements

- **FR-1:** Multi-Method Large-Scale Upload - Support multiple upload methods including single large ZIP (up to 2GB), multiple batch ZIPs, folder upload, and cloud integration with automatic file extraction and organization
- **FR-2:** File Organization and Validation - Accept various file organization structures from TPAs, validate file formats, and handle naming conventions with flexible mapping rules
- **FR-3:** Background Processing and Progress Tracking - Process large uploads in background with real-time progress tracking, email notifications, and resume capability for failed uploads
- **FR-4:** Policy-TPA Association - Link uploaded E-cards to specific policy and its designated TPA, ensuring all cards under a policy belong to the same TPA
- **FR-5:** Automated Employee/Dependent Mapping - Automatically match thousands of uploaded E-card files using employee ID, UHID, name matching, and Excel mapping files with batch processing
- **FR-6:** Bulk Error Handling and Resolution - Provide bulk tools for resolving mapping errors including pattern matching, filtering, and bulk assignment capabilities
- **FR-7:** Member-Specific E-card Display - Display E-cards organized by member (employee, spouse, children) in employee portal with efficient loading for large datasets
- **FR-8:** Scalable PDF Storage and Retrieval - Store thousands of E-card files securely with efficient retrieval and caching for employee access
- **FR-9:** Comprehensive Upload Reporting - Provide detailed reports showing successful uploads, failed mappings, unmatched E-cards, and policy coverage statistics
- **FR-10:** Access Control and Authentication - Restrict E-card access to authenticated employees for their own enrolled members only with efficient permission checking

## 6. User Stories

### Broker/HR Administrator
- **US-1:** As a Broker/HR Administrator, I want to bulk upload thousands of TPA-provided E-cards for an entire policy, so that all employees and dependents can access their insurance cards efficiently
  - **Given** I have received thousands of PDF E-card files from the TPA for a specific policy (e.g., 5000 employees + 8000 dependents = 13,000 E-cards)
  - **When** I navigate to policy configurator and select the policy
  - **Then** I can access large-scale E-card bulk upload functionality supporting ZIP archives up to 2GB
  - **Given** I upload a large ZIP archive containing thousands of PDF E-cards
  - **When** the system initiates background processing
  - **Then** I receive progress notifications and can monitor upload status in real-time
  - **Given** the background processing completes
  - **When** I review the mapping results
  - **Then** I can see comprehensive statistics with successfully mapped PDFs, unmapped E-cards, and bulk resolution tools

- **US-2:** As a Broker/HR Administrator, I want to resolve mapping issues for unmapped E-cards, so that all employees have access to their cards
  - **Given** some E-cards could not be automatically mapped
  - **When** I access the unmapped E-cards list
  - **Then** I can manually search and select the correct employee/dependent for each card
  - **Given** I manually map an E-card
  - **When** I save the mapping
  - **Then** the E-card becomes immediately available to the employee in their portal
  - **Given** all E-cards are mapped
  - **When** I view the final upload summary
  - **Then** I can see total counts and status for the entire policy upload

- **US-3:** As a Broker/HR Administrator, I want to track upload status and manage existing E-cards, so that I can ensure all policy members have current cards
  - **Given** E-cards are already uploaded for a policy
  - **When** I access E-card management for that policy
  - **Then** I can view all uploaded E-cards organized by employee with status indicators
  - **Given** I need to update an E-card (new TPA version)
  - **When** I select an existing E-card and upload a replacement
  - **Then** the new version immediately replaces the old one for that employee

### Policy Administrator
- **US-4:** As a Policy Administrator, I want to ensure TPA E-cards are properly associated with policies, so that employees access the correct TPA cards for their coverage
  - **Given** I am setting up a policy
  - **When** I configure the TPA association
  - **Then** all E-cards uploaded for this policy are linked to the designated TPA
  - **Given** E-cards are uploaded
  - **When** I verify the policy setup
  - **Then** I can confirm all members have their TPA-provided E-cards available

### Employee
- **US-5:** As an Employee, I want to view my TPA E-cards and my dependents' E-cards, so that I can access insurance information when needed
  - **Given** I log into the employee portal
  - **When** I navigate to my insurance section
  - **Then** I can see E-cards for myself and all my covered dependents under my policy
  - **Given** TPA E-cards are available for my policy
  - **When** I select a member (self, spouse, child)
  - **Then** I can view their TPA-provided E-card with all relevant details
  - **Given** I view an E-card
  - **When** I check the information
  - **Then** it includes TPA-provided details like UHID, name, age, employee ID, TPA contact information, instructions, and terms

- **US-6:** As an Employee, I want to download my E-cards as PDF, so that I can use them offline or print them
  - **Given** I am viewing a TPA E-card
  - **When** I click download
  - **Then** the original TPA PDF is downloaded with all formatting preserved
  - **Given** I download an E-card PDF
  - **When** I open it
  - **Then** it maintains the original TPA formatting, branding, and all member details
  - **Given** I download multiple E-cards for different members
  - **When** I save them
  - **Then** each file has a clear naming convention indicating the member type and TPA