# Backend Technical Tasks - IIRM-7631

## Task 1: Claims Summary API Endpoint

**Story Points:** 5  
**Priority:** High  
**Dependencies:** Database Schema

### Description
Create REST API endpoint to fetch claims summary data for dashboard widget

### Acceptance Criteria
- [ ] Create GET `/api/claims/summary/{employeeId}` endpoint
- [ ] Accept query parameters: `policyId`, `policyType` (GMC/GPA/GTL)
- [ ] Return JSON with: `totalClaims`, `settledClaims`, `pendingClaims`, `totalClaimedAmount`
- [ ] Include policy info: `policyNumber`, `expiryDate`, `totalSumInsured`, `availableAmount`
- [ ] Add authentication middleware and input validation
- [ ] Return 404 if employee not found, 400 for invalid params
- [ ] Response time < 500ms for standard queries
- [ ] Support multiple policies per employee

### Technical Details
- Implement in `apps/services/ibp-service/src/claims/` directory
- Use existing database models and follow current API patterns
- Follow NestJS controller and service patterns

### API Response Format
```json
{
  "success": true,
  "data": {
    "employeeId": "string",
    "policies": [
      {
        "policyId": "string",
        "policyType": "GMC|GPA|GTL",
        "policyNumber": "string",
        "expiryDate": "2024-12-31",
        "totalSumInsured": 500000,
        "availableAmount": 450000,
        "claimsSummary": {
          "totalClaims": 5,
          "settledClaims": 3,
          "pendingClaims": 2,
          "totalClaimedAmount": 50000
        },
        "recentClaims": [
          {
            "claimNo": "CLM001",
            "memberName": "John Doe",
            "claimDate": "2024-01-15",
            "amount": 15000,
            "status": "Settled"
          }
        ]
      }
    ]
  }
}
```

---

## Task 2: Claims List API with Pagination

**Story Points:** 8  
**Priority:** High  
**Dependencies:** Database Schema

### Description
Create endpoint for detailed claims listing with pagination and filtering

### Acceptance Criteria
- [ ] Create GET `/api/claims/list/{employeeId}` endpoint
- [ ] Support pagination: `page`, `limit` (default 10, max 100)
- [ ] Support filtering: `claimStatus`, `dateRange`, `memberType` (self/dependent)
- [ ] Return array of claims with: `claimNo`, `memberName`, `claimDate`, `amount`, `status`, `relationship`
- [ ] Include total count for pagination
- [ ] Sort by `claimDate` DESC by default
- [ ] Handle empty results gracefully
- [ ] Add search by claim number functionality

### Technical Details
- Implement efficient database queries with proper indexing
- Use existing pagination utilities from service-lib

### API Response Format
```json
{
  "success": true,
  "data": {
    "claims": [
      {
        "claimNo": "string",
        "memberName": "string",
        "relationship": "Self|Spouse|Child|Parent",
        "claimDate": "2024-01-15",
        "amount": 15000,
        "status": "Pending|Settled|Rejected"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalCount": 25,
      "totalPages": 3
    }
  }
}
```

---

## Task 3: Policy Coverage Calculation API

**Story Points:** 6  
**Priority:** Medium  
**Dependencies:** Claims APIs

### Description
Create endpoint for policy coverage calculations and utilization metrics

### Acceptance Criteria
- [ ] Create GET `/api/policy/coverage/{employeeId}/{policyId}` endpoint
- [ ] Calculate `availableAmount = totalSumInsured - sum(approvedClaims)`
- [ ] Return `utilizationPercentage = (claimedAmount / totalSumInsured) * 100`
- [ ] Include family members covered (GMC policies only)
- [ ] Handle multiple policies per employee
- [ ] Cache calculations for 5 minutes to improve performance
- [ ] Return real-time data accuracy
- [ ] Handle edge cases (zero sum insured, no claims)

### Technical Details
- Implement calculation service with proper error handling for division by zero
- Use Redis or in-memory caching for performance
- Validate all mathematical operations

---

## Task 4: Premium Summary API

**Story Points:** 5  
**Priority:** Medium  
**Dependencies:** Policy Data

### Description
Create endpoint to fetch premium summary across all policy types

### Acceptance Criteria
- [ ] Create GET `/api/premium/summary/{employeeId}` endpoint
- [ ] Return total premium across GMC, GPA, GTL policies
- [ ] Include company contribution and employee contribution breakdown
- [ ] Calculate total tax component on premium
- [ ] Support add-on premium calculations
- [ ] Handle multiple enrollment periods
- [ ] Return currency-formatted amounts
- [ ] Add validation for premium calculation accuracy

### Technical Details
- Implement in `apps/services/ibp-service/src/premium/` directory
- Use existing policy and enrollment data models

---

## Task 5: Database Schema for Claims Data

**Story Points:** 8  
**Priority:** High  
**Dependencies:** None

### Description
Design and implement database schema for claims data storage

### Acceptance Criteria
- [ ] Design claims table with required fields
- [ ] Add proper indexes for performance
- [ ] Create foreign key constraints
- [ ] Add migration script for existing data
- [ ] Support decimal amounts and date ranges
- [ ] Include audit fields for tracking
- [ ] Add composite indexes for common queries
- [ ] Test migration rollback functionality

### Database Schema
```sql
CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  policy_id UUID NOT NULL REFERENCES policies(id),
  claim_no VARCHAR(50) UNIQUE NOT NULL,
  member_name VARCHAR(100) NOT NULL,
  relationship VARCHAR(20) NOT NULL, -- Self, Spouse, Child, Parent
  claim_date DATE NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) NOT NULL, -- Pending, Settled, Rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_claims_employee_id ON claims(employee_id);
CREATE INDEX idx_claims_policy_id ON claims(policy_id);
CREATE INDEX idx_claims_date ON claims(claim_date);
CREATE INDEX idx_claims_status ON claims(status);
CREATE INDEX idx_claims_composite ON claims(employee_id, policy_id, status);
```

---

## Task 6: Claims Data Sync Service

**Story Points:** 13  
**Priority:** High  
**Dependencies:** Database Schema

### Description
Implement service to sync claims data from IIRM portal to enrollment portal

### Acceptance Criteria
- [ ] Create service to fetch data from IIRM portal claims API
- [ ] Map IIRM claim statuses to portal statuses
- [ ] Handle employee-dependent relationship mapping
- [ ] Implement incremental sync (only new/updated claims)
- [ ] Add error handling for API failures and data validation
- [ ] Log sync operations with success/failure metrics
- [ ] Schedule automatic sync every 6 hours
- [ ] Add manual sync trigger endpoint for admin users

### Technical Details
- Implement in `apps/services/ibp-service/src/sync/` directory
- Use existing HTTP client utilities and scheduling service
- Implement retry logic for failed API calls

---

## Task 7: Policy Type Validation Logic

**Story Points:** 5  
**Priority:** Medium  
**Dependencies:** Claims APIs

### Description
Implement validation logic for different policy types and business rules

### Acceptance Criteria
- [ ] Create policy type validation service
- [ ] Implement GMC-specific rules (family members, parental policy)
- [ ] Implement GPA/GTL-specific rules (individual coverage only)
- [ ] Validate policy status and active periods
- [ ] Add business rule validation for claims eligibility
- [ ] Create policy-specific data filtering logic
- [ ] Add validation for premium calculations per policy type
- [ ] Implement clear error responses for business rule violations

### Technical Details
- Create shared validation service in service-lib
- Use decorator pattern for policy-specific validations

---

## Task 8: Error Handling and Logging Framework

**Story Points:** 3  
**Priority:** Low  
**Dependencies:** All APIs

### Description
Implement comprehensive error handling and logging for claims module

### Acceptance Criteria
- [ ] Add try-catch blocks for all API endpoints
- [ ] Implement custom error classes for claims-specific errors
- [ ] Add structured logging with correlation IDs
- [ ] Create appropriate HTTP status codes and error messages
- [ ] Log performance metrics for API responses
- [ ] Add error alerting for critical failures
- [ ] Implement graceful degradation for external service failures
- [ ] Add request/response logging for debugging

### Technical Details
- Use existing logging framework from service-lib
- Follow current error handling patterns in the codebase

---

**Backend Total: 53 Story Points**