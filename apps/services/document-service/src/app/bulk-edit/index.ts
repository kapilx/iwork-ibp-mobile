// Export all bulk edit related types and utilities
export * from "./interfaces";
export * from "./dto";
export * from "./enums";
export * from "./validators/entity-field.validator";

// Export services and controllers
export * from "./services/bulk-edit.service";
export * from "./controllers/bulk-edit.controller";
export * from "./bulk-edit.module";

export {
  BULK_EDITABLE_FIELDS,
  BULK_EDIT_ENTITY_KEYS,
  BULK_EDIT_LIMITS,
} from "../../../../../../libs/service-lib/src/lib/constants";

// Export swagger functions
export {
  validateBulkEditSwaggerMetadata,
  executeBulkEditSwaggerMetadata,
} from "./bulk-edit.swagger";
