import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ENV } from '../../../../service-lib/src/lib/environment';
import { getAccessTokenExpiry } from '../token.constants';
import type Redis from 'ioredis';
import {
  NOTIFICATION_SMS,
  NOTIFICATION_EVENT_TYPES,
  SMS_OTP_KEY_1,
  SMS_OTP_KEY_2,
  SMS_OTP_KEY_3,
  serviceNames,
  NOTIFICATION_EMAIL,
  EMAIL_OTP_KEY_1,
  EMAIL_OTP_KEY_2,
  NOTIFICATION_SKIP_STATUS
} from '../../../../service-lib/src/lib/constants';
import { USER_STATUS_DELETED } from '../../../../../../libs/service-lib/src/lib/constants';
import axios from 'axios';
import {
  CompanyAuthenticationConfig,
  ConfigCompany,
} from '../../../../service-lib/src/lib/entities';
import { CompanyPortalConfigScope } from '../../../../service-lib/src/lib/entities/company-portal-config-scope.entity';
import { PolicyEmployeeEnrollment } from '../../../../service-lib/src/lib/entities/policy-employee-enrollment.entity';
import { PolicyEnrollmentEmployeePolicyMap } from '../../../../service-lib/src/lib/entities/policy-enrollment-employee-policy-map.entity';
import { HrUserManagement } from '../../../../service-lib/src/lib/entities/hr-user-management.entity';
import { Role } from '../../../../service-lib/src/lib/entities/roles.entity';
import { IsNull } from 'typeorm';
import { errorMessages } from '../../../../../../libs/service-lib/src/lib/messages';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { createRedisClient } from '../../../../service-lib/src/lib/utils/redis.util';
import { IbpEmployeeAuthRepository, IbpEmployeeAuthResult } from '../ibp-employee-auth/ibp-employee-auth.repository';

interface OTPStore {
  otp: string;
  identifier: string; // phone or email
  expiresAt: Date;
  attempts: number;
  retryLimit: number;
}

interface OTPSettings {
  expiryMinutes: number;
  retryLimit: number;
  resendCooldownSeconds: number;
}

@Injectable()
export class PhoneOtpService {
  private readonly logger = new Logger(PhoneOtpService.name);
  private otpStore: Map<string, OTPStore> = new Map();
  private redis: Redis | null = null;
  private readonly DEFAULT_RETRY_LIMIT = 5;
  private readonly DEFAULT_OTP_EXPIRY_MINUTES = 5;
  private readonly DEFAULT_RESEND_COOLDOWN_SECONDS = 60;
  private readonly notificationServiceUrl: string;

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
    @InjectRepository(PolicyEmployeeEnrollment)
    private readonly policyEmployeeEnrollmentRepository: Repository<PolicyEmployeeEnrollment>,
    @InjectRepository(PolicyEnrollmentEmployeePolicyMap)
    private readonly policyEnrollmentEmployeePolicyMapRepository: Repository<PolicyEnrollmentEmployeePolicyMap>,
  ) {
    // Get notification service URL from environment
    this.notificationServiceUrl = ENV.URL_NOTIFICATION_SERVICE || 'http://localhost:3015';
    this.logger.log(`Phone OTP service initialized. Notification service URL: ${this.notificationServiceUrl}`);

    // Use shared Redis util (same pattern as other services).
    const appLogger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
    this.redis = createRedisClient({
      logger: appLogger,
      traceId: this.traceIdService.traceId ?? 'no-trace',
      location: PhoneOtpService.name,
      method: 'constructor',
    });
  }

  private normalizeDomain(domain?: string | null): string {
    return String(domain ?? '')
      .trim()
      .toLowerCase();
  }

  private getPhoneOtpKey(phoneNumber: string, domain?: string | null): string {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const normalizedDomain = this.normalizeDomain(domain);
    return `auth:otp:phone:${normalizedDomain || 'unknown'}:${normalizedPhone}`;
  }

  private getPhoneResetOtpKey(phoneNumber: string, domain?: string | null): string {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const normalizedDomain = this.normalizeDomain(domain);
    return `auth:otp:phone:reset:${normalizedDomain || 'unknown'}:${normalizedPhone}`;
  }

  private async setOtpRecordRedis(key: string, record: OTPStore): Promise<void> {
    if (!this.redis) return;
    const ttlSeconds = Math.max(
      1,
      Math.ceil((record.expiresAt.getTime() - Date.now()) / 1000),
    );
    await this.redis.hset(key, {
      otp: record.otp,
      identifier: record.identifier,
      expiresAtMs: String(record.expiresAt.getTime()),
      attempts: String(record.attempts),
      retryLimit: String(record.retryLimit),
    });
    await this.redis.expire(key, ttlSeconds);
  }

  private async getOtpRecordRedis(key: string): Promise<OTPStore | null> {
    if (!this.redis) return null;
    const [otp, identifier, expiresAtMs, attempts, retryLimit] =
      await this.redis.hmget(
        key,
        'otp',
        'identifier',
        'expiresAtMs',
        'attempts',
        'retryLimit',
      );
    if (!otp || !identifier || !expiresAtMs) {
      return null;
    }
    const expiresAt = new Date(Number(expiresAtMs));
    const parsedAttempts = Number(attempts ?? 0) || 0;
    const parsedRetryLimit =
      Number(retryLimit ?? this.DEFAULT_RETRY_LIMIT) ||
      this.DEFAULT_RETRY_LIMIT;
    return {
      otp,
      identifier,
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

  private async resolveCompanyId(_unused: number): Promise<number | null> {
    // Company ID is now resolved from domain — this method is kept for signature
    // compatibility but should not be needed in the new flow.
    return null;
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

  // No longer needed — IBP auth now looks up policy_enrollment_employee
  // directly by (phone/email, companyId). Company association is implicit.
  private async ensureEmployeeBelongsToCompany(
    _ibpEmployeeId: number,
    _companyId: number | null
  ): Promise<void> {
    return;
  }

  /**
   * Send OTP to phone number (Backend-only implementation)
   * @param phoneNumber - User's phone number
   */
  async sendPhoneOtp(
    phoneNumber: string,
    domain?: string,
    scenario?: string,
    passwordMethodCode?: string,
  ): Promise<{ message: string }> {
    this.logger.log('========== SEND PHONE OTP - START ==========');
    this.logger.log(`[Step 1] Request received - Phone: ${phoneNumber}, Domain: ${domain || 'not provided'}`);
    
    try {
      // Validate phone number format
      this.logger.log(`[Step 2] Validating phone number format...`);
      if (!phoneNumber || !this.isValidPhoneNumber(phoneNumber)) {
        this.logger.error(`[Step 2] FAILED - Invalid phone number format: ${phoneNumber}`);
        throw new BadRequestException('Invalid phone number');
      }
      this.logger.log(`[Step 2] SUCCESS - Phone number format is valid`);

      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      this.logger.log(`[Step 3] Phone number normalized: ${phoneNumber} -> ${normalizedPhone}`);

      this.logger.log(`[Step 4] Resolving company ID by domain: ${domain}`);
      const { isCommon, allCompanyIds } =
        await this.resolveCompanyIdByDomain(domain);
      this.logger.log(`[Step 4] Company resolution result - AllCompanyIds: ${allCompanyIds}, IsCommon: ${isCommon}`);

      if (!domain || isCommon) {
        this.logger.error(`[Step 4] FAILED - Invalid domain or common domain not allowed`);
        throw new UnauthorizedException(errorMessages.userNotFound);
      }

      // Loop through all companies sharing this domain to find the employee
      let employee = null;
      let resolvedCompanyId: number | null = null;
      for (const cid of allCompanyIds) {
        this.logger.log(`[Step 5] Looking up company employee by phone: ${normalizedPhone}, companyId: ${cid}`);
        employee = await this.findEmployeeByPhoneWithHrFallback(normalizedPhone, cid);
        if (employee) {
          resolvedCompanyId = cid;
          break;
        }
      }
      if (!employee) {
        this.logger.error(`[Step 5] FAILED - No employee found with phone for any domain company`);
        throw new UnauthorizedException(
          'No account found with this phone number. Please contact your administrator.'
        );
      }
      this.logger.log(`[Step 5] SUCCESS - Employee found: PeeID=${employee.id}, Email=${employee.email}`);

      // Check if account is active
      this.logger.log(`[Step 6] Checking employee account status...`);
      if (employee.userStatusKey === USER_STATUS_DELETED) {
        this.logger.error(`[Step 6] FAILED - Employee account is deactivated: PeeID=${employee.id}`);
        throw new UnauthorizedException('Your account has been deactivated');
      }
      this.logger.log(`[Step 6] SUCCESS - Employee account is active`);

      // Generate 6-digit OTP
      this.logger.log(`[Step 7] Generating 6-digit OTP...`);
      const otp = this.generateOTP();
      this.logger.log(`[Step 7] SUCCESS - OTP generated`);

      this.logger.log(`[Step 8] Resolving company ID for OTP settings...`);
      resolvedCompanyId = resolvedCompanyId ?? employee.companyId ?? null;
      this.logger.log(`[Step 8] Resolved CompanyID: ${resolvedCompanyId}`);
      
      this.logger.log(`[Step 10] Loading OTP settings for CompanyID: ${resolvedCompanyId}`);
      const settings = await this.resolveOtpSettings(
        resolvedCompanyId,
        "PHONE_OTP",
        scenario,
        passwordMethodCode,
      );
      this.logger.log(`[Step 10] OTP Settings loaded - ExpiryMinutes: ${settings.expiryMinutes}, RetryLimit: ${settings.retryLimit}, ResendCooldown: ${settings.resendCooldownSeconds}s`);

      // Store OTP with expiration
      const expiresAt = new Date(
        Date.now() + settings.expiryMinutes * 60 * 1000
      );
      const record: OTPStore = {
        otp,
        identifier: normalizedPhone,
        expiresAt,
        attempts: 0,
        retryLimit: settings.retryLimit,
      };
      if (this.redis) {
        const key = this.getPhoneOtpKey(normalizedPhone, domain);
        this.logger.log(
          `[Step 11] Storing OTP in Redis - Phone: ${normalizedPhone}, Key: ${key}, ExpiresAt: ${expiresAt.toISOString()}, RetryLimit: ${settings.retryLimit}`,
        );
        await this.setOtpRecordRedis(
          key,
          record,
        );
        this.logger.log(`[Step 11] SUCCESS - OTP stored in Redis`);
      } else {
        this.logger.log(`[Step 11] Storing OTP in memory - Phone: ${normalizedPhone}, ExpiresAt: ${expiresAt.toISOString()}, RetryLimit: ${settings.retryLimit}`);
        this.otpStore.set(normalizedPhone, record);
        this.logger.log(`[Step 11] SUCCESS - OTP stored in memory (Total stored OTPs: ${this.otpStore.size})`);

        // Clean up expired OTPs (in-memory only)
        this.logger.log(`[Step 12] Cleaning up expired OTPs...`);
        this.cleanupExpiredOTPs();
        this.logger.log(`[Step 12] Cleanup complete (Remaining OTPs: ${this.otpStore.size})`);
      }

      // Construct employee's display name for SMS template
      const userName = employee.employeeName || employee.loginName || 'User';
      this.logger.log(`[Step 10] Employee display name constructed: ${userName}`);

      // Send OTP via notification service
      this.logger.log(`[Step 11] Sending OTP via SMS - Phone: ${normalizedPhone}, PeeID: ${employee.id}, UserName: ${userName}, ExpiryMinutes: ${settings.expiryMinutes}`);
      await this.sendOTPViaSMS(
        normalizedPhone,
        otp,
        employee.id,
        userName,
        settings.expiryMinutes,
        resolvedCompanyId
      );
      this.logger.log(`[Step 11] SUCCESS - OTP SMS sent via notification service`);

      // Send OTP to email linked to this phone number
      this.logger.log(`[Step 15] Sending OTP to email linked to phone: ${normalizedPhone}`);
      try {
        await this.sendOtpToEmailLinkedToMobile(
          employee,
          otp,
          userName,
          settings.expiryMinutes,
          domain,
        );
      } catch (emailError) {
        this.logger.warn(`[Step 15] WARNING - Failed to send OTP to email linked to phone: ${normalizedPhone}. Error: ${emailError instanceof Error ? emailError.message : emailError}`);
      }
      this.logger.log(`[Step 15] SUCCESS - OTP email sent to email linked to phone: ${normalizedPhone}`);

      this.logger.log(`[FINAL] OTP sent successfully to: ${normalizedPhone}`);
      this.logger.log('========== SEND PHONE OTP - END (SUCCESS) ==========');
      return {
        message: 'OTP sent successfully to your phone',
      };
    } catch (error) {
      this.logger.error('========== SEND PHONE OTP - END (FAILED) ==========');
      this.logger.error(`Error Type: ${error.constructor.name}`);
      this.logger.error(`Error Message: ${error.message}`);
      this.logger.error(`Error Stack: ${error.stack}`);
      throw error;
    }
  }

  private async assertEnrolledInDomainScope(
    configId: number | null,
    employee: IbpEmployeeAuthResult,
  ): Promise<void> {
    if (!configId) return;
    // HR users (userId is null) bypass scope check
    if (!employee.userId) return;

    const scopeRows = await this.configScopeRepository.find({
      where: { configId } as any,
      select: ['policyId'] as any,
    });
    // No scope configured, or sentinel null-policy row → allow all
    if (scopeRows.length === 0 || scopeRows.some((r: any) => r.policyId === null)) return;

    const explicitPolicyIds = scopeRows
      .map((r: any) => r.policyId)
      .filter((id: any): id is number => id != null);
    if (explicitPolicyIds.length === 0) return;

    // Use policy_enrollment_employee_policy_map (same as readiness check)
    // employee_id in that table references policy_enrollment_employee.id (confirmed via
    // the FK constraint) — NOT employee.userId, which is the separate users.id FK.
    const enrollment = await this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder('peem')
      .where('peem.employeeId = :employeeId', { employeeId: employee.id })
      .andWhere('peem.policyId IN (:...policyIds)', { policyIds: explicitPolicyIds })
      .getOne();
    if (!enrollment) {
      throw new ForbiddenException(
        'You are not enrolled in any policy covered under this portal. Please use the correct portal URL or contact your HR.',
      );
    }
  }

  /**
   * Verify Phone OTP and generate JWT tokens (Backend-only implementation)
   * @param phoneNumber - User's phone number
   * @param otp - OTP code entered by user
   */
  async verifyPhoneOtpAndGenerateTokens(
    phoneNumber: string,
    otp: string,
    domain?: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    user: any;
  }> {
    
    this.logger.log('========== VERIFY PHONE OTP - START ==========');
    this.logger.log(`[Verify-1] Request - Phone: ${phoneNumber}, OTP: ${otp}, Domain: ${domain || 'not provided'}`);
    
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      this.logger.log(`[Verify-2] Phone normalized: ${phoneNumber} -> ${normalizedPhone}`);

      this.logger.log(`[Verify-3] Resolving company by domain: ${domain}`);
      const { isCommon, allCompanyIds, configId } =
        await this.resolveCompanyIdByDomain(domain);
      this.logger.log(`[Verify-3] Company resolution - AllCompanyIds: ${allCompanyIds}, IsCommon: ${isCommon}`);

      if (!domain || isCommon) {
        this.logger.error(`[Verify-3] FAILED - Invalid domain`);
        throw new BadRequestException('FAILED - Invalid domain');
      }

      // Get stored OTP
      this.logger.log(`[Verify-4] Retrieving stored OTP for phone: ${normalizedPhone}`);
      const redisKey = this.getPhoneOtpKey(normalizedPhone, domain);
      const storedData = this.redis
        ? await this.getOtpRecordRedis(redisKey)
        : this.otpStore.get(normalizedPhone);

      if (!storedData) {
        this.logger.error(`[Verify-4] FAILED - No OTP found in store for phone: ${normalizedPhone}`);
        if (!this.redis) {
          this.logger.error(`[Verify-4] Current OTP store size: ${this.otpStore.size}`);
        }
        throw new UnauthorizedException('OTP not found or expired. Please request a new one.');
      }
      this.logger.log(`[Verify-4] OTP found - Stored OTP: ${storedData.otp}, Expires: ${storedData.expiresAt.toISOString()}, Attempts: ${storedData.attempts}/${storedData.retryLimit}`);

      // Check if OTP expired
      const now = new Date();
      this.logger.log(`[Verify-5] Checking expiration - Current: ${now.toISOString()}, Expires: ${storedData.expiresAt.toISOString()}`);
      if (now > storedData.expiresAt) {
        this.logger.error(`[Verify-5] FAILED - OTP has expired`);
        if (this.redis) {
          await this.deleteOtpRecordRedis(redisKey);
        } else {
          this.otpStore.delete(normalizedPhone);
        }
        throw new UnauthorizedException('OTP has expired. Please request a new one.');
      }
      this.logger.log(`[Verify-5] SUCCESS - OTP is still valid`);

      // Check max attempts
      this.logger.log(`[Verify-6] Checking retry limit - Attempts: ${storedData.attempts}, Limit: ${storedData.retryLimit}`);
      if (storedData.attempts >= storedData.retryLimit) {
        this.logger.error(`[Verify-6] FAILED - Max attempts exceeded`);
        if (this.redis) {
          await this.deleteOtpRecordRedis(redisKey);
        } else {
          this.otpStore.delete(normalizedPhone);
        }
        throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
      }
      this.logger.log(`[Verify-6] SUCCESS - Retry limit not exceeded`);

      // Verify OTP
      const providedOtp = otp.trim();
      this.logger.log(`[Verify-7] Comparing OTPs - Provided: ${providedOtp}, Stored: ${storedData.otp}`);
      if (storedData.otp !== providedOtp) {
        let updatedAttempts = storedData.attempts + 1;
        if (this.redis) {
          const next = await this.incrOtpAttemptsRedis(redisKey);
          if (typeof next === 'number' && Number.isFinite(next)) {
            updatedAttempts = next;
          }
        } else {
          storedData.attempts = updatedAttempts;
          this.otpStore.set(normalizedPhone, storedData);
        }
        const attemptsRemaining = Math.max(
          0,
          storedData.retryLimit - updatedAttempts
        );
        this.logger.error(`[Verify-7] FAILED - OTP mismatch. Attempts remaining: ${attemptsRemaining}`);
        if (updatedAttempts >= storedData.retryLimit) {
          if (this.redis) {
            await this.deleteOtpRecordRedis(redisKey);
          } else {
            this.otpStore.delete(normalizedPhone);
          }
        }
        throw new UnauthorizedException(
          `Invalid OTP. ${attemptsRemaining} attempts remaining.`
        );
      }
      this.logger.log(`[Verify-7] SUCCESS - OTP matches!`);

      // Delete OTP after successful verification
      this.logger.log(`[Verify-8] Deleting OTP from store...`);
      if (this.redis) {
        await this.deleteOtpRecordRedis(redisKey);
        this.logger.log(`[Verify-8] OTP deleted (Redis)`);
      } else {
        this.otpStore.delete(normalizedPhone);
        this.logger.log(`[Verify-8] OTP deleted (Remaining OTPs: ${this.otpStore.size})`);
      }

      // Loop through all companies sharing this domain to find the employee
      let employee = null;
      let resolvedCompanyId: number | null = null;
      for (const cid of allCompanyIds) {
        this.logger.log(`[Verify-9] Looking up employee by phone: ${normalizedPhone}, companyId: ${cid}`);
        employee = await this.findEmployeeByPhoneWithHrFallback(normalizedPhone, cid);
        if (employee) {
          resolvedCompanyId = cid;
          break;
        }
      }

      if (!employee) {
        this.logger.error(`[Verify-9] FAILED - Employee not found in any domain company`);
        throw new UnauthorizedException(
          'No account found with this phone number. Please contact your administrator.'
        );
      }
      this.logger.log(`[Verify-9] Employee found - PeeID: ${employee.id}`);

      // Check if account is active
      this.logger.log(`[Verify-10] Checking employee account status...`);
      if (employee.userStatusKey === USER_STATUS_DELETED) {
        this.logger.error(`[Verify-10] FAILED - Employee account is deactivated`);
        throw new UnauthorizedException('Your account has been deactivated');
      }
      this.logger.log(`[Verify-10] SUCCESS - Employee is active`);

      await this.assertEnrolledInDomainScope(configId, employee);

      // Generate JWT tokens
      this.logger.log(`[Verify-11] Generating JWT tokens...`);
      resolvedCompanyId = resolvedCompanyId ?? employee.companyId ?? null;
      const tokens = await this.getTokens(employee, {
        loginMethodCode: 'PHONE_OTP',
        companyId: resolvedCompanyId,
        configId,
      });
      this.logger.log(`[Verify-11] SUCCESS - Access & Refresh tokens generated`);

      this.logger.log(`[FINAL] OTP verification successful for PeeID: ${employee.id}`);
      this.logger.log('========== VERIFY PHONE OTP - END (SUCCESS) ==========');

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
      this.logger.error('========== VERIFY PHONE OTP - END (FAILED) ==========');
      this.logger.error(`Error Type: ${error.constructor.name}`);
      this.logger.error(`Error Message: ${error.message}`);
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
    // employee is a IbpEmployeeAuthResult — id is the pee.id used as userId in JWT
    if (!employee || !employee.id) {
      throw new BadRequestException('Invalid employee details');
    }

    const resolvedMethodCode =
      options?.loginMethodCode?.toUpperCase() || 'PHONE_OTP';
    const resolvedCompanyId = options?.companyId ?? employee.companyId ?? null;
    const resolvedConfigId = options?.configId ?? null;
    const tokenExpiry = await this.resolveTokenExpiryForMethod(
      resolvedCompanyId,
      resolvedMethodCode,
      resolvedConfigId,
    );

    // IBP JWT — userId holds pee.userId (FK to users table) for ibp-service downstream compatibility.
    // Falls back to pee.id for new employees who have no users record.
    const payload: Record<string, unknown> = {
      userDetails: {
        departmentId: null,
        emailId: employee.email,
        userId: employee.id,
        iirmId: null,
        roles: employee.roles,
        organisationId: resolvedCompanyId,
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

  private async findEmployeeByPhoneWithHrFallback(
    phone: string,
    companyId: number,
  ): Promise<IbpEmployeeAuthResult | null> {
    const pee = await this.ibpEmployeeAuthRepository.findByPhoneAndCompany(phone, companyId);
    if (pee) return pee;
    // Try all plausible formats to handle stored vs sent mismatches
    const digits = phone.replace(/\D/g, '');
    const phoneVariants = Array.from(new Set([
      phone,
      phone.startsWith('+') ? phone.slice(1) : `+${phone}`,
      // e.g. stored as bare 10-digit number, but sent as +91XXXXXXXXXX
      digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : null,
      // e.g. stored as +91XXXXXXXXXX, but sent as bare 10-digit number
      digits.length === 10 ? `+91${digits}` : null,
    ].filter(Boolean) as string[]));
    for (const variant of phoneVariants) {
      const hrUser = await this.hrUserManagementRepository.findOne({
        where: { phoneNumber: variant, companyId, deletedAt: IsNull() },
      });
      if (hrUser) return this.hrUserToAuthResult(hrUser);
    }
    return null;
  }

  /**
   * Generate a random 6-digit OTP
   */
  private generateOTP(): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`================== ${otp} ==================`)
    return otp;
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Basic validation - adjust regex based on your requirements
    // This accepts international format with optional + and country code
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }

  /**
   * Normalize phone number (remove spaces, dashes, etc.)
   */
  private normalizePhoneNumber(phone: string): string {
    return phone.replace(/[\s\-\(\)]/g, '').trim();
  }

  /**
   * Send OTP via notification service using AWS SNS
   */
  private async sendOTPViaSMS(
    phoneNumber: string,
    otp: string,
    userId: number,
    userName: string,
    expiryMinutes: number,
    companyId: number | null
  ): Promise<void> {
    this.logger.log('   --- sendOTPViaSMS: START ---');
    this.logger.log(`   Phone: ${phoneNumber}, OTP: ${otp}, UserID: ${userId}, UserName: ${userName}, Expiry: ${expiryMinutes}min, CompanyId: ${companyId}`);
    
    try {
      this.logger.log(`   [SMS-1] Notification service URL: ${this.notificationServiceUrl}/notifications`);

      // Prepare parameters for the notification template
      const parameters = {
        [SMS_OTP_KEY_1]: otp,
        [SMS_OTP_KEY_2]: expiryMinutes.toString(),
        [SMS_OTP_KEY_3]: userName,
      };
      this.logger.log(`   [SMS-2] Template parameters prepared:`);
      this.logger.log(`   - ${SMS_OTP_KEY_1}: ${parameters[SMS_OTP_KEY_1]}`);
      this.logger.log(`   - ${SMS_OTP_KEY_2}: ${parameters[SMS_OTP_KEY_2]}`);
      this.logger.log(`   - ${SMS_OTP_KEY_3}: ${parameters[SMS_OTP_KEY_3]}`);

      const requestPayload = {
        eventType: NOTIFICATION_EVENT_TYPES.SMS_OTP_LOGIN,
        phoneNumber: [phoneNumber],
        channel: NOTIFICATION_SMS,
        parameters: parameters,
        userId: [userId],
        companyId: companyId ?? undefined,
        source: "IBP",
        save: true,
      };
      this.logger.log(`   [SMS-3] Request payload prepared:`);
      this.logger.log(`   ${JSON.stringify(requestPayload, null, 2)}`);

      // Call notification service with event-based structure
      this.logger.log(`   [SMS-4] Sending POST request to notification service...`);
      const response = await axios.post(
        `${this.notificationServiceUrl}/notifications`,
        requestPayload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      this.logger.log(`   [SMS-5] Response received - Status: ${response.status}`);
      this.logger.log(`   [SMS-5] Response data: ${JSON.stringify(response.data)}`);

      if (response.status === 200 || response.status === 201) {
        const sendStatus = response.data?.data?.status;
        if (
          sendStatus === NOTIFICATION_SKIP_STATUS.DISABLED_FOR_COMPANY ||
          sendStatus === NOTIFICATION_SKIP_STATUS.DISABLED_FOR_DOMAIN ||
          sendStatus === NOTIFICATION_SKIP_STATUS.TEMPLATE_DISABLED
        ) {
          this.logger.warn(`   [SMS-6] SKIPPED - OTP SMS disabled by admin for ${phoneNumber} (${sendStatus})`);
          throw new UnauthorizedException(
            'SMS OTP login is currently disabled for your organisation. Please try a different login method.'
          );
        }
        this.logger.log(`   [SMS-6] SUCCESS - OTP SMS sent to ${phoneNumber} via notification service`);
      } else {
        this.logger.warn(`   [SMS-6] WARNING - Unexpected status: ${response.status}`);
        throw new Error('Failed to send SMS via notification service');
      }
      
      this.logger.log('   --- sendOTPViaSMS: END (SUCCESS) ---');
    } catch (error) {
      this.logger.error('   --- sendOTPViaSMS: END (FAILED) ---');
      this.logger.error(`   Error Type: ${error.constructor.name}`);
      this.logger.error(`   Error Message: ${error.message || error}`);
      
      if (axios.isAxiosError(error)) {
        this.logger.error(`   Axios error - Status: ${error.response?.status}`);
        this.logger.error(`   Axios error - Response: ${JSON.stringify(error.response?.data)}`);
        this.logger.error(`   Axios error - URL: ${error.config?.url}`);
        this.logger.error(`   Axios error - Method: ${error.config?.method}`);
      }
      
      throw new BadRequestException('Failed to send OTP SMS. Please try again later or contact support.');
    }
  }

  /**
   * Send OTP for password reset
   * @param phoneNumber - User's phone number
   */
  async sendPasswordResetOtp(
    phoneNumber: string,
    domain?: string
  ): Promise<{ message: string }> {
    try {
      // Validate phone number format
      if (!phoneNumber || !this.isValidPhoneNumber(phoneNumber)) {
        throw new BadRequestException('Invalid phone number');
      }

      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      this.logger.log(`Sending password reset OTP to phone: ${normalizedPhone}`);

      const { isCommon, allCompanyIds } =
        await this.resolveCompanyIdByDomain(domain);
      if (!domain || isCommon) {
        throw new UnauthorizedException(errorMessages.userNotFound);
      }

      // Loop through all companies sharing this domain to find the employee
      let employee = null;
      let resolvedCompanyId: number | null = null;
      for (const cid of allCompanyIds) {
        employee = await this.findEmployeeByPhoneWithHrFallback(normalizedPhone, cid);
        if (employee) {
          resolvedCompanyId = cid;
          break;
        }
      }
      if (!employee) {
        throw new UnauthorizedException(
          'No account found with this phone number. Please contact your administrator.'
        );
      }

      if (employee.userStatusKey === USER_STATUS_DELETED) {
        throw new UnauthorizedException('Your account has been deactivated');
      }

      // Generate 6-digit OTP
      const otp = this.generateOTP();
      this.logger.log(
        `[ResetOTP] Generated OTP for phone=${normalizedPhone} domain=${String(domain ?? '').trim() || 'n/a'}`,
      );
      resolvedCompanyId = resolvedCompanyId ?? employee.companyId ?? null;
      const settings = await this.resolveOtpSettings(
        resolvedCompanyId,
        "PHONE_OTP"
      );

      // Store OTP with expiration (using a different key for password reset)
      const expiresAt = new Date(
        Date.now() + settings.expiryMinutes * 60 * 1000
      );
      const record: OTPStore = {
        otp,
        identifier: normalizedPhone,
        expiresAt,
        attempts: 0,
        retryLimit: settings.retryLimit,
      };
      if (this.redis) {
        const key = this.getPhoneResetOtpKey(normalizedPhone, domain);
        await this.setOtpRecordRedis(key, record);
      } else {
        const resetKey = `reset_${normalizedPhone}`;
        this.otpStore.set(resetKey, record);
        // Clean up expired OTPs (in-memory only)
        this.cleanupExpiredOTPs();
      }

      const userName = employee.employeeName || employee.loginName || 'User';

      // Send OTP via notification service
      await this.sendOTPViaSMS(
        normalizedPhone,
        otp,
        employee.id,
        userName,
        settings.expiryMinutes,
        resolvedCompanyId
      );

      this.logger.log(`Password reset OTP sent successfully to: ${normalizedPhone}`);

      return {
        message: 'Password reset OTP sent successfully to your phone',
      };
    } catch (error) {
      this.logger.error('Failed to send password reset OTP:', error);
      throw error;
    }
  }

  /**
   * Verify password reset OTP and generate limited JWT token
   * This token has minimal permissions and is only valid for password update
   * @param phoneNumber - User's phone number
   * @param otp - OTP code entered by user
   */
  async verifyPasswordResetOtp(
    phoneNumber: string,
    otp: string,
    domain?: string
  ): Promise<{
    resetToken: string;
    userId: number;
    phoneNumber: string;
  }> {
    try {
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      const resetKey = `reset_${normalizedPhone}`;
      const resetRedisKey = this.getPhoneResetOtpKey(normalizedPhone, domain);
      this.logger.log(
        `[ResetOTP] Verify request phone=${normalizedPhone} key=${resetRedisKey}`,
      );

      const { isCommon, allCompanyIds } =
        await this.resolveCompanyIdByDomain(domain);
      if (!domain || isCommon) {
        throw new UnauthorizedException(errorMessages.userNotFound);
      }

      // Get stored OTP
      const storedData = this.redis
        ? await this.getOtpRecordRedis(resetRedisKey)
        : this.otpStore.get(resetKey);

      if (!storedData) {
        throw new UnauthorizedException('OTP not found or expired. Please request a new one.');
      }

      // Check if OTP expired
      if (new Date() > storedData.expiresAt) {
        if (this.redis) {
          await this.deleteOtpRecordRedis(resetRedisKey);
        } else {
          this.otpStore.delete(resetKey);
        }
        throw new UnauthorizedException('OTP has expired. Please request a new one.');
      }

      // Check max attempts
      if (storedData.attempts >= storedData.retryLimit) {
        if (this.redis) {
          await this.deleteOtpRecordRedis(resetRedisKey);
        } else {
          this.otpStore.delete(resetKey);
        }
        throw new UnauthorizedException('Too many failed attempts. Please request a new OTP.');
      }

      // Verify OTP
      if (storedData.otp !== otp.trim()) {
        let updatedAttempts = storedData.attempts + 1;
        if (this.redis) {
          const next = await this.incrOtpAttemptsRedis(resetRedisKey);
          if (typeof next === 'number' && Number.isFinite(next)) {
            updatedAttempts = next;
          }
        } else {
          storedData.attempts = updatedAttempts;
          this.otpStore.set(resetKey, storedData);
        }
        const attemptsRemaining = Math.max(
          0,
          storedData.retryLimit - updatedAttempts
        );
        if (updatedAttempts >= storedData.retryLimit) {
          if (this.redis) {
            await this.deleteOtpRecordRedis(resetRedisKey);
          } else {
            this.otpStore.delete(resetKey);
          }
        }
        throw new UnauthorizedException(
          `Invalid OTP. ${attemptsRemaining} attempts remaining.`
        );
      }

      this.logger.log(`Password reset OTP verified for phone: ${normalizedPhone}`);

      // Delete OTP after successful verification
      if (this.redis) {
        await this.deleteOtpRecordRedis(resetRedisKey);
      } else {
        this.otpStore.delete(resetKey);
      }

      // Loop through all companies sharing this domain to find the employee
      let employee = null;
      let resolvedCompanyId: number | null = null;
      for (const cid of allCompanyIds) {
        employee = await this.findEmployeeByPhoneWithHrFallback(normalizedPhone, cid);
        if (employee) {
          resolvedCompanyId = cid;
          break;
        }
      }

      if (!employee) {
        throw new UnauthorizedException(
          'No account found with this phone number. Please contact your administrator.'
        );
      }

      if (employee.userStatusKey === USER_STATUS_DELETED) {
        throw new UnauthorizedException('Your account has been deactivated');
      }

      resolvedCompanyId = resolvedCompanyId ?? employee.companyId ?? null;

      // Generate limited JWT token for password reset.
      // userId = pee.userId (users FK) for ibp-service compatibility; falls back to pee.id.
      const resetPayload = {
        userDetails: {
          userId: employee.id,
          emailId: employee.email,
        },
        phoneNumber: normalizedPhone,
        portal: 'IBP',
        companyId: resolvedCompanyId,
        purpose: 'password-reset',
      };

      const resetToken = await this.jwtService.signAsync(resetPayload, {
        secret: ENV.JWT_SECRET,
        expiresIn: '15m',
      });

      return {
        resetToken,
        userId: employee.id,
        phoneNumber: normalizedPhone,
      };
    } catch (error) {
      this.logger.error('Password reset OTP verification failed:', error);
      throw error;
    }
  }

  /**
   * Clean up expired OTPs from memory
   */
  private cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [identifier, data] of this.otpStore.entries()) {
      if (now > data.expiresAt) {
        this.otpStore.delete(identifier);
        this.logger.log(`Cleaned up expired OTP for: ${identifier}`);
      }
    }
  }

  /**
   * Send OTP to the email linked to the given mobile number
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

  private async sendOtpToEmailLinkedToMobile(
    user: any,
    otp: string,
    userName: string,
    expiryMinutes: number,
    domain?: string,
  ): Promise<void> {
    try {
      if (user && user.emailId) {
        const parameters = {
          ...(await this.getSupportContactParams(user.companyId)),
          [EMAIL_OTP_KEY_1]: otp,
          [EMAIL_OTP_KEY_2]: expiryMinutes.toString(),
          userName: userName,
          otpCode: otp,
        };
        const requestPayload = {
          eventType: NOTIFICATION_EVENT_TYPES.EMAIL_OTP_LOGIN || 'EMAIL_OTP_LOGIN',
          emailId: [user.emailId],
          channel: NOTIFICATION_EMAIL,
          parameters: parameters,
          userId: [user.userId],
          ...(user.companyId ? { companyId: user.companyId } : {}),
          // Same requirement as email-otp.service.ts: without domain,
          // notification-service can never resolve a config-scoped template
          // override, so this always falls back to the shared default.
          ...(domain ? { domain } : {}),
          source: "IBP",
          save: true,
        };

        this.logger.log(`[EmailOTP] Sending OTP to user email: ${user.emailId}`);
        const response = await axios.post(
          `${this.notificationServiceUrl}/notifications`,
          requestPayload,
          {
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );
        if (response.status === 200 || response.status === 201) {
          this.logger.log(`[EmailOTP] SUCCESS - OTP email sent to user: ${user.emailId}`);
          const sendStatus = response.data?.data?.status;
          if (
            sendStatus === NOTIFICATION_SKIP_STATUS.DISABLED_FOR_COMPANY ||
            sendStatus === NOTIFICATION_SKIP_STATUS.DISABLED_FOR_DOMAIN ||
            sendStatus === NOTIFICATION_SKIP_STATUS.TEMPLATE_DISABLED
          ) {
            // Fallback channel only (primary is SMS) -- log and move on, don't
            // fail the SMS OTP flow just because this secondary email is off.
            this.logger.warn(`[EmailOTP] SKIPPED - email OTP disabled by admin for ${user.emailId} (${sendStatus})`);
          } else {
            this.logger.log(`[EmailOTP] SUCCESS - OTP email sent to user: ${user.emailId}`);
          }
        } else {
          this.logger.warn(`[EmailOTP] WARNING - Unexpected status: ${response.status}`);
        }
      } else {
        this.logger.log(`[EmailOTP] No email found for user, skipping email OTP.`);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`[EmailOTP] FAILED to send OTP email: ${error.message}`);
      } else {
        this.logger.error(`[EmailOTP] FAILED to send OTP email: ${JSON.stringify(error)}`);
      }
    }
  }
}
