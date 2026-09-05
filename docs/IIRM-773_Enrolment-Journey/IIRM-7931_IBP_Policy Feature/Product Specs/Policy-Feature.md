# PRD - Phase 1

## Module: Policy Benefits/Coverage Management

**JIRA ID:** TBD  
**Version:** 1.0  
**Date:** November 17, 2025  
**Status:** Draft

---

## 1. Overview

**Purpose:** Enables insurance administrators to upload and manage policy feature documents for different policies, making them available to employees through the employee portal.

**Business Value:** Provides a simple, scalable way to distribute policy information to employees without complex configuration.

**User Value:** Empowers administrators to quickly upload policy documents that are immediately available to employees, enabling employees to understand their policy features and coverage details.

**Module Type:** Core

---

## 2. Scope & Boundaries

### In Scope:

- Admin uploads policy feature documents via Portal Configuration in IIRM portal
- Entry point: "Upload Policy Features" card in Policy Details screen's Portal Configuration section
- Each specific policy has its own Policy Details screen and Portal Configuration
- PDF format only, maximum 25 MB file size
- One active document per specific policy with upload/replace functionality
- Upload history tracking for all uploaded/replaced documents
- Employee access via "Policy Features" button on dashboard
- Policy selection for employees with multiple enrollments
- Each policy has unique features requiring separate documentation

---

## 3. User Personas, Context & User Flows

### Persona 1: Admin

**Context:**
- Logs into IIRM portal
- Manages policy documents
- Uploads documents during policy setup or when updates are needed

**User Flow - Upload Document:**
1. Login to IIRM portal
2. Navigate to specific Policy Details screen
3. Click "Portal Configuration"
4. View "Upload Policy Features" card
5. Click "Upload File" CTA
6. Select PDF file via browser (max 25 MB)
7. System validates file type and size
8. Click Upload button
9. System saves document and displays success message: "Policy features document uploaded successfully"
10. Card updates to show: Status "Document Uploaded", Last Uploaded with date and time, Uploader Name with admin's name, "Replace Document" CTA, and enabled "View" CTA

**User Flow - Replace Document:**
1. Navigate to Policy Details > Portal Configuration
2. Click "Replace Document" CTA on card
3. View confirmation message: "Replacing this document will make the new version available to all employees. The current document will be moved to upload history. Do you want to continue?"
4. Confirm and select new PDF file
5. System validates and replaces document
6. Previous document moved to upload history
7. Success message displayed: "Policy features document replaced successfully"

**User Flow - View Document & Upload History:**
1. Click "View" CTA on "Upload Policy Features" card
2. Document viewer opens with PDF display
3. View document and use "Download" button if needed
4. Click "Upload History" CTA on viewer
5. View table of all previously uploaded documents
6. Download any historical version if needed
7. Click close button (X) to return to Portal Configuration

### Persona 2: Employee

**Context:**
- Logs into employee portal
- Enrolled in one or more policies
- Needs to understand policy features and coverage

**User Flow - Single Policy:**
1. Login to employee portal
2. Click "Policy Features" button on dashboard
3. System opens Documents screen with main tabs: "Policy Feature" and "TPA Card"
4. "Policy Feature" tab is selected by default (since user clicked Policy Features)
5. Policy Feature document displays in viewer
6. User can switch to "TPA Card" tab to view TPA card document
7. View PDF with zoom and navigation controls
8. Download document if needed
9. Close viewer using close icon (X)

**User Flow - Multiple Policies:**
1. Login to employee portal
2. Click "Policy Features" button on dashboard
3. System opens Documents screen with main tabs: "Policy Feature" and "TPA Card"
4. "Policy Feature" tab is selected by default
5. System detects multiple policy enrollments
6. Sub-tabs appear showing each policy (e.g., "#12345 - GMC", "#67890 - GTL")
7. First policy's document displays by default
8. User can click on other policy sub-tabs to view different policy documents
9. User can switch to "TPA Card" main tab (which will also have policy sub-tabs if multiple policies)
10. View PDF with zoom and navigation controls
11. Download document if needed
12. Close viewer using close icon (X)

---

## 4. User Interface

### Screen 1: Admin - Upload Policy Features Card (Portal Configuration)

**Location:** Policy Details > Portal Configuration

**Card Elements:**
- Card title: "Policy Features" with icon
- Status: "Document Uploaded" (if document exists) or "Not Uploaded" (if no document)
- Last Uploaded: Date (if document exists) or "-" (if no document)
- Uploader Name: Name of user who uploaded (if document exists) or "-" (if no document)
- Card description: "Upload policy features document for employees" (shown only when no document exists)
- "Upload File" CTA (shown when no document exists)
- "Replace Document" CTA (shown when document exists)
- "View" CTA (disabled when no document, enabled when document exists)

**Upload/Replace Modal:**
- File upload area with browse button
- Format indicator: "PDF only"
- Size limit indicator: "Max 25 MB"
- Cancel and Upload buttons

### Screen 2: Admin - Document Viewer

**Location:** Accessed via "View" CTA on Upload Policy Features card

**Elements:**
- PDF document display
- "Download" CTA button
- "Upload History" CTA button
- Close button to return to Portal Configuration

### Screen 3: Admin - Upload History Panel

**Location:** Accessed via "Upload History" CTA on document viewer

**Elements:**
- Table with columns: Document Name | Uploaded By | Timestamp | Actions
- Each row displays:
  - Document filename
  - Uploader name
  - Upload date and time
  - "Download" action button
- Close button

### Screen 4: Employee - Dashboard

**Elements:**
- "Policy Features" button prominently displayed

### Screen 5: Employee - Documents Screen with Tabs

**Location:** Opened when employee clicks "Policy Features" button

**Elements:**

**Main Tabs (Horizontal):**
- "Policy Feature" tab
- "TPA Card" tab
- "Policy Feature" tab selected by default

**Sub-tabs (if employee has multiple policies):**
- Displayed below main tabs
- Each sub-tab shows: Policy number and type (e.g., "#12345 - GMC", "#67890 - GTL")
- First policy sub-tab selected by default
- User can click on any policy sub-tab to view that policy's document

**Document Viewer Area:**
- PDF document display with zoom and navigation controls
- "Download" CTA button
- Close icon (X) to close entire documents screen
- Placeholder message if no document uploaded: "Features document for this policy will be available soon"
- "Back to Policy List" button (shown only if employee has multiple policies)
- Placeholder message: "Features document for this policy will be available soon" (shown if no document uploaded)

---

## 5. Functional Requirements

### FR-001: Document Upload by Policy

**Description:** System allows administrators to upload policy feature documents for each specific policy via Portal Configuration.

**Rules:**
- Each policy has one active document
- Supported format: PDF only
- Maximum file size: 25 MB
- New upload replaces previous active document
- Replaced documents retained in upload history
- Each policy has its own Policy Details screen and Portal Configuration

### FR-002: Document Display in Employee Portal

**Description:** Policy documents accessible from employee portal dashboard with policy selection for multiple enrollments.

**Rules:**
- "Policy Features" button visible on employee dashboard
- Employee sees only policies they are enrolled in
- Single policy enrollment: direct document display
- Multiple policy enrollments: policy selection screen first
- Policy selection shows policy number, policy name, and policy type

### FR-003: Portal Configuration Entry Point

**Description:** Access to document upload functionality through Portal Configuration in Policy Details screen.

**Rules:**
- "Upload Policy Features" card displayed in Portal Configuration
- "Upload File" CTA shown when no document exists
- "Replace Document" CTA shown when document exists
- "View" CTA disabled when no document, enabled when document exists
- Upload timestamp displayed on card when document exists

### FR-004: Upload History Tracking

**Description:** System maintains history of all uploaded and replaced documents.

**Rules:**
- All uploaded documents retained in history when replaced
- History displays in reverse chronological order (newest first)
- Each entry includes: filename, upload date/time, uploader name, file size, status (active/replaced)
- Administrators can view and download historical documents
- Only one document marked as "Active" at a time
- Replaced documents marked as "Replaced" with replacement timestamp
- History is policy-specific

### FR-005: Document Tabs and Multi-Policy Support

**Description:** Employees access documents through tab-based interface with sub-tabs for multiple policy enrollments.

**Rules:**
- Documents screen displays main tabs: "Policy Feature" and "TPA Card"
- "Policy Feature" tab selected by default when accessed via Policy Features button
- If employee has multiple policies, sub-tabs display below main tabs
- Each sub-tab shows policy number and type (e.g., "#12345 - GMC")
- First policy sub-tab selected by default
- Employee can switch between policy sub-tabs to view different policy documents
- Sub-tabs apply to all main tabs (Policy Feature and TPA Card)
- Policies without documents show placeholder message in viewer area
- Employee can switch between main tabs and policy sub-tabs without closing screen

---

## 6. User Stories

### Admin Stories

**US-001: Upload Policy Documents**
- **Priority:** High
- **As an Admin**, I want to upload policy feature documents for each specific policy so that employees see their policy-specific information
- **Acceptance Criteria:**
  - Given I log into IIRM portal, when I navigate to Policy Details > Portal Configuration, then I see "Upload Policy Features" card
  - Given I upload a document, when I save, then system validates file type (PDF only) and size (max 25 MB)

**US-002: Replace Policy Documents**
- **Priority:** High
- **As an Admin**, I want to replace policy feature documents so that employees always have current information
- **Acceptance Criteria:**
  - Given an existing document, when I click "Replace Document", then I can upload a new document
  - Given I click "Replace Document", when upload popup opens, then I see confirmation message: "Replacing this document will make the new version available to all employees. The current document will be moved to upload history. Do you want to continue?"
  - Given I replace a document, when employees view the policy, then they see the updated document immediately

**US-003: View Uploaded Documents**
- **Priority:** Medium
- **As an Admin**, I want to view uploaded documents so that I can verify what employees will see
- **Acceptance Criteria:**
  - Given I uploaded a document, when I click "View" CTA, then document displays in viewer
  - Given no document uploaded, when I view the card, then "View" CTA is disabled
  - Given I upload a document, when upload completes, then "Upload File" CTA changes to "Replace Document"

**US-004: View Upload History**
- **Priority:** Medium
- **As an Admin**, I want to view upload history so that I can see all previously uploaded documents
- **Acceptance Criteria:**
  - Given I am viewing a document, when I click "Upload History" CTA, then I see list of all previously uploaded documents with timestamps
  - Given I view upload history, when I see a document entry, then I see filename, upload date, uploader name, and file size
  - Given I am viewing upload history, when I click on a document entry, then I can download that historical document

### Employee Stories

**US-005: Access Documents via Tabs**
- **Priority:** High
- **As an Employee**, I want to access policy documents through a tabbed interface so that I can easily navigate between different document types
- **Acceptance Criteria:**
  - Given I am logged into employee portal, when I view dashboard, then I see "Policy Features" button
  - Given I click "Policy Features" button, when documents screen opens, then I see main tabs "Policy Feature" and "TPA Card"
  - Given documents screen opens, when I view it, then "Policy Feature" tab is selected by default

**US-006: View Single Policy Documents**
- **Priority:** High
- **As an Employee**, I want to view my policy documents when I have only one policy so that I can access my information
- **Acceptance Criteria:**
  - Given I am enrolled in only one policy, when I click "Policy Features", then documents screen opens with "Policy Feature" tab selected
  - Given I have one policy, when documents screen opens, then I see no policy sub-tabs
  - Given I am viewing Policy Feature tab, when I view it, then I see PDF document with zoom controls and download option
  - Given I am on documents screen, when I click "TPA Card" tab, then TPA card document displays

**US-007: Navigate Multiple Policies via Sub-tabs**
- **Priority:** High
- **As an Employee**, I want to navigate between my multiple policies using sub-tabs so that I can easily view different policy documents
- **Acceptance Criteria:**
  - Given I am enrolled in multiple policies, when I click "Policy Features", then documents screen opens with "Policy Feature" tab selected
  - Given I have multiple policies, when documents screen opens, then I see policy sub-tabs below main tabs showing each policy (e.g., "#12345 - GMC", "#67890 - GTL")
  - Given policy sub-tabs are displayed, when screen loads, then first policy sub-tab is selected by default
  - Given I am viewing one policy's document, when I click on another policy sub-tab, then that policy's document displays
  - Given I switch to "TPA Card" main tab, when tab loads, then same policy sub-tabs appear for TPA cards

**US-008: View and Download Documents**
- **Priority:** High
- **As an Employee**, I want to view and download policy documents so that I can reference them when needed
- **Acceptance Criteria:**
  - Given I am on documents screen, when I view a document, then I see PDF display with zoom and navigation controls
  - Given I am viewing a document, when I look at the screen, then I see close icon (X) and "Download" button
  - Given I click close icon, when clicked, then entire documents screen closes and I return to dashboard
  - Given I click "Download", when clicked, then PDF downloads to my device with original filename

---

## 7. Edge Cases & Business Rules

### Document Upload Validation

**Rule:** System must validate file format and size before accepting upload

**Edge Cases:**
- **File Size Exceeds 25MB:**
  - Description: Admin attempts to upload document larger than 25 MB
  - Business Logic: Reject upload, show error message
  - User Impact: Admin sees error: "File size exceeds 25 MB limit. Please reduce the file size and try again."

- **Non-PDF File Upload Attempt:**
  - Description: Admin attempts to upload DOCX, DOC, or other non-PDF file
  - Business Logic: Reject upload with clear error message
  - User Impact: Admin sees error: "Only PDF files are supported. Please convert your document to PDF format and try again."

### CTA Visibility Validation

**Rule:** CTA buttons must display based on document existence

**Business Logic:**
- "Upload File" CTA: Shown only when no document exists for the policy
- "Replace Document" CTA: Shown only when document exists for the policy
- "View" CTA: Disabled when no document exists, enabled when document exists

### Card Elements Validation

**Rule:** Card must display appropriate information based on document status

**Business Logic:**
- Status: "Document Uploaded" when document exists, "Not Uploaded" when no document
- Last Uploaded: Display date and time when document exists, display "-" when no document
- Uploader Name: Display name of user who uploaded when document exists, display "-" when no document
- Card description: "Upload policy features document for employees" shown only when no document exists

### Document Viewer Screen Validation

**Rule:** Document viewer must display correct elements based on user role

**Admin Viewer:**
- PDF document display
- "Download" CTA button
- "Upload History" CTA button
- Close button to return to Portal Configuration

**Employee Documents Screen:**
- Main tabs: "Policy Feature" and "TPA Card" (horizontal)
- "Policy Feature" tab selected by default when accessed via Policy Features button
- Policy sub-tabs displayed below main tabs if employee has multiple policies
- PDF document display with zoom and navigation controls in viewer area
- "Download" CTA button
- Close icon (X) to close entire documents screen
- Placeholder message if no document: "Features document for this policy will be available soon"

### Tab Display Validation

**Rule:** System must display tabs and sub-tabs based on employee's policy count

**Business Logic:**
- Main tabs always visible: "Policy Feature" and "TPA Card"
- If employee has 1 policy: No sub-tabs displayed
- If employee has multiple policies: Sub-tabs displayed below main tabs
- Each sub-tab shows: Policy number and type (e.g., "#12345 - GMC")
- First policy sub-tab selected by default
- Sub-tabs persist across main tab switches

### Downloaded Document Name Validation

**Rule:** Downloaded document must use original filename uploaded by admin

**Business Logic:**
- System preserves original filename when document is uploaded
- When employee clicks "Download", file downloads with original filename
- No automatic renaming or modification of filename
- Special characters in filename (except dash, underscore, dot) not allowed during upload

---

