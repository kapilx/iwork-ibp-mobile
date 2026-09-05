import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, Not, Repository } from "typeorm";
import { EntityService } from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import {
  APPROVAL_STATUS_APPROVED,
  DEFAULT_DATE_FILTER_FIELD,
  LOG_STATUS,
  LogStatus,
  NOTIFICATION_STATE_ON,
  NOTIFICATION_STATUS_DELETE,
  NOTIFICATION_STATUS_READ,
  NOTIFICATION_STATUS_UNREAD,
  SearchArrayEntry,
  serviceNames,
  TEMPLATE_ACTIVE_STATUS_ACTIVE,
  TEMPLATE_ACTIVE_STATUS_INACTIVE,
} from "../../../../service-lib/src/lib/constants";
import {
  CompanyEmailTemplateMap,
  LookUp,
  NotificationChannelEventTemplateMapping,
  NotificationChannelType,
  NotificationEventType,
  NotificationInApp,
  NotificationInfo,
  NotificationLog,
  NotificationLogReceiverRecord
} from "../../../../service-lib/src/lib/entities";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { getDateRange } from "../../../../service-lib/src/lib/utils/get-data-range.utils";
import { buildLogMessage, serializeError } from "../../../../service-lib/src/lib/utils/logger.util";

// Thrown by findTemplateMapping specifically when a template row for this
// event+channel DOES exist but was deliberately disabled (Template
// Management's Disable action) — as opposed to the plain Error thrown when
// no row was ever configured at all (a genuine setup gap). Callers
// (sendNotification) use this distinction to return a clean
// NOTIFICATION_SKIP_STATUS.TEMPLATE_DISABLED skip, the same way an admin
// turning off the company/domain notification-config toggle already skips
// cleanly instead of failing loudly — disabling a template is an
// intentional choice, not an error.
export class TemplateDisabledError extends Error {
  constructor(eventName: string, channelKey: string) {
    super(`Template for event '${eventName}' and channel '${channelKey}' is disabled.`);
    this.name = "TemplateDisabledError";
  }
}

@Injectable()
export class NotificationRepository {
  private readonly logger: ReturnType<typeof createLogger>;
  constructor(
    @InjectRepository(NotificationEventType)
    private readonly eventRepo: Repository<NotificationEventType>,
    @InjectRepository(NotificationChannelType)
    private readonly channelTypeRepo: Repository<NotificationChannelType>,
    @InjectRepository(NotificationChannelEventTemplateMapping)
    private readonly mappingRepo: Repository<NotificationChannelEventTemplateMapping>,
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    @InjectRepository(NotificationInApp)
    private readonly inAppRepo: Repository<NotificationInApp>,
    @InjectRepository(NotificationLogReceiverRecord)
    private readonly logReceiverRepo: Repository<NotificationLogReceiverRecord>,
    @InjectRepository(CompanyEmailTemplateMap)
    private readonly companyEmailTemplateRepo: Repository<CompanyEmailTemplateMap>,
    @InjectRepository(NotificationInfo)
    private readonly notificationInfoRepo: Repository<NotificationInfo>,
    @InjectRepository(LookUp)
    private readonly lookUpRepo: Repository<LookUp>,
    private readonly entityService: EntityService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.NOTIFICATION_SERVICE,
    );
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
        location: "NotificationRepository",
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
        location: "NotificationRepository",
        method,
        payload,
        messageData: serializeError(error),
      }),
    });
  }

  findEventByName(name: string) {
    this.logInfo("findEventByName", undefined, { name });
    return this.eventRepo.findOne({ where: { name } });
  }

  findChannelTypeByName(name: string) {
    this.logInfo("findChannelTypeByName", undefined, { name });
    return this.channelTypeRepo.findOne({ where: { channelTypeKey: name } });
  }

  findInAppNotificationById(id: number) {
    this.logInfo("findInAppNotificationById", undefined, { id });
    return this.inAppRepo.findOne({
      where: { id },
    });
  }

  async findTemplateMapping(
    event: NotificationEventType,
    channel: NotificationChannelType,
    configId?: number,
    companyId?: number,
  ) {
    this.logInfo("findTemplateMapping", undefined, { event, channel, configId, companyId });
    try {
      const status = await this.lookUpRepo.findOne({
        where: { lookUpKey: NOTIFICATION_STATE_ON },
      });
      if (!status) {
        throw new Error("Status for notifications turned on was not found");
      }

      // Get approved status lookup ID
      const approvedStatus = await this.lookUpRepo.findOne({
        where: { lookUpKey: APPROVAL_STATUS_APPROVED },
      });
      if (!approvedStatus) {
        throw new Error("Approved status lookup for templates not found");
      }

      // Get inactive status lookup ID
      const inactiveStatus = await this.lookUpRepo.findOne({
        where: { lookUpKey: TEMPLATE_ACTIVE_STATUS_INACTIVE },
      });
      if (!inactiveStatus) {
        throw new Error("Inactive status lookup for templates not found");
      }

      // Find template that is ON and not explicitly disabled.
      // activeStatusLid is always enforced — a disabled template (default
      // or override) must never be sent, that's the entire point of
      // "disable" — BUT most rows in this table predate that column ever
      // being set at all and sit at activeStatusLid IS NULL (confirmed via
      // DB: 35 of 68 default rows), not the ACTIVE lookup id. Requiring
      // `= activeStatus.id` would silently stop sending every one of those
      // — matching only "explicitly ACTIVE" is wrong; the correct condition
      // is "not explicitly INACTIVE" (NULL counts as never-disabled).
      // approvalStatusLid stays behind the env flag: making approval
      // mandatory at send time is a separate, bigger behavior change nobody
      // has asked for yet, and isn't needed for "disable" to work.
      const baseCondition: any = {
        eventTypeId: event.id,
        channelTypeId: channel.id,
        statusLid: status.id,
      };

      if (process.env.NOTIFICATION_TEMPLATE_STRICT_STATUS === "true") {
        baseCondition.approvalStatusLid = approvedStatus.id;
      }

      // TypeORM's `!=` (Not()) excludes NULL rows too (standard SQL NULL
      // semantics) — an array of alternatives is how to express
      // "activeStatusLid IS NULL OR activeStatusLid != inactiveStatus.id"
      // as one AND-of-the-rest, OR-on-this-one query.
      const notExplicitlyDisabled = [
        { ...baseCondition, activeStatusLid: IsNull() },
        { ...baseCondition, activeStatusLid: Not(inactiveStatus.id) },
      ];

      // If this send has a resolved configId, prefer that config's own
      // override (the "Customise Email Templates" tab's saved content) over
      // the shared default — but only if one actually exists AND isn't
      // disabled for this event+channel. A disabled override correctly
      // falls through to the shared default below, same as "no override
      // exists" — the activeStatusLid filter above already excludes it from
      // this lookup.
      if (configId) {
        console.log("findTemplateMapping: checking for config-scoped override", {
          eventTypeId: event.id,
          channelTypeId: channel.id,
          configId,
        });
        const override = await this.mappingRepo.findOne({
          where: notExplicitlyDisabled.map((condition) => ({ ...condition, configId })),
        });
        if (override) {
          this.logInfo("findTemplateMapping", "using config-scoped override", {
            eventTypeId: event.id,
            channelTypeId: channel.id,
            configId,
            templateId: override.id,
          });
          return override;
        }
      }

      // Company-wide override — for iwork/internal-CRM event types with no
      // domain concept at all (see company_id's entity comment). Checked
      // after configId (domain is the more specific scope when both could
      // theoretically apply) and before the plain default.
      if (companyId) {
        const companyOverride = await this.mappingRepo.findOne({
          where: notExplicitlyDisabled.map((condition) => ({ ...condition, companyId })),
        });
        if (companyOverride) {
          this.logInfo("findTemplateMapping", "using company-scoped override", {
            eventTypeId: event.id,
            channelTypeId: channel.id,
            companyId,
            templateId: companyOverride.id,
          });
          return companyOverride;
        }
      }

      const template = await this.mappingRepo.findOne({
        where: notExplicitlyDisabled.map((condition) => ({
          ...condition,
          configId: IsNull(),
          companyId: IsNull(),
        })),
      });

      if (!template) {
        // Distinguish "exists but disabled" from "never configured at all"
        // — the former is a deliberate admin choice (see
        // TemplateDisabledError), the latter a genuine setup gap that
        // should keep failing loudly. Same statusLid/configId/companyId
        // filters as above, just without the active-status exclusion.
        const disabledTemplate = await this.mappingRepo.findOne({
          where: { ...baseCondition, configId: IsNull(), companyId: IsNull() },
        });
        if (disabledTemplate) {
          throw new TemplateDisabledError(event.name, channel.channelTypeKey);
        }

        throw new Error(
          `No active and approved template found for event '${event.name}' and channel '${channel.channelTypeKey}'. ` +
            `Please ensure an active and approved template is configured for this event-channel combination.`,
        );
      }

      return template;
    } catch (error) {
      this.logError("findTemplateMapping", error, {
        eventTypeId: event?.id,
        channelTypeId: channel?.id,
        configId,
      });
      throw error;
    }
  }

  async findCompanyEmailTemplateMapping(
    eventTypeId: number,
    companyId: number,
  ) {
    this.logInfo("findCompanyEmailTemplateMapping", undefined, {
      eventTypeId,
      companyId,
    });
    const template = await this.companyEmailTemplateRepo.findOne({
      where: {
        eventTypeId: eventTypeId,
        companyId: companyId,
        isActive: true,
      },
      order: { updatedAt: "DESC" },
      relations: ["template"],
    });
    if (!template) {
      return null;
    }

    // Additional checks: Ensure the underlying template is active and approved
    const activeStatus = await this.lookUpRepo.findOne({
      where: { lookUpKey: TEMPLATE_ACTIVE_STATUS_ACTIVE },
    });

    const approvedStatus = await this.lookUpRepo.findOne({
      where: { lookUpKey: APPROVAL_STATUS_APPROVED },
    });

    if (activeStatus && template.template.activeStatusLid !== activeStatus.id) {
      throw new Error(
        `Company template found but the underlying template (ID: ${template.template.id}) is inactive. ` +
          `Please activate the template or configure a different one for this company.`,
      );
    }

    if (
      approvedStatus &&
      template.template.approvalStatusLid !== approvedStatus.id
    ) {
      throw new Error(
        `Company template found but the underlying template (ID: ${template.template.id}) is not approved. ` +
          `Please get the template approved or configure a different one for this company.`,
      );
    }

    return {
      id: template.id,
      subject: template.template.subject,
      body: template.template.body,
      additionalUserEmails: template.additionalUserEmails,
      isActive: template.isActive,
    };
  }

  saveLog(log: Partial<NotificationLog>) {
    this.logInfo("saveLog", undefined, { log });
    return this.logRepo.save(log);
  }

  saveUserLogRecord(log: Partial<NotificationLogReceiverRecord>[]) {
    this.logInfo("saveUserLogRecord", undefined, { log });
    return this.logReceiverRepo.save(log);
  }

  async saveNotificationInfo(notificationData: Partial<NotificationInfo>) {
    this.logInfo("saveNotificationInfo", undefined, { notificationData });
    return this.notificationInfoRepo.save(notificationData);
  }

  async saveInApp(notification: Partial<NotificationInApp>[]) {
    this.logInfo("saveInApp", undefined, { notification });
    const status = await this.lookUpRepo.findOne({
      where: { lookUpKey: NOTIFICATION_STATUS_UNREAD },
    });
    if (!status) {
      throw new Error("Status for read notifications not found");
    }
    return this.inAppRepo.save(
      notification.map((n) => ({ ...n, statusLid: status.id, updatedAt: new Date() })),
    );
  }

  async getInAppNotifications(
    userId: number,
    page: number,
    limit: number,
    status?: string,
  ) {
    this.logInfo(
      "getInAppNotifications",
      `Fetching in-app notifications for userId: ${userId}`,
      { page, limit, status },
    );
    try {
      const whereCondition: { userId?: number; statusLid?: number } = {};
      whereCondition.userId = userId;
      if (status) {
        const statusLid = await this.lookUpRepo.findOne({
          where: { lookUpKey: status },
        });
        if (!statusLid) {
          throw new Error("Status for unread notifications not found");
        }
        whereCondition.statusLid = statusLid.id;
      }
      const { data } = await this.entityService.fetchEntityList(
        NotificationInApp,
        page,
        limit,
        [
          { field: "status", order: "ASC" },
          { field: "id", order: "DESC" },
        ],
        undefined,
        whereCondition,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        true,
      );
      return data;
    } catch (error) {
      this.logError("getInAppNotifications", error, {
        userId,
        page,
        limit,
        status,
      });
      throw new Error("Error fetching in-app notifications");
    }
  }

  async countUnreadInAppNotifications(userId: number) {
    this.logInfo(
      "countUnreadInAppNotifications",
      `Counting unread notifications for userId: ${userId}`,
    );
    const status = await this.lookUpRepo.findOne({
      where: { lookUpKey: NOTIFICATION_STATUS_UNREAD },
    });
    if (!status) {
      throw new Error("Status for unread notifications not found");
    }
    return this.inAppRepo.count({
      where: { statusLid: status.id, userId: userId },
    });
  }

  async findLatestInAppNotification(status: string) {
    this.logInfo(
      "findLatestInAppNotification",
      `Fetching latest notification with status: ${status}`,
    );
    const statusKey = await this.lookUpRepo.findOne({
      where: { lookUpKey: status },
    });
    if (!statusKey) {
      throw new Error("Status for read notifications not found");
    }
    return this.inAppRepo.findOne({
      where: { statusLid: statusKey.id },
      order: { id: "DESC" },
    });
  }

  async markNotificationRead(notificationId: number) {
    this.logInfo(
      "markNotificationRead",
      `Marking notification ${notificationId} as read`,
    );
    const status = await this.lookUpRepo.findOne({
      where: { lookUpKey: NOTIFICATION_STATUS_READ },
    });
    if (!status) {
      throw new Error("Status for read notifications not found");
    }
    return this.inAppRepo.update(
      { id: notificationId },
      { statusLid: status.id, updatedAt: new Date() },
    );
  }

  async deleteNotification(notificationId: number) {
    this.logInfo(
      "deleteNotification",
      `Deleting notification ${notificationId}`,
    );
    const status = await this.lookUpRepo.findOne({
      where: { lookUpKey: NOTIFICATION_STATUS_DELETE },
    });
    if (!status) {
      throw new Error("Status for read notifications not found");
    }
    return this.inAppRepo.update(
      { id: notificationId },
      { statusLid: status.id, deletedAt: new Date() },
    );
  }

  async getNotificationInfoByUserId(
    page: number,
    limit: number,
    userId: number,
    sort: { field: string; order: "ASC" | "DESC" }[],
    searchArray: SearchArrayEntry[],
    search?: string,
    field?: string,
    fromDate?: Date,
    toDate?: Date,
    timeFilter?: string,
    financialYear?: number,
  ) {
    this.logInfo(
      "getNotificationInfoByUserId",
      `Fetching notification info for userId: ${userId}`,
    );

    const dateRange = getDateRange(timeFilter, financialYear);
    let dateFilter;
    if (fromDate || toDate) {
      dateFilter = {
        field: field ?? DEFAULT_DATE_FILTER_FIELD,
        from: fromDate ?? dateRange.start,
        to: toDate ?? dateRange.end,
      };
    }

    const { data, count } = await this.entityService.fetchEntityList(
      NotificationInfo, // entity
      page, // page
      limit, // limit
      sort, // sort
      undefined, // relations
      { createdBy: userId }, // whereCondition
      undefined, // selectFields
      searchArray, // searchArray
      undefined, // userFilter
      search, // search value
      ["subject", "toRecipients", "ccRecipients", "fromSender", "error"], // search on
      dateFilter && Object.keys(dateFilter).length > 0
        ? (dateFilter as { field: string; from: Date; to?: Date })
        : undefined, // dateFilter
      undefined, // periodFilter
      true, // preserveCreatedAt
    );
    return { data, count };
  }

  async getNotificationInfoById(id: number) {
    this.logInfo(
      "getNotificationInfoById",
      `Fetching notification info with id: ${id}`,
    );
    return this.notificationInfoRepo.findOne({
      where: { id },
    });
  }
}
