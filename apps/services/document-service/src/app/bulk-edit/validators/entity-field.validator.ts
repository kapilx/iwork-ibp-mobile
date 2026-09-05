import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import {
  BULK_EDITABLE_FIELDS,
  BULK_EDIT_ENTITY_TYPES,
  type BulkEditEntityType,
} from "../../../../../../../libs/service-lib/src/lib/constants";

const normalizeEntityType = (
  entityType?: string
): BulkEditEntityType | null => {
  if (!entityType) {
    return null;
  }

  const normalized = entityType.toString().toLowerCase();
  return (Object.values(BULK_EDIT_ENTITY_TYPES) as string[]).includes(
    normalized
  )
    ? (normalized as BulkEditEntityType)
    : null;
};

const normalizeFieldName = (fieldName: string): string =>
  typeof fieldName !== "string"
    ? ""
    : fieldName
        .trim()
        .replace(/[\s_-]+(.)?/g, (_, chr: string) =>
          chr ? chr.toUpperCase() : ""
        )
        .replace(/^(.)/, (match) => match.toLowerCase());

/**
 * Custom validator to ensure field names are valid for the given entity type
 */
export function IsValidFieldForEntity(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isValidFieldForEntity",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const obj = args.object as { entityType?: string };
          const entityType = normalizeEntityType(obj.entityType);

          if (!entityType || !Array.isArray(value)) {
            return false;
          }

          const allowedFields =
            BULK_EDITABLE_FIELDS[
              entityType as keyof typeof BULK_EDITABLE_FIELDS
            ];

          if (!allowedFields) {
            return false;
          }

          return value.every((update) => {
            if (typeof update !== "object" || update === null) {
              return false;
            }

            const fieldName = (update as { fieldName?: unknown }).fieldName;
            if (typeof fieldName !== "string") {
              return false;
            }

            const normalizedFieldName = normalizeFieldName(fieldName);
            return allowedFields.includes(normalizedFieldName);
          });
        },
        defaultMessage(args: ValidationArguments) {
          const obj = args.object as { entityType?: string };
          const entityType = normalizeEntityType(obj.entityType);
          const allowedFields = entityType
            ? BULK_EDITABLE_FIELDS[
                entityType as keyof typeof BULK_EDITABLE_FIELDS
              ] || []
            : [];

          return `Field name must be one of: ${allowedFields.join(
            ", "
          )} for entity ${entityType ?? "unknown"}`;
        },
      },
    });
  };
}

/**
 * Custom validator to ensure record count doesn't exceed maximum
 */
export function IsWithinBulkLimit(
  maxRecords: number,
  validationOptions?: ValidationOptions
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isWithinBulkLimit",
      target: object.constructor,
      propertyName: propertyName,
      constraints: [maxRecords],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (!Array.isArray(value)) {
            return false;
          }
          const [maxAllowed] = args.constraints;
          return value.length <= maxAllowed;
        },
        defaultMessage(args: ValidationArguments) {
          const [maxAllowed] = args.constraints;
          return `Cannot process more than ${maxAllowed} records in a single bulk operation`;
        },
      },
    });
  };
}
