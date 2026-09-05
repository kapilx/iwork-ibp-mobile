import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import {
  DOCUMENT_TYPE_POLICY_EMPLOYEE_ENROLLMENT_DATA,
  EMPLOYEE_ENROLLMENT_STATUS_ENROLLED,
  LOG_STATUS,
  LogStatus,
  serviceNames,
} from "../../../../service-lib/src/lib/constants";
import { POLICY_CONFIGURATION_STATUS_LIVE } from "../../../../../../libs/service-lib/src/lib/constants";
import {
  CompanyAuthenticationConfig,
  CompanyAuthenticationMapping,
  Company,
  CompanyPortalConfigScope,
  ConfigCompany,
  EmployeeEnrollmentSubmission,
  LookUp,
  Policy,
  PolicyComponentsConfigurationDetail,
  PolicyConfiguration,
  PolicyEmployeeEnrollment,
  PolicyEmployeeEnrollmentChoice,
  PolicyEmployeeEnrollmentChoiceDependent,
  PolicyEnrollmentDependent,
  PolicyEnrollmentEmployee,
  PolicyEnrollmentEmployeePolicyMap,
  User,
  CompanyPolicyConfigurationLocation,
  LocalizationCountry,
} from "../../../../service-lib/src/lib/entities";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import { CountryFormatConfig } from "../../../../service-lib/src/lib/utils/currency-format.util";

@Injectable()
export class OnboardingRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    @InjectRepository(PolicyEnrollmentEmployee)
    private readonly policyEnrollmentEmployeeRepository: Repository<PolicyEnrollmentEmployee>,
    @InjectRepository(PolicyEnrollmentEmployeePolicyMap)
    private readonly policyEnrollmentEmployeePolicyMapRepository: Repository<PolicyEnrollmentEmployeePolicyMap>,
    @InjectRepository(PolicyEmployeeEnrollment)
    private readonly policyEmployeeEnrollmentRepository: Repository<PolicyEmployeeEnrollment>,
    @InjectRepository(PolicyEmployeeEnrollmentChoice)
    private readonly policyEmployeeEnrollmentChoiceRepository: Repository<PolicyEmployeeEnrollmentChoice>,
    @InjectRepository(PolicyEmployeeEnrollmentChoiceDependent)
    private readonly policyEmployeeEnrollmentChoiceDependentRepository: Repository<PolicyEmployeeEnrollmentChoiceDependent>,
    @InjectRepository(PolicyEnrollmentDependent)
    private readonly policyEnrollmentDependentRepository: Repository<PolicyEnrollmentDependent>,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(PolicyComponentsConfigurationDetail)
    private readonly policyComponentsConfigDetailRepository: Repository<PolicyComponentsConfigurationDetail>,
    @InjectRepository(PolicyConfiguration)
    private readonly policyConfigurationRepository: Repository<PolicyConfiguration>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(CompanyAuthenticationConfig)
    private readonly companyAuthConfigRepository: Repository<CompanyAuthenticationConfig>,
    @InjectRepository(CompanyAuthenticationMapping)
    private readonly companyAuthMappingRepository: Repository<CompanyAuthenticationMapping>,
    @InjectRepository(ConfigCompany)
    private readonly configCompanyRepository: Repository<ConfigCompany>,
    @InjectRepository(CompanyPortalConfigScope)
    private readonly companyPortalConfigScopeRepository: Repository<CompanyPortalConfigScope>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(EmployeeEnrollmentSubmission)
    private readonly employeeEnrollmentSubmissionRepository: Repository<EmployeeEnrollmentSubmission>,
    @InjectRepository(CompanyPolicyConfigurationLocation)
    private readonly companyPolicyConfigurationLocationRepository: Repository<CompanyPolicyConfigurationLocation>,
    @InjectRepository(LocalizationCountry)
    private readonly localizationCountryRepository: Repository<LocalizationCountry>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.IBP_SERVICE);
  }

  // Resolves the number/currency format for an employee's notification content
  // (email amounts, counts) — same country-resolution rule as ibp-service's
  // getEmployeeLocalization: prefer the employee's specific policy config
  // location's address/country when set, else fall back to the company's
  // country. Returns null (callers fall back to Indian formatting/"₹") if
  // no country can be resolved, so a lookup miss never blocks a notification.
  async getCountryFormatForEmployee(
    employeeId: number,
  ): Promise<CountryFormatConfig | null> {
    try {
      const employee = await this.policyEnrollmentEmployeeRepository.findOne({
        where: { id: employeeId },
        relations: ["company", "company.country"],
      });
      if (!employee) return null;

      let countryName: string | undefined;
      if (employee.policyConfigLocationId) {
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
      countryName = countryName ?? employee.company?.country?.name;
      if (!countryName) return null;

      const localizationCountry = await this.localizationCountryRepository
        .createQueryBuilder("lc")
        .where("LOWER(lc.name) = LOWER(:countryName)", { countryName })
        .getOne();

      if (!localizationCountry) return null;
      return {
        currencyFormat: localizationCountry.currencyFormat,
        numberFormat: localizationCountry.numberFormat,
        taxLabel: localizationCountry.taxLabel,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OnboardingRepository",
          method: "getCountryFormatForEmployee",
          payload: { employeeId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      return null;
    }
  }

  private buildEnrollmentSubmissionReference(
    employeeId: number,
    submissionCount: number,
    submittedAt: Date,
  ): string {
    // Human-friendly reference number (stable, sortable, and unique per employee submission count)
    const yyyy = submittedAt.getUTCFullYear();
    const mm = String(submittedAt.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(submittedAt.getUTCDate()).padStart(2, "0");
    const hh = String(submittedAt.getUTCHours()).padStart(2, "0");
    const mi = String(submittedAt.getUTCMinutes()).padStart(2, "0");
    const ss = String(submittedAt.getUTCSeconds()).padStart(2, "0");
    return `ENR-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${employeeId}-${submissionCount}`;
  }

  async createEnrollmentSubmissionRecord(params: {
    employeeId: number;
    companyId: number;
    policyIds: number[];
    createdBy?: number | null;
  }): Promise<{ submissionCount: number; referenceNumber: string }> {
    const { employeeId, companyId, policyIds, createdBy } = params;

    // Retry on unique constraint collision (rare, but possible in concurrent submits)
    for (let attempt = 0; attempt < 3; attempt++) {
      const nextCountRow = await this.employeeEnrollmentSubmissionRepository
        .createQueryBuilder("s")
        .select("COALESCE(MAX(s.submissionCount), 0) + 1", "nextCount")
        .where("s.employeeId = :employeeId", { employeeId })
        .andWhere("s.companyId = :companyId", { companyId })
        .getRawOne<{ nextCount: string }>();

      const submissionCount = Number(nextCountRow?.nextCount ?? 1);
      const submittedAt = new Date();
      const referenceNumber = this.buildEnrollmentSubmissionReference(
        employeeId,
        submissionCount,
        submittedAt,
      );

      try {
        await this.employeeEnrollmentSubmissionRepository.insert({
          employeeId,
          companyId,
          policyIds,
          submissionCount,
          referenceNumber,
          submittedAt,
          createdBy: createdBy ?? null,
          updatedBy: createdBy ?? null,
        });

        return { submissionCount, referenceNumber };
      } catch (e: any) {
        // Postgres unique violation
        if (e?.code === "23505") continue;
        throw e;
      }
    }

    throw new BadRequestException(
      "Could not generate enrollment submission reference. Please retry.",
    );
  }

  private logInfo(
    method: string,
    messageData = "method invoked",
    payload = {},
    status: LogStatus = LOG_STATUS.SUCCESS
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status,
        location: "OnboardingRepository",
        method,
        payload,
        messageData,
      }),
    });
  }

  private logError(method: string, error: any, payload = {}) {
    this.logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: LOG_STATUS.FAILURE,
        location: "OnboardingRepository",
        method,
        payload,
        messageData: error,
      }),
    });
  }

  /**
   * Find employee by ID with user relation
   */
  async findEmployeeById(
    employeeId: number,
  ): Promise<PolicyEnrollmentEmployee | null> {
    return this.policyEnrollmentEmployeeRepository.findOne({
      where: { id: employeeId },
    });
  }

  /**
   * Find employees by a list of IDs
   */
  async findEmployeesByIds(
    employeeIds: number[],
  ): Promise<PolicyEnrollmentEmployee[]> {
    if (!employeeIds.length) {
      return [];
    }
    try {
      this.logInfo("findEmployeesByIds", "fetching employees by IDs", {
        employeeIds,
      });
      return await this.policyEnrollmentEmployeeRepository.find({
        where: { id: In(employeeIds) },
      });
    } catch (error) {
      this.logError("findEmployeesByIds", error, { employeeIds });
      throw error;
    }
  }

  /**
   * Find policy by ID
   */
  async findPolicyById(policyId: number): Promise<Policy | null> {
    return this.policyRepository.findOne({
      where: { id: policyId },
    });
  }

  async findLivePolicyTemplateByPolicyId(policyId: number): Promise<any | null> {
    try {
      const liveStatus = await this.lookUpRepository.findOne({
        where: { lookUpKey: POLICY_CONFIGURATION_STATUS_LIVE },
      });

      if (liveStatus) {
        const liveConfigs = await this.policyConfigurationRepository
          .createQueryBuilder("pc")
          .where("pc.policyId = :policyId", { policyId })
          .andWhere("pc.policyConfiguartionStatusLid = :statusId", {
            statusId: liveStatus.id,
          })
          .andWhere("pc.deletedAt IS NULL")
          .orderBy("pc.updatedAt", "DESC")
          .getMany();

        const liveTemplateConfig = liveConfigs.find(
          (config) => (config?.policyConfiguration as any)?.policyTemplate,
        );
        if (liveTemplateConfig) {
          return (liveTemplateConfig.policyConfiguration as any)?.policyTemplate;
        }
      }

      // Fallback: if live lookup/status mapping is missing, use latest non-deleted config with policyTemplate.
      const fallbackConfigs = await this.policyConfigurationRepository
        .createQueryBuilder("pc")
        .where("pc.policyId = :policyId", { policyId })
        .andWhere("pc.deletedAt IS NULL")
        .orderBy("pc.updatedAt", "DESC")
        .getMany();

      const fallbackTemplateConfig = fallbackConfigs.find(
        (config) => (config?.policyConfiguration as any)?.policyTemplate,
      );
      return fallbackTemplateConfig
        ? (fallbackTemplateConfig.policyConfiguration as any)?.policyTemplate
        : null;
    } catch (error) {
      this.logError("findLivePolicyTemplateByPolicyId", error, { policyId });
      return null;
    }
  }

  /**
   * Find company authentication config by ID with authentication method relation
   */
  async findCompanyAuthConfigById(
    configId: number,
  ): Promise<CompanyAuthenticationConfig | null> {
    return this.companyAuthConfigRepository.findOne({
      where: { id: configId },
      relations: ["authenticationMethod"],
    });
  }

  /**
   * Find company authentication config by company ID
   */
  async findCompanyAuthConfigByCompanyId(
    companyId: number,
  ): Promise<CompanyAuthenticationConfig | null> {
    return this.companyAuthConfigRepository.findOne({
      where: { companyId },
      relations: ["authenticationMethod"],
    });
  }

  /**
   * Find user by ID
   */
  async findUserById(userId: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { userId },
    });
  }

  /**
   * Find company portal configuration by company ID
   */
  async findCompanyPortalConfiguration(
    companyId: number,
  ): Promise<ConfigCompany | null> {
    return this.configCompanyRepository.findOne({
      where: { companyId },
    });
  }

  /**
   * Resolves the correct company_portal_configuration (domain) row for a given
   * policy, via company_portal_config_scope, so email content (portal link,
   * branding) reflects the specific domain the employee's policy is scoped to
   * instead of an arbitrary domain row belonging to the same company.
   */
  async findConfigCompanyForPolicy(
    companyId: number,
    policyId: number,
  ): Promise<ConfigCompany | null> {
    const scopedRow = await this.companyPortalConfigScopeRepository.findOne({
      where: { companyId, policyId },
    });
    if (scopedRow) {
      return this.configCompanyRepository.findOne({
        where: { id: scopedRow.configId },
      });
    }

    const allPoliciesRow = await this.companyPortalConfigScopeRepository.findOne(
      { where: { companyId, policyId: IsNull() } },
    );
    if (allPoliciesRow) {
      return this.configCompanyRepository.findOne({
        where: { id: allPoliciesRow.configId },
      });
    }

    // No domain-scope data configured for this company at all. Previously
    // fell back to "whatever single/first config row exists" with no
    // ordering — safe for a company with exactly one domain (the common
    // case, unchanged below), but for a company with MULTIPLE domains this
    // silently guessed one at random. A wrong guess here doesn't just pick
    // the wrong template — it means the wrong domain's portal link/branding
    // could go out in an email, and any company/domain-specific template
    // customization scoped to the *correct* domain would never be found
    // (see: notification-template-config-scoping.sql's config_id override
    // lookup — this is exactly the resolved configId it checks against).
    // Only return a row when it's unambiguous; otherwise return null so the
    // caller falls back to the shared default portal URL/branding/template
    // instead of confidently sending the wrong company's content.
    const companyConfigs = await this.configCompanyRepository.find({ where: { companyId } });
    return companyConfigs.length === 1 ? companyConfigs[0] : null;
  }

  /**
   * Looks up a company_portal_configuration row directly by its own id —
   * for callers that already know the exact configId (e.g. decoded from the
   * sender's own auth token for an authenticated employee-portal action)
   * rather than needing to guess it from companyId+policyId via
   * findConfigCompanyForPolicy.
   */
  async findConfigCompanyById(configId: number): Promise<ConfigCompany | null> {
    return this.configCompanyRepository.findOne({ where: { id: configId } });
  }

  async findCompanyById(companyId: number): Promise<Company | null> {
    return this.companyRepository.findOne({
      where: { id: companyId },
    });
  }

  /**
   * Resolves which policyIds an onboarding-mail trigger should be scoped to for a given
   * company + portal subdomain. Mirrors the domain-scope semantics of
   * CompanyEmployeeService.assertEmployeeInDomainScope: no scope rows, or any row with
   * policyId=null, means ALL_POLICIES mode (returns null, i.e. no filter).
   */
  async findScopedPolicyIdsBySubDomain(
    companyId: number,
    subDomain: string,
  ): Promise<number[] | null> {
    const config = await this.configCompanyRepository.findOne({
      where: { companyId, subDomain },
    });

    if (!config) {
      throw new NotFoundException(
        `No portal configuration found for companyId ${companyId} and subDomain "${subDomain}"`,
      );
    }

    const scopeRows = await this.companyPortalConfigScopeRepository.find({
      where: { configId: config.id },
    });

    if (!scopeRows.length || scopeRows.some((row) => row.policyId === null)) {
      return null;
    }

    return Array.from(
      new Set(scopeRows.map((row) => row.policyId as number)),
    );
  }

  async findPendingInitialOnboardingMappingsByCompany(
    companyId: number,
    policyIds?: number[] | null,
  ) {
    const qb = this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .innerJoin(Policy, "policy", "policy.id = epm.policyId")
      .select("epm.id", "id")
      .addSelect("epm.employeeId", "employeeId")
      .addSelect("epm.policyId", "policyId")
      .addSelect("policy.companyId", "companyId")
      .where("epm.deletedAt IS NULL")
      .andWhere("epm.isOnBoradingMailSent = :isOnBoradingMailSent", {
        isOnBoradingMailSent: false,
      })
      .andWhere("policy.companyId = :companyId", { companyId })
      .orderBy("epm.id", "ASC");

    if (policyIds && policyIds.length) {
      qb.andWhere("epm.policyId IN (:...policyIds)", { policyIds });
    }

    return qb.getRawMany<{
      id: number;
      employeeId: number;
      policyId: number;
      companyId: number;
    }>();
  }

  /**
   * Same "pending initial onboarding" filter as findPendingInitialOnboardingMappingsByCompany,
   * but returns employee detail rows directly via a correlated subquery instead of the caller
   * collecting employee ids in JS and re-querying with `id: In(uniqueEmployeeIds)`. On a company
   * the size of 190550 (10k+ pending employees) that In() list becomes an equally large bound
   * parameter array, which pushes past Postgres's per-statement bind-parameter ceiling ("bind
   * message has N parameter formats but 0 parameters"). A subquery re-evaluates the same WHERE
   * clause inside Postgres, so the bound-parameter count stays fixed regardless of match count.
   */
  async findPendingInitialOnboardingEmployeesByCompany(
    companyId: number,
    policyIds?: number[] | null,
  ): Promise<PolicyEnrollmentEmployee[]> {
    const mappingSubQuery = this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .innerJoin(Policy, "policy", "policy.id = epm.policyId")
      .select("epm.employeeId")
      .where("epm.deletedAt IS NULL")
      .andWhere("epm.isOnBoradingMailSent = :isOnBoradingMailSent", {
        isOnBoradingMailSent: false,
      })
      .andWhere("policy.companyId = :companyId", { companyId });

    if (policyIds && policyIds.length) {
      mappingSubQuery.andWhere("epm.policyId IN (:...policyIds)", { policyIds });
    }

    return await this.policyEnrollmentEmployeeRepository
      .createQueryBuilder("emp")
      .where(`emp.id IN (${mappingSubQuery.getQuery()})`)
      .setParameters(mappingSubQuery.getParameters())
      .orderBy("emp.id", "ASC")
      .getMany();
  }

  async markInitialOnboardingMailSent(mappingIds: number[]): Promise<void> {
    if (!mappingIds.length) {
      return;
    }

    await this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder()
      .update(PolicyEnrollmentEmployeePolicyMap)
      .set({ isOnBoradingMailSent: true })
      .whereInIds(mappingIds)
      .execute();
  }

  async findEmployeeIdByEmailAndCompany(
    email: string,
    companyId: number,
  ): Promise<number | null> {
    try {
      const employee = await this.policyEnrollmentEmployeeRepository.findOne({
        where: { email: email.trim().toLowerCase(), companyId, deletedAt: IsNull() },
        select: ["id"],
        order: { id: "DESC" },
      });
      return employee ? employee.id : null;
    } catch (error) {
      this.logError("findEmployeeIdByEmailAndCompany", error, { email, companyId });
      throw error;
    }
  }

  /**
   * All policyIds a single employee has configured under this company, regardless of
   * isOnBoradingMailSent — used by the single-employee test-trigger, which always resends
   * without touching the real bulk/cron send bookkeeping.
   */
  async findEmployeeOnboardingPolicyIds(
    employeeId: number,
    companyId: number,
    policyIds?: number[] | null,
  ): Promise<number[]> {
    try {
      const qb = this.policyEnrollmentEmployeePolicyMapRepository
        .createQueryBuilder("epm")
        .innerJoin(Policy, "policy", "policy.id = epm.policyId")
        .select("DISTINCT epm.policyId", "policyId")
        .where("epm.deletedAt IS NULL")
        .andWhere("epm.employeeId = :employeeId", { employeeId })
        .andWhere("policy.companyId = :companyId", { companyId });

      if (policyIds && policyIds.length) {
        qb.andWhere("epm.policyId IN (:...policyIds)", { policyIds });
      }

      const rows = await qb.getRawMany<{ policyId: number }>();
      return rows.map((row) => Number(row.policyId));
    } catch (error) {
      this.logError("findEmployeeOnboardingPolicyIds", error, {
        employeeId,
        companyId,
        policyIds,
      });
      throw error;
    }
  }

  // Validate that employee is related to policy
  async validateEmployeePolicyRelation(
    employeeId: number,
    policyId: number,
  ): Promise<PolicyEnrollmentEmployeePolicyMap | null> {
    return this.policyEnrollmentEmployeePolicyMapRepository.findOne({
      where: { policyId, employeeId },
      relations: ["employee", "policy", "policy.policyType"],
    });
  }

  // Find employees with pending enrollment for a policy
  // Logic: Employee exists in policy_enrollment_employee_policy_map but NOT in policy_employee_enrollment
  async findEmployeesWithPendingEnrollment(
    policyId: number,
  ): Promise<PolicyEnrollmentEmployee[]> {
    return this.policyEnrollmentEmployeeRepository
      .createQueryBuilder("emp")
      .innerJoin(
        PolicyEnrollmentEmployeePolicyMap,
        "epm",
        "epm.employeeId = emp.id AND epm.policyId = :policyId",
        { policyId },
      )
      .leftJoin(
        PolicyEmployeeEnrollment,
        "pee",
        "pee.employeeId = emp.id AND pee.policyId = :policyId",
        { policyId },
      )
      .where("pee.id IS NULL") // Employee not enrolled yet
      .andWhere("epm.deletedAt IS NULL")
      .orderBy("emp.id", "ASC")
      .getMany();
  }

  /**
   * Validate that employee, policy, and auth config exist and are properly related
   */
  async validateEntities(
    employeeId: number,
    policyId: number,
  ): Promise<{
    employee: PolicyEnrollmentEmployee;
    policy: Policy;
    authConfig: CompanyAuthenticationConfig;
  }> {
    // Validate relationships
    const employeePolicyMap = await this.validateEmployeePolicyRelation(
      employeeId,
      policyId,
    );
    if (!employeePolicyMap) {
      throw new BadRequestException(
        "Employee does not belong to the specified policy",
      );
    }

    // Find auth config
    const authConfig = await this.findCompanyAuthConfigByCompanyId(
      employeePolicyMap.policy.companyId,
    );
    if (!authConfig) {
      throw new NotFoundException(
        `Company authentication config not found for company ${employeePolicyMap.policy.companyId}`,
      );
    }

    return {
      employee: employeePolicyMap.employee,
      policy: employeePolicyMap.policy,
      authConfig,
    };
  }

  async validateGroupedInitialOnboardingEntities(
    employeeId: number,
    policyIds: number[],
  ): Promise<{
    employee: PolicyEnrollmentEmployee;
    policies: Policy[];
    authConfig: CompanyAuthenticationConfig;
  }> {
    const uniquePolicyIds = [...new Set(policyIds.filter(Boolean))];

    if (!uniquePolicyIds.length) {
      throw new BadRequestException("At least one policy is required");
    }

    const employeePolicyMaps =
      await this.policyEnrollmentEmployeePolicyMapRepository.find({
        where: uniquePolicyIds.map((policyId) => ({
          employeeId,
          policyId,
        })),
        relations: ["employee", "policy", "policy.company", "policy.policyType"],
      });

    if (employeePolicyMaps.length !== uniquePolicyIds.length) {
      throw new BadRequestException(
        "Employee does not belong to one or more specified policies",
      );
    }

    const employee = employeePolicyMaps[0]?.employee;
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const policies = uniquePolicyIds.map((policyId) => {
      const employeePolicyMap = employeePolicyMaps.find(
        (mapping) => mapping.policyId === policyId,
      );
      return employeePolicyMap?.policy;
    });

    if (policies.some((policy) => !policy)) {
      throw new NotFoundException("One or more policies were not found");
    }

    const companyId = policies[0].companyId;
    const hasDifferentCompany = policies.some(
      (policy) => policy.companyId !== companyId,
    );

    if (hasDifferentCompany) {
      throw new BadRequestException(
        "All onboarding policies in a grouped request must belong to the same company",
      );
    }

    const authConfig = await this.findCompanyAuthConfigByCompanyId(companyId);
    if (!authConfig) {
      throw new NotFoundException(
        `Company authentication config not found for company ${companyId}`,
      );
    }

    return {
      employee,
      policies: policies as Policy[],
      authConfig,
    };
  }

  /**
   * Validate user exists
   */
  async validateUserExists(userId: number): Promise<User> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  /**
   * Get policy with company authentication config
   */
  async findPolicyWithAuthConfig(policyId: number): Promise<{
    policy: Policy;
    authConfig: CompanyAuthenticationConfig;
  }> {
    const policy = await this.findPolicyById(policyId);
    if (!policy) {
      throw new NotFoundException(`Policy with ID ${policyId} not found`);
    }

    const authConfig = await this.findCompanyAuthConfigByCompanyId(
      policy.companyId,
    );
    if (!authConfig) {
      throw new NotFoundException(
        `Company authentication config not found for company ${policy.companyId}`,
      );
    }

    return {
      policy,
      authConfig,
    };
  }

  async getEnrollmentConfirmationDetails(
    employeeId: number,
    policyId: number,
  ): Promise<{
    totalLives: number;
    dependentDetails: Array<{ name: string; relation: string }>;
    premium: number;
    selfPaid: number;
    companyPaid: number;
    sumInsured: number;
    isGstApplicable: boolean;
    showEmployeeContribution: boolean;
    showCompanyContribution: boolean;
    choices: Array<{
      componentLabel: string;
      sumInsured: number;
      premium: number;
      companyPaid: number;
      selfPaid: number;
      totalLives: number;
      dependentDetails: Array<{ name: string; relation: string }>;
      selfCovered: boolean;
      showCompanyContribution: boolean;
    }>;
  }> {
    try {
      this.logInfo("getEnrollmentConfirmationDetails", undefined, {
        employeeId,
        policyId,
      });

      // First, get the policy employee enrollment record
      const policyEmployeeEnrollment =
        await this.policyEmployeeEnrollmentRepository.findOne({
          where: {
            employeeId,
            policyId,
            employeeEnrollmentStatusKey: EMPLOYEE_ENROLLMENT_STATUS_ENROLLED,
          },
        });

      if (!policyEmployeeEnrollment) {
        throw new NotFoundException(
          `Policy enrollment not found for employee ${employeeId} and policy ${policyId}`,
        );
      }

      // Get all policy-level dependents (for fallback when no choices)
      const allDependents = await this.policyEnrollmentDependentRepository.find({
        where: { employeeId, policyId },
      });

      const dependentDetails = allDependents.map((d) => ({
        name: d.name || "",
        relation: d.relation || "",
      }));

      // Resolve GST applicability and contribution visibility from policy config
      let isGstApplicable = true;
      let showEmployeeContribution = true;
      let showCompanyContribution = true;
      try {
        const policyConfig = await this.policyConfigurationRepository
          .createQueryBuilder("pc")
          .where("pc.policyId = :policyId", { policyId })
          .andWhere("pc.deletedAt IS NULL")
          .orderBy("pc.updatedAt", "DESC")
          .getOne();
        const cfg = policyConfig?.policyConfiguration as any;
        const constraints = cfg?.constraints;
        if (constraints) {
          isGstApplicable = constraints.gstApplicable !== false && constraints.showGstToEmployee !== false;
          showEmployeeContribution = constraints.showEmployeeContribution !== false;
        }
        // showCompanyContribution requires showEmployeeContribution AND at least one component has showCompanyContribution: true
        const components: any[] = cfg?.policyComponentsConfiguration?.components ?? [];
        const anyComponentShowsCompany = components.some((c: any) => c.showCompanyContribution === true);
        showCompanyContribution = showEmployeeContribution && anyComponentShowsCompany;
      } catch {
        // Keep defaults on config fetch failure
      }

      // Get per-component choices with their specific members
      const [enrollmentChoices, componentConfigs] = await Promise.all([
        this.policyEmployeeEnrollmentChoiceRepository.find({
          where: { employeeEnrollmentId: policyEmployeeEnrollment.id },
          order: { id: "ASC" },
        }),
        this.policyComponentsConfigDetailRepository.find({
          where: { policyId },
          select: ["id", "showCompanyContribution"],
        }),
      ]);
      const showCompanyContributionMap = new Map<number, boolean>(
        componentConfigs.map((c) => [c.id, c.showCompanyContribution ?? true]),
      );

      // Build a map of dependentId → dependent for quick lookup
      const dependentMap = new Map(allDependents.map((d) => [d.id, d]));

      // Fetch policy template once to determine Self eligibility per component
      const policyTemplate = await this.findLivePolicyTemplateByPolicyId(policyId);
      this.logInfo(
        "getEnrollmentConfirmationDetails",
        policyTemplate ? "policyTemplate resolved" : "policyTemplate not found — selfCovered will be false for all components",
        { employeeId, policyId, hasPolicyTemplate: !!policyTemplate },
      );

      const getEligibleRelationsForChoice = (c: any): string[] => {
        const componentId = Number(c.policyComponentActionTypeId);
        const label = c.policyComponentActionLabel;

        if (!policyTemplate) {
          this.logInfo(
            "getEnrollmentConfirmationDetails",
            "getEligibleRelationsForChoice: no policyTemplate, returning []",
            { employeeId, policyId, componentId, label },
          );
          return [];
        }

        const baseMainId = Number(policyTemplate.basePolicy?.mainPolicyId);
        if (baseMainId === componentId) {
          const relations = policyTemplate.basePolicy?.eligibleRelations || [];
          this.logInfo(
            "getEnrollmentConfirmationDetails",
            "getEligibleRelationsForChoice: matched basePolicy main",
            { employeeId, policyId, componentId, label, eligibleRelations: relations },
          );
          return relations;
        }

        const parentalMainId = Number(policyTemplate.parentalPolicy?.mainPolicyId);
        if (parentalMainId === componentId) {
          const relations = policyTemplate.parentalPolicy?.eligibleRelations || [];
          this.logInfo(
            "getEnrollmentConfirmationDetails",
            "getEligibleRelationsForChoice: matched parentalPolicy main",
            { employeeId, policyId, componentId, label, eligibleRelations: relations },
          );
          return relations;
        }

        if (policyTemplate.basePolicy?.addonIds) {
          const addon = (policyTemplate.basePolicy.addonIds as any[]).find(
            (a) => Number(a.optionId) === componentId,
          );
          if (addon) {
            const relations = addon.eligibleRelations || [];
            this.logInfo(
              "getEnrollmentConfirmationDetails",
              "getEligibleRelationsForChoice: matched basePolicy addon",
              { employeeId, policyId, componentId, label, addonOptionId: addon.optionId, eligibleRelations: relations },
            );
            return relations;
          }
        }

        if (policyTemplate.parentalPolicy?.addonIds) {
          const addon = (policyTemplate.parentalPolicy.addonIds as any[]).find(
            (a) => Number(a.optionId) === componentId,
          );
          if (addon) {
            const relations = addon.eligibleRelations || [];
            this.logInfo(
              "getEnrollmentConfirmationDetails",
              "getEligibleRelationsForChoice: matched parentalPolicy addon",
              { employeeId, policyId, componentId, label, addonOptionId: addon.optionId, eligibleRelations: relations },
            );
            return relations;
          }
        }

        this.logInfo(
          "getEnrollmentConfirmationDetails",
          "getEligibleRelationsForChoice: no template match for component, returning []",
          { employeeId, policyId, componentId, label },
        );
        return [];
      };

      // For each choice, fetch its specific choice-dependent links
      const choices = await Promise.all(
        enrollmentChoices
          .filter((c) => c.policyComponentActionLabel)
          .map(async (c) => {
            const choiceDeps = await this.policyEmployeeEnrollmentChoiceDependentRepository.find({
              where: { employeeEnrollmentChoiceId: c.id },
            });

            const choiceDependentDetails = choiceDeps
              .map((cd) => dependentMap.get(cd.dependentId))
              .filter((d): d is typeof allDependents[0] => !!d)
              .map((d) => ({ name: d.name || "", relation: d.relation || "" }));

            const eligibleRelations = getEligibleRelationsForChoice(c);
            const selfCovered = eligibleRelations.some(
              (r: string) => r.toLowerCase() === "self",
            );
            const totalLives = choiceDependentDetails.length + (selfCovered ? 1 : 0);

            this.logInfo(
              "getEnrollmentConfirmationDetails",
              "choice selfCovered resolved",
              {
                employeeId,
                policyId,
                choiceId: c.id,
                componentLabel: c.policyComponentActionLabel,
                componentId: c.policyComponentActionTypeId,
                componentType: c.policyComponentActionType,
                eligibleRelations,
                selfCovered,
                choiceDepsCount: choiceDeps.length,
                totalLives,
              },
            );

            return {
              componentLabel: c.policyComponentActionLabel!,
              sumInsured: c.sumInsured,
              // Prefer the prorated columns — they equal the full value
              // whenever proration doesn't apply, so this is always safe to
              // read unconditionally. Without this, the confirmation email
              // showed the full annual premium even when the employee had
              // just seen (and confirmed) a correctly prorated amount on
              // screen — a real, user-visible mismatch.
              premium: c.proratedPremium ?? c.premium,
              companyPaid: c.proratedCompanyPay ?? c.companyPay,
              selfPaid: c.proratedEmployeePay ?? c.employeePay,
              totalLives,
              dependentDetails: choiceDependentDetails,
              selfCovered,
              showCompanyContribution: showCompanyContributionMap.get(
                Number(c.policyComponentActionTypeId),
              ) ?? true,
            };
          }),
      );

      const result = {
        totalLives: allDependents.length + 1,
        dependentDetails,
        premium: policyEmployeeEnrollment.totalPremium,
        selfPaid: policyEmployeeEnrollment.totalEmployeePay,
        companyPaid: policyEmployeeEnrollment.totalCompanyPay,
        sumInsured: policyEmployeeEnrollment.sumInsured,
        isGstApplicable,
        showEmployeeContribution,
        showCompanyContribution,
        choices,
      };

      this.logInfo(
        "getEnrollmentConfirmationDetails",
        "enrollment confirmation details retrieved successfully",
        { employeeId, policyId, result },
      );

      return result;
    } catch (error) {
      this.logError("getEnrollmentConfirmationDetails", error, {
        employeeId,
        policyId,
      });
      throw error;
    }
  }

  /**
   * Find employee-policy mappings for date range
   */
  async findEmployeePolicyMappingsForDateRange(
    from: Date,
    to: Date,
  ): Promise<PolicyEnrollmentEmployeePolicyMap[]> {
    return this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .leftJoinAndSelect("epm.employee", "employee")
      .leftJoinAndSelect("epm.policy", "policy")
      .where("epm.enrollmentStartDate >= :from", { from })
      .andWhere("epm.enrollmentStartDate < :to", { to })
      .andWhere("epm.deletedAt IS NULL")
      .orderBy("epm.policyId", "ASC")
      .getMany();
  }

  /**
   * Find company authentication mapping by company ID
   */
  async findCompanyAuthMappingByCompanyId(
    companyId: number,
  ): Promise<CompanyAuthenticationMapping | null> {
    return this.companyAuthMappingRepository
      .createQueryBuilder("cam")
      .leftJoinAndSelect("cam.authenticationMethod", "authMethod")
      .where("cam.companyId = :companyId", { companyId })
      .andWhere("cam.configId IS NULL")
      .andWhere("cam.isEnabled = true")
      .andWhere("authMethod.isActive = true")
      .getOne();
  }

  async countActiveDependentsByEmployeePolicy(
    employeeId: number,
    policyId: number,
  ): Promise<number> {
    return this.policyEnrollmentDependentRepository.count({
      where: { employeeId, policyId },
    });
  }

  /**
   * Find employee policies for date range
   */
  async findEmployeePoliciesNotEnrolled(
    employeeId: number,
  ): Promise<PolicyEnrollmentEmployeePolicyMap[]> {
    return this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .leftJoinAndSelect("epm.employee", "employee")
      .leftJoinAndSelect("epm.policy", "policy")
      .where("epm.employeeId = :employeeId", { employeeId })
      .andWhere("epm.deletedAt IS NULL")
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM policy_employee_enrollment pee
          WHERE pee.employee_id = epm.employee_id
            AND pee.policy_id = epm.policy_id
            AND pee.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
            AND pee.deleted_at IS NULL
        )`,
      )
      .orderBy("epm.policyId", "ASC")
      .getMany();
  }

  async findAllEmployeePolicies(
    employeeId: number,
  ): Promise<PolicyEnrollmentEmployeePolicyMap[]> {
    return this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .leftJoinAndSelect("epm.employee", "employee")
      .leftJoinAndSelect("epm.policy", "policy")
      .where("epm.employeeId = :employeeId", { employeeId })
      .andWhere("epm.deletedAt IS NULL")
      .orderBy("epm.policyId", "ASC")
      .getMany();
  }

  async findEmployeePoliciesForDateRange(
    employeeId: number,
    from: Date,
    to: Date,
  ): Promise<PolicyEnrollmentEmployeePolicyMap[]> {
    return this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .leftJoinAndSelect("epm.employee", "employee")
      .leftJoinAndSelect("epm.policy", "policy")
      .where("epm.employeeId = :employeeId", { employeeId })
      .andWhere("epm.enrollmentStartDate >= :from", { from })
      .andWhere("epm.enrollmentStartDate < :to", { to })
      .andWhere("epm.deletedAt IS NULL")
      .orderBy("epm.policyId", "ASC")
      .getMany();
  }

  /**
   * Find policy employees for date range
   */
  async findPolicyEmployeesForDateRange(
    policyId: number,
    from: Date,
    to: Date,
    employeeIds?: string[],
  ): Promise<PolicyEnrollmentEmployeePolicyMap[]> {
    const query = this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .leftJoinAndSelect("epm.employee", "employee")
      .leftJoinAndSelect("epm.policy", "policy")
      .where("epm.policyId = :policyId", { policyId })
      .andWhere("epm.enrollmentStartDate >= :from", { from })
      .andWhere("epm.enrollmentStartDate < :to", { to })
      .andWhere("epm.deletedAt IS NULL")
      .orderBy("epm.employeeId", "ASC");

    if (employeeIds && employeeIds.length > 0) {
      query.andWhere("epm.employeeId IN (:...employeeIds)", { employeeIds });
    }

    return query.getMany();
  }

  /**
   * Find company employee-policy mappings for date range
   */
  async findCompanyEmployeePolicyMappingsForDateRange(
    companyId: number,
    from: Date,
    to: Date,
    employeeIds?: string[],
  ): Promise<PolicyEnrollmentEmployeePolicyMap[]> {
    const query = this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .leftJoinAndSelect("epm.employee", "employee")
      .leftJoinAndSelect("epm.policy", "policy")
      .where("employee.companyId = :companyId", { companyId })
      .andWhere("epm.enrollmentStartDate >= :from", { from })
      .andWhere("epm.enrollmentStartDate < :to", { to })
      .andWhere("epm.deletedAt IS NULL")
      .orderBy("epm.policyId", "ASC")
      .addOrderBy("epm.employeeId", "ASC");

    if (employeeIds && employeeIds.length > 0) {
      query.andWhere("epm.employeeId IN (:...employeeIds)", { employeeIds });
    }

    return query.getMany();
  }

  /**
   * Get policy employees with enrollmentEndDate matching trigger date
   */
  async getPolicyEmployeesWithMatchingEndDate(
    policyId: number,
    triggerDate: Date,
    employeeIds?: number[],
    includeAllEmployees = true,
  ): Promise<PolicyEnrollmentEmployeePolicyMap[]> {
    const query = this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .leftJoinAndSelect("epm.employee", "employee")
      .leftJoinAndSelect("epm.policy", "policy")
      .where("epm.policyId = :policyId", { policyId })
      .andWhere("DATE(epm.enrollmentEndDate) = DATE(:triggerDate)", {
        triggerDate,
      })
      .andWhere("epm.deletedAt IS NULL")
      .orderBy("epm.employeeId", "ASC");

    if (!includeAllEmployees && employeeIds && employeeIds.length > 0) {
      query.andWhere("epm.employeeId IN (:...employeeIds)", { employeeIds });
    }

    return query.getMany();
  }

  /**
   * Get all not-yet-enrolled employees for a policy (no date window filter — for immediate manual reminders)
   */
  async getPolicyEmployeesNotEnrolled(
    policyId: number,
    employeeIds?: number[],
    includeAllEmployees = true,
  ): Promise<PolicyEnrollmentEmployeePolicyMap[]> {
    const query = this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .leftJoinAndSelect("epm.employee", "employee")
      .leftJoinAndSelect("epm.policy", "policy")
      .where("epm.policyId = :policyId", { policyId })
      .andWhere("epm.deletedAt IS NULL")
      .andWhere(
        `NOT EXISTS (
          SELECT 1 FROM policy_employee_enrollment pee
          WHERE pee.employee_id = epm.employee_id
            AND pee.policy_id = epm.policy_id
            AND pee.employee_enrollment_status_key = 'EMPLOYEE_ENROLLMENT_STATUS_ENROLLED'
            AND pee.deleted_at IS NULL
        )`,
      )
      .orderBy("epm.employeeId", "ASC");

    if (!includeAllEmployees && employeeIds && employeeIds.length > 0) {
      query.andWhere("epm.employeeId IN (:...employeeIds)", { employeeIds });
    }

    return query.getMany();
  }

  /**
   * Get company employees with enrollmentEndDate matching trigger date
   */
  async getCompanyEmployeesWithMatchingEndDate(
    companyId: number,
    triggerDate: Date,
    employeeIds?: number[],
    includeAllEmployees = true,
  ): Promise<PolicyEnrollmentEmployeePolicyMap[]> {
    const query = this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .leftJoinAndSelect("epm.employee", "employee")
      .leftJoinAndSelect("epm.policy", "policy")
      .where("employee.companyId = :companyId", { companyId })
      .andWhere("DATE(epm.enrollmentEndDate) = DATE(:triggerDate)", {
        triggerDate,
      })
      .andWhere("epm.deletedAt IS NULL")
      .orderBy("epm.policyId", "ASC")
      .addOrderBy("epm.employeeId", "ASC");

    if (!includeAllEmployees && employeeIds && employeeIds.length > 0) {
      query.andWhere("epm.employeeId IN (:...employeeIds)", { employeeIds });
    }

    return query.getMany();
  }

  /**
   * Get employee policies with enrollmentEndDate matching trigger date
   */
  async getEmployeePoliciesWithMatchingEndDate(
    employeeId: number,
    triggerDate: Date,
  ): Promise<PolicyEnrollmentEmployeePolicyMap[]> {
    return this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .leftJoinAndSelect("epm.employee", "employee")
      .leftJoinAndSelect("epm.policy", "policy")
      .where("epm.employeeId = :employeeId", { employeeId })
      .andWhere("DATE(epm.enrollmentEndDate) = DATE(:triggerDate)", {
        triggerDate,
      })
      .andWhere("epm.deletedAt IS NULL")
      .orderBy("epm.policyId", "ASC")
      .getMany();
  }

  /**
   * Get all employees with enrollmentEndDate matching trigger date
   */
  async getAllEmployeesWithMatchingEndDate(
    triggerDate: Date,
  ): Promise<PolicyEnrollmentEmployeePolicyMap[]> {
    return this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .leftJoinAndSelect("epm.employee", "employee")
      .leftJoinAndSelect("epm.policy", "policy")
      .where("DATE(epm.enrollmentEndDate) = DATE(:triggerDate)", {
        triggerDate,
      })
      .andWhere("epm.deletedAt IS NULL")
      .orderBy("epm.policyId", "ASC")
      .addOrderBy("epm.employeeId", "ASC")
      .getMany();
  }

  async getUpcomingPendingEnrollmentReminderRecords(
    fromDateString: string,
    toDateString: string | null,
  ): Promise<
    Array<{
      companyId: number;
      employeeId: number;
      enrollmentEndDate: string | Date;
    }>
  > {
    const queryBuilder = this.policyEnrollmentEmployeePolicyMapRepository
      .createQueryBuilder("epm")
      .innerJoin("epm.policy", "policy")
      .leftJoin(
        PolicyEmployeeEnrollment,
        "pee",
        [
          "pee.policyId = epm.policyId",
          "pee.employeeId = epm.employeeId",
          "pee.deletedAt IS NULL",
          "pee.employeeEnrollmentStatusKey = :enrolledStatusKey",
        ].join(" AND "),
        { enrolledStatusKey: EMPLOYEE_ENROLLMENT_STATUS_ENROLLED },
      )
      .select("policy.companyId", "companyId")
      .addSelect("epm.employeeId", "employeeId")
      .addSelect("epm.enrollmentEndDate", "enrollmentEndDate")
      .distinct(true)
      .where("DATE(epm.enrollmentEndDate) >= DATE(:fromDateString)", {
        fromDateString,
      })
      .andWhere("epm.deletedAt IS NULL")
      .andWhere("pee.id IS NULL");

    // Open-ended when toDateString is null (used by "Everyday" reminders, which have no
    // fixed look-ahead); otherwise keep the bounded window used by exact-day reminders.
    if (toDateString) {
      queryBuilder.andWhere(
        "DATE(epm.enrollmentEndDate) <= DATE(:toDateString)",
        { toDateString },
      );
    }

    const [query, parameters] = queryBuilder.getQueryAndParameters();
    this.logInfo(
      "getUpcomingPendingEnrollmentReminderRecords",
      "Executing enrollment reminder query",
      {
        fromDateString,
        toDateString,
        query,
        parameters,
      },
    );

    const records = await queryBuilder.getRawMany<{
      companyId: string | number;
      employeeId: string | number;
      enrollmentEndDate: string | Date;
    }>();

    return records
      .map((record) => ({
        companyId: Number(record.companyId),
        employeeId: Number(record.employeeId),
        enrollmentEndDate: record.enrollmentEndDate,
      }))
      .filter(
        (record) =>
          Number.isFinite(record.companyId) &&
          Number.isFinite(record.employeeId) &&
          Boolean(record.enrollmentEndDate),
      );
  }

  async getCompanyReminderDaysConfig(
    companyIds: number[],
  ): Promise<Array<{ companyId: number; companyPortalAuthConfig: Record<string, unknown> | null }>> {
    if (!companyIds.length) {
      return [];
    }

    const records = await this.companyAuthConfigRepository
      .createQueryBuilder("cac")
      .select(["cac.companyId", "cac.companyPortalAuthConfig"])
      .where("cac.companyId IN (:...companyIds)", { companyIds })
      .getMany();

    return records.map((record) => ({
      companyId: record.companyId,
      companyPortalAuthConfig:
        (record.companyPortalAuthConfig as Record<string, unknown> | null) ??
        null,
    }));
  }

  // Every company's reminder-day config, unfiltered. Used to detect "Everyday"
  // companies before the record fetch, so the look-ahead window can be chosen.
  async getAllCompanyReminderDaysConfig(): Promise<
    Array<{ companyId: number; companyPortalAuthConfig: Record<string, unknown> | null }>
  > {
    const records = await this.companyAuthConfigRepository
      .createQueryBuilder("cac")
      .select(["cac.companyId", "cac.companyPortalAuthConfig"])
      .getMany();

    return records.map((record) => ({
      companyId: record.companyId,
      companyPortalAuthConfig:
        (record.companyPortalAuthConfig as Record<string, unknown> | null) ??
        null,
    }));
  }

  /**
   * Enrolled employees of a company who are "enrolled with choices" and NOT auto-submitted
   * after their enrollment window lapsed (pee.isAutoSubmitted), and who have not already been
   * marked isConfirmationMailSent on their policy_enrollment_employee_policy_map row.
   *
   * "Enrolled with choices" is checked via enrollment_addition_batch_id → document_processing_file:
   * if that batch resolves to a row, it must be document_type = policy_employee_enrollment_data
   * and bypass_policy_configuration = false (bypass_policy_configuration also covers premium-based
   * inception uploads, which bypass choices even when document_type looks like a normal
   * enrollment-data upload — see policy.service.ts#shouldBypassPolicyConfigurationForInception).
   * If the batch DOESN'T resolve to any row at all (enrollment_addition_batch_id is null, or the
   * enrollment came from a flow that never stamps it, e.g. the endorsement-request path), the
   * employee is included by default — there's no evidence they didn't make an active choice, and
   * in production most enrollment rows have no batch link at all, so requiring a positive match
   * here would exclude nearly everyone.
   */
  async getEnrolledEmployeesByCompany(
    companyId: number,
    employeeIds?: number[],
    policyIds?: number[] | null
  ): Promise<
    Array<{
      employeeId: number;
      policyIds: number[];
      mappingIds: number[];
      email: string | null;
      employeeName: string | null;
      fullName: string | null;
      employeeCompanyId: string | null;
    }>
  > {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: LOG_STATUS.SUCCESS as LogStatus,
        location: "OnboardingRepository",
        method: "getEnrolledEmployeesByCompany",
        payload: { companyId, employeeIds, policyIds },
        messageData: "Fetching enrolled employees for company",
      }),
    });

    try {
      // Shared filter — active policies only (current date must fall within the
      // policy's own from/to period), scoped to employees who actively made choices
      // (not bypass-uploaded, not auto-submitted) and whose confirmation mail hasn't
      // already been sent for that mapping row. Factored out so both the aggregated
      // read below and the employee-detail lookup apply identical conditions without
      // ever collecting a per-employee id array as bound parameters — on a company the
      // size of 190550 (10k+ matching employees) an `id IN (:...ids)` built from that
      // array pushes past Postgres's per-statement bind-parameter ceiling ("bind message
      // has N parameter formats but 0 parameters"). A correlated subquery re-evaluates
      // the same WHERE clause inside Postgres itself, so the bound-parameter count stays
      // fixed (companyId + a handful of scalars/bounded arrays) no matter how many rows
      // match.
      const buildEnrolledEmployeeIdFilter = () => {
        const qb = this.policyEmployeeEnrollmentRepository
          .createQueryBuilder("pee")
          .innerJoin("pee.policy", "policy")
          .innerJoin(
            PolicyEnrollmentEmployeePolicyMap,
            "epm",
            "epm.employeeId = pee.employeeId AND epm.policyId = pee.policyId AND epm.deletedAt IS NULL",
          )
          .where("pee.companyId = :companyId", { companyId })
          .andWhere(
            "pee.employeeEnrollmentStatusKey = :enrolledStatusKey",
            { enrolledStatusKey: EMPLOYEE_ENROLLMENT_STATUS_ENROLLED }
          )
          .andWhere("pee.deletedAt IS NULL")
          .andWhere("pee.isAutoSubmitted = false")
          .andWhere("policy.policyFrom <= CURRENT_DATE")
          .andWhere("policy.policyTo >= CURRENT_DATE")
          .andWhere("(epm.isConfirmationMailSent IS NULL OR epm.isConfirmationMailSent = false)")
          .andWhere(
            "NOT EXISTS (SELECT 1 FROM document_processing_file dpf WHERE dpf.document_id = epm.enrollment_addition_batch_id AND (dpf.bypass_policy_configuration = true OR dpf.document_type <> :enrollmentDataDocumentType))",
            { enrollmentDataDocumentType: DOCUMENT_TYPE_POLICY_EMPLOYEE_ENROLLMENT_DATA },
          );

        if (employeeIds && employeeIds.length > 0) {
          qb.andWhere("pee.employeeId IN (:...employeeIds)", { employeeIds });
        }
        if (policyIds && policyIds.length > 0) {
          qb.andWhere("pee.policyId IN (:...policyIds)", { policyIds });
        }
        return qb;
      };

      const queryBuilder = buildEnrolledEmployeeIdFilter()
        .select("pee.employeeId", "employeeId")
        .addSelect("array_agg(DISTINCT pee.policyId)", "policyIds")
        .addSelect(
          "array_agg(DISTINCT epm.id) FILTER (WHERE epm.id IS NOT NULL)",
          "mappingIds",
        )
        .groupBy("pee.employeeId");

      const enrollmentResults = await queryBuilder.getRawMany<{
        employeeId: string;
        policyIds: string;
        mappingIds: string | null;
      }>();

      if (!enrollmentResults || enrollmentResults.length === 0) {
        return [];
      }

      // Employee-detail lookup via correlated subquery instead of `id: In(uniqueEmployeeIds)` —
      // see comment above buildEnrolledEmployeeIdFilter for why.
      const employeeIdSubQuery = buildEnrolledEmployeeIdFilter().select("pee.employeeId");
      const employees = await this.policyEnrollmentEmployeeRepository
        .createQueryBuilder("emp")
        .select(["emp.id", "emp.email", "emp.employeeName", "emp.fullName", "emp.employeeCompanyId"])
        .where(`emp.id IN (${employeeIdSubQuery.getQuery()})`)
        .setParameters(employeeIdSubQuery.getParameters())
        .getMany();

      // Create a map of employeeId -> employee details
      const employeeMap = new Map<
        number,
        {
          email: string | null;
          employeeName: string | null;
          fullName: string | null;
          employeeCompanyId: string | null;
        }
      >();
      employees.forEach((emp) => {
        employeeMap.set(emp.id, {
          email: emp.email || null,
          employeeName: emp.employeeName || null,
          fullName: emp.fullName || null,
          employeeCompanyId: emp.employeeCompanyId || null,
        });
      });

      // Combine results
      return enrollmentResults.map((result) => {
        const details = employeeMap.get(Number(result.employeeId));
        return {
          employeeId: Number(result.employeeId),
          policyIds: (result.policyIds as unknown as number[]) || [],
          mappingIds: (result.mappingIds as unknown as number[]) || [],
          email: details?.email ?? null,
          employeeName: details?.employeeName ?? null,
          fullName: details?.fullName ?? null,
          employeeCompanyId: details?.employeeCompanyId ?? null,
        };
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: LOG_STATUS.FAILURE as LogStatus,
          location: "OnboardingRepository",
          method: "getEnrolledEmployeesByCompany",
          payload: { companyId, employeeIds },
          messageData: error instanceof Error ? error.message : "Unknown error",
        }),
      });
      throw error;
    }
  }

  /**
   * Chunked so a single UPDATE never exceeds Postgres's ~65,535 bound-parameter
   * limit — mappingIds can run well past the employee count on large companies
   * (multiple eligible policies per employee), so this can't assume a single
   * WHERE id IN (...) is always safe at 10K+ scale.
   */
  async markConfirmationMailSent(mappingIds: number[]): Promise<void> {
    const CHUNK_SIZE = 2000;
    for (let i = 0; i < mappingIds.length; i += CHUNK_SIZE) {
      const chunk = mappingIds.slice(i, i + CHUNK_SIZE);
      await this.policyEnrollmentEmployeePolicyMapRepository
        .createQueryBuilder()
        .update(PolicyEnrollmentEmployeePolicyMap)
        .set({ isConfirmationMailSent: true })
        .whereInIds(chunk)
        .execute();
    }
  }

  async acceptTerms(userId: number, tcVersion?: number): Promise<void> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "OnboardingRepository",
        method: "acceptTerms",
        payload: { userId, tcVersion },
        messageData: "method invoked",
      }),
    });
    try {
      const employee = await this.policyEnrollmentEmployeeRepository.findOne({ where: { id: userId } });
      if (!employee) {
        throw new NotFoundException(errorMessages.userNotFound);
      }
      employee.isTCAccepted = true;
      employee.tcStatus = "accepted";
      if (tcVersion !== undefined) {
        employee.tcAcceptedVersion = tcVersion;
        employee.tcAcceptedAt = new Date();
      }
      await this.policyEnrollmentEmployeeRepository.save(employee);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "OnboardingRepository",
          method: "acceptTerms",
          payload: { userId },
          messageData: "Terms accepted successfully",
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "OnboardingRepository",
          method: "acceptTerms",
          payload: { userId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async withdrawTerms(userId: number): Promise<void> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "OnboardingRepository",
        method: "withdrawTerms",
        payload: { userId },
        messageData: "method invoked",
      }),
    });
    try {
      const employee = await this.policyEnrollmentEmployeeRepository.findOne({ where: { id: userId } });
      if (!employee) {
        throw new NotFoundException(errorMessages.userNotFound);
      }
      employee.isTCAccepted = false;
      employee.tcAcceptedVersion = null;
      employee.tcAcceptedAt = null;
      employee.tcWithdrawnAt = new Date();
      employee.tcStatus = "withdrawn";
      await this.policyEnrollmentEmployeeRepository.save(employee);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "OnboardingRepository",
          method: "withdrawTerms",
          payload: { userId },
          messageData: "Terms withdrawn successfully",
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "OnboardingRepository",
          method: "withdrawTerms",
          payload: { userId },
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getUserTcStatus(userId: number): Promise<{
    isTCAccepted: boolean;
    tcAcceptedVersion: number | null;
    tcAcceptedAt: Date | null;
    tcWithdrawnAt: Date | null;
    tcStatus: string | null;
  }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "OnboardingRepository",
        method: "getUserTcStatus",
        payload: { userId },
        messageData: "method invoked",
      }),
    });
    try {
      const employee = await this.policyEnrollmentEmployeeRepository.findOne({ where: { id: userId } });
      if (!employee) {
        throw new NotFoundException(errorMessages.userNotFound);
      }
      return {
        isTCAccepted: employee.isTCAccepted ?? false,
        tcAcceptedVersion: employee.tcAcceptedVersion ?? null,
        tcAcceptedAt: employee.tcAcceptedAt ?? null,
        tcWithdrawnAt: employee.tcWithdrawnAt ?? null,
        tcStatus: employee.tcStatus ?? null,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "OnboardingRepository",
          method: "getUserTcStatus",
          payload: { userId },
          messageData: error,
        }),
      });
      throw error;
    }
  }
}

