# PRD - Phase 1

## 1. Module Overview

- **Purpose:** A comprehensive admin interface for managing insurance covers master data, policy type configurations, and cover-to-policy-type mappings through three specialized screens
- **Business Value:** Eliminates direct database manipulation for covers management, reduces configuration errors, ensures data consistency across policy types, and provides centralized governance for insurance product definitions
- **User Value:** Insurance administrators can efficiently create, update, and organize covers without technical database knowledge, with built-in validation, duplicate detection, and workflow management
- **Module Type:** Core
- **Phase 1 Scope:** Three complete admin screens (Covers Master, Policy Type vs Covers Mapping, Policy Types Master), comprehensive CRUD operations, CSV bulk upload capabilities, advanced search/filtering, access control, and data validation

## 2. Scope & Boundaries

- **In Scope:**
    - Covers Master management with full CRUD operations, duplicate detection, and field configuration
    - Policy Type vs Covers Mapping with section management, reordering, and custom settings per policy type
    - Policy Types Master with organization-based access control and activation management
    - CSV bulk upload functionality for both covers and policy type mappings
    - Advanced search, filtering, and pagination across all screens
    - Role-based access control with view, create, and edit permissions
    - Data validation, effective date management, and business rules enforcement
    - Input type overrides at assignment level for policy type flexibility
    - Section-based cover organization within policy types
    - Comprehensive audit trail for all operations

- **Out of Scope:**
    - Direct integration with policy creation workflows (future phase)
    - Real-time synchronization with external insurance systems
    - Advanced reporting and analytics on covers usage
    - Version control and rollback capabilities for covers
    - Bulk editing operations beyond CSV upload
    - Custom grouped layout creation (preserved only for existing covers)
    - Multi-language support for cover definitions

- **Dependencies:**
    - Existing iWork admin interface framework
    - Database system for master data storage
    - Authentication and authorization service
    - User role and permission management system

- **Dependents:**
    - Reporting and analytics modules that use covers data

## 3. User Personas & Contexts

### Insurance Administrator (Primary User)
- **Goals:** Configure and maintain accurate covers master data, ensure policy types have proper cover assignments, manage organizational insurance product definitions efficiently
- **Context:** Working in iWork admin interface, managing covers for multiple policy types across different organizations, ensuring data quality and consistency
- **Pain Points:** Currently requires direct database access for covers management, no validation or duplicate detection, difficult to track which covers are used where, error-prone manual configuration

### Super Administrator (Secondary User)
- **Goals:** Oversee covers management across multiple organizations, ensure compliance with business rules, manage user access and permissions
- **Context:** Cross-organizational access, responsible for data governance and system configuration integrity
- **Pain Points:** No centralized view of covers usage, difficulty ensuring consistent configuration across organizations, manual permission management

### Policy Configuration Specialist (Secondary User)
- **Goals:** Set up policy types with appropriate covers, customize cover behavior per policy type, organize covers into logical sections
- **Context:** Focused on specific policy types, needs flexibility to override master settings while maintaining consistency
- **Pain Points:** Cannot customize cover behavior per policy type, no way to organize covers into sections, difficult to reorder covers for optimal user experience

## 4. User Stories

### Insurance Administrator
- **US-CMM-001:** As an insurance administrator, I want to search and filter the covers master list so that I can quickly find specific covers among thousands of entries
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given I'm on the covers master screen, when I enter text in the search box, then the list filters to show only covers whose name or description contains that text
        - Given I want to filter by cover type, when I select a cover type from the dropdown, then only covers of that type are shown
        - Given I want to see problematic covers, when I toggle "Show Duplicates", then only covers with duplicate names are displayed
        - Given I need to find unconfigured covers, when I toggle "No Config", then only covers without field configuration are shown

- **US-CMM-002:** As an insurance administrator, I want to create new covers with proper validation so that I avoid creating duplicates and ensure complete configuration
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given I'm creating a new cover, when I enter a cover name that already exists, then I see a warning panel with existing cover details
        - Given I see a duplicate warning, when I click "View & Re-use This Cover", then the add form closes and the existing cover detail opens
        - Given I see a duplicate warning, when I click "Add New Anyway", then the warning dismisses and I can save the new cover
        - Given I select input type "Dropdown", when I try to save with fewer than 2 options, then I see a validation error

- **US-CMM-003:** As an insurance administrator, I want to assign covers to policy types with custom settings so that each policy type can have appropriate cover configurations
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given I'm adding a cover to a policy type, when I search for covers, then I see all available covers with their current configuration status
        - Given I find an unconfigured cover, when I click "Configure First →", then I navigate to the covers master edit form for that cover
        - Given I'm configuring a cover for a specific policy type, when I change settings from the master defaults, then I see an informational note about custom settings
        - Given I want to reset customizations, when I click "Reset to Master Defaults", then all settings restore to the master cover definition

### Super Administrator
- **US-CMM-004:** As a super administrator, I want to manage policy types across organizations so that I can ensure proper organizational data separation
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given I have cross-organization access, when I view policy types, then I can filter by organization to see relevant types only
        - Given I'm creating a policy type, when I enter a code that exists in the same organization, then I see a validation error
        - Given I'm viewing policy types, when I see a type with no covers, then it's clearly marked as needing setup

- **US-CMM-005:** As a super administrator, I want to bulk upload covers via CSV so that I can efficiently migrate or update large datasets
    - **Priority:** Medium
    - **Acceptance Criteria:**
        - Given I have a CSV file with cover data, when I upload it, then the system validates all rows and shows a preview of what will be created
        - Given there are validation errors, when I review the upload preview, then I can download an error report with detailed reasons
        - Given all validations pass, when I confirm the upload, then all covers are created and I receive a success confirmation

### Policy Configuration Specialist
- **US-CMM-006:** As a policy configuration specialist, I want to organize covers into sections so that policy forms have logical groupings
    - **Priority:** Medium
    - **Acceptance Criteria:**
        - Given I'm managing covers for a policy type, when I create sections like "Basic Details" and "Fire Perils", then covers can be assigned to these sections
        - Given I have covers assigned to sections, when viewing the covers list, then section headings appear with cover counts
        - Given I want to delete a section, when the section has covers assigned, then deletion is blocked until covers are reassigned

- **US-CMM-007:** As a policy configuration specialist, I want to reorder covers within a policy type so that they appear in logical sequence on policy forms
    - **Priority:** Medium
    - **Acceptance Criteria:**
        - Given I'm viewing covers for a policy type, when I toggle "Reorder Mode", then drag handles appear on all cover rows
        - Given I'm in reorder mode, when I drag a cover to a new position, then the sequence updates visually
        - Given I've made reordering changes, when I click "Save Order", then all new sequence positions are saved permanently

### All User Types
- **US-CMM-008:** As any user with view permissions, I want to see complete history of all changes made to covers and policy configurations so that I can track modifications for compliance and auditing purposes
    - **Priority:** High
    - **Acceptance Criteria:**
        - Given I'm viewing a cover or policy type, when I click "View History", then I see a chronological list of all changes made to that entity
        - Given a cover name was changed from "Old Name" to "New Name", when I view history, then I see two line items: one showing the old name with its effective to date, and another showing the new name with its effective from date
        - Given any configuration field is modified, when the change is approved/saved, then the system creates separate history entries for the old value (with end date) and new value (with start date)
        - Given I'm viewing change history, when I see a history entry, then I can see the field changed, old value, new value, change date/time, user who made the change, and approval status
        - Given multiple fields are changed in a single transaction, when I view history, then I see all field changes grouped together with the same timestamp and transaction ID

## 5. Functional Requirements

- **FR-CMM-001:** Comprehensive Covers Master Management
    - **Related Project FR:** Core insurance product configuration capability
    - **Module Context:** Full CRUD operations for covers with name, description, cover type, input type, effective dates, field configuration including dropdown options and hint text, layout width settings, and required/optional flags

- **FR-CMM-002:** Intelligent Duplicate Detection and Prevention
    - **Related Project FR:** Data quality and consistency requirements
    - **Module Context:** Real-time duplicate name detection on blur with inline warning panels showing existing cover details, forced user decision between reusing existing covers or creating new ones, case-insensitive comparison

- **FR-CMM-003:** Policy Type and Covers Assignment Management
    - **Related Project FR:** Flexible policy configuration requirements
    - **Module Context:** Two-step cover assignment process with search and configuration phases, custom settings per policy type including input type overrides, field labels, required flags, and dropdown options independent from master definitions

- **FR-CMM-004:** Section-Based Cover Organization
    - **Related Project FR:** User experience optimization for policy forms
    - **Module Context:** Named section creation and management per policy type, cover assignment to sections with display ordering, section-based grouping in covers lists with heading rows and cover counts

- **FR-CMM-005:** Advanced Search and Filtering Capabilities
    - **Related Project FR:** Efficient data discovery and management
    - **Module Context:** Multi-criteria search across cover name and description, filter by cover type, input type, status (active/upcoming/retired), specialized filters for duplicates and unconfigured covers

- **FR-CMM-006:** CSV Bulk Upload with Validation
    - **Related Project FR:** Efficient data migration and bulk operations
    - **Module Context:** Template-based CSV upload for covers with comprehensive validation including duplicate detection, format validation, business rule enforcement, preview with error reporting, and batch creation confirmation

- **FR-CMM-007:** Role-Based Access Control Integration
    - **Related Project FR:** Security and access management requirements
    - **Module Context:** Permission-based UI element visibility (view/create/edit), organization-scoped access control, read-only mode for insufficient permissions, unauthorized page redirection for blocked access

- **FR-CMM-008:** Effective Date and Lifecycle Management
    - **Related Project FR:** Temporal data management requirements
    - **Module Context:** Effective from/to date management with default to current date, future and past date handling for cover visibility, retirement functionality instead of deletion, backfill support for existing data migration

- **FR-CMM-009:** Input Type Override and Customization
    - **Related Project FR:** Flexible policy type configuration
    - **Module Context:** Assignment-level input type overrides with independent dropdown options, hint text, and field labels separate from master definitions, visual indicators for customized assignments, reset to defaults functionality

- **FR-CMM-010:** Comprehensive Change History and Audit Trail
    - **Related Project FR:** Compliance and governance requirements for insurance industry
    - **Module Context:** Complete audit trail for all configuration changes with temporal data management, dual-entry history tracking (old value end-dated, new value start-dated), transaction grouping for multi-field changes, user attribution, and approval workflow integration

## 6. Business Rules & Logic

- **BR-CMM-001:** Cover Name Uniqueness Handling
    - **Example:** When creating "Accidental Damage" and one exists, user sees existing cover details and must choose to reuse or create new
    - **Edge Cases:** Case-insensitive matching prevents "accidental damage" vs "Accidental Damage" conflicts

- **BR-CMM-002:** Effective Date Validation and Defaults
    - **Example:** New covers default to today's effective date, cannot have effective to date before effective from date
    - **Edge Cases:** Covers with future effective dates don't appear on policy forms yet, past effective to dates hide covers from forms

- **BR-CMM-003:** Configuration Requirement for Assignment
    - **Example:** A cover without input type or required field configuration cannot be selected for assignment to policy types
    - **Edge Cases:** Partially configured covers (missing dropdown options for dropdown type) trigger "Configure First →" workflow

- **BR-CMM-004:** Section Assignment and Deletion Rules
    - **Example:** Sections with assigned covers cannot be deleted until covers are reassigned or removed
    - **Edge Cases:** Section name matching is case-insensitive for CSV uploads ("fire perils" matches "Fire Perils")

- **BR-CMM-005:** Organization and Policy Type Code Uniqueness
    - **Example:** Policy type code "GMC" can exist in Organization 1 and Organization 2 but not twice in Organization 1
    - **Edge Cases:** Code uniqueness validation occurs within organization scope only

- **BR-CMM-006:** Layout Width Restrictions for New Covers
    - **Example:** New covers can only be created with "Full Width" or "Half Width" layout options
    - **Edge Cases:** Existing covers with "Custom grouped layout" are preserved but cannot be changed back to custom if modified

- **BR-CMM-007:** Input Type Override Independence
    - **Example:** Policy type can override master cover's "Single-line Text" to "Dropdown" with its own options
    - **Edge Cases:** Reset to defaults restores all field settings to match master cover definition, custom indicators show when overrides are active

- **BR-CMM-008:** Dual-Entry Change History Tracking
    - **Example:** When cover name changes from "Accidental Damage" to "Accidental Damage Coverage", system creates: (1) History entry for "Accidental Damage" with effective_to = change date, (2) History entry for "Accidental Damage Coverage" with effective_from = change date
    - **Edge Cases:** For new records, only create "new value" history entry with effective_from date; for deletions/retirements, only update existing entry with effective_to date; transaction ID links all changes made in single save operation

- **BR-CMM-009:** Change History Data Requirements
    - **Example:** Each history entry must include: entity type, entity ID, field name, old value, new value, effective_from, effective_to, changed_by_user_id, changed_date, transaction_id, approval_status
    - **Edge Cases:** System-generated changes (like backfill operations) use system user ID; changes requiring approval remain in "Pending" status until approved; bulk operations share transaction ID but have individual history entries per changed field

## 7. User Interface Requirements

- **Screen/Page:** Covers Master List
    - **Purpose:** Central hub for viewing, searching, and managing all covers in the system
    - **Key Elements:** Search bar, filter dropdowns (cover type, input type, status), toggle filters (duplicates, no config), covers table with sortable columns, pagination controls, action buttons (add, upload, download)
    - **User Flow:** User accesses screen → applies search/filters → reviews cover list → clicks cover name for details or edit button for modification → performs bulk operations via upload/download
    - **Validation Rules:** Search requires input focus, filters apply immediately, pagination maintains search context, access control hides unavailable actions

- **Screen/Page:** Add/Edit Cover Form
    - **Purpose:** Create new covers or modify existing ones with comprehensive validation and field configuration
    - **Key Elements:** Basic information section (name, description, cover type), effective dates section, field configuration section with dynamic options based on input type, duplicate warning panels, validation error displays
    - **User Flow:** User opens form → fills basic info → sets effective dates → configures field behavior → addresses any duplicate warnings → saves or cancels
    - **Validation Rules:** Required fields enforced, duplicate detection on name blur, input type drives available configuration options, date range validation

- **Screen/Page:** Policy Type vs Covers Mapping
    - **Purpose:** Assign and configure covers for specific policy types with section organization and custom settings
    - **Key Elements:** Organization and policy type selectors, covers list with section groupings, reorder mode toggle, add cover button, section management panel, covers configuration forms
    - **User Flow:** User selects organization and policy type → views assigned covers by section → adds new covers via search → configures cover settings → manages sections → reorders as needed
    - **Validation Rules:** Policy type selection required to show covers, section names must be unique per policy type, reorder mode requires explicit save, custom settings validation mirrors master cover rules

- **Screen/Page:** Policy Types Master
    - **Purpose:** Manage policy type definitions including codes, names, organizations, and status
    - **Key Elements:** Search and filter controls, policy types table with organization display, add/edit forms, activate/deactivate actions
    - **User Flow:** User searches/filters policy types → views list with organization context → creates new types or edits existing → manages activation status
    - **Validation Rules:** Code uniqueness per organization, effective date validation, organization assignment required, status changes require confirmation

- **Screen/Page:** Change History Viewer
    - **Purpose:** Display complete audit trail of all changes made to covers, policy types, and assignments
    - **Key Elements:** History timeline with expandable entries, field-level change details, user attribution, transaction grouping, filter by date range/user/entity type, export capabilities
    - **User Flow:** User clicks "View History" on any entity → sees chronological list of changes → expands entries to see field-level details → filters or searches history → exports for compliance reporting
    - **Validation Rules:** History entries are read-only, temporal data shows effective from/to dates correctly, transaction grouping clearly shows related changes, user permissions control history visibility

## 8. Data Requirements

- **Input Data:**
    - Cover master data (name, description, type, effective dates, field configuration) from user forms and CSV uploads
    - Policy type data (code, name, organization, status) from administrative forms
    - Assignment data (display sequence, required flag, effective dates, custom settings) from mapping configurations
    - User authentication and authorization data from iWork session management

- **Output Data:**
    - Cover lists with pagination, filtering, and search results for display in admin interfaces
    - Policy type lists filtered by organization and status for assignment workflows
    - Assignment configurations with custom settings overrides for policy form rendering
    - Validation results and error reports for CSV upload operations
    - Usage statistics showing cover assignments across policy types
    - Complete change history with dual-entry tracking for all configuration modifications

- **Stored Data:**
    - Master covers table with all field definitions, effective dates, and configuration options
    - Policy types table with organizational assignments and status management
    - Cover assignments table linking policy types to covers with custom settings and display sequence
    - Section definitions table for grouping covers within policy types
    - Audit trail tables for tracking all changes, user actions, and workflow history
    - Change history table with dual-entry tracking: entity_type, entity_id, field_name, old_value, new_value, effective_from, effective_to, changed_by, changed_date, transaction_id, approval_status
    - Lookup tables for cover types, input types, and organizational data

## 9. Integration Specifications

- **APIs/Interfaces:**
    - Covers CRUD API: GET/POST/PUT/DELETE /covers with comprehensive filtering and pagination
    - Policy types management API: GET/POST/PUT/DELETE /policy-types with organization scoping
    - Cover assignments API: GET/POST/PUT/DELETE /assignments with custom settings management
    - Section management API: GET/POST/PUT/DELETE /sections for cover organization
    - CSV upload API: POST /upload with validation and preview functionality
    - User permissions API: GET /permissions for role-based access control
    - Change history API: GET /history with filtering by entity, date range, user, transaction ID

- **Events:**
    - Cover lifecycle events: created, updated, retired with full audit trail
    - Assignment events: cover added to policy type, settings customized, order changed
    - Policy type events: created, activated, deactivated with organizational context
    - Section management events: created, renamed, deleted, covers reassigned
    - CSV upload events: validation results, batch creation completed
    - Change history events: field_changed, transaction_started, transaction_completed, approval_required, approval_granted

- **Data Flow:**
    - Cover creation: User input → validation → duplicate check → save → assignment availability
    - Assignment workflow: Search covers → select cover → configure settings → validate configuration → save assignment
    - Policy type management: Create/edit type → validate code uniqueness → save → enable for cover assignments
    - Section organization: Create section → assign covers → reorder → save sequence → update policy form structure
    - Change history tracking: Any modification → capture old values → save changes → create dual history entries (old value end-dated, new value start-dated) → group by transaction ID

- **Error Handling:**
    - Validation errors display inline with specific field guidance
    - Duplicate detection provides clear options for user decision
    - CSV upload errors generate downloadable reports with row-level details
    - Permission errors redirect to unauthorized page or disable UI elements
    - Configuration errors block assignments until covers are properly configured

## 10. Performance & Quality Requirements

- **Performance:** 
    - Covers list loads under 3 seconds with pagination for 3,788+ covers
    - Search and filtering respond within 500ms for any dataset size
    - Add/edit forms open within 1 second with all validation ready
    - CSV upload processing completes within 30 seconds for 1,000 row files
    - Duplicate detection runs within 200ms on name field blur

- **Reliability:** 
    - Covers management system maintains 99.9% uptime during business hours
    - Data validation prevents corrupted or incomplete cover configurations
    - All operations are transactional to prevent partial saves
    - Automatic recovery from temporary database connection issues

- **Security:** 
    - Role-based access control integrated with iWork permission framework
    - CSV upload validation prevents code injection and malformed data
    - Session management and authentication through existing iWork infrastructure
    - Audit trail for all administrative actions with user identification
    - Organization data isolation to prevent cross-tenant data access

- **Usability:** 
    - Cover creation workflow completable in under 5 minutes
    - Policy type setup with covers completable in under 15 minutes
    - All forms follow consistent iWork Material-UI design patterns
    - Comprehensive inline help and validation messages
    - Bulk operations provide clear progress and result feedback

## 11. Success Metrics

- **Business Metrics:** 
    - 100% elimination of direct database manipulation for covers management
    - 50% reduction in configuration errors due to validation and duplicate detection
    - 75% faster policy type setup time compared to manual database processes

- **User Metrics:** 
    - 90%+ user satisfaction with covers management workflow
    - Average task completion time under target thresholds (5 min for covers, 15 min for policy type setup)
    - 95% successful completion rate for CSV upload operations

- **Technical Metrics:** 
    - All performance requirements consistently met (3s load, 500ms search)
    - Zero data corruption incidents with proper validation
    - 99.9% system availability during business hours

- **Adoption Metrics:** 
    - 100% of covers administrators using new interface within 30 days
    - 90% adoption of section-based cover organization for new policy types
    - 80% utilization of CSV upload for bulk operations

- **Compliance & Audit Metrics:**
    - 100% of configuration changes tracked in audit trail with complete dual-entry history
    - 95% compliance with audit requirements for change tracking and user attribution
    - 90% user adoption of change history viewing for compliance and troubleshooting

## 12. Edge Cases & Error Scenarios

- **Error Case 1:** CSV Upload with Mixed Valid/Invalid Rows
    - **User Experience:** Preview shows valid row count and error count, downloadable error report with specific issues, option to proceed with valid rows only
    - **System Behavior:** Validation engine processes all rows, generates detailed error report, prevents partial uploads, maintains data integrity

- **Error Case 2:** Cover Assignment with Incomplete Master Configuration
    - **User Experience:** Search results show "Configure First →" link instead of select button, clicking navigates to master cover edit form, assignment blocked until configuration complete
    - **System Behavior:** Configuration validation runs before assignment availability, prevents incomplete covers from being assigned, maintains referential integrity

- **Error Case 3:** Policy Type Deactivation with Active Cover Assignments
    - **User Experience:** Confirmation dialog explains impact on active assignments, option to set effective end date, clear warning about policy form impact
    - **System Behavior:** Deactivation sets status but preserves assignments, cover assignments respect policy type effective dates, no data deletion

- **Edge Case 1:** Duplicate Cover Names Across Organizations
    - **Business Logic:** Cover names can be identical across different organizations, validation scope limited to organization context
    - **User Impact:** Duplicate detection operates within organizational boundaries, cross-organization duplicates are permitted

- **Edge Case 2:** Section Deletion with Cover Dependencies
    - **Business Logic:** Sections cannot be deleted while covers are assigned, user must reassign or remove covers first
    - **User Impact:** Delete button disabled with explanatory tooltip, clear workflow for cover reassignment before section deletion

## 13. Future Considerations

- **Enhancement 1:** Advanced Analytics Dashboard - Usage statistics for covers across policy types, identification of unused covers, configuration optimization recommendations based on usage patterns

- **Enhancement 2:** Version Control and Audit History - Complete change tracking with rollback capabilities, detailed audit trails for compliance, comparison views for configuration changes over time

- **Enhancement 3:** Integration with Policy Creation Workflows - Real-time synchronization with policy forms, dynamic cover availability based on client context, automated validation during policy creation

- **Enhancement 4:** Multi-language Support - Localized cover names and descriptions, language-specific validation rules, multi-language CSV upload support

## 14. Acceptance Criteria Summary

- [ ] All three admin screens (Covers Master, Policy Type vs Covers Mapping, Policy Types Master) fully functional with CRUD operations
- [ ] Comprehensive search, filtering, and pagination working across all data sets
- [ ] Duplicate detection and prevention system operational with user-friendly workflows
- [ ] CSV bulk upload functionality with validation, preview, and error reporting
- [ ] Role-based access control integrated with iWork permission framework
- [ ] Section-based cover organization with reordering capabilities
- [ ] Input type overrides working at assignment level with proper validation
- [ ] Effective date management preventing invalid configurations and ensuring proper display logic
- [ ] All business rules enforced with appropriate user guidance and error handling
- [ ] Performance requirements met under load with 3,788+ covers dataset
- [ ] Security measures implemented including audit trails and access controls
- [ ] Layout width restrictions properly implemented for new covers while preserving existing custom layouts
- [ ] Complete audit trail system operational with dual-entry change history tracking, user attribution, and Change History Viewer interface

## 15. Open Questions

- **Question 1:** Should the system support automated archival of unused covers after a specified period, and if so, what criteria and timeframes should be used?

- **Question 2:** How should the system handle bulk reassignment of covers when policy types are reorganized or merged, particularly regarding section assignments and custom settings?

- **Question 3:** What level of integration is needed with external insurance systems for cover synchronization, and should this be part of Phase 1 or deferred to future phases?