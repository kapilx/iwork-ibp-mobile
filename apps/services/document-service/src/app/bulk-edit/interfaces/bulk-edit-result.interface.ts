import { BulkEditErrorCode } from '../enums/bulk-edit-error-code.enum';

/**
 * Interface for bulk edit errors
 * Represents an error that occurred during bulk edit operation
 */
export interface BulkEditError {
    /** ID of the record where the error occurred */
    recordId: number;
    
    /** Name of the field that caused the error */
    fieldName: string;
    
    /** Error code categorizing the type of error */
    errorCode: BulkEditErrorCode;
    
    /** Human-readable error message */
    errorMessage: string;
}

/**
 * Interface for bulk edit operation result
 * Contains comprehensive information about the bulk edit operation outcome
 */
export interface BulkEditResult {
    /** Total number of records that were attempted to be updated */
    totalRecords: number;
    
    /** Number of records successfully updated */
    successCount: number;
    
    /** Number of records that failed to update */
    failureCount: number;
    
    /** Array of errors that occurred during the operation */
    errors: BulkEditError[];
    
    /** Array of record IDs that were successfully affected */
    affectedRecords: number[];
}

/**
 * Interface for validation result
 * Used to return validation results before executing bulk operations
 */
export interface ValidationResult {
    /** Whether the validation passed */
    isValid: boolean;
    
    /** Array of validation errors if any */
    errors: BulkEditError[];
    
    /** Additional validation messages or warnings */
    warnings?: string[];
}