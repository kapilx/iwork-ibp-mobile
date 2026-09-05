# Test Cases - Policy Benefits/Coverage Management

**Module:** Policy Benefits/Coverage Management  
**JIRA ID:** IIRM-7931  
**Version:** 1.0  
**Date:** November 21, 2025  
**Status:** Complete

**Scope:** Comprehensive functional, regression, edge case, and integration test coverage for Policy Features upload, replace, view, history, and employee document consumption with tab-based multi-policy support.

**Reference:** `docs/IIRM-7931_IBP_Policy Feature/Product Specs/Policy-Feature.md`

---

## Test Documentation Standards

### Test Case Structure
Each test case includes:
- **TC ID:** Unique identifier  
- **Title:** Clear description of what is being tested  
- **Priority:** High / Medium / Low  
- **Category:** Functional / Negative / UI / Integration / Performance / Security  
- **User Persona:** Admin / Employee  
- **Preconditions:** Required state before test execution  
- **Test Steps:** Numbered actions to perform  
- **Expected Results:** Observable outcomes  
- **Test Data:** Specific data requirements  

### Priority Definitions
- **High:** Critical path, core functionality, blocking issues  
- **Medium:** Important features, supporting functionality  
- **Low:** Edge cases, cosmetic issues, nice-to-have features  

### Assumptions
- Authentication and authorization mechanisms validated separately  
- Database supports document versioning and history tracking  
- File storage infrastructure is reliable and scalable  
- Filename validation: letters, numbers, dash (-), underscore (_), dot (.) only  

---

## 1. Admin - Document Upload Functionality

### TC-001: Upload Policy Feature Document (Happy Path)
**Priority:** High  
**Category:** Functional  
**User Persona:** Admin  
**US Reference:** US-001

**Preconditions:**
- Admin is logged into IIRM portal
- Policy Details screen exists for the specific policy
- No document previously uploaded for this policy

**Test Steps:**
1. Navigate to Policy Details screen for specific policy
2. Click on "Portal Configuration" section
3. Verify "Upload Policy Features" card is displayed
4. Verify card shows Status: "Not Uploaded"
5. Verify card shows Last Uploaded: "-"
6. Verify card shows Uploader Name: "-"
7. Verify card description: "Upload policy features document for employees" is visible
8. Verify "Upload File" CTA is visible
9. Verify "View" CTA is disabled
10. Click "Upload File" CTA
11. Select a valid PDF file (less than 25 MB)
12. Click Upload button
13. Wait for upload to complete

**Expected Results:**
- Success message displayed: "Policy features document uploaded successfully"
- Card updates to show Status: "Document Uploaded"
- Last Uploaded shows current date and time
- Uploader Name shows admin's name
- "Upload File" CTA changes to "Replace Document" CTA
- "View" CTA becomes enabled
- Card description is no longer visible
- Document stored in database with Active status
- Upload history contains one entry

**Test Data:**
- Valid PDF file: `Policy_Features_GMC.pdf` (10 MB)

---

### TC-002: Upload Document - File Size Exceeds Limit
**Priority:** High  
**Category:** Negative  
**User Persona:** Admin  
**US Reference:** US-001

**Preconditions:**
- Admin is logged into IIRM portal
- Policy Details > Portal Configuration is accessible
- No document previously uploaded

**Test Steps:**
1. Navigate to Portal Configuration
2. Click "Upload File" CTA
3. Select a PDF file larger than 25 MB
4. Attempt to upload

**Expected Results:**
- Upload is rejected
- Error message displayed: "File size exceeds 25 MB limit. Please reduce the file size and try again."
- No document is saved
- Card remains in "Not Uploaded" state
- No upload history entry created

**Test Data:**
- Invalid PDF file: `Large_Policy_Document.pdf` (30 MB)

---

### TC-003: Upload Document - Invalid File Format
**Priority:** High  
**Category:** Negative  
**User Persona:** Admin  
**US Reference:** US-001

**Preconditions:**
- Admin is logged into IIRM portal
- Portal Configuration is accessible

**Test Steps:**
1. Navigate to Portal Configuration
2. Click "Upload File" CTA
3. Attempt to upload non-PDF file
4. Verify error message

**Expected Results:**
- Upload is rejected
- Error message displayed: "Only PDF files are supported. Please convert your document to PDF format and try again."
- No document is saved
- Card remains in "Not Uploaded" state

**Test Data:**
- File formats to test: 
  - `Policy_Features.docx` (Microsoft Word)
  - `Policy_Features.doc` (Microsoft Word Legacy)
  - `Policy_Features.txt` (Text file)
  - `Policy_Features.jpg` (Image)
  - `Policy_Features.png` (Image)
  - `Policy_Features.xlsx` (Excel)

---

### TC-004: Upload Document - Filename with Special Characters
**Priority:** Medium  
**Category:** Negative  
**User Persona:** Admin  
**US Reference:** US-001

**Preconditions:**
- Admin is logged into IIRM portal

**Test Steps:**
1. Navigate to Portal Configuration
2. Click "Upload File" CTA
3. Upload PDF with special characters in filename (except dash, underscore, dot)

**Expected Results:**
- Upload is rejected or special characters are sanitized
- Error message if rejected: "Filename contains invalid characters. Only letters, numbers, dash, underscore, and dot are allowed."
- Alternatively: System sanitizes filename and uploads successfully

**Test Data:**
- Filenames to test:
  - `Policy@Feature.pdf`
  - `Policy#123.pdf`
  - `Policy&Benefits.pdf`
  - `Policy Feature!.pdf`
  - `Policy$Coverage.pdf`

---

### TC-005: View Upload Modal Elements
**Priority:** Medium  
**Category:** UI Validation  
**User Persona:** Admin  
**US Reference:** US-001

**Preconditions:**
- Admin is logged into IIRM portal

**Test Steps:**
1. Navigate to Portal Configuration
2. Click "Upload File" CTA

**Expected Results:**
- Modal displays with following elements:
  - File upload area with browse button
  - Format indicator: "PDF only"
  - Size limit indicator: "Max 25 MB"
  - Cancel button
  - Upload button (initially disabled until file selected)
- Modal has close icon (X)
- Modal is centered on screen
- Modal has proper overlay/backdrop

---

### TC-006: Upload Document - Empty File
**Priority:** Medium  
**Category:** Negative  
**User Persona:** Admin

**Preconditions:**
- Admin is logged into IIRM portal

**Test Steps:**
1. Navigate to Portal Configuration
2. Click "Upload File" CTA
3. Select a zero-byte PDF file
4. Attempt to upload

**Expected Results:**
- Upload is rejected
- Error message: "File is empty. Please select a valid PDF file."
- No document saved
- No history entry created

**Test Data:**
- Empty PDF file: `Empty_File.pdf` (0 KB)

---

## 2. Admin - Document Replacement Functionality

### TC-007: Replace Existing Document (Happy Path)
**Priority:** High  
**Category:** Functional  
**User Persona:** Admin  
**US Reference:** US-002

**Preconditions:**
- Admin is logged into IIRM portal
- A policy feature document already exists for the policy

**Test Steps:**
1. Navigate to Policy Details > Portal Configuration
2. Verify "Replace Document" CTA is visible
3. Click "Replace Document" CTA
4. Verify confirmation message: "Replacing this document will make the new version available to all employees. The current document will be moved to upload history. Do you want to continue?"
5. Click "Continue" or "Yes"
6. Select new PDF file (valid, less than 25 MB)
7. Click Upload button
8. Wait for upload to complete

**Expected Results:**
- Success message displayed: "Policy features document replaced successfully"
- New document becomes active
- Previous document moved to upload history with status "Replaced"
- Card updates Last Uploaded timestamp to current time
- Uploader Name updates to current admin's name
- Employee portal shows new document immediately
- Upload history shows 2 entries: 1 Active, 1 Replaced

**Test Data:**
- Existing document: `Policy_Features_V1.pdf`
- New document: `Policy_Features_V2.pdf`

---

### TC-008: Replace Document - Cancel Confirmation
**Priority:** Medium  
**Category:** Functional  
**User Persona:** Admin  
**US Reference:** US-002

**Preconditions:**
- Document already exists for the policy

**Test Steps:**
1. Navigate to Portal Configuration
2. Click "Replace Document" CTA
3. View confirmation message
4. Click "Cancel" or "No"

**Expected Results:**
- Upload modal closes
- Existing document remains active
- No changes to upload history
- Card state unchanged
- No success/error messages displayed

---

### TC-009: Replace Document - Upload History Tracking
**Priority:** High  
**Category:** Functional  
**User Persona:** Admin  
**US Reference:** US-002, US-004

**Preconditions:**
- Document already exists

**Test Steps:**
1. Note current document details (filename, upload date, uploader)
2. Replace document with new PDF
3. Click "View" CTA
4. Click "Upload History" CTA
5. Verify previous document entry

**Expected Results:**
- Upload history shows previous document
- Entry displays: filename, uploader name, upload date/time, file size
- Status shows "Replaced" with replacement timestamp
- Current document marked as "Active"
- History is in reverse chronological order (newest first)
- Only one document has "Active" status
- All replaced documents show "Replaced" status

---

### TC-010: Multiple Document Replacements
**Priority:** Medium  
**Category:** Functional  
**User Persona:** Admin

**Preconditions:**
- Admin is logged into IIRM portal

**Test Steps:**
1. Upload initial document (Doc A)
2. Replace with Doc B
3. Replace with Doc C
4. Replace with Doc D
5. Open Upload History

**Expected Results:**
- Upload history shows 4 entries in order:
  - Doc D (Active) - most recent
  - Doc C (Replaced)
  - Doc B (Replaced)
  - Doc A (Replaced) - oldest
- Each entry has correct timestamp
- Each entry has correct uploader name
- File sizes displayed correctly

---

## 3. Admin - Document Viewer Functionality

### TC-011: View Uploaded Document
**Priority:** High  
**Category:** Functional  
**User Persona:** Admin  
**US Reference:** US-003

**Preconditions:**
- Document uploaded for the policy

**Test Steps:**
1. Navigate to Portal Configuration
2. Click "View" CTA on "Upload Policy Features" card
3. Verify document viewer opens

**Expected Results:**
- Document viewer displays with:
  - PDF document rendered correctly
  - "Download" CTA button visible
  - "Upload History" CTA button visible
  - Close button (X) visible
- PDF is readable and scrollable
- All pages of PDF are accessible
- PDF maintains proper formatting

---

### TC-012: View CTA Disabled State
**Priority:** Medium  
**Category:** UI Validation  
**User Persona:** Admin  
**US Reference:** US-003

**Preconditions:**
- No document uploaded for the policy

**Test Steps:**
1. Navigate to Portal Configuration
2. Verify "View" CTA state

**Expected Results:**
- "View" CTA is disabled (grayed out)
- CTA is not clickable
- Tooltip or visual indicator shows disabled state
- Cursor changes to "not-allowed" on hover

---

### TC-013: Download Document from Viewer
**Priority:** High  
**Category:** Functional  
**User Persona:** Admin  
**US Reference:** US-003

**Preconditions:**
- Document uploaded and viewer open

**Test Steps:**
1. Open document viewer
2. Click "Download" button
3. Verify download starts

**Expected Results:**
- PDF downloads to default download location
- Filename matches original uploaded filename
- Downloaded file opens correctly in PDF reader
- File size matches uploaded file
- Download completes without errors

---

### TC-014: Close Document Viewer
**Priority:** Medium  
**Category:** Functional  
**User Persona:** Admin

**Preconditions:**
- Document viewer is open

**Test Steps:**
1. Click close button (X) in viewer
2. Verify viewer closes

**Expected Results:**
- Viewer closes smoothly
- User returns to Portal Configuration screen
- Upload Policy Features card remains visible
- No data loss or errors

---

### TC-015: PDF Rendering in Viewer
**Priority:** High  
**Category:** Functional  
**User Persona:** Admin

**Preconditions:**
- Multi-page PDF document uploaded

**Test Steps:**
1. Open document viewer
2. Test page navigation
3. Test zoom functionality
4. Test scroll functionality

**Expected Results:**
- All pages render correctly
- Page navigation buttons work
- Zoom in/out functions properly
- Scroll works smoothly
- PDF maintains quality at all zoom levels
- No rendering errors or blank pages

---

## 4. Admin - Upload History Functionality

### TC-016: View Upload History Panel
**Priority:** High  
**Category:** Functional  
**User Persona:** Admin  
**US Reference:** US-004

**Preconditions:**
- At least one document has been replaced

**Test Steps:**
1. Open document viewer
2. Click "Upload History" CTA
3. Verify history panel displays

**Expected Results:**
- History panel shows table with columns:
  - Document Name
  - Uploaded By
  - Timestamp
  - File Size
  - Status (Active/Replaced)
  - Actions (Download)
- Each row displays complete information
- Close button visible
- Panel is scrollable if many entries

---

### TC-017: Download Historical Document
**Priority:** Medium  
**Category:** Functional  
**User Persona:** Admin  
**US Reference:** US-004

**Preconditions:**
- Multiple documents in upload history

**Test Steps:**
1. Open Upload History panel
2. Click "Download" action on a historical document entry
3. Verify download

**Expected Results:**
- Historical document downloads successfully
- Filename matches original filename from that upload
- Downloaded file is the correct historical version
- File content matches the replaced version
- Download does not affect active document

---

### TC-018: Upload History Ordering
**Priority:** Medium  
**Category:** Functional  
**User Persona:** Admin  
**US Reference:** US-004

**Preconditions:**
- Multiple documents in history

**Test Steps:**
1. Upload document A at time T1
2. Replace with document B at time T2
3. Replace with document C at time T3
4. Open Upload History

**Expected Results:**
- Documents listed in reverse chronological order:
  - Document C (Active) - timestamp T3 - most recent
  - Document B (Replaced) - timestamp T2
  - Document A (Replaced) - timestamp T1 - oldest
- Timestamps display in consistent format
- Order remains stable on page refresh

---

### TC-019: Upload History - Column Data Validation
**Priority:** Medium  
**Category:** Functional  
**User Persona:** Admin

**Preconditions:**
- Upload history contains multiple entries

**Test Steps:**
1. Open Upload History
2. Verify each column data

**Expected Results:**
- Document Name: Shows original filename
- Uploaded By: Shows admin username/full name
- Timestamp: Shows date and time in format: "DD MMM YYYY, HH:MM AM/PM"
- File Size: Shows size in MB/KB (e.g., "10.5 MB", "500 KB")
- Status: Shows "Active" or "Replaced"
- Actions: Download button enabled for all entries

---

### TC-020: Close Upload History Panel
**Priority:** Low  
**Category:** UI Validation  
**User Persona:** Admin

**Preconditions:**
- Upload History panel is open

**Test Steps:**
1. Click close button on history panel
2. Verify panel behavior

**Expected Results:**
- History panel closes
- User returns to document viewer
- PDF document still visible
- Can reopen history panel without issues

---

## 5. Employee - Dashboard Access

### TC-021: Policy Features Button Visibility
**Priority:** High  
**Category:** UI Validation  
**User Persona:** Employee  
**US Reference:** US-005

**Preconditions:**
- Employee is logged into employee portal
- Employee is enrolled in at least one policy

**Test Steps:**
1. Login to employee portal
2. View dashboard
3. Locate "Policy Features" button

**Expected Results:**
- "Policy Features" button is prominently displayed on dashboard
- Button is clickable
- Button label is clear and readable
- Button has appropriate styling/icon

---

### TC-022: Click Policy Features Button
**Priority:** High  
**Category:** Functional  
**User Persona:** Employee  
**US Reference:** US-005

**Preconditions:**
- Employee on dashboard

**Test Steps:**
1. Click "Policy Features" button
2. Verify Documents screen opens

**Expected Results:**
- Documents screen opens in modal or new view
- Main tabs visible: "Policy Feature" and "TPA Card"
- "Policy Feature" tab is selected by default
- Screen loads without errors

---

### TC-023: Policy Features Button - No Enrollment
**Priority:** High  
**Category:** Security  
**User Persona:** Employee

**Preconditions:**
- Employee logged in but not enrolled in any policy

**Test Steps:**
1. Login to employee portal
2. Check dashboard for "Policy Features" button

**Expected Results:**
- "Policy Features" button is NOT visible on dashboard
- No access to policy documents
- Dashboard shows appropriate message if needed

---

## 6. Employee - Single Policy Document Access

### TC-024: View Document - Single Policy Enrollment
**Priority:** High  
**Category:** Functional  
**User Persona:** Employee  
**US Reference:** US-006

**Preconditions:**
- Employee enrolled in only ONE policy
- Policy feature document uploaded for that policy

**Test Steps:**
1. Click "Policy Features" button on dashboard
2. Verify Documents screen opens

**Expected Results:**
- Documents screen displays with:
  - Main tabs: "Policy Feature" and "TPA Card" (horizontal)
  - "Policy Feature" tab selected by default
  - No policy sub-tabs displayed
  - PDF document displays in viewer area
  - PDF has zoom and navigation controls
  - "Download" button visible
  - Close icon (X) visible
- Document loads within 3 seconds

---

### TC-025: Switch to TPA Card Tab - Single Policy
**Priority:** High  
**Category:** Functional  
**User Persona:** Employee  
**US Reference:** US-006

**Preconditions:**
- Employee enrolled in one policy
- Documents screen open on "Policy Feature" tab

**Test Steps:**
1. Click "TPA Card" main tab
2. Verify tab switch

**Expected Results:**
- "TPA Card" tab becomes active
- TPA card document displays in viewer area (if available)
- No policy sub-tabs displayed
- "Policy Feature" tab remains visible but inactive
- Tab transition is smooth

---

### TC-026: No Document Available - Single Policy
**Priority:** Medium  
**Category:** Functional  
**User Persona:** Employee  
**US Reference:** US-006

**Preconditions:**
- Employee enrolled in one policy
- No policy feature document uploaded

**Test Steps:**
1. Click "Policy Features" button
2. Verify Documents screen opens

**Expected Results:**
- Documents screen opens with main tabs
- "Policy Feature" tab selected
- Placeholder message displayed in viewer area: "Features document for this policy will be available soon"
- No PDF viewer controls visible
- Close icon (X) still available
- No error messages displayed

---

### TC-027: Download Document - Single Policy
**Priority:** High  
**Category:** Functional  
**User Persona:** Employee

**Preconditions:**
- Employee enrolled in one policy with document

**Test Steps:**
1. Open Documents screen
2. Verify document displays
3. Click "Download" button

**Expected Results:**
- PDF downloads to default location
- Filename matches original uploaded filename
- Downloaded file is complete and readable
- Download doesn't close the viewer

---

## 7. Employee - Multiple Policies Document Access

### TC-028: View Documents - Multiple Policy Enrollments
**Priority:** High  
**Category:** Functional  
**User Persona:** Employee  
**US Reference:** US-007

**Preconditions:**
- Employee enrolled in multiple policies (e.g., GMC #12345 and GTL #67890)
- Documents uploaded for all policies

**Test Steps:**
1. Click "Policy Features" button on dashboard
2. Verify Documents screen opens

**Expected Results:**
- Documents screen displays with:
  - Main tabs: "Policy Feature" and "TPA Card" (horizontal at top)
  - Policy sub-tabs displayed below main tabs
  - Each sub-tab shows: Policy number and type (e.g., "#12345 - GMC", "#67890 - GTL")
  - First policy sub-tab selected by default
  - First policy's document displays in viewer area
  - "Policy Feature" main tab is selected by default

---

### TC-029: Navigate Between Policy Sub-tabs
**Priority:** High  
**Category:** Functional  
**User Persona:** Employee  
**US Reference:** US-007

**Preconditions:**
- Employee enrolled in 3 policies (GMC #12345, GTL #67890, GPA #11111)
- Documents screen open

**Test Steps:**
1. Note first policy sub-tab is selected (e.g., "#12345 - GMC")
2. Click on second policy sub-tab ("#67890 - GTL")
3. Verify document changes
4. Click on third policy sub-tab ("#11111 - GPA")
5. Verify document changes

**Expected Results:**
- Each sub-tab click displays corresponding policy document
- Document viewer updates immediately
- Active sub-tab is visually highlighted
- Main "Policy Feature" tab remains selected
- Smooth transition between documents
- No loading errors

---

### TC-030: Sub-tabs Persist Across Main Tab Switches
**Priority:** High  
**Category:** Functional  
**User Persona:** Employee  
**US Reference:** US-007

**Preconditions:**
- Employee enrolled in multiple policies
- Documents screen open on "Policy Feature" tab

**Test Steps:**
1. Select second policy sub-tab (e.g., "#67890 - GTL")
2. Click "TPA Card" main tab
3. Verify sub-tabs still displayed
4. Verify second policy sub-tab still selected
5. Click back to "Policy Feature" main tab

**Expected Results:**
- Policy sub-tabs remain visible when switching main tabs
- Selected policy sub-tab persists across main tab switches
- TPA Card document shown for the same selected policy
- User doesn't need to re-select policy when switching main tabs
- Tab state is maintained properly

---

### TC-031: Multiple Policies - One Missing Document
**Priority:** Medium  
**Category:** Functional  
**User Persona:** Employee  
**US Reference:** US-007

**Preconditions:**
- Employee enrolled in 2 policies
- Document uploaded for policy #12345 only
- No document for policy #67890

**Test Steps:**
1. Open Documents screen
2. Verify first policy sub-tab selected (with document)
3. Click second policy sub-tab (without document)

**Expected Results:**
- First policy: Document displays correctly
- Second policy: Placeholder message displays: "Features document for this policy will be available soon"
- Sub-tabs remain functional
- No error messages shown
- User can switch back to first policy

---

### TC-032: Policy Sub-tab Labeling Format
**Priority:** Medium  
**Category:** UI Validation  
**User Persona:** Employee  
**US Reference:** US-007

**Preconditions:**
- Employee enrolled in multiple policies of different types

**Test Steps:**
1. Open Documents screen
2. Verify sub-tab labels

**Expected Results:**
- Each sub-tab shows: "#[Policy Number] - [Policy Type]"
- Examples: "#12345 - GMC", "#67890 - GTL", "#11111 - GPA"
- Labels are readable and not truncated
- Format is consistent across all sub-tabs
- Policy types abbreviated appropriately

---

### TC-033: Multiple Policies - All Documents Available
**Priority:** High  
**Category:** Functional  
**User Persona:** Employee

**Preconditions:**
- Employee enrolled in 4 policies
- Documents uploaded for all 4 policies

**Test Steps:**
1. Open Documents screen
2. Navigate through all policy sub-tabs
3. Verify each document displays

**Expected Results:**
- All 4 policy sub-tabs visible
- Each policy sub-tab shows correct document
- No placeholder messages
- All documents load successfully
- Downloads work for all policies

---

### TC-034: Multiple Policies - Tab Order
**Priority:** Low  
**Category:** UI Validation  
**User Persona:** Employee

**Preconditions:**
- Employee enrolled in multiple policies

**Test Steps:**
1. Open Documents screen
2. Observe policy sub-tab order

**Expected Results:**
- Policy sub-tabs ordered logically (e.g., by policy number, enrollment date, or policy type)
- Order is consistent across sessions
- Order matches employee's policy list elsewhere in portal

---

## 8. Employee - Document Viewer Functionality

### TC-035: PDF Viewer Controls
**Priority:** High  
**Category:** Functional  
**User Persona:** Employee  
**US Reference:** US-008

**Preconditions:**
- Document viewer open with PDF displayed

**Test Steps:**
1. Test zoom in functionality
2. Test zoom out functionality
3. Test page navigation (if multi-page PDF)
4. Test scroll functionality

**Expected Results:**
- Zoom controls work smoothly
- Page navigation is functional
- Scrolling is smooth
- PDF remains readable at all zoom levels
- Controls are intuitive and responsive

---

### TC-036: Download Document - Employee
**Priority:** High  
**Category:** Functional  
**User Persona:** Employee  
**US Reference:** US-008

**Preconditions:**
- Documents screen open with PDF displayed

**Test Steps:**
1. Click "Download" button
2. Verify download starts
3. Check downloaded file

**Expected Results:**
- PDF downloads to default download location
- Filename matches original uploaded filename
- Downloaded file opens correctly in PDF reader
- File content is identical to viewed document
- File size is correct

---

### TC-037: Close Documents Screen
**Priority:** High  
**Category:** Functional  
**User Persona:** Employee  
**US Reference:** US-008

**Preconditions:**
- Documents screen is open

**Test Steps:**
1. Click close icon (X)
2. Verify screen closes

**Expected Results:**
- Entire Documents screen closes
- User returns to employee dashboard
- No error messages displayed
- Dashboard state is preserved

---

### TC-038: Browser Back Button Behavior
**Priority:** Medium  
**Category:** Usability  
**User Persona:** Employee

**Preconditions:**
- Documents screen open

**Test Steps:**
1. Click browser back button
2. Verify behavior

**Expected Results:**
- Documents screen closes gracefully OR navigates back properly
- User returns to previous page (dashboard)
- No console errors
- No broken state

---

### TC-039: Multi-page PDF Navigation
**Priority:** Medium  
**Category:** Functional  
**User Persona:** Employee

**Preconditions:**
- Multi-page PDF (20+ pages) displayed

**Test Steps:**
1. Use page navigation controls
2. Jump to specific page number
3. Navigate using keyboard (arrow keys)
4. Test scroll to navigate pages

**Expected Results:**
- All navigation methods work correctly
- Current page number displays accurately
- Pages load quickly
- No missing pages or rendering errors

---

### TC-040: PDF Viewer - Mobile Responsiveness
**Priority:** Medium  
**Category:** Usability  
**User Persona:** Employee

**Preconditions:**
- Access from mobile device or responsive view

**Test Steps:**
1. Open Documents screen on mobile
2. Test tab navigation
3. Test document viewing
4. Test zoom and scroll

**Expected Results:**
- Main tabs and sub-tabs display appropriately on mobile
- Tabs are touch-friendly
- PDF viewer works on mobile browsers
- Zoom controls are touch-friendly
- Download works on mobile

---

## 9. Cross-functional & Integration Tests

### TC-041: Document Update Reflection Time
**Priority:** High  
**Category:** Integration  
**User Persona:** Admin & Employee

**Preconditions:**
- Employee currently viewing old document

**Test Steps:**
1. Admin replaces document at time T
2. Employee (already viewing old document) refreshes page
3. New employee opens Documents screen

**Expected Results:**
- Document update reflected immediately (< 5 seconds)
- Already-viewing employee sees new document on refresh
- New employee sees new document immediately
- No caching issues

---

### TC-042: Concurrent Admin Uploads
**Priority:** Medium  
**Category:** Concurrency  
**User Persona:** Admin

**Preconditions:**
- Two admin users logged in

**Test Steps:**
1. Admin A starts replacing document for Policy #12345
2. Admin B simultaneously starts replacing same document
3. Verify system behavior

**Expected Results:**
- System handles concurrent uploads gracefully
- Last successful upload becomes active document
- Both uploads appear in history with correct timestamps
- No data corruption or loss
- Appropriate locking or conflict resolution

---

### TC-043: Multiple Policy Documents Isolation
**Priority:** High  
**Category:** Data Integrity  
**User Persona:** Admin & Employee

**Preconditions:**
- Multiple policies configured

**Test Steps:**
1. Upload document for Policy #12345
2. Upload document for Policy #67890
3. Admin views each policy's Portal Configuration
4. Employee enrolled in both policies views documents

**Expected Results:**
- Each policy has its own separate document
- Portal Configuration shows correct document for each policy
- Employee sees correct document when selecting each policy
- No cross-contamination of documents between policies
- Upload history is policy-specific

---

### TC-044: Permissions - Non-enrolled Employee Access
**Priority:** High  
**Category:** Security  
**User Persona:** Employee

**Preconditions:**
- Employee not enrolled in any policy

**Test Steps:**
1. Login as employee not enrolled in any policy
2. Check dashboard for "Policy Features" button
3. Attempt direct URL access to Documents screen (if applicable)

**Expected Results:**
- "Policy Features" button not visible on dashboard
- Direct URL access denied or shows "No policies enrolled" message
- Appropriate error/info message displayed
- No security vulnerability

---

### TC-045: Document Availability After Policy Enrollment
**Priority:** Medium  
**Category:** Integration  
**User Persona:** Employee

**Preconditions:**
- Employee initially not enrolled in any policy

**Test Steps:**
1. Verify employee not enrolled
2. Admin enrolls employee in Policy #12345 with uploaded document
3. Employee logs out and logs in
4. Check dashboard

**Expected Results:**
- "Policy Features" button now visible
- Employee can access and view Policy #12345 document
- System reflects enrollment status immediately after login
- Correct permissions applied

---

### TC-046: Document Access After Policy Termination
**Priority:** High  
**Category:** Security  
**User Persona:** Employee

**Preconditions:**
- Employee enrolled in policy with document access

**Test Steps:**
1. Verify employee can access document
2. Admin terminates employee's policy enrollment
3. Employee refreshes portal

**Expected Results:**
- Policy no longer visible in employee's document list
- "Policy Features" button hidden if no other policies
- Employee cannot access terminated policy's documents
- Appropriate message displayed if applicable

---

## 10. Performance & Load Tests

### TC-047: Large PDF Upload Performance
**Priority:** Medium  
**Category:** Performance  
**User Persona:** Admin

**Preconditions:**
- Admin has valid PDF close to 25 MB

**Test Steps:**
1. Upload PDF file close to 25 MB limit
2. Measure upload time
3. Verify successful upload

**Expected Results:**
- Upload completes within acceptable time (< 30 seconds on standard connection)
- Progress indicator shown during upload
- Success message displayed after completion
- No timeout errors

---

### TC-048: Multiple Simultaneous Employee Views
**Priority:** Medium  
**Category:** Load  
**User Persona:** Employee

**Preconditions:**
- Multiple employees logged in

**Test Steps:**
1. Simulate 50+ employees viewing documents simultaneously
2. Monitor system performance
3. Check document load times

**Expected Results:**
- All employees can view documents without errors
- Load time remains acceptable (< 3 seconds)
- No system crashes or timeouts
- Server handles concurrent requests

---

### TC-049: Upload History with Large Number of Replacements
**Priority:** Low  
**Category:** Performance  
**User Persona:** Admin

**Preconditions:**
- Policy has been updated many times

**Test Steps:**
1. Replace document 20+ times for same policy
2. Open Upload History panel
3. Verify history displays correctly

**Expected Results:**
- History panel loads within 2 seconds
- All entries display correctly
- Pagination implemented if needed (e.g., 10 entries per page)
- No performance degradation
- Scroll is smooth

---

### TC-050: Document Viewer - Large PDF Performance
**Priority:** Medium  
**Category:** Performance  
**User Persona:** Employee

**Preconditions:**
- Large PDF (100+ pages, 24 MB) uploaded

**Test Steps:**
1. Open Documents screen
2. Measure document load time
3. Test navigation and zoom

**Expected Results:**
- Document loads within 5 seconds
- Page navigation remains responsive
- Zoom functions work smoothly
- No browser freezing or crashes

---

## 11. Accessibility & Usability Tests

### TC-051: Keyboard Navigation - Admin
**Priority:** Medium  
**Category:** Accessibility  
**User Persona:** Admin

**Preconditions:**
- Admin on Portal Configuration screen

**Test Steps:**
1. Navigate Portal Configuration using only keyboard (Tab, Enter, Esc)
2. Upload document using keyboard only
3. Navigate viewer and history using keyboard

**Expected Results:**
- All interactive elements accessible via keyboard
- Focus indicators visible
- Tab order is logical
- Enter/Space activates buttons
- Esc closes modals
- No keyboard traps

---

### TC-052: Screen Reader Compatibility - Employee
**Priority:** Medium  
**Category:** Accessibility  
**User Persona:** Employee

**Preconditions:**
- Screen reader software enabled

**Test Steps:**
1. Use screen reader to navigate Documents screen
2. Listen to tab announcements
3. Verify document viewer accessibility

**Expected Results:**
- Screen reader announces all tabs and buttons correctly
- Alt text provided for icons
- Document structure is readable
- ARIA labels present where needed
- Proper heading hierarchy

---

### TC-053: Keyboard Navigation - Employee Documents Screen
**Priority:** Medium  
**Category:** Accessibility  
**User Persona:** Employee

**Preconditions:**
- Employee has Documents screen open

**Test Steps:**
1. Navigate between main tabs using keyboard only
2. Navigate between policy sub-tabs using keyboard
3. Access download button via keyboard
4. Close screen using keyboard

**Expected Results:**
- Tab key navigates between all interactive elements
- Arrow keys navigate between tabs (optional but preferred)
- Enter key activates buttons and switches tabs
- All functionality accessible without mouse
- Focus is visible at all times

---

### TC-054: Color Contrast and Visual Accessibility
**Priority:** Low  
**Category:** Accessibility  
**User Persona:** Admin & Employee

**Preconditions:**
- Access to UI

**Test Steps:**
1. Check color contrast ratios for all text
2. Verify buttons and tabs are distinguishable
3. Test with color blindness simulators

**Expected Results:**
- Text meets WCAG 2.1 Level AA contrast ratios (4.5:1 for normal text)
- Active/inactive states clearly distinguishable
- No reliance on color alone to convey information
- Icons have text labels or tooltips

---

## 12. Error Handling & Edge Cases

### TC-055: Network Interruption During Upload
**Priority:** Medium  
**Category:** Error Handling  
**User Persona:** Admin

**Preconditions:**
- Admin starting document upload

**Test Steps:**
1. Start uploading document
2. Disconnect network mid-upload
3. Observe system behavior

**Expected Results:**
- Error message displayed: "Upload failed due to network error. Please try again."
- Incomplete upload is not saved
- User can retry upload
- No corrupt data stored
- Card state remains unchanged

---

### TC-056: Session Timeout During Upload
**Priority:** Medium  
**Category:** Error Handling  
**User Persona:** Admin

**Preconditions:**
- Admin session about to expire

**Test Steps:**
1. Start document upload
2. Let session timeout expire during upload
3. Verify behavior

**Expected Results:**
- Upload stops gracefully
- User redirected to login page
- After re-login, user can retry upload
- No partial data saved
- Appropriate message shown

---

### TC-057: Browser Refresh During Document View
**Priority:** Low  
**Category:** Usability  
**User Persona:** Employee

**Preconditions:**
- Documents screen open

**Test Steps:**
1. Open Documents screen
2. Select specific policy sub-tab
3. Refresh browser
4. Verify state

**Expected Results:**
- Documents screen reloads
- Returns to default state (first policy selected)
- No errors displayed
- User can navigate normally

---

### TC-058: Corrupted PDF File Upload
**Priority:** Low  
**Category:** Error Handling  
**User Persona:** Admin

**Preconditions:**
- Admin has corrupted PDF file

**Test Steps:**
1. Attempt to upload a corrupted PDF file
2. Observe system behavior

**Expected Results:**
- System validates PDF integrity
- Error message: "The uploaded file appears to be corrupted. Please upload a valid PDF file."
- Upload rejected
- No corrupt file stored
- User can retry with valid file

---

### TC-059: Document Deleted from Storage (Backend Issue)
**Priority:** Low  
**Category:** Error Handling  
**User Persona:** Employee

**Preconditions:**
- Document metadata exists but file deleted from storage

**Test Steps:**
1. Admin uploads document
2. Document accidentally deleted from storage (backend)
3. Employee attempts to view document

**Expected Results:**
- Graceful error message: "Document temporarily unavailable. Please contact administrator."
- No application crash
- Admin notified of missing document
- User can navigate away normally

---

### TC-060: Duplicate Filename Upload
**Priority:** Low  
**Category:** Functional  
**User Persona:** Admin

**Preconditions:**
- Document with specific filename already uploaded

**Test Steps:**
1. Upload document: "Policy_Features.pdf"
2. Replace with another document also named "Policy_Features.pdf"
3. Upload again with same filename

**Expected Results:**
- System accepts duplicate filenames
- Each version stored separately
- Upload history shows correct filename for each entry
- Downloads work correctly for all versions

---

### TC-061: Browser Compatibility
**Priority:** Medium  
**Category:** Usability  
**User Persona:** Admin & Employee

**Preconditions:**
- Access to multiple browsers

**Test Steps:**
1. Test upload functionality on Chrome, Firefox, Edge, Safari
2. Test document viewing on all browsers
3. Test tab navigation on all browsers

**Expected Results:**
- All functionality works on supported browsers
- PDF viewer renders correctly
- Upload works without issues
- No browser-specific bugs
- Performance is acceptable

---

### TC-062: Very Long Filename
**Priority:** Low  
**Category:** Edge Case  
**User Persona:** Admin

**Preconditions:**
- Admin has PDF with very long filename (200+ characters)

**Test Steps:**
1. Attempt to upload PDF with very long filename
2. Observe behavior

**Expected Results:**
- System accepts or truncates filename appropriately
- If truncated, user is informed
- File uploads successfully
- Filename displays correctly in UI (truncated with ellipsis if needed)
- Download preserves filename (truncated if necessary)

---

### TC-063: Special Characters in PDF Content
**Priority:** Low  
**Category:** Functional  
**User Persona:** Employee

**Preconditions:**
- PDF contains special characters, multiple languages, or unicode

**Test Steps:**
1. Admin uploads PDF with special content
2. Employee views document

**Expected Results:**
- All characters render correctly
- Multiple languages display properly
- Unicode characters visible
- No garbled text
- Download preserves all content

---

### TC-064: Concurrent Document Views by Same Employee
**Priority:** Low  
**Category:** Edge Case  
**User Persona:** Employee

**Preconditions:**
- Employee logged in

**Test Steps:**
1. Open Documents screen in one browser tab
2. Open Documents screen in another browser tab
3. Navigate to different policies in each tab

**Expected Results:**
- Both tabs function independently
- No conflicts or errors
- Each tab maintains its own state
- Downloads work in both tabs

---

## 13. Regression & Smoke Tests

### TC-065: End-to-End Smoke Test - Admin Flow
**Priority:** High  
**Category:** Smoke  
**User Persona:** Admin

**Preconditions:**
- Clean system state

**Test Steps:**
1. Login as admin
2. Navigate to Policy Details > Portal Configuration
3. Upload policy feature document
4. View uploaded document
5. Replace document
6. View upload history
7. Download historical document

**Expected Results:**
- All steps complete successfully
- No errors encountered
- All CTAs work as expected
- Data persists correctly

---

### TC-066: End-to-End Smoke Test - Employee Flow (Single Policy)
**Priority:** High  
**Category:** Smoke  
**User Persona:** Employee

**Preconditions:**
- Employee enrolled in one policy
- Document uploaded for that policy

**Test Steps:**
1. Login as employee
2. Click "Policy Features" button
3. View document
4. Switch to "TPA Card" tab
5. Download document
6. Close Documents screen

**Expected Results:**
- All steps complete successfully
- Document displays correctly
- Download works
- Navigation smooth

---

### TC-067: End-to-End Smoke Test - Employee Flow (Multiple Policies)
**Priority:** High  
**Category:** Smoke  
**User Persona:** Employee

**Preconditions:**
- Employee enrolled in multiple policies
- Documents uploaded for all policies

**Test Steps:**
1. Login as employee
2. Click "Policy Features" button
3. Verify policy sub-tabs displayed
4. Navigate between policy sub-tabs
5. Switch to "TPA Card" main tab
6. Navigate between policy sub-tabs on TPA Card
7. Download documents from different policies
8. Close Documents screen

**Expected Results:**
- All steps complete successfully
- All policy documents accessible
- Tab navigation works correctly
- Downloads work for all policies

---

### TC-068: Portal Configuration - No Regression
**Priority:** Medium  
**Category:** Regression  
**User Persona:** Admin

**Preconditions:**
- Other portal configuration cards exist (e.g., TPA Card upload)

**Test Steps:**
1. Navigate to Portal Configuration
2. Verify all cards display correctly
3. Interact with other configuration cards
4. Upload Policy Features document
5. Verify other cards still functional

**Expected Results:**
- Policy Features card doesn't affect other cards
- Layout remains stable
- All portal configuration features work
- No UI breaking changes

---

### TC-069: Employee Dashboard - No Regression
**Priority:** Medium  
**Category:** Regression  
**User Persona:** Employee

**Preconditions:**
- Employee dashboard has other features/widgets

**Test Steps:**
1. Login to employee portal
2. Verify "Policy Features" button placement
3. Verify other dashboard elements
4. Use Policy Features functionality
5. Verify other dashboard features still work

**Expected Results:**
- Policy Features button integrates seamlessly
- No layout issues
- Other dashboard features unaffected
- Performance not degraded

---

## Test Execution Summary

### Coverage Matrix

| Module | Total Cases | High Priority | Medium Priority | Low Priority |
|--------|-------------|---------------|-----------------|--------------|
| Admin Upload | 6 | 4 | 2 | 0 |
| Admin Replacement | 4 | 2 | 2 | 0 |
| Admin Viewer | 5 | 3 | 2 | 0 |
| Admin History | 5 | 1 | 3 | 1 |
| Employee Dashboard | 3 | 3 | 0 | 0 |
| Employee Single Policy | 4 | 3 | 1 | 0 |
| Employee Multiple Policies | 7 | 4 | 2 | 1 |
| Employee Viewer | 6 | 3 | 3 | 0 |
| Integration | 6 | 4 | 2 | 0 |
| Performance | 4 | 0 | 3 | 1 |
| Accessibility | 4 | 0 | 3 | 1 |
| Error Handling | 10 | 0 | 4 | 6 |
| Regression/Smoke | 5 | 4 | 1 | 0 |
| **TOTAL** | **69** | **31** | **28** | **10** |

---

## Test Environment Requirements

### Admin Testing Environment
- IIRM portal access with admin credentials
- Multiple test policies configured (at least 3)
- Test PDF files of various sizes:
  - Small (1 MB)
  - Medium (10 MB)
  - Large (24 MB)
  - Oversized (26+ MB for negative testing)
- Test files in various formats (.pdf, .docx, .jpg, etc.)
- Files with special characters in filenames
- Multi-page PDFs (1 page, 10 pages, 50+ pages)

### Employee Testing Environment
- Employee portal access
- Multiple employee accounts with different enrollments:
  - Employee with 1 policy enrollment
  - Employee with 2 policy enrollments
  - Employee with 3+ policy enrollments
  - Employee with no policy enrollments
- Policies with and without uploaded documents

### Test Data Requirements
- At least 3 different policies with unique IDs and types
- Sample PDF files:
  - Single page PDF
  - Multi-page PDF (10+ pages)
  - PDF with images
  - PDF with text only
  - PDF close to 25 MB size limit
  - PDF with special characters/unicode content
  - Corrupted PDF file
  - Empty (0 byte) PDF file

### Browser Requirements
- Chrome (latest version)
- Firefox (latest version)
- Edge (latest version)
- Safari (latest version for Mac/iOS testing)

### Accessibility Testing Tools
- Screen reader software (JAWS, NVDA, or VoiceOver)
- Keyboard-only navigation capability
- Color contrast analyzer
- Color blindness simulator

---

## Test Completion Criteria

### Exit Criteria
- All **High priority** test cases: **100% pass rate**
- All **Medium priority** test cases: **95% pass rate**
- All **Low priority** test cases: **90% pass rate**
- **No critical or high severity defects open**
- Performance benchmarks met:
  - Document upload < 30 seconds (for 25 MB file)
  - Document load time < 3 seconds
  - UI response time < 1 second
- **Accessibility standards (WCAG 2.1 Level AA) compliance verified**
- All user stories acceptance criteria met
- Regression testing complete with no new defects

### Defect Severity Classification

| Severity | Definition | Example |
|----------|------------|---------|
| **Critical** | Application crash, data loss, security vulnerability, complete feature breakdown | Employee can access other employees' documents, system crash on upload |
| **High** | Feature not working as specified, blocking user workflow | Cannot upload documents, documents don't display for employees |
| **Medium** | Feature partially working, workaround available | Upload history not ordered correctly, filename truncation issues |
| **Low** | Minor UI issues, cosmetic problems, edge cases | Button alignment off, tooltip text unclear |

---

## Test Execution Tracking Template

| TC ID | Test Case Title | Priority | Executed By | Date | Status | Build # | Defect ID | Notes |
|-------|----------------|----------|-------------|------|--------|---------|-----------|-------|
| TC-001 | Upload Document (Happy Path) | High | | | | | | |
| TC-002 | File Size Exceeds Limit | High | | | | | | |
| ... | ... | ... | | | | | | |

**Status Values:** Pass / Fail / Blocked / Not Executed / Skipped

---

## Test Reporting

### Daily Test Summary
- Test cases executed: X / 69
- Pass rate: Y%
- New defects found: Z
- Defects fixed: N
- Blocked test cases: M

### Final Test Report
- **Total test cases:** 69
- **Test cases executed:** X
- **Pass rate:** Y%
- **Critical defects:** 0 open
- **High defects:** 0 open
- **Medium defects:** N open (with justification)
- **Low defects:** M open (with justification)
- **Test coverage:** 100% of requirements
- **Recommendation:** Go / No-Go for production release

---

**End of Test Cases Document**

**Document Owner:** QA Team  
**Last Updated:** November 21, 2025  
**Next Review Date:** TBD  
**Approval:** Pending
