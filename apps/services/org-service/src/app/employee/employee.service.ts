import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { PasswordValidationUtil, PasswordRuleDefinition } from '../../../../service-lib/src/lib/utils/password-validation.util';
import { JwtService } from "@nestjs/jwt";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { ManualDeactivateDto } from "./dto/deactivate-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { EmployeeDto } from "./dto/employee.dto";
import { EmployeeRepository } from "./employee.repository";
import {
  infoMessages,
  successMessage,
  errorMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  haveSameValues,
  mapSearchParams,
  mapSortParams,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import {
  IBP_PASSWORD_RESET_EVENT,
  NOTIFICATION_EMAIL,
  NOTIFICATION_SKIP_STATUS,
  PASSWORD_RESET_EVENT,
  PASSWORD_RESET_KEY_1,
  PASSWORD_RESET_KEY_2,
  PASSWORD_RESET_KEY_3,
  serviceNames,
  USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
} from "../../../../service-lib/src/lib/constants";
import {
  BOOLEAN_VALUES,
  ENTITY_NAME,
  LOOK_UP_DATA,
  MASTER_DATA,
  USER_STATUS_INACTIVE,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { MasterValidationService } from "../../../../service-lib/src/lib/utils/masters-validation";
import {
  ConfigCompany,
  HrUserManagement,
  PolicyEnrollmentEmployee,
  User,
  Employee,
  PasswordHistory,
  UsedResetToken,
} from "../../../../service-lib/src/lib/entities";
import { HrUserManagement } from "../../../../service-lib/src/lib/entities/hr-user-management.entity";
import {
  hashPassword,
  isPasswordMatch,
  validatePassword,
} from "../../../../service-lib/src/lib/utils/password.util";
import { NotificationUtils } from "../../../../service-lib/src/lib/utils/notification.utils";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { TraceHttpService } from "../../../../service-lib/src/lib/trace-http.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { In, IsNull, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { AuthVersionService } from "../../../../service-lib/src/lib/auth-version/auth-version.service";
import * as bcrypt from "bcryptjs";

@Injectable()
export class EmployeeService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly employeeRepository: EmployeeRepository,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(PolicyEnrollmentEmployee)
    private readonly companyEmployeeRepository: Repository<PolicyEnrollmentEmployee>,
    @InjectRepository(ConfigCompany)
    private readonly configCompanyRepository: Repository<ConfigCompany>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(PasswordHistory)
    private readonly passwordHistoryRepository: Repository<PasswordHistory>,
    @InjectRepository(UsedResetToken)
    private readonly usedResetTokenRepository: Repository<UsedResetToken>,
    @InjectRepository(HrUserManagement)
    private readonly hrUserManagementRepository: Repository<HrUserManagement>,
    private readonly lookUpValidation: LookUpValidationService,
    private readonly masterValidation: MasterValidationService,
    private readonly jwtService: JwtService,
    private readonly notificationUtils: NotificationUtils,
    private readonly traceIdService: TraceIdService,
    private readonly traceHttpService: TraceHttpService,
    private readonly authVersionService: AuthVersionService, // Add AuthVersionService injection
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Delegates the creation of a new employee to the employee repository.
   */
  async addEmployee(createEmployeeObject: CreateEmployeeDto, userId: number) {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        createEmployeeObject,
        LOOK_UP_DATA
      );
      await this.masterValidation.validateMasterIds(
        createEmployeeObject,
        MASTER_DATA
      );
      const employee = await this.employeeRepository.addEmployee(
        createEmployeeObject,
        userId
      );
      // if (employee?.userId && employee?.emailId) {
      //   const token = this.generatePasswordResetToken(
      //     employee.emailId,
      //     employee.userId
      //   );
      //   await this.sendPasswordResetMail(
      //     employee.emailId,
      //     employee.userId,
      //     employee.firstName
      //   );
      // }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "EmployeeService",
          method: "addEmployee",
          messageData: "Employee added successfully",
        }),
      });
      return employee;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "EmployeeService",
          method: "addEmployee",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async inceptionCreateEmployee(
    employees: CreateEmployeeDto[],
    userId: number
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "EmployeeService",
        method: "inceptionCreateEmployee",
        messageData: "method invoked",
      }),
    });

    if (!Array.isArray(employees) || employees.length === 0) {
      throw new BadRequestException("No employees provided");
    }

    const results = await Promise.all(
      employees.map(async (employeeDto) => {
        try {
          const employeeData = await this.addEmployee(employeeDto, userId);
          return {
            status: "success",
            data: {
              id: employeeData?.employeeId,
              firstName: employeeData?.firstName,
              lastName: employeeData?.lastName,
            },
            message: successMessage.employeeCreation,
          };
        } catch (err) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "failure",
              location: "EmployeeService",
              method: "inceptionCreateEmployee",
              payload: { employeeDto },
              messageData: err,
            }),
          });
          return {
            status: "failure",
            message:
              err instanceof Error
                ? err.message
                : errorMessages.employeeCreationFailed,
            payload: employeeDto,
          };
        }
      })
    );

    return results;
  }

  /**
   * Retrieval of all Employee records by delegating the operation to the employee repository
   */
  async getEmployees(
    sort: string,
    search: string,
    searchBy: string,
    page: number,
    limit: number
  ): Promise<{ data: EmployeeDto[]; count: number; inactiveCount: number }> {
    try {
      const searchParams = search ? mapSearchParams(search) : undefined;
      const sortParams = sort
        ? mapSortParams(sort, ENTITY_NAME.EMPLOYEE.toUpperCase())
        : undefined;
      const { data, count, inactiveCount } = await this.employeeRepository.getEmployees(
        sortParams,
        searchParams,
        searchBy,
        page,
        limit
      );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeService",
          method: "getEmployees",
          messageData: `Fetched ${count} employees`,
        }),
      });
      return { data, count, inactiveCount };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "getEmployees",
          messageData: error,
        }),
      });
      throw new NotFoundException(infoMessages.employeeNotFound);
    }
  }

  /**
   * Retrieve a single Employee record by ID by delegating the operation to the employee repository
   */
  /**
   * Logged-in user's own record. Keyed by user id, not employee id.
   */
  async getMyProfile(userId: number) {
    const employeeId = await this.employeeRepository.findEmployeeIdByUserId(
      userId
    );
    if (!employeeId) {
      throw new NotFoundException(infoMessages.employeeNotFound);
    }
    return this.getEmployeeById(employeeId);
  }

  async getEmployeeById(employeeId: number) {
    try {
      const employee = await this.employeeRepository.getEmployeeById(
        employeeId
      );
      if (!employee) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "EmployeeService",
            method: "getEmployeeById",
            messageData: `Employee not found for ID: ${employeeId}`,
          }),
        });
        throw new NotFoundException(infoMessages.employeeNotFound);
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeService",
          method: "getEmployeeById",
          messageData: `Fetched employee with ID: ${employeeId}`,
        }),
      });
      return employee;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "getEmployeeById",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Retrieve a single Employee record by email_id by delegating the operation to the employee repository
   */
  async getEmployeeByEmailId(emailId: string) {
    try {
      const employee = await this.employeeRepository.getEmployeeByEmailId(
        emailId
      );
      if (!employee) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "EmployeeService",
            method: "getEmployeeByEmailId",
            messageData: `Employee not found for email: ${emailId}`,
          }),
        });
        throw new NotFoundException(infoMessages.employeeNotFound);
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeService",
          method: "getEmployeeByEmailId",
          messageData: `Fetched employee with email: ${emailId}`,
        }),
      });
      return employee;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "getEmployeeByEmailId",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Retrieve a single Employee record by email_id by delegating the operation to the employee repository
   */
  async getUserByEmailId(emailId: string): Promise<User> {
    try {
      // Only used for COMBINED users (IIRM + Company). Pure COMPANY_EMPLOYEE no longer has a users record.
      const employee = await this.userRepository
        .createQueryBuilder("user")
        .where("LOWER(TRIM(user.emailId)) = :emailId", {
          emailId: emailId.trim().toLowerCase(),
        })
        .andWhere("user.userTypeKey IN (:...userTypeKeys)", {
          userTypeKeys: [
            USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
          ],
        })
        .getOne();
      if (!employee) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "EmployeeService",
            method: "getUserByEmailId",
            messageData: `Employee not found for email: ${emailId}`,
          }),
        });
        throw new NotFoundException(infoMessages.employeeNotFound);
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeService",
          method: "getUserByEmailId",
          messageData: `Fetched employee with email: ${emailId}`,
        }),
      });
      return employee;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "getUserByEmailId",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getUserForIbpPasswordReset(
    identifier: string,
    methodCode?: string,
    domain?: string,
  ): Promise<{ emailId: string; userId: number; firstName: string }> {
    const normalizedIdentifier = String(identifier || "").trim();
    const normalizedMethodCode = String(methodCode || "").trim().toUpperCase();

    // Resolve companyId from domain — required to scope the lookup to one company
    const { companyId, allCompanyIds } = domain ? await this.resolveCompanyIdByDomain(domain) : { companyId: null, allCompanyIds: [] };
    console.log(`[getUserForIbpPasswordReset] identifier=${identifier} domain=${domain} companyId=${companyId} allCompanyIds=${allCompanyIds}`);

    if (normalizedMethodCode === "PHONE_PASSWORD") {
      // Phone-based reset — query pee by phone, scoped by companyId if available
      const normalizedPhone = normalizedIdentifier;
      const pee = companyId
        ? await this.companyEmployeeRepository.findOne({
            where: { phoneNumber: normalizedPhone, companyId },
            order: { id: "DESC" },
          })
        : await this.companyEmployeeRepository.findOne({
            where: { phoneNumber: normalizedPhone },
            order: { id: "DESC" },
          });

      if (pee) {
        if (pee.userStatusKey === USER_STATUS_INACTIVE) {
          throw new ForbiddenException("Your account has been blocked by the organisation. Please contact your HR.");
        }
        if (!pee.email?.trim()) {
          throw new BadRequestException("Employee email not found");
        }
        return { emailId: pee.email, userId: pee.id, firstName: pee.employeeName ?? "" };
      }

      // EXTERNAL_HR fallback — search across all companies on this domain
      const phoneCompanyFilter = allCompanyIds.length > 0
        ? (allCompanyIds.length === 1 ? allCompanyIds[0] : In(allCompanyIds))
        : undefined;
      const hrUser = phoneCompanyFilter != null
        ? await this.hrUserManagementRepository.findOne({
            where: { phoneNumber: normalizedPhone, companyId: phoneCompanyFilter as any, deletedAt: IsNull() },
          })
        : await this.hrUserManagementRepository.findOne({
            where: { phoneNumber: normalizedPhone, deletedAt: IsNull() },
          });

      if (hrUser) {
        if (!hrUser.emailId?.trim()) {
          throw new BadRequestException("Employee email not found");
        }
        return { emailId: hrUser.emailId, userId: hrUser.id, firstName: hrUser.userName ?? "" };
      }

      throw new NotFoundException(infoMessages.employeeNotFound);
    }

    // Email-based reset — try pee scoped by companyId first, then globally.
    // IBP employees are always in policy_enrollment_employee, never in the users table.
    const pee = companyId
      ? await this.companyEmployeeRepository.findOne({
          where: { email: normalizedIdentifier, companyId },
          order: { id: "DESC" },
        }) ?? await this.companyEmployeeRepository.findOne({
          where: { email: normalizedIdentifier },
          order: { id: "DESC" },
        })
      : await this.companyEmployeeRepository.findOne({
          where: { email: normalizedIdentifier },
          order: { id: "DESC" },
        });

    if (pee) {
      if (pee.userStatusKey === USER_STATUS_INACTIVE) {
        throw new ForbiddenException("Your account has been blocked by the organisation. Please contact your HR.");
      }
      return { emailId: pee.email ?? normalizedIdentifier, userId: pee.id, firstName: pee.employeeName ?? "" };
    }

    // EXTERNAL_HR fallback — search across all companies on this domain
    const companyIdFilter = allCompanyIds.length > 0
      ? (allCompanyIds.length === 1 ? allCompanyIds[0] : In(allCompanyIds))
      : undefined;
    const hrUser = companyIdFilter != null
      ? await this.hrUserManagementRepository.findOne({
          where: [
            { emailId: normalizedIdentifier, companyId: companyIdFilter as any, deletedAt: IsNull() },
            { loginName: normalizedIdentifier, companyId: companyIdFilter as any, deletedAt: IsNull() },
          ],
        })
      : await this.hrUserManagementRepository.findOne({
          where: [
            { emailId: normalizedIdentifier, deletedAt: IsNull() },
            { loginName: normalizedIdentifier, deletedAt: IsNull() },
          ],
        });
    console.log(`[getUserForIbpPasswordReset] hrUser lookup companyIds=${allCompanyIds} result=${hrUser ? `id=${hrUser.id}` : 'null'}`);

    if (hrUser) {
      return { emailId: hrUser.emailId ?? normalizedIdentifier, userId: hrUser.id, firstName: hrUser.userName ?? "" };
    }

    // Fallback: COMBINED / IIRM user — still has a users record
    const user = await this.getUserByEmailId(normalizedIdentifier);
    return { emailId: user.emailId ?? "", userId: user.userId, firstName: user.firstName ?? "" };
  }

  async getCompanyEmployeeByEmailId(emailId: string) {
    try {
      const employee =
        await this.employeeRepository.getCompanyEmployeeByEmailId(emailId);
      if (!employee) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "EmployeeService",
            method: "getCompanyEmployeeByEmailId",
            messageData: `Company Employee not found for email: ${emailId}`,
          }),
        });
        throw new NotFoundException(infoMessages.employeeNotFound);
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeService",
          method: "getCompanyEmployeeByEmailId",
          messageData: `Fetched company employee with email: ${emailId}`,
        }),
      });
      return employee;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "getCompanyEmployeeByEmailId",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Update an existing Employee record by ID by delegating the operation to the employee repository
   */
  async updateEmployeeById(
    employeeId: number,
    updateEmployeeObject: UpdateEmployeeDto,
    userId: number
  ): Promise<EmployeeDto> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        updateEmployeeObject,
        LOOK_UP_DATA
      );
      await this.masterValidation.validateMasterIds(
        updateEmployeeObject,
        MASTER_DATA
      );

      // Check if roles are being updated to trigger auth version increment
      let rolesBeingUpdated = false;
      let targetUserId: number | undefined;
      if (updateEmployeeObject.roles) {
        // Get the user ID of the employee being updated
        const existingEmployee = await this.employeeRepository.getEmployeeById(employeeId);
        targetUserId = existingEmployee?.userId;
        const existingRoles = existingEmployee?.userRoles?.map((role) => Number(role.id)) || [];
        const newRoles = updateEmployeeObject.roles?.map((id) => Number(id)) || [];
        rolesBeingUpdated = !haveSameValues(existingRoles, newRoles);
      }

      await this.employeeRepository.updateEmployeeById(
        employeeId,
        updateEmployeeObject,
        userId
      );

      // Increment auth version if roles were updated
      if (rolesBeingUpdated && targetUserId && (ENV.IWORK_FORCE_LOGOUT_ON_ROLE_PERMISSION_CHANGE || "") === BOOLEAN_VALUES.TRUE) {
        await this.incrementUserAuthVersion(targetUserId);
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "EmployeeService",
          method: "updateEmployeeById",
          messageData: `Updated employee with ID: ${employeeId}`,
        }),
      });
      return this.getEmployeeById(employeeId);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "EmployeeService",
          method: "updateEmployeeById",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Increment auth version for a user to force logout on role changes
   */
  private async incrementUserAuthVersion(userId: number): Promise<void> {
    try {
      const reason = 'Employee role updated via org-service';
      const newAuthVersion = await this.authVersionService.incrementAuthVersion(userId, reason);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "EmployeeService",
          method: "incrementUserAuthVersion",
          messageData: `Auth version incremented for user: ${userId}, new version: ${newAuthVersion}`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "EmployeeService",
          method: "incrementUserAuthVersion",
          messageData: `Failed to increment auth version for user ${userId}: ${error}. User will not be logged out automatically.`,
        }),
      });
      // Don't throw error - role update should still succeed even if auth version increment fails
    }
  }

  /**
   * Delete an Employee record by ID by delegating the operation to the employee repository
   */
  async deleteEmployeeById(
    employeeId: number,
    delegateOwnerUserId: number,
    newManagerId?: number
  ): Promise<void> {
    try {
      const deleted = await this.employeeRepository.deleteEmployeeById(
        employeeId,
        delegateOwnerUserId,
        newManagerId
      );
      if (!deleted) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId: delegateOwnerUserId,
            status: "failure",
            location: "EmployeeService",
            method: "deleteEmployeeById",
            messageData: `Employee not found for ID: ${employeeId}`,
          }),
        });
        throw new NotFoundException(infoMessages.employeeNotFound);
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: delegateOwnerUserId,
          status: "success",
          location: "EmployeeService",
          method: "deleteEmployeeById",
          messageData: `Deleted employee with ID: ${employeeId}`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: delegateOwnerUserId,
          status: "failure",
          location: "EmployeeService",
          method: "deleteEmployeeById",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Retrieve all employees values by delegating the operation to the employee repository
   */
  async getListOfEmployeesValues(
    sort: string,
    search: string,
    searchBy: string,
    page: number,
    limit: number,
    entityIds?: number[]
  ) {
    try {
      const searchParams = search ? mapSearchParams(search) : undefined;

      const sortParams = sort ? mapSortParams(sort) : undefined;
      const { data, count } =
        await this.employeeRepository.getListOfEmployeesValues(
          sortParams,
          searchParams,
          searchBy,
          page,
          limit,
          search,
          entityIds
        );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeService",
          method: "getListOfEmployeesValues",
          messageData: `Fetched ${count} employee values`,
        }),
      });
      return { data, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "getListOfEmployeesValues",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Builds each given employee's ordered reporting chain (root -> ... -> the
   * employee) for grid display. Returns a plain object keyed by userId
   * (JSON-serializable), not a Map.
   */
  async getReportingChains(
    userIds: number[]
  ): Promise<Record<number, { userId: number; firstName: string; lastName: string }[]>> {
    try {
      const chains = await this.employeeRepository.getReportingChains(userIds);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeService",
          method: "getReportingChains",
          messageData: `Fetched reporting chains for ${userIds.length} employee(s)`,
        }),
      });
      return Object.fromEntries(chains);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "getReportingChains",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Retrieves the employee hierarchy for a given root userId.
   */
  async getEmployeeHierarchyByUserId(userId: number): Promise<any> {
    try {
      const hierarchy =
        await this.employeeRepository.getEmployeeHierarchyByUserId(userId);
      if (!hierarchy) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "failure",
            location: "EmployeeService",
            method: "getEmployeeHierarchyByUserId",
            messageData: `Hierarchy not found for userId: ${userId}`,
          }),
        });
        throw new NotFoundException(infoMessages.employeeHierarchyNotFound);
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "EmployeeService",
          method: "getEmployeeHierarchyByUserId",
          messageData: `Fetched hierarchy for userId: ${userId}`,
        }),
      });
      return hierarchy;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "EmployeeService",
          method: "getEmployeeHierarchyByUserId",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Retrieves the parent user with the given privlege for the given user.
   */
  async getParentUserWithPrivilege(
    userId: number,
    aclCategoryKey: string,
    aclActionKey: string
  ): Promise<number> {
    try {
      const parentUser =
        await this.employeeRepository.getParentUserWithPrivilege(
          userId,
          aclCategoryKey,
          aclActionKey
        );
      if (!parentUser || parentUser === null) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "failure",
            location: "EmployeeService",
            method: "getParentUserWithPrivilege",
            messageData: `Parent user not found for userId: ${userId}`,
          }),
        });
        throw new NotFoundException(infoMessages.employeeHierarchyNotFound);
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "EmployeeService",
          method: "getParentUserWithPrivilege",
          messageData: `Fetched parent user with privilege for userId: ${userId}`,
        }),
      });
      return parentUser;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "EmployeeService",
          method: "getParentUserWithPrivilege",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Retrieves the users with a given privilege.
   */
  async getAllUsersWithPrivilege(
    aclCategoryKey: string,
    aclActionKey: string,
    page: number,
    limit: number,
    ignoreSuperUser = false,
  ): Promise<Partial<User>[]> {
    try {
      const users = await this.employeeRepository.getAllUsersWithPrivilege(
        aclCategoryKey,
        aclActionKey,
        page,
        limit,
        ignoreSuperUser
      );
      if (!users || users === null || users.length === 0) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "EmployeeService",
            method: "getAllUsersWithPrivilege",
            messageData: `No users found with privilege: ${aclCategoryKey}, ${aclActionKey}`,
          }),
        });
        throw new NotFoundException(infoMessages.employeePrivilegeNotFound);
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeService",
          method: "getAllUsersWithPrivilege",
          messageData: `Fetched ${users.length} users with privilege: ${aclCategoryKey}, ${aclActionKey}`,
        }),
      });
      return users;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "getAllUsersWithPrivilege",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Initiates the rebuilding of the flat employee hierarchy.
   * @param creatorId The ID of the user initiating the rebuild.
   */
  async rebuildFlatHierarchy(creatorId: number): Promise<void> {
    try {
      await this.employeeRepository.rebuildFlatHierarchy(creatorId);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: creatorId,
          status: "success",
          location: "EmployeeService",
          method: "rebuildFlatHierarchy",
          messageData: `Flat hierarchy rebuilt by userId: ${creatorId}`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: creatorId,
          status: "failure",
          location: "EmployeeService",
          method: "rebuildFlatHierarchy",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  /**
   * Resolve company ID by domain
   */
  private async resolveCompanyIdByDomain(domain?: string): Promise<{
    companyId: number | null;
    isCommon: boolean;
    allCompanyIds: number[];
  }> {
    if (!domain) {
      return { companyId: null, isCommon: true, allCompanyIds: [] };
    }

    const configs = await this.configCompanyRepository.find({
      where: { subDomain: domain },
    });

    const validConfigs = configs.filter((c) => c.companyId != null);
    if (validConfigs.length === 0) {
      return { companyId: null, isCommon: true, allCompanyIds: [] };
    }

    const allCompanyIds = validConfigs.map((c) => c.companyId as number);
    const primaryConfig = validConfigs[0];
    return {
      companyId: primaryConfig.companyId,
      isCommon: primaryConfig.isCompanyConfig === false,
      allCompanyIds,
    };
  }

  private normalizeDisplayName(name?: string | null): string {
    const normalizedName = (name ?? "").trim().replace(/\s+/g, " ");
    if (!normalizedName) {
      return "";
    }

    const parts = normalizedName.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
      return parts[0];
    }

    return normalizedName;
  }

  /**
   * Ensure employee belongs to the company
   */
  private async ensureEmployeeBelongsToCompany(
    userId: number,
    companyId: number | null
  ) {
    if (!companyId) {
      throw new UnauthorizedException(errorMessages.userNotFound);
    }

    const employee = await this.companyEmployeeRepository.findOne({
      where: { userId, companyId },
    });

    if (employee) return;

    const hrRecord = await this.hrUserManagementRepository.findOne({
      where: { userId, companyId, deletedAt: IsNull() },
    });

    if (!hrRecord) {
      throw new UnauthorizedException(errorMessages.userNotFound);
    }
  }

  /**
   * Generates a JWT token for password reset.
   */
  generatePasswordResetToken(emailId: string, userId: number): string {
    return this.jwtService.sign(
      { emailId, userId },
      {
        secret: ENV.JWT_SECRET,
        expiresIn: ENV.JWT_RESET_PASSWORD_EXPIRY || "7d",
      }
    );
  }

  /**
   * Sends password reset mail. Currently logs link for demonstration.
   */
  async sendPasswordResetMail(
    email: string,
    userId: number,
    firstName: string,
    source?: string,
    domain?: string,
    methodCode?: string,
  ) {
    try {
      let notificationCompanyId: number | null = null;

      // Validate employee and resolve companyId for IBP source.
      // For IBP: userId = pee.id (PK from policy_enrollment_employee).
      // All validation goes through pee directly — no users table lookups.
      if (source?.toLowerCase() === "ibp") {
        const pee = await this.companyEmployeeRepository.findOne({
          where: { id: userId },
        });
        if (pee) {
          notificationCompanyId = pee.companyId ?? null;
        } else {
          // EXTERNAL_HR: userId is hr_user_management.id, not pee.id
          const hrUser = await this.hrUserManagementRepository.findOne({
            where: { id: userId, deletedAt: IsNull() },
          });
          if (!hrUser) {
            throw new UnauthorizedException(errorMessages.userNotFound);
          }
          notificationCompanyId = hrUser.companyId ?? null;
        }
      } else if (domain) {
        // Non-IBP source: original domain + users-table-based validation
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "success",
            location: "EmployeeService",
            method: "sendPasswordResetMail",
            messageData: `Validating domain ${domain} for user ${userId}`,
          }),
        });

        const { companyId: domainCompanyId, isCommon } =
          await this.resolveCompanyIdByDomain(domain);

        if (isCommon) {
          const resolvedCompanyId = await this.resolveCompanyIdForUser(userId);
          await this.ensureEmployeeBelongsToCompany(userId, resolvedCompanyId);
          notificationCompanyId = resolvedCompanyId;
        } else {
          if (!domainCompanyId) {
            throw new UnauthorizedException(errorMessages.userNotFound);
          }
          await this.ensureEmployeeBelongsToCompany(userId, domainCompanyId);
          notificationCompanyId = domainCompanyId;
        }
      }
      const payload = {
        userDetails: {
          emailId: email,
          passwordResetTokenKey: ENV.PASSWORD_RESET_TOKEN_KEY,
          userId: userId,
        },
      };
      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: ENV.JWT_RESET_PASSWORD_EXPIRY || "2h",
      });
      const isIbpSource = source?.toLowerCase() === "ibp";
      const companyResetUrl = isIbpSource
        ? await this.resolveCompanyPortalResetUrl(
            userId,
            accessToken,
            isIbpSource,
            methodCode,
            notificationCompanyId,
            domain,
          )
        : null;

      const fallbackBaseUrl = isIbpSource
        ? ENV.IBP_RESET_PASSWORD_URL ?? ENV.COMPANY_PORTAL_URL ?? ""
        : ENV.RESET_PASSWORD_URL ?? ENV.COMPANY_PORTAL_URL ?? "";

      const url =
        companyResetUrl ??
        this.buildResetLink(fallbackBaseUrl, accessToken, isIbpSource, methodCode);

      if (!notificationCompanyId) {
        notificationCompanyId = await this.resolveCompanyIdForUser(userId);
      }
      console.log(`Password reset URL for user ${userId}: ${url}`); 
      const eventType = isIbpSource
        ? IBP_PASSWORD_RESET_EVENT
        : PASSWORD_RESET_EVENT;
      const channel = NOTIFICATION_EMAIL;
      const eventDetails =
        await this.notificationUtils.getNotificationDetailsByEvent(eventType);
      const frontendIbpUrl = (ENV.FRONTEND_IBP_URL || "http://localhost:4201").replace(
        /\/+$/,
        "",
      );
      const buildIbpPublicAssetUrl = (
        fileName?: string | null,
      ): string | undefined => {
        const normalizedFileName = (fileName ?? "").trim().replace(/^\/+/, "");
        if (!normalizedFileName) {
          return undefined;
        }
        return `${frontendIbpUrl}/static-images/${normalizedFileName}`;
      };
      const iirmLogoUrl =
        buildIbpPublicAssetUrl(
          ENV.IBP_EMAIL_IIRM_LOGO_FILE || "iirmLogoUrl.png",
        ) || undefined;
      const displayName = this.normalizeDisplayName(firstName);
      const parameters: any = {
        [PASSWORD_RESET_KEY_1]: url,
        [PASSWORD_RESET_KEY_2]: email,
        [PASSWORD_RESET_KEY_3]: displayName,
        resetLinkExpiry: ENV.JWT_RESET_PASSWORD_EXPIRY || "2h",
        iirmLogoUrl,
        logoUrl: iirmLogoUrl,
      };
      eventDetails.map((event) => {
        switch (event.parameterKey) {
          case PASSWORD_RESET_KEY_1:
            parameters[event.parameterKey] = url;
            break;
          case PASSWORD_RESET_KEY_2:
            parameters[event.parameterKey] = email;
            break;
          case PASSWORD_RESET_KEY_3:
            parameters[event.parameterKey] = displayName;
            break;
          default:
            parameters[event.parameterKey] =
              parameters[event.parameterKey] ?? "";
        }
      });

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "EmployeeService",
          method: "sendPasswordResetMail",
          messageData: `Sending password reset email to ${email}`,
        }),
      });

      const response = await this.traceHttpService.post(
        `${ENV.URL_NOTIFICATION_SERVICE}/notifications`,
        {
          eventType,
          emailId: [email],
          channel: channel,
          companyId: notificationCompanyId != null ? Number(notificationCompanyId) : undefined,
          // `domain` is already resolved above (used for the reset URL and,
          // in the non-IBP branch, for company resolution) but was never
          // forwarded here — same missing-field bug as the OTP login flow,
          // meaning a per-domain "Customise Email Templates" override for
          // this event was always silently ignored in favour of the default.
          ...(domain ? { domain } : {}),
          ...(source?.toLowerCase() === "ibp" ? { source: "IBP" } : {}),
          parameters: parameters,
        }
      );
      const sendStatus = (response.data as any)?.data?.status;
      if (
        isIbpSource &&
        (sendStatus === NOTIFICATION_SKIP_STATUS.DISABLED_FOR_COMPANY ||
          sendStatus === NOTIFICATION_SKIP_STATUS.DISABLED_FOR_DOMAIN ||
          sendStatus === NOTIFICATION_SKIP_STATUS.TEMPLATE_DISABLED)
      ) {
        throw new UnauthorizedException(
          "Password reset via email is currently disabled for your organisation. Please try a different reset method."
        );
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "EmployeeService",
          method: "sendPasswordResetMail",
          messageData: `Password reset email sent to ${email}`,
        }),
      });
      return response.data;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "EmployeeService",
          method: "sendPasswordResetMail",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  private async resolveCompanyPortalResetUrl(
    userId: number,
    token: string,
    isIbpSource?: boolean,
    methodCode?: string,
    knownCompanyId?: number | null,
    domain?: string,
  ): Promise<string | null> {
    const companyId = knownCompanyId ?? await this.resolveCompanyIdForUser(userId);
    if (!companyId) {
      return null;
    }

    // If the request came from a specific domain, use that domain's portal URL directly.
    // This ensures reset/OTP emails always link back to the same portal the user logged in from.
    const config = domain
      ? await this.configCompanyRepository.findOne({
          where: { subDomain: domain, companyId },
        }) ?? await this.configCompanyRepository.findOne({
          where: { companyId },
          order: { updatedAt: "DESC", id: "DESC" },
        })
      : await this.configCompanyRepository.findOne({
          where: { companyId },
          order: { updatedAt: "DESC", id: "DESC" },
        });

    const baseUrl = this.resolveCompanyPortalBaseUrl(config);
    return baseUrl ? this.buildResetLink(baseUrl, token, isIbpSource, methodCode) : null;
  }

  private async resolveCompanyIdForUser(
    userId: number
  ): Promise<number | null> {
    const companyEmployee = await this.companyEmployeeRepository.findOne({
      where: { userId, deletedAt: IsNull() },
      order: { updatedAt: "DESC", id: "DESC" },
    });

    if (companyEmployee?.companyId) return companyEmployee.companyId;

    const hrRecord = await this.hrUserManagementRepository.findOne({
      where: { userId, deletedAt: IsNull() },
    });

    return hrRecord?.companyId ?? null;
  }

  private resolveCompanyPortalBaseUrl(
    config: ConfigCompany | null | undefined
  ): string | null {
    const defaultPortalUrl =
      ENV.COMPANY_PORTAL_URL ?? ENV["company_portal_url"] ?? null;
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

  private applySubdomainToUrl(baseUrl: string, subDomain: string): string {
    try {
      const url = new URL(baseUrl);
      const host = url.hostname;
      if (!host.startsWith(`${subDomain}.`)) {
        url.hostname = `${subDomain}.${host}`;
      }
      return url.toString();
    } catch {
      return baseUrl.replace(/^https?:\/\//, `$&${subDomain}.`);
    }
  }

  private buildResetLink(
    baseUrl: string,
    token: string,
    isIbpSource?: boolean,
    methodCode?: string,
  ): string {
    const normalizedBaseUrl = baseUrl?.trim();
    if (!normalizedBaseUrl) {
      return "";
    }
    const encodedToken = encodeURIComponent(token);
    if (normalizedBaseUrl.includes("token=")) {
      return `${normalizedBaseUrl}${encodedToken}`;
    }
    const trimmedBaseUrl = normalizedBaseUrl.replace(/[/?#]+$/, "");
    const methodParam = methodCode ? `&method=${encodeURIComponent(methodCode)}` : "";
    return isIbpSource
      ? `${trimmedBaseUrl}/login?step=reset&token=${encodedToken}${methodParam}`
      : `${trimmedBaseUrl}?token=${encodedToken}`;
  }

  /**
   * Validates the password reset token and returns payload.
   * Also checks if token has already been used (single-use enforcement)
   */
  async validateResetToken(
    token: string,
  ): Promise<{ userDetails: { userId: number; emailId: string } }> {
    try {
      // First verify JWT signature and expiry
      const payload = await this.jwtService.verifyAsync(token, {
        secret: ENV.JWT_SECRET,
      });
      // Check if token has already been used
      const usedToken = await this.usedResetTokenRepository.findOne({
        where: { token },
      });

      if (usedToken) {
        this.logger.warn({
          level: "warn",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId: payload.userDetails?.userId,
            status: "failure",
            location: "EmployeeService",
            method: "validateResetToken",
            messageData: "Attempt to reuse already-used reset token",
          }),
        });
        throw new ForbiddenException(
          "This link has expired. Please request a new password reset.",
        );
      }

      return payload;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "validateResetToken",
          messageData: error,
        }),
      });
      if (error instanceof ForbiddenException) {
        throw error;
      }
      throw new ForbiddenException(
        "This link has expired. Please request a new password reset.",
      );
    }
  }

  /**
   * Updates the password for the user represented by the token.
   * Implements:
   * - Password history validation (last 5 passwords)
   * - Single-use token enforcement
   * - Audit logging with IP address
   */
  async resetPassword(token: string, password: string, ipAddress?: string) {
    try {
      const payload = await this.validateResetToken(token);
      const userId = payload.userDetails.userId;

      // Fetch employee details for password validation
      const employee = await this.employeeRepo.findOne({
        where: { userId },
      });

      if (!employee) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "EmployeeService",
            method: "resetPassword",
            messageData: `Employee not found for userId: ${userId}`,
          }),
        });
        throw new NotFoundException(`Employee not found for userId: ${userId}`);
      }
      
      // Validate password rules
      const validatedPassword = validatePassword(password, {
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.emailId,
        phone: employee.mobile,
        dob: employee.dateOfBirth,
      });
      
      if (!validatedPassword.isValid) {
        throw new BadRequestException(
          `Password validation failed: ${validatedPassword.errors.join(", ")}`,
        );
      }
      
      // Check password history (last 5 passwords)
      const passwordHistory = await this.passwordHistoryRepository.find({
        where: { userId },
        order: { createdAt: "DESC" },
        take: ENV.LAST_N_PASSWORDS_COUNT ? Number.parseInt(ENV.LAST_N_PASSWORDS_COUNT) : 5,
      });
      
      for (const oldPassword of passwordHistory) {
        const isMatch = await bcrypt.compare(password, oldPassword.passwordHash);
        if (isMatch) {
          throw new BadRequestException(
            `Password cannot match any of your last ${ENV.LAST_N_PASSWORDS_COUNT ? Number.parseInt(ENV.LAST_N_PASSWORDS_COUNT) : 5} passwords. Please choose a different password.`,
          );
        }
      }
      
      // Hash new password
      const hashed = await hashPassword(password);
      
      // Calculate password expiry (90 days from now)
      const passwordExpiryDays = ENV.PASSWORD_EXPIRY_DAYS || 90;
      const days = Number(passwordExpiryDays); // must be 90
      const passwordExpiresAt = new Date(Date.now() + days * 86400000);
      // Update password in employee table
      await this.employeeRepository.updateUserPassword(userId, hashed);
      
      // Update password expiry in user table
      await this.userRepository.update(
        { userId },
        {
          passwordExpiresAt,
        }
      );
      console.log("Updated password expiry in user table:", userId,passwordExpiresAt);
      // Add current password to history
      await this.passwordHistoryRepository.save({
        userId,
        passwordHash: hashed,
      });
      
      // Mark token as used
      await this.usedResetTokenRepository.save({
        token,
        userId,
        ipAddress: ipAddress || "unknown",
      });
      
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "EmployeeService",
          method: "resetPassword",
          payload: { ipAddress },
          messageData: "Password reset successfully",
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "resetPassword",
          payload: { ipAddress },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async ibpResetPassword(token: string, password: string, companyId?: number) {
    try {
      const payload = await this.validateResetToken(token);
      const userId = payload.userDetails.userId;

      // Post-migration: JWT userId = pee.id for company employees. Try pee lookup first.
      const pee = await this.companyEmployeeRepository.findOne({ where: { id: userId } });

      if (pee) {
        // Company employee — credential lives in policy_enrollment_employee
        const existingIbpPassword = pee.ibpPassword ?? pee.password ?? null;
        if (existingIbpPassword) {
          const isSamePassword = await isPasswordMatch(password, existingIbpPassword);
          if (isSamePassword) {
            throw new BadRequestException("The new password must be different from your existing password");
          }
        }

        if (companyId) {
          const rules = await this.fetchCompanyPasswordRules(companyId);
          if (!rules || rules.length === 0) {
            throw new BadRequestException("No password rules found for company or default rules");
          }
          try {
            PasswordValidationUtil.validatePasswordOrThrow(password, rules);
          } catch (validationError) {
            const message = validationError && typeof validationError === "object" && "message" in validationError
              ? (validationError as any).message : "Unknown validation error";
            throw new BadRequestException(`Password validation failed: ${message}`);
          }
        }

        const hashed = await hashPassword(password);
        await this.companyEmployeeRepository.update({ id: pee.id }, { ibpPassword: hashed, isPasswordSet: true });

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "EmployeeService",
            method: "ibpResetPassword",
            messageData: "IBP password reset successfully for company employee (pee)",
          }),
        });
        return;
      }

      // EXTERNAL_HR fallback — credential lives in hr_user_management
      const hrUser = await this.hrUserManagementRepository.findOne({ where: { id: userId, deletedAt: IsNull() } });
      if (hrUser) {
        const existingPassword = hrUser.password ?? null;
        if (existingPassword) {
          const isSamePassword = await isPasswordMatch(password, existingPassword);
          if (isSamePassword) {
            throw new BadRequestException("The new password must be different from your existing password");
          }
        }

        if (companyId) {
          const rules = await this.fetchCompanyPasswordRules(companyId);
          if (!rules || rules.length === 0) {
            throw new BadRequestException("No password rules found for company or default rules");
          }
          try {
            PasswordValidationUtil.validatePasswordOrThrow(password, rules);
          } catch (validationError) {
            const message = validationError && typeof validationError === "object" && "message" in validationError
              ? (validationError as any).message : "Unknown validation error";
            throw new BadRequestException(`Password validation failed: ${message}`);
          }
        }

        const hashed = await hashPassword(password);
        await this.hrUserManagementRepository.update(
          { id: hrUser.id },
          { password: hashed, isPasswordSet: true, isPasswordHashed: true },
        );
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "EmployeeService",
            method: "ibpResetPassword",
            messageData: "IBP password reset successfully for EXTERNAL_HR user",
          }),
        });
        return;
      }

      // Fallback: COMBINED user — credential still in users table
      const user = await this.userRepository.findOne({ where: { userId } });
      if (!user) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "EmployeeService",
            method: "ibpResetPassword",
            messageData: `Employee not found for userId: ${userId}`,
          }),
        });
        throw new NotFoundException(infoMessages.employeeNotFound);
      }

      if (user.ibpPassword) {
        const isSamePassword = await isPasswordMatch(password, user.ibpPassword);
        if (isSamePassword) {
          throw new BadRequestException("The new password must be different from your existing password");
        }
      }

      if (!companyId) {
        const hashed = await hashPassword(password);
        await this.employeeRepository.updateIbpPassword(userId, hashed);
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "EmployeeService",
            method: "ibpResetPassword",
            messageData: "Password reset successfully (legacy mode)",
          }),
        });
        return;
      }

      const rules = await this.fetchCompanyPasswordRules(companyId);
      if (!rules || rules.length === 0) {
        throw new BadRequestException("No password rules found for company or default rules");
      }
      try {
        PasswordValidationUtil.validatePasswordOrThrow(password, rules);
      } catch (validationError) {
        const message = validationError && typeof validationError === "object" && "message" in validationError
          ? (validationError as any).message : "Unknown validation error";
        throw new BadRequestException(`Password validation failed: ${message}`);
      }

      const hashed = await hashPassword(password);
      await this.employeeRepository.updateIbpPassword(userId, hashed);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeService",
          method: "ibpResetPassword",
          messageData: "Password reset successfully",
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "ibpResetPassword",
          messageData: error,
        }),
      });
      throw error;
    }
  }
  async getSuperUserId(currentUserId: number): Promise<number> {
    try {
      const superUserId = await this.employeeRepository.getSuperUserId(
        currentUserId
      );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeService",
          method: "getSuperUserId",
          messageData: `Fetched super user ID: ${superUserId}`,
        }),
      });
      return superUserId;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "getSuperUserId",
          messageData: error,
        }),
      });
      throw error;
    }
  }
  /**
   * Retrieves the employee hierarchy for a given root userId.
   */
  async getEmployeeHierarchyByOrgId(orgId: number): Promise<any> {
    try {
      const hierarchy =
        await this.employeeRepository.getEmployeeHierarchyByOrgId(orgId);
      if (!hierarchy) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId: orgId,
            status: "failure",
            location: "EmployeeService",
            method: "getEmployeeHierarchyByOrgId",
            messageData: `Hierarchy not found for orgId: ${orgId}`,
          }),
        });
        throw new NotFoundException(infoMessages.employeeHierarchyNotFound);
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: orgId,
          status: "success",
          location: "EmployeeService",
          method: "getEmployeeHierarchyByOrgId",
          messageData: `Fetched hierarchy for userId: ${orgId}`,
        }),
      });
      return hierarchy;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: orgId,
          status: "failure",
          location: "EmployeeService",
          method: "getEmployeeHierarchyByOrgId",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async fetchReporteeUserIds(userId: number): Promise<any> {
    try {
      const hierarchy = await this.employeeRepository.fetchReporteeUserIds(
        userId
      );
      if (!hierarchy) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "failure",
            location: "EmployeeService",
            method: "fetchReporteeUserIds",
            messageData: `Hierarchy not found for userId: ${userId}`,
          }),
        });
        throw new NotFoundException(infoMessages.employeeHierarchyNotFound);
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "EmployeeService",
          method: "fetchReporteeUserIds",
          messageData: `Fetched hierarchy for userId: ${userId}`,
        }),
      });
      return hierarchy;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "EmployeeService",
          method: "fetchReporteeUserIds",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  // ─── Deactivation methods ─────────────────────────────────────────────────

  async getDeactivatePreview(employeeId: number) {
    try {
      return await this.employeeRepository.getDeactivatePreview(employeeId);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "getDeactivatePreview",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getDeactivationRecords(employeeId: number, type?: string) {
    try {
      return await this.employeeRepository.getDeactivationRecords(employeeId, type);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "getDeactivationRecords",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async autoDeactivate(employeeId: number): Promise<void> {
    try {
      await this.employeeRepository.autoDeactivate(employeeId);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeService",
          method: "autoDeactivate",
          messageData: `Auto-deactivated employee ${employeeId}`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "autoDeactivate",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async manualDeactivate(employeeId: number, dto: ManualDeactivateDto): Promise<void> {
    try {
      await this.employeeRepository.manualDeactivate(employeeId, dto);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeService",
          method: "manualDeactivate",
          messageData: `Manually deactivated employee ${employeeId}`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "manualDeactivate",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async activateEmployee(employeeId: number): Promise<void> {
    try {
      await this.employeeRepository.activateEmployee(employeeId);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeService",
          method: "activateEmployee",
          messageData: `Activated employee ${employeeId}`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "activateEmployee",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  private async fetchCompanyPasswordRules(
    companyId: number
  ): Promise<PasswordRuleDefinition[]> {
    try {
      const response = await this.traceHttpService.get<{
        passwordRules?: PasswordRuleDefinition[];
      }>(`${ENV.URL_CONFIG_SERVICE}/config-company/portal/${companyId}`);

      return response.data?.passwordRules ?? [];
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeService",
          method: "fetchCompanyPasswordRules",
          messageData: error,
        }),
      });
      throw new BadRequestException("Failed to load password rules for the company");
    }
  }
}
