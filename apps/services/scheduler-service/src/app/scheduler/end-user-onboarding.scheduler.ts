import { Injectable, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import { Repository } from "typeorm";
import {
  serviceNames,
} from "../../../../service-lib/src/lib/constants";
import { SCHEDULER_HANDLERS } from "../../../../../../libs/service-lib/src/lib/constants";
import {
  Company,
  PolicyEnrollmentEmployeePolicyMap,
  Policy,
} from "../../../../service-lib/src/lib/entities";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { DynamicCronService } from "../cron-configuration/dynamic-cron.service";
import { Cron } from "@nestjs/schedule";

const TRUE = "true";
@Injectable()
export class EndUserOnboardingScheduler implements OnModuleInit {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly traceIdService: TraceIdService,
    private readonly dynamicCronService: DynamicCronService,
    @InjectRepository(PolicyEnrollmentEmployeePolicyMap)
    private readonly policyEnrollmentMapRepository: Repository<PolicyEnrollmentEmployeePolicyMap>
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.SCHEDULER_SERVICE
    );
  }

  async onModuleInit() {
    this.logger.log("Initializing EndUserOnboardingScheduler...");

    const END_USER_ONBOARDING_KEYS = [
      "HANDLE_INITIAL_ONBOARDING_NOTIFICATIONS",
      "HANDLE_ENROLLMENT_START_NOTIFICATIONS",
      "HANDLE_ENROLLMENT_REMINDER_NOTIFICATIONS",
      "HANDLE_ENROLLMENT_CUTOFF_AUTO_SUBMIT",
    ];

    const handlers = new Map<string, () => Promise<void>>();

    for (const key of END_USER_ONBOARDING_KEYS) {
      const methodName = SCHEDULER_HANDLERS[key];

      if (!methodName) {
        this.logger.warn(`No handler mapping found for key: ${key}`);
        continue;
      }

      const method = this[methodName as keyof EndUserOnboardingScheduler];

      if (typeof method === "function") {
        handlers.set(key, (method as () => Promise<void>).bind(this));
        this.logger.log(`Registered handler: ${key} -> ${methodName}`);
      } else {
        this.logger.warn(`Method not found on scheduler: ${methodName}`);
      }
    }

    this.dynamicCronService.registerHandlers(handlers);
    await this.dynamicCronService.loadCronJobs();
  }

  /**
   * Initial onboarding notification cron for newly added employees.
   * Picks rows where is_on_borading_mail_sent = false, sends notification, then marks as sent.
   */
  // @Cron("*/01 * * * *") // Every 1 minute for testing, change to "0 9 * * *" for daily at 9 AM
  async sendPendingInitialOnboardingNotifications(): Promise<void> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "EndUserOnboardingScheduler",
        method: "sendPendingInitialOnboardingNotifications",
        messageData: "Starting pending initial onboarding notifications job",
      }),
    });

    try {
      if (ENV.HANDLE_INITIAL_ONBOARDING_NOTIFICATIONS !== TRUE) {
        return;
      }

      const batchSize = 200;
      const pendingMappings = await this.policyEnrollmentMapRepository.manager.transaction(
        async (manager) => {
          const rows = await manager
            .createQueryBuilder(PolicyEnrollmentEmployeePolicyMap, "epm")
            .innerJoin(Policy, "policy", "policy.id = epm.policyId")
            .innerJoin(Company, "company", "company.id = policy.companyId")
            .select("epm.id", "id")
            .addSelect("epm.employeeId", "employeeId")
            .addSelect("epm.policyId", "policyId")
            .addSelect("policy.companyId", "companyId")
            .where("epm.deletedAt IS NULL")
            .andWhere("epm.isOnBoradingMailSent = :isOnBoradingMailSent", {
              isOnBoradingMailSent: false,
            })
            // If a company is configured for manual triggering, exclude it from cron.
            .andWhere(
              "COALESCE(company.initialOnboardingMailTriggerMode, :defaultMode) != :manualMode",
              {
                defaultMode: "cron",
                manualMode: "manual",
              },
            )
            .orderBy("epm.id", "ASC")
            .take(batchSize)
            .setLock("pessimistic_write")
            .setOnLocked("skip_locked")
            .getRawMany<{
              id: number;
              employeeId: number;
              policyId: number;
              companyId: number;
            }>();

          const claimedIds = rows
            .map((row) => Number(row.id))
            .filter((id) => Number.isFinite(id));

          if (claimedIds.length) {
            await manager
              .createQueryBuilder()
              .update(PolicyEnrollmentEmployeePolicyMap)
              .set({ isOnBoradingMailSent: true })
              .whereInIds(claimedIds)
              .andWhere("isOnBoradingMailSent = :isOnBoradingMailSent", {
                isOnBoradingMailSent: false,
              })
              .execute();
          }

          return rows;
        },
      );

      if (!pendingMappings.length) {
        return;
      }

      const sentMappingIds: number[] = [];
      const failedMappingIds: number[] = [];
      let failedCount = 0;
      const groupedMappings = new Map<
        string,
        {
          employeeId: number;
          companyId: number;
          mappingIds: number[];
          policyIds: number[];
        }
      >();

      for (const mapping of pendingMappings) {
        const groupKey = `${mapping.employeeId}:${mapping.companyId}`;
        const existingGroup = groupedMappings.get(groupKey);

        if (existingGroup) {
          existingGroup.mappingIds.push(Number(mapping.id));
          existingGroup.policyIds.push(Number(mapping.policyId));
          continue;
        }

        groupedMappings.set(groupKey, {
          employeeId: Number(mapping.employeeId),
          companyId: Number(mapping.companyId),
          mappingIds: [Number(mapping.id)],
          policyIds: [Number(mapping.policyId)],
        });
      }

      for (const group of groupedMappings.values()) {
        try {
          const response = await axios.post(
            `${ENV.URL_IBP_SERVICE}/onboarding/initial-notification`,
            {
              employeeId: group.employeeId,
              policyIds: group.policyIds,
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
              timeout: 30000,
            }
          );

          if (response.status === 200 || response.status === 201) {
            sentMappingIds.push(...group.mappingIds);
            continue;
          }

          failedMappingIds.push(...group.mappingIds);
          failedCount += group.mappingIds.length;
        } catch (error) {
          console.log("Error sending initial onboarding notification for employee %s and company %s:", group.employeeId, group.companyId, error);
          failedMappingIds.push(...group.mappingIds);
          failedCount += group.mappingIds.length;
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "EndUserOnboardingScheduler",
              method: "sendPendingInitialOnboardingNotifications",
              messageData: `Initial onboarding notification failed for employee ${group.employeeId} and company ${group.companyId}: ${error.message}`,
            }),
          });
        }
      }

      if (failedMappingIds.length) {
        await this.policyEnrollmentMapRepository
          .createQueryBuilder()
          .update(PolicyEnrollmentEmployeePolicyMap)
          .set({ isOnBoradingMailSent: false })
          .whereInIds(failedMappingIds)
          .execute();
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "EndUserOnboardingScheduler",
          method: "sendPendingInitialOnboardingNotifications",
          messageData: `Pending initial onboarding notifications processed: sent=${sentMappingIds.length}, failed=${failedCount}`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EndUserOnboardingScheduler",
          method: "sendPendingInitialOnboardingNotifications",
          messageData: `Error in pending initial onboarding notifications job: ${error.message}`,
        }),
      });
    }
  }

  /**
   * Enrollment Start Notification Cron Job
   * Runs daily at 9:00 AM to check for enrollment periods starting today
   */
  // @Cron("*/01 * * * *") // Daily at 9:00 AM
  async sendEnrollmentStartNotifications(): Promise<void> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "EndUserOnboardingScheduler",
        method: "sendEnrollmentStartNotifications",
        messageData: "Starting enrollment start notifications job",
      }),
    });

    try {
      if (ENV.HANDLE_ENROLLMENT_START_NOTIFICATION_CRON !== TRUE) {
        return;
      }
      const todayDateString = this.formatLocalDate(new Date());
      // Call the onboarding service to handle the business logic
      const response = await axios.post(
        `${ENV.URL_IBP_SERVICE}/onboarding/enrollment-start`,
        {
          triggerDate: todayDateString,
          range: 1,
          includeAllEmployees: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000, // 30 second timeout for this operation
        }
      );

      if (response.status === 200 || response.status === 201) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "EndUserOnboardingScheduler",
            method: "sendEnrollmentStartNotifications",
            messageData: `Enrollment start notifications completed successfully: ${response.data?.message}`,
          }),
        });
      } else {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "EndUserOnboardingScheduler",
            method: "sendEnrollmentStartNotifications",
            messageData: `Enrollment start notifications failed with status: ${response.status}`,
          }),
        });
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EndUserOnboardingScheduler",
          method: "sendEnrollmentStartNotifications",
          messageData: `Error calling enrollment start notification service: ${error.message}`,
        }),
      });
    }
  }

  /**
   * Enrollment Reminder Notifications Cron Job
   * Runs daily at 10:00 AM to send reminder notifications (7, 3, 2, 1 days before deadline)
   */
  // @Cron("*/01 * * * *")
  async sendEnrollmentReminderNotifications(): Promise<void> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "EndUserOnboardingScheduler",
        method: "sendEnrollmentReminderNotifications",
        messageData: "Starting enrollment reminder notifications job",
      }),
    });
    try {
      if (ENV.HANDLE_ENROLLMENT_REMINDER_NOTIFICATION_CRON !== TRUE) {
        return;
      }

      const todayDateString = this.formatLocalDate(new Date());
      const response = await axios.post(
        `${ENV.URL_IBP_SERVICE}/onboarding/enrollment-reminder`,
        {
          triggerDate: todayDateString,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const isSuccess = response.status === 200 || response.status === 201;
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: isSuccess ? "success" : "failure",
          location: "EndUserOnboardingScheduler",
          method: "sendEnrollmentReminderNotifications",
          messageData: isSuccess
            ? `Enrollment reminder trigger completed: ${response.data?.message || "success"}`
            : `Enrollment reminder trigger failed with status ${response.status}`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EndUserOnboardingScheduler",
          method: "sendEnrollmentReminderNotifications",
          messageData: `Error calling enrollment reminder notification service: ${error.message}`,
        }),
      });
    }
  }

  /**
   * Auto-submit enrollment after cutoff (next day).
   * Picks employees whose enrollmentEndDate was yesterday and submits defaults for missing selections.
   */
  async autoSubmitEnrollmentsAfterCutoff(): Promise<void> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "EndUserOnboardingScheduler",
        method: "autoSubmitEnrollmentsAfterCutoff",
        messageData: "Starting auto-submit enrollments after cutoff job",
      }),
    });
    try {
      const triggerDate = this.formatLocalDate(
        new Date(Date.now() - 24 * 60 * 60 * 1000),
      );

      await axios.post(
        `${ENV.URL_IBP_SERVICE}/company-employee/policy/auto-submit-after-cutoff`,
        { triggerDate },
        {
          headers: {
            "Content-Type": "application/json",
            "x-bypass-timeout": "true",
          },
          timeout: 300000,
        },
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "EndUserOnboardingScheduler",
          method: "autoSubmitEnrollmentsAfterCutoff",
          messageData: `Auto-submit after cutoff failed: ${error.message}`,
        }),
      });
    }
  }

  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

}
