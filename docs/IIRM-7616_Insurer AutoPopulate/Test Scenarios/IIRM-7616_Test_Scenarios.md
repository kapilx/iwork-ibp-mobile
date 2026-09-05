# Test Scenarios: IIRM-7616 - Record Insurer and Co-Insurer Details

**Jira Ticket**: IIRM-7616  
**Requirements Doc**: [IIRM-7616_Story_Record Insurer and Co-Insurer Details.md](./IIRM-7616_Story_Record%20Insurer%20and%20Co-Insurer%20Details.md)  
**Date Created**: November 8, 2025  
**Created By**: Nithin  
**Status**: Ready for QA  

---

## Table of Contents

1. [Overview](#overview)
2. [Test Environment Setup](#test-environment-setup)
3. [Test Data Requirements](#test-data-requirements)
4. [Part 1: Auto-populate Test Scenarios](#part-1-auto-populate-test-scenarios)
5. [Part 2: Regression Test Scenarios](#part-2-regression-test-scenarios)
6. [Test Execution Checklist](#test-execution-checklist)
7. [Bug Reporting Template](#bug-reporting-template)

---

## Overview

This document contains test scenarios for IIRM-7616, divided into two parts:

- **Part 1**: Functional test scenarios for Auto-populate Preferred Insurers feature (Scenarios 1-5)
- **Part 2**: Regression test scenarios for Insurer Share and Brokerage Details section

---

## Test Environment Setup

### Prerequisites

- [ ] Access to UAT environment
- [ ] Valid broker user credentials
- [ ] Sample opportunity data available
- [ ] Database access for verification (if needed)
- [ ] Browser: Chrome (latest version)

### Test Data Setup

Before starting tests, ensure:
1. At least 5 insurer master records exist
2. At least 3 RFP activities with different insurer configurations
3. Opportunities in various stages (Planning, RFP, Broking Slip, Final Negotiation)
4. User has appropriate permissions

---

## Test Data Requirements

### Master Data Required

#### Insurers
| Insurer ID | Insurer Name | Locations | Branches | Contacts |
|------------|--------------|-----------|----------|----------|
| 101 | HDFC ERGO | Mumbai, Pune, Delhi | 3 branches per location | Min 2 contacts |
| 102 | ICICI Lombard | Mumbai, Delhi, Bangalore | 3 branches per location | Min 2 contacts |
| 103 | Star Health | Chennai, Mumbai, Hyderabad | 2 branches per location | Min 2 contacts |
| 104 | Bajaj Allianz | Pune, Mumbai, Delhi | 3 branches per location | Min 2 contacts |
| 105 | Reliance General | Mumbai, Delhi, Bangalore | 2 branches per location | Min 2 contacts |

#### Opportunities
| Opportunity ID | Client | Stage | RFP Status | Broking Slip Status |
|----------------|--------|-------|------------|---------------------|
| OPP-001 | Client A | RFP | Completed with 3 insurers | Not Started |
| OPP-002 | Client B | RFP | Completed with 0 insurers | Not Started |
| OPP-003 | Client C | Broking Slip | Completed with 2 insurers | In Progress |
| OPP-004 | Client D | Final Negotiation | Completed | Completed |

---

## Part 1: Auto-populate Test Scenarios

### Test Coverage: Scenarios 1-5 from Requirements Document

---

### Test Scenario 1: Data Pre-population from RFP to Broking Slip

**Objective**: Verify that Preferred Insurers entered in RFP Details Entry activity are automatically pre-populated in Broking Slip Generation activity.

**Priority**: High  
**Type**: Functional  
**Requirement Ref**: Scenario 1  

#### Test Case 1.1: Pre-populate with 3 Insurers

**Pre-conditions**:
- Logged in as broker user
- Opportunity OPP-001 is at RFP stage
- RFP Details Entry activity is completed

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Navigate to Opportunity OPP-001 | Opportunity details page opens | | |
| 2 | Open "RFP Details Entry" activity | Activity form opens | | |
| 3 | In "Preferred Insurers" section, add 3 insurers:<br>1. HDFC ERGO - Mumbai - Andheri - John Doe<br>2. ICICI Lombard - Delhi - CP - Sarah Smith<br>3. Star Health - Chennai - T Nagar - Kumar Raj | All 3 insurers are added successfully | | |
| 4 | Save and complete the RFP activity | Activity marked as complete | | |
| 5 | Navigate to "Broking Slip Generation" activity | Activity form opens | | |
| 6 | Open "Preferred Insurers" section | Section expands | | |
| 7 | Verify all 3 insurers are pre-populated | **Expected**:<br>Row 1: HDFC ERGO - Mumbai - Andheri - John Doe<br>Row 2: ICICI Lombard - Delhi - CP - Sarah Smith<br>Row 3: Star Health - Chennai - T Nagar - Kumar Raj | | |
| 8 | Verify all fields are editable | All dropdowns and fields can be clicked and modified | | |
| 9 | Verify field values match exactly | Insurer Name, Location, Branch, Contact match RFP data | | |

**Post-conditions**:
- Insurers are pre-populated but not yet saved in Broking Slip
- Original RFP data remains unchanged

**Test Data**:
```json
{
  "opportunityId": "OPP-001",
  "rfpInsurers": [
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
      "branch": "CP",
      "contactId": 1002,
      "contact": "Sarah Smith"
    },
    {
      "insurerId": 103,
      "insurerName": "Star Health",
      "locationId": 3,
      "location": "Chennai",
      "branchId": 30,
      "branch": "T Nagar",
      "contactId": 1003,
      "contact": "Kumar Raj"
    }
  ]
}
```

---

#### Test Case 1.2: Pre-populate with Single Insurer

**Pre-conditions**:
- New opportunity OPP-005 created
- RFP completed with 1 insurer only

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Complete RFP with 1 insurer: Bajaj Allianz - Pune - Kothrud - Priya Singh | RFP saved with 1 insurer | | |
| 2 | Navigate to Broking Slip Generation | Activity opens | | |
| 3 | Open "Preferred Insurers" section | Section expands | | |
| 4 | Verify 1 insurer is pre-populated | Bajaj Allianz - Pune - Kothrud - Priya Singh displayed | | |
| 5 | Verify "[+ Add Another Insurer]" button is visible | Button is present and clickable | | |

---

#### Test Case 1.3: Pre-populate with Maximum Insurers (if limit exists)

**Objective**: Test behavior when RFP has maximum allowed insurers

**Pre-conditions**:
- RFP completed with 10 insurers (assuming 10 is max)

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Complete RFP with 10 different insurers | All 10 insurers saved | | |
| 2 | Navigate to Broking Slip Generation | Activity opens | | |
| 3 | Open "Preferred Insurers" section | Section expands | | |
| 4 | Verify all 10 insurers are pre-populated | All 10 rows display with correct data | | |
| 5 | Verify form is scrollable if needed | Can scroll to see all insurers | | |

---

### Test Scenario 2: Edit Pre-populated Insurer Data

**Objective**: Verify that pre-populated insurer data can be edited and saved, without affecting original RFP data.

**Priority**: High  
**Type**: Functional  
**Requirement Ref**: Scenario 2  

#### Test Case 2.1: Modify All Fields of Pre-populated Insurer

**Pre-conditions**:
- Broking Slip has pre-populated insurers from RFP
- First insurer: HDFC ERGO - Mumbai - Andheri - John Doe

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Open Broking Slip Generation activity | Pre-populated insurers visible | | |
| 2 | Click on first row's "Insurer Name" dropdown | Dropdown opens with all insurers | | |
| 3 | Change from "HDFC ERGO" to "Bajaj Allianz" | Selection changes, dropdown closes | | |
| 4 | Click on "Location" dropdown | Dropdown shows locations for Bajaj Allianz | | |
| 5 | Change from "Mumbai" to "Pune" | Location updated | | |
| 6 | Click on "Branch" dropdown | Dropdown shows branches for Pune | | |
| 7 | Change from "Andheri" to "Kothrud" | Branch updated | | |
| 8 | Click on "Contact" dropdown | Dropdown shows contacts for Bajaj Allianz - Pune | | |
| 9 | Change from "John Doe" to "Priya Singh" | Contact updated | | |
| 10 | Verify all changes are reflected | First row shows: Bajaj Allianz - Pune - Kothrud - Priya Singh | | |
| 11 | Click "Save" button | Data saved successfully, success message displayed | | |
| 12 | Navigate back to RFP Details Entry | RFP activity opens | | |
| 13 | Open "Preferred Insurers" section | Section expands | | |
| 14 | Verify original data is unchanged | First insurer still shows: HDFC ERGO - Mumbai - Andheri - John Doe | | |

**Post-conditions**:
- Broking Slip has updated insurer data
- RFP data remains original

---

#### Test Case 2.2: Modify Only Some Fields

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Open pre-populated insurer row | Row is editable | | |
| 2 | Change only "Contact" from "John Doe" to "Mike Johnson" | Contact updated | | |
| 3 | Leave other fields unchanged | Insurer, Location, Branch remain same | | |
| 4 | Save the Broking Slip | Data saved with partial changes | | |
| 5 | Refresh page or re-open activity | Changes persist, other fields unchanged | | |

---

#### Test Case 2.3: Edit Multiple Pre-populated Insurers

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Pre-populated with 3 insurers | All 3 visible | | |
| 2 | Modify first insurer's contact | Change saved | | |
| 3 | Modify second insurer's branch | Change saved | | |
| 4 | Modify third insurer's location | Change saved | | |
| 5 | Save all changes | All modifications persisted | | |
| 6 | Verify each insurer has correct updated data | All 3 insurers show modified values | | |

---

### Test Scenario 3: Add More Insurers to Pre-populated List

**Objective**: Verify user can add additional insurers beyond those pre-populated from RFP.

**Priority**: High  
**Type**: Functional  
**Requirement Ref**: Scenario 3  

#### Test Case 3.1: Add One Additional Insurer

**Pre-conditions**:
- 2 insurers pre-populated from RFP

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Open Broking Slip Generation | 2 pre-populated insurers visible | | |
| 2 | Verify total insurer count | Display shows "2 insurers" | | |
| 3 | Click "[+ Add Another Insurer]" button | Button is clickable | | |
| 4 | Verify new blank row is added | 3rd row appears with empty fields | | |
| 5 | Fill in new insurer details:<br>Reliance General - Mumbai - BKC - Amit Sharma | All fields accept input | | |
| 6 | Verify total count updated | Display shows "3 insurers" | | |
| 7 | Save the Broking Slip | Data saved with 3 insurers | | |
| 8 | Re-open activity | All 3 insurers display (2 original + 1 new) | | |

---

#### Test Case 3.2: Add Multiple Additional Insurers

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Start with 2 pre-populated insurers | 2 insurers visible | | |
| 2 | Click "[+ Add Another Insurer]" | 3rd blank row added | | |
| 3 | Fill 3rd insurer details | Data entered | | |
| 4 | Click "[+ Add Another Insurer]" again | 4th blank row added | | |
| 5 | Fill 4th insurer details | Data entered | | |
| 6 | Click "[+ Add Another Insurer]" again | 5th blank row added | | |
| 7 | Fill 5th insurer details | Data entered | | |
| 8 | Verify total count | Display shows "5 insurers" | | |
| 9 | Save and verify | All 5 insurers persisted | | |

---

#### Test Case 3.3: Add Insurer Then Remove It

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Pre-populated with 2 insurers | 2 insurers visible | | |
| 2 | Click "[+ Add Another Insurer]" | 3rd row added | | |
| 3 | Fill 3rd insurer details | Data entered | | |
| 4 | Click "Remove" button on 3rd row | 3rd row removed | | |
| 5 | Verify count | Display shows "2 insurers" | | |
| 6 | Verify original 2 insurers remain | Pre-populated insurers unchanged | | |

---

### Test Scenario 4: Delete Pre-populated Insurer

**Objective**: Verify that pre-populated insurers can be removed from Broking Slip without affecting RFP data.

**Priority**: High  
**Type**: Functional  
**Requirement Ref**: Scenario 4  

#### Test Case 4.1: Delete Middle Insurer from Pre-populated List

**Pre-conditions**:
- 3 insurers pre-populated from RFP

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Open Broking Slip with 3 pre-populated insurers | All 3 insurers visible | | |
| 2 | Identify 2nd insurer (ICICI Lombard) | Row 2 shows ICICI Lombard | | |
| 3 | Click "Remove" button on 2nd row | Confirmation dialog may appear (optional) | | |
| 4 | Confirm removal | 2nd row is removed | | |
| 5 | Verify remaining insurers | Only rows 1 (HDFC ERGO) and 3 (Star Health) remain | | |
| 6 | Verify row order | Star Health moves to row 2 position | | |
| 7 | Verify total count | Display shows "2 insurers" | | |
| 8 | Save the Broking Slip | Data saved with 2 insurers | | |
| 9 | Navigate to RFP Details Entry | RFP opens | | |
| 10 | Verify RFP still has 3 insurers | All original 3 insurers present in RFP | | |

---

#### Test Case 4.2: Delete First Insurer

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Pre-populated with 3 insurers | All visible | | |
| 2 | Click "Remove" on first row (HDFC ERGO) | Row removed | | |
| 3 | Verify remaining insurers | ICICI Lombard and Star Health remain | | |
| 4 | Verify ICICI Lombard is now first row | Order updated | | |
| 5 | Save and verify persistence | 2 insurers saved | | |

---

#### Test Case 4.3: Delete Last Insurer

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Pre-populated with 3 insurers | All visible | | |
| 2 | Click "Remove" on last row (Star Health) | Row removed | | |
| 3 | Verify 2 insurers remain | HDFC ERGO and ICICI Lombard remain | | |
| 4 | Save and verify | 2 insurers persisted | | |

---

#### Test Case 4.4: Delete All Pre-populated Insurers

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Pre-populated with 3 insurers | All visible | | |
| 2 | Remove first insurer | 2 remain | | |
| 3 | Remove second insurer (now first) | 1 remains | | |
| 4 | Remove last insurer | Section becomes empty or shows blank row | | |
| 5 | Verify "[+ Add Insurer]" button visible | Button available to add manually | | |
| 6 | Save empty state | Broking Slip saved with 0 insurers | | |
| 7 | Verify RFP unchanged | RFP still has original 3 insurers | | |

---

### Test Scenario 5: No Insurers in RFP

**Objective**: Verify behavior when RFP has no Preferred Insurers entered, and Broking Slip section is empty.

**Priority**: High  
**Type**: Functional  
**Requirement Ref**: Scenario 5  

#### Test Case 5.1: Empty RFP - Empty Broking Slip

**Pre-conditions**:
- New opportunity OPP-002
- RFP completed with 0 Preferred Insurers

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Create and complete RFP activity | RFP marked complete | | |
| 2 | In RFP, leave "Preferred Insurers" section empty | No insurers added | | |
| 3 | Save and complete RFP | Activity completed with 0 insurers | | |
| 4 | Navigate to Broking Slip Generation | Activity opens | | |
| 5 | Open "Preferred Insurers" section | Section expands | | |
| 6 | Verify section is empty | No insurer rows visible | | |
| 7 | Verify helpful message displayed | Message: "No preferred insurers from RFP. You can add manually." (or similar) | | |
| 8 | Verify "[+ Add Insurer]" button is visible | Button present and clickable | | |
| 9 | Click "[+ Add Insurer]" button | Blank insurer row appears | | |
| 10 | Fill in insurer details manually | All fields accept input | | |
| 11 | Save Broking Slip | Data saved with manually added insurer | | |

---

#### Test Case 5.2: Empty RFP - Add Multiple Insurers Manually

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Open Broking Slip with empty Preferred Insurers | Section is empty | | |
| 2 | Add first insurer manually | Row 1 filled | | |
| 3 | Click "[+ Add Insurer]" | Row 2 added | | |
| 4 | Add second insurer | Row 2 filled | | |
| 5 | Add third insurer | Row 3 filled | | |
| 6 | Save with 3 manually added insurers | All 3 saved successfully | | |
| 7 | Re-open activity | All 3 insurers display | | |

---

#### Test Case 5.3: RFP Not Completed - Broking Slip Behavior

**Objective**: Verify behavior when RFP activity is not yet completed

**Pre-conditions**:
- Opportunity at RFP stage
- RFP activity NOT completed

**Test Steps**:

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Try to navigate to Broking Slip Generation | **Option A**: Activity locked/disabled<br>**Option B**: Activity opens but shows warning | | |
| 2 | If activity opens, check "Preferred Insurers" | Section empty or shows warning: "RFP not completed" | | |
| 3 | Verify user cannot proceed | Save button disabled or validation prevents saving | | |

---

## Part 2: Regression Test Scenarios

### Regression Testing for Insurer Share and Brokerage Details

**Objective**: Ensure that the new "Insurer Details" section in Final Negotiation does not break existing functionality and integrates properly with the system.

**Scope**: Regression testing focuses on:
1. Existing Final Negotiation functionality
2. Data integrity across activities
3. Integration with Policy creation
4. Reporting and exports
5. User permissions
6. Performance

---

### Regression Test Suite

---

### RT-01: Existing Final Negotiation Fields

**Objective**: Verify existing fields in Final Negotiation continue to work after adding new Insurer Details section.

**Priority**: High  
**Type**: Regression  

#### Test Case RT-01.1: Basic Premium Field

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Open Final Negotiation activity | Activity loads | | |
| 2 | Locate "Basic Premium" field | Field visible and editable | | |
| 3 | Enter value: ₹1,00,000 | Value accepted | | |
| 4 | Save activity | Data saved | | |
| 5 | Re-open and verify | Basic Premium displays ₹1,00,000 | | |

#### Test Case RT-01.2: Total Brokerage Field

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Open Final Negotiation activity | Activity loads | | |
| 2 | Locate "Total Brokerage" or "Brokerage Amount" field | Field visible | | |
| 3 | Enter value: ₹5,000 | Value accepted | | |
| 4 | Save and verify | Data persisted | | |

#### Test Case RT-01.3: Other Existing Fields

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Test all existing Final Negotiation fields | All fields function as before | | |
| 2 | Fields to test:<br>- Policy Start Date<br>- Policy End Date<br>- Coverage Details<br>- Terms & Conditions<br>- Meeting Notes<br>- Attachments | No regression issues | | |

---

### RT-02: Data Flow Integrity

**Objective**: Verify data flows correctly from RFP → Broking Slip → Final Negotiation → Policy.

**Priority**: High  
**Type**: Regression  

#### Test Case RT-02.1: End-to-End Data Flow

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Create new opportunity | Opportunity created | | |
| 2 | Complete RFP with 2 Preferred Insurers | RFP saved | | |
| 3 | Navigate to Broking Slip | Insurers pre-populated | | |
| 4 | Save Broking Slip with pre-populated insurers | Broking Slip completed | | |
| 5 | Navigate to Final Negotiation | Activity opens | | |
| 6 | Verify "Select Lead Insurer" dropdown shows Broking Slip insurers | Dropdown populated correctly | | |
| 7 | Complete Final Negotiation with all required fields | Activity completed | | |
| 8 | Create Policy from this opportunity | Policy created | | |
| 9 | Verify policy contains correct data | All data matches Final Negotiation | | |

---

### RT-03: Database Integrity

**Objective**: Verify database tables and relationships remain intact.

**Priority**: High  
**Type**: Regression  

#### Test Case RT-03.1: Verify Existing Data Not Corrupted

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Query existing opportunities in DB | All opportunities load | | |
| 2 | Query existing Final Negotiation records | All records intact | | |
| 3 | Verify foreign key relationships | All relationships valid | | |
| 4 | Check for null/corrupted data | No data corruption | | |

#### Test Case RT-03.2: New Column Addition

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Verify `share_amount` column exists in `opportunity_final_negotiation_sharing_detail` | Column present | | |
| 2 | Verify column type is NUMERIC(19,2) | Data type correct | | |
| 3 | Insert test record with share_amount | Insert succeeds | | |
| 4 | Query and verify data | Data retrieved correctly | | |

---

### RT-04: API Endpoints

**Objective**: Verify existing API endpoints continue to work.

**Priority**: High  
**Type**: Regression  

#### Test Case RT-04.1: Opportunity APIs

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | GET /api/opportunities/{id} | Returns opportunity data | | |
| 2 | POST /api/opportunities | Creates new opportunity | | |
| 3 | PUT /api/opportunities/{id} | Updates opportunity | | |
| 4 | Verify response structure unchanged | JSON structure matches | | |

#### Test Case RT-04.2: Final Negotiation APIs

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | GET /api/final-negotiation/{id} | Returns data | | |
| 2 | POST /api/final-negotiation | Creates record | | |
| 3 | PUT /api/final-negotiation/{id} | Updates record | | |
| 4 | Verify existing fields in response | All fields present | | |

---

### RT-05: User Permissions & Access Control

**Objective**: Verify user permissions and role-based access control.

**Priority**: Medium  
**Type**: Regression  

#### Test Case RT-05.1: Broker User Access

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Login as Broker user | Login successful | | |
| 2 | Access RFP activity | Full edit access | | |
| 3 | Access Broking Slip | Full edit access | | |
| 4 | Access Final Negotiation | Full edit access | | |
| 5 | Save all activities | Save succeeds | | |

#### Test Case RT-05.2: Viewer User Access

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Login as Viewer user | Login successful | | |
| 2 | Access Final Negotiation | Read-only access | | |
| 3 | Verify fields are read-only | Cannot edit any field | | |
| 4 | Verify Save button hidden/disabled | No save capability | | |

#### Test Case RT-05.3: Admin User Access

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Login as Admin user | Login successful | | |
| 2 | Access all activities | Full access to all | | |
| 3 | Edit and save | All operations succeed | | |

---

### RT-06: Reporting & Exports

**Objective**: Verify existing reports and exports function correctly.

**Priority**: Medium  
**Type**: Regression  

#### Test Case RT-06.1: Opportunity Reports

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Generate Opportunity List report | Report generates | | |
| 2 | Verify all columns present | No missing columns | | |
| 3 | Export to Excel | Export succeeds | | |
| 4 | Verify exported data | Data matches UI | | |

#### Test Case RT-06.2: Final Negotiation Reports

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Generate Final Negotiation report | Report generates | | |
| 2 | Verify existing fields | All fields present | | |
| 3 | Export to PDF | Export succeeds | | |

---

### RT-07: Performance Testing

**Objective**: Verify performance has not degraded.

**Priority**: Medium  
**Type**: Regression  

#### Test Case RT-07.1: Page Load Times

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Measure Opportunity list page load time | < 3 seconds | | |
| 2 | Measure RFP activity load time | < 2 seconds | | |
| 3 | Measure Broking Slip load time | < 2 seconds | | |
| 4 | Measure Final Negotiation load time | < 3 seconds | | |

#### Test Case RT-07.2: Save Operation Performance

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Save RFP with 5 insurers | Save completes < 2 seconds | | |
| 2 | Save Broking Slip | Save completes < 2 seconds | | |
| 3 | Save Final Negotiation | Save completes < 2 seconds | | |

---

### RT-08: Browser Compatibility

**Objective**: Verify functionality across browsers.

**Priority**: Medium  
**Type**: Regression  

#### Test Case RT-08.1: Cross-Browser Testing

| Browser | Version | RFP Works | Broking Slip Works | Final Negotiation Works | Pass/Fail | Comments |
|---------|---------|-----------|--------------------|-----------------------|-----------|----------|
| Chrome | Latest | | | | | |
| Firefox | Latest | | | | | |
| Safari | Latest | | | | | |
| Edge | Latest | | | | | |

---

### RT-09: Mobile Responsiveness

**Objective**: Verify mobile/tablet responsiveness (if applicable).

**Priority**: Low  
**Type**: Regression  

#### Test Case RT-09.1: Mobile Browser Testing

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Open opportunity on mobile browser | Page loads | | |
| 2 | Navigate through activities | Navigation works | | |
| 3 | Verify UI is responsive | Elements fit screen | | |

---

### RT-10: Search & Filter Functionality

**Objective**: Verify search and filter features work.

**Priority**: Medium  
**Type**: Regression  

#### Test Case RT-10.1: Opportunity Search

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Search for opportunity by client name | Results display | | |
| 2 | Search by opportunity ID | Correct opportunity found | | |
| 3 | Filter by stage | Filtered results accurate | | |

---

### RT-11: Notifications & Alerts

**Objective**: Verify existing notifications continue to work.

**Priority**: Low  
**Type**: Regression  

#### Test Case RT-11.1: Activity Completion Notifications

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Complete RFP activity | Notification sent to next user | | |
| 2 | Complete Broking Slip | Notification sent | | |
| 3 | Complete Final Negotiation | Notification sent | | |

---

### RT-12: Workflow & Stage Progression

**Objective**: Verify opportunity stage progression works correctly.

**Priority**: High  
**Type**: Regression  

#### Test Case RT-12.1: Stage Transition

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Opportunity at Planning stage | Stage = Planning | | |
| 2 | Complete RFP activity | Stage transitions to RFP | | |
| 3 | Complete Broking Slip | Stage transitions to Broking Slip | | |
| 4 | Complete Final Negotiation | Stage transitions to Final Negotiation | | |
| 5 | Create Policy | Stage transitions to Policy Issued | | |

---

### RT-13: Audit Trail

**Objective**: Verify audit logging continues to work.

**Priority**: Medium  
**Type**: Regression  

#### Test Case RT-13.1: Audit Log Entries

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Create opportunity | Audit log entry created | | |
| 2 | Edit opportunity | Edit logged | | |
| 3 | Complete activity | Activity completion logged | | |
| 4 | View audit history | All changes visible | | |

---

### RT-14: Validation Rules

**Objective**: Verify existing validation rules still work.

**Priority**: High  
**Type**: Regression  

#### Test Case RT-14.1: Required Field Validations

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Try to save RFP without required fields | Validation error displayed | | |
| 2 | Try to save Broking Slip without required fields | Validation error displayed | | |
| 3 | Try to save Final Negotiation without required fields | Validation error displayed | | |

---

### RT-15: Integration with External Systems

**Objective**: Verify integrations continue to work (if applicable).

**Priority**: Medium  
**Type**: Regression  

#### Test Case RT-15.1: Email Integration

| Step | Action | Expected Result | Pass/Fail | Comments |
|------|--------|-----------------|-----------|----------|
| 1 | Send email from opportunity | Email sent successfully | | |
| 2 | Attach documents | Attachments work | | |

---

## Test Execution Checklist

### Pre-Execution Checklist

- [ ] Test environment is set up and accessible
- [ ] Test data is prepared
- [ ] Browser versions verified
- [ ] Database backup taken
- [ ] Test user accounts created and verified
- [ ] Required permissions granted to test users

### Execution Checklist

**Part 1: Auto-populate Test Scenarios**
- [ ] Test Scenario 1: Data Pre-population (3 test cases)
- [ ] Test Scenario 2: Edit Pre-populated Data (3 test cases)
- [ ] Test Scenario 3: Add More Insurers (3 test cases)
- [ ] Test Scenario 4: Delete Pre-populated Insurer (4 test cases)
- [ ] Test Scenario 5: No Insurers in RFP (3 test cases)

**Part 2: Regression Test Scenarios**
- [ ] RT-01: Existing Final Negotiation Fields
- [ ] RT-02: Data Flow Integrity
- [ ] RT-03: Database Integrity
- [ ] RT-04: API Endpoints
- [ ] RT-05: User Permissions & Access Control
- [ ] RT-06: Reporting & Exports
- [ ] RT-07: Performance Testing
- [ ] RT-08: Browser Compatibility
- [ ] RT-09: Mobile Responsiveness
- [ ] RT-10: Search & Filter Functionality
- [ ] RT-11: Notifications & Alerts
- [ ] RT-12: Workflow & Stage Progression
- [ ] RT-13: Audit Trail
- [ ] RT-14: Validation Rules
- [ ] RT-15: Integration with External Systems

### Post-Execution Checklist

- [ ] All test cases executed
- [ ] Pass/Fail status documented
- [ ] Screenshots captured for failures
- [ ] Bugs logged in Jira with proper severity
- [ ] Test summary report created
- [ ] Stakeholders notified

---

## Bug Reporting Template

### Bug Report Format

When logging bugs in Jira, use the following format:

**Summary**: `[IIRM-7616] <Brief description of issue>`

**Description**:
```
Environment: UAT / Production
Browser: Chrome 120.x / Firefox / Safari
User Role: Broker / Admin / Viewer

Steps to Reproduce:
1. Step 1
2. Step 2
3. Step 3

Expected Result:
<What should happen>

Actual Result:
<What actually happened>

Test Case Reference: Test Case X.X

Attachments:
- Screenshot
- Console logs (if applicable)
- Network logs (if applicable)
```

**Priority/Severity Guidelines**:
- **Blocker**: System unusable, no workaround
- **Critical**: Major functionality broken, workaround difficult
- **Major**: Important functionality affected, workaround available
- **Minor**: UI issues, cosmetic problems
- **Trivial**: Enhancement requests, suggestions

---

## Test Summary Report Template

### Test Execution Summary

**Test Cycle**: IIRM-7616 - Auto-populate & Regression Testing  
**Execution Date**: [Date]  
**Executed By**: [Tester Name]  
**Environment**: UAT  

#### Overall Statistics

| Metric | Count | Percentage |
|--------|-------|------------|
| Total Test Cases | X | 100% |
| Passed | X | XX% |
| Failed | X | XX% |
| Blocked | X | XX% |
| Not Executed | X | XX% |

#### Part 1: Auto-populate Test Results

| Scenario | Total Cases | Passed | Failed | Blocked |
|----------|-------------|--------|--------|---------|
| Scenario 1 | 3 | | | |
| Scenario 2 | 3 | | | |
| Scenario 3 | 3 | | | |
| Scenario 4 | 4 | | | |
| Scenario 5 | 3 | | | |
| **Total** | **16** | | | |

#### Part 2: Regression Test Results

| Test Suite | Total Cases | Passed | Failed | Blocked |
|------------|-------------|--------|--------|---------|
| RT-01 to RT-05 | | | | |
| RT-06 to RT-10 | | | | |
| RT-11 to RT-15 | | | | |
| **Total** | | | | |

#### Critical Issues Found

| Bug ID | Summary | Severity | Status |
|--------|---------|----------|--------|
| | | | |

#### Recommendations

- [ ] Ready for UAT
- [ ] Ready for Production
- [ ] Critical bugs must be fixed before deployment
- [ ] Minor issues can be addressed post-deployment

---

**Document Status**: ✅ Ready for QA Execution  
**Last Updated**: November 8, 2025  
**Version**: 1.0  

---

**END OF TEST SCENARIOS DOCUMENT**
