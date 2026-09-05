import { Injectable, NotFoundException } from "@nestjs/common";
import axios from "axios";
import * as jwt from "jsonwebtoken";
import * as AWS from "aws-sdk";
import { TpaExternalFeatureRepository, DbTableSchema } from "./tpa-external-feature.repository";
import { CreateFeatureTypeDto } from "./dto/create-feature-type.dto";
import { CreateFeatureConfigDto } from "./dto/create-feature-config.dto";
import { UpsertAppRefDto } from "./dto/upsert-app-ref.dto";
import { UpsertResponseMappingDto } from "./dto/upsert-response-mapping.dto";
import { TestApiConfigDto } from "./dto/test-api-config.dto";
import { resolveSecretString } from "../../../../service-lib/src/lib/utils/secret-resolver.util";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildRedactedCurlLog } from "../../../../service-lib/src/lib/utils/curl-log.util";
import { buildAuthorizationHeaderValue } from "../../../../service-lib/src/lib/utils/auth-header.util";
import { normalizeTpaResponseData } from "../../../../service-lib/src/lib/utils/tpa-response.util";

// Well-known wrapper keys used by various TPA APIs
const DATA_ARRAY_KEYS = ["data", "list", "records", "items", "result", "results",
  "content", "rows", "payload", "response", "body", "claimList", "hospitalList",
  "memberList", "policyList", "providerList", "networkList", "benefitList"];

// Unwraps any TPA response format to a single representative record for key discovery.
// Handles: direct array, {data:[...]}, {result:{items:[...]}}, single-object, primitives.
function extractFirstRecord(data: any, depth = 0): any {
  if (data === null || data === undefined) return {};
  if (typeof data !== "object") return { value: String(data) };

  // Unwrap arrays immediately — use first element
  if (Array.isArray(data)) {
    return data.length > 0 ? extractFirstRecord(data[0], depth) : {};
  }

  // Try well-known wrapper keys first (exact match, then case-insensitive)
  for (const key of DATA_ARRAY_KEYS) {
    if (Array.isArray(data[key]) && (data[key] as any[]).length > 0) {
      return (data[key] as any[])[0];
    }
  }
  const lowerKeys = Object.keys(data);
  for (const key of lowerKeys) {
    if (DATA_ARRAY_KEYS.includes(key.toLowerCase()) && Array.isArray(data[key]) && (data[key] as any[]).length > 0) {
      return (data[key] as any[])[0];
    }
  }

  // Find the largest array across all keys
  let bestKey: string | null = null;
  let bestLen = 0;
  for (const key of lowerKeys) {
    const val = data[key];
    if (Array.isArray(val) && val.length > bestLen) { bestLen = val.length; bestKey = key; }
  }
  if (bestKey) return (data as any)[bestKey][0];

  // One level deeper: look inside nested objects (e.g. { result: { data: [...] } })
  if (depth < 2) {
    for (const key of lowerKeys) {
      const val = data[key];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        const nested = extractFirstRecord(val, depth + 1);
        if (Object.keys(nested).length > 0) return nested;
      }
    }
  }

  // No arrays found anywhere: the response IS a single record
  return data;
}

// Collect dot-notation paths whose template value uses {{env:KEY}} — these are secured.
function extractSecuredPaths(obj: any, prefix = ""): Set<string> {
  const paths = new Set<string>();
  if (typeof obj === "string") {
    // Match both legacy {{env:KEY}} and new {{secret:env:VAR:KEY}} patterns
    if (/\{\{env:[\w_]+\}\}|\{\{secret:env:[\w_]+:[\w_]+\}\}/.test(obj) && prefix) paths.add(prefix);
  } else if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      extractSecuredPaths(v, prefix ? `${prefix}.${k}` : k).forEach(p => paths.add(p));
    }
  }
  return paths;
}

// Replace resolved values at secured paths with "[secured]" before sending to UI.
function maskSecuredFields(resolved: any, secured: Set<string>, prefix = ""): any {
  if (!resolved || typeof resolved !== "object" || Array.isArray(resolved)) return resolved;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(resolved)) {
    const path = prefix ? `${prefix}.${k}` : k;
    out[k] = secured.has(path) ? "[secured]" : maskSecuredFields(v, secured, path);
  }
  return out;
}

// Mask the auth token value (dot-notation path) in a response object before returning to UI.
function maskTokenInResponse(data: any, tokenPath: string): any {
  if (!tokenPath || !data || typeof data !== "object") return data;
  const keys = tokenPath.split(".");
  const cloned = JSON.parse(JSON.stringify(data));
  let cur = cloned;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur || typeof cur !== "object") return cloned;
    cur = cur[keys[i]];
  }
  const last = keys[keys.length - 1];
  if (cur && typeof cur === "object" && last in cur) cur[last] = "[token]";
  return cloned;
}

// Flattens a single record into dot-notation leaf paths (nested arrays use first element).
function flattenObject(obj: any, prefix = ""): Record<string, string> {
  if (!obj || typeof obj !== "object") return {};
  if (Array.isArray(obj)) {
    // Top-level array response (e.g. FHPL's GetEcard returns `[{...}]`) — recurse into the
    // first element with ".0" appended to the path, same as a nested array property below,
    // so discovered keys match what extractDotNotation actually needs at runtime (e.g.
    // "0.E_Card" instead of "E_Card", which silently fails to resolve against an array).
    return obj.length > 0 ? flattenObject(obj[0], prefix ? `${prefix}.0` : "0") : {};
  }
  return Object.keys(obj).reduce((acc, key) => {
    const path = prefix ? `${prefix}.${key}` : key;
    const val = (obj as any)[key];
    if (Array.isArray(val)) {
      if (val.length > 0) Object.assign(acc, flattenObject(val[0], `${path}.0`));
    } else if (val && typeof val === "object") {
      Object.assign(acc, flattenObject(val, path));
    } else {
      acc[path] = String(val ?? "");
    }
    return acc;
  }, {} as Record<string, string>);
}

@Injectable()
export class TpaExternalFeatureService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly repo: TpaExternalFeatureRepository,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.POLICY_SERVICE);
  }

  // ── DB Schema ────────────────────────────────────────────────

  getDbSchema(): Promise<DbTableSchema[]> {
    return this.repo.getDbSchema();
  }

  // ── App Refs ─────────────────────────────────────────────────

  getAllAppRefs(onlyActive?: boolean) {
    return this.repo.findAllAppRefs(onlyActive);
  }

  async getAppRefById(id: number) {
    const ref = await this.repo.findAppRefById(id);
    if (!ref) throw new NotFoundException(`App ref ${id} not found`);
    return ref;
  }

  async createAppRef(dto: UpsertAppRefDto) {
    return this.repo.createAppRef(dto);
  }

  async updateAppRef(id: number, dto: Partial<UpsertAppRefDto>) {
    const updated = await this.repo.updateAppRef(id, dto);
    if (!updated) throw new NotFoundException(`App ref ${id} not found`);
    return updated;
  }

  // ── Test API Config ──────────────────────────────────────────

  async testApiConfig(dto: TestApiConfigDto) {
    const appRef = await this.repo.findAppRefById(dto.appRefId);
    if (!appRef) throw new NotFoundException(`App ref ${dto.appRefId} not found`);

    const resolvePlaceholders = (template: Record<string, any>, values: Record<string, string>): Record<string, any> => {
      const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
      const str = JSON.stringify(template);
      const resolved = str.replace(/\{\{(env:[\w_]+|\w+)(?:\|([^}]*))?\}\}/g, (full, key, transform) => {
        // Resolve {{env:KEY_NAME}} from process.env — value never stored in DB
        if (key.startsWith('env:')) {
          const envVal = process.env[key.slice(4)];
          return envVal !== undefined ? envVal : full;
        }
        const val = values[key];
        if (val === undefined) return full;
        if (transform?.startsWith('date:')) {
          const fmt = transform.slice(5);
          const parts = val.split(/[-\/]/);
          if (parts.length === 3) {
            const [y, m, d] = parts;
            const mon = parseInt(m, 10);
            // If month is non-numeric (e.g. "JUN"), value is already formatted — use as-is
            if (isNaN(mon)) return val;
            return fmt
              .replace('DD', d.padStart(2, '0'))
              .replace('MON', MONTHS[mon - 1] ?? m)
              .replace('MM', m.padStart(2, '0'))
              .replace('YYYY', y)
              .replace('YY', y.slice(-2));
          }
        }
        // {{fieldName|map:CASHLESS:1,REIMBURSEMENT:2}} — same value-mapping transform
        // supported by the live executor (payload-template.util.ts) so the "Test API
        // Config" preview behaves identically to production.
        if (transform?.startsWith('map:')) {
          const pairs = transform.slice(4).split(',');
          for (const pair of pairs) {
            const sepIdx = pair.indexOf(':');
            if (sepIdx === -1) continue;
            const from = pair.slice(0, sepIdx).trim();
            const to = pair.slice(sepIdx + 1).trim();
            if (from === val) return to;
          }
        }
        return val;
      });
      return JSON.parse(resolved);
    };

    // Resolve any remaining {{secret:env:VAR:KEY}} patterns left after resolvePlaceholders.
    // resolvePlaceholders is sync and only handles {{fieldName}}/{{env:KEY}} —
    // secret references need async AWS calls so we do a second pass here.
    const resolveSecretPlaceholders = async (obj: any): Promise<any> => {
      if (typeof obj === "string" && /\{\{secret:env:/.test(obj)) return resolveSecretString(obj, { logger: this.logger, traceId: this.traceIdService.traceId });
      if (Array.isArray(obj)) return Promise.all(obj.map((item) => resolveSecretPlaceholders(item)));
      if (obj && typeof obj === "object") {
        const entries = await Promise.all(
          Object.entries(obj).map(async ([k, v]) => [k, await resolveSecretPlaceholders(v)])
        );
        return Object.fromEntries(entries);
      }
      return obj;
    };

    // If this config delegates Step 1 to another app ref, use that ref for all Step 1 operations
    const authRef = appRef.authAppRefId
      ? (await this.repo.findAppRefById(appRef.authAppRefId)) ?? appRef
      : appRef;

    const result: any = { authType: authRef.authType, steps: [] };

    // ── PRE-FLIGHT: check all {{secret:env:VAR:KEY}} references are set in Secrets Manager ──
    // Catches missing credentials before hitting the TPA — avoids cryptic "INVALID CREDENTIALS"
    {
      const extractKeys = (val: string | null | undefined): string[] => {
        if (!val) return [];
        const keys: string[] = [];
        let m: RegExpExecArray | null;
        const re = /\{\{secret:env:[\w_]+:([\w_]+)\}\}/g;
        while ((m = re.exec(val)) !== null) keys.push(m[1]);
        return keys;
      };
      const allSecretKeys = new Set<string>([
        ...extractKeys(authRef.basicAuthUser),
        ...extractKeys(authRef.basicAuthPassword),
        ...extractKeys(JSON.stringify(authRef.verificationTokenApiPayload ?? {})),
        ...extractKeys(JSON.stringify(authRef.verificationTokenApiHeaders ?? {})),
        ...extractKeys(JSON.stringify(appRef.magicUrlApiPayload ?? {})),
        ...extractKeys(JSON.stringify(appRef.magicUrlApiHeaders ?? {})),
        ...extractKeys(JSON.stringify((appRef as any).step2HeaderTemplate ?? {})),
      ]);

      if (allSecretKeys.size > 0) {
        const secretArn = process.env.TPA_SECRET_ARN;
        let secretMap: Record<string, string> = {};
        if (secretArn) {
          try {
            const sm = new AWS.SecretsManager({ region: process.env.AWS_REGION ?? "ap-south-1" });
            const existing = await sm.getSecretValue({ SecretId: secretArn }).promise();
            secretMap = JSON.parse(existing.SecretString ?? "{}");
          } catch { /* if we can't read, assume all unset */ }
        }
        const unsetKeys = [...allSecretKeys].filter(k => !secretMap[k]?.trim());
        if (unsetKeys.length > 0) {
          this.logger.error({ level: "error", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, unsetKeys }, messageData: "Pre-flight failed: required secret keys are not configured — test will not run" }) });
          return {
            ...result,
            preflightError: true,
            unsetSecretKeys: unsetKeys,
            message: `Cannot run test — ${unsetKeys.length} secret key(s) not configured in Secrets Manager: ${unsetKeys.join(", ")}. Set them via 'Update Credentials in Secret Manager' before testing.`,
          };
        }
        this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, checkedKeys: [...allSecretKeys] }, messageData: "Pre-flight passed: all secret keys are configured" }) });
      }
    }

    // ── STEP 1 (SESSION / JWT / SESSION_BODY / BASIC_AUTH — DIRECT and HEADER_CREDENTIALS skip it) ──
    // BASIC_AUTH: step 1 uses Basic Auth credentials to obtain a Bearer token; step 2 uses that Bearer token.
    const skipStep1 = ["DIRECT", "HEADER_CREDENTIALS"].includes(authRef.authType ?? "");
    if (!skipStep1 && authRef.verificationTokenApiUrl) {
      let step1Payload: Record<string, any> = {};

      if (authRef.authType === "JWT") {
        // Generate a JWT to use as the verification token
        const token = jwt.sign(
          { sub: "test-user@iirm.com", iss: authRef.iss ?? "iirm" },
          "test-secret",
          { expiresIn: authRef.expiresIn ?? "10m" }
        );
        step1Payload = resolvePlaceholders(authRef.verificationTokenApiPayload ?? {}, {
          ...dto.staticValues,
          jwtToken: token,
          email: "test-user@iirm.com",
        });
      } else {
        step1Payload = resolvePlaceholders(authRef.verificationTokenApiPayload ?? {}, dto.staticValues);
      }
      // Resolve any {{secret:env:VAR:KEY}} patterns left in payload (async — needs AWS)
      step1Payload = await resolveSecretPlaceholders(step1Payload);

      try {
        const method = (authRef.verificationTokenApiMethod ?? "POST").toLowerCase();
        const step1PayloadFormat: string = authRef.payloadFormat ?? "JSON";
        const step1Headers: Record<string, string> = {
          "Content-Type": step1PayloadFormat === "FORM" ? "application/x-www-form-urlencoded" : "application/json",
        };
        if (authRef.verificationTokenApiHeaders) {
          const resolvedHdrs = await resolveSecretPlaceholders(resolvePlaceholders(authRef.verificationTokenApiHeaders, dto.staticValues));
          Object.entries(resolvedHdrs).forEach(([k, v]) => { if (v != null) step1Headers[k] = String(v); });
        }
        // BASIC_AUTH: add Basic Auth header to step 1 so TPA can issue a Bearer token
        if (authRef.authType === "BASIC_AUTH") {
          const baUser = await resolveSecretString(authRef.basicAuthUser ?? "", { logger: this.logger, traceId: this.traceIdService.traceId });
          const baPass = await resolveSecretString(authRef.basicAuthPassword ?? "", { logger: this.logger, traceId: this.traceIdService.traceId });
          if (baUser) step1Headers["Authorization"] = `Basic ${Buffer.from(`${baUser}:${baPass}`).toString("base64")}`;
        }
        const step1Body = step1PayloadFormat === "FORM"
          ? new URLSearchParams(Object.entries(step1Payload).map(([k, v]) => [k, String(v ?? "")] as [string, string])).toString()
          : step1Payload;
        this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, step: 1, url: authRef.verificationTokenApiUrl, httpMethod: method.toUpperCase(), payloadKeys: Object.keys(step1Payload), headerKeys: Object.keys(step1Headers).filter(k => k !== "Authorization") }, messageData: "Step1 request" }) });
        const step1Start = Date.now();
        const step1Res = await axios({
          method: method as any,
          url: authRef.verificationTokenApiUrl,
          data: step1Body,
          headers: step1Headers,
          timeout: 120000,
        });
        this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, step: 1, httpStatus: step1Res.status, durationMs: Date.now() - step1Start }, messageData: "Step1 response received" }) });
        // Prefer isAuthToken row from response mappings; fall back to step1ResponseTokenKey field
        const step1Mappings = await this.repo.findResponseMappingsByAppRef(authRef.id);
        const authTokenMapping = step1Mappings.find((m) => m.step === 1 && m.isAuthToken);
        const tokenKey = authTokenMapping?.responseKey ?? authRef.step1ResponseTokenKey ?? "verificationToken";
        // Dot-notation support (e.g. "data.token") — return null if key not found
        step1Res.data = normalizeTpaResponseData(step1Res.data);
        const rawToken = tokenKey.split(".").reduce((obj: any, key: string) => obj?.[key], step1Res.data) ?? null;
        const sessionToken = rawToken == null ? "" : (typeof rawToken === "object" ? JSON.stringify(rawToken) : String(rawToken));
        const step1SecuredPaths = extractSecuredPaths(authRef.verificationTokenApiPayload ?? {});
        const step1PayloadDisplay = maskSecuredFields(step1Payload, step1SecuredPaths);
        const step1ResponseDisplay = maskTokenInResponse(step1Res.data, tokenKey);
        const step1Flattened = flattenObject(step1Res.data);
        if (tokenKey && step1Flattened[tokenKey]) step1Flattened[tokenKey] = "[token]";
        result.steps.push({ step: 1, status: "success", payload: step1PayloadDisplay, response: step1ResponseDisplay, flattened: step1Flattened });
        if (sessionToken) {
          this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, step: 1, tokenKey, tokenObtained: true }, messageData: "Step1 token obtained successfully" }) });
        } else {
          // HTTP 200 but no token — TPA returned success status but token key missing or empty
          // Log as failure so CloudWatch alarms / post-deploy monitoring catch it immediately
          const tpaMessage = (step1Res.data as any)?.message ?? (step1Res.data as any)?.msg ?? (step1Res.data as any)?.error ?? "token key not found in response";
          const tpaErrorCode = (step1Res.data as any)?.errorcode ?? (step1Res.data as any)?.error_code ?? (step1Res.data as any)?.statusCode ?? null;
          this.logger.error({ level: "error", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, step: 1, tokenKey, tokenObtained: false, httpStatus: step1Res.status, tpaMessage, tpaErrorCode, responseKeys: Object.keys(step1Res.data ?? {}) }, messageData: "Step1 HTTP 200 but token not obtained — TPA rejected the request" }) });
        }
        result.sessionToken = sessionToken;

        // If only testing step 1, return here
        if (dto.step === 1) return result;

        // Make session token available for payload placeholder substitution
        dto.staticValues = { ...dto.staticValues, [tokenKey]: sessionToken };
      } catch (e: any) {
        this.logger.error({ level: "error", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, step: 1, httpStatus: e?.response?.status, errorCode: e?.code }, messageData: e?.message ?? "Step1 failed" }) });
        const step1SecuredPathsErr = extractSecuredPaths(authRef.verificationTokenApiPayload ?? {});
        result.steps.push({
          step: 1, status: "error", payload: maskSecuredFields(step1Payload, step1SecuredPathsErr),
          error: e?.response?.data ?? e?.message ?? "Step 1 failed",
        });
        return result;
      }
    }

    // ── STEP 2 (always) ──────────────────────────────────────
    let step2Payload = await resolveSecretPlaceholders(resolvePlaceholders(appRef.magicUrlApiPayload ?? {}, dto.staticValues));
    const step2ContentType: string = (appRef as any).step2ContentType ?? "application/json";
    const step2Headers: Record<string, string> = { "Content-Type": step2ContentType };

    // SESSION / BASIC_AUTH (2-step): use Step 1 token for Step 2. Prefix defaults to
    // "Bearer" but some TPAs use a non-standard word (e.g. "Token") — configurable
    // per app ref via tokenHeaderPrefix.
    if (authRef.authType === "SESSION" || (authRef.authType === "BASIC_AUTH" && authRef.verificationTokenApiUrl)) {
      if (result.sessionToken) {
        const tokenPrefix = (authRef as any).tokenHeaderPrefix || "Bearer";
        step2Headers["Authorization"] = buildAuthorizationHeaderValue(tokenPrefix, result.sessionToken);
      } else {
        this.logger.error({ level: "error", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, authType: authRef.authType }, messageData: "Step2 proceeding with empty session token — Step1 did not return a token, Step2 will likely fail" }) });
      }
    }
    // BASIC_AUTH (1-step): no token endpoint — send Basic Auth header directly on Step 2
    if (authRef.authType === "BASIC_AUTH" && !authRef.verificationTokenApiUrl) {
      const baUser = await resolveSecretString(authRef.basicAuthUser ?? "", { logger: this.logger, traceId: this.traceIdService.traceId });
      const baPass = await resolveSecretString(authRef.basicAuthPassword ?? "", { logger: this.logger, traceId: this.traceIdService.traceId });
      this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, step: 2, userResolved: !!baUser, passResolved: !!baPass }, messageData: "BASIC_AUTH (1-step): credentials resolved for Step 2" }) });
      if (baUser) step2Headers["Authorization"] = `Basic ${Buffer.from(`${baUser}:${baPass}`).toString("base64")}`;
    }
    // SESSION_BODY: inject token into request body under tokenBodyKey
    if (result.sessionToken && authRef.authType === "SESSION_BODY") {
      const bodyKey = (authRef as any).tokenBodyKey ?? "token";
      step2Payload = { ...step2Payload, [bodyKey]: result.sessionToken };
    }
    // HEADER_CREDENTIALS / static headers from step2HeaderTemplate
    if ((appRef as any).step2HeaderTemplate) {
      const resolvedHdrs2 = await resolveSecretPlaceholders(resolvePlaceholders((appRef as any).step2HeaderTemplate, dto.staticValues));
      Object.entries(resolvedHdrs2).forEach(([k, v]) => { if (v != null) step2Headers[k] = String(v); });
    }
    if (appRef.magicUrlApiHeaders) {
      const resolvedApiHdrs = await resolveSecretPlaceholders(resolvePlaceholders(appRef.magicUrlApiHeaders, dto.staticValues));
      Object.entries(resolvedApiHdrs).forEach(([k, v]) => { if (v != null) step2Headers[k] = String(v); });
    }
    const step2Body = step2ContentType.includes("form-urlencoded")
      ? new URLSearchParams(Object.entries(step2Payload).map(([k, v]) => [k, String(v ?? "")] as [string, string])).toString()
      : step2Payload;
    try {
      const method = (appRef.magicUrlApiMethod ?? "POST").toLowerCase();
      // GET/DELETE have no request body in practice — send the fields as URL query
      // parameters instead, matching what document-service's live callDataApi does.
      const isBodylessMethod = ["get", "delete"].includes(method);
      this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, step: 2, curl: buildRedactedCurlLog(method, appRef.magicUrlApiUrl ?? "", step2Headers, isBodylessMethod ? undefined : step2Body, isBodylessMethod ? step2Payload : undefined) }, messageData: "Step2 request — full outgoing request (secrets redacted)" }) });
      const step2Start = Date.now();
      const step2Res = await axios({
        method: method as any,
        url: appRef.magicUrlApiUrl,
        ...(isBodylessMethod ? { params: step2Payload } : { data: step2Body }),
        headers: step2Headers,
        timeout: 120000,
      });
      this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, step: 2, httpStatus: step2Res.status, durationMs: Date.now() - step2Start }, messageData: "Step2 response received" }) });
      const dataKey = appRef.step2ResponseDataKey ?? "magicLink";
      // Truncate large array responses to prevent browser freeze on preview
      const rawData = normalizeTpaResponseData(step2Res.data);
      const PREVIEW_LIMIT = 3;
      let previewData: any = rawData;
      let recordCount: number | undefined;
      let truncated = false;
      if (Array.isArray(rawData) && rawData.length > PREVIEW_LIMIT) {
        recordCount = rawData.length;
        previewData = rawData.slice(0, PREVIEW_LIMIT);
        truncated = true;
      } else if (rawData && typeof rawData === "object") {
        const keys = Object.keys(rawData);
        const arrayKey = keys.find(k => Array.isArray((rawData as any)[k]) && (rawData as any)[k].length > PREVIEW_LIMIT);
        if (arrayKey) {
          const arr = (rawData as any)[arrayKey] as any[];
          recordCount = arr.length;
          previewData = { ...rawData, [arrayKey]: arr.slice(0, PREVIEW_LIMIT) };
          truncated = true;
        }
      }
      // Detect HTTP 200 but TPA-level failure in body (common pattern in Indian TPA APIs)
      const tpaStatus = (rawData as any)?.status;
      const tpaMsg = (rawData as any)?.message ?? (rawData as any)?.msg ?? (rawData as any)?.error ?? "";
      const tpaCode = (rawData as any)?.errorcode ?? (rawData as any)?.error_code ?? (rawData as any)?.statusCode ?? null;
      const isBusinessFailure = tpaStatus === false || tpaStatus === "false" ||
        (tpaCode !== null && tpaCode !== 200 && tpaCode !== "200") ||
        /invalid|fail|error|unauthorized|not found|expired/i.test(String(tpaMsg));
      if (isBusinessFailure) {
        this.logger.error({ level: "error", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, step: 2, httpStatus: step2Res.status, tpaStatus, tpaMessage: tpaMsg, tpaErrorCode: tpaCode, responseKeys: Object.keys(rawData ?? {}) }, messageData: "Step2 HTTP 200 but TPA returned a business-level error" }) });
      } else {
        this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, step: 2, recordCount: recordCount ?? "n/a", truncated }, messageData: "Step2 data processed successfully" }) });
      }
      // For flattening: use extractFirstRecord only when rawData is an array or has array-valued keys
      // (member list / sync responses). For plain single-record objects, flatten directly so all
      // top-level keys (e.g. ECARD_DOWNLOAD_URL) are visible in Response Mappings auto-discovery.
      const isArrayResponse = Array.isArray(rawData) || (
        rawData && typeof rawData === "object" &&
        Object.values(rawData as Record<string, any>).some((v) => Array.isArray(v) && v.length > 0)
      );
      const step2SecuredPaths = extractSecuredPaths(appRef.magicUrlApiPayload ?? {});
      const step2PayloadDisplay = maskSecuredFields(step2Payload, step2SecuredPaths);
      // Always flatten the raw, un-extracted data. flattenObject() already handles top-level
      // arrays correctly by adding a ".0" path prefix (e.g. "0.E_Card") — calling
      // extractFirstRecord() first, as this used to do for non-SYNC configs, stripped the array
      // wrapper before flattenObject ever saw it, silently discarding that prefix and producing
      // discovered keys (e.g. "E_Card") that don't match what extractDotNotation needs at runtime
      // against the actual array-shaped response.
      const flattenSource = rawData;
      result.steps.push({
        step: 2, status: "success", payload: step2PayloadDisplay,
        response: previewData, flattened: flattenObject(flattenSource),
        ...(truncated ? { recordCount, truncated } : {}),
      });
      result.finalResult = rawData?.[dataKey] ?? rawData;
    } catch (e: any) {
      this.logger.error({ level: "error", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "TpaExternalFeatureService", method: "testApiConfig", payload: { appRefId: dto.appRefId, step: 2, httpStatus: e?.response?.status, errorCode: e?.code }, messageData: e?.message ?? "Step2 failed" }) });
      const step2SecuredPathsErr = extractSecuredPaths(appRef.magicUrlApiPayload ?? {});
      result.steps.push({
        step: 2, status: "error", payload: maskSecuredFields(step2Payload, step2SecuredPathsErr),
        error: e?.response?.data ?? e?.message ?? "Step 2 failed",
      });
    }

    return result;
  }

  // ── Feature Types ────────────────────────────────────────────

  getAllFeatureTypes(onlyActive?: boolean) {
    return this.repo.findAllFeatureTypes(onlyActive);
  }

  async createFeatureType(dto: CreateFeatureTypeDto) {
    return this.repo.createFeatureType(dto);
  }

  async updateFeatureType(id: number, dto: Partial<CreateFeatureTypeDto>) {
    const updated = await this.repo.updateFeatureType(id, dto);
    if (!updated) throw new NotFoundException(`Feature type ${id} not found`);
    return updated;
  }

  // ── Feature Configs ──────────────────────────────────────────

  getAllConfigs() {
    return this.repo.findAllConfigs();
  }

  getConfigsByTpa(tpaId: number, onlyActive?: boolean) {
    return onlyActive
      ? this.repo.findActiveConfigsByTpa(tpaId)
      : this.repo.findConfigsByTpa(tpaId);
  }

  async getConfigById(id: number) {
    const config = await this.repo.findConfigById(id);
    if (!config) throw new NotFoundException(`Feature config ${id} not found`);
    return config;
  }

  async createFeatureConfig(dto: CreateFeatureConfigDto) {
    return this.repo.createFeatureConfig(dto);
  }

  async updateFeatureConfig(id: number, dto: Partial<CreateFeatureConfigDto>) {
    const updated = await this.repo.updateFeatureConfig(id, dto);
    if (!updated) throw new NotFoundException(`Feature config ${id} not found`);
    return updated;
  }

  async deleteFeatureConfig(id: number) {
    const existing = await this.repo.findConfigById(id);
    if (!existing) throw new NotFoundException(`Feature config ${id} not found`);
    await this.repo.deleteFeatureConfig(id);
  }

  // ── Response Mappings ──────────────────────────────────────────

  async getResponseMappings(appRefId: number) {
    const ref = await this.repo.findAppRefById(appRefId);
    if (!ref) throw new NotFoundException(`App ref ${appRefId} not found`);
    return this.repo.findResponseMappingsByAppRef(appRefId);
  }

  async upsertResponseMappings(appRefId: number, dtos: UpsertResponseMappingDto[]) {
    const ref = await this.repo.findAppRefById(appRefId);
    if (!ref) throw new NotFoundException(`App ref ${appRefId} not found`);
    const result = await this.repo.upsertResponseMappings(appRefId, dtos);
    // Keep step1ResponseTokenKey in sync with the isAuthToken row so both fields always agree
    const authRow = dtos.find((d) => d.step === 1 && d.isAuthToken);
    if (authRow && authRow.responseKey !== ref.step1ResponseTokenKey) {
      await this.repo.updateAppRef(appRefId, { step1ResponseTokenKey: authRow.responseKey });
    }
    return result;
  }

  async deleteResponseMapping(id: number) {
    await this.repo.deleteResponseMapping(id);
  }

  async rotateBasicAuth(appRefId: number, username: string, password: string) {
    const appRef = await this.repo.findAppRefById(appRefId);
    if (!appRef) throw new NotFoundException(`App ref ${appRefId} not found`);

    const norm = (s: string) =>
      s.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").toUpperCase();
    const base = norm(appRef.label || `CONFIG_${appRefId}`);
    const keys: Record<string, string> = {};
    if (username) keys[`${base}_STEP1_BASIC_USER`] = username;
    if (password) keys[`${base}_STEP1_BASIC_PASS`] = password;

    return this.updateSecretKeys(appRefId, keys);
  }

  async updateSecretKeys(appRefId: number, keys: Record<string, string>) {
    const secretArn = process.env.TPA_SECRET_ARN;
    if (!secretArn) throw new Error("TPA_SECRET_ARN env var is not set");

    const keyNames = Object.keys(keys);
    if (keyNames.length === 0) return { updatedKeys: [] };

    this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "TpaExternalFeatureService", method: "updateSecretKeys", payload: { appRefId, keyNames }, messageData: "Updating AWS Secrets Manager" }) });

    const sm = new AWS.SecretsManager({ region: process.env.AWS_REGION ?? "ap-south-1" });

    let current: Record<string, string> = {};
    try {
      const existing = await sm.getSecretValue({ SecretId: secretArn }).promise();
      current = JSON.parse(existing.SecretString ?? "{}");
    } catch (err) {
      this.logger.error({ level: "warn", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "TpaExternalFeatureService", method: "updateSecretKeys", payload: { appRefId }, messageData: `Could not read existing secret, will overwrite — ${(err as Error).message}` }) });
    }

    const updated = { ...current, ...keys };
    await sm.putSecretValue({ SecretId: secretArn, SecretString: JSON.stringify(updated) }).promise();

    this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "TpaExternalFeatureService", method: "updateSecretKeys", payload: { appRefId, keyNames }, messageData: "AWS Secrets Manager updated OK" }) });
    return { updatedKeys: keyNames };
  }

  async checkSecretKeys(appRefId: number, keys: string[]): Promise<Record<string, boolean>> {
    const secretArn = process.env.TPA_SECRET_ARN;
    if (!secretArn) throw new Error("TPA_SECRET_ARN env var is not set");
    if (!keys.length) return {};

    const sm = new AWS.SecretsManager({ region: process.env.AWS_REGION ?? "ap-south-1" });
    let current: Record<string, string> = {};
    try {
      const existing = await sm.getSecretValue({ SecretId: secretArn }).promise();
      current = JSON.parse(existing.SecretString ?? "{}");
    } catch (err) {
      this.logger.error({ level: "error", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "TpaExternalFeatureService", method: "checkSecretKeys", payload: { appRefId }, messageData: `Could not read secret — ${(err as Error).message}` }) });
      return keys.reduce((acc, k) => ({ ...acc, [k]: false }), {} as Record<string, boolean>);
    }

    return keys.reduce((acc, k) => ({ ...acc, [k]: !!(current[k]?.trim()) }), {} as Record<string, boolean>);
  }

  async deleteSecretKeys(appRefId: number, keys: string[]) {
    const secretArn = process.env.TPA_SECRET_ARN;
    if (!secretArn) throw new Error("TPA_SECRET_ARN env var is not set");
    if (!keys.length) return { deletedKeys: [] };

    this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "TpaExternalFeatureService", method: "deleteSecretKeys", payload: { appRefId, keys }, messageData: "Deleting orphaned keys from AWS Secrets Manager" }) });

    const sm = new AWS.SecretsManager({ region: process.env.AWS_REGION ?? "ap-south-1" });

    let current: Record<string, string> = {};
    try {
      const existing = await sm.getSecretValue({ SecretId: secretArn }).promise();
      current = JSON.parse(existing.SecretString ?? "{}");
    } catch (err) {
      this.logger.error({ level: "error", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "TpaExternalFeatureService", method: "deleteSecretKeys", payload: { appRefId }, messageData: `Could not read existing secret — ${(err as Error).message}` }) });
      throw err;
    }

    const deletedKeys: string[] = [];
    for (const k of keys) {
      if (k in current) { delete current[k]; deletedKeys.push(k); }
    }

    if (deletedKeys.length > 0) {
      await sm.putSecretValue({ SecretId: secretArn, SecretString: JSON.stringify(current) }).promise();
    }

    this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "TpaExternalFeatureService", method: "deleteSecretKeys", payload: { appRefId, deletedKeys }, messageData: "Orphaned keys deleted from AWS Secrets Manager" }) });
    return { deletedKeys };
  }
}
