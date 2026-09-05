## Jira ID: IIRM-9162
##### Jira Title: Utility - File Transformation - Insurer - Outbound - Employee Data (Inception/Endorsement - Send to Insurer)
##### Purpose of the document: Feature specification and business scenarios

---

## Entrypoint
**Insurer Details Screen:** In the insurer details screen introduce a tab called "Insurer file template config"

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

- **Purpose:** Enable ISG teams to send insurer-required documents and data files with proper recipient selection, standardized formats, audit trails, and delivery status tracking.
- **Business Value:** Streamlines consistent insurer communication with standardized formats, reduces processing delays, and ensures compliance with insurer requirements.
- **User Value:** One place to compose, format, and send insurer submissions securely with validation, tracking, and history.
- **Module Type:** Utility (Outbound Communication to Insurers)
- **Phase 1 Scope:** Baseline sending workflow with insurer contact selection, content/package selection, insurer-specific templates, preview, send, and delivery logging.

## 2. Scope and Boundaries

- **In Scope (Phase 1):**
    - Insurer contact selection (existing insurer contacts; manual entry with validation)
    - Content selection (insurer-required artifacts; standardized file formats)
    - Email template selection (insurer-specific templates)
    - Preview and send with insurer format compliance
    - Delivery log and basic status (sent/failed/acknowledged)
    - Audit trail (who/when/what sent to which insurer)
    - Insurer-specific data formatting and column mapping

- **Out of Scope (Phase 1):**
    - Portal integration for direct insurer system uploads
    - Advanced scheduling and automation
    - Custom template builder
    - Multi-language content generation
    - Bulk insurer notifications

- **Dependencies:**
    - Organization Service (insurer contacts and requirements)
    - Document Service (artifact storage, download URLs)
    - Notification Service (email delivery)
    - Auth Service (role/permission checks)
    - Policy Service (policy and endorsement data)

- **Dependents:**
    - Policy workflows requiring insurer approvals
    - Claims processing workflows
    - Operations dashboards (insurer communication history)

## 3. User Personas and Contexts

### ISG Executive
- **Goals:**
    - Send correct policy data to insurers in their required format
    - Ensure compliance with insurer submission requirements
    - Track submission status and insurer acknowledgements

- **Context:**
    - Works within policy workflows, needs to submit data for approvals
    - Must comply with specific insurer formats and requirements

- **Pain Points:**
    - Manual formatting for different insurer requirements
    - Lack of standardized submission process
    - Difficulty tracking submission status

### ISG Manager
- **Goals:**
    - Ensure insurer communications meet compliance standards
    - Monitor submission success rates and response times
    - Review escalations and failed submissions

- **Context:**
    - Oversees insurer relationship management
    - Handles submission exceptions and compliance issues

- **Pain Points:**
    - Inconsistent insurer submission formats
    - Missing audit trails for regulatory compliance

### Policy Administrator (Indirect)
- **Goals:**
    - Confirm that insurer submissions were completed and logged
    - Track policy approval status from insurers

- **Context:**
    - Needs visibility to insurer communication history tied to policies
    - Requires status updates for policy processing

- **Pain Points:**
    - Difficulty finding historical insurer submissions
    - Lack of integration between submission and approval tracking

## 4. User Stories

#### US-IIRM-9162-I-001: Insurer-Specific Outbound Template Configuration
**As an** ISG Executive  
**I want to** configure insurer-specific outbound file templates by mapping source fields to insurer-required columns and formats  
**So that** the generated file meets each insurer's specific data requirements for Inception/Endorsement submissions

**Acceptance Criteria:**
- **Layout & Orientation:**
    - Source fields displayed on the left as a vertical list (system policy and employee data fields)
    - Target columns displayed on the right as a horizontal grid (represents insurer-required file format)
- **Insurer-Specific Mapping:**
    - Select target insurer from dropdown to load their specific template requirements
    - Display insurer-mandatory fields with distinct highlighting (red border/asterisk)
    - Show insurer-preferred field names and formats as default labels
- **Mapping Actions:**
    - Drag-and-drop from Source to Target columns with validation
    - Each Target column shows bound Source field or "Required - Unmapped" status
    - Insurer-mandatory columns cannot be left unmapped
- **Format Requirements:**
    - Apply insurer-specific formatting rules (date formats, number precision, text casing)
    - Validate data types match insurer requirements (numeric, text, date)
    - Support insurer-specific value mappings (e.g., M/F to Male/Female)
- **Validation & Save:**
    - Block save if any insurer-mandatory fields are unmapped
    - Validate format compliance before template approval
    - Store template per Insurer context with versioning
- **Preview & Test:**
    - Generate sample file using insurer template with test data
    - Validate against insurer's published schema (if available)
- **Version & Audit:**
    - Maintain approval history with Insurer name, template version, approver
    - Track template changes with business justification

---

#### US-IIRM-9162-I-002: Post Step-2 Insurer Dataset Preparation
**As an** ISG Executive  
**I want to** have insurer-ready datasets available immediately after Step-2 completion  
**So that** I can generate and send compliant insurer files without manual data preparation

**Acceptance Criteria:**
- **Trigger Points:**
    - Inception: After "Create Inception" (Step-2), compile insurer submission dataset
    - Endorsement: After "Create Endorsement" (Step-2), compile endorsement dataset for insurer
- **Dataset Contents (insurer-focused):**
    - Policy header information (Policy Number, Effective dates, Coverage details)
    - Premium calculations (Base, GST, Terrorism, Total with insurer-required breakdowns)
    - Employee enrollment data (ID, demographics, selected coverage, sum insured)
    - Dependent information (if required by insurer)
    - Risk assessment data (age bands, industry classification)
    - Broker/intermediary details (commission structure, contact info)
- **Insurer Compliance:**
    - Format data according to selected insurer's requirements
    - Include all mandatory fields per insurer specifications
    - Apply insurer-specific business rules and validations
- **Data Integrity:**
    - Lock dataset version for insurer submission consistency
    - Maintain data lineage linking to policy creation events
- **Access & Security:**
    - Dataset accessible only to authorized insurer submission roles
    - Encrypt sensitive data fields as per insurer security requirements

---

#### US-IIRM-9162-I-003: Generate Insurer-Compliant Submission File
**As an** ISG Executive  
**I want to** generate insurer-specific submission files using approved templates and compliant formatting  
**So that** submissions are accepted by insurers without rejection or delays

**Acceptance Criteria:**
- **Template Application:**
    - Apply latest approved template for specific insurer
    - Lock template version for audit trail and consistency
- **Insurer Format Compliance:**
    - Generate file in insurer-required format (CSV/XLSX/fixed-width/XML)
    - Apply insurer-specific column headers and data formatting
    - Include insurer-required metadata headers or footers
- **Data Validation:**
    - Validate all mandatory fields are populated per insurer requirements
    - Check data type compliance (numbers, dates, text length limits)
    - Verify business rule compliance (age ranges, sum insured limits)
- **File Naming & Structure:**
    - Apply insurer-required file naming conventions
    - Include required metadata (submission date, policy count, total premium)
- **Quality Assurance:**
    - Generate validation report highlighting any data quality issues
    - Provide preview with insurer format before final generation
- **Output & Security:**
    - Encrypt files if required by insurer security policies
    - Generate password-protected files with secure password delivery
- **Audit Trail:**
    - Record template version, insurer, file format, generation timestamp
    - Link to policy dataset version used for generation

---

#### US-IIRM-9162-I-004: Insurer Mandatory Field Validation
**As an** ISG Executive  
**I want to** receive clear validation errors for missing insurer-mandatory fields  
**So that** I can ensure submission compliance before sending to insurers

**Acceptance Criteria:**
- **Validation Rules:**
    - Block generation if any insurer-mandatory fields are missing or invalid
    - Display comprehensive error report with field names and insurer requirements
    - Show data quality score and compliance percentage
- **Error Resolution:**
    - Provide "Fix Data Issues" navigation to source data entry screens
    - Allow manual override for non-critical validation warnings (with justification)
    - Show recommended actions for each validation error
- **Insurer-Specific Rules:**
    - Apply insurer-specific validation rules (e.g., age limits, coverage restrictions)
    - Validate against insurer's published business rules
    - Check for insurer-specific required field combinations
- **Audit & Compliance:**
    - Log validation failures with insurer context and error details
    - Track override decisions with business justification
    - Generate compliance report for regulatory purposes

---

#### US-IIRM-9162-I-005: Premium and Risk Data Completeness Validation
**As an** ISG Executive  
**I want to** be notified when premium calculations or risk data required by insurers are incomplete  
**So that** I can ensure accurate underwriting information is submitted

**Acceptance Criteria:**
- **Premium Validation:**
    - Verify base premium, GST, terrorism premium calculations are complete
    - Validate premium breakdowns match insurer's calculation methodology
    - Check for required premium adjustments (discounts, loadings)
- **Risk Data Validation:**
    - Ensure employee age distributions are calculated
    - Validate industry classification codes are assigned
    - Check sum insured distributions and risk bands
- **Underwriting Information:**
    - Verify all underwriting questionnaire responses are complete
    - Validate medical history declarations (if required)
    - Check previous claims history data (if applicable)
- **Error Handling:**
    - Block submission with detailed error report for missing critical data
    - Allow warnings for optional fields with business justification
    - Provide data source navigation for correction
- **Compliance Tracking:**
    - Record data completeness metrics for insurer relationship management
    - Track frequent validation failures for process improvement

---

#### US-IIRM-9162-I-006: Insurer Template Version Management and Compliance
**As an** ISG Manager  
**I want to** manage insurer template versions to ensure ongoing compliance with insurer requirements  
**So that** submissions continue to be accepted as insurer requirements evolve

**Acceptance Criteria:**
- **Version Control:**
    - Track template versions per insurer with effective dates
    - Maintain backward compatibility for in-flight policy processing
    - Alert when insurer updates their submission requirements
- **Compliance Monitoring:**
    - Monitor insurer acceptance rates by template version
    - Track rejection reasons and link to template configuration
    - Generate compliance reports for insurer relationship reviews
- **Template Updates:**
    - Create new template versions when insurer requirements change
    - Maintain approval workflow for template modifications
    - Provide migration path from old to new template versions
- **Concurrent Usage:**
    - Handle multiple template versions during transition periods
    - Lock template version at submission generation time
    - Audit which template version was used for each submission
- **Insurer Communication:**
    - Log template change notifications from insurers
    - Track implementation deadlines for new requirements
    - Maintain communication history with insurer technical teams

---

#### US-IIRM-9162-I-007: Standard Insurer Submission Template (Phase 1)
**As an** ISG Executive  
**I want to** use standardized insurer submission templates for common submission scenarios  
**So that** I can quickly generate compliant files for major insurers without custom configuration

**Acceptance Criteria:**
- **Standard Template Scope:**
    - Inception submissions for group health/life policies
    - Endorsement submissions for member additions/deletions
    - Premium adjustment submissions
- **Default Column Set (major insurers):**
    1. POLICY NUMBER
    2. EFFECTIVE DATE (insurer date format)
    3. EMPLOYEE ID
    4. EMPLOYEE NAME (Last, First format if required)
    5. DATE OF BIRTH (insurer date format)
    6. GENDER (insurer coding: M/F or Male/Female)
    7. RELATIONSHIP (Employee/Spouse/Child/Parent)
    8. SUM INSURED (insurer currency format)
    9. PLAN TYPE (insurer plan coding)
    10. BASE PREMIUM (insurer number format)
    11. GST AMOUNT (insurer tax format)
    12. TOTAL PREMIUM (insurer currency format)
    13. ENROLLMENT STATUS (Active/Inactive/Terminated)
    14. ENROLLMENT DATE (insurer date format)
- **Insurer Customization:**
    - Pre-configured templates for top 5 insurers
    - Insurer-specific field naming and formatting rules
    - Built-in validation for insurer business rules
- **File Format Support:**
    - Excel (.xlsx) with insurer-specific worksheets
    - CSV with insurer-required delimiters and encoding
    - Fixed-width format for legacy insurer systems
- **Validation Rules:**
    - Apply insurer-specific data validation rules
    - Check mandatory field completeness per insurer
    - Validate business rule compliance (age limits, coverage caps)
- **Audit Integration:**
    - Link submissions to policy transactions for compliance tracking
    - Record insurer response and acceptance status

---

#### US-IIRM-9162-I-008: Insurer Contact Selection and Communication Validation
**As an** ISG Executive  
**I want to** select appropriate insurer contacts and validate communication preferences  
**So that** submissions reach the correct insurer departments and personnel

**Acceptance Criteria:**
- **Insurer Contact Sources:**
    - Contact directory from Organization Service with insurer roles (Underwriting, Claims, Operations, IT)
    - Department-specific contact lists (New Business, Renewals, Endorsements)
    - Escalation contacts for urgent submissions or issues
- **Contact Validation:**
    - Validate email addresses are current and authorized
    - Check contact roles match submission type (e.g., underwriter for new policies)
    - Verify contact preferences for file formats and delivery methods
- **Multi-Contact Management:**
    - Support primary and secondary contacts for submissions
    - Allow CC/BCC lists for transparency and backup
    - Enforce insurer-specific recipient limits and restrictions
- **Communication Preferences:**
    - Respect insurer preferences for secure email vs portal upload
    - Apply insurer-specific encryption requirements
    - Honor insurer communication windows and blackout periods
- **Audit and Tracking:**
    - Record all recipients with roles and contact methods
    - Track delivery confirmations and read receipts
    - Log communication failures and retry attempts
- **Relationship Management:**
    - Maintain contact relationship history for each insurer
    - Track contact responsiveness and preferred communication methods
    - Alert for contact changes that affect submission workflows

---

#### US-IIRM-9162-I-009: Insurer Template Approval and Compliance Workflow
**As an** ISG Executive  
**I want to** submit insurer template configurations for approval with compliance verification  
**So that** only validated and compliant templates are used for insurer submissions

**Acceptance Criteria:**
- **Compliance Validation:**
    - Verify template meets insurer's published requirements
    - Check for regulatory compliance (insurance regulations, data protection)
    - Validate against insurer's technical specifications
- **Approval Workflow:**
    - Submit template for ISG Manager review with insurer requirements documentation
    - Include compliance checklist and validation results
    - Require business justification for any deviations from insurer requirements
- **Manager Review Process:**
    - Review template against insurer contract requirements
    - Verify data mapping accuracy and completeness
    - Test template with sample data before approval
- **Approval Decision:**
    - Approve: Template becomes active for insurer submissions
    - Reject: Return to Executive with specific compliance issues
    - Conditional: Approve with restrictions or monitoring requirements
- **Usage Controls:**
    - Block submissions using unapproved templates
    - Alert when approved templates approach expiration dates
    - Track usage statistics for compliance reporting
- **Insurer Communication:**
    - Notify insurer contacts of template updates (if required)
    - Provide submission format samples for insurer validation
    - Maintain approval documentation for audit purposes

---

#### US-IIRM-9162-I-010: Insurer Template History and Compliance Tracking
**As an** ISG Manager  
**I want to** maintain comprehensive history of insurer templates and compliance metrics  
**So that** I can ensure ongoing compliance and optimize insurer relationships

**Acceptance Criteria:**
- **Template History Management:**
    - Version history per insurer with approval status and effective dates
    - Change tracking with business justification and insurer communication
    - Rollback capability for template issues or insurer feedback
- **Compliance Metrics:**
    - Track submission success rates by template and insurer
    - Monitor rejection reasons and resolution times
    - Generate compliance scorecards for insurer relationship reviews
- **Performance Analytics:**
    - Measure submission processing times by insurer and template
    - Track data quality scores and improvement trends
    - Analyze insurer feedback and satisfaction metrics
- **Regulatory Compliance:**
    - Maintain audit trail for regulatory examinations
    - Track compliance with insurer contract requirements
    - Generate regulatory reports on insurer communication practices
- **Template Lifecycle Management:**
    - Alert for template updates based on insurer requirement changes
    - Schedule periodic template reviews and validations
    - Manage template retirement and migration planning
- **Relationship Optimization:**
    - Identify opportunities for process automation with insurers
    - Track insurer preferences and communication effectiveness
    - Maintain insurer relationship health metrics

---

## 5. Technical Specifications

- **Channels:** Secure email via Notification Service, future portal integration
- **File Formats:** XLSX, CSV, XML, fixed-width text files as per insurer requirements
- **Security:** File encryption, password protection, secure transmission protocols
- **Templates:** Insurer-specific templates with mandatory field validation and format compliance
- **Audit:** Comprehensive audit trail including insurer, submission content, delivery status, and response tracking
- **Integration:** Connect with insurer portals and acknowledgment systems (future)
- **Error Handling:** Detailed error reporting with insurer-specific resolution guidance

## 6. User Interface Requirements

### Send to Insurer
- **Screen/Page:** Insurer Communication Hub

    - **Key Elements:**
        - Insurer selector with contact directory integration
        - Template selector with compliance status indicators
        - File generator with format preview
        - Validation dashboard with compliance checklist
        - Send button with delivery tracking
        - Status dashboard showing submission history and insurer responses

    - **Validation Rules:**
        - Insurer must be selected with valid contacts
        - Template must be approved and current
        - All mandatory fields must be populated
        - File format must match insurer requirements
        - Security requirements must be met

    - **User Experience:**
        - Real-time validation feedback during file preparation
        - Clear compliance status indicators
        - Integration with insurer response tracking
        - Historical submission context and reference

## 7. Future Considerations

- Direct integration with insurer portals and systems
- Real-time submission status tracking with insurer acknowledgments
- Automated template updates based on insurer requirement changes
- Machine learning for submission success optimization
- Mobile app support for urgent insurer communications
- Multi-language support for international insurers
- Blockchain-based audit trails for regulatory compliance

## 8. Open Questions

- Which insurers require specific file encryption or security protocols?
- What are the maximum file sizes accepted by different insurers?
- Do any insurers require real-time API integration instead of file-based submissions?
- What insurer acknowledgment formats need to be supported?
- Are there specific regulatory requirements for insurer communication audit trails?