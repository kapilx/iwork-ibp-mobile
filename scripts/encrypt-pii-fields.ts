/**
 * One-time PII field encryption migration script.
 *
 * Run with: npx ts-node scripts/encrypt-pii-fields.ts
 *
 * Required environment variables:
 *   FIELD_ENC_KEY_BASE64  — base64 of exactly 32 random bytes (AES-256 key)
 *   FIELD_HASH_PEPPER     — secret pepper string for HMAC-derived IV
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME  — PostgreSQL connection
 *
 * Tables / fields processed:
 *   users:    email_id → email_id_enc
 *             mobile   → mobile_enc
 *   employee: email_id → email_id_enc
 *             mobile   → mobile_enc
 *             date_of_birth → date_of_birth_enc
 *   policy_enrollment_employee: date_of_birth → date_of_birth_enc
 *                               email         → email_enc
 *                               phone_number  → phone_number_enc
 *   policy_enrollment_dependent: date_of_birth → date_of_birth_enc
 *   contact_communication_details: communication_details → communication_details_enc
 *
 * Safety:
 *   - Skips rows where the _enc column is already populated.
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
const HASH_PEPPER = process.env.FIELD_HASH_PEPPER ?? '';

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
// Serialize a field value to plain string before encryption.
// Date objects use local date components (YYYY-MM-DD) to preserve the
// original date format — String(Date) produces locale strings like
// "Mon Jun 10 1991 00:00:00 GMT+0530" which is incorrect.
// ---------------------------------------------------------------------------
function serializeValue(value: unknown): string {
  if (value instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return String(value);
}

// ---------------------------------------------------------------------------
// Deterministic AES-256-GCM (mirrors FieldEncryptionService.encryptDeterministic)
// ---------------------------------------------------------------------------

function encryptDeterministic(plaintext: string): string {
  const iv = crypto
    .createHmac('sha256', HASH_PEPPER)
    .update(plaintext, 'utf8')
    .digest()
    .slice(0, 12);

  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  const payload = {
    v: 2,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ct: ct.toString('base64'),
  };

  return Buffer.from(JSON.stringify(payload), 'utf8').toString('base64');
}

// ---------------------------------------------------------------------------
// Migration tasks
// ---------------------------------------------------------------------------

interface MigrationTask {
  table: string;
  pkColumn: string;
  fields: Array<{ src: string; dst: string }>;
}

const TASKS: MigrationTask[] = [
  {
    table: 'users',
    pkColumn: 'id',
    fields: [
      { src: 'email_id', dst: 'email_id_enc' },
      { src: 'mobile',   dst: 'mobile_enc' },
    ],
  },
  {
    table: 'employee',
    pkColumn: 'id',
    fields: [
      { src: 'email_id',      dst: 'email_id_enc' },
      { src: 'mobile',        dst: 'mobile_enc' },
      { src: 'date_of_birth', dst: 'date_of_birth_enc' },
    ],
  },
  {
    table: 'policy_enrollment_employee',
    pkColumn: 'id',
    fields: [
      { src: 'date_of_birth', dst: 'date_of_birth_enc' },
      { src: 'email',         dst: 'email_enc' },
      { src: 'phone_number',  dst: 'phone_number_enc' },
    ],
  },
  {
    table: 'policy_enrollment_dependent',
    pkColumn: 'id',
    fields: [
      { src: 'date_of_birth', dst: 'date_of_birth_enc' },
    ],
  },
  {
    table: 'contact_communication_details',
    pkColumn: 'id',
    fields: [
      { src: 'communication_details', dst: 'communication_details_enc' },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function processTask(client: Client, task: MigrationTask): Promise<void> {
  const { table, pkColumn, fields } = task;

  // Build a WHERE clause that finds rows where at least one _enc column is NULL
  const encNullChecks = fields.map((f) => `${f.dst} IS NULL`).join(' OR ');
  const selectCols = [pkColumn, ...fields.map((f) => f.src)].join(', ');

  // Use keyset (cursor) pagination: WHERE pk > lastSeenId ORDER BY pk LIMIT n
  // This is stable even when the WHERE clause changes as rows are updated,
  // unlike OFFSET-based pagination which skips rows as matching rows shrink.
  let lastSeenId: number | string = -1;
  let totalProcessed = 0;
  let totalSkipped = 0;

  console.log(`\n▶  Table: ${table}`);

  while (true) {
    const { rows } = await client.query<Record<string, any>>(
      `SELECT ${selectCols} FROM ${table} WHERE ${pkColumn} > $1 AND (${encNullChecks}) ORDER BY ${pkColumn} LIMIT $2`,
      [lastSeenId, BATCH_SIZE],
    );

    if (rows.length === 0) break;

    for (const row of rows) {
      const id = row[pkColumn];
      const setParts: string[] = [];
      const values: string[] = [];
      let paramIdx = 1;

      for (const field of fields) {
        const plain = row[field.src];
        if (plain == null || plain === '') {
          totalSkipped++;
          continue;
        }

        const encrypted = encryptDeterministic(serializeValue(plain));
        setParts.push(`${field.dst} = $${paramIdx}`);
        values.push(encrypted);
        paramIdx++;
      }

      if (setParts.length === 0) {
        // Row has no encryptable source values; still advance cursor past it.
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

  console.log(`\n  ✅ Done. Processed: ${totalProcessed}, Skipped (null src): ${totalSkipped}`);
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
    console.log('\n🎉  Migration complete');
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
