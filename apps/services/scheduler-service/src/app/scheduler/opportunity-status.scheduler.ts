import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import { Repository, Brackets } from "typeorm";
import {
  Endorsement,
  Opportunity,
  OrgSbu,
  Policy,
  PolicyAssetEndorsement,
  PolicyTypeSegregation,
  SbuRoPolicyTypeSuppression,
} from "../../../../service-lib/src/lib/entities";
import { LookUp } from "../../../../service-lib/src/lib/entities/look-up.entity";
import { User } from "../../../../service-lib/src/lib/entities/user";
import { NotificationEventParameterMapping } from "../../../../service-lib/src/lib/entities/notification-event-parameter-mapping.entity";
import { OpportunityActivityMap } from "../../../../service-lib/src/lib/entities/opportunity-activity-map.entity";
import {
  NOTIFICATION_EMAIL,
  NOTIFICATION_IN_APP,
} from "../../../../service-lib/src/lib/constants";
import { ENV, IS_DEMO_ENVIRONMENT } from "../../../../service-lib/src/lib/environment";
import {
  SALES_OPPORTUNITY,
  RENEWAL_OPPORTUNITY,
  USER_STATUS_ACTIVE,
  BUSINESS_TARGET_ENTITY_TYPE,
  SCHEDULER_HANDLERS,
  OPPORTUNITY_ACTIVITY,
} from "../../../../../../libs/service-lib/src/lib/constants";
import bcrypt from "bcryptjs";
import { JwtService } from "@nestjs/jwt";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { handlePoliciesCloseToExpiry } from "../../../../../../libs/service-lib/src/lib/utils/ro-creation.utils";
import { DynamicCronService } from "../cron-configuration/dynamic-cron.service";
import { ReminderConfigService } from "../../../../service-lib/src/lib/reminder-config.service";

const OPPORTUNITY_STATUS = "OPPORTUNITY_STATUS";
const OPPORTUNITY_STATUS_LOST = "OPPORTUNITY_STATUS_LOST";
const OPPORTUNITY_STATUS_WON = "OPPORTUNITY_STATUS_WON";
const OPPORTUNITY_ACTIVITY_STATUS_CLOSED = "OPPORTUNITY_ACTIVITY_STATUS_CLOSED";
const TRUE = "true";
// Safety bound for the close-to-expiry DB query only (widens candidates so
// per-company reminder days can be applied in application code afterward) -
// not a business threshold.
const REMINDER_WINDOW_MAX_DAYS = 90;
export const NOTIFICATION_EVENT_TYPES = {
  OPPORTUNITY_EXPIRATION: "Opportunity_Expiration",
  OPPORTUNITY_ACTIVITY_PLAN_DELAY: "Opportunity_Activity_Plan_Delay",
};

@Injectable()
export class OpportunityStatusScheduler implements OnModuleInit {
  private readonly logger: ReturnType<typeof createLogger>;
  constructor(
    @InjectRepository(Opportunity)
    private readonly opportunityRepository: Repository<Opportunity>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(NotificationEventParameterMapping)
    private readonly notificationEventParamRepository: Repository<NotificationEventParameterMapping>,
    @InjectRepository(OpportunityActivityMap)
    private readonly opportunityActivityMapRepository: Repository<OpportunityActivityMap>,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(PolicyTypeSegregation)
    private readonly policyTypeSegregationRepository: Repository<PolicyTypeSegregation>,
    @InjectRepository(OrgSbu)
    private readonly orgSbuRepository: Repository<OrgSbu>,
    @InjectRepository(SbuRoPolicyTypeSuppression)
    private readonly sbuRoPolicyTypeSuppressionRepository: Repository<SbuRoPolicyTypeSuppression>,
    @InjectRepository(Endorsement)
    private readonly endorsementRepository: Repository<Endorsement>,
    @InjectRepository(PolicyAssetEndorsement)
    private readonly policyAssetEndorsementRepository: Repository<PolicyAssetEndorsement>,
    private readonly jwtService: JwtService,
    private readonly traceIdService: TraceIdService,
    private readonly dynamicCronService: DynamicCronService,
    private readonly reminderConfigService: ReminderConfigService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.SCHEDULER_SERVICE
    );
  }

  async onModuleInit() {
    this.logger.log("Initializing OpportunityStatusScheduler...");

    // Only keys relevant to OpportunityStatusScheduler
    const OPPORTUNITY_STATUS_KEYS = [
      "HANDLE_EXPIRED_OPPORTUNITIES",
      "HANDLE_OPPORTUNITY_ACTIVITIES_CLOSE_TO_EXPIRY",
      "HANDLE_OPPORTUNITIES_CLOSE_TO_EXPIRY",
      "GENERATE_PERFORMANCE_OUTPUT_FOR_ALL_USERS",
      "HANDLE_POLICIES_CLOSE_TO_EXPIRY",
      "REFRESH_COMPANY_ANALYTICS",
    ];

    const handlers = new Map<string, () => Promise<void>>();

    for (const key of OPPORTUNITY_STATUS_KEYS) {
      const methodName = SCHEDULER_HANDLERS[key];

      if (!methodName) {
        this.logger.warn(`No handler mapping found for key: ${key}`);
        continue;
      }

      const method = this[methodName as keyof OpportunityStatusScheduler];

      if (typeof method === "function") {
        handlers.set(key, (method as () => Promise<void>).bind(this));
        this.logger.log(`Registered handler: ${key} -> ${methodName}`);
      } else {
        this.logger.warn(`Method not found on scheduler: ${methodName}`);
      }
    }

    // Register only relevant handlers
    this.dynamicCronService.registerHandlers(handlers);

    // Load and schedule crons from DB
    await this.dynamicCronService.loadCronJobs();
  }

  // Runs every day at 12:00 AM UTC (05:30 AM IST)
  // @Cron("0 0 * * *")
  async refreshCompanyAnalytics() {
    this.logger.log("refreshCompanyAnalytics - cron job started");
    try {
      const login = await this.login(
        `${ENV.SCHEDULER_LOGIN_USERNAME}`,
        `${ENV.SCHEDULER_LOGIN_PASSWORD}`
      );

      const userDetails = await this.userRepository.findOne({
        where: { loginName: ENV.SCHEDULER_LOGIN_USERNAME },
      });

      if (!userDetails) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "OpportunityStatusScheduler",
            method: "refreshCompanyAnalytics",
            messageData: `No user found with user name: ${ENV.SCHEDULER_LOGIN_USERNAME}`,
          }),
        });
        return;
      }

      await axios.get(`${ENV.URL_ORG_SERVICE}/company/analytics/refresh`, {
        headers: {
          Authorization: `Bearer ${login.accessToken.accessToken}`,
          userid: userDetails.userId,
          'x-bypass-timeout': 'true',
        },
      });

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityStatusScheduler",
          method: "refreshCompanyAnalytics",
          messageData:
            "Triggered company analytics refresh via org service endpoint",
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityStatusScheduler",
          method: "refreshCompanyAnalytics",
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `An error occurred while triggering company analytics refresh.${errorMessage}`
      );
    }
  }

  // Runs every day at 09:30 PM UTC (03:00 am IST)
  @Cron("30 21 * * *")
  async handleExpiredOpportunities() {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "OpportunityStatusScheduler",
            method: "handleExpiredOpportunities",
            messageData: `handleExpiredOpportunities cron started`,
          }),
    });
    try {
      if (ENV.HANDLE_EXPIRED_OPPORTUNITY_CRON !== TRUE) {
        return;
      }

      const opportunityStatus = await this.lookUpRepository.find({
        where: { lookUpName: OPPORTUNITY_STATUS },
      });

      if (!opportunityStatus?.length) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "OpportunityStatusScheduler",
            method: "handleExpiredOpportunities",
            messageData: `Lookups with name ${OPPORTUNITY_STATUS} not found`,
          }),
        });
        return;
      }

      const lostStatus = opportunityStatus.find(
        (lookup) => lookup.lookUpKey === OPPORTUNITY_STATUS_LOST
      );
      const wonStatus = opportunityStatus.find(
        (lookup) => lookup.lookUpKey === OPPORTUNITY_STATUS_WON
      );

      if (!lostStatus || !wonStatus) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "OpportunityStatusScheduler",
            method: "handleExpiredOpportunities",
            messageData: "Required opportunity status lookup missing",
          }),
        });
        return;
      }

      const now = new Date();
      const opportunityLostGracePeriodDays = Math.max(
        Number.parseInt(
          ENV.OPPORTUNITY_LOST_GRACE_PERIOD_DAYS ?? "0",
          10
        ) || 0,
        0
      );
      const opportunityLostCutoffDate = new Date(now);
      opportunityLostCutoffDate.setDate(
        opportunityLostCutoffDate.getDate() - opportunityLostGracePeriodDays
      );

      // Query A: Placement slip NOT completed (or absent) — mark Lost instantly on expiry date.
      const instantLostOpportunities = await this.opportunityRepository
        .createQueryBuilder("opportunity")
        .where("opportunity.expiry_date < :now", { now })
        .andWhere(
          new Brackets((qb) => {
            qb.where("opportunity.status_lid IS NULL").orWhere(
              "opportunity.status_lid != :lostStatusId",
              { lostStatusId: lostStatus.id }
            );
          })
        )
        .andWhere("opportunity.status_lid != :wonStatusId", {
          wonStatusId: wonStatus.id,
        })
        .andWhere(
          `NOT EXISTS (
            SELECT 1 FROM opportunity_activity_map oam
            WHERE oam.opportunity_id = opportunity.id
              AND oam.opportunity_table = :psTable
              AND oam.completed_at IS NOT NULL
          )`,
          { psTable: OPPORTUNITY_ACTIVITY.PLACEMENT_SLIP }
        )
        .getMany();

      // Query B: Placement slip IS completed but premium calculation NOT completed —
      // mark Lost only after expiry date + grace period.
      const gracePeriodLostOpportunities = await this.opportunityRepository
        .createQueryBuilder("opportunity")
        .where("opportunity.expiry_date < :opportunityLostCutoffDate", {
          opportunityLostCutoffDate,
        })
        .andWhere(
          new Brackets((qb) => {
            qb.where("opportunity.status_lid IS NULL").orWhere(
              "opportunity.status_lid != :lostStatusId",
              { lostStatusId: lostStatus.id }
            );
          })
        )
        .andWhere("opportunity.status_lid != :wonStatusId", {
          wonStatusId: wonStatus.id,
        })
        .andWhere(
          `EXISTS (
            SELECT 1 FROM opportunity_activity_map oam
            WHERE oam.opportunity_id = opportunity.id
              AND oam.opportunity_table = :psTable
              AND oam.completed_at IS NOT NULL
          )`,
          { psTable: OPPORTUNITY_ACTIVITY.PLACEMENT_SLIP }
        )
        .andWhere(
          `NOT EXISTS (
            SELECT 1 FROM opportunity_activity_map oam
            WHERE oam.opportunity_id = opportunity.id
              AND oam.opportunity_table = :pcTable
              AND oam.completed_at IS NOT NULL
          )`,
          { pcTable: OPPORTUNITY_ACTIVITY.PREMIUM_CALCULATION }
        )
        .getMany();

      if (!instantLostOpportunities.length && !gracePeriodLostOpportunities.length) {
        return;
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityStatusScheduler",
          method: "handleExpiredOpportunities",
          messageData: `Found ${instantLostOpportunities.length} instant-lost and ${gracePeriodLostOpportunities.length} grace-period-lost opportunities (grace period: ${opportunityLostGracePeriodDays} day(s))`,
        }),
      });
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityStatusScheduler",
          method: "handleExpiredOpportunities",
          messageData: {
            instantLostIds: instantLostOpportunities.map((o) => o.opportunityId),
            gracePeriodLostIds: gracePeriodLostOpportunities.map((o) => o.opportunityId),
            gracePeriodDays: opportunityLostGracePeriodDays,
            opportunityLostCutoffDate,
          },
        }),
      });
      // Login once
    const login = await this.login(
        `${ENV.SCHEDULER_LOGIN_USERNAME}`,
        `${ENV.SCHEDULER_LOGIN_PASSWORD}`
      );

      const userDetails = await this.userRepository.findOne({
        where: { loginName: ENV.SCHEDULER_LOGIN_USERNAME },
      });

      if (!userDetails) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "OpportunityStatusScheduler",
            method: "handleExpiredOpportunities",
            messageData: "Scheduler user not found",
          }),
        });
        return;
      }

      const instantSuccessIds: number[] = [];
      const gracePeriodSuccessIds: number[] = [];

      const callOpportunityLost = async (opportunityId: number) => {
        await axios.post(
          `${ENV.URL_OPPORTUNITY_SERVICE}/opportunity/opportunity-lost`,
          {
            opportunityId,
            opportunityLost: {
              reasonForLossLid: null,
              remarks: "Auto-generated sales opportunity from expired opportunity",
              injectedBy: "SYSTEM",
            },
            statusLid: lostStatus.id,
          },
          {
            headers: {
              Authorization: `Bearer ${login.accessToken.accessToken}`,
              userid: userDetails.userId,
            },
          }
        );
      };

      for (const opportunity of instantLostOpportunities) {
        try {
          await callOpportunityLost(opportunity.opportunityId);
          instantSuccessIds.push(opportunity.opportunityId);
        } catch (error) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "OpportunityStatusScheduler",
              method: "handleExpiredOpportunities",
              messageData: {
                group: "instant-lost",
                opportunityId: opportunity.opportunityId,
                error,
              },
            }),
          });
        }
      }

      for (const opportunity of gracePeriodLostOpportunities) {
        try {
          await callOpportunityLost(opportunity.opportunityId);
          gracePeriodSuccessIds.push(opportunity.opportunityId);
        } catch (error) {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "failure",
              location: "OpportunityStatusScheduler",
              method: "handleExpiredOpportunities",
              messageData: {
                group: "grace-period-lost",
                opportunityId: opportunity.opportunityId,
                error,
              },
            }),
          });
        }
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityStatusScheduler",
          method: "handleExpiredOpportunities",
          messageData: `Processed expired opportunities. Instant-lost: ${instantSuccessIds.length}/${instantLostOpportunities.length} succeeded. Grace-period-lost: ${gracePeriodSuccessIds.length}/${gracePeriodLostOpportunities.length} succeeded.`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityStatusScheduler",
          method: "handleExpiredOpportunities",
          messageData: error,
        }),
      });

      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new BadRequestException(
        `An error occurred while processing expired opportunities. ${error.message}`
      );
    }
  }


  // Runs every day at 10:30 PM UTC (04:00 am IST)
  @Cron("30 22 * * *")
  async handleOpportunityActivitiesCloseToExpiry() {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    this.logger.log(
      "handleOpportunityActivitiesCloseToExpiry - cron job started"
    );
    if (ENV.HANDLE_EXPIRING_OPPORTUNITY_ACTIVITIES_CRON !== TRUE) {
      return;
    }
    const closedStatus = await this.lookUpRepository.findOne({
      where: { lookUpKey: OPPORTUNITY_ACTIVITY_STATUS_CLOSED },
    });
    if (!closedStatus) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityStatusScheduler",
          method: "handleOpportunityActivitiesCloseToExpiry",
          messageData:
            "Lookup value for OPPORTUNITY_ACTIVITY_STATUS_CLOSED not found",
        }),
      });
      return;
    }

    const now = new Date();

    const expiredActivities = await this.opportunityActivityMapRepository
      .createQueryBuilder()
      .where("original_due_date < :now", { now })
      .andWhere(
        new Brackets((qb) => {
          qb.where("status_lid IS NULL").orWhere(
            "status_lid != :lostStatusId",
            {
              lostStatusId: closedStatus.id,
            }
          );
        })
      )
      .getMany();

    for (const activity of expiredActivities) {
      if (activity.ownerId || activity.createdBy) {
        const url = `${ENV.CLIENT_SERVER_URL}opportunities/${activity.opportunityId}`;
        await this.sendNotification(
          NOTIFICATION_EVENT_TYPES.OPPORTUNITY_ACTIVITY_PLAN_DELAY,
          url,
          activity.ownerId ?? activity.createdBy,
          true,
          true
        );
      }
    }
  }

  // Runs every day at 11:30 PM UTC (05:00 am IST)
  @Cron("30 23 * * *")
  async handleOpportunitiesCloseToExpiry() {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    this.logger.log("handleOpportunitiesCloseToExpiry - cron job started");
    if (ENV.HANDLE_EXPIRING_OPPORTUNITY_CRON !== TRUE) {
      return;
    }
    // Default reminder window (7 days) - used for companies without an override
    // and as the safety bound for the DB query (widened so per-company reminder
    // days, e.g. a company configuring 15 days, can be applied afterward).
    const fallbackReminderDays = [7];
    const now = new Date();
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const queryWindowEnd = new Date();
    queryWindowEnd.setDate(now.getDate() + REMINDER_WINDOW_MAX_DAYS);

    const lostStatus = await this.lookUpRepository.findOne({
      where: { lookUpKey: OPPORTUNITY_STATUS_LOST },
    });

    if (!lostStatus) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityStatusScheduler",
          method: "handleOpportunitiesCloseToExpiry",
          messageData: "Lookup value for OPPORTUNITY_STATUS_LOST not found",
        }),
      });
      return;
    }

    const opportunities = await this.opportunityRepository
      .createQueryBuilder()
      .where("expiry_date BETWEEN :now AND :upcoming", {
        now,
        upcoming: queryWindowEnd,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where("status_lid IS NULL").orWhere(
            "status_lid != :lostStatusId",
            { lostStatusId: lostStatus.id }
          );
        })
      )
      .getMany();

    if (!opportunities.length) {
      return;
    }

    const companyIds = Array.from(
      new Set(
        opportunities
          .map((opportunity) => opportunity.companyId)
          .filter((companyId): companyId is number => !!companyId)
      )
    );
    const reminderDaysByCompany =
      await this.reminderConfigService.getReminderDaysByCompany(
        companyIds,
        "opportunityCloseToExpiryReminderDays",
        fallbackReminderDays
      );

    for (const opportunity of opportunities) {
      const daysDiff = Math.round(
        (opportunity.expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const allowedReminderDays =
        reminderDaysByCompany.get(opportunity.companyId) ?? fallbackReminderDays;
      if (!allowedReminderDays.includes(daysDiff)) {
        continue;
      }

      const url = `${ENV.CLIENT_SERVER_URL}opportunities/${opportunity.opportunityId}`;
      await this.sendNotification(
        NOTIFICATION_EVENT_TYPES.OPPORTUNITY_EXPIRATION,
        url,
        opportunity.ownerId ?? opportunity.createdBy,
        true,
        true
      );
    }
  }

  // Runs every day at 08:30 PM UTC (02:00 am IST)
  @Cron("15 00 * * *")
  async handlePoliciesCloseToExpiry() {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    this.logger.log("handlePoliciesCloseToExpiry - cron job started");

    if (ENV.HANDLE_RENEWAL_OPPORTUNITY_CRON !== TRUE) {
      return;
    }

    const traceId = this.traceIdService.traceId;

    const login = await this.login(
      `${ENV.SCHEDULER_LOGIN_USERNAME}`,
      `${ENV.SCHEDULER_LOGIN_PASSWORD}`
    );

    const userDetails = await this.userRepository.findOne({
      where: { loginName: ENV.SCHEDULER_LOGIN_USERNAME },
    });

    if (!userDetails) {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId,
          status: "failure",
          location: "OpportunityStatusScheduler",
          method: "handlePoliciesCloseToExpiry",
          messageData: `No user found with username: ${ENV.SCHEDULER_LOGIN_USERNAME}`,
        }),
      });
      return;
    }

    await handlePoliciesCloseToExpiry({
      traceId : traceId ?? "",
      logger: this.logger,
      lookUpRepository:                     this.lookUpRepository,
      policyRepository:                     this.policyRepository,
      endorsementRepository:                this.endorsementRepository,
      policyAssetEndorsementRepository:     this.policyAssetEndorsementRepository,
      policyTypeSegregationRepository:      this.policyTypeSegregationRepository,
      orgSbuRepository:                     this.orgSbuRepository,
      sbuRoPolicyTypeSuppressionRepository: this.sbuRoPolicyTypeSuppressionRepository,
      createRenewalOpportunity: async (opportunity) => {
        await axios.post(
          `${ENV.URL_OPPORTUNITY_SERVICE}/opportunity/renewal-opportunity`,
          { ...opportunity, optyType: "RO", injectedBy: "SYSTEM" },
          {
            headers: {
              Authorization: `Bearer ${login.accessToken.accessToken}`,
              userid: userDetails.userId,
              "x-bypass-timeout": "true",
            },
          }
        );
      },
    });
  }

  async sendNotification(
    eventType: string,
    url: string,
    notifyUserId: number,
    sendInAppNotification: boolean,
    sendEmailNotification: boolean
  ): Promise<void> {
    try {
      const userDetails = await this.userRepository.findOne({
        where: { userId: notifyUserId },
      });
      if (!userDetails) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "OpportunityStatusScheduler",
            method: "sendNotification",
            messageData: "user details not found",
          }),
        });
        return;
      }

      if (!userDetails.emailId) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "OpportunityStatusScheduler",
            method: "sendNotification",
            messageData: `Email details for the user with ID ${notifyUserId} not found`,
          }),
        });
      }

      const repo = await this.notificationEventParamRepository
        .createQueryBuilder("eventParam")
        .leftJoinAndSelect("eventParam.eventType", "event")
        .leftJoinAndSelect(
          "eventParam.parameterDefinition",
          "parameterDefinition"
        )
        .where("event.name = :name", { name: eventType })
        .select("parameterDefinition.key", "parameterKey")
        .getRawMany();

      const parameters = { [`${repo[0].parameterKey}`]: url };
      if (sendInAppNotification) {
        await axios.post(
          `${ENV.URL_NOTIFICATION_SERVICE}/notifications`,
          {
            eventType: eventType,
            emailId: [userDetails.emailId],
            channel: NOTIFICATION_IN_APP,
            parameters: parameters,
            userId: [notifyUserId],
          },
          {
            headers: { 'x-bypass-timeout': 'true' },
          }
        );
      }
      if (sendEmailNotification && userDetails.emailId) {
        await axios.post(
          `${ENV.URL_NOTIFICATION_SERVICE}/notifications`,
          {
            eventType: eventType,
            emailId: [userDetails.emailId],
            channel: NOTIFICATION_EMAIL,
            parameters: parameters,
            userId: [notifyUserId],
          },
          {
            headers: { 'x-bypass-timeout': 'true' },
          }
        );
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityStatusScheduler",
          method: "sendNotification",
          messageData: error,
        }),
      });
    }
  }

  async login(loginName: string, password: string) {
    try {
      const user = await this.findByLoginNameOrEmail(loginName);
      if (user && (await this.isPasswordMatch(password, user.password ?? ""))) {
        const accessToken = await this.getTokens(user as User);
        return { accessToken };
      }
      throw new ForbiddenException("Invalid credentials.");
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityStatusScheduler",
          method: "login",
          messageData: error,
        }),
      });
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Invalid credentials or user not found: ${error.message}`
      );
    }
  }

  // @Cron("* * * * *") // Runs every minute for testing
  // Runs every day at 09:30 PM UTC (03:00 am IST)
  @Cron("30 21 * * *")
  async generatePerformanceOutputForAllUsers(): Promise<void> {
    if (IS_DEMO_ENVIRONMENT) {
      return;
    }
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityStatusScheduler",
          method: "generatePerformanceOutputForAllUsers",
          messageData: `Business target performance output generation cron started`,
        }),
      });

      await axios.get(
        `${ENV.URL_POLICY_SERVICE}/policy/generate-performance-output`,
        {
          headers: { 'x-bypass-timeout': 'true' },
        }
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityStatusScheduler",
          method: "generatePerformanceOutputForAllUsers",
          messageData: `Failed to trigger performance output generation ${error}`,
        }),
      });
      console.error("Failed to trigger performance output generation", error);
    }
  }

  async findByLoginNameOrEmail(loginName: string) {
    try {
      const user = await this.userRepository.findOne({
        where: [{ emailId: loginName }, { loginName: loginName }],
        relations: ["userRoles", "userRoles.role"],
      });
      if (user) {
        // Ensure userRoles is defined and filter out undefined roles
        const roles = (user.userRoles || [])
          .filter((userRole) => userRole?.role) // Filter out undefined roles
          .map((userRole) => ({
            id: userRole.role.id,
            name: userRole.role.name,
          }));

        return {
          userId: user.userId,
          salutation: user.salutation,
          firstName: user.firstName,
          lastName: user.lastName,
          emailId: user.emailId,
          mobile: user.mobile,
          password: user.password,
          roles,
        };
      }
      throw new NotFoundException(
        "User not found with the provided login name or email."
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityStatusScheduler",
          method: "findByLoginNameOrEmail",
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        "An error occurred while fetching user details."
      );
    }
  }

  async isPasswordMatch(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async getTokens(
    userDetails: User
  ): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Validate user details
      if (!userDetails) {
        throw new ForbiddenException(
          "User details are required to generate tokens."
        );
      }

      if (!userDetails.userId) {
        throw new ForbiddenException("User ID is missing in user details.");
      }

      // Prepare the payload for the tokens
      const payload = {
        userDetails: {
          departmentId: userDetails.departmentId,
          emailId: userDetails.emailId,
          userId: userDetails.userId,
          iirmId: userDetails.iirmEmpId,
          roles: userDetails?.roles,
        },
      };

      // Generate access token
      const accessToken = await this.jwtService.signAsync(payload, {
        expiresIn: ENV.JWT_EXPIRATION, // Access token expiration time
      });

      // Generate refresh token
      const refreshToken = await this.jwtService.signAsync(payload, {
        expiresIn: ENV.JWT_REFRESH_EXPIRATION, // Refresh token expiration time
      });

      return { accessToken, refreshToken };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityStatusScheduler",
          method: "getTokens",
          messageData: error,
        }),
      });
      throw new ForbiddenException(
        error.message || "An error occurred while generating tokens."
      );
    }
  }
}
