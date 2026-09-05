# Inception / Endorsement — Test Case Suite

**Document Version:** 1.1
**Date:** 2026-05-08
**Jira Reference:** IIRM-10101
**PRD Reference:** `hr-portal-inception-endorsement-prd.md`
**SDS Reference:** `hr-portal-inception-endorsement-sds.md`
**TRD Reference:** `hr-portal-inception-endorsement-trd.md`

---

## Table of Contents

1. [Functional Test Cases](#1-functional-test-cases)
2. [Edge Test Cases](#2-edge-test-cases)
3. [Negative Test Cases](#3-negative-test-cases)
4. [Security Test Cases](#4-security-test-cases)
5. [Performance Test Cases](#5-performance-test-cases)
6. [Integration Test Cases](#6-integration-test-cases)
7. [Accessibility Test Cases](#7-accessibility-test-cases)
8. [Regression Test Cases](#8-regression-test-cases)
9. [Data Integrity Test Cases](#9-data-integrity-test-cases)
10. [API Test Cases](#10-api-test-cases)

---

## Summary Table

| TC ID | Title | Category | Priority | Status |
|-------|-------|----------|----------|--------|
| TC-FUNC-001 | Upload valid .xlsx file (employee only) | Functional | Critical | — |
| TC-FUNC-002 | Upload valid .csv file (employee + dependents) | Functional | Critical | — |
| TC-FUNC-003 | Upload form — all required fields present | Functional | Critical | — |
| TC-FUNC-004 | Data Type dropdown changes file schema and template | Functional | High | — |
| TC-FUNC-005 | Template download for selected data type | Functional | High | — |
| TC-FUNC-006 | Processing status shows "in progress" after upload | Functional | High | — |
| TC-FUNC-007 | Processing status transitions to Success on completion | Functional | Critical | — |
| TC-FUNC-008 | Processing status transitions to Failed on file-level error | Functional | Critical | — |
| TC-FUNC-009 | Upload history lists all uploads for selected endorsement | Functional | Critical | 🔁 Updated |
| TC-FUNC-010 | Overview Block displays Net Gross Premium and Total Endorsements | Functional | High | 🔁 Updated |
| TC-FUNC-011 | Upload detail expands inline without additional API call | Functional | High | — |
| TC-FUNC-012 | Partial success — valid rows committed, invalid rows skipped | Functional | Critical | — |
| TC-FUNC-013 | Multiple uploads allowed for the same policy | Functional | High | — |
| TC-FUNC-014 | Navigate away during processing and return to retrieve result | Functional | High | — |
| TC-FUNC-015 | Empty upload history shows empty state message | Functional | Medium | — |
| TC-FUNC-016 | Pagination controls work correctly on upload history table | Functional | Medium | 🔁 Updated |
| TC-FUNC-017 | Upload history ordered by submission date descending | Functional | High | — |
| TC-FUNC-018 | Upload summary fields populated correctly after processing | Functional | Critical | — |
| TC-FUNC-019 | File name column download icon downloads original file | Functional | Medium | — |
| TC-FUNC-020 | Refresh action reloads processing status and table | Functional | High | — |
| TC-FUNC-021 | Section 0 upload triggers immediate refresh of all display sections | Functional | High | New |
| TC-FUNC-022 | Per-card upload form disabled and amber banner shown when Step 2 completed | Functional | High | New |
| TC-FUNC-023 | Section 0 upload and template buttons disabled when endorsement list is empty | Functional | High | New |
| TC-EDGE-001 | File exactly at 10 MB size limit | Edge | High | — |
| TC-EDGE-002 | File with header row only (zero data rows) | Edge | High | — |
| TC-EDGE-003 | All rows fail row-level validation — outcome is Success | Edge | High | — |
| TC-EDGE-004 | Single valid employee row, relationship-enabled template | Edge | Medium | — |
| TC-EDGE-005 | Employee ID appears exactly twice (first kept, second skipped) | Edge | High | — |
| TC-EDGE-006 | DOB exactly 100 years ago (boundary — valid) | Edge | Medium | — |
| TC-EDGE-007 | DOB is today's date (boundary — invalid future/present) | Edge | Medium | — |
| TC-EDGE-008 | File with 5 000 rows (max performance boundary) | Edge | High | — |
| TC-EDGE-009 | Dependent row with no corresponding employee in file | Edge | High | — |
| TC-EDGE-010 | Upload history with exactly 10 rows (default page size boundary) | Edge | Low | 🔁 Updated |
| TC-EDGE-011 | File with optional columns absent from template | Edge | Medium | — |
| TC-EDGE-012 | enrollmentEndDate same as enrollmentStartDate | Edge | Medium | — |
| TC-NEG-001 | Upload unsupported file type (.pdf) | Negative | Critical | — |
| TC-NEG-002 | Upload file exceeding 10 MB | Negative | Critical | — |
| TC-NEG-003 | Upload empty file (no bytes) | Negative | High | — |
| TC-NEG-004 | File missing mandatory column headers | Negative | Critical | — |
| TC-NEG-005 | File contains no employee-type rows | Negative | High | — |
| TC-NEG-006 | Mandatory row field is blank | Negative | High | — |
| TC-NEG-007 | Invalid email format in row | Negative | High | — |
| TC-NEG-008 | Mobile number with 9 digits | Negative | High | — |
| TC-NEG-009 | Date of birth is a future date | Negative | High | — |
| TC-NEG-010 | Gender value not in policy-accepted set | Negative | Medium | — |
| TC-NEG-011 | Sum insured tier not matching any active sub-plan | Negative | Medium | — |
| TC-NEG-012 | Relationship value not in policy-accepted set | Negative | Medium | — |
| TC-NEG-013 | Submit upload form without selecting Data Type | Negative | High | — |
| TC-NEG-014 | Submit upload form without a file attached | Negative | High | — |
| TC-NEG-015 | Upload file for a policy belonging to a different company | Negative | Critical | — |
| TC-NEG-016 | Template download when template is unavailable | Negative | Medium | — |
| TC-SEC-001 | Unauthenticated request to file upload endpoint | Security | Critical | — |
| TC-SEC-002 | HR_VIEWER role attempts to upload a file | Security | Critical | — |
| TC-SEC-003 | HR_ADMIN accesses summary for another company's policy | Security | Critical | — |
| TC-SEC-004 | Tampered JWT — modified companyId claim | Security | Critical | — |
| TC-SEC-005 | Path traversal attempt in uploaded file name | Security | High | — |
| TC-SEC-006 | SQL injection in enrollmentStartDate field | Security | High | — |
| TC-SEC-007 | XSS payload in file name field | Security | High | — |
| TC-SEC-008 | Expired JWT token on file upload request | Security | Critical | — |
| TC-SEC-009 | HR_VIEWER role attempts to access POST enrollment-upload | Security | High | — |
| TC-SEC-010 | Oversized multipart payload (file content attack) | Security | High | — |
| TC-PERF-001 | File upload API response within 3 seconds | Performance | Critical | — |
| TC-PERF-002 | Processing 5 000 rows completes within 2 minutes | Performance | Critical | — |
| TC-PERF-003 | Upload history loads within 2 seconds | Performance | High | 🔁 Updated |
| TC-PERF-004 | Upload detail expansion with no additional API latency | Performance | High | — |
| TC-PERF-005 | Concurrent uploads from 10 HR Admins simultaneously | Performance | High | — |
| TC-PERF-006 | Scheduler atomic claim under concurrent scheduler instances | Performance | Critical | — |
| TC-INT-001 | Phase 1 → Phase 2 flow: documentId passed correctly | Integration | Critical | — |
| TC-INT-002 | Scheduler picks up CREATED record within poll interval | Integration | Critical | — |
| TC-INT-003 | Summary endpoint returns correct aggregation across uploads | Integration | Critical | — |
| TC-INT-004 | Object storage download failure sets status to FAILED | Integration | High | — |
| TC-INT-005 | Redis enrollment batch key set and consumed correctly | Integration | High | — |
| TC-INT-006 | Error file generated in S3 and linked in summary record | Integration | High | — |
| TC-INT-007 | Frontend poll loop reflects COMPLETED status on refresh | Integration | High | — |
| TC-INT-008 | New endorsement created when endorsementId not provided | Integration | High | — |
| TC-INT-009 | Existing endorsement updated when endorsementId provided | Integration | High | — |
| TC-ACC-001 | Upload form fields have visible and accessible labels | Accessibility | High | — |
| TC-ACC-002 | File rejection error messages read by screen readers | Accessibility | High | — |
| TC-ACC-003 | File upload area is keyboard-accessible | Accessibility | High | — |
| TC-ACC-004 | Processing status messages are announced by screen readers | Accessibility | Medium | — |
| TC-ACC-005 | Upload history table supports keyboard navigation | Accessibility | Medium | — |
| TC-ACC-006 | KPI card values have accessible text alternatives | Accessibility | Medium | — |
| TC-ACC-007 | Tab layout is usable on a tablet viewport (768 px) | Accessibility | Medium | — |
| TC-REG-001 | Previously uploaded files remain accessible after new upload | Regression | High | — |
| TC-REG-002 | KPI totals remain correct after page refresh | Regression | High | — |
| TC-REG-003 | Upload history sort order preserved after submitting a new file | Regression | High | — |
| TC-REG-004 | Processing result retrievable after navigate-away-and-return | Regression | High | — |
| TC-REG-005 | File-level rejection does not create upload record in history | Regression | Critical | — |
| TC-REG-006 | Partial success does not duplicate valid rows on retry | Regression | High | — |
| TC-DAT-001 | Duplicate employee ID: first occurrence processed, rest skipped | Data Integrity | Critical | — |
| TC-DAT-002 | UPSERT prevents duplicate member records on scheduler retry | Data Integrity | Critical | — |
| TC-DAT-003 | Error file contains all failing rows with correct Remarks codes | Data Integrity | High | — |
| TC-DAT-004 | Audit trail — created_by and created_at set from JWT | Data Integrity | Critical | — |
| TC-DAT-005 | Enrollment dates stored on both Endorsement and DocumentProcessingFile | Data Integrity | High | — |
| TC-DAT-006 | processCount equals successCount + errorCount | Data Integrity | High | — |
| TC-DAT-007 | Upload record deleted if file-level validation fails (no record written) | Data Integrity | Critical | — |
| TC-DAT-008 | Company isolation — upload visible only to owning company | Data Integrity | Critical | — |
| TC-API-001 | GET request to POST-only file upload endpoint returns 405 | API | High | — |
| TC-API-002 | POST enrollment-upload without documentId returns 400 | API | High | — |
| TC-API-003 | POST enrollment-upload with non-existent policyId returns 404 | API | High | — |
| TC-API-004 | Malformed JSON body to enrollment-upload endpoint returns 400 | API | High | — |
| TC-API-005 | Missing Authorization header returns 401 | API | Critical | — |
| TC-API-006 | Summary endpoint with page=0 applies default pagination | API | Medium | — |
| TC-API-007 | Summary endpoint for non-existent endorsementId returns empty data | API | Medium | — |
| TC-API-008 | Summary endpoint with tpaData=true returns only TPA upload records | API | Medium | — |
| TC-API-009 | Summary endpoint with usePolicyAssetEndorsement=true joins correctly | API | Medium | — |
| TC-API-010 | Multipart upload with no file part returns 400 | API | High | — |

---

## 1. Functional Test Cases

### TC-FUNC-001 — Upload valid .xlsx file (employee only)

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin is authenticated. Policy exists and is scoped to the Admin's company. Policy template has `relationship: false`.
**Test Data:** Valid `.xlsx` file with header row matching the policy template; 10 employee rows; all mandatory fields populated with valid values. Enrollment Start Date: 2026-01-01, End Date: 2026-12-31, Number of Employees: 10, Number of Dependents: 0, Data Type: "Employee Data Only".

**Test Steps:**
1. Navigate to Dashboard → select policy → open Inception / Endorsement tab.
2. Fill in all Upload Form fields (Enrollment Start Date, End Date, Number of Employees, Number of Dependents, Data Type).
3. Attach the valid `.xlsx` file in the file upload area.
4. Submit the upload form.
5. Poll the Data Processing Status section or click Refresh until status is no longer "in progress".

**Expected Result:** Processing status transitions to "Data processing is complete. You can upload more files above." Upload history shows one new entry with Status = Success, Successfully Processed = 10, Failed / Skipped = 0. KPI cards increment Total Records by 10 and Success by 10.

---

### TC-FUNC-002 — Upload valid .csv file (employee + dependents)

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin is authenticated. Policy template has `relationship: true`. Accepted relationship values include Spouse and Child.
**Test Data:** Valid `.csv` file (UTF-8); 5 employee rows; 3 dependent rows (2 Spouse, 1 Child); each dependent references a valid employee in the same file. Data Type: "Employee + Dependents Data".

**Test Steps:**
1. Navigate to the Inception / Endorsement tab for the policy.
2. Select Data Type "Employee + Dependents Data".
3. Attach the `.csv` file and submit the form.
4. Refresh the status section until processing completes.

**Expected Result:** Status = Success. Upload summary shows Employees = 5, Dependents = 3, Successfully Processed = 8, Failed / Skipped = 0. Dependent records are linked to the correct employee records in the database.

---

### TC-FUNC-003 — Upload form — all required fields present

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin is on the Inception / Endorsement tab.
**Test Data:** Valid values for Enrollment Start Date, End Date, Number of Employees, Number of Dependents, Data Type.

**Test Steps:**
1. Open the Inception / Endorsement tab.
2. Verify that five form fields are visible: Enrollment Start Date, Enrollment End Date, Number of Employees, Number of Dependents, Data Type.
3. Confirm each field is marked as required.
4. Confirm no policy selection field is shown (policy is inherited from navigation context).

**Expected Result:** All five fields are present and marked required. No policy selector is displayed. The file upload area is visible to the right of the form fields.

---

### TC-FUNC-004 — Data Type dropdown changes file schema and template

**Category:** Functional
**Priority:** High
**Preconditions:** Policy has templates for both "Employee Data Only" and "Employee + Dependents Data".
**Test Data:** Switch between the two Data Type options.

**Test Steps:**
1. Select Data Type "Employee Data Only".
2. Click Download Template and inspect the downloaded file headers.
3. Switch Data Type to "Employee + Dependents Data".
4. Click Download Template and inspect the updated file headers.

**Expected Result:** The downloaded template for "Employee Data Only" contains employee-only headers (no relationship column). The template for "Employee + Dependents Data" includes a relationship column. Each template reflects the correct schema for the selected data type.

---

### TC-FUNC-005 — Template download for selected data type

**Category:** Functional
**Priority:** High
**Preconditions:** A valid template is configured for the policy.
**Test Data:** Data Type set to any valid option.

**Test Steps:**
1. Select a Data Type from the dropdown.
2. Click the Download Template link.

**Expected Result:** A file download begins. The downloaded file is a valid `.xlsx` or `.csv` with column headers matching the template for the selected policy and data type.

---

### TC-FUNC-006 — Processing status shows "in progress" after upload

**Category:** Functional
**Priority:** High
**Preconditions:** HR Admin has submitted a valid file. Scheduler has not yet picked up the record.
**Test Data:** Valid upload submitted immediately before the scheduler's 2-minute poll cycle.

**Test Steps:**
1. Submit a valid file upload.
2. Immediately view the Data Processing Status section (before the scheduler runs).

**Expected Result:** Status displays "Data processing is in progress." A Refresh action is available.

---

### TC-FUNC-007 — Processing status transitions to Success on completion

**Category:** Functional
**Priority:** Critical
**Preconditions:** A file with no row-level errors has been submitted and the scheduler has completed processing.
**Test Data:** File with 20 fully valid rows.

**Test Steps:**
1. Submit a valid file.
2. Wait for the scheduler to process (up to 2 minutes) or click Refresh.

**Expected Result:** Status changes to "Data processing is complete. You can upload more files above." Upload history entry for this upload shows Status = Success.

---

### TC-FUNC-008 — Processing status transitions to Failed on file-level error

**Category:** Functional
**Priority:** Critical
**Preconditions:** HR Admin submits a file that passes client-side checks but fails a file-level server check.
**Test Data:** File with an unsupported internal format detected server-side.

**Test Steps:**
1. Submit a file that is structurally invalid (e.g., corrupted Excel).
2. Refresh the Data Processing Status section.

**Expected Result:** Status displays "Data processing failed. {reason}. Please correct the file and try again." Upload history entry shows Status = Failed. No member records are written.

---

### TC-FUNC-009 — Upload history lists all uploads for selected endorsement

🔁 **Updated** — Column names corrected to match SDS §8.5; scope updated from policy-level to per-endorsement.

**Category:** Functional
**Priority:** Critical
**Preconditions:** Three uploads have already been submitted for a specific endorsement card (mix of Success and Failed outcomes). HR Admin expands that endorsement card.
**Test Data:** Three upload records with different outcomes scoped to one endorsement.

**Test Steps:**
1. Navigate to the Inception / Endorsement tab.
2. Expand an endorsement card in the Individual Endorsements accordion (Section 4).
3. Scroll to the Uploaded Files Table within the expanded card.

**Expected Result:** All three uploads are listed. Each row displays the following seven columns: Upload Date (DD/MM/YYYY HH:MM), File Name (with download icon), Total Records (numeric), Success (numeric, green text), Failed (numeric, red text), Error File (download icon, active only when error count > 0), Status (chip: Processing / Completed / Failed). Upload history is scoped to this endorsement only — uploads from other endorsements are not shown.

---

### TC-FUNC-010 — Overview Block displays Net Gross Premium and Total Endorsements

🔁 **Updated** — Rewritten to test the actual Overview Block (SDS §5 / `endorsement_overview` endpoint). The previous version incorrectly tested a non-existent three-card KPI row; the Overview Block contains exactly two stat tiles.

**Category:** Functional
**Priority:** High
**Preconditions:** Policy has multiple completed endorsement records. The `endorsement_overview` admin_reports endpoint is seeded with data for this policy. HR Admin is on the Endorsement tab.
**Test Data:** Policy with Net Gross Premium = ₹2,50,000 and 4 total endorsement records.

**Test Steps:**
1. Navigate to the Endorsement tab.
2. Observe Section 1 — Overview Block at the top of the tab.
3. Read the values in both stat tiles.

**Expected Result:** Exactly two stat tiles are shown side by side. Tile 1 displays label "Net Gross Premium" with a formatted currency value of ₹2,50,000. Tile 2 displays label "Total Endorsements" with a count of 4. No third tile is shown. Data is sourced from the `endorsement_overview` admin_reports endpoint.

---

### TC-FUNC-011 — Upload detail expands inline without additional API call

**Category:** Functional
**Priority:** High
**Preconditions:** At least one completed upload exists with row-level errors. Network monitoring tool is active.
**Test Data:** Upload with successCount = 40, errorCount = 10.

**Test Steps:**
1. Open the Inception / Endorsement tab.
2. Open browser developer tools → Network panel.
3. Click to expand the upload record in the table.

**Expected Result:** The error breakdown (grouped by error code with counts), total/success/failure counts, submission and completion timestamps, and Uploaded By are displayed. No additional API call is fired in the Network panel.

---

### TC-FUNC-012 — Partial success — valid rows committed, invalid rows skipped

**Category:** Functional
**Priority:** Critical
**Preconditions:** Policy template configured. Scheduler is running.
**Test Data:** File with 15 valid employee rows and 5 rows with MISSING_FIELD errors.

**Test Steps:**
1. Submit the file.
2. Wait for processing to complete.
3. View the upload summary.

**Expected Result:** Processing outcome = Success. Successfully Processed = 15, Failed / Skipped = 5. Failure Reasons shows `MISSING_FIELD: 5`. Member records exist for all 15 valid rows.

---

### TC-FUNC-013 — Multiple uploads allowed for the same policy

**Category:** Functional
**Priority:** High
**Preconditions:** Policy exists with one existing upload in history.
**Test Data:** Two additional valid files to upload sequentially.

**Test Steps:**
1. Submit a second file for the same policy.
2. Submit a third file for the same policy.
3. View the upload history.

**Expected Result:** All three uploads appear in the history. No restriction is applied. The system accepts each without error.

---

### TC-FUNC-014 — Navigate away during processing and return to retrieve result

**Category:** Functional
**Priority:** High
**Preconditions:** A valid file has been submitted and is in CREATED or PROCESSING status.
**Test Data:** Valid 50-row file.

**Test Steps:**
1. Submit the file upload.
2. Before processing completes, navigate to the HR Portal Dashboard.
3. Wait 2–3 minutes for processing to complete.
4. Navigate back to the same policy's Inception / Endorsement tab.

**Expected Result:** Processing status reflects the completed result (Success or Failed). The upload record appears in the history with correct counts. Processing was not interrupted by the navigation.

---

### TC-FUNC-015 — Empty upload history shows empty state message

**Category:** Functional
**Priority:** Medium
**Preconditions:** The selected policy has no upload history.
**Test Data:** A newly created policy with no prior uploads.

**Test Steps:**
1. Navigate to the Inception / Endorsement tab for the policy.
2. View the Uploaded Data Table section.

**Expected Result:** Empty state is shown with heading "No uploads yet" and sub-text "Upload a member data file using the form above." No error is raised.

---

### TC-FUNC-016 — Pagination controls work correctly on upload history table

🔁 **Updated** — Default page size corrected from 20 to 10 per TRD §5.1 (`limit` default = 10) and SDS §8.5. Test data updated from 45 to 25 records to produce a clean three-page scenario at the correct page size.

**Category:** Functional
**Priority:** Medium
**Preconditions:** An endorsement card has 25 upload records in its Uploaded Files Table. HR Admin has expanded that card.
**Test Data:** 25 seeded upload records for a single endorsement.

**Test Steps:**
1. Expand the endorsement card.
2. Observe the Uploaded Files Table and pagination footer.
3. Click Next to move to page 2.
4. Click Next again to move to page 3.
5. Click Previous to move back to page 2.

**Expected Result:** Page 1 shows 10 rows; footer reads "Showing 10 of 25 entries." Page 2 shows 10 rows. Page 3 shows 5 rows. Previous navigates correctly back to page 2.

---

### TC-FUNC-017 — Upload history ordered by submission date descending

**Category:** Functional
**Priority:** High
**Preconditions:** Three uploads exist with submission timestamps T1 < T2 < T3.
**Test Data:** Uploads submitted at different times.

**Test Steps:**
1. Navigate to the Inception / Endorsement tab.
2. Inspect the order of rows in the Uploaded Data Table.

**Expected Result:** The most recent upload (T3) appears first; the oldest (T1) appears last. Default sort is `submitted_at` descending.

---

### TC-FUNC-018 — Upload summary fields populated correctly after processing

**Category:** Functional
**Priority:** Critical
**Preconditions:** A file with mixed valid/invalid rows has completed processing.
**Test Data:** File with 10 employee rows, 5 dependent rows; 3 rows have INVALID_EMAIL_FORMAT; 2 rows have MISSING_FIELD.

**Test Steps:**
1. Submit the file and wait for completion.
2. View the upload summary for this upload record.

**Expected Result:** Total Records = 15, Employees = 10, Dependents = 5, Successfully Processed = 10, Failed / Skipped = 5, Failure Reasons = `INVALID_EMAIL_FORMAT: 3, MISSING_FIELD: 2`. Upload Timestamp and Uploaded By are populated.

---

### TC-FUNC-019 — File name column download icon downloads original file

**Category:** Functional
**Priority:** Medium
**Preconditions:** At least one completed upload exists.
**Test Data:** Uploaded file "members_q1.xlsx".

**Test Steps:**
1. Locate the upload in the history table.
2. Click the download icon in the File Name column.

**Expected Result:** The original uploaded file (`members_q1.xlsx`) is downloaded. The file contents match what was originally uploaded.

---

### TC-FUNC-020 — Refresh action reloads processing status and table

**Category:** Functional
**Priority:** High
**Preconditions:** A file is in PROCESSING state. Scheduler is about to complete.
**Test Data:** Upload in PROCESSING status.

**Test Steps:**
1. View the Data Processing Status section showing "in progress."
2. Wait for the scheduler to complete processing.
3. Click the Refresh action.

**Expected Result:** The Data Processing Status updates to the completed state message. The Uploaded Data Table reloads and shows the updated entry with correct counts and Status.

---

### TC-FUNC-021 — Section 0 upload triggers immediate refresh of all display sections

**Category:** Functional
**Priority:** High
**Preconditions:** HR Admin is on the Endorsement tab. The Overview Block (Section 1), Employee Information Cumulative Metrics (Section 2), Premium Information Table (Section 3), and Individual Endorsements accordion (Section 4) are all loaded with existing data. Section 0 form is fully filled.
**Test Data:** Valid `.xlsx` file for upload; all Section 0 form fields populated (Data Type, Start Date, End Date, Employee count, Dependent count).

**Test Steps:**
1. Note the current values in Section 1 (Net Gross Premium, Total Endorsements).
2. Note the current row count in Section 4 (Individual Endorsements accordion).
3. Attach a valid file in Section 0 and click Upload File.
4. Observe all four display sections immediately after the successful upload response is received.

**Expected Result:** Per BR-MDU-013, all four display sections (Overview Block, Employee Metrics, Premium Table, Individual Endorsements accordion) are immediately refreshed without requiring a manual page reload. The Total Endorsements count in Section 1 increments. The new endorsement record appears in Section 4. The Section 0 upload form resets to its initial state.

---

### TC-FUNC-022 — Per-card upload form disabled and amber banner shown when Step 2 completed

**Category:** Functional
**Priority:** High
**Preconditions:** An endorsement record exists in the accordion whose `endorsementStatus` is one of `COMPLETED`, `LOCKED`, `APPROVED`, or `FINALIZED` (Step 2 has been completed in iWork for this endorsement). HR Admin expands that card.
**Test Data:** Endorsement record with `endorsementStatus = 'COMPLETED'` returned by the `endorsement_list` endpoint.

**Test Steps:**
1. Navigate to the Endorsement tab.
2. Expand the endorsement card whose `endorsementStatus` indicates Step 2 completion.
3. Scroll to the Upload Form within the expanded card.
4. Observe the state of the Upload File button, Download Template button, and any banner messages.

**Expected Result:** Per BR-MDU-012 and SDS §8.4: An amber banner is displayed reading "Upload is disabled — Step 2 has been completed for this endorsement in iWork." Both the Upload File button and the Download Template button are disabled. The form fields (Data Type, Enrollment Dates, Counts) remain visible but the upload controls are non-interactive. No file selection dialog can be triggered.

---

### TC-FUNC-023 — Section 0 upload and template buttons disabled when endorsement list is empty

**Category:** Functional
**Priority:** High
**Preconditions:** The HR Admin's company has no endorsement records yet (or the `endorsement_list` API has not yet returned any data — e.g., list is loading or returns an empty array). Section 0 is visible at the top of the Endorsement tab.
**Test Data:** A policy with zero endorsement records; Section 0 form fields are all filled.

**Test Steps:**
1. Navigate to the Endorsement tab for a policy with no endorsements.
2. Fill in all Section 0 form fields (Data Type, Start Date, End Date, Number of Employees, Number of Dependents).
3. Observe the state of the Upload File and Download Template buttons.

**Expected Result:** Per SDS §4a, the Upload File and Download Template buttons remain disabled because no `policyId` is derivable from an empty endorsement list. Buttons are disabled regardless of whether all form fields are completed. No file selection dialog can be triggered. Once the endorsement list loads with at least one record (providing a valid `policyId`), the buttons become enabled as usual.

---

## 2. Edge Test Cases

### TC-EDGE-001 — File exactly at 10 MB size limit

**Category:** Edge
**Priority:** High
**Preconditions:** HR Admin is on the upload form.
**Test Data:** Valid `.xlsx` file precisely 10 485 760 bytes (10.00 MB) with valid headers and data rows.

**Test Steps:**
1. Attach the 10 MB file to the file upload area.
2. Submit the form.

**Expected Result:** File is accepted — no file-size rejection. Processing proceeds normally. No "File too large" error is shown.

---

### TC-EDGE-002 — File with header row only (zero data rows)

**Category:** Edge
**Priority:** High
**Preconditions:** Policy template is configured.
**Test Data:** `.xlsx` file containing only the header row; no data rows.

**Test Steps:**
1. Attach the header-only file and submit.

**Expected Result:** File is rejected at file-level with message "The selected file contains no data rows." No upload record is created. No member data is written.

---

### TC-EDGE-003 — All rows fail row-level validation — outcome is Success

**Category:** Edge
**Priority:** High
**Preconditions:** Policy template configured. Scheduler running.
**Test Data:** File with 10 rows, all missing mandatory fields.

**Test Steps:**
1. Upload the file and wait for processing.
2. View the upload summary.

**Expected Result:** Processing outcome = Success (per BR-MDU-005). Successfully Processed = 0, Failed / Skipped = 10. Failure Reasons lists applicable error codes. No member records are written. Status = COMPLETED in `document_processing_file`.

---

### TC-EDGE-004 — Single valid employee row, relationship-enabled template

**Category:** Edge
**Priority:** Medium
**Preconditions:** Policy template has `relationship: true`.
**Test Data:** File with exactly one valid employee row (Employee relationship value) and no dependent rows.

**Test Steps:**
1. Upload the single-row file.
2. Wait for processing to complete.

**Expected Result:** Processing succeeds. Successfully Processed = 1, Dependents = 0. No `ORPHAN_DEPENDENT` errors generated. One member record created.

---

### TC-EDGE-005 — Employee ID appears exactly twice (first kept, second skipped)

**Category:** Edge
**Priority:** High
**Preconditions:** Policy template configured.
**Test Data:** File with employee ID "EMP001" on row 2 (valid) and row 5 (valid data, duplicate ID).

**Test Steps:**
1. Upload the file and wait for processing.
2. View the upload summary.

**Expected Result:** Row 2 is processed successfully. Row 5 is skipped with error code `DUPLICATE_EMPLOYEE_ID`. Successfully Processed = (total − 1), Failed / Skipped includes 1 `DUPLICATE_EMPLOYEE_ID` error.

---

### TC-EDGE-006 — DOB exactly 100 years ago (boundary — valid)

**Category:** Edge
**Priority:** Medium
**Preconditions:** Today's date is 2026-05-05. Policy template includes DOB field.
**Test Data:** Employee row with Date of Birth = 1926-05-05.

**Test Steps:**
1. Upload file with DOB = 1926-05-05.
2. Wait for processing to complete.

**Expected Result:** The row is processed successfully. No `INVALID_DOB_UNREASONABLE` error is generated. Age of exactly 100 years is within the valid boundary.

---

### TC-EDGE-007 — DOB is today's date (boundary — invalid)

**Category:** Edge
**Priority:** Medium
**Preconditions:** Today's date is 2026-05-05. Policy template includes DOB field.
**Test Data:** Employee row with Date of Birth = 2026-05-05.

**Test Steps:**
1. Upload file with DOB = today's date.
2. Wait for processing to complete.

**Expected Result:** The row is skipped with error code `INVALID_DOB_FUTURE_DATE`. A DOB equal to today is treated as a future date.

---

### TC-EDGE-008 — File with 5 000 rows (max performance boundary)

**Category:** Edge
**Priority:** High
**Preconditions:** Scheduler service running. Policy template configured.
**Test Data:** Valid `.csv` file with exactly 5 000 employee rows; all mandatory fields populated; no duplicates.

**Test Steps:**
1. Upload the 5 000-row file.
2. Monitor processing until completion.
3. Record total elapsed time.

**Expected Result:** Processing completes within 2 minutes. Successfully Processed = 5 000, Failed / Skipped = 0. All 5 000 member records are created.

---

### TC-EDGE-009 — Dependent row references employee not in the same file

**Category:** Edge
**Priority:** High
**Preconditions:** Policy template has `relationship: true`.
**Test Data:** File with 3 employee rows and 1 dependent row referencing Employee ID "EMP999" (not present in the file).

**Test Steps:**
1. Upload the file and wait for processing.
2. View the upload summary.

**Expected Result:** The orphan dependent row is skipped with error code `ORPHAN_DEPENDENT`. The 3 valid employee rows are processed successfully. Successfully Processed = 3, Failed / Skipped = 1.

---

### TC-EDGE-010 — Upload history with exactly 10 rows (default page size boundary)

🔁 **Updated** — Boundary corrected from 20 to 10 rows per TRD §5.1 and SDS §8.5 (default page size = 10).

**Category:** Edge
**Priority:** Low
**Preconditions:** An endorsement card has exactly 10 upload records. HR Admin has expanded that card.
**Test Data:** 10 seeded upload records for a single endorsement.

**Test Steps:**
1. Expand the endorsement card.
2. View the Uploaded Files Table and pagination footer.

**Expected Result:** All 10 rows are displayed on page 1. Footer reads "Showing 10 of 10 entries." No Next button is active (or Next is disabled). No second page exists.

---

### TC-EDGE-011 — File with optional columns absent from template

**Category:** Edge
**Priority:** Medium
**Preconditions:** Policy template has some optional fields not present in the uploaded file.
**Test Data:** Valid file omitting optional columns (e.g., middle name, alternate phone).

**Test Steps:**
1. Upload the file without optional columns.
2. Wait for processing to complete.

**Expected Result:** File is accepted and processed normally. Optional missing columns do not produce `MISSING_FIELD` errors. Only mandatory field absences trigger errors.

---

### TC-EDGE-012 — Enrollment End Date same as Enrollment Start Date

**Category:** Edge
**Priority:** Medium
**Preconditions:** HR Admin is on the upload form.
**Test Data:** Enrollment Start Date = 2026-06-01, Enrollment End Date = 2026-06-01.

**Test Steps:**
1. Enter identical values for Enrollment Start Date and Enrollment End Date.
2. Attach a valid file and submit.

**Expected Result:** The form accepts equal start and end dates. The upload is queued successfully. Both dates are stored identically on the `Endorsement` and `DocumentProcessingFile` records.

---

## 3. Negative Test Cases

### TC-NEG-001 — Upload unsupported file type (.pdf)

**Category:** Negative
**Priority:** Critical
**Preconditions:** HR Admin is on the upload form with all fields filled.
**Test Data:** A `.pdf` file.

**Test Steps:**
1. Attach a `.pdf` file to the upload area.
2. Attempt to submit.

**Expected Result:** Upload is rejected immediately with message "Unsupported file type. Please upload an .xlsx or .csv file." No upload record is created. No API call to Phase 2 is made.

---

### TC-NEG-002 — Upload file exceeding 10 MB

**Category:** Negative
**Priority:** Critical
**Preconditions:** HR Admin is on the upload form.
**Test Data:** A valid `.xlsx` file of 11 MB.

**Test Steps:**
1. Attach the 11 MB file.
2. Attempt to submit.

**Expected Result:** Upload is rejected with message "File too large. Maximum allowed size is 10 MB." No upload record is created. No processing starts.

---

### TC-NEG-003 — Upload empty file (no bytes)

**Category:** Negative
**Priority:** High
**Preconditions:** HR Admin is on the upload form.
**Test Data:** A zero-byte `.xlsx` file.

**Test Steps:**
1. Attach the empty file.
2. Submit the form.

**Expected Result:** Upload is rejected with message "The selected file contains no data rows." No upload record is created.

---

### TC-NEG-004 — File missing mandatory column headers

**Category:** Negative
**Priority:** Critical
**Preconditions:** Policy template requires columns: Employee ID, Full Name, Date of Birth, Email.
**Test Data:** `.xlsx` file with headers: Employee ID, Full Name, Date of Birth (Email column missing).

**Test Steps:**
1. Attach the file with a missing header.
2. Submit the form.

**Expected Result:** Upload is rejected with message "File headers do not match the template for this policy. Missing columns: Email. Download the template to see the expected format." No upload record is created.

---

### TC-NEG-005 — File contains no employee-type rows

**Category:** Negative
**Priority:** High
**Preconditions:** Policy template has `relationship: true`. Accepted relationship values include Spouse, Child.
**Test Data:** File with 5 rows, all having Spouse or Child as the relationship value (no Employee/SELF rows).

**Test Steps:**
1. Attach the file with no employee rows.
2. Submit the form.

**Expected Result:** Upload is rejected with message "No employee records found in the file." No upload record is created. No member records are written.

---

### TC-NEG-006 — Mandatory row field is blank

**Category:** Negative
**Priority:** High
**Preconditions:** Policy template requires Employee ID, Full Name, Date of Birth, Email.
**Test Data:** File with 5 rows; row 3 has a blank Employee ID.

**Test Steps:**
1. Upload the file.
2. Wait for processing to complete.
3. View the upload summary error breakdown.

**Expected Result:** Row 3 is skipped with error code `MISSING_FIELD:employee_id`. All other valid rows are processed. Failed / Skipped = 1.

---

### TC-NEG-007 — Invalid email format in row

**Category:** Negative
**Priority:** High
**Preconditions:** Policy template includes an email field.
**Test Data:** Employee row with email = "not-an-email".

**Test Steps:**
1. Upload the file.
2. Wait for processing and view the summary.

**Expected Result:** The row is skipped with error code `INVALID_EMAIL_FORMAT`. Other valid rows are processed. Error is reported in the summary's Failure Reasons.

---

### TC-NEG-008 — Mobile number with 9 digits

**Category:** Negative
**Priority:** High
**Preconditions:** Policy template includes a mobile field.
**Test Data:** Employee row with mobile = "987654321" (9 digits).

**Test Steps:**
1. Upload the file.
2. Wait for processing and view the summary.

**Expected Result:** The row is skipped with error code `INVALID_MOBILE_FORMAT`. Failure Reasons includes `INVALID_MOBILE_FORMAT: 1`.

---

### TC-NEG-009 — Date of birth is a future date

**Category:** Negative
**Priority:** High
**Preconditions:** Policy template includes a DOB field. Today = 2026-05-05.
**Test Data:** Employee row with Date of Birth = 2027-01-01.

**Test Steps:**
1. Upload the file.
2. Wait for processing and view the summary.

**Expected Result:** The row is skipped with error code `INVALID_DOB_FUTURE_DATE`. Failure Reasons includes `INVALID_DOB_FUTURE_DATE: 1`.

---

### TC-NEG-010 — Gender value not in policy-accepted set

**Category:** Negative
**Priority:** Medium
**Preconditions:** Policy template accepts gender values: Male, Female, Other.
**Test Data:** Employee row with gender = "Unknown".

**Test Steps:**
1. Upload the file with the invalid gender value.
2. Wait for processing and view the summary.

**Expected Result:** The row is skipped with error code `INVALID_GENDER_VALUE`. Failure Reasons includes `INVALID_GENDER_VALUE: 1`.

---

### TC-NEG-011 — Sum insured tier not matching any active sub-plan

**Category:** Negative
**Priority:** Medium
**Preconditions:** Policy template includes sum insured tier. Active sub-plans are: Tier-1 (300 000), Tier-2 (500 000).
**Test Data:** Employee row with Sum Insured Tier = "Tier-3".

**Test Steps:**
1. Upload the file.
2. Wait for processing and view the summary.

**Expected Result:** The row is skipped with error code `INVALID_SUM_INSURED_TIER`. Failure Reasons includes `INVALID_SUM_INSURED_TIER: 1`.

---

### TC-NEG-012 — Relationship value not in policy-accepted set

**Category:** Negative
**Priority:** Medium
**Preconditions:** Policy template has `relationship: true`; accepted values: Spouse, Child, Parent.
**Test Data:** Dependent row with relationship = "Sibling" (not in accepted set for this policy).

**Test Steps:**
1. Upload the file.
2. Wait for processing and view the summary.

**Expected Result:** The row is skipped with error code `INVALID_RELATIONSHIP_VALUE`. Other valid rows are processed.

---

### TC-NEG-013 — Submit upload form without selecting Data Type

**Category:** Negative
**Priority:** High
**Preconditions:** HR Admin has filled in all other form fields but left Data Type blank.
**Test Data:** All form fields filled; Data Type not selected.

**Test Steps:**
1. Fill in Enrollment Start Date, End Date, Number of Employees, Number of Dependents.
2. Leave Data Type as the default unselected state.
3. Attempt to submit the form.

**Expected Result:** Form submission is blocked. A validation error is displayed on the Data Type field indicating it is required. No API call is made.

---

### TC-NEG-014 — Submit upload form without a file attached

**Category:** Negative
**Priority:** High
**Preconditions:** HR Admin has filled in all form fields but has not attached a file.
**Test Data:** All form fields filled; file upload area empty.

**Test Steps:**
1. Fill in all form fields.
2. Do not attach a file.
3. Attempt to submit the form.

**Expected Result:** Form submission is blocked. An error message indicates that a file is required. No API call to `org-service` is made.

---

### TC-NEG-015 — Upload file for a policy belonging to a different company

**Category:** Negative
**Priority:** Critical
**Preconditions:** HR Admin from Company A has a valid JWT. A `policyId` belonging to Company B is known.
**Test Data:** JWT for Company A. `policyId` = ID of Company B's policy.

**Test Steps:**
1. Construct a POST request to `/policy-service/policy/:policyId/enrollment-upload` using Company B's `policyId` with Company A's JWT.
2. Send the request.

**Expected Result:** API returns 404 Not Found (or equivalent not-found response). No upload record is created. No file data is stored. Company isolation is enforced.

---

### TC-NEG-016 — Template download when template is unavailable

**Category:** Negative
**Priority:** Medium
**Preconditions:** The template fetch endpoint is unavailable (simulated by disabling the template service or selecting a policy with no template configured).
**Test Data:** Policy with no template; or template API returning an error.

**Test Steps:**
1. Navigate to the Inception / Endorsement tab.
2. Select a Data Type.
3. Click Download Template.

**Expected Result:** Error message displayed: "Template unavailable. Please contact support." No file is downloaded.

---

## 4. Security Test Cases

### TC-SEC-001 — Unauthenticated request to file upload endpoint

**Category:** Security
**Priority:** Critical
**Preconditions:** No JWT is present in the request.
**Test Data:** POST request to `/org-service/file-upload/upload` without Authorization header; valid `.xlsx` file.

**Test Steps:**
1. Send a POST multipart request to `/org-service/file-upload/upload` with no Authorization header.

**Expected Result:** API returns 401 Unauthorized. No file is stored. No `file_uploads` record is created.

---

### TC-SEC-002 — HR_VIEWER role attempts to upload a file

**Category:** Security
**Priority:** Critical
**Preconditions:** JWT contains role = `HR_VIEWER`. Target policy belongs to the same company.
**Test Data:** Valid JWT for HR_VIEWER; valid `.xlsx` file; valid `policyId`.

**Test Steps:**
1. POST to `/org-service/file-upload/upload` using HR_VIEWER JWT.
2. If Step 1 succeeds, POST the returned `documentId` to `/policy-service/policy/:policyId/enrollment-upload` using HR_VIEWER JWT.

**Expected Result:** At least one of the two calls returns 403 Forbidden. No upload record is created. `HR_VIEWER` cannot initiate uploads.

---

### TC-SEC-003 — HR_ADMIN accesses summary for another company's policy

**Category:** Security
**Priority:** Critical
**Preconditions:** JWT for Company A's HR_ADMIN. A valid `policyId` and `endorsementId` from Company B are known.
**Test Data:** Company A JWT; Company B `policyId` and `endorsementId`.

**Test Steps:**
1. GET `/policy-service/policy/:policyId/:endorsementId/enrollment-upload-summary-by-endorsement` with Company A's JWT and Company B's IDs.

**Expected Result:** Response returns 200 with empty `data` array and zero counts (the INNER JOIN on `endorsement.policy_id` finds no matching rows). No Company B data is disclosed.

---

### TC-SEC-004 — Tampered JWT — modified companyId claim

**Category:** Security
**Priority:** Critical
**Preconditions:** Valid JWT for Company A. Attacker modifies the `companyId` claim to Company B's ID without re-signing.
**Test Data:** Tampered JWT (invalid signature).

**Test Steps:**
1. Decode the JWT and modify the `companyId` field to a different company's ID.
2. Re-encode without a valid signature.
3. Send a POST to `/policy-service/policy/:policyId/enrollment-upload` with the tampered token.

**Expected Result:** API returns 401 Unauthorized due to JWT signature verification failure. No data is returned or written.

---

### TC-SEC-005 — Path traversal attempt in uploaded file name

**Category:** Security
**Priority:** High
**Preconditions:** HR Admin is authenticated with HR_ADMIN role.
**Test Data:** File named `../../etc/passwd.xlsx` containing valid enrollment data.

**Test Steps:**
1. Upload a file with the path-traversal name.
2. Observe the stored file path in `file_uploads.file_key`.

**Expected Result:** The file is stored with a sanitized key under the expected namespace `uploads/company/{entityType}/policy-*`. The traversal characters are stripped or rejected. No file is written outside the designated storage path.

---

### TC-SEC-006 — SQL injection in enrollmentStartDate field

**Category:** Security
**Priority:** High
**Preconditions:** HR Admin is authenticated.
**Test Data:** `enrollmentStartDate`: `"2026-01-01'; DROP TABLE endorsement; --"`.

**Test Steps:**
1. POST to `/policy-service/policy/:policyId/enrollment-upload` with the malicious `enrollmentStartDate` value.

**Expected Result:** API returns a 400 Bad Request (invalid date format) or the value is parameterized by the ORM and stored as a literal string, not executed. The `endorsement` table is not affected.

---

### TC-SEC-007 — XSS payload in file name field

**Category:** Security
**Priority:** High
**Preconditions:** HR Admin is authenticated.
**Test Data:** File named `<script>alert('xss')</script>.xlsx`.

**Test Steps:**
1. Upload the file with the XSS name.
2. View the upload history table and expand the record.

**Expected Result:** The file name is displayed as escaped plain text. No script executes. The browser does not show an alert.

---

### TC-SEC-008 — Expired JWT token on file upload request

**Category:** Security
**Priority:** Critical
**Preconditions:** An HR_ADMIN JWT that has passed its expiry time.
**Test Data:** Expired JWT.

**Test Steps:**
1. Use the expired JWT to POST to `/org-service/file-upload/upload`.

**Expected Result:** API returns 401 Unauthorized. No file is stored.

---

### TC-SEC-009 — HR_VIEWER role attempts to access POST enrollment-upload

**Category:** Security
**Priority:** High
**Preconditions:** Valid HR_VIEWER JWT for the correct company.
**Test Data:** HR_VIEWER JWT; valid `policyId`; valid `documentId`.

**Test Steps:**
1. POST to `/policy-service/policy/:policyId/enrollment-upload` with HR_VIEWER credentials and a valid body.

**Expected Result:** API returns 403 Forbidden. No `DocumentProcessingFile` or `Endorsement` record is created.

---

### TC-SEC-010 — Oversized multipart payload (file content attack)

**Category:** Security
**Priority:** High
**Preconditions:** HR Admin is authenticated.
**Test Data:** Multipart request where the file part is 100 MB.

**Test Steps:**
1. Send a POST multipart request to `/org-service/file-upload/upload` with a 100 MB file part.

**Expected Result:** API rejects the request with 413 Payload Too Large or equivalent. No file is stored. No memory exhaustion occurs on the server.

---

## 5. Performance Test Cases

### TC-PERF-001 — File upload API response within 3 seconds

**Category:** Performance
**Priority:** Critical
**Preconditions:** System under normal load. Valid HR_ADMIN JWT.
**Test Data:** A valid 5 MB `.xlsx` file.

**Test Steps:**
1. Start a timer.
2. POST the file to `/org-service/file-upload/upload`.
3. Stop the timer when the response is received.

**Expected Result:** Response is received in under 3 seconds. Response body contains `id`, `fileKey`, `fileName`, `fileSize`. Status = 201 Created. (File receipt and queuing only; processing time is excluded.)

---

### TC-PERF-002 — Processing 5 000 rows completes within 2 minutes

**Category:** Performance
**Priority:** Critical
**Preconditions:** Scheduler service running. No other uploads queued ahead of this one.
**Test Data:** Valid 5 000-row `.csv` file with all mandatory fields populated.

**Test Steps:**
1. Upload the 5 000-row file and record the submission timestamp.
2. Poll the summary endpoint until `processStatus = 'COMPLETED'`.
3. Record the completion timestamp.

**Expected Result:** Total elapsed time from CREATED to COMPLETED is under 2 minutes. `successCount` = 5 000, `errorCount` = 0.

---

### TC-PERF-003 — Upload history loads within 2 seconds

🔁 **Updated** — "First page (20 rows)" corrected to "first page (10 rows)" per TRD §5.1 and SDS §8.5.

**Category:** Performance
**Priority:** High
**Preconditions:** Policy has 500 upload records in the database.
**Test Data:** 500 seeded upload records across multiple endorsements.

**Test Steps:**
1. Start a timer.
2. Navigate to the Inception / Endorsement tab or send GET to the summary endpoint.
3. Stop the timer when the table renders.

**Expected Result:** The history table renders in under 2 seconds. The first page (10 rows) is visible. No N+1 queries are issued.

---

### TC-PERF-004 — Upload detail expansion with no additional API latency

**Category:** Performance
**Priority:** High
**Preconditions:** Summary data is already loaded. Network panel is open.
**Test Data:** Upload record with 50 error rows.

**Test Steps:**
1. Load the upload history (single GET).
2. Monitor the Network panel.
3. Click to expand an upload record.

**Expected Result:** No additional network request is fired on expansion. The detail renders immediately (client-side) from the already-loaded payload. Expansion time is effectively 0 ms.

---

### TC-PERF-005 — Concurrent uploads from 10 HR Admins simultaneously

**Category:** Performance
**Priority:** High
**Preconditions:** 10 HR Admin accounts from the same company, each with a distinct valid file.
**Test Data:** 10 valid 200-row files submitted in parallel.

**Test Steps:**
1. Trigger all 10 upload requests simultaneously (using a load testing tool or parallel scripts).
2. Monitor responses and scheduler processing.

**Expected Result:** All 10 POST requests return 201 within 3 seconds. All 10 `DocumentProcessingFile` records are created with `processStatus = 'CREATED'`. The scheduler processes them sequentially (one per poll cycle) without data corruption. No deadlocks or duplicate records occur.

---

### TC-PERF-006 — Scheduler atomic claim under concurrent scheduler instances

**Category:** Performance
**Priority:** Critical
**Preconditions:** Two scheduler-service instances running simultaneously. One CREATED record in the queue.
**Test Data:** A single `DocumentProcessingFile` record with `processStatus = 'CREATED'`.

**Test Steps:**
1. Ensure both scheduler instances fire at the same poll cycle.
2. Observe which instance claims the record.
3. Monitor `document_processing_file.processStatus`.

**Expected Result:** Exactly one instance transitions the record from `CREATED` to `PROCESSING`. The other instance receives 0 rows affected from the atomic UPDATE and skips the record. No duplicate processing occurs.

---

## 6. Integration Test Cases

### TC-INT-001 — Phase 1 → Phase 2 flow: documentId passed correctly

**Category:** Integration
**Priority:** Critical
**Preconditions:** Both `org-service` and `policy-service` are running.
**Test Data:** Valid `.xlsx` file; valid `policyId` belonging to the admin's company.

**Test Steps:**
1. POST the file to `/org-service/file-upload/upload`. Record the returned `id` (documentId = 4821).
2. POST to `/policy-service/policy/:policyId/enrollment-upload` with `documentId: 4821` and required enrollment metadata.
3. Query `document_processing_file` in the database for the new record.

**Expected Result:** Phase 1 returns `{ id: 4821, ... }`. Phase 2 creates a `DocumentProcessingFile` record with `documentId = 4821` and `processStatus = 'CREATED'`. The `endorsementId` is set to a new or existing endorsement ID.

---

### TC-INT-002 — Scheduler picks up CREATED record within poll interval

**Category:** Integration
**Priority:** Critical
**Preconditions:** Scheduler running with 2-minute interval. One CREATED record exists.
**Test Data:** `DocumentProcessingFile` with `processStatus = 'CREATED'`, `createdAt` = now.

**Test Steps:**
1. Insert (or create via Phase 2) a CREATED record.
2. Wait up to 2 minutes for the scheduler's next poll cycle.
3. Query `document_processing_file.processStatus`.

**Expected Result:** Within 2 minutes, `processStatus` transitions from `CREATED` to `PROCESSING`, then to `COMPLETED` or `FAILED`. No record remains stuck in `CREATED` after two poll cycles.

---

### TC-INT-003 — Summary endpoint returns correct aggregation across uploads

**Category:** Integration
**Priority:** Critical
**Preconditions:** Three completed uploads exist for the same `endorsementId`: Upload A (100 records, 90 success, 10 error); Upload B (50 records, 50 success, 0 error); Upload C (30 records, 25 success, 5 error).
**Test Data:** Seeded `policy_enrollment_upload_summary` records as described.

**Test Steps:**
1. GET `/policy-service/policy/:policyId/:endorsementId/enrollment-upload-summary-by-endorsement?page=1&limit=20`.
2. Inspect the `summary` block in the response.

**Expected Result:** `summary.totalRecords = 180`, `summary.successCount = 165`, `summary.failureCount = 15`. `data` array contains 3 records ordered by `sourceFile.created_at` DESC.

---

### TC-INT-004 — Object storage download failure sets status to FAILED

**Category:** Integration
**Priority:** High
**Preconditions:** A CREATED record exists. Object storage is configured to return an error for the file's `fileKey`.
**Test Data:** `file_uploads.file_key` pointing to a non-existent S3 path.

**Test Steps:**
1. Create a `DocumentProcessingFile` record referencing a non-existent file key.
2. Allow the scheduler to claim and attempt to process it.
3. Query `document_processing_file.processStatus`.

**Expected Result:** Scheduler encounters a download error. `processStatus` is set to `FAILED`. No `policy_enrollment_upload_summary` record with success counts is created. The FAILED status is visible in the UI.

---

### TC-INT-005 — Redis enrollment batch key set and consumed correctly

**Category:** Integration
**Priority:** High
**Preconditions:** Scheduler processing a valid financial endorsement upload. Redis/Valkey is accessible.
**Test Data:** Valid 20-row file for a financial endorsement.

**Test Steps:**
1. Upload and process a valid financial endorsement file.
2. Monitor Redis for the presence of `enrollmentBatchKey` during processing.
3. Verify the enrollment batch API is called.

**Expected Result:** Scheduler sets the batch payload in Redis before calling the enrollment API. The enrollment batch API receives the payload. After processing, `processStatus = 'COMPLETED'` and `successCount` reflects the valid rows.

---

### TC-INT-006 — Error file generated in S3 and linked in summary record

**Category:** Integration
**Priority:** High
**Preconditions:** Scheduler processing a file with at least one invalid row.
**Test Data:** File with 5 valid rows and 2 rows with `INVALID_EMAIL_FORMAT`.

**Test Steps:**
1. Upload and process the file.
2. Inspect `policy_enrollment_upload_summary.error_file_upload_id`.
3. Use the error file ID to download the error file.

**Expected Result:** `error_file_upload_id` is not null. The error file at `uploads/company/{entityType}/errorfiles/policy-{policyId}-errorfile{timestamp}.xlsx` exists in S3. The error file contains the 2 failing rows with their Remarks (error code) column populated.

---

### TC-INT-007 — Frontend poll loop reflects COMPLETED status on refresh

**Category:** Integration
**Priority:** High
**Preconditions:** File submitted; processing completes between two Refresh clicks.
**Test Data:** Valid 10-row file.

**Test Steps:**
1. Submit the file; note `processStatus = 'CREATED'`.
2. Click Refresh — status shows "in progress" (scheduler has claimed but not completed).
3. Wait for processing to complete.
4. Click Refresh again.

**Expected Result:** After the second Refresh, the Data Processing Status updates to "complete" and the Uploaded Data Table shows the new record with correct counts.

---

### TC-INT-008 — New endorsement created when endorsementId not provided

**Category:** Integration
**Priority:** High
**Preconditions:** No existing endorsement for this policyId.
**Test Data:** POST body to enrollment-upload without `endorsementId`.

**Test Steps:**
1. POST to `/policy-service/policy/:policyId/enrollment-upload` omitting the `endorsementId` field.
2. Inspect the response body for `endorsementId`.
3. Query the `endorsement` table for the new record.

**Expected Result:** A new `Endorsement` row is inserted for `policyId`. The response includes `endorsementId` pointing to the new record. `document_processing_file.endorsement_id` references this new endorsement.

---

### TC-INT-009 — Existing endorsement updated when endorsementId provided

**Category:** Integration
**Priority:** High
**Preconditions:** An existing `Endorsement` record exists with `enrollmentStartDate = 2026-01-01`, `enrollmentEndDate = 2026-06-30`.
**Test Data:** POST body with `endorsementId = 209`, `enrollmentStartDate = 2026-02-01`, `enrollmentEndDate = 2026-12-31`.

**Test Steps:**
1. POST to enrollment-upload with the existing `endorsementId` and new dates.
2. Query the `endorsement` table for record 209.

**Expected Result:** The `Endorsement` record's `enrollmentStartDate` and `enrollmentEndDate` are updated to the new values. A new `DocumentProcessingFile` is created with the updated dates and linked to endorsement 209.

---

## 7. Accessibility Test Cases

### TC-ACC-001 — Upload form fields have visible and accessible labels

**Category:** Accessibility
**Priority:** High
**Preconditions:** Screen reader (e.g., NVDA or VoiceOver) is active. HR Admin is on the Inception / Endorsement tab.
**Test Data:** N/A.

**Test Steps:**
1. Tab through each form field in the Upload Form section.
2. Listen to the screen reader announcement for each field.

**Expected Result:** Each field (Enrollment Start Date, Enrollment End Date, Number of Employees, Number of Dependents, Data Type) announces its label and required status. No field reads as "unlabelled" or "edit text" without a descriptor.

---

### TC-ACC-002 — File rejection error messages read by screen readers

**Category:** Accessibility
**Priority:** High
**Preconditions:** Screen reader active.
**Test Data:** Upload a `.pdf` file (unsupported format).

**Test Steps:**
1. Attempt to upload a `.pdf` file.
2. Listen for the screen reader announcement after the rejection message appears.

**Expected Result:** The rejection message "Unsupported file type. Please upload an .xlsx or .csv file." is announced by the screen reader. It is associated with the file upload control via `aria-describedby` or an equivalent ARIA pattern.

---

### TC-ACC-003 — File upload area is keyboard-accessible

**Category:** Accessibility
**Priority:** High
**Preconditions:** User navigates using keyboard only (no mouse).
**Test Data:** N/A.

**Test Steps:**
1. Tab to the file upload area.
2. Press Enter or Space to open the file picker.
3. Select a file using the keyboard.

**Expected Result:** The file upload control is reachable via Tab key. The file picker opens on Enter/Space. A file can be selected without a mouse. Focus returns to the upload area or submit button after selection.

---

### TC-ACC-004 — Processing status messages are announced by screen readers

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** Screen reader active. A file upload is in progress.
**Test Data:** File submitted; scheduler processing.

**Test Steps:**
1. Click Refresh after a file has been submitted.
2. Listen for the screen reader's announcement of the status message.

**Expected Result:** The status message update ("Data processing is in progress." or "Data processing is complete.") is announced by the screen reader, either via a live region (`aria-live`) or equivalent pattern.

---

### TC-ACC-005 — Upload history table supports keyboard navigation

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** Upload history table is visible with at least 3 records.
**Test Data:** N/A.

**Test Steps:**
1. Tab to the upload history table.
2. Use arrow keys or Tab to navigate between rows and columns.
3. Press Enter on a row to expand the detail.

**Expected Result:** Table rows and cells are navigable via keyboard. The expand action is activatable via Enter or Space. The expanded detail is announced by the screen reader.

---

### TC-ACC-006 — KPI card values have accessible text alternatives

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** Screen reader active. KPI cards are visible.
**Test Data:** KPI cards showing Total Records = 180, Success = 165, Failed = 15.

**Test Steps:**
1. Tab to each KPI card.
2. Listen to the screen reader announcement.

**Expected Result:** Each card announces its label and value (e.g., "Total Records, 180"). Colour alone is not the only differentiator — card labels convey meaning independently of colour.

---

### TC-ACC-007 — Tab layout is usable on a tablet viewport (768 px)

**Category:** Accessibility
**Priority:** Medium
**Preconditions:** Browser viewport set to 768 px width.
**Test Data:** N/A.

**Test Steps:**
1. Resize the browser to 768 px width.
2. Navigate to the Inception / Endorsement tab.
3. Verify that the Upload Form, Data Processing Status, and Uploaded Data Table are all visible and usable.

**Expected Result:** All three sections are visible without horizontal scrolling. Form fields and table columns adapt to the viewport. No content is clipped or inaccessible.

---

## 8. Regression Test Cases

### TC-REG-001 — Previously uploaded files remain accessible after new upload

**Category:** Regression
**Priority:** High
**Preconditions:** Two uploads exist (Upload A, Upload B). A third upload (Upload C) is being added.
**Test Data:** Three sequential uploads for the same policy.

**Test Steps:**
1. Confirm Upload A and Upload B are visible in the history.
2. Submit Upload C.
3. After processing, reload the history table.

**Expected Result:** All three uploads (A, B, C) are visible in the history. The File Name download icon for Upload A and Upload B still works. No records are lost or overwritten.

---

### TC-REG-002 — KPI totals remain correct after page refresh

**Category:** Regression
**Priority:** High
**Preconditions:** KPI cards show Total = 50, Success = 45, Failed = 5.
**Test Data:** Existing upload data as described.

**Test Steps:**
1. Note the KPI card values.
2. Hard-refresh the page (Ctrl+F5).
3. Read the KPI card values after reload.

**Expected Result:** KPI card values remain Total = 50, Success = 45, Failed = 5. Values are re-fetched from the API and match the persisted data.

---

### TC-REG-003 — Upload history sort order preserved after submitting a new file

**Category:** Regression
**Priority:** High
**Preconditions:** Upload history has records from T1 < T2.
**Test Data:** Submit a new upload at time T3.

**Test Steps:**
1. Note the current order (T2 on top, T1 below).
2. Submit a new file (T3).
3. Wait for the history to update.

**Expected Result:** The new upload T3 appears at the top. T2 is now second, T1 is third. Sort order (submitted_at DESC) is maintained.

---

### TC-REG-004 — Processing result retrievable after navigate-away-and-return

**Category:** Regression
**Priority:** High
**Preconditions:** A file was submitted and processing completed while the HR Admin was on a different page.
**Test Data:** Any valid completed upload.

**Test Steps:**
1. Submit a file upload.
2. Navigate to the Dashboard before processing completes.
3. Wait 3 minutes.
4. Navigate back to the policy's Inception / Endorsement tab.

**Expected Result:** The Data Processing Status shows the completed state. The upload record appears in the history with correct status and counts. No data loss from navigating away.

---

### TC-REG-005 — File-level rejection does not create upload record in history

**Category:** Regression
**Priority:** Critical
**Preconditions:** HR Admin is on the upload form.
**Test Data:** A `.pdf` file (unsupported format).

**Test Steps:**
1. Attempt to upload a `.pdf` file (or any file-level rejection case).
2. Observe the rejection message.
3. Navigate to the Uploaded Data Table.

**Expected Result:** The rejection message is shown immediately. No new entry appears in the upload history table. KPI card totals do not change. No `DocumentProcessingFile` or `Endorsement` record is created in the database.

---

### TC-REG-006 — Partial success does not duplicate valid rows on scheduler retry

**Category:** Regression
**Priority:** High
**Preconditions:** A COMPLETED upload exists for 10 employees. Scheduler is restarted.
**Test Data:** Existing COMPLETED `DocumentProcessingFile` record; `policy_enrollment_employee` records for 10 employees.

**Test Steps:**
1. Simulate a scheduler restart (or re-trigger processing for the completed record if a test hook exists).
2. Check `policy_enrollment_employee` row count for those 10 employees.

**Expected Result:** Duplicate employee records are NOT created. UPSERT on `(company_employee_id, policy_id)` ensures idempotent re-processing. Row count remains 10.

---

## 9. Data Integrity Test Cases

### TC-DAT-001 — Duplicate employee ID: first occurrence processed, rest skipped

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Policy template configured with an Employee ID column.
**Test Data:** File with 5 rows; rows 1, 3, and 5 share Employee ID "EMP100".

**Test Steps:**
1. Upload the file and wait for processing.
2. Query `policy_enrollment_employee` for records with `company_employee_id = 'EMP100'`.
3. View the upload summary error breakdown.

**Expected Result:** Exactly 1 record exists for "EMP100" (from row 1). Rows 3 and 5 are skipped with `DUPLICATE_EMPLOYEE_ID`. Failure Reasons shows `DUPLICATE_EMPLOYEE_ID: 2`.

---

### TC-DAT-002 — UPSERT prevents duplicate member records on scheduler retry

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** An employee with `company_employee_id = 'EMP200'` already exists for `policy_id = 77`.
**Test Data:** File containing a row for "EMP200" with updated values (e.g., different email).

**Test Steps:**
1. Upload the file.
2. Wait for processing.
3. Query `policy_enrollment_employee` for "EMP200" on policy 77.

**Expected Result:** Exactly 1 record exists for "EMP200" on policy 77 (no duplicate). The record reflects the latest uploaded values. `successCount` in the summary includes this row.

---

### TC-DAT-003 — Error file contains all failing rows with correct Remarks codes

**Category:** Data Integrity
**Priority:** High
**Preconditions:** Scheduler completed processing a file with 3 types of errors.
**Test Data:** File with: 2 rows with `MISSING_FIELD`, 3 rows with `INVALID_EMAIL_FORMAT`, 1 row with `INVALID_MOBILE_FORMAT`.

**Test Steps:**
1. Upload and process the file.
2. Download the error file from the upload record.
3. Open the error file and inspect the Remarks column.

**Expected Result:** Error file contains exactly 6 rows. Each row has a Remarks value matching the correct error code. No valid rows appear in the error file.

---

### TC-DAT-004 — Audit trail — created_by and created_at set from JWT

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** HR Admin with userId = 88 is authenticated.
**Test Data:** Upload submitted by userId 88.

**Test Steps:**
1. Submit a file upload as userId 88.
2. Query `document_processing_file` for the new record.

**Expected Result:** `document_processing_file.created_by = 88`. `created_at` is the system timestamp at submission time. The `created_by` field is not user-supplied — it is derived exclusively from the JWT. The field cannot be overridden by passing a different value in the request body.

---

### TC-DAT-005 — Enrollment dates stored on both Endorsement and DocumentProcessingFile

**Category:** Data Integrity
**Priority:** High
**Preconditions:** HR Admin submits with enrollmentStartDate = 2026-01-01, enrollmentEndDate = 2026-12-31.
**Test Data:** POST body with the specified dates.

**Test Steps:**
1. Submit the enrollment upload with the specified dates.
2. Query `endorsement` and `document_processing_file` for the new records.

**Expected Result:** Both `endorsement.enrollment_start_date = 2026-01-01` and `endorsement.enrollment_end_date = 2026-12-31`. `document_processing_file.enrollment_start_date` and `enrollment_end_date` match. If no dates are provided, fallback values are applied per TRD (start = `endorsement.createdAt`, end = `endorsement.createdAt + 15 days`).

---

### TC-DAT-006 — processCount equals successCount + errorCount

**Category:** Data Integrity
**Priority:** High
**Preconditions:** Scheduler has completed processing a file with mixed results.
**Test Data:** File with 20 rows: 15 valid, 5 invalid.

**Test Steps:**
1. Query `policy_enrollment_upload_summary` for the upload record.
2. Verify: `process_count = success_count + error_count`.

**Expected Result:** `process_count = 20`, `success_count = 15`, `error_count = 5`. The equation `process_count = success_count + error_count` holds.

---

### TC-DAT-007 — No upload record created when file-level validation fails

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** HR Admin submits a file that fails file-level validation (e.g., wrong format).
**Test Data:** `.docx` file submitted via the API directly (bypassing client-side checks).

**Test Steps:**
1. POST the `.docx` file directly to `/org-service/file-upload/upload`.
2. If a `documentId` is returned, POST to enrollment-upload.
3. Query `document_processing_file` for a record with the returned `documentId`.

**Expected Result:** Either `org-service` rejects the file (no `documentId`) or `policy-service` rejects with a file-level error before creating a `DocumentProcessingFile` record. No `DocumentProcessingFile` or `Endorsement` record referencing this upload exists in the database.

---

### TC-DAT-008 — Company isolation — upload visible only to owning company

**Category:** Data Integrity
**Priority:** Critical
**Preconditions:** Company A has 3 uploads. Company B has 2 uploads. Both have the same `policyId` integer (edge case: colliding IDs across companies).
**Test Data:** HR Admin from Company A; `endorsementId` belonging to Company A.

**Test Steps:**
1. GET summary endpoint for Company A's `policyId` and `endorsementId` using Company A's JWT.
2. Inspect the returned data array.

**Expected Result:** Only Company A's uploads are returned. Company B's upload records are not visible. The INNER JOIN on `endorsement.policy_id AND e.company_id = :jwtCompanyId` (or equivalent) enforces isolation.

---

## 10. API Test Cases

### TC-API-001 — GET request to POST-only file upload endpoint returns 405

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** GET request to `/org-service/file-upload/upload`.

**Test Steps:**
1. Send a GET request to `/org-service/file-upload/upload` with a valid JWT.

**Expected Result:** API returns 405 Method Not Allowed. Response includes an `Allow: POST` header or equivalent. No file data is returned.

---

### TC-API-002 — POST enrollment-upload without documentId returns 400

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT; valid `policyId`.
**Test Data:** POST body `{ "enrollmentStartDate": "2026-01-01", "employeeCount": 10 }` (documentId omitted).

**Test Steps:**
1. POST to `/policy-service/policy/:policyId/enrollment-upload` without `documentId`.

**Expected Result:** API returns 400 Bad Request. Response body indicates that `documentId` is required. No `DocumentProcessingFile` or `Endorsement` is created.

---

### TC-API-003 — POST enrollment-upload with non-existent policyId returns 404

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** `policyId = 999999` (does not exist); valid `documentId`.

**Test Steps:**
1. POST to `/policy-service/policy/999999/enrollment-upload` with a valid body.

**Expected Result:** API returns 404 Not Found. Response indicates the policy was not found. No records are created.

---

### TC-API-004 — Malformed JSON body to enrollment-upload endpoint returns 400

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT; valid `policyId`.
**Test Data:** Request body: `{ "documentId": 4821, "enrollmentStartDate": ` (truncated / malformed JSON).

**Test Steps:**
1. POST to `/policy-service/policy/:policyId/enrollment-upload` with the malformed JSON body.

**Expected Result:** API returns 400 Bad Request. Error message indicates invalid request body / JSON parse error. No database writes occur.

---

### TC-API-005 — Missing Authorization header returns 401

**Category:** API
**Priority:** Critical
**Preconditions:** N/A.
**Test Data:** POST to enrollment-upload with no Authorization header; valid JSON body.

**Test Steps:**
1. Send POST to `/policy-service/policy/:policyId/enrollment-upload` without any Authorization header.

**Expected Result:** API returns 401 Unauthorized. Response body indicates authentication is required. No records are created.

---

### TC-API-006 — Summary endpoint with page=0 applies default pagination

**Category:** API
**Priority:** Medium
**Preconditions:** Valid JWT; policy with 5 upload records.
**Test Data:** GET with `?page=0&limit=10`.

**Test Steps:**
1. GET summary endpoint with `page=0`.
2. Inspect the returned data array.

**Expected Result:** API either treats `page=0` as page 1 (default) and returns data, or returns 400 Bad Request with a message indicating page must be >= 1. It does not return an error 500 or empty data silently.

---

### TC-API-007 — Summary endpoint for non-existent endorsementId returns empty data

**Category:** API
**Priority:** Medium
**Preconditions:** Valid HR_ADMIN JWT; valid `policyId`; `endorsementId = 99999` does not exist.
**Test Data:** GET with a valid `policyId` and non-existent `endorsementId`.

**Test Steps:**
1. GET `/policy-service/policy/:policyId/99999/enrollment-upload-summary-by-endorsement`.

**Expected Result:** API returns 200 OK with `data: []`, `count: 0`, `summary: { totalRecords: 0, successCount: 0, failureCount: 0 }`. No error is raised.

---

### TC-API-008 — Summary endpoint with tpaData=true returns only TPA upload records

**Category:** API
**Priority:** Medium
**Preconditions:** Policy has 3 standard uploads and 1 TPA ID upload (`documentType = 'POLICY_TPA_ID_UPLOAD'`).
**Test Data:** GET with `tpaData=true`.

**Test Steps:**
1. GET summary endpoint with `?tpaData=true`.
2. Inspect the returned `data` array.

**Expected Result:** Only the TPA ID upload record is returned (1 result). The 3 standard uploads are excluded.

---

### TC-API-009 — Summary endpoint with usePolicyAssetEndorsement=true joins correctly

**Category:** API
**Priority:** Medium
**Preconditions:** Policy has uploads linked via `PolicyAssetEndorsement` rather than the standard `Endorsement` table.
**Test Data:** GET with `?usePolicyAssetEndorsement=true`.

**Test Steps:**
1. GET summary endpoint with `usePolicyAssetEndorsement=true`.
2. Inspect the data returned.

**Expected Result:** The query joins against `PolicyAssetEndorsement` instead of `Endorsement`. Upload records associated via `PolicyAssetEndorsement` are returned correctly.

---

### TC-API-010 — Multipart upload with no file part returns 400

**Category:** API
**Priority:** High
**Preconditions:** Valid HR_ADMIN JWT.
**Test Data:** Multipart request to `/org-service/file-upload/upload` with a form-data body containing only text fields (no file part).

**Test Steps:**
1. POST multipart/form-data to `/org-service/file-upload/upload` without a file field.

**Expected Result:** API returns 400 Bad Request. Response indicates the file field is missing or required. No `file_uploads` record is created.

---

*Inception / Endorsement Test Case Suite — ibp-service — v1.1 — 2026-05-08*