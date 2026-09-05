import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError, from } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
import { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import {
  AuthProtectionService,
  AuthAuditContext,
} from './auth-protection.service';
import { AUTH_PROTECTED_KEY } from './auth-protected.decorator';

/**
 * Authentication Protection Interceptor
 * 
 * Intercepts requests to @AuthProtected() endpoints to:
 * - Pre-check account lock status before processing authentication
 * - Track all authentication attempts (success and failure)
 * - Record detailed audit logs with IP, user agent, and failure categories
 * - Manage failure counters and automatic account lockout
 * - Extract user identifiers from multiple possible request fields
 */
@Injectable()
export class AuthProtectionInterceptor implements NestInterceptor {
  /**
   * Configuration: HTTP Status Codes
   */
  private readonly STATUS_CODES = {
    LOCKED: 423,
    FORBIDDEN: 403,
  } as const;

  /**
   * Configuration: Failure Category Keywords
   * Keywords used to categorize authentication failures
   */
  private readonly FAILURE_KEYWORDS = {
    ACCOUNT_LOCKED: ['locked'],
    USER_NOT_FOUND: ['not found', 'does not exist'],
    INVALID_CREDENTIALS: ['invalid', 'incorrect', 'wrong', 'credential'],
    FORBIDDEN: ['forbidden'],
    ACCOUNT_DISABLED: ['disabled', 'inactive'],
  } as const;

  /**
   * Configuration: Failure Category Names
   */
  private readonly FAILURE_CATEGORIES = {
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
    AUTHENTICATION_FAILURE: 'AUTHENTICATION_FAILURE',
  } as const;

  constructor(
    private readonly reflector: Reflector,
    private readonly authProtectionService: AuthProtectionService,
    private readonly jwtService: JwtService,
  ) { }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const isAuthProtected = this.reflector.get<boolean>(
      AUTH_PROTECTED_KEY,
      context.getHandler(),
    );

    if (!isAuthProtected) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const auditContext = this.extractAuditContext(request);

    const userIdFromLookup =
      await this.authProtectionService.findUserIdByIdentifier(
        auditContext.identifier,
      );

    if (userIdFromLookup) {
      await this.authProtectionService.checkAccountLockStatus(
        userIdFromLookup,
        auditContext,
      );
    }

    return next.handle().pipe(
      mergeMap(async (data) => {
        const isResponseObject =
          data?.statusCode !== undefined && typeof data?.json === 'function';

        if (isResponseObject && data.statusCode >= 400) {
          const error = new Error(
            data.statusMessage || 'Authentication failed',
          );
          (error as any).status = data.statusCode;
          (error as any).message = data.statusMessage || data.message;

          const failureCategory = this.determineFailureCategory(error);

          await this.authProtectionService.handleFailedAttempt({
            ...auditContext,
            userId: userIdFromLookup,
            failureCategory,
          });
          return data;
        }

        const userId = isResponseObject
          ? userIdFromLookup
          : this.extractUserIdFromResponse(data) || userIdFromLookup;

        await this.authProtectionService.handleSuccessfulAttempt({
          ...auditContext,
          userId,
        });

        return data;
      }),
      catchError((error) => {
        const failureCategory = this.determineFailureCategory(error);
        const userId = failureCategory !== 'USER_NOT_FOUND' ? userIdFromLookup : undefined;

        return from(
          this.authProtectionService.handleFailedAttempt({
            ...auditContext,
            userId,
            failureCategory,
          })
        ).pipe(
          mergeMap(() => throwError(() => error))
        );
      }),
    );
  }

  private extractAuditContext(request: Request): Omit<AuthAuditContext, 'userId' | 'failureCategory'> {
    const body = request.body || {};
    const identifier = body.userName ||
      body.username ||
      body.email ||
      body.emailId ||
      body.mobile ||
      body.phone ||
      body.loginName ||
      body.identifier ||
      'unknown';
    const featureContext = this.extractFeatureContext(request.path);

    let sourceIp = 'unknown';
    const xForwardedFor = request.headers['x-forwarded-for'] as string;
    const xRealIp = request.headers['x-real-ip'] as string;

    if (xForwardedFor) {
      sourceIp = xForwardedFor.split(',')[0].trim();
    } else if (xRealIp) {
      sourceIp = xRealIp.trim();
    } else if (request.ip) {
      sourceIp = request.ip.replace('::ffff:', '');
    } else if (request.socket?.remoteAddress) {
      sourceIp = request.socket.remoteAddress.replace('::ffff:', '');
    }

    const userAgent = request.headers['user-agent'] || 'unknown';

    return {
      identifier,
      authEndpoint: request.path,
      sourceIp,
      userAgent,
      featureContext,
    };
  }

  /**
   * Determines the feature context (IBP vs IWORK) based on the request path
   */
  private extractFeatureContext(path: string): string {
    const lowerPath = path.toLowerCase();

    if (
      lowerPath.includes('/company-employee/') ||
      lowerPath.includes('/ibp-service/') ||
      lowerPath.includes('/employee-login')
    ) {
      return 'IBP';
    }

    if (
      lowerPath.includes('/login') ||
      lowerPath.includes('/auth-service/') ||
      lowerPath.includes('/user/')
    ) {
      return 'IWORK';
    }

    return 'UNKNOWN';
  }

  /**
   * Extracts userId from successful authentication response
   * Tries multiple strategies:
   * 1. Decode JWT token from response
   * 2. Extract from response data structure
   */
  private extractUserIdFromResponse(data: any): number | undefined {
    try {
      const accessToken = data?.data?.accessToken || data?.accessToken;

      if (accessToken) {
        try {
          const decoded = this.jwtService.decode(accessToken) as any;
          const userId =
            decoded?.userDetails?.userId || decoded?.userId || decoded?.sub;

          if (userId) {
            return Number(userId);
          }
        } catch (jwtError) {
          // Continue to next strategy
        }
      }

      if (data?.user?.userId) return Number(data.user.userId);
      if (data?.userId) return Number(data.userId);
      if (data?.data?.user?.userId) return Number(data.data.user.userId);
      if (data?.data?.userId) return Number(data.data.userId);
    } catch (error) {
      // Extraction failed
    }

    return undefined;
  }

  /**
   * Categorizes authentication failures for audit logging
   */
  private determineFailureCategory(error: any): string {
    const customMessage = error?.response?.message?.toLowerCase() || '';
    const message =
      error?.message?.toLowerCase() || error?.statusMessage?.toLowerCase() || '';
    const status = error?.status || error?.statusCode;

    const fullMessage = `${customMessage} ${message}`.toLowerCase();

    // Check for ACCOUNT_LOCKED
    if (status === this.STATUS_CODES.LOCKED &&
      this.FAILURE_KEYWORDS.ACCOUNT_LOCKED.some(keyword => fullMessage.includes(keyword))) {
      return this.FAILURE_CATEGORIES.ACCOUNT_LOCKED;
    }

    // Check for USER_NOT_FOUND
    if (this.FAILURE_KEYWORDS.USER_NOT_FOUND.some(keyword => fullMessage.includes(keyword))) {
      return this.FAILURE_CATEGORIES.USER_NOT_FOUND;
    }

    // Check for INVALID_CREDENTIALS
    if (this.FAILURE_KEYWORDS.INVALID_CREDENTIALS.some(keyword => fullMessage.includes(keyword)) ||
      (status === this.STATUS_CODES.FORBIDDEN &&
        this.FAILURE_KEYWORDS.FORBIDDEN.some(keyword => fullMessage.includes(keyword)))) {
      return this.FAILURE_CATEGORIES.INVALID_CREDENTIALS;
    }

    // Check for ACCOUNT_DISABLED
    if (this.FAILURE_KEYWORDS.ACCOUNT_DISABLED.some(keyword => fullMessage.includes(keyword))) {
      return this.FAILURE_CATEGORIES.ACCOUNT_DISABLED;
    }

    return this.FAILURE_CATEGORIES.AUTHENTICATION_FAILURE;
  }
}
