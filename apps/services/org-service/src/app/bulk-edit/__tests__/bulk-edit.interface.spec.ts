/**
 * Unit tests for bulk edit interfaces and data models
 */

import {
  BulkEditRequest,
  BulkEditResult,
  FieldUpdate,
  ValidationResult,
  BulkEditError,
  ValidationError
} from '../interfaces/bulk-edit.interface';

describe('BulkEditRequest Interface', () => {
  it('should define a valid bulk edit request structure', () => {
    const request: BulkEditRequest = {
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

    expect(request.entityType).toBe('company');
    expect(request.recordIds).toHaveLength(3);
    expect(request.fieldUpdates).toHaveLength(1);
    expect(request.userId).toBe(123);
  });

  it('should support all valid entity types', () => {
    const companyRequest: BulkEditRequest = {
      entityType: 'company',
      recordIds: [1],
      fieldUpdates: [],
      userId: 1
    };

    const opportunityRequest: BulkEditRequest = {
      entityType: 'opportunity',
      recordIds: [1],
      fieldUpdates: [],
      userId: 1
    };

    const policyRequest: BulkEditRequest = {
      entityType: 'policy',
      recordIds: [1],
      fieldUpdates: [],
      userId: 1
    };

    expect(companyRequest.entityType).toBe('company');
    expect(opportunityRequest.entityType).toBe('opportunity');
    expect(policyRequest.entityType).toBe('policy');
  });
});

describe('FieldUpdate Interface', () => {
  it('should support set operation with value', () => {
    const fieldUpdate: FieldUpdate = {
      fieldName: 'status',
      newValue: 'Active',
      operation: 'set'
    };

    expect(fieldUpdate.fieldName).toBe('status');
    expect(fieldUpdate.newValue).toBe('Active');
    expect(fieldUpdate.operation).toBe('set');
  });

  it('should support clear operation', () => {
    const fieldUpdate: FieldUpdate = {
      fieldName: 'priority',
      newValue: null,
      operation: 'clear'
    };

    expect(fieldUpdate.fieldName).toBe('priority');
    expect(fieldUpdate.newValue).toBeNull();
    expect(fieldUpdate.operation).toBe('clear');
  });

  it('should support different value types', () => {
    const stringUpdate: FieldUpdate = {
      fieldName: 'status',
      newValue: 'Active',
      operation: 'set'
    };

    const numberUpdate: FieldUpdate = {
      fieldName: 'lead_crm',
      newValue: 456,
      operation: 'set'
    };

    const dateUpdate: FieldUpdate = {
      fieldName: 'expiry_date',
      newValue: '2024-12-31',
      operation: 'set'
    };

    expect(typeof stringUpdate.newValue).toBe('string');
    expect(typeof numberUpdate.newValue).toBe('number');
    expect(typeof dateUpdate.newValue).toBe('string');
  });
});

describe('BulkEditResult Interface', () => {
  it('should define a complete result structure', () => {
    const result: BulkEditResult = {
      totalRecords: 5,
      successCount: 4,
      failureCount: 1,
      errors: [
        {
          recordId: 5,
          fieldName: 'status',
          errorCode: 'VALIDATION_FAILED',
          errorMessage: 'Invalid status value'
        }
      ],
      affectedRecords: [1, 2, 3, 4],
      processingDuration: 1250
    };

    expect(result.totalRecords).toBe(5);
    expect(result.successCount).toBe(4);
    expect(result.failureCount).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.affectedRecords).toHaveLength(4);
    expect(result.processingDuration).toBe(1250);
  });

  it('should handle successful operation with no errors', () => {
    const result: BulkEditResult = {
      totalRecords: 3,
      successCount: 3,
      failureCount: 0,
      errors: [],
      affectedRecords: [1, 2, 3]
    };

    expect(result.errors).toHaveLength(0);
    expect(result.failureCount).toBe(0);
    expect(result.successCount).toBe(result.totalRecords);
  });
});

describe('BulkEditError Interface', () => {
  it('should define error structure correctly', () => {
    const error: BulkEditError = {
      recordId: 123,
      fieldName: 'status',
      errorCode: 'VALIDATION_FAILED',
      errorMessage: 'Invalid status value provided'
    };

    expect(error.recordId).toBe(123);
    expect(error.fieldName).toBe('status');
    expect(error.errorCode).toBe('VALIDATION_FAILED');
    expect(error.errorMessage).toBe('Invalid status value provided');
  });
});

describe('ValidationResult Interface', () => {
  it('should define validation success result', () => {
    const result: ValidationResult = {
      isValid: true,
      validationErrors: [],
      estimatedDuration: 1500
    };

    expect(result.isValid).toBe(true);
    expect(result.validationErrors).toHaveLength(0);
    expect(result.estimatedDuration).toBe(1500);
  });

  it('should define validation failure result', () => {
    const result: ValidationResult = {
      isValid: false,
      validationErrors: [
        {
          fieldName: 'entityType',
          errorCode: 'INVALID_ENTITY_TYPE',
          errorMessage: 'Invalid entity type provided'
        }
      ]
    };

    expect(result.isValid).toBe(false);
    expect(result.validationErrors).toHaveLength(1);
    expect(result.validationErrors[0].fieldName).toBe('entityType');
  });
});

describe('ValidationError Interface', () => {
  it('should define validation error structure', () => {
    const error: ValidationError = {
      fieldName: 'recordIds',
      errorCode: 'REQUIRED_FIELD_MISSING',
      errorMessage: 'Record IDs are required'
    };

    expect(error.fieldName).toBe('recordIds');
    expect(error.errorCode).toBe('REQUIRED_FIELD_MISSING');
    expect(error.errorMessage).toBe('Record IDs are required');
  });

  it('should support optional record ID', () => {
    const error: ValidationError = {
      fieldName: 'status',
      errorCode: 'VALIDATION_FAILED',
      errorMessage: 'Invalid status',
      recordId: 456
    };

    expect(error.recordId).toBe(456);
  });
});