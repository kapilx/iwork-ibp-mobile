import { Injectable } from "@nestjs/common";
import * as crypto from "crypto";

/**
 * Encrypted payload structure stored in database
 * @property v - Version number for future-proofing encryption scheme changes
 * @property iv - Initialization Vector (acts as cryptographic salt) in base64
 * @property tag - GCM authentication tag for tamper detection in base64
 * @property ct - Ciphertext (encrypted data) in base64
 */
type EncryptedPayload = {
  v: 1 | 2;
  iv: string;
  tag: string;
  ct: string;
};

/**
 * Field-level encryption service using AES-256-GCM (FIPS 140-2 approved)
 * Provides secure encryption/decryption with unique salt (IV) per operation
 * Implements NFR-SEC-016: Use salt along with secure key for encryption
 *
 * @example
 * // Encrypt a PAN number
 * const encrypted = service.encrypt("AAACH1104K");
 * // Returns: "eyJ2IjoxLCJpdiI6IjdMTVkzbW1keHFMNk..."
 *
 * @example
 * // Decrypt a value
 * const plaintext = service.decrypt(encrypted);
 * // Returns: "AAACH1104K"
 *
 * @example
 * // Generate searchable hash
 * const hash = service.lookupHash("AAACH1104K");
 * // Returns: "188798d723b3a1e0a42b99ec..."
 */
@Injectable()
export class FieldEncryptionService {
  /** Feature flag to enable/disable field encryption */
  private readonly isEnabled: boolean;

  /** AES-256 encryption key (32 bytes) loaded from environment */
  private readonly encryptionKey: Buffer;

  /** Secret pepper for HMAC hash generation (used for searchable hashes) */
  private readonly hashPepper: string;

  /**
   * Initialize encryption service with keys from environment variables
   * @throws Error if FIELD_ENC_KEY_BASE64 is missing or invalid
   */
  constructor() {
    // Check if field encryption feature is enabled
    this.isEnabled = process.env.FF_FIELD_ENCRYPTION_EXPERIMENTAL === "true";

    // Load and validate base64-encoded encryption key from environment
    const encodedKey = process.env.FIELD_ENC_KEY_BASE64;

    // Only validate encryption key if feature is enabled
    if (this.isEnabled) {
      if (!encodedKey) {
        throw new Error(
          "FIELD_ENC_KEY_BASE64 environment variable is required when FF_FIELD_ENCRYPTION_EXPERIMENTAL=true",
        );
      }

      // Decode base64 key to binary buffer
      this.encryptionKey = Buffer.from(encodedKey, "base64");

      // Validate key length (AES-256 requires exactly 32 bytes)
      if (this.encryptionKey.length !== 32) {
        throw new Error(
          `FIELD_ENC_KEY_BASE64 must decode to exactly 32 bytes for AES-256 (got ${this.encryptionKey.length} bytes)`,
        );
      }
    } else {
      // Initialize with dummy buffer when disabled (not used)
      this.encryptionKey = Buffer.alloc(32);
    }

    // Load hash pepper (optional, defaults to empty string)
    this.hashPepper = process.env.FIELD_HASH_PEPPER ?? "";
  }

  /**
   * Encrypts plaintext using AES-256-GCM with a unique random IV (salt) per call
   * Each encryption generates a fresh 12-byte IV, ensuring different ciphertexts
   * for identical plaintexts (semantic security)
   *
   * @param plaintext - The sensitive data to encrypt (e.g., PAN, Aadhaar)
   * @returns Base64-encoded JSON payload containing {v, iv, tag, ct}
   * @returns null/undefined if input is null/undefined/empty (passthrough)
   *
   * @example
   * encrypt("AAACH1104K") → "eyJ2IjoxLCJpdiI6IjdMTVkz..."
   * encrypt(null) → null
   * encrypt("") → ""
   */
  encrypt(plaintext: string | null | undefined): string | null | undefined {
    // Passthrough if feature is disabled or value is null/undefined/empty
    if (!this.isEnabled || plaintext == null || plaintext === "")
      return plaintext;

    // Generate cryptographically random 12-byte IV (NIST SP 800-38D standard for GCM)
    // This IV acts as a unique "salt" for each encryption operation
    const initializationVector = crypto.randomBytes(12);

    // Create AES-256-GCM cipher with key and IV
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      this.encryptionKey,
      initializationVector,
    );

    // Encrypt plaintext and finalize
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, "utf8"),
      cipher.final(),
    ]);

    // Extract GCM authentication tag (proves data integrity and authenticity)
    const authenticationTag = cipher.getAuthTag();

    // Construct payload with all components needed for decryption
    const encryptedPayload: EncryptedPayload = {
      v: 1, // Version for future encryption scheme changes
      iv: initializationVector.toString("base64"),
      tag: authenticationTag.toString("base64"),
      ct: ciphertext.toString("base64"),
    };

    // Serialize payload to JSON and encode as base64 for TEXT column storage
    return Buffer.from(JSON.stringify(encryptedPayload), "utf8").toString(
      "base64",
    );
  }

  /**
   * Decrypts a value encrypted by the encrypt() method
   * Validates authentication tag to detect tampering
   *
   * @param encryptedValue - Base64-encoded encrypted payload from database
   * @returns Original plaintext value
   * @throws Error if authentication tag validation fails (data tampered)
   * @throws Error if decryption fails (wrong key, corrupted data)
   *
   * @example
   * decrypt("eyJ2IjoxLCJpdiI6IjdMTVkz...") → "AAACH1104K"
   * decrypt(null) → null
   */
  decrypt(
    encryptedValue: string | null | undefined,
  ): string | null | undefined {
    // Passthrough if feature is disabled or value is null/undefined/empty
    if (!this.isEnabled || encryptedValue == null || encryptedValue === "")
      return encryptedValue;

    // Decode base64 outer encoding and parse JSON payload
    const encryptedPayload = JSON.parse(
      Buffer.from(encryptedValue, "base64").toString("utf8"),
    ) as EncryptedPayload;

    // Extract and decode base64 components
    const initializationVector = Buffer.from(encryptedPayload.iv, "base64");
    const authenticationTag = Buffer.from(encryptedPayload.tag, "base64");
    const ciphertext = Buffer.from(encryptedPayload.ct, "base64");

    // Create decipher with same algorithm, key, and IV used for encryption
    // Specify tag length (16 bytes/128 bits) for GCM security compliance (NFR-SEC-016)
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      this.encryptionKey,
      initializationVector,
      { authTagLength: 16 }
    );

    // Set authentication tag - decipher will validate it during final()
    // Throws error if tag doesn't match (detects tampering)
    decipher.setAuthTag(authenticationTag);

    // Decrypt ciphertext and finalize (validates auth tag here)
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    return plaintext.toString("utf8");
  }

  /**
   * Deterministic AES-256-GCM encryption: IV is derived from plaintext via HMAC.
   * Same input ALWAYS produces the same ciphertext — enables unique constraints
   * and WHERE-clause queries on encrypted columns (e.g. email, mobile).
   *
   * IV (12 bytes) = HMAC-SHA256(hashPepper, plaintext)[0:12]
   * ciphertext    = AES-256-GCM(encKey, IV, plaintext)
   *
   * Payload uses v:2 to distinguish from random-IV payloads (v:1).
   * Decryption works identically for both since IV is stored in payload.
   *
   * @param plaintext - The sensitive data to encrypt deterministically
   * @returns Base64-encoded JSON payload with {v:2, iv, tag, ct}
   * @returns null/undefined/empty if input is null/undefined/empty
   */
  encryptDeterministic(plaintext: string | null | undefined): string | null | undefined {
    if (!this.isEnabled || plaintext == null || plaintext === '') return plaintext;
    if (this.isEncrypted(plaintext)) return plaintext;

    // Derive a deterministic 12-byte IV from the plaintext using HMAC-SHA256
    // This ensures same input → same IV → same ciphertext
    const deterministicIv = crypto
      .createHmac('sha256', this.hashPepper)
      .update(String(plaintext), 'utf8')
      .digest()
      .slice(0, 12);

    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, deterministicIv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    const encryptedPayload: EncryptedPayload = {
      v: 2,
      iv: deterministicIv.toString('base64'),
      tag: authTag.toString('base64'),
      ct: ciphertext.toString('base64'),
    };

    return Buffer.from(JSON.stringify(encryptedPayload), 'utf8').toString('base64');
  }

  /**
   * Generates a deterministic HMAC-SHA256 hash for searchable lookup
   * Same input always produces same hash (unlike encryption with random IV)
   * Use for database indexing and WHERE clause queries on encrypted fields
   *
   * @param value - The plaintext value to hash (e.g., PAN for search)
   * @returns 64-character hex string (SHA256 digest)
   * @returns null/undefined if input is null/undefined/empty
   *
   * @example
   * // Store hash in separate indexed column for fast lookups
   * lookupHash("AAACH1104K") → "188798d723b3a1e0a42b99ec6f6e66058a15de58ec1d5bed96bf3c0dafd25a15"
   *
   * @example
   * // Query: WHERE pan_card_number_hash = lookupHash(searchTerm)
   */
  lookupHash(value: string | null | undefined): string | null | undefined {
    // Passthrough if feature is disabled or value is null/undefined/empty
    if (!this.isEnabled || value == null || value === "") return value;

    // Create HMAC with SHA256 and pepper as secret key
    // HMAC prevents rainbow table attacks even with known pepper
    return crypto
      .createHmac("sha256", this.hashPepper)
      .update(value, "utf8")
      .digest("hex");
  }

  /**
   * Checks if a value is already encrypted (prevents double encryption)
   * Validates the encrypted payload structure without decrypting
   *
   * @param value - Value to check (typically from entity field)
   * @returns true if value is a valid encrypted payload, false otherwise
   *
   * @example
   * isEncrypted("AAACH1104K") → false (plaintext)
   * isEncrypted("eyJ2IjoxLCJpdiI6...") → true (encrypted)
   * isEncrypted(null) → false
   */
  isEncrypted(value: unknown): boolean {
    // Quick type and length checks before expensive parsing
    if (typeof value !== "string" || value.length < 10) return false;

    try {
      // Attempt to decode and parse as encrypted payload
      const decodedPayload = Buffer.from(value, "base64").toString("utf8");
      const parsedPayload = JSON.parse(decodedPayload);

      // Validate payload has all required encrypted structure fields
      // v:1 = random-IV encryption, v:2 = deterministic encryption
      return (
        (parsedPayload?.v === 1 || parsedPayload?.v === 2) &&
        parsedPayload?.iv &&
        parsedPayload?.tag &&
        parsedPayload?.ct
      );
    } catch {
      // Invalid base64 or JSON indicates not encrypted
      return false;
    }
  }
}
