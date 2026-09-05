## Jira ID: IIRM-9161
##### Jira Title: Utility - File Transformation - Client - Outbound - Employee Data (Inception/Endorsement - Send to Client)
##### Purpose of the document: Feature specification and business scenarios

---

## Entrypoint
**Company Details Screen:** In the company details screen introduce a tab called "Client file template config"

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Scope and Boundaries](#2-scope-and-boundaries)
3. [User Personas and Contexts](#3-user-personas-and-contexts)
4. [User Stories](#4-user-stories)
5. [Technical Specifications](#5-technical-specifications)
6. [User Interface Requirements](#6-user-interface-requirements)
7. [Future Considerations](#7-future-considerations)
8. [Open Questions](#8-open-questions)

---

## 1. Module Overview

- **Purpose:** Enable ISG teams to send client-facing artifacts (documents, summaries, schedules) with proper recipient selection, templates, audit trails, and delivery status tracking.
- **Business Value:** Streamlines consistent client communication from a centralized flow, reduces back-and-forth, and ensures auditability.
- **User Value:** One place to compose, preview, and send client content securely with validation and history.
- **Module Type:** Utility (Outbound Communication)
- **Phase 1 Scope:** Baseline sending workflow with recipient selection, content/package selection, standard templates, preview, send, and delivery logging.

## 2. Scope and Boundaries

- **In Scope (Phase 1):**
    - Recipient selection (existing client contacts; manual entry with validation)
    - Content selection (pre-approved artifacts; limited file types)
    - Email template selection (standard templates)
    - Preview and send
    - Delivery log and basic status (sent/failed)
    - Audit trail (who/when/what sent)

- **Out of Scope (Phase 1):**
    - SMS/WhatsApp channels
    - Advanced scheduling and automation
    - Custom template builder
    - Multi-language content generation
    - Bulk (mass) mailing

- **Dependencies:**
    - Organization Service (client/company contacts)
    - Document Service (artifact storage, download URLs)
    - Notification Service (email delivery)
    - Auth Service (role/permission checks)

- **Dependents:**
    - Policy workflows that require client acknowledgements
    - Operations dashboards (communication history)

## 3. User Personas and Contexts

### ISG Executive
- **Goals:**
    - Send correct artifacts to the right client recipients promptly
    - Ensure a clear, professional email with the right template
    - Track whether content was sent and recorded

- **Context:**
    - Works within policy workflows, needs quick outbound send capability

- **Pain Points:**
    - Manual copy/paste from multiple systems
    - Lack of centralized audit of what was sent

### ISG Manager
- **Goals:**
    - Ensure outbound communications meet standards
    - Review/monitor sends when needed

- **Context:**
    - Oversees comms quality, handles exceptions

- **Pain Points:**
    - Inconsistent formatting and missing records

### Policy Administrator (Indirect)
- **Goals:**
    - Confirm that outbound documents were sent and logged

- **Context:**
    - Needs visibility to communication history tied to policy/company

- **Pain Points:**
    - Difficulty finding historical sends across systems

## 4. User Stories

#### US-IIRM-9161-001: Outbound Template Mapping Configuration (Client-Specific)
**As an** ISG Executive  
**I want to** configure a client-specific outbound file template by mapping source fields to target columns, reordering, renaming, and adding columns  
**So that** the generated file matches the client's required format for Inception/Endorsement "Send to Client"

**Acceptance Criteria:**
- **Layout & Orientation:**
    - Source fields displayed on the left as a vertical list (system data fields available for outbound)
    - Target columns displayed on the right as a horizontal grid (represents the final outbound file columns in order)
- **Mapping Actions:**
    - Drag-and-drop from Source (left) to a Target column cell (right) to bind a field
    - Each Target column shows its bound Source field (or "Unmapped")
    - Unmapped Target columns render with a distinct background and warning icon
- **Reorder Target Columns:**
    - Drag Target column headers to change order; order reflects final outbound file column sequence
    - Display live counter: "X columns configured · Y unmapped"
- **Rename Target Columns:**
    - Click Target header to edit display name (client-required label)
    - Persist original system field name as metadata; display client label in the grid
- **Add New Target Columns:**
    - "Add Column" button inserts a new Target column at selected position
    - New column can be bound to a Source field or marked as "Derived/Static"
    - For static columns: allow entering a constant value (e.g., Client Code, Policy Type)
- **Derived/Computed Columns (Phase 1 minimal):**
    - Enable simple expressions based on one Source field (e.g., format Date, uppercase Name)
    - Advanced multi-field formulas deferred to Phase 2
- **Validation & Save:**
    - Require at least the client-mandatory Target columns to be bound (configuration rules to be defined per client)
    - Prevent save if any mandatory is unmapped; show consolidated error list
    - "Save Template" stores per Company (and optional Policy) context with versioning (v1, v2, ...)
- **Preview & Download:**
    - "Preview Sample" generates first 5 rows using current configuration
    - "Download Sample" exports a small CSV/XLSX reflecting the Target order and labels
- **Version & Audit:**
    - Maintain version history with Created By, Created Date, Change Summary
    - Allow Duplicate and Restore of previous versions into a new draft

---

#### US-IIRM-9161-002: Outbound Dataset Availability Post Step-2
**As an** ISG Executive  
**I want to** have a ready-to-use outbound dataset available immediately after Step-2 (Create Inception/Endorsement)  
**So that** I can generate and send client files without additional manual collation

**Acceptance Criteria:**
- **Trigger Points:**
    - Inception: After "Create Inception" (Step-2) is completed, system compiles the outbound dataset
    - Endorsement: After "Create Endorsement" (Step-2) is completed, system compiles the outbound dataset
- **Dataset Contents (minimum):**
    - Employee demographics (ID, Name, DOB, Gender)
    - Enrollment selections (Sum Insured choices, selected plan/options)
    - Premium breakdown (base premium, GST, terrorism, total)
    - Policy context (Company, Policy Number/Type, Effective dates)
    - Dependents (relation, name, DOB, gender) where applicable
- **Data Integrity:**
    - Snapshot reflects the state at Step-2 completion and is version-locked
    - Any subsequent changes appear only in later snapshots; current send uses the locked snapshot
- **Access:**
    - Dataset is accessible to the outbound template generator and preview
    - Audit record stores snapshot ID linked to the send

---

#### US-IIRM-9161-003: Generate Outbound File Using Configured Template
**As an** ISG Executive  
**I want to** generate a client-specific outbound file (CSV/XLSX) from the Step-2 dataset using the configured template  
**So that** the file matches client-required columns, order, and labels

**Acceptance Criteria:**
- **Template Application:**
    - Apply latest approved outbound template for the Company (and Policy, if policy-scoped)
    - Lock template version at generation time; log version used
- **Column Rules:**
    - Use Target column order and labels from the template
    - Populate bound Source fields, static columns, and simple derived columns per configuration
- **Formats:**
    - Support CSV and XLSX; default to XLSX unless client config specifies CSV
    - Ensure date/number formatting as per template rules
- **Validation:**
    - Fail generation if any client-mandatory Target column is unmapped; show consolidated error list
    - Warn (but allow) when optional columns are unmapped
- **Output & Preview:**
    - Allow "Download File" prior to email send
- **Audit:**
    - Store artifact with metadata: template version, snapshot ID, file type, generated at, generated by

---

#### US-IIRM-9161-004: Mandatory Target Columns Unmapped (Generation Blocker)
**As an** ISG Executive  
**I want to** receive clear errors when client-mandatory Target columns are not mapped  
**So that** I can fix the template configuration before generating the outbound file

**Acceptance Criteria:**
- **Blocking Rule:**
    - If any mandatory Target columns are unmapped, generation is blocked
    - Error panel lists missing columns by display label and internal key
- **Fix Path:**
    - "Open Template Mapping" CTA navigates to the outbound template configuration
    - After fixing, user can re-attempt generation without losing context
- **Audit:**
    - Log failed generation attempt with list of unmapped mandatory columns

---

#### US-IIRM-9161-005: Missing Premium Details or SI Choices (Data Completeness)
**As an** ISG Executive  
**I want to** be notified when the Step-2 dataset lacks premium breakdowns or SI choices required by the client template  
**So that** I can correct upstream data before sending

**Acceptance Criteria:**
- **Detection:**
    - Validate presence of minimum premium fields (base, GST, terrorism, total) when template includes any premium columns
    - Validate that SI choice fields exist when template includes SI choice columns
- **Behavior:**
    - Generation fails with consolidated error list when required fields are missing
    - Provide "View Step-2 Snapshot" to inspect missing fields context
- **Audit:**
    - Record failure reason including missing field keys and template version used

---


#### US-IIRM-9161-006: Template Version Conflicts and Concurrency
**As an** ISG Manager  
**I want to** avoid conflicts when templates change during generation or send  
**So that** the correct version is always used and audited

**Acceptance Criteria:**
- **Version Locking:**
    - Lock outbound template version at generation start; use locked version through send
    - Warn: "A newer template exists (vY). This send uses vX locked at generation time."
- **Approval State:**
    - Disallow generation with unapproved templates; show: "Template must be approved before use"
- **Concurrent Edit:**
    - If template is edited during generation, continue with locked version; audit notes concurrent change
- **Audit:**
    - Persist template version, editor (if concurrent change), and timestamps

---

#### US-IIRM-9161-007: Minimal Standard Outbound Template Columns (Phase 1)
**As an** ISG Executive  
**I want to** use a minimal standard outbound template (Employees + SI + Premiums)  
**So that** the “Send to Client” step produces a consistent XLSX/CSV file without dependents in Phase 1

**Acceptance Criteria:**
- **Applies To:** Inception flow at "Client Confirmation" step; file labeled "Inception data" (see UI config: InceptionClientConfirmationConfig)
- **Default Columns (order):**
    1. EMP CODE (Employee ID)
    2. EMPLOYEE NAME (Full Name)
    3. DATE OF BIRTH (YYYY-MM-DD)
    4. GENDER (Male/Female)
    5. SUM INSURED (Selected SI)
    6. BASE PREMIUM
    7. GST AMOUNT
    8. TERRORISM PREMIUM AMOUNT
    9. TOTAL PREMIUM AMOUNT
    10. POLICY NUMBER
    11. POLICY TYPE
    12. EFFECTIVE START DATE (YYYY-MM-DD)
    13. EFFECTIVE END DATE (YYYY-MM-DD)
- **Source Mapping:**
    - Premium fields sourced from Step-2 "Receive Acknowledgement from Insurer" (endorsementPremiumAmount, gstAmount, terrorismPremiumAmount, totalPremiumAmount)
    - Employee demographics and SI choice from Step-2 dataset snapshot
    - Policy context (Policy Number/Type/Effective dates) from policy header
- **Formats & Constraints:**
    - Dates in ISO format (YYYY-MM-DD)
    - Numbers as decimals (two fractional digits); no thousand separators
    - Gender normalized to Male/Female
- **Generation Rules:**
    - Default to XLSX; allow CSV if client requires
    - Include only employees (no dependents in Phase 1); dependents deferred to Phase 2
- **Validation:**
    - Block generation if any of the premium fields are missing when premium columns included
    - Block generation if Employee ID or Name is missing
    - Warn (non-blocking) if Effective End Date is empty
- **Audit:**
    - Persist template version, column order, and label set used
    - Link artifact to Step-2 snapshot ID and Client Confirmation send record

---

#### US-IIRM-9161-008: Recipients Selection & Validation
**As an** ISG Executive  
**I want to** select recipients from company contacts and add emails manually with strict validation  
**So that** outbound files and artifacts are sent to the right client stakeholders reliably

**Acceptance Criteria:**
- **Recipient Sources:**
    - Contact picker lists Company contacts from Organization Service (roles: HR, Finance, Admin, Primary Contact)
    - Manual add supports entering one or more email addresses (comma/semicolon separated)
- **Validation Rules:**
    - Validate email format for all entries; highlight invalid entries inline with error text
    - Deduplicate recipients across contact picker and manual entries (case-insensitive)
    - Enforce max recipients per send (Phase 1: 25); show counter "N of 25"
    - Blocklisted domains are rejected (configurable list); error: "Domain not permitted"
    - Required: At least one valid recipient before enabling Send
- **Visibility:**
    - Display final recipient list with badges showing source: Contact or Manual
    - Allow remove (x) per recipient; updates counter and validation state
- **Audit:**
    - Persist recipients used in send (resolved emails, source), sender, timestamp
    - Log validation failures (invalid emails, blocked domains) with reason

---

#### US-IIRM-9161-009: Outbound Template Approval Workflow
**As an** ISG Executive  
**I want to** submit outbound file template configurations for ISG Manager approval  
**So that** only reviewed and approved templates are used for generation and send

**Acceptance Criteria:**
- **Submission for Approval (Executive):**
    - "Submit for Approval" is enabled only when all client-mandatory Target columns are mapped (see US-IIRM-9161-004)
    - Status changes from Draft → Pending Approval; configuration becomes read-only until decision
    - In-app notification sent to ISG Manager roles with Company/Policy context
- **Manager Review:**
    - Review screen shows: Target column order and labels, bound Source fields, static/derived columns, and validation summary (X mandatory mapped · Y optional unmapped)
    - Approve: Status → Approved; template becomes eligible for generation and send immediately
    - Reject: Status → Rejected; mandatory rejection comment required; template returns to Executive for edits
    - Approval comment optional; rejection comment required (min 10 chars)
- **Usage Rules:**
    - Generation (US-IIRM-9161-003) and send flows must block unapproved templates → Error: "Template must be Approved before use"
    - Template version is locked at generation start and carried through send (reinforces US-IIRM-9161-006)
- **Constraints:**
    - Only one version can be in Pending Approval per Company (and Policy scope, if applicable)
    - Current Approved version remains active while another version is Pending Approval
- **Audit & Notifications:**
    - Record approver/rejector, decision, timestamps, and comments
    - Notify Executive on decision (Approved/Rejected) with comment excerpt

---

#### US-IIRM-9161-010: Outbound Template Version History & Management
**As an** ISG Manager  
**I want to** view and manage all outbound template versions for a Company (and Policy scope when applicable)  
**So that** approved versions are clear, history is preserved, and operations remain safe and auditable

**Acceptance Criteria:**
- **Version List View:**
    - Display rows with: Version number, Status (Draft/Pending Approval/Approved/Rejected), Created By, Created Date, Approved/Rejected By, Approved/Rejected Date, Change Summary
    - Show Active version indicator badge for the current Approved version
    - Indicate scope: Company-level or Policy-level (if policy-scoped templates are used)
    - Filters: Status, Date range, Created By; Search by Version/Change Summary
- **Version Operations:**
    - Restore: Creates new Draft from a selected Approved version
    - Duplicate: Creates new Draft from any version
    - Edit: Allowed for Draft and Rejected versions only; Pending/Approved are read-only
    - Delete: Allowed for Draft versions only (confirmation required)
    - Replace Template: Upload revised configuration to create a new Draft version; Change Summary mandatory
- **Usage & Constraints:**
    - Only one version can be Pending Approval per Company (and per Policy scope, if applicable)
    - Current Approved version remains Active while another version is Pending Approval
    - Generation and Send use the latest Approved version (Phase 1); optional historical version selection deferred to Phase 2
    - Version is locked at generation start and carried through send (see US-IIRM-9161-006)
    - Export Version History to CSV/XLSX for audit/reporting
- **Version Detail View:**
    - Read-only page shows Target column order and labels, bound Source fields, static/derived columns, validation completeness (mandatory mapped, optional unmapped)
    - Display approval/rejection comments and decision timestamps
- **Audit:**
    - Record who performed Restore/Duplicate/Delete/Replace, timestamps, and reason (Change Summary)
    - Link send artifacts to the template version used for generation for end-to-end traceability

---

## 5. Technical Specifications

- **Channels:** Email via Notification Service (Phase 1)
- **Attachments:** From Document Service (immutable URLs; virus scan status TBD)
- **Templates:** Standardized templates with placeholder substitution (e.g., {{CompanyName}}, {{PolicyNumber}})
- **Audit:** Store send metadata (sender, recipients, subject, template, artifacts, timestamp, status)
- **Error Handling:** Capture delivery failure reason; expose for retry

## 6. User Interface Requirements

### Send to Client
- **Screen/Page:** Outbound Communication

    - **Key Elements:**
        - Recipient selector (contact list with add-email option)
        - Artifact selector (documents picker)
        - Template selector + Subject/Body editor
        - Send button + status toast

    - **Notes:**
        - Outbound file preview is handled within generation flow (see US-IIRM-9161-003). This screen does not embed a live preview pane.

    - **Validation Rules:**
        - At least one valid recipient email required
        - At least one artifact required
        - Subject must not be empty

## 7. Future Considerations

- Multi-channel (SMS/WhatsApp)
- Bulk send with segmentation
- Custom template builder with approval workflow
- Read/open tracking and delivery callbacks
- Localization (multi-language)

## 8. Open Questions

- What file types are permitted for attachments (PDF/Excel/etc.)?
- Is there a maximum total attachment size?