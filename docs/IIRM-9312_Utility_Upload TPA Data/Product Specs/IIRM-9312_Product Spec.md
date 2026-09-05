## Jira ID: IIRM-9312
##### Jira Title: Utility - File Transformation - TPA - Inbound - TPA Data (Inception/Endorsement - Step-6: Upload TPA Data) {#jira-title-utility-file-transformation-tpa-inbound-tpa-data-inceptionendorsement-step-6-upload-tpa-data}
##### Purpose of the document: Feature specification and business scenarios

## Table of Contents
 
- [Jira ID: IIRM-9312](#jira-id-iirm-9312)
      - [Jira Title: Utility - File Transformation - TPA - Inbound - TPA Data (Inception/Endorsement - Step-6: Upload TPA Data) {#jira-title-utility-file-transformation-tpa-inbound-tpa-data-inceptionendorsement-step-6-upload-tpa-data}](#jira-title-utility---file-transformation---tpa---inbound---tpa-data-inceptionendorsement---step-6-upload-tpa-data-jira-title-utility-file-transformation-tpa-inbound-tpa-data-inceptionendorsement-step-6-upload-tpa-data)
      - [Purpose of the document: Feature specification and business scenarios](#purpose-of-the-document-feature-specification-and-business-scenarios)
- [Table of Contents](#table-of-contents)
- [1. Module Overview](#1-module-overview)
- [2. Scope and Boundaries](#2-scope-and-boundaries)
- [3. User Personas and Contexts](#3-user-personas-and-contexts)
- [4. User Stories](#4-user-stories)
  - [ISG Executive](#isg-executive)
  - [ISG Manager](#isg-manager)
  - [Policy Administrator](#policy-administrator)
  - [Error Handling and Edge Cases](#error-handling-and-edge-cases)
  - [Lifecycle and Governance](#lifecycle-and-governance)
- [5. Success Metrics](#5-success-metrics)
- [6. Future Considerations](#6-future-considerations)
- [7. Open Questions](#7-open-questions)
 

## 1. Module Overview

- **Purpose:** Enable upload, mapping, and transformation of TPA-provided policy/claim data files into the platform’s standardized fields (POLICY, CLAIM) to support downstream servicing.
- **Business Value:** Reduce manual reconciliation and accelerate onboarding by making TPA data intake deterministic, version-controlled, and audit-ready.
- **User Value:** Provide a guided, repeatable process to validate and load TPA files with detected headers, sample preview of transformations, clear errors, and audit history.
- **Module Type:** Feature
- **Phase 1 Scope:** Core upload (CSV/XLSX) with header detection, two-column mapping against standard entity fields (POLICY/CLAIM), basic transformations, sample preview, validation with reject-on-error and downloadable report, versioned templates with simple approval, import/export, and audit + version lock.

## 2. Scope and Boundaries

- **In Scope:**
    - Upload CSV/XLSX within defined size limits; header detection; optional sheet selection for XLSX
    - Drag-and-drop mapping from source headers to standard entity fields fetched via entity-fields API (POLICY, CLAIM)
    - Basic transformations: date normalization, numeric cleanup, code/value lookups (e.g., insurer names → IDs)
    - Sample preview of first N rows post-mapping/transformation to verify results before committing
    - Validation with reject-on-error and downloadable error report (row, field, value, description)
    - Versioned mapping templates per company/entity; single active version; simple approval workflow (one pending at a time)
    - Template import/export (JSON) for review/portability
    - Version lock at upload start; audit trail linking upload to template version
- **Out of Scope:**
    - Advanced transformation rule builder
    - AI auto-mapping suggestions
    - Bulk cross-company operations
    - Real-time integration back to TPAs
- **Dependencies:**
    - Org-service (TPA/company context)
    - Document-service (entity-fields, mapping-template save/get/delete, storage)
    - Auth-service (role-based access and approvals)
- **Dependents:**
    - Claims processing flows (consumption of validated, transformed datasets)
    - Policy data reconciliation and reporting

## 3. User Personas and Contexts

- **ISG Executive**
    - **Goals:** Configure and test TPA data mappings effectively
    - **Context:** Works during integration setup or periodic data intake
    - **Pain Points:** Inconsistent TPA column conventions and formats

- **ISG Manager**
    - **Goals:** Approve mappings and ensure data quality
    - **Context:** Reviews mapping submissions and monitors uploads
    - **Pain Points:** Visibility into mapping completeness and history

- **Policy Administrator (Indirect)**
    - **Goals:** Run uploads successfully with minimal rework
    - **Context:** Uses approved mappings during routine file intake
    - **Pain Points:** Unclear error feedback or missing mandatory fields

## 4. User Stories

### ISG Executive
- **US-TPA-001:** As an ISG Executive, I want to upload TPA data files and see detected headers so that I can start mapping.
    - **Acceptance Criteria:**
        - Accept commonly used CSV/XLSX files within approved business limits; for spreadsheets, allow selecting the relevant sheet
        - Detect headers from the first row; if duplicates are found, auto-suffix and warn
        - Display the list of source headers and a sample row count along with basic file details
        - Validate that the file type and size conform to approved standards
        - Block unsafe or suspicious files from being processed
- **US-TPA-002:** As an ISG Executive, I want to map TPA columns to standard fields with mandatory indicators so that uploads transform correctly.
    - **Acceptance Criteria:**
        - Show the list of target fields for the selected dataset (POLICY or CLAIM)
        - Indicate mandatory fields for Phase 1:
            - POLICY dataset: at least one identifier (policyNumber or insurerPolicyNumber), insurer, sumInsured, and either netPremium or grossPremium
            - CLAIM dataset: claimNumber (do not surface diagnosis in UI)
        - Prevent saving a mapping when any mandatory target is unmapped
        - Show progress (mapped vs. total target fields); prevent duplicate mapping of the same target field
        - Require choosing the dataset (POLICY or CLAIM) before mapping and remember the selection
- **US-TPA-003:** As an ISG Executive, I want basic transformation rules per field so that TPA data aligns to system formats.
    - **Acceptance Criteria:**
        - Dates are normalized to a consistent format
        - Numeric values (e.g., premiums and sum insured) are cleaned and standardized
        - Lookups (e.g., insurer names) can be resolved to the platform’s values; unresolved items produce warnings
        - A sample preview shows mapped columns and transformed values for a small set of rows
        - The preview renders promptly to support review before proceeding

### ISG Manager
- **US-TPA-004:** As an ISG Manager, I want to review and approve mapping submissions so that they become active for uploads.
    - **Acceptance Criteria:**
        - Submit mapping creates a new template version in “pending approval” state (one pending at a time)
        - Approve: previous active version auto-deactivated; new version activated
        - Reject: remains inactive; author notified; all actions audited (who, when, comment)

### Policy Administrator
- **US-TPA-005:** As a Policy Administrator, I want the system to use the latest approved mapping automatically during upload so that I don’t manually reformat.
    - **Acceptance Criteria:**
        - At upload start, auto-select and lock the latest active mapping version for the selected entity and company
        - Display locked version number in the upload summary; if no active version exists, prompt to select last approved or block with guidance

### Error Handling and Edge Cases
- **US-TPA-006:** As a user, I want clear error reporting when validation fails so that I can correct and retry.
    - **Acceptance Criteria:**
        - Provide a downloadable error report that highlights the row, field, original value, and error description
        - Summarize top error categories and counts; keep an auditable record of the attempt
        - Block the upload when mandatory targets are missing or when critical formats are invalid
        - Edge cases covered:
            - Empty data rows are flagged with guidance to remove or correct
            - Duplicate headers are auto-suffixed and clearly indicated for mapping
            - Mixed numeric formats (e.g., symbols/commas) trigger clear guidance when they cannot be interpreted
            - Unresolved reference values (e.g., insurer name) prompt guided resolution or are flagged accordingly
- **US-TPA-007:** As a user, I want version lock during upload so that concurrent mapping changes don’t affect processing.
    - **Acceptance Criteria:**
        - Lock mapping template version at upload start; new approvals during processing do not affect the current upload
        - Store locked version reference in upload audit; display version info in UI

### Lifecycle and Governance
- **US-TPA-008:** As an ISG Executive, I want to import/export mapping templates so that configurations can be reviewed and reused across environments.
    - **Acceptance Criteria:**
        - Export the current template including entity, version, mappings, and transformation configurations
        - Import validates the configuration and target fields
        - Import creates a new draft/pending version and does not overwrite the active version
        - Only authorized roles can import/export; all actions are recorded

- **US-TPA-009:** As an ISG Manager, I want version history and management so that I can review changes and restore when needed.
    - **Acceptance Criteria:**
        - Show timeline/table of versions with: version number, status (ACTIVE/INACTIVE/PENDING), created by/date, change note
        - View a version’s mappings and transformation configs without editing
        - Duplicate/Restore a prior version into a new draft for editing and submission
        - Deleting an active version re-activates the correct previous version (if any); all actions audited

## 5. Success Metrics

- **Business Metrics:** Reduced onboarding time; fewer manual corrections across first uploads
- **User Metrics:** Upload success rate; first-pass validation rate; reduction in error counts over time
- **Adoption Metrics:** Active mappings per TPA/company; upload frequency by TPA

## 6. Future Considerations

- **Enhancement 1:** AI-powered auto-mapping suggestions for source-to-target alignment
- **Enhancement 2:** Advanced transformation rule builder (chained transforms, custom expressions)

## 7. Open Questions

None for Phase 1; values finalized above.
