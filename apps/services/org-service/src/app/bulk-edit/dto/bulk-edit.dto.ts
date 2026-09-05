import type { EntityType, FieldUpdateOperation } from '../interfaces/bulk-edit.interface';

/**
 * DTO for individual field update in bulk edit operation
 */
export class FieldUpdateDto {
  /** Name of the field to update */
  fieldName!: string;

  /** New value for the field. Can be string, number, boolean, or null for clear operation */
  newValue?: any;

  /** Operation to perform on the field */
  operation!: FieldUpdateOperation;
}

/**
 * DTO for bulk edit request validation and execution
 */
export class BulkEditRequestDto {
  /** Type of entity to bulk edit */
  entityType!: EntityType;

  /** Array of record IDs to update */
  recordIds!: number[];

  /** Array of field updates to apply */
  fieldUpdates!: FieldUpdateDto[];

  /** ID of the user performing the bulk edit operation */
  userId!: number;
}

/**
 * DTO for individual bulk edit error
 */
export class BulkEditErrorDto {
  /** ID of the record that encountered an error */
  recordId!: number;

  /** Name of the field that caused the error */
  fieldName!: string;

  /** Error code for programmatic handling */
  errorCode!: string;

  /** Human-readable error message */
  errorMessage!: string;
}

/**
 * DTO for bulk edit operation result
 */
export class BulkEditResultDto {
  /** Total number of records attempted to be updated */
  totalRecords!: number;

  /** Number of records successfully updated */
  successCount!: number;

  /** Number of records that failed to update */
  failureCount!: number;

  /** Array of errors encountered during the operation */
  errors!: BulkEditErrorDto[];

  /** Array of record IDs that were successfully affected */
  affectedRecords!: number[];

  /** Processing duration in milliseconds */
  processingDuration?: number;
}

/**
 * DTO for validation error
 */
export class ValidationErrorDto {
  /** Field name that failed validation */
  fieldName!: string;

  /** Error code for the validation failure */
  errorCode!: string;

  /** Human-readable validation error message */
  errorMessage!: string;

  /** Record ID if applicable to specific record */
  recordId?: number;
}

/**
 * DTO for validation result
 */
export class ValidationResultDto {
  /** Whether the request is valid */
  isValid!: boolean;

  /** Array of validation errors if any */
  validationErrors!: ValidationErrorDto[];

  /** Estimated processing time in milliseconds */
  estimatedDuration?: number;
}

/**
 * Standard API response wrapper for bulk edit validation
 */
export class BulkEditValidationResponseDto {
  /** HTTP status code */
  statusCode!: number;

  /** Response message */
  message!: string;

  /** Validation result data */
  data!: ValidationResultDto;
}

/**
 * Standard API response wrapper for bulk edit execution
 */
export class BulkEditExecutionResponseDto {
  /** HTTP status code */
  statusCode!: number;

  /** Response message */
  message!: string;

  /** Bulk edit result data */
  data!: BulkEditResultDto;
}