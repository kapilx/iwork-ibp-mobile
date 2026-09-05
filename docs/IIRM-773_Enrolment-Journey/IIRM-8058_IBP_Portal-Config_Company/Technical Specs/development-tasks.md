# Development Tasks - Portal Configuration Module

## Task Overview
- **Component:** Portal Configuration Module (Employer Portal)
- **Total Functional Requirements:** 15
- **Total Development Tasks:** 30 (15 Backend + 15 Frontend)
- **Estimated Total Effort:** 142 story points
- **Implementation Approach:** Each functional requirement split into separate frontend and backend tasks for parallel development

## Task Categories

### Category A: Branding & Portal Identity (FR-01, FR-02, FR-03)
Core branding functionality and portal identity management

### Category B: Authentication Configuration (FR-04, FR-05, FR-06)  
Login method setup and authentication security configuration

### Category C: Wellness Management (FR-07, FR-08, FR-09, FR-10)
Corporate and insurance wellness configuration system

### Category D: Policy & Enrollment (FR-11, FR-12, FR-13, FR-14)
Policy assignment and enrollment management functionality

### Category E: Preview & Publication (FR-15)
Portal preview and publication system

---

## Detailed Task Breakdown

### 📋 Category A: Branding & Portal Identity

#### TASK-BE-001: Logo Upload Backend API (FR-01)

- **Summary:** Backend API for logo file upload with validation
- **Issue Type:** Story  
- **Story Points:** 5
- **Priority:** High
- **Labels:** backend, file-upload, validation, branding
- **Components:** policy-service

- **Description:**
    Implement backend API endpoints for logo file upload with comprehensive validation including file format checking, size limits, and security scanning integration points.

- **Technical Requirements:**
    - Create multipart file upload endpoint accepting PNG, JPG, SVG formats
    - Implement file size validation (max 2MB)
    - Add file format validation using magic number detection
    - Integrate with existing FileUpload entity pattern
    - Add virus scanning integration points for security
    - Implement file storage using local file system with proper permissions
    - Create logo deletion endpoint with referential integrity checks

- **Acceptance Criteria:**
    - API accepts only PNG, JPG, SVG file formats
    - File size validation rejects files larger than 2MB
    - Invalid file formats return appropriate error messages
    - Uploaded files are stored securely with generated unique identifiers
    - Logo deletion removes file from storage and updates configuration
    - File upload integrates with existing audit trail system
    - Unit tests cover all validation scenarios and error cases

- **Dependencies:** None

#### TASK-FE-001: Logo Upload Frontend Interface (FR-01)

- **Summary:** Frontend interface for logo upload with drag-and-drop support
- **Issue Type:** Story
- **Story Points:** 3
- **Priority:** High  
- **Labels:** frontend, file-upload, ui-component, branding
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI component for logo file upload with drag-and-drop functionality, real-time validation feedback, and progress tracking.

- **Technical Requirements:**
    - Implement drag-and-drop file upload component using Material-UI
    - Add file format validation on client side before upload
    - Display real-time file size and format validation messages
    - Show upload progress indicator during file transfer
    - Implement logo preview functionality after successful upload
    - Add logo removal capability with confirmation dialog
    - Integrate with form validation and error display patterns

- **Acceptance Criteria:**
    - Users can drag and drop logo files onto upload area
    - Client-side validation prevents invalid file uploads
    - Upload progress is visible during file transfer
    - Successfully uploaded logos are displayed as previews
    - Error messages are clear and actionable
    - Logo removal works with proper confirmation
    - Component integrates with existing form validation framework

- **Dependencies:** TASK-BE-001

#### TASK-BE-002: Header and Tagline Text Configuration Backend (FR-02)

- **Summary:** Backend API for header and tagline text management  
- **Issue Type:** Story
- **Story Points:** 3
- **Priority:** High
- **Labels:** backend, text-validation, configuration
- **Components:** policy-service

- **Description:**
    Implement backend endpoints for managing header and tagline text with character limit enforcement and real-time validation support.

- **Technical Requirements:**
    - Create text configuration update endpoints with validation
    - Implement character limit validation (header: 100, tagline: 200)
    - Add real-time character count API for frontend integration
    - Implement text sanitization to prevent XSS attacks
    - Add Unicode support for international character sets
    - Create text preview generation for different display contexts
    - Implement version control for text changes with audit trail

- **Acceptance Criteria:**
    - Character limits are enforced at API level
    - Text sanitization prevents malicious content injection
    - Real-time character counting API responds quickly
    - Unicode characters are properly supported and stored
    - Text changes are logged in audit trail system
    - API returns validation errors with specific character limit details
    - Text updates integrate with configuration versioning system

- **Dependencies:** None

#### TASK-FE-002: Header and Tagline Text Frontend Interface (FR-02)

- **Summary:** Frontend interface for header and tagline configuration
- **Issue Type:** Story  
- **Story Points:** 2
- **Priority:** High
- **Labels:** frontend, text-input, validation, real-time
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI text input components with real-time character counting, validation feedback, and preview capabilities.

- **Technical Requirements:**
    - Implement Material-UI text field components with character limits
    - Add real-time character counting with visual indicators
    - Display validation messages for character limit violations  
    - Implement text preview functionality showing live updates
    - Add character limit warnings at 80% capacity
    - Create responsive design for mobile and desktop views
    - Integrate with form state management and validation

- **Acceptance Criteria:**
    - Character count displays in real-time as user types
    - Visual indicators show approaching character limits
    - Form prevents submission when character limits exceeded
    - Text preview updates instantly with user input
    - Error messages are clear and positioned appropriately  
    - Component works consistently across different screen sizes
    - Integration with form validation shows appropriate error states

- **Dependencies:** TASK-BE-002

#### TASK-BE-003: Portal URL Configuration and Validation Backend (FR-03)

- **Summary:** Backend API for portal slug validation and URL preview
- **Issue Type:** Story
- **Story Points:** 5  
- **Priority:** High
- **Labels:** backend, url-validation, real-time, uniqueness
- **Components:** policy-service

- **Description:**
    Implement backend API for portal slug validation with real-time uniqueness checking, format validation, and URL preview generation.

- **Technical Requirements:**
    - Create real-time slug validation API with uniqueness checking
    - Implement format validation (lowercase, alphanumeric, hyphens, 3-50 chars)
    - Add slug sanitization and suggestion generation for conflicts
    - Create URL preview generation showing complete portal address
    - Implement database indexing for efficient uniqueness queries
    - Add slug reservation system during configuration editing
    - Create slug history tracking for audit and rollback purposes

- **Acceptance Criteria:**
    - Real-time validation API responds within 200ms
    - Slug uniqueness is checked across all existing portal configurations
    - Format validation enforces all business rules correctly
    - Conflicting slugs generate helpful alternative suggestions
    - URL preview shows exact final portal address format
    - Slug reservation prevents conflicts during concurrent editing
    - All slug changes are logged with complete audit trail

- **Dependencies:** None

#### TASK-FE-003: Portal URL Configuration Frontend Interface (FR-03)

- **Summary:** Frontend interface for portal URL configuration with live preview
- **Issue Type:** Story
- **Story Points:** 4
- **Priority:** High
- **Labels:** frontend, url-preview, real-time-validation, debouncing  
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI component for portal slug configuration with real-time validation, live URL preview, and conflict resolution.

- **Technical Requirements:**
    - Implement debounced input field for slug entry with validation
    - Add real-time URL preview showing complete portal address
    - Display validation status with visual indicators (available/taken/invalid)
    - Implement slug suggestion dropdown for conflicts or invalid entries
    - Add copy-to-clipboard functionality for preview URLs
    - Create responsive preview layout showing URL in context
    - Integrate with form validation and error handling framework

- **Acceptance Criteria:**
    - Slug validation occurs with appropriate debouncing (300ms delay)
    - URL preview updates immediately when slug is valid
    - Visual indicators clearly show slug availability status
    - Conflict suggestions are displayed and selectable
    - Copy functionality works across different browsers
    - Preview layout is responsive and user-friendly
    - Form integration prevents submission of invalid slugs

- **Dependencies:** TASK-BE-003

---

### 🔐 Category B: Authentication Configuration

#### TASK-BE-004: Login Method Configuration Backend (FR-04)

- **Summary:** Backend API for login method management and configuration
- **Issue Type:** Story
- **Story Points:** 5
- **Priority:** High  
- **Labels:** backend, authentication, configuration, validation
- **Components:** policy-service, auth-service integration

- **Description:**
    Implement backend API for managing login method configurations including Email+Password, Mobile+OTP, and Employee ID+YOB authentication options.

- **Technical Requirements:**
    - Create login method configuration endpoints with validation
    - Implement business rule validation for login method combinations
    - Add integration points with auth-service for method verification
    - Create login method status management (enabled/disabled)
    - Implement configuration validation ensuring at least one method enabled
    - Add lookup table management for login method types
    - Create configuration testing endpoints for method validation

- **Acceptance Criteria:**
    - All three login methods (Email+Password, Mobile+OTP, Employee ID+YOB) are configurable
    - Business rules prevent disabling all login methods simultaneously
    - Configuration changes integrate with auth-service validation
    - Login method status can be toggled independently
    - Invalid configurations return specific error messages
    - Configuration testing validates method setup correctly
    - All changes are logged in comprehensive audit trail

- **Dependencies:** None (auth-service integration point)

#### TASK-FE-004: Login Method Configuration Frontend Interface (FR-04)

- **Summary:** Frontend interface for login method selection and configuration
- **Issue Type:** Story
- **Story Points:** 3
- **Priority:** High
- **Labels:** frontend, authentication-config, toggle-controls, validation
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI interface for configuring available login methods with toggle controls, validation feedback, and method-specific settings.

- **Technical Requirements:**
    - Implement toggle switch components for each login method
    - Add method-specific configuration panels with conditional display
    - Create validation feedback preventing all methods being disabled
    - Implement method testing interface for configuration verification
    - Add help text and tooltips explaining each login method
    - Create responsive layout for different screen sizes
    - Integrate with form state management and validation framework

- **Acceptance Criteria:**
    - Toggle switches clearly show enabled/disabled state for each method
    - Method-specific settings appear when login method is enabled
    - Validation prevents users from disabling all login methods
    - Configuration testing provides clear success/failure feedback
    - Help text explains the purpose and requirements of each method
    - Interface works consistently across desktop and mobile devices
    - Form validation integrates with overall configuration validation

- **Dependencies:** TASK-BE-004

#### TASK-BE-005: 2FA Enforcement Backend Configuration (FR-05)

- **Summary:** Backend API for two-factor authentication enforcement rules
- **Issue Type:** Story  
- **Story Points:** 5
- **Priority:** High
- **Labels:** backend, 2fa, security, business-rules, validation
- **Components:** policy-service, auth-service integration

- **Description:**
    Implement backend logic for two-factor authentication enforcement including mandatory 2FA for Email+Password login and 2FA method configuration.

- **Technical Requirements:**
    - Create 2FA configuration endpoints with business rule enforcement
    - Implement automatic 2FA requirement when Email+Password is enabled
    - Add 2FA method configuration (email, mobile) with validation
    - Create business rule validation preventing Email+Password without 2FA
    - Implement 2FA method testing and verification endpoints
    - Add integration with notification-service for 2FA delivery
    - Create 2FA configuration audit trail and compliance logging

- **Acceptance Criteria:**
    - Email+Password login automatically requires 2FA configuration
    - 2FA methods (email/mobile) can be independently configured
    - Business rules prevent Email+Password activation without 2FA setup
    - 2FA method testing validates delivery mechanisms
    - Configuration integrates with notification-service for delivery
    - All 2FA configuration changes are comprehensively audited
    - Invalid 2FA configurations return specific error explanations

- **Dependencies:** TASK-BE-004 (login method configuration)

#### TASK-FE-005: 2FA Configuration Frontend Interface (FR-05)

- **Summary:** Frontend interface for two-factor authentication configuration
- **Issue Type:** Story
- **Story Points:** 4  
- **Priority:** High
- **Labels:** frontend, 2fa-config, security, conditional-ui, validation
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI interface for 2FA configuration with conditional display based on login method selection and comprehensive validation.

- **Technical Requirements:**
    - Implement conditional 2FA configuration panel for Email+Password method
    - Add toggle controls for 2FA delivery methods (email/mobile)
    - Create 2FA testing interface for method verification
    - Implement validation preventing Email+Password without 2FA
    - Add security-focused UI design with clear indication of requirements
    - Create help documentation explaining 2FA importance and setup
    - Integrate with notification testing for delivery verification

- **Acceptance Criteria:**
    - 2FA configuration panel appears automatically when Email+Password is enabled  
    - Users cannot save Email+Password configuration without setting up 2FA
    - 2FA method toggles (email/mobile) work independently
    - 2FA testing provides clear success/failure feedback with delivery confirmation
    - Security messaging clearly explains why 2FA is required
    - Help documentation guides users through 2FA setup process
    - Configuration validation prevents submission of incomplete 2FA setup

- **Dependencies:** TASK-FE-004, TASK-BE-005

#### TASK-BE-006: Login-Specific Notification Rules Backend (FR-06)

- **Summary:** Backend implementation of automatic notification rules by login method
- **Issue Type:** Story
- **Story Points:** 3
- **Priority:** Medium
- **Labels:** backend, notification-rules, automation, integration
- **Components:** policy-service, notification-service integration

- **Description:**
    Implement backend system for automatically applying notification rules based on selected login methods with integration to notification-service.

- **Technical Requirements:**
    - Create automatic notification rule assignment based on login method selection
    - Implement notification rule mapping (Email+Password→welcome email, Mobile+OTP→SMS, Employee ID+YOB→none)
    - Add integration points with notification-service for rule activation
    - Create notification rule validation and testing endpoints
    - Implement rule override prevention ensuring system-defined rules remain unchanged
    - Add notification delivery tracking and status reporting
    - Create notification rule audit trail for compliance

- **Acceptance Criteria:**
    - Notification rules are automatically assigned based on login method selection
    - Email+Password method triggers welcome email and password reset notifications
    - Mobile+OTP method triggers SMS welcome messages  
    - Employee ID+YOB method has no automatic notifications
    - Notification rules cannot be manually overridden by users
    - Integration with notification-service activates rules correctly
    - All notification rule assignments are logged in audit system

- **Dependencies:** TASK-BE-004 (login method configuration)

#### TASK-FE-006: Notification Rules Display Frontend (FR-06)

- **Summary:** Frontend display of automatic notification rules (read-only)
- **Issue Type:** Story
- **Story Points:** 2
- **Priority:** Medium  
- **Labels:** frontend, notification-display, read-only, informational
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI read-only display showing which notification rules are automatically applied based on selected login methods.

- **Technical Requirements:**
    - Implement read-only display panel showing active notification rules
    - Add dynamic rule display updating based on login method selection
    - Create informational messaging explaining automatic rule assignment
    - Implement notification rule status indicators (active/inactive)
    - Add help text explaining why rules cannot be manually modified
    - Create responsive layout for notification rule information
    - Integrate with existing notification system status display

- **Acceptance Criteria:**
    - Notification rules display updates automatically when login methods change
    - Users can see which notifications will be triggered for each login method
    - Display clearly indicates that rules are automatically managed
    - Notification status shows active/inactive state for each rule type
    - Help text explains the business rationale for automatic rule assignment
    - Display layout works consistently across different device sizes
    - Information integrates seamlessly with overall configuration interface

- **Dependencies:** TASK-FE-004, TASK-BE-006

---

### 🏥 Category C: Wellness Management

#### TASK-BE-007: Corporate Wellness Configuration Backend (FR-07)

- **Summary:** Backend API for mandatory Corporate Wellness configuration
- **Issue Type:** Story  
- **Story Points:** 4
- **Priority:** High
- **Labels:** backend, wellness-config, mandatory, business-rules
- **Components:** policy-service

- **Description:**
    Implement backend API for Corporate Wellness configuration with mandatory enablement and benefit configuration management.

- **Technical Requirements:**
    - Create Corporate Wellness configuration endpoints with mandatory status enforcement
    - Implement business rule validation preventing Corporate Wellness disabling
    - Add wellness benefit configuration management with JSONB storage
    - Create wellness configuration validation ensuring completeness
    - Implement wellness benefit template management and defaults
    - Add wellness configuration testing and validation endpoints
    - Create comprehensive audit trail for wellness configuration changes

- **Acceptance Criteria:**
    - Corporate Wellness configuration is always enabled and cannot be disabled
    - Wellness benefit configuration supports flexible schema definition
    - Configuration validation ensures all required wellness benefits are configured
    - Wellness benefit templates provide starting configurations
    - Configuration testing validates wellness setup completeness
    - All wellness configuration changes are logged with complete audit trail
    - Invalid wellness configurations return specific error details

- **Dependencies:** None

#### TASK-FE-007: Corporate Wellness Configuration Frontend Interface (FR-07)

- **Summary:** Frontend interface for Corporate Wellness benefit configuration
- **Issue Type:** Story
- **Story Points:** 4
- **Priority:** High
- **Labels:** frontend, wellness-config, mandatory-ui, benefit-management  
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI interface for Corporate Wellness configuration with clear mandatory status indication and benefit management.

- **Technical Requirements:**
    - Implement wellness configuration panel with mandatory status indication
    - Add benefit management interface with add/edit/remove functionality
    - Create benefit configuration forms with validation and templates
    - Implement wellness configuration testing interface
    - Add progress indicators showing configuration completeness
    - Create help documentation for wellness benefit setup
    - Integrate with form validation and error handling framework

- **Acceptance Criteria:**
    - Interface clearly shows Corporate Wellness as mandatory and always enabled
    - Benefit management allows complete CRUD operations for wellness benefits
    - Configuration templates help users set up common wellness benefits
    - Progress indicators show how much of wellness configuration is complete
    - Validation prevents submission of incomplete wellness configurations
    - Help documentation guides users through wellness benefit setup
    - Form integration provides clear feedback on configuration status

- **Dependencies:** TASK-BE-007

#### TASK-BE-008: Insurance Wellness Toggle Backend (FR-08)

- **Summary:** Backend API for Insurance Wellness enable/disable functionality
- **Issue Type:** Story
- **Story Points:** 3
- **Priority:** High
- **Labels:** backend, insurance-wellness, toggle, optional-config
- **Components:** policy-service

- **Description:**
    Implement backend API for Insurance Wellness toggle functionality with proper state management and dependent configuration handling.

- **Technical Requirements:**
    - Create Insurance Wellness toggle endpoints with state management
    - Implement cascade logic for dependent Insurance Wellness configurations
    - Add validation preventing orphaned Insurance Wellness type selections
    - Create Insurance Wellness status tracking and history
    - Implement cleanup logic when Insurance Wellness is disabled
    - Add Insurance Wellness configuration testing and validation
    - Create audit trail for Insurance Wellness enablement changes

- **Acceptance Criteria:**
    - Insurance Wellness can be toggled between Allowed and Not Allowed states
    - Disabling Insurance Wellness cleans up dependent type configurations
    - Enabling Insurance Wellness requires subsequent type selection
    - Toggle state changes are validated for configuration consistency
    - Configuration cleanup preserves audit trail for disabled settings
    - Insurance Wellness testing validates configuration when enabled
    - All toggle operations are logged with complete state change details

- **Dependencies:** None

#### TASK-FE-008: Insurance Wellness Toggle Frontend Interface (FR-08)

- **Summary:** Frontend interface for Insurance Wellness enable/disable toggle
- **Issue Type:** Story
- **Story Points:** 2  
- **Priority:** High
- **Labels:** frontend, insurance-wellness-toggle, state-management, conditional-ui
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI toggle interface for Insurance Wellness with clear state indication and dependent configuration management.

- **Technical Requirements:**
    - Implement toggle switch component for Insurance Wellness enablement
    - Add clear labeling showing Allowed/Not Allowed states
    - Create confirmation dialog for disabling Insurance Wellness
    - Implement conditional display of dependent Insurance Wellness configurations
    - Add state change animation and visual feedback
    - Create help text explaining Insurance Wellness purpose and impact
    - Integrate with form validation and state management

- **Acceptance Criteria:**
    - Toggle switch clearly shows current Insurance Wellness state (Allowed/Not Allowed)
    - Confirmation dialog prevents accidental disabling of Insurance Wellness
    - Dependent configurations appear/disappear based on toggle state
    - State changes provide immediate visual feedback to users
    - Help text explains what Insurance Wellness enables in the portal
    - Toggle integration works seamlessly with form validation
    - State management prevents invalid configuration combinations

- **Dependencies:** TASK-BE-008

#### TASK-BE-009: Insurance Wellness Type Selection Backend (FR-09)

- **Summary:** Backend API for Insurance Wellness type selection (Corporate/Retail Policy)
- **Issue Type:** Story
- **Story Points:** 4
- **Priority:** High
- **Labels:** backend, insurance-type, validation, business-rules
- **Components:** policy-service

- **Description:**
    Implement backend API for Insurance Wellness type selection with validation requiring type selection when Insurance Wellness is enabled.

- **Technical Requirements:**
    - Create Insurance Wellness type selection endpoints with validation
    - Implement business rule enforcement requiring type selection when enabled
    - Add type-specific configuration management (Corporate vs Retail Policy)
    - Create type selection validation preventing submission without selection
    - Implement type change handling with configuration migration
    - Add type-specific benefit configuration management
    - Create comprehensive audit trail for type selection changes

- **Acceptance Criteria:**
    - Insurance Wellness type selection is required when Insurance Wellness is enabled
    - Corporate Policy and Retail Policy options are both available for selection
    - Type selection validation prevents configuration without type choice
    - Type changes properly migrate existing configurations where applicable
    - Type-specific configurations are properly managed and validated
    - Configuration submission is blocked until type selection is complete
    - All type selection changes are logged with detailed audit information

- **Dependencies:** TASK-BE-008 (Insurance Wellness toggle)

#### TASK-FE-009: Insurance Wellness Type Selection Frontend Interface (FR-09)

- **Summary:** Frontend interface for Insurance Wellness type selection
- **Issue Type:** Story  
- **Story Points:** 3
- **Priority:** High
- **Labels:** frontend, type-selection, validation, conditional-ui, radio-buttons
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI interface for selecting Insurance Wellness type with validation and clear type differentiation.

- **Technical Requirements:**
    - Implement radio button group for Insurance Wellness type selection
    - Add clear descriptions differentiating Corporate Policy vs Retail Policy
    - Create validation requiring type selection when Insurance Wellness enabled
    - Implement conditional display based on Insurance Wellness toggle state
    - Add type-specific configuration panels appearing after selection
    - Create help documentation explaining type differences and implications
    - Integrate with form validation preventing submission without selection

- **Acceptance Criteria:**
    - Radio buttons clearly show Corporate Policy and Retail Policy options
    - Type descriptions help users understand the difference between options
    - Type selection is required when Insurance Wellness is enabled
    - Form validation prevents submission without type selection
    - Type-specific configurations appear after making selection
    - Help documentation clearly explains implications of each type choice
    - Integration with form state management tracks selection changes

- **Dependencies:** TASK-FE-008, TASK-BE-009

#### TASK-BE-010: Wellness Benefit Sub-Configuration Backend (FR-10)

- **Summary:** Backend API for detailed wellness benefit configuration management
- **Issue Type:** Story
- **Story Points:** 6
- **Priority:** High
- **Labels:** backend, benefit-config, jsonb, validation, complex-config
- **Components:** policy-service

- **Description:**
    Implement backend API for managing detailed wellness benefit configurations with flexible schema support and comprehensive validation.

- **Technical Requirements:**
    - Create wellness benefit sub-configuration endpoints with JSONB storage
    - Implement flexible schema validation for different benefit types
    - Add benefit configuration templates and default value management
    - Create benefit configuration validation ensuring completeness
    - Implement benefit dependency management and relationship validation
    - Add benefit configuration testing and preview functionality
    - Create comprehensive audit trail for benefit configuration changes

- **Acceptance Criteria:**
    - Benefit sub-configurations support flexible schema definition through JSONB
    - Configuration templates provide starting points for common benefit types
    - Validation ensures all mandatory benefit configuration fields are completed
    - Benefit dependencies and relationships are properly validated
    - Configuration testing verifies benefit setup correctness
    - Preview functionality shows how benefits will appear to end users
    - All benefit configuration changes are logged with detailed audit trail

- **Dependencies:** TASK-BE-007, TASK-BE-009

#### TASK-FE-010: Wellness Benefit Sub-Configuration Frontend Interface (FR-10)

- **Summary:** Frontend interface for detailed wellness benefit configuration
- **Issue Type:** Story
- **Story Points:** 5
- **Priority:** High
- **Labels:** frontend, benefit-config, dynamic-forms, validation, templates
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI interface for managing wellness benefit configurations with dynamic form generation and template support.

- **Technical Requirements:**
    - Implement dynamic form generation based on benefit configuration schemas
    - Add benefit configuration templates with one-click application
    - Create benefit management interface with add/edit/remove/duplicate functionality
    - Implement real-time validation for benefit configuration completeness
    - Add benefit configuration preview showing end-user experience
    - Create benefit dependency management with visual relationship indicators
    - Integrate with form validation and error handling framework

- **Acceptance Criteria:**
    - Dynamic forms adapt to different benefit configuration requirements
    - Templates allow quick setup of common benefit configurations
    - Benefit management provides intuitive CRUD operations
    - Real-time validation shows configuration completeness status
    - Preview functionality accurately shows how benefits will appear to employees
    - Dependency management helps users understand benefit relationships
    - Form integration provides comprehensive validation feedback

- **Dependencies:** TASK-FE-007, TASK-FE-009, TASK-BE-010

---

### 📋 Category D: Policy & Enrollment

#### TASK-BE-011: Policy Assignment Backend (FR-11)

- **Summary:** Backend API for assigning policies to portal configurations
- **Issue Type:** Story
- **Story Points:** 5
- **Priority:** High  
- **Labels:** backend, policy-assignment, relationships, validation
- **Components:** policy-service

- **Description:**
    Implement backend API for managing policy assignments to portal configurations with validation and relationship management.

- **Technical Requirements:**
    - Create policy assignment endpoints with relationship validation
    - Implement policy eligibility validation for company assignments
    - Add multiple policy assignment support with conflict detection
    - Create policy assignment status tracking and management
    - Implement policy assignment testing and validation
    - Add policy assignment audit trail and change tracking
    - Create policy unassignment with cleanup and validation

- **Acceptance Criteria:**
    - Multiple policies can be assigned to a single portal configuration
    - Policy eligibility validation ensures appropriate company-policy relationships
    - Assignment conflicts are detected and reported with resolution suggestions
    - Policy assignment status is tracked and manageable
    - Assignment testing validates policy configuration compatibility
    - All policy assignments are logged with complete audit trail
    - Policy unassignment properly cleans up dependent configurations

- **Dependencies:** None (existing policy entities)

#### TASK-FE-011: Policy Assignment Frontend Interface (FR-11)

- **Summary:** Frontend interface for policy assignment and management
- **Issue Type:** Story
- **Story Points:** 4
- **Priority:** High
- **Labels:** frontend, policy-assignment, multi-select, validation, search
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI interface for policy assignment with search, selection, and management capabilities.

- **Technical Requirements:**
    - Implement policy search and selection interface with filtering
    - Add multi-select capability for assigning multiple policies
    - Create assigned policy management with remove/edit functionality  
    - Implement policy eligibility validation with clear error messaging
    - Add policy assignment preview showing configuration impact
    - Create assignment conflict resolution interface
    - Integrate with form validation and error handling framework

- **Acceptance Criteria:**
    - Policy search allows filtering by name, type, status, and other criteria
    - Multi-select interface supports selecting multiple policies efficiently
    - Assigned policies display with management options (edit, remove, reorder)
    - Eligibility validation provides clear feedback on assignment validity
    - Assignment preview shows how policies will appear in the portal
    - Conflict resolution helps users resolve assignment issues
    - Form integration prevents submission of invalid policy assignments

- **Dependencies:** TASK-BE-011

#### TASK-BE-012: Enrollment Window Configuration Backend (FR-12)

- **Summary:** Backend API for enrollment window management with date validation
- **Issue Type:** Story  
- **Story Points:** 5
- **Priority:** High
- **Labels:** backend, enrollment-windows, date-validation, overlap-detection
- **Components:** policy-service

- **Description:**
    Implement backend API for enrollment window configuration with comprehensive date validation and overlap detection.

- **Technical Requirements:**
    - Create enrollment window configuration endpoints with date validation
    - Implement overlap detection preventing conflicting enrollment periods
    - Add date range validation ensuring start date precedes end date
    - Create enrollment window status management and tracking
    - Implement enrollment window testing and preview functionality
    - Add timezone support for multi-region enrollment windows
    - Create comprehensive audit trail for enrollment window changes

- **Acceptance Criteria:**
    - Enrollment windows require both start and end dates with proper validation
    - Overlap detection prevents conflicting enrollment periods for same policies
    - Date validation ensures logical date ranges (start before end)
    - Enrollment window status tracking shows current active/inactive states
    - Testing functionality validates enrollment window configuration
    - Timezone support handles multi-region company requirements
    - All enrollment window changes are logged with detailed audit trail

- **Dependencies:** TASK-BE-011 (policy assignment)

#### TASK-FE-012: Enrollment Window Configuration Frontend Interface (FR-12)

- **Summary:** Frontend interface for enrollment window date management
- **Issue Type:** Story
- **Story Points:** 4
- **Priority:** High
- **Labels:** frontend, date-pickers, validation, calendar, overlap-detection
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI interface for enrollment window configuration with calendar integration and overlap detection.

- **Technical Requirements:**
    - Implement date picker components with calendar interface
    - Add enrollment window visualization showing timelines and overlaps
    - Create overlap detection with visual conflict indicators
    - Implement date validation with real-time feedback
    - Add enrollment window templates for common patterns
    - Create timezone selection and display for multi-region support
    - Integrate with form validation and error handling framework

- **Acceptance Criteria:**
    - Date pickers provide intuitive calendar interface for date selection
    - Timeline visualization clearly shows enrollment windows and potential overlaps
    - Overlap detection provides immediate visual feedback about conflicts
    - Date validation prevents submission of invalid date ranges
    - Templates help users configure common enrollment window patterns
    - Timezone support allows proper configuration for multi-region companies
    - Form integration provides comprehensive validation feedback

- **Dependencies:** TASK-FE-011, TASK-BE-012

#### TASK-BE-013: Financial Settings Configuration Backend (FR-13)

- **Summary:** Backend API for policy financial settings (excluding employer contribution)
- **Issue Type:** Story
- **Story Points:** 4
- **Priority:** Medium
- **Labels:** backend, financial-settings, policy-config, jsonb
- **Components:** policy-service

- **Description:**
    Implement backend API for managing policy financial settings with flexible configuration support excluding employer contribution details.

- **Technical Requirements:**
    - Create financial settings configuration endpoints with JSONB storage
    - Implement financial setting validation excluding employer contribution fields
    - Add financial setting templates and default value management
    - Create financial calculation validation and testing endpoints
    - Implement financial setting dependency validation
    - Add financial setting preview and calculation functionality
    - Create comprehensive audit trail for financial setting changes

- **Acceptance Criteria:**
    - Financial settings support flexible configuration through JSONB storage
    - Employer contribution fields are explicitly excluded from configuration
    - Financial setting validation ensures mathematical consistency
    - Templates provide starting configurations for common financial setups
    - Calculation testing validates financial setting accuracy
    - Preview functionality shows financial impact to end users
    - All financial setting changes are logged with detailed audit trail

- **Dependencies:** TASK-BE-011 (policy assignment)

#### TASK-FE-013: Financial Settings Configuration Frontend Interface (FR-13)

- **Summary:** Frontend interface for policy financial settings configuration
- **Issue Type:** Story
- **Story Points:** 4  
- **Priority:** Medium
- **Labels:** frontend, financial-config, dynamic-forms, calculations, validation
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI interface for financial settings configuration with calculation validation and preview capabilities.

- **Technical Requirements:**
    - Implement dynamic financial settings forms based on policy types
    - Add financial calculation validation with real-time feedback
    - Create financial setting templates with one-click application
    - Implement financial impact preview showing cost implications
    - Add currency formatting and validation for financial inputs
    - Create financial setting dependency management interface
    - Integrate with form validation and error handling framework

- **Acceptance Criteria:**
    - Dynamic forms adapt to different policy financial requirements
    - Real-time calculation validation shows financial consistency
    - Templates allow quick setup of common financial configurations
    - Financial preview accurately shows cost implications for end users
    - Currency handling supports proper formatting and validation
    - Dependency management helps users understand financial relationships
    - Form integration provides comprehensive financial validation feedback

- **Dependencies:** TASK-FE-011, TASK-BE-013

#### TASK-BE-014: Family Eligibility Configuration Backend (FR-14)

- **Summary:** Backend API for family member and dependent eligibility rules
- **Issue Type:** Story
- **Story Points:** 4
- **Priority:** Medium
- **Labels:** backend, family-eligibility, relationships, validation, jsonb
- **Components:** policy-service

- **Description:**
    Implement backend API for managing family eligibility configurations including relationship definitions and dependent limits.

- **Technical Requirements:**
    - Create family eligibility configuration endpoints with JSONB storage
    - Implement relationship type management and validation
    - Add dependent limit configuration and enforcement
    - Create eligibility rule validation and testing endpoints
    - Implement age-based eligibility rule management
    - Add family eligibility preview and scenario testing
    - Create comprehensive audit trail for eligibility configuration changes

- **Acceptance Criteria:**
    - Family eligibility supports flexible relationship definitions through JSONB
    - Relationship types can be configured with specific eligibility rules
    - Dependent limits are configurable and enforced during enrollment
    - Age-based eligibility rules support complex age range definitions
    - Eligibility testing validates rule configuration accuracy
    - Preview functionality shows eligibility scenarios for different family structures
    - All eligibility configuration changes are logged with detailed audit trail

- **Dependencies:** TASK-BE-011 (policy assignment)

#### TASK-FE-014: Family Eligibility Configuration Frontend Interface (FR-14)

- **Summary:** Frontend interface for family eligibility and dependent management
- **Issue Type:** Story  
- **Story Points:** 4
- **Priority:** Medium
- **Labels:** frontend, family-config, relationships, dynamic-rules, validation
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI interface for family eligibility configuration with relationship management and rule definition.

- **Technical Requirements:**
    - Implement family relationship management interface with add/edit/remove
    - Add dependent limit configuration with clear visual indicators
    - Create eligibility rule builder with drag-and-drop or form-based interface
    - Implement age range configuration with validation
    - Add family eligibility testing interface with scenario simulation
    - Create eligibility preview showing rules impact on different family types
    - Integrate with form validation and error handling framework

- **Acceptance Criteria:**
    - Relationship management allows complete CRUD operations for family relationships
    - Dependent limits provide clear configuration with visual feedback
    - Rule builder enables complex eligibility rule creation without technical knowledge
    - Age range configuration supports various age-based eligibility scenarios
    - Testing interface allows simulation of eligibility for different family structures
    - Preview functionality accurately shows how eligibility rules will apply
    - Form integration provides comprehensive eligibility validation feedback

- **Dependencies:** TASK-FE-011, TASK-BE-014

---

### 🔍 Category E: Preview & Publication

#### TASK-BE-015: Preview Mode Backend Implementation (FR-15)

- **Summary:** Backend API for portal preview generation and publication management
- **Issue Type:** Story
- **Story Points:** 8
- **Priority:** High
- **Labels:** backend, preview-generation, publication, mock-portal, validation
- **Components:** policy-service, ibp-service integration

- **Description:**
    Implement backend API for generating complete portal previews showing login, wellness, and enrollment experiences with publication management.

- **Technical Requirements:**
    - Create preview generation endpoints for different portal sections
    - Implement complete configuration validation before preview generation
    - Add mock portal data generation based on configuration settings
    - Create preview URL generation with secure temporary access
    - Implement publication workflow with final validation and deployment triggers
    - Add preview caching and performance optimization
    - Create comprehensive audit trail for preview and publication activities

- **Acceptance Criteria:**
    - Preview generation creates complete portal mockups for all configured sections
    - Configuration validation ensures all required settings are complete before preview
    - Mock data generation accurately reflects how real portal will function
    - Preview URLs provide secure temporary access to portal mockups
    - Publication workflow includes final validation before live deployment
    - Preview generation performance supports real-time user feedback
    - All preview and publication activities are logged with detailed audit trail

- **Dependencies:** All previous backend tasks (complete configuration required)

#### TASK-FE-015: Preview Mode Frontend Interface (FR-15)

- **Summary:** Frontend interface for portal preview and publication management
- **Issue Type:** Story
- **Story Points:** 6
- **Priority:** High  
- **Labels:** frontend, preview-interface, publication, iframe, validation-summary
- **Components:** ui/iwork

- **Description:**
    Create React Material-UI interface for portal preview with embedded preview display and publication workflow management.

- **Technical Requirements:**
    - Implement preview interface with embedded iframe or modal display
    - Add preview section navigation (login, wellness, enrollment, complete flow)
    - Create configuration validation summary before preview generation
    - Implement publication workflow with validation checkpoints and confirmation
    - Add preview sharing functionality with secure URL generation
    - Create publication status tracking and deployment monitoring
    - Integrate with form validation and overall configuration completeness tracking

- **Acceptance Criteria:**
    - Preview interface shows accurate representation of configured portal
    - Section navigation allows preview of all portal areas independently
    - Configuration validation summary shows completeness before preview generation
    - Publication workflow includes clear validation steps and confirmation dialogs
    - Preview sharing generates secure URLs for stakeholder review
    - Publication status provides real-time feedback on deployment progress
    - Integration with configuration validation prevents publication of incomplete setups

- **Dependencies:** All previous frontend tasks, TASK-BE-015

---

## Task Dependencies & Sequencing

### Parallel Development Opportunities:
- **Category A tasks** (branding) can be developed independently
- **Category B tasks** (authentication) have internal dependencies but are independent from other categories  
- **Category C tasks** (wellness) have internal dependencies (FR-07→FR-08→FR-09→FR-10)
- **Category D tasks** (policy) have sequential dependencies (FR-11→FR-12,FR-13,FR-14)
- **Category E task** (preview) depends on completion of all configuration categories

### Critical Path:
TASK-BE-007 → TASK-BE-008 → TASK-BE-009 → TASK-BE-010 → TASK-BE-015
TASK-BE-011 → TASK-BE-012,BE-013,BE-014 → TASK-BE-015

### Recommended Sprint Planning:
- **Sprint 1:** Category A (Branding) + Category B (Authentication) foundation
- **Sprint 2:** Category B completion + Category C (Wellness) foundation  
- **Sprint 3:** Category C completion + Category D (Policy) foundation
- **Sprint 4:** Category D completion + Category E (Preview) implementation
- **Sprint 5:** Integration testing and bug fixes

## Estimation Summary

| Category | Backend Tasks | Frontend Tasks | Total Effort |
|----------|--------------|----------------|--------------|
| A: Branding & Portal Identity | 13 points | 9 points | 22 points |
| B: Authentication Configuration | 13 points | 9 points | 22 points |  
| C: Wellness Management | 17 points | 14 points | 31 points |
| D: Policy & Enrollment | 18 points | 16 points | 34 points |
| E: Preview & Publication | 8 points | 6 points | 14 points |
| **TOTAL** | **69 points** | **54 points** | **123 points** |

## Definition of Done

### Individual Task Completion Criteria:
- ✅ All acceptance criteria met with functional validation
- ✅ Unit tests written with minimum 90% code coverage
- ✅ Integration tests for API endpoints and component integration
- ✅ Code review completed and approved
- ✅ Documentation updated (API docs, component docs)
- ✅ Error handling implemented and tested
- ✅ Security validation completed (input sanitization, authentication)
- ✅ Performance requirements met (response times, throughput)

### Category Completion Criteria:
- ✅ All tasks in category completed per definition of done
- ✅ Integration testing between related tasks completed
- ✅ End-to-end functional testing for category features
- ✅ UI/UX validation completed
- ✅ Cross-browser/device testing completed (frontend tasks)
- ✅ Database migration scripts tested and validated (backend tasks)