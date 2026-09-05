# **Test Cases - Claims Summary & Claims Corner (Phase 1)**

## **Document Information**
- **Feature**: IIRM-7631 IBP Claims Corner (Phase 1)
- **Version**: 1.0
- **Date**: December 1, 2025
- **Test Type**: Functional, UI, Integration, Edge Cases
- **Scope**: Claims Summary Dashboard Widget & Claims Corner Screen

---

## **Test Case Categories**

1. [Dashboard Claims Summary Widget Test Cases](#1-dashboard-claims-summary-widget-test-cases)
2. [Claims Corner Screen Test Cases](#2-claims-corner-screen-test-cases)
3. [Data Integration and Sync Test Cases](#3-data-integration-and-sync-test-cases)
4. [Responsive Design Test Cases](#4-responsive-design-test-cases)
5. [Performance Test Cases](#5-performance-test-cases)
6. [Security Test Cases](#6-security-test-cases)
7. [Edge Cases and Error Handling Test Cases](#7-edge-cases-and-error-handling-test-cases)

---

## **1. Dashboard Claims Summary Widget Test Cases**

### **1.1 Widget Display Logic Test Cases**

#### **TC-DSH-001: Multiple Policy Types Display**
- **Test Case ID**: TC-DSH-001
- **Priority**: High
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has active GMC, GPA, and GTL policies
  - Claims data exists for at least one policy
- **Test Steps**:
  1. Login as employee with multiple policies
  2. Navigate to dashboard
  3. Verify Claims Summary widgets are displayed
- **Expected Results**:
  - Separate widgets displayed for each policy type (GMC, GPA, GTL)
  - Each widget shows policy-specific data only
  - Widgets follow design layout specifications
  - No data mixing between policy types
- **Test Data**: Employee ID with GMC, GPA, GTL policies
- **Post-conditions**: Dashboard loads completely with all widgets

#### **TC-DSH-002: Single Policy Display**
- **Test Case ID**: TC-DSH-002
- **Priority**: High
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has only one active policy (GMC)
  - Claims data exists for the policy
- **Test Steps**:
  1. Login as employee with single policy
  2. Navigate to dashboard
  3. Verify single Claims Summary widget is displayed
- **Expected Results**:
  - Only one widget displayed for the active policy
  - Side image adjusts for single record state
  - All policy information is accurate
  - No placeholder widgets for other policy types
- **Test Data**: Employee ID with only GMC policy
- **Post-conditions**: Dashboard loads with single widget

#### **TC-DSH-003: No Claims Data - Widget Hidden**
- **Test Case ID**: TC-DSH-003
- **Priority**: Medium
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has active policies
  - No claims data exists for any policy
- **Test Steps**:
  1. Login as employee with policies but no claims
  2. Navigate to dashboard
  3. Verify Claims Summary widgets are not displayed
- **Expected Results**:
  - Claims Summary widgets are completely hidden
  - No empty or broken widget containers
  - Other dashboard widgets display normally
- **Test Data**: Employee ID with policies but zero claims
- **Post-conditions**: Dashboard loads without claims widgets

#### **TC-DSH-004: Empty State Display**
- **Test Case ID**: TC-DSH-004
- **Priority**: Medium
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has active policies
  - Widget is configured to show even with no claims
- **Test Steps**:
  1. Login as employee with policies but no claims
  2. Navigate to dashboard
  3. Verify empty state message is displayed
- **Expected Results**:
  - Display message: "No claims found for your policies."
  - Side image adjusts for zero state per design
  - Widget structure remains intact
- **Test Data**: Employee ID with policies, zero claims, widget forced display
- **Post-conditions**: Empty state displayed correctly

### **1.2 Claim Status Summary Bar Test Cases**

#### **TC-DSH-005: Total Claims Count Accuracy**
- **Test Case ID**: TC-DSH-005
- **Priority**: High
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has 3 personal claims + 2 dependent claims = 5 total
- **Test Steps**:
  1. Login as employee
  2. Navigate to dashboard
  3. Check Total Claims count in status summary bar
- **Expected Results**:
  - Total Claims displays "5"
  - Count includes both employee and dependent claims
  - Number is prominently displayed
- **Test Data**: Employee with 5 total claims
- **Post-conditions**: Count matches database records

#### **TC-DSH-006: Settled Claims Count Verification**
- **Test Case ID**: TC-DSH-006
- **Priority**: High
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has 3 claims with status "Settled"
  - Employee has 2 claims with status "Pending"
- **Test Steps**:
  1. Login as employee
  2. Navigate to dashboard
  3. Check Settled and Pending counts in status bar
- **Expected Results**:
  - Settled count displays "3"
  - Pending count displays "2"
  - Total count displays "5"
  - Status colors match design specifications
- **Test Data**: Employee with mixed claim statuses
- **Post-conditions**: Status counts are accurate

#### **TC-DSH-007: Mixed Status Claims Calculation**
- **Test Case ID**: TC-DSH-007
- **Priority**: High
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has claims with statuses: Settled, Pending, Rejected, Under Review
- **Test Steps**:
  1. Login as employee
  2. Navigate to dashboard
  3. Verify only "Settled" and "Pending" are counted separately
- **Expected Results**:
  - Only "Settled" status claims count in Settled section
  - Only "Pending" status claims count in Pending section
  - Other statuses (Rejected, Under Review) are not separately counted
  - Total includes all claim statuses
- **Test Data**: Employee with various claim statuses
- **Post-conditions**: Status categorization is correct

### **1.3 Policy Information Display Test Cases**

#### **TC-DSH-008: GMC Policy Information Accuracy**
- **Test Case ID**: TC-DSH-008
- **Priority**: High
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has active GMC policy
  - Policy data includes all required fields
- **Test Steps**:
  1. Login as employee with GMC policy
  2. Navigate to dashboard
  3. Verify all policy information fields
- **Expected Results**:
  - Policy Number displays correctly
  - Policy Expiry Date matches source data
  - Total Sum Insured amount is accurate
  - Policy Type shows as "Base" or "Parent" correctly
  - Currency formatting is proper (₹ symbol)
- **Test Data**: Employee with complete GMC policy data
- **Post-conditions**: All policy fields display accurately

#### **TC-DSH-009: GPA Policy Information Display**
- **Test Case ID**: TC-DSH-009
- **Priority**: High
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has active GPA policy
  - No dependents should be shown for GPA
- **Test Steps**:
  1. Login as employee with GPA policy
  2. Navigate to dashboard
  3. Verify GPA-specific display rules
- **Expected Results**:
  - "Family members covered" section is NOT displayed
  - Policy information shows correctly
  - Claims data includes only employee (no dependents)
  - Policy type identified as GPA
- **Test Data**: Employee with GPA policy
- **Post-conditions**: GPA policy rules followed correctly

#### **TC-DSH-010: GTL Policy Information Display**
- **Test Case ID**: TC-DSH-010
- **Priority**: High
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has active GTL policy
  - No dependents should be shown for GTL
- **Test Steps**:
  1. Login as employee with GTL policy
  2. Navigate to dashboard
  3. Verify GTL-specific display rules
- **Expected Results**:
  - "Family members covered" section is NOT displayed
  - Policy information shows correctly
  - Claims data includes only employee (no dependents)
  - Policy type identified as GTL
- **Test Data**: Employee with GTL policy
- **Post-conditions**: GTL policy rules followed correctly

#### **TC-DSH-011: Available Amount Calculation**
- **Test Case ID**: TC-DSH-011
- **Priority**: High
- **Category**: Calculation
- **Pre-conditions**: 
  - Total Sum Insured: ₹5,00,000
  - Approved Claims: ₹1,50,000
- **Test Steps**:
  1. Login as employee
  2. Navigate to dashboard
  3. Check Available Amount calculation
- **Expected Results**:
  - Available Amount displays ₹3,50,000
  - Calculation: Total Sum Insured - Sum of Approved Claims
  - Amount formatted with proper currency symbol
- **Test Data**: Known policy and claims amounts
- **Post-conditions**: Calculation is mathematically correct

#### **TC-DSH-012: Total Claimed Amount Aggregation**
- **Test Case ID**: TC-DSH-012
- **Priority**: High
- **Category**: Calculation
- **Pre-conditions**: 
  - Employee has multiple claims (self + dependents)
  - Claims amounts: ₹10,000, ₹25,000, ₹15,000
- **Test Steps**:
  1. Login as employee
  2. Navigate to dashboard
  3. Check Total Claimed Amount
- **Expected Results**:
  - Total Claimed Amount displays ₹50,000
  - Includes all claim amounts for employee and dependents
  - Proper currency formatting
- **Test Data**: Employee with multiple claims
- **Post-conditions**: Sum is accurate

### **1.4 Recent Claims List Test Cases**

#### **TC-DSH-013: Recent Claims Display Format**
- **Test Case ID**: TC-DSH-013
- **Priority**: High
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has multiple recent claims
- **Test Steps**:
  1. Login as employee
  2. Navigate to dashboard
  3. Verify recent claims list format
- **Expected Results**:
  - Member Name shows correctly (Self/Dependent Name)
  - Claim Requested Date in proper format
  - Claim Amount with currency symbol
  - Current Status displayed clearly
  - Claim Reference Number visible
- **Test Data**: Employee with recent claims
- **Post-conditions**: All claim fields display properly

#### **TC-DSH-014: Self vs Dependent Claim Identification**
- **Test Case ID**: TC-DSH-014
- **Priority**: High
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has claims for self and dependents
- **Test Steps**:
  1. Login as employee
  2. Navigate to dashboard
  3. Check claim member identification
- **Expected Results**:
  - Employee claims show "Self" or employee name
  - Dependent claims show dependent name with relationship
  - Clear distinction between self and dependent claims
- **Test Data**: Employee with self and dependent claims
- **Post-conditions**: Member identification is clear

#### **TC-DSH-015: Claims Date Formatting**
- **Test Case ID**: TC-DSH-015
- **Priority**: Medium
- **Category**: Display
- **Pre-conditions**: 
  - Claims have various request dates
- **Test Steps**:
  1. Login as employee
  2. Navigate to dashboard
  3. Check date formatting in recent claims
- **Expected Results**:
  - Dates displayed in consistent format (DD/MM/YYYY or DD-MMM-YYYY)
  - Recent claims listed in chronological order
  - Date format matches system standards
- **Test Data**: Claims with different dates
- **Post-conditions**: Date format is consistent

### **1.5 Family Members Display Test Cases**

#### **TC-DSH-016: GMC Family Members Display**
- **Test Case ID**: TC-DSH-016
- **Priority**: High
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has GMC policy
  - Employee has enrolled dependents (spouse, children)
- **Test Steps**:
  1. Login as employee with GMC policy
  2. Navigate to dashboard
  3. Check Family Members Covered section
- **Expected Results**:
  - Family Members Covered section is displayed
  - Shows member names with relationships (Spouse, Son, Daughter, etc.)
  - Data matches enrollment information
  - Proper formatting and layout
- **Test Data**: GMC employee with enrolled dependents
- **Post-conditions**: Family members display correctly

#### **TC-DSH-017: GPA/GTL No Family Members**
- **Test Case ID**: TC-DSH-017
- **Priority**: High
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has only GPA or GTL policy
- **Test Steps**:
  1. Login as employee with GPA/GTL policy
  2. Navigate to dashboard
  3. Verify Family Members section is hidden
- **Expected Results**:
  - Family Members Covered section is NOT displayed
  - No placeholder or empty family section
  - Widget layout adjusts appropriately
- **Test Data**: Employee with only GPA or GTL policy
- **Post-conditions**: Family section properly hidden

### **1.6 GMC Base vs Parent Policy Test Cases**

#### **TC-DSH-018: GMC Base and Parent Combined Display**
- **Test Case ID**: TC-DSH-018
- **Priority**: High
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has both GMC base and parent policy
- **Test Steps**:
  1. Login as employee with base and parent GMC
  2. Navigate to dashboard
  3. Check combined policy display
- **Expected Results**:
  - Both policies shown on same card
  - Separate bifurcation of calculations
  - Clear division between base and parent data
  - Follows design specifications
  - No data mixing between base and parent
- **Test Data**: Employee with both GMC policies
- **Post-conditions**: Combined display is accurate

#### **TC-DSH-019: GMC Base Policy Only**
- **Test Case ID**: TC-DSH-019
- **Priority**: Medium
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has only GMC base policy (no parent)
- **Test Steps**:
  1. Login as employee with only base GMC
  2. Navigate to dashboard
  3. Check single policy display
- **Expected Results**:
  - Only base policy information shown
  - No parent policy section appears
  - Single policy layout used
  - All base policy data accurate
- **Test Data**: Employee with only GMC base policy
- **Post-conditions**: Single policy display correct

### **1.7 Visual Elements Test Cases**

#### **TC-DSH-020: Side Image State Variations**
- **Test Case ID**: TC-DSH-020
- **Priority**: Medium
- **Category**: UI/Visual
- **Pre-conditions**: 
  - Test different policy scenarios
- **Test Steps**:
  1. Test single policy with claims (single record state)
  2. Test multiple policies with claims (multiple records state)
  3. Test policies with no claims (zero state)
- **Expected Results**:
  - Side image adjusts correctly for each state
  - Images match design specifications
  - Proper visual hierarchy maintained
  - Images are responsive and load properly
- **Test Data**: Various policy and claims combinations
- **Post-conditions**: All image states display correctly

---

## **2. Claims Corner Screen Test Cases**

### **2.1 Navigation Test Cases**

#### **TC-CC-001: Claims Corner Navigation**
- **Test Case ID**: TC-CC-001
- **Priority**: High
- **Category**: Navigation
- **Pre-conditions**: 
  - User is logged in and on dashboard
- **Test Steps**:
  1. Click on "Claims Corner" tab/link from dashboard
  2. Verify page navigation
  3. Check URL change
- **Expected Results**:
  - Redirects to Claims Corner screen successfully
  - URL changes to appropriate Claims Corner route
  - Page loads completely without errors
  - Navigation breadcrumb updates correctly
- **Test Data**: Any valid employee
- **Post-conditions**: Claims Corner screen fully loaded

#### **TC-CC-002: Screen Structure Verification**
- **Test Case ID**: TC-CC-002
- **Priority**: High
- **Category**: UI Structure
- **Pre-conditions**: 
  - User navigated to Claims Corner
- **Test Steps**:
  1. Verify page structure and sections
  2. Check all three primary sections are present
- **Expected Results**:
  - Policy Information & Coverage Utilization section visible
  - Life Event Update card displayed
  - Parental Policy section (if applicable)
  - All sections load properly
- **Test Data**: Employee with GMC policy including parent policy
- **Post-conditions**: Complete screen structure verified

### **2.2 Policy Display Order Test Cases**

#### **TC-CC-003: Multiple Policy Types Order**
- **Test Case ID**: TC-CC-003
- **Priority**: High
- **Category**: Display Logic
- **Pre-conditions**: 
  - Employee has GMC, GPA, and GTL policies
- **Test Steps**:
  1. Load Claims Corner screen
  2. Verify policy display order
  3. Check section separation
- **Expected Results**:
  - Policies displayed policy-type-wise
  - Order: GMC (Base first, then Parent), GPA, GTL
  - Each policy type has separate, clearly defined section
  - No mixing of policy data
- **Test Data**: Employee with all policy types
- **Post-conditions**: Policy order is correct

#### **TC-CC-004: Single Policy Type Display**
- **Test Case ID**: TC-CC-004
- **Priority**: Medium
- **Category**: Display Logic
- **Pre-conditions**: 
  - Employee has only one policy type (e.g., GMC)
- **Test Steps**:
  1. Load Claims Corner screen
  2. Verify only relevant policy section displays
- **Expected Results**:
  - Only applicable policy type section displayed
  - Other policy sections not shown or referenced
  - No empty placeholders for missing policy types
- **Test Data**: Employee with single policy type
- **Post-conditions**: Only relevant section displayed

### **2.3 Layout Responsiveness Test Cases**

#### **TC-CC-005: Wide Screen Layout - Desktop**
- **Test Case ID**: TC-CC-005
- **Priority**: High
- **Category**: Responsive Design
- **Pre-conditions**: 
  - Employee has GMC base and parent policies
  - Screen width ≥ 1024px
- **Test Steps**:
  1. Access Claims Corner on wide screen
  2. Verify card layout arrangement
- **Expected Results**:
  - Base and Parent policy cards displayed side-by-side
  - Proper spacing and alignment maintained
  - Cards are properly sized and readable
  - No horizontal scrolling required
- **Test Data**: GMC employee with both policies
- **Post-conditions**: Desktop layout renders correctly

#### **TC-CC-006: Mobile Screen Layout**
- **Test Case ID**: TC-CC-006
- **Priority**: High
- **Category**: Responsive Design
- **Pre-conditions**: 
  - Employee has GMC base and parent policies
  - Screen width < 768px (mobile)
- **Test Steps**:
  1. Access Claims Corner on mobile device
  2. Verify card stacking behavior
- **Expected Results**:
  - Base and Parent policy cards stacked vertically
  - Base policy card appears first (top)
  - Parent policy card appears below
  - All content readable without horizontal scroll
  - Touch targets appropriately sized
- **Test Data**: GMC employee with both policies
- **Post-conditions**: Mobile layout renders correctly

### **2.4 Data Consistency Test Cases**

#### **TC-CC-007: Dashboard vs Claims Corner Consistency**
- **Test Case ID**: TC-CC-007
- **Priority**: High
- **Category**: Data Integrity
- **Pre-conditions**: 
  - Claims data displayed on both dashboard and Claims Corner
- **Test Steps**:
  1. Note data values on dashboard widgets
  2. Navigate to Claims Corner
  3. Compare data values between both screens
- **Expected Results**:
  - All claim counts match between dashboard and Claims Corner
  - Policy information is identical
  - Coverage utilization data is consistent
  - Amount calculations are the same
- **Test Data**: Employee with claims on both screens
- **Post-conditions**: Data consistency verified

#### **TC-CC-008: Real-time Data Updates**
- **Test Case ID**: TC-CC-008
- **Priority**: Medium
- **Category**: Data Sync
- **Pre-conditions**: 
  - Claims data can be updated in IIRM portal
- **Test Steps**:
  1. Update claim status in IIRM portal
  2. Refresh Claims Corner screen
  3. Verify updated information displays
- **Expected Results**:
  - Updated claim status reflected in Claims Corner
  - Status summary counts updated correctly
  - Last update timestamp shows recent time
- **Test Data**: Claim with updatable status
- **Post-conditions**: Real-time sync working

### **2.5 Policy-Specific Data Test Cases**

#### **TC-CC-009: GMC Base Policy Data Isolation**
- **Test Case ID**: TC-CC-009
- **Priority**: High
- **Category**: Data Segregation
- **Pre-conditions**: 
  - Employee has both GMC base and parent policies
- **Test Steps**:
  1. Load Claims Corner
  2. Verify base policy card shows only base policy data
  3. Check calculations use only base policy claims
- **Expected Results**:
  - Base policy card uses only base policy dataset
  - No mixing with parent policy data
  - Claims count includes only base policy claims
  - Calculations are specific to base policy
- **Test Data**: Employee with separate base and parent policy data
- **Post-conditions**: Base policy data isolated correctly

#### **TC-CC-010: GMC Parent Policy Data Isolation**
- **Test Case ID**: TC-CC-010
- **Priority**: High
- **Category**: Data Segregation
- **Pre-conditions**: 
  - Employee has both GMC base and parent policies
- **Test Steps**:
  1. Load Claims Corner
  2. Verify parent policy card shows only parent policy data
  3. Check calculations use only parent policy claims
- **Expected Results**:
  - Parent policy card uses only parent policy dataset
  - No mixing with base policy data
  - Claims count includes only parent policy claims
  - Calculations are specific to parent policy
- **Test Data**: Employee with separate base and parent policy data
- **Post-conditions**: Parent policy data isolated correctly

#### **TC-CC-011: GPA Policy Employee-Only Data**
- **Test Case ID**: TC-CC-011
- **Priority**: High
- **Category**: Policy Rules
- **Pre-conditions**: 
  - Employee has GPA policy
- **Test Steps**:
  1. Load Claims Corner GPA section
  2. Verify only employee claims included
- **Expected Results**:
  - Only employee claims included (no dependents)
  - Policy information specific to GPA
  - Coverage calculations for GPA only
  - No family members section displayed
- **Test Data**: Employee with GPA policy and family
- **Post-conditions**: GPA policy rules enforced

#### **TC-CC-012: GTL Policy Employee-Only Data**
- **Test Case ID**: TC-CC-012
- **Priority**: High
- **Category**: Policy Rules
- **Pre-conditions**: 
  - Employee has GTL policy
- **Test Steps**:
  1. Load Claims Corner GTL section
  2. Verify only employee claims included
- **Expected Results**:
  - Only employee claims included (no dependents)
  - Policy information specific to GTL
  - Coverage calculations for GTL only
  - No family members section displayed
- **Test Data**: Employee with GTL policy and family
- **Post-conditions**: GTL policy rules enforced

### **2.6 Life Event Update Card Test Cases**

#### **TC-CC-013: Life Event Card Universal Display**
- **Test Case ID**: TC-CC-013
- **Priority**: Medium
- **Category**: Functional
- **Pre-conditions**: 
  - Employee has any policy type (GMC, GPA, GTL)
- **Test Steps**:
  1. Load Claims Corner for different policy types
  2. Verify Life Event Update card displays for all
- **Expected Results**:
  - Life Event Update card displayed for all policy types
  - Card appears in correct position per design
  - Content is appropriate for policy type
- **Test Data**: Employees with different policy types
- **Post-conditions**: Card displays universally

#### **TC-CC-014: Update Now CTA Functionality**
- **Test Case ID**: TC-CC-014
- **Priority**: Medium
- **Category**: Navigation
- **Pre-conditions**: 
  - Life Event Update card is displayed
- **Test Steps**:
  1. Click "Update Now" button
  2. Verify navigation behavior
- **Expected Results**:
  - Navigation to In-Progress page occurs
  - URL changes appropriately
  - Proper transition/loading state shown
  - Page loads without errors
- **Test Data**: Any employee with Life Event card
- **Post-conditions**: Navigation successful

#### **TC-CC-015: Life Event Card Accessibility**
- **Test Case ID**: TC-CC-015
- **Priority**: Medium
- **Category**: Accessibility
- **Pre-conditions**: 
  - Life Event Update card displayed
- **Test Steps**:
  1. Navigate using keyboard only
  2. Test with screen reader
  3. Verify focus management
- **Expected Results**:
  - "Update Now" CTA properly focusable with keyboard
  - Appropriate ARIA labels present
  - Screen reader announces card content correctly
  - Focus indicators visible
- **Test Data**: Any employee with Life Event card
- **Post-conditions**: Accessibility compliance verified

### **2.7 Parental Policy Card Test Cases**

#### **TC-CC-016: Parental Policy Card Display Conditions**
- **Test Case ID**: TC-CC-016
- **Priority**: High
- **Category**: Display Logic
- **Pre-conditions**: 
  - Test various policy combinations
- **Test Steps**:
  1. Test GMC with parent policy coverage
  2. Test GMC without parent policy coverage
  3. Test GPA/GTL policies only
- **Expected Results**:
  - Parental Policy card displayed only for GMC with parent coverage
  - Card NOT displayed for GMC without parent coverage
  - Card NOT displayed for GPA/GTL policies only
- **Test Data**: Various policy combinations
- **Post-conditions**: Display conditions correctly enforced

#### **TC-CC-017: Parent Policy Data Accuracy**
- **Test Case ID**: TC-CC-017
- **Priority**: High
- **Category**: Data Accuracy
- **Pre-conditions**: 
  - Employee has parent policy with claims
- **Test Steps**:
  1. Load Parental Policy card
  2. Verify all parent policy data fields
  3. Check calculations
- **Expected Results**:
  - Policy Number specific to parent policy
  - Sum Insured amount for parent policy only
  - Available amount calculated for parent policy
  - Claims count includes only parent policy claims
  - Expiry date for parent policy
- **Test Data**: Employee with parent policy and claims
- **Post-conditions**: Parent policy data accurate

#### **TC-CC-018: Parent Policy Card Ordering**
- **Test Case ID**: TC-CC-018
- **Priority**: Medium
- **Category**: Layout
- **Pre-conditions**: 
  - Employee has GMC base and parent policies
- **Test Steps**:
  1. Test on desktop layout
  2. Test on mobile layout
  3. Verify consistent ordering
- **Expected Results**:
  - Desktop: Base GMC card first (left), Parent Policy card after (right)
  - Mobile: Base GMC card first (top), Parent Policy card below
  - Consistent ordering maintained across all screen sizes
- **Test Data**: GMC employee with both policies
- **Post-conditions**: Ordering consistent across devices

---

## **3. Data Integration and Sync Test Cases**

### **3.1 IIRM Portal Integration Test Cases**

#### **TC-INT-001: Claims Data Sync Accuracy**
- **Test Case ID**: TC-INT-001
- **Priority**: Critical
- **Category**: Integration
- **Pre-conditions**: 
  - Claims data uploaded to IIRM Portal
- **Test Steps**:
  1. Upload test claims data to IIRM Portal
  2. Trigger sync process
  3. Verify data in IBP Portal
- **Expected Results**:
  - All claim records accurately transferred
  - Data mapping correct for all fields
  - No data loss or corruption
  - Field formatting preserved
- **Test Data**: Known claims dataset
- **Post-conditions**: Data successfully synced

#### **TC-INT-002: Large Dataset Sync Performance**
- **Test Case ID**: TC-INT-002
- **Priority**: High
- **Category**: Performance
- **Pre-conditions**: 
  - Large claims dataset (1000+ records)
- **Test Steps**:
  1. Upload large dataset to IIRM Portal
  2. Trigger sync process
  3. Monitor sync performance and completion
- **Expected Results**:
  - Sync completes within acceptable time limits
  - All records processed successfully
  - System remains responsive during sync
  - Progress indicators work correctly
- **Test Data**: Large claims dataset
- **Post-conditions**: Large dataset sync successful

#### **TC-INT-003: Incremental Data Updates**
- **Test Case ID**: TC-INT-003
- **Priority**: High
- **Category**: Data Sync
- **Pre-conditions**: 
  - Initial claims data already synced
- **Test Steps**:
  1. Update claim status in IIRM Portal
  2. Add new claims to IIRM Portal
  3. Trigger incremental sync
- **Expected Results**:
  - Only updated/new records are processed
  - Existing unchanged records not affected
  - Update timestamp reflects changes
  - Sync process is efficient
- **Test Data**: Existing data with updates
- **Post-conditions**: Incremental sync working

### **3.2 Data Field Validation Test Cases**

#### **TC-INT-004: Required Fields Validation**
- **Test Case ID**: TC-INT-004
- **Priority**: Critical
- **Category**: Data Validation
- **Pre-conditions**: 
  - Claims data file with missing required fields
- **Test Steps**:
  1. Upload file missing Policy Number
  2. Upload file missing Policy Expiry Date
  3. Upload file missing Total Sum Insured
  4. Upload file missing Policy Type
  5. Upload file missing Available Amount
- **Expected Results**:
  - Validation errors generated for missing fields
  - Data upload rejected or flagged
  - Clear error messages indicating missing fields
  - No partial data corruption
- **Test Data**: Files with missing required fields
- **Post-conditions**: Validation working correctly

#### **TC-INT-005: Data Type Validation**
- **Test Case ID**: TC-INT-005
- **Priority**: High
- **Category**: Data Validation
- **Pre-conditions**: 
  - Claims data with various field types
- **Test Steps**:
  1. Upload data with invalid date formats
  2. Upload data with invalid currency amounts
  3. Upload data with invalid policy numbers
- **Expected Results**:
  - Date format validation catches invalid dates
  - Currency validation catches invalid amounts
  - Data type errors properly reported
  - System handles validation gracefully
- **Test Data**: Files with invalid data types
- **Post-conditions**: Data type validation working

#### **TC-INT-006: Data Range Validation**
- **Test Case ID**: TC-INT-006
- **Priority**: Medium
- **Category**: Data Validation
- **Pre-conditions**: 
  - Claims data with edge case values
- **Test Steps**:
  1. Test with very large claim amounts
  2. Test with zero claim amounts
  3. Test with future dates
  4. Test with very old dates
- **Expected Results**:
  - Range validation applied correctly
  - Edge cases handled appropriately
  - Business rules enforced
  - Clear error messages for invalid ranges
- **Test Data**: Edge case values
- **Post-conditions**: Range validation working

### **3.3 Employee-Policy Linking Test Cases**

#### **TC-INT-007: Employee Claims Linking Accuracy**
- **Test Case ID**: TC-INT-007
- **Priority**: Critical
- **Category**: Data Linking
- **Pre-conditions**: 
  - Claims data contains employee and policy information
- **Test Steps**:
  1. Process claims data with employee identifiers
  2. Verify claims linked to correct employees
  3. Check policy associations
- **Expected Results**:
  - Claims correctly linked to respective employees
  - Policy associations are accurate
  - No cross-linking errors between employees
  - Employee-dependent relationships maintained
- **Test Data**: Multi-employee claims dataset
- **Post-conditions**: Linking accuracy verified

#### **TC-INT-008: Dependent Claims Linking**
- **Test Case ID**: TC-INT-008
- **Priority**: High
- **Category**: Data Linking
- **Pre-conditions**: 
  - Claims data includes dependent information
- **Test Steps**:
  1. Process claims for dependents
  2. Verify dependent claims linked to correct employee
  3. Check relationship information preservation
- **Expected Results**:
  - Dependent claims linked to correct employee
  - Relationship information preserved (spouse, child, etc.)
  - Dependent names displayed correctly
  - Family structure maintained
- **Test Data**: Claims with dependent information
- **Post-conditions**: Dependent linking correct

---

## **4. Responsive Design Test Cases**

### **4.1 Mobile Device Test Cases**

#### **TC-RES-001: Mobile Portrait Mode**
- **Test Case ID**: TC-RES-001
- **Priority**: High
- **Category**: Responsive Design
- **Pre-conditions**: 
  - Access on mobile device in portrait mode
- **Test Steps**:
  1. Load dashboard on mobile (portrait)
  2. Navigate to Claims Corner
  3. Test all functionality
- **Expected Results**:
  - All elements properly sized and positioned
  - Text readable without horizontal scrolling
  - Touch targets appropriately sized (min 44px)
  - Cards stack vertically appropriately
  - Navigation elements accessible
- **Test Data**: Various mobile device sizes
- **Post-conditions**: Portrait mode fully functional

#### **TC-RES-002: Mobile Landscape Mode**
- **Test Case ID**: TC-RES-002
- **Priority**: High
- **Category**: Responsive Design
- **Pre-conditions**: 
  - Access on mobile device in landscape mode
- **Test Steps**:
  1. Rotate device to landscape
  2. Test dashboard and Claims Corner
  3. Verify layout adaptation
- **Expected Results**:
  - Layout adapts smoothly to landscape orientation
  - Content remains readable and accessible
  - No element overflow or cutoff
  - Touch targets remain appropriate size
- **Test Data**: Various mobile device sizes
- **Post-conditions**: Landscape mode fully functional

### **4.2 Tablet Device Test Cases**

#### **TC-RES-003: Tablet Layout Adaptation**
- **Test Case ID**: TC-RES-003
- **Priority**: High
- **Category**: Responsive Design
- **Pre-conditions**: 
  - Access on tablet device (iPad, Android tablets)
- **Test Steps**:
  1. Test in both portrait and landscape orientations
  2. Verify card arrangements
  3. Test touch interactions
- **Expected Results**:
  - Layout adapts appropriately to screen size
  - Cards arranged optimally for tablet viewing
  - All functionality accessible via touch
  - Good use of available screen space
- **Test Data**: Various tablet sizes
- **Post-conditions**: Tablet experience optimized

### **4.3 Desktop Responsiveness Test Cases**

#### **TC-RES-004: Variable Desktop Widths**
- **Test Case ID**: TC-RES-004
- **Priority**: Medium
- **Category**: Responsive Design
- **Pre-conditions**: 
  - Desktop browser with resizable window
- **Test Steps**:
  1. Test at 1920x1080 resolution
  2. Test at 1366x768 resolution
  3. Test at 1024x768 resolution
  4. Gradually resize browser window
- **Expected Results**:
  - Layout adapts smoothly to different widths
  - Breakpoints trigger appropriate layout changes
  - No element overlap or cutoff at any width
  - Cards maintain proper spacing and alignment
- **Test Data**: Various screen resolutions
- **Post-conditions**: Desktop responsiveness verified

---

## **5. Performance Test Cases**

### **5.1 Page Load Performance Test Cases**

#### **TC-PERF-001: Initial Page Load Time**
- **Test Case ID**: TC-PERF-001
- **Priority**: High
- **Category**: Performance
- **Pre-conditions**: 
  - Standard network conditions
- **Test Steps**:
  1. Clear browser cache
  2. Navigate to Claims Corner
  3. Measure load time to fully interactive
- **Expected Results**:
  - Page loads within 3 seconds on normal network
  - First contentful paint < 1.5 seconds
  - Time to interactive < 3 seconds
  - No blocking resources delay interaction
- **Test Data**: Performance metrics baseline
- **Post-conditions**: Load performance acceptable

#### **TC-PERF-002: Large Dataset Performance**
- **Test Case ID**: TC-PERF-002
- **Priority**: Medium
- **Category**: Performance
- **Pre-conditions**: 
  - Employee with 100+ claims across multiple policies
- **Test Steps**:
  1. Load dashboard with large dataset
  2. Navigate to Claims Corner
  3. Measure rendering performance
- **Expected Results**:
  - Large datasets render within acceptable time
  - UI remains responsive during data loading
  - Pagination or virtualization handles large lists
  - Memory usage remains reasonable
- **Test Data**: Large claims dataset
- **Post-conditions**: Large dataset performance acceptable

### **5.2 Network Conditions Test Cases**

#### **TC-PERF-003: Slow Network Performance**
- **Test Case ID**: TC-PERF-003
- **Priority**: Medium
- **Category**: Performance
- **Pre-conditions**: 
  - Simulated slow 3G network conditions
- **Test Steps**:
  1. Enable slow network simulation
  2. Load dashboard and Claims Corner
  3. Test functionality under slow conditions
- **Expected Results**:
  - Loading indicators shown appropriately
  - Progressive loading of content
  - Essential functionality works despite slow network
  - Timeout handling prevents indefinite waits
- **Test Data**: Slow network simulation
- **Post-conditions**: Slow network handled gracefully

#### **TC-PERF-004: Offline/Connection Loss**
- **Test Case ID**: TC-PERF-004
- **Priority**: Medium
- **Category**: Performance
- **Pre-conditions**: 
  - Ability to simulate connection loss
- **Test Steps**:
  1. Load Claims Corner while online
  2. Disconnect network connection
  3. Attempt to interact with features
- **Expected Results**:
  - Offline state detected and indicated
  - Cached data remains accessible
  - Appropriate error messages for failed operations
  - Graceful reconnection when network restored
- **Test Data**: Offline state simulation
- **Post-conditions**: Offline handling appropriate

---

## **6. Security Test Cases**

### **6.1 Data Access Security Test Cases**

#### **TC-SEC-001: Employee Data Isolation**
- **Test Case ID**: TC-SEC-001
- **Priority**: Critical
- **Category**: Security
- **Pre-conditions**: 
  - Multiple employees with different policies
- **Test Steps**:
  1. Login as Employee A
  2. Attempt to access Employee B's claims data
  3. Verify data isolation
- **Expected Results**:
  - Employee can only see their own claims data
  - No access to other employees' information
  - Proper session management prevents data leakage
  - Authorization checks function correctly
- **Test Data**: Multiple employee accounts
- **Post-conditions**: Data isolation verified

#### **TC-SEC-002: Session Security**
- **Test Case ID**: TC-SEC-002
- **Priority**: High
- **Category**: Security
- **Pre-conditions**: 
  - User logged in with active session
- **Test Steps**:
  1. Login and access Claims Corner
  2. Let session timeout occur
  3. Attempt to access claims data
- **Expected Results**:
  - Session timeout properly enforced
  - User redirected to login after timeout
  - No cached sensitive data accessible
  - Secure session management
- **Test Data**: Session timeout configuration
- **Post-conditions**: Session security working

### **6.2 Data Transmission Security Test Cases**

#### **TC-SEC-003: HTTPS Enforcement**
- **Test Case ID**: TC-SEC-003
- **Priority**: High
- **Category**: Security
- **Pre-conditions**: 
  - Claims Corner accessible via web
- **Test Steps**:
  1. Attempt to access via HTTP
  2. Verify HTTPS redirect
  3. Check certificate validity
- **Expected Results**:
  - HTTP requests redirected to HTTPS
  - Valid SSL certificate in use
  - No sensitive data transmitted over unencrypted connection
  - Security headers properly configured
- **Test Data**: Network security tools
- **Post-conditions**: HTTPS properly enforced

#### **TC-SEC-004: API Security**
- **Test Case ID**: TC-SEC-004
- **Priority**: High
- **Category**: Security
- **Pre-conditions**: 
  - Claims data API endpoints
- **Test Steps**:
  1. Attempt to access API without authentication
  2. Test with invalid tokens
  3. Verify authorization checks
- **Expected Results**:
  - Unauthenticated requests rejected
  - Invalid tokens properly handled
  - Authorization verified for data access
  - Rate limiting prevents abuse
- **Test Data**: API security testing tools
- **Post-conditions**: API security verified

---

## **7. Edge Cases and Error Handling Test Cases**

### **7.1 Data Inconsistency Test Cases**

#### **TC-EDGE-001: Missing Policy Information**
- **Test Case ID**: TC-EDGE-001
- **Priority**: High
- **Category**: Edge Case
- **Pre-conditions**: 
  - Claims data exists but policy information incomplete
- **Test Steps**:
  1. Load Claims Corner with incomplete policy data
  2. Verify error handling
- **Expected Results**:
  - Appropriate error message or placeholder shown
  - System doesn't crash or show broken elements
  - Fallback behavior implemented
  - User can still access available functionality
- **Test Data**: Incomplete policy data
- **Post-conditions**: Graceful degradation

#### **TC-EDGE-002: Orphaned Claims Data**
- **Test Case ID**: TC-EDGE-002
- **Priority**: Medium
- **Category**: Edge Case
- **Pre-conditions**: 
  - Claims exist but cannot be linked to any policy
- **Test Steps**:
  1. Process orphaned claims data
  2. Verify system handling
- **Expected Results**:
  - Orphaned claims flagged for review
  - System continues to function for valid data
  - Error logging captures the issue
  - Admin notification sent if configured
- **Test Data**: Orphaned claims records
- **Post-conditions**: Orphaned data handled properly

#### **TC-EDGE-003: Conflicting Policy Data**
- **Test Case ID**: TC-EDGE-003
- **Priority**: Medium
- **Category**: Edge Case
- **Pre-conditions**: 
  - Same policy number has conflicting information
- **Test Steps**:
  1. Process conflicting policy data
  2. Verify conflict resolution
- **Expected Results**:
  - Conflict resolution logic applied correctly
  - Most recent data takes precedence (or defined rule)
  - Discrepancies logged for investigation
  - User sees consistent information
- **Test Data**: Conflicting policy records
- **Post-conditions**: Conflicts resolved appropriately

### **7.2 System Error Test Cases**

#### **TC-EDGE-004: Database Connection Failure**
- **Test Case ID**: TC-EDGE-004
- **Priority**: Critical
- **Category**: System Error
- **Pre-conditions**: 
  - Database connectivity can be interrupted
- **Test Steps**:
  1. Simulate database connection failure
  2. Attempt to access Claims Corner
- **Expected Results**:
  - Appropriate error message displayed
  - User informed about temporary unavailability
  - No sensitive information exposed in error
  - Graceful error handling without crash
- **Test Data**: Database connection simulation
- **Post-conditions**: Database errors handled gracefully

#### **TC-EDGE-005: IIRM Portal Sync Failure**
- **Test Case ID**: TC-EDGE-005
- **Priority**: High
- **Category**: System Error
- **Pre-conditions**: 
  - IIRM Portal sync can be simulated to fail
- **Test Steps**:
  1. Simulate sync failure with IIRM Portal
  2. Verify system behavior
- **Expected Results**:
  - Error logged appropriately
  - Last successful sync timestamp maintained
  - Users see last available data with notice
  - Retry mechanism available if configured
- **Test Data**: Sync failure simulation
- **Post-conditions**: Sync failures handled properly

#### **TC-EDGE-006: Partial Data Load Failure**
- **Test Case ID**: TC-EDGE-006
- **Priority**: Medium
- **Category**: System Error
- **Pre-conditions**: 
  - Some data loads successfully, others fail
- **Test Steps**:
  1. Simulate partial data loading failure
  2. Verify graceful degradation
- **Expected Results**:
  - Successfully loaded data displayed
  - Failed sections show appropriate error states
  - User can still access working functionality
  - Clear indication of what's unavailable
- **Test Data**: Partial failure simulation
- **Post-conditions**: Partial failures handled gracefully

### **7.3 User-Specific Edge Cases**

#### **TC-EDGE-007: Employee with No Policies**
- **Test Case ID**: TC-EDGE-007
- **Priority**: Medium
- **Category**: User Edge Case
- **Pre-conditions**: 
  - Employee has no active insurance policies
- **Test Steps**:
  1. Login as employee with no policies
  2. Attempt to access Claims Corner
- **Expected Results**:
  - Appropriate message about no active policies
  - Option to contact HR or administrator
  - No broken or empty elements
  - Clear guidance for user next steps
- **Test Data**: Employee with no policies
- **Post-conditions**: No policies case handled

#### **TC-EDGE-008: Employee with Expired Policies Only**
- **Test Case ID**: TC-EDGE-008
- **Priority**: Medium
- **Category**: User Edge Case
- **Pre-conditions**: 
  - Employee has only expired insurance policies
- **Test Steps**:
  1. Login as employee with expired policies
  2. Access Claims Corner
- **Expected Results**:
  - Historical claims data shown with appropriate context
  - Clear indication that policies are expired
  - No misleading current coverage information
  - Guidance about policy renewal
- **Test Data**: Employee with expired policies
- **Post-conditions**: Expired policies handled appropriately

#### **TC-EDGE-009: New Employee with No Claims History**
- **Test Case ID**: TC-EDGE-009
- **Priority**: Low
- **Category**: User Edge Case
- **Pre-conditions**: 
  - Employee newly enrolled with no claims history
- **Test Steps**:
  1. Login as new employee
  2. Access Claims Corner
- **Expected Results**:
  - Policy information displayed correctly
  - Empty state for claims shown appropriately
  - Welcome message or guidance for new users
  - Information about how claims will appear
- **Test Data**: New employee account
- **Post-conditions**: New user experience appropriate

### **7.4 Browser and Technology Edge Cases**

#### **TC-EDGE-010: JavaScript Disabled**
- **Test Case ID**: TC-EDGE-010
- **Priority**: Low
- **Category**: Technology Edge Case
- **Pre-conditions**: 
  - Browser with JavaScript disabled
- **Test Steps**:
  1. Disable JavaScript in browser
  2. Attempt to access Claims Corner
- **Expected Results**:
  - Graceful degradation or clear message about JavaScript requirement
  - Essential information still accessible if possible
  - No broken interface elements
  - Clear instructions for enabling JavaScript
- **Test Data**: Browser with disabled JavaScript
- **Post-conditions**: JavaScript dependency handled

#### **TC-EDGE-011: Very Old Browser Support**
- **Test Case ID**: TC-EDGE-011
- **Priority**: Low
- **Category**: Technology Edge Case
- **Pre-conditions**: 
  - Access from very old browser (IE 11, old mobile browsers)
- **Test Steps**:
  1. Test on minimum supported browser versions
  2. Verify basic functionality
- **Expected Results**:
  - Core functionality works on supported browsers
  - Graceful degradation for unsupported features
  - Clear browser upgrade messaging if needed
  - No complete failure of service
- **Test Data**: Old browser versions
- **Post-conditions**: Browser compatibility maintained

#### **TC-EDGE-012: Extremely Large Screen Resolutions**
- **Test Case ID**: TC-EDGE-012
- **Priority**: Low
- **Category**: Display Edge Case
- **Pre-conditions**: 
  - Very large screen resolution (4K, ultrawide monitors)
- **Test Steps**:
  1. Test on 4K resolution (3840x2160)
  2. Test on ultrawide monitors (3440x1440)
- **Expected Results**:
  - Layout scales appropriately for large screens
  - Content doesn't become too stretched or sparse
  - Readability maintained at large sizes
  - Proper use of available screen space
- **Test Data**: Large screen resolutions
- **Post-conditions**: Large screen support verified

---

## **Test Execution Guidelines**

### **Test Environment Requirements**
- **Browsers**: Chrome (latest 2 versions), Firefox (latest 2 versions), Safari (latest 2 versions), Edge (latest 2 versions)
- **Devices**: Desktop (1920x1080, 1366x768), Tablet (iPad, Android), Mobile (iPhone, Android)
- **Network**: High-speed, 3G simulation, offline scenarios
- **Data**: Complete test datasets for all policy combinations

### **Pre-Test Setup Checklist**
- [ ] IIRM Portal configured with test data
- [ ] IBP Portal sync functionality verified
- [ ] Test employee accounts created with various policy combinations
- [ ] Database connectivity confirmed
- [ ] Test environments properly configured

### **Test Execution Priority**
1. **Critical Path Tests** (TC-DSH-001 to TC-DSH-012, TC-CC-001 to TC-CC-006)
2. **Integration Tests** (TC-INT-001 to TC-INT-008)
3. **Responsive Design Tests** (TC-RES-001 to TC-RES-004)
4. **Performance Tests** (TC-PERF-001 to TC-PERF-004)
5. **Security Tests** (TC-SEC-001 to TC-SEC-004)
6. **Edge Cases** (TC-EDGE-001 to TC-EDGE-012)

### **Acceptance Criteria**
- [ ] All Critical and High priority test cases pass (100%)
- [ ] No critical or high-severity defects remain open
- [ ] Performance requirements met (page load < 3 seconds)
- [ ] Security requirements verified
- [ ] Cross-browser compatibility confirmed
- [ ] Mobile responsiveness validated
- [ ] Data integrity maintained across all scenarios

### **Test Reporting**
- Daily test execution status reports
- Defect summary with severity classification
- Performance metrics tracking
- Browser/device compatibility matrix
- Final test completion report with recommendations

---

**End of Test Cases Document**

*Total Test Cases: 72*
*Critical: 8, High: 35, Medium: 21, Low: 8*