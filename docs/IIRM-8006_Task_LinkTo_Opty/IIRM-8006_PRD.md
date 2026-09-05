# IIRM-8006 Task Link to Opportunity Product Requirements Document

## Document Information
- **Feature ID**: IIRM-8006
- **Feature Name**: Task Link to Opportunity (Task_LinkTo_Opty)
- **Document Type**: Product Requirements Document (PRD)
- **Created Date**: 11 December 2025
- **Last Updated**: 11 December 2025
- **Version**: 1.0
- **Status**: Draft

## Executive Summary

### Overview
This feature enhances the existing "Link to Opportunity" section in the Create Task form by implementing cascading dropdown functionality. Users will experience a streamlined workflow where Company selection drives Opportunity options, and Opportunity selection drives Activity options, ensuring contextually relevant choices at each step.

### Business Objectives
- Implement intuitive cascading dropdowns for Company → Opportunity → Activity selection
- Prevent invalid combinations by showing only relevant opportunities for selected companies
- Display only applicable activities based on opportunity type (RO/SO have different activities)
- Improve data quality by enforcing proper hierarchical relationships
- Enhance user experience with contextual, filtered dropdown options

## Requirements

### Functional Requirements

1. **Company Dropdown - Primary Selection**
   - Description: Display all active companies in a searchable dropdown as the first selection point
   - Acceptance Criteria:
     - Dropdown shows only active companies
     - Companies are searchable by name
     - Selection is required to enable opportunity dropdown
     - Clear visual indication when company is selected

2. **Opportunity Dropdown - Cascaded by Company**
   - Description: Show opportunities linked to the selected company only
   - Acceptance Criteria:
     - Zero state: Empty/disabled when no company is selected
     - Populated state: Shows only opportunities belonging to selected company
     - Dropdown clears when company selection changes
     - Visual feedback for loading states during data fetch
     - Shows meaningful opportunity identifiers (Opty. ID + Policy Type)

3. **Activity Dropdown - Cascaded by Opportunity**
   - Description: Display activities specific to the selected opportunity type
   - Acceptance Criteria:
     - Zero state: Empty/disabled when no opportunity is selected
     - Populated state: Shows activities relevant to opportunity type (RO vs SO)
     - Different activity lists for RO (Retention Opportunities) and SO (Sales Opportunities)
     - Dropdown clears when opportunity selection changes
     - Activities are contextually relevant to opportunity business type

4. **Progressive Enhancement Workflow**
   - Description: Enable/disable dropdowns in sequence based on previous selections
   - Acceptance Criteria:
     - Company dropdown is always enabled
     - Opportunity dropdown enables only after company selection
     - Activity dropdown enables only after opportunity selection
     - Clear visual states for enabled/disabled dropdowns
     - Maintain selections when navigating between enabled dropdowns

### Non-Functional Requirements
- Performance: Dropdown data loads within 1 second of selection
- Security: Only authorized users can view companies they have access to
- Scalability: System supports up to 1000 companies, 10,000 opportunities per company
- Usability: Clear visual hierarchy and intuitive selection flow
- Responsiveness: Dropdown behavior consistent across desktop and mobile devices

## User Stories

### Primary User Stories
Feature: Cascading Dropdowns for Task-Opportunity Linking

  Scenario: Initial state - Company selection required
    Given I am on the "Create New Task" page
    And I navigate to the "Link to Opportunity" section
    When I view the dropdown fields
    Then the Company dropdown is enabled and shows all active companies
    And the Opportunity ID dropdown is disabled with placeholder text "Select a company first"
    And the Activity dropdown is disabled with placeholder text "Select an opportunity first"

  Scenario: Company selection enables opportunity dropdown
    Given I am in the "Link to Opportunity" section
    And no company is currently selected
    When I select "ABC Insurance Ltd" from the Company dropdown
    Then the Opportunity ID dropdown becomes enabled
    And the Opportunity ID dropdown shows loading state
    And after loading, the Opportunity ID dropdown displays only opportunities linked to "ABC Insurance Ltd"
    And the Activity dropdown remains disabled

  Scenario: Opportunity selection enables activity dropdown
    Given I have selected "ABC Insurance Ltd" as the company
    And I have opportunities available in the Opportunity ID dropdown
    When I select "RO-2024-001 - Group Health Plan" from the Opportunity ID dropdown
    Then the Activity dropdown becomes enabled
    And the Activity dropdown shows loading state
    And after loading, the Activity dropdown displays activities specific to RO (Retention Opportunity) type
    And activities include items like "Policy Review", "Renewal Planning", "Client Meeting"

  Scenario: SO opportunity shows different activities
    Given I have selected "XYZ Corp" as the company
    And I select "SO-2024-005 - New Business Proposal" from the Opportunity ID dropdown
    When the Activity dropdown loads
    Then the Activity dropdown displays activities specific to SO (Sales Opportunity) type
    
  Scenario: Company change resets dependent dropdowns
    Given I have previously selected:
      | Field | Value |
      | Company | ABC Insurance Ltd |
      | Opportunity ID | RO-2024-001 |
      | Activity | Policy Review |
    When I change the Company selection to "DEF Insurance Corp"
    Then the Opportunity ID dropdown resets to empty state
    And the Opportunity ID dropdown shows opportunities for "DEF Insurance Corp" only
    And the Activity dropdown resets to disabled state with placeholder text
    And my previous Activity selection is cleared

  Scenario: Opportunity change resets activity dropdown
    Given I have selected "ABC Insurance Ltd" as company
    And I have selected "RO-2024-001" as opportunity
    And I have selected "Policy Review" as activity
    When I change the Opportunity ID to "SO-2024-003 - New Product Launch"
    Then the Activity dropdown resets and shows activities relevant to SO type
    And my previous Activity selection is cleared
    And the new activity list excludes RO-specific activities

  Scenario: No opportunities available for selected company
    Given I select a company that has no active opportunities
    When the Opportunity ID dropdown loads
    Then the dropdown shows "No opportunities available for this company"
    And the Activity dropdown remains disabled
    And I can still proceed with task creation without opportunity linking

  Scenario: Task creation with complete opportunity link
    Given I have successfully selected:
      | Field | Value |
      | Company | ABC Insurance Ltd |
      | Opportunity ID | RO-2024-001 - Group Health Plan |
      | Activity | Policy Review |
    And I have filled all required task fields
    When I click "Create Task"
    Then the task is created successfully
    And the task is linked to the selected opportunity and activity
    And I receive confirmation "Task created and linked to RO-2024-001 successfully"

### Reverse Flow: Pre-filled Task Creation from Opportunity/Activity Context

Feature: Pre-filled Task Creation from Opportunity Context

  Scenario: Create task from opportunity detail page
    Given I am viewing opportunity "RO-2024-001 - Group Health Plan" detail page
    And the opportunity belongs to company "ABC Insurance Ltd"
    And I am logged in as user "John Smith" (userId: 123)
    When I click "Create Task" button
    Then the Create Task form opens with pre-filled values:
      | Field | Pre-filled Value | Editable |
      | Task Subject | "Group Health Plan" | Yes |
      | Assigned To | "John Smith" (current user) | Yes |
      | Company | "ABC Insurance Ltd" | No |
      | Opportunity ID | "RO-2024-001 - Group Health Plan" | No |
      | Activity | "" (empty, to be selected) | Yes |
    And the Activity dropdown is enabled and shows RO-specific activities
    And all other task form fields remain empty for user input

  Scenario: Create task from specific activity within opportunity
    Given I am viewing opportunity "SO-2024-005 - New Business Proposal"
    And I am in the "Needs Analysis" activity section
    And the opportunity belongs to company "XYZ Corp"
    And I am logged in as user "Jane Doe" (userId: 456)
    When I click "Create Task" from within the "Needs Analysis" activity
    Then the Create Task form opens with pre-filled values:
      | Field | Pre-filled Value | Editable |
      | Task Subject | "Needs Analysis" | Yes |
      | Assigned To | "Jane Doe" (current user) | Yes |
      | Company | "XYZ Corp" | No |
      | Opportunity ID | "SO-2024-005 - New Business Proposal" | No |
      | Activity | "Needs Analysis" | No |
    And all Link to Opportunity fields are pre-populated and locked
    And the user can proceed directly to fill other task details

  Scenario: Create task from activity list page
    Given I am on the Activities page
    And I am viewing activity "Policy Review" for opportunity "RO-2024-003"
    And the opportunity "RO-2024-003" belongs to company "DEF Insurance Corp"
    When I click "Create Task" for the "Policy Review" activity
    Then the Create Task form opens with pre-filled values:
      | Field | Pre-filled Value | Editable |
      | Task Subject | "Policy Review" | Yes |
      | Assigned To | Current logged-in user | Yes |
      | Company | "DEF Insurance Corp" | No |
      | Opportunity ID | "RO-2024-003" | No |
      | Activity | "Policy Review" | No |
    And I cannot modify the Link to Opportunity section fields
    And I can edit Task Subject to make it more specific if needed

  Scenario: User modifies editable pre-filled fields
    Given I have opened Create Task form from opportunity context
    And the form has pre-filled values as per previous scenarios
    When I modify the Task Subject from "Policy Review" to "Annual Policy Review - Q4 2024"
    And I change the Assigned To from current user to "Alice Johnson"
    Then the modified values are accepted
    And the non-editable fields (Company, Opportunity, Activity) remain locked
    And I can proceed with task creation with the modified values

  Scenario: Task creation maintains context link
    Given I am creating a task from opportunity "RO-2024-001" activity "Client Meeting"
    And the form is pre-filled with opportunity context
    When I complete the remaining required fields (Due Date, Priority, Description)
    And I click "Create Task"
    Then the task is created successfully
    And the task is automatically linked to opportunity "RO-2024-001"
    And the task is associated with activity "Client Meeting"
    And I receive confirmation "Task created and linked to RO-2024-001 - Client Meeting successfully"
    And I am redirected back to the opportunity detail page



### Definition of Done
- [ ] All acceptance criteria for cascading dropdown functionality met
- [ ] Backend APIs created and tested for company, opportunity, and activity data
- [ ] Frontend TaskForm component enhanced with cascading behavior
- [ ] Form validation prevents invalid combinations
- [ ] Loading states and error handling implemented
- [ ] Zero state behaviors work as specified
- [ ] Company change properly resets dependent dropdowns
- [ ] RO vs SO activity differentiation working correctly
- [ ] Performance requirements met (1-second load time)
- [ ] Code reviewed and approved by technical lead
- [ ] Unit tests passing with minimum 90% coverage for new components
- [ ] Integration tests covering all cascading scenarios
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] Mobile responsiveness validated
- [ ] User acceptance testing completed with product owner
- [ ] Performance testing with large datasets completed
- [ ] Security review completed for new API endpoints
- [ ] Documentation updated (API docs, user guides, technical specs)
- [ ] Deployed to staging environment and validated
- [ ] Production deployment completed successfully

---

**Document Owner**: Nithin Krishna Sirigiri
**Updated Date**: 11-Dec-2025x