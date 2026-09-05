import { ForbiddenException, Injectable } from "@nestjs/common";
import axios from "axios";
import * as https from "https";
import * as jwt from "jsonwebtoken";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { MstrExtApplicationRef } from "../../../../service-lib/src/lib/entities/mstr-ext-application-ref.entity";
import { ExternalAppRepository } from "./external-app.repository";
import { resolvePayloadTemplate, extractDotNotation } from "./payload-template.util";
import { resolveSecretString } from "../../../../service-lib/src/lib/utils/secret-resolver.util";
import { buildRedactedCurlLog } from "../../../../service-lib/src/lib/utils/curl-log.util";
import { buildAuthorizationHeaderValue } from "../../../../service-lib/src/lib/utils/auth-header.util";
import { normalizeTpaResponseData } from "../../../../service-lib/src/lib/utils/tpa-response.util";

// keepAlive:false avoids Expect:100-continue issues on strict TPA servers.
// rejectUnauthorized is disabled only in non-production to support self-signed certs
// on internal HTTPS ports (e.g. :8081). Always true in production.
const isProduction = process.env.NODE_ENV === "production";
const externalApiAgent = new https.Agent({ keepAlive: false, rejectUnauthorized: isProduction });

// Cache entry for a resolved Step 1 auth token.
// Key: appRefId (for SESSION/SESSION_BODY — system-level credentials, shared across users).
interface Step1CacheEntry {
    token: string;
    expiresAt: number;
    rawResponse: any;
}

@Injectable()
export class ExternalAppService {
    private readonly logger: ReturnType<typeof createLogger>;

    // Keyed by appRefId — system-level SESSION credentials are the same for all users,
    // so one cache entry per app config is correct.
    private readonly step1TokenCache = new Map<number, Step1CacheEntry>();

    // Resolves {{env:KEY_NAME}} and {{secret:SECRET:KEY}} in a credential string.
    // Throws if any placeholder remains unresolved — prevents raw {{secret:...}} being sent to TPA.
    private async resolveEnvString(value: string | null | undefined): Promise<string> {
        if (!value) return "";
        const resolved = await resolveSecretString(value, { logger: this.logger, traceId: this.traceIdService.traceId });
        if (resolved.includes("{{")) {
            const safePattern = value.replace(/\{\{[^}]+\}\}/g, "[PATTERN]");
            throw new Error(`Credential placeholder not resolved: ${safePattern}. Check TPA_SECRET_ARN env var and Secrets Manager key configuration.`);
        }
        return resolved;
    }

    // resolvePayloadTemplate is sync and only handles {{fieldName}}/{{env:KEY}}.
    // This wrapper does a second async pass to resolve any remaining {{secret:env:VAR:KEY}}
    // patterns — used for payload fields that admins mark as secured in iWork.
    private async resolvePT(template: Record<string, any>, fields: Record<string, any>): Promise<Record<string, any>> {
        const first = resolvePayloadTemplate(template, fields);
        const resolveDeep = async (obj: any): Promise<any> => {
            if (typeof obj === "string" && /\{\{secret:env:/.test(obj)) return this.resolveEnvString(obj);
            if (Array.isArray(obj)) return Promise.all(obj.map((item) => resolveDeep(item)));
            if (obj && typeof obj === "object") {
                const entries = await Promise.all(Object.entries(obj).map(async ([k, v]) => [k, await resolveDeep(v)]));
                return Object.fromEntries(entries);
            }
            return obj;
        };
        return resolveDeep(first);
    }

    private parseTokenTtlMs(expiresIn?: string | null): number {
        if (!expiresIn) return 50 * 60 * 1000; // 50 min default
        const m = expiresIn.match(/^(\d+)([smhd]?)$/);
        if (!m) return 50 * 60 * 1000;
        const num = parseInt(m[1], 10);
        switch (m[2]) {
            case 's': return num * 1_000;
            case 'm': return num * 60 * 1_000;
            case 'h': return num * 3_600 * 1_000;
            case 'd': return num * 86_400 * 1_000;
            default:  return num * 1_000;
        }
    }

    constructor(
        private readonly externalAppRepository: ExternalAppRepository,
        private readonly traceIdService: TraceIdService
    ) {
        this.logger = createLogger(
            this.traceIdService,
            serviceNames.DOCUMENT_SERVICE
        );
    }

    /**
     * Server-to-server fetch of a TPA-hosted file (e.g. an e-card PDF URL returned from the
     * SSO flow). Browser JS `fetch()`/pdf.js cannot read these responses directly when the TPA
     * doesn't send Access-Control-Allow-Origin — a server call has no such restriction. Only
     * hosts already configured on a TPA app ref are allowed, to avoid this becoming an open
     * SSRF relay for arbitrary URLs.
     */
    async proxyFile(fileUrl: string): Promise<{ buffer: Buffer; contentType: string; contentDisposition?: string }> {
        let parsed: URL;
        try {
            parsed = new URL(fileUrl);
        } catch {
            throw new ForbiddenException("Invalid file URL");
        }
        if (parsed.protocol !== "https:") {
            throw new ForbiddenException("Only https URLs may be proxied");
        }
        const allowed = await this.externalAppRepository.isAllowedProxyHost(parsed.hostname);
        if (!allowed) {
            throw new ForbiddenException("This host is not configured for file proxying");
        }
        const response = await axios.get(fileUrl, {
            responseType: "arraybuffer",
            httpsAgent: externalApiAgent,
            timeout: 120000,
        });
        return {
            buffer: Buffer.from(response.data),
            contentType: response.headers["content-type"] ?? "application/octet-stream",
            contentDisposition: response.headers["content-disposition"],
        };
    }

    /**
     * Generate JWT token for external application authentication
     * Only used when auth_type = 'JWT' (iConnect, Poppins)
     * 
     * @param {MstrExtApplicationRef} appConfig - Application configuration
     * @param {string} userEmail - User's email address
     * @returns {string} Generated JWT token
     */
    private generateJwtToken(appConfig: MstrExtApplicationRef, userEmail: string): string {

        // Function to get JWT secret from environment variables
        function getExternalAppJwtSecret(label: string): string {
            const envKey = `EXTERNAL_APP_JWT_SECRET_${label.toUpperCase()}`;
            const secret = process.env[envKey];

            if (!secret) {
                throw new Error(`JWT secret not found for external app: ${label}`);
            }

            return secret;
        }

        // Generate new token using jwt.sign
        const token = jwt.sign(
            {
                iss: appConfig.iss,
                aud: appConfig.label,
                email: userEmail,
            },
            getExternalAppJwtSecret(appConfig.label),
            { expiresIn: (appConfig.expiresIn || "10m") as any }
        );

        this.logger.log({
            level: "info",
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "success",
                location: "ExternalAppService",
                method: "generateJwtToken",
                payload: { appKey: appConfig.label },
                messageData: "Generated new JWT token",
            }),
        });

        return token;
    }

    /**
     * Call Authentication API (verification/credential validation)
     * 
     * For JWT auth_type: Calls verify-user API with Bearer JWT
     * For SESSION auth_type: Calls credential validation API without auth header
     * 
     * @param {MstrExtApplicationRef} appConfig - Application configuration
     * @param {string | null} authToken - Bearer token (JWT or null for SESSION auth_type)
     * @param {Record<string, any>} resolvedPayload - Resolved payload from template
     * @param {Record<string, any>} availableFields - Resolved fields for header template substitution
     * @param {string} [overrideTokenKey] - Dot-notation key to extract token from response
     * @returns {Promise<{legacyToken: string; rawResponse: any}>} Extracted token and raw Step 1 response
     */
    private async callAuthenticationApi(
        appConfig: MstrExtApplicationRef,
        authToken: string | null,
        resolvedPayload: Record<string, any>,
        availableFields: Record<string, any>,
        overrideTokenKey?: string,
    ): Promise<{ legacyToken: string; rawResponse: any }> {
        try {
            this.logger.log({
                level: "info",
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "ExternalAppService",
                    method: "callAuthenticationApi",
                    payload: { url: appConfig.verificationTokenApiUrl, authType: appConfig.authType },
                    messageData: "Calling Authentication API",
                }),
            });

            const headers: Record<string, string> = { "Content-Type": "application/json" };

            if (authToken) {
                headers["Authorization"] = buildAuthorizationHeaderValue((appConfig as any).tokenHeaderPrefix || "Bearer", authToken);
            }

            // BASIC_AUTH: credentials stored in DB — supports {{env:KEY}} and {{secret:NAME:KEY}}
            if (appConfig.authType === "BASIC_AUTH") {
                const user = await this.resolveEnvString(appConfig.basicAuthUser);
                const pass = await this.resolveEnvString(appConfig.basicAuthPassword);
                if (user && pass) {
                    const encoded = Buffer.from(`${user}:${pass}`).toString("base64");
                    headers["Authorization"] = `Basic ${encoded}`;
                }
            }

            // Custom headers from DB config — supports {{placeholder}} templates
            if (appConfig.verificationTokenApiHeaders) {
                const resolvedCustomHeaders = await this.resolvePT(appConfig.verificationTokenApiHeaders, availableFields);
                for (const [k, v] of Object.entries(resolvedCustomHeaders)) {
                    if (v !== null && v !== undefined) headers[k] = String(v);
                }
            }

            // Use form-encoded body only when payloadFormat is explicitly FORM (e.g. OAuth2 token endpoints)
            const step1UseForm = appConfig.payloadFormat === "FORM";
            const axiosBody = step1UseForm
                ? new URLSearchParams(resolvedPayload as Record<string, string>).toString()
                : resolvedPayload;
            if (step1UseForm) headers["Content-Type"] = "application/x-www-form-urlencoded";

            this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "ExternalAppService", method: "callAuthenticationApi", payload: { url: appConfig.verificationTokenApiUrl, authType: appConfig.authType, form: step1UseForm, payloadKeys: Object.keys(resolvedPayload ?? {}) }, messageData: "Auth API request" }) });

            const response = await axios({
                method: appConfig.verificationTokenApiMethod as any,
                url: appConfig.verificationTokenApiUrl,
                data: axiosBody,
                headers,
                httpsAgent: externalApiAgent,
                timeout: 120_000,
            });
            response.data = normalizeTpaResponseData(response.data);
            this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "ExternalAppService", method: "callAuthenticationApi", payload: { httpStatus: response.status, responseKeys: Object.keys(response.data ?? {}) }, messageData: "Auth API response received" }) });
            // Extract token using configurable response key (supports dot-notation: "jsonData.access_token")
            const responseTokenKey = overrideTokenKey || appConfig.step1ResponseTokenKey || "verificationToken";
            const token = responseTokenKey.split(".").reduce((obj: any, key: string) => obj?.[key], response.data);

            if (token) {
                this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "ExternalAppService", method: "callAuthenticationApi", payload: { responseTokenKey }, messageData: "Auth API token extracted" }) });
                return { legacyToken: token, rawResponse: response.data };
            }

            throw new Error(`Token key '${responseTokenKey}' not found in Authentication API response`);
        } catch (error: any) {
            this.logger.error({ level: "error", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "ExternalAppService", method: "callAuthenticationApi", payload: { url: appConfig.verificationTokenApiUrl, httpStatus: error?.response?.status, errorCode: error?.code, responseBody: error?.response?.data }, messageData: error?.message ?? "Auth API failed" }) });
            throw error;
        }
    }

    /**
     * Call Data API (magic URL / e-card download / full response)
     *
     * For JWT auth_type: Uses same generated JWT as Bearer
     * For SESSION auth_type: Uses session token from Authentication API as Bearer
     *
     * @param {MstrExtApplicationRef} appConfig - Application configuration
     * @param {Record<string, any>} resolvedPayload - Resolved payload from template
     * @returns {Promise<Record<string, any>>} Complete response data from the external app
     */
    // Variant of callDataApi that uses custom HTTP headers instead of Bearer token.
    // Used by HEADER_CREDENTIALS (MediAssist) and BASIC_AUTH (Vidal).
    //
    // debugCapture: optional mutable out-param populated with the EXACT
    // outbound request (method/url/headers/body, secrets included) right
    // before the axios call fires — so it's captured whether the call
    // succeeds or throws. Callers (executeExternalAppSSO → controller →
    // ibp-service) relay this back so a failed claim delivery can be
    // retried by literally copy-pasting the stored JSON straight at the
    // TPA, without reverse-engineering the template/field-mapping pipeline.
    private async callDataApiWithHeaders(
        appConfig: MstrExtApplicationRef,
        extraHeaders: Record<string, string>,
        resolvedPayload: Record<string, any>,
        debugCapture?: { resolvedRequest?: Record<string, any> }
    ): Promise<Record<string, any>> {
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            ...extraHeaders,
        };
        const contentType = headers["Content-Type"] ?? "";
        const axiosBody = contentType.includes("form-urlencoded")
            ? new URLSearchParams(Object.entries(resolvedPayload).map(([k, v]) => [k, String(v ?? "")] as [string, string])).toString()
            : resolvedPayload;
        if (debugCapture) {
            debugCapture.resolvedRequest = {
                method: appConfig.magicUrlApiMethod, url: appConfig.magicUrlApiUrl, headers, body: resolvedPayload,
            };
        }
        this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "ExternalAppService", method: "callDataApiWithHeaders", payload: { url: appConfig.magicUrlApiUrl, method: appConfig.magicUrlApiMethod, contentType, headerKeys: Object.keys(headers).filter(k => k !== "Authorization"), payloadKeys: Object.keys(resolvedPayload ?? {}) }, messageData: "Data API (with headers) request" }) });
        try {
            const response = await axios({
                method: appConfig.magicUrlApiMethod as any,
                url: appConfig.magicUrlApiUrl,
                data: axiosBody,
                headers,
                httpsAgent: externalApiAgent,
                timeout: 180_000,
            });
            response.data = normalizeTpaResponseData(response.data);
            this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "ExternalAppService", method: "callDataApiWithHeaders", payload: { httpStatus: response.status, responseKeys: Object.keys(response.data ?? {}) }, messageData: "Data API (with headers) response received" }) });
            return response.data;
        } catch (error: any) {
            this.logger.error({ level: "error", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "ExternalAppService", method: "callDataApiWithHeaders", payload: { url: appConfig.magicUrlApiUrl, httpStatus: error?.response?.status }, messageData: error?.message ?? "Data API (with headers) failed" }) });
            throw error;
        }
    }

    private async callDataApi(
        appConfig: MstrExtApplicationRef,
        authToken: string | null,
        resolvedPayload: Record<string, any>,
        availableFields: Record<string, any>,
        debugCapture?: { resolvedRequest?: Record<string, any> }
    ): Promise<Record<string, any>> {
        try {
            this.logger.log({
                level: "info",
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "ExternalAppService",
                    method: "callDataApi",
                    payload: { url: appConfig.magicUrlApiUrl, authType: appConfig.authType },
                    messageData: "Calling Data API",
                }),
            });

            const step2ContentType = appConfig.step2ContentType || "application/json";
            const headers: Record<string, string> = { "Content-Type": step2ContentType };
            if (authToken) headers["Authorization"] = buildAuthorizationHeaderValue((appConfig as any).tokenHeaderPrefix || "Bearer", authToken);

            // Custom headers from DB config — supports {{placeholder}} templates
            if (appConfig.magicUrlApiHeaders) {
                const resolvedCustomHeaders = await this.resolvePT(appConfig.magicUrlApiHeaders, availableFields);
                for (const [k, v] of Object.entries(resolvedCustomHeaders)) {
                    if (v !== null && v !== undefined) headers[k] = String(v);
                }
            }
            const axiosData = step2ContentType === "application/x-www-form-urlencoded"
                ? new URLSearchParams(resolvedPayload as Record<string, string>).toString()
                : resolvedPayload;

            // GET/DELETE have no request body in practice — most APIs (including this one)
            // silently ignore a JSON body on these methods and expect the fields as URL query
            // parameters instead. Send resolvedPayload as `params` (axios appends it to the
            // URL's query string) rather than `data` for these methods.
            const isBodylessMethod = ["GET", "DELETE"].includes(
                String(appConfig.magicUrlApiMethod ?? "").toUpperCase(),
            );

            if (debugCapture) {
                debugCapture.resolvedRequest = {
                    method: appConfig.magicUrlApiMethod,
                    url: appConfig.magicUrlApiUrl,
                    headers,
                    body: isBodylessMethod ? resolvedPayload : axiosData,
                };
            }

            this.logger.log({
                level: "info",
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "ExternalAppService",
                    method: "callDataApi",
                    payload: {
                        curl: buildRedactedCurlLog(
                            appConfig.magicUrlApiMethod ?? "POST",
                            appConfig.magicUrlApiUrl ?? "",
                            headers,
                            isBodylessMethod ? undefined : axiosData,
                            isBodylessMethod ? resolvedPayload : undefined,
                        ),
                    },
                    messageData: "Calling data API — full outgoing request (secrets redacted)",
                }),
            });
            const response = await axios({
                method: appConfig.magicUrlApiMethod as any,
                url: appConfig.magicUrlApiUrl,
                ...(isBodylessMethod ? { params: resolvedPayload } : { data: axiosData }),
                headers,
                httpsAgent: externalApiAgent,
                timeout: 180_000, // 3min for data step (auth 2min + data 3min = 5min total max)
            });

            response.data = normalizeTpaResponseData(response.data);
            this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "ExternalAppService", method: "callDataApi", payload: { httpStatus: response.status, responseKeys: Object.keys(response.data ?? {}) }, messageData: "Data API response received" }) });

            // Return the complete response data instead of extracting a single key
            return response.data;
        } catch (error: any) {
            this.logger.error({
                level: "error",
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "failure",
                    location: "ExternalAppService",
                    method: "callDataApi",
                    payload: { url: appConfig.magicUrlApiUrl, httpStatus: error?.response?.status, errorCode: error?.code, responseBody: error?.response?.data },
                    messageData: error?.message ?? String(error),
                }),
            });
            throw error;
        }
    }

    /**
     * Main method to execute external app SSO flow
     * 
     * Supports two auth flows:
     * - JWT (iConnect, Poppins): Generate JWT → use as Bearer in both API calls
     * - SESSION (Good Health TPA): No JWT → Authentication API returns session token → use as Bearer in Data API
     * 
     * @param {string} appKey - Application identifier (label)
     * @param {string} userEmail - User's email address (from login JWT)
     * @param {Record<string, any>} dynamicFields - Optional dynamic fields from frontend
     * @returns {Promise<Record<string, any>>} Complete response data from the external app
     */
    async executeExternalAppSSO(
        appKey: string,
        userEmail: string,
        dynamicFields?: Record<string, any>,
        context?: { employeeId?: number; policyId?: number },
        // Optional mutable out-param — populated with the exact outbound
        // TPA request (method/url/headers/body) right before the data-API
        // call fires, whichever auth branch below actually runs. Passed by
        // reference so it's still populated even if the call throws. See
        // callDataApi/callDataApiWithHeaders for where it's set.
        debugCapture?: { resolvedRequest?: Record<string, any> }
    ): Promise<Record<string, any>> {
        this.logger.log({
            level: "info",
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "success",
                location: "ExternalAppService",
                method: "executeExternalAppSSO",
                payload: { appKey, userEmail },
                messageData: "Starting external app SSO flow",
            }),
        });

        try {
            // 1. Get application configuration from database
            const appConfig = await this.externalAppRepository.findByLabel(appKey);

            if (!appConfig) {
                throw new ForbiddenException(
                    `External application '${appKey}' not found or inactive`
                );
            }

            // 2. Resolve auth config — if authAppRefId is set, Step 1 is delegated to that app ref.
            //    This lets multiple features (ecard, hospital, claims) for the same TPA share one
            //    Step 1 auth config and one token cache entry without duplicating credentials.
            const authConfig = appConfig.authAppRefId
                ? (await this.externalAppRepository.findById(appConfig.authAppRefId)) ?? appConfig
                : appConfig;

            const authType = authConfig.authType || "JWT";

            // 3. Build available fields for template resolution
            const availableFields: Record<string, any> = {
                userEmail,
                expiresIn: appConfig.expiresIn,
                ...dynamicFields,
            };

            // Resolve field mappings from DB — adds DB-sourced values + applies date formats.
            // DB-resolved values take priority over dynamicFields from IBP for the same key.
            const resolvedMappings = await this.externalAppRepository.resolveFieldMappings(
                appConfig.id,
                { employeeId: context?.employeeId, policyId: context?.policyId },
            );
            Object.assign(availableFields, resolvedMappings);

            // Load response mappings — if none exist this appRef uses legacy single-key behavior
            // (preserves Poppins, iConnect and all other existing live integrations unchanged)
            const responseMappings = await this.externalAppRepository.findResponseMappings(appConfig.id);
            const hasMappings = responseMappings.length > 0;

            // DIRECT: credentials already in payload — no auth step, no Bearer header
            if (authType === "DIRECT") {
                const dataPayload = await this.resolvePT(
                    appConfig.magicUrlApiPayload || {},
                    availableFields
                );
                this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "success",
                        location: "ExternalAppService",
                        method: "executeExternalAppSSO",
                        payload: { appKey, url: appConfig.magicUrlApiUrl, method: appConfig.magicUrlApiMethod, resolvedPayloadKeys: Object.keys(dataPayload) },
                        messageData: "DIRECT: calling data API",
                    }),
                });
                const rawResult = await this.callDataApi(appConfig, null, dataPayload, availableFields, debugCapture);
                this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "success",
                        location: "ExternalAppService",
                        method: "executeExternalAppSSO",
                        payload: { appKey, responseKeys: Object.keys(rawResult ?? {}), hasMappings },
                        messageData: "DIRECT: data API response received",
                    }),
                });
                return hasMappings
                    ? await this.applyStep2Mappings(rawResult, responseMappings, appConfig, availableFields)
                    : rawResult;
            }

            // HEADER_CREDENTIALS: credentials go in HTTP headers (MediAssist)
            // No token step — merges step2HeaderTemplate (TPA static credentials) + magicUrlApiHeaders (admin dynamic headers)
            if (authType === "HEADER_CREDENTIALS") {
                const dataPayload = await this.resolvePT(
                    appConfig.magicUrlApiPayload || {},
                    availableFields
                );
                // Merge both header sources — magicUrlApiHeaders (admin UI) wins on conflict
                const templateHeaders = await this.resolvePT(appConfig.step2HeaderTemplate || {}, availableFields);
                const adminHeaders = await this.resolvePT(appConfig.magicUrlApiHeaders || {}, availableFields);
                const mergedHeaders: Record<string, string> = { ...templateHeaders, ...adminHeaders };
                this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "success",
                        location: "ExternalAppService",
                        method: "executeExternalAppSSO",
                        payload: { appKey, url: appConfig.magicUrlApiUrl, method: appConfig.magicUrlApiMethod, resolvedPayloadKeys: Object.keys(dataPayload), mergedHeaderKeys: Object.keys(mergedHeaders).filter(k => k !== "Authorization") },
                        messageData: "HEADER_CREDENTIALS: calling data API",
                    }),
                });
                const hcResult = await this.callDataApiWithHeaders(appConfig, mergedHeaders, dataPayload, debugCapture);
                this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "success",
                        location: "ExternalAppService",
                        method: "executeExternalAppSSO",
                        payload: { appKey, responseKeys: Object.keys(hcResult ?? {}), hasMappings },
                        messageData: "HEADER_CREDENTIALS: data API response received",
                    }),
                });
                return hasMappings ? await this.applyStep2Mappings(hcResult, responseMappings, appConfig, availableFields) : hcResult;
            }

            // BASIC_AUTH — two sub-modes based on whether a token endpoint is configured:
            //   • No verificationTokenApiUrl → 1-step: Basic Auth header on every data call (Vidal-style)
            //   • Has verificationTokenApiUrl → 2-step: Basic Auth on step 1 to get Bearer token, Bearer on step 2 (Aditya Birla-style)
            if (authType === "BASIC_AUTH") {
                if (!authConfig.verificationTokenApiUrl) {
                    // ── 1-step: credentials directly on data call ──
                    const templateHeaders = await this.resolvePT(appConfig.step2HeaderTemplate || {}, availableFields);
                    const adminHeaders = await this.resolvePT(appConfig.magicUrlApiHeaders || {}, availableFields);
                    const mergedHeaders: Record<string, string> = { ...templateHeaders, ...adminHeaders };
                    const basicUser = await this.resolveEnvString(authConfig.basicAuthUser);
                    const basicPass = await this.resolveEnvString(authConfig.basicAuthPassword);
                    if (!mergedHeaders["Authorization"] && basicUser && basicPass) {
                        mergedHeaders["Authorization"] = `Basic ${Buffer.from(`${basicUser}:${basicPass}`).toString("base64")}`;
                    }
                    const basicPayload = await this.resolvePT(appConfig.magicUrlApiPayload || {}, availableFields);
                    this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "ExternalAppService", method: "executeExternalAppSSO", payload: { appKey, url: appConfig.magicUrlApiUrl, resolvedPayloadKeys: Object.keys(basicPayload), mergedHeaderKeys: Object.keys(mergedHeaders).filter(k => k !== "Authorization") }, messageData: "BASIC_AUTH (1-step): calling data API with Basic Auth header" }) });
                    const basicResult = await this.callDataApiWithHeaders(appConfig, mergedHeaders, basicPayload, debugCapture);
                    this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "ExternalAppService", method: "executeExternalAppSSO", payload: { appKey, responseKeys: Object.keys(basicResult ?? {}), hasMappings }, messageData: "BASIC_AUTH (1-step): data API response received" }) });
                    return hasMappings ? await this.applyStep2Mappings(basicResult, responseMappings, appConfig, availableFields) : basicResult;
                }

                // ── 2-step: Basic Auth on step 1 → Bearer token → step 2 ──
                const baAuthPayload = await this.resolvePT(authConfig.verificationTokenApiPayload || {}, availableFields);
                const cachedBA = this.step1TokenCache.get(authConfig.id);
                let baToken: string;
                if (cachedBA && Date.now() < cachedBA.expiresAt) {
                    baToken = cachedBA.token;
                    this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "ExternalAppService", method: "executeExternalAppSSO", payload: { appKey, expiresIn: Math.round((cachedBA.expiresAt - Date.now()) / 1000) + "s" }, messageData: "BASIC_AUTH (2-step): step1 token served from cache" }) });
                } else {
                    this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "ExternalAppService", method: "executeExternalAppSSO", payload: { appKey, url: authConfig.verificationTokenApiUrl, payloadKeys: Object.keys(baAuthPayload) }, messageData: "BASIC_AUTH (2-step): calling step1 auth API" }) });
                    const authTokenMappingBA = responseMappings.find((m) => m.step === 1 && m.isAuthToken);
                    const baAuth = await this.callAuthenticationApi(authConfig, null, baAuthPayload, availableFields, authTokenMappingBA?.responseKey);
                    baToken = baAuth.legacyToken;
                    const ttl = this.parseTokenTtlMs(authConfig.expiresIn);
                    this.step1TokenCache.set(authConfig.id, { token: baToken, expiresAt: Date.now() + ttl, rawResponse: baAuth.rawResponse });
                }
                this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "ExternalAppService", method: "executeExternalAppSSO", payload: { appKey, tokenObtained: !!baToken }, messageData: "BASIC_AUTH (2-step): step1 token obtained" }) });
                const baDataPayload = await this.resolvePT(appConfig.magicUrlApiPayload || {}, availableFields);
                const baResult = await this.callDataApi(appConfig, baToken, baDataPayload, availableFields, debugCapture);
                this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "ExternalAppService", method: "executeExternalAppSSO", payload: { appKey, responseKeys: Object.keys(baResult ?? {}), hasMappings }, messageData: "BASIC_AUTH (2-step): data API response received" }) });
                return hasMappings ? await this.applyStep2Mappings(baResult, responseMappings, appConfig, availableFields) : baResult;
            }

            // SESSION_BODY: step1 returns token, inject into step2 BODY (Paramount)
            if (authType === "SESSION_BODY") {
                const authPayloadSB = await this.resolvePT(
                    authConfig.verificationTokenApiPayload || {},
                    availableFields
                );
                this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "success",
                        location: "ExternalAppService",
                        method: "executeExternalAppSSO",
                        payload: { appKey, url: authConfig.verificationTokenApiUrl, method: authConfig.verificationTokenApiMethod, payloadKeys: Object.keys(authPayloadSB) },
                        messageData: "SESSION_BODY: calling step1 auth API",
                    }),
                });
                const authTokenMappingSB = responseMappings.find((m) => m.step === 1 && m.isAuthToken);
                const cachedSB = this.step1TokenCache.get(authConfig.id);
                let sessionToken: string;
                if (cachedSB && Date.now() < cachedSB.expiresAt) {
                    sessionToken = cachedSB.token;
                    this.logger.log({
                        level: "info",
                        message: buildLogMessage({
                            traceId: this.traceIdService.traceId,
                            status: "success",
                            location: "ExternalAppService",
                            method: "executeExternalAppSSO",
                            payload: { appKey, expiresIn: Math.round((cachedSB.expiresAt - Date.now()) / 1000) + "s" },
                            messageData: "SESSION_BODY: step1 token served from cache",
                        }),
                    });
                } else {
                    const sbAuth = await this.callAuthenticationApi(authConfig, null, authPayloadSB, availableFields, authTokenMappingSB?.responseKey);
                    sessionToken = sbAuth.legacyToken;
                    const ttl = this.parseTokenTtlMs(authConfig.expiresIn);
                    this.step1TokenCache.set(authConfig.id, { token: sessionToken, expiresAt: Date.now() + ttl, rawResponse: sbAuth.rawResponse });
                }
                this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "success",
                        location: "ExternalAppService",
                        method: "executeExternalAppSSO",
                        payload: { appKey, tokenObtained: !!sessionToken },
                        messageData: "SESSION_BODY: step1 auth API response received",
                    }),
                });

                const tokenKey = appConfig.tokenBodyKey || "ACCESS_TOKEN";
                availableFields.step1Token = sessionToken;
                const dataPayloadSB = await this.resolvePT(
                    appConfig.magicUrlApiPayload || {},
                    availableFields
                );
                // Inject token into body under the configured key
                dataPayloadSB[tokenKey] = sessionToken;
                this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "success",
                        location: "ExternalAppService",
                        method: "executeExternalAppSSO",
                        payload: { appKey, url: appConfig.magicUrlApiUrl, method: appConfig.magicUrlApiMethod, tokenKey, payloadKeys: Object.keys(dataPayloadSB) },
                        messageData: "SESSION_BODY: calling step2 data API",
                    }),
                });
                const sbResult = await this.callDataApi(appConfig, null, dataPayloadSB, availableFields, debugCapture);
                this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "success",
                        location: "ExternalAppService",
                        method: "executeExternalAppSSO",
                        payload: { appKey, responseKeys: Object.keys(sbResult ?? {}), hasMappings },
                        messageData: "SESSION_BODY: step2 data API response received",
                    }),
                });
                return hasMappings ? await this.applyStep2Mappings(sbResult, responseMappings, appConfig, availableFields) : sbResult;
            }

            let authApiBearerToken: string | null = null;

            if (authType === "JWT") {
                // JWT mode: generate JWT and use as auth for both steps
                authApiBearerToken = this.generateJwtToken(authConfig, userEmail);
                this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "success",
                        location: "ExternalAppService",
                        method: "executeExternalAppSSO",
                        payload: { appKey },
                        messageData: "JWT: token generated",
                    }),
                });
            }
            // SESSION / BASIC_AUTH mode: no pre-generated token — Step 1 handles its own auth header

            // 4. Resolve authentication API payload from auth config template
            const authPayload = await this.resolvePT(
                authConfig.verificationTokenApiPayload || {},
                availableFields
            );

            this.logger.log({
                level: "info",
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "ExternalAppService",
                    method: "executeExternalAppSSO",
                    payload: { appKey, authType, url: authConfig.verificationTokenApiUrl, method: authConfig.verificationTokenApiMethod, payloadFormat: authConfig.payloadFormat, resolvedPayloadKeys: Object.keys(authPayload), hasMappings },
                    messageData: "Calling step1 auth API",
                }),
            });

            // 5. Call authentication API. SESSION-type auth here is single-session server-side —
            //    a fresh login elsewhere (e.g. another tool/test) invalidates any previously cached
            //    token, causing stale-but-structurally-valid tokens to fail downstream calls with a
            //    generic "no records found" instead of a clean auth error. Always get a fresh Step 1
            //    token for SESSION auth rather than reusing a cached one.
            //    JWT type generates a per-user token locally — no caching needed there.
            const authTokenMapping = responseMappings.find((m) => m.step === 1 && m.isAuthToken);
            let authResponseToken: string;
            let step1RawResponse: any;

            const isCacheable = false;
            const cached = isCacheable ? this.step1TokenCache.get(authConfig.id) : null;
            if (cached && Date.now() < cached.expiresAt) {
                authResponseToken = cached.token;
                step1RawResponse = cached.rawResponse;
                this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "success",
                        location: "ExternalAppService",
                        method: "executeExternalAppSSO",
                        payload: { appKey, expiresIn: Math.round((cached.expiresAt - Date.now()) / 1000) + "s" },
                        messageData: "Step1 token served from cache",
                    }),
                });
            } else {
                const step1Result = await this.callAuthenticationApi(authConfig, authApiBearerToken, authPayload, availableFields, authTokenMapping?.responseKey);
                authResponseToken = step1Result.legacyToken;
                step1RawResponse = step1Result.rawResponse;
                if (isCacheable) {
                    const ttl = this.parseTokenTtlMs(authConfig.expiresIn);
                    this.step1TokenCache.set(authConfig.id, { token: authResponseToken, expiresAt: Date.now() + ttl, rawResponse: step1RawResponse });
                }
            }

            this.logger.log({
                level: "info",
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "ExternalAppService",
                    method: "executeExternalAppSSO",
                    payload: { appKey, tokenObtained: !!authResponseToken, step1ResponseKeys: Object.keys(step1RawResponse ?? {}) },
                    messageData: "Step1 auth API response received",
                }),
            });

            // 6. If response mappings exist: extract all step 1 PLACEHOLDER fields, find auth token bearer
            //    Otherwise: fall back to legacy single extracted token (Poppins/iConnect unchanged)
            let dataApiBearerToken: string;

            if (hasMappings) {
                const step1Mappings = responseMappings.filter(
                    (m) => m.step === 1 && m.targetType === "PLACEHOLDER"
                );
                let step1Bearer: string | null = null;
                for (const m of step1Mappings) {
                    const val = extractDotNotation(step1RawResponse, m.responseKey);
                    availableFields[m.outputKey] = val;
                    if (m.isAuthToken) step1Bearer = val;
                }
                // Use mapped bearer if found, otherwise fall back to legacy extracted token
                dataApiBearerToken = step1Bearer ?? (authType === "JWT" ? authApiBearerToken! : authResponseToken);
                this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "success",
                        location: "ExternalAppService",
                        method: "executeExternalAppSSO",
                        payload: { appKey, mappingCount: step1Mappings.length, bearerFromMapping: !!step1Bearer, availableFieldKeys: Object.keys(availableFields) },
                        messageData: "Step1 response mappings applied",
                    }),
                });
            } else {
                // Legacy path — Poppins, iConnect, and all existing integrations
                dataApiBearerToken = authType === "JWT" ? authApiBearerToken! : authResponseToken;
                availableFields.step1Token = authResponseToken;
                this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "success",
                        location: "ExternalAppService",
                        method: "executeExternalAppSSO",
                        payload: { appKey, authType },
                        messageData: "Step1 legacy token extracted",
                    }),
                });
            }

            // 7. Resolve data API payload (availableFields now contains all step1 placeholders)
            const dataPayload = await this.resolvePT(
                appConfig.magicUrlApiPayload || {},
                availableFields
            );

            this.logger.log({
                level: "info",
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "ExternalAppService",
                    method: "executeExternalAppSSO",
                    payload: { appKey, url: appConfig.magicUrlApiUrl, method: appConfig.magicUrlApiMethod, step2ContentType: appConfig.step2ContentType, resolvedPayloadKeys: Object.keys(dataPayload), hasMappings },
                    messageData: "Calling step2 data API",
                }),
            });

            // 8. Call data API
            const rawResult = await this.callDataApi(appConfig, dataApiBearerToken, dataPayload, availableFields, debugCapture);

            this.logger.log({
                level: "info",
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "ExternalAppService",
                    method: "executeExternalAppSSO",
                    payload: { appKey, responseKeys: Object.keys(rawResult ?? {}), hasMappings },
                    messageData: "Step2 data API response received",
                }),
            });

            // 9. Apply step 2 response mappings (new) or return raw TPA response (legacy)
            const result = hasMappings
                ? await this.applyStep2Mappings(rawResult, responseMappings, appConfig, availableFields)
                : rawResult;

            this.logger.log({
                level: "info",
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "ExternalAppService",
                    method: "executeExternalAppSSO",
                    payload: { appKey, resultKeys: Object.keys(result ?? {}), hasMappings },
                    messageData: "SSO flow complete",
                }),
            });

            this.logger.log({
                level: "info",
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "ExternalAppService",
                    method: "executeExternalAppSSO",
                    payload: { appKey, userEmail },
                    messageData: "External app SSO flow completed successfully",
                }),
            });

            return result;
        } catch (error) {
            this.logger.error({
                level: "error",
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "failure",
                    location: "ExternalAppService",
                    method: "executeExternalAppSSO",
                    payload: { appKey, userEmail },
                    messageData: error,
                }),
            });

            if (error instanceof ForbiddenException) {
                throw new ForbiddenException(`Access Denied for external application '${appKey}'`);
            }

            throw new Error(
                `Error executing SSO flow for external application '${appKey}' and user '${userEmail}': ${(error as Error).message}`
            );
        }
    }

    /**
     * Apply step 2 STANDARD_KEY response mappings to normalise TPA response.
     * Returns a flat object like { REDIRECT_URL: "https://...", MEMBER_ID: "MBR123" }
     * that IBP reads using standard keys regardless of TPA-specific field names.
     *
     * If no STANDARD_KEY mappings exist for step 2, returns the raw response unchanged
     * so existing integrations without mappings keep working.
     */
    private async applyStep2Mappings(
        rawResponse: any,
        allMappings: import("../../../../service-lib/src/lib/entities/mstr-ext-app-response-mapping.entity").MstrExtAppResponseMapping[],
        appConfig?: MstrExtApplicationRef,
        availableFields?: Record<string, any>,
    ): Promise<Record<string, any>> {
        const step2Mappings = allMappings.filter(
            (m) => m.step === 2 && m.targetType === "STANDARD_KEY"
        );
        if (step2Mappings.length === 0) {
            // No step 2 standard key mappings — return raw (legacy compat)
            return rawResponse;
        }

        // Some TPAs' single API returns EVERY covered member's card in one array response
        // (e.g. Vidal Health: {"data":[{relationship,ecardUrl},...]}) instead of one call
        // returning one card. When configured, narrow rawResponse down to just the ONE element
        // matching the requested member's relation before the normal single-object extraction
        // below runs unchanged — REDIRECT_URL/etc. mappings then just work as they already do.
        if (appConfig?.ecardArrayResponseKey && appConfig?.ecardRelationMatchField) {
            // Direct traversal (not extractDotNotation, which stringifies objects/arrays —
            // we need the actual array here, not a JSON string of it).
            const arr = appConfig.ecardArrayResponseKey
                .split(".")
                .reduce((acc: any, key: string) => (acc === undefined || acc === null ? undefined : acc[key]), rawResponse);
            const requestedRelation = String(availableFields?.relation ?? "").trim().toLowerCase();
            const isSelf = !requestedRelation || requestedRelation === "self";
            if (Array.isArray(arr)) {
                const matched = arr.find((el) => {
                    const elRelation = String(el?.[appConfig.ecardRelationMatchField as string] ?? "").trim().toLowerCase();
                    return isSelf ? elRelation === "self" : elRelation === requestedRelation;
                });
                if (matched) {
                    this.logger.log({ level: "info", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "success", location: "ExternalAppService", method: "applyStep2Mappings", payload: { requestedRelation, matchedKeys: Object.keys(matched) }, messageData: "Matched member element from array e-card response" }) });
                    rawResponse = matched;
                } else {
                    this.logger.warn({ level: "warn", message: buildLogMessage({ traceId: this.traceIdService.traceId, status: "failure", location: "ExternalAppService", method: "applyStep2Mappings", payload: { requestedRelation, arrayLength: arr.length }, messageData: "No array element matched requested member's relation — falling back to raw response" }) });
                }
            }
        }

        // Merge mapped STANDARD_KEYs on top of the raw response instead of replacing it —
        // callers like the claims flow's assertNoTpaBusinessFailure/extractTpaClaimRef still
        // need the original fields (status, message, result, ...) for failure detection,
        // not just the one extracted claim reference.
        const normalised: Record<string, any> = {
            ...(typeof rawResponse === "object" && rawResponse !== null ? rawResponse : {}),
        };
        for (const m of step2Mappings) {
            const val = extractDotNotation(rawResponse, m.responseKey);
            normalised[m.outputKey] = val; // e.g. REDIRECT_URL, MEMBER_ID, MEMBER_NAME, TPA_CLAIM_REF
        }
        // If a DOWNLOAD_URL/REDIRECT_URL was resolved, fetch the file server-side right now and
        // hand back its bytes as BASE64_PDF in this same response — one network call from the
        // frontend's perspective instead of a follow-up proxy request. Server-to-server fetch
        // isn't subject to the browser CORS restriction some TPAs run into on their file host.
        // Best-effort: if the fetch fails (host not in the proxy allowlist, TPA down, etc.),
        // fall back silently to just the URL — the frontend still has that as a usable fallback.
        const fileUrl = normalised.DOWNLOAD_URL ?? normalised.REDIRECT_URL;
        if (typeof fileUrl === "string" && fileUrl && !normalised.BASE64_PDF) {
            try {
                const { buffer, contentType } = await this.proxyFile(fileUrl);
                if ((contentType || "").includes("pdf") || buffer.length > 0) {
                    normalised.BASE64_PDF = buffer.toString("base64");
                }
            } catch (err) {
                this.logger.warn({
                    level: "warn",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "failure",
                        location: "ExternalAppService",
                        method: "applyStep2Mappings",
                        payload: { fileUrl, error: err instanceof Error ? err.message : "unknown" },
                        messageData: "Server-side file fetch failed, leaving URL-only response for frontend fallback",
                    }),
                });
            }
        }
        return normalised;
    }
}
