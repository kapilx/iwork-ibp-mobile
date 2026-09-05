import { Injectable, HttpException } from '@nestjs/common';
import { FeatureFlagService } from '../config/feature-flag.service';
import { ENV } from '../environment';
import { AuthProtectionRepository } from './auth-protection.repository';

const DEFAULT_MAX_FAILED_ATTEMPTS = 5;
const DEFAULT_LOCKOUT_DURATION_MINUTES = 30;
const MILLISECONDS_PER_MINUTE = 1000 * 60;
const MINUTES_PER_HOUR = 60;
const HTTP_STATUS_LOCKED = 423;
const FAILURE_CATEGORY_ACCOUNT_LOCKED = 'ACCOUNT_LOCKED';
const FAILURE_CATEGORY_SUCCESS = 'SUCCESS';

export interface AuthAuditContext {
  identifier: string;
  userId?: number | string;
  authEndpoint: string;
  sourceIp: string;
  userAgent: string;
  failureCategory: string | null;
  featureContext: string;
  actingUserId?: number | string;
}

export interface AuthSuccessContext {
  identifier: string;
  userId?: number | string;
  authEndpoint: string;
  sourceIp: string;
  userAgent: string;
  featureContext: string;
  actingUserId?: number | string;
}

@Injectable()
export class AuthProtectionService {
  private readonly maxAttempts: number;
  private readonly lockoutDurationMinutes: number;

  constructor(
    private readonly repository: AuthProtectionRepository,
    private readonly featureFlagService: FeatureFlagService,
  ) {
    this.maxAttempts = parseInt(
      ENV.AUTH_MAX_FAILED_ATTEMPTS ?? String(DEFAULT_MAX_FAILED_ATTEMPTS),
      10,
    );
    this.lockoutDurationMinutes = parseInt(
      ENV.AUTH_LOCKOUT_DURATION_MINUTES ?? String(DEFAULT_LOCKOUT_DURATION_MINUTES),
      10,
    );
  }

  private formatRemainingTime(remainingMinutes: number): string {
    if (remainingMinutes < 1) {
      return '1 minute';
    }

    if (remainingMinutes < MINUTES_PER_HOUR) {
      const minutes = Math.ceil(remainingMinutes);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }

    const totalMinutes = Math.ceil(remainingMinutes);
    const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
    const minutes = totalMinutes % MINUTES_PER_HOUR;

    const hourText = `${hours} ${hours === 1 ? 'hour' : 'hours'}`;

    if (minutes === 0) {
      return hourText;
    }

    const minuteText = `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    return `${hourText} ${minuteText}`;
  }

  async checkAccountLockStatus(
    userId: number | string,
    auditContext?: Omit<AuthAuditContext, 'userId' | 'failureCategory'>,
  ): Promise<void> {
    if (!this.featureFlagService.isAuthFailureTrackingEnabled() || !userId) {
      return;
    }

    const userIdNum = typeof userId === 'string' ? parseInt(userId, 10) : userId;
    const lockState = await this.repository.findLockStateByUserId(userIdNum);

    if (!lockState) {
      return;
    }

    const now = new Date();

    if (lockState.lockedUntil && lockState.lockedUntil > now) {
      lockState.failedAttemptCount += 1;
      await this.repository.saveLockState(lockState);

      if (auditContext) {
        await this.recordAuditLog({
          ...auditContext,
          userId: userIdNum,
          failureCategory: FAILURE_CATEGORY_ACCOUNT_LOCKED,
        });
      }

      const remainingMinutes =
        (lockState.lockedUntil.getTime() - now.getTime()) / MILLISECONDS_PER_MINUTE;
      const formattedTime = this.formatRemainingTime(remainingMinutes);

      throw new HttpException(
        {
          statusCode: HTTP_STATUS_LOCKED,
          message: `Account temporarily locked due to multiple login attempts. Please try again after ${formattedTime}.`,
        },
        HTTP_STATUS_LOCKED,
      );
    }

    if (lockState.lockedUntil && lockState.lockedUntil <= now) {
      lockState.lockedUntil = null;
      lockState.failedAttemptCount = 0;
      await this.repository.saveLockState(lockState);
    }
  }

  async findUserIdByIdentifier(identifier: string): Promise<number | undefined> {
    return this.repository.findUserIdByIdentifier(identifier);
  }

  async recordAuditLog(context: AuthAuditContext): Promise<void> {
    if (!this.featureFlagService.isAuthFailureTrackingEnabled()) {
      return;
    }

    const userId = context.userId
      ? typeof context.userId === 'string'
        ? parseInt(context.userId, 10)
        : context.userId
      : undefined;

    const createdBy = context.actingUserId
      ? typeof context.actingUserId === 'string'
        ? parseInt(context.actingUserId, 10)
        : context.actingUserId
      : undefined;

    await this.repository.createAuditLog({
      identifier: context.identifier,
      userId,
      authEndpoint: context.authEndpoint,
      sourceIp: context.sourceIp,
      userAgent: context.userAgent,
      failureCategory: context.failureCategory,
      featureContext: context.featureContext,
      createdBy,
      updatedBy: createdBy,
    });
  }

  async handleFailedAttempt(context: AuthAuditContext): Promise<void> {
    await this.recordAuditLog(context);

    if (!this.featureFlagService.isAuthFailureTrackingEnabled() || !context.userId) {
      return;
    }

    const userIdNum =
      typeof context.userId === 'string'
        ? parseInt(context.userId, 10)
        : context.userId;
    const actingUserIdNum = context.actingUserId
      ? typeof context.actingUserId === 'string'
        ? parseInt(context.actingUserId, 10)
        : context.actingUserId
      : undefined;

    let lockState = await this.repository.findLockStateByUserId(userIdNum);

    if (!lockState) {
      lockState = this.repository.createLockState({
        userId: userIdNum,
        failedAttemptCount: 0,
        createdBy: actingUserIdNum,
      });
    }

    if (!lockState) {
      throw new Error('Failed to create or retrieve lock state');
    }

    lockState.failedAttemptCount += 1;
    lockState.lastFailureAt = new Date();
    lockState.updatedBy = actingUserIdNum;

    if (lockState.failedAttemptCount >= this.maxAttempts) {
      const lockoutUntil = new Date();
      lockoutUntil.setMinutes(
        lockoutUntil.getMinutes() + this.lockoutDurationMinutes,
      );
      lockState.lockedUntil = lockoutUntil;
    }

    await this.repository.saveLockState(lockState);
  }

  async handleSuccessfulAttempt(context: AuthSuccessContext): Promise<void> {
    await this.recordAuditLog({
      ...context,
      failureCategory: FAILURE_CATEGORY_SUCCESS,
    });

    if (!this.featureFlagService.isAuthFailureTrackingEnabled() || !context.userId) {
      return;
    }

    const userIdNum =
      typeof context.userId === 'string'
        ? parseInt(context.userId, 10)
        : context.userId;
    const actingUserIdNum = context.actingUserId
      ? typeof context.actingUserId === 'string'
        ? parseInt(context.actingUserId, 10)
        : context.actingUserId
      : undefined;

    const lockState = await this.repository.findLockStateByUserId(userIdNum);

    if (lockState) {
      lockState.failedAttemptCount = 0;
      lockState.lockedUntil = null;
      lockState.updatedBy = actingUserIdNum;
      await this.repository.saveLockState(lockState);
    }
  }

  getLockoutConfig() {
    return {
      maxAttempts: this.maxAttempts,
      lockoutDurationMinutes: this.lockoutDurationMinutes,
    };
  }
}
