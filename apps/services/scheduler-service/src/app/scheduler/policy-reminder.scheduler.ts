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
import { ENV, IS_DEMO_ENVIRONMENT } from "../../../../service-lib/src/lib/environment";
import {
    PolicyReminderRepository,
    PolicyReminderRow,
} from "./policy-reminder.repository";
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
export class PolicyReminderScheduler {
    private readonly logger: ReturnType<typeof createLogger>;

    constructor(
        private readonly reminderRepository: PolicyReminderRepository,
        private readonly reminderConfigService: ReminderConfigService,
        private readonly crmRecipientResolver: CrmRecipientResolverService,
        private readonly traceIdService: TraceIdService
    ) {
        this.logger = createLogger(
            this.traceIdService,
            serviceNames.SCHEDULER_SERVICE
        );
    }

    // Runs daily at 03:00 AM IST (09:30 PM UTC previous day)
    @Cron("30 21 * * *")
    // @Cron("*/1 * * * *")
    async handlePolicyExpiryReminders(): Promise<void> {
        if (IS_DEMO_ENVIRONMENT) {
            return;
        }
        this.logger.log({
            level: "info",
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "inprogress",
                location: "PolicyReminderScheduler",
                method: "handlePolicyExpiryReminders",
                messageData: "Policy expiry reminder cron triggered",
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
                    location: "PolicyReminderScheduler",
                    method: "handlePolicyExpiryReminders",
                    messageData:
                        "POLICY_REMINDER_DAYS did not resolve to valid integers",
                }),
            });
            return;
        }

        try {
            const rows = await this.getEligiblePolicies(REMINDER_WINDOW_MAX_DAYS);

            this.logger.log({
                level: "info",
                message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    status: "inprogress",
                    location: "PolicyReminderScheduler",
                    method: "handlePolicyExpiryReminders",
                    payload: { totalEligiblePolicies: rows.length },
                    messageData: "Eligible policies fetched for reminder run",
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
                    "policyExpiryReminderDays",
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
                            location: "PolicyReminderScheduler",
                            method: "handlePolicyExpiryReminders",
                            payload: {
                                policyId: row.policyId,
                            },
                            messageData: "Skipping policy reminder due to no TO emails",
                        }),
                    });
                    continue;
                }

                const ccEmails = this.getCcEmails();
                const policyLink = this.buildPolicyLink(row.policyId);

                const parameters = {
                    clientName: row.clientName ?? "-",
                    policyName: row.policyName ?? "-",
                    policyType: row.policyType ?? "-",
                    insurerPolicyNumber: row.insurerPolicyNumber ?? "-",
                    iirmPolicyNumber: String(row.iirmPolicyNumber ?? "-"),
                    insurerName: row.insurerName ?? "-",
                    policyStartDate: this.formatDate(row.policyStartDate),
                    policyEndDate: this.formatDate(row.policyEndDate),
                    policyLink,
                    supportEmail: ENV.POLICY_REMINDER_SUPPORT_EMAIL || "",
                    daysToExpiry: String(row.daysDiff),
                };

                const notificationPayload = {
                    eventType: NOTIFICATION_EVENT_TYPES.POLICY_DUE_DATE,
                    emailId: toEmails,
                    ccEmailId: ccEmails,
                    channel: NOTIFICATION_EMAIL,
                    parameters,
                    userId: row.ownerId ? [row.ownerId] : [],
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
                        location: "PolicyReminderScheduler",
                        method: "handlePolicyExpiryReminders",
                        payload: {
                            policyId: row.policyId,
                            daysDiff: row.daysDiff,
                        },
                        messageData: "Sending policy expiry reminder notification",
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
                        location: "PolicyReminderScheduler",
                        method: "handlePolicyExpiryReminders",
                        payload: {
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
                            location: "PolicyReminderScheduler",
                            method: "handlePolicyExpiryReminders",
                            payload: {
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
                        location: "PolicyReminderScheduler",
                        method: "handlePolicyExpiryReminders",
                        payload: {
                            policyId: row.policyId,
                        },
                        messageData: "Policy expiry reminder notification sent",
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
                    location: "PolicyReminderScheduler",
                    method: "handlePolicyExpiryReminders",
                    messageData: axiosError.response?.data || error,
                }),
            });
        }
    }

    private isCronEnabled(): boolean {
        return (
            (ENV.POLICY_REMINDER_ENABLED || BOOLEAN_VALUES.FALSE).toLowerCase() === BOOLEAN_VALUES.TRUE
        );
    }

    private getReminderDays(): number[] {
        const configured = ENV.POLICY_REMINDER_DAYS;
        if (!configured?.trim()) {
            return [];
        }

        const parsed = configured
            .split(",")
            .map((value: string) => Number.parseInt(value.trim(), 10))
            .filter((value: number) => Number.isInteger(value) && value >= 0);

        return parsed.length ? Array.from(new Set(parsed)) : [];
    }

    private async getEligiblePolicies(
        maxWindowDays: number
    ): Promise<PolicyReminderRow[]> {
        return this.reminderRepository.getEligiblePolicies(maxWindowDays);
    }

    // Rollback switch for the role-based recipient feature (Lead CRM +
    // Company Contacts). Defaults to enabled (unset = on); set to "false" to
    // fall back to the pre-existing owner/env-list recipient logic below for
    // every company, exactly as before this feature existed.
    private isRoleBasedRecipientsEnabled(): boolean {
        return (
            (ENV.POLICY_RENEWAL_ROLE_RECIPIENTS_ENABLED ?? BOOLEAN_VALUES.TRUE).toLowerCase() !==
            BOOLEAN_VALUES.FALSE
        );
    }

    // "Policy Renewals — Lead CRM & Company Contact" recipients: the
    // company's CRM-role users (Lead CRM, Associate CRM, Associate CRM
    // Manager, Account Manager) plus every contact mapped to the company.
    private async getRoleBasedRecipientEmails(companyId: number): Promise<string[]> {
        const [crmUserEmails, companyContactEmails] = await Promise.all([
            this.crmRecipientResolver.getCrmUserEmails(companyId),
            this.crmRecipientResolver.getCompanyContactEmails(companyId),
        ]);
        return Array.from(new Set([...crmUserEmails, ...companyContactEmails]));
    }

    private async getToEmails(row: PolicyReminderRow): Promise<string[]> {
        if (this.isRoleBasedRecipientsEnabled() && row.companyId) {
            const roleBasedEmails = await this.getRoleBasedRecipientEmails(
                row.companyId
            );
            if (roleBasedEmails.length) {
                this.logger.log({
                    level: "info",
                    message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        status: "inprogress",
                        location: "PolicyReminderScheduler",
                        method: "getToEmails",
                        payload: {
                            policyId: row.policyId,
                            companyId: row.companyId,
                            roleBasedToEmails: roleBasedEmails,
                        },
                        messageData: "Resolved Lead CRM/Company Contact TO emails",
                    }),
                });
                return roleBasedEmails;
            }
        }

        const shouldUseDynamicTo =
            (ENV.POLICY_REMINDER_DYNAMIC_TO || BOOLEAN_VALUES.FALSE).toLowerCase() === BOOLEAN_VALUES.TRUE;

        if (!shouldUseDynamicTo) {
            return this.parseCsvEmails(ENV.POLICY_REMINDER_STATIC_TO);
        }

        // Only send to owner (not AM or ISG)
        const userIds = row.ownerId ? [row.ownerId] : [];

        this.logger.log({
            level: "info",
            message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "inprogress",
                location: "PolicyReminderScheduler",
                method: "getToEmails",
                payload: {
                    policyId: row.policyId,
                    ownerId: row.ownerId,
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
                location: "PolicyReminderScheduler",
                method: "getToEmails",
                payload: {
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
            return this.parseCsvEmails(ENV.POLICY_REMINDER_PROD_CC);
        }

        const nonProdCc = this.parseCsvEmails(ENV.POLICY_REMINDER_NON_PROD_CC);
        if (nonProdCc.length) {
            return nonProdCc;
        }
        return this.parseCsvEmails(ENV.POLICY_REMINDER_STATIC_TO);
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
        const baseUrl = ENV.POLICY_REMINDER_POLICY_URL_BASE?.trim();
        if (!baseUrl) {
            throw new Error(
                "POLICY_REMINDER_POLICY_URL_BASE is required for policy reminder links"
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
