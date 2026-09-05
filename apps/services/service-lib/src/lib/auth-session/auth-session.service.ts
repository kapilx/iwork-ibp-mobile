import { Injectable } from "@nestjs/common";
import Redis from "ioredis";
import { randomUUID } from "crypto";
import { ENV } from "../environment";
import { createLogger } from "../logger";
import { TraceIdService } from "../trace-id.service";
import { buildLogMessage } from "../utils/logger.util";
import { createRedisClient } from "../utils/redis.util";

export const SESSION_REVOKED_CODE = "SESSION_REVOKED";
export const SESSION_INVALID_CODE = "SESSION_INVALID";

export interface ActiveSessionRecord {
  sessionId: string;
  clientScopeId: string;
  issuedAt: string;
  expiresAt: string;
}

export interface SessionEstablishResult {
  sessionId: string;
  sameScope: boolean;
  revokedSessionId?: string;
  checksSkipped: boolean;
  blockedByActiveSession?: boolean;
}

export interface SessionValidationResult {
  valid: boolean;
  code?: string;
  message?: string;
  checksSkipped: boolean;
}

const parseDurationSeconds = (value?: string | number | null): number | null => {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const numeric = Number(trimmed);
  if (Number.isFinite(numeric)) {
    return numeric;
  }
  const match = trimmed.match(/^(\d+)\s*([smhd])$/i);
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return amount * (multipliers[unit] ?? 1);
};

const resolveAccessTokenExpiry = (): string => {
  const minutes = Number(ENV.SESSION_TIMEOUT_MINUTES);
  if (!Number.isNaN(minutes) && minutes > 0) {
    return `${minutes}m`;
  }
  return (ENV.JWT_EXPIRATION as string) || "4h";
};


@Injectable()
export class AuthSessionService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly redis: Redis | null;
  private readonly accessTokenTtlSeconds: number;
  private readonly sessionTtlSeconds: number;
  private warnedRedisUnavailable = false;
  // Feature-flag gate to preserve existing behavior when disabled.
  private readonly singleSessionEnabled =
    (ENV.IWORK_SINGLE_SESSION || "").toLowerCase() === "true";

  constructor(private readonly traceIdService: TraceIdService) {
    this.logger = createLogger(this.traceIdService);
    // Only create Redis client when single-session is enabled.
    this.redis = this.singleSessionEnabled
      ? createRedisClient({
          logger: this.logger,
          traceId: this.traceIdService.traceId,
          location: "AuthSessionService",
          method: "constructor",
        })
      : null;

    const accessTtl =
      parseDurationSeconds(resolveAccessTokenExpiry()) ?? 4 * 60 * 60;
    // Session TTL uses SESSION_TIMEOUT_MINUTES (not refresh token expiry).
    const sessionMinutes = Number(ENV.SESSION_TIMEOUT_MINUTES);
    const refreshTtl =
      Number.isFinite(sessionMinutes) && sessionMinutes > 0
        ? sessionMinutes * 60
        : accessTtl;

    this.accessTokenTtlSeconds = accessTtl;
    this.sessionTtlSeconds = refreshTtl;
  }

  private activeSessionKey(userId: number): string {
    // Hash tag {userId} ensures Redis Cluster routes this key to the slot for userId.
    return `auth:{${userId}}:activeSession`;
  }

  private revokedSessionKey(sessionId: string, userId: number): string {
    // Same hash tag {userId} forces this key onto the same cluster slot as activeSessionKey.
    // This is required for WATCH/MULTI/EXEC to work across both keys in Redis Cluster.
    return `auth:{${userId}}:revokedSession:${sessionId}`;
  }

  private isRedisReady(): boolean {
    if (!this.redis) return false;
    return this.redis.status === "ready";
  }

  private logRedisUnavailable(reason: string): void {
    if (this.warnedRedisUnavailable) return;
    this.warnedRedisUnavailable = true;
    this.logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "failure",
        location: "AuthSessionService",
        method: "logRedisUnavailable",
        messageData: `Redis unavailable for session checks (${reason}). Allowing request to proceed.`,
      }),
    });
  }

  async establishSession(
    userId: number,
    clientScopeId: string | null | undefined,
    forceLogin?: boolean
  ): Promise<SessionEstablishResult> {
    if (!this.singleSessionEnabled) {
      return {
        sessionId: randomUUID(),
        sameScope: false,
        checksSkipped: true,
      };
    }
    if (!this.isRedisReady()) {
      this.logRedisUnavailable("establishSession");
      return {
        sessionId: randomUUID(),
        sameScope: false,
        checksSkipped: true,
      };
    }

    const activeKey = this.activeSessionKey(userId);
    const incomingScope = clientScopeId ?? "";
    let attempts = 0;

    while (attempts < 3) {
      attempts += 1;
      await this.redis!.watch(activeKey);
      const existingRaw = await this.redis!.get(activeKey);
      const existing: ActiveSessionRecord | null = existingRaw
        ? JSON.parse(existingRaw)
        : null;
      const hasExisting = Boolean(existing?.sessionId);
      if (hasExisting && !forceLogin) {
        this.logger.warn({
          level: "warn",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "AuthSessionService",
            method: "establishSession",
            payload: {
              userId,
              clientScopeId: incomingScope,
              existingSessionId: existing?.sessionId,
            },
            messageData: "Active session already exists; blocking login",
          }),
        });
        await this.redis!.unwatch();
        return {
          sessionId: existing!.sessionId,
          sameScope: false,
          checksSkipped: false,
          blockedByActiveSession: true,
        };
      }
      
      // Determine whether this login is coming from the same browser scope.
      // sameScope = true means the same browser window/tab is logging in again (e.g. token refresh or re-login).
      // sameScope = false means a different browser or tab is attempting login.
      const sameScope = existing?.clientScopeId === incomingScope;

      // Always generate a fresh session ID when:
      //   - forceLogin is true (user chose to proceed from browser 2, kicking out browser 1), or
      //   - the login is coming from a different scope (different browser/tab).
      // Reuse the existing session ID only when the same browser re-authenticates.
      const sessionId = (forceLogin || !sameScope) ? randomUUID() : (existing?.sessionId || randomUUID());
      const now = new Date();
      const newRecord: ActiveSessionRecord = {
        sessionId,
        clientScopeId: incomingScope,
        issuedAt: now.toISOString(),
        expiresAt: new Date(
          now.getTime() + this.sessionTtlSeconds * 1000
        ).toISOString(),
      };

      const multi = this.redis!.multi();
      // Mark the old session as revoked when the incoming login is from a different browser scope
      // OR when the user explicitly forced login (clicked Proceed in browser 2).
      // This makes browser 1's existing JWT invalid — its next request will receive SESSION_REVOKED.
      if (existing?.sessionId && (!sameScope || forceLogin)) {
        multi.set(
          this.revokedSessionKey(existing.sessionId, userId),
          "1",
          "EX",
          this.accessTokenTtlSeconds
        );
      }
      // Store the new session as the only active session for this user.
      multi.set(activeKey, JSON.stringify(newRecord), "EX", this.sessionTtlSeconds);

      const execResult = await multi.exec();
      if (execResult) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "AuthSessionService",
            method: "establishSession",
            payload: {
              userId,
              clientScopeId: incomingScope,
              sessionId,
            },
            messageData: "Active session established",
          }),
        });
        return {
          sessionId,
          sameScope,
          revokedSessionId: existing?.sessionId && (!sameScope || forceLogin)
            ? existing.sessionId
            : undefined,
          checksSkipped: false,
        };
      }
    }

    this.logger.warn({
      level: "warn",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "failure",
        location: "AuthSessionService",
        method: "establishSession",
        payload: { userId },
        messageData: "Failed to establish session after retries",
      }),
    });
    return {
      sessionId: randomUUID(),
      sameScope: false,
      checksSkipped: true,
    };
  }

  async validateSession(
    userId: number,
    sessionId: string | null | undefined
  ): Promise<SessionValidationResult> {
    if (!this.singleSessionEnabled) {
      return { valid: true, checksSkipped: true };
    }
    if (!this.isRedisReady()) {
      this.logRedisUnavailable("validateSession");
      return { valid: true, checksSkipped: true };
    }

    if (!sessionId) {
      return {
        valid: false,
        code: SESSION_INVALID_CODE,
        message: "Session is missing.",
        checksSkipped: false,
      };
    }

    const revoked = await this.redis!.get(this.revokedSessionKey(sessionId, userId));
    if (revoked) {
      return {
        valid: false,
        code: SESSION_REVOKED_CODE,
        message: "Session ended due to a new login.",
        checksSkipped: false,
      };
    }

    const activeRaw = await this.redis!.get(this.activeSessionKey(userId));
    if (!activeRaw) {
      return {
        valid: false,
        code: SESSION_INVALID_CODE,
        message: "Active session not found.",
        checksSkipped: false,
      };
    }

    const active: ActiveSessionRecord = JSON.parse(activeRaw);
    if (active.sessionId !== sessionId) {
      return {
        valid: false,
        code: SESSION_REVOKED_CODE,
        message: "Session ended due to a new login.",
        checksSkipped: false,
      };
    }

    return { valid: true, checksSkipped: false };
  }

  async revokeSession(sessionId: string, userId: number): Promise<void> {
    if (!this.singleSessionEnabled) {
      return;
    }
    if (!this.isRedisReady()) {
      this.logRedisUnavailable("revokeSession");
      return;
    }
    await this.redis!.set(
      this.revokedSessionKey(sessionId, userId),
      "1",
      "EX",
      this.accessTokenTtlSeconds
    );
  }

  async logoutSession(userId: number, sessionId: string | null | undefined): Promise<void> {
    if (!this.singleSessionEnabled) {
      return;
    }
    if (!this.isRedisReady()) {
      this.logRedisUnavailable("logoutSession");
      return;
    }
    if (!sessionId) return;

    const activeKey = this.activeSessionKey(userId);
    let attempts = 0;

    while (attempts < 3) {
      attempts += 1;
      await this.redis!.watch(activeKey);
      const existingRaw = await this.redis!.get(activeKey);
      const existing: ActiveSessionRecord | null = existingRaw
        ? JSON.parse(existingRaw)
        : null;
      if (!existing || existing.sessionId !== sessionId) {
        await this.redis!.unwatch();
        return;
      }
      const multi = this.redis!.multi();
      multi.set(
        this.revokedSessionKey(sessionId, userId),
        "1",
        "EX",
        this.accessTokenTtlSeconds
      );
      multi.del(activeKey);
      const execResult = await multi.exec();
      if (execResult) {
        return;
      }
    }
  }

  async clearActiveSession(userId: number): Promise<void> {
    if (!this.singleSessionEnabled) {
      return;
    }
    if (!this.isRedisReady()) {
      this.logRedisUnavailable("clearActiveSession");
      return;
    }
    await this.redis!.del(this.activeSessionKey(userId));
  }

  getAccessTokenTtlSeconds(): number {
    return this.accessTokenTtlSeconds;
  }

  getSessionTtlSeconds(): number {
    return this.sessionTtlSeconds;
  }
}
