import { Injectable } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import axios, { AxiosError } from "axios";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import {
  NOTIFICATION_EMAIL,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_SUCCESS,
  serviceNames,
} from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { formatAmountWithCurrency } from "../../../../service-lib/src/lib/utils/currency-format.util";
import { ENV, IS_DEMO_ENVIRONMENT } from "../../../../service-lib/src/lib/environment";
import {
  InstallmentReminderRepository,
  InstallmentReminderRow,
} from "./installment-reminder.repository";
import { BOOLEAN_VALUES } from "../../../../../../libs/service-lib/src/lib/constants";
import {
  ReminderConfigService,
  CompanyReminderConfig,
} from "../../../../service-lib/src/lib/reminder-config.service";
import { CrmRecipientResolverService } from "../../../../service-lib/src/lib/crm-recipient-resolver.service";

// Safety bound for the DB query only (widens candidates so per-company reminder
// days can be applied in application code afterward) - not a business threshold.
const REMINDER_WINDOW_MAX_DAYS = 90;

@Injectable()
export class InstallmentReminderScheduler {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly reminderRepository: InstallmentReminderRepository,
    private readonly reminderConfigService: ReminderConfigService,
    private readonly crmRecipientResolver: CrmRecipientResolverService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.SCHEDULER_SERVICE
    );
  }

  // Runs daily at 03:15 AM IST (09:45 PM UTC previous day)
  @Cron("45 21 * * *")
  // @Cron("*/5 * * * *")
  async handleInstallmentDueReminders(): Promise<void> {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "inprogress",
        location: "InstallmentReminderScheduler",
        method: "handleInstallmentDueReminders",
        messageData: "Installment reminder cron triggered",
      }),
    });

    if (!this.isCronEnabled()) {
      return;
    }

    const fallbackReminderDays = this.getReminderDays();
    if (!fallbackReminderDays.length) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "warning",
          location: "InstallmentReminderScheduler",
          method: "handleInstallmentDueReminders",
          messageData:
            "INSTALLMENT_REMINDER_DAYS did not resolve to valid integers",
        }),
      });
      return;
    }

    try {
      const paidStatusId = await this.getInstallmentPaidStatusId();
      const rows = await this.getEligibleInstallments(
        REMINDER_WINDOW_MAX_DAYS,
        paidStatusId
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "inprogress",
          location: "InstallmentReminderScheduler",
          method: "handleInstallmentDueReminders",
          payload: { totalEligibleInstallments: rows.length },
          messageData: "Eligible installments fetched for reminder run",
        }),
      });

      if (!rows.length) {
        return;
      }

      const companyIds = Array.from(
        new Set(
          rows
            .map((row) => row.companyId)
            .filter((companyId): companyId is number => !!companyId)
        )
      );
      const reminderDaysByCompany =
        await this.reminderConfigService.getReminderDaysByCompany(
          companyIds,
          "installmentReminderDays",
          fallbackReminderDays
        );

      for (const row of rows) {
        const allowedReminderDays =
          reminderDaysByCompany.get(row.companyId) ?? fallbackReminderDays;
        if (!allowedReminderDays.includes(row.daysDiff)) {
          continue;
        }

        const toEmails = await this.getToEmails(row);
        if (!toEmails.length) {
          this.logger.warn({
            level: "warn",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "warning",
              location: "InstallmentReminderScheduler",
              method: "handleInstallmentDueReminders",
              payload: {
                installmentId: row.installmentId,
                policyId: row.policyId,
              },
              messageData: "Skipping installment reminder due to no TO emails",
            }),
          });
          continue;
        }

        const ccEmails = this.getCcEmails();
        const policyLink = this.buildPolicyLink(row.policyId);
        const policyPeriod = `${this.formatDate(
          row.policyFrom
        )} - ${this.formatDate(row.policyTo)}`;

        const parameters = {
          clientName: row.clientName ?? "-",
          policyName: row.policyName ?? "-",
          policyType: row.policyType ?? "-",
          insurerPolicyNumber: row.insurerPolicyNumber ?? "-",
          iirmPolicyNumber: String(row.iirmPolicyNumber ?? "-"),
          insurerName: row.insurerName ?? "-",
          policyPeriod,
          installmentNumber:
            row.installmentNo ??
            (row.installmentSequence ? String(row.installmentSequence) : "-"),
          installmentDate: this.formatDate(row.installmentDate),
          installmentAmount:
            row.installmentAmount != null
              ? formatAmountWithCurrency(Number(row.installmentAmount), {
                  currencyFormat: row.currencyFormat,
                  numberFormat: row.numberFormat,
                })
              : "-",
          policyLink,
          supportEmail: ENV.INSTALLMENT_REMINDER_SUPPORT_EMAIL || "",
        };

        const notificationPayload = {
          eventType: NOTIFICATION_EVENT_TYPES.INSTALLMENT_DUE_DATE,
          emailId: toEmails,
          ccEmailId: ccEmails,
          channel: NOTIFICATION_EMAIL,
          parameters,
          userId: [row.ownerId ?? row.amId ?? row.isgId ?? 0],
          companyId: row.companyId,
          save: true,
          additionalUserId: [],
          attachments: [],
        };

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "inprogress",
            location: "InstallmentReminderScheduler",
            method: "handleInstallmentDueReminders",
            payload: {
              installmentId: row.installmentId,
              policyId: row.policyId,
              daysDiff: row.daysDiff,
            },
            messageData: "Sending installment reminder notification",
          }),
        });

        const notificationResponse = await axios.post(
          `${ENV.URL_NOTIFICATION_SERVICE}/notifications`,
          {
            ...notificationPayload,
          }
        );

        const notificationStatus =
          notificationResponse?.data?.data?.status ||
          notificationResponse?.data?.status;

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "inprogress",
            location: "InstallmentReminderScheduler",
            method: "handleInstallmentDueReminders",
            payload: {
              installmentId: row.installmentId,
              policyId: row.policyId,
              notificationStatus,
              notificationResponse: notificationResponse?.data,
            },
            messageData: "Notification service response received",
          }),
        });

        if (notificationStatus !== NOTIFICATION_SUCCESS) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "InstallmentReminderScheduler",
              method: "handleInstallmentDueReminders",
              payload: {
                installmentId: row.installmentId,
                policyId: row.policyId,
                notificationStatus,
              },
              messageData:
                "Notification service returned non-success status for email",
            }),
          });
          continue;
        }

        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "InstallmentReminderScheduler",
            method: "handleInstallmentDueReminders",
            payload: {
              installmentId: row.installmentId,
              policyId: row.policyId,
            },
            messageData: "Installment reminder notification sent",
          }),
        });
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "InstallmentReminderScheduler",
          method: "handleInstallmentDueReminders",
          messageData: axiosError.response?.data || error,
        }),
      });
    }
  }

  private isCronEnabled(): boolean {
    return (
      (ENV.INSTALLMENT_REMINDER_ENABLED || BOOLEAN_VALUES.FALSE).toLowerCase() === BOOLEAN_VALUES.TRUE
    );
  }

  private getReminderDays(): number[] {
    const configured = ENV.INSTALLMENT_REMINDER_DAYS;
    if (!configured?.trim()) {
      return [];
    }

    const parsed = configured
      .split(",")
      .map((value: string) => Number.parseInt(value.trim(), 10))
      .filter((value: number) => Number.isInteger(value) && value >= 0);

    return parsed.length ? Array.from(new Set(parsed)) : [];
  }

  private async getInstallmentPaidStatusId(): Promise<number | null> {
    const paidStatusKey = ENV.INSTALLMENT_REMINDER_PAID_STATUS_KEY;
    if (!paidStatusKey?.trim()) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "warning",
          location: "InstallmentReminderScheduler",
          method: "getInstallmentPaidStatusId",
          messageData: "INSTALLMENT_REMINDER_PAID_STATUS_KEY is not configured",
        }),
      });
      return null;
    }

    const paidStatusId =
      await this.reminderRepository.getInstallmentPaidStatusId(paidStatusKey);

    if (!paidStatusId) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "warning",
          location: "InstallmentReminderScheduler",
          method: "getInstallmentPaidStatusId",
          messageData: `${paidStatusKey} lookup not found`,
        }),
      });
      return null;
    }

    return paidStatusId;
  }

  private async getEligibleInstallments(
    maxWindowDays: number,
    paidStatusId: number | null
  ): Promise<InstallmentReminderRow[]> {
    return this.reminderRepository.getEligibleInstallments(
      maxWindowDays,
      paidStatusId
    );
  }

  // Rollback switch for the role-based recipient feature ("CRM users").
  // Defaults to enabled (unset = on); set to "false" to fall back to the
  // pre-existing owner/env-list recipient logic below for every company,
  // exactly as before this feature existed.
  private isRoleBasedRecipientsEnabled(): boolean {
    return (
      (ENV.INSTALLMENT_REMINDER_ROLE_RECIPIENTS_ENABLED ?? BOOLEAN_VALUES.TRUE).toLowerCase() !==
      BOOLEAN_VALUES.FALSE
    );
  }

  private async getToEmails(row: InstallmentReminderRow): Promise<string[]> {
    if (this.isRoleBasedRecipientsEnabled() && row.companyId) {
      const crmUserEmails = await this.crmRecipientResolver.getCrmUserEmails(
        row.companyId
      );
      if (crmUserEmails.length) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "inprogress",
            location: "InstallmentReminderScheduler",
            method: "getToEmails",
            payload: {
              installmentId: row.installmentId,
              policyId: row.policyId,
              companyId: row.companyId,
              crmUserToEmails: crmUserEmails,
            },
            messageData: "Resolved CRM users TO emails",
          }),
        });
        return crmUserEmails;
      }
    }

    const shouldUseDynamicTo =
      (ENV.INSTALLMENT_REMINDER_DYNAMIC_TO || BOOLEAN_VALUES.FALSE).toLowerCase() === BOOLEAN_VALUES.TRUE;

    if (!shouldUseDynamicTo) {
      return this.parseCsvEmails(ENV.INSTALLMENT_REMINDER_STATIC_TO);
    }

    const userIds = Array.from(
      new Set(
        [row.ownerId, row.amId, row.isgId].filter((id): id is number => !!id)
      )
    );

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "inprogress",
        location: "InstallmentReminderScheduler",
        method: "getToEmails",
        payload: {
          installmentId: row.installmentId,
          policyId: row.policyId,
          ownerId: row.ownerId,
          amId: row.amId,
          isgId: row.isgId,
          dynamicUserIds: userIds,
        },
        messageData: "Resolving dynamic TO emails",
      }),
    });

    if (!userIds.length) {
      return [];
    }

    const emails = await this.reminderRepository.getDynamicRecipientEmails(
      userIds
    );

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "inprogress",
        location: "InstallmentReminderScheduler",
        method: "getToEmails",
        payload: {
          installmentId: row.installmentId,
          policyId: row.policyId,
          dynamicUserIds: userIds,
          dynamicToEmails: emails,
        },
        messageData: emails.length
          ? "Resolved dynamic TO emails"
          : "No dynamic TO emails resolved",
      }),
    });

    return emails;
  }

  private getCcEmails(): string[] {
    const nodeEnv = (ENV.NODE_ENV || "").toLowerCase();
    const isProd = nodeEnv === "prod" || nodeEnv === "production";
    if (isProd) {
      return this.parseCsvEmails(ENV.INSTALLMENT_REMINDER_PROD_CC);
    }

    const nonProdCc = this.parseCsvEmails(ENV.INSTALLMENT_REMINDER_NON_PROD_CC);
    if (nonProdCc.length) {
      return nonProdCc;
    }
    return this.parseCsvEmails(ENV.INSTALLMENT_REMINDER_STATIC_TO);
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
          .filter((email) => email.length > 0)
      )
    );
  }

  private buildPolicyLink(policyId: number): string {
    const baseUrl = ENV.INSTALLMENT_REMINDER_POLICY_URL_BASE?.trim();
    if (!baseUrl) {
      throw new Error(
        "INSTALLMENT_REMINDER_POLICY_URL_BASE is required for installment reminder links"
      );
    }
    return `${baseUrl.replace(/\/+$/, "")}/policies/${policyId}`;
  }

  private formatDate(value: string | null): string {
    if (!value) {
      return "-";
    }
    return value;
  }
}
