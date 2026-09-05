import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { IbpEmployeeAuthRepository, IbpEmployeeAuthResult } from '../ibp-employee-auth/ibp-employee-auth.repository';
import { JwtService } from '@nestjs/jwt';
import { ENV } from '../../../../service-lib/src/lib/environment';
import { getAccessTokenExpiry } from '../token.constants';
import type Redis from 'ioredis';
import {
    NOTIFICATION_EMAIL,
    NOTIFICATION_EVENT_TYPES,
    EMAIL_OTP_KEY_1,
    EMAIL_OTP_KEY_2,
    EMAIL_OTP_SCENARIOS,
    serviceNames,
    NOTIFICATION_SKIP_STATUS
} from '../../../../service-lib/src/lib/constants';
import { USER_STATUS_DELETED } from '../../../../../../libs/service-lib/src/lib/constants';
import axios from 'axios';
import {
  CompanyAuthenticationConfig,
  ConfigCompany,
} from '../../../../service-lib/src/lib/entities';
import { CompanyPortalConfigScope } from '../../../../service-lib/src/lib/entities/company-portal-config-scope.entity';
import { PolicyEnrollmentEmployeePolicyMap } from '../../../../service-lib/src/lib/entities/policy-enrollment-employee-policy-map.entity';
import { HrUserManagement } from '../../../../service-lib/src/lib/entities/hr-user-management.entity';
import { Role } from '../../../../service-lib/src/lib/entities/roles.entity';
import { errorMessages } from '../../../../../../libs/service-lib/src/lib/messages';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { createRedisClient } from '../../../../service-lib/src/lib/utils/redis.util';

interface OTPStore {
  otp: string;
  email: string;
  expiresAt: Date;
  attempts: number;
  retryLimit: number;
}

interface OTPSettings {
  expiryMinutes: number;
  retryLimit: number;
  resendCooldownSeconds: number;
}

type EmailOTPScenario = typeof EMAIL_OTP_SCENARIOS[keyof typeof EMAIL_OTP_SCENARIOS];

@Injectable()
export class EmailOtpService {
  private readonly logger = new Logger(EmailOtpService.name);
  private otpStore: Map<string, OTPStore> = new Map();
  private redis: Redis | null = null;
  private readonly DEFAULT_RETRY_LIMIT = 5;
  private readonly DEFAULT_OTP_EXPIRY_MINUTES = 5;
  private readonly DEFAULT_RESEND_COOLDOWN_SECONDS = 60;
  private readonly notificationServiceUrl: string;
  private readonly frontendIbpUrl: string;

  constructor(
    private readonly ibpEmployeeAuthRepository: IbpEmployeeAuthRepository,
    private readonly jwtService: JwtService,
    private readonly traceIdService: TraceIdService,
    @InjectRepository(CompanyAuthenticationConfig)
    private readonly companyAuthenticationConfigRepository: Repository<CompanyAuthenticationConfig>,
    @InjectRepository(ConfigCompany)
    private readonly configCompanyRepository: Repository<ConfigCompany>,
    @InjectRepository(HrUserManagement)
    private readonly hrUserManagementRepository: Repository<HrUserManagement>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(CompanyPortalConfigScope)
    private readonly configScopeRepository: Repository<CompanyPortalConfigScope>,
    @InjectRepository(PolicyEnrollmentEmployeePolicyMap)
    private readonly policyEnrollmentEmployeePolicyMapRepository: Repository<PolicyEnrollmentEmployeePolicyMap>,
  ) {
    // Get notification service URL from environment
    this.notificationServiceUrl = ENV.URL_NOTIFICATION_SERVICE || 'http://localhost:3015';
    this.frontendIbpUrl = (ENV.FRONTEND_IBP_URL || 'http://localhost:4201').replace(
      /\/+$/,
      '',
    );
    this.logger.log(`Email OTP service initialized. Notification service URL: ${this.notificationServiceUrl}`);

    // Use shared Redis util (same pattern as other services).
    const appLogger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
    this.redis = createRedisClient({
      logger: appLogger,
      traceId: this.traceIdService.traceId ?? 'no-trace',
      location: EmailOtpService.name,
      method: 'constructor',
    });
  }

  private normalizeDomain(domain?: string | null): string {
    return String(domain ?? '')
      .trim()
      .toLowerCase();
  }

  private getEmailOtpKey(email: string, domain?: string | null): string {
    const normalizedEmail = String(email ?? '').trim().toLowerCase();
    const normalizedDomain = this.normalizeDomain(domain);
    // Include domain to avoid collisions for the same email across different tenants.
    return `auth:otp:email:${normalizedDomain || 'unknown'}:${normalizedEmail}`;
  }

  private async setOtpRecordRedis(
    key: string,
    record: OTPStore,
  ): Promise<void> {
    if (!this.redis) return;
    const ttlSeconds = Math.max(
      1,
      Math.ceil((record.expiresAt.getTime() - Date.now()) / 1000),
    );
    // Hash fields allow atomic attempt increments.
    await this.redis.hset(key, {
      otp: record.otp,
      email: record.email,
      expiresAtMs: String(record.expiresAt.getTime()),
      attempts: String(record.attempts),
      retryLimit: String(record.retryLimit),
    });
    await this.redis.expire(key, ttlSeconds);
  }

  private async getOtpRecordRedis(key: string): Promise<OTPStore | null> {
    if (!this.redis) return null;
    const [otp, email, expiresAtMs, attempts, retryLimit] = await this.redis.hmget(
      key,
      'otp',
      'email',
      'expiresAtMs',
      'attempts',
      'retryLimit',
    );
    if (!otp || !email || !expiresAtMs) {
      return null;
    }
    const expiresAt = new Date(Number(expiresAtMs));
    const parsedAttempts = Number(attempts ?? 0) || 0;
    const parsedRetryLimit = Number(retryLimit ?? this.DEFAULT_RETRY_LIMIT) || this.DEFAULT_RETRY_LIMIT;
    return {
      otp,
      email,
      expiresAt,
      attempts: parsedAttempts,
      retryLimit: parsedRetryLimit,
    };
  }

  private async incrOtpAttemptsRedis(key: string): Promise<number | null> {
    if (!this.redis) return null;
    const updated = await this.redis.hincrby(key, 'attempts', 1);
    return Number(updated);
  }

  private async deleteOtpRecordRedis(key: string): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(key);
  }

  private buildIbpPublicAssetUrl(fileName?: string | null): string | undefined {
    const normalizedFileName = (fileName ?? '').trim().replace(/^\/+/, '');
    if (!normalizedFileName) {
      return undefined;
    }
    return `${this.frontendIbpUrl}/static-images/${normalizedFileName}`;
  }

  private dedupeRepeatedNameParts(name?: string | null): string | undefined {
    const normalizedName = (name ?? '').trim().replace(/\s+/g, ' ');
    if (!normalizedName) {
      return undefined;
    }

    const parts = normalizedName.split(' ');
    if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
      return parts[0];
    }

    return normalizedName;
  }

  private buildDisplayName(user: any, email: string): string {
    const firstName = (user?.firstName ?? '').trim();
    const lastName = (user?.lastName ?? '').trim();

    if (firstName && lastName) {
      return `${firstName} ${lastName}`.trim();
    }

    if (firstName) {
      return firstName;
    }

    if (lastName) {
      return lastName;
    }

    return (
      this.dedupeRepeatedNameParts(user?.employeeName) ||
      this.dedupeRepeatedNameParts(user?.salutation) ||
      email.split('@')[0]
    );
  }

  private async resolveOtpSettings(
    companyId: number | null,
    methodCode: string,
    scenario?: string,
    passwordMethodCode?: string,
  ): Promise<OTPSettings> {
    // For 2FA and enrollment verification scenarios, read expiry from passwordConfig.twoFactorAuthentication
    if ((scenario === 'TWO_FACTOR_AUTH' || scenario === 'ENROLLMENT_VERIFICATION') && passwordMethodCode) {
      const passwordConfig = await this.fetchMethodConfiguration(companyId, passwordMethodCode);
      const twoFactorAuth = passwordConfig?.passwordConfig?.twoFactorAuthentication ?? {};
      const expiryMinutes = Number(
        twoFactorAuth.otpValidityMinutes ?? this.DEFAULT_OTP_EXPIRY_MINUTES
      );
      const resendCooldownSeconds = Number(
        twoFactorAuth.resendOtpCooldownSeconds ?? this.DEFAULT_RESEND_COOLDOWN_SECONDS
      );
      this.logger.log(`[${scenario}] ExpiryMinutes: ${expiryMinutes}, ResendCooldown: ${resendCooldownSeconds}s (from ${passwordMethodCode} passwordConfig.twoFactorAuthentication)`);
      return {
        expiryMinutes: expiryMinutes > 0 ? expiryMinutes : this.DEFAULT_OTP_EXPIRY_MINUTES,
        retryLimit: this.DEFAULT_RETRY_LIMIT,
        resendCooldownSeconds: resendCooldownSeconds > 0 ? resendCooldownSeconds : this.DEFAULT_RESEND_COOLDOWN_SECONDS,
      };
    }
    const config = await this.fetchMethodConfiguration(companyId, methodCode);
    const otpConfig = (config?.otpConfig ?? {}) as Record<string, any>;
    const expiryMinutes = Number(
      otpConfig.otpValidityMinutes ??
        otpConfig.expiryMinutes ??
        this.DEFAULT_OTP_EXPIRY_MINUTES
    );
    const retryLimit = Number(
      otpConfig.otpRetryLimit ?? this.DEFAULT_RETRY_LIMIT
    );
    const resendCooldownSeconds = Number(
      otpConfig.resendOtpCooldownSeconds ??
        this.DEFAULT_RESEND_COOLDOWN_SECONDS
    );
    this.logger.log(`[Login OTP] ExpiryMinutes: ${expiryMinutes > 0 ? expiryMinutes : this.DEFAULT_OTP_EXPIRY_MINUTES} (from ${methodCode} otpConfig)`);

    return {
      expiryMinutes: expiryMinutes > 0
        ? expiryMinutes
        : this.DEFAULT_OTP_EXPIRY_MINUTES,
      retryLimit: retryLimit > 0 ? retryLimit : this.DEFAULT_RETRY_LIMIT,
      resendCooldownSeconds:
        resendCooldownSeconds > 0
          ? resendCooldownSeconds
          : this.DEFAULT_RESEND_COOLDOWN_SECONDS,
    };
  }

  private async fetchMethodConfiguration(
    companyId: number | null,
    methodCode: string,
    configId?: number | null,
  ): Promise<Record<string, any> | null> {
    if (!companyId) {
      return null;
    }

    try {
      const base = this.companyAuthenticationConfigRepository
        .createQueryBuilder('config')
        .leftJoinAndSelect('config.authenticationMethod', 'method')
        .where('config.companyId = :companyId', { companyId })
        .andWhere('method.methodCode = :methodCode', { methodCode: methodCode.toUpperCase() });

      // Domain-level override: try config_id match first, fall back to company default (config_id IS NULL)
      if (configId) {
        const domainConfig = await base.clone()
          .andWhere('config.configId = :configId', { configId })
          .orderBy('config.id', 'DESC')
          .getOne();
        if (domainConfig) return domainConfig.companyPortalAuthConfig ?? null;
      }

      const companyConfig = await base.clone()
        .andWhere('config.configId IS NULL')
        .orderBy('config.id', 'DESC')
        .getOne();
      return companyConfig?.companyPortalAuthConfig ?? null;
    } catch (error: any) {
      this.logger.warn(
        `Unable to load auth config (DB) for company ${companyId}: ${error.message}`
      );
      return null;
    }
  }

  private parseSessionTimeoutMinutes(
    config?: Record<string, any> | null
  ): number | null {
    if (!config) {
      return null;
    }
    const minutes = Number(
      config?.passwordConfig?.sessionSettings?.sessionTimeoutMinutes ??
        config?.sessionSettings?.sessionTimeoutMinutes ??
        config?.otpConfig?.sessionTimeoutMinutes
    );
    if (Number.isNaN(minutes) || minutes <= 0) {
      return null;
    }
    return minutes;
  }

  private async resolveTokenExpiryForMethod(
    companyId: number | null,
    methodCode: string,
    configId?: number | null,
  ): Promise<string> {
    if (!companyId || !methodCode) {
      return getAccessTokenExpiry();
    }
    const config = await this.fetchMethodConfiguration(companyId, methodCode, configId);
    const minutes = this.parseSessionTimeoutMinutes(config);
    if (!minutes) {
      return getAccessTokenExpiry();
    }
    return `${minutes}m`;
  }

  /**
   * Checks that the employee has at least one enrollment in the domain's scoped policies.
   * 
   /**
   * @param configId - The config_id of the domain-level override (or null for company default)
   * @param employeeId - The employee's ID
   * @throws ForbiddenException if the employee is not enrolled in any policy covered under this portal
   */
  private async assertEnrolledInDomainScope(
    configId: number | null,
    employee: IbpEmployeeAuthResult,
  ): Promise<void> {
    if (!configId) return;
    // HR users (userId is null) manage the portal and are not expected to have policy enrollments
    if (!employee.userId) return;

    const scopeRows = await this.configScopeRepository.find({
      where: { configId },
      select: ['policyId'],
    });
    // No scope configured, or any sentinel null-policy row → allow all
    if (scopeRows.length === 0 || scopeRows.some((r) => r.policyId === null)) return;

    const explicitPolicyIds = scopeRows
      .map((r) => r.policyId)
      .filter((id): id is number => id != null);
    if (explicitPolicyIds.length === 0) return;

    // Use policy_enrollment_employee_policy_map (same table as the readiness check)
    // employee_id in that table references policy_enrollment_employee.id (confirmed via
    // the FK constraint) — NOT employee.userId, which is the separate users.id FK.
    const enrollment = await this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder('peem')
      .where('peem.employeeId = :employeeId', { employeeId: employee.id })
      .andWhere('peem.policyId IN (:...policyIds)', { policyIds: explicitPolicyIds })
      .getOne();
    if (!enrollment) {
      throw new ForbiddenException(
        'You are not enrolled in any policy covered under this portal. Please use the correct portal URL or contact your HR.'
      );
    }
  }

  private async resolveCompanyIdByDomain(domain?: string): Promise<{
    companyId: number | null;
    isCommon: boolean;
    allCompanyIds: number[];
    configId: number | null;
  }> {
    if (!domain) {
      return { companyId: null, isCommon: true, allCompanyIds: [], configId: null };
    }

    const configs = await this.configCompanyRepository.find({
      where: { subDomain: domain },
    });

    const valid = configs.filter((c) => c.companyId != null);
    if (valid.length === 0) {
      return { companyId: null, isCommon: true, allCompanyIds: [], configId: null };
    }

    const allCompanyIds = valid.map((c) => c.companyId as number);
    const primary = valid[0];

    return {
      companyId: primary.companyId,
      isCommon: primary.isCompanyConfig === false,
      allCompanyIds,
      configId: primary.id,
    };
  }

  /**
   * Generate and send OTP to email
   * @param email - User's email address
   * @param domain - Company domain
   * @param scenario - OTP scenario (login, 2FA, enrollment)
   */
  async sendOTP(
    email: string,
    domain?: string,
    scenario: EmailOTPScenario = EMAIL_OTP_SCENARIOS.LOGIN,
    passwordMethodCode?: string,
  ): Promise<{ message: string }> {
    try {
      // Validate email
      if (!email || !this.isValidEmail(email)) {
        throw new BadRequestException('Invalid email address');
      }

      const normalizedEmail = email.toLowerCase().trim();
      this.logger.log(`Sending OTP to email: ${normalizedEmail}`);

      const { isCommon, allCompanyIds, configId } =
        await this.resolveCompanyIdByDomain(domain);
      if (!domain || isCommon) {
        throw new UnauthorizedException(`please configure the company for the domain ${domain}`);
      }

      // Loop through all companies sharing this domain to find the employee
      let employee = null;
      let resolvedCompanyId: number | undefined;
      for (const cid of allCompanyIds) {
        employee = await this.findEmployeeByEmailWithHrFallback(normalizedEmail, cid);
        if (employee) {
          resolvedCompanyId = cid;
          break;
        }
      }
      if (!employee) {
        throw new UnauthorizedException(
          'No account found with this email. Please contact your administrator.'
        );
      }

      // Check if account is active
      if (employee.userStatusKey === USER_STATUS_DELETED) {
        throw new UnauthorizedException('Your account has been deactivated');
      }

      // Generate 6-digit OTP
      const otp = this.generateOTP();
      resolvedCompanyId = resolvedCompanyId ?? employee.companyId;
      const settings = await this.resolveOtpSettings(
        resolvedCompanyId,
        "EMAIL_OTP",
        scenario,
        passwordMethodCode,
      );

      // Store OTP with expiration
      const expiresAt = new Date(
        Date.now() + settings.expiryMinutes * 60 * 1000
      );
      const record: OTPStore = {
        otp,
        email: normalizedEmail,
        expiresAt,
        attempts: 0,
        retryLimit: settings.retryLimit,
      };
      if (this.redis) {
        const key = this.getEmailOtpKey(normalizedEmail, domain);
        this.logger.log(
          `[EmailOtp] Storing OTP in Redis key=${key} expiresAt=${expiresAt.toISOString()} retryLimit=${settings.retryLimit}`,
        );
        await this.setOtpRecordRedis(key, record);
      } else {
        this.otpStore.set(normalizedEmail, record);
        // Clean up expired OTPs (in-memory only)
        this.cleanupExpiredOTPs();
      }

      // Send OTP via notification service
      await this.sendOTPViaNotification(
        normalizedEmail,
        otp,
        employee,
        settings.expiryMinutes,
        domain,
        scenario,
        configId,
      );

      this.logger.log(`OTP sent successfully to: ${normalizedEmail}`);

      return {
        message: 'OTP sent successfully to your email',
      };
    } catch (error) {
      this.logger.error(`Failed to send OTP: ${error instanceof Error ? error.stack ?? error.message : JSON.stringify(error)}`);
      throw error;
    }
  }

  /**
   * Verify OTP and generate JWT tokens
   * @param email - User's email address
   * @param otp - OTP code entered by user
   */
  async verifyOTPAndGenerateTokens(
    email: string,
    otp: string,
    domain?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
  }> {
    try {
      const normalizedEmail = email.toLowerCase().trim();

      const { isCommon, allCompanyIds, configId } =
        await this.resolveCompanyIdByDomain(domain);
      if (!domain || isCommon) {
        throw new UnauthorizedException(`please configure the company for the domain ${domain}`);
      }

      // Get stored OTP
      const redisKey = this.getEmailOtpKey(normalizedEmail, domain);
      this.logger.log(
        `[EmailOtp] Verifying OTP from Redis key=${redisKey} email=${normalizedEmail}`,
      );
      const storedData = this.redis
        ? await this.getOtpRecordRedis(redisKey)
        : this.otpStore.get(normalizedEmail);

      if (!storedData) {
        throw new UnauthorizedException('OTP not found or expired. Please request a new one.');
      }

      // Check if OTP expired
      if (new Date() > storedData.expiresAt) {
        if (this.redis) {
          await this.deleteOtpRecordRedis(redisKey);
        } else {
          this.otpStore.delete(normalizedEmail);
        }
        throw new UnauthorizedException('OTP has expired. Please request a new one.');
      }

      // Check max attempts
      if (storedData.attempts >= storedData.retryLimit) {
        if (this.redis) {
          await this.deleteOtpRecordRedis(redisKey);
        } else {
          this.otpStore.delete(normalizedEmail);
        }
        throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
      }

      // Verify OTP
      if (storedData.otp !== otp.trim()) {
        let updatedAttempts = storedData.attempts + 1;
        if (this.redis) {
          const next = await this.incrOtpAttemptsRedis(redisKey);
          if (typeof next === 'number' && Number.isFinite(next)) {
            updatedAttempts = next;
          }
        } else {
          storedData.attempts = updatedAttempts;
          this.otpStore.set(normalizedEmail, storedData);
        }
        const attemptsRemaining = Math.max(
          0,
          storedData.retryLimit - updatedAttempts
        );
        if (updatedAttempts >= storedData.retryLimit) {
          if (this.redis) {
            await this.deleteOtpRecordRedis(redisKey);
          } else {
            this.otpStore.delete(normalizedEmail);
          }
        }
        throw new UnauthorizedException(
          `Invalid OTP. ${attemptsRemaining} attempts remaining.`
        );
      }

      this.logger.log(`OTP verified for email: ${normalizedEmail}`);

      // Delete OTP after successful verification
      if (this.redis) {
        await this.deleteOtpRecordRedis(redisKey);
      } else {
        this.otpStore.delete(normalizedEmail);
      }

      // Loop through all companies sharing this domain to find the employee
      let employee = null;
      let resolvedCompanyId: number | undefined;
      for (const cid of allCompanyIds) {
        employee = await this.findEmployeeByEmailWithHrFallback(normalizedEmail, cid);
        if (employee) {
          resolvedCompanyId = cid;
          break;
        }
      }

      if (!employee) {
        throw new UnauthorizedException(
          'No account found with this email. Please contact your administrator.'
        );
      }

      // Check if account is active
      if (employee.userStatusKey === USER_STATUS_DELETED) {
        throw new UnauthorizedException('Your account has been deactivated');
      }

      await this.assertEnrolledInDomainScope(configId, employee);

      // Generate JWT tokens
      resolvedCompanyId = resolvedCompanyId ?? employee.companyId;
      const tokens = await this.getTokens(employee, {
        loginMethodCode: 'EMAIL_OTP',
        companyId: resolvedCompanyId,
        configId,
      });

      return {
        ...tokens,
        user: {
          id: employee.id,
          loginName: employee.loginName,
          email: employee.email,
          phoneNumber: employee.phoneNumber,
        },
      };
    } catch (error) {
      this.logger.error('OTP verification failed:', error);
      throw error;
    }
  }

  /**
   * Generate JWT access and refresh tokens
   * Uses the same payload structure as SimpleAuthService and GoogleOAuthService
   */
  private async getTokens(
    employee: IbpEmployeeAuthResult,
    options?: {
      loginMethodCode?: string;
      companyId?: number | null;
      configId?: number | null;
    },
  ): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    if (!employee || !employee.id) {
      throw new BadRequestException('Invalid employee details');
    }

    const resolvedMethodCode =
      options?.loginMethodCode?.toUpperCase() || 'EMAIL_OTP';
    const resolvedCompanyId = options?.companyId ?? employee.companyId ?? null;
    const resolvedConfigId = options?.configId ?? null;
    const tokenExpiry = await this.resolveTokenExpiryForMethod(
      resolvedCompanyId,
      resolvedMethodCode,
      resolvedConfigId,
    );

    const payload: Record<string, unknown> = {
      userDetails: {
        emailId: employee.email,
        userId: employee.id,
        roles: employee.roles,
        organisationId: employee.companyId,
        authVersion: employee.authVersion,
      },
      portal: 'IBP',
      loginMethod: resolvedMethodCode,
      companyId: resolvedCompanyId,
      configId: resolvedConfigId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: ENV.JWT_SECRET,
        expiresIn: tokenExpiry as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: ENV.JWT_REFRESH_SECRET || ENV.JWT_SECRET,
        expiresIn: tokenExpiry as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async hrUserToAuthResult(hrUser: HrUserManagement): Promise<IbpEmployeeAuthResult> {
    const roleRecord = hrUser.roleKey
      ? (await this.roleRepository.findOne({ where: { roleKey: hrUser.roleKey } }) ??
         await this.roleRepository.findOne({ where: { roleKey: `ROLE_${hrUser.roleKey}` } }))
      : null;
    const roles = roleRecord
      ? [{ id: roleRecord.id, name: roleRecord.name, role_key: roleRecord.roleKey }]
      : [{ id: 0, name: hrUser.roleKey ?? 'EXTERNAL_HR', role_key: hrUser.roleKey ?? 'EXTERNAL_HR' }];
    return {
      id: hrUser.id,
      loginName: hrUser.loginName ?? null,
      email: hrUser.emailId ?? null,
      phoneNumber: hrUser.phoneNumber ?? null,
      employeeName: hrUser.userName ?? '',
      companyId: hrUser.companyId ?? 0,
      userId: null,
      password: hrUser.password ?? null,
      ibpPassword: null,
      isPasswordSet: hrUser.isPasswordSet ?? false,
      isPasswordHashed: hrUser.isPasswordHashed ?? false,
      passwordExpiresAt: hrUser.passwordExpiresAt ?? null,
      authVersion: hrUser.authVersion ?? 1,
      userStatusKey: hrUser.userStatusKey ?? 'USER_STATUS_ACTIVE',
      roles,
    };
  }

  private async findEmployeeByEmailWithHrFallback(
    email: string,
    companyId: number,
  ): Promise<IbpEmployeeAuthResult | null> {
    const pee = await this.ibpEmployeeAuthRepository.findByEmailAndCompany(email, companyId);
    if (pee) return pee;
    const hrUser = await this.hrUserManagementRepository.findOne({
      where: [
        { emailId: email, companyId, deletedAt: IsNull() },
        { loginName: email, companyId, deletedAt: IsNull() },
      ],
    });
    return hrUser ? this.hrUserToAuthResult(hrUser) : null;
  }

  /**
   * Generate a random 6-digit OTP
   */
  private generateOTP(): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`=====================   Generated OTP: ${otp}   ======================`);
    return otp;
  }

  /**
   * Send OTP via notification service using event-based system
   */
  private async sendOTPViaNotification(
    email: string,
    otp: string,
    user: any,
    expiryMinutes: number,
    domain?: string,
    scenario: EmailOTPScenario = EMAIL_OTP_SCENARIOS.LOGIN,
    configId?: number | null,
  ): Promise<void> {
    try {
      this.logger.log(`Calling notification service at: ${this.notificationServiceUrl}/notifications`);

      // Get user's full name from the database
      const userName = this.buildDisplayName(user, email);
      
      // Resolve login URL based on company configuration
      const loginUrl = await this.resolveCompanyPortalLoginUrl(user.companyId ?? null, domain);
      
      const iirmLogoUrl =
        this.buildIbpPublicAssetUrl(
          ENV.IBP_EMAIL_IIRM_LOGO_FILE || 'iirmLogoUrl.png',
        ) ||
        ENV.EMAIL_LOGO_URL ||
        undefined;
      const signatureUrl =
        this.buildIbpPublicAssetUrl(
          ENV.IBP_EMAIL_SIGNATURE_FILE || 'signature.svg',
        ) ||
        ENV.EMAIL_SIGNATURE_URL ||
        '';
      
      // Current year for copyright
      const currentYear = new Date().getFullYear().toString();

      // Prepare parameters for the notification template
      const parameters = {
        ...(await this.getSupportContactParams(user.companyId)),
        [EMAIL_OTP_KEY_1]: otp,
        [EMAIL_OTP_KEY_2]: expiryMinutes.toString(),
        userName: userName,
        otpCode: otp,
        loginUrl: loginUrl,
        logoUrl: iirmLogoUrl,
        iirmLogoUrl: iirmLogoUrl,
        signatureUrl: signatureUrl,
        currentYear: currentYear,
      };

      // Determine the appropriate event type based on scenario
      const getEventTypeForScenario = (scenario: EmailOTPScenario): string => {
        switch (scenario) {
          case EMAIL_OTP_SCENARIOS.TWO_FACTOR_AUTH:
            return NOTIFICATION_EVENT_TYPES.EMAIL_OTP_2FA;
          case EMAIL_OTP_SCENARIOS.ENROLLMENT_VERIFICATION:
            return NOTIFICATION_EVENT_TYPES.EMAIL_OTP_ENROLLMENT_VERIFICATION;
          case EMAIL_OTP_SCENARIOS.LOGIN:
          default:
            return NOTIFICATION_EVENT_TYPES.EMAIL_OTP_LOGIN;
        }
      };

      // Call notification service with event-based structure
      const response = await axios.post(
        `${this.notificationServiceUrl}/notifications`,
        {
          eventType: getEventTypeForScenario(scenario),
          emailId: [email],
          channel: NOTIFICATION_EMAIL,
          parameters: parameters,
          userId: [user.id],
          ...(user.companyId ? { companyId: user.companyId } : {}),
          // Without this, notification-service's resolveConfigIdForTemplate()
          // always short-circuits to undefined (it requires both companyId
          // AND domain), so a per-domain "Customise Email Templates" override
          // saved for this event is silently ignored and the shared default
          // template is sent instead, regardless of which subdomain the user
          // is logging in from.
          ...(domain ? { domain } : {}),
          // configId was already resolved exactly (via resolveCompanyIdByDomain's
          // subDomain lookup, an exact match — not a guess) by the caller before
          // this OTP was even generated. Passing it straight through lets
          // notification-service use it directly instead of re-deriving it from
          // companyId+domain a second time — same "prefer an already-known
          // configId over re-resolving it" principle used for the IBP onboarding
          // notification flows (enrollment/life-event/claim/support-ticket).
          ...(configId ? { configId } : {}),
          source: "IBP",
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );
      if (response.status === 200 || response.status === 201) {
        const sendStatus = response.data?.data?.status;
        if (
          sendStatus === NOTIFICATION_SKIP_STATUS.DISABLED_FOR_COMPANY ||
          sendStatus === NOTIFICATION_SKIP_STATUS.DISABLED_FOR_DOMAIN ||
          sendStatus === NOTIFICATION_SKIP_STATUS.TEMPLATE_DISABLED
        ) {
          this.logger.warn(`OTP email skipped for ${email} -- disabled by admin (${sendStatus})`);
          throw new UnauthorizedException(
            'Email OTP login is currently disabled for your organisation. Please try a different login method.'
          );
        }
        this.logger.log(`OTP email sent successfully to: ${email} via notification service`);
      } else {
        this.logger.warn(`Unexpected response from notification service: ${response.status}`);
        throw new Error('Failed to send email via notification service');
      }
    } catch (error) {
      this.logger.error('Failed to send OTP email via notification service:', error.message || error);
      if (axios.isAxiosError(error)) {
        this.logger.error(`Axios error details: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
      }
      throw new BadRequestException('Failed to send OTP email. Please try again later or contact support.');
    }
  }

  /**
   * Resolve company portal login URL from companyId
   */
  // Cached per companyId for the lifetime of the process, so a slow CMS is paid
  // for at most once rather than on every OTP send. A contact edited in Strapi
  // therefore reaches this mail only after a restart.
  private readonly supportContactParamsCache = new Map<
    number,
    Record<string, string | undefined>
  >();

  /**
   * Broker escalation contacts for the OTP mail's "Support Contacts" section.
   *
   * Deliberately short-timeout and failure-tolerant: an OTP is time critical, so
   * a slow or down CMS must never hold up delivery. On any failure this returns
   * nothing, which leaves every parameter undefined and lets the template's
   * {{#if primaryEscalationEmail}} guard hide the section entirely.
   */
  private async getSupportContactParams(
    companyId: number | null | undefined,
  ): Promise<Record<string, string | undefined>> {
    if (!companyId) {
      return {};
    }

    const cached = this.supportContactParamsCache.get(companyId);
    if (cached) {
      return cached;
    }

    try {
      const strapiBaseUrl = String(
        ENV.URL_STRAPI_CMS_SERVICE || ENV.STRAPI_PUBLIC_URL || '',
      )
        .trim()
        .replace(/\/+$/, '');
      if (!strapiBaseUrl) {
        return {};
      }

      const response = await axios.get(
        `${strapiBaseUrl}/api/company-templates/company/${companyId}`,
        { timeout: 3000 },
      );

      const rawPayload = response?.data;
      const records = Array.isArray(rawPayload?.data)
        ? rawPayload.data
        : Array.isArray(rawPayload)
        ? rawPayload
        : rawPayload
        ? [rawPayload.data ?? rawPayload]
        : [];

      const unwrap = (value: any) => (value ? value.attributes ?? value : null);
      // Strapi returns single components as objects and repeatables as arrays.
      const pick = (value: any) => {
        const contact = unwrap(Array.isArray(value) ? value[0] : value);
        return contact
          ? { name: contact.name, email: contact.email, phone: contact.phone }
          : null;
      };

      const contactMatrix = unwrap(
        unwrap(unwrap(records[0])?.config)?.contactMatrix,
      );
      const broker = unwrap(contactMatrix?.broker);
      const primary = pick(broker?.primaryEscalation);
      const secondary = pick(broker?.secondaryEscalation);
      if (!primary?.email) {
        return {};
      }

      const params = {
        primaryEscalationName: primary.name || 'Primary Escalation',
        primaryEscalationEmail: primary.email,
        primaryEscalationPhone: primary.phone || '-',
        // Left undefined so the template's {{#if secondaryEscalationEmail}}
        // guard can hide the block when there is no secondary contact.
        secondaryEscalationName: secondary?.name,
        secondaryEscalationEmail: secondary?.email,
        secondaryEscalationPhone: secondary?.phone,
      };
      this.supportContactParamsCache.set(companyId, params);
      return params;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Could not load support contacts for company ${companyId}: ${reason}`,
      );
      return {};
    }
  }

  private async resolveCompanyPortalLoginUrl(
    companyId: number | null,
    domain?: string
  ): Promise<string> {
    if (!companyId) {
      return ENV.IBP_LOGIN_URL || ENV.COMPANY_PORTAL_URL || 'https://newiwork.indiainsure.com/dashboard';
    }

    const config = await this.configCompanyRepository.findOne({
      where: { companyId },
      order: { updatedAt: 'DESC', id: 'DESC' },
    });

    const baseUrl = this.resolveCompanyPortalBaseUrl(config);
    return baseUrl || ENV.IBP_LOGIN_URL || ENV.COMPANY_PORTAL_URL || 'https://newiwork.indiainsure.com/dashboard';
  }

  /**
   * Resolve company portal base URL from config (similar to password reset)
   */
  private resolveCompanyPortalBaseUrl(
    config: ConfigCompany | null | undefined
  ): string | null {
    const defaultPortalUrl = ENV.COMPANY_PORTAL_URL || ENV.IBP_LOGIN_URL || null;
    
    if (!config) {
      return defaultPortalUrl;
    }

    const configuredUrl = config.companyPortalUrl ?? null;
    if (configuredUrl) {
      return configuredUrl;
    }

    const subDomain = config.subDomain?.trim();
    if (!subDomain) {
      return defaultPortalUrl;
    }

    return defaultPortalUrl
      ? this.applySubdomainToUrl(defaultPortalUrl, subDomain)
      : null;
  }

  /**
   * Apply subdomain to URL (similar to password reset)
   */
  private applySubdomainToUrl(baseUrl: string, subDomain: string): string {
    try {
      const url = new URL(baseUrl);
      const host = url.hostname;
      if (!host.startsWith(`${subDomain}.`)) {
        url.hostname = `${subDomain}.${host}`;
      }
      return url.toString();
    } catch (error) {
      return baseUrl.replace(/^https?:\/\//, `$&${subDomain}.`);
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Clean up expired OTPs from memory
   */
  private cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [email, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(email);
        this.logger.log(`Cleaned up expired OTP for: ${email}`);
      }
    }
  }
}
