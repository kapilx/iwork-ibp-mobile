import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import {
  createErrorResponse,
  createResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { HclIntegrationService } from "./hcl-integration.service";

// integrations/hcl/process-enroll-data is HCL's inbound push endpoint (no
// JWT — see auth.guard.ts bypass entry) — every other route here is called
// by an authenticated RiskWatch admin session and goes through the normal
// gateway auth. Lives in external-integration-service (not ibp-service) —
// this is the dedicated home for any inbound, external-system-initiated
// integration; a future one gets its own sibling module here (e.g.
// src/app/<partner>-integration/), not a new service. See
// docs/HCL-Employee-Interface-Sync/HCL-Employee-Interface-Sync-TRD.md.
//
// Every route below logs at each step/transition (received → delegating →
// succeeded/failed), not just on error — added specifically to make this
// integration debuggable end-to-end without needing to reproduce a failure,
// since HCL's inbound calls in particular can't be re-triggered on demand.
@ApiTags("HCL Employee Interface")
@Controller("integrations/hcl")
export class HclIntegrationController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly hclService: HclIntegrationService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.EXTERNAL_INTEGRATION_SERVICE);
  }

  private logStep(method: string, messageData: unknown): void {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "HclIntegrationController",
        method,
        messageData,
      }),
    });
  }

  private logFailure(method: string, payload: Record<string, unknown>, err: unknown): void {
    this.logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "failure",
        location: "HclIntegrationController",
        method,
        payload,
        messageData: err instanceof Error ? { message: err.message, stack: err.stack } : err,
      }),
    });
  }

  // The single documented HCL endpoint — dispatches on Flag_operationType.
  // Path is a Phase-scoped route, not the literal
  // broker.integratedbenefitsportal.com/HRMService/api/IIRMHCLService/... —
  // matching that literal path is a go-live decision with HCL, not built here.
  @Post("process-enroll-data")
  async processEnrollData(@Body() body: unknown, @Req() req: Request, @Res() res: Response) {
    // HclIntegrationService.processEnrollData already has its own top-level
    // catch and is guaranteed to resolve (never reject) with HCL's
    // documented shape — this is a final belt-and-suspenders net, matching
    // the same try/catch coverage every other route on this controller has,
    // in case something outside that method's own try (e.g. reading
    // req.headers) ever throws.
    this.logStep("processEnrollData", {
      message: "Request received",
      ip: req.ip ?? (req.socket as any)?.remoteAddress ?? null,
      flagOperationType: (body as any)?.Flag_operationType,
      policyno: (body as any)?.policyno,
      entryCount: Array.isArray((body as any)?.objEMPLOYEE_DATA)
        ? (body as any).objEMPLOYEE_DATA.length
        : undefined,
    });
    try {
      const userId = parseInt(String((req as any)?.headers?.userid ?? "0"), 10) || 0;
      this.logStep("processEnrollData", { message: "Delegating to HclIntegrationService.processEnrollData" });
      const { status, body: responseBody } = await this.hclService.processEnrollData(
        body,
        userId,
        {
          endpoint: req.originalUrl ?? req.path,
          httpMethod: req.method,
          ip: req.ip ?? (req.socket as any)?.remoteAddress ?? null,
          headers: req.headers as Record<string, unknown>,
        },
      );
      this.logStep("processEnrollData", {
        message: "Responding to HCL",
        status,
        callStatus: responseBody?.GetStatus?.callStatus,
        returnMessage: responseBody?.GetStatus?.returnMessage,
      });
      return res.status(status).json(responseBody);
    } catch (error) {
      this.logFailure("processEnrollData", { flagOperationType: (body as any)?.Flag_operationType }, error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        GetEmpDetails: null,
        GetEmpStatus: [],
        GetStatus: {
          callStatus: false,
          procedureStatus: false,
          returnMessage:
            error instanceof Error
              ? `Unexpected error while processing request: ${error.message}`
              : "Unexpected error while processing request.",
          returnValue: 0,
        },
      });
    }
  }

  @Get("company/:companyId/intake")
  async getIntakeForCompany(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Query("status") status: string | undefined,
    @Query("page") pageRaw: string | undefined,
    @Query("limit") limitRaw: string | undefined,
    @Res() res: Response,
  ) {
    this.logStep("getIntakeForCompany", { message: "Request received", companyId, status, pageRaw, limitRaw });
    try {
      // Defaults match the dialog's own defaults (page 1, 10 per page) — a
      // company can accumulate a large number of intake rows over time, so
      // this must never fall back to fetching everything unbounded.
      const page = Math.max(1, parseInt(String(pageRaw ?? "1"), 10) || 1);
      const limit = Math.max(1, Math.min(100, parseInt(String(limitRaw ?? "10"), 10) || 10));
      this.logStep("getIntakeForCompany", { message: "Delegating to HclIntegrationService.listForCompany", companyId, status, page, limit });
      const { records, total } = await this.hclService.listForCompany(companyId, status, page, limit);
      this.logStep("getIntakeForCompany", { message: "Fetched successfully", companyId, total, returned: records.length });
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "HCL intake records fetched", { records, total, page, limit }));
    } catch (error) {
      this.logFailure("getIntakeForCompany", { companyId, status }, error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : "Failed to fetch HCL intake records",
          ),
        );
    }
  }

  // Rows whose policyno never resolved to a real policy (e.g. HCL's own
  // placeholder test payloads) — otherwise invisible via the company/policy
  // scoped routes below, since both require a non-null id.
  @Get("intake/unresolved")
  async getUnresolvedIntake(@Query("status") status: string | undefined, @Res() res: Response) {
    this.logStep("getUnresolvedIntake", { message: "Request received", status });
    try {
      const records = await this.hclService.listUnresolved(status);
      this.logStep("getUnresolvedIntake", { message: "Fetched successfully", returned: records.length });
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "HCL unresolved intake records fetched", { records }));
    } catch (error) {
      this.logFailure("getUnresolvedIntake", { status }, error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : "Failed to fetch HCL intake records",
          ),
        );
    }
  }

  @Get("policy/:policyId/intake")
  async getIntakeForPolicy(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("status") status: string | undefined,
    @Res() res: Response,
  ) {
    this.logStep("getIntakeForPolicy", { message: "Request received", policyId, status });
    try {
      const records = await this.hclService.listForPolicy(policyId, status);
      this.logStep("getIntakeForPolicy", { message: "Fetched successfully", policyId, returned: records.length });
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "HCL intake records fetched", { records }));
    } catch (error) {
      this.logFailure("getIntakeForPolicy", { policyId, status }, error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : "Failed to fetch HCL intake records",
          ),
        );
    }
  }

  // Called by RiskWatch after it has driven the selected intake records
  // through the existing enrollment-upload endpoint (reusing
  // ZohoEndorsementPage's flow client-side — TRD §6/§8). Moves the selected
  // records to PROCESSING and records the resulting document_processing_file
  // reference; the scheduler-service reconciliation poller later flips them
  // to PROCESSED/FAILED once that upload actually finishes (TRD §10).
  @Post("intake/mark-processing")
  async markProcessing(
    @Body("intakeIds") intakeIds: number[],
    @Body("documentProcessingFileId", ParseIntPipe) documentProcessingFileId: number,
    @Body("endorsementId") endorsementId: number | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    this.logStep("markProcessing", {
      message: "Request received",
      intakeIds,
      documentProcessingFileId,
      endorsementId,
    });
    try {
      const userId = parseInt(String((req as any)?.headers?.userid ?? "0"), 10) || 0;
      if (!Array.isArray(intakeIds) || !intakeIds.length) {
        this.logStep("markProcessing", { message: "Rejected — intakeIds missing/empty" });
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(createErrorResponse(HttpStatus.BAD_REQUEST, "intakeIds is required"));
      }
      this.logStep("markProcessing", {
        message: "Delegating to HclIntegrationService.markSelectedProcessing",
        intakeIds,
        documentProcessingFileId,
        endorsementId,
        userId,
      });
      await this.hclService.markSelectedProcessing(
        intakeIds,
        documentProcessingFileId,
        endorsementId,
        userId,
      );
      this.logStep("markProcessing", { message: "Marked as processing successfully", intakeIds });
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Intake records marked as processing", { intakeIds }));
    } catch (error) {
      this.logFailure("markProcessing", { intakeIds, documentProcessingFileId, endorsementId }, error);
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : "Failed to update HCL intake records",
          ),
        );
    }
  }
}
