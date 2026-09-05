import { FieldEncryptionService } from "../services/field-encryption.service";

/**
 * Utility function to decrypt specific fields in an object before returning to API client
 * Use this in service layer to decrypt sensitive fields retrieved from database
 *
 * NOTE: Encryption happens automatically via subscriber, but decryption is manual
 * This gives developers control over when sensitive data is exposed in plaintext
 *
 * @param encryptionService - Instance of FieldEncryptionService for decryption
 * @param entityObject - Object containing encrypted fields (e.g., company entity from DB)
 * @param fieldsToDecrypt - Array of field names to decrypt (e.g., ['panCardNumber', 'aadhaarNumber'])
 * @returns Same object with specified fields decrypted in-place
 *
 * @example
 * // In service method
 * async getCompanyById(id: string) {
 *   const company = await this.companyRepository.findOne({ where: { id } });
 *   // company.panCardNumber is encrypted: "eyJ2IjoxLCJpdiI6..."
 *
 *   // Decrypt before returning to client
 *   decryptSelectedFields(this.fieldEncryptionService, company, ['panCardNumber']);
 *   // company.panCardNumber is now plaintext: "AAACH1104K"
 *
 *   return company;
 * }
 *
 * @example
 * // Decrypt multiple fields
 * decryptSelectedFields(service, user, ['ssn', 'aadhaarNumber', 'panCardNumber']);
 *
 * @example
 * // Works with null/undefined objects safely
 * decryptSelectedFields(service, null, ['field']); // Returns null
 */
export function decryptSelectedFields<T extends Record<string, any>>(
  encryptionService: FieldEncryptionService,
  entityObject: T,
  fieldsToDecrypt: string[],
): T {
  // Handle null/undefined objects gracefully
  if (!entityObject) return entityObject;

  // Iterate through each field name provided
  for (const fieldName of fieldsToDecrypt) {
    const fieldValue = entityObject[fieldName];

    // Only decrypt if value is a string and is encrypted
    // This handles cases where field might be null, undefined, or already plaintext
    if (
      typeof fieldValue === "string" &&
      encryptionService.isEncrypted(fieldValue)
    ) {
      // Decrypt in-place (mutates original object)
      entityObject[fieldName] = encryptionService.decrypt(fieldValue);
    }
  }

  return entityObject;
}
