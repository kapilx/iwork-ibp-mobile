import {
  Repository,
  In,
  IsNull,
  Not,
  Raw,
  DataSource,
  EntityManager,
  QueryFailedError,
} from "typeorm";
import { PolicyConfiguration } from "../../../../service-lib/src/lib/entities/policy-configuration.entity";
import { InjectRepository } from "@nestjs/typeorm";
import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import {
  PolicyEnrollmentEmployee,
  PolicyEnrollmentDependent,
  PolicyEnrollmentEmployeePolicyMap,
  PolicyEmployeeEnrollmentChoice,
  PolicyEmployeeEnrollmentChoiceDependent,
  PolicyEmployeeEnrollment,
  PolicyEndorsementTemplateDocMap,
  EndorsementFieldMapping,
  FileUpload,
  MstrHospital,
  MstrHospitalAddress,
  MstrPolicyHospitalMap,
  PolicyFeatureDocument,
  User,
  PolicyEmployeeEndorsement,
  DocumentProcessingFile,
  PolicyEnrollmentUploadSummary,
  Role,
  UserRole,
  Policy,
  Company,
  PolicyContactMetric,
  PolicyClaim,
  PolicyTpaMap,
  PolicyInsurerMap,
  TpaExternalFeatureConfig,
  Endorsement,
  Tpa,
  Insurer,
  NotificationInfo,
  UserActivityLog,
  RaiseTicket,
  TicketStatus,
  Country,
  State,
  City,
  LocalizationRegulatoryFieldsCountryMap,
  CompanyPolicyConfigurationLocation,
} from "../../../../service-lib/src/lib/entities";
import { HrUserManagement } from "../../../../service-lib/src/lib/entities/hr-user-management.entity";
import { ClaimFormExtraction } from "../../../../service-lib/src/lib/entities/claim-form-extraction.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { GetEmployeeDetails } from "./dto/get-employee-details-with-components.dto";
import { CreatePolicyEmployeeComponentDto } from "./dto/create-policy-employee-component.dto";
import { UpdatePolicyEmployeeComponentDto } from "./dto/update-policy-employee-component.dto";
import { EnrollmentChoiceDto } from "./dto/enrollment-choice.dto";
import { UpsertEnrollmentDependentDto } from "./dto/upsert-enrollment-dependent.dto";
import { EnrollmentAction } from "./dto/upsert-enrollment-data.dto";
import {
  POLICY_CONFIGURATION_STATUS_LIVE,
  LOOK_UP_DATA,
  POLICY_RELATIONSHIP_TYPE_PARAMETER,
  DEPENDENT_ATTRIBUTE_INTERNAL_TYPE,
  DEPENDENT_COUNT_INTERNAL_TYPE,
  EMPLOYEE_ENROLLMENT_STATUS_ENROLLED,
  EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS,
  USER_STATUS_ACTIVE,
  USER_STATUS_INACTIVE,
  EMPLOYEE_ENROLLMENT_STATUS_ENDORSEMENT_SENT,
  EMPLOYEE_ENDORSEMENT_READY,
  USER_TYPE_COMPANY_EMPLOYEE,
  USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
  DATA_INTAKE_TYPE,
  DATA_TYPES,
  BOOLEAN_VALUES,
  DEFAULT_PAGE,
  USER_TYPE_IIRM_EMPLOYEE,
  COMPANY_EMPLOYEE_ROLE_KEY,
  DEFAULT_LIMIT,
  POLICY_FEATURE_DOCUMENT_STATUS,
  USER_STATUS_DELETED,
} from "../../../../../../libs/service-lib/src/lib/constants";
import bcrypt from "bcryptjs";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import {
  DOCUMENT_PROCESS_STATUS,
  DOCUMENT_TYPE_POLICY_EMPLOYEE_ENROLLMENT_DATA,
  serviceNames,
} from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  exportHospitalsWithFilters,
  getActivePolicyFeatureDocumentFromRepository,
  getPolicyLocationDataFromRepository,
  searchHospitalsWithFilters,
} from "../../../../service-lib/src/lib/utils/portal-configuration.util";
import { getPolicyEmployeeInsuredDetailsFromRepository } from "../../../../service-lib/src/lib/utils/policy-employee-insured.util";
import {
  resolveDependentCountSiEnhancement,
  resolveDependentCountOptionId,
} from "../../../../service-lib/src/lib/utils/enrollment-processing.util";
import {
  toMidnight,
  daysBetweenInclusive,
  calculateApplicableDays,
} from "../../../../service-lib/src/lib/utils/premium-calculator.util";
import {
  resolveDependentAttributePremium,
  resolveOptionIdForLife,
  resolveDependentOnlyPremiumByConfiguration,
  resolveSumInsuredIdForValue,
  type DependentAttributeParam,
  type OptionMetaEntry,
} from "../../../../service-lib/src/lib/utils/per-dependent-resolution.util";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { EmployeeDetailsDto } from "./dto/get-company-employee-details.dto";
import { UpdateEmployeeDetails } from "./dto/update-employee-details.dto";
import { SearchHospitalDto } from "./dto/search-hospital.dto";
import { CreatePolicyHospitalResponseDto } from "./dto/create-policy-hospital.dto";

interface CreateUserActivityLogParams {
  userId: number;
  activityKey: string;
  activityCategory?: string;
  referenceId?: string | number;
  referenceType?: string;
  metadata?: Record<string, unknown>;
}
interface PartyDetail {
  id?: number;
  name?: string | null;
  displayName?: string | null;
}

const EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED =
  "EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED";

import {
  EmployeeWithDependentsData,
  EnrollmentDeletionRecord,
  StartEnrollmentProcessResult,
  EnrollmentProcessingArtifactsSummary,
  ValidatedEnrollmentProcessingResult,
} from "../../../../service-lib/src/lib/utils/enrollment-file-upload.util";

interface FinalizeEnrollmentProcessOptions {
  documentProcessingFileId: number;
  policyId: number;
  sourceFile: FileUpload;
  summary: EnrollmentProcessingArtifactsSummary;
  successFileKey?: string | null;
  errorFileKey?: string | null;
  endorsementId?: number;
}

export class CompanyEmployeeRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(PolicyConfiguration)
    private readonly policyConfigurationRepo: Repository<PolicyConfiguration>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(PolicyEnrollmentEmployee)
    private readonly companyEmployeeRepository: Repository<PolicyEnrollmentEmployee>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(PolicyEnrollmentDependent)
    private readonly dependentRepo: Repository<PolicyEnrollmentDependent>,
    @InjectRepository(PolicyEnrollmentEmployeePolicyMap)
    private readonly employeePolicyMapRepo: Repository<PolicyEnrollmentEmployeePolicyMap>,
    @InjectRepository(PolicyEmployeeEnrollmentChoice)
    private readonly employeeChoiceRepo: Repository<PolicyEmployeeEnrollmentChoice>,
    @InjectRepository(PolicyEmployeeEnrollmentChoiceDependent)
    private readonly employeeChoiceDependentRepo: Repository<PolicyEmployeeEnrollmentChoiceDependent>,
    @InjectRepository(PolicyEmployeeEnrollment)
    private readonly employeeEnrollmentRepo: Repository<PolicyEmployeeEnrollment>,
    @InjectRepository(PolicyEndorsementTemplateDocMap)
    private readonly endorsementTemplateRepo: Repository<PolicyEndorsementTemplateDocMap>,
    @InjectRepository(EndorsementFieldMapping)
    private readonly endorsementFieldMapRepo: Repository<EndorsementFieldMapping>,
    @InjectRepository(FileUpload)
    private readonly fileUploadRepository: Repository<FileUpload>,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(PolicyTpaMap)
    private readonly policyTpaMapRepository: Repository<PolicyTpaMap>,
    @InjectRepository(PolicyInsurerMap)
    private readonly policyInsurerMapRepository: Repository<PolicyInsurerMap>,
    @InjectRepository(TpaExternalFeatureConfig)
    private readonly tpaFeatureConfigRepo: Repository<TpaExternalFeatureConfig>,
    @InjectRepository(PolicyContactMetric)
    private readonly policyContactMetricRepository: Repository<PolicyContactMetric>,
    @InjectRepository(PolicyClaim)
    private readonly policyClaimRepository: Repository<PolicyClaim>,
    @InjectRepository(MstrHospital)
    private readonly hospitalRepository: Repository<MstrHospital>,
    @InjectRepository(MstrHospitalAddress)
    private readonly hospitalAddressRepository: Repository<MstrHospitalAddress>,
    @InjectRepository(MstrPolicyHospitalMap)
    private readonly policyHospitalMapRepository: Repository<MstrPolicyHospitalMap>,
    @InjectRepository(PolicyFeatureDocument)
    private readonly policyFeatureDocumentRepository: Repository<PolicyFeatureDocument>,
    @InjectRepository(DocumentProcessingFile)
    private readonly uploadRepo: Repository<DocumentProcessingFile>,
    @InjectRepository(PolicyEnrollmentUploadSummary)
    private readonly enrollmentSummaryRepo: Repository<PolicyEnrollmentUploadSummary>,
    @InjectRepository(UserActivityLog)
    private readonly userActivityLogRepository: Repository<UserActivityLog>,
    @InjectRepository(NotificationInfo)
    private readonly notificationInfoRepository: Repository<NotificationInfo>,
    @InjectRepository(RaiseTicket)
    private readonly raiseTicketRepository: Repository<RaiseTicket>,
    @InjectRepository(Country)
    private readonly countryRepository: Repository<Country>,
    @InjectRepository(State)
    private readonly stateRepository: Repository<State>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    private readonly traceIdService: TraceIdService,
    @InjectRepository(Endorsement)
    private readonly endorsementRepo: Repository<Endorsement>,
    @InjectRepository(HrUserManagement)
    private readonly hrUserManagementRepo: Repository<HrUserManagement>,
    @InjectRepository(ClaimFormExtraction)
    private readonly claimFormExtractionRepo: Repository<ClaimFormExtraction>,
    @InjectRepository(LocalizationRegulatoryFieldsCountryMap)
    private readonly localizationRegulatoryFieldsCountryMapRepository: Repository<LocalizationRegulatoryFieldsCountryMap>,
    @InjectRepository(CompanyPolicyConfigurationLocation)
    private readonly companyPolicyConfigurationLocationRepository: Repository<CompanyPolicyConfigurationLocation>,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.IBP_SERVICE);
  }

  /**
   * Finds a company employee by company employee ID from policy_enrollment_employee table.
   * @param loginName - The company employee ID to search for.
   * @returns The user entity with selected fields or null if not found.
   */
  async findByLoginNameOrEmail(
    loginName: string
  ): Promise<
    (Partial<User> & { roles: { id: number; name: string }[] }) | null
  > {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeRepository",
        method: "findByLoginNameOrEmail",
        payload: { loginName },
        messageData: "method invoked",
      }),
    });
    try {
      const companyEmployeeId = loginName.trim();
      const userTypes = [
        USER_TYPE_COMPANY_EMPLOYEE,
        USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
      ];

      // First find the policy enrollment employee by company_employee_id
      const policyEnrollmentEmployee = await this.companyEmployeeRepository.findOne({
        where: {
          companyEmployeeId: companyEmployeeId,
          deletedAt: IsNull(),
        },
        select: ['userId'],
      });

      if (!policyEnrollmentEmployee || !policyEnrollmentEmployee.userId) {
        throw new NotFoundException(errorMessages.userNotFound);
      }

      // Then get the full user details using the userId
      const user = await this.userRepository.findOne({
        where: {
          userId: policyEnrollmentEmployee.userId,
          userStatusKey: Not(USER_STATUS_INACTIVE),
          userTypeKey: In(userTypes),
        },
        relations: ["userRoles", "userRoles.role"],
      });

      if (user) {
        const roles = (user.userRoles || [])
          .filter((userRole) => userRole?.role)
          .map((userRole) => ({
            id: userRole.role.id,
            name: userRole.role.name,
          }));

        const result = {
          userId: user.userId,
          salutation: user.salutation,
          firstName: user.firstName,
          lastName: user.lastName,
          emailId: user.emailId,
          mobile: user.mobile,
          password: user.password,
          ibpPassword: user.ibpPassword,
          isPasswordSet: user.isPasswordSet,
          organisationId: user.organisationId,
          roles,
        };

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "CompanyEmployeeRepository",
            method: "findByLoginNameOrEmail",
            payload: { loginName },
            messageData: "User retrieved via policy_enrollment_employee",
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
          location: "CompanyEmployeeRepository",
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(errorMessages.failedToFindUser);
    }
  }

  private async mapPeeToAuthResult(
    pee: PolicyEnrollmentEmployee
  ): Promise<Partial<User> & { roles: { id: number; name: string }[] }> {
    // Fetch roles by ibpEmployeeId (new) or fall back to userId-based rows (existing employees)
    let roleRows = await this.userRoleRepository.find({
      where: { ibpEmployeeId: pee.id },
      relations: ["role"],
    });
    if (roleRows.length === 0 && pee.userId) {
      roleRows = await this.userRoleRepository.find({
        where: { userId: pee.userId },
        relations: ["role"],
      });
    }
    const roles = roleRows
      .filter((ur) => ur?.role)
      .map((ur) => ({ id: ur.role.id, name: ur.role.name }));
    return {
      // Always use pee.id — user_id FK to users table is not used after auth detach.
      userId: pee.id,
      salutation: null,
      firstName: pee.employeeName,
      lastName: null,
      emailId: pee.email,
      mobile: pee.phoneNumber,
      password: pee.password,
      isPasswordSet: pee.isPasswordSet,
      organisationId: pee.companyId,
      roles,
      ibpPassword: pee.ibpPassword,
      userTypeKey: USER_TYPE_COMPANY_EMPLOYEE,
      userStatusKey: pee.userStatusKey,
    } as unknown as Partial<User> & { roles: { id: number; name: string }[]; userStatusKey?: string };
  }

  async findByLoginName(
    loginName: string,
    companyId?: number
  ): Promise<(Partial<User> & { roles: { id: number; name: string }[]; userStatusKey: string }) | null> {
    const pee = await this.companyEmployeeRepository.findOne({
      where: {
        loginName: loginName.trim(),
        deletedAt: IsNull(),
        ...(companyId ? { companyId } : {}),
      },
      order: { id: "DESC" },
    });
    if (!pee) return null;
    return this.mapPeeToAuthResult(pee);
  }

  async findByEmail(
    email: string,
    companyId?: number
  ): Promise<(Partial<User> & { roles: { id: number; name: string }[]; userStatusKey: string }) | null> {
    console.log(`[findByEmail] email=${email} companyId=${companyId}`);
    const pee = await this.companyEmployeeRepository.findOne({
      where: {
        email: email.trim().toLowerCase(),
        deletedAt: IsNull(),
        ...(companyId ? { companyId } : {}),
      },
      order: { id: "DESC" },
    });
    console.log(`[findByEmail] pee=${pee ? JSON.stringify(pee) : 'null'}`);
    if (!pee) return null;
    return this.mapPeeToAuthResult(pee);
  }

  async findByPhoneNumber(
    phoneNumber: string,
    companyId?: number
  ): Promise<(Partial<User> & { roles: { id: number; name: string }[]; userStatusKey: string }) | null> {
    const pee = await this.companyEmployeeRepository.findOne({
      where: {
        phoneNumber: phoneNumber.trim(),
        deletedAt: IsNull(),
        ...(companyId ? { companyId } : {}),
      },
      order: { id: "DESC" },
    });
    if (!pee) return null;
    return this.mapPeeToAuthResult(pee);
  }

  async isEmployeeBlocked(loginName: string, companyId?: number): Promise<boolean> {
    const pee = await this.companyEmployeeRepository.findOne({
      where: [
        { loginName: loginName.trim(), userStatusKey: USER_STATUS_INACTIVE, deletedAt: IsNull(), ...(companyId ? { companyId } : {}) },
        { email: loginName.trim().toLowerCase(), userStatusKey: USER_STATUS_INACTIVE, deletedAt: IsNull(), ...(companyId ? { companyId } : {}) },
        { phoneNumber: loginName.trim(), userStatusKey: USER_STATUS_INACTIVE, deletedAt: IsNull(), ...(companyId ? { companyId } : {}) },
      ],
    });
    return !!pee;
  }

  /**
   * Retrieves the employee details for a given user ID.
   *
   * This method fetches the user details from the `userRepository` and then retrieves
   * the corresponding employee details from the `companyEmployeeRepository`. It ensures
   * that the employee details are transformed before returning the result.
   *
   * Note: The phone number is intentionally removed in the condition because, in the case
   * where the user is both an IIRM employee and a company employee (policy-enrolled employee),
   * there may be different phone numbers associated with the records.
   *
   * @param userId - The unique identifier of the user whose employee details are to be retrieved.
   * @returns A promise that resolves to the transformed employee details or `null` if no details are found.
   * @throws InternalServerErrorException - If the employee details cannot be fetched or an error occurs.
   */
  async getEmployeeDetailsByUserId(
    userId: number
  ): Promise<EmployeeDetailsDto | null> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeRepository",
          method: "getEmployeeDetailsByUserId",
          payload: { userId },
          messageData: "method invoked",
        }),
      });
      // ── HR-only path (fast check) ──────────────────────────────────────────
      // If userId matches hr_user_management.id, this is an HR-only user.
      // Skip the pee lookup entirely to avoid colliding with an unrelated pee row.
      const hrCheck = await this.hrUserManagementRepo.findOne({
        where: { id: userId, deletedAt: IsNull(), userStatusKey: Not(USER_STATUS_INACTIVE) },
      });
      if (hrCheck) {
        // Check if HR user is also an IBP employee — match by email + companyId
        let peeForHr = null;
        if (hrCheck.emailId) {
          const peeWhere = hrCheck.companyId
            ? { email: hrCheck.emailId, companyId: hrCheck.companyId }
            : { email: hrCheck.emailId };
          peeForHr = await this.companyEmployeeRepository.findOne({
            where: peeWhere,
            order: { id: "DESC" },
          });
        }
        return {
          isEmployee: Boolean(peeForHr),
          isHR: true,
          hrManagementId: hrCheck.id,
          id: peeForHr?.id ?? hrCheck.id,
          userId: hrCheck.userId ?? undefined,
          companyId: hrCheck.companyId ?? undefined,
          companyName: hrCheck.companyName ?? undefined,
          email: hrCheck.emailId ?? undefined,
          phone: hrCheck.phoneNumber ?? undefined,
          roleKey: hrCheck.roleKey,
        } as unknown as EmployeeDetailsDto;
      }

      // ── IBP employee path ──────────────────────────────────────────────────
      // After full detach: pee.userId = NULL, JWT carries pee.id → lookup by id.
      // Transition period: pee.userId still set, JWT carries users.id → fallback to userId.
      let employeeDetails = await this.companyEmployeeRepository.findOne({
        where: { id: userId },
        relations: ["company", "company.country"],
      });
      if (!employeeDetails) {
        employeeDetails = await this.companyEmployeeRepository.findOne({
          where: { userId },
          relations: ["company", "company.country"],
          order: { id: "DESC" },
        });
      }

      if (employeeDetails) {
        let transformedEmployeeData = await this.employeeDetailsTransformation(employeeDetails);
        if(!transformedEmployeeData){
          throw new NotFoundException('Error at the employeeDetailsTransformation transforming the employeeDetails')
        }
        transformedEmployeeData.role = 'Company Employee';
        transformedEmployeeData.policyEnrollmentStatuses =
          await this.getFirstPolicyEnrollmentStatus(employeeDetails.id);
        if (transformedEmployeeData) {
          transformedEmployeeData.policyEnrollmentStatuses =
            await this.getFirstPolicyEnrollmentStatus(employeeDetails.id);
          const dependents = await this.dependentRepo.find({
            where: { employeeId: employeeDetails.id },
            order: { id: "ASC" },
          });
          transformedEmployeeData.dependents = dependents.map((dependent) => ({
            id: dependent.id,
            policyId: dependent.policyId,
            name: dependent.name,
            relation: dependent.relation,
            relationshipType: dependent.relationshipType || "",
            documentIds: dependent.documentIds ?? [],
            isLifeEvent: dependent.isLifeEvent ?? false,
            dateOfBirth: dependent.dateOfBirth
              ? typeof dependent.dateOfBirth === "string"
                ? dependent.dateOfBirth
                : // DOB is a calendar date stored at server-local midnight. Use
                  // local Y-M-D, not toISOString() (UTC), which drops to the
                  // previous day for ahead-of-UTC servers like IST.
                  `${dependent.dateOfBirth.getFullYear()}-${String(
                    dependent.dateOfBirth.getMonth() + 1,
                  ).padStart(2, "0")}-${String(
                    dependent.dateOfBirth.getDate(),
                  ).padStart(2, "0")}`
              : "",
            gender: dependent.gender?.trim().toLocaleLowerCase() || "",
          }));
          transformedEmployeeData.isEmployee = true;

          // Check if IBP employee also has HR role — match by email
          if (employeeDetails.email) {
            const hrUser = await this.hrUserManagementRepo.findOne({
              where: { emailId: employeeDetails.email, deletedAt: IsNull(), userStatusKey: Not(USER_STATUS_INACTIVE) },
            });
            transformedEmployeeData.isHR = Boolean(hrUser);
            if (hrUser) {
              transformedEmployeeData.hrManagementId = hrUser.id;
              transformedEmployeeData.roleKey = hrUser.roleKey ?? undefined;
            }
          }
          transformedEmployeeData.isTCAccepted = employeeDetails?.isTCAccepted;
          transformedEmployeeData.tcAcceptedVersion = employeeDetails?.tcAcceptedVersion ?? null;
          transformedEmployeeData.tcAcceptedAt = employeeDetails?.tcAcceptedAt ?? null;
          transformedEmployeeData.tcWithdrawnAt = employeeDetails?.tcWithdrawnAt ?? null;
          transformedEmployeeData.tcStatus = employeeDetails?.tcStatus ?? null;
        }
        return transformedEmployeeData;
      }

      // ── HR path ────────────────────────────────────────────────────────────
      // After full detach: JWT carries hr_user_management.id → lookup by id.
      // Transition period: JWT still carries users.id → fallback to userId column.
      let hrUser = await this.hrUserManagementRepo.findOne({
        where: { id: userId, deletedAt: IsNull(), userStatusKey: Not(USER_STATUS_INACTIVE) },
      });
      if (!hrUser) {
        hrUser = await this.hrUserManagementRepo.findOne({
          where: { userId, deletedAt: IsNull(), userStatusKey: Not(USER_STATUS_INACTIVE) },
        });
      }

      if (!hrUser) {
        throw new InternalServerErrorException(
          `No employee or HR record found for user with Id: ${userId}`
        );
      }

      // Check if HR user is also an IBP employee — match by email (+ companyId if available)
      let peeForHr = null;
      if (hrUser.emailId) {
        const peeWhere = hrUser.companyId
          ? { email: hrUser.emailId, companyId: hrUser.companyId, userStatusKey: Not(USER_STATUS_INACTIVE) }
          : { email: hrUser.emailId };
        peeForHr = await this.companyEmployeeRepository.findOne({
          where: peeWhere,
          order: { id: "DESC" },
        });
      }

      return {
        isEmployee: Boolean(peeForHr),
        isHR: true,
        hrManagementId: hrUser.id,
        id: peeForHr?.id ?? hrUser.id,
        userId: hrUser.userId ?? undefined,
        companyId: hrUser.companyId ?? undefined,
        companyName: hrUser.companyName ?? undefined,
        email: hrUser.emailId ?? undefined,
        roleKey: hrUser.roleKey,
      } as unknown as EmployeeDetailsDto;
    }
    catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getEmployeeDetailsByUserId",
          payload: { userId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        `Failed to fetch employee details: ${error?.message}`
      );
    }
  }

  private async getFirstPolicyEnrollmentStatus(
    employeeId: number,
  ): Promise<
    {
      policyId: number;
      policyName?: string | null;
      employeeEnrollmentStatusKey: string;
    }[]
  > {
    const policyMap = await this.employeePolicyMapRepo.findOne({
      where: { employeeId, deletedAt: IsNull() },
      relations: { policy: true },
      order: { policyId: "ASC", id: "ASC" },
    });

    if (!policyMap) {
      return [];
    }

    const enrollment = await this.employeeEnrollmentRepo.findOne({
      where: { employeeId, policyId: policyMap.policyId },
    });

    return [
      {
        policyId: policyMap.policyId,
        policyName: policyMap.policy?.policyName ?? null,
        employeeEnrollmentStatusKey:
          enrollment?.employeeEnrollmentStatusKey ??
          EMPLOYEE_ENROLLMENT_STATUS_NOT_STARTED,
      },
    ];
  }

  // Resolves the employee's company's country-based formatting config
  // (currency/number/date format, locale, etc). Mirrors org-service's
  // LocalizationRepository.getUserLocalization, but for ibp's Employee->Company
  // model instead of iwork's User->Organisation model — org-service has no path
  // to an employee's company at all, so this can't be resolved there.
  async getEmployeeLocalization(userId: number) {
    const traceId = this.traceIdService.traceId;
    try {
      let employee = await this.companyEmployeeRepository.findOne({
        where: { id: userId },
        relations: ["company", "company.country"],
      });
      if (!employee) {
        employee = await this.companyEmployeeRepository.findOne({
          where: { userId },
          relations: ["company", "company.country"],
          order: { id: "DESC" },
        });
      }

      let countryName: string | undefined;
      if (employee?.policyConfigLocationId) {
        const location = await this.companyPolicyConfigurationLocationRepository
          .createQueryBuilder("location")
          .leftJoinAndSelect("location.address", "address")
          .leftJoinAndSelect("address.countryId", "country")
          .where("location.id = :locationId", {
            locationId: employee.policyConfigLocationId,
          })
          .getOne();
        countryName = location?.address?.countryId?.name;
      }
      countryName = countryName ?? employee?.company?.country?.name;

      if (!countryName) {
        throw new NotFoundException("Employee company or country not found.");
      }

      const result = await this.localizationRegulatoryFieldsCountryMapRepository
        .createQueryBuilder("map")
        .innerJoinAndSelect("map.country", "country")
        .innerJoinAndSelect("map.regulatoryField", "field")
        .where("LOWER(country.name) = LOWER(:countryName)", { countryName })
        .orderBy("country.name", "ASC")
        .addOrderBy("field.displayOrder", "ASC")
        .getMany();

      if (result.length === 0) {
        throw new NotFoundException(
          "No localization data found for the employee's company country.",
        );
      }
      console.log("result::::::::::", result);
      const {
        id,
        name,
        description,
        isoCode,
        locale,
        currencyCode,
        currencyDisplayName,
        currencyFormat,
        numberFormat,
        dateFormat,
        phoneNumberFormat,
        faxFormat,
        mobileFormat,
        pincodeFormat,
        taxLabel,
      } = result[0].country;

      const fields = result.map((entry) => ({
        fieldKey: entry.regulatoryField.fieldKey,
        fieldLabel: entry.fieldLabel || entry.regulatoryField.fieldKey,
        metaData: entry.metaData ?? entry.regulatoryField.metaData,
      }));

      return {
        id,
        name,
        description,
        isoCode,
        locale,
        currencyCode,
        currencyDisplayName,
        currencyFormat,
        numberFormat,
        dateFormat,
        phoneNumberFormat,
        faxFormat,
        mobileFormat,
        pincodeFormat,
        taxLabel,
        fields,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getEmployeeLocalization",
          payload: { userId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw new InternalServerErrorException(
        "Failed to retrieve employee localization",
      );
    }
  }

  async updateEmployeeDetails(
    userId: number,
    employeeId: number,
    payload: UpdateEmployeeDetails,
  ): Promise<EmployeeDetailsDto | null> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeRepository",
          method: "updateEmployeeDetails",
          payload: { userId, employeeId },
          messageData: "method invoked",
        }),
      });
      // Fetch the employee record
      const employee = await this.companyEmployeeRepository.findOne({
        where: { id: employeeId },
      });
      if (!employee) {
        throw new NotFoundException(
          `Employee with ID ${employeeId} not found.`
        );
      }

      const genderLookupName = payload.gender?.key ?? LOOK_UP_DATA.gender;
      const genderLookupValueKey = payload.gender?.value
        ?.trim()
        ?.toLocaleUpperCase();
      const maritalStatusLookupName =
        payload.maritalStatus?.key ?? LOOK_UP_DATA.maritalStatus;
      const maritalStatusLookupValueKey = payload.maritalStatus?.value
        ?.trim()
        ?.toLocaleUpperCase();

      let employeeGenderLookupDetails: LookUp | null = null;
      if (genderLookupValueKey) {
        employeeGenderLookupDetails = await this.lookUpRepository.findOne({
          where: {
            lookUpName: genderLookupName,
            lookUpValueKey: genderLookupValueKey,
          },
        });
        if (!employeeGenderLookupDetails) {
          throw new InternalServerErrorException(
            `No valid look up data found for the employee gender: ${payload.gender?.value}`
          );
        }
      }

      let employeeMaritalStatusLookupDetails: LookUp | null = null;
      if (maritalStatusLookupValueKey) {
        employeeMaritalStatusLookupDetails =
          await this.lookUpRepository.findOne({
            where: {
              lookUpName: maritalStatusLookupName,
              lookUpValueKey: maritalStatusLookupValueKey,
            },
          });

        if (!employeeMaritalStatusLookupDetails) {
          throw new InternalServerErrorException(
            `No valid look up data found for the employee marital status: ${payload.maritalStatus?.value}`
          );
        }
      }

      const userUpdate: Partial<User> = {
        ...(payload.email && { emailId: payload.email }),
        ...(payload.phone && { mobile: payload.phone }),
        ...(payload.employeeName && {
          firstName: payload.employeeName,
          loginName: payload.employeeName,
        }),
      };
      const employeeUpdate: Partial<PolicyEnrollmentEmployee> = {
        ...(payload.email && { email: payload.email }),
        ...(payload.phone && { phoneNumber: payload.phone }),
        ...(payload.alternatePhoneNumber !== undefined && {
          alternatePhoneNumber: payload.alternatePhoneNumber,
        }),
        ...(payload.alternateEmail !== undefined && {
          alternateEmail: payload.alternateEmail,
        }),
        ...(payload.employeeName && {
          employeeName: payload.employeeName,
          fullName: payload.employeeName,
        }),
        ...(employeeGenderLookupDetails && {
          gender: employeeGenderLookupDetails.lookUpValue,
        }),
        ...(payload.designation && { designation: payload.designation }),
        ...(payload.maritalStatus && {
          maritalStatus: employeeMaritalStatusLookupDetails?.lookUpValue,
        }),
      };

      // Only update users table if this employee has a linked users record (not detached)
      if (Object.keys(userUpdate).length > 0 && employee.userId) {
        await this.userRepository.update({ userId: employee.userId }, userUpdate);
      }
      const updatedEmployee = await this.companyEmployeeRepository.findOne({
        where: { id: employeeId },
      });
      if (Object.keys(employeeUpdate).length > 0 && updatedEmployee) {
        Object.assign(updatedEmployee, employeeUpdate);
        await this.companyEmployeeRepository.save(updatedEmployee);
      }
      const transformedEmployeeData = await this.employeeDetailsTransformation(
        updatedEmployee
      );
      return transformedEmployeeData;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "updateEmployeeDetails",
          payload: { userId, employeeId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        `Failed to update employee details: ${error?.message}`
      );
    }
  }


  async findUserById(authId: number): Promise<PolicyEnrollmentEmployee | null> {
    // authId is always pee.id — user_id FK to users table is not used after auth detach.
    return this.companyEmployeeRepository.findOne({ where: { id: authId } });
  }

  async findHrUserById(id: number): Promise<HrUserManagement | null> {
    return this.hrUserManagementRepo.findOne({ where: { id, deletedAt: IsNull() } });
  }

  async isHrUserInCompany(userId: number, companyId: number): Promise<boolean> {
    return this.isHrUserInAnyCompany(userId, [companyId]);
  }

  async isHrUserInAnyCompany(userId: number, companyIds: number[]): Promise<boolean> {
    if (!companyIds.length) return false;
    const companyIdFilter = companyIds.length === 1 ? companyIds[0] : In(companyIds);
    const byId = await this.hrUserManagementRepo.findOne({
      where: { id: userId, companyId: companyIdFilter as any, deletedAt: IsNull() },
    });
    if (byId) return true;
    const byUserId = await this.hrUserManagementRepo.findOne({
      where: { userId, companyId: companyIdFilter as any, deletedAt: IsNull() },
    });
    return Boolean(byUserId);
  }

  async isHrUser(userId: number): Promise<boolean> {
    if (!userId || userId <= 0) return false;
    const hrUser = await this.hrUserManagementRepo.findOne({
      where: { userId },
    });
    return Boolean(hrUser);
  }

  async isHrUserByEmailInAnyCompany(email: string, companyIds: number[]): Promise<boolean> {
    if (!email || companyIds.length === 0) return false;
    const companyIdFilter = companyIds.length === 1 ? companyIds[0] : In(companyIds);
    const hrUser = await this.hrUserManagementRepo.findOne({
      where: { emailId: email.toLowerCase().trim(), companyId: companyIdFilter as any, deletedAt: IsNull() },
    });
    return Boolean(hrUser);
  }

  async findHRUserByIdentifier(
    identifier: string,
    method: string,
  ): Promise<(Partial<User> & { roles: { id: number; name: string }[] }) | null> {
    const normalized = identifier.trim().toLowerCase();

    let hrRecord = await this.hrUserManagementRepo.findOne({
      where: method === "PHONE_PASSWORD"
        ? { phoneNumber: Raw((a) => `TRIM(${a}) = :v`, { v: identifier.trim() }), deletedAt: IsNull() }
        : method === "EMAIL_PASSWORD"
          ? { emailId: Raw((a) => `LOWER(TRIM(${a})) = :v`, { v: normalized }), deletedAt: IsNull() }
          : [
              { loginName: Raw((a) => `LOWER(TRIM(${a})) = :v`, { v: normalized }), deletedAt: IsNull() },
              { emailId: Raw((a) => `LOWER(TRIM(${a})) = :v`, { v: normalized }), deletedAt: IsNull() },
            ],
    });

    if (!hrRecord && method === "USERNAME_PASSWORD") {
      const userByLoginName = await this.userRepository.findOne({
        where: { loginName: identifier.trim() },
      });
      if (userByLoginName) {
        hrRecord = await this.hrUserManagementRepo.findOne({
          where: { userId: userByLoginName.userId, deletedAt: IsNull() },
        });
      }
    }

    if (!hrRecord) {
      // Secondary check: see if an HR record exists but is inactive/soft-deleted.
      // If so, return a stub with USER_STATUS_INACTIVE so the caller can throw the blocked message.
      const inactiveRecord = await this.hrUserManagementRepo.findOne({
        where: method === "PHONE_PASSWORD"
          ? { phoneNumber: Raw((a) => `TRIM(${a}) = :v`, { v: identifier.trim() }) }
          : method === "EMAIL_PASSWORD"
            ? { emailId: Raw((a) => `LOWER(TRIM(${a})) = :v`, { v: normalized }) }
            : [
                { loginName: Raw((a) => `LOWER(TRIM(${a})) = :v`, { v: normalized }) },
                { emailId: Raw((a) => `LOWER(TRIM(${a})) = :v`, { v: normalized }) },
              ],
      });
      if (inactiveRecord && (inactiveRecord.deletedAt !== null || inactiveRecord.userStatusKey === USER_STATUS_INACTIVE)) {
        return { userId: inactiveRecord.id, roles: [], userStatusKey: USER_STATUS_INACTIVE } as any;
      }
      return null;
    }

    // Resolve real role ID from roles table (role_key may or may not have ROLE_ prefix)
    const roleRecordExact = hrRecord.roleKey
      ? await this.roleRepository.findOne({ where: { roleKey: hrRecord.roleKey } })
      : null;
    const roleRecordPrefixed = (!roleRecordExact && hrRecord.roleKey)
      ? await this.roleRepository.findOne({ where: { roleKey: `ROLE_${hrRecord.roleKey}` } })
      : null;
    // Fallback: if the specific role key isn't in the roles table (e.g. HR_ADMIN, ONLY_HR, PORTAL_CRM),
    // use ROLE_EXTERNAL_HR so the user gets a valid role ID and correct portal access.
    const roleRecordFallback = (!roleRecordExact && !roleRecordPrefixed)
      ? await this.roleRepository.findOne({ where: { roleKey: 'ROLE_EXTERNAL_HR' } })
      : null;
    const roleRecord = roleRecordExact ?? roleRecordPrefixed ?? roleRecordFallback;
    console.log(`[EXTERNAL_HR findHRUserByIdentifier] roleKey=${hrRecord.roleKey} roleRecordExact=${JSON.stringify(roleRecordExact)} roleRecordPrefixed=${JSON.stringify(roleRecordPrefixed)} final=${JSON.stringify(roleRecord)}`);

    // HR auth detach: credentials live in hr_user_management, no users table lookup needed.
    // Map to the Partial<User> shape expected by callers.
    // ibpPassword ← hrRecord.password so that checkPasswordReadiness works correctly.
    return {
      userId: hrRecord.id,
      salutation: undefined,
      firstName: hrRecord.userName ?? '',
      lastName: undefined,
      emailId: hrRecord.emailId ?? '',
      mobile: hrRecord.phoneNumber ?? undefined,
      password: hrRecord.password ?? undefined,
      isPasswordSet: hrRecord.isPasswordSet ?? false,
      organisationId: hrRecord.companyId ?? undefined,
      roles: roleRecord
        ? [{ id: roleRecord.id, name: roleRecord.name }]
        : [{ id: 0, name: hrRecord.roleKey ?? 'EXTERNAL_HR' }],
      ibpPassword: hrRecord.password ?? undefined,
      userStatusKey: hrRecord.userStatusKey
    };
  }

  /**
   * Updates the IBP password for a company employee.
   * authId is pee.userId (old employees) or pee.id (new post-detach employees).
   */
  async updateUserPassword(
    authId: number,
    hashedPassword: string,
  ): Promise<void> {
    // Resolve the correct pee row the same way findUserById does.
    const pee = await this.findUserById(authId);
    if (!pee) {
      throw new NotFoundException(errorMessages.userNotFound);
    }
    // Update by pee.id (precise — avoids touching unrelated rows that share a user_id value).
    await this.companyEmployeeRepository.update(
      { id: pee.id },
      { ibpPassword: hashedPassword, isPasswordSet: true, userStatusKey: USER_STATUS_ACTIVE },
    );
  }

  async updateHrUserPassword(
    hrUserId: number,
    hashedPassword: string,
  ): Promise<void> {
    const hrUser = await this.hrUserManagementRepo.findOne({ where: { id: hrUserId, deletedAt: IsNull() } });
    if (!hrUser) {
      throw new NotFoundException(errorMessages.userNotFound);
    }
    await this.hrUserManagementRepo.update(
      { id: hrUserId },
      { password: hashedPassword, isPasswordSet: true, userStatusKey: USER_STATUS_ACTIVE },
    );
  }

  async getEmployeeDetailsByEmployeeId(
    employeeId: number
  ): Promise<GetEmployeeDetails | null> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeRepository",
          method: "getEmployeeDetailsByEmployeeId",
          payload: { employeeId },
          messageData: "method invoked",
        }),
      });
      const employeeDetails = await this.companyEmployeeRepository.findOne({
        where: { id: employeeId },
      });
      if (!employeeDetails) {
        throw new InternalServerErrorException(
          `Failed to fetch employee details with Id: ${employeeId}`
        );
      }
      const employeeInfo: GetEmployeeDetails = {
        dateOfBirth: employeeDetails.dateOfBirth
          ? typeof employeeDetails.dateOfBirth === "string"
            ? employeeDetails.dateOfBirth
            : employeeDetails.dateOfBirth.toISOString()
          : "",
        designation: employeeDetails.designation || "",
        email: employeeDetails.email || "",
        employeeCompanyId: parseInt(employeeDetails.employeeCompanyId) || 0,
        employeeName: employeeDetails.employeeName,
        gender: employeeDetails.gender || "",
        id: employeeDetails.id,
        policyId: employeeDetails.policyId,
        maritalStatus: employeeDetails.maritalStatus || "",
        phone: employeeDetails.phoneNumber || "",
        fullName: employeeDetails.fullName,
        additionalDetails: employeeDetails.additionalParams,
      };
      return employeeInfo;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getEmployeeDetailsByEmployeeId",
          payload: { employeeId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        `Failed to fetch employee details: ${error?.message}`
      );
    }
  }

  async getEmployeeECardBase(
    employeeId: number,
  ): Promise<PolicyEnrollmentEmployee | null> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeRepository",
        method: "getEmployeeECardBase",
        payload: { employeeId },
        messageData: "method invoked",
      }),
    });
    try {
      return await this.companyEmployeeRepository.findOne({
        where: { id: employeeId },
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getEmployeeECardBase",
          payload: { employeeId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to fetch employee data",
      );
    }
  }

  async getEmployeePolicyConfigurations(policyId: number) {
    try {
      const liveStatus = await this.lookUpRepository.findOne({
        where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
      });

      if (!liveStatus) {
        throw new NotFoundException(
          `Status lookup not found for key ${POLICY_CONFIGURATION_STATUS_LIVE}`
        );
      }

      const employeePolicyConfigurations =
        await this.policyConfigurationRepo.findOne({
          where: {
            policyId: policyId,
            policyConfiguartionStatusLid: liveStatus.id,
          },
        });
      return employeePolicyConfigurations;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch employee details: ${error?.message}`
      );
    }
  }

  async getConfigRelationsAndContains(policyId: number) {
    try {
      const liveStatus = await this.lookUpRepository.findOne({
        where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
      });
      const config = await this.policyConfigurationRepo.findOne({
        where: {
          policyId,
          ...(liveStatus
            ? { policyConfiguartionStatusLid: liveStatus.id }
            : {}),
        },
      });
      if (!config) return null;
      const data = config.policyConfiguration as any;
      const isRelationshipGroup = Array.isArray(data?.parameters)
        ? data.parameters.some(
            (p: any) => p.type === POLICY_RELATIONSHIP_TYPE_PARAMETER
          )
        : false;
      // Dependent Count / Dependent Attribute params drive a distinct enrollment
      // flow (per-life bucket = self age band + dependent count band) that only
      // applies when the policy is NOT relationship-group based — these two
      // parameter types are configured mutually exclusively with a relation-group
      // parameter today.
      const isDependentParameter = Array.isArray(data?.parameters)
        ? data.parameters.some(
            (p: any) =>
              p.type?.toLowerCase() === DEPENDENT_COUNT_INTERNAL_TYPE ||
              p.internalType === DEPENDENT_COUNT_INTERNAL_TYPE ||
              p.type?.toLowerCase() === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE ||
              p.internalType === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE
          )
        : false;
      return {
        isRelationshipGroup,
        isDependentParameter,
        relationships: data?.relationships,
        constraints: data?.constraints,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to fetch relations"
      );
    }
  }

  async getDependentsByEmployeeId(employeeId: number, policyId?: number) {
    try {
      return await this.dependentRepo.find({ where: { employeeId, policyId } });
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to fetch dependents"
      );
    }
  }

  // Every non-deleted dependent for the employee, regardless of which policy
  // (or none) they were originally added under. Used to backfill dependents
  // whose policyId points at a policy no longer in the employee's active
  // policy list (e.g. it expired) so they still show as eligible/selectable
  // for other active policies.
  async getAllDependentsByEmployeeId(employeeId: number) {
    try {
      return await this.dependentRepo.find({
        where: { employeeId, deletedAt: IsNull() },
      });
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to fetch dependents"
      );
    }
  }

  async createEmployeeEnrollment(data: Partial<PolicyEmployeeEnrollment>) {
    try {
      const record = this.employeeEnrollmentRepo.create(data);
      return await this.employeeEnrollmentRepo.save(record);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to create enrollment"
      );
    }
  }

  async findEmployeeEnrollment(policyId: number, employeeId: number) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeRepository",
        method: "findEmployeeEnrollment",
        payload: { policyId, employeeId },
        messageData: "method invoked",
      }),
    });
    try {
      return await this.employeeEnrollmentRepo.findOne({
        where: { policyId, employeeId },
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "findEmployeeEnrollment",
          payload: { policyId, employeeId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async createEmployeePolicyMap(
    map: Partial<PolicyEnrollmentEmployeePolicyMap>
  ) {
    try {
      const record = this.employeePolicyMapRepo.create({
        ...map,
        isOnBoradingMailSent: map.isOnBoradingMailSent ?? false,
      });
      return await this.employeePolicyMapRepo.save(record);
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to create policy map"
      );
    }
  }

  async updateEmployeeEnrollmentStatus(
    policyId: number,
    employeeId: number,
    status: string
  ) {
    try {
      const enrollment = await this.employeeEnrollmentRepo.findOne({
        where: { policyId, employeeId },
      });
      if (!enrollment) throw new NotFoundException("Enrollment not found");
      const components = await this.employeeChoiceRepo.find({
        where: { employeeEnrollmentId: enrollment.id },
      });
      const sum = components.reduce(
        (acc, comp) => acc + Number(comp.sumInsured),
        0
      );
      const totalPremium = components.reduce(
        (acc, comp) => acc + Number(comp.premium),
        0
      );
      const totalCompanyPay = components.reduce(
        (acc, comp) => acc + Number(comp.companyPay),
        0
      );
      const totalEmployeePay = components.reduce(
        (acc, comp) => acc + Number(comp.employeePay),
        0
      );
      enrollment.sumInsured = sum;
      enrollment.balance = enrollment.sumInsured;
      enrollment.totalPremium = totalPremium;
      enrollment.totalCompanyPay = totalCompanyPay;
      enrollment.totalEmployeePay = totalEmployeePay;
      enrollment.employeeEnrollmentStatusKey = status;
      return await this.employeeEnrollmentRepo.save(enrollment);
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to update status"
      );
    }
  }

  async findEnrolledEmployeeByEmailAndCompany(
    email: string,
    companyId: number,
  ): Promise<{ id: number } | null> {
    const pee = await this.companyEmployeeRepository.findOne({
      where: { email: email.trim().toLowerCase(), companyId, deletedAt: IsNull() },
      select: ["id"],
      order: { id: "DESC" },
    });
    return pee ? { id: pee.id } : null;
  }

  async getPoliciesByEmployee(employeeId: number) {
    try {
      const pee = await this.companyEmployeeRepository.findOne({
        where: { id: employeeId },
        select: ["id", "companyId"],
      });

      const installmentLookup = await this.lookUpRepository.find({
        where: { lookUpKey: "TOGGLE_TYPE_YES" },
        select: ["id"],
      });
      const installmentIds = installmentLookup.map((l) => l.id);

      const maps = await this.employeePolicyMapRepo.find({
        where: installmentIds.length
          ? [
              { employeeId, policy: { isInstallmentPolicy: IsNull() } },
              { employeeId, policy: { isInstallmentPolicy: Not(In(installmentIds)) } },
            ]
          : { employeeId },
        relations: { policy: { policyType: true } },
      });

      const todayStr = new Date().toISOString().split("T")[0];
      const policies = maps
        .map((m) => m.policy)
        .filter((p) => new Date(p.policyTo).toISOString().split("T")[0] >= todayStr);
      if (pee?.companyId) {
        return policies.filter((p) => p.companyId === pee.companyId);
      }
      return policies;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to fetch policies"
      );
    }
  }

  async getEmployeeEnrollmentWindowSource(
    policyId: number,
    employeeId: number
  ): Promise<
    | Pick<
        PolicyEnrollmentEmployeePolicyMap,
        "enrollmentStartDate" | "enrollmentEndDate" | "createdAt"
      >
    | null
  > {
    const row = await this.employeePolicyMapRepo
      .createQueryBuilder("map")
      .select([
        "COALESCE(map.enrollmentStartDate, dpf.enrollmentStartDate) AS enrollmentStartDate",
        "COALESCE(map.enrollmentEndDate, dpf.enrollmentEndDate) AS enrollmentEndDate",
        "map.createdAt AS createdAt",
      ])
      .leftJoin(
        DocumentProcessingFile,
        "dpf",
        "dpf.documentId = map.enrollmentAdditionBatchId",
      )
      .where("map.deletedAt IS NULL")
      .andWhere("map.policyId = :policyId", { policyId })
      .andWhere("map.employeeId = :employeeId", { employeeId })
      .orderBy("map.updatedAt", "DESC")
      .addOrderBy("map.createdAt", "DESC")
      .getRawOne<{
        enrollmentstartdate?: Date | string | null;
        enrollmentenddate?: Date | string | null;
        createdat?: Date | string | null;
      }>();

    if (!row) return null;

    // TypeORM returns lowercase keys for raw aliases in some drivers.
    const enrollmentStartDate =
      (row as any).enrollmentstartdate ?? (row as any).enrollmentStartDate ?? null;
    const enrollmentEndDate =
      (row as any).enrollmentenddate ?? (row as any).enrollmentEndDate ?? null;
    const createdAt = (row as any).createdat ?? (row as any).createdAt ?? null;

    return {
      enrollmentStartDate:
        enrollmentStartDate ? new Date(enrollmentStartDate) : null,
      enrollmentEndDate: enrollmentEndDate ? new Date(enrollmentEndDate) : null,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
    };
  }

  async getEmployeeECardPolicies(
    employeeId: number,
  ): Promise<PolicyEnrollmentEmployeePolicyMap[]> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeRepository",
        method: "getEmployeeECardPolicies",
        payload: { employeeId },
        messageData: "method invoked",
      }),
    });
    try {
      return await this.employeePolicyMapRepo
        .createQueryBuilder("map")
        .leftJoinAndSelect("map.policy", "policy")
        .leftJoinAndSelect("policy.company", "company")
        .leftJoinAndSelect("policy.policyType", "policyType")
        .where("map.employeeId = :employeeId", { employeeId })
        .andWhere("map.deletedAt IS NULL")
        .getMany();
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getEmployeeECardPolicies",
          payload: { employeeId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch employee policies",
      );
    }
  }

  async getEmployeePolicyOverviewData(
    employeeId: number
  ): Promise<{
    policyMaps: PolicyEnrollmentEmployeePolicyMap[];
    dependents: PolicyEnrollmentDependent[];
    claims: PolicyClaim[];
    enrollments: PolicyEmployeeEnrollment[];
  }> {
    const policyMaps = await this.employeePolicyMapRepo
      .createQueryBuilder("map")
      .leftJoinAndSelect("map.policy", "policy")
      .leftJoinAndSelect("policy.policyType", "policyType")
      .leftJoinAndSelect("map.employee", "employee")
      .where("map.employeeId = :employeeId", { employeeId })
      .andWhere("map.deletedAt IS NULL")
      .getMany();

    const policyIds = policyMaps.map((map) => map.policyId);
    if (!policyIds.length) {
      return { policyMaps: [], dependents: [], claims: [], enrollments: [] };
    }

    // Collect all non-null TPA IDs for this employee across their policies
    const employeeTpaIds = [
      ...new Set(
        policyMaps
          .map((m) => m.employeeTpaId)
          .filter((id): id is string => !!id),
      ),
    ];

    const dependentsPromise = this.dependentRepo.find({
      where: { employeeId, policyId: In(policyIds) },
    });

    // Claims filter logic:
    // - If employee has TPA ID(s): fetch claims matching employee_tpa_id OR employee_id
    //   (TPA-synced claims are stored with employee_tpa_id; portal claims use employee_id)
    // - If employee has no TPA ID: filter only by employee_id
    const claimsPromise =
      employeeTpaIds.length > 0
        ? this.policyClaimRepository
            .createQueryBuilder("claim")
            .leftJoinAndSelect("claim.dependent", "dependent")
            .leftJoinAndSelect("claim.employee", "employee")
            .leftJoinAndSelect("claim.settlements", "settlements")
            .where("claim.policyId IN (:...policyIds)", { policyIds })
            .andWhere(
              "(claim.employeeId = :employeeId OR claim.employeeTpaId IN (:...employeeTpaIds))",
              { employeeId, employeeTpaIds },
            )
            .getMany()
        : this.policyClaimRepository.find({
            where: { employeeId, policyId: In(policyIds) },
            relations: ["dependent", "employee", "settlements"],
          });

    const enrollmentsPromise = this.employeeEnrollmentRepo.find({
      where: { employeeId, policyId: In(policyIds) },
      relations: { components: true },
    });

    const [dependents, claims, enrollments] = await Promise.all([
      dependentsPromise,
      claimsPromise,
      enrollmentsPromise,
    ]);

    return { policyMaps, dependents, claims, enrollments };
  }

  async getEnrollmentComponents(policyId: number, employeeId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeRepository",
          method: "getEnrollmentComponents",
          payload: { policyId, employeeId },
          messageData: "method invoked",
        }),
      });
      const enrollment = await this.employeeEnrollmentRepo.findOne({
        where: { policyId, employeeId },
        relations: { components: true },
      });
      return enrollment?.components ?? [];
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getEnrollmentComponents",
          payload: { policyId, employeeId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch enrollment components"
      );
    }
  }

  async getEnrolledPolicies(employeeId: number) {
    try {
      const enrollments = await this.employeeEnrollmentRepo.find({
        where: {
          employeeId,
          employeeEnrollmentStatusKey: EMPLOYEE_ENROLLMENT_STATUS_ENROLLED,
        },
      });

      const policyIds = enrollments.map((e) => e.policyId);
      if (policyIds.length === 0) return [];

      const dependents = await this.dependentRepo.find({
        where: { employeeId, policyId: In(policyIds), deletedAt: IsNull() },
      });

      const countMap = new Map<number, number>();
      for (const dep of dependents) {
        const current = countMap.get(dep.policyId) ?? 0;
        countMap.set(dep.policyId, current + 1);
      }

      const results: {
        policyId: number;
        sumInsured: number;
        balance: number;
        dependentsCount: number;
      }[] = [];

      for (const en of enrollments) {
        results.push({
          policyId: en.policyId,
          sumInsured: en.sumInsured,
          balance: en.balance,
          dependentsCount: countMap.get(en.policyId) ?? 0,
        });
      }

      return results;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch enrolled policies"
      );
    }
  }

  async getEnrollmentSummary(policyId: number, employeeId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeRepository",
          method: "getEnrollmentSummary",
          payload: { policyId, employeeId },
          messageData: "method invoked",
        }),
      });

      const enrollment = await this.employeeEnrollmentRepo.findOne({
        where: { policyId, employeeId },
        relations: {
          components: true,
        },
      });
      if (!enrollment) {
        throw new NotFoundException("Enrollment not found");
      }

      const totals = {
        sumInsured: Number(enrollment.sumInsured ?? 0),
        premium: Number(enrollment.totalPremium ?? 0),
        companyPay: Number(enrollment.totalCompanyPay ?? 0),
        employeePay: Number(enrollment.totalEmployeePay ?? 0),
      };

      const dependents = await this.dependentRepo.find({
        where: {
          policyId,
          employeeId,
          deletedAt: IsNull(),
        },
      });

      return {
        enrolledChoices: enrollment.components,
        dependents,
        employeeEnrollmentStatusKey: enrollment.employeeEnrollmentStatusKey,
        ...totals,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getEnrollmentSummary",
          payload: { policyId, employeeId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch enrollment summary"
      );
    }
  }

  async employeeDetailsTransformation(
    employeeDetails: PolicyEnrollmentEmployee | null
  ): Promise<EmployeeDetailsDto | null> {
    if (!employeeDetails) {
      return null;
    }
    const employeeGenderLookupDetails = await this.lookUpRepository.findOne({
      where: {
        lookUpValueKey: employeeDetails.gender?.trim().toLocaleUpperCase(),
      },
    });
    if (!employeeGenderLookupDetails) {
      throw new InternalServerErrorException(
        `No valid look up data found for the employee gender: ${employeeDetails.gender}`
      );
    }
    const employeeMaritalStatusLookupDetails =
      await this.lookUpRepository.findOne({
        where: {
          lookUpValueKey: employeeDetails.maritalStatus
            ?.trim()
            .toLocaleUpperCase(),
          lookUpName: LOOK_UP_DATA.maritalStatus,
        },
      });
      console.log("employeeDetails", employeeDetails);
    // if (!employeeMaritalStatusLookupDetails) {
    //   throw new InternalServerErrorException(
    //     `No valid look up data found for the employee marital status: ${employeeDetails.maritalStatus}`
    //   );
    // }
    return {
      id: employeeDetails.id,
      employeeCompanyId: employeeDetails.employeeCompanyId || "",
      companyId: employeeDetails.companyId || 0,
      companyEmployeeId: employeeDetails.companyEmployeeId || "",
      companyName: employeeDetails.company ? employeeDetails.company.displayName : "",
      employeeName: employeeDetails.employeeName,
      email: employeeDetails.email || "",
      phone: employeeDetails.phoneNumber || "",
      alternatePhoneNumber: employeeDetails.alternatePhoneNumber || "",
      alternateEmail: employeeDetails.alternateEmail || "",
      fullName: employeeDetails.fullName,
      dateOfBirth: employeeDetails.dateOfBirth
        ? typeof employeeDetails.dateOfBirth === "string"
          ? employeeDetails.dateOfBirth
          : employeeDetails.dateOfBirth.toISOString()
        : "",
      designation: employeeDetails.designation || "",
      gender: {
        key: employeeGenderLookupDetails.lookUpKey,
        value: employeeDetails.gender?.trim().toLocaleLowerCase() ?? "",
      },
      maritalStatus: {
        key: employeeDetails.maritalStatus
          ? employeeMaritalStatusLookupDetails?.lookUpKey ?? ""
          : "",
        value: employeeDetails.maritalStatus?.trim().toLocaleLowerCase() ?? "",
      },
      country: employeeDetails.company?.country?.name || "",
      additionalDetails: employeeDetails.additionalParams,
      allowEnrollmentReset: employeeDetails.allowEnrollmentReset ?? false,
    };
  }

  async getCompanyEmployeeDataByEmployeeProperties(
    companyEmployeeName: string,
    companyEmployeeEmail: string,
    companyEmployeemobile: string,
    companyEmployeeId?: string
  ): Promise<PolicyEnrollmentEmployee | null> {
    try {
      const companyEmployeeDetails =
        await this.companyEmployeeRepository.findOne({
          where: {
            employeeName: companyEmployeeName,
            email: companyEmployeeEmail,
            phoneNumber: companyEmployeemobile,
            companyEmployeeId: In([companyEmployeeId]),
            deletedAt: IsNull(),
          },
        });
      if (!companyEmployeeDetails) {
        throw new NotFoundException(
          `Failed to employee with name: ${companyEmployeeName}, email: ${companyEmployeeEmail}, mobile: ${companyEmployeemobile}`
        );
      }
      return companyEmployeeDetails;
    } catch (error) {
      if (error instanceof NotFoundException) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "UserRepository",
            method: "getCompanyEmployeeDataByEmployeeProperties",
            payload: {
              name: companyEmployeeName,
              email: companyEmployeeEmail,
              mobile: companyEmployeemobile,
              companyEmployeeId,
            },
            messageData: error,
          }),
        });
        throw error;
      }
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "UserRepository",
          method: "getCompanyEmployeeDataByEmployeeProperties",
          payload: {
            name: companyEmployeeName,
            email: companyEmployeeEmail,
            mobile: companyEmployeemobile,
            companyEmployeeId,
          },
          messageData: error,
        }),
      });
      throw new BadRequestException(errorMessages.failedToFindUser);
    }
  }

  async updateCompanyEmployeePassword(
    peeId: number,
    companyEmployeePassword: string
  ): Promise<boolean | null> {
    try {
      const pee = await this.companyEmployeeRepository.findOne({
        where: { id: peeId },
      });
      if (!pee) {
        throw new NotFoundException(errorMessages.companyEmployeeNotFound);
      }
      await this.companyEmployeeRepository.update(
        { id: peeId },
        { ibpPassword: companyEmployeePassword, isPasswordSet: true, userStatusKey: USER_STATUS_ACTIVE },
      );
      return true;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "updateCompanyEmployeePassword",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async updateDependents(
    manager: EntityManager,
    policyId: number | null,
    employeeId: number,
    dtos: UpsertEnrollmentDependentDto[],
    userId: number,
    options: { skipDeletion?: boolean; isLifeEvent?: boolean; preserveIds?: Set<number> } = {},
    endorsementId?: number
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeRepository",
        method: "updateDependents",
        payload: { policyId, employeeId, dtos, userId },
        messageData: "method invoked",
      }),
    });
    try {
      const existing = await manager.find(PolicyEnrollmentDependent, {
        where: { policyId, employeeId, deletedAt: IsNull() },
      });

      // When enrolling a dep that was previously saved under a different policy
      // (policyId=NULL, i.e. a profile dep, or a policy that has since expired),
      // we need to find those rows so we can promote them (reassign policyId)
      // instead of creating a duplicate row. A dep still tied to a DIFFERENT
      // policy that is still active is left alone — it's a legitimate separate
      // enrollment for that other policy, not something to reassign here.
      const otherDependents = (
        await manager.find(PolicyEnrollmentDependent, {
          where: { employeeId, deletedAt: IsNull() },
        })
      ).filter((d) => d.policyId !== policyId);

      const otherPolicyIds = [
        ...new Set(
          otherDependents
            .map((d) => d.policyId)
            .filter((id): id is number => id != null),
        ),
      ];
      const todayStr = new Date().toISOString().split("T")[0];
      const activeOtherPolicyIds = otherPolicyIds.length
        ? new Set(
            (
              await manager.find(Policy, {
                where: { id: In(otherPolicyIds) },
                select: ["id", "policyTo"],
              })
            )
              .filter(
                (p) => new Date(p.policyTo).toISOString().split("T")[0] >= todayStr,
              )
              .map((p) => p.id),
          )
        : new Set<number>();

      const normalizeText = (value?: string | null) =>
        typeof value === "string" ? value.trim().toLowerCase() : "";
      const buildIdentityKey = (input: {
        name?: string | null;
        relation?: string | null;
        relationshipType?: string | null;
        gender?: string | null;
      }) =>
        [
          normalizeText(input.name),
          normalizeText(input.relation),
          normalizeText(input.relationshipType),
          normalizeText(input.gender),
        ].join("|");

      const profileDepById = new Map<number, PolicyEnrollmentDependent>();
      const profileDepByIdentity = new Map<string, PolicyEnrollmentDependent>();
      for (const dep of otherDependents) {
        // Skip deps still tied to another currently-active policy — those
        // must remain their own row, not get reassigned to this policy.
        if (dep.policyId != null && activeOtherPolicyIds.has(dep.policyId)) {
          continue;
        }
        profileDepById.set(dep.id, dep);
        const identityKey = buildIdentityKey(dep);
        if (identityKey && !profileDepByIdentity.has(identityKey)) {
          profileDepByIdentity.set(identityKey, dep);
        }
      }

      const incomingIds = new Set<number>();
      const entities: PolicyEnrollmentDependent[] = [];
      const existingById = new Map<number, PolicyEnrollmentDependent>();
      const existingByIdentity = new Map<string, PolicyEnrollmentDependent>();
      const processedEntityIds = new Set<number>();
      const createdIdentityKeys = new Set<string>();

      for (const dep of existing) {
        existingById.set(dep.id, dep);
        const identityKey = buildIdentityKey(dep);
        if (identityKey && !existingByIdentity.has(identityKey)) {
          existingByIdentity.set(identityKey, dep);
        }
      }

      for (const dto of dtos) {
        const identityKey = buildIdentityKey(dto);
        const existingDependent =
          (dto.id ? existingById.get(dto.id) : undefined) ??
          existingByIdentity.get(identityKey) ??
          (dto.id ? profileDepById.get(Number(dto.id)) : undefined) ??
          profileDepByIdentity.get(identityKey);

        if (dto.id && !existingById.get(dto.id) && !existingDependent) {
          this.logger.log({
            level: "warn",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "warning",
              location: "CompanyEmployeeRepository",
              method: "updateDependents",
              payload: {
                policyId,
                employeeId,
                providedDependentId: dto.id,
                dependent: dto,
              },
              messageData:
                "Ignoring dependent id not present in current policy scope; resolving by identity/new record",
            }),
          });
        }

        const resolvedDependentId = existingDependent?.id;
        if (resolvedDependentId) {
          incomingIds.add(resolvedDependentId);
        }

        if (resolvedDependentId && processedEntityIds.has(resolvedDependentId)) {
          this.logger.log({
            level: "warn",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "warning",
              location: "CompanyEmployeeRepository",
              method: "updateDependents",
              payload: {
                policyId,
                employeeId,
                resolvedDependentId,
                dependent: dto,
              },
              messageData:
                "Skipping duplicate dependent entry in payload (resolved to same dependent id)",
            }),
          });
          continue;
        }

        if (!resolvedDependentId && createdIdentityKeys.has(identityKey)) {
          this.logger.log({
            level: "warn",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "warning",
              location: "CompanyEmployeeRepository",
              method: "updateDependents",
              payload: {
                policyId,
                employeeId,
                identityKey,
                dependent: dto,
              },
              messageData:
                "Skipping duplicate new dependent entry in payload (same identity key)",
            }),
          });
          continue;
        }

        const dependentEntity: Partial<PolicyEnrollmentDependent> = {
          policyId,
          employeeId,
          name: dto.name,
          relation: dto.relation,
          relationshipType: dto.relationshipType,
          dateOfBirth: dto.dateOfBirth
            ? typeof dto.dateOfBirth === "string"
              ? dto.dateOfBirth
              : new Date(
                  dto.dateOfBirth.getTime() -
                    dto.dateOfBirth.getTimezoneOffset() * 60000
                )
                  .toISOString()
                  .split("T")[0]
            : undefined,
          effectiveDate: dto.effectiveDate
            ? typeof dto.effectiveDate === "string"
              ? dto.effectiveDate
              : new Date(
                  dto.effectiveDate.getTime() -
                    dto.effectiveDate.getTimezoneOffset() * 60000
                )
                  .toISOString()
                  .split("T")[0]
            : undefined,
          gender: dto.gender,
          documentIds: dto.documentIds ?? existingDependent?.documentIds ?? null,
          // Mark only dependents that are actually part of the life-event payload.
          // Existing dependents included for context should not become life-event records.
          isLifeEvent:
            options.isLifeEvent && dto.lifeEventAction
              ? true
              : (existingDependent?.isLifeEvent ?? false),
          enrollmentAdditionBatchId: dto.enrollmentAdditionBatchId ?? null,
          createdBy: resolvedDependentId ? undefined : userId,
          updatedBy: userId,
          claimStatus: dto.claimStatus ?? existingDependent?.claimStatus ?? null,
          additionalAttributes: dto.additionalAttributes ?? existingDependent?.additionalAttributes ?? undefined,
          // Preserve endorsement fields so this upsert does not overwrite them with
          // NULL — an existing dependent re-saved here (e.g. included again in a
          // later payload for context) must keep the endorsement that originally
          // added it, not have it silently wiped.
          endorsementStatusKey: existingDependent?.endorsementStatusKey,
          additionEndorsementId: existingDependent?.additionEndorsementId,
        };
        if (resolvedDependentId) {
          dependentEntity.id = resolvedDependentId;
          processedEntityIds.add(resolvedDependentId);
        } else {
          createdIdentityKeys.add(identityKey);
        }
        const entity = manager.create(
          PolicyEnrollmentDependent,
          dependentEntity
        );
        entities.push(entity);
      }

      if (!options.skipDeletion) {
        for (const dep of existing) {
          if (!incomingIds.has(dep.id) && !options.preserveIds?.has(dep.id)) {
            dep.deletedAt = new Date();
            dep.updatedBy = userId;
            // Reliable per-endorsement ownership marker — every other function that
            // needs to know "was THIS dependent deleted by THIS specific endorsement"
            // relies on deletionEndorsementId, not just deletedAt being set.
            if (endorsementId != null) {
              (dep as any).deletionEndorsementId = endorsementId;
            }
            entities.push(dep);
          }
        }
      }

      await manager.save(PolicyEnrollmentDependent, entities);
      return await manager.find(PolicyEnrollmentDependent, {
        where: {
          policyId,
          employeeId,
          deletedAt: IsNull(),
        },
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "updateDependents",
          payload: { policyId, employeeId, dtos, userId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to update dependents"
      );
    }
  }

  async deleteExistingEnrollmentChoices(policyId: number, employeeId: number) {
    try {
      const enrollment = await this.employeeEnrollmentRepo.findOne({
        where: { policyId, employeeId },
      });

      if (enrollment) {
        await this.employeeChoiceRepo.delete({
          employeeEnrollmentId: enrollment.id,
        });
      }
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to delete existing enrollment choices"
      );
    }
  }

  async updateEnrollmentChoices(
    manager: EntityManager,
    dtos: Array<
      EnrollmentChoiceDto & {
        policyId: number;
        employeeId: number;
        companyId: number;
      }
    >,
    enrollmentContext?: {
      policyId: number;
      employeeId: number;
      companyId: number;
    }
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeRepository",
        method: "updateEnrollmentChoices",
        payload: { dtos },
        messageData: "method invoked",
      }),
    });
    let failureStage = "init";
    try {
      const choiceDependentRepo = manager.getRepository(
        this.employeeChoiceDependentRepo
          .target as unknown as typeof PolicyEmployeeEnrollmentChoiceDependent,
      );
      let policyId: number, employeeId: number, companyId: number;

      if (dtos.length > 0) {
        ({ policyId, employeeId, companyId } = dtos[0]);
      } else if (enrollmentContext) {
        ({ policyId, employeeId, companyId } = enrollmentContext);
      } else {
        return [];
      }

      let enrollment = await manager.findOne(PolicyEmployeeEnrollment, {
        where: { policyId, employeeId },
      });
      if (!enrollment) {
        const inProgressKey = EMPLOYEE_ENROLLMENT_STATUS_IN_PROGRESS;
        enrollment = manager.create(PolicyEmployeeEnrollment, {
          policyId,
          employeeId,
          companyId,
          employeeEnrollmentStatusKey: inProgressKey,
        });
        enrollment = await manager.save(enrollment);
      }

      // Get existing choices from database
      failureStage = "load_existing_choices";
      const existingChoices = await manager.find(
        PolicyEmployeeEnrollmentChoice,
        {
          where: { employeeEnrollmentId: enrollment.id },
        }
      );

      // Extract IDs from payload (only those with IDs - existing records)
      const incomingIds = new Set<number>();
      dtos.forEach((dto) => {
        if (dto.id) {
          incomingIds.add(dto.id);
        }
      });

      // Find choices to delete (exist in DB but not in payload)
      const choicesToDelete = existingChoices.filter(
        (choice) => !incomingIds.has(choice.id)
      );

      // Delete choices that are not present in payload
      if (choicesToDelete.length > 0) {
        failureStage = "delete_stale_choices";
        const idsToDelete = choicesToDelete.map((choice) => choice.id);
        await choiceDependentRepo.delete({
          employeeEnrollmentChoiceId: In(idsToDelete),
        });
        await manager.delete(PolicyEmployeeEnrollmentChoice, {
          id: In(idsToDelete),
        });

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "CompanyEmployeeRepository",
            method: "updateEnrollmentChoices",
            payload: { deletedChoiceIds: idsToDelete },
            messageData: "Deleted enrollment choices not present in payload",
          }),
        });
      }

      // Create/Update entities from payload (if any)
      if (dtos.length > 0) {
        failureStage = "build_entities";
        const entities = dtos.map((dto) =>
          manager.create(PolicyEmployeeEnrollmentChoice, {
            id: dto.id,
            employeeEnrollmentId: enrollment.id,
            sumInsured: dto.sumInsured,
            premium: dto.premium,
            companyPay: dto.companyPay,
            employeePay: dto.employeePay,
            premiumPerLife: dto.premiumPerLife,
            sumInsuredPerLife: dto.sumInsuredPerLife ?? null,
            proRationEnabled: dto.proRationEnabled,
            sumInsuredModel: dto.sumInsuredModel,
            sumInsuredModelProperty: dto.sumInsuredModelProperty,
            minSumInsuredValue: dto.minSumInsuredValue,
            maxSumInsuredValue: dto.maxSumInsuredValue,
            policyComponentActionType: dto.policyComponentActionType,
            policyComponentActionTypeId: dto.policyComponentActionTypeId,
            parentpolicyComponentActionTypeId:
              dto.parentpolicyComponentActionTypeId,
            policyComponentActionLabel: dto.policyComponentActionLabel,
            // Sent by the frontend, already prorated using the same logic
            // behind every on-screen premium — stored as-is, not recomputed.
            // Falls back to the full (unprorated) value when the frontend
            // doesn't send one (older client, or proration doesn't apply),
            // so this column is always safe to read unconditionally.
            proratedPremium: dto.proratedPremium ?? dto.premium,
            proratedCompanyPay: dto.proratedCompanyPay ?? dto.companyPay,
            proratedEmployeePay: dto.proratedEmployeePay ?? dto.employeePay,
          })
        );

        failureStage = "save_choices";
        const savedChoices = await manager.save(
          PolicyEmployeeEnrollmentChoice,
          entities
        );

        const dtoById = new Map<number, EnrollmentChoiceDto>();
        const dtoByIndex = new Map<number, EnrollmentChoiceDto>();
        dtos.forEach((dto, index) => {
          if (dto.id) {
            dtoById.set(dto.id, dto);
          } else {
            dtoByIndex.set(index, dto);
          }
        });

        failureStage = "rebuild_choice_dependent_links";
        for (let index = 0; index < savedChoices.length; index += 1) {
          const savedChoice = savedChoices[index];
          if (!savedChoice?.id) {
            this.logger.warn({
              level: "warn",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "warning",
                location: "CompanyEmployeeRepository",
                method: "updateEnrollmentChoices",
                payload: {
                  index,
                  savedChoice,
                  dtoAtIndex: dtos[index],
                },
                messageData:
                  "Skipping dependent-choice link update: saved choice missing id",
              }),
            });
            continue;
          }
          const dto =
            dtoById.get(savedChoice.id) ?? dtoByIndex.get(index);
          if (!dto?.coveredDependentIds) {
            continue;
          }
          await choiceDependentRepo.delete({
            employeeEnrollmentChoiceId: savedChoice.id,
          });
          const uniqueDependentIds = Array.from(
            new Set(dto.coveredDependentIds),
          )
            .map((dependentId) => Number(dependentId))
            .filter((dependentId) => Number.isFinite(dependentId));
          if (!uniqueDependentIds.length) {
            continue;
          }
          const linkEntities = uniqueDependentIds.map((dependentId) =>
            manager.create(PolicyEmployeeEnrollmentChoiceDependent, {
              employeeEnrollmentChoiceId: savedChoice.id,
              dependentId,
            }),
          );
          await choiceDependentRepo.save(linkEntities);
        }

        return savedChoices;
      } else {
        return [];
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "updateEnrollmentChoices",
          payload: { dtos, failureStage },
          messageData: {
            name: error instanceof Error ? error.name : undefined,
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
          },
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to update enrollment choices"
      );
    }
  }

  async updateEnrollmentStatus(
    manager: EntityManager,
    policyId: number,
    employeeId: number,
    companyId: number,
    valueKey: string,
    endorsementId?: number,
    newDependentsOnly: boolean = false,
    newlyAddedDependentIds?: number[],
    deletedDependentIds?: number[],
    employeeDeletedAt?: Date | string | null
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeRepository",
        method: "updateEnrollmentStatus",
        payload: { policyId, employeeId, companyId, valueKey },
        messageData: "method invoked",
      }),
    });
    try {
      const enrollment = await manager.findOne(PolicyEmployeeEnrollment, {
        where: { policyId, employeeId },
      });
      if (!enrollment) throw new NotFoundException("Enrollment not found");

      // Captured before any mutation below — this is what an independent dependent
      // addition appends onto (see the newDependentsOnly branch further down).
      const existingSumInsured = Number(enrollment.sumInsured) || 0;

      const components = await manager.find(PolicyEmployeeEnrollmentChoice, {
        where: { employeeEnrollmentId: enrollment.id },
      });

      const activeDependents = await manager.find(PolicyEnrollmentDependent, {
        where: { policyId, employeeId, deletedAt: IsNull() },
      });
      const livesCount = 1 + activeDependents.length;

      // activeDependents excludes anyone just deleted (deletedAt: IsNull() above), so
      // their records must be fetched separately — withDeleted since they're soft-deleted.
      const deletedDependentRecords = deletedDependentIds?.length
        ? await manager.find(PolicyEnrollmentDependent, {
            where: { id: In(deletedDependentIds) },
            withDeleted: true,
          })
        : [];

      // Fetched up front (not after totals, as before) — needed to know whether any
      // component's per-life premium must be resolved per-dependent (age/dependent-count
      // aware) rather than flatly multiplied by livesCount, below.
      const policyConfigRecord = await this.getPolicyConfigurationByPolicyId(
        policyId
      );
      const config = policyConfigRecord?.policyConfiguration as any;

      const applyToDependentsParams: any[] = config
        ? (config.parameters ?? []).filter((p: any) => p.applyToDependents)
        : [];
      const useConfigForDependents =
        applyToDependentsParams.length > 0 &&
        (activeDependents.length > 0 || deletedDependentRecords.length > 0);

      // depBaseOptionMeta anchors the "Age" (etc.) swap done per-dependent below to the
      // SAME non-applyToDependents values (e.g. Dependent Count) the employee's own
      // premium was resolved against — mirrors calculateProratedPremiumsForEnrollment.
      let empRecordForDependents: any = null;
      let computeDepBaseOptionMeta: (dependentsForBand: any[]) => OptionMetaEntry[] = () => [];
      if (useConfigForDependents) {
        const employeeRecord = await manager.findOne(PolicyEnrollmentEmployee, {
          where: { id: employeeId },
        });
        if (employeeRecord) {
          empRecordForDependents = {
            ...(employeeRecord as any),
            additionalDetails: (employeeRecord as any).additionalParams,
          };
          const dependentCountParams: any[] = (config.parameters ?? []).filter(
            (p: any) =>
              p.type?.toLowerCase() === DEPENDENT_COUNT_INTERNAL_TYPE ||
              p.internalType === DEPENDENT_COUNT_INTERNAL_TYPE
          );
          computeDepBaseOptionMeta = (dependentsForBand: any[]): OptionMetaEntry[] => {
            const empBaseOption = (config.policyOptions ?? []).find((opt: any) => {
              const ageAndAttributesMatch = applyToDependentsParams.every((param: any) => {
                try {
                  const empId = resolveOptionIdForLife(
                    empRecordForDependents,
                    empRecordForDependents,
                    param,
                    undefined
                  );
                  return !empId || (opt.optionMeta ?? []).some(
                    (m: OptionMetaEntry) => m.parameterId === param.id && m.parameterOptionId === empId
                  );
                } catch {
                  return true;
                }
              });
              const dependentCountMatches = dependentCountParams.every((param: any) => {
                const matchedId = resolveDependentCountOptionId(param, dependentsForBand);
                return !matchedId || (opt.optionMeta ?? []).some(
                  (m: OptionMetaEntry) => m.parameterId === param.id && m.parameterOptionId === matchedId
                );
              });
              return ageAndAttributesMatch && dependentCountMatches;
            });
            return empBaseOption?.optionMeta ?? [];
          };
        }
      }

      // "Newly added" is what THIS endorsement action is introducing — everyone else
      // (previously known) is frozen and untouched. Only meaningful (non-empty) when
      // newDependentsOnly — the family-together/inception path recomputes everything
      // fresh and doesn't need this split.
      const newlyAddedDependents = newDependentsOnly
        ? activeDependents.filter((dep) => newlyAddedDependentIds?.includes(dep.id))
        : [];

      // Current (full) family band — used for the employee's own row and every
      // dependent's own premium, including one newly added in this specific endorsement.
      // Per the business Premium Rater Table (confirmed with stakeholder): a newly added
      // dependent is priced at the NEW/enhanced family SI directly — the employee's own
      // line and previously-known dependents are frozen and never recalculated here.
      const newDepBaseOptionMeta = computeDepBaseOptionMeta(activeDependents);

      // Band INCLUDING the deleted dependent(s) — activeDependents excludes them, so a
      // deleted life's own refund must resolve against the enhanced band it was actually
      // active under just before deletion, not the smaller post-deletion family. No
      // diff/subtraction here — just resolve-and-prorate, mirroring
      // calculateProratedPremiumsForEnrollment's bandIncludingDeleted.
      const bandIncludingDeleted = deletedDependentRecords.length
        ? computeDepBaseOptionMeta([...activeDependents, ...deletedDependentRecords])
        : [];

      // Fetched fresh (not reused/cached) — proration below needs the policy's actual
      // coverage window, and gstPercentage is needed later regardless of newDependentsOnly.
      const policyRow = await manager.findOne(Policy, {
        where: { id: policyId },
        select: ["id", "policyFrom", "policyTo", "gstPercentage"],
      });
      const gstPercentage = Number(policyRow?.gstPercentage ?? 0);
      const normalizedPolicyFrom = policyRow?.policyFrom
        ? toMidnight(new Date(policyRow.policyFrom))
        : undefined;
      const normalizedPolicyTo = policyRow?.policyTo
        ? toMidnight(new Date(policyRow.policyTo))
        : undefined;
      const totalPolicyDays =
        normalizedPolicyFrom && normalizedPolicyTo
          ? Math.max(0, daysBetweenInclusive(normalizedPolicyFrom, normalizedPolicyTo))
          : 0;
      const applicableDaysFor = (effectiveDate: Date | string | undefined): number => {
        if (!normalizedPolicyFrom || !normalizedPolicyTo) return totalPolicyDays;
        const start = effectiveDate ? toMidnight(new Date(effectiveDate)) : normalizedPolicyFrom;
        const clampedStart = new Date(
          Math.max(start.getTime(), normalizedPolicyFrom.getTime())
        );
        return calculateApplicableDays(clampedStart, normalizedPolicyTo);
      };
      const prorationFactorFor = (effectiveDate: Date | string | undefined): number =>
        totalPolicyDays > 0 ? applicableDaysFor(effectiveDate) / totalPolicyDays : 1;

      // Anchor for DA proration below — the earliest new dependent's effective date
      // within this action.
      const earliestNewDepDate: Date | undefined =
        newlyAddedDependents.length > 0
          ? newlyAddedDependents.reduce((earliest: Date, dep: any) => {
              const d = dep.effectiveDate ? toMidnight(new Date(dep.effectiveDate)) : earliest;
              return d < earliest ? d : earliest;
            }, toMidnight(new Date(newlyAddedDependents[0].effectiveDate ?? Date.now())))
          : undefined;

      // Anchor for the deletion refund proration below — earliest deletion date within
      // this action; the refund covers each deleted life's own applicable days from
      // their deletion date through policyTo.
      const earliestDeletedDate: Date | undefined =
        deletedDependentRecords.length > 0
          ? deletedDependentRecords.reduce((earliest: Date, dep: any) => {
              const d = dep.deletedAt ? toMidnight(new Date(dep.deletedAt)) : earliest;
              return d < earliest ? d : earliest;
            }, toMidnight(new Date(deletedDependentRecords[0].deletedAt ?? Date.now())))
          : undefined;

      const sum = components.reduce(
        (acc, comp) => acc + Number(comp.sumInsured),
        0
      );

      const existingTotalPremium = Number(enrollment.totalPremium) || 0;
      const existingTotalCompanyPay = Number(enrollment.totalCompanyPay) || 0;
      const existingTotalEmployeePay = Number(enrollment.totalEmployeePay) || 0;

      const totals = components.reduce(
        (acc, comp) => {
          const isPPLComponent = this.isPremiumPerLifeEnabled(comp.premiumPerLife);

          if (newDependentsOnly) {
            // Endorsement (independent addition) case, per the business Premium Rater
            // Table (confirmed with stakeholder): previously-known dependents AND the
            // employee's own line are frozen — their premium is already part of the
            // existingTotalPremium baseline this reduce starts from and is never
            // recalculated here. Only the newly added dependent(s)' own premium, priced
            // at the CURRENT/enhanced family band and prorated by days covered, is
            // appended on top.
            if (isPPLComponent && useConfigForDependents && empRecordForDependents) {
              for (const param of applyToDependentsParams) {
                for (const dep of newlyAddedDependents) {
                  const depLifeRecord = {
                    ...(dep as any),
                    additionalDetails: (dep as any).additionalAttributes,
                  };
                  const factor = prorationFactorFor(dep.effectiveDate);
                  try {
                    const result = resolveDependentOnlyPremiumByConfiguration({
                      parameter: param,
                      dependent: depLifeRecord,
                      employee: empRecordForDependents,
                      baseOptionMeta: newDepBaseOptionMeta,
                      policyOptions: config.policyOptions ?? [],
                      componentId: comp.policyComponentActionTypeId ?? 0,
                      effectiveDate: dep.effectiveDate ?? undefined,
                      sumInsuredId: resolveSumInsuredIdForValue(
                        config.components,
                        comp.policyComponentActionTypeId ?? 0,
                        comp.sumInsured
                      ),
                    });
                    acc.totalPremium += result.premium * factor;
                    acc.totalCompanyPay += result.companyPay * factor;
                    acc.totalEmployeePay += result.employeePay * factor;
                  } catch {
                    // no matching option for this dependent's own band — nothing to add
                  }
                }
              }
            } else {
              // Flat (non-config-driven) component: append only the newly added
              // life/lives' own share, prorated — a livesCount multiplier here would
              // re-charge every already-counted existing life again.
              for (const dep of newlyAddedDependents) {
                const factor = prorationFactorFor(dep.effectiveDate);
                acc.totalPremium += (Number(comp.premium) || 0) * factor;
                acc.totalCompanyPay += (Number(comp.companyPay) || 0) * factor;
                acc.totalEmployeePay += (Number(comp.employeePay) || 0) * factor;
              }
            }
            return acc;
          }

          // Family-together / inception case — unchanged: full fresh recompute for
          // every life against the current (single, shared) family band.
          if (isPPLComponent && useConfigForDependents && empRecordForDependents) {
            // The employee's own premium is resolved fresh here too — not just read
            // from comp.premium as-is — because comp.premium can be stale: if a
            // dependent was added independently after the employee's own submission,
            // newDepBaseOptionMeta (and thus the Dependent Count band) reflects the
            // CURRENT family, but the employee's saved choice still reflects whatever
            // the family looked like when they originally enrolled.
            let empPremium = Number(comp.premium) || 0;
            let empCompanyPay = Number(comp.companyPay) || 0;
            let empEmployeePay = Number(comp.employeePay) || 0;
            for (const param of applyToDependentsParams) {
              try {
                const result = resolveDependentOnlyPremiumByConfiguration({
                  parameter: param,
                  dependent: empRecordForDependents,
                  employee: empRecordForDependents,
                  baseOptionMeta: newDepBaseOptionMeta,
                  policyOptions: config.policyOptions ?? [],
                  componentId: comp.policyComponentActionTypeId ?? 0,
                  effectiveDate: undefined,
                  sumInsuredId: resolveSumInsuredIdForValue(
                    config.components,
                    comp.policyComponentActionTypeId ?? 0,
                    comp.sumInsured
                  ),
                });
                empPremium = result.premium;
                empCompanyPay = result.companyPay;
                empEmployeePay = result.employeePay;
              } catch {
                // keep the stale comp.premium fallback already set above
              }
            }
            acc.totalPremium += empPremium;
            acc.totalCompanyPay += empCompanyPay;
            acc.totalEmployeePay += empEmployeePay;

            for (const dep of activeDependents) {
              const depLifeRecord = {
                ...(dep as any),
                additionalDetails: (dep as any).additionalAttributes,
              };
              for (const param of applyToDependentsParams) {
                try {
                  const result = resolveDependentOnlyPremiumByConfiguration({
                    parameter: param,
                    dependent: depLifeRecord,
                    employee: empRecordForDependents,
                    baseOptionMeta: newDepBaseOptionMeta,
                    policyOptions: config.policyOptions ?? [],
                    componentId: comp.policyComponentActionTypeId ?? 0,
                    effectiveDate: dep.effectiveDate ?? undefined,
                    sumInsuredId: resolveSumInsuredIdForValue(
                      config.components,
                      comp.policyComponentActionTypeId ?? 0,
                      comp.sumInsured
                    ),
                  });
                  acc.totalPremium += result.premium;
                  acc.totalCompanyPay += result.companyPay;
                  acc.totalEmployeePay += result.employeePay;
                } catch {
                  acc.totalPremium += Number(comp.premium) || 0;
                  acc.totalCompanyPay += Number(comp.companyPay) || 0;
                  acc.totalEmployeePay += Number(comp.employeePay) || 0;
                }
              }
            }
          } else {
            // Prefer the already-correct prorated columns saved on this choice — they equal
            // the raw premium whenever proration doesn't apply, so this is always safe. Using
            // comp.premium directly here was the bug: this flat (non-config-driven) branch never
            // multiplies per-life, so there's no double-counting risk in preferring the prorated
            // value, unlike the per-life branches above which resolve their own fresh amounts.
            const multiplier = isPPLComponent ? livesCount : 1;
            acc.totalPremium += (Number(comp.proratedPremium ?? comp.premium) || 0) * multiplier;
            acc.totalCompanyPay += (Number(comp.proratedCompanyPay ?? comp.companyPay) || 0) * multiplier;
            acc.totalEmployeePay += (Number(comp.proratedEmployeePay ?? comp.employeePay) || 0) * multiplier;
          }

          return acc;
        },
        newDependentsOnly
          ? {
              totalPremium: existingTotalPremium,
              totalCompanyPay: existingTotalCompanyPay,
              totalEmployeePay: existingTotalEmployeePay,
            }
          : { totalPremium: 0, totalCompanyPay: 0, totalEmployeePay: 0 }
      );

      const siBaseline =
        newDependentsOnly && existingSumInsured > 0 ? existingSumInsured : sum;
      enrollment.sumInsured = siBaseline;
      enrollment.totalPremium = totals.totalPremium;
      enrollment.totalCompanyPay = totals.totalCompanyPay;
      enrollment.totalEmployeePay = totals.totalEmployeePay;

      if (config) {
        const dependentsForSiBandMatch = newDependentsOnly
          ? newlyAddedDependents
          : activeDependents;

        const siEnhancement = resolveDependentCountSiEnhancement(
          config,
          dependentsForSiBandMatch,
          !newDependentsOnly
        );
        enrollment.sumInsured = siBaseline + siEnhancement;

        const daParams = (config.parameters ?? []).filter(
          (p: any) =>
            p.internalType === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE ||
            p.type?.toLowerCase() === DEPENDENT_ATTRIBUTE_INTERNAL_TYPE
        );
        // Only the newly added dependent(s)' DA premium is appended for an independent
        // addition — previously-known dependents' DA is already part of the
        // existingTotalPremium baseline above and must not be recomputed here.
        const dependentsForDaMatch = newDependentsOnly
          ? newlyAddedDependents
          : activeDependents;
        if (daParams.length > 0 && dependentsForDaMatch.length > 0) {
          const relationNameToTypeMap = new Map<string, string>();
          for (const rel of config.relationships?.enabledPolicyRelations ?? []) {
            for (const opt of rel.configuredOptions ?? []) {
              if (opt.name) {
                relationNameToTypeMap.set(
                  String(opt.name).toLowerCase().trim(),
                  rel.type ?? ""
                );
              }
            }
          }

          let daCompanyTotal = 0;
          let daEmployeeTotal = 0;
          for (const daParam of daParams) {
            const resolved = resolveDependentAttributePremium(
              dependentsForDaMatch as any[],
              daParam as DependentAttributeParam,
              undefined,
              relationNameToTypeMap
            );
            if (newDependentsOnly) {
              // Prorated by the same days-covered fraction as the new dependent(s)'
              // own premium above — mirrors calculateProratedPremiumsForEnrollment.
              const factor = prorationFactorFor(earliestNewDepDate);
              daCompanyTotal += resolved.companyAdditional * factor;
              daEmployeeTotal += resolved.employeeAdditional * factor;
            } else {
              daCompanyTotal += resolved.companyAdditional;
              daEmployeeTotal += resolved.employeeAdditional;
            }
          }

          enrollment.totalPremium = totals.totalPremium + daCompanyTotal + daEmployeeTotal;
          enrollment.totalCompanyPay = totals.totalCompanyPay + daCompanyTotal;
          enrollment.totalEmployeePay = totals.totalEmployeePay + daEmployeeTotal;
        }

        // Deletion refund (independent dependent deletion within this endorsement). No
        // diff/subtraction against a stored baseline: resolve the deleted life's own
        // premium at the band it was actually active under (bandIncludingDeleted),
        // prorated by ITS OWN applicable days (deletion date through policyTo), then
        // subtract from the running totals — mirrors the newlyAddedDependents addition
        // branch above, but as a subtraction, per the confirmed no-diff/resolve-and-prorate
        // model used throughout calculateProratedPremiumsForEnrollment/premium-calculator.
        if (deletedDependentRecords.length > 0) {
          let deletionPremium = 0;
          let deletionCompanyPay = 0;
          let deletionEmployeePay = 0;

          for (const comp of components) {
            const isPPLComponent = this.isPremiumPerLifeEnabled(comp.premiumPerLife);
            if (isPPLComponent && useConfigForDependents && empRecordForDependents) {
              for (const param of applyToDependentsParams) {
                for (const dep of deletedDependentRecords) {
                  const depLifeRecord = {
                    ...(dep as any),
                    additionalDetails: (dep as any).additionalAttributes,
                  };
                  const factor = prorationFactorFor((dep as any).deletedAt);
                  try {
                    const result = resolveDependentOnlyPremiumByConfiguration({
                      parameter: param,
                      dependent: depLifeRecord,
                      employee: empRecordForDependents,
                      baseOptionMeta: bandIncludingDeleted,
                      policyOptions: config.policyOptions ?? [],
                      componentId: comp.policyComponentActionTypeId ?? 0,
                      effectiveDate: (dep as any).effectiveDate ?? undefined,
                      sumInsuredId: resolveSumInsuredIdForValue(
                        config.components,
                        comp.policyComponentActionTypeId ?? 0,
                        comp.sumInsured
                      ),
                    });
                    deletionPremium += result.premium * factor;
                    deletionCompanyPay += result.companyPay * factor;
                    deletionEmployeePay += result.employeePay * factor;
                  } catch {
                    // no matching option for this dependent's own band — nothing to refund
                  }
                }
              }
            } else if (isPPLComponent) {
              for (const dep of deletedDependentRecords) {
                const factor = prorationFactorFor((dep as any).deletedAt);
                deletionPremium += (Number(comp.premium) || 0) * factor;
                deletionCompanyPay += (Number(comp.companyPay) || 0) * factor;
                deletionEmployeePay += (Number(comp.employeePay) || 0) * factor;
              }
            }
          }

          const siReduction = resolveDependentCountSiEnhancement(
            config,
            deletedDependentRecords,
            false
          );
          enrollment.sumInsured = Math.max(0, Number(enrollment.sumInsured) - siReduction);

          if (daParams.length > 0) {
            const relationNameToTypeMapForDeletion = new Map<string, string>();
            for (const rel of config.relationships?.enabledPolicyRelations ?? []) {
              for (const opt of rel.configuredOptions ?? []) {
                if (opt.name) {
                  relationNameToTypeMapForDeletion.set(
                    String(opt.name).toLowerCase().trim(),
                    rel.type ?? ""
                  );
                }
              }
            }
            const deletionFactor = prorationFactorFor(earliestDeletedDate);
            for (const daParam of daParams) {
              const resolved = resolveDependentAttributePremium(
                deletedDependentRecords as any[],
                daParam as DependentAttributeParam,
                undefined,
                relationNameToTypeMapForDeletion
              );
              deletionCompanyPay += resolved.companyAdditional * deletionFactor;
              deletionEmployeePay += resolved.employeeAdditional * deletionFactor;
              deletionPremium +=
                (resolved.companyAdditional + resolved.employeeAdditional) * deletionFactor;
            }
          }

          enrollment.totalPremium = Number(enrollment.totalPremium) - deletionPremium;
          enrollment.totalCompanyPay = Number(enrollment.totalCompanyPay) - deletionCompanyPay;
          enrollment.totalEmployeePay = Number(enrollment.totalEmployeePay) - deletionEmployeePay;
        }

        // Employee's own deletion refund (whole-employee/family deletion). Nothing
        // else in this function ever refunds the employee's own base premium/SI — the
        // deletion refund block above only covers dependents. Mirrors that same block
        // exactly, but for the employee's own life, resolved at bandIncludingDeleted
        // (the family band they were active under just before this deletion) and
        // prorated by their own deletion date.
        if (employeeDeletedAt) {
          let empDeletionPremium = 0;
          let empDeletionCompanyPay = 0;
          let empDeletionEmployeePay = 0;
          const empFactor = prorationFactorFor(employeeDeletedAt);

          for (const comp of components) {
            const isPPLComponent = this.isPremiumPerLifeEnabled(comp.premiumPerLife);
            if (isPPLComponent && useConfigForDependents && empRecordForDependents) {
              for (const param of applyToDependentsParams) {
                try {
                  const result = resolveDependentOnlyPremiumByConfiguration({
                    parameter: param,
                    dependent: empRecordForDependents,
                    employee: empRecordForDependents,
                    baseOptionMeta: bandIncludingDeleted,
                    policyOptions: config.policyOptions ?? [],
                    componentId: comp.policyComponentActionTypeId ?? 0,
                    effectiveDate: undefined,
                    sumInsuredId: resolveSumInsuredIdForValue(
                      config.components,
                      comp.policyComponentActionTypeId ?? 0,
                      comp.sumInsured
                    ),
                  });
                  empDeletionPremium += result.premium * empFactor;
                  empDeletionCompanyPay += result.companyPay * empFactor;
                  empDeletionEmployeePay += result.employeePay * empFactor;
                } catch {
                  // no matching option for the employee's own band — nothing to refund
                }
              }
            } else {
              // Flat (non-config-driven) component: whether per-life or family-shared,
              // the employee's own removal ends the whole family's coverage for it —
              // refund its full prorated share once (mirrors how the family-together
              // branch above charges it once per life / once per family).
              empDeletionPremium += (Number(comp.premium) || 0) * empFactor;
              empDeletionCompanyPay += (Number(comp.companyPay) || 0) * empFactor;
              empDeletionEmployeePay += (Number(comp.employeePay) || 0) * empFactor;
            }
          }

          // Base SI (not the dependent-count enhancement — the block above already
          // removed that). sumInsured is never prorated elsewhere in this codebase —
          // a coverage limit, not a time-based charge — so the full base tier is
          // refunded.
          const baseSiReduction = components.reduce(
            (sum, comp) => sum + (Number(comp.sumInsured) || 0),
            0
          );
          enrollment.sumInsured = Math.max(0, Number(enrollment.sumInsured) - baseSiReduction);

          enrollment.totalPremium = Number(enrollment.totalPremium) - empDeletionPremium;
          enrollment.totalCompanyPay = Number(enrollment.totalCompanyPay) - empDeletionCompanyPay;
          enrollment.totalEmployeePay = Number(enrollment.totalEmployeePay) - empDeletionEmployeePay;
        }

        // The lastPaid anchor is deliberately NOT refreshed here. It must keep the
        // PREVIOUS confirmed premium until updateEndorsementSummaryAfterEnrollment
        // has computed its delta (newNet - oldNet) after this transaction commits;
        // that util then writes the new anchor itself. Setting it to the new
        // totalPremium here made old === new on every edit, so deltaNet was always
        // 0 and endorsement totals never moved for any premium change.
        // Not seeded here either: a fresh enrollment starts at 0, which is the
        // correct oldNet for a first-time delta (0 -> X adds the full premium),
        // and the util writes the real anchor immediately afterwards.
      }

      enrollment.balance = enrollment.sumInsured;
      enrollment.employeeEnrollmentStatusKey = valueKey;
      if (valueKey === EMPLOYEE_ENROLLMENT_STATUS_ENROLLED) {
        if (!endorsementId) {
          const employeePolicyMap = await manager.findOne(
            PolicyEnrollmentEmployeePolicyMap,
            {
              where: { employeeId, policyId },
            }
          );

          if (employeePolicyMap?.enrollmentAdditionBatchId) {
            const documentProcessingFile = await manager.findOne(
              DocumentProcessingFile,
              {
                where: {
                  documentId: employeePolicyMap.enrollmentAdditionBatchId,
                },
              }
            );
            endorsementId = documentProcessingFile?.endorsementId ?? undefined;
          }
        }

        if(!newDependentsOnly){
          const record: Partial<PolicyEmployeeEndorsement> = {
            policyId,
            employeeId,
            companyId,
            employeeEndorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
            endorsementId: endorsementId,
          };
          const endorsementMap = manager.create(
            PolicyEmployeeEndorsement,
            record
          );
          await manager.save(endorsementMap);
        }

        // Prefer newlyAddedDependentIds — the reliable, freshly-computed "new to THIS
        // call" signal — over "additionEndorsementId IS NULL". A dependent added at
        // inception (before any Endorsement record exists) never gets a non-null
        // additionEndorsementId stamped at all, so that filter would ALSO match — and
        // overwrite — every inception dependent on the very next endorsement, corrupting
        // "new to this endorsement" for every downstream premium computation. Callers
        // that don't pass newlyAddedDependentIds (e.g. a plain self-enrollment
        // confirmation with no independent-dependent-addition tracking) keep the
        // original IsNull() scoping so their behavior is unchanged.
        if (newlyAddedDependentIds?.length) {
          await manager.update(
            PolicyEnrollmentDependent,
            { id: In(newlyAddedDependentIds) },
            {
              endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
              additionEndorsementId: endorsementId,
            }
          );
        } else if (!newlyAddedDependentIds) {
          await manager.update(
            PolicyEnrollmentDependent,
            { policyId, employeeId, additionEndorsementId: IsNull() },
            {
              endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
              additionEndorsementId: endorsementId,
            }
          );
        }
      }

      return await manager.save(enrollment);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "updateEnrollmentStatus",
          payload: { policyId, employeeId, companyId, valueKey },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to update enrollment status"
      );
    }
  }

  async createEndorsementTemplateDocMap(
    policyId: number,
    insurerId: number,
    documentId: number
  ): Promise<void> {
    const map = this.endorsementTemplateRepo.create({
      policyId,
      insurerId,
      documentId,
    });
    await this.endorsementTemplateRepo.save(map);
  }

  async findEndorsementTemplateDocMap(
    policyId: number,
    insurerId: number
  ): Promise<PolicyEndorsementTemplateDocMap | null> {
    return this.endorsementTemplateRepo.findOne({
      where: { policyId, insurerId },
    });
  }

  async getExistingEndorsementsCount(policyId: number): Promise<number> {
    const count = await this.endorsementRepo.count({
      where: { policyId: policyId },
    });
    return count;
  }

  async getEndorsementFieldMapping(
    insurerId: number
  ): Promise<EndorsementFieldMapping | null> {
    return this.endorsementFieldMapRepo.findOne({ where: { insurerId } });
  }

  async saveEndorsementFieldMapping(
    insurerId: number,
    fieldMap: Record<string, string>
  ): Promise<EndorsementFieldMapping> {
    let mapping = await this.endorsementFieldMapRepo.findOne({
      where: { insurerId },
    });
    if (mapping) {
      mapping.fieldMap = fieldMap;
    } else {
      mapping = this.endorsementFieldMapRepo.create({ insurerId, fieldMap });
    }
    return this.endorsementFieldMapRepo.save(mapping);
  }

  async getFileUploadById(id: number): Promise<FileUpload | null> {
    return this.fileUploadRepository.findOne({ where: { id } });
  }

  async getFileUploadsByIds(ids: number[]): Promise<FileUpload[]> {
    if (!ids.length) {
      return [];
    }

    return this.fileUploadRepository.find({
      where: { id: In(ids) },
      relations: ["createdByUser"],
    });
  }

  async getDocumentProcessingFileEntry(
    documentId: number,
    policyId: number
  ): Promise<DocumentProcessingFile | null> {
    return this.uploadRepo.findOne({
      where: { entityId: policyId, documentId: documentId },
    });
  }

  async updateDocumentEntryStatus(
    documentProcessingFile: DocumentProcessingFile,
    status: string
  ): Promise<void> {
    Object.assign(documentProcessingFile, { processStatus: status });
    await this.uploadRepo.save(documentProcessingFile);
  }

  async checkInProgressEnrollments(policyId: number): Promise<boolean> {
    const count = await this.uploadRepo.count({
      where: {
        processStatus: DOCUMENT_PROCESS_STATUS.PROCESSING,
        documentType: DOCUMENT_TYPE_POLICY_EMPLOYEE_ENROLLMENT_DATA,
        entityId: policyId,
      },
    });
    return count > 0;
  }

  /**
   * Pushes enrollment_end_date forward for every document_processing_file row
   * in periodIds (validated against companyId via its endorsement), and for
   * every employee's matching row in policy_enrollment_employee_policy_map
   * (matched by enrollment_addition_batch_id = document_id + policy_id).
   * Runs inside a single transaction so partial updates can't happen.
   */
  async extendEnrollmentPeriod(
    companyId: number,
    periodIds: number[],
    newEndDate: Date,
  ): Promise<{ updatedPeriods: number; updatedEmployeeMappings: number }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeRepository",
        method: "extendEnrollmentPeriod",
        payload: { companyId, periodIds, newEndDate },
        messageData: "method invoked",
      }),
    });

    try {
      return await this.dataSource.transaction(async (manager) => {
        const dpfRows = await manager.find(DocumentProcessingFile, {
          where: { id: In(periodIds) },
        });

        if (dpfRows.length !== periodIds.length) {
          throw new NotFoundException("One or more enrollment periods were not found");
        }

        const endorsementIds = [...new Set(dpfRows.map((d) => d.endorsementId))];
        const endorsements = await manager.find(Endorsement, {
          where: { id: In(endorsementIds) },
        });
        const endorsementById = new Map(endorsements.map((e) => [e.id, e]));

        // The window may be shortened as well as lengthened — the only floor is
        // that the new end date is in the future. Anchored to today rather than to each period's
        // current end date, so a stale table can't offer a date the server then
        // rejects. Built as a UTC midnight to match how `newEndDate` is parsed
        // from a "YYYY-MM-DD" body, but from the server's local Y/M/D so "today"
        // means today where the business operates, not in UTC.
        const now = new Date();
        const today = new Date(
          Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
        );
        if (newEndDate <= today) {
          throw new BadRequestException(
            `New end date (${newEndDate.toISOString().slice(0, 10)}) must be a future date`,
          );
        }

        for (const dpf of dpfRows) {
          const endorsement = endorsementById.get(dpf.endorsementId);
          if (!endorsement || endorsement.companyId !== companyId) {
            throw new ForbiddenException(
              `Enrollment period ${dpf.id} does not belong to company ${companyId}`,
            );
          }
        }

        await manager.update(
          DocumentProcessingFile,
          { id: In(periodIds) },
          { enrollmentEndDate: newEndDate },
        );

        let updatedEmployeeMappings = 0;
        for (const dpf of dpfRows) {
          const endorsement = endorsementById.get(dpf.endorsementId)!;
          const result = await manager.update(
            PolicyEnrollmentEmployeePolicyMap,
            {
              enrollmentAdditionBatchId: dpf.documentId,
              policyId: endorsement.policyId,
              deletedAt: IsNull(),
            },
            { enrollmentEndDate: newEndDate },
          );
          updatedEmployeeMappings += result.affected ?? 0;
        }

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "CompanyEmployeeRepository",
            method: "extendEnrollmentPeriod",
            payload: { companyId, periodIds, updatedEmployeeMappings },
            messageData: "Enrollment period(s) extended successfully",
          }),
        });

        return { updatedPeriods: dpfRows.length, updatedEmployeeMappings };
      });
    } catch (error) {
      console.log("error in repporistory", error)
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          method: "extendEnrollmentPeriod",
          payload: { companyId, periodIds, newEndDate },
          status: "failure",
          location: "CompanyEmployeeRepository",
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to extend enrollment period"
      );
    }
  }

  async getPolicyConfigurationByPolicyId(
    policyId: number
  ): Promise<PolicyConfiguration | null> {
    const liveStatus = await this.lookUpRepository.findOne({
      where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
    });
    if (!liveStatus) {
      throw new NotFoundException(
        `Status lookup not found for key ${POLICY_CONFIGURATION_STATUS_LIVE}`
      );
    }

    const config = await this.policyConfigurationRepo.findOne({
      where: {
        policyId: policyId,
        policyConfiguartionStatusLid: liveStatus.id,
      },
    });
    if (!config) {
      throw new NotFoundException(
        `Approved policy configuration not found for policy ID ${policyId}`
      );
    }
    return config;
  }

  async listPolicyEmployeeEnrollments(
    policyId: number
  ): Promise<PolicyEmployeeEnrollment[]> {
    return this.employeeEnrollmentRepo.find({
      where: { policyId },
      relations: ["employee", "employee.dependents", "components"],
    });
  }

  async startEnrollmentProcess(
    validatedEmployeeDataFromExcel: ValidatedEnrollmentProcessingResult,
    policyId: number,
    options: { companyId: number; endorsementId?: number }
  ): Promise<StartEnrollmentProcessResult> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeRepository",
        method: "startEnrollmentProcess",
        payload: { policyId, companyId: options.companyId },
        messageData: "Processing validated enrollment records",
      }),
    });

    try {
      const appendRemark = (
        row: Record<string, any> | undefined,
        remark: string
      ) => {
        if (!row) {
          return;
        }
        if (row["Remarks"]) {
          row["Remarks"] = `${row["Remarks"]}; ${remark}`;
        } else {
          row["Remarks"] = remark;
        }
      };

      const toDateOrNull = (value?: Date | string | null): Date | null => {
        if (!value) {
          return null;
        }
        if (value instanceof Date) {
          return value;
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      };

      const employees = validatedEmployeeDataFromExcel.employees ?? [];
      const normalizedDeletionType = DATA_INTAKE_TYPE.DELETION.toLowerCase();

      const isDependentOnlyEmployee = (
        employee: EmployeeWithDependentsData
      ): boolean => {
        const flag: any = employee?.isDependentOnly;
        if (typeof flag === "boolean") {
          return flag;
        }
        if (typeof flag === "string") {
          const normalized = flag.trim().toLowerCase();
          return (
            normalized === "true" ||
            normalized === "1" ||
            normalized === "yes" ||
            normalized === "y"
          );
        }
        if (typeof flag === "number") {
          return flag === 1;
        }
        return false;
      };

      const additionRows = employees.filter(
        (employee) =>
          (employee.intakeType ?? "").toLowerCase() !== normalizedDeletionType
      );
      const dependentOnlyRows = additionRows.filter(isDependentOnlyEmployee);
      const additionRowsToProcess = additionRows.filter(
        (employee) => !isDependentOnlyEmployee(employee)
      );
      const deletionRows = employees.filter(
        (employee) =>
          (employee.intakeType ?? "").toLowerCase() === normalizedDeletionType
      );

      const invalidEmployees: EmployeeWithDependentsData[] = [
        ...(validatedEmployeeDataFromExcel.invalidEmployees ?? []),
      ];
      const validEmployees: EmployeeWithDependentsData[] = [];
      const deletionRecords: EnrollmentDeletionRecord[] = [];

      for (const employee of additionRowsToProcess) {
        const companyEmployee =
          employee.companyEmployee ?? (employee.companyEmployee = {});
        const employeeCompanyId =
          companyEmployee.employeeCompanyId ??
          (options.companyId ? String(options.companyId) : undefined);

        if (!employeeCompanyId) {
          const remark = "Employee company identifier is missing.";
          appendRemark(employee.rowObj, remark);
          employee.hasError = true;
          invalidEmployees.push(employee);
          continue;
        }

        const contactEmail = companyEmployee.email
          ? String(companyEmployee.email).trim()
          : undefined;
        const contactPhone = companyEmployee.phoneNumber
          ? String(companyEmployee.phoneNumber).trim()
          : undefined;

        // if (!contactEmail && !contactPhone) {
        //   const remark = "Employee email or phone number is required.";
        //   appendRemark(employee.rowObj, remark);
        //   employee.hasError = true;
        //   invalidEmployees.push(employee);
        //   continue;
        // }

        try {
          const { employeeId, userId } = await this.dataSource.transaction(
            async (manager) => {
              const userRepo = manager.getRepository(User);
              const employeeRepo = manager.getRepository(
                PolicyEnrollmentEmployee
              );
              const mapRepo = manager.getRepository(
                PolicyEnrollmentEmployeePolicyMap
              );

              const normalizedEmail = contactEmail
                ? contactEmail.toLowerCase()
                : undefined;
              const normalizedPhone = contactPhone ?? undefined;

              let user = await this.findUserByEmailOrPhone(
                { email: normalizedEmail, phone: normalizedPhone },
                manager
              );

              if (user) {
                const promoted = await this.ensureCompanyAndIirmAssociation(
                  user,
                  manager
                );
                if (promoted) {
                  user.userTypeKey =
                    USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE;
                }
              } else {
                const name =
                  (companyEmployee.employeeName || "Employee").trim() ||
                  "Employee";
                const [firstName, ...rest] = name.split(/\s+/);
                const lastName = rest.join(" ") || firstName;
                const generatedPhone =
                  normalizedPhone ??
                  `${Date.now()}${Math.floor(Math.random() * 10)}`;
                const generatedEmail =
                  normalizedEmail ?? `${generatedPhone}@noreply`;
                const trimmedCompanyIdentifier = options.companyId
                  ? String(options.companyId).trim()
                  : companyEmployee.employeeCompanyId
                  ? String(companyEmployee.employeeCompanyId).trim()
                  : "company";
                const trimmedEmployeeIdentifier =
                  companyEmployee.companyEmployeeId !== undefined &&
                  companyEmployee.companyEmployeeId !== null
                    ? String(companyEmployee.companyEmployeeId).trim()
                    : "";
                const fallbackIdentifierBase =
                  trimmedEmployeeIdentifier ||
                  (companyEmployee.employeeCompanyId !== undefined &&
                  companyEmployee.employeeCompanyId !== null
                    ? String(companyEmployee.employeeCompanyId).trim()
                    : normalizedPhone ?? generatedPhone);
                const fallbackIdentifier =
                  (fallbackIdentifierBase || "").toString().trim() ||
                  "employee";
                const loginName = `${trimmedCompanyIdentifier}-${fallbackIdentifier}`;
                const password = await bcrypt.hash(fallbackIdentifier, 10);

                const newUser = userRepo.create({
                  salutationLid: 3502,
                  firstName,
                  lastName,
                  emailId: generatedEmail,
                  mobile: generatedPhone,
                  loginName,
                  password,
                  ibpPassword:null,
                  isPasswordSet: false,
                  reportingUserId: 0,
                  userTypeKey: USER_TYPE_COMPANY_EMPLOYEE,
                  userStatusKey: USER_STATUS_ACTIVE,
                  organisationId: options.companyId ?? 0,
                  branchId: 0,
                  sbuId: 0,
                  verticalId: 0,
                  departmentId: 0,
                  designationId: 0,
                  createdBy: 0,
                  updatedBy: 0,
                });

                user = await manager.save(newUser);
              }

              if (!user?.userId) {
                throw new Error("USER_NOT_FOUND_OR_CREATED");
              }

              const roleRepo = manager.getRepository(Role);
              const userRoleRepo = manager.getRepository(UserRole);
              let role = await roleRepo.findOne({
                where: { roleKey: COMPANY_EMPLOYEE_ROLE_KEY },
              });
              if (!role) {
                role = await roleRepo.save(
                  roleRepo.create({
                    name: "Company Employee",
                    description: "Company Employee",
                    createdBy: "system",
                    updatedBy: "system",
                    roleKey: COMPANY_EMPLOYEE_ROLE_KEY,
                  })
                );
              }
              if (role?.id) {
                const existingUserRole = await userRoleRepo.findOne({
                  where: { userId: user.userId, roleId: role.id },
                });
                if (!existingUserRole) {
                  await userRoleRepo.save(
                    userRoleRepo.create({
                      userId: user.userId,
                      roleId: role.id,
                    })
                  );
                }
              }

              let employeeEntity = await employeeRepo.findOne({
                where: {
                  userId: user.userId,
                  employeeCompanyId: employeeCompanyId,
                },
              });

              if (!employeeEntity) {
                employeeEntity = employeeRepo.create({
                  ...companyEmployee,
                  employeeCompanyId,
                  userId: user.userId,
                  email: companyEmployee.email ?? user.emailId,
                  phoneNumber: companyEmployee.phoneNumber ?? user.mobile,
                  fullName:
                    companyEmployee.fullName ??
                    companyEmployee.employeeName ??
                    `${user.firstName} ${user.lastName}`.trim(),
                  createdBy: companyEmployee.createdBy ?? 0,
                  updatedBy: companyEmployee.updatedBy ?? 0,
                });

                employeeEntity = await manager.save(employeeEntity);
              }

              const existingMap = await mapRepo
                .createQueryBuilder("map")
                .withDeleted()
                .where("map.employee_id = :employeeId", {
                  employeeId: employeeEntity.id,
                })
                .andWhere("map.policy_id = :policyId", { policyId })
                .getOne();

              if (existingMap) {
                throw new Error("EMPLOYEE_ALREADY_MAPPED");
              }

              const mapEntity = mapRepo.create({
                employeeId: employeeEntity.id,
                policyId,
                enrollmentStartDate: toDateOrNull(
                  employee.enrollmentStartDate ?? null
                ),
                enrollmentEndDate: toDateOrNull(
                  employee.enrollmentEndDate ?? null
                ),
                effectiveDate: toDateOrNull(employee.effectiveDate ?? null),
                additionalParams: employee.additionalParams ?? {},
              });
              await manager.save(mapEntity);

              return { employeeId: employeeEntity.id, userId: user.userId };
            }
          );

          companyEmployee.employeeCompanyId = employeeCompanyId;
          companyEmployee.userId = userId;
          companyEmployee.id = employeeId;
          validEmployees.push(employee);
        } catch (error) {
          const isMappedError =
            error instanceof Error &&
            error.message === "EMPLOYEE_ALREADY_MAPPED";
          const remark = isMappedError
            ? "Employee already mapped to the policy."
            : "Failed to process employee enrollment.";
          appendRemark(employee.rowObj, remark);
          employee.hasError = true;
          invalidEmployees.push(employee);
          if (!isMappedError && error instanceof Error) {
            this.logger.error({
              level: "error",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "failure",
                location: "CompanyEmployeeRepository",
                method: "startEnrollmentProcess",
                payload: {
                  policyId,
                  companyId: options.companyId,
                  employeeCompanyId,
                },
                messageData: error,
              }),
            });
          }
        }
      }

      if (deletionRows.length) {
        const delEmpIds = Array.from(
          new Set(
            deletionRows
              .map((row) => row.companyEmployee?.companyEmployeeId)
              .filter(
                (value): value is string | null | undefined =>
                  value !== undefined && value !== null && value !== ""
              )
              .map((value) => String(value))
          )
        );
        const delPhones = Array.from(
          new Set(
            deletionRows
              .map((row) => row.companyEmployee?.phoneNumber)
              .filter(
                (value): value is string | undefined =>
                  value !== undefined && value !== null && value !== ""
              )
              .map((value) => String(value))
          )
        );
        const delEmails = Array.from(
          new Set(
            deletionRows
              .map((row) => row.companyEmployee?.email)
              .filter(
                (value): value is string => !!value && value.trim() !== ""
              )
              .map((value) => value.toLowerCase())
          )
        );

        const employeeByKey = new Map<string, PolicyEnrollmentEmployee>();
        const pushEmployeeKeys = (employee: PolicyEnrollmentEmployee) => {
          if (employee.companyEmployeeId) {
            employeeByKey.set(String(employee.companyEmployeeId), employee);
          }
          if (employee.phoneNumber) {
            employeeByKey.set(`ph_${employee.phoneNumber}`, employee);
          }
          if (employee.email) {
            employeeByKey.set(`em_${employee.email.toLowerCase()}`, employee);
          }
        };

        if (delEmpIds.length) {
          const employeesById = await this.companyEmployeeRepository.find({
            where: { companyEmployeeId: In(delEmpIds) },
          });
          employeesById.forEach(pushEmployeeKeys);
        }
        if (delPhones.length) {
          const employeesByPhone = await this.companyEmployeeRepository.find({
            where: { phoneNumber: In(delPhones) },
          });
          employeesByPhone.forEach(pushEmployeeKeys);
        }
        if (delEmails.length) {
          const employeesByEmail = await this.companyEmployeeRepository.find({
            where: { email: In(delEmails) },
          });
          employeesByEmail.forEach(pushEmployeeKeys);
        }

        const uniqueEmployeeIds = Array.from(
          new Set(Array.from(employeeByKey.values()).map((emp) => emp.id))
        );

        const existingMaps = uniqueEmployeeIds.length
          ? await this.employeePolicyMapRepo.find({
              where: {
                employeeId: In(uniqueEmployeeIds),
                policyId,
              },
            })
          : [];

        const mapByEmployeeId = new Map<
          number,
          PolicyEnrollmentEmployeePolicyMap
        >();
        existingMaps.forEach((map) => {
          mapByEmployeeId.set(map.employeeId, map);
        });

        const mapIdsToDelete = new Set<number>();
        const employeeIdsToDelete = new Set<number>();

        for (const row of deletionRows) {
          const keyId = row.companyEmployee?.companyEmployeeId
            ? String(row.companyEmployee.companyEmployeeId)
            : undefined;
          const keyEmail = row.companyEmployee?.email
            ? `em_${String(row.companyEmployee.email).toLowerCase()}`
            : undefined;
          const keyPhone = row.companyEmployee?.phoneNumber
            ? `ph_${String(row.companyEmployee.phoneNumber)}`
            : undefined;

          const matchedEmployee =
            (keyId && employeeByKey.get(keyId)) ||
            (keyEmail && employeeByKey.get(keyEmail)) ||
            (keyPhone && employeeByKey.get(keyPhone));

          if (!matchedEmployee) {
            const remark = "Employee not found for deletion.";
            appendRemark(row.rowObj, remark);
            deletionRecords.push({
              rowNumber: row.rowNumber,
              row: row.rowObj,
              remarks: row.rowObj?.["Remarks"] ?? remark,
            });
            continue;
          }

          const map = mapByEmployeeId.get(matchedEmployee.id);
          if (!map) {
            const remark = "Employee is not mapped to the policy.";
            appendRemark(row.rowObj, remark);
            deletionRecords.push({
              rowNumber: row.rowNumber,
              row: row.rowObj,
              remarks: row.rowObj?.["Remarks"] ?? remark,
            });
            continue;
          }

          mapIdsToDelete.add(map.id);
          employeeIdsToDelete.add(map.employeeId);
          // const remark = "Deleted";
          // appendRemark(row.rowObj, remark);
          // deletionRecords.push({
          //   rowNumber: row.rowNumber,
          //   row: row.rowObj,
          //   remarks: row.rowObj?.["Remarks"] ?? remark,
          // });

          // if (Array.isArray(row.dependentRows)) {
          //   for (const dependentRow of row.dependentRows) {
          // appendRemark(dependentRow, remark);
          // deletionRecords.push({
          //   rowNumber: row.rowNumber,
          //   row: dependentRow,
          //   remarks: dependentRow?.["Remarks"] ?? remark,
          // });
          // }
          // }
        }

        if (mapIdsToDelete.size) {
          await this.dataSource.transaction(async (manager) => {
            const now = new Date();
            const mapIds = Array.from(mapIdsToDelete);
            await manager.update(
              PolicyEnrollmentEmployeePolicyMap,
              { id: In(mapIds) },
              {
                deletedAt: now,
                endorsementDeletionBatchId: options.endorsementId ?? null,
              }
            );

            if (employeeIdsToDelete.size) {
              const employeeIds = Array.from(employeeIdsToDelete);
              await manager.update(
                PolicyEnrollmentDependent,
                { employeeId: In(employeeIds), policyId },
                {
                  deletedAt: now,
                  deletionEndorsementId: options.endorsementId ?? null,
                  endorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
                }
              );
              await manager.update(
                PolicyEmployeeEnrollment,
                { employeeId: In(employeeIds), policyId },
                { deletedAt: now }
              );

              await manager.update(
                PolicyEmployeeEndorsement,
                { employeeId: In(employeeIds), policyId },
                {
                  employeeEndorsementStatusKey: EMPLOYEE_ENDORSEMENT_READY,
                  deletionEndorsementId: options.endorsementId ?? null,
                }
              );
            }
          });
        }
      }

      const validatedEmployeeRecords: ValidatedEnrollmentProcessingResult = {
        employees: [...validEmployees, ...dependentOnlyRows],
        dependentsWithoutEmployee:
          validatedEmployeeDataFromExcel.dependentsWithoutEmployee ?? [],
        invalidEmployees,
      };

      return { validatedEmployeeRecords, deletionRecords };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "startEnrollmentProcess",
          payload: { policyId, companyId: options.companyId },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to process enrollment records"
      );
    }
  }

  async getCompanyEmployeeByCompanyEmployeeId(
    companyEmployeeId: string
  ): Promise<PolicyEnrollmentEmployee | null> {
    if (!companyEmployeeId) {
      return null;
    }
    try {
      const employee = await this.companyEmployeeRepository.findOne({
        where: { companyEmployeeId, deletedAt: IsNull() },
      });
      return employee ?? null;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch employee by company employee id"
      );
    }
  }

  async getCompanyEmployeeByEmployeeIdAndCompany(
    employeeId: string,
    companyId: number
  ): Promise<PolicyEnrollmentEmployee | null> {
    if (!employeeId) {
      return null;
    }
    try {
      const employee = await this.companyEmployeeRepository.findOne({
        where: {
          companyEmployeeId: employeeId,
          companyId: companyId,
          deletedAt: IsNull(),
        },
      });
      return employee ?? null;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch employee by company employee id"
      );
    }
  }

  async finalizeEnrollmentProcess(
    options: FinalizeEnrollmentProcessOptions
  ): Promise<PolicyEnrollmentUploadSummary> {
    const {
      documentProcessingFileId,
      policyId,
      sourceFile,
      summary,
      successFileKey,
      errorFileKey,
      endorsementId,
    } = options;

    const createFileUploadRecord = async (
      fileKey?: string | null
    ): Promise<number | null> => {
      if (!fileKey) {
        return null;
      }

      const record = this.fileUploadRepository.create({
        fileKey,
        entityType: sourceFile.entityType,
        entityId: sourceFile.entityId,
        uploadType: sourceFile.uploadType ?? "AWS",
        documentTypeLid: sourceFile.documentTypeLid,
        createdBy: sourceFile.createdBy ?? 0,
        updatedBy: sourceFile.updatedBy ?? 0,
        policyId: sourceFile.policyId ?? policyId,
      });
      const saved = await this.fileUploadRepository.save(record);
      return saved.id;
    };

    try {
      const [errorFileId, successFileId] = await Promise.all([
        createFileUploadRecord(errorFileKey),
        createFileUploadRecord(successFileKey),
      ]);

      const summaryRecord = this.enrollmentSummaryRepo.create({
        documentProcessingFileId,
        policyId,
        sourceFileUploadId: sourceFile.id,
        errorFileUploadId: errorFileId,
        successFileUploadId: successFileId,
        successCount: summary.successCount,
        errorCount: summary.errorCount,
        processCount: summary.processCount,
        endorsementId: endorsementId,
        batchId: documentProcessingFileId,
      });

      const savedSummary = await this.enrollmentSummaryRepo.save(summaryRecord);

      await this.dataSource
        .getRepository(DocumentProcessingFile)
        .update(documentProcessingFileId, {
          processStatus: DOCUMENT_PROCESS_STATUS.COMPLETED,
        });

      return savedSummary;
    } catch (error) {
      await this.uploadRepo.update(documentProcessingFileId, {
        processStatus: DOCUMENT_PROCESS_STATUS.FAILED,
      });
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "finalizeEnrollmentProcess",
          payload: {
            policyId,
            documentProcessingFileId,
            sourceFileUploadId: sourceFile.id,
          },
          messageData: error,
        }),
      });
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to finalize enrollment process"
      );
    }
  }

  private async findUserByEmailOrPhone(
    params: { email?: string | null; phone?: string | null },
    manager?: EntityManager
  ): Promise<User | null> {
    const userRepository = manager?.getRepository(User) ?? this.userRepository;
    const email = params.email?.trim();
    const phone = params.phone?.trim();

    if (email) {
      const user = await userRepository.findOne({
        where: { emailId: email.toLowerCase(), deletedAt: IsNull() },
      });
      if (user) {
        return user;
      }
    }

    if (phone) {
      const user = await userRepository.findOne({
        where: { mobile: phone, deletedAt: IsNull() },
      });
      if (user) {
        return user;
      }
    }

    return null;
  }

  private async ensureCompanyAndIirmAssociation(
    user: User,
    manager?: EntityManager
  ): Promise<boolean> {
    if (!user?.userId) {
      return false;
    }

    const userRepository = manager?.getRepository(User) ?? this.userRepository;
    const roleRepository = manager?.getRepository(Role) ?? this.roleRepository;
    const userRoleRepository =
      manager?.getRepository(UserRole) ?? this.userRoleRepository;

    const persistedUser = await userRepository.findOne({
      where: { userId: user.userId, deletedAt: IsNull() },
      ...(manager ? { lock: { mode: "pessimistic_write" as const } } : {}),
    });

    if (!persistedUser) {
      return false;
    }

    const currentType = persistedUser.userTypeKey?.trim();
    const shouldPromote = currentType === USER_TYPE_IIRM_EMPLOYEE;
    const alreadyCombined =
      currentType === USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE;

    if (!shouldPromote && !alreadyCombined) {
      return false;
    }

    if (!alreadyCombined) {
      const updatedBy =
        persistedUser.updatedBy !== undefined
          ? persistedUser.updatedBy
          : user.updatedBy ?? 0;
      Object.assign(persistedUser, {
        userTypeKey: USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
        updatedBy,
      });
      await userRepository.save(persistedUser);
    }

    let role = await roleRepository.findOne({
      where: { roleKey: USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE },
      ...(manager ? { lock: { mode: "pessimistic_read" as const } } : {}),
    });

    if (!role) {
      const roleEntity = roleRepository.create({
        name: "Company & IIRM Employee",
        description: "Company & IIRM Employee",
        createdBy: "system",
        updatedBy: "system",
        roleKey: USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE,
      });
      role = await roleRepository.save(roleEntity);
    }

    if (role) {
      const existingMapping = await userRoleRepository.findOne({
        where: { userId: persistedUser.userId, roleId: role.id },
      });

      if (!existingMapping) {
        const mapping = userRoleRepository.create({
          userId: persistedUser.userId,
          roleId: role.id,
        });
        try {
          await userRoleRepository.insert(mapping);
        } catch (error) {
          if (
            !(error instanceof QueryFailedError) ||
            error.driverError?.code !== "23505"
          ) {
            throw error;
          }
        }
      }
    }

    if (user.userTypeKey !== persistedUser.userTypeKey) {
      user.userTypeKey = persistedUser.userTypeKey;
    }

    return true;
  }

  private isPremiumPerLifeEnabled(value: any): boolean {
    if (typeof value === DATA_TYPES.BOOLEAN) {
      return value;
    }
    if (typeof value === DATA_TYPES.NUMBER) {
      return value === 1;
    }
    if (typeof value === DATA_TYPES.STRING) {
      const normalized = value.trim().toLowerCase();
      return [BOOLEAN_VALUES.TRUE, DEFAULT_PAGE, "yes"].includes(normalized);
    }
    return false;
  }

  async getEmployeeFaqs(
    employeeId: number,
    category?: string,
    search?: string,
    page: number = DEFAULT_PAGE,
    limit: number = DEFAULT_LIMIT
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeRepository",
        method: "getEmployeeFaqs",
        payload: { employeeId, category, search, page, limit },
        messageData: "method invoked",
      }),
    });

    try {
      // First, get all policy IDs mapped to the employee
      const employeePolicyMaps = await this.employeePolicyMapRepo.find({
        where: {
          employeeId,
        },
        select: ["policyId"],
      });

      if (employeePolicyMaps.length === 0) {
        return {
          faqs: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
          availableCategories: [],
          sourcePolicyIds: [],
          total: 0,
        };
      }

      const policyIds = employeePolicyMaps.map((map) => map.policyId);

      // Build the FAQ query
      const queryBuilder = this.dataSource
        .getRepository("PolicyFaq")
        .createQueryBuilder("pf")
        .leftJoinAndSelect("pf.policy", "p")
        .where("pf.policyId IN (:...policyIds)", { policyIds })
        .andWhere("pf.isActive = :isActive", { isActive: true });

      // Add category filter if provided
      if (category && category.trim().toLowerCase() !== "all") {
        queryBuilder.andWhere("LOWER(pf.category) = LOWER(:category)", {
          category: category.trim(),
        });
      }

      // Add search filter if provided
      if (search && search.trim()) {
        queryBuilder.andWhere(
          "(LOWER(pf.question) LIKE LOWER(:search) OR LOWER(pf.answer) LIKE LOWER(:search))",
          { search: `%${search.trim()}%` }
        );
      }

      // Get total count for pagination
      const totalCount = await queryBuilder.getCount();

      // Apply pagination and get results
      const faqs = await queryBuilder
        .orderBy("pf.category", "ASC")
        .addOrderBy("pf.id", "ASC")
        // .skip((page - DEFAULT_PAGE) * limit)
        // .take(limit)
        .getMany();

      // Get available categories for all FAQs (without pagination)
      const categoriesQuery = this.dataSource
        .getRepository("PolicyFaq")
        .createQueryBuilder("pf")
        .leftJoin("pf.policy", "p")
        .select("DISTINCT pf.category", "category")
        .where("pf.policyId IN (:...policyIds)", { policyIds })
        .andWhere("pf.isActive = :isActive", { isActive: true })
        .orderBy("pf.category", "ASC");

      const categoriesResult = await categoriesQuery.getRawMany();
      const availableCategories = categoriesResult.map(
        (result) => result.category
      );

      // Transform the results
      const transformedFaqs = faqs.map((faq: any) => ({
        id: faq.id,
        policyId: faq.policyId,
        policyName: faq.policy?.policyName || "Unknown Policy",
        category: faq.category,
        question: faq.question,
        answer: faq.answer,
        displayOrder: faq.id, // Using id as display order
        createdAt: faq.createdAt?.toISOString() || new Date().toISOString(),
      }));

      return {
        faqs: transformedFaqs,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
        availableCategories,
        sourcePolicyIds: policyIds,
        total: totalCount,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getEmployeeFaqs",
          payload: { employeeId, category, search, page, limit },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getPolicyEmployeeInsuredDetailsById(
    policyId: number,
    page: number,
    limit: number,
    relationshipGroup?: string,
    claimStatus?: string,
    effectiveFrom?: string,
    effectiveTo?: string,
    searchBy?: string,
    employeeId?: string,
    sort?: { field: string; order: "ASC" | "DESC" }[]
  ): Promise<{ data: any[]; count: number }> {
    return getPolicyEmployeeInsuredDetailsFromRepository({
      policyRepository: this.policyRepository,
      employeePolicyMapRepo: this.employeePolicyMapRepo,
      employeeRepo: this.companyEmployeeRepository,
      dependentRepo: this.dependentRepo,
      employeeEnrollmentRepo: this.employeeEnrollmentRepo,
      policyId,
      page,
      limit,
      relationshipGroup,
      claimStatus,
      effectiveFrom,
      effectiveTo,
      searchBy,
      employeeId,
      sort,
      logger: this.logger,
      traceIdService: this.traceIdService,
      location: "CompanyEmployeeRepository",
      method: "getPolicyEmployeeInsuredDetailsById",
    });
  }

  async searchHospitals(
    policyId: number,
    searchParams: any,
    userId: number
  ): Promise<{
    data: MstrHospital[];
    count: number;
    networkHospitalCount: number;
    excludedHospitalCount: number;
  }> {
    return searchHospitalsWithFilters({
      hospitalRepository: this.hospitalRepository,
      policyIds: [policyId],
      searchParams,
      logger: this.logger,
      traceIdService: this.traceIdService,
      repositoryName: "CompanyEmployeeRepository",
    });
  }

  async searchHospitalsByPolicyIds(
    policyIds: number[],
    searchParams: any,
    userId: number
  ): Promise<{
    data: MstrHospital[];
    count: number;
    networkHospitalCount: number;
    excludedHospitalCount: number;
  }> {
    return searchHospitalsWithFilters({
      hospitalRepository: this.hospitalRepository,
      policyIds,
      searchParams,
      logger: this.logger,
      traceIdService: this.traceIdService,
      repositoryName: "CompanyEmployeeRepository",
    });
  }

  async exportHospitalsToExcel(
    policyId: number,
    searchParams: SearchHospitalDto,
    userId: number
  ): Promise<{ data: MstrHospital[]; networkHospitalCount: number; excludedHospitalCount: number }> {
    return exportHospitalsWithFilters({
      hospitalRepository: this.hospitalRepository,
      policyId,
      searchParams,
      logger: this.logger,
      traceIdService: this.traceIdService,
      repositoryName: "CompanyEmployeeRepository",
    });
  }

  async createOrMapPolicyHospital(args: {
    policyId: number;
    userId: number;
    hospitalName: string;
    addressLine1: string;
    addressLine2?: string;
    landmark?: string;
    city: string;
    state: string;
    country?: string;
    pinCode?: string;
    code?: string;
    email?: string;
    phoneNumber?: string;
    isNetworkHospital: boolean;
  }): Promise<CreatePolicyHospitalResponseDto> {
    const normalize = (value: string) => value.trim().toLowerCase();

    const normalizedName = normalize(args.hospitalName);
    const normalizedAddressLine1 = normalize(args.addressLine1);
    const normalizedCity = normalize(args.city);
    const normalizedState = normalize(args.state);

    return this.dataSource.transaction(async (manager) => {
      const hospitalRepo = manager.getRepository(MstrHospital);
      const addressRepo = manager.getRepository(MstrHospitalAddress);
      const mapRepo = manager.getRepository(MstrPolicyHospitalMap);

      const existingHospital = await hospitalRepo
        .createQueryBuilder("hospital")
        .innerJoinAndSelect("hospital.addresses", "addresses")
        .where("hospital.deletedAt IS NULL")
        .andWhere("addresses.deletedAt IS NULL")
        .andWhere("LOWER(TRIM(hospital.name)) = :name", { name: normalizedName })
        .andWhere("LOWER(TRIM(addresses.addressLine1)) = :addressLine1", {
          addressLine1: normalizedAddressLine1,
        })
        .andWhere("LOWER(TRIM(addresses.cityName)) = :city", {
          city: normalizedCity,
        })
        .andWhere("LOWER(TRIM(addresses.stateName)) = :state", {
          state: normalizedState,
        })
        .getOne();

      let hospitalId: number;
      let existed = false;

      if (existingHospital) {
        hospitalId = existingHospital.id;
        existed = true;
      } else {
        const address = addressRepo.create({
          addressLine1: args.addressLine1.trim(),
          addressLine2: args.addressLine2?.trim() || null,
          landmark: args.landmark?.trim() || null,
          cityName: args.city.trim(),
          stateName: args.state.trim(),
          countryName: (args.country?.trim() || "India") as string,
          pinCode: args.pinCode?.trim() || null,
          email: args.email?.trim() || null,
          phoneNumber: args.phoneNumber?.trim() || null,
          createdBy: args.userId,
          updatedBy: args.userId,
        } as Partial<MstrHospitalAddress>);

        const savedAddress = await addressRepo.save(address);

        const hospital = hospitalRepo.create({
          name: args.hospitalName.trim(),
          code: args.code?.trim() || null,
          addressId: savedAddress.id,
          createdBy: args.userId,
          updatedBy: args.userId,
        } as Partial<MstrHospital>);

        const savedHospital = await hospitalRepo.save(hospital);
        hospitalId = savedHospital.id;
      }

      const existingMapping = await mapRepo.findOne({
        where: { policyId: args.policyId, hospitalId },
        withDeleted: true,
      });

      let mappingExisted = false;
      if (existingMapping) {
        mappingExisted = true;
        existingMapping.isNetworkHospital = args.isNetworkHospital;
        existingMapping.updatedBy = args.userId;
        existingMapping.deletedAt = null as any;
        existingMapping.deletedBy = null as any;
        await mapRepo.save(existingMapping);
      } else {
        const mapping = mapRepo.create({
          policyId: args.policyId,
          hospitalId,
          isNetworkHospital: args.isNetworkHospital,
          createdBy: args.userId,
          updatedBy: args.userId,
        } as Partial<MstrPolicyHospitalMap>);

        await mapRepo.save(mapping);
      }

      return {
        policyId: args.policyId,
        hospitalId,
        existed,
        mappingExisted,
      };
    });
  }

  async getHospitalById(hospitalId: number): Promise<MstrHospital | null> {
    return this.hospitalRepository.findOne({
      where: { id: hospitalId, deletedAt: IsNull() },
    });
  }

  async getLocationData(
    policyId: number,
    state?: string
  ): Promise<{ states?: string[]; cities?: string[]; selectedState?: string }> {
    return getPolicyLocationDataFromRepository({
      hospitalRepository: this.hospitalRepository,
      policyIds: [policyId],
      state,
      logger: this.logger,
      traceIdService: this.traceIdService,
      repositoryName: "CompanyEmployeeRepository",
    });
  }

  async getLocationDataByPolicyIds(
    policyIds: number[],
    state?: string
  ): Promise<{ states?: string[]; cities?: string[]; selectedState?: string }> {
    return getPolicyLocationDataFromRepository({
      hospitalRepository: this.hospitalRepository,
      policyIds,
      state,
      logger: this.logger,
      traceIdService: this.traceIdService,
      repositoryName: "CompanyEmployeeRepository",
    });
  }

  async getActivePolicyFeatureDocument(policyId: number): Promise<{ data: unknown[]; count: number }> {
    return getActivePolicyFeatureDocumentFromRepository({
      policyFeatureDocumentRepository: this.policyFeatureDocumentRepository,
      policyId,
      logger: this.logger,
      traceIdService: this.traceIdService,
      repositoryName: "CompanyEmployeeRepository",
    });
  }

  async getCompanyPolicyFeatureDocumentByEmployee(
    employeeId: number
  ): Promise<{ data: unknown[]; count: number }> {
    const employee = await this.companyEmployeeRepository.findOne({
      where: { id: employeeId },
      select: ["companyId"],
    });

    const companyId = employee?.companyId ?? null;
    if (!companyId) {
      return { data: [], count: 0 };
    }

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
      select: ["id", "companyName", "displayName", "policyFeatureDocumentId"],
    });

    if (!company?.policyFeatureDocumentId) {
      return { data: [], count: 0 };
    }

    const fileUpload = await this.fileUploadRepository.findOne({
      where: { id: company.policyFeatureDocumentId },
      relations: ["createdByUser"],
    });

    const uploadedByName = fileUpload?.createdByUser
      ? `${fileUpload.createdByUser.firstName || ""} ${fileUpload.createdByUser.lastName || ""}`.trim() ||
        "Unknown User"
      : "Unknown User";

    const fileName = fileUpload?.fileKey
      ? fileUpload.fileKey.split("/").pop() ?? "Policy Feature Document"
      : "Policy Feature Document";

    return {
      data: [
        {
          id: null,
          policyId: null,
          policyName: company.displayName || company.companyName || null,
          documentId: company.policyFeatureDocumentId,
          fileName,
          fileStatus: fileUpload?.status || "ACTIVE",
          uploadedAt: fileUpload?.createdAt ?? null,
          uploadedBy: fileUpload?.createdBy ?? null,
          uploadedByName,
          featureType: "company_level",
          companyId: company.id,
        },
      ],
      count: 1,
    };
  }

  async getPolicyIdsByEmployee(employeeId: number): Promise<number[]> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeRepository",
        method: "getPolicyIdsByEmployee",
        payload: { employeeId },
        messageData: "Retrieving policy IDs mapped to employee",
      }),
    });

    const maps = await this.employeePolicyMapRepo.find({
      where: { employeeId },
      select: ["policyId"],
    });

    const policyIds = maps.map((map) => map.policyId);
    return Array.from(new Set(policyIds));
  }

  async getPolicyNamesByIds(policyIds: number[]): Promise<Record<number, string | null>> {
    if (!policyIds.length) {
      return {};
    }

    const policies = await this.policyRepository.find({
      where: { id: In(policyIds) },
      select: ["id", "policyName"],
    });

    return policies.reduce<Record<number, string | null>>((acc, policy) => {
      acc[policy.id] = policy.policyName ?? null;
      return acc;
    }, {});
  }

  private extractFileNameFromKey(fileKey: string): string | null {
    if (!fileKey) return null;

    try {
      const parts = fileKey.split('/');
      return parts[parts.length - 1] || null;
    } catch {
      return null;
    }
  }

  async getPolicyContactMetrics(policyId: number): Promise<PolicyContactMetric[]> {
    return this.policyContactMetricRepository.find({
      where: { policyId },
      relations: ["contact", "contact.communicationDetails"],
      order: { partyType: "ASC", contactLevel: "ASC" },
    });
  }

  async getPolicyPrimaryPartyDetails(
    policyId: number
  ): Promise<{ tpa?: PartyDetail; insurer?: PartyDetail }> {
    const [primaryTpaMap, primaryInsurerMap] = await Promise.all([
      this.policyTpaMapRepository
        .createQueryBuilder("map")
        .leftJoinAndSelect("map.tpa", "tpa")
        .where("map.policy_id = :policyId", { policyId })
        .orderBy("map.id", "ASC")
        .limit(1)
        .getOne(),
      this.policyInsurerMapRepository
        .createQueryBuilder("map")
        .leftJoinAndSelect("map.insurer", "insurer")
        .where("map.policy_id = :policyId", { policyId })
        .orderBy("map.id", "ASC")
        .limit(1)
        .getOne(),
    ]);

    return {
      tpa: primaryTpaMap
        ? {
            id: primaryTpaMap.tpaId,
            name: primaryTpaMap.tpa?.tpaName ?? null,
            displayName: primaryTpaMap.tpa?.displayName ?? null,
          }
        : undefined,
      insurer: primaryInsurerMap
        ? {
            id: primaryInsurerMap.insurerId,
            name: primaryInsurerMap.insurer?.insurerName ?? null,
            displayName: primaryInsurerMap.insurer?.displayName ?? null,
          }
        : undefined,
    };
  }

  async getPolicyIdsForEmployee(employeeId: number): Promise<number[]> {
    const maps = await this.employeePolicyMapRepo.find({
      where: { employeeId },
      select: ["policyId"],
    });
    const uniqueIds = Array.from(new Set(maps.map((map) => map.policyId)));
    return uniqueIds;
  }

  private formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Kolkata",
    };
    const formatted = new Intl.DateTimeFormat('en-GB', options).format(date);
    return formatted.replace(/\b(am|pm)\b/g, (match) => match.toUpperCase());
  }

  async getUserActivityLogs(userId?: number, activityKey?: string): Promise<UserActivityLog[]> {
    try {
      const where = {
        ...(userId ? { userId } : {}),
        ...(activityKey ? { activityKey } : {}),
      };
      const logs = await this.userActivityLogRepository.find({
        where,
        order: { actionDate: "DESC", createdAt: "DESC" },
        take: 10,
      });
      return logs;
      // const latestByActivityKey = new Map<string, UserActivityLog>();
      // for (const log of logs) {
      //   if (!latestByActivityKey.has(log.activityKey)) {
      //     latestByActivityKey.set(log.activityKey, log);
      //   }
      // }

      // const latestByActivityKey = new Map<string, UserActivityLog>();
      // for (const log of logs) {
      //   if (!latestByActivityKey.has(log.activityKey)) {
      //     latestByActivityKey.set(log.activityKey, log);
      //   }
      // }

      
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getUserActivityLogs",
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw new InternalServerErrorException("Failed to fetch user activity logs");
    }
  }

  async createUserActivityLog(params: CreateUserActivityLogParams): Promise<UserActivityLog> {
    try {
      const log = this.userActivityLogRepository.create({
        userId: params.userId,
        activityKey: params.activityKey,
        activityCategory: params.activityCategory,
        referenceId: params.referenceId != null ? String(params.referenceId) : undefined,
        referenceType: params.referenceType,
        metadata: params.metadata,
      });

      return await this.userActivityLogRepository.save(log);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "createUserActivityLog",
          payload: params,
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw new InternalServerErrorException("Failed to create user activity log");
    }
  }

  async getNotificationInfoById(
    id: number,
    _userId?: number,
  ): Promise<NotificationInfo | null> {
    try {
      return await this.notificationInfoRepository.findOne({ where: { id } });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getNotificationInfoById",
          payload: { id },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw new InternalServerErrorException("Failed to fetch notification info");
    }
  }

  async getMailActivityLogs(userId: number): Promise<UserActivityLog[]> {
    try {
      return await this.userActivityLogRepository.find({
        where: {
          userId,
          referenceType: "NOTIFICATION_INFO",
        },
        order: { actionDate: "DESC", createdAt: "DESC" },
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getMailActivityLogs",
          payload: { userId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw new InternalServerErrorException("Failed to fetch mail activity logs");
    }
  }

  async getMailActivityLogsByEmployeeId(employeeId: number, activityKey?: string): Promise<UserActivityLog[]> {
    try {
      const qb = this.userActivityLogRepository
        .createQueryBuilder("ual")
        .where("ual.referenceType = :refType", { refType: "NOTIFICATION_INFO" })
        .andWhere("ual.metadata->>'employeeId' = :employeeId", { employeeId: String(employeeId) })
        .andWhere("ual.deletedAt IS NULL");
      if (activityKey) {
        qb.andWhere("ual.activityKey = :activityKey", { activityKey });
      }
      return await qb
        .orderBy("ual.actionDate", "DESC")
        .addOrderBy("ual.createdAt", "DESC")
        .getMany();
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getMailActivityLogsByEmployeeId",
          payload: { employeeId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw new InternalServerErrorException("Failed to fetch mail activity logs by employeeId");
    }
  }

  async getNotificationInfosByIds(
    ids: number[],
    userId?: number,
  ): Promise<NotificationInfo[]> {
    if (!ids.length) {
      return [];
    }

    try {
      const where = userId
        ? { id: In(ids), createdBy: userId }
        : { id: In(ids) };
      return await this.notificationInfoRepository.find({
        where,
        order: { createdAt: "DESC" },
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getNotificationInfosByIds",
          payload: { ids, userId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw new InternalServerErrorException("Failed to fetch notification info list");
    }
  }

  async createTicket(ticketData: {
    employeeId?: number | null;
    isAnonymousUser?: boolean;
    category: string;
    mailId: string;
    escalationDescription: string;
    documentIds?: number[];
    userId?: number;
  }): Promise<RaiseTicket> {
    const traceId = this.traceIdService.traceId;
    
    try {
      const ticket = this.raiseTicketRepository.create({
        employeeId: ticketData.employeeId ?? null,
        isAnonymousUser: Boolean(ticketData.isAnonymousUser),
        category: ticketData.category as any,
        mailId: ticketData.mailId,
        escalationDescription: ticketData.escalationDescription,
        documentIds: ticketData.documentIds || null,
        createdBy: ticketData.userId ?? null,
      });

      const savedTicket = await this.raiseTicketRepository.save(ticket);
      
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId,
          status: "success",
          location: "CompanyEmployeeRepository",
          method: "createTicket",
          payload: { ticketId: savedTicket.ticketId, employeeId: ticketData.employeeId },
          messageData: "Ticket created successfully",
        }),
      });

      return savedTicket;
    } catch (error) {
      console.log("Error creating ticket:", error);
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "createTicket",
          payload: ticketData,
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      
      throw new InternalServerErrorException("Failed to create ticket");
    }
  }

  async findTicketById(id: number): Promise<RaiseTicket | null> {
    return this.raiseTicketRepository.findOne({ where: { id } });
  }

  async updateTicketStatus(
    id: number,
    status: TicketStatus,
    comment: string,
  ): Promise<RaiseTicket> {
    const traceId = this.traceIdService.traceId;

    try {
      const ticket = await this.raiseTicketRepository.findOne({ where: { id } });
      if (!ticket) {
        throw new NotFoundException(`Ticket with ID ${id} not found`);
      }

      ticket.status = status;
      ticket.comment = comment;

      const savedTicket = await this.raiseTicketRepository.save(ticket);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId,
          status: "success",
          location: "CompanyEmployeeRepository",
          method: "updateTicketStatus",
          payload: { id, status },
          messageData: "Ticket status updated successfully",
        }),
      });

      return savedTicket;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "updateTicketStatus",
          payload: { id, status },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });

      throw new InternalServerErrorException("Failed to update ticket status");
    }
  }

  async getTicketsByEmployeeId(
    employeeId: number,
    queryOptions: {
      page?: number;
      limit?: number;
      status?: string;
      category?: string;
    }
  ): Promise<{ tickets: (RaiseTicket & { raisedBy: string })[]; totalItems: number }> {
    const traceId = this.traceIdService.traceId;

    try {
      const { page = 1, limit = 10, status, category } = queryOptions;
      const skip = (page - 1) * limit;

      // Fetch the employee's email from policy_enrollment_employee so we can
      // also include tickets that were raised using that email (mailId match).
      const employeeRecord = await this.companyEmployeeRepository.findOne({
        where: { id: employeeId },
        select: ['email'],
      });
      const employeeEmail = employeeRecord?.email ?? null;

      const baseWhere = (qb: any) => {
        if (employeeEmail) {
          qb.where(
            '(ticket.employeeId = :employeeId OR ticket.mailId = :employeeEmail)',
            { employeeId, employeeEmail },
          );
        } else {
          qb.where('ticket.employeeId = :employeeId', { employeeId });
        }
        if (status)   qb.andWhere('ticket.status = :status', { status });
        if (category) qb.andWhere('ticket.category = :category', { category });
      };

      const queryBuilder = this.raiseTicketRepository
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.employee', 'employee')
        .addSelect(`
          CASE
            WHEN ticket.created_by IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.user_id = ticket.created_by AND h.deleted_at IS NULL AND h.role_key = 'PORTAL_CRM')
              THEN 'CRM'
            WHEN ticket.created_by IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.user_id = ticket.created_by AND h.deleted_at IS NULL)
              THEN 'HR'
            WHEN ticket.mail_id IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.email_id = ticket.mail_id AND h.deleted_at IS NULL AND h.role_key = 'PORTAL_CRM')
              THEN 'CRM'
            WHEN ticket.mail_id IS NOT NULL AND EXISTS (SELECT 1 FROM hr_user_management h WHERE h.email_id = ticket.mail_id AND h.deleted_at IS NULL)
              THEN 'HR'
            WHEN EXISTS (SELECT 1 FROM policy_enrollment_employee pe WHERE pe.user_id = ticket.created_by)
              THEN 'EMPLOYEE'
            ELSE 'EMPLOYEE'
          END
        `, 'raisedBy');

      baseWhere(queryBuilder);

      const countBuilder = this.raiseTicketRepository.createQueryBuilder('ticket');
      baseWhere(countBuilder);

      queryBuilder.orderBy('ticket.createdAt', 'DESC').skip(skip).take(limit);

      const [{ entities, raw }, totalItems] = await Promise.all([
        queryBuilder.getRawAndEntities(),
        countBuilder.getCount(),
      ]);

      const raisedByKey = raw.length > 0
        ? (Object.keys(raw[0]).find(k => k.toLowerCase().includes('raisedby')) ?? 'raisedBy')
        : 'raisedBy';

      const tickets = entities.map((ticket, i) =>
        Object.assign(ticket, { raisedBy: (raw[i]?.[raisedByKey] as string) ?? 'EMPLOYEE' })
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId,
          status: "success",
          location: "CompanyEmployeeRepository",
          method: "getTicketsByEmployeeId",
          payload: { employeeId, totalItems, page, limit },
          messageData: "Retrieved tickets successfully",
        }),
      });

      return { tickets, totalItems };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getTicketsByEmployeeId",
          payload: { employeeId, queryOptions },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw new InternalServerErrorException("Failed to retrieve tickets");
    }
  }

  async getTicketsByCompanyId(
    companyId: number,
    queryOptions: { page?: number; limit?: number; status?: string; category?: string }
  ): Promise<{ tickets: RaiseTicket[]; totalItems: number }> {
    const traceId = this.traceIdService.traceId;
    try {
      const { page = 1, limit = 50, status, category } = queryOptions;
      const skip = (page - 1) * limit;

      // innerJoinAndSelect filters to only tickets whose employee belongs to
      // the given company, matching the SQL in hr_support_tickets report.
      const qb = this.raiseTicketRepository
        .createQueryBuilder('ticket')
        .innerJoinAndSelect(
          'ticket.employee',
          'employee',
          'employee.companyId = :companyId',
          { companyId }
        );

      if (status) qb.andWhere('ticket.status = :status', { status });
      if (category) qb.andWhere('ticket.category = :category', { category });

      qb.orderBy('ticket.createdAt', 'DESC').skip(skip).take(limit);

      const [tickets, totalItems] = await qb.getManyAndCount();

      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId,
          status: 'success',
          location: 'CompanyEmployeeRepository',
          method: 'getTicketsByCompanyId',
          payload: { companyId, totalItems },
          messageData: 'Retrieved company tickets successfully',
        }),
      });

      return { tickets, totalItems };
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId,
          status: 'failure',
          location: 'CompanyEmployeeRepository',
          method: 'getTicketsByCompanyId',
          payload: { companyId, queryOptions },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw new InternalServerErrorException('Failed to retrieve company tickets');
    }
  }

  async getTicketById(ticketId: number, employeeId: number): Promise<RaiseTicket | null> {
    const traceId = this.traceIdService.traceId;

    try {
      const ticket = await this.raiseTicketRepository
        .createQueryBuilder('ticket')
        .leftJoinAndSelect('ticket.employee', 'employee')
        .where('ticket.id = :ticketId', { ticketId })
        .andWhere('ticket.employeeId = :employeeId', { employeeId })
        .getOne();

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId,
          status: "success",
          location: "CompanyEmployeeRepository",
          method: "getTicketById",
          payload: { ticketId, employeeId },
          messageData: ticket ? "Ticket found" : "Ticket not found",
        }),
      });

      return ticket;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId,
          status: "failure",
          location: "CompanyEmployeeRepository",
          method: "getTicketById",
          payload: { ticketId, employeeId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw new InternalServerErrorException("Failed to retrieve ticket");
    }
  }

  async fetchAllCountries(): Promise<Country[]> {
    return this.countryRepository
      .createQueryBuilder("country")
      .orderBy("country.name", "ASC")
      .getMany();
  }

  async findStatesByCountry(countryId: number): Promise<State[]> {
    return this.stateRepository
      .createQueryBuilder("state")
      .where("state.country_id = :countryId", { countryId })
      .orderBy("state.name", "ASC")
      .getMany();
  }

  async findCitiesByState(stateId: number, search?: string): Promise<City[]> {
    const qb = this.cityRepository
      .createQueryBuilder("city")
      .where("city.state_id = :stateId", { stateId });
    if (search) {
      qb.andWhere("LOWER(city.name) LIKE LOWER(:search)", { search: `%${search}%` });
    }
    return qb.orderBy("city.name", "ASC").getMany();
  }

  async getEmployeeTpaFeatures(employeeId: number): Promise<TpaExternalFeatureConfig[]> {
    // Get distinct TPA IDs from the employee's active policy-tpa mappings
    const tpaMappings = await this.policyTpaMapRepository
      .createQueryBuilder("ptm")
      .innerJoin("ptm.policy", "p")
      .innerJoin(
        PolicyEnrollmentEmployeePolicyMap,
        "pem",
        "pem.policyId = p.id AND pem.employeeId = :employeeId AND pem.deletedAt IS NULL",
        { employeeId },
      )
      // .where("ptm.deletedAt IS NULL")
      .select("ptm.tpaId", "tpaId")
      .distinct(true)
      .getRawMany();

    const tpaIds = tpaMappings.map((r: any) => r.tpaId).filter(Boolean);
    if (!tpaIds.length) return [];

    return this.tpaFeatureConfigRepo.find({
      where: { tpaId: In(tpaIds), isActive: true },
      relations: ["featureType", "appRef"],
      order: { displayOrder: "ASC" },
    });
  }

  async getEmployeeTpaInfo(employeeId: number): Promise<{
    companyEmployeeId: string | null;
    externalTpaPolicyId: string | null;
    tpaId: number | null;
    policyId: number | null;
  } | null> {
    const map = await this.employeePolicyMapRepo
      .createQueryBuilder("map")
      .leftJoinAndSelect("map.policy", "policy")
      .leftJoinAndSelect("policy.policyType", "policyType")
      .leftJoinAndSelect("map.employee", "employee")
      .where("map.employeeId = :employeeId", { employeeId })
      .andWhere("map.deletedAt IS NULL")
      .andWhere("UPPER(policyType.lookUpKey) LIKE :gmcKey", { gmcKey: "POLICY_TYPE_GMC" })
      .andWhere("policy.policyTo >= CURRENT_DATE")
      .getOne();
    console.log("getEmployeeTpaInfo - map:", map);
    if (!map) {
      return null;
    }

    const tpaMap = map.policy?.id
      ? await this.policyTpaMapRepository.findOne({ where: { policyId: map.policy.id } })
      : null;

    return {
      companyEmployeeId: map.employee?.companyEmployeeId ?? null,
      externalTpaPolicyId: map.policy?.externalTpaPolicyId ?? null,
      tpaId: tpaMap?.tpaId ?? null,
      policyId: map.policy?.id ?? null,
    };
  }

  async saveClaimFormExtraction(payload: {
    policyId: number | null;
    employeeId: number | null;
    fileName: string;
    claimData: Record<string, any>;
    aiResponseData: Record<string, any> | null;
  }): Promise<ClaimFormExtraction> {
    const traceId = this.traceIdService.traceId;
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId,
          status: 'success',
          location: 'CompanyEmployeeRepository',
          method: 'saveClaimFormExtraction',
          payload: { employeeId: payload.employeeId, policyId: payload.policyId, fileName: payload.fileName },
          messageData: 'method invoked',
        }),
      });
      const record = this.claimFormExtractionRepo.create({
        policyId: payload.policyId ?? null,
        employeeId: payload.employeeId ?? null,
        fileName: payload.fileName,
        claimData: payload.claimData,
        aiResponseData: payload.aiResponseData ?? null,
      });
      const saved = await this.claimFormExtractionRepo.save(record);
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId,
          status: 'success',
          location: 'CompanyEmployeeRepository',
          method: 'saveClaimFormExtraction',
          payload: { id: saved.id },
          messageData: 'Claim form extraction saved successfully',
        }),
      });
      return saved;
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId,
          status: 'failure',
          location: 'CompanyEmployeeRepository',
          method: 'saveClaimFormExtraction',
          payload: { employeeId: payload.employeeId, policyId: payload.policyId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      throw new InternalServerErrorException('Failed to save claim form extraction');
    }
  }
}
