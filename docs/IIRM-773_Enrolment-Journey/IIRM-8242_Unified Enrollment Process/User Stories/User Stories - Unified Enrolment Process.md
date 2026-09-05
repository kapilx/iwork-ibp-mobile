
# Unified Enrolment Process – Gherkin Scenarios

---

#### Scenario 1: Enrol in a Single Eligible Policy (Existing Behavior)
    Given the employee is authenticated
    And the employee is on the "My Insurance" dashboard
    And the employee is eligible for Policy A
    And the enrolment period for Policy A is active
    When the employee clicks "Enroll Now" on Policy A
    Then the system opens the individual policy enrolment flow for Policy A
    And only Policy A is displayed
    And policy-level eligibility, cutoff, and edit rules are applied
    But the unified enrolment flow is not triggered

#### Scenario 2: Enrol in Multiple Policies via "Enroll All"
    Given the employee is authenticated
    And the employee is on the "My Insurance"/ "dashboard"
    And the employee has multiple policies (A, B, C)
    And at least one policy is eligible for enrolment
    And the enrolment period is active for at least one policy
    When the employee clicks "Enroll All"
    Then the unified enrolment screen loads
    And all policies mapped to the employee are displayed together
    And eligible policies are editable
    And ineligible policies are visible but read-only with a caption
    And submission applies only to editable policies
    But the system does not trigger the single policy enrolment flow

#### Scenario 3: Only Eligible Policies are Editable
    Given the unified enrolment screen is displayed
    And the employee has policies with mixed eligibility
    When the employee reviews the policies
    Then only eligible policies can be selected and edited
    And ineligible policies cannot be modified or submitted
    But the system must validate eligibility per policy as per configuration

#### Scenario 4: Policy Eligibility Determination (All Cases)
    Given the system date and policy configuration are available
    When the system evaluates policy eligibility
    Then the policy state is determined as follows:
        | Condition                                             | Result/State                          |
        |------------------------------------------------------|---------------------------------------|
        | Date < enrolment start date                          | Policy is ineligible, read-only, tag: "Enrolment Opens on <Date>" |
        | Date > enrolment end date                            | Policy is ineligible, locked, tag: "Enrolment Closed"            |
        | Date within enrolment period, not yet enrolled       | Policy is eligible, editable, included in submission             |
        | Date within enrolment period, already enrolled       | Policy editability as per configuration                            |
        | Cutoff passed, auto-lock enabled                     | Policy is read-only, tag: "Enrolment Closed"; but if not enrolled, auto-enrol with default selection |
        | Enrolment submitted, auto-lock-after-confirmation    | Policy is read-only regardless of cutoff date                     |
        | Auto-lock-after-confirmation disabled, cutoff active | Policy remains editable until Cutoff date                                               |

#### Scenario 5: CTA Display and Post-Enrolment State
    Given the employee's enrolment status is known
    When the employee views the dashboard or "My Insurance" screen
    Then the system displays the following CTA/Behavior:
        | Condition                                                      | CTA/Behavior                                      |
        |----------------------------------------------------------------|---------------------------------------------------|
        | No enrolment started or saved                                  | Show "Enroll All" CTA                             |
        | Enrolment started but not confirmed                            | Show "Continue Enrolment" CTA                     |
        | At least one policy enrolled                                   | Show "View Past Enrolment Summaries" CTA          |
        | User clicks "View Past Enrolment Summaries"                    | Open Enrolment Summary Screen, all policies view-only |
        | No policies available for new enrolment, some editable         | Show "Edit Enrolment" CTA, open unified flow in edit mode |
        | No policies available for new enrolment, none editable         | Disable "Enroll All" CTA                          |

#### Scenario 6: Policy-Level CTA and Editability
    Given the employee is viewing a policy on "My Insurance"
    When the policy is displayed
    Then the system displays the following status tag/CTA/behavior:
        | Condition                                                      | Status Tag/CTA/Behavior                           |
        |----------------------------------------------------------------|---------------------------------------------------|
        | Policy enrolled, eligible for edit                             | Tag: "Enrolled", CTA: "Show Summary" (editable)   |
        | Policy enrolled, not eligible for edit (cutoff/auto-lock)      | Tag: "Enrolled", CTA: "Show Summary" (read-only)  |
        | Policy not enrolled, within enrolment period                   | Show closure date, CTA: "Enroll Now"              |
        | Policy enrolment period not started, email available           | Show open date, CTA: "Notify" (send reminder)     |
        | Policy enrolment period not started, but email not available   | Show lock icon and no action allowed                                        |

#### Scenario 7: Policy Becomes Eligible Later
    Given a policy was previously ineligible
    When the policy becomes eligible
    Then the policy becomes editable in unified enrolment
    And previously enrolled editable policies remain editable
    But locked policies remain locked

#### Scenario 8: Enrolment Summary Screen (Unified & Past)
    Given the employee has enrolled in one or more policies
    When the employee clicks "Show Summary" or "View Past Enrolment Summaries"
    Then the Enrolment Summary Screen opens in view-only mode
    And all relevant policies are displayed as separate sections/cards
    And aggregated calculations are displayed as per design
    But no edit or submission CTAs are shown

#### Scenario 9: Policy Constraints & Enforcement
    Given the unified enrolment screen is loaded
    When the employee reviews policy details
    Then:
        | Field                        | Visibility/Behavior                                      |
        |------------------------------|----------------------------------------------------------|
        | Sum Insured                  | Show value if enabled, else show "—"                    |
        | Employer Contribution        | Show value if enabled, else show "—" and exclude from aggregated calculation of Employeer contribution |
        | Enrolment Confirmation Required | If enabled: disclaimer is mandatory before submission; If disabled: disclaimer is not mandatory |
        | Editability                  | **Scenario 1 - Immediately Lock After Confirmation:** Policy becomes locked immediately after employee confirms enrolment, no further edits allowed regardless of cutoff date<br>**Scenario 2 - Lock After Cutoff Date:** Policy remains editable until cutoff date is exceeded, then becomes locked automatically |
        | Mid-year enrolment           | If allowed, enable actions; else, disable CTA and show message |
        | Disclaimers                  | All displayed in a single step, mapped to policies; acceptance required for submission |
        | Submission                   | Only eligible/editable policies included in submission and aggregates |

#### Scenario 10: Unified Enrolment Flow – Detailed Steps
    Given the employee is on the unified enrolment screen
    When the employee proceeds through the flow
    Then:
        | Step                        | Behavior/Validation                                 |
        |-----------------------------|-----------------------------------------------------|
        | Landing                     | All policies shown, employee details prefilled, dependents editable |
        | Plan/Option Selection       | First plan of first policy expanded, one option per plan selected by default, others collapsed |
        | Policy Info Visibility      | Show/hide fields as per config (sum insured, premium.) |
        | Default Selection           | If not expanded, default selections are applied and visible |
        | Dynamic Premium Summary     | Updates in real time as selections/dependents change |
        | Save and Exit               | Saves all selections, accessible via Continue CTA    |
        | Resume via Continue         | Preloads previous selections in unified or single flow |
        | Continue to Summary         | Shows consolidated summary of all selected policies  |
        | Navigation/Final Confirm    | Back retains selections, but Confirm validates and locks as per config |
        | Enrolment not sub & Enrolment cutoff date approached |System should enroll employee with default choices

#### Scenario 11: Save and Exit, Resume Enrolment
    Given the employee is making selections in the unified enrolment screen
    When the employee clicks "Save and Exit"
    Then all current selections are saved as a draft enrolment state
    And the draft is accessible from both unified and single policy flows

    Given the employee has a saved draft
    When the employee clicks "Continue" from unified enrolment
    Then all previously selected policies and choices are preloaded

    Given the employee has a saved draft for a single policy
    When the employee clicks "Continue" from that policy
    Then only that policy is loaded with previous selections prefilled

#### Scenario 12: Dynamic Premium Summary Widget
    Given the employee is on the unified enrolment screen
    When the employee selects or changes a plan, modifies options, or adds/removes dependents
    Then the side premium summary widget updates dynamically
    And the widget reflects consolidated premiums across all currently selected and eligible policies
    But premiums for policies whose enrolment period has not started are not included in aggregates

#### Scenario 13: Disclaimer Enforcement Before Submission
    Given the employee proceeds to the enrolment summary step
    When disclaimers are displayed for all selected policies
    Then the employee must accept all disclaimers before submission is enabled
    But submission is blocked until all confirmations are accepted

#### Scenario 14: Back Navigation and Final Confirmation
    Given the employee is on the enrolment summary screen
    When the employee clicks "Back"
    Then the system returns to the unified enrolment screen and retains all selections

    When the employee clicks "Confirm"
    Then the system validates all selections
    And enforces all policy-level constraints and disclaimers
    And submits enrolment for all selected policies
    But post-confirmation, policies are locked based on cutoff and immediate lock configuration

#### Scenario 15: Mid-Year Enrolment Enable/Disable
    Given the policy is evaluated for mid-year enrolment
    When mid-year enrolment is allowed
    Then enrolment actions are enabled for that policy

    When mid-year enrolment is not allowed
    Then the enrolment CTA is disabled for that policy
    But a message is shown: "Mid-year enrolment is not allowed for this policy."

#### Scenario 16: Separate Dependent Handling for Current and Upcoming Year GMC Policies

**User Story**
As an employee, if I have two GMC policies where one applies to the current policy year and another applies to the upcoming policy year, I want the system to display and manage dependents separately for each GMC policy.

**Acceptance Criteria / Retail Format**
    Given the employee has:
        • GMC policy for current policy year
        • GMC policy for upcoming policy year
    When the unified enrolment screen is displayed
    Then both GMC policies are displayed separately
    And each GMC policy has its own independent dependent section
    And dependents added/modified for one GMC policy do not appear under the other
    And dependent eligibility, validation, and submission are evaluated separately
    And dependent data is saved and submitted against respective GMC policy only

Edge Cases

#### Scenario 17: System Failure During Save or Submission
    Given the employee attempts to save a draft or submit enrolment
    When a system error or network failure occurs
    Then the system displays an error message indicating the failure
    And no partial or corrupt data is saved
    But the employee can retry the action

    Given the employee has two GMC policies (current and upcoming year)
    When the employee manages dependents
    Then each GMC policy displays its own independent dependent section
    And dependents for one policy do not appear under the other
    And dependent eligibility, validation, and submission are evaluated separately
    But dependent data is saved and submitted against the respective GMC policy only

    When the employee reviews policy details
    Then:
        | Field                | Visibility/Behavior                                      |
        |----------------------|---------------------------------------------------------|
        | Sum Insured          | Show value if enabled, else show "—"                    |
        | Employer Contribution| Show value if enabled, else show "—" and exclude from aggregate |
        | Editability          | Follows precedence: immediate lock after confirmation > auto-lock after cutoff > policy-level config |
        | Mid-year enrolment   | If allowed, enable actions; else, disable CTA and show message |
        | Disclaimers          | All displayed in a single step, mapped to policies; acceptance required for submission |
        | Submission           | Only eligible/editable policies included in submission and aggregates |

---

#### Scenario 18: Unauthorized Access or Session Expiry
    Given the employee is not authenticated or the session has expired
    When the employee attempts to access the unified enrolment screen or perform any enrolment action
    Then the system redirects the employee to the login screen
    And a message is displayed: "Your session has expired. Please log in again."

#### Scenario 19: Data Consistency Across Devices
    Given the employee has saved a draft enrolment on one device
    When the employee logs in and accesses the unified enrolment screen from another device
    Then the system loads the latest saved draft state
    And all previous selections are available for review and edit


