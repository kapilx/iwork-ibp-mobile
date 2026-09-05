import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { Not, Raw, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../../../../service-lib/src/lib/entities/user";
import { Role } from "../../../../service-lib/src/lib/entities/roles.entity";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { USER_STATUS_DELETED } from "../../../../../../libs/service-lib/src/lib/constants";

@Injectable()
export class UserRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.AUTH_SERVICE);
  }

  /**
   * Finds a user by login name, email, or phone number and selects only emailId, mobile, and loginName.
   * @param loginName - The login name, email, or phone number of the user.
   * @returns The user entity with selected fields or null if not found.
   */
  async findByLoginNameOrEmail(
    loginName: string
  ): Promise<(Partial<User> & { roles: Partial<Role>[] }) | null> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "UserRepository",
        method: "findByLoginNameOrEmail",
        payload: { loginName },
        messageData: "method invoked",
      }),
    });
    try {
      const userName = loginName.trim().toLowerCase();

      const user = await this.userRepository.findOne({
        where: [
          { emailId: userName, userStatusKey: Not(USER_STATUS_DELETED) },
          { loginName: Raw(alias => `LOWER(TRIM(${alias})) = :loginName`, { loginName: userName }), userStatusKey: Not(USER_STATUS_DELETED) },
          { mobile: loginName.trim(), userStatusKey: Not(USER_STATUS_DELETED) },
        ],
        relations: ["userRoles", "userRoles.role"],
      });

      if (user) {
        // Ensure userRoles is defined and filter out undefined roles
        const roles = (user.userRoles || [])
          .filter((userRole) => userRole?.role) // Filter out undefined roles
          .map((userRole) => ({
            id: userRole.role.id,
            name: userRole.role.name,
            role_key: userRole.role.roleKey,
          }));

        const result = {
          userId: user.userId,
          salutation: user.salutation,
          firstName: user.firstName,
          lastName: user.lastName,
          emailId: user.emailId,
          mobile: user.mobile,
          passwordExpiresAt: user.passwordExpiresAt,
          // loginName: user.loginName,
          password: user.password,
          organisationId: user.organisationId,
          authVersion: user.authVersion ? Number(user.authVersion) : 1, // Include auth version for logout on role changes
          roles,
          ibpPassword: user.ibpPassword,
        };
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "UserRepository",
            method: "findByLoginNameOrEmail",
            payload: { loginName },
            messageData: "User retrieved",
          }),
        });
        return result;
      }

      throw new NotFoundException(errorMessages.userNotFound);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          method: "findByLoginNameOrEmail",
          payload: { loginName },
          status: "failure",
          location: "UserRepository",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(errorMessages.failedToFindUser);
    }
  }

  async findById(userId: number): Promise<User | null> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "UserRepository",
        method: "findById",
        payload: { userId },
        messageData: "method invoked",
      }),
    });
    try {
      const user = await this.userRepository.findOne({
        where: { userId },
        relations: [
          "designation",
          "userRoles",
          "userRoles.role",
          "salutation",
          "organisation.country",
        ],
      });
      if (user) {
        // Ensure userRoles is defined and filter out undefined roles
        const roles = (user.userRoles || [])
          .filter((userRole) => userRole?.role)
          .map((userRole) => ({
            id: userRole.role.id,
            name: userRole.role.name,
            description: userRole.role.description,
          }));
        const country = user.organisation?.country;
        let currency = null;
        if (country && country.id) {
          currency = await this.userRepository.manager.findOne("Currency", {
            where: { countryId: country.id },
          });
          if (currency) {
            currency = {
              id: currency?.id,
              name: currency?.name,
              value: currency?.value,
              description: currency?.description,
            };
          }
        }
        const result = {
          userId: user.userId,
          salutation: user.salutation
            ? {
                id: user.salutation.id,
                lookUpValue: user.salutation.lookUpValue,
              }
            : null,
          firstName: user.firstName,
          lastName: user.lastName,
          emailId: user.emailId,
          mobile: user.mobile,
          // loginName: user.loginName,
          authVersion: user.authVersion ? Number(user.authVersion) : 1, // Include auth version for logout on role changes
          roles,
          organisationId: user.organisationId,
          organisationName: user.organisation.name,
          country,
          currency,
          designation: user.designation ? user.designation.name : null,
          organisationKey: user.organisation.organisationKey,
          ibpPassword: user.ibpPassword,
        };
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "success",
            location: "UserRepository",
            method: "findById",
            payload: { userId },
            messageData: "User retrieved",
          }),
        });
        return result;
      }
      throw new NotFoundException(errorMessages.userNotFound);
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "failure",
            location: "UserRepository",
            method: "findById",
            payload: { userId },
            messageData: error,
          }),
        });
        throw error;
      }
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "UserRepository",
          method: "findById",
          payload: { userId },
          messageData: error,
        }),
      });
      throw new BadRequestException(errorMessages.failedToFindUser);
    }
  }

  async findByEmail(
    email: string
  ): Promise<(Partial<User> & { roles: Partial<Role>[] }) | null> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "UserRepository",
        method: "findByEmail",
        payload: { email },
        messageData: "method invoked",
      }),
    });

    try {
      const normalizedEmail = email.trim().toLowerCase();

      const user = await this.userRepository.findOne({
        where: {
          emailId: Raw(
            (alias) => `LOWER(TRIM(${alias})) = :email`,
            { email: normalizedEmail }
          ),
          userStatusKey: Not(USER_STATUS_DELETED),
        },
        relations: ["userRoles", "userRoles.role"],
      });

      if (user) {
        const roles = (user.userRoles || [])
          .filter((userRole) => userRole?.role)
          .map((userRole) => ({
            id: userRole.role.id,
            name: userRole.role.name,
            role_key: userRole.role.roleKey,
          }));

        const result = {
          userId: user.userId,
          salutation: user.salutation,
          firstName: user.firstName,
          lastName: user.lastName,
          emailId: user.emailId,
          mobile: user.mobile,
          password: user.password,
          organisationId: user.organisationId,
          isTCAccepted: user.isTCAccepted,
          tcAcceptedVersion: user.tcAcceptedVersion,
          roles,
          ibpPassword: user.ibpPassword,
        };

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "UserRepository",
            method: "findByEmail",
            payload: { email },
            messageData: "User retrieved",
          }),
        });

        return result;
      }

      return null;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          method: "findByEmail",
          payload: { email },
          status: "failure",
          location: "UserRepository",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(errorMessages.failedToFindUser);
    }
  }

  /**
   * Find user by phone number for OTP authentication
   * @param phoneNumber - The phone number of the user (should be in E.164 format)
   * @returns The user entity or null if not found
   */
  async findByPhoneNumber(phoneNumber: string): Promise<(Partial<User> & { roles: Partial<Role>[] }) | null> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "UserRepository",
        method: "findByPhoneNumber",
        payload: { phoneNumber },
        messageData: "method invoked",
      }),
    });

    try {
      const user = await this.userRepository.findOne({
        where: { mobile: phoneNumber, userStatusKey: Not(USER_STATUS_DELETED) },
        relations: ["userRoles", "userRoles.role"],
      });
      
      if (user) {
        // Ensure userRoles is defined and filter out undefined roles
        const roles = (user.userRoles || [])
          .filter((userRole) => userRole?.role) // Filter out undefined roles
          .map((userRole) => ({
            id: userRole.role.id,
            name: userRole.role.name,
            role_key: userRole.role.roleKey,
          }));

        const result = {
          userId: user.userId,
          salutation: user.salutation,
          firstName: user.firstName,
          lastName: user.lastName,
          emailId: user.emailId,
          mobile: user.mobile,
          // loginName: user.loginName,
          password: user.password,
          organisationId: user.organisationId,
          isTCAccepted: user.isTCAccepted,
          tcAcceptedVersion: user.tcAcceptedVersion,
          roles,
          ibpPassword: user.ibpPassword,
        };
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "UserRepository",
            method: "findByLoginNameOrEmail",
            payload: { phoneNumber },
            messageData: "User retrieved",
          }),
        });
        return result;
      }
      return null;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          method: "findByPhoneNumber",
          payload: { phoneNumber },
          status: "failure",
          location: "UserRepository",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(errorMessages.failedToFindUser);
    }
  }

  async logout(userId: number): Promise<void> {
    // Placeholder for logout logic like updating tokens or session state
    // Currently no specific action is required
    return;
  }
}
