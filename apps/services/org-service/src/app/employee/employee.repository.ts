import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, DataSource, EntityManager, In, Not, Repository } from "typeorm";
import {
  ACTIVITY_STATUS_COMPLETED,
  DEFAULT_ADMIN_ID,
  EMPLOYEE_FIELDS,
  EMPLOYEE_STATUS_ACTIVE,
  EMPLOYEE_STATUS_INACTIVE,
  EMPLOYEE_STATUS_LEAVE,
  OPTY_STAGE_OPEN,
  OPTY_STAGE_WIP,
  USER_STATUS_ACTIVE,
  USER_STATUS_DELETED,
  USER_TYPE_IIRM_EMPLOYEE,
  USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
  USER_TYPE_COMPANY_EMPLOYEE,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  errorMessages,
  infoMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import {
  DEFAULT_FILTER,
  defaultFilter,
  FILTER_STATUS,
  FILTER_TYPE,
  ORGANISATION_KEYS,
  serviceNames,
  ROLE_SUPER_USER,
} from "../../../../service-lib/src/lib/constants";
import {
  Company,
  Employee,
  EmployeeHierarchy,
  Endorsement,
  FilterPreference,
  LookUp,
  Opportunity,
  OpportunityActivityMap,
  Organisation,
  OrgBranch,
  OrgDepartment,
  OrgSbu,
  OrgVertical,
  Policy,
  PolicyEnrollmentEmployee,
  Role,
  User,
  UserRole,
} from "../../../../service-lib/src/lib/entities";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { hashPassword } from "../../../../service-lib/src/lib/utils/password.util";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { ManualDeactivateDto } from "./dto/deactivate-employee.dto";
import { EmployeeDto } from "./dto/employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";

// Effective top of the org for the "Reporting Hierarchy" grid column
// (buildReportingChains). userId 2 = Ramakrishna Vurakaranam. The real
// employee_hierarchy chain goes several levels above him (id 342395
// "SystemAdmin Read", id -1 "System Admin") -- those exist only for internal
// system bookkeeping, not real people in the client's org, and displaying
// them as anyone's "manager" is confusing/wrong from the client's point of
// view, where Ramakrishna is always the top. Confirmed with the client:
// truncate any displayed chain at this user, never show anyone above him.
const HIERARCHY_DISPLAY_ROOT_USER_ID = 2;

@Injectable()
export class EmployeeRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Employee)
    private readonly employeeRepository: Repository<Employee>,
    @InjectRepository(PolicyEnrollmentEmployee)
    private readonly companyEmployeeRepository: Repository<PolicyEnrollmentEmployee>,
    private readonly entityService: EntityService,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Creates a new Employee record in the database.
   */
  async addEmployee(createEmployeeObject: CreateEmployeeDto, userId: number) {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        // First validate the user/employee/reporting manager
        await this.validateUserEmployeeIsNew(
          entityManager,
          createEmployeeObject
        );
        await this.validateDeptBranch(entityManager, {
          departmentId: createEmployeeObject.departmentId,
          branchId: createEmployeeObject.branchId,
          verticalId: createEmployeeObject.verticalId,
          organisationId: createEmployeeObject.organisationId,
          sbuId: createEmployeeObject.sbuId,
        });

        const reportingMgr = await this.validateReportingManager(
          entityManager,
          createEmployeeObject.reportingManagerEmployeeId,
          createEmployeeObject.reportees
        );

        // A placeholder password also needs to be stored in the DB as it is a required field
        const passwordStr = await hashPassword(String(Date.now()));

        // Create User object with fields specific to the User entity
        const user = entityManager.create(User, {
          salutationLid: createEmployeeObject.salutationLid,
          firstName: createEmployeeObject.firstName,
          lastName: createEmployeeObject.lastName,
          emailId: createEmployeeObject.emailId,
          mobile: createEmployeeObject.mobile,
          loginName:
            createEmployeeObject.loginName ?? createEmployeeObject.emailId,
          password: passwordStr,
          branchId: createEmployeeObject.branchId,
          departmentId: createEmployeeObject.departmentId,
          designationId: createEmployeeObject.designationId,
          reportingUserId: reportingMgr?.userId,
          sbuId: createEmployeeObject.sbuId,
          verticalId: createEmployeeObject.verticalId,
          organisationId: createEmployeeObject.organisationId,
          userTypeKey: USER_TYPE_IIRM_EMPLOYEE,
          userStatusKey: USER_STATUS_ACTIVE,
          createdBy: userId,
          updatedBy: userId,
        });

        const savedUser = await entityManager.save(user);

        if (!savedUser) {
          throw new BadRequestException(`Failed to create user`);
        }

        await this.createRoles(
          entityManager,
          createEmployeeObject,
          savedUser.userId,
          userId
        );

        const employeeActive = await entityManager.findOne(LookUp, {
          where: { lookUpKey: EMPLOYEE_STATUS_ACTIVE },
        });

        // Create Employee object with fields specific to the Employee entity
        const employee = entityManager.create(Employee, {
          salutationLid: createEmployeeObject.salutationLid,
          firstName: createEmployeeObject.firstName,
          lastName: createEmployeeObject.lastName,
          emailId: createEmployeeObject.emailId,
          mobile: createEmployeeObject.mobile,
          userId: savedUser.userId, // Link User to Employee
          branchId: createEmployeeObject.branchId,
          departmentId: createEmployeeObject.departmentId,
          sbuId: createEmployeeObject.sbuId,
          verticalId: createEmployeeObject.verticalId,
          organisationId: createEmployeeObject.organisationId,
          designationId: createEmployeeObject.designationId,
          reportingManagerEmployeeId: reportingMgr?.employeeId,
          statusLid: employeeActive?.id || undefined,
          iirmEmpId: createEmployeeObject.iirmEmpId,
          reportingUserId: reportingMgr?.userId,
          dateOfBirth: createEmployeeObject.dateOfBirth,
          dateOfJoining: createEmployeeObject.dateOfJoining,
          createdBy: userId,
          updatedBy: userId,
        });

        const savedEmployee = await entityManager.save(employee);

        if (!savedUser) {
          throw new BadRequestException(`Failed to create employee`);
        }

        const changeHierarchyList = [];
        changeHierarchyList.push(savedUser.userId);
        // Now let us process Reportees
        if (
          createEmployeeObject.reportees &&
          createEmployeeObject.reportees.length > 0
        ) {
          const oldMgrList = await this.addReportees({
            entityManager,
            reportees: createEmployeeObject.reportees,
            employeeId: savedEmployee.employeeId,
            userId: savedUser.userId,
            creator: userId,
          });
          // Add the oldMgrList to changeHierarchyList
          changeHierarchyList.push(...oldMgrList);
        }

        await this.addParentsToUpdateList(
          entityManager,
          savedUser.userId,
          changeHierarchyList
        );
        const uniqueList = [...new Set(changeHierarchyList)];

        // Now update the dependent hierarchy for all these people
        await this.updateEmployeeHierarchy(entityManager, uniqueList, userId);

        // Exclude createdAt, updatedAt, createdBy, updatedBy from the response
        const {
          createdAt,
          updatedAt,
          createdBy,
          updatedBy,
          deletedAt,
          ...employeeData
        } = savedEmployee;
        // Create system default filters for the new employee
        await this.createSystemDefaultFilters(entityManager, employeeData);

        return employeeData;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new BadRequestException(
        `Failed to create an employee: ${error.message}`
      );
    }
    return null;
  }

  private async addReportees({
    entityManager,
    reportees,
    employeeId,
    userId,
    creator,
  }: {
    entityManager: EntityManager;
    reportees: number[];
    employeeId: number;
    userId: number;
    creator: number;
  }) {
    try {
      if (!reportees || reportees.length === 0) {
        return [];
      }
      // validate that all reportees are active status
      const inactiveUsers = await entityManager.find(User, {
        where: {
          userId: In(reportees),
          userStatusKey: USER_STATUS_DELETED,
        },
      });
      if (inactiveUsers && inactiveUsers.length > 0) {
        throw new BadRequestException(infoMessages.inactiveUsersInReportees);
      }

      const oldMgrs = await entityManager.find(User, {
        where: { userId: In(reportees) },
      });

      let mgrsToUpdate = oldMgrs.map((u) => u.reportingUserId);
      let uniqueList = [...new Set(mgrsToUpdate)];
      mgrsToUpdate = [...uniqueList];
      await Promise.all(
        uniqueList.map((manager) =>
          this.addParentsToUpdateList(entityManager, manager, mgrsToUpdate)
        )
      );
      uniqueList = [...new Set(mgrsToUpdate)];

      // Now update all user rows for reportees with new reporting manager user Id
      await entityManager.update(
        User,
        { userId: In(reportees) },
        { reportingUserId: userId, updatedBy: creator }
      );
      // Do the same for employee rows
      await entityManager.update(
        Employee,
        { userId: In(reportees) },
        {
          reportingManagerEmployeeId: employeeId,
          reportingUserId: userId,
          updatedBy: creator,
        }
      );

      // return the old managers such that their employee_hierarchy table can be updated.
      return uniqueList;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Failed to add reportees: ${error.message}`
      );
    }
  }

  private async addParentsToUpdateList(
    entityManager: EntityManager,
    userId: number,
    mgrsToUpdate: number[]
  ) {
    const rawSqlString = `
      WITH RECURSIVE HierarchyCTE AS (
        SELECT id, reporting_user_id, 0 AS Level
        FROM users WHERE id = ${userId}
        
        UNION ALL
        
        SELECT t.id, t.reporting_user_id, h.Level + 1
        FROM users t
        JOIN HierarchyCTE h ON t.id = h.reporting_user_id
        AND t.user_type_key IN ('USER_TYPE_IIRM_EMPLOYEE', 'USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE')
      )
      SELECT id
      FROM HierarchyCTE
      ORDER BY Level, id
    `;
    const dataRows = await entityManager.query(rawSqlString);

    if (dataRows && dataRows.length > 0) {
      mgrsToUpdate.push(...dataRows.map((row) => row.id));
    }
  }

  private async createRoles(
    entityManager: EntityManager,
    createEmployeeObject: CreateEmployeeDto,
    savedUserId: number,
    creator: number
  ) {
    // Get unique role IDs to prevent processing duplicates
    try {
      const roleIdList =
        createEmployeeObject && createEmployeeObject.roles.length > 0
          ? createEmployeeObject.roles
          : [];
      const uniqueRoleIds = [...new Set(roleIdList)];

      if (uniqueRoleIds && uniqueRoleIds.length > 0) {
        // Validate that all the roles are valid Roles
        const validRoles = await entityManager.find(Role, {
          where: { id: In(uniqueRoleIds) },
        });
        if (validRoles.length !== uniqueRoleIds.length) {
          throw new BadRequestException(infoMessages.invalidRolesinCreate);
        }

        const userRoles = await this.createRoleObjs(entityManager, {
          userId: savedUserId,
          roles: uniqueRoleIds,
          creator: creator,
        });
        await entityManager.save(UserRole, userRoles);
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Failed to create user roles: ${error.message}`
      );
    }
  }

  private async createRoleObjs(
    entityManager: EntityManager,
    {
      userId,
      roles,
      creator,
    }: { userId: number; roles: number[]; creator: number }
  ) {
    let userRoles = [];
    roles.forEach((roleId) => {
      const roleObj = entityManager.create(UserRole, {
        userId: userId,
        roleId: roleId,
        createdBy: creator,
        updatedBy: creator,
      });
      userRoles.push(roleObj);
    });
    return userRoles;
  }

  private async updateRoles(
    entityManager: EntityManager,
    employeeObject: UpdateEmployeeDto,
    user: User,
    creator: number
  ) {
    try {
      // Update user roles if roles are provided in the update DTO
      const existingRoleIds = user.userRoles.map((ur) => ur.roleId);
      const updateRoleIds = employeeObject.roles || [];

      // Roles to add:
      const rolesToAdd = updateRoleIds.filter(
        (roleId) => !existingRoleIds.includes(roleId)
      );
      // make them unique
      let uniqueList = [...new Set(rolesToAdd)];

      // Add new roles
      if (uniqueList.length > 0) {
        const newUserRoles = await this.createRoleObjs(entityManager, {
          userId: user.userId,
          roles: uniqueList,
          creator: creator,
        });
        await entityManager.save(UserRole, newUserRoles);
      }

      // Roles to remove:
      const rolesToRemove = user.userRoles
        .map((ur) => ur.roleId)
        .filter((id: number) => !updateRoleIds.includes(id));
      uniqueList = [...new Set(rolesToRemove)];

      // Remove roles not present in payload
      if (uniqueList.length > 0) {
        await entityManager.delete(UserRole, {
          userId: user.userId,
          roleId: In(uniqueList),
        });
      }
    } catch (error) {
      throw new BadRequestException(
        `Failed to update user roles: ${error.message}`
      );
    }
  }

  private async updateReportees(
    entityManager: EntityManager,
    user: User,
    reportees: number[] | undefined,
    employeeId: number,
    creator: number
  ) {
    try {
      // First validate that reportees list does not contain either the user or the manager
      if (reportees && reportees.length > 0) {
        if (
          reportees.includes(user.userId) ||
          reportees.includes(user.reportingUserId)
        ) {
          throw new BadRequestException(
            infoMessages.cannotAddSelfOrManagerAsReportee
          );
        }
      }

      // Update reportees if reportees are provided in the update DTO
      const existingReportees = await entityManager.find(User, {
        where: { reportingUserId: user.userId },
      });
      const existingReporteeList = existingReportees.map((e) => e.userId);
      const updateReporteesList = reportees || [];

      // Reportees to add:
      const reporteesToAdd = updateReporteesList.filter(
        (userId) => !existingReporteeList.includes(userId)
      );
      const uniqueList = [...new Set(reporteesToAdd)];

      // Reportees to remove:
      const reporteesToRemove = existingReporteeList.filter(
        (userId) => !updateReporteesList.includes(userId)
      );
      // But we can't remove reportees:
      if (reporteesToRemove.length > 0) {
        throw new BadRequestException(infoMessages.cannotRemoveReportees);
      }

      const updateHierarchyList = await this.addReportees({
        entityManager,
        reportees: uniqueList,
        employeeId: employeeId,
        userId: user.userId,
        creator,
      });
      return updateHierarchyList;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Failed to update reportees: ${error.message}`
      );
    }
  }

  private async validateUserEmployeeIsNew(
    entityManager: EntityManager,
    createEmployeeObject: CreateEmployeeDto
  ) {
    // Check if the employee already exists
    // Check if either the email or iirmEmpId already exists for an active employee
    try {
      const existingEmployee = await entityManager.findOne(Employee, {
        where: {
          iirmEmpId: createEmployeeObject.iirmEmpId,
          statusLookup: { lookUpKey: EMPLOYEE_STATUS_ACTIVE },
        },
      });

      if (existingEmployee) {
        throw new BadRequestException(infoMessages.employeeIdAlreadyExists);
      }

      await this.validateEmailIsUnique(
        entityManager,
        createEmployeeObject.emailId
      );
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Failed to validate employee: ${error.message}`
      );
    }
  }

  private async validateUserEmployeeExists(
    entityManager: EntityManager,
    employeeId: number
  ) {
    try {
      // Check to ensure employee and user exist!
      const employee = await entityManager.findOne(Employee, {
        where: { employeeId: employeeId },
      });
      if (!employee) {
        throw new NotFoundException(infoMessages.employeeNotFound);
      }

      const user = await entityManager.findOne(User, {
        where: { userId: employee.userId },
        relations: { userRoles: true },
      });
      if (!user) {
        throw new NotFoundException(infoMessages.userNotFound);
      }

      return { employee, user: user };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Failed to validate employee or user: ${error.message}`
      );
    }
  }

  private async validateManagerUserExists(entityManager, userId) {
    if (!userId) {
      throw new NotFoundException(infoMessages.reportingMgrMissingNotFound);
    }
    // Check to ensure employee and user exist!
    const employee = await entityManager.findOne(Employee, {
      where: { userId: userId },
    });
    if (!employee) {
      throw new NotFoundException(infoMessages.reportingMgrMissingNotFound);
    }

    const user = await entityManager.findOne(User, {
      where: { userId: userId },
    });
    if (!user) {
      throw new NotFoundException(infoMessages.reportingMgrMissingNotFound);
    }
    return { employee, user };
  }

  private async validateEmailIsUnique(
    entityManager: EntityManager,
    emailId: string
  ) {
    try {
      const isEmailExistsInUser = await entityManager.findOne(User, {
        where: { emailId: emailId, userStatusKey: USER_STATUS_ACTIVE },
      });

      if (isEmailExistsInUser) {
        throw new BadRequestException(
          infoMessages.employeeEmailIdAlreadyExists
        );
      }

      const emailInEmployee = await entityManager.findOne(Employee, {
        where: {
          emailId: emailId,
          statusLookup: { lookUpKey: EMPLOYEE_STATUS_ACTIVE },
        },
      });
      if (emailInEmployee) {
        throw new BadRequestException(
          infoMessages.employeeEmailIdAlreadyExists
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Failed to validate employee email: ${error.message}`
      );
    }
  }

  private async validateDeptBranch(
    entityManager: EntityManager,
    {
      branchId,
      departmentId,
      verticalId,
      organisationId,
      sbuId,
    }: {
      branchId?: number;
      departmentId?: number;
      verticalId?: number;
      organisationId: number;
      sbuId?: number;
    }
  ) {
    try {
      const organisation = await entityManager.findOne(Organisation, {
        where: { id: organisationId },
        select: ["id", "organisationKey"],
      });
      if (!organisation) {
        throw new BadRequestException("Invalid organisation selected");
      }

      const isIirmHoldings =
        organisation.organisationKey === ORGANISATION_KEYS.HOLDINGS;
      const isMissingHierarchyFields =
        !sbuId || !verticalId || !departmentId || !branchId;

      if (isIirmHoldings && isMissingHierarchyFields) {
        return;
      }

      const sbu = await entityManager.findOne(OrgSbu, {
        where: { id: sbuId, organisationId: organisationId },
      });
      if (!sbu) {
        throw new BadRequestException(infoMessages.invalidOrgSbu);
      }
      const vertical = await entityManager.findOne(OrgVertical, {
        where: { id: verticalId, sbuId: sbuId },
      });
      if (!vertical) {
        throw new BadRequestException(infoMessages.invalidOrgVertical);
      }
      const department = await entityManager.findOne(OrgDepartment, {
        where: { id: departmentId, verticalId: verticalId },
      });
      if (!department) {
        throw new BadRequestException(infoMessages.invalidOrgDepartment);
      }
      const branch = await entityManager.findOne(OrgBranch, {
        where: { id: branchId, organisationId: organisationId },
      });
      if (!branch) {
        throw new BadRequestException(infoMessages.invalidOrgBranch);
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Failed to validate employee vertical,department and branch: ${error.message}`
      );
    }
  }

  private async validateReportingManager(
    entityManager: EntityManager,
    reportingManagerEmployeeId?: number,
    reportees?: number[]
  ) {
    try {
      let reportingMgr;
      if (reportingManagerEmployeeId && reportingManagerEmployeeId !== 0) {
        reportingMgr = await entityManager.findOne(Employee, {
          where: { employeeId: reportingManagerEmployeeId },
        });
        if (!reportingMgr) {
          throw new BadRequestException(infoMessages.invalidReportingManager);
        }
        if (reportees && reportees.find((r) => r === reportingMgr.userId)) {
          throw new BadRequestException(infoMessages.reportingMgrInReportees);
        }
      }

      return reportingMgr ?? null;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Failed to validate reporting manager: ${error.message}`
      );
    }
  }

  /**
   * Retrieves Employee records from the database, with optional search, sorting, and pagination.
   */
  async getEmployees(
    sortArray: { field: string; order: "ASC" | "DESC" }[],
    searchArray: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    searchBy: string,
    page: number,
    limit: number
  ): Promise<{ data: EmployeeDto[]; count: number; inactiveCount: number }> {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        try {
          // Translate employeeStatus key filter into a statusLid WHERE condition.
          // Cannot use searchArray for this because fetchEntityList uses ILIKE (text)
          // on all searchArray entries, which fails on the integer statusLid column.
          const resolvedSearchArray = searchArray ? [...searchArray] : [];
          let statusWhere: { statusLid: number } | undefined;
          const statusFilterIdx = resolvedSearchArray.findIndex(
            (s) => s.searchBy === "employeeStatus"
          );
          if (statusFilterIdx !== -1) {
            const statusKey = String(resolvedSearchArray[statusFilterIdx].searchValue);
            resolvedSearchArray.splice(statusFilterIdx, 1);
            const statusLookup = await entityManager.findOne(LookUp, {
              where: { lookUpKey: statusKey },
            });
            if (statusLookup) {
              statusWhere = { statusLid: statusLookup.id };
            }
          }

          // Fetch the inactive lookup ID up-front so we can use it for both
          // the inactive count query and the status filter.
          const inactiveLookup = await entityManager.findOne(LookUp, {
            where: { lookUpKey: EMPLOYEE_STATUS_INACTIVE },
          });

          const employeeRelations = [
            "user",
            "userRoles",
            "userRoles.role",
            "department",
            "vertical",
            "designation",
            "sbu",
            "organisation",
            "branch",
            "statusLookup",
          ];

          // This is iWork's internal Employee Management listing -- it must
          // never include IBP-only company employees (plain
          // USER_TYPE_COMPANY_EMPLOYEE, i.e. NOT also an IIRM/iWork
          // employee). Applied via customWhereCondition (not the `where`
          // param) because fetchEntityList's relation-filter support only
          // does plain equality, and this needs a negation.
          const excludeIbpOnlyEmployees = new Brackets((qb) => {
            qb.where("user.userTypeKey != :excludedUserType", {
              excludedUserType: USER_TYPE_COMPANY_EMPLOYEE,
            });
          });

          // Main data query — respects the status filter (statusWhere)
          const { data, count } = await this.entityService.fetchEntityList(
            Employee,
            page,
            limit,
            sortArray,
            employeeRelations,
            statusWhere as any,
            undefined,
            resolvedSearchArray,
            undefined,
            searchBy,
            ["firstName", "lastName"],
            undefined,
            undefined,
            undefined,
            undefined,
            excludeIbpOnlyEmployees
          );

          // Inactive count KPI — must reflect ALL active filters including status.
          // Short-circuit when a status filter is applied to avoid an extra query:
          //   status=Inactive → inactiveCount === main count (all results are inactive)
          //   status=Active   → inactiveCount === 0 (no inactive employees in this view)
          //   no status filter → run a separate filtered inactive count query
          let inactiveCount = 0;
          if (statusWhere) {
            inactiveCount =
              inactiveLookup && statusWhere.statusLid === inactiveLookup.id
                ? count
                : 0;
          } else if (inactiveLookup) {
            const inactiveResult = await this.entityService.fetchEntityList(
              Employee,
              1,
              1,
              [],
              employeeRelations,
              { statusLid: inactiveLookup.id } as any,
              undefined,
              resolvedSearchArray,
              undefined,
              searchBy,
              ["firstName", "lastName"],
              undefined,
              undefined,
              undefined,
              undefined,
              excludeIbpOnlyEmployees
            );
            inactiveCount = inactiveResult.count;
          }

          const statusLid = [
            ...new Set(
              data.map((employee) => employee.statusLid).filter(Boolean)
            ),
          ];
          const salutationLid = [
            ...new Set(
              data.map((employee) => employee.salutationLid).filter(Boolean)
            ),
          ];

          const allLids = [...statusLid, ...salutationLid];
          const lookUpValues =
            allLids.length > 0
              ? await this.entityService.getLookupValues(allLids)
              : [];

          // Reporting chain for the "Reporting Hierarchy" grid column — built
          // for just this page's employees, inside the same transaction, so
          // the frontend gets it in the same response instead of a second
          // round trip. Reads only the precomputed employee_hierarchy table
          // (see buildReportingChains), so this doesn't add any live
          // recursive-query cost to the listing.
          const reportingChains = await this.buildReportingChains(
            entityManager,
            data.map((employee) => employee.userId).filter(Boolean)
          );

          const employeeData = data.map((employee) => {
            const statusLookup = lookUpValues.find(
              (item) => item.id === employee.statusLid
            );

            const salutation = lookUpValues.find(
              (item) => item.id === employee.salutationLid
            );

            return this.mapEmployeeToDto(
              {
                ...employee,
                statusLookup: statusLookup ?? null,
                salutation: salutation ?? null,
                reportingChain: reportingChains.get(employee.userId) ?? [],
              } as any,
              false
            );
          });

          return {
            data: employeeData,
            count: count,
            inactiveCount,
          };
        } catch (error) {
          throw new InternalServerErrorException(
            error instanceof Error ? error.message : "An unknown error occurred"
          );
        }
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  }

  /**
   * Retrieves a single Employee record by its ID.
   */
  /**
   * Resolve the employee PK for a user. The `userid` header carries
   * employee.user_id, which is a different key space from employee.id, so
   * self-service callers must translate before hitting getEmployeeById.
   */
  async findEmployeeIdByUserId(userId: number): Promise<number | null> {
    const employee = await this.employeeRepository.findOne({
      where: { userId },
      select: { employeeId: true },
    });
    return employee?.employeeId ?? null;
  }

  async getEmployeeById(employeeId: number): Promise<EmployeeDto | null> {
    try {
      // return await this.dataSource.transaction(async (entityManager) => {

      const data = await this.employeeRepository.findOne({
        where: { employeeId: employeeId },
        relations: {
          user: true,
          userRoles: {
            role: true,
          },
          designation: true,
          organisation: true,
          sbu: true,
          vertical: true,
          department: true,
          branch: true,
          reportingTo: {
            department: true,
            designation: true,
            organisation: true,
            sbu: true,
            vertical: true,
            userRoles: {
              role: true,
            },
            branch: true,
          },

          reportees: {
            department: true,
            designation: true,
            organisation: true,
            sbu: true,
            vertical: true,
            userRoles: {
              role: true,
            },
            branch: true,
          },
        },
      });

      if (!data) {
        throw new NotFoundException(`Employee with ID ${employeeId} not found`);
      }

      const employee = data;

      // Extract unique lookup IDs
      const lookupIds = [
        employee.statusLid,
        employee.salutationLid,

        employee.reportingTo?.statusLid,
        employee.reportingTo?.salutationLid,

        ...employee.reportees.flatMap((reportee) => [
          reportee.statusLid,
          reportee.salutationLid,
        ]),
      ].filter(Boolean);
      const allLids = lookupIds.filter((id): id is number => id !== undefined);
      // Fetch lookup values in a single call
      const lookUpValues =
        allLids.length > 0
          ? await this.entityService.getLookupValues(allLids)
          : [];

      // Massage the data
      const enrichedEmployee = {
        employeeId: employee.employeeId,
        firstName: employee.firstName,
        lastName: employee.lastName,
        emailId: employee.emailId,
        mobile: employee.mobile,
        userId: employee.userId,
        iirmEmpId: employee.iirmEmpId,
        status: lookUpValues.find((item) => item.id === employee.statusLid),
        loginName: employee.user.loginName,
        dateOfBirth: employee.dateOfBirth,
        dateOfJoining: employee.dateOfJoining,
        salutation: lookUpValues.find(
          (item) => item.id === employee.salutationLid
        ),
        designation: employee.designation
          ? {
              id: employee.designation.id,
              name: employee.designation.name,
              description: employee.designation.description,
            }
          : null,
        organisation: employee.organisation
          ? {
              id: employee.organisation.id,
              name: employee.organisation.name,
              description: employee.organisation.description,
            }
          : null,
        sbu: employee.sbu
          ? {
              id: employee.sbu.id,
              name: employee.sbu.name,
              description: employee.sbu.description,
            }
          : null,
        vertical: employee.vertical
          ? {
              id: employee.vertical.id,
              name: employee.vertical.name,
              description: employee.vertical.description,
            }
          : null,
        department: employee.department
          ? {
              id: employee.department.id,
              name: employee.department.name,
              description: employee.department.description,
            }
          : null,
        branch: employee.branch
          ? {
              id: employee.branch.id,
              name: employee.branch.name,
            }
          : null,
        userRoles: employee.userRoles.map((userRole) => ({
          id: userRole.role.id,
          name: userRole.role.name,
          description: userRole.role.description,
        })),
        reportingTo: employee.reportingTo
          ? {
              employeeId: employee.reportingTo.employeeId,
              firstName: employee.reportingTo.firstName,
              lastName: employee.reportingTo.lastName,
              emailId: employee.reportingTo.emailId,
              mobile: employee.reportingTo.mobile,
              userId: employee.reportingTo.userId,
              designation: employee.reportingTo.designation
                ? {
                    id: employee.reportingTo.designation.id,
                    name: employee.reportingTo.designation.name,
                    description: employee.reportingTo.designation.description,
                  }
                : null,
              organisation: employee.reportingTo.organisation
                ? {
                    id: employee.reportingTo.organisation.id,
                    name: employee.reportingTo.organisation.name,
                    description: employee.reportingTo.organisation.description,
                  }
                : null,
              sbu: employee.reportingTo.sbu
                ? {
                    id: employee.reportingTo.sbu.id,
                    name: employee.reportingTo.sbu.name,
                    description: employee.reportingTo.sbu.description,
                  }
                : null,
              vertical: employee.reportingTo.vertical
                ? {
                    id: employee.reportingTo.vertical.id,
                    name: employee.reportingTo.vertical.name,
                    description: employee.reportingTo.vertical.description,
                  }
                : null,
              department: employee.reportingTo.department
                ? {
                    id: employee.reportingTo.department.id,
                    name: employee.reportingTo.department.name,
                    description: employee.reportingTo.department.description,
                  }
                : null,
              branch: employee.branch
                ? {
                    id: employee.branch.id,
                    name: employee.branch.name,
                  }
                : null,
              status: lookUpValues.find(
                (item) => item.id === employee.reportingTo?.statusLid
              ),
              salutation: lookUpValues.find(
                (item) => item.id === employee.reportingTo?.salutationLid
              ),
              userRoles: employee.reportingTo.userRoles.map((userRole) => ({
                id: userRole.role.id,
                name: userRole.role.name,
                description: userRole.role.description,
              })),
            }
          : null,
        reportees: employee.reportees.map((reportee) => ({
          employeeId: reportee.employeeId,
          firstName: reportee.firstName,
          lastName: reportee.lastName,
          emailId: reportee.emailId,
          mobile: reportee.mobile,
          userId: reportee.userId,
          designation: reportee.designation
            ? {
                id: reportee.designation.id,
                name: reportee.designation.name,
                description: reportee.designation.description,
              }
            : null,
          organisation: reportee.organisation
            ? {
                id: reportee.organisation.id,
                name: reportee.organisation.name,
                description: reportee.organisation.description,
              }
            : null,
          sbu: reportee.sbu
            ? {
                id: reportee.sbu.id,
                name: reportee.sbu.name,
                description: reportee.sbu.description,
              }
            : null,
          vertical: reportee.vertical
            ? {
                id: reportee.vertical.id,
                name: reportee.vertical.name,
                description: reportee.vertical.description,
              }
            : null,
          department: reportee.department
            ? {
                id: reportee.department.id,
                name: reportee.department.name,
                description: reportee.department.description,
              }
            : null,
          branch: reportee.branch
            ? {
                id: reportee.branch.id,
                name: reportee.branch.name,
              }
            : null,

          userRoles: reportee.userRoles.map((userRole) => ({
            id: userRole.role.id,
            name: userRole.role.name,
            description: userRole.role.description,
          })),
          status: lookUpValues.find((item) => item.id === reportee.statusLid),
          salutation: lookUpValues.find(
            (item) => item.id === reportee.salutationLid
          ),
        })),
      };

      return enrichedEmployee;
    } catch (error) {
      console.log("Error in getEmployeeById:", error);
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeRepository",
          method: "getEmployeeById",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  }

  async getEmployeeByEmailId(emailId: string) {
    try {
      // return await this.dataSource.transaction(async (entityManager) => {

      const data = await this.employeeRepository.findOne({
        where: { emailId: emailId },
      });

      if (!data) {
        throw new NotFoundException(
          `Employee with Email ID ${emailId} not found`
        );
      }
      return data;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeRepository",
          method: "getEmployeeByEmailId",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  }

  async getCompanyEmployeeByEmailId(emailId: string) {
    try {
      const data = await this.companyEmployeeRepository.findOne({
        where: { email: emailId },
      });

      if (!data) {
        throw new NotFoundException(
          `Company employee with Email ID ${emailId} not found`
        );
      }
      return data;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeRepository",
          method: "getCompanyEmployeeByEmailId",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  }
  /**
   * Updates an existing Employee record by its ID.
   */
  async updateEmployeeById(
    employeeId: number,
    employeeObject: UpdateEmployeeDto,
    userId: number
  ) {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const updateObject = {
          salutationLid: employeeObject.salutationLid,
          firstName: employeeObject.firstName,
          lastName: employeeObject.lastName,
          mobile: employeeObject.mobile,
          branchId: employeeObject.branchId,
          departmentId: employeeObject.departmentId,
          verticalId: employeeObject.verticalId,
          sbuId: employeeObject.sbuId,
          organisationId: employeeObject.organisationId,
          designationId: employeeObject.designationId,
          iirmEmpId: employeeObject.iirmEmpId,
          dateOfBirth: employeeObject.dateOfBirth,
          dateOfJoining: employeeObject.dateOfJoining,
          updatedBy: userId,
        };
        const saveUser = {
          salutationLid: employeeObject.salutationLid,
          firstName: employeeObject.firstName,
          lastName: employeeObject.lastName,
          mobile: employeeObject.mobile,
          branchId: employeeObject.branchId,
          departmentId: employeeObject.departmentId,
          designationId: employeeObject.designationId,
          verticalId: employeeObject.verticalId,
          sbuId: employeeObject.sbuId,
          organisationId: employeeObject.organisationId,
          updatedBy: userId,
        };
        const { employee, user } = await this.validateUserEmployeeExists(
          entityManager,
          employeeId
        );

        if (
          employeeObject.emailId &&
          (employeeObject.emailId !== employee.emailId ||
            employeeObject.emailId !== user.emailId)
        ) {
          // Validate email is unique if it is being updated
          await this.validateEmailIsUnique(
            entityManager,
            employeeObject.emailId
          );
          saveUser.emailId = employeeObject.emailId;
          updateObject.emailId = employeeObject.emailId;
          if (user.emailId === user.loginName) {
            // If the loginName is same as emailId, then update the loginName as well
            saveUser.loginName = employeeObject.emailId;
          }
        }
        const updateHierarchyList = [];

        // If manager is changing, validate
        if (
          employee.reportingManagerEmployeeId !==
          employeeObject.reportingManagerEmployeeId
        ) {
          if (employeeId === employeeObject.reportingManagerEmployeeId) {
            throw new BadRequestException(infoMessages.reportingMgrSelf);
          }

          const reportingMgr = await this.validateReportingManager(
            entityManager,
            employeeObject.reportingManagerEmployeeId,
            employeeObject.reportees
          );

          updateObject.reportingUserId = reportingMgr?.userId ?? null;
          updateObject.reportingManagerEmployeeId =
            reportingMgr?.employeeId ?? null;
          saveUser.reportingUserId = reportingMgr?.userId ?? null;

          // Also invalidate the employee's OLD manager chain (captured here,
          // before Object.assign below overwrites employee.reportingUserId) —
          // otherwise old skip-level ancestors never get their downward
          // closure recomputed after a reassignment, and keep stale rows for
          // this employee's (and their own subtree's) closure indefinitely.
          const oldReportingUserId = employee.reportingUserId;
          if (oldReportingUserId) {
            updateHierarchyList.push(oldReportingUserId);
            await this.addParentsToUpdateList(
              entityManager,
              oldReportingUserId,
              updateHierarchyList
            );
          }

          if (reportingMgr) {
            updateHierarchyList.push(reportingMgr.userId);
            await this.addParentsToUpdateList(
              entityManager,
              reportingMgr.userId,
              updateHierarchyList
            );
          }
        }

        const isOrganisationChanged =
          employeeObject.organisationId !== undefined &&
          employeeObject.organisationId !== employee.organisationId;
        const shouldValidateHierarchy =
          isOrganisationChanged ||
          employeeObject.departmentId !== undefined ||
          employeeObject.branchId !== undefined ||
          employeeObject.verticalId !== undefined ||
          employeeObject.sbuId !== undefined;

        if (shouldValidateHierarchy) {
          const useExistingHierarchy = !isOrganisationChanged;
          await this.validateDeptBranch(entityManager, {
            departmentId: useExistingHierarchy
              ? employeeObject.departmentId ?? employee.departmentId
              : employeeObject.departmentId,
            branchId: useExistingHierarchy
              ? employeeObject.branchId ?? employee.branchId
              : employeeObject.branchId,
            verticalId: useExistingHierarchy
              ? employeeObject.verticalId ?? employee.verticalId
              : employeeObject.verticalId,
            organisationId: employeeObject.organisationId ?? employee.organisationId,
            sbuId: useExistingHierarchy
              ? employeeObject.sbuId ?? employee.sbuId
              : employeeObject.sbuId,
          });
        }

        // Update User & Employee
        Object.assign(user, saveUser);
        Object.assign(employee, updateObject);

        await entityManager.save(User, user);
        await entityManager.save(Employee, employee);

        await this.updateRoles(entityManager, employeeObject, user, userId);

        // Process Reportees
        const updateMgrList = await this.updateReportees(
          entityManager,
          user,
          employeeObject.reportees,
          employeeId,
          userId
        );
        updateHierarchyList.push(...updateMgrList);
        const uniqueList = [...new Set(updateHierarchyList)];

        // Now update the dependent hierarchy for all these people
        await this.updateEmployeeHierarchy(entityManager, uniqueList, userId);

        return true;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update employee: ${error.message}`
      );
    }
  }

  /**
   * Removes an employee by setting their status to inactive and reassigning their
   * reportees to a new manager. Any ownership of companies and opportunities should
   * be changed to the delegateOwner.
   */
  async deleteEmployeeById(
    employeeId: number,
    delegateOwnerUserId: number,
    newManagerUserId?: number
  ): Promise<boolean> {
    try {
      const result = await this.dataSource.transaction(
        async (entityManager) => {
          try {
            const { employee, user } = await this.validateUserEmployeeExists(
              entityManager,
              employeeId
            );

            const delegateUser = await entityManager.findOne(User, {
              where: { userId: delegateOwnerUserId },
            });
            if (!delegateUser) {
              throw new NotFoundException(infoMessages.delegateUserNotFound);
            }

            // Find all active reportees of the employee
            const reportees = await entityManager.find(User, {
              where: {
                reportingUserId: user.userId,
                userStatusKey: USER_STATUS_ACTIVE,
              },
            });

            const updateHierarchyList = [user.userId];
            await this.addParentsToUpdateList(
              entityManager,
              user.userId,
              updateHierarchyList
            );

            if (reportees && reportees.length > 0) {
              // Check if the new manager exists and is active
              const { newMgrEmployee, newMgrUser } =
                await this.validateManagerUserExists(
                  entityManager,
                  newManagerUserId
                );

              // Update the user and employee tables to set the reporting user Id
              // and reporting Mgr Id to the new manager for all the reportees
              const reporteeIdList = reportees.map((r) => r.userId);
              entityManager.update(
                User,
                {
                  userId: In(reporteeIdList),
                },
                {
                  reportingUserId: newMgrUser.userId,
                }
              );
              entityManager.update(
                Employee,
                {
                  userId: In(reporteeIdList),
                },
                {
                  reportingUserId: newMgrUser.userId,
                  reportingManagerEmployeeId: newMgrEmployee.employeeId,
                }
              );

              updateHierarchyList.push(newMgrUser.userId);
              await this.addParentsToUpdateList(
                entityManager,
                user.userId,
                updateHierarchyList
              );
            }

            const lookupIds = await entityManager.getRepository(LookUp).find({
              where: {
                lookUpKey: In([
                  EMPLOYEE_STATUS_INACTIVE,
                  OPTY_STAGE_WIP,
                  OPTY_STAGE_OPEN,
                  ACTIVITY_STATUS_COMPLETED,
                ]),
              },
            });

            const inActiveStatus = lookupIds?.find(
              (l) => l.lookUpKey === EMPLOYEE_STATUS_INACTIVE
            );
            const optyOpen = lookupIds?.find(
              (l) => l.lookUpKey === OPTY_STAGE_OPEN
            );
            const optyWIP = lookupIds?.find(
              (l) => l.lookUpKey === OPTY_STAGE_WIP
            );
            const activityCompleted = lookupIds?.find(
              (l) => l.lookUpKey === ACTIVITY_STATUS_COMPLETED
            );

            if (!inActiveStatus || !optyOpen || !optyWIP) {
              throw new NotFoundException(
                "Lookups for Employee Status or Opportunity Stages not found"
              );
            }

            // We should change ownership of any company & opportunity objects to
            // the delegated user.
            await entityManager.update(
              Company,
              { leadCRM: user.userId },
              { leadCrm: delegateUser.userId }
            );
            await entityManager.update(
              Company,
              { accountManager: user.userId },
              { accountManager: delegateUser.userId }
            );

            // @TODO: Update Opportunity & Activity Maps also!
            /* 
          ** Should we update only Open & WIP Opportunities only?? or all of them?
          await entityManager.update(Opportunity, {
            leadCrm: user.userId,
            stageLid: In([optyOpen.id, optyWIP.id]),
          }, {
            leadCrm: delegateUser.userId
          })
          await entityManager.update(OpportunityActivityMap, {
            activityOwnerId: user.userId,
            statusLid: Not(activityCompleted?.id),
          }, {
            activityOwnerId: delegateUser.userId
          })

          */

            // Update employee and user tables for the employee being deleted
            await entityManager.update(
              User,
              { userId: employee.userId },
              { userStatusKey: USER_STATUS_DELETED }
            );
            await entityManager.update(
              Employee,
              { employeeId: employee.employeeId },
              { statusLid: inActiveStatus.id }
            );

            return true;
          } catch (error) {
            if (error instanceof Error) {
              throw new InternalServerErrorException(`${error.message}`);
            } else {
              throw new InternalServerErrorException(
                "An unknown error occurred"
              );
            }
          }
        }
      );
      return result;
    } catch (error) {
      if (error instanceof Error) {
        throw new InternalServerErrorException(`${error.message}`);
      } else {
        throw new InternalServerErrorException("An unknown error occurred");
      }
    }
  }

  /**
   * THIS NEEDS UPDATING BASED ON ALL THE CHANGES TO THE EMPLOYEE ADDITION @TODO
   * NOT SURE IF THIS FUNCTIONALITY IS NEEDED OR SUPPORTED BY BUSINESS REQUIREMENTS
   * MAY HAVE TO DISABLE THE ENDPOINT
   * Moves an employee to leave status and assigns a delegate.
   */
  async moveEmployeeToLeave(
    employeeId: number,
    delegateId: number
  ): Promise<void> {
    // Check if the employee exists
    const employee = await this.employeeRepository.findOne({
      where: { employeeId: employeeId },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    // Check if the delegate exists
    const delegate = await this.employeeRepository.findOne({
      where: { employeeId: delegateId },
    });
    if (!delegate) {
      throw new NotFoundException(`Delegate with ID ${delegateId} not found`);
    }
    const leaveStatus = await this.dataSource.getRepository(LookUp).findOne({
      where: { lookUpKey: EMPLOYEE_STATUS_LEAVE },
    });
    if (!leaveStatus) {
      throw new NotFoundException("Leave status lookup not found");
    }
    const reportees = await this.employeeRepository.find({
      where: { reportingManagerEmployeeId: employeeId },
    });

    for (const reportee of reportees) {
      reportee.reportingManagerEmployeeId = delegateId;
      await this.employeeRepository.save(reportee);
    }

    // Update the employee's status to Leave and assign the delegate
    employee.statusLid = leaveStatus.id;
    await this.employeeRepository.save(employee);
  }

  /**
   * Retrieves all employees reporting to a specific manager.
   */
  async getEmployeesByManagerId(managerId: number): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { reportingManagerEmployeeId: managerId },
    });
  }

  /**
   * Retrieves the employees with few values.
   */
  async getListOfEmployeesValues(
    sortArray: { field: string; order: "ASC" | "DESC" }[],
    searchArray: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    searchBy: string,
    page: number,
    limit: number,
    search: string,
    entityIds?: number[]
  ): Promise<{ data: Partial<EmployeeDto>[]; count: number }> {
    try {
      const selectedFields: (keyof Employee)[] = [
        "employeeId",
        "userId",
        "firstName",
        "lastName",
        "emailId",
        "statusLid",
      ];
      const inactiveStatus = await this.dataSource
        .getRepository(LookUp)
        .findOne({
          where: { lookUpKey: EMPLOYEE_STATUS_INACTIVE },
        });
      const leaveStatus = await this.dataSource.getRepository(LookUp).findOne({
        where: { lookUpKey: EMPLOYEE_STATUS_LEAVE },
      });
      const { data, count } = await this.entityService.fetchEntityList(
        Employee,
        page,
        limit,
        sortArray,
        undefined,
        {
          statusLid: Not(inactiveStatus.id),
        },
        selectedFields,
        searchArray,
        undefined,
        search,
        ["firstName", "lastName"]
      );
      let finalData = data;
      if (entityIds && entityIds.length > 0) {
        const existingEmployeeIds = new Set(data.map((r) => r.employeeId));
        const missingEmployeeIds = entityIds.filter(
          (id) => !existingEmployeeIds.has(id)
        );
        if (missingEmployeeIds.length > 0) {
          const additional = await this.employeeRepository.find({
            where: {
              employeeId: In(missingEmployeeIds),
              statusLid: Not(inactiveStatus.id),
            },
            select: ["employeeId", "firstName", "emailId", "statusLid"],
          });
          finalData = finalData.concat(additional);
        }
      }
      return {
        data: finalData.map((employee) => ({
          employeeId: employee.employeeId,
          userId: employee.userId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          emailId: employee.emailId,
        })),
        count,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to fetch employee list"
      );
    }
  }

  /**
   * Removes specific fields from an object.
   */
  removeFields<T extends Record<string, any>>(
    obj: T,
    additionalFieldsToRemove: string[] = []
  ): Partial<T> {
    const defaultFieldsToRemove = [
      EMPLOYEE_FIELDS.CREATED_AT,
      EMPLOYEE_FIELDS.UPDATED_AT,
      EMPLOYEE_FIELDS.CREATED_BY,
      EMPLOYEE_FIELDS.UPDATED_BY,
      EMPLOYEE_FIELDS.STATUS_LID,
      EMPLOYEE_FIELDS.ORGANIZATION_LID,
      EMPLOYEE_FIELDS.BRANCH_LID,
      EMPLOYEE_FIELDS.DEPARTMENT_ID,
      EMPLOYEE_FIELDS.DESIGNATION_ID,
      EMPLOYEE_FIELDS.SBU_ID,
      EMPLOYEE_FIELDS.VERTICAL_ID,
      EMPLOYEE_FIELDS.IWORK_ROLE_ID,
      EMPLOYEE_FIELDS.REPORTING_USER_ID,
      EMPLOYEE_FIELDS.REPORTING_MANAGER_EMPLOYEE_ID,
      EMPLOYEE_FIELDS.STATUS_LOOKUP,
      EMPLOYEE_FIELDS.SALUTATION_LID,
      EMPLOYEE_FIELDS.ROLE_ID,
      EMPLOYEE_FIELDS.DELETED_AT,
    ];
    const fieldsToRemove = [
      ...defaultFieldsToRemove,
      ...additionalFieldsToRemove,
    ];
    return Object.keys(obj).reduce((result, key) => {
      if (!fieldsToRemove.includes(key)) {
        (result as any)[key] = (obj as any)[key];
      }
      return result;
    }, {} as Partial<T>);
  }

  /**
   * Maps an Employee entity to an EmployeeDto with improved error handling
   */
  mapEmployeeToDto(employee: Employee, isGetById: boolean): EmployeeDto {
    try {
      return new EmployeeDto({
        ...this.removeFields(employee),
        status: employee.statusLookup ?? null,
        salutation: employee.salutation ?? null,
        branch: employee.branch
          ? {
              id: employee.branch.id,
              name: employee.branch.name,
            }
          : null,
        userRoles: employee.userRoles
          ? employee.userRoles.map((userRole) => ({
              id: userRole.id,
              roleId: userRole.role.id,
              roleName: userRole.role.name,
              roleDescription: userRole.role.description,
            }))
          : [],
        reportingTo: employee.reportingTo
          ? this.mapReportingToDto(employee.reportingTo)
          : null,
        reportees: employee.reportees
          ? this.mapReporteesDto(employee.reportees)
          : null,
      });
    } catch (error) {
      throw new InternalServerErrorException("Error mapping employee data");
    }
  }

  /**
   * Helper method to map entity without common fields
   */
  private mapEntityWithoutCommonFields<T extends Record<string, any>>(
    entity: T | null | undefined
  ): Partial<T> | null {
    if (!entity) return null;
    return this.removeFields(entity, [
      "description",
      "lookUpValueKey",
      "lookUpName",
      "lookUpKey",
    ]);
  }

  /**
   * Helper method to map reporting to DTO
   */
  private mapReportingToDto(reportingTo: Employee): EmployeeDto {
    return new EmployeeDto({
      ...this.removeFields(reportingTo),
      status: reportingTo.statusLookup ?? null,
      salutation: reportingTo.salutation ?? null,
      iworkRole: reportingTo.iworkRole ?? null,
      // location: this.mapEntityWithoutCommonFields(reportingTo.location) ?? null,
      sbu: reportingTo.sbu ?? null,
      vertical: reportingTo.vertical ?? null,
      branch: reportingTo.branch ?? null,
      role: this.mapEntityWithoutCommonFields(reportingTo.role) ?? null,
    });
  }

  /**
   * Helper method to map reportees DTO
   */
  private mapReporteesDto(reportees: Employee[]): EmployeeDto[] {
    return reportees.map(
      (reportee) =>
        new EmployeeDto({
          ...this.removeFields(reportee),
          status: reportee.statusLookup ?? null,
          salutation: reportee.salutation ?? null,
          iworkRole: reportee.iworkRole ?? null,
          // location:
          //   this.mapEntityWithoutCommonFields(reportee.location) ?? null,
          sbu: reportee.sbu ?? null,
          vertical: reportee.vertical ?? null,
          branch: reportee.branch ?? null,
          role: this.mapEntityWithoutCommonFields(reportee.role) ?? null,
        })
    );
  }

  /**
   * Builds each given employee's ordered reporting chain (root manager -> ...
   * -> the employee) for display, e.g. a grid column. Reads ONLY from the
   * precomputed employee_hierarchy closure table -- deliberately not a live
   * recursive walk over `users`, to stay consistent with keeping runtime
   * hierarchy computation out of scope for this feature.
   *
   * employee_hierarchy has no depth/level column, but ordering can still be
   * derived: for a given employee, the set of their ancestors is a strict
   * linear chain (each user has exactly one direct manager), so for any two
   * ancestors A and B of the same employee, one is always an ancestor of the
   * other. That means depth(A) = the count of the employee's OTHER ancestors
   * that are themselves ancestors of A -- 0 for the root, highest for the
   * employee's direct manager. Computed with one self-join, batched across
   * every employee on the page in a single query.
   */
  async getReportingChains(
    userIds: number[]
  ): Promise<Map<number, { userId: number; firstName: string; lastName: string }[]>> {
    return this.buildReportingChains(this.dataSource, userIds);
  }

  /**
   * Core logic behind getReportingChains, extracted so getEmployees can build
   * chains for its own page of results inside the SAME transaction (avoiding
   * a second round trip from the frontend for the common "list employees"
   * case) while getReportingChains keeps working standalone for any other
   * caller. `queryRunner` is anything exposing `.query()` -- both DataSource
   * and EntityManager satisfy that.
   */
  private async buildReportingChains(
    queryRunner: { query: (sql: string, parameters?: any[]) => Promise<any> },
    userIds: number[]
  ): Promise<Map<number, { userId: number; firstName: string; lastName: string }[]>> {
    const chains = new Map<
      number,
      { userId: number; firstName: string; lastName: string }[]
    >();
    for (const empId of userIds) {
      chains.set(empId, []);
    }

    if (!userIds.length) {
      return chains;
    }

    const rawSqlString = `
      WITH target_ancestors AS (
        SELECT user_id AS emp_id, reporting_user_id AS ancestor_id
        FROM employee_hierarchy
        WHERE user_id = ANY($1::int[])
      )
      SELECT
        ta.emp_id,
        ta.ancestor_id,
        COUNT(eh2.reporting_user_id) AS depth_from_root
      FROM target_ancestors ta
      LEFT JOIN employee_hierarchy eh2
        ON eh2.user_id = ta.ancestor_id
       AND eh2.reporting_user_id IN (
             SELECT ta2.ancestor_id FROM target_ancestors ta2 WHERE ta2.emp_id = ta.emp_id
           )
      GROUP BY ta.emp_id, ta.ancestor_id
      ORDER BY ta.emp_id, depth_from_root ASC
    `;
    const ancestorRows: { emp_id: number; ancestor_id: number; depth_from_root: string }[] =
      await queryRunner.query(rawSqlString, [userIds]);

    // Resolve display names in one flat (non-recursive) lookup covering both
    // ancestor ids and the target employees themselves.
    const allIds = [...new Set([...ancestorRows.map((row) => row.ancestor_id), ...userIds])];
    const nameRows: { id: number; first_name: string; last_name: string }[] = allIds.length
      ? await queryRunner.query(
          `SELECT id, first_name, last_name FROM users WHERE id = ANY($1::int[])`,
          [allIds]
        )
      : [];
    const nameById = new Map(
      nameRows.map((row) => [row.id, { firstName: row.first_name, lastName: row.last_name }])
    );

    for (const row of ancestorRows) {
      const name = nameById.get(row.ancestor_id);
      chains.get(row.emp_id)?.push({
        userId: row.ancestor_id,
        firstName: name?.firstName ?? "",
        lastName: name?.lastName ?? "",
      });
    }

    // Truncate above the display root: user 2 (Ramakrishna Vurakaranam) is
    // the effective top of the org for display purposes -- everything above
    // him (id 342395 "SystemAdmin Read", id -1 "System Admin") only exists
    // for internal/system bookkeeping and is meaningless to show as someone's
    // manager chain. Rows are root-first (depth_from_root ASC), so once the
    // display root is found, drop everything before it. Only affects
    // chains that actually pass through him; anyone not under him is left
    // untouched.
    for (const [empId, chain] of chains) {
      const rootIndex = chain.findIndex((entry) => entry.userId === HIERARCHY_DISPLAY_ROOT_USER_ID);
      if (rootIndex > 0) {
        chains.set(empId, chain.slice(rootIndex));
      }
    }

    // Append the employee themselves as the terminal node
    // ("root -> ... -> this employee").
    for (const empId of userIds) {
      const selfName = nameById.get(empId);
      chains.get(empId)?.push({
        userId: empId,
        firstName: selfName?.firstName ?? "",
        lastName: selfName?.lastName ?? "",
      });
    }
    return chains;
  }

  /**
   * Retrieves the hierarchy for a given root userId.
   * The SQL logic to fetch the hierarchy will be implemented here.
   */
  async getEmployeeHierarchyByUserId(
    userId: number,
    parentFlag = false
  ): Promise<any> {
    const lookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: USER_STATUS_ACTIVE },
    });

    const joinString = parentFlag
      ? "t.id = h.reporting_user_id"
      : "t.reporting_user_id = h.id";

    const rawSqlString = `
      WITH RECURSIVE HierarchyCTE AS (
        SELECT id, reporting_user_id, first_name, last_name, 0 AS Level,
          organisation_id, sbu_id, vertical_id, department_id, branch_id
        FROM users WHERE id = ${userId}
        
        UNION ALL
        
        SELECT t.id, t.reporting_user_id, t.first_name, t.last_name, h.Level + 1,
          t.organisation_id, t.sbu_id, t.vertical_id, t.department_id, t.branch_id
        FROM users t
        JOIN HierarchyCTE h ON ${joinString}
        AND t.user_type_key IN ('USER_TYPE_IIRM_EMPLOYEE', 'USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE')
      )
      SELECT id, reporting_user_id, first_name, last_name, Level,
        organisation_id, sbu_id, vertical_id, department_id, branch_id
      FROM HierarchyCTE
      ORDER BY Level, id
      limit 5000
    `;
    const dataRows = await this.dataSource.query(rawSqlString);
    if (!dataRows || dataRows.length === 0) {
      return null;
    }

    const users = [];
    dataRows.forEach((row) => {
      users.push({
        userId: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        reportingUserId: row.reporting_user_id,
        level: row.level,
        organisationId: row.organisation_id,
        sbuId: row.sbu_id,
        verticalId: row.vertical_id,
        departmentId: row.department_id,
        branchId: row.branch_id,
      });
    });

    return users;
  }

  async getParentUserWithPrivilege(
    userId: number,
    aclCategoryKey: string,
    aclActionKey: string
  ): Promise<number | null> {
    // First get the parent hierarchy for this user.
    const parentHierarchy = await this.getEmployeeHierarchyByUserId(
      userId,
      true
    );
    if (!parentHierarchy || parentHierarchy.length === 0) {
      // No parent hierarchy found, so no parents can have the privilege
      return null;
    }

    const parentIds = parentHierarchy
      .filter((u) => u.userId !== userId)
      .map((u) => u.userId);
    if (parentIds.length === 0) {
      return null;
    }
    const parentIdStr = parentIds.join(",");

    // Find users with the given privilege from within parentIds -
    // those users who have the corresponding roles that are in turn mapped to aclCategory & aclAction
    const rawQuery = `
      SELECT DISTINCT ur.user_id AS "userId"
      FROM user_role ur
      JOIN roles r ON ur.role_id = r.id
      JOIN role_acl_category_action_map racam ON r.id = racam.role_id
      JOIN acl_category_action_map acam ON racam.acl_category_action_id = acam.id
      JOIN acl_categories ac ON acam.acl_category_id = ac.id
      JOIN acl_actions aa ON acam.acl_action_id = aa.id
      WHERE ur.user_id IN (${parentIdStr})
      AND ac.category_key = '${aclCategoryKey}'
      AND aa.action_key = '${aclActionKey}'
    `;
    const usersWithPrivilege = await this.dataSource.query(rawQuery);
    if (!usersWithPrivilege || usersWithPrivilege.length === 0) {
      return null;
    }

    // Lets process the usersWithPrivilege and find the user at the lowest level
    // with the privilege. The original user's level is 0 and can be skipped
    // const privilegedUserIdsSet = new Set(usersWithPrivilege.map(row => row.userId));

    const parentObj = parentHierarchy.find((u) =>
      usersWithPrivilege.find((up) => up.userId === u.userId)
    );
    return parentObj || null;
  }

  // Get all users with a certain privilege (e.g., assigning an ISG user to Oppty)
  async getAllUsersWithPrivilege(
    aclCategoryKey: string,
    aclActionKey: string,
    page: number,
    limit: number,
    ignoreSuperUser: boolean = false
  ): Promise<any[]> {
    // Find users with the given privilege from within parentIds -
    // those users who have the corresponding roles that are in turn mapped to aclCategory & aclAction
    const superUserCondition = ignoreSuperUser
      ? "AND r.role_key <> 'ROLE_SUPER_USER'"
      : "";
    const rawQuery = `
      SELECT DISTINCT ur.user_id AS userId,
        u.first_name AS firstName,
        u.last_name AS lastName,
        u.reporting_user_id AS reportingUserId,
        u.organisation_id AS organisationId,
        u.sbu_id AS sbuId,
        u.vertical_id AS verticalId,
        u.department_id AS departmentId,
        u.branch_id AS branchId,
        dg.name AS designationName,
        dg.grade_level as gradeLevel
      FROM user_role ur
      JOIN users u ON ur.user_id = u.id
      JOIN org_designation dg ON u.designation_id = dg.id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_acl_category_action_map racam ON r.id = racam.role_id
      JOIN acl_category_action_map acam ON racam.acl_category_action_id = acam.id
      JOIN acl_categories ac ON acam.acl_category_id = ac.id
      JOIN acl_actions aa ON acam.acl_action_id = aa.id
      WHERE ac.category_key = '${aclCategoryKey}'
        AND aa.action_key = '${aclActionKey}'
        AND u.status_lid = (
        SELECT id FROM lookup_data WHERE lookup_key = 'USER_STATUS_ACTIVE'
        )
        ${superUserCondition}
      ORDER BY dg.grade_level ASC
      LIMIT ${limit} OFFSET ${(page - 1) * limit}
    `;
    const usersWithPrivilege = await this.dataSource.query(rawQuery);
    return usersWithPrivilege && usersWithPrivilege.length > 0
      ? usersWithPrivilege
      : [];
  }

  // Update the User Hierarchy flat list for all the given userIds
  private async updateEmployeeHierarchy(
    entityManager: EntityManager,
    userIds: number[],
    creator: number
  ): Promise<void> {
    // Delete the EmployeeHierarchy object for each of the userIds
    await entityManager.delete(EmployeeHierarchy, { userId: In(userIds) });

    await Promise.all(
      userIds.map((userId) =>
        this.addToFlatHierarchy(entityManager, userId, creator)
      )
    );
  }

  private async addToFlatHierarchy(
    entityManager: EntityManager,
    userId: number,
    creator: number
  ) {
    const rawSqlString = `
      WITH RECURSIVE HierarchyCTE AS (
        SELECT id, reporting_user_id, 1 AS lvl
        FROM users
        WHERE id = ${userId}

        UNION ALL

        SELECT u.id, u.reporting_user_id, h.lvl + 1 AS lvl
        FROM users u
        JOIN HierarchyCTE h
          ON u.reporting_user_id = h.id
          AND u.user_type_key IN ('USER_TYPE_IIRM_EMPLOYEE', 'USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE')
      )
      INSERT INTO employee_hierarchy (
        user_id, reporting_user_id, created_by, updated_by
      )
      SELECT id, ${userId}, ${creator}, ${creator}
      FROM HierarchyCTE
      WHERE id != ${userId}
      ORDER BY lvl, id;
    `;
    await entityManager.query(rawSqlString);
  }

  /**
   * Rebuilds the entire employee_hierarchy table.
   * This method iterates through all users and reconstructs their hierarchy.
   * Note: This can be a long-running operation on large datasets.
   */
  async rebuildFlatHierarchy(
    creator: number = DEFAULT_ADMIN_ID
  ): Promise<void> {
    await this.dataSource.transaction(async (entityManager) => {
      try {
        // 1. Clear existing hierarchy
        await entityManager.clear(EmployeeHierarchy);

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "EmployeeRepository",
            method: "rebuildFlatHierarchy",
            messageData: "Cleared EmployeeHierarchy table",
          }),
        });

        // 2. Bulk rebuild hierarchy using recursive CTE
    const bulkHierarchySql = `
        WITH RECURSIVE hierarchy AS (
          --  Base: all valid IIRM root users
          SELECT
            u.id AS root_user_id,
            u.id AS user_id,
            u.reporting_user_id,
            1 AS lvl
          FROM users u
          WHERE u.user_type_key IN (
            'USER_TYPE_IIRM_EMPLOYEE',
            'USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE'
          )

          UNION ALL

          -- Recursive: fetch subordinates
          SELECT
            h.root_user_id,
            u.id AS user_id,
            u.reporting_user_id,
            h.lvl + 1 AS lvl
          FROM users u
          JOIN hierarchy h
            ON u.reporting_user_id = h.user_id
          WHERE u.user_type_key IN (
            'USER_TYPE_IIRM_EMPLOYEE',
            'USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE'
          )
        )

        INSERT INTO employee_hierarchy (
          user_id,
          reporting_user_id,
          created_by,
          updated_by
        )
        SELECT DISTINCT ON (root_user_id, user_id)
          user_id,
          root_user_id,
          ${creator},
          ${creator}
        FROM hierarchy
        WHERE user_id != root_user_id
        ORDER BY root_user_id, user_id, lvl;
        `;

        await entityManager.query(bulkHierarchySql);

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "EmployeeRepository",
            method: "rebuildFlatHierarchy",
            messageData:
              "Successfully rebuilt EmployeeHierarchy using bulk recursive insert",
          }),
        });
      } catch (error) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "EmployeeRepository",
            method: "rebuildFlatHierarchy",
            messageData: error,
          }),
        });

        throw new InternalServerErrorException(
          error instanceof Error
            ? error.message
            : "Failed to rebuild employee hierarchy"
        );
      }
    });
  }

  /**
   * Updates the password for the user and employee tables.
   * @param userId - ID of the user whose password should be updated.
   * @param hashedPassword - New hashed password.
   */
  async updateUserPassword(userId: number, hashedPassword: string) {
    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        User,
        { userId },
        { password: hashedPassword, isPasswordSet: true }
      );
    });
  }

  async updateIbpPassword(userId: number, hashedPassword: string) {
    await this.dataSource.transaction(async (manager) => {
      await manager.update(
        User,
        { userId },
        { ibpPassword: hashedPassword, isPasswordSet: true }
      );
    });
  }

  async createSystemDefaultFilters(manager: EntityManager, employee: Employee) {
    try {
      // Get the user organization details
      const organisation = await manager.findOne(Organisation, {
        where: { id: employee.organisationId },
      });

      if (!organisation) {
        throw new NotFoundException("Organisation not found");
      }
      const filterLookups = await manager.find(LookUp, {
        where: {
          lookUpKey: In([
            FILTER_TYPE.SYSTEM,
            FILTER_STATUS.ACTIVE,
            DEFAULT_FILTER.YES,
          ]),
        },
      });
      const filterTypeSystemLid = filterLookups.find(
        (lookup) => lookup.lookUpKey === FILTER_TYPE.SYSTEM
      )?.id;
      if (!filterTypeSystemLid) {
        throw new NotFoundException(
          errorMessages.lookupKeyNotFound(FILTER_TYPE.SYSTEM)
        );
      }
      const filterStatusActiveLid = filterLookups.find(
        (lookup) => lookup.lookUpKey === FILTER_STATUS.ACTIVE
      )?.id;
      if (!filterStatusActiveLid) {
        throw new NotFoundException(
          errorMessages.lookupKeyNotFound(FILTER_STATUS.ACTIVE)
        );
      }
      const defaultFilterLid = filterLookups.find(
        (lookup) => lookup.lookUpKey === DEFAULT_FILTER.YES
      )?.id;
      if (!defaultFilterLid) {
        throw new NotFoundException(
          errorMessages.lookupKeyNotFound(DEFAULT_FILTER.YES)
        );
      }

      // Define all the default filters to create
      const defaultFilters = defaultFilter(
        Number(employee.userId),
        employee.firstName,
        employee.lastName,
        Number(organisation.id),
        organisation.name
      );

      // Insert all default filters
      for (const filter of defaultFilters) {
        const filterPreference = manager.create(FilterPreference, {
          entity: filter.entity,
          userId: employee.userId,
          filterName: filter.filterName,
          filterTypeLid: filterTypeSystemLid,
          defaultFilterLid: defaultFilterLid,
          statusLid: filterStatusActiveLid,
          filterJson: filter.filterJson,
          tableSettingJson: filter.tableSettingJson,
          createdBy: employee.userId,
          updatedBy: employee.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await manager.save(FilterPreference, filterPreference);
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EmployeeRepository",
          method: "createSystemDefaultFilters",
          messageData: `Created ${defaultFilters.length} default filters for user ${employee.userId}`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EmployeeRepository",
          method: "createSystemDefaultFilters",
          messageData: error,
        }),
      });

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create default filter: ${error.message}`
      );
    }
  }
  async getSuperUserId(currentUserId: number): Promise<number> {
    const currentUser = await this.userRepository.findOne({
      where: { userId: currentUserId },
    });
    if (!currentUser) {
      throw new NotFoundException("Current user not found");
    }
    const orgId = currentUser.organisationId;
    return orgId;
  }

  async getEmployeeHierarchyByOrgId(
    orgId: number,
    parentFlag = false
  ): Promise<any> {
    const joinString = parentFlag
      ? "t.id = h.reporting_user_id"
      : "t.reporting_user_id = h.id";

    const rawSqlString = `
      WITH RECURSIVE HierarchyCTE AS (
        SELECT id, reporting_user_id, first_name, last_name, 0 AS Level,
          organisation_id, sbu_id, vertical_id, department_id, branch_id
        FROM users WHERE organisation_id = ${orgId} and id > 1
        
        UNION ALL
        
        SELECT t.id, t.reporting_user_id, t.first_name, t.last_name, h.Level + 1,
          t.organisation_id, t.sbu_id, t.vertical_id, t.department_id, t.branch_id
        FROM users t
        JOIN HierarchyCTE h ON ${joinString}
      )
      SELECT id, reporting_user_id, first_name, last_name, Level,
        organisation_id, sbu_id, vertical_id, department_id, branch_id
      FROM HierarchyCTE
      ORDER BY Level, id
      limit 5000
    `;
    const dataRows = await this.dataSource.query(rawSqlString);
    if (!dataRows || dataRows.length === 0) {
      return null;
    }

    let users: any = [],
      userIds: number[] = [];
    dataRows.forEach((row) => {
      if (!userIds.includes(row.id) && row.organisation_id === orgId) {
        userIds.push(row.id);
        users.push({
          userId: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
          reportingUserId: row.reporting_user_id,
          level: row.level,
          organisationId: row.organisation_id,
          sbuId: row.sbu_id,
          verticalId: row.vertical_id,
          departmentId: row.department_id,
          branchId: row.branch_id,
        });
      }
    });

    return users;
  }
  async fetchReporteeUserIds(userId: number): Promise<any[]> {
    const repository = this.dataSource.getRepository(EmployeeHierarchy);
    const userDetails = await repository.find({
      where: { reportingUserId: userId },
      select: ["userId"],
    });
    let userIds = userDetails.map((user) => {
      return user.userId;
    });
    userIds.push(userId); // Including self userId
    userIds = [...new Set(userIds)]; // Ensure uniqueness after adding self
    const dataRows = await this.userRepository.find({
      where: { userId: In(userIds) },
      select: [
        "userId",
        "firstName",
        "lastName",
        "reportingUserId",
        "organisationId",
        "sbuId",
        "verticalId",
        "departmentId",
        "branchId",
      ],
    });

    const users: any[] = [];
    dataRows.forEach((row) => {
      users.push({
        userId: row.userId,
        firstName: row.firstName,
        lastName: row.lastName,
        reportingUserId: row.reportingUserId,
        organisationId: row.organisationId,
        sbuId: row.sbuId,
        verticalId: row.verticalId,
        departmentId: row.departmentId,
        branchId: row.branchId,
      });
    });

    return users;
  }

  // ─── Deactivation helpers ────────────────────────────────────────────────────

  /**
   * Returns counts of all records dependent on the given employee (for the
   * deactivation confirmation popup).
   */
  async getDeactivatePreview(employeeId: number): Promise<{
    companiesLeadCrm: number;
    companiesAccountManager: number;
    opportunities: number;
    policies: number;
    endorsements: number;
    activities: number;
    reportees: number;
    reportingUserId: number | null;
  }> {
    try {
      const employee = await this.employeeRepository.findOne({
        where: { employeeId },
        relations: ["user"],
      });
      if (!employee) {
        throw new NotFoundException(infoMessages.employeeNotFound);
      }
      const userId = employee.userId;
      const reportingUserId = employee.reportingUserId ?? null;

      const dataSource = this.dataSource;
      const [
        companiesLeadCrm,
        companiesAccountManager,
        opportunities,
        policies,
        endorsements,
        activities,
        reportees,
      ] = await Promise.all([
        dataSource.getRepository(Company).count({ where: { leadCrm: userId } }),
        dataSource.getRepository(Company).count({ where: { accountManager: userId } }),
        dataSource.getRepository(Opportunity).count({ where: { ownerId: userId } }),
        dataSource.getRepository(Policy).count({ where: { ownerId: userId } }),
        dataSource.getRepository(Endorsement).count({ where: { createdBy: userId } }),
        dataSource.getRepository(OpportunityActivityMap).count({ where: { ownerId: userId } }),
        dataSource.getRepository(User).count({ where: { reportingUserId: userId } }),
      ]);

      return {
        companiesLeadCrm,
        companiesAccountManager,
        opportunities,
        policies,
        endorsements,
        activities,
        reportees,
        reportingUserId,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to fetch deactivation preview"
      );
    }
  }

  /**
   * Returns the actual dependent records for the manual-assignment page.
   */
  /**
   * Resolves the userId for a given employeeId. Shared by all section helpers.
   */
  private async resolveUserIdForEmployee(employeeId: number): Promise<number> {
    const employee = await this.employeeRepository.findOne({
      where: { employeeId },
      relations: ["user"],
    });
    if (!employee) throw new NotFoundException(infoMessages.employeeNotFound);
    return employee.userId;
  }

  /**
   * Fetches dependent records for a single section type. Pass `type` to load
   * only that section; omit (or pass undefined) to load all sections at once.
   *
   * Supported types:
   *   companies-lead-crm | companies-account-manager | opportunities |
   *   policies | endorsements | activities | reportees
   */
  async getDeactivationRecords(
    employeeId: number,
    type?: string
  ): Promise<{
    companiesLeadCrm: { id: number; name: string }[];
    companiesAccountManager: { id: number; name: string }[];
    opportunities: { id: number; name: string }[];
    policies: { id: number; name: string }[];
    endorsements: { id: number; name: string }[];
    activities: { id: number; name: string; opportunityId: number; opportunityLabel: string }[];
    reportees: { userId: number; firstName: string; lastName: string }[];
  }> {
    try {
      const userId = await this.resolveUserIdForEmployee(employeeId);
      const dataSource = this.dataSource;

      const empty = {
        companiesLeadCrm: [],
        companiesAccountManager: [],
        opportunities: [],
        policies: [],
        endorsements: [],
        activities: [],
        reportees: [],
      };

      // ── helpers ────────────────────────────────────────────────────────────
      const fetchCompaniesLeadCrm = async () => {
        const rows = await dataSource.getRepository(Company).find({
          where: { leadCrm: userId },
          select: ["id", "companyName"] as any,
        });
        return (rows as any[]).map((companyRow) => ({
          id: companyRow.id,
          name: companyRow.companyName ?? `Company #${companyRow.id}`,
        }));
      };

      const fetchCompaniesAccountManager = async () => {
        const rows = await dataSource.getRepository(Company).find({
          where: { accountManager: userId },
          select: ["id", "companyName"] as any,
        });
        return (rows as any[]).map((companyRow) => ({
          id: companyRow.id,
          name: companyRow.companyName ?? `Company #${companyRow.id}`,
        }));
      };

      const fetchOpportunities = async () => {
        const rows = await dataSource.getRepository(Opportunity).find({
          where: { ownerId: userId },
          select: ["opportunityId"] as any,
        });
        return (rows as any[]).map((opportunityRow) => ({
          id: opportunityRow.opportunityId,
          name: `Opportunity #${opportunityRow.opportunityId}`,
        }));
      };

      const fetchPolicies = async () => {
        const rows = await dataSource.getRepository(Policy).find({
          where: { ownerId: userId },
          select: ["id", "insurerPolicyNumber"] as any,
        });
        return (rows as any[]).map((policyRow) => ({
          id: policyRow.id,
          name: policyRow.insurerPolicyNumber ?? `Policy #${policyRow.id}`,
        }));
      };

      const fetchEndorsements = async () => {
        const rows = await dataSource.getRepository(Endorsement).find({
          where: { createdBy: userId },
          select: ["id", "insurerEndorsementNumber"] as any,
        });
        return (rows as any[]).map((endorsementRow) => ({
          id: endorsementRow.id,
          name: endorsementRow.insurerEndorsementNumber ?? `Endorsement #${endorsementRow.id}`,
        }));
      };

      const fetchActivities = async () => {
        // Raw SQL join to include parent opportunity + company context
        const rows: Array<{
          id: number;
          activity_name: string;
          opportunity_id: number;
          company_name: string;
        }> = await dataSource.query(
          `SELECT a.id,
                  a.activity_name,
                  a.opportunity_id,
                  COALESCE(c.company_name, '') AS company_name
           FROM   opportunity_activity_map a
           LEFT   JOIN opportunity o ON o.id = a.opportunity_id
           LEFT   JOIN company c     ON c.id = o.company_id
           WHERE  a.owner_id = $1`,
          [userId]
        );
        return rows.map((activityRow) => ({
          id: activityRow.id,
          name: activityRow.activity_name ?? `Activity #${activityRow.id}`,
          opportunityId: activityRow.opportunity_id,
          opportunityLabel: activityRow.company_name
            ? `${activityRow.company_name} — Opp #${activityRow.opportunity_id}`
            : `Opportunity #${activityRow.opportunity_id}`,
        }));
      };

      const fetchReportees = async () => {
        const rows = await dataSource.getRepository(User).find({
          where: { reportingUserId: userId, userStatusKey: USER_STATUS_ACTIVE },
          select: ["userId", "firstName", "lastName"],
        });
        return rows.map((reporteeUser) => ({
          userId: reporteeUser.userId,
          firstName: reporteeUser.firstName,
          lastName: reporteeUser.lastName,
        }));
      };

      // ── single-section fast path ───────────────────────────────────────────
      if (type === "companies-lead-crm") {
        return { ...empty, companiesLeadCrm: await fetchCompaniesLeadCrm() };
      }
      if (type === "companies-account-manager") {
        return { ...empty, companiesAccountManager: await fetchCompaniesAccountManager() };
      }
      if (type === "opportunities") {
        return { ...empty, opportunities: await fetchOpportunities() };
      }
      if (type === "policies") {
        return { ...empty, policies: await fetchPolicies() };
      }
      if (type === "endorsements") {
        return { ...empty, endorsements: await fetchEndorsements() };
      }
      if (type === "activities") {
        return { ...empty, activities: await fetchActivities() };
      }
      if (type === "reportees") {
        return { ...empty, reportees: await fetchReportees() };
      }

      // ── full fetch (all sections in parallel) ─────────────────────────────
      const [
        companiesLeadCrm,
        companiesAccountManager,
        opportunities,
        policies,
        endorsements,
        activities,
        reportees,
      ] = await Promise.all([
        fetchCompaniesLeadCrm(),
        fetchCompaniesAccountManager(),
        fetchOpportunities(),
        fetchPolicies(),
        fetchEndorsements(),
        fetchActivities(),
        fetchReportees(),
      ]);

      return {
        companiesLeadCrm,
        companiesAccountManager,
        opportunities,
        policies,
        endorsements,
        activities,
        reportees,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to fetch deactivation records"
      );
    }
  }

  /**
   * Shared helper: applies user-type / status / role-deletion logic inside a
   * running transaction. Call this at the END of autoDeactivate / manualDeactivate
   * after all ownership has been reassigned.
   */
  private async applyDeactivationStatus(
    entityManager: EntityManager,
    employee: Employee,
    user: User
  ): Promise<void> {
    // Look up inactive status lids for user and employee
    const [userInactiveLookup, employeeInactiveLookup] = await Promise.all([
      entityManager.findOne(LookUp, { where: { lookUpKey: USER_STATUS_DELETED } }),
      entityManager.findOne(LookUp, { where: { lookUpKey: EMPLOYEE_STATUS_INACTIVE } }),
    ]);

    if (!userInactiveLookup || !employeeInactiveLookup) {
      throw new NotFoundException(
        "Lookup values for USER_STATUS_INACTIVE or EMPLOYEE_STATUS_INACTIVE not found"
      );
    }

    // User type key logic
    if (user.userTypeKey === USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE) {
      // Demote to company employee only — do NOT fully inactivate the user
      await entityManager.update(User, { userId: user.userId }, {
        userTypeKey: USER_TYPE_COMPANY_EMPLOYEE,
      });
    } else {
      // USER_TYPE_IIRM_EMPLOYEE or USER_TYPE_COMPANY_EMPLOYEE → fully inactive
      await entityManager.update(User, { userId: user.userId }, {
        userStatusKey: USER_STATUS_DELETED,
        statusLid: userInactiveLookup.id,
      });
    }

    // Always mark the employee record as inactive
    await entityManager.update(Employee, { employeeId: employee.employeeId }, {
      statusLid: employeeInactiveLookup.id,
    });

    // Delete all assigned roles for this user
    await entityManager.delete(UserRole, { userId: user.userId });
  }

  /**
   * Updates the employee_hierarchy table after deactivation: removes entries
   * for the deactivated user and rebuilds the closure for everyone whose
   * downward view might have changed — both the deactivated user's OLD
   * ancestors (who must stop seeing the reassigned subtree once the live
   * reporting_user_id no longer routes through the deactivated user) and the
   * NEW manager's own ancestor chain (who must start seeing it). Reuses the
   * exact same "affected ancestor ids -> addParentsToUpdateList ->
   * updateEmployeeHierarchy" recipe used for a normal manager reassignment in
   * updateEmployeeById — a plain in-place relabel of employee_hierarchy rows
   * (the previous approach here) only fixes the deactivated user's DIRECT
   * children and never touches skip-level ancestors above either branch,
   * which is what a full re-derive from live data (via addToFlatHierarchy)
   * corrects.
   *
   * Callers must re-point users.reporting_user_id / Employee.reportingUserId
   * for the affected reportees BEFORE calling this — addToFlatHierarchy reads
   * live data, so the ordering matters.
   */
  private async syncEmployeeHierarchy(
    entityManager: EntityManager,
    deactivatedUserId: number,
    newManagerUserId: number | null,
    creator: number = DEFAULT_ADMIN_ID
  ): Promise<void> {
    // Capture the deactivated user's own ancestor chain BEFORE deleting it —
    // employee_hierarchy already stores this flat, no recursion needed.
    const oldAncestorRows = await entityManager.find(EmployeeHierarchy, {
      where: { userId: deactivatedUserId },
    });
    const oldAncestorIds = oldAncestorRows.map((row) => row.reportingUserId);

    // Remove the deactivated user's own hierarchy entries (as child).
    await entityManager.delete(EmployeeHierarchy, { userId: deactivatedUserId });

    // Remove every stale row still referencing the deactivated user as an
    // ancestor — this is the WHOLE former subtree (employee_hierarchy stores
    // one row per descendant/ancestor pair regardless of depth), not just
    // direct reports. Always clear this; the rebuild below (or nothing, if
    // there's no replacement manager) is what's authoritative afterward.
    await entityManager.delete(EmployeeHierarchy, { reportingUserId: deactivatedUserId });

    if (!newManagerUserId) {
      return; // No replacement manager — nothing left to rebuild.
    }

    // Rebuild: recompute the downward closure of every OLD ancestor (will now
    // correctly exclude the moved subtree, since the live recursive walk in
    // addToFlatHierarchy breaks where former reportees no longer point back
    // to them) AND the NEW manager's own ancestor chain (will now correctly
    // include it).
    const affected = [...oldAncestorIds, newManagerUserId];
    await this.addParentsToUpdateList(entityManager, newManagerUserId, affected);
    const uniqueAffected = [...new Set(affected)];
    await this.updateEmployeeHierarchy(entityManager, uniqueAffected, creator);
  }

  /**
   * Auto-deactivate: reassign ALL dependent records to the employee's
   * reporting manager and mark the employee as inactive — in one transaction.
   */
  async autoDeactivate(employeeId: number): Promise<void> {
    try {
      await this.dataSource.transaction(async (entityManager) => {
        // 1. Load employee + user
        const employee = await entityManager.findOne(Employee, {
          where: { employeeId },
        });
        if (!employee) throw new NotFoundException(infoMessages.employeeNotFound);

        const user = await entityManager.findOne(User, {
          where: { userId: employee.userId },
        });
        if (!user) throw new NotFoundException(infoMessages.employeeNotFound);

        // 2. Validate reporting manager
        const reportingUserId = employee.reportingUserId;
        if (!reportingUserId) {
          throw new BadRequestException(
            "Employee has no reporting manager. Use manual deactivation to assign records manually."
          );
        }
        const reportingUser = await entityManager.findOne(User, {
          where: { userId: reportingUserId, userStatusKey: USER_STATUS_ACTIVE },
        });
        if (!reportingUser) {
          throw new NotFoundException(
            "Reporting manager not found or is inactive. Use manual deactivation."
          );
        }

        // 3. Reassign reportees (user hierarchy)
        // First: collect direct reportee userIds BEFORE updating
        const directReportUsers = await entityManager.find(User, {
          where: { reportingUserId: user.userId, userStatusKey: USER_STATUS_ACTIVE },
          select: ["userId"],
        });
        const reporteeUserIds = directReportUsers.map((directReportUser) => directReportUser.userId);

        await entityManager.update(
          User,
          { reportingUserId: user.userId, userStatusKey: USER_STATUS_ACTIVE },
          { reportingUserId: reportingUserId }
        );

        // Reassign employee reporting references for all former direct reportees
        if (reporteeUserIds.length > 0) {
          const reportingManagerEmployee = await entityManager.findOne(Employee, {
            where: { userId: reportingUserId },
          });
          await entityManager.update(
            Employee,
            { userId: In(reporteeUserIds) },
            {
              reportingUserId: reportingUserId,
              reportingManagerEmployeeId: reportingManagerEmployee?.employeeId ?? null,
            }
          );
        }

        const reassignToUserId = reportingUserId;

        // 4. Reassign company lead_crm
        await entityManager.update(
          Company,
          { leadCrm: user.userId },
          { leadCrm: reassignToUserId, updatedBy: reassignToUserId }
        );

        // 5. Reassign company account_manager
        await entityManager.update(
          Company,
          { accountManager: user.userId },
          { accountManager: reassignToUserId, updatedBy: reassignToUserId }
        );

        // 6. Reassign opportunities
        await entityManager.update(
          Opportunity,
          { ownerId: user.userId },
          { ownerId: reassignToUserId, updatedBy: reassignToUserId }
        );

        // 7. Reassign policies
        await entityManager.update(
          Policy,
          { ownerId: user.userId },
          { ownerId: reassignToUserId, updatedBy: reassignToUserId }
        );

        // 8. Reassign endorsements
        await entityManager.update(
          Endorsement,
          { createdBy: user.userId },
          { createdBy: reassignToUserId, updatedBy: reassignToUserId }
        );

        // 9. Reassign opportunity activity map
        await entityManager.update(
          OpportunityActivityMap,
          { ownerId: user.userId },
          { ownerId: reassignToUserId, updatedBy: reassignToUserId }
        );

        // 10. Sync hierarchy table
        await this.syncEmployeeHierarchy(entityManager, user.userId, reassignToUserId);

        // 11-15. Apply status + role deletion
        await this.applyDeactivationStatus(entityManager, employee, user);
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to auto-deactivate employee"
      );
    }
  }

  /**
   * Manual deactivate: apply specific per-record assignments provided by
   * the admin, validate no dependencies remain, then mark as inactive.
   */
  async manualDeactivate(employeeId: number, dto: ManualDeactivateDto): Promise<void> {
    try {
      await this.dataSource.transaction(async (entityManager) => {
        // 1. Load employee + user
        const employee = await entityManager.findOne(Employee, {
          where: { employeeId },
        });
        if (!employee) throw new NotFoundException(infoMessages.employeeNotFound);

        const user = await entityManager.findOne(User, {
          where: { userId: employee.userId },
        });
        if (!user) throw new NotFoundException(infoMessages.employeeNotFound);

        // 2. Apply company lead_crm reassignments
        for (const companyLeadAssignment of dto.companiesLeadCrmAssignments) {
          await entityManager.update(
            Company,
            { id: companyLeadAssignment.companyId },
            { leadCrm: companyLeadAssignment.newOwnerId, updatedBy: companyLeadAssignment.newOwnerId }
          );
        }

        // 3. Apply company account_manager reassignments
        for (const companyAccountAssignment of dto.companiesAccountManagerAssignments) {
          await entityManager.update(
            Company,
            { id: companyAccountAssignment.companyId },
            { accountManager: companyAccountAssignment.newOwnerId, updatedBy: companyAccountAssignment.newOwnerId }
          );
        }

        // 4. Apply opportunity reassignments
        for (const opportunityAssignment of dto.opportunityAssignments) {
          await entityManager.update(
            Opportunity,
            { opportunityId: opportunityAssignment.opportunityId },
            { ownerId: opportunityAssignment.newOwnerId, updatedBy: opportunityAssignment.newOwnerId }
          );
        }

        // 5. Apply policy reassignments
        for (const policyAssignment of dto.policyAssignments) {
          await entityManager.update(
            Policy,
            { id: policyAssignment.policyId },
            { ownerId: policyAssignment.newOwnerId, updatedBy: policyAssignment.newOwnerId }
          );
        }

        // 6. Apply endorsement reassignments
        for (const endorsementAssignment of dto.endorsementAssignments) {
          await entityManager.update(
            Endorsement,
            { id: endorsementAssignment.endorsementId },
            { createdBy: endorsementAssignment.newCreatedById, updatedBy: endorsementAssignment.newCreatedById }
          );
        }

        // 7. Apply activity map reassignments
        for (const activityAssignment of dto.activityAssignments) {
          await entityManager.update(
            OpportunityActivityMap,
            { id: activityAssignment.activityId },
            { ownerId: activityAssignment.newOwnerId, updatedBy: activityAssignment.newOwnerId }
          );
        }

        // 8. Reassign reportees if new manager provided
        if (dto.reporteesNewManagerUserId) {
          const newReportingManager = await entityManager.findOne(User, {
            where: { userId: dto.reporteesNewManagerUserId, userStatusKey: USER_STATUS_ACTIVE },
          });
          if (!newReportingManager) {
            throw new NotFoundException("New reporting manager not found or is inactive");
          }
          // Collect reportee userIds BEFORE updating
          const directReportUsers = await entityManager.find(User, {
            where: { reportingUserId: user.userId },
            select: ["userId"],
          });
          const reporteeUserIds = directReportUsers.map((directReportUser) => directReportUser.userId);
          await entityManager.update(
            User,
            { reportingUserId: user.userId },
            { reportingUserId: dto.reporteesNewManagerUserId }
          );
          const newReportingManagerEmployee = await entityManager.findOne(Employee, {
            where: { userId: dto.reporteesNewManagerUserId },
          });
          if (reporteeUserIds.length > 0) {
            await entityManager.update(
              Employee,
              { userId: In(reporteeUserIds) },
              {
                reportingUserId: dto.reporteesNewManagerUserId,
                reportingManagerEmployeeId: newReportingManagerEmployee?.employeeId ?? null,
              }
            );
          }
          await this.syncEmployeeHierarchy(
            entityManager,
            user.userId,
            dto.reporteesNewManagerUserId
          );
        } else {
          await this.syncEmployeeHierarchy(entityManager, user.userId, null);
        }

        // 9. Validate no unassigned dependencies remain
        const [
          remainingLeadCrm,
          remainingAccountMgr,
          remainingOpportunities,
          remainingPolicies,
          remainingEndorsements,
          remainingActivities,
          remainingReportees,
        ] = await Promise.all([
          entityManager.count(Company, { where: { leadCrm: user.userId } }),
          entityManager.count(Company, { where: { accountManager: user.userId } }),
          entityManager.count(Opportunity, { where: { ownerId: user.userId } }),
          entityManager.count(Policy, { where: { ownerId: user.userId } }),
          entityManager.count(Endorsement, { where: { createdBy: user.userId } }),
          entityManager.count(OpportunityActivityMap, { where: { ownerId: user.userId } }),
          entityManager.count(User, { where: { reportingUserId: user.userId } }),
        ]);

        const totalRemaining =
          remainingLeadCrm +
          remainingAccountMgr +
          remainingOpportunities +
          remainingPolicies +
          remainingEndorsements +
          remainingActivities +
          remainingReportees;

        if (totalRemaining > 0) {
          throw new BadRequestException(
            `Cannot deactivate: ${totalRemaining} dependent record(s) still assigned to this employee.`
          );
        }

        // 10-14. Apply status + role deletion
        await this.applyDeactivationStatus(entityManager, employee, user);
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to manually deactivate employee"
      );
    }
  }

  /**
   * Reactivates a previously deactivated employee: restores employee and user
   * status to active in a single transaction.
   */
  async activateEmployee(employeeId: number): Promise<void> {
    try {
      await this.dataSource.transaction(async (entityManager) => {
        const employee = await entityManager.findOne(Employee, {
          where: { employeeId },
        });
        if (!employee) throw new NotFoundException(infoMessages.employeeNotFound);

        const user = await entityManager.findOne(User, {
          where: { userId: employee.userId },
        });
        if (!user) throw new NotFoundException(infoMessages.employeeNotFound);

        const [userActiveLookup, employeeActiveLookup] = await Promise.all([
          entityManager.findOne(LookUp, { where: { lookUpKey: USER_STATUS_ACTIVE } }),
          entityManager.findOne(LookUp, { where: { lookUpKey: EMPLOYEE_STATUS_ACTIVE } }),
        ]);

        if (!userActiveLookup || !employeeActiveLookup) {
          throw new NotFoundException("Active status lookup values not found");
        }

        await entityManager.update(User, { userId: user.userId }, {
          userStatusKey: USER_STATUS_ACTIVE,
          statusLid: userActiveLookup.id,
        });

        await entityManager.update(Employee, { employeeId: employee.employeeId }, {
          statusLid: employeeActiveLookup.id,
        });

        // Deactivation deleted this user's own ancestor-list row
        // (employee_hierarchy WHERE user_id = user.userId) via
        // syncEmployeeHierarchy — users.reporting_user_id was never touched
        // for the deactivated user themselves, so it should still point at
        // their (still-live) manager. Rebuild the reactivated user's
        // ancestor chain the same way every other hierarchy mutation does;
        // nothing to rebuild if they were already at the top of the org.
        if (user.reportingUserId) {
          const affected = [user.userId];
          await this.addParentsToUpdateList(entityManager, user.userId, affected);
          const uniqueAffected = [...new Set(affected)];
          await this.updateEmployeeHierarchy(entityManager, uniqueAffected, DEFAULT_ADMIN_ID);
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to activate employee"
      );
    }
  }
}
