import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { User } from "../../../../service-lib/src/lib/entities/user";
import { ConfigCompany } from "../../../../service-lib/src/lib/entities/config-company.entity";
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import { CompanyPortalConfigScope } from "../../../../service-lib/src/lib/entities/company-portal-config-scope.entity";
import { PolicyEmployeeEnrollment } from "../../../../service-lib/src/lib/entities/policy-employee-enrollment.entity";
import { HrUserManagement } from "../../../../service-lib/src/lib/entities/hr-user-management.entity";
import { Role } from "../../../../service-lib/src/lib/entities/roles.entity";
import { UserRepository } from "./simple-auth.repository";
import { IbpEmployeeAuthRepository } from "../ibp-employee-auth/ibp-employee-auth.repository";
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { isPasswordMatch } from "../../../../service-lib/src/lib/utils/password.util";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { getAccessTokenExpiry } from "../token.constants";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  AuthSessionService,
  SESSION_REVOKED_CODE,
} from "../../../../service-lib/src/lib/auth-session/auth-session.service";
import { AuthVersionService } from "../../../../service-lib/src/lib/auth-version/auth-version.service";
import { USER_STATUS_DELETED } from "../../../../../../libs/service-lib/src/lib/constants";
@Injectable()
export class SimpleAuthService {
  private readonly logger: ReturnType<typeof createLogger>;
  // Feature-flag gate to preserve existing behavior when disabled.
  private readonly singleSessionEnabled =
    (ENV.IWORK_SINGLE_SESSION || "").toLowerCase() === "true";

  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly traceIdService: TraceIdService,
    private readonly authSessionService: AuthSessionService,
    private readonly authVersionService: AuthVersionService,
    private readonly ibpEmployeeAuthRepository: IbpEmployeeAuthRepository,
    @InjectRepository(ConfigCompany)
    private readonly configCompanyRepository: Repository<ConfigCompany>,
    @InjectRepository(HrUserManagement)
    private readonly hrUserManagementRepository: Repository<HrUserManagement>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(CompanyPortalConfigScope)
    private readonly configScopeRepository: Repository<CompanyPortalConfigScope>,
    @InjectRepository(PolicyEmployeeEnrollment)
    private readonly policyEmployeeEnrollmentRepository: Repository<PolicyEmployeeEnrollment>,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
  }

  private async resolveCompanyIdsByDomain(domain?: string | null): Promise<number[]> {
    if (!domain) return [];
    const configs = await this.configCompanyRepository.find({ where: { subDomain: domain } });
    return configs
      .filter((c) => c.companyId != null && c.isCompanyConfig !== false)
      .map((c) => c.companyId as number);
  }

  private async resolveConfigIdByDomain(domain?: string | null): Promise<number | null> {
    if (!domain) return null;
    const config = await this.configCompanyRepository.findOne({ where: { subDomain: domain } });
    return config?.id ?? null;
  }

  private async assertEnrolledInDomainScope(
    configId: number | null,
    employeeId: number,
  ): Promise<void> {
    if (!configId) return;
    const scopeRows = await this.configScopeRepository.find({
      where: { configId } as any,
      select: ['policyId'] as any,
    });
    const explicitPolicyIds = scopeRows
      .map((r: any) => r.policyId)
      .filter((id: any): id is number => id != null);
    if (explicitPolicyIds.length === 0) return;
    const enrollment = await this.policyEmployeeEnrollmentRepository
      .createQueryBuilder('pee')
      .where('pee.employeeId = :employeeId', { employeeId })
      .andWhere('pee.policyId IN (:...policyIds)', { policyIds: explicitPolicyIds })
      .getOne();
    if (!enrollment) {
      throw new UnauthorizedException(
        'You are not registered in any policies available on this portal. Please contact your administrator.',
      );
    }
  }

  async validateUser(
    loginName: string,
    password: string,
    clientScopeId?: string,
    forceLogin?: boolean,
    domain?: string,
  ): Promise<any | null> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "SimpleAuthService",
        method: "validateUser",
        payload: { loginName },
        messageData: "method invoked - supports email, username, or phone number",
      }),
    });

    // IBP portal login — route to policy_enrollment_employee
    const allCompanyIds = await this.resolveCompanyIdsByDomain(domain);
    if (allCompanyIds.length > 0) {
      const configId = await this.resolveConfigIdByDomain(domain);
      let credentialError: unknown = null;
      for (const cid of allCompanyIds) {
        try {
          return await this.validateIbpUser(loginName, password, cid, configId);
        } catch (err) {
          if (err instanceof ForbiddenException) {
            // User found in IBP but wrong credentials / deactivated — stop immediately
            credentialError = err;
            break;
          }
          // NotFoundException: user not in this company — try next company
        }
      }
      // Only block the iWork fallback if the user was actually found in an IBP company
      if (credentialError) throw credentialError;
      // If no IBP company had this user, fall through to iWork login below
    }

    // iWork login — use users table
    try {
      const user = await this.userRepository.findByLoginNameOrEmail(loginName);
      if (!user) {
        throw new NotFoundException(errorMessages.userNotFound);
      }
      if (user && (await isPasswordMatch(password, user.password ?? ""))) {
        // Check if password has expired
        if (user.passwordExpiresAt && new Date() > new Date(user.passwordExpiresAt)) {
          this.logger.warn({
            level: "warn",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId: user.userId,
              status: "failure",
              location: "SimpleAuthService",
              method: "validateUser",
              payload: { loginName },
              messageData: "Password has expired",
            }),
          });
          throw new ForbiddenException({
            statusCode: 403,
            message: "Your password has expired. Please reset your password.",
            passwordExpired: true,
            userId: user.userId,
            emailId: user.emailId,
          });
        }

        // Only enforce single-session when the flag is enabled.
        const scopeId = this.singleSessionEnabled
          ? clientScopeId?.trim()
          : undefined;
        let sessionId: string | undefined;
        if (scopeId) {
          const session = await this.authSessionService.establishSession(
            user.userId,
            scopeId,
            forceLogin
          );
          if (session.blockedByActiveSession && !forceLogin) {
            throw new ForbiddenException(
              "This account is already signed in on another browser. Please sign out there and try again."
            );
          }
          if (session.revokedSessionId) {
            this.logger.warn({
              level: "warn",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                userId: user.userId,
                status: "success",
                location: "SimpleAuthService",
                method: "validateUser",
                payload: {
                  revokedSessionId: session.revokedSessionId,
                  clientScopeId: scopeId,
                },
                messageData: "Previous session revoked due to new login scope",
              }),
            });
          }
          sessionId = session.sessionId;
        }
        let accessToken;
        try {
          accessToken = await this.getTokens(user as User, sessionId);
        } catch (tokenError) {
          // Do NOT call clearActiveSession here.
          // The session was already successfully established in Redis.
          // Clearing it on a token generation failure would wipe out the newly
          // created session, leaving Redis with no active session for the user
          // and effectively logging out both browsers instead of just the old one.
          throw tokenError;
        }
        delete user.password;
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId: user.userId,
            status: "success",
            location: "SimpleAuthService",
            method: "validateUser",
            payload: { loginName },
            messageData: sessionId
              ? "Access token generated (single-session enforced)"
              : "Access token generated",
          }),
        });
        // Prevent scheduler from logging in
        if (loginName === `${ENV.SCHEDULER_LOGIN_USERNAME}`) {
          throw new ForbiddenException(errorMessages.unauthorizedUser);
        }
        // Keep returning user + token to avoid breaking existing consumers.
        return { user, accessToken };
      }
      throw new ForbiddenException(errorMessages.invalidCredentials);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          method: "validateUser",
          payload: { loginName },
          status: "failure",
          location: "SimpleAuthService",
          messageData: error?.message || error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error?.message || errorMessages.internalServerError
      );
    }
  }

  private async validateIbpUser(
    loginName: string,
    password: string,
    companyId: number,
    configId?: number | null,
  ): Promise<any> {
    const employee = await this.ibpEmployeeAuthRepository.findByIdentifierAndCompany(loginName, companyId);

    if (!employee) {
      // Fallback: check hr_user_management for EXTERNAL_HR users
      return this.validateExternalHrUser(loginName, password, companyId, configId);
    }

    if (employee.userStatusKey === USER_STATUS_DELETED) {
      throw new ForbiddenException(errorMessages.unauthorizedUser);
    }
    if (!(await isPasswordMatch(password, employee.ibpPassword ?? ""))) {
      throw new ForbiddenException(errorMessages.invalidCredentials);
    }
    if (employee.passwordExpiresAt && new Date() > new Date(employee.passwordExpiresAt)) {
      throw new ForbiddenException({
        statusCode: 403,
        message: "Your password has expired. Please reset your password.",
        passwordExpired: true,
        userId: employee.id,
        emailId: employee.email,
      });
    }
    await this.assertEnrolledInDomainScope(configId ?? null, employee.id);
    const accessToken = await this.getIbpTokens(employee, companyId, configId);
    return { user: { id: employee.id, email: employee.email, loginName: employee.loginName, phoneNumber: employee.phoneNumber }, accessToken };
  }

  private async validateExternalHrUser(
    loginName: string,
    password: string,
    companyId: number,
    configId?: number | null,
  ): Promise<any> {
    const { IsNull } = await import("typeorm");
    const hrUser = await this.hrUserManagementRepository.findOne({
      where: [
        { loginName, companyId, deletedAt: IsNull() },
        { emailId: loginName.toLowerCase().trim(), companyId, deletedAt: IsNull() },
      ],
    });
    if (!hrUser) {
      throw new NotFoundException(errorMessages.userNotFound);
    }
    if (hrUser.userStatusKey === USER_STATUS_DELETED) {
      throw new ForbiddenException(errorMessages.unauthorizedUser);
    }
    if (!(await isPasswordMatch(password, hrUser.password ?? ""))) {
      throw new ForbiddenException(errorMessages.invalidCredentials);
    }
    if (hrUser.passwordExpiresAt && new Date() > new Date(hrUser.passwordExpiresAt)) {
      throw new ForbiddenException({
        statusCode: 403,
        message: "Your password has expired. Please reset your password.",
        passwordExpired: true,
        userId: hrUser.id,
        emailId: hrUser.emailId,
      });
    }
    console.log('[EXTERNAL_HR] hrUser.roleKey:', hrUser.roleKey);
    const roleRecordExact = hrUser.roleKey
      ? await this.roleRepository.findOne({ where: { roleKey: hrUser.roleKey } })
      : null;
    console.log('[EXTERNAL_HR] roleRecordExact:', roleRecordExact);
    const roleRecordPrefixed = (!roleRecordExact && hrUser.roleKey)
      ? await this.roleRepository.findOne({ where: { roleKey: `ROLE_${hrUser.roleKey}` } })
      : null;
    console.log('[EXTERNAL_HR] roleRecordPrefixed:', roleRecordPrefixed);
    const roleRecord = roleRecordExact ?? roleRecordPrefixed;
    console.log('[EXTERNAL_HR] final roleRecord:', roleRecord);
    const roles = roleRecord
      ? [{ id: roleRecord.id, name: roleRecord.name, role_key: roleRecord.roleKey }]
      : [{ id: 0, name: hrUser.roleKey ?? 'EXTERNAL_HR', role_key: hrUser.roleKey ?? 'EXTERNAL_HR' }];
    console.log('[EXTERNAL_HR] roles in JWT:', JSON.stringify(roles));
    const accessToken = await this.getIbpTokens(
      { id: hrUser.id, email: hrUser.emailId ?? null, roles, companyId: hrUser.companyId ?? companyId, authVersion: hrUser.authVersion ?? 1 },
      hrUser.companyId ?? companyId,
      configId,
    );
    return { user: { id: hrUser.id, email: hrUser.emailId, loginName: hrUser.loginName, phoneNumber: hrUser.phoneNumber }, accessToken };
  }

  private async getIbpTokens(
    employee: { id: number; email: string | null; roles: any[]; companyId: number; authVersion: number },
    companyId: number,
    configId?: number | null,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: Record<string, unknown> = {
      userDetails: {
        emailId: employee.email,
        userId: employee.id,
        roles: employee.roles,
        organisationId: companyId,
        authVersion: employee.authVersion,
      },
      portal: "IBP",
      companyId,
      configId: configId ?? null,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: getAccessTokenExpiry() as any }),
      this.jwtService.signAsync(payload, { expiresIn: ENV.JWT_REFRESH_EXPIRATION as any }),
    ]);
    return { accessToken, refreshToken };
  }

  /**
   * Generates access and refresh tokens for a user.
   * @param {User} userDetails - The user entity.
   * @returns {Promise<{ accessToken: string; refreshToken: string }>} Tokens object.
   */
  async getTokens(
    userDetails: User,
    sessionId?: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId: userDetails?.userId,
        status: "success",
        location: "SimpleAuthService",
        method: "getTokens",
        payload: { userId: userDetails?.userId },
        messageData: "method invoked",
      }),
    });
    try {
      // Validate user details
      if (!userDetails) {
        throw new ForbiddenException(
          "User details are required to generate tokens."
        );
      }

      if (!userDetails.userId) {
        throw new ForbiddenException("User ID is missing in user details.");
      }

      // Get fresh auth version from database (not from cached user object)
      const freshAuthVersion = await this.authVersionService.getAuthVersion(userDetails.userId);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userDetails.userId,
          status: "success",
          location: "SimpleAuthService",
          method: "getTokens",
          payload: { 
            userId: userDetails.userId,
            cachedAuthVersion: userDetails.authVersion ? Number(userDetails.authVersion) : 1,
            freshAuthVersion: freshAuthVersion,
            authVersionSource: "AuthVersionService.getAuthVersion()"
          },
          messageData: "Auth version comparison for JWT token generation",
        }),
      });

      // Prepare the payload for the tokens
      // Include session id only when single-session is enabled.
      const payload = {
        userDetails: {
          departmentId: userDetails.departmentId,
          emailId: userDetails.emailId,
          userId: userDetails.userId,
          iirmId: userDetails.iirmEmpId,
          roles: userDetails?.roles,
          organisationId: userDetails?.organisationId,
          authVersion: freshAuthVersion, // Use fresh auth version from database
        },
        ...(this.singleSessionEnabled && sessionId ? { sid: sessionId } : {}),
      };

      // Generate access token
      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: getAccessTokenExpiry(), // Access token expiration time
      });

      // Generate refresh token
      const refreshToken = await this.jwtService.signAsync(payload, {
        expiresIn: ENV.JWT_REFRESH_EXPIRATION, // Refresh token expiration time
      });
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userDetails.userId,
          status: "success",
          location: "SimpleAuthService",
          method: "getTokens",
          payload: { userId: userDetails.userId },
          messageData: "Access token generated",
        }),
      });
      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userDetails?.userId,
          status: "failure",
          location: "SimpleAuthService",
          method: "getTokens",
          payload: { userId: userDetails?.userId },
          messageData: error,
        }),
      });
      throw new ForbiddenException(
        error.message || "An error occurred while generating tokens."
      );
    }
  }

  /**
   * Validates the refresh token and generates a new access token.
   * @param {string} refreshToken - The refresh token to validate.
   * @returns {Promise<{ accessToken: string }>} - The new access token.
   */
  async validateRefreshTokenAndGenerateAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "SimpleAuthService",
        method: "validateRefreshTokenAndGenerateAccessToken",
        payload: { refreshToken },
        messageData: "method invoked",
      }),
    });
    try {
      // Validate input
      if (!refreshToken?.trim()) {
        throw new ForbiddenException("Refresh token is required.");
      }

      // Verify the refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken);

      if (!payload || !payload.userDetails) {
        throw new ForbiddenException("Invalid refresh token.");
      }

      // Extract user details from the payload
      const userDetails = payload.userDetails;
      const sessionId = payload.sid as string | undefined;

      // Validate user details
      if (!userDetails.userId) {
        throw new ForbiddenException("Invalid user details in refresh token.");
      }

      // Validate session only when enabled; otherwise preserve old refresh flow.
      if (this.singleSessionEnabled && sessionId) {
        const validation = await this.authSessionService.validateSession(
          Number(userDetails.userId),
          sessionId
        );
        if (!validation.valid) {
          throw new UnauthorizedException({
            code: validation.code || SESSION_REVOKED_CODE,
            message:
              validation.message ||
              "You were signed out because your account was used to sign in from another browser.",
          });
        }
      }

      // Generate a new access token
      const newAccessToken = await this.jwtService.signAsync(
        {
          userDetails,
          ...(this.singleSessionEnabled && sessionId ? { sid: sessionId } : {}),
        },
        { expiresIn: getAccessTokenExpiry() } // Access token expiration time
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userDetails.userId,
          status: "success",
          location: "SimpleAuthService",
          method: "validateRefreshTokenAndGenerateAccessToken",
          payload: { refreshToken },
          messageData: "Access token generated",
        }),
      });
      return { accessToken: newAccessToken };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "SimpleAuthService",
          method: "validateRefreshTokenAndGenerateAccessToken",
          payload: { refreshToken },
          messageData: error,
        }),
      });
      if (error.name === "TokenExpiredError") {
        throw new UnauthorizedException("Refresh token has expired.");
      } else if (error.name === "JsonWebTokenError") {
        throw new ForbiddenException("Invalid refresh token.");
      }
      throw new ForbiddenException(
        error.message || "An error occurred while validating the refresh token."
      );
    }
  }
  async getUserDetails(userId: number): Promise<any | null> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "SimpleAuthService",
        method: "getUserDetails",
        payload: { userId },
        messageData: "method invoked",
      }),
    });
    try {
      const userDetails = await this.userRepository.findById(userId);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "SimpleAuthService",
          method: "getUserDetails",
          payload: { userId },
          messageData: successMessage.userDetailsRetrieved,
        }),
      });
      return userDetails;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "SimpleAuthService",
          method: "getUserDetails",
          payload: { userId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async logout(userId: number): Promise<void> {
    this.logger.log({
      level: 'info',
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: 'success',
        location: 'SimpleAuthService',
        method: 'logout',
        payload: { userId },
        messageData: 'method invoked',
      }),
    });
    await this.userRepository.logout(userId);
  }

  async logoutSession(userId: number, sessionId?: string): Promise<void> {
    await this.authSessionService.logoutSession(userId, sessionId);
  }

  async forceLogoutByLoginName(loginName: string): Promise<void> {
    const user = await this.userRepository.findByLoginNameOrEmail(loginName);
    if (!user?.userId) {
      throw new NotFoundException(errorMessages.userNotFound);
    }
    await this.authSessionService.clearActiveSession(user.userId);
  }

  async generateCrmRedirectToken(
    callerUserId: number,
    companyId: number,
  ): Promise<{ accessToken: string; portalUrl: string | null }> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      select: ["id", "leadCrm", "companyName"],
    });
    if (!company) {
      throw new NotFoundException(`Company ${companyId} not found.`);
    }
    if (company.leadCrm !== callerUserId && callerUserId !== -1) {
      throw new ForbiddenException("You are not the lead CRM for this company.");
    }
    const callerUser = await this.userRepository.findById(callerUserId);
    const crmRole = await this.roleRepository.findOne({ where: { roleKey: "PORTAL_CRM" } });

    // Create hr_user_management record for this CRM user if one doesn't exist yet.
    // This lets company-employee-details return real name/email/roleKey without bypasses.
    const { IsNull } = await import("typeorm");
    const existingHrRecord = await this.hrUserManagementRepository.findOne({
      where: { userId: callerUserId, deletedAt: IsNull() },
    });
    if (!existingHrRecord) {
      const fullName = [callerUser?.firstName, callerUser?.lastName].filter(Boolean).join(" ");
      await this.hrUserManagementRepository.save({
        userId: callerUserId,
        userName: fullName || null,
        emailId: callerUser?.emailId ?? null,
        loginName: callerUser?.emailId ?? null,
        companyId,
        companyName: company.companyName ?? null,
        roleKey: "PORTAL_CRM",
        userStatusKey: "USER_STATUS_ACTIVE",
        createdBy: callerUserId,
        updatedBy: callerUserId,
      });
    }

    const payload = {
      userDetails: {
        userId: callerUserId,
        firstName: callerUser?.firstName ?? null,
        lastName: callerUser?.lastName ?? null,
        emailId: callerUser?.emailId ?? null,
        roles: [{ id: crmRole?.id ?? null, roleKey: "PORTAL_CRM" }],
        organisationId: companyId,
      },
      portal: "HR",
      companyId,
      companyName: company.companyName ?? null,
      roleKey: "PORTAL_CRM",
    };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: "1h" });

    const portalRows = await this.configCompanyRepository.query(
      `SELECT company_portal_url FROM company_portal_configuration WHERE company_id = $1 AND deleted_at IS NULL LIMIT 1`,
      [companyId],
    );
    const portalUrl: string | null = portalRows[0]?.company_portal_url ?? null;

    return { accessToken, portalUrl };
  }
}
