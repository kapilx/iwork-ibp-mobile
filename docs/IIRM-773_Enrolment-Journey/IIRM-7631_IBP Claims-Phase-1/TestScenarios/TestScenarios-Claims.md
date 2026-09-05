# **Test Scenarios - Claims Summary & Claims Corner (Phase 1)**

## **Document Information**
- **Feature**: IIRM-7631 IBP Claims Corner (Phase 1)
- **Version**: 1.0
- **Date**: December 1, 2025
- **Scope**: Claims Summary Dashboard Widget & Claims Corner Screen

---

## **Test Scenario Categories**

1. [Dashboard Claims Summary Widget](#1-dashboard-claims-summary-widget)
2. [Claims Corner Screen](#2-claims-corner-screen)
3. [Policy Information and Coverage Utilization](#3-policy-information-and-coverage-utilization)
4. [Life Event Update Card](#4-life-event-update-card)
5. [Parental Policy Card](#5-parental-policy-card)
6. [Navigation and User Experience](#6-navigation-and-user-experience)
7. [Data Integration and Sync](#7-data-integration-and-sync)
8. [Edge Cases and Error Handling](#8-edge-cases-and-error-handling)

---

## **1. Dashboard Claims Summary Widget**

### **1.1 Widget Display Logic**

#### **TC-001: Multiple Policies Display**
- **Given**: Employee has multiple policies (GMC, GPA, GTL)
- **When**: Dashboard loads
- **Then**: 
  - Display separate widgets for each policy type
  - Each widget shows policy-specific data
  - Widgets are displayed as per design layout

#### **TC-002: Single Policy Display**
- **Given**: Employee has only one policy
- **When**: Dashboard loads
- **Then**: 
  - Display single widget for that policy
  - Side image adjusts for single record state
  - All relevant data is displayed correctly

#### **TC-003: No Claims Available - Widget Hidden**
- **Given**: Employee has policies but no claims data
- **When**: Dashboard loads
- **Then**: 
  - Claims Summary widget is not displayed
  - No empty widget appears on dashboard

#### **TC-004: No Claims Available - Empty State**
- **Given**: Employee has policies and widget is displayed but no claims exist
- **When**: Dashboard loads
- **Then**: 
  - Display empty state message: "No claims found for your policies."
  - Follow design specifications for empty state
  - Side image adjusts for zero state

### **1.2 Claim Status Summary Bar**

#### **TC-005: Total Claims Count Verification**
- **Given**: Employee has 5 claims (self + dependents)
- **When**: Dashboard displays claims widget
- **Then**: Total Claims shows count as 5

#### **TC-006: Settled Claims Count**
- **Given**: Employee has 3 settled claims, 2 pending claims
- **When**: Dashboard displays claims widget
- **Then**: 
  - Settled count shows 3
  - Pending count shows 2
  - Total count shows 5

#### **TC-007: Claims Status Calculation**
- **Given**: Claims data with various statuses (Settled, Pending, Rejected, Under Review)
- **When**: Dashboard calculates claim status summary
- **Then**: 
  - Only "Settled" status claims count in Settled
  - Only "Pending" status claims count in Pending
  - Other statuses are not counted separately

### **1.3 Policy Information Display**

#### **TC-008: GMC Policy Information**
- **Given**: Employee has GMC policy
- **When**: Claims widget displays
- **Then**: 
  - Policy Number is displayed correctly
  - Policy Expiry Date matches source data
  - Total Sum Insured amount is accurate
  - Policy Type shows as Base/Parent correctly

#### **TC-009: GPA/GTL Policy Information**
- **Given**: Employee has GPA or GTL policy
- **When**: Claims widget displays
- **Then**: 
  - "Family members covered" section is NOT displayed
  - Policy information is shown correctly
  - Claims data includes only employee (no dependents)

#### **TC-010: Available Amount Calculation**
- **Given**: 
  - Total Sum Insured: ₹5,00,000
  - Approved Claims: ₹1,50,000
- **When**: Dashboard calculates available amount
- **Then**: Available Amount displays ₹3,50,000

#### **TC-011: Total Claimed Amount Calculation**
- **Given**: Employee has multiple claims (self + dependents)
- **When**: Dashboard calculates total claimed amount
- **Then**: Sum of all claim amounts for employee and dependents is displayed

### **1.4 Recent Claims List**

#### **TC-012: Recent Claims Display**
- **Given**: Employee has multiple claims
- **When**: Claims widget shows recent claims
- **Then**: 
  - Member Name shows correctly (Self/Dependent Name)
  - Claim Requested Date matches source data
  - Claim Amount is accurate
  - Current Status reflects latest upload
  - Claim Reference Number is displayed

#### **TC-013: Self vs Dependent Claim Identification**
- **Given**: Claims for both employee and dependents
- **When**: Recent claims list is displayed
- **Then**: 
  - Employee claims show "Self" or employee name
  - Dependent claims show dependent name with relationship

### **1.5 Family Members Display (GMC Only)**

#### **TC-014: Family Members Covered - GMC Policy**
- **Given**: Employee has GMC policy with enrolled dependents
- **When**: Claims widget displays
- **Then**: 
  - Family Members Covered section is displayed
  - Shows member names with relationships
  - Data matches enrollment information

#### **TC-015: Family Members Covered - GPA/GTL Policy**
- **Given**: Employee has GPA or GTL policy
- **When**: Claims widget displays
- **Then**: Family Members Covered section is NOT displayed

### **1.6 GMC Base vs Parent Policy Display**

#### **TC-016: GMC Base and Parent Policy Cards**
- **Given**: Employee has both GMC base and parent policy
- **When**: Dashboard displays claims widget
- **Then**: 
  - Both policies shown on same card
  - Separate bifurcation of calculations
  - Clear division between base and parent data
  - Follows design specifications

#### **TC-017: GMC Base Policy Only**
- **Given**: Employee has only GMC base policy (no parent policy)
- **When**: Dashboard displays claims widget
- **Then**: 
  - Only base policy information is shown
  - No parent policy section appears
  - Single policy layout is used

### **1.7 Visual Elements**

#### **TC-018: Side Image Adjustment - Single Record**
- **Given**: Employee has one policy with claims
- **When**: Claims widget displays
- **Then**: Side image adjusts for single record state per design

#### **TC-019: Side Image Adjustment - Multiple Records**
- **Given**: Employee has multiple policies with claims
- **When**: Claims widgets display
- **Then**: Side images adjust for multiple records state per design

#### **TC-020: Side Image Adjustment - Zero State**
- **Given**: Employee has policies but no claims
- **When**: Empty state is displayed
- **Then**: Side image adjusts for zero state per design

---

## **2. Claims Corner Screen**

### **2.1 Navigation & Screen Loading**

#### **TC-021: Claims Corner Navigation**
- **Given**: User is on dashboard
- **When**: User clicks "Claims Corner" tab
- **Then**: 
  - Redirects to Claims Corner screen
  - URL changes appropriately
  - Screen loads completely

#### **TC-022: Claims Corner Screen Structure**
- **Given**: User navigates to Claims Corner
- **When**: Screen loads
- **Then**: 
  - Three primary sections are visible:
    1. Policy Information & Coverage Utilization
    2. Life Event Update Card
    3. Parental Policy (if applicable)

### **2.2 Policy Type Display Order**

#### **TC-023: Multiple Policy Types Display Order**
- **Given**: Employee has GMC, GPA, and GTL policies
- **When**: Claims Corner screen loads
- **Then**: 
  - Policies are displayed policy-type-wise
  - Order: GMC (Base first, then Parent), GPA, GTL
  - Each policy type has separate section

#### **TC-024: Single Policy Type Display**
- **Given**: Employee has only one policy type
- **When**: Claims Corner screen loads
- **Then**: 
  - Only that policy type section is displayed
  - Other policy sections are not shown

### **2.3 Layout Responsiveness**

#### **TC-025: Wide Screen Layout - GMC Base and Parent**
- **Given**: User accesses Claims Corner on wide screen
- **When**: GMC base and parent policies exist
- **Then**: 
  - Base and Parent policy cards displayed side-by-side
  - Proper spacing and alignment maintained

#### **TC-026: Mobile/Narrow Screen Layout - GMC Base and Parent**
- **Given**: User accesses Claims Corner on mobile/narrow screen
- **When**: GMC base and parent policies exist
- **Then**: 
  - Base and Parent policy cards stacked vertically
  - Base policy card appears first (top)
  - Parent policy card appears below

---

## **3. Policy Information and Coverage Utilization**

### **3.1 Data Consistency with Dashboard**

#### **TC-027: Claims Corner vs Dashboard Data Consistency**
- **Given**: Claims data is displayed on both dashboard and Claims Corner
- **When**: User compares information
- **Then**: 
  - All claim counts match between dashboard and Claims Corner
  - Policy information is identical
  - Coverage utilization data is consistent

#### **TC-028: Real-time Data Sync**
- **Given**: Claims data is updated in IIRM portal
- **When**: User refreshes Claims Corner
- **Then**: Updated information is reflected immediately

### **3.2 Policy-Specific Data Segregation**

#### **TC-029: GMC Base Policy Data Isolation**
- **Given**: Employee has both GMC base and parent policies
- **When**: Claims Corner displays base policy card
- **Then**: 
  - Only base policy data is used for calculations
  - No mixing with parent policy data
  - Claims count includes only base policy claims

#### **TC-030: GMC Parent Policy Data Isolation**
- **Given**: Employee has both GMC base and parent policies
- **When**: Claims Corner displays parent policy card
- **Then**: 
  - Only parent policy data is used for calculations
  - No mixing with base policy data
  - Claims count includes only parent policy claims

#### **TC-031: GPA Policy Data Display**
- **Given**: Employee has GPA policy
- **When**: Claims Corner displays GPA section
- **Then**: 
  - Only employee claims are included (no dependents)
  - Policy information specific to GPA
  - Coverage calculations for GPA only

#### **TC-032: GTL Policy Data Display**
- **Given**: Employee has GTL policy
- **When**: Claims Corner displays GTL section
- **Then**: 
  - Only employee claims are included (no dependents)
  - Policy information specific to GTL
  - Coverage calculations for GTL only

### **3.3 Empty State Handling**

#### **TC-033: Empty State Display**
- **Given**: Employee has policy but no claims
- **When**: Claims Corner loads policy section
- **Then**: 
  - Appropriate empty state message is displayed
  - Policy information is still shown
  - Coverage utilization shows zero claims

---

## **4. Life Event Update Card**

### **4.1 Card Display Logic**

#### **TC-034: Life Event Card Display for All Policy Types**
- **Given**: Employee has any policy type (GMC, GPA, GTL)
- **When**: Claims Corner screen loads
- **Then**: 
  - Life Event Update card is displayed for all policy types
  - Card appears in correct position per design

#### **TC-035: Life Event Card Content**
- **Given**: Life Event Update card is displayed
- **When**: User views the card
- **Then**: 
  - Appropriate message about updating dependents is shown
  - "Update Now" CTA button is visible and clickable
  - Card follows design specifications

### **4.2 CTA Functionality**

#### **TC-036: Update Now CTA Click**
- **Given**: Life Event Update card is displayed
- **When**: User clicks "Update Now" button
- **Then**: 
  - Navigation to In-Progress page occurs
  - URL changes appropriately
  - Proper transition/loading state

#### **TC-037: Update Now CTA Accessibility**
- **Given**: Life Event Update card is displayed
- **When**: User navigates using keyboard or screen reader
- **Then**: 
  - "Update Now" CTA is properly focusable
  - Appropriate ARIA labels are present
  - CTA is accessible via keyboard

---

## **5. Parental Policy Card**

### **5.1 Display Conditions**

#### **TC-038: Parental Policy Card - GMC with Parent Policy**
- **Given**: Employee has GMC policy with parent policy coverage
- **When**: Claims Corner loads
- **Then**: 
  - Parental Policy card is displayed
  - Card appears after Base GMC card
  - Separate calculations for parent policy

#### **TC-039: Parental Policy Card - GMC without Parent Policy**
- **Given**: Employee has GMC policy without parent policy coverage
- **When**: Claims Corner loads
- **Then**: 
  - Parental Policy card is NOT displayed
  - Only base GMC policy card appears

#### **TC-040: Parental Policy Card - GPA/GTL Policies**
- **Given**: Employee has only GPA or GTL policies
- **When**: Claims Corner loads
- **Then**: 
  - Parental Policy card is NOT displayed
  - Only applicable policy cards appear

### **5.2 Parent Policy Data Accuracy**

#### **TC-041: Parent Policy Claims Calculation**
- **Given**: Parent policy has specific claims data
- **When**: Parental Policy card displays
- **Then**: 
  - Claims count includes only parent policy claims
  - No mixing with base policy or other policy data
  - Accurate claim status breakdown

#### **TC-042: Parent Policy Coverage Information**
- **Given**: Parent policy has specific coverage details
- **When**: Parental Policy card displays
- **Then**: 
  - Policy Number specific to parent policy
  - Sum Insured amount for parent policy only
  - Available amount calculated for parent policy
  - Expiry date for parent policy

### **5.3 Card Ordering and Layout**

#### **TC-043: Desktop Layout - Parent Policy Ordering**
- **Given**: Employee has GMC base and parent policies on desktop
- **When**: Claims Corner displays
- **Then**: 
  - Base GMC card appears first (left side)
  - Parent Policy card appears after base card (right side)
  - Consistent ordering maintained

#### **TC-044: Mobile Layout - Parent Policy Ordering**
- **Given**: Employee has GMC base and parent policies on mobile
- **When**: Claims Corner displays
- **Then**: 
  - Base GMC card appears first (top)
  - Parent Policy card appears below base card
  - Consistent ordering maintained

---

## **6. Navigation and User Experience**

### **6.1 Page Loading Performance**

#### **TC-045: Initial Page Load Time**
- **Given**: User navigates to Claims Corner
- **When**: Page starts loading
- **Then**: 
  - Page loads within acceptable time limits
  - Loading indicators are shown appropriately
  - No broken elements during loading

#### **TC-046: Data Loading States**
- **Given**: Claims data is being fetched
- **When**: User is on Claims Corner screen
- **Then**: 
  - Appropriate loading states for each section
  - Skeleton loaders or spinners where applicable
  - Graceful data population

### **6.2 Responsive Design**

#### **TC-047: Mobile Responsiveness**
- **Given**: User accesses Claims Corner on mobile device
- **When**: Screen is viewed in portrait/landscape modes
- **Then**: 
  - All elements are properly sized and positioned
  - Text is readable without horizontal scrolling
  - Touch targets are appropriately sized

#### **TC-048: Tablet Responsiveness**
- **Given**: User accesses Claims Corner on tablet device
- **When**: Screen is viewed in various orientations
- **Then**: 
  - Layout adapts appropriately to screen size
  - Cards are properly arranged
  - All functionality remains accessible

#### **TC-049: Desktop Responsiveness**
- **Given**: User accesses Claims Corner on desktop with various screen sizes
- **When**: Browser window is resized
- **Then**: 
  - Layout adapts smoothly to different widths
  - Cards maintain proper spacing and alignment
  - No element overlap or cutoff

### **6.3 Browser Compatibility**

#### **TC-050: Cross-Browser Functionality**
- **Given**: Claims Corner is accessed from different browsers
- **When**: User interacts with all features
- **Then**: 
  - Consistent functionality across Chrome, Firefox, Safari, Edge
  - Visual elements render correctly
  - No browser-specific errors

---

## **7. Data Integration and Sync**

### **7.1 IIRM Portal Integration**

#### **TC-051: Claims Data Sync from IIRM Portal**
- **Given**: Claims data is uploaded to IIRM Portal
- **When**: IBP Portal syncs with IIRM
- **Then**: 
  - All claim records are accurately transferred
  - Data mapping is correct for all fields
  - No data loss or corruption occurs

#### **TC-052: Real-time Data Updates**
- **Given**: Claims status is updated in IIRM Portal
- **When**: IBP Portal checks for updates
- **Then**: 
  - Updated claim status is reflected in IBP
  - Dashboard and Claims Corner show updated information
  - Timestamp of last update is tracked

### **7.2 Policy Linking Accuracy**

#### **TC-053: Employee-Policy Linking**
- **Given**: Claims data contains employee and policy information
- **When**: Data is processed in IBP Portal
- **Then**: 
  - Claims are correctly linked to respective employees
  - Policy associations are accurate
  - No cross-linking errors occur

#### **TC-054: Dependent Claims Linking**
- **Given**: Claims data includes dependent information
- **When**: Data is processed for GMC policies
- **Then**: 
  - Dependent claims are linked to correct employee
  - Relationship information is preserved
  - Dependent names are displayed correctly

### **7.3 Data Field Validation**

#### **TC-055: Required Claims Data Fields**
- **Given**: Claims data file is uploaded to IIRM
- **When**: File is processed
- **Then**: 
  - All required fields are present: Policy Number, Policy Expiry Date, Total Sum Insured, Policy Type, Available Amount
  - Data validation prevents missing critical information
  - Error handling for incomplete data

#### **TC-056: Data Type Validation**
- **Given**: Claims data contains various field types
- **When**: Data is imported and displayed
- **Then**: 
  - Dates are formatted correctly
  - Currency amounts display with proper formatting
  - Text fields are handled appropriately
  - Numeric calculations are accurate

---

## **8. Edge Cases and Error Handling**

### **8.1 Data Inconsistencies**

#### **TC-057: Missing Policy Information**
- **Given**: Claims data exists but policy information is incomplete
- **When**: Claims Corner attempts to display data
- **Then**: 
  - Appropriate error message or placeholder is shown
  - System doesn't crash or show broken elements
  - Fallback behavior is implemented

#### **TC-058: Orphaned Claims Data**
- **Given**: Claims exist but cannot be linked to any policy
- **When**: Claims data is processed
- **Then**: 
  - Orphaned claims are flagged for review
  - System continues to function for valid data
  - Error logging captures the issue

#### **TC-059: Conflicting Policy Data**
- **Given**: Same policy number has conflicting information across claims
- **When**: System processes the data
- **Then**: 
  - Conflict resolution logic is applied
  - Most recent data takes precedence
  - Discrepancies are logged for investigation

### **8.2 System Errors**

#### **TC-060: Database Connection Failure**
- **Given**: Database connectivity is lost
- **When**: User tries to access Claims Corner
- **Then**: 
  - Appropriate error message is displayed
  - User is informed about temporary unavailability
  - No sensitive information is exposed

#### **TC-061: IIRM Portal Sync Failure**
- **Given**: Sync with IIRM Portal fails
- **When**: System attempts data refresh
- **Then**: 
  - Error is logged appropriately
  - Last successful sync timestamp is maintained
  - Users see last available data with appropriate notice

#### **TC-062: Partial Data Load Failure**
- **Given**: Some claims data loads successfully, others fail
- **When**: Claims Corner displays
- **Then**: 
  - Successfully loaded data is displayed
  - Failed sections show appropriate error states
  - User can still access working functionality

### **8.3 User-Specific Edge Cases**

#### **TC-063: Employee with No Policies**
- **Given**: Employee has no active insurance policies
- **When**: User tries to access Claims Corner
- **Then**: 
  - Appropriate message about no active policies
  - Option to contact HR or administrator
  - No broken or empty elements

#### **TC-064: Employee with Expired Policies Only**
- **Given**: Employee has only expired insurance policies
- **When**: Claims Corner loads
- **Then**: 
  - Historical claims data may be shown with appropriate context
  - Clear indication that policies are expired
  - No misleading current coverage information

#### **TC-065: New Employee with No Claims History**
- **Given**: Employee is newly enrolled with no claims history
- **When**: Claims Corner loads
- **Then**: 
  - Policy information is displayed correctly
  - Empty state for claims is shown appropriately
  - Welcome message or guidance for new users

### **8.4 Future Compatibility**

#### **TC-066: Optional Plans Placeholder**
- **Given**: System is designed for future optional plans
- **When**: Current implementation is tested
- **Then**: 
  - No breaking changes occur when optional plans are added
  - Card structure accommodates additional plan types
  - Database schema supports plan extensions

#### **TC-067: Additional Policy Types**
- **Given**: New policy types may be introduced in future
- **When**: System processes unknown policy types
- **Then**: 
  - Graceful handling of unknown policy types
  - No system crashes or data corruption
  - Fallback display mechanisms work correctly

---

## **Test Data Requirements**

### **Sample Test Data Sets**

#### **Dataset 1: Complete Multi-Policy Employee**
- Employee with GMC (Base + Parent), GPA, and GTL policies
- Multiple claims in different statuses (Settled, Pending)
- Claims for both employee and dependents
- Recent and older claims

#### **Dataset 2: GMC Only Employee**
- Employee with only GMC Base policy
- Mix of settled and pending claims
- Multiple dependents enrolled
- Claims for different family members

#### **Dataset 3: Single Policy Employee**
- Employee with only GPA or GTL policy
- Limited claims history
- No dependents (for GPA/GTL testing)

#### **Dataset 4: Edge Case Employee**
- Employee with expired policies
- Orphaned claims data
- Missing or incomplete policy information
- Data consistency issues

---

## **Test Environment Requirements**

### **Browser Testing Matrix**
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### **Device Testing Matrix**
- Desktop: 1920x1080, 1366x768, 2560x1440
- Tablet: iPad, Android tablets (various sizes)
- Mobile: iPhone (various models), Android phones (various sizes)

### **Network Conditions**
- High-speed internet
- Slow 3G simulation
- Intermittent connectivity
- Offline scenarios

---

## **Acceptance Criteria Verification**

### **Phase 1 Deliverables**
- [ ] Claims Summary on Dashboard - All test scenarios pass
- [ ] Claims Corner screen view - All test scenarios pass
- [ ] Policy-wise claim display - All test scenarios pass
- [ ] Data integration from IIRM Portal - All test scenarios pass
- [ ] Responsive design implementation - All test scenarios pass

### **Quality Gates**
- [ ] All functional test scenarios pass (100%)
- [ ] No critical or high-severity defects
- [ ] Performance requirements met
- [ ] Accessibility standards compliance
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness confirmed

---

## **Test Execution Guidelines**

### **Pre-Test Setup**
1. Ensure IIRM Portal has test claims data uploaded
2. Configure IBP Portal sync with IIRM
3. Set up test employee accounts with various policy combinations
4. Verify database connectivity and data integrity

### **Test Execution Order**
1. Data Integration & Sync tests (TC-051 to TC-056)
2. Dashboard Claims Summary tests (TC-001 to TC-020)
3. Claims Corner Navigation tests (TC-021 to TC-026)
4. Policy Information tests (TC-027 to TC-033)
5. Life Event Update tests (TC-034 to TC-037)
6. Parental Policy tests (TC-038 to TC-044)
7. User Experience tests (TC-045 to TC-049)
8. Cross-browser tests (TC-050)
9. Edge Cases tests (TC-057 to TC-067)

### **Post-Test Activities**
1. Document all defects found during testing
2. Verify defect fixes with targeted retesting
3. Conduct final regression testing
4. Prepare test completion report
5. Update test scenarios based on any requirement changes

---

**End of Test Scenarios Document**