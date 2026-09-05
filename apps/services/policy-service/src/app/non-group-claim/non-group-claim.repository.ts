import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { plainToInstance } from "class-transformer";
import { validate, ValidationError } from "class-validator";
import { DataSource, EntityManager, Repository } from "typeorm";
import {
  ACTION_TYPE,
  CLAIM_STATUS,
  DOCUMENT_STATUS,
  NON_GROUP_CLAIM_ACTIVITY_STATUS,
  VALIDATE_CLAIM_ACTIVITY_DATE,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { successMessage } from "../../../../../../libs/service-lib/src/lib/messages";
import {
  formatNameToKey,
  getDurationDates,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import {
  DEFAULT_DATE_FILTER_FIELD,
  nonGroupClaimSearchObject,
  serviceNames,
} from "../../../../service-lib/src/lib/constants";
import {
  ClaimActivityDocumentMap,
  ClaimActivityMap,
  ClaimAssessmentReport,
  ClaimCustomerAgreement,
  ClaimDischargeVoucher,
  ClaimDocumentsCollected,
  ClaimDocumentSubmissionTracker,
  ClaimFnolDetails,
  ClaimInformed,
  ClaimJointInspectionReport,
  ClaimLorDetails,
  ClaimLossAdjusterDetails,
  ClaimPayment,
  ClaimSurveyCompleted,
  ClaimValidationReport,
  ClaimVoucherToInsurer,
  FileUpload,
  LookUp,
  MstrClaimStageActivityTemplate,
  Policy,
  PolicyClaim,
  PolicyClaimSettlement,
  PolicyInsurerMap,
} from "../../../../service-lib/src/lib/entities";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { getDateRange } from "../../../../service-lib/src/lib/utils/get-data-range.utils";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { ValidateNonGroupClaimDto } from "./dto/claim-activity-meta.dto";
import {
  ClaimAssessmentReportDataDto,
  ClaimCustomerAgreementDataDto,
  ClaimDischargeVoucherDataDto,
  ClaimDocumentDto,
  ClaimDocumentsCollectedDataDto,
  ClaimDocumentSubmissionTrackerDataDto,
  ClaimFnolDetailsDataDto,
  ClaimInformedDataDto,
  ClaimJointInspectionReportDataDto,
  ClaimLorDetailsDataDto,
  ClaimLossAdjusterDetailsDataDto,
  ClaimPaymentDataDto,
  ClaimSettlementDataDto,
  ClaimSurveyCompletedDataDto,
  ClaimValidationReportDataDto,
  ClaimVoucherToInsurerDataDto,
  SaveClaimAssessmentReportDataDto,
  SaveClaimAssessmentReportDto,
  SaveClaimCustomerAgreementDataDto,
  SaveClaimCustomerAgreementDto,
  SaveClaimDischargeVoucherDataDto,
  SaveClaimDischargeVoucherDto,
  SaveClaimDocumentsCollectedDataDto,
  SaveClaimDocumentsCollectedDto,
  SaveClaimDocumentSubmissionTrackerDataDto,
  SaveClaimDocumentSubmissionTrackerDto,
  SaveClaimFnolDetailsDataDto,
  SaveClaimFnolDetailsDto,
  SaveClaimInformedDataDto,
  SaveClaimInformedDto,
  SaveClaimJointInspectionReportDataDto,
  SaveClaimJointInspectionReportDto,
  SaveClaimLorDetailsDataDto,
  SaveClaimLorDetailsDto,
  SaveClaimLossAdjusterDetailsDataDto,
  SaveClaimLossAdjusterDetailsDto,
  SaveClaimPaymentDataDto,
  SaveClaimPaymentDto,
  SaveClaimSettlementDataDto,
  SaveClaimSettlementDto,
  SaveClaimSurveyCompletedDataDto,
  SaveClaimSurveyCompletedDto,
  SaveClaimValidationReportDataDto,
  SaveClaimValidationReportDto,
  SaveClaimVoucherToInsurerDataDto,
  SaveClaimVoucherToInsurerDto,
  ValidateClaimAssessmentReportDto,
  ValidateClaimCustomerAgreementDto,
  ValidateClaimDischargeVoucherDto,
  ValidateClaimDocumentsCollectedDto,
  ValidateClaimDocumentSubmissionTrackerDto,
  ValidateClaimFnolDetailsDto,
  ValidateClaimInformedDto,
  ValidateClaimJointInspectionReportDto,
  ValidateClaimLorDetailsDto,
  ValidateClaimLossAdjusterDetailsDto,
  ValidateClaimPaymentDto,
  ValidateClaimSettlementDto,
  ValidateClaimSurveyCompletedDto,
  ValidateClaimValidationReportDto,
  ValidateClaimVoucherToInsurerDto,
} from "./dto/claim-activity.dto";

@Injectable()
export class NonGroupClaimRepository {
  private readonly logger: ReturnType<typeof createLogger>;

  // Activity DTO mapping for validation
  private readonly activityDtoMap = {
    // Stage 1: Claim Intimation
    claim_informed: {
      save: SaveClaimInformedDto,
      validate: ValidateClaimInformedDto,
    },
    claim_fnol_details: {
      save: SaveClaimFnolDetailsDto,
      validate: ValidateClaimFnolDetailsDto,
    },
    // Stage 2: Survey and Documentation
    claim_loss_adjuster_details: {
      save: SaveClaimLossAdjusterDetailsDto,
      validate: ValidateClaimLossAdjusterDetailsDto,
    },
    claim_survey_completed: {
      save: SaveClaimSurveyCompletedDto,
      validate: ValidateClaimSurveyCompletedDto,
    },
    claim_documents_collected: {
      save: SaveClaimDocumentsCollectedDto,
      validate: ValidateClaimDocumentsCollectedDto,
    },
    claim_joint_inspection_report: {
      save: SaveClaimJointInspectionReportDto,
      validate: ValidateClaimJointInspectionReportDto,
    },
    claim_lor_details: {
      save: SaveClaimLorDetailsDto,
      validate: ValidateClaimLorDetailsDto,
    },
    // Stage 3: Assessment and Validation
    claim_document_submission_tracker: {
      save: SaveClaimDocumentSubmissionTrackerDto,
      validate: ValidateClaimDocumentSubmissionTrackerDto,
    },
    claim_assessment_report: {
      save: SaveClaimAssessmentReportDto,
      validate: ValidateClaimAssessmentReportDto,
    },
    claim_validation_report: {
      save: SaveClaimValidationReportDto,
      validate: ValidateClaimValidationReportDto,
    },
    // Stage 4: Settlement
    claim_settlement: {
      save: SaveClaimSettlementDto,
      validate: ValidateClaimSettlementDto,
    },
    claim_discharge_voucher: {
      save: SaveClaimDischargeVoucherDto,
      validate: ValidateClaimDischargeVoucherDto,
    },
    claim_customer_agreement: {
      save: SaveClaimCustomerAgreementDto,
      validate: ValidateClaimCustomerAgreementDto,
    },
    claim_voucher_to_insurer: {
      save: SaveClaimVoucherToInsurerDto,
      validate: ValidateClaimVoucherToInsurerDto,
    },
    claim_payment: {
      save: SaveClaimPaymentDto,
      validate: ValidateClaimPaymentDto,
    },
  };

  constructor(
    private readonly dataSource: DataSource,
    private readonly traceIdService: TraceIdService,
    private readonly scopeService: ScopeService,

    @InjectRepository(PolicyClaim)
    private readonly claimRepository: Repository<PolicyClaim>,
    @InjectRepository(ClaimActivityMap)
    private readonly claimActivityMapRepository: Repository<ClaimActivityMap>,
    @InjectRepository(LookUp)
    private readonly lookUpRepository: Repository<LookUp>
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.POLICY_SERVICE
    );
  }

  async createNonGroupClaim(
    claimData: ValidateNonGroupClaimDto,
    userId: number,
    manager: EntityManager
  ) {
    try {
      this.logInfo("createNonGroupClaim");
      const policy = await manager.findOne(Policy, {
        where: { id: claimData.policyId },
      });
      if (!policy) {
        throw new NotFoundException(
          `Policy not found for id: ${claimData.policyId}`
        );
      }
      if (policy.policyTypeLid) {
        const policyType = await manager.findOne(LookUp, {
          where: { id: policy.policyTypeLid },
        });
        if (!policyType) {
          throw new NotFoundException(
            `Policy type not found for id: ${policy.policyTypeLid}`
          );
        } else {
          // Ensure policy type is non-group
        }
      }
      claimData.companyId = claimData.companyId ?? policy.companyId;
      claimData.opportunityId = claimData.opportunityId ?? policy.opportunityId;

      const newClaim = this.claimRepository.create({
        companyId: claimData.companyId,
        policyId: claimData.policyId,
        opportunityId: claimData.opportunityId,
        claimNumber: `NG-CLM-${Date.now()}`, // generate unique claim number
        createdBy: userId,
        updatedBy: userId,
        claimStatus: CLAIM_STATUS.IN_PROGRESS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const savedClaim = await manager.save(PolicyClaim, newClaim);
      savedClaim.claimNumber = `NG-CLM-${savedClaim.id}`;
      await manager.save(PolicyClaim, savedClaim);
      // create claim activities
      const createdActivities = await this.createClaimActivities(
        savedClaim,
        userId,
        manager
      );
      return { savedClaim, createdActivities };
    } catch (error) {
      this.logError("createNonGroupClaim", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create non-group claim: ${error.message}`
      );
    }
  }

  async createClaimActivities(
    claim: PolicyClaim,
    userId: number,
    manager: EntityManager
  ) {
    try {
      this.logInfo("createClaimActivities");
      // Fetch all activity templates from master table
      const activityTemplates = await manager.find(
        MstrClaimStageActivityTemplate,
        { order: { stageActivityOrder: "ASC" } }
      );

      if (!activityTemplates || activityTemplates.length === 0) {
        throw new BadRequestException(
          `No activity templates found in MstrClaimStageActivityTemplate table`
        );
      }

      // Create claim activity mappings for each template
      const claimActivities: Partial<ClaimActivityMap>[] =
        activityTemplates.map((template) => ({
          policyId: claim.policyId,
          claimId: claim.id,
          activityOrder: template.stageActivityOrder,
          activityName: template.activityName,
          stageName: template.stageName,
          activityTable: template.activityTable,
          activityKey: template.activityKey,
          statusKey: NON_GROUP_CLAIM_ACTIVITY_STATUS.DRAFT, // Default status
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: null,
        }));

      // Save all claim activities in bulk
      const savedActivities = await manager.save(
        ClaimActivityMap,
        claimActivities
      );

      this.logInfo(
        "createClaimActivities",
        `Created ${savedActivities.length} claim activities for claim ID: ${claim.id}`
      );

      return savedActivities;
    } catch (error) {
      this.logError("createClaimActivities", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim activities: ${(error as Error).message}`
      );
    }
  }

  async findNonGroupClaimById(id: number) {
    try {
      this.logInfo("findNonGroupClaimById");
      const claim = await this.claimRepository.findOne({
        where: { id },
      });

      if (!claim) {
        throw new NotFoundException(`Non-group claim with ID ${id} not found`);
      }

      return claim;
    } catch (error) {
      this.logError("findNonGroupClaimById", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to find non-group claim: ${error.message}`
      );
    }
  }

  async findAllNonGroupClaims(
    userId: number,
    page: number,
    limit: number,
    searchArray?: {
      searchBy: string;
      searchValue: string | number | Date | Array<string | number | Date>;
    }[],
    sort?: { field: string; order: "ASC" | "DESC" }[],
    searchBy?: string,
    field?: string,
    fromDate?: Date,
    toDate?: Date,
    period?: string,
    timeFilter?: string,
    financialYear?: number
  ) {
    try {
      this.logInfo("findAllNonGroupClaims");
      let periodStartAndEndDate;
      if (timeFilter || financialYear !== undefined) {
        const range = getDateRange(timeFilter, financialYear);
        if (range.start && range.end) {
          periodStartAndEndDate = {
            field: field ?? DEFAULT_DATE_FILTER_FIELD,
            from: range.start,
            to: range.end,
          };
        }
      } else if (period) {
        try {
          const fromToDate = getDurationDates(period);
          periodStartAndEndDate = {
            field: field ?? DEFAULT_DATE_FILTER_FIELD,
            from: fromToDate.startDate,
            to: fromToDate.endDate,
          };
        } catch (error) {
          throw new BadRequestException(error.message);
        }
      }
      let dateFilter;
      if (fromDate || toDate) {
        dateFilter = {
          field: field ?? DEFAULT_DATE_FILTER_FIELD,
          from: fromDate,
          to: toDate,
        };
      }
      const { data, count } = await this.scopeService.validateOpportunityScope(
        {
          entity: "PolicyClaim",
          page: page,
          limit: limit,
          sort:
            sort && sort.length > 0 ? sort : [{ field: "id", order: "DESC" }],
          relations: ["policy", "company"],
          where: undefined,
          select: undefined,
          searchArray: searchArray,
          userFilter: undefined,
          searchString: searchBy,
          searchOn: nonGroupClaimSearchObject,
          dateFilter:
            dateFilter && Object.keys(dateFilter).length > 0
              ? (dateFilter as { field: string; from: Date; to: Date })
              : undefined,
          secondDateFilter: undefined,
          period: periodStartAndEndDate,
        },
        userId,
        "PolicyClaim"
      );
      if (!data || data.length === 0) {
        return { data: [], count: 0 };
      }
      const transformedClaims = this.transformAllClaimsResponse(data);
      return { data: transformedClaims, count };
    } catch (error) {
      this.logError("findAllNonGroupClaims", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to retrieve non-group claims: ${error.message}`
      );
    }
  }

  transformAllClaimsResponse(claims: any[]): any[] {
    if (!claims || claims.length === 0) {
      return [];
    }

    return claims.map((claim) => {
      return {
        id: claim.id,
        policyId: claim.policy?.id,
        policyName: claim.policy?.policyName || null,
        claimNumber: claim.claimNumber,
        companyId: claim.company?.id,
        companyName: claim.company?.companyName,
        opportunityId: claim.opportunityId || null,
        statusKey: claim.statusKey,
        activeActivity: claim.activeActivity || null,
      };
    });
  }

  // Claim activity management
  async findClaimActivityMap(
    claimActivityId: number
  ): Promise<ClaimActivityMap | null> {
    return await this.claimActivityMapRepository.findOne({
      where: { id: claimActivityId },
    });
  }

  // Get specific claim activity stepper
  async getClaimSpecificActivityStepper(claimId: number) {
    try {
      this.logInfo("getClaimSpecificActivityStepper");

      // Get all activities for the specific claim
      const claimActivities = await this.dataSource
        .getRepository(ClaimActivityMap)
        .find({
          where: { claimId },
          order: { activityOrder: "ASC" },
        });

      if (claimActivities.length === 0) {
        throw new NotFoundException(
          `No activities found for claim ID: ${claimId}`
        );
      }

      // Group activities by stage
      const stageMap = new Map();

      claimActivities.forEach((activity) => {
        if (!stageMap.has(activity.stageName)) {
          stageMap.set(activity.stageName, {
            stageName: activity.stageName,
            stageKey: formatNameToKey(activity.stageName),
            activities: [],
          });
        }

        const stage = stageMap.get(activity.stageName);
        stage.activities.push({
          claimActivityId: activity.id,
          activityId: activity.activityOrder, // Using activityOrder as activityId
          activityOrder: activity.activityOrder,
          activityName: activity.activityName,
          activityKey: activity.activityKey,
          activityTable: activity.activityTable,
          activityStatusKey:
            activity.statusKey || NON_GROUP_CLAIM_ACTIVITY_STATUS.DRAFT,
        });
      });

      // Convert to array and calculate stage statuses
      const stages = Array.from(stageMap.values()).map((stage, index) => ({
        stageId: index + 1,
        stageName: stage.stageName,
        stageKey: stage.stageKey,
        stageStatusKey: this.getStageStatus(
          stage.activities.map((act: any) => act.activityStatusKey)
        ),
        activities: stage.activities,
      }));

      return stages;
    } catch (error) {
      this.logError("getClaimSpecificActivityStepper", error);
      throw error;
    }
  }

  // Get template activity stepper
  async getTemplateActivityStepper() {
    try {
      this.logInfo("getTemplateActivityStepper");

      // Get template activities from master table
      const templateActivities = await this.dataSource
        .getRepository(MstrClaimStageActivityTemplate)
        .find({
          order: { stageId: "ASC", stageActivityOrder: "ASC" },
        });

      if (templateActivities.length === 0) {
        return [];
      }

      // Group activities by stage
      const stageMap = new Map();

      templateActivities.forEach((template) => {
        if (!stageMap.has(template.stageId)) {
          stageMap.set(template.stageId, {
            stageId: template.stageId,
            stageName: template.stageName,
            stageKey: formatNameToKey(template.stageName),
            activities: [],
          });
        }

        const stage = stageMap.get(template.stageId);
        stage.activities.push({
          claimActivityId: null, // No specific claim activity ID for template
          activityId: template.activityId,
          activityOrder: template.stageActivityOrder,
          activityName: template.activityName,
          activityKey: template.activityKey,
          activityTable: template.activityTable,
          activityStatusKey:
            template.activityKey === "claim_informed"
              ? NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE
              : NON_GROUP_CLAIM_ACTIVITY_STATUS.DRAFT, // making fist step to inprogress rest as draft
        });
      });

      // Convert to array and set default stage status
      const stages = Array.from(stageMap.values()).map((stage) => ({
        ...stage,
        stageStatusKey:
          stage?.stageKey === "claim_intimation"
            ? NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE
            : NON_GROUP_CLAIM_ACTIVITY_STATUS.DRAFT, // Default status for template
      }));

      return stages;
    } catch (error) {
      this.logError("getTemplateActivityStepper", error);
      throw error;
    }
  }

  private getStageStatus(activityStatuses: string[]): string {
    if (activityStatuses.includes(NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE))
      return NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE;
    if (
      activityStatuses.every(
        (s) => s === NON_GROUP_CLAIM_ACTIVITY_STATUS.SUBMIT
      )
    )
      return NON_GROUP_CLAIM_ACTIVITY_STATUS.SUBMIT;
    if (
      activityStatuses.every((s) => s === NON_GROUP_CLAIM_ACTIVITY_STATUS.DRAFT)
    )
      return NON_GROUP_CLAIM_ACTIVITY_STATUS.DRAFT;
    return NON_GROUP_CLAIM_ACTIVITY_STATUS.DRAFT; // default fallback
  }

  async checkActivityStatus(statusLid: number): Promise<LookUp | null> {
    return this.lookUpRepository.findOne({ where: { id: statusLid } });
  }

  async saveClaimInformed(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      claimInformed: SaveClaimInformedDataDto;
    },
    userId: number
  ) {
    try {
      this.logInfo("saveClaimInformed");
      const { claimActivityId, statusKey, ...data } = activityData;
      const claimInformed = await manager.findOne(ClaimInformed, {
        where: { claimActivityId: claimActivityId },
      });
      if (claimInformed) {
        Object.assign(claimInformed, {
            ...data.claimInformed,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(ClaimInformed, claimInformed);
      } else {
        await manager.save(ClaimInformed, {
          ...data.claimInformed,
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      return {
        message: successMessage.claimActivity.claimInformed.save,
      };
    } catch (error) {
      this.logError("saveClaimInformed", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim informed data: ${error.message}`
      );
    }
  }

  async submitClaimInformed(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      claimInformed: ClaimInformedDataDto;
    },
    claimId: number,
    userId: number
  ) {
    try {
      this.logInfo("submitClaimInformed");
      await this.saveClaimInformed(manager, activityData, userId);
      // Update claim information
      await manager.update(
        PolicyClaim,
        { id: claimId },
        {
          claimDate: new Date(activityData?.claimInformed?.intimationDatetime),
          updatedBy: userId,
          updatedAt: new Date(),
        }
      );
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.claimInformed.submit,
      };
    } catch (error) {
      this.logError("submitClaimInformed", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim informed data: ${error.message}`
      );
    }
  }

  async saveClaimFnolDetails(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      fonlSentToInsurer: SaveClaimFnolDetailsDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("saveClaimFnolDetails");
      const { claimActivityId, statusKey, ...data } = activityData;
      const claimFnolDetails = await manager.findOne(ClaimFnolDetails, {
        where: { claimActivityId: claimActivityId },
      });
      const { documents, ...fonlData } = data.fonlSentToInsurer;
      if (claimFnolDetails) {
        Object.assign(claimFnolDetails, {
            ...fonlData,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(ClaimFnolDetails, claimFnolDetails);
      } else {
        await manager.save(ClaimFnolDetails, {
          ...fonlData,
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      if (documents) {
        await this.saveClaimDocuments(manager, documents, claimActivityMapData);
      }

      return {
        message: successMessage.claimActivity.fnolDetails.save,
      };
    } catch (error) {
      this.logError("saveClaimFnolDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim FNOL details data: ${error.message}`
      );
    }
  }

  async submitClaimFnolDetails(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      fonlSentToInsurer: ClaimFnolDetailsDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("submitClaimFnolDetails");
      if (activityData?.fonlSentToInsurer?.fnolSentDate) {
        await this.validateDate(
          {
            date: activityData.fonlSentToInsurer.fnolSentDate,
            columnName: "FNOL Sent Date",
          },
          activityData.claimActivityId,
          manager
        );
      }
      await this.saveClaimFnolDetails(
        manager,
        activityData,
        claimActivityMapData,
        userId
      );
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.fnolDetails.submit,
      };
    } catch (error) {
      this.logError("submitClaimFnolDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim FNOL details data: ${error.message}`
      );
    }
  }

  async saveClaimLossAdjusterDetails(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      lossAdjusterAppointment: SaveClaimLossAdjusterDetailsDataDto;
    },
    userId: number
  ) {
    try {
      this.logInfo("saveClaimLossAdjusterDetails");
      const { claimActivityId, statusKey, ...data } = activityData;
      const claimLossAdjusterDetails = await manager.findOne(
        ClaimLossAdjusterDetails,
        { where: { claimActivityId: claimActivityId } }
      );
      if (claimLossAdjusterDetails) {
        Object.assign(claimLossAdjusterDetails, {
          ...data.lossAdjusterAppointment,
          statusKey: statusKey,
          updatedBy: userId,
          updatedAt: new Date(),
        });
        await manager.save(ClaimLossAdjusterDetails, claimLossAdjusterDetails);
      } else {
        await manager.save(ClaimLossAdjusterDetails, {
          ...data.lossAdjusterAppointment,
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      return {
        message: successMessage.claimActivity.lossAdjusterDetails.save,
      };
    } catch (error) {
      this.logError("saveClaimLossAdjusterDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim loss adjuster details data: ${error.message}`
      );
    }
  }

  async submitClaimLossAdjusterDetails(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      lossAdjusterAppointment: ClaimLossAdjusterDetailsDataDto;
    },
    userId: number
  ) {
    try {
      this.logInfo("submitClaimLossAdjusterDetails");
      if (activityData?.lossAdjusterAppointment?.adjusterAppointmentDate) {
        await this.validateDate(
          {
            date: activityData.lossAdjusterAppointment.adjusterAppointmentDate,
            columnName: "Adjuster Appointment Date",
          },
          activityData.claimActivityId,
          manager
        );
      }
      await this.saveClaimLossAdjusterDetails(manager, activityData, userId);
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.lossAdjusterDetails.submit,
      };
    } catch (error) {
      this.logError("submitClaimLossAdjusterDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim loss adjuster details data: ${error.message}`
      );
    }
  }

  async saveClaimSurveyCompleted(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      surveyCompleted: SaveClaimSurveyCompletedDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("saveClaimSurveyCompleted");
      const { claimActivityId, statusKey, ...data } = activityData;
      const claimSurveyCompleted = await manager.findOne(ClaimSurveyCompleted, {
        where: { claimActivityId: claimActivityId },
      });
      const { documents, ...surveyData } = data.surveyCompleted;
      if (claimSurveyCompleted) {
        Object.assign(claimSurveyCompleted, {
            ...surveyData,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(ClaimSurveyCompleted, claimSurveyCompleted);
      } else {
        await manager.save(ClaimSurveyCompleted, {
          ...surveyData,
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      if (documents) {
        await this.saveClaimDocuments(manager, documents, claimActivityMapData);
      }
      return {
        message: successMessage.claimActivity.surveyCompleted.save,
      };
    } catch (error) {
      this.logError("saveClaimSurveyCompleted", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim survey completed data: ${error.message}`
      );
    }
  }

  async submitClaimSurveyCompleted(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      surveyCompleted: ClaimSurveyCompletedDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("submitClaimSurveyCompleted");
      if (activityData?.surveyCompleted?.surveyDate) {
        await this.validateDate(
          {
            date: activityData.surveyCompleted.surveyDate,
            columnName: "Survey Date",
          },
          activityData.claimActivityId,
          manager
        );
      }
      await this.saveClaimSurveyCompleted(
        manager,
        activityData,
        claimActivityMapData,
        userId
      );
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.surveyCompleted.submit,
      };
    } catch (error) {
      this.logError("submitClaimSurveyCompleted", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim survey completed data: ${error.message}`
      );
    }
  }

  async saveClaimDocumentsCollected(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      claimDocumentsCollected: SaveClaimDocumentsCollectedDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("saveClaimDocumentsCollected");
      const { claimActivityId, statusKey, ...data } = activityData;
      const claimDocumentsCollected = await manager.findOne(
        ClaimDocumentsCollected,
        { where: { claimActivityId: claimActivityId } }
      );
      if (claimDocumentsCollected) {
        Object.assign(claimDocumentsCollected, {
            claimActivityId: claimActivityId,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(ClaimDocumentsCollected, claimDocumentsCollected);
      } else {
        await manager.save(ClaimDocumentsCollected, {
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        // create entry in ClaimDocumentSubmissionTracker
        const trackerClaimActivity = await manager.findOne(ClaimActivityMap, {
          where: {
            claimId: claimActivityMapData.claimId,
            activityTable: "claim_document_submission_tracker",
          },
        });
        if (trackerClaimActivity) {
          const claimDocumentsTracker = await manager.findOne(
            ClaimDocumentSubmissionTracker,
            { where: { claimActivityId: trackerClaimActivity.id } }
          );
          if (claimDocumentsTracker) {
            Object.assign(claimDocumentsTracker, {
                claimActivityId: trackerClaimActivity.id,
                refClaimActivityId: claimActivityId,
                updatedAt: new Date(),
              }
            );
            await manager.save(ClaimDocumentSubmissionTracker, claimDocumentsTracker);
          } else {
            await manager.save(ClaimDocumentSubmissionTracker, {
              claimActivityId: trackerClaimActivity.id,
              refClaimActivityId: claimActivityId,
              createdBy: userId,
              createdAt: new Date(),
            });
          }
        }
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      const documents = data?.claimDocumentsCollected?.documents;
      if (documents) {
        await this.saveClaimCollectedDocuments(
          manager,
          documents,
          claimActivityMapData.id,
          claimActivityMapData.policyId,
          claimActivityMapData.claimId
        );
      }
      return {
        message: successMessage.claimActivity.documentsCollected.save,
      };
    } catch (error) {
      this.logError("saveClaimDocumentsCollected", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim documents collected data: ${error.message}`
      );
    }
  }

  async submitClaimDocumentsCollected(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      claimDocumentsCollected: ClaimDocumentsCollectedDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("submitClaimDocumentsCollected");
      await this.saveClaimDocumentsCollected(
        manager,
        activityData,
        claimActivityMapData,
        userId
      );
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.documentsCollected.submit,
      };
    } catch (error) {
      this.logError("submitClaimDocumentsCollected", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim documents collected data: ${error.message}`
      );
    }
  }

  async saveClaimJointInspectionReport(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      claimJointInspectionReport: SaveClaimJointInspectionReportDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("saveClaimJointInspectionReport");
      const { claimActivityId, statusKey, ...data } = activityData;
      const jointInspectionReport = await manager.findOne(
        ClaimJointInspectionReport,
        { where: { claimActivityId: claimActivityId } }
      );
      const { documents, ...jointInspectionReportData } =
        data.claimJointInspectionReport;
      if (jointInspectionReport) {
        Object.assign(jointInspectionReport, {
            ...jointInspectionReportData,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(ClaimJointInspectionReport, jointInspectionReport);
      } else {
        await manager.save(ClaimJointInspectionReport, {
          ...jointInspectionReportData,
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      if (documents) {
        await this.saveClaimDocuments(manager, documents, claimActivityMapData);
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      return {
        message: successMessage.claimActivity.jointInspectionReport.save,
      };
    } catch (error) {
      this.logError("saveClaimJointInspectionReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim joint inspection report data: ${error.message}`
      );
    }
  }

  async submitClaimJointInspectionReport(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      claimJointInspectionReport: ClaimJointInspectionReportDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("submitClaimJointInspectionReport");
      if (activityData?.claimJointInspectionReport?.inspectionDate) {
        await this.validateDate(
          {
            date: activityData.claimJointInspectionReport.inspectionDate,
            columnName: "Inspection Date",
          },
          activityData.claimActivityId,
          manager
        );
      }
      const data = activityData.claimJointInspectionReport;
      if (
        ![data?.client, data?.insurer, data?.adjuster, data?.surveyor].some(
          (value) => Number(value) === 1
        )
      ) {
        throw new BadRequestException(
          "At least one party must be involved in the joint inspection."
        );
      }
      await this.saveClaimJointInspectionReport(
        manager,
        activityData,
        claimActivityMapData,
        userId
      );
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.jointInspectionReport.submit,
      };
    } catch (error) {
      this.logError("submitClaimJointInspectionReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim joint inspection report data: ${error.message}`
      );
    }
  }

  async saveClaimLorDetails(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      letterOfRequirements: SaveClaimLorDetailsDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("saveClaimLorDetails");
      const { claimActivityId, statusKey, ...data } = activityData;
      const claimLorDetails = await manager.findOne(ClaimLorDetails, {
        where: { claimActivityId: claimActivityId },
      });
      const { documents, ...lorData } = data.letterOfRequirements;
      if (claimLorDetails) {
        Object.assign(claimLorDetails, {
            ...lorData,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(ClaimLorDetails, claimLorDetails);
      } else {
        await manager.save(ClaimLorDetails, {
          ...lorData,
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      if (documents) {
        await this.saveClaimDocuments(manager, documents, claimActivityMapData);
      }
      return {
        message: successMessage.claimActivity.lorDetails.save,
      };
    } catch (error) {
      this.logError("saveClaimLorDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim LOR details data: ${error.message}`
      );
    }
  }

  async submitClaimLorDetails(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      letterOfRequirements: ClaimLorDetailsDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("submitClaimLorDetails");
      if (activityData?.letterOfRequirements?.lorIssuedDate) {
        await this.validateDate(
          {
            date: activityData.letterOfRequirements.lorIssuedDate,
            columnName: "LOR Issued Date",
          },
          activityData.claimActivityId,
          manager
        );
      }
      await this.saveClaimLorDetails(
        manager,
        activityData,
        claimActivityMapData,
        userId
      );
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.lorDetails.submit,
      };
    } catch (error) {
      this.logError("submitClaimLorDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim LOR details data: ${error.message}`
      );
    }
  }

  async saveClaimDocumentSubmissionTracker(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      claimDocumentSubmissionTracker: SaveClaimDocumentSubmissionTrackerDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("saveClaimDocumentSubmissionTracker");
      // Implement claim document submission tracker save logic
      const { claimActivityId, statusKey, ...data } = activityData;
      const [claimDocumentSubmissionTracker, documentsCollected] =
        await Promise.all([
          manager.findOne(ClaimDocumentSubmissionTracker, {
            where: { claimActivityId },
          }),
          manager.findOne(ClaimActivityMap, {
            where: {
              activityKey: "documents_collected",
              claimId: claimActivityMapData.claimId,
            },
          }),
        ]);
      if (claimDocumentSubmissionTracker) {
        Object.assign(claimDocumentSubmissionTracker, {
            claimActivityId: claimActivityId,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(ClaimDocumentSubmissionTracker, claimDocumentSubmissionTracker);
      } else {
        await manager.save(ClaimDocumentSubmissionTracker, {
          claimActivityId: claimActivityId,
          refClaimActivityId: documentsCollected?.id,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      const documents = data?.claimDocumentSubmissionTracker?.documents;
      if (documents) {
        await this.saveClaimCollectedDocuments(
          manager,
          documents,
          documentsCollected?.id ?? claimActivityMapData.id,
          claimActivityMapData.policyId,
          claimActivityMapData.claimId
        );
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      return {
        message: successMessage.claimActivity.documentSubmissionTracker.save,
      };
    } catch (error) {
      this.logError("saveClaimDocumentSubmissionTracker", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim document submission tracker data: ${error.message}`
      );
    }
  }

  async submitClaimDocumentSubmissionTracker(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      claimDocumentSubmissionTracker: ClaimDocumentSubmissionTrackerDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("submitClaimDocumentSubmissionTracker");
      // Implement claim document submission tracker submit logic
      await this.saveClaimDocumentSubmissionTracker(
        manager,
        activityData,
        claimActivityMapData,
        userId
      );
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.documentSubmissionTracker.submit,
      };
    } catch (error) {
      this.logError("submitClaimDocumentSubmissionTracker", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim document submission tracker data: ${error.message}`
      );
    }
  }

  async saveClaimAssessmentReport(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      assessmentReport: SaveClaimAssessmentReportDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("saveClaimAssessmentReport");
      // Implement claim assessment report save logic
      const { claimActivityId, statusKey, ...data } = activityData;
      const claimAssessmentReport = await manager.findOne(
        ClaimAssessmentReport,
        { where: { claimActivityId: claimActivityId } }
      );
      const { documents, ...assessmentReportData } = data.assessmentReport;
      if (claimAssessmentReport) {
        Object.assign(claimAssessmentReport, {
            ...assessmentReportData,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(ClaimAssessmentReport, claimAssessmentReport);
      } else {
        await manager.save(ClaimAssessmentReport, {
          ...assessmentReportData,
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      if (documents) {
        await this.saveClaimDocuments(manager, documents, claimActivityMapData);
      }
      return {
        message: successMessage.claimActivity.assessmentReport.save,
      };
    } catch (error) {
      this.logError("saveClaimAssessmentReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim assessment report data: ${error.message}`
      );
    }
  }

  async submitClaimAssessmentReport(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      assessmentReport: ClaimAssessmentReportDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("submitClaimAssessmentReport");
      if (activityData?.assessmentReport?.reportDate) {
        await this.validateDate(
          {
            date: activityData.assessmentReport.reportDate,
            columnName: "Report Date",
          },
          activityData.claimActivityId,
          manager
        );
      }
      // Implement claim assessment report submit logic
      await this.saveClaimAssessmentReport(
        manager,
        activityData,
        claimActivityMapData,
        userId
      );
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.assessmentReport.submit,
      };
    } catch (error) {
      this.logError("submitClaimAssessmentReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim assessment report data: ${error.message}`
      );
    }
  }

  async saveClaimValidationReport(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      validationOfReport: SaveClaimValidationReportDataDto;
    },
    userId: number
  ) {
    try {
      this.logInfo("saveClaimValidationReport");
      // Implement claim validation report save logic
      const { claimActivityId, statusKey, ...data } = activityData;
      const claimValidationReport = await manager.findOne(
        ClaimValidationReport,
        { where: { claimActivityId: claimActivityId } }
      );
      if (claimValidationReport) {
        Object.assign(claimValidationReport, {
            ...data.validationOfReport,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(ClaimValidationReport, claimValidationReport);
      } else {
        await manager.save(ClaimValidationReport, {
          ...data.validationOfReport,
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      return {
        message: successMessage.claimActivity.validationReport.save,
      };
    } catch (error) {
      this.logError("saveClaimValidationReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim validation report data: ${error.message}`
      );
    }
  }

  async submitClaimValidationReport(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      validationOfReport: ClaimValidationReportDataDto;
    },
    userId: number
  ) {
    try {
      this.logInfo("submitClaimValidationReport");
      if (activityData?.validationOfReport?.validationDate) {
        await this.validateDate(
          {
            date: activityData.validationOfReport.validationDate,
            columnName: "Validation Date",
          },
          activityData.claimActivityId,
          manager
        );
      }
      // Implement claim validation report submit logic
      await this.saveClaimValidationReport(manager, activityData, userId);
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.validationReport.submit,
      };
    } catch (error) {
      this.logError("submitClaimValidationReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim validation report data: ${error.message}`
      );
    }
  }

  async saveClaimSettlement(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      claimSettlement: SaveClaimSettlementDataDto;
    },
    claimId: number,
    userId: number
  ) {
    try {
      this.logInfo("saveClaimSettlement");
      // Implement claim settlement save logic
      const { claimActivityId, statusKey, ...data } = activityData;
      const claimSettlement = await manager.findOne(PolicyClaimSettlement, {
        where: { claimActivityId: claimActivityId },
      });
      if (claimSettlement) {
        Object.assign(claimSettlement, {
            ...data.claimSettlement,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(PolicyClaimSettlement, claimSettlement);
      } else {
        await manager.save(PolicyClaimSettlement, {
          ...data.claimSettlement,
          claimId: claimId,
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      return {
        message: successMessage.claimActivity.claimSettlement.save,
      };
    } catch (error) {
      this.logError("saveClaimSettlement", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim settlement data: ${error.message}`
      );
    }
  }

  async submitClaimSettlement(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      claimSettlement: ClaimSettlementDataDto;
    },
    claimId: number,
    userId: number
  ) {
    try {
      this.logInfo("submitClaimSettlement");
      if (activityData?.claimSettlement?.settlementDate) {
        await this.validateDate(
          {
            date: activityData.claimSettlement.settlementDate,
            columnName: "Settlement Date",
          },
          activityData.claimActivityId,
          manager
        );
      }
      await this.saveClaimSettlement(manager, activityData, claimId, userId);
      // Update claim information
      await manager.update(
        PolicyClaim,
        { id: claimId },
        {
          claimAmount: Number(activityData?.claimSettlement?.settlementAmount),
          updatedBy: userId,
          updatedAt: new Date(),
        }
      );
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.claimSettlement.submit,
      };
    } catch (error) {
      this.logError("submitClaimSettlement", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim settlement data: ${error.message}`
      );
    }
  }

  async saveClaimDischargeVoucher(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      dischargeVoucherGeneration: SaveClaimDischargeVoucherDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("saveClaimDischargeVoucher");
      const { claimActivityId, statusKey, ...data } = activityData;
      const claimDischargeVoucher = await manager.findOne(
        ClaimDischargeVoucher,
        { where: { claimActivityId: claimActivityId } }
      );
      const { documents, ...dischargeVoucherGenerationData } =
        data.dischargeVoucherGeneration;
      if (claimDischargeVoucher) {
        Object.assign(claimDischargeVoucher, {
            ...dischargeVoucherGenerationData,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(ClaimDischargeVoucher, claimDischargeVoucher);
      } else {
        await manager.save(ClaimDischargeVoucher, {
          ...dischargeVoucherGenerationData,
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      if (documents) {
        await this.saveClaimDocuments(manager, documents, claimActivityMapData);
      }
      return {
        message: successMessage.claimActivity.dischargeVoucher.save,
      };
    } catch (error) {
      this.logError("saveClaimDischargeVoucher", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim discharge voucher data: ${error.message}`
      );
    }
  }

  async submitClaimDischargeVoucher(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      dischargeVoucherGeneration: ClaimDischargeVoucherDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("submitClaimDischargeVoucher");
      if (activityData?.dischargeVoucherGeneration?.dischargeVoucherDate) {
        await this.validateDate(
          {
            date: activityData.dischargeVoucherGeneration.dischargeVoucherDate,
            columnName: "Discharge Voucher Date",
          },
          activityData.claimActivityId,
          manager
        );
      }
      await this.saveClaimDischargeVoucher(
        manager,
        activityData,
        claimActivityMapData,
        userId
      );
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.dischargeVoucher.submit,
      };
    } catch (error) {
      this.logError("submitClaimDischargeVoucher", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim discharge voucher data: ${error.message}`
      );
    }
  }

  async saveClaimCustomerAgreement(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      customerAgreement: SaveClaimCustomerAgreementDataDto;
    },
    userId: number
  ) {
    try {
      this.logInfo("saveClaimCustomerAgreement");
      const { claimActivityId, statusKey, ...data } = activityData;
      const claimCustomerAgreement = await manager.findOne(
        ClaimCustomerAgreement,
        { where: { claimActivityId: claimActivityId } }
      );
      if (claimCustomerAgreement) {
        Object.assign(claimCustomerAgreement, {
            ...data.customerAgreement,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(ClaimCustomerAgreement, claimCustomerAgreement);
      } else {
        await manager.save(ClaimCustomerAgreement, {
          ...data.customerAgreement,
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      return {
        message: successMessage.claimActivity.customerAgreement.save,
      };
    } catch (error) {
      this.logError("saveClaimCustomerAgreement", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim customer agreement data: ${error.message}`
      );
    }
  }

  async submitClaimCustomerAgreement(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      customerAgreement: ClaimCustomerAgreementDataDto;
    },
    userId: number
  ) {
    try {
      this.logInfo("submitClaimCustomerAgreement");
      if (activityData?.customerAgreement?.agreementDate) {
        await this.validateDate(
          {
            date: activityData.customerAgreement.agreementDate,
            columnName: "Agreement Date",
          },
          activityData.claimActivityId,
          manager
        );
      }
      await this.saveClaimCustomerAgreement(manager, activityData, userId);
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.customerAgreement.submit,
      };
    } catch (error) {
      this.logError("submitClaimCustomerAgreement", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim customer agreement data: ${error.message}`
      );
    }
  }

  async saveClaimVoucherToInsurer(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      voucherToInsurer: SaveClaimVoucherToInsurerDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("saveClaimVoucherToInsurer");
      const { claimActivityId, statusKey, ...data } = activityData;
      const claimVoucherToInsurer = await manager.findOne(
        ClaimVoucherToInsurer,
        { where: { claimActivityId: claimActivityId } }
      );
      const { documents, ...voucherToInsurerData } = data.voucherToInsurer;
      if (claimVoucherToInsurer) {
        Object.assign(claimVoucherToInsurer, {
            ...voucherToInsurerData,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(ClaimVoucherToInsurer, claimVoucherToInsurer);
      } else {
        await manager.save(ClaimVoucherToInsurer, {
          ...voucherToInsurerData,
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      if (documents) {
        await this.saveClaimDocuments(manager, documents, claimActivityMapData);
      }
      return {
        message: successMessage.claimActivity.voucherToInsurer.save,
      };
    } catch (error) {
      this.logError("saveClaimVoucherToInsurer", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim voucher to insurer data: ${error.message}`
      );
    }
  }

  async submitClaimVoucherToInsurer(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      voucherToInsurer: ClaimVoucherToInsurerDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("submitClaimVoucherToInsurer");
      if (activityData?.voucherToInsurer?.sentToInsurerDate) {
        await this.validateDate(
          {
            date: activityData.voucherToInsurer.sentToInsurerDate,
            columnName: "Sent To Insurer Date",
          },
          activityData.claimActivityId,
          manager
        );
      }
      await this.saveClaimVoucherToInsurer(
        manager,
        activityData,
        claimActivityMapData,
        userId
      );
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.voucherToInsurer.submit,
      };
    } catch (error) {
      this.logError("submitClaimVoucherToInsurer", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim voucher to insurer data: ${error.message}`
      );
    }
  }

  async saveClaimPayment(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      claimPayment: SaveClaimPaymentDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("saveClaimPayment");
      const { claimActivityId, statusKey, ...data } = activityData;
      const claimPayment = await manager.findOne(ClaimPayment, {
        where: { claimActivityId: claimActivityId },
      });
      const { documents, ...claimPaymentData } = data.claimPayment;
      if (claimPayment) {
        Object.assign(claimPayment, {
            ...claimPaymentData,
            statusKey: statusKey,
            updatedBy: userId,
            updatedAt: new Date(),
          }
        );
        await manager.save(ClaimPayment, claimPayment);
      } else {
        await manager.save(ClaimPayment, {
          ...claimPaymentData,
          claimActivityId: claimActivityId,
          statusKey: statusKey,
          createdBy: userId,
          updatedBy: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      await this.updateClaimActivityStatus(
        claimActivityId,
        statusKey,
        userId,
        manager
      );
      if (documents) {
        await this.saveClaimDocuments(manager, documents, claimActivityMapData);
      }
      return {
        message: successMessage.claimActivity.claimPayment.save,
      };
    } catch (error) {
      this.logError("saveClaimPayment", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to save claim payment data: ${error.message}`
      );
    }
  }

  async submitClaimPayment(
    manager: EntityManager,
    activityData: {
      claimActivityId: number;
      statusKey: string;
      claimPayment: ClaimPaymentDataDto;
    },
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("submitClaimPayment");
      if (activityData?.claimPayment?.paymentDate) {
        await this.validateDate(
          {
            date: activityData.claimPayment.paymentDate,
            columnName: "Payment Date",
          },
          activityData.claimActivityId,
          manager
        );
      }
      await this.saveClaimPayment(
        manager,
        activityData,
        claimActivityMapData,
        userId
      );
      // update next activity status
      await this.updateNextClaimActivityStatus(
        activityData.claimActivityId,
        manager
      );
      return {
        message: successMessage.claimActivity.claimPayment.submit,
      };
    } catch (error) {
      this.logError("submitClaimPayment", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to submit claim payment data: ${error.message}`
      );
    }
  }

  // Date validation helper
  async validateDate(
    dateDetails: { date: Date; columnName: string },
    claimActivityId: number,
    manager: EntityManager
  ) {
    try {
      this.logInfo("validateDate");
      const currentActivity = await manager.findOne(ClaimActivityMap, {
        where: { id: claimActivityId },
      });
      if (!currentActivity) {
        throw new NotFoundException(
          `Claim activity with ID ${claimActivityId} not found`
        );
      }
      const activityDetails =
        VALIDATE_CLAIM_ACTIVITY_DATE[
          currentActivity.activityTable as keyof typeof VALIDATE_CLAIM_ACTIVITY_DATE
        ];

      if (!activityDetails) {
        throw new BadRequestException(
          `No date validation rules defined for activity table: ${currentActivity.activityTable}`
        );
      }

      const prevActivity = await manager.findOne(ClaimActivityMap, {
        where: {
          claimId: currentActivity.claimId,
          activityTable: activityDetails.activityTable,
        },
      });
      if (!prevActivity) {
        // No previous activity found, skip validation
        return;
      }
      const prevActivityDetails = await manager.findOne(activityDetails.table, {
        where: { claimActivityId: prevActivity.id },
        select: [activityDetails.column],
      });
      const prevActivityDate = new Date(
        prevActivityDetails[activityDetails.column]
      );
      prevActivityDate.setHours(0, 0, 0, 0);

      const currentActivityDate = new Date(dateDetails.date);
      currentActivityDate.setHours(0, 0, 0, 0);

      if (prevActivityDate.getTime() > currentActivityDate.getTime()) {
        throw new BadRequestException(
          `The provided ${dateDetails.columnName} cannot be earlier than the ${activityDetails.columnName} in ${activityDetails.table}.`
        );
      }
    } catch (error) {
      this.logError("validateDate", error);
      throw error;
    }
  }

  // Save claim documents
  async saveClaimDocuments(
    manager: EntityManager,
    documents: ClaimDocumentDto[],
    claimActivityMapData: ClaimActivityMap
  ) {
    try {
      this.logInfo("saveClaimDocuments");
      // 1. Fetch existing documents already mapped
      const existingDocuments = await manager.find(ClaimActivityDocumentMap, {
        where: { claimActivityId: claimActivityMapData.id },
      });
      const existingDocumentIds = existingDocuments?.map((doc) =>
        Number(doc.documentId)
      );

      // If no existing documents AND input documents = [] → do nothing
      if (
        (!documents || documents.length === 0) &&
        existingDocuments.length === 0
      ) {
        return;
      }

      // If documents array is empty but existing documents exist → remove them
      if (documents.length === 0 && existingDocuments.length > 0) {
        await manager.remove(ClaimActivityDocumentMap, existingDocuments);
        return;
      }

      // 2. Validate all provided document IDs exist in FileUpload
      await Promise.all(
        documents.map(async (doc) => {
          if (doc.documentId) {
            const document = await manager.findOne(FileUpload, {
              where: { id: doc.documentId },
            });
            if (!document) {
              throw new NotFoundException(
                `Document with ID ${doc.documentId} not found`
              );
            }
          } else {
            throw new BadRequestException(
              "Document ID is required for each document."
            );
          }
        })
      );

      // 3. Find new documents to add
      const newDocuments = documents.filter(
        (doc) => doc.documentId && !existingDocumentIds.includes(doc.documentId)
      );

      if (newDocuments.length > 0) {
        const claimDocuments: Partial<ClaimActivityDocumentMap>[] =
          newDocuments.map((doc) => ({
            claimActivityId: claimActivityMapData.id,
            documentId: doc.documentId,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));
        await manager.save(ClaimActivityDocumentMap, claimDocuments);

        // Optional: update FileUpload records with claimActivityId
        const newDocIds = newDocuments.map((doc) => doc.documentId);
        await manager
          .createQueryBuilder()
          .update(FileUpload)
          .set({
            policyId: claimActivityMapData.policyId,
            claimId: claimActivityMapData.claimId,
            claimActivityId: claimActivityMapData.id,
          })
          .whereInIds(newDocIds)
          .execute();
      }

      // 4. Find documents to remove
      const documentsToRemove = existingDocuments.filter(
        (doc) => !documents.some((d) => d.documentId === doc.documentId)
      );
      if (documentsToRemove.length > 0) {
        await manager.remove(ClaimActivityDocumentMap, documentsToRemove);
      }
    } catch (error) {
      this.logError("saveClaimDocuments", error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Error saving claim documents: ${error.message}`
      );
    }
  }

  async saveClaimCollectedDocuments(
    manager: EntityManager,
    documents: {
      documentId?: number | null;
      documentLabel?: string | null;
      receivedDate?: Date | null;
      isCustom: number;
    }[],
    claimActivityId: number,
    policyId: number,
    claimId: number
  ) {
    try {
      this.logInfo("saveClaimCollectedDocuments");

      // 1. Fetch existing documents
      const existingDocuments = await manager.find(ClaimActivityDocumentMap, {
        where: { claimActivityId },
      });

      // 2. Validate payload
      await Promise.all(
        documents.map(async (doc) => {
          if (doc.documentId) {
            const exists = await manager.exists(FileUpload, {
              where: { id: doc.documentId },
            });
            if (!exists) {
              throw new NotFoundException(
                `Document with ID ${doc.documentId} not found`
              );
            }
          } else if (!doc.documentLabel || doc.documentLabel.trim() === "") {
            throw new BadRequestException(
              "Document label is required for custom documents."
            );
          }
        })
      );

      // 3. Process each document
      for (const doc of documents) {
        // Try to find matching existing document
        const existing = existingDocuments.find(
          (e) =>
            (doc.documentId && e.documentId === doc.documentId) ||
            (!doc.documentId &&
              !e.documentId &&
              e.documentLabel?.trim().toLowerCase() ===
                doc.documentLabel?.trim().toLowerCase())
        );

        if (existing) {
          // Update existing record
          existing.documentId = doc.documentId ?? existing.documentId;
          existing.documentLabel = doc.documentLabel ?? existing.documentLabel;
          existing.receivedDate = doc.receivedDate ?? existing.receivedDate;
          existing.isCustom = doc.isCustom ?? existing.isCustom;
          existing.documentStatusKey = doc.documentId
            ? DOCUMENT_STATUS.SUBMITTED
            : DOCUMENT_STATUS.PENDING;
          existing.updatedAt = new Date();
          await manager.save(ClaimActivityDocumentMap, existing);

          // Update FileUpload only if documentId exists
          if (doc.documentId) {
            await manager
              .createQueryBuilder()
              .update(FileUpload)
              .set({ policyId, claimId, claimActivityId })
              .where("id = :id", { id: doc.documentId })
              .execute();
          }
        } else {
          // Insert new record
          const newDoc: Partial<ClaimActivityDocumentMap> = {
            claimActivityId,
            documentId: doc.documentId ?? null,
            documentLabel: doc.documentLabel ?? null,
            receivedDate: doc.receivedDate ?? null,
            documentStatusKey: doc.documentId
              ? DOCUMENT_STATUS.SUBMITTED
              : DOCUMENT_STATUS.PENDING,
            isCustom: doc.isCustom ?? null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await manager.save(ClaimActivityDocumentMap, newDoc);

          if (doc.documentId) {
            await manager
              .createQueryBuilder()
              .update(FileUpload)
              .set({ policyId, claimId, claimActivityId })
              .where("id = :id", { id: doc.documentId })
              .execute();
          }
        }
      }

      // 4. Delete documents that exist in DB but not in payload
      const documentsToRemove = existingDocuments.filter(
        (existing) =>
          !documents.some(
            (doc) =>
              (doc.documentId && existing.documentId === doc.documentId) ||
              (!doc.documentId &&
                !existing.documentId &&
                existing.documentLabel?.trim().toLowerCase() ===
                  doc.documentLabel?.trim().toLowerCase())
          )
      );

      if (documentsToRemove.length > 0) {
        await manager.remove(ClaimActivityDocumentMap, documentsToRemove);
      }
    } catch (error) {
      this.logError("saveClaimCollectedDocuments", error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Error saving claim documents: ${error.message}`
      );
    }
  }

  // Validation helper
  async validateActivityData(
    activityTable: string,
    activityData: any,
    action: string
  ): Promise<ValidationError[]> {
    this.logInfo("validateActivityData");
    const dtoMapping =
      this.activityDtoMap[activityTable as keyof typeof this.activityDtoMap];

    if (!dtoMapping) {
      throw new BadRequestException(
        `Unsupported activity table: ${activityTable} not found in the activityDtoMap`
      );
    }

    const dtoInstance = plainToInstance(
      action === ACTION_TYPE.SUBMIT ? dtoMapping.validate : dtoMapping.save,
      activityData
    );
    console.log(dtoInstance);
    this.logInfo("validateActivityData", JSON.stringify(dtoInstance));

    const validationOptions = {
      forbidUnknownValues: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
    };

    return await validate(dtoInstance, validationOptions);
  }

  // Utility method to flatten validation errors
  flattenValidationErrors(errors: ValidationError[]): string[] {
    const result: string[] = [];

    for (const error of errors) {
      if (error.constraints) {
        for (const constraintKey in error.constraints) {
          if (!Object.prototype.hasOwnProperty.call(error.constraints, constraintKey)) continue;
          result.push(
            error.constraints[constraintKey].replace(/^.*?:\s*/, "").trim()
          );
        }
      }

      // Recursively handle nested validation errors
      if (error.children && error.children.length > 0) {
        result.push(...this.flattenValidationErrors(error.children));
      }
    }

    this.logInfo("flattenValidationErrors", JSON.stringify(result));
    return result;
  }

  async transformDocuments(
    manager: EntityManager,
    claimActivityId: number,
    statusKey?: string
  ) {
    try {
      const documents = await manager.find(ClaimActivityDocumentMap, {
        where: { claimActivityId: claimActivityId },
        relations: ["document", "document.owner"],
      });

      if (!documents || documents.length === 0) {
        if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SUBMIT) {
          throw new BadRequestException(
            "At least one document is required to submit this activity."
          );
        }
        return [];
      }
      return documents.map((doc) => ({
        documentId: doc?.documentId ? Number(doc.documentId) : null,
        documentName: doc?.document?.fileKey
          ? doc.document.fileKey.split("/").pop() || null
          : null,
        uploadedAt: doc?.document?.createdAt ?? null,
        uploadedBy: doc?.document?.owner
          ? `${doc.document.owner.firstName} ${doc.document.owner.lastName}`.trim()
          : null,
      }));
    } catch (error) {
      this.logError("transformDocuments", error);
      throw error;
    }
  }

  transformCollectedDocuments(docs: ClaimActivityDocumentMap[] | undefined) {
    if (!docs || docs.length === 0) {
      return [];
    }

    return docs.map((doc) => ({
      documentLabel: doc?.documentLabel ?? null,
      receivedDate: doc?.receivedDate ?? null,
      uploadedDate: doc?.document?.createdAt ?? null,
      documentStatusKey: doc?.documentStatusKey ?? null,
      document: doc?.document
        ? {
            documentId: doc.document.id,
            documentName: doc.document.fileKey
              ? doc.document.fileKey.split("/").pop() || null
              : null,
          }
        : null,
      isCustom: doc?.isCustom ?? null,
    }));
  }

  // Get individual activity methods using TypeORM entity manager
  async getClaimInformed(
    claimActivityId: number,
    manager: EntityManager,
    claimId?: number
  ) {
    try {
      const claimInformed = await manager.findOne(ClaimInformed, {
        where: { claimActivityId: claimActivityId },
      });
      return {
        claimId: claimId,
        claimActivityId: claimActivityId,
        statusKey: claimInformed?.statusKey ?? null,
        data: {
          claimInformed: {
            intimationDatetime: claimInformed?.intimationDatetime ?? null,
            intimatedByKey: claimInformed?.intimatedByKey ?? null,
            intimationChannelKey: claimInformed?.intimationChannelKey ?? null,
            lossLocationId: claimInformed?.lossLocationId ?? null,
            descriptionOfLoss: claimInformed?.descriptionOfLoss ?? null,
          },
        },
      };
    } catch (error) {
      this.logError("getClaimInformed", error);
      throw error;
    }
  }

  async getClaimFnolDetails(claimActivityId: number, manager: EntityManager) {
    try {
      const claimFnolDetails = await manager.findOne(ClaimFnolDetails, {
        where: { claimActivityId: claimActivityId },
      });

      return {
        claimActivityId: claimActivityId,
        statusKey: claimFnolDetails?.statusKey ?? null,
        data: {
          fonlSentToInsurer: {
            fnolSentDate: claimFnolDetails?.fnolSentDate ?? null,
            insurerReferenceNo: claimFnolDetails?.insurerReferenceNo ?? null,
            documents: await this.transformDocuments(
              manager,
              claimActivityId,
              claimFnolDetails?.statusKey
            ),
          },
        },
      };
    } catch (error) {
      this.logError("getClaimFnolDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw error;
    }
  }

  async getClaimLossAdjusterDetails(
    claimActivityId: number,
    manager: EntityManager
  ) {
    try {
      const claimLossAdjusterDetails = await manager.findOne(
        ClaimLossAdjusterDetails,
        { where: { claimActivityId: claimActivityId } }
      );
      return {
        claimActivityId: claimActivityId,
        statusKey: claimLossAdjusterDetails?.statusKey ?? null,
        data: {
          lossAdjusterAppointment: {
            adjusterAppointmentDate:
              claimLossAdjusterDetails?.adjusterAppointmentDate ?? null,
            adjusterName: claimLossAdjusterDetails?.adjusterName ?? null,
            adjusterPhone: claimLossAdjusterDetails?.adjusterPhone ?? null,
            adjusterEmail: claimLossAdjusterDetails?.adjusterEmail ?? null,
            adjusterAppointmentRefNo:
              claimLossAdjusterDetails?.adjusterAppointmentRefNo ?? null,
            adjusterAssignedBy:
              claimLossAdjusterDetails?.adjusterAssignedBy ?? null,
          },
        },
      };
    } catch (error) {
      this.logError("getClaimLossAdjusterDetails", error);
      throw error;
    }
  }

  async getClaimSurveyCompleted(
    claimActivityId: number,
    manager: EntityManager
  ) {
    try {
      const claimSurveyCompleted = await manager.findOne(ClaimSurveyCompleted, {
        where: { claimActivityId: claimActivityId },
      });

      return {
        claimActivityId: claimActivityId,
        statusKey: claimSurveyCompleted?.statusKey ?? null,
        data: {
          surveyCompleted: {
            surveyDate: claimSurveyCompleted?.surveyDate ?? null,
            surveyorName: claimSurveyCompleted?.surveyorName ?? null,
            findingsSummary: claimSurveyCompleted?.findingsSummary ?? null,
            documents: await this.transformDocuments(
              manager,
              claimActivityId,
              claimSurveyCompleted?.statusKey
            ),
          },
        },
      };
    } catch (error) {
      this.logError("getClaimSurveyCompleted", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw error;
    }
  }

  async getClaimDocumentsCollected(
    claimActivityId: number,
    manager: EntityManager
  ) {
    try {
      const claimDocumentsCollected = await manager.findOne(
        ClaimDocumentsCollected,
        { where: { claimActivityId: claimActivityId } }
      );

      const documents = await manager.find(ClaimActivityDocumentMap, {
        where: { claimActivityId: claimActivityId },
        relations: ["document"],
      });

      return {
        claimActivityId: claimActivityId,
        statusKey: claimDocumentsCollected?.statusKey ?? null,
        data: {
          claimDocumentsCollected: {
            documents: this.transformCollectedDocuments(documents),
          },
        },
      };
    } catch (error) {
      this.logError("getClaimDocumentsCollected", error);
      throw error;
    }
  }

  async getClaimJointInspectionReport(
    claimActivityId: number,
    manager: EntityManager
  ) {
    try {
      const [claimJointInspectionReport, activity] = await Promise.all([
        manager.findOne(ClaimJointInspectionReport, {
          where: { claimActivityId },
        }),
        manager.findOne(ClaimActivityMap, {
          where: { id: claimActivityId },
          select: ["id", "policyId", "claimId"],
        }),
      ]);

      let policy, activities, adjuster, surveyor;

      if (activity) {
        [policy, activities] = await Promise.all([
          manager.findOne(Policy, {
            where: { id: activity.policyId },
            relations: ["company"],
          }),
          manager.find(ClaimActivityMap, {
            where: { claimId: activity.claimId },
          }),
        ]);

        const lossAdjusterActivity = activities.find(
          (a) => a.activityKey === "loss_adjuster_details"
        );
        const surveyActivity = activities.find(
          (a) => a.activityKey === "survey_completed"
        );

        [adjuster, surveyor] = await Promise.all([
          lossAdjusterActivity
            ? manager.findOne(ClaimLossAdjusterDetails, {
                where: { claimActivityId: lossAdjusterActivity.id },
                relations: ["insurer"],
              })
            : null,
          surveyActivity
            ? manager.findOne(ClaimSurveyCompleted, {
                where: { claimActivityId: surveyActivity.id },
              })
            : null,
        ]);
      }

      return {
        claimActivityId: claimActivityId,
        statusKey: claimJointInspectionReport?.statusKey ?? null,
        data: {
          claimJointInspectionReport: {
            inspectionDate: claimJointInspectionReport?.inspectionDate ?? null,
            inspectedBy: claimJointInspectionReport?.inspectedBy ?? null,
            client: claimJointInspectionReport?.client ?? null,
            clientName: policy?.company?.companyName ?? null,
            insurer: claimJointInspectionReport?.insurer ?? null,
            insurerName: adjuster?.insurer?.insurerName ?? null,
            adjuster: claimJointInspectionReport?.adjuster ?? null,
            adjusterName: adjuster?.adjusterName ?? null,
            surveyor: claimJointInspectionReport?.surveyor ?? null,
            surveyorName: surveyor?.surveyorName ?? null,
            inspectionFindings:
              claimJointInspectionReport?.inspectionFindings ?? null,
            documents: await this.transformDocuments(
              manager,
              claimActivityId,
              claimJointInspectionReport?.statusKey
            ),
          },
        },
      };
    } catch (error) {
      this.logError("getClaimJointInspectionReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw error;
    }
  }

  async getClaimLorDetails(claimActivityId: number, manager: EntityManager) {
    try {
      const claimLorDetails = await manager.findOne(ClaimLorDetails, {
        where: { claimActivityId: claimActivityId },
      });

      return {
        claimActivityId: claimActivityId,
        statusKey: claimLorDetails?.statusKey ?? null,
        data: {
          letterOfRequirements: {
            lorIssuedDate: claimLorDetails?.lorIssuedDate ?? null,
            issuedByKey: claimLorDetails?.issuedByKey ?? null,
            requiredDocuments: claimLorDetails?.requiredDocuments ?? null,
            documents: await this.transformDocuments(
              manager,
              claimActivityId,
              claimLorDetails?.statusKey
            ),
          },
        },
      };
    } catch (error) {
      this.logError("getClaimLorDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw error;
    }
  }

  async getClaimDocumentSubmissionTracker(
    claimActivityId: number,
    manager: EntityManager
  ) {
    try {
      const documentSubmissionTracker = await manager.findOne(
        ClaimDocumentSubmissionTracker,
        { where: { claimActivityId: claimActivityId } }
      );
      let documents: ClaimActivityDocumentMap[] = [];
      if (documentSubmissionTracker) {
        documents = await manager.find(ClaimActivityDocumentMap, {
          where: {
            claimActivityId: documentSubmissionTracker?.refClaimActivityId,
          },
          relations: ["document"],
        });
      }

      return {
        claimActivityId: claimActivityId,
        statusKey: documentSubmissionTracker?.statusKey ?? null,
        data: {
          claimDocumentSubmissionTracker: {
            documents: this.transformCollectedDocuments(documents),
          },
        },
      };
    } catch (error) {
      this.logError("getClaimDocumentSubmissionTracker", error);
      throw error;
    }
  }

  async getClaimAssessmentReport(
    claimActivityId: number,
    manager: EntityManager
  ) {
    try {
      const claimAssessmentReport = await manager.findOne(
        ClaimAssessmentReport,
        { where: { claimActivityId: claimActivityId } }
      );

      return {
        claimActivityId: claimActivityId,
        statusKey: claimAssessmentReport?.statusKey ?? null,
        data: {
          assessmentReport: {
            reportDate: claimAssessmentReport?.reportDate ?? null,
            reportByKey: claimAssessmentReport?.reportByKey ?? null,
            assessedLossAmount:
              claimAssessmentReport?.assessedLossAmount ?? null,
            keyObservations: claimAssessmentReport?.keyObservations ?? null,
            documents: await this.transformDocuments(
              manager,
              claimActivityId,
              claimAssessmentReport?.statusKey
            ),
          },
        },
      };
    } catch (error) {
      this.logError("getClaimAssessmentReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw error;
    }
  }

  async getClaimValidationReport(
    claimActivityId: number,
    manager: EntityManager
  ) {
    try {
      const claimValidationReport = await manager.findOne(
        ClaimValidationReport,
        { where: { claimActivityId: claimActivityId } }
      );
      return {
        claimActivityId: claimActivityId,
        statusKey: claimValidationReport?.statusKey ?? null,
        data: {
          validationOfReport: {
            validatorName: claimValidationReport?.validatorName ?? null,
            validationStatusKey:
              claimValidationReport?.validationStatusKey ?? null,
            validationDate: claimValidationReport?.validationDate ?? null,
            remarks: claimValidationReport?.remarks ?? null,
          },
        },
      };
    } catch (error) {
      this.logError("getClaimValidationReport", error);
      throw error;
    }
  }

  async getClaimSettlement(claimActivityId: number, manager: EntityManager) {
    try {
      const claimSettlement = await manager.findOne(PolicyClaimSettlement, {
        where: { claimActivityId: claimActivityId },
      });
      return {
        claimActivityId: claimActivityId,
        statusKey: claimSettlement?.statusKey ?? null,
        data: {
          claimSettlement: {
            settlementDate: claimSettlement?.settlementDate ?? null,
            settlementAmount: claimSettlement?.settlementAmount ?? null,
            approvedBy: claimSettlement?.approvedBy ?? null,
            modeOfSettlementKey: claimSettlement?.modeOfSettlementKey ?? null,
          },
        },
      };
    } catch (error) {
      this.logError("getClaimSettlement", error);
      throw error;
    }
  }

  async getClaimDischargeVoucher(
    claimActivityId: number,
    manager: EntityManager
  ) {
    try {
      const claimDischargeVoucher = await manager.findOne(
        ClaimDischargeVoucher,
        { where: { claimActivityId: claimActivityId } }
      );

      return {
        claimActivityId: claimActivityId,
        statusKey: claimDischargeVoucher?.statusKey ?? null,
        data: {
          dischargeVoucherGeneration: {
            dischargeVoucherNumber:
              claimDischargeVoucher?.dischargeVoucherNumber ?? null,
            dischargeVoucherDate:
              claimDischargeVoucher?.dischargeVoucherDate ?? null,
            dischargeVoucherAmount:
              claimDischargeVoucher?.dischargeVoucherAmount ?? null,
            documents: await this.transformDocuments(
              manager,
              claimActivityId,
              claimDischargeVoucher?.statusKey
            ),
          },
        },
      };
    } catch (error) {
      this.logError("getClaimDischargeVoucher", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw error;
    }
  }

  async getClaimCustomerAgreement(
    claimActivityId: number,
    manager: EntityManager
  ) {
    try {
      const claimCustomerAgreement = await manager.findOne(
        ClaimCustomerAgreement,
        { where: { claimActivityId: claimActivityId } }
      );
      return {
        claimActivityId: claimActivityId,
        statusKey: claimCustomerAgreement?.statusKey ?? null,
        data: {
          customerAgreement: {
            agreementDate: claimCustomerAgreement?.agreementDate ?? null,
            customerConfirmationKey:
              claimCustomerAgreement?.customerConfirmationKey ?? null,
            remarks: claimCustomerAgreement?.remarks ?? null,
          },
        },
      };
    } catch (error) {
      this.logError("getClaimCustomerAgreement", error);
      throw error;
    }
  }

  async getClaimVoucherToInsurer(
    claimActivityId: number,
    manager: EntityManager
  ) {
    try {
      const claimVoucherToInsurer = await manager.findOne(
        ClaimVoucherToInsurer,
        { where: { claimActivityId: claimActivityId } }
      );

      return {
        claimActivityId: claimActivityId,
        statusKey: claimVoucherToInsurer?.statusKey ?? null,
        data: {
          voucherToInsurer: {
            sentToInsurerDate: claimVoucherToInsurer?.sentToInsurerDate ?? null,
            acknowledgementRefNo:
              claimVoucherToInsurer?.acknowledgementRefNo ?? null,
            documents: await this.transformDocuments(
              manager,
              claimActivityId,
              claimVoucherToInsurer?.statusKey
            ),
          },
        },
      };
    } catch (error) {
      this.logError("getClaimVoucherToInsurer", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw error;
    }
  }

  async getClaimPayment(claimActivityId: number, manager: EntityManager) {
    try {
      const claimPayment = await manager.findOne(ClaimPayment, {
        where: { claimActivityId: claimActivityId },
      });

      return {
        claimActivityId: claimActivityId,
        statusKey: claimPayment?.statusKey ?? null,
        data: {
          claimPayment: {
            paymentDate: claimPayment?.paymentDate ?? null,
            paymentReferenceNo: claimPayment?.paymentReferenceNo ?? null,
            paidAmount: claimPayment?.paidAmount ?? null,
            modeOfPaymentKey: claimPayment?.modeOfPaymentKey ?? null,
            documents: await this.transformDocuments(
              manager,
              claimActivityId,
              claimPayment?.statusKey
            ),
          },
        },
      };
    } catch (error) {
      this.logError("getClaimPayment", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw error;
    }
  }

  async updateClaimActivityStatus(
    claimActivityId: number,
    statusKey: string,
    userId: number,
    manager: EntityManager
  ) {
    await manager.update(
      ClaimActivityMap,
      { id: claimActivityId },
      { statusKey: statusKey, updatedAt: new Date(), updatedBy: userId }
    );
  }

  async updateNextClaimActivityStatus(
    claimActivityId: number,
    manager: EntityManager
  ) {
    try {
      this.logInfo("updateNextClaimActivityStatus");
      const currentActivity = await manager.findOne(ClaimActivityMap, {
        where: { id: claimActivityId },
        select: ["id", "claimId", "activityOrder", "activityName"],
      });
      if (!currentActivity) {
        throw new NotFoundException(
          `Claim activity with ID ${claimActivityId} not found`
        );
      }
      Object.assign(currentActivity, { completedAt: new Date() });
      await manager.save(ClaimActivityMap, currentActivity);
      await manager.update(
        PolicyClaim,
        { id: currentActivity.claimId },
        { activeActivity: currentActivity.activityName, updatedAt: new Date() }
      );
      const nextActivity = await manager.findOne(ClaimActivityMap, {
        where: {
          claimId: currentActivity.claimId,
          activityOrder: Number(currentActivity.activityOrder) + 1,
        },
        select: ["id", "statusKey"],
      });
      if (nextActivity) {
        Object.assign(nextActivity, { statusKey: NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE });
        await manager.save(ClaimActivityMap, nextActivity);
      }
    } catch (error) {
      this.logError("updateNextClaimActivityStatus", error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update next claim activity status: ${error.message}`
      );
    }
  }

  private logInfo(method: string, messageData = "method invoked") {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "NonGroupClaimRepository",
        method,
        messageData,
      }),
    });
  }

  private logError(method: string, error: any) {
    this.logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "failure",
        location: "NonGroupClaimRepository",
        method,
        messageData: error,
      }),
    });
  }
}
