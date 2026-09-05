import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import axios from "axios";
import {
  ADDED_DEPENDENTS_NOTIFICATION_PARAMETERS,
  DEFAULT_ENROLLMENT_TIME_OUT,
  ENROLLMENT_NOTIFICATION_PARAMETERS,
  LIFE_EVENT_NOTIFICATION_PARAMETERS,
  CLAIM_INTIMATION_NOTIFICATION_PARAMETERS,
  LOG_STATUS,
  LogStatus,
  NOTIFICATION_EMAIL,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_SMS,
  NOTIFICATION_SUCCESS,
  serviceNames,
  NOTIFICATION_SKIP_STATUS,
} from "../../../../service-lib/src/lib/constants";
import {
  Policy,
  PolicyEnrollmentEmployee,
  PolicyEnrollmentEmployeePolicyMap,
} from "../../../../service-lib/src/lib/entities";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { UserActivityLogService } from "../../../../service-lib/src/lib/company-employee-activity-log.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { removeUndefinedFields } from "../../../../service-lib/src/lib/utils/data-transform.util";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { createRedisClient } from "../../../../service-lib/src/lib/utils/redis.util";
import type Redis from "ioredis";
import {
  formatAmountWithCurrency,
  formatNumberByLocalization,
  getTaxLabel,
  CountryFormatConfig,
} from "../../../../service-lib/src/lib/utils/currency-format.util";
import {
  OnboardingResponseDto,
  SendAddedDependentsNotificationDto,
  SendEnrollmentConfirmationDto,
  SendEnrollmentReminderDto,
  SendEnrollmentStartDto,
  SendInitialOnboardingDto,
  SendLifeEventConfirmationDto,
} from "./dto/enrollment.dto";
import { SendClaimIntimationConfirmationDto, SendSupportTicketConfirmationDto, SendSupportTicketStatusChangedDto } from "../company-employee/dto/claims.dto";
import { OnboardingRepository } from "./onboarding.repository";

@Injectable()
export class OnboardingService {
  private readonly logger: ReturnType<typeof createLogger>;
  private readonly notificationServiceUrl: string;
  private readonly frontendIbpUrl: string;
  private readonly redis: Redis | null;
  // Safety-net TTL so a crashed/killed job never leaves the "in progress" flag stuck forever.
  private static readonly CONFIRMATION_JOB_TTL_SECONDS = 2 * 60 * 60;
  private static readonly PHONE_AUTH_METHOD_CODES = new Set([
    "PHONE_OTP",
    "PHONE_PASSWORD",
  ]);
  private static readonly EMAIL_AUTH_METHOD_CODES = new Set([
    "EMAIL_OTP",
    "EMAIL_PASSWORD",
    "USERNAME_PASSWORD",
  ]);
  // Sentinel in enrollmentReminderDays meaning "send a reminder every day within
  // the scheduler window" (not a day-count). Mirrors EVERYDAY in the UI section.
  private static readonly ENROLLMENT_REMINDER_EVERYDAY = -1;

  constructor(
    private readonly onboardingRepository: OnboardingRepository,
    private readonly traceIdService: TraceIdService,
    private readonly userActivityLogService: UserActivityLogService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.IBP_SERVICE);
    this.notificationServiceUrl = `${ENV.URL_NOTIFICATION_SERVICE}/notifications`;
    this.frontendIbpUrl = (ENV.FRONTEND_IBP_URL || "http://localhost:4201").replace(
      /\/+$/,
      "",
    );
    this.redis =
      ENV.STORAGE_TYPE === "valkey"
        ? createRedisClient({
            logger: this.logger,
            traceId: this.traceIdService.traceId,
            location: "OnboardingService",
            method: "constructor",
          })
        : null;
  }

  private confirmationJobRedisKey(companyId: number, subDomain?: string): string {
    return `confirmation-mail-job:${companyId}:${subDomain || "all"}`;
  }

  private async setConfirmationJobInProgress(
    companyId: number,
    subDomain?: string,
  ): Promise<void> {
    if (!this.redis) return;
    await this.redis.set(
      this.confirmationJobRedisKey(companyId, subDomain),
      "1",
      "EX",
      OnboardingService.CONFIRMATION_JOB_TTL_SECONDS,
    );
  }

  private async clearConfirmationJobInProgress(
    companyId: number,
    subDomain?: string,
  ): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(this.confirmationJobRedisKey(companyId, subDomain));
  }

  /**
   * Whether a bulk enrollment-confirmation send is currently running for this
   * company/domain. Backed by Redis with a TTL safety net; if Redis isn't
   * configured in this environment, this always reports false (no blocking).
   */
  async isConfirmationJobInProgress(
    companyId: number,
    subDomain?: string,
  ): Promise<boolean> {
    if (!this.redis) return false;
    const value = await this.redis.get(this.confirmationJobRedisKey(companyId, subDomain));
    return value === "1";
  }

  // Same Redis-backed "job in progress" pattern as the confirmation-mail job
  // above, for the initial-onboarding bulk trigger.
  private onboardingJobRedisKey(companyId: number, subDomain?: string): string {
    return `onboarding-mail-job:${companyId}:${subDomain || "all"}`;
  }

  private async setOnboardingJobInProgress(
    companyId: number,
    subDomain?: string,
  ): Promise<void> {
    if (!this.redis) return;
    await this.redis.set(
      this.onboardingJobRedisKey(companyId, subDomain),
      "1",
      "EX",
      OnboardingService.CONFIRMATION_JOB_TTL_SECONDS,
    );
  }

  private async clearOnboardingJobInProgress(
    companyId: number,
    subDomain?: string,
  ): Promise<void> {
    if (!this.redis) return;
    await this.redis.del(this.onboardingJobRedisKey(companyId, subDomain));
  }

  async isOnboardingJobInProgress(
    companyId: number,
    subDomain?: string,
  ): Promise<boolean> {
    if (!this.redis) return false;
    const value = await this.redis.get(this.onboardingJobRedisKey(companyId, subDomain));
    return value === "1";
  }

  private async createNotificationActivityLog(params: {
    userId?: number;
    activityKey: string;
    activityCategory: string;
    notificationInfoId?: number | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    this.logInfo("createNotificationActivityLog", "invoked", {
      userId: params.userId,
      notificationInfoId: params.notificationInfoId,
      activityKey: params.activityKey,
      metadata: params.metadata,
    });

    if (!params.notificationInfoId) {
      this.logInfo("createNotificationActivityLog", "SKIPPED — notificationInfoId is missing", {
        userId: params.userId,
        activityKey: params.activityKey,
      });
      return;
    }

    try {
      const saved = await this.userActivityLogService.createActivityLog({
        userId: params.userId,
        activityKey: params.activityKey,
        activityCategory: params.activityCategory,
        referenceId: params.notificationInfoId,
        referenceType: "NOTIFICATION_INFO",
        metadata: params.metadata,
      });
      this.logInfo("createNotificationActivityLog", "SUCCESS — activity log row created", {
        logId: saved?.id,
        userId: params.userId,
        notificationInfoId: params.notificationInfoId,
        activityKey: params.activityKey,
      });
    } catch (error) {
      this.logError("createNotificationActivityLog", "FAILED — DB insert threw", {
        userId: params.userId,
        notificationInfoId: params.notificationInfoId,
        activityKey: params.activityKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private getNotificationResultDetails(response: any): {
    isHttpSuccess: boolean;
    isNotificationSuccess: boolean;
    notificationInfoId: number | null;
  } {
    const statusCode = response?.status;
    const notificationStatus = response?.data?.data?.status;
    const notificationInfoId = response?.data?.data?.notificationInfoId;
    const isSkippedDisabled =
      notificationStatus === NOTIFICATION_SKIP_STATUS.DISABLED_FOR_COMPANY ||
      notificationStatus === NOTIFICATION_SKIP_STATUS.DISABLED_FOR_DOMAIN ||
      notificationStatus === NOTIFICATION_SKIP_STATUS.TEMPLATE_DISABLED;

    return {
      isHttpSuccess: statusCode === 200 || statusCode === 201,
      isNotificationSuccess: notificationStatus === NOTIFICATION_SUCCESS,
      notificationInfoId: Number.isFinite(Number(notificationInfoId))
        ? Number(notificationInfoId)
        : null,
    };
  }

  private buildIbpPublicAssetUrl(fileName?: string | null): string | undefined {
    const normalizedFileName = (fileName ?? "").trim().replace(/^\/+/, "");
    if (!normalizedFileName) {
      return undefined;
    }
    return `${this.frontendIbpUrl}/static-images/${normalizedFileName}`;
  }

  private parseCsvEmails(value: string | undefined): string[] {
    if (!value?.trim()) {
      return [];
    }

    return Array.from(
      new Set(
        value
          .split(",")
          .map((email) => email.trim())
          .filter((email) => email.length > 0),
      ),
    );
  }

  private getEmailBrandingAssets() {
    const iirmLogoUrl = this.buildIbpPublicAssetUrl(
      ENV.IBP_EMAIL_IIRM_LOGO_FILE || "iirmLogoUrl.png",
    );
    const onboardingIllustrationUrl = this.buildIbpPublicAssetUrl(
      ENV.IBP_EMAIL_ONBOARDING_ILLUSTRATION_FILE ||
        "illustrationLogoUrl.png",
    );

    return {
      iirmLogoUrl,
      onboardingIllustrationUrl,
      illustrationLogoUrl: onboardingIllustrationUrl,
    };
  }

  private getStrapiBaseUrl(): string | null {
    const baseUrl =
     ENV.URL_STRAPI_CMS_SERVICE || ENV.STRAPI_PUBLIC_URL;
    const normalized = String(baseUrl || "").trim().replace(/\/+$/, "");
    return normalized || null;
  }

  private normalizeStrapiRecord(record: any): any {
    if (!record) return null;
    return record.attributes ?? record;
  }

  private extractFirstContact(contact: any): {
    name?: string;
    email?: string;
    phone?: string;
  } | null {
    if (!contact) {
      return null;
    }
    // Strapi returns single components as objects and repeatables as arrays.
    if (Array.isArray(contact) && !contact.length) {
      return null;
    }
    const firstContactRaw = this.normalizeStrapiRecord(
      Array.isArray(contact) ? contact[0] : contact,
    );
    if (!firstContactRaw) {
      return null;
    }
    return {
      name: firstContactRaw.name,
      email: firstContactRaw.email,
      phone: firstContactRaw.phone,
    };
  }

  // Cached per companyId for the lifetime of the process. The enrollment paths
  // send per employee, and the Strapi call below carries a 100s timeout — one
  // call per employee would flood the CMS. A contact edited in Strapi therefore
  // reaches these mails only after a restart.
  private readonly escalationContactsCache = new Map<
    number,
    Promise<
      Awaited<
        ReturnType<OnboardingService["fetchCompanyTemplateEscalationContacts"]>
      >
    >
  >();

  private getCachedEscalationContacts(companyId: number) {
    const cached = this.escalationContactsCache.get(companyId);
    if (cached) {
      return cached;
    }
    const pending = this.fetchCompanyTemplateEscalationContacts(companyId).then(
      (contacts) => {
        // Different mails resolve companyId differently — some from the policy,
        // some from the employee — so log which one was queried and whether it
        // produced contacts. Compare across mails when one renders the section
        // and another does not.
        this.logInfo(
          "getCachedEscalationContacts",
          "Resolved broker escalation contacts",
          {
            companyId,
            foundPrimary: !!contacts.primaryEscalationEmail,
            foundSecondary: !!contacts.secondaryEscalationEmail,
          },
        );
        return contacts;
      },
    );
    this.escalationContactsCache.set(companyId, pending);
    return pending;
  }

  /**
   * Escalation contact parameters for the "Support Contacts" section shared by
   * the onboarding, enrollment confirmation, life event, added dependents and
   * support ticket raised mails.
   */
  private async getSupportContactParams(
    companyId: number | undefined | null,
  ): Promise<Record<string, string | undefined>> {
    if (!companyId) {
      return {};
    }
    try {
      const contacts = await this.getCachedEscalationContacts(companyId);
      const primaryEmail =
        contacts.primaryEscalationEmail || ENV.DEFAULT_SUPPORT_EMAIL;

      // Return nothing rather than a card full of dashes. Every parameter left
      // undefined makes the template's {{#if primaryEscalationEmail}} guard
      // false, so the whole section disappears instead of rendering empty.
      if (!primaryEmail) {
        this.logInfo(
          "getSupportContactParams",
          "No broker escalation contacts resolved; hiding the Support Contacts section",
          { companyId },
        );
        return {};
      }

      return {
        primaryEscalationName:
          contacts.primaryEscalationName || "Primary Escalation",
        primaryEscalationEmail: primaryEmail,
        primaryEscalationPhone:
          contacts.primaryEscalationPhone || ENV.DEFAULT_SUPPORT_PHONE || "-",
        // Left undefined so the template's {{#if secondaryEscalationEmail}}
        // guard can hide the block when there is no secondary contact.
        secondaryEscalationName: contacts.secondaryEscalationName,
        secondaryEscalationEmail: contacts.secondaryEscalationEmail,
        secondaryEscalationPhone: contacts.secondaryEscalationPhone,
      };
    } catch {
      return {};
    }
  }

  private async fetchCompanyTemplateEscalationContacts(companyId: number): Promise<{
    primaryEscalationName?: string;
    primaryEscalationEmail?: string;
    primaryEscalationPhone?: string;
    secondaryEscalationName?: string;
    secondaryEscalationEmail?: string;
    secondaryEscalationPhone?: string;
    hrContactName?: string;
    hrContactEmail?: string;
    hrContactPhone?: string;
  }> {
    try {
      const strapiBaseUrl = this.getStrapiBaseUrl();
      if (!strapiBaseUrl) {
        return {};
      }

      const response = await axios.get(
        `${strapiBaseUrl}/api/company-templates/company/${companyId}`,
        {
          timeout: 100000,
        },
      );
      console.log("Strapi response for company template:", response?.data);
      const rawPayload = response?.data;
      const records = Array.isArray(rawPayload?.data)
        ? rawPayload.data
        : Array.isArray(rawPayload)
        ? rawPayload
        : rawPayload?.data
        ? [rawPayload.data]
        : rawPayload
        ? [rawPayload]
        : [];

      const firstRecord = this.normalizeStrapiRecord(records[0]);
      const config = this.normalizeStrapiRecord(firstRecord?.config);
      const contactMatrix = this.normalizeStrapiRecord(config?.contactMatrix);

      const broker = this.normalizeStrapiRecord(contactMatrix?.broker);
      const hrContacts = this.normalizeStrapiRecord(contactMatrix?.hrContacts);

      const primaryEscalation = this.extractFirstContact(
        broker?.primaryEscalation,
      );
      const secondaryEscalation = this.extractFirstContact(
        broker?.secondaryEscalation,
      );
      const hrContact = this.extractFirstContact(hrContacts?.primaryEscalation);

      return removeUndefinedFields({
        primaryEscalationName: primaryEscalation?.name,
        primaryEscalationEmail: primaryEscalation?.email,
        primaryEscalationPhone: primaryEscalation?.phone,
        secondaryEscalationName: secondaryEscalation?.name,
        secondaryEscalationEmail: secondaryEscalation?.email,
        secondaryEscalationPhone: secondaryEscalation?.phone,
        hrContactName: hrContact?.name,
        hrContactEmail: hrContact?.email,
        hrContactPhone: hrContact?.phone,
      });
    } catch (error) {
      this.logError("fetchCompanyTemplateEscalationContacts", error, {
        companyId,
      });
      return {};
    }
  }

  private dedupeRepeatedNameParts(name?: string | null): string | undefined {
    const normalizedName = (name ?? "").trim().replace(/\s+/g, " ");
    if (!normalizedName) {
      return undefined;
    }

    const parts = normalizedName.split(" ");
    if (parts.length === 2 && parts[0].toLowerCase() === parts[1].toLowerCase()) {
      return parts[0];
    }

    return normalizedName;
  }

  private extractCoveredRelationsFromPolicyTemplate(policyTemplate: any): string[] {
    const normalizedRelations = new Set<string>();

    const addRelations = (relations: unknown) => {
      if (!Array.isArray(relations)) {
        return;
      }
      relations.forEach((relation) => {
        if (typeof relation !== "string") {
          return;
        }
        const cleaned = relation
          .replace(/\s+/g, " ")
          .replace(/,/g, "")
          .trim()
          .replace(/^[,|;\s]+|[,|;\s]+$/g, "")
          .trim();
        if (cleaned.length) {
          normalizedRelations.add(cleaned);
        }
      });
    };

    const processSection = (section: any) => {
      if (!section || typeof section !== "object") {
        return;
      }
      addRelations(section.eligibleRelations);
      if (Array.isArray(section.addonIds)) {
        section.addonIds.forEach((addon: any) =>
          addRelations(addon?.eligibleRelations),
        );
      }
    };

    processSection(policyTemplate?.basePolicy);
    processSection(policyTemplate?.parentalPolicy);

    return Array.from(normalizedRelations);
  }

  private buildMembersCoveredHtml(membersCovered: string[]): string {
    if (!membersCovered.length) {
      return "";
    }
    const escapedMembers = membersCovered.map((member) =>
      member
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;"),
    );
    return `<ul>${escapedMembers.map((member) => `<li>${member}</li>`).join("")}</ul>`;
  }

  private buildDisplayName(
    firstName?: string | null,
    lastName?: string | null,
    fallbackName?: string | null,
  ): string {
    const normalizedFirstName = (firstName ?? "").trim();
    const normalizedLastName = (lastName ?? "").trim();

    if (normalizedFirstName && normalizedLastName) {
      return `${normalizedFirstName} ${normalizedLastName}`.trim();
    }

    if (normalizedFirstName) {
      return normalizedFirstName;
    }

    if (normalizedLastName) {
      return normalizedLastName;
    }

    return this.dedupeRepeatedNameParts(fallbackName) || "User";
  }

  private logInfo(
    method: string,
    messageData = "method invoked",
    payload = {},
    status: LogStatus = LOG_STATUS.SUCCESS,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status,
        location: "OnboardingService",
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
        location: "OnboardingService",
        method,
        payload,
        messageData: error,
      }),
    });
  }

  private resolveAuthMethodRouting(
    methodCodeRaw?: string | null,
    methodNameRaw?: string | null,
  ): { shouldSendEmail: boolean; shouldSendPhone: boolean } {
    const methodCode = (methodCodeRaw ?? "").trim().toUpperCase();
    const methodName = (methodNameRaw ?? "").trim().toLowerCase();

    const shouldSendPhone =
      OnboardingService.PHONE_AUTH_METHOD_CODES.has(methodCode) ||
      methodName.includes("phone");

    // Business rule: onboarding notifications should always go via email.
    return { shouldSendEmail: true, shouldSendPhone };
  }

  /**
   * Get portal URL for company from company_portal_configuration table.
   *
   * configId, when the caller already knows it exactly (e.g. decoded straight
   * from the sender's own auth token for an authenticated employee-portal
   * action), takes priority over everything else — it's looked up directly,
   * with no guessing involved at all. This is the most reliable path and
   * should be preferred whenever it's available.
   *
   * Otherwise, when a policyId is available, resolves the specific domain
   * that policy is scoped to (via company_portal_config_scope) instead of an
   * arbitrary domain row belonging to the same company — otherwise every
   * domain's mail would link to whichever domain happens to be returned
   * first for that companyId. Fallback to COMPANY_PORTAL_URL env variable,
   * then IBP_PORTAL_URL.
   */
  private async getPortalUrlForCompany(
    companyId: number,
    policyId?: number,
    configId?: number | null,
  ): Promise<{ url: string; subDomain?: string | null }> {
    try {
      const portalConfig = configId
        ? await this.onboardingRepository.findConfigCompanyById(configId)
        : policyId
        ? await this.onboardingRepository.findConfigCompanyForPolicy(
            companyId,
            policyId,
          )
        : await this.onboardingRepository.findCompanyPortalConfiguration(companyId);

      if (portalConfig?.companyPortalUrl) {
        return { url: portalConfig.companyPortalUrl, subDomain: portalConfig.subDomain };
      }

      // Fallback to COMPANY_PORTAL_URL env variable
      if (ENV.COMPANY_PORTAL_URL) {
        return { url: ENV.COMPANY_PORTAL_URL, subDomain: portalConfig?.subDomain };
      }

      // Final fallback to IBP_PORTAL_URL or root
      return { url: ENV.IBP_PORTAL_URL || '/', subDomain: portalConfig?.subDomain };
    } catch (error) {
      this.logError('getPortalUrlForCompany', error, { companyId, policyId });
      // On error, use env fallbacks
      return { url: ENV.COMPANY_PORTAL_URL || ENV.IBP_PORTAL_URL || '/', subDomain: null };
    }
  }

  /**
   * Send initial onboarding notification for a new employee
   */
  async sendInitialOnboardingNotification(
    dto: SendInitialOnboardingDto,
    tokenConfigId?: number | null,
    triggeredByUserId?: number,
  ): Promise<OnboardingResponseDto> {
    try {
      const policyIds = [
        ...new Set(
          (dto.policyIds?.length ? dto.policyIds : [dto.policyId]).filter(
            (policyId): policyId is number => Number.isFinite(policyId),
          ),
        ),
      ];

      if (!dto.employeeId || !policyIds.length) {
        throw new BadRequestException(
          "Employee ID and at least one policy ID are required",
        );
      }

      this.logInfo(
        "sendInitialOnboarding Notification",
        `Sending initial onboarding notification for employee ${dto.employeeId}`,
        {
          ...dto,
          policyIds,
          triggeredByUserId,
        },
      );

      const { employee, policies, authConfig } =
        await this.onboardingRepository.validateGroupedInitialOnboardingEntities(
          dto.employeeId,
          policyIds,
        );

      const primaryPolicy = policies[0];
      const employeeDisplayName = this.buildDisplayName(
        employee.firstName,
        employee.lastName,
        employee.employeeName,
      );

      const escalationContacts = await this.getCachedEscalationContacts(
        primaryPolicy.companyId,
      );
      const supportContactParams = await this.getSupportContactParams(
        primaryPolicy.companyId,
      );

      // Get portal URL (and its domain) for company
      const { url: portalUrl, subDomain: portalSubDomain } = await this.getPortalUrlForCompany(
        primaryPolicy.companyId,
        primaryPolicy.id,
        tokenConfigId,
      );
      const brandingAssets = this.getEmailBrandingAssets();
      const membersCoveredByPolicy = new Map<number, string[]>();

      await Promise.all(
        policies.map(async (policy) => {
          const policyTemplate =
            await this.onboardingRepository.findLivePolicyTemplateByPolicyId(
              policy.id,
            );
          membersCoveredByPolicy.set(
            policy.id,
            this.extractCoveredRelationsFromPolicyTemplate(policyTemplate),
          );
        }),
      );

      const membersCovered = Array.from(
        new Set(
          Array.from(membersCoveredByPolicy.values()).flatMap(
            (relations) => relations,
          ),
        ),
      );

      const policyDetails = policies.map((policy) => ({
        policyId: policy.id,
        policyName: policy.policyName,
        policyStartDate: this.formatDisplayDate(policy.policyFrom),
        policyEndDate: this.formatDisplayDate(policy.policyTo),
        membersCovered: membersCoveredByPolicy.get(policy.id) ?? [],
      }));

      const dash = "-";

      // Build parameters for the template
      const parameters = removeUndefinedFields({
        [ENROLLMENT_NOTIFICATION_PARAMETERS.EMPLOYEE_NAME]:
          employeeDisplayName,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.EMAIL_ID]: employee.email,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_NAME]:
          primaryPolicy.policyName,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_START_DATE]:
          this.formatDisplayDate(primaryPolicy.policyFrom),
        [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_END_DATE]:
          this.formatDisplayDate(primaryPolicy.policyTo),
        [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_DETAILS]: policyDetails,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.PORTAL_LINK]: portalUrl,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.COMPANY_NAME]:
          primaryPolicy.company?.companyName || "IIRM",
        [ENROLLMENT_NOTIFICATION_PARAMETERS.SUPPORT_EMAIL]:
          escalationContacts.primaryEscalationEmail ||
          ENV.DEFAULT_SUPPORT_EMAIL ||
          dash,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.SUPPORT_PHONE]:
          escalationContacts.primaryEscalationPhone ||
          ENV.DEFAULT_SUPPORT_PHONE ||
          dash,
        ...supportContactParams,
        hrContactName: escalationContacts.hrContactName || dash,
        hrContactEmail: escalationContacts.hrContactEmail || dash,
        hrContactPhone: escalationContacts.hrContactPhone || dash,
        iirmLogoUrl: brandingAssets.iirmLogoUrl,
        onboardingIllustrationUrl: brandingAssets.onboardingIllustrationUrl,
        illustrationLogoUrl: brandingAssets.illustrationLogoUrl,
        membersCovered,
        membersCoveredText: membersCovered.length
          ? membersCovered.join(" | ")
          : "Not available",
        membersCoveredHtml: this.buildMembersCoveredHtml(membersCovered),
        currentYear: new Date().getFullYear(),
        isMultiPolicy: policyDetails.length > 1,
        policyCount: policyDetails.length,
      });

      const methodName = authConfig.authenticationMethod?.methodName ?? "";
      const methodCode = authConfig.authenticationMethod?.methodCode ?? "";
      const { shouldSendEmail, shouldSendPhone: routedShouldSendPhone } =
        this.resolveAuthMethodRouting(methodCode, methodName);
      // emailOnly (used by the single-employee test-trigger) forces email regardless
      // of the company's configured auth method routing.
      const shouldSendPhone = dto.emailOnly ? false : routedShouldSendPhone;
      const emailRecipient = employee.email;
      const phoneRecipient = employee.phoneNumber;

      // Prepare notification requests
      const notificationRequests: Array<{
        channel: "email" | "sms";
        request: Promise<any>;
      }> = [];

      if (shouldSendEmail) {
        if (!emailRecipient) {
          throw new Error(
            `Email not found for employee with ID: ${employee.id}`,
          );
        }

        notificationRequests.push({
          channel: "email",
          request: axios.post(
            this.notificationServiceUrl,
            removeUndefinedFields({
              eventType: NOTIFICATION_EVENT_TYPES.INITIAL_ONBOARDING_EMAIL,
              emailId: [emailRecipient],
              channel: NOTIFICATION_EMAIL,
              parameters,
              userId: employee.userId ? [employee.userId] : undefined,
              companyId: primaryPolicy.companyId,
              domain: portalSubDomain,
              configId: tokenConfigId,
              save: true,
              source: "IBP",
            }),
            {
              headers: {
                "Content-Type": "application/json",
              },
              timeout: DEFAULT_ENROLLMENT_TIME_OUT,
            },
          ),
        });
      }

      // Send SMS if method is Phone and phone number exists
      if (shouldSendPhone && phoneRecipient) {
        notificationRequests.push({
          channel: "sms",
          request: axios.post(
            this.notificationServiceUrl,
            removeUndefinedFields({
              eventType: NOTIFICATION_EVENT_TYPES.INITIAL_ONBOARDING_MESSAGE,
              phoneNumber: [phoneRecipient],
              channel: NOTIFICATION_SMS,
              parameters,
              userId: employee.userId ? [employee.userId] : undefined,
              companyId: primaryPolicy.companyId,
              domain: portalSubDomain,
              save: true,
              source: "IBP",
            }),
            {
              headers: {
                "Content-Type": "application/json",
              },
              timeout: DEFAULT_ENROLLMENT_TIME_OUT,
            },
          ),
        });
      }

      if (!notificationRequests.length) {
        throw new Error(
          `No valid notification channel available for employee with ID: ${employee.id}`,
        );
      }

      // Email is required for onboarding completion; SMS is best-effort.
      const settledResponses = await Promise.allSettled(
        notificationRequests.map((item) => item.request),
      );

      let hasAnySuccess = false;
      let hasEmailSuccess = false;
      let onboardingEmailNotificationInfoId: number | null = null;

      for (let index = 0; index < settledResponses.length; index += 1) {
        const result = settledResponses[index];
        const channel = notificationRequests[index].channel;

        if (result.status === "fulfilled") {
          const {
            isHttpSuccess,
            isNotificationSuccess,
            notificationInfoId,
          } = this.getNotificationResultDetails(result.value);
          const statusCode = result.value?.status;
          const isSuccess = isHttpSuccess;
          if (isSuccess) {
            hasAnySuccess = true;
            if (channel === "email") {
              hasEmailSuccess = true;
              if (isNotificationSuccess) {
                onboardingEmailNotificationInfoId = notificationInfoId;
              }
            }
            continue;
          }

          this.logError(
            "sendInitialOnboardingNotification",
            `Initial onboarding ${channel} notification returned non-success status ${statusCode}`,
            {
              employeeId: dto.employeeId,
              policyIds,
              channel,
              statusCode,
            },
          );
          continue;
        }

        this.logError(
          "sendInitialOnboardingNotification",
          `Initial onboarding ${channel} notification failed: ${
            result.reason?.message ?? "Unknown error"
          }`,
          {
            employeeId: dto.employeeId,
            policyIds,
            channel,
            // axios' own message ("Request failed with status code 400") hides the
            // actual reason — surface notification-service's real response body too.
            notificationServiceResponse: result.reason?.response?.data,
          },
        );
      }

      if (shouldSendEmail && !hasEmailSuccess) {
        throw new Error(
          `Initial onboarding email notification failed for employee with ID: ${employee.id}`,
        );
      }

      if (!shouldSendEmail && !hasAnySuccess) {
        throw new Error(
          `Initial onboarding notification failed for employee with ID: ${employee.id}`,
        );
      }

      await this.createNotificationActivityLog({
        userId: dto.employeeId,
        activityKey: "INITIAL_ONBOARDING_EMAIL_SENT",
        activityCategory: "ONBOARDING",
        notificationInfoId: onboardingEmailNotificationInfoId,
        metadata: {
          employeeId: dto.employeeId,
          policyIds,
        },
      });

      this.logInfo(
        "sendInitialOnboardingNotification",
        "Initial onboarding notification sent successfully",
        { employeeId: dto.employeeId, policyIds },
      );

      return {
        message: "Initial onboarding notification sent successfully",
        success: true,
      };
    } catch (error) {
      console.log("error", error)
      this.logError("sendInitialOnboardingNotification", error, dto);
      throw new BadRequestException(
        "Failed to send initial onboarding notification",
      );
    }
  }

  async triggerCompanyInitialOnboardingNotifications(
    companyId: number,
    subDomain?: string,
    triggeredByUserId?: number,
  ): Promise<OnboardingResponseDto> {
    const company = await this.onboardingRepository.findCompanyById(companyId);
    if (!company) {
      throw new NotFoundException(`Company not found for companyId ${companyId}`);
    }

    const scopedPolicyIds = subDomain
      ? await this.onboardingRepository.findScopedPolicyIdsBySubDomain(
          companyId,
          subDomain,
        )
      : null;

    const pendingMappings =
      await this.onboardingRepository.findPendingInitialOnboardingMappingsByCompany(
        companyId,
        scopedPolicyIds,
      );

    if (!pendingMappings.length) {
      return {
        message: "No pending initial onboarding notifications found for this company",
        success: true,
        totalPolicies: 0,
        successCount: 0,
        failedCount: 0,
        details: [],
      };
    }

    // Marks a Redis-backed "job in progress" flag, same pattern as the
    // confirmation-mail job, so the UI can keep the trigger button disabled
    // for the whole background run -- cleared in `finally` no matter how the
    // job ends.
    await this.setOnboardingJobInProgress(companyId, subDomain);

    try {
      const groupedMappings = new Map<
        string,
        {
          employeeId: number;
          mappingIds: number[];
          policyIds: number[];
        }
      >();

      pendingMappings.forEach((mapping) => {
        const groupKey = `${mapping.employeeId}:${mapping.companyId}`;
        const existingGroup = groupedMappings.get(groupKey);

        if (existingGroup) {
          existingGroup.mappingIds.push(Number(mapping.id));
          existingGroup.policyIds.push(Number(mapping.policyId));
          return;
        }

        groupedMappings.set(groupKey, {
          employeeId: Number(mapping.employeeId),
          mappingIds: [Number(mapping.id)],
          policyIds: [Number(mapping.policyId)],
        });
      });

      const sentMappingIds: number[] = [];
      const details: Array<{ policyId: number; status: string; message: string }> = [];
      let successCount = 0;
      let failedCount = 0;

      for (const group of groupedMappings.values()) {
        try {
          await this.sendInitialOnboardingNotification(
            {
              employeeId: group.employeeId,
              policyIds: group.policyIds,
              domain: subDomain,
            } as SendInitialOnboardingDto,
            null,
            triggeredByUserId,
          );

          sentMappingIds.push(...group.mappingIds);
          successCount += group.policyIds.length;
          group.policyIds.forEach((policyId) => {
            details.push({
              policyId,
              status: "success",
              message: "Initial onboarding notification sent successfully",
            });
          });
        } catch (error) {
          failedCount += group.policyIds.length;
          group.policyIds.forEach((policyId) => {
            details.push({
              policyId,
              status: "failed",
              message: error?.message ?? "Failed to send initial onboarding notification",
            });
          });
        }
      }

      await this.onboardingRepository.markInitialOnboardingMailSent(sentMappingIds);

      this.logInfo(
        "triggerCompanyInitialOnboardingNotifications",
        `Onboarding mail batch complete for companyId ${companyId} — ${successCount} sent, ${failedCount} failed`,
        { companyId, subDomain, triggeredByUserId, successCount, failedCount },
      );

      return {
        message: "Pending initial onboarding notifications processed successfully",
        success: failedCount === 0,
        totalPolicies: pendingMappings.length,
        successCount,
        failedCount,
        details,
      };
    } finally {
      await this.clearOnboardingJobInProgress(companyId, subDomain);
    }
  }

  /**
   * Preview which employees a triggerCompanyInitialOnboardingNotifications
   * run would mail -- same eligibility filter as the trigger itself
   * (isOnBoradingMailSent = false), paginated. Mirrors
   * previewBulkEnrollmentConfirmation for the enrollment-confirmation flow.
   */
  async previewCompanyInitialOnboardingNotifications(
    companyId: number,
    subDomain?: string,
    page = 1,
    limit = 25,
  ): Promise<{
    totalCount: number;
    page: number;
    limit: number;
    employees: Array<{
      employeeId: number;
      employeeName: string;
      employeeEmail: string | null;
      companyEmployeeId: string | null;
    }>;
  }> {
    const scopedPolicyIds = subDomain
      ? await this.onboardingRepository.findScopedPolicyIdsBySubDomain(
          companyId,
          subDomain,
        )
      : null;

    const employeeDetails =
      await this.onboardingRepository.findPendingInitialOnboardingEmployeesByCompany(
        companyId,
        scopedPolicyIds,
      );

    const employees = employeeDetails.map((employee) => ({
      employeeId: employee.id,
      employeeName: this.buildDisplayName(
        null,
        null,
        employee.fullName || employee.employeeName,
      ),
      employeeEmail: employee.email ?? null,
      // company_employee_id is the client-assigned employee code (e.g. EIN) --
      // employee_company_id is a different column entirely (identifies the
      // company owning the policy), so it must not be used here.
      companyEmployeeId: employee.companyEmployeeId ?? null,
    }));

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const start = (safePage - 1) * safeLimit;

    return {
      totalCount: employees.length,
      page: safePage,
      limit: safeLimit,
      employees: employees.slice(start, start + safeLimit),
    };
  }

  /**
   * Test-trigger the initial onboarding mail for a single employee, identified by email,
   * without touching isOnBoradingMailSent — always resends, regardless of whether the real
   * bulk/cron flow already sent it, and never marks it as sent so that bookkeeping is untouched.
   */
  async triggerTestInitialOnboardingNotification(
    companyId: number,
    email: string,
    subDomain?: string,
  ): Promise<OnboardingResponseDto> {
    try {
      const company = await this.onboardingRepository.findCompanyById(companyId);
      if (!company) {
        throw new NotFoundException(`Company not found for companyId ${companyId}`);
      }

      const employeeId = await this.onboardingRepository.findEmployeeIdByEmailAndCompany(
        email,
        companyId,
      );
      if (!employeeId) {
        throw new NotFoundException("The user is not configured under this domain.");
      }

      const scopedPolicyIds = subDomain
        ? await this.onboardingRepository.findScopedPolicyIdsBySubDomain(
            companyId,
            subDomain,
          )
        : null;

      const policyIds = await this.onboardingRepository.findEmployeeOnboardingPolicyIds(
        employeeId,
        companyId,
        scopedPolicyIds,
      );

      if (!policyIds.length) {
        throw new NotFoundException("The user is not configured under this domain.");
      }

      await this.sendInitialOnboardingNotification({
        employeeId,
        policyIds,
        emailOnly: true,
      } as SendInitialOnboardingDto);

      return {
        message: `Onboarding mail sent successfully to ${email}`,
        success: true,
      };
    } catch (error) {
      this.logError("triggerTestInitialOnboardingNotification", error, {
        companyId,
        email,
        subDomain,
      });
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Failed to trigger onboarding mail");
    }
  }

  // Send enrollment confirmation notification
  async sendEnrollmentConfirmationNotification(
    dto: SendEnrollmentConfirmationDto,
    tokenConfigId?: number | null,
  ) {
    console.log("sendEnrollmentConfirmationNotification called with dto:", tokenConfigId);
    const uniquePolicyIds = Array.from(
      new Set(
        (dto.policyIds || [])
          .map((policyId) => Number(policyId))
          .filter((policyId) => Number.isFinite(policyId)),
      ),
    );

    const results = {
      totalPolicies: uniquePolicyIds.length,
      successCount: 0,
      failedCount: 0,
      details: [] as Array<{ policyId: number; status: string; message: string }>,
    };

    let submissionMeta:
      | { submissionCount: number; referenceNumber: string }
      | null = null;

    try {
      this.logInfo(
        "sendEnrollmentConfirmationNotification",
        `Sending enrollment confirmation for employee ${dto.employeeId} across ${uniquePolicyIds.length} policies`,
        dto,
      );

      const successfulPolicies: Array<{
        policyId: number;
        policy: Policy;
        employee: PolicyEnrollmentEmployee;
        authConfig: any;
        confirmationDetails: {
          totalLives: number;
          dependentDetails: Array<{ name: string; relation: string }>;
          premium: number;
          selfPaid: number;
          companyPaid: number;
          sumInsured: number;
          isGstApplicable: boolean;
          showEmployeeContribution: boolean;
          showCompanyContribution: boolean;
          choices: Array<{ componentLabel: string; sumInsured: number; premium: number; companyPaid: number; selfPaid: number; totalLives: number; dependentDetails: Array<{ name: string; relation: string }>; selfCovered: boolean; showCompanyContribution: boolean }>;
        };
      }> = [];

      for (const policyId of uniquePolicyIds) {
        try {
          const { employee, policy, authConfig } =
            await this.onboardingRepository.validateEntities(
              dto.employeeId,
              policyId,
            );

          const confirmationDetails =
            await this.onboardingRepository.getEnrollmentConfirmationDetails(
              dto.employeeId,
              policyId,
            );

          successfulPolicies.push({
            policyId,
            policy,
            employee,
            authConfig,
            confirmationDetails,
          });
        } catch (error) {
          results.details.push({
            policyId,
            status: "failed",
            message: error instanceof Error ? error.message : "Unknown error",
          });
          this.logError("sendEnrollmentConfirmationNotification", error, {
            policyId,
            employeeId: dto.employeeId,
          });
        }
      }

      results.failedCount = results.details.length;

      if (!successfulPolicies.length) {
        return {
          message: "Enrollment confirmation could not be sent for any policy",
          success: false,
          ...results,
        };
      }

      const primary = successfulPolicies[0];
      const employee = primary.employee;
      const employeeDisplayName = this.buildDisplayName(
        employee.firstName,
        employee.lastName,
        employee.employeeName,
      );
      const methodName =
        primary.authConfig?.authenticationMethod?.methodName ?? "";
      const methodCode =
        primary.authConfig?.authenticationMethod?.methodCode ?? "";
      const emailRecipient = employee.email;
      const phoneRecipient = employee.phoneNumber;
      // Prefer the EMPLOYEE's own companyId over the policy's — a policy's
      // companyId can legitimately diverge from the enrolling employee's own
      // company (e.g. shared/cross-company policies), and this is the exact
      // companyId getPortalUrlForCompany/findConfigCompanyForPolicy uses to
      // resolve which domain's config (and template override) applies.
      // sendAddedDependentsNotification/sendSupportTicketConfirmationNotification
      // already resolve companyId this way — align with what's proven working there.
      const companyId = employee.companyId ?? primary.policy.companyId;
      // Resolve the domain the same way sendSupportTicketConfirmationNotification
      // does (confirmed working there): via ANY of the employee's own enrolled
      // policy mappings (findAllEmployeePolicies), not the specific policy.id
      // being confirmed here. company_portal_config_scope may only have a row
      // for the employee's other/earlier policy, not yet for this particular
      // one — using the same employee-mapping lookup as the proven-working
      // ticket flow means both resolve to the same (correct) domain for the
      // same employee, instead of this specific policy silently missing scope
      // coverage and falling through to the "can't disambiguate" default.
      // Falls back to this policy's own id only if the employee has no
      // enrollment mappings at all (shouldn't normally happen mid-enrollment).
      const domainResolutionPolicyId =
        (await this.onboardingRepository.findAllEmployeePolicies(dto.employeeId))[0]?.policyId ??
        primary.policy.id;
      const { url: portalUrl, subDomain: portalSubDomain } = await this.getPortalUrlForCompany(
        companyId,
        domainResolutionPolicyId,
        tokenConfigId,
      );
      const brandingAssets = this.getEmailBrandingAssets();

      if (!emailRecipient) {
        throw new Error(
          `Email not found for employee with user ID: ${employee.userId}`,
        );
      }

      const policyDetails = successfulPolicies.flatMap((entry) => {
        const componentMatch = entry.policy.policyName.match(/\(([^)]+)\)\s*$/);
        const extracted = componentMatch ? componentMatch[1] : null;
        const isAbbreviation = extracted ? /^[A-Z0-9]{2,5}$/.test(extracted) : false;
        const fallbackComponentLabel = extracted && !isAbbreviation ? extracted : entry.policy.policyName;
        const policyGroupName = (entry.policy as any).policyType?.lookUpValue ?? entry.policy.policyName;
        const baseCommonFields = {
          policyId: entry.policyId,
          policyName: entry.policy.policyName,
          policyGroupName,
          policyStartDate: this.formatDisplayDate(entry.policy.policyFrom),
          policyEndDate: this.formatDisplayDate(entry.policy.policyTo),
          isGstApplicable: entry.confirmationDetails.isGstApplicable ?? true,
        };
        const gstApplicable = entry.confirmationDetails.isGstApplicable ?? true;
        const withGst = (v: number) => gstApplicable ? parseFloat((v * 1.18).toFixed(2)) : v;
        const gstOf = (v: number) => gstApplicable ? parseFloat((v * 0.18).toFixed(2)) : 0;
        const choices = entry.confirmationDetails.choices ?? [];
        if (choices.length > 0) {
          return choices.map((choice) => {
            const base = Number(choice.selfPaid ?? 0);
            const showCompany = choice.showCompanyContribution === true;
            const companyBase = showCompany ? Number(choice.companyPaid ?? 0) : 0;
            const selfName = this.buildDisplayName(
              undefined,
              undefined,
              employee.employeeName,
            );
            const members = [
              ...(choice.selfCovered ? [{ name: selfName, relation: "Self" }] : []),
              ...(choice.dependentDetails || []),
            ];
            return {
              ...baseCommonFields,
              componentLabel: choice.componentLabel,
              premium: parseFloat((withGst(base) + withGst(companyBase)).toFixed(2)),
              selfPaidBase: base,
              gstAmount: gstOf(base),
              selfPaid: withGst(base),
              companyPaidBase: companyBase,
              companyGstAmount: gstOf(companyBase),
              companyPaid: withGst(companyBase),
              sumInsured: choice.sumInsured,
              totalLives: choice.totalLives,
              dependentDetails: members,
              showEmployeeContribution: entry.confirmationDetails.showEmployeeContribution,
              showCompanyContribution: showCompany,
            };
          });
        }
        const base = Number(entry.confirmationDetails.selfPaid ?? 0);
        const showCompany = entry.confirmationDetails.showCompanyContribution === true;
        const companyBase = showCompany ? Number(entry.confirmationDetails.companyPaid ?? 0) : 0;
        return [{
          ...baseCommonFields,
          componentLabel: fallbackComponentLabel,
          premium: parseFloat((withGst(base) + withGst(companyBase)).toFixed(2)),
          selfPaidBase: base,
          gstAmount: gstOf(base),
          selfPaid: withGst(base),
          companyPaidBase: companyBase,
          companyGstAmount: gstOf(companyBase),
          companyPaid: withGst(companyBase),
          sumInsured: entry.confirmationDetails.sumInsured,
          totalLives: entry.confirmationDetails.totalLives,
          dependentDetails: entry.confirmationDetails.dependentDetails || [],
          showEmployeeContribution: entry.confirmationDetails.showEmployeeContribution,
          showCompanyContribution: showCompany,
          components: choices.map((choice) => ({
            label: choice.componentLabel,
            sumInsured: choice.sumInsured,
            premium: choice.premium,
            selfPaid: choice.selfPaid,
            companyPaid: choice.companyPaid,
          })),
        }];
      });

      const groupedPoliciesMap = new Map<string, typeof policyDetails>();
      for (const p of policyDetails) {
        const key = p.policyGroupName;
        if (!groupedPoliciesMap.has(key)) groupedPoliciesMap.set(key, []);
        groupedPoliciesMap.get(key)!.push(p);
      }
      const groupedPolicies = Array.from(groupedPoliciesMap.entries()).map(([groupName, policies]) => ({
        groupName,
        policies,
        showCompanyContribution: policies.every((p) => p.showCompanyContribution),
      }));

      const totalLives = policyDetails.reduce(
        (sum, item) => sum + Number(item.totalLives || 0),
        0,
      );
      const premium = policyDetails.reduce(
        (sum, item) => sum + Number(item.premium || 0),
        0,
      );
      const selfPaid = policyDetails.reduce(
        (sum, item) => sum + Number(item.selfPaid || 0),
        0,
      );
      const companyPaid = policyDetails.reduce(
        (sum, item) => sum + Number(item.companyPaid || 0),
        0,
      );
      const sumInsured = policyDetails.reduce(
        (sum, item) => sum + Number(item.sumInsured || 0),
        0,
      );
      const showCompanyContribution = policyDetails.every((p) => p.showCompanyContribution);

      const submission =
        dto.referenceNumber && dto.submissionCount
          ? {
              referenceNumber: dto.referenceNumber,
              submissionCount: dto.submissionCount,
            }
          : await this.onboardingRepository.createEnrollmentSubmissionRecord({
              employeeId: dto.employeeId,
              companyId,
              policyIds: uniquePolicyIds,
              createdBy: employee.userId ?? null,
            });
      submissionMeta = submission;
      const countryFormat = await this.onboardingRepository.getCountryFormatForEmployee(dto.employeeId);
      // policyDetails' raw numeric premium/selfPaid/companyPaid/sumInsured/totalLives
      // were needed as-is for the .reduce() aggregates above — format a display copy
      // now (post-aggregation) since the template's {{#each policyDetails}} block
      // renders these same field names per-policy.
      const displayPolicyDetails = policyDetails.map((item) => ({
        ...item,
        premium: formatAmountWithCurrency(item.premium, countryFormat, 2),
        selfPaid: formatAmountWithCurrency(item.selfPaid, countryFormat, 2),
        companyPaid: formatAmountWithCurrency(item.companyPaid, countryFormat, 2),
        sumInsured: formatAmountWithCurrency(Number(item.sumInsured), countryFormat, 2),
        totalLives: formatNumberByLocalization(item.totalLives, countryFormat),
      }));

      const parameters = removeUndefinedFields({
        ...(await this.getSupportContactParams(companyId)),
        [ENROLLMENT_NOTIFICATION_PARAMETERS.EMPLOYEE_NAME]:
          employeeDisplayName,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_NAME]:
          primary.policy.policyName,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_START_DATE]:
          this.formatDisplayDate(primary.policy.policyFrom),
        [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_END_DATE]:
          this.formatDisplayDate(primary.policy.policyTo),
        [ENROLLMENT_NOTIFICATION_PARAMETERS.TOTAL_LIVES]: formatNumberByLocalization(totalLives, countryFormat),
        [ENROLLMENT_NOTIFICATION_PARAMETERS.DEPENDENT_DETAILS]:
          policyDetails.flatMap((item) => item.dependentDetails || []),
        [ENROLLMENT_NOTIFICATION_PARAMETERS.PREMIUM]: formatAmountWithCurrency(premium, countryFormat, 2),
        [ENROLLMENT_NOTIFICATION_PARAMETERS.SELF_PAID]: formatAmountWithCurrency(selfPaid, countryFormat, 2),
        [ENROLLMENT_NOTIFICATION_PARAMETERS.COMPANY_PAID]: formatAmountWithCurrency(companyPaid, countryFormat, 2),
        [ENROLLMENT_NOTIFICATION_PARAMETERS.SUM_INSURED]: formatAmountWithCurrency(sumInsured, countryFormat, 2),
        taxLabel: getTaxLabel(countryFormat),
        [ENROLLMENT_NOTIFICATION_PARAMETERS.SUBMISSION_DATE]:
          this.formatDisplayDate(new Date()),
        [ENROLLMENT_NOTIFICATION_PARAMETERS.SUBMISSION_COUNT]:
          submission.submissionCount,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.REFERENCE_NUMBER]:
          submission.referenceNumber,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.PORTAL_LINK]: portalUrl,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.COMPANY_NAME]:
          primary.policy?.company?.companyName || "IIRM",
        [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_DETAILS]: displayPolicyDetails,
        groupedPolicies,
        isGstApplicable: policyDetails.some((p) => p.isGstApplicable),
        showEmployeeContribution: policyDetails.some((p) => p.showEmployeeContribution),
        showCompanyContribution: policyDetails.some((p) => p.showCompanyContribution),
        totalPremium: premium,
        totalSelfPaid: selfPaid,
        totalCompanyPaid: companyPaid,
        iirmLogoUrl: brandingAssets.iirmLogoUrl,
        illustrationLogoUrl: brandingAssets.illustrationLogoUrl,
        currentYear: new Date().getFullYear(),
        // Used by Handlebars subjects to render auto-submit-specific text.
        isAutoSubmit: Boolean(dto.isAutoSubmit),
      });

      const notificationRequests = [
        axios.post(
          this.notificationServiceUrl,
          removeUndefinedFields({
            eventType:
              dto.emailEventType ??
              NOTIFICATION_EVENT_TYPES.ENROLLMENT_CONFIRMATION_EMAIL,
            emailId: [emailRecipient],
            ccEmailId: this.parseCsvEmails(
              ENV.ENROLLMENT_CONFIRMATION_CC_EMAILS,
            ),
            channel: NOTIFICATION_EMAIL,
            parameters,
            userId: [employee.userId],
            companyId,
            domain: portalSubDomain,
            configId: tokenConfigId,
            save: true,
            source: "IBP",
          }),
          {
            headers: {
              "Content-Type": "application/json",
            },
            timeout: DEFAULT_ENROLLMENT_TIME_OUT,
          },
        ),
      ];

      const { shouldSendPhone } = this.resolveAuthMethodRouting(
        methodCode,
        methodName,
      );

      if (shouldSendPhone && phoneRecipient) {
        notificationRequests.push(
          axios.post(
            this.notificationServiceUrl,
            removeUndefinedFields({
              eventType:
                NOTIFICATION_EVENT_TYPES.ENROLLMENT_CONFIRMATION_MESSAGE,
              phoneNumber: [phoneRecipient],
              channel: NOTIFICATION_SMS,
              parameters,
              userId: [employee.userId],
              companyId,
              domain: portalSubDomain,
              save: true,
              source: "IBP",
            }),
            {
              headers: {
                "Content-Type": "application/json",
              },
              timeout: DEFAULT_ENROLLMENT_TIME_OUT,
            },
          ),
        );
      }

      const responses = await Promise.all(notificationRequests);
      for (const response of responses) {
        if (response.status !== 200 && response.status !== 201) {
          throw new Error(
            `Notification service returned status ${response.status}`,
          );
        }
      }

      const emailNotificationStatus = responses[0]?.data?.data?.status;
      const emailNotificationInfoId = responses[0]?.data?.data?.notificationInfoId;
      const isEmailSkippedDisabled =
        emailNotificationStatus === NOTIFICATION_SKIP_STATUS.DISABLED_FOR_COMPANY ||
        emailNotificationStatus === NOTIFICATION_SKIP_STATUS.DISABLED_FOR_DOMAIN ||
        emailNotificationStatus === NOTIFICATION_SKIP_STATUS.TEMPLATE_DISABLED;
      if (emailNotificationStatus === NOTIFICATION_SUCCESS) {
        await this.createNotificationActivityLog({
          userId: dto.employeeId,
          activityKey: "CONFIRMATION_EMAIL_SENT",
          activityCategory: "ENROLLMENT",
          notificationInfoId: emailNotificationInfoId,
          metadata: {
            employeeId: dto.employeeId,
            policyIds: uniquePolicyIds,
            isAutoSubmit: Boolean(dto.isAutoSubmit),
            submissionCount: submissionMeta?.submissionCount ?? null,
            referenceNumber: submissionMeta?.referenceNumber ?? null,
          },
        });
      }

      results.successCount = successfulPolicies.length;
      results.details.push(
        ...successfulPolicies.map((entry) => ({
          policyId: entry.policyId,
          status: "success",
          message: "Notification sent successfully",
        })),
      );

      this.logInfo(
        "sendEnrollmentConfirmationNotification",
        `Enrollment confirmation completed: ${results.successCount} successful, ${results.failedCount} failed`,
        results,
      );

      return {
        message: `Enrollment confirmation sent in a single notification for ${results.successCount} out of ${results.totalPolicies} policies`,
        success: results.successCount > 0,
        submissionCount: submissionMeta?.submissionCount,
        referenceNumber: submissionMeta?.referenceNumber,
        ...results,
      };
    } catch (error) {
      this.logError("sendEnrollmentConfirmationNotification", error, dto);
      throw error;
    }
  }

  async sendLifeEventConfirmationNotification(
    dto: SendLifeEventConfirmationDto,
    tokenConfigId?: number | null,
  ): Promise<OnboardingResponseDto> {
    const uniquePolicyIds = Array.from(
      new Set(
        (dto.policyIds || [])
          .map((policyId) => Number(policyId))
          .filter((policyId) => Number.isFinite(policyId)),
      ),
    );

    if (!dto.employeeId || !uniquePolicyIds.length) {
      throw new BadRequestException(
        "Employee ID and at least one affected policy ID are required",
      );
    }

    try {
      this.logInfo(
        "sendLifeEventConfirmationNotification",
        `Sending life event confirmation for employee ${dto.employeeId}`,
        dto,
      );

      const { employee, policies } =
        await this.onboardingRepository.validateGroupedInitialOnboardingEntities(
          dto.employeeId,
          uniquePolicyIds,
        );

      const primaryPolicy = policies[0];
      // Prefer the employee's own companyId over the policy's — see the
      // identical comment in sendEnrollmentConfirmationNotification.
      const companyId = dto.companyId ?? employee.companyId ?? primaryPolicy.companyId;
      const emailRecipient = employee.email;
      if (!emailRecipient) {
        throw new Error(
          `Email not found for employee with user ID: ${employee.userId}`,
        );
      }

      const employeeDisplayName = this.buildDisplayName(
        employee.firstName,
        employee.lastName,
        employee.employeeName,
      );
      // See identical comment in sendEnrollmentConfirmationNotification —
      // resolve the domain via the employee's own enrollment mappings
      // (matching the proven-working support-ticket flow), not this
      // specific policy's id.
      const domainResolutionPolicyId =
        (await this.onboardingRepository.findAllEmployeePolicies(dto.employeeId))[0]?.policyId ??
        primaryPolicy.id;
      const { url: portalUrl, subDomain: portalSubDomain } = await this.getPortalUrlForCompany(
        companyId,
        domainResolutionPolicyId,
        tokenConfigId,
      );
      const brandingAssets = this.getEmailBrandingAssets();

      const changedDependents = (dto.changedDependents || []).map(
        (dependent) => {
          const action =
            dependent.action ||
            (dto.flowType === "deletion" ? "DELETE" : "ADD");
          return removeUndefinedFields({
            ...dependent,
            action,
            actionLabel:
              String(action).toUpperCase() === "DELETE" ? "Deleted" : "Added",
            relation: dependent.relation || "--",
            gender: dependent.gender || "--",
            dateOfBirth: dependent.dateOfBirth || "--",
          });
        },
      );
      const addedDependents = changedDependents.filter(
        (dependent) => String(dependent.action).toUpperCase() === "ADD",
      );
      const deletedDependents = changedDependents.filter(
        (dependent) => String(dependent.action).toUpperCase() === "DELETE",
      );

      const policyDetails = [];
      for (const policy of policies) {
        const confirmationDetails =
          await this.onboardingRepository.getEnrollmentConfirmationDetails(
            dto.employeeId,
            policy.id,
          );

        const componentMatch = policy.policyName.match(/\(([^)]+)\)\s*$/);
        const extracted = componentMatch ? componentMatch[1] : null;
        const isAbbreviation = extracted ? /^[A-Z0-9]{2,5}$/.test(extracted) : false;
        const fallbackComponentLabel = extracted && !isAbbreviation ? extracted : policy.policyName;
        const policyGroupName = (policy as any).policyType?.lookUpValue ?? policy.policyName;
        const baseCommonFields = {
          policyId: policy.id,
          policyName: policy.policyName,
          policyGroupName,
          policyStartDate: this.formatDisplayDate(policy.policyFrom),
          policyEndDate: this.formatDisplayDate(policy.policyTo),
          isGstApplicable: confirmationDetails.isGstApplicable ?? true,
        };
        const gstApplicable = confirmationDetails.isGstApplicable ?? true;
        const withGst = (v: number) => gstApplicable ? parseFloat((v * 1.18).toFixed(2)) : v;
        const gstOf = (v: number) => gstApplicable ? parseFloat((v * 0.18).toFixed(2)) : 0;
        const choices = confirmationDetails.choices ?? [];
        const base = Number(confirmationDetails.selfPaid ?? 0);
        const showCompany = confirmationDetails.showCompanyContribution === true;
        const companyBase = showCompany ? Number(confirmationDetails.companyPaid ?? 0) : 0;
        policyDetails.push({
          ...baseCommonFields,
          componentLabel: fallbackComponentLabel,
          premium: parseFloat((withGst(base) + withGst(companyBase)).toFixed(2)),
          selfPaidBase: base,
          gstAmount: gstOf(base),
          selfPaid: withGst(base),
          companyPaidBase: companyBase,
          companyGstAmount: gstOf(companyBase),
          companyPaid: withGst(companyBase),
          sumInsured: confirmationDetails.sumInsured,
          totalLives: confirmationDetails.totalLives,
          dependentDetails: confirmationDetails.dependentDetails || [],
          showEmployeeContribution: confirmationDetails.showEmployeeContribution,
          showCompanyContribution: showCompany,
          components: choices.map((choice) => ({
            label: choice.componentLabel,
            sumInsured: choice.sumInsured,
            premium: choice.premium,
            selfPaid: choice.selfPaid,
            companyPaid: choice.companyPaid,
          })),
        });
      }

      const lifeEventGroupedMap = new Map<string, typeof policyDetails>();
      for (const p of policyDetails) {
        const key = p.policyGroupName;
        if (!lifeEventGroupedMap.has(key)) lifeEventGroupedMap.set(key, []);
        lifeEventGroupedMap.get(key)!.push(p);
      }
      const groupedPolicies = Array.from(lifeEventGroupedMap.entries()).map(([groupName, policies]) => ({
        groupName,
        policies,
        showCompanyContribution: policies.every((p: any) => p.showCompanyContribution),
      }));
      const showCompanyContribution = policyDetails.every((p: any) => p.showCompanyContribution);

      const submission =
        dto.referenceNumber && dto.submissionCount
          ? {
              referenceNumber: dto.referenceNumber,
              submissionCount: dto.submissionCount,
            }
          : await this.onboardingRepository.createEnrollmentSubmissionRecord({
              employeeId: dto.employeeId,
              companyId,
              policyIds: uniquePolicyIds,
              createdBy: employee.userId ?? null,
            });

      const lifeEventTitle =
        (dto.lifeEventTitle || dto.lifeEventType || "Life event").trim();
      const flowType = (dto.flowType || "").toLowerCase();
      const lifeEventActionLabel =
        flowType === "deletion"
          ? "Dependent deletion"
          : "Dependent addition";
      const countryFormat = await this.onboardingRepository.getCountryFormatForEmployee(dto.employeeId);

      const parameters = removeUndefinedFields({
        ...(await this.getSupportContactParams(companyId)),
        currencyFormat: countryFormat?.currencyFormat,
        numberFormat: countryFormat?.numberFormat,
        taxLabel: getTaxLabel(countryFormat),
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.EMPLOYEE_NAME]:
          employeeDisplayName,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.COMPANY_NAME]:
          primaryPolicy?.company?.companyName || "IIRM",
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.LIFE_EVENT_TITLE]:
          lifeEventTitle,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.LIFE_EVENT_TYPE]:
          dto.lifeEventType,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.LIFE_EVENT_ACTION_LABEL]:
          lifeEventActionLabel,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.FLOW_TYPE]: flowType,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.ADDED_DEPENDENTS]: addedDependents,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.DELETED_DEPENDENTS]:
          deletedDependents,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.CHANGED_DEPENDENTS]:
          changedDependents,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.ADDED_COUNT]:
          addedDependents.length,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.DELETED_COUNT]:
          deletedDependents.length,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.CHANGED_COUNT]:
          changedDependents.length,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.POLICY_DETAILS]: policyDetails,
        groupedPolicies,
        isGstApplicable: policyDetails.some((p: any) => p.isGstApplicable),
        showEmployeeContribution: policyDetails.some((p: any) => p.showEmployeeContribution),
        showCompanyContribution: policyDetails.some((p: any) => p.showCompanyContribution),
        totalPremium: policyDetails.reduce((s: number, p: any) => s + Number(p.premium || 0), 0),
        totalSelfPaid: policyDetails.reduce((s: number, p: any) => s + Number(p.selfPaid || 0), 0),
        totalCompanyPaid: policyDetails.reduce((s: number, p: any) => s + Number(p.companyPaid || 0), 0),
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.SUBMISSION_DATE]:
          this.formatDisplayDate(new Date()),
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.SUBMISSION_COUNT]:
          submission.submissionCount,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.REFERENCE_NUMBER]:
          submission.referenceNumber,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.PORTAL_LINK]: portalUrl,
        [LIFE_EVENT_NOTIFICATION_PARAMETERS.CURRENT_YEAR]:
          new Date().getFullYear(),
        iirmLogoUrl: brandingAssets.iirmLogoUrl,
        currentYear: new Date().getFullYear(),
      });

      const response = await axios.post(
        this.notificationServiceUrl,
        removeUndefinedFields({
          eventType: NOTIFICATION_EVENT_TYPES.LIFE_EVENT_CONFIRMATION_EMAIL,
          emailId: [emailRecipient],
          channel: NOTIFICATION_EMAIL,
          parameters,
          userId: [employee.userId],
          companyId,
          domain: portalSubDomain,
          configId: tokenConfigId,
          save: true,
          source: "IBP",
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: DEFAULT_ENROLLMENT_TIME_OUT,
        },
      );

      const notificationResult = this.getNotificationResultDetails(response);
      if (!notificationResult.isHttpSuccess) {
        throw new Error(
          `Notification service returned status ${response.status}`,
        );
      }

      if (notificationResult.isNotificationSuccess) {
        await this.createNotificationActivityLog({
          userId: dto.employeeId,
          activityKey: "LIFE_EVENT_CONFIRMATION_EMAIL_SENT",
          activityCategory: "LIFE_EVENT",
          notificationInfoId: notificationResult.notificationInfoId,
          metadata: {
            employeeId: dto.employeeId,
            policyIds: uniquePolicyIds,
            flowType,
            lifeEventType: dto.lifeEventType ?? null,
            lifeEventTitle,
            addedCount: addedDependents.length,
            deletedCount: deletedDependents.length,
            submissionCount: submission.submissionCount,
            referenceNumber: submission.referenceNumber,
          },
        });
      }

      return {
        message: notificationResult.isNotificationSuccess
          ? "Life event confirmation email sent successfully"
          : "Life event confirmation email could not be sent",
        success: notificationResult.isNotificationSuccess,
        totalPolicies: uniquePolicyIds.length,
        successCount: notificationResult.isNotificationSuccess ? 1 : 0,
        failedCount: notificationResult.isNotificationSuccess ? 0 : 1,
      };
    } catch (error) {
      this.logError("sendLifeEventConfirmationNotification", error, dto);
      throw error;
    }
  }

  async sendAddedDependentsNotification(
    dto: SendAddedDependentsNotificationDto,
    tokenConfigId?: number | null,
  ): Promise<OnboardingResponseDto> {
    try {
      const employee = await this.onboardingRepository.findEmployeeById(
        dto.employeeId,
      );
      if (!employee) {
        throw new BadRequestException(
          `Employee with ID ${dto.employeeId} not found`,
        );
      }

      const emailRecipient = employee.email;
      if (!emailRecipient) {
        this.logInfo(
          "sendAddedDependentsNotification",
          `Skipped — no email on file for employee ${dto.employeeId}`,
          dto,
        );
        return {
          message: "Skipped — employee has no email on file",
          success: false,
        };
      }

      const companyId = dto.companyId ?? employee.companyId;
      const employeeDisplayName = this.buildDisplayName(
        undefined,
        undefined,
        employee.employeeName,
      );
      // No policyId on this DTO — resolve one via the employee's own
      // enrollment mappings so getPortalUrlForCompany can go through the
      // domain-scope-aware path (findConfigCompanyForPolicy) instead of
      // blindly grabbing an arbitrary company_portal_configuration row.
      // Without this, a company with more than one domain would have its
      // Added Dependents email (and any company/domain-specific template
      // customization of it) resolved to whichever domain happens to come
      // back first, regardless of which domain this employee is actually
      // enrolled under.
      const dependentsPolicyId = (
        await this.onboardingRepository.findAllEmployeePolicies(dto.employeeId)
      )[0]?.policyId;
      const { url: portalUrl, subDomain: portalSubDomain } = await this.getPortalUrlForCompany(
        companyId,
        dependentsPolicyId,
        tokenConfigId,
      );
      const brandingAssets = this.getEmailBrandingAssets();

      const dependentDetails = (dto.dependents || []).map((dependent) =>
        removeUndefinedFields({
          name: dependent.name,
          relation: dependent.relation || "--",
        }),
      );

      const parameters = removeUndefinedFields({
        ...(await this.getSupportContactParams(companyId)),
        [ADDED_DEPENDENTS_NOTIFICATION_PARAMETERS.EMPLOYEE_NAME]:
          employeeDisplayName,
        [ADDED_DEPENDENTS_NOTIFICATION_PARAMETERS.DEPENDENT_DETAILS]:
          dependentDetails,
        [ADDED_DEPENDENTS_NOTIFICATION_PARAMETERS.SUBMISSION_DATE]:
          this.formatDisplayDate(new Date()),
        [ADDED_DEPENDENTS_NOTIFICATION_PARAMETERS.ENROLLMENT_START_DATE]:
          this.formatDisplayDate(dto.enrollmentStartDate),
        [ADDED_DEPENDENTS_NOTIFICATION_PARAMETERS.ENROLLMENT_END_DATE]:
          this.formatDisplayDate(dto.enrollmentEndDate),
        [ADDED_DEPENDENTS_NOTIFICATION_PARAMETERS.PORTAL_LINK]: portalUrl,
        iirmLogoUrl: brandingAssets.iirmLogoUrl,
        illustrationLogoUrl: brandingAssets.illustrationLogoUrl,
        currentYear: new Date().getFullYear(),
      });

      const response = await axios.post(
        this.notificationServiceUrl,
        removeUndefinedFields({
          eventType: NOTIFICATION_EVENT_TYPES.ADDED_DEPENDENTS_EMAIL,
          emailId: [emailRecipient],
          channel: NOTIFICATION_EMAIL,
          parameters,
          userId: employee.userId ? [employee.userId] : undefined,
          companyId,
          domain: portalSubDomain,
          configId: tokenConfigId,
          save: true,
          source: "IBP",
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: DEFAULT_ENROLLMENT_TIME_OUT,
        },
      );

      const notificationResult = this.getNotificationResultDetails(response);
      if (!notificationResult.isHttpSuccess) {
        throw new Error(
          `Notification service returned status ${response.status}`,
        );
      }

      if (notificationResult.isNotificationSuccess) {
        await this.createNotificationActivityLog({
          userId: dto.employeeId,
          activityKey: "ADDED_DEPENDENTS_EMAIL_SENT",
          activityCategory: "ENROLLMENT",
          notificationInfoId: notificationResult.notificationInfoId,
          metadata: {
            employeeId: dto.employeeId,
            dependentCount: dependentDetails.length,
          },
        });
      }

      return {
        message: notificationResult.isNotificationSuccess
          ? "Added dependents email sent successfully"
          : "Added dependents email could not be sent",
        success: notificationResult.isNotificationSuccess,
      };
    } catch (error) {
      this.logError("sendAddedDependentsNotification", error, dto);
      throw error;
    }
  }

  async sendClaimIntimationConfirmationNotification(
    dto: SendClaimIntimationConfirmationDto,
    tokenConfigId?: number | null,
  ): Promise<OnboardingResponseDto> {
    try {
      const employee = await this.onboardingRepository.findEmployeeById(dto.employeeId);
      if (!employee) {
        throw new BadRequestException(`Employee with ID ${dto.employeeId} not found`);
      }

      const policy = await this.onboardingRepository.findPolicyById(dto.policyId);
      if (!policy) {
        throw new BadRequestException(`Policy with ID ${dto.policyId} not found`);
      }

      const emailRecipient = employee.email;
      if (!emailRecipient) {
        throw new BadRequestException(`Email not found for employee ${dto.employeeId}`);
      }

      const isAccidentClaim = dto.policyTypeKey
        ? dto.policyTypeKey.toUpperCase().includes("GPA")
        : ((policy as any).policyType?.lookUpKey ?? "").toUpperCase().includes("GPA");
      const isCashless = String(dto.claimType ?? "").toUpperCase() === "CASHLESS";
      const brandingAssets = this.getEmailBrandingAssets();
      const countryFormat = await this.onboardingRepository.getCountryFormatForEmployee(dto.employeeId);
      // Prefer the employee's own companyId over the policy's — see the
      // identical comment in sendEnrollmentConfirmationNotification.
      const claimCompanyId = dto.companyId ?? employee.companyId ?? (policy as any).companyId;
      // See identical comment in sendEnrollmentConfirmationNotification —
      // resolve the domain via the employee's own enrollment mappings
      // (matching the proven-working support-ticket flow), not this
      // specific claim's policy id.
      const claimDomainPolicyId =
        (await this.onboardingRepository.findAllEmployeePolicies(dto.employeeId))[0]?.policyId ??
        dto.policyId;
      // tokenConfigId, when the caller already knows it exactly (decoded from
      // the sender's own auth token), is preferred outright — see identical
      // comment on getPortalUrlForCompany.
      const claimCompanyInfo = tokenConfigId
        ? await this.onboardingRepository.findConfigCompanyById(tokenConfigId)
        : await this.onboardingRepository.findConfigCompanyForPolicy(
            claimCompanyId,
            claimDomainPolicyId,
          );

      const parameters = removeUndefinedFields({
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.EMPLOYEE_NAME]: employee.employeeName,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.COMPANY_NAME]: (policy as any).company?.companyName ?? "IIRM",
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.POLICY_NAME]: (policy as any).policyName ?? String(policy.id),
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.CLAIM_NUMBER]: dto.claimNumber,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.CLAIM_TYPE]: dto.claimType ?? undefined,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.IS_CASHLESS]: isCashless,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.IS_ACCIDENT_CLAIM]: isAccidentClaim,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.PATIENT_NAME]: dto.patientName,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.PATIENT_RELATION]: dto.patientRelation,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.DIAGNOSIS]: dto.diagnosis,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.ESTIMATED_CLAIM_AMOUNT]:
          dto.estimatedClaimAmount != null
            ? formatAmountWithCurrency(Number(dto.estimatedClaimAmount), countryFormat)
            : undefined,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.DATE_OF_ADMISSION]: dto.dateOfAdmission ?? undefined,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.PROPOSED_DISCHARGE_DATE]: dto.proposedDischargeDate ?? undefined,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.PLACE_OF_ACCIDENT]: dto.placeOfAccident ?? undefined,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.HOSPITAL_NAME]: dto.hospitalName ?? undefined,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.HOSPITAL_LOCATION]: dto.hospitalLocation ?? undefined,
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.SUBMISSION_DATE]: this.formatDisplayDate(new Date()),
        [CLAIM_INTIMATION_NOTIFICATION_PARAMETERS.CURRENT_YEAR]: new Date().getFullYear(),
        iirmLogoUrl: brandingAssets.iirmLogoUrl,
        currentYear: new Date().getFullYear(),
      });

      const response = await axios.post(
        this.notificationServiceUrl,
        removeUndefinedFields({
          eventType: NOTIFICATION_EVENT_TYPES.CLAIM_INTIMATION_CONFIRMATION_EMAIL,
          emailId: [emailRecipient],
          channel: NOTIFICATION_EMAIL,
          parameters,
          userId: [employee.userId],
          companyId: claimCompanyId,
          domain: claimCompanyInfo?.subDomain,
          configId: tokenConfigId,
          save: true,
          source: "IBP",
        }),
        { headers: { "Content-Type": "application/json" }, timeout: DEFAULT_ENROLLMENT_TIME_OUT },
      );

      const isSuccess = response?.data?.success !== false;
      return {
        message: isSuccess
          ? "Claim intimation confirmation email sent successfully"
          : "Claim intimation confirmation email could not be sent",
        success: isSuccess,
      };
    } catch (error) {
      this.logError("sendClaimIntimationConfirmationNotification", error, dto);
      throw error;
    }
  }

  async sendSupportTicketConfirmationNotification(
    dto: SendSupportTicketConfirmationDto,
    tokenConfigId?: number | null,
  ): Promise<OnboardingResponseDto> {
    try {
      let recipientEmail: string | undefined;
      let recipientName: string | undefined;
      let ticketCompanyId: number | undefined;
      let ticketPolicyId: number | undefined;

      if (dto.employeeId) {
        const employee = await this.onboardingRepository.findEmployeeById(dto.employeeId);
        if (employee) {
          recipientEmail = employee.email;
          recipientName = employee.employeeName;
          ticketCompanyId = employee.companyId;
          // No policyId on this DTO (tickets aren't policy-scoped) — resolve
          // one via the employee's own enrollment mappings so the domain
          // lookup below can go through the scope-aware path instead of an
          // arbitrary company_portal_configuration row. See the identical
          // comment on sendAddedDependentsNotification.
          ticketPolicyId = (
            await this.onboardingRepository.findAllEmployeePolicies(dto.employeeId)
          )[0]?.policyId;
        }
      }

      this.logInfo("sendSupportTicketConfirmationNotification", "resolved companyId for CRM lead CC", {
        employeeId: dto.employeeId,
        ticketCompanyId,
      });

      // tokenConfigId, when the caller already knows it exactly (decoded from
      // the sender's own auth token), is preferred outright — see identical
      // comment on getPortalUrlForCompany.
      const ticketCompanyInfo = tokenConfigId
        ? await this.onboardingRepository.findConfigCompanyById(tokenConfigId)
        : ticketCompanyId
        ? ticketPolicyId
          ? await this.onboardingRepository.findConfigCompanyForPolicy(ticketCompanyId, ticketPolicyId)
          : await this.onboardingRepository.findCompanyPortalConfiguration(ticketCompanyId)
        : null;

      recipientEmail = recipientEmail || dto.mailId;
      recipientName = recipientName || (recipientEmail ? recipientEmail.split("@")[0] : "User");

      if (!recipientEmail) {
        throw new Error("No recipient email available for support ticket confirmation");
      }

      const brandingAssets = this.getEmailBrandingAssets();

      const attachmentIds: number[] = Array.isArray(dto.documentIds)
        ? dto.documentIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
        : [];

      const response = await axios.post(
        this.notificationServiceUrl,
        {
          eventType: NOTIFICATION_EVENT_TYPES.SUPPORT_TICKET_RAISED_EMAIL,
          emailId: [recipientEmail],
          channel: NOTIFICATION_EMAIL,
          ...(attachmentIds.length > 0 && { attachments: attachmentIds }),
          ...(ticketCompanyId ? { companyId: ticketCompanyId } : {}),
          ...(ticketCompanyInfo?.subDomain ? { domain: ticketCompanyInfo.subDomain } : {}),
          ...(tokenConfigId ? { configId: tokenConfigId } : {}),
          source: "IBP",
          skipPasswordProtection: true,
          parameters: {
            ...(await this.getSupportContactParams(ticketCompanyId)),
            recipientName,
            recipientEmail,
            ticketId: dto.ticketId,
            category: dto.category,
            ...(dto.description ? { description: dto.description } : {}),
            submissionDate: this.formatDisplayDate(new Date()),
            iirmLogoUrl: brandingAssets.iirmLogoUrl,
            currentYear: new Date().getFullYear(),
          },
        },
        { headers: { "Content-Type": "application/json" }, timeout: DEFAULT_ENROLLMENT_TIME_OUT },
      );

      const isSuccess = response?.data?.success !== false;
      return {
        message: isSuccess
          ? "Support ticket confirmation email sent successfully"
          : "Support ticket confirmation email could not be sent",
        success: isSuccess,
      };
    } catch (error) {
      this.logError("sendSupportTicketConfirmationNotification", error, dto);
      throw error;
    }
  }

  async sendSupportTicketStatusChangedNotification(
    dto: SendSupportTicketStatusChangedDto,
    tokenConfigId?: number | null,
  ): Promise<OnboardingResponseDto> {
    try {
      let recipientEmail: string | undefined;
      let recipientName: string | undefined;
      let ticketCompanyId: number | undefined;
      let ticketPolicyId: number | undefined;

      if (dto.employeeId) {
        const employee = await this.onboardingRepository.findEmployeeById(dto.employeeId);
        if (employee) {
          recipientEmail = employee.email;
          recipientName = employee.employeeName;
          ticketCompanyId = employee.companyId;
          // See identical comment in sendSupportTicketConfirmationNotification.
          ticketPolicyId = (
            await this.onboardingRepository.findAllEmployeePolicies(dto.employeeId)
          )[0]?.policyId;
        }
      }

      this.logInfo("sendSupportTicketStatusChangedNotification", "resolved companyId for CRM lead CC", {
        employeeId: dto.employeeId,
        ticketCompanyId,
      });

      // tokenConfigId, when the caller already knows it exactly (decoded from
      // the sender's own auth token), is preferred outright — see identical
      // comment on getPortalUrlForCompany.
      const ticketCompanyInfo = tokenConfigId
        ? await this.onboardingRepository.findConfigCompanyById(tokenConfigId)
        : ticketCompanyId
        ? ticketPolicyId
          ? await this.onboardingRepository.findConfigCompanyForPolicy(ticketCompanyId, ticketPolicyId)
          : await this.onboardingRepository.findCompanyPortalConfiguration(ticketCompanyId)
        : null;

      recipientEmail = recipientEmail || dto.mailId;
      recipientName = recipientName || (recipientEmail ? recipientEmail.split("@")[0] : "User");

      if (!recipientEmail) {
        throw new Error("No recipient email available for support ticket status change");
      }

      const brandingAssets = this.getEmailBrandingAssets();
      const statusClass = dto.status.toLowerCase().replace(/[\s-]/g, "_");
      const statusLabel = statusClass
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      const response = await axios.post(
        this.notificationServiceUrl,
        {
          eventType: NOTIFICATION_EVENT_TYPES.SUPPORT_TICKET_STATUS_CHANGED_EMAIL,
          emailId: [recipientEmail],
          channel: NOTIFICATION_EMAIL,
          ...(ticketCompanyId ? { companyId: ticketCompanyId } : {}),
          ...(ticketCompanyInfo?.subDomain ? { domain: ticketCompanyInfo.subDomain } : {}),
          ...(tokenConfigId ? { configId: tokenConfigId } : {}),
          source: "IBP",
          skipPasswordProtection: true,
          parameters: {
            recipientName,
            recipientEmail,
            ticketId: dto.ticketId,
            category: dto.category,
            status: statusLabel,
            statusClass,
            comment: dto.comment,
            updateDate: this.formatDisplayDateTime(new Date()),
            iirmLogoUrl: brandingAssets.iirmLogoUrl,
            currentYear: new Date().getFullYear(),
          },
        },
        { headers: { "Content-Type": "application/json" }, timeout: DEFAULT_ENROLLMENT_TIME_OUT },
      );

      const isSuccess = response?.data?.success !== false;
      return {
        message: isSuccess
          ? "Support ticket status change email sent successfully"
          : "Support ticket status change email could not be sent",
        success: isSuccess,
      };
    } catch (error) {
      this.logError("sendSupportTicketStatusChangedNotification", error, dto);
      throw error;
    }
  }

  /**
   * Send enrollment start notification
   */
  async sendEnrollmentStartNotification(
    dto: SendEnrollmentStartDto,
  ): Promise<OnboardingResponseDto> {
    try {
      dto.includeAllEmployees = (dto.employees || []).length ? false : true;
      this.logInfo(
        "sendEnrollmentStartNotification",
        `Processing enrollment start notification for ${JSON.stringify(dto)}`,
        dto,
      );

      const from = dto.triggerDate ? new Date(dto.triggerDate) : new Date();
      const range = dto.range ? Number(dto.range) : 1;
      const to = new Date(from);
      to.setDate(to.getDate() + 1 * range);

      this.logInfo(
        "sendEnrollmentStartNotification",
        `Checking enrollment start dates from ${from} to ${to}`,
        { from, to, range },
      );
      // Hierarchical processing logic
      if (dto.policies && dto.policies.length > 0) {
        // Process specific policies
        return await this.processPolicyJobs(
          dto.policies,
          from,
          to,
          dto.employees,
          dto.includeAllEmployees,
        );
      } else if (dto.companies && dto.companies.length > 0) {
        // Process specific companies
        return await this.processCompanyJobs(
          dto.companies,
          from,
          to,
          dto.employees,
          dto.includeAllEmployees,
        );
      } else if (dto.employees && dto.employees.length > 0) {
        // Process specific employees
        return await this.processEmployeeJobs(dto.employees, from, to);
      } else {
        // Default: Process all employee-policy mappings for the date range
        return await this.processAllEmployeePolicyMappings(from, to);
      }
    } catch (error) {
      this.logError("sendEnrollmentStartNotification", error, dto);
      throw new BadRequestException(
        "Failed to send enrollment start notification",
      );
    }
  }

  private groupMappingsByEmployeeAndCompany(
    mappings: PolicyEnrollmentEmployeePolicyMap[],
  ): Map<string, PolicyEnrollmentEmployeePolicyMap[]> {
    const groups = new Map<string, PolicyEnrollmentEmployeePolicyMap[]>();

    for (const mapping of mappings) {
      const employeeId = mapping.employee?.id ?? mapping.employeeId;
      const companyId =
        mapping.employee?.companyId ?? mapping.policy?.companyId ?? 0;

      if (!employeeId) {
        continue;
      }

      const groupKey = `${employeeId}:${companyId}`;
      const existing = groups.get(groupKey) ?? [];
      existing.push(mapping);
      groups.set(groupKey, existing);
    }

    return groups;
  }

  private async processGroupedEnrollmentStartMappings(
    methodName: string,
    mappings: PolicyEnrollmentEmployeePolicyMap[],
  ): Promise<{ successCount: number; failureCount: number }> {
    const groupedMappings = this.groupMappingsByEmployeeAndCompany(mappings);
    let successCount = 0;
    let failureCount = 0;

    for (const [groupKey, employeeMappings] of groupedMappings.entries()) {
      try {
        const employee = employeeMappings[0]?.employee;
        const policy = employeeMappings[0]?.policy;

        if (!employee || !policy) {
          this.logInfo(
            methodName,
            `Missing employee or policy data for group ${groupKey}`,
            { groupKey },
            LOG_STATUS.FAILURE,
          );
          failureCount++;
          continue;
        }

        await this.sendGroupedStartNotificationToEmployee(
          employee,
          employeeMappings,
        );
        successCount++;
      } catch (error) {
        this.logError(
          methodName,
          `Error processing grouped enrollment start notification for ${groupKey}: ${error.message}`,
          { groupKey },
        );
        failureCount++;
      }
    }

    return { successCount, failureCount };
  }

  /**
   * Process specific policies for enrollment notifications
   */
  private async processPolicyJobs(
    policyIds: string[],
    from: Date,
    to: Date,
    employeeIds: string[],
    includeAllEmployees = true,
  ): Promise<OnboardingResponseDto> {
    this.logInfo(
      "processPolicyJobs",
      `Processing ${policyIds.length} specific policies for enrollment notifications`,
      { policyIds, from: from, to: to, employeeIds, includeAllEmployees },
    );

    const allPolicyEmployees: PolicyEnrollmentEmployeePolicyMap[] = [];
    let validationFailureCount = 0;

    for (const policyIdStr of policyIds) {
      try {
        const policyId = parseInt(policyIdStr, 10);

        if (isNaN(policyId)) {
          this.logInfo(
            "processPolicyJobs",
            `Invalid policy ID format: ${policyIdStr}`,
            { policyIdStr },
          );
          validationFailureCount++;
          continue;
        }

        const policy = await this.onboardingRepository.findPolicyById(policyId);

        if (!policy) {
          this.logInfo(
            "processPolicyJobs",
            `Policy not found for ID: ${policyId}`,
            { policyId },
          );
          validationFailureCount++;
          continue;
        }
        // Get all employees for this policy within the date range
        const policyEmployees = includeAllEmployees
          ? await this.onboardingRepository.findPolicyEmployeesForDateRange(
              policyId,
              from,
              to,
            )
          : await this.onboardingRepository.findPolicyEmployeesForDateRange(
              policyId,
              from,
              to,
              employeeIds,
            );
        allPolicyEmployees.push(...policyEmployees);
      } catch (error) {
        this.logError(
          "processPolicyJobs",
          `Error processing policy ${policyIdStr}: ${error.message}`,
          { policyIdStr },
        );
        validationFailureCount++;
      }
    }

    const groupedResults = await this.processGroupedEnrollmentStartMappings(
      "processPolicyJobs",
      allPolicyEmployees,
    );
    const successCount = groupedResults.successCount;
    const failureCount =
      groupedResults.failureCount + validationFailureCount;

    const message = `Policy jobs processed: ${successCount} successful, ${failureCount} failed`;

    this.logInfo("processPolicyJobs", message, { successCount, failureCount });

    return {
      message,
      success: failureCount === 0,
    };
  }

  /**
   * Process specific companies for enrollment notifications
   */
  private async processCompanyJobs(
    companyIds: string[],
    from: Date,
    to: Date,
    employeeIds: string[],
    includeAllEmployees = true,
  ): Promise<OnboardingResponseDto> {
    this.logInfo(
      "processCompanyJobs",
      `Processing ${companyIds.length} specific companies for enrollment notifications`,
      { companyIds, from: from, to: to, employeeIds, includeAllEmployees },
    );

    const allCompanyMappings: PolicyEnrollmentEmployeePolicyMap[] = [];
    let validationFailureCount = 0;

    for (const companyIdStr of companyIds) {
      try {
        const companyId = parseInt(companyIdStr, 10);

        if (isNaN(companyId)) {
          this.logInfo(
            "processCompanyJobs",
            `Invalid company ID format: ${companyIdStr}`,
            { companyIdStr },
          );
          validationFailureCount++;
          continue;
        }

        // Get all employee-policy mappings for this company within the date range
        const companyMappings = includeAllEmployees
          ? await this.onboardingRepository.findCompanyEmployeePolicyMappingsForDateRange(
              companyId,
              from,
              to,
            )
          : await this.onboardingRepository.findCompanyEmployeePolicyMappingsForDateRange(
              companyId,
              from,
              to,
              employeeIds,
            );

        allCompanyMappings.push(...companyMappings);
      } catch (error) {
        this.logError(
          "processCompanyJobs",
          `Error processing company ${companyIdStr}: ${error.message}`,
          { companyIdStr },
        );
        validationFailureCount++;
      }
    }

    const groupedResults = await this.processGroupedEnrollmentStartMappings(
      "processCompanyJobs",
      allCompanyMappings,
    );
    const successCount = groupedResults.successCount;
    const failureCount =
      groupedResults.failureCount + validationFailureCount;

    const message = `Company jobs processed: ${successCount} successful, ${failureCount} failed`;

    this.logInfo("processCompanyJobs", message, { successCount, failureCount });

    return {
      message,
      success: failureCount === 0,
    };
  }

  /**
   * Process specific employees for enrollment notifications
   */
  private async processEmployeeJobs(
    employeeIds: string[],
    from: Date,
    to: Date,
  ): Promise<OnboardingResponseDto> {
    this.logInfo(
      "processEmployeeJobs",
      `Processing ${employeeIds.length} specific employees for enrollment notifications`,
      { employeeIds, from: from, to: to },
    );

    const allEmployeePolicies: PolicyEnrollmentEmployeePolicyMap[] = [];
    let validationFailureCount = 0;

    for (const employeeIdStr of employeeIds) {
      try {
        const employeeId = parseInt(employeeIdStr, 10);

        if (isNaN(employeeId)) {
          this.logInfo(
            "processEmployeeJobs",
            `Invalid employee ID format: ${employeeIdStr}`,
            { employeeIdStr },
          );
          validationFailureCount++;
          continue;
        }

        const employee = await this.onboardingRepository.findEmployeeById(
          employeeId,
        );

        if (!employee) {
          this.logInfo(
            "processEmployeeJobs",
            `Employee not found for ID: ${employeeId}`,
            { employeeId },
          );
          validationFailureCount++;
          continue;
        }

        // Get all policies for this employee within the date range
        const employeePolicies =
          await this.onboardingRepository.findEmployeePoliciesForDateRange(
            employeeId,
            from,
            to,
          );

        allEmployeePolicies.push(...employeePolicies);
      } catch (error) {
        this.logError(
          "processEmployeeJobs",
          `Error processing employee ${employeeIdStr}: ${error.message}`,
          { employeeIdStr },
        );
        validationFailureCount++;
      }
    }

    const groupedResults = await this.processGroupedEnrollmentStartMappings(
      "processEmployeeJobs",
      allEmployeePolicies,
    );
    const successCount = groupedResults.successCount;
    const failureCount =
      groupedResults.failureCount + validationFailureCount;

    const message = `Employee jobs processed: ${successCount} successful, ${failureCount} failed`;

    this.logInfo("processEmployeeJobs", message, {
      successCount,
      failureCount,
    });

    return {
      message,
      success: failureCount === 0,
    };
  }

  /**
   * Process all employee-policy mappings for the date range (default behavior)
   */
  private async processAllEmployeePolicyMappings(
    from: Date,
    to: Date,
  ): Promise<OnboardingResponseDto> {
    this.logInfo(
      "processAllEmployeePolicyMappings",
      `Processing all employee-policy mappings for date range`,
      { from: from, to: to },
    );

    const employeePolicyMappings =
      await this.onboardingRepository.findEmployeePolicyMappingsForDateRange(
        from,
        to,
      );

    this.logInfo(
      "processAllEmployeePolicyMappings",
      `Found ${employeePolicyMappings.length} employee-policy mappings for enrollment start notifications`,
      { mappingsCount: employeePolicyMappings.length },
    );

    let successCount = 0;
    let failureCount = 0;

    const groupedResults = await this.processGroupedEnrollmentStartMappings(
      "processAllEmployeePolicyMappings",
      employeePolicyMappings,
    );
    successCount += groupedResults.successCount;
    failureCount += groupedResults.failureCount;

    const message = `All employee-policy mappings processed: ${successCount} successful, ${failureCount} failed`;

    this.logInfo("processAllEmployeePolicyMappings", message, {
      successCount,
      failureCount,
    });

    return {
      message,
      success: failureCount === 0,
    };
  }

  private async sendGroupedStartNotificationToEmployee(
    employee: PolicyEnrollmentEmployee,
    mappings: PolicyEnrollmentEmployeePolicyMap[],
  ): Promise<void> {
    if (!mappings?.length) {
      return;
    }

    const firstPolicy = mappings[0].policy;
    const companyId = employee.companyId ?? firstPolicy?.companyId;
    const companyAuthMapping =
      await this.onboardingRepository.findCompanyAuthMappingByCompanyId(
        companyId,
      );

    if (!companyAuthMapping || !companyAuthMapping.authenticationMethod) {
      this.logInfo(
        "sendGroupedStartNotificationToEmployee",
        `No active authentication method found for company ID: ${companyId}`,
        { companyId },
      );
      return;
    }

    const authMethod = companyAuthMapping.authenticationMethod;
    const { shouldSendEmail, shouldSendPhone } = this.resolveAuthMethodRouting(
      authMethod.methodCode,
      authMethod.methodName,
    );

    let notificationChannel: string;
    let recipient: string;

    if (shouldSendEmail && employee.email) {
      notificationChannel = NOTIFICATION_EMAIL;
      recipient = employee.email;
    } else if (shouldSendPhone && employee.phoneNumber) {
      notificationChannel = NOTIFICATION_SMS;
      recipient = employee.phoneNumber;
    } else {
      this.logInfo(
        "sendGroupedStartNotificationToEmployee",
        `No valid recipient found for employee ${employee.id}`,
        { employeeId: employee.id, shouldSendEmail, shouldSendPhone },
        LOG_STATUS.FAILURE,
      );
      return;
    }

    const companyInfo = firstPolicy?.id
      ? await this.onboardingRepository.findConfigCompanyForPolicy(
          companyId,
          firstPolicy.id,
        )
      : null;
    const { url: portalUrl } = await this.getPortalUrlForCompany(companyId, firstPolicy?.id);
    const portalSubDomain = companyInfo?.subDomain;
    const brandingAssets = this.getEmailBrandingAssets();
    const employeeDisplayName = this.buildDisplayName(
      employee.firstName,
      employee.lastName,
      employee.employeeName,
    );
    const membersCoveredByPolicy = new Map<number, string[]>();
    await Promise.all(
      mappings.map(async (mapping) => {
        const policyTemplate =
          await this.onboardingRepository.findLivePolicyTemplateByPolicyId(
            mapping.policy.id,
          );
        membersCoveredByPolicy.set(
          mapping.policy.id,
          this.extractCoveredRelationsFromPolicyTemplate(policyTemplate),
        );
      }),
    );
    const membersCovered = Array.from(
      new Set(
        Array.from(membersCoveredByPolicy.values()).flatMap(
          (relations) => relations,
        ),
      ),
    );
    const policyDetails = mappings.map((mapping) => ({
      policyId: mapping.policy.id,
      policyName: mapping.policy.policyName,
      policyStartDate: this.formatDisplayDate(
        mapping.policy.policyStartDate || mapping.policy.policyFrom,
      ),
      policyEndDate: this.formatDisplayDate(
        mapping.policy.policyEndDate || mapping.policy.policyTo,
      ),
      enrollmentStartDate: this.formatDisplayDate(mapping.enrollmentStartDate),
      enrollmentEndDate: this.formatDisplayDate(mapping.enrollmentEndDate),
      membersCovered: membersCoveredByPolicy.get(mapping.policy.id) ?? [],
    }));
    const firstPolicyDetails = policyDetails[0];

    const parameters = removeUndefinedFields({
      [ENROLLMENT_NOTIFICATION_PARAMETERS.EMPLOYEE_NAME]: employeeDisplayName,
      [ENROLLMENT_NOTIFICATION_PARAMETERS.EMAIL_ID]: employee.email,
      [ENROLLMENT_NOTIFICATION_PARAMETERS.PHONE_NUMBER]: employee.phoneNumber,
      [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_NAME]:
        firstPolicyDetails?.policyName,
      [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_START_DATE]:
        firstPolicyDetails?.policyStartDate,
      [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_END_DATE]:
        firstPolicyDetails?.policyEndDate,
      [ENROLLMENT_NOTIFICATION_PARAMETERS.ENROLLMENT_START_DATE]:
        firstPolicyDetails?.enrollmentStartDate,
      [ENROLLMENT_NOTIFICATION_PARAMETERS.ENROLLMENT_END_DATE]:
        firstPolicyDetails?.enrollmentEndDate,
      [ENROLLMENT_NOTIFICATION_PARAMETERS.INSURER_NAME]:
        firstPolicy?.insurerName || "N/A",
      [ENROLLMENT_NOTIFICATION_PARAMETERS.TPA_NAME]:
        firstPolicy?.tpaName || "N/A",
      [ENROLLMENT_NOTIFICATION_PARAMETERS.BROKER_COMPANY_NAME]:
        companyInfo?.brokerName || "IIRM",
      [ENROLLMENT_NOTIFICATION_PARAMETERS.SUPPORT_EMAIL]:
        companyInfo?.supportEmail || ENV.DEFAULT_SUPPORT_EMAIL,
      [ENROLLMENT_NOTIFICATION_PARAMETERS.SUPPORT_PHONE]:
        companyInfo?.supportPhone || ENV.DEFAULT_SUPPORT_PHONE,
      [ENROLLMENT_NOTIFICATION_PARAMETERS.PORTAL_LINK]: portalUrl,
      [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_DETAILS]: policyDetails,
      tpaCoordinatorName: firstPolicy?.tpaName || "N/A",
      tpaCoordinatorPhoneNumber:
        companyInfo?.supportPhone || ENV.DEFAULT_SUPPORT_PHONE,
      membersCovered,
      membersCoveredText: membersCovered.length
        ? membersCovered.join(" | ")
        : "Not available",
      membersCoveredHtml: this.buildMembersCoveredHtml(membersCovered),
      familyMembersManagement:
        "Add or update dependent and family member information in the portal",
      iirmLogoUrl: brandingAssets.iirmLogoUrl,
      onboardingIllustrationUrl: brandingAssets.onboardingIllustrationUrl,
      illustrationLogoUrl: brandingAssets.illustrationLogoUrl,
      currentYear: new Date().getFullYear(),
      isMultiPolicy: policyDetails.length > 1,
      policyCount: policyDetails.length,
    });

    try {
      const response = await axios.post(
        this.notificationServiceUrl,
        removeUndefinedFields({
          eventType:
            notificationChannel === NOTIFICATION_EMAIL
              ? NOTIFICATION_EVENT_TYPES.ENROLLMENT_START_EMAIL
              : NOTIFICATION_EVENT_TYPES.ENROLLMENT_START_MESSAGE,
          emailId:
            notificationChannel === NOTIFICATION_EMAIL
              ? [recipient]
              : undefined,
          phoneNumber:
            notificationChannel === NOTIFICATION_SMS ? [recipient] : undefined,
          channel: notificationChannel,
          parameters,
          userId: [employee.userId],
          companyId,
          domain: portalSubDomain,
          save: true,
          source: "IBP",
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: DEFAULT_ENROLLMENT_TIME_OUT,
        },
      );

      if (response.status === 200 || response.status === 201) {
        if (notificationChannel === NOTIFICATION_EMAIL) {
          const {
            isNotificationSuccess,
            notificationInfoId,
          } = this.getNotificationResultDetails(response);

          if (isNotificationSuccess) {
            await this.createNotificationActivityLog({
              userId: employee.id,
              activityKey: "ENROLLMENT_START_EMAIL_SENT",
              activityCategory: "ENROLLMENT",
              notificationInfoId,
              metadata: {
                employeeId: employee.id,
                policyIds: policyDetails.map((policy) => policy.policyId),
              },
            });
          }
        }

        this.logInfo(
          "sendGroupedStartNotificationToEmployee",
          `Enrollment start notification sent to ${recipient} for ${policyDetails.length} policies`,
          {
            employeeId: employee.id,
            recipient,
            policyCount: policyDetails.length,
          },
        );
        return;
      }

      this.logInfo(
        "sendGroupedStartNotificationToEmployee",
        `Failed to send enrollment start notification to ${recipient}`,
        {
          employeeId: employee.id,
          recipient,
          policyCount: policyDetails.length,
        },
        LOG_STATUS.FAILURE,
      );
    } catch (error) {
      this.logError(
        "sendGroupedStartNotificationToEmployee",
        `Error sending grouped enrollment start notification to ${recipient}: ${error.message}`,
        {
          employeeId: employee.id,
          recipient,
          policyCount: policyDetails.length,
        },
      );
      throw error;
    }
  }

  /**
   * Send enrollment reminder notification based on enrollmentEndDate
   */
  async sendEnrollmentReminderNotification(
    dto: SendEnrollmentReminderDto,
    triggeredByUserId?: number,
  ): Promise<OnboardingResponseDto> {
    try {
      dto.includeAllEmployees = (dto.employees || []).length ? false : true;
      this.logInfo(
        "sendEnrollmentReminderNotification",
        `Processing enrollment reminder notification for ${JSON.stringify(
          dto,
        )}`,
        { ...dto, triggeredByUserId },
      );

      const currentDate = new Date();
      const triggerDate = dto.triggerDate ? new Date(dto.triggerDate) : new Date();
      const hasExplicitScope = Boolean(
        dto.policies?.length || dto.companies?.length || dto.employees?.length,
      );
      const hasExplicitReminderDays = Boolean(dto.reminderDays?.length);

      // Manual immediate send — skip date-window checks entirely
      if (dto.forceImmediate && hasExplicitScope) {
        this.logInfo("sendEnrollmentReminderNotification", "path=immediateReminder", { forceImmediate: true, triggeredByUserId, scope: { policies: dto.policies, companies: dto.companies, employees: dto.employees } });
        const result = await this.processImmediateReminder(dto, triggeredByUserId);
        this.logInfo("sendEnrollmentReminderNotification", `path=immediateReminder done — ${result.message}`, { triggeredByUserId });
        return result;
      }

      // Scheduler-optimized path: IBP computes company-configured reminder days internally.
      if (!hasExplicitReminderDays && !hasExplicitScope) {
        this.logInfo("sendEnrollmentReminderNotification", "path=companyConfiguredJobs", { triggerDate });
        const result = await this.processCompanyConfiguredReminderJobs(triggerDate);
        this.logInfo("sendEnrollmentReminderNotification", `path=companyConfiguredJobs done — ${result.message}`, {});
        return result;
      }

      const reminderDays = dto.reminderDays?.length
        ? dto.reminderDays
        : [7, 3, 2, 1]; // Set default reminder days if not provided

      this.logInfo(
        "sendEnrollmentReminderNotification",
        `Current date: ${currentDate.toISOString()}, Trigger date: ${triggerDate.toISOString()}, Reminder days: ${reminderDays.join(
          ", ",
        )}`,
        { currentDate, triggerDate, reminderDays },
      );

      // Calculate which reminders to send based on current date and trigger date
      const daysUntilTrigger = Math.ceil(
        (triggerDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Only process if the days until trigger matches one of the reminder days
      // (or "everyday" is configured, which fires on every day up to the end date).
      const everydayConfigured = reminderDays.includes(
        OnboardingService.ENROLLMENT_REMINDER_EVERYDAY,
      );
      const everydayMatch = everydayConfigured && daysUntilTrigger >= 0;
      if (!everydayMatch && !reminderDays.includes(daysUntilTrigger)) {
        this.logInfo(
          "sendEnrollmentReminderNotification",
          `No reminder needed. Days until trigger date (${daysUntilTrigger}) is not in reminder days [${reminderDays.join(
            ", ",
          )}]`,
          { daysUntilTrigger, reminderDays },
        );

        return {
          message: `No reminders triggered. Days until enrollment end (${daysUntilTrigger}) does not match reminder days [${reminderDays.join(
            ", ",
          )}]`,
          success: true,
        };
      }

      this.logInfo(
        "sendEnrollmentReminderNotification",
        `Processing reminder for ${daysUntilTrigger} days before enrollment end date`,
        { daysUntilTrigger },
      );

      // Process reminder for the specific day match
      return await this.processReminderForSpecificDay(
        daysUntilTrigger,
        triggerDate,
        dto,
      );
    } catch (error) {
      this.logError("sendEnrollmentReminderNotification", error, dto);
      throw new BadRequestException(
        "Failed to send enrollment reminder notification",
      );
    }
  }

  private parseEnrollmentReminderDays(
    companyPortalAuthConfig: Record<string, unknown> | null,
  ): number[] {
    if (!companyPortalAuthConfig) {
      return [];
    }

    const rootReminderDays = companyPortalAuthConfig.enrollmentReminderDays;
    const passwordConfig =
      typeof companyPortalAuthConfig.passwordConfig === "object" &&
      companyPortalAuthConfig.passwordConfig !== null
        ? (companyPortalAuthConfig.passwordConfig as Record<string, unknown>)
        : null;
    const passwordPolicyConfig =
      typeof companyPortalAuthConfig.password_policy === "object" &&
      companyPortalAuthConfig.password_policy !== null
        ? (companyPortalAuthConfig.password_policy as Record<string, unknown>)
        : null;

    const reminderDays =
      rootReminderDays ??
      passwordConfig?.enrollmentReminderDays ??
      passwordPolicyConfig?.enrollmentReminderDays ??
      [];

    if (!Array.isArray(reminderDays)) {
      return [];
    }

    return reminderDays
      .map((value) => Number(value))
      .filter(
        (value) =>
          Number.isInteger(value) &&
          ((value >= 0 && value <= 30) ||
            value === OnboardingService.ENROLLMENT_REMINDER_EVERYDAY),
      );
  }

  private parseLocalDateString(dateInput: string | Date): Date {
    if (dateInput instanceof Date) {
      return new Date(
        dateInput.getFullYear(),
        dateInput.getMonth(),
        dateInput.getDate(),
      );
    }

    const normalizedDate =
      typeof dateInput === "string" && dateInput.includes("T")
        ? dateInput.split("T")[0]
        : String(dateInput);
    const [year, month, day] = normalizedDate.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Formats a currency amount with the employee's country symbol/grouping,
  // preserving the existing "N/A" fallback for genuinely missing values
  // (formatAmountWithCurrency itself returns "--" for null/NaN).
  private formatMoneyOrFallback(
    value: unknown,
    countryFormat: CountryFormatConfig | null,
  ): string {
    if (value == null || value === "N/A") return "N/A";
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return "N/A";
    return formatAmountWithCurrency(numeric, countryFormat);
  }

  private formatDisplayDate(dateInput?: string | Date | null): string | undefined {
    if (!dateInput) {
      return undefined;
    }

    const parsedDate = this.parseLocalDateString(dateInput);
    const day = String(parsedDate.getDate()).padStart(2, "0");
    const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
    const year = parsedDate.getFullYear();

    return `${day}/${month}/${year}`;
  }

  private formatDisplayDateTime(dateInput: Date): string {
    const day = String(dateInput.getDate()).padStart(2, "0");
    const month = String(dateInput.getMonth() + 1).padStart(2, "0");
    const year = dateInput.getFullYear();

    let hours = dateInput.getHours();
    const minutes = String(dateInput.getMinutes()).padStart(2, "0");
    const seconds = String(dateInput.getSeconds()).padStart(2, "0");
    const meridiem = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const hoursStr = String(hours).padStart(2, "0");

    return `${day}/${month}/${year} ${hoursStr}:${minutes}:${seconds} ${meridiem}`;
  }

  private addDaysToDateString(dateString: string, days: number): string {
    const baseDate = this.parseLocalDateString(dateString);
    baseDate.setDate(baseDate.getDate() + days);
    return this.formatLocalDate(baseDate);
  }

  private getDayOffset(fromDateString: string, toDate: string | Date): number {
    const fromDate = this.parseLocalDateString(fromDateString);
    const toDateValue = this.parseLocalDateString(toDate);
    const diffMs = toDateValue.getTime() - fromDate.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /** Run async tasks in parallel batches of `batchSize`. Returns { successCount, failureCount }. */
  private async runInBatches<T>(
    items: T[],
    batchSize: number,
    task: (item: T) => Promise<void>,
    label: string,
  ): Promise<{ successCount: number; failureCount: number }> {
    const totalBatches = Math.ceil(items.length / batchSize);
    this.logInfo(label, `starting — ${items.length} items, ${totalBatches} batches of ${batchSize}`, { total: items.length, batchSize, totalBatches });
    let successCount = 0;
    let failureCount = 0;
    for (let i = 0; i < items.length; i += batchSize) {
      const batchNo = Math.floor(i / batchSize) + 1;
      const batch = items.slice(i, i + batchSize);
      this.logInfo(label, `batch ${batchNo}/${totalBatches} started (${batch.length} items)`, { batchNo, totalBatches, batchSize: batch.length });
      const results = await Promise.allSettled(batch.map((item) => task(item)));
      let batchSuccess = 0;
      let batchFail = 0;
      for (const r of results) {
        if (r.status === "fulfilled") { successCount++; batchSuccess++; }
        else {
          failureCount++; batchFail++;
          this.logError(label, `batch ${batchNo} item failed: ${r.reason?.message ?? r.reason}`, { batchNo });
        }
      }
      this.logInfo(label, `batch ${batchNo}/${totalBatches} done — success: ${batchSuccess}, failed: ${batchFail}`, { batchNo, batchSuccess, batchFail, runningTotal: { successCount, failureCount } });
    }
    this.logInfo(label, `all batches complete — total success: ${successCount}, total failed: ${failureCount}`, { successCount, failureCount });
    return { successCount, failureCount };
  }

  private async processCompanyConfiguredReminderJobs(
    triggerDate: Date,
  ): Promise<OnboardingResponseDto> {
    const maxReminderWindowDays = 7;
    const todayDateString = this.formatLocalDate(triggerDate);

    // Detect "Everyday" companies up front so the look-ahead window can be chosen
    // without a fixed ceiling. This reads one lightweight config row per company; the
    // expensive enrollment-record query stays bounded unless Everyday is actually used.
    const companyConfigs =
      await this.onboardingRepository.getAllCompanyReminderDaysConfig();

    const reminderDaysByCompanyId = new Map<number, Set<number>>();
    for (const config of companyConfigs) {
      const reminderDays = this.parseEnrollmentReminderDays(
        config.companyPortalAuthConfig,
      );
      if (!reminderDays.length) {
        continue;
      }
      reminderDaysByCompanyId.set(config.companyId, new Set(reminderDays));
    }

    if (!reminderDaysByCompanyId.size) {
      return {
        message:
          "No company reminder day configuration found for enrollment reminders",
        success: true,
      };
    }

    const hasEverydayCompany = [...reminderDaysByCompanyId.values()].some((days) =>
      days.has(OnboardingService.ENROLLMENT_REMINDER_EVERYDAY),
    );

    // Everyday fires every day up to the end date, so it has no fixed look-ahead →
    // open-ended fetch (null upper bound). With no Everyday company the original
    // bounded window is used, keeping exact-day reminders and their cost unchanged.
    const endDateString = hasEverydayCompany
      ? null
      : this.addDaysToDateString(todayDateString, maxReminderWindowDays);

    this.logInfo("processCompanyConfiguredReminderJobs", `fetching records window: ${todayDateString} → ${endDateString ?? "(open-ended, everyday)"}`, { todayDateString, endDateString, hasEverydayCompany });
    const records = await this.onboardingRepository.getUpcomingPendingEnrollmentReminderRecords(
      todayDateString,
      endDateString,
    );
    this.logInfo("processCompanyConfiguredReminderJobs", `${records.length} pending enrollment records found`, { count: records.length });

    if (!records.length) {
      return {
        message: "No upcoming enrollment end records found for reminder window",
        success: true,
      };
    }

    const dayToEmployeeIdsMap = new Map<number, Set<number>>();
    for (const record of records) {
      const dayOffset = this.getDayOffset(
        todayDateString,
        record.enrollmentEndDate,
      );
      if (dayOffset < 0) {
        continue;
      }

      const allowedReminderDays = reminderDaysByCompanyId.get(record.companyId);
      if (!allowedReminderDays) {
        continue;
      }
      const everyday = allowedReminderDays.has(
        OnboardingService.ENROLLMENT_REMINDER_EVERYDAY,
      );
      // Everyday: fire on every day up to the end date (dayOffset >= 0, already checked).
      // Otherwise: unchanged behaviour — exact day match, and only within 7 days.
      const matches = everyday
        ? true
        : dayOffset <= maxReminderWindowDays && allowedReminderDays.has(dayOffset);
      if (!matches) {
        continue;
      }

      const employeeIds = dayToEmployeeIdsMap.get(dayOffset) ?? new Set<number>();
      employeeIds.add(record.employeeId);
      dayToEmployeeIdsMap.set(dayOffset, employeeIds);
    }

    if (!dayToEmployeeIdsMap.size) {
      return {
        message:
          "No companies matched configured reminder days for upcoming enrollment end dates",
        success: true,
      };
    }

    const daySummary = [...dayToEmployeeIdsMap.entries()].map(([day, ids]) => ({ day, count: ids.size }));
    this.logInfo("processCompanyConfiguredReminderJobs", `reminder day buckets: ${JSON.stringify(daySummary)}`, { daySummary });

    let successCount = 0;
    let failureCount = 0;

    for (const [reminderDay, employeeIds] of dayToEmployeeIdsMap.entries()) {
      const uniqueEmployeeIds = [...employeeIds];
      if (!uniqueEmployeeIds.length) {
        continue;
      }
      const triggerDateString = this.addDaysToDateString(
        todayDateString,
        reminderDay,
      );
      const result = await this.processEmployeeReminderJobsForTriggerDate(
        uniqueEmployeeIds,
        this.parseLocalDateString(triggerDateString),
      );

      if (result.success) {
        successCount += uniqueEmployeeIds.length;
      } else {
        failureCount += uniqueEmployeeIds.length;
      }
    }

    return {
      message: `Enrollment reminders processed from company configuration: ${successCount} successful, ${failureCount} failed`,
      success: failureCount === 0,
    };
  }

  /**
   * Send reminders immediately to all not-yet-enrolled employees for given policies/companies/employees.
   * No date-window check — used for manual HR-triggered reminders.
   */
  private async processImmediateReminder(
    dto: SendEnrollmentReminderDto,
    triggeredByUserId?: number,
  ): Promise<OnboardingResponseDto> {
    this.logInfo("processImmediateReminder", "Sending immediate reminders", { dto, triggeredByUserId });

    let successCount = 0;
    let failureCount = 0;
    const employeeMappings = new Map<number, PolicyEnrollmentEmployeePolicyMap[]>();

    if (dto.employees && dto.employees.length > 0) {
      // Employee-scoped explicit list: fetch ALL policy mappings regardless of enrollment status
      // (HR-initiated manual send — remind regardless of whether already enrolled)
      for (const empId of dto.employees) {
        try {
          const employee = await this.onboardingRepository.findEmployeeById(empId);
          if (!employee) { failureCount++; continue; }
          const mappings = await this.onboardingRepository.findAllEmployeePolicies(Number(empId));
          if (mappings.length === 0) continue;
          for (const mapping of mappings) {
            const existing = employeeMappings.get(employee.id) ?? [];
            existing.push(mapping);
            employeeMappings.set(employee.id, existing);
          }
        } catch (error) {
          this.logError("processImmediateReminder", `Employee ${empId}: ${(error as Error).message}`, { empId });
          failureCount++;
        }
      }
    } else if (dto.policies && dto.policies.length > 0) {
      for (const policyId of dto.policies) {
        try {
          const policy = await this.onboardingRepository.findPolicyById(policyId);
          if (!policy) { failureCount++; continue; }
          const employees = await this.onboardingRepository.getPolicyEmployeesNotEnrolled(
            policyId,
            undefined,
            dto.includeAllEmployees ?? true,
          );
          for (const mapping of employees) {
            const existing = employeeMappings.get(mapping.employee.id) ?? [];
            existing.push(mapping);
            employeeMappings.set(mapping.employee.id, existing);
          }
        } catch (error) {
          this.logError("processImmediateReminder", `Policy ${policyId}: ${(error as Error).message}`, { policyId });
          failureCount++;
        }
      }
    }

    const immediateEntries = [...employeeMappings.entries()];
    const immediateBatch = await this.runInBatches(
      immediateEntries,
      50,
      async ([, mappings]) => {
        await this.sendGroupedReminderNotificationToEmployee(mappings[0].employee, mappings);
      },
      "processImmediateReminder",
    );
    successCount += immediateBatch.successCount;
    failureCount += immediateBatch.failureCount;

    this.logInfo(
      "processImmediateReminder",
      `Immediate reminder batch complete — ${successCount} succeeded, ${failureCount} failed`,
      { triggeredByUserId, successCount, failureCount, employeeIds: immediateEntries.map(([employeeId]) => employeeId) },
    );

    return {
      message: `Immediate reminders sent: ${successCount} succeeded, ${failureCount} failed.`,
      success: failureCount === 0,
    };
  }

  /**
   * Process reminder for a specific day match with enrollment end date filtering
   */
  private async processReminderForSpecificDay(
    daysBeforeEnd: number,
    triggerDate: Date,
    dto: SendEnrollmentReminderDto,
  ): Promise<OnboardingResponseDto> {
    this.logInfo(
      "processReminderForSpecificDay",
      `Processing reminder for ${daysBeforeEnd} days before enrollment end date (trigger date: ${triggerDate.toISOString()})`,
      { daysBeforeEnd, triggerDate },
    );

    let result: OnboardingResponseDto;

    // Hierarchical processing based on priority: policies > companies > employees > default
    if (dto.policies && dto.policies.length > 0) {
      result = await this.processPolicyReminderJobsForTriggerDate(
        dto.policies,
        triggerDate,
        dto.employees,
        dto.includeAllEmployees,
      );
    } else if (dto.companies && dto.companies.length > 0) {
      result = await this.processCompanyReminderJobsForTriggerDate(
        dto.companies,
        triggerDate,
        dto.employees,
        dto.includeAllEmployees,
      );
    } else if (dto.employees && dto.employees.length > 0) {
      result = await this.processEmployeeReminderJobsForTriggerDate(
        dto.employees,
        triggerDate,
      );
    } else {
      result = await this.processAllEmployeePolicyMappingsForTriggerDate(
        triggerDate,
      );
    }

    return result;
  }

  /**
   * Process policies for trigger date based reminders
   */
  private async processPolicyReminderJobsForTriggerDate(
    policyIds: number[],
    triggerDate: Date,
    employeeIds?: number[],
    includeAllEmployees = true,
  ): Promise<OnboardingResponseDto> {
    this.logInfo(
      "processPolicyReminderJobsForTriggerDate",
      `Processing ${
        policyIds.length
      } policies for enrollment end date: ${triggerDate.toISOString()}`,
      { policyIds, triggerDate, employeeIds, includeAllEmployees },
    );

    let successCount = 0;
    let failureCount = 0;
    const employeeMappings = new Map<number, PolicyEnrollmentEmployeePolicyMap[]>();

    for (const policyId of policyIds) {
      try {
        const policy = await this.onboardingRepository.findPolicyById(policyId);

        if (!policy) {
          this.logInfo(
            "processPolicyReminderJobsForTriggerDate",
            `Policy not found for ID: ${policyId}`,
            { policyId },
          );
          failureCount++;
          continue;
        }

        // Get employees for this policy with enrollmentEndDate matching triggerDate
        const policyEmployees =
          await this.onboardingRepository.getPolicyEmployeesWithMatchingEndDate(
            policyId,
            triggerDate,
            employeeIds,
            includeAllEmployees,
          );

        for (const employeeMapping of policyEmployees) {
          const existing = employeeMappings.get(employeeMapping.employee.id) ?? [];
          existing.push(employeeMapping);
          employeeMappings.set(employeeMapping.employee.id, existing);
        }
      } catch (error) {
        this.logError(
          "processPolicyReminderJobsForTriggerDate",
          `Error processing policy ${policyId}: ${error.message}`,
          { policyId },
        );
        failureCount++;
      }
    }

    const entries = [...employeeMappings.entries()];
    const batchResult = await this.runInBatches(
      entries,
      50,
      async ([, mappings]) => {
        await this.sendGroupedReminderNotificationToEmployee(mappings[0].employee, mappings);
      },
      "processPolicyReminderJobsForTriggerDate",
    );
    successCount += batchResult.successCount;
    failureCount += batchResult.failureCount;

    const message = `Policy reminder jobs for trigger date processed: ${successCount} successful, ${failureCount} failed`;

    this.logInfo("processPolicyReminderJobsForTriggerDate", message, {
      successCount,
      failureCount,
    });

    return {
      message,
      success: failureCount === 0,
    };
  }

  /**
   * Process companies for trigger date based reminders
   */
  private async processCompanyReminderJobsForTriggerDate(
    companyIds: number[],
    triggerDate: Date,
    employeeIds?: number[],
    includeAllEmployees = true,
  ): Promise<OnboardingResponseDto> {
    this.logInfo(
      "processCompanyReminderJobsForTriggerDate",
      `Processing ${
        companyIds.length
      } companies for enrollment end date: ${triggerDate.toISOString()}`,
      { companyIds, triggerDate, employeeIds, includeAllEmployees },
    );

    let successCount = 0;
    let failureCount = 0;
    const employeeMappings = new Map<number, PolicyEnrollmentEmployeePolicyMap[]>();

    for (const companyId of companyIds) {
      try {
        // Get mappings for this company with enrollmentEndDate matching triggerDate
        const companyMappings =
          await this.onboardingRepository.getCompanyEmployeesWithMatchingEndDate(
            companyId,
            triggerDate,
            employeeIds,
            includeAllEmployees,
          );

        for (const mapping of companyMappings) {
          const { employee, policy } = mapping;
          if (!employee || !policy) {
            this.logInfo(
              "processCompanyReminderJobsForTriggerDate",
              `Missing employee or policy data for company ${companyId}, mapping ID: ${mapping.id}`,
              { companyId, mappingId: mapping.id },
            );
            continue;
          }
          const existing = employeeMappings.get(employee.id) ?? [];
          existing.push(mapping);
          employeeMappings.set(employee.id, existing);
        }
      } catch (error) {
        this.logError(
          "processCompanyReminderJobsForTriggerDate",
          `Error processing company ${companyId}: ${error.message}`,
          { companyId },
        );
        failureCount++;
      }
    }

    const companyEntries = [...employeeMappings.entries()];
    const companyBatchResult = await this.runInBatches(
      companyEntries,
      50,
      async ([, mappings]) => {
        await this.sendGroupedReminderNotificationToEmployee(mappings[0].employee, mappings);
      },
      "processCompanyReminderJobsForTriggerDate",
    );
    successCount += companyBatchResult.successCount;
    failureCount += companyBatchResult.failureCount;

    const message = `Company reminder jobs for trigger date processed: ${successCount} successful, ${failureCount} failed`;

    this.logInfo("processCompanyReminderJobsForTriggerDate", message, {
      successCount,
      failureCount,
    });

    return {
      message,
      success: failureCount === 0,
    };
  }

  /**
   * Process employees for trigger date based reminders
   */
  private async processEmployeeReminderJobsForTriggerDate(
    employeeIds: number[],
    triggerDate: Date,
  ): Promise<OnboardingResponseDto> {
    this.logInfo(
      "processEmployeeReminderJobsForTriggerDate",
      `Processing ${
        employeeIds.length
      } employees for enrollment end date: ${triggerDate.toISOString()}`,
      { employeeIds, triggerDate },
    );

    const { successCount, failureCount } = await this.runInBatches(
      employeeIds,
      50,
      async (employeeId) => {
        const employee = await this.onboardingRepository.findEmployeeById(employeeId);
        if (!employee) {
          this.logInfo("processEmployeeReminderJobsForTriggerDate", `employee ${employeeId} not found — skipped`, { employeeId });
          return;
        }
        const employeePolicies = await this.onboardingRepository.getEmployeePoliciesWithMatchingEndDate(
          employeeId,
          triggerDate,
        );
        if (!employeePolicies.length) {
          this.logInfo("processEmployeeReminderJobsForTriggerDate", `employee ${employeeId} has no matching policies — skipped`, { employeeId });
          return;
        }
        this.logInfo("processEmployeeReminderJobsForTriggerDate", `sending reminder to employee ${employeeId} for ${employeePolicies.length} policy(ies)`, { employeeId, policyCount: employeePolicies.length });
        await this.sendGroupedReminderNotificationToEmployee(employee, employeePolicies);
        this.logInfo("processEmployeeReminderJobsForTriggerDate", `reminder sent to employee ${employeeId}`, { employeeId });
      },
      "processEmployeeReminderJobsForTriggerDate",
    );

    const message = `Employee reminder jobs for trigger date processed: ${successCount} successful, ${failureCount} failed`;

    this.logInfo("processEmployeeReminderJobsForTriggerDate", message, {
      successCount,
      failureCount,
    });

    return {
      message,
      success: failureCount === 0,
    };
  }

  /**
   * Process all mappings for trigger date based reminders
   */
  private async processAllEmployeePolicyMappingsForTriggerDate(
    triggerDate: Date,
  ): Promise<OnboardingResponseDto> {
    this.logInfo(
      "processAllEmployeePolicyMappingsForTriggerDate",
      `Processing all mappings for enrollment end date: ${triggerDate.toISOString()}`,
      { triggerDate },
    );

    const employeePolicyMappings =
      await this.onboardingRepository.getAllEmployeesWithMatchingEndDate(
        triggerDate,
      );

    this.logInfo(
      "processAllEmployeePolicyMappingsForTriggerDate",
      `Found ${
        employeePolicyMappings.length
      } mappings with enrollment end date: ${triggerDate.toISOString()}`,
      { mappingsCount: employeePolicyMappings.length, triggerDate },
    );

    let successCount = 0;
    let failureCount = 0;

    for (const mapping of employeePolicyMappings) {
      try {
        const { employee, policy } = mapping;

        if (!employee || !policy) {
          this.logInfo(
            "processAllEmployeePolicyMappingsForTriggerDate",
            `Missing employee or policy data for mapping ID: ${mapping.id}`,
            { mappingId: mapping.id },
          );
          continue;
        }

        const existing = employeeMappings.get(employee.id) ?? [];
        existing.push(mapping);
        employeeMappings.set(employee.id, existing);
      } catch (error) {
        this.logError(
          "processAllEmployeePolicyMappingsForTriggerDate",
          `Error processing mapping ID: ${mapping.id} - ${error.message}`,
          { mappingId: mapping.id },
        );
        failureCount++;
      }
    }

    for (const [employeeId, mappings] of employeeMappings.entries()) {
      try {
        await this.sendGroupedReminderNotificationToEmployee(
          mappings[0].employee,
          mappings,
        );
        successCount++;
      } catch (error) {
        this.logError(
          "processAllEmployeePolicyMappingsForTriggerDate",
          `Error processing grouped reminder for employee ${employeeId}: ${error.message}`,
          { employeeId },
        );
        failureCount++;
      }
    }

    const message = `All mappings for trigger date processed: ${successCount} successful, ${failureCount} failed`;

    this.logInfo("processAllEmployeePolicyMappingsForTriggerDate", message, {
      successCount,
      failureCount,
      triggerDate,
    });

    return {
      message,
      success: failureCount === 0,
    };
  }

  /**
   * Send grouped reminder notifications to employee.
   * One notification per enrollment end date group.
   */
  private async sendGroupedReminderNotificationToEmployee(
    employee: any,
    mappings: PolicyEnrollmentEmployeePolicyMap[],
  ): Promise<void> {
    if (!mappings?.length) {
      return;
    }

    const companyId =
      employee.companyId ?? (mappings[0].policy as any)?.companyId ?? 0;
    const countryFormat = await this.onboardingRepository.getCountryFormatForEmployee(employee.id);
    const companyAuthMapping =
      await this.onboardingRepository.findCompanyAuthMappingByCompanyId(
        companyId,
      );

    if (!companyAuthMapping || !companyAuthMapping.authenticationMethod) {
      this.logInfo(
        "sendGroupedReminderNotificationToEmployee",
        `No active authentication method found for company ID: ${companyId}`,
        { companyId },
      );
      return;
    }

    const method = companyAuthMapping.authenticationMethod;
    const { shouldSendEmail, shouldSendPhone } = this.resolveAuthMethodRouting(
      method.methodCode,
      method.methodName,
    );
    const emailRecipient = employee.email;
    const phoneRecipient = employee.phoneNumber;
    if (!emailRecipient && (!shouldSendPhone || !phoneRecipient)) {
      this.logInfo(
        "sendGroupedReminderNotificationToEmployee",
        `No valid recipient found for employee ${employee.id}`,
        { employeeId: employee.id, shouldSendEmail, shouldSendPhone },
        LOG_STATUS.FAILURE,
      );
      return;
    }

    const groups = new Map<string, PolicyEnrollmentEmployeePolicyMap[]>();
    for (const mapping of mappings) {
      const endDateCandidate =
        mapping.enrollmentEndDate ??
        (mapping.policy as any)?.enrollmentEndDate ??
        (mapping.policy as any)?.policyEndDate ??
        (mapping.policy as any)?.policyTo;
      const key = endDateCandidate
        ? this.formatLocalDate(this.parseLocalDateString(endDateCandidate))
        : "unknown";
      const existing = groups.get(key) ?? [];
      existing.push(mapping);
      groups.set(key, existing);
    }

    for (const [groupEndDate, groupMappings] of groups.entries()) {
      const firstPolicy: any = groupMappings[0].policy;
      const targetCompanyId = firstPolicy?.companyId ?? companyId;
      const companyInfo = firstPolicy?.id
        ? await this.onboardingRepository.findConfigCompanyForPolicy(
            targetCompanyId,
            firstPolicy.id,
          )
        : null;
      const { url: portalUrl } = await this.getPortalUrlForCompany(targetCompanyId, firstPolicy?.id);
      const portalSubDomain = companyInfo?.subDomain;
      const brandingAssets = this.getEmailBrandingAssets();
      const parsedEnrollmentEndDate =
        groupEndDate !== "unknown"
          ? this.parseLocalDateString(groupEndDate)
          : null;
      const remainingDays =
        parsedEnrollmentEndDate
          ? Math.max(
              0,
              Math.floor(
                (parsedEnrollmentEndDate.getTime() -
                  this.parseLocalDateString(new Date()).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : undefined;

      const policyDetails = await Promise.all(
        groupMappings.map(async (mapping) => {
          const policy: any = mapping.policy;
          const dependentCount =
            await this.onboardingRepository.countActiveDependentsByEmployeePolicy(
              employee.id,
              policy.id,
            );
          const policyTemplate =
            await this.onboardingRepository.findLivePolicyTemplateByPolicyId(
              policy.id,
            );
          return {
            policyId: policy.id,
            policyName: policy.policyName,
            policyStartDate: this.formatDisplayDate(
              policy.policyStartDate || policy.policyFrom,
            ),
            policyEndDate: this.formatDisplayDate(
              policy.policyEndDate || policy.policyTo,
            ),
            totalLives: formatNumberByLocalization(dependentCount + 1, countryFormat),
            premium: this.formatMoneyOrFallback(policy.premium ?? policy.totalPremium, countryFormat),
            companyPaid: this.formatMoneyOrFallback(policy.companyPaid ?? policy.totalCompanyPay, countryFormat),
            selfPaid: this.formatMoneyOrFallback(policy.selfPaid ?? policy.totalEmployeePay, countryFormat),
            sumInsured: this.formatMoneyOrFallback(policy.sumInsured, countryFormat),
            membersCovered:
              this.extractCoveredRelationsFromPolicyTemplate(policyTemplate),
          };
        }),
      );
      const membersCovered = Array.from(
        new Set(
          policyDetails.flatMap((policy) => policy.membersCovered ?? []),
        ),
      );

      const firstPolicyDetails = policyDetails[0];
      const employeeDisplayName = this.buildDisplayName(
        employee.firstName,
        employee.lastName,
        employee.employeeName,
      );
      const parameters = removeUndefinedFields({
        [ENROLLMENT_NOTIFICATION_PARAMETERS.EMPLOYEE_NAME]:
          employeeDisplayName,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.EMPLOYEE_FULL_NAME]:
          employeeDisplayName,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.EMAIL_ID]: employee.email,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.PHONE_NUMBER]: employee.phoneNumber,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_NAME]:
          firstPolicyDetails?.policyName,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_START_DATE]:
          firstPolicyDetails?.policyStartDate,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_END_DATE]:
          firstPolicyDetails?.policyEndDate,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.ENROLLMENT_END_DATE]:
          parsedEnrollmentEndDate
            ? this.formatDisplayDate(parsedEnrollmentEndDate)
            : undefined,
        enrolmentEndDate: parsedEnrollmentEndDate
          ? this.formatDisplayDate(parsedEnrollmentEndDate)
          : undefined,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.TOTAL_LIVES]:
          firstPolicyDetails?.totalLives,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.PREMIUM]:
          firstPolicyDetails?.premium,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.COMPANY_PAID]:
          firstPolicyDetails?.companyPaid,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.SELF_PAID]:
          firstPolicyDetails?.selfPaid,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.SUM_INSURED]:
          firstPolicyDetails?.sumInsured,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.INSURER_NAME]:
          firstPolicy?.insurerName || "N/A",
        [ENROLLMENT_NOTIFICATION_PARAMETERS.TPA_NAME]:
          firstPolicy?.tpaName || "N/A",
        [ENROLLMENT_NOTIFICATION_PARAMETERS.BROKER_COMPANY_NAME]:
          companyInfo?.brokerName || "IIRM",
        [ENROLLMENT_NOTIFICATION_PARAMETERS.SUPPORT_EMAIL]:
          companyInfo?.supportEmail || ENV.DEFAULT_SUPPORT_EMAIL,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.SUPPORT_PHONE]:
          companyInfo?.supportPhone || ENV.DEFAULT_SUPPORT_PHONE,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.PORTAL_LINK]: portalUrl,
        [ENROLLMENT_NOTIFICATION_PARAMETERS.POLICY_DETAILS]: policyDetails,
        tpaCoordinatorName: firstPolicy?.tpaName || "N/A",
        tpaCoordinatorPhoneNumber:
          companyInfo?.supportPhone || ENV.DEFAULT_SUPPORT_PHONE,
        portalLoginUrl: portalUrl,
        portalSignupUrl: portalUrl,
        remainingDays,
        membersCovered,
        membersCoveredText: membersCovered.length
          ? membersCovered.join(" | ")
          : "Not available",
        membersCoveredHtml: this.buildMembersCoveredHtml(membersCovered),
        familyMembersManagement:
          "Add or update dependent and family member information in the portal",
        iirmLogoUrl: brandingAssets.iirmLogoUrl,
        onboardingIllustrationUrl: brandingAssets.onboardingIllustrationUrl,
        illustrationLogoUrl: brandingAssets.illustrationLogoUrl,
        currentYear: new Date().getFullYear(),
        isMultiPolicy: policyDetails.length > 1,
        policyCount: policyDetails.length,
      });

      const notificationRequests: Array<{
        channel: "email" | "sms";
        request: Promise<any>;
      }> = [];
      if (shouldSendEmail && emailRecipient) {
        notificationRequests.push({
          channel: "email",
          request: axios.post(
            this.notificationServiceUrl,
            removeUndefinedFields({
              eventType: NOTIFICATION_EVENT_TYPES.ENROLLMENT_REMINDER_EMAIL,
              emailId: [emailRecipient],
              channel: NOTIFICATION_EMAIL,
              parameters,
              userId: [employee.userId],
              companyId: targetCompanyId,
              domain: portalSubDomain,
              save: true,
              source: "IBP",
            }),
            {
              headers: { "Content-Type": "application/json" },
              timeout: DEFAULT_ENROLLMENT_TIME_OUT,
            },
          ),
        });
      }

      if (shouldSendPhone && phoneRecipient) {
        notificationRequests.push({
          channel: "sms",
          request: axios.post(
            this.notificationServiceUrl,
            removeUndefinedFields({
              eventType: NOTIFICATION_EVENT_TYPES.ENROLLMENT_REMINDER_MESSAGE,
              phoneNumber: [phoneRecipient],
              channel: NOTIFICATION_SMS,
              parameters,
              userId: [employee.userId],
              companyId: targetCompanyId,
              domain: portalSubDomain,
              save: true,
              source: "IBP",
            }),
            {
              headers: { "Content-Type": "application/json" },
              timeout: DEFAULT_ENROLLMENT_TIME_OUT,
            },
          ),
        });
      }

      if (!notificationRequests.length) {
        continue;
      }

      const settledResponses = await Promise.allSettled(
        notificationRequests.map((item) => item.request),
      );

      let hasAnySuccess = false;
      let hasEmailSuccess = false;
      let reminderEmailNotificationInfoId: number | null = null;

      for (let index = 0; index < settledResponses.length; index += 1) {
        const result = settledResponses[index];
        const channel = notificationRequests[index].channel;

        if (result.status === "fulfilled") {
          const {
            isHttpSuccess,
            isNotificationSuccess,
            notificationInfoId,
          } = this.getNotificationResultDetails(result.value);
          const statusCode = result.value?.status;
          const isSuccess = isHttpSuccess;
          if (isSuccess) {
            hasAnySuccess = true;
            if (channel === "email") {
              hasEmailSuccess = true;
              if (isNotificationSuccess) {
                reminderEmailNotificationInfoId = notificationInfoId;
              }
            }
            continue;
          }

          this.logError(
            "sendGroupedReminderNotificationToEmployee",
            `Enrollment reminder ${channel} notification returned non-success status ${statusCode}`,
            {
              employeeId: employee.id,
              userId: employee.userId,
              channel,
              companyId: targetCompanyId,
              enrollmentEndDate: groupEndDate,
              statusCode,
            },
          );
          continue;
        }

        this.logError(
          "sendGroupedReminderNotificationToEmployee",
          `Enrollment reminder ${channel} notification failed: ${
            result.reason?.message ?? "Unknown error"
          }`,
          {
            employeeId: employee.id,
            userId: employee.userId,
            channel,
            companyId: targetCompanyId,
            enrollmentEndDate: groupEndDate,
          },
        );
      }

      if (shouldSendEmail && emailRecipient && !hasEmailSuccess) {
        throw new Error(
          `Enrollment reminder email notification failed for employee with user ID: ${employee.userId}`,
        );
      }

      if (!shouldSendEmail && !hasAnySuccess) {
        throw new Error(
          `Enrollment reminder notification failed for employee with user ID: ${employee.userId}`,
        );
      }

      await this.createNotificationActivityLog({
        userId: employee.id,
        activityKey: "ENROLLMENT_REMINDER_EMAIL_SENT",
        activityCategory: "ENROLLMENT",
        notificationInfoId: reminderEmailNotificationInfoId,
        metadata: {
          employeeId: employee.id,
          policyIds: groupMappings.map((mapping) => mapping.policy.id),
          enrollmentEndDate: groupEndDate !== "unknown" ? groupEndDate : undefined,
        },
      });
    }
  }

  /**
   * Send enrollment confirmation emails to all enrolled employees of a company
   * @param companyId - The company ID
   * @param employeeIds - Optional specific employee IDs to send emails to
   * @returns Summary of bulk email sending operation
   */
  async sendBulkEnrollmentConfirmation(
    companyId: number,
    employeeIds?: number[],
    subDomain?: string,
  ) {
    this.logInfo("sendBulkEnrollmentConfirmation", {
      companyId,
      employeeIds,
      subDomain,
    });

    const scopedPolicyIds = subDomain
      ? await this.onboardingRepository.findScopedPolicyIdsBySubDomain(
          companyId,
          subDomain,
        )
      : null;

    const enrolledEmployees =
      await this.onboardingRepository.getEnrolledEmployeesByCompany(
        companyId,
        employeeIds,
        scopedPolicyIds
      );

    if (!enrolledEmployees || enrolledEmployees.length === 0) {
      return {
        message: "No enrolled employees found for the company",
        success: false,
        totalEmployees: 0,
        successCount: 0,
        failedCount: 0,
        details: [],
      };
    }

    // Marks a Redis-backed "job in progress" flag so the UI can keep the trigger
    // button disabled for the whole background run instead of just the initial
    // request/response — cleared in `finally` no matter how the job ends.
    await this.setConfirmationJobInProgress(companyId, subDomain);

    try {
      const results: Array<{
        employeeId: number;
        email: string | null;
        status: string;
        message: string;
        policyCount?: number;
      }> = [];
      const sentMappingIds: number[] = [];

      // Batched (50 at a time) so 10K+ employees don't get sent as one
      // uncontrolled burst of concurrent requests to notification-service —
      // same helper sendApologyWelcomeEmail uses for the same reason.
      const { successCount, failureCount } = await this.runInBatches(
        enrolledEmployees,
        50,
        async (enrolledEmployee) => {
          try {
            const result = await this.sendEnrollmentConfirmationNotification({
              policyIds: enrolledEmployee.policyIds,
              employeeId: enrolledEmployee.employeeId,
              emailEventType:
                NOTIFICATION_EVENT_TYPES.BULK_ENROLLMENT_CONFIRMATION_EMAIL,
            });

            if (!result.success) {
              throw new Error(
                result.message || "Failed to send enrollment confirmation email",
              );
            }

            sentMappingIds.push(...enrolledEmployee.mappingIds);
            results.push({
              employeeId: enrolledEmployee.employeeId,
              email: enrolledEmployee.email,
              status: "success",
              message: "Enrollment confirmation email sent successfully",
              policyCount: enrolledEmployee.policyIds.length,
            });
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown error occurred";
            results.push({
              employeeId: enrolledEmployee.employeeId,
              email: enrolledEmployee.email,
              status: "failed",
              message: errorMessage,
              policyCount: enrolledEmployee.policyIds.length,
            });
            throw error;
          }
        },
        "sendBulkEnrollmentConfirmation",
      );

      await this.onboardingRepository.markConfirmationMailSent(sentMappingIds);

      const summary = {
        message: `Bulk enrollment confirmation completed. Success: ${successCount}, Failed: ${failureCount}`,
        success: successCount > 0,
        totalEmployees: enrolledEmployees.length,
        successCount,
        failedCount: failureCount,
        details: results,
      };

      this.logInfo("sendBulkEnrollmentConfirmation", "completed", summary);

      return summary;
    } finally {
      await this.clearConfirmationJobInProgress(companyId, subDomain);
    }
  }

  /**
   * Test-trigger the enrollment confirmation mail for a single employee, identified by email,
   * scoped to a domain the same way sendBulkEnrollmentConfirmation is. Always resends,
   * regardless of whether the confirmation mail already went out for that employee.
   */
  async triggerTestEnrollmentConfirmationNotification(
    companyId: number,
    email: string,
    subDomain?: string,
  ): Promise<{ message: string; success: boolean }> {
    try {
      const company = await this.onboardingRepository.findCompanyById(companyId);
      if (!company) {
        throw new NotFoundException(`Company not found for companyId ${companyId}`);
      }

      const employeeId = await this.onboardingRepository.findEmployeeIdByEmailAndCompany(
        email,
        companyId,
      );
      if (!employeeId) {
        throw new NotFoundException("The user is not configured under this domain.");
      }

      const scopedPolicyIds = subDomain
        ? await this.onboardingRepository.findScopedPolicyIdsBySubDomain(
            companyId,
            subDomain,
          )
        : null;

      const [enrolledEmployee] =
        await this.onboardingRepository.getEnrolledEmployeesByCompany(
          companyId,
          [employeeId],
          scopedPolicyIds,
        );

      if (!enrolledEmployee || !enrolledEmployee.policyIds.length) {
        throw new NotFoundException(
          "The user is not enrolled in any policy under this domain.",
        );
      }

      const result = await this.sendEnrollmentConfirmationNotification({
        employeeId,
        policyIds: enrolledEmployee.policyIds,
        emailEventType: NOTIFICATION_EVENT_TYPES.BULK_ENROLLMENT_CONFIRMATION_EMAIL,
      } as SendEnrollmentConfirmationDto);

      if (!result.success) {
        throw new BadRequestException(
          result.message || "Failed to send enrollment confirmation mail",
        );
      }

      await this.onboardingRepository.markConfirmationMailSent(
        enrolledEmployee.mappingIds,
      );

      return {
        message: `Confirmation mail sent successfully to ${email}`,
        success: true,
      };
    } catch (error) {
      this.logError("triggerTestEnrollmentConfirmationNotification", error, {
        companyId,
        email,
        subDomain,
      });
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("Failed to trigger enrollment confirmation mail");
    }
  }

  /**
   * Preview which employees a bulk-enrollment-confirmation trigger would mail —
   * same eligibility filter as sendBulkEnrollmentConfirmation (enrolled with choices,
   * not auto-submitted, not already sent), paginated in-memory.
   */
  async previewBulkEnrollmentConfirmation(
    companyId: number,
    subDomain?: string,
    page = 1,
    limit = 25,
  ): Promise<{
    totalCount: number;
    page: number;
    limit: number;
    employees: Array<{
      employeeId: number;
      employeeName: string;
      employeeEmail: string | null;
      companyEmployeeId: string | null;
    }>;
  }> {
    const scopedPolicyIds = subDomain
      ? await this.onboardingRepository.findScopedPolicyIdsBySubDomain(
          companyId,
          subDomain,
        )
      : null;

    const enrolledEmployees =
      await this.onboardingRepository.getEnrolledEmployeesByCompany(
        companyId,
        undefined,
        scopedPolicyIds,
      );

    const employees = enrolledEmployees.map((entry) => ({
      employeeId: entry.employeeId,
      employeeName: this.buildDisplayName(null, null, entry.fullName || entry.employeeName),
      employeeEmail: entry.email,
      companyEmployeeId: entry.employeeCompanyId,
    }));

    const safePage = Math.max(1, page);
    const safeLimit = Math.max(1, limit);
    const start = (safePage - 1) * safeLimit;

    return {
      totalCount: employees.length,
      page: safePage,
      limit: safeLimit,
      employees: employees.slice(start, start + safeLimit),
    };
  }

  private async sendApologyWelcomeEmailToEmployee(
    employee: PolicyEnrollmentEmployee,
  ): Promise<{ success: boolean; message: string; notificationInfoId: number | null }> {
    const emailRecipient = employee.email;
    if (!emailRecipient) {
      return {
        success: false,
        message: `Email not found for employee with ID: ${employee.id}`,
        notificationInfoId: null,
      };
    }

    try {
      const brandingAssets = this.getEmailBrandingAssets();
      const parameters = removeUndefinedFields({
        employeeName: this.buildDisplayName(undefined, undefined, employee.employeeName),
        iirmLogoUrl: brandingAssets.iirmLogoUrl,
        currentYear: new Date().getFullYear(),
      });
      const apologyCompanyInfo = employee.companyId
        ? await this.onboardingRepository.findCompanyPortalConfiguration(employee.companyId)
        : null;

      // companyId + save: true tell notification-service to persist a row in
      // notification_info (recipient, rendered content, sent/failed status, error)
      // for this send — that row is the durable per-employee delivery record.
      const response = await axios.post(
        this.notificationServiceUrl,
        removeUndefinedFields({
          eventType: NOTIFICATION_EVENT_TYPES.PREVIOUS_WELCOME_EMAIL_APOLOGY,
          emailId: [emailRecipient],
          channel: NOTIFICATION_EMAIL,
          parameters,
          userId: employee.userId ? [employee.userId] : undefined,
          companyId: employee.companyId,
          domain: apologyCompanyInfo?.subDomain,
          save: true,
        }),
        {
          headers: { "Content-Type": "application/json" },
          timeout: DEFAULT_ENROLLMENT_TIME_OUT,
        },
      );

      const { isHttpSuccess, isNotificationSuccess, notificationInfoId } =
        this.getNotificationResultDetails(response);

      if (!isHttpSuccess || !isNotificationSuccess) {
        const message = `Apology email notification failed for employee ${employee.id} (httpStatus=${response?.status}, notificationStatus=${response?.data?.data?.status})`;
        this.logError("sendApologyWelcomeEmailToEmployee", message, {
          employeeId: employee.id,
          email: emailRecipient,
          notificationInfoId,
        });
        return { success: false, message, notificationInfoId };
      }

      this.logInfo(
        "sendApologyWelcomeEmailToEmployee",
        `apology email sent to employee ${employee.id}`,
        { employeeId: employee.id, email: emailRecipient, notificationInfoId },
      );
      return {
        success: true,
        message: "Apology email sent successfully",
        notificationInfoId,
      };
    } catch (error) {
      this.logError("sendApologyWelcomeEmailToEmployee", error, {
        employeeId: employee.id,
        email: emailRecipient,
      });
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
        notificationInfoId: null,
      };
    }
  }

  /**
   * Send an apology email to employees who may have incorrectly received an earlier welcome email
   * @param employeeIds - Employee IDs to send the apology email to
   * @returns Summary of the bulk email sending operation
   */
  async sendApologyWelcomeEmail(employeeIds: number[]) {
    this.logInfo("sendApologyWelcomeEmail", "method invoked", {
      totalEmployees: employeeIds.length,
    });

    try {
      const employees =
        await this.onboardingRepository.findEmployeesByIds(employeeIds);

      const foundIds = new Set(employees.map((employee) => employee.id));
      const missingEmployeeIds = employeeIds.filter((id) => !foundIds.has(id));
      if (missingEmployeeIds.length) {
        this.logInfo(
          "sendApologyWelcomeEmail",
          `${missingEmployeeIds.length} employee ID(s) not found — skipped`,
          { missingEmployeeIds },
        );
      }

      // Batched (50 at a time) so 4000+ employees don't get sent as one
      // uncontrolled burst of concurrent requests to notification-service.
      const { successCount, failureCount } = await this.runInBatches(
        employees,
        50,
        async (employee) => {
          const result = await this.sendApologyWelcomeEmailToEmployee(employee);
          if (!result.success) {
            throw new Error(result.message);
          }
        },
        "sendApologyWelcomeEmail",
      );

      const failedCount = failureCount + missingEmployeeIds.length;

      this.logInfo("sendApologyWelcomeEmail", "method completed", {
        totalEmployees: employeeIds.length,
        successCount,
        failedCount,
      });

      return {
        message: `Apology welcome email completed. Success: ${successCount}, Failed: ${failedCount}`,
        success: successCount > 0,
        totalEmployees: employeeIds.length,
        successCount,
        failedCount,
        missingEmployeeIds,
      };
    } catch (error) {
      this.logError("sendApologyWelcomeEmail", error, {
        totalEmployees: employeeIds.length,
      });
      throw error;
    }
  }

  async getTermsAndConditions(): Promise<any> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "OnboardingService",
        method: "getTermsAndConditions",
        messageData: "method invoked",
      }),
    });
    try {
      const strapiBaseUrl = this.getStrapiBaseUrl();
      if (!strapiBaseUrl) {
        throw new Error("Strapi base URL is not configured");
      }
      const response = await axios.get(
        `${strapiBaseUrl}/api/terms-and-conditions/active`,
        {
          timeout: 100000,
        },
      );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OnboardingService",
          method: "getTermsAndConditions",
          messageData: response?.data,
        }),
      });
      return response?.data;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OnboardingService",
          method: "getTermsAndConditions",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async acceptTerms(userId: number, tcVersion?: number): Promise<void> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "OnboardingController",
        method: "acceptTerms",
        payload: { userId },
        messageData: "method invoked",
      }),
    });
    try {
      await this.onboardingRepository.acceptTerms(userId, tcVersion);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "OnboardingController",
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
          location: "OnboardingController",
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
        location: "OnboardingService",
        method: "withdrawTerms",
        payload: { userId },
        messageData: "method invoked",
      }),
    });
    try {
      await this.onboardingRepository.withdrawTerms(userId);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "OnboardingService",
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
          location: "OnboardingService",
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
        location: "OnboardingService",
        method: "getUserTcStatus",
        payload: { userId },
        messageData: "method invoked",
      }),
    });
    try {
      const result = await this.onboardingRepository.getUserTcStatus(userId);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "OnboardingService",
          method: "getUserTcStatus",
          payload: { userId },
          messageData: "User TC status fetched successfully",
        }),
      });
      return result;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "OnboardingService",
          method: "getUserTcStatus",
          payload: { userId },
          messageData: error,
        }),
      });
      throw error;
    }
  }
}
