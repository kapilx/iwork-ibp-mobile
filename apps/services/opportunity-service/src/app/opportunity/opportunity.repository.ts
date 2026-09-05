import {
  BadRequestException,
  ConsoleLogger,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Between,
  Brackets,
  DataSource,
  EntityManager,
  EntityTarget,
  In,
  IsNull,
  Not,
  ObjectLiteral,
  Repository,
  SelectQueryBuilder,
} from "typeorm";
import {
  ACTIVITY_KEY,
  COVERS_REQUIRED_ACTIVITIES,
  MANDATORY_DOCUMENT_ACTIVITY_KEYS,
  DEFAULT_APPROVAL_REQUIRED,
  DEFAULT_PLANNING,
  ENROLLMENT_STATUS_NOT_READY,
  INSURER_PARTICIPANT_TYPE,
  MAPPED_DATA_DELETION,
  MEDIATOR_DETAILS,
  OPPORTUNITY_ACTIVITY,
  OPPORTUNITY_STATUS_WON,
  OPPORTUNITY_TYPE,
  OWNER_TYPES,
  OPPORTUNITY_TYPES,
  PARTICIPANT_TYPE,
  POLICY_CONFIGURATION_STATUS_DRAFT,
  POLICY_STATUS_MIG_ACTIVE,
  POLICY_GROUP_IIRM,
  ROLE_KEY,
  ROLES,
  TABLE_NAMES,
  TOGGLE_TYPE,
  DEFAULT_CONTACT_STATUS_ACTIVE_KEY,
  DEFAULT_CONTACT_STATUS_INACTIVE_KEY,
  SALES_OPPORTUNITY,
  DEFAULT_COMPANY_STATUS_ACTIVE,
  CREDIT_BALANCE_TRANSACTION_KEY,
  CD_ACCOUNT_STATUS_ACTIVE,
  CD_ACCOUNT_TOGGLE_NEW,
  BUSINESS_TARGET_ENTITY_TYPE,
  MONTHS_IN_YEAR_WITH_INDEX,
  MONTHS_WITH_QUARTERS_ENUM,
  COVERS_TABLE,
  RENEWAL_OPPORTUNITY,
  POLICY_STATUS_MIG_IN_ACTIVE,
  POLICY_PARTICIPANT,
  ORGANISATION,
  POLICY_STATUS_MIG_GENERATED,
  SINGLE_INSURER,
  MULTIPLE_INSURER,
  ACTIVITY_SEARCH_STATUS_KEY,
  CONSTANT_DATE,
  PREFERENCE_STATUS_PREFERRED,
  PARTICIPANT_EMPLOYEE_COMPANY_ID,
  MEETING_TYPE_KEY,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  errorMessages,
  infoMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  EntityService,
  buildOpportunityInvolvementScope,
} from "../../../../../../libs/service-lib/src/lib/utils/entity-service.utils";
import {
  addDays,
  convertUtcToIst,
  extractDateAndTime,
  getDurationDates,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import {
  getDateRange,
  financialYearLabel,
} from "../../../../service-lib/src/lib/utils/get-data-range.utils";
import {
  removeLookUpDataFields,
  removeMetadataFields,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { CompanyRepository } from "../../../../org-service/src/app/company/company.repository";
import { PolicyRepository } from "../../../../policy-service/src/app/policy/policy.repository";
import {
  ACTIVITY_APPROVAL_YES,
  FILE_UPLOAD_TABLE_DELETE_FIELDS,
  OPPORTUNITY_ACTIVITY_STATUS,
  OPPORTUNITY_MAP_TABLE_DELETE_FIELDS,
  OPPORTUNITY_STATUS_LOST,
  OPPORTUNITY_STATUS_OPEN,
  OPPORTUNITY_WON,
  OPPORTUNITY_STATUS_WORK_IN_PROGRESS,
  opportunitySearchObject,
  PLANNING_STATE,
  PRIORITY_LOOK_UP_HIGH_VALUE,
  SELECT_MEETING_EXISTING,
  serviceNames,
  TASK_CLOSED,
  ACTIVITY_STATUS,
  TASK_STATUS_CLOSED,
  TASK_TYPE,
  ACTIVITY_NAME,
  ACTIVITY_NAME_TABLE_MAP,
  RENEWAL_PLANNING_ACTIVITY_NAME,
  RO_ACTIVITY_NAME,
  PENDING_ACTIVITIES_ALL_TYPE_LABELS,
  fileSearchObject,
  DEFAULT_DATE_FILTER_FIELD,
  EXPIRY_BUFFER_DAYS,
  OPPORTUNITY_STATUS_BD_PLANNING,
  OPPORTUNITY_STATUS_ISG_PLANNING,
  ATTRIBUTE_FIELD_MAP,
  OPPORTUNITY_STATUS_DEFAULT,
  OPPORTUNITY_STATUS_CLOSE,
  OPPORTUNITY_STATUS_AUTO_CLOSE,
  LOOK_UP_FIELD,
  MS_PER_DAY,
  ORGANISATION_KEYS,
  DEFAULT_ACTIVE_STATUS,
  DEFAULT_PLACEMENT_SLIP_GENERATION,
} from "../../../../service-lib/src/lib/constants";
import { OpportunityActivityDataDto } from "../../../../service-lib/src/lib/dto/opportunity-activity.dto";
import {
  Address,
  Broker,
  BrokingSlipVersionCoverDetails,
  BrokingSlipVersionDetails,
  BusinessTarget,
  City,
  Company,
  CompanyContactMap,
  Contact,
  Employee,
  FileUpload,
  Insurer,
  InsurerParticipants,
  LookUp,
  Meeting,
  MeetingParticipantMap,
  MstrActivity,
  MstrCoverSection,
  MstrCoverTemplate,
  MstrStage,
  Note,
  Opportunity,
  OpportunityActivityMap,
  OpportunityActivityParticipants,
  OpportunityBrokingSlipActivityDocumentMap,
  OpportunityChallenges,
  OpportunityClaimExperiences,
  OpportunityCompetitors,
  OpportunityContactMap,
  OpportunityCoverMap,
  OpportunityDataValidation,
  OpportunityDataValidationDocumentMap,
  OpportunityDocuments,
  OpportunityFinalNegotiation,
  OpportunityFinalNegotiationQcrVariation,
  OpportunityFinalNegotiationQuoteCoverDetail,
  OpportunityFinalNegotiationQuoteDocuments,
  OpportunityFinalNegotiationServiceLevelAgreement,
  OpportunityFinalNegotiationSharingDetail,
  OpportunityFinalNegotiationTaxMap,
  OpportunityHandOverMeet,
  OpportunityHeldCoverNote,
  OpportunityHeldCoverNoteDocumentMap,
  OpportunityKdmMeeting,
  OpportunityLost,
  OpportunityMandateDetailsContactMap,
  OpportunityMandateDetailsDocumentMap,
  OpportunityMandateDetailsEntry,
  OpportunityPlacementSlipCDDetail,
  OpportunityPlacementSlipCoverDetail,
  OpportunityPlacementSlipDocumentMap,
  OpportunityPlacementSlipGeneration,
  OpportunityPlacementSlipInsurerMap,
  OpportunityPlacementSlipSharingDetail,
  OpportunityPlacementSlipTpaMap,
  OpportunityPolicyConfirmation,
  OpportunityPolicyConfirmationDocumentMap,
  OpportunityPolicyDocket,
  OpportunityPolicyDocketDocumentMap,
  OpportunityPolicyHardCopy,
  OpportunityPolicyHardCopyDocumentMap,
  OpportunityPremiumCalculation,
  OpportunityPremiumCalculationDocumentMap,
  OpportunityPremiumCoverDetail,
  OpportunityPreviousMediatorDetails,
  OpportunityPreviousPlacementDetails,
  OpportunityQuote,
  OpportunityQuoteComparisonReport,
  OpportunityQuoteComparisonReportDocumentMap,
  OpportunityQuoteCoverDetail,
  OpportunityQuoteDocumentMap,
  OpportunityQuoteEntry,
  OpportunityQuoteEntryDocumentMap,
  OpportunityQuoteTaxMap,
  OpportunityRfpActivityDocumentMap,
  OpportunityRfpClientContactDetail,
  OpportunityRfpClientContactInfluencers,
  OpportunityRfpCoverDetail,
  OpportunityRfpCreditSharing,
  OpportunityRfpDetail,
  OpportunityRfpDetailsEntry,
  OpportunityRfpDetailsEntryDocumentMap,
  OpportunityRfpInsurerDetail,
  OpportunityRfpTpaDetail,
  OpportunityRiskLocations,
  PolicyCdNumberMap,
  PolicyCoverMap,
  PreferredInsurerDetails,
  PreferredTpaDetails,
  Task,
  Tpa,
  User,
  CautionDeposit,
  Policy,
  PolicyInstallments,
  PolicyInsurerMap,
  TpaContact,
  InsureContact,
  OpportunityMeetingParticipantMap,
  OpportunityMeetingDocumentMap,
  OpportunityPlacementSlipInstallementDetail,
  OrgSbu,
  Organisation,
} from "../../../../service-lib/src/lib/entities";
import { OpportunityPlacementSlipInstallments } from "../../../../service-lib/src/lib/entities/opportunity-placement-slip-installments.entity";
import { OpportunityHeldCoverNoteInstallments } from "../../../../service-lib/src/lib/entities/opportunity-held-cover-note-installments.entity";
import { OpportunityPolicyConfirmationInstallments } from "../../../../service-lib/src/lib/entities/opportunity-policy-confirmation-installments.entity";
import { OpportunityPolicyHardCopyInstallments } from "../../../../service-lib/src/lib/entities/opportunity-policy-hard-copy-installments.entity";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  generateUniqueRefKey,
  EntityTypeCode,
} from "../../../../service-lib/src/lib/utils/unique-ref-key.util";
import {
  fetchActivityMeta,
  getLookup,
  getLookups,
} from "../../../../service-lib/src/lib/utils/opportunity.utils";
import { OpportunityActivityDocumentDto } from "./dto/opportunity-document.dto";
import { CreateTaskDto } from "../task/dto/create-task.dto";
import { UpdateTaskDto } from "../task/dto/update-task.dto";
import { UpdateDataValidationDto } from "./dto/create-data-validation.dto";
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
import {
  mapOpportunityState,
  OPPORTUNITY_ACTIVE_STATUS_VALUES,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { CreateInsurerParticipantDto } from "./dto/create-insurer-participants.dto";
import {
  CreateKDMMeetingDto,
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
import {
  PlacementSlipDocumentDto,
  InsurerMapDto,
} from "./dto/create-placement-slip.dto";
import { PolicyConfirmationDocumentDto } from "./dto/create-policy-confirmation.dto";
import { PolicyHardCopyDocumentDto } from "./dto/create-policy-hard-copy.dto";
import { CreateQuoteDto } from "./dto/create-quote-entry.dto";
import {
  BrokingSlipDataDto,
  BrokingSlipDocumentsDto,
  BrokingSlipVersionDetailsDto,
  BrokingSlipVersionMappedCoverDto,
  MappedVersionDetails,
  PreferredInsurerDetailsDto,
  PreferredTpaDetailsDto,
  VersionDetails,
} from "./dto/get-broking-slip-details-by-version.dto";
import {
  AllPreferredDataMap,
  BrokingSlipVersionsListDto,
  PreferredInsurerDetail,
  PreferredTpaDetail,
} from "./dto/get-broking-slip-version.dto";
import { OpportunityChallengeDto } from "./dto/opportunity-challenges.dto";
import { OpportunityClaimExperienceDto } from "./dto/opportunity-claim-experience.dto";
import { OpportunityCompetitorDto } from "./dto/opportunity-competitor.dto";
import { OpportunityContactMapDto } from "./dto/opportunity-contact-map.dto";
import { OpportunityCoverDto } from "./dto/opportunity-cover.dto";
import { OpportunityDocumentDto } from "./dto/opportunity-document.dto";
import { OpportunityPreviousMediatorDetailsDto } from "./dto/opportunity-previous-mediator-details.dto";
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
import { OpportunityDataDto, OpportunityDto } from "./dto/opportunity.dto";
import { UpdateOpportunityDto } from "./dto/update-opportunity.dto";
import { UpdatePolicyConfirmationDto } from "./dto/update-policy-confirmation.dto";
import { UpdateQuoteComparisonReportDto } from "./dto/create-quote-comparison-report.dto";
import {
  ActivityNameData,
  StageNameData,
  StageOwnerResponseDto,
} from "./dto/update-stage-owner.dto";

export interface ActivityBrokerageSummary {
  activityName: string;
  estimatedBrokerage: number;
}

export interface MeetingParticipants {
  tpaParticipants?: { tpaId: number; tpaContactPerson: number[] };
  insurerParticipants?: {
    insurerId: number;
    insurerContactPerson: number[];
  };
  companyParticipants?: {
    companyId: number;
    companyContactPerson: number[];
  };
  employeeParticipants?: { employees: number[] };
}

export interface Participant {
  participantId: number;
  participantCompanyId: number;
  participantRecordType: string;
}

export interface OpportunityActivityDto {
  id: number;
  companyId: number;
  opportunityId: number;
  activityId: number;
  plannedDate: Date;
  opportunityTable: string;
  activityName: string;
  activityKey: string;
  leadDays: number;
  statusLid: number;
  activityStatusKey: string;
}

export interface InsurerDetails {
  insurerId: number;
  insurerLocationId?: number;
  insurerBranchId?: number;
  insurerContactId?: number;
  isLeadInsurer?: number;
  sharePercentage?: number;
  shareAmount?: number;
  brokeragePercentage?: number;
  brokerageAmount?: number;
  terrorismSharePercentage?: number;
  terrorismShareAmount?: number;
  terrorismBrokeragePercentage?: number;
  terrorismBrokerageAmount?: number;
  totalBrokerageAmount?: number;
}

type PendingPresentationFilters = {
  isPendingActivity?: boolean;
  activityNames?: string[];
  stageNames?: string[];
  dateRange?: { from?: Date; to?: Date };
  tables?: string[];
};

type PendingActivityFilterOptions = {
  tables: string[];
  activityNames?: string[];
  stageNames?: string[];
  dateRange?: { from?: Date; to?: Date };
  selection?: "opportunity" | "full";
  enforceSequence?: boolean;
  roleKeys?: string[] | null;
};

type SearchArrayEntry = {
  searchBy: string;
  searchValue: string | number | Date | Array<string | number | Date>;
};

const buildPendingSearchFieldVariants = (field?: string): string[] => {
  if (!field) {
    return [];
  }

  const trimmed = field.trim();

  if (!trimmed) {
    return [];
  }

  const lower = trimmed.toLowerCase();
  const snake = trimmed.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

  return Array.from(new Set([lower, snake]));
};

const PENDING_ACTIVITY_SEARCH_FIELDS = new Set<string>([
  ...buildPendingSearchFieldVariants(ATTRIBUTE_FIELD_MAP.activityName),
  ...buildPendingSearchFieldVariants(ATTRIBUTE_FIELD_MAP.stageName),
  ...buildPendingSearchFieldVariants(ACTIVITY_SEARCH_STATUS_KEY),
  ...buildPendingSearchFieldVariants(
    ACTIVITY_SEARCH_STATUS_KEY?.replace(/status_lid/i, "statusLid")
  ),
]);

// Date-typed (no time component) columns on the opportunity listing. For these
// the `to` bound must be compared as a plain date — appending an end-of-day
// timestamp shifts the range into the next day under +ve DB timezones (IST).
const DATE_ONLY_FILTER_FIELDS = new Set<string>(["expiryDate"]);

// The status values the ORG SCOPE SUMMARY aggregates count — Active only.
// "Active" is not itself a stored status value: mapOpportunityState expands
// that LOV option into the underlying status values below BEFORE a listing
// query runs, so an aggregate matching the same set has to expand it the same
// way (matching the literal string "Active" finds almost nothing).
//
// Lost was deliberately dropped here on 2026-08-25 (Pushyami's call): the org
// cards report live pipeline only. The Enhanced listing/KPI default is still
// Active + Lost (withActiveLostStatusDefault), so the cards intentionally read
// LOWER than the table below them by exactly the Lost records — that is not a
// mismatch to "fix" by re-adding Lost here.
const SCOPE_SUMMARY_STATUS_VALUES = [...OPPORTUNITY_ACTIVE_STATUS_VALUES];

export const PENDING_ACTIVITY_TABLES = [
  OPPORTUNITY_ACTIVITY.DATA_VALIDATION,
  OPPORTUNITY_ACTIVITY.KDM_MEETING,
  OPPORTUNITY_ACTIVITY.MANDATE_DETAILS_ENTRY,
  OPPORTUNITY_ACTIVITY.RFP_COVER_DETAIL,
  OPPORTUNITY_ACTIVITY.RFP_DETAILS_ENTRY,
  OPPORTUNITY_ACTIVITY.BROKING_SLIP,
  OPPORTUNITY_ACTIVITY.QUOTE_ENTRY,
  OPPORTUNITY_ACTIVITY.QUOTE_COMPARISON_REPORT,
  OPPORTUNITY_ACTIVITY.FINAL_NEGOTIATION,
  OPPORTUNITY_ACTIVITY.PLACEMENT_SLIP,
  OPPORTUNITY_ACTIVITY.PREMIUM_CALCULATION,
  OPPORTUNITY_ACTIVITY.HELD_COVER_NOTE,
  OPPORTUNITY_ACTIVITY.POLICY_HARD_COPY,
  OPPORTUNITY_ACTIVITY.POLICY_DOCKET,
  OPPORTUNITY_ACTIVITY.HAND_OVER_MEET,
  OPPORTUNITY_ACTIVITY.POLICY_CONFIRMATION,
] as const;

/** One per-company aggregate row of the SO/RO Enhanced companies table. */
type CompanyGrainRow = {
  companyId: number;
  companyName: string;
  totalRos: number;
  premium: number;
  brokerage: number;
};

/**
 * Grid column ids the companies table can sort on. The aggregate is built in
 * memory with exactly these keys, so the grid's column ids map 1:1 — no entity
 * field translation is involved (unlike the paged opportunity rows, which go
 * through mapSortParams). The Actions column has no key and is never sent.
 */
const COMPANY_GRAIN_SORT_KEYS = [
  "companyName",
  "totalRos",
  "premium",
  "brokerage",
] as const;

/**
 * Builds the comparator for the company aggregate from a raw
 * "<column>:<ASC|DESC>" grid sort. Unknown or unsortable columns fall back to
 * the historical company-name ascending order. companyId always breaks ties so
 * the in-memory slice used for pagination is deterministic.
 */
const resolveCompanyGrainComparator = (
  sort?: string
): ((a: CompanyGrainRow, b: CompanyGrainRow) => number) => {
  const byName = (a: CompanyGrainRow, b: CompanyGrainRow) =>
    a.companyName.localeCompare(b.companyName) || a.companyId - b.companyId;

  const [rawColumn, rawDirection] = (sort ?? "").split(",")[0].split(":");
  const column = (rawColumn ?? "").trim();
  if (!(COMPANY_GRAIN_SORT_KEYS as readonly string[]).includes(column)) {
    return byName;
  }
  const factor =
    (rawDirection ?? "").trim().toUpperCase() === "DESC" ? -1 : 1;

  if (column === "companyName") {
    return (a, b) =>
      factor * a.companyName.localeCompare(b.companyName) ||
      a.companyId - b.companyId;
  }
  const key = column as "totalRos" | "premium" | "brokerage";
  return (a, b) => factor * (a[key] - b[key]) || a.companyId - b.companyId;
};

const normalizeAliasValue = (value?: string | null): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
};

const buildAliasMap = (
  entries: Array<Array<string | null | undefined>>
): Map<string, Set<string>> => {
  const map = new Map<string, Set<string>>();

  const registerGroup = (group: Array<string | null | undefined>) => {
    const normalizedValues = group
      .map((raw) => normalizeAliasValue(raw))
      .filter((value): value is string => value.length > 0);

    if (!normalizedValues.length) {
      return;
    }

    const variants = new Set(normalizedValues);

    normalizedValues.forEach((normalized) => {
      const key = normalized.toLowerCase();
      const existing = map.get(key) ?? new Set<string>();
      variants.forEach((value) => existing.add(value));
      map.set(key, existing);
    });
  };

  entries.forEach(registerGroup);

  return map;
};

@Injectable()
export class OpportunityRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Opportunity)
    private readonly opportunityRepository: Repository<Opportunity>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>,
    @InjectRepository(Meeting)
    private readonly meetingRepository: Repository<Meeting>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(OpportunityActivityMap)
    private readonly opportunityActivityMapRepository: Repository<OpportunityActivityMap>,
    @InjectRepository(OpportunityActivityParticipants)
    private readonly opportunityActivityParticipantsRepository: Repository<OpportunityActivityParticipants>,
    @InjectRepository(OpportunityDataValidation)
    private readonly dataValidationRepository: Repository<OpportunityDataValidation>,
    @InjectRepository(OpportunityKdmMeeting)
    private readonly kdmMeetingRepository: Repository<OpportunityKdmMeeting>,
    @InjectRepository(OpportunityHandOverMeet)
    private readonly handOverMeetRepository: Repository<OpportunityHandOverMeet>,
    @InjectRepository(MstrActivity)
    private readonly activityRepository: Repository<MstrActivity>,
    @InjectRepository(MstrStage)
    private readonly stageRepository: Repository<MstrStage>,
    @InjectRepository(OpportunityMandateDetailsEntry)
    private readonly mandateDetailsEntryRepository: Repository<OpportunityMandateDetailsEntry>,
    @InjectRepository(OpportunityRfpCoverDetail)
    private readonly rfpCoverDetailRepository: Repository<OpportunityRfpCoverDetail>,
    @InjectRepository(OpportunityQuoteEntry)
    private readonly quoteRepo: Repository<OpportunityQuoteEntry>,
    @InjectRepository(OpportunityQuote)
    private readonly opportunityQuoteRepo: Repository<OpportunityQuote>,
    @InjectRepository(OpportunityQuoteEntryDocumentMap)
    private readonly quoteEntryDocumentMapRepo: Repository<OpportunityQuoteEntryDocumentMap>,
    @InjectRepository(OpportunityQuoteTaxMap)
    private readonly quoteTaxRepo: Repository<OpportunityQuoteTaxMap>,
    @InjectRepository(OpportunityQuoteDocumentMap)
    private readonly quoteDocRepo: Repository<OpportunityQuoteDocumentMap>,
    @InjectRepository(OpportunityPlacementSlipGeneration)
    private readonly placementRepo: Repository<OpportunityPlacementSlipGeneration>,
    @InjectRepository(OpportunityPlacementSlipTpaMap)
    private readonly tpaRepo: Repository<OpportunityPlacementSlipTpaMap>,
    @InjectRepository(OpportunityPlacementSlipInstallments)
    private readonly installmentsRepo: Repository<OpportunityPlacementSlipInstallments>,
    @InjectRepository(OpportunityPlacementSlipInsurerMap)
    private readonly insurerRepo: Repository<OpportunityPlacementSlipInsurerMap>,
    @InjectRepository(OpportunityPlacementSlipSharingDetail)
    private readonly sharingRepo: Repository<OpportunityPlacementSlipSharingDetail>,
    @InjectRepository(OpportunityPlacementSlipCDDetail)
    private readonly cdRepo: Repository<OpportunityPlacementSlipCDDetail>,
    @InjectRepository(OpportunityPlacementSlipCoverDetail)
    private readonly coverRepo: Repository<OpportunityPlacementSlipCoverDetail>,
    @InjectRepository(OpportunityRfpDetailsEntry)
    private readonly opportunityRfpDetailsEntryRepository: Repository<OpportunityRfpDetailsEntry>,
    @InjectRepository(City)
    private readonly cityRepository: Repository<City>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    @InjectRepository(Insurer)
    private readonly insurerRepository: Repository<Insurer>,
    @InjectRepository(Tpa)
    private readonly tpaRepository: Repository<Tpa>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(BusinessTarget)
    private readonly businessTargetRepository: Repository<BusinessTarget>,

    private readonly entityService: EntityService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService,
    private readonly policyRepo: PolicyRepository,
    private readonly companyRepository: CompanyRepository
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
        location: "OpportunityRepository",
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
        location: "OpportunityRepository",
        method,
        payload,
        messageData: error,
      }),
    });
  }

  private sanitizePendingActivitySearchArray(
    searchArray: SearchArrayEntry[] | undefined,
    pendingPresentationFilters?: PendingPresentationFilters
  ): SearchArrayEntry[] | undefined {
    if (
      !pendingPresentationFilters?.isPendingActivity ||
      !Array.isArray(searchArray)
    ) {
      return searchArray;
    }

    return searchArray.filter(({ searchBy }) => {
      if (typeof searchBy !== "string") {
        return true;
      }

      const trimmed = searchBy.trim();

      if (!trimmed) {
        return false;
      }

      const lower = trimmed.toLowerCase();
      const snake = trimmed.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();

      return (
        !PENDING_ACTIVITY_SEARCH_FIELDS.has(lower) &&
        !PENDING_ACTIVITY_SEARCH_FIELDS.has(snake)
      );
    });
  }

  // Retrieves the activity name which is in "Work in Progress" state.
  async getWorkInProgressActivityNameByOpportunityId(
    opportunityId: number,
    visibleActivityRoleKeys?: string[] | null,
    opportunityTypeKey?: string
  ): Promise<any> {
    let activity: any;
    // Optional role filter so single-role users (BD-only / ISG-only) see only
    // their role's activities as the display activity. Null => no restriction.
    const roleKeyFilter =
      visibleActivityRoleKeys && visibleActivityRoleKeys.length > 0
        ? { roleKey: In(visibleActivityRoleKeys) }
        : {};
    const workInProgressStatus = await this.lookUpRepository.findOne({
      where: { lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS },
    });
    if (!workInProgressStatus) {
      throw new NotFoundException(
        `Lookup with key ${OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS} not found`
      );
    }
    activity = await this.opportunityActivityMapRepository.findOne({
      where: {
        opportunityId,
        statusLid: workInProgressStatus.id,
        ...roleKeyFilter,
      },
      order: { activityOrder: "ASC" },
      select: ["activityName", "stageName"],
    });

    const opportunityStatus = await this.opportunityRepository.findOne({
      where: { opportunityId },
      relations: ["status"],
      select: {
        opportunityId: true,
        status: {
          id: true,
          lookUpKey: true,
          lookUpValue: true,
        },
      },
    });
    if (!opportunityStatus) {
      throw new NotFoundException(
        `Opportunity with ID ${opportunityId} not found`
      );
    }
    const fallbackStatusValue = opportunityStatus.status?.lookUpValue ?? null;

    if (
      opportunityStatus.status?.lookUpKey === OPPORTUNITY_STATUS_WON &&
      (!visibleActivityRoleKeys ||
        visibleActivityRoleKeys.length === 0 ||
        visibleActivityRoleKeys.includes(ROLE_KEY.ROLE_ISG_EXECUTIVE))
    ) {
      return {
        activityName: OPPORTUNITY_WON,
        stageName: OPPORTUNITY_WON,
        roleKey: ROLE_KEY.ROLE_ISG_EXECUTIVE,
      };
    }

    if (!activity) {
      const submittedStatus = await this.lookUpRepository.findOne({
        where: { lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED },
      });
      if (!submittedStatus) {
        throw new NotFoundException(
          `Lookup with key ${OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED} not found`
        );
      }
      activity = await this.opportunityActivityMapRepository.findOne({
        where: {
          opportunityId,
          statusLid: submittedStatus.id,
          ...roleKeyFilter,
        },
        order: { activityOrder: "ASC" },
        select: ["activityName", "stageName", "roleKey"],
      });
    }
    if (!activity) {
      const rejectedStatus = await this.lookUpRepository.findOne({
        where: { lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.REJECTED },
      });
      if (!rejectedStatus) {
        throw new NotFoundException(
          `Lookup with key ${OPPORTUNITY_ACTIVITY_STATUS.REJECTED} not found`
        );
      }
      activity = await this.opportunityActivityMapRepository.findOne({
        where: {
          opportunityId,
          statusLid: rejectedStatus.id,
          ...roleKeyFilter,
        },
        order: { activityOrder: "ASC" },
        select: ["activityName", "stageName", "roleKey"],
      });
    }
    // "Opportunity Won" is an ISG-stage outcome. Only users who can view ISG
    // (unrestricted, or ISG-scoped) should see it. A BD-only viewer
    // (visibleActivityRoleKeys is set and excludes ROLE_ISG_EXECUTIVE) must never
    // see "Won" — they fall through to their latest BD activity below.
    const canShowIsgOutcome =
      !visibleActivityRoleKeys ||
      visibleActivityRoleKeys.length === 0 ||
      visibleActivityRoleKeys.includes(ROLE_KEY.ROLE_ISG_EXECUTIVE);
    if (!activity && canShowIsgOutcome) {
      const wonStatus = await this.lookUpRepository.find({
        where: {
          lookUpKey: In([
            OPPORTUNITY_ACTIVITY_STATUS.CLOSED,
            OPPORTUNITY_ACTIVITY_STATUS.APPROVED,
          ]),
        },
      });
      if (!wonStatus || wonStatus.length === 0) {
        throw new NotFoundException(
          `Lookup with keys ${OPPORTUNITY_ACTIVITY_STATUS.CLOSED} and ${OPPORTUNITY_ACTIVITY_STATUS.APPROVED} not found`
        );
      }
      const wonStatusIds = wonStatus.map((status) => status.id);
      const opportunityWonData =
        await this.opportunityActivityMapRepository.findOne({
          where: { opportunityId },
          order: { activityOrder: "DESC" },
          select: ["activityName", "stageName", "statusLid"],
        });
      if (
        opportunityWonData &&
        wonStatusIds.includes(opportunityWonData.statusLid)
      ) {
        return {
          activityName: OPPORTUNITY_WON,
          stageName: OPPORTUNITY_WON,
          roleKey: ROLE_KEY.ROLE_ISG_EXECUTIVE,
        };
      }
    }
    // BD-only viewer with no in-progress/submitted/rejected BD activity: show the
    // latest BD activity actually reached (e.g. RFP Details Entry), never an ISG
    // outcome. "Reached" means completed — restrict to completedAt IS NOT NULL so
    // a freshly created SO (all activities still Open) does not surface the
    // highest-order activity. With no completed activity this stays null and
    // falls through to the planning fallback below (BD Planning), matching the
    // detail page's stage logic.
    if (!activity && !canShowIsgOutcome) {
      activity = await this.opportunityActivityMapRepository.findOne({
        where: {
          opportunityId,
          completedAt: Not(IsNull()),
          ...roleKeyFilter,
        },
        order: { activityOrder: "DESC" },
        select: ["activityName", "stageName", "roleKey"],
      });
    }
    if (activity) {
      return {
        activityName: activity.activityName,
        stageName: activity.stageName,
        roleKey: activity.roleKey ?? null,
      };
    }

    return this.computeFallbackDisplayActivity(
      fallbackStatusValue,
      opportunityTypeKey
    );
  }

  // Extracted verbatim from the tail of getWorkInProgressActivityNameByOpportunityId
  // so the batched path (transformOpportunityData) can compute the same
  // fallback for opportunities the batched cascade left unresolved, without
  // duplicating this logic. Pure -- no DB access.
  private computeFallbackDisplayActivity(
    fallbackStatusValue: string | null,
    opportunityTypeKey?: string
  ): { activityName: string; stageName: string; roleKey: string } {
    let fallbackName = fallbackStatusValue || PLANNING_STATE;

    const isRO = opportunityTypeKey === RENEWAL_OPPORTUNITY;

    if (fallbackName === ACTIVITY_NAME.BD_PLANNING && isRO) {
      fallbackName = RENEWAL_PLANNING_ACTIVITY_NAME;
    } else if (
      fallbackName !== RENEWAL_PLANNING_ACTIVITY_NAME &&
      fallbackName !== ACTIVITY_NAME.ISG_PLANNING
    ) {
      fallbackName = isRO ? RENEWAL_PLANNING_ACTIVITY_NAME : ACTIVITY_NAME.BD_PLANNING;
    }

    const fallbackRoleKey =
      fallbackName === ACTIVITY_NAME.ISG_PLANNING
        ? ROLE_KEY.ROLE_ISG_EXECUTIVE
        : ROLE_KEY.ROLE_BD_EXECUTIVE;

    return { activityName: fallbackName, stageName: fallbackName, roleKey: fallbackRoleKey };
  }

  // Batched equivalent of getWorkInProgressActivityNameByOpportunityId's
  // work-in-progress/submitted/rejected/won-or-completed cascade, for the
  // bulk export/listing path. Confirmed via pg_stat_statements that calling
  // the per-row version ~8,500 times (2-4 sequential awaits each) added
  // seconds of round-trip/connection-pool overhead invisible to individual
  // query execution time. `canShowIsgOutcome`/the role filter are constant
  // for the whole batch (both derive from visibleActivityRoleKeys, which is
  // the same value for every row in one export), which is what makes this
  // safe to batch instead of resolve per row. Returns only opportunities
  // that matched a real activity at some tier -- callers still need to
  // compute the final fallback name themselves (it also depends on
  // opportunityTypeKey, which DOES vary per row) for any id absent here.
  private async getWorkInProgressActivitiesForOpportunities(
    opportunityIds: number[],
    visibleActivityRoleKeys: string[] | null | undefined,
    preResolved: {
      workInProgressStatusId: number;
      submittedStatusId: number;
      rejectedStatusId: number;
      wonStatusIds: number[];
    }
  ): Promise<
    Map<number, { activityName: string; stageName: string; roleKey: string | null }>
  > {
    const result = new Map<
      number,
      { activityName: string; stageName: string; roleKey: string | null }
    >();
    if (opportunityIds.length === 0) {
      return result;
    }
    const roleKeyFilter =
      visibleActivityRoleKeys && visibleActivityRoleKeys.length > 0
        ? visibleActivityRoleKeys
        : null;
    const canShowIsgOutcome =
      !visibleActivityRoleKeys ||
      visibleActivityRoleKeys.length === 0 ||
      visibleActivityRoleKeys.includes(ROLE_KEY.ROLE_ISG_EXECUTIVE);

    if (canShowIsgOutcome) {
      const wonOpportunities = await this.opportunityRepository.find({
        where: {
          opportunityId: In(opportunityIds),
          status: { lookUpKey: OPPORTUNITY_STATUS_WON },
        },
        select: ["opportunityId"],
      });
      for (const won of wonOpportunities) {
        result.set(won.opportunityId, {
          activityName: OPPORTUNITY_WON,
          stageName: OPPORTUNITY_WON,
          roleKey: ROLE_KEY.ROLE_ISG_EXECUTIVE,
        });
      }
    }

    // Top-1-per-opportunity via DISTINCT ON, same shape as the reference
    // buildBrokerMediatorSource fix -- avoids a correlated/per-row lookup
    // entirely by ranking within one query for every id at once.
    const fetchTopOnePerOpportunity = async (
      ids: number[],
      order: "ASC" | "DESC",
      configure: (qb: SelectQueryBuilder<OpportunityActivityMap>) => void
    ): Promise<OpportunityActivityMap[]> => {
      if (ids.length === 0) {
        return [];
      }
      const qb = this.opportunityActivityMapRepository
        .createQueryBuilder("oam")
        .distinctOn(["oam.opportunityId"])
        .where("oam.opportunityId IN (:...ids)", { ids });
      configure(qb);
      qb.orderBy("oam.opportunityId", "ASC").addOrderBy(
        "oam.activityOrder",
        order
      );
      return qb.getMany();
    };

    let remainingIds = opportunityIds.filter((id) => !result.has(id));

    const workInProgressRows = await fetchTopOnePerOpportunity(
      remainingIds,
      "ASC",
      (qb) => {
        qb.andWhere("oam.statusLid = :statusLid", {
          statusLid: preResolved.workInProgressStatusId,
        });
        if (roleKeyFilter) {
          qb.andWhere("oam.roleKey IN (:...roleKeys)", {
            roleKeys: roleKeyFilter,
          });
        }
      }
    );
    for (const row of workInProgressRows) {
      result.set(row.opportunityId, {
        activityName: row.activityName,
        stageName: row.stageName,
        roleKey: null,
      });
    }
    remainingIds = remainingIds.filter((id) => !result.has(id));

    if (remainingIds.length > 0) {
      const submittedRows = await fetchTopOnePerOpportunity(
        remainingIds,
        "ASC",
        (qb) => {
          qb.andWhere("oam.statusLid = :statusLid", {
            statusLid: preResolved.submittedStatusId,
          });
          if (roleKeyFilter) {
            qb.andWhere("oam.roleKey IN (:...roleKeys)", {
              roleKeys: roleKeyFilter,
            });
          }
        }
      );
      for (const row of submittedRows) {
        result.set(row.opportunityId, {
          activityName: row.activityName,
          stageName: row.stageName,
          roleKey: row.roleKey ?? null,
        });
      }
      remainingIds = remainingIds.filter((id) => !result.has(id));
    }

    if (remainingIds.length > 0) {
      const rejectedRows = await fetchTopOnePerOpportunity(
        remainingIds,
        "ASC",
        (qb) => {
          qb.andWhere("oam.statusLid = :statusLid", {
            statusLid: preResolved.rejectedStatusId,
          });
          if (roleKeyFilter) {
            qb.andWhere("oam.roleKey IN (:...roleKeys)", {
              roleKeys: roleKeyFilter,
            });
          }
        }
      );
      for (const row of rejectedRows) {
        result.set(row.opportunityId, {
          activityName: row.activityName,
          stageName: row.stageName,
          roleKey: row.roleKey ?? null,
        });
      }
      remainingIds = remainingIds.filter((id) => !result.has(id));
    }

    if (remainingIds.length > 0 && canShowIsgOutcome) {
      // Mirrors the original: no statusLid filter in the query itself --
      // fetch the latest activity by activityOrder DESC regardless of
      // status, then check in JS whether ITS statusLid is a won status.
      const latestRows = await fetchTopOnePerOpportunity(
        remainingIds,
        "DESC",
        () => {
          // No extra filter -- same as the original findOne with no
          // statusLid/roleKey condition for this tier.
        }
      );
      for (const row of latestRows) {
        if (preResolved.wonStatusIds.includes(row.statusLid)) {
          result.set(row.opportunityId, {
            activityName: OPPORTUNITY_WON,
            stageName: OPPORTUNITY_WON,
            roleKey: ROLE_KEY.ROLE_ISG_EXECUTIVE,
          });
        }
      }
    } else if (remainingIds.length > 0 && !canShowIsgOutcome) {
      const completedRows = await fetchTopOnePerOpportunity(
        remainingIds,
        "DESC",
        (qb) => {
          qb.andWhere("oam.completedAt IS NOT NULL");
          if (roleKeyFilter) {
            qb.andWhere("oam.roleKey IN (:...roleKeys)", {
              roleKeys: roleKeyFilter,
            });
          }
        }
      );
      for (const row of completedRows) {
        result.set(row.opportunityId, {
          activityName: row.activityName,
          stageName: row.stageName,
          roleKey: row.roleKey ?? null,
        });
      }
    }

    return result;
  }

  private async getPendingActivityDetailsForDisplay(
    opportunityId: number,
    filters?: PendingPresentationFilters,
    visibleActivityRoleKeys?: string[] | null
  ): Promise<Pick<
    OpportunityActivityMap,
    "activityName" | "stageName" | "roleKey"
  > | null> {
    if (!filters?.isPendingActivity) {
      return null;
    }

    const tablesToUse =
      Array.isArray(filters.tables) && filters.tables.length > 0
        ? filters.tables
        : Array.from(PENDING_ACTIVITY_TABLES);

    const pendingSubquery = this.createPendingActivityFilterSubquery({
      tables: tablesToUse,
      activityNames: filters.activityNames,
      stageNames: filters.stageNames,
      dateRange: filters.dateRange,
      selection: "full",
      roleKeys: visibleActivityRoleKeys,
    });

    pendingSubquery.andWhere(
      "pending_ranked.opportunity_id = :pendingDisplayOpportunityId",
      {
        pendingDisplayOpportunityId: opportunityId,
      }
    );

    const pendingRecord = await pendingSubquery.getRawOne<{
      activity_name: string | null;
      stage_name: string | null;
      role_key: string | null;
    }>();

    if (pendingRecord) {
      return {
        activityName: pendingRecord.activity_name ?? null,
        stageName: pendingRecord.stage_name ?? null,
        roleKey: pendingRecord.role_key ?? null,
      };
    }

    return null;
  }

  createPendingActivityFilterSubquery({
    tables,
    activityNames,
    stageNames,
    dateRange,
    selection = "opportunity",
    enforceSequence = true,
    roleKeys,
  }: PendingActivityFilterOptions): SelectQueryBuilder<OpportunityActivityMap> {
    const baseReferenceExpression =
      "COALESCE(pendingFilter.plannedAt, pendingFilter.createdAt)";
    const shouldSelectFullDetails = selection === "full";
    const baseQuery = this.opportunityActivityMapRepository
      .createQueryBuilder("pendingFilter")
      .select("pendingFilter.opportunityId", "opportunity_id")
      .addSelect(
        `ROW_NUMBER() OVER (PARTITION BY pendingFilter.opportunityId ORDER BY pendingFilter.activityOrder ASC, ${baseReferenceExpression} ASC, pendingFilter.id ASC)`,
        "pending_rank"
      )
      .where("pendingFilter.completedAt IS NULL")
      .andWhere("pendingFilter.plannedAt IS NOT NULL")
      .andWhere("pendingFilter.opportunityTable IN (:...pendingTables)", {
        pendingTables: tables,
      });

    // Role-aware display activity: restrict to the viewer's role(s) before ranking
    // so rank=1 is the first pending activity the viewer is allowed to see.
    if (roleKeys && roleKeys.length > 0) {
      baseQuery.andWhere("pendingFilter.roleKey IN (:...pendingRoleKeys)", {
        pendingRoleKeys: roleKeys,
      });
    }

    if (enforceSequence) {
      baseQuery.andWhere(
        new Brackets((qb) => {
          qb.where("pendingFilter.activityOrder = 1");
          qb.orWhere(
            `EXISTS (
              SELECT 1
              FROM opportunity_activity_map previousActivity
              WHERE previousActivity.opportunity_id = "pendingFilter"."opportunity_id"
                AND previousActivity.activity_order = "pendingFilter"."activity_order" - 1
                AND previousActivity.completed_at IS NOT NULL
            )`
          );
        })
      );
    }

    if (shouldSelectFullDetails) {
      baseQuery
        .addSelect("pendingFilter.id", "activity_id")
        .addSelect("pendingFilter.opportunityTable", "opportunity_table")
        .addSelect("pendingFilter.activityName", "activity_name")
        .addSelect("pendingFilter.stageName", "stage_name")
        .addSelect("pendingFilter.activityOrder", "activity_order")
        .addSelect("pendingFilter.ownerId", "owner_id")
        .addSelect("pendingFilter.roleKey", "role_key")
        .addSelect("pendingFilter.plannedAt", "planned_at")
        .addSelect("pendingFilter.createdAt", "created_at");
    }

    if (activityNames?.length) {
      const activityConditions: string[] = [];
      activityNames.forEach((activityName, index) => {
        const paramKey = `pendingFilterActivityName${index}`;
        activityConditions.push(
          `TRIM(pendingFilter.activityName) ILIKE :${paramKey}`
        );
        baseQuery.setParameter(paramKey, activityName);
      });

      if (activityConditions.length > 0) {
        baseQuery.andWhere(`(${activityConditions.join(" OR ")})`);
      }
    }

    if (stageNames?.length) {
      const stageConditions: string[] = [];
      stageNames.forEach((stageName, index) => {
        const paramKey = `pendingFilterStageName${index}`;
        stageConditions.push(
          `TRIM(pendingFilter.stageName) ILIKE :${paramKey}`
        );
        baseQuery.setParameter(paramKey, stageName);
      });

      if (stageConditions.length > 0) {
        baseQuery.andWhere(`(${stageConditions.join(" OR ")})`);
      }
    }

    if (dateRange?.from && dateRange?.to) {
      baseQuery.andWhere(
        `${baseReferenceExpression} BETWEEN :pendingFilterFrom AND :pendingFilterTo`,
        {
          pendingFilterFrom: dateRange.from,
          pendingFilterTo: dateRange.to,
        }
      );
    } else if (dateRange?.from) {
      baseQuery.andWhere(`${baseReferenceExpression} >= :pendingFilterFrom`, {
        pendingFilterFrom: dateRange.from,
      });
    } else if (dateRange?.to) {
      baseQuery.andWhere(`${baseReferenceExpression} <= :pendingFilterTo`, {
        pendingFilterTo: dateRange.to,
      });
    }

    const rankedQuery = this.dataSource
      .createQueryBuilder()
      .select("pending_ranked.opportunity_id", "opportunity_id")
      .from(`(${baseQuery.getQuery()})`, "pending_ranked")
      .setParameters(baseQuery.getParameters())
      .where("pending_ranked.pending_rank = 1");

    if (shouldSelectFullDetails) {
      rankedQuery
        .addSelect("pending_ranked.activity_id", "activity_id")
        .addSelect("pending_ranked.opportunity_table", "opportunity_table")
        .addSelect("pending_ranked.activity_name", "activity_name")
        .addSelect("pending_ranked.stage_name", "stage_name")
        .addSelect("pending_ranked.activity_order", "activity_order")
        .addSelect("pending_ranked.owner_id", "owner_id")
        .addSelect("pending_ranked.planned_at", "planned_at")
        .addSelect("pending_ranked.created_at", "created_at");
    }

    return rankedQuery;
  }

  async getPendingActivityAliasMap(): Promise<Map<string, Set<string>>> {
    const activities = await this.activityRepository.find({
      where: {
        opportunityTable: In(Array.from(PENDING_ACTIVITY_TABLES)),
      },
      select: ["name", "roName"],
    });

    return buildAliasMap(activities.map(({ name, roName }) => [name, roName]));
  }

  async getStageNameAliasMap(): Promise<Map<string, Set<string>>> {
    const stages = await this.stageRepository.find({
      select: ["name", "roName"],
    });

    return buildAliasMap(stages.map(({ name, roName }) => [name, roName]));
  }

  // Retrieves a list of opportunities with filtering, sorting, and pagination.
  async getAllOpportunities(
    // Omit both to fetch every matching row unpaginated (full exports) —
    // every listing call site passes concrete numbers, so this is additive.
    page: number | undefined,
    limit: number | undefined,
    searchArray: SearchArrayEntry[],
    sort: { field: string; order: "ASC" | "DESC" }[],
    searchBy: string,
    userId: number,
    whereCondition: Record<string, any>,
    relations: string[],
    customWhereCondition?: Brackets,
    field?: string,
    fromDate?: Date,
    toDate?: Date,
    period?: string,
    timeFilter?: string,
    financialYear?: number,
    debugOptions?: {
      logQuery?: boolean;
    },
    pendingPresentationFilters?: PendingPresentationFilters,
    funnel?: boolean = false,
    visibleActivityRoleKeys?: string[] | null,
    // Company-grain mode (SO/RO Enhanced companies table): instead of the
    // paged opportunity rows, return per-company aggregates of EXACTLY the
    // opportunity set this listing query matches — same search filters,
    // visibility scope, and stage gate, so companies/records always reconcile.
    companyGrain?: boolean,
    // Callers that only want `data` (exports) can skip the KPI block below:
    // a second full validateOpportunityScope call — real cost for values
    // the live listing UI needs but an export never reads.
    skipKpi = false,
    companyGrainSort?: string
  ): Promise<{
    data: OpportunityDto[];
    count: number;
    opportunityLeads: number;
    opportunityProspects: number;
    opportunityQcr: number;
    opportunityClients: number;
  }> {
    try {
      const trimmedTimeFilter =
        typeof timeFilter === "string" ? timeFilter.trim() : undefined;
      const effectiveTimeFilter =
        trimmedTimeFilter && trimmedTimeFilter.length > 0
          ? trimmedTimeFilter
          : undefined;
      const effectiveFinancialYear =
        typeof financialYear === "number" && !Number.isNaN(financialYear)
          ? financialYear
          : undefined;
      let periodStartAndEndDate;

      if (effectiveTimeFilter) {
        const range = getDateRange(effectiveTimeFilter, effectiveFinancialYear);
        if (range.start && range.end) {
          periodStartAndEndDate = {
            field: field ?? "expiryDate",
            from: range.start.toISOString().split("T")[0],
            to: range.end.toISOString().split("T")[0],
          };
        }
      } else if (effectiveFinancialYear !== undefined) {
        const range = getDateRange(undefined, effectiveFinancialYear);
        if (range.start && range.end) {
          periodStartAndEndDate = {
            field: field ?? "expiryDate",
            from: range.start.toISOString().split("T")[0],
            to: range.end.toISOString().split("T")[0],
          };
        }
      } else if (period) {
        try {
          const fromToDate = getDurationDates(period);
          periodStartAndEndDate = {
            field: field ?? "expiryDate",
            from: fromToDate.startDate.toISOString().split("T")[0],
            to: fromToDate.endDate.toISOString().split("T")[0],
          };
        } catch (error) {
          throw new BadRequestException(error.message);
        }
      }
      let dateFilter;
      if (fromDate || toDate) {
        const filterField = field ?? DEFAULT_DATE_FILTER_FIELD;
        const isExpiryFilter = filterField === "expiryDate";
        // Expiry listings widen the picked range by a 5-day window on each side,
        // INCLUSIVE of the boundary day (From - 5 and To + 5 both show). The
        // window is relative to the selected From/To dates, not today.
        // expiry_date is a DATE column compared with an inclusive BETWEEN, and
        // plain date strings keep the comparison timezone-free; an end-of-day UTC
        // timestamp would leak the next calendar day when the DB session is ahead
        // of UTC (e.g. IST +5:30).
        const fromValue = (() => {
          if (!fromDate) return undefined;
          const d = new Date(fromDate);
          if (isExpiryFilter) {
            d.setDate(d.getDate() - EXPIRY_BUFFER_DAYS);
          }
          return d.toISOString().split("T")[0];
        })();
        const toValue = (() => {
          if (!toDate) return undefined;
          const d = new Date(toDate);
          if (isExpiryFilter) {
            d.setDate(d.getDate() + EXPIRY_BUFFER_DAYS);
            return d.toISOString().split("T")[0];
          }
          // Non-expiry timestamp columns (e.g. createdAt): keep the inclusive
          // end-of-day boundary so the whole selected day stays included.
          d.setUTCHours(23, 59, 59, 999);
          return d;
        })();
        dateFilter = {
          field: filterField,
          from: fromValue,
          to: toValue,
        };
      }

      const effectiveSearchArray = this.sanitizePendingActivitySearchArray(
        searchArray,
        pendingPresentationFilters
      );

      // Normalize owner-based attribute filters to use direct entity columns
      const normalizedSearchArray = effectiveSearchArray?.map((param) => {
        const ownerToDirectMap: Record<string, string> = {
          "owner.organisationId": "organisationId",
          "owner.sbuId": "sbuId",
          "owner.verticalId": "verticalId",
          "owner.departmentId": "departmentId",
          "owner.branchId": "branchId",
        };
        if (ownerToDirectMap[param.searchBy]) {
          return { ...param, searchBy: ownerToDirectMap[param.searchBy] };
        }
        return param;
      });

      if (companyGrain) {
        // Same cheap thin-column fetch the KPI pass below uses (no per-row
        // transform, which would be N+1 at this row count), grouped by company
        // in memory. Fixed row cap instead of a pre-count round trip — far
        // above any realistic filtered opportunity set.
        const { data: grainRows } =
          await this.scopeService.validateOpportunityScope(
            {
              entity: "Opportunity",
              page: 1,
              limit: 100000,
              sort: [],
              relations: relations,
              where: whereCondition,
              select: [
                "companyId",
                "opportunityId",
                "premiumPaid",
                "estimatedBrokerage",
                "company.companyName",
              ],
              searchArray: normalizedSearchArray,
              userFilter: undefined,
              searchString: searchBy,
              searchOn: opportunitySearchObject,
              dateFilter:
                dateFilter && Object.keys(dateFilter).length > 0
                  ? (dateFilter as { field: string; from: Date; to: Date })
                  : undefined,
              period: periodStartAndEndDate,
              preserveCreatedAt: true,
              entityIds: undefined,
              customWhereCondition: customWhereCondition,
              debugOptions,
            },
            userId,
            "opportunity"
          );
        // Dedupe by opportunityId first — one-to-many joins (contacts,
        // activity map) can repeat an opportunity, which would inflate the
        // per-company sums.
        const seenOpportunityIds = new Set<number>();
        const companyMap = new Map<number, CompanyGrainRow>();
        for (const row of grainRows) {
          if (row.companyId == null || seenOpportunityIds.has(row.opportunityId))
            continue;
          seenOpportunityIds.add(row.opportunityId);
          const entry = companyMap.get(row.companyId) ?? {
            companyId: row.companyId,
            companyName:
              row.company?.companyName ?? String(row.companyId),
            totalRos: 0,
            premium: 0,
            brokerage: 0,
          };
          entry.totalRos += 1;
          entry.premium += Number(row.premiumPaid) || 0;
          entry.brokerage += Number(row.estimatedBrokerage) || 0;
          companyMap.set(row.companyId, entry);
        }
        const allCompanies = Array.from(companyMap.values()).sort(
          resolveCompanyGrainComparator(companyGrainSort)
        );
        const grainPage = Math.max(page || 1, 1);
        const grainLimit = Math.max(limit || 10, 1);
        return {
          data: allCompanies.slice(
            (grainPage - 1) * grainLimit,
            grainPage * grainLimit
          ) as unknown as OpportunityDto[],
          count: allCompanies.length,
          opportunityLeads: 0,
          opportunityProspects: 0,
          opportunityQcr: 0,
          opportunityClients: 0,
        };
      }

      const effectiveSort: { field: string; order: "ASC" | "DESC" }[] =
        sort.length > 0 ? sort : [{ field: "updatedAt", order: "DESC" }];
      // TypeORM wraps paginated+joined queries in a DISTINCT subquery
      // ("distinctAlias") that re-selects the ORDER BY column(s) from the
      // inner query -- if a sort field isn't in `select`, that reselection
      // fails at runtime ("column distinctAlias.main_x does not exist"),
      // but only for paginated calls (the unpaginated export never takes
      // this code path, which is why this surfaced on the live listing and
      // not the export). `sort` is frontend-controlled and can be any
      // column, so every sort field must always be present in `select`,
      // not just the ones transformOpportunityData happens to read.
      const sortSelectFields = effectiveSort.map((s) => s.field);
      const baseOpportunitySelect = [
        "opportunityId",
        "companyId",
        "createdAt",
        "updatedAt",
        "expiryDate",
        "premiumPaid",
        "sumInsured",
        "estimatedBrokerage",
        "company.id",
        "company.companyName",
        "company.priority.id",
        "company.priority.lookUpValue",
        "company.industrySegment.id",
        "company.industrySegment.lookUpValue",
        "policyType.id",
        "policyType.lookUpValue",
        "policyStatus.id",
        "status.id",
        "status.lookUpValue",
        "opportunityType.id",
        "opportunityType.lookUpKey",
        "owner.id",
        "owner.firstName",
        "owner.lastName",
        "owner.branch.id",
        "owner.branch.name",
        "isg.id",
        "isg.firstName",
        "isg.lastName",
        "refPolicy.id",
        "refPolicy.insurerPolicyNumber",
        "opportunityActivityMap.id",
        "opportunityContactMap.id",
        "opportunityContactMap.contact.id",
      ];
      // Union with whatever fields the (frontend-controlled, can-be-anything)
      // `sort` array names -- see the comment above sortSelectFields for why.
      const opportunitySelect = [
        ...new Set([...baseOpportunitySelect, ...sortSelectFields]),
      ];
      const { data, count } = await this.scopeService.validateOpportunityScope(
        {
          entity: "Opportunity", // Replace with the actual entity name
          page: page,
          limit: limit,
          sort: effectiveSort,
          relations: relations,
          where: whereCondition,
          // Narrows the SELECT to exactly what transformOpportunityData
          // reads (plus each joined relation's own id, needed for TypeORM
          // to correctly group one-to-many rows during hydration -- same
          // pattern as Policy Listing's export fix -- plus whatever `sort`
          // needs, see opportunitySelect above). Confirmed via
          // pg_stat_statements this query alone hit 29.4s for what should be
          // a much smaller payload: opportunityActivityMap/opportunityContactMap
          // are joined but never read here (kept joined only because
          // whereCondition/customWhereCondition/searchArray elsewhere can
          // filter on their columns -- same reasoning as the "Reverted to
          // the full relations array" comment on the KPI query below), and
          // policyStatus is joined but never read at all.
          select: opportunitySelect,
          searchArray: normalizedSearchArray,
          userFilter: undefined,
          searchString: searchBy,
          searchOn: opportunitySearchObject,
          dateFilter:
            dateFilter && Object.keys(dateFilter).length > 0
              ? (dateFilter as { field: string; from: Date; to: Date })
              : undefined,
          period: periodStartAndEndDate,
          preserveCreatedAt: true,
          entityIds: undefined,
          customWhereCondition: customWhereCondition,
          debugOptions,
          funnel,
        },
        userId,
        "opportunity"
      );
      if (!data || data.length === 0) {
        return {
          data: [],
          count: 0,
          opportunityLeads: 0,
          opportunityProspects: 0,
          opportunityQcr: 0,
          opportunityClients: 0,
        };
      }
      // Resolved ONCE for the whole export/listing call instead of once per
      // row inside transformOpportunityData's loop below -- these 4 lookups
      // use a constant lookUpKey every time regardless of which opportunity
      // is being processed. Confirmed via pg_stat_statements: this alone
      // accounted for ~100k redundant queries (~2.3s) across a single RO
      // export of ~25k rows.
      const [
        workInProgressStatusRow,
        submittedStatusRow,
        rejectedStatusRow,
        wonStatusRows,
      ] = await Promise.all([
        this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS },
        }),
        this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED },
        }),
        this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.REJECTED },
        }),
        this.lookUpRepository.find({
          where: {
            lookUpKey: In([
              OPPORTUNITY_ACTIVITY_STATUS.CLOSED,
              OPPORTUNITY_ACTIVITY_STATUS.APPROVED,
            ]),
          },
        }),
      ]);
      if (!workInProgressStatusRow) {
        throw new NotFoundException(
          `Lookup with key ${OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS} not found`
        );
      }
      if (!submittedStatusRow) {
        throw new NotFoundException(
          `Lookup with key ${OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED} not found`
        );
      }
      if (!rejectedStatusRow) {
        throw new NotFoundException(
          `Lookup with key ${OPPORTUNITY_ACTIVITY_STATUS.REJECTED} not found`
        );
      }
      if (!wonStatusRows || wonStatusRows.length === 0) {
        throw new NotFoundException(
          `Lookup with keys ${OPPORTUNITY_ACTIVITY_STATUS.CLOSED} and ${OPPORTUNITY_ACTIVITY_STATUS.APPROVED} not found`
        );
      }
      const preResolvedStatusIds = {
        workInProgressStatusId: workInProgressStatusRow.id,
        submittedStatusId: submittedStatusRow.id,
        rejectedStatusId: rejectedStatusRow.id,
        wonStatusIds: wonStatusRows.map((status: LookUp) => status.id),
      };
      // Batched ONCE for the whole export/listing call instead of once per
      // row -- replaces ~8,500 individual work-in-progress/submitted/
      // rejected/won-or-completed lookups (2-4 sequential round trips each)
      // with 2-4 total queries covering every opportunity at once. Verified
      // against the original per-row query for a real sample before wiring
      // this in (identical activityName/stageName per opportunity).
      const workInProgressActivitiesById =
        await this.getWorkInProgressActivitiesForOpportunities(
          data.map((opportunity) => opportunity.opportunityId),
          visibleActivityRoleKeys,
          preResolvedStatusIds
        );
      const transformOpportunityData = async (data: any[]) => {
        return await Promise.all(
          data.map(async (opportunity) => {
            // Compute SO/RO discriminator once; reuse for both the display-name
            // resolver and the output field so they always agree.
            const optyTypeStr =
              opportunity.opportunityType?.lookUpKey === OPPORTUNITY_TYPE.RO
                ? RENEWAL_OPPORTUNITY
                : SALES_OPPORTUNITY;
            // Same precedence the original per-row resolver used: a pending
            // activity (only non-trivial when isPendingActivity is set -- a
            // per-call, not per-row, flag) wins first; otherwise the batched
            // cascade result; otherwise the pure JS fallback.
            const pendingActivity = await this.getPendingActivityDetailsForDisplay(
              opportunity.opportunityId,
              pendingPresentationFilters,
              visibleActivityRoleKeys
            );
            const displayStatus = pendingActivity
              ? {
                  activityName: pendingActivity.activityName ?? null,
                  stageName: pendingActivity.stageName ?? null,
                  roleKey: pendingActivity.roleKey ?? null,
                }
              : workInProgressActivitiesById.get(opportunity.opportunityId) ??
                this.computeFallbackDisplayActivity(
                  opportunity.status?.lookUpValue ?? null,
                  optyTypeStr
                );
            // For BD stage, "Assigned to" reads from the activity map owner.
            // BD Planning assigns with ROLE_BD_EXECUTIVE which updates the
            // activity map ownerId but not opportunity.ownerId (by design).
            const isBDStage =
              displayStatus.roleKey === ROLE_KEY.ROLE_BD_EXECUTIVE ||
              displayStatus.roleKey === ROLE_KEY.ROLE_BD_MANAGER;
            let bdAssignedUser = null;
            if (isBDStage) {
              const stageOwner = await this.getStageOwnersByOpportunityId(
                opportunity.opportunityId,
                ROLE_KEY.ROLE_BD_EXECUTIVE
              );
              if (stageOwner?.ownerId) {
                bdAssignedUser = await this.userRepository.findOne({
                  where: { userId: stageOwner.ownerId },
                });
              }
            }
            return {
              opportunityId: opportunity.opportunityId,
              companyId: opportunity.company?.id ?? null,
              companyName: opportunity.company?.companyName ?? null,
              policyType: opportunity.policyType?.lookUpValue ?? null,
              activityName: displayStatus.activityName,
              stageName: displayStatus.stageName,
              state: opportunity.status?.lookUpValue ?? null,
              priority: opportunity.company?.priority?.lookUpValue ?? null,
              opportunityCreationDate: opportunity.createdAt
                ? opportunity.createdAt.toISOString().split("T")[0]
                : null,
              assignedTo: (() => {
                const person =
                  displayStatus.roleKey === ROLE_KEY.ROLE_ISG_EXECUTIVE ||
                  displayStatus.roleKey === ROLE_KEY.ROLE_ISG_MANAGER
                    ? (opportunity.isg ?? opportunity.owner)
                    : (bdAssignedUser ?? opportunity.owner);
                return person
                  ? [person.firstName, person.lastName]
                      .filter((s): s is string => Boolean(s?.trim()))
                      .join(" ") || null
                  : null;
              })(),
              branch: opportunity.owner?.branch?.name ?? null,
              expectedCloseDate: opportunity.expiryDate ?? null,
              premium: opportunity.premiumPaid ?? null,
              sumInsured: opportunity.sumInsured ?? null,
              industrySegment:
                opportunity.company?.industrySegment?.lookUpValue ?? null,
              estimatedBrokerage: opportunity.estimatedBrokerage ?? null,
              policyId: opportunity.refPolicy?.insurerPolicyNumber ?? null,
              // SO/RO discriminator for the combined Manage Quotes listing so the
              // frontend can route by type and render the Opty. Type column.
              opportunityType: optyTypeStr,
            };
          })
        );
      };
      const transformedData = await transformOpportunityData(data);

      if (skipKpi) {
        return {
          data: transformedData as unknown as OpportunityDto[],
          count,
          opportunityLeads: 0,
          opportunityProspects: 0,
          opportunityQcr: 0,
          opportunityClients: 0,
        };
      }

      const selectedFields = [
        "companyId",
        "opportunityId",
        "premiumPaid",
        "estimatedBrokerage",
        "statusLid",
        "company.statusLid",
      ];
      // Reverted to the full relations array: whereCondition/customWhereCondition/
      // searchArray (dateFilter, state:, etc.) can reference columns on any
      // relation in that array (e.g. status, opportunityActivityMap), not just
      // the ones selectedFields reads — trimming to just "company" broke
      // queries whose filters touched a dropped relation (Postgres error on
      // an unjoined table). skipKpi (below, and at this method's call sites)
      // is the safe way to avoid this query's cost for callers that don't
      // need it — this block still runs as before for the live listing UI.
      const { data: overallData } =
        await this.scopeService.validateOpportunityScope(
          {
            entity: "Opportunity", // Replace with the actual entity name
            page: 1,
            limit: count,
            sort: [],
            relations: relations,
            where: whereCondition,
            select: selectedFields,
            searchArray: normalizedSearchArray,
            userFilter: undefined,
            searchString: searchBy,
            searchOn: opportunitySearchObject,
            dateFilter:
              dateFilter && Object.keys(dateFilter).length > 0
                ? (dateFilter as { field: string; from: Date; to: Date })
                : undefined,
            period: periodStartAndEndDate,
            preserveCreatedAt: true,
            entityIds: undefined,
            customWhereCondition: customWhereCondition,
            funnel,
          },
          userId,
          "opportunity"
        );
      const uniqueOpportunityData = [],
        opportunityIds = new Set();
      for (const opportunity of overallData) {
        if (!opportunityIds.has(opportunity.opportunityId)) {
          opportunityIds.add(opportunity.opportunityId);
          uniqueOpportunityData.push(opportunity);
        }
      }
      const companies = new Set(
        uniqueOpportunityData.map((opportunity) => opportunity.companyId)
      );

      const sumOfPremium = uniqueOpportunityData.reduce(
        (sum, opportunity) => sum + (opportunity.premiumPaid || 0),
        0
      );

      const sumOfBrokerage = uniqueOpportunityData.reduce(
        (sum, opportunity) => sum + (opportunity.estimatedBrokerage || 0),
        0
      );

      return {
        data: transformedData as unknown as OpportunityDto[],
        count,
        opportunityLeads: companies.size || 0,
        // Deduped by opportunityId, same as opportunityQcr/opportunityClients
        // below — overallData can contain the same opportunity more than once
        // when it joins one-to-many relations (opportunityContactMap,
        // opportunityActivityMap), so overallData.length overcounts any
        // opportunity with multiple contacts/activity-map rows.
        opportunityProspects: uniqueOpportunityData.length || 0,
        opportunityQcr: sumOfPremium || 0,
        opportunityClients: sumOfBrokerage || 0,
      };
    } catch (error) {
      throw new Error(`Failed to retrieve opportunities: ${error.message}`);
    }
  }

  // Creates a new opportunity.
  async createOpportunity(
    entityManager: EntityManager,
    opportunityData: Partial<CreateOpportunityDto>,
    policyId?: number
  ): Promise<OpportunityDataDto> {
    try {
      // Check if the company exists
      if (!opportunityData.companyId) {
        throw new Error("Company ID is required.");
      }
      const companyExists = await this.companyRepository.fetchByCompanyId(
        opportunityData.companyId
      );
      if (!companyExists) {
        throw new NotFoundException(
          `Company with ID ${opportunityData.companyId} does not exist`
        );
      }
      const accountManagerId = companyExists.accountManager ?? null;
      //set the opportunity status to open after creation
      const taskType = await this.lookUpRepository.findOne({
        where: { lookUpKey: OPPORTUNITY_STATUS_BD_PLANNING },
      });
      if (!taskType) {
        throw new NotFoundException(
          `Task type with key ${OPPORTUNITY_STATUS_BD_PLANNING} not found`
        );
      }
      const ownerId: any = opportunityData.ownerId ?? opportunityData.createdBy;

      const ownerDetails = await this.userRepository.findOne({
        where: { userId: ownerId }
      });

      const organisationId: number[] = await this.getEntityTableMapIds(
        OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.USER,
        OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION_ID,
        { userId: ownerId }
      );
      const countryId: number[] = await this.getEntityTableMapIds(
        OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ORGANISATION,
        OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.COUNTRY_ID,
        { id: organisationId[0] }
      );
      let generatedUniqueRefKey = generateUniqueRefKey(EntityTypeCode.OPPORTUNITY);
      const opportunity = entityManager.create(Opportunity, {
        ...opportunityData,
        ownerId: ownerId,
        countryId: countryId?.[0] ?? null,
        statusLid: taskType.id,
        refPolicyId: policyId ? policyId : null,
        amId: accountManagerId ?? null,
        organisationId: ownerDetails?.organisationId ?? null,
        sbuId: ownerDetails?.sbuId ?? null,
        verticalId: ownerDetails?.verticalId ?? null,
        departmentId: ownerDetails?.departmentId ?? null,
        branchId: ownerDetails?.branchId ?? null,
        uniqueRefKey: generatedUniqueRefKey,
      });

      const savedOpportunity = await entityManager.save(opportunity);
      savedOpportunity.auditRefId = savedOpportunity.opportunityId; // Set auditRefId same as opportunityId after save
      savedOpportunity.uniqueRefKey = `${generatedUniqueRefKey}${savedOpportunity.opportunityId}`; // Update the uniqueRefKey in the returned object as well
      await entityManager.save(Opportunity, savedOpportunity);
      return savedOpportunity;
    } catch (error) {
      throw new Error(`Failed to create opportunity: ${error.message}`);
    }
  }

  async createRiskLocation(
    entityManager: EntityManager,
    riskLocation: Partial<OpportunityRiskLocationDto>
  ): Promise<OpportunityRiskLocationDto> {
    try {
      const riskLocationData = entityManager.create(
        OpportunityRiskLocations,
        riskLocation
      );
      return await entityManager.save(riskLocationData);
    } catch (error) {
      throw new Error(
        `Failed to create opportunity risk location: ${error.message}`
      );
    }
  }

  async createPreviousPlacementDetails(
    entityManager: EntityManager,
    previousPlacementDetails: Partial<OpportunityPreviousPlacementDetailsDto>
  ): Promise<OpportunityPreviousPlacementDetailsDto> {
    try {
      const placementDetailsData = entityManager.create(
        OpportunityPreviousPlacementDetails,
        previousPlacementDetails
      );
      return await entityManager.save(placementDetailsData);
    } catch (error) {
      throw new Error(
        `Failed to create opportunity previous placement details: ${error.message}`
      );
    }
  }

  // Saves previous mediator details of an opportunity.
  async savePreviousMediatorDetails(
    entityManager: EntityManager,
    previousMediatorDetails: {
      previousInsurer: Partial<OpportunityPreviousMediatorDetailsDto>[];
      previousTpa: Partial<OpportunityPreviousMediatorDetailsDto>[];
      previousBroker: Partial<OpportunityPreviousMediatorDetailsDto>[];
      opportunityId: number;
    }
  ) {
    try {
      const { previousInsurer, previousTpa, previousBroker, opportunityId } =
        previousMediatorDetails;

      // Prepare unified mediator details with mediatorType
      const mediatorDetails: OpportunityPreviousMediatorDetailsDto[] = [
        ...previousInsurer.map(
          (detail: Partial<OpportunityPreviousMediatorDetailsDto>) => ({
            companyId: detail.companyId ?? null,
            locationId: detail.locationId ?? null,
            branchId: detail.branchId ?? null,
            mediatorType: MEDIATOR_DETAILS.INSURER_MEDIATOR_TYPE,
          })
        ),
        ...previousTpa.map(
          (detail: Partial<OpportunityPreviousMediatorDetailsDto>) => ({
            companyId: detail.companyId ?? null,
            locationId: detail.locationId ?? null,
            branchId: detail.branchId ?? null,
            mediatorType: MEDIATOR_DETAILS.TPA_MEDIATOR_TYPE,
          })
        ),
        ...previousBroker.map(
          (detail: Partial<OpportunityPreviousMediatorDetailsDto>) => ({
            companyId: detail.companyId ?? null,
            locationId: detail.locationId ?? null,
            branchId: detail.branchId ?? null,
            mediatorType: MEDIATOR_DETAILS.BROKER_MEDIATOR_TYPE,
          })
        ),
      ];

      // Fetch existing records
      const existingPreviousMediators = await entityManager.find(
        OpportunityPreviousMediatorDetails,
        { where: { opportunityId } }
      );

      // Create keys for comparison
      const getKey = (d: OpportunityPreviousMediatorDetailsDto) =>
        `${d.companyId}_${d.mediatorType}`;

      // Convert existing records to a key-based map for easy lookup
      const existingPreviousMediatorKeys = new Map(
        existingPreviousMediators.map((rec) => [getKey(rec), rec])
      );

      // Track processed keys to detect deletions
      const previousMediatorKeys = new Set<string>();

      // Arrays to collect operations
      const newPreviousMediators: OpportunityPreviousMediatorDetails[] = [];
      const updatePreviousMediators: {
        id: number;
        data: Partial<OpportunityPreviousMediatorDetails>;
      }[] = [];

      // Validate that each companyId in mediatorDetails exists in the respective repository
      await Promise.all(
        mediatorDetails.map(async (mediator) => {
          let repo: any;
          switch (mediator.mediatorType) {
            case MEDIATOR_DETAILS.INSURER_MEDIATOR_TYPE:
              repo = Insurer;
              break;
            case MEDIATOR_DETAILS.TPA_MEDIATOR_TYPE:
              repo = Tpa;
              break;
            case MEDIATOR_DETAILS.BROKER_MEDIATOR_TYPE:
              repo = Broker;
              break;
            default:
              throw new BadRequestException(
                `Unknown mediator type: ${mediator.mediatorType}`
              );
          }

          const exists = await entityManager.findOne(repo, {
            where: { id: mediator.companyId },
          });
          if (!exists) {
            throw new NotFoundException(
              `${mediator.mediatorType} with ID ${mediator.companyId} not found.`
            );
          }
        })
      );

      // Check each incoming record
      for (const mediator of mediatorDetails) {
        const key = getKey(mediator);
        previousMediatorKeys.add(key);

        const existing = existingPreviousMediatorKeys.get(key);

        if (existing) {
          const hasChanged =
            existing.locationId !== mediator.locationId ||
            existing.branchId !== mediator.branchId;

          if (hasChanged) {
            updatePreviousMediators.push({
              id: existing.id,
              data: {
                locationId: mediator.locationId,
                branchId: mediator.branchId,
              },
            });
          }
        } else {
          newPreviousMediators.push({
            companyId: mediator.companyId,
            locationId: mediator.locationId,
            branchId: mediator.branchId,
            mediatorType: mediator.mediatorType,
            opportunityId,
          });
        }
      }

      // Insert new records
      if (newPreviousMediators.length > 0) {
        await entityManager.insert(
          OpportunityPreviousMediatorDetails,
          newPreviousMediators
        );
      }

      // Update existing records
      for (const { id, data } of updatePreviousMediators) {
        await entityManager.update(
          OpportunityPreviousMediatorDetails,
          { id },
          data
        );
      }

      // Delete records that are no longer present
      const deleteMediatorDetails = existingPreviousMediators
        .filter((rec) => !previousMediatorKeys.has(getKey(rec)))
        .map((rec) => rec.id);

      if (deleteMediatorDetails.length > 0) {
        await entityManager.delete(
          OpportunityPreviousMediatorDetails,
          deleteMediatorDetails
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to save opportunity previous mediator details: ${error.message}`
      );
    }
  }

  async createContactMap(
    entityManager: EntityManager,
    contactMap: Partial<OpportunityContactMapDto>
  ): Promise<OpportunityContactMapDto> {
    try {
      const existingContact = await this.opportunityRepository.manager.findOne(
        OpportunityContactMap,
        {
          where: {
            contactId: contactMap.contactId,
            opportunityId: contactMap.opportunityId,
          },
        }
      );
      if (existingContact) {
        throw new BadRequestException(
          `Contact with ID ${contactMap.contactId} already exists for this opportunity`
        );
      }

      const contactExists = await this.fetchByCompanyContactId(
        contactMap.companyId,
        contactMap.contactId
      );
      if (!contactExists) {
        throw new NotFoundException(
          `Contact with ID ${contactMap.contactId} does not belong to the company with ID ${contactMap.companyId}`
        );
      }

      const contactMapData = entityManager.create(
        OpportunityContactMap,
        contactMap
      );
      return await entityManager.save(contactMapData);
    } catch (error) {
      throw new Error(
        `Failed to create opportunity contact map: ${error.message}`
      );
    }
  }

  async createClaimExperience(
    entityManager: EntityManager,
    claimExperience: Partial<OpportunityClaimExperienceDto>
  ): Promise<OpportunityClaimExperienceDto> {
    try {
      const claimExperienceData = entityManager.create(
        OpportunityClaimExperiences,
        claimExperience
      );
      return await entityManager.save(claimExperienceData);
    } catch (error) {
      throw new Error(
        `Failed to create opportunity claim experience: ${error.message}`
      );
    }
  }

  async createOppDocument(
    entityManager: EntityManager,
    oppDocument: Partial<OpportunityDocumentDto>
  ): Promise<OpportunityDocumentDto> {
    try {
      const documentExists = await entityManager.findOne(FileUpload, {
        where: { id: oppDocument.documentId },
      });
      if (!documentExists) {
        throw new Error(
          `Document with id ${oppDocument.documentId} does not exist in file_uploads`
        );
      }
      const oppDocumentData = entityManager.create(OpportunityDocuments, {
        ...oppDocument,
        document: documentExists,
      });
      return await entityManager.save(oppDocumentData);
    } catch (error) {
      throw new Error(
        `Failed to create opportunity document: ${error.message}`
      );
    }
  }

  async createCompetitor(
    entityManager: EntityManager,
    competitor: Partial<OpportunityCompetitorDto>
  ): Promise<OpportunityCompetitorDto> {
    try {
      const competitorData = entityManager.create(
        OpportunityCompetitors,
        competitor
      );
      return await entityManager.save(competitorData);
    } catch (error) {
      throw new Error(
        `Failed to create opportunity competitor: ${error.message}`
      );
    }
  }

  async createChallenge(
    entityManager: EntityManager,
    challenge: Partial<OpportunityChallengeDto>
  ): Promise<OpportunityChallengeDto> {
    try {
      const challengeData = entityManager.create(
        OpportunityChallenges,
        challenge
      );
      return await entityManager.save(challengeData);
    } catch (error) {
      throw new Error(
        `Failed to create opportunity challenge: ${error.message}`
      );
    }
  }

  async storeOpportunityCovers(
    entityManager: EntityManager,
    opportunityId: number,
    statusLid: number
  ) {
    try {
      const status = (
        await this.lookUpRepository.findOne({
          where: { id: statusLid },
        })
      )?.lookUpKey;
      if (status === OPPORTUNITY_ACTIVITY_STATUS.CLOSED) {
        const opportunity = await this.opportunityRepository.findOne({
          where: { opportunityId },
        });
        if (!opportunity) {
          throw new NotFoundException(
            `Opportunity with ID ${opportunityId} not found.`
          );
        }
        await this.storeCovers(
          entityManager,
          opportunityId,
          opportunity.policyTypeLid
        );
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw error;
    }
  }

  async storeCovers(
    entityManager: EntityManager,
    opportunityId: number,
    policyTypeId: number
  ) {
    try {
      // Step 1: Fetch cover templates
      const coverTemplates = await entityManager.find(MstrCoverTemplate, {
        where: { policyTypeId },
        order: { displaySequence: "ASC" },
      });
      if (!coverTemplates.length) {
        throw new NotFoundException(
          `No cover templates found for policyTypeId: ${policyTypeId}`
        );
      }
      // Step 2: Insert only missing covers for this opportunity to keep the operation idempotent.
      const existingCovers = await entityManager.find(OpportunityCoverMap, {
        where: { opportunityId, policyTypeId },
        select: { coverId: true, displaySequence: true },
      });
      const existingCoverKeys = new Set(
        existingCovers.map(
          (cover) => `${cover.coverId}::${cover.displaySequence ?? -1}`
        )
      );

      const coversData: OpportunityCoverMap[] = coverTemplates
        .filter(
          (tpl) =>
            !existingCoverKeys.has(
              `${tpl.refCoverId}::${tpl.displaySequence ?? -1}`
            )
        )
        .map((tpl) => {
          const record = new OpportunityCoverMap(
            opportunityId,
            tpl.policyTypeId,
            tpl.refCoverId,
            tpl.mandatory,
            DEFAULT_APPROVAL_REQUIRED, // default value for approvalRequired
            tpl.coverName,
            tpl.coverDescription,
            tpl.displaySequence,
            tpl.displayCategory,
            tpl.coverTypeLid,
            tpl.inputType,
            tpl.inputLov,
            tpl.coversMeta,
            tpl.sectionId,
            tpl.visibleUntilActivityKey
          );
          return record;
        });

      // Step 3: Save the mapped covers
      if (coversData.length) {
        await entityManager.save(OpportunityCoverMap, coversData);
      }

      // Step 4: Ensure section mapping is synced from template by policy_type + cover_id.
      await this.syncOpportunityCoverSections(entityManager, opportunityId);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "storeOpportunityCovers",
          messageData: error,
        }),
      });
      throw new Error("Failed to store opportunity covers:" + error.message);
    }
  }

  private async syncOpportunityCoverSections(
    entityManager: EntityManager,
    opportunityId: number
  ): Promise<void> {
    await entityManager.query(
      `
      UPDATE opportunity_cover_map o
      SET
        section_id = mct.section_id,
        updated_at = CURRENT_TIMESTAMP
      FROM mstr_cover_template mct
      WHERE o.opportunity_id = $1
        AND o.policy_type_id = mct.policy_type_id
        AND o.cover_id = mct.ref_cover_id
        AND COALESCE(o.display_sequence, -1) = COALESCE(mct.display_sequence, -1)
        AND mct.section_id IS NOT NULL
        AND (o.section_id IS NULL OR o.section_id <> mct.section_id)
      `,
      [opportunityId]
    );
  }

  // Retrieves an opportunity by its ID.
  async getOpportunityById(
    opportunityId: number,
    userId: number,
    page?: string
  ): Promise<OpportunityDto | null> {
    try {
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "opportunity",
        "edit",
        opportunityId
      );
      const opportunity = await this.opportunityRepository.findOne({
        where: { opportunityId },
        relations: [
          "company",
          "owner",
          "createdByUser",
          "updatedByUser",
          "status",
          "policyType",
          "policyStatus",
          "serviceLevel",
          "opportunityType",
          "opportunitySourceType",
          "isPolicyMined",
          "opportunityClaimExperiences",
          "opportunityRiskLocations",
          "opportunityRiskLocations.address",
          "opportunityRiskLocations.address.cityId",
          "previousPlacementDetails",
          "previousMediatorDetails",
          "previousMediatorDetails.location",
          "previousMediatorDetails.branch",
          "opportunityContactMap.contact",
          "opportunityContactMap.contact.salutation",
          "opportunityContactMap.contact.tag",
          "opportunityContactMap.contact.owner",
          "opportunityContactMap.contact.status",
          //"opportunityActivityMap",
          // "opportunityActivityMap.leadRole",
          // "opportunityActivityParticipants",
          // "opportunityActivityParticipants.activity",
          // "opportunityActivityParticipants.participant",
          "opportunityContactMap.contact.communicationDetails",
        ],
        select: {
          company: {
            id: true,
            companyName: true,
          },
          policyType: {
            id: true,
            lookUpValue: true,
          },
          policyStatus: {
            id: true,
            lookUpValue: true,
          },
          serviceLevel: {
            id: true,
            lookUpValue: true,
          },
          status: {
            id: true,
            lookUpValue: true,
          },
        },
      });

      if (!opportunity) {
        throw new NotFoundException(errorMessages.opportunityNotFound);
      }

      if (opportunity.previousMediatorDetails?.length) {
        await this.populateMediatorCompanyNames(
          opportunity.previousMediatorDetails
        );
      }
      let filteredData = this.transformOpportunityResponse(opportunity);
      filteredData.isOpportunityEditable = await this.isOpportunityEditable(
        opportunityId
      );
      filteredData.editable = editValidation;
      if (page === "lost") {
        filteredData = await this.getOpportunityLost(opportunity.opportunityId);
      }

      return filteredData;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new Error(error.message);
    }
  }

  // Updates an existing opportunity by its ID.
  async updateOpportunity(
    entityManager: EntityManager,
    opportunityId: number,
    opportunityData: Partial<UpdateOpportunityDto>,
    userId: number
  ): Promise<OpportunityDto | null> {
    // eslint-disable-next-line no-useless-catch
    try {
      const existingOpportunity = await entityManager.findOne(Opportunity, {
        where: { opportunityId },
      });
      if (!existingOpportunity) {
        throw new NotFoundException(errorMessages.opportunityNotFound);
      }
      const companyRepository = new CompanyRepository(
        entityManager.getRepository(Company),
        this.entityService,
        entityManager.connection
      );

      if (opportunityData && opportunityData.companyId) {
        const companyExists = await companyRepository.fetchByCompanyId(
          opportunityData.companyId
        );
        if (!companyExists) {
          throw new NotFoundException(
            `Company with ID ${opportunityData.companyId} does not exist`
          );
        }
      }

      // const updateResult = await entityManager.update(
      //   Opportunity,
      //   { opportunityId },
      //   {
      //     ...opportunityData,
      //     updatedBy: userId,
      //     auditRefId: opportunityId,
      //   } as DeepPartial<Opportunity>
      // );
      Object.assign(existingOpportunity, {
        ...opportunityData,
        auditRefId: Number(opportunityId),
        updatedBy: userId,
      });
      await entityManager.save(Opportunity, existingOpportunity);

      const updatedOpportunity = await this.getOpportunityById(
        opportunityId,
        userId
      );
      return updatedOpportunity;
    } catch (error) {
      throw error;
    }
  }

  async updateClaimExperience(
    entityManager: EntityManager,
    opportunityId: number,
    claimExperienceData: Partial<OpportunityClaimExperienceDto>[]
  ) {
    try {
      // Fetch existing claim experiences for this opportunity
      const existingClaimExperiences = await entityManager.find(
        OpportunityClaimExperiences,
        { where: { opportunityId } }
      );

      const payloadIds = claimExperienceData
        .map((data) => data.id)
        .filter((id) => id !== undefined && id !== null) as number[];

      const recordsToDelete = existingClaimExperiences.filter(
        (existing) => !payloadIds.includes(existing.id)
      );

      const recordsToUpdate = claimExperienceData.filter(
        (data) => data.id !== undefined && data.id !== null
      );

      const recordsToCreate = claimExperienceData.filter(
        (data) => data.id === undefined || data.id === null
      );
      if (recordsToDelete.length > 0) {
        const idsToDelete = recordsToDelete.map((record) => record.id);
        await entityManager.delete(OpportunityClaimExperiences, {
          id: In(idsToDelete),
        });
      }

      // Update existing records
      for (const updateData of recordsToUpdate) {
        const { id, ...dataToUpdate } = updateData;

        await entityManager.update(
          OpportunityClaimExperiences,
          { id, opportunityId },
          { ...dataToUpdate }
        );
      }

      // Create new records
      if (recordsToCreate.length > 0) {
        recordsToCreate.map(async (createData) => {
          await this.createClaimExperience(entityManager, {
            ...createData,
            opportunityId,
          });
        });
      }
    } catch (error) {
      throw new Error(
        `Failed to update claim experience for opportunity id ${opportunityId}: ${error.message}`
      );
    }
  }

  async updateRiskLocations(
    entityManager: EntityManager,
    opportunityId: number,
    updateRiskLocations: OpportunityRiskLocationDto[]
  ): Promise<void> {
    const existingRiskLocationsData = await entityManager.find(
      OpportunityRiskLocations,
      { where: { opportunityId } }
    );
    // Extract addressIds from the payload and existing records
    const updateRiskLocationsData = updateRiskLocations.map((location) =>
      Number(location.addressId)
    );
    const existingRiskLocations = existingRiskLocationsData.map((location) =>
      Number(location.addressId)
    );
    // Find new addressIds to create
    const createRiskLocationsData = updateRiskLocationsData.filter(
      (id) => !existingRiskLocations.includes(id)
    );
    if (createRiskLocationsData.length > 0) {
      await entityManager.save(
        OpportunityRiskLocations,
        createRiskLocationsData.map((addressId) => ({
          opportunityId,
          addressId,
        }))
      );
    }
    // Find addressIds to delete
    const deletingRiskLocationsData = existingRiskLocations.filter(
      (id) => !updateRiskLocationsData.includes(id)
    );
    if (deletingRiskLocationsData.length > 0) {
      for (const addressId of deletingRiskLocationsData) {
        await entityManager.delete(OpportunityRiskLocations, {
          opportunityId,
          addressId,
        });
      }
    }
  }

  async getDocumentsByOpportunityId(
    opportunityId: number,
    page: number,
    limit: number,
    searchArray?: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    searchBy?: string,
    fromDate?: Date,
    toDate?: Date,
    field?: string
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityRepository",
          method: "getDocumentsByOpportunityId",
          payload: {
            opportunityId,
            page,
            limit,
            searchArray,
            searchBy,
            fromDate,
            toDate,
            field,
          },
          messageData: "method invoked",
        }),
      });
      const opportunity = await this.opportunityRepository.findOne({
        where: { opportunityId },
      });
      if (!opportunity) {
        throw new NotFoundException(
          `Opportunity with ID ${opportunityId} not found`
        );
      }
      let dateFilter;
      if (fromDate || toDate) {
        dateFilter = {
          field: field ?? DEFAULT_DATE_FILTER_FIELD,
          from: fromDate,
          to: toDate,
        };
      }
      const { data, count } = await this.entityService.fetchEntityList(
        "FileUpload", // Entity name
        page,
        limit,
        [{ field: "id", order: "ASC" }], // Sort options
        ["documentType", "opportunityActivity", "updatedByUser"], // Relations
        { opportunityId, status: "ACTIVE" }, // Filter by Opportunity ID
        [
          "id",
          "fileKey",
          "documentType.id",
          "documentType.lookUpValue",
          "createdAt",
          "opportunityActivity.activityName",
          "updatedByUser.firstName",
          "updatedByUser.lastName",
        ], // Select fields
        searchArray, // Search array
        undefined, // User filter
        searchBy, // Search string
        fileSearchObject, // Search on
        dateFilter && Object.keys(dateFilter).length > 0
          ? (dateFilter as { field: string; from: Date; to?: Date })
          : undefined,
        undefined,
        true
      );
      return { data, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "getDocumentsByOpportunityId",
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

  // saves opportunity activity documents
  async saveActivityDocuments(
    entityManager: EntityManager,
    entity: string,
    columnName: string,
    columnValue: number,
    documents: {
      documentId?: number;
      documentTypeLid?: number;
    }[],
    opportunityActivityId?: number
  ): Promise<void> {
    try {
      const repository = entityManager.getRepository(entity);
      // Build where condition dynamically
      const whereCondition = { [columnName]: columnValue } as any;
      // Fetch existing documents for the mandate
      const existingDocuments = await repository.find({
        where: whereCondition,
      });
      const existingDocumentIds = existingDocuments.map(
        (doc) => doc.documentId
      );
      const incomingDocumentIds = documents.map((doc) => doc.documentId);
      // Determine documents to add
      const documentsToAdd = documents.filter(
        (doc) => !existingDocumentIds.includes(doc.documentId)
      );
      // Determine documents to remove
      const documentsToRemove = existingDocuments.filter(
        (doc) => !incomingDocumentIds.includes(doc.documentId)
      );
      // Add new documents
      if (documentsToAdd.length > 0) {
        const documentRecordsToAdd = documentsToAdd.map((doc) => {
          const documentRecord: any = {
            [columnName]: columnValue,
            documentId: doc.documentId,
            documentTypeLid: doc.documentTypeLid,
          };
          if (opportunityActivityId) {
            documentRecord.opportunityActivityMapId = opportunityActivityId;
          }
          return repository.create(documentRecord);
        });
        await repository.save(documentRecordsToAdd);
      }
      // Remove documents that are no longer in the list
      if (documentsToRemove.length > 0) {
        const documentIdsToRemove = documentsToRemove.map(
          (doc) => doc.documentId
        );
        await repository.delete({
          [columnName]: columnValue,
          documentId: In(documentIdsToRemove),
        } as any);
      }
    } catch (error) {
      throw new BadRequestException(
        `Failed to save activity documents: ${error.message}`
      );
    }
  }

  async getDocumentByIdAndOpportunityId(
    documentId: number,
    opportunityId: number
  ): Promise<OpportunityDocuments | null> {
    try {
      return await this.opportunityRepository.manager.findOne(
        OpportunityDocuments,
        {
          where: {
            documentId,
            opportunityId,
          },
        }
      );
    } catch (error) {
      throw new Error(
        `Failed to retrieve document with id ${documentId} for opportunity id ${opportunityId}: ${error.message}`
      );
    }
  }

  async getPreviousPlacementDetailsByIdAndOpportunityId(
    previousPlacementId: number,
    opportunityId: number
  ): Promise<OpportunityPreviousPlacementDetails | null> {
    try {
      return await this.opportunityRepository.manager.findOne(
        OpportunityPreviousPlacementDetails,
        {
          where: {
            id: previousPlacementId,
            opportunityId,
          },
        }
      );
    } catch (error) {
      throw new Error(
        `Failed to retrieve previous placement details with id ${previousPlacementId} for opportunity id ${opportunityId}: ${error.message}`
      );
    }
  }

  async updatePreviousPlacementDetails(
    entityManager: EntityManager,
    previousPlacementData: Partial<OpportunityPreviousPlacementDetails>
  ): Promise<void> {
    const { id, ...updateData } = previousPlacementData;
    await entityManager.update(
      OpportunityPreviousPlacementDetails,
      { id },
      updateData
    );
  }

  async updateContactMap(
    entityManager: EntityManager,
    opportunityId: number,
    updateContacts: OpportunityContactMapDto[]
  ): Promise<void> {
    try {
      const opportunity = await this.opportunityRepository.manager.findOne(
        Opportunity,
        { where: { opportunityId } }
      );
      if (!opportunity) {
        throw new NotFoundException(
          `Opportunity with ID ${opportunityId} does not exist`
        );
      }
      const companyId = opportunity.companyId;
      const existingContactsData = await entityManager.find(
        OpportunityContactMap,
        { where: { opportunityId } }
      );
      const updateContactsData = updateContacts?.map((contact) =>
        Number(contact.contactId)
      );
      const existingContacts = existingContactsData?.map((contact) =>
        Number(contact.contactId)
      );
      // Find new contactIds to create
      const createContactsData = updateContactsData.filter(
        (id) => !existingContacts.includes(id)
      );
      if (createContactsData.length > 0) {
        for (const contactId of createContactsData) {
          const contactExists = await this.fetchByCompanyContactId(
            companyId,
            contactId
          );
          if (!contactExists) {
            throw new NotFoundException(
              `Contact with ID ${contactId} does not belong to the company with ID ${companyId}`
            );
          }
        }
        await entityManager.save(
          OpportunityContactMap,
          createContactsData.map((contactId) => ({
            opportunityId,
            contactId,
          }))
        );
      }
      // Find contactIds to delete
      const deletingContactsData = existingContacts.filter(
        (id) => !updateContactsData.includes(id)
      );
      if (deletingContactsData.length > 0) {
        for (const contactId of deletingContactsData) {
          await entityManager.delete(OpportunityContactMap, {
            opportunityId,
            contactId,
          });
        }
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "updateContactMap",
          messageData: error,
        }),
      });
      throw error instanceof NotFoundException
        ? error
        : new Error(`Failed to update contacts: ${error.message}`);
    }
  }

  async getCompetitorByIdAndOpportunityId(
    opportunityCompetitorId: number,
    opportunityId: number
  ): Promise<OpportunityCompetitors | null> {
    try {
      return await this.opportunityRepository.manager.findOne(
        OpportunityCompetitors,
        {
          where: {
            id: opportunityCompetitorId,
            opportunityId,
          },
        }
      );
    } catch (error) {
      throw new Error(
        `Failed to retrieve competitor with id ${opportunityCompetitorId} for opportunity id ${opportunityId}: ${error.message}`
      );
    }
  }

  async updateCompetitor(
    entityManager: EntityManager,
    competitorData: Partial<OpportunityCompetitors>
  ): Promise<void> {
    const { id, ...updateData } = competitorData;
    await entityManager.update(OpportunityCompetitors, { id }, updateData);
  }

  async getChallengeByIdAndOpportunityId(
    oppChallengeId: number,
    opportunityId: number
  ): Promise<OpportunityChallenges | null> {
    try {
      return await this.opportunityRepository.manager.findOne(
        OpportunityChallenges,
        {
          where: {
            id: oppChallengeId,
            opportunityId,
          },
        }
      );
    } catch (error) {
      throw new Error(
        `Failed to retrieve challenge with id ${oppChallengeId} for opportunity id ${opportunityId}: ${error.message}`
      );
    }
  }

  async updateChallenge(
    entityManager: EntityManager,
    challengeData: Partial<OpportunityChallenges>
  ): Promise<void> {
    const { id, ...updateData } = challengeData;
    await entityManager.update(OpportunityChallenges, { id }, updateData);
  }

  // Soft deletes an opportunity by its ID by updating the deletedAt
  async deleteOpportunityById(
    entityManager: EntityManager,
    opportunityId: number
  ): Promise<void> {
    await entityManager.transaction(async (manager) => {
      const opportunity = await manager.findOne(Opportunity, {
        where: { opportunityId },
      });
      if (!opportunity) {
        throw new NotFoundException(errorMessages.opportunityNotFound);
      }
      await manager.softDelete(Opportunity, { opportunityId });
      // Policy Confirmation
      const policyConfirmations = await manager.find(
        OpportunityPolicyConfirmation,
        {
          where: { opportunityId },
          select: ["id"],
        }
      );
      if (policyConfirmations.length > 0) {
        const confirmationIds = policyConfirmations.map((pc) => pc.id);
        await manager.delete(OpportunityPolicyConfirmationDocumentMap, {
          policyConfirmationId: In(confirmationIds),
        });
        await manager.delete(OpportunityPolicyConfirmation, {
          opportunityId,
        });
      }
      // Hand over Meet
      await manager.delete(OpportunityHandOverMeet, { opportunityId });
      // Policy Docket
      const policyDockets = await manager.find(OpportunityPolicyDocket, {
        where: { opportunityId },
        select: ["id"],
      });
      if (policyDockets.length > 0) {
        const docketIds = policyDockets.map((pd) => pd.id);
        await manager.delete(OpportunityPolicyDocketDocumentMap, {
          policyDocketId: In(docketIds),
        });
        await manager.delete(OpportunityPolicyDocket, {
          opportunityId,
        });
      }
      // Policy Hard Copy Receipt
      const policyHardCopies = await manager.find(OpportunityPolicyHardCopy, {
        where: { opportunityId },
        select: ["id"],
      });
      if (policyHardCopies.length > 0) {
        const hardCopyIds = policyHardCopies.map((h) => h.id);
        await manager.delete(OpportunityPolicyHardCopyDocumentMap, {
          policyHardCopyId: In(hardCopyIds),
        });
        await manager.delete(OpportunityPolicyHardCopy, {
          opportunityId,
        });
      }
      // Held Cover Note
      const heldCoverNotes = await manager.find(OpportunityHeldCoverNote, {
        where: { opportunityId },
        select: ["id"],
      });
      if (heldCoverNotes.length > 0) {
        const heldCoverNoteIds = heldCoverNotes.map((h) => h.id);
        await manager.delete(OpportunityHeldCoverNoteDocumentMap, {
          heldCoverNoteId: In(heldCoverNoteIds),
        });
        await manager.delete(OpportunityHeldCoverNote, {
          opportunityId,
        });
      }
      // Premium Calculation
      const premiumCalculations = await manager.find(
        OpportunityPremiumCalculation,
        {
          where: { opportunityId },
          select: ["opportunityActivityId"],
        }
      );
      if (premiumCalculations.length > 0) {
        await manager.delete(OpportunityPremiumCoverDetail, { opportunityId });
        const premiumCalculationActivityIds = premiumCalculations.map(
          (p) => p.opportunityActivityId
        );
        await manager.delete(OpportunityPremiumCalculationDocumentMap, {
          opportunityActivityId: In(premiumCalculationActivityIds),
        });
        await manager.delete(OpportunityPremiumCalculation, { opportunityId });
      }
      // Placement Slip Generation
      const PlacementSlipGeneration = await manager.findOne(
        OpportunityActivityMap,
        {
          where: {
            opportunityId,
            opportunityTable: OPPORTUNITY_ACTIVITY.PLACEMENT_SLIP,
          },
          select: ["id"],
        }
      );
      const placementSlipGenerations = await manager.find(
        OpportunityPlacementSlipGeneration,
        {
          where: { opportunityActivityId: PlacementSlipGeneration?.id },
          select: ["id"],
        }
      );
      if (placementSlipGenerations.length > 0) {
        const placementSlipGenerationIds = placementSlipGenerations.map(
          (p) => p.id
        );
        const cdDetails = await manager.find(OpportunityPlacementSlipCDDetail, {
          where: { placementSlipId: In(placementSlipGenerationIds) },
          select: ["id"],
        });
        if (cdDetails.length > 0) {
          const cdDetailIds = cdDetails.map((c) => c.id);
          await manager.delete(PolicyCdNumberMap, {
            cdId: In(cdDetailIds),
          });
          await manager.delete(OpportunityPlacementSlipCDDetail, {
            placementSlipId: In(placementSlipGenerationIds),
          });
        }
        await manager.delete(OpportunityPlacementSlipCoverDetail, {
          placementSlipId: In(placementSlipGenerationIds),
        });
        await manager.delete(OpportunityPlacementSlipSharingDetail, {
          placementSlipId: In(placementSlipGenerationIds),
        });
        await manager.delete(OpportunityPlacementSlipInstallementDetail, {
          placementSlipId: In(placementSlipGenerationIds),
        });
        await manager.delete(OpportunityPlacementSlipInsurerMap, {
          placementSlipId: In(placementSlipGenerationIds),
        });
        await manager.delete(OpportunityPlacementSlipTpaMap, {
          placementSlipId: In(placementSlipGenerationIds),
        });
        await manager.delete(OpportunityPlacementSlipDocumentMap, {
          placementSlipId: In(placementSlipGenerationIds),
        });
        await manager.delete(OpportunityPlacementSlipGeneration, {
          opportunityActivityId: PlacementSlipGeneration?.id,
        });
      }
      // Meeting for Final Negotiation
      const finalNegotiation = await manager.find(OpportunityFinalNegotiation, {
        where: { opportunityId },
        select: ["id"],
      });
      if (finalNegotiation.length > 0) {
        const finalNegotiationIds = finalNegotiation.map((f) => f.id);
        await manager.delete(OpportunityFinalNegotiationQcrVariation, {
          opportunityFinalNegotiationId: In(finalNegotiationIds),
        });
        await manager.delete(OpportunityFinalNegotiationQuoteCoverDetail, {
          opportunityFinalNegotiationId: In(finalNegotiationIds),
        });
        await manager.delete(OpportunityFinalNegotiationQuoteDocuments, {
          opportunityFinalNegotiationId: In(finalNegotiationIds),
        });
        await manager.delete(OpportunityFinalNegotiationServiceLevelAgreement, {
          opportunityFinalNegotiationId: In(finalNegotiationIds),
        });
        await manager.delete(OpportunityFinalNegotiationSharingDetail, {
          opportunityFinalNegotiationId: In(finalNegotiationIds),
        });
        await manager.delete(OpportunityFinalNegotiationTaxMap, {
          opportunityFinalNegotiationId: In(finalNegotiationIds),
        });
        await manager.delete(OpportunityFinalNegotiation, { opportunityId });
      }
      // QCR Generation
      const qcrGeneration = await manager.find(
        OpportunityQuoteComparisonReport,
        {
          where: { opportunityId },
          select: ["id"],
        }
      );
      if (qcrGeneration.length > 0) {
        const qcrGenerationIds = qcrGeneration.map((q) => q.id);
        await manager.delete(OpportunityQuoteComparisonReportDocumentMap, {
          quoteComparisonReportId: In(qcrGenerationIds),
        });
        await manager.delete(OpportunityQuoteComparisonReport, {
          opportunityId,
        });
      }
      // Enter Quote
      const quoteEntry = await manager.find(OpportunityQuoteEntry, {
        where: { opportunityId },
        select: ["id", "opportunityActivityId"],
      });
      if (quoteEntry.length > 0) {
        const quoteEntryIds = quoteEntry.map((q) => q.id);
        const quoteActivityIds = quoteEntry.map((q) => q.opportunityActivityId);
        await manager.delete(OpportunityQuoteEntryDocumentMap, {
          opportunityQuoteEntryId: In(quoteEntryIds),
        });
        await manager.delete(OpportunityQuoteCoverDetail, { opportunityId });
        await manager.delete(OpportunityQuoteTaxMap, {
          opportunityQuoteEntryId: In(quoteEntryIds),
        });
        await manager.delete(OpportunityQuoteDocumentMap, {
          opportunityActivityId: In(quoteActivityIds),
        });
        await manager.delete(OpportunityQuote, {
          opportunityActivityId: In(quoteActivityIds),
        });
        await manager.delete(OpportunityQuoteEntry, { opportunityId });
      }
      // Broking Slip Generation
      await manager.delete(OpportunityBrokingSlipActivityDocumentMap, {
        opportunityId,
      });
      await manager.delete(BrokingSlipVersionCoverDetails, { opportunityId });
      await manager.delete(BrokingSlipVersionDetails, { opportunityId });
      // RFP Details Entry
      const rfpDetailsEntry = await manager.find(OpportunityRfpDetailsEntry, {
        where: { opportunityId },
        select: ["id"],
      });
      if (rfpDetailsEntry.length > 0) {
        const rfpDetailsEntryIds = rfpDetailsEntry.map((r) => r.id);
        const contactDetails = await manager.find(
          OpportunityRfpClientContactDetail,
          {
            where: { opportunityRfpDetailsEntryId: In(rfpDetailsEntryIds) },
            select: ["id"],
          }
        );
        if (contactDetails.length > 0) {
          const contactDetailsIds = contactDetails.map((c) => c.id);
          await manager.delete(OpportunityRfpClientContactInfluencers, {
            clientContactId: In(contactDetailsIds),
          });
          await manager.delete(OpportunityRfpClientContactDetail, {
            opportunityRfpDetailsEntryId: In(rfpDetailsEntryIds),
          });
        }
        await manager.delete(OpportunityRfpCreditSharing, {
          opportunityRfpDetailsEntryId: In(rfpDetailsEntryIds),
        });
        await manager.delete(OpportunityRfpInsurerDetail, {
          opportunityRfpDetailsEntryId: In(rfpDetailsEntryIds),
        });
        await manager.delete(OpportunityRfpTpaDetail, {
          opportunityRfpDetailsEntryId: In(rfpDetailsEntryIds),
        });
        await manager.delete(OpportunityRfpDetailsEntryDocumentMap, {
          opportunityRfpDetailsEntryId: In(rfpDetailsEntryIds),
        });
        const details = await manager.find(OpportunityRfpDetail, {
          where: { opportunityId },
          select: ["id"],
        });
        if (details.length > 0) {
          const detailsIds = details.map((d) => d.id);
          await manager.delete(OpportunityRfpActivityDocumentMap, {
            rfpDetailId: In(detailsIds),
          });
          await manager.delete(OpportunityRfpDetail, { opportunityId });
        }
        await manager.delete(OpportunityRfpDetailsEntry, { opportunityId });
      }
      // RFP Data Collection
      await manager.delete(OpportunityRfpCoverDetail, { opportunityId });
      // Mandate Details Entry
      const mandateDetailsEntry = await manager.find(
        OpportunityMandateDetailsEntry,
        {
          where: { opportunityId },
          select: ["id"],
        }
      );
      if (mandateDetailsEntry.length > 0) {
        const mandateDetailsEntryIds = mandateDetailsEntry.map((m) => m.id);
        await manager.delete(OpportunityMandateDetailsContactMap, {
          mandateId: In(mandateDetailsEntryIds),
        });
        await manager.delete(OpportunityMandateDetailsDocumentMap, {
          mandateId: In(mandateDetailsEntryIds),
        });
        await manager.delete(OpportunityRfpDetail, { opportunityId });
        await manager.delete(OpportunityMandateDetailsEntry, { opportunityId });
      }
      // KDM Meeting
      await manager.delete(OpportunityKdmMeeting, { opportunityId });
      // Data Validation
      const dataValidation = await manager.find(OpportunityDataValidation, {
        where: { opportunityId },
        select: ["id"],
      });
      if (dataValidation.length > 0) {
        const dataValidationIds = dataValidation.map((d) => d.id);
        await manager.delete(OpportunityDataValidationDocumentMap, {
          dataValidationId: In(dataValidationIds),
        });
        await manager.delete(OpportunityDataValidation, { opportunityId });
      }
      await manager.delete(Task, { opportunityId });
      const meetings = await manager.find(Meeting, {
        where: { opportunityId },
        select: ["id"],
      });
      if (meetings.length > 0) {
        const meetingIds = meetings.map((m) => m.id);
        await manager.delete(MeetingParticipantMap, {
          meetingId: In(meetingIds),
        });
        await manager.delete(Meeting, { opportunityId });
      }
      await manager.delete(Note, { opportunityId });
      await manager.delete(OpportunityActivityMap, { opportunityId });
      await manager.delete(OpportunityActivityParticipants, { opportunityId });
      await manager.delete(OpportunityCoverMap, { opportunityId });
      await manager.delete(OpportunityContactMap, { opportunityId });
      await manager.delete(OpportunityClaimExperiences, { opportunityId });
      await manager.delete(OpportunityRiskLocations, { opportunityId });
      await manager.softDelete(OpportunityLost, { opportunityId });
      await manager.delete(OpportunityPreviousMediatorDetails, {
        opportunityId,
      });
      await manager.delete(OpportunityPreviousPlacementDetails, {
        opportunityId,
      });
    });
  }

  async getOpportunityBrokerage(opportunityId: number) {
    try {
      const opportunity = await this.opportunityRepository.findOne({
        where: { opportunityId },
      });

      if (!opportunity) {
        throw new NotFoundException(errorMessages.opportunityNotFound);
      }
      const [policy, finalNegotiation] = await Promise.all([
        this.opportunityRepository.manager.findOne(Policy, {
          where: { opportunityId },
        }),
        this.opportunityRepository.manager.findOne(
          OpportunityFinalNegotiation,
          {
            where: { opportunityId },
            order: { updatedAt: "DESC" },
          }
        ),
      ]);

      const source = policy ?? finalNegotiation;

      if (!source) {
        return {};
      }

      // Resolve Sum Insured
      let sumInsured;
      if (policy) {
        sumInsured = this.toNumberOrNull(policy.sumInsured);
      } else {
        let quote: OpportunityQuoteEntry | null = null;
        if (finalNegotiation?.finalizedQuoteId) {
          quote = await this.quoteRepo.findOne({
            where: { id: Number(finalNegotiation?.finalizedQuoteId) },
            relations: ["brokingSlipVersion"],
          });
        }
        sumInsured = this.toNumberOrNull(quote?.brokingSlipVersion?.sumInsured);
      }

      // Declarative Mapping
      const fieldMap: Record<string, string> = {
        basicPremium: "basicPremium",
        basicBrokeragePercentage: "basicBrokeragePercentage",
        basicBrokerageAmount: "basicBrokerageAmount",
        tcBrokerageAmount: "tcBrokerageAmount",
        fee: policy ? "feeAmount" : "fee",
        feePercentage: "feePercentage",
        gstPercentage: "gstPercentage",
        gstAmount: "gstAmount",
        other: policy ? "otherAmount" : "other",
        otherPercentage: "otherPercentage",
        netPremium: "netPremium",
        grossPremium: "grossPremium",
        terrorism: policy ? "terrorismAmount" : "terrorism",
        terrorismBrokeragePercentage: "terrorismBrokeragePercentage",
        srccAmount: "srccAmount",
        srccPercentage: "srccPercentage",
        srccBrokerageAmount: "srccBrokerageAmount",
        adminCharges: "adminCharges",
        adminChargesPercentage: "adminChargesPercentage",
        cessAmount: "cessAmount",
        cessPercentage: "cessPercentage",
        totalBrokerageAmount: "totalBrokerageAmount",
      };

      const result = Object.entries(fieldMap).reduce(
        (acc, [key, sourceKey]) => {
          acc[key] = this.toNumberOrNull((source as any)[sourceKey]) ?? 0;
          return acc;
        },
        { sumInsured } as Record<string, number>
      );

      return result;
    } catch (error) {
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

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? null : numericValue;
  }

  private sumNumbers(values: Array<number | null>): number | null {
    const filtered = values.filter(
      (value) => value !== null && value !== undefined
    ) as number[];
    if (!filtered.length) {
      return null;
    }
    return filtered.reduce((acc, value) => acc + value, 0);
  }

  async fetchByCompanyContactId(
    companyId: number,
    contactId: number
  ): Promise<boolean> {
    const companyContactRepository =
      this.opportunityRepository.manager.getRepository("company_contact_map");

    const result = await companyContactRepository.findOne({
      where: {
        companyId,
        contactId,
      },
    });

    return !!result; // Returns true if a record exists, otherwise false
  }

  async getOpportunityActivityMeta(
    opportunityId: number,
    activityId: number
  ): Promise<Partial<OpportunityActivityMap>[]> {
    return await fetchActivityMeta(
      this.opportunityActivityMapRepository,
      opportunityId,
      activityId
    );
  }

  async closeDeviationTasks(
    manager: EntityManager,
    opportunityActivityId: number,
    statusLid: number,
    userId: number
  ) {
    try {
      const status = await this.lookUpRepository.findOne({
        where: { id: statusLid },
      });
      if (!status) {
        throw new NotFoundException(`Status with ID ${statusLid} not found.`);
      }
      if (status.lookUpKey === OPPORTUNITY_ACTIVITY_STATUS.CLOSED) {
        const tasks = await manager.find(Task, {
          where: { activityId: opportunityActivityId },
        });
        if (tasks && tasks.length > 0) {
          const taskStatus = await this.lookUpRepository.findOne({
            where: { lookUpKey: TASK_STATUS_CLOSED },
          });
          if (!taskStatus) {
            throw new NotFoundException(
              `Task status not found for key ${TASK_STATUS_CLOSED}.`
            );
          }
          await manager.update(
            Task,
            { activityId: opportunityActivityId },
            {
              taskStatusLid: taskStatus.id,
              taskClose: TASK_CLOSED,
              updatedBy: userId,
              updatedAt: new Date(),
            }
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
      throw new BadRequestException(
        `Failed to close deviation tasks:${error.message} `
      );
    }
  }

  // Verifies the type of meeting as new or existing.
  async verifyTypeOfMeeting(
    meetingName: string,
    selectedTypeOfMeeting: number,
    selectedMeetingId?: number
  ): Promise<number | null> {
    try {
      const typeOfMeeting = await this.lookUpRepository.findOne({
        where: { id: selectedTypeOfMeeting },
      });
      if (!typeOfMeeting) {
        throw new NotFoundException(`select ${meetingName} type not found`);
      }
      if (typeOfMeeting.lookUpKey === SELECT_MEETING_EXISTING) {
        if (selectedMeetingId === undefined || selectedMeetingId === null) {
          throw new BadRequestException(
            `Please select an existing ${meetingName} to proceed`
          );
        } else {
          const meeting = await this.meetingRepository.findOne({
            where: { id: selectedMeetingId },
          });
          if (!meeting) {
            throw new NotFoundException(
              `${meetingName} with ID ${selectedMeetingId} not found`
            );
          }
        }
        return selectedMeetingId;
      }
      return null;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      } else {
        throw new Error(`Failed to verify type of meeting: ${error.message}`);
      }
    }
  }

  private async populateMediatorCompanyNames(
    details: OpportunityPreviousMediatorDetails[]
  ): Promise<void> {
    await Promise.all(
      details.map(async (d) => {
        let name: string | undefined;
        switch (d.mediatorType) {
          case MEDIATOR_DETAILS.INSURER_MEDIATOR_TYPE: {
            const insurer = await this.opportunityRepository.manager.findOne(
              Insurer,
              {
                where: { id: d.companyId },
                select: ["id", "insurerName", "displayName"],
              }
            );
            name = insurer?.displayName ?? insurer?.insurerName;
            break;
          }
          case MEDIATOR_DETAILS.TPA_MEDIATOR_TYPE: {
            const tpa = await this.opportunityRepository.manager.findOne(Tpa, {
              where: { id: d.companyId },
              select: ["id", "tpaName", "displayName"],
            });
            name = tpa?.displayName ?? tpa?.tpaName;
            break;
          }
          case MEDIATOR_DETAILS.BROKER_MEDIATOR_TYPE: {
            const broker = await this.opportunityRepository.manager.findOne(
              Broker,
              {
                where: { id: d.companyId },
                select: ["id", "brokerName", "displayName"],
              }
            );
            name = broker?.displayName ?? broker?.brokerName;
            break;
          }
          default:
            name = undefined;
        }

        (d as any).companyName = name;
      })
    );
  }

  // Utility function to group previousMediatorDetails
  transformPreviousMediatorDetails(
    details: Partial<OpportunityPreviousMediatorDetails>[]
  ): {
    previousInsurer: any[];
    previousTPA: any[];
    previousBroker: any[];
  } {
    const previousMediatorDetails = {
      previousInsurer: [],
      previousTPA: [],
      previousBroker: [],
    };

    if (!Array.isArray(details)) return previousMediatorDetails;

    details.forEach((mediator) => {
      const transformed = {
        id: mediator.id,
        company: mediator.companyName
          ? { id: mediator.companyId, companyName: mediator.companyName }
          : null,
        location: mediator.location
          ? { id: mediator.locationId, name: (mediator.location as any).name }
          : null,
        branch: mediator.branch
          ? { id: mediator.branchId, name: (mediator.branch as any).address1 }
          : null,
        mediatorDetails: { id: mediator.mediatorType },
      };
      switch (mediator.mediatorType) {
        case MEDIATOR_DETAILS.INSURER_MEDIATOR_TYPE:
          previousMediatorDetails.previousInsurer.push(transformed);
          break;
        case MEDIATOR_DETAILS.TPA_MEDIATOR_TYPE:
          previousMediatorDetails.previousTPA.push(transformed);
          break;
        case MEDIATOR_DETAILS.BROKER_MEDIATOR_TYPE:
          previousMediatorDetails.previousBroker.push(transformed);
          break;
        default:
          break;
      }
    });

    return previousMediatorDetails;
  }
  transformOpportunityResponse(opportunity: any): any {
    return {
      opportunityId: opportunity.opportunityId,
      estimatedBrokerage: opportunity.estimatedBrokerage,
      expiryDate: opportunity.expiryDate,
      estimatedBrokeragePercentage: opportunity.estimatedBrokeragePercentage,
      sumInsured: opportunity.sumInsured,
      premiumPaid: opportunity.premiumPaid,
      estimatedFee: opportunity.estimatedFee,
      source: opportunity.source,
      owner: opportunity.owner
        ? `${opportunity?.owner?.firstName ?? ""} ${
            opportunity?.owner?.lastName ?? ""
          }`.trim()
        : null,
      createdByName: opportunity.createdByUser
        ? `${opportunity?.createdByUser?.firstName ?? ""} ${
            opportunity?.createdByUser?.lastName ?? ""
          }`.trim()
        : null,
      updatedByName: opportunity.updatedByUser
        ? `${opportunity?.updatedByUser?.firstName ?? ""} ${
            opportunity?.updatedByUser?.lastName ?? ""
          }`.trim()
        : null,
      salesPitch: opportunity.salesPitch,
      soCreatedDate: opportunity.createdAt
        ? opportunity.createdAt.toISOString().split("T")[0]
        : null,
      company: {
        companyName: opportunity.company.companyName,
        id: opportunity.company.id,
        country: {
          name: opportunity?.company?.country?.name ?? null,
          id: opportunity?.company?.country?.id ?? null,
        },
      },
      policyType: opportunity.policyType
        ? {
            id: opportunity.policyType.id,
            lookUpValue: opportunity.policyType.lookUpValue,
          }
        : null,
      policyStatus: opportunity.policyStatus
        ? {
            id: opportunity.policyStatus.id,
            lookUpValue: opportunity.policyStatus.lookUpValue,
          }
        : null,
      status: opportunity.status
        ? {
            id: opportunity.status.id,
            lookUpValue: opportunity.status.lookUpValue,
          }
        : null,
      serviceLevel: opportunity.serviceLevel
        ? {
            id: opportunity.serviceLevel.id,
            lookUpValue: opportunity.serviceLevel.lookUpValue,
          }
        : null,
      opportunityType: opportunity.opportunityType
        ? {
            id: opportunity.opportunityType.id,
            lookUpValue: opportunity.opportunityType.lookUpValue,
          }
        : null,
      opportunitySource: opportunity.opportunitySourceType
        ? {
            id: opportunity.opportunitySourceType.id,
            lookUpValue: opportunity.opportunitySourceType.lookUpValue,
          }
        : null,
      isPolicyMined: opportunity.isPolicyMined
        ? {
            id: opportunity.isPolicyMined.id,
            lookUpValue: opportunity.isPolicyMined.lookUpValue,
          }
        : null,
      riskLocations: opportunity.opportunityRiskLocations.map(
        (riskLocation: any) => ({
          id: riskLocation.id,
          opportunityId: riskLocation.opportunityId,
          addressId: riskLocation.addressId,
          address: {
            id: riskLocation.address.id,
            address1: riskLocation.address.address1,
            address2: riskLocation.address.address2,
            city: riskLocation.address.cityId,
            state: riskLocation.address.stateId,
            country: riskLocation.address.countryId,
            pinCode: riskLocation.address.pinCode,
          },
        })
      ),
      claimExperiences: opportunity.opportunityClaimExperiences
        .sort((a: any, b: any) => a.id - b.id)
        .map((claimExperience: any) => ({
          id: claimExperience.id,
          opportunityId: claimExperience.opportunityId,
          policyFrom: claimExperience.policyFrom,
          policyTo: claimExperience.policyTo,
          natureOfLoss: claimExperience.natureOfLoss,
          premium: claimExperience.premium,
          claimAmount: claimExperience.claimAmount,
          claimPercentage: claimExperience.claimPercentage,
          remarks: claimExperience.remarks,
        })),
      previousMediatorDetails: this.transformPreviousMediatorDetails(
        opportunity.previousMediatorDetails
      ),
      previousPlacementDetails:
        opportunity.previousPlacementDetails.map((placementDetails: any) => ({
          id: placementDetails.id,
          opportunityId: placementDetails.opportunityId,
          challengesAndMitigation: placementDetails.challengesAndMitigation,
          existingCompetition: placementDetails.existingCompetition,
          remarks: placementDetails.remarks,
        })) ?? [],
      contacts: opportunity.opportunityContactMap?.map((contactMap: any) => ({
        id: contactMap.contact?.id,
        firstName: contactMap.contact?.firstName,
        lastName: contactMap.contact?.lastName,
        middleName: contactMap.contact?.middleName,
        displayName: contactMap.contact?.displayName,
        salutation: {
          id: contactMap.contact?.salutation?.id,
          lookUpValue: contactMap.contact?.salutation?.lookUpValue,
        },
        tag: {
          id: contactMap.contact?.tag?.id,
          lookUpValue: contactMap.contact?.tag?.lookUpValue,
        },
        status: {
          id: contactMap.contact?.status?.id,
          lookUpValue: contactMap.contact?.status?.lookUpValue,
        },
        communicationDetails: contactMap.contact?.communicationDetails?.map(
          (communication: any) => ({
            id: communication?.id,
            communicationType: communication?.communicationType,
            communicationDetails: communication?.communicationDetails,
            isPrimary: communication?.isPrimary,
          })
        ),
        owner: {
          userId: contactMap.contact?.owner?.userId,
          firstName: contactMap.contact?.owner?.firstName,
          lastName: contactMap.contact?.owner?.lastName,
        },
        department: contactMap.contact?.department ?? null,
        designation: contactMap.contact?.designation ?? null,
      })),
      // opportunityActivities:
      //   opportunity?.opportunityActivityMap?.map((activity: any) => ({
      //     id: activity.id,
      //     activity: {
      //       id: activity.activityId,
      //       name: activity.activityName,
      //     },
      //     stage: {
      //       id: activity.stageId,
      //       name: activity.stageName,
      //     },
      //     plannedDate: activity.plannedDate,
      //     leadDays: activity.leadDays,
      //     approval: activity.approval,
      //     mandatory: activity.mandatory,
      //     activityMeta: activity.activityMeta,
      //     leadRole: {
      //       id: activity.leadRole?.id,
      //       name: activity.leadRole?.name,
      //     },
      //     dueDate: activity.dueDate,
      //     status: activity.status,
      //   })) ?? [],
      // opportunityActivityParticipants:
      //   opportunity?.opportunityActivityParticipants?.map(
      //     (optActyParpt: any) => ({
      //       id: optActyParpt.id,
      //       activity: {
      //         id: optActyParpt.activityId,
      //         name: optActyParpt.activity.name,
      //       },
      //       opportunityId: optActyParpt.opportunityId,
      //       participant: {
      //         id: optActyParpt.participantId,
      //         name: optActyParpt.participant?.firstName ?? null,
      //       },
      //     })
      //   ) ?? [],
    };
  }

  async isOpportunityEditable(opportunityId: number) {
    const isEditable = await this.opportunityRepository.manager
      .getRepository(OpportunityActivityMap)
      .findOne({
        where: {
          opportunityId,
          opportunityTable: OPPORTUNITY_ACTIVITY.DATA_VALIDATION,
        },
        select: ["completedAt"],
      });
    return isEditable && isEditable.completedAt ? false : true;
  }

  async createInsurerParticipants(
    participants: CreateInsurerParticipantDto[],
    meetingId: number,
    manager: EntityManager
  ): Promise<void> {
    const records = participants.map((p) =>
      manager.create(InsurerParticipants, {
        ...p,
        meetingSummaryId: meetingId, // Ensure meetingId is mapped to meetingSummaryId
      })
    );

    await manager.save(InsurerParticipants, records);
  }

  async createStageActivityMap(
    entityManager: EntityManager,
    opportunityId: number,
    policyTypeId: number,
    userId: number,
    type: string
  ): Promise<void> {
    try {
      // Step 1: Fetch templates
      const templateRepo = entityManager.getRepository(
        TABLE_NAMES.STAGE_ACTIVITY_TEMPLATE
      );
      const templates = await templateRepo.find({
        where: { policyTypeLid: policyTypeId },
        order: { stageActivityOrder: "ASC" }, // Ensure consistent order
      });

      if (!templates.length) {
        throw new NotFoundException(
          errorMessages.noTemplateFound(policyTypeId)
        );
      }

      const opportunityStatus = await entityManager.findOne(LookUp, {
        where: { lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.OPEN },
      });
      if (!opportunityStatus) {
        throw new NotFoundException(
          `Opportunity status with key ${OPPORTUNITY_ACTIVITY_STATUS.OPEN} not found`
        );
      }

      // Step 2: Extract and deduplicate stage and activity IDs
      const stageIds = [...new Set(templates.map((t) => t.stageId))];
      const activityIds = [...new Set(templates.map((t) => t.activityId))];

      // Step 3: Batch fetch stages and activities
      const [stages, activities] = await Promise.all([
        entityManager
          .getRepository(TABLE_NAMES.MSTR_STAGE)
          .find({ where: { id: In(stageIds) } }),
        entityManager.getRepository(TABLE_NAMES.MSTR_ACTIVITY).find({
          where: { id: In(activityIds) },
          order: { activityOrder: "ASC" },
        }),
      ]);

      // Step 4: Create lookup maps
      const stageMap = new Map(stages.map((stage) => [stage.id, stage]));
      const activityMap = new Map(
        activities.map((activity) => [activity.id, activity])
      );

      const now = new Date();
      const activityMapRepo = entityManager.getRepository(
        TABLE_NAMES.OPPORTUNITY_ACTIVITY_MAP
      );

      // Step 5: Prepare activity map records
      let previousDueDate = new Date(); // Start with the current date
      const records = templates.map((template, index) => {
        const stage = stageMap.get(template.stageId);
        const activity = activityMap.get(template.activityId);

        if (!stage) {
          throw new NotFoundException(
            errorMessages.stageNotFound(template.stageId)
          );
        }

        if (!activity) {
          throw new NotFoundException(
            errorMessages.activityNotFound(template.activityId)
          );
        }

        // Calculate the original due date
        const leadDays = template.leadDays ?? 5; // Default to 5 if not specified
        const originalDueDate = new Date(
          previousDueDate.getTime() + leadDays * 24 * 60 * 60 * 1000
        );
        previousDueDate = originalDueDate; // Update for the next activity

        return {
          opportunityId: opportunityId,
          refStageId: stage.id, // Ensure stage ID is set
          refActivityId: activity.id, // Ensure activity ID is set
          opportunityTable: activity.opportunityTable,
          activityOrder: activity.activityOrder,
          activityKey: activity.activityKey,
          activityName:
            type == SALES_OPPORTUNITY ? activity.name : activity.roName,
          stageName: type == SALES_OPPORTUNITY ? stage.name : stage.roName,
          roleKey: stage.refRoleKey,
          originalDueDate, // Set the calculated due date
          leadDays,
          approval: template.approval,
          mandatory: template.mandatory,
          isDocumentMandatory: MANDATORY_DOCUMENT_ACTIVITY_KEYS.includes(
            activity.activityKey
          ),
          activityMeta: activity.activityMeta ?? null,
          dueDate: null,
          statusLid: opportunityStatus.id,
          ownerId:
            stage.refRoleKey === ROLE_KEY.ROLE_BD_EXECUTIVE ? userId : null,
          createdBy: userId ?? 1, // Default to 1 if null
          updatedBy: userId ?? 1, // Default to 1 if null
          createdAt: now,
          updatedAt: now,
        };
      });

      // Step 6: Bulk insert into OpportunityActivityMap
      await activityMapRepo.insert(records);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        errorMessages.badRequestWhileActivityMapping
      );
    }
  }

  async updateActivityDueDate(
    entityManager: EntityManager,
    id: number,
    dueDate: Date,
    updatedBy: number
  ): Promise<void> {
    const record = await entityManager.findOne(OpportunityActivityMap, {
      where: { id: id },
    });
    if (!record) {
      throw new NotFoundException(
        `Opportunity Activity record not found with ${id}`
      );
    }
    let statusLid = record.statusLid;

    if (
      (record.opportunityTable === OPPORTUNITY_ACTIVITY.DATA_VALIDATION &&
        record.dueDate == null) ||
      (record.opportunityTable === OPPORTUNITY_ACTIVITY.BROKING_SLIP &&
        record.dueDate == null)
    ) {
      const status = await entityManager.findOne(LookUp, {
        where: { lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS },
      });
      if (!status) {
        throw new NotFoundException(
          `Opportunity status with key ${OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS} not found`
        );
      }
      statusLid = status.id;
    }
    if (record.opportunityTable === OPPORTUNITY_ACTIVITY.DATA_VALIDATION) {
      await this.updateOpportunityStatus(
        entityManager,
        record.opportunityId,
        OPPORTUNITY_STATUS_OPEN
      );
    }
    if (record.opportunityTable === OPPORTUNITY_ACTIVITY.BROKING_SLIP) {
      await this.updateOpportunityStatus(
        entityManager,
        record.opportunityId,
        OPPORTUNITY_STATUS_WORK_IN_PROGRESS
      );
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDateOnly = new Date(dueDate);
    dueDateOnly.setHours(0, 0, 0, 0);
    if (dueDateOnly < today) {
      throw new BadRequestException(`Due date cannot be in the past`);
    }
    if (dueDate > record.originalDueDate) {
      throw new BadRequestException(
        `Due date cannot be greater than the original due date`
      );
    }
    const opportunityStatus = await entityManager.findOne(LookUp, {
      where: { lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED },
    });
    if (!opportunityStatus) {
      throw new NotFoundException(
        `Opportunity status with key ${OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED} not found`
      );
    }
    if (record.statusLid === opportunityStatus.id) {
      throw new BadRequestException(
        `Opportunity activity with ID ${id} is already submitted, you cannot change the due date or add participants`
      );
    }
    // Commented this for future reference
    // const minDate = addDays(opportunity.createdAt, record.leadDays);
    // if (dueDate < minDate) {
    //   throw new BadRequestException(`Due date must be at least ${minDate}`);
    // }

    await entityManager.update(
      OpportunityActivityMap,
      { id: record.id },
      {
        dueDate: dueDate,
        statusLid: statusLid,
        updatedAt: new Date(),
        plannedAt: new Date(),
        updatedBy,
      }
    );
  }

  async getParticipantDetails(
    entityManager: EntityManager,
    participantId: number
  ): Promise<User | null> {
    const userDetails = await entityManager.findOne(User, {
      where: {
        userId: participantId,
      },
    });

    if (!userDetails) {
      throw new NotFoundException(
        infoMessages.userNotFoundWithId(participantId)
      );
    }
    return userDetails;
  }

  async getUserIdByEmployeeId(
    entityManager: EntityManager,
    employeeId: number
  ): Promise<number> {
    const employee = await entityManager.findOne(Employee, {
      where: { employeeId },
      select: ["userId"],
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    return employee.userId;
  }

  async addParticipantsToOpportunityActivity(
    entityManager: EntityManager,
    id: number,
    participantId: number,
    userId: number
  ): Promise<void> {
    const activity = await entityManager.findOne(OpportunityActivityMap, {
      where: {
        id,
      },
    });

    if (!activity) {
      throw new NotFoundException(
        `Opportunity Activity with ID ${id} not found`
      );
    }

    const opportunity = await entityManager.findOne(Opportunity, {
      where: { opportunityId: activity.opportunityId },
    });

    if (!opportunity) {
      throw new NotFoundException(
        `Opportunity with ID ${activity.opportunityId} not found`
      );
    }

    const existingParticipant = await entityManager.findOne(
      OpportunityActivityParticipants,
      {
        where: {
          opportunityActivityId: id,
          participantId: participantId,
        },
      }
    );
    if (!existingParticipant) {
      const newParticipant = entityManager.create(
        OpportunityActivityParticipants,
        {
          opportunityId: activity.opportunityId,
          activityId: activity.refActivityId,
          participantId,
          opportunityActivityId: id,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: userId,
          updatedBy: userId,
        }
      );
      await entityManager.save(OpportunityActivityParticipants, newParticipant);
    }
  }

  async updateOpportunityActivityOwner(
    entityManager: EntityManager,
    id: number,
    ownerId: number
  ): Promise<void> {
    const activity = await entityManager.findOne(OpportunityActivityMap, {
      where: { id },
    });

    if (!activity) {
      throw new NotFoundException(
        `Opportunity Activity with ID ${id} not found`
      );
    }

    await entityManager.update(
      OpportunityActivityMap,
      { id },
      { ownerId, updatedAt: new Date() }
    );
  }

  async getOpportunityActivitiesByOpportunityId(opportunityId: number) {
    try {
      const opportunity = await this.opportunityRepository.findOne({
        where: { opportunityId },
        relations: ["status"],
      });
      if (!opportunity) {
        throw new NotFoundException(
          `Opportunity with ID ${opportunityId} not found`
        );
      }
      let isOpportunityLost = false;
      if (opportunity.status?.lookUpKey === OPPORTUNITY_STATUS_LOST) {
        isOpportunityLost = true;
      }
      // Fetch all activities for the given opportunity ID
      const activities = await this.opportunityActivityMapRepository.find({
        relations: ["status", "owner"],
        where: { opportunityId: opportunityId },
        order: { refStageId: "ASC", refActivityId: "ASC" },
      });

      if (!activities || activities.length === 0) {
        throw new Error(
          `No activities found for opportunity ID ${opportunityId}`
        );
      }

      // Extract activity IDs
      const activityIds = activities.map((activity) => activity.id);

      // Fetch participants for the activities
      const participants =
        await this.opportunityActivityParticipantsRepository.find({
          where: { opportunityActivityId: In(activityIds) },
          relations: ["participant"],
        });

      // Group participants by activity ID
      const participantsByActivityId = participants.reduce(
        (acc, participant) => {
          if (!acc[participant.opportunityActivityId]) {
            acc[participant.opportunityActivityId] = [];
          }
          acc[participant.opportunityActivityId].push({
            userId: participant.participantId,
            userName: participant.participant?.firstName,
          });
          return acc;
        },
        {} as Record<number, { userId: number; userName: string }[]>
      );
      let owner: string | null = null,
        bdOwner: string | null = null,
        isgOwner: string | null = null;

      // Categorize activities into BD and ISG based on roleTag
      const categorizedActivities = activities.reduce(
        (acc, activity) => {
          const stageId = activity.refStageId;
          const stageName = activity.stageName;
          const roleTag = activity.roleKey;

          // Compute owner name outside the accumulator object
          if (activity?.owner && activity?.owner?.firstName) {
            owner = activity.owner.lastName
              ? `${activity.owner.firstName} ${activity.owner.lastName}`
              : activity.owner.firstName;
          }
          if (!bdOwner && activity.roleKey === ROLE_KEY.ROLE_BD_EXECUTIVE) {
            bdOwner = activity.owner
              ? `${activity?.owner?.firstName ?? ""} ${
                  activity?.owner?.lastName ?? ""
                }`.trim()
              : null;
          } else if (
            !isgOwner &&
            activity.roleKey === ROLE_KEY.ROLE_ISG_EXECUTIVE
          ) {
            isgOwner = activity.owner
              ? `${activity?.owner?.firstName ?? ""} ${
                  activity?.owner?.lastName ?? ""
                }`.trim()
              : null;
          }

          // Check if the category (BD or ISG) already exists in the accumulator
          const category =
            roleTag === ROLE_KEY.ROLE_BD_EXECUTIVE ? ROLES.BD : ROLES.ISG;
          if (!acc[category]) {
            acc[category] = [];
          }

          // Check if the stage already exists in the category
          let stage = acc[category].find((s) => s.stageId === stageId);

          if (!stage) {
            // If the stage doesn't exist, create a new one
            stage = {
              stageId,
              stageName,
              activities: [],
              owner,
              roleTag,
            };
            acc[category].push(stage);
          }

          // Add the activity to the stage's activities array
          stage.activities.push({
            opportunityActivityId: activity.id,
            activityId: activity.refActivityId,
            activityName: activity.activityName,
            activityKey: activity.activityKey,
            activityOrder: activity.activityOrder,
            activityApproval: activity.approval,
            activityMandatory: activity.mandatory,
            isDocumentMandatory: activity.isDocumentMandatory,
            activityStatus: activity.status?.lookUpValue ?? null,
            activityStatusKey: activity.status?.lookUpKey ?? null,
            dueDate: activity.dueDate,
            originalDueDate: activity.originalDueDate,
            participants: participantsByActivityId[activity.id] || [],
            leadDays: activity.leadDays,
            isLost: isOpportunityLost,
            plannedAt: activity.plannedAt,
            completedAt: activity.completedAt,
            isCoversRequired: COVERS_REQUIRED_ACTIVITIES.includes(
              activity.activityName
            )
              ? true
              : false,
            isPlanned: activity.dueDate
              ? DEFAULT_PLANNING.PLANNED
              : DEFAULT_PLANNING.NOT_PLANNED,
            owner: activity.owner
              ? `${activity?.owner?.firstName ?? ""} ${
                  activity?.owner?.lastName ?? ""
                }`.trim()
              : null,
          });

          return acc;
        },
        { BD: [], ISG: [] } as {
          BD: Array<{
            stageId: number;
            stageName: string;
            owner: string | null;
            roleTag: string | null;
            activities: Array<{
              opportunityActivityId: number;
              activityId: number;
              activityName: string;
              activityApproval: boolean;
              activityMandatory: boolean;
              isDocumentMandatory: boolean;
              dueDate: Date | null;
              originalDueDate: Date | null;
              participants: { userId: number; userName: string }[];
              leadDays: number | null;
              isCoversRequired: boolean;
            }>;
          }>;
          ISG: Array<{
            stageId: number;
            stageName: string;
            owner: string | null;
            roleTag: string | null;
            activities: Array<{
              opportunityActivityId: number;
              activityId: number;
              activityName: string;
              activityApproval: boolean;
              activityMandatory: boolean;
              isDocumentMandatory: boolean;
              dueDate: Date | null;
              originalDueDate: Date | null;
              participants: { userId: number; userName: string }[];
              leadDays: number | null;
              isCoversRequired: boolean;
            }>;
          }>;
        }
      );

      // Sort activities inside each stage by activityOrder (ascending)
      [ROLES.BD, ROLES.ISG].forEach((category) => {
        categorizedActivities[category].forEach((stage) => {
          stage.activities.sort((a, b) => a.activityOrder - b.activityOrder);
        });
      });

      // Simplify the response structure
      return {
        data: categorizedActivities,
        owner: owner ?? null,
        bdOwner: bdOwner ?? null,
        isgOwner: isgOwner ?? null,
      };
    } catch (error) {
      throw new Error(
        `Failed to retrieve opportunity activities: ${error.message}`
      );
    }
  }

  async getOpportunityActivityHistory(opportunityId: number) {
    const opportunity = await this.opportunityRepository.findOne({
      where: { opportunityId },
    });
    if (!opportunity) {
      throw new NotFoundException(
        `Opportunity with ID ${opportunityId} not found`
      );
    }

    // Fetch ALL activities to build planning rows and individual completion rows
    const allActivities = await this.opportunityActivityMapRepository.find({
      relations: ["status", "owner", "created", "submittedByUser"],
      where: { opportunityId },
      order: { dueDate: "ASC" },
    });

    if (!allActivities || allActivities.length === 0) {
      return [];
    }

    // BD Planning and ISG Planning are not real DB rows — they are derived from
    // plannedAt being set on individual activities when the planning form is submitted.
    const bdPlanned = allActivities.filter(
      (a) => a.roleKey === ROLE_KEY.ROLE_BD_EXECUTIVE && a.plannedAt
    );
    const isgPlanned = allActivities.filter(
      (a) => a.roleKey === ROLE_KEY.ROLE_ISG_EXECUTIVE && a.plannedAt
    );

    const buildPlanningRow = (label: string, planned: typeof allActivities) => {
      const completedAt = planned.reduce(
        (min, a) => (!min || a.plannedAt < min ? a.plannedAt : min),
        null as Date | null
      );
      return {
        opportunityActivityId: null,
        activityName: label,
        targetDate: null,
        assignedTo: null,
        assignedBy: null,
        completedAt,
        submittedBy: null,
        approvedBy: null,
        additionalParticipants: null,
        daysToComplete: null,
        activityStatus: "Planned",
        activityStatusKey: null,
      };
    };

    const planningRows = [];
    if (bdPlanned.length > 0) {
      planningRows.push(buildPlanningRow(ACTIVITY_NAME.BD_PLANNING, bdPlanned));
    }
    if (isgPlanned.length > 0) {
      planningRows.push(buildPlanningRow(ACTIVITY_NAME.ISG_PLANNING, isgPlanned));
    }

    // Only include individual activities that have been completed
    const completedActivities = allActivities.filter((a) => a.completedAt);

    if (completedActivities.length === 0 && planningRows.length === 0) {
      return [];
    }

    const activityIds = completedActivities.map((a) => a.id);

    const participants = activityIds.length
      ? await this.opportunityActivityParticipantsRepository.find({
          where: { opportunityActivityId: In(activityIds) },
          relations: ["participant"],
        })
      : [];

    const participantsByActivityId = participants.reduce(
      (acc, p) => {
        if (!acc[p.opportunityActivityId]) {
          acc[p.opportunityActivityId] = [];
        }
        const name = p.participant
          ? `${p.participant.firstName ?? ""} ${p.participant.lastName ?? ""}`.trim()
          : null;
        if (name) acc[p.opportunityActivityId].push(name);
        return acc;
      },
      {} as Record<number, string[]>
    );

    const updatedByIds = [
      ...new Set(completedActivities.map((a) => a.updatedBy).filter(Boolean)),
    ];
    const updatedByUsers = updatedByIds.length
      ? await this.userRepository.find({
          where: { userId: In(updatedByIds) },
        })
      : [];
    const updatedByMap = updatedByUsers.reduce(
      (acc, u) => {
        acc[u.userId] = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim();
        return acc;
      },
      {} as Record<number, string>
    );

    const completedRows = completedActivities.map((activity) => {
      const lookUpKey = activity.status?.lookUpKey ?? null;
      const updatedByName = activity.updatedBy
        ? (updatedByMap[activity.updatedBy] ?? null)
        : null;
      const assignedTo = activity.owner
        ? `${activity.owner.firstName ?? ""} ${activity.owner.lastName ?? ""}`.trim() || null
        : null;
      const assignedBy = activity.created
        ? `${activity.created.firstName ?? ""} ${activity.created.lastName ?? ""}`.trim() || null
        : null;

      return {
        opportunityActivityId: activity.id,
        activityName: activity.activityName,
        targetDate: activity.dueDate ?? null,
        assignedTo: assignedTo || null,
        assignedBy: assignedBy || null,
        completedAt: activity.completedAt ?? null,
        submittedBy:
          activity.approval?.toUpperCase() === ACTIVITY_APPROVAL_YES
            ? activity.submittedByUser
              ? `${activity.submittedByUser.firstName ?? ""} ${activity.submittedByUser.lastName ?? ""}`.trim() || null
              : null
            : updatedByName,
        approvedBy:
          lookUpKey === OPPORTUNITY_ACTIVITY_STATUS.APPROVED
            ? updatedByName
            : null,
        additionalParticipants:
          participantsByActivityId[activity.id]?.join(", ") || null,
        daysToComplete: (() => {
          if (!activity.completedAt || !activity.dueDate) return null;
          const due = new Date(activity.dueDate);
          const completed = new Date(activity.completedAt);
          due.setHours(0, 0, 0, 0);
          completed.setHours(0, 0, 0, 0);
          return Math.round((completed.getTime() - due.getTime()) / MS_PER_DAY);
        })(),
        activityStatus: activity.status?.lookUpValue ?? null,
        activityStatusKey: lookUpKey,
      };
    });

    // Planning rows first, then individual completed activities in due date order
    return [...planningRows, ...completedRows];
  }

  //Check if opportunity needs approval
  async isOpportunityActivityNeedsApproval(
    opportunityActivityId: number
  ): Promise<boolean | null> {
    try {
      const activity = await this.opportunityActivityMapRepository.findOne({
        where: { id: opportunityActivityId },
      });

      if (!activity) {
        throw new NotFoundException(
          `Opportunity Activity with ID ${opportunityActivityId} not found`
        );
      }
      return activity.approval.toUpperCase() === ACTIVITY_APPROVAL_YES;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error ? error.message : "Failed to create task."
          );
    }
  }

  //Create a task object for the approval task in opportunity activity;
  async createOpportunityActivityTaskObject(
    opportunityActivityId: number,
    taskName: string,
    taskTypeKey: string, //TASK_TYPE.APPROVAL
    assignedTo: number, //userId
    userId?: number,
    description?: string,
    noOfDaysToComplete?: number,
    planning?: boolean
  ): Promise<CreateTaskDto | null> {
    try {
      const activity = await this.opportunityActivityMapRepository.findOne({
        where: { id: opportunityActivityId },
      });
      if (!activity) {
        throw new NotFoundException(
          `Opportunity Activity with ID ${opportunityActivityId} not found`
        );
      }
      const opportunity = await this.opportunityRepository.findOne({
        where: { opportunityId: activity.opportunityId },
      });
      if (!opportunity) {
        throw new NotFoundException(
          `Opportunity with ID ${activity.opportunityId} not found`
        );
      }
      const taskType = await this.lookUpRepository.findOne({
        where: { lookUpKey: taskTypeKey },
      });
      if (!taskType) {
        throw new NotFoundException(
          `Task type with key ${taskTypeKey} not found`
        );
      }
      const taskPriorityType = await this.lookUpRepository.findOne({
        where: { lookUpKey: PRIORITY_LOOK_UP_HIGH_VALUE },
      });
      if (!taskPriorityType) {
        throw new NotFoundException(
          `Task type with key ${taskPriorityType} not found`
        );
      }
      const createTask: CreateTaskDto = {
        taskName: taskName,
        opportunityId: activity.opportunityId,
        activityId: planning ? undefined : opportunityActivityId,
        companyId: opportunity.companyId,
        assigneeId: assignedTo,
        taskTypeLid: taskType.id,
        dueDate: noOfDaysToComplete
          ? addDays(new Date(), noOfDaysToComplete).toISOString()
          : addDays(new Date(), 1).toISOString(), // Set due date to tomorrow
        description:
          description ??
          `${taskName} for Opportunity ID: ${activity.opportunityId}`,
        createdBy: userId ?? assignedTo,
        updatedBy: userId ?? assignedTo,
        priorityLid: taskPriorityType.id,
      };
      return createTask;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error ? error.message : "Failed to create task."
          );
    }
  }

  // Creates a task object for opportunity activity based on the provided details
  async createTaskObject(
    statusLid: number,
    opportunityId: number,
    opportunityActivityId: number,
    taskName: string,
    leadDays: number,
    userId: number
  ) {
    try {
      // Fetch the opportunity to get the companyId
      const opportunity = await this.opportunityRepository.findOne({
        where: { opportunityId },
        select: ["companyId"],
      });
      if (!opportunity) {
        throw new NotFoundException(
          `Opportunity with ID ${opportunityId} not found`
        );
      }
      // Set the task status based on the statusLid from activity
      const status = await this.lookUpRepository.findOne({
        where: { id: statusLid },
      });
      if (!status) {
        throw new NotFoundException(`Status with ID ${statusLid} not found`);
      }
      const taskType = await this.lookUpRepository.findOne({
        where: { lookUpKey: TASK_TYPE.ACTIVITY },
      });
      if (!taskType) {
        throw new NotFoundException(
          `Task type with key ${TASK_TYPE.ACTIVITY} not found`
        );
      }
      let taskStatus, taskClose;
      if (
        status.lookUpKey == OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED ||
        status.lookUpKey == OPPORTUNITY_ACTIVITY_STATUS.CLOSED
      ) {
        taskStatus = await this.lookUpRepository.findOne({
          where: { lookUpKey: TASK_STATUS_CLOSED },
        });
        taskClose = TASK_CLOSED;
      }
      // Prepare the CreateTaskDto
      const createTask: CreateTaskDto = {
        taskName,
        opportunityId,
        activityId: opportunityActivityId,
        companyId: opportunity.companyId,
        assigneeId: userId,
        taskTypeLid: taskType.id,
        dueDate: leadDays ? addDays(new Date(), leadDays) : new Date(),
        description: `${taskName} for Opportunity ID: ${opportunityId}`,
        createdBy: userId,
        updatedBy: userId,
      };
      if (taskStatus) {
        createTask.taskStatusLid = Number(taskStatus.id);
      }
      if (taskClose) {
        createTask.taskClose = taskClose;
      }
      return createTask;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error ? error.message : "Failed to create task."
          );
    }
  }

  async createDataValidation(
    entityManager: EntityManager,
    details: Partial<OpportunityDataValidation>,
    userId: number
  ): Promise<any> {
    try {
      const existingRecord = await entityManager.findOne(
        OpportunityDataValidation,
        {
          where: {
            opportunityId: details.opportunityId,
            activityId: details.activityId,
          },
        }
      );
      if (existingRecord) {
        throw new BadRequestException(
          `Data validation record already exists for Opportunity ID: ${details.opportunityId} and Activity ID: ${details.activityId}`
        );
      }
      const newRecord = entityManager.create(OpportunityDataValidation, {
        opportunityId: details.opportunityId,
        activityId: details.activityId,
        opportunityActivityId: details.opportunityActivityId,
        description: details.description,
        createdBy: userId,
        updatedBy: userId,
        statusLid: details.statusLid,
        taskId: details.taskId,
      });
      const savedRecord = await entityManager.save(
        OpportunityDataValidation,
        newRecord
      );
      return savedRecord;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to create data validation in the database."
      );
    }
  }

  async saveDataValidation(
    entityManager: EntityManager,
    opportunityActivityId: number,
    dataValidationData: Partial<OpportunityDataValidation>,
    userId: number
  ) {
    try {
      const repo = entityManager.getRepository(OpportunityDataValidation);
      let dataValidation = await repo.findOne({
        where: { opportunityActivityId },
      });

      if (dataValidation) {
        dataValidation = repo.merge(dataValidation, {
          ...dataValidationData,
          updatedBy: userId,
          updatedAt: new Date(),
        });
      } else {
        dataValidation = repo.create({
          ...dataValidationData,
          opportunityActivityId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return await repo.save(dataValidation);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save data validation details: ${error.message}`
      );
    }
  }

  // async saveDataValidationDocuments(
  //   entityManager: EntityManager,
  //   dataValidationId: number,
  //   documents: DataValidationDocumentDto[]
  // ): Promise<void> {
  //   try {
  //     // Fetch existing documents
  //     const existingRecords = await entityManager.find(
  //       OpportunityDataValidationDocumentMap,
  //       { where: { dataValidationId } }
  //     );
  //     const incomingDocumentIds = documents.map((doc) => doc.documentId);
  //     const existingDocumentIds = existingRecords.map((doc) => doc.documentId);
  //     // Determine documents to add
  //     const documentsToAdd = documents.filter(
  //       (doc) => !existingDocumentIds.includes(doc.documentId)
  //     );
  //     // Determine documents to remove
  //     const documentsToDelete = existingDocumentIds.filter(
  //       (docId) => !incomingDocumentIds.includes(docId)
  //     );
  //     // Determine existing documents to keep/update
  //     const documentsToKeep = existingDocumentIds.filter((docId) =>
  //       incomingDocumentIds.includes(docId)
  //     );
  //     // Add new documents
  //     if (documentsToAdd.length > 0) {
  //       const documentRecordsToAdd = documentsToAdd.map((doc) =>
  //         entityManager.create(OpportunityDataValidationDocumentMap, {
  //           dataValidationId,
  //           documentId: doc.documentId,
  //           documentTypeLid: doc.documentTypeLid,
  //         })
  //       );
  //       await entityManager.save(
  //         OpportunityDataValidationDocumentMap,
  //         documentRecordsToAdd
  //       );
  //     }
  //     // Remove documents that are no longer in the list
  //     if (documentsToDelete.length > 0) {
  //       await entityManager.delete(OpportunityDataValidationDocumentMap, {
  //         dataValidationId,
  //         documentId: In(documentsToDelete),
  //       });
  //     }
  //     if (documentsToKeep.length > 0) {
  //       for (const doc of documents) {
  //         if (documentsToKeep.includes(doc.documentId)) {
  //           await entityManager.update(
  //             OpportunityDataValidationDocumentMap,
  //             {
  //               dataValidationId,
  //               documentId: doc.documentId,
  //             },
  //             {
  //               documentTypeLid: doc.documentTypeLid,
  //               documentId: doc.documentId,
  //             }
  //           );
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     throw new BadRequestException(
  //       error instanceof Error
  //         ? error.message
  //         : "Failed to create or update data validation documents in the database."
  //     );
  //   }
  // }

  async getDataValidationByOpportunityActivityId(
    opportunityId: number,
    activityId: number
  ): Promise<any> {
    try {
      // Fetch the data validation record
      const dataValidationRecord = await this.dataValidationRepository.findOne({
        where: { opportunityId, activityId },
        relations: ["dataValidationDocs"],
      });
      if (!dataValidationRecord) {
        throw new NotFoundException(
          `Data validation record not found for Opportunity ID: ${opportunityId} and Activity ID: ${activityId}`
        );
      }
      let documents: any[] = [];
      if (
        dataValidationRecord?.dataValidationDocs &&
        dataValidationRecord?.dataValidationDocs?.length > 0
      ) {
        documents = dataValidationRecord?.dataValidationDocs?.map((doc) => ({
          id: Number(doc.id),
          documentId: Number(doc.documentId),
          documentTypeLid: Number(doc.documentTypeLid),
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
        id: Number(dataValidationRecord.id),
        opportunityId: Number(dataValidationRecord.opportunityId),
        activityId: Number(dataValidationRecord.activityId),
        opportunityActivityId: Number(
          dataValidationRecord.opportunityActivityId
        ),
        statusLid: Number(dataValidationRecord.statusLid),
        dataActivity: {
          remarks: {
            description: dataValidationRecord.description,
          },
          documents: documents,
        },
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "getDataValidationByOpportunityActivityId",
          messageData: error,
        }),
      });
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error
              ? error.message
              : `Failed to retrieve data validation for opportunityId: ${opportunityId} and activityId: ${activityId}`
          );
    }
  }

  async updateTaskObject(
    entityManager: EntityManager,
    id: number,
    statusLid: number,
    userId: number
  ) {
    try {
      // Fetch the existing task
      const task = await entityManager.findOne(Task, {
        where: { id },
      });
      if (!task) {
        throw new NotFoundException(errorMessages.taskWithIdNotFound(id));
      }
      // Set the task status based on the statusLid from activity
      const status = await this.lookUpRepository.findOne({
        where: { id: statusLid },
      });
      if (!status) {
        throw new NotFoundException(`Status with ID ${statusLid} not found`);
      }
      let taskStatus, taskClose;
      if (
        status.lookUpKey == OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED ||
        status.lookUpKey == OPPORTUNITY_ACTIVITY_STATUS.CLOSED
      ) {
        taskStatus = await this.lookUpRepository.findOne({
          where: { lookUpKey: TASK_STATUS_CLOSED },
        });
        taskClose = TASK_CLOSED;
      }
      // Prepare the UpdateTaskDto
      const updateTask: UpdateTaskDto = {
        updatedBy: userId,
      };
      if (taskStatus) {
        updateTask.taskStatusLid = Number(taskStatus.id);
      }
      if (taskClose) {
        updateTask.taskClose = taskClose;
      }
      return updateTask;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(
            error instanceof Error ? error.message : "Failed to update task."
          );
    }
  }

  async updateDataValidation(
    entityManager: EntityManager,
    dataValidationRecord: OpportunityDataValidation,
    dataValidationDetails: Partial<UpdateDataValidationDto>,
    userId: number
  ): Promise<OpportunityDataValidation> {
    try {
      await entityManager.update(
        OpportunityDataValidation,
        dataValidationRecord.id,
        {
          description: dataValidationDetails.remarks?.description
            ? dataValidationDetails.remarks.description
            : null,
          statusLid:
            dataValidationDetails.statusLid ?? dataValidationRecord.statusLid,
          updatedBy: userId,
        }
      );
      return await entityManager.findOne(OpportunityDataValidation, {
        where: { id: dataValidationRecord.id },
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : `Failed to update data validation record with ID ${id}: ${error.message}`
      );
    }
  }

  async updateBrokingSlipVersionDetails(
    entityManager: EntityManager,
    brokingSlipVersionData: Partial<BrokingSlipVersionDetails>
  ) {
    try {
      await entityManager.update(
        BrokingSlipVersionDetails,
        { id: brokingSlipVersionData.id },
        brokingSlipVersionData
      );
    } catch (error) {
      throw new Error(
        `Failed to update broking slip version details with ID ${brokingSlipVersionData.id}: ${error.message}`
      );
    }
  }
  async updateRfpDetailsEntry(
    entityManager: EntityManager,
    rfpDetailsId: number,
    updateRfpDetails: Partial<UpdateRfpDetailsEntryDto>,
    userId: number
  ) {
    try {
      console.log(
        updateRfpDetails,
        "Updating RFP details entry with ID:",
        rfpDetailsId
      );
      const updaterfpdetails = await entityManager.update(
        OpportunityRfpDetailsEntry,
        { id: rfpDetailsId },
        { ...updateRfpDetails, updatedBy: userId }
      );
      console.log("RFP details entry updated successfully:", updaterfpdetails);
      return updaterfpdetails;
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : `Failed to update RFP details entry with ID ${rfpDetailsId}: ${error.message}`
      );
    }
  }

  async updateBrokingSlipDetails(
    entityManager: EntityManager,
    brokingSlipVersionData: Partial<BrokingSlipVersionDetails>,
    userId: number
  ) {
    try {
      const result = await entityManager.update(
        BrokingSlipVersionDetails,
        { opportunityId: brokingSlipVersionData.opportunityId },
        brokingSlipVersionData
      );
      // ponytail: no version row yet -> UPDATE hit nothing and would drop
      // "others"; create a row so they aren't lost.
      if (!result.affected) {
        await entityManager.insert(BrokingSlipVersionDetails, {
          ...brokingSlipVersionData,
          createdBy: userId,
          updatedBy: userId,
          brokingSlipVersion: 1,
        });
      }
    } catch (error) {
      throw new Error(
        `Failed to upsert broking slip version details for opportunity ${brokingSlipVersionData.opportunityId}: ${error.message}`
      );
    }
  }

  async deleteBrokingSlipVersionDetails(
    entityManager: EntityManager,
    opportunityId: number,
    versionId: number
  ) {
    try {
      await entityManager.delete(BrokingSlipVersionDetails, {
        id: versionId,
        opportunityId: opportunityId,
      });
    } catch (error) {
      throw new Error(
        `Failed to delete broking slip version details with ID ${versionId}}: ${error.message}`
      );
    }
  }

  async updateBrokingSlipVersionMappedCoversDetails(
    entityManager: EntityManager,
    coversData: Record<string, string>,
    brokingSlipVersionId: number
  ) {
    try {
      const coverDetails = await this.opportunityRepository.manager.find(
        BrokingSlipVersionCoverDetails,
        {
          where: {
            brokingSlipVersionId,
          },
        }
      );
      for (const coverDetail of coverDetails) {
        await entityManager.update(
          BrokingSlipVersionCoverDetails,
          { id: coverDetail.id },
          { coverResponse: coversData[coverDetail.coverMapId] }
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to update broking slip version mapped covers details with ID ${brokingSlipVersionId}: ${error.message}`
      );
    }
  }

  async deleteBrokingSlipVersionMappedCoversDetails(
    entityManager: EntityManager,
    versionId: number
  ) {
    try {
      await entityManager.delete(BrokingSlipVersionCoverDetails, {
        brokingSlipVersionId: versionId,
      });
    } catch (error) {
      throw new Error(
        `Failed to update broking slip version mapped covers details with ID ${versionId}: ${error.message}`
      );
    }
  }

  async updateBrokingSlipVersionMappedPreferredTPAdetails(
    entityManager: EntityManager,
    preferredTPAdetails: Partial<PreferredTpaDetails>[],
    brokingSlipVersionId: number
  ) {
    try {
      for (const preferredTPAdetail of preferredTPAdetails) {
        await entityManager.update(
          PreferredTpaDetails,
          { id: preferredTPAdetail.id },
          preferredTPAdetail
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to update preferred TPA details with ID ${brokingSlipVersionId}: ${error.message}`
      );
    }
  }

  async deleteBrokingSlipVersionMappedPreferredTPAdetails(
    entityManager: EntityManager,
    versionId: number
  ) {
    try {
      await entityManager.delete(PreferredTpaDetails, {
        brokingSlipId: versionId,
      });
    } catch (error) {
      throw new Error(
        `Failed to delete preferred TPA details with broking slip version Id: ${versionId}: ${error.message}`
      );
    }
  }

  async updateBrokingSlipVersionMappedPreferredInsurerdetails(
    entityManager: EntityManager,
    preferredInsurerDetails: Partial<PreferredInsurerDetails>[],
    brokingSlipVersionId: number
  ) {
    try {
      for (const preferredInsurerdetail of preferredInsurerDetails) {
        await entityManager.update(
          PreferredInsurerDetails,
          { id: preferredInsurerdetail.id },
          preferredInsurerdetail
        );
      }
    } catch (error) {
      throw new Error(
        `Failed to update preferred Insurer details with ID ${brokingSlipVersionId}: ${error.message}`
      );
    }
  }

  async updateBrokingSlipMappedPreferredInsurerDetails(
    entityManager: EntityManager,
    preferredInsurerDetails: PreferredInsurerDetailsDto[],
    opportunityId: number
  ) {
    try {
      await entityManager.delete(PreferredInsurerDetails, {
        opportunityId: opportunityId,
      });
      const preferredInsurerDetailsData = preferredInsurerDetails.map(
        (insurerDetail: any) => {
          return entityManager.create(PreferredInsurerDetails, {
            opportunityId: opportunityId,
            ...insurerDetail,
          });
        }
      );
      await entityManager.save(
        PreferredInsurerDetails,
        preferredInsurerDetailsData
      );
    } catch (error) {
      throw new Error(
        `Failed to update preferred Insurer details with opportunity ID ${opportunityId}: ${error.message}`
      );
    }
  }

  async updateBrokingSlipMappedPreferredTpaDetails(
    entityManager: EntityManager,
    preferredTpaDetails: PreferredTpaDetailsDto[],
    opportunityId: number
  ) {
    try {
      await entityManager.delete(PreferredTpaDetails, {
        opportunityId: opportunityId,
      });
      const preferredTpaDetailsData = preferredTpaDetails.map(
        (tpaDetail: any) => {
          return entityManager.create(PreferredTpaDetails, {
            opportunityId: opportunityId,
            ...tpaDetail,
          });
        }
      );
      await entityManager.save(PreferredTpaDetails, preferredTpaDetailsData);
    } catch (error) {
      throw new Error(
        `Failed to update preferred TPA details with opportunity ID ${opportunityId}: ${error.message}`
      );
    }
  }

  async updateBrokingSlipMappedDocumentDetails(
    entityManager: EntityManager,
    documentDetails: BrokingSlipDocumentsDto[],
    opportunityId: number,
    opportunityActivityId: number
  ) {
    try {
      await entityManager.delete(OpportunityBrokingSlipActivityDocumentMap, {
        opportunityId: opportunityId,
      });
      const documentData = documentDetails.map(
        (document: BrokingSlipDocumentsDto) => {
          return entityManager.create(
            OpportunityBrokingSlipActivityDocumentMap,
            {
              opportunityId: opportunityId,
              opportunityActivityMapId: opportunityActivityId,
              documentId: parseInt(document.documentId),
              documentTypeLid: document.documentTypeLid,
            }
          );
        }
      );

      if (documentData && documentData.length > 0) {
        await this.updateDocumentStatus(
          entityManager,
          documentData?.map((docId) => docId.documentId)
        );
      }
      await entityManager.save(
        OpportunityBrokingSlipActivityDocumentMap,
        documentData
      );
    } catch (error) {
      throw new Error(
        `Failed to update preferred TPA details with opportunity ID ${opportunityId}: ${error.message}`
      );
    }
  }
  async updateRfpTpaDetails(
    entityManager: EntityManager,
    rfpDetailsEntryId: number,
    preferredTPA: CreateRfpTpaDetailsDto[],
    excludedTPA: CreateRfpTpaDetailsDto[],
    userId: number
  ): Promise<void> {
    try {
      // Fetch existing TPAs from the database
      const existingTPAs = await entityManager.find(OpportunityRfpTpaDetail, {
        where: { opportunityRfpDetailsEntryId: rfpDetailsEntryId },
      });

      // Combine preferred and excluded TPAs from the payload
      const newTPAs = [...preferredTPA, ...excludedTPA];
      const newTPAIds = newTPAs.map((tpa) => tpa.id);

      // Determine TPAs to delete, update, and create
      const toDelete = existingTPAs.filter(
        (tpa) => !newTPAIds.includes(tpa.id)
      );
      const toUpdate = existingTPAs.filter((tpa) => newTPAIds.includes(tpa.id));
      const toCreate = newTPAs.filter(
        (tpa) => !existingTPAs.some((existing) => existing.id === tpa.id)
      );

      // Delete TPAs that are no longer in the payload
      if (toDelete.length > 0) {
        await entityManager.delete(OpportunityRfpTpaDetail, {
          id: In(toDelete.map((tpa) => tpa.id)),
        });
      }

      // Update existing TPAs
      for (const tpa of toUpdate) {
        const payloadTpa = newTPAs.find((newTpa) => newTpa.id === tpa.id);
        if (payloadTpa) {
          await entityManager.update(
            OpportunityRfpTpaDetail,
            { id: tpa.id },
            { ...payloadTpa, updatedBy: userId }
          );
        }
      }

      // Create new TPAs
      for (const tpa of toCreate) {
        await entityManager.insert(OpportunityRfpTpaDetail, {
          ...tpa,
          opportunityRfpDetailsEntryId: rfpDetailsEntryId,
          createdBy: userId,
          updatedBy: userId,
        });
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "updateRfpTpaDetails",
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to update RFP TPA details."
      );
    }
  }

  async deleteBrokingSlipVersionMappedPreferredInsurerdetails(
    entityManager: EntityManager,
    versionId: number
  ) {
    try {
      await entityManager.delete(PreferredInsurerDetails, {
        opportunityId: versionId,
      });
    } catch (error) {
      throw new Error(
        `Failed to delete preferred Insurer details with broking slip version Id: ${versionId}: ${error.message}`
      );
    }
  }
  async updateRfpInsurerDetails(
    entityManager: EntityManager,
    rfpDetailsEntryId: number,
    preferredInsurers: CreateRfpInsurerDetailsDto[],
    excludedInsurers: CreateRfpInsurerDetailsDto[],
    userId: number
  ): Promise<void> {
    try {
      // Fetch existing insurer details from the database
      const existingInsurers = await entityManager.find(
        OpportunityRfpInsurerDetail,
        {
          where: { opportunityRfpDetailsEntryId: rfpDetailsEntryId },
        }
      );

      // Combine preferred and excluded insurers from the payload
      const newInsurers = [...preferredInsurers, ...excludedInsurers];
      const newInsurerIds = newInsurers.map((insurer) => insurer.id);

      // Determine insurers to delete, update, and create
      const toDelete = existingInsurers.filter(
        (insurer) => !newInsurerIds.includes(insurer.id)
      );
      const toUpdate = existingInsurers.filter((insurer) =>
        newInsurerIds.includes(insurer.id)
      );
      const toCreate = newInsurers.filter(
        (insurer) =>
          !existingInsurers.some((existing) => existing.id === insurer.id)
      );

      // Delete insurers that are no longer in the payload
      if (toDelete.length > 0) {
        await entityManager.delete(OpportunityRfpInsurerDetail, {
          id: In(toDelete.map((insurer) => insurer.id)),
        });
      }

      // Update existing insurers
      for (const insurer of toUpdate) {
        const payloadInsurer = newInsurers.find(
          (newInsurer) => newInsurer.id === insurer.id
        );
        if (payloadInsurer) {
          await entityManager.update(
            OpportunityRfpInsurerDetail,
            { id: insurer.id },
            { ...payloadInsurer, updatedBy: userId }
          );
        }
      }

      // Create new insurers
      for (const insurer of toCreate) {
        await entityManager.insert(OpportunityRfpInsurerDetail, {
          ...insurer,
          opportunityRfpDetailsEntryId: rfpDetailsEntryId,
          createdBy: userId,
          updatedBy: userId,
        });
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "updateRfpInsurerDetails",
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to update RFP Insurer details."
      );
    }
  }

  async updateRfpClientContactDetails(
    entityManager: EntityManager,
    rfpDetailsEntryId: number,
    clientContactDetails: CreateRfpClientContactDetailsDto,
    userId: number
  ): Promise<void> {
    try {
      // Fetch existing client contact details from the database
      const existingClientContact = await entityManager.findOne(
        OpportunityRfpClientContactDetail,
        {
          where: { opportunityRfpDetailsEntryId: rfpDetailsEntryId },
        }
      );

      if (existingClientContact) {
        // Update client contact details
        await entityManager.update(
          OpportunityRfpClientContactDetail,
          { id: existingClientContact.id },
          {
            contactId: clientContactDetails.contactId,
            expectedPremium: clientContactDetails.expectedPremium,
            updatedBy: userId,
          }
        );

        // Handle decision influencers
        const existingInfluencers = await entityManager.find(
          OpportunityRfpClientContactInfluencers,
          {
            where: { clientContactId: existingClientContact.id },
          }
        );

        const newInfluencers = clientContactDetails.decisionInfluencers || [];
        const existingInfluencerIds = existingInfluencers.map(
          (influencer) => influencer.influencerContactId
        );

        // Determine influencers to delete and create
        const toDelete = existingInfluencers.filter(
          (influencer) =>
            !newInfluencers.includes(influencer.influencerContactId)
        );
        const toCreate = newInfluencers.filter(
          (influencerId) => !existingInfluencerIds.includes(influencerId)
        );

        // Delete influencers that are no longer in the payload
        if (toDelete.length > 0) {
          await entityManager.delete(OpportunityRfpClientContactInfluencers, {
            id: In(toDelete.map((influencer) => influencer.id)),
          });
        }

        // Create new influencers
        for (const influencerId of toCreate) {
          await entityManager.insert(OpportunityRfpClientContactInfluencers, {
            clientContactId: existingClientContact.id,
            influencerContactId: influencerId,
          });
        }
      } else {
        // Create new client contact details
        const newClientContact = await entityManager.insert(
          OpportunityRfpClientContactDetail,
          {
            opportunityRfpDetailsEntryId: rfpDetailsEntryId,
            contactId: clientContactDetails.contactId,
            expectedPremium: clientContactDetails.expectedPremium,
            createdBy: userId,
            updatedBy: userId,
          }
        );

        // Create influencers
        if (clientContactDetails.decisionInfluencers?.length > 0) {
          for (const influencerId of clientContactDetails.decisionInfluencers) {
            await entityManager.insert(OpportunityRfpClientContactInfluencers, {
              clientContactId: newClientContact.identifiers[0].id,
              influencerContactId: influencerId,
            });
          }
        }
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "updateRfpClientContactDetails",
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to update RFP Client Contact Details."
      );
    }
  }

  async updateRfpCreditSharing(
    entityManager: EntityManager,
    rfpDetailsEntryId: number,
    creditSharing: { id?: number; executiveId: number; percentage: number }[],
    userId: number
  ): Promise<void> {
    try {
      // Fetch existing credit sharing records from the database
      const existingCreditSharing = await entityManager.find(
        OpportunityRfpCreditSharing,
        {
          where: { opportunityRfpDetailsEntryId: rfpDetailsEntryId },
        }
      );

      const newCreditSharingIds = creditSharing
        .map((credit) => credit.id)
        .filter((id) => id !== undefined);

      const rfpEntry = await entityManager.findOne(OpportunityRfpDetailsEntry, {
        where: { id: rfpDetailsEntryId },
      });

      // Determine records to delete, update, and create
      const toDelete = existingCreditSharing.filter(
        (credit) => !newCreditSharingIds.includes(credit.id)
      );
      const toUpdate = existingCreditSharing.filter((credit) =>
        newCreditSharingIds.includes(credit.id)
      );
      const toCreate = creditSharing.filter(
        (credit) =>
          !existingCreditSharing.some((existing) => existing.id === credit.id)
      );

      // Delete records that are no longer in the payload
      if (toDelete.length > 0) {
        await entityManager.delete(OpportunityRfpCreditSharing, {
          id: In(toDelete.map((credit) => credit.id)),
        });
      }

      // Update existing records
      for (const credit of toUpdate) {
        const payloadCredit = creditSharing.find(
          (newCredit) => newCredit.id === credit.id
        );
        if (payloadCredit) {
          await entityManager.update(
            OpportunityRfpCreditSharing,
            { id: credit.id },
            {
              ...payloadCredit,
              updatedBy: userId,
            }
          );
          if (rfpEntry) {
            const participantUserId = await this.getUserIdByEmployeeId(
              entityManager,
              payloadCredit.executiveId
            );
            await this.addParticipantsToOpportunityActivity(
              entityManager,
              rfpEntry.opportunityActivityId,
              participantUserId,
              userId
            );
          }
        }
      }

      // Create new records
      for (const credit of toCreate) {
        await entityManager.insert(OpportunityRfpCreditSharing, {
          ...credit,
          opportunityRfpDetailsEntryId: rfpDetailsEntryId,
          createdBy: userId,
          updatedBy: userId,
        });
        if (rfpEntry) {
          const participantUserId = await this.getUserIdByEmployeeId(
            entityManager,
            credit.executiveId
          );
          await this.addParticipantsToOpportunityActivity(
            entityManager,
            rfpEntry.opportunityActivityId,
            participantUserId,
            userId
          );
        }
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "updateRfpCreditSharing",
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to update RFP Credit Sharing."
      );
    }
  }

  async updateRfpDetailsEntryDocuments(
    entityManager: EntityManager,
    rfpDetailsEntryId: number,
    documents: OpportunityActivityDocumentDto[],
    userId: number
  ): Promise<void> {
    try {
      // Fetch existing document mappings from the database
      const existingDocuments = await entityManager.find(
        OpportunityRfpDetailsEntryDocumentMap,
        {
          where: { opportunityRfpDetailsEntryId: rfpDetailsEntryId },
        }
      );

      // Extract IDs from the payload and existing records
      const newDocumentIds = documents
        .map((doc) => doc.id)
        .filter((id) => id !== undefined);

      // Determine records to delete, update, and create
      const toDelete = existingDocuments.filter(
        (doc) => !newDocumentIds.includes(doc.id)
      );
      const toUpdate = existingDocuments.filter((doc) =>
        newDocumentIds.includes(doc.id)
      );
      const toCreate = documents.filter(
        (doc) => !existingDocuments.some((existing) => existing.id === doc.id)
      );

      // Delete records that are no longer in the payload
      if (toDelete.length > 0) {
        await entityManager.delete(OpportunityRfpDetailsEntryDocumentMap, {
          id: In(toDelete.map((doc) => doc.id)),
        });
      }

      // Update existing records
      for (const doc of toUpdate) {
        const payloadDoc = documents.find((newDoc) => newDoc.id === doc.id);
        if (payloadDoc) {
          await entityManager.update(
            OpportunityRfpDetailsEntryDocumentMap,
            { id: doc.id },
            { ...payloadDoc }
          );
        }
      }

      // Create new records
      for (const doc of toCreate) {
        await entityManager.insert(OpportunityRfpDetailsEntryDocumentMap, {
          ...doc,
          opportunityRfpDetailsEntryId: rfpDetailsEntryId,
        });
      }
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "updateRfpDetailsEntryDocuments",
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to update RFP Details Entry Documents."
      );
    }
  }

  // Save opportunity meeting participants
  async saveOpportunityMeetingParticipants(
    opportunityActivityId: number,
    participants: MeetingParticipants,
    manager: EntityManager,
    activityStatusKey: string
  ): Promise<void> {
    try {
      const participantTypeMap: Record<
        string,
        {
          entity: any;
          validate: (
            manager: EntityManager,
            participantCompanyId: number,
            participantId: number
          ) => Promise<void>;
          message: (id: number) => string;
        }
      > = {
        [PARTICIPANT_TYPE.TPA_CONTACT]: {
          entity: TpaContact,
          validate: async (
            manager: EntityManager,
            tpaId: number,
            contactId: number
          ) => {
            const tpaContact = await manager.findOne(TpaContact, {
              where: { id: tpaId, contactId },
            });
            if (!tpaContact) {
              throw new NotFoundException(
                `TPA Contact with tpaId ${tpaId} and contactId ${contactId} not found`
              );
            }
          },
          message: (id: number) => `TPA Contact with ID ${id} not found`,
        },
        [PARTICIPANT_TYPE.INSURER_CONTACT]: {
          entity: InsureContact,
          validate: async (
            manager: EntityManager,
            insurerId: number,
            contactId: number
          ) => {
            const insurerContact = await manager.findOne(InsureContact, {
              where: { insurerId, contactId },
            });
            if (!insurerContact) {
              throw new NotFoundException(
                `Insurer Contact with insurerId ${insurerId} and contactId ${contactId} not found`
              );
            }
          },
          message: (id: number) => `Insurer Contact with ID ${id} not found`,
        },
        [PARTICIPANT_TYPE.COMPANY_CONTACT]: {
          entity: CompanyContactMap,
          validate: async (
            manager: EntityManager,
            companyId: number,
            contactId: number
          ) => {
            const companyContact = await manager.findOne(CompanyContactMap, {
              where: { companyId, contactId },
            });
            if (!companyContact) {
              throw new NotFoundException(
                `Company Contact with companyId ${companyId} and contactId ${contactId} not found`
              );
            }
          },
          message: (id: number) => `Company Contact with ID ${id} not found`,
        },
        [PARTICIPANT_TYPE.EMPLOYEE]: {
          entity: User,
          validate: async (
            manager: EntityManager,
            _companyId: number,
            employeeId: number
          ) => {
            const employee = await manager.findOne(User, {
              where: { userId: employeeId },
            });
            if (!employee) {
              throw new NotFoundException(
                `Employee with user ID ${employeeId} not found`
              );
            }
          },
          message: (id: number) => `Employee with user ID ${id} not found`,
        },
      };

      // Helper to build participant list from payload
      const normalizedParticipants: Participant[] = [];
      if (
        participants.tpaParticipants &&
        Object.keys(participants.tpaParticipants).length > 0
      ) {
        const { tpaId, tpaContactPerson } = participants.tpaParticipants;
        if (
          !tpaId ||
          !Array.isArray(tpaContactPerson) ||
          tpaContactPerson.length === 0
        ) {
          throw new BadRequestException(
            "Contact person is required for the selected TPA participant."
          );
        }
        tpaContactPerson.forEach((id) =>
          normalizedParticipants.push({
            participantId: id,
            participantCompanyId: tpaId,
            participantRecordType: PARTICIPANT_TYPE.TPA_CONTACT,
          })
        );
      }
      if (
        participants.insurerParticipants &&
        Object.keys(participants.insurerParticipants).length > 0
      ) {
        const { insurerId, insurerContactPerson } =
          participants.insurerParticipants;
        if (
          !insurerId ||
          !Array.isArray(insurerContactPerson) ||
          insurerContactPerson.length === 0
        ) {
          throw new BadRequestException(
            "Contact person is required for the selected Insurer participant."
          );
        }
        insurerContactPerson.forEach((id) =>
          normalizedParticipants.push({
            participantId: id,
            participantCompanyId: insurerId,
            participantRecordType: PARTICIPANT_TYPE.INSURER_CONTACT,
          })
        );
      }
      if (
        participants.companyParticipants &&
        Object.keys(participants.companyParticipants).length > 0
      ) {
        const { companyId, companyContactPerson } =
          participants.companyParticipants;
        if (
          !companyId ||
          !Array.isArray(companyContactPerson) ||
          companyContactPerson.length === 0
        ) {
          throw new BadRequestException(
            "Company participants are required and must be valid."
          );
        }
        companyContactPerson.forEach((id) =>
          normalizedParticipants.push({
            participantId: id,
            participantCompanyId: companyId,
            participantRecordType: PARTICIPANT_TYPE.COMPANY_CONTACT,
          })
        );
      }
      if (participants.employeeParticipants) {
        const { employees } = participants.employeeParticipants;
        if (!Array.isArray(employees) || employees.length === 0) {
          throw new BadRequestException(
            "Employee participants are required and must be valid."
          );
        }
        employees.forEach((id) =>
          normalizedParticipants.push({
            participantId: id,
            participantCompanyId: PARTICIPANT_EMPLOYEE_COMPANY_ID,
            participantRecordType: PARTICIPANT_TYPE.EMPLOYEE,
          })
        );
      }
      // Fetch all existing participants for this meeting
      const existingParticipants: OpportunityMeetingParticipantMap[] =
        await manager.find(OpportunityMeetingParticipantMap, {
          where: { opportunityActivityId },
        });
      if (
        activityStatusKey == ACTIVITY_STATUS.COMPLETE &&
        existingParticipants.length === 0 &&
        normalizedParticipants.length === 0
      ) {
        throw new BadRequestException(
          errorMessages.meetingParticipantsRequired
        );
      }
      // Build a set for quick lookup
      const incomingParticipantsSet = new Set(
        normalizedParticipants.map(
          (p) => `${p.participantId}_${p.participantRecordType}`
        )
      );
      const existingParticipantsSet = new Set(
        existingParticipants.map(
          (p) => `${p.participantId}_${p.participantRecordType}`
        )
      );
      // Remove participants that exist in DB but not in the incoming payload
      const participantsToRemove = existingParticipants.filter(
        (participant) =>
          !incomingParticipantsSet.has(
            `${participant.participantId}_${participant.participantRecordType}`
          )
      );
      if (participantsToRemove.length > 0) {
        await manager.remove(
          OpportunityMeetingParticipantMap,
          participantsToRemove
        );
      }
      // Add participants that are in the payload but not in the DB
      const participantsToAdd = normalizedParticipants.filter(
        (participant) =>
          !existingParticipantsSet.has(
            `${participant.participantId}_${participant.participantRecordType}`
          )
      );
      for (const participant of participantsToAdd) {
        // Validate participant existence
        const participantType = participant.participantRecordType;
        const typeConfig = participantTypeMap[participantType];
        if (!typeConfig) {
          throw new BadRequestException(
            `Invalid participant type: ${participantType}`
          );
        }
        if (participantType === PARTICIPANT_TYPE.EMPLOYEE) {
          await typeConfig.validate(
            manager,
            PARTICIPANT_EMPLOYEE_COMPANY_ID,
            participant.participantId
          );
        } else {
          await typeConfig.validate(
            manager,
            participant.participantCompanyId,
            participant.participantId
          );
        }
      }
      // New participants to add
      const newParticipants: Partial<OpportunityMeetingParticipantMap>[] =
        participantsToAdd.map((participant) => ({
          opportunityActivityId,
          participantId: participant.participantId,
          participantCompanyId: participant.participantCompanyId,
          participantRecordType: participant.participantRecordType,
        }));

      if (newParticipants.length > 0) {
        await manager.save(OpportunityMeetingParticipantMap, newParticipants);
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        "Error saving meeting participants: " + error.message
      );
    }
  }

  // Save opportunity meeting documents
  async saveOpportunityMeetingDocuments(
    opportunityActivityId: number,
    documents: OpportunityActivityDocumentDto[],
    manager: EntityManager
  ): Promise<void> {
    try {
      // Validate all provided document IDs
      await Promise.all(
        documents.map(async (doc) => {
          if (doc.documentId) {
            const document = await manager.findOne(FileUpload, {
              where: { id: doc.documentId },
            });
            if (!document) {
              throw new NotFoundException(
                errorMessages.documentWithIdNotFound(doc.documentId)
              );
            }
          } else {
            throw new BadRequestException(
              "Document ID is required for each document."
            );
          }
        })
      );
      // Fetch existing meeting documents
      const existingDocuments = await manager.find(
        OpportunityMeetingDocumentMap,
        { where: { opportunityActivityId } }
      );
      const existingDocumentIds = existingDocuments.map((doc) =>
        Number(doc.documentId)
      );
      // Determine new documents to add
      const newDocuments = documents.filter(
        (doc) => doc.documentId && !existingDocumentIds.includes(doc.documentId)
      );
      if (newDocuments.length > 0) {
        const meetingDocuments: Partial<OpportunityMeetingDocumentMap>[] =
          newDocuments.map((doc) => ({
            opportunityActivityId,
            documentId: doc.documentId,
            documentTypeLid: doc.documentTypeLid,
          }));
        await manager.save(OpportunityMeetingDocumentMap, meetingDocuments);
      }
      // Determine documents to remove
      const documentsToRemove = existingDocuments.filter(
        (doc) => !documents.some((d) => d.documentId === doc.documentId)
      );
      if (documentsToRemove.length > 0) {
        await manager.remove(OpportunityMeetingDocumentMap, documentsToRemove);
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        "Error saving meeting documents: " + error.message
      );
    }
  }

  async saveKDMMeeting(
    entityManager: EntityManager,
    opportunityActivityId: number,
    userId: number,
    data: Partial<OpportunityKdmMeeting>
  ) {
    try {
      const repo = entityManager.getRepository(OpportunityKdmMeeting);

      let kdmMeeting = await repo.findOne({
        where: { opportunityActivityId },
      });

      if (kdmMeeting) {
        kdmMeeting = repo.merge(kdmMeeting, {
          ...data,
          updatedBy: userId,
          updatedAt: new Date(),
        });
      } else {
        kdmMeeting = repo.create({
          ...data,
          opportunityActivityId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      return await repo.save(kdmMeeting);
    } catch (error) {
      throw new BadRequestException(
        `Failed to save KDM meeting details: ${error.message}`
      );
    }
  }

  async updateHandOverMeeting(
    entityManager: EntityManager,
    meetingId: number,
    updateHandOverData: Partial<UpdateHandOverMeetDto>
  ) {
    try {
      await entityManager.update(
        OpportunityHandOverMeet,
        { meetingId: meetingId },
        updateHandOverData
      );
      return await entityManager.findOne(OpportunityHandOverMeet, {
        where: { meetingId: meetingId },
      });
    } catch (error) {
      throw new Error(
        `Failed to update Hand Over meeting record with ID ${meetingId}: ${error.message}`
      );
    }
  }

  async getMeetingDetailsById(opportunityActivityId: number): Promise<any> {
    try {
      const meeting = await this.kdmMeetingRepository.findOne({
        where: { opportunityActivityId },
        relations: [
          "opportunityActivity",
          "opportunityActivity.meetingDocuments",
          "opportunityActivity.meetingDocuments.document",
          "opportunityActivity.meetingDocuments.documentType",
          "opportunityActivity.meetingParticipants",
        ],
      });
      if (!meeting) {
        throw new NotFoundException(
          `KDM meeting with opportunityActivityId ${opportunityActivityId} not found`
        );
      }
      const meetingTypeKdm = await getLookups(
        this.lookUpRepository,
        [MEETING_TYPE_KEY.KDM],
        LOOK_UP_FIELD.KEY
      );
      const meetingTypeLookup = await getLookup(
        meetingTypeKdm,
        [MEETING_TYPE_KEY.KDM],
        LOOK_UP_FIELD.KEY
      );
      const participants = meeting.opportunityActivity.meetingParticipants;
      const companyParticipants = participants
        ?.filter(
          (p) => p.participantRecordType === PARTICIPANT_TYPE.COMPANY_CONTACT
        )
        .map((p) => p.participantId);
      const employeeParticipants = participants
        ?.filter((p) => p.participantRecordType === PARTICIPANT_TYPE.EMPLOYEE)
        .map((p) => p.participantId);
      let documents = [];
      if (
        meeting.opportunityActivity.meetingDocuments &&
        meeting.opportunityActivity.meetingDocuments?.length > 0
      ) {
        documents = meeting.opportunityActivity.meetingDocuments?.map(
          (doc) => ({
            documentId: Number(doc.documentId),
            documentTypeLid: doc.documentTypeLid
              ? Number(doc.documentTypeLid)
              : null,
            fileName: doc?.document?.fileKey?.split("/")?.pop() || null,
            documentType: doc.documentType?.lookUpValue || null,
          })
        );
      } else {
        documents = [
          {
            documentId: null,
            documentTypeLid: null,
          },
        ];
      }
      // Return the transformed meeting object
      const data = {
        id: Number(meeting.id),
        opportunityId: Number(meeting.opportunityId),
        activityId: Number(meeting.activityId),
        opportunityActivityId: Number(meeting.opportunityActivityId),
        statusLid: Number(meeting.statusLid),
        dataActivity: {
          kdmMeetingFormFields: {
            kdmMeetingTypeLid: meeting.kdmMeetingTypeLid
              ? Number(meeting.kdmMeetingTypeLid)
              : null,
            selectMeeting: meeting.selectMeeting,
            meetingDate: meeting.meetingDate,
            availableFrom: meeting.startTime,
            availableTo: meeting.endTime,
            meetingTypeLid:
              meetingTypeLookup[`lookup_${MEETING_TYPE_KEY.KDM}`].id,
            locationTypeLid: meeting.locationTypeLid
              ? Number(meeting.locationTypeLid)
              : null,
          },
          remarksMomSection: {
            mom: meeting.mom,
            remarks: meeting.remarks,
          },
          participants: {
            companyContactPerson:
              companyParticipants.length > 0 ? companyParticipants : [],
            employees:
              employeeParticipants.length > 0 ? employeeParticipants : [],
          },
          documents: documents,
        },
      };
      return data;
    } catch (error) {
      throw new Error(
        `Failed to retrieve kdm meeting details: ${error.message}`
      );
    }
  }

  async gethandOverMeetDetailsById(
    opportunityActivityId: number
  ): Promise<any> {
    try {
      const meeting = await this.handOverMeetRepository.findOne({
        where: { opportunityActivityId },
        relations: [
          "opportunityActivity",
          "opportunityActivity.meetingDocuments",
          "opportunityActivity.meetingDocuments.document",
          "opportunityActivity.meetingDocuments.documentType",
          "opportunityActivity.meetingParticipants",
        ],
      });
      if (!meeting) {
        throw new NotFoundException(
          `Hand over meeting with opportunityActivityId ${opportunityActivityId} not found`
        );
      }
      const meetingTypeHandOver = await getLookups(
        this.lookUpRepository,
        [MEETING_TYPE_KEY.HANDOVER],
        LOOK_UP_FIELD.KEY
      );
      const meetingTypeLookup = await getLookup(
        meetingTypeHandOver,
        [MEETING_TYPE_KEY.HANDOVER],
        LOOK_UP_FIELD.KEY
      );
      const participants = meeting.opportunityActivity.meetingParticipants;
      const companyParticipants = participants
        ?.filter(
          (p) => p.participantRecordType === PARTICIPANT_TYPE.COMPANY_CONTACT
        )
        .map((p) => p.participantId);
      const employeeParticipants = participants
        ?.filter((p) => p.participantRecordType === PARTICIPANT_TYPE.EMPLOYEE)
        .map((p) => p.participantId);
      let documents = [];
      if (
        meeting.opportunityActivity.meetingDocuments &&
        meeting.opportunityActivity.meetingDocuments.length > 0
      ) {
        documents = meeting.opportunityActivity.meetingDocuments.map((doc) => ({
          id: Number(doc.id),
          documentId: Number(doc.documentId),
          documentTypeLid: Number(doc.documentTypeLid),
        }));
      } else {
        documents = [
          {
            documentId: null,
            documentTypeLid: null,
          },
        ];
      }
      const approverDetails = await this.getActivityApproverDetails(
        opportunityActivityId
      );
      // Return the transformed meeting object
      const data = {
        id: Number(meeting.id),
        opportunityId: Number(meeting.opportunityId),
        activityId: Number(meeting.activityId),
        statusLid: Number(meeting.statusLid),
        opportunityActivityId: Number(meeting.opportunityActivityId),
        dataActivity: {
          handOverMeetFields: {
            handOverMeetingTypeLid: this.toNumberOrNull(
              meeting.handOverMeetingTypeLid
            ),
            selectMeeting: meeting.selectMeeting,
            meetingDate: meeting.meetingDate,
            availableFrom: meeting.startTime,
            availableTo: meeting.endTime,
            meetingTypeLid:
              meetingTypeLookup[`lookup_${MEETING_TYPE_KEY.HANDOVER}`].id,
            locationTypeLid: meeting.locationTypeLid,
          },
          remarksMomSection: {
            mom: meeting.mom,
            remarks: meeting.remarks,
          },
          participants: {
            companyContactPerson:
              companyParticipants.length > 0 ? companyParticipants : [],
            employees:
              employeeParticipants.length > 0 ? employeeParticipants : [],
          },
          documents: documents,
        },
        approverDetails: approverDetails,
      };
      return data;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        `Failed to retrieve hand over meeting details: ${error.message}`
      );
    }
  }

  async getOpportunityActivityById(
    opportunityActivityId: number
  ): Promise<OpportunityActivityDto> {
    try {
      const result = await this.opportunityActivityMapRepository.findOne({
        where: { id: opportunityActivityId },
        relations: ["opportunity"],
        select: [
          "id",
          "opportunityId",
          "refActivityId",
          "dueDate",
          "opportunityTable",
          "activityName",
          "activityKey",
          "leadDays",
          "statusLid",
          "activityStatusKey",
        ],
      });
      if (!result) {
        throw new NotFoundException(
          `Opportunity Activity with ID ${opportunityActivityId} not found`
        );
      }
      return {
        id: result.id,
        companyId: result.opportunity.companyId,
        opportunityId: result.opportunityId,
        activityId: result.refActivityId,
        plannedDate: result.dueDate,
        opportunityTable: result.opportunityTable,
        activityName: result.activityName,
        activityKey: result.activityKey,
        leadDays: result.leadDays,
        statusLid: result.statusLid,
        activityStatusKey: result.activityStatusKey,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error);
    }
  }

  async getOpportunityCovers(
    opportunityId: number,
    excludeCoverTypes: number[]
  ): Promise<Partial<OpportunityCoverDto>[]> {
    try {
      const opportunity = await this.opportunityRepository.findOne({
        where: { opportunityId },
      });
      if (!opportunity) {
        throw new NotFoundException(
          errorMessages.opportunityNotPresent(opportunityId)
        );
      }
      const covers = await this.opportunityRepository.manager.find(
        OpportunityCoverMap,
        {
          where: { opportunityId, coverTypeLid: Not(In(excludeCoverTypes)) },
          order: { displaySequence: "ASC" },
        }
      );

      if (!covers.length) {
        throw new NotFoundException(
          errorMessages.opportunityNotPresent(opportunityId)
        );
      }

      return covers.map((cover) => ({
        id: cover.id,
        opportunityId: cover.opportunityId,
        policyTypeId: cover.policyTypeId,
        coverId: cover.coverId,
        mandatory: cover.mandateType,
        approvalRequired: cover.approvalRequired,
        coverName: cover.coverName,
        coverDescription: cover.coverDescription,
        displaySequence: cover.displaySequence,
        displayCategory: cover.displayCategory,
        coverTypeLid: cover.coverTypeLid,
        inputType: cover.inputType,
        inputLov: cover.inputLov,
        coversMeta: this.reconcileCoverMetaRequired(
          cover.coversMeta,
          cover.mandateType
        ),
        sectionId: cover.sectionId,
        visibleUntilActivityKey: cover.visibleUntilActivityKey,
      }));
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }

  async getContactDetailsByOpportunityId(opportunityId: number) {
    const opportunityContactMap = await this.opportunityRepository.manager.find(
      OpportunityContactMap,
      {
        where: { opportunityId },
        relations: ["contact", "contact.communicationDetails"],
        select: {
          contact: {
            id: true,
            displayName: true,
            communicationDetails: {
              communicationType: true,
              communicationDetails: true,
            },
          },
        },
      }
    );

    const contacts = opportunityContactMap.map((map) => {
      const email = map.contact.communicationDetails.find(
        (detail) => detail.communicationType === "email"
      )?.communicationDetails;

      const phone = map.contact.communicationDetails.find(
        (detail) => detail.communicationType === "phone"
      )?.communicationDetails;

      return {
        name: map.contact.displayName,
        email: email || null,
        phone: phone || null,
      };
    });

    return contacts;
  }

  async createMandateDetailsEntry(
    entityManager: EntityManager,
    mandateDetails: UpdateMandateDto
  ): Promise<OpportunityMandateDetailsEntry> {
    try {
      // const opportunity = await this.validateDates(mandateDetails);
      const existingMandate = await entityManager.findOne(
        OpportunityMandateDetailsEntry,
        {
          where: {
            opportunityId: mandateDetails.opportunityId,
            activityId: mandateDetails.activityId,
          },
        }
      );
      if (
        mandateDetails.activityStatusKey === ACTIVITY_STATUS.COMPLETE &&
        mandateDetails.mandateDetailsFromFields.compensationPayable <= 0
      ) {
        throw new BadRequestException(
          "Compensation payable must be greater than 0"
        );
      }
      if (existingMandate) {
        const mandateDetailsStatus = await entityManager.findOne(LookUp, {
          where: { id: existingMandate.statusLid },
        });
        if (!mandateDetailsStatus) {
          throw new NotFoundException(
            `Status with ID ${existingMandate.statusLid} not found`
          );
        }
        if (
          mandateDetailsStatus.lookUpKey ===
            OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED ||
          mandateDetailsStatus.lookUpKey === OPPORTUNITY_ACTIVITY_STATUS.CLOSED
        ) {
          throw new BadRequestException(
            `Mandate with opportunity activity ID ${existingMandate.opportunityActivityId} cannot be updated as it is already submitted.`
          );
        }
        await entityManager.update(
          OpportunityMandateDetailsEntry,
          existingMandate.id,
          {
            mandateTypeLid:
              mandateDetails?.mandateDetailsFromFields?.mandateTypeLid ?? null,
            validFrom:
              mandateDetails?.mandateDetailsFromFields?.validFrom ?? null,
            validTo: mandateDetails?.mandateDetailsFromFields?.validTo ?? null,
            compensationPayable:
              mandateDetails?.mandateDetailsFromFields?.compensationPayable ??
              null,
            compensationTypeLid:
              mandateDetails?.mandateDetailsFromFields?.compensationTypeLid ??
              null,
            issuedOn:
              mandateDetails?.mandateDetailsFromFields?.issuedOn ?? null,
            remarks: mandateDetails?.mandateDetailsFromFields?.remarks ?? null,
            statusLid: mandateDetails?.statusLid,
            updatedBy: mandateDetails.updatedBy,
          }
        );
        const mandateActivityData =
          await this.getMandateDetailsByOpportunityAndActivity(
            existingMandate.opportunityId,
            existingMandate.activityId
          );
        return mandateActivityData;
      } else {
        const mandate = entityManager.create(OpportunityMandateDetailsEntry, {
          opportunityId: mandateDetails.opportunityId,
          activityId: mandateDetails.activityId,
          // companyId: opportunity?.companyId ?? null,
          activityDate: new Date(), // Use current date as activityDate
          planDate: mandateDetails?.planDate ?? null,
          mandateTypeLid:
            mandateDetails?.mandateDetailsFromFields?.mandateTypeLid ?? null,
          validFrom:
            mandateDetails?.mandateDetailsFromFields?.validFrom ?? null,
          validTo: mandateDetails?.mandateDetailsFromFields?.validTo ?? null,
          compensationPayable:
            mandateDetails?.mandateDetailsFromFields?.compensationPayable ??
            null,
          compensationTypeLid:
            mandateDetails?.mandateDetailsFromFields?.compensationTypeLid ??
            null,
          issuedOn: mandateDetails?.mandateDetailsFromFields?.issuedOn ?? null,
          remarks: mandateDetails?.mandateDetailsFromFields?.remarks ?? null,
          opportunityActivityId: mandateDetails.opportunityActivityId,
          statusLid: mandateDetails.statusLid,
          createdBy: mandateDetails.createdBy,
          updatedBy: mandateDetails.updatedBy,
        });
        return await entityManager.save(
          OpportunityMandateDetailsEntry,
          mandate
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(
        `Failed to save mandate details: ${error.message}`
      );
    }
  }

  async saveMandateDetailsEntry(
    entityManager: EntityManager,
    opportunityActivityId: number,
    mandateDetails: Partial<OpportunityMandateDetailsEntry>,
    userId: number
  ) {
    try {
      const repo = entityManager.getRepository(OpportunityMandateDetailsEntry);

      let mandateDetailsEntry = await repo.findOne({
        where: { opportunityActivityId },
      });

      if (mandateDetailsEntry) {
        mandateDetailsEntry = repo.merge(mandateDetailsEntry, {
          ...mandateDetails,
          updatedBy: userId,
          updatedAt: new Date(),
        });
      } else {
        mandateDetailsEntry = repo.create({
          ...mandateDetails,
          opportunityActivityId,
          activityDate: new Date(),
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.validateDates(mandateDetails);

      return await repo.save(mandateDetailsEntry);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new BadRequestException(
        `Failed to save mandate details: ${error.message}`
      );
    }
  }

  async validateDates(mandateDetails: Partial<OpportunityMandateDetailsEntry>) {
    try {
      if (mandateDetails.validFrom && mandateDetails.validTo) {
        // Helper to compare only date part (ignoring time)
        const toDateOnly = (date: Date | string | undefined | null): number => {
          if (!date) return NaN;
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        };

        const validFrom = toDateOnly(mandateDetails.validFrom);
        const validTo = toDateOnly(mandateDetails.validTo);

        // as per the discussion with the team only validFrom and validTo validation is required
        // Validation: validFrom must be before validTo
        if (validFrom >= validTo) {
          throw new BadRequestException("Valid From must be before Valid To");
        }
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Date validation failed: ${error.message}`);
    }
  }

  async updateMandateDetails(
    entityManager: EntityManager,
    opportunityActivityId: number,
    updateData: UpdateMandateDto,
    userId: number
  ) {
    try {
      const mandateDetails = await entityManager.findOne(
        OpportunityMandateDetailsEntry,
        { where: { opportunityActivityId } }
      );
      if (!mandateDetails) {
        throw new NotFoundException(
          `Mandate with opportunity activity ID ${opportunityActivityId} not found`
        );
      }
      const mandateDetailsStatus = await entityManager.findOne(LookUp, {
        where: { id: mandateDetails.statusLid },
      });
      if (!mandateDetailsStatus) {
        throw new NotFoundException(
          `Status with ID ${mandateDetails.statusLid} not found`
        );
      }
      if (
        mandateDetailsStatus.lookUpKey ===
          OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED ||
        mandateDetailsStatus.lookUpKey === OPPORTUNITY_ACTIVITY_STATUS.CLOSED
      ) {
        throw new BadRequestException(
          `Mandate with opportunity activity ID ${opportunityActivityId} cannot be updated as it is already submitted.`
        );
      }
      // await this.validateDates(updateData);
      if (
        updateData.activityStatusKey === ACTIVITY_STATUS.COMPLETE &&
        updateData?.mandateDetailsFromFields?.compensationPayable <= 0
      ) {
        throw new BadRequestException(
          "Compensation payable must be greater than 0"
        );
      }
      // Perform the update
      await entityManager.update(
        OpportunityMandateDetailsEntry,
        mandateDetails.id,
        {
          mandateTypeLid:
            updateData?.mandateDetailsFromFields?.mandateTypeLid ?? null,
          validFrom: updateData?.mandateDetailsFromFields?.validFrom ?? null,
          validTo: updateData?.mandateDetailsFromFields?.validTo ?? null,
          compensationPayable:
            updateData?.mandateDetailsFromFields?.compensationPayable ?? null,
          compensationTypeLid:
            updateData?.mandateDetailsFromFields?.compensationTypeLid ?? null,
          issuedOn: updateData?.mandateDetailsFromFields?.issuedOn ?? null,
          remarks: updateData?.mandateDetailsFromFields?.remarks ?? null,
          statusLid: updateData?.statusLid ?? mandateDetails.statusLid,
          updatedBy: userId,
        }
      );
      return await entityManager.findOne(OpportunityMandateDetailsEntry, {
        where: { opportunityActivityId },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new Error(`Failed to update mandate details: ${error.message}`);
    }
  }

  async saveMandateDocuments(
    entityManager: EntityManager,
    mandateId: number,
    documents: OpportunityActivityDocumentDto[]
  ): Promise<void> {
    try {
      // Fetch existing documents for the mandate
      const existingDocuments = await entityManager.find(
        OpportunityMandateDetailsDocumentMap,
        { where: { mandateId } }
      );
      const existingDocumentIds = existingDocuments.map(
        (doc) => doc.documentId
      );
      const incomingDocumentIds = documents.map((doc) => doc.documentId);
      // Determine documents to add
      const documentsToAdd = documents.filter(
        (doc) => !existingDocumentIds.includes(doc.documentId)
      );
      // Determine documents to remove
      const documentsToRemove = existingDocuments.filter(
        (doc) => !incomingDocumentIds.includes(doc.documentId)
      );
      // Add new documents
      if (documentsToAdd.length > 0) {
        const documentRecordsToAdd = documentsToAdd.map((doc) =>
          entityManager.create(OpportunityMandateDetailsDocumentMap, {
            mandateId,
            documentId: doc.documentId,
            documentTypeLid: doc.documentTypeLid,
          })
        );
        await entityManager.save(
          OpportunityMandateDetailsDocumentMap,
          documentRecordsToAdd
        );
      }
      // Remove documents that are no longer in the list
      if (documentsToRemove.length > 0) {
        const documentIdsToRemove = documentsToRemove.map(
          (doc) => doc.documentId
        );
        await entityManager.delete(OpportunityMandateDetailsDocumentMap, {
          mandateId,
          documentId: In(documentIdsToRemove),
        });
      }
    } catch (error) {
      throw new Error(`Failed to save mandate documents: ${error.message}`);
    }
  }

  async saveMandateContacts(
    entityManager: EntityManager,
    mandateId: number,
    companyId: number,
    contacts: number[]
  ): Promise<void> {
    try {
      // Fetch existing contacts for the mandate
      const existingContacts = await entityManager.find(
        OpportunityMandateDetailsContactMap,
        { where: { mandateId } }
      );
      const existingContactIds = existingContacts.map(
        (contact) => contact.contactId
      );
      const incomingContactIds = contacts; // contacts is now an array of numbers
      // Determine contacts to add
      const contactsToAdd = incomingContactIds.filter(
        (contactId) => !existingContactIds.includes(contactId)
      );
      // Determine contacts to remove
      const contactsToRemove = existingContactIds.filter(
        (contactId) => !incomingContactIds.includes(contactId)
      );
      // Add new contacts
      if (contactsToAdd.length > 0) {
        const contactRecordsToAdd = await Promise.all(
          contactsToAdd.map(async (contactId) => {
            // Validate if the contact exists for the given company
            const isContactExists = await this.fetchByCompanyContactId(
              companyId,
              contactId
            );
            if (!isContactExists) {
              throw new BadRequestException(
                `Contact with ID ${contactId} does not exist for company ID ${companyId}`
              );
            }
            return entityManager.create(OpportunityMandateDetailsContactMap, {
              mandateId,
              contactId,
            });
          })
        );
        await entityManager.save(
          OpportunityMandateDetailsContactMap,
          contactRecordsToAdd
        );
      }
      // Remove contacts that are no longer in the list
      if (contactsToRemove.length > 0) {
        await entityManager.delete(OpportunityMandateDetailsContactMap, {
          mandateId,
          contactId: In(contactsToRemove),
        });
      }
    } catch (error) {
      throw new BadRequestException(
        `Failed to save mandate contacts: ${error.message}`
      );
    }
  }

  // Fetch mandate details by opportunityId and activityId
  async getMandateDetailsByOpportunityAndActivity(
    opportunityId: number,
    activityId: number
  ): Promise<any> {
    try {
      const mandateDetails = await this.mandateDetailsEntryRepository.findOne({
        where: { opportunityId, activityId },
        relations: ["mandateDetailsContacts", "mandateDetailsDocuments"],
      });

      if (!mandateDetails) {
        throw new NotFoundException(
          `Mandate details not found for Opportunity ID: ${opportunityId} and Activity ID: ${activityId}`
        );
      }
      let documents: any[] = [];
      if (
        mandateDetails?.mandateDetailsDocuments &&
        mandateDetails?.mandateDetailsDocuments?.length > 0
      ) {
        documents = mandateDetails?.mandateDetailsDocuments.map((doc) => ({
          id: Number(doc.id),
          documentId: Number(doc.documentId),
          documentTypeLid: Number(doc.documentTypeLid),
        }));
      } else {
        documents = [
          {
            documentId: null,
            documentTypeLid: null,
          },
        ];
      }
      // Format and return the result
      return {
        id: Number(mandateDetails.id),
        opportunityId: Number(mandateDetails.opportunityId),
        activityId: Number(mandateDetails.activityId),
        opportunityActivityId: Number(mandateDetails.opportunityActivityId),
        statusLid: Number(mandateDetails.statusLid),
        dataActivity: {
          mandateDetailsFromFields: {
            mandateTypeLid: this.toNumberOrNull(mandateDetails.mandateTypeLid),
            validFrom: mandateDetails.validFrom,
            validTo: mandateDetails.validTo,
            compensationPayable: this.toNumberOrNull(
              mandateDetails.compensationPayable
            ),
            compensationTypeLid: this.toNumberOrNull(
              mandateDetails.compensationTypeLid
            ),
            issuedOn: mandateDetails.issuedOn,
            remarks: mandateDetails.remarks,
            mandateDetailsContacts: mandateDetails.mandateDetailsContacts.map(
              (contactMap) => Number(contactMap.contactId)
            ),
          },
          documents: documents,
        },
      };
    } catch (error) {
      throw new Error(`Failed to retrieve mandate details: ${error.message}`);
    }
  }

  async getExistingMandateDetails(opportunityActivityId: number): Promise<any> {
    try {
      const opportunityActivity =
        await this.opportunityActivityMapRepository.findOne({
          where: { id: opportunityActivityId },
        });
      const opportunity = await this.opportunityRepository.findOne({
        where: { opportunityId: opportunityActivity?.opportunityId },
        select: ["opportunityId", "companyId"],
      });
      const mandateDetails = await this.mandateDetailsEntryRepository.findOne({
        where: { companyId: opportunity?.companyId },
        order: { validTo: "DESC" },
        relations: [
          "mandateDetailsContacts",
          "mandateDetailsDocuments",
          "mandateDetailsDocuments.documentType",
          "mandateDetailsDocuments.document",
        ],
      });
      if (!mandateDetails) {
        return null;
      }
      let documents: any[] = [];
      if (
        mandateDetails?.mandateDetailsDocuments &&
        mandateDetails?.mandateDetailsDocuments?.length > 0
      ) {
        documents = mandateDetails?.mandateDetailsDocuments?.map((doc) => ({
          id: Number(doc.id),
          documentId: Number(doc.documentId),
          documentTypeLid: Number(doc.documentTypeLid),
          fileName: doc.document?.fileKey
            ? doc?.document?.fileKey?.split("/")?.pop()
            : null,
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
      // Format and return the result
      return {
        id: Number(mandateDetails?.id),
        opportunityId: Number(mandateDetails?.opportunityId),
        activityId: Number(mandateDetails?.activityId),
        opportunityActivityId: Number(mandateDetails?.opportunityActivityId),
        statusLid: Number(mandateDetails?.statusLid),
        dataActivity: {
          mandateDetailsFromFields: {
            mandateTypeLid: Number(mandateDetails?.mandateTypeLid),
            validFrom: mandateDetails?.validFrom,
            validTo: mandateDetails?.validTo,
            compensationPayable: Number(mandateDetails?.compensationPayable),
            compensationTypeLid: Number(mandateDetails?.compensationTypeLid),
            issuedOn: mandateDetails?.issuedOn,
            remarks: mandateDetails?.remarks,
            mandateDetailsContacts: mandateDetails?.mandateDetailsContacts?.map(
              (contactMap) => Number(contactMap.contactId)
            ),
          },
          documents: documents,
        },
      };
    } catch (error) {
      throw new Error(`Failed to retrieve mandate details: ${error.message}`);
    }
  }

  async getOpportunityActivity(
    opportunityActivityId: number
  ): Promise<OpportunityActivityMap | null> {
    return await this.opportunityActivityMapRepository.findOne({
      where: { id: opportunityActivityId },
    });
  }

  async getOpportunityRfpCovers(
    opportunityId: number
  ): Promise<OpportunityCoverMap[]> {
    return await this.opportunityRepository.manager.find(OpportunityCoverMap, {
      where: { opportunityId },
    });
  }

  // async saveRfpCoverDetails(
  //   opportunityId: number,
  //   opportunityActivityId: number,
  //   rfpCoverDetails: any[],
  //   remarks: string,
  //   documents: { documentTypeLid: number; documentId: number }[],
  //   createdBy: number,
  //   statusLid: number
  // ): Promise<void> {
  //   await this.opportunityRepository.manager.transaction(
  //     async (transactionalEntityManager) => {
  //       try {
  //         // Save RFP cover details
  //         await transactionalEntityManager.save(
  //           OpportunityRfpCoverDetail,
  //           rfpCoverDetails
  //         );

  //         // Save opportunity_rfp_detail data
  //         const opportunityRfpDetails = transactionalEntityManager.create(
  //           OpportunityRfpDetail,
  //           {
  //             opportunityId,
  //             opportunityActivityId,
  //             remarks,
  //             statusLid: statusLid,
  //             createdBy,
  //             updatedBy: createdBy,
  //           }
  //         );
  //         const savedRfpDetail = await transactionalEntityManager.save(
  //           OpportunityRfpDetail,
  //           opportunityRfpDetails
  //         );

  //         // Save document records if present
  //         if (documents) {
  //           const documentRecords = documents.map((doc) =>
  //             transactionalEntityManager.create(
  //               OpportunityRfpActivityDocumentMap,
  //               {
  //                 opportunityActivityMapId: opportunityActivityId,
  //                 rfpDetailId: savedRfpDetail.id,
  //                 documentId: doc.documentId,
  //                 documentTypeLid: doc.documentTypeLid, // Assuming documentTypeLid is not provided
  //               }
  //             )
  //           );

  //           await transactionalEntityManager.save(
  //             OpportunityRfpActivityDocumentMap,
  //             documentRecords
  //           );

  //           if (documentRecords && documentRecords.length > 0) {
  //             await this.updateDocumentStatus(
  //               transactionalEntityManager,
  //               documentRecords.map((doc) => doc.documentId) || []
  //             );
  //           }
  //         }
  //       } catch (error) {
  //         if (
  //           error instanceof NotFoundException ||
  //           error instanceof BadRequestException
  //         ) {
  //           throw error; // Re-throw known exceptions
  //         }
  //         console.error("Error in saveRfpCoverDetails transaction:", error);
  //         throw new BadRequestException(
  //           `Failed to save RFP cover details: ${error.message}`
  //         );
  //       }
  //     }
  //   );
  // }

  // async updateRfpCoverDetails(
  //   opportunityId: number,
  //   opportunityActivityId: number,
  //   rfpCoverDetails: any[],
  //   remarks: string,
  //   documents: { documentTypeLid: number; documentId: number }[],
  //   updatedBy: number,
  //   statusLid: number
  // ): Promise<void> {
  //   await this.opportunityRepository.manager.transaction(
  //     async (transactionalEntityManager) => {
  //       try {
  //         for (const detail of rfpCoverDetails) {
  //           const existing = await transactionalEntityManager.findOne(
  //             OpportunityRfpCoverDetail,
  //             {
  //               where: { opportunityId, coverMapId: detail.coverMapId },
  //             }
  //           );
  //           if (existing) {
  //             await transactionalEntityManager.update(
  //               OpportunityRfpCoverDetail,
  //               { id: existing.id },
  //               { coverResponse: detail.coverResponse, updatedBy }
  //             );
  //           } else {
  //             await transactionalEntityManager.insert(
  //               OpportunityRfpCoverDetail,
  //               detail
  //             );
  //           }
  //         }

  //         let rfpDetail = await transactionalEntityManager.findOne(
  //           OpportunityRfpDetail,
  //           { where: { opportunityActivityId } }
  //         );
  //         if (rfpDetail) {
  //           await transactionalEntityManager.update(
  //             OpportunityRfpDetail,
  //             { id: rfpDetail.id },
  //             { remarks, statusLid, updatedBy }
  //           );
  //         } else {
  //           rfpDetail = await transactionalEntityManager.save(
  //             OpportunityRfpDetail,
  //             transactionalEntityManager.create(OpportunityRfpDetail, {
  //               opportunityId,
  //               opportunityActivityId,
  //               remarks,
  //               statusLid,
  //               createdBy: updatedBy,
  //               updatedBy,
  //             })
  //           );
  //         }

  //         if (documents) {
  //           await transactionalEntityManager.delete(
  //             OpportunityRfpActivityDocumentMap,
  //             { opportunityActivityMapId: opportunityActivityId }
  //           );
  //           const documentRecords = documents.map((doc) =>
  //             transactionalEntityManager.create(
  //               OpportunityRfpActivityDocumentMap,
  //               {
  //                 opportunityActivityMapId: opportunityActivityId,
  //                 rfpDetailId: rfpDetail!.id,
  //                 documentId: doc.documentId,
  //                 documentTypeLid: doc.documentTypeLid,
  //               }
  //             )
  //           );
  //           if (documentRecords.length) {
  //             await transactionalEntityManager.save(
  //               OpportunityRfpActivityDocumentMap,
  //               documentRecords
  //             );
  //           }
  //         }
  //       } catch (error) {
  //         if (
  //           error instanceof NotFoundException ||
  //           error instanceof BadRequestException
  //         ) {
  //           throw error;
  //         }
  //         console.error("Error in updateRfpCoverDetails transaction:", error);
  //         throw new BadRequestException(
  //           `Failed to update RFP cover details: ${error.message}`
  //         );
  //       }
  //     }
  //   );
  // }

  async saveRfpCoverDetails(
    opportunityId: number,
    opportunityActivityId: number,
    rfpCoverDetails: any[],
    remarks: string,
    documents: { documentTypeLid: number; documentId: number }[],
    userId: number,
    statusLid: number,
    statusKey: "SAVE_ACTIVITY" | "COMPLETE_ACTIVITY"
  ) {
    return await this.opportunityRepository.manager.transaction(
      async (manager) => {
        try {
          // 1. SAVE OPPORTUNITY_RFP_COVER_DETAIL
          for (const detail of rfpCoverDetails) {
            const existing = await manager.findOne(OpportunityRfpCoverDetail, {
              where: { opportunityId, coverMapId: detail.coverMapId },
            });

            if (existing) {
              // Update existing
              Object.assign(existing, {
                coverResponse: detail.coverResponse,
                updatedBy: userId,
              });
              await manager.save(OpportunityRfpCoverDetail, existing);
            } else {
              // Insert new
              await manager.save(OpportunityRfpCoverDetail, {
                ...detail,
                opportunityId,
                createdBy: userId,
                updatedBy: userId,
              });
            }
          }

          // 2. SAVE OPPORTUNITY_RFP_DETAIL
          let rfpDetail = await manager.findOne(OpportunityRfpDetail, {
            where: { opportunityActivityId },
          });

          if (rfpDetail) {
            // Update
            Object.assign(rfpDetail, {
              remarks,
              statusLid,
              updatedBy: userId,
            });
            await manager.save(OpportunityRfpDetail, rfpDetail);
          } else {
            // Create
            rfpDetail = await manager.save(OpportunityRfpDetail, {
              opportunityId,
              opportunityActivityId,
              remarks,
              statusLid,
              createdBy: userId,
              updatedBy: userId,
            });
          }

          // 3. SAVE DOCUMENTS
          if (documents) {
            await this.saveActivityDocuments(
              manager,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.RFP_DATA_COLLECTION_DOCUMENT_MAP,
              OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.RFP_DATA_COLLECTION_DOCUMENT_MAP_ID,
              rfpDetail.id,
              documents,
              opportunityActivityId
            );
            await this.updateExistingDocumentsStatus(
              manager,
              opportunityActivityId,
              documents.map((doc) => doc.documentId)
            );
          }

          // 4. UPDATE OPPORTUNITY_ACTIVITY_MAP STATUS
          await this.updateOpportunityActivityMapStatus(
            opportunityActivityId,
            statusLid,
            userId,
            statusKey == ACTIVITY_STATUS.COMPLETE ? new Date() : null,
            manager,
            statusKey
          );

          // 5. UPDATE NEXT ACTIVITY STATUS
          await this.updateNextActivityStatus(
            opportunityActivityId,
            statusLid,
            manager
          );

          return rfpDetail;
        } catch (error) {
          this.logError("saveRfpCoverDetails", error);
          if (
            error instanceof NotFoundException ||
            error instanceof BadRequestException
          ) {
            throw error; // Re-throw known exceptions
          }
          throw new BadRequestException(
            `Failed to save RFP cover details: ${error.message}`
          );
        }
      }
    );
  }

  async getRfpCoverDetailsByOpportunityId(
    opportunityId: number
  ): Promise<OpportunityRfpCoverDetail[]> {
    try {
      return await this.rfpCoverDetailRepository.find({
        where: { opportunityId },
      });
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }
  async createPremiumCalculation(
    entityManager: EntityManager,
    dto: Partial<OpportunityPremiumCalculation>,
    userId: number
  ): Promise<any> {
    try {
      const newRecord = entityManager.create(OpportunityPremiumCalculation, {
        ...dto,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedRecord = await entityManager.save(
        OpportunityPremiumCalculation,
        newRecord
      );

      return savedRecord;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : errorMessages.premiumCalculationError
      );
    }
  }

  async createHeldCoverNote(
    entityManager: EntityManager,
    dto: Partial<OpportunityHeldCoverNote>,
    userId: number
  ): Promise<any> {
    try {
      const newRecord = entityManager.create(OpportunityHeldCoverNote, {
        ...dto,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedRecord = await entityManager.save(
        OpportunityHeldCoverNote,
        newRecord
      );

      return savedRecord;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : errorMessages.heldCoverNoteError
      );
    }
  }

  async saveHeldCoverNote(
    entityManager: EntityManager,
    opportunityActivityId: number,
    heldCoverNoteData: Partial<OpportunityHeldCoverNote>,
    userId: number,
    activityStatusKey: string
  ) {
    try {
      const repo = entityManager.getRepository(OpportunityHeldCoverNote);

      let heldCoverNote = await repo.findOne({
        where: { opportunityActivityId },
      });

      if (heldCoverNote) {
        if (activityStatusKey === ACTIVITY_STATUS.APPROVE) {
          return heldCoverNote;
        }
        heldCoverNote = repo.merge(heldCoverNote, {
          ...heldCoverNoteData,
          updatedBy: userId,
          updatedAt: new Date(),
        });
      } else {
        heldCoverNote = repo.create({
          ...heldCoverNoteData,
          opportunityActivityId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return await repo.save(heldCoverNote);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save held cover note details: ${error.message}`
      );
    }
  }

  async getHeldCoverNoteByOpportunityActivityId(
    opportunityActivityId: number
  ): Promise<OpportunityHeldCoverNote | null> {
    try {
      const heldCoverNote = await this.opportunityRepository.manager.findOne(
        OpportunityHeldCoverNote,
        {
          where: { opportunityActivityId: opportunityActivityId },
          relations: [
            "documents",
            "opportunity",
            "placementSlipDeviations",
            "deviationsAddressed",
            "revisedHeldCoverNote",
            "resolution",
            "status",
            "coverDetails",
            "insurerDetails",
            "installmentDetails",
          ],
          order: {
            installmentDetails: {
              installmentSequence: "ASC",
            },
          },
        }
      );
      if (heldCoverNote) {
        if (Array.isArray(heldCoverNote.installmentDetails)) {
          heldCoverNote.installmentDetails =
            heldCoverNote.installmentDetails.filter(
              (installment) => !installment.deletedAt
            );
        }
        removeMetadataFields(heldCoverNote);
        removeLookUpDataFields(heldCoverNote);
      }
      return heldCoverNote || null;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }

  async saveDeviationCovers(
    entityManager: EntityManager,
    activityId: number,
    coverDetails: Record<string, string>,
    opportunityId: number,
    coverRepoName: string,
    userId: number
  ) {
    const coverRepo: Repository<any> =
      entityManager.getRepository(coverRepoName);
    const coverIds = Object.keys(coverDetails).map(Number);
    const covers = await this.getOpportunityQuoteCoverByIds(
      entityManager,
      coverIds
    );

    const coverNameMap = new Map<number, string>();
    const coverMetaMap = new Map<number, any>();
    covers.forEach((cover) => {
      coverNameMap.set(cover.id, cover.coverName ?? "");
      coverMetaMap.set(cover.id, cover.coversMeta ?? null);
    });

    await Promise.all(
      Object.entries(coverDetails).map(
        async ([coverTemplateId, coverResponse]) => {
          const whereClause: any = {
            coverTemplateId: Number(coverTemplateId),
          };

          if (COVERS_TABLE.HELD_COVER_NOTE === coverRepoName) {
            whereClause.heldCoverNoteId = Number(activityId);
          } else if (COVERS_TABLE.POLICY_HARD_COPY === coverRepoName) {
            whereClause.policyHardCopyId = Number(activityId);
          }
          const existing = await coverRepo.findOne({
            where: whereClause,
          });

          const data = {
            opportunityId,
            coverName: coverNameMap.get(Number(coverTemplateId)) ?? "",
            coversMeta: coverMetaMap.get(Number(coverTemplateId)) ?? null,
            coverResponse: String(coverResponse),
          };

          if (existing) {
            Object.assign(existing, {
              ...data,
              updatedBy: userId,
              updatedAt: new Date(),
            });
            await coverRepo.save(existing);
          } else {
            const saveData: any = {
              ...data,
              coverTemplateId: Number(coverTemplateId),
              createdBy: userId,
              updatedBy: userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            };

            if (COVERS_TABLE.HELD_COVER_NOTE === coverRepoName) {
              saveData.heldCoverNoteId = Number(activityId);
            } else if (COVERS_TABLE.POLICY_HARD_COPY === coverRepoName) {
              saveData.policyHardCopyId = Number(activityId);
            }

            await coverRepo.save(saveData);
          }
        }
      )
    );
  }

  async updatePolicyCovers(
    entityManager: EntityManager,
    coverDetails: Record<string, string>
  ) {
    try {
      await Promise.all(
        Object.entries(coverDetails).map(
          async ([coverTemplateId, coverResponse]) => {
            const existing = await entityManager.findOne(PolicyCoverMap, {
              where: {
                coverTemplateId: Number(coverTemplateId),
              },
            });

            if (existing) {
              Object.assign(existing, {
                coverResponse: coverResponse,
                updatedAt: new Date(),
              });
              await entityManager.save(PolicyCoverMap, existing);
            }
          }
        )
      );
    } catch (error) {
      throw new BadRequestException(
        `Failed to update policy covers: ${error.message}`
      );
    }
  }

  async getRfpActivityDetails(
    opportunityActivityId: number
  ): Promise<OpportunityRfpDetail> {
    try {
      const rfpActivityDetails =
        await this.opportunityRepository.manager.findOne(OpportunityRfpDetail, {
          where: { opportunityActivityId },
        });

      if (!rfpActivityDetails) {
        throw new NotFoundException(
          `RFP Activity Details not found for Opportunity Activity ID: ${opportunityActivityId}`
        );
      }

      return rfpActivityDetails;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }
  async getRfpActivityDocuments(opportunityActivityMapId: number) {
    try {
      const rfpActivityDocuments =
        await this.opportunityRepository.manager.find(
          OpportunityRfpActivityDocumentMap,
          {
            where: { opportunityActivityMapId },
            relations: ["document", "document.documentType"],
          }
        );

      return rfpActivityDocuments?.length > 0
        ? rfpActivityDocuments.map((doc) => ({
            id: Number(doc.id),
            documentId: Number(doc.documentId),
            documentTypeLid: Number(doc.documentTypeLid),
            fileName: doc?.document?.fileKey?.split("/")?.pop() || null,
            documentType: doc?.document?.documentType?.lookUpValue || null,
          }))
        : [];
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }

  async createPolicyConfirmation(
    entityManager: EntityManager,
    dto: Partial<OpportunityPolicyConfirmation>,
    userId: number
  ): Promise<any> {
    try {
      const newRecord = entityManager.create(OpportunityPolicyConfirmation, {
        ...dto,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedRecord = await entityManager.save(
        OpportunityPolicyConfirmation,
        newRecord
      );

      return savedRecord;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : errorMessages.policyConfirmationDataFailed
      );
    }
  }

  async savePolicyConfirmation(
    entityManager: EntityManager,
    opportunityActivityId: number,
    policyConfirmationData: Partial<OpportunityPolicyConfirmation>,
    userId: number
  ) {
    try {
      const repo = entityManager.getRepository(OpportunityPolicyConfirmation);

      let policyConfirmation = await repo.findOne({
        where: { opportunityActivityId },
      });

      if (policyConfirmation) {
        policyConfirmation = repo.merge(policyConfirmation, {
          ...policyConfirmationData,
          updatedBy: userId,
          updatedAt: new Date(),
        });
      } else {
        policyConfirmation = repo.create({
          ...policyConfirmationData,
          opportunityActivityId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return await repo.save(policyConfirmation);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save policy confirmation details: ${error.message}`
      );
    }
  }

  async createPolicyHardCopy(
    entityManager: EntityManager,
    dto: Partial<OpportunityPolicyHardCopy>,
    userId: number
  ): Promise<any> {
    try {
      const newRecord = entityManager.create(OpportunityPolicyHardCopy, {
        ...dto,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedRecord = await entityManager.save(
        OpportunityPolicyHardCopy,
        newRecord
      );

      // Persist insurer policy number on the base policy table
      await entityManager.update(
        Policy,
        { opportunityId: dto.opportunityId as number },
        { insurerPolicyNumber: dto.insurerPolicyNo as string }
      );

      return savedRecord;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : errorMessages.policyConfirmationDataFailed
      );
    }
  }

  async savePolicyHardCopyReceipt(
    entityManager: EntityManager,
    opportunityActivityId: number,
    policyHardCopyData: Partial<OpportunityPolicyHardCopy>,
    userId: number
  ) {
    try {
      const repo = entityManager.getRepository(OpportunityPolicyHardCopy);

      let policyHardCopy = await repo.findOne({
        where: { opportunityActivityId },
      });

      if (policyHardCopy) {
        policyHardCopy = repo.merge(policyHardCopy, {
          ...policyHardCopyData,
          updatedBy: userId,
          updatedAt: new Date(),
        });
      } else {
        policyHardCopy = repo.create({
          ...policyHardCopyData,
          opportunityActivityId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return await repo.save(policyHardCopy);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save policy hard copy receipt details: ${error.message}`
      );
    }
  }

  createQuoteEntity(
    opportunity_activity_id: number,
    dto: CreateQuoteDto,
    userId: number
  ): OpportunityQuoteEntry {
    return this.quoteRepo.create({
      opportunityId: dto.opportunityId,
      opportunityActivityId: opportunity_activity_id,
      brokingSlipId: dto.brokingSlipId,
      insurerId: dto.quoteDetails?.insurerId,
      insurerLocationId: dto.quoteDetails?.insurerLocationId,
      quoteReceivedOn: dto.quoteDetails?.quoteReceivedOn,
      basicPremium: dto.quoteDetails?.basicPremium,
      terrorism: dto.quoteDetails?.terrorism,
      netPremium: dto.quoteDetails?.netPremium,
      insurerRemarks: dto.netPremiumDetails?.insurerRemarks,
      attachmentUrl: dto.attachmentUrl,
      statusId: dto.statusId,
      basicBrokeragePercentage: dto.quoteDetails?.basicBrokeragePercentage,
      srccPercentage: dto.quoteDetails?.srccPercentage,
      srccAmount: dto.quoteDetails?.srccAmount,
      srccBrokerageAmount: dto.quoteDetails?.srccBrokerageAmount,
      terrorismBrokeragePercentage:
        dto.quoteDetails?.terrorismBrokeragePercentage,
      tcBrokerageAmount: dto.quoteDetails?.tcBrokerageAmount,
      basicBrokerageAmount: dto.quoteDetails?.basicBrokerageAmount,
      gstPercentage: dto.quoteDetails?.gstPercentage,
      gstAmount: dto.quoteDetails?.gstAmount,
      // totalGrossPremiumIncTax: dto.quoteDetails?.totalGrossPremiumIncTax,
      feePercentage: dto.quoteDetails?.feePercentage,
      fee: dto.quoteDetails?.fee,
      otherPercentage: dto.quoteDetails?.otherPercentage,
      other: dto.quoteDetails?.other,
      adminChargesPercentage: dto.quoteDetails?.adminChargesPercentage,
      adminCharges: dto.quoteDetails?.adminCharges,
      cessPercentage: dto.quoteDetails?.cessPercentage,
      cessAmount: dto.quoteDetails?.cessAmount,
      grossPremium: dto.quoteDetails?.grossPremium,
      totalBrokerageAmount: dto.quoteDetails?.totalBrokerageAmount,
      createdBy: userId,
      updatedBy: userId,
    });
  }

  async saveQuote(
    quote: OpportunityQuoteEntry,
    manager: EntityManager
  ): Promise<OpportunityQuoteEntry> {
    return manager.save(OpportunityQuoteEntry, quote);
  }

  async findOpportunityById(
    opportunityId: number,
    entityManager: EntityManager
  ): Promise<Opportunity | null> {
    try {
      const opportunity = await entityManager.findOne(Opportunity, {
        where: { opportunityId },
      });

      if (!opportunity) {
        throw new NotFoundException(
          `Opportunity with ID ${opportunityId} not found.`
        );
      }

      return opportunity;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch opportunity with ID ${opportunityId}.`
      );
    }
  }
  async findQuoteById(
    quoteId: number,
    manager: EntityManager
  ): Promise<OpportunityQuoteEntry | null> {
    return manager.findOne(OpportunityQuoteEntry, { where: { id: quoteId } });
  }

  async findQuotesByBrokingSlipAndActivity(
    brokingSlipId: number,
    opportunityActivityId: number
  ): Promise<OpportunityQuoteEntry[]> {
    try {
      // Validate input parameters
      if (!brokingSlipId || !opportunityActivityId) {
        throw new BadRequestException(
          "Both brokingSlipId and opportunityActivityId are required."
        );
      }

      // Fetch quotes using the repository's `find` method
      const quotes = await this.quoteRepo.find({
        where: {
          brokingSlipId,
          opportunityActivityId,
        },
        relations: [
          "coverDetails", // Include coverDetails relation
          "opportunity",
          "insurer",
          "status",
          "documentMappings",
        ],
      });
      console.log("Fetched quotes:", quotes);
      // Check if quotes were found
      if (!quotes || quotes.length === 0) {
        throw new NotFoundException(errorMessages.opportunityQuoteNotFound);
      }

      // Return the fetched quotes
      return quotes;
    } catch (error) {
      console.error("Error fetching quotes:", error);
      // Handle specific exceptions
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Log and rethrow unexpected errors

      throw new BadRequestException(errorMessages.quoteRetrievalFailed);
    }
  }

  async findQuotesByBrokingSlip(
    brokingSlipId: number
  ): Promise<OpportunityQuoteEntry[]> {
    try {
      if (!brokingSlipId) {
        throw new BadRequestException("brokingSlipId is required.");
      }

      return this.quoteRepo
        .createQueryBuilder("entry")
        .leftJoinAndMapOne(
          "entry.opportunityQuote",
          OpportunityQuote,
          "quote",
          "quote.id = entry.id"
        )
        .leftJoinAndMapMany(
          "entry.quoteDocuments",
          OpportunityQuoteDocumentMap,
          "quoteDoc",
          "quoteDoc.opportunity_activity_id = quote.id"
        )
        .leftJoinAndMapMany(
          "entry.taxDetails",
          OpportunityQuoteTaxMap,
          "tax",
          "tax.opportunity_quote_entry_id = entry.id"
        )
        .leftJoinAndSelect("entry.coverDetails", "coverDetails")
        .leftJoinAndSelect("entry.documentMappings", "entryDocs")
        .leftJoinAndSelect("entry.insurer", "insurer")
        .where("entry.broking_slip_id = :brokingSlipId", { brokingSlipId })
        .andWhere("entry.deleted_at IS NULL")
        .getMany();
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(errorMessages.quoteRetrievalFailed);
    }
  }
  async createPolicyDocket(
    entityManager: EntityManager,
    dto: Partial<OpportunityPolicyDocket>,
    userId: number
  ): Promise<any> {
    try {
      const newRecord = entityManager.create(OpportunityPolicyDocket, {
        ...dto,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedRecord = await entityManager.save(
        OpportunityPolicyDocket,
        newRecord
      );

      return savedRecord;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : errorMessages.policyDocketDataFailed
      );
    }
  }

  async getPolicyDocketByOpportunityActivityId(
    opportunityActivityId: number
  ): Promise<OpportunityPolicyDocket | null> {
    try {
      const policyDocket = await this.opportunityRepository.manager.findOne(
        OpportunityPolicyDocket,
        {
          where: { opportunityActivityId: opportunityActivityId },
          relations: ["documents", "status", "opportunity"],
        }
      );
      if (policyDocket) {
        removeMetadataFields(policyDocket);
        removeLookUpDataFields(policyDocket);
      }
      return policyDocket || null;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : errorMessages.policyDocketNotFound
      );
    }
  }

  async updatePolicyDocket(
    entityManager: EntityManager,
    policyDocketId: number,
    updateData: Partial<OpportunityPolicyDocket>,
    userId: number
  ): Promise<any> {
    try {
      // Exclude documents from the update
      const fieldsToUpdate: any = {
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date(),
      };

      // Perform the update
      const result = await entityManager.update(
        OpportunityPolicyDocket,
        { id: policyDocketId },
        fieldsToUpdate
      );
      return result;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update policy docket: ${error.message}`
      );
    }
  }

  async savePolicyDocket(
    entityManager: EntityManager,
    opportunityActivityId: number,
    policyDocketData: Partial<OpportunityPolicyDocket>,
    userId: number
  ) {
    try {
      const repo = entityManager.getRepository(OpportunityPolicyDocket);

      let policyDocket = await repo.findOne({
        where: { opportunityActivityId },
      });

      if (policyDocket) {
        policyDocket = repo.merge(policyDocket, {
          ...policyDocketData,
          updatedBy: userId,
          updatedAt: new Date(),
        });
      } else {
        policyDocket = repo.create({
          ...policyDocketData,
          opportunityActivityId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return await repo.save(policyDocket);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save policy docket details: ${error.message}`
      );
    }
  }

  async updateHeldCoverNoteActivity(
    entityManager: EntityManager,
    heldCoverNoteId: number,
    updateData: Partial<OpportunityHeldCoverNote>,
    userId: number
  ): Promise<any> {
    try {
      await entityManager.update(
        OpportunityHeldCoverNote,
        { id: heldCoverNoteId },
        {
          ...updateData,
          updatedBy: userId,
          updatedAt: new Date(),
        }
      );
      const updatedRecord = await entityManager.findOne(
        OpportunityHeldCoverNote,
        {
          where: { id: heldCoverNoteId },
        }
      );

      if (updatedRecord) {
        removeMetadataFields(updatedRecord);
        removeLookUpDataFields(updatedRecord);
      }

      return updatedRecord ?? updateData;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update held cover note: ${error.message}`
      );
    }
  }

  async getEntityTableMapIds(
    entity: string,
    select: string,
    whereCondition: any
  ): Promise<any[]> {
    try {
      const data = await this.entityService.getEntityMapByIds(
        entity,
        select,
        whereCondition
      );
      return data;
    } catch (error) {
      return [];
    }
  }

  async deleteEntityTableMapIds(
    entity: string,
    deleteIds: number[],
    select: string,
    deletionType: string
  ): Promise<void> {
    try {
      await this.entityService.deleteEntityMapByIds(
        entity,
        deleteIds,
        select,
        deletionType
      );
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  private normalizeInstallmentDetails(installmentDetails: any[] = []) {
    const normalizeNumber = (value: any) => {
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === "string" && value.trim() === "") {
        return null;
      }
      const num = Number(value);
      return Number.isNaN(num) ? null : num;
    };

    return installmentDetails
      .map((installment: any) => {
        const normalizedDate =
          typeof installment?.installmentDate === "string"
            ? installment.installmentDate.trim()
            : installment?.installmentDate;

        return {
          ...installment,
          installmentDate: normalizedDate || null,
          installmentNetAmount: normalizeNumber(installment?.installmentNetAmount),
          installmentNo: installment?.installmentNo ?? null,
          installmentSequence: normalizeNumber(installment?.installmentSequence),
          installmentPercentage: normalizeNumber(installment?.installmentPercentage),
          taxPercentage: normalizeNumber(installment?.taxPercentage),
          taxAmount: normalizeNumber(installment?.taxAmount),
          installmentGrossAmount: normalizeNumber(
            installment?.installmentGrossAmount
          ),
          modeOfPayment: installment?.modeOfPayment ?? null,
        };
      })
      .filter((installment) => !!installment.installmentDate);
  }

  async getPlacementSlipInstallmentsByOpportunityId(
    opportunityId: number
  ): Promise<any[]> {
    const placementActivity =
      await this.opportunityActivityMapRepository.findOne({
        where: {
          opportunityId,
          activityKey: ACTIVITY_KEY.PLACEMENT_SLIP_GENERATION_ACTIVITY,
        },
        order: { activityOrder: "DESC" },
      });

    if (!placementActivity) {
      return [];
    }

    const placement = await this.placementRepo.findOne({
      where: { opportunityActivityId: placementActivity.id },
      relations: ["installmentDetails"],
      order: {
        installmentDetails: {
          installmentSequence: "ASC",
        },
      },
    });

    if (!placement || !Array.isArray(placement.installmentDetails)) {
      return [];
    }

    return placement.installmentDetails.filter((inst) => !inst.deletedAt);
  }

  async replacePolicyInstallments(
    entityManager: EntityManager,
    opportunityId: number,
    installments: any[],
    userId: number
  ): Promise<void> {
    const policy = await entityManager.findOne(Policy, {
      where: { opportunityId },
    });

    if (!policy) {
      return;
    }

    await entityManager.delete(PolicyInstallments, { policyId: policy.id });

    if (!Array.isArray(installments) || installments.length === 0) {
      return;
    }

    const normalized = this.normalizeInstallmentDetails(installments).map(
      (installment) => ({
        policyId: policy.id,
        installmentDate: installment.installmentDate ?? null,
        installmentNetAmount: installment.installmentNetAmount,
        installmentNo: installment.installmentNo ?? null,
        installmentSequence: installment.installmentSequence ?? null,
        installmentPercentage: installment.installmentPercentage,
        taxPercentage: installment.taxPercentage,
        taxAmount: installment.taxAmount,
        installmentGrossAmount: installment.installmentGrossAmount,
        modeOfPayment: installment.modeOfPayment ?? null,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );

    if (!normalized.length) {
      return;
    }

    await entityManager.save(PolicyInstallments, normalized);
  }

  private async upsertActivityInstallments(params: {
    repo: Repository<any>;
    entityName: string;
    parentField: string;
    parentId: number;
    opportunityActivityId: number;
    installments?: any[];
    userId: number;
  }) {
    const {
      repo,
      entityName,
      parentField,
      parentId,
      opportunityActivityId,
      installments = [],
      userId,
    } = params;

    const normalized = this.normalizeInstallmentDetails(installments).map(
      (installment) => ({
        ...installment,
        [parentField]: parentId,
        opportunityActivityId,
      })
    );

    const existingIds: number[] = await this.getEntityTableMapIds(
      entityName,
      OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
      { [parentField]: parentId }
    );

    const existingRows = await repo.find({
      where: { [parentField]: parentId },
    });
    const existingById = new Map<number, any>(
      existingRows.map((row) => [row.id, row])
    );

    const hasRowChanged = (incoming: any, existing: any) => {
      if (!existing) return true;
      const fieldsToCompare = [
        "installmentDate",
        "installmentNetAmount",
        "installmentNo",
        "installmentSequence",
        "installmentPercentage",
        "taxPercentage",
        "taxAmount",
        "installmentGrossAmount",
        "modeOfPayment",
        "opportunityActivityId",
      ];
      return fieldsToCompare.some(
        (field) => (incoming?.[field] ?? null) !== (existing?.[field] ?? null)
      );
    };

    const incomingIds: number[] = [];
    if (normalized.length > 0) {
      await Promise.all(
        normalized.map(async (item) => {
          if (item.id) {
            const existing = existingById.get(item.id);
            if (existing) {
              incomingIds.push(item.id);
              if (hasRowChanged(item, existing)) {
                await repo.update(item.id, {
                  ...item,
                  updatedBy: userId,
                });
              }
            } else {
              const { id: _ignoredId, ...rest } = item;
              const savedItem = await repo.save({
                ...rest,
                createdBy: userId,
                updatedBy: userId,
              });
              if (savedItem?.id) {
                incomingIds.push(savedItem.id);
              }
            }
          } else {
            const savedItem = await repo.save({
              ...item,
              createdBy: userId,
              updatedBy: userId,
            });
            if (savedItem?.id) {
              incomingIds.push(savedItem.id);
            }
          }
        })
      );
    }

    const idsToDelete = existingIds.filter(
      (existingId) => !incomingIds.includes(existingId)
    );

    if (idsToDelete.length) {
      await this.deleteEntityTableMapIds(
        entityName,
        idsToDelete,
        OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
        MAPPED_DATA_DELETION.SOFT_DELETE
      );
    }
  }

  async saveHeldCoverNoteInstallments(
    entityManager: EntityManager,
    heldCoverNoteId: number,
    opportunityActivityId: number,
    installmentDetails: any[],
    userId: number
  ) {
    const repo = entityManager.getRepository(
      OpportunityHeldCoverNoteInstallments
    );
    await this.upsertActivityInstallments({
      repo,
      entityName: OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.HELD_COVER_NOTE_INSTALLMENTS_MAP,
      parentField: "heldCoverNoteId",
      parentId: heldCoverNoteId,
      opportunityActivityId,
      installments: installmentDetails,
      userId,
    });
  }

  async savePolicyConfirmationInstallments(
    entityManager: EntityManager,
    policyConfirmationId: number,
    opportunityActivityId: number,
    installmentDetails: any[],
    userId: number
  ) {
    const repo = entityManager.getRepository(
      OpportunityPolicyConfirmationInstallments
    );
    await this.upsertActivityInstallments({
      repo,
      entityName:
        OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.POLICY_CONFIRMATION_INSTALLMENTS_MAP,
      parentField: "policyConfirmationId",
      parentId: policyConfirmationId,
      opportunityActivityId,
      installments: installmentDetails,
      userId,
    });
  }

  async savePolicyHardCopyInstallments(
    entityManager: EntityManager,
    policyHardCopyId: number,
    opportunityActivityId: number,
    installmentDetails: any[],
    userId: number
  ) {
    const repo = entityManager.getRepository(
      OpportunityPolicyHardCopyInstallments
    );
    await this.upsertActivityInstallments({
      repo,
      entityName:
        OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.POLICY_HARD_COPY_INSTALLMENTS_MAP,
      parentField: "policyHardCopyId",
      parentId: policyHardCopyId,
      opportunityActivityId,
      installments: installmentDetails,
      userId,
    });
  }

  async deleteFileUploadByIds(
    fileUploadEntity: string,
    entity: string,
    select: string,
    whereCondition: any,
    deletionType: string
  ): Promise<void> {
    try {
      await this.entityService.deleteFileUploadByIds(
        fileUploadEntity,
        entity,
        select,
        whereCondition,
        deletionType
      );
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async updateDocument(
    entityManager: EntityManager,
    id: number,
    documentId: number,
    documentTypeLid: number,
    entityName: string
  ): Promise<void> {
    try {
      await entityManager.update(
        entityName,
        { id },
        {
          documentId,
          documentTypeLid,
        }
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update document: ${error.message}`
      );
    }
  }

  async getPolicyConfirmationByOpportunityActivityId(
    opportunityActivityId: number
  ): Promise<OpportunityPolicyConfirmation | null> {
    try {
      const policyConfirmation =
        await this.opportunityRepository.manager.findOne(
          OpportunityPolicyConfirmation,
          {
            where: { opportunityActivityId: opportunityActivityId },
            relations: [
              "documents",
              "opportunity",
              "policyDataWrong",
              "deviationResolved",
              "resolution",
            "policyDataRectified",
            "status",
            "insurerDetails",
            "installmentDetails",
          ],
          order: {
            installmentDetails: {
              installmentSequence: "ASC",
            },
          },
        }
      );
      if (policyConfirmation) {
        if (Array.isArray(policyConfirmation.installmentDetails)) {
          policyConfirmation.installmentDetails =
            policyConfirmation.installmentDetails.filter(
              (installment) => !installment.deletedAt
            );
        }
        removeMetadataFields(policyConfirmation);
        removeLookUpDataFields(policyConfirmation);
      }
      return policyConfirmation || null;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }

  async getPolicyHardCopyByOpportunityActivityId(
    opportunityActivityId: number
  ): Promise<OpportunityPolicyHardCopy | null> {
    try {
      const policyHardCopy = await this.opportunityRepository.manager.findOne(
        OpportunityPolicyHardCopy,
        {
          where: { opportunityActivityId: opportunityActivityId },
          relations: [
            "documents",
            "opportunity",
            "status",
            "deviations",
            "deviationCoverages",
            "deviationsAddressed",
            "resolution",
            "revisedPolicyHardCopyReceived",
            "coverDetails",
            "insurerDetails",
            "installmentDetails",
          ],
          order: {
            installmentDetails: {
              installmentSequence: "ASC",
            },
          },
        }
      );
      if (policyHardCopy) {
        if (Array.isArray(policyHardCopy.installmentDetails)) {
          policyHardCopy.installmentDetails =
            policyHardCopy.installmentDetails.filter(
              (installment) => !installment.deletedAt
            );
        }
        removeMetadataFields(policyHardCopy);
        removeLookUpDataFields(policyHardCopy);
      }
      return policyHardCopy || null;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }
  async createPlacementSlip(
    data: any,
    userId: number,
    entityManager: EntityManager
  ): Promise<any> {
    try {
      let insurerMaps: any = data.insurerMaps || [];
      const {
        tpaMaps = [],
        cdDetails = [],
        coverDetails = {},
        installmentDetails = [],
        documents = [],
        ...placementData
      } = data;
      delete placementData.insurerMaps;
      delete placementData.activityStatusKey;
      const activity = await this.opportunityActivityMapRepository.findOne({
        where: { id: placementData.opportunityActivityId },
        select: ["opportunityId"],
      });
      insurerMaps = await this.checkInsurerAndBrokerageDetails(
        insurerMaps,
        placementData.basicPremium,
        placementData.policyPlacedTypeLid
      );

      if (insurerMaps.length === 0) {
        placementData.leadInsurerId = null;
      }
      if (placementData?.policyPlacedTypeLid) {
        const [policyPlacedTypeSingle, leadParticipationType] =
          await Promise.all([
            this.lookUpRepository.findOne({
              where: { lookUpKey: "SINGLE_INSURER" },
              select: ["id"],
            }),
            this.lookUpRepository.findOne({
              where: { lookUpKey: "INSURER_PARTICIPATION_TYPE_LEAD" },
              select: ["id"],
            }),
          ]);
        if (
          insurerMaps.length > 0 &&
          placementData.policyPlacedTypeLid === policyPlacedTypeSingle?.id &&
          insurerMaps[0]
        ) {
          insurerMaps[0].isLeadInsurer = leadParticipationType?.id;
        }
      }

      if (!activity) {
        throw new NotFoundException(
          `Opportunity Activity Map with ID ${placementData.opportunityActivityId} not found`
        );
      }

      const opportunityId = activity.opportunityId;

      const placement = this.placementRepo.create({
        ...placementData,
        createdBy: userId,
        updatedBy: userId,
      });
      const savedPlacement = await this.placementRepo.save(placement);

      // Save child records with placementSlipId
      const placementSlipId = savedPlacement.id;

      // Get all cover entities for the provided coverTemplateIds
      const covers = await this.getOpportunityQuoteCoverByIds(
        entityManager,
        Object.keys(coverDetails).map(Number)
      );

      // Create a map for quick lookup of coverName by coverTemplateId
      const coverNameMap = new Map<number, string>();
      const coverMetaMap = new Map<number, any>();
      covers.forEach((cover) => {
        coverNameMap.set(cover.id, cover.coverName ?? "");
        coverMetaMap.set(cover.id, cover.coversMeta ?? null);
      });

      await Promise.all([
        // Save covers with correct coverName
        ...Object.entries(coverDetails).map(
          ([coverTemplateId, coverResponse]) =>
            this.coverRepo.save({
              placementSlipId,
              opportunityId,
              coverTemplateId: Number(coverTemplateId),
              coverName: coverNameMap.get(Number(coverTemplateId)) ?? "",
              coversMeta: coverMetaMap.get(Number(coverTemplateId)) ?? null,
              coverResponse: String(coverResponse),
              createdBy: userId,
              updatedBy: userId,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
        ),
        ...tpaMaps.map((tpaData: any) =>
          this.tpaRepo.save({
            ...tpaData,
            placementSlipId,
            createdBy: userId,
            updatedBy: userId,
          })
        ),
        ...insurerMaps.map((insurerData: any) =>
          this.insurerRepo.save({
            ...insurerData,
            placementSlipId,
            createdBy: userId,
            updatedBy: userId,
          })
        ),
        ...insurerMaps.map((detail: any) =>
          this.sharingRepo.save({
            ...detail,
            placementSlipId,
            createdBy: userId,
            updatedBy: userId,
          })
        ),
        ...cdDetails.map((cd: any) =>
          this.cdRepo.save({
            ...cd,
            accountNumber: cd.accountNumber,
            placementSlipId,
            createdBy: userId,
            updatedBy: userId,
          })
        ),
        ...installmentDetails.map((installment: any) =>
          this.installmentsRepo.save({
            ...installment,
            placementSlipId,
            opportunityActivityId: placementData.opportunityActivityId,
            createdBy: userId,
            updatedBy: userId,
          })
        ),
      ]);

      await this.savePlacementSlipDocuments(
        placementSlipId,
        documents,
        entityManager
      );
      return savedPlacement;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create placement slip generation: ${error.message}`
      );
    }
  }

  async createPolicyWithDetails(
    opportunityActivityId: number,
    userId: number,
    entityManager: EntityManager
  ): Promise<any> {
    const placementSlip = await this.getPlacementSlipActivity(
      opportunityActivityId
    );
    if (!placementSlip) {
      throw new NotFoundException(
        `Placement slip not found for opportunity activity ID: ${opportunityActivityId}`
      );
    }

    // Fetch necessary look-up values
    const placementSlipLookUpKeys = [
      POLICY_CONFIGURATION_STATUS_DRAFT,
      POLICY_STATUS_MIG_GENERATED,
      INSURER_PARTICIPANT_TYPE.INSURER_PARTICIPATION_TYPE_LEAD,
      INSURER_PARTICIPANT_TYPE.INSURER_PARTICIPATION_TYPE_CO,
      TOGGLE_TYPE.TOGGLE_TYPE_YES,
    ];
    const natureOfBusinessInsuranceOnly = await this.lookUpRepository.findOne({
      where: {
        lookUpName: "NATURE_OF_BUSSINESS",
        lookUpKey: "INSURENCE_ONLY",
      },
    });

    const placementSlipLookUps = await this.lookUpRepository.find({
      where: {
        lookUpKey: In(placementSlipLookUpKeys),
      },
    });

    const lookUpMap = new Map(
      placementSlipLookUps.map((item) => [item.lookUpKey, item])
    );

    const policyConfigStatus = lookUpMap.get(POLICY_CONFIGURATION_STATUS_DRAFT);
    const policyStatus = lookUpMap.get(POLICY_STATUS_MIG_GENERATED);
    const LeadInsurerPartispentType = lookUpMap.get(
      INSURER_PARTICIPANT_TYPE.INSURER_PARTICIPATION_TYPE_LEAD
    );
    const coInsurerPartispentType = lookUpMap.get(
      INSURER_PARTICIPANT_TYPE.INSURER_PARTICIPATION_TYPE_CO
    );
    const dealConfirmed = lookUpMap.get(TOGGLE_TYPE.TOGGLE_TYPE_YES);
    const policyGroupType = await this.lookUpRepository.findOne({
      where: { lookUpKey: POLICY_GROUP_IIRM },
    });

    // Fetch the opportunityActivityMap record using the provided opportunityActivityId
    const opportunityActivityMap =
      await this.opportunityActivityMapRepository.findOne({
        where: { id: placementSlip.opportunityActivityId },
        select: ["opportunityId"],
      });

    if (!opportunityActivityMap) {
      throw new NotFoundException(
        `Opportunity Activity Map with ID ${placementSlip.opportunityActivityId} not found`
      );
    }

    // Use the opportunityId from the opportunityActivityMap to fetch the opportunity details
    const opportunity = await this.opportunityRepository.findOne({
      where: { opportunityId: opportunityActivityMap.opportunityId },
      relations: [
        "company",
        "policyType",
        "policyStatus",
        "opportunityType",
        "isPolicyMined",
        "opportunityRiskLocations",
      ],
    });
    if (!opportunity) {
      throw new NotFoundException(
        `Opportunity with ID ${opportunityActivityMap.opportunityId} not found`
      );
    }

    if (!placementSlip) {
      throw new NotFoundException(
        `Placement slip not found for ID: ${placementSlipId}`
      );
    }
    console.log("Creating policy with the following details:", {
      opportunity,
      userId,
    });
    console.log("Placement Slip Details:", placementSlip);

    // Generate provisional policy number in the format IIRM-00000001
    const lastPolicyWithNumber = await entityManager
      .createQueryBuilder(Policy, "policy")
      .where("policy.provisionalPolicyNo LIKE :prefix", { prefix: "IIRM-%" })
      .orderBy("policy.provisionalPolicyNo", "DESC")
      .getOne();

    const nextProvisionalNumber = (
      (lastPolicyWithNumber
        ? parseInt(lastPolicyWithNumber.provisionalPolicyNo.split("-")[1], 10)
        : 0) + 1
    )
      .toString()
      .padStart(8, "0");

    const provisionalPolicyNo = `IIRM-${nextProvisionalNumber}`;
    const existingPolicy = await entityManager.findOne("Policy", {
      where: { opportunityId: opportunity.opportunityId },
    });
    if (existingPolicy) {
      throw new BadRequestException(
        `Policy already exists for Opportunity ID: ${opportunity.opportunityId}`
      );
    }

    const placementSlipData = placementSlip.dataActivity;
    // Extract data for the Policy table
    const dateOfIncome = new Date();
    const incomeMonth = new Date(
      dateOfIncome.getFullYear(),
      dateOfIncome.getMonth(),
      1
    );
    // Owner details
    const userDetails = await entityManager.findOne(User, {
      where: { userId: opportunity.ownerId },
      relations: ["organisation"],
    });
    if (!userDetails) {
      throw new NotFoundException(
        `User with ID ${opportunity.ownerId} not found`
      );
    }

    const policyDetails = placementSlipData?.policyDetails ?? {};
    let generatedPolicyUniqueRefKey = generateUniqueRefKey(EntityTypeCode.POLICY);

    const policyFromRaw = placementSlipData?.policyDetails?.policyFromDate;
    const policyFromDate = policyFromRaw ? new Date(policyFromRaw) : null;
    const policyPayload: Partial<Policy> = {
      policyName: opportunity.policyType?.lookUpValue,
      policyTypeLid: opportunity.policyTypeLid, // Example, replace with actual logic
      opportunityId: opportunity.opportunityId,
      companyId: opportunity.companyId,
      countryId: opportunity?.company?.countryId,
      policyFrom: policyFromRaw,
      policyTo: placementSlipData?.policyDetails?.policyToDate,
      provisionalPolicyNo,
      sumInsured: placementSlipData?.policyDetails?.sumInsured ?? 0,
      premiumAtInception: placementSlipData?.policyDetails?.basicPremium ?? 0,
      gstPercentage: policyDetails?.gstPercentage ?? undefined,
      gst: policyDetails?.gstPercentage ?? undefined,
      insurerPolicyNumber: undefined,
      basicBrokeragePercentage: policyDetails?.basicBrokeragePercentage ?? undefined,
      natureOfBussinessLid: natureOfBusinessInsuranceOnly?.id ?? null,
      // brokerageAmount,
      isPolicyMinedLid:
        opportunity.isPolicyMinedLid ?? opportunity.isPolicyMined?.id ?? null,
      opportunityType:
        opportunity.opportunityType?.lookUpKey === OPPORTUNITY_TYPE.RO
          ? RENEWAL_OPPORTUNITY
          : SALES_OPPORTUNITY,
      commissionTerrorism: policyDetails?.terrorismBrokeragePercentage ?? undefined,
      policyStatusLid: policyStatus?.id,
      createdBy: opportunity.ownerId ?? userId,
      updatedBy: opportunity.ownerId ?? userId,
      ownerId: opportunity.ownerId ?? userId,
      amId: opportunity?.amId ?? opportunity?.company?.accountManager ?? null,
      isgId: opportunity.isgId,
      serviceLevelLid: opportunity.serviceLevelLid,
      createdAt: new Date(),
      updatedAt: new Date(),
      dealConfirmedLid: dealConfirmed?.id ?? undefined,
      dateOfIncome,
      incomeMonth,
      financialYear: financialYearLabel(dateOfIncome) ?? undefined,
      dateOfIncomeFromIwork: dateOfIncome,
      policyGroupTypeLid: policyGroupType?.id ?? undefined,
      terrorismBrokeragePercentage:
        policyDetails?.terrorismBrokeragePercentage ?? undefined,
      gstAmount: policyDetails?.gstAmount ?? undefined,
      basicPremium: policyDetails?.basicPremium ?? 0,
      // basicPremiumPercentage: policyDetails?.basicPremiumPercentage ?? 0,
      netPremium: policyDetails?.netPremium ?? undefined,
      grossPremium: policyDetails?.grossPremium ?? undefined,
      sharePercentage:
        placementSlipData?.insurerDetails?.[0]?.sharePercentage || 0,
      feeAmount: policyDetails?.fee ?? 0,
      feePercentage: policyDetails?.feePercentage ?? 0,
      otherAmount: policyDetails?.other ?? 0,
      otherPercentage: policyDetails?.otherPercentage ?? 0,
      terrorismAmount: policyDetails?.terrorism ?? undefined,
      tcBrokerageAmount: policyDetails?.tcBrokerageAmount ?? 0,
      basicBrokerageAmount: policyDetails?.basicBrokerageAmount ?? 0,
      adminCharges: policyDetails?.adminCharges ?? 0,
      adminChargesPercentage: policyDetails?.adminChargesPercentage ?? 0,
      srccAmount: policyDetails?.srccAmount ?? 0,
      srccBrokerageAmount: policyDetails?.srccBrokerageAmount ?? 0,
      srccPercentage: policyDetails?.srccPercentage ?? 0,
      cessAmount: policyDetails?.cessAmount ?? 0,
      cessPercentage: policyDetails?.cessPercentage ?? 0,
      totalBrokerageAmount: policyDetails?.totalBrokerageAmount ?? 0,
      organisationId: userDetails?.organisationId ?? undefined,
      sbuId: userDetails?.sbuId ?? undefined,
      verticalId: userDetails?.verticalId ?? undefined,
      departmentId: userDetails?.departmentId ?? undefined,
      branchId: userDetails?.branchId ?? undefined,
      uniqueRefKey: generatedPolicyUniqueRefKey,
      dateOfBusiness: policyFromDate,
      businessMonth: policyFromDate
        ? new Date(policyFromDate.getFullYear(), policyFromDate.getMonth(), 1)
        : null,
      // totalGrossPremiumIncTaxCharges:
      //   policyDetails?.totalGrossPremiumIncTaxCharges
      //     ? policyDetails?.totalGrossPremiumIncTaxCharges
      //     : totalPremium,
    };
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "OpportunityRepository",
        method: "createPolicyWithDetails",
        payload: policyPayload,
        messageData: "Policy Payload",
      }),
    });
    // Save the policy
    const policy = await entityManager.save("Policy", policyPayload);

    // Update the policy with the generated unique reference key appended with the policy ID to ensure uniqueness
    await entityManager.update("Policy",
      { id: policy.id },
      { uniqueRefKey: `${generatedPolicyUniqueRefKey}${policy.id}`}
    );

    if (!policy) {
      throw new BadRequestException(
        "Failed to create policy. Please check the provided data."
      );
    }

    // Save policy participants
    const participantsArray: {
      participantId: number;
      participantType: string;
    }[] = [];

    if (opportunity.ownerId)
      participantsArray.push({
        participantId: Number(opportunity.ownerId),
        participantType: POLICY_PARTICIPANT.BD,
      });

    if (opportunity.amId)
      participantsArray.push({
        participantId: Number(opportunity.amId),
        participantType: POLICY_PARTICIPANT.AM,
      });

    if (opportunity.isgId)
      participantsArray.push({
        participantId: Number(opportunity.isgId),
        participantType: POLICY_PARTICIPANT.ISG,
      });

    // Add participants from repository
    const opportunityParticipants =
      await this.opportunityActivityParticipantsRepository.find({
        where: { opportunityId: opportunity.opportunityId },
        select: ["participantId"],
      });

    participantsArray.push(
      ...opportunityParticipants.map((p) => ({
        participantId: Number(p.participantId),
        participantType: POLICY_PARTICIPANT.PARTICIPANT,
      }))
    );

    // Deduplicate by participantId
    const uniqueParticipantMaps = Array.from(
      new Map(
        participantsArray.map((p) => [p.participantId, p]) // if same ID appears twice, first occurrence is kept
      ).values()
    );

    if (uniqueParticipantMaps.length > 0) {
      const participantMaps = uniqueParticipantMaps.map((p) => ({
        policyId: policy.id,
        participantId: p.participantId,
        participantType: p.participantType,
      }));
      await entityManager.save("PolicyParticipantMap", participantMaps);
    }

    // Risk locations
    if (opportunity.opportunityRiskLocations?.length) {
      const riskLocationPayloads = opportunity.opportunityRiskLocations.map(
        (location) => ({
          policyId: policy.id,
          addressId: location.addressId,
        })
      );
      await entityManager.save("PolicyRiskLocationMap", riskLocationPayloads);
    }

    // Save TPA details
    if (placementSlipData?.tpaDetails?.length) {
      const tpaPayloads = placementSlipData?.tpaDetails.map((tpa) => ({
        policyId: policy.id,
        tpaId: tpa.tpaId,
        tpaBranchId: tpa.tpaBranchId,
        tpaContactId: tpa.tpaContactId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await entityManager.save("PolicyTpaMap", tpaPayloads);
    }

    let highestShareInsurer;
    if (placementSlipData?.insurerDetails?.length) {
      const sharingDetails = placementSlipData?.insurerDetails;

      // Determine the insurer with the highest share percentage (lead insurer)
      highestShareInsurer = sharingDetails.find(
        (insurer) => insurer.isLeadInsurer === LeadInsurerPartispentType?.id
      );

      const insurerPayloads = sharingDetails.map((insurer) => ({
        policyId: policy.id,
        insurerParticipationTypeLid: insurer.isLeadInsurer,
        insurerId: insurer.insurerId,
        insurerBranchId: insurer.insurerBranchId,
        insurerContactId: insurer.insurerContactId,
        insurerLocationId: insurer.insurerLocationId,
        sharePercentage: insurer.sharePercentage,
        shareAmount: insurer.shareAmount,
        brokeragePercentage: insurer.brokeragePercentage,
        brokerageAmount: insurer.brokerageAmount,
        terrorismSharePercentage: insurer.terrorismSharePercentage,
        terrorismShareAmount: insurer.terrorismShareAmount,
        terrorismBrokeragePercentage: insurer.terrorismBrokeragePercentage,
        terrorismBrokerageAmount: insurer.terrorismBrokerageAmount,
        totalBrokerageAmount: insurer.totalBrokerageAmount,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await entityManager.save("PolicyInsurerMap", insurerPayloads);
    }

    // Save Cover details
    if (
      placementSlipData?.coverDetails &&
      Object.keys(placementSlipData?.coverDetails).length > 0
    ) {
      const coverDetails = await entityManager.find(
        OpportunityPlacementSlipCoverDetail,
        { where: { placementSlipId: placementSlip.id } }
      );
      const coverPayloads = coverDetails.map((cover) => ({
        policyId: policy.id,
        coverTemplateId: cover.coverTemplateId,
        coverName: cover.coverName,
        coversMeta: cover.coversMeta,
        coverResponse: cover.coverResponse,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      await entityManager.save("PolicyCoverMap", coverPayloads);
    }

    if (placementSlipData?.installmentDetails?.length) {
      const normalizedInstallments = this.normalizeInstallmentDetails(
        placementSlipData.installmentDetails
      );

      if (normalizedInstallments.length) {
        const installmentPayloads = normalizedInstallments.map((installment) => ({
          policyId: policy.id,
          installmentDate: installment.installmentDate,
          installmentNetAmount: installment.installmentNetAmount,
          installmentNo: installment.installmentNo ?? null,
          installmentSequence: installment.installmentSequence,
          installmentPercentage: installment.installmentPercentage,
          taxPercentage: installment.taxPercentage,
          taxAmount: installment.taxAmount,
          installmentGrossAmount: installment.installmentGrossAmount,
          modeOfPayment: installment.modeOfPayment ?? null,
          createdBy: opportunity.ownerId ?? userId,
          updatedBy: opportunity.ownerId ?? userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        await entityManager.save("PolicyInstallments", installmentPayloads);
      }
    }

    if (placementSlipData?.cdAccountDetails) {
      const cd = placementSlipData?.cdAccountDetails;

      const lookUps = await this.lookUpRepository.find({
        where: {
          id: In([Number(cd.cdAccountTypeLid), Number(cd.transactionTypeLid)]),
        },
      });

      const lookUpMap = new Map(lookUps.map((item) => [item.id, item]));
      const cdAccountType = lookUpMap.get(Number(cd.cdAccountTypeLid));
      if (!cdAccountType) {
        throw new BadRequestException(
          `No CD Account type found for id: ${cd.cdAccountTypeLid}`
        );
      }
      const isExisitingCDAccount =
        cdAccountType.lookUpKey !== CD_ACCOUNT_TOGGLE_NEW;

      const transactionlookupData = lookUpMap.get(
        Number(cd.transactionTypeLid)
      );
      if (!transactionlookupData) {
        throw new BadRequestException(
          `No transaction type found for id: ${cd.transactionTypeLid}`
        );
      }

      const cdLookUps = await this.lookUpRepository.find({
        where: {
          lookUpKey: In([
            CREDIT_BALANCE_TRANSACTION_KEY,
            CD_ACCOUNT_STATUS_ACTIVE,
          ]),
        },
      });
      const cdLookUpMap = new Map(
        cdLookUps.map((item) => [item.lookUpKey, item])
      );
      const creditTransactionLookupData = cdLookUpMap.get(
        CREDIT_BALANCE_TRANSACTION_KEY
      );
      if (!creditTransactionLookupData) {
        throw new BadRequestException(
          `No transaction type found for key: ${CREDIT_BALANCE_TRANSACTION_KEY}`
        );
      }
      const cdAccountActiveStatus = cdLookUpMap.get(CD_ACCOUNT_STATUS_ACTIVE);
      if (!cdAccountActiveStatus) {
        throw new BadRequestException(
          `No transaction type found for key: ${CD_ACCOUNT_STATUS_ACTIVE}`
        );
      }
      console.log(
        "placementSlipData?.insurerDetails?.[0]",
        placementSlipData?.insurerDetails
      );
      const cdAccount = await this.getCdAccountDetails(
        entityManager,
        cd,
        opportunity.companyId,
        highestShareInsurer?.insurerId ??
          placementSlipData?.insurerDetails?.[0]?.insurerId,
        userId,
        placementSlipData?.remarks.remarks ?? "",
        cdAccountActiveStatus.lookUpValueKey,
        isExisitingCDAccount
      );

      if (!cdAccount) {
        throw new BadRequestException(`No CD account found`);
      }

      const transactionAmount =
        cd.chequeAmount !== undefined ? Number(cd.chequeAmount) : 0;
      const transactionType = creditTransactionLookupData.lookUpKey;

      await entityManager.save("CautionDepositTransaction", {
        cautionDepositId: cdAccount.id,
        transactionType: transactionType,
        transactionAmount:
          cd.chequeAmount !== undefined
            ? Number(cd.chequeAmount)
            : cd.openBalance !== undefined
            ? Number(cd.openBalance)
            : 0,
        transactionDate: cd.chequeDate ? new Date(cd.chequeDate) : new Date(),
        transactionReferenceId: cd.chequeNumber,
        referenceType: transactionlookupData.lookUpKey,
        bankName: cd.bankName,
        chequeNumber: cd.chequeNumber,
        chequeDate: cd.chequeDate,
        remarks: cd.remarks ?? placementSlipData?.remarks?.remarks,
        createdAt: new Date(),
        updatedAt: new Date(),
        policyId: policy.id,
        balanceAmount: Number(cd.openBalance) + transactionAmount,
        createdBy: userId,
      });

      await entityManager.update(
        "CautionDeposit",
        { id: cdAccount.id },
        {
          balanceAmount: Number(cd.openBalance) + transactionAmount,
          cdAccountName: cdAccount?.cdAccountName ?? null,
        }
      );

      await entityManager.save("CautionDepositPolicyMapping", {
        policyId: policy.id,
        cautionDepositId: cdAccount.id,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    const policyConfigPayload = {
      companyId: policy.companyId,
      policyTypeLid: policy.policyTypeLid,
      policyId: policy.id,
      policyConfiguartionStatusLid: policyConfigStatus?.id,
      policyStep: 0,
      policyConfiguration: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    if (policy) {
      this.policyRepo.createPolicyConfiguration(
        policyConfigPayload,
        entityManager
      );
    }

    return policy;
  }

  async updatePlacementSlip(
    id: number,
    data: any,
    entityManager: EntityManager
  ) {
    try {
      const placement = await this.placementRepo.findOne({ where: { id } });
      if (!placement) {
        throw new NotFoundException(`Placement slip with ID ${id} not found`);
      }

      const placementSlipId = id;

      const activity = await this.opportunityActivityMapRepository.findOne({
        where: { id: placement.opportunityActivityId },
        select: ["opportunityId"],
      });
      const opportunityId = activity?.opportunityId;

      let insurerMaps: any = data.insurerMaps || [];

      const {
        tpaMaps = [],
        cdDetails = [],
        coverDetails = {},
        installmentDetails = [],
        documents = [],
        ...placementData
      } = data;
      delete placementData.insurerMaps;
      delete placementData.activityStatusKey;

      const updatedBy = placementData.updatedBy;
      insurerMaps = await this.checkInsurerAndBrokerageDetails(
        insurerMaps,
        placementData.basicPremium,
        placementData.policyPlacedTypeLid
      );
      if (insurerMaps.length === 0) {
        placementData.leadInsurerId = null;
      }

      if (placementData?.policyPlacedTypeLid) {
        // Fetch both lookup values using In condition for efficiency
        const lookUps = await this.lookUpRepository.find({
          where: {
            lookUpKey: In([
              SINGLE_INSURER,
              INSURER_PARTICIPANT_TYPE?.INSURER_PARTICIPATION_TYPE_LEAD,
            ]),
          },
          select: ["id", "lookUpKey"],
        });

        // Find the required lookups by key
        const policyPlacedTypeSingle = lookUps.find(
          (item) => item.lookUpKey === SINGLE_INSURER
        );
        const leadParticipationType = lookUps.find(
          (item) =>
            item.lookUpKey ===
            INSURER_PARTICIPANT_TYPE?.INSURER_PARTICIPATION_TYPE_LEAD
        );
        if (
          insurerMaps.length > 0 &&
          placementData.policyPlacedTypeLid === policyPlacedTypeSingle?.id &&
          insurerMaps[0]
        ) {
          insurerMaps[0].isLeadInsurer = leadParticipationType?.id;
        }
      }

      const installmentDetailsWithOpportunity = installmentDetails.map(
        (installment: any) => ({
          ...installment,
          opportunityActivityId: placement.opportunityActivityId,
        })
      );

      await this.placementRepo.update(placementSlipId, placementData);

      // Update existing related records or create new ones without deleting all
      const updateOrCreateWithDeletion = async (
        repo: Repository<any>,
        entity: string,
        select: string,
        items: any[],
        placementSlipId: number,
        deletionType: string
      ) => {
        const whereCondition = { placementSlipId };
        const extra = { placementSlipId };

        // Fetch existing mapped IDs from the table
        const existingIds: number[] = await this.getEntityTableMapIds(
          entity,
          select,
          whereCondition
        );

        const incomingIds: number[] = [];
        if (items.length > 0) {
          // Update or insert logic
          await Promise.all(
            items.map(async (item) => {
              if (item.id) {
                incomingIds.push(item.id);
                await repo.update(item.id, {
                  ...item,
                  ...extra,
                  updatedBy: updatedBy,
                });
              } else {
                const savedItem = await repo.save({
                  ...item,
                  ...extra,
                  createdBy: updatedBy,
                  updatedBy: updatedBy,
                });
                if (savedItem?.id) incomingIds.push(savedItem.id); // Capture new ID
              }
            })
          );
        }
        // Identify and delete stale records
        const idsToDelete = existingIds.filter(
          (exId) => !incomingIds.includes(exId)
        );

        if (idsToDelete.length) {
          await this.deleteEntityTableMapIds(
            entity,
            idsToDelete,
            select,
            deletionType
          );
        }
      };

      // Build cover meta/name maps only if covers are present
      const coverTemplateIds = Object.keys(coverDetails).map(Number);
      let coverNameMap: any = new Map<number, string>();
      let coverMetaMap: any = new Map<number, any>();

      if (coverTemplateIds.length) {
        const covers = await this.getOpportunityQuoteCoverByIds(
          entityManager,
          coverTemplateIds
        );

        covers.forEach((cover) => {
          coverNameMap.set(cover.id, cover.coverName ?? "");
          coverMetaMap.set(cover.id, cover.coversMeta ?? null);
        });
      }

      // Set insurerBranchId, insurerContactId, insurerLocationId to undefined in insurerMaps
      const insurerDetails = insurerMaps.map((insurer) => ({
        ...insurer,
        sharePercentage: undefined,
        shareAmount: undefined,
        brokeragePercentage: undefined,
        brokerageAmount: undefined,
        terrorismSharePercentage: undefined,
        terrorismShareAmount: undefined,
        terrorismBrokeragePercentage: undefined,
        terrorismBrokerageAmount: undefined,
        totalBrokerageAmount: undefined,
      }));

      const sharingDetails = insurerMaps.map((insurer) => ({
        ...insurer,
        id: undefined,
        insurerBranchId: undefined,
        insurerContactId: undefined,
        insurerLocationId: undefined,
        isLeadInsurer: undefined,
      }));

      const promises: Promise<any>[] = [
        updateOrCreateWithDeletion(
          this.tpaRepo,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PLACEMENT_SLIP_TPA_MAP,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
          tpaMaps,
          placementSlipId,
          MAPPED_DATA_DELETION.SOFT_DELETE
        ),
        updateOrCreateWithDeletion(
          this.cdRepo,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PLACEMENT_SLIP_CD_MAP,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
          cdDetails,
          placementSlipId,
          MAPPED_DATA_DELETION.SOFT_DELETE
        ),
        updateOrCreateWithDeletion(
          this.installmentsRepo,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PLACEMENT_SLIP_INSTALLMENTS_MAP,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
          installmentDetailsWithOpportunity,
          placementSlipId,
          MAPPED_DATA_DELETION.SOFT_DELETE
        ),
      ];

      if (insurerDetails.length) {
        promises.push(
          updateOrCreateWithDeletion(
            this.insurerRepo,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PLACEMENT_SLIP_INSURER_MAP,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
            insurerDetails,
            placementSlipId,
            MAPPED_DATA_DELETION.SOFT_DELETE
          )
        );
      }

      if (sharingDetails.length) {
        promises.push(
          updateOrCreateWithDeletion(
            this.sharingRepo,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PLACEMENT_SLIP_SHARING_MAP,
            OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
            sharingDetails,
            placementSlipId,
            MAPPED_DATA_DELETION.SOFT_DELETE
          )
        );
      }

      if (coverTemplateIds.length) {
        promises.push(
          ...Object.entries(coverDetails).map(
            async ([coverTemplateId, coverResponse]) => {
              const coverTemplateIdNum = Number(coverTemplateId);

              const existing = await this.coverRepo.findOne({
                where: {
                  placementSlipId,
                  coverTemplateId: coverTemplateIdNum,
                },
              });

              const dataForCover = {
                coverName: coverNameMap.get(coverTemplateIdNum) ?? "",
                coversMeta: coverMetaMap.get(coverTemplateIdNum) ?? null,
                coverResponse: String(coverResponse),
                opportunityId,
              };

              if (existing) {
                Object.assign(existing, {
                  ...dataForCover,
                  updatedBy,
                });
                await this.coverRepo.save(existing);
              } else {
                await this.coverRepo.save({
                  ...dataForCover,
                  placementSlipId,
                  createdBy: updatedBy,
                  updatedBy,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                });
              }
            }
          )
        );
      }

      await Promise.all(promises);

      if (documents?.length) {
        await this.saveActivityDocuments(
          entityManager,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PLACEMENT_SLIP_DOCUMENT_MAP,
          OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PLACEMENT_SLIP_ID,
          placementSlipId,
          documents
        );

        await this.updateExistingDocumentsStatus(
          entityManager,
          placement.opportunityActivityId,
          documents.map((doc) => doc.documentId)
        );
      }

      return await this.placementRepo.findOne({
        where: { id: placementSlipId },
      });
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

  async getPlacementSlipData(
    opportunityActivityId: number
  ): Promise<OpportunityPlacementSlipGeneration> {
    const placement = await this.placementRepo.findOne({
      where: { opportunityActivityId },
      relations: [
        "tpaMaps",
        "insurerMaps",
        "sharingDetails",
        "cdDetails",
        "coverDetails",
        "installmentDetails",
        "documents",
      ],
    });
    if (!placement) {
      throw new NotFoundException(
        `Placement slip with ID ${opportunityActivityId} not found`
      );
    } else {
      if (Array.isArray(placement.installmentDetails)) {
        placement.installmentDetails = placement.installmentDetails.filter(
          (inst) => !inst.deletedAt
        );
      }
      removeMetadataFields(placement);
      removeLookUpDataFields(placement);
    }
    return placement;
  }

  async getPlacementSlipActivity(opportunityActivityId: number) {
    const opportunityActivityMapData = await this.getOpportunityActivityById(
      opportunityActivityId
    );
    const opportunityId = opportunityActivityMapData.opportunityId;
    const placement = await this.getPlacementSlipData(opportunityActivityId);
    let documents: any = [];
    if (placement?.documents?.length > 0) {
      documents = placement?.documents?.map(
        ({ placementSlipId, ...rest }) => rest
      );
    } else {
      documents = [
        {
          documentId: null,
          documentTypeLid: null,
        },
      ];
    }
    // Transform coverDetails array to key-value pair: { [coverTemplateId]: coverResponse }
    let coverDetailsObj: Record<number, string> = {};
    if (Array.isArray(placement?.coverDetails)) {
      coverDetailsObj = placement?.coverDetails?.reduce(
        (acc: Record<number, string>, curr: any) => {
          if (
            curr?.coverTemplateId !== undefined &&
            curr?.coverResponse !== undefined
          ) {
            acc[curr.coverTemplateId] = curr.coverResponse;
          }
          return acc;
        },
        {}
      );
    }
    const approverDetails = await this.getActivityApproverDetails(
      opportunityActivityId
    );
    const policyIds = await this.getEntityTableMapIds(
      OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.POLICY,
      OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.ID,
      { opportunityId: opportunityId }
    );
    const policyId = policyIds.length > 0 ? policyIds[0] : null;
    return {
      id: placement?.id ? Number(placement.id) : null,
      opportunityId: opportunityId,
      opportunityActivityId: placement?.opportunityActivityId
        ? Number(placement.opportunityActivityId)
        : null,
      policyId: policyId,
      statusLid: placement?.statusLid ? Number(placement.statusLid) : null,
      dataActivity: {
        policyDetails: {
          policyFromDate: placement?.policyFromDate ?? null,
          policyToDate: placement?.policyToDate ?? null,
          sumInsured: placement?.sumInsured
            ? Number(placement.sumInsured)
            : null,
          basicPremium: placement?.basicPremium
            ? Number(placement.basicPremium)
            : null,
          placementSlipDate: placement?.placementSlipDate ?? null,
          fee: placement?.fee ? Number(placement.fee) : null,
          feePercentage: placement?.feePercentage
            ? Number(placement.feePercentage)
            : null,
          basicBrokeragePercentage: placement?.basicBrokeragePercentage
            ? Number(placement.basicBrokeragePercentage)
            : null,
          srccPercentage: placement?.srccPercentage
            ? Number(placement.srccPercentage)
            : null,
          srccAmount: placement?.srccAmount
            ? Number(placement.srccAmount)
            : null,
          srccBrokerageAmount: placement?.srccBrokerageAmount
            ? Number(placement.srccBrokerageAmount)
            : null,
          terrorism: placement?.terrorism ? Number(placement.terrorism) : null,
          terrorismBrokeragePercentage: placement?.terrorismBrokeragePercentage
            ? Number(placement.terrorismBrokeragePercentage)
            : null,
          tcBrokerageAmount: placement?.tcBrokerageAmount
            ? Number(placement.tcBrokerageAmount)
            : null,
          basicBrokerageAmount: placement?.basicBrokerageAmount
            ? Number(placement.basicBrokerageAmount)
            : null,
          // totalGrossPremiumIncTax: placement?.totalGrossPremiumIncTax
          //   ? Number(placement.totalGrossPremiumIncTax)
          //   : null,
          adminChargesPercentage: placement?.adminChargesPercentage
            ? Number(placement.adminChargesPercentage)
            : null,
          adminCharges: placement?.adminCharges
            ? Number(placement.adminCharges)
            : null,
          cessPercentage: placement?.cessPercentage
            ? Number(placement.cessPercentage)
            : null,
          cessAmount: placement?.cessAmount
            ? Number(placement.cessAmount)
            : null,
          grossPremium: placement?.grossPremium
            ? Number(placement.grossPremium)
            : null,
          gstPercentage: placement?.gstPercentage
            ? Number(placement.gstPercentage)
            : null,
          gstAmount: placement?.gstAmount ? Number(placement.gstAmount) : null,
          other: placement?.other ? Number(placement.other) : null,
          otherPercentage: placement?.otherPercentage
            ? Number(placement.otherPercentage)
            : null,
          totalInstallmentAmount: placement?.totalInstallmentAmount
            ? Number(placement.totalInstallmentAmount)
            : null,
          // totalPremium: placement?.totalPremium
          //   ? Number(placement.totalPremium)
          //   : null,
          // brokeragePercentage: placement?.brokeragePercentage
          //   ? Number(placement.brokeragePercentage)
          //   : null,
          // brokerageAmount: placement?.brokerageAmount
          //   ? Number(placement.brokerageAmount)
          //   : null,
          netPremium: placement?.netPremium
            ? Number(placement.netPremium)
            : null,
          totalBrokerageAmount: placement?.totalBrokerageAmount
            ? Number(placement.totalBrokerageAmount)
            : null,
          isPremiumInstallmentBased:
            placement?.isPremiumInstallmentBased ?? null,
        },
        installmentDetails: Array.isArray(placement?.installmentDetails)
          ? placement.installmentDetails
              .filter((item: any) => !item.deletedAt)
              .map((item: any) => ({
                installmentDate: item?.installmentDate,
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
        feeDetails: {
          isFeeInInstallment: placement?.isFeeInInstallment ?? null,
          leadInsurerId: placement?.leadInsurerId
            ? Number(placement.leadInsurerId)
            : null,
          isLeadInsurerPayCommission:
            placement?.isLeadInsurerPayCommission ?? null,
          maxAgeOfDependents: placement?.maxAgeOfDependents
            ? Number(placement.maxAgeOfDependents)
            : null,
          policyPlacedTypeLid: placement?.policyPlacedTypeLid
            ? Number(placement.policyPlacedTypeLid)
            : null,
        },
        remarks: { remarks: placement?.remarks ?? null },
        tpaDetails: placement?.tpaMaps ?? [],
        insurerDetails: this.mergeInsurerDetailsWithSharing(
          placement?.insurerMaps ?? [],
          placement?.sharingDetails ?? []
        ),
        cdAccountDetails:
          placement?.cdDetails?.length > 0 && placement.cdDetails[0]
            ? {
                id: placement.cdDetails[0]?.id
                  ? Number(placement.cdDetails[0].id)
                  : null,
                paymentTypeLid: placement.cdDetails[0]?.paymentTypeLid
                  ? Number(placement.cdDetails[0].paymentTypeLid)
                  : null,
                cdAccountTypeLid: placement.cdDetails[0]?.cdAccountTypeLid
                  ? Number(placement.cdDetails[0].cdAccountTypeLid)
                  : null,
                accountName: placement.cdDetails[0]?.accountName,
                accountNumber: placement.cdDetails[0]?.accountNumber,
                openBalance: placement.cdDetails[0]?.openBalance
                  ? Number(placement.cdDetails[0].openBalance)
                  : null,
                selectCdAccount: placement.cdDetails[0]?.selectCdAccount
                  ? Number(placement.cdDetails[0].selectCdAccount)
                  : null,
                transactionTypeLid: placement.cdDetails[0]?.transactionTypeLid
                  ? Number(placement.cdDetails[0].transactionTypeLid)
                  : null,
                chequeDate: placement.cdDetails[0]?.chequeDate,
                chequeAmount: placement.cdDetails[0]?.chequeAmount
                  ? Number(placement.cdDetails[0].chequeAmount)
                  : null,
                chequeNumber: placement.cdDetails[0]?.chequeNumber,
                bankName: placement.cdDetails[0]?.bankName,
                cdSafeLimit: placement.cdDetails[0]?.cdSafeLimit
                  ? Number(placement.cdDetails[0].cdSafeLimit)
                  : null,
                remarks: placement.cdDetails[0]?.remarks ?? null,
              }
            : {},
        coverDetails: coverDetailsObj,
        documents: documents,
      },
      approverDetails: approverDetails,
    };
  }

  mergeInsurerDetailsWithSharing = (
    insurerDetails: any[],
    sharingDetails: any[]
  ): any[] => {
    if (!insurerDetails || !Array.isArray(insurerDetails)) {
      return [];
    }

    const sharingDetailsCopy = Array.isArray(sharingDetails)
      ? [...sharingDetails]
      : [];

    const mergedInsurerDetails = insurerDetails.map((insurer) => {
      const sharingIndex = sharingDetailsCopy.findIndex(
        (sharing) => sharing.insurerId === insurer.insurerId
      );
      let matchingSharing = null;
      if (sharingIndex !== -1) {
        matchingSharing = sharingDetailsCopy[sharingIndex];
        sharingDetailsCopy.splice(sharingIndex, 1);
      }

      return {
        // Insurer details
        id: insurer.id,
        placementSlipId: insurer.placementSlipId,
        insurerId: insurer.insurerId,
        insurerLocationId: insurer.insurerLocationId,
        insurerBranchId: insurer.insurerBranchId,
        insurerContactId: insurer.insurerContactId,
        isLeadInsurer: insurer.isLeadInsurer ?? null,

        // Sharing details (with defaults if not found)
        // sharingId: matchingSharing?.id || null,
        sharePercentage: this.toNumberOrNull(matchingSharing.sharePercentage),
        shareAmount: this.toNumberOrNull(matchingSharing.shareAmount),
        brokeragePercentage: this.toNumberOrNull(
          matchingSharing.brokeragePercentage
        ),
        brokerageAmount: this.toNumberOrNull(matchingSharing.brokerageAmount),
        terrorismSharePercentage: this.toNumberOrNull(
          matchingSharing.terrorismSharePercentage
        ),
        terrorismShareAmount: this.toNumberOrNull(
          matchingSharing.terrorismShareAmount
        ),
        terrorismBrokeragePercentage: this.toNumberOrNull(
          matchingSharing.terrorismBrokeragePercentage
        ),
        terrorismBrokerageAmount: this.toNumberOrNull(
          matchingSharing.terrorismBrokerageAmount
        ),
        totalBrokerageAmount: this.toNumberOrNull(
          matchingSharing.totalBrokerageAmount
        ),
      };
    });
    return mergedInsurerDetails.sort((a, b) => {
      const aVal = a.isLeadInsurer ?? Infinity;
      const bVal = b.isLeadInsurer ?? Infinity;
      return aVal - bVal; // ascending
    });
  };

  async getCoverPrefillData(
    opportunityActivityId: number,
    opportunityId: number
  ): Promise<
    | OpportunityPlacementSlipCoverDetail[]
    | OpportunityFinalNegotiationQuoteCoverDetail[]
  > {
    const placement = await this.placementRepo.findOne({
      where: { opportunityActivityId },
      relations: ["coverDetails"],
    });
    if (
      placement &&
      placement?.coverDetails &&
      placement.coverDetails?.length > 0
    ) {
      return placement.coverDetails;
    }

    return this.opportunityRepository.manager.find(
      OpportunityFinalNegotiationQuoteCoverDetail,
      { where: { opportunityId } }
    );
  }

  async getPremiumCoverPrefillData(
    opportunityActivityId: number,
    opportunityId: number
  ): Promise<
    OpportunityPlacementSlipCoverDetail[] | OpportunityPremiumCoverDetail[]
  > {
    const premiumCalculationCovers =
      await this.opportunityRepository.manager.find(
        OpportunityPremiumCoverDetail,
        { where: { opportunityId } }
      );
    if (
      premiumCalculationCovers &&
      Array.isArray(premiumCalculationCovers) &&
      premiumCalculationCovers.length > 0
    ) {
      return premiumCalculationCovers;
    }
    const placementCovers = await this.opportunityRepository.manager.find(
      OpportunityPlacementSlipCoverDetail,
      { where: { opportunityId } }
    );
    return placementCovers;
  }

  async getDeviationCoverDetails(
    opportunityActivityId: number,
    opportunityId: number,
    opportunityTable: string
  ) {
    let activity;
    if (OPPORTUNITY_ACTIVITY.HELD_COVER_NOTE === opportunityTable) {
      activity = await this.opportunityRepository.manager.findOne(
        OpportunityHeldCoverNote,
        {
          where: { opportunityActivityId },
          relations: ["coverDetails"],
        }
      );
    } else if (OPPORTUNITY_ACTIVITY.POLICY_HARD_COPY === opportunityTable) {
      activity = await this.opportunityRepository.manager.findOne(
        OpportunityPolicyHardCopy,
        {
          where: { opportunityActivityId },
          relations: ["coverDetails"],
        }
      );
      if (!activity) {
        activity = await this.opportunityRepository.manager.findOne(
          OpportunityHeldCoverNote,
          {
            where: { opportunityId },
            relations: ["coverDetails"],
          }
        );
      }
    }
    if (
      activity &&
      activity?.coverDetails &&
      activity.coverDetails?.length > 0
    ) {
      return activity.coverDetails;
    }
    const placementCovers =
      await this.getPlacementSlipCoverDetailsByOpportunityId(opportunityId);
    const premiumCovers = await this.getPremiumCoverPrefillData(
      opportunityActivityId,
      opportunityId
    );

    // Build a map for quick lookup: key = `${coverMapId}_${opportunityId}`
    const premiumCoverMap = new Map<string, OpportunityPremiumCoverDetail>();
    for (const premiumCover of premiumCovers) {
      const key = `${premiumCover.coverMapId}_${premiumCover.opportunityId}`;
      premiumCoverMap.set(key, premiumCover);
    }

    // Replace placement cover response if matching premium cover exists
    const mergedCovers = placementCovers.map((placementCover) => {
      const key = `${placementCover.coverTemplateId}_${placementCover.opportunityId}`;
      const premiumCover = premiumCoverMap.get(key);
      if (premiumCover) {
        return {
          ...placementCover,
          coverResponse: premiumCover.coverResponse,
        };
      }
      return placementCover;
    });

    return mergedCovers;
  }

  async softDeletePlacementSlip(id: number): Promise<void> {
    const placement = await this.placementRepo.findOne({ where: { id } });
    if (!placement) {
      throw new NotFoundException(`Placement slip with ID ${id} not found`);
    }
    const deletedAt = new Date();
    await this.placementRepo.update(id, { deletedAt });
    await Promise.all([
      this.tpaRepo.update({ placementSlipId: id }, { deletedAt }),
      this.insurerRepo.update({ placementSlipId: id }, { deletedAt }),
      this.sharingRepo.update({ placementSlipId: id }, { deletedAt }),
      this.cdRepo.update({ placementSlipId: id }, { deletedAt }),
      this.coverRepo.update({ placementSlipId: id }, { deletedAt }),
      this.installmentsRepo.update({ placementSlipId: id }, { deletedAt }),
    ]);
  }

  async softDeleteQuoteEntry(id: number): Promise<void> {
    try {
      const quote = await this.quoteRepo.findOne({ where: { id } });
      if (!quote) {
        throw new NotFoundException(`Quote entry with ID ${id} not found`);
      }
      const deletedAt = new Date();
      Object.assign(quote, { deletedAt });
      await this.quoteRepo.save(quote);
      // await Promise.all([
      //   this.quoteEntryDocumentMapRepo.update(
      //     { opportunityQuoteEntryId: id },
      //     { deletedAt }
      //   ),
      //   this.coverRepo.update({ quoteId: id }, { deletedAt }),
      //   this.quoteTaxRepo.update(
      //     { opportunityQuoteEntryId: id },
      //     { deletedAt }
      //   ),
      // ]);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to soft delete quote entry: ${error.message}`
      );
    }
  }

  async removePlacementSlipInstallments(
    placementSlipId: number
  ): Promise<void> {
    await this.installmentsRepo.update(
      { placementSlipId },
      { deletedAt: new Date() }
    );
  }

  async createOpportunityRfpDetailsEntry(
    dto: CreateOpportunityRfpDetailsEntryDto,
    userId: number,
    entityManager: EntityManager
  ): Promise<OpportunityRfpDetailsEntry> {
    const rfpDetailsEntry = entityManager.create(OpportunityRfpDetailsEntry, {
      ...dto,
      createdBy: userId,
      updatedBy: userId,
    });
    return await entityManager.save(rfpDetailsEntry);
  }

  async createRfpTpaDetails(
    rfpDetailsEntryId: number,
    dto: CreateRfpTpaDetailsDto,
    userId: number,
    entityManager: EntityManager
  ): Promise<OpportunityRfpTpaDetail> {
    const tpaDetails = entityManager.create(OpportunityRfpTpaDetail, {
      ...dto,
      opportunityRfpDetailsEntryId: rfpDetailsEntryId,
      createdBy: userId,
      updatedBy: userId,
    });
    return await entityManager.save(tpaDetails);
  }

  async createRfpInsurerDetails(
    rfpDetailsEntryId: number,
    dto: CreateRfpInsurerDetailsDto,
    userId: number,
    entityManager: EntityManager
  ): Promise<OpportunityRfpInsurerDetail> {
    const insurerDetails = entityManager.create(OpportunityRfpInsurerDetail, {
      ...dto,
      opportunityRfpDetailsEntryId: rfpDetailsEntryId,
      createdBy: userId,
      updatedBy: userId,
    });
    return await entityManager.save(insurerDetails);
  }

  async createRfpClientContactDetails(
    rfpDetailsEntryId: number,
    dto: CreateRfpClientContactDetailsDto,
    userId: number,
    entityManager: EntityManager
  ): Promise<OpportunityRfpClientContactDetail> {
    const clientContactDetails = entityManager.create(
      OpportunityRfpClientContactDetail,
      {
        ...dto,
        opportunityRfpDetailsEntryId: rfpDetailsEntryId,
        createdBy: userId,
        updatedBy: userId,
      }
    );
    return await entityManager.save(clientContactDetails);
  }

  async createRfpClientContactInfluencers(
    clientContactId: number,
    influencerContactId: number,
    userId: number,
    entityManager: EntityManager
  ): Promise<OpportunityRfpClientContactInfluencers> {
    const influencers = entityManager.create(
      OpportunityRfpClientContactInfluencers,
      {
        clientContactId,
        influencerContactId,
        createdBy: userId,
        updatedBy: userId,
      }
    );
    return await entityManager.save(influencers);
  }

  async createRfpCreditSharing(
    rfpDetailsEntryId: number,
    dto: CreateRfpCreditSharingDto,
    userId: number,
    entityManager: EntityManager
  ): Promise<OpportunityRfpCreditSharing> {
    const creditSharing = entityManager.create(OpportunityRfpCreditSharing, {
      ...dto,
      opportunityRfpDetailsEntryId: rfpDetailsEntryId,
      createdBy: userId,
      updatedBy: userId,
    });
    const saved = await entityManager.save(creditSharing);

    const rfpEntry = await entityManager.findOne(OpportunityRfpDetailsEntry, {
      where: { id: rfpDetailsEntryId },
    });
    if (rfpEntry) {
      const participantUserId = await this.getUserIdByEmployeeId(
        entityManager,
        dto.executiveId
      );
      await this.addParticipantsToOpportunityActivity(
        entityManager,
        rfpEntry.opportunityActivityId,
        participantUserId,
        userId
      );
    }

    return saved;
  }

  async saveOpportunityRfpDetailsEntry(
    entityManager: EntityManager,
    opportunityActivityId: number,
    rfpDetailsEntryData: Partial<OpportunityRfpDetailsEntry>,
    userId: number
  ) {
    try {
      const repo = entityManager.getRepository(OpportunityRfpDetailsEntry);

      let rfpDetailsEntry = await repo.findOne({
        where: { opportunityActivityId },
      });

      if (rfpDetailsEntry) {
        rfpDetailsEntry = repo.merge(rfpDetailsEntry, {
          ...rfpDetailsEntryData,
          updatedBy: userId,
          updatedAt: new Date(),
        });
      } else {
        rfpDetailsEntry = repo.create({
          ...rfpDetailsEntryData,
          opportunityActivityId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return await repo.save(rfpDetailsEntry);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save RFP details entry: ${error.message}`
      );
    }
  }

  async saveRfpPreferenceDetails<T extends ObjectLiteral>(
    entityManager: EntityManager,
    rfpDetailsEntryId: number,
    detailsList: any[],
    userId: number,
    entity: EntityTarget<T>,
    entityId: "insurerId" | "tpaId",
    preferenceTypeField = "preferenceTypeLid"
  ): Promise<void> {
    try {
      // Fetch existing records
      const existing = await entityManager.find(entity, {
        where: { opportunityRfpDetailsEntryId: rfpDetailsEntryId },
      });

      // Build composite keys for incoming payload
      const newCompositeKeys = detailsList.map(
        (n) => `${n[entityId]}_${n[preferenceTypeField]}`
      );

      // Build composite keys for existing DB records
      const existingCompositeKeys = existing.map(
        (e: any) => `${e[entityId]}_${e[preferenceTypeField]}`
      );

      // DELETE → existing not present in new payload
      const recordsToDelete = existing.filter(
        (e: any) =>
          !newCompositeKeys.includes(`${e[entityId]}_${e[preferenceTypeField]}`)
      );

      // UPDATE → existing present in new payload
      const recordsToUpdate = existing.filter((e: any) =>
        newCompositeKeys.includes(`${e[entityId]}_${e[preferenceTypeField]}`)
      );

      // CREATE → new records not in DB
      const recordsToCreate = detailsList.filter(
        (n) =>
          !existingCompositeKeys.includes(
            `${n[entityId]}_${n[preferenceTypeField]}`
          )
      );

      // DELETE
      if (recordsToDelete.length > 0) {
        await entityManager.delete(entity, {
          id: In(recordsToDelete.map((d: any) => d.id)),
        });
      }

      // UPDATE
      for (const data of recordsToUpdate) {
        const match = detailsList.find(
          (n) =>
            n[entityId] == data[entityId] &&
            n[preferenceTypeField] == data[preferenceTypeField]
        );

        if (match) {
          await entityManager.update(
            entity,
            { id: data.id },
            { ...match, updatedBy: userId, updatedAt: new Date() }
          );
        }
      }

      // CREATE
      for (const item of recordsToCreate) {
        await entityManager.insert(entity, {
          ...item,
          opportunityRfpDetailsEntryId: rfpDetailsEntryId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save RFP Preferred/Excluded Insurers/TPAs details: ${error.message}`
      );
    }
  }

  async saveRfpCreditSharing(
    entityManager: EntityManager,
    rfpDetailsEntryId: number,
    payload: { executiveId?: number; percentage?: number }[],
    userId: number
  ) {
    try {
      // Repository
      const repo = entityManager.getRepository(OpportunityRfpCreditSharing);

      // Split incoming payload
      const payloadWithExec = payload.filter((x) => x.executiveId != null);
      const payloadWithoutExec = payload.filter((x) => x.executiveId == null);

      // Fetch existing from DB
      const existing = await repo.find({
        where: { opportunityRfpDetailsEntryId: rfpDetailsEntryId },
      });

      const existingWithExec = existing.filter((x) => x.executiveId != null);
      const existingWithoutExec = existing.filter((x) => x.executiveId == null);

      // 1. HANDLE RECORDS WITHOUT executiveId
      // Delete all existing rows that have no executiveId
      if (existingWithoutExec.length > 0) {
        await repo.delete({
          id: In(existingWithoutExec.map((x) => x.id)),
        });
      }

      // Insert fresh rows (no update since no id)
      for (const row of payloadWithoutExec) {
        await repo.insert({
          opportunityRfpDetailsEntryId: rfpDetailsEntryId,
          percentage: row.percentage,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 2. HANDLE RECORDS WITH executiveId
      const existingExecIds = existingWithExec.map((x) => x.executiveId);
      const payloadExecIds = payloadWithExec.map((x) => x.executiveId);

      // Delete missing (DB execId not found in payload)
      const toDelete = existingWithExec.filter(
        (row) => !payloadExecIds.includes(row.executiveId)
      );
      if (toDelete.length > 0) {
        await repo.delete({ id: In(toDelete.map((x) => x.id)) });
      }

      // Update existing
      for (const row of existingWithExec) {
        const inc = payloadWithExec.find(
          (x) => x.executiveId === row.executiveId
        );
        if (inc) {
          await repo.update(
            { id: row.id },
            {
              percentage: inc.percentage,
              updatedBy: userId,
              updatedAt: new Date(),
            }
          );
        }
      }

      // Create missing
      const toCreate = payloadWithExec.filter(
        (x) => !existingExecIds.includes(x.executiveId)
      );

      for (const row of toCreate) {
        await repo.insert({
          opportunityRfpDetailsEntryId: rfpDetailsEntryId,
          executiveId: row.executiveId,
          percentage: row.percentage,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save RFP Credit Sharing details: ${error.message}`
      );
    }
  }

  async saveRfpClientContactDetails(
    entityManager: EntityManager,
    rfpDetailsEntryId: number,
    clientContactDetails: CreateRfpClientContactDetailsDto,
    userId: number
  ) {
    try {
      const contactDetailRepo = entityManager.getRepository(
        OpportunityRfpClientContactDetail
      );

      const influencerRepo = entityManager.getRepository(
        OpportunityRfpClientContactInfluencers
      );

      // 1. FETCH EXISTING CONTACT DETAIL
      const existing = await contactDetailRepo.findOne({
        where: { opportunityRfpDetailsEntryId: rfpDetailsEntryId },
      });

      let contactDetailId: number;
      if (!existing) {
        // 2A. CREATE NEW CONTACT DETAIL
        const created = await contactDetailRepo.save({
          opportunityRfpDetailsEntryId: rfpDetailsEntryId,
          contactId: clientContactDetails.contactId,
          expectedPremium: clientContactDetails.expectedPremium,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        contactDetailId = created.id;
      } else {
        // 2B. UPDATE EXISTING CONTACT DETAIL
        await contactDetailRepo.update(
          { id: existing.id },
          {
            contactId: clientContactDetails.contactId,
            expectedPremium: clientContactDetails.expectedPremium,
            updatedBy: userId,
          }
        );
        contactDetailId = existing.id;
      }

      // 3. HANDLE INFLUENCERS
      const newInfluencerIds = clientContactDetails.decisionInfluencers ?? [];
      const existingInfluencers = await influencerRepo.find({
        where: { clientContactId: contactDetailId },
      });

      const existingIds = existingInfluencers.map((i) => i.influencerContactId);

      // influencers to delete
      const deleteList = existingInfluencers.filter(
        (i) => !newInfluencerIds.includes(i.influencerContactId)
      );

      // influencers to add
      const createList = newInfluencerIds.filter(
        (id) => !existingIds.includes(id)
      );

      // delete
      if (deleteList.length > 0) {
        await influencerRepo.delete({
          id: In(deleteList.map((i) => i.id)),
        });
      }

      // create
      for (const influencerId of createList) {
        await influencerRepo.save({
          clientContactId: contactDetailId,
          influencerContactId: influencerId,
        });
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to upsert client contact details: ${error.message}`
      );
    }
  }

  async createRfpDetailsEntryDocumentMap(
    rfpDetailsEntryId: number,
    dto: OpportunityActivityDocumentDto,
    userId: number,
    entityManager: EntityManager
  ): Promise<OpportunityRfpDetailsEntryDocumentMap> {
    const documentMap = entityManager.create(
      OpportunityRfpDetailsEntryDocumentMap,
      {
        ...dto,
        opportunityRfpDetailsEntryId: rfpDetailsEntryId,
        createdBy: userId,
        updatedBy: userId,
      }
    );
    return await entityManager.save(documentMap);
  }

  async getBrokingSlipVersionsByOpportunityId(opportunityId: any) {
    try {
      const brokingSlipVersions = await this.opportunityRepository.manager.find(
        BrokingSlipVersionDetails,
        {
          where: { opportunityId },
        }
      );

      if (!brokingSlipVersions || brokingSlipVersions.length == 0) {
        throw new NotFoundException(
          "No Broking Slip Versions found for the given Opportunity ID."
        );
      }

      const brokingSlipVersionDetailsResponse: BrokingSlipVersionsListDto[] =
        brokingSlipVersions.map(
          (brokingSlipVersion: BrokingSlipVersionDetails) => ({
            id: brokingSlipVersion.id,
            version: brokingSlipVersion.brokingSlipVersion,
            name: brokingSlipVersion.brokingSlipName,
          })
        );
      return brokingSlipVersionDetailsResponse;
    } catch (error) {
      console.log(error);
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }

  async getBrokingSlipByOpportunityId(opportunityId: number) {
    try {
      const brokingSlipVersions = await this.opportunityRepository.manager.find(
        BrokingSlipVersionDetails,
        {
          where: { opportunityId },
          relations: [
            "preferredInsurerDetails",
            "preferredInsurerDetails.insurer",
            "preferredInsurerDetails.contact",
            "preferredTpaDetails",
            "preferredTpaDetails.tpa",
            "preferredTpaDetails.contact",
            "opportunity",
            "coverDetails",
          ],
        }
      );

      if (!brokingSlipVersions) {
        throw new NotFoundException(
          "errorMessages.brokingSlipNotFound(opportunityId)"
        );
      }
      return brokingSlipVersions;
    } catch (error) {
      console.log(error);
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }
  async getOrgNameByOpportunityId(opportunityId: number) {
    try {
      const opportunity = await this.opportunityRepository.findOne({
        where: { opportunityId },
        relations: ["owner", "owner.organisation"],
      });
      return opportunity?.owner?.organisation?.organisationKey || null;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }

  async findDataValidationActivity(opportunityId: number) {
    return await this.opportunityActivityMapRepository.findOne({
      where: {
        opportunityId,
        activityKey: ACTIVITY_KEY.DATA_VALIDATION_ACTIVITY,
      },
      relations: ["owner", "owner.branch", "owner.organisation"],
      order: { id: "DESC" },
    });
  }

  async getAllBrokingSlipVersionsWithDetails(
    opportunityId: number,
    entityManager: EntityManager
  ) {
    try {
      const organisationName = await this.getOrgNameByOpportunityId(
        opportunityId
      );
      const versionsData = await this.getBrokingSlipVersionsByOpportunityId(
        opportunityId
      );
      let brokingSlipData: any = [],
        coversData: any = [],
        versionNames: any = [];
      const dataValidationActivity = await this.findDataValidationActivity(
        opportunityId
      );

      const ownerBranch = (dataValidationActivity?.owner ?? null)?.branch;
      const branchName = ownerBranch?.name ?? "";

      if (versionsData.length > 0) {
        const brokingSlipPreferredTpaDetails =
          await this.opportunityRepository.manager.find(PreferredTpaDetails, {
            where: { opportunityId },
          });
        const brokingSlipPreferredInsurerDetails =
          await this.opportunityRepository.manager.find(
            PreferredInsurerDetails,
            {
              where: { opportunityId },
            }
          );
        const opportunityDetails =
          await this.opportunityRepository.manager.findOne(Opportunity, {
            where: {
              opportunityId,
              opportunityActivityMap: {
                roleKey: ROLE_KEY.ROLE_BD_EXECUTIVE,
              },
            },
            relations: [
              "opportunityActivityMap",
              "opportunityActivityMap.owner",
              "company",
              "policyType",
              "company.companyAddresses.address",
              "company.companyAddresses.address.cityId",
              "company.companyAddresses.address.stateId",
            ],
          });
        const { insurerIds, tpaIds, contactIds, branchIds, locationIds } =
          await this.extractBrokingSlipDetailsIds(
            brokingSlipPreferredInsurerDetails,
            brokingSlipPreferredTpaDetails
          );
        const allPreferredData = await this.getBrokingSlipReferenceDetails(
          insurerIds,
          tpaIds,
          locationIds,
          branchIds,
          contactIds
        );
        const { preferredInsurerDetails, preferredTpaDetails } =
          await this.mapBrokingSlipDetails(
            brokingSlipPreferredInsurerDetails,
            brokingSlipPreferredTpaDetails,
            allPreferredData
          );
        const versionDetailEntities: BrokingSlipVersionDetails[] =
          await this.opportunityRepository.manager.find(
            BrokingSlipVersionDetails,
            {
              where: { opportunityId },
              relations: ["coverDetails"],
            }
          );
        const versionDetailById = new Map<number, BrokingSlipVersionDetails>(
          versionDetailEntities.map((entity) => [entity.id, entity])
        );
        brokingSlipData = versionsData.map((version) => {
            const versionEntity = versionDetailById.get(version.id);
            const brokingSlipDetails = versionEntity
              ? this.mapBrokingSlipVersionToDto(versionEntity)
              : null;
            if (brokingSlipDetails) {
              if (!versionNames.includes(version.name)) {
                versionNames.push(version.name);
              } else {
                brokingSlipDetails.versionName =
                  version.name + "_" + version.version;
                versionNames.push(brokingSlipDetails?.versionName);
              }
              if (brokingSlipDetails?.formData?.coversConfig) {
                const keys = Object.keys(
                  brokingSlipDetails.formData.coversConfig
                );
                coversData = [...coversData, ...keys];
              }

              const addressInfo =
                opportunityDetails.company.companyAddresses?.[0]?.address;
              const address = addressInfo
                ? `${addressInfo.address1} ${addressInfo.cityId.name} ${
                    addressInfo.stateId.name
                  }${addressInfo.pincode ? " " + addressInfo.pincode : ""}`
                : "";
              const owner =
                opportunityDetails.opportunityActivityMap?.[0]?.owner;
              const ownerName = owner ? `${owner.emailId}` : "";
              const currentDate = new Date();
              const formattedDate = `${currentDate.getDate()}-${currentDate.toLocaleString(
                "en-US",
                { month: "long" }
              )}-${currentDate.getFullYear()}`;
              const policyName = opportunityDetails.policyType.lookUpValue;
              return {
                versionName: brokingSlipDetails.versionName,
                policyType: policyName,
                formData: {
                  generalData: {
                    "Name of the insured":
                      opportunityDetails.company.companyName,
                    "Address of Insured/Proposer": address,
                    "Business Activities of Company":
                      brokingSlipDetails.formData.versionDetails
                        .businessActivity,
                    "Name of the Intermediary ( Existing & New if applicable )":
                      "M/s. India Insure Risk Management and Insurance Broking Services Private Ltd.",
                    "Contact Details including E Mail ID": ownerName,
                  },
                  preferredTpaDetails,
                  expiringPolicyDetails: {
                    "Period of Insurance and Policy Number (Inception Date and Expiry Date)":
                      "",
                  },
                  preferredInsurerDetails,
                  coversConfig: brokingSlipDetails.formData.coversConfig,
                  otherTermsAndConditions: {
                    [`All other terms and conditions as per Standard ${policyName} Policy`]:
                      "",
                    "I/We hereby declare , on my behalf and on behalf of all persons proposed to be insured, that the above statements , answers and/ or particulars given by me are true and complete in all respects to the best of my knowledge and that I/We am/are authorized to propose on behalf of these persons.":
                      "",
                    [`Date: ${formattedDate}  &   Place: ${branchName}`]: "",
                    "Signature of the Designated Official of the Intermediary":
                      "",
                    "With Name and Designation": "",
                  },
                  disclaimer: {
                    "To the best of our knowledge, the information supplied in this document is accurate. India Insure accepts no liability for any loss arising out of your reliance on information, which has been supplied, to India Insure by or on behalf of India Insure’s clients":
                      "",
                  },
                },
                organisationName: organisationName,
              };
            }
            return brokingSlipDetails;
        });
        // Remove duplicates if needed
        coversData = Array.from(new Set(coversData));
        const coversDetails = await this.getOpportunityQuoteCoverByIds(
          entityManager,
          coversData
        );

        const coversDetailsMap = new Map<string, string>();
        const coverSectionMap = new Map<string, string | null>();

        if (coversDetails && coversDetails.length > 0) {
          const sectionIds = Array.from(
            new Set(
              coversDetails
                .map((cover: any) => cover.sectionId)
                .filter((sectionId: any) => Number.isInteger(sectionId))
            )
          ) as number[];

          let sectionNameById = new Map<number, string>();
          if (sectionIds.length > 0) {
            const sections = await entityManager.find(MstrCoverSection, {
              where: { id: In(sectionIds), isActive: true },
              select: ["id", "name"],
            });
            sectionNameById = new Map(
              sections.map((section) => [section.id, section.name])
            );
          }

          coversDetails.forEach((cover: any) => {
            coversDetailsMap.set(cover.id.toString(), cover.coverName);
            coverSectionMap.set(
              cover.id.toString(),
              Number.isInteger(cover.sectionId)
                ? sectionNameById.get(cover.sectionId) || null
                : null
            );
          });
        }

        brokingSlipData.forEach((brokingSlip: any) => {
          if (brokingSlip.formData?.coversConfig) {
            const existingCoversConfig = brokingSlip.formData.coversConfig;
            const sortedCoversConfig: any = {};
            const coversConfigRows: Array<{
              sectionName: string | null;
              key: string;
              value: unknown;
            }> = [];

            coversDetailsMap.forEach((coverName, id) => {
              if (
                Object.prototype.hasOwnProperty.call(existingCoversConfig, id)
              ) {
                const value = existingCoversConfig[id];
                sortedCoversConfig[coverName] = value;
                coversConfigRows.push({
                  sectionName: coverSectionMap.get(id) || null,
                  key: coverName,
                  value,
                });
              }
            });

            brokingSlip.formData.coversConfig = sortedCoversConfig;
            brokingSlip.formData.coversConfigRows = coversConfigRows;
          }
        });
      }
      return brokingSlipData;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }
  //updated repository call for getting the data of the opportunity
  async getBrokingSlipDetailsByOpportunityId(
    opportunityId: any
  ): Promise<Partial<BrokingSlipDataDto> | null> {
    let brokingSlipVersionDetails: Partial<BrokingSlipDataDto>;
    try {
      const brokingSlipVersions =
        await this.opportunityRepository.manager.findOne(
          BrokingSlipVersionDetails,
          {
            where: { opportunityId: opportunityId },
            order: { brokingSlipVersion: "DESC" },
          }
        );

      if (!brokingSlipVersions) {
        brokingSlipVersionDetails = {
          defaultCovers: {},
          formData: {
            documents: [],
            others: {
              clauses: "",
              insurerRemarks: "",
              remarks: "",
              riskMitigationFeatures: "",
            },
            preferredInsurerDetails: [],
            preferredTPADetails: [],
          },
        };
      } else {
        brokingSlipVersionDetails = {
          defaultCovers: {},
          formData: {
            documents: [],
            others: {
              clauses: brokingSlipVersions.clauses,
              insurerRemarks: brokingSlipVersions.insurerRemarks,
              remarks: brokingSlipVersions.remarks,
              riskMitigationFeatures:
                brokingSlipVersions.riskMitigationFeatures,
            },
            preferredInsurerDetails:
              brokingSlipVersions.preferredInsurerDetails?.map(
                (x: PreferredInsurerDetails) => ({
                  insurerBranchId: x.insurerBranchId,
                  insurerContactId: x.insurerContactId,
                  id: x.id,
                  insurerId: x.insurerId,
                  insurerLocationId: x.insurerLocationId,
                })
              ) ?? [],
            preferredTPADetails:
              brokingSlipVersions.preferredTpaDetails?.map(
                (x: PreferredTpaDetails) => ({
                  branchId: x.branchId,
                  contactId: x.contactId,
                  id: x.id,
                  tpaId: x.tpaId,
                  locationId: x.locationId,
                })
              ) ?? [],
          },
        };
      }
      // updating the preferred Insurer details
      const insurerDetails = await this.opportunityRepository.manager.find(
        PreferredInsurerDetails,
        { where: { opportunityId: opportunityId } }
      );
      if (insurerDetails && insurerDetails.length) {
        brokingSlipVersionDetails.formData!.preferredInsurerDetails =
          insurerDetails
            ?.sort((a, b) => a.id - b.id)
            ?.map((x: PreferredInsurerDetails) => ({
              insurerBranchId: x.insurerBranchId,
              insurerContactId: x.insurerContactId,
              insurerId: x.insurerId,
              insurerLocationId: x.insurerLocationId,
            }));
      }

      //updating preferrred tpa details
      const tpaDetails = await this.opportunityRepository.manager.find(
        PreferredTpaDetails,
        { where: { opportunityId: opportunityId } }
      );
      if (tpaDetails && tpaDetails.length) {
        brokingSlipVersionDetails.formData!.preferredTPADetails = tpaDetails
          ?.sort((a, b) => a.id - b.id)
          ?.map((x: PreferredTpaDetails) => ({
            branchId: x.branchId,
            contactId: x.contactId,
            tpaId: x.tpaId,
            locationId: x.locationId,
          }));
      }

      //updating document details
      const documentDetails = await this.opportunityRepository.manager.find(
        OpportunityBrokingSlipActivityDocumentMap,
        { where: { opportunityId: opportunityId } }
      );
      if (documentDetails && documentDetails.length) {
        const uniqueDocuments = new Map<number, any>();
        for (const doc of documentDetails) {
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
              documentId: doc.documentId,
              documentTypeLid: doc.documentTypeLid,
              fileName,
              documentType: lookupData?.lookUpValue || null,
            });
          }
        }

        brokingSlipVersionDetails.formData!.documents = Array.from(
          uniqueDocuments.values()
        );
      }

      // Update the covers details here;
      const coversDetails = await this.opportunityRepository.manager.find(
        BrokingSlipVersionCoverDetails,
        {
          where: { opportunityId: opportunityId },
        }
      );

      if (coversDetails.length) {
        brokingSlipVersionDetails.defaultCovers = coversDetails.reduce(
          (
            acc: Record<string, string>,
            coverDetails: BrokingSlipVersionCoverDetails
          ) => {
            if (coverDetails.coverMapId && coverDetails.coverResponse) {
              acc[coverDetails.coverMapId] = coverDetails.coverResponse;
            }
            return acc;
          },
          {}
        );
      } else {
        const CoversDetails = await this.getCoverDetailsForBrokingSlip(
          opportunityId
        );

        brokingSlipVersionDetails.defaultCovers = CoversDetails?.reduce(
          (
            acc: Record<string, string>,
            coverDetails: BrokingSlipVersionMappedCoverDto
          ) => {
            if (coverDetails.coverMapId && coverDetails.coverResponse) {
              acc[coverDetails.coverMapId] = coverDetails.coverResponse;
            }
            return acc;
          },
          {}
        );
      }
      return brokingSlipVersionDetails;
    } catch (error) {
      console.log(error);
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }

  async getCoverDetailsForBrokingSlip(
    opportunityId: number
  ): Promise<BrokingSlipVersionMappedCoverDto[] | null> {
    try {
      const rfpCoverDetails = await this.rfpCoverDetailRepository.find({
        where: { opportunityId },
      });

      if (rfpCoverDetails.length) {
        return rfpCoverDetails.map((x: OpportunityRfpCoverDetail) => ({
          brokingSlipVersionId: 0,
          coverMapId: x.coverMapId,
          coverName: x.coverName,
          coverResponse: x.coverResponse,
          opportunityId: opportunityId,
          policyTypeId: x.policyTypeId,
          id: 0,
        }));
      } else {
        const covers = await this.opportunityRepository.manager.find(
          OpportunityCoverMap,
          {
            where: { opportunityId },
          }
        );

        if (covers.length) {
          return covers.map((x: OpportunityCoverMap) => ({
            brokingSlipVersionId: 0,
            coverMapId: x.id,
            coverName: x.coverName ?? "",
            coverResponse: x.coverDescription ?? "",
            opportunityId: opportunityId,
            policyTypeId: x.policyTypeId,
            id: 0,
          }));
        } else {
          return null;
        }
      }
    } catch (error) {
      console.log(error);
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }

  private async getFileNamesByDocumentIds(
    documentIds: number[]
  ): Promise<Map<number, string>> {
    if (!documentIds || documentIds.length === 0) {
      return new Map();
    }

    const fileUploadRecords = await this.opportunityRepository.manager
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

  async getBrokingSlipByVersionId(
    versionId: number,
    opportunityId: number
  ): Promise<BrokingSlipVersionDetailsDto | null> {
    try {
      const brokingSlipVersions =
        await this.opportunityRepository.manager.findOne(
          BrokingSlipVersionDetails,
          {
            where: { opportunityId, id: versionId },
            relations: [
              "preferredInsurerDetails",
              "preferredInsurerDetails.insurer",
              "preferredInsurerDetails.contact",
              "preferredTpaDetails",
              "preferredTpaDetails.tpa",
              "preferredTpaDetails.contact",
              "opportunity",
              "coverDetails",
            ],
          }
        );

      if (!brokingSlipVersions) {
        throw new NotFoundException(
          "errorMessages.brokingSlipNotFound(opportunityId)"
        );
      }
      return this.mapBrokingSlipVersionToDto(brokingSlipVersions);
    } catch (error) {
      console.log(error);
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }

  private mapBrokingSlipVersionToDto(
    brokingSlipVersions: BrokingSlipVersionDetails
  ): BrokingSlipVersionDetailsDto {
    let coversDetails: Record<string, string> = {};
    if (brokingSlipVersions.coverDetails) {
      coversDetails = brokingSlipVersions.coverDetails.reduce(
        (
          acc: Record<string, string>,
          coverDetails: BrokingSlipVersionCoverDetails
        ) => {
          if (coverDetails.coverMapId && coverDetails.coverResponse) {
            acc[coverDetails.coverMapId] = coverDetails.coverResponse;
          }
          return acc;
        },
        {}
      );
    }
    const brokingSlipVersionDetails: BrokingSlipVersionDetailsDto = {
      versionName: brokingSlipVersions.brokingSlipName,
      formData: {
        versionDetails: {
          basicPremium: brokingSlipVersions.basicPremium
            ? Number(brokingSlipVersions.basicPremium)
            : 0,
          brokeragePercentage: brokingSlipVersions.brokeragePercentage
            ? Number(brokingSlipVersions.brokeragePercentage)
            : 0,
          brokerageAmount: brokingSlipVersions.brokerageAmount
            ? Number(brokingSlipVersions.brokerageAmount)
            : 0,
          businessActivity: brokingSlipVersions.businessActivity,
          policyFrom: brokingSlipVersions.policyFrom.toString(),
          policyTo: brokingSlipVersions.policyTo.toString(),
          quoteReceiptTimeline:
            brokingSlipVersions.quoteReceiptTimeline.toString(),
          renewalDate: brokingSlipVersions.renewalDate.toString(),
          sumInsured: parseInt(brokingSlipVersions.sumInsured.toString()),
        },
        coversConfig: coversDetails,
      },
    };
    removeMetadataFields(brokingSlipVersionDetails);
    removeLookUpDataFields(brokingSlipVersionDetails);
    return brokingSlipVersionDetails;
  }

  async getOpportunityActivityStatus(
    opportunityActivityId: number
  ): Promise<boolean | null> {
    try {
      return await this.opportunityRepository.manager.transaction(
        async (transactionalEntityManager) => {
          const opportunityActivityDetails =
            await transactionalEntityManager.findOne(OpportunityActivityMap, {
              where: { id: opportunityActivityId },
            });
          if (!opportunityActivityDetails) {
            throw new NotFoundException("Opportunity activity Id not found");
          }

          const opportunityStatus = await transactionalEntityManager.findOne(
            LookUp,
            {
              where: { lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED },
            }
          );
          return opportunityActivityDetails.statusLid === opportunityStatus?.id;
        }
      );
    } catch (error) {
      console.log(error);
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }

  // This function updates the activity status of an opportunity activity.
  async updateNextActivityStatus(
    opportunityActivityId: number,
    currentActivityStatusLid: number,
    entityManager?: EntityManager
  ) {
    try {
      const updateNextActivityStatus = async (manager: EntityManager) => {
        const currentActivityStatus = await manager.findOne(LookUp, {
          where: { id: currentActivityStatusLid },
        });
        if (
          currentActivityStatus?.lookUpKey !==
            OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS &&
          currentActivityStatus?.lookUpKey !==
            OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED
        ) {
          const currentActivity = await manager.findOne(
            OpportunityActivityMap,
            {
              where: { id: opportunityActivityId },
              select: ["opportunityId", "activityOrder"],
            }
          );
          if (!currentActivity) {
            throw new NotFoundException(
              `Opportunity activity not found with id: ${opportunityActivityId}`
            );
          }
          const opportunityActivityDetails = await manager.findOne(
            OpportunityActivityMap,
            {
              where: {
                opportunityId: currentActivity.opportunityId,
                activityOrder: Number(currentActivity.activityOrder) + 1,
              },
            }
          );
          if (!opportunityActivityDetails) {
            return; // No next activity to update
          } else {
            const status = await manager.findOne(LookUp, {
              where: {
                lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS,
              },
            });
            if (!status) {
              throw new NotFoundException(
                "Opportunity activity status not found"
              );
            }
            Object.assign(opportunityActivityDetails, { statusLid: status.id });
            await manager.save(OpportunityActivityMap, opportunityActivityDetails);
          }
        }
      };
      if (entityManager) {
        return await updateNextActivityStatus(entityManager); // Use the provided transaction
      } else {
        return await this.opportunityRepository.manager.transaction(
          updateNextActivityStatus
        ); // Start a new transaction
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(error.message);
    }
  }

  async generateBrokingSlipVersion(
    brokingSlipData: BrokingSlipVersionDetailsDto,
    createdBy: number,
    opportunityId: number
  ): Promise<number | null> {
    try {
      return await this.opportunityRepository.manager.transaction(
        async (transactionalEntityManager) => {
          try {
            const opportunity = await transactionalEntityManager.findOne(
              Opportunity,
              { where: { opportunityId } }
            );
            if (!opportunity) {
              throw new NotFoundException(
                errorMessages.opportunityNotPresent(opportunityId)
              );
            }
            const latestSlipVersion = await transactionalEntityManager.find(
              BrokingSlipVersionDetails,
              {
                where: { opportunityId },
                order: { brokingSlipVersion: "DESC" },
              }
            );
            const maxId = (latestSlipVersion[0]?.brokingSlipVersion ?? 0) + 1;

            const brokingSlipDTO = transactionalEntityManager.create(
              BrokingSlipVersionDetails,
              {
                basicPremium:
                  brokingSlipData.formData.versionDetails.basicPremium,
                brokeragePercentage:
                  brokingSlipData.formData.versionDetails.brokeragePercentage,
                brokerageAmount:
                  brokingSlipData.formData.versionDetails.brokerageAmount,
                brokingSlipName: brokingSlipData.versionName,
                brokingSlipVersion: maxId,
                businessActivity:
                  brokingSlipData.formData.versionDetails.businessActivity,
                sumInsured: brokingSlipData.formData.versionDetails.sumInsured,
                renewalDate:
                  brokingSlipData.formData.versionDetails.renewalDate,
                quoteReceiptTimeline:
                  brokingSlipData.formData.versionDetails.quoteReceiptTimeline,
                policyFrom: brokingSlipData.formData.versionDetails.policyFrom,
                policyTo: brokingSlipData.formData.versionDetails.policyTo,
                riskMitigationFeatures:
                  latestSlipVersion[0]?.riskMitigationFeatures ?? "",
                insurerRemarks: latestSlipVersion[0]?.insurerRemarks ?? "",
                remarks: latestSlipVersion[0]?.remarks ?? "",
                clauses: latestSlipVersion[0]?.clauses ?? "",
                opportunityId: opportunityId,
                createdBy: createdBy,
                updatedBy: createdBy,
              }
            );
            const brokingSlip = await transactionalEntityManager.save(
              BrokingSlipVersionDetails,
              brokingSlipDTO
            );
            const brokingSlipId = brokingSlip.id;
            const coverDetails = await this.opportunityRepository.manager.find(
              OpportunityCoverMap,
              {
                where: {
                  id: In(Object.keys(brokingSlipData.formData.coversConfig)),
                },
              }
            );
            const coversDetailsDto = coverDetails.map(
              (coverDetail: OpportunityCoverMap) => {
                return transactionalEntityManager.create(
                  BrokingSlipVersionCoverDetails,
                  {
                    opportunityId: opportunityId,
                    coverMapId: coverDetail.id,
                    coverName: coverDetail.coverName,
                    coverResponse:
                      brokingSlipData.formData.coversConfig[coverDetail.id],
                    createdAt: new Date(),
                    createdBy: createdBy,
                    updatedBy: createdBy,
                    updatedAt: new Date(),
                    policyTypeId: coverDetail.policyTypeId,
                    brokingSlipVersionId: brokingSlipId,
                  }
                );
              }
            );
            await transactionalEntityManager.save(
              BrokingSlipVersionCoverDetails,
              coversDetailsDto
            );
            return brokingSlipId;
          } catch (error) {
            console.error(
              "Error in generate BrokingSlip Version transaction:",
              error
            );
            throw new BadRequestException(
              `Failed to generate broking slip: ${error?.message}`
            );
          }
        }
      );
    } catch (error) {
      // If transaction fails, return null to satisfy the return type
      return null;
    }
  }

  async getPremiumCalculationByOpportunityActivityId(
    opportunityActivityId: number
  ): Promise<any> {
    try {
      const premiumCalculation =
        await this.opportunityRepository.manager.findOne(
          OpportunityPremiumCalculation,
          {
            where: { opportunityActivityId },
          }
        );

      if (!premiumCalculation) return null;

      if (premiumCalculation) {
        removeMetadataFields(premiumCalculation);
        removeLookUpDataFields(premiumCalculation);
      }
      return premiumCalculation;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }

  async getOpportunityQuoteActivityById(
    manager: EntityManager,
    opportunityActivityId: number
  ): Promise<OpportunityActivityMap | null> {
    return manager.findOne(OpportunityActivityMap, {
      where: { id: opportunityActivityId },
    });
  }

  async getOpportunityQuoteCovers(
    manager: EntityManager,
    opportunityId: number
  ): Promise<OpportunityCoverMap[]> {
    return manager.find(OpportunityCoverMap, {
      where: { opportunityId },
    });
  }

  async getOpportunityQuoteCoverByIds(
    manager: EntityManager,
    coverIds: number[]
  ): Promise<OpportunityCoverMap[]> {
    return manager.find(OpportunityCoverMap, {
      where: { id: In(coverIds) },
      order: { displaySequence: "ASC" },
    });
  }

  prepareQuoteCoverDetails(
    covers: any[],
    coverMaps: OpportunityCoverMap[],
    opportunityId: number,
    createdBy: number
  ): OpportunityQuoteCoverDetail[] {
    return covers.map((cover) => {
      const coverMap = coverMaps.find((map) => map.id === cover.id);
      if (!coverMap) {
        throw new NotFoundException(
          `Cover with ID ${cover.id} not found in Opportunity Cover Map.`
        );
      }
      return {
        opportunityId,
        quoteId: cover.quoteId,
        coverMapId: coverMap.id,
        policyTypeId: coverMap.policyTypeId,
        coverName: coverMap.coverName,
        insurerCoverResponse: cover.response,
        createdBy,
        updatedBy: createdBy,
      } as OpportunityQuoteCoverDetail;
    });
  }

  async saveQuoteCoverDetails(
    manager: EntityManager,
    quoteCoverDetails: OpportunityQuoteCoverDetail[]
  ): Promise<void> {
    await manager.save(OpportunityQuoteCoverDetail, quoteCoverDetails);
  }

  async deleteQuoteCoverDetails(
    quoteId: number,
    manager: EntityManager
  ): Promise<void> {
    await manager.delete(OpportunityQuoteCoverDetail, { quoteId });
  }

  prepareQuoteTaxDetails(
    taxDetails: { tax: number; taxValue: number }[],
    quoteEntryId: number,
    createdBy: number
  ): OpportunityQuoteTaxMap[] {
    return taxDetails.map((tax) => {
      return this.quoteTaxRepo.create({
        opportunityQuoteEntryId: quoteEntryId,
        taxLid: tax.tax,
        taxValue: tax.taxValue,
        createdBy,
        updatedBy: createdBy,
      });
    });
  }

  async saveQuoteTaxDetails(
    manager: EntityManager,
    taxRecords: OpportunityQuoteTaxMap[]
  ): Promise<void> {
    await manager.save(OpportunityQuoteTaxMap, taxRecords);
  }

  async deleteQuoteTaxDetails(
    quoteEntryId: number,
    manager: EntityManager
  ): Promise<void> {
    await manager.delete(OpportunityQuoteTaxMap, {
      opportunityQuoteEntryId: quoteEntryId,
    });
  }
  async updatePolicyConfirmationActivity(
    entityManager: EntityManager,
    heldCoverNoteId: number,
    updateData: Partial<UpdatePolicyConfirmationDto>,
    userId: number
  ): Promise<any> {
    try {
      const fieldsToUpdate: any = {
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date(),
      };
      // Perform the update
      await entityManager.update(
        OpportunityPolicyConfirmation,
        { id: heldCoverNoteId },
        fieldsToUpdate
      );
      const updatedRecord = await entityManager.findOne(
        OpportunityPolicyConfirmation,
        {
          where: { id: heldCoverNoteId },
        }
      );

      if (updatedRecord) {
        removeMetadataFields(updatedRecord);
        removeLookUpDataFields(updatedRecord);
      }

      return updatedRecord ?? fieldsToUpdate;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update policy confirmation note: ${error.message}`
      );
    }
  }

  async updatePolicyHardCopyActivity(
    entityManager: EntityManager,
    heldCoverNoteId: number,
    updateData: Partial<OpportunityHeldCoverNote>,
    userId: number,
    opportunityId: number
  ): Promise<any> {
    try {
      const fieldsToUpdate: any = {
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date(),
      };
      // Perform the update
      await entityManager.update(
        OpportunityPolicyHardCopy,
        { id: heldCoverNoteId },
        fieldsToUpdate
      );
      // Persist insurer policy number on the base policy table
      if (fieldsToUpdate.insurerPolicyNo) {
        await entityManager.update(
          Policy,
          { opportunityId: opportunityId as number },
          { insurerPolicyNumber: fieldsToUpdate.insurerPolicyNo as string }
        );
      }
      const updatedRecord = await entityManager.findOne(
        OpportunityPolicyHardCopy,
        {
          where: { id: heldCoverNoteId },
        }
      );

      if (updatedRecord) {
        removeMetadataFields(updatedRecord);
        removeLookUpDataFields(updatedRecord);
      }

      return updatedRecord ?? fieldsToUpdate;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to update policy hard copy: ${error.message}`
      );
    }
  }
  async createHandOveMeet(
    entityManager: EntityManager,
    meetingData: Partial<CreateHandOverMeetDto>
  ): Promise<OpportunityHandOverMeet> {
    try {
      const existingMeeting = await entityManager.findOne(
        OpportunityHandOverMeet,
        {
          where: {
            opportunityActivityId: meetingData.opportunityActivityId,
          },
        }
      );
      if (existingMeeting) {
        throw new BadRequestException(
          `Hand Over Meeting record already exists for Opportunity ID: ${meetingData.opportunityId} and Activity ID: ${meetingData.activityId}`
        );
      }

      const meeting = entityManager.create(
        OpportunityHandOverMeet,
        meetingData
      );
      return await entityManager.save(OpportunityHandOverMeet, meeting);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new Error(`Failed to create Hand Over meeting: ${error.message}`);
    }
  }

  async saveHandOverMeet(
    entityManager: EntityManager,
    opportunityActivityId: number,
    handOverMeetData: Partial<OpportunityHandOverMeet>,
    userId: number
  ) {
    try {
      const repo = entityManager.getRepository(OpportunityHandOverMeet);

      let handOverMeet = await repo.findOne({
        where: { opportunityActivityId },
      });

      if (handOverMeet) {
        handOverMeet = repo.merge(handOverMeet, {
          ...handOverMeetData,
          updatedBy: userId,
          updatedAt: new Date(),
        });
      } else {
        handOverMeet = repo.create({
          ...handOverMeetData,
          opportunityActivityId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return await repo.save(handOverMeet);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save hand over meeting details: ${error.message}`
      );
    }
  }

  async checkActivityExists(
    opportunityActivityId: number
  ): Promise<OpportunityRfpDetailsEntry | null> {
    try {
      const existingActivity =
        await this.opportunityRfpDetailsEntryRepository.findOne({
          where: { opportunityActivityId },
        });

      return existingActivity;
    } catch (error) {
      console.error("Error checking activity existence:", error);
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to check activity existence."
      );
    }
  }

  async getQuotesBasedOnOpportunityActivityId(
    opportunityId: number,
    page: number,
    limit: number
  ) {
    try {
      const { data, count } = await this.entityService.fetchEntityList(
        OpportunityQuoteEntry,
        page,
        limit,
        undefined,
        undefined,
        { opportunityId } // Filter by opportunityId
      );
      if (!data || data.length === 0) {
        return { data: [], count: 0 };
      }
      return data;
    } catch (error) {
      console.error("Error fetching quotes:", error);
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to fetch quotes based on opportunity activity ID."
      );
    }
  }

  async getQuoteById(quoteId: number) {
    try {
      const quote = await this.quoteRepo.findOne({
        where: { id: quoteId },
        relations: ["taxMappings", "documentMappings", "coverDetails"],
      });
      if (!quote) {
        throw new NotFoundException(`Quote with ID ${quoteId} not found.`);
      }
      const covers: Record<number, string> = {};
      if (Array.isArray(quote.coverDetails)) {
        quote.coverDetails?.forEach((cover) => {
          if (
            cover.coverMapId !== undefined &&
            cover.insurerCoverResponse !== undefined
          ) {
            covers[cover.coverMapId] = cover.insurerCoverResponse;
          }
        });
      }
      const toNumber = (value: unknown): number | null =>
        this.toNumberOrNull(value);

      // const explicitGrossWithTax = toNumber(quote.totalGrossPremiumIncTax);
      const explicitGrossWithCharges = toNumber(quote.grossPremium);
      const calculatedNetPremium = this.sumNumbers([
        toNumber(quote.basicPremium),
        toNumber(quote.srccAmount),
        toNumber(quote.terrorism),
      ]);
      // const totalGrossPremiumIncTax =
      //   explicitGrossWithTax ??
      //   this.sumNumbers([
      //     toNumber(quote.basicPremium),
      //     toNumber(quote.srccAmount),
      //     toNumber(quote.terrorism),
      //     toNumber(quote.gstAmount),
      //   ]);
      const grossPremium =
        explicitGrossWithCharges ??
        this.sumNumbers([
          toNumber(quote.basicPremium),
          toNumber(quote.srccAmount),
          toNumber(quote.terrorism),
          toNumber(quote.gstAmount),
          toNumber(quote.fee),
          toNumber(quote.other),
          toNumber(quote.adminCharges),
          toNumber(quote.cessAmount),
        ]);

      const data = {
        selectFinalisedQuote: {
          finalizedQuoteId: quote.id,
          isQuoteEdited: null,
          insurerId: quote.insurerId,
          insurerLocationId: quote.insurerLocationId,
          quoteReceivedOn: quote.quoteReceivedOn,
          basicPremium: toNumber(quote.basicPremium),
          basicBrokeragePercentage: toNumber(quote.basicBrokeragePercentage),
          basicBrokerageAmount: toNumber(quote.basicBrokerageAmount),
          tcBrokerageAmount: toNumber(quote.tcBrokerageAmount),
          srccAmount: toNumber(quote.srccAmount),
          srccPercentage: toNumber(quote.srccPercentage),
          srccBrokerageAmount: toNumber(quote.srccBrokerageAmount),
          terrorism: toNumber(quote.terrorism),
          terrorismBrokeragePercentage: toNumber(
            quote.terrorismBrokeragePercentage
          ),
          gstAmount: toNumber(quote.gstAmount),
          gstPercentage: toNumber(quote.gstPercentage),
          netPremium: toNumber(quote.netPremium) ?? calculatedNetPremium,
          // totalGrossPremiumIncTax,
          fee: toNumber(quote.fee),
          feePercentage: toNumber(quote.feePercentage),
          other: toNumber(quote.other),
          otherPercentage: toNumber(quote.otherPercentage),
          adminCharges: toNumber(quote.adminCharges),
          adminChargesPercentage: toNumber(quote.adminChargesPercentage),
          cessAmount: toNumber(quote.cessAmount),
          cessPercentage: toNumber(quote.cessPercentage),
          grossPremium,
          totalBrokerageAmount: toNumber(quote.totalBrokerageAmount) ?? null,
        },
        quoteTaxDetails: quote.taxMappings?.map((tax) => ({
          tax: tax.taxLid,
          taxValue: toNumber(tax.taxValue),
        })),
        netPremiumDetails: {
          insurerRemarks: quote.insurerRemarks,
        },
        quoteDocuments: quote.documentMappings?.map((doc) => ({
          documentId: doc.documentId,
        })),
        covers: covers,
      };
      return data;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to fetch quote by ID."
      );
    }
  }
  async createFinalNegotiationActivity(
    manager: EntityManager,
    data: Partial<CreateFinalNegotiationActivityDto>
  ) {
    try {
      const existingFinalNeg = await manager.findOne(
        OpportunityFinalNegotiation,
        {
          where: {
            opportunityId: data.opportunityId,
            activityId: data.activityId,
          },
        }
      );
      if (existingFinalNeg) {
        throw new BadRequestException(
          `Final Negotiation details already exist for Opportunity ID: ${data.opportunityId}, Activity ID: ${data.activityId}`
        );
      }
      const record = manager.create(OpportunityFinalNegotiation, data);
      return await manager.save(OpportunityFinalNegotiation, record);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create final negotiation activity: ${error.message}`
      );
    }
  }

  async saveFinalNegotiation(
    entityManager: EntityManager,
    opportunityActivityId: number,
    finalNegotiationData: Partial<OpportunityFinalNegotiation>,
    userId: number
  ) {
    try {
      const repo = entityManager.getRepository(OpportunityFinalNegotiation);

      let finalNegotiation = await repo.findOne({
        where: { opportunityActivityId },
      });

      if (finalNegotiation) {
        finalNegotiation = repo.merge(finalNegotiation, {
          ...finalNegotiationData,
          updatedBy: userId,
          updatedAt: new Date(),
        });
      } else {
        finalNegotiation = repo.create({
          ...finalNegotiationData,
          opportunityActivityId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return await repo.save(finalNegotiation);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save meeting for final negotiation details: ${error.message}`
      );
    }
  }

  async getRfpDetailsEntryByOpportunityActivityId(
    opportunityActivityId: number
  ): Promise<OpportunityRfpDetailsEntry | null> {
    try {
      const rfpDetailsEntry =
        await this.opportunityRfpDetailsEntryRepository.findOne({
          where: { opportunityActivityId },
          relations: [
            "tpaDetails",
            "insurerDetails",
            "clientContacts",
            "clientContacts.clientContactInfluencers", // Include influencers relation
            "creditSharing",
            "documents",
          ],
        });
      if (!rfpDetailsEntry) {
        throw new NotFoundException(
          `RFP Details Entry not found for ID: ${opportunityActivityId}`
        );
      }

      return rfpDetailsEntry;
    } catch (error) {
      console.error("Query error:", error);
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : "Failed to fetch RFP details entry."
      );
    }
  }

  async saveFinalNegotiationSharingDetails(
    manager: EntityManager,
    finalNegotiationId: number,
    details: CreateFinalNegotiationSharingDetailDto[]
  ) {
    try {
      // Fetch existing sharing details for this negotiation
      const existingDetails = await manager.find(
        OpportunityFinalNegotiationSharingDetail,
        {
          where: { opportunityFinalNegotiationId: finalNegotiationId },
        }
      );
      const existingInsurerIds = existingDetails?.map((d) => d.insurerId);
      const incomingInsurerIds = details?.map((d) => d.insurerId);
      // Determine which to add
      const detailsToAdd = details?.filter(
        (d) => !existingInsurerIds.includes(d.insurerId)
      );
      // Determine which to remove
      const detailsToRemove = existingDetails?.filter(
        (d) => !incomingInsurerIds.includes(d.insurerId)
      );
      // Determine which to update
      const detailsToUpdate = details?.filter(
        (d) => d.insurerId && existingInsurerIds.includes(d.insurerId)
      );
      // Add new sharing details
      if (detailsToAdd.length > 0) {
        const recordsToAdd = detailsToAdd?.map((details) =>
          manager.create(OpportunityFinalNegotiationSharingDetail, {
            ...details,
            opportunityFinalNegotiationId: finalNegotiationId,
          })
        );
        await manager.save(
          OpportunityFinalNegotiationSharingDetail,
          recordsToAdd
        );
      }
      // Remove obsolete sharing details
      if (detailsToRemove.length > 0) {
        const idsToRemove = detailsToRemove?.map((d) => d.id);
        await manager.delete(OpportunityFinalNegotiationSharingDetail, {
          id: In(idsToRemove),
        });
      }
      // Update existing insurer details that have changed
      if (detailsToUpdate.length > 0) {
        const recordsToUpdate = [];

        for (const detail of detailsToUpdate) {
          const existingDetail = existingDetails.find(
            (existing) => existing.insurerId === detail.insurerId
          );

          if (existingDetail) {
            // Check if any fields have actually changed to avoid unnecessary updates
            const hasChanged =
              (detail.insurerLocationId || null) !==
                (existingDetail.insurerLocationId || null) ||
              (detail.insurerBranchId || null) !==
                (existingDetail.insurerBranchId || null) ||
              (detail.insurerContactId || null) !==
                (existingDetail.insurerContactId || null) ||
              (detail.isLeadInsurer || null) !==
                (existingDetail.isLeadInsurer || null) ||
              (detail.sharePercentage || 0) !==
                (existingDetail.sharePercentage || 0) ||
              (detail.shareAmount || 0) !== (existingDetail.shareAmount || 0) ||
              (detail.brokeragePercentage || 0) !==
                (existingDetail.brokeragePercentage || 0) ||
              (detail.brokerageAmount || 0) !==
                (existingDetail.brokerageAmount || 0) ||
              (detail.terrorismSharePercentage || 0) !==
                (existingDetail.terrorismSharePercentage || 0) ||
              (detail.terrorismShareAmount || 0) !==
                (existingDetail.terrorismShareAmount || 0) ||
              (detail.terrorismBrokeragePercentage || 0) !==
                (existingDetail.terrorismBrokeragePercentage || 0) ||
              (detail.terrorismBrokerageAmount || 0) !==
                (existingDetail.terrorismBrokerageAmount || 0) ||
              (detail.totalBrokerageAmount || 0) !==
                (existingDetail.totalBrokerageAmount || 0);

            if (hasChanged) {
              recordsToUpdate.push({
                ...existingDetail,
                insurerLocationId: detail.insurerLocationId,
                insurerBranchId: detail.insurerBranchId,
                insurerContactId: detail.insurerContactId,
                isLeadInsurer: detail.isLeadInsurer,
                sharePercentage: detail.sharePercentage,
                shareAmount: detail.shareAmount,
                brokeragePercentage: detail.brokeragePercentage,
                brokerageAmount: detail.brokerageAmount,
                terrorismSharePercentage:
                  detail.terrorismSharePercentage ?? null,
                terrorismShareAmount: detail.terrorismShareAmount ?? null,
                terrorismBrokeragePercentage:
                  detail.terrorismBrokeragePercentage,
                terrorismBrokerageAmount: detail.terrorismBrokerageAmount,
                totalBrokerageAmount: detail.totalBrokerageAmount,
              });
            }
          }
        }

        if (recordsToUpdate.length > 0) {
          await manager.save(
            OpportunityFinalNegotiationSharingDetail,
            recordsToUpdate
          );
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Failed to save final negotiation sharing details: ${error.message}`
      );
    }
  }

  async saveFinalNegotiationVariations(
    manager: EntityManager,
    finalNegotiationId: number,
    variations: CreateFinalNegotiationQcrVariationDto[]
  ) {
    try {
      // Fetch existing variations for this negotiation
      const existingVariationsDetails = await manager.find(
        OpportunityFinalNegotiationQcrVariation,
        { where: { opportunityFinalNegotiationId: finalNegotiationId } }
      );
      const existingIssues = existingVariationsDetails?.map((v) => v.issue);
      const incomingIssues = variations?.map((v) => v.issue);
      // Determine which to add
      const variationsToAdd = variations?.filter(
        (v) => !existingIssues.includes(v.issue)
      );
      // Determine which to remove
      const variationsToRemove = existingVariationsDetails?.filter(
        (v) => !incomingIssues.includes(v.issue)
      );
      // Add new variations
      if (variationsToAdd.length > 0) {
        const recordsToAdd = variationsToAdd?.map((variation) =>
          manager.create(OpportunityFinalNegotiationQcrVariation, {
            opportunityFinalNegotiationId: finalNegotiationId,
            ...variation,
          })
        );
        await manager.save(
          OpportunityFinalNegotiationQcrVariation,
          recordsToAdd
        );
      }
      // Remove obsolete variations
      if (variationsToRemove.length > 0) {
        const idsToRemove = variationsToRemove?.map((v) => v.id);
        await manager.delete(OpportunityFinalNegotiationQcrVariation, {
          id: In(idsToRemove),
        });
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new BadRequestException(
        `Failed to save final negotiation variations: ${error.message}`
      );
    }
  }

  async saveFinalNegotiationSla(
    manager: EntityManager,
    finalNegotiationId: number,
    sla: CreateFinalNegotiationSlaDto[]
  ): Promise<void> {
    try {
      // Fetch existing SLA records for this negotiation
      const existingSlaRecords = await manager.find(
        OpportunityFinalNegotiationServiceLevelAgreement,
        { where: { opportunityFinalNegotiationId: finalNegotiationId } }
      );
      const existingSlaKeys = existingSlaRecords?.map((s) => s.serviceTypeId);
      const incomingSlaKeys = sla?.map((s) => s.serviceTypeId);
      // Determine which to add
      const slaToAdd = sla?.filter(
        (s) => !existingSlaKeys.includes(s.serviceTypeId)
      );
      // Determine which to remove
      const slaToRemove = existingSlaRecords?.filter(
        (s) => !incomingSlaKeys.includes(s.serviceTypeId)
      );
      // Determine which to update
      const slaToUpdate = sla?.filter(
        (s) => s.serviceTypeId && existingSlaKeys.includes(s.serviceTypeId)
      );
      // Add new SLA records
      if (slaToAdd.length > 0) {
        const recordsToAdd = slaToAdd?.map((sla) =>
          manager.create(OpportunityFinalNegotiationServiceLevelAgreement, {
            opportunityFinalNegotiationId: finalNegotiationId,
            ...sla,
          })
        );
        await manager.save(
          OpportunityFinalNegotiationServiceLevelAgreement,
          recordsToAdd
        );
      }
      // Remove obsolete SLA records
      if (slaToRemove.length > 0) {
        const idsToRemove = slaToRemove?.map((s) => s.id);
        await manager.delete(OpportunityFinalNegotiationServiceLevelAgreement, {
          id: In(idsToRemove),
        });
      }
      // Update existing SLA records that have changed
      if (slaToUpdate.length > 0) {
        const recordsToUpdate = [];
        for (const sla of slaToUpdate) {
          const existingDetail = existingSlaRecords.find(
            (existing) => existing.serviceTypeId === sla.serviceTypeId
          );
          if (existingDetail) {
            // Check if any fields have actually changed to avoid unnecessary updates
            const hasChanged =
              (sla.numberOfDays || 0) !== (existingDetail.numberOfDays || 0);
            if (hasChanged)
              recordsToUpdate.push({
                ...existingDetail,
                numberOfDays: sla.numberOfDays,
              });
          }
        }
        if (recordsToUpdate.length > 0) {
          await manager.save(
            OpportunityFinalNegotiationServiceLevelAgreement,
            recordsToUpdate
          );
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Failed to save final negotiation SLA details: ${error.message}`
      );
    }
  }

  async saveFinalNegotiationQuoteTax(
    manager: EntityManager,
    finalNegotiationId: number,
    taxDetails: CreateQuoteTaxDetailsDto[]
  ) {
    try {
      // Fetch existing tax records for this negotiation
      const existingTaxRecords = await manager.find(
        OpportunityFinalNegotiationTaxMap,
        { where: { opportunityFinalNegotiationId: finalNegotiationId } }
      );
      const existingTaxIds = existingTaxRecords?.map((t) => t.tax);
      const incomingTaxIds = taxDetails?.map((t) => t.tax);
      // Determine which to add
      const taxToAdd = taxDetails?.filter(
        (t) => !existingTaxIds.includes(t.tax)
      );
      // Determine which to remove
      const taxToRemove = existingTaxRecords?.filter(
        (t) => !incomingTaxIds.includes(t.tax)
      );
      // Determine which to update
      const taxToUpdate = taxDetails?.filter(
        (t) => t.tax && existingTaxIds.includes(t.tax)
      );
      // Add new tax records
      if (taxToAdd.length > 0) {
        const recordsToAdd = taxToAdd?.map((tax) =>
          manager.create(OpportunityFinalNegotiationTaxMap, {
            opportunityFinalNegotiationId: finalNegotiationId,
            ...tax,
          })
        );
        await manager.save(OpportunityFinalNegotiationTaxMap, recordsToAdd);
      }
      // Remove obsolete tax records
      if (taxToRemove.length > 0) {
        const idsToRemove = taxToRemove?.map((t) => t.id);
        await manager.delete(OpportunityFinalNegotiationTaxMap, {
          id: In(idsToRemove),
        });
      }
      // Update existing tax records that have changed
      if (taxToUpdate.length > 0) {
        const recordsToUpdate = [];
        for (const tax of taxToUpdate) {
          const existingDetail = existingTaxRecords.find(
            (existing) => existing.tax === tax.tax
          );
          if (existingDetail) {
            // Check if any fields have actually changed to avoid unnecessary updates
            const hasChanged =
              (tax.taxValue || 0) !== (existingDetail.taxValue || 0);
            if (hasChanged)
              recordsToUpdate.push({
                ...existingDetail,
                taxValue: tax.taxValue,
              });
          }
        }
        if (recordsToUpdate.length > 0) {
          await manager.save(
            OpportunityFinalNegotiationTaxMap,
            recordsToUpdate
          );
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Failed to save final negotiation quote tax details: ${error.message}`
      );
    }
  }

  async saveFinalNegotiationCovers(
    manager: EntityManager,
    finalNegotiationId: number,
    quoteId: number,
    opportunityId: number,
    covers: Record<string, string>
  ) {
    try {
      //OpportunityFinalNegotiationQuoteCoverDetail
      const existingCovers = await manager.find(
        OpportunityFinalNegotiationQuoteCoverDetail,
        {
          where: { opportunityFinalNegotiationId: finalNegotiationId },
        }
      );
      const existingCoverIds = existingCovers?.map((c) => c.coverMapId);
      const incomingCoverIds = Object.keys(covers).map(Number);
      // Determine which to add
      const coversToAdd = incomingCoverIds.filter(
        (id) => !existingCoverIds.includes(id)
      );
      // Determine which to remove
      const coversToRemove = existingCovers?.filter(
        (c) => !incomingCoverIds.includes(c.coverMapId)
      );
      // Add new covers
      if (coversToAdd.length > 0) {
        const recordsToAdd = coversToAdd.map((coverId) =>
          manager.create(OpportunityFinalNegotiationQuoteCoverDetail, {
            opportunityFinalNegotiationId: finalNegotiationId,
            opportunityId,
            coverMapId: coverId,
            insurerCoverResponse: covers[coverId],
            quoteId: quoteId,
          })
        );
        await manager.save(
          OpportunityFinalNegotiationQuoteCoverDetail,
          recordsToAdd
        );
      }
      // Remove obsolete covers
      if (coversToRemove.length > 0) {
        const idsToRemove = coversToRemove?.map((c) => c.id);
        await manager.delete(OpportunityFinalNegotiationQuoteCoverDetail, {
          id: In(idsToRemove),
        });
      }
      // update which are in both
      const coversToUpdate = existingCovers?.filter((c) =>
        incomingCoverIds.includes(c.coverMapId)
      );
      if (coversToUpdate.length > 0) {
        // Update existing covers with new insurerCoverResponse based on coverMapId
        for (const cover of coversToUpdate) {
          const updatedCover = {
            ...cover,
            insurerCoverResponse: covers[cover.coverMapId],
            opportunityId,
          };
          await manager.update(
            OpportunityFinalNegotiationQuoteCoverDetail,
            { id: cover.id },
            updatedCover
          );
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Failed to save final negotiation covers: ${error.message}`
      );
    }
  }

  async saveFinalNegotiationQuoteDocuments(
    manager: EntityManager,
    finalNegotiationId: number,
    documents: OpportunityActivityDocumentDto[],
    quoteId: number
  ) {
    try {
      // Fetch existing documents for this negotiation
      const existingDocuments = await manager.find(
        OpportunityFinalNegotiationQuoteDocuments,
        { where: { opportunityFinalNegotiationId: finalNegotiationId } }
      );
      const existingDocIds = existingDocuments?.map((d) => d.documentId);
      const incomingDocIds = documents?.map((d) => d.documentId);
      // Determine which to add
      const documentsToAdd = documents?.filter(
        (d) => !existingDocIds.includes(d.documentId)
      );
      // Determine which to remove
      const documentsToRemove = existingDocuments?.filter(
        (d) => !incomingDocIds.includes(d.documentId)
      );
      // Add new documents
      if (documentsToAdd.length > 0) {
        const recordsToAdd = documentsToAdd?.map((doc) =>
          manager.create(OpportunityFinalNegotiationQuoteDocuments, {
            opportunityFinalNegotiationId: finalNegotiationId,
            quoteId: quoteId,
            ...doc,
          })
        );
        await manager.save(
          OpportunityFinalNegotiationQuoteDocuments,
          recordsToAdd
        );
      }
      // Remove obsolete documents
      if (documentsToRemove.length > 0) {
        const idsToRemove = documentsToRemove?.map((d) => d.id);
        await manager.delete(OpportunityFinalNegotiationQuoteDocuments, {
          id: In(idsToRemove),
        });
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Failed to save final negotiation quote documents: ${error.message}`
      );
    }
  }

  // Updates the main Final Negotiation Step record
  async updateFinalNegotiationActivity(
    manager: EntityManager,
    opportunityActivityId: number,
    data: Partial<UpdateFinalNegotiationActivityDto>
  ) {
    try {
      await manager.update(
        OpportunityFinalNegotiation,
        { opportunityActivityId: opportunityActivityId },
        data
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

  async getFinalNegotiationActivity(opportunityActivityId: number) {
    const finalNegMeet = await this.opportunityRepository.manager.findOne(
      OpportunityFinalNegotiation,
      {
        where: { opportunityActivityId },
        relations: [
          "sharingDetails",
          "sharingDetails.insurer",
          "qcrVariations",
          "slaDetails",
          "opportunityActivity",
          "opportunityActivity.meetingDocuments",
          "opportunityActivity.meetingDocuments.document",
          "opportunityActivity.meetingDocuments.documentType",
          "opportunityActivity.meetingParticipants",
          "taxDetails",
          "quoteDocs",
          "quoteDocs.document",
          "quoteCovers",
        ],
      }
    );
    if (!finalNegMeet) {
      throw new NotFoundException(
        `Final Negotiation Meeting with opportunityActivityId ${opportunityActivityId} not found.`
      );
    }
    const meetingTypeFinalNegotiation = await getLookups(
      this.lookUpRepository,
      [MEETING_TYPE_KEY.FINAL_NEGOTIATION],
      LOOK_UP_FIELD.KEY
    );
    const meetingTypeLookup = await getLookup(
      meetingTypeFinalNegotiation,
      [MEETING_TYPE_KEY.FINAL_NEGOTIATION],
      LOOK_UP_FIELD.KEY
    );
    const participants = finalNegMeet.opportunityActivity.meetingParticipants;
    const tpaParticipants = participants
      ?.filter((p) => p.participantRecordType === PARTICIPANT_TYPE.TPA_CONTACT)
      .map((p) => p.participantId);
    const insurerParticipants = participants
      ?.filter(
        (p) => p.participantRecordType === PARTICIPANT_TYPE.INSURER_CONTACT
      )
      .map((p) => p.participantId);
    const companyParticipants = participants
      ?.filter(
        (p) => p.participantRecordType === PARTICIPANT_TYPE.COMPANY_CONTACT
      )
      .map((p) => p.participantId);
    const employeeParticipants = participants
      ?.filter((p) => p.participantRecordType === PARTICIPANT_TYPE.EMPLOYEE)
      .map((p) => p.participantId);
    // Remove 'id' and 'opportunityFinalNegotiationId' from objects in arrays
    const cleanArray = (arr: any[]) =>
      Array.isArray(arr)
        ? arr.map(({ id, opportunityFinalNegotiationId, ...rest }) => rest)
        : [];
    const covers: Record<number, string> = {};
    const formatQuoteDocuments = (arr: any[] = []) => {
      return arr.map((e) => ({
        quoteId: e?.quoteId ?? null,
        documentId: e?.documentId ?? null,
        documentTypeLid: e?.documentTypeLid ?? null,
        fileName: e?.document?.fileKey
          ? e.document.fileKey.split("/").pop()
          : null,
        companyType: e?.document?.companyType ?? null,
      }));
    };

    if (Array.isArray(finalNegMeet.quoteCovers)) {
      finalNegMeet.quoteCovers?.forEach((cover) => {
        if (
          cover.coverMapId !== undefined &&
          cover.insurerCoverResponse !== undefined
        ) {
          covers[cover.coverMapId] = cover.insurerCoverResponse;
        }
      });
    }
    return {
      id: Number(finalNegMeet.id),
      opportunityActivityId: Number(finalNegMeet.opportunityActivityId),
      statusLid: Number(finalNegMeet.statusLid),
      dataActivity: {
        meetingDetails: {
          isFinalNegotiationTypeLid: this.toNumberOrNull(
            finalNegMeet.isFinalNegotiationTypeLid
          ),
          selectMeeting: this.toNumberOrNull(finalNegMeet.selectMeeting),
          meetingTypeLid:
            meetingTypeLookup[`lookup_${MEETING_TYPE_KEY.FINAL_NEGOTIATION}`]
              .id,
          meetingDate: finalNegMeet.meetingDate,
          availableFrom: finalNegMeet.startTime,
          availableTo: finalNegMeet.endTime,
          locationTypeLid: finalNegMeet.locationTypeLid,
        },
        policyDetails: {
          policyPlacedTypeLid: this.toNumberOrNull(
            finalNegMeet.policyPlacedTypeLid
          ),
          leadInsurerId: this.toNumberOrNull(finalNegMeet.leadInsurerId),
          isLeadInsurerPayCommissionLid: this.toNumberOrNull(
            finalNegMeet.isLeadInsurerPayCommissionLid
          ),
        },
        selectFinalisedQuote: {
          finalizedVersionId: this.toNumberOrNull(
            finalNegMeet.finalizedVersionId
          ),
          finalizedQuoteId: this.toNumberOrNull(finalNegMeet.finalizedQuoteId),
          insurerId: this.toNumberOrNull(finalNegMeet.insurerId),
          insurerLocationId: this.toNumberOrNull(
            finalNegMeet.insurerLocationId
          ),
          isQuoteEdited: this.toNumberOrNull(finalNegMeet.isQuoteEdited),
          quoteReceivedOn: finalNegMeet.quoteReceivedOn,
          basicPremium: this.toNumberOrNull(finalNegMeet.basicPremium),
          terrorism: this.toNumberOrNull(finalNegMeet.terrorism),
          netPremium: this.toNumberOrNull(finalNegMeet.netPremium),
          basicBrokeragePercentage: this.toNumberOrNull(
            finalNegMeet.basicBrokeragePercentage
          ),
          // basicPremiumPercentage: this.toNumberOrNull(
          //   finalNegMeet.basicPremiumPercentage
          // ),
          srccPercentage: this.toNumberOrNull(finalNegMeet.srccPercentage),
          srccAmount: this.toNumberOrNull(finalNegMeet.srccAmount),
          srccBrokerageAmount: this.toNumberOrNull(
            finalNegMeet.srccBrokerageAmount
          ),
          terrorismBrokeragePercentage: this.toNumberOrNull(
            finalNegMeet.terrorismBrokeragePercentage
          ),
          tcBrokerageAmount: this.toNumberOrNull(
            finalNegMeet.tcBrokerageAmount
          ),
          basicBrokerageAmount: this.toNumberOrNull(
            finalNegMeet.basicBrokerageAmount
          ),
          // brokerageAmount: this.toNumberOrNull(finalNegMeet.brokerageAmount),
          gstPercentage: this.toNumberOrNull(finalNegMeet.gstPercentage),
          gstAmount: this.toNumberOrNull(finalNegMeet.gstAmount),
          // totalGrossPremiumIncTax: this.toNumberOrNull(
          //   finalNegMeet.totalGrossPremiumIncTax
          // ),
          feePercentage: this.toNumberOrNull(finalNegMeet.feePercentage),
          fee: this.toNumberOrNull(finalNegMeet.fee),
          otherPercentage: this.toNumberOrNull(finalNegMeet.otherPercentage),
          other: this.toNumberOrNull(finalNegMeet.other),
          adminChargesPercentage: this.toNumberOrNull(
            finalNegMeet.adminChargesPercentage
          ),
          adminCharges: this.toNumberOrNull(finalNegMeet.adminCharges),
          cessPercentage: this.toNumberOrNull(finalNegMeet.cessPercentage),
          cessAmount: this.toNumberOrNull(finalNegMeet.cessAmount),
          grossPremium: this.toNumberOrNull(finalNegMeet.grossPremium),
          totalBrokerageAmount: this.toNumberOrNull(
            finalNegMeet.totalBrokerageAmount
          ),
        },
        netPremiumDetails: {
          insurerRemarks: finalNegMeet.insurerRemarks,
        },
        covers: covers,
        quoteDocuments: formatQuoteDocuments(finalNegMeet.quoteDocs ?? []),
        participants: {
          companyContactPerson:
            companyParticipants.length > 0 ? companyParticipants : [],
          employees:
            employeeParticipants.length > 0 ? employeeParticipants : [],
        },
        tpaParticipants:
          tpaParticipants.length > 0
            ? {
                tpaId: Number(
                  participants.find(
                    (p) =>
                      p.participantRecordType === PARTICIPANT_TYPE.TPA_CONTACT
                  )?.participantCompanyId
                ),
                tpaContactPerson: tpaParticipants.map(Number),
              }
            : {},
        insurerParticipants:
          insurerParticipants.length > 0
            ? {
                insurerId: Number(
                  participants.find(
                    (p) =>
                      p.participantRecordType ===
                      PARTICIPANT_TYPE.INSURER_CONTACT
                  )?.participantCompanyId
                ),
                insurerContactPerson: insurerParticipants.map(Number),
              }
            : {},
        quoteTaxDetails: cleanArray(finalNegMeet.taxDetails),
        insurerDetails: finalNegMeet.sharingDetails
          ?.map((sharing) => ({
            insurerId: this.toNumberOrNull(sharing.insurerId),
            insurerName: sharing.insurer?.insurerName,
            sharePercentage: this.toNumberOrNull(sharing.sharePercentage),
            shareAmount: this.toNumberOrNull(sharing.shareAmount),
            brokeragePercentage: this.toNumberOrNull(
              sharing.brokeragePercentage
            ),
            brokerageAmount: this.toNumberOrNull(sharing.brokerageAmount),
            insurerLocationId: this.toNumberOrNull(sharing.insurerLocationId),
            insurerBranchId: this.toNumberOrNull(sharing.insurerBranchId),
            insurerContactId: this.toNumberOrNull(sharing.insurerContactId),
            isLeadInsurer: this.toNumberOrNull(sharing.isLeadInsurer),
            terrorismSharePercentage: this.toNumberOrNull(
              sharing.terrorismSharePercentage
            ),
            terrorismShareAmount: this.toNumberOrNull(
              sharing.terrorismShareAmount
            ),
            terrorismBrokeragePercentage: this.toNumberOrNull(
              sharing.terrorismBrokeragePercentage
            ),
            terrorismBrokerageAmount: this.toNumberOrNull(
              sharing.terrorismBrokerageAmount
            ),
            totalBrokerageAmount: this.toNumberOrNull(
              sharing.totalBrokerageAmount
            ),
          }))
          ?.sort((a, b) => {
            const aVal = a.isLeadInsurer ?? Infinity;
            const bVal = b.isLeadInsurer ?? Infinity;
            return aVal - bVal; // ascending
          }),
        variationIssuesFromQCR: cleanArray(finalNegMeet.qcrVariations),
        otherCommentsFromInsurer: {
          remarks: finalNegMeet.otherInsurerComments,
        },
        remarks: { remarks: finalNegMeet.remarks },
        meetingSummary: { mom: finalNegMeet.mom },
        insurerServiceLevelAgreement: cleanArray(finalNegMeet.slaDetails),
        documents: cleanArray(
          finalNegMeet.opportunityActivity.meetingDocuments ?? []
        ),
      },
    };
  }

  /**
   * Builds the role-based stage gate applied to opportunity listings for
   * single-role (BD-only / ISG-only) viewers. Shared by the main listing and
   * the company-details listing so they stay in sync. Returns a `Brackets`
   * against the given opportunity alias (default `main`), or `undefined` for
   * unrestricted (dual-role / leadership) viewers.
   *
   * An opportunity "reaches ISG" when an ISG-role activity has been planned
   * (plannedAt set — the signal the app uses to derive the "ISG Planning"
   * stage) OR the opportunity status becomes ISG Planning at BD->ISG handover
   * (before any ISG activity is planned).
   *
   *   - ISG-only -> keep only opportunities that have reached ISG.
   *   - BD-only  -> hide opportunities once they have been handed over to ISG.
   */
  async buildActivityRoleStageGate(
    visibleActivityRoleKeys?: string[] | null,
    forceIsgReached = false,
    ownerUserIds?: number[],
    // Root alias of the query the gate is merged into. The listings alias it
    // "main"; the funnel and SBU builders alias it "opportunity" (Placement
    // widgets, spec §12.2).
    alias = "main"
  ): Promise<Brackets | undefined> {
    const isIsgOnly =
      visibleActivityRoleKeys?.length === 1 &&
      visibleActivityRoleKeys[0] === ROLE_KEY.ROLE_ISG_EXECUTIVE;
    const isBdOnly =
      visibleActivityRoleKeys?.length === 1 &&
      visibleActivityRoleKeys[0] === ROLE_KEY.ROLE_BD_EXECUTIVE;
    if (!isIsgOnly && !isBdOnly && !forceIsgReached) {
      return undefined;
    }

    const isgPlanningStatus = await this.lookUpRepository.findOne({
      where: { lookUpKey: OPPORTUNITY_STATUS_ISG_PLANNING },
    });
    const isgPlanningStatusId = isgPlanningStatus?.id;

    const reachedIsgInSubquery = `${alias}.opportunityId IN (
      SELECT oam_isg.opportunity_id
      FROM opportunity_activity_map oam_isg
      WHERE oam_isg.ref_role_key = :isgPlanningRoleKey
        AND oam_isg.planned_at IS NOT NULL
    )`;

    if (isIsgOnly || forceIsgReached) {
      return new Brackets((qb) => {
        qb.where(reachedIsgInSubquery, {
          isgPlanningRoleKey: ROLE_KEY.ROLE_ISG_EXECUTIVE,
        });
        if (isgPlanningStatusId) {
          qb.orWhere(`${alias}.statusLid = :isgPlanningStatusId`, {
            isgPlanningStatusId,
          });
        }
      });
    }

    // BD-only: the inverse — exclude opportunities that have reached ISG,
    // EXCEPT the ones owned by this BD user OR anyone in their reporting tree.
    // A BD user keeps their own deals after handover, and their managers (who
    // approved the BD activities) keep tracking the whole team's deals.
    const notReachedIsg = new Brackets((qb) => {
      qb.where(`${alias}.opportunityId NOT IN (
        SELECT oam_isg.opportunity_id
        FROM opportunity_activity_map oam_isg
        WHERE oam_isg.ref_role_key = :isgPlanningRoleKey
          AND oam_isg.planned_at IS NOT NULL
      )`, {
        isgPlanningRoleKey: ROLE_KEY.ROLE_ISG_EXECUTIVE,
      });
      if (isgPlanningStatusId) {
        qb.andWhere(
          `(${alias}.statusLid IS NULL OR ${alias}.statusLid != :isgPlanningStatusId)`,
          { isgPlanningStatusId }
        );
      }
    });

    if (!ownerUserIds || ownerUserIds.length === 0) {
      return notReachedIsg;
    }

    return new Brackets((qb) => {
      qb.where(notReachedIsg).orWhere(
        `${alias}.ownerId IN (:...gateOwnerUserIds)`,
        { gateOwnerUserIds: ownerUserIds }
      );
    });
  }

  async getOpportunityByCompanyId(
    companyId: number,
    page: number,
    limit: number,
    type?: "SO" | "RO",
    search?: string,
    entityIds?: number[],
    sort?: { field: string; order: "ASC" | "DESC" }[],
    visibleActivityRoleKeys?: string[] | null,
    activeOnly?: boolean,
    gateOwnerUserIds?: number[],
    userId?: number,
    ownerId?: number,
    viewBy?: "manager" | "team",
    excludeWon?: boolean
  ): Promise<{ data: any[]; count: number }> {
    try {
      if (!companyId) {
        throw new BadRequestException("Company ID is required.");
      }
      let optyType: LookUp | null = null;
      let activeStatusIds: number[] | undefined;
      const whereCondition: any = {
        companyId,
      };
      // Client portfolio drill-down: restrict to the same "Active + Won"
      // pipeline the portfolio RO/SO counts use (Open, Default, Work In
      // Progress, BD Planning, ISG Planning, Won). Date scoping is left to the
      // caller's range only — no implicit "not yet expired" floor.
      if (activeOnly) {
        const activeStatuses = await this.lookUpRepository.find({
          where: {
            lookUpKey: In([
              OPPORTUNITY_STATUS_OPEN,
              OPPORTUNITY_STATUS_DEFAULT,
              OPPORTUNITY_STATUS_WORK_IN_PROGRESS,
              OPPORTUNITY_STATUS_BD_PLANNING,
              OPPORTUNITY_STATUS_ISG_PLANNING,
              OPPORTUNITY_STATUS_WON,
            ]),
          },
        });
        activeStatusIds =
          activeStatuses.length > 0 ? activeStatuses.map((s) => s.id) : [-1];
        whereCondition["statusLid"] = In(activeStatusIds);
      }
      if (type) {
        if (type === "SO") {
          optyType = await this.lookUpRepository.findOne({
            where: {
              lookUpKey: OPPORTUNITY_TYPE.SO,
            },
          });
        } else {
          optyType = await this.lookUpRepository.findOne({
            where: {
              lookUpKey: OPPORTUNITY_TYPE.RO,
            },
          });
        }

        if (!optyType) {
          throw new NotFoundException(
            `Opportunity type with value ${type} not found`
          );
        } else {
          whereCondition["opportunityTypeLid"] = optyType.id;
        }
      }

      // Company details "Opportunities" list shows the live SO + RO pipeline,
      // so closed-won opportunities are dropped. When activeOnly already
      // pinned the status set, narrow that set instead of overwriting it.
      if (excludeWon) {
        const wonStatus = await this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_STATUS_WON },
        });
        if (wonStatus) {
          whereCondition["statusLid"] = activeStatusIds
            ? In(activeStatusIds.filter((id) => id !== wonStatus.id))
            : Not(wonStatus.id);
        }
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
        "refPolicy.endorsements",
      ];

      // activityName is a computed WIP field resolved after the main query.
      // Joining opportunityActivityMap (one-to-many) for sort would produce
      // row duplication and non-deterministic ordering. Strip it from the
      // DB sort and apply it in-memory after transformation instead.
      const activityNameSort = sort?.find(
        (s) => s.field === "opportunityActivityMap.activityName"
      );
      const dbSort = sort?.filter(
        (s) => s.field !== "opportunityActivityMap.activityName"
      );

      // When sorting by activityName we must fetch the full unpaginated
      // dataset because activityName is a computed WIP field resolved
      // after the DB query — not a stored column. Sorting only the current
      // page would produce independent orderings per page.
      const fetchPage = activityNameSort ? 1 : page;
      const fetchLimit = activityNameSort ? 10_000 : limit;

      // Role-based stage gate: ISG-only viewers see only ISG-reached
      // opportunities; BD-only viewers stop seeing opportunities once they are
      // handed over to ISG, EXCEPT those owned by themselves or their reporting
      // tree. Mirrors OpportunityService.getAllOpportunities so the
      // company-details list agrees with the main listing.
      const stageGateCondition = await this.buildActivityRoleStageGate(
        visibleActivityRoleKeys,
        false,
        gateOwnerUserIds
      );

      const parsedEntityIds =
        typeof entityIds === "string" ? [JSON.parse(entityIds)] : [entityIds];

      // Client portfolio drill-down (activeOnly): run through the same owner
      // scope engine the portfolio card count uses, so the list total matches
      // the overview card. Mirrors the card's owner scope (owner.userId +
      // viewByTeam, no explicitOwner). Other callers keep the unscoped path.
      let data: any[];
      let count: number;
      if (activeOnly && userId) {
        const scopeOwnerUserId = ownerId ? ownerId : userId;
        const ownerScope: {
          searchBy: string;
          searchValue: string | number | Array<string | number>;
        }[] = [
          { searchBy: "owner.userId", searchValue: [scopeOwnerUserId] },
          {
            searchBy: "viewByTeam",
            searchValue:
              viewBy === OWNER_TYPES.MANAGER
                ? OWNER_TYPES.MANAGER
                : OWNER_TYPES.TEAM,
          },
        ];
        ({ data, count } = await this.scopeService.validateOpportunityScope(
          {
            entity: "Opportunity",
            page: fetchPage,
            limit: fetchLimit,
            sort: dbSort && dbSort.length > 0 ? dbSort : undefined,
            relations,
            where: whereCondition,
            select: undefined,
            searchArray: ownerScope as any,
            userFilter: undefined,
            searchString: search ? search : undefined,
            searchOn: ["company.companyName", "policyType.lookUpValue"],
            dateFilter: undefined,
            period: undefined,
            preserveCreatedAt: true,
            entityIds: parsedEntityIds,
            customWhereCondition: stageGateCondition,
          } as any,
          userId,
          "opportunity"
        ));
      } else {
        ({ data, count } = await this.entityService.fetchEntityList(
          "Opportunity", // Entity name
          fetchPage,
          fetchLimit,
          dbSort && dbSort.length > 0 ? dbSort : undefined, // Sort options
          relations,
          whereCondition, // Filter by companyId
          undefined, // Select fields
          undefined, // Search array
          undefined, // User filter
          search ? search : undefined, // Search string
          ["company.companyName", "policyType.lookUpValue"], // Search on fields
          undefined, // Date filter
          undefined, // Period filter
          true,
          parsedEntityIds,
          stageGateCondition // single-role viewers: BD/ISG stage gate
        ));
      }

      if (!data || data.length === 0) {
        return { data: [], count: 0 };
      }

      const transformOpportunityData = async (data: any[]) => {
        return await Promise.all(
          data.map(async (opportunity) => {
            const currentStatus =
              await this.getWorkInProgressActivityNameByOpportunityId(
                opportunity.opportunityId,
                visibleActivityRoleKeys,
                opportunity.opportunityType?.lookUpKey === OPPORTUNITY_TYPE.RO
                  ? RENEWAL_OPPORTUNITY
                  : SALES_OPPORTUNITY
              );

            const policyTypeData = {
              id: opportunity.policyType?.id,
              value: opportunity.policyType?.lookUpValue,
            };

            // Format the sumInsured with locale-specific number formatting
            const formattedSumInsured = new Intl.NumberFormat("en-IN").format(
              opportunity.sumInsured
            );

            const opportunityIdentifier = `${policyTypeData.value} (${formattedSumInsured})`;

            return {
              opportunityId: opportunity.opportunityId,
              companyId: opportunity.company?.id ?? null,
              companyName: opportunity.company?.companyName ?? null,
              policyType: opportunity.policyType?.lookUpValue ?? null,
              opportunityType:
                opportunity.opportunityType?.lookUpValue ?? null,
              activityName: currentStatus.activityName,
              stageName: currentStatus.stageName,
              state: opportunity.status?.lookUpValue ?? null,
              priority: opportunity.company?.priority?.lookUpValue ?? null,
              expiryDate: opportunity?.expiryDate ?? null,
              opportunityCreationDate: opportunity.createdAt
                ? opportunity.createdAt.toISOString().split("T")[0]
                : null,
              assignedTo: opportunity.owner
                ? [opportunity.owner.firstName, opportunity.owner.lastName]
                    .filter((s): s is string => Boolean(s?.trim()))
                    .join(" ") || null
                : null,
              branch: opportunity.owner?.branch?.name ?? null,
              expectedCloseDate: opportunity.expiryDate ?? null,
              // RO premium mirrors the portfolio RO column: referenced policy
              // inception + endorsement premium. SO (no ref policy) keeps its
              // own premiumPaid.
              premium: opportunity.refPolicyId
                ? (Number(opportunity.refPolicy?.premiumAtInception) || 0) +
                  (opportunity.refPolicy?.endorsements?.reduce(
                    (sum: number, endorsement: any) =>
                      sum + (Number(endorsement?.premiumAtInception) || 0),
                    0
                  ) ?? 0)
                : opportunity.premiumPaid ?? null,
              sumInsured: opportunity.sumInsured ?? null,
              industrySegment:
                opportunity.company?.industrySegment?.lookUpValue ?? null,
              estimatedBrokerage: opportunity.estimatedBrokerage ?? null,
              policyId: opportunity.refPolicy?.insurerPolicyNumber ?? null,
              refPolicyId: opportunity.refPolicyId ?? null,
              policyTypeData: policyTypeData,
              opportunityIdentifier: opportunityIdentifier,
            };
          })
        );
      };
      const allTransformedData = await transformOpportunityData(data);

      if (activityNameSort) {
        // Sort the full dataset by computed activityName, nulls last.
        const order = activityNameSort.order;
        allTransformedData.sort((a, b) => {
          const av = (a.activityName ?? "").toLowerCase();
          const bv = (b.activityName ?? "").toLowerCase();
          if (!av && bv) return 1;
          if (av && !bv) return -1;
          const cmp = av.localeCompare(bv);
          return order === "DESC" ? -cmp : cmp;
        });
        // Paginate manually after the global sort.
        const start = (page - 1) * limit;
        return { data: allTransformedData.slice(start, start + limit), count };
      }

      return { data: allTransformedData, count };
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch opportunities for company ID: ${companyId}. ${error.message}`
      );
    }
  }

  async getOpportunityByContactId(
    contactId: number,
    page: number,
    limit: number,
    type?: "SO" | "RO"
  ): Promise<{ data: any[]; count: number }> {
    try {
      if (!contactId) {
        throw new BadRequestException("Contact ID is required.");
      }
      const opportunityType = type ?? "SO"; // Default to "SO" if type is not provided
      let optyType: LookUp | null = null;
      if (opportunityType === "SO") {
        optyType = await this.lookUpRepository.findOne({
          where: {
            lookUpKey: OPPORTUNITY_TYPE.SO,
          },
        });
      } else {
        optyType = await this.lookUpRepository.findOne({
          where: {
            lookUpKey: OPPORTUNITY_TYPE.RO,
          },
        });
      }

      if (!optyType) {
        throw new NotFoundException(
          `Opportunity type with value ${opportunityType} not found`
        );
      }
      const whereCondition = {
        contactId,
        "opportunity.opportunityTypeLid": optyType.id ?? undefined,
      };

      const { data, count } = await this.entityService.fetchEntityList(
        "OpportunityContactMap", // Entity name
        page,
        limit,
        undefined, // Sort options
        ["opportunity", "opportunity.policyType", "opportunity.status"],
        whereCondition, // Filter by companyId
        undefined, // Select fields
        undefined, // Search array
        undefined, // Search string
        undefined, // Search on fields
        undefined, // Date filter
        undefined, // Period filter
        undefined // Additional conditions
      );

      if (!data || data.length === 0) {
        return { data: [], count: 0 };
      }

      return { data, count };
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

  async getPremiumCalculationCovers(
    opportunityId: number,
    policyTypeId: number,
    coverTypeLid: number
  ): Promise<OpportunityCoverMap[]> {
    return await this.opportunityRepository.manager.find(OpportunityCoverMap, {
      where: { opportunityId, policyTypeId, coverTypeLid },
      order: { displaySequence: "ASC" },
    });
  }

  async getPolicyDetailsByOpportunityId(
    opportunityId: number
  ): Promise<any | null> {
    try {
      const opportunityData = await this.opportunityRepository.findOne({
        where: { opportunityId },
        relations: ["policyType"],
      });
      return opportunityData;
    } catch (error) {
      throw new Error(
        `Failed to fetch opportunity data for id: ${opportunityId}. ${error?.message}`
      );
    }
  }

  async savePremiumCalculationDetails(
    opportunityId: number,
    activityId: number,
    opportunityActivityId: number,
    premiumCalculationDetails: OpportunityPremiumCoverDetail[],
    remarks: string | null,
    documents: { documentId: number; documentTypeLid: number }[],
    createdBy: number,
    statusLid: number
  ): Promise<any> {
    try {
      const premiumCalculationDetailsRecord =
        await this.opportunityRepository.manager.transaction(
          async (transactionalEntityManager) => {
            // Save premium cover details
            await this.savePremiumCoverDetails(
              transactionalEntityManager,
              premiumCalculationDetails
            );
            let existingPremiumCalculation =
              await this.getPremiumCalculationByOpportunityActivityId(
                opportunityActivityId
              );
            let savedPremiumCalculation;
            // Save OpportunityPremiumCalculation summary
            if (!existingPremiumCalculation) {
              const premiumCalculationSummary =
                transactionalEntityManager.create(
                  OpportunityPremiumCalculation,
                  {
                    opportunityId,
                    activityId,
                    opportunityActivityId,
                    remarks,
                    statusLid,
                    createdBy,
                    updatedBy: createdBy,
                  }
                );
              savedPremiumCalculation = await this.savePremiumCalculation(
                transactionalEntityManager,
                premiumCalculationSummary
              );
            } else {
              existingPremiumCalculation.remarks = remarks;
              existingPremiumCalculation.statusLid = statusLid;
              existingPremiumCalculation.updatedBy = createdBy;
              savedPremiumCalculation = await this.savePremiumCalculation(
                transactionalEntityManager,
                existingPremiumCalculation
              );
            }
            // Save document records if present
            if (documents) {
              await this.saveActivityDocuments(
                transactionalEntityManager,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PREMIUM_CALCULATION_DOCUMENT_MAP,
                OPPORTUNITY_MAP_TABLE_DELETE_FIELDS.PREMIUM_CALCULATION_ID,
                opportunityActivityId,
                documents
              );
              await this.updateDocumentStatus(
                transactionalEntityManager,
                documents.map((doc) => doc.documentId)
              );
            }
            return {
              ...savedPremiumCalculation,
              premiumCalculationDetails: premiumCalculationDetails,
              documents: documents,
            };
          }
        );
      return premiumCalculationDetailsRecord;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error; // Re-throw known exceptions
      }
      throw new BadRequestException(
        `Failed to save premium calculation details: ${error.message}`
      );
    }
  }

  async getPremiumCalculationCoverDetailsByActivityId(
    opportunityid: number
  ): Promise<any[]> {
    try {
      const premiumCalculationCoverDetails =
        await this.opportunityRepository.manager.find(
          OpportunityPremiumCoverDetail,
          {
            where: { opportunityId: opportunityid },
            relations: ["coverMap"],
          }
        );

      if (
        !premiumCalculationCoverDetails ||
        premiumCalculationCoverDetails.length === 0
      ) {
        return [];
      }

      return premiumCalculationCoverDetails.map((detail) => ({
        id: detail.id,
        coverMapId: detail.coverMapId,
        coverName: detail.coverMap?.coverName,
        policyTypeId: detail.policyTypeLid,
        coverResponse: detail.coverResponse,
      }));
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch premium calculation cover details: ${error.message}`
      );
    }
  }

  async getPremiumCalculationDocumentsByActivityId(
    opportunityActivityId: number
  ): Promise<any[]> {
    try {
      const documents = await this.opportunityRepository.manager.find(
        OpportunityPremiumCalculationDocumentMap,
        {
          where: { opportunityActivityId },
        }
      );

      if (!documents || documents.length === 0) {
        return [];
      }

      return documents.map((doc) => ({
        id: Number(doc.id),
        documentId: Number(doc.documentId),
        documentTypeLid: Number(doc.documentTypeLid),
      }));
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch premium calculation documents: ${error.message}`
      );
    }
  }

  async createOpportunityLost(
    entityManager: EntityManager,
    opportunityLostData: CreateOpportunityLostDto
  ) {
    try {
      const opportunityLost = entityManager.create(
        OpportunityLost,
        opportunityLostData
      );
      // Update the status of work in progress activity to closed
      // const workInProgressStatus = await this.lookUpRepository.findOne({
      //   where: { lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS },
      // });
      // if (!workInProgressStatus) {
      //   throw new NotFoundException(
      //     `Status with key ${OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS} not found`
      //   );
      // }
      // const workInProgressActivity = await entityManager.findOne(
      //   OpportunityActivityMap,
      //   {
      //     where: {
      //       opportunityId: opportunityLostData.opportunityId,
      //       statusLid: workInProgressStatus.id,
      //     },
      //     order: { id: "ASC" },
      //   }
      // );
      // if (workInProgressActivity) {
      //   await entityManager.update(
      //     OpportunityActivityMap,
      //     { id: workInProgressActivity.id },
      //     { statusLid: opportunityLostData.statusLid }
      //   );
      // }
      // Update the opportunity status to lost
      await this.updateOpportunityStatus(
        entityManager,
        opportunityLostData.opportunityId,
        OPPORTUNITY_STATUS_LOST
      );
      return await entityManager.save(OpportunityLost, opportunityLost);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create Opportunity Lost Activity: ${error.message}`
      );
    }
  }

  // Helper method to update OpportunityActivityMap status
  async updateOpportunityActivityMapStatus(
    opportunityActivityId: number,
    statusLid: number,
    userId: number,
    completedAt: Date | null = null,
    entityManager?: EntityManager,
    activityStatusKey = ACTIVITY_STATUS.COMPLETE
  ) {
    const executeUpdate = async (manager: EntityManager) => {
      await manager.update(
        OpportunityActivityMap,
        { id: opportunityActivityId },
        {
          statusLid,
          updatedBy: userId,
          updatedAt: new Date(),
          completedAt: completedAt ? completedAt : undefined,
          activityStatusKey: activityStatusKey,
          ...(activityStatusKey === ACTIVITY_STATUS.SUBMIT
            ? { submittedBy: userId }
            : {}),
        }
      );
    };

    return entityManager
      ? executeUpdate(entityManager)
      : this.dataSource.manager.transaction(async (manager) =>
          executeUpdate(manager)
        );
  }

  async updateOpportunityStatus(
    entityManager: EntityManager,
    opportunityId: number,
    opportunityStatusKey: string
  ): Promise<void> {
    try {
      const opportunityStatus = await this.lookUpRepository.findOne({
        where: { lookUpKey: opportunityStatusKey },
      });
      if (!opportunityStatus) {
        throw new NotFoundException(
          `Opportunity Status with key ${opportunityStatusKey} not found`
        );
      }

      const opportunity = await entityManager.findOne(Opportunity, {
        where: { opportunityId: opportunityId },
      });
      if (!opportunity) {
        throw new NotFoundException(
          `Opportunity with ID ${opportunityId} not found.`
        );
      }
      Object.assign(opportunity, { 
        statusLid: opportunityStatus.id, 
        updatedAt: new Date() 
      });
      await entityManager.save(Opportunity, opportunity);
    } catch (error) {
      throw new BadRequestException(
        `Failed to update Opportunity status for opportunity: ${error.message}`
      );
    }
  }

  async updateOpportunityLost(
    entityManager: EntityManager,
    opportunityId: number,
    opportunityLostData: Partial<UpdateOpportunityLostDto>
  ) {
    try {
      const existingOpportunityLost = await entityManager.findOne(
        OpportunityLost,
        { where: { opportunityId } }
      );
      if (!existingOpportunityLost) {
        throw new NotFoundException(
          `Opportunity Lost details not found for opportunity ID ${opportunityId}`
        );
      }
      await entityManager.update(
        OpportunityLost,
        { id: existingOpportunityLost.id },
        opportunityLostData
      );
      return await entityManager.findOne(OpportunityLost, {
        where: { id: existingOpportunityLost.id },
      });
    } catch (error) {
      throw new BadRequestException(
        `Failed to update Opportunity Lost details: ${error.message}`
      );
    }
  }

  async getOpportunityLost(opportunityId: number) {
    try {
      const opportunityLost = await this.opportunityRepository.manager.findOne(
        OpportunityLost,
        { where: { opportunityId } }
      );
      if (!opportunityLost) {
        return null;
      }
      return {
        id: Number(opportunityLost.id),
        opportunityId: Number(opportunityLost.opportunityId),
        statusLid: opportunityLost.statusLid
          ? Number(opportunityLost.statusLid)
          : null,
        dataActivity: {
          opportunityLost: {
            reasonForLossLid: opportunityLost.reasonForLossLid
              ? Number(opportunityLost.reasonForLossLid)
              : null,
            remarks: opportunityLost.remarks,
          },
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        `Failed to fetch Opportunity Lost Activity: ${error.message}`
      );
    }
  }

  async getBrokingSlipAndQuoteDetailsData(
    opportunityActivityMapData: OpportunityActivityDataDto
  ): Promise<BrokingSlipVersionDetails[] | null> {
    try {
      const brokingSlipVersionDetails =
        await this.opportunityRepository.manager.find(
          BrokingSlipVersionDetails,
          {
            where: { opportunityId: opportunityActivityMapData.opportunityId },
            relations: ["quoteEntry", "quoteEntry.insurer"],
            select: [
              "id",
              "brokingSlipVersion",
              "brokingSlipName",
              "opportunityId",
            ],
          }
        );
      if (brokingSlipVersionDetails) {
        removeMetadataFields(brokingSlipVersionDetails);
        removeLookUpDataFields(brokingSlipVersionDetails);
      }
      return brokingSlipVersionDetails;
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }

  async createQuoteComparisonReport(
    entityManager: EntityManager,
    dto: Partial<OpportunityQuoteComparisonReport>,
    userId: number
  ): Promise<any> {
    try {
      const newRecord = entityManager.create(OpportunityQuoteComparisonReport, {
        ...dto,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedRecord = await entityManager.save(
        OpportunityQuoteComparisonReport,
        newRecord
      );

      return savedRecord;
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

  async saveQuoteComparisonReport(
    entityManager: EntityManager,
    opportunityActivityId: number,
    qcrData: Partial<OpportunityQuoteComparisonReport>,
    userId: number
  ): Promise<any> {
    try {
      const repo = entityManager.getRepository(
        OpportunityQuoteComparisonReport
      );

      let qcr = await repo.findOne({
        where: { opportunityActivityId },
      });

      if (qcr) {
        qcr = repo.merge(qcr, {
          ...qcrData,
          updatedBy: userId,
          updatedAt: new Date(),
        });
      } else {
        qcr = repo.create({
          ...qcrData,
          opportunityActivityId,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      return await repo.save(qcr);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save quote comparison report details: ${error.message}`
      );
    }
  }

  async getQuoteComparisonReportByOpportunityActivityId(
    opportunityActivityId: number
  ): Promise<OpportunityQuoteComparisonReport | null> {
    try {
      const quoteComparisonReport =
        await this.opportunityRepository.manager.findOne(
          OpportunityQuoteComparisonReport,
          {
            where: { opportunityActivityId: opportunityActivityId },
            relations: [
              "documents",
              "documents.document",
              "documents.documentType",
            ],
          }
        );
      return quoteComparisonReport || null;
    } catch (error) {
      throw error instanceof NotFoundException ||
        error instanceof BadRequestException
        ? error
        : new BadRequestException(error);
    }
  }

  async getActivityById(activityId: number): Promise<MstrActivity | null> {
    return this.opportunityRepository.manager.findOne(MstrActivity, {
      where: { id: activityId },
    });
  }

  // Resolve the authoritative activity_key for an opportunity's activity.
  // mstr_activity.activity_key is not reliably populated; opportunity_activity_map
  // carries the real key, so look it up by (opportunityId, refActivityId).
  async getActivityKeyForOpportunity(
    opportunityId: number,
    refActivityId: number
  ): Promise<string | null> {
    const row = await this.opportunityActivityMapRepository.findOne({
      where: { opportunityId, refActivityId },
      select: ["activityKey"],
    });
    return row?.activityKey ?? null;
  }

  async getAllPremiumCalculationCovers(
    opportunityId: number,
    coverTypeLid: number
  ): Promise<Partial<OpportunityCoverDto>[]> {
    try {
      const opportunityData = await this.opportunityRepository.findOne({
        where: { opportunityId },
      });
      if (!opportunityData) {
        throw new NotFoundException(
          errorMessages.opportunityNotPresent(opportunityId)
        );
      }
      const covers = await this.getPremiumCalculationCovers(
        opportunityId,
        opportunityData.policyTypeLid,
        coverTypeLid
      );

      if (!covers.length) {
        throw new NotFoundException(
          errorMessages.opportunityNotPresent(opportunityId)
        );
      }

      return covers.map((cover) => ({
        id: cover.id,
        opportunityId: cover.opportunityId,
        policyTypeId: cover.policyTypeId,
        coverId: cover.coverId,
        mandatory: cover.mandateType,
        approvalRequired: cover.approvalRequired,
        coverName: cover.coverName,
        coverDescription: cover.coverDescription,
        displaySequence: cover.displaySequence,
        displayCategory: cover.displayCategory,
        coverTypeLid: cover.coverTypeLid,
        inputType: cover.inputType,
        inputLov: cover.inputLov,
        coversMeta: this.reconcileCoverMetaRequired(
          cover.coversMeta,
          cover.mandateType
        ),
        sectionId: cover.sectionId,
        visibleUntilActivityKey: cover.visibleUntilActivityKey,
      }));
    } catch (error) {
      throw error instanceof NotFoundException
        ? error
        : new BadRequestException(error);
    }
  }

  /**
   * Makes the mapping's mandate flag (mandate_type) the source of truth for the
   * form's `required` rule: add it when mandatory, strip it when not.
   */
  private reconcileCoverMetaRequired(
    coversMeta: any,
    mandateType: string | null | undefined
  ): any {
    if (!Array.isArray(coversMeta?.formConfig)) {
      return coversMeta;
    }
    const isMandatory =
      String(mandateType ?? "").trim().toLowerCase() === "yes";
    return {
      ...coversMeta,
      formConfig: coversMeta.formConfig.map((field: any) => {
        const rules = { ...(field?.rules ?? {}) };
        if (isMandatory) {
          rules.required = rules.required ?? {
            value: "true",
            message: "This is required field",
          };
        } else {
          delete rules.required;
        }
        return { ...field, rules };
      }),
    };
  }

  async updateQuoteComparisonReportActivity(
    entityManager: EntityManager,
    quoteComparisonReportId: number,
    updateData: Partial<UpdateQuoteComparisonReportDto>,
    userId: number
  ): Promise<any> {
    try {
      const fieldsToUpdate: any = {
        ...updateData,
        updatedBy: userId,
        updatedAt: new Date(),
      };
      // Perform the update
      await entityManager.update(
        OpportunityQuoteComparisonReport,
        { id: quoteComparisonReportId },
        fieldsToUpdate
      );
      return fieldsToUpdate;
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

  async fetchQuoteCoverDetails(
    brokingSlipVersion: number,
    quoteEntryIds: number[]
  ): Promise<OpportunityQuoteEntry[]> {
    // Input validation
    if (
      typeof brokingSlipVersion !== "number" ||
      !Array.isArray(quoteEntryIds) ||
      quoteEntryIds.length === 0
    ) {
      throw new BadRequestException(
        "brokingSlipVersion (number) and quoteEntryIds (non-empty array) are required."
      );
    }

    // Fetch quotes with required relations and filters
    const quotes = await this.quoteRepo.find({
      where: {
        brokingSlipId: brokingSlipVersion,
        id: In(quoteEntryIds),
      },
      relations: ["coverDetails", "insurer", "status"],
    });

    if (!quotes || quotes.length === 0) {
      throw new NotFoundException(
        `No quotes found for brokingSlipVersion ${brokingSlipVersion} and provided quoteEntryIds.`
      );
    }

    if (quotes && quotes.length > 0) {
      quotes.forEach((quote) => {
        removeMetadataFields(quote);
        removeLookUpDataFields(quote);
      });
    }

    return quotes;
  }

  async getOpportunityCoverDetailsById(ids: number[]): Promise<any[]> {
    try {
      const opportunityCoverData =
        await this.opportunityRepository.manager.find(OpportunityCoverMap, {
          where: { id: In(ids) },
          select: [
            "id",
            "coverId",
            "coverName",
            "coverTypeLid",
            "displaySequence",
            "sectionId",
            "visibleUntilActivityKey",
          ],
          order: { displaySequence: "ASC", id: "ASC" },
        });
      if (opportunityCoverData) {
        removeMetadataFields(opportunityCoverData);
        removeLookUpDataFields(opportunityCoverData);
      }
      return opportunityCoverData || null;
    } catch (error) {
      throw new InternalServerErrorException(
        error instanceof Error
          ? error.message
          : errorMessages.opportunityCoverNotFound
      );
    }
  }

  async fetchOpportunityById(id: number) {
    try {
      const opportunity = await this.opportunityRepository.findOne({
        where: { opportunityId: id },
      });
      if (!opportunity) {
        throw new NotFoundException(`Opportunity with ID ${id} not found.`);
      }
      return opportunity;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to fetch opportunity with ID ${id}.`
      );
    }
  }

  async fetchOpportunityContacts(
    opportunityId: number,
    type?: "OPTY" | "COMPANY",
    status?: "ACTIVE" | "INACTIVE"
  ): Promise<CompanyContactMap[] | OpportunityContactMap[]> {
    try {
      let statusLid,
        opportunityContacts: CompanyContactMap[] | OpportunityContactMap[] = [];
      if (status) {
        const lookUpKey =
          status === "ACTIVE"
            ? DEFAULT_CONTACT_STATUS_ACTIVE_KEY
            : DEFAULT_CONTACT_STATUS_INACTIVE_KEY;
        const statusLookUp = await this.lookUpRepository.findOne({
          where: { lookUpKey },
        });
        statusLid = statusLookUp?.id ?? null;
      } else {
        statusLid = null;
      }
      if (type && type === "COMPANY") {
        const opportunity = await this.fetchOpportunityById(opportunityId);
        if (!opportunity) {
          throw new NotFoundException(errorMessages.opportunityNotFound);
        }
        opportunityContacts = await this.opportunityRepository.manager.find(
          CompanyContactMap,
          {
            where: { companyId: opportunity.companyId },
            relations: ["contact", "contact.status"],
          }
        );
      } else {
        opportunityContacts = await this.opportunityRepository.manager.find(
          OpportunityContactMap,
          {
            where: { opportunityId },
            relations: ["contact", "contact.status"],
          }
        );
      }
      if (!opportunityContacts || opportunityContacts.length === 0) {
        return [];
      }
      // Filter by contact.statusLid if statusLid is specified
      if (statusLid) {
        opportunityContacts = (
          opportunityContacts as CompanyContactMap[] | OpportunityContactMap[]
        ).filter(
          (contactMap: CompanyContactMap | OpportunityContactMap) =>
            contactMap.contact && contactMap.contact.statusLid === statusLid
        ) as CompanyContactMap[] | OpportunityContactMap[];
      }

      return opportunityContacts;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to fetch contacts for opportunity with ID ${opportunityId}.`
      );
    }
  }

  async savePlacementSlipDocuments(
    placementSlipId: number,
    documents: PlacementSlipDocumentDto[],
    entityManager: EntityManager
  ): Promise<void> {
    const documentRecords = documents.map((doc) =>
      entityManager.create(OpportunityPlacementSlipDocumentMap, {
        placementSlipId,
        documentId: doc.documentId,
        documentTypeLid: doc.documentTypeLid,
      })
    );

    await entityManager.save(
      OpportunityPlacementSlipDocumentMap,
      documentRecords
    );
  }

  async findOpportunityQuoteById(
    id: number,
    manager: EntityManager
  ): Promise<OpportunityQuoteEntry | null> {
    return manager.findOne(OpportunityQuoteEntry, { where: { id } });
  }

  async createOpportunityQuote(
    manager: EntityManager,
    id: number,
    payload: {
      remarks?: string;
      statusLid?: number;
      opportunityActivityId?: number;
    }
  ): Promise<OpportunityQuote> {
    const record = manager.create(OpportunityQuote, {
      id,
      remarks: payload.remarks ?? null,
      statusLid: payload.statusLid ?? null,
      opportunityActivityId: payload.opportunityActivityId ?? null,
    });
    return manager.save(OpportunityQuote, record);
  }

  async getQuoteDetailsByOpportunityActivityId(
    entityManager: EntityManager,
    opportunityActivityId: number
  ): Promise<OpportunityQuote | null> {
    if (!opportunityActivityId) {
      throw new BadRequestException("opportunityActivityId is required.");
    }
    return entityManager.findOne(OpportunityQuote, {
      where: { opportunityActivityId: opportunityActivityId },
    });
  }

  async upsertOpportunityQuote(
    manager: EntityManager,
    id: number,
    payload: {
      remarks?: string;
      statusLid?: number;
      opportunityActivityId?: number;
    }
  ): Promise<void> {
    console.log(
      "Upserting Opportunity Quote with ID:",
      id,
      "Payload:",
      payload
    );
    const existingQuote = await manager.findOne(OpportunityQuote, {
      where: { opportunityActivityId: payload.opportunityActivityId },
    });
    if (existingQuote) {
      console.log("Existing Opportunity Quote found. Updating...");
      await manager.update(
        OpportunityQuote,
        { id },
        {
          remarks: payload.remarks ?? null,
          statusLid: payload.statusLid ?? null,
          opportunityActivityId: payload.opportunityActivityId ?? null,
        }
      );
    } else {
      console.log("No existing Opportunity Quote found. Creating new...");
      const newQuote = manager.create(OpportunityQuote, {
        id,
        remarks: payload.remarks ?? null,
        statusLid: payload.statusLid ?? null,
        opportunityActivityId: payload.opportunityActivityId ?? null,
      });
      await manager.save(OpportunityQuote, newQuote);
    }
  }

  createOpportunityQuoteDocumentMappings(
    quoteId: number,
    documents: { documentId: number; documentTypeLid?: number }[]
  ): OpportunityQuoteDocumentMap[] {
    return documents.map((doc) =>
      this.quoteDocRepo.create({
        opportunityActivityId: quoteId,
        documentId: doc.documentId,
        documentTypeLid: doc.documentTypeLid ?? null,
      })
    );
  }

  async saveOpportunityQuoteDocumentMappings(
    manager: EntityManager,
    records: OpportunityQuoteDocumentMap[]
  ): Promise<void> {
    await manager.save(OpportunityQuoteDocumentMap, records);
  }

  async upsertOpportunityQuoteDocumentMapping(
    quoteId: number,
    mainDocuments: { documentId: number; documentTypeLid?: number }[],
    manager: EntityManager
  ): Promise<void> {
    for (const document of mainDocuments) {
      const { documentId, documentTypeLid } = document;

      // Check if the combination of quoteId and documentId already exists
      const existingMapping = await manager.findOne(
        OpportunityQuoteDocumentMap,
        {
          where: { opportunityActivityId: quoteId, documentId: documentId },
        }
      );

      // If the combination doesn't exist, insert a new record
      if (!existingMapping) {
        const newMapping = manager.create(OpportunityQuoteDocumentMap, {
          opportunityActivityId: quoteId,
          documentId: documentId,
          documentTypeLid: documentTypeLid ?? null,
        });
        await manager.save(OpportunityQuoteDocumentMap, newMapping);
      }
    }
  }

  async getBrokingSlipDetailsById(brokingSlipId: number) {
    try {
      if (!brokingSlipId) {
        throw new BadRequestException("brokingSlipId is required.");
      }

      const brokingSlipDetails =
        await this.opportunityRepository.manager.findOne(
          BrokingSlipVersionDetails,
          {
            where: { id: brokingSlipId },
            select: [
              "sumInsured",
              "policyFrom",
              "policyTo",
              "createdAt",
              "basicPremium",
              "brokeragePercentage",
              "brokerageAmount",
            ],
          }
        );

      if (!brokingSlipDetails) {
        throw new NotFoundException(
          `Broking slip with ID ${brokingSlipId} not found.`
        );
      }

      return brokingSlipDetails;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to fetch broking slip details: ${error.message}`
      );
    }
  }

  async findQuoteEntryDetailsByOpportunityActivityId(
    opportunityActivityId: number
  ): Promise<OpportunityQuoteEntry | null> {
    try {
      if (!opportunityActivityId) {
        throw new BadRequestException("opportunityActivityId is required.");
      }

      return await this.quoteRepo
        .createQueryBuilder("entry")
        .leftJoinAndMapOne(
          "entry.opportunityQuote",
          OpportunityQuote,
          "quote",
          "quote.opportunityActivityId = entry.opportunityActivityId"
        )
        .leftJoinAndMapMany(
          "entry.quoteDocuments",
          OpportunityQuoteDocumentMap,
          "quoteDoc",
          "quoteDoc.opportunityActivityId = entry.opportunityActivityId"
        )
        .where("entry.opportunityActivityId = :opportunityActivityId", {
          opportunityActivityId,
        })
        .andWhere("entry.deleted_at IS NULL")
        .getOne();
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(errorMessages.quoteRetrievalFailed);
    }
  }

  async savePremiumCalculation(
    entityManager: EntityManager,
    premiumCalculation: OpportunityPremiumCalculation
  ): Promise<OpportunityPremiumCalculation> {
    return await entityManager.save(
      OpportunityPremiumCalculation,
      premiumCalculation
    );
  }

  async savePremiumCoverDetails(
    entityManager: EntityManager,
    coverDetails: OpportunityPremiumCoverDetail[]
  ): Promise<OpportunityPremiumCoverDetail[]> {
    try {
      const updateCovers = coverDetails.filter((cover) => cover.id);
      const newCovers = coverDetails.filter((cover) => !cover.id);
      await entityManager.save(OpportunityPremiumCoverDetail, newCovers);
      await Promise.all(
        updateCovers.map((cover) =>
          entityManager.update(
            OpportunityPremiumCoverDetail,
            { id: cover.id },
            { coverResponse: cover.coverResponse }
          )
        )
      );
      return coverDetails;
    } catch (error) {
      console.log("Error in savePremiumCoverDetails:", error);
      throw new BadRequestException(
        `Failed to save premium cover details: ${error.message}`
      );
    }
  }

  async getActivityData(entity: string, id: number): Promise<any> {
    return this.entityService.getDataById(entity, id);
  }

  async createOpportunityQuoteData(
    payload: any,
    opportunityActivityId: number
  ): Promise<any> {
    try {
      const newQuote = this.opportunityQuoteRepo.create({
        // Initialize with default values or leave empty for now
        remarks: payload?.remarks ?? null,
        statusLid: payload?.statusLid ?? null,
        opportunityActivityId: opportunityActivityId,
      });
      return this.opportunityQuoteRepo.save(newQuote);
    } catch (error) {
      throw new BadRequestException(
        `Failed to create Opportunity Quote: ${error.message}`
      );
    }
  }

  async updateOpportunityQuote(
    entityManager: EntityManager,
    id: number,
    updateData: {
      remarks?: string | null;
      statusLid: number;
      opportunityActivityId: number;
    }
  ): Promise<OpportunityQuote> {
    // Validate required fields
    // Find the existing OpportunityQuote
    const opportunityQuote = await entityManager.findOne(OpportunityQuote, {
      where: { id },
    });

    if (!opportunityQuote) {
      throw new Error(`OpportunityQuote with ID ${id} not found.`);
    }

    // Update fields
    opportunityQuote.remarks = updateData?.remarks ?? null;
    opportunityQuote.statusLid = updateData?.statusLid;
    opportunityQuote.opportunityActivityId = updateData.opportunityActivityId;

    // Save and return the updated entity
    return await entityManager.save(OpportunityQuote, opportunityQuote);
  }

  async getQuoteByOpportunityActivityId(
    opportunityActivityId: number
  ): Promise<any | null> {
    if (!opportunityActivityId) {
      throw new BadRequestException("opportunityActivityId is required.");
    }
    const quote = await this.opportunityQuoteRepo.findOne({
      where: { opportunityActivityId: opportunityActivityId },
    });
    const documents = await this.getQuoteDocuments(opportunityActivityId);
    return { ...quote, documents: documents || [] };
  }

  async getQuoteDocuments(opportunityActivityId: number): Promise<any> {
    const documents = await this.quoteDocRepo.find({
      where: { opportunityActivityId: opportunityActivityId },
      relations: ["document", "documentType"],
    });
    if (documents?.length > 0) {
      removeMetadataFields(documents);
      removeLookUpDataFields(documents);
    }
    return documents.map((doc) => ({
      ...doc,
      document: undefined,
      fileName: doc.document?.fileKey
        ? doc.document?.fileKey?.split("/")?.pop()
        : null,
      documentType: doc.documentType ? doc.documentType.lookUpValue : null,
    }));
  }

  async fetchBrokingSlipCoverDetails(
    brokingSlipVersion: number,
    opportunityId: number
  ): Promise<BrokingSlipVersionCoverDetails[]> {
    // Input validation
    if (typeof opportunityId !== "number") {
      throw new BadRequestException("Opportunity Id is required.");
    }
    if (typeof brokingSlipVersion !== "number") {
      throw new BadRequestException("BrokingSlipVersion is required.");
    }

    const brokingSlipCoverDetails =
      await this.opportunityRepository.manager.find(
        BrokingSlipVersionCoverDetails,
        {
          where: {
            brokingSlipVersionId: brokingSlipVersion,
            opportunityId: opportunityId,
          },
        }
      );

    if (brokingSlipCoverDetails && brokingSlipCoverDetails.length > 0) {
      brokingSlipCoverDetails.forEach((brokingSlipCoverDetail) => {
        removeMetadataFields(brokingSlipCoverDetail);
        removeLookUpDataFields(brokingSlipCoverDetail);
      });
    }

    return brokingSlipCoverDetails;
  }

  async updatePlacementSlipCoverDetails(
    manager: EntityManager,
    opportunityId: number,
    covers: Record<string, string>,
    userId: number
  ): Promise<void> {
    try {
      const existingCovers = await manager.find(
        OpportunityPlacementSlipCoverDetail,
        { where: { opportunityId } }
      );
      for (const [templateId, response] of Object.entries(covers)) {
        const cover = existingCovers.find(
          (c) => c.coverTemplateId === Number(templateId)
        );
        if (cover) {
          await manager.update(
            OpportunityPlacementSlipCoverDetail,
            { id: cover.id },
            { coverResponse: response, updatedBy: userId }
          );
        }
      }
    } catch (error) {
      throw new BadRequestException(
        `Failed to update placement slip covers: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async getPlacementSlipCoverDetailsByOpportunityId(
    opportunityId: number
  ): Promise<OpportunityPlacementSlipCoverDetail[]> {
    try {
      const covers = await this.coverRepo.find({ where: { opportunityId } });

      if (covers && covers.length > 0) {
        removeMetadataFields(covers);
        removeLookUpDataFields(covers);
      }

      return covers;
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch placement slip covers: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async opportunityActivityApproval(
    entityManager: EntityManager,
    opportunityActivityId: number,
    userId: number,
    isApproved: boolean,
    activityStatusKey: string
  ) {
    try {
      const opportunityActivity = await this.getOpportunityActivityById(
        opportunityActivityId
      );
      const status = await getLookups(
        this.lookUpRepository,
        [
          OPPORTUNITY_ACTIVITY_STATUS.APPROVED,
          OPPORTUNITY_ACTIVITY_STATUS.REJECTED,
          TASK_STATUS_CLOSED,
          OPPORTUNITY_STATUS_WON,
        ],
        LOOK_UP_FIELD.KEY
      );
      const lookUp = await getLookup(
        status,
        [
          OPPORTUNITY_ACTIVITY_STATUS.APPROVED,
          OPPORTUNITY_ACTIVITY_STATUS.REJECTED,
          TASK_STATUS_CLOSED,
          OPPORTUNITY_STATUS_WON,
        ],
        LOOK_UP_FIELD.KEY
      );
      const approvalStatus = isApproved
        ? lookUp[`lookup_${OPPORTUNITY_ACTIVITY_STATUS.APPROVED}`]
        : lookUp[`lookup_${OPPORTUNITY_ACTIVITY_STATUS.REJECTED}`];
      const taskStatus = lookUp[`lookup_${TASK_STATUS_CLOSED}`];
      const activityTable = opportunityActivity.opportunityTable;
      switch (activityTable) {
        case "opportunity_rfp_details_entry":
          await this.updateRfpDetails(
            entityManager,
            opportunityActivity,
            userId,
            taskStatus.id,
            approvalStatus.id
          );
          break;

        case "opportunity_placement_slip_generation":
          await this.updatePlacementSlipData(
            entityManager,
            opportunityActivity,
            userId,
            taskStatus.id,
            approvalStatus.id,
            isApproved
          );
          break;
        case "opportunity_policy_docket":
          await this.updatePolicyDocketDetails(
            entityManager,
            opportunityActivity,
            userId,
            taskStatus.id,
            approvalStatus.id,
            isApproved
          );
          break;

        case "opportunity_hand_over_meet":
          await this.updateHandOverMeetDetails(
            entityManager,
            opportunityActivity,
            userId,
            taskStatus.id,
            approvalStatus.id,
            isApproved
          );
          break;

        case "opportunity_held_cover_note":
          await this.updateHeldCoverDetails(
            entityManager,
            opportunityActivity,
            userId,
            taskStatus.id,
            approvalStatus.id,
            isApproved
          );
          break;

        case "opportunity_broking_slip_version_details":
          await this.updateBrokingSlipTaskDetails(
            entityManager,
            opportunityActivity,
            userId,
            taskStatus.id,
            approvalStatus.id,
            isApproved
          );
          break;

        default:
          throw new BadRequestException(
            `This activity ${opportunityActivity.activityName} is not supported for approval.`
          );
      }
      // Update the OpportunityActivityMap status
      await this.updateOpportunityActivityMapStatus(
        opportunityActivityId,
        approvalStatus.id,
        userId,
        isApproved ? new Date() : null,
        undefined,
        activityStatusKey
      );
      return await this.opportunityActivityMapRepository.findOne({
        where: { id: opportunityActivityId },
      });
    } catch (error) {
      this.logError("opportunityActivityApproval", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to approve opportunity activity: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async createPolicyFromPlacementSlip(
    opportunityActivityId: number,
    userId: number,
    manager: EntityManager
  ): Promise<any> {
    try {
      return await this.createPolicyWithDetails(
        opportunityActivityId,
        userId,
        manager
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "createPolicyFromPlacementSlip",
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to create policy."
      );
    }
  }

  async updateRfpDetails(
    manager: EntityManager,
    opportunityActivity: OpportunityActivityDto,
    userId: number,
    taskStatusId: number,
    activityStatusId: number
  ) {
    try {
      const rfpCoverDetails = await manager.find(OpportunityRfpDetailsEntry, {
        where: { opportunityActivityId: opportunityActivity.id },
      });
      if (!rfpCoverDetails) {
        throw new NotFoundException(
          `No RFP data found for opportunityActivityId ${opportunityActivity.id}.`
        );
      }
      await manager.update(
        OpportunityRfpDetailsEntry,
        { opportunityActivityId: opportunityActivity.id },
        {
          statusLid: activityStatusId,
          updatedBy: userId,
        }
      );
      await manager.update(
        Task,
        { activityId: opportunityActivity.id },
        {
          taskStatusLid: taskStatusId,
          taskClose: TASK_CLOSED,
          updatedBy: userId,
          updatedAt: new Date(),
        }
      );
      await this.updateOpportunityStatus(
        manager,
        opportunityActivity.opportunityId,
        OPPORTUNITY_STATUS_ISG_PLANNING
      );
    } catch (error) {
      this.logError("updateRfpDetails", error);
      throw new BadRequestException(
        `Failed to approve RFP details entry: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async updatePlacementSlipData(
    manager: EntityManager,
    opportunityActivity: OpportunityActivityDto,
    userId: number,
    taskStatusId: number,
    activityStatusId: number,
    isApproved: boolean
  ) {
    try {
      const placementSlipDetails = await manager.find(
        OpportunityPlacementSlipGeneration,
        { where: { opportunityActivityId: opportunityActivity.id } }
      );
      if (!placementSlipDetails || placementSlipDetails.length === 0) {
        throw new NotFoundException(
          `No Placement Slip data found for opportunity ID ${opportunityActivity.opportunityId}.`
        );
      }
      await manager.update(
        OpportunityPlacementSlipGeneration,
        { opportunityActivityId: opportunityActivity.id },
        {
          statusLid: activityStatusId,
          updatedBy: userId,
        }
      );
      await manager.update(
        Task,
        { activityId: opportunityActivity.id },
        {
          taskStatusLid: taskStatusId,
          taskClose: TASK_CLOSED,
          updatedBy: userId,
          updatedAt: new Date(),
        }
      );
      if (isApproved) {
        await this.createPolicyFromPlacementSlip(
          opportunityActivity.id,
          userId,
          manager
        );
        await this.updateNextActivityStatus(
          opportunityActivity.id,
          activityStatusId,
          manager
        );
        // Opportunity is moved to WON on Policy Confirmation completion
        // (see handlePolicyConfirmation), not on placement slip approval.
      }
    } catch (error) {
      this.logError("updatePlacementSlipData", error);
      throw new BadRequestException(
        `Failed to approve Placement Slip activity: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async updateOwnerForActivities(
    entityManager: EntityManager,
    opportunityId: number,
    ownerId: number,
    roleKey: string,
    userId: number
  ): Promise<any> {
    // Find all activities for the opportunity and stageName
    const activities = await entityManager.find(OpportunityActivityMap, {
      where: { opportunityId, roleKey: roleKey },
    });

    if (!activities.length) return 0;

    // Update stage_owner_id for each activity
    await entityManager
      .createQueryBuilder()
      .update(OpportunityActivityMap)
      .set({
        ownerId: ownerId,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where("opportunityId = :opportunityId", { opportunityId })
      .andWhere("roleKey = :roleKey", { roleKey })
      .execute();
    // update opportunity ownerId(BD activities) or isgId (ISG activities)
    const opportunity = await entityManager.findOne(Opportunity, {
      where: { opportunityId },
    });
    if (opportunity) {
      if (roleKey === ROLE_KEY.ROLE_BD_MANAGER) {
        opportunity.ownerId = ownerId;
      } else if (
        roleKey === ROLE_KEY.ROLE_ISG_EXECUTIVE ||
        roleKey === ROLE_KEY.ROLE_ISG_MANAGER
      ) {
        opportunity.isgId = ownerId;
      }
      opportunity.updatedBy = userId;
      opportunity.updatedAt = new Date();
      await entityManager.save(Opportunity, opportunity);
    }
    return activities;
  }

  async getStageOwnersByOpportunityId(
    opportunityId: number,
    roleKey: string
  ): Promise<StageOwnerResponseDto | null> {
    const activity = await this.opportunityActivityMapRepository.findOne({
      where: { opportunityId, roleKey: roleKey },
      select: ["opportunityId", "roleKey", "ownerId"],
    });
    return activity ? activity : null;
  }

  async updateHeldCoverDetails(
    manager: EntityManager,
    opportunityActivity: OpportunityActivityDto,
    userId: number,
    taskStatusId: number,
    activityStatusId: number,
    isApproved: boolean
  ) {
    try {
      const heldCoverDetails = await manager.find(OpportunityHeldCoverNote, {
        where: { opportunityActivityId: opportunityActivity.id },
      });
      if (!heldCoverDetails) {
        throw new NotFoundException(
          `No RFP data found for opportunity ID ${opportunityActivity.opportunityId}.`
        );
      }

      await manager.update(
        OpportunityHeldCoverNote,
        { opportunityActivityId: opportunityActivity.id },
        {
          statusLid: activityStatusId,
          updatedBy: userId,
        }
      );
      await manager.update(
        Task,
        { activityId: opportunityActivity.id },
        {
          taskStatusLid: taskStatusId,
          taskClose: TASK_CLOSED,
          updatedBy: userId,
          updatedAt: new Date(),
        }
      );

      if (isApproved) {
        await this.updateNextActivityStatus(
          opportunityActivity.id,
          activityStatusId,
          manager
        );
      }
    } catch (error) {
      this.logError("updateHeldCoverDetails", error);
      throw new BadRequestException(
        `Failed to approve Held Cover Details: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async updateHandOverMeetDetails(
    manager: EntityManager,
    opportunityActivity: OpportunityActivityDto,
    userId: number,
    taskStatusId: number,
    activityStatusId: number,
    isApproved: boolean
  ) {
    try {
      const handOverMeetDetails = await manager.find(OpportunityHandOverMeet, {
        where: { opportunityActivityId: opportunityActivity.id },
      });
      if (!handOverMeetDetails) {
        throw new NotFoundException(
          `No RFP data found for opportunity ID ${opportunityActivity.opportunityId}.`
        );
      }
      await manager.update(
        OpportunityHandOverMeet,
        { opportunityActivityId: opportunityActivity.id },
        {
          statusLid: activityStatusId,
          updatedBy: userId,
        }
      );
      await manager.update(
        Task,
        { activityId: opportunityActivity.id },
        {
          taskStatusLid: taskStatusId,
          taskClose: TASK_CLOSED,
          updatedBy: userId,
          updatedAt: new Date(),
        }
      );
      if (isApproved) {
        await this.updateNextActivityStatus(
          opportunityActivity.id,
          activityStatusId,
          manager
        );
      }
    } catch (error) {
      this.logError("updateHandOverMeetDetails", error);
      throw new BadRequestException(
        `Failed to approve Hand Over Meet activity: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async updatePolicyDocketDetails(
    manager: EntityManager,
    opportunityActivity: OpportunityActivityDto,
    userId: number,
    taskStatusId: number,
    activityStatusId: number,
    isApproved: boolean
  ) {
    try {
      const policyDocketDetails = await manager.find(OpportunityPolicyDocket, {
        where: { opportunityActivityId: opportunityActivity.id },
      });
      if (!policyDocketDetails) {
        throw new NotFoundException(
          `No RFP data found for opportunity ID ${opportunityActivity.opportunityId}.`
        );
      }
      await manager.update(
        OpportunityPolicyDocket,
        { opportunityActivityId: opportunityActivity.id },
        {
          statusLid: activityStatusId,
          updatedBy: userId,
        }
      );
      await manager.update(
        Task,
        { activityId: opportunityActivity.id },
        {
          taskStatusLid: taskStatusId,
          taskClose: TASK_CLOSED,
          updatedBy: userId,
          updatedAt: new Date(),
        }
      );
      if (isApproved) {
        await this.updateNextActivityStatus(
          opportunityActivity.id,
          activityStatusId,
          manager
        );
      }
    } catch (error) {
      this.logError("updatePolicyDocketDetails", error);
      throw new BadRequestException(
        `Failed to approve Policy Docket activity: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async updateBrokingSlipTaskDetails(
    manager: EntityManager,
    opportunityActivity: OpportunityActivityDto,
    userId: number,
    taskStatusId: number,
    activityStatusId: number,
    isApproved: boolean
  ) {
    try {
      await manager.update(
        Task,
        { activityId: opportunityActivity.id },
        {
          taskStatusLid: taskStatusId,
          taskClose: TASK_CLOSED,
          updatedBy: userId,
          updatedAt: new Date(),
        }
      );
      if (isApproved) {
        await this.updateNextActivityStatus(
          opportunityActivity.id,
          activityStatusId,
          manager
        );
      }
    } catch (error) {
      this.logError("updateBrokingSlipTaskDetails", error);
      throw new BadRequestException(
        `Failed to approve Brokingslip Activity: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async extractBrokingSlipDetailsIds(
    preferredInsurerDetails: any[],
    preferredTpaDetails: any[]
  ) {
    const insurerIdsSet: Set<number> = new Set();
    const tpaIdsSet: Set<number> = new Set();
    const contactIdsSet: Set<number> = new Set();
    const branchIdsSet: Set<number> = new Set();
    const locationIdsSet: Set<number> = new Set();

    preferredInsurerDetails.forEach((item) => {
      if (item.insurerId) insurerIdsSet.add(item.insurerId);
      if (item.contactId) contactIdsSet.add(item.contactId);
      if (item.branchId) branchIdsSet.add(item.branchId);
      if (item.locationId) locationIdsSet.add(item.locationId);
    });

    preferredTpaDetails.forEach((item) => {
      if (item.tpaId) tpaIdsSet.add(item.tpaId);
      if (item.contactId) contactIdsSet.add(item.contactId);
      if (item.branchId) branchIdsSet.add(item.branchId);
      if (item.locationId) locationIdsSet.add(item.locationId);
    });

    return {
      insurerIds: Array.from(insurerIdsSet),
      tpaIds: Array.from(tpaIdsSet),
      contactIds: Array.from(contactIdsSet),
      branchIds: Array.from(branchIdsSet),
      locationIds: Array.from(locationIdsSet),
    };
  }

  async getBrokingSlipReferenceDetails(
    insurerIds: number[],
    tpaIds: number[],
    locationIds: number[],
    branchIds: number[],
    contactIds: number[]
  ): Promise<any> {
    // Fetch all in parallel
    const [insurers, tpas, cities, addresses, contacts] = await Promise.all([
      insurerIds.length
        ? this.insurerRepository.find({ where: { id: In(insurerIds) } })
        : [],
      tpaIds.length
        ? this.tpaRepository.find({ where: { id: In(tpaIds) } })
        : [],
      locationIds.length
        ? this.cityRepository.find({ where: { id: In(locationIds) } })
        : [],
      branchIds.length
        ? this.addressRepository.find({ where: { id: In(branchIds) } })
        : [],
      contactIds.length
        ? this.contactRepository.find({ where: { id: In(contactIds) } })
        : [],
    ]);

    // Map results by ID for fast lookup
    const insurerNames: Record<number, string> = {};
    insurers.forEach((insurer) => {
      insurerNames[insurer.id] = insurer.insurerName;
    });

    const tpaNames: Record<number, string> = {};
    tpas.forEach((tpa: any) => {
      tpaNames[tpa.id] = tpa.tpaName;
    });

    const locationNames: Record<number, string> = {};
    cities.forEach((city: any) => {
      locationNames[city.id] = city.name;
    });

    const branchAddresses: Record<number, string> = {};
    addresses.forEach((addressData: any) => {
      branchAddresses[addressData.id] = addressData.address1;
    });

    const contactNames: Record<number, string> = {};
    contacts.forEach((contact: any) => {
      contactNames[contact.id] = [contact.firstName, contact.lastName]
        .filter(Boolean)
        .join(" ");
    });

    return {
      insurerNames,
      tpaNames,
      locationNames,
      branchAddresses,
      contactNames,
    };
  }

  async mapBrokingSlipDetails(
    preferredInsurerDetails: PreferredInsurerDetail[],
    preferredTpaDetails: PreferredTpaDetail[],
    allData: AllPreferredDataMap
  ): Promise<{
    preferredInsurerDetails: any[];
    preferredTpaDetails: any[];
  }> {
    const mappedPreferredInsurerDetails = preferredInsurerDetails.map(
      (item) => ({
        Name: allData.insurerNames[item.insurerId],
      })
    );

    const mappedPreferredTpaDetails = preferredTpaDetails.map((item) => ({
      "Name and Address": `${allData.tpaNames[item.tpaId]} (${
        allData.locationNames[item.locationId]
      })`,
      "Contact details": item.contactId
        ? allData.contactNames[item.contactId]
        : "",
    }));

    return {
      preferredInsurerDetails: mappedPreferredInsurerDetails,
      preferredTpaDetails: mappedPreferredTpaDetails,
    };
  }

  async getOpportunityCompanyDetails(opportunityId: number): Promise<{
    companyId: number;
    companyName: string;
  }> {
    const opportunityData = await this.opportunityRepository.findOne({
      where: { opportunityId: opportunityId },
      relations: ["company"],
    });
    if (!opportunityData) {
      throw new NotFoundException(
        `Opportunity with ID ${opportunityId} not found`
      );
    }
    return {
      companyId: opportunityData.company?.id,
      companyName: opportunityData?.company?.companyName,
    };
  }

  async getAllActivityIdAndName(
    type: "SO" | "RO",
    visibleActivityRoleKeys?: string[] | null
  ): Promise<ActivityNameData[]> {
    try {
      // Role gate: when the viewer is single-role (BD-only / ISG-only), restrict
      // the activity LOV to activities whose stage belongs to a visible role. The
      // role lives on the stage (mstr_stage.ref_role_key); activity↔stage is via
      // mstr_stage_activity_template. Null/empty => unrestricted (all activities).
      let idFilter: number[] | undefined;
      if (visibleActivityRoleKeys && visibleActivityRoleKeys.length > 0) {
        const idRows = await this.activityRepository
          .createQueryBuilder("activity")
          .innerJoin(
            "mstr_stage_activity_template",
            "template",
            "template.activity_id = activity.id"
          )
          .innerJoin("mstr_stage", "stage", "stage.id = template.stage_id")
          .where("stage.ref_role_key IN (:...visibleRoleKeys)", {
            visibleRoleKeys: visibleActivityRoleKeys,
          })
          .select("activity.id", "id")
          .distinct(true)
          .getRawMany<{ id: number }>();
        idFilter = idRows.map((row) => row.id);
        if (idFilter.length === 0) {
          return [];
        }
      }

      const activities = await this.activityRepository.find({
        where: idFilter ? { id: In(idFilter) } : {},
        select: ["id", "name", "roName"],
        order: { id: "ASC" },
      });

      // Resolve each activity's owning role (BD vs ISG) and its position in the
      // workflow from the stage template, so the LOV can be ordered the way the
      // stages actually run.
      const orderRows = await this.activityRepository
        .createQueryBuilder("activity")
        .innerJoin(
          "mstr_stage_activity_template",
          "template",
          "template.activity_id = activity.id"
        )
        .innerJoin("mstr_stage", "stage", "stage.id = template.stage_id")
        .select("activity.id", "id")
        .addSelect("stage.ref_role_key", "refRoleKey")
        .addSelect("MIN(template.stage_activity_order)", "activityOrder")
        .groupBy("activity.id")
        .addGroupBy("stage.ref_role_key")
        .getRawMany<{ id: number; refRoleKey: string; activityOrder: number }>();
      const roleByActivityId = new Map<number, string>();
      const orderByActivityId = new Map<number, number>();
      orderRows.forEach((row) => {
        if (!roleByActivityId.has(row.id)) {
          roleByActivityId.set(row.id, row.refRoleKey);
        }
        const order = Number(row.activityOrder);
        if (
          !orderByActivityId.has(row.id) ||
          order < (orderByActivityId.get(row.id) as number)
        ) {
          orderByActivityId.set(row.id, order);
        }
      });

      const toOption = (activity: {
        id: number;
        name: string;
        roName: string;
      }): ActivityNameData => ({
        id: activity.id,
        name: type === SALES_OPPORTUNITY ? activity.name : activity.roName,
      });
      const sortByWorkflow = (
        a: { id: number },
        b: { id: number }
      ): number => {
        const orderA = orderByActivityId.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const orderB = orderByActivityId.get(b.id) ?? Number.MAX_SAFE_INTEGER;
        return orderA !== orderB ? orderA - orderB : a.id - b.id;
      };
      const bdActivityOptions = activities
        .filter(
          (activity) =>
            roleByActivityId.get(activity.id) !== ROLE_KEY.ROLE_ISG_EXECUTIVE
        )
        .sort(sortByWorkflow)
        .map(toOption);
      const isgActivityOptions = activities
        .filter(
          (activity) =>
            roleByActivityId.get(activity.id) === ROLE_KEY.ROLE_ISG_EXECUTIVE
        )
        .sort(sortByWorkflow)
        .map(toOption);

      // BD/ISG Planning are synthetic (derived from plannedAt, not mstr_activity
      // rows) but DO surface as the displayed current activity via the status
      // fallback, so they must be filterable. They sit at the head of their team's
      // stages: BD/Renewal Planning before the BD activities, ISG Planning before
      // the ISG activities. Role-gated like the real activities; negative sentinel
      // ids keep them distinct.
      const canViewBdActivities =
        !visibleActivityRoleKeys ||
        visibleActivityRoleKeys.length === 0 ||
        visibleActivityRoleKeys.includes(ROLE_KEY.ROLE_BD_EXECUTIVE);
      const canViewIsgActivities =
        !visibleActivityRoleKeys ||
        visibleActivityRoleKeys.length === 0 ||
        visibleActivityRoleKeys.includes(ROLE_KEY.ROLE_ISG_EXECUTIVE);

      const orderedOptions: ActivityNameData[] = [];
      if (canViewBdActivities) {
        orderedOptions.push({
          id: -1,
          name:
            type === SALES_OPPORTUNITY
              ? ACTIVITY_NAME.BD_PLANNING
              : RENEWAL_PLANNING_ACTIVITY_NAME,
        });
      }
      orderedOptions.push(...bdActivityOptions);
      if (canViewIsgActivities) {
        orderedOptions.push({ id: -2, name: ACTIVITY_NAME.ISG_PLANNING });
      }
      orderedOptions.push(...isgActivityOptions);
      return orderedOptions;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch activity ids and names: ${(error as Error).message}`
      );
    }
  }

  async getAllStageIdAndName(): Promise<StageNameData[]> {
    try {
      const stages = await this.stageRepository.find({
        select: ["id", "name"],
        order: { id: "ASC" },
      });
      return stages.map((stage) => ({
        id: stage.id,
        name: stage.name,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch stage ids and names: ${(error as Error).message}`
      );
    }
  }

  /**
   * Single source of truth for "which opportunities are in funnel stage X for a
   * given period/scope". Used by both the sales-funnel counts and the funnel
   * drilldown on the opportunities listing, so the drilled list can never diverge
   * from the funnel counts. Period is anchored on policy EXPIRY date (with the
   * same +-5 day buffer the opportunities listing applies); stage membership stays
   * on the activity's completedAt. Returns a query builder with all filters
   * applied and NO select — the caller adds the columns it needs (aggregate rows
   * for counts, or opportunityId for the drilldown subquery).
   */
  buildFunnelStageQuery(
    scope: {
      opportunityTypeLid: number;
      from: Date;
      to: Date;
      organisationId: any;
      sbuId: any;
      verticalId: any;
      branchId: any;
      userIds: number[];
      isLeadership: boolean;
      insurerId?: number;
      lostStatusIds: (number | undefined)[];
      wonStatusId: number | undefined;
      openStatusIds: (number | undefined)[];
      // Business-performance funnel scope: only opps enabled for performance
      // (and, for RO, only those linked to a policy) — mirrors the listing's
      // performanceCondition so the counts and the drilldown agree.
      enabledForPerformanceLid?: number;
      requireRefPolicy?: boolean;
      placementSoTypeLid?: number;
      isgGate?: Brackets;
    },
    stage: { stageName: string; table: string | null }
  ): SelectQueryBuilder<Opportunity> {
    const {
      opportunityTypeLid,
      from,
      to,
      organisationId,
      sbuId,
      verticalId,
      branchId,
      userIds,
      isLeadership,
      insurerId,
      lostStatusIds,
    } = scope;

    // Period is scoped on policy expiry date, widened by the same +-5 day buffer
    // the opportunities listing uses, so funnel counts line up with the listing.
    const fromExpiry = new Date(from);
    fromExpiry.setDate(fromExpiry.getDate() - EXPIRY_BUFFER_DAYS);
    const toExpiry = new Date(to);
    toExpiry.setDate(toExpiry.getDate() + EXPIRY_BUFFER_DAYS);

    const query = this.opportunityRepository
      .createQueryBuilder("opportunity")
      .leftJoin("opportunity.opportunityActivityMap", "activity")
      .leftJoin(
        "OpportunityLost",
        "lost",
        "lost.opportunityId = opportunity.opportunityId"
      )
      .where("1 = 1");

    if (scope.placementSoTypeLid != null) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where("opportunity.opportunityTypeLid = :placementSoTypeLid", {
            placementSoTypeLid: scope.placementSoTypeLid,
          }).orWhere("opportunity.refPolicyId IS NOT NULL");
        })
      );
      if (scope.isgGate) {
        query.andWhere(scope.isgGate);
      }
    } else {
      query.andWhere("opportunity.opportunityTypeLid = :opportunityTypeLid", {
        opportunityTypeLid,
      });
    }

    if (organisationId !== undefined && organisationId !== null) {
      if (Array.isArray(organisationId)) {
        if (organisationId.length > 0) {
          query.andWhere(
            "opportunity.organisationId IN (:...organisationIds)",
            { organisationIds: organisationId }
          );
        }
      } else {
        query.andWhere("opportunity.organisationId = :organisationId", {
          organisationId,
        });
      }
    }
    if (sbuId !== undefined && sbuId !== null) {
      if (Array.isArray(sbuId)) {
        if (sbuId.length > 0) {
          query.andWhere("opportunity.sbuId IN (:...sbuIds)", { sbuIds: sbuId });
        }
      } else {
        query.andWhere("opportunity.sbuId = :sbuId", { sbuId });
      }
    }
    if (verticalId !== undefined && verticalId !== null) {
      if (Array.isArray(verticalId)) {
        if (verticalId.length > 0) {
          query.andWhere("opportunity.verticalId IN (:...verticalIds)", {
            verticalIds: verticalId,
          });
        }
      } else {
        query.andWhere("opportunity.verticalId = :verticalId", { verticalId });
      }
    }
    if (branchId !== undefined && branchId !== null) {
      if (Array.isArray(branchId)) {
        if (branchId.length > 0) {
          query.andWhere("opportunity.branchId IN (:...branchIds)", {
            branchIds: branchId,
          });
        }
      } else {
        query.andWhere("opportunity.branchId = :branchId", { branchId });
      }
    }

    if (!isLeadership && userIds.length > 0) {
      // Involvement scope, not owner_id — the listing's definition of "my team"
      // (buildOpportunityInvolvementScope), so the count matches the drilldown.
      query.andWhere(buildOpportunityInvolvementScope(userIds, "opportunity"));
    }

    // Period is the expiry window ONLY, and lost/closed opportunities are hidden —
    // exactly what the opportunities listing does for the same filters, so the
    // funnel count equals the listing count. Opportunities whose expiry predates
    // the window are NOT carried forward: they belong to their own expiry period.
    query.andWhere("opportunity.expiryDate BETWEEN :fromExpiry AND :toExpiry", {
      fromExpiry,
      toExpiry,
    });
    // Status ids are trusted integer lookups; inlined so this predicate carries no
    // spread params and can be injected as a listing subquery without collisions.
    const hiddenStatusIds = lostStatusIds.filter((s) => s != null);
    if (hiddenStatusIds.length > 0) {
      query.andWhere(
        `(opportunity.statusLid IS NULL OR opportunity.statusLid NOT IN (${hiddenStatusIds.join(
          ","
        )}))`
      );
    }

    if (insurerId) {
      query.andWhere(
        `opportunity.opportunityId IN (
          SELECT oam.opportunity_id
          FROM opportunity_activity_map oam
          INNER JOIN opportunity_placement_slip_generation opsg
            ON opsg.opportunity_activity_id = oam.id
          INNER JOIN opportunity_placement_slip_insurer_map opsim
            ON opsim.placement_slip_id = opsg.id
          WHERE opsim.insurer_id = :insurerId
        )`,
        { insurerId }
      );
    }

    if (stage.table) {
      query
        .andWhere("activity.opportunityTable = :table", { table: stage.table })
        .andWhere("activity.completedAt BETWEEN :from AND :to", { from, to });
    }

    if (scope.enabledForPerformanceLid != null) {
      query.andWhere(
        "opportunity.enabledForPerformanceLid = :enabledForPerformanceLid",
        { enabledForPerformanceLid: scope.enabledForPerformanceLid }
      );
    }
    if (scope.requireRefPolicy) {
      query.andWhere("opportunity.refPolicyId IS NOT NULL");
    }

    return query;
  }

  /**
   * WHERE condition (as a Brackets) that restricts the opportunities listing to the
   * exact set the funnel counts for a stage (or the whole type when activityTable is
   * null), built from the SAME buildFunnelStageQuery the counts use — so the drilled
   * list matches the count. Injected as `main.opportunityId IN (<subquery>)` so it
   * scales to any size. No owner/org scope here: the listing applies its own scope;
   * this only contributes the period (expiry +-5) + arms + stage predicate. Subquery
   * params are namespaced (fnl_*) so they can't collide with the listing's params.
   */
  async buildFunnelStageDrilldownCondition(
    type: "SO" | "RO" | "PLACEMENT",
    from: Date,
    to: Date,
    activityTable: string | null
  ): Promise<Brackets> {
    const isPlacement = type === "PLACEMENT";
    const opportunityTypeLid = (
      await this.lookUpRepository.findOne({
        where: { lookUpKey: OPPORTUNITY_TYPE[isPlacement ? "SO" : type ?? "SO"] },
      })
    )?.id;
    if (!opportunityTypeLid) {
      return new Brackets((qb) => qb.where("1 = 0"));
    }
    const isgGate = isPlacement
      ? await this.buildActivityRoleStageGate(null, true, undefined, "opportunity")
      : undefined;

    const opportunityStatus = await this.lookUpRepository.find({
      where: { lookUpName: "OPPORTUNITY_STATUS" },
    });
    const getLookUpIdByKey = (key: string): number | undefined =>
      opportunityStatus.find((item) => item.lookUpKey === key)?.id;

    const sub = this.buildFunnelStageQuery(
      {
        opportunityTypeLid,
        from,
        to,
        organisationId: undefined,
        sbuId: undefined,
        verticalId: undefined,
        branchId: undefined,
        userIds: [],
        isLeadership: true, // skip the ownerId filter; listing applies its own scope
        insurerId: undefined,
        lostStatusIds: [
          getLookUpIdByKey(OPPORTUNITY_STATUS_LOST),
          getLookUpIdByKey(OPPORTUNITY_STATUS_AUTO_CLOSE),
          getLookUpIdByKey(OPPORTUNITY_STATUS_CLOSE),
        ],
        wonStatusId: getLookUpIdByKey(OPPORTUNITY_STATUS_WON),
        openStatusIds: [
          getLookUpIdByKey(OPPORTUNITY_STATUS_OPEN),
          getLookUpIdByKey(OPPORTUNITY_STATUS_WORK_IN_PROGRESS),
          getLookUpIdByKey(OPPORTUNITY_STATUS_BD_PLANNING),
          getLookUpIdByKey(OPPORTUNITY_STATUS_ISG_PLANNING),
        ],
        ...(isPlacement
          ? { placementSoTypeLid: opportunityTypeLid, isgGate }
          : {}),
      },
      { stageName: "", table: activityTable }
    ).select("opportunity.opportunityId", "opportunityId");

    // Namespace the subquery's (scalar) params so they can't clash with the outer
    // listing query's params, then inject it as an opportunityId IN (subquery).
    let subSql = sub.getQuery();
    const subParams = sub.getParameters();
    const nsParams: Record<string, unknown> = {};
    for (const key of Object.keys(subParams)) {
      subSql = subSql.replace(new RegExp(`:${key}\\b`, "g"), `:fnl_${key}`);
      nsParams[`fnl_${key}`] = subParams[key];
    }

    return new Brackets((qb) => {
      qb.where(`main.opportunityId IN (${subSql})`, nsParams);
    });
  }

  /**
   * The Placement funnel's bars (spec §12.3-A): ISG Planning as the synthetic
   * head bar — `table: null`, so it counts everything past the ISG gate — then
   * the six placement milestones product tracks, in workflow order.
   *
   * This is NOT every ISG-role activity: Enter Quote, Meeting for Final
   * Negotiation, Premium Calculation, Policy Docket and Hand over Meet are
   * deliberately out. Listed explicitly for the same reason the SO/RO funnel
   * lists are — the bars are a product choice, not "whatever the stage template
   * contains". Only the TABLES are listed; the labels come from
   * ACTIVITY_NAME_TABLE_MAP (see activityNameForTable).
   */
  private static readonly ISG_FUNNEL_ACTIVITY_TABLES: string[] = [
    OPPORTUNITY_ACTIVITY.BROKING_SLIP,
    OPPORTUNITY_ACTIVITY.QUOTE_COMPARISON_REPORT,
    OPPORTUNITY_ACTIVITY.PLACEMENT_SLIP,
    OPPORTUNITY_ACTIVITY.HELD_COVER_NOTE,
    OPPORTUNITY_ACTIVITY.POLICY_HARD_COPY,
    OPPORTUNITY_ACTIVITY.POLICY_CONFIRMATION,
  ];

  private static activityNameForTable(table: string): string {
    return (
      Object.keys(ACTIVITY_NAME_TABLE_MAP).find(
        (name) =>
          ACTIVITY_NAME_TABLE_MAP[name as keyof typeof ACTIVITY_NAME_TABLE_MAP] ===
          table
      ) ?? table
    );
  }

  private static readonly ISG_FUNNEL_STAGES: {
    stageName: string;
    table: string | null;
  }[] = [
    { stageName: ACTIVITY_NAME.ISG_PLANNING, table: null },
    ...OpportunityRepository.ISG_FUNNEL_ACTIVITY_TABLES.map((table) => ({
      stageName: OpportunityRepository.activityNameForTable(table),
      table,
    })),
  ];

  async getActivityBrokerageSummary(
    userIds: number[],
    from: Date | undefined,
    to: Date | undefined,
    type: "SO" | "RO" | "PLACEMENT" = "SO",
    isLeadership = false,
    organisationId: any,
    sbuId: any,
    verticalId: any,
    departmentId: any,
    branchId: any,
    currentUserId: any,
    insurerId?: number,
    fromDashboard?: boolean,
  ) {
    try {
      type = type ?? "SO";
      // PLACEMENT is a view, not a type: both SO and RO are in scope, so there is
      // no single type lid to resolve (spec §12.3-A).
      const isPlacement = type === "PLACEMENT";
      const soRoType = isPlacement ? "SO" : (type as "SO" | "RO");
      const soTypeLid = isPlacement
        ? (
            await this.lookUpRepository.findOne({
              where: { lookUpKey: OPPORTUNITY_TYPE.SO },
            })
          )?.id
        : undefined;
      const opportunityTypeLid = isPlacement
        ? undefined
        : (
            await this.lookUpRepository.findOne({
              where: { lookUpKey: OPPORTUNITY_TYPE[soRoType] },
            })
          )?.id;

      if (!isPlacement && !opportunityTypeLid) {
        throw new NotFoundException(
          `Lookup with key ${OPPORTUNITY_TYPE[soRoType]} not found.`
        );
      }
      // Fetch all required opportunity statuses
      const opportunityStatus = await this.lookUpRepository.find({
        where: { lookUpName: "OPPORTUNITY_STATUS" },
      });
      const getLookUpIdByKey = (key: string): number | undefined => {
        return opportunityStatus.find((item) => item.lookUpKey === key)?.id;
      };

      // Define all stages and their corresponding table names
      let results: any[] = [];
      // Placement funnel: ISG Planning plus the six placement milestones (see
      // ISG_FUNNEL_STAGES). These are named identically in ACTIVITY_NAME and
      // RO_ACTIVITY_NAME, so one label set serves the combined SO+RO view.
      const stages = isPlacement
        ? OpportunityRepository.ISG_FUNNEL_STAGES
        : [
        { stageName: type, table: null },
        {
          stageName:
            type === RENEWAL_OPPORTUNITY
              ? RO_ACTIVITY_NAME.DATA_VALIDATION
              : ACTIVITY_NAME.DATA_VALIDATION,
          table: OPPORTUNITY_ACTIVITY.DATA_VALIDATION,
        },
        {
          stageName:
            type === RENEWAL_OPPORTUNITY
              ? RO_ACTIVITY_NAME.KDM_MEETING
              : ACTIVITY_NAME.KDM_MEETING,
          table: OPPORTUNITY_ACTIVITY.KDM_MEETING,
        },
        {
          stageName:
            type === RENEWAL_OPPORTUNITY
              ? RO_ACTIVITY_NAME.BROKING_SLIP_GENERATION
              : ACTIVITY_NAME.BROKING_SLIP_GENERATION,
          table: OPPORTUNITY_ACTIVITY.BROKING_SLIP,
        },
        {
          stageName:
            type === RENEWAL_OPPORTUNITY
              ? RO_ACTIVITY_NAME.QCR_GENERATION
              : ACTIVITY_NAME.QCR_GENERATION,
          table: OPPORTUNITY_ACTIVITY.QUOTE_COMPARISON_REPORT,
        },
        {
          stageName:
            type === RENEWAL_OPPORTUNITY
              ? RO_ACTIVITY_NAME.PLACEMENT_SLIP_GENERATION
              : ACTIVITY_NAME.PLACEMENT_SLIP_GENERATION,
          table: OPPORTUNITY_ACTIVITY.PLACEMENT_SLIP,
        },
      ];
        const enabledForPerformanceLookup = await this.lookUpRepository.findOne({
          where: { lookUpKey: TOGGLE_TYPE.TOGGLE_TYPE_YES },
        });
        // Period is scoped on policy expiry date, widened by the same +-5 day buffer
        // the opportunities listing uses, so funnel counts line up with the listing.
        const fromExpiry = new Date(from as Date);
        fromExpiry.setDate(fromExpiry.getDate() - EXPIRY_BUFFER_DAYS);
        const toExpiry = new Date(to as Date);
        toExpiry.setDate(toExpiry.getDate() + EXPIRY_BUFFER_DAYS);

        // Build base query
        const baseQuery = this.opportunityRepository
          .createQueryBuilder("opportunity")
          .leftJoin("opportunity.opportunityActivityMap", "activity")
          .leftJoin(
            "OpportunityLost",
            "lost",
            "lost.opportunityId = opportunity.opportunityId"
          )
          .select([
            "opportunity.opportunityId as opportunityId",
            "opportunity.estimatedBrokerage as estimatedBrokerage",
            "opportunity.premiumPaid as premiumPaid",
          ]);

        if (isPlacement) {
          // Both types are in scope; an RO still needs a linked policy to be
          // real pipeline, an SO never does (spec §12.3-A).
          baseQuery.where(
            new Brackets((qb) => {
              qb.where("opportunity.opportunityTypeLid = :soTypeLid", {
                soTypeLid,
              }).orWhere("opportunity.refPolicyId IS NOT NULL");
            })
          );
          // "Reached ISG Planning" — the one shared definition, stage-based and
          // deliberately independent of the viewer's role so leadership sees the
          // same population as ISG (spec §12.2).
          const isgGate = await this.buildActivityRoleStageGate(
            null,
            true,
            undefined,
            "opportunity"
          );
          if (isgGate) {
            baseQuery.andWhere(isgGate);
          }
        } else {
          baseQuery.where("opportunity.opportunityTypeLid = :opportunityTypeLid", {
            opportunityTypeLid,
          });
        }

        if (organisationId !== undefined && organisationId !== null) {
            if (Array.isArray(organisationId)) {
              if (organisationId.length > 0) {
                baseQuery.andWhere(
                  "opportunity.organisationId IN (:...organisationIds)",
                  { organisationIds: organisationId }
                );
              }
            } else {
              baseQuery.andWhere("opportunity.organisationId = :organisationId", {
                organisationId,
              });
            }
        }
        if (sbuId !== undefined && sbuId !== null) {
          if (Array.isArray(sbuId)) {
            if (sbuId.length > 0) {
              baseQuery.andWhere("opportunity.sbuId IN (:...sbuIds)", {
                sbuIds: sbuId,
              });
            }
          } else {
            baseQuery.andWhere("opportunity.sbuId = :sbuId", { sbuId });
          }
        }
        if (verticalId !== undefined && verticalId !== null) {
          if (Array.isArray(verticalId)) {
            if (verticalId.length > 0) {
              baseQuery.andWhere("opportunity.verticalId IN (:...verticalIds)", {
                verticalIds: verticalId,
              });
            }
          } else {
            baseQuery.andWhere("opportunity.verticalId = :verticalId", {
              verticalId,
            });
          }
        }
        if (branchId !== undefined && branchId !== null) {
          if (Array.isArray(branchId)) {
            if (branchId.length > 0) {
              baseQuery.andWhere("opportunity.branchId IN (:...branchIds)", {
                branchIds: branchId,
              });
            }
          } else {
            baseQuery.andWhere("opportunity.branchId = :branchId", { branchId });
          }
        }

        if (!isLeadership && userIds.length > 0) {
          baseQuery.andWhere(
            buildOpportunityInvolvementScope(userIds, "opportunity")
          );
        }

        // Same rule as buildFunnelStageQuery: expiry window only (no carry-forward
        // of pre-window expiries) and lost/closed hidden, so the funnel count
        // equals the opportunities listing count for the same filters.
        baseQuery.andWhere(
          "opportunity.expiryDate BETWEEN :fromExpiry AND :toExpiry",
          { fromExpiry, toExpiry }
        );
        const hiddenStatusIds = [
          getLookUpIdByKey(OPPORTUNITY_STATUS_LOST),
          getLookUpIdByKey(OPPORTUNITY_STATUS_AUTO_CLOSE),
          getLookUpIdByKey(OPPORTUNITY_STATUS_CLOSE),
        ].filter((id) => id != null);
        if (hiddenStatusIds.length > 0) {
          baseQuery.andWhere(
            "(opportunity.statusLid IS NULL OR opportunity.statusLid NOT IN (:...hiddenStatusIds))",
            { hiddenStatusIds }
          );
        }

        // Apply insurer filter via placement slip insurer map (subquery)
        if (insurerId) {
          baseQuery.andWhere(
            `opportunity.opportunityId IN (
              SELECT oam.opportunity_id
              FROM opportunity_activity_map oam
              INNER JOIN opportunity_placement_slip_generation opsg
                ON opsg.opportunity_activity_id = oam.id
              INNER JOIN opportunity_placement_slip_insurer_map opsim
                ON opsim.placement_slip_id = opsg.id
              WHERE opsim.insurer_id = :insurerId
            )`,
            { insurerId }
          );
        }

        // Business-performance funnel: only performance-enabled opps (RO also needs
        // a linked policy) — mirrors the listing's performanceCondition.
        if (enabledForPerformanceLookup?.id != null) {
          baseQuery.andWhere(
            "opportunity.enabledForPerformanceLid = :perfLid",
            { perfLid: enabledForPerformanceLookup.id }
          );
        }
        if (type === "RO") {
          baseQuery.andWhere("opportunity.refPolicyId IS NOT NULL");
        }

        // Run all stage queries in parallel
        const queries = stages.map((stage) => {
          const query = baseQuery.clone();
          if (stage.table) {
            query
              .andWhere("activity.opportunityTable = :table", {
                table: stage.table,
              })
              .andWhere("activity.completedAt BETWEEN :from AND :to", {
                from,
                to,
              });
          }
          return query.getRawMany();
        });

        results = await Promise.all(queries);
      if (results.length === 0) {
        const salesFunnelData = stages.map((stage) => ({
          stageName: stage.stageName,
          soCount: 0,
          estimatedBrokerage: 0,
          premium: null,
          target: null,
        }));
        return salesFunnelData;
      } else {
        const salesFunnelData = results.map((data, index) => {
          // When insurer filter is applied AND coming from dashboard, only show data for placement slip stage
          // All other stages should show 0 since insurer selection happens at placement stage
          if (insurerId && fromDashboard && stages[index].table !== OPPORTUNITY_ACTIVITY.PLACEMENT_SLIP) {
            return {
              stageName: stages[index].stageName,
              soCount: 0,
              estimatedBrokerage: 0,
              premium: null,
              target: null,
            };
          }

          const uniqueIds = new Set<number>();
          let estimatedBrokerage = 0;
          let premium = 0;
          let hasPremiumValue = false;
          for (const row of data) {
            const id =
              typeof row.opportunityid === "string"
                ? Number(row.opportunityid)
                : row.opportunityid;
            if (!uniqueIds.has(id)) {
              uniqueIds.add(id);
              estimatedBrokerage += Number(row.estimatedbrokerage) || 0;
              if (row.premiumpaid !== null && row.premiumpaid !== undefined) {
                hasPremiumValue = true;
                premium += Number(row.premiumpaid) || 0;
              }
            }
          }
          return {
            stageName: stages[index].stageName,
            soCount: uniqueIds.size,
            estimatedBrokerage,
            premium: hasPremiumValue ? premium : null,
            target: null,
          };
        });
        return salesFunnelData ?? [];
      }
    } catch (error) {
      console.error("Error in getActivityBrokerageSummary:", error);
      throw new BadRequestException(
        `Failed to fetch activity brokerage summary: ${error.message}`
      );
    }
  }

  async getEstimatedBrokerageByQuarter(
    userIds: number[],
    financialYear: number,
    type?: "SO" | "RO",
    excludeWonLost = false,
    quarter?: string,
    month?: string,
    organisationId?: number,
    sbuId?: number,
    // Vertical and branch are multiselect filters: a single id or a list.
    verticalId?: number | number[],
    departmentId?: number,
    branchId?: number | number[],
    currentUserId?: number
  ) {
    try {
      let opportunityTypeLid: number | undefined;
      if (type) {
        opportunityTypeLid = (
          await this.lookUpRepository.findOne({
            where: { lookUpKey: OPPORTUNITY_TYPE[type] },
          })
        )?.id;

        if (!opportunityTypeLid) {
          throw new NotFoundException(
            `Lookup with key ${OPPORTUNITY_TYPE[type]} not found.`
          );
        }
      }

      const { start, end } = getDateRange(
        month ? month : quarter,
        financialYear
      );
      const startDate = start && start.toISOString().split("T")[0];
      const endDate = end && end.toISOString().split("T")[0];

      const qb = this.opportunityRepository
        .createQueryBuilder("opportunity")
        .select("EXTRACT(MONTH FROM opportunity.expiry_date)", "month")
        .addSelect(
          "SUM(COALESCE(opportunity.estimatedBrokerage, 0))",
          "estimatedBrokerage"
        )
        .where(
          `( ${userIds?.length ? "opportunity.createdBy IN (:...userIds) OR " : ""}"opportunity"."id" IN (
            WITH user_results AS (
              SELECT DISTINCT user_id
              FROM employee_hierarchy
              WHERE (true = true AND reporting_user_id = ${currentUserId})
              UNION
              SELECT ${currentUserId} AS user_id
              WHERE ${currentUserId} IS NOT NULL
          ),
          scope_users AS (
              SELECT  ${currentUserId} AS user_id
              UNION
              SELECT ur.user_id
              FROM user_results ur
              WHERE true = true
          ),
          opportunity_results AS (
              SELECT DISTINCT opportunity_id
              FROM opportunity_activity_participants
              WHERE participant_id IN (SELECT user_id FROM scope_users)
              UNION
              SELECT DISTINCT opportunity_id
              FROM opportunity_activity_map
              WHERE owner_id IN (SELECT user_id FROM scope_users)
              UNION
              SELECT DISTINCT opportunity_id
              FROM task
              WHERE assignee_id IN (SELECT user_id FROM scope_users)
          )
          SELECT DISTINCT opportunity_id
          FROM opportunity_results
          ORDER BY opportunity_id ))`,
          { userIds }
        )
        .andWhere("opportunity.expiry_date BETWEEN :startDate AND :endDate", {
          startDate,
          endDate,
        });

      if (opportunityTypeLid) {
        qb.andWhere("opportunity.opportunityTypeLid = :opportunityTypeLid", {
          opportunityTypeLid,
        });
      }

      if (excludeWonLost) {
        const statuses = await this.lookUpRepository.find({
          where: {
            lookUpKey: In([OPPORTUNITY_STATUS_WON, OPPORTUNITY_STATUS_LOST]),
          },
        });
        const statusLids = statuses.map((status) => status.id);
        if (statusLids.length) {
          qb.andWhere("opportunity.statusLid NOT IN (:...statusLids)", {
            statusLids,
          });
        }
        if (organisationId) {
          qb.andWhere("opportunity.organisationId = :organisationId", {
            organisationId,
          });
        }
        if (sbuId) {
          qb.andWhere("opportunity.sbuId = :sbuId", { sbuId });
        }
        if (verticalId) {
          // Vertical is a multiselect filter — one id or a list.
          const verticalIds = Array.isArray(verticalId)
            ? verticalId
            : [verticalId];
          if (verticalIds.length) {
            qb.andWhere("opportunity.verticalId IN (:...verticalIds)", {
              verticalIds,
            });
          }
        }
        if (departmentId) {
          qb.andWhere("opportunity.departmentId = :departmentId", { departmentId });
        }
        if (branchId) {
          // Branch is a multiselect filter — one id or a list.
          const branchIds = Array.isArray(branchId) ? branchId : [branchId];
          if (branchIds.length) {
            qb.andWhere("opportunity.branchId IN (:...branchIds)", {
              branchIds,
            });
          }
        }
      }

      const rawData = await qb.groupBy("month").getRawMany();

      const months = MONTHS_IN_YEAR_WITH_INDEX;

      const result: Record<string, number> = {};

      months.forEach((m, idx) => {
        result[m.name] = 0;
        if ((idx + 1) % 3 === 0) {
          result[`Q${(idx + 1) / 3}`] = 0;
        }
      });

      rawData.forEach((row) => {
        const monthNum = parseInt(row.month, 10);
        const monthName = months.find((m) => m.index === monthNum)?.name;
        if (monthName) {
          result[monthName] = Number(row.estimatedBrokerage) || 0;
        }
      });

      result[MONTHS_WITH_QUARTERS_ENUM.Q1] =
        result[MONTHS_WITH_QUARTERS_ENUM.APRIL] +
        result[MONTHS_WITH_QUARTERS_ENUM.MAY] +
        result[MONTHS_WITH_QUARTERS_ENUM.JUNE];
      result[MONTHS_WITH_QUARTERS_ENUM.Q2] =
        result[MONTHS_WITH_QUARTERS_ENUM.JULY] +
        result[MONTHS_WITH_QUARTERS_ENUM.AUGUST] +
        result[MONTHS_WITH_QUARTERS_ENUM.SEPTEMBER];
      result[MONTHS_WITH_QUARTERS_ENUM.Q3] =
        result[MONTHS_WITH_QUARTERS_ENUM.OCTOBER] +
        result[MONTHS_WITH_QUARTERS_ENUM.NOVEMBER] +
        result[MONTHS_WITH_QUARTERS_ENUM.DECEMBER];
      result[MONTHS_WITH_QUARTERS_ENUM.Q4] =
        result[MONTHS_WITH_QUARTERS_ENUM.JANUARY] +
        result[MONTHS_WITH_QUARTERS_ENUM.FEBRUARY] +
        result[MONTHS_WITH_QUARTERS_ENUM.MARCH];

      const targetResult: Record<string, number> = {};

      if (!excludeWonLost) {
        const entityType = type ? BUSINESS_TARGET_ENTITY_TYPE[type] : undefined;

        const targetRawData = await this.businessTargetRepository
          .createQueryBuilder("businessTarget")
          .select("EXTRACT(MONTH FROM businessTarget.month)", "month")
          .addSelect("SUM(businessTarget.valueOfTarget)", "totalTarget")
          .where(
            userIds?.length ? "businessTarget.userId IN (:...userIds)" : "1=0",
            { userIds }
          )
          .andWhere("businessTarget.month BETWEEN :start AND :end", {
            start,
            end,
          })
          .andWhere("businessTarget.entityType = :entityType", { entityType })
          .groupBy("month")
          .getRawMany();

        months.forEach((m, idx) => {
          targetResult[m.name] = 0;
          if ((idx + 1) % 3 === 0) {
            targetResult[`Q${(idx + 1) / 3}`] = 0;
          }
        });

        targetRawData.forEach((row) => {
          const monthNum = parseInt(row.month, 10);
          const monthName = months.find((m) => m.index === monthNum)?.name;
          if (monthName) {
            targetResult[monthName] = Number(row.totalTarget) || 0;
          }
        });

        targetResult[MONTHS_WITH_QUARTERS_ENUM.Q1] =
          targetResult[MONTHS_WITH_QUARTERS_ENUM.APRIL] +
          targetResult[MONTHS_WITH_QUARTERS_ENUM.MAY] +
          targetResult[MONTHS_WITH_QUARTERS_ENUM.JUNE];
        targetResult[MONTHS_WITH_QUARTERS_ENUM.Q2] =
          targetResult[MONTHS_WITH_QUARTERS_ENUM.JULY] +
          targetResult[MONTHS_WITH_QUARTERS_ENUM.AUGUST] +
          targetResult[MONTHS_WITH_QUARTERS_ENUM.SEPTEMBER];
        targetResult[MONTHS_WITH_QUARTERS_ENUM.Q3] =
          targetResult[MONTHS_WITH_QUARTERS_ENUM.OCTOBER] +
          targetResult[MONTHS_WITH_QUARTERS_ENUM.NOVEMBER] +
          targetResult[MONTHS_WITH_QUARTERS_ENUM.DECEMBER];
        targetResult[MONTHS_WITH_QUARTERS_ENUM.Q4] =
          targetResult[MONTHS_WITH_QUARTERS_ENUM.JANUARY] +
          targetResult[MONTHS_WITH_QUARTERS_ENUM.FEBRUARY] +
          targetResult[MONTHS_WITH_QUARTERS_ENUM.MARCH];
      }

      return { data: result, targets: targetResult };
    } catch (error) {
      console.error("Error in getEstimatedBrokerageByQuarter:", error);
      throw new BadRequestException(
        `Failed to fetch estimated brokerage summary: ${error.message}`
      );
    }
  }

  async getTasksByOpportunityActivityId(
    activityId: number,
    taskTypeLid?: number
  ) {
    try {
      const tasks = await this.taskRepository.find({
        where: {
          activityId,
          taskTypeLid: taskTypeLid ? taskTypeLid : undefined,
        },
        order: { createdAt: "DESC" },
        relations: ["assignee", "priority", "company"], // Ensure relations are properly loaded
      });

      const transformedTasks = tasks.map((task: Task) => {
        const { date, time } = extractDateAndTime(
          convertUtcToIst(task.updatedAt)
        );
        return {
          id: task.id,
          taskName: task.taskName,
          description: task.description,
          dueDate: task.dueDate,
          priority: {
            id: task.priority?.id,
            lookUpValue: task.priority?.lookUpValue,
          },
          company: {
            id: task.company?.id,
            name: task.company?.companyName,
          },
          assignee: {
            id: task.assignee?.userId,
            name: task.assignee?.firstName,
          },
          status: task.taskClose
            ? {
                closedDate: task.updatedAt ? date : null,
                closedTime: task.updatedAt ? time : null,
              }
            : null,
          updatedBy: task.updatedBy,
        };
      });

      return transformedTasks;
    } catch (error) {
      throw new Error(
        "Error fetching tasks by opportunity and activity: " + error.message
      );
    }
  }

  async getActivityApproverDetails(opportunityActivityId: number) {
    try {
      const taskTypeApproval = (
        await this.lookUpRepository.findOne({
          where: { lookUpKey: TASK_TYPE.APPROVAL },
        })
      )?.id;
      const tasks = await this.getTasksByOpportunityActivityId(
        opportunityActivityId,
        taskTypeApproval
      );
      const task = tasks && tasks[0] ? tasks[0] : null;
      if (task) {
        const approverId = task.status ? task.updatedBy : task.assignee.id;
        const approver = await this.userRepository.findOne({
          where: { userId: approverId },
        });
        if (approver) {
          return {
            id: approver.userId,
            name: approver.firstName,
            status: {
              approvedOn: task.status?.closedDate
                ? task.status.closedDate
                : null,
              approvedTime: task.status?.closedTime
                ? task.status.closedTime
                : null,
            },
          };
        }
      }
      return null;
    } catch (error) {
      throw new BadRequestException(
        `Failed to fetch approval task details: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  async updateOpportunityExpiry(
    entityManager: EntityManager,
    opportunityId: number,
    newExpiryDate: string,
    userId: number
  ) {
    try {
      const opportunity = await entityManager.findOne(Opportunity, {
        where: { opportunityId },
      });
      if (!opportunity) {
        throw new NotFoundException(
          errorMessages.opportunityWithIdNotFound(opportunityId)
        );
      }
      const updateData = {
        expiryDate: newExpiryDate,
        updatedBy: userId,
        updatedAt: new Date(),
      };

      const lostStatusLid = await entityManager.findOne(LookUp, {
        where: { lookUpKey: OPPORTUNITY_STATUS_LOST },
      });
      if (lostStatusLid && opportunity.statusLid === lostStatusLid.id) {
        let status;
        const opportunityDetails = await entityManager.findOne(
          OpportunityActivityMap,
          {
            where: {
              opportunityId,
              opportunityTable: OPPORTUNITY_ACTIVITY.KDM_MEETING,
            },
            select: ["statusLid"],
          }
        );
        if (opportunityDetails) {
          const activityStatus = await entityManager.findOne(LookUp, {
            where: { id: opportunityDetails.statusLid },
          });
          if (
            [
              OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED,
              OPPORTUNITY_ACTIVITY_STATUS.APPROVED,
              OPPORTUNITY_ACTIVITY_STATUS.CLOSED,
            ].includes(activityStatus?.lookUpKey)
          ) {
            status = await entityManager.findOne(LookUp, {
              where: { lookUpKey: OPPORTUNITY_STATUS_WORK_IN_PROGRESS },
            });
          } else {
            status = await entityManager.findOne(LookUp, {
              where: { lookUpKey: OPPORTUNITY_STATUS_OPEN },
            });
          }
        }
        if (status) {
          updateData.statusLid = status.id;
        }
      }
      Object.assign(opportunity, updateData);
      await entityManager.save(Opportunity, opportunity);
      return await entityManager.findOne(Opportunity, {
        where: { opportunityId },
        relations: ["status"],
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

  async getCdAccountDetails(
    entityManager: EntityManager,
    placementSlipCdDetail: OpportunityPlacementSlipCDDetail,
    companyId: number,
    insurerId: number,
    userId: number,
    remarks: string,
    status: string,
    isExistingCdAccount: boolean
  ) {
    if (!isExistingCdAccount) {
      return await entityManager.save("CautionDeposit", {
        cdAccountNumber: placementSlipCdDetail.selectCdAccount
          ? String(placementSlipCdDetail.selectCdAccount)
          : placementSlipCdDetail.accountNumber,
        cdBankName: placementSlipCdDetail.bankName ?? "",
        cdAccountName: placementSlipCdDetail.accountName ?? "",
        companyId: companyId,
        insurerId: insurerId,
        balanceAmount:
          placementSlipCdDetail.chequeAmount !== undefined
            ? Number(placementSlipCdDetail.chequeAmount)
            : placementSlipCdDetail.openBalance !== undefined
            ? Number(placementSlipCdDetail.openBalance)
            : 0,
        cdSafeLimit: placementSlipCdDetail.cdSafeLimit ?? 10,
        remarks: remarks,
        status: status,
        createdBy: userId,
        updatedBy: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      return await entityManager.findOne("CautionDeposit", {
        where: {
          cdAccountName: placementSlipCdDetail.accountName ?? "",
          id: Number(placementSlipCdDetail?.selectCdAccount ?? 0),
        },
      });
    }
  }

  async getEmployeeHierarchyByUserId(
    userId: number,
    parentFlag = false
  ): Promise<any> {
    const joinString = parentFlag
      ? "t.id = h.reporting_user_id"
      : "t.reporting_user_id = h.id";

    const rawSqlString = `
      WITH RECURSIVE HierarchyCTE AS (
        SELECT id, reporting_user_id, first_name, last_name, 0 AS Level,
          organisation_id, sbu_id, vertical_id, department_id, branch_id
        FROM users WHERE id = ${userId}
        
        UNION ALL
        
        SELECT t.id, t.reporting_user_id, t.first_name, t.last_name, h.Level + 1,
          t.organisation_id, t.sbu_id, t.vertical_id, t.department_id, t.branch_id
        FROM users t
        JOIN HierarchyCTE h ON ${joinString}
        AND t.user_type_key IN ('USER_TYPE_IIRM_EMPLOYEE', 'USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE')
      )
      SELECT id, reporting_user_id, first_name, last_name, Level,
        organisation_id, sbu_id, vertical_id, department_id, branch_id
      FROM HierarchyCTE
      ORDER BY Level, id
    `;
    const dataRows = await this.dataSource.query(rawSqlString);
    if (!dataRows || dataRows.length === 0) {
      return null;
    }

    const users: any = [];
    dataRows.forEach((row: any) => {
      users.push({
        userId: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        reportingUserId: row.reporting_user_id,
        level: row.level,
        organisationId: row.organisation_id,
        sbuId: row.sbu_id,
        verticalId: row.vertical_id,
        departmentId: row.department_id,
        branchId: row.branch_id,
      });
    });

    return users;
  }

  async getPendingActivitiesSummary(
    page: number,
    limit: number,
    userId: number,
    users: number[] | undefined,
    sortBy?: string,
    sortOrder: "ASC" | "DESC" = "DESC",
    financialYear?: number,
    timeFilter?: string,
    type?: "SO" | "RO" | "ALL" | "PLACEMENT",
    leadershipFilters?: {
      organisationId?: any[];
      sbuId?: any;
      verticalId?: any;
      departmentId?: any;
      branchId?: any;
    },
    fromDate?: Date,
    toDate?: Date,
    insurerId?: number,
    fromDashboard?: boolean
  ) {
    try {
      const startTime = Date.now();
      
      const trimmedTimeFilter =
        typeof timeFilter === "string" ? timeFilter.trim() : undefined;
      const effectiveTimeFilter =
        trimmedTimeFilter && trimmedTimeFilter.length > 0
          ? trimmedTimeFilter
          : undefined;
      const effectiveFinancialYear =
        typeof financialYear === "number" && !Number.isNaN(financialYear)
          ? financialYear
          : undefined;

      let from: Date | undefined;
      let to: Date | undefined;

      // If from/to dates are provided, use them; otherwise calculate from timeFilter/financialYear
      if (fromDate && toDate) {
        from = fromDate;
        to = toDate;
      } else if (effectiveTimeFilter) {
        const range = getDateRange(effectiveTimeFilter, effectiveFinancialYear);
        from = range.start;
        to = range.end;
      } else if (effectiveFinancialYear !== undefined) {
        const range = getDateRange(undefined, effectiveFinancialYear);
        from = range.start;
        to = range.end;
      }
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const istToday = new Date(Date.now() + IST_OFFSET_MS);
      const istTodayStr = `${istToday.getUTCFullYear()}-${String(
        istToday.getUTCMonth() + 1
      ).padStart(2, "0")}-${String(istToday.getUTCDate()).padStart(2, "0")}`;
      // PLACEMENT is a view, not a type (spec §12): both SO and RO are in scope,
      // so it needs no type lid — but an RO still needs a linked policy, so the
      // SO lid is resolved for the `(SO OR refPolicyId)` rule.
      const isPlacement = type === "PLACEMENT";
      let opportunityTypeLid: number | undefined;
      let placementSoTypeLid: number | undefined;
      if (isPlacement) {
        placementSoTypeLid = (
          await this.lookUpRepository.findOne({
            where: { lookUpKey: OPPORTUNITY_TYPE.SO },
          })
        )?.id;
      } else if (type && type !== "ALL") {
        opportunityTypeLid = (
          await this.lookUpRepository.findOne({
            where: { lookUpKey: OPPORTUNITY_TYPE[type] },
          })
        )?.id;

        if (!opportunityTypeLid) {
          throw new NotFoundException(
            `Lookup with key ${OPPORTUNITY_TYPE[type]} not found.`
          );
        }
      }

      const activeOpportunityStatuses = await this.lookUpRepository.find({
        where: {
          lookUpKey: In([
            OPPORTUNITY_STATUS_DEFAULT,
            OPPORTUNITY_STATUS_OPEN,
            OPPORTUNITY_STATUS_WORK_IN_PROGRESS,
          ]),
        },
      });
      const activeStatusIds = activeOpportunityStatuses
        .map((status) => status.id)
        .filter(
          (statusId): statusId is number =>
            typeof statusId === "number" && !Number.isNaN(statusId)
        );

      if (!activeStatusIds.length) {
        throw new NotFoundException(
          "Active opportunity statuses not configured."
        );
      }

      // Business-performance follow-up: mirror the drilldown listing's filters so
      // the widget counts match. Only performance-enabled opps count (RO also needs
      // a linked policy); non-planning rows additionally get the drill's
      // state:[Active] expiry floor. Planning rows get neither floor nor remap.
      const enabledForPerformanceLookup = await this.lookUpRepository.findOne({
        where: { lookUpKey: TOGGLE_TYPE.TOGGLE_TYPE_YES },
      });
      const enabledForPerformanceLid = enabledForPerformanceLookup?.id;

      const toArray = (value: any): any[] => {
        if (Array.isArray(value)) {
          return value.filter((item) => item !== undefined && item !== null);
        }
        return value !== undefined && value !== null ? [value] : [];
      };
      const organisationIds = toArray(leadershipFilters?.organisationId);
      const sbuIds = toArray(leadershipFilters?.sbuId);
      const verticalIds = toArray(leadershipFilters?.verticalId);
      const departmentIds = toArray(leadershipFilters?.departmentId);
      const branchIds = toArray(leadershipFilters?.branchId);

      const shouldFilterByOwnerHierarchy =
        [
          organisationIds.length,
          sbuIds.length,
          verticalIds.length,
          departmentIds.length,
          branchIds.length,
        ].some((length) => length > 0);

      // All 16 table-backed activities (BD Planning / ISG Planning are synthetic
      // and appended separately below). Names are overridden for RO (roName) and
      // ALL (PENDING_ACTIVITIES_ALL_TYPE_LABELS) further down.
      const activities: {
        name: string;
        table: string;
        activityKey: string | null;
      }[] = [
        {
          name: ACTIVITY_NAME.DATA_VALIDATION,
          table: OPPORTUNITY_ACTIVITY.DATA_VALIDATION,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.KDM_MEETING,
          table: OPPORTUNITY_ACTIVITY.KDM_MEETING,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.MANDATE_DETAILS_ENTRY,
          table: OPPORTUNITY_ACTIVITY.MANDATE_DETAILS_ENTRY,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.RFP_DATA_COLLECTION,
          table: OPPORTUNITY_ACTIVITY.RFP_COVER_DETAIL,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.RFP_DETAILS_ENTRY,
          table: OPPORTUNITY_ACTIVITY.RFP_DETAILS_ENTRY,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.BROKING_SLIP_GENERATION,
          table: OPPORTUNITY_ACTIVITY.BROKING_SLIP,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.ENTER_QUOTE,
          table: OPPORTUNITY_ACTIVITY.QUOTE_ENTRY,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.QCR_GENERATION,
          table: OPPORTUNITY_ACTIVITY.QUOTE_COMPARISON_REPORT,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.MEETING_FOR_FINAL_NEGOTIATION,
          table: OPPORTUNITY_ACTIVITY.FINAL_NEGOTIATION,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.PLACEMENT_SLIP_GENERATION,
          table: OPPORTUNITY_ACTIVITY.PLACEMENT_SLIP,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.PREMIUM_CALCULATION,
          table: OPPORTUNITY_ACTIVITY.PREMIUM_CALCULATION,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.HELD_COVER_NOTE,
          table: OPPORTUNITY_ACTIVITY.HELD_COVER_NOTE,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.POLICY_HARD_COPY_RECEIPT,
          table: OPPORTUNITY_ACTIVITY.POLICY_HARD_COPY,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.POLICY_DOCKET,
          table: OPPORTUNITY_ACTIVITY.POLICY_DOCKET,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.HAND_OVER_MEET,
          table: OPPORTUNITY_ACTIVITY.HAND_OVER_MEET,
          activityKey: null,
        },
        {
          name: ACTIVITY_NAME.POLICY_CONFIRMATION,
          table: OPPORTUNITY_ACTIVITY.POLICY_CONFIRMATION,
          activityKey: null,
        },
      ];

      const activityDetails = await this.activityRepository.find({
        where: {
          opportunityTable: In(activities.map((activity) => activity.table)),
        },
        select: ["id", "name", "opportunityTable", "roName", "activityKey"],
      });

      const activityDetailsMap = new Map(
        activityDetails.map((detail) => [detail.opportunityTable, detail])
      );
      // table -> mstr_activity.id, used to resolve workflow order + owning role.
      const tableToActivityId = new Map<string, number>();

      for (const activity of activities) {
        const detail = activityDetailsMap.get(activity.table);

        activity.activityKey = detail?.activityKey ?? null;
        if (detail?.id !== undefined) {
          tableToActivityId.set(activity.table, detail.id);
        }

        if (type === "RO" && detail?.roName) {
          activity.name = detail.roName;
        } else if (type === "ALL") {
          activity.name = PENDING_ACTIVITIES_ALL_TYPE_LABELS[activity.table] ?? activity.name;
        }
      }

      // Resolve each table-backed activity's owning role (BD vs ISG) and its
      // workflow position from the stage template, so the 18 rows can be ordered
      // the way the stages actually run and ISG Planning can be inserted ahead of
      // the first ISG activity.
      const orderRows = await this.activityRepository
        .createQueryBuilder("activity")
        .innerJoin(
          "mstr_stage_activity_template",
          "template",
          "template.activity_id = activity.id"
        )
        .innerJoin("mstr_stage", "stage", "stage.id = template.stage_id")
        .select("activity.id", "id")
        .addSelect("stage.ref_role_key", "refRoleKey")
        .addSelect("MIN(template.stage_activity_order)", "activityOrder")
        .where("activity.id IN (:...orderActivityIds)", {
          orderActivityIds: Array.from(tableToActivityId.values()),
        })
        .groupBy("activity.id")
        .addGroupBy("stage.ref_role_key")
        .getRawMany<{ id: number; refRoleKey: string; activityOrder: number }>();
      const roleByActivityId = new Map<number, string>();
      const orderByActivityId = new Map<number, number>();
      orderRows.forEach((row) => {
        if (!roleByActivityId.has(row.id)) {
          roleByActivityId.set(row.id, row.refRoleKey);
        }
        const order = Number(row.activityOrder);
        if (
          !orderByActivityId.has(row.id) ||
          order < (orderByActivityId.get(row.id) as number)
        ) {
          orderByActivityId.set(row.id, order);
        }
      });

      type PendingItem = {
        activityName: string;
        activityKey: string | null;
        next30: number;
        next60: number;
        next90: number;
        beyond90: number;
        total: number;
      };

      const itemsMap: Record<string, PendingItem> = {};
      for (const act of activities) {
        itemsMap[act.table] = {
          activityName: act.name,
          activityKey: act.activityKey,
          next30: 0,
          next60: 0,
          next90: 0,
          beyond90: 0,
          total: 0,
        };
      }

      const batchSize = 5000; // Increased from 3000 for fewer DB calls
      let scopePage = 1;
      const processedOpportunityIds = new Set<number>();
      const scopedUserIds = new Set<number>();

      if (typeof userId === "number" && !Number.isNaN(userId)) {
        scopedUserIds.add(userId);
      }

      if (Array.isArray(users)) {
        for (const candidate of users) {
          const numericCandidate = Number(candidate);
          if (!Number.isNaN(numericCandidate)) {
            scopedUserIds.add(numericCandidate);
          }
        }
      }

      const formatSqlValue = (value: unknown): string => {
        if (value === null || value === undefined) {
          return "NULL";
        }

        if (value instanceof Date) {
          return `'${value.toISOString()}'`;
        }

        if (Array.isArray(value)) {
          return `ARRAY[${value
            .map((entry) => formatSqlValue(entry))
            .join(", ")}]`;
        }

        if (typeof value === "number" || typeof value === "boolean") {
          return `${value}`;
        }

        if (typeof value === "bigint") {
          return value.toString();
        }

        if (typeof value === "string") {
          return `'${value.replace(/'/g, "''")}'`;
        }

        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      };

      const collectPendingForOpportunityIds = async (
        ids: number[],
        parameterName: string
      ) => {
        if (!ids.length) {
          return;
        }

        const filteredIds = ids;

        const rankedReferenceDateExpression =
          "COALESCE(ranked.planned_at, ranked.created_at)";
        
        // Aging buckets by activity age (CURRENT_DATE - planned/created date),
        // grouped into 30/60/90/beyond-90-day windows to match the SBU renewal
        // schedule columns. Exclusive ranges: next30 = 0-30d, next60 = 31-60d,
        // next90 = 61-90d, beyond90 = >90d.
        const bucketCaseExpression = `CASE
          WHEN DATE '${istTodayStr}' - DATE(${rankedReferenceDateExpression}) <= 30 THEN 'next30'
          WHEN DATE '${istTodayStr}' - DATE(${rankedReferenceDateExpression}) <= 60 THEN 'next60'
          WHEN DATE '${istTodayStr}' - DATE(${rankedReferenceDateExpression}) <= 90 THEN 'next90'
          ELSE 'beyond90'
        END`;

        if (!filteredIds.length) {
          return;
        }

        const rankedSubquery = this.createPendingActivityFilterSubquery({
          tables: activities.map((a) => a.table),
          dateRange: { from, to },
          selection: "full",
          enforceSequence: true,
        });
        rankedSubquery.andWhere(
          `pending_ranked.opportunity_id = ANY(:${parameterName})`,
          {
            [parameterName]: filteredIds,
          }
        );

        const bucketQuery = this.dataSource
          .createQueryBuilder()
          .select("ranked.opportunity_table", "opportunity_table")
          .addSelect(bucketCaseExpression, "bucket")
          .addSelect("COUNT(*)", "bucketCount")
          .from(`(${rankedSubquery.getQuery()})`, "ranked")
          .setParameters(rankedSubquery.getParameters())
          .innerJoin(
            Opportunity,
            "filteredOpportunity",
            "filteredOpportunity.opportunityId = ranked.opportunity_id"
          )
          .andWhere("filteredOpportunity.statusLid IN (:...activeStatusIds)", {
            activeStatusIds,
          });

        if (enabledForPerformanceLid != null) {
          bucketQuery.andWhere(
            "filteredOpportunity.enabledForPerformanceLid = :perfLid",
            { perfLid: enabledForPerformanceLid }
          );
        }
        // Non-planning rows mirror the drilldown's state:[Active] expiry floor.
        bucketQuery.andWhere(
          `filteredOpportunity.expiryDate >= CURRENT_DATE - INTERVAL '${EXPIRY_BUFFER_DAYS} days'`
        );
        if (type === "RO") {
          bucketQuery.andWhere("filteredOpportunity.refPolicyId IS NOT NULL");
        } else if (isPlacement) {
          bucketQuery.andWhere(
            new Brackets((qb) => {
              qb.where(
                "filteredOpportunity.opportunityTypeLid = :placementSoTypeLid",
                { placementSoTypeLid }
              ).orWhere("filteredOpportunity.refPolicyId IS NOT NULL");
            })
          );
        }

        if (shouldFilterByOwnerHierarchy) {
          bucketQuery.innerJoin(
            User,
            "pendingOwner",
            "pendingOwner.userId = ranked.owner_id"
          );

          const applyOwnerFilter = (
            column: string,
            value: number | number[] | undefined | null,
            parameter: string
          ) => {
            if (value === undefined || value === null) {
              return;
            }

            if (Array.isArray(value)) {
              if (value.length === 0) {
                return;
              }
              bucketQuery.andWhere(
                `pendingOwner.${column} IN (:...${parameter})`,
                {
                  [parameter]: value,
                }
              );
            } else {
              bucketQuery.andWhere(`pendingOwner.${column} = :${parameter}`, {
                [parameter]: value,
              });
            }
          };

          applyOwnerFilter(
            "organisationId",
            leadershipFilters?.organisationId,
            "pendingOwnerOrganisationId"
          );
          applyOwnerFilter(
            "sbuId",
            leadershipFilters?.sbuId,
            "pendingOwnerSbuId"
          );
          applyOwnerFilter(
            "verticalId",
            leadershipFilters?.verticalId,
            "pendingOwnerVerticalId"
          );
          applyOwnerFilter(
            "departmentId",
            leadershipFilters?.departmentId,
            "pendingOwnerDepartmentId"
          );
          applyOwnerFilter(
            "branchId",
            leadershipFilters?.branchId,
            "pendingOwnerBranchId"
          );
        }

        if (opportunityTypeLid) {
          bucketQuery.andWhere(
            "filteredOpportunity.opportunityTypeLid = :opportunityTypeLid",
            { opportunityTypeLid }
          );
        }

        // Add insurer filtering for dashboard consistency
        if (insurerId && fromDashboard) {
          
          // Apply insurer filtering with same logic as main opportunity endpoint
          bucketQuery.andWhere(
            `filteredOpportunity.opportunityId IN (
              SELECT DISTINCT oam_pending.opportunity_id
              FROM opportunity_activity_map oam_pending
              INNER JOIN opportunity_placement_slip_generation opsg_pending
                ON opsg_pending.opportunity_activity_id = oam_pending.id
              INNER JOIN opportunity_placement_slip_insurer_map opsim_pending
                ON opsim_pending.placement_slip_id = opsg_pending.id
              WHERE opsim_pending.insurer_id = :pendingInsurerId
            )`,
            { pendingInsurerId: insurerId }
          );
        } else if (insurerId) {
          
          // Standard insurer filtering (not dashboard specific)
          bucketQuery.andWhere(
            `filteredOpportunity.opportunityId IN (
              SELECT DISTINCT oam_pending.opportunity_id
              FROM opportunity_activity_map oam_pending
              INNER JOIN opportunity_placement_slip_generation opsg_pending
                ON opsg_pending.opportunity_activity_id = oam_pending.id
              INNER JOIN opportunity_placement_slip_insurer_map opsim_pending
                ON opsim_pending.placement_slip_id = opsg_pending.id
              WHERE opsim_pending.insurer_id = :pendingInsurerId
            )`,
            { pendingInsurerId: insurerId }
          );
        }

        bucketQuery
          .groupBy("ranked.opportunity_table")
          .addGroupBy(bucketCaseExpression);

        const [rawSql, parameters] = bucketQuery.getQueryAndParameters();
        let printableSql = rawSql;
        parameters.forEach((param, index) => {
          printableSql = printableSql.split(`$${index + 1}`).join(
            formatSqlValue(param)
          );
        });

        const pendingRows = await bucketQuery.getRawMany();

        for (const row of pendingRows) {
          const activityTable = row.opportunity_table as string;
          const bucket = row.bucket as string;
          const bucketCount = Number(row.bucketCount) || 0;

          if (!bucketCount) {
            continue;
          }

          const item = itemsMap[activityTable];
          if (!item) {
            continue;
          }

          switch (bucket) {
            case "next30":
              item.next30 += bucketCount;
              break;
            case "next60":
              item.next60 += bucketCount;
              break;
            case "next90":
              item.next90 += bucketCount;
              break;
            case "beyond90":
              item.beyond90 += bucketCount;
              break;
            default:
              break;
          }

          item.total += bucketCount;
        }
      };

      const findAdditionalOpportunityIds = async (
        candidateUserIds: number[],
        alreadyProcessed: Set<number>
      ): Promise<number[]> => {
        const normalizedUserIds = candidateUserIds
          .map((candidate) => Number(candidate))
          .filter((candidate) => Number.isFinite(candidate));

        if (!normalizedUserIds.length) {
          return [];
        }

        const opportunityIds = new Set<number>();

        const participantOpportunities =
          await this.opportunityActivityParticipantsRepository
            .createQueryBuilder("participant")
            .select("DISTINCT participant.opportunityId", "opportunityId")
            .where("participant.participantId IN (:...participantIds)", {
              participantIds: normalizedUserIds,
            })
            .getRawMany();

        participantOpportunities.forEach(({ opportunityId }) => {
          const id = Number(opportunityId);
          if (!Number.isNaN(id)) {
            opportunityIds.add(id);
          }
        });

        const activityOwnerOpportunities =
          await this.opportunityActivityMapRepository
            .createQueryBuilder("activityOwner")
            .select("DISTINCT activityOwner.opportunityId", "opportunityId")
            .where("activityOwner.ownerId IN (:...ownerIds)", {
              ownerIds: normalizedUserIds,
            })
            .getRawMany();

        activityOwnerOpportunities.forEach(({ opportunityId }) => {
          const id = Number(opportunityId);
          if (!Number.isNaN(id)) {
            opportunityIds.add(id);
          }
        });

        const taskOpportunities = await this.dataSource
          .getRepository(Task)
          .createQueryBuilder("task")
          .select("DISTINCT task.opportunityId", "opportunityId")
          .where("task.assigneeId IN (:...assigneeIds)", {
            assigneeIds: normalizedUserIds,
          })
          .andWhere("task.deletedAt IS NULL")
          .getRawMany();

        taskOpportunities.forEach(({ opportunityId }) => {
          const id = Number(opportunityId);
          if (!Number.isNaN(id)) {
            opportunityIds.add(id);
          }
        });

        let filteredIds = Array.from(opportunityIds).filter(
          (id) => !alreadyProcessed.has(id)
        );

        if (filteredIds.length) {
          const statusQuery = this.opportunityRepository
            .createQueryBuilder("statusFilteredOpportunity")
            .select("statusFilteredOpportunity.opportunityId", "opportunityId")
            .where("statusFilteredOpportunity.opportunityId = ANY(:ids)", {
              ids: filteredIds,
            })
            .andWhere(
              "statusFilteredOpportunity.statusLid IN (:...activeStatusIds)",
              { activeStatusIds }
            );

          if (opportunityTypeLid) {
            statusQuery.andWhere(
              "statusFilteredOpportunity.opportunityTypeLid = :opportunityTypeLid",
              { opportunityTypeLid }
            );
          }

          const activeOpportunities = await statusQuery.getRawMany();
          const allowedIds = new Set<number>();
          activeOpportunities.forEach(({ opportunityId }) => {
            const id = Number(opportunityId);
            if (!Number.isNaN(id)) {
              allowedIds.add(id);
            }
          });

          filteredIds = filteredIds.filter((id) => allowedIds.has(id));
        }

        return filteredIds;
      };

      while (true) {
        const scopeWhere =
          (Array.isArray(users) && users.length) || opportunityTypeLid
            ? {
                ...(Array.isArray(users) && users.length
                  ? { ownerId: In(users) }
                  : {}),
                ...(opportunityTypeLid ? { opportunityTypeLid } : {}),
                statusLid: In(activeStatusIds),
              }
            : { statusLid: In(activeStatusIds) };

        const { data: opportunityData } =
          await this.scopeService.validateOpportunityScope(
            {
              entity: Opportunity,
              page: scopePage,
              limit: batchSize,
              sort: [
                {
                  field: "opportunityId",
                  order: "ASC",
                },
              ],
              select: ["opportunityId"],
              relations: undefined,
              where: scopeWhere,
            },
            userId,
            "opportunity"
          );

        if (!opportunityData.length) {
          break;
        }

        const opportunityIds: number[] = [];
        for (const opportunity of opportunityData) {
          const id = Number(opportunity.opportunityId);
          if (!processedOpportunityIds.has(id)) {
            processedOpportunityIds.add(id);
            opportunityIds.push(id);
          }
        }

        if (!opportunityIds.length) {
          if (opportunityData.length < batchSize) {
            break;
          }
          scopePage += 1;
          continue;
        }

        await collectPendingForOpportunityIds(opportunityIds, "opportunityIds");

        if (opportunityData.length < batchSize) {
          break;
        }
        scopePage += 1;
      }

      const additionalOpportunityIds = await findAdditionalOpportunityIds(
        Array.from(scopedUserIds),
        processedOpportunityIds
      );

      if (additionalOpportunityIds.length) {
        additionalOpportunityIds.forEach((id) =>
          processedOpportunityIds.add(id)
        );
        await collectPendingForOpportunityIds(
          additionalOpportunityIds,
          "additionalOpportunityIds"
        );
      }

      // ----- Synthetic BD Planning / ISG Planning rows -----
      // These are not activity tables; an opportunity is "pending planning" when
      // it sits in the BD/ISG planning status and has not started any activity
      // (no activity-map row in WIP / SUBMITTED / REJECTED). Bucketed by the
      // opportunity's createdAt age, consistent with the activity reference date.
      const bdPlanningItem: PendingItem = {
        activityName:
          type === "RO" ? RENEWAL_PLANNING_ACTIVITY_NAME : ACTIVITY_NAME.BD_PLANNING,
        activityKey: null,
        next30: 0,
        next60: 0,
        next90: 0,
        beyond90: 0,
        total: 0,
      };
      const isgPlanningItem: PendingItem = {
        activityName: ACTIVITY_NAME.ISG_PLANNING,
        activityKey: null,
        next30: 0,
        next60: 0,
        next90: 0,
        beyond90: 0,
        total: 0,
      };

      const planningStatusLookups = await this.lookUpRepository.find({
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
      const planningIdByKey = (key: string) =>
        planningStatusLookups.find((l) => l.lookUpKey === key)?.id;
      const bdPlanningStatusId = planningIdByKey(OPPORTUNITY_STATUS_BD_PLANNING);
      const isgPlanningStatusId = planningIdByKey(OPPORTUNITY_STATUS_ISG_PLANNING);
      const activeActivityStatusIds = [
        OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS,
        OPPORTUNITY_ACTIVITY_STATUS.SUBMITTED,
        OPPORTUNITY_ACTIVITY_STATUS.REJECTED,
      ]
        .map(planningIdByKey)
        .filter((id): id is number => typeof id === "number");

      const planningStatusIds = [bdPlanningStatusId, isgPlanningStatusId].filter(
        (id): id is number => typeof id === "number"
      );

      const [pendingTy, pendingTm, pendingTd] = istTodayStr
        .split("-")
        .map((n) => Number(n));
      const ageToBucket = (
        refDate: Date | string | null | undefined
      ): "next30" | "next60" | "next90" | "beyond90" => {
        if (!refDate) {
          return "beyond90";
        }
        const ref = new Date(refDate);
        const days = Math.floor(
          (Date.UTC(pendingTy, pendingTm - 1, pendingTd) -
            Date.UTC(
              ref.getUTCFullYear(),
              ref.getUTCMonth(),
              ref.getUTCDate()
            )) /
            86400000
        );
        if (days <= 30) return "next30";
        if (days <= 60) return "next60";
        if (days <= 90) return "next90";
        return "beyond90";
      };

      // When an insurer filter is applied, the activity path restricts to
      // opportunities that have a placement slip for that insurer. Planning-stage
      // opportunities have no placement slip, so they can never match — mirror the
      // activity path by leaving the planning rows at zero.
      if (planningStatusIds.length && !insurerId) {
        // Leadership view filters by owner hierarchy; resolve the allowed owner
        // set once.
        let hierarchyOwnerIds: Set<number> | null = null;
        if (shouldFilterByOwnerHierarchy) {
          const ownerQb = this.dataSource
            .getRepository(User)
            .createQueryBuilder("u")
            .select("u.userId", "userId");
          if (organisationIds.length)
            ownerQb.andWhere("u.organisationId IN (:...orgIds)", {
              orgIds: organisationIds,
            });
          if (sbuIds.length)
            ownerQb.andWhere("u.sbuId IN (:...sbuIds)", { sbuIds });
          if (verticalIds.length)
            ownerQb.andWhere("u.verticalId IN (:...verticalIds)", {
              verticalIds,
            });
          if (departmentIds.length)
            ownerQb.andWhere("u.departmentId IN (:...departmentIds)", {
              departmentIds,
            });
          if (branchIds.length)
            ownerQb.andWhere("u.branchId IN (:...branchIds)", { branchIds });
          const ownerRows = await ownerQb.getRawMany();
          hierarchyOwnerIds = new Set(
            ownerRows.map((r) => Number(r.userId)).filter((id) => !Number.isNaN(id))
          );
        }

        // Resolve the owned-opportunity set the SAME way the activity rows do —
        // by activity owner / participant / task assignee, not only
        // opportunity.ownerId. An opportunity handed to ISG keeps its BD user as
        // opportunity.ownerId, so scoping planning rows by ownerId alone dropped
        // ISG-assigned deals from the ISG user's ISG-Planning count. The
        // opportunity.ownerId dimension is unioned in too, so existing
        // owner-based counts are preserved (additive, never narrower).
        let plannedOwnerScopeIds: number[] | undefined;
        if (Array.isArray(users) && users.length) {
          const scopedUserIds = users
            .map((u) => Number(u))
            .filter((u) => Number.isFinite(u));
          const ownedIds = new Set<number>();
          const collectOwned = (rows: Array<{ opportunityId: any }>) =>
            rows.forEach(({ opportunityId }) => {
              const id = Number(opportunityId);
              if (!Number.isNaN(id)) ownedIds.add(id);
            });
          if (scopedUserIds.length) {
            collectOwned(
              await this.opportunityRepository
                .createQueryBuilder("ownerScope")
                .select("DISTINCT ownerScope.opportunityId", "opportunityId")
                .where("ownerScope.ownerId IN (:...ids)", { ids: scopedUserIds })
                .getRawMany()
            );
            collectOwned(
              await this.opportunityActivityMapRepository
                .createQueryBuilder("activityScope")
                .select("DISTINCT activityScope.opportunityId", "opportunityId")
                .where("activityScope.ownerId IN (:...ids)", { ids: scopedUserIds })
                .getRawMany()
            );
            collectOwned(
              await this.opportunityActivityParticipantsRepository
                .createQueryBuilder("participantScope")
                .select("DISTINCT participantScope.opportunityId", "opportunityId")
                .where("participantScope.participantId IN (:...ids)", {
                  ids: scopedUserIds,
                })
                .getRawMany()
            );
            collectOwned(
              await this.dataSource
                .getRepository(Task)
                .createQueryBuilder("taskScope")
                .select("DISTINCT taskScope.opportunityId", "opportunityId")
                .where("taskScope.assigneeId IN (:...ids)", { ids: scopedUserIds })
                .andWhere("taskScope.deletedAt IS NULL")
                .getRawMany()
            );
          }
          // In([]) is invalid SQL; a -1 sentinel matches nothing (correct empty).
          plannedOwnerScopeIds = ownedIds.size ? Array.from(ownedIds) : [-1];
        }

        let planningPage = 1;
        const processedPlanningIds = new Set<number>();
        while (true) {
          const planningWhere = {
            ...(plannedOwnerScopeIds
              ? { opportunityId: In(plannedOwnerScopeIds) }
              : {}),
            ...(opportunityTypeLid ? { opportunityTypeLid } : {}),
            // Same financial-year / time-filter window the activity path applies
            // (via dateRange), here against the opportunity's createdAt.
            ...(from && to ? { createdAt: Between(from, to) } : {}),
            statusLid: In(planningStatusIds),
            // Performance filter to match the drilldown (planning rows get no
            // state:[Active] floor, so no expiry floor here). RO needs a policy.
            ...(enabledForPerformanceLid != null
              ? { enabledForPerformanceLid }
              : {}),
            ...(type === "RO" ? { refPolicyId: Not(IsNull()) } : {}),
            // PLACEMENT's `(SO OR refPolicyId IS NOT NULL)` rule is NOT applied
            // here: this object goes through fetchEntityList, where an OR would
            // need the array form of `where` and buildWhereCondition's handling
            // of that is not established. Consequence, leadership only (the
            // plannedOwnerScopeIds branch above does apply the rule): an RO with
            // no linked policy sitting in ISG Planning can add 1 to the ISG
            // Planning row. To close it, give this branch the same query-builder
            // treatment as the direct path.
          };

          let planningData: any[];
          if (plannedOwnerScopeIds) {
            // Non-leadership: plannedOwnerScopeIds already encodes the full
            // ownership scope (opportunity owner + activity owner + participant
            // + task assignee). Query directly instead of via
            // validateOpportunityScope — that wrapper re-applies a single-user
            // owner union (scope_users = just the viewer, no team marker on this
            // call) that drops activity-owned planning deals, which is exactly
            // why the ISG user's assigned ISG-Planning opportunities were lost.
            const directQb = this.opportunityRepository
              .createQueryBuilder("plan")
              .select("plan.opportunityId", "opportunityId")
              .addSelect("plan.statusLid", "statusLid")
              .addSelect("plan.createdAt", "createdAt")
              .addSelect("plan.ownerId", "ownerId")
              .where("plan.opportunityId IN (:...planScopeIds)", {
                planScopeIds: plannedOwnerScopeIds,
              })
              .andWhere("plan.statusLid IN (:...planStatusIds)", {
                planStatusIds: planningStatusIds,
              })
              .orderBy("plan.opportunityId", "ASC")
              .offset((planningPage - 1) * batchSize)
              .limit(batchSize);
            if (opportunityTypeLid) {
              directQb.andWhere("plan.opportunityTypeLid = :planTypeLid", {
                planTypeLid: opportunityTypeLid,
              });
            }
            if (enabledForPerformanceLid != null) {
              directQb.andWhere("plan.enabledForPerformanceLid = :planPerfLid", {
                planPerfLid: enabledForPerformanceLid,
              });
            }
            if (from && to) {
              directQb.andWhere("plan.createdAt BETWEEN :planFrom AND :planTo", {
                planFrom: from,
                planTo: to,
              });
            }
            if (type === "RO") {
              directQb.andWhere("plan.refPolicyId IS NOT NULL");
            } else if (isPlacement) {
              directQb.andWhere(
                new Brackets((qb) => {
                  qb.where("plan.opportunityTypeLid = :planSoTypeLid", {
                    planSoTypeLid: placementSoTypeLid,
                  }).orWhere("plan.refPolicyId IS NOT NULL");
                })
              );
            }
            planningData = await directQb.getRawMany();
          } else {
            const scoped = await this.scopeService.validateOpportunityScope(
              {
                entity: Opportunity,
                page: planningPage,
                limit: batchSize,
                sort: [{ field: "opportunityId", order: "ASC" }],
                select: ["opportunityId", "statusLid", "createdAt", "ownerId"],
                relations: undefined,
                where: planningWhere,
                // fetchEntityList strips createdAt via removeUnwantedFields
                // unless this is set; without it every planning row falls into
                // the beyond90 bucket (ageToBucket sees an undefined date).
                preserveCreatedAt: true,
              },
              userId,
              "opportunity"
            );
            planningData = scoped.data;
          }

          if (!planningData.length) {
            break;
          }

          const batchIds: number[] = [];
          const planningById = new Map<number, any>();
          for (const opp of planningData) {
            const id = Number(opp.opportunityId);
            if (Number.isNaN(id) || processedPlanningIds.has(id)) {
              continue;
            }
            if (
              hierarchyOwnerIds &&
              !hierarchyOwnerIds.has(Number(opp.ownerId))
            ) {
              continue;
            }
            processedPlanningIds.add(id);
            batchIds.push(id);
            planningById.set(id, opp);
          }

          if (batchIds.length) {
            const activeRows = activeActivityStatusIds.length
              ? await this.opportunityActivityMapRepository
                  .createQueryBuilder("oam")
                  .select("DISTINCT oam.opportunityId", "opportunityId")
                  .where("oam.opportunityId IN (:...batchIds)", { batchIds })
                  .andWhere("oam.statusLid IN (:...activeActivityStatusIds)", {
                    activeActivityStatusIds,
                  })
                  .getRawMany()
              : [];
            const hasActiveActivity = new Set(
              activeRows.map((r) => Number(r.opportunityId))
            );

            for (const id of batchIds) {
              if (hasActiveActivity.has(id)) {
                continue;
              }
              const opp = planningById.get(id);
              const item =
                Number(opp.statusLid) === bdPlanningStatusId
                  ? bdPlanningItem
                  : isgPlanningItem;
              const bucket = ageToBucket(opp.createdAt);
              item[bucket] += 1;
              item.total += 1;
            }
          }

          if (planningData.length < batchSize) {
            break;
          }
          planningPage += 1;
        }
      }

      // ----- Order the 18 rows in true workflow position -----
      // BD Planning, then BD activities, then ISG Planning, then ISG activities;
      // each group sorted by its stage-template workflow order.
      const orderOf = (table: string): number =>
        orderByActivityId.get(tableToActivityId.get(table) ?? -1) ??
        Number.MAX_SAFE_INTEGER;
      const isIsg = (table: string): boolean =>
        roleByActivityId.get(tableToActivityId.get(table) ?? -1) ===
        ROLE_KEY.ROLE_ISG_EXECUTIVE;
      const byWorkflow = (a: { table: string }, b: { table: string }) =>
        orderOf(a.table) - orderOf(b.table);

      const bdActivityItems = activities
        .filter((a) => !isIsg(a.table))
        .sort(byWorkflow)
        .map((a) => itemsMap[a.table])
        .filter((it): it is PendingItem => it !== undefined);
      const isgActivityItems = activities
        .filter((a) => isIsg(a.table))
        .sort(byWorkflow)
        .map((a) => itemsMap[a.table])
        .filter((it): it is PendingItem => it !== undefined);

      // Role-scope the rows: BD-only viewers get the BD group, ISG-only viewers
      // the ISG group; unrestricted (both/neither read ACL) viewers get both.
      // Summary totals and count are derived from `items`, so they stay
      // consistent with the visible rows.
      const { canViewBD, canViewISG } =
        await this.scopeService.getActivityRoleVisibility(userId);

      // The Placement Follow-Up is a screen, not a role view: it always shows the
      // ISG group, so leadership sees the same rows ISG does (spec §12.3-C). The
      // ISG gate needs no separate clause here — an ISG activity row only exists
      // once ISG work was planned, and the ISG Planning row is derived from the
      // ISG Planning status, which together ARE the gate (§12.2).
      const items: PendingItem[] = isPlacement
        ? [isgPlanningItem, ...isgActivityItems]
        : [
            ...(canViewBD ? [bdPlanningItem, ...bdActivityItems] : []),
            ...(canViewISG ? [isgPlanningItem, ...isgActivityItems] : []),
          ];

      const validSortFields = [
        "activityName",
        "next30",
        "next60",
        "next90",
        "beyond90",
        "total",
      ];

      if (sortBy && validSortFields.includes(sortBy)) {
        const sortField = sortBy as keyof PendingItem;
        items.sort((leftPendingItem, rightPendingItem) => {
          const sortDirection = sortOrder === "ASC" ? 1 : -1;
          const leftValue = leftPendingItem[sortField];
          const rightValue = rightPendingItem[sortField];

          if (typeof leftValue === "string" && typeof rightValue === "string") {
            return sortDirection * leftValue.localeCompare(rightValue);
          }

          return (
            sortDirection * ((leftValue as number) - (rightValue as number))
          );
        });
      }

      const summaryTotals = items.reduce(
        (acc, cur) => {
          acc.next30 += cur.next30;
          acc.next60 += cur.next60;
          acc.next90 += cur.next90;
          acc.beyond90 += cur.beyond90;
          acc.total += cur.total;
          return acc;
        },
        {
          next30: 0,
          next60: 0,
          next90: 0,
          beyond90: 0,
          total: 0,
        }
      );

      const count = items.length;
      const start = (page - 1) * limit;
      const paginated = items.slice(start, start + limit);

      const summaryTotalsWithName = {
        activityName: "Total",
        activityKey: null,
        ...summaryTotals,
      };

      return {
        data: [...paginated],
        summary: [summaryTotalsWithName],
        count,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
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
    search: string,
    page: number,
    limit: number
  ) {
    try {
      const qb = this.opportunityRepository.manager
        .createQueryBuilder(CautionDeposit, "cd")
        .where("cd.companyId = :companyId", { companyId });

      if (search) {
        qb.andWhere(
          "(cd.cdAccountName ILIKE :search OR cd.cdAccountNumber ILIKE :search)",
          { search: `%${search}%` }
        );
      }

      const [data, count] = await qb
        .orderBy("cd.createdAt", "DESC")
        .take(limit)
        .skip((page - 1) * limit)
        .getManyAndCount();

      const normalizedData = data.map(
        ({ createdAt, updatedAt, createdBy, updatedBy, ...cd }) => ({
          ...cd,
          accountBalance: Number(cd.balanceAmount) || 0,
        })
      );

      return { data: normalizedData, count };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch caution deposits by company: ${
          (error as Error).message
        }`
      );
    }
  }

  async updateDocumentStatus(
    entityManager: EntityManager,
    documentIds: number[]
  ) {
    if (documentIds.length === 0) {
      return;
    }
    await entityManager.update(
      FileUpload,
      { id: In(documentIds) },
      { status: "ACTIVE" }
    );
  }

  async updateExistingDocumentsStatus(
    entityManager: EntityManager,
    opportunityActivityId: number,
    documentIds: number[]
  ): Promise<void> {
    // Mark all documents for this opportunityActivityId as INACTIVE
    await entityManager.update(
      FileUpload,
      { opportunityActivityId },
      { status: "INACTIVE" }
    );
    // Mark the provided documentIds as ACTIVE
    if (documentIds && documentIds.length > 0) {
      await entityManager.update(
        FileUpload,
        { id: In(documentIds), opportunityActivityId },
        { status: "ACTIVE" }
      );
    }
  }

  async updateEntityTableMapIds(
    entity: string,
    updateData: any,
    whereCondition: any
  ): Promise<any> {
    try {
      const result = await this.entityService.updateEntityFieldsByWhere(
        entity,
        updateData,
        whereCondition
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  async findAllOpportunitiesIds(
    page: number,
    limit: number,
    searchArray: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    sort: { field: string; order: "ASC" | "DESC" }[],
    userId: number,
    searchBy: string,
    field?: string,
    fromDate?: Date,
    toDate?: Date,
    whereCondition?: any
  ): Promise<{
    data: any[];
    count: number;
  }> {
    try {
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
        "refPolicy",
        "opportunityActivityMap",
        "opportunityContactMap",
        "opportunityContactMap.contact",
      ];
      var dateFilter: any;
      if (fromDate || toDate) {
        dateFilter = {
          field: field ?? "expiryDate",
          from: fromDate,
          to: toDate,
        };
      }
      const { data, count } = await this.scopeService.validateOpportunityScope(
        {
          entity: "Opportunity",
          page,
          limit,
          sort:
            sort.length > 0 ? sort : [{ field: "updatedAt", order: "DESC" }],
          relations: relations,
          where: whereCondition,
          select: undefined,
          searchArray: searchArray.length === 0 ? [] : searchArray,
          userFilter: undefined,
          searchString: searchBy,
          searchOn: opportunitySearchObject,
          dateFilter:
            dateFilter && Object.keys(dateFilter).length > 0
              ? (dateFilter as { field: string; from: Date; to?: Date })
              : undefined,
          period: undefined,
          preserveCreatedAt: true,
          entityIds: undefined,
        },
        userId,
        "opportunity"
      );
      const { data: overallData } =
        await this.scopeService.validateOpportunityScope(
          {
            entity: "Opportunity", // Replace with the actual entity name
            page: 1,
            limit: count,
            sort: [],
            relations: relations,
            where: whereCondition,
            select: ["opportunityId"],
            searchArray: searchArray,
            userFilter: undefined,
            searchString: searchBy,
            searchOn: opportunitySearchObject,
            dateFilter:
              dateFilter && Object.keys(dateFilter).length > 0
                ? (dateFilter as { field: string; from: Date; to: Date })
                : undefined,
            period: undefined,
            preserveCreatedAt: true,
            entityIds: undefined,
            customWhereCondition: undefined,
          },
          userId,
          "opportunity"
        );
      const opportunityIds = overallData.map((x) => x.opportunityId);
      return { data: opportunityIds, count };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "findAllOpportunitiesIds",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getFilteredOpportunityIds(selectedFilters: any, userId: number) {
    try {
      let opportunityPayload: any = {};
      var searchArray: {
        searchBy: string;
        searchValue: string | number | Date | Array<string | number | Date>;
      }[] = [];
      opportunityPayload["page"] = 1;
      opportunityPayload["limit"] = 1;
      opportunityPayload["sort"] = [];
      opportunityPayload["userId"] = userId;
      if (selectedFilters.from && selectedFilters.to) {
        opportunityPayload["from"] = new Date(
          selectedFilters.from
        ).toISOString();
        opportunityPayload["to"] = new Date(selectedFilters.to).toISOString();
      }
      opportunityPayload["field"] = "expiryDate";
      if (
        selectedFilters.companyName23 &&
        selectedFilters.companyName23 !== ""
      ) {
        opportunityPayload["searchBy"] = selectedFilters.companyName23;
      }
      if (selectedFilters.organisationId) {
        searchArray.push({
          searchBy: "organisationId",
          searchValue: [selectedFilters.organisationId.value],
        });
      }
      if (selectedFilters.sbuId) {
        searchArray.push({
          searchBy: "sbuId",
          searchValue: [selectedFilters.sbuId.value],
        });
      }
      if (selectedFilters.verticalId) {
        searchArray.push({
          searchBy: "verticalId",
          searchValue: [selectedFilters.verticalId.value],
        });
      }
      if (selectedFilters.branchId) {
        searchArray.push({
          searchBy: "branchId",
          searchValue: [selectedFilters.branchId.value],
        });
      }
      if (selectedFilters.opportunityPriority) {
        searchArray.push({
          searchBy: "company.priority.lookUpValue",
          searchValue: [selectedFilters.opportunityPriority.value],
        });
      }
      if (selectedFilters.opportunityContact) {
        searchArray.push({
          searchBy: "opportunityContactMap.contact.id",
          searchValue: [selectedFilters.opportunityContact.value],
        });
      }
      if (selectedFilters.opportunityPolicyType) {
        searchArray.push({
          searchBy: "policyType.lookUpValue",
          searchValue: [selectedFilters.opportunityPolicyType.value],
        });
      }
      if (selectedFilters.opportunityIndustrySegment) {
        searchArray.push({
          searchBy: "company.industrySegment.lookUpValue",
          searchValue: [selectedFilters.opportunityIndustrySegment.value],
        });
      }
      if (selectedFilters.activityName) {
        searchArray.push({
          searchBy: "opportunityActivityMap.activityName",
          searchValue: selectedFilters.activityName,
        });
        const workInProgressStatus = await this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS },
        });
        if (!workInProgressStatus) {
          throw new NotFoundException(
            `Lookup with key ${OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS} not found`
          );
        }
        searchArray.push({
          searchBy: "opportunityActivityMap.status_lid",
          searchValue: [workInProgressStatus.id],
        });
      }
      if (selectedFilters.state) {
        const stateValue = mapOpportunityState(
          `state:[${selectedFilters.state.value}]`
        );
        const value = stateValue.split("[")[1].split("]")[0];
        searchArray.push({
          searchBy: "status.lookUpValue",
          searchValue: value.split(","),
        });
      }
      if (selectedFilters.isgManager) {
        searchArray.push({
          searchBy: "isgId",
          searchValue: [selectedFilters.isgManager.value],
        });
      }
      if (searchArray.length > 0) {
        opportunityPayload["searchArray"] = searchArray;
      }
      if (selectedFilters.viewBy && selectedFilters.ownerId) {
        if (selectedFilters.viewBy.value === "manager") {
          searchArray.push({
            searchBy: "owner.userId",
            searchValue: [selectedFilters.ownerId.value],
          });
          searchArray.push({
            searchBy: "viewByTeam",
            searchValue: "manager",
          });
        } else {
          searchArray.push({
            searchBy: "owner.userId",
            searchValue: selectedFilters.userIdsList,
          });
          searchArray.push({
            searchBy: "viewByTeam",
            searchValue: "team",
          });
        }
      }
      if (selectedFilters.type === SALES_OPPORTUNITY) {
        const OpportunitySalesStatus = await this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_TYPE.SO },
        });
        if (!OpportunitySalesStatus) {
          throw new NotFoundException(
            `Lookup with key ${OPPORTUNITY_TYPE.SO} not found`
          );
        }

        opportunityPayload.whereCondition = {
          opportunityTypeLid: OpportunitySalesStatus.id ?? undefined,
        };
      } else {
        const OpportunityRenewalStatus = await this.lookUpRepository.findOne({
          where: { lookUpKey: OPPORTUNITY_TYPE.RO },
        });
        if (!OpportunityRenewalStatus) {
          throw new NotFoundException(
            `Lookup with key ${OPPORTUNITY_TYPE.RO} not found`
          );
        }
        opportunityPayload.whereCondition = {
          opportunityTypeLid: OpportunityRenewalStatus.id ?? undefined,
        };
      }
      const opportunityIds = await this.findAllOpportunitiesIds(
        opportunityPayload.page,
        opportunityPayload.limit,
        opportunityPayload.searchArray,
        opportunityPayload.sort,
        opportunityPayload.userId,
        opportunityPayload.searchBy,
        opportunityPayload.field,
        opportunityPayload.from,
        opportunityPayload.to,
        opportunityPayload.whereCondition
      );
      return opportunityIds.data;
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "getFilteredOpportunityIds",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  async getPreferredInsurers(opportunityId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityRepository",
          method: "getPreferredInsurers",
          messageData: `Fetching preferred insurers for opportunityId: ${opportunityId}`,
        }),
      });

      // Step 1: Check for Broking Slip Generation - PreferredInsurerDetails
      const brokingSlipInsurers = await this.dataSource.manager.find(
        PreferredInsurerDetails,
        {
          where: { opportunityId },
          relations: ["insurer", "location"],
          order: { id: "ASC" },
          select: [
            "id",
            "insurerId",
            "insurerLocationId",
            "insurerBranchId",
            "insurerContactId",
          ],
        }
      );

      if (brokingSlipInsurers && brokingSlipInsurers.length > 0) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "OpportunityRepository",
            method: "getPreferredInsurers",
            messageData: `Found Broking slip preferred insurers for opportunityId: ${opportunityId}`,
          }),
        });
        return brokingSlipInsurers;
      }

      // Step 2: Check for RFP Details Entry
      const rfpInsurerDetails = await this.dataSource.manager.find(
        OpportunityRfpInsurerDetail,
        {
          where: {
            preferenceType: {
              lookUpKey: PREFERENCE_STATUS_PREFERRED,
            },
            opportunityRfpDetailsEntry: {
              opportunityId,
            },
          },
          relations: ["insurerContact", "insurerContact.insurer", "location"],
          order: { id: "ASC" },
          select: [
            "id",
            "insurerId",
            "insurerLocationId",
            "insurerBranchId",
            "insurerContactId",
          ],
        }
      );

      if (rfpInsurerDetails && rfpInsurerDetails.length > 0) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "OpportunityRepository",
            method: "getPreferredInsurers",
            messageData: `Found RFP preferred insurers for opportunityId: ${opportunityId}`,
          }),
        });
        return rfpInsurerDetails;
      }

      // Step 3: Return empty array if nothing found
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityRepository",
          method: "getPreferredInsurers",
          messageData: `No preferred insurers found for opportunityId: ${opportunityId}`,
        }),
      });
      return [];
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "getPreferredInsurers",
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch preferred insurers: ${error.message}`
      );
    }
  }

  async getInsurerDetails(opportunityId: number) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityRepository",
          method: "getInsurerDetails",
          messageData: `Fetching insurer details for opportunityId: ${opportunityId}`,
        }),
      });
      // Step 1: Check for Policy and PolicyInsurerMap
      const policyInsurerMaps = await this.dataSource.manager.find(
        PolicyInsurerMap,
        {
          where: {
            policy: { opportunityId },
          },
          relations: ["insurer"],
          order: { insurerParticipationTypeLid: "ASC" },
          select: [
            "id",
            "insurerId",
            "insurerLocationId",
            "insurerBranchId",
            "insurerContactId",
            "insurerParticipationTypeLid",
            "sharePercentage",
            "shareAmount",
            "brokeragePercentage",
            "brokerageAmount",
            "terrorismSharePercentage",
            "terrorismShareAmount",
            "terrorismBrokeragePercentage",
            "terrorismBrokerageAmount",
            "totalBrokerageAmount",
          ],
        }
      );

      if (policyInsurerMaps && policyInsurerMaps.length > 0) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "OpportunityRepository",
            method: "getInsurerDetails",
            messageData: `Found Policy insurers for opportunityId: ${opportunityId}`,
          }),
        });
        return policyInsurerMaps;
      }

      // Step 2: Check for Final Negotiation Meeting
      const finalNegotiationSharing = await this.dataSource.manager.find(
        OpportunityFinalNegotiationSharingDetail,
        {
          where: {
            finalNegotiation: {
              opportunityId,
            },
          },
          relations: ["insurer"],
          order: { isLeadInsurer: "ASC" },
          select: [
            "id",
            "insurerId",
            "insurerLocationId",
            "insurerBranchId",
            "insurerContactId",
            "isLeadInsurer",
            "sharePercentage",
            "shareAmount",
            "brokeragePercentage",
            "brokerageAmount",
            "terrorismSharePercentage",
            "terrorismShareAmount",
            "terrorismBrokeragePercentage",
            "terrorismBrokerageAmount",
            "totalBrokerageAmount",
          ],
        }
      );

      if (finalNegotiationSharing && finalNegotiationSharing.length > 0) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "OpportunityRepository",
            method: "getInsurerDetails",
            messageData: `Found Final negotiation preferred insurers for opportunityId: ${opportunityId}`,
          }),
        });
        return finalNegotiationSharing;
      }

      // Step 3: Return empty array if nothing found
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityRepository",
          method: "getInsurerDetails",
          messageData: `No insurers found for opportunityId: ${opportunityId}`,
        }),
      });
      return [];
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "getInsurerDetails",
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to fetch insurer details: ${error.message}`
      );
    }
  }

  async saveDeviationInsurerDetails(
    manager: EntityManager,
    entity: string,
    columnName: string,
    columnValue: number,
    insurerDetails: InsurerDetails[],
    userId: number
  ) {
    try {
      // Fetch existing insurer details for this entity
      const existingDetails = await manager.find(entity, {
        where: { [columnName]: columnValue, deletedAt: IsNull() },
      });

      if (!insurerDetails || insurerDetails.length === 0) {
        if (existingDetails.length > 0) {
          const updatedRecords = existingDetails.map((record) => ({
            ...record,
            deletedAt: new Date(),
            updatedBy: userId,
            updatedAt: new Date(),
          }));
          await manager.save(entity, updatedRecords);
        }
        return;
      }

      const existingInsurerIds = existingDetails?.map((d) => d.insurerId) || [];
      const incomingInsurerIds = insurerDetails
        .filter((detail) => detail.insurerId)
        .map((d) => d.insurerId);

      // Determine which to add (new insurer IDs not in existing)
      const detailsToAdd = insurerDetails.filter(
        (d) => d.insurerId && !existingInsurerIds.includes(d.insurerId)
      );

      // Determine which to remove (existing insurer IDs not in incoming)
      const detailsToRemove = existingDetails.filter(
        (d) => !incomingInsurerIds.includes(d.insurerId)
      );

      // Determine which to update (existing insurer IDs that are also in incoming)
      const detailsToUpdate = insurerDetails.filter(
        (d) => d.insurerId && existingInsurerIds.includes(d.insurerId)
      );

      // Add new insurer details
      if (detailsToAdd.length > 0) {
        const recordsToAdd = detailsToAdd.map((detail) =>
          manager.create(entity, {
            [columnName]: columnValue,
            insurerId: detail.insurerId,
            insurerLocationId: detail.insurerLocationId || null,
            insurerBranchId: detail.insurerBranchId || null,
            insurerContactId: detail.insurerContactId || null,
            isLeadInsurer: detail.isLeadInsurer || null,
            sharePercentage: detail.sharePercentage || 0,
            shareAmount: detail.shareAmount || 0,
            brokeragePercentage: detail.brokeragePercentage || 0,
            brokerageAmount: detail.brokerageAmount || 0,
            terrorismSharePercentage: detail.terrorismSharePercentage ?? null,
            terrorismShareAmount: detail.terrorismShareAmount ?? null,
            terrorismBrokeragePercentage:
              detail.terrorismBrokeragePercentage || 0,
            terrorismBrokerageAmount: detail.terrorismBrokerageAmount || 0,
            totalBrokerageAmount: detail.totalBrokerageAmount || 0,
            createdBy: userId,
            updatedBy: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        );

        await manager.save(entity, recordsToAdd);
      }

      // Remove obsolete insurer details (soft delete)
      if (detailsToRemove.length > 0) {
        const updatedRecordsToRemove = detailsToRemove.map((detail) => ({
          ...detail,
          deletedAt: new Date(),
          updatedBy: userId,
          updatedAt: new Date(),
        }));

        await manager.save(entity, updatedRecordsToRemove);
      }

      // Update existing insurer details that have changed
      if (detailsToUpdate.length > 0) {
        const recordsToUpdate = [];

        for (const detail of detailsToUpdate) {
          const existingDetail = existingDetails.find(
            (existing) => existing.insurerId === detail.insurerId
          );

          if (existingDetail) {
            // Check if any fields have actually changed to avoid unnecessary updates
            const hasChanged =
              (detail.insurerLocationId || null) !==
                (existingDetail.insurerLocationId || null) ||
              (detail.insurerBranchId || null) !==
                (existingDetail.insurerBranchId || null) ||
              (detail.insurerContactId || null) !==
                (existingDetail.insurerContactId || null) ||
              (detail.isLeadInsurer || null) !==
                (existingDetail.isLeadInsurer || null) ||
              (detail.sharePercentage || 0) !==
                (existingDetail.sharePercentage || 0) ||
              (detail.shareAmount || 0) !== (existingDetail.shareAmount || 0) ||
              (detail.brokeragePercentage || 0) !==
                (existingDetail.brokeragePercentage || 0) ||
              (detail.brokerageAmount || 0) !==
                (existingDetail.brokerageAmount || 0) ||
              (detail.terrorismSharePercentage || 0) !==
                (existingDetail.terrorismSharePercentage || 0) ||
              (detail.terrorismShareAmount || 0) !==
                (existingDetail.terrorismShareAmount || 0) ||
              (detail.terrorismBrokeragePercentage || 0) !==
                (existingDetail.terrorismBrokeragePercentage || 0) ||
              (detail.terrorismBrokerageAmount || 0) !==
                (existingDetail.terrorismBrokerageAmount || 0) ||
              (detail.totalBrokerageAmount || 0) !==
                (existingDetail.totalBrokerageAmount || 0);

            if (hasChanged) {
              recordsToUpdate.push({
                ...existingDetail,
                insurerLocationId: detail.insurerLocationId || null,
                insurerBranchId: detail.insurerBranchId || null,
                insurerContactId: detail.insurerContactId || null,
                isLeadInsurer: detail.isLeadInsurer || null,
                sharePercentage: detail.sharePercentage || 0,
                shareAmount: detail.shareAmount || 0,
                brokeragePercentage: detail.brokeragePercentage || 0,
                brokerageAmount: detail.brokerageAmount || 0,
                terrorismSharePercentage:
                  detail.terrorismSharePercentage ?? null,
                terrorismShareAmount: detail.terrorismShareAmount ?? null,
                terrorismBrokeragePercentage:
                  detail.terrorismBrokeragePercentage || 0,
                terrorismBrokerageAmount: detail.terrorismBrokerageAmount || 0,
                totalBrokerageAmount: detail.totalBrokerageAmount || 0,
                updatedBy: userId,
                updatedAt: new Date(),
              });
            }
          }
        }

        if (recordsToUpdate.length > 0) {
          await manager.save(entity, recordsToUpdate);
        }
      }
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save insurer details: ${error.message}`
      );
    }
  }

  // Updates PolicyInsurerMap based on provided insurer details in deviations
  async updatePolicyInsurerDetails(
    manager: EntityManager,
    entity: string,
    columnName: string,
    columnValue: number,
    opportunityId: number
  ) {
    try {
      const insurerDetails = await manager.find(entity, {
        where: { [columnName]: columnValue, deletedAt: IsNull() },
      });
      // Find the policy associated with the opportunity
      const policy = await manager.findOne(Policy, {
        where: { opportunityId },
      });

      if (!policy) {
        this.logger.log({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "success",
            location: "OpportunityRepository",
            method: "updatePolicyInsurerDetails",
            messageData: `No policy found for opportunityId: ${opportunityId}`,
          }),
        });
        return;
      }

      // Fetch existing PolicyInsurerMap records for this policy
      const existingPolicyInsurerMaps = await manager.find(PolicyInsurerMap, {
        where: { policyId: policy.id, deletedAt: IsNull() },
      });

      if (!insurerDetails || insurerDetails.length === 0) {
        // If no insurer details provided, soft delete all existing records
        if (existingPolicyInsurerMaps.length > 0) {
          await manager.update(
            PolicyInsurerMap,
            { policyId: policy.id, deletedAt: IsNull() },
            { deletedAt: new Date() }
          );
        }
        return;
      }

      const existingInsurerIds =
        existingPolicyInsurerMaps?.map((d) => d.insurerId) || [];
      const incomingInsurerIds = insurerDetails
        .filter((detail) => detail.insurerId)
        .map((d) => d.insurerId);

      // Determine which to add (new insurer IDs not in existing)
      const detailsToAdd = insurerDetails.filter(
        (d) => d.insurerId && !existingInsurerIds.includes(d.insurerId)
      );

      // Determine which to remove (existing insurer IDs not in incoming)
      const detailsToRemove = existingPolicyInsurerMaps.filter(
        (d) => !incomingInsurerIds.includes(d.insurerId)
      );

      // Determine which to update (existing insurer IDs that are also in incoming)
      const detailsToUpdate = insurerDetails.filter(
        (d) => d.insurerId && existingInsurerIds.includes(d.insurerId)
      );

      // Add new PolicyInsurerMap records
      if (detailsToAdd.length > 0) {
        const newRecords = detailsToAdd.map((detail) =>
          manager.create(PolicyInsurerMap, {
            policyId: policy.id,
            insurerId: detail.insurerId,
            insurerLocationId: detail.insurerLocationId,
            insurerBranchId: detail.insurerBranchId,
            insurerContactId: detail.insurerContactId,
            insurerParticipationTypeLid: detail.isLeadInsurer,
            sharePercentage: detail.sharePercentage,
            shareAmount: detail.shareAmount,
            brokeragePercentage: detail.brokeragePercentage,
            brokerageAmount: detail.brokerageAmount,
            terrorismSharePercentage: detail.terrorismSharePercentage ?? null,
            terrorismShareAmount: detail.terrorismShareAmount ?? null,
            terrorismBrokeragePercentage: detail.terrorismBrokeragePercentage,
            terrorismBrokerageAmount: detail.terrorismBrokerageAmount,
            totalBrokerageAmount: detail.totalBrokerageAmount,
          })
        );
        await manager.save(PolicyInsurerMap, newRecords);
      }

      // Remove obsolete PolicyInsurerMap records (soft delete)
      if (detailsToRemove.length > 0) {
        const idsToRemove = detailsToRemove.map((d) => d.id);
        await manager.update(
          PolicyInsurerMap,
          { id: In(idsToRemove) },
          { deletedAt: new Date() }
        );
      }

      // Update existing PolicyInsurerMap records that have changed
      if (detailsToUpdate.length > 0) {
        for (const incomingDetail of detailsToUpdate) {
          const existingRecord = existingPolicyInsurerMaps.find(
            (existing) => existing.insurerId === incomingDetail.insurerId
          );

          if (existingRecord) {
            // Check if any values have actually changed
            const hasChanged =
              existingRecord.insurerLocationId !==
                (incomingDetail.insurerLocationId || null) ||
              existingRecord.insurerBranchId !==
                (incomingDetail.insurerBranchId || null) ||
              existingRecord.insurerContactId !==
                (incomingDetail.insurerContactId || null) ||
              existingRecord.insurerParticipationTypeLid !==
                (incomingDetail.isLeadInsurer || null) ||
              existingRecord.sharePercentage !==
                (incomingDetail.sharePercentage || null) ||
              existingRecord.shareAmount !==
                (incomingDetail.shareAmount || null) ||
              existingRecord.brokeragePercentage !==
                (incomingDetail.brokeragePercentage || null) ||
              existingRecord.brokerageAmount !==
                (incomingDetail.brokerageAmount || null) ||
              existingRecord.terrorismSharePercentage !==
                (incomingDetail.terrorismSharePercentage || null) ||
              existingRecord.terrorismShareAmount !==
                (incomingDetail.terrorismShareAmount || null) ||
              existingRecord.terrorismBrokeragePercentage !==
                (incomingDetail.terrorismBrokeragePercentage || null) ||
              existingRecord.terrorismBrokerageAmount !==
                (incomingDetail.terrorismBrokerageAmount || null) ||
              existingRecord.totalBrokerageAmount !==
                (incomingDetail.totalBrokerageAmount || null);

            if (hasChanged) {
              await manager.update(
                PolicyInsurerMap,
                { id: existingRecord.id },
                {
                  insurerLocationId: incomingDetail.insurerLocationId,
                  insurerBranchId: incomingDetail.insurerBranchId,
                  insurerContactId: incomingDetail.insurerContactId,
                  insurerParticipationTypeLid: incomingDetail.isLeadInsurer,
                  sharePercentage: incomingDetail.sharePercentage,
                  shareAmount: incomingDetail.shareAmount,
                  brokeragePercentage: incomingDetail.brokeragePercentage,
                  brokerageAmount: incomingDetail.brokerageAmount,
                  terrorismSharePercentage:
                    incomingDetail.terrorismSharePercentage ?? null,
                  terrorismShareAmount:
                    incomingDetail.terrorismShareAmount ?? null,
                  terrorismBrokeragePercentage:
                    incomingDetail.terrorismBrokeragePercentage,
                  terrorismBrokerageAmount:
                    incomingDetail.terrorismBrokerageAmount,
                  totalBrokerageAmount: incomingDetail.totalBrokerageAmount,
                }
              );
            }
          }
        }
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityRepository",
          method: "updatePolicyInsurerDetails",
          messageData: `Successfully updated policy insurer details for opportunityId: ${opportunityId} and policyId: ${policy.id}`,
        }),
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "updatePolicyInsurerDetails",
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
        `Failed to update policy insurer details: ${error.message}`
      );
    }
  }

  async getBdUsersByOpportunityIds(opportunityIds: number[]): Promise<
    {
      userId: number;
      opportunityIds: number[];
      bdOwnerCount: number;
      expiryDateCount: number;
    }[]
  > {
    try {
      const bdOwnerCount = 0,
        expiryDateCount = 0;
      if (!opportunityIds.length) {
        return [];
      }

      const opportunities = await this.opportunityRepository.find({
        where: {
          opportunityId: In(opportunityIds),
        },
        select: ["opportunityId", "ownerId"],
      });
      const userOpportunityMap = new Map<number, number[]>();

      opportunities.forEach((opportunity) => {
        const userId = opportunity.ownerId;
        if (userId) {
          if (!userOpportunityMap.has(userId)) {
            userOpportunityMap.set(userId, []);
          }
          userOpportunityMap.get(userId)!.push(opportunity.opportunityId);
        }
      });

      return Array.from(userOpportunityMap.entries()).map(
        ([userId, opportunityIds]) => ({
          userId,
          opportunityIds,
          bdOwnerCount,
          expiryDateCount,
        })
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "getBdUsersByOpportunityIds",
          messageData: error,
        }),
      });
      throw new Error("Failed to fetch bdUsers by opportunity IDs");
    }
  }

  async getIsgUsersByOpportunityIds(opportunityIds: number[]): Promise<
    {
      userId: number;
      opportunityIds: number[];
      isgOwnerCount: number;
    }[]
  > {
    try {
      const isgOwnerCount = 0;
      if (!opportunityIds.length) {
        return [];
      }

      const opportunities = await this.opportunityRepository.find({
        where: {
          opportunityId: In(opportunityIds),
        },
        select: ["opportunityId", "isgId"],
      });
      const userOpportunityMap = new Map<number, number[]>();

      opportunities.forEach((opportunity) => {
        const userId = opportunity.isgId;
        if (userId) {
          if (!userOpportunityMap.has(userId)) {
            userOpportunityMap.set(userId, []);
          }
          userOpportunityMap.get(userId)!.push(opportunity.opportunityId);
        }
      });

      return Array.from(userOpportunityMap.entries()).map(
        ([userId, opportunityIds]) => ({
          userId,
          opportunityIds,
          isgOwnerCount,
        })
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityRepository",
          method: "getBdUsersByOpportunityIds",
          messageData: error,
        }),
      });
      throw new Error("Failed to fetch bdUsers by opportunity IDs");
    }
  }

  async getOpportunityActivityTasks(
    opportunityActivityId: number,
    page: number,
    limit: number
  ) {
    try {
      const taskLookups = await getLookups(
        this.lookUpRepository,
        [TASK_TYPE.TASK, TASK_STATUS_CLOSED],
        LOOK_UP_FIELD.KEY
      );
      const lookUps = await getLookup(
        taskLookups,
        [TASK_TYPE.TASK, TASK_STATUS_CLOSED],
        LOOK_UP_FIELD.KEY
      );
      const { data, count } = await this.entityService.fetchEntityList(
        Task, // Entity name
        page,
        limit,
        [{ field: "dueDate", order: "ASC" }], // Sort options
        [
          "assignee",
          "priority",
          "taskStatus",
          "company",
          "opportunity",
          "opportunity.policyType",
          "activity",
        ], // Relations to include
        {
          activityId: opportunityActivityId,
          taskTypeLid: lookUps[`lookup_${TASK_TYPE.TASK}`].id,
        }, // Filter by activityId
        undefined, // Select fields
        undefined, // Search array
        undefined, // Search string
        undefined, // Search on fields
        undefined, // Date filter
        undefined, // Period filter
        undefined // Additional conditions
      );

      const isAllTasksCompleted = await this.taskRepository.exists({
        where: {
          activityId: opportunityActivityId,
          taskTypeLid: lookUps[`lookup_${TASK_TYPE.TASK}`].id,
          taskStatusLid: Not(lookUps[`lookup_${TASK_STATUS_CLOSED}`].id),
        },
      });
      if (!data || data.length === 0) {
        return {
          data: [],
          count: 0,
          isAllTasksCompleted: !isAllTasksCompleted,
        };
      }

      return { data, count, isAllTasksCompleted: !isAllTasksCompleted };
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

  async checkInsurerAndBrokerageDetails(
    insurerMaps: InsurerDetails[],
    basicPremium: number,
    policyPlacedTypeLid: number
  ) {
    try {
      if (insurerMaps && insurerMaps.length > 0 && policyPlacedTypeLid) {
        if (basicPremium === undefined || basicPremium === null) {
          return [];
        }

        const checkInsurerTypes = await getLookups(
          this.lookUpRepository,
          [SINGLE_INSURER, MULTIPLE_INSURER],
          LOOK_UP_FIELD.KEY
        );
        const insurerTypeLookups = await getLookup(
          checkInsurerTypes,
          [SINGLE_INSURER, MULTIPLE_INSURER],
          LOOK_UP_FIELD.KEY
        );

        // Find the required lookups by key
        const policyPlacedTypeSingle =
          insurerTypeLookups[`lookup_${SINGLE_INSURER}`];
        const policyPlacedTypeMultiple =
          insurerTypeLookups[`lookup_${MULTIPLE_INSURER}`];
        console.log("policyPlacedTypeSingle", policyPlacedTypeSingle);
        console.log("policyPlacedTypeMultiple", policyPlacedTypeMultiple);
        const optionalCheckFields = [
          "id",
          "placementSlipId",
          "brokeragePercentage",
          "brokerageAmount",
          "terrorismSharePercentage",
          "terrorismShareAmount",
          "terrorismBrokeragePercentage",
          "terrorismBrokerageAmount",
          "totalBrokerageAmount",
        ];
        if (policyPlacedTypeLid === policyPlacedTypeSingle.id) {
          // single insurer
          const insurerKeys = Object.keys(insurerMaps[0]);
          const hasNullValue = insurerKeys.some((key) => {
            if (!optionalCheckFields.includes(key)) {
              const value = insurerMaps[0][key as keyof InsurerDetails];
              return value === null || value === undefined;
            }
          });
          if (hasNullValue) {
            return [];
          }
          return insurerMaps;
        } else if (policyPlacedTypeLid === policyPlacedTypeMultiple.id) {
          // multiple insurer
          const validatedInsurers: InsurerDetails[] = [];

          for (const insurerMap of insurerMaps) {
            const insurerKeys = Object.keys(insurerMap);
            let isCurrentInsurerValid = true;

            for (const key of insurerKeys) {
              if (
                !optionalCheckFields.includes(key) &&
                (insurerMap[key as keyof InsurerDetails] === null ||
                  insurerMap[key as keyof InsurerDetails] === undefined)
              ) {
                isCurrentInsurerValid = false;
                break;
              }
            }

            if (isCurrentInsurerValid) {
              validatedInsurers.push(insurerMap);
            }
          }

          // Return empty array only if no valid insurers found
          if (validatedInsurers.length === 0) {
            return [];
          }

          return validatedInsurers;
        } else {
          return [];
        }
      }
      return insurerMaps;
    } catch (error) {
      throw new BadRequestException(
        `Failed to validate insurer and brokerage details: ${error.message}`
      );
    }
  }

  async updateEnterQuoteActivityToInProgress(
    entityManager: EntityManager,
    opportunityId: number,
    userId: number
  ): Promise<OpportunityActivityMap> {
    try {
      const statusLookups = await getLookups(
        this.lookUpRepository,
        [
          OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS,
          OPPORTUNITY_ACTIVITY_STATUS.OPEN,
        ],
        LOOK_UP_FIELD.KEY
      );
      const statusLookup = await getLookup(
        statusLookups,
        [
          OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS,
          OPPORTUNITY_ACTIVITY_STATUS.OPEN,
        ],
        LOOK_UP_FIELD.KEY
      );

      const inProgressStatusId =
        statusLookup[`lookup_${OPPORTUNITY_ACTIVITY_STATUS.WORK_IN_PROGRESS}`]
          .id;
      const openStatusId =
        statusLookup[`lookup_${OPPORTUNITY_ACTIVITY_STATUS.OPEN}`].id;

      // Find Enter Quote, QCR, and Final Negotiation activities
      const activities = await entityManager.find(OpportunityActivityMap, {
        where: {
          opportunityId,
          activityKey: In([
            ACTIVITY_KEY.QUOTE_ENTRY_ACTIVITY,
            ACTIVITY_KEY.QUOTE_COMPARISON_REPORT_ACTIVITY,
            ACTIVITY_KEY.FINAL_NEGOTIATION_ACTIVITY,
          ]),
        },
      });

      if (!activities || activities.length === 0) {
        throw new NotFoundException(
          `Activities not found for opportunity ${opportunityId}`
        );
      }

      // Find specific activities
      const enterQuoteActivity = activities.find(
        (act) => act.activityKey === ACTIVITY_KEY.QUOTE_ENTRY_ACTIVITY
      );
      const qcrActivity = activities.find(
        (act) =>
          act.activityKey === ACTIVITY_KEY.QUOTE_COMPARISON_REPORT_ACTIVITY
      );
      const finalNegotiationActivity = activities.find(
        (act) => act.activityKey === ACTIVITY_KEY.FINAL_NEGOTIATION_ACTIVITY
      );

      if (!enterQuoteActivity) {
        throw new NotFoundException(
          `Enter Quote activity not found for opportunity ${opportunityId}`
        );
      }

      // Prepare parallel updates using Promise.all
      const updatePromises: Promise<any>[] = [];

      // Helper function to update activity status
      const updateActivityStatus = (
        activity: OpportunityActivityMap,
        newStatusId: number
      ) => {
        activity.statusLid = newStatusId;
        activity.completedAt = null;
        activity.activityStatusKey = null;
        activity.updatedBy = userId;
        activity.updatedAt = new Date();

        return activity;
      };

      // 1. Update Enter Quote Activity Map to In Progress
      if (enterQuoteActivity) {
        const updatedActivity = updateActivityStatus(
          enterQuoteActivity,
          inProgressStatusId
        );

        updatePromises.push(
          entityManager.save(OpportunityActivityMap, updatedActivity)
        );

        // Update OpportunityQuote table to In Progress using OpportunityActivityMap.id
        updatePromises.push(
          entityManager.update(
            OpportunityQuote,
            { opportunityActivityId: enterQuoteActivity.id },
            {
              statusLid: inProgressStatusId,
            }
          )
        );
      }

      // 2. Update QCR Activity Map to Open
      if (qcrActivity) {
        const updatedActivity = updateActivityStatus(qcrActivity, openStatusId);

        updatePromises.push(
          entityManager.save(OpportunityActivityMap, updatedActivity)
        );

        // Update OpportunityQuoteComparisonReport individual table to Open
        updatePromises.push(
          entityManager.update(
            OpportunityQuoteComparisonReport,
            { opportunityActivityId: qcrActivity.id },
            {
              statusLid: openStatusId,
              updatedBy: userId,
              updatedAt: new Date(),
            }
          )
        );
      }

      // 3. Update Final Negotiation Activity Map to Open
      if (finalNegotiationActivity) {
        const updatedActivity = updateActivityStatus(
          finalNegotiationActivity,
          openStatusId
        );

        updatePromises.push(
          entityManager.save(OpportunityActivityMap, updatedActivity)
        );

        // Update OpportunityFinalNegotiation individual table to Open
        updatePromises.push(
          entityManager.update(
            OpportunityFinalNegotiation,
            { opportunityActivityId: finalNegotiationActivity.id },
            {
              statusLid: openStatusId,
              updatedBy: userId,
              updatedAt: new Date(),
            }
          )
        );
      }

      // Execute all updates in parallel
      await Promise.all(updatePromises);

      return enterQuoteActivity;
    } catch (error) {
      throw new BadRequestException(
        `Failed to update Enter Quote activity: ${error.message}`
      );
    }
  }

  // Restricts a query joining org_sbu (aliased `sbu`) to active SBUs only, so
  // opportunities linked to a deactivated SBU are dropped from the schedule
  // tables entirely rather than surfacing under the retired SBU's name.
  private applyActiveSbuFilter<T>(
    qb: SelectQueryBuilder<T>,
    sbuAlias = "sbu"
  ): SelectQueryBuilder<T> {
    return qb.andWhere(
      `${sbuAlias}.statusLid IN (SELECT activeSbuStatus.id FROM lookup_data activeSbuStatus WHERE activeSbuStatus.lookup_key = :sbuActiveStatusKey)`,
      { sbuActiveStatusKey: DEFAULT_ACTIVE_STATUS.MASTER }
    );
  }

  // Adds zero-count rows for every SBU in the org that has no opportunities, so
  // the schedule tables list all SBUs "irrespective of count". Matches SBUs to
  // existing rows by normalised name (same dedup key the count query uses).
  private async appendZeroCountSbus(
    existing: {
      sbuId: number;
      sbuName: string;
      sourceSbuIds: number[];
      policyExpiryTimeline: { label: string; count: number }[];
    }[],
    bucketOrder: string[],
    sbuScopeOrgId?: number,
    sbuIdFilter?: number
  ) {
    if (sbuScopeOrgId === undefined || sbuScopeOrgId === null) return existing;

    const scopeOrg = await this.opportunityRepository.manager.findOne(
      Organisation,
      { where: { id: sbuScopeOrgId }, select: ["id", "organisationKey"] }
    );

    // Holdings owns no OrgSbu rows directly — SBUs belong to its child orgs
    // (India, Sri Lanka, Kenya, Maldives, Saferisk) — so pull across all of them.
    let scopeOrgIds = [sbuScopeOrgId];
    if (scopeOrg?.organisationKey === ORGANISATION_KEYS.HOLDINGS) {
      const childOrgs = await this.opportunityRepository.manager.find(
        Organisation,
        { where: { parentOrganisationId: sbuScopeOrgId }, select: ["id"] }
      );
      scopeOrgIds = childOrgs.map((org) => org.id);
    }

    const sbuQb = this.opportunityRepository.manager
      .createQueryBuilder(OrgSbu, "sbu")
      .select(["sbu.id", "sbu.name"])
      .where("sbu.organisationId IN (:...scopeOrgIds)", {
        scopeOrgIds: scopeOrgIds.length ? scopeOrgIds : [-1],
      });
    this.applyActiveSbuFilter(sbuQb);
    if (sbuIdFilter) {
      sbuQb.andWhere("sbu.id = :sbuIdFilter", { sbuIdFilter });
    }

    const allSbus = await sbuQb.getMany();

    const presentKeys = new Set(
      existing.map((row) => (row.sbuName ?? "").trim().toLowerCase())
    );
    for (const sbu of allSbus) {
      const key = (sbu.name ?? "").trim().toLowerCase();
      if (presentKeys.has(key)) continue;
      presentKeys.add(key);
      existing.push({
        sbuId: sbu.id,
        sbuName: sbu.name,
        sourceSbuIds: [sbu.id],
        policyExpiryTimeline: bucketOrder.map((label) => ({ label, count: 0 })),
      });
    }

    existing.sort((a, b) => (a.sbuName ?? "").localeCompare(b.sbuName ?? ""));
    return existing;
  }

  async getRenewalScheduleBySbu(
    userIds: number[],
    isLeadership: boolean,
    currentUserId?: number,
    options?: {
      organisationId?: number;
      sbuId?: number;
      // Vertical and Branch are multiselect dashboard filters: one id or a list.
      verticalId?: number | number[];
      departmentId?: number;
      branchId?: number | number[];
      from?: Date;
      to?: Date;
      insurerId?: number;
      sbuScopeOrgId?: number;
    }
  ): Promise<{
    sbuId: number;
    sbuName: string;
    sourceSbuIds: number[];
    policyExpiryTimeline: { label: string; count: number }[];
  }[]> {
    const bucketOrder = ["30 Days", "60 Days", "90 Days", "Beyond 90 Days"];

    const roTypeLookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: OPPORTUNITY_TYPE.RO },
    });
    if (!roTypeLookup) {
      return [];
    }

    const enabledLookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: TOGGLE_TYPE.TOGGLE_TYPE_YES },
    });

    // Exclude lost/closed opps — a schedule is upcoming pipeline, and the drilldown
    // listing hides them too (lostExclusionCondition), so this keeps counts aligned.
    const lostStatusLookups = await this.lookUpRepository.find({
      where: {
        lookUpKey: In([
          OPPORTUNITY_STATUS_LOST,
          OPPORTUNITY_STATUS_AUTO_CLOSE,
          OPPORTUNITY_STATUS_CLOSE,
        ]),
      },
    });
    const lostStatusIds = lostStatusLookups.map((l) => l.id);

    const uniqueUserIds = Array.from(
      new Set((userIds ?? []).filter((id): id is number => typeof id === "number" && !Number.isNaN(id)))
    );

    if (!isLeadership && uniqueUserIds.length === 0) {
      return [];
    }

    try {
      const qb = this.opportunityRepository
        .createQueryBuilder("opportunity")
        .leftJoin(OrgSbu, "sbu", "sbu.id = opportunity.sbuId")
        .select("opportunity.sbuId", "sbuId")
        .addSelect("COALESCE(sbu.name, 'Unknown')", "sbuName")
        // Buffered per-band counts (see getSalesScheduleBySbu) so each bucket
        // matches the count on its drilldown listing, which applies the same +-5
        // day expiry buffer. Bands overlap by the buffer; no future-only floor.
        .addSelect(
          `COUNT(*) FILTER (WHERE opportunity.expiryDate BETWEEN CURRENT_DATE - INTERVAL '${EXPIRY_BUFFER_DAYS} days' AND CURRENT_DATE + INTERVAL '${30 + EXPIRY_BUFFER_DAYS} days')`,
          "next30DaysCount"
        )
        .addSelect(
          `COUNT(*) FILTER (WHERE opportunity.expiryDate BETWEEN CURRENT_DATE + INTERVAL '${31 - EXPIRY_BUFFER_DAYS} days' AND CURRENT_DATE + INTERVAL '${60 + EXPIRY_BUFFER_DAYS} days')`,
          "next60DaysCount"
        )
        .addSelect(
          `COUNT(*) FILTER (WHERE opportunity.expiryDate BETWEEN CURRENT_DATE + INTERVAL '${61 - EXPIRY_BUFFER_DAYS} days' AND CURRENT_DATE + INTERVAL '${90 + EXPIRY_BUFFER_DAYS} days')`,
          "next90DaysCount"
        )
        .addSelect(
          `COUNT(*) FILTER (WHERE opportunity.expiryDate >= CURRENT_DATE + INTERVAL '${91 - EXPIRY_BUFFER_DAYS} days')`,
          "beyond90DaysCount"
        )
        .where("opportunity.opportunityTypeLid = :roTypeLid", { roTypeLid: roTypeLookup.id })
        .andWhere("opportunity.refPolicyId IS NOT NULL")
        .andWhere("opportunity.sbuId IS NOT NULL");

      if (lostStatusIds.length > 0) {
        qb.andWhere(
          "(opportunity.statusLid IS NULL OR opportunity.statusLid NOT IN (:...sbuLostStatusIds))",
          { sbuLostStatusIds: lostStatusIds }
        );
      }

      if (enabledLookup?.id) {
        qb.andWhere("opportunity.enabledForPerformanceLid = :enabledLid", {
          enabledLid: enabledLookup.id,
        });
      }

      if (!isLeadership) {
        qb.andWhere(
          `( opportunity.createdBy IN (:...userIds) OR "opportunity"."id" IN (
            WITH user_results AS (
              SELECT DISTINCT user_id
              FROM employee_hierarchy
              WHERE (true = true AND reporting_user_id = ${currentUserId})
              UNION
              SELECT ${currentUserId} AS user_id
              WHERE ${currentUserId} IS NOT NULL
            ),
            scope_users AS (
              SELECT ${currentUserId} AS user_id
              UNION
              SELECT ur.user_id
              FROM user_results ur
              WHERE true = true
            ),
            opportunity_results AS (
              SELECT DISTINCT opportunity_id
              FROM opportunity_activity_participants
              WHERE participant_id IN (SELECT user_id FROM scope_users)
              UNION
              SELECT DISTINCT opportunity_id
              FROM opportunity_activity_map
              WHERE owner_id IN (SELECT user_id FROM scope_users)
              UNION
              SELECT DISTINCT opportunity_id
              FROM task
              WHERE assignee_id IN (SELECT user_id FROM scope_users)
            )
            SELECT DISTINCT opportunity_id
            FROM opportunity_results
            ORDER BY opportunity_id ))`,
          { userIds: uniqueUserIds }
        );
      }

      if (options?.organisationId) {
        qb.andWhere("opportunity.organisationId = :organisationId", {
          organisationId: options.organisationId,
        });
      }
      if (options?.sbuId) {
        qb.andWhere("opportunity.sbuId = :sbuId", { sbuId: options.sbuId });
      }
      if (options?.verticalId) {
        // Vertical is a multiselect filter — one id or a list.
        const verticalIds = Array.isArray(options.verticalId)
          ? options.verticalId
          : [options.verticalId];
        if (verticalIds.length) {
          qb.andWhere("opportunity.verticalId IN (:...verticalIds)", {
            verticalIds,
          });
        }
      }
      if (options?.departmentId) {
        qb.andWhere("opportunity.departmentId = :departmentId", { departmentId: options.departmentId });
      }
      if (options?.branchId) {
        qb.andWhere("opportunity.branchId IN (:...branchIds)", {
          branchIds: Array.isArray(options.branchId)
            ? options.branchId
            : [options.branchId],
        });
      }
      if (options?.from) {
        qb.andWhere("opportunity.expiryDate >= :from", { from: options.from });
      }
      if (options?.to) {
        qb.andWhere("opportunity.expiryDate <= :to", { to: options.to });
      }
      if (options?.insurerId) {
        qb.andWhere(
          `opportunity.opportunityId IN (
            SELECT oam_ins.opportunity_id
            FROM opportunity_activity_map oam_ins
            INNER JOIN opportunity_placement_slip_generation opsg_ins
              ON opsg_ins.opportunity_activity_id = oam_ins.id
            INNER JOIN opportunity_placement_slip_insurer_map opsim_ins
              ON opsim_ins.placement_slip_id = opsg_ins.id
            WHERE opsim_ins.insurer_id = :renewalInsurerId
          )`,
          { renewalInsurerId: options.insurerId }
        );
      }

      // Opportunities linked to a deactivated SBU are dropped entirely rather
      // than surfacing under the retired SBU's name.
      this.applyActiveSbuFilter(qb);

      const groupedRows = await qb
        .groupBy("opportunity.sbuId")
        .addGroupBy("sbu.name")
        .orderBy("COALESCE(sbu.name, 'Unknown')", "ASC")
        .getRawMany();

      const results = groupedRows.map((row) => {
        // Counts are already per-band (each an independent buffered window from the
        // query) — no cumulative subtraction.
        const next30 = Math.max(parseInt(row?.next30DaysCount ?? "0", 10), 0);
        const next60 = Math.max(parseInt(row?.next60DaysCount ?? "0", 10), 0);
        const next90 = Math.max(parseInt(row?.next90DaysCount ?? "0", 10), 0);
        const beyond90 = Math.max(parseInt(row?.beyond90DaysCount ?? "0", 10), 0);

        return {
          sbuId: Number(row.sbuId),
          sbuName: row.sbuName,
          sourceSbuIds: [Number(row.sbuId)],
          policyExpiryTimeline: bucketOrder.map((label) => ({
            label,
            count:
              label === "30 Days" ? next30
              : label === "60 Days" ? next60
              : label === "90 Days" ? next90
              : beyond90,
          })),
        };
      });

      // Merge rows that have the same normalised SBU name
      const groupedMap = new Map<string, typeof results[0]>();
      for (const row of results) {
        const key = (row.sbuName ?? "").trim().toLowerCase();
        const existing = groupedMap.get(key);
        if (!existing) {
          groupedMap.set(key, { ...row });
        } else {
          if (!existing.sourceSbuIds.includes(row.sbuId)) {
            existing.sourceSbuIds.push(row.sbuId);
          }
          for (const bucket of row.policyExpiryTimeline) {
            const target = existing.policyExpiryTimeline.find((b) => b.label === bucket.label);
            if (target) target.count += bucket.count;
          }
        }
      }

      return this.appendZeroCountSbus(
        Array.from(groupedMap.values()),
        bucketOrder,
        options?.sbuScopeOrgId,
        options?.sbuId
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch renewal schedule by SBU: ${(error as Error).message}`
      );
    }
  }

  // Grouped RO/SO aggregate for the My RO Enhanced org-hierarchy drilldown.
  // Returns one row per node id that HAS ROs at `level` (organisation | unit(sbu)
  // | vertical | branch) under the given parent scope, each with Total ROs,
  // premium and brokerage. No joins → SUM()/COUNT are exact and match the listing
  // KPIs. Node names are supplied by org-service on the client and merged by id.
  async getScopeSummary(
    userIds: number[],
    taggedUserIds: number[],
    isLeadership: boolean,
    params: {
      level: "organisation" | "unit" | "vertical" | "branch";
      type?: "SO" | "RO";
      organisationId?: number;
      sbuId?: number;
      verticalId?: number;
      departmentId?: number;
      branchId?: number;
      from?: Date;
      to?: Date;
      financialYear?: number;
    },
    // buildActivityRoleStageGate Brackets (alias "main"), from the caller.
    stageGate?: Brackets
  ): Promise<
    { id: number; totalRos: number; premium: number; brokerage: number }[]
  > {
    const typeKey =
      params.type === "SO" ? OPPORTUNITY_TYPE.SO : OPPORTUNITY_TYPE.RO;
    const typeLookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: typeKey },
    });
    if (!typeLookup) {
      return [];
    }

    // The org cards count ACTIVE opportunities only (see
    // SCOPE_SUMMARY_STATUS_VALUES). The Enhanced listing/KPIs below still
    // default to Active + Lost, so the cards read LOWER than the table by
    // exactly the Lost records — deliberate, not drift.
    //
    // Matched on lookUpValue, NOT on the internal OPPORTUNITY_STATUS_* keys:
    // the UI collapses nine stages into three display values, so matching the
    // value inherits that grouping (whatever Open / Work In Progress / BD
    // Planning / ISG Planning / Default surface as) instead of duplicating the
    // mapping here and drifting from it again. statusLid only ever points at
    // an opportunity-status row, so a same-named row in another lookup context
    // cannot match even if the value collides.
    //
    // FIXED on purpose: changing a status filter in the drawer re-scopes the
    // table and KPIs only — the org cards stay on this default baseline.
    const defaultVisibleStatuses = await this.lookUpRepository.find({
      where: {
        lookUpValue: In(SCOPE_SUMMARY_STATUS_VALUES),
      },
    });
    const defaultVisibleStatusIds = defaultVisibleStatuses.map((s) => s.id);

    // Fallback ONLY for the case where those display values stop resolving
    // (renamed lookup rows): degrade to the previous hidden-status exclusion
    // rather than to no status filter at all, which would silently inflate
    // every card instead of failing visibly.
    const hiddenLostStatuses = defaultVisibleStatusIds.length
      ? []
      : await this.lookUpRepository.find({
          where: {
            lookUpKey: In([
              OPPORTUNITY_STATUS_LOST,
              OPPORTUNITY_STATUS_AUTO_CLOSE,
              OPPORTUNITY_STATUS_CLOSE,
            ]),
          },
        });
    const hiddenLostStatusIds = hiddenLostStatuses.map((status) => status.id);

    const uniqueUserIds = Array.from(
      new Set(
        (userIds ?? []).filter(
          (id): id is number => typeof id === "number" && !Number.isNaN(id)
        )
      )
    );
    // Narrower than uniqueUserIds for org-scoped (CS_MANAGER/CS_EXECUTIVE)
    // viewers — excludes org peers, matching the real listing's scope_users
    // (entity-service.utils.ts), which has no "org" slot at all.
    const uniqueTaggedUserIds = Array.from(
      new Set(
        (taggedUserIds ?? []).filter(
          (id): id is number => typeof id === "number" && !Number.isNaN(id)
        )
      )
    );
    if (!isLeadership && uniqueUserIds.length === 0) {
      return [];
    }

    // Group column for the requested level. This endpoint returns ONLY the RO
    // aggregate keyed by node id — the node NAME list is fetched from org-service
    // on the client (opportunity-service's DB doesn't carry the full
    // org_vertical / org_branch master), then merged by id there.
    // Alias "main" (not "opportunity") so buildActivityRoleStageGate's
    // Brackets — written against the listing's "main" alias — apply verbatim.
    const colMap: Record<string, string> = {
      organisation: "main.organisationId",
      unit: "main.sbuId",
      vertical: "main.verticalId",
      branch: "main.branchId",
    };
    const col = colMap[params.level];

    try {
      // RO aggregate grouped by this level's id column, under the parent scope
      // + timeline + visibility. Only nodes that HAVE ROs come back here.
      const qb = this.opportunityRepository
        .createQueryBuilder("main")
        .select(col, "id")
        .addSelect("COUNT(DISTINCT main.opportunityId)", "totalRos")
        .addSelect("COALESCE(SUM(main.premiumPaid), 0)", "premium")
        .addSelect("COALESCE(SUM(main.estimatedBrokerage), 0)", "brokerage")
        .where("main.opportunityTypeLid = :typeLid", {
          typeLid: typeLookup.id,
        })
        .andWhere(`${col} IS NOT NULL`);

      if (defaultVisibleStatusIds.length > 0) {
        qb.andWhere("main.statusLid IN (:...defaultVisibleStatusIds)", {
          defaultVisibleStatusIds,
        });
      } else if (hiddenLostStatusIds.length > 0) {
        qb.andWhere(
          "(main.statusLid IS NULL OR main.statusLid NOT IN (:...hiddenLostStatusIds))",
          { hiddenLostStatusIds }
        );
      }

      // Matches the real listing's unconditional performanceCondition
      // (opportunity.service.ts) exactly: only opportunities flagged
      // "enabled for performance" count anywhere in the app's totals —
      // migrated/placeholder records (e.g. owned by the migration system
      // user) are typically NOT flagged, and without this the accordion
      // silently counts them while the table/KPIs never do. RO additionally
      // requires a linked policy (refPolicyId), same as the listing.
      const enabledForPerformanceLookup = await this.lookUpRepository.findOne({
        where: { lookUpKey: TOGGLE_TYPE.TOGGLE_TYPE_YES },
      });
      if (enabledForPerformanceLookup?.id) {
        qb.andWhere("main.enabledForPerformanceLid = :enabledForPerformanceLid", {
          enabledForPerformanceLid: enabledForPerformanceLookup.id,
        });
        if (params.type === "RO") {
          qb.andWhere("main.refPolicyId IS NOT NULL");
        }
      }

      // Non-leadership users only see their own + branch/reportee/org
      // opportunities via createdBy (uniqueUserIds), but the
      // participant/owner/assignee union uses the narrower uniqueTaggedUserIds
      // (self + branch peers + reportees only, no org peers) — matching the
      // real listing's two-tier split exactly (see getScopeSummary in
      // opportunity.service.ts for how these are computed).
      if (!isLeadership) {
        qb.andWhere(
          `( main.createdBy IN (:...userIds) OR "main"."id" IN (
            SELECT DISTINCT opportunity_id
            FROM opportunity_activity_participants
            WHERE participant_id IN (:...taggedUserIds)
            UNION
            SELECT DISTINCT opportunity_id
            FROM opportunity_activity_map
            WHERE owner_id IN (:...taggedUserIds)
            UNION
            SELECT DISTINCT opportunity_id
            FROM task
            WHERE assignee_id IN (:...taggedUserIds)
          ))`,
          { userIds: uniqueUserIds, taggedUserIds: uniqueTaggedUserIds }
        );
      }

      if (params.organisationId != null) {
        qb.andWhere("main.organisationId = :organisationId", {
          organisationId: params.organisationId,
        });
      }
      if (params.sbuId != null) {
        qb.andWhere("main.sbuId = :sbuId", { sbuId: params.sbuId });
      }
      if (params.verticalId != null) {
        qb.andWhere("main.verticalId = :verticalId", {
          verticalId: params.verticalId,
        });
      }
      if (params.departmentId != null) {
        qb.andWhere("main.departmentId = :departmentId", {
          departmentId: params.departmentId,
        });
      }
      if (params.branchId != null) {
        qb.andWhere("main.branchId IN (:...branchId)", {
          branchId: Array.isArray(params.branchId)
            ? params.branchId
            : [params.branchId],
        });
      }
      // Match the listing's expiry window exactly. A whole-FY selection arrives
      // as financialYear and resolves through getDateRange with NO expiry
      // buffer — the listing's financialYear path (periodStartAndEndDate) is
      // unbuffered and wins over from/to. Quarter/month/custom selections
      // arrive as from/to, which the listing widens by EXPIRY_BUFFER_DAYS on
      // each side (from-5 … to+5) so boundary renewals show.
      if (params.financialYear !== undefined) {
        const range = getDateRange(undefined, params.financialYear);
        if (range.start) {
          qb.andWhere("main.expiryDate >= :from", {
            from: range.start.toISOString().split("T")[0],
          });
        }
        if (range.end) {
          qb.andWhere("main.expiryDate <= :to", {
            to: range.end.toISOString().split("T")[0],
          });
        }
      } else {
        if (params.from) {
          const f = new Date(params.from);
          f.setDate(f.getDate() - EXPIRY_BUFFER_DAYS);
          qb.andWhere("main.expiryDate >= :from", {
            from: f.toISOString().split("T")[0],
          });
        }
        if (params.to) {
          const t = new Date(params.to);
          t.setDate(t.getDate() + EXPIRY_BUFFER_DAYS);
          qb.andWhere("main.expiryDate <= :to", {
            to: t.toISOString().split("T")[0],
          });
        }
      }

      // The listing's role-based stage gate (BD-only viewers lose ISG-handed
      // opportunities unless their team owns them; ISG-only viewers see only
      // ISG-reached ones). Built by the caller from the LOGGED-IN viewer —
      // not the selected owner — exactly like getAllOpportunityList.
      if (stageGate) {
        qb.andWhere(stageGate);
      }

      const rows = await qb.groupBy(col).getRawMany();

      return rows.map((row) => ({
        id: Number(row.id),
        totalRos: Math.max(parseInt(row.totalRos ?? "0", 10), 0),
        premium: Number(row.premium) || 0,
        brokerage: Number(row.brokerage) || 0,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch scope summary: ${(error as Error).message}`
      );
    }
  }

   // Owner-level companion to getScopeSummary (Enhanced pages' Owner
  // accordion). One row per ownerId (the caller's reporting downline, self
  // included) with the SAME record set the level SQL above sees (type,
  // hidden-status, performance, dimension and expiry-window conditions, and
  // the same two-tier visibility split). A record attributes to a user when
  // that user created it OR is tagged on it (participant / activity owner /
  // task assignee) — exactly the listing's userId+owner filter semantics, so
  // a card's numbers match the listing filtered to that owner.
  //   viewBy "manager": each owner counts only their own attribution.
  //   viewBy "team":    each owner also absorbs their whole reporting
  //                     subtree (cards overlap by design; COUNT is DISTINCT
  //                     per owner, so nothing double-counts within a card).
  async getOwnerScopeSummary(
    userIds: number[],
    taggedUserIds: number[],
    isLeadership: boolean,
    params: {
      ownerIds: number[];
      viewBy: "manager" | "team";
      type?: "SO" | "RO";
      organisationId?: number;
      sbuId?: number;
      verticalId?: number;
      departmentId?: number;
      branchId?: number;
      from?: Date;
      to?: Date;
      financialYear?: number;
    }
  ): Promise<
    { id: number; totalRos: number; premium: number; brokerage: number }[]
  > {
    const typeKey =
      params.type === "SO" ? OPPORTUNITY_TYPE.SO : OPPORTUNITY_TYPE.RO;
    const typeLookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: typeKey },
    });
    if (!typeLookup) {
      return [];
    }

    // Same Active-only baseline as getScopeSummary above — the owner cards
    // sit in the same accordion, so they must not use a different status rule
    // from the levels above them. See that method for why this matches on
    // lookUpValue and why it is deliberately fixed.
    const defaultVisibleStatuses = await this.lookUpRepository.find({
      where: {
        lookUpValue: In(SCOPE_SUMMARY_STATUS_VALUES),
      },
    });
    const defaultVisibleStatusIds = defaultVisibleStatuses.map((s) => s.id);

    const hiddenLostStatuses = defaultVisibleStatusIds.length
      ? []
      : await this.lookUpRepository.find({
          where: {
            lookUpKey: In([
              OPPORTUNITY_STATUS_LOST,
              OPPORTUNITY_STATUS_AUTO_CLOSE,
              OPPORTUNITY_STATUS_CLOSE,
            ]),
          },
        });
    const hiddenLostStatusIds = hiddenLostStatuses.map((status) => status.id);

    const enabledForPerformanceLookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: TOGGLE_TYPE.TOGGLE_TYPE_YES },
    });

    const uniqueUserIds = Array.from(
      new Set(
        (userIds ?? []).filter(
          (id): id is number => typeof id === "number" && !Number.isNaN(id)
        )
      )
    );
    const uniqueTaggedUserIds = Array.from(
      new Set(
        (taggedUserIds ?? []).filter(
          (id): id is number => typeof id === "number" && !Number.isNaN(id)
        )
      )
    );
    if (!isLeadership && uniqueUserIds.length === 0) {
      return [];
    }

    // The record set every owner card draws from — identical conditions to
    // getScopeSummary above, built the same QueryBuilder way.
    const scopedQb = this.opportunityRepository
      .createQueryBuilder("o")
      .select("o.id", "id")
      .addSelect("o.premiumPaid", "premium_paid")
      .addSelect("o.estimatedBrokerage", "estimated_brokerage")
      .addSelect("o.createdBy", "created_by")
      .where("o.opportunityTypeLid = :ownerTypeLid", {
        ownerTypeLid: typeLookup.id,
      });

    if (defaultVisibleStatusIds.length > 0) {
      scopedQb.andWhere("o.statusLid IN (:...ownerDefaultVisibleStatusIds)", {
        ownerDefaultVisibleStatusIds: defaultVisibleStatusIds,
      });
    } else if (hiddenLostStatusIds.length > 0) {
      scopedQb.andWhere(
        "(o.statusLid IS NULL OR o.statusLid NOT IN (:...ownerHiddenLostStatusIds))",
        { ownerHiddenLostStatusIds: hiddenLostStatusIds }
      );
    }
    if (enabledForPerformanceLookup?.id) {
      scopedQb.andWhere(
        "o.enabledForPerformanceLid = :ownerEnabledForPerformanceLid",
        { ownerEnabledForPerformanceLid: enabledForPerformanceLookup.id }
      );
      if (params.type === "RO") {
        scopedQb.andWhere("o.refPolicyId IS NOT NULL");
      }
    }
    if (!isLeadership) {
      const taggedList =
        uniqueTaggedUserIds.length > 0 ? uniqueTaggedUserIds : [-1];
      scopedQb.andWhere(
        `( o.createdBy IN (:...ownerScopeUserIds) OR "o"."id" IN (
          SELECT DISTINCT opportunity_id
          FROM opportunity_activity_participants
          WHERE participant_id IN (:...ownerScopeTaggedUserIds)
          UNION
          SELECT DISTINCT opportunity_id
          FROM opportunity_activity_map
          WHERE owner_id IN (:...ownerScopeTaggedUserIds)
          UNION
          SELECT DISTINCT opportunity_id
          FROM task
          WHERE assignee_id IN (:...ownerScopeTaggedUserIds)
        ))`,
        {
          ownerScopeUserIds: uniqueUserIds,
          ownerScopeTaggedUserIds: taggedList,
        }
      );
    }
    if (params.organisationId != null) {
      scopedQb.andWhere("o.organisationId = :ownerOrganisationId", {
        ownerOrganisationId: params.organisationId,
      });
    }
    if (params.sbuId != null) {
      scopedQb.andWhere("o.sbuId = :ownerSbuId", { ownerSbuId: params.sbuId });
    }
    if (params.verticalId != null) {
      scopedQb.andWhere("o.verticalId = :ownerVerticalId", {
        ownerVerticalId: params.verticalId,
      });
    }
    if (params.departmentId != null) {
      scopedQb.andWhere("o.departmentId = :ownerDepartmentId", {
        ownerDepartmentId: params.departmentId,
      });
    }
    if (params.branchId != null) {
      scopedQb.andWhere("o.branchId IN (:...ownerBranchId)", {
        ownerBranchId: Array.isArray(params.branchId)
          ? params.branchId
          : [params.branchId],
      });
    }
    // Same expiry-window resolution as getScopeSummary above: whole-FY via
    // getDateRange (no buffer), quarter/month/custom from/to buffered by
    // EXPIRY_BUFFER_DAYS each side.
    if (params.financialYear !== undefined) {
      const range = getDateRange(undefined, params.financialYear);
      if (range.start) {
        scopedQb.andWhere("o.expiryDate >= :ownerFrom", {
          ownerFrom: range.start.toISOString().split("T")[0],
        });
      }
      if (range.end) {
        scopedQb.andWhere("o.expiryDate <= :ownerTo", {
          ownerTo: range.end.toISOString().split("T")[0],
        });
      }
    } else {
      if (params.from) {
        const f = new Date(params.from);
        f.setDate(f.getDate() - EXPIRY_BUFFER_DAYS);
        scopedQb.andWhere("o.expiryDate >= :ownerFrom", {
          ownerFrom: f.toISOString().split("T")[0],
        });
      }
      if (params.to) {
        const t = new Date(params.to);
        t.setDate(t.getDate() + EXPIRY_BUFFER_DAYS);
        scopedQb.andWhere("o.expiryDate <= :ownerTo", {
          ownerTo: t.toISOString().split("T")[0],
        });
      }
    }

    // "team" extends each owner's identity row with their entire reporting
    // subtree (same user_type walk getNewEmployeeHierarchyByUserId does);
    // "manager" keeps identity pairs only. Recursion needs a CTE, which the
    // query builder attaches via addCommonTableExpression.
    const closureCte = `
      SELECT u.id AS ancestor_id, u.id AS descendant_id
      FROM users u
      WHERE u.id IN (:...closureOwnerIds)${
        params.viewBy === "team"
          ? `
      UNION ALL
      SELECT c.ancestor_id, u.id AS descendant_id
      FROM users u
      JOIN closure c ON u.reporting_user_id = c.descendant_id
      AND u.user_type_key IN ('USER_TYPE_IIRM_EMPLOYEE', 'USER_TYPE_COMPANY_EMPLOYEE_AND_IIRM_EMPLOYEE')`
          : ""
      }`;

    // A record attributes to its creator plus everyone tagged on it.
    const attributedCte = `
      SELECT s.id AS opp_id, s.created_by AS user_id FROM scoped s
      UNION
      SELECT oap.opportunity_id, oap.participant_id
      FROM opportunity_activity_participants oap
      WHERE oap.opportunity_id IN (SELECT id FROM scoped)
      UNION
      SELECT oam.opportunity_id, oam.owner_id
      FROM opportunity_activity_map oam
      WHERE oam.opportunity_id IN (SELECT id FROM scoped)
      UNION
      SELECT tk.opportunity_id, tk.assignee_id
      FROM task tk
      WHERE tk.opportunity_id IN (SELECT id FROM scoped)`;

    const pairsCte = `
      SELECT DISTINCT c.ancestor_id, a.opp_id
      FROM attributed a
      JOIN closure c ON c.descendant_id = a.user_id`;

    try {
      const rows = await this.opportunityRepository.manager
        .createQueryBuilder()
        .addCommonTableExpression(closureCte, "closure", { recursive: true })
        .addCommonTableExpression(scopedQb, "scoped")
        .addCommonTableExpression(attributedCte, "attributed")
        .addCommonTableExpression(pairsCte, "pairs")
        .select("p.ancestor_id", "id")
        .addSelect("COUNT(DISTINCT s.id)", "totalRos")
        .addSelect("COALESCE(SUM(s.premium_paid), 0)", "premium")
        .addSelect("COALESCE(SUM(s.estimated_brokerage), 0)", "brokerage")
        .from("pairs", "p")
        .innerJoin("scoped", "s", "s.id = p.opp_id")
        .groupBy("p.ancestor_id")
        .setParameters({
          ...scopedQb.getParameters(),
          closureOwnerIds: params.ownerIds,
        })
        .getRawMany();

      return rows.map((row: any) => ({
        id: Number(row.id),
        totalRos: Math.max(parseInt(row.totalRos ?? "0", 10), 0),
        premium: Number(row.premium) || 0,
        brokerage: Number(row.brokerage) || 0,
      }));
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch owner scope summary: ${(error as Error).message}`
      );
    }
  }

  // Company-grain companion to getScopeSummary (SO/RO Enhanced's
  // portfolio-style Companies table): one row per company that HAS
  // opportunities under the same record set the level SQL above sees (type,
  // hidden-status, performance, dimension and expiry-window conditions, the
  // same two-tier visibility split, and the same viewer-keyed stage gate) —
  // so a company row's numbers match the listing filtered to that company.
  // Paginated + name-ordered; searchBy is companyId when numeric, otherwise
  // a company-name ILIKE.
  async getCompanyScopeSummary(
    userIds: number[],
    taggedUserIds: number[],
    isLeadership: boolean,
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
      searchBy?: string;
      page: number;
      limit: number;
    },
    stageGate?: Brackets
  ): Promise<{
    count: number;
    data: {
      companyId: number;
      companyName: string;
      totalRos: number;
      premium: number;
      brokerage: number;
    }[];
  }> {
    const typeKey =
      params.type === "SO" ? OPPORTUNITY_TYPE.SO : OPPORTUNITY_TYPE.RO;
    const typeLookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: typeKey },
    });
    if (!typeLookup) {
      return { count: 0, data: [] };
    }

    // Same Active-only baseline as getScopeSummary — this method's contract is
    // "the same record set the level SQL above sees", so its status rule
    // follows the accordion's, not the listing's wider Active + Lost default.
    const defaultVisibleStatuses = await this.lookUpRepository.find({
      where: {
        lookUpValue: In(SCOPE_SUMMARY_STATUS_VALUES),
      },
    });
    const defaultVisibleStatusIds = defaultVisibleStatuses.map((s) => s.id);

    const hiddenLostStatuses = defaultVisibleStatusIds.length
      ? []
      : await this.lookUpRepository.find({
          where: {
            lookUpKey: In([
              OPPORTUNITY_STATUS_LOST,
              OPPORTUNITY_STATUS_AUTO_CLOSE,
              OPPORTUNITY_STATUS_CLOSE,
            ]),
          },
        });
    const hiddenLostStatusIds = hiddenLostStatuses.map((status) => status.id);
    const enabledForPerformanceLookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: TOGGLE_TYPE.TOGGLE_TYPE_YES },
    });

    const uniqueUserIds = Array.from(
      new Set(
        (userIds ?? []).filter(
          (id): id is number => typeof id === "number" && !Number.isNaN(id)
        )
      )
    );
    const uniqueTaggedUserIds = Array.from(
      new Set(
        (taggedUserIds ?? []).filter(
          (id): id is number => typeof id === "number" && !Number.isNaN(id)
        )
      )
    );
    if (!isLeadership && uniqueUserIds.length === 0) {
      return { count: 0, data: [] };
    }

    // Shared WHERE set for both the page query and the count query — clones
    // getScopeSummary's conditions verbatim, at company grain.
    const applyConditions = (qb: any) => {
      qb.where("main.opportunityTypeLid = :typeLid", {
        typeLid: typeLookup.id,
      }).andWhere("main.companyId IS NOT NULL");

      if (defaultVisibleStatusIds.length > 0) {
        qb.andWhere("main.statusLid IN (:...defaultVisibleStatusIds)", {
          defaultVisibleStatusIds,
        });
      } else if (hiddenLostStatusIds.length > 0) {
        qb.andWhere(
          "(main.statusLid IS NULL OR main.statusLid NOT IN (:...hiddenLostStatusIds))",
          { hiddenLostStatusIds }
        );
      }
      if (enabledForPerformanceLookup?.id) {
        qb.andWhere(
          "main.enabledForPerformanceLid = :enabledForPerformanceLid",
          { enabledForPerformanceLid: enabledForPerformanceLookup.id }
        );
        if (params.type === "RO") {
          qb.andWhere("main.refPolicyId IS NOT NULL");
        }
      }
      if (!isLeadership) {
        qb.andWhere(
          `( main.createdBy IN (:...userIds) OR "main"."id" IN (
            SELECT DISTINCT opportunity_id
            FROM opportunity_activity_participants
            WHERE participant_id IN (:...taggedUserIds)
            UNION
            SELECT DISTINCT opportunity_id
            FROM opportunity_activity_map
            WHERE owner_id IN (:...taggedUserIds)
            UNION
            SELECT DISTINCT opportunity_id
            FROM task
            WHERE assignee_id IN (:...taggedUserIds)
          ))`,
          { userIds: uniqueUserIds, taggedUserIds: uniqueTaggedUserIds }
        );
      }
      if (params.organisationId != null) {
        qb.andWhere("main.organisationId = :organisationId", {
          organisationId: params.organisationId,
        });
      }
      if (params.sbuId != null) {
        qb.andWhere("main.sbuId = :sbuId", { sbuId: params.sbuId });
      }
      if (params.verticalId != null) {
        qb.andWhere("main.verticalId = :verticalId", {
          verticalId: params.verticalId,
        });
      }
      if (params.departmentId != null) {
        qb.andWhere("main.departmentId = :departmentId", {
          departmentId: params.departmentId,
        });
      }
      if (params.branchId != null) {
        qb.andWhere("main.branchId IN (:...branchId)", {
          branchId: Array.isArray(params.branchId)
            ? params.branchId
            : [params.branchId],
        });
      }
      // Same expiry-window resolution as getScopeSummary: whole-FY via
      // getDateRange (no buffer), quarter/month/custom from/to buffered by
      // EXPIRY_BUFFER_DAYS each side.
      if (params.financialYear !== undefined) {
        const range = getDateRange(undefined, params.financialYear);
        if (range.start) {
          qb.andWhere("main.expiryDate >= :from", {
            from: range.start.toISOString().split("T")[0],
          });
        }
        if (range.end) {
          qb.andWhere("main.expiryDate <= :to", {
            to: range.end.toISOString().split("T")[0],
          });
        }
      } else {
        if (params.from) {
          const f = new Date(params.from);
          f.setDate(f.getDate() - EXPIRY_BUFFER_DAYS);
          qb.andWhere("main.expiryDate >= :from", {
            from: f.toISOString().split("T")[0],
          });
        }
        if (params.to) {
          const t = new Date(params.to);
          t.setDate(t.getDate() + EXPIRY_BUFFER_DAYS);
          qb.andWhere("main.expiryDate <= :to", {
            to: t.toISOString().split("T")[0],
          });
        }
      }
      if (params.searchBy) {
        if (!isNaN(Number(params.searchBy))) {
          qb.andWhere("main.companyId = :searchCompanyId", {
            searchCompanyId: Number(params.searchBy),
          });
        } else {
          qb.andWhere("company.companyName ILIKE :searchCompanyName", {
            searchCompanyName: `%${params.searchBy}%`,
          });
        }
      }
      if (stageGate) {
        qb.andWhere(stageGate);
      }
      return qb;
    };

    try {
      const page = Math.max(params.page || 1, 1);
      const limit = Math.max(params.limit || 10, 1);

      const rowsQb = applyConditions(
        this.opportunityRepository
          .createQueryBuilder("main")
          .leftJoin("main.company", "company")
          .select("main.companyId", "companyId")
          .addSelect("company.companyName", "companyName")
          .addSelect("COUNT(DISTINCT main.opportunityId)", "totalRos")
          .addSelect("COALESCE(SUM(main.premiumPaid), 0)", "premium")
          .addSelect("COALESCE(SUM(main.estimatedBrokerage), 0)", "brokerage")
      )
        .groupBy("main.companyId")
        .addGroupBy("company.companyName")
        .orderBy("company.companyName", "ASC")
        .offset((page - 1) * limit)
        .limit(limit);

      const countQb = applyConditions(
        this.opportunityRepository
          .createQueryBuilder("main")
          .leftJoin("main.company", "company")
          .select("COUNT(DISTINCT main.companyId)", "count")
      );

      const [rows, countRow] = await Promise.all([
        rowsQb.getRawMany(),
        countQb.getRawOne(),
      ]);

      return {
        count: Number(countRow?.count ?? 0),
        data: rows.map((row: any) => ({
          companyId: Number(row.companyId),
          companyName: row.companyName ?? String(row.companyId),
          totalRos: Math.max(parseInt(row.totalRos ?? "0", 10), 0),
          premium: Number(row.premium) || 0,
          brokerage: Number(row.brokerage) || 0,
        })),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch company scope summary: ${(error as Error).message}`
      );
    }
  }

  async getSalesScheduleBySbu(
    userIds: number[],
    isLeadership: boolean,
    currentUserId?: number,
    options?: {
      organisationId?: number;
      sbuId?: number;
      // Vertical and Branch are multiselect dashboard filters: one id or a list.
      verticalId?: number | number[];
      departmentId?: number;
      branchId?: number | number[];
      from?: Date;
      to?: Date;
      insurerId?: number;
      sbuScopeOrgId?: number;
      // "PLACEMENT" switches this from the SO schedule to the combined SO+RO
      // pipeline past the ISG gate (spec §12.3-B). Absent = SO, as before.
      scope?: "PLACEMENT";
    }
  ): Promise<{
    sbuId: number;
    sbuName: string;
    sourceSbuIds: number[];
    policyExpiryTimeline: { label: string; count: number }[];
  }[]> {
    const bucketOrder = ["30 Days", "60 Days", "90 Days", "Beyond 90 Days"];

    const soTypeLookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: OPPORTUNITY_TYPE.SO },
    });
    if (!soTypeLookup) {
      return [];
    }

    const enabledLookup = await this.lookUpRepository.findOne({
      where: { lookUpKey: TOGGLE_TYPE.TOGGLE_TYPE_YES },
    });

    // Exclude lost/closed opps — a schedule is upcoming pipeline, and the drilldown
    // listing hides them too (lostExclusionCondition), so this keeps counts aligned.
    const lostStatusLookups = await this.lookUpRepository.find({
      where: {
        lookUpKey: In([
          OPPORTUNITY_STATUS_LOST,
          OPPORTUNITY_STATUS_AUTO_CLOSE,
          OPPORTUNITY_STATUS_CLOSE,
        ]),
      },
    });
    const lostStatusIds = lostStatusLookups.map((l) => l.id);

    const uniqueUserIds = Array.from(
      new Set((userIds ?? []).filter((id): id is number => typeof id === "number" && !Number.isNaN(id)))
    );

    if (!isLeadership && uniqueUserIds.length === 0) {
      return [];
    }

    try {
      const qb = this.opportunityRepository
        .createQueryBuilder("opportunity")
        .leftJoin(OrgSbu, "sbu", "sbu.id = opportunity.sbuId")
        .select("opportunity.sbuId", "sbuId")
        .addSelect("COALESCE(sbu.name, 'Unknown')", "sbuName")
        // Each bucket counts its own expiry band widened by the same +-5 day
        // buffer the opportunities listing applies, so a bucket's count matches the
        // count on its drilldown listing. Source bands (frontend
        // POLICY_EXPIRY_BUCKET_DAY_RANGES): 30=[0,30] 60=[31,60] 90=[61,90]
        // beyond=[91,inf). Buffering makes adjacent bands overlap by the buffer,
        // and there is no future-only floor because the buffered drill includes the
        // trailing 5 days too.
        .addSelect(
          `COUNT(*) FILTER (WHERE opportunity.expiryDate BETWEEN CURRENT_DATE - INTERVAL '${EXPIRY_BUFFER_DAYS} days' AND CURRENT_DATE + INTERVAL '${30 + EXPIRY_BUFFER_DAYS} days')`,
          "next30DaysCount"
        )
        .addSelect(
          `COUNT(*) FILTER (WHERE opportunity.expiryDate BETWEEN CURRENT_DATE + INTERVAL '${31 - EXPIRY_BUFFER_DAYS} days' AND CURRENT_DATE + INTERVAL '${60 + EXPIRY_BUFFER_DAYS} days')`,
          "next60DaysCount"
        )
        .addSelect(
          `COUNT(*) FILTER (WHERE opportunity.expiryDate BETWEEN CURRENT_DATE + INTERVAL '${61 - EXPIRY_BUFFER_DAYS} days' AND CURRENT_DATE + INTERVAL '${90 + EXPIRY_BUFFER_DAYS} days')`,
          "next90DaysCount"
        )
        .addSelect(
          `COUNT(*) FILTER (WHERE opportunity.expiryDate >= CURRENT_DATE + INTERVAL '${91 - EXPIRY_BUFFER_DAYS} days')`,
          "beyond90DaysCount"
        )
        .andWhere("opportunity.sbuId IS NOT NULL");

      if (options?.scope === "PLACEMENT") {
        // Placement schedule: the combined SO+RO pipeline past the ISG gate. An
        // RO still needs a linked policy to be real pipeline (spec §12.3-B).
        qb.andWhere(
          new Brackets((sub) => {
            sub
              .where("opportunity.opportunityTypeLid = :soTypeLid", {
                soTypeLid: soTypeLookup.id,
              })
              .orWhere("opportunity.refPolicyId IS NOT NULL");
          })
        );
        const isgGate = await this.buildActivityRoleStageGate(
          null,
          true,
          undefined,
          "opportunity"
        );
        if (isgGate) {
          qb.andWhere(isgGate);
        }
      } else {
        qb.andWhere("opportunity.opportunityTypeLid = :soTypeLid", {
          soTypeLid: soTypeLookup.id,
        });
      }

      if (lostStatusIds.length > 0) {
        qb.andWhere(
          "(opportunity.statusLid IS NULL OR opportunity.statusLid NOT IN (:...sbuLostStatusIds))",
          { sbuLostStatusIds: lostStatusIds }
        );
      }

      if (enabledLookup?.id) {
        qb.andWhere("opportunity.enabledForPerformanceLid = :enabledLid", {
          enabledLid: enabledLookup.id,
        });
      }

      if (!isLeadership) {
        qb.andWhere(
          `( opportunity.createdBy IN (:...userIds) OR "opportunity"."id" IN (
            WITH user_results AS (
              SELECT DISTINCT user_id
              FROM employee_hierarchy
              WHERE (true = true AND reporting_user_id = ${currentUserId})
              UNION
              SELECT ${currentUserId} AS user_id
              WHERE ${currentUserId} IS NOT NULL
            ),
            scope_users AS (
              SELECT ${currentUserId} AS user_id
              UNION
              SELECT ur.user_id
              FROM user_results ur
              WHERE true = true
            ),
            opportunity_results AS (
              SELECT DISTINCT opportunity_id
              FROM opportunity_activity_participants
              WHERE participant_id IN (SELECT user_id FROM scope_users)
              UNION
              SELECT DISTINCT opportunity_id
              FROM opportunity_activity_map
              WHERE owner_id IN (SELECT user_id FROM scope_users)
              UNION
              SELECT DISTINCT opportunity_id
              FROM task
              WHERE assignee_id IN (SELECT user_id FROM scope_users)
            )
            SELECT DISTINCT opportunity_id
            FROM opportunity_results
            ORDER BY opportunity_id ))`,
          { userIds: uniqueUserIds }
        );
      }

      if (options?.organisationId) {
        qb.andWhere("opportunity.organisationId = :organisationId", {
          organisationId: options.organisationId,
        });
      }
      if (options?.sbuId) {
        qb.andWhere("opportunity.sbuId = :sbuId", { sbuId: options.sbuId });
      }
      if (options?.verticalId) {
        // Vertical is a multiselect filter — one id or a list.
        const verticalIds = Array.isArray(options.verticalId)
          ? options.verticalId
          : [options.verticalId];
        if (verticalIds.length) {
          qb.andWhere("opportunity.verticalId IN (:...verticalIds)", {
            verticalIds,
          });
        }
      }
      if (options?.departmentId) {
        qb.andWhere("opportunity.departmentId = :departmentId", { departmentId: options.departmentId });
      }
      if (options?.branchId) {
        qb.andWhere("opportunity.branchId IN (:...branchIds)", {
          branchIds: Array.isArray(options.branchId)
            ? options.branchId
            : [options.branchId],
        });
      }
      if (options?.from) {
        qb.andWhere("opportunity.expiryDate >= :from", { from: options.from });
      }
      if (options?.to) {
        qb.andWhere("opportunity.expiryDate <= :to", { to: options.to });
      }
      if (options?.insurerId) {
        qb.andWhere(
          `opportunity.opportunityId IN (
            SELECT oam_ins.opportunity_id
            FROM opportunity_activity_map oam_ins
            INNER JOIN opportunity_placement_slip_generation opsg_ins
              ON opsg_ins.opportunity_activity_id = oam_ins.id
            INNER JOIN opportunity_placement_slip_insurer_map opsim_ins
              ON opsim_ins.placement_slip_id = opsg_ins.id
            WHERE opsim_ins.insurer_id = :renewalInsurerId
          )`,
          { renewalInsurerId: options.insurerId }
        );
      }

      // Opportunities linked to a deactivated SBU are dropped entirely rather
      // than surfacing under the retired SBU's name.
      this.applyActiveSbuFilter(qb);

      const groupedRows = await qb
        .groupBy("opportunity.sbuId")
        .addGroupBy("sbu.name")
        .orderBy("COALESCE(sbu.name, 'Unknown')", "ASC")
        .getRawMany();

      const results = groupedRows.map((row) => {
        // Counts are already per-band (each an independent buffered window from the
        // query) — no cumulative subtraction.
        const next30 = Math.max(parseInt(row?.next30DaysCount ?? "0", 10), 0);
        const next60 = Math.max(parseInt(row?.next60DaysCount ?? "0", 10), 0);
        const next90 = Math.max(parseInt(row?.next90DaysCount ?? "0", 10), 0);
        const beyond90 = Math.max(parseInt(row?.beyond90DaysCount ?? "0", 10), 0);

        return {
          sbuId: Number(row.sbuId),
          sbuName: row.sbuName,
          sourceSbuIds: [Number(row.sbuId)],
          policyExpiryTimeline: bucketOrder.map((label) => ({
            label,
            count:
              label === "30 Days" ? next30
              : label === "60 Days" ? next60
              : label === "90 Days" ? next90
              : beyond90,
          })),
        };
      });

      // Merge rows that have the same normalised SBU name
      const groupedMap = new Map<string, typeof results[0]>();
      for (const row of results) {
        const key = (row.sbuName ?? "").trim().toLowerCase();
        const existing = groupedMap.get(key);
        if (!existing) {
          groupedMap.set(key, { ...row });
        } else {
          if (!existing.sourceSbuIds.includes(row.sbuId)) {
            existing.sourceSbuIds.push(row.sbuId);
          }
          for (const bucket of row.policyExpiryTimeline) {
            const target = existing.policyExpiryTimeline.find((b) => b.label === bucket.label);
            if (target) target.count += bucket.count;
          }
        }
      }

      return this.appendZeroCountSbus(
        Array.from(groupedMap.values()),
        bucketOrder,
        options?.sbuScopeOrgId,
        options?.sbuId
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to fetch sales schedule by SBU: ${(error as Error).message}`
      );
    }
  }
}
