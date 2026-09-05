/**
 * Enum for bulk edit error codes
 * Used to categorize different types of errors during bulk operations
 */
export enum BulkEditErrorCode {
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    INVALID_FIELD_VALUE = 'INVALID_FIELD_VALUE',
    RECORD_NOT_FOUND = 'RECORD_NOT_FOUND',
    CONCURRENT_MODIFICATION = 'CONCURRENT_MODIFICATION',
    VALIDATION_FAILED = 'VALIDATION_FAILED',
    DATABASE_ERROR = 'DATABASE_ERROR'
}