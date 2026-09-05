# Test Scenarios - Policy Benefits/Coverage Management

**Module:** Policy Benefits/Coverage Management  
**JIRA ID:** TBD  
**Version:** 1.0  
**Date:** November 21, 2025  
**Status:** Draft  
**Based On:** Policy-Feature.md PRD - Phase 1

---

## Table of Contents

1. [Test Scenario Overview](#test-scenario-overview)
2. [Admin Portal - Document Upload Scenarios](#admin-portal-document-upload-scenarios)
3. [Admin Portal - Document Management Scenarios](#admin-portal-document-management-scenarios)
4. [Employee Portal - Document Access Scenarios](#employee-portal-document-access-scenarios)
5. [Employee Portal - Tab Navigation Scenarios](#employee-portal-tab-navigation-scenarios)
6. [Integration and Real-time Scenarios](#integration-and-real-time-scenarios)
7. [Test Data Requirements](#test-data-requirements)
8. [Scenario Summary and Metrics](#scenario-summary-and-metrics)

---

## Test Scenario Overview

This document contains comprehensive test scenarios for the Policy Benefits/Coverage Management feature. The scenarios cover:

- **Admin Portal:** Document upload, replacement, validation, and history management
- **Employee Portal:** Document access via tabs, multi-policy navigation, and document viewing
- **Integration:** Real-time document availability and data synchronization
- **Edge Cases:** File validation, UI state management, and error handling

**Total Scenarios:** 18  
**Priority Distribution:**
- High Priority: 12 scenarios
- Medium Priority: 6 scenarios

**Test Coverage:**
- Functional Testing
- Negative Testing
- UI/UX Testing
- Integration Testing
- Security Testing

---

## Admin Portal - Document Upload Scenarios

### TS-001: First-Time Policy Document Upload

**Scenario ID:** TS-001  
**Module:** Portal Configuration  
**Feature:** Policy Document Upload  
**Priority:** High  
**Test Type:** Functional  
**User Role:** Admin

**Scenario Description:**  
Admin logs into IIRM portal, navigates to Policy Details > Portal Configuration, and uploads a PDF policy features document for the first time for a specific policy.

**Test Objective:**  
Validate that admin can successfully upload a policy features document through Portal Configuration and the document becomes immediately available to employees.

**Preconditions:**
1. Admin has valid IIRM portal credentials
2. Policy Details screen is configured
3. Portal Configuration section is accessible
4. No document previously uploaded for this policy

**Test Steps:**
1. Login to IIRM portal
2. Navigate to specific Policy Details screen
3. Click "Portal Configuration" tab
4. Locate "Upload Policy Features" card
5. Verify card shows status "Not Uploaded"
6. Click "Upload File" CTA
7. Select valid PDF file (< 25 MB) from file browser
8. Click Upload button
9. Wait for upload completion
10. Verify success message and card updates

**Expected Results:**
- Upload Policy Features card displays with "Not Uploaded" status
- Card description shows: "Upload policy features document for employees"
- Upload File CTA is visible and enabled
- View CTA is disabled
- File upload modal opens with format indicator "PDF only" and size limit "Max 25 MB"
- System validates file format and size
- Success message displays: "Policy features document uploaded successfully"
- Card status changes to "Document Uploaded"
- Last Uploaded field shows current date and time
- Uploader Name field shows admin's name
- Upload File CTA changes to Replace Document CTA
- View CTA becomes enabled
- Card description is hidden
- Document is immediately accessible to enrolled employees

**Test Data Requirements:**
- Valid PDF file < 25 MB (e.g., Policy_Features_v1.pdf - 5 MB)
- Admin credentials (admin@country1.com / Admin@123)
- Policy ID (e.g., POL-12345)

**Expected Test Cases:** 5  
**Estimated Effort:** 2 hours  
**Risk Level:** Medium  
**Dependencies:** IIRM portal login, Policy Details screen

---

### TS-002: File Format and Size Validation

**Scenario ID:** TS-002  
**Module:** Portal Configuration  
**Feature:** Policy Document Upload  
**Priority:** High  
**Test Type:** Negative Testing  
**User Role:** Admin

**Scenario Description:**  
Admin attempts to upload various file types and sizes to validate that the system enforces file validation rules (PDF only, max 25 MB).

**Test Objective:**  
Verify that system correctly enforces file format restrictions (PDF only) and size restrictions (max 25 MB) during upload, displaying appropriate error messages for invalid files.

**Preconditions:**
1. Admin logged into IIRM portal
2. Portal Configuration screen accessible
3. Upload Policy Features card visible
4. Test files available:
   - Valid PDF < 25 MB
   - PDF file > 25 MB
   - DOCX file
   - DOC file
   - Image files (JPG, PNG)
   - Corrupted PDF file

**Test Steps:**
1. Navigate to Upload Policy Features card
2. Click "Upload File" CTA
3. Test Case 1: Attempt to upload PDF file > 25 MB
4. Test Case 2: Attempt to upload DOCX file
5. Test Case 3: Attempt to upload DOC file
6. Test Case 4: Attempt to upload JPG/PNG file
7. Test Case 5: Upload PDF file at exactly 25 MB (boundary test)
8. Test Case 6: Attempt to upload corrupted PDF file
9. Verify appropriate error messages for each invalid attempt
10. Verify successful upload for valid PDF ≤ 25 MB

**Expected Results:**

**For PDF > 25 MB:**
- Upload rejected
- Error message: "File size exceeds 25 MB limit. Please reduce the file size and try again."
- Upload modal remains open
- No document saved

**For DOCX/DOC files:**
- Upload rejected
- Error message: "Only PDF files are supported. Please convert your document to PDF format and try again."
- Upload modal remains open
- No document saved

**For Image files (JPG/PNG):**
- Upload rejected
- Same error message as DOCX/DOC
- No document saved

**For PDF at exactly 25 MB (boundary):**
- Upload successful
- Success message displayed
- Card updates correctly

**For Corrupted PDF:**
- Upload rejected
- Error message: "Invalid PDF file" or "File appears to be corrupted"
- No document saved

**Test Data Requirements:**
- Large_Policy.pdf (30 MB)
- Policy_Features.docx (2 MB)
- Policy_Features.doc (1.5 MB)
- policy_image.jpg (2 MB)
- policy_image.png (3 MB)
- Policy_25MB.pdf (exactly 25.00 MB)
- corrupted_policy.pdf (corrupted file)

**Expected Test Cases:** 6  
**Estimated Effort:** 2 hours  
**Risk Level:** High  
**Dependencies:** File upload functionality, File validation logic

---

### TS-003: Policy Document Replacement Workflow

**Scenario ID:** TS-003  
**Module:** Portal Configuration  
**Feature:** Policy Document Replacement  
**Priority:** High  
**Test Type:** Functional  
**User Role:** Admin

**Scenario Description:**  
Admin replaces an existing policy features document with a new version, confirming that the previous document moves to upload history and the new document becomes immediately available.

**Test Objective:**  
Validate complete document replacement workflow including confirmation message display, history tracking, immediate availability to employees, and proper UI state transitions.

**Preconditions:**
1. Admin has valid credentials
2. Policy already has an uploaded document
3. Replace Document CTA is visible on card
4. Upload history functionality is available

**Test Steps:**
1. Navigate to Portal Configuration
2. Locate Upload Policy Features card
3. Verify card shows "Document Uploaded" status
4. Verify "Replace Document" CTA is visible
5. Click "Replace Document" CTA
6. Review confirmation message
7. Test Case 1: Click Cancel and verify no changes
8. Click "Replace Document" again
9. Click Continue/Proceed on confirmation
10. Select new PDF file
11. Click Upload
12. Verify success message and card updates
13. Open Upload History
14. Verify old document is marked as "Replaced"
15. Verify new document is marked as "Active"
16. Login as employee and verify new document is visible

**Expected Results:**
- Replace Document CTA visible when document exists
- Clicking Replace Document shows confirmation modal
- Confirmation message: "Replacing this document will make the new version available to all employees. The current document will be moved to upload history. Do you want to continue?"
- Modal has Cancel and Continue/Proceed buttons
- Clicking Cancel closes modal without changes
- Clicking Continue opens file upload dialog
- After successful upload:
  - Success message: "Policy features document replaced successfully"
  - Card timestamp updates to current date/time
  - Uploader Name updates to current admin
  - Status remains "Document Uploaded"
  - Replace Document CTA still visible
  - View CTA remains enabled
- Upload history shows:
  - Previous document with status "Replaced"
  - New document with status "Active"
  - Replacement timestamp
  - Correct uploader names
- Employees immediately see new document (no cache)

**Test Data Requirements:**
- Original document: Policy_Features_v1.pdf (5 MB)
- Replacement document: Policy_Features_v2.pdf (7 MB)
- Policy ID: POL-12345
- Admin credentials
- Employee credentials for verification

**Expected Test Cases:** 4  
**Estimated Effort:** 2 hours  
**Risk Level:** Medium  
**Dependencies:** Existing document upload, Upload history functionality, Real-time sync

---

## Admin Portal - Document Management Scenarios

### TS-004: Upload History Management

**Scenario ID:** TS-004  
**Module:** Portal Configuration  
**Feature:** Upload History Management  
**Priority:** Medium  
**Test Type:** Functional  
**User Role:** Admin

**Scenario Description:**  
Admin views upload history showing all previously uploaded/replaced documents with ability to download historical versions.

**Test Objective:**  
Verify that upload history correctly displays all document versions with complete metadata (filename, uploader, timestamp, status) in reverse chronological order and allows downloads of historical versions.

**Preconditions:**
1. Admin logged in
2. At least one document uploaded for policy
3. Ideally, document has been replaced 2-3 times
4. Document viewer is accessible

**Test Steps:**
1. Navigate to Portal Configuration
2. Click "View" CTA on Upload Policy Features card
3. Document viewer opens
4. Click "Upload History" CTA
5. Verify upload history panel displays
6. Review table structure and columns
7. Verify all historical documents are listed
8. Check chronological order (newest first)
9. Verify only one document marked as "Active"
10. Click Download on a historical document
11. Verify download completes with original filename
12. Close upload history panel

**Expected Results:**
- Upload History panel opens as overlay/modal
- Table displays with columns:
  - Document Name
  - Uploaded By
  - Timestamp
  - Actions
- All previously uploaded documents are listed
- Documents displayed in reverse chronological order (newest first)
- Only one document has status "Active"
- Other documents have status "Replaced"
- Each row shows:
  - Original filename
  - Name of admin who uploaded
  - Upload date and time
  - Download action button
- Clicking Download downloads the historical document
- Downloaded file retains original filename
- Close button closes the panel
- History is policy-specific (only shows documents for current policy)

**Test Data Requirements:**
- Multiple document versions:
  - Policy_Features_v1.pdf (uploaded 3 days ago, replaced)
  - Policy_Features_v2.pdf (uploaded 2 days ago, replaced)
  - Policy_Features_v3.pdf (uploaded today, active)
- Multiple admin uploader names

**Expected Test Cases:** 5  
**Estimated Effort:** 1.5 hours  
**Risk Level:** Low  
**Dependencies:** Document upload, Document replacement, Upload history storage

---

### TS-005: Admin Document Viewer Functionality

**Scenario ID:** TS-005  
**Module:** Portal Configuration  
**Feature:** Document Viewer - Admin  
**Priority:** Medium  
**Test Type:** Functional  
**User Role:** Admin

**Scenario Description:**  
Admin uses "View" CTA to open document viewer, views the uploaded PDF, downloads the document, and accesses upload history.

**Test Objective:**  
Validate that admin document viewer provides all necessary functionality including PDF display, download capability, and upload history access.

**Preconditions:**
1. Admin logged in
2. Document uploaded for policy
3. "View" CTA is enabled
4. Browser supports PDF viewing

**Test Steps:**
1. Navigate to Portal Configuration
2. Locate Upload Policy Features card
3. Verify "View" CTA is enabled
4. Click "View" CTA
5. Verify document viewer opens
6. Review viewer elements (PDF display, Download button, Upload History button, Close button)
7. Navigate through PDF pages
8. Test zoom functionality (if available)
9. Click "Download" button
10. Verify download completes
11. Click "Upload History" button
12. Verify history panel opens
13. Close history panel
14. Click Close button
15. Verify return to Portal Configuration

**Expected Results:**
- View CTA enabled only when document exists
- Clicking View CTA opens document viewer
- Viewer displays:
  - PDF document content
  - "Download" CTA button
  - "Upload History" CTA button
  - Close button (X or labeled button)
- PDF displays correctly with proper rendering
- Page navigation works (if multi-page PDF)
- Zoom controls work (if available in viewer)
- Clicking Download downloads PDF with original filename
- Clicking Upload History opens history panel
- Clicking Close button returns to Portal Configuration
- No errors or console warnings

**Test Data Requirements:**
- Multi-page PDF document (e.g., 10 pages)
- Policy ID: POL-12345

**Expected Test Cases:** 4  
**Estimated Effort:** 1 hour  
**Risk Level:** Low  
**Dependencies:** Document upload, PDF viewer component, Browser PDF support

---

### TS-006: Upload Policy Features Card UI State Management

**Scenario ID:** TS-006  
**Module:** Portal Configuration  
**Feature:** Card UI Elements  
**Priority:** Medium  
**Test Type:** UI/Functional  
**User Role:** Admin

**Scenario Description:**  
Verify that the Upload Policy Features card displays correct UI elements, CTAs, status badges, and information based on whether a document exists or not.

**Test Objective:**  
Validate that UI elements on the card dynamically update based on document status, ensuring correct visibility and state of all components.

**Preconditions:**
1. Admin access to Portal Configuration
2. Ability to upload/delete documents for testing
3. Test policies available:
   - Policy with no document
   - Policy with uploaded document

**Test Steps:**
1. Navigate to policy with NO document
2. Verify card elements for "No Document" state
3. Upload a document
4. Verify card elements for "Document Uploaded" state
5. Verify all field values and CTA states
6. Test View CTA disabled/enabled states
7. Verify timestamp format
8. Verify uploader name display

**Expected Results:**

**When NO Document Exists:**
- Card title: "Policy Features" with icon
- Status field: "Not Uploaded"
- Last Uploaded field: "-" or empty
- Uploader Name field: "-" or empty
- Card description visible: "Upload policy features document for employees"
- "Upload File" CTA: Visible and enabled
- "Replace Document" CTA: NOT visible
- "View" CTA: Visible but DISABLED (grayed out)

**When Document EXISTS:**
- Card title: "Policy Features" with icon
- Status field: "Document Uploaded"
- Last Uploaded field: Shows date and time (e.g., "2025-11-21 10:30 AM")
- Uploader Name field: Shows admin's name (e.g., "John Admin")
- Card description: NOT visible/hidden
- "Upload File" CTA: NOT visible
- "Replace Document" CTA: Visible and enabled
- "View" CTA: Visible and ENABLED

**Timestamp Format:**
- Date format: YYYY-MM-DD or DD-MMM-YYYY
- Time format: HH:MM AM/PM or 24-hour format
- Consistent with system settings

**Test Data Requirements:**
- Policy without document: POL-00001
- Policy with document: POL-12345
- Admin user credentials

**Expected Test Cases:** 6  
**Estimated Effort:** 1.5 hours  
**Risk Level:** Low  
**Dependencies:** Portal Configuration UI, Document upload functionality

---

## Employee Portal - Document Access Scenarios

### TS-007: Employee Access via Documents Screen with Tabs

**Scenario ID:** TS-007  
**Module:** Employee Portal  
**Feature:** Policy Features Access via Tabs  
**Priority:** High  
**Test Type:** Functional  
**User Role:** Employee

**Scenario Description:**  
Employee clicks "Policy Features" button on dashboard and accesses the Documents screen with tabbed interface showing "Policy Feature" and "TPA Card" tabs.

**Test Objective:**  
Verify that clicking Policy Features button opens Documents screen with proper tab structure, default tab selection, and correct document display.

**Preconditions:**
1. Employee has valid portal credentials
2. Employee enrolled in at least one policy
3. Policy has uploaded document
4. "Policy Features" button visible on dashboard

**Test Steps:**
1. Login to employee portal
2. Navigate to dashboard
3. Locate "Policy Features" button
4. Click "Policy Features" button
5. Verify Documents screen opens
6. Review main tabs structure
7. Verify "Policy Feature" tab is selected by default
8. Verify document displays in viewer area
9. Click "TPA Card" tab
10. Verify tab switches and TPA card document loads
11. Click "Policy Feature" tab again
12. Verify policy feature document displays
13. Test Close icon (X)
14. Verify return to dashboard

**Expected Results:**
- "Policy Features" button prominently displayed on dashboard
- Clicking button opens Documents screen
- Documents screen displays main tabs horizontally:
  - "Policy Feature" tab
  - "TPA Card" tab
- "Policy Feature" tab is selected/active by default (since clicked from Policy Features button)
- Policy feature document displays in viewer area
- Viewer area shows:
  - PDF document with zoom and navigation controls
  - "Download" CTA button
  - Close icon (X) at top
- Clicking "TPA Card" tab:
  - Switches active tab
  - Loads TPA card document in viewer area
  - Same viewer controls available
- Clicking "Policy Feature" tab again:
  - Switches back to Policy Feature tab
  - Policy feature document displays
- Clicking Close icon (X):
  - Closes entire Documents screen
  - Returns to dashboard
- No errors or loading issues

**Test Data Requirements:**
- Employee credentials: emp@company.com / Emp@123
- Policy enrollment: POL-12345 (GMC)
- Uploaded documents:
  - Policy Feature document: GMC_Policy_Features.pdf
  - TPA Card document: GMC_TPA_Card.pdf

**Expected Test Cases:** 5  
**Estimated Effort:** 2 hours  
**Risk Level:** High  
**Dependencies:** Employee portal, Document upload, Tab navigation component

---

### TS-008: Single Policy Enrollment - Direct Document Access

**Scenario ID:** TS-008  
**Module:** Employee Portal  
**Feature:** Policy Features Access  
**Priority:** High  
**Test Type:** Functional  
**User Role:** Employee

**Scenario Description:**  
Employee with single policy enrollment clicks "Policy Features" button and directly accesses Documents screen with main tabs but no policy sub-tabs.

**Test Objective:**  
Verify that employee with one policy enrollment sees Documents screen with main tabs (Policy Feature, TPA Card) but no policy sub-tabs, with direct access to the policy's documents.

**Preconditions:**
1. Employee logged into employee portal
2. Employee enrolled in exactly ONE policy
3. Policy has uploaded Policy Feature document
4. Policy has uploaded TPA Card document
5. "Policy Features" button visible on dashboard

**Test Steps:**
1. Verify employee is enrolled in only one policy
2. Click "Policy Features" button on dashboard
3. Verify Documents screen opens
4. Check for absence of policy sub-tabs
5. Verify "Policy Feature" tab is selected by default
6. Verify policy feature document displays immediately
7. Switch to "TPA Card" tab
8. Verify TPA card document displays
9. Test zoom and navigation controls
10. Test Download functionality
11. Close Documents screen

**Expected Results:**
- Documents screen opens with main tabs:
  - "Policy Feature" (selected by default)
  - "TPA Card"
- NO policy sub-tabs displayed (since only one policy)
- Policy feature document displays directly in viewer area
- Viewer shows:
  - PDF document content
  - Zoom controls
  - Page navigation (if multi-page)
  - "Download" button
  - Close icon (X)
- Switching to "TPA Card" tab shows TPA card document
- Both documents load correctly without policy selection
- Download works for both document types
- Close icon closes entire Documents screen and returns to dashboard
- Smooth user experience without unnecessary selection steps

**Test Data Requirements:**
- Employee with single enrollment: emp_single@company.com / Emp@123
- Policy: POL-12345 (GMC)
- Documents:
  - GMC_Policy_Features.pdf (5 MB)
  - GMC_TPA_Card.pdf (2 MB)

**Expected Test Cases:** 4  
**Estimated Effort:** 1.5 hours  
**Risk Level:** Medium  
**Dependencies:** Employee portal, Single policy enrollment logic, Document viewer

---

## Employee Portal - Tab Navigation Scenarios

### TS-009: Multiple Policy Enrollments - Sub-tabs Navigation

**Scenario ID:** TS-009  
**Module:** Employee Portal  
**Feature:** Multi-Policy Tab Navigation  
**Priority:** High  
**Test Type:** Functional  
**User Role:** Employee

**Scenario Description:**  
Employee with multiple policy enrollments clicks "Policy Features" and navigates Documents screen with main tabs and policy sub-tabs to view different policy documents.

**Test Objective:**  
Validate that employee with multiple policies can navigate between policies using sub-tabs while maintaining main tab context, and access each policy's documents correctly.

**Preconditions:**
1. Employee logged in
2. Employee enrolled in 2+ policies (e.g., GMC, GTL, GPA)
3. At least one policy has uploaded documents
4. "Policy Features" button on dashboard

**Test Steps:**
1. Verify employee is enrolled in multiple policies
2. Click "Policy Features" button
3. Verify Documents screen opens with main tabs
4. Verify policy sub-tabs appear below main tabs
5. Review sub-tab labels (policy number and type)
6. Verify first policy sub-tab is selected by default
7. Verify first policy's feature document displays
8. Click on second policy sub-tab
9. Verify second policy's feature document displays
10. Click on third policy sub-tab
11. Switch to "TPA Card" main tab
12. Verify same policy sub-tabs appear for TPA cards
13. Verify correct TPA card displays for selected policy
14. Navigate between policy sub-tabs under TPA Card tab
15. Switch back to "Policy Feature" main tab
16. Verify last selected policy sub-tab is maintained or resets to first

**Expected Results:**
- Documents screen opens with main tabs:
  - "Policy Feature" (selected by default)
  - "TPA Card"
- Policy sub-tabs appear below main tabs showing:
  - "#12345 - GMC"
  - "#67890 - GTL"
  - "#11111 - GPA"
- First policy sub-tab ("#12345 - GMC") selected by default
- GMC policy feature document displays in viewer area
- Clicking "#67890 - GTL" sub-tab:
  - Switches active sub-tab
  - Loads GTL policy feature document
  - Maintains "Policy Feature" main tab selection
- Clicking "#11111 - GPA" sub-tab:
  - Switches active sub-tab
  - Loads GPA policy feature document
- Switching to "TPA Card" main tab:
  - Same policy sub-tabs appear
  - First policy sub-tab selected by default (or maintains last selection)
  - TPA card for selected policy displays
- Navigating policy sub-tabs under "TPA Card":
  - Each sub-tab shows corresponding policy's TPA card
  - Sub-tab navigation works smoothly
- Switching back to "Policy Feature" main tab:
  - Policy feature documents accessible again
  - Sub-tab selection maintained or reset logically
- If policy has no document:
  - Placeholder message: "Features document for this policy will be available soon"
- All transitions smooth without errors

**Test Data Requirements:**
- Employee with multiple enrollments: emp_multi@company.com / Emp@123
- Policies:
  - POL-12345 (GMC) - has documents
  - POL-67890 (GTL) - has documents
  - POL-11111 (GPA) - no documents
- Documents for each policy:
  - GMC: Policy_Features and TPA_Card
  - GTL: Policy_Features and TPA_Card
  - GPA: No documents

**Expected Test Cases:** 6  
**Estimated Effort:** 2.5 hours  
**Risk Level:** High  
**Dependencies:** Multiple policy enrollments, Sub-tab navigation component, Document mapping

---

### TS-010: Tab Navigation and Document Switching

**Scenario ID:** TS-010  
**Module:** Employee Portal  
**Feature:** Document Tab Navigation  
**Priority:** High  
**Test Type:** Functional  
**User Role:** Employee

**Scenario Description:**  
Employee navigates between main tabs (Policy Feature, TPA Card) and policy sub-tabs (if multiple enrollments) to view different documents without closing the Documents screen.

**Test Objective:**  
Verify seamless navigation between main tabs and policy sub-tabs with correct document loading and UI state management.

**Preconditions:**
1. Employee logged in
2. Employee enrolled in multiple policies
3. Documents uploaded for policies
4. Documents screen accessible

**Test Steps:**
1. Open Documents screen
2. Verify initial state (Policy Feature tab, first policy selected)
3. Navigate through all policy sub-tabs under Policy Feature
4. Switch to TPA Card main tab
5. Navigate through all policy sub-tabs under TPA Card
6. Rapidly switch between main tabs
7. Rapidly switch between policy sub-tabs
8. Test edge cases (policies with/without documents)
9. Verify no loading errors or UI glitches
10. Test browser back/forward buttons (if applicable)

**Expected Results:**
- Main tab switching:
  - Instant or smooth transition
  - Correct document type loads (Policy Feature vs TPA Card)
  - Policy sub-tabs persist across main tabs
  - No page reload required
- Policy sub-tab switching:
  - Instant or smooth transition
  - Correct policy document loads
  - Main tab selection maintained
  - No page reload required
- Rapid switching:
  - No UI glitches or errors
  - Documents load correctly
  - No memory leaks or performance degradation
- Policies without documents:
  - Placeholder message displays
  - No errors in console
  - Tab still accessible and functional
- Browser navigation:
  - Back button behavior defined (closes screen or navigates tabs)
  - Forward button behavior defined
  - No broken states
- All transitions smooth and responsive
- Viewer controls (zoom, download) remain functional after tab switches

**Test Data Requirements:**
- Employee with 3+ policies
- Mix of policies with and without documents
- Both Policy Feature and TPA Card documents available

**Expected Test Cases:** 5  
**Estimated Effort:** 2 hours  
**Risk Level:** Medium  
**Dependencies:** Tab navigation logic, Document loading mechanism

---

### TS-011: Placeholder Message for Missing Documents

**Scenario ID:** TS-011  
**Module:** Employee Portal  
**Feature:** Document Viewer - Employee  
**Priority:** Medium  
**Test Type:** Functional  
**User Role:** Employee

**Scenario Description:**  
Employee attempts to view policy documents when admin has not uploaded documents yet, and sees appropriate placeholder messages.

**Test Objective:**  
Validate that placeholder messages display correctly when documents are not available, providing clear communication to employees.

**Preconditions:**
1. Employee logged in
2. Employee enrolled in one or more policies
3. At least one policy has NO uploaded Policy Feature document
4. At least one policy has NO uploaded TPA Card document

**Test Steps:**
1. Click "Policy Features" button
2. Navigate to policy with no Policy Feature document
3. Verify placeholder message on Policy Feature tab
4. Switch to TPA Card tab
5. Verify placeholder message on TPA Card tab (if no TPA card)
6. If multiple policies, navigate to other policies
7. Verify placeholder messages for each missing document
8. Verify Download button state when no document
9. Test that placeholder doesn't block navigation
10. Verify placeholder disappears when document is uploaded (admin uploads during test)

**Expected Results:**
- When Policy Feature document not uploaded:
  - Viewer area displays placeholder message
  - Message text: "Features document for this policy will be available soon"
  - Message styled appropriately (centered, readable font)
  - Download button hidden or disabled
  - No error messages in console
- When TPA Card document not uploaded:
  - Viewer area displays placeholder message
  - Message text: "TPA card for this policy will be available soon" (or similar)
  - Same styling and behavior as Policy Feature placeholder
- Placeholder messages don't block:
  - Tab navigation (main tabs and sub-tabs)
  - Close icon functionality
  - Other UI interactions
- If admin uploads document during session:
  - Refreshing or re-opening Documents screen shows new document
  - Placeholder replaced with actual document
- Clear, user-friendly messaging
- Consistent placeholder design across all tabs

**Test Data Requirements:**
- Policy without Policy Feature document: POL-00001
- Policy without TPA Card document: POL-00002
- Policy with both documents: POL-12345
- Employee enrolled in all three policies

**Expected Test Cases:** 4  
**Estimated Effort:** 1.5 hours  
**Risk Level:** Low  
**Dependencies:** Document availability check, Placeholder UI component

---

### TS-012: Document Download Functionality

**Scenario ID:** TS-012  
**Module:** Employee Portal  
**Feature:** Document Download  
**Priority:** High  
**Test Type:** Functional  
**User Role:** Employee

**Scenario Description:**  
Employee views policy documents and downloads them using the Download button, verifying that files retain original filenames.

**Test Objective:**  
Validate that document download functionality works correctly for all document types across all policies, preserving original filenames without modification.

**Preconditions:**
1. Employee logged in
2. Documents uploaded for policies
3. Browser allows downloads
4. Sufficient storage space available

**Test Steps:**
1. Open Documents screen
2. View Policy Feature document
3. Click "Download" button
4. Verify download starts and completes
5. Check downloaded file location and filename
6. Verify file opens correctly
7. Switch to TPA Card tab
8. Click "Download" button
9. Verify TPA card downloads correctly
10. If multiple policies, repeat download for each policy's documents
11. Test download with special characters in filename (if applicable)
12. Test simultaneous downloads (if clicking download on multiple tabs quickly)

**Expected Results:**
- Download button visible on all document viewer screens
- Download button enabled when document exists
- Clicking Download button:
  - Initiates file download
  - Browser download dialog appears (or auto-download based on browser settings)
  - File downloads to default download location
- Downloaded filename:
  - Matches original filename uploaded by admin
  - No automatic renaming or appending
  - Special characters preserved (dash, underscore, dot allowed)
  - Format remains .pdf
- Downloaded file:
  - Opens correctly in PDF viewer
  - Content matches what's displayed in browser viewer
  - No corruption or data loss
  - File size matches original
- Multiple downloads:
  - Each policy's documents download correctly
  - Filenames distinguish between policies (as uploaded)
  - No overwrite conflicts unless same filename
- Download works across:
  - Both main tabs (Policy Feature, TPA Card)
  - All policy sub-tabs (if multiple enrollments)
  - Different browsers (Chrome, Firefox, Edge)
- No errors or console warnings during download

**Test Data Requirements:**
- Policies with documents having various filenames:
  - GMC_Policy_Features_2024.pdf
  - Policy-Features-v2.pdf
  - TPA_Card.pdf
  - GMC-TPA-Card_2024.pdf
- Multiple policies with documents
- Different browsers for testing

**Expected Test Cases:** 4  
**Estimated Effort:** 1.5 hours  
**Risk Level:** Low  
**Dependencies:** Document upload, Download functionality, Browser download API

---

## Integration and Real-time Scenarios

### TS-013: Real-time Document Availability After Upload

**Scenario ID:** TS-013  
**Module:** Integration  
**Feature:** Real-time Document Synchronization  
**Priority:** High  
**Test Type:** Integration  
**User Role:** Admin, Employee

**Scenario Description:**  
Admin uploads a policy document in IIRM portal and employee immediately sees the document in employee portal without logout/login or page refresh.

**Test Objective:**  
Verify that document upload by admin is immediately reflected in employee portal without cache issues or delays, ensuring real-time synchronization.

**Preconditions:**
1. Admin session in IIRM portal (Browser/Session 1)
2. Employee session in employee portal (Browser/Session 2)
3. Both sessions for same policy
4. Employee viewing Documents screen or dashboard

**Test Steps:**
1. Setup: Open admin portal in Browser 1
2. Setup: Open employee portal in Browser 2, login as enrolled employee
3. In employee portal, verify no document exists initially (placeholder message)
4. In admin portal, upload Policy Feature document
5. Wait for upload confirmation
6. In employee portal (WITHOUT refresh), check if document appears
7. If not immediate, refresh employee portal
8. Verify document now visible
9. Repeat test for document replacement:
   - Employee viewing Document A
   - Admin replaces with Document B
   - Verify employee sees Document B (with or without refresh)
10. Test with TPA Card document as well

**Expected Results:**

**Ideal Scenario (Real-time):**
- Admin uploads document
- Employee portal updates automatically
- Document appears without manual refresh
- WebSocket or polling mechanism enables real-time update

**Acceptable Scenario (Refresh Required):**
- Admin uploads document
- Employee portal doesn't auto-update (cache)
- After browser refresh, new document appears
- No logout/login required

**For Document Replacement:**
- Admin replaces Document A with Document B
- Employee viewing Document A
- After refresh or real-time update, Document B displays
- No stale cache issues

**Verification Points:**
- Document upload timestamp matches
- Correct document version displays
- No 404 errors or broken links
- Download functionality works immediately
- Upload history shows latest version

**Acceptable Delay:**
- If real-time: < 5 seconds
- If refresh required: Immediate after refresh
- No more than 1 minute delay under any circumstances

**Test Data Requirements:**
- Admin credentials
- Employee credentials
- Test policy: POL-12345
- Test documents:
  - Policy_Features_v1.pdf (for initial upload)
  - Policy_Features_v2.pdf (for replacement test)

**Expected Test Cases:** 3  
**Estimated Effort:** 2 hours  
**Risk Level:** Medium  
**Dependencies:** Document upload, Real-time sync mechanism, Cache management

---

### TS-014: Concurrent Admin and Employee Sessions

**Scenario ID:** TS-014  
**Module:** Integration  
**Feature:** Concurrent User Access  
**Priority:** Medium  
**Test Type:** Integration  
**User Role:** Admin, Employee

**Scenario Description:**  
Multiple admins and employees access the system concurrently while documents are being uploaded, replaced, and viewed.

**Test Objective:**  
Validate system stability and data consistency when multiple users perform operations simultaneously.

**Preconditions:**
1. Multiple admin accounts available
2. Multiple employee accounts available
3. Test environment supports concurrent sessions
4. Policies configured for testing

**Test Steps:**
1. Admin 1: Upload document for Policy A
2. Admin 2: Upload document for Policy B (simultaneously)
3. Employee 1: Access Policy A document
4. Employee 2: Access Policy B document
5. Admin 1: Replace Policy A document while Employee 1 is viewing it
6. Verify Employee 1 sees updated document (with refresh if needed)
7. Admin 2: View upload history while Admin 1 is uploading
8. Multiple employees access same policy document simultaneously
9. Test download functionality with concurrent users
10. Monitor for any locking issues or errors

**Expected Results:**
- Multiple admin uploads succeed without conflicts
- Each policy maintains its own document independently
- Employees can view documents concurrently without issues
- Document replacement doesn't cause errors for viewing employees
- Upload history displays correctly for each admin
- No data corruption or race conditions
- No database locking issues
- System remains responsive
- Download works for all concurrent users
- Proper transaction handling ensures data consistency

**Test Data Requirements:**
- 2-3 admin accounts
- 3-5 employee accounts
- Multiple test policies
- Test documents of varying sizes

**Expected Test Cases:** 5  
**Estimated Effort:** 3 hours  
**Risk Level:** High  
**Dependencies:** Multi-user support, Database transactions, Concurrency control

---

### TS-015: Cross-Browser Compatibility

**Scenario ID:** TS-015  
**Module:** UI/UX  
**Feature:** Browser Compatibility  
**Priority:** Medium  
**Test Type:** Compatibility Testing  
**User Role:** Admin, Employee

**Scenario Description:**  
Test all functionality across different browsers (Chrome, Firefox, Edge, Safari) to ensure consistent behavior and UI rendering.

**Test Objective:**  
Verify that the Policy Features functionality works consistently across all major browsers with no UI/UX degradation.

**Preconditions:**
1. Access to multiple browsers:
   - Google Chrome (latest version)
   - Mozilla Firefox (latest version)
   - Microsoft Edge (latest version)
   - Safari (latest version, if Mac available)
2. Test user accounts available
3. Test documents available

**Test Steps:**
1. Repeat key test scenarios in each browser:
   - Document upload (Admin)
   - Document viewing (Employee)
   - Tab navigation
   - Document download
   - Upload history access
2. Verify UI rendering consistency
3. Test PDF viewer functionality
4. Check responsive design (if applicable)
5. Verify no browser-specific errors
6. Test file upload dialogs
7. Check download behavior per browser
8. Verify JavaScript functionality

**Expected Results:**

**All Browsers Should Support:**
- Document upload with drag-drop or file selector
- PDF document viewing (native or plugin)
- Tab navigation and switching
- Document download
- UI elements render correctly
- No layout breakage
- Consistent color schemes
- Proper font rendering
- Modal/dialog functionality

**Known Browser Differences (Acceptable):**
- PDF viewer appearance (native vs plugin)
- File download dialog style
- Date/time picker formats
- File selection dialog appearance

**Not Acceptable:**
- Functionality completely broken
- Major UI layout issues
- JavaScript errors preventing operations
- Inability to upload/download files
- Tabs not working

**Test Data Requirements:**
- Same test users and policies across all browsers
- Various document sizes and formats

**Expected Test Cases:** 8  
**Estimated Effort:** 4 hours  
**Risk Level:** Medium  
**Dependencies:** Browser support, PDF rendering libraries

---

### TS-016: Performance Testing - Large File Upload

**Scenario ID:** TS-016  
**Module:** Performance  
**Feature:** Document Upload Performance  
**Priority:** Medium  
**Test Type:** Performance Testing  
**User Role:** Admin

**Scenario Description:**  
Test system performance and stability when uploading documents at or near the 25 MB size limit.

**Test Objective:**  
Verify that system handles large file uploads efficiently without timeouts, errors, or performance degradation.

**Preconditions:**
1. Admin logged in
2. Test files available:
   - 10 MB PDF
   - 15 MB PDF
   - 20 MB PDF
   - 25 MB PDF (exactly at limit)
3. Stable network connection
4. Server resources monitored

**Test Steps:**
1. Upload 10 MB PDF, measure upload time
2. Upload 15 MB PDF, measure upload time
3. Upload 20 MB PDF, measure upload time
4. Upload 25 MB PDF, measure upload time
5. Monitor:
   - Upload progress indication
   - Server response time
   - Browser memory usage
   - Network latency
6. Verify successful upload for all file sizes
7. Test employee viewing large documents
8. Test download speed for large documents
9. Repeat upload of 25 MB file 5 times
10. Check for any performance degradation

**Expected Results:**
- All uploads complete successfully (no timeouts)
- Upload times scale reasonably with file size
- Progress indication works during upload
- No browser crashes or freezes
- Server handles large uploads without errors
- Reasonable upload times:
  - 10 MB: < 30 seconds (on average connection)
  - 15 MB: < 45 seconds
  - 20 MB: < 60 seconds
  - 25 MB: < 90 seconds
  - (Times depend on network speed)
- Employee can view large documents without issues
- PDF viewer renders large documents properly
- Download works efficiently for large files
- No memory leaks after multiple uploads
- System remains responsive

**Performance Benchmarks:**
- Upload success rate: 100%
- Maximum acceptable upload time: 2 minutes for 25 MB
- PDF viewer load time: < 5 seconds for any document size
- Download speed: As fast as network allows
- Browser memory increase: < 100 MB during operation

**Test Data Requirements:**
- PDF files at various sizes (10, 15, 20, 25 MB)
- Network monitoring tools
- Performance profiling tools

**Expected Test Cases:** 6  
**Estimated Effort:** 3 hours  
**Risk Level:** Medium  
**Dependencies:** File upload mechanism, Server configuration, Network bandwidth

---

## Test Data Requirements

### Admin Portal Test Data

**Admin User Accounts:**
```
Admin Country A:
- Username: admin_countryA@company.com
- Password: Admin@123
- Country: Country A
- Permissions: Upload documents, Manage policies

Admin Country B:
- Username: admin_countryB@company.com
- Password: Admin@123
- Country: Country B
- Permissions: Upload documents, Manage policies
```

**Test Policies:**
```
Policy A (Country A):
- Policy ID: POL-A001
- Policy Type: GMC
- Policy Name: ABC Company GMC 2024
- Status: Active

Policy B (Country A):
- Policy ID: POL-A002
- Policy Type: GTL
- Policy Name: ABC Company GTL 2024
- Status: Active

Policy C (Country B):
- Policy ID: POL-B001
- Policy Type: GMC
- Policy Name: XYZ Company GMC 2024
- Status: Active
```

**Test Documents for Upload:**
```
Valid Documents:
1. Policy_Features_v1.pdf (5 MB)
2. Policy_Features_v2.pdf (7 MB)
3. Policy_Features_v3.pdf (10 MB)
4. GMC_Policy_Features_2024.pdf (15 MB)
5. Policy-Features-Final.pdf (25 MB - boundary test)

Invalid Documents for Negative Testing:
1. Large_Policy_Doc.pdf (30 MB - exceeds limit)
2. Policy_Features.docx (2 MB - wrong format)
3. Policy_Features.doc (1.5 MB - wrong format)
4. policy_image.jpg (2 MB - wrong format)
5. policy_image.png (3 MB - wrong format)
6. corrupted_policy.pdf (0 KB or corrupted)

TPA Card Documents:
1. TPA_Card_v1.pdf (2 MB)
2. GMC_TPA_Card_2024.pdf (3 MB)
3. TPA-Card-Updated.pdf (4 MB)
```

### Employee Portal Test Data

**Employee User Accounts:**
```
Employee with Single Policy:
- Username: emp_single@company.com
- Password: Emp@123
- Enrolled Policies: POL-A001 (GMC) only
- Country: Country A

Employee with Multiple Policies:
- Username: emp_multi@company.com
- Password: Emp@123
- Enrolled Policies:
  * POL-A001 (GMC)
  * POL-A002 (GTL)
  * POL-A003 (GPA)
- Country: Country A

Employee with No Documents:
- Username: emp_nodocs@company.com
- Password: Emp@123
- Enrolled Policies: POL-00001 (no documents uploaded)
- Country: Country A

Employee Country B:
- Username: emp_countryB@company.com
- Password: Emp@123
- Enrolled Policies: POL-B001 (GMC)
- Country: Country B
```

**Document Availability Matrix:**
```
| Policy ID  | Policy Type | Policy Feature Doc | TPA Card Doc |
|------------|-------------|-------------------|--------------|
| POL-A001   | GMC         | ✓ Available       | ✓ Available  |
| POL-A002   | GTL         | ✓ Available       | ✓ Available  |
| POL-A003   | GPA         | ✗ Not Available   | ✗ Not Available |
| POL-B001   | GMC         | ✓ Available       | ✓ Available  |
| POL-00001  | GMC         | ✗ Not Available   | ✗ Not Available |
```

### Test Environment Data

**Environments:**
```
Development (DEV):
- URL: https://dev-iirm.company.com
- Purpose: Initial testing
- Data: Test data only

Test (QA):
- URL: https://qa-iirm.company.com
- Purpose: Comprehensive testing
- Data: Replicated production-like data

Staging (UAT):
- URL: https://uat-iirm.company.com
- Purpose: User acceptance testing
- Data: Production copy (sanitized)

Production (PROD):
- URL: https://iirm.company.com
- Purpose: Live system
- Data: Real data
```

**Browser Matrix:**
```
Primary Browsers:
- Google Chrome: Version 119+ (Windows, Mac)
- Mozilla Firefox: Version 120+ (Windows, Mac)
- Microsoft Edge: Version 119+ (Windows)
- Safari: Version 17+ (Mac)

Mobile Browsers (if applicable):
- Chrome Mobile
- Safari Mobile
```

---

## Scenario Summary and Metrics

### Test Scenario Statistics

**Total Scenarios:** 16

**By Priority:**
- High Priority: 10 scenarios (62.5%)
- Medium Priority: 6 scenarios (37.5%)

**By Module:**
- Admin Portal - Document Upload: 3 scenarios
- Admin Portal - Document Management: 3 scenarios
- Employee Portal - Document Access: 5 scenarios
- Employee Portal - Tab Navigation: 0 scenarios (covered in access)
- Integration & Real-time: 5 scenarios

**By Test Type:**
- Functional Testing: 10 scenarios
- Negative Testing: 1 scenario
- UI/UX Testing: 1 scenario
- Integration Testing: 2 scenarios
- Performance Testing: 1 scenario
- Compatibility Testing: 1 scenario

**By User Role:**
- Admin Only: 6 scenarios
- Employee Only: 7 scenarios
- Both Admin & Employee: 3 scenarios

### Estimated Effort Summary

**Total Estimated Effort:** ~35 hours

**Breakdown by Priority:**
- High Priority Scenarios: ~22 hours
- Medium Priority Scenarios: ~13 hours

**Breakdown by Phase:**
- Phase 1 (Smoke Testing): ~6 hours
- Phase 2 (Functional Testing): ~18 hours
- Phase 3 (Integration & Performance): ~8 hours
- Phase 4 (Compatibility & Edge Cases): ~3 hours

### Risk Assessment

**High Risk Scenarios:** 3
- TS-002: File validation (data integrity)
- TS-013: Real-time synchronization (critical functionality)
- TS-014: Concurrent access (system stability)

**Medium Risk Scenarios:** 8
- Various functional and integration scenarios

**Low Risk Scenarios:** 5
- UI/UX and supporting functionality

### Test Coverage

**Functional Requirements Coverage:**
- FR-001: Document Upload by Policy - ✓ Covered (TS-001, TS-002, TS-003)
- FR-002: Document Display in Employee Portal - ✓ Covered (TS-007, TS-008, TS-009)
- FR-003: Portal Configuration Entry Point - ✓ Covered (TS-001, TS-006)
- FR-004: Upload History Tracking - ✓ Covered (TS-004)
- FR-005: Document Tabs and Multi-Policy Support - ✓ Covered (TS-009, TS-010)

**User Stories Coverage:**
- US-001: Upload Policy Documents - ✓ Covered
- US-002: Replace Policy Documents - ✓ Covered
- US-003: View Uploaded Documents - ✓ Covered
- US-004: View Upload History - ✓ Covered
- US-005: Access Documents via Tabs - ✓ Covered
- US-006: View Single Policy Documents - ✓ Covered
- US-007: Navigate Multiple Policies via Sub-tabs - ✓ Covered
- US-008: View and Download Documents - ✓ Covered

**Edge Cases Coverage:**
- File size validation - ✓ Covered
- File format validation - ✓ Covered
- CTA visibility validation - ✓ Covered
- Card elements validation - ✓ Covered
- Tab display validation - ✓ Covered
- Placeholder messages - ✓ Covered
- Filename preservation - ✓ Covered

### Success Criteria

**Test Execution Success Criteria:**
- All High Priority scenarios: Pass rate ≥ 95%
- All Medium Priority scenarios: Pass rate ≥ 90%
- Critical defects: 0
- Major defects: ≤ 2
- Overall pass rate: ≥ 93%

**Performance Success Criteria:**
- Document upload (25 MB): < 2 minutes
- PDF viewer load time: < 5 seconds
- Tab switching: < 1 second
- Download initiation: Immediate

**User Experience Success Criteria:**
- No confusing error messages
- All workflows intuitive and logical
- Consistent UI across all screens
- Clear feedback for all user actions

---

## Appendix

### Test Execution Order

**Phase 1: Smoke Testing (Day 1)**
1. TS-001: First-time document upload
2. TS-007: Employee access via tabs
3. TS-008: Single policy enrollment access

**Phase 2: Functional Testing (Days 2-4)**
4. TS-002: File validation
5. TS-003: Document replacement
6. TS-004: Upload history
7. TS-005: Admin document viewer
8. TS-006: Card UI state management
9. TS-009: Multiple policy sub-tabs
10. TS-010: Tab navigation
11. TS-011: Placeholder messages
12. TS-012: Document download

**Phase 3: Integration & Performance (Days 5-6)**
13. TS-013: Real-time availability
14. TS-014: Concurrent sessions
15. TS-016: Performance testing

**Phase 4: Compatibility (Day 7)**
16. TS-015: Cross-browser compatibility

### Defect Severity Guidelines

**Critical:**
- System crash or data loss
- Complete feature failure
- Security vulnerabilities
- Data corruption

**Major:**
- Major functionality broken
- Incorrect data displayed
- No workaround available
- Significant user impact

**Minor:**
- Minor functionality issue
- Workaround available
- Limited user impact
- UI inconsistencies

**Trivial:**
- Cosmetic issues
- Typos or formatting
- Minimal user impact
- Enhancement suggestions

---

**Document Version:** 1.0  
**Last Updated:** November 21, 2025  
**Created By:** QA Team  
**Reviewed By:** [Pending]  
**Approved By:** [Pending]

---
