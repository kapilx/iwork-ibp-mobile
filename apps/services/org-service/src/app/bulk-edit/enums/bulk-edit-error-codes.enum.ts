/**
 * Error codes for bulk edit operations
 * Provides standardized error codes for different failure scenarios
 */

/**
 * Enumeration of bulk edit error codes
 */
export enum BulkEditErrorCode {
  /** User lacks permission to perform bulk edit */
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  /** Invalid value provided for a field */
  INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',
  
  /** Record with specified ID not found */
  RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
  
  /** Record was modified by another user/process */
  CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',
  
  /** Field validation failed (business rules) */
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  
  /** Database operation failed */
  DATABASE_ERROR = 'DATABASE_ERROR',
  
  /** Invalid entity type provided */
  INVALID_ENTITY_TYPE = 'INVALID_ENTITY_TYPE',
  
  /** No records provided for bulk edit */
  NO_RECORDS_PROVIDED = 'NO_RECORDS_PROVIDED',
  
  /** Too many records provided (exceeds limit) */
  TOO_MANY_RECORDS = 'TOO_MANY_RECORDS',
  
  /** No field updates provided */
  NO_FIELD_UPDATES = 'NO_FIELD_UPDATES',
  
  /** Field is not bulk editable for this entity type */
  FIELD_NOT_BULK_EDITABLE = 'FIELD_NOT_BULK_EDITABLE',
  
  /** Invalid field update operation */
  INVALID_OPERATION = 'INVALID_OPERATION',
  
  /** Transaction timeout or processing took too long */
  PROCESSING_TIMEOUT = 'PROCESSING_TIMEOUT',
  
  /** Generic system error */
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

/**
 * Validation error codes specific to request validation
 */
export enum ValidationErrorCode {
  /** Required field is missing */
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  
  /** Field type is incorrect */
  INVALID_FIELD_TYPE = 'INVALID_FIELD_TYPE',
  
  /** Field value exceeds maximum allowed length */
  FIELD_TOO_LONG = 'FIELD_TOO_LONG',
  
  /** Field value is below minimum required length */
  FIELD_TOO_SHORT = 'FIELD_TOO_SHORT',
  
  /** Field value is not in allowed range */
  VALUE_OUT_OF_RANGE = 'VALUE_OUT_OF_RANGE',
  
  /** Field value doesn't match required pattern */
  INVALID_FORMAT = 'INVALID_FORMAT',
  
  /** Referenced entity doesn't exist */
  INVALID_REFERENCE = 'INVALID_REFERENCE',
  
  /** Field value conflicts with business rules */
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION'
}

/**
 * Maps error codes to user-friendly error messages
 */
export const BulkEditErrorMessages: Record<BulkEditErrorCode, string> = {
  [BulkEditErrorCode.PERMISSION_DENIED]: 'You do not have permission to perform bulk edit operations',
  [BulkEditErrorCode.INVALID_FIELD_VALUE]: 'Invalid value provided for field',
  [BulkEditErrorCode.RECORD_NOT_FOUND]: 'Record not found or no longer exists',
  [BulkEditErrorCode.CONCURRENT_MODIFICATION]: 'Record has been modified by another user',
  [BulkEditErrorCode.VALIDATION_FAILED]: 'Field validation failed',
  [BulkEditErrorCode.DATABASE_ERROR]: 'Database operation failed',
  [BulkEditErrorCode.INVALID_ENTITY_TYPE]: 'Invalid entity type. Must be company, opportunity, or policy',
  [BulkEditErrorCode.NO_RECORDS_PROVIDED]: 'No records provided for bulk edit operation',
  [BulkEditErrorCode.TOO_MANY_RECORDS]: 'Too many records provided. Maximum limit exceeded',
  [BulkEditErrorCode.NO_FIELD_UPDATES]: 'No field updates provided',
  [BulkEditErrorCode.FIELD_NOT_BULK_EDITABLE]: 'Field is not available for bulk editing',
  [BulkEditErrorCode.INVALID_OPERATION]: 'Invalid field update operation',
  [BulkEditErrorCode.PROCESSING_TIMEOUT]: 'Operation timed out. Please try with fewer records',
  [BulkEditErrorCode.SYSTEM_ERROR]: 'An unexpected system error occurred'
};

/**
 * Maps validation error codes to user-friendly error messages
 */
export const ValidationErrorMessages: Record<ValidationErrorCode, string> = {
  [ValidationErrorCode.REQUIRED_FIELD_MISSING]: 'Required field is missing',
  [ValidationErrorCode.INVALID_FIELD_TYPE]: 'Invalid field type',
  [ValidationErrorCode.FIELD_TOO_LONG]: 'Field value exceeds maximum length',
  [ValidationErrorCode.FIELD_TOO_SHORT]: 'Field value is too short',
  [ValidationErrorCode.VALUE_OUT_OF_RANGE]: 'Value is out of allowed range',
  [ValidationErrorCode.INVALID_FORMAT]: 'Invalid format',
  [ValidationErrorCode.INVALID_REFERENCE]: 'Referenced entity does not exist',
  [ValidationErrorCode.BUSINESS_RULE_VIOLATION]: 'Value violates business rules'
};