/**
 * Configuration for bulk editable fields per entity type
 * Defines which fields can be bulk edited for each entity
 */

/**
 * Bulk editable fields for Company entity
 */
export enum CompanyBulkEditFields {
  LEAD_CRM = "lead_crm",
  ACCOUNT_MANAGER = "account_manager",
  STATUS = "status",
  PRIORITY = "priority",
}

/**
 * Bulk editable fields for Opportunity entity
 */
export enum OpportunityBulkEditFields {
  BD_OWNER = "bd_owner",
  ISG_OWNER = "isg_owner",
  STATUS = "status",
  EXPIRY_DATE = "expiry_date",
}

/**
 * Bulk editable fields for Policy entity
 */
export enum PolicyBulkEditFields {
  LEAD_CRM = "lead_crm",
  ISG_OWNER = "isg_owner",
  ACCOUNT_MANAGER = "account_manager",
  STATUS = "status",
}

/**
 * Type union of all bulk editable fields
 */
export type BulkEditableField =
  | CompanyBulkEditFields
  | OpportunityBulkEditFields
  | PolicyBulkEditFields;

/**
 * Entity field mapping - maps entity types to their bulk editable fields
 */
export const ENTITY_BULK_EDITABLE_FIELDS = {
  company: Object.values(CompanyBulkEditFields),
  opportunity: Object.values(OpportunityBulkEditFields),
  policy: Object.values(PolicyBulkEditFields),
} as const;

/**
 * Field validation configuration for each entity type
 */
export interface FieldConfig {
  /** Field name */
  fieldName: string;
  /** Data type expected for the field */
  dataType: "string" | "number" | "boolean" | "date";
  /** Whether the field is required */
  required: boolean;
  /** Maximum length for string fields */
  maxLength?: number;
  /** Minimum value for number fields */
  minValue?: number;
  /** Maximum value for number fields */
  maxValue?: number;
  /** Allowed values for enum-like fields */
  allowedValues?: (string | number)[];
  /** Whether the field can be cleared (set to null) */
  canClear: boolean;
}

/**
 * Field configuration for Company bulk editable fields
 */
export const COMPANY_FIELD_CONFIG: Record<CompanyBulkEditFields, FieldConfig> =
  {
    [CompanyBulkEditFields.LEAD_CRM]: {
      fieldName: "lead_crm",
      dataType: "number",
      required: false,
      canClear: true,
    },
    [CompanyBulkEditFields.ACCOUNT_MANAGER]: {
      fieldName: "account_manager",
      dataType: "number",
      required: false,
      canClear: true,
    },
    [CompanyBulkEditFields.STATUS]: {
      fieldName: "status",
      dataType: "number",
      required: true,
      minValue: 0,
      canClear: true,
    },
    [CompanyBulkEditFields.PRIORITY]: {
      fieldName: "priority",
      dataType: "number",
      required: false,
      minValue: 0,
      canClear: true,
    },
  };

/**
 * Field configuration for Opportunity bulk editable fields
 */
export const OPPORTUNITY_FIELD_CONFIG: Record<
  OpportunityBulkEditFields,
  FieldConfig
> = {
  [OpportunityBulkEditFields.BD_OWNER]: {
    fieldName: "bd_owner",
    dataType: "number",
    required: false,
    canClear: true,
  },
  [OpportunityBulkEditFields.ISG_OWNER]: {
    fieldName: "isg_owner",
    dataType: "number",
    required: false,
    canClear: true,
  },
  [OpportunityBulkEditFields.STATUS]: {
    fieldName: "status",
    dataType: "string",
    required: true,
    maxLength: 50,
    canClear: false,
  },
  [OpportunityBulkEditFields.EXPIRY_DATE]: {
    fieldName: "expiry_date",
    dataType: "date",
    required: false,
    canClear: true,
  },
};

/**
 * Field configuration for Policy bulk editable fields
 */
export const POLICY_FIELD_CONFIG: Record<PolicyBulkEditFields, FieldConfig> = {
  [PolicyBulkEditFields.LEAD_CRM]: {
    fieldName: "lead_crm",
    dataType: "number",
    required: false,
    canClear: true,
  },
  [PolicyBulkEditFields.ISG_OWNER]: {
    fieldName: "isg_owner",
    dataType: "number",
    required: false,
    canClear: true,
  },
  [PolicyBulkEditFields.ACCOUNT_MANAGER]: {
    fieldName: "account_manager",
    dataType: "number",
    required: false,
    canClear: true,
  },
  [PolicyBulkEditFields.STATUS]: {
    fieldName: "status",
    dataType: "string",
    required: true,
    maxLength: 50,
    canClear: false,
  },
};

/**
 * Get field configuration for a specific entity type and field
 */
export function getFieldConfig(
  entityType: string,
  fieldName: string
): FieldConfig | null {
  switch (entityType) {
    case "company":
      return COMPANY_FIELD_CONFIG[fieldName as CompanyBulkEditFields] || null;
    case "opportunity":
      return (
        OPPORTUNITY_FIELD_CONFIG[fieldName as OpportunityBulkEditFields] || null
      );
    case "policy":
      return POLICY_FIELD_CONFIG[fieldName as PolicyBulkEditFields] || null;
    default:
      return null;
  }
}

/**
 * Check if a field is bulk editable for a given entity type
 */
export function isFieldBulkEditable(
  entityType: string,
  fieldName: string
): boolean {
  switch (entityType) {
    case "company":
      return Object.values(CompanyBulkEditFields).includes(
        fieldName as CompanyBulkEditFields
      );
    case "opportunity":
      return Object.values(OpportunityBulkEditFields).includes(
        fieldName as OpportunityBulkEditFields
      );
    case "policy":
      return Object.values(PolicyBulkEditFields).includes(
        fieldName as PolicyBulkEditFields
      );
    default:
      return false;
  }
}
