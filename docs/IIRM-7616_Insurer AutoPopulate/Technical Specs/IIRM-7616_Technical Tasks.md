# Technical Task List: IIRM-7616 - Record Insurer and Co-Insurer Details

**Jira Ticket**: IIRM-7616  
**Requirements Doc**: [IIRM-7616_Story_Record Insurer and Co-Insurer Details.md](./IIRM-7616_Story_Record%20Insurer%20and%20Co-Insurer%20Details.md)  
**Date Created**: November 7, 2025  
**Status**: Ready for Development Planning  

---

## Table of Contents

1. [Overview](#overview)
2. [Database Tasks](#database-tasks)
3. [Backend Tasks](#backend-tasks)
4. [Frontend Tasks](#frontend-tasks)
5. [Testing Tasks](#testing-tasks)
6. [Documentation Tasks](#documentation-tasks)
7. [Deployment Tasks](#deployment-tasks)
8. [Effort Estimation](#effort-estimation)
9. [Dependencies](#dependencies)
10. [Risk Assessment](#risk-assessment)

---

## Overview

This document breaks down the implementation tasks for IIRM-7616 into granular, actionable items organized by technology layer.

### Feature Breakdown

**Part 1**: Auto-populate Preferred Insurers (RFP → Broking Slip)  
**Part 2**: Insurer Share and Brokerage Details (Final Negotiation)

---

## Database Tasks

### DB-1: Schema Validation & Updates

#### DB-1.1: Add Missing Column to `opportunity_final_negotiation_sharing_detail`
- **Priority**: High
- **Estimated Effort**: 2 hours
- **Description**: Add `share_amount` column to store calculated premium share amount
- **Tasks**:
  - [ ] Create migration script to add `share_amount NUMERIC(19,2)` column
  - [ ] Test migration on local database
  - [ ] Verify existing data integrity after migration
  - [ ] Create rollback script

**Migration Script** (PostgreSQL):
```sql
-- Migration: Add share_amount to opportunity_final_negotiation_sharing_detail
ALTER TABLE opportunity_final_negotiation_sharing_detail
ADD COLUMN share_amount NUMERIC(19,2);

COMMENT ON COLUMN opportunity_final_negotiation_sharing_detail.share_amount 
IS 'Calculated premium share amount based on share_percentage and basic premium';

-- Rollback script
-- ALTER TABLE opportunity_final_negotiation_sharing_detail DROP COLUMN share_amount;
```

#### DB-1.2: Verify Existing Columns in `opportunity_final_negotiation`
- **Priority**: Medium
- **Estimated Effort**: 1 hour
- **Description**: Validate that required columns exist
- **Tasks**:
  - [x] ✅ Verified `policy_placed_type_lid` exists
  - [x] ✅ Verified `lead_insurer_id` exists
  - [x] ✅ Verified `is_lead_insurer_pay_commission_lid` exists
  - [ ] Verify data types match requirements
  - [ ] Check foreign key constraints
  - [ ] Validate nullable constraints

**Status**: ✅ **All required columns already exist** - No migration needed for main table

#### DB-1.3: Create Database Indexes
- **Priority**: Medium
- **Estimated Effort**: 1 hour
- **Description**: Add indexes for performance optimization
- **Tasks**:
  - [ ] Add index on `opportunity_final_negotiation.lead_insurer_id`
  - [ ] Add composite index on `opportunity_final_negotiation_sharing_detail (opportunity_final_negotiation_id, insurer_id)`
  - [ ] Test query performance with indexes

```sql
-- Create indexes for better query performance
CREATE INDEX idx_oppty_final_neg_lead_insurer 
ON opportunity_final_negotiation(lead_insurer_id);

CREATE INDEX idx_oppty_final_neg_sharing_composite 
ON opportunity_final_negotiation_sharing_detail(opportunity_final_negotiation_id, insurer_id);
```

---

## Backend Tasks

### BE-1: Entity Updates

#### BE-1.1: Update `OpportunityFinalNegotiationSharingDetail` Entity
- **Priority**: High
- **Estimated Effort**: 1 hour
- **File**: `apps/services/service-lib/src/lib/entities/opportunity-final-negotiation-sharing-detail.entity.ts`
- **Tasks**:
  - [ ] Add `shareAmount` property with `@Column` decorator
  - [ ] Update TypeScript interface/type definitions
  - [ ] Run `npm run build` to verify compilation
  - [ ] Update any related DTOs

**Code Change**:
```typescript
// Add after line 18 (sharePercentage)
@Column({ name: 'share_amount', type: 'numeric', nullable: true })
shareAmount: number;
```

#### BE-1.2: Verify `OpportunityFinalNegotiation` Entity Fields
- **Priority**: Medium
- **Estimated Effort**: 30 minutes
- **File**: `apps/services/service-lib/src/lib/entities/opportunity-final-negotiation.entity.ts`
- **Tasks**:
  - [x] ✅ Verified `policyPlacedTypeLid` exists (line 46)
  - [x] ✅ Verified `leadInsurerId` exists (line 49)
  - [x] ✅ Verified `isLeadInsurerPayCommissionLid` exists (line 53)
  - [ ] Verify foreign key relationships
  - [ ] Check if eager/lazy loading is configured correctly

**Status**: ✅ **No entity changes needed** - All fields present

---

### BE-2: Service Layer - Part 1 (Auto-populate)

#### BE-2.1: Create/Update Broking Slip Service Methods
- **Priority**: High
- **Estimated Effort**: 4 hours
- **Service**: `ibp-service` or relevant service handling broking slip
- **Tasks**:
  - [ ] Create method `getPreferredInsurersFromRFP(opportunityId: number)`
  - [ ] Query `brokingslip_version_preferred_insurer_detail` table
  - [ ] Map entity data to DTO
  - [ ] Handle empty result scenarios
  - [ ] Add error handling and logging
  - [ ] Write unit tests

**Pseudo-code**:
```typescript
async getPreferredInsurersFromRFP(opportunityId: number): Promise<PreferredInsurerDto[]> {
  // Query brokingslip_version_preferred_insurer_detail
  // Join with insurer, contact, location, branch tables
  // Map to DTO with all required fields
  // Return array of preferred insurers
}
```

#### BE-2.2: Create Endpoint to Fetch Preferred Insurers
- **Priority**: High
- **Estimated Effort**: 2 hours
- **Endpoint**: `GET /api/opportunities/{opportunityId}/preferred-insurers`
- **Tasks**:
  - [ ] Create controller method
  - [ ] Add route with proper guards/decorators
  - [ ] Implement request validation
  - [ ] Add Swagger/OpenAPI documentation
  - [ ] Test with Postman/Thunder Client

---

### BE-3: Service Layer - Part 2 (Insurer Share & Brokerage)

#### BE-3.1: Create DTOs for Insurer Details
- **Priority**: High
- **Estimated Effort**: 2 hours
- **Location**: `apps/services/*/src/dto/`
- **Tasks**:
  - [ ] Create `InsurerDetailsDto` for main section fields
  - [ ] Create `InsurerShareBrokerageDto` for sub-section fields
  - [ ] Add validation decorators (class-validator)
  - [ ] Implement custom validators for:
    - Total premium share = 100%
    - Minimum 2 insurers for "Multiple" type
    - No duplicate insurers
    - Decimal precision (2 places)
    - Zero/negative value checks

**Example DTO**:
```typescript
export class InsurerDetailsDto {
  @IsNotEmpty()
  @IsEnum(['Single', 'Multiple'])
  policyPlacedType: string;

  @IsNotEmpty()
  @IsNumber()
  leadInsurerId: number;

  @IsNotEmpty()
  @IsBoolean()
  onlyLeadPaysBrokerage: boolean;

  @ValidateNested({ each: true })
  @Type(() => InsurerShareBrokerageDto)
  insurerDetails: InsurerShareBrokerageDto[];
}

export class InsurerShareBrokerageDto {
  @IsNotEmpty()
  insurerId: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Max(100)
  premiumSharePercentage: number;

  @IsOptional()
  shareAmount?: number; // Calculated field

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  @Max(100)
  insurerBrokeragePercentage: number;

  @IsOptional()
  brokerageAmount?: number; // Calculated field
}
```

#### BE-3.2: Create Custom Validators
- **Priority**: High
- **Estimated Effort**: 3 hours
- **Tasks**:
  - [ ] `@TotalPremiumShare100()` - Validate sum = 100%
  - [ ] `@MinimumInsurersForMultiple()` - Validate >= 2 for Multiple type
  - [ ] `@NoDuplicateInsurers()` - Check unique insurerIds
  - [ ] `@DecimalPrecision(2)` - Validate max 2 decimal places

#### BE-3.3: Implement Business Logic Services
- **Priority**: High
- **Estimated Effort**: 6 hours
- **Service**: `opportunity-service` or relevant service
- **Tasks**:
  - [ ] Create `InsurerDetailsService`
  - [ ] Method: `saveInsurerDetails(dto: InsurerDetailsDto)`
  - [ ] Method: `calculateShareAmount(basicPremium, sharePercentage)`
  - [ ] Method: `calculateBrokerageAmount(shareAmount, brokeragePercentage)`
  - [ ] Method: `validateInsurerDetails(dto: InsurerDetailsDto)`
  - [ ] Method: `getInsurerDetails(finalNegotiationId: number)`
  - [ ] Implement two-way binding logic for lead insurer
  - [ ] Handle single vs multiple insurer scenarios
  - [ ] Add transaction support for atomic saves
  - [ ] Write comprehensive unit tests

**Pseudo-code**:
```typescript
async saveInsurerDetails(
  finalNegotiationId: number,
  dto: InsurerDetailsDto,
  basicPremium: number
): Promise<void> {
  // Start transaction
  // Update opportunity_final_negotiation main fields
  // Delete existing sharing_detail records
  // For each insurer in dto.insurerDetails:
  //   - Calculate shareAmount
  //   - Calculate brokerageAmount
  //   - Insert into opportunity_final_negotiation_sharing_detail
  // Commit transaction
  // Return success
}
```

#### BE-3.4: Create API Endpoints
- **Priority**: High
- **Estimated Effort**: 3 hours
- **Endpoints**:
  - [ ] `POST /api/final-negotiation/{id}/insurer-details` - Save insurer details
  - [ ] `GET /api/final-negotiation/{id}/insurer-details` - Retrieve insurer details
  - [ ] `PUT /api/final-negotiation/{id}/insurer-details` - Update insurer details
  - [ ] Add proper authentication & authorization
  - [ ] Add request/response logging
  - [ ] Document in Swagger/OpenAPI

---

### BE-4: Data Retrieval & Validation

#### BE-4.1: Fetch Basic Premium and Total Brokerage
- **Priority**: High
- **Estimated Effort**: 2 hours
- **Tasks**:
  - [ ] Identify source table/entity for Basic Premium
  - [ ] Identify source table/entity for Total Brokerage
  - [ ] Create method to fetch these values by `finalNegotiationId`
  - [ ] Handle scenarios where values are missing
  - [ ] Return informational messages when data unavailable

#### BE-4.2: Implement Real-time Validation Endpoints
- **Priority**: Medium
- **Estimated Effort**: 3 hours
- **Endpoints**:
  - [ ] `POST /api/final-negotiation/validate-premium-share` - Validate total = 100%
  - [ ] `POST /api/final-negotiation/validate-insurer-duplicate` - Check duplicates
  - [ ] Enable frontend to call these for real-time feedback

---

### BE-5: Audit Trail Implementation

#### BE-5.1: Create Audit Logging
- **Priority**: Medium
- **Estimated Effort**: 3 hours
- **Tasks**:
  - [ ] Use existing audit framework or create new
  - [ ] Log all changes to `opportunity_final_negotiation`
  - [ ] Log all changes to `opportunity_final_negotiation_sharing_detail`
  - [ ] Capture: field name, old value, new value, user, timestamp
  - [ ] Create endpoint to view audit history

---

## Frontend Tasks

### FE-1: Part 1 - Auto-populate Preferred Insurers

#### FE-1.1: Update Broking Slip Generation Form Config
- **Priority**: High
- **Estimated Effort**: 4 hours
- **File**: `apps/ui/iwork/src/app/pages/OpportunityActivities/Activities/BrokingSlipGeneration/VersionForm/config.ts`
- **Tasks**:
  - [ ] Uncomment `isMultiple: true` on line ~285 (currently commented)
  - [ ] Add `onLoad` or `useEffect` hook to fetch preferred insurers
  - [ ] Call backend API: `GET /api/opportunities/{id}/preferred-insurers`
  - [ ] Pre-populate form fields with fetched data
  - [ ] Ensure all fields remain editable
  - [ ] Maintain ability to add/remove insurers
  - [ ] Test with multiple insurers from RFP
  - [ ] Test with zero insurers from RFP

**Pseudo-code**:
```typescript
useEffect(() => {
  if (opportunityId) {
    fetchPreferredInsurers(opportunityId).then(insurers => {
      setFieldValue('preferredInsurers', insurers);
    });
  }
}, [opportunityId]);
```

#### FE-1.2: Handle Empty State
- **Priority**: Medium
- **Estimated Effort**: 1 hour
- **Tasks**:
  - [ ] Show empty section when no RFP insurers exist
  - [ ] Display helpful message: "No preferred insurers from RFP. You can add manually."
  - [ ] Ensure "[+ Add Insurer]" button is visible

---

### FE-2: Part 2 - Insurer Details Section

#### FE-2.1: Create Form Configuration for Insurer Details Section
- **Priority**: High
- **Estimated Effort**: 8 hours
- **Location**: Create new config file or add to existing Final Negotiation config
- **File**: `apps/ui/iwork/src/app/pages/OpportunityActivities/Activities/FinalNegotiation/InsurerDetailsConfig.ts`
- **Tasks**:
  - [ ] Create main section fields (3 fields):
    - Policy Placed Type (dropdown)
    - Select Lead Insurer (dropdown) - **MANDATORY**
    - Only Lead Insurer Pays Brokerage (radio/toggle)
  - [ ] Create sub-section repeatable fields (5 fields per row):
    - Insurer Name (dropdown with two-way binding)
    - Premium Share % (number input)
    - Premium Share Amount (calculated, read-only)
    - Insurer Brokerage % (number input)
    - Insurer Brokerage Amount (calculated, read-only)
  - [ ] Add "[+ Add Another Insurer]" button
  - [ ] Add "Remove" button for each row
  - [ ] Configure field dependencies and conditional rendering

#### FE-2.2: Implement Two-Way Binding for Lead Insurer
- **Priority**: High
- **Estimated Effort**: 3 hours
- **Tasks**:
  - [ ] Watch "Select Lead Insurer" field changes
  - [ ] Auto-populate first row "Insurer Name" when lead insurer selected
  - [ ] Watch first row "Insurer Name" changes
  - [ ] Auto-populate "Select Lead Insurer" when first row insurer selected
  - [ ] Handle conflicts gracefully
  - [ ] Test both scenarios thoroughly

**Pseudo-code**:
```typescript
// Watch Lead Insurer field
useEffect(() => {
  if (leadInsurerId && !insurerDetails[0]?.insurerId) {
    setFieldValue('insurerDetails.0.insurerId', leadInsurerId);
  }
}, [leadInsurerId]);

// Watch first row Insurer Name
useEffect(() => {
  if (insurerDetails[0]?.insurerId && !leadInsurerId) {
    setFieldValue('leadInsurerId', insurerDetails[0].insurerId);
  }
}, [insurerDetails[0]?.insurerId]);
```

#### FE-2.3: Implement Auto-Calculations
- **Priority**: High
- **Estimated Effort**: 4 hours
- **Tasks**:
  - [ ] Calculate Premium Share Amount = Basic Premium × (Share % ÷ 100)
  - [ ] Calculate Insurer Brokerage Amount = Share Amount × (Brokerage % ÷ 100)
  - [ ] Update calculations on any percentage change
  - [ ] Display calculated values in read-only fields
  - [ ] Format currency properly (₹X,XX,XXX.XX)
  - [ ] Show total rows at bottom:
    - Total Premium Share %
    - Total Premium Share Amount
    - Total Insurer Brokerage Amount

**Calculation Functions**:
```typescript
const calculateShareAmount = (basicPremium: number, sharePercentage: number) => {
  return (basicPremium * sharePercentage) / 100;
};

const calculateBrokerageAmount = (shareAmount: number, brokeragePercentage: number) => {
  return (shareAmount * brokeragePercentage) / 100;
};
```

#### FE-2.4: Implement Single vs Multiple Insurer Logic
- **Priority**: High
- **Estimated Effort**: 3 hours
- **Tasks**:
  - [ ] When "Single" selected:
    - Show only lead insurer row
    - Set Premium Share % to 100% (read-only)
    - Hide "[+ Add Another Insurer]" button
    - If "Only Lead Pays Brokerage" = Yes:
      - Set Brokerage % to 100% (read-only)
      - Calculate Brokerage Amount based on Total Brokerage
    - If "Only Lead Pays Brokerage" = No:
      - Allow manual Brokerage % entry
  - [ ] When "Multiple" selected:
    - Enable "[+ Add Another Insurer]" button
    - Make Premium Share % editable
    - Require minimum 2 insurers
  - [ ] Handle switching between Single ↔ Multiple
    - Show confirmation dialog when switching to Single (will remove co-insurers)

#### FE-2.5: Implement Add/Remove Insurer Rows
- **Priority**: High
- **Estimated Effort**: 2 hours
- **Tasks**:
  - [ ] "[+ Add Another Insurer]" button:
    - Add new empty row to array
    - Initialize with empty values
    - Scroll to new row
  - [ ] "Remove" button:
    - Remove row from array
    - Recalculate totals
    - Prevent deletion of last insurer (show error)
    - If removing insurer that's in another row, handle gracefully

#### FE-2.6: Implement Dropdown Population
- **Priority**: High
- **Estimated Effort**: 2 hours
- **Tasks**:
  - [ ] Fetch Preferred Insurers from Broking Slip
  - [ ] Populate "Select Lead Insurer" dropdown
  - [ ] Populate "Insurer Name" dropdowns in sub-section
  - [ ] Handle empty preferred insurers scenario
  - [ ] Show warning: "No Preferred Insurers found..."
  - [ ] Optionally: Allow selection from complete insurer master list

---

### FE-3: Validations (Client-Side)

#### FE-3.1: Implement Field-Level Validations
- **Priority**: High
- **Estimated Effort**: 4 hours
- **Tasks**:
  - [ ] Policy Placed Type - Required
  - [ ] Select Lead Insurer - Required (with custom error message)
  - [ ] Only Lead Pays Brokerage - Required
  - [ ] Premium Share % - Required, > 0, <= 100, max 2 decimals
  - [ ] Insurer Brokerage % - Required, >= 0, <= 100, max 2 decimals
  - [ ] Show inline error messages below fields
  - [ ] Highlight invalid fields in red
  - [ ] Disable save button when validation fails

**Validation Schema (Yup)**:
```typescript
const validationSchema = Yup.object({
  policyPlacedType: Yup.string().required('Policy Placed Type is required'),
  leadInsurerId: Yup.number().required('Select Lead Insurer is required'),
  onlyLeadPaysBrokerage: Yup.boolean().required('This selection is required'),
  insurerDetails: Yup.array().of(
    Yup.object({
      insurerId: Yup.number().required('Insurer Name is required'),
      premiumSharePercentage: Yup.number()
        .required('Premium Share % is required')
        .min(0.01, 'Must be greater than 0')
        .max(100, 'Cannot exceed 100%')
        .test('decimal-precision', 'Max 2 decimal places', (value) => {
          return /^\d+(\.\d{1,2})?$/.test(value?.toString() || '');
        }),
      insurerBrokeragePercentage: Yup.number()
        .required('Brokerage % is required')
        .min(0, 'Cannot be negative')
        .max(100, 'Cannot exceed 100%')
        .test('decimal-precision', 'Max 2 decimal places', (value) => {
          return /^\d+(\.\d{1,2})?$/.test(value?.toString() || '');
        }),
    })
  )
});
```

#### FE-3.2: Implement Business Rule Validations
- **Priority**: High
- **Estimated Effort**: 4 hours
- **Tasks**:
  - [ ] Total Premium Share = 100% validation
    - Calculate total in real-time
    - Show total with color coding (green if 100%, red otherwise)
    - Display error: "Total must equal 100%. Current: XX%"
    - Disable save if not 100%
  - [ ] Minimum insurers for Multiple type
    - If Multiple selected and < 2 insurers, show error
    - Disable save button
  - [ ] No duplicate insurers
    - Check insurerId array for duplicates
    - Disable duplicate options in dropdowns
    - Show error if duplicate detected
  - [ ] Brokerage total validation (informational only)
    - Calculate total insurer brokerage
    - Compare with Total Brokerage from previous steps
    - Show informational message if different (don't block save)

#### FE-3.3: Real-time Validation Feedback
- **Priority**: Medium
- **Estimated Effort**: 2 hours
- **Tasks**:
  - [ ] Show total premium share % in real-time
  - [ ] Color code: Green (100%), Red (< 100% or > 100%)
  - [ ] Show running total for brokerage amount
  - [ ] Display checkmarks (✓) for valid sections
  - [ ] Display warning icons (⚠️) for informational messages

---

### FE-4: UI/UX Enhancements

#### FE-4.1: Create UI Components
- **Priority**: Medium
- **Estimated Effort**: 6 hours
- **Tasks**:
  - [ ] Create `InsurerDetailsSection` component
  - [ ] Create `InsurerShareRow` component (repeatable)
  - [ ] Create `TotalSummaryRow` component
  - [ ] Style according to design system
  - [ ] Ensure responsive design
  - [ ] Add loading states
  - [ ] Add empty states
  - [ ] Add error states

#### FE-4.2: Implement User Guidance
- **Priority**: Low
- **Estimated Effort**: 2 hours
- **Tasks**:
  - [ ] Add tooltips for complex fields
  - [ ] Add help text for calculated fields
  - [ ] Show informational messages for warnings
  - [ ] Add confirmation dialogs for:
    - Switching from Multiple to Single
    - Removing insurer rows
  - [ ] Show success toast on save

#### FE-4.3: Accessibility
- **Priority**: Low
- **Estimated Effort**: 2 hours
- **Tasks**:
  - [ ] Add ARIA labels to form fields
  - [ ] Ensure keyboard navigation works
  - [ ] Test with screen readers
  - [ ] Ensure sufficient color contrast
  - [ ] Add focus indicators

---

### FE-5: Data Persistence

#### FE-5.1: Implement Save Functionality
- **Priority**: High
- **Estimated Effort**: 3 hours
- **Tasks**:
  - [ ] Create `saveInsurerDetails()` function
  - [ ] Call backend API: `POST /api/final-negotiation/{id}/insurer-details`
  - [ ] Send complete DTO with all fields
  - [ ] Handle success response (show toast, update state)
  - [ ] Handle error response (show errors, keep form in edit mode)
  - [ ] Implement retry logic for network failures

#### FE-5.2: Implement Data Retrieval
- **Priority**: High
- **Estimated Effort**: 2 hours
- **Tasks**:
  - [ ] On component mount, fetch existing data
  - [ ] Call backend API: `GET /api/final-negotiation/{id}/insurer-details`
  - [ ] Populate form with retrieved data
  - [ ] Handle empty state (new record)
  - [ ] Calculate and display all calculated fields

#### FE-5.3: Implement Edit Mode
- **Priority**: Medium
- **Estimated Effort**: 2 hours
- **Tasks**:
  - [ ] Enable edit mode for existing records
  - [ ] Show current values in form
  - [ ] Allow modification of all editable fields
  - [ ] Recalculate on changes
  - [ ] Save updated values via PUT endpoint
  - [ ] Track dirty state (unsaved changes)
  - [ ] Show warning if navigating away with unsaved changes

---

## Testing Tasks

### TEST-1: Backend Testing

#### TEST-1.1: Unit Tests for Services
- **Priority**: High
- **Estimated Effort**: 6 hours
- **Tasks**:
  - [ ] Test `getPreferredInsurersFromRFP()` - various scenarios
  - [ ] Test `saveInsurerDetails()` - single insurer
  - [ ] Test `saveInsurerDetails()` - multiple insurers
  - [ ] Test `calculateShareAmount()` - edge cases
  - [ ] Test `calculateBrokerageAmount()` - edge cases
  - [ ] Test validation logic - all business rules
  - [ ] Test error handling - missing data, invalid data
  - [ ] Achieve minimum 80% code coverage

#### TEST-1.2: Integration Tests for APIs
- **Priority**: High
- **Estimated Effort**: 4 hours
- **Tasks**:
  - [ ] Test GET `/api/opportunities/{id}/preferred-insurers`
  - [ ] Test POST `/api/final-negotiation/{id}/insurer-details`
  - [ ] Test GET `/api/final-negotiation/{id}/insurer-details`
  - [ ] Test PUT `/api/final-negotiation/{id}/insurer-details`
  - [ ] Test with valid and invalid payloads
  - [ ] Test authentication & authorization
  - [ ] Test rate limiting (if applicable)

#### TEST-1.3: Database Tests
- **Priority**: Medium
- **Estimated Effort**: 2 hours
- **Tasks**:
  - [ ] Test migration script execution
  - [ ] Test rollback script
  - [ ] Verify data integrity after migration
  - [ ] Test foreign key constraints
  - [ ] Test transaction rollback scenarios

---

### TEST-2: Frontend Testing

#### TEST-2.1: Component Unit Tests
- **Priority**: High
- **Estimated Effort**: 6 hours
- **Tasks**:
  - [ ] Test InsurerDetailsSection component rendering
  - [ ] Test InsurerShareRow component
  - [ ] Test add/remove insurer functionality
  - [ ] Test two-way binding logic
  - [ ] Test auto-calculation functions
  - [ ] Test validation logic
  - [ ] Test conditional rendering (Single vs Multiple)
  - [ ] Mock API calls with Jest

#### TEST-2.2: Integration Tests (Frontend)
- **Priority**: Medium
- **Estimated Effort**: 4 hours
- **Tasks**:
  - [ ] Test complete user flow - Part 1 (auto-populate)
  - [ ] Test complete user flow - Part 2 (save insurer details)
  - [ ] Test form submission with valid data
  - [ ] Test form submission with invalid data
  - [ ] Test data retrieval and display

#### TEST-2.3: E2E Tests
- **Priority**: Medium
- **Estimated Effort**: 6 hours
- **Framework**: Cypress or Playwright
- **Tasks**:
  - [ ] Test Scenario 1: Auto-populate from RFP to Broking Slip
  - [ ] Test Scenario 6: Single insurer with 100% brokerage
  - [ ] Test Scenario 8: Multiple insurers with share distribution
  - [ ] Test Scenario 13: Premium share validation error
  - [ ] Test Scenario 17: Save and retrieve data
  - [ ] Test Scenario 18: Edit existing data
  - [ ] Test all 30 Gherkin scenarios (if feasible)

---

### TEST-3: Manual Testing

#### TEST-3.1: QA Test Plan Creation
- **Priority**: High
- **Estimated Effort**: 4 hours
- **Tasks**:
  - [ ] Create detailed test cases based on 30 Gherkin scenarios
  - [ ] Define test data for each scenario
  - [ ] Create test checklist
  - [ ] Define acceptance criteria per test case

#### TEST-3.2: Manual Test Execution
- **Priority**: High
- **Estimated Effort**: 8 hours
- **Tasks**:
  - [ ] Execute all 30 Gherkin scenarios manually
  - [ ] Test edge cases and boundary values
  - [ ] Test error messages and validations
  - [ ] Test UI/UX flow and user guidance
  - [ ] Test cross-browser compatibility (Chrome, Firefox, Safari, Edge)
  - [ ] Test on different screen sizes
  - [ ] Document bugs in Jira
  - [ ] Verify bug fixes

#### TEST-3.3: User Acceptance Testing (UAT)
- **Priority**: High
- **Estimated Effort**: TBD (User time)
- **Tasks**:
  - [ ] Prepare UAT environment
  - [ ] Create UAT scripts for end users
  - [ ] Conduct UAT sessions
  - [ ] Gather feedback
  - [ ] Address UAT issues
  - [ ] Obtain sign-off

---

## Documentation Tasks

### DOC-1: Technical Documentation

#### DOC-1.1: Update API Documentation
- **Priority**: Medium
- **Estimated Effort**: 2 hours
- **Tasks**:
  - [ ] Document all new endpoints in Swagger/OpenAPI
  - [ ] Add request/response examples
  - [ ] Document error codes and messages
  - [ ] Update Postman collection (if exists)

#### DOC-1.2: Update Database Schema Documentation
- **Priority**: Medium
- **Estimated Effort**: 1 hour
- **Tasks**:
  - [ ] Update DATABASE-SCHEMA-REFERENCE.md
  - [ ] Document new `share_amount` column
  - [ ] Update ERD diagrams (if exists)

#### DOC-1.3: Code Comments and JSDoc
- **Priority**: Low
- **Estimated Effort**: 2 hours
- **Tasks**:
  - [ ] Add JSDoc comments to all service methods
  - [ ] Add inline comments for complex logic
  - [ ] Document calculation formulas
  - [ ] Add TODO/FIXME comments where needed

---

### DOC-2: User Documentation

#### DOC-2.1: Update User Guide
- **Priority**: Low
- **Estimated Effort**: 3 hours
- **Tasks**:
  - [ ] Document Part 1: Auto-populate feature
  - [ ] Document Part 2: Insurer Details section
  - [ ] Add screenshots of UI
  - [ ] Create step-by-step instructions
  - [ ] Add FAQ section

#### DOC-2.2: Create Training Materials
- **Priority**: Low
- **Estimated Effort**: 4 hours
- **Tasks**:
  - [ ] Create training video/demo
  - [ ] Create quick reference guide
  - [ ] Create troubleshooting guide

---

## Deployment Tasks

### DEPLOY-1: Environment Setup

#### DEPLOY-1.1: Development Environment
- **Priority**: High
- **Estimated Effort**: 2 hours
- **Tasks**:
  - [ ] Run database migrations on dev
  - [ ] Deploy backend services to dev
  - [ ] Deploy frontend to dev
  - [ ] Verify deployment success
  - [ ] Test end-to-end on dev

#### DEPLOY-1.2: UAT Environment
- **Priority**: High
- **Estimated Effort**: 2 hours
- **Tasks**:
  - [ ] Run database migrations on UAT
  - [ ] Deploy backend services to UAT
  - [ ] Deploy frontend to UAT
  - [ ] Verify deployment success
  - [ ] Conduct smoke tests

#### DEPLOY-1.3: Production Deployment
- **Priority**: High
- **Estimated Effort**: 3 hours
- **Tasks**:
  - [ ] Create deployment checklist
  - [ ] Schedule production deployment window
  - [ ] Backup production database
  - [ ] Run database migrations on production
  - [ ] Deploy backend services to production
  - [ ] Deploy frontend to production
  - [ ] Run smoke tests
  - [ ] Monitor application logs
  - [ ] Verify no errors in production
  - [ ] Rollback plan ready

---

### DEPLOY-2: Monitoring & Support

#### DEPLOY-2.1: Post-Deployment Monitoring
- **Priority**: High
- **Estimated Effort**: Ongoing
- **Tasks**:
  - [ ] Monitor application logs for errors
  - [ ] Monitor API response times
  - [ ] Monitor database performance
  - [ ] Set up alerts for failures
  - [ ] Track user adoption metrics

#### DEPLOY-2.2: Support & Bug Fixes
- **Priority**: High
- **Estimated Effort**: Ongoing
- **Tasks**:
  - [ ] Provide support to users
  - [ ] Address production bugs
  - [ ] Create hotfix branches as needed
  - [ ] Deploy hotfixes to production

---

## Effort Estimation

### Summary by Phase

| Phase | Tasks | Total Hours | Story Points |
|-------|-------|-------------|--------------|
| **Database** | 3 tasks | 4 hours | 2 |
| **Backend** | 15 tasks | 32 hours | 13 |
| **Frontend** | 18 tasks | 53 hours | 21 |
| **Testing** | 9 tasks | 40 hours | 16 |
| **Documentation** | 5 tasks | 12 hours | 5 |
| **Deployment** | 4 tasks | 7 hours + ongoing | 3 |
| **TOTAL** | **54 tasks** | **148 hours** | **60 SP** |

### Breakdown by Developer Role

| Role | Tasks | Hours | Recommended Team Size |
|------|-------|-------|----------------------|
| Backend Developer | 18 tasks | 36 hours | 1-2 developers |
| Frontend Developer | 18 tasks | 53 hours | 2 developers |
| QA Engineer | 9 tasks | 40 hours | 1 developer |
| DevOps Engineer | 4 tasks | 7 hours | 1 developer (part-time) |
| Technical Writer | 5 tasks | 12 hours | 1 writer (part-time) |

### Timeline Estimation

**Assuming 2 Backend, 2 Frontend, 1 QA, 1 DevOps (part-time), 1 Tech Writer (part-time)**

| Sprint | Focus | Duration | Deliverables |
|--------|-------|----------|--------------|
| **Sprint 1** | Database + Backend Part 1 | 2 weeks | - DB migrations<br>- Auto-populate API<br>- Unit tests |
| **Sprint 2** | Backend Part 2 + Frontend Part 1 | 2 weeks | - Insurer Details API<br>- Auto-populate UI<br>- Integration tests |
| **Sprint 3** | Frontend Part 2 | 2 weeks | - Insurer Details UI<br>- Validations<br>- Calculations |
| **Sprint 4** | Testing + Bug Fixes | 2 weeks | - E2E tests<br>- Manual testing<br>- Bug fixes |
| **Sprint 5** | UAT + Documentation + Deployment | 1 week | - UAT completion<br>- Docs updated<br>- Production deployment |

**Total Estimated Timeline**: 9 weeks (2.25 months)

---

## Dependencies

### Internal Dependencies

| Task | Depends On | Blocker? |
|------|------------|----------|
| BE-1.1 (Entity update) | DB-1.1 (Migration) | Yes |
| BE-2.1 (Auto-populate service) | None | No |
| BE-3.3 (Business logic) | BE-3.1 (DTOs), BE-3.2 (Validators) | Yes |
| FE-1.1 (Auto-populate UI) | BE-2.2 (API endpoint) | Yes |
| FE-2.1 (Form config) | None | No |
| FE-2.3 (Auto-calc) | FE-2.1 (Form config) | Yes |
| FE-5.1 (Save) | BE-3.4 (API endpoints) | Yes |
| TEST-1.2 (Integration tests) | BE-3.4 (API endpoints) | Yes |
| TEST-2.3 (E2E tests) | FE-5.1 (Save), FE-5.2 (Retrieve) | Yes |

### External Dependencies

| Dependency | Impact | Mitigation |
|------------|--------|------------|
| Database access for migration | High | Coordinate with DBA team early |
| UI/UX design approval | Medium | Parallel track with mockups |
| API rate limits (if external insurers) | Low | Not applicable (internal data) |
| DevOps deployment pipeline | Medium | Test deployment process in dev first |

---

## Risk Assessment

### High Risk Items

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Two-way binding complexity** | Medium | High | Thorough unit testing, handle edge cases explicitly, add extensive logging |
| **Database migration failures** | Low | High | Test on staging first, have rollback script ready, backup before migration |
| **Performance issues with calculations** | Medium | Medium | Optimize calculation logic, debounce user input, use memoization |
| **Complex validation logic errors** | High | High | Write comprehensive tests, use TypeScript for type safety, peer review |
| **User confusion on UI flow** | Medium | Medium | Conduct UX review, add tooltips/help text, create user guide |

### Medium Risk Items

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Missing preferred insurers** | Medium | Low | Show helpful empty state, allow manual entry |
| **Decimal precision rounding errors** | Low | Medium | Use libraries like decimal.js for precise calculations |
| **Browser compatibility issues** | Low | Low | Test on all major browsers early |

---

## Acceptance Checklist

### Part 1: Auto-populate Preferred Insurers

- [ ] ✅ RFP insurers auto-populate in Broking Slip
- [ ] ✅ All fields are editable after pre-population
- [ ] ✅ User can add more insurers
- [ ] ✅ User can remove pre-filled insurers
- [ ] ✅ Empty RFP shows empty section
- [ ] ✅ Multiple insurers are supported

### Part 2: Insurer Share & Brokerage Details

- [ ] ✅ All 3 main fields are present and functional
- [ ] ✅ All 5 sub-section fields are present and functional
- [ ] ✅ Two-way binding works for lead insurer
- [ ] ✅ Premium share amounts auto-calculate correctly
- [ ] ✅ Brokerage amounts auto-calculate correctly
- [ ] ✅ Total premium share = 100% validation works
- [ ] ✅ Brokerage total validation is informational only
- [ ] ✅ Single insurer mode works correctly
- [ ] ✅ Multiple insurer mode works correctly
- [ ] ✅ Add/remove insurer rows works
- [ ] ✅ All validations display correct error messages
- [ ] ✅ Data persists correctly
- [ ] ✅ Data retrieves correctly
- [ ] ✅ Edit mode works correctly
- [ ] ✅ Audit trail is maintained
- [ ] ✅ All 30 Gherkin scenarios pass

---

## Next Steps

1. **Review this technical task list** with development team
2. **Estimate each task** in your planning session
3. **Assign tasks** to team members
4. **Create Jira sub-tasks** under IIRM-7616
5. **Schedule sprint planning** meeting
6. **Begin Sprint 1** - Database + Backend Part 1

---

**Document Status**: ✅ Ready for Development Planning  
**Last Updated**: November 7, 2025  
**Author**: Nithin (with AI assistance)  

---

**END OF TECHNICAL TASKS DOCUMENT**
