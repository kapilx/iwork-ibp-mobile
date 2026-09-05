/**
 * Core interfaces for bulk edit functionality
 * Defines the data structures for bulk edit requests, responses, and error handling
 */

/**
 * Supported entity types for bulk edit operations
 */
export type EntityType = 'company' | 'opportunity' | 'policy';

/**
 * Field update operation types
 */
export type FieldUpdateOperation = 'set' | 'clear';

/**
 * Core bulk edit request interface
 */
export interface BulkEditRequest {
  /** The type of entity being bulk edited */
  entityType: EntityType;
  /** Array of record IDs to be updated */
  recordIds: number[];
  /** Array of field updates to apply */
  fieldUpdates: FieldUpdate[];
  /** ID of the user performing the bulk edit operation */
  userId: number;
}

/**
 * Individual field update specification
 */
export interface FieldUpdate {
  /** Name of the field to update */
  fieldName: string;
  /** New value for the field */
  newValue: any;
  /** Operation type - set new value or clear existing value */
  operation: FieldUpdateOperation;
}

/**
 * Result of bulk edit operation
 */
export interface BulkEditResult {
  /** Total number of records attempted to be updated */
  totalRecords: number;
  /** Number of records successfully updated */
  successCount: number;
  /** Number of records that failed to update */
  failureCount: number;
  /** Array of errors encountered during the operation */
  errors: BulkEditError[];
  /** Array of record IDs that were successfully affected */
  affectedRecords: number[];
  /** Processing duration in milliseconds */
  processingDuration?: number;
}

/**
 * Individual error from bulk edit operation
 */
export interface BulkEditError {
  /** ID of the record that encountered an error */
  recordId: number;
  /** Name of the field that caused the error */
  fieldName: string;
  /** Error code for programmatic handling */
  errorCode: string;
  /** Human-readable error message */
  errorMessage: string;
}

/**
 * Validation result for bulk edit request
 */
export interface ValidationResult {
  /** Whether the request is valid */
  isValid: boolean;
  /** Array of validation errors if any */
  validationErrors: ValidationError[];
  /** Estimated processing time in milliseconds */
  estimatedDuration?: number;
}

/**
 * Individual validation error
 */
export interface ValidationError {
  /** Field name that failed validation */
  fieldName: string;
  /** Error code for the validation failure */
  errorCode: string;
  /** Human-readable validation error message */
  errorMessage: string;
  /** Record ID if applicable to specific record */
  recordId?: number;
}

/**
 * Bulk edit API interface for service implementation
 */
export interface BulkEditAPI {
  /**
   * Validate bulk edit request before execution
   * @param request The bulk edit request to validate
   * @returns Promise resolving to validation result
   */
  validateBulkEdit(request: BulkEditRequest): Promise<ValidationResult>;

  /**
   * Execute bulk edit operation
   * @param request The bulk edit request to execute
   * @returns Promise resolving to bulk edit result
   */
  executeBulkEdit(request: BulkEditRequest): Promise<BulkEditResult>;
}