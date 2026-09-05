import * as crypto from "crypto";
import axios from "axios";

/**
 * Generic "encrypt identifiers and build a redirect URL" engine for TPA portal SSO.
 * One TPA = one config + a handful of field mappings, resolved entirely from data —
 * this file is the only code that ever needs to change, and only if a genuinely new
 * combination of these axes shows up (not per new TPA).
 */

export type SsoKeyEncoding = "utf8" | "base64";
export type SsoPadding = "PKCS7" | "ISO10126";
export type SsoIvMode = "FIXED" | "KEY_AS_IV" | "RANDOM_EMBEDDED";
export type SsoTextEncoding = "utf8" | "utf16le";
export type SsoTokenShape = "SEPARATE_FIELDS" | "COMBINED_JSON" | "COMBINED_QUERYSTRING";

export interface SsoConfigLike {
  // Base portal/redirect URL. Any constant query params (e.g. a fixed broker code)
  // can be typed directly into this string — encrypted fields are appended
  // automatically as `key=value` pairs, never typed in by hand.
  //
  // TEMPLATED MODE — for TPAs that put the token in the URL PATH instead of a query
  // string (e.g. Volo: `.../broker-tpa-tc-sso/{{token}}/{{field:corpid}}`): if portalUrl
  // contains the literal `{{token}}` placeholder, the query-append behavior above is
  // skipped entirely and portalUrl is used as a template instead. `{{token}}` is replaced
  // with the one combined encrypted value (requires sso_token_shape = COMBINED_JSON or
  // COMBINED_QUERYSTRING — there's no single value to place there under SEPARATE_FIELDS).
  // `{{field:NAME}}` is replaced with that field mapping's plain (unencrypted) resolved
  // value, matched by external_field_name — for a TPA that echoes an identifier in the
  // path alongside the token, same as Volo's corpId.
  portalUrl: string;
  ssoKeyEnvName: string;
  ssoIvEnvName?: string | null;
  ssoKeyEncoding: SsoKeyEncoding;
  ssoPadding: SsoPadding;
  ssoIvMode: SsoIvMode;
  ssoTextEncoding: SsoTextEncoding;
  ssoTokenShape: SsoTokenShape;
  ssoTokenParamName?: string | null;
  ssoOutputTransform?: Record<string, string> | null;
  ssoIvEnvelopeSeparator?: string | null;
  // When false, encrypted field values are appended to the URL as RAW base64 (standard +, /, =),
  // exactly as the TPA's own kit builds the link, instead of being percent-encoded. Default/true
  // = percent-encode (correct for TPAs whose server URL-decodes, e.g. GHPL/FHPL). Set false only
  // for a TPA whose SSO page reads the raw query string WITHOUT URL-decoding (e.g. HealthIndia
  // HISSO.aspx), where %2F/%3D would otherwise corrupt the token on their side.
  ssoUrlEncode?: boolean;
}

export interface SsoFieldMappingLike {
  externalFieldName: string;
  sourceType: string; // STATIC | POLICY | EMPLOYEE
  sourceField?: string | null;
  staticValue?: string | null;
}

// context looks like { POLICY: { externalTpaPolicyId: "..." }, EMPLOYEE: { companyEmployeeId: "..." } }
export type SsoContext = Record<string, Record<string, unknown>>;

const AES_BLOCK_SIZE = 16;

export class SsoConfigError extends Error {}

function requireEnv(name: string | null | undefined, purpose: string): string {
  if (!name) {
    throw new SsoConfigError(`SSO config is missing the env var name for ${purpose}`);
  }
  const value = process.env[name];
  if (!value) {
    throw new SsoConfigError(
      `Required environment variable "${name}" (${purpose}) is not set on this server`,
    );
  }
  return value;
}

function resolveKeyBuffer(config: SsoConfigLike): Buffer {
  const raw = requireEnv(config.ssoKeyEnvName, "the SSO encryption key");
  return config.ssoKeyEncoding === "base64" ? Buffer.from(raw, "base64") : Buffer.from(raw, "utf8");
}

function resolveFixedIvBuffer(config: SsoConfigLike, keyBuf: Buffer): Buffer | null {
  switch (config.ssoIvMode) {
    case "FIXED":
      return Buffer.from(requireEnv(config.ssoIvEnvName, "the SSO IV"), "utf8");
    case "KEY_AS_IV":
      // AES block/IV size is always 16 bytes regardless of key size (128 vs 256-bit key).
      return keyBuf.subarray(0, AES_BLOCK_SIZE);
    case "RANDOM_EMBEDDED":
      return null; // generated fresh per encrypt() call instead
    default:
      throw new SsoConfigError(`Unknown sso_iv_mode "${config.ssoIvMode}"`);
  }
}

function cipherAlgorithmFor(keyBuf: Buffer): string {
  if (keyBuf.length === 32) return "aes-256-cbc";
  if (keyBuf.length === 16) return "aes-128-cbc";
  throw new SsoConfigError(
    `SSO key must decode to 16 or 32 bytes for AES-CBC (got ${keyBuf.length} bytes)`,
  );
}

// ISO10126 padding: pad to the next block boundary (always at least 1 byte, a full extra
// block if already aligned — same length rule as PKCS7) with random filler, last byte = pad
// length. Node has no native support for this, unlike PKCS7 which its cipher does automatically.
function iso10126Pad(buf: Buffer): Buffer {
  const padLen = AES_BLOCK_SIZE - (buf.length % AES_BLOCK_SIZE);
  const filler = crypto.randomBytes(padLen - 1);
  return Buffer.concat([buf, filler, Buffer.from([padLen])]);
}

function encryptOne(
  plainText: string,
  keyBuf: Buffer,
  fixedIvBuf: Buffer | null,
  config: SsoConfigLike,
): string {
  const algorithm = cipherAlgorithmFor(keyBuf);
  const ivBuf = fixedIvBuf ?? crypto.randomBytes(AES_BLOCK_SIZE);
  const plainBuf = Buffer.from(plainText, config.ssoTextEncoding);

  const cipher = crypto.createCipheriv(algorithm, keyBuf, ivBuf);
  let cipherText: string;
  if (config.ssoPadding === "ISO10126") {
    cipher.setAutoPadding(false);
    const padded = iso10126Pad(plainBuf);
    cipherText = Buffer.concat([cipher.update(padded), cipher.final()]).toString("base64");
  } else {
    // PKCS7 — Node's default auto-padding handles this natively.
    cipherText = Buffer.concat([cipher.update(plainBuf), cipher.final()]).toString("base64");
  }

  if (config.ssoIvMode === "RANDOM_EMBEDDED") {
    const separator = config.ssoIvEnvelopeSeparator ?? ":";
    return `${ivBuf.toString("base64")}${separator}${cipherText}`;
  }
  return cipherText;
}

function applyOutputTransform(value: string, transform?: Record<string, string> | null): string {
  if (!transform) return value;
  let out = value;
  for (const [from, to] of Object.entries(transform)) {
    out = out.split(from).join(to);
  }
  return out;
}

// Epoch timestamp source_fields for source_type = SYSTEM — the only value an SSO token
// needs that isn't STATIC and doesn't come from our data (e.g. Volo's validTimestamp,
// which the TPA checks against its own clock at redemption time, so it must be computed
// fresh on every call, not read from context).
function resolveSystemFieldValue(mapping: SsoFieldMappingLike): string {
  switch (mapping.sourceField) {
    case "CURRENT_EPOCH_SECONDS":
      return String(Math.floor(Date.now() / 1000));
    case "CURRENT_EPOCH_MILLIS":
      return String(Date.now());
    default:
      throw new SsoConfigError(
        `Unknown SYSTEM source_field "${mapping.sourceField}" — expected ` +
          `CURRENT_EPOCH_SECONDS or CURRENT_EPOCH_MILLIS`,
      );
  }
}

function resolveFieldValue(mapping: SsoFieldMappingLike, context: SsoContext): string {
  if (mapping.sourceType === "STATIC") {
    return mapping.staticValue ?? "";
  }
  if (mapping.sourceType === "SYSTEM") {
    return resolveSystemFieldValue(mapping);
  }
  const bucket = context[mapping.sourceType];
  const value = mapping.sourceField ? bucket?.[mapping.sourceField] : undefined;
  if (value == null) {
    throw new SsoConfigError(
      `Could not resolve SSO field "${mapping.externalFieldName}" — no value for ` +
        `${mapping.sourceType}.${mapping.sourceField}`,
    );
  }
  return String(value);
}

// Plaintext values before encryption, keyed by external_field_name — used only for the
// admin-facing preview ("here's what will be encrypted"), never sent anywhere as-is.
export function resolveSsoFieldValues(
  fieldMappings: SsoFieldMappingLike[],
  context: SsoContext,
): Record<string, string> {
  const values: Record<string, string> = {};
  for (const mapping of fieldMappings) {
    values[mapping.externalFieldName] = resolveFieldValue(mapping, context);
  }
  return values;
}

// Serializes all field mappings into the one string that gets encrypted as a single
// combined blob — shape depends on sso_token_shape:
//   COMBINED_JSON        — {"CorpId":"7","EmployeeID":"12"} (Vidal)
//   COMBINED_QUERYSTRING — CorpId=7&EmployeeID=12 (Volo — a query string, not JSON,
//     bundled and encrypted as one blob rather than as separate per-field params)
function serializeCombinedFields(
  shape: SsoTokenShape,
  fieldMappings: SsoFieldMappingLike[],
  context: SsoContext,
): string {
  if (shape === "COMBINED_QUERYSTRING") {
    return fieldMappings.map((m) => `${m.externalFieldName}=${resolveFieldValue(m, context)}`).join("&");
  }
  const payload: Record<string, string> = {};
  for (const mapping of fieldMappings) {
    payload[mapping.externalFieldName] = resolveFieldValue(mapping, context);
  }
  return JSON.stringify(payload);
}

// Encrypts all field mappings bundled into one combined blob (JSON or query-string
// depending on sso_token_shape — see serializeCombinedFields). Exposed on its own (not
// just inline in buildSsoRedirectUrl) because REMOTE_API_REDIRECT mode needs exactly
// this value to send as the request body's payload field, without any URL built around
// it — the TPA gives us the real destination URL back in their response.
export function encryptSsoCombinedPayload(
  config: SsoConfigLike,
  fieldMappings: SsoFieldMappingLike[],
  context: SsoContext,
): string {
  const keyBuf = resolveKeyBuffer(config);
  const fixedIvBuf = resolveFixedIvBuffer(config, keyBuf);
  const serialized = serializeCombinedFields(config.ssoTokenShape, fieldMappings, context);
  const encrypted = encryptOne(serialized, keyBuf, fixedIvBuf, config);
  return applyOutputTransform(encrypted, config.ssoOutputTransform);
}

// TEMPLATED MODE — portalUrl contains a literal `{{token}}` placeholder (Volo: the token
// is a URL PATH segment, not a query param). See the SsoConfigLike.portalUrl doc comment.
function buildTemplatedRedirectUrl(
  config: SsoConfigLike,
  fieldMappings: SsoFieldMappingLike[],
  context: SsoContext,
): string {
  if (config.ssoTokenShape !== "COMBINED_JSON" && config.ssoTokenShape !== "COMBINED_QUERYSTRING") {
    throw new SsoConfigError(
      `portalUrl contains {{token}} but sso_token_shape "${config.ssoTokenShape}" has no single ` +
        `combined value to place there — use COMBINED_JSON or COMBINED_QUERYSTRING`,
    );
  }

  const token = encryptSsoCombinedPayload(config, fieldMappings, context);
  const renderedToken = config.ssoUrlEncode === false ? token : encodeURIComponent(token);

  return config.portalUrl
    .replace(/\{\{token\}\}/g, renderedToken)
    .replace(/\{\{field:([\w.-]+)\}\}/g, (_match, name: string) => {
      const mapping = fieldMappings.find((m) => m.externalFieldName === name);
      if (!mapping) {
        throw new SsoConfigError(
          `portalUrl references {{field:${name}}} but no field mapping with that external_field_name exists`,
        );
      }
      return encodeURIComponent(resolveFieldValue(mapping, context));
    });
}

export function buildSsoRedirectUrl(
  config: SsoConfigLike,
  fieldMappings: SsoFieldMappingLike[],
  context: SsoContext,
): string {
  if (!fieldMappings.length) {
    throw new SsoConfigError("SSO config has no field mappings — nothing to send");
  }

  if (config.portalUrl.includes("{{token}}")) {
    return buildTemplatedRedirectUrl(config, fieldMappings, context);
  }

  const params: string[] = [];

  if (config.ssoTokenShape === "COMBINED_JSON" || config.ssoTokenShape === "COMBINED_QUERYSTRING") {
    const paramName = config.ssoTokenParamName ?? "token";
    params.push(`${paramName}=${encodeURIComponent(encryptSsoCombinedPayload(config, fieldMappings, context))}`);
  } else {
    const keyBuf = resolveKeyBuffer(config);
    const fixedIvBuf = resolveFixedIvBuffer(config, keyBuf);
    for (const mapping of fieldMappings) {
      const plainText = resolveFieldValue(mapping, context);
      const encrypted = encryptOne(plainText, keyBuf, fixedIvBuf, config);
      const transformed = applyOutputTransform(encrypted, config.ssoOutputTransform);
      // Base64 output can contain +, /, = — all meaningful in a URL (+ often reads as a
      // space, and a bare = inside a value can be mistaken for the key/value separator,
      // truncating the trailing padding). Encoding here is what a standards-compliant
      // server on the other end expects and auto-decodes; NOT encoding is what risks a
      // corrupted string and a "Invalid length for a Base-64 char array or string" error
      // on their side. Applied after any output_transform (e.g. GHPL's own +→@ rule)
      // so that existing per-TPA quirks still run first, unaffected.
      //
      // EXCEPTION — ssoUrlEncode === false: some legacy .NET SSO pages (HealthIndia HISSO.aspx)
      // read the raw query string WITHOUT URL-decoding, so %2F/%3D would arrive literally and
      // corrupt the base64. For those we append the raw base64 exactly as their own kit builds
      // it. Strict `=== false` so every existing config (true/null/undefined) keeps encoding.
      const rendered = config.ssoUrlEncode === false ? transformed : encodeURIComponent(transformed);
      params.push(`${mapping.externalFieldName}=${rendered}`);
    }
  }

  const separator = config.portalUrl.includes("?") ? "&" : "?";
  return `${config.portalUrl}${separator}${params.join("&")}`;
}

// Decrypts a TPA's response payload that was encrypted the same way we encrypt our own
// outbound values under RANDOM_EMBEDDED mode: a fresh IV per call, joined to the ciphertext
// with a separator, both base64 (this is exactly the shape Vidal's own sample decrypt()
// function expects). Used for REMOTE_API_REDIRECT mode's response.
// NOTE: assumes the TPA's response uses this same format — reasonable since it mirrors
// their own shown code, but unconfirmed until they actually share their decryption logic.
export function decryptSsoRemoteResponse(
  combined: string,
  keyEnvName: string,
  keyEncoding: SsoKeyEncoding,
  textEncoding: SsoTextEncoding,
  separator = ":",
): string {
  const raw = requireEnv(keyEnvName, "the SSO response decryption key");
  const keyBuf = keyEncoding === "base64" ? Buffer.from(raw, "base64") : Buffer.from(raw, "utf8");
  const sepIndex = combined.indexOf(separator);
  if (sepIndex < 0) {
    throw new SsoConfigError(`Response payload is missing the "${separator}" IV separator`);
  }
  const ivBuf = Buffer.from(combined.slice(0, sepIndex), "base64");
  const cipherText = combined.slice(sepIndex + separator.length);
  const algorithm = cipherAlgorithmFor(keyBuf);
  const decipher = crypto.createDecipheriv(algorithm, keyBuf, ivBuf);
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(cipherText, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString(textEncoding);
}

// Simple dot-notation getter for pulling a value out of a TPA's (possibly nested) JSON
// response, e.g. getByPath(response, "data.token") — no array indices, just object keys.
export function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc == null || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, obj);
}

// Resolves {{env:KEY_NAME}} in a string from process.env — same convention used
// throughout this framework (sso_key_env_name, sso_iv_env_name, ...) so a header value
// (e.g. a TPA's API subscription key) can reference a secret without the real value
// ever being typed into the DB.
export function resolveEnvPlaceholders(value: string): string {
  return value.replace(/\{\{env:([\w_]+)\}\}/g, (match, key) => process.env[key] ?? match);
}

export interface RemoteApiSsoConfigLike extends SsoConfigLike {
  remoteApiUrl?: string | null;
  remoteApiMethod?: string | null;
  remoteApiHeaders?: Record<string, string> | null;
  remoteRequestPayloadKey?: string | null;
  remoteRequestExtraFields?: Record<string, string> | null;
  remoteResponseDataPath?: string | null;
  remoteResponseDecryptKeyEnvName?: string | null;
  remoteResponseRedirectUrlPath?: string | null;
}

export interface RemoteApiSsoResult {
  encryptedPayload: string;
  requestBody: Record<string, unknown>;
  redirectUrl: string;
}

// REMOTE_API_REDIRECT mode: we encrypt the payload (same axes as everything else in this
// file), POST it to the TPA's own SSO API, decrypt what they send back, and pull the real
// redirect URL out of that — used by both the live executor (ibp-service, real employee
// data) and the admin preview (policy-service, sample data), so this logic exists exactly
// once. Onboarding another TPA on this same "call their API" pattern is a config change,
// not a code change, same as the rest of the framework.
export async function executeRemoteApiRedirect(
  config: RemoteApiSsoConfigLike,
  fieldMappings: SsoFieldMappingLike[],
  context: SsoContext,
): Promise<RemoteApiSsoResult> {
  if (!config.remoteApiUrl) {
    throw new SsoConfigError("SSO config is missing remote_api_url for REMOTE_API_REDIRECT mode");
  }
  if (!config.remoteResponseDecryptKeyEnvName) {
    throw new SsoConfigError(
      "SSO config is missing remote_response_decrypt_key_env_name for REMOTE_API_REDIRECT mode",
    );
  }

  const encryptedPayload = encryptSsoCombinedPayload(config, fieldMappings, context);
  const requestBody: Record<string, unknown> = {
    [config.remoteRequestPayloadKey || "payload"]: encryptedPayload,
    ...config.remoteRequestExtraFields,
  };

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(config.remoteApiHeaders ?? {})) {
    headers[key] = resolveEnvPlaceholders(value);
  }

  const response = await axios.request({
    url: config.remoteApiUrl,
    method: (config.remoteApiMethod || "POST") as any,
    headers,
    data: requestBody,
  });

  const dataPath = config.remoteResponseDataPath || "data";
  const encryptedBlob = getByPath(response.data, dataPath);
  if (typeof encryptedBlob !== "string") {
    throw new SsoConfigError(`TPA response is missing an encrypted string at "${dataPath}"`);
  }

  const decrypted = decryptSsoRemoteResponse(
    encryptedBlob,
    config.remoteResponseDecryptKeyEnvName,
    config.ssoKeyEncoding,
    config.ssoTextEncoding,
    config.ssoIvEnvelopeSeparator,
  );

  const parsed = JSON.parse(decrypted);
  const redirectPath = config.remoteResponseRedirectUrlPath || "redirectUrl";
  const redirectUrl = getByPath(parsed, redirectPath);
  if (typeof redirectUrl !== "string") {
    throw new SsoConfigError(`Decrypted TPA response is missing a redirect URL at "${redirectPath}"`);
  }

  return { encryptedPayload, requestBody, redirectUrl };
}
