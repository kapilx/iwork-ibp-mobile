# JIRA Story: IIRM-8058 - IBP End User Portal Configurator - Detailed Story and Acceptance Criteria

## Story Details

**Story Type:** Epic/Feature  
**Priority:** High  
**Story Points:** 34  
**Epic Link:** IBP Portal Enhancement  
**Component:** CRM, IBP Portal  
**Labels:** portal-configurator, crm-enhancement, company-customization, authentication, sso  

---

## User Story

**As an** IIRM Administrator  
**I want** a comprehensive company portal configurator module in the CRM  
**So that** I can set up, customize, and manage the complete portal experience for each corporate client without requiring development effort  

---

## Background/Context

Currently, setting up a corporate client's portal requires multiple manual steps, development interventions, and lacks centralized control. Each corporate has unique requirements for:
- Portal branding and appearance
- Authentication methods (OTP, SSO, password, employee ID)
- Employee eligibility and access rules
- Security policies and session management
- Integration with HRMS systems
- Support and communication settings

The current process is manual, error-prone, and delays corporate onboarding significantly.

---

## Business Value

- **Reduce onboarding time** from weeks to hours for new corporates
- **Eliminate development dependencies** for portal setup and configuration
- **Improve consistency** in portal configurations across corporates
- **Enhance security** through standardized authentication and access controls
- **Provide self-service capabilities** for configuration management
- **Reduce operational errors** by 80% through automated validations

---

## Acceptance Criteria

### AC-1: Company Profile Management
**Given** I am an IIRM Administrator  
**When** I access the Company Configurator  
**Then** I should be able to:
- View and update corporate basic details (name, code, geography)
- Activate/deactivate the company portal with immediate effect
- See current portal status (Active/Inactive/Draft)
- Access company-specific configuration history
- Navigate between different corporate configurations

**Validation Points:**
- Corporate code must be unique across the system
- Deactivation should prevent employee access immediately
- All mandatory fields must be completed before activation

### AC-2: Portal URL & Domain Management
**Given** I am configuring a corporate portal  
**When** I access the URL & Domain Management section  
**Then** I should be able to:
- Configure a unique portal URL in slug format (e.g., company-name.iirm.com)
- Validate URL availability in real-time
- Map a custom domain and upload SSL certificates
- Generate separate UAT and production links automatically
- Preview the URL structure before publishing

**Validation Points:**
- URL must contain only lowercase letters, numbers, and hyphens
- URL availability check must be immediate and accurate
- Custom domains must pass DNS verification
- SSL certificates must be valid and not expired

### AC-3: Login & Authentication Configuration
**Given** I need to set up authentication methods  
**When** I access the Login & Authentication section  
**Then** I should be able to:
- Enable/disable multiple login methods:
  * Mobile OTP
  * Email OTP  
  * Password-based login
  * Employee ID + Date of Birth
  * HRMS-token login
  * SSO (SAML/OAuth/OpenID)
- Configure multiple active login methods simultaneously
- Set up fallback login when SSO is enabled
- Define primary login identifier (mobile/email/employee ID)
- Test each authentication method before activation

**Validation Points:**
- At least one login method must always be active
- Fallback login is mandatory when SSO is enabled
- Login identifiers must be unique per company
- Test functionality must validate each method works correctly

### AC-4: SSO Configuration and Management
**Given** I need to set up Single Sign-On  
**When** I access the SSO Configuration section  
**Then** I should be able to:
- Upload metadata XML file or specify metadata URL
- Map required identity attributes (email, name, employee ID, etc.)
- Use "Test SSO Connection" functionality to validate setup
- Configure token expiry, auto-logout, and redirect URLs
- View SSO failure logs with detailed error codes
- Set up multiple SSO providers if needed

**Validation Points:**
- Metadata must be valid XML format
- All mapped attributes must exist in the SSO response
- Test connection must succeed before enabling SSO
- Error logs must provide actionable debugging information

### AC-5: Branding & Appearance Customization
**Given** I want to customize the portal appearance  
**When** I access the Branding & Appearance section  
**Then** I should be able to:
- Upload company logo (PNG, JPG, SVG, max 2MB)
- Configure primary and secondary color schemes
- Customize login screen messages and background images
- Upload banner images for the portal header
- Preview branding changes before publishing
- Reset to default branding if needed

**Validation Points:**
- Logo file size must not exceed 2MB
- Color combinations must pass accessibility checks
- Preview must accurately reflect final appearance
- Branding changes must apply across all portal pages

### AC-6: Employee Eligibility & Access Rules
**Given** I need to control portal access  
**When** I access the Employee Eligibility section  
**Then** I should be able to:
- Define eligibility rules based on employee attributes:
  * Employee type (permanent, contract, temporary)
  * Grade/level
  * Employment status (active, inactive)
  * Country/location
  * Department
- Restrict portal access to selected employee segments
- Configure onboarding method (auto-registration vs self-registration)
- Set up approval workflows for portal access requests
- Test eligibility rules with sample employee data

**Validation Points:**
- Selected identifiers must exist in employee master data
- Eligibility criteria must be logically consistent
- Test scenarios must cover edge cases
- Access restrictions must be enforced immediately upon publication

### AC-7: Security & Session Policy Management
**Given** I need to configure security settings  
**When** I access the Security & Session Policies section  
**Then** I should be able to:
- Set OTP expiry time (30-180 seconds)
- Configure OTP resend attempt limits
- Define maximum login attempts before account lockout
- Set session timeout duration (5-60 minutes)
- Toggle multi-device login support
- Configure password complexity requirements
- Set up IP whitelisting if required

**Validation Points:**
- OTP expiry must be within acceptable range
- Session timeout must be numeric and within specified limits
- Login attempt limits cannot exceed system maximums
- Security changes must be validated before application

### AC-8: HRMS Integration Configuration
**Given** I need to integrate with corporate HRMS  
**When** I access the Integrations section  
**Then** I should be able to:
- Upload or map HRMS employee data structure
- Configure SFTP/API endpoints for HRMS synchronization
- Set up data field mappings between HRMS and portal
- Schedule sync frequency (daily, weekly, real-time)
- Test connectivity and data flow
- Monitor sync status and error logs

**Validation Points:**
- Data mappings must be complete and accurate
- Connectivity tests must pass before activation
- Sync schedules must be realistic and achievable
- Error handling must be robust and informative

### AC-9: Support & Communication Setup
**Given** I need to configure support channels  
**When** I access the Support & Communication section  
**Then** I should be able to:
- Configure helpdesk contact details (email, phone, WhatsApp)
- Set helpdesk working hours and availability
- Add corporate-specific announcements with rich text formatting
- Upload disclaimer documents and legal notices
- Set announcement validity periods
- Configure escalation procedures for support tickets

**Validation Points:**
- Contact information must be validated for format and reachability
- Announcements must have proper start and end dates
- Disclaimers must be approved before publication
- Support information must be easily accessible to employees

### AC-10: Preview & Publishing Workflow
**Given** I have completed configuration setup  
**When** I access the Preview & Publishing section  
**Then** I should be able to:
- Run comprehensive validation checks before publishing
- Save configurations as draft for later completion
- Preview the complete portal experience as an employee would see it
- Publish configurations with one-click deployment
- See configuration sync status to live portal
- Receive confirmation of successful publication within 5 seconds

**Validation Points:**
- All mandatory configurations must be completed before publishing
- Preview must accurately represent the live portal
- Publication must complete within specified timeframe
- Rollback capability must be available if publication fails

### AC-11: Audit Trail & Version Control
**Given** I need to track configuration changes  
**When** I make any configuration updates  
**Then** the system should:
- Log all changes with editor name, timestamp, and specific modifications
- Create version entries for each publication
- Provide detailed change history with before/after comparisons
- Allow rollback to any previous configuration version
- Maintain immutable audit logs for compliance
- Show configuration evolution timeline

**Validation Points:**
- All changes must be logged automatically
- Rollback must not affect employee data or active sessions
- Audit logs must be searchable and filterable
- Version history must be preserved indefinitely

### AC-12: Login Analytics & Monitoring
**Given** I need to monitor portal usage and issues  
**When** I access the Login Analytics section  
**Then** I should be able to:
- View login attempts (successful and failed) with trends
- Monitor OTP delivery failures and retry attempts
- Track SSO authentication failures with error details
- See account lockouts and unlock requests
- Analyze login patterns by geography, device, and time
- Export analytics reports for further analysis
- Set up alerts for unusual login patterns or high failure rates

**Validation Points:**
- Analytics data must be real-time or near real-time
- Reports must be accurate and comprehensive
- Alert thresholds must be configurable
- Data export must include all relevant details

### AC-13: Role-Based Access Control
**Given** different user roles need different access levels  
**When** users access the configurator  
**Then** access should be controlled as follows:
- **Portal Configurator Admin**: Full access to all configuration options
- **Operations User**: View access and limited editing capabilities
- **Account Manager**: View and preview capabilities only
- **Super Admin**: All permissions plus URL changes and version rollback
- All actions must be logged with user identification

**Validation Points:**
- Role permissions must be enforced consistently
- Privilege escalation must not be possible
- Sensitive operations must require appropriate authorization
- User access must be auditable and traceable

### AC-14: Multi-Environment Support
**Given** configurations need to work across environments  
**When** I configure portal settings  
**Then** the system should:
- Provide separate configurations for UAT and production environments
- Allow configuration promotion from UAT to production
- Maintain environment-specific settings (URLs, certificates)
- Support configuration export/import between environments
- Validate configurations work correctly in target environment

**Validation Points:**
- Environment isolation must be maintained
- Configuration promotion must preserve integrity
- Environment-specific validations must be enforced
- Rollback must be available at environment level

---

## Technical Requirements

### Performance Requirements
- Configuration save time: < 2 seconds
- Portal sync time: < 5 seconds for live deployment
- Page load time: < 3 seconds for configuration interfaces
- Support for 100+ concurrent administrator sessions
- Analytics data refresh: < 10 seconds

### Security Requirements
- Role-based access control with granular permissions
- All configuration data encrypted at rest and in transit
- Audit logs tamper-proof and immutable
- Session management with automatic timeout
- Input validation and sanitization for all fields
- Secure file upload with virus scanning

### Browser Compatibility
- Chrome 90+
- Firefox 85+
- Safari 14+
- Edge 90+
- Mobile browser support for preview functionality

### Integration Requirements
- RESTful APIs for external system integration
- Webhook support for real-time notifications
- SAML 2.0 and OAuth 2.0/OpenID Connect support
- SFTP and secure API endpoints for HRMS integration

---

## Definition of Done

- [ ] All acceptance criteria implemented and tested
- [ ] Unit tests written with 85%+ code coverage
- [ ] Integration tests for portal synchronization
- [ ] Security testing completed and vulnerabilities addressed
- [ ] Performance testing meets specified requirements
- [ ] Cross-browser compatibility testing completed
- [ ] API documentation complete and up-to-date
- [ ] User interface responsive and accessibility compliant
- [ ] Error handling and logging implemented comprehensively
- [ ] Configuration export/import functionality working
- [ ] Rollback procedures tested and validated
- [ ] User acceptance testing completed and signed off
- [ ] Production deployment plan approved and tested
- [ ] Monitoring and alerting systems configured
- [ ] User documentation and training materials completed

---

## Dependencies

1. **CRM System Enhancement** - Backend infrastructure for configuration storage
2. **IBP Portal Modification** - Frontend changes to read configurations dynamically
3. **Database Schema Updates** - New tables for storing all configuration data
4. **File Storage Service** - For managing uploaded assets (logos, certificates)
5. **Real-time Sync Service** - For pushing configurations to live portal
6. **Authentication Service** - For SSO integration and multi-factor authentication
7. **Analytics Service** - For login monitoring and reporting functionality
8. **Notification Service** - For alerts and communication features

---

## Risks & Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| SSO integration complexity | High | Medium | Early proof of concept with major SSO providers |
| Performance degradation with complex configurations | Medium | Medium | Implement caching and optimization strategies |
| Security vulnerabilities in file uploads | High | Low | Comprehensive security testing and validation |
| Configuration conflicts during sync | High | Medium | Implement conflict detection and resolution |
| User adoption challenges | Medium | Medium | Comprehensive training and intuitive UI design |
| Data migration from existing configurations | Medium | High | Develop automated migration tools and procedures |

---

## Test Scenarios

### Functional Test Cases
1. **Complete Portal Setup Flow** - End-to-end configuration for new corporate
2. **SSO Integration Testing** - Multiple SSO providers and error scenarios
3. **Authentication Method Validation** - All login methods and fallback scenarios
4. **Branding and Preview Testing** - Visual consistency and preview accuracy
5. **Security Policy Enforcement** - Session management and access control
6. **HRMS Integration Flow** - Data sync and mapping validation
7. **Version Control and Rollback** - Configuration changes and rollback scenarios
8. **Analytics and Monitoring** - Login tracking and failure analysis

### Non-Functional Test Cases
1. **Performance Testing** - Load testing with multiple concurrent configurations
2. **Security Testing** - Penetration testing and vulnerability assessment
3. **Browser Compatibility** - Cross-browser functionality verification
4. **Mobile Responsiveness** - Configuration interface on mobile devices
5. **Scalability Testing** - System behavior with 100+ corporate configurations
6. **Disaster Recovery** - Configuration backup and recovery procedures

---

## Success Metrics

- **Configuration Time Reduction**: 90% decrease in portal setup time
- **Error Reduction**: 85% decrease in configuration-related issues
- **User Satisfaction**: 95% positive feedback from administrators
- **System Uptime**: 99.9% availability for configuration services
- **Support Ticket Reduction**: 70% decrease in portal-related support requests
- **Onboarding Speed**: New corporates live within 2 hours of configuration
- **SSO Success Rate**: 99% successful SSO authentication rate

---

## Related Stories

- IIRM-8060: IBP Portal Dynamic Configuration Reader
- IIRM-8061: CRM Backend API for Company Configuration Management  
- IIRM-8062: SSO Integration Service Enhancement
- IIRM-8063: Portal Analytics and Monitoring Dashboard
- IIRM-8064: HRMS Integration Service
- IIRM-8065: Configuration Migration and Export Tools
- IIRM-8066: User Training and Documentation System
- IIRM-8067: Mobile-Responsive Configuration Interface