import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import axios from "axios";
import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { Brackets, DataSource, EntityManager, In, Repository } from "typeorm";
import {
  ACTIVITY_KEY,
  ACTIVITY_SEARCH_STATUS_KEY,
  BUSINESS_TARGET_ENTITY_TYPE,
  COVERS_TABLE,
  DEFAULT_EMPLOYEE_PAGE,
  DEFAULT_EMPLOYEE_PAGE_LIMIT,
  DEFAULT_EXCEL_FILE_NAME,
  DEFAULT_RO_CRON_BATCH_SIZE,
  EMPLOYEE_ID_FOR_HIERARCHY_TREE_REGEX,
  ENTITY_NAME,
  LOOK_UP_DATA,
  MAPPED_DATA_DELETION,
  MEETING_NAME,
  MEETING_TYPE_KEY,
  MINED_POLICY,
  MONTHS_IN_YEAR_WITH_INDEX,
  MONTHS_WITH_QUARTERS,
  MONTHS_WITH_QUARTERS_ENUM,
  ONE_YEAR_IN_DAYS,
  ORGANISATION,
  OPPORTUNITY_ACTIVITY,
  CD_ACCOUNT_TOGGLE_NEW,
  OPPORTUNITY_STATUS_WON,
  OPPORTUNITY_TYPE,
  OWNER_TYPES,
  POLICY_PERFORMANCE_FIELDS,
  PREFERENCE_STATUS_EXCLUDED,
  PREFERENCE_STATUS_PREFERRED,
  RENEWAL_OPPORTUNITY,
  RO_POLICY_STATUS,
  RO_SERVICE_LEVEL,
  ROLE_KEY,
  SALES_OPPORTUNITY,
  SEARCH_STRING_FOR_OPPORTUNITIES_FETCH_REGEX,
  TABLE_NAMES,
  TOGGLE_TYPE,
  USER_EMAIL,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  errorMessages,
  infoMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  formatDate,
  mapOpportunityState,
  getActivityTableName,
  mapSearchParams,
  mapSortParams,
  getDurationDates,
  filterCoversByActivity,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { getAllUsersWithPrivilege } from "../../../../service-lib/src/lib/utils/privilege-users.util";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { handlePoliciesCloseToExpiry as handlePoliciesCloseToExpiryUtil } from "../../../../../../libs/service-lib/src/lib/utils/ro-creation.utils";
import { resolveInsurerBranchIds } from "../../../../service-lib/src/lib/utils/insurer-branch.util";

const QUARTER_MONTHS: Record<string, string[]> = {
  q1: ["april", "may", "june"],
  q2: ["july", "august", "september"],
  q3: ["october", "november", "december"],
  q4: ["january", "february", "march"],
};

const MONTH_TO_QUARTER: Record<string, string> = Object.fromEntries(
  Object.entries(QUARTER_MONTHS).flatMap(([q, months]) =>
    months.map((m) => [m, q])
  )
);

const PAYMENT_TOGGLE_CHEQUE_PREMIUM_ONLY = "PAYMENT_TOGGLE_CHEQUE_PREMIUM_ONLY";

import { EmployeeService } from "../../../../org-service/src/app/employee/employee.service";
import { LookUpService } from "../../../../org-service/src/app/look-up/look-up.service";
import {
  ACL_ACTIONS,
  ACL_CATEGORY,
  ACTIVITY_APPROVAL_YES,
  APPROVAL_TASK_NAMES,
  ATTRIBUTE_FIELD_MAP,
  COVER_TYPE,
  DATA_VALIDATION_TASK_NAME,
  DEFAULT_FINAL_NEGOTIATION_MEETING,
  DEFAULT_HAND_OVER_MEET,
  DEFAULT_KDM_MEETING,
  DEFAULT_RFP_DATA_COLLECTION,
  FILE_UPLOAD_TABLE_DELETE_FIELDS,
  ISG_ASSIGNMENT_TASK_NAME,
  ISG_PLANNING_TASK_NAME,
  MEETING_STATUS,
  NOTIFICATION_EMAIL,
  NOTIFICATION_EVENT_TYPES,
  NOTIFICATION_IN_APP,
  OPPORTUNITY_ACTIVITY_STATUS,
  ACTIVITY_STATUS,
  OPPORTUNITY_MAP_TABLE_DELETE_FIELDS,
  OPPORTUNITY_PARTICIPANT_INVITE,
  OPPORTUNITY_STATUS_WORK_IN_PROGRESS,
  OPTY_SUM_INSURED_NOTIFICATION_THRESHOLD,
  PREMIUM_CALCULATION,
  serviceNames,
  sortRealtionsMapping,
  TASK_CLOSED,
  TASK_STATUS_ACTIVE,
  TASK_STATUS_CLOSED,
  TASK_TYPE,
  OPPORTUNITY_STATUS_OPEN,
  OPPORTUNITY_STATUS_LOST,
  DEVIATION_TASK_DUE_DAYS,
  OPPORTUNITY_STATUS_ISG_PLANNING,
  OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS,
  OPPORTUNITY_STATUS_BD_PLANNING,
  LOOK_UP_FIELD,
  ACTIVITY_NAME,
  RENEWAL_PLANNING_ACTIVITY_NAME,
  UserBizdoneReportType,
  UserBizdoneReportStatus,
} from "../../../../service-lib/src/lib/constants";
import * as ReportExportJob from "../../../../service-lib/src/lib/utils/report-export-job.util";
import {
  downloadFromS3,
  generateExcelWithAppliedFilters,
  uploadToS3,
} from "../../../../service-lib/src/lib/utils/file-management.utils";
import {
  CompanyAddress,
  CompanyContactMap,
  FileUpload,
  LookUp,
  Meeting,
  MstrCoverSection,
  Opportunity,
  OpportunityActivityMap,
  OpportunityContactMap,
  OpportunityCoverMap,
  OpportunityDataValidation,
  OpportunityFinalNegotiation,
  OpportunityHandOverMeet,
  OpportunityKdmMeeting,
  OpportunityPlacementSlipGeneration,
  OpportunityPremiumCalculation,
  OpportunityPremiumCoverDetail,
  OpportunityRfpDetailsEntry,
  OpportunityRfpInsurerDetail,
  OpportunityRfpTpaDetail,
  OpportunityRiskLocations,
  PerformanceOutput,
  Policy,
  PolicyRiskLocationMap,
  PolicyTypeSegregation,
  PolicyAssetEndorsement,
  Endorsement,
  Task,
  User,
} from "../../../../service-lib/src/lib/entities";
import { ENV } from "../../../../service-lib/src/lib/environment";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { createErrorResponse } from "../../../../service-lib/src/lib/response.util";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import { NotificationUtils } from "../../../../service-lib/src/lib/utils/notification.utils";
import { OpportunityActivityDataDto } from ".././../../../service-lib/src/lib/dto/opportunity-activity.dto";
import { OpportunityActivityDocumentDto } from "./dto/opportunity-document.dto";
import { ParticipantsDto } from "./dto/opportunity-meeting.dto";
import { MeetingService } from "../meeting/meeting.service";
import { TaskService } from "../task/task.service";
import {
  CreateBrokingSlipDto,
  CreateBrokingSlipVersionDto,
} from "./dto/create-broking-slip-version.dto";
import {
  CreateDataValidationDto,
  UpdateDataValidationDto,
} from "./dto/create-data-validation.dto";
import {
  CreateFinalNegotiationActivityDto,
  CreateFinalNegotiationQcrVariationDto,
  CreateFinalNegotiationSharingDetailDto,
  CreateFinalNegotiationSlaDto,
  CreateQuoteTaxDetailsDto,
  UpdateFinalNegotiationActivityDto,
} from "./dto/create-final-negotiation-activity.dto";
import {
  CreateHandOverMeetDto,
  UpdateHandOverMeetDto,
} from "./dto/create-hand-over-meet.dto";
import { CreateOpportunityHeldCoverNoteDto } from "./dto/create-held-cover-note.dto";
import { PolicyReportService } from "../../../../service-lib/src/lib/utils/policy-report";
import {
  CreateKDMMeetingDto,
  KDMMeetingFormFieldsDto,
  RemarksMomSection,
  UpdateKDMMeetingDto,
} from "./dto/create-kdm-meeting.dto";
import {
  CreateMandateDto,
  UpdateMandateDto,
} from "./dto/create-mandate-details.dto";
import {
  CreateOpportunityLostDto,
  UpdateOpportunityLostDto,
} from "./dto/create-opportunity-lost.dto";
import { CreateOpportunityDto } from "./dto/create-opportunity.dto";
import { CreatePlacementSlipDto } from "./dto/create-placement-slip.dto";
import { CreatePolicyConfirmationDto } from "./dto/create-policy-confirmation.dto";
import {
  CreatePolicyDocketDto,
  SavePolicyDocketDto,
} from "./dto/create-policy-docket.dto";
import { CreatePolicyHardCopyDto } from "./dto/create-policy-hard-copy.dto";
import { CreatePremiumCalculationDto } from "./dto/create-premium-calculation.dto";
import {
  CreateQuoteComparisonReportDto,
  UpdateQuoteComparisonReportDto,
} from "./dto/create-quote-comparison-report.dto";
import {
  CreateQuoteDto,
  QuoteInput,
  TransformedQuote,
  UpdateQuoteDto,
} from "./dto/create-quote-entry.dto";
import {
  CreateOpportunityRfpCoverDetailDto,
  UpdateOpportunityRfpCoverDetailDto,
} from "./dto/create-rfp-cover-detail.dto";
import {
  CoverDetail,
  QuoteComparisonReportDto,
  TransformInput,
} from "./dto/generate-quote-comparison-report.dto";
import {
  BrokingSlipDataDto,
  BrokingSlipFormDataCommentsDto,
  BrokingSlipFormDataDto,
  SaveBrokingSlipFormDataDto,
  BrokingSlipVersionDetailsDto,
  BrokingSlipVersionDetailsDtoWithId,
  OptionalBrokingSlipFormDataCommentsDto,
} from "./dto/get-broking-slip-details-by-version.dto";
import { BrokingSlipVersionsListDto } from "./dto/get-broking-slip-version.dto";
import { OpportunityActivitiesDto } from "./dto/opportunity-activity.dto";
import { OpportunityClaimExperienceDto } from "./dto/opportunity-claim-experience.dto";
import { OpportunityContactMapDto } from "./dto/opportunity-contact-map.dto";
import { OpportunityDocumentDto } from "./dto/opportunity-document.dto";
import { OpportunityPreviousPlacementDetailsDto } from "./dto/opportunity-previous-placement-details.dto";
import {
  CreateOpportunityRfpDetailsEntryDto,
  CreateRfpClientContactDetailsDto,
  CreateRfpCreditSharingDto,
  CreateRfpInsurerDetailsDto,
  CreateRfpTpaDetailsDto,
  UpdateRfpDetailsEntryDto,
} from "./dto/opportunity-rfp-details-entry.dto";
import { OpportunityRiskLocationDto } from "./dto/opportunity-risk-locations.dto";
import { OpportunityDto } from "./dto/opportunity.dto";
import { UpdateHeldCoverNoteDto } from "./dto/update-held-cover-note.dto";
import { UpdateOpportunityDto } from "./dto/update-opportunity.dto";
import { UpdatePlacementSlipDto } from "./dto/update-placement-slip.dto";
import { UpdatePolicyConfirmationDto } from "./dto/update-policy-confirmation.dto";
import { UpdatePolicyHardCopyDto } from "./dto/update-policy-hard-copy.dto";
import { UpdatePremiumCalculationDto } from "./dto/update-premium-calculation.dto";
import { UpdateStageOwnerDto } from "./dto/update-stage-owner.dto";
import {
  OpportunityActivityDto,
  OpportunityRepository,
  PENDING_ACTIVITY_TABLES,
} from "./opportunity.repository";
import { getDateRange } from "../../../../../services/service-lib/src/lib/utils/get-data-range.utils";
import {
  getLookup,
  getLookups,
} from "../../../../../services/service-lib/src/lib/utils/opportunity.utils";
import { CrmRecipientResolverService } from "../../../../service-lib/src/lib/crm-recipient-resolver.service";

// Vertical and branch are multiselect filters: accept a single id or a list.
const idMatches = (selected: any, rowId: any): boolean => {
  if (!selected) return true;
  const ids = (Array.isArray(selected) ? selected : [selected]).map(Number);
  return ids.includes(Number(rowId));
};

// idMatches' counterpart for TypeORM `where` objects. A raw list there reaches
// Postgres as `branch_id = '{"2","3"}'` ("invalid input syntax for type
// integer"), so a multiselect value has to become In([...]) instead.
const eqOrIn = (value?: number | number[]) =>
  Array.isArray(value) ? In(value) : value || undefined;

// For the `IN (:...ids)` / `xxxIds: number[]` call sites: normalise a
// multiselect value to a list, or undefined when nothing is selected.
const toIdList = (value?: number | number[]): number[] | undefined => {
  if (value == null) return undefined;
  const ids = (Array.isArray(value) ? value : [value]).map(Number).filter(Number.isInteger);
  return ids.length ? ids : undefined;
};


const extractPolicyFinancialFields = (
  section?: Record<string, any>
): Record<string, any> => {
  if (!section || typeof section !== "object") {
    return {};
  }

  const fieldMappings: Array<[string, string]> = [
    ["basicPremium", "basicPremium"],
    ["basicBrokeragePercentage", "basicBrokeragePercentage"],
    ["basicBrokerageAmount", "basicBrokerageAmount"],
    ["tcBrokerageAmount", "tcBrokerageAmount"],
    ["srccAmount", "srccAmount"],
    ["srccPercentage", "srccPercentage"],
    ["srccBrokerageAmount", "srccBrokerageAmount"],
    ["terrorismBrokeragePercentage", "terrorismBrokeragePercentage"],
    ["terrorismAmount", "terrorism"],
    ["gstPercentage", "gstPercentage"],
    ["gstAmount", "gstAmount"],
    ["netPremium", "netPremium"],
    ["grossPremium", "grossPremium"],
    ["feeAmount", "fee"],
    ["feePercentage", "feePercentage"],
    ["otherAmount", "other"],
    ["otherPercentage", "otherPercentage"],
    ["adminCharges", "adminCharges"],
    ["adminChargesPercentage", "adminChargesPercentage"],
    ["cessAmount", "cessAmount"],
    ["cessPercentage", "cessPercentage"],
    ["premiumAtInception", "basicPremium"],
    ["sumInsured", "sumInsured"],
    ["totalBrokerageAmount", "totalBrokerageAmount"],
  ];

  const payload: Record<string, any> = {};

  fieldMappings.forEach(([target, source]) => {
    if (Object.prototype.hasOwnProperty.call(section, source)) {
      const value = section[source];
      if (value !== undefined) {
        payload[target] = value;
      }
    }
  });

  // if (
  //   payload.premiumAtInception === undefined &&
  //   Object.prototype.hasOwnProperty.call(section, "totalNetPremium")
  // ) {
  //   payload.premiumAtInception = section.totalNetPremium;
  // }

  // if (
  //   payload.premiumAtInception === undefined &&
  //   Object.prototype.hasOwnProperty.call(section, "totalPremium")
  // ) {
  //   payload.premiumAtInception = section.totalPremium;
  // }

  // if (
  //   payload.premiumAtInception === undefined &&
  //   Object.prototype.hasOwnProperty.call(section, "basicPremium")
  // ) {
  //   payload.premiumAtInception = section.basicPremium;
  // }

  return payload;
};

const ALL_OPPORTUNITY_ACTIVITY_DTO = {
  opportunity_data_validation: {
    SAVE_ACTIVITY: UpdateDataValidationDto,
    COMPLETE_ACTIVITY: CreateDataValidationDto,
  },
  opportunity_kdm_meeting: {
    SAVE_ACTIVITY: UpdateKDMMeetingDto,
    COMPLETE_ACTIVITY: CreateKDMMeetingDto,
  },
  opportunity_mandate_details_entry: {
    SAVE_ACTIVITY: UpdateMandateDto,
    COMPLETE_ACTIVITY: CreateMandateDto,
  },
  opportunity_rfp_cover_detail: {
    SAVE_ACTIVITY: UpdateOpportunityRfpCoverDetailDto,
    COMPLETE_ACTIVITY: CreateOpportunityRfpCoverDetailDto,
  },
  opportunity_rfp_details_entry: {
    SAVE_ACTIVITY: UpdateRfpDetailsEntryDto,
    SUBMIT_ACTIVITY: CreateOpportunityRfpDetailsEntryDto,
  },
  opportunity_broking_slip_version_details: {
    SAVE_ACTIVITY: CreateBrokingSlipVersionDto,
    COMPLETE_ACTIVITY: CreateBrokingSlipVersionDto,
  },
  opportunity_quote_entry: {
    SAVE_ACTIVITY: CreateQuoteDto,
    COMPLETE_ACTIVITY: CreateQuoteDto,
  },
  opportunity_quote_comparison_report: {
    SAVE_ACTIVITY: UpdateQuoteComparisonReportDto,
    COMPLETE_ACTIVITY: CreateQuoteComparisonReportDto,
  },
  opportunity_final_negotiation: {
    SAVE_ACTIVITY: UpdateFinalNegotiationActivityDto,
    COMPLETE_ACTIVITY: CreateFinalNegotiationActivityDto,
  },
  opportunity_placement_slip_generation: {
    SAVE_ACTIVITY: UpdatePlacementSlipDto,
    SUBMIT_ACTIVITY: CreatePlacementSlipDto,
  },
  opportunity_premium_calculation: {
    SAVE_ACTIVITY: UpdatePremiumCalculationDto,
    COMPLETE_ACTIVITY: CreatePremiumCalculationDto,
  },
  opportunity_held_cover_note: {
    SAVE_ACTIVITY: UpdateHeldCoverNoteDto,
    SUBMIT_ACTIVITY: CreateOpportunityHeldCoverNoteDto,
  },
  opportunity_policy_hard_copy: {
    SAVE_ACTIVITY: UpdatePolicyHardCopyDto,
    COMPLETE_ACTIVITY: CreatePolicyHardCopyDto,
  },
  opportunity_policy_confirmation: {
    SAVE_ACTIVITY: UpdatePolicyConfirmationDto,
    COMPLETE_ACTIVITY: CreatePolicyConfirmationDto,
  },
  opportunity_policy_docket: {
    SAVE_ACTIVITY: SavePolicyDocketDto,
    SUBMIT_ACTIVITY: CreatePolicyDocketDto,
  },
  opportunity_hand_over_meet: {
    SAVE_ACTIVITY: UpdateHandOverMeetDto,
    SUBMIT_ACTIVITY: CreateHandOverMeetDto,
  },
};

const getMessage = (
  activityStatusKey: "SAVE_ACTIVITY" | "COMPLETE_ACTIVITY" | "SUBMIT_ACTIVITY"
) => {
  switch (activityStatusKey) {
    case "SAVE_ACTIVITY":
      return "Activity has been saved successfully.";
    case "COMPLETE_ACTIVITY":
      return "Activity has been completed successfully.";
    case "SUBMIT_ACTIVITY":
      return "Activity has been submitted for approval successfully.";
    default:
      return "Activity has been processed successfully.";
  }
};

@Injectable()
export class OpportunityService {
  private readonly logger: ReturnType<typeof createLogger>;
  constructor(
    private readonly dataSource: DataSource,
    private readonly opportunityRepository: OpportunityRepository,
    private readonly LookUpService: LookUpService,
    private readonly lookUpValidation: LookUpValidationService,
    private readonly taskService: TaskService,
    private readonly employeeService: EmployeeService,
    private readonly meetingService: MeetingService,
    private readonly notificationUtils: NotificationUtils,
    private readonly scopeService: ScopeService,
    private readonly crmRecipientResolver: CrmRecipientResolverService,

    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(OpportunityActivityMap)
    private readonly opportunityActivityMapRepository: Repository<OpportunityActivityMap>,
    @InjectRepository(Opportunity)
    private readonly opportunityRepo: Repository<Opportunity>,
    @InjectRepository(Meeting)
    private readonly meetingRepo: Repository<Meeting>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Policy)
    private readonly policyRepository: Repository<Policy>,
    @InjectRepository(OpportunityFinalNegotiation)
    private readonly opportunityFinalNegotiationRepo: Repository<OpportunityFinalNegotiation>,
    @InjectRepository(OpportunityDataValidation)
    private readonly dataValidationRepo: Repository<OpportunityDataValidation>,
    @InjectRepository(OpportunityKdmMeeting)
    private readonly kdmMeetingRepo: Repository<OpportunityKdmMeeting>, //  private readonly quoteRepository: Repository<OpportunityQuoteEntry>
    @InjectRepository(OpportunityHandOverMeet)
    private readonly opportunityHandOverMeetRepo: Repository<OpportunityHandOverMeet>,
    @InjectRepository(OpportunityRiskLocations)
    private readonly opportunityRiskLocationsRepository: Repository<OpportunityRiskLocations>,
    @InjectRepository(OpportunityContactMap)
    private readonly opportunityContactMapRepository: Repository<OpportunityContactMap>,
    @InjectRepository(CompanyContactMap)
    private readonly companyContactMapRepository: Repository<CompanyContactMap>,
    @InjectRepository(CompanyAddress)
    private readonly companyLocationsMapRepository: Repository<CompanyAddress>,
    @InjectRepository(PolicyRiskLocationMap)
    private readonly policyRiskLocationMapRepository: Repository<PolicyRiskLocationMap>,
    @InjectRepository(OpportunityPlacementSlipGeneration)
    private readonly placementRepo: Repository<OpportunityPlacementSlipGeneration>,
    @InjectRepository(PerformanceOutput)
    private readonly performanceOutputRepository: Repository<PerformanceOutput>,
    @InjectRepository(PolicyTypeSegregation)
    private readonly policyTypeSegregationRepository: Repository<PolicyTypeSegregation>,
    @InjectRepository(MstrCoverSection)
    private readonly mstrCoverSectionRepository: Repository<MstrCoverSection>,
    @InjectRepository(Endorsement)
    private readonly endorsementRepository: Repository<Endorsement>,
    @InjectRepository(PolicyAssetEndorsement)
    private readonly policyAssetEndorsementRepository: Repository<PolicyAssetEndorsement>,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.OPPORTUNITY_SERVICE
    );
  }

  private logInfo(
    method: string,
    messageData = "method invoked",
    payload = {},
    status: "success" | "failure" = "success"
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status,
        location: "OpportunityService",
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
        status: "failure",
        location: "OpportunityService",
        method,
        payload,
        messageData: error,
      }),
    });
  }

  // Retrieves a list of opportunities by delegating the repository.
  private resolvePendingActivityRange({
    fromDate,
    toDate,
    period,
    timeFilter,
    financialYear,
  }: {
    fromDate?: Date;
    toDate?: Date;
    period?: string;
    timeFilter?: string;
    financialYear?: number;
  }): { from?: Date; to?: Date } | undefined {
    const normalizedTimeFilter =
      typeof timeFilter === "string" ? timeFilter.trim() : undefined;
    const normalizedFinancialYear =
      typeof financialYear === "number" && !Number.isNaN(financialYear)
        ? financialYear
        : undefined;
    if (fromDate || toDate) {
      const from = fromDate ? new Date(fromDate) : undefined;
      const to = toDate ? new Date(toDate) : undefined;

      if (from) {
        from.setHours(0, 0, 0, 0);
      }

      if (to) {
        to.setHours(23, 59, 59, 999);
      }

      return this.normalizeDateRange(from, to);
    }

    if (normalizedTimeFilter) {
      const range = getDateRange(normalizedTimeFilter, normalizedFinancialYear);

      if (range.start || range.end) {
        const from = range.start ? new Date(range.start) : undefined;
        const to = range.end ? new Date(range.end) : undefined;

        if (from) {
          from.setHours(0, 0, 0, 0);
        }

        if (to) {
          to.setHours(23, 59, 59, 999);
        }

        return this.normalizeDateRange(from, to);
      }
    }

    if (normalizedFinancialYear !== undefined && !normalizedTimeFilter) {
      const range = getDateRange(undefined, normalizedFinancialYear);

      if (range.start || range.end) {
        const from = range.start ? new Date(range.start) : undefined;
        const to = range.end ? new Date(range.end) : undefined;

        if (from) {
          from.setHours(0, 0, 0, 0);
        }

        if (to) {
          to.setHours(23, 59, 59, 999);
        }

        return this.normalizeDateRange(from, to);
      }
    }

    if (!period) {
      return undefined;
    }

    try {
      const { startDate, endDate } = getDurationDates(period);

      const from = startDate ? new Date(startDate) : undefined;
      const to = endDate ? new Date(endDate) : undefined;

      if (from) {
        from.setHours(0, 0, 0, 0);
      }

      if (to) {
        to.setHours(23, 59, 59, 999);
      }

      return this.normalizeDateRange(from, to);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }

      throw error;
    }
  }

  private normalizeDateRange(
    from?: Date,
    to?: Date
  ): { from?: Date; to?: Date } | undefined {
    if (!from && !to) {
      return undefined;
    }

    if (from && to && from.getTime() > to.getTime()) {
      return { from: to, to: from };
    }

    return { from, to };
  }

  private decodeSearchParamValue(
    value: string | number | Date | Array<string | number | Date>
  ): string | number | Date | Array<string | number | Date> {
    const decodeString = (input: string): string => {
      const normalised = input.replace(/\+/g, " ");

      try {
        return decodeURIComponent(normalised);
      } catch {
        return normalised;
      }
    };

    if (Array.isArray(value)) {
      return value.map((item) =>
        typeof item === "string" ? decodeString(item) : item
      );
    }

    return typeof value === "string" ? decodeString(value) : value;
  }

  /**
   * Builds the listing "Opty. Activity" filter as a single OR bracket so it can
   * mix real activities with the synthetic BD/ISG Planning stages.
   *
   * - Real activity names match opportunities whose CURRENT (work-in-progress)
   *   activity has that name (same as the legacy activityName + WIP-status filter).
   * - A planning label matches opportunities that DISPLAY as that planning stage:
   *   the opportunity's status is the planning state AND it has no in-progress /
   *   submitted / rejected real activity (role-scoped the same way the display is).
   *   This mirrors the status fallback in getWorkInProgressActivityNameByOpportunityId.
   *
   * "Renewal Planning" (RO label) and "BD Planning" (SO label) share the same
   * underlying BD-planning status. Returns undefined when nothing matchable was passed.
   */
  private async buildActivityDisplayCondition(
    realActivityNames: string[],
    planningLabels: string[],
    visibleActivityRoleKeys?: string[] | null
  ): Promise<Brackets | undefined> {
    const hasReal = realActivityNames.length > 0;
    const lowerPlanning = new Set(planningLabels.map((l) => l.toLowerCase()));
    const bdPlanningSelected =
      lowerPlanning.has(ACTIVITY_NAME.BD_PLANNING.toLowerCase()) ||
      lowerPlanning.has(RENEWAL_PLANNING_ACTIVITY_NAME.toLowerCase());
    const isgPlanningSelected = lowerPlanning.has(
      ACTIVITY_NAME.ISG_PLANNING.toLowerCase()
    );
    if (!hasReal && !bdPlanningSelected && !isgPlanningSelected) {
      return undefined;
    }

    const statusLookups = await this.lookUpRepository.find({
      where: {
        lookUpKey: In([
          OPPORTUNITY_STATUS_BD_PLANNING,
          OPPORTUNITY_STATUS_ISG_PLANNING,
          OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS,
          OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED,
          OPPORTUNITY_ACTIVITY_STATUS.REJECTED,
        ]),
      },
    });
    const idByKey = (key: string) =>
      statusLookups.find((l) => l.lookUpKey === key)?.id;
    const bdPlanningStatusId = idByKey(OPPORTUNITY_STATUS_BD_PLANNING);
    const isgPlanningStatusId = idByKey(OPPORTUNITY_STATUS_ISG_PLANNING);
    const wipStatusId = idByKey(OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS);
    const activeActivityStatusIds = [
      OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS,
      OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED,
      OPPORTUNITY_ACTIVITY_STATUS.REJECTED,
    ]
      .map(idByKey)
      .filter((id): id is number => typeof id === "number");

    const roleKeys =
      visibleActivityRoleKeys && visibleActivityRoleKeys.length > 0
        ? visibleActivityRoleKeys
        : undefined;

    const planningClause = (
      statusId: number,
      suffix: string
    ): { sql: string; params: Record<string, any> } => {
      // "Reached ISG/BD Planning" = status is the planning status AND no activity
      // has started yet. The active-activity exclusion is intentionally NOT
      // role-scoped, to mirror the dashboard "Follow up by SO Activity" planning
      // count (getPendingActivitiesSummary excludes an opportunity if ANY role's
      // activity is WIP/Submitted/Rejected). Keeping this any-role makes the
      // drilldown list return the exact same opportunities the count reports.
      return {
        sql: `(main.statusLid = :afPlanningStatus_${suffix} AND NOT EXISTS (SELECT 1 FROM opportunity_activity_map oam_pl_${suffix} WHERE oam_pl_${suffix}.opportunity_id = main.opportunityId AND oam_pl_${suffix}.status_lid IN (:...afActiveStatusIds)))`,
        params: {
          [`afPlanningStatus_${suffix}`]: statusId,
          afActiveStatusIds: activeActivityStatusIds,
        },
      };
    };

    const clauses: { sql: string; params: Record<string, any> }[] = [];
    if (hasReal && wipStatusId) {
      clauses.push({
        sql: `main.opportunityId IN (SELECT oam_af.opportunity_id FROM opportunity_activity_map oam_af WHERE oam_af.activity_name IN (:...afRealNames) AND oam_af.status_lid = :afWipStatusId)`,
        params: { afRealNames: realActivityNames, afWipStatusId: wipStatusId },
      });
    }
    if (bdPlanningSelected && bdPlanningStatusId && activeActivityStatusIds.length) {
      clauses.push(planningClause(bdPlanningStatusId, "bd"));
    }
    if (isgPlanningSelected && isgPlanningStatusId && activeActivityStatusIds.length) {
      clauses.push(planningClause(isgPlanningStatusId, "isg"));
    }

    if (clauses.length === 0) {
      return undefined;
    }

    return new Brackets((qb) => {
      clauses.forEach((clause, index) => {
        if (index === 0) {
          qb.where(clause.sql, clause.params);
        } else {
          qb.orWhere(clause.sql, clause.params);
        }
      });
    });
  }

  async getAllOpportunityList(
    type: "SO" | "RO" | "ALL",
    // Omit both to fetch every matching row unpaginated (full exports) —
    // every listing call site passes concrete numbers, so this is additive.
    page: number | undefined,
    limit: number | undefined,
    search: string,
    sort: string,
    searchBy: string,
    loggedInUserId: number,
    field: string,
    fromDate: Date,
    toDate: Date,
    period: string,
    timeFilter?: string,
    financialYear?: number,
    ownerId?: number,
    viewBy?: "manager" | "team",
    funnel?: "true" | "false",
    isPendingActivity?: boolean,
    insurerId?: number,
    optyType?: "SO" | "RO",
    insurerBranchId?: number,
    branchViewBy?: string,
    companyGrain?: boolean,
    // See OpportunityRepository.getAllOpportunities — skips the KPI
    // aggregate block for callers (exports) that only read `data`.
    skipKpi = false,
  ): Promise<{
    data: OpportunityDto[];
    count: number;
    opportunityLeads: number;
    opportunityProspects: number;
    opportunityQcr: number;
    opportunityClients: number;
  }> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "OpportunityService",
        method: "getAllOpportunityList",
        payload: { page, limit, search, isPendingActivity },
        messageData: "method invoked",
      }),
    });
    try {
      // Resolve the logged-in user's BD/ISG activity visibility before
      // loggedInUserId may be reassigned to a searched owner below. Single-role
      // users get a role-aware display activity (and activity-name filter); users
      // who can view both (or neither) are unrestricted.
      const visibleActivityRoleKeys =
        await this.resolveVisibleActivityRoleKeys(loggedInUserId);
      // Capture the real viewer before loggedInUserId is reassigned to a
      // searched owner below. The BD-only stage gate uses this to keep showing
      // a BD user the opties they own even after handover to ISG.
      const actualLoggedInUserId = loggedInUserId;

      let effectiveField = field;
      let effectiveFromDate = fromDate;
      let effectiveToDate = toDate;
      let effectivePeriod = period;
      let effectiveTimeFilter = timeFilter;
      let effectiveFinancialYear = financialYear;
      let pendingDateRange: { from?: Date; to?: Date } | undefined;
      let pendingActivityNames: string[] | undefined;
      let pendingStageNames: string[] | undefined;
      let pendingActivityAliasMap: Map<string, Set<string>> | undefined;
      let pendingStageAliasMap: Map<string, Set<string>> | undefined;
      const shouldLogFinalQuery = Boolean(isPendingActivity);
      let activityTable;
      if (typeof effectiveTimeFilter === "string") {
        const trimmed = effectiveTimeFilter.trim();
        effectiveTimeFilter = trimmed.length > 0 ? trimmed : undefined;
      }

      if (
        effectiveFinancialYear !== undefined &&
        Number.isNaN(effectiveFinancialYear)
      ) {
        effectiveFinancialYear = undefined;
      }
      if (search) {
        const ownedByMatch = search.match(EMPLOYEE_ID_FOR_HIERARCHY_TREE_REGEX);
        const ownedById = ownedByMatch ? ownedByMatch[1] : null;
        const cleanedString = search.replace(
          SEARCH_STRING_FOR_OPPORTUNITIES_FETCH_REGEX,
          ""
        );
        search = cleanedString.trim();
        if (ownedById) {
          loggedInUserId = parseInt(ownedById);
        }
      }
      if (search && search.includes("state:")) {
        search = mapOpportunityState(search);
      }
      if (funnel && search && search.includes("activityName:")) {
        const { search: updatedSearch, table: tableName } =
          getActivityTableName(search, type);
        search = updatedSearch;
        activityTable = tableName;
      }
      let searchParams = mapSearchParams(search);
      searchParams = searchParams.filter((p) => p.searchBy !== "insurerId");
      searchParams = searchParams.filter((p) => p.searchBy !== "userId");
      // optyType is a dedicated query param (combined Manage Quotes narrowing), not
      // a searchable column — drop it if it arrives via search to avoid resolving a
      // non-existent main.optytype column.
      searchParams = searchParams.filter((p) => p.searchBy !== "optyType");
      searchParams = searchParams.filter(
        (p) =>
          !(
            p.searchBy === "owner.firstName" &&
            (p.searchValue === "team" ||
              p.searchValue === "manager" ||
              (Array.isArray(p.searchValue) &&
                (p.searchValue.includes("team") ||
                  p.searchValue.includes("manager"))))
          )
      );
      searchParams = searchParams.map((param) => ({
        ...param,
        searchValue: this.decodeSearchParamValue(param.searchValue),
      }));
      const normaliseSearchValues = (
        value: string | number | Date | Array<string | number | Date>
      ): Array<string | number | Date> =>
        Array.isArray(value) ? value : [value];

      const expandPendingFilterValues = (
        values: string[],
        aliasMap?: Map<string, Set<string>>
      ): string[] => {
        if (!values.length) {
          return [];
        }

        const expanded = new Set<string>();

        values.forEach((rawValue) => {
          const normalized = rawValue.replace(/\s+/g, " ").trim();

          if (!normalized) {
            return;
          }

          expanded.add(normalized);

          if (aliasMap) {
            const aliasSet = aliasMap.get(normalized.toLowerCase());
            aliasSet?.forEach((alias) => expanded.add(alias));
          }
        });

        return Array.from(expanded);
      };

      // Opty. Activity filter: when planning stages are selected we take over the
      // activity filtering for the standard listing (non-pending, non-funnel) and
      // build a unified OR bracket so real activities and synthetic BD/ISG Planning
      // can be combined. Real-activity-only selections keep the legacy path below.
      let activityDisplayCondition: Brackets | undefined;
      if (!isPendingActivity && !funnel) {
        const planningLabelSet = new Set(
          [
            ACTIVITY_NAME.BD_PLANNING,
            RENEWAL_PLANNING_ACTIVITY_NAME,
            ACTIVITY_NAME.ISG_PLANNING,
          ].map((l) => l.toLowerCase())
        );
        const activityNameValues = searchParams
          .filter((p) => p.searchBy === ATTRIBUTE_FIELD_MAP.activityName)
          .flatMap((p) => normaliseSearchValues(p.searchValue))
          .filter((v): v is string => typeof v === "string")
          .map((v) => v.trim())
          .filter((v) => v.length > 0);
        const planningLabels = activityNameValues.filter((v) =>
          planningLabelSet.has(v.toLowerCase())
        );
        if (planningLabels.length > 0) {
          const realActivityNames = activityNameValues.filter(
            (v) => !planningLabelSet.has(v.toLowerCase())
          );
          // Strip activityName params so the legacy match + WIP-status injection
          // do not also apply; this condition fully replaces them.
          searchParams = searchParams.filter(
            (p) => p.searchBy !== ATTRIBUTE_FIELD_MAP.activityName
          );
          activityDisplayCondition = await this.buildActivityDisplayCondition(
            realActivityNames,
            planningLabels,
            visibleActivityRoleKeys
          );
        }
      }

      if (searchParams.length > 0) {
        const hasRefActivityId = searchParams.some(
          (param) =>
            param.searchBy === ATTRIBUTE_FIELD_MAP.activityName ||
            param.searchBy === ATTRIBUTE_FIELD_MAP.stageName
        );
        if (isPendingActivity) {
          const activityNameParams = searchParams.filter(
            (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.activityName
          );
          const stageNameParams = searchParams.filter(
            (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.stageName
          );

          if (activityNameParams.length > 0) {
            if (
              isPendingActivity &&
              type === "RO" &&
              !pendingActivityAliasMap
            ) {
              pendingActivityAliasMap =
                await this.opportunityRepository.getPendingActivityAliasMap();
            }
            const normalizedActivities = activityNameParams
              .flatMap((param) => normaliseSearchValues(param.searchValue))
              .filter((value): value is string => typeof value === "string")
              .map((value) => value.trim())
              .filter((value) => value.length > 0);

            if (normalizedActivities.length > 0) {
              const expandedActivities = expandPendingFilterValues(
                normalizedActivities,
                isPendingActivity && type === "RO"
                  ? pendingActivityAliasMap
                  : undefined
              );

              if (expandedActivities.length > 0) {
                pendingActivityNames = expandedActivities;
              }
            }
          }

          if (stageNameParams.length > 0) {
            if (isPendingActivity && type === "RO" && !pendingStageAliasMap) {
              pendingStageAliasMap =
                await this.opportunityRepository.getStageNameAliasMap();
            }
            const normalizedStages = stageNameParams
              .flatMap((param) => normaliseSearchValues(param.searchValue))
              .filter((value): value is string => typeof value === "string")
              .map((value) => value.trim())
              .filter((value) => value.length > 0);

            if (normalizedStages.length > 0) {
              const expandedStages = expandPendingFilterValues(
                normalizedStages,
                isPendingActivity && type === "RO"
                  ? pendingStageAliasMap
                  : undefined
              );

              if (expandedStages.length > 0) {
                pendingStageNames = expandedStages;
              }
            }
          }
        }
        if (hasRefActivityId) {
          if (!isPendingActivity) {
            const opportunityActivityStatus =
              await this.lookUpRepository.findOne({
                where: {
                  lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS,
                },
              });
            if (!opportunityActivityStatus) {
              throw new NotFoundException(
                `Opportunity Working in progress status not found`
              );
            }
            searchParams.push({
              searchBy: ACTIVITY_SEARCH_STATUS_KEY,
              searchValue: [opportunityActivityStatus.id],
            });
          }
        }

        if (isPendingActivity) {
          searchParams = searchParams.filter(
            (param) =>
              param.searchBy !== ATTRIBUTE_FIELD_MAP.activityName &&
              param.searchBy !== ATTRIBUTE_FIELD_MAP.stageName
          );
        }

        const organisationIdParam = searchParams.find(
          (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.organisationId
        );

        const organisationId = organisationIdParam?.searchValue ?? null;

        const orgId = organisationId?.[0] ?? null;

        const organisationIdNew =
          await this.opportunityRepository.getEntityTableMapIds(
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
            { id: orgId }
          );

        const lookupCriteria =
          organisationIdNew.length === 0
            ? { parentOrganisationId: orgId }
            : { id: orgId };

        const countryId = await this.opportunityRepository.getEntityTableMapIds(
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
          lookupCriteria
        );
        const countryIdIndex = searchParams.findIndex(
          (param) => param.searchBy === ATTRIBUTE_FIELD_MAP.organisationId
        );

        if (countryIdIndex !== -1) {
          searchParams[countryIdIndex].searchValue = countryId;
        }
      }
      const userId = ownerId ? ownerId : loggedInUserId;
      searchParams.push({
        searchBy: "owner.userId",
        searchValue: [userId],
      });
      // owner.userId above is pushed on EVERY request (defaulting to the
      // viewer), so validateOpportunityScope can't infer an explicit owner
      // pick from its presence the way it does for policy. This marker rides
      // along only when the ownerId query param was actually sent (owner
      // dropdown / Enhanced owner card) — the scope layer strips it and keeps
      // the owner filter applied even when the selected user holds a
      // leadership role, instead of leadership-bypassing to org-wide.
      if (ownerId) {
        searchParams.push({
          searchBy: "explicitOwner",
          searchValue: "true",
        });
      }
      if (viewBy === OWNER_TYPES.TEAM || !viewBy) {
        searchParams.push({
          searchBy: "viewByTeam",
          searchValue: OWNER_TYPES.TEAM,
        });
      } else if (viewBy === OWNER_TYPES.MANAGER) {
        searchParams.push({
          searchBy: "viewByTeam",
          searchValue: OWNER_TYPES.MANAGER,
        });
      }
      const sortParams = mapSortParams(
        sort,
        ENTITY_NAME.OPPORTUNITY.toUpperCase()
      );
      // "assignedTo" resolves to owner.firstName only (ENTITY_SORT_FIELDS),
      // silently ignoring last name -- two owners sharing a first name would
      // tie even though the grid displays the full name. Append a same-
      // direction tiebreak on the already-selected owner.lastName column
      // (see getAllOpportunities' baseOpportunitySelect) -- fetchEntityList's
      // sort loop applies every array entry as a successive ORDER BY, so this
      // becomes "ORDER BY owner.firstName, owner.lastName" with no other
      // change. Does not address the separate, harder issue where the
      // displayed assignee is isg/bdAssignedUser instead of owner for
      // ISG/BD-stage rows -- that's why the column stays disableSort:true on
      // the frontend regardless of this fix.
      if (sortParams[0]?.field === "owner.firstName") {
        sortParams.push({ field: "owner.lastName", order: sortParams[0].order });
      }
      // Combined Manage Quotes mode (type=ALL) defaults to Expiry Date ascending
      // across BOTH SO and RO so the interleaved list is server-sorted and stable
      // across pagination. User column sorting still overrides it. Spec §5.2.
      const effectiveSortParams =
        type === "ALL" && sortParams.length === 0
          ? [{ field: "expiryDate", order: "ASC" as const }]
          : sortParams;
      let opportunities;
      let customWhereCondition: Brackets | undefined;
      let pendingCondition: Brackets | undefined;
      let resolvedOptyType: LookUp | null = null;

      // Role-based stage gate for single-role viewers: ISG-only users see only
      // ISG-reached opportunities; BD-only users stop seeing opportunities once
      // they are handed over to ISG. Built in the repository so the main listing
      // and company-details listing share one definition.
      // BD-only viewers keep post-handover visibility of opportunities owned by
      // themselves OR anyone in their reporting tree, so a manager who approved
      // the BD activities keeps tracking the team's deals after ISG handover.
      const gateOwnerUserIds = await this.resolveBdGateOwnerIds(
        actualLoggedInUserId,
        visibleActivityRoleKeys
      );
      const isgPlanningCondition =
        await this.opportunityRepository.buildActivityRoleStageGate(
          visibleActivityRoleKeys,
          type === "ALL",
          gateOwnerUserIds
        );

      // Build insurer filter condition first
      let insurerCondition: Brackets | undefined;
      if (insurerId) {
        if (type === "RO") {
          // RO insurer/branch filter derives from the LINKED policy (refPolicyId):
          // keep ROs whose referenced policy has a LEAD insurer mapping matching
          // the selected insurer (and branch / branch+sub-branches when chosen).
          // refPolicyId IS NULL never matches, so ROs without a linked policy are
          // excluded once an insurer is selected.
          const leadInsurerType = await this.lookUpRepository.findOne({
            where: { lookUpKey: "INSURER_PARTICIPATION_TYPE_LEAD" },
          });
          const leadInsurerLid = leadInsurerType?.id;
          const roBranchIds = await resolveInsurerBranchIds(
            this.dataSource,
            insurerBranchId,
            branchViewBy
          );
          const hasBranchFilter = roBranchIds && roBranchIds.length > 0;
          insurerCondition = new Brackets((qb) => {
            qb.where(
              `main.refPolicyId IN (
                SELECT pim_ro.policy_id
                FROM policy_insurer_map pim_ro
                WHERE pim_ro.insurer_id = :roInsurerId
                  ${leadInsurerLid ? "AND pim_ro.insurer_participation_type_lid = :roLeadInsurerLid" : ""}
                  ${hasBranchFilter ? "AND pim_ro.insurer_branch_id IN (:...roBranchIds)" : ""}
              )`,
              {
                roInsurerId: insurerId,
                ...(leadInsurerLid ? { roLeadInsurerLid: leadInsurerLid } : {}),
                ...(hasBranchFilter ? { roBranchIds } : {}),
              }
            );
          });
        } else {
          insurerCondition = new Brackets((qb) => {
            qb.where(
              `main.opportunityId IN (
                SELECT oam_svc.opportunity_id
                FROM opportunity_activity_map oam_svc
                INNER JOIN opportunity_placement_slip_generation opsg_svc
                  ON opsg_svc.opportunity_activity_id = oam_svc.id
                INNER JOIN opportunity_placement_slip_insurer_map opsim_svc
                  ON opsim_svc.placement_slip_id = opsg_svc.id
                WHERE opsim_svc.insurer_id = :listingOpptyInsurerId
              )`,
              { listingOpptyInsurerId: insurerId }
            );
          });
        }
      }

      // Combined mode (type === "ALL") returns both SO and RO in one query, so
      // it carries no opportunityTypeLid constraint unless the optional optyType
      // narrows it (the hidden Opty. Type toggle). SO/RO stay constrained as before.
      const effectiveType: "SO" | "RO" | undefined =
        type === "ALL" ? optyType : type;

      if (effectiveType === "SO") {
        resolvedOptyType = await this.lookUpRepository.findOne({
          where: {
            lookUpKey: OPPORTUNITY_TYPE.SO,
          },
        });
      } else if (effectiveType === "RO") {
        resolvedOptyType = await this.lookUpRepository.findOne({
          where: {
            lookUpKey: OPPORTUNITY_TYPE.RO,
          },
        });
      }

      if (effectiveType && !resolvedOptyType) {
        throw new NotFoundException(
          `Opportunity type with value ${effectiveType} not found`
        );
      }
      const whereCondition: Record<string, any> = {};
      if (resolvedOptyType) {
        whereCondition.opportunityTypeLid = resolvedOptyType.id ?? undefined;
      }
      const relations = [
        "company",
        "policyType",
        "policyStatus",
        "status",
        "opportunityType",
        "company.priority",
        "company.industrySegment",
        "owner",
        "owner.branch",
        "isg",
        "refPolicy",
        "opportunityActivityMap",
        "opportunityContactMap",
        "opportunityContactMap.contact",
      ];

      if (isPendingActivity) {
        pendingDateRange = this.resolvePendingActivityRange({
          fromDate,
          toDate,
          period,
          timeFilter: effectiveTimeFilter,
          financialYear: effectiveFinancialYear,
        });

        if (shouldLogFinalQuery) {
          console.log(
            "Pending activity normalized date range:",
            pendingDateRange
          );
        }

        effectiveField = undefined;
        effectiveFromDate = undefined;
        effectiveToDate = undefined;
        effectivePeriod = undefined;
        effectiveTimeFilter = undefined;
        effectiveFinancialYear = undefined;

        const pendingTables = Array.from(PENDING_ACTIVITY_TABLES);

        const pendingSubQuery =
          this.opportunityRepository.createPendingActivityFilterSubquery({
            tables: pendingTables,
            activityNames: pendingActivityNames,
            stageNames: pendingStageNames,
            dateRange: pendingDateRange,
          });

        pendingCondition = new Brackets((qb) => {
          qb.where(`main.opportunityId IN (${pendingSubQuery.getQuery()})`);
          qb.setParameters(pendingSubQuery.getParameters());
        });
      }

      const mergeBrackets = (
        ...conditions: (Brackets | undefined)[]
      ): Brackets | undefined => {
        const defined = conditions.filter(
          (condition): condition is Brackets => condition !== undefined
        );

        if (!defined.length) {
          return undefined;
        }

        if (defined.length === 1) {
          return defined[0];
        }

        return new Brackets((qb) => {
          qb.where(defined[0]);
          for (let index = 1; index < defined.length; index += 1) {
            qb.andWhere(defined[index]);
          }
        });
      };
      const pendingPresentationFilters = isPendingActivity
        ? {
            isPendingActivity: true,
            activityNames: pendingActivityNames,
            stageNames: pendingStageNames,
            dateRange: pendingDateRange,
            tables: Array.from(PENDING_ACTIVITY_TABLES),
          }
        : undefined;

      let performanceCondition: Brackets | undefined;
      const enabledLookup = await this.lookUpRepository.findOne({
        where: { lookUpKey: TOGGLE_TYPE.TOGGLE_TYPE_YES },
      });
      if (enabledLookup?.id) {
        const soTypeLidForPerformance =
          type === "ALL"
            ? (
                await this.lookUpRepository.findOne({
                  where: { lookUpKey: OPPORTUNITY_TYPE.SO },
                })
              )?.id
            : undefined;
        performanceCondition = new Brackets((qb) => {
          qb.where(
            "main.enabledForPerformanceLid = :enabledForPerformanceLid",
            { enabledForPerformanceLid: enabledLookup.id }
          );
          if (type === "RO") {
            qb.andWhere("main.refPolicyId IS NOT NULL");
          } else if (type === "ALL" && soTypeLidForPerformance != null) {
            // Combined listing: an RO still needs a linked policy, an SO never
            // does — the same rule the Placement funnel counts apply, so the
            // drilldown total matches (spec §12.3-A).
            qb.andWhere(
              new Brackets((inner) => {
                inner
                  .where("main.opportunityTypeLid = :soTypeLidForPerformance", {
                    soTypeLidForPerformance,
                  })
                  .orWhere("main.refPolicyId IS NOT NULL");
              })
            );
          }
        });
      }

      if (funnel) {
        relations.push("opportunityLost");
        // Honour an explicit from/to pair (custom dashboard dates) exactly like
        // the sales-funnel endpoint does; otherwise derive from quarter/month/FY.
        const range = getDateRange(effectiveTimeFilter, effectiveFinancialYear);
        const from = fromDate && toDate ? fromDate : range.start;
        const to = fromDate && toDate ? toDate : range.end;

        // Reconcile the funnel drilldown with the funnel counts for both a specific
        // stage and the whole-type total (activityTable null): restrict the listing
        // to the exact set buildFunnelStageQuery produces (expiry +-5 + lost/won/open
        // arms [+ stage completedAt]), so the drilled list count equals the funnel
        // count. The listing's own owner/org scope still applies; insurer is AND-ed
        // in when selected.
        // A combined (type=ALL) listing reached from a funnel can only have come
        // from the Placement funnel — Manage Quotes is the only combined screen —
        // so it drills the ISG-gated SO+RO set. Resolving it as "SO" (the old
        // fallback) silently dropped every RO row, so the drilled count came in
        // under the funnel count (spec §12.4).
        const funnelDrillType =
          type === "RO" ? "RO" : type === "ALL" ? "PLACEMENT" : "SO";
        const funnelDrillCondition =
          await this.opportunityRepository.buildFunnelStageDrilldownCondition(
            funnelDrillType,
            from,
            to,
            activityTable ?? null
          );
        const funnelCondition = mergeBrackets(
          insurerId && insurerCondition
            ? mergeBrackets(funnelDrillCondition, insurerCondition)
            : funnelDrillCondition,
          pendingCondition,
          performanceCondition
        );

        opportunities = await this.opportunityRepository.getAllOpportunities(
          page,
          limit,
          searchParams,
          effectiveSortParams,
          searchBy,
          userId,
          whereCondition,
          relations,
          funnelCondition ?? undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          undefined,
          pendingPresentationFilters,
          true,
          visibleActivityRoleKeys,
          undefined,
          skipKpi
        );
      } else {
        const combinedCondition = mergeBrackets(
          customWhereCondition,
          pendingCondition,
          performanceCondition,
          insurerCondition,
          isgPlanningCondition,
          activityDisplayCondition
        );
        opportunities = await this.opportunityRepository.getAllOpportunities(
          page,
          limit,
          searchParams,
          effectiveSortParams,
          searchBy,
          userId,
          whereCondition,
          relations,
          combinedCondition,
          effectiveField,
          effectiveFromDate,
          effectiveToDate,
          effectivePeriod,
          effectiveTimeFilter,
          effectiveFinancialYear,
          {
            logQuery: shouldLogFinalQuery || !!activityTable,
          },
          pendingPresentationFilters,
          false,
          visibleActivityRoleKeys,
          companyGrain,
          skipKpi,
          sort
        );
      }
      const result = opportunities;
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityService",
          method: "getAllOpportunityList",
          messageData: "retrieved opportunities",
        }),
      });
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // Re-throw NotFoundException to be handled by the controller
      }

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityService",
          method: "getAllOpportunityList",
          messageData: error,
        }),
      });

      throw new BadRequestException(
        `${errorMessages.opportunityListRetrievalFailed} ${
          error instanceof Error ? error.message : ""
        }`
      );
    }
  }

  /**
   * Full (non-paginated) export of the SO/RO listing for the given filters —
   * reuses getAllOpportunityList's own search/scope/date-filter parsing
   * (mapOpportunityState, mapSearchParams, viewBy/owner scoping) instead of
   * re-deriving any of it, mirroring how policy-service's
   * generateBizDoneExcelFromQuery reuses getPolicyReportExcel. Returns the raw
   * S3 key (not a pre-signed URL) — the async export path keeps the key as-is,
   * same convention as the BizDone export.
   */
  async getOpportunityReportExcel(
    type: "SO" | "RO" | "ALL",
    search: string,
    sort: string,
    searchBy: string,
    loggedInUserId: number,
    field: string,
    fromDate: any,
    toDate: any,
    period: string,
    timeFilter: string | undefined,
    financialYear: number | undefined,
    ownerId: number | undefined,
    viewBy: "manager" | "team" | undefined,
    funnel: "true" | "false" | undefined,
    isPendingActivity: boolean | undefined,
    insurerId: number | undefined,
    optyType: "SO" | "RO" | undefined,
    insurerBranchId: number | undefined,
    branchViewBy: string | undefined,
    companyGrain: boolean | undefined,
    appliedFiltersRows?: { filter: string; value: string }[],
    columns?: { key: string; label: string }[],
  ): Promise<string> {
    // Omitting page/limit fetches every matching row unpaginated in one call
    // — mirrors how the BizDone export never pages its report query.
    // skipKpi=true: an export never reads count/opportunityLeads/etc, and
    // computing them costs a full second validateOpportunityScope call (its
    // own WHERE/date resolution + query over every matching row) — the
    // dominant cost, well beyond the join/relations overhead.
    // Temporary phase timers to see where the export's wall-clock time goes
    // beyond what pg_stat_statements can show (DB round trip vs. TypeORM
    // hydration/transform/Excel-write/upload, all invisible to the DB) —
    // same instrumentation added to Policy Listing's export.
    const fetchStart = Date.now();
    const full = await this.getAllOpportunityList(
      type, undefined, undefined, search, sort, searchBy, loggedInUserId, field, fromDate, toDate,
      period, timeFilter, financialYear, ownerId, viewBy, funnel, isPendingActivity,
      insurerId, optyType, insurerBranchId, branchViewBy, companyGrain, true,
    );
    const fetchMs = Date.now() - fetchStart;
    const rows = full.data?.length
      ? full.data
      : [{ Message: "No records found for the selected filters" }];
    // Two sheets — "Applied Filters" (what the user filtered by) and
    // "Filtered Data" (the matching rows) — same shape as BizDone's export.
    // NOT generateExcel: that shared helper hardcodes its one sheet as
    // "Errors" (built for validation-error exports elsewhere), which is the
    // wrong label for a listing export.
    const excelStart = Date.now();
    const buffer = await generateExcelWithAppliedFilters(
      rows as any[],
      appliedFiltersRows?.length
        ? appliedFiltersRows
        : [{ filter: "Filters", value: "None (all records)" }],
      "Filtered Data",
      columns,
    );
    const excelMs = Date.now() - excelStart;
    const reportFileLabel: Record<"SO" | "RO" | "ALL", string> = {
      SO: "Sales_Opportunity_Report",
      RO: "Renewal_Opportunity_Report",
      ALL: "Opportunity_Report",
    };
    // userId-scoped folder keeps the key unique; the filename itself stays
    // clean since it's what shows up as the downloaded file's name.
    const key = `uploads/opportunity/reports/${loggedInUserId}/${reportFileLabel[type]}_${Date.now()}.xlsx`;
    const uploadStart = Date.now();
    await uploadToS3(
      buffer,
      key,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    const uploadMs = Date.now() - uploadStart;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "OpportunityService",
        method: "getOpportunityReportExcel",
        payload: { type, rowCount: rows.length, fetchMs, excelMs, uploadMs },
        messageData: "export phase timings",
      }),
    });
    return key;
  }

  /**
   * Replays a stored SO/RO listing query through the exact same generation
   * path getOpportunityReportExcel uses, so the async export output matches
   * what the equivalent synchronous listing call would show. Mirrors
   * PolicyService.generateBizDoneExcelFromQuery.
   */
  async generateSalesOpportunityExcelFromQuery(
    query: Record<string, any>,
    loggedInUserId: number,
  ): Promise<string> {
    const type = (query?.type as "SO" | "RO" | "ALL") || "SO";
    // The frontend sends the already-resolved applied filters (labels
    // included, exactly as shown in the smart-search Applied Filters),
    // stored as a JSON string on the job's filtersApplied — same convention
    // as BizDone's export. Written verbatim into the Applied Filters sheet.
    const appliedFiltersRows = ReportExportJob.parseReportAppliedFilters(
      query?.appliedFilters,
    );
    const columns = ReportExportJob.parseReportColumns(query?.columns);
    const search = typeof query?.search === "string" ? query.search : "";
    const financialYear =
      query?.financialYear !== undefined && query?.financialYear !== null
        ? Number(query.financialYear)
        : undefined;
    const ownerId =
      query?.ownerId !== undefined && query?.ownerId !== null
        ? Number(query.ownerId)
        : undefined;
    const insurerId =
      query?.insurerId !== undefined && query?.insurerId !== null
        ? Number(query.insurerId)
        : undefined;
    const insurerBranchId =
      query?.insurerBranchId !== undefined && query?.insurerBranchId !== null
        ? Number(query.insurerBranchId)
        : undefined;

    return this.getOpportunityReportExcel(
      type,
      search,
      query?.sort,
      query?.searchBy,
      loggedInUserId,
      query?.field,
      query?.from ?? null,
      query?.to ?? null,
      query?.period,
      query?.month ? query.month : query?.quarter,
      financialYear,
      ownerId,
      query?.viewBy,
      query?.funnel,
      query?.isPendingActivity,
      insurerId,
      query?.optyType,
      insurerBranchId,
      query?.branchViewBy,
      query?.companyGrain === "true" || query?.companyGrain === true,
      appliedFiltersRows,
      columns,
    );
  }

  /**
   * Enqueue an async SO/RO listing export as a background job — same
   * enqueue/dedup/fire-and-forget-trigger mechanism as BizDone's export,
   * against the same shared `user_bizdone_report` table, discriminated by
   * UserBizdoneReportType.SALES_OPPORTUNITY_LIST.
   */
  async enqueueOpportunityReportExport(
    userId: number,
    filtersApplied: Record<string, unknown>,
  ): Promise<{ jobId: number; status: string; alreadyInProgress: boolean }> {
    try {
      return await ReportExportJob.enqueueReportExportJob(
        this.dataSource,
        userId,
        UserBizdoneReportType.SALES_OPPORTUNITY_LIST,
        filtersApplied,
        (filters, uid) =>
          this.generateSalesOpportunityExcelFromQuery(filters ?? {}, uid),
      );
    } catch (error) {
      console.error("Error in enqueueOpportunityReportExport:", error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to queue report export.",
      );
    }
  }

  /** Status of a queued SO/RO export, for the frontend to poll. Scoped to the requesting user. */
  async getOpportunityReportExportStatus(jobId: number, userId: number) {
    const result = await ReportExportJob.getReportExportStatus(
      this.dataSource,
      jobId,
      userId,
    );
    if (!result) {
      throw new NotFoundException("Export job not found");
    }
    return result;
  }


  async downloadOpportunityReportExportFile(jobId: number, userId: number) {
    const job = await ReportExportJob.getReportExportJob(
      this.dataSource,
      jobId,
      userId,
    );
    if (!job) {
      throw new NotFoundException("Export job not found");
    }
    if (job.status !== UserBizdoneReportStatus.COMPLETED || job.documentId == null) {
      throw new BadRequestException("Report is not ready for download.");
    }
    const fileUpload = await this.dataSource.getRepository(FileUpload).findOne({
      where: { id: job.documentId },
    });
    if (!fileUpload) {
      throw new NotFoundException("Report file not found");
    }
    const buffer = await downloadFromS3(fileUpload.fileKey);
    return {
      fileName: fileUpload.fileKey.split("/").pop() || `report-${jobId}.xlsx`,
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      buffer,
    };
  }

  /**
   * Recent exports for the requesting user, scoped to SALES_OPPORTUNITY_LIST
   * only — the SO listing page's Downloads panel must not show BizDone (or
   * any other module's) exports even though they share the same table.
   */
  async listSoReportExports(userId: number) {
    return ReportExportJob.listReportExports(this.dataSource, userId, [
      UserBizdoneReportType.SALES_OPPORTUNITY_LIST,
    ]);
  }

  /**
   * Enqueue an async RO listing export — identical mechanism to the SO
   * export above (same generateSalesOpportunityExcelFromQuery generator,
   * which already branches on the stored query's `type` field), just tagged
   * with its own reportType so the RO page's Downloads panel and this
   * service's cron worker can distinguish RO jobs from SO ones sharing the
   * same table.
   */
  async enqueueRenewalOpportunityReportExport(
    userId: number,
    filtersApplied: Record<string, unknown>,
  ): Promise<{ jobId: number; status: string; alreadyInProgress: boolean }> {
    try {
      return await ReportExportJob.enqueueReportExportJob(
        this.dataSource,
        userId,
        UserBizdoneReportType.RENEWAL_OPPORTUNITY_LIST,
        filtersApplied,
        (filters, uid) =>
          this.generateSalesOpportunityExcelFromQuery(filters ?? {}, uid),
      );
    } catch (error) {
      console.error("Error in enqueueRenewalOpportunityReportExport:", error);
      throw new InternalServerErrorException(
        error instanceof Error ? error.message : "Failed to queue report export.",
      );
    }
  }

  /**
   * Recent exports for the requesting user, scoped to
   * RENEWAL_OPPORTUNITY_LIST only — mirrors listSoReportExports.
   */
  async listRoReportExports(userId: number) {
    return ReportExportJob.listReportExports(this.dataSource, userId, [
      UserBizdoneReportType.RENEWAL_OPPORTUNITY_LIST,
    ]);
  }

  // Creates a new opportunity by delegating the repository.
  async createOpportunity(
    createOpportunityDto: CreateOpportunityDto,
    riskLocations: OpportunityRiskLocationDto[],
    claimExperiences: OpportunityClaimExperienceDto[],
    documents: OpportunityDocumentDto[],
    previousPlacementDetails: OpportunityPreviousPlacementDetailsDto[],
    contacts: OpportunityContactMapDto[],
    userId: number,
    policyId?: number
  ) {
    const response = await this.dataSource.transaction(
      async (entityManager) => {
        try {
          // Create the opportunity and get its ID
          const opportunityData = createOpportunityDto;
          await this.lookUpValidation.validateDynamicLookupValues(
            createOpportunityDto,
            LOOK_UP_DATA
          );

          const opportunity =
            await this.opportunityRepository.createOpportunity(
              entityManager,
              opportunityData,
              policyId
            );

          // Keeping the priority true for testing purpose
          const isPriorityOpportunity =
            opportunity.sumInsured >= OPTY_SUM_INSURED_NOTIFICATION_THRESHOLD;
          const url = `${ENV.CLIENT_SERVER_URL}opportunities/${opportunity.opportunityId}`;
          if (isPriorityOpportunity) {
            await this.sendNotification(
              NOTIFICATION_EVENT_TYPES.High_Value_Opportunity_Creation,
              url,
              userId,
              true,
              true
            );
          } else {
            await this.sendNotification(
              NOTIFICATION_EVENT_TYPES.OPPORTUNITY_CREATION,
              url,
              userId,
              false,
              true
            );
          }

          // Create risk locations
          if (riskLocations && riskLocations.length > 0) {
            for (const riskLocation of riskLocations) {
              await this.opportunityRepository.createRiskLocation(
                entityManager,
                {
                  opportunityId: opportunity.opportunityId,
                  addressId: riskLocation.addressId,
                }
              );
            }
          }

          // Create claim experiences
          if (claimExperiences && claimExperiences.length > 0) {
            for (const claimExperience of claimExperiences) {
              await this.opportunityRepository.createClaimExperience(
                entityManager,
                {
                  ...claimExperience,
                  opportunityId: opportunity.opportunityId,
                }
              );
            }
          }

          // Create documents
          if (documents && documents.length > 0) {
            for (const document of documents) {
              await this.opportunityRepository.createOppDocument(
                entityManager,
                {
                  ...document,
                  opportunityId: opportunity.opportunityId,
                }
              );
            }
          }

          // Create previous placement details
          if (previousPlacementDetails && previousPlacementDetails.length > 0) {
            for (const previousPlacementDetail of previousPlacementDetails) {
              await this.opportunityRepository.createPreviousPlacementDetails(
                entityManager,
                {
                  ...previousPlacementDetail,
                  opportunityId: opportunity.opportunityId,
                }
              );
            }
          }
          // Create previous mediator details
          const previousMediatorDetails = {
            previousInsurer: opportunityData.previousInsurer ?? [],
            previousTpa: opportunityData.previousTPA ?? [],
            previousBroker: opportunityData.previousBroker ?? [],
          };
          if (previousMediatorDetails) {
            await this.opportunityRepository.savePreviousMediatorDetails(
              entityManager,
              {
                ...previousMediatorDetails,
                opportunityId: opportunity.opportunityId,
              }
            );
          }

          if (contacts && contacts.length > 0) {
            for (const contact of contacts) {
              await this.opportunityRepository.createContactMap(entityManager, {
                ...contact,
                opportunityId: opportunity.opportunityId,
                companyId: opportunityData.companyId,
              });
            }
          }

          delete opportunity?.createdBy;
          delete opportunity?.updatedBy;
          delete opportunity?.createdAt;
          delete opportunity?.updatedAt;
          delete opportunity?.deletedAt;
          if (opportunity) {
            const type = await this.lookUpRepository.findOne({
              where: { id: opportunityData.opportunityTypeLid },
            });
            await this.opportunityRepository.createStageActivityMap(
              entityManager,
              opportunity.opportunityId,
              opportunity.policyTypeLid,
              createOpportunityDto.createdBy,
              type?.lookUpValue
            );
          }
          return opportunity;
        } catch (error) {
          throw new InternalServerErrorException(
            createErrorResponse(
              HttpStatus.INTERNAL_SERVER_ERROR,
              error instanceof Error
                ? error.message
                : errorMessages.opportunityCreationFailed
            )
          );
        }
      }
    );
    if (
      response.opportunityId !== undefined &&
      response.opportunityId !== null
    ) {
      const data = await this.opportunityRepository.getOpportunityById(
        response.opportunityId,
        userId
      );
      return data;
    }
  }

  // Retrieves an opportunity by its ID by delegating the repository.
  async getOpportunityById(
    opportunityId: number,
    userId: number,
    page?: string
  ): Promise<OpportunityDto> {
    try {
      const opportunity = await this.opportunityRepository.getOpportunityById(
        opportunityId,
        userId,
        page
      );
      if (!opportunity) {
        throw new NotFoundException(errorMessages.opportunityNotFound);
      }
      return opportunity;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : errorMessages.opportunityDetailsRetrievalFailed
          );
    }
  }

  // Updates an existing opportunity by its ID by delegating the repository.
  async updateOpportunityById(
    opportunityId: number,
    updateOpportunityDto: UpdateOpportunityDto,
    updateRiskLocations: OpportunityRiskLocationDto[],
    updateClaimExperiences: OpportunityClaimExperienceDto[],
    updateDocuments: OpportunityDocumentDto[],
    updatePreviousPlacementDetails: OpportunityPreviousPlacementDetailsDto[],
    updateContacts: OpportunityContactMapDto[],
    userId: number
  ) {
    const response = await this.dataSource.transaction(
      async (entityManager) => {
        try {
          const {
            riskLocations,
            claimExperiences,
            documents,
            previousPlacementDetails,
            previousInsurer,
            previousTPA,
            previousBroker,
            contacts,
            ...opportunityData
          } = updateOpportunityDto;
          await this.lookUpValidation.validateDynamicLookupValues(
            updateOpportunityDto,
            LOOK_UP_DATA
          );
          // Update the opportunity by its ID
          await this.opportunityRepository.updateOpportunity(
            entityManager,
            opportunityId,
            opportunityData,
            userId
          );
          // Update risk locations
          if (updateRiskLocations && updateRiskLocations.length > 0) {
            await this.opportunityRepository.updateRiskLocations(
              entityManager,
              opportunityId,
              updateRiskLocations
            );
          }
          // Update claim experiences
          if (updateClaimExperiences && updateClaimExperiences.length > 0) {
            await this.opportunityRepository.updateClaimExperience(
              entityManager,
              opportunityId,
              updateClaimExperiences
            );
          }
          // Update documents
          if (updateDocuments && updateDocuments.length > 0) {
            for (const document of updateDocuments) {
              // Check if the document exists in OpportunityDocuments table
              const existingDocument =
                await this.opportunityRepository.getDocumentByIdAndOpportunityId(
                  document.documentId,
                  opportunityId
                );
              // If the document exists, do nothing
              if (!existingDocument) {
                await this.opportunityRepository.createOppDocument(
                  entityManager,
                  {
                    ...document,
                    opportunityId,
                  }
                );
              }
            }
          }

          // Update previous placement details
          if (
            updatePreviousPlacementDetails &&
            updatePreviousPlacementDetails.length > 0
          ) {
            for (const previousPlacementDetail of updatePreviousPlacementDetails) {
              if (previousPlacementDetail.id) {
                const existingPreviousPlacementDetail =
                  await this.opportunityRepository.getPreviousPlacementDetailsByIdAndOpportunityId(
                    previousPlacementDetail.id,
                    opportunityId
                  );
                if (existingPreviousPlacementDetail) {
                  await this.opportunityRepository.updatePreviousPlacementDetails(
                    entityManager,
                    {
                      ...previousPlacementDetail,
                      opportunityId,
                    }
                  );
                }
              } else {
                await this.opportunityRepository.createPreviousPlacementDetails(
                  entityManager,
                  {
                    ...previousPlacementDetail,
                    opportunityId,
                  }
                );
              }
            }
          }

          // Update previous mediator details
          if (previousInsurer || previousTPA || previousBroker) {
            const previousMediatorDetails = {
              previousInsurer: previousInsurer ?? [],
              previousTpa: previousTPA ?? [],
              previousBroker: previousBroker ?? [],
            };
            if (previousMediatorDetails) {
              await this.opportunityRepository.savePreviousMediatorDetails(
                entityManager,
                {
                  ...previousMediatorDetails,
                  opportunityId,
                }
              );
            }
          }

          // Update contacts
          if (updateContacts && updateContacts.length > 0) {
            await this.opportunityRepository.updateContactMap(
              entityManager,
              opportunityId,
              updateContacts
            );
          }

          return { id: opportunityId };
        } catch (error) {
          throw error instanceof NotFoundException
            ? error
            : new BadRequestException(
                createErrorResponse(
                  HttpStatus.BAD_REQUEST,
                  error instanceof Error
                    ? error.message
                    : errorMessages.opportunityUpdateFailed
                )
              );
        }
      }
    );
    if (response.id !== undefined && response.id !== null) {
      const data = await this.opportunityRepository.getOpportunityById(
        response.id,
        userId
      );
      return data;
    }
  }

  // Deletes an opportunity by its ID by delegating the repository.
  async deleteOpportunityById(opportunityId: number): Promise<void> {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        await this.opportunityRepository.deleteOpportunityById(
          entityManager,
          opportunityId
        );
      });
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException(
            error instanceof Error
              ? error.message
              : errorMessages.opportunityDeletionFailed
          );
    }
  }

  // Creates a final negotiation meeting.
  // async createFinalNegotiationMeeting(
  //   createFinalNegotiationDto: CreateFinalNegotiationDto,
  //   userId: number
  // ) {
  //   await this.lookUpValidation.validateDynamicLookupValues(
  //     createFinalNegotiationDto,
  //     LOOK_UP_DATA
  //   );
  //   const { policyPlacedTypeLid, leadInsurerId } = createFinalNegotiationDto;
  //   const policyPlacedLookUp = await this.lookUpRepository.findOne({
  //     where: { id: policyPlacedTypeLid },
  //   });
  //   const policyPlacedLookUpKey = policyPlacedLookUp?.lookUpKey;
  //   return await this.dataSource.transaction(async (manager) => {
  //     try {
  //       // Separate final meeting data (excluding insurerShares)
  //       let { insurerShares, participants, ...finalMeetingData } =
  //         createFinalNegotiationDto;

  //       if (policyPlacedLookUpKey === POLICY_PLACED_TYPE.MULTIPLE_INSURER) {
  //         if (!insurerShares?.length) {
  //           throw new Error(
  //             "Insurer shares are required when policyPlacedType is Multiple Insurers"
  //           );
  //         }
  //         if (!leadInsurerId) {
  //           throw new Error(
  //             "Lead insurer ID is required when policyPlacedType is Multiple Insurers."
  //           );
  //         }
  //       } else if (
  //         policyPlacedLookUpKey === POLICY_PLACED_TYPE.SINGLE_INSURER
  //       ) {
  //         insurerShares = insurerShares ?? [];
  //         finalMeetingData.leadInsurerId =
  //           finalMeetingData.leadInsurerId ?? null;
  //       }
  //       // 1. Create main final negotiation meeting
  //       const meeting =
  //         await this.opportunityRepository.createFinalMeetingRecord(
  //           finalMeetingData,
  //           userId,
  //           manager
  //         );

  //       if (!meeting || !meeting.id) {
  //         throw new Error("Failed to create final negotiation meeting.");
  //       }

  //       // 2. Create insurer participants if any
  //       if (insurerShares?.length) {
  //         await this.opportunityRepository.createInsurerParticipants(
  //           insurerShares,
  //           meeting.id, // Ensure meeting.id is passed correctly
  //           manager
  //         );
  //       }

  //       if (participants.length > 0) {
  //         await this.opportunityRepository.createFinalNegotiationParticipants(
  //           participants,
  //           meeting.id, // Ensure meeting.id is passed correctly
  //           manager
  //         );
  //       }

  //       return meeting;
  //     } catch (error) {
  //       throw new Error(
  //         `Error creating final negotiation meeting: ${
  //           error instanceof Error ? error.message : "Unknown error"
  //         }`
  //       );
  //     }
  //   });
  // }

  async getOpportunityDocuments(
    opportunityId: number,
    page: number,
    limit: number,
    search?: string,
    searchBy?: string,
    from?: Date,
    to?: Date,
    field?: string
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityService",
          method: "getOpportunityDocuments",
          payload: {
            opportunityId,
            page,
            limit,
            search,
            searchBy,
            from,
            to,
            field,
          },
          messageData: "method invoked",
        }),
      });
      const searchParams = search ? mapSearchParams(search) : [];
      const documents =
        await this.opportunityRepository.getDocumentsByOpportunityId(
          opportunityId,
          page,
          limit,
          searchParams,
          searchBy,
          from,
          to,
          field
        );
      if (!documents || documents.count === 0) {
        return { data: [], count: 0 };
      }
      // Transform the data to return only necessary fields
      const transformedDocuments = documents.data.map((document) => ({
        id: document?.id ?? null,
        filePath: document?.fileKey ?? null,
        fileName: document?.fileKey
          ? document?.fileKey?.split("/")?.pop()
          : null,
        documentTypeId: document?.documentType?.id ?? null,
        documentType: document?.documentType?.lookUpValue ?? null,
        uploadedAt: document?.createdAt
          ? new Date(document.createdAt).toISOString().split("T")[0]
          : null,
        activityName: document?.opportunityActivity?.activityName ?? null,
        uploadedBy: document?.updatedByUser
          ? `${document.updatedByUser.firstName ?? ""} ${
              document.updatedByUser.lastName ?? ""
            }`.trim() || null
          : null,
      }));
      return { data: transformedDocuments, count: documents.count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityService",
          method: "getOpportunityDocuments",
          payload: {
            opportunityId,
            page,
            limit,
            search,
            searchBy,
            from,
            to,
            field,
          },
          messageData: error,
        }),
      });
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch documents for opportunity ID ${opportunityId}: ${error.message}`
      );
    }
  }

  async updateOpportunityActivity(
    updateOpportunityActivityData: OpportunityActivitiesDto
  ) {
    try {
      // Validate due dates against expiry date
      const validationErrors = await this.validateDueDatesAgainstExpiryDate(
        updateOpportunityActivityData
      );

      if (validationErrors.length > 0) {
        throw new BadRequestException({
          error: "Validation Failed",
          message: validationErrors,
        });
      }
      await this.dataSource.transaction(async (entityManager) => {
        if (updateOpportunityActivityData.opportunityActivities.length > 0) {
          for (const activity of updateOpportunityActivityData.opportunityActivities) {
            await this.opportunityRepository.updateActivityDueDate(
              entityManager,
              activity.opportunityActivityId,
              new Date(activity.dueDate),
              updateOpportunityActivityData.updatedBy
            );
            // Commented the code here as the owner id will not be updated here in this flow:
            // if (activity.ownerId) {
            //   await this.opportunityRepository.updateOpportunityActivityOwner(
            //     entityManager,
            //     activity.opportunityActivityId,
            //     activity.ownerId
            //   );
            // }
            for (const activityParticipant of activity.participants) {
              await this.opportunityRepository.addParticipantsToOpportunityActivity(
                entityManager,
                activity.opportunityActivityId,
                activityParticipant,
                updateOpportunityActivityData.updatedBy
              );

              const opportunity =
                await this.getOpportunityIdByOpportunityActivityId(
                  activity.opportunityActivityId
                );
              const url = `${ENV.CLIENT_SERVER_URL}opportunities/${opportunity.opportunityId}`;
              await this.sendNotification(
                OPPORTUNITY_PARTICIPANT_INVITE,
                url,
                activityParticipant,
                true,
                true
              );
            }
          }
        }

        // closing the isg assignment tasks if exists;
        const optyActivityDetails =
          await this.opportunityRepository.getOpportunityActivity(
            updateOpportunityActivityData.opportunityActivities[0]
              .opportunityActivityId
          );

        const taskStatusLid = await this.lookUpRepository.findOne({
          where: {
            lookUpKey: TASK_STATUS_ACTIVE,
          },
        });
        if (!optyActivityDetails) {
          throw new NotFoundException(
            `No opportunity activity found with ID ${updateOpportunityActivityData.opportunityActivities[0].opportunityActivityId} in the same organization`
          );
        }
        if (!taskStatusLid) {
          throw new NotFoundException(
            `No status found in lookup for value ${TASK_STATUS_ACTIVE}.`
          );
        }
        const assignedTaskDetails =
          await this.taskService.getIsgPlanningAssignedTaskByOpportunityAndOwner(
            optyActivityDetails.opportunityId,
            taskStatusLid?.id,
            optyActivityDetails.ownerId
          );
        if (assignedTaskDetails != null) {
          const closedTaskStatusLid = await this.lookUpRepository.findOne({
            where: {
              lookUpKey: TASK_STATUS_CLOSED,
            },
          });
          if (!closedTaskStatusLid) {
            throw new NotFoundException(
              `No status found in lookup for value ${TASK_STATUS_CLOSED}.`
            );
          }
          Object.assign(assignedTaskDetails, {
            taskStatusLid: closedTaskStatusLid.id,
            taskClose: TASK_CLOSED,
            updatedBy: updateOpportunityActivityData.updatedBy,
            updatedAt: new Date(),
          });
          await entityManager.save(Task, assignedTaskDetails);
        }
      });
      return {
        success: true,
        message: successMessage.opportunityActivityUpdatedSuccessfully,
        data: updateOpportunityActivityData,
      };
    } catch (error) {
      console.log(error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : errorMessages.opportunityActivityUpdateFailed
      );
    }
  }

  async validateDueDatesAgainstExpiryDate(
    updateOpportunityActivityData: OpportunityActivitiesDto
  ): Promise<string[]> {
    const validationErrors: string[] = [];
    const invalidActivityIds: number[] = [];

    try {
      // Fetch the opportunityId using the first opportunityActivityId from the payload
      const firstActivity =
        updateOpportunityActivityData.opportunityActivities[0];
      const activityMap = await this.opportunityActivityMapRepository.findOne({
        where: { id: firstActivity.opportunityActivityId },
        select: ["opportunityId"],
      });

      if (!activityMap || !activityMap.opportunityId) {
        throw new NotFoundException(
          `Opportunity ID not found for activity ID ${firstActivity.opportunityActivityId}.`
        );
      }

      const opportunityId = activityMap.opportunityId;

      // Fetch the opportunity expiry date using the opportunityId
      const opportunity = await this.opportunityRepo.findOne({
        where: { opportunityId },
        select: ["expiryDate"],
      });

      if (!opportunity || !opportunity.expiryDate) {
        throw new NotFoundException(
          `Opportunity with ID ${opportunityId} not found or expiry date is missing.`
        );
      }

      const opportunityExpiryDate = new Date(opportunity.expiryDate);

      // Collect all invalid activity IDs
      for (const activity of updateOpportunityActivityData.opportunityActivities) {
        const activityDueDate = new Date(activity.dueDate);

        if (activityDueDate > opportunityExpiryDate) {
          invalidActivityIds.push(activity.opportunityActivityId);
        }
      }

      // If there are invalid activity IDs, fetch their names
      if (invalidActivityIds.length > 0) {
        const activityMaps = await this.opportunityActivityMapRepository.findBy(
          {
            id: In(invalidActivityIds),
          }
        );

        // Create validation errors for each invalid activity
        for (const activityMap of activityMaps) {
          const activityName = activityMap.activityName || "Unknown Activity";
          validationErrors.push(
            `Due date for activity "${activityName}" exceeds the opportunity expiry date ${opportunityExpiryDate.toISOString()}.`
          );
        }
      }

      return validationErrors; // Return validation errors or an empty array
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? "Error validating due dates against expiry date."
              : error
          );
    }
  }

  async getOpportunityActivityById(opportynityId: number) {
    try {
      return await this.opportunityRepository.getOpportunityActivitiesByOpportunityId(
        opportynityId
      );
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving opportunity activity"
          );
    }
  }

  async getOpportunityActivityHistory(opportunityId: number) {
    try {
      return await this.opportunityRepository.getOpportunityActivityHistory(
        opportunityId
      );
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving opportunity activity history"
          );
    }
  }

  async getOpportunityActivityMeta(
    opportunityId: number,
    activityId: number
  ): Promise<any> {
    const activityMeta =
      await this.opportunityRepository.getOpportunityActivityMeta(
        opportunityId,
        activityId
      );

    if (!activityMeta) {
      throw new NotFoundException(
        errorMessages.opportunityActivityMetaNotFound
      );
    }

    return activityMeta;
  }

  async createDataValidation(
    dataValidationDetails: CreateDataValidationDto,
    userId: number
  ): Promise<any> {
    try {
      return this.handleDataValidation(dataValidationDetails, userId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create data validation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async handleDataValidation(
    dataValidationDetails: CreateDataValidationDto,
    userId: number
  ) {
    try {
      const {
        opportunityActivityId,
        statusLid,
        activityStatusKey,
        documents,
        remarks,
      } = dataValidationDetails;

      const opportunityActivity =
        await this.opportunityRepository.getOpportunityActivityById(
          dataValidationDetails.opportunityActivityId
        );

      // Create the data validation record
      return await this.dataSource.transaction(async (entityManager) => {
        const dataValidationRecord =
          await this.opportunityRepository.saveDataValidation(
            entityManager,
            opportunityActivityId,
            {
              opportunityId: opportunityActivity.opportunityId,
              activityId: opportunityActivity.activityId,
              opportunityActivityId: opportunityActivityId,
              description: remarks?.description,
              statusLid: statusLid,
            },
            userId
          );

        // Create the data validation documents
        if (documents) {
          // await this.opportunityRepository.saveDataValidationDocuments(
          //   entityManager,
          //   dataValidationRecord.id,
          //   documents
          // );
          await this.opportunityRepository.saveActivityDocuments(
            entityManager,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.OPPORTUNITY_DATA_VALIDATION_DOCUMENT_MAP,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.OPPORTUNITY_DATA_VALIDATION_DOCUMENT_MAP_ID,
            dataValidationRecord.id,
            documents
          );
          // Update document statuses
          await this.opportunityRepository.updateDocumentStatus(
            entityManager,
            documents?.map((doc) => doc.documentId) || []
          );
        }

        // update the OpportunityActivityMap with the new status
        await this.opportunityRepository.updateOpportunityActivityMapStatus(
          opportunityActivityId,
          statusLid,
          userId,
          activityStatusKey === ACTIVITY_STATUS.COMPLETE ? new Date() : null,
          entityManager,
          activityStatusKey
        );
        if (activityStatusKey === ACTIVITY_STATUS.COMPLETE) {
          // Store opportunity covers
          await this.opportunityRepository.storeOpportunityCovers(
            entityManager,
            opportunityActivity.opportunityId,
            statusLid
          );
          await this.opportunityRepository.updateNextActivityStatus(
            dataValidationRecord.opportunityActivityId,
            dataValidationRecord.statusLid,
            entityManager
          );
          await this.opportunityRepository.updateOpportunityStatus(
            entityManager,
            opportunityActivity.opportunityId,
            OPPORTUNITY_STATUS_OPEN
          );
        }

        return dataValidationRecord;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to handle data validation details: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getDataValidationByOpportunityActivityId(
    opportunityActivityId: number
  ) {
    try {
      const { opportunityId, activityId } =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );
      const dataValidation =
        await this.opportunityRepository.getDataValidationByOpportunityActivityId(
          opportunityId,
          activityId
        );
      if (!dataValidation) {
        throw new NotFoundException(
          `Data validation not found for opportunity activity ID ${opportunityActivityId}`
        );
      }
      return dataValidation;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch data validation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async updateDataValidation(
    opportunityActivityId: number,
    updateDataValidationDetails: UpdateDataValidationDto,
    userId: number
  ): Promise<any> {
    try {
      updateDataValidationDetails.opportunityActivityId = opportunityActivityId;
      return await this.handleDataValidation(
        updateDataValidationDetails,
        userId
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update data validation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  private prepareParticipantsData(
    participants: ParticipantsDto,
    companyId: number
  ) {
    const companyParticipants = participants?.companyContactPerson?.length
      ? {
          companyId,
          companyContactPerson: participants.companyContactPerson,
        }
      : undefined;

    const employeeParticipants = participants?.employees?.length
      ? {
          employees: participants.employees,
        }
      : undefined;

    return { companyParticipants, employeeParticipants };
  }

  async createKDMMeeting(
    createKDMMeetingData: CreateKDMMeetingDto,
    userId: number
  ) {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        createKDMMeetingData,
        LOOK_UP_DATA
      );
      const {
        opportunityActivityId,
        statusLid,
        activityStatusKey,
        documents,
        participants,
        ...kdmMeetingData
      } = createKDMMeetingData;
      const opportunityActivity =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );
      return await this.handleKdmMeeting(
        kdmMeetingData,
        opportunityActivityId,
        opportunityActivity,
        statusLid,
        activityStatusKey,
        participants,
        userId,
        documents
      );
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to create KDM meeting"
      );
    }
  }

  async updateKDMMeeting(
    opportunityActivityId: number,
    updateKDMMeetingData: Partial<UpdateKDMMeetingDto>,
    userId: number
  ) {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        updateKDMMeetingData,
        LOOK_UP_DATA
      );

      const {
        opportunityActivityId: activityId,
        statusLid,
        activityStatusKey,
        documents,
        participants,
        ...kdmMeetingData
      } = updateKDMMeetingData;
      const opportunityActivity =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );
      if (opportunityActivity.activityStatusKey === ACTIVITY_STATUS.COMPLETE) {
        throw new BadRequestException(
          `KDM Meeting with opportunity activity ID: ${opportunityActivityId} is already completed.`
        );
      }
      return await this.handleKdmMeeting(
        kdmMeetingData,
        opportunityActivityId,
        opportunityActivity,
        statusLid,
        activityStatusKey,
        participants,
        userId,
        documents
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new Error("Failed to update KDM meeting.", error);
    }
  }

  async handleKdmMeeting(
    kdmMeetingData: {
      kdmMeetingFormFields: KDMMeetingFormFieldsDto;
      remarksMomSection?: RemarksMomSection;
    },
    opportunityActivityId: number,
    opportunityActivity: OpportunityActivityDto,
    statusLid: number,
    activityStatusKey: "SAVE_ACTIVITY" | "COMPLETE_ACTIVITY",
    participants: ParticipantsDto,
    userId: number,
    documents?: OpportunityActivityDocumentDto[]
  ) {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        if (kdmMeetingData.kdmMeetingFormFields.kdmMeetingTypeLid) {
          kdmMeetingData.kdmMeetingFormFields.selectMeeting =
            await this.opportunityRepository.verifyTypeOfMeeting(
              MEETING_NAME.KDM,
              kdmMeetingData.kdmMeetingFormFields.kdmMeetingTypeLid,
              kdmMeetingData.kdmMeetingFormFields?.selectMeeting
            );
        }
        if (kdmMeetingData.kdmMeetingFormFields.meetingTypeLid) {
          await this.verifyMeetingType(
            kdmMeetingData.kdmMeetingFormFields.meetingTypeLid,
            MEETING_TYPE_KEY.KDM,
            MEETING_NAME.KDM
          );
        }
        const existingMeetingId =
          kdmMeetingData.kdmMeetingFormFields.selectMeeting;
        const participantsData = this.prepareParticipantsData(
          participants,
          opportunityActivity.companyId
        );

        let existingMeeting;
        if (existingMeetingId) {
          existingMeeting = await this.meetingRepo.findOne({
            where: { id: existingMeetingId },
          });
          if (!existingMeeting) {
            throw new NotFoundException(
              `Meeting with ID ${existingMeetingId} not found.`
            );
          }
        }
        if (activityStatusKey == ACTIVITY_STATUS.COMPLETE) {
          const meetingStatus = await getLookups(
            this.lookUpRepository,
            [MEETING_STATUS.COMPLETED],
            LOOK_UP_FIELD.KEY
          );
          const lookups = await getLookup(
            meetingStatus,
            [MEETING_STATUS.COMPLETED],
            LOOK_UP_FIELD.KEY
          );
          const meetingData = this.removeUndefinedFields({
            opportunityId: opportunityActivity.opportunityId,
            activityId: opportunityActivityId,
            companyId: opportunityActivity.companyId,
            meetingSubject: DEFAULT_KDM_MEETING,
            meetingAgenda: DEFAULT_KDM_MEETING,
            meetingTypeLid: kdmMeetingData.kdmMeetingFormFields.meetingTypeLid,
            meetingDate: kdmMeetingData.kdmMeetingFormFields.meetingDate,
            startTime: kdmMeetingData.kdmMeetingFormFields.availableFrom,
            endTime: kdmMeetingData.kdmMeetingFormFields.availableTo,
            locationTypeLid:
              kdmMeetingData.kdmMeetingFormFields.locationTypeLid,
            companyParticipants: participantsData.companyParticipants,
            employeeParticipants: participantsData.employeeParticipants,
            documents: documents,
            meetingStatusLid: lookups[`lookup_${MEETING_STATUS.COMPLETED}`].id,
          });
          if (existingMeetingId) {
            // Update the existing meeting
            const meetingUpdateData = this.removeUndefinedFields({
              ...meetingData,
              updatedBy: userId,
            });
            await this.meetingService.updateMeeting(
              existingMeetingId,
              meetingUpdateData,
              entityManager,
              true
            );
          } else {
            // Create a new meeting
            await this.meetingService.createMeeting(
              {
                ...meetingData,
                createdBy: userId,
                updatedBy: userId,
              },
              entityManager
            );
          }
        }

        // Save KDM meeting details
        const kdmMeeting = await this.opportunityRepository.saveKDMMeeting(
          entityManager,
          opportunityActivityId,
          userId,
          this.removeUndefinedFields({
            meetingId: existingMeetingId,
            opportunityId: opportunityActivity.opportunityId,
            activityId: opportunityActivity.activityId,
            kdmMeetingTypeLid:
              kdmMeetingData?.kdmMeetingFormFields?.kdmMeetingTypeLid,
            selectMeeting: kdmMeetingData?.kdmMeetingFormFields?.selectMeeting,
            remarks: kdmMeetingData?.remarksMomSection?.remarks,
            mom: kdmMeetingData?.remarksMomSection?.mom,
            meetingDate: kdmMeetingData?.kdmMeetingFormFields?.meetingDate,
            startTime: kdmMeetingData?.kdmMeetingFormFields?.availableFrom,
            endTime: kdmMeetingData?.kdmMeetingFormFields?.availableTo,
            locationTypeLid:
              kdmMeetingData?.kdmMeetingFormFields?.locationTypeLid,
            statusLid,
          })
        );

        if (activityStatusKey == ACTIVITY_STATUS.COMPLETE) {
          await this.opportunityRepository.updateOpportunityStatus(
            entityManager,
            opportunityActivity.opportunityId,
            OPPORTUNITY_STATUS_WORK_IN_PROGRESS
          );
        }

        // update the OpportunityActivityMap with the new status
        await this.opportunityRepository.updateOpportunityActivityMapStatus(
          opportunityActivityId,
          statusLid,
          userId,
          activityStatusKey == ACTIVITY_STATUS.COMPLETE ? new Date() : null,
          entityManager,
          activityStatusKey
        );
        if (participants) {
          await this.opportunityRepository.saveOpportunityMeetingParticipants(
            opportunityActivityId,
            {
              companyParticipants: participantsData.companyParticipants,
              employeeParticipants: participantsData.employeeParticipants,
            },
            entityManager,
            activityStatusKey
          );
        }
        if (documents) {
          await this.opportunityRepository.saveActivityDocuments(
            entityManager,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.OPPORTUNITY_MEETING_DOCUMENT_MAP,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.OPPORTUNITY_MEETING_DOCUMENT_MAP_ID,
            opportunityActivityId,
            documents
          );
          await this.opportunityRepository.updateDocumentStatus(
            entityManager,
            documents.map((doc) => doc.documentId)
          );
        }
        await this.opportunityRepository.updateNextActivityStatus(
          opportunityActivityId,
          statusLid,
          entityManager
        );

        return kdmMeeting;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw error;
    }
  }

  async updateHandOverMeeting(
    opportunityActivityId: number,
    UpdateHandOverMeetDto: Partial<UpdateHandOverMeetDto>,
    userId: number
  ) {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        UpdateHandOverMeetDto,
        LOOK_UP_DATA
      );
      const {
        opportunityActivityId: activityId,
        statusLid,
        activityStatusKey,
        participants,
        documents,
        ...handOverMeetingData
      } = UpdateHandOverMeetDto;
      const opportunityActivity =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );
      await this.handleHandOverMeet(
        opportunityActivity,
        statusLid,
        activityStatusKey,
        participants,
        documents,
        handOverMeetingData,
        userId
      );
      return this.getHandOverMeetById(activityId);
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Failed to update Hand Over meeting."
          );
    }
  }

  async createOpportunityMeta(
    userId: number,
    activityMetaData: any
  ): Promise<any> {
    try {
      const opportunityActivityMapData =
        await this.opportunityRepository.getOpportunityActivityById(
          activityMetaData.opportunityActivityId
        );

      if (!opportunityActivityMapData) {
        throw new NotFoundException(
          `Opportunity activity not found for ID: ${activityMetaData.opportunityActivityId}`
        );
      } else {
        const opportunityTable = opportunityActivityMapData.opportunityTable;

        if (opportunityTable === null) {
          throw new NotFoundException("Opportunity activity Table not found");
        }

        const dtoGroup =
          ALL_OPPORTUNITY_ACTIVITY_DTO[
            opportunityTable as keyof typeof ALL_OPPORTUNITY_ACTIVITY_DTO
          ];
        activityMetaData.activityStatusKey =
          activityMetaData.activityStatusKey ?? ACTIVITY_STATUS.COMPLETE;
        const DtoClass =
          dtoGroup[activityMetaData.activityStatusKey as keyof typeof dtoGroup];
        if (!DtoClass) {
          throw new BadRequestException(
            `Unsupported opportunity table: ${opportunityTable} not found in the activityDtoMap`
          );
        }

        const dtoInstance = plainToInstance(DtoClass as any, activityMetaData);
        // Add these options to validate nested objects
        const validationOptions = {
          forbidUnknownValues: true,
          whitelist: true,
          forbidNonWhitelisted: true,
          skipMissingProperties: false,
        };

        const errors = await validate(dtoInstance, validationOptions);
        if (errors.length > 0) {
          const flattenErrors = (
            validationErrors: ValidationError[],
            parentProperty = ""
          ): string[] => {
            return validationErrors.flatMap((error) => {
              // Format the property path
              const propertyPath = parentProperty
                ? `${parentProperty}${
                    error.property.startsWith("[") ? "" : "."
                  }${error.property}`
                : error.property;

              // Handle current level constraints
              const currentErrors = error.constraints
                ? Object.values(error.constraints).map(
                    (msg) => `${propertyPath}: ${msg}`
                  )
                : [];

              // Handle children (nested objects or array items)
              const childrenErrors = error.children
                ? flattenErrors(error.children, propertyPath)
                : [];

              return [...currentErrors, ...childrenErrors];
            });
          };
          console.log("errors", errors);
          const flattenedErrors = flattenErrors(errors);

          throw new BadRequestException({
            status: HttpStatus.BAD_REQUEST,
            error: "Bad Request",
            message: flattenedErrors,
          });
        }
        let result: any;
        activityMetaData = dtoInstance;
        switch (opportunityTable) {
          case "opportunity_data_validation":
            result = await this.createDataValidation(activityMetaData, userId);
            break;

          case "opportunity_kdm_meeting":
            result = await this.createKDMMeeting(activityMetaData, userId);
            break;

          case "opportunity_mandate_details_entry":
            result = await this.createMandate(activityMetaData, userId);
            break;

          case "opportunity_rfp_cover_detail":
            result = await this.handleRfpCoverDetails(activityMetaData, userId);
            break;

          case "opportunity_rfp_details_entry":
            result = await this.createOpportunityRfpDetailsEntry(
              opportunityActivityMapData,
              activityMetaData,
              userId
            );
            break;

          case "opportunity_broking_slip_version_details":
            result = await this.generateBrokingSlipVersion(
              activityMetaData,
              userId,
              opportunityActivityMapData.opportunityId
            );
            break;

          case "opportunity_quote_entry":
            result = await this.createQuote(
              activityMetaData.opportunityActivityId,
              activityMetaData,
              userId
            );
            break;

          case "opportunity_quote_comparison_report":
            result = await this.createQuotComparisonReportActivity(
              opportunityActivityMapData,
              activityMetaData,
              userId
            );
            break;

          case "opportunity_final_negotiation":
            result = await this.createFinalNegotiationActivity(
              activityMetaData,
              userId
            );
            break;

          case "opportunity_placement_slip_generation":
            result = await this.createPlacementSlip(
              activityMetaData,
              userId,
              opportunityActivityMapData.opportunityId
            );
            break;

          case "opportunity_premium_calculation":
            result = await this.createPremiumCalculationActivity(
              opportunityActivityMapData,
              activityMetaData,
              userId
            );
            break;

          case "opportunity_held_cover_note":
            result = await this.createHeldCoverNoteActivity(
              opportunityActivityMapData,
              activityMetaData,
              userId
            );
            break;

          case "opportunity_policy_hard_copy":
            result = await this.createPolicyHardCopyActivity(
              opportunityActivityMapData,
              activityMetaData,
              userId
            );
            break;

          case "opportunity_policy_docket":
            result = await this.createPolicyDocketActivity(
              opportunityActivityMapData,
              activityMetaData,
              userId
            );
            break;

          case "opportunity_policy_confirmation":
            result = await this.createPolicyConfirmationActivity(
              opportunityActivityMapData,
              activityMetaData,
              userId
            );
            break;

          case "opportunity_hand_over_meet":
            result = await this.createHandOverMeet(activityMetaData, userId);
            break;

          default:
            throw new BadRequestException(
              `Unsupported opportunity table: ${opportunityTable}`
            );
        }

        const message = getMessage(activityMetaData.activityStatusKey);
        return { result, message };
      }
    } catch (error) {
      console.error("Error in createOpportunityMeta:", error);
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.getResponse());
      }
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.opportunityActivityMetaUpdateFailed
      );
    }
  }

  async updateOpportunityMeta(
    opportunityActivityId: number,
    userId: number,
    activityMetaData: any
  ): Promise<any> {
    try {
      const opportunityActivityMapData =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );

      if (!opportunityActivityMapData) {
        throw new NotFoundException(
          `Opportunity activity not found for ID: ${opportunityActivityId}`
        );
      }

      const opportunityTable = opportunityActivityMapData.opportunityTable;

      if (!opportunityTable) {
        throw new NotFoundException("Opportunity activity table not found.");
      }

      const dtoGroup =
        ALL_OPPORTUNITY_ACTIVITY_DTO[
          opportunityTable as keyof typeof ALL_OPPORTUNITY_ACTIVITY_DTO
        ];
      activityMetaData.activityStatusKey =
        activityMetaData.activityStatusKey ?? ACTIVITY_STATUS.COMPLETE;
      const DtoClass =
        dtoGroup[activityMetaData.activityStatusKey as keyof typeof dtoGroup];
      if (!DtoClass) {
        throw new BadRequestException(
          `Unsupported opportunity table: ${opportunityTable}`
        );
      }

      const dtoInstance = plainToInstance(DtoClass as any, activityMetaData);
      const validationOptions = {
        forbidUnknownValues: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        skipMissingProperties: false,
      };

      const errors = await validate(dtoInstance, validationOptions);
      console.log("errors", errors);
      if (errors.length > 0) {
        const flattenErrors = (
          validationErrors: ValidationError[],
          parentProperty = ""
        ): string[] => {
          return validationErrors.flatMap((error) => {
            // Format the property path
            const propertyPath = parentProperty
              ? `${parentProperty}${error.property.startsWith("[") ? "" : "."}${
                  error.property
                }`
              : error.property;

            // Handle current level constraints
            const currentErrors = error.constraints
              ? Object.values(error.constraints).map(
                  (msg) => `${propertyPath}: ${msg}`
                )
              : [];

            // Handle children (nested objects or array items)
            const childrenErrors = error.children
              ? flattenErrors(error.children, propertyPath)
              : [];

            return [...currentErrors, ...childrenErrors];
          });
        };
        console.log("errors", errors);
        const flattenedErrors = flattenErrors(errors);

        throw new BadRequestException({
          status: HttpStatus.BAD_REQUEST,
          error: "Bad Request",
          message: flattenedErrors,
        });
      }

      let result: any;
      activityMetaData = dtoInstance;
      switch (opportunityTable) {
        case "opportunity_data_validation":
          result = await this.updateDataValidation(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        case "opportunity_kdm_meeting":
          result = await this.updateKDMMeeting(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        case "opportunity_mandate_details_entry":
          result = await this.updateMandate(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        case "opportunity_rfp_cover_detail":
          result = await this.handleRfpCoverDetails(activityMetaData, userId);
          break;

        case "opportunity_rfp_details_entry":
          result = await this.updateOpportunityRfpDetailsEntry(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        case "opportunity_broking_slip_version_details":
          result = await this.updateBrokingSlipData(
            opportunityActivityId,
            activityMetaData.brokingSlipDetails,
            activityMetaData.brokingSlipDetails.statusLid,
            userId,
            activityMetaData.activityStatusKey
          );
          break;

        case "opportunity_quote_entry":
          result = await this.updateOpportunityQuoteByActivityId(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        case "opportunity_quote_comparison_report":
          result = await this.updateQuoteComparisonReportById(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        case "opportunity_premium_calculation":
          result = await this.updatePremiumCalculationActivity(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        case "opportunity_final_negotiation":
          result = await this.updateFinalNegotiationActivity(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        case "opportunity_placement_slip_generation":
          result = await this.updatePlacementSlipByActivityId(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        case "opportunity_hand_over_meet":
          result = await this.updateHandOverMeeting(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        case "opportunity_policy_confirmation":
          result = await this.updatePolicyConfirmationById(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        case "opportunity_policy_hard_copy":
          result = await this.updatePolicyHardCopyById(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        case "opportunity_policy_docket":
          result = await this.updatePolicyDocketByIdActivity(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        case "opportunity_held_cover_note":
          result = await this.updateHeldCoverNoteById(
            opportunityActivityId,
            activityMetaData,
            userId
          );
          break;

        // Add other cases for different activities here

        default:
          throw new BadRequestException(
            `Unsupported opportunity table: ${opportunityTable}`
          );
      }

      const message = getMessage(activityMetaData.activityStatusKey);
      return { result, message };
    } catch (error) {
      console.error("Error in updateOpportunityMeta:", error);
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.getResponse());
      }
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to update Opportunity Activity."
      );
    }
  }

  async getKdmMeeting(opportunityActivityId: number): Promise<any> {
    try {
      return await this.opportunityRepository.getMeetingDetailsById(
        opportunityActivityId
      );
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving meeting details"
          );
    }
  }

  async getHandOverMeetById(opportunityActivityId: number): Promise<any> {
    try {
      return await this.opportunityRepository.gethandOverMeetDetailsById(
        opportunityActivityId
      );
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving meeting details"
          );
    }
  }

  async getRfpDataByOpportunityId(opportunityActivityId: number) {
    try {
      const [rfpActivityDetails, documents] = await Promise.all([
        this.opportunityRepository.getRfpActivityDetails(opportunityActivityId),
        this.opportunityRepository.getRfpActivityDocuments(
          opportunityActivityId
        ),
      ]);
      const rfpCoverData =
        await this.opportunityRepository.getRfpCoverDetailsByOpportunityId(
          rfpActivityDetails.opportunityId
        );

      return {
        opportunityActivityId: Number(opportunityActivityId),
        statusLid: rfpActivityDetails.statusLid,
        dataActivity: {
          coversConfig: rfpCoverData
            ? rfpCoverData.reduce((acc: Record<string, string>, cover) => {
                acc[cover.coverMapId] = cover.coverResponse;
                return acc;
              }, {})
            : {},
          remarksSection: {
            remarks: rfpActivityDetails?.remarks || null,
          },
          documents,
        },
      };
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving RFP data by opportunity activity ID"
          );
    }
  }

  async getRfpDetailsByOpportunityActivityId(
    opportunityActivityId: number
  ): Promise<any> {
    try {
      const rfpDetailsEntryData =
        await this.opportunityRepository.getRfpDetailsEntryByOpportunityActivityId(
          opportunityActivityId
        );

      const preferredStatusId = await this.LookUpService.getLookUpsByKey(
        PREFERENCE_STATUS_PREFERRED
      );

      const excludedStatusId = await this.LookUpService.getLookUpsByKey(
        PREFERENCE_STATUS_EXCLUDED
      );

      // Map the entity fields to the required response format
      const response = {
        opportunityActivityId: rfpDetailsEntryData?.opportunityActivityId
          ? Number(rfpDetailsEntryData.opportunityActivityId)
          : null,
        statusLid: rfpDetailsEntryData?.statusLid
          ? Number(rfpDetailsEntryData.statusLid)
          : null,
        dataActivity: {
          descriptionRequirements: {
            description: rfpDetailsEntryData?.description || null,
            requirements: rfpDetailsEntryData?.requirements || null,
          },
          preferredInsurers: rfpDetailsEntryData?.insurerDetails
            ?.filter(
              (insurer) => insurer.preferenceTypeLid === preferredStatusId[0].id
            )
            ?.sort((a, b) => a.id - b.id)
            ?.map((insurer) => ({
              insurerId: insurer.insurerId,
              insurerLocationId: insurer.insurerLocationId,
              insurerBranchId: insurer.insurerBranchId,
              insurerContactId: insurer.insurerContactId,
            })),
          excludedInsurers: rfpDetailsEntryData?.insurerDetails
            ?.filter(
              (insurer) => insurer.preferenceTypeLid === excludedStatusId[0].id
            )
            ?.sort((a, b) => a.id - b.id)
            ?.map((insurer) => ({
              insurerId: insurer.insurerId,
              insurerLocationId: insurer.insurerLocationId,
              insurerBranchId: insurer.insurerBranchId,
              insurerContactId: insurer.insurerContactId,
            })),
          preferredTPA: rfpDetailsEntryData?.tpaDetails
            ?.filter((tpa) => tpa.preferenceTypeLid === preferredStatusId[0].id)
            ?.sort((a, b) => a.id - b.id)
            ?.map((tpa) => ({
              tpaId: tpa.tpaId,
              locationId: tpa.locationId,
              branchId: tpa.branchId,
              contactId: tpa.contactId,
            })),
          excludedTPA: rfpDetailsEntryData?.tpaDetails
            ?.filter((tpa) => tpa.preferenceTypeLid === excludedStatusId[0].id)
            ?.sort((a, b) => a.id - b.id)
            ?.map((tpa) => ({
              tpaId: tpa.tpaId,
              locationId: tpa.locationId,
              branchId: tpa.branchId,
              contactId: tpa.contactId,
            })),
          dynamicQuote: {
            multipleBrokerInvolved:
              rfpDetailsEntryData?.multipleBrokersInvolved || null,
            isMarketAllocationDone:
              rfpDetailsEntryData?.isMarketAllocationDone || null,
          },
          clientContactDetails: rfpDetailsEntryData?.clientContacts?.length
            ? {
                contactId:
                  rfpDetailsEntryData?.clientContacts[0]?.contactId || null,
                decisionInfluencers:
                  rfpDetailsEntryData?.clientContacts[0]?.clientContactInfluencers?.map(
                    (influencer) => influencer.influencerContactId
                  ) || [],
                expectedPremium:
                  rfpDetailsEntryData?.clientContacts[0]?.expectedPremium ??
                  null,
              }
            : null,
          creditSharing: rfpDetailsEntryData?.creditSharing?.map((credit) => ({
            executiveId: credit.executiveId,
            percentage: credit.percentage,
          })),
          targetQcrDate: {
            targetQcrDate: rfpDetailsEntryData?.targetQcrDate || null,
          },
          clientConsiderations: {
            clientConsiderations:
              rfpDetailsEntryData?.clientConsiderations || null,
            threatsFromExistingInsurer:
              rfpDetailsEntryData?.threatsFromExistingInsurer || null,
            threatsFromExistingBroker:
              rfpDetailsEntryData?.threatsFromExistingBroker || null,
            extraneousFactors: rfpDetailsEntryData?.extraneousFactors || null,
            planForClosingDetail:
              rfpDetailsEntryData?.planForClosingDetail || null,
          },
          remarks: {
            remarks: rfpDetailsEntryData?.remarks || null,
          },
          documents:
            rfpDetailsEntryData?.documents?.length > 0
              ? rfpDetailsEntryData?.documents?.map((doc) => ({
                  documentId: doc.documentId,
                  documentTypeLid: doc.documentTypeLid,
                }))
              : [
                  {
                    documentId: null,
                    documentTypeLid: null,
                  },
                ],
        },
      };
      const approverDetails =
        await this.opportunityRepository.getActivityApproverDetails(
          opportunityActivityId
        );
      if (approverDetails) response.approverDetails = approverDetails;
      if (rfpDetailsEntryData && rfpDetailsEntryData.opportunityId) {
        const taskType = await this.lookUpRepository.findOne({
          where: { lookUpKey: TASK_TYPE.ASSIGNED },
        });
        if (taskType) {
          const assignmentTask = await this.opportunityRepo.manager.findOne(
            Task,
            {
              where: {
                opportunityId: rfpDetailsEntryData.opportunityId,
                activityId: opportunityActivityId,
                taskTypeLid: taskType.id,
              },
              relations: ["assignee", "taskType"],
            }
          );
          response.isgAssignee = {
            id: assignmentTask?.assignee?.userId ?? null,
            name: assignmentTask?.assignee?.firstName ?? null,
          };
        }
        const opportunityData = await this.opportunityRepo.findOne({
          where: { opportunityId: rfpDetailsEntryData.opportunityId },
          relations: ["isg"],
        });
        response.isgOwner = {
          id: opportunityData?.isg?.userId ?? null,
          name: opportunityData?.isg?.firstName ?? null,
        };
      }

      return response;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving RFP data by opportunity activity ID"
          );
    }
  }

  async createPremiumCalculationActivity(
    activityMap: OpportunityActivityDataDto,
    payload: CreatePremiumCalculationDto,
    createdBy: number
  ): Promise<any> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        payload,
        LOOK_UP_DATA
      );
      // Step 2: Validate payload structure
      if (
        !payload.opportunityActivityId ||
        !payload.premiumCalculationDetails ||
        !payload.remarksSection
      ) {
        throw new BadRequestException(
          "Invalid premium calculation payload structure."
        );
      }
      // Step 3: Get opportunity activity
      const opportunityActivity =
        await this.opportunityRepository.getOpportunityActivity(
          payload.opportunityActivityId
        );
      if (!opportunityActivity) {
        throw new NotFoundException(
          `Opportunity Activity with ID ${payload.opportunityActivityId} not found.`
        );
      }
      const opportunityData =
        await this.opportunityRepository.getPolicyDetailsByOpportunityId(
          activityMap.opportunityId
        );

      if (!opportunityData) {
        throw new NotFoundException(
          `Opportunity Data with ID ${activityMap.opportunityId} not found.`
        );
      }
      const opportunityId = opportunityActivity.opportunityId;
      const policyTypeId = opportunityData.policyType.id;
      const coverType = await this.lookUpRepository.findOne({
        where: { lookUpKey: COVER_TYPE.ASSET },
      });
      if (!coverType?.id) {
        throw new NotFoundException(`Asset Cover type not found.`);
      }
      // Step 4: Get premium calculation covers (similar to getOpportunityRfpCovers)
      const covers =
        await this.opportunityRepository.getPremiumCalculationCovers(
          opportunityId,
          policyTypeId,
          coverType.id
        );
      if (!covers.length) {
        throw new NotFoundException(
          `No premium calculation covers found for Opportunity ID ${opportunityId}.`
        );
      }

      // Step 5: Prepare premium calculation details (similar to prepareRfpCoverDetails)
      const premiumCalculationCoverDetails =
        await this.preparePremiumCalculationDetails(
          covers,
          payload.premiumCalculationDetails,
          opportunityId,
          createdBy
        );

      // Step 6: Save premium calculation details (similar to saveRfpCoverDetails)
      const premiumCalculationActivityData =
        await this.opportunityRepository.savePremiumCalculationDetails(
          opportunityId,
          activityMap.activityId,
          payload.opportunityActivityId,
          premiumCalculationCoverDetails,
          payload?.remarksSection?.remarks ?? null,
          payload.documents,
          createdBy,
          payload.statusLid
        );

      // update the OpportunityActivityMap with the new status
      await this.opportunityRepository.updateOpportunityActivityMapStatus(
        premiumCalculationActivityData.opportunityActivityId,
        premiumCalculationActivityData.statusLid,
        createdBy,
        payload.activityStatusKey === ACTIVITY_STATUS.COMPLETE
          ? new Date()
          : null,
        undefined,
        payload.activityStatusKey
      );
      if (payload.activityStatusKey === ACTIVITY_STATUS.COMPLETE) {
        await this.opportunityRepository.updateNextActivityStatus(
          premiumCalculationActivityData.opportunityActivityId,
          premiumCalculationActivityData.statusLid
        );
      }
      return premiumCalculationActivityData;
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.opportunityActivityMetaUpdateFailed
      );
    }
  }

  async createHeldCoverNoteActivity(
    opportunityActivity: OpportunityActivityDto,
    activityMetaData: CreateOpportunityHeldCoverNoteDto,
    userId: number
  ): Promise<any> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        activityMetaData,
        LOOK_UP_DATA
      );

      const heldCoverNoteData = await this.handleHeldCoverNoteActivity(
        opportunityActivity,
        activityMetaData,
        userId
      );

      return await this.getHeldCoverNoteActivity(
        heldCoverNoteData.opportunityActivityId
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create held cover note activity: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async handleHeldCoverNoteActivity(
    opportunityActivity: OpportunityActivityDto,
    activityMetaData: CreateOpportunityHeldCoverNoteDto,
    userId: number
  ) {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const {
          opportunityActivityId,
          statusLid,
          activityStatusKey,
          placementSlipDeviationsSection,
          deviationSection,
          deviationsAddressedSection,
          premiumReceiptDetailsSection,
          installmentDetails = [],
          remarksSection,
          insurerDetails,
          basicCovers,
          documents,
          ...rest
        } = activityMetaData;
        // Create the held cover note object
        const heldCoverNoteObject = this.removeUndefinedFields({
          opportunityId: opportunityActivity.opportunityId,
          activityId: opportunityActivity.activityId,
          opportunityActivityId: opportunityActivityId,
          statusLid: statusLid,
          placementSlipDeviationsLid:
            placementSlipDeviationsSection.placementSlipDeviationsLid,
          deviations: deviationSection.deviations,
          remarks: remarksSection.remarks,
          ...deviationsAddressedSection,
          ...premiumReceiptDetailsSection,
        });

        // Save held cover note
        const heldCoverNoteData =
          await this.opportunityRepository.saveHeldCoverNote(
            entityManager,
            opportunityActivityId,
            heldCoverNoteObject,
            userId,
            activityStatusKey
          );

        await this.opportunityRepository.saveHeldCoverNoteInstallments(
          entityManager,
          heldCoverNoteData.id,
          opportunityActivityId,
          installmentDetails,
          userId
        );

        if (activityStatusKey === ACTIVITY_STATUS.APPROVE) {
          // update policy insurer details
          await this.opportunityRepository.updatePolicyInsurerDetails(
            entityManager,
            OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS.HELD_COVER_NOTE_INSURER_DETAILS,
            OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS.HELD_COVER_NOTE_ID,
            heldCoverNoteData.id,
            heldCoverNoteData.opportunityId
          );
          // Update policy with deviation covers
          if (basicCovers) {
            await this.opportunityRepository.updatePolicyCovers(
              entityManager,
              basicCovers
            );
          }
          const policyCreateSyncPayload =
            extractPolicyFinancialFields(heldCoverNoteObject);
          this.logInfo(
            "handleHeldCoverNoteActivity",
            "Policy update payload",
            policyCreateSyncPayload
          );
          if (Object.keys(policyCreateSyncPayload).length > 0) {
            await this.updatePolicyDetails(
              entityManager,
              opportunityActivity.opportunityId as number,
              {
                ...policyCreateSyncPayload,
                updatedBy: userId,
                updatedAt: new Date(),
              }
            );
          }
          await this.opportunityRepository.replacePolicyInstallments(
            entityManager,
            opportunityActivity.opportunityId,
            installmentDetails,
            userId
          );
          // If it has deviation, creating a notification for the user;
          if (deviationSection?.deviations) {
            const url = `${ENV.CLIENT_SERVER_URL}opportunities/${heldCoverNoteData.opportunityId}`;
            await this.sendNotification(
              NOTIFICATION_EVENT_TYPES.HELD_COVER_NOTE_DEVIATION,
              url,
              userId,
              true,
              true
            );
          }
          return heldCoverNoteData;
        }
        // Save documents
        if (documents) {
          await this.opportunityRepository.saveActivityDocuments(
            entityManager,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.HELD_COVER_NOTE_DOCUMENT_MAP,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.HELD_COVER_NOTE_ID,
            heldCoverNoteData.id,
            documents
          );
          // Update document status
          await this.opportunityRepository.updateDocumentStatus(
            entityManager,
            documents.map((doc) => doc.documentId)
          );
        }

        let insurerData;
        if (insurerDetails) {
          insurerData =
            await this.opportunityRepository.checkInsurerAndBrokerageDetails(
              insurerDetails,
              premiumReceiptDetailsSection?.basicPremium,
              premiumReceiptDetailsSection?.policyPlacedTypeLid
            );
          if (insurerData) {
            await this.opportunityRepository.saveDeviationInsurerDetails(
              entityManager,
              OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS.HELD_COVER_NOTE_INSURER_DETAILS,
              OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS.HELD_COVER_NOTE_ID,
              heldCoverNoteData.id,
              insurerData,
              userId
            );
          }
        }

        // Save deviation covers
        if (basicCovers) {
          await this.opportunityRepository.saveDeviationCovers(
            entityManager,
            heldCoverNoteData.id,
            basicCovers,
            heldCoverNoteData.opportunityId,
            COVERS_TABLE.HELD_COVER_NOTE,
            userId
          );
        }

        // update the OpportunityActivityMap with the new status
        await this.opportunityRepository.updateOpportunityActivityMapStatus(
          opportunityActivityId,
          statusLid,
          userId,
          activityStatusKey === ACTIVITY_STATUS.COMPLETE ? new Date() : null,
          entityManager,
          activityStatusKey
        );

        await this.opportunityRepository.updateNextActivityStatus(
          opportunityActivityId,
          statusLid,
          entityManager
        );

        if (activityStatusKey === ACTIVITY_STATUS.SUBMIT) {
          const needsApproval =
            await this.opportunityRepository.isOpportunityActivityNeedsApproval(
              heldCoverNoteData.opportunityActivityId
            );
          if (needsApproval) {
            await this.createAndAssignTask(
              opportunityActivityId,
              entityManager,
              ACL_CATEGORY.ISG_ACTIVITY,
              ACL_ACTIONS.APPROVE_ISG,
              userId,
              APPROVAL_TASK_NAMES.HELD_COVER_NOTE_TASK,
              TASK_TYPE.APPROVAL
            );
          }
        }

        return heldCoverNoteData;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to handle held cover note activity: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getOpportunityCoversMeta(
    opportunityId: number,
    activityId?: number
  ): Promise<any> {
    try {
      const CoverType = await this.lookUpRepository.findOne({
        where: {
          lookUpKey: COVER_TYPE.ASSET,
        },
      });
      if (!CoverType) {
        throw new NotFoundException(`Asset Cover type not found.`);
      }
      const excludeCoverTypes: any = [];
      let sectionHeading = "Combined Coverage Details",
        sectionSubHeading = "Details of all combined coverage options";
      let covers = await this.opportunityRepository.getOpportunityCovers(
        opportunityId,
        excludeCoverTypes
      );

      if (activityId) {
        const activityData = await this.opportunityRepository.getActivityById(
          activityId
        );
        if (activityData?.name === PREMIUM_CALCULATION) {
          const premiumCovers =
            await this.opportunityRepository.getAllPremiumCalculationCovers(
              opportunityId,
              CoverType?.id
            );
          covers = premiumCovers;
          sectionHeading = "Premium Calculation Covers";
          sectionSubHeading = "Premium Calculation Details of asset coverage";
        }
        // Hide covers whose "show until activity" cutoff is before this activity.
        // Use the opportunity_activity_map key (mstr_activity.activity_key is
        // not reliably populated).
        const activityKey =
          await this.opportunityRepository.getActivityKeyForOpportunity(
            opportunityId,
            activityId
          );
        covers = filterCoversByActivity(covers, activityKey ?? "");
      }

      const formConfig = covers.flatMap((cover: any) =>
        (cover.coversMeta?.formConfig || []).map((config: any) => ({
          ...config,
          id: String(cover.id),
          key: String(cover.id),
          name: String(cover.id),
        }))
      );

      const sectionIds = Array.from(
        new Set(
          covers
            .map((cover: any) => cover?.sectionId)
            .filter((sectionId: any) => Number.isInteger(sectionId))
        )
      ) as number[];

      let sectionMap = new Map<
        number,
        { id: number; name: string; key: string; displaySequence: number }
      >();

      if (sectionIds.length > 0) {
        const sections = await this.mstrCoverSectionRepository.find({
          where: { id: In(sectionIds), isActive: true },
          select: ["id", "name", "key", "displaySequence"],
          order: { displaySequence: "ASC", id: "ASC" },
        });

        sectionMap = new Map(sections.map((section) => [section.id, section]));
      }

      const defaultcoverValues = covers.reduce(
        (acc, cover) => ({
          ...acc,
          ...(cover.coversMeta?.defaultValues ?? {}),
        }),
        {}
      );

      // Build a render plan from the flat formConfig order so sectioned and
      // unmapped fields can be rendered deterministically without breaking
      // existing consumers that still rely on formConfig.
      const getFieldIdentifiers = (field: any): string[] => {
        const values = [field?.id, field?.key, field?.name];
        return Array.from(
          new Set(
            values
              .filter(
                (value) => value !== null && value !== undefined && value !== ""
              )
              .map((value) => String(value))
          )
        );
      };

      const fieldToSection = new Map<
        string,
        { sectionId: number; sectionName: string; sectionKey: string }
      >();

      covers.forEach((cover: any) => {
        if (!Number.isInteger(cover?.sectionId)) {
          return;
        }

        const section = sectionMap.get(cover.sectionId);
        if (!section) {
          return;
        }

        const normalizedCoverFields = (cover.coversMeta?.formConfig || []).map(
          (config: any) => ({
            ...config,
            id: String(cover.id),
            key: String(cover.id),
            name: String(cover.id),
          })
        );

        normalizedCoverFields.forEach((field: any) => {
          getFieldIdentifiers(field).forEach((identifier) => {
            if (!fieldToSection.has(identifier)) {
              fieldToSection.set(identifier, {
                sectionId: section.id,
                sectionName: section.name,
                sectionKey: section.key,
              });
            }
          });
        });
      });

      const sectionRenderPlan: {
        blocks: Array<
          | {
              type: "section";
              sectionId: number;
              sectionName: string;
              sectionKey: string;
              fields: any[];
            }
          | { type: "unmapped"; fields: any[] }
        >;
      } = {
        blocks: [],
      };

      formConfig.forEach((field: any) => {
        const mappedSection = getFieldIdentifiers(field)
          .map((identifier) => fieldToSection.get(identifier))
          .find(Boolean);
        const previousBlock =
          sectionRenderPlan.blocks[sectionRenderPlan.blocks.length - 1];

        if (!mappedSection) {
          if (previousBlock?.type === "unmapped") {
            previousBlock.fields.push(field);
            return;
          }

          sectionRenderPlan.blocks.push({
            type: "unmapped",
            fields: [field],
          });
          return;
        }

        const canAppendToPreviousSection =
          previousBlock?.type === "section" &&
          previousBlock.sectionId === mappedSection.sectionId;

        if (canAppendToPreviousSection) {
          previousBlock.fields.push(field);
          return;
        }

        sectionRenderPlan.blocks.push({
          type: "section",
          sectionId: mappedSection.sectionId,
          sectionName: mappedSection.sectionName,
          sectionKey: mappedSection.sectionKey,
          fields: [field],
        });
      });

      return {
        formConfig,
        sectionRenderPlan,
        isMultiple: false,
        defaultcoverValues,
        sectionHeading: sectionHeading,
        sectionSubHeading: sectionSubHeading,
      };
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new InternalServerErrorException(
            error instanceof Error
              ? error.message
              : "Error retrieving opportunity covers meta"
          );
    }
  }

  // Creates a mandate entry.
  async createMandate(
    activityMetaData: CreateMandateDto,
    userId: number
  ): Promise<any> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        activityMetaData,
        LOOK_UP_DATA
      );

      return await this.handleMandate(activityMetaData, userId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    }
  }

  async handleMandate(activityMetaData: CreateMandateDto, userId: number) {
    try {
      const {
        opportunityActivityId,
        statusLid,
        activityStatusKey,
        mandateDetailsFromFields,
        documents,
        ...rest
      } = activityMetaData;
      return await this.dataSource.transaction(async (entityManager) => {
        const opportunityActivity =
          await this.opportunityRepository.getOpportunityActivityById(
            opportunityActivityId
          );

        if (activityStatusKey === ACTIVITY_STATUS.COMPLETE) {
          if (!documents || documents.length === 0) {
            throw new BadRequestException(
              "Documents are required to create a mandate."
            );
          }
          if (mandateDetailsFromFields.compensationPayable <= 0) {
            throw new BadRequestException(
              "Compensation payable must be greater than 0"
            );
          }
        }

        // create mandate details entry record
        const mandateData = this.removeUndefinedFields({
          opportunityId: opportunityActivity.opportunityId,
          activityId: opportunityActivity.activityId,
          statusLid: statusLid,
          planDate: opportunityActivity.plannedDate,
          mandateTypeLid: mandateDetailsFromFields?.mandateTypeLid,
          validFrom: mandateDetailsFromFields?.validFrom,
          validTo: mandateDetailsFromFields?.validTo,
          compensationPayable: mandateDetailsFromFields?.compensationPayable,
          compensationTypeLid: mandateDetailsFromFields?.compensationTypeLid,
          issuedOn: mandateDetailsFromFields?.issuedOn,
          remarks: mandateDetailsFromFields?.remarks,
        });
        const savedMandate =
          await this.opportunityRepository.saveMandateDetailsEntry(
            entityManager,
            opportunityActivityId,
            mandateData,
            userId
          );
        const mandateDetailsContacts =
          mandateDetailsFromFields?.mandateDetailsContacts;
        // Save contacts
        if (mandateDetailsContacts) {
          await this.opportunityRepository.saveMandateContacts(
            entityManager,
            savedMandate.id,
            savedMandate.companyId,
            mandateDetailsContacts
          );
        }
        // Save documents
        if (documents) {
          await this.opportunityRepository.saveMandateDocuments(
            entityManager,
            savedMandate.id,
            documents
          );
          await this.opportunityRepository.updateDocumentStatus(
            entityManager,
            documents?.map((doc) => doc.documentId) || []
          );
        }
        // update the OpportunityActivityMap with the new status
        await this.opportunityRepository.updateOpportunityActivityMapStatus(
          opportunityActivityId,
          statusLid,
          userId,
          ACTIVITY_STATUS.COMPLETE === activityStatusKey ? new Date() : null,
          entityManager,
          activityStatusKey
        );

        await this.opportunityRepository.updateNextActivityStatus(
          opportunityActivityId,
          savedMandate.statusLid,
          entityManager
        );
        return savedMandate;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to handle mandate details entry: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async updateMandate(
    opportunityActivityId: number,
    updateMandateDto: UpdateMandateDto,
    userId: number
  ): Promise<any> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        updateMandateDto,
        LOOK_UP_DATA
      );
      updateMandateDto.opportunityActivityId = opportunityActivityId;
      return await this.handleMandate(updateMandateDto, userId);
    } catch (error) {
      throw error instanceof NotFoundException ||
        error instanceof BadRequestException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error updating mandate details"
          );
    }
  }

  async createOpportunityRfpDetailsEntry(
    opportunityActivityData: OpportunityActivityDto,
    createOpportunityRfpDetailsEntryDto: CreateOpportunityRfpDetailsEntryDto,
    userId: number
  ) {
    try {
      // Validate dynamic lookup values
      await this.lookUpValidation.validateDynamicLookupValues(
        createOpportunityRfpDetailsEntryDto,
        LOOK_UP_DATA
      );

      await this.dataSource.transaction(async (entityManager) => {
        const {
          preferredTPA,
          excludedTPA,
          preferredInsurers,
          excludedInsurers,
          clientContactDetails,
          creditSharing,
          documents,
          descriptionRequirements,
          dynamicQuote,
          targetQcrDate,
          clientConsiderations,
          remarks,
          ...rfpDetailsData
        } = createOpportunityRfpDetailsEntryDto;
        const mappedRfpDetailsData = this.removeUndefinedFields({
          opportunityId: opportunityActivityData.opportunityId,
          activityId: opportunityActivityData.activityId,
          opportunityActivityId: rfpDetailsData.opportunityActivityId,
          description: descriptionRequirements?.description,
          requirements: descriptionRequirements?.requirements,
          targetQcrDate: targetQcrDate?.targetQcrDate
            ? new Date(targetQcrDate?.targetQcrDate)
            : undefined,
          multipleBrokersInvolved: dynamicQuote?.multipleBrokerInvolved,
          isMarketAllocationDone: dynamicQuote?.isMarketAllocationDone,
          clientConsiderations: clientConsiderations?.clientConsiderations,
          threatsFromExistingInsurer:
            clientConsiderations?.threatsFromExistingInsurer,
          threatsFromExistingBroker:
            clientConsiderations?.threatsFromExistingBroker,
          extraneousFactors: clientConsiderations?.extraneousFactors,
          planForClosingDetail: clientConsiderations?.planForClosingDetail,
          remarks: remarks?.remarks,
          statusLid: rfpDetailsData.statusLid,
        });

        await this.handleRfpDetailsEntry(
          entityManager,
          mappedRfpDetailsData,
          preferredTPA,
          excludedTPA,
          preferredInsurers,
          excludedInsurers,
          clientContactDetails,
          creditSharing,
          documents,
          rfpDetailsData,
          userId
        );
      });
      return this.getRfpDetailsByOpportunityActivityId(
        createOpportunityRfpDetailsEntryDto.opportunityActivityId
      );
    } catch (error) {
      this.logError("createOpportunityRfpDetailsEntry", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save opportunity rfp details entry: ${error.message}`
      );
    }
  }

  async updateOpportunityRfpDetailsEntry(
    opportunityActivityId: number,
    updateOpportunityRfpDetailsEntryDto: UpdateRfpDetailsEntryDto,
    userId: number
  ): Promise<any> {
    try {
      // Validate dynamic lookup values
      await this.lookUpValidation.validateDynamicLookupValues(
        updateOpportunityRfpDetailsEntryDto,
        LOOK_UP_DATA
      );

      await this.dataSource.transaction(async (entityManager) => {
        const {
          preferredTPA,
          excludedTPA,
          preferredInsurers,
          excludedInsurers,
          clientContactDetails,
          creditSharing,
          documents,
          descriptionRequirements,
          dynamicQuote,
          targetQcrDate,
          clientConsiderations,
          remarks,
          ...rfpDetailsData
        } = updateOpportunityRfpDetailsEntryDto;
        const mappedRfpDetailsData = this.removeUndefinedFields({
          opportunityActivityId: opportunityActivityId,
          description: descriptionRequirements?.description,
          requirements: descriptionRequirements?.requirements,
          targetQcrDate: targetQcrDate?.targetQcrDate,
          multipleBrokersInvolved: dynamicQuote?.multipleBrokerInvolved,
          isMarketAllocationDone: dynamicQuote?.isMarketAllocationDone,
          clientConsiderations: clientConsiderations?.clientConsiderations,
          threatsFromExistingInsurer:
            clientConsiderations?.threatsFromExistingInsurer,
          threatsFromExistingBroker:
            clientConsiderations?.threatsFromExistingBroker,
          extraneousFactors: clientConsiderations?.extraneousFactors,
          planForClosingDetail: clientConsiderations?.planForClosingDetail,
          remarks: remarks?.remarks,
          statusLid: updateOpportunityRfpDetailsEntryDto.statusLid,
        });

        await this.handleRfpDetailsEntry(
          entityManager,
          mappedRfpDetailsData,
          preferredTPA,
          excludedTPA,
          preferredInsurers,
          excludedInsurers,
          clientContactDetails,
          creditSharing,
          documents,
          rfpDetailsData,
          userId
        );
      });
      return this.getRfpDetailsByOpportunityActivityId(opportunityActivityId);
    } catch (error) {
      this.logError("updateOpportunityRfpDetailsEntry", error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update RFP Details Entry: ${error.message}`
      );
    }
  }

  async handleRfpDetailsEntry(
    entityManager: EntityManager,
    mappedRfpDetailsData: Partial<OpportunityRfpDetailsEntry>,
    preferredTPA: CreateRfpTpaDetailsDto[],
    excludedTPA: CreateRfpTpaDetailsDto[],
    preferredInsurers: CreateRfpInsurerDetailsDto[],
    excludedInsurers: CreateRfpInsurerDetailsDto[],
    clientContactDetails: CreateRfpClientContactDetailsDto,
    creditSharing: CreateRfpCreditSharingDto[],
    documents: OpportunityActivityDocumentDto[],
    rfpDetailsData: any,
    userId: number
  ) {
    try {
      const insurerTypeLookups = await getLookups(
        this.lookUpRepository,
        [
          PREFERENCE_STATUS_PREFERRED,
          PREFERENCE_STATUS_EXCLUDED,
          OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED,
        ],
        LOOK_UP_FIELD.KEY
      );
      const lookups = await getLookup(
        insurerTypeLookups,
        [
          PREFERENCE_STATUS_PREFERRED,
          PREFERENCE_STATUS_EXCLUDED,
          OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED,
        ],
        LOOK_UP_FIELD.KEY
      );
      const preferredStatusId =
        lookups[`lookup_${PREFERENCE_STATUS_PREFERRED}`].id;
      const excludedStatusId =
        lookups[`lookup_${PREFERENCE_STATUS_EXCLUDED}`].id;
      // Create main RFP Details Entry
      const rfpDetailsEntry =
        await this.opportunityRepository.saveOpportunityRfpDetailsEntry(
          entityManager,
          rfpDetailsData.opportunityActivityId,
          mappedRfpDetailsData,
          userId
        );
      // Handle TPA Details
      if (
        (preferredTPA && preferredTPA.length > 0) ||
        (excludedTPA && excludedTPA.length > 0)
      ) {
        const tpaDetails = [
          ...(preferredTPA || []).map((tpa) => ({
            ...tpa,
            preferenceTypeLid: preferredStatusId,
          })),
          ...(excludedTPA || []).map((tpa) => ({
            ...tpa,
            preferenceTypeLid: excludedStatusId,
          })),
        ];
        await this.opportunityRepository.saveRfpPreferenceDetails(
          entityManager,
          rfpDetailsEntry.id,
          tpaDetails,
          userId,
          OpportunityRfpTpaDetail,
          "tpaId"
        );
      }
      // Handle Insurer Details
      if (
        (preferredInsurers && preferredInsurers.length > 0) ||
        (excludedInsurers && excludedInsurers.length > 0)
      ) {
        const insurerDetails = [
          ...(preferredInsurers || []).map((insurer) => ({
            ...insurer,
            preferenceTypeLid: preferredStatusId,
          })),
          ...(excludedInsurers || []).map((insurer) => ({
            ...insurer,
            preferenceTypeLid: excludedStatusId,
          })),
        ];
        await this.opportunityRepository.saveRfpPreferenceDetails(
          entityManager,
          rfpDetailsEntry.id,
          insurerDetails,
          userId,
          OpportunityRfpInsurerDetail,
          "insurerId"
        );
      }
      // Handle Client Contact Details
      if (clientContactDetails && Object.keys(clientContactDetails).length) {
        await this.opportunityRepository.saveRfpClientContactDetails(
          entityManager,
          rfpDetailsEntry.id,
          clientContactDetails,
          userId
        );
      }
      // Handle Credit Sharing
      if (creditSharing) {
        await this.opportunityRepository.saveRfpCreditSharing(
          entityManager,
          rfpDetailsEntry.id,
          creditSharing,
          userId
        );
      }
      // Handle Documents
      if (documents) {
        await this.opportunityRepository.saveActivityDocuments(
          entityManager,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.RFP_DETAILS_ENTRY_DOCUMENT_MAP,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.RFP_DETAILS_ENTRY_DOCUMENT_MAP_ID,
          rfpDetailsEntry.id,
          documents
        );
        await this.opportunityRepository.updateDocumentStatus(
          entityManager,
          documents.map((doc) => doc.documentId) || []
        );
      }
      if (
        rfpDetailsData.statusLid ===
        lookups[`lookup_${OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED}`].id
      ) {
        await this.createAndAssignTask(
          rfpDetailsData.opportunityActivityId,
          entityManager,
          ACL_CATEGORY.BD_ACTIVITY,
          ACL_ACTIONS.APPROVE_BD,
          userId,
          APPROVAL_TASK_NAMES.RFP_DETAILS_ENTRY,
          TASK_TYPE.APPROVAL
        );
      }

      // update the OpportunityActivityMap with the new status
      await this.opportunityRepository.updateOpportunityActivityMapStatus(
        rfpDetailsData.opportunityActivityId,
        rfpDetailsData.statusLid,
        userId,
        rfpDetailsData.activityStatusKey == ACTIVITY_STATUS.COMPLETE
          ? new Date()
          : null,
        entityManager,
        rfpDetailsData.activityStatusKey
      );
    } catch (error) {
      this.logError("handleRfpDetailsEntry", error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Faild to save rfp details: ${error.message}`
      );
    }
  }

  // Retrieves mandate details by opportunity activity ID
  async getMandateDetailsByOpportunityActivityId(
    opportunityActivityId: number
  ): Promise<any> {
    try {
      const { opportunityId, activityId } =
        (await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        )) || {};

      if (!opportunityId || !activityId) {
        throw new NotFoundException(
          `Opportunity Activity not found for ID: ${opportunityActivityId}`
        );
      }
      // Query the repository
      const mandateDetails =
        await this.opportunityRepository.getMandateDetailsByOpportunityAndActivity(
          opportunityId,
          activityId
        );
      return mandateDetails;
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to retrieve mandate details"
      );
    }
  }

  // Retrieves existing mandate details by opportunity activity ID.
  async getExistingMandateDetails(opportunityActivityId: number) {
    try {
      return await this.opportunityRepository.getExistingMandateDetails(
        opportunityActivityId
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        "Error retrieving mandate details ",
        error.message
      );
    }
  }

  async createPolicyConfirmationActivity(
    OpportunityActivityMap: OpportunityActivityDto,
    activityMetaData: CreatePolicyConfirmationDto,
    userId: number
  ): Promise<any> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        activityMetaData,
        LOOK_UP_DATA
      );

      return await this.handlePolicyConfirmation(
        OpportunityActivityMap,
        activityMetaData,
        userId
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create policy confirmation activity: ${error.message}`
      );
    }
  }

  async handlePolicyConfirmation(
    opportunityActivityData: OpportunityActivityDto,
    activityMetaData: CreatePolicyConfirmationDto | UpdatePolicyConfirmationDto,
    userId: number
  ) {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const {
          opportunityActivityId,
          statusLid,
          activityStatusKey,
          policyDataWrongSection,
          deviationSection,
          policyDataRectifiedSection,
          installmentDetails = [],
          remarks,
          insurerDetails,
          documents,
          ...rest
        } = activityMetaData;
        // Create the policy confirmation record
        const policyConfirmationObject = this.removeUndefinedFields({
          opportunityId: opportunityActivityData.opportunityId,
          activityId: opportunityActivityData.activityId,
          opportunityActivityId,
          statusLid,
          policyDataWrongLid: policyDataWrongSection?.policyDataWrongLid,
          deviations: deviationSection?.deviations,
          remarks: remarks?.remarks,
          ...policyDataRectifiedSection,
        });
        // Save policy confirmation
        const policyConfirmationData =
          await this.opportunityRepository.savePolicyConfirmation(
            entityManager,
            opportunityActivityData.id,
            policyConfirmationObject,
            userId
          );

        await this.opportunityRepository.savePolicyConfirmationInstallments(
          entityManager,
          policyConfirmationData.id,
          opportunityActivityId,
          installmentDetails,
          userId
        );
        // Save documents
        if (documents) {
          await this.opportunityRepository.saveActivityDocuments(
            entityManager,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.POLICY_CONFIRMATION_DOCUMENT_MAP,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.POLICY_CONFIRMATION_ID,
            policyConfirmationData.id,
            documents
          );
          await this.opportunityRepository.updateDocumentStatus(
            entityManager,
            documents.map((doc) => doc.documentId)
          );
        }
        // Save insurer details
        let insurerData;
        if (insurerDetails) {
          insurerData =
            await this.opportunityRepository.checkInsurerAndBrokerageDetails(
              insurerDetails,
              policyDataRectifiedSection?.basicPremium,
              policyDataRectifiedSection?.policyPlacedTypeLid
            );
          if (insurerData) {
            await this.opportunityRepository.saveDeviationInsurerDetails(
              entityManager,
              OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS.POLICY_CONFIRMATION_INSURER_DETAILS,
              OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS.POLICY_CONFIRMATION_ID,
              policyConfirmationData.id,
              insurerData,
              userId
            );
          }
        }
        if (activityStatusKey === ACTIVITY_STATUS.COMPLETE) {
          // update policy insurer details
          await this.opportunityRepository.updatePolicyInsurerDetails(
            entityManager,
            OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS.POLICY_CONFIRMATION_INSURER_DETAILS,
            OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS.POLICY_CONFIRMATION_ID,
            policyConfirmationData.id,
            opportunityActivityData.opportunityId
          );
          // Update policy with brokerage details if provided
          const policyConfirmationSyncPayload = extractPolicyFinancialFields(
            policyConfirmationObject
          );
          this.logInfo(
            "handlePolicyConfirmation",
            "Policy update payload:",
            policyConfirmationSyncPayload
          );
          if (Object.keys(policyConfirmationSyncPayload).length > 0) {
            await this.updatePolicyDetails(
              entityManager,
              opportunityActivityData.opportunityId as number,
              {
                ...policyConfirmationSyncPayload,
                updatedBy: userId,
                updatedAt: new Date(),
              }
            );
          }
          await this.opportunityRepository.replacePolicyInstallments(
            entityManager,
            opportunityActivityData.opportunityId,
            installmentDetails,
            userId
          );
          // update deviation tasks
          await this.opportunityRepository.closeDeviationTasks(
            entityManager,
            opportunityActivityId,
            statusLid,
            userId
          );
          if (policyConfirmationData.deviations) {
            const url = `${ENV.CLIENT_SERVER_URL}opportunities/${policyConfirmationData.opportunityId}`;
            await this.sendNotification(
              NOTIFICATION_EVENT_TYPES.POLICY_CONFIRMATION_DEVIATION,
              url,
              userId,
              true,
              true
            );
          }
          // Move the opportunity to WON on Policy Confirmation completion
          await this.opportunityRepository.updateOpportunityStatus(
            entityManager,
            opportunityActivityData.opportunityId as number,
            OPPORTUNITY_STATUS_WON
          );
        }
        // update the OpportunityActivityMap with the new status
        await this.opportunityRepository.updateOpportunityActivityMapStatus(
          opportunityActivityId,
          statusLid,
          userId,
          activityStatusKey == ACTIVITY_STATUS.COMPLETE ? new Date() : null,
          entityManager,
          activityStatusKey
        );
        // update next activity status
        await this.opportunityRepository.updateNextActivityStatus(
          opportunityActivityId,
          statusLid,
          entityManager
        );
        return { id: policyConfirmationData.id, ...activityMetaData };
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to handle policy confirmation activity: ${error.message}`
      );
    }
  }

  async createPolicyHardCopyActivity(
    opportunityActivity: OpportunityActivityDto,
    activityMetaData: CreatePolicyHardCopyDto,
    userId: number
  ): Promise<any> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        activityMetaData,
        LOOK_UP_DATA
      );

      const policyHardCopyData = await this.handlePolicyHardCopy(
        opportunityActivity,
        activityMetaData,
        userId
      );

      return { id: policyHardCopyData.id, ...activityMetaData };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.opportunityActivityMetaUpdateFailed
      );
    }
  }

  async handlePolicyHardCopy(
    opportunityActivity: OpportunityActivityDto,
    activityMetaData: CreatePolicyHardCopyDto,
    userId: number
  ) {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const {
          opportunityActivityId,
          statusLid,
          activityStatusKey,
          insurerPolicyHardCopyDetails,
          deviationSection,
          deviationsAddressedSection,
          installmentDetails = [],
          remarks,
          documents,
          insurerDetails,
          policyHardCopyCoversConfig,
          ...rest
        } = activityMetaData;
        // Create the policy hard copy object
        const policyHardCopyObject = this.removeUndefinedFields({
          opportunityId: opportunityActivity.opportunityId,
          activityId: opportunityActivity.activityId,
          statusLid: statusLid,
          opportunityActivityId: opportunityActivityId,
          remarks: remarks?.remarks,
          ...insurerPolicyHardCopyDetails,
          ...deviationSection,
          ...deviationsAddressedSection,
        });
        // Save policy hard copy
        const policyHardCopyData =
          await this.opportunityRepository.savePolicyHardCopyReceipt(
            entityManager,
            opportunityActivityId,
            policyHardCopyObject,
            userId
          );

        await this.opportunityRepository.savePolicyHardCopyInstallments(
          entityManager,
          policyHardCopyData.id,
          opportunityActivityId,
          installmentDetails,
          userId
        );
        // Save documents
        if (documents) {
          await this.opportunityRepository.saveActivityDocuments(
            entityManager,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.POLICY_HARD_COPY_DOCUMENT_MAP,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.POLICY_HARD_COPY_ID,
            policyHardCopyData.id,
            documents
          );
          // Update document status
          await this.opportunityRepository.updateDocumentStatus(
            entityManager,
            documents.map((doc) => doc.documentId)
          );
        }
        // Save insurer details
        let insurerData;
        if (insurerDetails) {
          insurerData =
            await this.opportunityRepository.checkInsurerAndBrokerageDetails(
              insurerDetails,
              deviationSection?.basicPremium,
              deviationSection?.policyPlacedTypeLid
            );
          if (insurerData) {
            await this.opportunityRepository.saveDeviationInsurerDetails(
              entityManager,
              OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS.POLICY_HARD_COPY_INSURER_DETAILS,
              OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS.POLICY_HARD_COPY_ID,
              policyHardCopyData.id,
              insurerData,
              userId
            );
          }
        }
        // Save deviation covers
        if (policyHardCopyCoversConfig) {
          await this.opportunityRepository.saveDeviationCovers(
            entityManager,
            policyHardCopyData.id,
            policyHardCopyCoversConfig,
            policyHardCopyData.opportunityId,
            COVERS_TABLE.POLICY_HARD_COPY,
            userId
          );
        }

        if (activityStatusKey === ACTIVITY_STATUS.COMPLETE) {
          // Persist insurer policy number on the base policy table
          if (policyHardCopyData.insurerPolicyNo) {
            await this.updatePolicyDetails(
              entityManager,
              policyHardCopyData.opportunityId as number,
              {
                insurerPolicyNumber:
                  policyHardCopyData.insurerPolicyNo as string,
              }
            );
          }
          // update policy insurer details
          await this.opportunityRepository.updatePolicyInsurerDetails(
            entityManager,
            OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS.POLICY_HARD_COPY_INSURER_DETAILS,
            OPPORTUNITY_DEVIATION_ACTIVITY_FIELDS.POLICY_HARD_COPY_ID,
            policyHardCopyData.id,
            opportunityActivity.opportunityId
          );
          // Update policy with deviation covers
          await this.opportunityRepository.updatePolicyCovers(
            entityManager,
            policyHardCopyCoversConfig
          );
          const policyHardCopyCreatePayload =
            extractPolicyFinancialFields(deviationSection);
          this.logInfo(
            "handlePolicyHardCopy",
            "Policy update payload:",
            policyHardCopyCreatePayload
          );
          if (Object.keys(policyHardCopyCreatePayload).length > 0) {
            await this.updatePolicyDetails(
              entityManager,
              opportunityActivity.opportunityId as number,
              {
                ...policyHardCopyCreatePayload,
                updatedBy: userId,
                updatedAt: new Date(),
              }
            );
          }
          await this.opportunityRepository.replacePolicyInstallments(
            entityManager,
            opportunityActivity.opportunityId,
            installmentDetails,
            userId
          );
          // update deviation tasks
          await this.opportunityRepository.closeDeviationTasks(
            entityManager,
            opportunityActivityId,
            statusLid,
            userId
          );
          if (deviationSection?.deviationsLid) {
            const url = `${ENV.CLIENT_SERVER_URL}opportunities/${policyHardCopyData.opportunityId}`;
            await this.sendNotification(
              NOTIFICATION_EVENT_TYPES.POLICY_HARD_COPY_RECEIPT_DEVIATION,
              url,
              userId,
              true,
              true
            );
          }
        }

        // update the OpportunityActivityMap with the new status
        await this.opportunityRepository.updateOpportunityActivityMapStatus(
          opportunityActivityId,
          statusLid,
          userId,
          activityStatusKey === ACTIVITY_STATUS.COMPLETE ? new Date() : null,
          entityManager,
          activityStatusKey
        );
        await this.opportunityRepository.updateNextActivityStatus(
          opportunityActivityId,
          statusLid,
          entityManager
        );

        return policyHardCopyData;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to handle policy hard copy activity: ${error.message}`
      );
    }
  }

  async updatePolicyDetails(
    entityManager: EntityManager,
    opportunityId: number,
    policyDetails: Partial<Policy>,
  ){
    try {
      const policy = await entityManager.findOne(Policy, {
        where: { opportunityId },
      });
      if (!policy) {
        throw new NotFoundException(
          `Policy not found for Opportunity ID: ${opportunityId}`,
        );
      }
      Object.assign(policy, this.removeUndefinedFields(policyDetails));
      await entityManager.save(policy);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update policy details: ${error.message}`,
      );
    }
  }

  async createQuote(
    opportunityActivityId: number,
    dto: CreateQuoteDto,
    userId: number
  ): Promise<any> {
    try {
      // Validate the DTO
      const savedQuote = await this.dataSource.transaction(async (manager) => {
        // Step 1: Check if opportunity exists
        const opportunity =
          await this.opportunityRepository.findOpportunityById(
            dto.opportunityId,
            manager
          );
        if (!opportunity) {
          throw new NotFoundException(
            `Opportunity with ID ${dto.opportunityId} not found.`
          );
        }
        // Step 2: Create and save the quote
        const quote = this.opportunityRepository.createQuoteEntity(
          opportunityActivityId,
          dto,
          userId
        );
        const savedQuote = await this.opportunityRepository.saveQuote(
          quote,
          manager
        );

        if (dto.documents && dto.documents.length > 0) {
          await this.opportunityRepository.updateDocumentStatus(
            manager,
            dto.documents
              ?.map((docId) => docId.documentId)
              .filter((id): id is number => typeof id === "number") || []
          );
        }
        if (dto.covers && typeof dto.covers === "object") {
          const coversArray = Object.entries(dto.covers).map(
            ([id, response]) => ({
              id: Number(id),
              response,
              quoteId: savedQuote.id,
            })
          );
          await this.addQuoteCoverDetails(
            manager,
            opportunityActivityId,
            coversArray,
            userId
          );
        }
        if (
          dto.taxDetails &&
          Array.isArray(dto.taxDetails) &&
          dto.taxDetails.length > 0
        ) {
          await this.addQuoteTaxDetails(
            manager,
            savedQuote.id,
            dto.taxDetails,
            userId
          );
        }
        if (
          dto.remarksSection ||
          dto.mainDocuments ||
          typeof dto.quoteStatusLid !== "undefined"
        ) {
          const existing =
            await this.opportunityRepository.findOpportunityQuoteById(
              savedQuote.id,
              manager
            );
          if (existing) {
            await this.opportunityRepository.updateOpportunityQuote(
              manager,
              savedQuote.id,
              {
                remarks: dto.remarksSection?.remarks,
                statusLid: dto.quoteStatusLid,
                brokingSlipId: savedQuote.brokingSlipId,
              }
            );
            await this.opportunityRepository.deleteOpportunityQuoteDocumentMappings(
              savedQuote.id,
              manager
            );
          } else {
            await this.opportunityRepository.createOpportunityQuote(
              manager,
              savedQuote.id,
              {
                remarks: dto.remarksSection?.remarks,
                statusLid: dto.quoteStatusLid,
                brokingSlipId: savedQuote.brokingSlipId,
              }
            );
          }
          if (dto.mainDocuments && dto.mainDocuments.length > 0) {
            await this.opportunityRepository.saveActivityDocuments(
              manager,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.OPPORTUNITY_QUOTE_ENTRY_DOCUMENT_MAP,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.OPPORTUNITY_QUOTE_ENTRY_ID,
              opportunityActivityId,
              dto.mainDocuments
            );
          }
        }

        // update the OpportunityActivityMap with the new status
        await this.opportunityRepository.updateOpportunityActivityMapStatus(
          opportunityActivityId,
          dto.statusId,
          userId,
          null,
          manager
        );
        await this.opportunityRepository.updateNextActivityStatus(
          opportunityActivityId,
          dto?.statusId,
          manager
        );
        return savedQuote;
      });

      if (!savedQuote) {
        throw new NotFoundException(errorMessages.opportunityQuoteNotFound);
      }
      if (!savedQuote.brokingSlipId) {
        throw new NotFoundException(
          `Broking Slip ID for Quote with ID ${savedQuote.id} not found.`
        );
      }
      const allQuotesData = await this.getQuotesByBrokingSlip(
        savedQuote.brokingSlipId
      );
      const currentQuoteDetails = allQuotesData?.quotes?.find(
        (individualQuoteData: any) => individualQuoteData.id === savedQuote.id
      );
      return currentQuoteDetails;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error ? error.message : "Failed to create quote."
          );
    }
  }
  async updateQuote(
    quoteId: number,
    dto: CreateQuoteDto,
    userId: number
  ): Promise<any> {
    try {
      const updatedQuote = await this.dataSource.transaction(
        async (manager) => {
          // Step 1: Check if the quote exists
          const existingQuote = await this.opportunityRepository.findQuoteById(
            quoteId,
            manager
          );
          if (!existingQuote) {
            throw new NotFoundException(errorMessages.opportunityQuoteNotFound);
          }
          // Step 2: Prepare the updated quote
          const { taxDetails, quoteDetails, netPremiumDetails, ...rest } = dto;
          const updatedQuote = {
            ...existingQuote,
            ...rest,
            insurerId: quoteDetails?.insurerId,
            insurerLocationId: quoteDetails?.insurerLocationId,
            quoteReceivedOn: quoteDetails?.quoteReceivedOn,
            basicPremium: quoteDetails?.basicPremium,
            terrorism: quoteDetails?.terrorism,
            basicBrokeragePercentage: quoteDetails?.basicBrokeragePercentage,
            srccPercentage: quoteDetails?.srccPercentage,
            srccAmount: quoteDetails?.srccAmount,
            srccBrokerageAmount: quoteDetails?.srccBrokerageAmount,
            terrorismBrokeragePercentage:
              quoteDetails?.terrorismBrokeragePercentage,
            tcBrokerageAmount: quoteDetails?.tcBrokerageAmount,
            basicBrokerageAmount: quoteDetails?.basicBrokerageAmount,
            gstPercentage: quoteDetails?.gstPercentage,
            gstAmount: quoteDetails?.gstAmount,
            // totalGrossPremiumIncTax: quoteDetails?.totalGrossPremiumIncTax,
            feePercentage: quoteDetails?.feePercentage,
            fee: quoteDetails?.fee,
            otherPercentage: quoteDetails?.otherPercentage,
            other: quoteDetails?.other,
            adminChargesPercentage: quoteDetails?.adminChargesPercentage,
            adminCharges: quoteDetails?.adminCharges,
            cessPercentage: quoteDetails?.cessPercentage,
            cessAmount: quoteDetails?.cessAmount,
            grossPremium: quoteDetails?.grossPremium,
            netPremium: quoteDetails?.netPremium,
            totalBrokerageAmount: quoteDetails?.totalBrokerageAmount,
            insurerRemarks: netPremiumDetails?.insurerRemarks,
            updatedBy: userId,
            updatedAt: new Date(),
          } as any;
          // Step 3: Save the updated quote
          await this.opportunityRepository.saveQuote(updatedQuote, manager);
          if (taxDetails && Array.isArray(taxDetails)) {
            await this.opportunityRepository.deleteQuoteTaxDetails(
              quoteId,
              manager
            );
            const records = this.opportunityRepository.prepareQuoteTaxDetails(
              taxDetails,
              quoteId,
              userId
            );
            await this.opportunityRepository.saveQuoteTaxDetails(
              manager,
              records
            );
          }
          if (dto.covers && typeof dto.covers === "object") {
            await this.opportunityRepository.deleteQuoteCoverDetails(
              quoteId,
              manager
            );
            const coversArray = Object.entries(dto.covers).map(
              ([id, response]) => ({
                id: Number(id),
                response,
                quoteId,
              })
            );
            await this.addQuoteCoverDetails(
              manager,
              existingQuote.opportunityActivityId,
              coversArray,
              userId
            );
          }
          if (
            dto.remarksSection ||
            dto.mainDocuments ||
            typeof dto.quoteStatusLid !== "undefined"
          ) {
            const existing =
              await this.opportunityRepository.findOpportunityQuoteById(
                quoteId,
                manager
              );

            if (existing) {
              await this.opportunityRepository.upsertOpportunityQuote(
                manager,
                quoteId,
                {
                  remarks: dto.remarksSection?.remarks,
                  statusLid: dto.quoteStatusLid,
                  opportunityActivityId: existingQuote.opportunityActivityId,
                }
              );
              await this.opportunityRepository.upsertOpportunityQuoteDocumentMapping(
                quoteId,
                dto.mainDocuments,
                manager
              );
            } else {
              await this.opportunityRepository.createOpportunityQuote(
                manager,
                quoteId,
                {
                  remarks: dto.remarksSection?.remarks,
                  statusLid: dto.quoteStatusLid,
                  opportunityActivityId: dto.opportunityActivityId,
                }
              );
            }
          }
          return existingQuote;
        }
      );
      if (!updatedQuote) {
        throw new NotFoundException(errorMessages.opportunityQuoteNotFound);
      }
      if (!updatedQuote.brokingSlipId) {
        throw new NotFoundException(
          `Broking Slip ID for Quote with ID ${updatedQuote.id} not found.`
        );
      }
      const allQuotesData = await this.getQuotesByBrokingSlip(
        updatedQuote.brokingSlipId
      );
      const currentQuoteDetails = allQuotesData?.quotes?.find(
        (individualQuoteData: any) => individualQuoteData.id === updatedQuote.id
      );
      return currentQuoteDetails;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error ? error.message : "Failed to update quote."
          );
    }
  }

  async getQuoteByBrokingSlipAndActivity(
    brokingSlipId: number,
    opportunityActivityId: number
  ): Promise<any> {
    try {
      const quote =
        await this.opportunityRepository.findQuotesByBrokingSlipAndActivity(
          brokingSlipId,
          opportunityActivityId
        );

      if (!quote) {
        throw new NotFoundException(errorMessages.opportunityQuoteNotFound);
      }

      return quote;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : errorMessages.quoteRetrievalFailed
          );
    }
  }

  async getQuotesByBrokingSlip(brokingSlipId: number): Promise<any> {
    try {
      const brokingSlipData =
        await this.opportunityRepository.getBrokingSlipDetailsById(
          brokingSlipId
        );
      if (!brokingSlipData) {
        throw new NotFoundException(
          `Broking Slip with ID ${brokingSlipId} not found.`
        );
      }

      const quotes = await this.opportunityRepository.findQuotesByBrokingSlip(
        brokingSlipId
      );
      // console.log("Quotes retrieved for broking slip:", quotes);
      if (!quotes || quotes.length === 0) {
        return {
          quotes: [],
          createdAt: new Date(brokingSlipData.createdAt),
          sumInsured: Number(brokingSlipData.sumInsured),
          policyFrom: new Date(brokingSlipData.policyFrom),
          policyTo: new Date(brokingSlipData.policyTo),
          basicPremium: Number(brokingSlipData.basicPremium),
          brokeragePercentage: Number(brokingSlipData.brokeragePercentage),
          brokerageAmount: Number(brokingSlipData.brokerageAmount),
        };
      } else {
        const transformedQuotes = await this.transformQuotes(quotes);
        return {
          quotes: transformedQuotes,
          createdAt: new Date(brokingSlipData.createdAt),
          sumInsured: Number(brokingSlipData.sumInsured),
          policyFrom: new Date(brokingSlipData.policyFrom),
          policyTo: new Date(brokingSlipData.policyTo),
          basicPremium: Number(brokingSlipData.basicPremium),
          brokeragePercentage: Number(brokingSlipData.brokeragePercentage),
          brokerageAmount: Number(brokingSlipData.brokerageAmount),
        };
      }
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : errorMessages.quoteRetrievalFailed
          );
    }
  }

  async createPolicyDocketActivity(
    OpportunityActivityMap: OpportunityActivityDto,
    activityMetaData: SavePolicyDocketDto,
    userId: number
  ): Promise<any> {
    try {
      return await this.handlePolicyDocketActivity(
        OpportunityActivityMap,
        activityMetaData,
        userId
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.opportunityActivityMetaUpdateFailed
      );
    }
  }

  async getPolicyDocketActivity(opportunityActivityId: number): Promise<any> {
    try {
      const policyDocket =
        await this.opportunityRepository.getPolicyDocketByOpportunityActivityId(
          opportunityActivityId
        );

      if (!policyDocket) {
        throw new NotFoundException(
          `Policy docket not found for opportunity activity ID ${opportunityActivityId}`
        );
      }
      let documents: any[] = policyDocket?.documents ?? [];
      if (documents.length > 0) {
        documents = documents.map(({ policyDocketId, ...rest }) => rest);
      } else {
        documents = [
          {
            documentId: null,
            documentTypeLid: null,
          },
        ];
      }
      const approverDetails =
        await this.opportunityRepository.getActivityApproverDetails(
          opportunityActivityId
        );
      return {
        id: Number(policyDocket.id),
        opportunityActivityId: policyDocket?.opportunityActivityId
          ? Number(policyDocket.opportunityActivityId)
          : null,
        statusLid: policyDocket?.statusLid
          ? Number(policyDocket.statusLid)
          : null,
        dataActivity: {
          placementSlipDetailsSection: {
            issuanceDate: policyDocket?.issuanceDate ?? null,
          },
          serviceLevelAgreementSection: {
            heldCoverNote: policyDocket?.heldCoverNote ?? null,
            policyDocument: policyDocket?.policyDocument ?? null,
            policyDocket: policyDocket?.policyDocket ?? null,
            endorsement: policyDocket?.endorsement ?? null,
            healthClaims: policyDocket?.healthClaims ?? null,
            nonHealthClaims: policyDocket?.nonHealthClaims ?? null,
            mir: policyDocket?.mir ?? null,
            monthlyMeeting: policyDocket?.monthlyMeeting ?? null,
            quarterlyMeeting: policyDocket?.quarterlyMeeting ?? null,
            renewalNotice: policyDocket?.renewalNotice ?? null,
            dataCollection: policyDocket?.dataCollection ?? null,
            remarks: policyDocket?.remarks ?? null,
          },
          documents: documents,
        },
        approverDetails: approverDetails,
      };
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving policy docket by opportunity activity ID"
          );
    }
  }

  async updatePolicyDocketByIdActivity(
    opportunityActivityId: number,
    updatePolicyDocketData: SavePolicyDocketDto,
    userId: number
  ): Promise<any> {
    try {
      const opportunityActivityMapData =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );
      return await this.handlePolicyDocketActivity(
        opportunityActivityMapData,
        updatePolicyDocketData,
        userId
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : "Error updating policy docket"
      );
    }
  }

  async handlePolicyDocketActivity(
    opportunityActivity: OpportunityActivityDto,
    activityMetaData: SavePolicyDocketDto,
    userId: number
  ) {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        activityMetaData,
        LOOK_UP_DATA
      );

      const policyDocket = await this.dataSource.transaction(
        async (entityManager) => {
          const {
            opportunityActivityId,
            statusLid,
            activityStatusKey,
            placementSlipDetailsSection,
            serviceLevelAgreementSection,
            documents,
            ...rest
          } = activityMetaData;
          let issuanceDate: Date | undefined;
          if (placementSlipDetailsSection?.issuanceDate) {
            issuanceDate = new Date(placementSlipDetailsSection.issuanceDate);

            if (isNaN(issuanceDate.getTime())) {
              throw new BadRequestException(
                errorMessages.issuanceDateFormatError
              );
            }
          }
          // Create the policy docket object
          const policyDocketObject = this.removeUndefinedFields({
            opportunityId: opportunityActivity.opportunityId,
            activityId: opportunityActivity.activityId,
            statusLid: statusLid,
            issuanceDate: issuanceDate,
            ...serviceLevelAgreementSection,
          });
          // Save policy docket
          const policyDocketData =
            await this.opportunityRepository.savePolicyDocket(
              entityManager,
              opportunityActivityId,
              policyDocketObject,
              userId
            );

          if (documents) {
            // Save documents
            await this.opportunityRepository.saveActivityDocuments(
              entityManager,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.POLICY_DOCKET_DOCUMENT_MAP,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.POLICY_DOCKET_ID,
              policyDocketData.id,
              documents
            );
            // Update document status
            await this.opportunityRepository.updateDocumentStatus(
              entityManager,
              documents.map((doc) => doc.documentId)
            );
          }

          // update the OpportunityActivityMap with the new status
          await this.opportunityRepository.updateOpportunityActivityMapStatus(
            opportunityActivityId,
            statusLid,
            userId,
            activityStatusKey === ACTIVITY_STATUS.COMPLETE ? new Date() : null,
            entityManager,
            activityStatusKey
          );

          if (activityStatusKey === ACTIVITY_STATUS.SUBMIT) {
            const needsApproval =
              await this.opportunityRepository.isOpportunityActivityNeedsApproval(
                opportunityActivityId
              );
            if (needsApproval) {
              await this.createAndAssignTask(
                opportunityActivityId,
                entityManager,
                ACL_CATEGORY.ISG_ACTIVITY,
                ACL_ACTIONS.APPROVE_ISG,
                userId,
                APPROVAL_TASK_NAMES.POLICY_DOCKET,
                TASK_TYPE.APPROVAL
              );
            }
          }

          await this.opportunityRepository.updateNextActivityStatus(
            opportunityActivityId,
            statusLid,
            entityManager
          );

          return policyDocketData;
        }
      );
      (policyDocket as any).approverDetails =
        await this.opportunityRepository.getActivityApproverDetails(
          opportunityActivity.id
        );
      return {
        id: policyDocket.id,
        ...activityMetaData,
        approverDetails: (policyDocket as any).approverDetails,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to handle policy docket activity: ${error.message} `
      );
    }
  }

  async getOpportunityActivitesDataById(
    opportunityActivityId: number
  ): Promise<any> {
    try {
      const opportunityActivityMapData =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );
      console.log("opportunityActivityMapData", opportunityActivityMapData);
      if (!opportunityActivityMapData) {
        throw new NotFoundException(
          `Opportunity activity not found for ID: ${opportunityActivityId}`
        );
      } else {
        const opportunityTable = opportunityActivityMapData.opportunityTable;

        if (opportunityTable === null) {
          throw new NotFoundException("Opportunity activity Table not found");
        }

        let result: any;
        switch (opportunityTable) {
          case "opportunity_data_validation":
            result = await this.getDataValidationByOpportunityActivityId(
              opportunityActivityId
            );
            break;

          case "opportunity_kdm_meeting":
            result = await this.getKdmMeeting(opportunityActivityId);
            break;

          case "opportunity_mandate_details_entry":
            result = await this.getMandateDetailsByOpportunityActivityId(
              opportunityActivityId
            );
            break;

          case "opportunity_rfp_cover_detail":
            result = await this.getRfpDataByOpportunityId(
              opportunityActivityId
            );
            break;

          case "opportunity_quote_entry":
            result = await this.getQuoteByOpportunityActivityId(
              opportunityActivityId
            );
            break;
          case "opportunity_quote_comparison_report":
            result = await this.getQuoteComparisonReportActivity(
              opportunityActivityId
            );
            break;

          case "opportunity_placement_slip_generation":
            result = await this.getPlacementSlipActivity(opportunityActivityId);
            break;

          case "opportunity_premium_calculation":
            result = await this.getPremiumCalculationActivity(
              opportunityActivityId
            );
            break;

          case "opportunity_rfp_details_entry":
            result = await this.getRfpDetailsByOpportunityActivityId(
              opportunityActivityId
            );
            break;

          case "opportunity_final_negotiation":
            result = await this.getFinalNegotiationActivity(
              opportunityActivityId
            );
            break;

          case "opportunity_held_cover_note":
            result = await this.getHeldCoverNoteActivity(opportunityActivityId);
            break;

          case "opportunity_policy_confirmation":
            result = await this.getPolicyConfirmationActivity(
              opportunityActivityId
            );
            break;
          case "opportunity_policy_hard_copy":
            result = await this.getPolicyHardCopyActivity(
              opportunityActivityId
            );
            break;

          case "opportunity_policy_docket":
            result = await this.getPolicyDocketActivity(opportunityActivityId);
            break;

          case "opportunity_hand_over_meet":
            result = await this.getHandOverMeetById(opportunityActivityId);
            break;

          default:
            throw new BadRequestException(
              `Unsupported opportunity table: ${opportunityTable}`
            );
        }

        if (result?.dataActivity?.documents?.length > 0) {
          try {
            const uniqueDocuments = new Map();

            for (const doc of result.dataActivity.documents) {
              const fileName = await this.getFileNamesByDocumentIds([
                Number(doc.documentId),
              ])
                .then((fileNameMap) => fileNameMap.get(doc.documentId) || null)
                .catch(() => null);

              if (!fileName) {
                uniqueDocuments.set(doc.documentId, {
                  documentId: null,
                  documentTypeLid: null,
                  fileName: null,
                  documentType: null,
                });
              } else if (!uniqueDocuments.has(doc.documentId)) {
                const lookupData = await this.lookUpRepository.findOne({
                  where: { id: Number(doc.documentTypeLid) },
                });

                uniqueDocuments.set(doc.documentId, {
                  ...doc,
                  fileName,
                  documentType: lookupData?.lookUpValue || null,
                });
              }
            }

            result.dataActivity.documents = Array.from(
              uniqueDocuments.values()
            );
          } catch (error) {
            console.error(
              "Error fetching file names or document types:",
              error
            );
            result.dataActivity.documents = result.dataActivity.documents.map(
              () => ({
                documentId: null,
                documentTypeLid: null,
                fileName: null,
                documentType: null,
              })
            );
          }
        }

        if (
          Array.isArray(result?.dataActivity?.installmentDetails) &&
          result.dataActivity.installmentDetails.length > 0
        ) {
          result.dataActivity.installmentDetails =
            result.dataActivity.installmentDetails.sort(
              (a: any, b: any) =>
                (Number(a?.installmentSequence) || Number.MAX_SAFE_INTEGER) -
                (Number(b?.installmentSequence) || Number.MAX_SAFE_INTEGER)
            );
        }
        return result;
      }
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.opportunityActivitiesRetrieveFailed
      );
    }
  }

  async getFileNamesByDocumentIds(
    documentIds: number[]
  ): Promise<Map<number, string>> {
    if (!documentIds || documentIds.length === 0) {
      return new Map();
    }

    const fileUploadRecords = await this.dataSource
      .getRepository(FileUpload)
      .find({
        where: { id: In(documentIds) },
      });

    const extractFileName = (filePath: string): string => {
      const parts = filePath.split("/");
      return parts[parts.length - 1];
    };

    const fileNameMap = new Map(
      fileUploadRecords.map((file) => [file.id, extractFileName(file.fileKey)])
    );
    return fileNameMap;
  }

  async getHeldCoverNoteActivity(opportunityActivityId: number): Promise<any> {
    try {
      const heldCoverNote =
        await this.opportunityRepository.getHeldCoverNoteByOpportunityActivityId(
          opportunityActivityId
        );
      if (!heldCoverNote) {
        throw new NotFoundException(
          `Held Cover Note not found for Opportunity Activity Id: ${opportunityActivityId}`
        );
      }

      const coverDetails: Record<number, string> = {};
      heldCoverNote.coverDetails?.forEach((c) => {
        if (c.coverTemplateId !== undefined && c.coverResponse !== undefined) {
          coverDetails[c.coverTemplateId] = c.coverResponse;
        }
      });

      let documents: any[] = heldCoverNote?.documents ?? [];
      if (documents.length > 0) {
        documents = documents.map(({ heldCoverNoteId, ...rest }) => rest);
      } else {
        documents = [
          {
            documentId: null,
            documentTypeLid: null,
          },
        ];
      }
      const approverDetails =
        await this.opportunityRepository.getActivityApproverDetails(
          opportunityActivityId
        );
      return {
        id: Number(heldCoverNote.id),
        opportunityActivityId: heldCoverNote?.opportunityActivityId
          ? Number(heldCoverNote.opportunityActivityId)
          : null,
        statusLid: heldCoverNote?.statusLid
          ? Number(heldCoverNote.statusLid)
          : null,
        dataActivity: {
          placementSlipDeviationsSection: {
            placementSlipDeviationsLid:
              heldCoverNote?.placementSlipDeviationsLid
                ? Number(heldCoverNote.placementSlipDeviationsLid)
                : null,
          },
          deviationSection: {
            deviations: heldCoverNote?.deviations ?? null,
          },
          deviationsAddressedSection: {
            deviationsAddressedLid: heldCoverNote?.deviationsAddressedLid
              ? Number(heldCoverNote.deviationsAddressedLid)
              : null,
            resolutionLid: heldCoverNote?.resolutionLid
              ? Number(heldCoverNote.resolutionLid)
              : null,
            revisedHeldCoverNoteLid: heldCoverNote?.revisedHeldCoverNoteLid
              ? Number(heldCoverNote.revisedHeldCoverNoteLid)
              : null,
          },
          premiumReceiptDetailsSection: {
            acknowledgedBy: heldCoverNote?.acknowledgedBy
              ? Number(heldCoverNote.acknowledgedBy)
              : null,
            receiptNo: heldCoverNote?.receiptNo ?? null,
            receiptDate: heldCoverNote?.receiptDate ?? null,
            allDocumentsReceivedDate:
              heldCoverNote?.allDocumentsReceivedDate ?? null,
            basicPremium: heldCoverNote?.basicPremium
              ? Number(heldCoverNote.basicPremium)
              : null,
            basicBrokeragePercentage: heldCoverNote?.basicBrokeragePercentage
              ? Number(heldCoverNote.basicBrokeragePercentage)
              : null,
            srccPercentage: heldCoverNote?.srccPercentage
              ? Number(heldCoverNote.srccPercentage)
              : null,
            srccAmount: heldCoverNote?.srccAmount
              ? Number(heldCoverNote.srccAmount)
              : null,
            srccBrokerageAmount: heldCoverNote?.srccBrokerageAmount
              ? Number(heldCoverNote.srccBrokerageAmount)
              : null,
            terrorismBrokeragePercentage:
              heldCoverNote?.terrorismBrokeragePercentage
                ? Number(heldCoverNote.terrorismBrokeragePercentage)
                : null,
            terrorism: heldCoverNote?.terrorism
              ? Number(heldCoverNote.terrorism)
              : null,
            tcBrokerageAmount: heldCoverNote?.tcBrokerageAmount
              ? Number(heldCoverNote.tcBrokerageAmount)
              : null,
            basicBrokerageAmount: heldCoverNote?.basicBrokerageAmount
              ? Number(heldCoverNote.basicBrokerageAmount)
              : null,
            gstPercentage: heldCoverNote?.gstPercentage
              ? Number(heldCoverNote.gstPercentage)
              : null,
            gstAmount: heldCoverNote?.gstAmount
              ? Number(heldCoverNote.gstAmount)
              : null,
            netPremium: heldCoverNote?.netPremium
              ? Number(heldCoverNote.netPremium)
              : null,
            // totalGrossPremiumIncTax: heldCoverNote?.totalGrossPremiumIncTax
            //   ? Number(heldCoverNote.totalGrossPremiumIncTax)
            //   : null,
            feePercentage: heldCoverNote?.feePercentage
              ? Number(heldCoverNote.feePercentage)
              : null,
            fee: heldCoverNote?.fee ? Number(heldCoverNote.fee) : null,
            otherPercentage: heldCoverNote?.otherPercentage
              ? Number(heldCoverNote.otherPercentage)
              : null,
            other: heldCoverNote?.other ? Number(heldCoverNote.other) : null,
            adminChargesPercentage: heldCoverNote?.adminChargesPercentage
              ? Number(heldCoverNote.adminChargesPercentage)
              : null,
            adminCharges: heldCoverNote?.adminCharges
              ? Number(heldCoverNote.adminCharges)
              : null,
            cessPercentage: heldCoverNote?.cessPercentage
              ? Number(heldCoverNote.cessPercentage)
              : null,
            cessAmount: heldCoverNote?.cessAmount
              ? Number(heldCoverNote.cessAmount)
              : null,
            grossPremium: heldCoverNote?.grossPremium
              ? Number(heldCoverNote.grossPremium)
              : null,
            sumInsured: heldCoverNote?.sumInsured
              ? Number(heldCoverNote.sumInsured)
              : null,
            totalBrokerageAmount: heldCoverNote?.totalBrokerageAmount
              ? Number(heldCoverNote.totalBrokerageAmount)
              : null,
            policyPlacedTypeLid: heldCoverNote?.policyPlacedTypeLid
              ? Number(heldCoverNote.policyPlacedTypeLid)
              : null,
            leadInsurerId: heldCoverNote?.leadInsurerId
              ? Number(heldCoverNote.leadInsurerId)
              : null,
            isLeadInsurerPayCommission:
              heldCoverNote?.isLeadInsurerPayCommission
                ? Number(heldCoverNote.isLeadInsurerPayCommission)
                : null,
          },
          installmentDetails: Array.isArray(heldCoverNote?.installmentDetails)
            ? heldCoverNote.installmentDetails
                .filter((item: any) => !item.deletedAt)
                .map((item: any) => ({
                  installmentDate: item?.installmentDate ?? null,
                  installmentNetAmount: item?.installmentNetAmount
                    ? Number(item.installmentNetAmount)
                    : null,
                  installmentNo: item?.installmentNo ?? null,
                  installmentSequence: item?.installmentSequence
                    ? Number(item.installmentSequence)
                    : null,
                  installmentPercentage: item?.installmentPercentage
                    ? Number(item.installmentPercentage)
                    : null,
                  taxPercentage: item?.taxPercentage
                    ? Number(item.taxPercentage)
                    : null,
                  taxAmount: item?.taxAmount ? Number(item.taxAmount) : null,
                  installmentGrossAmount: item?.installmentGrossAmount
                    ? Number(item.installmentGrossAmount)
                    : null,
                  modeOfPayment: item?.modeOfPayment ?? null,
                  id: item?.id ? Number(item.id) : null,
                }))
                .sort(
                  (a, b) =>
                    (a.installmentSequence ?? Number.MAX_SAFE_INTEGER) -
                    (b.installmentSequence ?? Number.MAX_SAFE_INTEGER)
                )
            : [],
          insurerDetails: heldCoverNote?.insurerDetails?.length
            ? heldCoverNote.insurerDetails.map((insurer) => ({
                insurerId: insurer.insurerId,
                insurerLocationId: insurer.insurerLocationId
                  ? Number(insurer.insurerLocationId)
                  : null,
                insurerBranchId: insurer.insurerBranchId
                  ? Number(insurer.insurerBranchId)
                  : null,
                insurerContactId: insurer.insurerContactId
                  ? Number(insurer.insurerContactId)
                  : null,
                isLeadInsurer: insurer.isLeadInsurer
                  ? Number(insurer.isLeadInsurer)
                  : null,
                sharePercentage: insurer.sharePercentage
                  ? Number(insurer.sharePercentage)
                  : null,
                shareAmount: insurer.shareAmount
                  ? Number(insurer.shareAmount)
                  : null,
                brokeragePercentage: insurer.brokeragePercentage
                  ? Number(insurer.brokeragePercentage)
                  : null,
                brokerageAmount: insurer.brokerageAmount
                  ? Number(insurer.brokerageAmount)
                  : null,
                totalBrokerageAmount: insurer.totalBrokerageAmount
                  ? Number(insurer.totalBrokerageAmount)
                  : null,
                terrorismSharePercentage: insurer.terrorismSharePercentage
                  ? Number(insurer.terrorismSharePercentage)
                  : null,
                terrorismShareAmount: insurer.terrorismShareAmount
                  ? Number(insurer.terrorismShareAmount)
                  : null,
                terrorismBrokeragePercentage:
                  insurer.terrorismBrokeragePercentage
                    ? Number(insurer.terrorismBrokeragePercentage)
                    : null,
                terrorismBrokerageAmount: insurer.terrorismBrokerageAmount
                  ? Number(insurer.terrorismBrokerageAmount)
                  : null,
              }))
            : undefined,
          remarksSection: {
            remarks: heldCoverNote?.remarks ?? null,
          },
          basicCovers: coverDetails,
          documents: documents,
        },
        approverDetails: approverDetails,
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.opportunityHeldCoverNoteRetrieveFailed
      );
    }
  }

  async getPolicyConfirmationActivity(
    opportunityActivityId: number
  ): Promise<any> {
    try {
      const policyConfirmation =
        await this.opportunityRepository.getPolicyConfirmationByOpportunityActivityId(
          opportunityActivityId
        );
      if (!policyConfirmation) {
        throw new NotFoundException(
          `Policy Confirmation not found for Opportunity Activity Id: ${opportunityActivityId}`
        );
      }
      let documents: any[] = policyConfirmation?.documents ?? [];
      if (documents.length > 0) {
        documents = documents.map(({ policyConfirmationId, ...rest }) => rest);
      } else {
        documents = [
          {
            documentId: null,
            documentTypeLid: null,
          },
        ];
      }
      return {
        id: Number(policyConfirmation.id),
        opportunityActivityId: policyConfirmation?.opportunityActivityId
          ? Number(policyConfirmation.opportunityActivityId)
          : null,
        statusLid: policyConfirmation?.statusLid
          ? Number(policyConfirmation.statusLid)
          : null,
        dataActivity: {
          policyDataWrongSection: {
            policyDataWrongLid: policyConfirmation?.policyDataWrongLid
              ? Number(policyConfirmation.policyDataWrongLid)
              : null,
          },
          deviationSection: {
            deviations: policyConfirmation?.deviations ?? null,
          },
          policyDataRectifiedSection: {
            policyDataRectifiedLid: policyConfirmation?.policyDataRectifiedLid
              ? Number(policyConfirmation.policyDataRectifiedLid)
              : null,
            resolutionLid: policyConfirmation?.resolutionLid
              ? Number(policyConfirmation.resolutionLid)
              : null,
            basicPremium: policyConfirmation?.basicPremium
              ? Number(policyConfirmation.basicPremium)
              : null,
            basicBrokeragePercentage:
              policyConfirmation?.basicBrokeragePercentage
                ? Number(policyConfirmation.basicBrokeragePercentage)
                : null,
            srccPercentage: policyConfirmation?.srccPercentage
              ? Number(policyConfirmation.srccPercentage)
              : null,
            srccAmount: policyConfirmation?.srccAmount
              ? Number(policyConfirmation.srccAmount)
              : null,
            srccBrokerageAmount: policyConfirmation?.srccBrokerageAmount
              ? Number(policyConfirmation.srccBrokerageAmount)
              : null,
            terrorismBrokeragePercentage:
              policyConfirmation?.terrorismBrokeragePercentage
                ? Number(policyConfirmation.terrorismBrokeragePercentage)
                : null,
            terrorism: policyConfirmation?.terrorism
              ? Number(policyConfirmation.terrorism)
              : null,
            tcBrokerageAmount: policyConfirmation?.tcBrokerageAmount
              ? Number(policyConfirmation.tcBrokerageAmount)
              : null,
            basicBrokerageAmount: policyConfirmation?.basicBrokerageAmount
              ? Number(policyConfirmation.basicBrokerageAmount)
              : null,
            gstPercentage: policyConfirmation?.gstPercentage
              ? Number(policyConfirmation.gstPercentage)
              : null,
            gstAmount: policyConfirmation?.gstAmount
              ? Number(policyConfirmation.gstAmount)
              : null,
            netPremium: policyConfirmation?.netPremium
              ? Number(policyConfirmation.netPremium)
              : null,
            // totalGrossPremiumIncTax: policyConfirmation?.totalGrossPremiumIncTax
            //   ? Number(policyConfirmation.totalGrossPremiumIncTax)
            //   : null,
            feePercentage: policyConfirmation?.feePercentage
              ? Number(policyConfirmation.feePercentage)
              : null,
            fee: policyConfirmation?.fee
              ? Number(policyConfirmation.fee)
              : null,
            otherPercentage: policyConfirmation?.otherPercentage
              ? Number(policyConfirmation.otherPercentage)
              : null,
            other: policyConfirmation?.other
              ? Number(policyConfirmation.other)
              : null,
            adminChargesPercentage: policyConfirmation?.adminChargesPercentage
              ? Number(policyConfirmation.adminChargesPercentage)
              : null,
            adminCharges: policyConfirmation?.adminCharges
              ? Number(policyConfirmation.adminCharges)
              : null,
            cessPercentage: policyConfirmation?.cessPercentage
              ? Number(policyConfirmation.cessPercentage)
              : null,
            cessAmount: policyConfirmation?.cessAmount
              ? Number(policyConfirmation.cessAmount)
              : null,
            grossPremium: policyConfirmation?.grossPremium
              ? Number(policyConfirmation.grossPremium)
              : null,
            sumInsured: policyConfirmation?.sumInsured
              ? Number(policyConfirmation.sumInsured)
              : null,
            totalBrokerageAmount: policyConfirmation?.totalBrokerageAmount
              ? Number(policyConfirmation.totalBrokerageAmount)
              : null,
            policyPlacedTypeLid: policyConfirmation?.policyPlacedTypeLid
              ? Number(policyConfirmation.policyPlacedTypeLid)
              : null,
            leadInsurerId: policyConfirmation?.leadInsurerId
              ? Number(policyConfirmation.leadInsurerId)
              : null,
            isLeadInsurerPayCommission:
              policyConfirmation?.isLeadInsurerPayCommission
                ? Number(policyConfirmation.isLeadInsurerPayCommission)
                : null,
          },
          installmentDetails: Array.isArray(
            policyConfirmation?.installmentDetails
          )
            ? policyConfirmation.installmentDetails
                .filter((item: any) => !item.deletedAt)
                .map((item: any) => ({
                  installmentDate: item?.installmentDate ?? null,
                  installmentNetAmount: item?.installmentNetAmount
                    ? Number(item.installmentNetAmount)
                    : null,
                  installmentNo: item?.installmentNo ?? null,
                  installmentSequence: item?.installmentSequence
                    ? Number(item.installmentSequence)
                    : null,
                  installmentPercentage: item?.installmentPercentage
                    ? Number(item.installmentPercentage)
                    : null,
                  taxPercentage: item?.taxPercentage
                    ? Number(item.taxPercentage)
                    : null,
                  taxAmount: item?.taxAmount ? Number(item.taxAmount) : null,
                  installmentGrossAmount: item?.installmentGrossAmount
                    ? Number(item.installmentGrossAmount)
                    : null,
                  modeOfPayment: item?.modeOfPayment ?? null,
                  id: item?.id ? Number(item.id) : null,
                }))
                .sort(
                  (a, b) =>
                    (a.installmentSequence ?? Number.MAX_SAFE_INTEGER) -
                    (b.installmentSequence ?? Number.MAX_SAFE_INTEGER)
                )
            : [],
          insurerDetails: policyConfirmation?.insurerDetails?.length
            ? policyConfirmation.insurerDetails.map((insurer) => ({
                insurerId: insurer.insurerId,
                insurerLocationId: insurer.insurerLocationId
                  ? Number(insurer.insurerLocationId)
                  : null,
                insurerBranchId: insurer.insurerBranchId
                  ? Number(insurer.insurerBranchId)
                  : null,
                insurerContactId: insurer.insurerContactId
                  ? Number(insurer.insurerContactId)
                  : null,
                isLeadInsurer: insurer.isLeadInsurer
                  ? Number(insurer.isLeadInsurer)
                  : null,
                sharePercentage: insurer.sharePercentage
                  ? Number(insurer.sharePercentage)
                  : null,
                shareAmount: insurer.shareAmount
                  ? Number(insurer.shareAmount)
                  : null,
                brokeragePercentage: insurer.brokeragePercentage
                  ? Number(insurer.brokeragePercentage)
                  : null,
                brokerageAmount: insurer.brokerageAmount
                  ? Number(insurer.brokerageAmount)
                  : null,
                totalBrokerageAmount: insurer.totalBrokerageAmount
                  ? Number(insurer.totalBrokerageAmount)
                  : null,
                terrorismSharePercentage: insurer.terrorismSharePercentage
                  ? Number(insurer.terrorismSharePercentage)
                  : null,
                terrorismShareAmount: insurer.terrorismShareAmount
                  ? Number(insurer.terrorismShareAmount)
                  : null,
                terrorismBrokeragePercentage:
                  insurer.terrorismBrokeragePercentage
                    ? Number(insurer.terrorismBrokeragePercentage)
                    : null,
                terrorismBrokerageAmount: insurer.terrorismBrokerageAmount
                  ? Number(insurer.terrorismBrokerageAmount)
                  : null,
              }))
            : undefined,
          remarks: { remarks: policyConfirmation?.remarks ?? null },
          documents: documents,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.opportunityPolicyConfirmationRetrieveFailed
      );
    }
  }

  async getPolicyHardCopyActivity(opportunityActivityId: number): Promise<any> {
    try {
      const policyHardCopy =
        await this.opportunityRepository.getPolicyHardCopyByOpportunityActivityId(
          opportunityActivityId
        );
      if (!policyHardCopy) {
        throw new NotFoundException(
          `Policy Hard Copy not found for Opportunity Activity Id: ${opportunityActivityId}`
        );
      }

      const coverDetails: Record<number, string> = {};
      policyHardCopy.coverDetails?.forEach((c) => {
        if (c.coverTemplateId !== undefined && c.coverResponse !== undefined) {
          coverDetails[c.coverTemplateId] = c.coverResponse;
        }
      });
      let documents: any[] = policyHardCopy?.documents ?? [];
      if (documents.length > 0) {
        documents = documents.map(({ policyHardCopyId, ...rest }) => rest);
      } else {
        documents = [
          {
            documentId: null,
            documentTypeLid: null,
          },
        ];
      }
      return {
        id: Number(policyHardCopy.id),
        opportunityActivityId: policyHardCopy?.opportunityActivityId
          ? Number(policyHardCopy.opportunityActivityId)
          : null,
        statusLid: policyHardCopy?.statusLid
          ? Number(policyHardCopy.statusLid)
          : null,
        dataActivity: {
          insurerPolicyHardCopyDetails: {
            insurerPolicyNo: policyHardCopy?.insurerPolicyNo ?? null,
            hardCopyReceivedOn: policyHardCopy?.hardCopyReceivedOn ?? null,
          },
          deviationSection: {
            deviationsLid: policyHardCopy?.deviationsLid
              ? Number(policyHardCopy.deviationsLid)
              : null,
            basicPremium: policyHardCopy?.basicPremium
              ? Number(policyHardCopy.basicPremium)
              : null,
            totalBrokerageAmount: policyHardCopy?.totalBrokerageAmount
              ? Number(policyHardCopy.totalBrokerageAmount)
              : null,
            coverages: policyHardCopy?.coverages ?? null,
            exclusions: policyHardCopy?.exclusions ?? null,
            deductibles: policyHardCopy?.deductibles ?? null,
            basicBrokeragePercentage: policyHardCopy?.basicBrokeragePercentage
              ? Number(policyHardCopy.basicBrokeragePercentage)
              : null,
            srccPercentage: policyHardCopy?.srccPercentage
              ? Number(policyHardCopy.srccPercentage)
              : null,
            srccAmount: policyHardCopy?.srccAmount
              ? Number(policyHardCopy.srccAmount)
              : null,
            srccBrokerageAmount: policyHardCopy?.srccBrokerageAmount
              ? Number(policyHardCopy.srccBrokerageAmount)
              : null,
            terrorismBrokeragePercentage:
              policyHardCopy?.terrorismBrokeragePercentage
                ? Number(policyHardCopy.terrorismBrokeragePercentage)
                : null,
            terrorism: policyHardCopy?.terrorism
              ? Number(policyHardCopy.terrorism)
              : null,
            tcBrokerageAmount: policyHardCopy?.tcBrokerageAmount
              ? Number(policyHardCopy.tcBrokerageAmount)
              : null,
            basicBrokerageAmount: policyHardCopy?.basicBrokerageAmount
              ? Number(policyHardCopy.basicBrokerageAmount)
              : null,
            gstPercentage: policyHardCopy?.gstPercentage
              ? Number(policyHardCopy.gstPercentage)
              : null,
            gstAmount: policyHardCopy?.gstAmount
              ? Number(policyHardCopy.gstAmount)
              : null,
            // totalGrossPremiumIncTax: policyHardCopy?.totalGrossPremiumIncTax
            //   ? Number(policyHardCopy.totalGrossPremiumIncTax)
            //   : null,
            feePercentage: policyHardCopy?.feePercentage
              ? Number(policyHardCopy.feePercentage)
              : null,
            fee: policyHardCopy?.fee ? Number(policyHardCopy.fee) : null,
            otherPercentage: policyHardCopy?.otherPercentage
              ? Number(policyHardCopy.otherPercentage)
              : null,
            other: policyHardCopy?.other ? Number(policyHardCopy.other) : null,
            adminChargesPercentage: policyHardCopy?.adminChargesPercentage
              ? Number(policyHardCopy.adminChargesPercentage)
              : null,
            adminCharges: policyHardCopy?.adminCharges
              ? Number(policyHardCopy.adminCharges)
              : null,
            cessPercentage: policyHardCopy?.cessPercentage
              ? Number(policyHardCopy.cessPercentage)
              : null,
            cessAmount: policyHardCopy?.cessAmount
              ? Number(policyHardCopy.cessAmount)
              : null,
            grossPremium: policyHardCopy?.grossPremium
              ? Number(policyHardCopy.grossPremium)
              : null,
            sumInsured: policyHardCopy?.sumInsured
              ? Number(policyHardCopy.sumInsured)
              : null,
            netPremium: policyHardCopy?.netPremium
              ? Number(policyHardCopy.netPremium)
              : null,
            policyPlacedTypeLid: policyHardCopy?.policyPlacedTypeLid
              ? Number(policyHardCopy.policyPlacedTypeLid)
              : null,
            leadInsurerId: policyHardCopy?.leadInsurerId
              ? Number(policyHardCopy.leadInsurerId)
              : null,
            isLeadInsurerPayCommission:
              policyHardCopy?.isLeadInsurerPayCommission
                ? Number(policyHardCopy.isLeadInsurerPayCommission)
                : null,
          },
          installmentDetails: Array.isArray(policyHardCopy?.installmentDetails)
            ? policyHardCopy.installmentDetails
                .filter((item: any) => !item.deletedAt)
                .map((item: any) => ({
                  installmentDate: item?.installmentDate ?? null,
                  installmentNetAmount: item?.installmentNetAmount
                    ? Number(item.installmentNetAmount)
                    : null,
                  installmentNo: item?.installmentNo ?? null,
                  installmentSequence: item?.installmentSequence
                    ? Number(item.installmentSequence)
                    : null,
                  installmentPercentage: item?.installmentPercentage
                    ? Number(item.installmentPercentage)
                    : null,
                  taxPercentage: item?.taxPercentage
                    ? Number(item.taxPercentage)
                    : null,
                  taxAmount: item?.taxAmount ? Number(item.taxAmount) : null,
                  installmentGrossAmount: item?.installmentGrossAmount
                    ? Number(item.installmentGrossAmount)
                    : null,
                  modeOfPayment: item?.modeOfPayment ?? null,
                  id: item?.id ? Number(item.id) : null,
                }))
                .sort(
                  (a, b) =>
                    (a.installmentSequence ?? Number.MAX_SAFE_INTEGER) -
                    (b.installmentSequence ?? Number.MAX_SAFE_INTEGER)
                )
            : [],
          deviationsAddressedSection: {
            deviationsAddressedLid: policyHardCopy?.deviationsAddressedLid
              ? Number(policyHardCopy.deviationsAddressedLid)
              : null,
            deviationCoveragesLid: policyHardCopy?.deviationCoveragesLid
              ? Number(policyHardCopy.deviationCoveragesLid)
              : null,
            policyHardCopyReceivedLid: policyHardCopy?.policyHardCopyReceivedLid
              ? Number(policyHardCopy.policyHardCopyReceivedLid)
              : null,
            resolutionLid: policyHardCopy?.resolutionLid
              ? Number(policyHardCopy.resolutionLid)
              : null,
          },
          insurerDetails: policyHardCopy?.insurerDetails?.length
            ? policyHardCopy.insurerDetails.map((insurer) => ({
                insurerId: insurer.insurerId,
                insurerLocationId: insurer.insurerLocationId
                  ? Number(insurer.insurerLocationId)
                  : null,
                insurerBranchId: insurer.insurerBranchId
                  ? Number(insurer.insurerBranchId)
                  : null,
                insurerContactId: insurer.insurerContactId
                  ? Number(insurer.insurerContactId)
                  : null,
                isLeadInsurer: insurer.isLeadInsurer
                  ? Number(insurer.isLeadInsurer)
                  : null,
                sharePercentage: insurer.sharePercentage
                  ? Number(insurer.sharePercentage)
                  : null,
                shareAmount: insurer.shareAmount
                  ? Number(insurer.shareAmount)
                  : null,
                brokeragePercentage: insurer.brokeragePercentage
                  ? Number(insurer.brokeragePercentage)
                  : null,
                brokerageAmount: insurer.brokerageAmount
                  ? Number(insurer.brokerageAmount)
                  : null,
                terrorismSharePercentage: insurer.terrorismSharePercentage
                  ? Number(insurer.terrorismSharePercentage)
                  : null,
                terrorismShareAmount: insurer.terrorismShareAmount
                  ? Number(insurer.terrorismShareAmount)
                  : null,
                terrorismBrokeragePercentage:
                  insurer.terrorismBrokeragePercentage
                    ? Number(insurer.terrorismBrokeragePercentage)
                    : null,
                terrorismBrokerageAmount: insurer.terrorismBrokerageAmount
                  ? Number(insurer.terrorismBrokerageAmount)
                  : null,
                totalBrokerageAmount: insurer.totalBrokerageAmount
                  ? Number(insurer.totalBrokerageAmount)
                  : null,
              }))
            : undefined,
          remarks: {
            remarks: policyHardCopy?.remarks ?? null,
          },
          policyHardCopyCoversConfig: coverDetails,
          documents: documents,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.opportunityPolicyHardCopyRetrieveFailed
      );
    }
  }

  async getPremiumCalculationActivity(
    opportunityActivityId: number
  ): Promise<any> {
    try {
      const premiumCalculation =
        await this.opportunityRepository.getPremiumCalculationByOpportunityActivityId(
          opportunityActivityId
        );
      if (!premiumCalculation) {
        throw new NotFoundException(
          `Premium Calculation not found for Opportunity Activity Id: ${opportunityActivityId}`
        );
      }

      const coverDetails =
        await this.opportunityRepository.getPremiumCalculationCoverDetailsByActivityId(
          premiumCalculation.opportunityId
        );

      const documents =
        await this.opportunityRepository.getPremiumCalculationDocumentsByActivityId(
          opportunityActivityId
        );

      const premiumCalculationDetails: Record<string, string> = {};
      if (coverDetails && Array.isArray(coverDetails)) {
        for (const cover of coverDetails) {
          premiumCalculationDetails[cover.coverMapId] = cover.coverResponse;
        }
      }

      const remarksSection = {
        remarks: premiumCalculation.remarks || null,
      };

      let docs: any[] = [];

      if (documents && Array.isArray(documents)) {
        docs = documents.map((doc) => ({
          id: Number(doc.id),
          documentTypeLid: Number(doc.documentTypeLid),
          documentId: Number(doc.documentId),
        }));
      }
      if (docs.length === 0) {
        docs = [
          {
            documentId: null,
            documentTypeLid: null,
          },
        ];
      }

      return {
        id: Number(premiumCalculation.id),
        opportunityActivityId: Number(premiumCalculation.opportunityActivityId),
        statusLid: Number(premiumCalculation.statusLid),
        dataActivity: {
          premiumCalculationDetails,
          remarksSection,
          documents: docs,
        },
      };
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : errorMessages.premiumCalculationRetrieveFailed
          );
    }
  }
  async getQuoteByOpportunityActivityId(
    opportunityActivityId: number
  ): Promise<any> {
    try {
      const quote =
        await this.opportunityRepository.getQuoteByOpportunityActivityId(
          opportunityActivityId
        );
      if (!quote) {
        throw new NotFoundException(
          `Quote not found for Opportunity Activity Id: ${opportunityActivityId}`
        );
      }
      let documents: any[] = quote?.documents ?? [];
      if (documents.length > 0) {
        documents = documents.map(({ opportunityActivityId, ...rest }) => rest);
      } else {
        documents = [
          {
            documentId: null,
            documentTypeLid: null,
          },
        ];
      }

      return {
        id: Number(quote.id),
        opportunityActivityId: Number(quote.opportunityActivityId),
        statusLid: Number(quote.statusLid),
        dataActivity: {
          remarksSection: {
            remarks: quote.remarks,
          },
          mainDocuments: documents,
        },
      };
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving quote by opportunity activity ID"
          );
    }
  }
  async getBrokingSlipVersionsByOpportunityId(
    opportunityId: number
  ): Promise<BrokingSlipVersionsListDto[] | null> {
    try {
      const brokingSlipVersions =
        await this.opportunityRepository.getBrokingSlipVersionsByOpportunityId(
          opportunityId
        );
      if (!brokingSlipVersions || brokingSlipVersions.length === 0) {
        throw new NotFoundException(
          `Broking slip versions not found for opportunity ID ${opportunityId}`
        );
      }
      return brokingSlipVersions;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving broking slip versions by opportunity Id"
          );
    }
  }

  async getBrokingSlipVersionDetailsByOpportunityActivityId(
    opportunityActivityId: number
  ): Promise<Partial<BrokingSlipDataDto> | null> {
    try {
      const opportunityActivity =
        await this.opportunityRepository.getOpportunityActivity(
          opportunityActivityId
        );
      if (!opportunityActivity) {
        throw new NotFoundException(
          `Opportunity Activity with ID ${opportunityActivityId} not found.`
        );
      }
      const brokingSlip =
        await this.opportunityRepository.getBrokingSlipDetailsByOpportunityId(
          opportunityActivity.opportunityId
        );
      if (!brokingSlip) {
        throw new NotFoundException(
          `Broking slip not found for opportunity Activity ID ${opportunityActivityId}`
        );
      }
      const approverDetails =
        await this.opportunityRepository.getActivityApproverDetails(
          opportunityActivityId
        );
      return {
        ...brokingSlip,
        statusLid: Number(opportunityActivity.statusLid),
        opportunityActivityId: Number(opportunityActivityId),
        approverDetails: approverDetails,
      };
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving broking slip by opportunity Id"
          );
    }
  }

  async getBrokingSlipVersionDetailsByVersionId(
    opportunityId: number,
    versionId: number
  ): Promise<BrokingSlipVersionDetailsDto | null> {
    try {
      const brokingSlip =
        await this.opportunityRepository.getBrokingSlipByVersionId(
          versionId,
          opportunityId
        );
      if (!brokingSlip) {
        throw new NotFoundException(
          `Broking slip not found for opportunity ID ${opportunityId}`
        );
      }
      return brokingSlip;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving broking slip by opportunity ID"
          );
    }
  }

  async generateBrokingSlipVersion(
    brokingSlipData: CreateBrokingSlipVersionDto,
    createdBy: number,
    opportunityId: number
  ): Promise<BrokingSlipVersionDetailsDtoWithId | null> {
    try {
      const response =
        await this.opportunityRepository.generateBrokingSlipVersion(
          brokingSlipData.brokingSlipVersionDetails,
          createdBy,
          opportunityId
        );

      if (!response) {
        throw new NotFoundException(
          `Broking slip not created for opportunity activity ID ${brokingSlipData.opportunityActivityId}`
        );
      } else {
        let result = await this.getBrokingSlipVersionDetailsByVersionId(
          opportunityId,
          response
        );
        if (!result) {
          throw new NotFoundException(
            `Broking slip not created for opportunity activity ID ${brokingSlipData.opportunityActivityId}`
          );
        }
        let BrokingSlipVersionData: BrokingSlipVersionDetailsDtoWithId = {
          formData: result?.formData,
          versionId: response,
          versionName: result?.versionName,
        };
        const brokingSlipDetails =
          await this.opportunityActivityMapRepository.findOne({
            where: { id: brokingSlipData.opportunityActivityId },
          });
        if (
          brokingSlipDetails?.approval?.toUpperCase() !== ACTIVITY_APPROVAL_YES
        ) {
          await this.opportunityRepository.updateNextActivityStatus(
            brokingSlipData.opportunityActivityId,
            brokingSlipData.statusLid
          );
        }
        const approverDetails =
          await this.opportunityRepository.getActivityApproverDetails(
            brokingSlipData.opportunityActivityId
          );
        BrokingSlipVersionData.approverDetails = approverDetails;
        return BrokingSlipVersionData;
      }
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error creating broking slip versions"
          );
    }
  }

  async deleteBrokingSlipVersion(
    opportunityId: number,
    versionId: number
  ): Promise<any> {
    try {
      await this.dataSource.transaction(async (entityManager) => {
        // Step 1: find the  details of the related broking slip version and delete them
        await this.opportunityRepository.deleteBrokingSlipVersionDetails(
          entityManager,
          opportunityId,
          versionId
        );

        // step 2: find the details of the related covers mapped to the version and delete them
        await this.opportunityRepository.deleteBrokingSlipVersionMappedCoversDetails(
          entityManager,
          versionId
        );
      });
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Failed to update broking slip version."
          );
    }
  }

  async checkOpportunityActivityStatus(
    opportunityActivityId: number
  ): Promise<Boolean | null> {
    try {
      return await this.opportunityRepository.getOpportunityActivityStatus(
        opportunityActivityId
      );
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Failed to get the status of opportunity activity Id."
          );
    }
  }

  async updateBrokingSlipVersions(
    opportunityActivityId: number,
    versionId: number,
    brokingSlipVersionDetails: BrokingSlipVersionDetailsDto,
    statusLid: number
  ): Promise<BrokingSlipVersionDetailsDtoWithId | null> {
    try {
      const opportunityActivityMapData =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );

      if (!opportunityActivityMapData) {
        throw new NotFoundException(
          `Opportunity activity not found for ID: ${opportunityActivityId}`
        );
      }
      // TODO: Uncomment for checking the status of the opportunity activity
      // Check for the submitted activity status based on the opportunity activity Id
      // let brokingSlipActivityDataSubmitted = await this.checkOpportunityActivityStatus(opportunityActivityId);
      // if(brokingSlipActivityDataSubmitted) {
      //   throw new NotFoundException(
      //     `Opportunity activity with ID ${opportunityId} is already submitted.`
      //   );
      // }
      await this.dataSource.transaction(async (entityManager) => {
        // Step 1: find the  details of the related broking slip version and update them
        await this.opportunityRepository.updateBrokingSlipVersionDetails(
          entityManager,
          {
            basicPremium:
              brokingSlipVersionDetails.formData.versionDetails.basicPremium,
            brokeragePercentage:
              brokingSlipVersionDetails.formData.versionDetails
                .brokeragePercentage,
            brokerageAmount:
              brokingSlipVersionDetails.formData.versionDetails.brokerageAmount,
            sumInsured:
              brokingSlipVersionDetails.formData.versionDetails.sumInsured,
            brokingSlipName: brokingSlipVersionDetails.versionName,
            brokingSlipVersion: versionId,
            businessActivity:
              brokingSlipVersionDetails.formData.versionDetails
                .businessActivity,
            policyFrom: new Date(
              brokingSlipVersionDetails.formData.versionDetails.policyFrom
            ),
            policyTo: new Date(
              brokingSlipVersionDetails.formData.versionDetails.policyTo
            ),
            id: versionId,
            renewalDate: new Date(
              brokingSlipVersionDetails.formData.versionDetails.renewalDate
            ),
            quoteReceiptTimeline: new Date(
              brokingSlipVersionDetails.formData.versionDetails.quoteReceiptTimeline
            ),
            opportunityId: opportunityActivityMapData.opportunityId,
          }
        );

        // step 2: find the details of the related covers mapped to the version and update them
        await this.opportunityRepository.updateBrokingSlipVersionMappedCoversDetails(
          entityManager,
          brokingSlipVersionDetails.formData.coversConfig,
          versionId
        );
      });
      let result = await this.getBrokingSlipVersionDetailsByVersionId(
        opportunityActivityMapData.opportunityId,
        versionId
      );
      if (!result) {
        throw new NotFoundException(
          `Broking slip not created for opportunity ID ${opportunityActivityMapData.opportunityId}`
        );
      }
      let BrokingSlipVersionData: BrokingSlipVersionDetailsDtoWithId = {
        formData: result?.formData,
        versionId: versionId,
        versionName: result?.versionName,
      };
      return BrokingSlipVersionData;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Failed to update broking slip version."
          );
    }
  }

  async updateBrokingSlipData(
    opportunityActivityId: number,
    brokingSlipDetails: BrokingSlipFormDataDto,
    statusLid: number,
    user: number,
    activityStatusKey: string
  ): Promise<{ data: Partial<BrokingSlipDataDto> | null; message: string }> {
    try {
      const opportunityActivityMapData =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );

      if (!opportunityActivityMapData) {
        throw new NotFoundException(
          `Opportunity activity not found for ID: ${opportunityActivityId}`
        );
      }

      const {
        preferredTPADetails,
        preferredInsurerDetails,
        others,
        documents,
      } = brokingSlipDetails;
      // const otherFieldsDtoClass: any =
      //   activityStatusKey === ACTIVITY_STATUS.SAVE
      //     ? OptionalBrokingSlipFormDataCommentsDto
      //     : BrokingSlipFormDataCommentsDto;
      const insurerFieldDtoClass: any =
        activityStatusKey === ACTIVITY_STATUS.SAVE
          ? SaveBrokingSlipFormDataDto
          : BrokingSlipFormDataDto;
      // const otherFieldsDtoInstance = plainToInstance(
      //   otherFieldsDtoClass,
      //   others
      // );
      const insurerFieldsDtoInstance = plainToInstance(insurerFieldDtoClass, {
        preferredTPADetails,
        preferredInsurerDetails,
        others,
        documents,
      });
      // Add these options to validate nested objects
      const validationOptions = {
        forbidUnknownValues: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        skipMissingProperties: false,
      };

      // const otherFieldErrors = await validate(
      //   otherFieldsDtoInstance as any,
      //   validationOptions
      // );

      const insurerFieldErrors = await validate(
        insurerFieldsDtoInstance as any,
        validationOptions
      );
      const errors = insurerFieldErrors;
      if (errors.length > 0) {
        const flattenErrors = (
          validationErrors: ValidationError[],
          parentPath = ""
        ): string[] => {
          return validationErrors.flatMap((error) => {
            // Detect if this level is an array index (e.g. "0", "1", ...)
            const isIndex = /^\d+$/.test(error.property);

            // Build the full property path with proper array notation
            const propertyPath = parentPath
              ? isIndex
                ? `${parentPath}[${error.property}]` // preferredInsurerDetails[0]
                : `${parentPath}.${error.property}` // preferredInsurerDetails[0].insurerLocationId
              : isIndex
              ? `[${error.property}]`
              : error.property;

            // Handle current level constraints
            const currentErrors = error.constraints
              ? Object.values(error.constraints).map(
                  (msg) => `${propertyPath}: ${msg}`
                )
              : [];

            // Recurse into children
            const childrenErrors =
              error.children && error.children.length > 0
                ? flattenErrors(error.children, propertyPath)
                : [];

            return [...currentErrors, ...childrenErrors];
          });
        };

        const flattenedErrors = flattenErrors(errors);
        throw new BadRequestException({
          status: HttpStatus.BAD_REQUEST,
          error: "Bad Request",
          message: flattenedErrors,
        });
      }

      const status = await this.lookUpRepository.findOne({
        where: { id: statusLid },
      });
      if (!status) {
        throw new NotFoundException(`Status with ID ${statusLid} not found`);
      }

      // TODO: Uncomment for checking the status of the opportunity activity
      // Check for the submitted activity status based on the opportunity activity Id
      // let brokingSlipActivityDataSubmitted = await this.checkOpportunityActivityStatus(opportunityActivityId);
      // if(brokingSlipActivityDataSubmitted) {
      //   throw new NotFoundException(
      //     `Opportunity activity with ID ${opportunityId} is already submitted.`
      //   );
      // }
      await this.dataSource.transaction(async (entityManager) => {
        await this.opportunityRepository.updateBrokingSlipDetails(
          entityManager,
          {
            insurerRemarks: others?.insurerRemarks ?? null,
            remarks: others.remarks,
            riskMitigationFeatures: others?.riskMitigationFeatures ?? null,
            clauses: others?.clauses ?? null,
            opportunityId: opportunityActivityMapData.opportunityId,
          },
          user
        );
        if (preferredInsurerDetails?.length) {
          await this.opportunityRepository.updateBrokingSlipMappedPreferredInsurerDetails(
            entityManager,
            preferredInsurerDetails,
            opportunityActivityMapData.opportunityId
          );
        }
        if (preferredTPADetails?.length) {
          await this.opportunityRepository.updateBrokingSlipMappedPreferredTpaDetails(
            entityManager,
            preferredTPADetails,
            opportunityActivityMapData.opportunityId
          );
        }
        if (documents?.length) {
          await this.opportunityRepository.updateBrokingSlipMappedDocumentDetails(
            entityManager,
            documents,
            opportunityActivityMapData.opportunityId,
            opportunityActivityId
          );
          await this.opportunityRepository.updateExistingDocumentsStatus(
            entityManager,
            opportunityActivityId,
            documents.map((doc) => doc.documentId)
          );
        }
        // update the OpportunityActivityMap with the new status
        await this.opportunityRepository.updateOpportunityActivityMapStatus(
          opportunityActivityId,
          statusLid,
          user,
          null,
          entityManager
        );

        if (status.lookUpKey === OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED) {
          const needsApproval =
            await this.opportunityRepository.isOpportunityActivityNeedsApproval(
              opportunityActivityId
            );
          if (needsApproval) {
            await this.createAndAssignTask(
              opportunityActivityId,
              entityManager,
              ACL_CATEGORY.ISG_ACTIVITY,
              ACL_ACTIONS.APPROVE_ISG,
              user,
              APPROVAL_TASK_NAMES.BROKING_SLIP_ENTRY,
              TASK_TYPE.APPROVAL
            );
          }
        }
      });

      let result =
        await this.opportunityRepository.getBrokingSlipDetailsByOpportunityId(
          opportunityActivityMapData.opportunityId
        );
      if (!result) {
        throw new NotFoundException(
          `Broking slip not created for opportunity ID ${opportunityActivityMapData.opportunityId}`
        );
      }
      const brokingSlipDetailsData =
        await this.opportunityActivityMapRepository.findOne({
          where: { id: opportunityActivityId },
        });
      if (
        brokingSlipDetailsData?.approval?.toUpperCase() !==
        ACTIVITY_APPROVAL_YES
      ) {
        await this.opportunityRepository.updateNextActivityStatus(
          opportunityActivityId,
          statusLid
        );
      }

      // check if it is an activity that needs approval
      // const assignedUser: any =
      // await this.scopeService.getParentUserWithPrivilege(
      //   user,
      //   ACL_CATEGORY.ISG_ACTIVITY,
      //   ACL_ACTIONS.APPROVE_ISG
      // );
      // if (!assignedUser) {
      //   this.logger.log({
      //     level: "info",
      //     message: buildLogMessage({
      //       traceId: this.traceIdService.traceId,
      //       status: "failure",
      //       location: "OpportunityService",
      //       method: "updateBrokingSlipData",
      //       messageData: `No user found with privileges for assigning activity with ID ${opportunityActivityId}`,
      //     }),
      //   });
      //   throw new NotFoundException(
      //     `No user found with privileges for assigning activity with ID ${opportunityActivityId}`
      //   );
      // }
      // if (status.lookUpKey === OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED) {
      //   const needsApproval =
      //     await this.opportunityRepository.isOpportunityActivityNeedsApproval(
      //       opportunityActivityId
      //     );
      //   if (needsApproval) {
      //     const createTask =
      //       await this.opportunityRepository.createOpportunityActivityTaskObject(
      //         opportunityActivityId,
      //         APPROVAL_TASK_NAMES.BROKING_SLIP_ENTRY,
      //         TASK_TYPE.APPROVAL,
      //         assignedUser.userId,
      //         user ?? assignedUser.userId
      //       );
      //     if (!createTask) {
      //       throw new NotFoundException(
      //         `Task creation object for opportunity activity ID ${opportunityActivityId} not found`
      //       );
      //     }
      //     await this.taskService.createTask(createTask);
      //   }
      // }
      const approverDetails =
        await this.opportunityRepository.getActivityApproverDetails(
          opportunityActivityId
        );
      return {
        data: {
          ...result,
          statusLid: Number(statusLid),
          opportunityActivityId: Number(opportunityActivityId),
          approverDetails: approverDetails,
        },
        message: getMessage(activityStatusKey as any),
      };
    } catch (error) {
      throw error instanceof BadRequestException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Failed to update broking slip version."
          );
    }
  }

  async updateHeldCoverNoteById(
    opportunityActivityId: number,
    updateHeldCoverNoteData: UpdateHeldCoverNoteDto,
    userId: number
  ): Promise<any> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        updateHeldCoverNoteData,
        LOOK_UP_DATA
      );

      const opportunityActivity =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );

      await this.handleHeldCoverNoteActivity(
        opportunityActivity,
        updateHeldCoverNoteData,
        userId
      );

      return await this.getHeldCoverNoteActivity(opportunityActivityId);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update held cover note activity: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async updatePolicyConfirmationById(
    opportunityActivityId: number,
    updatePolicyConfirmationData: UpdatePolicyConfirmationDto,
    userId: number
  ): Promise<any> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        updatePolicyConfirmationData,
        LOOK_UP_DATA
      );

      const opportunityActivityData =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );

      return this.handlePolicyConfirmation(
        opportunityActivityData,
        updatePolicyConfirmationData,
        userId
      );
    } catch (error) {
      throw error instanceof NotFoundException ||
        error instanceof BadRequestException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : errorMessages.policyConfirmationUpdateFailed
          );
    }
  }

  async updatePolicyHardCopyById(
    opportunityActivityId: number,
    updatePolicyHardCopyData: UpdatePolicyHardCopyDto,
    userId: number
  ): Promise<any> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        updatePolicyHardCopyData,
        LOOK_UP_DATA
      );

      const opportunityActivity =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );

      const policyHardCopyData = await this.handlePolicyHardCopy(
        opportunityActivity,
        updatePolicyHardCopyData,
        userId
      );

      return { id: policyHardCopyData.id, ...updatePolicyHardCopyData };
    } catch (error) {
      throw error instanceof NotFoundException ||
        error instanceof BadRequestException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : errorMessages.policyHardCopyUpdateFailed
          );
    }
  }
  async createHandOverMeet(
    createHandOverMeetDto: CreateHandOverMeetDto,
    userId: number
  ) {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        createHandOverMeetDto,
        LOOK_UP_DATA
      );
      const {
        opportunityActivityId,
        statusLid,
        activityStatusKey,
        participants,
        documents,
        ...handOverMeetingData
      } = createHandOverMeetDto;
      const opportunityActivity =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );
      await this.handleHandOverMeet(
        opportunityActivity,
        statusLid,
        activityStatusKey,
        participants,
        documents,
        handOverMeetingData,
        userId
      );
      return this.getHandOverMeetById(opportunityActivityId);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to create Hand Over meeting"
      );
    }
  }

  async handleHandOverMeet(
    opportunityActivity: OpportunityActivityDto,
    statusLid: number,
    activityStatusKey: string,
    participants: ParticipantsDto,
    documents: OpportunityActivityDocumentDto[],
    handOverMeetingData: CreateHandOverMeetDto,
    userId: number
  ) {
    try {
      const opportunityActivityId = opportunityActivity.id;
      return await this.dataSource.transaction(async (manager) => {
        if (handOverMeetingData.handOverMeetFields.handOverMeetingTypeLid) {
          handOverMeetingData.handOverMeetFields.selectMeeting =
            await this.opportunityRepository.verifyTypeOfMeeting(
              MEETING_NAME.HANDOVER,
              handOverMeetingData.handOverMeetFields.handOverMeetingTypeLid,
              handOverMeetingData.handOverMeetFields?.selectMeeting
            );
        }
        if (handOverMeetingData.handOverMeetFields.meetingTypeLid) {
          await this.verifyMeetingType(
            handOverMeetingData.handOverMeetFields.meetingTypeLid,
            MEETING_TYPE_KEY.HANDOVER,
            MEETING_NAME.HANDOVER
          );
        }
        const participantsData = this.prepareParticipantsData(
          participants,
          opportunityActivity.companyId
        );

        const existingMeetingId =
          handOverMeetingData.handOverMeetFields.selectMeeting;
        if (existingMeetingId) {
          const existingMeeting = await this.meetingRepo.findOne({
            where: { id: existingMeetingId },
          });
          if (!existingMeeting) {
            throw new NotFoundException(
              `Meeting with ID ${existingMeetingId} not found.`
            );
          }
        }

        if (
          activityStatusKey == ACTIVITY_STATUS.COMPLETE ||
          activityStatusKey == ACTIVITY_STATUS.SUBMIT
        ) {
          const meetingStatus = await getLookups(
            this.lookUpRepository,
            [MEETING_STATUS.COMPLETED],
            LOOK_UP_FIELD.KEY
          );
          const lookups = await getLookup(
            meetingStatus,
            [MEETING_STATUS.COMPLETED],
            LOOK_UP_FIELD.KEY
          );
          const meetingData = this.removeUndefinedFields({
            opportunityId: opportunityActivity.opportunityId,
            activityId: opportunityActivityId,
            companyId: opportunityActivity.companyId,
            meetingSubject: DEFAULT_HAND_OVER_MEET,
            meetingAgenda: DEFAULT_HAND_OVER_MEET,
            meetingTypeLid:
              handOverMeetingData.handOverMeetFields.meetingTypeLid,
            meetingDate: handOverMeetingData.handOverMeetFields.meetingDate,
            startTime: handOverMeetingData.handOverMeetFields.availableFrom,
            endTime: handOverMeetingData.handOverMeetFields.availableTo,
            locationTypeLid:
              handOverMeetingData.handOverMeetFields.locationTypeLid,
            companyParticipants: participantsData?.companyParticipants,
            employeeParticipants: participantsData?.employeeParticipants,
            documents: documents,
            meetingStatusLid: lookups[`lookup_${MEETING_STATUS.COMPLETED}`].id,
          });
          if (existingMeetingId) {
            // Update the existing meeting
            const meetingUpdateData = this.removeUndefinedFields({
              ...meetingData,
              updatedBy: userId,
            });
            await this.meetingService.updateMeeting(
              existingMeetingId,
              meetingUpdateData,
              manager,
              true
            );
          } else {
            // Create a new meeting
            await this.meetingService.createMeeting(
              {
                ...meetingData,
                createdBy: userId,
                updatedBy: userId,
              },
              manager
            );
          }

          const needsApproval =
            await this.opportunityRepository.isOpportunityActivityNeedsApproval(
              opportunityActivityId
            );
          if (needsApproval) {
            await this.createAndAssignTask(
              opportunityActivityId,
              manager,
              ACL_CATEGORY.ISG_ACTIVITY,
              ACL_ACTIONS.APPROVE_ISG,
              userId,
              APPROVAL_TASK_NAMES.HAND_OVER_MEET,
              TASK_TYPE.APPROVAL
            );
          }
        }

        await this.opportunityRepository.saveHandOverMeet(
          manager,
          opportunityActivityId,
          this.removeUndefinedFields({
            meetingId: existingMeetingId,
            opportunityId: opportunityActivity.opportunityId,
            activityId: opportunityActivity.activityId,
            opportunityActivityId,
            handOverMeetingTypeLid:
              handOverMeetingData.handOverMeetFields.handOverMeetingTypeLid,
            selectMeeting:
              handOverMeetingData?.handOverMeetFields?.selectMeeting ?? null,
            remarks: handOverMeetingData?.remarksMomSection?.remarks,
            mom: handOverMeetingData?.remarksMomSection?.mom,
            meetingDate: handOverMeetingData.handOverMeetFields.meetingDate,
            startTime: handOverMeetingData.handOverMeetFields.availableFrom,
            endTime: handOverMeetingData.handOverMeetFields.availableTo,
            locationTypeLid:
              handOverMeetingData.handOverMeetFields.locationTypeLid,
            statusLid,
          }),
          userId
        );

        // update the OpportunityActivityMap with the new status
        await this.opportunityRepository.updateOpportunityActivityMapStatus(
          opportunityActivityId,
          statusLid,
          userId,
          activityStatusKey == ACTIVITY_STATUS.COMPLETE ? new Date() : null,
          manager,
          activityStatusKey
        );

        if (participants) {
          await this.opportunityRepository.saveOpportunityMeetingParticipants(
            opportunityActivityId,
            {
              companyParticipants: participantsData?.companyParticipants,
              employeeParticipants: participantsData?.employeeParticipants,
            },
            manager,
            activityStatusKey
          );
        }

        if (documents) {
          await this.opportunityRepository.saveActivityDocuments(
            manager,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.OPPORTUNITY_MEETING_DOCUMENT_MAP,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.OPPORTUNITY_MEETING_DOCUMENT_MAP_ID,
            opportunityActivityId,
            documents
          );
          await this.opportunityRepository.updateDocumentStatus(
            manager,
            documents.map((doc) => doc.documentId)
          );
        }

        await this.opportunityRepository.updateNextActivityStatus(
          opportunityActivityId,
          statusLid,
          manager
        );

        return true;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw error;
    }
  }

  // Approval task creation and assignment
  async createAndAssignTask(
    opportunityActivityId: number,
    entityManager: EntityManager,
    aclCategoryKey: string,
    aclActionKey: string,
    userId: number,
    taskName: string,
    taskType: string
  ) {
    try {
      // Creating Assignment task
      const assignedUser: any =
        await this.scopeService.getParentUserWithPrivilege(
          userId,
          aclCategoryKey,
          aclActionKey
        );
      if (!assignedUser) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "OpportunityService",
            method: "createAndAssignTask",
            messageData: `No user found with privileges for assigning activity with ID ${opportunityActivityId}`,
          }),
        });
        throw new NotFoundException(
          `No user found with privileges for assigning activity with ID ${opportunityActivityId}`
        );
      }
      const createTask =
        await this.opportunityRepository.createOpportunityActivityTaskObject(
          opportunityActivityId,
          taskName,
          taskType,
          assignedUser.userId,
          userId ?? assignedUser.userId
        );
      if (!createTask) {
        throw new NotFoundException(
          `Task creation object for opportunity activity ID ${opportunityActivityId} not found`
        );
      }
      await this.taskService.createTask(createTask, entityManager);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Faild to create and assign task: ${error.message}`
      );
    }
  }

  async getQuotesBasedOnOpportunityActivityId(
    opportunityActivityId: number,
    page: number,
    limit: number
  ) {
    try {
      const opportunityActivity =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );
      if (!opportunityActivity) {
        throw new NotFoundException(
          `Opportunity activity with ID ${opportunityActivityId} not found.`
        );
      }
      const quotes =
        await this.opportunityRepository.getQuotesBasedOnOpportunityActivityId(
          opportunityActivity.opportunityId,
          page,
          limit
        );
      if (!quotes || quotes?.length === 0) {
        throw new NotFoundException(
          `No quotes found for Opportunity Activity ID ${opportunityActivityId}.`
        );
      }
      return quotes;
    } catch (error) {
      console.error("Error fetching quotes:", error);
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to fetch quotes for the given Opportunity Activity ID."
      );
    }
  }

  async getQuoteById(quoteId: number) {
    try {
      const quote = await this.opportunityRepository.getQuoteById(quoteId);
      if (!quote) {
        throw new NotFoundException(`Quote with ID ${quoteId} not found.`);
      }
      return quote;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to fetch quote by ID."
      );
    }
  }

  async createFinalNegotiationActivity(
    finalNegotiationDetails: CreateFinalNegotiationActivityDto,
    userId: number
  ) {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        finalNegotiationDetails,
        LOOK_UP_DATA
      );

      return await this.handleFinalNegotiationActivity(
        finalNegotiationDetails,
        userId
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create final negotiation activity: ${error.message}`
      );
    }
  }

  async updateFinalNegotiationActivity(
    opportunityActivityId: number,
    finalNegotiationDetails: UpdateFinalNegotiationActivityDto,
    userId: number
  ) {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        finalNegotiationDetails,
        LOOK_UP_DATA
      );
      finalNegotiationDetails.opportunityActivityId = opportunityActivityId;
      return await this.handleFinalNegotiationActivity(
        finalNegotiationDetails,
        userId
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update final negotiation activity: ${error.message}`
      );
    }
  }

  async handleFinalNegotiationActivity(
    finalNegotiationDetails:
      | CreateFinalNegotiationActivityDto
      | UpdateFinalNegotiationActivityDto,
    userId: number
  ) {
    try {
      const {
        meetingDetails,
        policyDetails,
        selectFinalisedQuote,
        netPremiumDetails,
        quoteTaxDetails,
        insurerDetails,
        variationIssuesFromQCR,
        insurerServiceLevelAgreement,
        documents,
        otherCommentsFromInsurer,
        remarks,
        meetingSummary,
        tpaParticipants,
        insurerParticipants,
        participants,
        covers,
        quoteDocuments,
        opportunityActivityId,
        statusLid,
        activityStatusKey,
      } = finalNegotiationDetails;

      const opportunityActivity =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );

      const negData = {
        opportunityActivityId,
        statusLid,
        ...policyDetails,
        ...selectFinalisedQuote,
        ...netPremiumDetails,
        otherInsurerComments: otherCommentsFromInsurer?.remarks,
        ...remarks,
        ...meetingSummary,
      };
      return await this.dataSource.transaction(async (manager) => {
        if (meetingDetails?.isFinalNegotiationTypeLid) {
          meetingDetails.selectMeeting =
            await this.opportunityRepository.verifyTypeOfMeeting(
              MEETING_NAME.FINAL_NEGOTIATION,
              meetingDetails?.isFinalNegotiationTypeLid,
              meetingDetails?.selectMeeting
            );
        }
        if (meetingDetails?.meetingTypeLid) {
          await this.verifyMeetingType(
            meetingDetails.meetingTypeLid,
            MEETING_TYPE_KEY.FINAL_NEGOTIATION,
            MEETING_NAME.FINAL_NEGOTIATION
          );
        }
        const existingMeetingId = meetingDetails?.selectMeeting;
        let participantsData;
        if (participants) {
          participantsData = this.prepareParticipantsData(
            participants,
            opportunityActivity.companyId
          );
        }
        let existingMeeting;
        if (existingMeetingId) {
          existingMeeting = await this.meetingRepo.findOne({
            where: { id: existingMeetingId },
          });
          if (!existingMeeting) {
            throw new NotFoundException(
              `Meeting with ID ${existingMeetingId} not found.`
            );
          }
        }
        if (activityStatusKey == ACTIVITY_STATUS.COMPLETE) {
          const meetingStatus = await getLookups(
            this.lookUpRepository,
            [MEETING_STATUS.COMPLETED],
            LOOK_UP_FIELD.KEY
          );
          const lookups = await getLookup(
            meetingStatus,
            [MEETING_STATUS.COMPLETED],
            LOOK_UP_FIELD.KEY
          );
          const meetingData = this.removeUndefinedFields({
            opportunityId: opportunityActivity.opportunityId,
            activityId: opportunityActivityId,
            companyId: opportunityActivity.companyId,
            meetingSubject: DEFAULT_FINAL_NEGOTIATION_MEETING,
            meetingAgenda: DEFAULT_FINAL_NEGOTIATION_MEETING,
            meetingTypeLid: meetingDetails?.meetingTypeLid,
            meetingDate: meetingDetails?.meetingDate,
            startTime: meetingDetails?.availableFrom,
            endTime: meetingDetails?.availableTo,
            locationTypeLid: meetingDetails?.locationTypeLid,
            companyParticipants: participantsData?.companyParticipants,
            employeeParticipants: participantsData?.employeeParticipants,
            tpaParticipants: tpaParticipants,
            insurerParticipants: insurerParticipants,
            documents: documents,
            meetingStatusLid: lookups[`lookup_${MEETING_STATUS.COMPLETED}`].id,
          });
          if (existingMeetingId) {
            // Update the existing meeting
            const meetingUpdateData = this.removeUndefinedFields({
              ...meetingData,
              updatedBy: userId,
            });
            await this.meetingService.updateMeeting(
              existingMeetingId,
              meetingUpdateData,
              manager,
              true
            );
          } else {
            // Create a new meeting
            await this.meetingService.createMeeting(
              {
                ...meetingData,
                createdBy: userId,
                updatedBy: userId,
              },
              manager
            );
          }
        }
        const finalNeg = await this.opportunityRepository.saveFinalNegotiation(
          manager,
          opportunityActivityId,
          this.removeUndefinedFields({
            ...negData,
            opportunityId: opportunityActivity.opportunityId,
            activityId: opportunityActivity.activityId,
            meetingId: existingMeetingId,
            isFinalNegotiationTypeLid:
              meetingDetails?.isFinalNegotiationTypeLid,
            selectMeeting: meetingDetails?.selectMeeting,
            meetingDate: meetingDetails?.meetingDate,
            startTime: meetingDetails?.availableFrom,
            endTime: meetingDetails?.availableTo,
            locationTypeLid: meetingDetails?.locationTypeLid,
          }),
          userId
        );
        let insurerData;
        if (insurerDetails) {
          insurerData =
            await this.opportunityRepository.checkInsurerAndBrokerageDetails(
              insurerDetails,
              negData?.basicPremium,
              negData?.policyPlacedTypeLid
            );
        }
        await this.saveFinalNegotiationActivityDetails(
          manager,
          finalNeg,
          insurerData,
          variationIssuesFromQCR,
          insurerServiceLevelAgreement,
          quoteTaxDetails,
          covers,
          quoteDocuments
        );
        // update the OpportunityActivityMap with the new status
        await this.opportunityRepository.updateOpportunityActivityMapStatus(
          opportunityActivityId,
          statusLid,
          userId,
          activityStatusKey == ACTIVITY_STATUS.COMPLETE ? new Date() : null,
          manager,
          activityStatusKey
        );

        if (participants) {
          await this.opportunityRepository.saveOpportunityMeetingParticipants(
            opportunityActivityId,
            {
              companyParticipants: participantsData?.companyParticipants,
              employeeParticipants: participantsData?.employeeParticipants,
              tpaParticipants: tpaParticipants,
              insurerParticipants: insurerParticipants,
            },
            manager,
            activityStatusKey
          );
        }
        if (documents) {
          await this.opportunityRepository.saveActivityDocuments(
            manager,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.OPPORTUNITY_MEETING_DOCUMENT_MAP,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.OPPORTUNITY_MEETING_DOCUMENT_MAP_ID,
            opportunityActivityId,
            documents
          );
        }
        if (documents || quoteDocuments) {
          await this.opportunityRepository.updateDocumentStatus(manager, [
            ...(documents || []).map((docId) => docId.documentId),
            ...(quoteDocuments || []).map((docId) => docId.documentId),
          ]);
        }
        await this.opportunityRepository.updateNextActivityStatus(
          opportunityActivityId,
          statusLid,
          manager
        );
        return true;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save final negotiation details: ${error.message}`
      );
    }
  }

  async saveFinalNegotiationActivityDetails(
    manager: EntityManager,
    finalNegotiation: OpportunityFinalNegotiation,
    insurerDetails: CreateFinalNegotiationSharingDetailDto[] | undefined,
    variationIssuesFromQCR: CreateFinalNegotiationQcrVariationDto[] | undefined,
    insurerServiceLevelAgreement: CreateFinalNegotiationSlaDto[] | undefined,
    quoteTaxDetails: CreateQuoteTaxDetailsDto[] | undefined,
    covers: Record<string, string> | undefined,
    quoteDocuments: OpportunityActivityDocumentDto[] | undefined
  ) {
    try {
      if (insurerDetails) {
        await this.opportunityRepository.saveFinalNegotiationSharingDetails(
          manager,
          finalNegotiation.id,
          insurerDetails
        );
      }
      if (variationIssuesFromQCR) {
        await this.opportunityRepository.saveFinalNegotiationVariations(
          manager,
          finalNegotiation.id,
          variationIssuesFromQCR
        );
      }
      if (insurerServiceLevelAgreement) {
        await this.opportunityRepository.saveFinalNegotiationSla(
          manager,
          finalNegotiation.id,
          insurerServiceLevelAgreement
        );
      }
      if (quoteTaxDetails) {
        await this.opportunityRepository.saveFinalNegotiationQuoteTax(
          manager,
          finalNegotiation.id,
          quoteTaxDetails
        );
      }
      if (covers && Object.keys(covers).length > 0) {
        await this.opportunityRepository.saveFinalNegotiationCovers(
          manager,
          finalNegotiation.id,
          finalNegotiation.finalizedQuoteId,
          finalNegotiation.opportunityId,
          covers
        );
      }
      if (quoteDocuments) {
        const hasDocuments = quoteDocuments.length > 0;
        const hasFinalizedQuote = finalNegotiation.finalizedQuoteId != null;

        if (hasDocuments && !hasFinalizedQuote) {
          throw new BadRequestException(
            "Finalised Quote is required to save quote documents."
          );
        }

        if (hasFinalizedQuote) {
          await this.opportunityRepository.saveFinalNegotiationQuoteDocuments(
            manager,
            finalNegotiation.id,
            quoteDocuments,
            finalNegotiation.finalizedQuoteId
          );
        }
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
    }
  }

  async getFinalNegotiationActivity(opportunityActivityId: number) {
    try {
      return await this.opportunityRepository.getFinalNegotiationActivity(
        opportunityActivityId
      );
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving meeting details"
          );
    }
  }

  // Verifies if the meeting type is of a specific type
  async verifyMeetingType(
    meetingTypeLid: number,
    expectedTypeKey: string,
    meetingName: string
  ) {
    const meetingType = await this.lookUpRepository.findOne({
      where: { id: meetingTypeLid },
    });
    if (!meetingType) {
      throw new NotFoundException(
        `Meeting type with ID ${meetingTypeLid} not found.`
      );
    }
    if (meetingType.lookUpKey !== expectedTypeKey) {
      throw new BadRequestException(
        `Meeting type with ID ${meetingTypeLid} is not a ${meetingName}`
      );
    }
  }

  async createOpportunityLost(
    opportunityLostData: CreateOpportunityLostDto,
    userId: number
  ) {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        opportunityLostData,
        LOOK_UP_DATA
      );
      const opportunity = await this.opportunityRepo.findOne({
        where: {
          opportunityId: opportunityLostData.opportunityId,
        },
      });
      if (!opportunity) {
        throw new NotFoundException(errorMessages.opportunityNotFound);
      }
      return await this.dataSource.transaction(async (entityManager) => {
        const opportunityLost =
          await this.opportunityRepository.createOpportunityLost(
            entityManager,
            {
              opportunityId: opportunityLostData.opportunityId,
              reasonForLossLid:
                opportunityLostData.opportunityLost.reasonForLossLid ?? null,
              injectedBy:
                opportunityLostData.opportunityLost.injectedBy ?? null,
              remarks: opportunityLostData.opportunityLost.remarks,
              statusLid: opportunityLostData.statusLid,
              createdBy: userId,
              updatedBy: userId,
            }
          );

        const url = `${ENV.CLIENT_SERVER_URL}opportunities/${opportunity.opportunityId}`;
        // "Opty. Lost ... — CRM users": add the company's CRM-role users
        // (Lead CRM, Associate CRM, Associate CRM Manager, Account Manager)
        // as additional email recipients, on top of the acting user who is
        // notified today. Rollback via OPPORTUNITY_LOST_ROLE_RECIPIENTS_ENABLED.
        const shouldNotifyCrmUsers =
          (ENV.OPPORTUNITY_LOST_ROLE_RECIPIENTS_ENABLED ?? "true").toLowerCase() !== "false";
        const crmUserEmails =
          shouldNotifyCrmUsers && opportunity.companyId
            ? await this.crmRecipientResolver.getCrmUserEmails(opportunity.companyId)
            : [];
        await this.sendNotification(
          NOTIFICATION_EVENT_TYPES.OPPORTUNITY_LOST,
          url,
          userId,
          true,
          true,
          opportunity.companyId,
          crmUserEmails
        );
        // Create renewal opportunity
        await this.createRenewalOpportunity(opportunity, SALES_OPPORTUNITY);
        return { id: opportunityLost.id };
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to create final negotiation activity."
      );
    }
  }

  // Creates a renewal opportunity
  async createRenewalOpportunity(
    renewalOpportunityDto: Opportunity,
    opty_type?: string
  ) {
    try {
      const { opportunityId, createdAt, updatedAt, ...opportunityData } =
        renewalOpportunityDto;
      let riskLocations: OpportunityRiskLocationDto[] = [];
      let contacts: OpportunityContactMapDto[] = [];
      if (opportunityId) {
        // opportunity lost
        const expOptyRiskLocations =
          await this.opportunityRiskLocationsRepository.find({
            where: { opportunityId: opportunityId },
          });
        riskLocations = expOptyRiskLocations.map((riskLocation) => ({
          addressId: riskLocation.addressId,
        }));
        const expOptyContacts = await this.opportunityContactMapRepository.find(
          { where: { opportunityId: opportunityId } }
        );
        contacts = expOptyContacts.map((contact) => ({
          contactId: contact.contactId,
        }));
        opportunityData.refOpportunityId = opportunityId;
      } else if (renewalOpportunityDto.companyId) {
        // RO creation
        let renewalOptyRiskLocations;
        // Try to get risk locations from the referenced policy first
        renewalOptyRiskLocations =
          await this.policyRiskLocationMapRepository.find({
            where: { policyId: renewalOpportunityDto.refPolicyId },
          });
        if (
          !renewalOptyRiskLocations ||
          renewalOptyRiskLocations.length === 0
        ) {
          // Fallback to company locations if no policy risk locations found
          renewalOptyRiskLocations =
            await this.companyLocationsMapRepository.find({
              where: { companyId: renewalOpportunityDto.companyId },
            });
        }
        riskLocations = renewalOptyRiskLocations.map((riskLocation) => ({
          addressId: riskLocation.addressId,
        }));
        const renewalOptyContacts = await this.companyContactMapRepository.find(
          { where: { companyId: renewalOpportunityDto.companyId } }
        );
        contacts = renewalOptyContacts.map((contact) => ({
          contactId: contact.contactId,
        }));
      } else {
        this.logger.log({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "OpportunityService",
            method: "createRenewalOpportunity",
            payload: { renewalOpportunityDto, opty_type },
            messageData: `No opportunityId or companyId provided for opportunity.`,
          }),
        });
      }
      const now = new Date();
      let opportunityType;
      if (opty_type === SALES_OPPORTUNITY) {
        opportunityType = await this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_TYPE.SO },
        });
        opportunityData.expiryDate = new Date(
          now.getTime() + ONE_YEAR_IN_DAYS * 24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0]; // This produces a string in 'YYYY-MM-DD' format
      } else {
        // Fetch RO opportunityType, policyStatusRenewal, and serviceLevelFullService
        const rolookUpKeys = [
          OPPORTUNITY_TYPE.RO,
          RO_POLICY_STATUS,
          RO_SERVICE_LEVEL,
        ];
        const roLookUps = await this.lookUpRepository.find({
          where: { lookUpKey: In(rolookUpKeys) },
        });
        opportunityType = roLookUps.find(
          (l) => l.lookUpKey === OPPORTUNITY_TYPE.RO
        );
        opportunityData.policyStatusLid =
          roLookUps.find((l) => l.lookUpKey === RO_POLICY_STATUS)?.id ??
          opportunityData.policyStatusLid;
        opportunityData.serviceLevelLid =
          roLookUps.find((l) => l.lookUpKey === RO_SERVICE_LEVEL)?.id ??
          opportunityData.serviceLevelLid;
      }

      if (!opportunityType) {
        throw new NotFoundException(
          `Opportunity type with key ${OPPORTUNITY_TYPE.RO} not found.`
        );
      }
      // Create renewal opportunity with an expiry date of 1 year from now
      return await this.createOpportunity(
        {
          ...opportunityData,
          opportunityTypeLid: opportunityType.id,
          riskLocations: riskLocations,
          contacts: contacts,
          refPolicyId: opportunityData.refPolicyId ?? null,
          expiryDate:
            typeof opportunityData.expiryDate === "string"
              ? opportunityData.expiryDate
              : opportunityData.expiryDate?.toISOString().split("T")[0] ?? null,
        },
        riskLocations,
        [],
        [],
        [],
        contacts,
        renewalOpportunityDto.createdBy,
        opportunityData.refPolicyId
      );
    } catch (error) {
      console.error("Error creating renewal opportunity:", error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        `Failed to create renewal opportunity: ${error.message}`
      );
    }
  }

  async regenerateRenewalOpportunity(fromDate?: string, duration?: number, ROForDefinedPolicySetFlag?: boolean) {
    try {
      const from = fromDate ? new Date(fromDate) : new Date();
      const days = duration ?? ONE_YEAR_IN_DAYS;
      const to = new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
      return await handlePoliciesCloseToExpiryUtil(
        {
          traceId: this.traceIdService.traceId,
          logger: this.logger,
          lookUpRepository: this.lookUpRepository,
          policyRepository: this.policyRepository,
          endorsementRepository: this.endorsementRepository,
          policyAssetEndorsementRepository: this.policyAssetEndorsementRepository,
          policyTypeSegregationRepository: this.policyTypeSegregationRepository,
          createRenewalOpportunity: async (opportunity) => {
            await this.createRenewalOpportunity(
              {
                ...opportunity,
                createdBy: opportunity.ownerId,
                updatedBy: opportunity.ownerId,
                injectedBy: "API",
              } as Opportunity,
              RENEWAL_OPPORTUNITY
            );
          },
        },
        from,
        to,
        ROForDefinedPolicySetFlag
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityService",
          method: "regenerateRenewalOpportunity",
          messageData: error instanceof Error ? error.message : error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `An error occurred while regenerating renewal opportunities. ${error instanceof Error ? error.message : error}`
      );
    }
  }

  async updateOpportunityLost(
    opportunityId: number,
    updateOpportunityLostData: UpdateOpportunityLostDto,
    userId: number
  ) {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        updateOpportunityLostData,
        LOOK_UP_DATA
      );
      const opportunityLostActivityData =
        await this.opportunityRepository.getOpportunityLost(opportunityId);
      if (!opportunityLostActivityData) {
        throw new NotFoundException(
          `Opportunity Lost details not found for opportunity ID ${opportunityId}.`
        );
      }
      return await this.dataSource.transaction(async (entityManager) => {
        const opportunityLost =
          await this.opportunityRepository.updateOpportunityLost(
            entityManager,
            opportunityId,
            {
              reasonForLossLid:
                updateOpportunityLostData?.opportunityLost?.reasonForLossLid ??
                undefined,
              remarks:
                updateOpportunityLostData?.opportunityLost?.remarks ??
                undefined,
              statusLid: updateOpportunityLostData.statusLid,
              updatedBy: userId,
            }
          );
        return { id: opportunityLost?.id };
      });
    } catch (error) {
      throw error instanceof NotFoundException ||
        error instanceof BadRequestException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Failed to update opportunity lost activity."
          );
    }
  }

  // async processRfpCoverDetails(
  //   payload: CreateOpportunityRfpCoverDetailDto,
  //   createdBy: number
  // ): Promise<void> {
  //   try {
  //     return await this.handleRfpCoverDetails(payload, createdBy);
  //   } catch (error) {
  //     this.logError("processRfpCoverDetails", error);
  //     if (
  //       error instanceof NotFoundException ||
  //       error instanceof BadRequestException
  //     ) {
  //       throw error; // Re-throw known exceptions
  //     }
  //     throw new BadRequestException(
  //       `Failed to process RFP Cover Details: ${error.message}`
  //     );
  //   }
  // }

  async handleRfpCoverDetails(
    payload: CreateOpportunityRfpCoverDetailDto,
    userId: number
  ) {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        payload,
        LOOK_UP_DATA
      );
      // Call repository methods for database operations
      const opportunityActivity =
        await this.opportunityRepository.getOpportunityActivityById(
          payload.opportunityActivityId
        );

      const covers = await this.opportunityRepository.getOpportunityRfpCovers(
        opportunityActivity.opportunityId
      );
      if (!covers.length) {
        throw new NotFoundException(
          `No covers found for Opportunity ID ${opportunityActivity.opportunityId}.`
        );
      }
      // Prepare RFP cover details
      const rfpCoverDetails = this.prepareRfpCoverDetails(
        covers,
        payload.coversConfig,
        opportunityActivity.opportunityId,
        userId
      );
      // Save RFP cover details and related data
      return await this.opportunityRepository.saveRfpCoverDetails(
        opportunityActivity.opportunityId,
        payload.opportunityActivityId,
        rfpCoverDetails,
        payload.remarksSection.remarks,
        payload.documents,
        userId,
        payload.statusLid,
        payload.activityStatusKey
      );
    } catch (error) {
      this.logError("handleRfpCoverDetails", error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error; // Re-throw known exceptions
      }
      throw new BadRequestException(
        `Failed to process RFP Cover Details: ${error.message}`
      );
    }
  }

  // async updateRfpCoverDetails(
  //   payload: UpdateOpportunityRfpCoverDetailDto,
  //   updatedBy: number
  // ): Promise<void> {
  //   try {
  //     await this.lookUpValidation.validateDynamicLookupValues(
  //       payload,
  //       LOOK_UP_DATA
  //     );

  //     const opportunityActivity =
  //       await this.opportunityRepository.getOpportunityActivityById(
  //         payload.opportunityActivityId
  //       );

  //     if (!opportunityActivity) {
  //       throw new NotFoundException(
  //         `Opportunity Activity with ID ${payload.opportunityActivityId} not found.`
  //       );
  //     }

  //     const covers = await this.opportunityRepository.getOpportunityRfpCovers(
  //       opportunityActivity.opportunityId
  //     );
  //     if (!covers.length) {
  //       throw new NotFoundException(
  //         `No covers found for Opportunity ID ${opportunityActivity.opportunityId}.`
  //       );
  //     }

  //     const rfpCoverDetails = this.prepareRfpCoverDetails(
  //       covers,
  //       payload.coversConfig,
  //       opportunityActivity.opportunityId,
  //       updatedBy
  //     );

  //     await this.opportunityRepository.saveRfpCoverDetails(
  //       opportunityActivity.opportunityId,
  //       payload.opportunityActivityId,
  //       rfpCoverDetails,
  //       payload.remarksSection.remarks,
  //       payload.documents,
  //       updatedBy,
  //       payload.statusLid,
  //       payload.activityStatusKey
  //     );
  //   } catch (error) {
  //     this.logError("updateRfpCoverDetails", error);
  //     if (
  //       error instanceof NotFoundException ||
  //       error instanceof BadRequestException
  //     ) {
  //       throw error; // Re-throw known exceptions
  //     }
  //     throw new BadRequestException(
  //       `Failed to update RFP Cover Details: ${error.message}`
  //     );
  //   }
  // }

  private prepareRfpCoverDetails(
    covers: any[],
    coversConfig: Record<string, Record<string, string>>,
    opportunityId: number,
    createdBy: number
  ): any[] {
    return covers
      .filter((cover) => coversConfig[cover.id]) // Filter out covers without answers
      .map((cover) => {
        const coverResponseObj = coversConfig[cover.id];
        const coverResponse =
          typeof coverResponseObj === "object"
            ? Object.values(coverResponseObj).join(", ") // Extract and join values if it's an object
            : coverResponseObj; // Use as is if it's already a string
        return {
          opportunityId: Number(opportunityId),
          coverMapId: Number(cover.id),
          policyTypeId: Number(cover.policyTypeId),
          coverName: cover.coverName,
          coverResponse,
          createdBy,
          updatedBy: createdBy,
        };
      });
  }

  async addQuoteCoverDetails(
    manager: EntityManager,
    opportunityActivityId: number,
    covers: any[],
    createdBy: number
  ): Promise<void> {
    try {
      // Step 1: Get opportunity ID from the repository
      const opportunityActivity =
        await this.opportunityRepository.getOpportunityQuoteActivityById(
          manager,
          opportunityActivityId
        );
      if (!opportunityActivity) {
        throw new NotFoundException(
          `Opportunity Activity with ID ${opportunityActivityId} not found.`
        );
      }
      const opportunityId = opportunityActivity.opportunityId;

      // Step 2: Get all covers from the repository
      const coverMaps =
        await this.opportunityRepository.getOpportunityQuoteCovers(
          manager,
          opportunityId
        );

      // Check if covers exist
      if (!coverMaps.length) {
        throw new NotFoundException(
          `No covers found for Opportunity ID ${opportunityId}.`
        );
      }
      // Step 3: Prepare Quote Cover Details for insertion
      const quoteCoverDetails =
        this.opportunityRepository.prepareQuoteCoverDetails(
          covers,
          coverMaps,
          opportunityId,
          createdBy
        );

      // Step 4: Save Quote Cover Details using the repository
      await this.opportunityRepository.saveQuoteCoverDetails(
        manager,
        quoteCoverDetails
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error; // Re-throw known exceptions
      }
      throw new BadRequestException(
        `Failed to insert Quote Cover Details: ${error.message}`
      );
    }
  }

  async addQuoteTaxDetails(
    manager: EntityManager,
    quoteEntryId: number,
    taxDetails: { tax: number; taxValue: number }[],
    createdBy: number
  ): Promise<void> {
    try {
      const records = this.opportunityRepository.prepareQuoteTaxDetails(
        taxDetails,
        quoteEntryId,
        createdBy
      );
      await this.opportunityRepository.saveQuoteTaxDetails(manager, records);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to insert Quote Tax Details: ${error.message}`
      );
    }
  }

  /**
   * Resolves which activity role keys the user may see as the display activity.
   * BD-only -> [BD], ISG-only -> [ISG], both/neither (leadership/super/CS) -> null
   * (unrestricted). Shared by every surface that shows a per-opportunity activity
   * name so BD users never see ISG activities and vice versa.
   */
  private async resolveVisibleActivityRoleKeys(
    userId: number
  ): Promise<string[] | null> {
    if (!userId) return null;
    const { canViewBD, canViewISG } =
      await this.scopeService.getActivityRoleVisibility(userId);
    return canViewBD && !canViewISG
      ? [ROLE_KEY.ROLE_BD_EXECUTIVE]
      : canViewISG && !canViewBD
      ? [ROLE_KEY.ROLE_ISG_EXECUTIVE]
      : null;
  }

  /**
   * For a BD-only viewer, the owner ids whose opportunities stay visible after
   * ISG handover: the viewer plus their whole reporting tree, so managers who
   * approved the BD activities keep tracking the team's deals. Undefined for
   * anyone else (no BD stage gate, or unrestricted).
   */
  private async resolveBdGateOwnerIds(
    userId: number | undefined,
    visibleActivityRoleKeys: string[] | null
  ): Promise<number[] | undefined> {
    const isBdOnly =
      visibleActivityRoleKeys?.length === 1 &&
      visibleActivityRoleKeys[0] === ROLE_KEY.ROLE_BD_EXECUTIVE;
    if (!isBdOnly || !userId) return undefined;
    const reportees = await this.scopeService.getNewEmployeeHierarchyByUserId(
      userId,
      false
    );
    return [userId, ...reportees.map((u) => u.userId)];
  }

  async getOpportunitiesByCompanyId(
    companyId: number,
    page: number,
    limit: number,
    type?: "SO" | "RO",
    search?: string,
    entityIds?: number[],
    sort?: string,
    userId?: number,
    activeOnly?: boolean,
    ownerId?: number,
    viewBy?: "manager" | "team",
    excludeWon?: boolean
  ) {
    try {
      const sortParams = sort
        ? mapSortParams(sort, ENTITY_NAME.OPPORTUNITY.toUpperCase())
        : undefined;
      const visibleActivityRoleKeys =
        await this.resolveVisibleActivityRoleKeys(userId);
      const gateOwnerUserIds = await this.resolveBdGateOwnerIds(
        userId,
        visibleActivityRoleKeys
      );
      const { data, count } =
        await this.opportunityRepository.getOpportunityByCompanyId(
          companyId,
          page,
          limit,
          type,
          search,
          entityIds,
          sortParams,
          visibleActivityRoleKeys,
          activeOnly,
          gateOwnerUserIds,
          userId,
          ownerId,
          viewBy,
          excludeWon
        );

      return {
        data: data,
        count: count,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch opportunities for company ID: ${companyId}. ${error.message}`
      );
    }
  }

  async getOpportunitiesByContactId(
    contactId: number,
    page: number,
    limit: number,
    type?: "SO" | "RO"
  ) {
    try {
      const { data: contactOpportunities, count } =
        await this.opportunityRepository.getOpportunityByContactId(
          contactId,
          page,
          limit,
          type
        );

      const transformedOpportunities = contactOpportunities.map(
        (opportunity) => {
          const contactOpportunity = opportunity?.opportunity;
          const policyTypeData = {
            id: contactOpportunity?.policyType?.id,
            value: contactOpportunity?.policyType?.lookUpValue,
          };
          const statusData = {
            id: contactOpportunity?.status?.id,
            value: contactOpportunity?.status?.lookUpValue,
          };

          // Format the sumInsured with locale-specific number formatting
          const formattedSumInsured = new Intl.NumberFormat("en-IN").format(
            contactOpportunity?.sumInsured
          );
          const opportunityIdentifier = `${policyTypeData.value} (${formattedSumInsured})`;

          return {
            contactId: opportunity.contactId,
            opportunityId: opportunity.opportunityId,
            estimatedBrokerage: opportunity.opportunity.estimatedBrokerage,
            policyType: policyTypeData,
            status: statusData,
            sumInsured: opportunity.opportunity.sumInsured,
            expiryDate: opportunity.opportunity.expiryDate,
            opportunityIdentifier,
          };
        }
      );

      return {
        data: transformedOpportunities,
        count: count,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new Error(
        `Failed to fetch opportunities for contact ID: ${contactId}. ${error.message}`
      );
    }
  }

  async getAllQcrBrokingSlipVersionsData(
    opportunityActivityId: number
  ): Promise<any> {
    try {
      const opportunityActivityMapData =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );

      if (!opportunityActivityMapData) {
        throw new NotFoundException(
          `Opportunity activity not found for ID: ${opportunityActivityId}`
        );
      }
      const opportunity = await this.opportunityRepo.findOne({
        where: { opportunityId: opportunityActivityMapData.opportunityId },
        relations: ["opportunityType"],
      });

      if (!opportunity) {
        throw new NotFoundException(
          `Opportunity not found for ID: ${opportunityActivityMapData.opportunityId}`
        );
      }
      const allActivityData =
        await this.opportunityRepository.getOpportunityActivitiesByOpportunityId(
          opportunityActivityMapData.opportunityId
        );
      const owner = await this.getPlacementSlipGenerationByOwner(
        allActivityData
      );
      const brokingSlipVersionDetails =
        await this.opportunityRepository.getBrokingSlipAndQuoteDetailsData(
          opportunityActivityMapData
        );

      if (!brokingSlipVersionDetails) {
        throw new NotFoundException(
          `Broking Slip Version Details not found for opportunity activity ID ${opportunityActivityId}`
        );
      }

      let transformed: any = [];
      if (brokingSlipVersionDetails.length > 0) {
        transformed = brokingSlipVersionDetails.map((version) => {
          const {
            id,
            opportunityId,
            brokingSlipVersion,
            brokingSlipName,
            quoteEntry = [],
          } = version || {};

          return {
            id,
            opportunityId,
            brokingSlipVersion,
            brokingSlipName,
            owner,
            opportunityType:
              opportunity?.opportunityType?.lookUpValue ?? SALES_OPPORTUNITY,
            quoteEntry: Array.isArray(quoteEntry)
              ? quoteEntry.map((quote, idx) => {
                  return {
                    id: quote?.id,
                    opportunityId: quote?.opportunityId,
                    opportunityActivityId: quote?.opportunityActivityId,
                    brokingSlipId: quote?.brokingSlipId,
                    insurerId: quote?.insurerId,
                    statusId: quote?.statusId,
                    key: `quote_${idx + 1}`,
                    label: quote?.insurer?.insurerName || "-",
                    insurer: {
                      id: quote?.insurer?.id,
                      insurerName: quote?.insurer?.insurerName ?? "-",
                      displayName: quote?.insurer?.displayName ?? "-",
                    },
                  };
                })
              : [],
          };
        });
      }
      return transformed;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : errorMessages.brokingSlipVersionDetailsRetrieveFailed
          );
    }
  }

  async createPlacementSlip(
    dto: UpdatePlacementSlipDto,
    userId: number,
    opportunityId?: number
  ) {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        dto,
        LOOK_UP_DATA
      );
      await this.dataSource.transaction(async (entityManager) => {
        const {
          policyDetails,
          feeDetails,
          installmentDates,
          installmentDetails,
          remarks,
          tpaDetails,
          insurerDetails,
          cdAccountDetails,
          coverDetails,
          statusLid,
          documents,
          ...rest
        } = dto;

        const cdDetailsArray = await this.buildCdDetailsWithDefaults(
          cdAccountDetails,
          dto.opportunityActivityId,
          opportunityId
        );
        const payload = {
          ...rest,
          ...policyDetails,
          ...feeDetails,
          statusLid: statusLid,
          remarks: remarks?.remarks,
          tpaMaps: tpaDetails,
          insurerMaps: insurerDetails,
          cdDetails: cdDetailsArray,
          coverDetails: coverDetails,
          installmentDetails: installmentDetails ?? installmentDates ?? [],
          documents: documents,
        };
        const opportunityActivityId = payload.opportunityActivityId;

        let placementSlip: any;
        const placement = await this.placementRepo.findOne({
          where: { opportunityActivityId: opportunityActivityId },
        });

        if (!placement) {
          placementSlip = await this.opportunityRepository.createPlacementSlip(
            payload,
            userId,
            entityManager
          );
        } else {
          (payload as any).updatedBy = userId;
          placementSlip = await this.opportunityRepository.updatePlacementSlip(
            placement.id,
            payload,
            entityManager
          );
        }

        // check if it is an activity that needs approval
        const status = await this.lookUpRepository.findOne({
          where: { id: statusLid },
        });
        if (!status) {
          throw new NotFoundException(`Status with ID ${statusLid} not found`);
        }

        // All the below functionality is being performed in createAndAssignTask method
        // const assignedUser: any =
        //   await this.scopeService.getParentUserWithPrivilege(
        //     userId,
        //     ACL_CATEGORY.ISG_ACTIVITY,
        //     ACL_ACTIONS.APPROVE_ISG
        //   );
        // if (!assignedUser) {
        //   this.logger.log({
        //     level: "info",
        //     message: buildLogMessage({
        //       traceId: this.traceIdService.traceId,
        //       status: "failure",
        //       location: "OpportunityService",
        //       method: "createPlacementSlip",
        //       messageData: `No user found with privileges for assigning activity with ID ${dto.opportunityActivityId}`,
        //     }),
        //   });
        //   throw new NotFoundException(
        //     `No user found with privileges for assigning activity with ID ${dto.opportunityActivityId}`
        //   );
        // }
        // let approverDetails;
        // if (status.lookUpKey === OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED) {
        //   const needsApproval =
        //     await this.opportunityRepository.isOpportunityActivityNeedsApproval(
        //       payload.opportunityActivityId
        //     );
        //   if (needsApproval) {
        //     const createTask =
        //       await this.opportunityRepository.createOpportunityActivityTaskObject(
        //         payload.opportunityActivityId,
        //         APPROVAL_TASK_NAMES.PLACEMENT_SLIP_TASK,
        //         TASK_TYPE.APPROVAL,
        //         assignedUser.userId,
        //         userId ?? assignedUser.userId
        //       );
        //     if (!createTask) {
        //       throw new NotFoundException(
        //         `Task creation object for opportunity activity ID ${payload.opportunityActivityId} not found`
        //       );
        //     }
        //     await this.taskService.createTask(createTask, entityManager);
        // approverDetails =
        //       await this.opportunityRepository.getActivityApproverDetails(
        //         payload.opportunityActivityId
        //       );
        //   }
        // }
        if (documents?.length) {
          await this.opportunityRepository.updateDocumentStatus(
            entityManager,
            documents?.map((docId) => docId.documentId) || []
          );
        }
        // update the OpportunityActivityMap with the new status
        await this.opportunityRepository.updateOpportunityActivityMapStatus(
          payload.opportunityActivityId,
          payload.statusLid,
          userId,
          payload.activityStatusKey == ACTIVITY_STATUS.COMPLETE
            ? new Date()
            : null,
          entityManager,
          payload.activityStatusKey
        );
        if (status.lookUpKey === OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED) {
          const needsApproval =
            await this.opportunityRepository.isOpportunityActivityNeedsApproval(
              opportunityActivityId
            );
          if (needsApproval) {
            await this.createAndAssignTask(
              opportunityActivityId,
              entityManager,
              ACL_CATEGORY.ISG_ACTIVITY,
              ACL_ACTIONS.APPROVE_ISG,
              userId,
              APPROVAL_TASK_NAMES.PLACEMENT_SLIP_TASK,
              TASK_TYPE.APPROVAL
            );
          }
        }
        const approverDetails =
          await this.opportunityRepository.getActivityApproverDetails(
            opportunityActivityId
          );

        const placementSlipDetails =
          await this.opportunityActivityMapRepository.findOne({
            where: { id: opportunityActivityId },
          });
        if (
          placementSlipDetails?.approval?.toUpperCase() !==
          ACTIVITY_APPROVAL_YES
        ) {
          await this.opportunityRepository.updateNextActivityStatus(
            opportunityActivityId,
            payload.statusLid,
            entityManager
          );
        }
        placementSlip.approverDetails = approverDetails;
        return placementSlip;
      });

      return this.getPlacementSlipActivity(dto.opportunityActivityId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create placement slip: ${error.message}`
      );
    }
  }

  private formatCompanyNameForCdAccount(companyName?: string): string {
    const normalized = (companyName ?? "").replace(/\s+/g, "");
    return normalized.substring(0, 5);
  }

  private async getCompanyNameByOpportunityId(
    opportunityId: number
  ): Promise<string> {
    const opportunity = await this.opportunityRepo.findOne({
      where: { opportunityId },
      relations: ["company"],
      select: {
        opportunityId: true,
        company: { companyName: true } as any,
      },
    });

    if (!opportunity) {
      throw new NotFoundException(
        `Opportunity not found for ID: ${opportunityId}`
      );
    }

    return opportunity.company?.companyName ?? "";
  }

  private async buildCdDetailsWithDefaults(
    cdAccountDetails: any,
    opportunityActivityId: number,
    opportunityId?: number
  ) {
    const cdDetailsArray: any[] = Array.isArray(cdAccountDetails)
      ? cdAccountDetails
      : cdAccountDetails && typeof cdAccountDetails === "object"
      ? [cdAccountDetails]
      : [];

    if (!cdDetailsArray.length) {
      return cdDetailsArray;
    }

    const paymentTypeLid = cdDetailsArray[0]?.paymentTypeLid;
    if (!paymentTypeLid) {
      return cdDetailsArray;
    }

    const paymentType = await this.lookUpRepository.findOne({
      where: { id: paymentTypeLid },
      select: ["id", "lookUpKey"],
    });

    if (!paymentType) {
      throw new NotFoundException(
        `Payment type with ID ${paymentTypeLid} not found`
      );
    }

    if (paymentType.lookUpKey !== PAYMENT_TOGGLE_CHEQUE_PREMIUM_ONLY) {
      return cdDetailsArray;
    }

    const resolvedOpportunityId =
      opportunityId ??
      (
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        )
      )?.opportunityId;

    if (!resolvedOpportunityId) {
      throw new NotFoundException(
        `Opportunity not found for activity ID ${opportunityActivityId}`
      );
    }

    const companyName = await this.getCompanyNameByOpportunityId(
      resolvedOpportunityId
    );
    const companySegment = this.formatCompanyNameForCdAccount(companyName);
    const segment = companySegment || `${resolvedOpportunityId}`;
    const cdDetail = cdDetailsArray[0] ?? { paymentTypeLid };

    const cdAccountType = cdDetail.cdAccountTypeLid
      ? await this.lookUpRepository.findOne({
          where: { id: cdDetail.cdAccountTypeLid },
          select: ["id", "lookUpKey"],
        })
      : await this.lookUpRepository.findOne({
          where: { lookUpKey: CD_ACCOUNT_TOGGLE_NEW },
          select: ["id", "lookUpKey"],
        });

    if (!cdAccountType) {
      throw new NotFoundException(
        `CD account type not found for key ${CD_ACCOUNT_TOGGLE_NEW}`
      );
    }

    cdDetailsArray[0] = {
      ...cdDetail,
      cdAccountTypeLid: cdDetail.cdAccountTypeLid ?? cdAccountType.id,
      accountName: cdDetail.accountName ?? `CD${segment}`,
      accountNumber:
        cdDetail.accountNumber ?? `CD${segment}00${resolvedOpportunityId}`,
      openBalance: cdDetail.openBalance ?? 0,
    };

    return cdDetailsArray;
  }

  private removeUndefinedFields<T extends Record<string, any>>(obj: T): T {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined)
    ) as T;
  }

  async updatePlacementSlipByActivityId(
    opportunityActivityId: number,
    dto: UpdatePlacementSlipDto,
    userId: number
  ) {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        dto,
        LOOK_UP_DATA
      );

      const placementSlip =
        await this.opportunityRepository.getPlacementSlipData(
          opportunityActivityId
        );

      if (!placementSlip) {
        throw new NotFoundException(
          `Placement slip not found for activity ID ${opportunityActivityId}.`
        );
      }

      const {
        policyDetails,
        feeDetails,
        installmentDates,
        installmentDetails,
        remarks,
        tpaDetails,
        insurerDetails,
        cdAccountDetails,
        coverDetails,
        documents,
        statusLid,
        ...rest
      } = dto;

      const payload = this.removeUndefinedFields({
        ...rest,
        ...(policyDetails ? this.removeUndefinedFields(policyDetails) : {}),
        ...(feeDetails ? this.removeUndefinedFields(feeDetails) : {}),
        ...(typeof statusLid !== "undefined" ? { statusLid } : {}),
        ...(remarks ? { remarks: remarks } : {}),
        ...(tpaDetails ? { tpaDetails: tpaDetails } : {}),
        ...(insurerDetails ? { insurerDetails: insurerDetails } : {}),
        ...(cdAccountDetails ? { cdAccountDetails: cdAccountDetails } : {}),
        ...(coverDetails ? { coverDetails } : {}),
        ...(installmentDetails || installmentDates
          ? { installmentDetails: installmentDetails ?? installmentDates }
          : {}),
        ...(documents ? { documents } : {}),
        updatedBy: userId,
      });

      await this.updatePlacementSlip(
        placementSlip.id,
        payload as any,
        opportunityActivityId,
        placementSlip?.opportunityId
      );
      return this.getPlacementSlipActivity(opportunityActivityId);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update placement slip: ${error.message}`
      );
    }
  }

  async updatePlacementSlip(
    id: number,
    dto: UpdatePlacementSlipDto,
    opportunityActivityId?: number,
    opportunityId?: number
  ) {
    try {
      const {
        policyDetails,
        remarks,
        tpaDetails,
        insurerDetails,
        cdAccountDetails,
        coverDetails,
        statusLid,
        ...rest
      } = dto;

      const cdDetailsArray = await this.buildCdDetailsWithDefaults(
        cdAccountDetails,
        opportunityActivityId ?? dto.opportunityActivityId ?? 0,
        opportunityId
      );

      const payload = {
        ...rest,
        ...policyDetails,
        statusLid: statusLid,
        remarks: remarks?.remarks,
        tpaMaps: tpaDetails,
        insurerMaps: insurerDetails,
        cdDetails: cdDetailsArray,
        coverDetails,
        ...(dto.installmentDetails || dto.installmentDates
          ? { installmentDetails: dto.installmentDetails ?? dto.installmentDates }
          : {}),
      };
      const activityStatusKey = payload.activityStatusKey;
      const placementSlip = await this.dataSource.transaction(
        async (entityManager) => {
          const placementSlipData =
            await this.opportunityRepository.updatePlacementSlip(
              id,
              payload,
              entityManager
            );

          // update the OpportunityActivityMap with the new status
          await this.opportunityRepository.updateOpportunityActivityMapStatus(
            placementSlipData?.opportunityActivityId,
            placementSlipData?.statusLid,
            placementSlipData?.updatedBy,
            activityStatusKey == ACTIVITY_STATUS.COMPLETE ? new Date() : null,
            entityManager,
            activityStatusKey
          );
          const status = await this.lookUpRepository.findOne({
            where: { id: statusLid },
          });
          if (!status) {
            throw new NotFoundException(
              `Status with ID ${statusLid} not found`
            );
          }
          if (status.lookUpKey === OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED) {
            const needsApproval =
              await this.opportunityRepository.isOpportunityActivityNeedsApproval(
                placementSlipData.opportunityActivityId
              );
            if (needsApproval) {
              await this.createAndAssignTask(
                placementSlipData.opportunityActivityId,
                entityManager,
                ACL_CATEGORY.ISG_ACTIVITY,
                ACL_ACTIONS.APPROVE_ISG,
                placementSlipData.updatedBy,
                APPROVAL_TASK_NAMES.PLACEMENT_SLIP_TASK,
                TASK_TYPE.APPROVAL
              );
            }
          }

          return placementSlipData;
        }
      );

      // check if it is an activity that needs approval
      // const status = await this.lookUpRepository.findOne({
      //   where: { id: statusLid },
      // });
      // if (!status) {
      //   throw new NotFoundException(`Status with ID ${statusLid} not found`);
      // }
      // try {
      // const assignedUser: any =
      //   await this.scopeService.getParentUserWithPrivilege(
      //     placementSlip.updatedBy,
      //     ACL_CATEGORY.ISG_ACTIVITY,
      //     ACL_ACTIONS.APPROVE_ISG
      //   );
      // if (!assignedUser) {
      //   this.logger.log({
      //     level: "info",
      //     message: buildLogMessage({
      //       traceId: this.traceIdService.traceId,
      //       status: "failure",
      //       location: "OpportunityService",
      //       method: "updatePlacementSlip",
      //       messageData: `No user found with privileges for assigning activity with ID ${placementSlip.opportunityActivityId}`,
      //     }),
      //   });
      //   throw new NotFoundException(
      //     `No user found with privileges for assigning activity with ID ${placementSlip.opportunityActivityId}`
      //   );
      // }
      // if (status.lookUpKey === OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED) {
      //   const needsApproval =
      //     await this.opportunityRepository.isOpportunityActivityNeedsApproval(
      //       placementSlip.opportunityActivityId
      //     );
      //   if (needsApproval) {
      //     const createTask =
      //       await this.opportunityRepository.createOpportunityActivityTaskObject(
      //         placementSlip.opportunityActivityId,
      //         APPROVAL_TASK_NAMES.PLACEMENT_SLIP_TASK,
      //         TASK_TYPE.APPROVAL,
      //         assignedUser.userId,
      //         placementSlip.updatedBy ?? assignedUser.userId
      //       );
      //     if (!createTask) {
      //       throw new NotFoundException(
      //         `Task creation object for opportunity activity ID ${placementSlip.opportunityActivityId} not found`
      //       );
      //     }
      //     await this.taskService.createTask(createTask);
      //   }
      // }
      // } catch (error) {
      //   this.logger.error({
      //     level: "error",
      //     message: buildLogMessage({
      //       traceId: this.traceIdService.traceId,
      //       status: "failure",
      //       location: "OpportunityService",
      //       method: "updatePlacementSlip",
      //       messageData: error,
      //     }),
      //   });
      // }
      const placementSlipDetails =
        await this.opportunityActivityMapRepository.findOne({
          where: { id: placementSlip.opportunityActivityId },
        });
      if (
        placementSlipDetails?.approval?.toUpperCase() !== ACTIVITY_APPROVAL_YES
      ) {
        await this.opportunityRepository.updateNextActivityStatus(
          placementSlip.opportunityActivityId,
          placementSlip.statusLid
        );
      }
      return placementSlip;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update placement slip: ${error.message}`
      );
    }
  }

  async getPlacementSlipActivity(opportunityActivityId: number) {
    return this.opportunityRepository.getPlacementSlipActivity(
      opportunityActivityId
    );
  }

  async getCoverDataPrefill(opportunityActivityId: number) {
    const activity =
      await this.opportunityRepository.getOpportunityActivityById(
        opportunityActivityId
      );
    let covers: any = [];
    if (
      activity.activityKey == ACTIVITY_KEY.PLACEMENT_SLIP_GENERATION_ACTIVITY
    ) {
      covers = await this.opportunityRepository.getCoverPrefillData(
        opportunityActivityId,
        activity.opportunityId
      );
    }
    if (activity.activityKey == ACTIVITY_KEY.PREMIUM_CALCULATION_ACTIVITY) {
      covers = await this.opportunityRepository.getPremiumCoverPrefillData(
        opportunityActivityId,
        activity.opportunityId
      );
    }
    if (
      activity.activityKey == ACTIVITY_KEY.HELD_COVER_NOTE_ACTIVITY ||
      activity.activityKey == ACTIVITY_KEY.POLICY_HARD_COPY_ACTIVITY
    ) {
      covers = await this.opportunityRepository.getDeviationCoverDetails(
        opportunityActivityId,
        activity.opportunityId,
        activity.opportunityTable
      );
    }
    const coverDetails: Record<number, string> = {};
    covers?.forEach((c: any) => {
      const id = c.coverTemplateId ?? c.coverMapId;
      const resp = c.coverResponse ?? c.insurerCoverResponse;
      if (id !== undefined && resp !== undefined) {
        coverDetails[id] = resp;
      }
    });

    return { covers: coverDetails };
  }

  async softDeletePlacementSlip(id: number) {
    return this.opportunityRepository.softDeletePlacementSlip(id);
  }

  async softDeleteQuoteEntry(id: number) {
    return this.opportunityRepository.softDeleteQuoteEntry(id);
  }

  async preparePremiumCalculationDetails(
    covers: any[],
    premiumCalculationDetailsConfig: Record<string, string>,
    opportunityId: number,
    createdBy: number
  ): Promise<any[]> {
    let filteredCovers: any = covers
      .filter((cover) =>
        Object.prototype.hasOwnProperty.call(
          premiumCalculationDetailsConfig,
          cover.id
        )
      )
      .map((cover) => {
        const fieldResponse = premiumCalculationDetailsConfig[cover.id];
        return {
          opportunityId: Number(opportunityId),
          coverMapId: Number(cover.id),
          policyTypeLid: Number(cover.policyTypeId),
          coverName: cover.coverName,
          coverResponse: fieldResponse,
          createdBy,
          updatedBy: createdBy,
        };
      });
    const premiumCalculationCovers =
      await this.opportunityRepository.getPremiumCalculationCoverDetailsByActivityId(
        opportunityId
      );
    filteredCovers.map((detail: any) => {
      const existingDetail = premiumCalculationCovers.find(
        (pc) => pc.coverMapId === detail.coverMapId
      );
      if (existingDetail) {
        detail.id = existingDetail.id;
      }
    });
    return filteredCovers;
  }

  async createQuotComparisonReportActivity(
    opportunityActivityMap: OpportunityActivityDto,
    activityMetaData: CreateQuoteComparisonReportDto,
    userId: number
  ): Promise<any> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        activityMetaData,
        LOOK_UP_DATA
      );

      return await this.handleQuoteComparisonReportCreation(
        opportunityActivityMap,
        activityMetaData,
        userId
      );
    } catch (error) {
      throw error instanceof NotFoundException ||
        error instanceof BadRequestException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? `Failed to create quote comparison report: ${error.message}`
              : errorMessages.quoteComparisonReportCreationFailed
          );
    }
  }

  async handleQuoteComparisonReportCreation(
    opportunityActivity: OpportunityActivityDto,
    activityMetaData:
      | CreateQuoteComparisonReportDto
      | UpdateQuoteComparisonReportDto,
    userId: number
  ) {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const {
          opportunityActivityId,
          statusLid,
          activityStatusKey,
          documents,
          placementDynamicsSetion,
          ...rest
        } = activityMetaData;
        // Create the quote comparison report activity
        const payloadObject = this.removeUndefinedFields({
          opportunityId: opportunityActivity.opportunityId,
          activityId: opportunityActivity.activityId,
          statusLid: statusLid,
          opportunityActivityId: opportunityActivityId,
          insuranceMarket: placementDynamicsSetion?.insuranceMarket,
          clientSpecific: placementDynamicsSetion?.clientSpecific,
          issuesFaced: placementDynamicsSetion?.issuesFaced,
          industryBenchmarkingComments:
            placementDynamicsSetion?.industryBenchmarkingComments,
          analysisRecommendation:
            placementDynamicsSetion?.analysisRecommendation,
          overallComments: placementDynamicsSetion?.overallComments,
          remarks: placementDynamicsSetion?.remarks,
        });
        // Save policy hard copy
        const quoteComparisonReportData =
          await this.opportunityRepository.saveQuoteComparisonReport(
            entityManager,
            opportunityActivityId,
            payloadObject,
            userId
          );
        // Save documents
        if (documents) {
          await this.opportunityRepository.saveActivityDocuments(
            entityManager,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.QUOTE_COMPARISON_DOCUMENT_MAP,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.QUOTE_COMPARISON_ID,
            quoteComparisonReportData.id,
            documents
          );

          await this.opportunityRepository.updateDocumentStatus(
            entityManager,
            documents?.map((docId) => docId.documentId) || []
          );
        }
        // update the OpportunityActivityMap with the new status
        await this.opportunityRepository.updateOpportunityActivityMapStatus(
          opportunityActivityId,
          statusLid,
          userId,
          activityStatusKey == ACTIVITY_STATUS.COMPLETE ? new Date() : null,
          entityManager,
          activityStatusKey
        );
        await this.opportunityRepository.updateNextActivityStatus(
          opportunityActivityId,
          statusLid,
          entityManager
        );

        return quoteComparisonReportData;
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to create quote comparison report: ${error.message}`
      );
    }
  }

  async getQuoteComparisonReportActivity(
    opportunityActivityId: number
  ): Promise<any> {
    try {
      const quoteComparisonReport =
        await this.opportunityRepository.getQuoteComparisonReportByOpportunityActivityId(
          opportunityActivityId
        );
      if (!quoteComparisonReport) {
        throw new NotFoundException(
          `Quote Comparison Report not found for Opportunity Activity Id: ${opportunityActivityId}`
        );
      }
      let documents: any[] = quoteComparisonReport?.documents ?? [];
      if (documents.length > 0) {
        documents = documents?.map((doc) => ({
          documentId: Number(doc.documentId),
          documentTypeLid: doc.documentTypeLid
            ? Number(doc.documentTypeLid)
            : null,
          fileName: doc?.document?.fileKey?.split("/")?.pop() || null,
          documentType: doc.documentType?.lookUpValue || null,
        }));
      } else {
        documents = [
          {
            documentId: null,
            documentTypeLid: null,
          },
        ];
      }
      return {
        id: Number(quoteComparisonReport.id),
        opportunityActivityId: quoteComparisonReport?.opportunityActivityId
          ? Number(quoteComparisonReport.opportunityActivityId)
          : null,
        statusLid: quoteComparisonReport?.statusLid
          ? Number(quoteComparisonReport.statusLid)
          : null,
        dataActivity: {
          placementDynamicsSetion: {
            insuranceMarket: quoteComparisonReport?.insuranceMarket ?? null,
            clientSpecific: quoteComparisonReport?.clientSpecific ?? null,
            issuesFaced: quoteComparisonReport?.issuesFaced ?? null,
            industryBenchmarkingComments:
              quoteComparisonReport?.industryBenchmarkingComments ?? null,
            analysisRecommendation:
              quoteComparisonReport?.analysisRecommendation ?? null,
            overallComments: quoteComparisonReport?.overallComments ?? null,
            remarks: quoteComparisonReport?.remarks ?? null,
          },
          documents: documents,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.quoteComparisonReportRetrieveFailed
      );
    }
  }

  async updateQuoteComparisonReportById(
    opportunityActivityId: number,
    updateQuoteComparisonReportData: UpdateQuoteComparisonReportDto,
    userId: number
  ): Promise<any> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        updateQuoteComparisonReportData,
        LOOK_UP_DATA
      );
      const opportunityActivityData =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );
      updateQuoteComparisonReportData.opportunityActivityId =
        opportunityActivityId;

      return await this.handleQuoteComparisonReportCreation(
        opportunityActivityData,
        updateQuoteComparisonReportData,
        userId
      );
    } catch (error) {
      throw error instanceof NotFoundException ||
        error instanceof BadRequestException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? `Failed to update quote comparison report: ${error.message}`
              : errorMessages.quoteComparisonReportUpdateFailed
          );
    }
  }

  async getOpportunityContacts(
    opportunityId: number,
    type?: "OPTY" | "COMPANY",
    status?: "ACTIVE" | "INACTIVE"
  ): Promise<any[]> {
    try {
      const opportunityContacts =
        await this.opportunityRepository.fetchOpportunityContacts(
          opportunityId,
          type,
          status
        );

      if (!opportunityContacts || opportunityContacts.length === 0) {
        return [];
      }

      // Transform the data to return only necessary fields
      const transformedContacts = opportunityContacts.map(
        (contactMapping: { contact: any }) => ({
          id: contactMapping.contact?.id,
          firstName: contactMapping.contact?.firstName,
          lastName: contactMapping.contact?.lastName,
          displayName: contactMapping.contact?.displayName,
          status: contactMapping.contact?.status?.lookUpValue,
        })
      );

      return transformedContacts;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          errorMessages.failedToFetchOpportunityContacts || error.message
        )
      );
    }
  }

  async validateIssuanceDateWithinOpportunityPeriod(
    opportunityId: number,
    issuanceDate: string | Date
  ): Promise<void> {
    const opportunity = await this.opportunityRepo.findOne({
      where: { opportunityId },
      select: ["createdAt", "expiryDate"],
    });

    if (!opportunity) {
      throw new BadRequestException(
        `Opportunity with ID ${opportunityId} not found.`
      );
    }

    const createdAt = new Date(opportunity.createdAt);
    const expiryDate = new Date(opportunity.expiryDate);
    const issuance = new Date(issuanceDate);

    if (isNaN(issuance.getTime())) {
      throw new BadRequestException(errorMessages.issuanceDateFormatError);
    }

    if (issuance <= createdAt) {
      throw new BadRequestException(
        errorMessages.issuanceDateBeforeOppportunityCreationDate
      );
    }

    if (issuance >= expiryDate) {
      throw new BadRequestException(
        errorMessages.issuanceDateAfterOppportunityExpiryDate
      );
    }
  }

  async getQuoteEntryDetails(opportunityActivityId: number): Promise<any> {
    try {
      const q =
        await this.opportunityRepository.findQuoteEntryDetailsByOpportunityActivityId(
          opportunityActivityId
        );
      if (!q) {
        throw new NotFoundException(errorMessages.opportunityQuoteNotFound);
      }
      return {
        opportunityId: Number(q.opportunityId),
        opportunityActivityId: Number(q.opportunityActivityId),
        mainDocuments:
          q?.quoteDocuments?.map((d) => ({
            documentId: Number(d.documentId),
            documentTypeLid: Number(d.documentTypeLid),
          })) ?? [],
        remarksSection: { remarks: q?.opportunityQuote?.remarks ?? null },
        quoteStatusLid: q?.opportunityQuote?.statusLid
          ? Number(q.opportunityQuote.statusLid)
          : null,
      };
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : errorMessages.quoteRetrievalFailed
          );
    }
  }

  async updatePremiumCalculationActivity(
    opportunityActivityId: number,
    updatePremiumCalculationDto: UpdatePremiumCalculationDto,
    userId: number
  ): Promise<any> {
    // Validate required fields
    const premiumCalculationActivityDetails =
      await this.opportunityRepository.getPremiumCalculationByOpportunityActivityId(
        opportunityActivityId
      );
    if (
      !premiumCalculationActivityDetails ||
      !premiumCalculationActivityDetails.id
    ) {
      throw new NotFoundException(
        `Premium Calculation details not found for activity ID ${opportunityActivityId}.`
      );
    }
    if (!updatePremiumCalculationDto)
      throw new BadRequestException("UpdatePremiumCalculationDto is required.");
    const { premiumCalculationDetails, remarksSection, documents, statusLid } =
      updatePremiumCalculationDto;
    if (
      !premiumCalculationDetails ||
      typeof premiumCalculationDetails !== "object"
    ) {
      throw new BadRequestException("premiumCalculationDetails is required.");
    }

    return this.dataSource.transaction(async (entityManager) => {
      // 1. Fetch and update main PremiumCalculation entity using entityService

      const premiumCalculation =
        await this.opportunityRepository.getActivityData(
          TABLE_NAMES.OPPORTUNITY_PREMIUM_CALCULATION,
          premiumCalculationActivityDetails.id
        );
      if (!premiumCalculation)
        throw new NotFoundException("Premium calculation activity not found.");
      if (remarksSection?.remarks)
        premiumCalculation.remarks = remarksSection.remarks;
      premiumCalculation.statusLid = statusLid;
      premiumCalculation.updatedBy = userId;

      await this.opportunityRepository.savePremiumCalculation(
        entityManager,
        premiumCalculation
      );

      // 2. Update OpportunityPremiumCoverDetail
      const coverMapIds = Object.keys(premiumCalculationDetails).map(Number);
      let coverDetails = await entityManager.find(
        OpportunityPremiumCoverDetail,
        {
          where: {
            opportunityId: premiumCalculation.opportunityId,
            coverMapId: In(coverMapIds),
          },
        }
      );
      const existingCoverMapIds = coverDetails.map((c) => c.coverMapId);
      const missingCoverMapIds = coverMapIds.filter(
        (coverMapId) => !existingCoverMapIds.includes(coverMapId)
      );

      // Add missing cover details using getOpportunityQuoteCoverByIds
      if (missingCoverMapIds.length > 0) {
        const missingCoverMaps: OpportunityCoverMap[] =
          await this.opportunityRepository.getOpportunityQuoteCoverByIds(
            entityManager,
            missingCoverMapIds
          );
        if (missingCoverMaps.length !== missingCoverMapIds.length) {
          throw new NotFoundException("Some coverMapIds not found.");
        }
        const newCoverDetails: OpportunityPremiumCoverDetail[] =
          missingCoverMaps.map((coverMap) => {
            const coverResponse = premiumCalculationDetails[coverMap.id];
            return entityManager.create(OpportunityPremiumCoverDetail, {
              opportunityId: Number(premiumCalculation.opportunityId),
              coverMapId: Number(coverMap.id),
              policyTypeLid: Number(coverMap.policyTypeId),
              coverName: coverMap.coverName,
              coverResponse,
              createdBy: userId,
              updatedBy: userId,
            });
          });
        await this.opportunityRepository.savePremiumCoverDetails(
          entityManager,
          coverDetails
        );
        coverDetails = [...coverDetails, ...newCoverDetails];
      }

      // Update coverResponse for all coverMapIds
      for (const coverDetail of coverDetails) {
        if (premiumCalculationDetails[coverDetail.coverMapId] !== undefined) {
          coverDetail.coverResponse =
            premiumCalculationDetails[coverDetail.coverMapId];
          coverDetail.updatedBy = userId;
        }
      }
      await this.opportunityRepository.savePremiumCoverDetails(
        entityManager,
        coverDetails
      );

      // 3. Update OpportunityPremiumCalculationDocumentMap (documents)
      if (documents) {
        await this.opportunityRepository.saveActivityDocuments(
          entityManager,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PREMIUM_CALCULATION_DOCUMENT_MAP,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PREMIUM_CALCULATION_ID,
          opportunityActivityId,
          documents
        );
        await this.opportunityRepository.updateDocumentStatus(
          entityManager,
          documents.map((doc) => doc.documentId)
        );
      }

      // Build coverDetails response as { [coverMapId]: coverResponse }
      const coverDetailsResponse: Record<number, string> = {};
      for (const coverMapId of Object.keys(premiumCalculationDetails)) {
        coverDetailsResponse[Number(coverMapId)] =
          premiumCalculationDetails[coverMapId] ?? null;
      }

      // update the OpportunityActivityMap with the new status
      await this.opportunityRepository.updateOpportunityActivityMapStatus(
        premiumCalculation.opportunityActivityId,
        statusLid,
        userId,
        updatePremiumCalculationDto.activityStatusKey ===
          ACTIVITY_STATUS.COMPLETE
          ? new Date()
          : null,
        entityManager,
        updatePremiumCalculationDto.activityStatusKey
      );

      if (
        updatePremiumCalculationDto.activityStatusKey ===
        ACTIVITY_STATUS.COMPLETE
      ) {
        await this.opportunityRepository.updateNextActivityStatus(
          opportunityActivityId,
          statusLid,
          entityManager
        );
      }
      return {
        id: Number(premiumCalculation.id),
        opportunityActivityId: Number(premiumCalculation.opportunityActivityId),
        statusLid: Number(premiumCalculation.statusLid),
        remarks: premiumCalculation.remarks,
        coverDetails: coverDetailsResponse,
        documents: documents || [],
      };
    });
  }

  async generateQuoteComparisonReport(
    dto: QuoteComparisonReportDto
  ): Promise<any> {
    try {
      // Validate required fields
      if (
        !dto ||
        !dto.opportunityActivityId ||
        !dto.brokingSlipVersion ||
        !dto.quoteEntry ||
        !Array.isArray(dto.quoteEntry) ||
        dto.quoteEntry.length === 0
      ) {
        throw new BadRequestException(
          "Required fields are missing in the request."
        );
      }

      // Step 1: Fetch opportunity activity map data
      const opportunityActivityMapData =
        await this.opportunityRepository.getOpportunityActivityById(
          dto.opportunityActivityId
        );
      if (
        !opportunityActivityMapData ||
        !opportunityActivityMapData.opportunityId
      ) {
        throw new NotFoundException(
          `Opportunity activity not found for ID: ${dto.opportunityActivityId}`
        );
      }

      const opportunityId: number = opportunityActivityMapData.opportunityId;

      // Step 2: Fetch broking slip version details for the given version id
      const brokingSlipCoverDetails =
        await this.opportunityRepository.fetchBrokingSlipCoverDetails(
          dto.brokingSlipVersion,
          opportunityId
        );

      // Step 3: Fetch quote entry details for the given quoteEntry ids
      const quoteEntryDetails =
        await this.opportunityRepository.fetchQuoteCoverDetails(
          dto.brokingSlipVersion,
          dto.quoteEntry
        );

      // Step 4: Fetch opportunity RFP Cover detail
      const opportunityRfpCoverDetails =
        await this.opportunityRepository.getRfpCoverDetailsByOpportunityId(
          opportunityId
        );
      // Step 5: Collect all unique coverMapIds from brokingSlipCoverDetails and quoteEntryDetails.coverDetails
      const coverIdSet: Set<number> = new Set();

      // Collect from brokingSlipCoverDetails if brokingSlipCovers is true
      if (
        dto.brokingSlipCovers &&
        Array.isArray(brokingSlipCoverDetails) &&
        brokingSlipCoverDetails?.length > 0
      ) {
        for (const cover of brokingSlipCoverDetails) {
          if (cover.coverMapId) {
            coverIdSet.add(cover.coverMapId);
          }
        }
      }

      // Collect from each quote's coverDetails
      if (Array.isArray(quoteEntryDetails)) {
        for (const quote of quoteEntryDetails) {
          if (Array.isArray(quote.coverDetails)) {
            for (const cover of quote.coverDetails) {
              if (cover.coverMapId) {
                coverIdSet.add(cover.coverMapId);
              }
            }
          }
        }
      }
      // Collect from opportunityRfpCoverDetails if rfpDetailsCovers is true
      if (
        dto.rfpDetailsCovers &&
        Array.isArray(opportunityRfpCoverDetails) &&
        opportunityRfpCoverDetails.length > 0
      ) {
        for (const cover of opportunityRfpCoverDetails) {
          if (cover.coverMapId) {
            coverIdSet.add(cover.coverMapId);
          }
        }
      }
      // Convert Set to Array
      const uniqueCoverIds: number[] = Array.from(coverIdSet);
      // Hide covers cut off before QCR (e.g. "show until Broking Slip").
      const CoverDetails = filterCoversByActivity(
        await this.opportunityRepository.getOpportunityCoverDetailsById(
          uniqueCoverIds
        ),
        ACTIVITY_KEY.QUOTE_COMPARISON_REPORT_ACTIVITY
      );
      if (!CoverDetails || CoverDetails.length === 0) {
        throw new NotFoundException(
          `No covers found for the provided cover IDs: ${uniqueCoverIds.join(
            ", "
          )}`
        );
      }
      // Return the combined data
      const dataValidationActivity =
        await this.opportunityRepository.findDataValidationActivity(
          opportunityId
        );

      const organisationName =
        dataValidationActivity?.owner?.organisation?.name ?? null;

      const data = {
        // opportunityActivityMapData,
        brokingSlipCoverDetails,
        quoteEntryDetails,
        CoverDetails,
        opportunityRfpCoverDetails,
        brokingSlipCovers: dto.brokingSlipCovers,
        rfpDetailsCovers: dto.rfpDetailsCovers,
      };
      // return data;
      return this.transformQuoteComparisonReport(data, organisationName);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : errorMessages.quoteComparisonReportGenerationFailed
      );
    }
  }

  async transformQuoteComparisonReport(
    data: TransformInput,
    organisationName?: string | null
  ): Promise<any> {
    const {
      quoteEntryDetails,
      CoverDetails,
      opportunityRfpCoverDetails = [],
      brokingSlipCoverDetails = [],
      rfpDetailsCovers = false,
      brokingSlipCovers = false,
    } = data;

    const toNumberOrNull = (value: unknown): number | null => {
      if (value === null || value === undefined || value === "") {
        return null;
      }
      const numericValue = Number(value);
      return Number.isNaN(numericValue) ? null : numericValue;
    };

    const sumNumbers = (
      values: Array<number | null | undefined>
    ): number | null => {
      const validNumbers = values
        .map((val) => (val === null || val === undefined ? null : Number(val)))
        .filter((val): val is number => val !== null && !Number.isNaN(val));

      if (validNumbers.length === 0) {
        return null;
      }

      return validNumbers.reduce((acc, val) => acc + val, 0);
    };

    // Helper to build row objects for each field
    const buildRow = (key: string, values: any[]): any => {
      const row: any = { key };
      values.forEach((val, idx) => {
        row[`quote_${idx + 1}`] = val;
      });
      return row;
    };

    // Extract insurer names for mapping
    const insurerNames: string[] = quoteEntryDetails.map(
      (q: any) => q.insurer?.insurerName || "-"
    );

    // Build premiumComparisonSection
    const premiumHeaders = buildRow("Parameters", [
      "Broking Slip",
      // "RFP",
      ...insurerNames,
    ]);
    let premiumData: any[];

    const isSriLankaOrganisation =
      organisationName?.trim().toLowerCase() ===
      ORGANISATION.SRI_LANKA.toLowerCase();

    if (isSriLankaOrganisation) {
      type SriLankaComputed = {
        basicPremium: number | null;
        srccAmount: number | null;
        tcAmount: number | null;
        netPremium: number | null;
        adminCharges: number | null;
        stampDuty: number | null;
        cessAmount: number | null;
        vatPercent: number | null;
        vatAmount: number | null;
        policyFee: number | null;
        grossPremium: number | null;
        basicBrokeragePercentage: number | null;
        srccBrokeragePercentage: number | null;
        tcBrokeragePercentage: number | null;
        basicBrokerageAmount: number | null;
        srccBrokerageAmount: number | null;
        tcBrokerageAmount: number | null;
        totalBrokerage: number | null;
      };

      const sriLankaComputed: SriLankaComputed[] = quoteEntryDetails.map(
        (quote: any) => {
          const basicPremium = toNumberOrNull(quote.basicPremium);
          const srccAmount = toNumberOrNull(quote.srccAmount);
          const terrorismAmount = toNumberOrNull(
            quote.terrorism ??
              quote.terrorismAmount ??
              quote.terrorismCommission ??
              quote.terrorism
          );
          const netPremium = sumNumbers([
            basicPremium,
            srccAmount,
            terrorismAmount,
          ]);
          const adminCharges = toNumberOrNull(quote.adminCharges);
          const stampDuty = toNumberOrNull(
            quote.other ?? quote.stampDuty ?? quote.otherAmount
          );
          const cessAmount = toNumberOrNull(quote.cessAmount);
          const vatPercent = toNumberOrNull(
            quote.gstPercentage ?? quote.vatPercentage
          );
          const vatAmount = toNumberOrNull(quote.gstAmount ?? quote.vatAmount);
          const policyFee = toNumberOrNull(
            quote.fee ?? quote.policyFee ?? quote.feeAmount
          );
          const grossPremium =
            toNumberOrNull(quote.grossPremium) ??
            sumNumbers([
              netPremium,
              adminCharges,
              stampDuty,
              cessAmount,
              vatAmount,
              policyFee,
            ]);
          const basicBrokeragePercentage = toNumberOrNull(
            quote.basicBrokeragePercentage
          );
          const srccBrokeragePercentage = toNumberOrNull(quote.srccPercentage);
          const tcBrokeragePercentage = toNumberOrNull(
            quote.terrorismBrokeragePercentage
          );
          const basicBrokerageAmount = toNumberOrNull(
            quote.basicBrokerageAmount
          );
          const srccBrokerageAmount = toNumberOrNull(quote.srccBrokerageAmount);
          const tcBrokerageAmount = toNumberOrNull(quote.tcBrokerageAmount);
          const totalBrokerage = sumNumbers([
            basicBrokerageAmount,
            srccBrokerageAmount,
            tcBrokerageAmount,
          ]);

          return {
            basicPremium,
            srccAmount,
            tcAmount: terrorismAmount,
            netPremium,
            adminCharges,
            stampDuty,
            cessAmount,
            vatPercent,
            vatAmount,
            policyFee,
            grossPremium,
            basicBrokeragePercentage,
            srccBrokeragePercentage,
            tcBrokeragePercentage,
            basicBrokerageAmount,
            srccBrokerageAmount,
            tcBrokerageAmount,
            totalBrokerage,
          } as SriLankaComputed;
        }
      );

      const sriLankaFields: Array<{
        key: string;
        accessor: keyof SriLankaComputed;
      }> = [
        { key: "Basic premium", accessor: "basicPremium" },
        { key: "SRCC premium amount", accessor: "srccAmount" },
        { key: "TC premium amount", accessor: "tcAmount" },
        { key: "Net premium", accessor: "netPremium" },
        { key: "Admin Charges", accessor: "adminCharges" },
        { key: "Stamp duty", accessor: "stampDuty" },
        { key: "Cess", accessor: "cessAmount" },
        { key: "VAT %", accessor: "vatPercent" },
        { key: "VAT", accessor: "vatAmount" },
        { key: "Policy Fee", accessor: "policyFee" },
        { key: "Gross premium", accessor: "grossPremium" },
        {
          key: "Basic brokerage percentage",
          accessor: "basicBrokeragePercentage",
        },
        {
          key: "SRCC brokerage percentage",
          accessor: "srccBrokeragePercentage",
        },
        {
          key: "TC brokerage percentage",
          accessor: "tcBrokeragePercentage",
        },
        {
          key: "Basic brokerage amount",
          accessor: "basicBrokerageAmount",
        },
        {
          key: "SRCC brokerage amount",
          accessor: "srccBrokerageAmount",
        },
        { key: "TC brokerage amount", accessor: "tcBrokerageAmount" },
        { key: "Total Brokerage", accessor: "totalBrokerage" },
      ];

      premiumData = sriLankaFields.map(({ key, accessor }) => {
        const values = sriLankaComputed.map((item) => item[accessor]);
        const formattedValues = values.map((value) =>
          value === null || value === undefined || Number.isNaN(value)
            ? "-"
            : Number(value)
        );
        return buildRow(key, ["-", /* "-", */ ...formattedValues]);
      });
    } else {
      const premiumFields: { key: string; field: string }[] = [
        { key: "Net Premium", field: "netPremium" },
        { key: "Premium", field: "basicPremium" },
        // { key: "Variance", field: "variance" },
        { key: "Last Year", field: "lastYearPremium" },
        { key: "Total Amount", field: "totalAmount" },
        { key: "Terrorism", field: "terrorism" },
        { key: "Brokerage Percentage", field: "basicBrokeragePercentage" },
        { key: "Quote Received On", field: "quoteReceivedOn" },
        { key: "Insurer Remarks", field: "insurerRemarks" },
      ];

      premiumData = premiumFields.map(({ key, field }) => {
        const values = quoteEntryDetails.map((q: any) => {
          const value = q[field];
          if (value === undefined || value === null || value === "") return "-";
          // Convert to number if numeric field
          if (
            [
              "netPremium",
              "basicPremium",
              // "variance",
              "lastYearPremium",
              "totalAmount",
              "terrorism",
              "basicBrokeragePercentage",
            ].includes(field)
          ) {
            return Number.isNaN(Number(value)) ? "-" : Number(value);
          }
          return value;
        });
        return buildRow(key, ["-", /* "-", */ ...values]);
      });
    }

    // --- COVER SECTION LOGIC ---

    // Prepare cover headers
    const coverHeaders: any = { key: "Cover Details" };
    let coverHeaderIndex = 1;
    if (brokingSlipCovers) {
      coverHeaders[`quote_${coverHeaderIndex}`] = "Broking slip";
      coverHeaderIndex++;
    }
    if (rfpDetailsCovers) {
      coverHeaders[`quote_${coverHeaderIndex}`] = "RFP";
      coverHeaderIndex++;
    }
    insurerNames.forEach((name) => {
      coverHeaders[`quote_${coverHeaderIndex}`] = name;
      coverHeaderIndex++;
    });

    const sectionIds = Array.from(
      new Set(
        CoverDetails.map((cover: CoverDetail) => cover.sectionId).filter(
          (sectionId): sectionId is number => Number.isInteger(sectionId)
        )
      )
    );

    let sectionNameById = new Map<number, string>();
    if (sectionIds.length > 0) {
      const sections = await this.mstrCoverSectionRepository.find({
        where: { id: In(sectionIds), isActive: true },
        select: ["id", "name"],
      });
      sectionNameById = new Map(
        sections.map((section) => [section.id, section.name])
      );
    }

    // Build cover data rows in UI sequence with section heading rows
    const coverData: any[] = [];
    let previousSectionName: string | null = null;
    CoverDetails.forEach((cover: CoverDetail) => {
      const sectionId =
        typeof cover.sectionId === "number" && Number.isInteger(cover.sectionId)
          ? cover.sectionId
          : null;
      const sectionName =
        sectionId !== null ? sectionNameById.get(sectionId) || null : null;
      if (sectionName && sectionName !== previousSectionName) {
        const sectionRow: Record<string, string> = {
          key: sectionName,
          __rowType: "section",
          __sectionName: sectionName,
        };
        Object.keys(coverHeaders).forEach((headerKey) => {
          if (headerKey !== "key") {
            sectionRow[headerKey] = "";
          }
        });
        coverData.push(sectionRow);
      }
      previousSectionName = sectionName;

      const values: any[] = [];

      // 1. Add Broking Slip cover response first if enabled
      if (brokingSlipCovers) {
        const slipCover = brokingSlipCoverDetails.find(
          (slip) => slip.coverMapId === cover.id
        );
        values.push(slipCover?.coverResponse ?? "-");
      }

      // 2. Add RFP cover response if enabled
      if (rfpDetailsCovers) {
        const rfpCover = opportunityRfpCoverDetails.find(
          (rfp) => rfp.coverMapId === cover.id
        );
        values.push(rfpCover?.coverResponse ?? "-");
      }

      // 3. Add quoteEntryDetails cover responses
      for (const q of quoteEntryDetails) {
        const found = q.coverDetails?.find(
          (cd: any) => cd.coverMapId === cover.id
        );
        values.push(found?.insurerCoverResponse ?? "-");
      }

      coverData.push({
        ...buildRow(cover.coverName, values),
        __sectionName: sectionName,
      });
    });

    return {
      premiumComparisonSection: {
        headers: premiumHeaders,
        data: premiumData,
      },
      coverDetailSection: {
        headers: coverHeaders,
        data: coverData,
      },
    };
  }

  async transformQuotes(
    quotes: QuoteInput | QuoteInput[]
  ): Promise<TransformedQuote[]> {
    const quotesArray = Array.isArray(quotes) ? quotes : [quotes];

    return quotesArray.map((quote) => {
      // const netPremiumValue =
      //   quote?.netPremium !== undefined && quote?.netPremium !== null
      //     ? Number(quote?.netPremium)
      //     : null;

      return {
        id: Number(quote?.id),
        opportunityId: Number(quote?.opportunityId),
        opportunityActivityId: Number(quote?.opportunityActivityId),
        brokingSlipId: Number(quote?.brokingSlipId),
        insurerName: quote.insurer?.insurerName ?? null,
        formData: {
          quoteDetails: {
            insurerId: Number(quote?.insurerId),
            insurerLocationId: Number(quote?.insurerLocationId),
            quoteReceivedOn: new Date(quote?.quoteReceivedOn),
            basicPremium: Number(quote?.basicPremium),
            terrorism: Number(quote?.terrorism),
            netPremium: quote.netPremium ? Number(quote.netPremium) : null,
            basicBrokeragePercentage: quote?.basicBrokeragePercentage
              ? Number(quote?.basicBrokeragePercentage)
              : null,
            srccPercentage: quote?.srccPercentage
              ? Number(quote?.srccPercentage)
              : null,
            srccAmount: quote?.srccAmount ? Number(quote?.srccAmount) : null,
            srccBrokerageAmount: quote?.srccBrokerageAmount
              ? Number(quote?.srccBrokerageAmount)
              : null,
            terrorismBrokeragePercentage: quote?.terrorismBrokeragePercentage
              ? Number(quote?.terrorismBrokeragePercentage)
              : null,
            tcBrokerageAmount: quote?.tcBrokerageAmount
              ? Number(quote?.tcBrokerageAmount)
              : null,
            basicBrokerageAmount: quote?.basicBrokerageAmount
              ? Number(quote?.basicBrokerageAmount)
              : null,
            gstPercentage: quote?.gstPercentage
              ? Number(quote?.gstPercentage)
              : null,
            gstAmount: quote?.gstAmount ? Number(quote?.gstAmount) : null,
            // totalGrossPremiumIncTax: quote?.totalGrossPremiumIncTax
            //   ? Number(quote?.totalGrossPremiumIncTax)
            //   : null,
            feePercentage: quote?.feePercentage
              ? Number(quote?.feePercentage)
              : null,
            fee: quote?.fee ? Number(quote?.fee) : null,
            otherPercentage: quote?.otherPercentage
              ? Number(quote?.otherPercentage)
              : null,
            other: quote?.other ? Number(quote?.other) : null,
            adminChargesPercentage: quote?.adminChargesPercentage
              ? Number(quote?.adminChargesPercentage)
              : null,
            adminCharges: quote?.adminCharges
              ? Number(quote?.adminCharges)
              : null,
            cessPercentage: quote?.cessPercentage
              ? Number(quote?.cessPercentage)
              : null,
            cessAmount: quote?.cessAmount ? Number(quote?.cessAmount) : null,
            // totalGrossPremiumIncTaxCharges:
            //   quote?.totalGrossPremiumIncTaxCharges
            //     ? Number(quote?.totalGrossPremiumIncTaxCharges)
            //     : null,
            grossPremium: quote?.grossPremium
              ? Number(quote?.grossPremium)
              : null,
            totalBrokerageAmount: quote?.totalBrokerageAmount
              ? Number(quote?.totalBrokerageAmount)
              : null,
          },
          taxDetails:
            quote.taxDetails?.map((tax) => ({
              tax: Number(tax?.taxLid),
              taxValue: Number(tax?.taxValue),
            })) ?? [],
          netPremiumDetails: {
            insurerRemarks: quote?.insurerRemarks,
          },
          documents:
            quote.documentMappings?.map((document) => ({
              documentId: Number(document?.documentId),
            })) ?? [],
          covers:
            quote.coverDetails?.reduce<Record<string | number, string>>(
              (acc, cover) => {
                acc[cover?.coverMapId] = cover?.insurerCoverResponse;
                return acc;
              },
              {}
            ) ?? {},
        },
      };
    });
  }

  async updateOpportunityQuoteByActivityId(
    opportunityActivityId: number,
    payload: UpdateQuoteDto,
    userId: number
  ): Promise<any> {
    try {
      await this.lookUpValidation.validateDynamicLookupValues(
        payload,
        LOOK_UP_DATA
      );

      const { mainDocuments, remarksSection, quoteStatusLid } = payload;

      const result = await this.dataSource.transaction(
        async (entityManager) => {
          // Check if OpportunityQuote exists for this activity
          let opportunityQuote =
            await this.opportunityRepository.getQuoteDetailsByOpportunityActivityId(
              entityManager,
              opportunityActivityId
            );

          if (opportunityQuote) {
            // Update existing
            opportunityQuote.statusLid = quoteStatusLid;
            opportunityQuote.remarks = remarksSection?.remarks ?? null;
            await this.opportunityRepository.updateOpportunityQuote(
              entityManager,
              opportunityQuote.id,
              {
                remarks: opportunityQuote.remarks,
                statusLid: opportunityQuote.statusLid,
                opportunityActivityId: opportunityActivityId,
              }
            );
          } else {
            // Create new
            opportunityQuote =
              await this.opportunityRepository.createOpportunityQuoteData(
                {
                  remarks: remarksSection?.remarks ?? null,
                  statusLid: quoteStatusLid,
                },
                opportunityActivityId
              );
          }

          // Handle mainDocuments logic
          if (mainDocuments) {
            await this.opportunityRepository.saveActivityDocuments(
              entityManager,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.OPPORTUNITY_QUOTE_ENTRY_DOCUMENT_MAP,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.OPPORTUNITY_QUOTE_ENTRY_ID,
              opportunityActivityId,
              mainDocuments
            );
          }
          if (mainDocuments) {
            await this.opportunityRepository.updateDocumentStatus(
              entityManager,
              mainDocuments
                ?.map((docId) => docId.documentId)
                .filter((id): id is number => typeof id === "number") || []
            );
          }
          // update the OpportunityActivityMap with the new status
          await this.opportunityRepository.updateOpportunityActivityMapStatus(
            opportunityActivityId,
            quoteStatusLid,
            userId,
            new Date(),
            entityManager
          );
          await this.opportunityRepository.updateNextActivityStatus(
            opportunityActivityId,
            quoteStatusLid,
            entityManager
          );
          const QuoteDetails = await this.getQuoteByOpportunityActivityId(
            opportunityActivityId
          );
          return {
            id: Number(QuoteDetails.id),
            opportunityActivityId: Number(QuoteDetails.opportunityActivityId),
            quoteStatusLid: Number(QuoteDetails.statusLid),
            remarksSection: {
              remarks: QuoteDetails.dataActivity.remarksSection.remarks,
            },
            mainDocuments: mainDocuments,
          };
        }
      );

      return result;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : errorMessages.quoteUpdateFailed
          );
    }
  }

  async getOpportunityIdByOpportunityActivityId(opportunityActivityId: number) {
    try {
      return await this.opportunityRepository.getOpportunityActivityById(
        opportunityActivityId
      );
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving opportunity activity"
          );
    }
  }

  async getPolicyConfirmationCdAccountDetails(
    opportunityActivityId: number
  ): Promise<any> {
    try {
      const opportunityActivityMapData =
        await this.opportunityRepository.getOpportunityActivityById(
          opportunityActivityId
        );

      if (!opportunityActivityMapData) {
        throw new NotFoundException(
          `Opportunity activity not found for ID: ${opportunityActivityId}`
        );
      }

      const allActivityData =
        await this.opportunityRepository.getOpportunityActivitiesByOpportunityId(
          opportunityActivityMapData.opportunityId
        );
      const placementSlipActivityId =
        await this.getPlacementSlipGenerationActivityId(allActivityData);
      if (!placementSlipActivityId) {
        return {
          cdData: [],
        };
      } else {
        const placement = await this.opportunityRepository.getPlacementSlipData(
          placementSlipActivityId
        );
        if (!placement) {
          throw new NotFoundException("CD account details not found");
        }
        let data: { cdData: { key: string; value: string }[] } = { cdData: [] };

        if (
          Array.isArray(placement.cdDetails) &&
          placement.cdDetails.length > 0
        ) {
          const cdDetail = placement.cdDetails[0];

          const fields: Array<{
            key: string;
            value: string | null | undefined;
          }> = [
            { key: "Cheque Amount", value: cdDetail.chequeAmount },
            { key: "Cheque Date", value: formatDate(cdDetail.chequeDate) },
            { key: "Cheque Number", value: cdDetail.chequeNumber },
            { key: "Bank Name", value: cdDetail.bankName },
          ];

          data.cdData = fields
            .filter(
              (field) =>
                field.value !== null &&
                field.value !== undefined &&
                field.value !== ""
            )
            .map((field) => ({
              key: field.key,
              value: String(field.value),
            }));
        }

        return data;
      }
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving opportunity activity"
          );
    }
  }

  async getPlacementSlipGenerationActivityId(
    allActivityData: any
  ): number | null {
    if (
      allActivityData &&
      allActivityData.data &&
      Array.isArray(allActivityData.data.ISG)
    ) {
      for (const stage of allActivityData.data.ISG) {
        if (stage && Array.isArray(stage.activities)) {
          for (const activity of stage.activities) {
            if (
              activity.activityKey ===
              ACTIVITY_KEY.PLACEMENT_SLIP_GENERATION_ACTIVITY
            ) {
              return activity.opportunityActivityId;
            }
          }
        }
      }
    }
    return null;
  }

  async getPlacementSlipGenerationByOwner(allActivityData: any): string | null {
    if (
      allActivityData &&
      allActivityData.data &&
      Array.isArray(allActivityData.data.ISG)
    ) {
      for (const stage of allActivityData.data.ISG) {
        if (stage && Array.isArray(stage.activities)) {
          for (const activity of stage.activities) {
            if (
              activity.activityKey ===
              ACTIVITY_KEY.PLACEMENT_SLIP_GENERATION_ACTIVITY
            ) {
              return stage.owner;
            }
          }
        }
      }
    }
    return null;
  }

  async opportunityActivityApproval(
    opportunityActivityId: number,
    userId: number,
    activityMeta: any
  ) {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const status = await getLookups(
          this.lookUpRepository,
          [activityMeta.statusLid],
          LOOK_UP_FIELD.ID
        );
        const lookUp = await getLookup(
          status,
          [activityMeta.statusLid],
          LOOK_UP_FIELD.ID
        );
        const activityStatus = lookUp[`lookup_${activityMeta.statusLid}`];
        const userDetails = await entityManager.findOne(User, {
          where: { userId: userId },
        });
        if (!userDetails) {
          throw new NotFoundException(infoMessages.userNotFoundWithId(userId));
        }
        let isApproved: boolean = true;
        isApproved =
          activityStatus.lookUpKey === OPPORTUNITY_ACTIVITY_STATUS.APPROVED;
        // Validate the opportunity activity ID
        const opportunityActivity =
          await this.opportunityRepository.opportunityActivityApproval(
            entityManager,
            opportunityActivityId,
            userId,
            isApproved,
            activityMeta.activityStatusKey
          );

        let message = "";
        if (opportunityActivity !== null) {
          if (
            isApproved &&
            opportunityActivity.opportunityTable ===
              TABLE_NAMES.OPPORTUNITY_RFP_DETAILS_ENTRY
          ) {
            const assignedUser: any[] = await getAllUsersWithPrivilege(
              this.dataSource,
              ACL_CATEGORY.ISG_ACTIVITY,
              ACL_ACTIONS.ISG_ASSIGN,
              DEFAULT_EMPLOYEE_PAGE,
              DEFAULT_EMPLOYEE_PAGE_LIMIT,
              true,
              userDetails.organisationId
            );
            if (!assignedUser || (assignedUser && assignedUser.length === 0)) {
              this.logger.log({
                level: "info",
                message: buildLogMessage({
                  traceId: this.traceIdService.traceId,
                  status: "failure",
                  location: "OpportunityService",
                  method: "opportunityActivityApproval",
                  messageData: `No user found with privileges for assigning activity with ID ${opportunityActivity.id}`,
                }),
              });
              throw new NotFoundException(
                `No users found with privileges for assigning activity with ID ${opportunityActivity.id}`
              );
            }

            // Prefer an ISG-assign manager in the opportunity's own branch;
            // fall back to the seniormost overall (assignedUser is ordered by
            // grade_level ASC) when no same-branch manager exists.
            const opportunity = await entityManager.findOne(Opportunity, {
              where: { opportunityId: opportunityActivity.opportunityId },
            });
            const branchMatch = assignedUser.find(
              (u) => u.branchid === opportunity?.branchId
            );
            const chosen = branchMatch ?? assignedUser[0];

            const createTask =
              await this.opportunityRepository.createOpportunityActivityTaskObject(
                opportunityActivityId,
                ISG_ASSIGNMENT_TASK_NAME,
                TASK_TYPE.ASSIGNED,
                chosen?.userid,
                userId,
                undefined,
                undefined,
                true
              );
            if (!createTask) {
              throw new NotFoundException(
                `Assignment Task creation object for opportunity activity ID ${opportunityActivityId} not found`
              );
            }
            await this.taskService.createTask(createTask, entityManager);
            // Updating the owner for ISG activities to the assigned user after RFP approval
            await this.opportunityRepository.updateOwnerForActivities(
              entityManager,
              opportunityActivity.opportunityId,
              chosen?.userid,
              ROLE_KEY.ROLE_ISG_EXECUTIVE,
              userId
            );
          }
          if (isApproved) {
            message = `Activity has been approved successfully.`;
            if (
              opportunityActivity.opportunityTable ==
              OPPORTUNITY_ACTIVITY.HELD_COVER_NOTE
            ) {
              const opportunityActivityData =
                await this.opportunityRepository.getOpportunityActivityById(
                  opportunityActivityId
                );
              await this.handleHeldCoverNoteActivity(
                opportunityActivityData,
                activityMeta,
                userId
              );
            }
            // Creating a notification for the executive after manager approval;
            const url = `${ENV.CLIENT_SERVER_URL}opportunities/${opportunityActivity.opportunityId}`;
            await this.sendNotification(
              NOTIFICATION_EVENT_TYPES.OPPORTUNITY_ACTIVITY_APPROVAL,
              url,
              opportunityActivity.ownerId,
              true,
              true
            );
          } else {
            message = `Activity has been rejected.`;
            this.logger.log({
              level: "info",
              message: buildLogMessage({
                traceId: this.traceIdService.traceId,
                status: "inprogress",
                location: "OpportunityService",
                method: "opportunityActivityApproval",
                payload: {},
                messageData: "Rejected activity handling can be implemented here.",
              }),
            });
            const url = `${ENV.CLIENT_SERVER_URL}opportunities/${opportunityActivity.opportunityId}`;
            await this.sendNotification(
              NOTIFICATION_EVENT_TYPES.OPPORTUNITY_ACTIVITY_REJECTION,
              url,
              opportunityActivity.ownerId,
              true,
              false
            );
          }
        }
        return { opportunityActivity, message };
      });
    } catch (error) {
      throw error instanceof NotFoundException ||
        error instanceof BadRequestException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving opportunity activity"
          );
    }
  }

  async updateStageOwner(
    dto: UpdateStageOwnerDto,
    userId: number
  ): Promise<any> {
    try {
      const { opportunityId, ownerId, roleKey } = dto;
      const opportunityActivities = await this.dataSource.transaction(
        async (entityManager) => {
          const taskTypeLid = await this.lookUpRepository.findOne({
            where: { lookUpKey: TASK_TYPE.ASSIGNED },
          });
          const taskStatusLid = await this.lookUpRepository.findOne({
            where: {
              lookUpKey: TASK_STATUS_ACTIVE,
            },
          });
          const assignedTaskDetails =
            await this.taskService.getTaskByOpportunityAndStatus(
              opportunityId,
              taskStatusLid?.id,
              taskTypeLid.id
            );
          const activitiesData =
            await this.opportunityRepository.updateOwnerForActivities(
              entityManager,
              opportunityId,
              ownerId,
              roleKey,
              userId
            );
          if (assignedTaskDetails != null) {
            const closedTaskStatusLid = await this.lookUpRepository.findOne({
              where: {
                lookUpKey: TASK_STATUS_CLOSED,
              },
            });
            Object.assign(assignedTaskDetails,{
              taskStatusLid: closedTaskStatusLid.id,
              taskClose: TASK_CLOSED,
              updatedBy: userId,
              updatedAt: new Date(),
            });
            await entityManager.save(Task, assignedTaskDetails);
          }
          // creating an assignment planning task for the ISG activities;
          if (roleKey === ROLE_KEY.ROLE_ISG_EXECUTIVE) {
            const opportunityActivityMap =
              await this.opportunityRepository.getOpportunityActivitiesByOpportunityId(
                opportunityId
              );
            const isgActivity =
              opportunityActivityMap?.data?.ISG[0]?.activities[0]
                ?.opportunityActivityId;
            if (!isgActivity) {
              throw new NotFoundException(
                `Assignment planning Task creation failed as no valid ISG activities detected for opportunity ID: ${opportunityId}`
              );
            }
            const createTask =
              await this.opportunityRepository.createOpportunityActivityTaskObject(
                isgActivity,
                ISG_PLANNING_TASK_NAME,
                TASK_TYPE.TASK,
                dto.ownerId,
                userId,
                undefined,
                undefined,
                true
              );
            if (!createTask) {
              throw new NotFoundException(
                `Assignment planning Task creation object for opportunity ID ${opportunityId} not found`
              );
            }
            await this.taskService.createTask(createTask, entityManager);
          }

          return activitiesData;
        }
      );
      const userData = await this.opportunityRepository.getEntityTableMapIds(
        TABLE_NAMES.USER,
        USER_EMAIL,
        { userId: ownerId }
      );
      try {
        const url = `${ENV.CLIENT_SERVER_URL}opportunities/${opportunityId}`;
        const eventType = OPPORTUNITY_PARTICIPANT_INVITE;
        const channel = NOTIFICATION_IN_APP;
        const eventDetails =
          await this.notificationUtils.getNotificationDetailsByEvent(eventType);
        const parameters = { [`${eventDetails[0].parameterKey}`]: url };
        await axios.post(`${ENV.URL_NOTIFICATION_SERVICE}/notifications`, {
          eventType: OPPORTUNITY_PARTICIPANT_INVITE,
          emailId: userData,
          channel: channel,
          parameters: parameters,
          userId: [dto.ownerId],
        });
        await axios.post(`${ENV.URL_NOTIFICATION_SERVICE}/notifications`, {
          eventType: OPPORTUNITY_PARTICIPANT_INVITE,
          emailId: userData,
          channel: NOTIFICATION_EMAIL,
          parameters: parameters,
          userId: [dto.ownerId],
        });
      } catch (error) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "OpportunityService",
            method: "notify stage owner update",
            payload: {},
            messageData: "failed to send notification",
          }),
        });
      }
      return opportunityActivities;
    } catch (error) {
      throw error instanceof NotFoundException ||
        error instanceof BadRequestException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error while updating the opportunity activity"
          );
    }
  }

  async getStageOwnersByOpportunityId(
    opportunityId: number,
    roleKey: string
  ): Promise<any> {
    return this.opportunityRepository.getStageOwnersByOpportunityId(
      opportunityId,
      roleKey
    );
  }

  async sendNotification(
    eventType: string,
    url: string,
    notifyUserId: number,
    sendInAppNotification: boolean,
    sendEmailNotification: boolean,
    companyId?: number,
    // Additive-only: additional email-channel recipients beyond
    // `notifyUserId` (e.g. "CRM users" for OPPORTUNITY_LOST). Omitted by
    // every other existing caller, so their behavior is unchanged.
    additionalEmailIds?: string[]
  ): Promise<void> {
    try {
      const userEmail = await this.opportunityRepository.getEntityTableMapIds(
        TABLE_NAMES.USER,
        USER_EMAIL,
        { userId: notifyUserId }
      );

      if (!userEmail || userEmail.length === 0) {
        throw new NotFoundException(
          infoMessages.emailNotFoundWithUserId(notifyUserId)
        );
      }

      const eventDetails =
        await this.notificationUtils.getNotificationDetailsByEvent(eventType);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "inprogress",
          location: "OpportunityService",
          method: "sendNotification",
          payload: {},
          messageData: "Event Details: " + JSON.stringify(eventDetails),
        }),
      });
      const parameters = { [`${eventDetails[0].parameterKey}`]: url };
      if (sendInAppNotification) {
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              status: "inprogress",
              location: "OpportunityService",
              method: "sendNotification",
              payload: {},
              messageData: "Attempting to send in-app notification with parameters: " + JSON.stringify(parameters),
            }),
          });
        await axios.post(`${ENV.URL_NOTIFICATION_SERVICE}/notifications`, {
          eventType: eventType,
          emailId: userEmail,
          channel: NOTIFICATION_IN_APP,
          parameters: parameters,
          userId: [notifyUserId],
        }, 
        {
          headers: {
            'x-bypass-timeout': 'true'
          }
        }
      );
      }
      if (sendEmailNotification) {
        const emailRecipients = Array.from(
          new Set([...(userEmail ?? []), ...(additionalEmailIds ?? [])])
        );
        await axios.post(`${ENV.URL_NOTIFICATION_SERVICE}/notifications`, {
          eventType: eventType,
          emailId: emailRecipients,
          channel: NOTIFICATION_EMAIL,
          parameters: parameters,
          userId: [notifyUserId],
        },  {
          headers: {
            'x-bypass-timeout': 'true'
          }
        });
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityService",
          method: "send notification",
          messageData: error,
        }),
      });
    }
  }

  async getAllBrokingSlipVersions(opportunityId: number): Promise<any[]> {
    try {
      const brokingSlipData = await this.dataSource.transaction(
        async (entityManager) => {
          const brokingSlipVersions =
            await this.opportunityRepository.getAllBrokingSlipVersionsWithDetails(
              opportunityId,
              entityManager
            );
          if (!brokingSlipVersions || brokingSlipVersions.length === 0) {
            throw new NotFoundException(
              `No broking slip versions found for opportunity ID: ${opportunityId}`
            );
          }
          return brokingSlipVersions;
        }
      );
      return brokingSlipData;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error retrieving broking slip versions"
          );
    }
  }

  async getExcelGenerationUrl(
    opportunityId: number,
    activityKey: string,
    opportunityActivityId?: number,
    brokingSlipVersion?: number,
    quoteEntry?: number[],
    brokingSlipCovers?: boolean,
    rfpDetailsCovers?: boolean,
    userId?: number
  ): Promise<string> {
    try {
      // const activityKey: string = activityKey;
      let result: string;
      let filename: string;
      let data: any;
      const opportunity = await this.opportunityRepo.findOne({
        where: { opportunityId },
        relations: ["company", "policyType"],
      });
      const quoteData: any = {
        opportunityActivityId: opportunityActivityId,
        brokingSlipVersion: brokingSlipVersion,
        quoteEntry: quoteEntry,
        brokingSlipCovers: brokingSlipCovers,
        rfpDetailsCovers: rfpDetailsCovers,
      };
      const getCompanyDetails =
        await this.opportunityRepository.getOpportunityCompanyDetails(
          opportunityId
        );
      // eslint-disable-next-line @typescript-eslint/no-inferrable-types
      let path: string = `document-generation/company/${getCompanyDetails.companyName}_${getCompanyDetails.companyId}/${opportunityId}`;
      // Add a switch Case to handle different activity keys
      switch (activityKey) {
        case ACTIVITY_KEY.BROKING_SLIP_ACTIVITY:
          // eslint-disable-next-line no-case-declarations
          const brokingSlipData = await this.getAllBrokingSlipVersions(
            opportunityId
          );
          path = `${path}/broking-slip-generation/${DEFAULT_EXCEL_FILE_NAME.BROKING_SLIP}`;
          filename = path;
          data = brokingSlipData;
          break;
        case ACTIVITY_KEY.QUOTE_COMPARISON_REPORT_ACTIVITY:
          // eslint-disable-next-line no-case-declarations
          const quoteComparisonData = await this.generateQuoteComparisonReport(
            quoteData
          );
          path = `${path}/quote-comparison-report/${DEFAULT_EXCEL_FILE_NAME.QUOTE_COMPARISON_REPORT}`;
          filename = path;
          quoteComparisonData["companyName"] = opportunity?.company?.companyName;
          quoteComparisonData["policyType"] = opportunity?.policyType?.lookUpValue;
          data = quoteComparisonData;
          break;

        default:
          throw new BadRequestException(
            `Unsupported opportunity activity Key: ${activityKey}`
          );
      }
      try {
        const response = await axios.post(
          `${ENV.URL_DOCUMENT_SERVICE}/document/excel/${activityKey}`,
          {
            fileName: filename,
            data: data,
            userId: userId,
          }
        );
        result = response?.data?.data ?? null;
      } catch (error) {
        throw new BadRequestException(
          `Failed to generate excel via axios call: ${(error as Error).message}`
        );
      }
      if (result === null) {
        throw new BadRequestException("Failed to generate excel file");
      }
      return result;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : "Error generating Excel file"
          );
    }
  }

  async createDeviationTask(
    opportunityActivityId: number,
    taskName: string,
    description: string,
    userId: number
  ) {
    try {
      const createTask =
        await this.opportunityRepository.createOpportunityActivityTaskObject(
          opportunityActivityId,
          taskName,
          TASK_TYPE.ACTIVITY,
          userId,
          userId,
          description,
          DEVIATION_TASK_DUE_DAYS // need more clarity on due date
        );
      if (!createTask) {
        throw new NotFoundException(
          `Task creation object for opportunity activity ID ${opportunityActivityId} not found`
        );
      }
      await this.taskService.createTask(createTask);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create deviation task: ${error.message}`
      );
    }
  }

  async getOpportunityBrokerage(opportunityId: number) {
    try {
      return await this.opportunityRepository.getOpportunityBrokerage(
        opportunityId
      );
    } catch (error) {
      console.log("error", error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch opportunity brokerage: ${error.message}`
      );
    }
  }

  async getAllActivityIdAndName(
    type: "SO" | "RO",
    userId?: number,
    isgOnly = false
  ): Promise<any> {
    try {
      // Manage Quotes is an ISG-only screen, so it requests isgOnly to force the
      // activity LOV to ISG activities (and ISG Planning) for every viewer,
      // regardless of the user's own BD/ISG read ACL. Other listings resolve the
      // role keys from the user as before.
      const visibleActivityRoleKeys = isgOnly
        ? [ROLE_KEY.ROLE_ISG_EXECUTIVE]
        : await this.resolveVisibleActivityRoleKeys(userId);
      const activities =
        await this.opportunityRepository.getAllActivityIdAndName(
          type,
          visibleActivityRoleKeys
        );
      return activities;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to fetch activity IDs and names."
      );
    }
  }

  async getAllStageIdAndName(): Promise<any> {
    try {
      const activities =
        await this.opportunityRepository.getAllStageIdAndName();
      return activities;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to fetch stage IDs and names."
      );
    }
  }

  async getActivityBrokerageSummary(
    userId: number,
    from: Date | undefined,
    to: Date | undefined,
    // PLACEMENT = combined SO+RO pipeline past the ISG gate (spec §12).
    type?: "SO" | "RO" | "PLACEMENT",
    owner?: string,
    organisationId?: any,
    sbuId?: number,
    verticalId?: number,
    departmentId?: number,
    branchId?: number,
    isLeadership = false,
    insurerId?: number,
    fromDashboard?: boolean,
    // True only when the caller explicitly picked an owner (owner dropdown). An
    // explicit pick scopes the funnel to that owner/team even for leadership,
    // mirroring validateOpportunityScope's effectiveLeadership demotion so the
    // sales-funnel counts match the drilldown listing.
    explicitOwnerSelected = false,
  ) {
    try {
      let users,
        userIdsList = [];
      const ownerType =
        !owner || owner === OWNER_TYPES.MANAGER
          ? OWNER_TYPES.MANAGER
          : undefined;

      let resolvedOrganisationIds: number[] | undefined;
      if (organisationId !== undefined && organisationId !== null) {
        if (Number(organisationId) === 0) {
          const parentOrganisationIds =
            await this.opportunityRepository.getEntityTableMapIds(
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
              { id: organisationId }
            );

          const lookupCriteria =
            parentOrganisationIds.length === 0
              ? { parentOrganisationId: organisationId }
              : { id: organisationId };

          resolvedOrganisationIds =
            await this.opportunityRepository.getEntityTableMapIds(
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
              lookupCriteria
            );
        } else {
          resolvedOrganisationIds = [organisationId];
        }
      }
      // Leadership sees the whole org ONLY on the default view; an explicit owner
      // pick scopes even a leader (mirrors validateOpportunityScope's demotion) so
      // the sales-funnel count matches the drilldown. All other scoping is the
      // original behaviour, unchanged.
      const effectiveLeadership = isLeadership && !explicitOwnerSelected;
      if (effectiveLeadership === false) {
        if (ownerType) {
          const userDetails = await this.userRepository.findOne({
            where: {
              userId: userId,
              organisationId: organisationId ? organisationId : undefined
            },
          });
          userIdsList = userDetails ? [userId] : [];
        } else {
          users = await this.employeeService.fetchReporteeUserIds(userId);
          if (
            organisationId ||
            sbuId ||
            verticalId ||
            departmentId ||
            branchId
          ) {
            users = users?.filter(
              (user) =>
                (!organisationId || user.organisationId === organisationId) &&
                (!sbuId || user.sbuId === sbuId) &&
                idMatches(verticalId, user.verticalId) &&
                (!departmentId || user.departmentId === departmentId) &&
                idMatches(branchId, user.branchId)
            );
          }
          userIdsList = users?.map((user) => user.userId) || [];
        }
      }

      return !effectiveLeadership && userIdsList.length < 1
        ? []
        : await this.opportunityRepository.getActivityBrokerageSummary(
            userIdsList,
            from,
            to,
            type,
            effectiveLeadership,
            resolvedOrganisationIds,
            sbuId,
            verticalId,
            departmentId,
            branchId,
            userId,
            insurerId,
            fromDashboard,
          );
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async getEstimatedBrokerageSummary(
    userId: number,
    financialYear: number,
    type?: "SO" | "RO",
    owner?: string,
    organisationId?: number,
    sbuId?: number,
    // Vertical and branch are multiselect filters: a single id or a list.
    verticalId?: number | number[],
    departmentId?: number,
    branchId?: number | number[],
    quarter?: string,
    month?: string,
    from?: Date,
    to?: Date,
    isLeadership?: boolean,
    // When true, ACTUAL is aggregated live from policy/endorsement/reward
    // instead of the pre-aggregated performance_output table -- same switch the
    // dashboard uses, so the two screens can't drift while the ETL is stale.
    useLiveData?: boolean
  ) {
    try {
      const months = MONTHS_IN_YEAR_WITH_INDEX;
      let users, userIdsList, oppUserList;
      //TODO: will be refactored during the new search filters code
      const ownerType =
        !owner || owner === OWNER_TYPES.MANAGER ? OWNER_TYPES.MANAGER : undefined;
      if (isLeadership) {
        const whereClause: any = {};
        if (organisationId) whereClause.organisationId = organisationId;
        if (sbuId) whereClause.sbuId = sbuId;
        if (verticalId)
          whereClause.verticalId = Array.isArray(verticalId)
            ? In(verticalId)
            : verticalId;
        if (departmentId) whereClause.departmentId = departmentId;
        if (branchId) whereClause.branchId = eqOrIn(branchId);
        const allSbuUsers = await this.userRepository.find({
          where: whereClause,
          select: ["userId"],
        });
        userIdsList = allSbuUsers.map((u) => u.userId);
        oppUserList = [...userIdsList];
      } else if (ownerType) {
        const userDetails = await this.userRepository.findOne({
          where: {
            userId: userId,
            organisationId: organisationId ? organisationId : undefined,
            sbuId: sbuId ? sbuId : undefined,
            verticalId: verticalId
              ? Array.isArray(verticalId)
                ? In(verticalId)
                : verticalId
              : undefined,
            departmentId: departmentId ? departmentId : undefined,
            branchId: eqOrIn(branchId),
          },
        });
        userIdsList = userDetails ? [userId] : [];
        oppUserList = [userId];
      } else {
        users = await this.employeeService.getEmployeeHierarchyByUserId(userId);
        const opportunityUsers: any =
          await this.employeeService.fetchReporteeUserIds(userId);

        if (organisationId || sbuId || verticalId || departmentId || branchId) {
          users = users?.filter(
            (user: any) =>
              (!organisationId || user.organisationId === organisationId) &&
              (!sbuId || user.sbuId === sbuId) &&
              idMatches(verticalId, user.verticalId) &&
              (!departmentId || user.departmentId === departmentId) &&
              idMatches(branchId, user.branchId)
          );
        }
        userIdsList = users?.map((user: any) => user.userId) || [];
        oppUserList =
          opportunityUsers?.map((oppUser: any) => oppUser.userId) || [];
        oppUserList.push(userId);
      }

      if (userIdsList.length < 1 && !isLeadership) {
        return [];
      }

        // Use custom date range if from/to provided, otherwise calculate from financial year/quarter/month
      const range = from && to 
        ? { start: from, end: to }
        : getDateRange(month ? month : quarter, financialYear);
      if (type) {
        const [targetData, open, achievedRows] = await Promise.all([
          this.opportunityRepository.getEstimatedBrokerageByQuarter(
            oppUserList,
            financialYear,
            type,
            false,
            quarter,
            month,
            organisationId,
            sbuId,
            verticalId,
            departmentId,
            branchId,
            userId
          ),
          this.opportunityRepository.getEstimatedBrokerageByQuarter(
            oppUserList,
            financialYear,
            type,
            true,
            quarter,
            month,
            organisationId,
            sbuId,
            verticalId,
            departmentId,
            branchId,
            userId
          ),
          this.performanceOutputRepository
            .createQueryBuilder("performanceOutput")
            .select(
              "EXTRACT(MONTH FROM performanceOutput.performanceMonth)",
              "month"
            )
            .addSelect(
              "COALESCE(SUM(performanceOutput.valueOfTarget), 0)",
              "total"
            )
            .where("performanceOutput.userId IN (:...userIds)", {
              userIds: userIdsList,
            })
            .andWhere("performanceOutput.kpi = :kpi", {
              kpi: POLICY_PERFORMANCE_FIELDS.BROKERAGE,
            })
            .andWhere("performanceOutput.entityType = :entityType", {
              entityType: BUSINESS_TARGET_ENTITY_TYPE[type],
            })
            .andWhere(
              "performanceOutput.performanceMonth BETWEEN :start AND :end",
              {
                start: range.start,
                end: range.end,
              }
            )
            .groupBy("month")
            .getRawMany(),
        ]);

        const actualResult: Record<string, number> = {};
        months.forEach((m, idx) => {
          actualResult[m.name] = 0;
          if ((idx + 1) % 3 === 0) {
            actualResult[`Q${(idx + 1) / 3}`] = 0;
          }
        });

        achievedRows.forEach((row) => {
          const monthNum = parseInt(row.month, 10);
          const monthName = months.find((m) => m.index === monthNum)?.name;
          if (monthName) {
            actualResult[monthName] = Number(row.total) || 0;
          }
        });

        actualResult[MONTHS_WITH_QUARTERS_ENUM.Q1] =
          actualResult[MONTHS_WITH_QUARTERS_ENUM.APRIL] +
          actualResult[MONTHS_WITH_QUARTERS_ENUM.MAY] +
          actualResult[MONTHS_WITH_QUARTERS_ENUM.JUNE];
        actualResult[MONTHS_WITH_QUARTERS_ENUM.Q2] =
          actualResult[MONTHS_WITH_QUARTERS_ENUM.JULY] +
          actualResult[MONTHS_WITH_QUARTERS_ENUM.AUGUST] +
          actualResult[MONTHS_WITH_QUARTERS_ENUM.SEPTEMBER];
        actualResult[MONTHS_WITH_QUARTERS_ENUM.Q3] =
          actualResult[MONTHS_WITH_QUARTERS_ENUM.OCTOBER] +
          actualResult[MONTHS_WITH_QUARTERS_ENUM.NOVEMBER] +
          actualResult[MONTHS_WITH_QUARTERS_ENUM.DECEMBER];
        actualResult[MONTHS_WITH_QUARTERS_ENUM.Q4] =
          actualResult[MONTHS_WITH_QUARTERS_ENUM.JANUARY] +
          actualResult[MONTHS_WITH_QUARTERS_ENUM.FEBRUARY] +
          actualResult[MONTHS_WITH_QUARTERS_ENUM.MARCH];

        let summary = this.transformEstimatedBrokerageSummary({
          [type.toLowerCase()]: actualResult,
          open: { [type.toLowerCase()]: open.data },
          target: { [type.toLowerCase()]: targetData.targets },
        });

        if (month) {
          summary = this.filterSummaryByMonth(summary, month);
        } else if (quarter) {
          summary = this.filterSummaryByQuarter(summary, quarter);
        }
        return summary;
      }

      const [so, ro, soOpen, roOpen, achievedRows] = await Promise.all([
        this.opportunityRepository.getEstimatedBrokerageByQuarter(
          oppUserList,
          financialYear,
          SALES_OPPORTUNITY,
          false,
          quarter,
          month,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          userId
        ),
        this.opportunityRepository.getEstimatedBrokerageByQuarter(
          oppUserList,
          financialYear,
          RENEWAL_OPPORTUNITY,
          false,
          quarter,
          month,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          userId
        ),
        this.opportunityRepository.getEstimatedBrokerageByQuarter(
          oppUserList,
          financialYear,
          SALES_OPPORTUNITY,
          true,
          quarter,
          month,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          userId
        ),
        this.opportunityRepository.getEstimatedBrokerageByQuarter(
          oppUserList,
          financialYear,
          RENEWAL_OPPORTUNITY,
          true,
          quarter,
          month,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          userId
        ),
        (async () => {
          if (useLiveData) {
            // Same shape performance_output returns ({ month, entityType, total }),
            // so everything downstream is untouched.
            const live = await new PolicyReportService(
              this.performanceOutputRepository.manager.connection
            ).getBusinessPerformanceAchieved({
              groupBy: "month",
              userIds: userIdsList ?? [],
              isLeadership: isLeadership === true,
              organisationIds: organisationId ? [organisationId] : undefined,
              sbuIds: sbuId ? [sbuId] : undefined,
              verticalIds: verticalId
                ? Array.isArray(verticalId)
                  ? verticalId
                  : [verticalId]
                : undefined,
              departmentIds: departmentId ? [departmentId] : undefined,
              branchIds: toIdList(branchId),
              from: range.start,
              to: range.end,
              includeRewards: true,
            });
            return live.flatMap((row) => [
              {
                month: String(row.bucket),
                entityType: BUSINESS_TARGET_ENTITY_TYPE.SO,
                total: row.soAchieved,
              },
              {
                month: String(row.bucket),
                entityType: BUSINESS_TARGET_ENTITY_TYPE.RO,
                total: row.roAchieved,
              },
            ]);
          }
          const qb = this.performanceOutputRepository
            .createQueryBuilder("performanceOutput")
            .select(
              "EXTRACT(MONTH FROM performanceOutput.performanceMonth)",
              "month"
            )
            .addSelect("performanceOutput.entityType", "entityType")
            .addSelect(
              "COALESCE(SUM(performanceOutput.valueOfTarget), 0)",
              "total"
            )
            .andWhere("performanceOutput.kpi = :kpi", {
              kpi: POLICY_PERFORMANCE_FIELDS.BROKERAGE,
            })
            .andWhere("performanceOutput.entityType IN (:...entityTypes)", {
              entityTypes: [
                BUSINESS_TARGET_ENTITY_TYPE.SO,
                BUSINESS_TARGET_ENTITY_TYPE.RO,
                BUSINESS_TARGET_ENTITY_TYPE.MINED,
                BUSINESS_TARGET_ENTITY_TYPE.SO_ENDORSEMENT,
                BUSINESS_TARGET_ENTITY_TYPE.RO_ENDORSEMENT,
                BUSINESS_TARGET_ENTITY_TYPE.MINED_ENDORSEMENT,
              ],
            })
            .andWhere(
              "performanceOutput.performanceMonth BETWEEN :start AND :end",
              { start: range.start, end: range.end }
            )
            .groupBy("month")
            .addGroupBy("performanceOutput.entityType");

          if (isLeadership) {
            if (organisationId) qb.andWhere("performanceOutput.organisationId = :organisationId", { organisationId });
            if (sbuId) qb.andWhere("performanceOutput.sbuId = :sbuId", { sbuId });
            if (verticalId)
              qb.andWhere("performanceOutput.verticalId IN (:...verticalIds)", {
                verticalIds: toIdList(verticalId),
              });
            if (departmentId) qb.andWhere("performanceOutput.departmentId = :departmentId", { departmentId });
            if (branchId)
              qb.andWhere("performanceOutput.branchId IN (:...branchIds)", {
                branchIds: toIdList(branchId),
              });
          } else {
            qb.andWhere("performanceOutput.userId IN (:...userIds)", {
              userIds: userIdsList,
            });
          }

          return qb.getRawMany();
        })(),
      ]);

      const soActual: Record<string, number> = {};
      const roActual: Record<string, number> = {};
      months.forEach((m, idx) => {
        soActual[m.name] = 0;
        roActual[m.name] = 0;
        if ((idx + 1) % 3 === 0) {
          const q = `Q${(idx + 1) / 3}`;
          soActual[q] = 0;
          roActual[q] = 0;
        }
      });

      achievedRows.forEach((row) => {
        const monthNum = parseInt(row.month, 10);
        const monthName = months.find((m) => m.index === monthNum)?.name;
        if (!monthName) {
          return;
        }
        if (
          row.entityType === BUSINESS_TARGET_ENTITY_TYPE.SO ||
          row.entityType === BUSINESS_TARGET_ENTITY_TYPE.SO_ENDORSEMENT ||
          row.entityType === BUSINESS_TARGET_ENTITY_TYPE.MINED ||
          row.entityType === BUSINESS_TARGET_ENTITY_TYPE.MINED_ENDORSEMENT
        ) {
          soActual[monthName] = Number(row.total) + (soActual[monthName] || 0);
        } else if (
          row.entityType === BUSINESS_TARGET_ENTITY_TYPE.RO ||
          row.entityType === BUSINESS_TARGET_ENTITY_TYPE.RO_ENDORSEMENT
        ) {
          roActual[monthName] = Number(row.total) + (roActual[monthName] || 0);
        }
      });
      soActual[MONTHS_WITH_QUARTERS_ENUM.Q1] =
        soActual[MONTHS_WITH_QUARTERS_ENUM.APRIL] +
        soActual[MONTHS_WITH_QUARTERS_ENUM.MAY] +
        soActual[MONTHS_WITH_QUARTERS_ENUM.JUNE];
      soActual[MONTHS_WITH_QUARTERS_ENUM.Q2] =
        soActual[MONTHS_WITH_QUARTERS_ENUM.JULY] +
        soActual[MONTHS_WITH_QUARTERS_ENUM.AUGUST] +
        soActual[MONTHS_WITH_QUARTERS_ENUM.SEPTEMBER];
      soActual[MONTHS_WITH_QUARTERS_ENUM.Q3] =
        soActual[MONTHS_WITH_QUARTERS_ENUM.OCTOBER] +
        soActual[MONTHS_WITH_QUARTERS_ENUM.NOVEMBER] +
        soActual[MONTHS_WITH_QUARTERS_ENUM.DECEMBER];
      soActual[MONTHS_WITH_QUARTERS_ENUM.Q4] =
        soActual[MONTHS_WITH_QUARTERS_ENUM.JANUARY] +
        soActual[MONTHS_WITH_QUARTERS_ENUM.FEBRUARY] +
        soActual[MONTHS_WITH_QUARTERS_ENUM.MARCH];

      roActual[MONTHS_WITH_QUARTERS_ENUM.Q1] =
        roActual[MONTHS_WITH_QUARTERS_ENUM.APRIL] +
        roActual[MONTHS_WITH_QUARTERS_ENUM.MAY] +
        roActual[MONTHS_WITH_QUARTERS_ENUM.JUNE];
      roActual[MONTHS_WITH_QUARTERS_ENUM.Q2] =
        roActual[MONTHS_WITH_QUARTERS_ENUM.JULY] +
        roActual[MONTHS_WITH_QUARTERS_ENUM.AUGUST] +
        roActual[MONTHS_WITH_QUARTERS_ENUM.SEPTEMBER];
      roActual[MONTHS_WITH_QUARTERS_ENUM.Q3] =
        roActual[MONTHS_WITH_QUARTERS_ENUM.OCTOBER] +
        roActual[MONTHS_WITH_QUARTERS_ENUM.NOVEMBER] +
        roActual[MONTHS_WITH_QUARTERS_ENUM.DECEMBER];
      roActual[MONTHS_WITH_QUARTERS_ENUM.Q4] =
        roActual[MONTHS_WITH_QUARTERS_ENUM.JANUARY] +
        roActual[MONTHS_WITH_QUARTERS_ENUM.FEBRUARY] +
        roActual[MONTHS_WITH_QUARTERS_ENUM.MARCH];

      let summary = this.transformEstimatedBrokerageSummary({
        actual: {
          so: soActual,
          ro: roActual,
        },
        open: { so: soOpen.data, ro: roOpen.data },
        target: { so: so.targets, ro: ro.targets },
      });
      if (month) {
        summary = this.filterSummaryByMonth(summary, month);
      } else if (quarter) {
        summary = this.filterSummaryByQuarter(summary, quarter);
      }
      return summary;
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async updateOpportunityExpiry(
    opportunityId: number,
    newExpiryDate: string,
    userId: number
  ) {
    try {
      return await this.dataSource.transaction(async (entityManager) => {
        const opportunity =
          await this.opportunityRepository.updateOpportunityExpiry(
            entityManager,
            opportunityId,
            newExpiryDate,
            userId
          );
        if (opportunity) {
          const newOpportunity = await entityManager.findOne(Opportunity, {
            where: { refOpportunityId: opportunityId },
          });
          if (newOpportunity) {
            await this.opportunityRepository.deleteOpportunityById(
              entityManager,
              newOpportunity.opportunityId
            );
          }
        }
        return opportunity;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update opportunity expiry date: ${error.message}`
      );
    }
  }

  async getEmployeeHierarchyByUserId(userId: number): Promise<any> {
    try {
      const hierarchy =
        await this.opportunityRepository.getEmployeeHierarchyByUserId(userId);
      if (!hierarchy) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "failure",
            location: "OpportunityService",
            method: "getEmployeeHierarchyByUserId",
            messageData: `Hierarchy not found for userId: ${userId}`,
          }),
        });
        throw new NotFoundException(infoMessages.employeeHierarchyNotFound);
      }
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "OpportunityService",
          method: "getEmployeeHierarchyByUserId",
          messageData: `Fetched hierarchy for userId: ${userId}`,
        }),
      });
      return hierarchy;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "OpportunityService",
          method: "getEmployeeHierarchyByUserId",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getPendingActivitiesSummary(
    page: number,
    limit: number,
    userId: number,
    sortBy?: string,
    sortOrder?: "ASC" | "DESC",
    financialYear?: number,
    timeFilter?: string,
    organisationId?: any,
    sbuId?: number,
    // Vertical and Branch are multiselect dashboard filters: one id or a list.
    verticalId?: number | number[],
    departmentId?: number,
    branchId?: number | number[],
    owner?: string,
    // PLACEMENT = the ISG row group over the combined SO+RO pipeline (spec §12).
    type?: "SO" | "RO" | "ALL" | "PLACEMENT",
    isLeadership = false,
    from?: Date,
    to?: Date,
    insurerId?: number,
    fromDashboard?: boolean
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "OpportunityService",
        method: "getPendingActivitiesSummary",
        messageData: "method invoked",
      }),
    });
    try {
      let userIdsList: number[] = [];
      if (isLeadership === false) {
        const ownerType = !owner || owner === OWNER_TYPES.MANAGER
          ? OWNER_TYPES.MANAGER
          : undefined;
        if (ownerType) {
          const userDetails = await this.userRepository.findOne({
            where: {
              userId: userId,
              organisationId: organisationId ? organisationId : undefined,
              sbuId: sbuId ? sbuId : undefined,
              verticalId: eqOrIn(verticalId),
              departmentId: departmentId ? departmentId : undefined,
              branchId: eqOrIn(branchId),
            },
          });
          userIdsList = userDetails ? [userId] : [];
        } else {
          let users = await this.employeeService.getEmployeeHierarchyByUserId(
            userId
          );
          if (
            organisationId ||
            sbuId ||
            verticalId ||
            departmentId ||
            branchId
          ) {
            users = users?.filter(
              (user) =>
                (!organisationId || user.organisationId === organisationId) &&
                (!sbuId || user.sbuId === sbuId) &&
                idMatches(verticalId, user.verticalId) &&
                (!departmentId || user.departmentId === departmentId) &&
                idMatches(branchId, user.branchId)
            );
          }
          userIdsList = users?.map((user) => user.userId) || [];
        }
      } else {
        if (isLeadership === true) {
          const orgId = organisationId;
          if (orgId === 0) {
            const organisationIdNew =
              await this.opportunityRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PARENT_ORGANISATION_ID,
                { id: orgId }
              );

            const lookupCriteria =
              organisationIdNew.length === 0
                ? { parentOrganisationId: orgId }
                : { id: orgId };

            const organisationIds =
              await this.opportunityRepository.getEntityTableMapIds(
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
                lookupCriteria
              );
            organisationId = organisationIds;
          } else {
            organisationId = [organisationId];
          }
        }
      }

      return !isLeadership && userIdsList.length < 1
        ? []
        : await this.opportunityRepository.getPendingActivitiesSummary(
            page,
            limit,
            userId,
            isLeadership ? undefined : userIdsList,
            sortBy,
            sortOrder,
            financialYear,
            timeFilter,
            type,
            isLeadership
              ? {
                  organisationId,
                  sbuId,
                  verticalId,
                  departmentId,
                  branchId,
                }
              : undefined,
            from,
            to,
            insurerId,
            fromDashboard
          );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityService",
          method: "getPendingActivitiesSummary",
          messageData: error,
        }),
      });
      throw new BadRequestException(
        `${errorMessages.pendingActivitiesSummaryFailed} ${
          error instanceof Error ? error.message : ""
        }`
      );
    }
  }

  async getCautionDepositsByCompany(
    companyId: number,
    search = "",
    page = 1,
    limit = 20
  ) {
    try {
      return await this.opportunityRepository.getCautionDepositsByCompany(
        companyId,
        search,
        page,
        limit
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch caution deposits by company: ${error.message}`
      );
    }
  }

  async getPreferredInsurers(opportunityId: number) {
    try {
      const opportunity = await this.opportunityRepo.findOne({
        where: { opportunityId },
      });
      if (!opportunity) {
        throw new NotFoundException(
          `Opportunity with ID ${opportunityId} not found`
        );
      }
      const preferredInsurers =
        await this.opportunityRepository.getPreferredInsurers(opportunityId);
      const insurerDetails = await this.opportunityRepository.getInsurerDetails(
        opportunityId
      );
      if (!preferredInsurers || preferredInsurers.length === 0) {
        return {
          preferredInsurers: {
            data: [],
            count: 0,
          },
          insurerDetails: {
            data: [],
            count: 0,
          },
        };
      }

      const transformedPreferredInsurers =
        this.transformInsurerData(preferredInsurers);
      const transformedInsurerDetails =
        this.transformInsurerData(insurerDetails);

      return {
        preferredInsurers: {
          data: transformedPreferredInsurers,
          count: transformedPreferredInsurers.length,
        },
        insurerDetails: {
          data: transformedInsurerDetails,
          count: transformedInsurerDetails.length,
        },
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch preferred insurers for opportunity ${opportunityId}: ${error.message}`
      );
    }
  }

  async getInstallmentsPrefill(opportunityId: number) {
    try {
      const opportunity = await this.opportunityRepo.findOne({
        where: { opportunityId },
      });
      if (!opportunity) {
        throw new NotFoundException(
          `Opportunity with ID ${opportunityId} not found`
        );
      }

      const mapInstallments = (rows: any[] = []) =>
        rows
          .map((item) => ({
            installmentDate: item?.installmentDate ?? null,
            installmentNetAmount: item?.installmentNetAmount
              ? Number(item.installmentNetAmount)
              : null,
            installmentNo: item?.installmentNo ?? null,
            installmentSequence: item?.installmentSequence
              ? Number(item.installmentSequence)
              : null,
            installmentPercentage: item?.installmentPercentage
              ? Number(item.installmentPercentage)
              : null,
            taxPercentage: item?.taxPercentage
              ? Number(item.taxPercentage)
              : null,
            taxAmount: item?.taxAmount ? Number(item.taxAmount) : null,
            installmentGrossAmount: item?.installmentGrossAmount
              ? Number(item.installmentGrossAmount)
              : null,
            modeOfPayment: item?.modeOfPayment ?? null,
            id: item?.id ? Number(item.id) : null,
          }))
          .sort(
            (a, b) =>
              (a.installmentSequence ?? Number.MAX_SAFE_INTEGER) -
              (b.installmentSequence ?? Number.MAX_SAFE_INTEGER)
          );

      const policy = await this.policyRepository.findOne({
        where: { opportunityId },
        relations: ["installments"],
        order: {
          installments: {
            installmentSequence: "ASC",
          },
        },
      });

      if (policy) {
        const policyInstallments = Array.isArray(policy.installments)
          ? policy.installments.filter((item) => !item.deletedAt)
          : [];
        return {
          source: "policy",
          installmentDetails: mapInstallments(policyInstallments),
        };
      }

      return {
        source: "none",
        installmentDetails: [],
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch installments for opportunity ${opportunityId}: ${error.message}`
      );
    }
  }

  private transformInsurerData(insurers: any[]) {
    if (!insurers || insurers.length === 0) {
      return [];
    }
    return insurers.map((insurer) => ({
      insurerId: insurer.insurerId,
      insurerName:
        insurer?.insurer?.insurerName ??
        insurer?.insurerContact?.insurer?.insurerName ??
        "",
      insurerLocationId: insurer.insurerLocationId,
      insurerLocationName: insurer?.location?.name ?? undefined,
      insurerBranchId: insurer.insurerBranchId,
      insurerContactId: insurer.insurerContactId,
      isLeadInsurer:
        insurer?.isLeadInsurer ??
        insurer?.insurerParticipationTypeLid ??
        undefined,
      sharePercentage:
        insurer?.sharePercentage !== null &&
        insurer?.sharePercentage !== undefined
          ? Number(insurer?.sharePercentage)
          : null,
      shareAmount:
        insurer?.shareAmount !== null && insurer?.shareAmount !== undefined
          ? Number(insurer?.shareAmount)
          : null,
      brokeragePercentage:
        insurer?.brokeragePercentage !== null &&
        insurer?.brokeragePercentage !== undefined
          ? Number(insurer?.brokeragePercentage)
          : null,
      brokerageAmount:
        insurer?.brokerageAmount !== null &&
        insurer?.brokerageAmount !== undefined
          ? Number(insurer?.brokerageAmount)
          : null,
      terrorismSharePercentage:
        insurer?.terrorismSharePercentage !== null &&
        insurer?.terrorismSharePercentage !== undefined
          ? Number(insurer?.terrorismSharePercentage)
          : null,
      terrorismShareAmount:
        insurer?.terrorismShareAmount !== null &&
        insurer?.terrorismShareAmount !== undefined
          ? Number(insurer?.terrorismShareAmount)
          : null,
      terrorismBrokeragePercentage:
        insurer?.terrorismBrokeragePercentage !== null &&
        insurer?.terrorismBrokeragePercentage !== undefined
          ? Number(insurer?.terrorismBrokeragePercentage)
          : null,
      terrorismBrokerageAmount:
        insurer?.terrorismBrokerageAmount !== null &&
        insurer?.terrorismBrokerageAmount !== undefined
          ? Number(insurer?.terrorismBrokerageAmount)
          : null,
      totalBrokerageAmount:
        insurer?.totalBrokerageAmount !== null &&
        insurer?.totalBrokerageAmount !== undefined
          ? Number(insurer?.totalBrokerageAmount)
          : null,
    }));
  }

  private transformEstimatedBrokerageSummary(data: any) {
    const months = MONTHS_WITH_QUARTERS;

    // Helper to convert keys to lowercase (e.g., 'April' -> 'april')
    const normalize = (key: string) => key.toLowerCase();

    const calculateAnnual = (record: any) => {
      record.annual =
        (record.q1 || 0) +
        (record.q2 || 0) +
        (record.q3 || 0) +
        (record.q4 || 0);
    };

    // Initialize transformed array
    const dataTransformed = [];
    // 1. Combine ACTUAL totals (so + ro)
    const actualCombined: any = { label: "ACTUAL" };
    months.forEach((month) => {
      actualCombined[normalize(month)] =
        (data.actual.so[month] || 0) + (data.actual.ro[month] || 0);
    });
    calculateAnnual(actualCombined);
    dataTransformed.push(actualCombined);

    // 2. ACTUAL - SO
    const actualSO: any = { label: "NEW BIZ" };
    months.forEach((month) => {
      actualSO[normalize(month)] = data.actual.so[month] || 0;
    });
    calculateAnnual(actualSO);
    dataTransformed.push(actualSO);

    // 3. ACTUAL - RO
    const actualRO: any = { label: "RENEWALS" };
    months.forEach((month) => {
      actualRO[normalize(month)] = data.actual.ro[month] || 0;
    });
    calculateAnnual(actualRO);
    dataTransformed.push(actualRO);

    // 4. Combine OPEN totals (so + ro)
    const openCombined: any = { label: "NC" };
    months.forEach((month) => {
      openCombined[normalize(month)] =
        (data.open.so[month] || 0) + (data.open.ro[month] || 0);
    });
    calculateAnnual(openCombined);
    dataTransformed.push(openCombined);

    // 5. OPEN - SO
    const openSO: any = { label: "NEW BIZ" };
    months.forEach((month) => {
      openSO[normalize(month)] = data.open.so[month] || 0;
    });
    calculateAnnual(openSO);
    dataTransformed.push(openSO);

    // 6. OPEN - RO
    const openRO: any = { label: "RENEWALS" };
    months.forEach((month) => {
      openRO[normalize(month)] = data.open.ro[month] || 0;
    });
    calculateAnnual(openRO);
    dataTransformed.push(openRO);

    // 7. TARGET totals used for percentage calculations
    const targetCombinedTotals: any = {};
    const targetSOTotals: any = {};
    const targetROTotals: any = {};
    months.forEach((month) => {
      targetCombinedTotals[normalize(month)] =
        (data.target.so[month] || 0) + (data.target.ro[month] || 0);
      targetSOTotals[normalize(month)] = data.target.so[month] || 0;
      targetROTotals[normalize(month)] = data.target.ro[month] || 0;
    });
    calculateAnnual(targetCombinedTotals);
    calculateAnnual(targetSOTotals);
    calculateAnnual(targetROTotals);

    // 8. Percentage rows
    const percentCombined: any = { label: "%" };
    months.forEach((month) => {
      const actualVal = actualCombined[normalize(month)] || 0;
      const openVal = openCombined[normalize(month)] || 0;
      const targetVal = targetCombinedTotals[normalize(month)] || 0;
      percentCombined[normalize(month)] = targetVal
        ? ((actualVal + openVal) / targetVal) * 100
        : 0;
    });
    percentCombined.annual = targetCombinedTotals.annual
      ? ((actualCombined.annual + openCombined.annual) /
          targetCombinedTotals.annual) *
        100
      : 0;
    dataTransformed.push(percentCombined);

    const percentSO: any = { label: "NEW BIZ" };
    months.forEach((month) => {
      const actualVal = actualSO[normalize(month)] || 0;
      const openVal = openSO[normalize(month)] || 0;
      const targetVal = targetSOTotals[normalize(month)] || 0;
      percentSO[normalize(month)] = targetVal
        ? ((actualVal + openVal) / targetVal) * 100
        : 0;
    });
    percentSO.annual = targetSOTotals.annual
      ? ((actualSO.annual + openSO.annual) / targetSOTotals.annual) * 100
      : 0;
    dataTransformed.push(percentSO);

    const percentRO: any = { label: "RENEWALS" };
    months.forEach((month) => {
      const actualVal = actualRO[normalize(month)] || 0;
      const openVal = openRO[normalize(month)] || 0;
      const targetVal = targetROTotals[normalize(month)] || 0;
      percentRO[normalize(month)] = targetVal
        ? ((actualVal + openVal) / targetVal) * 100
        : 0;
    });
    percentRO.annual = targetROTotals.annual
      ? ((actualRO.annual + openRO.annual) / targetROTotals.annual) * 100
      : 0;
    dataTransformed.push(percentRO);

    return dataTransformed;
  }

  private filterSummaryByQuarter(data: any[], quarter: string) {
    const q = quarter.toLowerCase();
    const months = QUARTER_MONTHS[q] || [];
    return data.map((row) => {
      const filtered: any = { label: row.label };
      months.forEach((m) => (filtered[m] = row[m] || 0));
      filtered[q] = row[q] || 0;
      return filtered;
    });
  }

  private filterSummaryByMonth(data: any[], month: string) {
    const m = month.toLowerCase();
    const q = MONTH_TO_QUARTER[m];
    return data.map((row) => {
      const filtered: any = { label: row.label };
      filtered[m] = row[m] || 0;
      if (q) {
        filtered[q] = row[q] || 0;
      }
      return filtered;
    });
  }

  /**
   * Bulk update opportunities with validation and error handling
   * Follows the same pattern as bulkUpdateCompanies
   */
  async bulkUpdateOpportunities(
    recordIds: number[],
    fieldUpdates: any,
    userId: number,
    selectedAll: boolean = false,
    excludedIds: number[] = [],
    selectedFilterValues: Record<string, any> = {}
  ): Promise<{
    totalRecords: number;
    successCount: number;
    failureCount: number;
    errors: {
      recordId: number;
      fieldName: string;
      errorCode: string;
      errorMessage: string;
    }[];
    affectedRecords: number[];
    processingDuration: number;
    bdOwnerUserList: any;
    isgOwnerUserList: any;
  }> {
    try {
      const start = Date.now();
      let updatedOpportunityRecord;

      // Determine final record IDs based on selectedAll flag
      let finalRecordIds: number[];

      if (selectedAll) {
        if (
          selectedFilterValues.viewBy &&
          selectedFilterValues.viewBy.value == OWNER_TYPES.TEAM
        ) {
          const users = await this.employeeService.getEmployeeHierarchyByUserId(
            Number(selectedFilterValues.ownerId.value)
          );
          const userIdsList = users?.map((user: any) => user.userId) || [];
          selectedFilterValues["userIdsList"] = userIdsList;
        }
        const allFilteredIds =
          await this.opportunityRepository.getFilteredOpportunityIds(
            selectedFilterValues,
            selectedFilterValues?.ownerId?.value
              ? Number(selectedFilterValues?.ownerId?.value)
              : userId
          );

        // Remove excluded IDs from the filtered results
        finalRecordIds = allFilteredIds.filter(
          (id) => !excludedIds.includes(id)
        );
      } else {
        // Use provided recordIds directly
        finalRecordIds = recordIds;
      }

      let bdOwnerUserList, isgOwnerUserList;
      bdOwnerUserList =
        await this.opportunityRepository.getBdUsersByOpportunityIds(
          finalRecordIds
        );
      isgOwnerUserList =
        await this.opportunityRepository.getIsgUsersByOpportunityIds(
          finalRecordIds
        );
      const errors: {
        recordId: number;
        fieldName: string;
        errorCode: string;
        errorMessage: string;
      }[] = [];
      const affectedRecords: number[] = [];

      if (!finalRecordIds?.length) {
        return {
          totalRecords: 0,
          successCount: 0,
          failureCount: 0,
          errors: [],
          affectedRecords: [],
          processingDuration: 0,
          bdOwnerUserList: [],
          isgOwnerUserList: [],
        };
      }

      const normalizeFieldName = (fieldName: string): string =>
        typeof fieldName !== "string"
          ? ""
          : fieldName
              .trim()
              .replace(/[\s_-]+(.)?/g, (_, chr: string) =>
                chr ? chr.toUpperCase() : ""
              )
              .replace(/^(.)/, (match) => match.toLowerCase());

      const normalizedUpdates = Object.entries(fieldUpdates || {}).map(
        ([fieldName, value]) => ({
          originalFieldName: fieldName,
          fieldName: normalizeFieldName(fieldName),
          value: value,
          operation: "set",
        })
      );

      if (!normalizedUpdates.length) {
        return {
          totalRecords: finalRecordIds.length,
          successCount: 0,
          failureCount: finalRecordIds.length,
          errors: finalRecordIds.map((recordId) => ({
            recordId,
            fieldName: "*",
            errorCode: "NO_UPDATES_PROVIDED",
            errorMessage: "No updates provided for bulk update",
          })),
          affectedRecords: [],
          processingDuration: 0,
          bdOwnerUserList: [],
          isgOwnerUserList: [],
        };
      }

      // Define bulk editable fields for opportunities
      const BULK_EDITABLE_FIELDS = new Set([
        "ownerId",
        "isgId",
        "statusLid",
        "expiryDate",
      ]);

      const FIELD_PERSISTENCE_MAP: Record<string, string> = {
        ownerId: "ownerId",
        isgId: "isgId",
        status: "statusLid",
        expiryDate: "expiryDate",
      };

      const LEGACY_FIELD_NAME_MAP: Record<string, string> = {
        ownerId: "owner_id",
        isgId: "isg_id",
        statusLid: "statusLid",
        expiryDate: "expiry_date",
      };

      // TODO: Import from constants when available
      const NON_EDITABLE = new Set([
        // Add non-editable fields for opportunities
        "createdAt",
        "updatedAt",
        "deletedAt",
        "createdBy",
        "updatedBy",
      ]);

      const BATCH_SIZE = 1000; // Process 1000 records per batch

      // Split records into batches for optimal processing
      const batches = [];
      for (let i = 0; i < finalRecordIds.length; i += BATCH_SIZE) {
        batches.push(finalRecordIds.slice(i, i + BATCH_SIZE));
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "OpportunityService",
          method: "bulkUpdateOpportunities",
          messageData: `Start bulk update for ${finalRecordIds.length} opportunities (${normalizedUpdates.length} fields) in ${batches.length} batches of ${BATCH_SIZE}`,
        }),
      });

      // Process each batch in its own transaction for optimal performance
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchStart = Date.now();

        try {
          await this.dataSource.transaction(async (entityManager) => {
            for (const opportunityId of batch) {
              try {
                // Minimal existence check using repository method
                const existingId =
                  await this.opportunityRepository.getEntityTableMapIds(
                    "Opportunity",
                    "opportunityId",
                    { opportunityId }
                  );
                if (!existingId || existingId.length === 0) {
                  errors.push({
                    recordId: opportunityId,
                    fieldName: "*",
                    errorCode: "NOT_FOUND",
                    errorMessage: "Opportunity not found",
                  });
                  this.logger.warn({
                    level: "warn",
                    message: buildLogMessage({
                      traceId: this.traceIdService.traceId,
                      userId,
                      status: "failure",
                      location: "OpportunityService",
                      method: "bulkUpdateOpportunities",
                      messageData: `Opportunity ${opportunityId} not found`,
                    }),
                  });
                  continue;
                }

                // Additional validation: Check if opportunity is in a valid state for bulk updates
                const opportunityDetails =
                  await this.opportunityRepository.getEntityTableMapIds(
                    "Opportunity",
                    "statusLid",
                    { opportunityId }
                  );
                if (opportunityDetails && opportunityDetails.length > 0) {
                  const opportunity = opportunityDetails[0];

                  // Check if opportunity is not in a final state (Won/Lost) that shouldn't be bulk edited
                  const wonStatusLookup = await entityManager.findOne(
                    "LookUp",
                    {
                      where: { lookUpKey: OPPORTUNITY_STATUS_WON },
                      select: ["id"],
                    }
                  );
                  const lostStatusLookup = await entityManager.findOne(
                    "LookUp",
                    {
                      where: { lookUpKey: OPPORTUNITY_STATUS_LOST },
                      select: ["id"],
                    }
                  );

                  if (
                    wonStatusLookup &&
                    opportunity.statusLid === wonStatusLookup.id
                  ) {
                    errors.push({
                      recordId: opportunityId,
                      fieldName: "*",
                      errorCode: "OPPORTUNITY_WON",
                      errorMessage: "Cannot bulk edit won opportunities",
                    });
                    continue;
                  }

                  if (
                    lostStatusLookup &&
                    opportunity.statusLid === lostStatusLookup.id
                  ) {
                    errors.push({
                      recordId: opportunityId,
                      fieldName: "*",
                      errorCode: "OPPORTUNITY_LOST",
                      errorMessage: "Cannot bulk edit lost opportunities",
                    });
                    continue;
                  }
                }

                const mutation: Record<string, unknown> = {};
                let ownerIdUpdate: number | null = null;
                let isgIdUpdate: number | null = null;

                for (const update of normalizedUpdates) {
                  const { fieldName, value, originalFieldName } = update;
                  if (!BULK_EDITABLE_FIELDS.has(fieldName)) {
                    errors.push({
                      recordId: opportunityId,
                      fieldName: originalFieldName,
                      errorCode: "FIELD_NOT_BULK_EDITABLE",
                      errorMessage: `Field '${originalFieldName}' is not bulk editable for opportunity`,
                    });
                    this.logger.warn({
                      level: "warn",
                      message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        userId,
                        status: "failure",
                        location: "OpportunityService",
                        method: "bulkUpdateOpportunities",
                        messageData: `Field ${originalFieldName} not bulk editable for opportunityId ${opportunityId}`,
                      }),
                    });
                    continue;
                  }

                  const legacyFieldName = LEGACY_FIELD_NAME_MAP[fieldName];
                  const isNonEditable =
                    NON_EDITABLE.has(fieldName) ||
                    (legacyFieldName
                      ? NON_EDITABLE.has(legacyFieldName)
                      : false);
                  if (isNonEditable) {
                    errors.push({
                      recordId: opportunityId,
                      fieldName: originalFieldName,
                      errorCode: "FIELD_NON_EDITABLE",
                      errorMessage: `Field '${originalFieldName}' cannot be edited`,
                    });
                    this.logger.warn({
                      level: "warn",
                      message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        userId,
                        status: "failure",
                        location: "OpportunityService",
                        method: "bulkUpdateOpportunities",
                        messageData: `Field ${originalFieldName} non-editable for opportunityId ${opportunityId}`,
                      }),
                    });
                    continue;
                  }

                  // Map to database field name
                  const dbFieldName =
                    FIELD_PERSISTENCE_MAP[fieldName] || fieldName;

                  // Type validation and processing for specific fields
                  if (fieldName === "expiryDate" && value !== null) {
                    const dateValue = new Date(value as string);
                    if (isNaN(dateValue.getTime())) {
                      errors.push({
                        recordId: opportunityId,
                        fieldName: originalFieldName,
                        errorCode: "INVALID_TYPE",
                        errorMessage: `Field '${originalFieldName}' must be a valid date`,
                      });
                      continue;
                    }
                    mutation[dbFieldName] = dateValue;
                  } else if (fieldName === "statusLid" && value !== null) {
                    // Validate lookup values exist
                    const lookupExists = await entityManager.findOne("LookUp", {
                      where: { id: value as number },
                      select: ["id"],
                    });
                    if (!lookupExists) {
                      errors.push({
                        recordId: opportunityId,
                        fieldName: originalFieldName,
                        errorCode: "INVALID_LOOKUP_VALUE",
                        errorMessage: `Invalid lookup value for ${originalFieldName}`,
                      });
                      continue;
                    }
                    mutation[dbFieldName] = value;
                  } else if (fieldName === "ownerId" && value !== null) {
                    // Validate user exists and is active
                    const userExists = await entityManager.findOne("User", {
                      where: { userId: value as number, deletedAt: null },
                      select: ["userId"],
                    });
                    if (!userExists) {
                      errors.push({
                        recordId: opportunityId,
                        fieldName: originalFieldName,
                        errorCode: "INVALID_USER",
                        errorMessage: `Invalid user ID for ${originalFieldName}`,
                      });
                      continue;
                    }
                    mutation[dbFieldName] = value;
                    ownerIdUpdate = value as number;
                    if (
                      mutation["ownerId"] !== undefined &&
                      mutation["ownerId"] !== null
                    ) {
                      mutation["createdBy"] = value;
                    }
                  } else if (fieldName === "isgId" && value !== null) {
                    // Validate user exists and is active
                    const userExists = await entityManager.findOne("User", {
                      where: { userId: value as number, deletedAt: null },
                      select: ["userId"],
                    });
                    if (!userExists) {
                      errors.push({
                        recordId: opportunityId,
                        fieldName: originalFieldName,
                        errorCode: "INVALID_USER",
                        errorMessage: `Invalid user ID for ${originalFieldName}`,
                      });
                      continue;
                    }
                    mutation[dbFieldName] = value;
                    isgIdUpdate = value as number;
                  } else {
                    mutation[dbFieldName] = value;
                  }
                }

                // Only proceed with update if there are valid mutations
                if (Object.keys(mutation).length > 0) {
                  // Add audit fields
                  mutation.updatedBy = userId;
                  mutation.updatedAt = new Date();

                  try {
                    updatedOpportunityRecord =
                      await this.opportunityRepository.updateEntityTableMapIds(
                        "Opportunity",
                        mutation,
                        { opportunityId }
                      );

                    if (updatedOpportunityRecord) {
                      affectedRecords.push(opportunityId);
                      // Update OpportunityActivityMap if ownerId or isgId was updated
                      if (ownerIdUpdate !== null) {
                        const bdResult =
                          await this.updateOpportunityActivityMapOwner(
                            entityManager,
                            opportunityId,
                            ownerIdUpdate,
                            ROLE_KEY.ROLE_BD_EXECUTIVE,
                            userId
                          );
                        this.logger.log({
                          level: "info",
                          message: buildLogMessage({
                            traceId: this.traceIdService.traceId,
                            userId,
                            status: "success",
                            location: "OpportunityService",
                            method: "bulkUpdateOpportunities",
                            messageData: `Updated BD executive activities for opportunity ${opportunityId} to user ${ownerIdUpdate}, result: ${bdResult}`,
                          }),
                        });
                      }

                      if (isgIdUpdate !== null) {
                        const isgResult =
                          await this.updateOpportunityActivityMapOwner(
                            entityManager,
                            opportunityId,
                            isgIdUpdate,
                            ROLE_KEY.ROLE_ISG_EXECUTIVE,
                            userId
                          );
                        this.logger.log({
                          level: "info",
                          message: buildLogMessage({
                            traceId: this.traceIdService.traceId,
                            userId,
                            status: "success",
                            location: "OpportunityService",
                            method: "bulkUpdateOpportunities",
                            messageData: `Updated ISG executive activities for opportunity ${opportunityId} to user ${isgIdUpdate}, result: ${isgResult}`,
                          }),
                        });
                      }

                      this.logger.log({
                        level: "info",
                        message: buildLogMessage({
                          traceId: this.traceIdService.traceId,
                          userId,
                          status: "success",
                          location: "OpportunityService",
                          method: "bulkUpdateOpportunities",
                          messageData: `Successfully updated opportunity ${opportunityId}`,
                        }),
                      });
                    }
                  } catch (updateError) {
                    const errorMessage =
                      updateError instanceof Error
                        ? updateError.message
                        : String(updateError);
                    errors.push({
                      recordId: opportunityId,
                      fieldName: "*",
                      errorCode: "UPDATE_FAILED",
                      errorMessage: `Failed to update opportunity: ${errorMessage}`,
                    });
                    this.logger.error({
                      level: "error",
                      message: buildLogMessage({
                        traceId: this.traceIdService.traceId,
                        userId,
                        status: "failure",
                        location: "OpportunityService",
                        method: "bulkUpdateOpportunities",
                        messageData: `Update failed for opportunity ${opportunityId}: ${errorMessage}`,
                      }),
                    });
                  }
                }
              } catch (recordError) {
                const errorMessage =
                  recordError instanceof Error
                    ? recordError.message
                    : String(recordError);
                errors.push({
                  recordId: opportunityId,
                  fieldName: "*",
                  errorCode: "EXCEPTION",
                  errorMessage: `Unexpected error processing opportunity: ${errorMessage}`,
                });
                this.logger.error({
                  level: "error",
                  message: buildLogMessage({
                    traceId: this.traceIdService.traceId,
                    userId,
                    status: "failure",
                    location: "OpportunityService",
                    method: "bulkUpdateOpportunities",
                    messageData: `Exception for opportunity ${opportunityId}: ${errorMessage}`,
                  }),
                });
              }
            }
          });

          const batchEnd = Date.now();
          this.logger.log({
            level: "info",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "success",
              location: "OpportunityService",
              method: "bulkUpdateOpportunities",
              messageData: `Batch ${batchIndex + 1}/${
                batches.length
              } completed in ${batchEnd - batchStart}ms`,
            }),
          });
        } catch (batchError) {
          const errorMessage =
            batchError instanceof Error
              ? batchError.message
              : String(batchError);
          // Mark all records in this batch as failed
          for (const opportunityId of batch) {
            if (!errors.find((e) => e.recordId === opportunityId)) {
              errors.push({
                recordId: opportunityId,
                fieldName: "*",
                errorCode: "BATCH_FAILED",
                errorMessage: `Batch processing failed: ${errorMessage}`,
              });
            }
          }
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "failure",
              location: "OpportunityService",
              method: "bulkUpdateOpportunities",
              messageData: `Batch ${batchIndex + 1} failed: ${errorMessage}`,
            }),
          });
        }
      }

      const end = Date.now();
      const processingDuration = end - start;
      const successCount = affectedRecords.length;
      const failureCount = finalRecordIds.length - successCount;

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "OpportunityService",
          method: "bulkUpdateOpportunities",
          messageData: `Bulk update completed: ${successCount} success, ${failureCount} failures in ${processingDuration}ms`,
        }),
      });
      finalRecordIds.map((recordId) => {
        bdOwnerUserList.map((item) => {
          if (item.opportunityIds.includes(recordId) && fieldUpdates.ownerId) {
            item.bdOwnerCount = item.bdOwnerCount + 1;
          }
          if (
            item.opportunityIds.includes(recordId) &&
            fieldUpdates.expiryDate
          ) {
            item.expiryDateCount = item.expiryDateCount + 1;
          }
        });
        isgOwnerUserList.map((item) => {
          if (item.opportunityIds.includes(recordId) && fieldUpdates.isgId) {
            item.isgOwnerCount = item.isgOwnerCount + 1;
          }
        });
      });
      bdOwnerUserList.map(
        (item) => item.opportunityIds && delete item.opportunityIds
      );
      isgOwnerUserList.map(
        (item) => item.opportunityIds && delete item.opportunityIds
      );
      return {
        totalRecords: finalRecordIds.length,
        successCount,
        failureCount,
        errors,
        affectedRecords,
        processingDuration,
        bdOwnerUserList,
        isgOwnerUserList,
      };
    } catch (error) {
      const err = error as Error;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "OpportunityService",
          method: "bulkUpdateOpportunities",
          messageData: `Bulk update failed: ${err.message}`,
        }),
      });
      throw new BadRequestException(
        `Opportunity bulk update failed: ${err.message}`
      );
    }
  }

  /**
   * Updates OpportunityActivityMap records for a specific role when ownerId or isgId changes
   */
  public async updateOpportunityActivityMapOwner(
    entityManager: EntityManager,
    opportunityId: number,
    newUserId: number,
    roleKey: string,
    updatedBy: number
  ): Promise<any> {
    try {
      const updateResult = await entityManager.update(
        "OpportunityActivityMap",
        {
          opportunityId: opportunityId,
          roleKey: roleKey,
        },
        {
          ownerId: newUserId,
          updatedBy: updatedBy,
          updatedAt: new Date(),
        }
      );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: updatedBy,
          status: "success",
          location: "OpportunityService",
          method: "updateOpportunityActivityMapOwner",
          messageData: `Updated ${
            updateResult.affected || 0
          } activity records for opportunity ${opportunityId}, role ${roleKey}, new owner ${newUserId}`,
        }),
      });
      return updateResult;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: updatedBy,
          status: "failure",
          location: "OpportunityService",
          method: "updateOpportunityActivityMapOwner",
          messageData: `Failed to update activity map for opportunity ${opportunityId}, role ${roleKey}: ${errorMessage}`,
        }),
      });
      // Don't throw error here as we don't want to rollback the main opportunity update
      // Just log the error for investigation
    }
  }

  async getOpportunityActivityTasks(
    opportunityActivityId: number,
    page: number,
    limit: number
  ) {
    try {
      const tasks =
        await this.opportunityRepository.getOpportunityActivityTasks(
          opportunityActivityId,
          page,
          limit
        );

      if (tasks.count > 0) {
        const transformedTasks = tasks.data.map((task: Task) => {
          return {
            id: task.id,
            taskName: task.taskName,
            description: task.description,
            dueDate: task.dueDate,
            assignee: task?.assignee
              ? {
                  userId: task.assignee.userId,
                  firstName: task.assignee.firstName,
                  lastName: task.assignee.lastName,
                }
              : null,
            priority: task?.priority
              ? {
                  id: task.priority.id,
                  lookUpValue: task.priority.lookUpValue,
                }
              : null,
            taskStatus: task?.taskStatus
              ? {
                  id: task.taskStatus.id,
                  lookUpValue: task.taskStatus.lookUpValue,
                }
              : null,
            company: task?.company
              ? {
                  id: task.company.id,
                  name: task.company.companyName,
                  displayName: task.company.displayName,
                }
              : null,
            opportunity: task?.opportunity
              ? {
                  opportunityId: task.opportunity.opportunityId,
                  policy: task.opportunity.policyType?.lookUpValue,
                }
              : null,
            activity: task?.activity
              ? {
                  id: task.activity.id,
                  activityName: task.activity.activityName,
                }
              : null,
          };
        });
        return {
          data: transformedTasks,
          count: tasks.count,
          isAllTasksCompleted: tasks.isAllTasksCompleted,
        };
      } else {
        return tasks;
      }
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch opportunity activity tasks: ${error.message}`
      );
    }
  }

  async dataValidationTaskCreation(
    statusLid: number,
    opportunityId: number,
    opportunityActivityId: number,
    leadDays: number,
    userId: number,
    entityManager: EntityManager
  ): Promise<any> {
    try {
      const createTaskObject =
        await this.opportunityRepository.createTaskObject(
          statusLid,
          opportunityId,
          opportunityActivityId,
          DATA_VALIDATION_TASK_NAME,
          leadDays,
          userId
        );
      if (!createTaskObject) {
        throw new BadRequestException(
          "Failed to create task object for data validation."
        );
      }
      // Call the createTask function in TaskService
      const task = await this.taskService.createTask(
        createTaskObject,
        entityManager
      );
      return task;
    } catch (error) {
      throw new BadRequestException(
        `Data validation task creation failed: ${error}`
      );
    }
  }

  async addQuoteFromFinalNegotiation(
    finalNegotiationActivityId: number,
    userId: number
  ): Promise<any> {
    try {
      return await this.dataSource.transaction(async (manager) => {
        // Get opportunity activity to extract opportunity ID
        const opportunityActivity =
          await this.opportunityRepository.getOpportunityActivityById(
            finalNegotiationActivityId
          );

        // Update only Enter Quote activity to "In Progress" status
        const updatedActivity =
          await this.opportunityRepository.updateEnterQuoteActivityToInProgress(
            manager,
            opportunityActivity.opportunityId,
            userId
          );

        // Log the action for audit purposes
        console.log(
          `User ${userId} triggered Add Quote for Final Negotiation Activity ${finalNegotiationActivityId}`
        );
        console.log(`Updated Enter Quote Activity: ${updatedActivity.id}`);

        return {
          enterQuoteActivityId: updatedActivity.id,
          updatedStatus: "In Progress",
        };
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to add quote from final negotiation: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getRenewalScheduleBySbu(
    userId: number,
    owner?: string,
    organisationId?: number,
    sbuId?: number,
    // Vertical and Branch are multiselect dashboard filters: one id or a list.
    verticalId?: number | number[],
    departmentId?: number,
    branchId?: number | number[],
    from?: Date,
    to?: Date,
    insurerId?: number,
    isLeadership?: boolean
  ) {
    const ownerType = !owner || owner === "me" ? "me" : undefined;
    let oppUserList: number[] = [];

    if (ownerType) {
      const userDetails = await this.userRepository.findOne({
        where: {
          userId,
          ...(organisationId ? { organisationId } : {}),
          ...(sbuId ? { sbuId } : {}),
          ...(verticalId ? { verticalId: eqOrIn(verticalId) } : {}),
          ...(departmentId ? { departmentId } : {}),
          ...(branchId ? { branchId: eqOrIn(branchId) } : {}),
        },
      });
      oppUserList = userDetails ? [userId] : [];
    } else if (isLeadership) {
      const whereClause: any = {};
      if (organisationId) whereClause.organisationId = organisationId;
      if (sbuId) whereClause.sbuId = sbuId;
      if (verticalId) whereClause.verticalId = eqOrIn(verticalId);
      if (departmentId) whereClause.departmentId = departmentId;
      if (branchId) whereClause.branchId = eqOrIn(branchId);
      const allUsers = await this.userRepository.find({
        where: whereClause,
        select: ["userId"],
      });
      oppUserList = allUsers.map((u) => u.userId);
    } else {
      const opportunityUsers = await this.employeeService.fetchReporteeUserIds(userId);
      oppUserList = opportunityUsers?.map((u: any) => u.userId) || [];
      oppUserList.push(userId);
    }

    if (!isLeadership && oppUserList.length === 0) {
      return { data: [] };
    }

    // Org whose full SBU list should appear (0 where no opportunities). Falls
    // back to the requesting user's org when no org filter is applied.
    const currentUser = await this.userRepository.findOne({
      where: { userId },
      select: ["userId", "organisationId"],
    });
    const sbuScopeOrgId = organisationId ?? currentUser?.organisationId;

    const rows = await this.opportunityRepository.getRenewalScheduleBySbu(
      oppUserList,
      Boolean(isLeadership),
      userId,
      { organisationId, sbuId, verticalId, departmentId, branchId, from, to, insurerId, sbuScopeOrgId }
    );

    return { data: rows };
  }

  // Resolves the visible user set (owner / leadership / reportees) exactly like
  // getRenewalScheduleBySbu, then returns the grouped RO aggregate for one
  // hierarchy level. Powers the My RO Enhanced org-hierarchy drilldown cards.
  async getScopeSummary(
    userId: number,
    params: {
      level: "organisation" | "unit" | "vertical" | "branch" | "owner";
      type?: "SO" | "RO";
      organisationId?: number;
      sbuId?: number;
      verticalId?: number;
      departmentId?: number;
      branchId?: number;
      from?: Date;
      to?: Date;
      financialYear?: number;
      owner?: string;
    },
    // The real logged-in viewer. `userId` may be a selected owner (re-scoped
    // like the listing's ownerId), but the BD/ISG stage gate always keys off
    // the VIEWER — same split as getAllOpportunityList's actualLoggedInUserId.
    viewerUserId?: number,
    explicitOwner = false,
  ) {
    const {
      level,
      type,
      organisationId,
      sbuId,
      verticalId,
      departmentId,
      branchId,
      from,
      to,
      financialYear,
      owner,
    } = params;

    const { isLeadership, oppUserList, taggedUserIds } =
      await this.resolveScopeSummaryVisibility(
        userId,
        { organisationId, sbuId, verticalId, departmentId, branchId },
        owner,
        explicitOwner
      );

    const emptyTotal = { totalRos: 0, premium: 0, brokerage: 0 };
    if (!isLeadership && oppUserList.length === 0) {
      return { level, nodes: [], ...(level === "organisation" ? { total: emptyTotal } : {}) };
    }

    // Same role-based stage gate the listing applies unconditionally: a
    // BD-only viewer loses ISG-handed opportunities (unless their reporting
    // tree owns them), an ISG-only viewer sees only ISG-reached ones, and
    // dual-visibility viewers resolve to no gate. Keyed off the LOGGED-IN
    // viewer, never the selected owner — the listing computes it from
    // actualLoggedInUserId before ownerId re-scoping.
    const gateViewerId = viewerUserId ?? userId;
    const visibleActivityRoleKeys = await this.resolveVisibleActivityRoleKeys(
      gateViewerId
    );
    const gateOwnerUserIds = await this.resolveBdGateOwnerIds(
      gateViewerId,
      visibleActivityRoleKeys
    );
    const stageGate = await this.opportunityRepository.buildActivityRoleStageGate(
      visibleActivityRoleKeys,
      false,
      gateOwnerUserIds
    );
    // Owner accordion (Enhanced pages only): one row per member of the
    // logged-in user's reporting downline, self included — the SAME
    // population the employee/hierarchy master (owner tree-select) shows.
    // View-by "manager" counts each member's individual attribution;
    // "team" rolls every member's subtree up into that member. Visibility
    // conditions stay identical to the other levels above.
    if (level === "owner") {
      const downline = await this.scopeService.getNewEmployeeHierarchyByUserId(
        userId,
        false
      );
      const ownerIds = Array.from(
        new Set(
          ((downline ?? []) as Array<{ userId: number }>)
            .map((u) => Number(u.userId))
            .filter((id) => !Number.isNaN(id))
        )
      );
      if (ownerIds.length === 0) {
        return { level, nodes: [] };
      }
      const nodes = await this.opportunityRepository.getOwnerScopeSummary(
        oppUserList,
        taggedUserIds,
        isLeadership,
        {
          ownerIds,
          viewBy: params.owner === "manager" ? "manager" : "team",
          type,
          organisationId,
          sbuId,
          verticalId,
          departmentId,
          branchId,
          from,
          to,
          financialYear,
        }
      );
      return { level, nodes };
    }

    const nodes = await this.opportunityRepository.getScopeSummary(
      oppUserList,
      taggedUserIds,
      isLeadership,
      {
        level,
        type,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        from,
        to,
        financialYear,
      },
      stageGate
    );

    // Grand total across every organisation the caller can see, for the root
    // "All <org>" summary header — summed from this same response's rows
    // rather than a second query, since GROUP BY already partitions the
    // identical WHERE-filtered set exactly.
    if (level === "organisation") {
      const total = nodes.reduce(
        (acc, node) => ({
          totalRos: acc.totalRos + node.totalRos,
          premium: acc.premium + node.premium,
          brokerage: acc.brokerage + node.brokerage,
        }),
        emptyTotal
      );
      return { level, nodes, total };
    }

    return { level, nodes };
  }

  // Shared by getScopeSummary and getCompanySummary. Resolves the visible
  // user set exactly like validateOpportunityScope: leadership sees everyone
  // in the dimension filters; everyone else sees self + branch peers (AM/ISG)
  // + reportees + org peers (CS_MANAGER/CS_EXECUTIVE) for createdBy
  // visibility. taggedUserIds is the same set WITHOUT org peers, for the
  // participant/owner/task-assignee union — matching
  // applyCommonfilterForOpportunity's own scope_users (entity-service.utils),
  // which has no "org" slot at all. isLeadership uses .includes() (not the
  // stricter hasLeadershipRole '===' match), matching validateOpportunityScope
  // exactly. View-by parity with the listing: absent or "team" means team;
  // only an explicit "manager" narrows the tagged union to the user themself
  // (createdBy expansion keeps the full role expansion regardless of mode).
  private async resolveScopeSummaryVisibility(
    userId: number,
    dims: {
      organisationId?: number;
      sbuId?: number;
      verticalId?: number;
      departmentId?: number;
      branchId?: number;
    },
    owner?: string,
    // See getScopeSummary's `explicitOwner`: a real owner pick keeps its scope
    // even for a leadership user, exactly like validateOpportunityScope's
    // `effectiveLeadership = isLeadership && !hasExplicitOwnerSelection`.
    explicitOwner = false
  ): Promise<{
    isLeadership: boolean;
    oppUserList: number[];
    taggedUserIds: number[];
  }> {
    const teamMode = owner !== OWNER_TYPES.MANAGER;

    const user = await this.scopeService.getUserWithRoles(userId);
    const roles = (user?.userRoles || [])
      .filter((userRole: any) => userRole?.role)
      .map((userRole: any) => ({
        name: userRole.role.name,
        roleKey: userRole.role.roleKey,
      }));
    const isLeadership = roles.some(
      (r) =>
        r.roleKey != null &&
        (r.roleKey.includes(ROLE_KEY.ROLE_LEADERSHIP) ||
          r.roleKey === ROLE_KEY.ROLE_SUPER_USER)
    );

    const effectiveLeadership = isLeadership && !explicitOwner;

    let oppUserList: number[] = [];
    let taggedUserIds: number[] = [];

    if (effectiveLeadership) {
      const whereClause: any = {};
      if (dims.organisationId) whereClause.organisationId = dims.organisationId;
      if (dims.sbuId) whereClause.sbuId = dims.sbuId;
      if (dims.verticalId) whereClause.verticalId = dims.verticalId;
      if (dims.departmentId) whereClause.departmentId = dims.departmentId;
      if (dims.branchId) whereClause.branchId = dims.branchId;
      const allUsers = await this.userRepository.find({
        where: whereClause,
        select: ["userId"],
      });
      oppUserList = allUsers.map((u) => u.userId);
    } else {
      const isOrg = roles.some(
        (r) =>
          r.roleKey?.includes(ROLE_KEY.ROLE_CS_MANAGER) ||
          r.roleKey?.includes(ROLE_KEY.ROLE_CS_EXECUTIVE)
      );
      const isBranch = roles.some((r) => ["AM", "ISG"].includes(r.name));
      // An explicit owner pick shows that person's own book (their reporting
      // tree), so the CS->org and AM/ISG->branch expansions are skipped and we
      // fall through to the reportee scope — identical to
      // validateOpportunityScope's effectiveIsOrg / effectiveIsBranch.
      const effectiveIsOrg = isOrg && !explicitOwner;
      const effectiveIsBranch = isBranch && !explicitOwner;
      const isReportee = !effectiveIsOrg && !effectiveIsBranch;

      const employeeDetails = await this.scopeService.getEmployeeDetails(
        userId
      );

      const createdByUserIds = new Set<number>([userId]);
      const taggedUserIdsSet = new Set<number>([userId]);
      if (effectiveIsBranch && employeeDetails?.branchId) {
        const branchUsersId = await this.scopeService.fetchBranchUserIds(
          employeeDetails.branchId
        );
        branchUsersId.forEach((id) => {
          createdByUserIds.add(id);
          taggedUserIdsSet.add(id);
        });
      }
      if (isReportee) {
        // employee_hierarchy membership — the SAME source the listing uses
        // for both its createdBy expansion and its scope_users CTE. The
        // recursive users-table walk (getNewEmployeeHierarchyByUserId)
        // resolves a DIFFERENT member set and would silently inflate counts.
        const reporteeUserIds = await this.scopeService.fetchReporteeUserIds(
          userId
        );
        reporteeUserIds.forEach((id) => {
          createdByUserIds.add(id);
          taggedUserIdsSet.add(id);
        });
      }
      if (effectiveIsOrg && employeeDetails?.organisationId) {
        const orgUsersId = await this.scopeService.fetchOrgUserIds(
          employeeDetails.organisationId
        );
        // createdBy only — deliberately NOT added to taggedUserIdsSet.
        orgUsersId.forEach((id) => createdByUserIds.add(id));
      }
      oppUserList = Array.from(createdByUserIds);
      taggedUserIds = teamMode ? Array.from(taggedUserIdsSet) : [userId];
    }

    return { isLeadership: effectiveLeadership, oppUserList, taggedUserIds };
  }

  // Paginated company-grain aggregate for SO/RO Enhanced's portfolio-style
  // Companies table. `userId` may be a selected owner (explicit selection
  // always scopes, mirroring the listing's marker rule); the BD/ISG stage
  // gate keys off the real viewer, exactly like getScopeSummary.
  async getCompanySummary(
    userId: number,
    params: {
      type?: "SO" | "RO";
      organisationId?: number;
      sbuId?: number;
      verticalId?: number;
      departmentId?: number;
      branchId?: number;
      from?: Date;
      to?: Date;
      financialYear?: number;
      owner?: string;
      searchBy?: string;
      page: number;
      limit: number;
    },
    viewerUserId?: number
  ) {
    const {
      type,
      organisationId,
      sbuId,
      verticalId,
      departmentId,
      branchId,
      from,
      to,
      financialYear,
      owner,
      searchBy,
      page,
      limit,
    } = params;

    const { isLeadership, oppUserList, taggedUserIds } =
      await this.resolveScopeSummaryVisibility(
        userId,
        { organisationId, sbuId, verticalId, departmentId, branchId },
        owner
      );

    if (!isLeadership && oppUserList.length === 0) {
      return { count: 0, data: [] };
    }

    const gateViewerId = viewerUserId ?? userId;
    const visibleActivityRoleKeys = await this.resolveVisibleActivityRoleKeys(
      gateViewerId
    );
    const gateOwnerUserIds = await this.resolveBdGateOwnerIds(
      gateViewerId,
      visibleActivityRoleKeys
    );
    const stageGate = await this.opportunityRepository.buildActivityRoleStageGate(
      visibleActivityRoleKeys,
      false,
      gateOwnerUserIds
    );

    return this.opportunityRepository.getCompanyScopeSummary(
      oppUserList,
      taggedUserIds,
      isLeadership,
      {
        type,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        from,
        to,
        financialYear,
        searchBy,
        page,
        limit,
      },
      stageGate
    );
  }

  async getSalesScheduleBySbu(
    userId: number,
    owner?: string,
    organisationId?: number,
    sbuId?: number,
    // Vertical and Branch are multiselect dashboard filters: one id or a list.
    verticalId?: number | number[],
    departmentId?: number,
    branchId?: number | number[],
    from?: Date,
    to?: Date,
    insurerId?: number,
    isLeadership?: boolean,
    // "PLACEMENT" = the combined SO+RO pipeline past the ISG gate (spec §12.3-B).
    scope?: "PLACEMENT"
  ) {
    const ownerType = !owner || owner === "me" ? "me" : undefined;
    let oppUserList: number[] = [];

    if (ownerType) {
      const userDetails = await this.userRepository.findOne({
        where: {
          userId,
          ...(organisationId ? { organisationId } : {}),
          ...(sbuId ? { sbuId } : {}),
          ...(verticalId ? { verticalId: eqOrIn(verticalId) } : {}),
          ...(departmentId ? { departmentId } : {}),
          ...(branchId ? { branchId: eqOrIn(branchId) } : {}),
        },
      });
      oppUserList = userDetails ? [userId] : [];
    } else if (isLeadership) {
      const whereClause: any = {};
      if (organisationId) whereClause.organisationId = organisationId;
      if (sbuId) whereClause.sbuId = sbuId;
      if (verticalId) whereClause.verticalId = eqOrIn(verticalId);
      if (departmentId) whereClause.departmentId = departmentId;
      if (branchId) whereClause.branchId = eqOrIn(branchId);
      const allUsers = await this.userRepository.find({
        where: whereClause,
        select: ["userId"],
      });
      oppUserList = allUsers.map((u) => u.userId);
    } else {
      const opportunityUsers = await this.employeeService.fetchReporteeUserIds(userId);
      oppUserList = opportunityUsers?.map((u: any) => u.userId) || [];
      oppUserList.push(userId);
    }

    if (!isLeadership && oppUserList.length === 0) {
      return { data: [] };
    }

    // Org whose full SBU list should appear (0 where no opportunities). Falls
    // back to the requesting user's org when no org filter is applied.
    const currentUser = await this.userRepository.findOne({
      where: { userId },
      select: ["userId", "organisationId"],
    });
    const sbuScopeOrgId = organisationId ?? currentUser?.organisationId;

    const rows = await this.opportunityRepository.getSalesScheduleBySbu(
      oppUserList,
      Boolean(isLeadership),
      userId,
      { organisationId, sbuId, verticalId, departmentId, branchId, from, to, insurerId, sbuScopeOrgId, scope }
    );

    return { data: rows };
  }
}
