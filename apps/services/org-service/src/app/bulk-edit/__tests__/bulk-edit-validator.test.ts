/**
 * Unit tests for BulkEditValidator
 */

import { BulkEditValidator } from '../validators/bulk-edit.validator';
import { BulkEditRequest } from '../interfaces/bulk-edit.interface';
import { BulkEditErrorCode, ValidationErrorCode } from '../enums/bulk-edit-error-codes.enum';

/**
 * Simple test framework for validation logic
 */
class ValidationTestRunner {
  private tests: Array<{ name: string; fn: () => void }> = [];
  private results: Array<{ name: string; passed: boolean; error?: string }> = [];

  test(name: string, fn: () => void) {
    this.tests.push({ name, fn });
  }

  run(): { passed: number; failed: number; total: number } {
    let passed = 0;
    let failed = 0;

    for (const test of this.tests) {
      try {
        test.fn();
        this.results.push({ name: test.name, passed: true });
        passed++;
      } catch (error) {
        this.results.push({ 
          name: test.name, 
          passed: false, 
          error: error instanceof Error ? error.message : String(error)
        });
        failed++;
      }
    }

    return { passed, failed, total: this.tests.length };
  }
}

// Simple assertion functions
function assertTrue(condition: boolean, message?: string) {
  if (!condition) {
    throw new Error(message || 'Expected condition to be true');
  }
}

function assertFalse(condition: boolean, message?: string) {
  if (condition) {
    throw new Error(message || 'Expected condition to be false');
  }
}

function assertEqual(actual: any, expected: any, message?: string) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, but got ${actual}`);
  }
}

function assertArrayLength(array: any[], expectedLength: number, message?: string) {
  if (!Array.isArray(array) || array.length !== expectedLength) {
    throw new Error(message || `Expected array length ${expectedLength}, but got ${array?.length || 'not an array'}`);
  }
}

function assertContainsError(errors: any[], errorCode: string, message?: string) {
  const hasError = errors.some(error => error.errorCode === errorCode);
  if (!hasError) {
    throw new Error(message || `Expected to find error code ${errorCode} in errors array`);
  }
}

// Create test runner instance
const testRunner = new ValidationTestRunner();

// Valid request for testing
const createValidRequest = (): BulkEditRequest => ({
  entityType: 'company',
  recordIds: [1, 2, 3],
  fieldUpdates: [
    {
      fieldName: 'status',
      newValue: 'Active',
      operation: 'set'
    }
  ],
  userId: 123
});

// Entity Type Validation Tests
testRunner.test('should validate valid entity types', () => {
  const companyRequest = { ...createValidRequest(), entityType: 'company' as const };
  const result = BulkEditValidator.validateBulkEditRequest(companyRequest);
  assertTrue(result.isValid, 'Company entity type should be valid');

  const opportunityRequest = { ...createValidRequest(), entityType: 'opportunity' as const };
  const result2 = BulkEditValidator.validateBulkEditRequest(opportunityRequest);
  assertTrue(result2.isValid, 'Opportunity entity type should be valid');

  const policyRequest = { ...createValidRequest(), entityType: 'policy' as const };
  const result3 = BulkEditValidator.validateBulkEditRequest(policyRequest);
  assertTrue(result3.isValid, 'Policy entity type should be valid');
});

testRunner.test('should reject invalid entity types', () => {
  const invalidRequest = { ...createValidRequest(), entityType: 'invalid' as any };
  const result = BulkEditValidator.validateBulkEditRequest(invalidRequest);
  assertFalse(result.isValid, 'Invalid entity type should fail validation');
  assertContainsError(result.validationErrors, BulkEditErrorCode.INVALID_ENTITY_TYPE);
});

testRunner.test('should reject missing entity type', () => {
  const invalidRequest = { ...createValidRequest(), entityType: '' as any };
  const result = BulkEditValidator.validateBulkEditRequest(invalidRequest);
  assertFalse(result.isValid, 'Missing entity type should fail validation');
  assertContainsError(result.validationErrors, ValidationErrorCode.REQUIRED_FIELD_MISSING);
});

// Record IDs Validation Tests
testRunner.test('should validate valid record IDs', () => {
  const request = { ...createValidRequest(), recordIds: [1, 2, 3, 4, 5] };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertTrue(result.isValid, 'Valid record IDs should pass validation');
});

testRunner.test('should reject empty record IDs array', () => {
  const request = { ...createValidRequest(), recordIds: [] };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertFalse(result.isValid, 'Empty record IDs should fail validation');
  assertContainsError(result.validationErrors, BulkEditErrorCode.NO_RECORDS_PROVIDED);
});

testRunner.test('should reject invalid record ID types', () => {
  const request = { ...createValidRequest(), recordIds: [1, 'invalid', 3] as any };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertFalse(result.isValid, 'Invalid record ID types should fail validation');
  assertContainsError(result.validationErrors, ValidationErrorCode.INVALID_FIELD_TYPE);
});

testRunner.test('should reject negative record IDs', () => {
  const request = { ...createValidRequest(), recordIds: [1, -2, 3] };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertFalse(result.isValid, 'Negative record IDs should fail validation');
  assertContainsError(result.validationErrors, ValidationErrorCode.INVALID_FIELD_TYPE);
});

testRunner.test('should reject duplicate record IDs', () => {
  const request = { ...createValidRequest(), recordIds: [1, 2, 2, 3] };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertFalse(result.isValid, 'Duplicate record IDs should fail validation');
  assertContainsError(result.validationErrors, ValidationErrorCode.BUSINESS_RULE_VIOLATION);
});

testRunner.test('should reject too many record IDs', () => {
  const tooManyIds = Array.from({ length: 1001 }, (_, i) => i + 1);
  const request = { ...createValidRequest(), recordIds: tooManyIds };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertFalse(result.isValid, 'Too many record IDs should fail validation');
  assertContainsError(result.validationErrors, BulkEditErrorCode.TOO_MANY_RECORDS);
});

// Field Updates Validation Tests
testRunner.test('should validate valid field updates', () => {
  const request = createValidRequest();
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertTrue(result.isValid, 'Valid field updates should pass validation');
});

testRunner.test('should reject empty field updates array', () => {
  const request = { ...createValidRequest(), fieldUpdates: [] };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertFalse(result.isValid, 'Empty field updates should fail validation');
  assertContainsError(result.validationErrors, BulkEditErrorCode.NO_FIELD_UPDATES);
});

testRunner.test('should reject non-bulk-editable fields', () => {
  const request = {
    ...createValidRequest(),
    fieldUpdates: [
      {
        fieldName: 'invalid_field',
        newValue: 'test',
        operation: 'set' as const
      }
    ]
  };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertFalse(result.isValid, 'Non-bulk-editable fields should fail validation');
  assertContainsError(result.validationErrors, BulkEditErrorCode.FIELD_NOT_BULK_EDITABLE);
});

testRunner.test('should reject invalid operations', () => {
  const request = {
    ...createValidRequest(),
    fieldUpdates: [
      {
        fieldName: 'status',
        newValue: 'Active',
        operation: 'invalid' as any
      }
    ]
  };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertFalse(result.isValid, 'Invalid operations should fail validation');
  assertContainsError(result.validationErrors, BulkEditErrorCode.INVALID_OPERATION);
});

testRunner.test('should reject duplicate field names', () => {
  const request = {
    ...createValidRequest(),
    fieldUpdates: [
      {
        fieldName: 'status',
        newValue: 'Active',
        operation: 'set' as const
      },
      {
        fieldName: 'status',
        newValue: 'Inactive',
        operation: 'set' as const
      }
    ]
  };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertFalse(result.isValid, 'Duplicate field names should fail validation');
  assertContainsError(result.validationErrors, ValidationErrorCode.BUSINESS_RULE_VIOLATION);
});

testRunner.test('should validate clear operation for clearable fields', () => {
  const request = {
    ...createValidRequest(),
    fieldUpdates: [
      {
        fieldName: 'priority',
        newValue: null,
        operation: 'clear' as const
      }
    ]
  };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertTrue(result.isValid, 'Clear operation on clearable field should be valid');
});

testRunner.test('should reject clear operation for non-clearable fields', () => {
  const request = {
    ...createValidRequest(),
    fieldUpdates: [
      {
        fieldName: 'status',
        newValue: null,
        operation: 'clear' as const
      }
    ]
  };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertFalse(result.isValid, 'Clear operation on required field should fail validation');
  assertContainsError(result.validationErrors, ValidationErrorCode.BUSINESS_RULE_VIOLATION);
});

// User ID Validation Tests
testRunner.test('should validate valid user ID', () => {
  const request = { ...createValidRequest(), userId: 456 };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertTrue(result.isValid, 'Valid user ID should pass validation');
});

testRunner.test('should reject invalid user ID', () => {
  const request = { ...createValidRequest(), userId: 0 };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertFalse(result.isValid, 'Invalid user ID should fail validation');
  assertContainsError(result.validationErrors, ValidationErrorCode.INVALID_FIELD_TYPE);
});

testRunner.test('should reject missing user ID', () => {
  const request = { ...createValidRequest(), userId: null as any };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertFalse(result.isValid, 'Missing user ID should fail validation');
  assertContainsError(result.validationErrors, ValidationErrorCode.REQUIRED_FIELD_MISSING);
});

// Estimated Duration Tests
testRunner.test('should calculate estimated duration', () => {
  const request = createValidRequest();
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertTrue(result.estimatedDuration !== undefined, 'Should provide estimated duration');
  assertTrue(result.estimatedDuration! > 0, 'Estimated duration should be positive');
});

testRunner.test('should calculate higher duration for more records', () => {
  const smallRequest = { ...createValidRequest(), recordIds: [1, 2] };
  const largeRequest = { ...createValidRequest(), recordIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] };

  const smallResult = BulkEditValidator.validateBulkEditRequest(smallRequest);
  const largeResult = BulkEditValidator.validateBulkEditRequest(largeRequest);

  assertTrue(largeResult.estimatedDuration! > smallResult.estimatedDuration!, 
    'More records should result in higher estimated duration');
});

// Cross-entity field validation tests
testRunner.test('should reject company field for opportunity entity', () => {
  const request = {
    ...createValidRequest(),
    entityType: 'opportunity' as const,
    fieldUpdates: [
      {
        fieldName: 'account_manager', // This is a company field, not opportunity
        newValue: 123,
        operation: 'set' as const
      }
    ]
  };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertFalse(result.isValid, 'Company field should not be valid for opportunity entity');
  assertContainsError(result.validationErrors, BulkEditErrorCode.FIELD_NOT_BULK_EDITABLE);
});

testRunner.test('should accept opportunity-specific fields for opportunity entity', () => {
  const request = {
    ...createValidRequest(),
    entityType: 'opportunity' as const,
    fieldUpdates: [
      {
        fieldName: 'bd_owner',
        newValue: 123,
        operation: 'set' as const
      }
    ]
  };
  const result = BulkEditValidator.validateBulkEditRequest(request);
  assertTrue(result.isValid, 'Opportunity field should be valid for opportunity entity');
});

// Export test runner function
export function runBulkEditValidationTests() {
  return testRunner.run();
}

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  runBulkEditValidationTests();
}