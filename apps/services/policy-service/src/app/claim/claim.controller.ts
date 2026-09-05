import {
  Controller,
  Post,
  Get,
  Param,
  Query,
  Req,
  Res,
  HttpStatus,
  Body,
  BadRequestException
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { ClaimService } from "./claim.service";
import { JwtService } from "@nestjs/jwt";
import {
  successMessage,
  errorMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  createResponse,
  createErrorResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  GetEmployeeClaimParamsDto,
  ClaimListQueryDto,
  UploadClaimResponseDto,
  ClaimBatchQueryDto,
  ClaimTemplateQueryDto,
  ClaimTemplateResponseDto,
  GetPolicyClaimParamsDto,
} from "./dto";
import { PolicyTypeQueryDto } from "../policy/dto/policy-type-query.dto";
import {
  uploadClaimSwaggerMetadata,
  getEmployeeClaimSwaggerMetadata,
  getPolicyClaimSwaggerMetadata,
  getClaimListSwaggerMetadata,
  getClaimPolicyTypesSwaggerMetadata,
  getPolicyClaimBatchesSwaggerMetadata,
  getClaimTemplateSwaggerMetadata,
  getDashboardBusinessOverviewSwaggerMetadata,
} from "./claim.swagger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_TOTAL_KPI_COUNT,
  ROLE_KEY
} from "../../../../../../libs/service-lib/src/lib/constants";
import { ClaimUploadData } from "./dto/claim-upload.dto";
import { GetPolicyKpiDto } from "../policy/dto/get-policy-kpi.dto";
import { ScopeService } from "../../../../../../libs/service-lib/src/lib/utils/scope.utils";

@ApiTags("claim")
@Controller("claim")
export class ClaimController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly claimService: ClaimService,
    private readonly scopeService: ScopeService,
    private readonly traceIdService: TraceIdService,
    private readonly jwtService: JwtService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.POLICY_SERVICE
    );
  }

  @Post("claims-upload")
  @uploadClaimSwaggerMetadata()
  async uploadClaim(
    @Body() ClaimUploadData: ClaimUploadData,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const { fileId, policyId, tpaId, claimsUploadDate, totalClaims } =
      ClaimUploadData;
    const userId = parseInt(req?.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "ClaimController",
        method: "uploadClaim",
        payload: { fileId },
        messageData: "method invoked",
      }),
    });
    try {
      const result = await this.claimService.uploadClaim(
        fileId,
        policyId,
        tpaId,
        claimsUploadDate,
        totalClaims ?? DEFAULT_TOTAL_KPI_COUNT
      );
      const data = new UploadClaimResponseDto(result);
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(HttpStatus.CREATED, successMessage.claimUploaded, data)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "ClaimController",
          method: "uploadClaim",
          payload: { fileId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.claimFileNotFound,
        errorMessages.claimUploadFailed,
        errorMessages.claimUploadFailed
      );
    }
  }

  @Get()
  @getClaimListSwaggerMetadata()
  async getClaims(
    @Query() query: ClaimListQueryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      search,
      ownerId,
      viewBy,
      organisationId,
      sbuId,
      verticalId,
      branchId,
      companyName,
      companyPriority,
      policyType,
      claimStatus,
      tatFrom,
      tatTo,
      tatRange,
      openTatOnly,
      field,
      from,
      to,
      period,
      month,
      financialYear,
      insurerId,
      sort,
    } = query;
    const userId = parseInt(req?.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "ClaimController",
        method: "getClaims",
        payload: { page, limit, search },
        messageData: "method invoked",
      }),
    });
    try {
      const data = await this.claimService.getClaims(
        page,
        limit,
        search,
        userId,
        ownerId,
        viewBy,
        organisationId,
        sbuId,
        verticalId,
        branchId,
        companyName,
        companyPriority,
        policyType,
        claimStatus,
        tatFrom,
        tatTo,
        tatRange,
        openTatOnly,
        field,
        from,
        to,
        period,
        month,
        financialYear,
        insurerId,
        sort,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.claimListRetrieved, data)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "ClaimController",
          method: "getClaims",
          payload: { page, limit, search },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.policyClaimFetchFailed,
        errorMessages.policyClaimFetchFailed,
        errorMessages.policyClaimFetchFailed
      );
    }
  }

  @Get("template")
  @getClaimTemplateSwaggerMetadata()
  async downloadClaimsTemplate(
    @Query() query: ClaimTemplateQueryDto,
    @Res() res: Response
  ) {
    try {
      // Validate that either tpaId or policyId is provided
      if (!query.tpaId && !query.policyId) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              errorMessages.claimTemplateGenerationFailedErrorForRequiredFields
            )
          );
      }

      const data = await this.claimService.generateClaimsTemplate(
        query.claimType,
        query.tpaId,
        query.policyId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Claims template generated",
            new ClaimTemplateResponseDto(data)
          )
        );
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.failedToGenerateClaimTemplate
          )
        );
    }
  }

  @Get("dashboard-business-overview")
  @getDashboardBusinessOverviewSwaggerMetadata()
  async getDashboardBusinessOverview(
    @Query() query: GetPolicyKpiDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const ownerId = parseInt(req?.headers?.userid as string);
      const {
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        quarter,
        month,
        financialYear,
        owner,
        from,
        to,
      } = query;

      let userId = query.userId;
      if (userId === undefined || userId === null) {
        userId = ownerId;
      }
      // Leadership bypass applies only when no employee is explicitly selected;
      // an explicit userId always scopes to that user's hierarchy.
      const isLeadership =
        query.userId != null
          ? false
          : await this.scopeService.hasLeadershipRole(Number(userId));

      // Date validation and handling
      const fromDate: Date | undefined = from;
      const toDate: Date | undefined = to;

      // If only one date is provided, throw error
      if ((fromDate && !toDate) || (toDate && !fromDate)) {
        throw new BadRequestException(
          'Please provide valid from and to dates'
        );
      }

      // If from date is greater than to date, throw error
      if (fromDate && toDate && fromDate > toDate) {
        throw new BadRequestException(
          'Please provide valid from and to dates'
        );
      }


      const data = await this.claimService.getDashboardBusinessOverview(
        userId,
        month ? month : quarter,
        financialYear,
        owner,
        organisationId,
        sbuId,
        verticalId,
        departmentId,
        branchId,
        isLeadership,
        fromDate,
        toDate
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Business overview data fetched successfully",
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
              : "Failed to fetch business overview data."
          )
        );
    }
  }

  @Get("employee/:employeeId")
  @getEmployeeClaimSwaggerMetadata()
  async getEmployeeClaim(
    @Param() params: GetEmployeeClaimParamsDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const { employeeId } = params;
    const userId = parseInt(req?.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "ClaimController",
        method: "getEmployeeClaim",
        payload: { employeeId },
        messageData: "method invoked",
      }),
    });
    try {
      const data = await this.claimService.getEmployeeClaim(employeeId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.employeeClaimRetrieved,
            data
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "ClaimController",
          method: "getEmployeeClaim",
          payload: { employeeId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.employeeClaimFetchFailed,
        errorMessages.employeeClaimFetchFailed,
        errorMessages.employeeClaimFetchFailed
      );
    }
  }

  @Get("policy/:policyId")
  @getPolicyClaimSwaggerMetadata()
  async getPolicyClaim(
    @Param() params: GetPolicyClaimParamsDto,
    @Query() query: ClaimListQueryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const { policyId } = params;
    const { page = DEFAULT_PAGE, limit = DEFAULT_LIMIT, search, sort } = query;
    const userId = parseInt(req?.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "ClaimController",
        method: "getPolicyClaim",
        payload: { policyId },
        messageData: "method invoked",
      }),
    });
    try {
      const data = await this.claimService.getPolicyClaim(
        policyId,
        page,
        limit,
        search,
        sort
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.policyClaimRetrieved,
            data
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "ClaimController",
          method: "getPolicyClaim",
          payload: { policyId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.policyClaimFetchFailed,
        errorMessages.policyClaimFetchFailed,
        errorMessages.policyClaimFetchFailed
      );
    }
  }

  @Get("policy-types")
  @getClaimPolicyTypesSwaggerMetadata()
  async getPolicyTypes(
    @Query() query: PolicyTypeQueryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const { ownerId, viewBy, companyId, insurerId } = query;
    const userId = parseInt(req?.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "ClaimController",
        method: "getPolicyTypes",
        payload: { ownerId, viewBy, companyId, insurerId },
        messageData: "method invoked",
      }),
    });
    try {
      const data = await this.claimService.getPolicyTypes(
        userId,
        ownerId,
        viewBy,
        companyId,
        insurerId
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.claimListRetrieved, data)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "ClaimController",
          method: "getPolicyTypes",
          payload: { ownerId, viewBy, companyId, insurerId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.policyClaimFetchFailed,
        errorMessages.policyClaimFetchFailed,
        errorMessages.policyClaimFetchFailed
      );
    }
  }
  
  @Get("claim-upload-batches")
  @getPolicyClaimBatchesSwaggerMetadata()
  async getPolicyClaimBatches(
    @Query() query: ClaimBatchQueryDto,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const {
      page = DEFAULT_PAGE,
      limit = DEFAULT_LIMIT,
      tpaId,
      policyId,
      sort,
    } = query;
    const userId = parseInt(req?.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "ClaimController",
        method: "getPolicyClaimBatches",
        payload: { policyId, page, limit, tpaId },
        messageData: "method invoked",
      }),
    });
    try {
      const result = await this.claimService.getPolicyClaimBatches(
        policyId,
        page,
        limit,
        tpaId,
        sort
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.claimBatchListRetrieved,
            result
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "ClaimController",
          method: "getPolicyClaimBatches",
          payload: { policyId, page, limit, tpaId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.claimBatchFetchFailed,
        errorMessages.claimBatchFetchFailed,
        errorMessages.claimBatchFetchFailed
      );
    }
  }
}
