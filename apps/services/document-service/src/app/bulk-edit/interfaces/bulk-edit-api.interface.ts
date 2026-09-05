import { BulkEditRequest } from './bulk-edit-request.interface';
import { BulkEditResult, ValidationResult } from './bulk-edit-result.interface';

/**
 * Interface for the Bulk Edit API
 * Defines the contract for bulk edit operations
 */
export interface BulkEditAPI {
    /**
     * Validate a bulk edit request before execution
     * @param request The bulk edit request to validate
     * @returns Promise resolving to validation result
     */
    validateBulkEdit(request: BulkEditRequest): Promise<ValidationResult>;
    
    /**
     * Execute a bulk edit operation
     * @param request The bulk edit request to execute
     * @returns Promise resolving to operation result
     */
    executeBulkEdit(request: BulkEditRequest): Promise<BulkEditResult>;
}