import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import * as crypto from "crypto";
import axios from "axios";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { FieldEncryptionService } from "../../../../service-lib/src/lib/field-encryption";
import { CompanyZohoIntegration } from "../../../../service-lib/src/lib/entities/company-zoho-integration.entity";
import { ZohoIntegrationRepository } from "./zoho-integration.repository";
import { ZohoPeopleApiService, ZohoEmployee } from "./zoho-people-api.service";
import { ZohoSyncResultDto } from "./dto/zoho-sync-result.dto";
import { ZohoStatusDto } from "./dto/zoho-status.dto";

// In-memory state store for OAuth2 CSRF protection.
// Replace with Redis for multi-instance deployments.
const oauthStateStore = new Map<string, { companyId: number; expiresAt: number; frontendOrigin?: string }>();

@Injectable()
export class ZohoIntegrationService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly scope: string;

  constructor(
    private readonly zohoRepo: ZohoIntegrationRepository,
    private readonly zohoApiService: ZohoPeopleApiService,
    private readonly encryptionService: FieldEncryptionService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.IBP_SERVICE);
    this.clientId = ENV.ZOHO_CLIENT_ID ?? "";
    this.clientSecret = ENV.ZOHO_CLIENT_SECRET ?? "";
    this.redirectUri = ENV.ZOHO_REDIRECT_URI ?? "";
    this.scope = ENV.ZOHO_SCOPE ?? "ZohoPeople.people.READ";
  }

  // ─── OAuth2 Connect ─────────────────────────────────────────────────────

  buildAuthUrl(companyId: number, frontendOrigin?: string): string {
    if (!this.clientId) throw new BadRequestException("ZOHO_CLIENT_ID is not configured");

    const state = crypto.randomBytes(16).toString("hex");
    oauthStateStore.set(state, { companyId, expiresAt: Date.now() + 10 * 60 * 1000, frontendOrigin });

    const accountsUrl = ENV.ZOHO_ACCOUNTS_URL ?? "https://accounts.zoho.in";
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      scope: this.scope,
      redirect_uri: this.redirectUri,
      access_type: "offline",
      state,
    });

    return `${accountsUrl}/oauth/v2/auth?${params.toString()}`;
  }

  async handleCallback(code: string, state: string, createdBy: number): Promise<{ companyId: number; frontendOrigin?: string }> {
    const stored = oauthStateStore.get(state);
    if (!stored || stored.expiresAt < Date.now()) {
      throw new BadRequestException("Invalid or expired OAuth state. Please try connecting again.");
    }
    oauthStateStore.delete(state);

    const { companyId, frontendOrigin } = stored;

    // Exchange code for tokens
    const accountsUrl = ENV.ZOHO_ACCOUNTS_URL ?? "https://accounts.zoho.in";
    const tokenResponse = await axios.post(
      `${accountsUrl}/oauth/v2/token`,
      null,
      {
        params: {
          grant_type: "authorization_code",
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          code,
        },
        timeout: 15_000,
      },
    );

    const tokenData = tokenResponse.data;

    // Zoho returns { error: "..." } on failure instead of a non-2xx status
    if (tokenData?.error) {
      throw new BadRequestException(
        `Zoho token exchange error: ${tokenData.error} — ${tokenData.error_description ?? "check client ID, secret, redirect URI and scope"}`,
      );
    }

    const { access_token, refresh_token, expires_in, api_domain } = tokenData;

    if (!access_token) {
      throw new BadRequestException(
        `Zoho token exchange failed — response: ${JSON.stringify(tokenData)}`,
      );
    }

    const tokenExpiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000);
    const zohoDomain = (api_domain ?? "").replace(/^https?:\/\//, "").split("/")[0] || "zoho.in";

    // refresh_token is only returned on first authorization; subsequent re-authorizations
    // omit it. Load the existing one from DB so we don't overwrite it with null.
    let finalRefreshToken = refresh_token
      ? this.encryptionService.encrypt(refresh_token)
      : undefined;

    if (!finalRefreshToken) {
      const existing = await this.zohoRepo.findByCompanyId(companyId);
      finalRefreshToken = existing?.refreshToken ?? undefined;
    }

    await this.zohoRepo.upsertTokens(
      companyId,
      {
        accessToken: this.encryptionService.encrypt(access_token),
        refreshToken: finalRefreshToken,
        tokenExpiresAt,
        scopes: this.scope.split(","),
        zohoDomain,
      },
      createdBy,
    );

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "ZohoIntegrationService",
        method: "handleCallback",
        messageData: `Zoho connected for company ${companyId}`,
      }),
    });

    return { companyId, frontendOrigin };
  }

  // ─── Status ─────────────────────────────────────────────────────────────

  async getStatus(companyId: number): Promise<ZohoStatusDto> {
    const record = await this.zohoRepo.findByCompanyId(companyId);
    if (!record) return { connected: false };

    return {
      connected: true,
      zohoDomain: record.zohoDomain,
      zohoOrganizationId: record.zohoOrganizationId,
      lastSyncedAt: record.lastSyncedAt,
      lastSyncStats: record.lastSyncStats as any,
    };
  }

  // ─── Sync ────────────────────────────────────────────────────────────────

  // Returns employee data for preview — does NOT write to DB.
  async syncEmployees(companyId: number, triggeredBy: number): Promise<ZohoSyncResultDto> {
    const startMs = Date.now();
    const record = await this.zohoRepo.findByCompanyId(companyId);
    if (!record) throw new NotFoundException("Zoho is not connected for this company. Connect first from Settings → Integrations.");

    let employees: ZohoEmployee[];

    try {
      const accessToken = await this.getValidAccessToken(record);
      employees = await this.zohoApiService.getAllEmployees(accessToken);
    } catch (err: any) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ZohoIntegrationService",
          method: "syncEmployees",
          messageData: `Zoho API call failed: ${err?.message}`,
        }),
      });
      throw new BadRequestException(
        `Failed to fetch employees from Zoho: ${err?.message ?? "unknown error"}. Please try again, or reconnect from Settings → Integrations if the problem persists.`,
      );
    }

    return {
      synced: employees.length,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [],
      durationMs: Date.now() - startMs,
      employees,
    };
  }

  // ─── Token refresh ───────────────────────────────────────────────────────

  private async getValidAccessToken(record: CompanyZohoIntegration): Promise<string> {
    const isExpiringSoon = record.tokenExpiresAt
      ? record.tokenExpiresAt.getTime() - Date.now() < 5 * 60 * 1000
      : true;

    if (!isExpiringSoon && record.accessToken) {
      return this.encryptionService.decrypt(record.accessToken);
    }

    if (!record.refreshToken) {
      throw new BadRequestException("Zoho refresh token missing. Please reconnect from Settings → Integrations.");
    }

    const accountsUrl = ENV.ZOHO_ACCOUNTS_URL ?? "https://accounts.zoho.in";
    const response = await axios.post(
      `${accountsUrl}/oauth/v2/token`,
      null,
      {
        params: {
          grant_type: "refresh_token",
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.encryptionService.decrypt(record.refreshToken),
        },
        timeout: 15_000,
      },
    );

    const { access_token, expires_in } = response.data;
    if (!access_token) throw new BadRequestException("Zoho token refresh failed");

    const tokenExpiresAt = new Date(Date.now() + (expires_in ?? 3600) * 1000);
    await this.zohoRepo.updateAccessToken(
      record.companyId,
      this.encryptionService.encrypt(access_token),
      tokenExpiresAt,
    );

    return access_token;
  }

  // ─── Disconnect ──────────────────────────────────────────────────────────

  async disconnect(companyId: number, updatedBy: number): Promise<void> {
    const record = await this.zohoRepo.findByCompanyId(companyId);
    if (!record) return;

    // Best-effort: revoke token with Zoho
    try {
      const accountsUrl = ENV.ZOHO_ACCOUNTS_URL ?? "https://accounts.zoho.in";
      await axios.post(`${accountsUrl}/oauth/v2/token/revoke`, null, {
        params: { token: this.encryptionService.decrypt(record.refreshToken!) },
        timeout: 10_000,
      });
    } catch {
      // Revocation failure doesn't block disconnect on our side
    }

    await this.zohoRepo.deactivate(companyId, updatedBy);
  }

  // ─── Portal URL ──────────────────────────────────────────────────────────

  async getPortalUrl(companyId: number): Promise<string> {
    const record = await this.zohoRepo.findByCompanyId(companyId);
    if (!record) throw new NotFoundException("Zoho is not connected for this company.");

    // Portal is always people.zoho.in for India DC.
    // zohoDomain stores the api_domain subdomain (e.g. www.zohoapis.in) which is
    // not the same as the portal domain, so we derive it from ZOHO_ACCOUNTS_URL instead.
    const accountsUrl = ENV.ZOHO_ACCOUNTS_URL ?? "https://accounts.zoho.in";
    const tld = accountsUrl.replace(/^https?:\/\/accounts\./, ""); // "zoho.in"
    return `https://people.${tld}`;
  }
}
