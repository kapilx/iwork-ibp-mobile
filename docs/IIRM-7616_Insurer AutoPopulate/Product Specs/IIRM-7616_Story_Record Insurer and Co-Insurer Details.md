# User Requirements: Record Insurer and Co-Insurer Details

**Jira Ticket**: IIRM-7616  
**Title**: Record Insurer and Co-Insurer Details  
**Date Created**: November 7, 2025  
**Created By**: Nithin  
**Status**: Draft - Ready for Review  

> **📋 Note for Developers & QA:**  
> All insurer names, company details, and data values used throughout this document are **examples only** for illustration purposes. Please replace with actual data from your test environments or production insurer master lists during implementation and testing.

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Business Objective](#business-objective)
3. [Scope](#scope)
4. [Feature Overview](#feature-overview)
5. [User Stories & Scenarios](#user-stories--scenarios)
   - [Part 1: Auto-populate Preferred Insurers](#part-1-auto-populate-preferred-insurers)
   - [Part 2: Insurer Share and Brokerage Details](#part-2-insurer-share-and-brokerage-details)
6. [Field Specifications](#field-specifications)
7. [Database Schema](#database-schema)
8. [Acceptance Criteria](#acceptance-criteria)
9. [Out of Scope](#out-of-scope)
10. [Appendix](#appendix)

---

## Executive Summary

This requirement document describes enhancements to the Opportunity management workflow for recording insurer and co-insurer details during the sales process. The feature consists of two parts:

**Part 1**: Auto-populate "Preferred Insurers" data from RFP Details Entry activity to Broking Slip Generation activity, reducing manual data entry and improving accuracy.

**Part 2**: Add comprehensive insurer share and brokerage details capture in the Meeting from Final Negotiation activity, enabling accurate tracking of premium distribution and commission allocation across lead and co-insurers.

---

## Business Objective

### Problem Statement
Currently, users must:
1. Re-enter the same insurer details multiple times across different activities
2. Manually track and calculate premium share and brokerage distribution
3. Validate calculations outside the system

### Solution Benefits
- **Reduce Data Entry Time**: Auto-population eliminates duplicate entry
- **Improve Data Accuracy**: Single source of truth for insurer details
- **Streamline Workflow**: Seamless data flow from RFP → Broking Slip → Final Negotiation
- **Enable Validation**: Built-in business rules ensure data integrity
- **Better User Experience**: Users can quickly validate previously entered data instead of re-entering

### Success Metrics
- Reduced time to complete Broking Slip Generation activity (estimated 40% reduction)
- Decreased data entry errors (estimated 60% reduction)
- Improved user satisfaction scores

---

## Scope

### In Scope

#### Part 1: Auto-populate Preferred Insurers
- Retrieve "Preferred Insurers" data from RFP Details Entry activity
- Pre-populate fields in Broking Slip Generation activity
- Allow users to edit pre-populated data
- Support multiple insurer entries

#### Part 2: Insurer Share & Brokerage Details
- Add "Insurer Details" section in Meeting from Final Negotiation activity
- Capture policy placement type (Single/Multiple insurers)
- Record lead insurer selection
- Capture insurer-wise premium share percentage and amounts
- Record insurer-wise brokerage percentage and amounts
- Auto-calculations for share amounts and brokerage amounts
- Real-time validations for business rules
- Support for multiple co-insurers

---

## Feature Overview

### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     OPPORTUNITY WORKFLOW                         │
└─────────────────────────────────────────────────────────────────┘

Step 1: RFP Details Entry
┌─────────────────────────┐
│ Preferred Insurers      │
│ • Insurer Name          │
│ • Location              │  ───┐
│ • Branch                │     │
│ • Contact               │     │
│ (Multiple entries)      │     │
└─────────────────────────┘     │
                                 │ PART 1
                                 │ Auto-populate
Step 2: Broking Slip Generation  │ (Editable)
┌─────────────────────────┐     │
│ Preferred Insurers      │     │
│ • Insurer Name    ◄─────┘     
│ • Location                     
│ • Branch                       
│ • Contact                      
│ (Pre-filled, Editable)  │
└─────────────────────────┘
                │
                │ Data flows to
                ▼
Step 3: Meeting from Final Negotiation
┌─────────────────────────────────────┐
│ Insurer Details (NEW - PART 2)      │
│ ┌─────────────────────────────────┐ │
│ │ Policy Placed Type              │ │
│ │ Select Lead Insurer             │ │
│ │ Only Lead Pays Brokerage        │ │
│ │                                 │ │
│ │ Insurers Share & Brokerage:     │ │
│ │  • Insurer Name                 │ │
│ │  • Premium Share %              │ │
│ │  • Premium Share Amount         │ │
│ │  • Insurer Brokerage %          │ │
│ │  • Insurer Brokerage Amount     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

---

## User Stories & Scenarios

---

## Part 1: Auto-populate Preferred Insurers

### Feature: Auto-populate Preferred Insurers from RFP to Broking Slip

*As a broker user*  
*I want Preferred Insurers from RFP Details Entry to auto-populate in Broking Slip Generation*  
*So that I can save time and avoid re-entering the same data*

---

### Scenario 1: Data Pre-population from RFP to Broking Slip

```gherkin
Feature: Auto-populate Preferred Insurers

Background:
  Given I am logged in as a broker user
  And I have an opportunity in progress

Scenario: Successfully pre-populate insurers from RFP to Broking Slip
  Given I have completed "RFP Details Entry" activity
  And I have entered the following "Preferred Insurers":
    | Insurer Name | Location | Branch  | Contact |
    | HDFC ERGO    | Mumbai   | Andheri | John    |
    | ICICI Lombard| Delhi    | CP      | Sarah   |
    | Star Health  | Chennai  | T Nagar | Kumar   |
    # Note: Above are example insurer names and details for illustration
  When I navigate to "Broking Slip Generation" activity
  And I open "Preferred Insurers" section
  Then all 3 insurers should be pre-populated with correct details:
    | Insurer Name | Location | Branch  | Contact |
    | HDFC ERGO    | Mumbai   | Andheri | John    |
    | ICICI Lombard| Delhi    | CP      | Sarah   |
    | Star Health  | Chennai  | T Nagar | Kumar   |
  And all fields should be editable
  And I should be able to modify any pre-filled value
```

---

### Scenario 2: Edit Pre-populated Insurer Data

```gherkin
Scenario: Modify pre-populated insurer details
  Given "Preferred Insurers" are pre-populated in Broking Slip from RFP
  And first insurer is "HDFC ERGO - Mumbai - Andheri - John"
  When I change the insurer name from "HDFC ERGO" to "Bajaj Allianz"
  And I change location from "Mumbai" to "Pune"
  And I change branch from "Andheri" to "Kothrud"
  And I change contact from "John" to "Priya"
  Then all changes should be saved
  And updated data should be stored in broking slip record
  And original RFP data should remain unchanged
```

---

### Scenario 3: Add More Insurers to Pre-populated List

```gherkin
Scenario: Add additional insurers beyond RFP list
  Given "Preferred Insurers" are pre-populated with 2 insurers from RFP
  When I click "[+ Add Another Insurer]" button
  Then a new blank insurer row should be added
  And I should be able to fill in new insurer details
  And total number of insurers should be 3
```

---

### Scenario 4: Delete Pre-populated Insurer

```gherkin
Scenario: Remove a pre-populated insurer from Broking Slip
  Given "Preferred Insurers" are pre-populated with 3 insurers from RFP
  When I click "Remove" button on 2nd insurer row
  Then the 2nd insurer should be removed from list
  And only 2 insurers should remain
  And original RFP data should remain unchanged
```

---

### Scenario 5: No Insurers in RFP

```gherkin
Scenario: Handle empty Preferred Insurers from RFP
  Given I have completed "RFP Details Entry" activity
  But I have NOT entered any "Preferred Insurers"
  When I navigate to "Broking Slip Generation" activity
  And I open "Preferred Insurers" section
  Then no insurers should be pre-populated
  And section should be empty
  And I should be able to add insurers manually
```

---

## Part 2: Insurer Share and Brokerage Details

### Feature: Record Insurer and Co-Insurer Share and Brokerage Details

*As a broker user*  
*I want to record premium share and brokerage details for lead and co-insurers*  
*So that I can accurately track commission distribution and policy participation*

---

### Background

```gherkin
Background:
  Given I am logged in as a broker user
  And I have an opportunity in "Final Negotiation" stage
  And I have completed "Broking Slip Generation" with Preferred Insurers:
    | Insurer Name | Location | Branch  | Contact |
    | HDFC ERGO    | Mumbai   | Andheri | John    |
    | ICICI Lombard| Delhi    | CP      | Sarah   |
    | Star Health  | Chennai  | T Nagar | Kumar   |
    # Note: Above insurer names, locations, and contact details are examples only
  And Basic Premium is "₹1,00,000"
  And Total Brokerage Amount is "₹5,000"
  And I am in "Meeting from Final Negotiation" activity
  And I am in "Insurer Details" section
```

---

### Scenario 6: Single Insurer - Custom Brokerage Percentage

```gherkin
Scenario: Record details for single insurer with editable brokerage percentage
  When I select "Single" from "Policy Placed Type" dropdown
  And I select "HDFC ERGO" from "Select Lead Insurer" dropdown
  Then the "Insurer Name" in sub-section should auto-populate with "HDFC ERGO"
  And "Premium Share Percentage" should display "100%" (read-only)
  And "Premium Share Amount" should display "₹1,00,000" (read-only)
  And "Insurer Brokerage %" should be editable
  And "Insurer Brokerage %" field should be empty (no default value)
  And I should not be able to add another insurer row
  And "[+ Add Another Insurer]" button should be hidden or disabled
  
  When I enter "5.0" in "Insurer Brokerage %"
  Then "Insurer Brokerage Amount" should calculate and display "₹5,000"
  And I should be able to save the record
  
  When I enter "3.5" in "Insurer Brokerage %"
  Then "Insurer Brokerage Amount" should calculate and display "₹3,500"
  And I should be able to save the record
```

---

### Scenario 7: Multiple Insurers - Premium Share Distribution

```gherkin
Scenario: Distribute premium share across multiple insurers
  When I select "Multiple" from "Policy Placed Type" dropdown
  And I select "HDFC ERGO" from "Select Lead Insurer" dropdown
  Then the "Insurer Name" in first row should auto-populate with "HDFC ERGO"
  And I should be able to click "[+ Add Another Insurer]" button
  
  When I click "[+ Add Another Insurer]" button
  Then a 2nd insurer row should be added
  
  When I select "ICICI Lombard" in 2nd row's "Insurer Name"
  And I enter "60" in 1st row's "Premium Share Percentage"
  And I enter "40" in 2nd row's "Premium Share Percentage"
  Then 1st row "Premium Share Amount" should display "₹60,000"
  And 2nd row "Premium Share Amount" should display "₹40,000"
  And total premium share percentage should show "100%"
  And validation should pass
```

---

### Scenario 8: Multiple Insurers - Brokerage Distribution Validation (Exact Match)

```gherkin
Scenario: Total brokerage matches exactly with total from previous steps
  Given I have selected "Multiple" for Policy Placed Type
  And I have 2 insurers with correct premium share totaling 100%:
    | Insurer      | Premium Share % | Premium Share Amount |
    | HDFC ERGO    | 60%             | ₹60,000              |
    | ICICI Lombard| 40%             | ₹40,000              |
  When I enter "5" in HDFC ERGO's "Insurer Brokerage %"
  Then HDFC ERGO's "Insurer Brokerage Amount" should display "₹3,000"
  
  When I enter "5" in ICICI Lombard's "Insurer Brokerage %"
  Then ICICI Lombard's "Insurer Brokerage Amount" should display "₹2,000"
  And total insurer brokerage should display "₹5,000"
  And total should equal Total Brokerage Amount "₹5,000"
  And no warning message should be displayed
  And I should be able to save the record
```

---

### Scenario 9: Lead Insurer vs Co-insurer Dropdown Data Sources

```gherkin
Scenario: Lead Insurer dropdown shows only Preferred Insurers
  Given I have selected "Multiple" for Policy Placed Type
  And Broking Slip has 3 preferred insurers: "HDFC ERGO", "ICICI Lombard", "Star Health"
  And Master insurer list has 50+ active insurers including "Bajaj Allianz", "Tata AIG", etc.
  When I click "Select Lead Insurer" dropdown
  Then dropdown should show ONLY the 3 preferred insurers:
    | HDFC ERGO     |
    | ICICI Lombard |
    | Star Health   |
  And dropdown should NOT show other insurers like "Bajaj Allianz", "Tata AIG"
  
Scenario: Co-insurer dropdown shows ALL active insurers
  Given I have selected "HDFC ERGO" as Lead Insurer
  And I click "[+ Add Another Insurer]" to add co-insurer
  When I click "Insurer Name" dropdown for Row 2 (co-insurer)
  Then dropdown should show ALL active insurers from master list:
    | ICICI Lombard | ← From preferred list |
    | Star Health   | ← From preferred list |
    | Bajaj Allianz | ← From master list    |
    | Tata AIG      | ← From master list    |
    | SBI General   | ← From master list    |
    | ... (all other active insurers) |
  But dropdown should NOT show "HDFC ERGO" (already selected as lead)
  And I should be able to select any insurer for co-insurer role
```

---

### Scenario 10: Two-Way Binding - Lead Insurer Selection

```gherkin
# Option A: Select Lead Insurer first
Scenario: Auto-populate Insurer Name when Lead Insurer is selected
  Given "Select Lead Insurer" field is empty
  And first row's "Insurer Name" is empty
  When I select "HDFC ERGO" from "Select Lead Insurer" dropdown
  Then first row's "Insurer Name" should auto-populate with "HDFC ERGO"

# Option B: Select Insurer Name first
Scenario: Auto-populate Lead Insurer when first row Insurer Name is selected
  Given "Select Lead Insurer" field is empty
  And first row's "Insurer Name" is empty
  When I select "ICICI Lombard" from first row's "Insurer Name" dropdown
  Then "Select Lead Insurer" should auto-populate with "ICICI Lombard"
```

---

### Scenario 11: Auto-Calculation - Premium Share Amount

```gherkin
Scenario: Premium Share Amount auto-calculates based on percentage
  Given Basic Premium is "₹1,00,000"
  And I have selected "Multiple" for Policy Placed Type
  And I have 3 insurers
  When I enter the following Premium Share Percentages:
    | Insurer      | Premium Share % |
    | HDFC ERGO    | 50%             |
    | ICICI Lombard| 30%             |
    | Star Health  | 20%             |
  Then Premium Share Amounts should auto-calculate as:
    | Insurer      | Premium Share Amount |
    | HDFC ERGO    | ₹50,000              |
    | ICICI Lombard| ₹30,000              |
    | Star Health  | ₹20,000              |
  And total should equal "₹1,00,000"
```

---

### Scenario 12: Auto-Calculation - Insurer Brokerage Amount

```gherkin
Scenario: Insurer Brokerage Amount auto-calculates from percentage
  Given I have 2 insurers with Premium Share Amounts:
    | Insurer      | Premium Share Amount |
    | HDFC ERGO    | ₹60,000              |
    | ICICI Lombard| ₹40,000              |
  When I enter the following Insurer Brokerage Percentages:
    | Insurer      | Insurer Brokerage % |
    | HDFC ERGO    | 5%                  |
    | ICICI Lombard| 4%                  |
  Then Insurer Brokerage Amounts should auto-calculate as:
    | Insurer      | Insurer Brokerage Amount |
    | HDFC ERGO    | ₹3,000                   |
    | ICICI Lombard| ₹1,600                   |
  And total insurer brokerage should be "₹4,600"
```

---

### Scenario 13: Validation Error - Premium Share Not 100%

```gherkin
Scenario: Prevent saving when premium share total is not 100%
  Given I have selected "Multiple" for Policy Placed Type
  And I have 2 insurers
  When I enter "60" in Insurer 1's Premium Share %
  And I enter "30" in Insurer 2's Premium Share %
  And total premium share is "90%"
  And I try to save the form
  Then system should display error "Total premium share percentage must equal 100%. Current total: 90%"
  And save button should be disabled or save should be blocked
  And form should remain in edit mode
  And I should be able to correct the percentages
```

---

### Scenario 14: Add/Remove Insurer Rows (Multiple Insurers)

```gherkin
Scenario: Add and remove insurer rows dynamically
  Given I have selected "Multiple" for Policy Placed Type
  And I have 1 insurer row (lead insurer)
  When I click "[+ Add Another Insurer]" button
  Then a 2nd insurer row should be added with all fields empty
  
  When I click "[+ Add Another Insurer]" button again
  Then a 3rd insurer row should be added
  And I should have 3 total insurer rows
  
  When I click "Remove" button on 3rd row
  Then the 3rd insurer row should be deleted
  And only 2 insurer rows should remain
  And premium share and brokerage totals should recalculate based on remaining insurers
```

---

### Scenario 30: Mandatory Field Validation

```gherkin
Scenario: Validate all required fields before saving
  Given I am in "Insurer Details" section
  When I do not select any value in "Policy Placed Type"
  And I try to save or navigate away
  Then system should display error "Policy Placed Type is required"
  And field should be highlighted
  
  When I select "Multiple" for "Policy Placed Type"
  But I do not select any value in "Select Lead Insurer"
  And I try to save or navigate away
  Then system should display error "Select Lead Insurer is required"
  And field should be highlighted
```

---

### Scenario 30: Read-only Calculated Fields

```gherkin
Scenario: Calculated fields should not be manually editable
  Given I am viewing an insurer row
  Then "Premium Share Amount" field should be read-only
  And I should not be able to click or type in "Premium Share Amount"
  And "Insurer Brokerage Amount" field should be read-only
  And I should not be able to click or type in "Insurer Brokerage Amount"
  
  When I change "Premium Share %" from 60% to 70%
  Then "Premium Share Amount" should automatically recalculate
  And new value should display without manual intervention
  
  When I change "Insurer Brokerage %" from 5% to 4%
  Then "Insurer Brokerage Amount" should automatically recalculate
  And new value should display without manual intervention
```

---

### Scenario 30: Data Persistence and Retrieval

```gherkin
Scenario: Save and retrieve insurer details correctly
  Given I have entered all insurer details:
    | Policy Placed Type | Multiple      |
    | Lead Insurer       | HDFC ERGO     |
  And I have entered share and brokerage for 2 insurers
  And all validations have passed
  When I click "Save" button
  Then system should save all data to database
  And success message should display "Insurer details saved successfully"
  
  When I navigate away from this activity
  And I return to "Meeting from Final Negotiation" activity
  And I open "Insurer Details" section
  Then all previously entered data should be displayed:
    - Policy Placed Type: "Multiple"
    - Lead Insurer: "HDFC ERGO"
    - All insurer rows with correct percentages and amounts
  And calculated fields should show correct values
  And I should be able to edit the data if needed
```

---

### Scenario 30: Edit Mode - Modify Existing Data

```gherkin
Scenario: Modify previously saved insurer details
  Given I have previously saved insurer details with:
    | Policy Placed Type | Multiple      |
    | Insurers Count     | 2             |
  When I return to "Insurer Details" section
  Then all data should be displayed correctly
  
  When I change "Policy Placed Type" from "Multiple" to "Single"
  Then system should display confirmation prompt:
    "Changing to Single will remove all co-insurers. Only the lead insurer will remain. Do you want to continue?"
  
  When I click "Yes" to confirm
  Then all co-insurer rows should be removed
  And only lead insurer should remain
  And Premium Share % should change to "100%"
  And Premium Share Amount should equal Basic Premium
  And I should be able to save the changes
```

---

### Scenario 30: Minimum Number of Insurers Validation

```gherkin
Scenario: Enforce minimum insurer count for Multiple type
  Given I have selected "Multiple" for Policy Placed Type
  When I have only 1 insurer in the sub-section
  And I try to save the form
  Then system should display error "Multiple insurer type requires at least 2 insurers. Please add another insurer or change Policy Placed Type to Single."
  And save should be blocked
  
  When I click "[+ Add Another Insurer]" button
  And I add a 2nd insurer with valid details
  And premium share totals 100%
  Then validation should pass
  And I should be able to save
```

---

### Scenario 30: Maximum Number of Insurers (If Applicable)

```gherkin
Scenario: Handle maximum insurer limit
  Given I have selected "Multiple" for Policy Placed Type
  And I have added 10 insurers (assuming 10 is the max limit)
  When I click "[+ Add Another Insurer]" button
  Then system should display message "Maximum 10 insurers allowed"
  And new row should not be added
  And existing 10 rows should remain unchanged
  
  # If no limit exists:
  # Then I should be able to add unlimited insurers
  # And form should be scrollable to view all rows
```

---

### Scenario 30: Duplicate Insurer Prevention

```gherkin
Scenario: Prevent same insurer from being added multiple times
  Given I have selected "HDFC ERGO" in row 1's Insurer Name
  When I try to select "HDFC ERGO" in row 2's Insurer Name dropdown
  Then "HDFC ERGO" should be disabled/grayed out in row 2's dropdown
  Or system should display error "HDFC ERGO is already added. Please select a different insurer."
  And selection should not be allowed
  
  When I select "ICICI Lombard" in row 2 instead
  Then selection should be accepted
  And no error should be displayed
```

---

### Scenario 30: Zero/Negative Values Validation

```gherkin
# Premium Share % - Zero NOT allowed
Scenario: Prevent zero value in Premium Share Percentage
  Given I am entering "Premium Share %" for an insurer
  When I enter "0" or "0%"
  Then system should display error "Premium Share % cannot be 0. Please enter a value greater than 0."
  And field should be highlighted in red
  And I should not be able to save
  
  When I enter a negative value like "-5"
  Then system should display error "Premium Share % cannot be negative. Please enter a positive value."
  And field should not accept the value
  And I should not be able to save

# Insurer Brokerage % - Zero IS allowed
Scenario: Allow zero value in Insurer Brokerage Percentage
  Given I am entering "Insurer Brokerage %" for an insurer
  When I enter "0" or "0%"
  Then system should accept the value
  And "Insurer Brokerage Amount" should calculate and display "₹0"
  And no error should be displayed
  And I should be able to save the form
  
  When I enter a negative value like "-2"
  Then system should display error "Insurer Brokerage % cannot be negative. Please enter a value of 0 or greater."
  And field should not accept the value
  And I should not be able to save

# Example: Valid zero brokerage case
Scenario: Record insurer with zero brokerage
  Given Basic Premium is "₹1,00,000"
  And I have selected "Single" for Policy Placed Type
  And Insurer 1 has Premium Share % of "100%"
  When I enter "0%" for Insurer 1's Brokerage %
  Then Insurer Brokerage Amount should display "₹0"
  And validation should pass
  And I should be able to save the record
```

---

### Scenario 30: Decimal Precision and Brokerage Amount Flexibility

```gherkin
# Decimal precision for percentages
Scenario: Handle decimal values in percentage fields
  Given I am entering "Premium Share %"
  When I enter "33.33"
  Then system should accept the value with 2 decimal places
  And calculation should use the exact decimal value "33.33"
  
  When I enter "33.333" (3 decimal places)
  Then system should either:
    - Round to 2 decimals and display "33.33"
    - Or display error "Maximum 2 decimal places allowed"
  And I should be prompted to correct the value

# Decimal precision validation example
Scenario: Distribute share with decimal precision
  Given I have 3 insurers
  When I enter Premium Share % as:
    | Insurer 1 | 33.33% |
    | Insurer 2 | 33.33% |
    | Insurer 3 | 33.34% |
  Then total should calculate as "100.00%"
  And validation should pass
  And I should be able to save

# Brokerage Amount - Can be less than, equal to, or greater than Total Brokerage
Scenario: Total brokerage matches exactly with total from previous steps
  Given Total Brokerage Amount from previous steps is "₹5,000"
  And I have 2 insurers with correct premium share percentages
  When Insurer 1 Brokerage Amount calculates to "₹3,000"
  And Insurer 2 Brokerage Amount calculates to "₹2,000"
  Then total insurer brokerage equals "₹5,000"
  And this matches Total Brokerage Amount "₹5,000"
  And no warning message should be displayed
  And I should be able to save

Scenario: Total brokerage is less than Total Brokerage Amount
  Given Total Brokerage Amount from previous steps is "₹5,000"
  And I have 2 insurers
  When Insurer 1 Brokerage Amount calculates to "₹2,000"
  And Insurer 2 Brokerage Amount calculates to "₹1,500"
  Then total insurer brokerage equals "₹3,500"
  And this is less than Total Brokerage Amount "₹5,000"
  And system should display informational message:
    "Note: Total insurer brokerage (₹3,500) is less than total brokerage (₹5,000). Difference: ₹1,500"
  But I should still be able to save (this is acceptable)
  And save should NOT be blocked

Scenario: Total brokerage is greater than Total Brokerage Amount
  Given Total Brokerage Amount from previous steps is "₹5,000"
  And I have 2 insurers
  When Insurer 1 Brokerage Amount calculates to "₹3,500"
  And Insurer 2 Brokerage Amount calculates to "₹2,500"
  Then total insurer brokerage equals "₹6,000"
  And this is greater than Total Brokerage Amount "₹5,000"
  And system should display informational message:
    "Note: Total insurer brokerage (₹6,000) is more than total brokerage (₹5,000). Difference: +₹1,000"
  But I should still be able to save (this is acceptable)
  And save should NOT be blocked

# Summary: Brokerage validation is informational only
Then regardless of whether total is less, equal, or greater than Total Brokerage
  System should only show informational message
  And should NOT block saving
  And user can proceed with any valid brokerage distribution
```

---

### Scenario 30: Insufficient Preferred Insurers in Broking Slip

```gherkin
Scenario: Handle missing Preferred Insurers from Broking Slip
  Given I navigate to "Meeting from Final Negotiation"
  But "Broking Slip Generation" has NO preferred insurers entered
  When I open "Insurer Details" section
  Then "Select Lead Insurer" dropdown should be empty
  And system should display warning message:
    "No Preferred Insurers found. Please add Preferred Insurers in Broking Slip Generation activity first."
  And dropdown should show empty state
  
Scenario: Handle single Preferred Insurer for Multiple type
  Given Broking Slip has only 1 preferred insurer "HDFC ERGO"
  When I select "Multiple" for Policy Placed Type
  And I select "HDFC ERGO" as Lead Insurer
  And I click "[+ Add Another Insurer]" button to add co-insurer
  Then Row 1 Insurer Name should show "HDFC ERGO" (pre-filled from lead insurer)
  And Row 2 Insurer Name dropdown should show:
    - Complete list of ALL active insurers from master data
    - Excluding "HDFC ERGO" (already selected as lead insurer)
  And system should display informational message:
    "Lead insurer selected from preferred list. Co-insurers can be selected from complete master insurer list."
```

---

### Scenario 30: Basic Premium or Total Brokerage Missing

```gherkin
Scenario: Handle missing Basic Premium from previous steps
  Given I navigate to "Insurer Details" section
  But "Basic Premium" was not entered in previous Final Negotiation steps
  When I try to add insurer details
  Then calculated fields "Premium Share Amount" should display "₹0" or "N/A"
  And system should display warning:
    "Basic Premium not found. Please complete previous steps first to enable accurate calculations."
  But I should still be able to enter percentages
  
Scenario: Handle missing Total Brokerage Amount
  Given "Total Brokerage Amount" was not entered in previous steps
  When I enter Insurer Brokerage % values
  Then "Insurer Brokerage Amount" should calculate based on Premium Share Amount
  But brokerage total validation should be skipped
  And system should display informational message:
    "Total Brokerage not available. Brokerage validation will be skipped."
```

---

### Scenario 30: Change Lead Insurer After Data Entry

```gherkin
Scenario: Update lead insurer after entering share details
  Given I have entered insurer details with "HDFC ERGO" as lead insurer
  And "HDFC ERGO" is in first row of sub-section
  And I have 2 additional co-insurers
  When I change "Select Lead Insurer" from "HDFC ERGO" to "ICICI Lombard"
  Then system should update first row's "Insurer Name" to "ICICI Lombard"
  And "ICICI Lombard" should be marked/highlighted as lead insurer
  And if "ICICI Lombard" was in another row, that row should be removed or reordered
  And I should be able to save with new lead insurer
```

---

### Scenario 30: Delete Last Remaining Insurer

```gherkin
Scenario: Prevent deletion of last insurer
  Given I have "Multiple" Policy Placed Type
  And I have exactly 2 insurers
  When I click "Remove" button on one insurer
  Then deletion should be allowed
  And 1 insurer should remain
  
  When I try to click "Remove" button on the last remaining insurer
  Then system should display error "At least 1 insurer is required. Cannot delete the last insurer."
  And deletion should not be allowed
  And the insurer row should remain
```

---

### Scenario 30: Percentage Exceeding 100%

```gherkin
Scenario: Validate when premium share exceeds 100%
  Given I have 2 insurers
  When I enter "60%" for Insurer 1's Premium Share %
  And I enter "50%" for Insurer 2's Premium Share %
  Then total shows "110%"
  And system should display real-time error:
    "Total exceeds 100%. Current total: 110%. Please adjust the percentages."
  And total should be highlighted in red
  And save button should be disabled
  
  When I change Insurer 2's Premium Share % to "40%"
  Then total shows "100%"
  And error message should disappear
  And save button should be enabled
```

---

### Scenario 30: Access Control / Permissions

```gherkin
Scenario: Read-only access for Viewer role
  Given I am logged in with "Viewer" role
  When I navigate to "Meeting from Final Negotiation"
  And I open "Insurer Details" section
  Then all fields should be read-only
  And I should not see "[+ Add Another Insurer]" button
  And I should not see "Remove" buttons
  And "Save" button should be hidden or disabled
  And I should only be able to view the data

Scenario: Full edit access for Broker/Account Manager roles
  Given I am logged in with "Broker" or "Account Manager" role
  When I navigate to "Meeting from Final Negotiation"
  And I open "Insurer Details" section
  Then all editable fields should be enabled
  And I should see "[+ Add Another Insurer]" button
  And I should see "Remove" buttons on rows
  And I should be able to edit any field
  And I should be able to save changes
```

---

### Scenario 30: Audit Trail / History

```gherkin
Scenario: Maintain audit trail of changes
  Given I have saved insurer details with:
    | Insurer      | Premium Share % | Brokerage % |
    | HDFC ERGO    | 60%             | 5%          |
    | ICICI Lombard| 40%             | 5%          |
  And I am logged in as "John Doe" (user_id: 123)
  
  When I modify HDFC ERGO's Premium Share % from "60%" to "70%"
  And I modify ICICI Lombard's Premium Share % from "40%" to "30%"
  And I save the changes at "2025-11-07 14:30:00"
  
  Then system should log the changes in audit_history_log table:
    | Field              | Old Value | New Value | Changed By | Changed At          |
    | Premium Share %    | 60%       | 70%       | John Doe   | 2025-11-07 14:30:00 |
    | Premium Share %    | 40%       | 30%       | John Doe   | 2025-11-07 14:30:00 |
  
  And when I view audit history
  Then I should see who changed what and when
  And I should be able to track all modifications
```

---

## Field Specifications

### Main Section Fields

> **⚙️ Development Note:**  
> **Lead Insurer**: Dropdown populated from Preferred Insurers (entered in Broking Slip Generation activity)  
> **Co-insurers**: Dropdown populated from ALL active insurers in master data (not limited to preferred list)

| # | Field Name | Type | Options/Values | Required | Validation Rules |
|---|------------|------|----------------|----------|------------------|
| 1 | **Policy Placed Type** | Dropdown | • Single<br>• Multiple | Yes | Must select one option |
| 2 | **Select Lead Insurer** | Dropdown | List from Broking Slip's **Preferred Insurers** only | Yes | Mandatory - must select one insurer from preferred list |

---

### Sub-Section: Insurers Share % and Brokerage % Details
*(Multiple entries - one row per insurer)*

| # | Field Name | Type | Behavior | Calculation/Rules |
|---|------------|------|----------|-------------------|
| 3.1 | **Insurer Name** | Dropdown | **Smart Data Source**:<br>• **Lead Insurer (Row 1)**: From Preferred Insurers only<br>• **Co-insurers (Row 2+)**: From ALL active insurers master list<br>• **2-way binding** with "Select Lead Insurer" (#2)<br>• If #2 has value → auto-fill Row 1 here<br>• If Row 1 filled first & #2 empty → auto-fill #2<br>• Prevent duplicate selection across all rows | Required for each row |
| 3.2 | **Premium Share Percentage** | Number (%) | **Single Insurer**: Display 100% (read-only)<br>**Multiple Insurers**: User input | • Cannot be 0%<br>• Cannot be negative<br>• Up to 2 decimal places<br>• Total of all rows = 100% |
| 3.3 | **Premium Share Amount** | Number (₹) | **Auto-calculated** (read-only)<br>Updates when #3.2 changes | **Formula**:<br>Single: = Basic Premium<br>Multiple: = Basic Premium × (Premium Share % ÷ 100) |
| 3.4 | **Insurer Brokerage %** | Number (%) | Manual entry<br>Editable for both Single and Multiple insurers | • Can be 0%<br>• Cannot be negative<br>• Up to 2 decimal places |
| 3.5 | **Insurer Brokerage Amount** | Number (₹) | **Auto-calculated** (read-only)<br>Updates when #3.3 or #3.4 changes | **Formula**: = Premium Share Amount × (Insurer Brokerage % ÷ 100)<br>**Validation**: Total can be less than, equal to, or greater than Total Brokerage (informational only) |

---

### Calculated/Display Fields

| Field | Formula | Display Format |
|-------|---------|----------------|
| Total Premium Share % | SUM(all Premium Share %) | XX.XX% |
| Total Premium Share Amount | SUM(all Premium Share Amount) | ₹X,XX,XXX.XX |
| Total Insurer Brokerage Amount | SUM(all Insurer Brokerage Amount) | ₹X,XX,XXX.XX |

---

## Database Schema

### Existing Tables

#### 1. `brokingslip_version_preferred_insurer_detail`
**Purpose**: Store Preferred Insurers from RFP/Broking Slip

```sql
CREATE TABLE brokingslip_version_preferred_insurer_detail (
  id SERIAL PRIMARY KEY,
  opportunity_id INT NOT NULL,
  insurer_id INT NOT NULL,
  location_id INT NOT NULL,
  branch_id INT NOT NULL,
  contact_id INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (insurer_id) REFERENCES insurer(id),
  FOREIGN KEY (contact_id) REFERENCES contact(id)
);
```

#### 2. `opportunity_final_negotiation_sharing_detail`
**Purpose**: Store Insurer Share and Brokerage details

**Existing Columns**:
```sql
CREATE TABLE opportunity_final_negotiation_sharing_detail (
  id SERIAL PRIMARY KEY,
  opportunity_final_negotiation_id INT NOT NULL,
  insurer_id INT NOT NULL,
  share_percentage NUMERIC(5,2),
  brokerage_percentage NUMERIC(5,2),
  brokerage_amount NUMERIC(19,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (opportunity_final_negotiation_id) REFERENCES opportunity_final_negotiation(id),
  FOREIGN KEY (insurer_id) REFERENCES insurer(id)
);
```

**Columns to be Added** (if not exists):
```sql
ALTER TABLE opportunity_final_negotiation_sharing_detail
ADD COLUMN share_amount NUMERIC(19,2);
```

#### 3. `opportunity_final_negotiation`
**Purpose**: Main Final Negotiation record

**Columns to be Added**:
```sql
ALTER TABLE opportunity_final_negotiation
ADD COLUMN policy_placed_type VARCHAR(50),
ADD COLUMN lead_insurer_id INT,
ADD COLUMN only_lead_pays_brokerage BOOLEAN,
ADD CONSTRAINT fk_lead_insurer FOREIGN KEY (lead_insurer_id) REFERENCES insurer(id);
```

---

### Entity Relationships

```
opportunity_final_negotiation
    ├── policy_placed_type (Single/Multiple)
    ├── lead_insurer_id → insurer(id)
    └── only_lead_pays_brokerage (Yes/No)
    │
    └── Has Many: opportunity_final_negotiation_sharing_detail
            ├── insurer_id → insurer(id)
            ├── share_percentage
            ├── share_amount (to be added)
            ├── brokerage_percentage
            └── brokerage_amount
```

---

## Acceptance Criteria

### Part 1: Auto-populate Preferred Insurers

```gherkin
Acceptance Criteria:
  ☐ Preferred Insurers from RFP Details Entry are retrieved correctly
  ☐ Data pre-populates in Broking Slip Generation "Preferred Insurers" section
  ☐ All fields (Insurer Name, Location, Branch, Contact) pre-fill correctly
  ☐ Pre-populated data is editable
  ☐ User can add more insurers beyond pre-filled list
  ☐ User can delete pre-filled insurers
  ☐ Changes in Broking Slip do not affect original RFP data
  ☐ Empty Preferred Insurers in RFP shows empty section in Broking Slip
  ☐ Multiple insurer entries are supported
```

### Part 2: Insurer Share and Brokerage Details

```gherkin
Acceptance Criteria:
  ☐ User can select Policy Placed Type (Single/Multiple) - mandatory
  ☐ User must select a Lead Insurer from Preferred Insurers list - mandatory
  ☐ Lead Insurer dropdown shows ONLY Preferred Insurers from Broking Slip
  ☐ Co-insurer dropdowns show ALL active insurers from master data
  ☐ Lead insurer auto-populates in sub-section insurer list
  ☐ Two-way binding works between Lead Insurer and first row Insurer Name
  ☐ Premium share percentages must total exactly 100% for validation to pass
  ☐ Premium share amounts auto-calculate correctly based on Basic Premium
  ☐ Insurer brokerage amounts auto-calculate correctly
  ☐ Total brokerage validation is informational only (can be less, equal, or greater)
  ☐ User can add/remove insurer rows for multiple insurers
  ☐ Minimum 2 insurers required when "Multiple" type is selected
  ☐ Duplicate insurer selection is prevented across all rows
  ☐ Zero value is allowed in Insurer Brokerage % but not in Premium Share %
  ☐ Negative values are not allowed in any percentage field
  ☐ Decimal precision up to 2 places is supported
  ☐ All validations display user-friendly error messages
  ☐ Read-only calculated fields cannot be manually edited
  ☐ Data persists correctly in database
  ☐ Audit trail is maintained for all changes
  ☐ Access control is enforced based on user roles
  ☐ For single insurer, brokerage % is always editable (no default value)
  ☐ Warning messages displayed when Basic Premium or Total Brokerage is missing
```

---

## Out of Scope

The following items are explicitly **not included** in this requirement:

1. ❌ Display of insurer details in Policy Details page (future enhancement)
2. ❌ Re-insurance scenarios and calculations
3. ❌ Multi-year policy handling
4. ❌ Integration with external insurer systems
5. ❌ Mobile-specific UI optimizations
6. ❌ Bulk update functionality for brokerage percentages
7. ❌ Copy from previous opportunity feature
8. ❌ Auto-save / draft functionality
9. ❌ Advanced currency formatting and rounding controls
10. ❌ Keyboard navigation enhancements
11. ❌ Concurrent user edit conflict resolution
12. ❌ Export to Excel functionality for insurer details

---

## Appendix

### A. Data Flow Diagram

```
RFP Details Entry
    ↓ (Store)
brokingslip_version_preferred_insurer_detail
    ↓ (Retrieve & Pre-populate)
Broking Slip Generation - Preferred Insurers
    ↓ (User can edit/add/delete)
Save to brokingslip_version_preferred_insurer_detail
    ↓ (Retrieve for dropdown)
Final Negotiation - Insurer Details
    ↓ (Select & Calculate)
opportunity_final_negotiation (main fields)
opportunity_final_negotiation_sharing_detail (share details)
```

---

### B. Sample Data

#### Preferred Insurers (from Broking Slip)
```json
[
  {
    "insurerId": 101,
    "insurerName": "HDFC ERGO",
    "locationId": 1,
    "location": "Mumbai",
    "branchId": 10,
    "branch": "Andheri",
    "contactId": 1001,
    "contact": "John Doe"
  },
  {
    "insurerId": 102,
    "insurerName": "ICICI Lombard",
    "locationId": 2,
    "location": "Delhi",
    "branchId": 20,
    "branch": "Connaught Place",
    "contactId": 1002,
    "contact": "Sarah Smith"
  }
]
```

#### Insurer Share Details (Final Negotiation)
```json
{
  "policyPlacedType": "Multiple",
  "leadInsurerId": 101,
  "onlyLeadPaysBrokerage": false,
  "basicPremium": 100000,
  "totalBrokerage": 5000,
  "insurerDetails": [
    {
      "insurerId": 101,
      "insurerName": "HDFC ERGO",
      "premiumSharePercentage": 60.00,
      "premiumShareAmount": 60000.00,
      "insurerBrokeragePercentage": 5.00,
      "insurerBrokerageAmount": 3000.00
    },
    {
      "insurerId": 102,
      "insurerName": "ICICI Lombard",
      "premiumSharePercentage": 40.00,
      "premiumShareAmount": 40000.00,
      "insurerBrokeragePercentage": 5.00,
      "insurerBrokerageAmount": 2000.00
    }
  ]
}
```

---

### C. UI Mockup

> **🎨 UI Design Note:**  
> **Lead Insurer dropdown**: Populated from Preferred Insurers only (e.g., "HDFC ERGO", "ICICI Lombard")  
> **Co-insurer dropdowns**: Populated from ALL active insurers in master data (broader list)

```
┌─────────────────────────────────────────────────────────────────┐
│ Meeting from Final Negotiation > Insurer Details               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Policy Placed Type: [Dropdown: Single / Multiple] *             │
│                                                                  │
│ Select Lead Insurer: [Dropdown: HDFC ERGO ▼] *                  │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Sub-Section: Insurers Share % and Brokerage % Details      │ │
│ ├─────────────────────────────────────────────────────────────┤ │
│ │                                                             │ │
│ │ Row 1:                                                      │ │
│ │  Insurer Name: [HDFC ERGO ▼] *                            │ │
│ │  Premium Share %: [60.00]% *                               │ │
│ │  Premium Share Amount: ₹60,000.00 (calculated)             │ │
│ │  Insurer Brokerage %: [5.00]% *                            │ │
│ │  Insurer Brokerage Amount: ₹3,000.00 (calculated)          │ │
│ │  [Remove]                                                   │ │
│ │                                                             │ │
│ │ Row 2:                                                      │ │
│ │  Insurer Name: [ICICI Lombard ▼] *                        │ │
│ │  Premium Share %: [40.00]% *                               │ │
│ │  Premium Share Amount: ₹40,000.00 (calculated)             │ │
│ │  Insurer Brokerage %: [5.00]% *                            │ │
│ │  Insurer Brokerage Amount: ₹2,000.00 (calculated)          │ │
│ │  [Remove]                                                   │ │
│ │                                                             │ │
│ │ [+ Add Another Insurer]                                     │ │
│ │                                                             │ │
│ │ ─────────────────────────────────────────────────────────  │ │
│ │ Total Premium Share: 100.00% ✓                             │ │
│ │ Total Premium Share Amount: ₹1,00,000.00                   │ │
│ │ Total Brokerage Amount: ₹5,000.00 ✓                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│                                   [Cancel]  [Save]              │
└─────────────────────────────────────────────────────────────────┘

Legend:
* = Required field
(calculated) = Auto-calculated, read-only
✓ = Validation passed
```

---

### D. Error Messages

| Scenario | Error Message |
|----------|---------------|
| Policy Placed Type not selected | "Policy Placed Type is required" |
| Lead Insurer not selected | "Select Lead Insurer is required" |
| Premium Share % = 0 | "Premium Share % cannot be 0. Please enter a value greater than 0." |
| Premium Share % negative | "Premium Share % cannot be negative. Please enter a positive value." |
| Brokerage % negative | "Insurer Brokerage % cannot be negative. Please enter a value of 0 or greater." |
| Total Premium Share ≠ 100% | "Total premium share percentage must equal 100%. Current total: XX%" |
| Total Premium Share > 100% | "Total exceeds 100%. Current total: XXX%. Please adjust the percentages." |
| Multiple type with 1 insurer | "Multiple insurer type requires at least 2 insurers. Please add another insurer or change Policy Placed Type to Single." |
| Duplicate insurer | "XXXX is already added. Please select a different insurer." |
| Maximum insurers reached | "Maximum 10 insurers allowed" |
| Delete last insurer | "At least 1 insurer is required. Cannot delete the last insurer." |
| More than 2 decimal places | "Maximum 2 decimal places allowed" |
| No Preferred Insurers | "No Preferred Insurers found. Please add Preferred Insurers in Broking Slip Generation activity first." |
| Missing Basic Premium | "Basic Premium not found. Please complete previous steps first to enable accurate calculations." |

---

### E. Informational Messages

| Scenario | Informational Message |
|----------|----------------------|
| Total brokerage < Total Brokerage | "Note: Total insurer brokerage (₹X,XXX) is less than total brokerage (₹X,XXX). Difference: ₹X,XXX" |
| Total brokerage > Total Brokerage | "Note: Total insurer brokerage (₹X,XXX) is more than total brokerage (₹X,XXX). Difference: +₹X,XXX" |
| Only 1 Preferred Insurer for Multiple | "Lead insurer selected from preferred list. Co-insurers can be selected from complete master insurer list." |
| Missing Total Brokerage | "Total Brokerage not available. Brokerage validation will be skipped." |
| Change to Single from Multiple | "Changing to Single will remove all co-insurers. Only the lead insurer will remain. Do you want to continue?" |

---

### F. Test Data Scenarios

> **💡 Important for QA Teams:**  
> All insurer names (HDFC ERGO, ICICI Lombard, Star Health, etc.), locations, contact names, and financial amounts used below are **sample data for testing purposes only**. Replace with your actual test data or production master lists during implementation.

#### Scenario 1: Single Insurer - Custom Brokerage
```
Input:
- Policy Placed Type: Single
- Lead Insurer: HDFC ERGO
- Basic Premium: ₹1,00,000
- Total Brokerage: ₹5,000

Expected Output:
- Insurer: HDFC ERGO
- Premium Share %: 100%
- Premium Share Amount: ₹1,00,000
- Brokerage %: 5.0% (user entered)
- Brokerage Amount: ₹5,000
```

#### Scenario 2: Multiple Insurers - Equal Share
```
Input:
- Policy Placed Type: Multiple
- Lead Insurer: HDFC ERGO
- Basic Premium: ₹1,00,000
- Total Brokerage: ₹5,000

Insurer 1 (HDFC ERGO):
- Premium Share %: 50%
- Brokerage %: 5%

Insurer 2 (ICICI Lombard):
- Premium Share %: 50%
- Brokerage %: 5%

Expected Output:
Insurer 1:
- Premium Share Amount: ₹50,000
- Brokerage Amount: ₹2,500

Insurer 2:
- Premium Share Amount: ₹50,000
- Brokerage Amount: ₹2,500

Total: ₹5,000 (matches)
```

#### Scenario 3: Multiple Insurers - Unequal Share with Decimals
```
Input:
- Basic Premium: ₹1,00,000
- Total Brokerage: ₹5,000

Insurer 1: 33.33%, Brokerage 5%
Insurer 2: 33.33%, Brokerage 5%
Insurer 3: 33.34%, Brokerage 5%

Expected Output:
Insurer 1: ₹33,330.00 share, ₹1,666.50 brokerage
Insurer 2: ₹33,330.00 share, ₹1,666.50 brokerage
Insurer 3: ₹33,340.00 share, ₹1,667.00 brokerage
Total: ₹1,00,000 share, ₹5,000 brokerage
```

---

### G. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-07 | Nithin | Initial draft with complete Gherkin scenarios |

---

**Document Status**: ✅ Ready for Review  
**Next Steps**: 
1. Review by stakeholders
2. Technical validation of database schema
3. UI/UX design approval
4. Development estimation
5. QA test plan creation

---

**END OF DOCUMENT**
