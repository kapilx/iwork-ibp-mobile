# PRD - Phase 1

## 1. Module Overview

- **Purpose:** Enable BD Executives to configure company-level, dashboard-level, and policy-level settings for IBP portal that control portal behavior, appearance, and enrollment rules
- **Business Value:** Allows comprehensive portal customization without technical development, supports both company-specific and universal portal types, ensures controlled deployment through approval workflows
- **User Value:** BD Executives gain complete control over portal configuration across three main areas while Managers maintain approval oversight for all changes
- **Module Type:** Core
- **Phase 1 Scope:** Complete portal preference module with Company Configuration (URL types, authentication integration, branding), Dashboard Configuration (wellness and retail insurance modules), Policy Configuration (sequencing, enrollment rules), and comprehensive approval workflow with save functionality

## 2. Scope & Boundaries

- **In Scope:**
    - Company Configuration: Portal URL display (Company-Specific vs Universal), authentication integration view, portal-type-specific branding (logo, welcome messages)
    - Dashboard Configuration: Wellness modules (Insurance Wellness locked, Emotional/Physical configurable), Retail Insurance visibility controls
    - Policy Configuration: Multi-policy management, drag-and-drop sequencing for policies and plan components, policy-specific enrollment rules (auto-lock, confirmation, cut-off dates)
    - Save functionality for configuration preservation
    - Complete approval workflow with enhanced confirmations and status lifecycle
    - Portal type detection and adaptive configuration behavior

- **Out of Scope:**
    - Direct authentication method configuration (integrated view from Authorization Configuration module)
    - Policy creation and management (consumes existing policy data)
    - Multi-level approval beyond BD Executive to Manager

- **Dependencies:**
    - Authorization Configuration module for authentication method display
    - Policy Service for policy and plan component data
    - User Management Service for approval notifications and user roles

- **Dependents:**
    - IBP Employee Portal (consumes all configuration settings)
    - IBP HR Portal (consumes branding and configuration)

## 3. User Personas & Contexts

### BD Executive
- **Goals:** Configure comprehensive portal preferences across company, dashboard, and policy levels; ensure portal reflects company identity and meets enrollment requirements
- **Context:** Manages portal configuration during company onboarding, policy updates, and ongoing portal maintenance across three configuration areas
- **Pain Points:** Need to configure complex portal settings across multiple areas, requires approval for changes to go live, must understand portal type differences

### Manager
- **Goals:** Review and approve comprehensive portal configurations, ensure changes meet business and security requirements, provide clear feedback for rejections
- **Context:** Reviews multi-section portal configurations submitted by BD Executive, understands impact of approval decisions on live portal
- **Pain Points:** Need to review complex configurations across multiple sections, must provide detailed feedback for rejections, approval decisions immediately impact live portal

## 4. User Stories

The Portal Preference Module supports comprehensive user workflows across three main configuration areas:

### Company Configuration Capabilities
- Portal URL viewing for both company-specific and universal portal types
- Authentication method integration and viewing (from Authorization Configuration module)
- Portal-type-specific branding configuration with logo upload and welcome message management
- Automatic portal type detection with adaptive configuration options

### Dashboard Configuration Capabilities
- Wellness module management (Insurance Wellness locked, Emotional/Physical configurable)
- Retail Insurance visibility controls
- Module enable/disable functionality affecting employee portal display

### Policy Configuration Capabilities
- Multi-policy management with drag-and-drop sequencing
- Plan component sequencing within policies
- Policy-specific enrollment rules (auto-lock settings, confirmation requirements, cut-off date management)
- Independent configuration per policy with visual hierarchy

### Configuration Management Capabilities
- Save functionality for configuration preservation across sessions
- Enhanced approval workflow with detailed confirmation messages
- Status lifecycle management (Draft, Under Review, Approved, Rejected)
- Resubmission capability after rejection with comment viewing

### Manager Review Capabilities
- Comprehensive configuration review interface
- Action-specific approval/rejection with appropriate confirmation flows
- Mandatory commenting for rejections, optional for approvals
- Immediate publication upon approval



## 5. Functional Requirements

- **FR-PORTAL-001:** System shall provide three-tab configuration interface for Company, Dashboard, and Policy configurations
  - **Related Project FR:** Portal preference management and user experience
  - **Module Context:** Structured configuration interface with tab-based navigation and section-specific editing

- **FR-PORTAL-002:** System shall support portal type detection and adaptive configuration behavior
  - **Related Project FR:** Multi-tenant portal management and URL-based configuration
  - **Module Context:** Automatic detection of company-specific vs universal portal with appropriate configuration options

- **FR-PORTAL-003:** System shall integrate with Authorization Configuration module for authentication display
  - **Related Project FR:** Authentication management and security configuration
  - **Module Context:** Read-only integration showing configured authentication methods with portal-type-specific behavior

- **FR-PORTAL-004:** System shall provide portal-type-specific branding configuration
  - **Related Project FR:** Corporate identity and brand management
  - **Module Context:** Logo upload with validation, welcome message configuration based on portal type limitations

- **FR-PORTAL-005:** System shall support comprehensive dashboard module management
  - **Related Project FR:** Dashboard customization and module visibility
  - **Module Context:** Wellness module controls (locked Insurance Wellness, configurable Emotional/Physical), Retail Insurance visibility

- **FR-PORTAL-006:** System shall provide multi-policy management with drag-and-drop sequencing
  - **Related Project FR:** Policy presentation and enrollment flow optimization
  - **Module Context:** Policy and plan component reordering with visual feedback and hierarchy management

- **FR-PORTAL-007:** System shall support policy-specific enrollment configuration
  - **Related Project FR:** Enrollment process control and policy-specific rules
  - **Module Context:** Independent enrollment settings per policy including auto-lock, confirmation, and cut-off date rules

- **FR-PORTAL-008:** System shall implement save functionality for configuration preservation
  - **Related Project FR:** Configuration lifecycle management and user experience
  - **Module Context:** Persistent storage of configuration changes with session recovery and preloading

- **FR-PORTAL-009:** System shall provide enhanced approval workflow with status lifecycle management
  - **Related Project FR:** Change management and approval processes
  - **Module Context:** BD Executive submission with detailed confirmations, Manager approval/rejection with action-specific flows



## 6. Business Rules & Logic

- **BR-PORTAL-001:** Portal type determines available configuration options and branding behavior
  - **Example:** Company-specific portals allow full branding with login screen logos; Universal portals show logos only post-login with disabled welcome messages
  - **Edge Cases:** Portal type detection failure defaults to most restrictive universal portal configuration

- **BR-PORTAL-002:** Authentication configuration display integrates with Authorization Configuration module
  - **Example:** Company-specific portals show configured authentication methods; Universal portals display default Employee ID + DOB in view-only mode
  - **Edge Cases:** Authorization module unavailability shows default authentication placeholders

- **BR-PORTAL-003:** Branding assets must meet strict validation requirements with portal-type-specific application
  - **Example:** Logo files must be PNG/SVG format, max 200×200 pixels; Company-specific portals show on login screen, Universal portals post-login only
  - **Edge Cases:** Invalid uploads are rejected with specific error messages, previous assets maintained

- **BR-PORTAL-004:** Dashboard module configuration follows hierarchical rules
  - **Example:** Insurance Wellness is locked and always visible; Emotional/Physical Wellness can be enabled/disabled; Retail Insurance visibility is fully configurable
  - **Edge Cases:** Disabled modules are completely hidden from employee portal, no partial visibility

- **BR-PORTAL-005:** Policy and plan component sequencing follows strict hierarchy and boundary rules
  - **Example:** Policies can be reordered among themselves; Plan components can only be reordered within their parent policy; Sequence numbers auto-update
  - **Edge Cases:** Cross-policy drag operations are prevented; Invalid drop zones provide visual feedback

- **BR-PORTAL-006:** Policy-specific enrollment rules apply independently per policy
  - **Example:** Policy A can require confirmation with disclaimer while Policy B auto-locks immediately; Cut-off date rules vary per policy
  - **Edge Cases:** Conflicting rule combinations are validated and prevented; Policy-specific settings take precedence

- **BR-PORTAL-007:** Configuration save preserves all changes while approval workflow controls publication
  - **Example:** BD Executive can save incomplete configurations and return later; Only approved configurations publish to live portal
  - **Edge Cases:** Save failures preserve form data; Concurrent editing shows appropriate warnings

- **BR-PORTAL-008:** Status lifecycle follows strict progression with action-specific confirmation requirements
  - **Example:** Draft → Under Review → Approved/Rejected; Approval requires simple confirmation; Rejection requires mandatory comments
  - **Edge Cases:** Status cannot be manually changed; Failed approvals maintain Under Review status until resolved

## 7. User Interface Requirements

- **Screen/Page:** Portal Preference Configuration Dashboard
  - **Purpose:** Three-tab interface for comprehensive portal configuration management
  - **Key Elements:** Company Configuration tab (URL display, authentication integration, branding), Dashboard Configuration tab (wellness modules, retail insurance), Policy Configuration tab (multi-policy management, sequencing), Edit/Save/Submit workflow controls, status indicators
  - **User Flow:** BD Executive navigates between tabs, enters edit mode, configures settings across sections, saves changes, and submits for approval with enhanced confirmations
  - **Validation Rules:** Logo format/size validation (PNG/SVG, 200×200px), portal-type-specific field enabling/disabling, policy sequence validation, enrollment rule conflict prevention

- **Screen/Page:** Company Configuration Interface
  - **Purpose:** Company-level settings with portal-type-adaptive behavior
  - **Key Elements:** Portal URL display (read-only), Authentication method integration (from Authorization module), Branding section (logo upload, welcome messages with portal-type restrictions)
  - **User Flow:** BD Executive views portal URL, reviews authentication methods, configures branding based on portal type limitations
  - **Validation Rules:** Portal type detection accuracy, authentication integration display, branding asset validation with portal-specific rules

- **Screen/Page:** Dashboard Configuration Interface
  - **Purpose:** Dashboard module visibility and behavior control
  - **Key Elements:** Wellness Module section (Insurance Wellness locked display, Emotional/Physical Wellness toggles), Retail Insurance visibility control
  - **User Flow:** BD Executive configures wellness module availability, sets retail insurance visibility
  - **Validation Rules:** Module dependency validation, wellness configuration constraints

- **Screen/Page:** Policy Configuration Interface
  - **Purpose:** Multi-policy management with sequencing and enrollment rule configuration
  - **Key Elements:** Policy list with drag-and-drop handles, expandable plan component sections, enrollment rule configuration panels per policy (auto-lock, confirmation, cut-off settings)
  - **User Flow:** BD Executive reorders policies, manages plan component sequences within policies, configures policy-specific enrollment rules
  - **Validation Rules:** Drag-and-drop boundary enforcement, policy hierarchy maintenance, enrollment rule conflict prevention

- **Screen/Page:** Enhanced Approval Workflow Interface
  - **Purpose:** Manager review and approval with action-specific confirmation flows
  - **Key Elements:** My Approvals queue, configuration preview (view-only), Approve/Reject buttons with action-specific confirmation popups, comment management for rejections
  - **User Flow:** Manager reviews pending configurations, uses action-specific confirmation flows (simple for approval, mandatory comment for rejection)
  - **Validation Rules:** Mandatory comment validation for rejections, approval confirmation requirements, immediate publication trigger validation

- **Screen/Page:** Save and Status Management Interface
  - **Purpose:** Configuration preservation and status lifecycle management
  - **Key Elements:** Save functionality with success confirmation, status indicators (Draft, Under Review, Approved, Rejected), enhanced submission confirmation popup, rejection comment viewing
  - **User Flow:** BD Executive saves changes with confirmation, submits with detailed workflow explanation, views status and manages resubmission after rejection
  - **Validation Rules:** Save success validation, status progression rules, resubmission capability after rejection

## 8. Data Requirements

- **Input Data:**
  - Portal configuration settings across three tabs (Company, Dashboard, Policy) from BD Executive
  - Company information for portal type detection and URL generation
  - Policy and plan component data for sequencing and enrollment rule configuration
  - Branding assets (logos, welcome messages) with portal-type-specific requirements
  - Approval decisions from Managers (approve/reject with mandatory comments for rejection)
  - Authentication method data integration from Authorization Configuration module
- **Output Data:**
  - Published portal configurations consumed by IBP Employee and HR portals
  - Portal-type-specific branding and configuration data for portal rendering
  - Dashboard module visibility settings for conditional portal display
  - Policy sequence and enrollment rule data for enrollment flow control
  - Configuration status updates and approval workflow notifications
  - Save confirmation and session recovery data for BD Executive workflow
- **Stored Data:**
  - Portal preference configurations with comprehensive status tracking (Draft, Under Review, Approved, Rejected)
  - Three-tab configuration structure with section-specific settings
  - Portal type detection data and associated configuration constraints
  - Branding assets with portal-type-specific metadata and validation information
  - Policy sequence data with drag-and-drop position tracking
  - Policy-specific enrollment rules (auto-lock settings, confirmation requirements, cut-off date configurations)
  - Approval workflow history with action-specific comment management
  - Save state data for configuration session preservation and recovery

## 9. Integration Specifications

- **APIs/Interfaces:** 
  - Portal Configuration API consumed by IBP Employee and HR portals for comprehensive configuration application
  - Authorization Configuration API integration for authentication method display and portal-type-specific behavior
  - Policy Service API for policy and plan component data retrieval
  - Branding Asset API for logo serving with portal-type-specific rendering rules
- **Events:** 
  - Configuration approval events trigger immediate portal refresh and setting application
  - Configuration submission events notify managers and initiate approval workflow
  - Save events trigger configuration persistence and session state management
  - Portal type detection events determine configuration option availability
- **Data Flow:** 
  - Three-tab configuration data flows to respective portal sections upon approval
  - Authentication configuration flows from Authorization module to Company Configuration display
  - Policy sequence and enrollment rules flow to enrollment system for enforcement
  - Branding assets flow with portal-type-specific rendering instructions
- **Error Handling:** 
  - Configuration save failures preserve form state and provide retry mechanisms
  - Authentication integration failures show appropriate fallbacks and error states
  - Approval workflow failures maintain status integrity and provide recovery options
  - Portal type detection failures default to most restrictive universal configuration

## 10. Performance & Quality Requirements

- **Performance:** Three-tab configuration interface responds within 2 seconds, drag-and-drop operations provide immediate visual feedback, configuration changes apply within 5 minutes of approval, save operations complete within 1 second
- **Reliability:** 99.9% uptime for configuration interface, configuration data backed up with recovery capabilities, session state preservation across navigation
- **Security:** Role-based access controls for BD Executive and Manager roles, audit trail for all configuration changes and approval decisions, secure handling of branding assets
- **Usability:** Intuitive three-tab navigation, clear portal type indicators, helpful validation messages, drag-and-drop visual feedback, enhanced confirmation flows for critical actions

## 11. Success Metrics

- **Business Metrics:** 50% reduction in portal setup time for new companies, 60% decrease in configuration-related support tickets, improved portal customization adoption across three configuration areas
- **User Metrics:** BD Executive satisfaction above 90% with comprehensive configuration options, Manager approval efficiency with average 24-hour turnaround, reduced configuration errors due to enhanced validation and save functionality
- **Technical Metrics:** Configuration changes applied successfully above 99%, drag-and-drop operations complete without errors, save functionality preserves 100% of configuration data
- **Adoption Metrics:** 100% of new company onboardings use self-service portal configuration across all three tabs, 85% reduction in technical support requests for portal configuration changes

## 12. Edge Cases & Error Scenarios

- **Error Case 1:** Logo upload fails due to format/size validation
  - **User Experience:** Clear error message specifying format requirements (PNG/SVG, 200×200px) with option to retry
  - **System Behavior:** Upload rejected, previous logo maintained, form remains in editable state

- **Error Case 2:** Configuration save fails across multiple tabs
  - **User Experience:** Specific error notification identifying failed sections with retry option and data preservation
  - **System Behavior:** Partial saves prevented, all tab data retained in form, transaction rollback on failure

- **Error Case 3:** Authentication Configuration module unavailable during Company Configuration view
  - **User Experience:** Authentication section shows placeholder with "Configuration unavailable" message
  - **System Behavior:** Other sections remain functional, authentication integration gracefully degrades

- **Error Case 4:** Manager approval action fails during submission
  - **User Experience:** Error message with retry option, approval status remains unchanged until successful completion
  - **System Behavior:** Configuration status maintained as "Under Review", approval action can be retried

- **Edge Case 1:** BD Executive attempts cross-policy drag operation for plan components
  - **Business Logic:** System prevents drag across policy boundaries with visual feedback showing invalid drop zones
  - **User Impact:** Clear visual indication that plan components are constrained within their parent policy

- **Edge Case 2:** Portal type detection fails or returns ambiguous results
  - **Business Logic:** System defaults to universal portal configuration (most restrictive) to prevent security issues
  - **User Impact:** Configuration options limited to universal portal capabilities with clear indication of detection failure

- **Edge Case 3:** Multiple BD Executives editing same configuration simultaneously
  - **Business Logic:** Last save wins with appropriate warnings about concurrent editing detected
  - **User Impact:** Warning notification about concurrent edits with option to review and resolve conflicts

- **Edge Case 4:** Manager attempts to approve configuration with missing policy data
  - **Business Logic:** Approval blocked until policy dependencies are resolved, configuration remains "Under Review"
  - **User Impact:** Clear error message explaining policy dependency issues with guidance for resolution

- **Edge Case 5:** Employee accesses portal during configuration approval and publication
  - **Business Logic:** Employee portal continues using current published configuration until new approval completes and publishes
  - **User Impact:** No disruption to employee experience, seamless transition to new configuration upon publication

## 13. Future Considerations

- **Enhancement 1:** Bulk policy configuration management for companies with large policy portfolios across multiple plan components
- **Enhancement 2:** Configuration templates and cloning capabilities for quick setup of similar company portals
- **Enhancement 3:** Advanced branding options including color schemes, custom CSS, and theme management
- **Enhancement 4:** Multi-level approval workflow for complex organizational hierarchies beyond BD Executive to Manager
- **Enhancement 5:** Real-time configuration preview showing employee portal changes before approval
- **Enhancement 6:** Integration with external brand asset management systems and corporate identity platforms

## 14. Acceptance Criteria Summary

- [ ] Three-tab configuration interface operational (Company, Dashboard, Policy) with proper navigation and edit modes
- [ ] Portal type detection functional with adaptive configuration options for company-specific vs universal portals
- [ ] Company Configuration: Portal URL display, authentication integration view, portal-type-specific branding with logo upload and welcome message management
- [ ] Dashboard Configuration: Wellness module controls (Insurance Wellness locked, Emotional/Physical configurable), Retail Insurance visibility management
- [ ] Policy Configuration: Multi-policy management with drag-and-drop sequencing, plan component reordering within policies, policy-specific enrollment rules
- [ ] Save functionality preserves configuration changes across all tabs with session recovery and preloading
- [ ] Enhanced approval workflow operational with detailed confirmation flows, action-specific requirements, and immediate publication upon approval
- [ ] Status lifecycle management functional (Draft, Under Review, Approved, Rejected) with proper progression rules
- [ ] Manager approval interface with action-specific confirmations (simple approval, mandatory comment rejection)
- [ ] Resubmission capability after rejection with comment viewing and edit restoration
- [ ] Comprehensive validation across all configuration areas with clear error messaging
- [ ] Published configurations successfully applied to IBP Employee and HR portals with immediate effect
- [ ] Drag-and-drop operations provide visual feedback with boundary enforcement and hierarchy maintenance

## 15. Open Questions

- **Question 1:** How should the system handle concurrent editing across multiple tabs when BD Executives work on different sections simultaneously?
- **Question 2:** What is the expected data volume for companies with large numbers of policies and plan components, and how should drag-and-drop performance be optimized?
- **Question 3:** Should there be configuration validation warnings before submission to prevent common approval rejection scenarios?
- **Question 4:** How should the system handle partial configuration failures when some tabs save successfully but others fail?