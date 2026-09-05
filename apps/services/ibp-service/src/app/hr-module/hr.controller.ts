import { Body, Controller, Get, HttpStatus, Param, ParseIntPipe, Post, Put, Query, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import {
  createErrorResponse,
  createResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { GenerateReportQueryDto } from "./dto/generate-report-query.dto";
import { downloadReportSwaggerMetadata, generateReportSwaggerMetadata } from "./hr.swagger";
import { HrService } from "./hr.service";
import { CreateExternalHrDto } from "./dto/create-external-hr.dto";
import { UpdateExternalHrDto } from "./dto/update-external-hr.dto";

@ApiTags("HR")
@Controller("hr-module")
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get("global-search")
  async globalSearch(
    @Query("q") q: string,
    @Query("companyId", ParseIntPipe) companyId: number,
    @Query("hrManagementId") hrManagementIdParam: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      if (!q || q.trim().length < 2) {
        return (res as unknown as import("express").Response)
          .status(HttpStatus.OK)
          .json(createResponse(HttpStatus.OK, successMessage.reportUserActivityGeneratedSuccessfully, { employees: [], claims: [], policies: [] }));
      }
      // Use explicitly passed hrManagementId, else resolve from userid header
      const explicitHrId = hrManagementIdParam ? parseInt(hrManagementIdParam, 10) : null;
      const userId = explicitHrId ? 0 : (parseInt(String(req?.headers?.userid ?? "0"), 10) || 0);
      const data = await this.hrService.globalSearch(companyId, q.trim(), userId, explicitHrId);
      return (res as unknown as import("express").Response)
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.reportUserActivityGeneratedSuccessfully, data));
    } catch (error) {
      return (res as unknown as import("express").Response)
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, error instanceof Error ? error.message : errorMessages.reportUserActivityGenerationFailed));
    }
  }

  @Get("company-hierarchy")
  async companyHierarchy(
    @Query("search") search: string,
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Res() res: Response,
  ) {
    try {
      const data = await this.hrService.getCompanyHierarchy(
        search || "",
        Math.max(1, parseInt(page || "1", 10)),
        Math.min(1000, Math.max(1, parseInt(limit || "50", 10))),
      );
      return (res as unknown as import("express").Response)
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, successMessage.reportUserActivityGeneratedSuccessfully, data));
    } catch (error) {
      return (res as unknown as import("express").Response)
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, error instanceof Error ? error.message : errorMessages.reportUserActivityGenerationFailed));
    }
  }

  @Get("policy/:policyId/pending-enrollment-employees")
  async getPendingEnrollmentEmployees(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Res() res: Response,
  ) {
    try {
      const employeeIds = await this.hrService.getPendingEnrollmentEmployeeIds(policyId);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Pending enrollment employees retrieved.", { employeeIds }));
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve pending enrollment employees."),
      );
    }
  }

  @Put("employee/:employeeId/vip")
  async setEmployeeVip(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Body() body: { isVip: boolean },
    @Res() res: Response,
  ) {
    try {
      await this.hrService.setEmployeeVip(employeeId, !!body.isVip);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "VIP status updated.", { employeeId, isVip: !!body.isVip }));
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json(
        createErrorResponse(HttpStatus.BAD_REQUEST, error instanceof Error ? error.message : "Failed to update VIP status."),
      );
    }
  }

  @Put("employee/:employeeId/block")
  async setEmployeeBlocked(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Body() body: { isBlocked: boolean },
    @Res() res: Response,
  ) {
    try {
      await this.hrService.setEmployeeBlocked(employeeId, !!body.isBlocked);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Employee block status updated.", { employeeId, isBlocked: !!body.isBlocked }));
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json(
        createErrorResponse(HttpStatus.BAD_REQUEST, error instanceof Error ? error.message : "Failed to update block status."),
      );
    }
  }

  @Post("employee-profile")
  async employeeProfile(
    @Body() body: { employeeId?: number; search?: string },
    @Res() res: Response,
  ) {
    try {
      const data = await this.hrService.getEmployeeProfile(
        body.employeeId != null ? Number(body.employeeId) : null,
        body.search ?? null,
      );
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, successMessage.reportUserActivityGeneratedSuccessfully, data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, error instanceof Error ? error.message : errorMessages.reportUserActivityGenerationFailed));
    }
  }

  @Post("generate/:report")
  @generateReportSwaggerMetadata()
  async generate(
    @Param("report") report: string,
    @Body() body: Record<string, string>,
    @Query() query: GenerateReportQueryDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const rawToken = String(req?.headers?.authorization || "").replace(/^Bearer\s+/i, "");
      let jwtRoleKey = "";
      try {
        const decoded: any = JSON.parse(Buffer.from(rawToken.split(".")[1], "base64url").toString());
        jwtRoleKey = decoded?.roleKey ?? "";
      } catch { /* non-JWT or missing token */ }
      const userId = parseInt(String(req?.headers?.userid ?? "0"), 10);
      console.log("Generating report with params:", { report, body, query, jwtRoleKey, userId });
      const data = await this.hrService.generateReport(
        report,
        { ...body },
        {
          page: query.page,
          limit: query.limit,
          sort: query.sort,
        },
        userId,
      );
      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            successMessage.reportUserActivityGeneratedSuccessfully,
            data,
          ),
        );
    } catch (error) {
      console.log("Error generating report:", error);
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.reportUserActivityGenerationFailed,
          ),
        );
    }
  }

  @Post("report/:report/count")
  async countReport(
    @Param("report") report: string,
    @Body() body: Record<string, string>,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const userId = parseInt(String(req?.headers?.userid ?? "0"), 10);
      const data = await this.hrService.countReport(report, { ...body }, userId);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Count retrieved successfully.", data));
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json(
        createErrorResponse(HttpStatus.BAD_REQUEST, error instanceof Error ? error.message : "Failed to retrieve count."),
      );
    }
  }

  @Post("external-hr")
  async createExternalHr(
    @Body() body: CreateExternalHrDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.hrService.createExternalHrUser(body);
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, "External HR user created successfully.", data));
    } catch (error) {
      const status = (error as { status?: number })?.status || HttpStatus.BAD_REQUEST;
      return res
        .status(status)
        .json(createErrorResponse(status, error instanceof Error ? error.message : "Failed to create External HR user."));
    }
  }

  @Get("policy/:policyId/endorsement/:endorsementId/stats")
  async endorsementStats(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Query("locationIds") locationIds: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const parsedLocationIds = locationIds
        ? locationIds.replace(/[\[\]\s]/g, "").split(",").map(Number).filter(Boolean)
        : [];
      const data = await this.hrService.getEndorsementStats(policyId, endorsementId, parsedLocationIds);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Endorsement stats retrieved successfully.", data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, error instanceof Error ? error.message : "Failed to retrieve endorsement stats."));
    }
  }

  @Get("policy/:policyId/endorsement/:endorsementId/enrollment-upload-summary")
  async enrollmentUploadSummaryByEndorsement(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("endorsementId", ParseIntPipe) endorsementId: number,
    @Res() res: Response,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    try {
      const data = await this.hrService.getEnrollmentUploadSummaryByEndorsement(
        policyId,
        endorsementId,
        Math.max(1, Number.parseInt(page ?? "1", 10) || 1),
        Math.max(1, Number.parseInt(limit ?? "20", 10) || 20),
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Enrollment upload summary retrieved successfully.", data));
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, error instanceof Error ? error.message : "Failed to retrieve enrollment upload summary."));
    }
  }

  @Get("hr-users")
  async listHrUsers(
    @Query("companyId") companyId: string,
    @Query("search") search: string,
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Res() res: Response,
  ) {
    try {
      const data = await this.hrService.listHrAdminUsers({
        companyId: companyId ? Number(companyId) : undefined,
        search: search?.trim() || undefined,
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 20,
      });
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "HR users retrieved.", data));
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve HR users."),
      );
    }
  }

  @Get("hr-users/:hrManagementId")
  async getHrUserDetail(
    @Param("hrManagementId", ParseIntPipe) hrManagementId: number,
    @Res() res: Response,
  ) {
    try {
      const record = await this.hrService.getHrUserDetail(hrManagementId);
      if (!record) {
        return res.status(HttpStatus.NOT_FOUND).json(createErrorResponse(HttpStatus.NOT_FOUND, "HR user not found."));
      }
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "HR user detail retrieved.", record));
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve HR user detail."),
      );
    }
  }

  @Put("external-hr/:hrManagementId")
  async updateExternalHr(
    @Param("hrManagementId", ParseIntPipe) hrManagementId: number,
    @Body() body: UpdateExternalHrDto,
    @Res() res: Response,
  ) {
    try {
      const data = await this.hrService.updateExternalHrUser(hrManagementId, body);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "External HR user updated successfully.", data));
    } catch (error) {
      const status = (error as { status?: number })?.status || HttpStatus.BAD_REQUEST;
      return res
        .status(status)
        .json(createErrorResponse(status, error instanceof Error ? error.message : "Failed to update External HR user."));
    }
  }

  @Post("download/:report")
  @downloadReportSwaggerMetadata()
  async download(
    @Param("report") report: string,
    @Body() body: Record<string, string>,
    @Req() req: any,
    @Res() res: Response,
  ) {
    try {
      const userId = parseInt(String(req?.headers?.userid ?? "0"), 10);
      const file = await this.hrService.downloadReport(report, { ...body }, userId);
      res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=${file.fileName || report}`,
      );
      return res.send(file.data);
    } catch (error) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : errorMessages.reportUserActivityGenerationFailed,
          ),
        );
    }
  }

  // ─── TPA Claims ─────────────────────────────────────────────────────────
  // Frontend fetches from TPA via external-app-sso/magic-url (same as ecard),
  // then POSTs the result here to persist it, and GETs it back for display.

  @Post("tpa-claims")
  async storeClaims(
    @Body() body: { policyNumber: string; claims: Record<string, any>[] },
    @Res() res: Response,
  ) {
    try {
      await this.hrService.storeClaimsMIS(body.policyNumber, body.claims ?? []);
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, successMessage.reportUserActivityGeneratedSuccessfully, { stored: true }),
      );
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : "Failed to store claims"),
      );
    }
  }

  @Get("tpa-claims")
  async getStoredClaims(@Query("policyNumber") policyNumber: string, @Res() res: Response) {
    try {
      const rows = await this.hrService.getStoredClaims(policyNumber);
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, successMessage.reportUserActivityGeneratedSuccessfully, {
          claims: rows.map((r) => r.claimData),
        }),
      );
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : "Failed to get claims"),
      );
    }
  }

  /**
   * Smart fetch endpoint — serves from DB if data is < 24 h old,
   * otherwise calls the TPA magic-url API, persists the result, and returns it.
   *
   * If another request for the same policy is currently fetching (Redis lock held),
   * returns the existing cached rows immediately with `refreshing: true` so the
   * frontend can show a "refreshing…" indicator without blocking the user.
   *
   * Query params:
   *   policyNumber     — insurer policy number (required)
   *   policyStartDate  — dd-MM-yyyy  (required when cache is stale)
   *   policyEndDate    — dd-MM-yyyy  (required when cache is stale)
   */
  @Get("tpa-claims/sync")
  async syncTpaClaims(
    @Query("policyNumber") policyNumber: string,
    @Query("policyStartDate") policyStartDate: string,
    @Query("policyEndDate") policyEndDate: string,
    @Query("employeeId") employeeIdStr: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    if (!policyNumber) {
      return res.status(HttpStatus.BAD_REQUEST).json(
        createErrorResponse(HttpStatus.BAD_REQUEST, "policyNumber is required"),
      );
    }
    try {
      const authHeader = String(req?.headers?.authorization || "");
      const employeeId = employeeIdStr ? parseInt(employeeIdStr, 10) : undefined;
      const result = await this.hrService.getOrFetchTpaClaims(
        policyNumber,
        policyStartDate,
        policyEndDate,
        authHeader,
        employeeId,
      );
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, successMessage.reportUserActivityGeneratedSuccessfully, result),
      );
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error instanceof Error ? error.message : "Failed to sync TPA claims",
        ),
      );
    }
  }

  @Post("tpa-claims/individual")
  async storeIndividualClaim(
    @Body() body: { policyNumber: string; tpaClaimNo: string; claim: Record<string, any> },
    @Res() res: Response,
  ) {
    try {
      await this.hrService.storeIndividualClaim(body.policyNumber, body.tpaClaimNo, body.claim ?? {});
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, successMessage.reportUserActivityGeneratedSuccessfully, { stored: true }),
      );
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : "Failed to store claim"),
      );
    }
  }

  @Get("tpa-claims/:claimNo")
  async getStoredIndividualClaim(@Param("claimNo") claimNo: string, @Res() res: Response) {
    try {
      const row = await this.hrService.getStoredIndividualClaim(claimNo);
      if (!row) {
        return res.status(HttpStatus.NOT_FOUND).json(createErrorResponse(HttpStatus.NOT_FOUND, "Claim not found"));
      }
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, successMessage.reportUserActivityGeneratedSuccessfully, { claim: row.claimData }),
      );
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, error instanceof Error ? error.message : "Failed to get claim"),
      );
    }
  }

  @Put("employee/:employeeId/enrollment-window")
  async updateEnrollmentWindow(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Body() body: { policyId: number; enrollmentStartDate: string | null; enrollmentEndDate: string | null },
    @Res() res: Response,
  ) {
    try {
      const data = await this.hrService.updateEnrollmentWindow(
        employeeId,
        body.policyId,
        body.enrollmentStartDate ?? null,
        body.enrollmentEndDate ?? null,
      );
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Enrollment window updated successfully", data));
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json(
        createErrorResponse(HttpStatus.BAD_REQUEST, error instanceof Error ? error.message : errorMessages.reportUserActivityGenerationFailed),
      );
    }
  }
}
