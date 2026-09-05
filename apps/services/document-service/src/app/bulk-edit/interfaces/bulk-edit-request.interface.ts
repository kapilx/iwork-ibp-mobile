import {
  EntityType,
  FieldOperation,
} from "../enums/field-operation.enum";

/**
 * Interface for bulk edit request
 * Contains all information needed to perform a bulk edit operation
 */
export interface FieldUpdate {
  /** Name of the field to update */
  fieldName: string;

  /** New value to apply when operation is set */
  newValue?: unknown;

  /** Operation describing how to handle the field */
  operation: FieldOperation;
}

export interface BulkEditRequest {
  /** Type of entity being bulk edited */
  entityType: (typeof EntityType)[keyof typeof EntityType];

  /** Array of record IDs to update */
  recordIds: number[];

  /** Collection of field updates to apply */
  fieldUpdates: FieldUpdate[];

  /** ID of the user performing the operation */
  userId: number;
}
