import { 
  BulkEditErrorCode, 
  ValidationErrorCode, 
  BulkEditErrorMessages, 
  ValidationErrorMessages 
} from '../enums/bulk-edit-error-codes.enum';
import { 
  isFieldBulkEditable, 
  getFieldConfig 
} from '../enums/bulk-edit-fields.enum';
import type { 
  BulkEditRequest, 
  ValidationResult, 
  ValidationError, 
  FieldUpdate 
} from '../interfaces/bulk-edit.interface';

/**
 * Validation utility class for bulk edit operations
 * Provides comprehensive validation for bulk edit requests
 */
export class BulkEditValidator {
  
  /**
   * Maximum number of records allowed per bulk operation
   */
  private static readonly MAX_RECORDS = 1000;
  
  /**
   * Maximum number of field updates allowed per operation
   */
  private static readonly MAX_FIELD_UPDATES = 10;

  /**
   * Validate a complete bulk edit request
   * @param request The bulk edit request to validate
   * @returns Validation result with errors if any
   */
  public static validateBulkEditRequest(request: BulkEditRequest): ValidationResult {
    const validationErrors: ValidationError[] = [];

    // Validate entity type
    this.validateEntityType(request.entityType, validationErrors);

    // Validate record IDs
    this.validateRecordIds(request.recordIds, validationErrors);

    // Validate field updates
    this.validateFieldUpdates(request.fieldUpdates, request.entityType, validationErrors);

    // Validate user ID
    this.validateUserId(request.userId, validationErrors);

    return {
      isValid: validationErrors.length === 0,
      validationErrors,
      estimatedDuration: this.calculateEstimatedDuration(request.recordIds.length, request.fieldUpdates.length)
    };
  }

  /**
   * Validate entity type
   */
  private static validateEntityType(entityType: string, errors: ValidationError[]): void {
    if (!entityType) {
      errors.push({
        fieldName: 'entityType',
        errorCode: ValidationErrorCode.REQUIRED_FIELD_MISSING,
        errorMessage: ValidationErrorMessages[ValidationErrorCode.REQUIRED_FIELD_MISSING]
      });
      return;
    }

    if (!['company', 'opportunity', 'policy'].includes(entityType)) {
      errors.push({
        fieldName: 'entityType',
        errorCode: BulkEditErrorCode.INVALID_ENTITY_TYPE,
        errorMessage: BulkEditErrorMessages[BulkEditErrorCode.INVALID_ENTITY_TYPE]
      });
    }
  }

  /**
   * Validate record IDs array
   */
  private static validateRecordIds(recordIds: number[], errors: ValidationError[]): void {
    if (!recordIds || !Array.isArray(recordIds)) {
      errors.push({
        fieldName: 'recordIds',
        errorCode: ValidationErrorCode.REQUIRED_FIELD_MISSING,
        errorMessage: 'Record IDs must be provided as an array'
      });
      return;
    }

    if (recordIds.length === 0) {
      errors.push({
        fieldName: 'recordIds',
        errorCode: BulkEditErrorCode.NO_RECORDS_PROVIDED,
        errorMessage: BulkEditErrorMessages[BulkEditErrorCode.NO_RECORDS_PROVIDED]
      });
      return;
    }

    if (recordIds.length > this.MAX_RECORDS) {
      errors.push({
        fieldName: 'recordIds',
        errorCode: BulkEditErrorCode.TOO_MANY_RECORDS,
        errorMessage: `${BulkEditErrorMessages[BulkEditErrorCode.TOO_MANY_RECORDS]}. Maximum ${this.MAX_RECORDS} allowed`
      });
    }

    // Validate individual record IDs
    recordIds.forEach((id, index) => {
      if (!Number.isInteger(id) || id <= 0) {
        errors.push({
          fieldName: `recordIds[${index}]`,
          errorCode: ValidationErrorCode.INVALID_FIELD_TYPE,
          errorMessage: 'Record ID must be a positive integer'
        });
      }
    });

    // Check for duplicate record IDs
    const uniqueIds = new Set(recordIds);
    if (uniqueIds.size !== recordIds.length) {
      errors.push({
        fieldName: 'recordIds',
        errorCode: ValidationErrorCode.BUSINESS_RULE_VIOLATION,
        errorMessage: 'Duplicate record IDs are not allowed'
      });
    }
  }

  /**
   * Validate field updates array
   */
  private static validateFieldUpdates(fieldUpdates: FieldUpdate[], entityType: string, errors: ValidationError[]): void {
    if (!fieldUpdates || !Array.isArray(fieldUpdates)) {
      errors.push({
        fieldName: 'fieldUpdates',
        errorCode: ValidationErrorCode.REQUIRED_FIELD_MISSING,
        errorMessage: 'Field updates must be provided as an array'
      });
      return;
    }

    if (fieldUpdates.length === 0) {
      errors.push({
        fieldName: 'fieldUpdates',
        errorCode: BulkEditErrorCode.NO_FIELD_UPDATES,
        errorMessage: BulkEditErrorMessages[BulkEditErrorCode.NO_FIELD_UPDATES]
      });
      return;
    }

    if (fieldUpdates.length > this.MAX_FIELD_UPDATES) {
      errors.push({
        fieldName: 'fieldUpdates',
        errorCode: BulkEditErrorCode.TOO_MANY_RECORDS,
        errorMessage: `Maximum ${this.MAX_FIELD_UPDATES} field updates allowed per operation`
      });
    }

    // Validate individual field updates
    fieldUpdates.forEach((update, index) => {
      this.validateFieldUpdate(update, entityType, index, errors);
    });

    // Check for duplicate field names
    const fieldNames = fieldUpdates.map(update => update.fieldName);
    const uniqueFieldNames = new Set(fieldNames);
    if (uniqueFieldNames.size !== fieldNames.length) {
      errors.push({
        fieldName: 'fieldUpdates',
        errorCode: ValidationErrorCode.BUSINESS_RULE_VIOLATION,
        errorMessage: 'Duplicate field names are not allowed in a single operation'
      });
    }
  }

  /**
   * Validate individual field update
   */
  private static validateFieldUpdate(update: FieldUpdate, entityType: string, index: number, errors: ValidationError[]): void {
    const fieldPrefix = `fieldUpdates[${index}]`;

    // Validate field name
    if (!update.fieldName || typeof update.fieldName !== 'string') {
      errors.push({
        fieldName: `${fieldPrefix}.fieldName`,
        errorCode: ValidationErrorCode.REQUIRED_FIELD_MISSING,
        errorMessage: 'Field name is required and must be a string'
      });
      return;
    }

    // Validate field is bulk editable for this entity type
    if (!isFieldBulkEditable(entityType, update.fieldName)) {
      errors.push({
        fieldName: `${fieldPrefix}.fieldName`,
        errorCode: BulkEditErrorCode.FIELD_NOT_BULK_EDITABLE,
        errorMessage: `Field '${update.fieldName}' is not bulk editable for ${entityType} entities`
      });
      return;
    }

    // Validate operation
    if (!update.operation || !['set', 'clear'].includes(update.operation)) {
      errors.push({
        fieldName: `${fieldPrefix}.operation`,
        errorCode: BulkEditErrorCode.INVALID_OPERATION,
        errorMessage: 'Operation must be either "set" or "clear"'
      });
      return;
    }

    // Get field configuration for detailed validation
    const fieldConfig = getFieldConfig(entityType, update.fieldName);
    if (!fieldConfig) {
      errors.push({
        fieldName: `${fieldPrefix}.fieldName`,
        errorCode: BulkEditErrorCode.FIELD_NOT_BULK_EDITABLE,
        errorMessage: `Field configuration not found for '${update.fieldName}'`
      });
      return;
    }

    // Validate clear operation
    if (update.operation === 'clear') {
      if (!fieldConfig.canClear) {
        errors.push({
          fieldName: `${fieldPrefix}.operation`,
          errorCode: ValidationErrorCode.BUSINESS_RULE_VIOLATION,
          errorMessage: `Field '${update.fieldName}' cannot be cleared`
        });
      }
      if (fieldConfig.required) {
        errors.push({
          fieldName: `${fieldPrefix}.operation`,
          errorCode: ValidationErrorCode.BUSINESS_RULE_VIOLATION,
          errorMessage: `Field '${update.fieldName}' is required and cannot be cleared`
        });
      }
      return; // No need to validate newValue for clear operation
    }

    // Validate set operation - check newValue
    if (update.operation === 'set') {
      this.validateFieldValue(update.newValue, fieldConfig, `${fieldPrefix}.newValue`, errors);
    }
  }

  /**
   * Validate field value against field configuration
   */
  private static validateFieldValue(value: any, fieldConfig: any, fieldPath: string, errors: ValidationError[]): void {
    // Check required fields
    if (fieldConfig.required && (value === null || value === undefined || value === '')) {
      errors.push({
        fieldName: fieldPath,
        errorCode: ValidationErrorCode.REQUIRED_FIELD_MISSING,
        errorMessage: `Field '${fieldConfig.fieldName}' is required`
      });
      return;
    }

    // Skip validation if value is null/undefined for optional fields
    if (value === null || value === undefined) {
      return;
    }

    // Validate data type
    switch (fieldConfig.dataType) {
      case 'string':
        if (typeof value !== 'string') {
          errors.push({
            fieldName: fieldPath,
            errorCode: ValidationErrorCode.INVALID_FIELD_TYPE,
            errorMessage: `Field '${fieldConfig.fieldName}' must be a string`
          });
          return;
        }
        this.validateStringField(value, fieldConfig, fieldPath, errors);
        break;

      case 'number':
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          errors.push({
            fieldName: fieldPath,
            errorCode: ValidationErrorCode.INVALID_FIELD_TYPE,
            errorMessage: `Field '${fieldConfig.fieldName}' must be a valid number`
          });
          return;
        }
        this.validateNumberField(value, fieldConfig, fieldPath, errors);
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          errors.push({
            fieldName: fieldPath,
            errorCode: ValidationErrorCode.INVALID_FIELD_TYPE,
            errorMessage: `Field '${fieldConfig.fieldName}' must be a boolean`
          });
        }
        break;

      case 'date':
        if (!this.isValidDate(value)) {
          errors.push({
            fieldName: fieldPath,
            errorCode: ValidationErrorCode.INVALID_FORMAT,
            errorMessage: `Field '${fieldConfig.fieldName}' must be a valid date`
          });
        }
        break;

      default:
        errors.push({
          fieldName: fieldPath,
          errorCode: ValidationErrorCode.INVALID_FIELD_TYPE,
          errorMessage: `Unknown data type for field '${fieldConfig.fieldName}'`
        });
    }

    // Validate allowed values
    if (fieldConfig.allowedValues && fieldConfig.allowedValues.length > 0) {
      if (!fieldConfig.allowedValues.includes(value)) {
        errors.push({
          fieldName: fieldPath,
          errorCode: ValidationErrorCode.VALUE_OUT_OF_RANGE,
          errorMessage: `Field '${fieldConfig.fieldName}' must be one of: ${fieldConfig.allowedValues.join(', ')}`
        });
      }
    }
  }

  /**
   * Validate string field constraints
   */
  private static validateStringField(value: string, fieldConfig: any, fieldPath: string, errors: ValidationError[]): void {
    if (fieldConfig.maxLength && value.length > fieldConfig.maxLength) {
      errors.push({
        fieldName: fieldPath,
        errorCode: ValidationErrorCode.FIELD_TOO_LONG,
        errorMessage: `Field '${fieldConfig.fieldName}' must not exceed ${fieldConfig.maxLength} characters`
      });
    }

    if (fieldConfig.minLength && value.length < fieldConfig.minLength) {
      errors.push({
        fieldName: fieldPath,
        errorCode: ValidationErrorCode.FIELD_TOO_SHORT,
        errorMessage: `Field '${fieldConfig.fieldName}' must be at least ${fieldConfig.minLength} characters`
      });
    }
  }

  /**
   * Validate number field constraints
   */
  private static validateNumberField(value: number, fieldConfig: any, fieldPath: string, errors: ValidationError[]): void {
    if (fieldConfig.minValue !== undefined && value < fieldConfig.minValue) {
      errors.push({
        fieldName: fieldPath,
        errorCode: ValidationErrorCode.VALUE_OUT_OF_RANGE,
        errorMessage: `Field '${fieldConfig.fieldName}' must be at least ${fieldConfig.minValue}`
      });
    }

    if (fieldConfig.maxValue !== undefined && value > fieldConfig.maxValue) {
      errors.push({
        fieldName: fieldPath,
        errorCode: ValidationErrorCode.VALUE_OUT_OF_RANGE,
        errorMessage: `Field '${fieldConfig.fieldName}' must not exceed ${fieldConfig.maxValue}`
      });
    }
  }

  /**
   * Validate user ID
   */
  private static validateUserId(userId: number, errors: ValidationError[]): void {
    if (!userId) {
      errors.push({
        fieldName: 'userId',
        errorCode: ValidationErrorCode.REQUIRED_FIELD_MISSING,
        errorMessage: 'User ID is required'
      });
      return;
    }

    if (!Number.isInteger(userId) || userId <= 0) {
      errors.push({
        fieldName: 'userId',
        errorCode: ValidationErrorCode.INVALID_FIELD_TYPE,
        errorMessage: 'User ID must be a positive integer'
      });
    }
  }

  /**
   * Check if a value is a valid date
   */
  private static isValidDate(value: any): boolean {
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    
    if (typeof value === 'string') {
      const date = new Date(value);
      return !isNaN(date.getTime());
    }
    
    return false;
  }

  /**
   * Calculate estimated processing duration based on operation complexity
   */
  private static calculateEstimatedDuration(recordCount: number, fieldUpdateCount: number): number {
    // Base time per record (in milliseconds)
    const baseTimePerRecord = 50;
    
    // Additional time per field update per record
    const timePerFieldUpdate = 25;
    
    // Calculate total estimated time
    const totalTime = recordCount * (baseTimePerRecord + (fieldUpdateCount * timePerFieldUpdate));
    
    // Add 20% buffer for database operations and validation
    return Math.round(totalTime * 1.2);
  }
}