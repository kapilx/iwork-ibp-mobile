import {
  BadRequestException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ClaimActivityMap } from "../../../../service-lib/src/lib/entities";
import { DataSource, EntityManager } from "typeorm";
import {
  ACTION_TYPE,
  ENTITY_NAME,
  LOOK_UP_DATA,
  NON_GROUP_CLAIM_ACTIVITY_STATUS,
  OWNER_TYPES,
} from "../../../../../../libs/service-lib/src/lib/constants";
import {
  mapSearchParams,
  mapSortParams,
} from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { LookUpValidationService } from "../../../../service-lib/src/lib/utils/lookup-validation";
import {
  GetNonGroupClaimQueryDto,
  ValidateNonGroupClaimDto,
} from "./dto/claim-activity-meta.dto";
import {
  SaveClaimAssessmentReportDto,
  SaveClaimCustomerAgreementDto,
  SaveClaimDischargeVoucherDto,
  SaveClaimDocumentsCollectedDto,
  SaveClaimDocumentSubmissionTrackerDto,
  SaveClaimFnolDetailsDto,
  SaveClaimInformedDto,
  SaveClaimJointInspectionReportDto,
  SaveClaimLorDetailsDto,
  SaveClaimLossAdjusterDetailsDto,
  SaveClaimPaymentDto,
  SaveClaimSettlementDto,
  SaveClaimSurveyCompletedDto,
  SaveClaimValidationReportDto,
  SaveClaimVoucherToInsurerDto,
} from "./dto/claim-activity.dto";
import { NonGroupClaimRepository } from "./non-group-claim.repository";

@Injectable()
export class NonGroupClaimService {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly nonGroupClaimRepository: NonGroupClaimRepository,
    private readonly lookUpValidation: LookUpValidationService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.POLICY_SERVICE
    );
  }

  async createNonGroupClaim(
    claimData: ValidateNonGroupClaimDto,
    userId: number,
    entityManager?: EntityManager
  ) {
    try {
      this.logInfo("createNonGroupClaim");
      const createNGClaim = async (manager: EntityManager) => {
        await this.lookUpValidation.validateDynamicLookupValues(
          claimData,
          LOOK_UP_DATA
        );
        const { savedClaim, createdActivities } =
          await this.nonGroupClaimRepository.createNonGroupClaim(
            claimData,
            userId,
            manager
          );
        return {
          claim: savedClaim,
          activities: createdActivities.map((activity) => ({
            id: activity.id,
            activityName: activity.activityName,
            activityTable: activity.activityTable,
          })),
        };
      };
      if (entityManager) {
        return await createNGClaim(entityManager); // Use the provided transaction
      } else {
        return await this.dataSource.transaction(createNGClaim); // Start a new transaction
      }
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

  async getNonGroupClaim(id: number) {
    try {
      this.logInfo("getNonGroupClaim");
      return await this.nonGroupClaimRepository.findNonGroupClaimById(id);
    } catch (error) {
      this.logError("getNonGroupClaim", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get non-group claim: ${error.message}`
      );
    }
  }

  async getAllNonGroupClaims(
    queries: GetNonGroupClaimQueryDto,
    userId: number
  ) {
    try {
      this.logInfo("getAllNonGroupClaims");
      const {
        page,
        limit,
        search,
        sort,
        searchBy,
        field,
        from,
        to,
        period,
        financialYear,
        quarter,
        month,
        ownerId,
        viewBy,
      } = queries;
      const searchParams = search ? mapSearchParams(search) : [];
      if (viewBy && viewBy === OWNER_TYPES.TEAM) {
        searchParams.push({
          searchBy: "owner.userId",
          searchValue: [userId],
        });
        searchParams.push({
          searchBy: "viewByTeam",
          searchValue: [OWNER_TYPES.TEAM],
        });
      } else if ((viewBy && viewBy === OWNER_TYPES.MANAGER) || ownerId) {
        searchParams.push({
          searchBy: "owner.userId",
          searchValue: [userId],
        });
      }
      const sortParams = sort
        ? mapSortParams(sort, ENTITY_NAME.OPPORTUNITY.toUpperCase())
        : [];
      return await this.nonGroupClaimRepository.findAllNonGroupClaims(
        userId,
        page,
        limit,
        searchParams,
        sortParams,
        searchBy,
        field,
        from,
        to,
        period,
        month ? month : quarter,
        financialYear
      );
    } catch (error) {
      this.logError("getAllNonGroupClaims", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get non-group claims: ${error.message}`
      );
    }
  }

  async createClaimActivityMeta(activityMetaData: any, userId: number) {
    try {
      this.logInfo("createClaimActivityMeta");
      if (activityMetaData.claimActivityId == null) {
        // Create new Non-group claim
        if (
          activityMetaData?.data?.claimInformed &&
          activityMetaData.policyId
        ) {
          const createdClaim = await this.createNonGroupClaim(
            { policyId: activityMetaData.policyId },
            userId
          );
          activityMetaData.claimActivityId = createdClaim?.activities?.find(
            (activity) => activity.activityTable === "claim_informed"
          )?.id;
          this.logInfo(
            "createClaimActivityMeta",
            `Created NonGroupClaim with policyId: ${activityMetaData.policyId}`
          );
        } else {
          throw new NotFoundException(
            `Claim activity not found for id: ${activityMetaData.claimActivityId}`
          );
        }
      }
      const claimActivityMapData =
        await this.nonGroupClaimRepository.findClaimActivityMap(
          activityMetaData.claimActivityId
        );

      if (!claimActivityMapData) {
        throw new NotFoundException(
          `Claim activity not found for id: ${activityMetaData.claimActivityId}`
        );
      } else {
        const prevActivityMapData = await this.dataSource
          .createQueryBuilder(ClaimActivityMap, "cam")
          .where("cam.claimId = :claimId", {
            claimId: claimActivityMapData.claimId,
          })
          .andWhere("cam.activityOrder = :activityOrder", {
            activityOrder: Number(claimActivityMapData.activityOrder) - 1,
          })
          .getOne();

        if (prevActivityMapData) {
          if (!prevActivityMapData.completedAt) {
            throw new BadRequestException(
              `Please complete the previous activity: ${prevActivityMapData.activityName} before proceeding to ${claimActivityMapData.activityName}`
            );
          }
        }
        const activityTable = claimActivityMapData.activityTable;

        if (!activityTable) {
          throw new NotFoundException("Activity table not found");
        }

        let action;
        if (
          activityMetaData.statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SUBMIT
        ) {
          action = ACTION_TYPE.SUBMIT;
        } else {
          action = ACTION_TYPE.SAVE;
        }

        // Validate activity data using repository
        const validationErrors =
          await this.nonGroupClaimRepository.validateActivityData(
            activityTable,
            activityMetaData.data,
            action
          );

        if (validationErrors.length > 0) {
          const flattenErrors =
            this.nonGroupClaimRepository.flattenValidationErrors(
              validationErrors
            );
          throw new BadRequestException({
            status: HttpStatus.BAD_REQUEST,
            error: "Bad Request",
            message: flattenErrors,
          });
        }

        return await this.createActivityData(
          claimActivityMapData,
          activityMetaData.claimActivityId,
          activityMetaData.data,
          activityMetaData.statusKey,
          userId
        );
      }
    } catch (error) {
      this.logError("createClaimActivityMeta", error);
      if (error instanceof BadRequestException) {
        throw error?.getResponse() ? error.getResponse() : error;
      } else if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim activity meta: ${error.message}`
      );
    }
  }

  // Activity data operations
  async createActivityData(
    claimActivityMapData: ClaimActivityMap,
    claimActivityId: number,
    activityData: any,
    statusKey: string,
    userId: number
  ) {
    return await this.dataSource.transaction(async (manager) => {
      let savedActivity;

      switch (claimActivityMapData.activityTable) {
        case "claim_informed":
          savedActivity = await this.createClaimInformed(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            claimActivityMapData.claimId,
            userId
          );
          break;
        case "claim_fnol_details":
          savedActivity = await this.createClaimFnolDetails(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        case "claim_loss_adjuster_details":
          savedActivity = await this.createClaimLossAdjusterDetails(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        case "claim_survey_completed":
          savedActivity = await this.createClaimSurveyCompleted(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        case "claim_documents_collected":
          savedActivity = await this.createClaimDocumentsCollected(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        case "claim_joint_inspection_report":
          savedActivity = await this.createClaimJointInspectionReport(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        case "claim_lor_details":
          savedActivity = await this.createClaimLorDetails(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        case "claim_document_submission_tracker":
          savedActivity = await this.createClaimDocumentSubmissionTracker(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        case "claim_assessment_report":
          savedActivity = await this.createClaimAssessmentReport(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        case "claim_validation_report":
          savedActivity = await this.createClaimValidationReport(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        case "claim_settlement":
          savedActivity = await this.createClaimSettlement(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        case "claim_discharge_voucher":
          savedActivity = await this.createClaimDischargeVoucher(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        case "claim_customer_agreement":
          savedActivity = await this.createClaimCustomerAgreement(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        case "claim_voucher_to_insurer":
          savedActivity = await this.createClaimVoucherToInsurer(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        case "claim_payment":
          savedActivity = await this.createClaimPayment(
            manager,
            claimActivityId,
            statusKey,
            claimActivityMapData,
            activityData,
            userId
          );
          break;
        default:
          throw new BadRequestException(
            `Unknown activity table: ${claimActivityMapData.activityTable}`
          );
      }

      return savedActivity;
    });
  }

  // Update activity meta method - delegates to repository
  async updateClaimActivityMeta(
    claimActivityId: number,
    activityMetaData: any,
    userId: number
  ) {
    try {
      activityMetaData.claimActivityId = claimActivityId;
      // Get claim activity map data from repository
      const claimActivityMapData =
        await this.nonGroupClaimRepository.findClaimActivityMap(
          claimActivityId
        );

      if (!claimActivityMapData) {
        throw new NotFoundException(
          `Claim activity not found for id: ${activityMetaData.claimActivityId}`
        );
      } else {
        if (claimActivityMapData.completedAt) {
          throw new BadRequestException(
            `${claimActivityMapData.activityName} activity is already completed`
          );
        }
        const activityTable = claimActivityMapData.activityTable;

        if (!activityTable) {
          throw new NotFoundException("Activity table not found");
        }

        let action;
        if (
          activityMetaData.statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SUBMIT
        ) {
          action = ACTION_TYPE.SUBMIT;
        } else {
          action = ACTION_TYPE.SAVE;
        }

        // Validate activity data using repository
        const validationErrors =
          await this.nonGroupClaimRepository.validateActivityData(
            activityTable,
            activityMetaData.data,
            action
          );

        if (validationErrors.length > 0) {
          const flattenErrors =
            this.nonGroupClaimRepository.flattenValidationErrors(
              validationErrors
            );
          throw new BadRequestException({
            status: HttpStatus.BAD_REQUEST,
            error: "Bad Request",
            message: flattenErrors,
          });
        }

        // Update activity data using repository
        return await this.updateActivityData(
          claimActivityMapData,
          activityMetaData.data,
          activityMetaData.statusKey,
          userId
        );
      }
    } catch (error) {
      this.logError("updateClaimActivityMeta", error);
      if (error instanceof BadRequestException) {
        throw error?.getResponse() ? error.getResponse() : error;
      } else if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim activity meta: ${error.message}`
      );
    }
  }

  // Update activity data operations
  async updateActivityData(
    claimActivityMapData: ClaimActivityMap,
    activityData: any,
    statusKey: string,
    userId: number
  ) {
    return await this.dataSource.transaction(async (manager) => {
      const claimActivityId = claimActivityMapData.id;
      let updatedActivity;

      switch (claimActivityMapData.activityTable) {
        case "claim_informed":
          updatedActivity = await this.updateClaimInformed(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            claimActivityMapData.claimId,
            userId
          );
          break;
        case "claim_fnol_details":
          updatedActivity = await this.updateClaimFnolDetails(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            claimActivityMapData,
            userId
          );
          break;
        case "claim_loss_adjuster_details":
          updatedActivity = await this.updateClaimLossAdjusterDetails(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            userId
          );
          break;
        case "claim_survey_completed":
          updatedActivity = await this.updateClaimSurveyCompleted(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            claimActivityMapData,
            userId
          );
          break;
        case "claim_documents_collected":
          updatedActivity = await this.updateClaimDocumentsCollected(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            claimActivityMapData,
            userId
          );
          break;
        case "claim_joint_inspection_report":
          updatedActivity = await this.updateClaimJointInspectionReport(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            claimActivityMapData,
            userId
          );
          break;
        case "claim_lor_details":
          updatedActivity = await this.updateClaimLorDetails(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            claimActivityMapData,
            userId
          );
          break;
        case "claim_document_submission_tracker":
          updatedActivity = await this.updateClaimDocumentSubmissionTracker(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            claimActivityMapData,
            userId
          );
          break;
        case "claim_assessment_report":
          updatedActivity = await this.updateClaimAssessmentReport(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            claimActivityMapData,
            userId
          );
          break;
        case "claim_validation_report":
          updatedActivity = await this.updateClaimValidationReport(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            userId
          );
          break;
        case "claim_settlement":
          updatedActivity = await this.updateClaimSettlement(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            claimActivityMapData.claimId,
            userId
          );
          break;
        case "claim_discharge_voucher":
          updatedActivity = await this.updateClaimDischargeVoucher(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            claimActivityMapData,
            userId
          );
          break;
        case "claim_customer_agreement":
          updatedActivity = await this.updateClaimCustomerAgreement(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            userId
          );
          break;
        case "claim_voucher_to_insurer":
          updatedActivity = await this.updateClaimVoucherToInsurer(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            claimActivityMapData,
            userId
          );
          break;
        case "claim_payment":
          updatedActivity = await this.updateClaimPayment(
            manager,
            claimActivityId,
            statusKey,
            activityData,
            claimActivityMapData,
            userId
          );
          break;
        default:
          throw new BadRequestException(
            `Unknown activity table: ${activityTable}`
          );
      }

      return updatedActivity;
    });
  }

  async createClaimInformed(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: SaveClaimInformedDto,
    claimId: number,
    userId: number
  ) {
    try {
      this.logInfo("createClaimInformed");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimInformed(
          manager,
          { ...activityData, claimActivityId, statusKey },
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimInformed(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimId,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimInformed(
          claimActivityId,
          manager,
          claimId
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimInformed", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim informed activity: ${error.message}`
      );
    }
  }

  async createClaimFnolDetails(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimFnolDetailsDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimFnolDetails");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimFnolDetails(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimFnolDetails(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimFnolDetails(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimFnolDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim FNOL details activity: ${error.message}`
      );
    }
  }

  async createClaimLossAdjusterDetails(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimLossAdjusterDetailsDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimLossAdjusterDetails");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result =
          await this.nonGroupClaimRepository.saveClaimLossAdjusterDetails(
            manager,
            { ...activityData, claimActivityId, statusKey },
            userId
          );
      } else {
        result =
          await this.nonGroupClaimRepository.submitClaimLossAdjusterDetails(
            manager,
            { ...activityData, claimActivityId, statusKey },
            userId
          );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimLossAdjusterDetails(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimLossAdjusterDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim loss adjuster details activity: ${error.message}`
      );
    }
  }

  async createClaimSurveyCompleted(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimSurveyCompletedDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimSurveyCompleted");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimSurveyCompleted(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimSurveyCompleted(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimSurveyCompleted(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimSurveyCompleted", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim survey completed activity: ${error.message}`
      );
    }
  }

  async createClaimDocumentsCollected(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimDocumentsCollectedDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimDocumentsCollected");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimDocumentsCollected(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result =
          await this.nonGroupClaimRepository.submitClaimDocumentsCollected(
            manager,
            { ...activityData, claimActivityId, statusKey },
            claimActivityMapData,
            userId
          );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimDocumentsCollected(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimDocumentsCollected", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim documents collected activity: ${error.message}`
      );
    }
  }

  async createClaimJointInspectionReport(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimJointInspectionReportDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimJointInspectionReport");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result =
          await this.nonGroupClaimRepository.saveClaimJointInspectionReport(
            manager,
            { ...activityData, claimActivityId, statusKey },
            claimActivityMapData,
            userId
          );
      } else {
        result =
          await this.nonGroupClaimRepository.submitClaimJointInspectionReport(
            manager,
            { ...activityData, claimActivityId, statusKey },
            claimActivityMapData,
            userId
          );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimJointInspectionReport(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimJointInspectionReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim joint inspection report activity: ${error.message}`
      );
    }
  }

  async createClaimLorDetails(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimLorDetailsDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimLorDetails");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimLorDetails(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimLorDetails(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimLorDetails(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimLorDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim LOR details activity: ${error.message}`
      );
    }
  }

  async createClaimDocumentSubmissionTracker(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimDocumentSubmissionTrackerDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimDocumentSubmissionTracker");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result =
          await this.nonGroupClaimRepository.saveClaimDocumentSubmissionTracker(
            manager,
            { ...activityData, claimActivityId, statusKey },
            claimActivityMapData,
            userId
          );
      } else {
        result =
          await this.nonGroupClaimRepository.submitClaimDocumentSubmissionTracker(
            manager,
            { ...activityData, claimActivityId, statusKey },
            claimActivityMapData,
            userId
          );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimDocumentSubmissionTracker(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimDocumentSubmissionTracker", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim document submission tracker activity: ${error.message}`
      );
    }
  }

  async createClaimAssessmentReport(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimAssessmentReportDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimAssessmentReport");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimAssessmentReport(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimAssessmentReport(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimAssessmentReport(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimAssessmentReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim assessment report activity: ${error.message}`
      );
    }
  }

  async createClaimValidationReport(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimValidationReportDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimValidationReport");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimValidationReport(
          manager,
          { ...activityData, claimActivityId, statusKey },
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimValidationReport(
          manager,
          { ...activityData, claimActivityId, statusKey },
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimValidationReport(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimValidationReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim validation report activity: ${error.message}`
      );
    }
  }

  async createClaimSettlement(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimSettlementDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimSettlement");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimSettlement(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData.claimId,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimSettlement(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData.claimId,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimSettlement(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimSettlement", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim settlement activity: ${error.message}`
      );
    }
  }

  async createClaimDischargeVoucher(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimDischargeVoucherDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimDischargeVoucher");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimDischargeVoucher(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimDischargeVoucher(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimDischargeVoucher(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimDischargeVoucher", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim discharge voucher activity: ${error.message}`
      );
    }
  }

  async createClaimCustomerAgreement(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimCustomerAgreementDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimCustomerAgreement");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimCustomerAgreement(
          manager,
          { ...activityData, claimActivityId, statusKey },
          userId
        );
      } else {
        result =
          await this.nonGroupClaimRepository.submitClaimCustomerAgreement(
            manager,
            { ...activityData, claimActivityId, statusKey },
            userId
          );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimCustomerAgreement(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimCustomerAgreement", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim customer agreement activity: ${error.message}`
      );
    }
  }

  async createClaimVoucherToInsurer(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimVoucherToInsurerDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimVoucherToInsurer");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimVoucherToInsurer(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimVoucherToInsurer(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimVoucherToInsurer(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimVoucherToInsurer", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim voucher to insurer activity: ${error.message}`
      );
    }
  }

  async createClaimPayment(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    claimActivityMapData: ClaimActivityMap,
    activityData: SaveClaimPaymentDto,
    userId: number
  ) {
    try {
      this.logInfo("createClaimPayment");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimPayment(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimPayment(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimPayment(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("createClaimPayment", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create claim payment activity: ${error.message}`
      );
    }
  }

  // Update activity methods
  async updateClaimInformed(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    claimId: number,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimInformed");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimInformed(
          manager,
          { ...activityData, claimActivityId, statusKey },
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimInformed(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimId,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimInformed(
          claimActivityId,
          manager,
          claimId
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimInformed", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim informed activity: ${error.message}`
      );
    }
  }

  async updateClaimFnolDetails(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimFnolDetails");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimFnolDetails(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimFnolDetails(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimFnolDetails(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimFnolDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim FNOL details activity: ${error.message}`
      );
    }
  }

  async updateClaimLossAdjusterDetails(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimLossAdjusterDetails");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result =
          await this.nonGroupClaimRepository.saveClaimLossAdjusterDetails(
            manager,
            { ...activityData, claimActivityId, statusKey },
            userId
          );
      } else {
        result =
          await this.nonGroupClaimRepository.submitClaimLossAdjusterDetails(
            manager,
            { ...activityData, claimActivityId, statusKey },
            userId
          );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimLossAdjusterDetails(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimLossAdjusterDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim loss adjuster details activity: ${error.message}`
      );
    }
  }

  async updateClaimSurveyCompleted(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimSurveyCompleted");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimSurveyCompleted(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimSurveyCompleted(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimSurveyCompleted(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimSurveyCompleted", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim survey completed activity: ${error.message}`
      );
    }
  }

  async updateClaimDocumentsCollected(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimDocumentsCollected");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimDocumentsCollected(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result =
          await this.nonGroupClaimRepository.submitClaimDocumentsCollected(
            manager,
            { ...activityData, claimActivityId, statusKey },
            claimActivityMapData,
            userId
          );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimDocumentsCollected(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimDocumentsCollected", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim documents collected activity: ${error.message}`
      );
    }
  }

  async updateClaimJointInspectionReport(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimJointInspectionReport");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result =
          await this.nonGroupClaimRepository.saveClaimJointInspectionReport(
            manager,
            { ...activityData, claimActivityId, statusKey },
            claimActivityMapData,
            userId
          );
      } else {
        result =
          await this.nonGroupClaimRepository.submitClaimJointInspectionReport(
            manager,
            { ...activityData, claimActivityId, statusKey },
            claimActivityMapData,
            userId
          );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimJointInspectionReport(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimJointInspectionReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim joint inspection report activity: ${error.message}`
      );
    }
  }

  async updateClaimLorDetails(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimLorDetails");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimLorDetails(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimLorDetails(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimLorDetails(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimLorDetails", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim LOR details activity: ${error.message}`
      );
    }
  }

  async updateClaimDocumentSubmissionTracker(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimDocumentSubmissionTracker");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result =
          await this.nonGroupClaimRepository.saveClaimDocumentSubmissionTracker(
            manager,
            { ...activityData, claimActivityId, statusKey },
            claimActivityMapData,
            userId
          );
      } else {
        result =
          await this.nonGroupClaimRepository.submitClaimDocumentSubmissionTracker(
            manager,
            { ...activityData, claimActivityId, statusKey },
            claimActivityMapData,
            userId
          );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimDocumentSubmissionTracker(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimDocumentSubmissionTracker", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim document submission tracker activity: ${error.message}`
      );
    }
  }

  async updateClaimAssessmentReport(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimAssessmentReport");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimAssessmentReport(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimAssessmentReport(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimAssessmentReport(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimAssessmentReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim assessment report activity: ${error.message}`
      );
    }
  }

  async updateClaimValidationReport(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimValidationReport");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimValidationReport(
          manager,
          { ...activityData, claimActivityId, statusKey },
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimValidationReport(
          manager,
          { ...activityData, claimActivityId, statusKey },
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimValidationReport(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimValidationReport", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim validation report activity: ${error.message}`
      );
    }
  }

  async updateClaimSettlement(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    claimId: number,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimSettlement");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimSettlement(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimId,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimSettlement(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimId,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimSettlement(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimSettlement", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim settlement activity: ${error.message}`
      );
    }
  }

  async updateClaimDischargeVoucher(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimDischargeVoucher");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimDischargeVoucher(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimDischargeVoucher(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimDischargeVoucher(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimDischargeVoucher", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim discharge voucher activity: ${error.message}`
      );
    }
  }

  async updateClaimCustomerAgreement(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimCustomerAgreement");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimCustomerAgreement(
          manager,
          { ...activityData, claimActivityId, statusKey },
          userId
        );
      } else {
        result =
          await this.nonGroupClaimRepository.submitClaimCustomerAgreement(
            manager,
            { ...activityData, claimActivityId, statusKey },
            userId
          );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimCustomerAgreement(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimCustomerAgreement", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim customer agreement activity: ${error.message}`
      );
    }
  }

  async updateClaimVoucherToInsurer(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimVoucherToInsurer");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimVoucherToInsurer(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimVoucherToInsurer(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimVoucherToInsurer(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimVoucherToInsurer", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim voucher to insurer activity: ${error.message}`
      );
    }
  }

  async updateClaimPayment(
    manager: EntityManager,
    claimActivityId: number,
    statusKey: string,
    activityData: any,
    claimActivityMapData: ClaimActivityMap,
    userId: number
  ) {
    try {
      this.logInfo("updateClaimPayment");
      let result;
      if (statusKey === NON_GROUP_CLAIM_ACTIVITY_STATUS.SAVE) {
        result = await this.nonGroupClaimRepository.saveClaimPayment(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      } else {
        result = await this.nonGroupClaimRepository.submitClaimPayment(
          manager,
          { ...activityData, claimActivityId, statusKey },
          claimActivityMapData,
          userId
        );
      }
      return {
        data: await this.nonGroupClaimRepository.getClaimPayment(
          claimActivityId,
          manager
        ),
        message: result.message,
      };
    } catch (error) {
      this.logError("updateClaimPayment", error);
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to update claim payment activity: ${error.message}`
      );
    }
  }

  // Get claim activity meta - enhanced to handle multiple activities
  async getClaimActivityMeta(claimActivityId: number | number[]) {
    try {
      this.logInfo("getClaimActivityMeta");
      // Convert single ID to array for consistent processing
      const activityIds = Array.isArray(claimActivityId)
        ? claimActivityId
        : [claimActivityId];

      return await this.dataSource.transaction(async (manager) => {
        // Create promises for all activity IDs to process them concurrently
        const activityPromises = activityIds.map(async (id) => {
          // Get claim activity map data
          const claimActivityMapData =
            await this.nonGroupClaimRepository.findClaimActivityMap(id);

          if (!claimActivityMapData) {
            // Return structured response with nulls if not found
            return {
              claimActivityId: id,
              statusKey: null,
              data: null,
              error: `Claim activity not found for id: ${id}`,
            };
          }

          // Get specific activity data based on activity table
          return await this.getActivityDataByTable(
            claimActivityMapData.activityTable,
            id,
            manager
          );
        });

        // Wait for all promises to resolve
        const results = await Promise.all(activityPromises);

        return {
          message: "Claim activity data retrieved successfully",
          data: results,
        };
      });
    } catch (error) {
      this.logError("getClaimActivityMeta", error);
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get claim activity meta: ${error.message}`
      );
    }
  }

  async getActivityDataByTable(
    activityTable: string,
    claimActivityId: number,
    manager: EntityManager
  ) {
    try {
      this.logInfo("getActivityDataByTable");
      switch (activityTable) {
        case "claim_informed": {
          return await this.nonGroupClaimRepository.getClaimInformed(
            claimActivityId,
            manager
          );
        }

        case "claim_fnol_details": {
          return await this.nonGroupClaimRepository.getClaimFnolDetails(
            claimActivityId,
            manager
          );
        }

        case "claim_loss_adjuster_details": {
          return await this.nonGroupClaimRepository.getClaimLossAdjusterDetails(
            claimActivityId,
            manager
          );
        }

        case "claim_survey_completed": {
          return await this.nonGroupClaimRepository.getClaimSurveyCompleted(
            claimActivityId,
            manager
          );
        }

        case "claim_documents_collected": {
          return await this.nonGroupClaimRepository.getClaimDocumentsCollected(
            claimActivityId,
            manager
          );
        }

        case "claim_joint_inspection_report": {
          return await this.nonGroupClaimRepository.getClaimJointInspectionReport(
            claimActivityId,
            manager
          );
        }

        case "claim_lor_details": {
          return await this.nonGroupClaimRepository.getClaimLorDetails(
            claimActivityId,
            manager
          );
        }

        case "claim_document_submission_tracker": {
          return await this.nonGroupClaimRepository.getClaimDocumentSubmissionTracker(
            claimActivityId,
            manager
          );
        }

        case "claim_assessment_report": {
          return await this.nonGroupClaimRepository.getClaimAssessmentReport(
            claimActivityId,
            manager
          );
        }

        case "claim_validation_report": {
          return await this.nonGroupClaimRepository.getClaimValidationReport(
            claimActivityId,
            manager
          );
        }

        case "claim_settlement": {
          return await this.nonGroupClaimRepository.getClaimSettlement(
            claimActivityId,
            manager
          );
        }

        case "claim_discharge_voucher": {
          return await this.nonGroupClaimRepository.getClaimDischargeVoucher(
            claimActivityId,
            manager
          );
        }

        case "claim_customer_agreement": {
          return await this.nonGroupClaimRepository.getClaimCustomerAgreement(
            claimActivityId,
            manager
          );
        }

        case "claim_voucher_to_insurer": {
          return await this.nonGroupClaimRepository.getClaimVoucherToInsurer(
            claimActivityId,
            manager
          );
        }

        case "claim_payment": {
          return await this.nonGroupClaimRepository.getClaimPayment(
            claimActivityId,
            manager
          );
        }

        default:
          this.logInfo(
            "getActivityDataByTable",
            `Unknown activity table: ${activityTable}`
          );
          return null;
      }
    } catch (error) {
      this.logError("getActivityDataByTable", error);
      return null;
    }
  }

  // Get claim activity stepper (template or specific claim)
  async getClaimActivityStepper(claimId?: number) {
    try {
      this.logInfo("getClaimActivityStepper");

      if (claimId) {
        // Get specific claim activities from claim_activity_map
        return await this.nonGroupClaimRepository.getClaimSpecificActivityStepper(
          claimId
        );
      } else {
        // Get template from mstr_claim_stage_activity_template
        return await this.nonGroupClaimRepository.getTemplateActivityStepper();
      }
    } catch (error) {
      this.logError("getClaimActivityStepper", error);
      throw error;
    }
  }

  private logInfo(method: string, messageData = "method invoked") {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "NonGroupClaimService",
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
        location: "NonGroupClaimService",
        method,
        messageData: error,
      }),
    });
  }
}
