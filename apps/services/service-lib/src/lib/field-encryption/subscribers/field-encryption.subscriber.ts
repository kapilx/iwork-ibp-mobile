import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
  UpdateEvent,
} from "typeorm";
import { FieldEncryptionService } from "../services/field-encryption.service";
import {
  getSensitiveFields,
  SENSITIVE_FIELDS_META,
  SensitiveFieldOptions,
} from "../decorators/sensitive-field.decorator";

/**
 * TypeORM subscriber for automatic field-level encryption
 * Intercepts INSERT and UPDATE operations to encrypt fields marked with @SensitiveField
 * This ensures sensitive data is never stored in plaintext without developer intervention
 *
 * @example
 * // Developer code - just save entity normally
 * company.panCardNumber = "AAACH1104K"; // Plaintext
 * await companyRepository.save(company);
 *
 * // What subscriber does automatically:
 * // 1. Detects panCardNumber has @SensitiveField decorator
 * // 2. Encrypts "AAACH1104K" → "eyJ2IjoxLCJpdiI6..."
 * // 3. Generates hash → "188798d723b3a1e0..." (if lookupHashColumn set)
 * // 4. Saves both encrypted value and hash to database
 */
@EventSubscriber()
export class FieldEncryptionSubscriber implements EntitySubscriberInterface {
  constructor(
    private readonly dataSource: DataSource,
    private readonly fieldEncryptionService: FieldEncryptionService,
  ) {
    // Register this subscriber with TypeORM to receive entity lifecycle events
    // This allows us to intercept beforeInsert/beforeUpdate hooks
    dataSource.subscribers.push(this);

    // Configure columns for @SensitiveField properties.
    // When encryption is enabled: set column transformers so find/findOne WHERE
    // values are auto-encrypted — no manual encryption needed in repos.
    // When encryption is disabled: rewrite _enc column names back to originals
    // so queries hit the plain-text columns and the app works without encryption.
    this.configureSensitiveColumns();
  }

  /**
   * Configures columns that back @SensitiveField properties based on the
   * FF_FIELD_ENCRYPTION_EXPERIMENTAL feature flag.
   *
   * Enabled  → attach transformer.to() that encrypts WHERE values
   * Disabled → rewrite databaseName from `xxx_enc` to `xxx` (original column)
   */
  private configureSensitiveColumns() {
    const isEnabled = process.env.FF_FIELD_ENCRYPTION_EXPERIMENTAL === "true";

    for (const entityMeta of this.dataSource.entityMetadatas) {
      const sensitiveFields: Record<string, SensitiveFieldOptions> =
        Reflect.getMetadata(SENSITIVE_FIELDS_META, entityMeta.target) ?? {};

      for (const [propertyName, options] of Object.entries(sensitiveFields)) {
        const column = entityMeta.columns.find(
          (col) => col.propertyName === propertyName,
        );
        if (!column) continue;

        if (isEnabled && options.deterministic) {
          // Attach transformer so WHERE values are auto-encrypted
          const encService = this.fieldEncryptionService;
          column.transformer = {
            to(value: any): any {
              if (value == null || value === "") return value;
              if (encService.isEncrypted(value)) return value;
              return encService.encryptDeterministic(String(value));
            },
            from(value: any): any {
              // afterLoad hook handles decryption — return as-is
              return value;
            },
          };
        } else if (!isEnabled) {
          // Encryption disabled — point column back to original (non-_enc) DB column
          const dbName = column.databaseName;
          if (dbName.endsWith("_enc")) {
            const originalName = dbName.slice(0, -4); // strip "_enc"
            (column as any).databaseName = originalName;
            (column as any).databaseNameWithoutPrefixes = originalName;
            (column as any).databasePath = column.databasePath.replace(dbName, originalName);
          }
        }
      }
    }
  }

  /**
   * Hook called before new entity is inserted into database
   * Encrypts all fields marked with @SensitiveField decorator
   *
   * @param event - TypeORM insert event containing entity to be saved
   */
  beforeInsert(event: InsertEvent<any>) {
    if (!event.entity) return;
    this.encryptSensitiveFields(event.entity);
  }

  /**
   * Hook called before existing entity is updated in database
   * Encrypts all fields marked with @SensitiveField decorator
   * Prevents plaintext from being accidentally saved during updates
   *
   * @param event - TypeORM update event containing entity changes
   */
  beforeUpdate(event: UpdateEvent<any>) {
    if (!event.entity) return;
    this.encryptSensitiveFields(event.entity);
  }

  /**
   * Hook called after an entity is loaded from database
   * Automatically decrypts all fields marked with @SensitiveField
   * This means service code always receives plaintext — no manual decryption needed
   *
   * @param entity - Entity instance that was just loaded from the database
   */
  afterLoad(entity: any) {
    if (!entity) return;
    const sensitiveFieldsConfig = getSensitiveFields(entity);
    for (const [fieldName] of Object.entries(sensitiveFieldsConfig)) {
      const value = entity[fieldName];
      if (typeof value === 'string' && this.fieldEncryptionService.isEncrypted(value)) {
        try {
          entity[fieldName] = this.fieldEncryptionService.decrypt(value);
        } catch {
          // GCM tag mismatch — value was encrypted with a different key or is
          // corrupted. Leave the field as null so the app stays functional.
          // Re-run the PII migration with the correct key to fix permanently.
          entity[fieldName] = null;
        }
      }
    }
  }

  /**
   * Serializes a field value to a plain string before encryption.
   * Date objects are formatted as YYYY-MM-DD using local date components so
   * that the stored plaintext matches the original database date format.
   * Using Date.toString() or toISOString() produces locale/UTC-shifted strings
   * that don't match the source value (e.g. "Mon Jun 10 1991 00:00:00 GMT+0530").
   */
  private serializeValue(value: unknown): string {
    if (value instanceof Date) {
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
    }
    return String(value);
  }

  /**
   * Encrypts all sensitive fields in an entity before database write
   * Skips null/empty values and already-encrypted values (prevents double encryption)
   * Optionally generates searchable hash if lookupHashColumn is configured
   *
   * @param entity - Entity instance being saved/updated
   *
   * @example
   * // Input entity:
   * { panCardNumber: "AAACH1104K", panCardNumberHash: undefined }
   *
   * // After encryption:
   * {
   *   panCardNumber: "eyJ2IjoxLCJpdiI6IjdMTVkz...",
   *   panCardNumberHash: "188798d723b3a1e0a42b99ec..."
   * }
   */
  private encryptSensitiveFields(entity: any) {
    // Get all fields marked with @SensitiveField from entity metadata
    const sensitiveFieldsConfig = getSensitiveFields(entity);

    // Process each sensitive field
    for (const [fieldName, fieldOptions] of Object.entries(
      sensitiveFieldsConfig,
    )) {
      const fieldValue = entity[fieldName];

      // Skip null, undefined, or empty string values (nothing to encrypt)
      if (fieldValue == null || fieldValue === "") continue;

      // Prevent double encryption - skip if already encrypted
      // This handles cases where entity is saved multiple times or
      // when developer manually encrypts before save
      if (this.fieldEncryptionService.isEncrypted(fieldValue)) continue;

      const stringValue = this.serializeValue(fieldValue);

      // Generate searchable hash if lookupHashColumn is configured
      // This enables WHERE clause queries on encrypted data
      if (fieldOptions.lookupHashColumn) {
        entity[fieldOptions.lookupHashColumn] =
          this.fieldEncryptionService.lookupHash(stringValue);
      }

      // Encrypt the sensitive field value
      // Use deterministic encryption when configured (same input → same ciphertext)
      // Otherwise use random-IV encryption for maximum confidentiality
      if (fieldOptions.deterministic) {
        entity[fieldName] = this.fieldEncryptionService.encryptDeterministic(stringValue);
      } else {
        entity[fieldName] = this.fieldEncryptionService.encrypt(stringValue);
      }
    }
  }
}
