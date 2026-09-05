import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpStatus,
  NotFoundException,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import type { Request, Response } from "express";
import {
  createResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import {
  LOG_STATUS,
  LogStatus,
  serviceNames,
} from "../../../../service-lib/src/lib/constants";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import {
  SendAddedDependentsNotificationDto,
  SendEnrollmentConfirmationDto,
  SendEnrollmentReminderDto,
  SendEnrollmentStartDto,
  SendInitialOnboardingDto,
  TriggerCompanyInitialOnboardingDto,
  TriggerTestInitialOnboardingDto,
  SendBulkEnrollmentConfirmationDto,
  TriggerTestEnrollmentConfirmationDto,
  SendLifeEventConfirmationDto,
  SendApologyWelcomeEmailDto,
} from "./dto/enrollment.dto";
import { SendClaimIntimationConfirmationDto, SendSupportTicketConfirmationDto, SendSupportTicketStatusChangedDto } from "../company-employee/dto/claims.dto";
import { OnboardingService } from "./onboarding.service";
import {
  SendEnrollmentConfirmationSwagger,
  SendLifeEventConfirmationSwagger,
  SendEnrollmentReminderSwagger,
  SendEnrollmentStartSwagger,
  TriggerCompanyInitialOnboardingSwagger,
  TriggerTestInitialOnboardingSwagger,
  SendBulkEnrollmentConfirmationSwagger,
  TriggerTestEnrollmentConfirmationSwagger,
  PreviewBulkEnrollmentConfirmationSwagger,
  SendApologyWelcomeEmailSwagger,
  acceptTermsSwaggerMetadata,
  getTermsAndConditionsSwagger,
  withdrawTermsSwaggerMetadata,
  getUserTcStatusSwagger,
} from "./onboarding.swagger";
import { AcceptTermsDto, WithdrawTermsDto } from "./dto/accept-terms.dto";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";

@Controller("onboarding")
export class OnboardingController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly onboardingService: OnboardingService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.IBP_SERVICE);
  }

  // Triggers onboarding mail for every pending employee under a company (or
  // domain, if subDomain is given) -- potentially a large batch. Fires the
  // send in the background and responds immediately, same hit-and-release
  // pattern as sendBulkEnrollmentConfirmation/sendEnrollmentReminderNotification
  // below, so the iWork admin request doesn't block on a large employee count.
  @TriggerCompanyInitialOnboardingSwagger()
  @Post("initial-notification/company")
  async triggerCompanyInitialOnboardingNotifications(
    @Body() body: TriggerCompanyInitialOnboardingDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const triggeredByUserId = this.getTriggeredByUserId(req);
    this.logInfo(
      "triggerCompanyInitialOnboardingNotifications",
      "method invoked",
      { ...body, triggeredByUserId },
    );

    res.status(HttpStatus.ACCEPTED).json(
      createResponse(
        HttpStatus.ACCEPTED,
        "Onboarding mail processing started",
        { success: true },
      ),
    );

    void this.onboardingService
      .triggerCompanyInitialOnboardingNotifications(
        body.companyId,
        body.subDomain,
        triggeredByUserId,
      )
      .catch((error) => {
        this.logError("triggerCompanyInitialOnboardingNotifications", error, { ...body, triggeredByUserId });
      });
  }

  // Preview which employees a triggerCompanyInitialOnboardingNotifications
  // run would mail -- same eligibility filter as the trigger itself, paginated.
  // Mirrors previewBulkEnrollmentConfirmation below for the confirmation flow.
  @Get("initial-notification/company/preview")
  async previewCompanyInitialOnboardingNotifications(
    @Query("companyId", ParseIntPipe) companyId: number,
    @Query("subDomain") subDomain: string | undefined,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Res() res: Response,
  ) {
    try {
      this.logInfo("previewCompanyInitialOnboardingNotifications", "method invoked", {
        companyId,
        subDomain,
        page,
        limit,
      });
      const data = await this.onboardingService.previewCompanyInitialOnboardingNotifications(
        companyId,
        subDomain,
        page,
        limit,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Preview fetched successfully", data));
    } catch (error) {
      this.logError("previewCompanyInitialOnboardingNotifications", error, {
        companyId,
        subDomain,
        page,
        limit,
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  // Whether a triggerCompanyInitialOnboardingNotifications send is currently
  // running for this company/domain -- lets the UI keep the trigger button
  // disabled for the whole background job instead of just the initial request.
  @Get("initial-notification/company/status")
  async getCompanyInitialOnboardingStatus(
    @Query("companyId", ParseIntPipe) companyId: number,
    @Query("subDomain") subDomain: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const inProgress = await this.onboardingService.isOnboardingJobInProgress(
        companyId,
        subDomain,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Status fetched successfully", { inProgress }));
    } catch (error) {
      this.logError("getCompanyInitialOnboardingStatus", error, { companyId, subDomain });
      return handleErrorResponse(error as Error, res);
    }
  }

  @TriggerTestInitialOnboardingSwagger()
  @Post("initial-notification/test-employee")
  async triggerTestInitialOnboardingNotification(
    @Body() body: TriggerTestInitialOnboardingDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      this.logInfo(
        "triggerTestInitialOnboardingNotification",
        "method invoked",
        { ...body, triggeredByUserId: this.getTriggeredByUserId(req) },
      );
      const data =
        await this.onboardingService.triggerTestInitialOnboardingNotification(
          body.companyId,
          body.email,
          body.subDomain,
        );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, data.message, data));
    } catch (error) {
      this.logError("triggerTestInitialOnboardingNotification", error, body);
      return handleErrorResponse(error as Error, res);
    }
  }

  private logInfo(
    method: string,
    messageData = "method invoked",
    payload = {},
    status: LogStatus = LOG_STATUS.SUCCESS,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status,
        location: "OnboardingController",
        method,
        payload,
        messageData,
      }),
    });
  }

  // These endpoints are called by an authenticated employee's own portal
  // session, whose auth token already carries the exact configId their
  // session was issued for (see login — the token embeds companyId AND
  // configId together, e.g. { companyId: 36980, configId: 17, ... }).
  // Passing it straight through to the service is far more reliable than
  // re-deriving it afterward from companyId+policyId (company_portal_
  // config_scope may not cover the specific policy involved) — same
  // decode pattern already used by CompanyEmployeeController's
  // listEmployeePolicies. Returns null (not a throw) for internal/system-
  // triggered calls that have no live user token — callers fall back to
  // their existing company/policy-based resolution then.
  private extractConfigIdFromToken(req: Request): number | null {
    try {
      const rawToken = String(req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
      const jwtPayload = JSON.parse(Buffer.from(rawToken.split(".")[1], "base64url").toString());
      return jwtPayload?.configId ?? null;
    } catch {
      return null;
    }
  }

  // Identity of the admin/HR user who hit the endpoint, forwarded by the
  // gateway's catch-all proxy from the verified JWT (see AuthGuard). Absent
  // (0) for server-to-server calls with no live user session, e.g. the
  // cron scheduler hitting enrollment-reminder directly -- that's expected
  // and itself meaningful (it tells "system/cron" apart from a real click).
  // Same convention already used in hr.controller.ts / zoho-integration.controller.ts.
  private getTriggeredByUserId(req: Request): number {
    return parseInt(String((req as any)?.headers?.userid ?? "0"), 10) || 0;
  }

  private logError(method: string, error: any, payload = {}) {
    this.logger.error({
      level: "error",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: LOG_STATUS.FAILURE,
        location: "OnboardingController",
        method,
        payload,
        messageData: error,
      }),
    });
  }

  // Send initial onboarding notification to employee
  @Post("initial-notification")
  async sendInitialOnboardingNotification(
    @Body() dto: SendInitialOnboardingDto,
    @Req() req: Request,
    // @Res() res: Response,
  ) {
    try {
      const triggeredByUserId = this.getTriggeredByUserId(req);
      this.logInfo("sendInitialOnboardingNotification", "method invoked", { ...dto, triggeredByUserId });
      return this.onboardingService.sendInitialOnboardingNotification(
        dto,
        this.extractConfigIdFromToken(req),
        triggeredByUserId,
      );
    } catch (error) {
      console.log("Error in sendInitialOnboardingNotification:", error);
      this.logError("sendInitialOnboardingNotification", error, dto);
      return `${error.message}`;
    }
  }

  // Send enrollment start notification
  @SendEnrollmentStartSwagger()
  @Post("enrollment-start")
  async sendEnrollmentStartNotification(
    @Body() body: SendEnrollmentStartDto,
    @Res() res: Response,
  ) {
    try {
      this.logInfo("sendEnrollmentStartNotification", "method invoked", body);
      const data = await this.onboardingService.sendEnrollmentStartNotification(
        body,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, data.message, data));
    } catch (error) {
      this.logError("sendEnrollmentStartNotification", error, body);
      return handleErrorResponse(error as Error, res);
    }
  }

  // Send enrollment confirmation notification
  @SendEnrollmentConfirmationSwagger()
  @Post("enrollment-confirmation")
  async sendEnrollmentConfirmationNotification(
    @Body() body: SendEnrollmentConfirmationDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      this.logInfo("sendEnrollmentConfirmationNotification");
      const data =
        await this.onboardingService.sendEnrollmentConfirmationNotification(
          body,
          this.extractConfigIdFromToken(req),
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Enrollment confirmation notification sent successfully",
            data,
          ),
        );
    } catch (error) {
      this.logError("sendEnrollmentConfirmationNotification", error, body);
      return handleErrorResponse(error as Error, res);
    }
  }

  @SendLifeEventConfirmationSwagger()
  @Post("life-event-confirmation")
  async sendLifeEventConfirmationNotification(
    @Body() body: SendLifeEventConfirmationDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      this.logInfo("sendLifeEventConfirmationNotification", "method invoked", body);
      const data =
        await this.onboardingService.sendLifeEventConfirmationNotification(
          body,
          this.extractConfigIdFromToken(req),
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Life event confirmation notification sent successfully",
            data,
          ),
        );
    } catch (error) {
      this.logError("sendLifeEventConfirmationNotification", error, body);
      return handleErrorResponse(error as Error, res);
    }
  }

  @Post("added-dependents-confirmation")
  async sendAddedDependentsNotification(
    @Body() body: SendAddedDependentsNotificationDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      this.logInfo("sendAddedDependentsNotification", "method invoked", body);
      const data = await this.onboardingService.sendAddedDependentsNotification(
        body,
        this.extractConfigIdFromToken(req),
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Added dependents notification sent successfully", data));
    } catch (error) {
      this.logError("sendAddedDependentsNotification", error, body);
      return handleErrorResponse(error as Error, res);
    }
  }

  @Post("claim-intimation-confirmation")
  async sendClaimIntimationConfirmationNotification(
    @Body() body: SendClaimIntimationConfirmationDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      this.logInfo("sendClaimIntimationConfirmationNotification", "method invoked", body);
      const data = await this.onboardingService.sendClaimIntimationConfirmationNotification(
        body,
        this.extractConfigIdFromToken(req),
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Claim intimation confirmation notification sent successfully", data));
    } catch (error) {
      this.logError("sendClaimIntimationConfirmationNotification", error, body);
      return handleErrorResponse(error as Error, res);
    }
  }

  @Post("support-ticket-confirmation")
  async sendSupportTicketConfirmationNotification(
    @Body() body: SendSupportTicketConfirmationDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      this.logInfo("sendSupportTicketConfirmationNotification", "method invoked", body);
      const data = await this.onboardingService.sendSupportTicketConfirmationNotification(
        body,
        this.extractConfigIdFromToken(req),
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Support ticket confirmation notification sent successfully", data));
    } catch (error) {
      this.logError("sendSupportTicketConfirmationNotification", error, body);
      return handleErrorResponse(error as Error, res);
    }
  }

  @Post("support-ticket-status-changed")
  async sendSupportTicketStatusChangedNotification(
    @Body() body: SendSupportTicketStatusChangedDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      this.logInfo("sendSupportTicketStatusChangedNotification", "method invoked", body);
      const data = await this.onboardingService.sendSupportTicketStatusChangedNotification(
        body,
        this.extractConfigIdFromToken(req),
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Support ticket status change notification sent successfully", data));
    } catch (error) {
      this.logError("sendSupportTicketStatusChangedNotification", error, body);
      return handleErrorResponse(error as Error, res);
    }
  }

  // Send enrollment reminder notification based on enrollmentEndDate
  @SendEnrollmentReminderSwagger()
  @Post("enrollment-reminder")
  async sendEnrollmentReminderNotification(
    @Body() body: SendEnrollmentReminderDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Non-zero only for the manual "Send Enrolment Reminders" HR button, which
    // carries a real gateway-forwarded JWT identity -- the cron scheduler hits
    // this same endpoint server-to-server with no user header, so 0 here means
    // "system/cron", not "unknown user".
    const triggeredByUserId = this.getTriggeredByUserId(req);
    this.logInfo("sendEnrollmentReminderNotification", "background job accepted", {
      triggerDate: body.triggerDate,
      triggeredByUserId,
    });
    // Return immediately so the scheduler HTTP call doesn't time out on large employee counts.
    // Processing continues in the background.
    res.status(HttpStatus.ACCEPTED).json(
      createResponse(HttpStatus.ACCEPTED, "Enrollment reminder processing started", { success: true }),
    );
    void this.onboardingService.sendEnrollmentReminderNotification(body, triggeredByUserId).catch((error) => {
      this.logError("sendEnrollmentReminderNotification", error, { ...body, triggeredByUserId });
    });
  }

  // Send bulk enrollment confirmation to all enrolled employees of a company.
  // Fires the (potentially 10K+ employee) send in the background and responds
  // immediately — mirrors the sendApologyWelcomeEmail background-trigger pattern below.
  @SendBulkEnrollmentConfirmationSwagger()
  @Post("bulk-enrollment-confirmation")
  async sendBulkEnrollmentConfirmation(
    @Body() body: SendBulkEnrollmentConfirmationDto,
    @Res() res: Response,
  ) {
    this.logInfo("sendBulkEnrollmentConfirmation", "method invoked", body);

    res.status(HttpStatus.ACCEPTED).json(
      createResponse(
        HttpStatus.ACCEPTED,
        "Bulk enrollment confirmation processing started",
        { success: true },
      ),
    );

    void this.onboardingService
      .sendBulkEnrollmentConfirmation(
        body.companyId,
        body.employeeIds,
        body.subDomain,
      )
      .catch((error) => {
        this.logError("sendBulkEnrollmentConfirmation", error, body);
      });
  }

  // Preview which employees a bulk-enrollment-confirmation trigger would mail —
  // same eligibility filter as the trigger itself, paginated.
  @PreviewBulkEnrollmentConfirmationSwagger()
  @Get("bulk-enrollment-confirmation/preview")
  async previewBulkEnrollmentConfirmation(
    @Query("companyId", ParseIntPipe) companyId: number,
    @Query("subDomain") subDomain: string | undefined,
    @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query("limit", new DefaultValuePipe(25), ParseIntPipe) limit: number,
    @Res() res: Response,
  ) {
    try {
      this.logInfo("previewBulkEnrollmentConfirmation", "method invoked", {
        companyId,
        subDomain,
        page,
        limit,
      });
      const data = await this.onboardingService.previewBulkEnrollmentConfirmation(
        companyId,
        subDomain,
        page,
        limit,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Preview fetched successfully", data));
    } catch (error) {
      this.logError("previewBulkEnrollmentConfirmation", error, {
        companyId,
        subDomain,
        page,
        limit,
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  // Whether a bulk-enrollment-confirmation send is currently running for this
  // company/domain — lets the UI keep the trigger button disabled for the whole
  // background job instead of just the initial request.
  @Get("bulk-enrollment-confirmation/status")
  async getBulkEnrollmentConfirmationStatus(
    @Query("companyId", ParseIntPipe) companyId: number,
    @Query("subDomain") subDomain: string | undefined,
    @Res() res: Response,
  ) {
    try {
      const inProgress = await this.onboardingService.isConfirmationJobInProgress(
        companyId,
        subDomain,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Status fetched successfully", { inProgress }));
    } catch (error) {
      this.logError("getBulkEnrollmentConfirmationStatus", error, { companyId, subDomain });
      return handleErrorResponse(error as Error, res);
    }
  }

  // Test-trigger the enrollment confirmation mail for a single employee, identified by email
  @TriggerTestEnrollmentConfirmationSwagger()
  @Post("enrollment-confirmation/test-employee")
  async triggerTestEnrollmentConfirmationNotification(
    @Body() body: TriggerTestEnrollmentConfirmationDto,
    @Res() res: Response,
  ) {
    try {
      this.logInfo(
        "triggerTestEnrollmentConfirmationNotification",
        "method invoked",
        body,
      );
      const data =
        await this.onboardingService.triggerTestEnrollmentConfirmationNotification(
          body.companyId,
          body.email,
          body.subDomain,
        );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, data.message, data));
    } catch (error) {
      this.logError("triggerTestEnrollmentConfirmationNotification", error, body);
      return handleErrorResponse(error as Error, res);
    }
  }

  // Send apology email to employees who may have incorrectly received an earlier welcome email.
  // Fires the (potentially 4000+ employee) send in the background and responds immediately —
  // mirrors the sendEnrollmentReminderNotification background-trigger pattern above.
  @SendApologyWelcomeEmailSwagger()
  @Post("apology-welcome-email")
  async sendApologyWelcomeEmail(
    @Body() body: SendApologyWelcomeEmailDto,
    @Res() res: Response,
  ) {
    this.logInfo("sendApologyWelcomeEmail", "method invoked", {
      totalEmployees: body.employeeIds?.length ?? 0,
    });

    res.status(HttpStatus.ACCEPTED).json(
      createResponse(
        HttpStatus.ACCEPTED,
        `Apology welcome email triggered for ${body.employeeIds.length} employee(s)`,
        { success: true, totalEmployees: body.employeeIds.length },
      ),
    );

    void this.onboardingService
      .sendApologyWelcomeEmail(body.employeeIds)
      .catch((error) => {
        this.logError("sendApologyWelcomeEmail", error, {
          totalEmployees: body.employeeIds?.length ?? 0,
        });
      });
  }

  @Post("terms-conditions/accept")
  @acceptTermsSwaggerMetadata()
  async acceptTerms(
    @Body() acceptTermsDto: AcceptTermsDto,
    @Res() res: Response
  ): Promise<any> {
    const userId = acceptTermsDto.userId;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "OnboardingController",
        method: "acceptTerms",
        payload: acceptTermsDto,
        messageData: "method invoked",
      }),
    });
    try {
      await this.onboardingService.acceptTerms(userId, acceptTermsDto.tcVersion);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "OnboardingController",
          method: "acceptTerms",
          payload: acceptTermsDto,
          messageData: "Terms accepted successfully",
        }),
      });
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "Terms accepted",
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "OnboardingController",
          method: "acceptTerms",
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          error instanceof Error
            ? error.message
            : errorMessages.internalServerError,
      });
    }
  }

  @Get("terms-conditions/active")
  @getTermsAndConditionsSwagger()
  async getTermsAndConditions(@Res() res: Response): Promise<any> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "OnboardingController",
        method: "getTermsAndConditions",
        messageData: "method invoked",
      }),
    });
    try {
      const data = await this.onboardingService.getTermsAndConditions();
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "OnboardingController",
          method: "getTermsAndConditions",
          messageData: "Terms and conditions fetched successfully",
        }),
      });
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "Terms and conditions fetched successfully",
        data,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "OnboardingController",
          method: "getTermsAndConditions",
          messageData: error,
        }),
      });
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          error instanceof Error
            ? error.message
            : errorMessages.internalServerError,
      });
    }
  }

  @Post("terms-conditions/withdraw")
  @withdrawTermsSwaggerMetadata()
  async withdrawTerms(
    @Body() body: WithdrawTermsDto,
    @Res() res: Response
  ): Promise<any> {
    const userId = body.userId;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "OnboardingController",
        method: "withdrawTerms",
        payload: body,
        messageData: "method invoked",
      }),
    });
    try {
      await this.onboardingService.withdrawTerms(userId);
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "OnboardingController",
          method: "withdrawTerms",
          payload: body,
          messageData: "Terms withdrawn successfully",
        }),
      });
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "Terms withdrawn",
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "OnboardingController",
          method: "withdrawTerms",
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error instanceof Error ? error.message : errorMessages.internalServerError,
      });
    }
  }

  @Get("terms-conditions/user-status")
  @getUserTcStatusSwagger()
  async getUserTcStatus(
    @Query("userId") userId: number,
    @Res() res: Response
  ): Promise<any> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "OnboardingController",
        method: "getUserTcStatus",
        messageData: "method invoked",
      }),
    });
    try {
      const data = await this.onboardingService.getUserTcStatus(Number(userId));
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "User TC status fetched successfully",
        data,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "OnboardingController",
          method: "getUserTcStatus",
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error instanceof Error ? error.message : errorMessages.internalServerError,
      });
    }
  }
}
