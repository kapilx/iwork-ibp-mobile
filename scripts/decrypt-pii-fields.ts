/**
 * PII field decryption rollback script.
 * Reads encrypted _enc columns, decrypts them, and writes plaintext back
 * to the original columns. Run this BEFORE turning FF_FIELD_ENCRYPTION_EXPERIMENTAL to false.
 *
 * Run with: npx ts-node scripts/decrypt-pii-fields.ts
 *
 * Required environment variables:
 *   FIELD_ENC_KEY_BASE64  — base64 of exactly 32 random bytes (AES-256 key)
 *   FIELD_HASH_PEPPER     — secret pepper string (same one used during encryption)
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME  — PostgreSQL connection
 *
 * Tables / fields processed:
 *   users:    email_id_enc → email_id
 *             mobile_enc   → mobile
 *   employee: email_id_enc → email_id
 *             mobile_enc   → mobile
 *             date_of_birth_enc → date_of_birth
 *   policy_enrollment_employee: date_of_birth_enc → date_of_birth
 *                               email_enc         → email
 *                               phone_number_enc  → phone_number
 *   policy_enrollment_dependent: date_of_birth_enc → date_of_birth
 *   contact_communication_details: communication_details_enc → communication_details
 *
 * Safety:
 *   - Skips rows where the _enc column is NULL or empty.
 *   - Skips values that are not valid encrypted payloads (already plaintext).
 *   - Processes in batches of 100 to keep memory and lock footprint small.
 *   - Dry-run mode: set DRY_RUN=true to log without writing.
 */

import * as crypto from 'crypto';
import * as path from 'path';
import { config } from 'dotenv';
import { Client } from 'pg';

config({ path: path.resolve(__dirname, '../environments/.env.dev') });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BATCH_SIZE = 100;
const DRY_RUN = process.env.DRY_RUN === 'true';

const ENC_KEY_B64 = process.env.FIELD_ENC_KEY_BASE64;

if (!ENC_KEY_B64) {
  console.error('ERROR: FIELD_ENC_KEY_BASE64 env var is required');
  process.exit(1);
}

const ENC_KEY = Buffer.from(ENC_KEY_B64, 'base64');
if (ENC_KEY.length !== 32) {
  console.error(
    `ERROR: FIELD_ENC_KEY_BASE64 must decode to exactly 32 bytes (got ${ENC_KEY.length})`,
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Decrypt (mirrors FieldEncryptionService.decrypt)
// ---------------------------------------------------------------------------

function isEncrypted(value: string): boolean {
  if (value.length < 10) return false;
  try {
    const parsed = JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
    return (parsed?.v === 1 || parsed?.v === 2) && parsed?.iv && parsed?.tag && parsed?.ct;
  } catch {
    return false;
  }
}

function decrypt(encryptedValue: string): string {
  const payload = JSON.parse(Buffer.from(encryptedValue, 'base64').toString('utf8'));
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const ct = Buffer.from(payload.ct, 'base64');

  const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, iv, { authTagLength: 16 });
  decipher.setAuthTag(tag);

  const plaintext = Buffer.concat([decipher.update(ct), decipher.final()]);
  return plaintext.toString('utf8');
}

// ---------------------------------------------------------------------------
// Migration tasks (reversed: enc → original)
// ---------------------------------------------------------------------------

interface MigrationTask {
  table: string;
  pkColumn: string;
  fields: Array<{ enc: string; original: string }>;
}

const TASKS: MigrationTask[] = [
  {
    table: 'users',
    pkColumn: 'id',
    fields: [
      { enc: 'email_id_enc', original: 'email_id' },
      { enc: 'mobile_enc',   original: 'mobile' },
    ],
  },
  {
    table: 'employee',
    pkColumn: 'id',
    fields: [
      { enc: 'email_id_enc',      original: 'email_id' },
      { enc: 'mobile_enc',        original: 'mobile' },
      { enc: 'date_of_birth_enc', original: 'date_of_birth' },
    ],
  },
  {
    table: 'policy_enrollment_employee',
    pkColumn: 'id',
    fields: [
      { enc: 'date_of_birth_enc', original: 'date_of_birth' },
      { enc: 'email_enc',         original: 'email' },
      { enc: 'phone_number_enc',  original: 'phone_number' },
    ],
  },
  {
    table: 'policy_enrollment_dependent',
    pkColumn: 'id',
    fields: [
      { enc: 'date_of_birth_enc', original: 'date_of_birth' },
    ],
  },
  {
    table: 'contact_communication_details',
    pkColumn: 'id',
    fields: [
      { enc: 'communication_details_enc', original: 'communication_details' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function processTask(client: Client, task: MigrationTask): Promise<void> {
  const { table, pkColumn, fields } = task;

  // Find rows where at least one _enc column has data to decrypt
  const encNotNullChecks = fields.map((f) => `${f.enc} IS NOT NULL AND ${f.enc} != ''`).join(' OR ');
  const selectCols = [pkColumn, ...fields.map((f) => f.enc)].join(', ');

  let lastSeenId: number | string = -1;
  let totalProcessed = 0;
  let totalSkipped = 0;
  let totalFailed = 0;

  console.log(`\n▶  Table: ${table}`);

  while (true) {
    const { rows } = await client.query<Record<string, any>>(
      `SELECT ${selectCols} FROM ${table} WHERE ${pkColumn} > $1 AND (${encNotNullChecks}) ORDER BY ${pkColumn} LIMIT $2`,
      [lastSeenId, BATCH_SIZE],
    );

    if (rows.length === 0) break;

    for (const row of rows) {
      const id = row[pkColumn];
      const setParts: string[] = [];
      const values: any[] = [];
      let paramIdx = 1;

      for (const field of fields) {
        const encValue = row[field.enc];
        if (encValue == null || encValue === '') {
          totalSkipped++;
          continue;
        }

        // Skip values that aren't actually encrypted (already plaintext)
        if (!isEncrypted(encValue)) {
          totalSkipped++;
          continue;
        }

        try {
          const plaintext = decrypt(encValue);
          setParts.push(`${field.original} = $${paramIdx}`);
          values.push(plaintext);
          paramIdx++;
        } catch (err) {
          console.error("  ⚠  Failed to decrypt %s.%s for %s=%s:", table, field.enc, pkColumn, id, (err as Error).message);
          totalFailed++;
        }
      }

      if (setParts.length === 0) {
        lastSeenId = id;
        continue;
      }

      values.push(String(id));

      if (DRY_RUN) {
        console.log(`  [DRY-RUN] UPDATE ${table} SET ${setParts.join(', ')} WHERE ${pkColumn} = ${id}`);
      } else {
        await client.query(
          `UPDATE ${table} SET ${setParts.join(', ')} WHERE ${pkColumn} = $${paramIdx}`,
          values,
        );
      }

      totalProcessed++;
      lastSeenId = id;
    }

    process.stdout.write(`  Rows processed so far: ${totalProcessed}    \r`);
  }

  console.log(`\n  ✅ Done. Processed: ${totalProcessed}, Skipped: ${totalSkipped}, Failed: ${totalFailed}`);
}

async function main(): Promise<void> {
  const client = new Client({
    host:     process.env.DB_HOST     ?? 'localhost',
    port:     parseInt(process.env.DB_PORT ?? '5432'),
    user:     process.env.DB_USER     ?? 'postgres',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME     ?? 'postgres',
  });

  await client.connect();
  console.log(`Connected to ${process.env.DB_NAME ?? 'postgres'}`);
  if (DRY_RUN) console.log('⚠️  DRY-RUN mode — no rows will be written');

  try {
    for (const task of TASKS) {
      await processTask(client, task);
    }
    console.log('\n🎉  Decryption rollback complete');
    console.log('You can now safely set FF_FIELD_ENCRYPTION_EXPERIMENTAL=false');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Decryption rollback failed:', err);
  process.exit(1);
});
