# Bulk Edit Module - Core Data Models and DTOs

## Overview

This module implements the core data models, DTOs, interfaces, and validation logic for bulk edit functionality in the org-service. It provides the foundation for bulk editing operations on Company, Opportunity, and Policy entities.

## Implementation Status

✅ **TASK-A001 COMPLETED** - Core Data Models and DTOs in Org-Service

### What's Been Implemented

1. **Core Interfaces** (`interfaces/bulk-edit.interface.ts`)
   - `BulkEditRequest` - Main request interface
   - `BulkEditResult` - Operation result interface
   - `FieldUpdate` - Individual field update specification
   - `BulkEditError` - Error information interface
   - `ValidationResult` - Validation result interface
   - `BulkEditAPI` - Service interface definition

2. **Data Transfer Objects** (`dto/bulk-edit.dto.ts`)
   - `BulkEditRequestDto` - Request DTO for API endpoints
   - `BulkEditResultDto` - Result DTO for API responses
   - `FieldUpdateDto` - Field update DTO
   - `ValidationResultDto` - Validation result DTO
   - Response wrapper DTOs for standardized API responses

3. **Error Handling** (`enums/bulk-edit-error-codes.enum.ts`)
   - `BulkEditErrorCode` enum - Standardized error codes
   - `ValidationErrorCode` enum - Validation-specific error codes
   - Error message mappings for user-friendly messages

4. **Field Configuration** (`enums/bulk-edit-fields.enum.ts`)
   - Entity-specific field definitions (Company, Opportunity, Policy)
   - Field configuration with validation rules
   - Utility functions for field validation

5. **Validation Logic** (`validators/bulk-edit.validator.ts`)
   - Comprehensive request validation
   - Field-specific validation rules
   - Business rule enforcement
   - Error aggregation and reporting

6. **Comprehensive Tests** (`__tests__/`)
   - Interface structure validation
   - Data model validation tests
   - Validation logic tests
   - Manual test runner for CI/CD

## File Structure

```
src/app/bulk-edit/
├── interfaces/
│   └── bulk-edit.interface.ts      # Core TypeScript interfaces
├── dto/
│   └── bulk-edit.dto.ts           # Data Transfer Objects
├── enums/
│   ├── bulk-edit-error-codes.enum.ts  # Error codes and messages
│   └── bulk-edit-fields.enum.ts       # Field configurations
├── validators/
│   └── bulk-edit.validator.ts     # Validation logic
├── __tests__/
│   ├── bulk-edit.interface.spec.ts    # Interface tests
│   ├── bulk-edit-data-models.test.ts  # Data model tests
│   ├── bulk-edit-validator.test.ts    # Validation tests
│   └── test-runner.ts                 # Manual test runner
└── index.ts                       # Module exports
```

## Supported Entity Types

- **Company**: `lead_crm`, `account_manager`, `status`, `priority`
- **Opportunity**: `bd_owner`, `isg_owner`, `status`, `expiry_date`
- **Policy**: `lead_crm`, `isg_owner`, `account_manager`, `status`

## Key Features

### 1. Type Safety
- Full TypeScript support with strict typing
- Compile-time validation of data structures
- Type guards for runtime validation

### 2. Comprehensive Validation
- Entity type validation (company, opportunity, policy only)
- Field bulk-editability validation per entity type
- Operation validation (set/clear)
- Business rule enforcement
- Cross-field validation

### 3. Error Handling
- Standardized error codes
- User-friendly error messages
- Detailed validation feedback
- Partial failure support

### 4. Field Configuration
- Entity-specific field definitions
- Data type validation
- Required/optional field rules
- Clearable field specifications

### 5. Scalability
- Support for up to 1000 records per operation
- Maximum 10 field updates per operation
- Performance estimation
- Batch processing ready

## Usage Examples

### Basic Bulk Edit Request

```typescript
import { BulkEditRequest } from './interfaces/bulk-edit.interface';

const request: BulkEditRequest = {
  entityType: 'company',
  recordIds: [1, 2, 3, 4, 5],
  fieldUpdates: [
    {
      fieldName: 'status',
      newValue: 'Active',
      operation: 'set'
    },
    {
      fieldName: 'priority',
      newValue: 'High',
      operation: 'set'
    }
  ],
  userId: 123
};
```

### Validation Usage

```typescript
import { BulkEditValidator } from './validators/bulk-edit.validator';

const validationResult = BulkEditValidator.validateBulkEditRequest(request);

if (!validationResult.isValid) {
  console.log('Validation errors:', validationResult.validationErrors);
} else {
  console.log('Request is valid, estimated duration:', validationResult.estimatedDuration);
}
```

### Field Configuration Check

```typescript
import { isFieldBulkEditable, getFieldConfig } from './enums/bulk-edit-fields.enum';

// Check if field is bulk editable
const canEdit = isFieldBulkEditable('company', 'status'); // true

// Get field configuration
const config = getFieldConfig('company', 'status');
console.log('Required:', config?.required); // true
console.log('Can clear:', config?.canClear); // false
```

## Validation Rules

### Entity Type Validation
- Must be one of: 'company', 'opportunity', 'policy'
- Case-sensitive validation

### Record IDs Validation
- Must be an array of positive integers
- Minimum 1 record required
- Maximum 1000 records allowed
- No duplicate IDs allowed

### Field Updates Validation
- Must be an array of field update objects
- Minimum 1 field update required
- Maximum 10 field updates allowed
- No duplicate field names allowed
- Field must be bulk editable for entity type

### Field Value Validation
- Data type validation (string, number, boolean, date)
- Required field validation
- Clearable field validation
- Business rule validation

### User ID Validation
- Must be a positive integer
- Required field

## Error Codes

### Bulk Edit Error Codes
- `PERMISSION_DENIED` - User lacks bulk edit privileges
- `INVALID_FIELD_VALUE` - Invalid value for field
- `RECORD_NOT_FOUND` - Record doesn't exist
- `VALIDATION_FAILED` - Field validation failed
- `INVALID_ENTITY_TYPE` - Unsupported entity type
- `FIELD_NOT_BULK_EDITABLE` - Field not allowed for bulk edit

### Validation Error Codes
- `REQUIRED_FIELD_MISSING` - Required field not provided
- `INVALID_FIELD_TYPE` - Wrong data type
- `FIELD_TOO_LONG` - Value exceeds max length
- `VALUE_OUT_OF_RANGE` - Value not in allowed range
- `BUSINESS_RULE_VIOLATION` - Violates business rules

## Testing

### Running Tests
```bash
# Manual test runner (no dependencies)
npm run test:bulk-edit

# Or execute test runner directly
node src/app/bulk-edit/__tests__/test-runner.js
```

### Test Coverage
- ✅ Interface structure validation
- ✅ Entity type validation
- ✅ Record ID validation
- ✅ Field update validation
- ✅ Cross-entity field validation
- ✅ Clear operation validation
- ✅ Error code coverage
- ✅ Field configuration validation

## Next Steps (Upcoming Tasks)

### TASK-A002: Implement bulk edit API endpoints
- Create NestJS controller
- Add route handlers
- Implement ACL guards
- Add Swagger documentation

### TASK-A003: Create "Bulk Edit" privilege
- Database migration
- RBAC integration
- ACL configuration

### TASK-B001-B003: Entity service methods
- Implement bulk update methods in service files
- Add transaction support
- Integrate validation logic

## Dependencies

### Current Dependencies
- TypeScript (strict mode)
- No external runtime dependencies for core models

### Future Dependencies (for API implementation)
- `@nestjs/common`
- `@nestjs/swagger`
- `class-validator`
- `class-transformer`

## Configuration

### Limits and Constants
```typescript
export const BULK_EDIT_CONSTANTS = {
  MAX_RECORDS_PER_OPERATION: 1000,
  MAX_FIELD_UPDATES_PER_OPERATION: 10,
  DEFAULT_TIMEOUT_MS: 30000,
  SUPPORTED_ENTITY_TYPES: ['company', 'opportunity', 'policy'],
  SUPPORTED_OPERATIONS: ['set', 'clear']
};
```

### Field Configurations
Field configurations are defined in `enums/bulk-edit-fields.enum.ts` and include:
- Data type specifications
- Required/optional flags
- Clearable flags
- Validation constraints

## Performance Considerations

### Estimated Processing Time
The validator calculates estimated processing duration based on:
- Base time per record: 50ms
- Additional time per field update: 25ms per record
- 20% buffer for database operations

### Scalability Limits
- Maximum 1000 records per operation
- Maximum 10 field updates per operation
- Single transaction processing
- Memory-efficient validation

## Security Considerations

### Input Validation
- All inputs validated before processing
- Type checking and sanitization
- Business rule enforcement
- SQL injection prevention

### Permission Checks
- User ID validation
- Entity access validation (future)
- Field-level permissions (future)

---

**Implementation Status**: ✅ TASK-A001 Complete
**Next Task**: TASK-A002 - Bulk Edit API Endpoints
**Estimated Effort**: 43 story points remaining in Phase 1