import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  createErrorResponse,
  createResponse,
} from "../../../../service-lib/src/lib/utils/response.utils";
import {
  SERVICE_TAT_MESSAGES,
  SERVICE_TAT_ERRORS,
} from "./service-tat.constants";
import { MonthlySummaryQueryDto } from "./dto/monthly-summary-query.dto";
import { MonthlyServiceDetailsQueryDto } from "./dto/monthly-service-details-query.dto";
import { ServiceTatService } from "./service-tat.service";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import type { ApiResponse } from "../../../../service-lib/src/lib/utils/response.utils";
import type {
  MonthlyServiceDetailsData,
  MonthlySummaryData,
} from "./service-tat.types";
import {
  getMonthlyDetailsSwaggerMetadata,
  getMonthlySummarySwaggerMetadata,
} from "./service-tat.swagger";
import type { Request } from "express";

@ApiTags("Service TAT")
@Controller("service-tat")
export class ServiceTatController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly serviceTatService: ServiceTatService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.POLICY_SERVICE ?? "policy-service"
    );
  }

  @Get("monthly-summary")
  @getMonthlySummarySwaggerMetadata()
  async getMonthlySummary(
    @Query() query: MonthlySummaryQueryDto,
    @Req() req: Request
  ): Promise<ApiResponse<MonthlySummaryData>> {
    const userIdHeader = req.headers?.userid;
    const userId =
      typeof userIdHeader === "string" ? Number.parseInt(userIdHeader, 10) : NaN;
    if (!Number.isInteger(userId) || userId <= 0) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ServiceTatController",
          method: "getMonthlySummary",
          messageData: "Missing or invalid user context for Service TAT summary",
        }),
      });
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        SERVICE_TAT_ERRORS.MISSING_USER_CONTEXT
      );
    }
    try {
      const summary = await this.serviceTatService.getMonthlySummary(
        userId,
        query
      );
      this.logger.log({
        level: "log",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "ServiceTatController",
          method: "getMonthlySummary",
          messageData: `Fetched Service TAT monthly summary for org ${summary.orgId} year ${summary.year}${
            summary.companyId ? ` company ${summary.companyId}` : ""
          } for user ${userId}`,
        }),
      });
      return createResponse(
        HttpStatus.OK,
        SERVICE_TAT_MESSAGES.MONTHLY_SUMMARY_SUCCESS,
        summary
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ServiceTatController",
          method: "getMonthlySummary",
          messageData: `Failed to fetch Service TAT monthly summary for user ${userId}: ${
            error instanceof Error ? error.message : error
          }`,
        }),
      });
      return createErrorResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        SERVICE_TAT_ERRORS.MONTHLY_SUMMARY_FAILED
      );
    }
  }

  @Get("monthly-details")
  @getMonthlyDetailsSwaggerMetadata()
  async getMonthlyDetails(
    @Query() query: MonthlyServiceDetailsQueryDto,
    @Req() req: Request
  ): Promise<ApiResponse<MonthlyServiceDetailsData>> {
    const userIdHeader = req.headers?.userid;
    const userId =
      typeof userIdHeader === "string" ? Number.parseInt(userIdHeader, 10) : NaN;
    if (!Number.isInteger(userId) || userId <= 0) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ServiceTatController",
          method: "getMonthlyDetails",
          messageData: "Missing or invalid user context for Service TAT details",
        }),
      });
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        SERVICE_TAT_ERRORS.MISSING_USER_CONTEXT
      );
    }
    try {
      const details = await this.serviceTatService.getMonthlyServiceDetails(
        userId,
        query
      );
      this.logger.log({
        level: "log",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "ServiceTatController",
          method: "getMonthlyDetails",
          messageData: `Fetched Service TAT monthly details for org ${details.orgId} month ${details.month}${
            details.companyId ? ` company ${details.companyId}` : ""
          } for user ${userId}`,
        }),
      });
      return createResponse(
        HttpStatus.OK,
        SERVICE_TAT_MESSAGES.MONTHLY_DETAILS_SUCCESS,
        details
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "ServiceTatController",
          method: "getMonthlyDetails",
          messageData: `Failed to fetch Service TAT monthly details for user ${userId}: ${
            error instanceof Error ? error.message : error
          }`,
        }),
      });
      return createErrorResponse(
        HttpStatus.INTERNAL_SERVER_ERROR,
        SERVICE_TAT_ERRORS.MONTHLY_DETAILS_FAILED
      );
    }
  }

}