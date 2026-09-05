# Field Encryption Module

Field-level encryption utilities for securing sensitive data.

## Components

- **services/field-encryption.service.ts** - AES-256-GCM encryption service
- **decorators/sensitive-field.decorator.ts** - Metadata decorator for marking fields
- **utils/decrypt.util.ts** - Helper for selective field decryption
- **subscribers/field-encryption.subscriber.ts** - Automatic encryption on save/update

## Environment Setup

```bash
# Feature flag to enable/disable field encryption (EXPERIMENTAL lifecycle)
FF_FIELD_ENCRYPTION_EXPERIMENTAL=true

# Required when FF_FIELD_ENCRYPTION_EXPERIMENTAL=true
FIELD_ENC_KEY_BASE64=<32-byte-key-in-base64>

# Optional: for searchable hash columns
FIELD_HASH_PEPPER=<random-pepper-string>
```

## Quick Start

```typescript
import {
  CryptoService,
  SensitiveField,
  decryptSelectedFields,
} from "service-lib";

// 1. Mark entity field
@Entity("company")
export class Company {
  @SensitiveField({ lookupHashColumn: "panCardNumberHash" })
  @Column({ type: "text" })
  panCardNumber?: string;

  @Column({ type: "text" })
  panCardNumberHash?: string;
}

// 2. Encryption happens automatically on save()
const company = new Company();
company.panCardNumber = "AAACH1104K";
await repository.save(company); // Auto-encrypted

// 3. Search using hash
const hash = cryptoService.lookupHash("AAACH1104K");
const found = await repository.findOne({ where: { panCardNumberHash: hash } });

// 4. Decrypt for API response
decryptSelectedFields(cryptoService, company, ["panCardNumber"]);
```

## Full Documentation

See [/docs/CRYPTO_SERVICE_UTILITY.md](../../../../../../docs/CRYPTO_SERVICE_UTILITY.md) for complete guide.

## Example: PAN Number Encryption

**Input:** `AAACH1104K`  
**Encrypted:** `eyJ2IjoxLCJpdiI6IjdMTVkzbW1keHFMNktHcGwiLCJ0YWciOi...`  
**Hash:** `188798d723b3a1e0a42b99ec6f6e66058a15de58ec1d5bed96bf3c0dafd25a15`  
**Output:** `AAACH1104K` (decrypted in service layer)
