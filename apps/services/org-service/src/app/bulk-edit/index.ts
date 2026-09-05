/**
 * Bulk Edit Module - Core Data Models and DTOs
 * 
 * This module provides all the necessary interfaces, DTOs, enums, and utilities
 * for bulk edit functionality in the org-service.
 */

// Core interfaces
export * from './interfaces/bulk-edit.interface';

// Data Transfer Objects (DTOs)
export * from './dto/bulk-edit.dto';

// Error codes and enums
export * from './enums/bulk-edit-error-codes.enum';
export * from './enums/bulk-edit-fields.enum';

// Validation utilities
export * from './validators/bulk-edit.validator';

/**
 * Type guards for runtime type checking
 */
export function isBulkEditRequest(obj: any): obj is import('./interfaces/bulk-edit.interface').BulkEditRequest {
  return obj && 
    typeof obj.entityType === 'string' &&
    Array.isArray(obj.recordIds) &&
    Array.isArray(obj.fieldUpdates) &&
    typeof obj.userId === 'number';
}

export function isFieldUpdate(obj: any): obj is import('./interfaces/bulk-edit.interface').FieldUpdate {
  return obj &&
    typeof obj.fieldName === 'string' &&
    typeof obj.operation === 'string' &&
    ['set', 'clear'].includes(obj.operation);
}

export function isValidEntityType(entityType: string): entityType is import('./interfaces/bulk-edit.interface').EntityType {
  return ['company', 'opportunity', 'policy'].includes(entityType);
}

/**
 * Constants for bulk edit operations
 */
export const BULK_EDIT_CONSTANTS = {
  MAX_RECORDS_PER_OPERATION: 1000,
  MAX_FIELD_UPDATES_PER_OPERATION: 10,
  DEFAULT_TIMEOUT_MS: 30000, // 30 seconds
  SUPPORTED_ENTITY_TYPES: ['company', 'opportunity', 'policy'] as const,
  SUPPORTED_OPERATIONS: ['set', 'clear'] as const,
} as const;