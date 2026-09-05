import "reflect-metadata";

/**
 * Metadata key (Symbol) for storing sensitive field configurations
 * Using Symbol ensures no collision with other metadata keys
 */
export const SENSITIVE_FIELDS_META = Symbol("SENSITIVE_FIELDS_META");

/**
 * Configuration options for fields marked as sensitive
 * @property lookupHashColumn - Optional column name to store searchable HMAC hash
 *                               If provided, a deterministic hash will be generated
 *                               and stored for WHERE clause queries
 * @property deterministic - When true, uses deterministic AES-256-GCM (HMAC-derived IV)
 *                            so the same plaintext always produces the same ciphertext.
 *                            Enables unique constraints and WHERE-clause lookups on
 *                            encrypted columns (e.g. email, mobile).
 */
export type SensitiveFieldOptions = {
  /**
   * Name of the database column to store searchable hash
   * @example
   * @SensitiveField({ lookupHashColumn: 'panCardNumberHash' })
   * panCardNumber: string;
   */
  lookupHashColumn?: string;

  /**
   * Use deterministic encryption (HMAC-derived IV) instead of random IV.
   * Same input → same ciphertext. Required for unique-constrained columns.
   * @example
   * @SensitiveField({ deterministic: true })
   * emailId: string;
   */
  deterministic?: boolean;
};

/**
 * Decorator to mark entity fields for automatic encryption
 * Fields marked with @SensitiveField will be encrypted before database writes
 * and must be manually decrypted when reading (see decryptSelectedFields utility)
 *
 * @param options - Configuration for encryption behavior
 * @returns PropertyDecorator that attaches metadata to the field
 *
 * @example
 * // Basic usage - encrypt field only
 * @SensitiveField()
 * @Column({ name: 'ssn', type: 'text' })
 * socialSecurityNumber: string;
 *
 * @example
 * // With searchable hash for WHERE queries
 * @SensitiveField({ lookupHashColumn: 'panCardNumberHash' })
 * @Column({ name: 'pan_card_number', type: 'text' })
 * panCardNumber: string;
 *
 * @Column({ name: 'pan_card_number_hash', type: 'text' })
 * panCardNumberHash: string; // Auto-populated by subscriber
 */
export function SensitiveField(options: SensitiveFieldOptions = {}) {
  return (targetEntity: any, fieldPropertyKey: string) => {
    // Retrieve existing sensitive fields metadata from entity class
    const existingSensitiveFields: Record<string, SensitiveFieldOptions> =
      Reflect.getMetadata(SENSITIVE_FIELDS_META, targetEntity.constructor) ??
      {};

    // Add this field to the sensitive fields registry
    existingSensitiveFields[fieldPropertyKey] = options;

    // Store updated metadata back to entity class constructor
    Reflect.defineMetadata(
      SENSITIVE_FIELDS_META,
      existingSensitiveFields,
      targetEntity.constructor,
    );
  };
}

/**
 * Retrieves all fields marked with @SensitiveField decorator from an entity instance
 * Used by FieldEncryptionSubscriber to identify which fields need encryption
 *
 * @param entityInstance - Instance of entity to extract metadata from
 * @returns Map of field names to their encryption options
 *
 * @example
 * const fields = getSensitiveFields(companyEntity);
 * // Returns: { panCardNumber: { lookupHashColumn: 'panCardNumberHash' } }
 */
export function getSensitiveFields(
  entityInstance: any,
): Record<string, SensitiveFieldOptions> {
  // Extract metadata from entity's constructor (where decorator attached it)
  return (
    Reflect.getMetadata(
      SENSITIVE_FIELDS_META,
      entityInstance.constructor ?? entityInstance,
    ) ?? {}
  );
}
