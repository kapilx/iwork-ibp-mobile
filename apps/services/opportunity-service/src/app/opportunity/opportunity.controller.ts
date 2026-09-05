import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request, Response } from "express";
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  ApiResponse,
  createErrorResponse,
  createResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";
import { DEFAULT_VALUES, serviceNames } from "../../../../service-lib/src/lib/constants";
import { Opportunity } from "../../../../service-lib/src/lib/entities";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { getDateRange } from "../../../../service-lib/src/lib/utils/get-data-range.utils";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  CreateBrokingSlipVersionDto
} from "./dto/create-broking-slip-version.dto";
import { CreateDeviationTaskDto } from "./dto/create-deviation-task.dto";
import {
  CreateOpportunityLostDto,
  UpdateOpportunityLostDto,
} from "./dto/create-opportunity-lost.dto";
import {
  CreateOpportunityDto,
  RenewalOpportunityDto,
} from "./dto/create-opportunity.dto";
import { UpdateQuoteComparisonReportDto } from "./dto/create-quote-comparison-report.dto";
import { CreateQuoteDto, UpdateQuoteDto } from "./dto/create-quote-entry.dto";
import { QuoteComparisonReportDto } from "./dto/generate-quote-comparison-report.dto";
import {
  BrokingSlipVersionDetailsDtoWithId,
  SaveBrokingSlipDataDto,
} from "./dto/get-broking-slip-details-by-version.dto";
import { GetPendingActivitiesSummaryDto } from "./dto/get-pending-activities-summary.dto";
import { OpportunityActivitiesDto } from "./dto/opportunity-activity.dto";
import { OpportunityBulkUpdateDto } from "./dto/opportunity-bulk-update.dto";
import { OpportunityClaimExperienceDto } from "./dto/opportunity-claim-experience.dto";
import { OpportunityContactMapDto } from "./dto/opportunity-contact-map.dto";
import { OpportunityDocumentDto } from "./dto/opportunity-document.dto";
import { OpportunityPreviousPlacementDetailsDto } from "./dto/opportunity-previous-placement-details.dto";
import {
  ExcelGenerationDto,
  GetOpportunityBrokerageSummaryDto,
  GetOpportunityMonthlyBrokerageBreakdown,
  GetOpportunityQueryDto,
  GetRenewalScheduleBySbuDto,
  GetScopeSummaryDto,
  GetCompanySummaryDto,
} from "./dto/opportunity-query-param.dto";
import { UpdateRfpDetailsEntryDto } from "./dto/opportunity-rfp-details-entry.dto";
import { OpportunityRiskLocationDto } from "./dto/opportunity-risk-locations.dto";
import { OpportunityDto } from "./dto/opportunity.dto";
import { UpdateHeldCoverNoteDto } from "./dto/update-held-cover-note.dto";
import {
  ExtendOpportunityDto,
  UpdateOpportunityDto,
} from "./dto/update-opportunity.dto";
import { UpdatePlacementSlipDto } from "./dto/update-placement-slip.dto";
import { UpdatePolicyConfirmationDto } from "./dto/update-policy-confirmation.dto";
import { UpdatePolicyHardCopyDto } from "./dto/update-policy-hard-copy.dto";
import { UpdatePremiumCalculationDto } from "./dto/update-premium-calculation.dto";
import { UpdateStageOwnerDto } from "./dto/update-stage-owner.dto";
import { OpportunityService } from "./opportunity.service";
import {
  addQuoteFromFinalNegotiationSwaggerMetadata,
  bulkUpdateOpportunitiesSwaggerMetadata,
  createDeviationTaskSwaggerMetadata,
  createOpportunityActivitySwaggerMetadata,
  createOpportunityLostSwaggerMetadata,
  createOpportunitySwaggerMetadata,
  deleteBrokingSlipVersionSwaggerMetadata,
  deleteOpportunityByIdSwaggerMetadata,
  deletePlacementSlipSwaggerMetadata,
  deleteQuoteEntrySwaggerMetadata,
  extendOpportunityExpirySwaggerMetadata,
  generateQuoteComparisonReportSwaggerMetadata,
  getActivityDetailsSwaggerMetadata,
  getAllBrokingSlipVersionsSwaggerMetadata,
  getAllOpportunitiesSwaggerMetadata,
  getBrokerageSummarySwaggerMetadata,
  getBrokingSlipByOpportunityActivityIdSwaggerMetadata,
  getBrokingSlipByVersionIdSwaggerMetadata,
  getBrokingSlipExcelDataSwaggerMetadata,
  getBrokingSlipVersionsByOpportunityIdSwaggerMetadata,
  getCautionDepositsByCompanySwaggerMetadata,
  getCoverDataPrefillSwaggerMetadata,
  getExcelGenerationUrlSwaggerMetadata,
  getExistingMandateDetailsSwaggerMetadata,
  getFinalNegotiationActivitySwaggerMetadata,
  getOpportunitiesByCompanyIdSwaggerMetadata,
  getOpportunitiesByContactIdSwaggerMetadata,
  getOpportunityActivityByIdSwaggerMetadata,
  getOpportunityHistorySwaggerMetadata,
  getOpportunityActivityMetaSwaggerMetadata,
  getOpportunityActivitySwaggerMetadata,
  getOpportunityActivityTasksSwaggerMetadata,
  getOpportunityBrokerageSummarySwaggerMetadata,
  getOpportunityByIdSwaggerMetadata,
  getOpportunityContactsSwaggerMetadata,
  getOpportunityCoversMetaSwaggerMetadata,
  getOpportunityDocumentsSwaggerMetadata,
  getPendingActivitiesSummarySwaggerMetadata,
  getPolicyConfirmationCdAccountDetailsSwaggerMetadata,
  getPreferredInsurersSwaggerMetadata,
  getQuoteByBrokingSlipAndActivitySwaggerMetadata,
  getQuoteByIdSwaggerMetadata,
  getQuoteEntryDetailsSwaggerMetadata,
  getQuotesBasedOnOpportunityActivityIdSwaggerMetadata,
  getQuotesByBrokingSlipSwaggerMetadata,
  getRenewalOpportunitiesSwaggerMetadata,
  getRfpDataByOpportunityIdSwaggerMetadata,
  getSalesFunnelSwaggerMetadata,
  getStageDetailsSwaggerMetadata,
  getStageOwnersByOpportunityIdSwaggerMetadata,
  opportunityActivityApprovalSwaggerMetadata,
  regenerateRenewalOpportunitySwaggerMetadata,
  updateBrokingSlipVersionSwaggerMetadata,
  updateHeldCoverNoteByIdSwaggerMetadata,
  updateOpportunityActivitiesSwaggerMetadata,
  updateOpportunityActivityMetaSwaggerMetadata,
  updateOpportunityByIdSwaggerMetadata,
  updateOpportunityLostSwaggerMetadata,
  updateOpportunityQuoteByActivityIdSwaggerMetadata,
  updatePlacementSlipSwaggerMetadata,
  updatePolicyConfirmationByIdSwaggerMetadata,
  updatePolicyHardCopyByIdSwaggerMetadata,
  updatePremiumCalculationSwaggerMetadata,
  updateQuoteComparisonReportByIdSwaggerMetadata,
  updateQuoteSwaggerMetadata,
  updateRfpDetailsSwaggerMetadata,
  updateStageOwnerSwaggerMetadata
} from "./opportunity.swagger";

@Controller("opportunity")
export class OpportunityController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private opportunityService: OpportunityService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService,
    private readonly jwtService: JwtService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.OPPORTUNITY_SERVICE
    );
  }

  // Creates a new opportunity by delegating the service.
  @Post()
  @createOpportunitySwaggerMetadata()
  async createOpportunity(
    @Body() createOpportunityDto: CreateOpportunityDto,
    @Body("riskLocations")
    opportunityRiskLocations: OpportunityRiskLocationDto[],
    @Body("claimExperiences")
    opportunityClaimExperiences: OpportunityClaimExperienceDto[],
    @Body("documents") opportunityDocuments: OpportunityDocumentDto[],
    @Body("previousPlacementDetails")
    previousPlacementDetails: OpportunityPreviousPlacementDetailsDto[],
    @Body("contacts") contacts: OpportunityContactMapDto[],
    @Req()
    req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      createOpportunityDto.createdBy = userId;
      createOpportunityDto.updatedBy = userId;
      createOpportunityDto.ownerId = userId;
      const opportunity = await this.opportunityService.createOpportunity(
        createOpportunityDto,
        opportunityRiskLocations,
        opportunityClaimExperiences,
        opportunityDocuments,
        previousPlacementDetails,
        contacts,
        userId
      );
      return createResponse(
        HttpStatus.CREATED,
        successMessage.opportunityCreated,
        opportunity
      );
    } catch (error) {
      console.error("Error in getOpportunityActivityMeta:", error);
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.opportunityCreationFailed
      );
    }
  }

  // Bulk update opportunities endpoint
  @Post("bulk-update")
  @bulkUpdateOpportunitiesSwaggerMetadata()
  async bulkUpdateOpportunities(
    @Body() bulkUpdateDto: OpportunityBulkUpdateDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const userId =
        bulkUpdateDto.userId || parseInt(req?.headers?.userid as string);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "OpportunityController",
          method: "bulkUpdateOpportunities",
          payload: {
            recordCount: bulkUpdateDto.recordIds?.length || 0,
            updateCount: Object.keys(bulkUpdateDto.fieldUpdates || {}).length,
            userId: bulkUpdateDto.userId,
          },
          messageData: "method invoked",
        }),
      });

      // Validate required fields based on selectedAll flag
      if (!bulkUpdateDto.selectedAll && !bulkUpdateDto.recordIds?.length) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "recordIds is required when selectedAll is false"
            )
          );
      }

      if (
        bulkUpdateDto.fieldUpdates &&
        Object.keys(bulkUpdateDto.fieldUpdates).length === 0
      ) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "fieldUpdates is required and must contain at least one field update"
            )
          );
      }

      // Call the opportunity service bulk update method
      const result = await this.opportunityService.bulkUpdateOpportunities(
        bulkUpdateDto.recordIds || [],
        bulkUpdateDto.fieldUpdates,
        userId,
        bulkUpdateDto.selectedAll,
        bulkUpdateDto.excludedIds,
        bulkUpdateDto.selectedFilterValues
      );

      const statusCode =
        result.failureCount > 0 ? HttpStatus.PARTIAL_CONTENT : HttpStatus.OK;
      const message =
        result.failureCount > 0
          ? `Bulk update completed with ${result.failureCount} failures out of ${result.totalRecords} records`
          : `Successfully updated ${result.successCount} opportunities`;
      return res
        .status(statusCode)
        .json(createResponse(statusCode, message, result));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: parseInt(req?.headers?.userid as string),
          status: "failure",
          location: "OpportunityController",
          method: "bulkUpdateOpportunities",
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.opportunityNotFound || "Opportunity not found",
        errorMessages.opportunityUpdateFailed || "Opportunity update failed",
        errorMessages.opportunityUpdateFailed ||
          "Opportunity bulk update failed"
      );
    }
  }

  // Retrieves a list of opportunities based on the provided query parameters.
  @Get()
  @getAllOpportunitiesSwaggerMetadata()
  async getAllOpportunityList(
    @Query() queries: GetOpportunityQueryDto,
    @Res() res: Response,
    @Req() req: Request
  ): Promise<Response<ApiResponse<OpportunityDto[]>>> {
    try {
      const {
        sort,
        page,
        limit,
        search,
        searchBy,
        field,
        from,
        to,
        period,
        month,
        quarter,
        financialYear,
        type,
        optyType,
        ownerId,
        viewBy,
        funnel,
        isPendingActivity,
        insurerId,
        insurerBranchId,
        branchViewBy,
        companyGrain,
      } = queries;
      const userId = parseInt(req?.headers?.userid);

      const opportunities = await this.opportunityService.getAllOpportunityList(
        type || DEFAULT_VALUES.OPPORTUNITY_TYPE,
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT,
        search || "",
        sort,
        searchBy,
        userId,
        field,
        from,
        to || null,
        period,
        month ? month : quarter,
        financialYear,
        ownerId,
        viewBy,
        funnel,
        isPendingActivity,
        insurerId,
        optyType,
        insurerBranchId,
        branchViewBy,
        companyGrain === "true"
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.opportunityListRetrieved,
            opportunities
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.opportunityListRetrievalFailed
          )
        );
    }
  }

  // Enqueue an async SO/RO listing export as a background job — mirrors
  // policy-service's GET bizdone-report-excel/export. Stores the exact query
  // the user applied; the worker replays it through getAllOpportunityList so
  // the async output matches what the listing screen shows.
  @Get("so-report-excel/export")
  async queueSoReportExcelExport(
    @Query() query: GetOpportunityQueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.opportunityService.enqueueOpportunityReportExport(
        userId,
        query as unknown as Record<string, unknown>
      );
      return res
        .status(HttpStatus.ACCEPTED)
        .json(createResponse(HttpStatus.ACCEPTED, "Report export queued", data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("so-report-excel/exports")
  async listSoReportExcelExports(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.opportunityService.listSoReportExports(userId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Report exports", data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }


  @Get("so-report-excel/export/:jobId")
  async getSoReportExcelExportStatus(
    @Param("jobId", ParseIntPipe) jobId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.opportunityService.getOpportunityReportExportStatus(
        jobId,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Report export status", data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }


  @Get("so-report-excel/export/:jobId/download")
  async downloadSoReportExcelExport(
    @Param("jobId", ParseIntPipe) jobId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const result = await this.opportunityService.downloadOpportunityReportExportFile(
        jobId,
        userId
      );
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, "Report export file retrieved", {
          fileName: result.fileName,
          mimeType: result.mimeType,
          buffer: result.buffer,
        })
      );
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }


  @Get("ro-report-excel/export")
  async queueRoReportExcelExport(
    @Query() query: GetOpportunityQueryDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data =
        await this.opportunityService.enqueueRenewalOpportunityReportExport(
          userId,
          query as unknown as Record<string, unknown>
        );
      return res
        .status(HttpStatus.ACCEPTED)
        .json(createResponse(HttpStatus.ACCEPTED, "Report export queued", data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("ro-report-excel/exports")
  async listRoReportExcelExports(
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.opportunityService.listRoReportExports(userId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Report exports", data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  // Poll the status of a queued RO export. Status polling is scoped only by
  // jobId + userId (not reportType), so this reuses the exact same service
  // method the SO status route calls.
  @Get("ro-report-excel/export/:jobId")
  async getRoReportExcelExportStatus(
    @Param("jobId", ParseIntPipe) jobId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.opportunityService.getOpportunityReportExportStatus(
        jobId,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Report export status", data));
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("ro-report-excel/export/:jobId/download")
  async downloadRoReportExcelExport(
    @Param("jobId", ParseIntPipe) jobId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const result = await this.opportunityService.downloadOpportunityReportExportFile(
        jobId,
        userId
      );
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, "Report export file retrieved", {
          fileName: result.fileName,
          mimeType: result.mimeType,
          buffer: result.buffer,
        })
      );
    } catch (error) {
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("sales-funnel")
  @getSalesFunnelSwaggerMetadata()
  async getActivityBrokerageSummary(
    @Query() queries: GetOpportunityBrokerageSummaryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const {
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        financialYear,
        quarter,
        month,
        userId,
        owner,
        type,
        from,
        to,
        insurerId,
        fromDashboard,
      } = queries;
      const loggedInUserId = parseInt(req?.headers?.userid);
      let resolvedUserId = userId;
      if (resolvedUserId === undefined || resolvedUserId === null) {
        resolvedUserId = loggedInUserId;
      }
      // Leadership bypass applies only when no employee is explicitly selected;
      // an explicit userId always scopes to that user's hierarchy.
      const isLeadership =
        userId != null
          ? false
          : await this.scopeService.hasLeadershipRole(Number(resolvedUserId));

       // Date validation and handling
      const fromDate: Date | undefined = from;
      const toDate: Date | undefined = to;

      // If only one date is provided, throw error
      if ((fromDate && !toDate) || (toDate && !fromDate)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              'Please provide valid from and to dates'
            )
          );
      }

      const dateRange = getDateRange(month ? month : quarter, financialYear);

      if (fromDate && toDate && fromDate > toDate) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              'Please provide valid from and to dates'
            )
          );
      }

      // If from/to dates are provided, use them; otherwise use financial year/quarter/month
      let startDate: Date | undefined, endDate: Date | undefined;
      if (fromDate && toDate) {
        startDate = fromDate;
        endDate = toDate;
      } else {
        const dateRange = getDateRange(month ? month : quarter, financialYear);
        startDate = dateRange.start;
        endDate = dateRange.end;
      }
      
      // An explicit owner pick is signalled by the caller actually sending a
      // userId (owner dropdown). Its absence means the default view, where a
      // leader sees the whole org and everyone else sees their own team — same
      // rule the drilldown listing applies via the explicitOwner marker.
      const explicitOwnerSelected = userId !== undefined && userId !== null;

      const data = await this.opportunityService.getActivityBrokerageSummary(
        resolvedUserId,
        startDate,
        endDate,
        type,
        owner,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        isLeadership,
        insurerId,
        fromDashboard,
        explicitOwnerSelected,
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.opportunityListRetrieved,
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch brokerage summary."
          )
        );
    }
  }

  @Get("pending-activities-summary")
  @getPendingActivitiesSummarySwaggerMetadata()
  async getPendingActivitiesSummary(
    @Query() query: GetPendingActivitiesSummaryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const coercePositiveInt = (v: unknown, fallback: number) => {
      if (v === undefined || v === null || v === "") return fallback;
      const n = typeof v === "number" ? v : parseInt(String(v).trim(), 10);
      return Number.isNaN(n) || n <= 0 ? fallback : n;
    };
    const page = coercePositiveInt(query?.page, DEFAULT_VALUES.PAGE);
    const limit = coercePositiveInt(query?.limit, DEFAULT_VALUES.LIMIT);

    const validSortFields = [
      "activityName",
      "next30",
      "next60",
      "next90",
      "beyond90",
      "total",
    ];

    let sortBy: string | undefined;
    let sortOrder: "ASC" | "DESC" = "DESC";
    if (query?.sort) {
      const [field, order] = String(query.sort).split(":");
      if (field && validSortFields.includes(field)) {
        sortBy = field;
      }
      if (order && ["ASC", "DESC"].includes(order.toUpperCase())) {
        sortOrder = order.toUpperCase() as "ASC" | "DESC";
      }
    }
    const loggedInUserId = parseInt(req?.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "OpportunityController",
        method: "getPendingActivitiesSummary",
        payload: {
          page,
          limit,
          sortBy,
          sortOrder,
          loggedInUserId,
          type: query?.type,
        },
        messageData: "method invoked",
      }),
    });
    try {
      let resolvedUserId = query?.userId;
      if (resolvedUserId === undefined || resolvedUserId === null) {
        resolvedUserId = loggedInUserId;
      }
      // Leadership bypass applies only when no employee is explicitly selected;
      // an explicit userId always scopes to that user's hierarchy.
      const isLeadership =
        query?.userId != null
          ? false
          : await this.scopeService.hasLeadershipRole(Number(resolvedUserId));

      // Date validation and handling
      const fromDate: Date | undefined = query?.from;
      const toDate: Date | undefined = query?.to;

      // If only one date is provided, throw error
      if ((fromDate && !toDate) || (toDate && !fromDate)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              'Please provide valid from and to dates'
            )
          );
      }

      // If from date is greater than to date, throw error
      if (fromDate && toDate && fromDate > toDate) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              'Please provide valid from and to dates'
            )
          );
      }

      const data = await this.opportunityService.getPendingActivitiesSummary(
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT,
        resolvedUserId,
        sortBy,
        sortOrder,
        query?.financialYear,
        query?.month ? query?.month : query?.quarter,
        query?.organisationId,
        query?.sbuId,
        query?.verticalId,
        query?.departmentId,
        query?.branchId,
        query?.owner,
        query?.type,
        isLeadership,
        fromDate,
        toDate,
        query?.insurerId,
        query?.fromDashboard
      );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityController",
          method: "getPendingActivitiesSummary",
          payload: {
            page,
            limit,
            sortBy,
            sortOrder,
            loggedInUserId,
            type: query?.type,
          },
          messageData: "pending activities summary retrieved",
        }),
      });
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.pendingActivitiesSummaryRetrieved,
            data
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityController",
          method: "getPendingActivitiesSummary",
          payload: {
            page,
            limit,
            sortBy,
            sortOrder,
            loggedInUserId,
            type: query?.type,
          },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.pendingActivitiesSummaryFailed
          )
        );
    }
  }

  @Get("brokerage-summary")
  @getBrokerageSummarySwaggerMetadata()
  async getEstimatedBrokerageSummary(
    @Query() queries: GetOpportunityMonthlyBrokerageBreakdown,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const {
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        financialYear,
        userId,
        owner,
        type,
        quarter,
        month,
        from,
        to,
      } = queries;
      const loggedInUserId = parseInt(req?.headers?.userid);
      const resolvedUserId = userId ?? loggedInUserId;
      
      if (type === "PLACEMENT") {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "Opportunity type must be either SO or RO"
            )
          );
      }
      // Leadership bypass applies only when no employee is explicitly selected;
      // an explicit userId always scopes to that user's hierarchy.
      const isLeadership =
        userId != null
          ? false
          : await this.scopeService.hasLeadershipRole(Number(resolvedUserId));
      const data = await this.opportunityService.getEstimatedBrokerageSummary(
        resolvedUserId,
        financialYear ?? new Date().getFullYear(),
        type,
        owner,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        quarter,
        month,
        from,
        to,
        isLeadership,
        String((queries as any)?.useLiveData) === "true"
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.opportunityListRetrieved,
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch brokerage summary."
          )
        );
    }
  }

  @Get("quote")
  @getQuoteByBrokingSlipAndActivitySwaggerMetadata()
  async getQuoteByBrokingSlipAndActivity(
    @Query("brokingSlipId") brokingSlipId: number,
    @Query("opportunityActivityId") opportunityActivityId: number,
    @Res() res: Response
  ): Promise<any> {
    try {
      const quote =
        await this.opportunityService.getQuoteByBrokingSlipAndActivity(
          brokingSlipId,
          opportunityActivityId
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.quoteRetrieved, quote)
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.quoteRetrievalFailed
          )
        );
    }
  }

  @Get("quote/broking-slip/:brokingSlipId")
  @getQuotesByBrokingSlipSwaggerMetadata()
  async getQuotesByBrokingSlip(
    @Param("brokingSlipId", ParseIntPipe) brokingSlipId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const quotes = await this.opportunityService.getQuotesByBrokingSlip(
        brokingSlipId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.quoteRetrieved, quotes)
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.quoteRetrievalFailed
          )
        );
    }
  }

  @Get("quote/:opportunityActivityId")
  @getQuoteEntryDetailsSwaggerMetadata()
  async getQuoteEntryDetails(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number
  ) {
    try {
      const quote = await this.opportunityService.getQuoteEntryDetails(
        opportunityActivityId
      );
      return createResponse(
        HttpStatus.OK,
        successMessage.quoteRetrieved,
        quote
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.quoteRetrievalFailed
      );
    }
  }

  @Get("activity-details")
  @getActivityDetailsSwaggerMetadata()
  async getAllActivityIdAndName(
    @Res() res: Response,
    @Query("type") type?: "SO" | "RO",
    @Query("isgOnly") isgOnly?: string,
    @Req() req?: Request
  ): Promise<Response> {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const data = await this.opportunityService.getAllActivityIdAndName(
        type || "SO",
        userId,
        isgOnly === "true"
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "All activity IDs and names retrieved successfully.",
            data
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to retrieve activity IDs and names."
          )
        );
    }
  }

  @Get("stage-details")
  @getStageDetailsSwaggerMetadata()
  async getAllStageIdAndName(@Res() res: Response): Promise<Response> {
    try {
      const data = await this.opportunityService.getAllStageIdAndName();
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "All stage IDs and names retrieved successfully.",
            data
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to retrieve stage IDs and names."
          )
        );
    }
  }

  @Get("renewal-schedule-by-sbu")
  async getRenewalScheduleBySbu(
    @Query() queries: GetRenewalScheduleBySbuDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const {
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        userId,
        owner,
        from,
        to,
        insurerId,
      } = queries;
      const loggedInUserId = parseInt(req?.headers?.userid as string);
      const resolvedUserId = userId ?? loggedInUserId;
      // Leadership bypass applies only when no employee is explicitly selected;
      // an explicit userId always scopes to that user's hierarchy.
      const isLeadership =
        userId != null
          ? false
          : await this.scopeService.hasLeadershipRole(Number(resolvedUserId));
      const data = await this.opportunityService.getRenewalScheduleBySbu(
        resolvedUserId,
        owner,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        from,
        to,
        insurerId,
        isLeadership
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.opportunityListRetrieved, data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : "Failed to fetch renewal schedule by SBU."
          )
        );
    }
  }

  // Paginated company-grain aggregate for SO/RO Enhanced's portfolio-style
  // Companies table: one row per company with Total SOs/ROs + premium +
  // brokerage under the same scope semantics as scope-summary below.
  // Declared before the ":opportunityId" catch-all so "company-summary" is
  // not captured as an id param.
  @Get("company-summary")
  async getCompanySummary(
    @Query() queries: GetCompanySummaryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
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
        ownerId,
        viewBy,
        searchBy,
        page,
        limit,
      } = queries;
      const loggedInUserId = parseInt(req?.headers?.userid as string);
      // ownerId re-scopes visibility like the listing's explicit owner pick;
      // the BD/ISG stage gate always keys off the real viewer.
      const resolvedUserId = ownerId ?? loggedInUserId;
      const data = await this.opportunityService.getCompanySummary(
        resolvedUserId,
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
          owner: viewBy,
          searchBy,
          page,
          limit,
        },
        Number.isNaN(loggedInUserId) ? undefined : loggedInUserId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.opportunityListRetrieved,
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch company summary."
          )
        );
    }
  }

  // Org-hierarchy drilldown aggregate for My RO Enhanced: one row per child
  // node at the requested level, each with Total ROs / premium / brokerage.
  // Declared before the ":opportunityId" catch-all so "scope-summary" is not
  // captured as an id param.
  @Get("scope-summary")
  async getScopeSummary(
    @Query() queries: GetScopeSummaryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
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
        userId,
        owner,
      } = queries;
      const loggedInUserId = parseInt(req?.headers?.userid as string);
      const resolvedUserId = userId ?? loggedInUserId;
      const explicitOwner = userId != null;
      // getScopeSummary determines leadership itself from the same roles
      // fetch it needs anyway for isOrg/isBranch — no separate lookup here.
      // The logged-in viewer rides separately: userId re-scopes visibility
      // (like the listing's ownerId), but the BD/ISG stage gate must always
      // key off the real viewer.
      const data = await this.opportunityService.getScopeSummary(
        resolvedUserId,
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
          owner,
        },
        Number.isNaN(loggedInUserId) ? undefined : loggedInUserId,
        explicitOwner
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.opportunityListRetrieved,
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch scope summary."
          )
        );
    }
  }

  @Get("sales-schedule-by-sbu")
  async getSalesScheduleBySbu(
    @Query() queries: GetRenewalScheduleBySbuDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    try {
      const {
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        userId,
        owner,
        from,
        to,
        insurerId,
        scope,
      } = queries;
      const loggedInUserId = parseInt(req?.headers?.userid as string);
      const resolvedUserId = userId ?? loggedInUserId;
      // Leadership bypass applies only when no employee is explicitly selected;
      // an explicit userId always scopes to that user's hierarchy.
      const isLeadership =
        userId != null
          ? false
          : await this.scopeService.hasLeadershipRole(Number(resolvedUserId));
      const data = await this.opportunityService.getSalesScheduleBySbu(
        resolvedUserId,
        owner,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        from,
        to,
        insurerId,
        isLeadership,
        scope
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.opportunityListRetrieved, data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : "Failed to fetch sales schedule by SBU."
          )
        );
    }
  }

  // Retrieves an opportunity by delegating the service using ID.
  @Get(":opportunityId")
  @getOpportunityByIdSwaggerMetadata()
  async getOpportunityById(
    @Param("opportunityId") opportunityId: number,
    @Query("page") page: string,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "opportunity",
        "view",
        opportunityId
      );
      if (!viewValidation) {
        return createErrorResponse(
          HttpStatus.FORBIDDEN,
          "Access denied: You do not have permission to view this company."
        );
      }
      const opportunity = await this.opportunityService.getOpportunityById(
        opportunityId,
        userId,
        page
      );
      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityDetails,
        opportunity
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.opportunityNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.opportunityDetailsRetrievalFailed
      );
    }
  }

  @Get(":opportunityId/documents")
  @getOpportunityDocumentsSwaggerMetadata()
  async getOpportunityDocuments(
    @Param("opportunityId") opportunityId: number,
    @Query() query: GetOpportunityQueryDto,
    @Res() res: Response
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityController",
          method: "getOpportunityDocuments",
          payload: { opportunityId, query },
          messageData: "method invoked",
        }),
      });
      const { page, limit, search, searchBy, from, to, field } = query;
      const documents = await this.opportunityService.getOpportunityDocuments(
        opportunityId,
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT,
        search,
        searchBy,
        from,
        to,
        field
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.opportunityDocumentsRetrieved,
            documents
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityController",
          method: "getOpportunityDocuments",
          payload: { opportunityId, query },
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("/company/:companyId")
  @getOpportunitiesByCompanyIdSwaggerMetadata()
  async getOpportunitiesByCompanyId(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("type") type?: "SO" | "RO",
    @Query("search") search?: string,
    @Query("entityIds") entityIds?: number[],
    @Query("sort") sort?: string,
    @Query("activeOnly") activeOnly?: string,
    @Query("ownerId") ownerId?: string,
    @Query("viewBy") viewBy?: "manager" | "team",
    @Query("excludeWon") excludeWon?: string,
    @Req() req?: Request
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const opportunities =
        await this.opportunityService.getOpportunitiesByCompanyId(
          companyId,
          page || DEFAULT_VALUES.PAGE,
          limit || DEFAULT_VALUES.LIMIT,
          type,
          search,
          entityIds,
          sort,
          userId,
          activeOnly === "true",
          ownerId ? parseInt(ownerId) : undefined,
          viewBy,
          excludeWon === "true"
        );
      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityListRetrieved,
        opportunities
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.opportunityNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.opportunityListRetrievalFailed
      );
    }
  }

  @Get("/contact/:contactId")
  @getOpportunitiesByContactIdSwaggerMetadata()
  async getOpportunitiesByContactId(
    @Param("contactId", ParseIntPipe) contactId: number,
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("type") type?: "SO" | "RO"
  ): Promise<any> {
    try {
      const opportunities =
        await this.opportunityService.getOpportunitiesByContactId(
          contactId,
          page || DEFAULT_VALUES.PAGE,
          limit || DEFAULT_VALUES.LIMIT,
          type
        );
      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityListRetrieved,
        opportunities
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.opportunityNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.opportunityListRetrievalFailed
      );
    }
  }

  @Get("quotes/:opportunityActivityId")
  @getQuotesBasedOnOpportunityActivityIdSwaggerMetadata()
  async getQuotesBasedOnOpportunityActivityId(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number,
    @Query("page") page: number,
    @Query("limit") limit: number
  ) {
    try {
      const quotes =
        await this.opportunityService.getQuotesBasedOnOpportunityActivityId(
          opportunityActivityId,
          page || DEFAULT_VALUES.PAGE,
          limit || DEFAULT_VALUES.LIMIT
        );
      return createResponse(
        HttpStatus.OK,
        "Quotes retrieved successfully",
        quotes
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          "Quotes not found for the given opportunity activity ID."
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : "Quotes retrieval failed for the given opportunity activity ID."
      );
    }
  }

  @Get("finalised-quote/:quoteId")
  @getQuoteByIdSwaggerMetadata()
  async getQuoteById(
    @Param("quoteId", ParseIntPipe) quoteId: number
  ): Promise<any> {
    try {
      const quote = await this.opportunityService.getQuoteById(quoteId);
      return createResponse(
        HttpStatus.OK,
        successMessage.quoteRetrieved,
        quote
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          "Quote not found for the given ID."
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.quoteRetrievalFailed
      );
    }
  }

  @Get("preferred-insurers/:opportunityId")
  @getPreferredInsurersSwaggerMetadata()
  async getPreferredInsurers(
    @Param("opportunityId", ParseIntPipe) opportunityId: number
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityController",
          method: "getPreferredInsurers",
          messageData: "method invoked",
        }),
      });
      const insurers = await this.opportunityService.getPreferredInsurers(
        opportunityId
      );
      return createResponse(
        HttpStatus.OK,
        "Preferred insurers retrieved successfully",
        insurers
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityController",
          method: "getPreferredInsurers",
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : "Preferred insurers retrieval failed"
      );
    }
  }

  @Get("installments/:opportunityId")
  async getInstallmentsPrefill(
    @Param("opportunityId", ParseIntPipe) opportunityId: number
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityController",
          method: "getInstallmentsPrefill",
          messageData: "method invoked",
        }),
      });
      const installments =
        await this.opportunityService.getInstallmentsPrefill(opportunityId);
      return createResponse(
        HttpStatus.OK,
        "Installments retrieved successfully",
        installments
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityController",
          method: "getInstallmentsPrefill",
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : "Installments prefill retrieval failed"
      );
    }
  }

  @Get("covers-prefill/:opportunityActivityId")
  @getCoverDataPrefillSwaggerMetadata()
  async getCoverDataPrefill(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number
  ) {
    try {
      const data = await this.opportunityService.getCoverDataPrefill(
        opportunityActivityId
      );
      return createResponse(
        HttpStatus.OK,
        "Cover details retrieved successfully",
        data
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : "Cover details retrieval failed"
      );
    }
  }

  @Get("tasks/:opportunityActivityId")
  @getOpportunityActivityTasksSwaggerMetadata()
  async getOpportunityActivityTasks(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number,
    @Query("page") page?: number,
    @Query("limit") limit?: number
  ) {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OpportunityController",
          method: "getOpportunityActivityTasks",
          messageData: "method invoked",
        }),
      });
      const tasks = await this.opportunityService.getOpportunityActivityTasks(
        opportunityActivityId,
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT
      );
      return createResponse(
        HttpStatus.OK,
        "Opportunity activity tasks retrieved successfully",
        tasks
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OpportunityController",
          method: "getOpportunityActivityTasks",
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : "Opportunity activity tasks retrieval failed"
      );
    }
  }

  // Updates the opportunity activity by delegating the service.
  @Put("activity")
  @updateOpportunityActivitiesSwaggerMetadata()
  async updateOpportunityActivity(
    @Body() updateOpportunityActivityData: OpportunityActivitiesDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      updateOpportunityActivityData.updatedBy = userId;
      const opportunity =
        await this.opportunityService.updateOpportunityActivity(
          updateOpportunityActivityData
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.opportunityActivityCreated,
            opportunity
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error?.response?.message?.length > 0
                ? error?.response?.message
                : error.message
              : errorMessages.opportunityCreationFailed
          )
        );
    }
  }

  @Post("assign-stage-owner")
  @updateStageOwnerSwaggerMetadata()
  async updateStageOwner(
    @Body() updateStageOwnerDto: UpdateStageOwnerDto,
    @Req() req: any,
    @Res() res: Response
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const result = await this.opportunityService.updateStageOwner(
        updateStageOwnerDto,
        userId
      );
      if (!result || (Array.isArray(result) && result.length === 0)) {
        return { activities: 0 };
      }
      res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.stageOwnerUpdated,
            updateStageOwnerDto
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.stageOwnerUpdationFailed
          )
        );
    }
  }

  @Get(":opportunityId/stage-owners")
  @getStageOwnersByOpportunityIdSwaggerMetadata()
  async getStageOwnersByOpportunityId(
    @Param("opportunityId", ParseIntPipe) opportunityId: number,
    @Query("roleKey") roleKey: string,
    @Res() res: Response
  ): Promise<any> {
    try {
      const result =
        await this.opportunityService.getStageOwnersByOpportunityId(
          opportunityId,
          roleKey
        );
      res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.stageOwnerUpdated,
            result
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.stageOwnerRetrieveFailed
          )
        );
    }
  }
  // Updates an existing opportunity by delegating the service using ID.
  @Put(":opportunityId")
  @updateOpportunityByIdSwaggerMetadata()
  async updateOpportunityById(
    @Param("opportunityId") opportunityId: number,
    @Body() updateOpportunityDto: UpdateOpportunityDto,
    @Body("riskLocations") updateRiskLocations: OpportunityRiskLocationDto[],
    @Body("claimExperiences")
    updateClaimExperiences: OpportunityClaimExperienceDto[],
    @Body("documents") updateDocuments: OpportunityDocumentDto[],
    @Body("previousPlacementDetails")
    previousPlacementDetails: OpportunityPreviousPlacementDetailsDto[],
    @Body("contacts") contacts: OpportunityContactMapDto[],
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "opportunity",
        "edit",
        opportunityId
      );
      if (!editValidation) {
        return createErrorResponse(
          HttpStatus.FORBIDDEN,
          "Access denied: You do not have permission to edit this company."
        );
      }
      const opportunity = await this.opportunityService.updateOpportunityById(
        opportunityId,
        updateOpportunityDto,
        updateRiskLocations,
        updateClaimExperiences,
        updateDocuments,
        previousPlacementDetails,
        contacts,
        userId
      );
      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityUpdated,
        opportunity
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          error.message || errorMessages.opportunityNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.opportunityUpdateFailed
      );
    }
  }

  // Update opportunity expiry date
  @Put("extend-expiry/:opportunityId")
  @extendOpportunityExpirySwaggerMetadata()
  async updateOpportunityExpiry(
    @Param("opportunityId") opportunityId: number,
    @Body() opportunityDto: ExtendOpportunityDto,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "opportunity",
        "edit",
        opportunityId
      );
      if (!editValidation) {
        return createErrorResponse(
          HttpStatus.FORBIDDEN,
          "Access denied: You do not have permission to update the expiry date."
        );
      }
      const opportunity = await this.opportunityService.updateOpportunityExpiry(
        opportunityId,
        opportunityDto.expiryDate,
        userId
      );
      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityExpiryDateUpdated,
        opportunity
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          error.message || errorMessages.opportunityNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.failedToUpdateOpportunityExpiryDate
      );
    }
  }

  // Deletes an opportunity by delegating the service using ID.
  @Delete(":opportunityId")
  @deleteOpportunityByIdSwaggerMetadata()
  async deleteOpportunityById(
    @Param("opportunityId") opportunityId: number,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const editValidation = await this.scopeService.validateResourceScope(
        userId,
        "opportunity",
        "edit",
        opportunityId
      );
      if (!editValidation) {
        return createErrorResponse(
          HttpStatus.FORBIDDEN,
          "Access denied: You do not have permission to edit this company."
        );
      }
      await this.opportunityService.deleteOpportunityById(opportunityId);
      return createResponse(HttpStatus.OK, successMessage.opportunityDeleted);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.opportunityNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        error instanceof Error
          ? error.message
          : errorMessages.opportunityDeletionFailed
      );
    }
  }

  /**
   * Retrieves the opportunity activities and its participants based on the Opportunity ID.
   */
  @Get("activities/:opportunityId")
  @getOpportunityActivityByIdSwaggerMetadata()
  async getOpportunityActivityById(
    @Param("opportunityId") opportunityId: number,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "opportunity",
        "edit",
        opportunityId
      );
      if (!viewValidation) {
        return createErrorResponse(
          HttpStatus.FORBIDDEN,
          "Access denied: You do not have permission to edit this company."
        );
      }
      const opportunity =
        await this.opportunityService.getOpportunityActivityById(opportunityId);

      // let owner = null;
      // if (opportunity?.length > 0) {
      //   owner = opportunity[0]?.owner;
      // }
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Opportunity Activities retrieved successfully",
            opportunity
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch the opportunity activities"
          )
        );
    }
  }

  @Get(":opportunityId/activity-history")
  @getOpportunityHistorySwaggerMetadata()
  async getOpportunityActivityHistory(
    @Param("opportunityId") opportunityId: number,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "opportunity",
        "edit",
        opportunityId
      );
      if (!viewValidation) {
        return res
          .status(HttpStatus.FORBIDDEN)
          .json(
            createErrorResponse(
              HttpStatus.FORBIDDEN,
              "Access denied: You do not have permission to view this opportunity."
            )
          );
      }
      const history =
        await this.opportunityService.getOpportunityActivityHistory(
          opportunityId
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Opportunity activity history retrieved successfully",
            history
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch opportunity activity history"
          )
        );
    }
  }

  // Fetches the existing mandate details for a given opportunity activity ID.
  @Get("fetch-existing-mandate/:opportunityActivityId")
  @getExistingMandateDetailsSwaggerMetadata()
  async getExistingMandateDetails(
    @Param("opportunityActivityId") opportunityActivityId: number,
    @Res() res: Response
  ) {
    try {
      const mandate = await this.opportunityService.getExistingMandateDetails(
        opportunityActivityId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Mandate details retrieved successfully",
            mandate
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch mandate details"
          )
        );
    }
  }

  @Get("activity-meta/:opportunityId/:activityId")
  @getOpportunityActivityMetaSwaggerMetadata()
  async getOpportunityActivityMeta(
    @Param("opportunityId", ParseIntPipe) opportunityId: number,
    @Param("activityId", ParseIntPipe) activityId: number,
    @Req() req: Request
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "opportunity",
        "edit",
        opportunityId
      );
      if (!viewValidation) {
        return createErrorResponse(
          HttpStatus.FORBIDDEN,
          "Access denied: You do not have permission to edit this company."
        );
      }
      const activityMeta =
        await this.opportunityService.getOpportunityActivityMeta(
          opportunityId,
          activityId
        );
      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityActivityMetaRetrieved,
        activityMeta
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.opportunityActivityMetaNotFound
        );
      }
    }
  }

  @Post("activity-meta")
  @createOpportunityActivitySwaggerMetadata()
  async createOpportunityActivityData(
    @Req() req: Request,
    @Body() activityMeta: any
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const opportunityActivityData =
        await this.opportunityService.createOpportunityMeta(
          userId,
          activityMeta
        );
      return createResponse(
        HttpStatus.OK,
        opportunityActivityData.message,
        opportunityActivityData.result
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.getResponse());
      }
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          error ? error.message : errorMessages.opportunityActivityMetaNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.opportunityActivityCreationFailed
      );
    }
  }

  @Post("deviation-task")
  @createDeviationTaskSwaggerMetadata()
  async createDeviationTask(
    @Body() deviationTaskData: CreateDeviationTaskDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      const deviationTask = await this.opportunityService.createDeviationTask(
        deviationTaskData.opportunityActivityId,
        deviationTaskData.taskName,
        deviationTaskData.description,
        userId
      );
      return res.status(HttpStatus.CREATED).json({
        status: HttpStatus.CREATED,
        message: "Deviation task created",
        data: deviationTask,
      });
    } catch (error) {
      return handleErrorResponse(error as Error, res, error?.message);
    }
  }

  @Get(":opportunityId/brokerage")
  @getOpportunityBrokerageSummarySwaggerMetadata()
  async getOpportunityBrokerageSummary(
    @Param("opportunityId", ParseIntPipe) opportunityId: number,
    @Res() res: Response
  ) {
    try {
      const brokerageSummary =
        await this.opportunityService.getOpportunityBrokerage(opportunityId);
      return res.status(HttpStatus.OK).json(createResponse(
        HttpStatus.OK,
        "Opportunity Brokerage retrieved successfully",
        brokerageSummary
      ));
    } catch (error) {
      return handleErrorResponse(error as Error, res, error?.message);
    }
  }

  @Post("opportunity-lost")
  @createOpportunityLostSwaggerMetadata()
  async createOpportunityLost(
    @Body() opportunityLostData: CreateOpportunityLostDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      const opportunityLost =
        await this.opportunityService.createOpportunityLost(
          opportunityLostData,
          userId
        );
      return res.status(HttpStatus.CREATED).json({
        status: HttpStatus.CREATED,
        message: "Opportunity lost",
        data: opportunityLost,
      });
    } catch (error) {
      return handleErrorResponse(
        error as Error,
        res,
        error?.message,
        error?.message,
        error?.message
      );
    }
  }

  @Put(":opportunityActivityId/activity-approval")
  @opportunityActivityApprovalSwaggerMetadata()
  async opportunityActivityApproval(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number,
    @Body() activityMeta: any,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);

      const activityApproval =
        await this.opportunityService.opportunityActivityApproval(
          opportunityActivityId,
          userId,
          activityMeta
        );
      return createResponse(
        HttpStatus.OK,
        activityApproval.message,
        activityApproval.opportunityActivity
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.getResponse());
      }
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          error ? error.message : "Opportunity Activity not found."
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : "Failed to update Opportunity Activity."
      );
    }
  }

  @Put("activity-meta/:opportunityActivityId")
  @updateOpportunityActivityMetaSwaggerMetadata()
  async updateOpportunityActivityData(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number,
    @Req() req: Request,
    @Body() activityMeta: any
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const updatedActivityData =
        await this.opportunityService.updateOpportunityMeta(
          opportunityActivityId,
          userId,
          activityMeta
        );
      return createResponse(
        HttpStatus.OK,
        updatedActivityData.message,
        updatedActivityData.result
      );
    } catch (error) {
      console.error("Error in updateOpportunityActivityData:", error);
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.getResponse());
      }
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          error ? error.message : "Opportunity Activity not found."
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : "Failed to update Opportunity Activity."
      );
    }
  }

  /**
   * Updates the final negotiation meeting and meeting table entry.
   */
  @Put("rfp-details-entry/:opportunityActivityId")
  @updateRfpDetailsSwaggerMetadata()
  async updateOpportunityRfpDetailsEntry(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number,
    @Body()
    updateOpportunityRfpDetailsEntryDto: UpdateRfpDetailsEntryDto,
    @Req() req: Request
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const result =
        await this.opportunityService.updateOpportunityRfpDetailsEntry(
          opportunityActivityId,
          updateOpportunityRfpDetailsEntryDto,
          userId
        );
      return createResponse(
        HttpStatus.OK,
        "RFP Details Entry updated successfully.",
        result
      );
    } catch (error) {
      console.error("Error in updateOpportunityRfpDetailsEntry:", error);
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : "Failed to update RFP Details Entry."
      );
    }
  }

  /**
   * Retrieves the RFP data based on the Opportunity Activity ID.
   */
  @Get("activities/rfpData/:opportunityActivityId")
  @getRfpDataByOpportunityIdSwaggerMetadata()
  async getRfpDataByOpportunityId(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number
  ): Promise<any> {
    try {
      const rfpData = await this.opportunityService.getRfpDataByOpportunityId(
        opportunityActivityId
      );
      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityActivityMetaRetrieved,
        rfpData
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.opportunityActivityMetaNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.opportunityActivityMetaNotFound
      );
    }
  }

  @Get("activities/coversMeta/:opportunityId")
  @getOpportunityCoversMetaSwaggerMetadata()
  async getOpportunityCoversMeta(
    @Param("opportunityId") opportunityId: number,
    @Query("activityId") activityId?: number
  ): Promise<any> {
    try {
      const coversMeta = await this.opportunityService.getOpportunityCoversMeta(
        opportunityId,
        activityId
      );
      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityActivityMetaRetrieved,
        coversMeta
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.opportunityActivityMetaNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.opportunityActivityMetaNotFound
      );
    }
  }

  @Get("activity-data/:opportunityActivityId")
  @getOpportunityActivitySwaggerMetadata()
  async getOpportunityActivityDataById(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number
  ): Promise<any> {
    try {
      const activityDetails =
        await this.opportunityService.getOpportunityActivitesDataById(
          opportunityActivityId
        );

      if (!activityDetails) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          `opportunity activity ID: ${opportunityActivityId}, not found`
        );
      }

      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityActivityDataRetrieved,
        activityDetails
      );
    } catch (error) {
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.opportunityActivitiesRetrieveFailed
      );
    }
  }

  @Put("quote/:quoteId")
  @updateQuoteSwaggerMetadata()
  async updateQuote(
    @Param("quoteId", ParseIntPipe) quoteId: number,
    @Body() updateQuoteDto: CreateQuoteDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const updatedQuoteDetails = await this.opportunityService.updateQuote(
        quoteId,
        updateQuoteDto,
        userId
      );
      res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.quoteUpdated,
            updatedQuoteDetails
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error ? error.message : errorMessages.quoteUpdateFailed
      );
    }
  }

  @Put("quote/activity/:opportunityActivityId")
  @updateOpportunityQuoteByActivityIdSwaggerMetadata()
  async updateOpportunityQuoteByActivityId(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number,
    @Body() updateQuoteDto: UpdateQuoteDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const updatedQuoteEntryDetails =
        await this.opportunityService.updateOpportunityQuoteByActivityId(
          opportunityActivityId,
          updateQuoteDto,
          userId
        );
      res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.quoteUpdated,
            updatedQuoteEntryDetails
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.quoteUpdateFailed
          )
        );
    }
  }

  @Delete("quote/:quoteId")
  @deleteQuoteEntrySwaggerMetadata()
  async deleteQuoteEntry(@Param("quoteId", ParseIntPipe) quoteId: number) {
    try {
      await this.opportunityService.softDeleteQuoteEntry(quoteId);
      return createResponse(HttpStatus.OK, successMessage.quoteDeleted);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.quoteDeletionFailed
      );
    }
  }

  @Get("activities/broking-slip/versions/:opportunityId")
  @getBrokingSlipVersionsByOpportunityIdSwaggerMetadata()
  async getBrokingSlipVersionsByOpportunityActivityId(
    @Param("opportunityId", ParseIntPipe) opportunityId: number,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "opportunity",
        "edit",
        opportunityId
      );
      if (!viewValidation) {
        return createErrorResponse(
          HttpStatus.FORBIDDEN,
          "Access denied: You do not have permission to edit this company."
        );
      }
      const brokingSlipVersions =
        await this.opportunityService.getBrokingSlipVersionsByOpportunityId(
          opportunityId
        );
      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityActivityMetaRetrieved,
        brokingSlipVersions
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.brokingSlipVersionsNotFound,
          []
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.brokingSlipVersionsNotFound,
        []
      );
    }
  }

  @Put("held-cover-note/:opportunityActivityId")
  @updateHeldCoverNoteByIdSwaggerMetadata()
  async updateHeldCoverNoteById(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number,
    @Body() updateHeldCoverNoteDto: UpdateHeldCoverNoteDto,
    @Req() req: Request
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const updatedHeldCoverNote =
        await this.opportunityService.updateHeldCoverNoteById(
          opportunityActivityId,
          updateHeldCoverNoteDto,
          userId
        );
      return createResponse(
        HttpStatus.OK,
        successMessage.heldCoverNoteUpdated,
        updatedHeldCoverNote
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.heldCoverNoteNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.heldCoverNoteUpdateFailed
      );
    }
  }

  // Fetch broking slip data based on the opportunity activity Id
  @Get("activities/broking-slip/:opportunityActivityId")
  @getBrokingSlipByOpportunityActivityIdSwaggerMetadata()
  async getBrokingSlipByOpportunityActivityId(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const opportunity =
        await this.opportunityService.getOpportunityIdByOpportunityActivityId(
          opportunityActivityId
        );
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "opportunity",
        "view",
        opportunity.opportunityId
      );
      if (!viewValidation) {
        return createErrorResponse(
          HttpStatus.FORBIDDEN,
          "Access denied: You do not have permission to edit this company."
        );
      }
      const brokingSlip =
        await this.opportunityService.getBrokingSlipVersionDetailsByOpportunityActivityId(
          opportunityActivityId
        );
      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityActivityMetaRetrieved,
        brokingSlip
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.brokingSlipActivityMetaNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.brokingSlipActivityMetaNotFound
      );
    }
  }

  @Put("policy-confirmation/:opportunityActivityId")
  @updatePolicyConfirmationByIdSwaggerMetadata()
  async updatePolicyConfirmationById(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number,
    @Body() updatePolicyConfirmationDto: UpdatePolicyConfirmationDto,
    @Req() req: Request
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const updatedPolicyConfirmation =
        await this.opportunityService.updatePolicyConfirmationById(
          opportunityActivityId,
          updatePolicyConfirmationDto,
          userId
        );
      return createResponse(
        HttpStatus.OK,
        successMessage.policyConfirmationUpdated,
        updatedPolicyConfirmation
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.policyConfirmationNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.policyConfirmationUpdateFailed
      );
    }
  }

  @Put("opportunity-lost/:opportunityId")
  @updateOpportunityLostSwaggerMetadata()
  async updateOpportunityLost(
    @Param("opportunityId", ParseIntPipe) opportunityId: number,
    @Req() req: Request,
    @Body() updateOpportunityLostData: UpdateOpportunityLostDto
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      const data = await this.opportunityService.updateOpportunityLost(
        opportunityId,
        updateOpportunityLostData,
        userId
      );
      return createResponse(HttpStatus.OK, "Opportunity lost updated", data);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : "Failed to update opportunity lost activity."
      );
    }
  }

  @Get("final-negotiation/:id")
  @getFinalNegotiationActivitySwaggerMetadata()
  async getFinalNegotiationActivity(@Param("id", ParseIntPipe) id: number) {
    try {
      const data = await this.opportunityService.getFinalNegotiationActivity(
        id
      );
      return createResponse(
        HttpStatus.OK,
        successMessage.finalNegotiationActivityRetrieved,
        data
      );
    } catch (error) {
      console.error("Error in getFinalNegotiationActivity:", error);
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.finalNegotiationActivityRetrievalFailed
      );
    }
  }

  @Get("activities/broking-slip/:opportunityId/:versionId")
  @getBrokingSlipByVersionIdSwaggerMetadata()
  async getBrokingSlipByVersionId(
    @Param("opportunityId", ParseIntPipe) opportunityId: number,
    @Param("versionId", ParseIntPipe) versionId: number,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "opportunity",
        "edit",
        opportunityId
      );
      if (!viewValidation) {
        return createErrorResponse(
          HttpStatus.FORBIDDEN,
          "Access denied: You do not have permission to edit this company."
        );
      }
      const brokingSlip =
        await this.opportunityService.getBrokingSlipVersionDetailsByVersionId(
          opportunityId,
          versionId
        );
      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityActivityCreated,
        brokingSlip
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.brokingSlipActivityMetaNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.brokingSlipActivityMetaNotFound
      );
    }
  }

  @Put("activities/broking-slip/:opportunityActivityId")
  @createOpportunityActivitySwaggerMetadata()
  async createBrokingSlipData(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number,
    @Req() req: Request,
    @Body() brokingSlipDetails: any
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const updatedBrokingSlipVersion: {
        data: Partial<SaveBrokingSlipDataDto> | null;
        message: string;
      } = await this.opportunityService.updateBrokingSlipData(
        brokingSlipDetails.opportunityActivityId,
        brokingSlipDetails.brokingSlipDetails,
        brokingSlipDetails.statusLid,
        userId,
        brokingSlipDetails.activityStatusKey
      );
      return createResponse(
        HttpStatus.OK,
        updatedBrokingSlipVersion.message,
        updatedBrokingSlipVersion.data
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.brokingSlipActivityMetaNotFound
        );
      }
      // Handle BadRequestException properly
      if (error instanceof BadRequestException) {
        return createErrorResponse(
          HttpStatus.BAD_REQUEST,
          error.response?.message ||
            errorMessages.brokingSlipActivityMetaNotFound
        );
      }

      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        errorMessages.brokingSlipActivityMetaNotFound
      );
    }
  }

  @Put("activities/broking-slip/version/:versionId")
  @updateBrokingSlipVersionSwaggerMetadata()
  async updateBrokingSlipByVersionId(
    @Param("versionId", ParseIntPipe) versionId: number,
    @Body() brokingSlipDetailsDto: CreateBrokingSlipVersionDto,
    @Req() req: Request
  ) {
    try {
      let updatedBrokingSlipVersion: BrokingSlipVersionDetailsDtoWithId | null =
        await this.opportunityService.updateBrokingSlipVersions(
          brokingSlipDetailsDto.opportunityActivityId,
          versionId,
          brokingSlipDetailsDto.brokingSlipVersionDetails,
          brokingSlipDetailsDto.statusLid
        );
      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityActivityMetaRetrieved,
        updatedBrokingSlipVersion
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.brokingSlipActivityMetaNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.brokingSlipActivityMetaNotFound
      );
    }
  }

  @Delete("activities/broking-slip/:opportunityId/:versionId")
  @deleteBrokingSlipVersionSwaggerMetadata()
  async deleteBrokingSlipVersionById(
    @Param("opportunityId", ParseIntPipe) opportunityId: number,
    @Param("versionId", ParseIntPipe) versionId: number,
    @Req() req: Request
  ) {
    try {
      await this.opportunityService.deleteBrokingSlipVersion(
        opportunityId,
        versionId
      );
      return createResponse(
        HttpStatus.OK,
        successMessage.brokingSlipVersionDeleted,
        []
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.brokingSlipActivityMetaNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.brokingSlipActivityMetaNotFound
      );
    }
  }

  @Put("policy-hard-copy/:opportunityActivityId")
  @updatePolicyHardCopyByIdSwaggerMetadata()
  async updatePolicyHardCopyById(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number,
    @Body() updatePolicyHardCopyDto: UpdatePolicyHardCopyDto,
    @Req() req: Request
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const updatedPolicyHardCopy =
        await this.opportunityService.updatePolicyHardCopyById(
          opportunityActivityId,
          updatePolicyHardCopyDto,
          userId
        );
      return createResponse(
        HttpStatus.OK,
        successMessage.policyHardCopyUpdated,
        updatedPolicyHardCopy
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.policyHardCopyNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.policyHardCopyUpdateFailed
      );
    }
  }

  @Get("qcr_versions/:opportunityActivityId")
  @getAllBrokingSlipVersionsSwaggerMetadata()
  async getQcrBrokingSlipVersionsData(
    @Param("opportunityActivityId") opportunityActivityId: number
  ): Promise<any> {
    try {
      const qcrBrokingSlipVersionsData =
        await this.opportunityService.getAllQcrBrokingSlipVersionsData(
          opportunityActivityId
        );
      return createResponse(
        HttpStatus.OK,
        successMessage.brokeingSlipVersionsRetrieved,
        qcrBrokingSlipVersionsData
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.brokingSlipVersionsNotFound
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.brokingSlipVersionsNotFound
      );
    }
  }

  @Put("placement-slip/:id")
  @updatePlacementSlipSwaggerMetadata()
  async updatePlacementSlip(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePlacementSlipDto,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid);
      dto.updatedBy = userId;
      const result = await this.opportunityService.updatePlacementSlip(id, dto);
      return createResponse(
        HttpStatus.OK,
        successMessage.placementSlipUpdated,
        result
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.getResponse());
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.placementSlipUpdateFailed
      );
    }
  }

  @Delete("placement-slip/:id")
  @deletePlacementSlipSwaggerMetadata()
  async softDeletePlacementSlip(@Param("id", ParseIntPipe) id: number) {
    try {
      await this.opportunityService.softDeletePlacementSlip(id);
      return createResponse(HttpStatus.OK, successMessage.placementSlipDeleted);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.placementSlipDeletionFailed
      );
    }
  }

  @Put("quote-comparison-report/:id")
  @updateQuoteComparisonReportByIdSwaggerMetadata()
  async updateQuoteComparisonReportById(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number,
    @Body() updateQuoteComparisonReportDto: UpdateQuoteComparisonReportDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const updatedQuoteComparisonReport =
        await this.opportunityService.updateQuoteComparisonReportById(
          opportunityActivityId,
          updateQuoteComparisonReportDto,
          userId
        );
      res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.quoteComparisonReportUpdated,
            updatedQuoteComparisonReport
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        res
          .status(HttpStatus.NOT_FOUND)
          .json(
            createErrorResponse(
              HttpStatus.NOT_FOUND,
              errorMessages.quoteComparisonReportNotFound
            )
          );
      }
      res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.quoteComparisonReportUpdateFailed
          )
        );
    }
  }

  @Get(":opportunityId/contacts")
  @getOpportunityContactsSwaggerMetadata()
  async getOpportunityContacts(
    @Param("opportunityId", ParseIntPipe) opportunityId: number,
    @Res() res: Response,
    @Query("type") type?: "OPTY" | "COMPANY",
    @Query("status") status?: "ACTIVE" | "INACTIVE"
  ): Promise<Response> {
    try {
      const contacts = await this.opportunityService.getOpportunityContacts(
        opportunityId,
        type,
        status
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.opportunityContactsRetrieved,
            contacts
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(
            createErrorResponse(
              HttpStatus.NOT_FOUND,
              error.message || errorMessages.opportunityContactsNotFound
            )
          );
      }

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error.message || errorMessages.failedToFetchOpportunityContacts
          )
        );
    }
  }
  @Put("premium-calculation/:opportunityActivityId")
  @updatePremiumCalculationSwaggerMetadata()
  async updatePremiumCalculationById(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number,
    @Body() updatePremiumCalculationDto: UpdatePremiumCalculationDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const updatedPremiumCalculation =
        await this.opportunityService.updatePremiumCalculationActivity(
          opportunityActivityId,
          updatePremiumCalculationDto,
          userId
        );
      res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.premiumCalculationUpdated,
            updatedPremiumCalculation
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        res
          .status(HttpStatus.NOT_FOUND)
          .json(
            createErrorResponse(
              HttpStatus.NOT_FOUND,
              errorMessages.premiumCalculationNotFound
            )
          );
      }
      res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.premiumCalculationUpdateFailed
          )
        );
    }
  }

  @Post("report-generation")
  @generateQuoteComparisonReportSwaggerMetadata()
  async generateQuoteComparisonReport(
    @Body() quoteComparisonReportDto: QuoteComparisonReportDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<any> {
    try {
      // You may want to pass userId if needed for auditing
      const report =
        await this.opportunityService.generateQuoteComparisonReport(
          quoteComparisonReportDto
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Quote comparison report generated successfully.",
            report
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(
            createErrorResponse(
              HttpStatus.NOT_FOUND,
              error.message || "Quote comparison report not found."
            )
          );
      }
      res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to generate quote comparison report."
          )
        );
    }
  }

  @Get("policy-confirmation-account-details/:opportunityActivityId")
  @getPolicyConfirmationCdAccountDetailsSwaggerMetadata()
  async getPolicyConfirmationCdAccountDetails(
    @Param("opportunityActivityId", ParseIntPipe) opportunityActivityId: number
  ) {
    try {
      const data =
        await this.opportunityService.getPolicyConfirmationCdAccountDetails(
          opportunityActivityId
        );
      return createResponse(
        HttpStatus.OK,
        "CD account details retrieved successfully",
        data
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : "CD account details retrieval failed"
      );
    }
  }

  @Get("broking-slip-excel-data/:opportunityId")
  @getBrokingSlipExcelDataSwaggerMetadata()
  async getAllBrokingSlipVersionsByOpportunityId(
    @Param("opportunityId", ParseIntPipe) opportunityId: number,
    @Req() req: Request
  ) {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const viewValidation = await this.scopeService.validateResourceScope(
        userId,
        "opportunity",
        "edit",
        opportunityId
      );
      if (!viewValidation) {
        return createErrorResponse(
          HttpStatus.FORBIDDEN,
          "Access denied: You do not have permission to edit this company."
        );
      }
      const brokingSlipVersions =
        await this.opportunityService.getAllBrokingSlipVersions(opportunityId);
      return createResponse(
        HttpStatus.OK,
        successMessage.opportunityActivityMetaRetrieved,
        brokingSlipVersions
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.brokingSlipVersionsNotFound,
          []
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : errorMessages.brokingSlipVersionsNotFound,
        []
      );
    }
  }

  @Post("excel-generation-url")
  @getExcelGenerationUrlSwaggerMetadata()
  async getExcelGenerationUrl(
    @Body() body: ExcelGenerationDto,
    @Res() res: Response,
    @Req() req: Request
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid as string);
      const {
        opportunityId,
        activityKey,
        opportunityActivityId,
        brokingSlipVersion,
        quoteEntry,
        brokingSlipCovers,
        rfpDetailsCovers,
      } = body;
      const url = await this.opportunityService.getExcelGenerationUrl(
        opportunityId,
        activityKey,
        opportunityActivityId,
        brokingSlipVersion,
        quoteEntry,
        brokingSlipCovers,
        rfpDetailsCovers,
        userId
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "URL generated successfully", url));
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, error.message));
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : "Failed to generate URL."
          )
        );
    }
  }

  @Post("renewal-opportunity")
  @getRenewalOpportunitiesSwaggerMetadata()
  async createRenewalOpportunity(
    @Body() renewalOpportunityDto: Opportunity & { optyType: string },
    @Res() res: Response
  ) {
    try {
      const { optyType, ...renewalOpportunityData } = renewalOpportunityDto;
      const result = await this.opportunityService.createRenewalOpportunity(
        {
          ...renewalOpportunityData,
          createdBy: renewalOpportunityDto?.ownerId,
          updatedBy: renewalOpportunityDto?.ownerId,
        },
        optyType
      );
      res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Renewal opportunity created successfully.",
            result
          )
        );
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(
        error instanceof Error
          ? error.message
          : "Failed to create renewal opportunity."
      );
    }
  }

  @Post("regenerate-renewal-opportunity")
  @regenerateRenewalOpportunitySwaggerMetadata()
  async regenerateRenewalOpportunity(
    @Body() renewalData: RenewalOpportunityDto,
    @Res() res: Response,
    @Query("ROForDefinedPolicySetFlag") ROForDefinedPolicySetFlagQuery?: string
  ) {
    try {
      const ROForDefinedPolicySetFlag =
        renewalData.ROForDefinedPolicySetFlag ;
      const result = await this.opportunityService.regenerateRenewalOpportunity(
        renewalData.fromDate,
        renewalData.duration,
        ROForDefinedPolicySetFlag
      );
      res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Renewal opportunities created successfully.",
            result
          )
        );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create renewal opportunity: ${error.message}`
      );
    }
  }

  @Get("company/:companyId/caution-deposit")
  @getCautionDepositsByCompanySwaggerMetadata()
  async getCautionDepositsByCompany(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Query("search") search: string,
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.opportunityService.getCautionDepositsByCompany(
        companyId,
        search || "",
        page || DEFAULT_VALUES.PAGE,
        limit || DEFAULT_VALUES.LIMIT
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Caution deposits retrieved successfully",
            data
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to fetch caution deposits"
          )
        );
    }
  }

  @Post("add-final-negotiation-quote/:opportunityActivityId")
  @addQuoteFromFinalNegotiationSwaggerMetadata()
  async addQuoteFromFinalNegotiation(
    @Param("opportunityActivityId", ParseIntPipe)
    opportunityActivityId: number,
    @Req() req: Request
  ): Promise<any> {
    try {
      const userId = parseInt(req?.headers?.userid);
      const result = await this.opportunityService.addQuoteFromFinalNegotiation(
        opportunityActivityId,
        userId
      );
      return createResponse(
        HttpStatus.OK,
        successMessage.quoteActivitiesUpdated,
        result
      );
    } catch (error) {
      if (error instanceof NotFoundException) {
        return createErrorResponse(HttpStatus.NOT_FOUND, error.message);
      }
      if (error instanceof BadRequestException) {
        return createErrorResponse(HttpStatus.BAD_REQUEST, error.message);
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error
          ? error.message
          : "Failed to update quote activities"
      );
    }
  }
}
