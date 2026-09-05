import * as AWS from "aws-sdk";
import { buildLogMessage } from "./logger.util";

interface MinimalLogger {
  log(info: { level: string; message: string }): void;
}

export interface ResolveContext {
  logger?: MinimalLogger;
  traceId?: string;
}

interface CacheEntry { value: Record<string, string>; expiresAt: number }

const _secretCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1_000; // 5 minutes
const LOCATION = "secret-resolver.util";

let _smClient: AWS.SecretsManager | null = null;

function getSmClient(): AWS.SecretsManager {
  if (!_smClient) {
    _smClient = new AWS.SecretsManager({ region: process.env.AWS_REGION ?? "ap-south-1" });
  }
  return _smClient;
}

function log(ctx: ResolveContext, level: "info" | "warn" | "error", method: string, msg: string, payload?: unknown) {
  const entry = buildLogMessage({ traceId: ctx.traceId, status: level === "info" ? "success" : "failure", location: LOCATION, method, messageData: msg, ...(payload ? { payload } : {}) });
  ctx.logger ? ctx.logger.log({ level, message: entry }) : console[level](entry);
}

async function fetchSecretObject(secretId: string, ctx: ResolveContext): Promise<Record<string, string>> {
  const cached = _secretCache.get(secretId);
  if (cached) {
    if (cached.expiresAt > Date.now()) {
      log(ctx, "info", "fetchSecretObject", "Secret served from in-memory cache", { secretId });
      return cached.value;
    }
    _secretCache.delete(secretId); // expired — remove before re-fetching
  }

  log(ctx, "info", "fetchSecretObject", "Fetching secret from AWS Secrets Manager", { secretId });

  let result: AWS.SecretsManager.GetSecretValueResponse;
  try {
    result = await getSmClient().getSecretValue({ SecretId: secretId }).promise();
  } catch (err) {
    log(ctx, "error", "fetchSecretObject", `AWS Secrets Manager fetch failed: ${err instanceof Error ? err.message : String(err)}`, { secretId });
    throw err;
  }

  const raw = result.SecretString ?? "{}";
  let parsed: Record<string, string>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = { _value: raw };
  }

  _secretCache.set(secretId, { value: parsed, expiresAt: Date.now() + CACHE_TTL_MS });
  log(ctx, "info", "fetchSecretObject", `Secret cached in memory (TTL ${CACHE_TTL_MS / 1000}s)`, { secretId });

  return parsed;
}

/**
 * Resolves credential placeholders in a string value.
 *
 * Supported patterns:
 *   {{env:KEY_NAME}}              → reads from process.env (backward compat)
 *   {{secret:SECRET_PATH:KEY}}    → fetches AWS secret by friendly name, returns value at KEY
 *   {{secret:env:ENV_VAR:KEY}}    → reads ARN from process.env[ENV_VAR], fetches that secret
 *
 * Pass caller's logger + traceId so logs are correlated to the request trace.
 * Cached in-memory for 5 minutes per process. Returns original placeholder unchanged if resolution fails.
 */
export async function resolveSecretString(value: string, ctx: ResolveContext = {}): Promise<string> {
  if (!value) return value;

  // {{env:KEY}} — sync, backward compat
  let result = value.replace(/\{\{env:([\w_]+)\}\}/g, (match, key) => process.env[key] ?? match);

  // {{secret:env:ENV_VAR:JSON_KEY}} — ARN from env var
  const envRefMatches = [...result.matchAll(/\{\{secret:env:([\w_]+):([^}]+)\}\}/g)];
  for (const m of envRefMatches) {
    const [full, envVar, jsonKey] = m;
    const secretId = process.env[envVar];
    if (!secretId) {
      log(ctx, "warn", "resolveSecretString", `Env var "${envVar}" not set — placeholder left unresolved`, { pattern: full });
      continue;
    }
    try {
      const secretObj = await fetchSecretObject(secretId, ctx);
      const resolved = secretObj[jsonKey];
      if (resolved !== undefined) {
        result = result.replace(full, resolved);
      } else {
        log(ctx, "warn", "resolveSecretString", `Key "${jsonKey}" not found in secret — placeholder left unresolved`, { secretId, jsonKey });
      }
    } catch {
      // error already logged in fetchSecretObject — leave placeholder unchanged
    }
  }

  // {{secret:SECRET_PATH:JSON_KEY}} — direct friendly name
  const directMatches = [...result.matchAll(/\{\{secret:(?!env:)([^}:]+):([^}]+)\}\}/g)];
  for (const m of directMatches) {
    const [full, secretName, jsonKey] = m;
    try {
      const secretObj = await fetchSecretObject(secretName, ctx);
      const resolved = secretObj[jsonKey];
      if (resolved !== undefined) {
        result = result.replace(full, resolved);
      } else {
        log(ctx, "warn", "resolveSecretString", `Key "${jsonKey}" not found in secret — placeholder left unresolved`, { secretName, jsonKey });
      }
    } catch {
      // error already logged in fetchSecretObject — leave placeholder unchanged
    }
  }

  return result;
}

/** Synchronous version — only handles {{env:KEY}}, no AWS call. Use for legacy paths. */
export function resolveEnvOnly(value: string): string {
  if (!value) return value;
  return value.replace(/\{\{env:([\w_]+)\}\}/g, (match, key) => process.env[key] ?? match);
}
