# IBP HR Portal — Endorsement Tab SDS

**Document Version:** 2.1
**Date:** 2026-05-05
**Author:** IIRM Engineering Team
**Jira Reference:** IIRM-10101
**PRD Reference:** `hr-portal-inception-endorsement-prd.md`
**TRD Reference:** `hr-portal-inception-endorsement-trd.md`

> **Document scope.** This SDS owns *how the Endorsement tab looks and behaves on screen* — layout, section structure, field rendering, status styling, interaction flow, and empty/error states. Business requirements are owned by the PRD. API design and data model are owned by the TRD.
>
> **Spec consolidation note.** The display spec for the Endorsement tab (overview metrics, individual endorsement accordion) was previously located in `../hr-analytics/hr-analytics-sds.md §4.3.3`. It is now owned here as the single source of truth. The hr-analytics SDS contains a redirect pointer.

---

## 1. Overview

This SDS describes the **Endorsement** tab within the IBP HR Portal's Enrollment page (`apps/ui/ibp/src/app/pages/HRPortalEnrolmentV2`), accessible at route `/hr-portal/enrollment`.

The tab is a single scrollable screen composed of the following stacked sections:

1. **Overview Block** — two stat tiles: Net Gross Premium · Total Endorsements
2. **Employee Information Cumulative Metrics** — 4×2 grid of employee/lives stats
3. **Premium Information Table** — ten premium component rows
4. **Individual Endorsements Accordion** — one card per endorsement; expanded view includes employee snapshot, premium snapshot, and the upload form + uploaded files table

The first three sections (§4–§6) are read-only display of iWork-sourced data. The upload capability (§8) lives inside each expanded endorsement card, so uploads are always in context of a specific endorsement.

---

## 2. Navigation and Entry Points

| Step | Action | Result |
|---|---|---|
| 1 | HR Admin is on the HR Portal and selects **Enrollment** from the sidebar | Navigates to `/hr-portal/enrollment` |
| 2 | HR Admin clicks the **Endorsement** tab | The Endorsement tab becomes active; all sections are visible |

No additional policy selection is required within this tab. The policy context is derived from the HR Admin's company association in the session.

---

## 3. Page Tab Structure

The Enrollment page (`HRPortalEnrolmentV2`) contains three tabs:

| Tab | Route fragment | Spec owner |
|---|---|---|
| Enrollment | `enrollment` | `hr-analytics-sds.md §4.3.1` |
| **Endorsement** | `endorsement` | **This document** |
| Employee Analytics | `analytics` | `hr-analytics-sds.md §4.3.4` |

This SDS covers only the **Endorsement** tab.

---

## 4. Screen Layout — Endorsement Tab

The tab is a single scrollable screen. Sections are stacked vertically:

```
┌──────────────────────────────────────────────────────────────┐
│  Section 0: New Endorsement Upload                           │
│  Data Type · Start Date · End Date · Employees · Dependents  │
│  [ Download Template ]  [ Upload File ]                      │
├──────────────────────────────────────────────────────────────┤
│  Section 1: Overview Block                                   │
│  Net Gross Premium │ Total Endorsements                      │
├──────────────────────────────────────────────────────────────┤
│  Section 2: Employee Information — Cumulative Metrics        │
│  4×2 grid of stat tiles                                      │
├──────────────────────────────────────────────────────────────┤
│  Section 3: Premium Information Table                        │
│  10 rows: Component name │ Amount                            │
├──────────────────────────────────────────────────────────────┤
│  Section 4: Individual Endorsements Accordion                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ [Collapsed card] Type · Date · OS Ticket · Counts      │  │
│  ├────────────────────────────────────────────────────────┤  │
│  │ [Expanded card]                                        │  │
│  │   Employee Info Snapshot Table                         │  │
│  │   Premium Component Snapshot Table                     │  │
│  │   ── Upload Form (disabled if Step 2 complete) ──────  │  │
│  │   Data Type · Enrollment Dates · Counts · File Upload  │  │
│  │   ── Uploaded Files Table ──────────────────────────── │  │
│  │   History of files submitted for this endorsement      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Section 0 creates a new endorsement.** Sections 1–3 are read-only aggregates. Section 4 manages and tracks existing endorsements.

---

## 4a. Section 0 — New Endorsement Upload (Top of Page)

A card at the top of the Endorsement tab that allows HR Admins to submit member data to create a new endorsement record. This is the primary entry point for new endorsement creation from IBP.

### Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Data Type | Dropdown | Yes | "Employee Data Only" / "Employee + Dependents Data" |
| Enrollment Start Date | Date input | Yes | Defaults to today |
| Enrollment End Date | Date input | Yes | Defaults to today + 15 days |
| Number of Employees | Numeric input | Yes | Expected count in file |
| Number of Dependents | Numeric input | Yes | 0 is valid for employee-only |

### Actions

| Element | Behaviour |
|---|---|
| Download Template | Downloads the template for the selected Data Type. Disabled until Data Type is selected and a policy is active. |
| Upload File | Triggers file selection. Disabled until all form fields are filled. Accepted: `.xlsx`, `.csv`, max 10 MB. |

### Post-Upload Behaviour

After a successful upload:
1. The file is queued for processing — a new endorsement record is created in the backend.
2. All four display sections (Overview, Employee Metrics, Premium Table, Endorsement List) are immediately refreshed.
3. The new endorsement appears in the Individual Endorsements accordion (Section 4) with its current processing status.
4. The upload form resets to its initial state.

### Policy Context

The Upload File action requires a `policyId`. The `policyId` is derived from the first available endorsement record in the loaded list. If no endorsements have been loaded yet (empty list or loading), the Upload File and Download Template buttons remain disabled until a real `policyId` is available.

> **Future enhancement:** A dedicated policy selector in this section would allow the HR Admin to explicitly choose which policy the new endorsement belongs to, removing the dependency on the list.

---

## 5. Section 1 — Overview Block

Two large stat tiles displayed side by side at the top of the tab.

| Tile | Value | Notes |
|---|---|---|
| Net Gross Premium | Formatted currency value | Aggregated across all endorsements for this policy |
| Total Endorsements | Count | Count of all endorsement records for this policy |

Empty state: tiles show `—` when no endorsement data is available.

---

## 6. Section 2 — Employee Information Cumulative Metrics

A 4×2 grid of stat tiles showing cumulative employee and lives counts across all endorsements for this policy.

| Row | Column 1 | Column 2 |
|---|---|---|
| Row 1 | Employees at inception | Employees in addition |
| Row 2 | Employees in deletion | Active employees |
| Row 3 | Lives at inception | Lives in addition |
| Row 4 | Lives in deletion | Active lives |

Each tile shows a label and a numeric value. Empty state: tiles show `0` or `—` per data availability.

---

## 7. Section 3 — Premium Information Table

A two-column table (Component · Amount) with ten rows, one per premium component.

| Row | Component |
|---|---|
| 1 | Base Premium |
| 2 | Tax Amount |
| 3 | Gross Premium |
| 4 | Addition Premium |
| 5 | Deletion Premium |
| 6 | Correction Addition Premium |
| 7 | Correction Deletion Premium |
| 8 | Net Premium |
| 9 | Net Tax Amount |
| 10 | Net Gross Premium |

Empty state: amounts show `—` when data is unavailable. Zero is a valid value and is rendered as `₹0`.

---

## 8. Section 4 — Individual Endorsements Accordion

One card per endorsement record for this policy. Cards are stacked vertically; each card can be independently expanded or collapsed.

### 8.1 Collapsed State

Each card shows a single-line summary row:

| Element | Content |
|---|---|
| Endorsement number | e.g., `END-00042` |
| Type chip | Colour-coded: Inception (blue) · Addition (green) · Deletion (red) · Correction (amber) |
| Date | DD/MM/YYYY |
| Summary chip strip | Additions count · Deletions count · Active count · Net Gross premium value |

Clicking anywhere on the collapsed card header expands it.

### 8.2 Expanded State — Employee Info Snapshot

A table showing the employee movement for this endorsement. Columns vary by endorsement type:

- **Inception:** Employee Name · Employee ID · Date of Joining · Department · Sum Insured
- **Addition:** Employee Name · Employee ID · Addition Date · Department · Sum Insured
- **Deletion:** Employee Name · Employee ID · Deletion Date · Department · Reason
- **Correction:** Employee Name · Employee ID · Field Changed · Old Value · New Value

If no employee records are available for the endorsement, show: *"No employee records available for this endorsement."*

### 8.3 Expanded State — Premium Component Snapshot

A two-column table (Component · Amount) showing premium components applicable to this endorsement. Rows shown are a subset of §7 filtered to components relevant to the endorsement type (e.g., a Deletion endorsement shows Deletion Premium but not Addition Premium).

### 8.4 Expanded State — Upload Form

The upload form is positioned below the premium snapshot, separated by a divider. It allows the HR Admin to submit a member data file for this specific endorsement.

#### Form Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Data Type | Dropdown | Yes | Options: "Employee Data Only" · "Employee + Dependents Data". Determines file schema and template. |
| Enrollment Start Date | Date input | Yes | Start of the enrollment window for this upload. Defaults to today. |
| Enrollment End Date | Date input | Yes | End of the enrollment window. Defaults to today + 15 days. |
| Number of Employees | Numeric input | Yes | Expected employee count in the file. |
| Number of Dependents | Numeric input | Yes | Expected dependent count in the file (0 is valid for employee-only uploads). |

#### File Upload Control

| Element | Behaviour |
|---|---|
| Download Template | Downloads the upload template matching the selected Data Type. Template reflects column headers for the configured data type. |
| File upload input | HR Admin selects a file. Accepted formats: `.xlsx`, `.csv`. Maximum size: 10 MB. Upload triggers immediately on file selection. |
| Template unavailable | If the template cannot be fetched: *"Template unavailable. Please contact support."* |

#### Upload Disabled State

The file upload control is disabled in two scenarios:

| Scenario | Visual treatment |
|---|---|
| Required form fields not yet filled | Upload button disabled; no banner shown |
| Endorsement Step 2 completed in iWork | Amber banner: *"Upload is disabled — Step 2 has been completed for this endorsement in iWork."* Upload and Download Template buttons both disabled. |

Step 2 completion is determined by the `endorsementStatus` field returned in the `endorsement_list` API response. If `endorsementStatus` is `COMPLETED`, `LOCKED`, `APPROVED`, or `FINALIZED`, upload is locked. The exact status value depends on the iWork endorsement lifecycle and must be confirmed with the iWork team (see TRD §13.2).

#### File-Level Rejection

If the submitted file fails a file-level check, the rejection reason is displayed inline below the upload control. No upload record is created.

| Rejection reason | Message |
|---|---|
| Unsupported file type | *"Unsupported file type. Please upload an .xlsx or .csv file."* |
| File exceeds 10 MB | *"File too large. Maximum allowed size is 10 MB."* |
| Empty file | *"The selected file contains no data rows."* |
| Headers do not match template | *"File headers do not match the template for this policy. Download the template to see the expected format."* |

### 8.5 Expanded State — Uploaded Files Table

Positioned below the upload form, this table shows all files submitted for this endorsement.

#### Table Columns

| Column | Source | Rendering |
|---|---|---|
| Upload Date | `submitted_at` | DD/MM/YYYY HH:MM |
| File Name | `original_file_name` | Text with download icon — clicking downloads the original file |
| Total Records | `total_count` | Numeric |
| Success | `success_count` | Numeric, green text |
| Failed | `error_count` | Numeric, red text |
| Error File | `error_file` | Download icon, active only when an error file exists |
| Status | `process_status` | Chip: Processing (amber) · Completed (green) · Failed (red) |

#### Default Sort

`submitted_at` descending — most recent upload at the top.

#### Pagination

Format: "Showing {pageSize} of {total} entries"
Default page size: 10 rows. Controls: Previous / page numbers / Next.

#### Empty State

When no files have been uploaded for this endorsement:

| Element | Content |
|---|---|
| Icon | Upload icon |
| Heading | *"No uploads yet"* |
| Sub-text | *"Upload a member data file using the form above."* |

#### Processing Status Refresh

When a file is in `PROCESSING` status, a **Refresh** button is shown above the table. Clicking it reloads the table to reflect the latest processing status.

---

## 9. Loading and Error States

### 9.1 Endorsement List Loading

While the endorsement records are being fetched, the accordion section shows a loading skeleton. Sections 1–3 may render independently if their data arrives first.

### 9.2 Endorsement Data Fetch Error

If the endorsement list fails to load:

| Element | Content |
|---|---|
| Message | *"Unable to load endorsement data. Please try again."* |
| Action | **Retry** |

### 9.3 Uploaded Files Table Loading

While the uploaded files table is being fetched (on card expand), the table area shows a loading skeleton. The upload form is not affected.

### 9.4 Uploaded Files Table Fetch Error

If the table fails to load on expand:

| Element | Content |
|---|---|
| Message | *"Unable to load uploaded files. Please try again."* |
| Action | **Retry** |

### 9.5 Async Processing — Result Not Yet Available

If a file has been submitted and processing has not completed, the table shows that row with Status = `Processing` and the Refresh button is visible. The HR Admin can navigate away and return; the result will be present when processing completes.

---

## 10. Schema Notes

| Note | Detail |
|---|---|
| Policy context is inherited | The policy is derived from the HR Admin's company session context. No policy selection field is shown within the tab. |
| Upload is endorsement-scoped | The upload form and uploaded files table are scoped to a specific endorsement card. Each card manages its own upload history independently. |
| Data Type drives the file schema | The Data Type dropdown selection determines the upload template and file structure (employee-only vs. employee + dependents). |
| Error file availability | The error file download in the uploaded files table is only active when `error_count > 0` and an error file has been generated by the processing scheduler. |
| Overview data is read-only | Sections 1–3 (Overview Block, Employee Metrics, Premium Table) display data sourced from iWork. They cannot be modified through this tab. |
| Upload detail is embedded in the listing response | The full processing detail for each upload record (error breakdown, counts, timestamps) is returned as part of the uploaded files listing response. No additional API fetch is required when a user accesses the detail of a record — render it from the already-loaded row data. |

---

## 11. Implementation Status and Known Gaps

This section records the delta between this SDS and the current frontend codebase state. Last updated: 2026-05-05 after Stage 50 implementation of TASK-IE-009 through TASK-IE-012.

### 11.1 Current Frontend State

| SDS Section | Status | Notes |
|---|---|---|
| §5 — Overview Block (Net Gross Premium, Total Endorsements) | ✅ Real API | Bound to `endorsement_overview` admin_reports endpoint |
| §6 — Employee Information Cumulative Metrics (8 tiles) | ✅ Real API | Bound to `endorsement_employee_metrics` admin_reports endpoint |
| §7 — Premium Information Table (10 rows) | ✅ Real API | Bound to `endorsement_premium_components`; amounts return NULL until TASK-IE-017 |
| §8.1 — Collapsed card (endorsement header, type chip, date, counts) | ✅ Real API | Bound to `endorsement_list` admin_reports endpoint |
| §8.2 — Expanded card: Employee Info Snapshot | ⚠️ Static placeholder | Per-endorsement data pending TASK-IE-017 dedicated endpoint |
| §8.3 — Expanded card: Premium Component Snapshot | ⚠️ Static placeholder | Per-endorsement data pending TASK-IE-017 |
| §8.4 — Upload Form | ✅ Implemented | `EndorsementUploadSection` component; all fields, template download, file upload |
| §8.5 — Uploaded Files Table | ✅ Implemented | Inside `EndorsementUploadSection`; 7-column table, status chips, refresh, file downloads |

### 11.2 Remaining Open Items

| Item | Detail |
|---|---|
| Per-card employee and premium data (§8.2–§8.3) | TASK-IE-017 must deliver a per-endorsement drill-down API or extend `endorsement_list` to include this data. Until then, static placeholder rows are shown. |
| Premium component amounts (§7) | `endorsement_premium_components` SQL returns NULL for all 10 components until the iWork source table is confirmed (TASK-IE-017). |
| SQL scripts execution | The 4 admin_reports seed scripts in `hr-module-inception-endorsement-scripts.sql` must be executed against the database before §5–§7 and the accordion data will populate from real data. |

---

## 12. Approval

Leave blank. UX Lead / Product sign-off authority.

```
Approved by:
Role:
Date:

Approved by:
Role:
Date:
```

---

# END OF SDS
