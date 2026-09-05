# NFR-SEC-016 Implementation - Field-Level Encryption

## ✅ Compliance Summary

| Requirement                     | Implementation                                                     | Status |
| ------------------------------- | ------------------------------------------------------------------ | ------ |
| Secure salt with encryption     | 12-byte random IV per encryption (`crypto.randomBytes(12)`)        | ✅     |
| Dynamic salt generation         | Fresh IV generated for every encryption                            | ✅     |
| Unique salt per value           | Cryptographically random (2^-96 collision probability)             | ✅     |
| Store salt with encrypted value | Stored in payload: `{"v":1,"iv":"...","tag":"...","ct":"..."}`     | ✅     |
| Validate during decryption      | GCM authentication tag validates IV + data integrity               | ✅     |
| Security testing                | Unit tests verify IV uniqueness, tamper detection, encrypt/decrypt | ✅     |
| Hash not exposed in API         | `@Exclude()` decorator + `omitFields()` filtering                  | ✅     |
| Automatic encryption            | Entity subscriber auto-encrypts on save/update                     | ✅     |

---

## How It Works

**Encryption Flow:**

```
Plaintext: "AAACH1104K"
  ↓ Generate random 12-byte IV (acts as salt)
  ↓ Encrypt with AES-256-GCM
  ↓ Create payload: {v:1, iv:"...", tag:"...", ct:"..."}
  ↓ Base64 encode payload
Database: "eyJ2IjoxLCJpdiI6IjdMTVkzbW1keHFMNktHcGwiLCJ0YWciOi..."
Hash (for search): "188798d723b3a1e0a42b99ec6f6e66058a15de58ec1d5bed96bf3c0dafd25a15"
```

**Decryption Flow:**

```
Database value → Decode base64 → Extract IV + auth tag + ciphertext
  ↓ Validate auth tag (prevents tampering)
  ↓ Decrypt using IV + key
Plaintext: "AAACH1104K"
```

**Key Points:**

- **Algorithm:** AES-256-GCM (FIPS 140-2 approved, PCI DSS compliant)
- **IV (Salt):** 12-byte random value per encryption (NIST SP 800-38D standard)
- **Authentication:** Built-in tamper detection via GCM tag
- **Searchable:** HMAC-SHA256 hash stored in separate indexed column
- **Hash Security:** Hash column excluded from all API responses using `@Exclude()` and repository filtering

---

## Implementation Details

### 1. Environment Setup

**Required Environment Variables:**

```bash
# Feature flag to enable/disable field encryption (EXPERIMENTAL lifecycle)
FF_FIELD_ENCRYPTION_EXPERIMENTAL=true

# Required when FF_FIELD_ENCRYPTION_EXPERIMENTAL=true
FIELD_ENC_KEY_BASE64=<32-byte-key-in-base64>

# Optional: for searchable hash columns
FIELD_HASH_PEPPER=<random-pepper-string>
```

**Behavior:**

- When `FF_FIELD_ENCRYPTION_EXPERIMENTAL=false` or not set: Data stored as plaintext (backward compatible)
- When `FF_FIELD_ENCRYPTION_EXPERIMENTAL=true`: Encryption/decryption active
- Validation errors if `FIELD_ENC_KEY_BASE64` missing when enabled

### 2. Core Encryption Utility

**Components:**

- **FieldEncryptionService** - Encrypt/decrypt with random IV generation
- **@SensitiveField** - Decorator to mark fields for encryption
- **FieldEncryptionSubscriber** - Auto-encrypts on `save()` operations
- **decryptSelectedFields()** - Helper for API response decryption
- **Constants** - `SENSITIVE_FIELD_NAMES` for field name references

### 2. Company PAN Card Number Implementation

**Entity Changes:**

```typescript
@SensitiveField({ lookupHashColumn: "panCardNumberHash" })
@Column({ name: "pan_card_number", type: "text", nullable: true })
panCardNumber?: string;

@Exclude()
@Column({ name: "pan_card_number_hash", type: "text", nullable: true })
panCardNumberHash?: string;
```

**Service Layer:**

- Auto-encrypts on `createCompany()` and `updateCompany()`
- Auto-decrypts on `getCompanyById()` before API response
- Uses constants: `SENSITIVE_FIELD_NAMES.PAN_CARD_NUMBER`

**Repository Layer:**

- Changed `update()` to `save()` to trigger encryption subscriber
- `omitFields()` method filters out `panCardNumberHash` from responses
- Duplicate detection using both old and new constraint names for backward compatibility

### 3. Database Migrations

**Migration 1: AddPanCardHashColumn1737638400000.ts**

- Adds `pan_card_number_hash` column
- Creates unique index on hash column
- Drops old constraint, creates new hash-based constraint
- Backward compatible with existing PAN constraints

**Migration 2: EncryptExistingPANs1737638500000.ts**

- Encrypts all existing plain-text PAN values
- Generates hash for each encrypted PAN
- Safely handles NULL values
- Batch processes for performance

### 4. Security Measures

✅ **Hash Never Exposed:**

- Entity: `@Exclude()` decorator on `panCardNumberHash`
- Repository: `omitFields()` destructures and omits hash from all responses
- Service: Explicit `delete company.panCardNumberHash` after decryption

✅ **Constant Usage:**

- Field names use `SENSITIVE_FIELD_NAMES` constant
- Constraint names use `DUPLICATE_CONSTRAINT` constant
- Eliminates magic strings, improves maintainability

✅ **Error Handling:**

- Duplicate PAN detection using hash
- Proper error messages for constraint violations
- Supports both legacy and new constraint names

---

## Test Results

**Unit Tests Created:** `company-pan-encryption.spec.ts`

```
✓ encrypts PAN on creation
✓ decrypts PAN on retrieval
✓ encrypts updated PAN
✓ prevents duplicate PAN using hash
✓ handles NULL PAN values
✓ generates consistent hash for lookup
```

**Integration Test:**

```
Input: "AAACH1104K"
Encrypted (DB): eyJ2IjoxLCJpdiI6IjdMTVkz... (unique IV each time)
Hash (DB): 188798d723b3a1e0a42b99ec6f6e66058a15de58ec1d5bed96bf3c0dafd25a15
Decrypted (API): "AAACH1104K" ✅
Hash in Response: NOT PRESENT ✅
```

**Security Validation:**

- ✅ Same plaintext → different ciphertexts (proves unique IV)
- ✅ Tampered IV → decryption fails
- ✅ Tampered ciphertext → decryption fails
- ✅ Hash enables search without decryption
- ✅ Hash never appears in API responses
- ✅ Duplicate PAN detection works via hash

---

## ⚠️ ACTION REQUIRED

**Status:** Encryption utility is complete and tested.

**Blocker:** **No field list provided.**  
We used PAN number as a proof-of-concept only.

**Need from team:**  
📋 **Complete list of fields requiring encryption**

Format:
| Entity | Field | Searchable? |
|--------|-------|-------------|
| Company | panCardNumber | Yes |
| Company | tanNumber | Yes |
| Contact | aadhaarNumber | Yes |

Once provided, we can apply encryption to all required fields within 1-2 days.

---

**Files:** 9 core utility files in `service-lib` + 1 POC implementation  
**Documentation:** `docs/CRYPTO_SERVICE_UTILITY.md`  
**Environment:** Requires `FIELD_ENC_KEY_BASE64` and `FIELD_HASH_PEPPER` in `.env`

---

**Summary:** NFR-SEC-016 fully implemented for Company PAN field. AES-256-GCM encryption with unique random IV per value, authentication, searchable hash, and complete security measures including hash exclusion from API responses. Ready for production deployment.
