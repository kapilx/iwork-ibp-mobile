import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as Handlebars from "handlebars";
import { Repository } from "typeorm";
import { ENTITY_NAME } from "../../../../../../libs/service-lib/src/lib/constants";
import {
  mapSearchParams,
  mapSortParams,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import {
  COMPANY_CRM_ID_PLACEHOLDER,
  DEFAULT_VALUES,
  LOG_STATUS,
  LogStatus,
  NOTIFICATION_COMPANY_ENTITY,
  NOTIFICATION_EMAIL,
  NOTIFICATION_FAILED,
  NOTIFICATION_IN_APP,
  NOTIFICATION_MIR_ENTITY,
  NOTIFICATION_OPPORTUNITY_ENTITY,
  NOTIFICATION_SMS,
  NOTIFICATION_STATUS_DELETE,
  NOTIFICATION_STATUS_READ,
  NOTIFICATION_SUCCESS,
  NOTIFICATION_TEMPLATE_ENTITY,
  NOTIFICATION_EVENT_TYPES,
  serviceNames,
} from "../../../../service-lib/src/lib/constants";
import {
  Company,
  ConfigCompany,
  NotificationInApp,
  NotificationInfo,
  NotificationLogReceiverRecord,
  User
} from "../../../../service-lib/src/lib/entities";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage, serializeError } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  formatAmountWithCurrency,
  formatNumberByLocalization,
  getTaxLabel,
  CountryFormatConfig,
} from "../../../../service-lib/src/lib/utils/currency-format.util";
import { NotificationDataDto } from "./dto/fetch-notification-data.dto";
import { SendNotificationDto } from "./dto/send-notification.dto";
import { EmailService } from "./email.service";
import { NotificationRepository, TemplateDisabledError } from "./notification.repository";
import { SmsService } from "./sms.service";

@Injectable()
export class NotificationService {
  private readonly logger: ReturnType<typeof createLogger>;
  // Set just before rendering a template (from that notification's own
  // parameters.currencyFormat/numberFormat, resolved by the sending service
  // from the recipient's company/employee country) and cleared right after —
  // renderTemplate() is fully synchronous so there's no await between the two,
  // making this safe despite being shared mutable state. This sidesteps having
  // to rely on Handlebars' `data`/`@root` propagation through the custom
  // each/if/with helpers below, which don't forward the `data` frame.
  private currentFormatConfig: CountryFormatConfig | null = null;
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly emailService: EmailService,
    private readonly smsService: SmsService,
    private readonly traceIdService: TraceIdService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
    @InjectRepository(ConfigCompany)
    private readonly configCompanyRepo: Repository<ConfigCompany>,
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.NOTIFICATION_SERVICE,
    );
    this.registerHandlebarsHelpers();
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
        location: "NotificationService",
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
        location: "NotificationService",
        method,
        payload,
        messageData: serializeError(error),
      }),
    });
  }

  // Resolves the "###companyCrmId###" token stored in additional_user_emails
  // to the given company's current CRM lead's email (company.lead_crm -> users.id).
  private async resolveCompanyCrmLeadEmail(
    companyId?: number,
  ): Promise<string | null> {
    this.logInfo("resolveCompanyCrmLeadEmail", "resolving CRM lead email", { companyId });

    if (!companyId) {
      this.logError("resolveCompanyCrmLeadEmail", "companyId not provided for CRM lead placeholder", { companyId });
      return null;
    }

    const company = await this.companyRepo.findOne({
      where: { id: companyId },
      relations: ["owner"],
    });

    this.logInfo("resolveCompanyCrmLeadEmail", "company lookup result", {
      companyId,
      companyFound: Boolean(company),
      leadCrm: company?.leadCrm ?? null,
      leadCrmUserFound: Boolean(company?.owner),
      leadCrmEmail: company?.owner?.emailId ?? null,
    });

    if (!company?.owner?.emailId) {
      this.logError("resolveCompanyCrmLeadEmail", "No CRM lead email found for company", {
        companyId,
        leadCrm: company?.leadCrm ?? null,
      });
      return null;
    }

    return company.owner.emailId;
  }

  // Resolves the company/domain-level CC list (company_portal_configuration.
  // cc_email_addresses, via the ConfigCompany entity), e.g. all TeamLease
  // domains CC'ing Teamleasebackup@indiainsure.com. This is unioned with the
  // template's additional_user_emails at send time — it never replaces the
  // existing additional_user_emails mechanism, which stays common across all
  // companies.
  private async resolveCompanyCcEmails(
    companyId?: number,
    domain?: string,
  ): Promise<string[]> {
    if (!companyId) return [];

    // Domain-specific first: if the notification carries the exact portal
    // subdomain it originated from, only that domain's CC list applies.
    if (domain) {
      const domainConfig = await this.configCompanyRepo.findOne({
        where: { companyId, subDomain: domain },
        select: ["id", "subDomain", "ccEmailAddresses"],
      });

      const domainCcEmails = (domainConfig?.ccEmailAddresses ?? []).filter(
        (email): email is string => Boolean(email),
      );

      this.logInfo("resolveCompanyCcEmails", "domain-specific CC emails resolved", {
        companyId,
        domain,
        domainCcEmails,
      });

      return domainCcEmails;
    }

    // No domain on the request (most callers today) — union whatever CC
    // lists are configured across this company's portal domains.
    const configs = await this.configCompanyRepo.find({
      where: { companyId },
      select: ["id", "subDomain", "ccEmailAddresses"],
    });

    const companyCcEmails = Array.from(
      new Set(
        configs
          .flatMap((config) => config.ccEmailAddresses ?? [])
          .filter((email): email is string => Boolean(email)),
      ),
    );

    this.logInfo("resolveCompanyCcEmails", "company-wide (all-domain) CC emails resolved", {
      companyId,
      companyCcEmails,
    });

    return companyCcEmails;
  }

  // Resolves this send's company_portal_configuration.id ("configId"), so
  // findTemplateMapping can check for a config-scoped template override
  // (see the "Customise Email Templates" tab) before falling back to the
  // shared default. Deliberately conservative: without an exact domain we
  // can't safely pick one config out of a company's several, so we skip
  // the override lookup entirely rather than guess — the send still
  // succeeds using the default template, exactly as it did before this
  // existed.
  private async resolveConfigIdForTemplate(
    companyId?: number,
    domain?: string,
  ): Promise<number | undefined> {
    if (!companyId || !domain) return undefined;

    // Fail-open by design: this only narrows which template variant gets
    // used. If the lookup itself errors (DB hiccup, etc.), that must never
    // block the actual notification send — fall back to the shared default
    // exactly as if no configId had resolved at all.
    try {
      const config = await this.configCompanyRepo.findOne({
        where: { companyId, subDomain: domain },
        select: ["id"],
      });

      this.logInfo("resolveConfigIdForTemplate", "resolved configId for template override lookup", {
        companyId,
        domain,
        configId: config?.id ?? null,
      });

      return config?.id;
    } catch (error) {
      this.logError("resolveConfigIdForTemplate", error, { companyId, domain });
      return undefined;
    }
  }

  // Company-level CC only applies to this explicit allow-list of IBP employee
  // events (onboarding/enrollment, life event, claim intimation, support
  // ticket, client/welcome confirmations) — not to OTP or any of the other
  // iwork/CRM-side notification events.
  private static readonly COMPANY_CC_ELIGIBLE_EVENT_TYPES: string[] = [
    NOTIFICATION_EVENT_TYPES.CLIENT_CONFIRMATION_EMAIL,
    NOTIFICATION_EVENT_TYPES.INITIAL_ONBOARDING_EMAIL,
    NOTIFICATION_EVENT_TYPES.INITIAL_ONBOARDING_MESSAGE,
    NOTIFICATION_EVENT_TYPES.ENROLLMENT_START_EMAIL,
    NOTIFICATION_EVENT_TYPES.ENROLLMENT_START_MESSAGE,
    NOTIFICATION_EVENT_TYPES.ENROLLMENT_REMINDER_EMAIL,
    NOTIFICATION_EVENT_TYPES.ENROLLMENT_REMINDER_MESSAGE,
    NOTIFICATION_EVENT_TYPES.ENROLLMENT_CONFIRMATION_EMAIL,
    NOTIFICATION_EVENT_TYPES.ENROLLMENT_CONFIRMATION_MESSAGE,
    NOTIFICATION_EVENT_TYPES.BULK_ENROLLMENT_CONFIRMATION_EMAIL,
    NOTIFICATION_EVENT_TYPES.LIFE_EVENT_CONFIRMATION_EMAIL,
    NOTIFICATION_EVENT_TYPES.ADDED_DEPENDENTS_EMAIL,
    NOTIFICATION_EVENT_TYPES.CLAIM_INTIMATION_CONFIRMATION_EMAIL,
    NOTIFICATION_EVENT_TYPES.SUPPORT_TICKET_RAISED_EMAIL,
    NOTIFICATION_EVENT_TYPES.SUPPORT_TICKET_STATUS_CHANGED_EMAIL,
    NOTIFICATION_EVENT_TYPES.PREVIOUS_WELCOME_EMAIL_APOLOGY,
  ];

  private isCompanyCcEligibleEventType(eventType?: string): boolean {
    if (!eventType) return false;
    return NotificationService.COMPANY_CC_ELIGIBLE_EVENT_TYPES.includes(eventType);
  }

  private registerHandlebarsHelpers(): void {
    // Register Dependent helper for iterating over dependent details
    Handlebars.registerHelper(
      "Dependent",
      function (dependentDetails: any[], options: any) {
        if (
          !dependentDetails ||
          !Array.isArray(dependentDetails) ||
          dependentDetails.length === 0
        ) {
          return options.inverse(this);
        }

        let result = "";
        for (let i = 0; i < dependentDetails.length; i++) {
          result += options.fn(dependentDetails[i]);
        }
        return result;
      },
    );

    // Register if helper for conditional rendering
    Handlebars.registerHelper("if", function (conditional: any, options: any) {
      if (conditional) {
        return options.fn(this);
      } else {
        return options.inverse(this);
      }
    });

    // Register unless helper for negative conditional rendering
    Handlebars.registerHelper(
      "unless",
      function (conditional: any, options: any) {
        if (!conditional) {
          return options.fn(this);
        } else {
          return options.inverse(this);
        }
      },
    );

    // Register each helper for array iteration
    Handlebars.registerHelper("each", function (context: any[], options: any) {
      if (!context || !Array.isArray(context) || context.length === 0) {
        return options.inverse(this);
      }

      let result = "";
      for (let i = 0; i < context.length; i++) {
        result += options.fn(context[i]);
      }
      return result;
    });

    // Register with helper for changing context
    Handlebars.registerHelper("with", function (context: any, options: any) {
      if (context) {
        return options.fn(context);
      } else {
        return options.inverse(this);
      }
    });

    // Register formatCurrency helper for displaying currency values — country-aware
    // via this.currentFormatConfig (set by renderTemplate from that notification's
    // own parameters), so it shows "Rs 1,50,000" for a Sri Lanka company instead of
    // always "₹"-prefixed, en-IN-grouped output.
    Handlebars.registerHelper("formatCurrency", (amount: any) => {
      return formatAmountWithCurrency(Number(amount), this.currentFormatConfig);
    });

    // Register formatNumber helper for displaying numbers (TypeORM returns numeric as string)
    Handlebars.registerHelper("formatNumber", (num: any) => {
      return formatNumberByLocalization(Number(num), this.currentFormatConfig);
    });

    // Register taxLabel helper for displaying the country's tax name (e.g. "VAT"
    // for Sri Lanka instead of always "GST"). Registered as a helper (not a plain
    // {{taxLabel}} context property) because templates reference it from inside
    // {{#each groupedPolicies}}/{{#each policies}} blocks, where `this` is an
    // individual policy item — a helper reading from this.currentFormatConfig
    // (set by renderTemplate from the notification's own top-level parameters)
    // works regardless of nesting, the same way formatCurrency/formatNumber do.
    Handlebars.registerHelper("taxLabel", () => {
      return getTaxLabel(this.currentFormatConfig);
    });

    // Register safeUrl helper to prevent javascript: URI injection in href attributes
    Handlebars.registerHelper("safeUrl", function (url: string) {
      if (!url || !/^https?:\/\//i.test(url)) return "#";
      return new Handlebars.SafeString(url);
    });
  }

  private async getMailServiceType(companyId?: number): Promise<string> {
    if (!companyId) return "SES";
    try {
      const company = await this.companyRepo.findOne({ where: { id: companyId } });
      return company?.mailServiceType ?? "SES";
    } catch {
      return "SES";
    }
  }

  async sendNotification(dto: SendNotificationDto) {
    // Trim whitespace/newlines from all email addresses — DB entries can have trailing \n
    if (dto.emailId?.length) {
      dto.emailId = dto.emailId.map((e) => e.trim()).filter(Boolean);
    }
    // If sending SMS and emailId is not provided, fetch emailId for each userId
    if (
      dto.channel === NOTIFICATION_SMS &&
      (!dto.emailId || dto.emailId.length === 0) &&
      dto.userId &&
      dto.userId.length > 0
    ) {
      // Fetch email addresses from the database for each userId
      const users = await this.userRepository.find({
        where: dto.userId.map((id) => ({ userId: id })),
        select: ["userId", "emailId"],
      });

      // Map userId to emailId
      const emailMap = new Map(
        users.map((user) => [user.userId, user.emailId]),
      );
      dto.emailId = dto.userId
        .map((id) => emailMap.get(id))
        .filter((email) => email) as string[];
    }
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "NotificationService",
        method: "sendNotification",
        payload: { dto },
        messageData: "method invoked",
      }),
    });
    this.logInfo("sendNotification", undefined, { dto });
    const event = await this.notificationRepository.findEventByName(
      dto.eventType,
    );
    if (!event) {
      throw new Error("Event type not found");
    }

    const notificationChannel =
      await this.notificationRepository.findChannelTypeByName(dto.channel);
    if (!notificationChannel) {
      throw new Error("Notification Channel type not found");
    }

    // If this send carries a companyId + exact domain and the channel is
    // EMAIL, resolve which company_portal_configuration it belongs to, so
    // findTemplateMapping can prefer that config's own customized template
    // (see the "Customise Email Templates" tab) — falling back to the
    // shared default automatically when that config has no override, or
    // when there's no domain to resolve a config from at all.
    //
    // dto.configId, when the caller already knows it exactly (e.g. decoded
    // straight from the sender's own auth token for an authenticated
    // employee-portal action), is preferred outright over the companyId+
    // domain guess — that guess goes through company_portal_config_scope
    // and can miss (or misresolve, for a multi-domain company) whenever
    // scope data doesn't cover the specific policy involved. A caller that
    // already has the real configId has no reason to go through that guess
    // at all.
    const configId =
      notificationChannel.channelTypeKey === NOTIFICATION_EMAIL
        ? dto.configId ?? (await this.resolveConfigIdForTemplate(dto.companyId, dto.domain))
        : undefined;
    console.log("sendNotification: resolved configId for template mapping", configId)
    // Company-wide override for iwork/internal-CRM event types (no domain
    // concept — see the company_id entity comment). Only relevant for
    // EMAIL, same as configId above; harmless to pass through for other
    // channels since findTemplateMapping just won't find a match on a
    // column that's never set for those event types anyway.
    let mapping;
    try {
      mapping = await this.notificationRepository.findTemplateMapping(
        event,
        notificationChannel,
        configId,
        dto.companyId,
      );
    } catch (error) {
      // A disabled template is a deliberate admin choice (Template
      // Management's Disable action) — skip cleanly, same shape as the
      // company/domain notification-config checks above, instead of
      // throwing and forcing every caller across auth-service/ibp-service/
      // org-service to guess why the send failed from a generic error
      // message ("No active and approved template found...").
      if (error instanceof TemplateDisabledError) {
        this.logInfo("sendNotification", "skipped: template disabled", {
          eventType: dto.eventType,
          channel: dto.channel,
          configId,
          companyId: dto.companyId,
        });
        return { status: NOTIFICATION_SKIP_STATUS.TEMPLATE_DISABLED, notificationInfoId: null };
      }
      throw error;
    }

    // console.log("sendNotification: resolved template mapping", {
    //   eventType: dto.eventType,
    //   channel: dto.channel,
    //   mapping: mapping
    // });

    if (!mapping) {
      throw new Error("Active template mapping not found");
    }

    const rendered = this.renderTemplate(mapping.body, dto.parameters);
    const subject = this.renderTemplate(mapping.subject, dto.parameters);
    let additionalUserEmails: string[] = [];

    if (mapping.additionalUserEmails) {
      additionalUserEmails = Object.entries(mapping.additionalUserEmails).map(
        ([index, email]) => email,
      );
    }

    this.logInfo("sendNotification", "additionalUserEmails before placeholder resolution", {
      eventType: dto.eventType,
      companyId: dto.companyId,
      additionalUserEmails,
    });

    if (additionalUserEmails.includes(COMPANY_CRM_ID_PLACEHOLDER)) {
      const crmLeadEmail = await this.resolveCompanyCrmLeadEmail(dto.companyId);
      additionalUserEmails = additionalUserEmails
        .map((email) => (email === COMPANY_CRM_ID_PLACEHOLDER ? crmLeadEmail : email))
        .filter((email): email is string => Boolean(email));

      this.logInfo("sendNotification", "additionalUserEmails after placeholder resolution", {
        eventType: dto.eventType,
        companyId: dto.companyId,
        crmLeadEmail,
        additionalUserEmails,
      });
    }

    // Company-level CC (e.g. Teamleasebackup@indiainsure.com for all TeamLease
    // companies) is unioned with the common additional_user_emails above —
    // both are always CC'd together, one is never a substitute for the other.
    // Only applied for the explicit IBP event allow-list (see
    // COMPANY_CC_ELIGIBLE_EVENT_TYPES) — this excludes OTP and the 20+
    // iwork/CRM-side events by default.
    const companyCcEmails = this.isCompanyCcEligibleEventType(dto.eventType)
      ? await this.resolveCompanyCcEmails(dto.companyId, dto.domain)
      : [];
    const combinedCcEmails = [...additionalUserEmails, ...companyCcEmails];

    let status = NOTIFICATION_SUCCESS;
    let error: string | undefined;
    let emailResponse: any = null;

    const mailServiceType = dto.source === "IBP"
      ? await this.getMailServiceType(dto.companyId)
      : "SES";

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "NotificationService",
        method: "sendNotification",
        payload: {
          eventType: dto.eventType,
          channel: dto.channel,
          source: dto.source ?? "NON-IBP",
          companyId: dto.companyId ?? null,
          mailProvider: mailServiceType,
          recipients: dto.emailId ?? dto.phoneNumber ?? [],
        },
        messageData: `[MAIL-PROVIDER] source=${dto.source ?? "NON-IBP"} companyId=${dto.companyId ?? "none"} eventType=${dto.eventType} channel=${dto.channel} → provider=${mailServiceType}`,
      }),
    });

    try {
      if (dto.channel === NOTIFICATION_EMAIL) {
        const ccEmailId = dto.ccEmailId || [];
        const isServiceEmail =
          dto.eventType === NOTIFICATION_EVENT_TYPES.CLIENT_CONFIRMATION_EMAIL ||
          dto.eventType === NOTIFICATION_EVENT_TYPES.ENDORSEMENT_EMAIL_TO_INSURER;

        if (mailServiceType === "SENDGRID") {
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "NotificationService",
              method: "sendNotification",
              messageData: `[SENDGRID] Sending email | eventType=${dto.eventType} | companyId=${dto.companyId} | to=${(dto.emailId || []).join(",")}`,
            }),
          });
          emailResponse = await this.emailService.sendEmailViaSendGrid(
            dto.emailId,
            [...combinedCcEmails, ...ccEmailId],
            subject,
            rendered
          );
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "NotificationService",
              method: "sendNotification",
              messageData: `[SENDGRID] Email sent successfully | eventType=${dto.eventType} | companyId=${dto.companyId}`,
            }),
          });
        } else {
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "NotificationService",
              method: "sendNotification",
              messageData: `[SES] Sending email | eventType=${dto.eventType} | companyId=${dto.companyId ?? "none"} | source=${dto.source ?? "NON-IBP"} | to=${(dto.emailId || []).join(",")}`,
            }),
          });
          emailResponse = await this.emailService.sendEmail(
            dto.emailId,
            [...combinedCcEmails, ...ccEmailId],
            subject,
            rendered,
            dto.attachments || [],
            dto.userId?.[0],
            isServiceEmail,
            dto.skipPasswordProtection ?? false
          );
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "success",
              location: "NotificationService",
              method: "sendNotification",
              messageData: `[SES] Email sent successfully | eventType=${dto.eventType} | companyId=${dto.companyId ?? "none"}`,
            }),
          });
        }
      }
      if (dto.channel === NOTIFICATION_IN_APP) {
        const notificationRecord: Partial<NotificationInApp>[] = [];
        dto.userId.forEach(async (userId) => {
          notificationRecord.push({
            eventTypeId: event.id, // Assuming `event.id` corresponds to the correct property
            userId: userId,
            subject: subject,
            body: rendered,
          });
        });
        await this.notificationRepository.saveInApp(notificationRecord);
      }
      if (dto.channel === NOTIFICATION_SMS) {
        // Send SMS using SMSCountry Bulk API
        await this.smsService.sendSms(
          dto.phoneNumber || [],
          rendered, // SMS body (template already rendered with parameters)
        );

        // Feature flag: Send email along with SMS if enabled
        // Check environment variable SEND_EMAIL_WITH_SMS (default: true for backward compatibility)
        const sendEmailWithSMS = ENV.SEND_EMAIL_WITH_SMS !== "false";

        if (sendEmailWithSMS) {
          // Send email along with SMS except for OTP-related events
          // Dynamically filter OTP event types from NOTIFICATION_EVENT_TYPES
          const otpEventTypeValues = Object.values(
            NOTIFICATION_EVENT_TYPES,
          ).filter((val: any) => val.toUpperCase().includes("OTP"));
          if (
            dto.eventType &&
            !otpEventTypeValues.some((type) =>
              dto.eventType.toLowerCase().includes(type.toLowerCase()),
            )
          ) {
            if (dto.emailId && dto.emailId.length > 0) {
              if (mailServiceType === "SENDGRID") {
                this.logger.log({
                  level: "info",
                  message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "NotificationService",
                    method: "sendNotification",
                    messageData: `[SENDGRID] Sending SMS+email fallback | eventType=${dto.eventType} | companyId=${dto.companyId} | to=${(dto.emailId || []).join(",")}`,
                  }),
                });
                await this.emailService.sendEmailViaSendGrid(
                  dto.emailId,
                  combinedCcEmails,
                  subject,
                  rendered
                );
              } else {
                this.logger.log({
                  level: "info",
                  message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "success",
                    location: "NotificationService",
                    method: "sendNotification",
                    messageData: `[SES] Sending SMS+email fallback | eventType=${dto.eventType} | companyId=${dto.companyId ?? "none"} | to=${(dto.emailId || []).join(",")}`,
                  }),
                });
                await this.emailService.sendEmail(
                  dto.emailId,
                  combinedCcEmails,
                  subject,
                  rendered,
                  dto.attachments || [],
                  dto.userId?.[0],
                );
              }
            }
          }
        }
      }
      // TODO: handle other channels
    } catch (err: any) {
      status = NOTIFICATION_FAILED;
      error = err.message;
      this.logError("sendNotification", err, { dto });
    }

    const log = await this.notificationRepository.saveLog({
      eventType: event,
      channel: dto.channel,
      status,
      error,
    });
    const userLogRecords: Partial<NotificationLogReceiverRecord>[] = [];
    if (dto.userId && dto.userId.length > 0) {
      dto.userId.forEach(async (userId) => {
        userLogRecords.push({
          logId: log.id,
          receiverUserId: userId,
        });
      });
    } else if (dto.emailId && dto.emailId.length > 0) {
      dto.emailId.forEach(async (email) => {
        userLogRecords.push({
          logId: log.id,
          receiverEmailId: email,
        });
      });
    } else if (dto.phoneNumber && dto.phoneNumber.length > 0) {
      dto.phoneNumber.forEach(async (phone) => {
        userLogRecords.push({
          logId: log.id,
          receiverPhoneNumber: phone,
        });
      });
    }
    await this.notificationRepository.saveUserLogRecord(userLogRecords);

    const isEmailChannel =
      notificationChannel.channelTypeKey === NOTIFICATION_EMAIL;
    const isSmsChannel =
      notificationChannel.channelTypeKey === NOTIFICATION_SMS;
    let notificationInfoId: number | null = null;

    // Save detailed notification information if requested (email or SMS)
    if (dto.companyId && dto.save && (isEmailChannel || isSmsChannel)) {
      const notificationInfo =
        await this.notificationRepository.saveNotificationInfo({
          toRecipients: isEmailChannel
            ? [...(dto.emailId || [])]
            : [...(dto.phoneNumber || [])],
          ccRecipients: isEmailChannel ? [...combinedCcEmails] : [],
          fromSender:
            isEmailChannel
              ? emailResponse?.fromSender ||
                emailResponse?.from ||
                ENV.EMAIL_FROM ||
                DEFAULT_VALUES.NOTIFICATION_SENDER
              : ENV.SMSCOUNTRY_SID || null,
          subject: subject,
          notificationType: notificationChannel.channelTypeKey,
          templateId: mapping.id,
          variables: dto.parameters,
          renderedHtml: rendered,
          provider:
            isEmailChannel
              ? emailResponse?.provider || DEFAULT_VALUES.NOTIFICATION_PROVIDER
              : "SMSCOUNTRY",
          status:
            status === NOTIFICATION_SUCCESS
              ? DEFAULT_VALUES.NOTIFICATION_SENT
              : DEFAULT_VALUES.NOTIFICATION_FAILED,
          providerMessageId:
            isEmailChannel
              ? emailResponse?.messageId ||
                emailResponse?.providerMessageId ||
                emailResponse?.MessageId ||
                null
              : null,
          error: error,
          createdBy: dto.userId && dto.userId.length > 0 ? dto.userId[0] : null,
          sentAt: status === NOTIFICATION_SUCCESS ? new Date() : null,
        });
      notificationInfoId = notificationInfo?.id ?? null;
    }
    return { status, notificationInfoId };
  }

  async getNotifications(
    userId: number,
    page: number,
    limit: number,
    status?: string,
  ) {
    this.logInfo("getNotifications", undefined, {
      userId,
      page,
      limit,
      status,
    });
    try {
      const notifications =
        await this.notificationRepository.getInAppNotifications(
          userId,
          page,
          limit,
          status,
        );
      const notificationResult: NotificationDataDto[] = notifications.map(
        (notification: NotificationInApp) => {
          // Check for template/MIR entity in both subject and body (case-insensitive)
          const contentToCheck =
            `${notification.subject} ${notification.body}`.toLowerCase();
          const isTemplateEntity = contentToCheck.includes("template");
          const isMirEntity = contentToCheck.includes("mir-report");

          return {
            body: {
              entityType: isTemplateEntity
                ? NOTIFICATION_TEMPLATE_ENTITY
                : isMirEntity
                ? NOTIFICATION_MIR_ENTITY
                : notification.body.includes(NOTIFICATION_COMPANY_ENTITY)
                ? NOTIFICATION_COMPANY_ENTITY
                : NOTIFICATION_OPPORTUNITY_ENTITY,
              entityId: this.getEntityIdFromNotificationContent(
                notification.body,
              ),
              content: notification.body,
            },
            createdAt: notification.createdAt,
            deletedAt: notification.deletedAt,
            eventTypeId: notification.eventType,
            id: notification.id,
            statusLid: notification.statusLid,
            subject: notification.subject,
            updatedAt: notification.updatedAt,
            userId: notification.userId,
          };
        },
      );
      const unreadCount =
        await this.notificationRepository.countUnreadInAppNotifications(userId);
      return { notification: notificationResult, unreadCount };
    } catch (error) {
      this.logError("getNotifications", error, { userId, page, limit, status });
      throw new Error("Error fetching notifications");
    }
  }

  async checkLatestNotification(notificationId?: string, status: string) {
    this.logInfo("checkLatestNotification", undefined, {
      notificationId,
      status,
    });
    const latestNotification =
      await this.notificationRepository.findLatestInAppNotification(status);

    const anyNewNotification = notificationId
      ? !!(
          latestNotification &&
          latestNotification.id > parseInt(notificationId, 10)
        )
      : !!latestNotification;

    return { anyNewNotification };
  }

  async updateReadStatus(
    notificationId: number,
    status: string,
    userId: number,
  ) {
    this.logInfo("updateReadStatus", undefined, {
      notificationId,
      status,
      userId,
    });
    if (status == NOTIFICATION_STATUS_READ) {
      await this.notificationRepository.markNotificationRead(notificationId);
    } else if (status == NOTIFICATION_STATUS_DELETE) {
      await this.notificationRepository.deleteNotification(notificationId);
    }

    const unreadCount =
      await this.notificationRepository.countUnreadInAppNotifications(userId);
    const data = await this.notificationRepository.findInAppNotificationById(
      notificationId,
    );

    return { notification: data, unreadCount };
  }

  renderTemplate(body: string, params: Record<string, any>): string {
    this.currentFormatConfig = params?.currencyFormat || params?.numberFormat || params?.taxLabel
      ? {
          currencyFormat: params.currencyFormat,
          numberFormat: params.numberFormat,
          taxLabel: params.taxLabel,
        }
      : null;
    try {
      // Log the template and parameters for debugging
      this.logInfo("renderTemplate", `Rendering template with parameters`, {
        params,
        templatePreview: body.substring(0, 200) + "...",
      });

      // First try Handlebars template compilation
      const template = Handlebars.compile(body);
      const rendered = template(params);

      this.logInfo("renderTemplate", "Template rendered successfully");

      return rendered;
    } catch (handlebarsError) {
      this.logError(
        "renderTemplate",
        `Handlebars compilation failed: ${handlebarsError.message}. Falling back to simple replacement.`,
        { params, templatePreview: body.substring(0, 200) + "..." },
      );

      // Fallback to simple replacement for backward compatibility
      return body.replace(/{{(.*?)}}/g, (_, key) => {
        const cleanKey = key.trim();
        return params[cleanKey] ?? "";
      });
    } finally {
      this.currentFormatConfig = null;
    }
  }

  getEntityIdFromNotificationContent(content: string): number | null {
    const match = content.match(/\/(\d+)(?!.*\d)/);
    return match ? parseInt(match[1], 10) : null;
  }

  async getNotificationInfoByUserId(
    page: number,
    limit: number,
    userId: number,
    sort: string,
    searchBy?: string,
    search?: string,
    field?: string,
    from?: Date,
    to?: Date,
    timeFilter?: string,
    financialYear?: number,
  ) {
    this.logInfo("getNotificationInfoByUserId", undefined, {
      userId,
      page,
      limit,
      sort,
      searchBy,
      search,
      field,
      from,
      to,
      timeFilter,
      financialYear,
    });

    const searchParams = search ? mapSearchParams(search) : [];
    const sortParams = mapSortParams(
      sort,
      ENTITY_NAME.NOTIFICATION_INFO.toUpperCase(),
    );

    const { data, count } =
      await this.notificationRepository.getNotificationInfoByUserId(
        page,
        limit,
        userId,
        sortParams,
        searchParams,
        searchBy,
        field,
        from,
        to,
        timeFilter,
        financialYear,
      );

    return { data: this.transformNotificationInfo(data), count };
  }

  async getNotificationInfoById(id: number) {
    this.logInfo("getNotificationInfoById", undefined, { id });

    const notificationInfo =
      await this.notificationRepository.getNotificationInfoById(id);

    if (!notificationInfo) {
      throw new NotFoundException(`Notification info with ID ${id} not found`);
    }

    return this.transformNotificationInfo([notificationInfo], true)[0];
  }

  private transformNotificationInfo(
    data: NotificationInfo[],
    detailedView = false,
  ) {
    return data.map((info: NotificationInfo) => ({
      id: info.id,
      toRecipients: info.toRecipients,
      ccRecipients: info.ccRecipients,
      fromSender: info.fromSender,
      subject: info.subject,
      notificationType: info.notificationType,
      templateId: info.templateId,
      variables: info.variables,
      renderedHtml: detailedView ? info.renderedHtml : undefined,
      provider: detailedView ? info.provider : undefined,
      status: detailedView ? info.status : undefined,
      providerMessageId: detailedView ? info.providerMessageId : undefined,
      error: detailedView ? info.error : undefined,
      createdAt: detailedView ? info.createdAt : undefined,
      createdBy: detailedView ? info.createdBy : undefined,
      sentAt: info.sentAt,
    }));
  }
}
