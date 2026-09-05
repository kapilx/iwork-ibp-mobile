import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, IsNull, Repository } from "typeorm";
import { addDays } from "date-fns";
import axios from "axios";
import { CompanyConfigRepository } from "./company-config.repository";
import {
  DEFAULT_SUB_DOMAIN,
  IS_NOT_EDITABLE,
  PRIORITY_LOOK_UP_HIGH_VALUE,
  TASK_CLOSED,
  TASK_LABEL,
  TASK_ORIGIN,
  TASK_STATUS_ACTIVE,
  TASK_STATUS_CLOSED,
  TASK_TYPE,
} from "../../../../service-lib/src/lib/constants";
import { CompanyAuthenticationConfig } from "../../../../service-lib/src/lib/entities/company-authentication-config.entity";
import { CompanyAuthenticationMapping } from "../../../../service-lib/src/lib/entities/company-authentication-mapping.entity";
import { CompanyPortalConfigurationDetail } from "../../../../service-lib/src/lib/entities/company-portal-configuration-detail.entity";
import { ConfigCompany } from "../../../../service-lib/src/lib/entities/config-company.entity";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { Task } from "../../../../service-lib/src/lib/entities/task.entity";
import { AuditHistoryLog } from "../../../../service-lib/src/lib/entities/audit-history-log.entity";
import { AuditHistoryLogDetail } from "../../../../service-lib/src/lib/entities/audit-history-log-detail.entity";
import { AuthenticationMethod } from "../../../../service-lib/src/lib/entities/authentication-method.entity";
import { Company } from "../../../../service-lib/src/lib/entities/company.entity";
import { FileUpload } from "../../../../service-lib/src/lib/entities/file-upload.entity";
import { AuditHistoryAction } from "../../../../service-lib/src/lib/audit-history/audit-history.constants";
import { PasswordRuleDefinition } from "../../../../service-lib/src/lib/utils/password-validation.util";
import { UpdateCompanyPortalConfigDto } from "./dto/update-company-portal-config.dto";
import { CompanyConfigSubmissionDto } from "./dto/company-config-submission.dto";
import { CompanyConfigApprovalDto } from "./dto/company-config-approval.dto";
import { UpdateCompanyPolicyFeatureDocumentDto } from "./dto/update-company-policy-feature-document.dto";
import { UpdateCompanyOnboardingMailModeDto } from "./dto/update-company-onboarding-mail-mode.dto";
import { TriggerCompanyOnboardingMailDto } from "./dto/trigger-company-onboarding-mail.dto";
import { UpsertConfigScopeDto } from "./dto/upsert-config-scope.dto";
import { CompanyPortalConfigScope } from "../../../../service-lib/src/lib/entities/company-portal-config-scope.entity";
import { ENV } from "../../../../service-lib/src/lib/environment";
const DEFAULT_APPROVAL_TASK_LEAD_DAYS = 6;

/**
 * One Offers & Benefits card as stored inside
 * `company_portal_configuration_detail.company_portal_offers_config`.
 * `id` stays numeric so the persisted contract matches what the portals
 * already consume.
 */
export interface OfferBenefitConfigItem {
  id: number;
  title: string;
  description: string;
  redirectionUrl: string;
  imageFileId: number | null;
  isEnabled: boolean;
  displayOrder: number;
}

interface OffersConfig {
  isEnabled: boolean;
  items: OfferBenefitConfigItem[];
}

export interface CompanyConfigResponse {
  companyId: number | null;
  portalConfigId?: number | null;
  subDomain: string;
  databaseConfig?: {
    id: number;
    name: string;
    host: string;
    port: number;
  } | null;
  logoFileId?: number | null;
  companyLogoId?: number | null;
  portalDashboardConfig?: Record<string, any> | null;
  companyPolicyConfig?: Record<string, any> | null;
  dependentRelationConfig?: Record<string, any> | null;
  portalBrandingConfig?: Record<string, any> | null;
  portalWellnessConfig?: Record<string, any> | null;
  companyConfigurationStatus?: {
    lid: number;
    key: string;
    value: string;
  } | null;
  passwordRules?: PasswordRuleDefinition[] | null;
  offersAndBenefits?: OfferBenefitConfigItem[];
  offersAndBenefitsEnabled?: boolean;
}

export interface CompanyPortalConfigurationResponse {
  companyId: number;
  portalConfigId?: number | null;
  subDomain?: string | null;
  inheritedCompanyIds?: number[];
  companyPortalConfig: Record<string, any>;
  companyPortalDashboardConfig: Record<string, any> | null;
  companyPolicyConfig: Record<string, any>[] | null;
  companyPortalWellnessConfig?: Record<string, any> | null;
  dependentRelationConfig?: Record<string, any> | null;
  authentication: Record<string, any>[];
  offersAndBenefits?: OfferBenefitConfigItem[];
  offersAndBenefitsEnabled?: boolean;
  comments?: string | null;
  companyConfigurationStatus?: {
    lid: number;
    key: string;
    value: string;
  } | null;
  passwordRules?: PasswordRuleDefinition[] | null;
  isDefault: boolean;
  mailServiceType?: string;
  ccEmailAddresses?: string[];
}

export interface CompanyPolicyFeatureDocumentResponse {
  companyId: number;
  documentId: number | null;
  fileName: string | null;
  uploadedAt: Date | null;
  uploadedBy: string | null;
}

export interface CompanyOnboardingMailModeResponse {
  companyId: number;
  mode: "cron" | "manual";
}

export interface CompanyConfigActionResponse {
  id: number;
  status: string | null;
  message: string;
}

export interface PortalConfigListItem {
  configId: number;
  subDomain: string | null;
  fullUrl: string | null;
  status: { lid: number; key: string; value: string } | null;
  scopeCount: number;
  createdAt: Date;
  ccEmailAddresses?: string[];
}

@Injectable()
export class CompanyConfigService {
  private readonly statusLookupKeys = {
    draft: "COMPANY_CONFIGURATION_STATUS_DRAFT",
    underReview: "COMPANY_CONFIGURATION_STATUS_UNDER_REVIEW",
    active: "COMPANY_CONFIGURATION_STATUS_ACTIVE",
    rejected: "COMPANY_CONFIGURATION_STATUS_REJECTED",
  } as const;
  private readonly companyConfigAuditEntityType = "COMPANY_CONFIGURATION";
  private readonly companyConfigApprovalTaskName = "Company Configuration Approval";

  constructor(
    private readonly companyConfigRepository: CompanyConfigRepository,
    @InjectRepository(CompanyAuthenticationMapping)
    private readonly companyAuthenticationMappingRepository: Repository<CompanyAuthenticationMapping>,
    @InjectRepository(CompanyAuthenticationConfig)
    private readonly companyAuthenticationConfigRepository: Repository<CompanyAuthenticationConfig>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(AuditHistoryLog)
    private readonly auditHistoryLogRepository: Repository<AuditHistoryLog>,
    @InjectRepository(AuditHistoryLogDetail)
    private readonly auditHistoryLogDetailRepository: Repository<AuditHistoryLogDetail>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(CompanyPortalConfigurationDetail)
    private readonly companyPortalConfigurationDetailRepository: Repository<CompanyPortalConfigurationDetail>,
    @InjectRepository(AuthenticationMethod)
    private readonly authenticationMethodRepository: Repository<AuthenticationMethod>,
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(FileUpload)
    private readonly fileUploadRepository: Repository<FileUpload>,
    private readonly dataSource: DataSource
  ) {}
  private readonly sharedAuthenticationMethodCode = "USERNAME_PASSWORD";
  private readonly sharedAuthenticationConfigKey = "DEFAULT_USERNAME_PASSWORD";
  private readonly sharedAuthenticationConfigurationCompanyId = 0;

  /**
   * Get company configuration by subdomain
   */
  async getConfigBySubDomain(subDomain: string): Promise<CompanyConfigResponse> {
    let config = await this.companyConfigRepository.findBySubDomain(subDomain);
    console.log("Config for subdomain %s:", subDomain, config);
    if (!config) {
      // If subdomain not found, get default configuration
      config = await this.companyConfigRepository.findBySubDomain(DEFAULT_SUB_DOMAIN);

      if (!config) {
        throw new NotFoundException(
          `No company configuration found and no default configuration available`
        );
      }
    }

    config = await this.attachCompanyConfigurationStatus(config);
    const passwordRules = await this.buildPasswordRules(config.companyId, config.id);
    const mapped = this.mapToResponse(config, subDomain, passwordRules);
    const offers = config.companyId
      ? await this.resolveOffersConfig(
          config.companyId,
          config.companyPortalConfigurationDetail
        )
      : { items: [], isEnabled: true };
    return {
      ...mapped,
      offersAndBenefits: offers.items,
      offersAndBenefitsEnabled: offers.isEnabled,
    };
  }

  /**
   * Get all company configurations
   */
  async getAllConfigs(): Promise<CompanyConfigResponse[]> {
    const configs = await this.companyConfigRepository.findAll();

    return Promise.all(
      configs.map(async (config) => {
        await this.attachCompanyConfigurationStatus(config);
        const passwordRules = await this.buildPasswordRules(config.companyId);
        return this.mapToResponse(config, undefined, passwordRules);
      })
    );
  }

  /**
   * Get all available authentication methods
   */
  async getAllAuthMethods(): Promise<AuthenticationMethod[]> {
    return this.authenticationMethodRepository.find({
      where: { isActive: true },
      order: { methodName: "ASC" },
    });
  }

  /**
   * Upsert company portal and authentication configuration payload
   */
  async upsertCompanyPortalConfiguration(
    payload: UpdateCompanyPortalConfigDto,
    submittedByHeader?: string | number
  ): Promise<CompanyConfigResponse> {
    const companyId = Number(payload.companyId);

    if (!payload.companyId || Number.isNaN(companyId)) {
      throw new BadRequestException("companyId is required");
    }

    const submittedBy = this.parseNullableNumber(submittedByHeader);
    const configId = payload.configId ? Number(payload.configId) : null;
    const existingConfig = payload._forceCreate
      ? null
      : configId
        ? await this.companyConfigRepository.findById(configId)
        : await this.companyConfigRepository.findByCompanyId(companyId);
    const previousConfig = existingConfig
      ? {
          ...existingConfig,
          companyPortalConfigurationDetail: existingConfig.companyPortalConfigurationDetail
            ? { ...existingConfig.companyPortalConfigurationDetail }
            : undefined,
        }
      : null;
    let config = existingConfig ?? new ConfigCompany();

    if (!existingConfig) {
      config.companyId = companyId;
      config.companyDatabaseId = payload.companyDatabaseId ?? 1;
      config.createdBy = submittedBy;
    }

    if (payload.companyDatabaseId) {
      config.companyDatabaseId = payload.companyDatabaseId;
    }

    const incomingFullUrl =
      (payload.companyPortalConfig as any)?.urlAndDomain?.fullUrl ?? null;
    if (incomingFullUrl) {
      try {
        const urlObj = new URL(incomingFullUrl);
        const slug = urlObj.hostname.split('.')[0];
        if (slug) {
          config.subDomain = slug;
        }
        config.companyPortalUrl = incomingFullUrl;
      } catch {
        // keep existing values if URL is malformed
      }
    } else {
      const defaultPortalUrl =
        ENV.COMPANY_PORTAL_URL ?? ENV["company_portal_url"] ?? null;
      const isSubDomainMissing = !config.subDomain || !config.subDomain.trim();
      if ((isSubDomainMissing || !existingConfig) && defaultPortalUrl) {
        config.companyPortalUrl = defaultPortalUrl;
      }
    }

    if (
      payload.companyPortalConfig &&
      Object.prototype.hasOwnProperty.call(payload.companyPortalConfig, "branding")
    ) {
      const branding = payload.companyPortalConfig.branding;
      config.companyLogoFileId = this.parseNullableNumber(
        branding?.companyLogoFileId ?? null
      );
    }

    if (payload.ccEmailAddresses !== undefined) {
      config.ccEmailAddresses = payload.ccEmailAddresses
        .map((email) => email?.trim())
        .filter((email): email is string => Boolean(email));
    }

    const portalConfigurationDetail =
      await this.persistPortalConfigurationDetail(
        companyId,
        config.companyPortalConfigurationDetail,
        payload,
        submittedBy
      );
    if (portalConfigurationDetail) {
      config.companyPortalConfigurationDetail = portalConfigurationDetail;
      config.companyPortalConfigurationDetailId =
        portalConfigurationDetail.id ?? null;
      config.isCompanyConfig = true;
    } else if (!config.companyPortalConfigurationDetailId) {
      config.isCompanyConfig = false;
    }

    const draftLookup = await this.getStatusLookup(
      this.statusLookupKeys.draft
    );
    if (draftLookup) {
      config.companyConfigurationStatusLid = draftLookup.id;
      config.companyConfigurationStatus = draftLookup;
    }

    this.resetApprovalDecision(config);

    config.updatedBy = submittedBy;
    const savedConfig = await this.companyConfigRepository.save(config);

    // Persist mail service type directly on the company record (same pattern as onboarding mail mode)
    if (payload.mailServiceType !== undefined) {
      const company = await this.companyRepository.findOne({ where: { id: companyId } });
      if (company) {
        company.mailServiceType = payload.mailServiceType;
        company.updatedBy = submittedBy;
        await this.companyRepository.save(company).catch(() => {});
      }
    }

    const detailedConfig =
      (await this.companyConfigRepository.findById(savedConfig.id)) ??
      savedConfig;

    await this.attachCompanyConfigurationStatus(detailedConfig);

    if (
      payload.companyPortalConfig &&
      Object.prototype.hasOwnProperty.call(payload.companyPortalConfig, "authentication")
    ) {
      const authConfigs = payload.companyPortalConfig.authentication ?? [];
      await this.syncCompanyAuthenticationMappings(
        companyId,
        authConfigs,
        submittedBy,
        configId
      );
    }

    await this.logCompanyConfigAudit({
      action: AuditHistoryAction.UPDATE,
      companyId,
      userId: submittedBy,
      previousConfig,
      currentConfig: detailedConfig,
      comments:
        payload.companyPortalConfig ?? payload.companyPortalDashboardConfig ?? null,
    });

    const passwordRules = await this.buildPasswordRules(detailedConfig.companyId);

    // Sync config to all companies in the same domain group.
    // Skip sync when this call itself is already a sync operation (prevents infinite recursion).
    if (!payload._skipSync) {
      const currentSubDomain = detailedConfig.subDomain;

      // Existing domain group members (other companies sharing this subDomain in DB before this save)
      const existingGroupMemberIds: number[] = [];
      if (currentSubDomain && currentSubDomain.trim()) {
        const domainGroupConfigs = await this.companyConfigRepository.findAllBySubDomain(currentSubDomain);
        domainGroupConfigs.forEach((c) => {
          if (c.companyId && c.companyId !== companyId) {
            existingGroupMemberIds.push(c.companyId);
          }
        });
      }

      // New desired set from the frontend (full list of companies that should stay tagged)
      const newInheritedSet = new Set<number>(
        (payload.inheritedCompanyIds ?? [])
          .map(Number)
          .filter((id) => Number.isFinite(id) && id !== companyId)
      );

      // Companies removed from the group → reset their portal config to blank
      const companiesToRemove = existingGroupMemberIds.filter((id) => !newInheritedSet.has(id));
      for (const removeId of companiesToRemove) {
        await this.resetCompanyPortalConfiguration(removeId).catch(() => {});
      }

      // Companies to sync = union of existing members still wanted + newly added
      const syncCompanyIds = new Set<number>([...existingGroupMemberIds.filter((id) => newInheritedSet.has(id)), ...newInheritedSet]);

      for (const syncId of syncCompanyIds) {
        // Only sync shared fields: URL/domain + auth methods + auth settings.
        // Branding and policy config are intentionally excluded — they are unique per company.
        const syncPayload: UpdateCompanyPortalConfigDto = {
          companyId: syncId,
          companyDatabaseId: payload.companyDatabaseId,
          companyPortalConfig: payload.companyPortalConfig
            ? {
                urlAndDomain: (payload.companyPortalConfig as any).urlAndDomain,
                authentication: payload.companyPortalConfig.authentication,
                // branding is intentionally omitted — unique per company
              }
            : undefined,
          inheritedCompanyIds: [],
          _skipSync: true,
        };
        await this.upsertCompanyPortalConfiguration(syncPayload, submittedByHeader).catch(() => {
          // don't fail the primary save if a domain group member sync fails
        });
      }
    }

    return this.mapToResponse(
      detailedConfig,
      detailedConfig.subDomain,
      passwordRules
    );
  }

  async submitCompanyConfigForApproval(
    payload: CompanyConfigSubmissionDto,
    submittedByHeader?: string | number
  ): Promise<CompanyConfigActionResponse> {
    const submittedBy = this.parseNullableNumber(submittedByHeader);
    if (!Number.isFinite(submittedBy)) {
      throw new BadRequestException(
        "A valid userId header is required to submit company configuration for approval"
      );
    }

    const companyId = Number(payload.companyId);
    if (!Number.isFinite(companyId)) {
      throw new BadRequestException("companyId is required for submission");
    }

    const config = await this.companyConfigRepository.findByCompanyId(companyId);
    if (!config) {
      throw new NotFoundException(
        `No company configuration found for companyId: ${companyId}`
      );
    }

    const previousConfig = {
      ...config,
      companyPortalConfigurationDetail: config.companyPortalConfigurationDetail
        ? { ...config.companyPortalConfigurationDetail }
        : undefined,
    };
    const underReviewLookup = await this.getStatusLookup(
      this.statusLookupKeys.underReview
    );

    if (!underReviewLookup) {
      throw new NotFoundException(
        `Lookup entry ${this.statusLookupKeys.underReview} not configured`
      );
    }

    config.companyConfigurationStatusLid = underReviewLookup.id;
    config.companyConfigurationStatus = underReviewLookup;
    this.resetApprovalDecision(config);
    config.updatedBy = submittedBy;
    await this.companyConfigRepository.save(config);

    const updatedConfig =
      (await this.companyConfigRepository.findByCompanyId(companyId)) ?? config;

    await this.attachCompanyConfigurationStatus(updatedConfig);

    const approverId = await this.findCompanyConfigApprover(submittedBy);
    if (approverId) {
      await this.createCompanyConfigurationApprovalTask(
        companyId,
        approverId,
        submittedBy,
        updatedConfig
      );
    }

    await this.logCompanyConfigAudit({
      action: AuditHistoryAction.UPDATE,
      companyId,
      userId: submittedBy,
      previousConfig,
      currentConfig: updatedConfig,
      comments: payload.comments ?? null,
    });

    return this.buildCompanyConfigActionResponse(
      companyId,
      updatedConfig,
      "Company configuration submitted for approval"
    );
  }

  async approveCompanyConfig(
    payload: CompanyConfigApprovalDto,
    approvedByHeader?: string | number
  ): Promise<CompanyConfigActionResponse> {
    const approvedBy = this.parseNullableNumber(approvedByHeader);
    if (!Number.isFinite(approvedBy)) {
      throw new BadRequestException(
        "A valid userId header is required to approve company configuration"
      );
    }

    if (
      payload.status === "REJECTED" &&
      (!payload.comments || payload.comments.trim().length === 0)
    ) {
      throw new BadRequestException(
        "Comments are required when rejecting a configuration"
      );
    }

    const companyId = Number(payload.companyId);
    if (!Number.isFinite(companyId)) {
      throw new BadRequestException("companyId is required for approval");
    }

    const config = await this.companyConfigRepository.findByCompanyId(companyId);
    if (!config) {
      throw new NotFoundException(
        `No company configuration found for companyId: ${companyId}`
      );
    }

    const previousConfig = {
      ...config,
      companyPortalConfigurationDetail: config.companyPortalConfigurationDetail
        ? { ...config.companyPortalConfigurationDetail }
        : undefined,
    };
    const statusLookupKey =
      payload.status === "APPROVED"
        ? this.statusLookupKeys.active
        : this.statusLookupKeys.rejected;

    const statusLookup = await this.getStatusLookup(statusLookupKey);
    if (!statusLookup) {
      throw new NotFoundException(
        `Lookup entry ${statusLookupKey} not configured`
      );
    }

    config.companyConfigurationStatusLid = statusLookup.id;
    config.companyConfigurationStatus = statusLookup;
    if (payload.status === "APPROVED") {
      config.approvedBy = approvedBy;
      config.approvedAt = new Date();
      config.rejectedBy = null;
      config.rejectedAt = null;
    } else {
      config.rejectedBy = approvedBy;
      config.rejectedAt = new Date();
      config.approvedBy = null;
      config.approvedAt = null;
    }
    config.updatedBy = approvedBy;
    await this.companyConfigRepository.save(config);

    const updatedConfig =
      (await this.companyConfigRepository.findByCompanyId(companyId)) ?? config;

    await this.attachCompanyConfigurationStatus(updatedConfig);

    await this.completeCompanyConfigurationApprovalTasks(companyId, approvedBy);

    await this.logCompanyConfigAudit({
      action: AuditHistoryAction.UPDATE,
      companyId,
      userId: approvedBy,
      previousConfig,
      currentConfig: updatedConfig,
      comments: payload.comments ?? null,
    });

    const message =
      payload.status === "APPROVED"
        ? "Company configuration approved successfully"
        : "Company configuration rejected successfully";
    return this.buildCompanyConfigActionResponse(
      companyId,
      updatedConfig,
      message
    );
  }

  async getDomainConfiguredCompanyIds(): Promise<{ companyIds: number[] }> {
    const configs = await this.companyConfigRepository.findConfiguredWithDomain();
    return { companyIds: configs.map((c: { companyId: number | null }) => c.companyId).filter(Boolean) as number[] };
  }

  async getCompanyPortalConfiguration(
    companyId: number
  ): Promise<CompanyPortalConfigurationResponse> {
    const config = await this.companyConfigRepository.findByCompanyId(companyId);

    if (config) {
      await this.attachCompanyConfigurationStatus(config);
    }
    const latestComments = await this.findLatestApprovalComments(companyId);
    const authMappings = await this.companyAuthenticationMappingRepository.find({
      where: { companyId, configId: IsNull() },
      relations: ["companyAuthenticationConfig"],
      order: { displayOrder: "ASC" },
    });

    const authentication = authMappings.map((mapping) => ({
      authentication_method_id: mapping.authenticationMethodId,
      authentication_method_key: mapping.authenticationMethodKey ?? null,
      ...mapping.companyAuthenticationConfig?.companyPortalAuthConfig,
    }));

    const companyConfigurationStatus = config
      ? this.resolveCompanyConfigurationStatus(config)
      : null;
    const passwordRules = this.buildPasswordRulesFromMappings(authMappings);
    const portalDetail = config?.companyPortalConfigurationDetail;

    // Resolve domain siblings (other companies sharing the same subDomain)
    const subDomain = config?.subDomain;
    let inheritedCompanyIds: number[] = [];
    if (subDomain && subDomain.trim()) {
      const domainGroup = await this.companyConfigRepository.findAllBySubDomain(subDomain);
      inheritedCompanyIds = domainGroup
        .map((c) => c.companyId)
        .filter((id): id is number => id != null && id !== companyId);
    }

    const companyRecord = await this.companyRepository.findOne({ where: { id: companyId } });
    const offers = await this.resolveOffersConfig(companyId, portalDetail);
    const offersAndBenefits = offers.items;
    const offersAndBenefitsEnabled = offers.isEnabled;

    return {
      companyId,
      portalConfigId: config?.id ?? null,
      subDomain: subDomain ?? null,
      inheritedCompanyIds,
      isDefault: this.isDefaultPortalConfiguration(config),
      comments: latestComments,
      companyConfigurationStatus,
      authentication,
      companyPortalConfig: {
        urlAndDomain: {
          fullUrl: config?.companyPortalUrl ?? null,
        },
        authentication,
        branding: portalDetail?.companyPortalBrandingConfig ?? {},
      },
      companyPortalDashboardConfig:
        portalDetail?.companyPortalDashboardConfig ?? null,
      companyPolicyConfig: portalDetail?.companyPolicyConfig ?? null,
      companyPortalWellnessConfig:
        portalDetail?.companyPortalWellnessConfig ?? null,
      dependentRelationConfig: portalDetail?.dependentRelationConfig ?? null,
      offersAndBenefits,
      offersAndBenefitsEnabled,
      mailServiceType: companyRecord?.mailServiceType ?? "SES",
      ccEmailAddresses: config?.ccEmailAddresses ?? [],
      passwordRules,
    };
  }

  async getPortalConfigurationById(
    configId: number
  ): Promise<CompanyPortalConfigurationResponse> {
    const config = await this.companyConfigRepository.findById(configId);
    if (!config) {
      throw new NotFoundException(`Portal configuration ${configId} not found`);
    }
    if (config) {
      await this.attachCompanyConfigurationStatus(config);
    }
    const companyId = config.companyId!;
    const latestComments = await this.findLatestApprovalComments(companyId);
    const authMappings = await this.findAuthMappingsWithFallback(companyId, configId);
    const authentication = authMappings.map((mapping) => ({
      authentication_method_id: mapping.authenticationMethodId,
      authentication_method_key: mapping.authenticationMethodKey ?? null,
      ...mapping.companyAuthenticationConfig?.companyPortalAuthConfig,
    }));
    const companyConfigurationStatus = this.resolveCompanyConfigurationStatus(config);
    const passwordRules = this.buildPasswordRulesFromMappings(authMappings);
    const portalDetail = config.companyPortalConfigurationDetail;
    const subDomain = config.subDomain;
    let inheritedCompanyIds: number[] = [];
    if (subDomain && subDomain.trim()) {
      const domainGroup = await this.companyConfigRepository.findAllBySubDomain(subDomain);
      inheritedCompanyIds = domainGroup
        .map((c) => c.companyId)
        .filter((id): id is number => id != null && id !== companyId);
    }
    const offers = await this.resolveOffersConfig(companyId, portalDetail);
    const offersAndBenefits = offers.items;
    const offersAndBenefitsEnabled = offers.isEnabled;

    return {
      companyId,
      portalConfigId: config.id,
      subDomain: subDomain ?? null,
      inheritedCompanyIds,
      isDefault: this.isDefaultPortalConfiguration(config),
      comments: latestComments,
      companyConfigurationStatus,
      authentication,
      companyPortalConfig: {
        urlAndDomain: { fullUrl: config.companyPortalUrl ?? null },
        authentication,
        branding: portalDetail?.companyPortalBrandingConfig ?? {},
      },
      companyPortalDashboardConfig: portalDetail?.companyPortalDashboardConfig ?? null,
      companyPolicyConfig: portalDetail?.companyPolicyConfig ?? null,
      companyPortalWellnessConfig: portalDetail?.companyPortalWellnessConfig ?? null,
      dependentRelationConfig: portalDetail?.dependentRelationConfig ?? null,
      offersAndBenefits,
      offersAndBenefitsEnabled,
      mailServiceType: (await this.companyRepository.findOne({ where: { id: companyId } }))?.mailServiceType ?? "SES",
      ccEmailAddresses: config.ccEmailAddresses ?? [],
      passwordRules,
    };
  }

  async listPortalConfigurations(companyId: number): Promise<PortalConfigListItem[]> {
    const configs = await this.companyConfigRepository.findAllByCompanyId(companyId);
    return Promise.all(
      configs.map(async (config) => {
        await this.attachCompanyConfigurationStatus(config);
        const scopeRows = await this.companyConfigRepository.getConfigScope(config.id);
        return {
          configId: config.id,
          subDomain: config.subDomain ?? null,
          fullUrl: config.companyPortalUrl ?? null,
          status: this.resolveCompanyConfigurationStatus(config),
          scopeCount: scopeRows.filter((r) => r.policyId != null).length,
          createdAt: config.createdAt,
          ccEmailAddresses: config.ccEmailAddresses ?? [],
        };
      })
    );
  }

  async deletePortalConfiguration(configId: number): Promise<{ message: string }> {
    const config = await this.companyConfigRepository.findById(configId);
    if (!config) {
      throw new NotFoundException(`Portal configuration ${configId} not found`);
    }
    await this.companyConfigRepository.deleteById(configId);
    return { message: `Portal configuration ${configId} deleted` };
  }

  private async findLatestApprovalComments(
    companyId: number
  ): Promise<string | null> {
    const latestCommentDetail =
      await this.auditHistoryLogDetailRepository
        .createQueryBuilder("detail")
        .leftJoin("detail.auditHistoryLog", "log")
        .where("log.entityType = :entityType", {
          entityType: this.companyConfigAuditEntityType,
        })
        .andWhere("log.entityId = :entityId", { entityId: String(companyId) })
        .andWhere("detail.fieldName = :fieldName", { fieldName: "comments" })
        .orderBy("log.createdAt", "DESC")
        .addOrderBy("detail.id", "DESC")
        .getOne();

    if (!latestCommentDetail) {
      return null;
    }

    if (typeof latestCommentDetail.newValue === "string") {
      return latestCommentDetail.newValue;
    }

    if (latestCommentDetail.newValue === null || latestCommentDetail.newValue === undefined) {
      return null;
    }

    try {
      return JSON.stringify(latestCommentDetail.newValue);
    } catch (error) {
      return String(latestCommentDetail.newValue);
    }
  }

  private mapToResponse(
    config: ConfigCompany,
    requestedSubDomain?: string,
    passwordRules?: PasswordRuleDefinition[] | null
  ): CompanyConfigResponse {
    const companyConfigurationStatus = this.resolveCompanyConfigurationStatus(config);
    const portalDetail = config.companyPortalConfigurationDetail;
    const brandingConfig = portalDetail?.companyPortalBrandingConfig ?? null;

    return {
      companyId: config.companyId ?? null,
      portalConfigId: config.id ?? null,
      subDomain: requestedSubDomain ?? config.subDomain ?? DEFAULT_SUB_DOMAIN,
      databaseConfig: config.databaseConnect
        ? {
            id: config.databaseConnect.id,
            name: config.databaseConnect.name,
            host: config.databaseConnect.host,
            port: config.databaseConnect.port,
          }
        : null,
      portalDashboardConfig: portalDetail?.companyPortalDashboardConfig ?? null,
      companyPolicyConfig: portalDetail?.companyPolicyConfig ?? null,
      dependentRelationConfig: portalDetail?.dependentRelationConfig ?? null,
      logoFileId: config.companyLogoFileId ?? null,
      companyLogoId: config.companyLogoFileId ?? null,
      portalBrandingConfig: brandingConfig,
      portalWellnessConfig: portalDetail?.companyPortalWellnessConfig ?? null,
      companyConfigurationStatus,
      passwordRules: passwordRules ?? null,
    };
  }

  private buildCompanyConfigActionResponse(
    companyId: number,
    config: ConfigCompany,
    message: string
  ): CompanyConfigActionResponse {
    const resolvedStatus = this.resolveCompanyConfigurationStatus(config);
    return {
      id: config.companyId ?? companyId,
      status: resolvedStatus?.value ?? null,
      message,
    };
  }

  private resolveCompanyConfigurationStatus(
    config: ConfigCompany
  ): { lid: number; key: string; value: string } | null {
    const lookup = config.companyConfigurationStatus;

    if (lookup) {
      return {
        lid: lookup.id,
        key: lookup.lookUpKey,
        value: lookup.lookUpValue,
      };
    }

    if (Number.isFinite(config.companyConfigurationStatusLid)) {
      return {
        lid: config.companyConfigurationStatusLid ?? 0,
        key: "",
        value: "",
      };
    }

    return null;
  }

  private async attachCompanyConfigurationStatus(
    config: ConfigCompany
  ): Promise<ConfigCompany> {
    const statusLid = config.companyConfigurationStatusLid;

    if (Number.isFinite(statusLid)) {
      if (
        !config.companyConfigurationStatus ||
        config.companyConfigurationStatus.id !== statusLid
      ) {
        config.companyConfigurationStatus =
          (await this.resolveStatusLookupByLid(statusLid)) ?? undefined;
      }
    } else if (config.companyConfigurationStatus?.id) {
      config.companyConfigurationStatusLid = config.companyConfigurationStatus.id;
    }

    return config;
  }

  private isDefaultPortalConfiguration(
    config?: ConfigCompany | null
  ): boolean {
    if (!config) {
      return true;
    }

    const subDomain = config.subDomain;
    return !subDomain || !subDomain.trim();
  }

  private async resolveStatusLookupByLid(
    statusLid: number | null
  ): Promise<LookUp | null> {
    if (!Number.isFinite(statusLid)) {
      return null;
    }

    return this.lookUpRepository.findOne({ where: { id: statusLid ?? undefined } });
  }

  private async getStatusLookup(lookupKey: string): Promise<LookUp | null> {
    return this.lookUpRepository.findOne({
      where: { lookUpKey: lookupKey },
    });
  }

  private resetApprovalDecision(config: ConfigCompany): void {
    config.approvedBy = null;
    config.approvedAt = null;
    config.rejectedBy = null;
    config.rejectedAt = null;
  }

  private async persistPortalConfigurationDetail(
    companyId: number,
    existingDetail: CompanyPortalConfigurationDetail | null | undefined,
    payload: UpdateCompanyPortalConfigDto,
    submittedBy: number | null
  ): Promise<CompanyPortalConfigurationDetail | null> {
    const hasDetailPayload =
      payload.companyPortalDashboardConfig !== undefined ||
      payload.companyPolicyConfig !== undefined ||
      payload.companyPortalWellnessConfig !== undefined ||
      payload.dependentRelationConfig !== undefined ||
      payload.offersAndBenefits !== undefined ||
      payload.offersAndBenefitsEnabled !== undefined ||
      payload.selectedLocationIds !== undefined ||
      (payload.companyPortalConfig &&
        Object.prototype.hasOwnProperty.call(payload.companyPortalConfig, "branding"));

    if (!hasDetailPayload) {
      return existingDetail ?? null;
    }

    const detail =
      existingDetail ??
      this.companyPortalConfigurationDetailRepository.create({
        companyId,
        createdBy: submittedBy,
        updatedBy: submittedBy,
        isCompanyConfig: true,
      });

    detail.companyId = companyId;

    if (payload.companyPortalDashboardConfig !== undefined) {
      detail.companyPortalDashboardConfig = payload.companyPortalDashboardConfig;
    }

    if (payload.companyPortalWellnessConfig !== undefined) {
      detail.companyPortalWellnessConfig = payload.companyPortalWellnessConfig;
    }

    if (
      payload.offersAndBenefits !== undefined ||
      payload.offersAndBenefitsEnabled !== undefined
    ) {
      const existingOffers = this.readOffersConfig(detail);
      const items =
        payload.offersAndBenefits !== undefined
          ? payload.offersAndBenefits.map((item, index) => ({
              // Ids are assigned here rather than by a sequence: the client may
              // send new items without one, and they only need to be stable
              // within this section.
              id: item.id ?? index + 1,
              title: item.title,
              description: item.description,
              redirectionUrl: item.redirectionUrl,
              imageFileId: item.imageFileId ?? null,
              isEnabled: item.isEnabled ?? true,
              displayOrder: item.displayOrder ?? index + 1,
            }))
          : existingOffers?.items ?? [];

      detail.companyPortalOffersConfig = {
        isEnabled:
          payload.offersAndBenefitsEnabled ?? existingOffers?.isEnabled ?? true,
        items,
      };
    }

    if (payload.companyPolicyConfig !== undefined) {
      // Embed selectedLocationIds alongside policy config entries in the JSONB column
      const locationEntry = payload.selectedLocationIds !== undefined
        ? [{ selectedLocationIds: payload.selectedLocationIds }]
        : [];
      detail.companyPolicyConfig = [
        ...(payload.companyPolicyConfig ?? []),
        ...locationEntry,
      ];
    } else if (payload.selectedLocationIds !== undefined) {
      // Only location IDs changed — merge into existing policy config
      const existing = (detail.companyPolicyConfig ?? []).filter(
        (entry: any) => !('selectedLocationIds' in entry)
      );
      detail.companyPolicyConfig = [
        ...existing,
        { selectedLocationIds: payload.selectedLocationIds },
      ];
    }

    if (
      payload.companyPortalConfig &&
      Object.prototype.hasOwnProperty.call(payload.companyPortalConfig, "branding")
    ) {
      const branding = payload.companyPortalConfig.branding;
      detail.companyPortalBrandingConfig = branding ?? null;
    }

    if (payload.dependentRelationConfig !== undefined) {
      detail.dependentRelationConfig = payload.dependentRelationConfig ?? null;
    }

    detail.isCompanyConfig = true;
    detail.updatedBy = submittedBy;
    if (!detail.id) {
      detail.createdBy = submittedBy;
    }

    return this.companyPortalConfigurationDetailRepository.save(detail);
  }

  async updateCompanyPolicyFeatureDocument(
    payload: UpdateCompanyPolicyFeatureDocumentDto,
    submittedByHeader?: string | number
  ): Promise<CompanyPolicyFeatureDocumentResponse> {
    const companyId = Number(payload.companyId);
    const documentId = Number(payload.documentId);

    if (!Number.isFinite(companyId)) {
      throw new BadRequestException("companyId is required");
    }
    if (!Number.isFinite(documentId)) {
      throw new BadRequestException("documentId is required");
    }

    const submittedBy = this.parseNullableNumber(submittedByHeader);
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`No company found for companyId: ${companyId}`);
    }

    company.policyFeatureDocumentId = documentId;
    const savedCompany = await this.companyRepository.save(company);

    return this.buildCompanyPolicyFeatureDocumentResponse(savedCompany);
  }

  async getCompanyPolicyFeatureDocument(
    companyId: number
  ): Promise<CompanyPolicyFeatureDocumentResponse> {
    if (!Number.isFinite(companyId)) {
      throw new BadRequestException("companyId is required");
    }

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`No company found for companyId: ${companyId}`);
    }

    return this.buildCompanyPolicyFeatureDocumentResponse(company);
  }

  async deleteCompanyPolicyFeatureDocument(
    companyId: number
  ): Promise<CompanyPolicyFeatureDocumentResponse> {
    if (!Number.isFinite(companyId)) {
      throw new BadRequestException("companyId is required");
    }

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`No company found for companyId: ${companyId}`);
    }

    const documentId = company.policyFeatureDocumentId;

    // Detach the document from the company, then soft-delete the file row
    // (sets deleted_at) so it is recoverable and excluded from later reads.
    company.policyFeatureDocumentId = null;
    await this.companyRepository.save(company);

    if (documentId) {
      await this.fileUploadRepository.softDelete(documentId);
    }

    return this.buildCompanyPolicyFeatureDocumentResponse(company);
  }

  async getCompanyOnboardingMailMode(
    companyId: number,
  ): Promise<CompanyOnboardingMailModeResponse> {
    if (!Number.isFinite(companyId)) {
      throw new BadRequestException("companyId is required");
    }

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`No company found for companyId: ${companyId}`);
    }

    return {
      companyId: company.id,
      mode:
        company.initialOnboardingMailTriggerMode === "manual"
          ? "manual"
          : "cron",
    };
  }

  async updateCompanyOnboardingMailMode(
    payload: UpdateCompanyOnboardingMailModeDto,
    submittedByHeader?: string | number,
  ): Promise<CompanyOnboardingMailModeResponse> {
    const companyId = Number(payload.companyId);

    if (!Number.isFinite(companyId)) {
      throw new BadRequestException("companyId is required");
    }

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`No company found for companyId: ${companyId}`);
    }

    const submittedBy = this.parseNullableNumber(submittedByHeader);
    company.initialOnboardingMailTriggerMode = payload.mode;
    company.updatedBy = submittedBy;
    const savedCompany = await this.companyRepository.save(company);

    // Sync cron mode to all companies sharing the same subDomain
    const configForCompany = await this.companyConfigRepository.findByCompanyId(companyId);
    const subDomain = configForCompany?.subDomain;
    if (subDomain && subDomain.trim()) {
      const domainGroup = await this.companyConfigRepository.findAllBySubDomain(subDomain);
      const siblingIds = domainGroup
        .map((c) => c.companyId)
        .filter((id): id is number => id != null && id !== companyId);

      for (const siblingId of siblingIds) {
        const sibling = await this.companyRepository.findOne({ where: { id: siblingId } });
        if (sibling) {
          sibling.initialOnboardingMailTriggerMode = payload.mode;
          sibling.updatedBy = submittedBy ?? undefined;
          await this.companyRepository.save(sibling).catch(() => {});
        }
      }
    }

    return {
      companyId: savedCompany.id,
      mode:
        savedCompany.initialOnboardingMailTriggerMode === "manual"
          ? "manual"
          : "cron",
    };
  }

  async triggerCompanyOnboardingMails(
    payload: TriggerCompanyOnboardingMailDto,
  ) {
    const companyId = Number(payload.companyId);

    if (!Number.isFinite(companyId)) {
      throw new BadRequestException("companyId is required");
    }

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new NotFoundException(`No company found for companyId: ${companyId}`);
    }

    const response = await axios.post(
      `${ENV.URL_IBP_SERVICE}/onboarding/initial-notification/company`,
      { companyId, subDomain: payload.subDomain },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    return response.data?.data ?? response.data;
  }

  private async buildCompanyPolicyFeatureDocumentResponse(
    company: Company
  ): Promise<CompanyPolicyFeatureDocumentResponse> {
    const fileUpload = company.policyFeatureDocumentId
      ? await this.fileUploadRepository.findOne({
          where: { id: company.policyFeatureDocumentId },
          relations: ["createdByUser"],
        })
      : null;

    const uploadedBy = fileUpload?.createdByUser
      ? `${fileUpload.createdByUser.firstName || ""} ${fileUpload.createdByUser.lastName || ""}`.trim() || null
      : null;

    const fileName = fileUpload?.fileKey
      ? fileUpload.fileKey.split("/").pop() ?? null
      : null;

    return {
      companyId: company.id,
      documentId: company.policyFeatureDocumentId ?? null,
      fileName,
      uploadedAt: fileUpload?.createdAt ?? null,
      uploadedBy,
    };
  }

  private parseNullableNumber(value: any): number | null {
    if (value === undefined || value === null || value === "") {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private async persistAuthenticationConfig(
    companyId: number,
    methodId: number,
    authConfig: Record<string, any> | undefined,
    existingDetail: CompanyAuthenticationConfig | null | undefined,
    submittedBy: number | null,
    methodKey: string | null,
    configId: number | null = null
  ): Promise<CompanyAuthenticationConfig | null> {
    if (!authConfig) {
      return existingDetail ?? null;
    }

    const resolvedMethod =
      existingDetail?.authenticationMethod ??
      (await this.authenticationMethodRepository.findOne({
        where: { id: methodId },
      }));

    if (
      this.shouldUseSharedAuthenticationConfig(
        resolvedMethod,
        methodKey,
        authConfig
      )
    ) {
      return this.ensureSharedAuthenticationConfig(methodId, submittedBy);
    }

    const existingDetailIsShared =
      existingDetail?.authenticationMethodKey ===
      this.sharedAuthenticationConfigKey;
    // Only reuse the existing detail row if it already belongs to this exact
    // scope (company + domain) — otherwise a save under one domain would
    // silently overwrite another domain's (or the company default's) row.
    const existingDetailMatchesScope =
      existingDetail?.configId === (configId ?? null);

    const detail =
      existingDetail && !existingDetailIsShared && existingDetailMatchesScope
        ? existingDetail
        : this.companyAuthenticationConfigRepository.create({
        companyId,
        authenticationMethodId: methodId,
        authenticationMethodKey: methodKey ?? null,
        configId: configId ?? null,
        createdBy: submittedBy,
        updatedBy: submittedBy,
      });

    detail.companyId = companyId;
    detail.authenticationMethodId = methodId;
    detail.authenticationMethodKey = methodKey ?? detail.authenticationMethodKey;
    detail.companyPortalAuthConfig = authConfig ?? null;
    detail.configId = configId ?? null;
    detail.updatedBy = submittedBy;
    if (!detail.id) {
      detail.createdBy = submittedBy;
    }

    return this.companyAuthenticationConfigRepository.save(detail);
  }

  private async resetCompanyPortalConfiguration(companyId: number): Promise<void> {
    const config = await this.companyConfigRepository.findByCompanyId(companyId);
    if (!config) return;

    // Clear auth mappings
    await this.syncCompanyAuthenticationMappings(companyId, [], null);

    // Clear the portal configuration detail (branding, policy, dashboard)
    if (config.companyPortalConfigurationDetail) {
      const detail = config.companyPortalConfigurationDetail;
      detail.companyPortalBrandingConfig = null;
      detail.companyPortalDashboardConfig = null;
      detail.companyPolicyConfig = null;
      detail.dependentRelationConfig = null;
      await this.companyPortalConfigurationDetailRepository.save(detail);
    }

    // Clear domain fields so the company is treated as unconfigured
    config.subDomain = null as unknown as string;
    config.companyPortalUrl = null as unknown as string;
    config.isCompanyConfig = false;
    await this.companyConfigRepository.save(config);
  }

  private async syncCompanyAuthenticationMappings(
    companyId: number,
    authConfigs: Record<string, any>[],
    submittedBy: number | null,
    configId: number | null = null
  ): Promise<void> {
    const existingMappings = await this.companyAuthenticationMappingRepository.find({
      where: { companyId, configId: configId ?? IsNull() },
      relations: ["companyAuthenticationConfig"],
    });

    if (!authConfigs.length) {
      if (existingMappings.length) {
        const detailIdsToRemove = existingMappings
          .map((mapping) => mapping.companyAuthenticationConfig)
          .filter(
            (detail): detail is CompanyAuthenticationConfig =>
              Boolean(detail) && detail.authenticationMethodKey !== this.sharedAuthenticationConfigKey
          )
          .map((detail) => detail.id);
        await this.companyAuthenticationMappingRepository.remove(existingMappings);
        await this.deleteAuthenticationConfigurationDetails(detailIdsToRemove);
      }
      return;
    }

    const incomingMethodIds = new Set<number>();
    const existingMap = new Map(
      existingMappings.map((mapping) => [
        mapping.authenticationMethodId,
        mapping,
      ])
    );

    let displayOrder = 1;
    for (const authConfig of authConfigs) {
      if (!authConfig) {
        continue;
      }
      const methodId = Number(
        authConfig.authentication_method_id ?? authConfig.authenticationMethodId
      );
      if (Number.isNaN(methodId)) {
        continue;
      }

      incomingMethodIds.add(methodId);
      const methodKey = this.resolveAuthenticationMethodKey(authConfig);
      const mapping = existingMap.get(methodId);

      if (mapping) {
        const detail = await this.persistAuthenticationConfig(
          companyId,
          methodId,
          authConfig,
          mapping.companyAuthenticationConfig,
          submittedBy,
          methodKey,
          configId
        );
        if (detail) {
          mapping.companyAuthenticationConfig = detail;
          mapping.companyPortalAuthConfigId = detail.id ?? null;
        }
        mapping.authenticationMethodKey = methodKey ?? mapping.authenticationMethodKey;
        mapping.displayOrder = displayOrder++;
        mapping.isEnabled = true;
        if (submittedBy !== null) {
          mapping.updatedBy = submittedBy;
          if (
            mapping.createdBy === null ||
            mapping.createdBy === undefined
          ) {
            mapping.createdBy = submittedBy;
          }
        }
        await this.companyAuthenticationMappingRepository.save(mapping);
        continue;
      }

      const createdMapping = this.companyAuthenticationMappingRepository.create({
        companyId,
        configId: configId ?? null,
        authenticationMethodId: methodId,
        authenticationMethodKey: methodKey,
        isEnabled: true,
        displayOrder: displayOrder++,
        createdBy: submittedBy,
        updatedBy: submittedBy,
      });
      const savedMapping = await this.companyAuthenticationMappingRepository.save(
        createdMapping
      );
      const detail = await this.persistAuthenticationConfig(
        companyId,
        methodId,
        authConfig,
        savedMapping.companyAuthenticationConfig,
        submittedBy,
        methodKey,
        configId
      );
      if (detail) {
        savedMapping.companyAuthenticationConfig = detail;
        savedMapping.companyPortalAuthConfigId = detail.id ?? null;
        await this.companyAuthenticationMappingRepository.save(savedMapping);
      }
    }

    const staleMappings = existingMappings.filter(
      (mapping) => !incomingMethodIds.has(mapping.authenticationMethodId)
    );
    if (staleMappings.length) {
      const staleDetailIds = staleMappings
        .map((mapping) => mapping.companyAuthenticationConfig)
        .filter(
          (detail): detail is CompanyAuthenticationConfig =>
            Boolean(detail) && detail.authenticationMethodKey !== this.sharedAuthenticationConfigKey
        )
        .map((detail) => detail.id);
      await this.companyAuthenticationMappingRepository.remove(staleMappings);
      await this.deleteAuthenticationConfigurationDetails(staleDetailIds);
    }
  }

  private resolveAuthenticationMethodKey(
    authConfig: Record<string, any>
  ): string | null {
    const explicitKey =
      authConfig.authentication_method_key ?? authConfig.authenticationMethodKey;
    if (explicitKey) {
      return String(explicitKey);
    }

    return null;
  }

  private shouldUseSharedAuthenticationConfig(
    authMethod: AuthenticationMethod | null | undefined,
    methodKey: string | null,
    authConfig: Record<string, any> | undefined
  ): boolean {
    if (!authMethod) {
      return false;
    }

    const payloadConfig = this.extractAuthConfigPayload(authConfig);
    const hasCustomConfig = Boolean(payloadConfig && Object.keys(payloadConfig).length);
    if (hasCustomConfig) {
      return false;
    }

    const methodCodeMatches =
      authMethod.methodCode === this.sharedAuthenticationMethodCode;
    const methodKeyMatches =
      methodKey === this.sharedAuthenticationMethodCode ||
      methodKey === this.sharedAuthenticationConfigKey ||
      authMethod.authenticationMethodKey === this.sharedAuthenticationMethodCode ||
      authMethod.authenticationMethodKey === this.sharedAuthenticationConfigKey;
    return methodCodeMatches || methodKeyMatches;
  }

  private extractAuthConfigPayload(
    authConfig: Record<string, any> | undefined
  ): Record<string, any> | null {
    if (!authConfig) {
      return null;
    }
    return (
      authConfig.company_portal_auth_config ??
      authConfig.companyPortalAuthConfig ??
      null
    );
  }

  private async ensureSharedAuthenticationConfig(
    methodId: number,
    submittedBy: number | null
  ): Promise<CompanyAuthenticationConfig> {
    let sharedConfig =
      await this.companyAuthenticationConfigRepository.findOne({
        where: {
          authenticationMethodId: methodId,
          authenticationMethodKey: this.sharedAuthenticationConfigKey,
        },
      });

    if (sharedConfig) {
      return sharedConfig;
    }

    sharedConfig = this.companyAuthenticationConfigRepository.create({
      companyId: this.sharedAuthenticationConfigurationCompanyId,
      authenticationMethodId: methodId,
      authenticationMethodKey: this.sharedAuthenticationConfigKey,
      companyPortalAuthConfig: {},
      createdBy: submittedBy,
      updatedBy: submittedBy,
    });

    return this.companyAuthenticationConfigRepository.save(sharedConfig);
  }

  private async deleteAuthenticationConfigurationDetails(
    detailIds: number[]
  ): Promise<void> {
    if (!detailIds.length) {
      return;
    }

    const uniqueIds = Array.from(new Set(detailIds));
    const configs = await this.companyAuthenticationConfigRepository.find({
      where: { id: In(uniqueIds) },
    });
    const removableIds = configs
      .filter(
        (config) =>
          config.authenticationMethodKey !== this.sharedAuthenticationConfigKey
      )
      .map((config) => config.id);
    if (!removableIds.length) {
      return;
    }
    await this.companyAuthenticationConfigRepository.delete({
      id: In(removableIds),
    });
  }

  /**
   * Domain-override → company-default fallback used by every auth-settings read.
   * A brand-new domain with no override yet transparently inherits the company's
   * existing settings instead of coming up blank.
   */
  private async findAuthMappingsWithFallback(
    companyId: number,
    configId: number | null | undefined
  ): Promise<CompanyAuthenticationMapping[]> {
    if (configId) {
      const scoped = await this.companyAuthenticationMappingRepository.find({
        where: { companyId, configId },
        relations: ["companyAuthenticationConfig"],
        order: { displayOrder: "ASC" },
      });
      if (scoped.length) {
        return scoped;
      }
    }

    return this.companyAuthenticationMappingRepository.find({
      where: { companyId, configId: IsNull() },
      relations: ["companyAuthenticationConfig"],
      order: { displayOrder: "ASC" },
    });
  }

  /**
   * Reads the Offers & Benefits JSONB off a portal detail row. Returns null
   * when the column was never written, so callers can tell "not configured for
   * this domain" apart from "configured as empty/disabled".
   */
  private readOffersConfig(
    detail: CompanyPortalConfigurationDetail | null | undefined
  ): OffersConfig | null {
    const raw = detail?.companyPortalOffersConfig;
    if (!raw || typeof raw !== "object") {
      return null;
    }
    const items: OfferBenefitConfigItem[] = Array.isArray(raw.items)
      ? [...raw.items].sort(
          (a: any, b: any) => (a?.displayOrder ?? 0) - (b?.displayOrder ?? 0)
        )
      : [];
    return { isEnabled: raw.isEnabled !== false, items };
  }

  /**
   * Domain-scoped section if this config has one configured, else the
   * company-level default — the same precedence the branding and auth configs
   * use, now expressed through the detail row each config points at rather than
   * a config_id column.
   */
  private async resolveOffersConfig(
    companyId: number,
    scopedDetail: CompanyPortalConfigurationDetail | null | undefined
  ): Promise<OffersConfig> {
    const scoped = this.readOffersConfig(scopedDetail);
    if (scoped?.items.length) {
      return scoped;
    }

    const companyConfig = await this.companyConfigRepository.findByCompanyId(companyId);
    const companyLevel = this.readOffersConfig(
      companyConfig?.companyPortalConfigurationDetail
    );

    return {
      isEnabled: scoped?.isEnabled ?? companyLevel?.isEnabled ?? true,
      items: companyLevel?.items ?? [],
    };
  }

  private async buildPasswordRules(
    companyId: number | null | undefined,
    configId: number | null = null
  ): Promise<PasswordRuleDefinition[] | null> {
    if (!companyId) {
      return null;
    }

    const authMappings = await this.findAuthMappingsWithFallback(companyId, configId);

    return this.buildPasswordRulesFromMappings(authMappings);
  }

  private buildPasswordRulesFromMappings(
    authMappings: CompanyAuthenticationMapping[]
  ): PasswordRuleDefinition[] | null {
    if (!authMappings?.length) {
      return null;
    }

    for (const mapping of authMappings) {
      const passwordConfig =
        mapping.companyAuthenticationConfig?.companyPortalAuthConfig
          ?.passwordConfig;
      if (!passwordConfig) {
        continue;
      }

      const rules = this.mapPasswordConfigToRules(passwordConfig);
      if (rules.length) {
        return rules;
      }
    }

    return null;
  }

  private async findCompanyConfigApprover(
    requestedBy: number | null
  ): Promise<number | null> {
    const rows = await this.dataSource.query(
      `SELECT ur.user_id as "userId"
       FROM user_role ur
       JOIN roles r ON ur.role_id = r.id
       WHERE r.name = $1
       ORDER BY ur.user_id
       LIMIT 1`,
      ["Super User"]
    );

    const approverId = Number(rows?.[0]?.userId ?? rows?.[0]?.user_id);
    if (Number.isFinite(approverId)) {
      return approverId;
    }

    return Number.isFinite(requestedBy) ? Number(requestedBy) : null;
  }

  private async createCompanyConfigurationApprovalTask(
    companyId: number,
    assigneeId: number,
    requestedBy: number | null,
    config: ConfigCompany
  ): Promise<void> {
    if (!Number.isFinite(assigneeId)) {
      throw new BadRequestException(
        "A valid assignee is required to create approval task"
      );
    }

    const effectiveCompanyId = config.companyId ?? companyId;
    if (!Number.isFinite(effectiveCompanyId)) {
      throw new BadRequestException(
        "A valid companyId is required to create approval task"
      );
    }

    const [taskType, taskPriority, taskStatus] = await Promise.all([
      this.lookUpRepository.findOne({ where: { lookUpKey: TASK_TYPE.APPROVAL } }),
      this.lookUpRepository.findOne({
        where: { lookUpKey: PRIORITY_LOOK_UP_HIGH_VALUE },
      }),
      this.lookUpRepository.findOne({ where: { lookUpKey: TASK_STATUS_ACTIVE } }),
    ]);

    if (!taskType) {
      throw new NotFoundException(
        `Task type with key ${TASK_TYPE.APPROVAL} not found`
      );
    }

    if (!taskPriority) {
      throw new NotFoundException(
        `Task priority with key ${PRIORITY_LOOK_UP_HIGH_VALUE} not found`
      );
    }

    if (!taskStatus) {
      throw new NotFoundException(
        `Task status with key ${TASK_STATUS_ACTIVE} not found`
      );
    }

    const existingTask = await this.taskRepository.findOne({
      where: {
        companyId: effectiveCompanyId,
        taskTypeLid: taskType.id,
        taskClose: IsNull(),
        taskOrigin: TASK_ORIGIN.COMPANY_CONFIGURATION_APPROVAL,
        taskLabel: TASK_LABEL.COMPANY_CONFIGURATION_APPROVAL,
        taskName: this.companyConfigApprovalTaskName,
      },
    });

    const dueDate = addDays(new Date(), DEFAULT_APPROVAL_TASK_LEAD_DAYS);
    const actorId = Number.isFinite(requestedBy) ? Number(requestedBy) : assigneeId;

    if (existingTask) {
      await this.taskRepository.update(
        { id: existingTask.id },
        {
          assigneeId,
          updatedBy: actorId,
          dueDate,
          taskStatusLid: taskStatus.id,
          taskClose: null,
          companyId: effectiveCompanyId,
          taskOrigin: TASK_ORIGIN.COMPANY_CONFIGURATION_APPROVAL,
          taskLabel: TASK_LABEL.COMPANY_CONFIGURATION_APPROVAL,
          description: `${this.companyConfigApprovalTaskName} for Company ID: ${effectiveCompanyId}`,
        }
      );
      return;
    }

    const task = this.taskRepository.create({
      taskName: this.companyConfigApprovalTaskName,
      activityId: null,
      companyId: effectiveCompanyId,
      opportunityId: effectiveCompanyId,
      assigneeId,
      taskTypeLid: taskType.id,
      taskStatusLid: taskStatus.id,
      priorityLid: taskPriority.id,
      dueDate,
      description: `${this.companyConfigApprovalTaskName} for Company ID: ${effectiveCompanyId}`,
      createdBy: actorId,
      updatedBy: actorId,
      taskIsEditable: IS_NOT_EDITABLE,
      taskOrigin: TASK_ORIGIN.COMPANY_CONFIGURATION_APPROVAL,
      taskLabel: TASK_LABEL.COMPANY_CONFIGURATION_APPROVAL,
    });

    await this.taskRepository.save(task);
  }

  private async completeCompanyConfigurationApprovalTasks(
    companyId: number,
    userId: number
  ): Promise<void> {
    const [taskType, closedStatus] = await Promise.all([
      this.lookUpRepository.findOne({ where: { lookUpKey: TASK_TYPE.APPROVAL } }),
      this.lookUpRepository.findOne({ where: { lookUpKey: TASK_STATUS_CLOSED } }),
    ]);

    if (!taskType || !closedStatus) {
      return;
    }

    const openTasks = await this.taskRepository.find({
      where: {
        companyId,
        taskName: this.companyConfigApprovalTaskName,
        taskLabel: TASK_LABEL.COMPANY_CONFIGURATION_APPROVAL,
        taskTypeLid: taskType.id,
        taskClose: IsNull(),
        taskOrigin: TASK_ORIGIN.COMPANY_CONFIGURATION_APPROVAL,
      },
    });

    if (!openTasks.length) {
      return;
    }

    await this.taskRepository.update(
      { id: In(openTasks.map((task) => task.id)) },
      {
        taskStatusLid: closedStatus.id,
        taskClose: TASK_CLOSED,
        updatedBy: userId,
      }
    );
  }

  private async logCompanyConfigAudit({
    action,
    companyId,
    userId,
    previousConfig,
    currentConfig,
    comments,
  }: {
    action: AuditHistoryAction;
    companyId: number;
    userId: number | null;
    previousConfig: ConfigCompany | null;
    currentConfig: ConfigCompany;
    comments?: any;
  }): Promise<void> {
    const auditLog = this.auditHistoryLogRepository.create({
      entityType: this.companyConfigAuditEntityType,
      entityName: `${this.companyConfigAuditEntityType} - ${companyId}`,
      entityId: String(companyId),
      action,
      userId: userId !== null && userId !== undefined ? String(userId) : null,
    });

    await this.auditHistoryLogRepository.save(auditLog);

    const details = this.buildCompanyConfigAuditDetails(
      previousConfig,
      currentConfig,
      comments
    );

    if (details.length) {
      details.forEach((detail) => (detail.auditHistoryLog = auditLog));
      await this.auditHistoryLogDetailRepository.save(details);
    }
  }

  private buildCompanyConfigAuditDetails(
    previousConfig: ConfigCompany | null,
    currentConfig: ConfigCompany,
    comments?: any
  ): AuditHistoryLogDetail[] {
    const details: AuditHistoryLogDetail[] = [];

    const previousStatus = previousConfig?.companyConfigurationStatus ?? null;
    const currentStatus = currentConfig.companyConfigurationStatus ?? null;

    if (previousStatus?.id !== currentStatus?.id) {
      details.push(
        this.auditHistoryLogDetailRepository.create({
          fieldName: "company_configuration_status_key",
          oldValue: previousStatus?.lookUpKey ?? null,
          newValue: currentStatus?.lookUpKey ?? null,
          fieldType: "text",
        }),
        this.auditHistoryLogDetailRepository.create({
          fieldName: "company_configuration_status_label",
          oldValue: previousStatus?.lookUpValue ?? null,
          newValue: currentStatus?.lookUpValue ?? null,
          fieldType: "text",
        })
      );
    }

    if (
      (previousConfig?.approvedBy ?? null) !== (currentConfig.approvedBy ?? null)
    ) {
      details.push(
        this.auditHistoryLogDetailRepository.create({
          fieldName: "approved_by",
          oldValue: previousConfig?.approvedBy ?? null,
          newValue: currentConfig.approvedBy ?? null,
          fieldType: "number",
        })
      );
    }

    if (this.hasValueChanged(previousConfig?.approvedAt ?? null, currentConfig.approvedAt ?? null)) {
      details.push(
        this.auditHistoryLogDetailRepository.create({
          fieldName: "approved_at",
          oldValue: previousConfig?.approvedAt ?? null,
          newValue: currentConfig.approvedAt ?? null,
          fieldType: "timestamp",
        })
      );
    }

    if (
      (previousConfig?.rejectedBy ?? null) !== (currentConfig.rejectedBy ?? null)
    ) {
      details.push(
        this.auditHistoryLogDetailRepository.create({
          fieldName: "rejected_by",
          oldValue: previousConfig?.rejectedBy ?? null,
          newValue: currentConfig.rejectedBy ?? null,
          fieldType: "number",
        })
      );
    }

    if (this.hasValueChanged(previousConfig?.rejectedAt ?? null, currentConfig.rejectedAt ?? null)) {
      details.push(
        this.auditHistoryLogDetailRepository.create({
          fieldName: "rejected_at",
          oldValue: previousConfig?.rejectedAt ?? null,
          newValue: currentConfig.rejectedAt ?? null,
          fieldType: "timestamp",
        })
      );
    }

    const previousDetail = previousConfig?.companyPortalConfigurationDetail ?? null;
    const currentDetail = currentConfig.companyPortalConfigurationDetail ?? null;

    if (
      this.hasValueChanged(
        previousDetail?.companyPortalBrandingConfig ?? null,
        currentDetail?.companyPortalBrandingConfig ?? null
      )
    ) {
      details.push(
        this.auditHistoryLogDetailRepository.create({
          fieldName: "company_portal_branding_config",
          oldValue: previousDetail?.companyPortalBrandingConfig ?? null,
          newValue: currentDetail?.companyPortalBrandingConfig ?? null,
          fieldType: "json",
        })
      );
    }

    if (
      this.hasValueChanged(
        previousDetail?.companyPortalDashboardConfig ?? null,
        currentDetail?.companyPortalDashboardConfig ?? null
      )
    ) {
      details.push(
        this.auditHistoryLogDetailRepository.create({
          fieldName: "company_portal_dashboard_config",
          oldValue: previousDetail?.companyPortalDashboardConfig ?? null,
          newValue: currentDetail?.companyPortalDashboardConfig ?? null,
          fieldType: "json",
        })
      );
    }

    if (
      this.hasValueChanged(
        previousDetail?.companyPolicyConfig ?? null,
        currentDetail?.companyPolicyConfig ?? null
      )
    ) {
      details.push(
        this.auditHistoryLogDetailRepository.create({
          fieldName: "company_policy_config",
          oldValue: previousDetail?.companyPolicyConfig ?? null,
          newValue: currentDetail?.companyPolicyConfig ?? null,
          fieldType: "json",
        })
      );
    }

    if (
      (previousConfig?.companyLogoFileId ?? null) !==
      (currentConfig.companyLogoFileId ?? null)
    ) {
      details.push(
        this.auditHistoryLogDetailRepository.create({
          fieldName: "company_logo_file_id",
          oldValue: previousConfig?.companyLogoFileId ?? null,
          newValue: currentConfig.companyLogoFileId ?? null,
          fieldType: "number",
        })
      );
    }

    if (comments !== undefined && comments !== null) {
      details.push(
        this.auditHistoryLogDetailRepository.create({
          fieldName: "comments",
          oldValue: null,
          newValue: comments,
          fieldType: typeof comments === "string" ? "text" : "json",
        })
      );
    }

    return details;
  }

  private hasValueChanged(previousValue: any, newValue: any): boolean {
    return JSON.stringify(previousValue) !== JSON.stringify(newValue);
  }

  private mapPasswordConfigToRules(
    passwordConfig: Record<string, any>
  ): PasswordRuleDefinition[] {
    const rules: PasswordRuleDefinition[] = [];
    const policy = passwordConfig?.passwordPolicy;
    if (!policy) {
      return rules;
    }

    let ruleId = 1;
    if (policy.minLength) {
      rules.push({
        id: ruleId++,
        name: "Length",
        minChars: policy.minLength,
        errorMessage: `Password must be at least ${policy.minLength} characters long`,
      });
    }

    const requirements = policy.requirements ?? {};
    const keys = ["uppercase", "lowercase", "numbers", "special"];
    for (const key of keys) {
      const requirement = requirements[key];
      if (!requirement || !requirement.required) {
        continue;
      }

      const rule: PasswordRuleDefinition = {
        id: ruleId++,
        name: this.capitalizeRequirementName(key),
        isRequired: true,
        regex: requirement.regex ?? undefined,
        errorMessage: requirement.errorMessage
          ? requirement.errorMessage
          : `${this.capitalizeRequirementName(key)} requirement not satisfied`,
      };

      rules.push(rule);
    }

    return rules;
  }

  private capitalizeRequirementName(name: string): string {
    if (!name) {
      return name;
    }

    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  async getConfigScope(configId: number) {
    return this.companyConfigRepository.getConfigScope(configId);
  }

  async getTakenPolicies(companyId: number, excludeConfigId: number): Promise<number[]> {
    return this.companyConfigRepository.getTakenPolicies(companyId, excludeConfigId);
  }

  async upsertConfigScope(configId: number, dto: UpsertConfigScopeDto) {
    await this.companyConfigRepository.deleteConfigScope(configId);

    const rows: Partial<CompanyPortalConfigScope>[] = [];

    for (const company of dto.scope) {
      const allPolicies = !company.policies?.length;

      if (allPolicies) {
        rows.push({ configId, companyId: company.companyId, policyId: null, addressId: null } as any);
      } else {
        for (const pol of company.policies!) {
          rows.push({ configId, companyId: company.companyId, policyId: pol.policyId, addressId: null } as any);
        }
      }

      for (const locationId of company.locationIds ?? []) {
        rows.push({ configId, companyId: company.companyId, policyId: null, addressId: locationId } as any);
      }
    }

    await this.companyConfigRepository.insertConfigScope(rows);
    return { configId, inserted: rows.length };
  }
}
