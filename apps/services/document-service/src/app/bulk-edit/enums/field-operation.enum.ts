import {
  BULK_EDIT_ENTITY_TYPES,
  type BulkEditEntityType,
} from "../../../../../../../libs/service-lib/src/lib/constants";
/**
 * Enum for field update operations
 * Defines the type of operation to perform on a field
 */
export enum FieldOperation {
  SET = "set",
  CLEAR = "clear",
}

/**
 * Entity types supported by bulk edit (re-exported from global constants)
 * Restricted to company, opportunity, and policy entities
 */
export const EntityType = BULK_EDIT_ENTITY_TYPES;

// Backward compatibility alias for existing consumers using EntityKey naming
export const EntityKey = EntityType;

// Type helpers for entity type values
export type EntityTypeValue = BulkEditEntityType;
export type EntityKeyValue = EntityTypeValue;
