/**
 * Simple manual test runner for bulk edit data models
 * This file can be executed to verify that all our data models and validation logic work correctly
 */

import { BulkEditValidator } from '../validators/bulk-edit.validator';
import { isFieldBulkEditable, getFieldConfig } from '../enums/bulk-edit-fields.enum';
import type { BulkEditRequest } from '../interfaces/bulk-edit.interface';

/**
 * Test scenarios for bulk edit data models
 */
function runManualTests(): { passed: number; failed: number; total: number } {
  let testsPassed = 0;
  let testsFailed = 0;

  function test(description: string, assertion: boolean): void {
    if (assertion) {
      testsPassed++;
      // Test passed
    } else {
      testsFailed++;
      throw new Error(`Test failed: ${description}`);
    }
  }

  try {
    // Test 1: Valid bulk edit request
    const validRequest: BulkEditRequest = {
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
    };

    const validResult = BulkEditValidator.validateBulkEditRequest(validRequest);
    test('Valid request should pass validation', validResult.isValid);
    test('Valid request should have no errors', validResult.validationErrors.length === 0);
    test('Valid request should have estimated duration', validResult.estimatedDuration !== undefined && validResult.estimatedDuration > 0);

    // Test 2: Invalid entity type
    const invalidEntityRequest: BulkEditRequest = {
      ...validRequest,
      entityType: 'invalid' as any
    };

    const invalidEntityResult = BulkEditValidator.validateBulkEditRequest(invalidEntityRequest);
    test('Invalid entity type should fail validation', !invalidEntityResult.isValid);
    test('Invalid entity type should have validation errors', invalidEntityResult.validationErrors.length > 0);

    // Test 3: Empty record IDs
    const emptyRecordsRequest: BulkEditRequest = {
      ...validRequest,
      recordIds: []
    };

    const emptyRecordsResult = BulkEditValidator.validateBulkEditRequest(emptyRecordsRequest);
    test('Empty record IDs should fail validation', !emptyRecordsResult.isValid);

    // Test 4: Field bulk editability
    test('Company lead_crm should be bulk editable', isFieldBulkEditable('company', 'lead_crm'));
    test('Company invalid_field should not be bulk editable', !isFieldBulkEditable('company', 'invalid_field'));
    test('Opportunity bd_owner should be bulk editable', isFieldBulkEditable('opportunity', 'bd_owner'));
    test('Policy status should be bulk editable', isFieldBulkEditable('policy', 'status'));

    // Test 5: Field configuration
    const companyStatusConfig = getFieldConfig('company', 'status');
    test('Company status config should exist', companyStatusConfig !== null);
    test('Company status should be required', companyStatusConfig?.required === true);
    test('Company status should not be clearable', companyStatusConfig?.canClear === false);

    const companyPriorityConfig = getFieldConfig('company', 'priority');
    test('Company priority config should exist', companyPriorityConfig !== null);
    test('Company priority should be optional', companyPriorityConfig?.required === false);
    test('Company priority should be clearable', companyPriorityConfig?.canClear === true);

    // Test 6: Cross-entity field validation
    const crossEntityRequest: BulkEditRequest = {
      entityType: 'opportunity',
      recordIds: [1],
      fieldUpdates: [
        {
          fieldName: 'account_manager', // Company field, not opportunity
          newValue: 123,
          operation: 'set'
        }
      ],
      userId: 123
    };

    const crossEntityResult = BulkEditValidator.validateBulkEditRequest(crossEntityRequest);
    test('Cross-entity field should fail validation', !crossEntityResult.isValid);

    // Test 7: Clear operation validation
    const clearRequest: BulkEditRequest = {
      entityType: 'company',
      recordIds: [1],
      fieldUpdates: [
        {
          fieldName: 'priority',
          newValue: null,
          operation: 'clear'
        }
      ],
      userId: 123
    };

    const clearResult = BulkEditValidator.validateBulkEditRequest(clearRequest);
    test('Clear operation on clearable field should be valid', clearResult.isValid);

    // Test 8: Clear operation on required field
    const clearRequiredRequest: BulkEditRequest = {
      entityType: 'company',
      recordIds: [1],
      fieldUpdates: [
        {
          fieldName: 'status',
          newValue: null,
          operation: 'clear'
        }
      ],
      userId: 123
    };

    const clearRequiredResult = BulkEditValidator.validateBulkEditRequest(clearRequiredRequest);
    test('Clear operation on required field should fail', !clearRequiredResult.isValid);

    // Test 9: Multiple field updates
    const multipleFieldsRequest: BulkEditRequest = {
      entityType: 'company',
      recordIds: [1, 2],
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

    const multipleFieldsResult = BulkEditValidator.validateBulkEditRequest(multipleFieldsRequest);
    test('Multiple field updates should be valid', multipleFieldsResult.isValid);

    // Test 10: Duplicate field names
    const duplicateFieldsRequest: BulkEditRequest = {
      entityType: 'company',
      recordIds: [1],
      fieldUpdates: [
        {
          fieldName: 'status',
          newValue: 'Active',
          operation: 'set'
        },
        {
          fieldName: 'status',
          newValue: 'Inactive',
          operation: 'set'
        }
      ],
      userId: 123
    };

    const duplicateFieldsResult = BulkEditValidator.validateBulkEditRequest(duplicateFieldsRequest);
    test('Duplicate field names should fail validation', !duplicateFieldsResult.isValid);

    return {
      passed: testsPassed,
      failed: testsFailed,
      total: testsPassed + testsFailed
    };

  } catch (error) {
    testsFailed++;
    throw error;
  }
}

/**
 * Main test execution function
 */
export function runBulkEditTests() {
  try {
    const results = runManualTests();
    return {
      success: true,
      message: `All tests passed! ${results.passed} tests completed successfully.`,
      results
    };
  } catch (error) {
    return {
      success: false,
      message: `Tests failed: ${error instanceof Error ? error.message : String(error)}`,
      results: null
    };
  }
}

/**
 * Execute tests and return boolean result for CI/CD
 */
export function validateBulkEditModels(): boolean {
  const result = runBulkEditTests();
  return result.success;
}