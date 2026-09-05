import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
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
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { Request, Response } from "express";
import {
  createErrorResponse,
  createResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { ApiTags } from "@nestjs/swagger";
import {
  successMessage,
  errorMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import {
  UpsertCombinedEnrollmentDataDto,
  UpsertEnrollmentDataDto,
} from "./dto/upsert-enrollment-data.dto";
import { EnrollmentBatchKeyDto } from "./dto/enrollment-batch-key.dto";
import { UpdateEnrollmentProgressDto, InitializeEnrollmentProgressDto } from "./dto/enrollment-progress.dto";
import { ExtendEnrollmentPeriodDto } from "./dto/extend-enrollment-period.dto";
import {
  loginSwaggerMetadata,
  listEmployeePoliciesSwaggerMetadata,
  getEmployeeDetailsSwaggerMetadata,
  updateEmployeeDetailsSwaggerMetadata,
  getEmployeePolicyComponentDetailsSwaggerMetadata,
  getRelationsConstraintsAndDependentsSwaggerMetadata,
  getEnrollmentSummarySwaggerMetadata,
  getPolicyEmployeeInsuredDetailsSwaggerMetadata,
  updateCompanyEmployeePasswordSwaggerMetadata,
  processEmployeeUploadSwaggerMetadata,
  getEmployeeFaqsSwaggerMetadata,
  uploadEmployeeFileSwaggerMetadata,
  downloadEmployeeFileSwaggerMetadata,
  bulkDownloadEmployeeFilesSwaggerMetadata,
  getPolicyFeatureDocumentByEmployeeSwaggerMetadata,
  getEmployeePolicyOverviewSwaggerMetadata,
  getEmployeeContactMatrixSwaggerMetadata,
  getCompanyPortalConfigurationSwaggerMetadata,
  getCompanyAdditionalDocumentsSwaggerMetadata,
  getEmployeePersonalDocumentsSwaggerMetadata,
  upsertEmployeePersonalDocumentsSwaggerMetadata,
  upsertCompanyAdditionalDocumentsSwaggerMetadata,
  getEmployeeECardDetailsSwaggerMetadata,
  getEmployeeECardSignedUrlSwaggerMetadata,
  processEnrollmentSwaggerMetadata,
  searchHospitalsSwaggerMetadata,
  exportHospitalsSwaggerMetadata,
  getPolicyLocationsSwaggerMetadata,
  createUserActivityLogSwaggerMetadata,
  getEnrollmentProgressSwaggerMetadata,
  updateEnrollmentProgressSwaggerMetadata,
  initializeEnrollmentProgressSwaggerMetadata,
  extendEnrollmentPeriodSwaggerMetadata,
	  getNotificationInfoByIdSwaggerMetadata,
	  createPolicyHospitalSwaggerMetadata,
	} from "./company-employee.swagger";
import { CompanyEmployeeService } from "./company-employee.service";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { EmployeeDetailsDto } from "./dto/get-company-employee-details.dto";
import { UpdateCompanyEmployeePassword } from "../../../../service-lib/src/lib/dto/company-employee-password-update.dto";
import { CreateSimpleAuthDto } from "../../../../service-lib/src/lib/dto/create-simple-auth.dto";
import { UserTrace } from "../../../../service-lib/src/lib/audit-history/decorators/user-trace.decorator";
import { UpsertEnrollmentDependentDto } from "./dto/upsert-enrollment-dependent.dto";
import {
  saveEnrollmentSwaggerMetadata,
  updateEnrollmentSwaggerMetadata,
  batchEnrollmentSwaggerMetadata,
} from "./company-employee.swagger";
import { UpdateEmployeeDetails } from "./dto/update-employee-details.dto";
import { ProcessEnrollmentDto } from "./dto/process-enrollment.dto";
import { ProcessEmployeeUploadDto } from "./dto/process-employee-upload.dto";
import { GetEmployeeFaqsDto } from "./dto/get-employee-faqs.dto";
	import { SearchHospitalDto } from "./dto/search-hospital.dto";
import { SearchHospitalsByPoliciesDto } from "./dto/search-hospitals-by-policies.dto";
	import { IntimateClaimDto, IntimateClaimResponseDto, SubmitClaimDto } from "./dto/claims.dto";
	import {
	  CreatePolicyHospitalDto,
	  CreatePolicyHospitalResponseDto,
	} from "./dto/create-policy-hospital.dto";
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from "../../../../../../libs/service-lib/src/lib/constants";
import { CompanyEmployeeFileUploadDto } from "./dto/company-employee-file-upload.dto";
import { ProcessEnrollmentPayloadDto } from "./dto/process-enrollment-payload.dto";
import { AuthProtected } from "../../../../service-lib/src/lib/auth-protection";
import { CreateUserActivityLogDto } from "./dto/create-user-activity-log.dto";
import { UpsertProfileDependentsDto } from "./dto/upsert-profile-dependents.dto";
import { LoginPasswordReadinessDto } from "./dto/login-password-readiness.dto";
import { AutoSubmitAfterCutoffDto } from "./dto/auto-submit-after-cutoff.dto";
import { GetPolicyFeatureDocumentsQueryDto } from "./dto/get-policy-feature-documents-query.dto";
import { BulkDownloadEmployeeFilesDto } from "./dto/bulk-download-employee-files.dto";
import { GetEmployeeECardSignedUrlDto } from "./dto/get-employee-ecard-signed-url.dto";
import { GetPolicyLocationsByPoliciesDto } from "./dto/get-policy-locations-by-policies.dto";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { GetTicketsQueryDto } from "./dto/get-tickets.dto";
import { UpdateTicketStatusDto } from "./dto/update-ticket-status.dto";
import { CompanyAdditionalDocumentDto } from "./dto/company-additional-documents.dto";
import {
  UpsertEmployeePersonalDocumentsDto,
} from "./dto/employee-personal-documents.dto";

@ApiTags("Ibp")
@Controller("company-employee")
export class CompanyEmployeeController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private companyEmployeeService: CompanyEmployeeService,
    private readonly traceIdService: TraceIdService,
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.IBP_SERVICE);
  }
  // Login endpoint
  @Post("login")
  @AuthProtected()
  @UserTrace("LOGIN")
  @loginSwaggerMetadata()
  async login(
    @Body() loginDto: CreateSimpleAuthDto,
    @Res() res: Response,
  ): Promise<any> {
    const userId = 1; // default user context for login
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "login",
        payload: loginDto,
        messageData: "method invoked",
      }),
    });
    try {
      const user = await this.companyEmployeeService.validateUser(
        loginDto.userName,
        loginDto.password,
        loginDto.domain,
        loginDto.loginMethod,
      );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "login",
          payload: loginDto,
          messageData: successMessage.userLoggedIn,
        }),
      });
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: successMessage.userLoggedIn,
        data: user,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "login",
          messageData: error,
        }),
      });
      if (error instanceof ForbiddenException) {
        return res.status(HttpStatus.FORBIDDEN).json({
          statusCode: HttpStatus.FORBIDDEN,
          message: error.message,
        });
      } else if (error instanceof NotFoundException) {
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

  @Post("login/password-readiness")
  @AuthProtected()
  async checkLoginPasswordReadiness(
    @Body() payload: LoginPasswordReadinessDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      const data = await this.companyEmployeeService.checkPasswordReadiness(
        payload.userName,
        payload.domain,
        payload.loginMethod,
      );

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "Password readiness checked successfully",
        data,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "checkLoginPasswordReadiness",
          messageData: error,
        }),
      });

      if (error instanceof ForbiddenException) {
        return res.status(HttpStatus.FORBIDDEN).json({
          statusCode: HttpStatus.FORBIDDEN,
          message: error.message,
        });
      } else if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: (error as Error)?.message || "Failed to check password readiness",
      });
    }
  }

  @Post("refresh-token")
  async refreshToken(
    @Body("refreshToken") refreshToken: string,
    @Res() res: Response,
  ): Promise<any> {
    try {
      const tokens =
        await this.companyEmployeeService.validateRefreshTokenAndRotateTokens(
          refreshToken
        );
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: successMessage.tokenRefreshed,
        data: tokens,
      });
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return res.status(HttpStatus.FORBIDDEN).json({
          statusCode: HttpStatus.FORBIDDEN,
          message: error.message,
        });
      }
      if (error instanceof UnauthorizedException) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
          statusCode: HttpStatus.UNAUTHORIZED,
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

  @Post("crm-session")
  async exchangeCrmSession(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    const rawToken = String(req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
    let jwtPayload: any = null;
    try {
      jwtPayload = JSON.parse(Buffer.from(rawToken.split(".")[1], "base64url").toString());
    } catch { /* ignore */ }

    if (jwtPayload?.roleKey !== "PORTAL_CRM") {
      return res.status(HttpStatus.FORBIDDEN).json({ message: "Not a CRM session" });
    }

    const userId = jwtPayload?.userDetails?.userId ?? jwtPayload?.userId;
    const companyId = jwtPayload?.companyId ?? null;
    const emailId = jwtPayload?.userDetails?.emailId ?? null;

    try {
      const tokens = await this.companyEmployeeService.generateCrmRefreshableTokens(
        Number(userId), Number(companyId) || null, emailId,
      );
      return res.status(HttpStatus.OK).json({ statusCode: HttpStatus.OK, data: tokens });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: error instanceof Error ? error.message : "Failed to generate CRM session",
      });
    }
  }

  @Get("company/:companyId/group-companies")
  async getGroupCompanies(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    try {
      const userId = parseInt(String(req?.headers?.userid ?? "0"), 10);
      const data = await this.companyEmployeeService.getGroupCompanies(companyId, userId || undefined);
      return res.status(200).json({ status: "success", data });
    } catch (error: any) {
      return res.status(500).json({ status: "failure", message: error?.message });
    }
  }

  @Get("company/:companyId/portal-configuration")
  @getCompanyPortalConfigurationSwaggerMetadata()
  async getCompanyPortalConfiguration(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(String(req?.headers?.userid ?? "0"), 10);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "getCompanyPortalConfiguration",
        messageData: "method invoked",
      }),
    });
    try {
      const portalConfig =
        await this.companyEmployeeService.getCompanyPortalConfiguration(
          companyId,
        );
      const isApproved = portalConfig?.isCompanyConfigurationApproved ?? false;
      const message = isApproved
        ? "Company portal configuration retrieved successfully"
        : portalConfig?.approvalMessage ??
          "Company portal configuration is not approved yet";
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message,
        data: portalConfig,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getCompanyPortalConfiguration",
          messageData: error,
        }),
      });
      const status =
        error instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        statusCode: status,
        message:
          error instanceof Error
            ? error.message
            : errorMessages.internalServerError,
      });
    }
  }

  @Get("company/:companyId/additional-documents")
  @getCompanyAdditionalDocumentsSwaggerMetadata()
  async getCompanyAdditionalDocuments(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(String(req?.headers?.userid ?? "0"), 10);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "getCompanyAdditionalDocuments",
        payload: { companyId },
        messageData: "method invoked",
      }),
    });

    try {
      const documents =
        await this.companyEmployeeService.getCompanyAdditionalDocuments(
          companyId,
        );
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "Company additional documents retrieved successfully",
        data: documents,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getCompanyAdditionalDocuments",
          payload: { companyId },
          messageData: error,
        }),
      });
      const status =
        error instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        statusCode: status,
        message:
          error instanceof Error
            ? error.message
            : errorMessages.internalServerError,
      });
    }
  }

  @Post("company/:companyId/additional-documents")
  @upsertCompanyAdditionalDocumentsSwaggerMetadata()
  async upsertCompanyAdditionalDocuments(
    @Param("companyId", ParseIntPipe) companyId: number,
    @Body() documents: CompanyAdditionalDocumentDto[],
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(String(req?.headers?.userid ?? "0"), 10);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "upsertCompanyAdditionalDocuments",
        payload: { companyId, documents },
        messageData: "method invoked",
      }),
    });

    try {
      const savedDocuments =
        await this.companyEmployeeService.upsertCompanyAdditionalDocuments(
          companyId,
          documents,
          userId,
        );
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "Company additional documents saved successfully",
        data: savedDocuments,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "upsertCompanyAdditionalDocuments",
          payload: { companyId, documents },
          messageData: error,
        }),
      });
      const status =
        error instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        statusCode: status,
        message:
          error instanceof Error
            ? error.message
            : errorMessages.internalServerError,
      });
    }
  }
  // -- Logic for getting all the employees
  // User details endpoint
  @Get("company-employee-details")
  @getEmployeeDetailsSwaggerMetadata()
  async getEmployeeDetails(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getEmployeeDetails",
          messageData: "method invoked",
        }),
      });
      const rawToken = String(req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
      let jwtPayload: any = null;
      if (rawToken) {
        try { jwtPayload = JSON.parse(Buffer.from(rawToken.split(".")[1], "base64url").toString()); } catch { /* ignore */ }
      }
      if (jwtPayload?.roleKey === "PORTAL_CRM") {
        const ud = jwtPayload.userDetails ?? {};
        const emailId: string | null = ud.emailId ?? null;
        const crmCompanyId: number | null = jwtPayload.companyId ? Number(jwtPayload.companyId) : null;

        // Check if the CRM user is also enrolled as an IBP employee in this domain company.
        const pee = (emailId && crmCompanyId)
          ? await this.companyEmployeeService.findEnrolledEmployeeByEmailAndCompany(emailId, crmCompanyId)
          : null;

        // ud.userId is the real CRM user ID — needed for portfolio crmUserId queries.
        // pee?.id is the enrollment record ID — needed for IBP employee profile.
        // When enrolled, merge full employee profile so IBP profile page shows complete data.
        const crmBase = {
          isEmployee: Boolean(pee),
          isHR: false,
          userId: ud.userId ?? userId,
          id: pee?.id ?? ud.userId ?? userId,
          companyId: String(crmCompanyId ?? ""),
          companyName: jwtPayload.companyName ?? null,
          email: emailId,
          roleKey: "PORTAL_CRM",
        };
        if (pee) {
          try {
            const fullProfile = await this.companyEmployeeService.getEmployeeDetailsByUserId(pee.id);
            return res.status(HttpStatus.OK).json({
              statusCode: HttpStatus.OK,
              message: successMessage.CompanyEmployeeDetailsRetrievedSuccessfully,
              data: { ...fullProfile, ...crmBase },
            });
          } catch { /* fall through to minimal response below */ }
        }
        return res.status(HttpStatus.OK).json({
          statusCode: HttpStatus.OK,
          message: successMessage.CompanyEmployeeDetailsRetrievedSuccessfully,
          data: crmBase,
        });
      }
      const userDetails =
        await this.companyEmployeeService.getEmployeeDetailsByUserId(userId);
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: successMessage.CompanyEmployeeDetailsRetrievedSuccessfully,
        data: userDetails,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getEmployeeDetails",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message),
        );
    }
  }

  // Mirrors org-service's GET /localization, but resolves via the employee's
  // company/country instead of a users/organisation row — org-service has no
  // path to an ibp employee's company at all, so this can't live there.
  @Get("localization")
  async getEmployeeLocalization(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getEmployeeLocalization",
          messageData: "method invoked",
        }),
      });
      const localizationData =
        await this.companyEmployeeService.getEmployeeLocalization(userId);
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Localization retrieved successfully",
            localizationData,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getEmployeeLocalization",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.NOT_FOUND)
        .json(
          createErrorResponse(
            HttpStatus.NOT_FOUND,
            error instanceof Error ? error.message : "Localization not found",
          ),
        );
    }
  }

  @Get("employee/:employeeId/contact-matrix")
  @getEmployeeContactMatrixSwaggerMetadata()
  async getEmployeeContactMatrix(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    const userId = parseInt(req?.headers?.userid ?? "0");
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "getEmployeeContactMatrix",
        payload: { employeeId },
        messageData: "method invoked",
      }),
    });
    try {
      const matrix = await this.companyEmployeeService.getEmployeeContactMatrix(
        employeeId,
        userId,
      );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getEmployeeContactMatrix",
          payload: {
            employeeId,
            policyCount: matrix.policies.length,
          },
          messageData: "Employee contact matrix retrieved",
        }),
      });
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Employee policy contact matrix retrieved successfully",
            matrix,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getEmployeeContactMatrix",
          payload: { employeeId },
          messageData:
            error instanceof Error
              ? error.message
              : "Failed to retrieve contact matrix",
        }),
      });
      return handleErrorResponse(
        error instanceof HttpException
          ? error
          : new BadRequestException(
              (error as Error).message ||
                "Failed to retrieve policy contact matrix",
            ),
        res,
        (error as Error).message,
        (error as Error).message,
      );
    }
  }

  @Get("employee/:employeeId/e-card")
  @getEmployeeECardDetailsSwaggerMetadata()
  async getEmployeeECardDetails(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getEmployeeECardDetails",
          payload: { employeeId },
          messageData: "method invoked",
        }),
      });
      const data = await this.companyEmployeeService.getEmployeeECardDetails(
        employeeId,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Employee e-card details retrieved successfully",
            data,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getEmployeeECardDetails",
          payload: { employeeId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.employeeNotFound,
        errorMessages.employeeNotFound,
        errorMessages.failedToFetchEmployeeDetails,
      );
    }
  }

  @Get("policy/:policyId/tpa-app-key")
  async getPolicyTpaAppKey(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("apiType") apiType: string,
    @Query("isDependent") isDependent: string,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const result = await this.companyEmployeeService.getPolicyTpaAppKey(
        policyId,
        apiType || "ECARD",
        isDependent === "true",
      );
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, "TPA app key retrieved successfully", result),
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getPolicyTpaAppKey",
          payload: { policyId, apiType },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(
          HttpStatus.INTERNAL_SERVER_ERROR,
          error instanceof Error ? error.message : "Failed to retrieve TPA app key",
        ),
      );
    }
  }

  @Post("employee/e-card/signed-url")
  @getEmployeeECardSignedUrlSwaggerMetadata()
  async getEmployeeECardSignedUrl(
    @Body() payload: GetEmployeeECardSignedUrlDto,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getEmployeeECardSignedUrl",
          payload,
          messageData: "method invoked",
        }),
      });

      const data = await this.companyEmployeeService.getEmployeeECardSignedUrl(
        payload.companyId,
        payload.companyEmployeeId,
      );

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Signed URL generated", data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getEmployeeECardSignedUrl",
          payload,
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        "Failed to generate signed URL",
        "Failed to generate signed URL",
        "Failed to generate signed URL",
      );
    }
  }

  //set the company employee login password
  @Post("company-employee-password-update")
  @updateCompanyEmployeePasswordSwaggerMetadata()
  async updateCompanyEmployeePassword(
    @Body() companyEmployeeDetails: UpdateCompanyEmployeePassword,
    @Res() res: Response,
  ): Promise<any> {
    const userId = 1; // default user context for login
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "updateCompanyEmployeePassword",
        payload: companyEmployeeDetails,
        messageData: "method invoked",
      }),
    });
    try {
      const employeeDetails =
        await this.companyEmployeeService.validateCompanyEmployee(
          companyEmployeeDetails,
        );
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "updateCompanyEmployeePassword",
          payload: companyEmployeeDetails,
          messageData:
            successMessage.companyEmployeePasswordUpdatedSucccessfully,
        }),
      });
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: successMessage.companyEmployeePasswordUpdatedSucccessfully,
        data: employeeDetails,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "updateCompanyEmployeePassword",
          messageData: error,
        }),
      });
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          error instanceof Error
            ? error.message
            : errorMessages.internalServerError,
      });
    }
  }

  @Put("update-user-password")
  async updateUserPassword(
    @Body()
    body: {
      currentPassword: string;
      newPassword: string;
      reNewPassword: string;
    },
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    // Extract user from JWT (assume req.user is set by AuthGuard)
    const userId: any = req.headers?.userid;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "updateUserPassword",
        payload: { userId },
        messageData: "method invoked",
      }),
    });
    try {
      // Validate new passwords match
      if (body.newPassword !== body.reNewPassword) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: "New password and confirm password do not match",
        });
      }
      // Call service to update password (must hash inside service)
      await this.companyEmployeeService.updateUserPassword({
        userId,
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
      });
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "updateUserPassword",
          messageData: "Password updated successfully",
        }),
      });
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "Password updated successfully",
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "updateUserPassword",
          messageData: error,
        }),
      });
      return res.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message:
          error instanceof Error
            ? error.message
            : errorMessages.internalServerError,
      });
    }
  }

  @Get("employee/:employeeId/personal-documents")
  @getEmployeePersonalDocumentsSwaggerMetadata()
  async getEmployeePersonalDocuments(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(String(req?.headers?.userid ?? "0"), 10);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "getEmployeePersonalDocuments",
        payload: { employeeId },
        messageData: "method invoked",
      }),
    });

    try {
      const documents =
        await this.companyEmployeeService.getEmployeePersonalDocuments(
          employeeId,
        );
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "Employee personal documents retrieved successfully",
        data: documents,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getEmployeePersonalDocuments",
          payload: { employeeId },
          messageData: error,
        }),
      });
      const status =
        error instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        statusCode: status,
        message:
          error instanceof Error
            ? error.message
            : errorMessages.internalServerError,
      });
    }
  }

  @Post("employee/:employeeId/personal-documents")
  @upsertEmployeePersonalDocumentsSwaggerMetadata()
  async upsertEmployeePersonalDocuments(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Body() body: UpsertEmployeePersonalDocumentsDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(String(req?.headers?.userid ?? "0"), 10);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "upsertEmployeePersonalDocuments",
        payload: { employeeId, documentIds: body?.documentIds },
        messageData: "method invoked",
      }),
    });

    try {
      const documents =
        await this.companyEmployeeService.upsertEmployeePersonalDocuments(
          employeeId,
          body?.documentIds ?? [],
          userId,
        );
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "Employee personal documents saved successfully",
        data: documents,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "upsertEmployeePersonalDocuments",
          payload: { employeeId, documentIds: body?.documentIds },
          messageData: error,
        }),
      });
      const status =
        error instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
      return res.status(status).json({
        statusCode: status,
        message:
          error instanceof Error
            ? error.message
            : errorMessages.internalServerError,
      });
    }
  }

  @Post("file-upload/upload")
  @uploadEmployeeFileSwaggerMetadata()
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CompanyEmployeeFileUploadDto,
    @Req() req: Request,
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "uploadFile",
        payload: body,
        messageData: "method invoked",
      }),
    });
    try {
      return await this.companyEmployeeService.uploadEmployeeFile(
        file,
        body,
        userId,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "uploadFile",
          payload: body,
          messageData: error,
        }),
      });
      const message =
        error instanceof Error
          ? error.message
          : errorMessages.internalServerError;
      return createErrorResponse(HttpStatus.BAD_REQUEST, message);
    }
  }

  @Get("file-upload/:documentId/download")
  @downloadEmployeeFileSwaggerMetadata()
  async downloadFile(
    @Param("documentId") documentId: bigint,
    @Res() res: Response,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "downloadFile",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    try {
      const result = await this.companyEmployeeService.downloadEmployeeFile(
        documentId,
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`,
      );
      res.setHeader(
        "Content-Type",
        result.mimeType || "application/octet-stream",
      );
      if (result.contentLength) {
        res.setHeader("Content-Length", result.contentLength);
      }
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

      result.stream.pipe(res);
    } catch (error) {
      this.logger.error({
        level: "error",
      message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "downloadFile",
          payload: { documentId },
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException("Failed to download document");
    }
  }

  @Post("file-upload/bulk-download")
  @bulkDownloadEmployeeFilesSwaggerMetadata()
  async bulkDownloadFiles(
    @Body() body: BulkDownloadEmployeeFilesDto,
    @Res() res: Response,
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "bulkDownloadFiles",
        payload: { documentIds: body?.documentIds, zipFileName: body?.zipFileName },
        messageData: "method invoked",
      }),
    });
    try {
      await this.companyEmployeeService.bulkDownloadEmployeeFilesAsZip(body, res);
      if (res.headersSent) {
        return;
      }
      throw new BadRequestException("Failed to download documents as ZIP");
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "bulkDownloadFiles",
          payload: { documentIds: body?.documentIds, zipFileName: body?.zipFileName },
          messageData: error,
        }),
      });
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new BadRequestException("Failed to download documents as ZIP");
    }
  }

  // User details endpoint - update
  @Put("company-employee-details/:employeeId")
  @updateEmployeeDetailsSwaggerMetadata()
  async updateEmployeeDetails(
    @Req() req: Request,
    @Res() res: Response,
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Body() employeeDetails: UpdateEmployeeDetails,
  ): Promise<any> {
    const userId = parseInt(req?.headers?.userid);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "updateEmployeeDetails",
          payload: { employeeId },
          messageData: "method invoked",
        }),
      });
      const userDetails =
        await this.companyEmployeeService.UpdateEmployeeDetailsByEmployeeId(
          userId,
          employeeId,
          employeeDetails,
        );
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: successMessage.CompanyEmployeeDetailsUpdatedSuccessfully,
        data: userDetails,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "updateEmployeeDetails",
          payload: { employeeId },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message),
        );
    }
  }

  @Post("company-employee-policy-components")
  @getEmployeePolicyComponentDetailsSwaggerMetadata()
  async getEmployeePolicyComponentDetails(
    @Body("employeeId", ParseIntPipe) employeeId: number,
    @Body("policyId", ParseIntPipe) policyId: number,
    @Body("dependents") dependents: UpsertEnrollmentDependentDto[],
    @Body("isModified") isModified: boolean = false,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getEmployeePolicyComponentDetails",
          payload: { employeeId, policyId },
          messageData: "method invoked",
        }),
      });
      const userDetails =
        await this.companyEmployeeService.getEmployeeRelatedComponentsBasedOnPolicy(
          employeeId,
          policyId,
          dependents,
          isModified,
        );
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message:
          successMessage.CompanyEmployeePolicyChoicesRetrievedSuccessfully,
        data: userDetails,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getEmployeePolicyComponentDetails",
          payload: { employeeId, policyId },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message),
        );
    }
  }

  @Get("policy/:policyId/employee/:employeeId/relations-constraints-dependents")
  @getRelationsConstraintsAndDependentsSwaggerMetadata()
  async getRelationsConstraintsAndDependents(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getRelationsConstraintsAndDependents",
          payload: { policyId, employeeId },
          messageData: "method invoked",
        }),
      });
      const data =
        await this.companyEmployeeService.getRelationsConstraintsAndDependents(
          policyId,
          employeeId,
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.policyRelationsAndDependentsRetrieved,
            data,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getRelationsConstraintsAndDependents",
          payload: { policyId, employeeId },
          messageData: error,
        }),
      });
      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;
      return res
        .status(status)
        .json(
          createErrorResponse(
            status,
            error instanceof Error ? error.message : errorMessages.unknownError,
          ),
        );
    }
  }

  // New API for combined relationship constraints and dependents info for mapped policies:
  @Get("/employee/:employeeId/relations-constraints-dependents")
  @getRelationsConstraintsAndDependentsSwaggerMetadata()
  async getAllRelationsConstraintsAndDependents(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    // Same domain/config scoping as listEmployeePolicies (employees/:employeeId/policies)
    // — this endpoint was computing relations/constraints/dependents off EVERY policy the
    // employee has, regardless of which domain/portal config the request came through.
    // A domain configured to only expose a subset of policies (company_portal_config_scope)
    // should get the same subset here too, not the employee's full policy list.
    const rawToken = String(req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
    let configId: number | null = null;
    try {
      const jwtPayload = JSON.parse(Buffer.from(rawToken.split(".")[1], "base64url").toString());
      configId = jwtPayload?.configId ?? null;
    } catch { /* ignore */ }

    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getAllRelationsConstraintsAndDependents",
          payload: { employeeId, configId },
          messageData: "method invoked",
        }),
      });
      const data =
        await this.companyEmployeeService.getAllRelationsConstraintsAndDependents(
          employeeId,
          configId,
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.policyRelationsAndDependentsRetrieved,
            data,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getAllRelationsConstraintsAndDependents",
          payload: { employeeId },
          messageData: error,
        }),
      });
      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;
      return res
        .status(status)
        .json(
          createErrorResponse(
            status,
            error instanceof Error ? error.message : errorMessages.unknownError,
          ),
        );
    }
  }

  @Post("policy/enrollment")
  @saveEnrollmentSwaggerMetadata()
  async saveEnrollmentData(
    @Body() payload: UpsertEnrollmentDataDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req.headers?.userid as string);
    try {
      const data = await this.companyEmployeeService.processEnrollmentData(
        payload,
        userId,
        false,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Saved", data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "saveEnrollmentData",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message),
        );
    }
  }

  @Put("policy/enrollment")
  @updateEnrollmentSwaggerMetadata()
  async updateEnrollmentData(
    @Body() payload: UpsertEnrollmentDataDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req.headers?.userid as string);
    try {
      const data = await this.companyEmployeeService.processEnrollmentData(
        payload,
        userId,
        true,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Saved", data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "updateEnrollmentData",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message),
        );
    }
  }

  @Put("policy/combined-enrollment")
  @updateEnrollmentSwaggerMetadata()
  async updateCombinedEnrollmentData(
    @Body() payload: UpsertCombinedEnrollmentDataDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req.headers?.userid as string);
    try {
      const data =
        await this.companyEmployeeService.processCombinedEnrollmentData(
          payload,
          userId,
          true,
        );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Saved", data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "updateCombinedEnrollmentData",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message),
        );
    }
  }

  @Put("profile/dependents")
  async upsertProfileDependents(
    @Body() payload: UpsertProfileDependentsDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req.headers?.userid as string);
    try {
      const data = await this.companyEmployeeService.upsertProfileDependents(
        payload,
        userId,
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Dependents saved successfully", data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "upsertProfileDependents",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message),
        );
    }
  }

  @Post("enrollment/reset")
  async resetEnrollment(
    @Body() body: { clearChoices?: boolean; clearDependents?: boolean; resetPassword?: boolean; clearClaims?: boolean; clearActivityLogs?: boolean; clearMails?: boolean; clearTickets?: boolean },
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req.headers?.userid as string);
    try {
      await this.companyEmployeeService.resetEnrollment(userId, {
        clearChoices: body.clearChoices ?? false,
        clearDependents: body.clearDependents ?? false,
        resetPassword: body.resetPassword ?? false,
        clearClaims: body.clearClaims ?? false,
        clearActivityLogs: body.clearActivityLogs ?? false,
        clearMails: body.clearMails ?? false,
        clearTickets: body.clearTickets ?? false,
      });
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Enrollment reset successfully", { resetPassword: body.resetPassword ?? false }));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "resetEnrollment",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message));
    }
  }

  @Post("policy/auto-submit-after-cutoff")
  async autoSubmitAfterCutoff(
    @Body() payload: AutoSubmitAfterCutoffDto,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "autoSubmitAfterCutoff",
          payload,
          messageData: "method invoked",
        }),
      });
      const data =
        await this.companyEmployeeService.autoSubmitEnrollmentsAfterCutoff(
          payload.triggerDate,
        );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Auto-submit processed", data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "autoSubmitAfterCutoff",
          payload,
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : errorMessages.unknownError,
          ),
        );
    }
  }

  @Post("policy/employee-upload/process")
  @processEmployeeUploadSwaggerMetadata()
  async processEmployeeUpload(
    @Body() payload: ProcessEmployeeUploadDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req.headers?.userid as string);
    const { documentId } = payload;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "processEmployeeUpload",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });

    try {
      await this.companyEmployeeService.processEmployeeUploadFile(documentId);
      return res
        .status(HttpStatus.ACCEPTED)
        .json(createResponse(HttpStatus.ACCEPTED, "File processing started"));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "processEmployeeUpload",
          messageData: error,
          payload: { documentId },
        }),
      });
      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;
      return res
        .status(status)
        .json(
          createErrorResponse(
            status,
            error instanceof Error ? error.message : errorMessages.unknownError,
          ),
        );
    }
  }

  @Put("policy/process-enrollment")
  @processEnrollmentSwaggerMetadata()
  async startEnrollmentProcess(
    @Body() payload: ProcessEnrollmentDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req.headers?.userid as string);
    const { enrollmentFileId, policyId, endorsementId } = payload;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "startEnrollmentProcess",
        payload: { enrollmentFileId, policyId, endorsementId },
        messageData: "method invoked",
      }),
    });
    try {
      const inProgressEnrollmentsCountFound =
        await this.companyEmployeeService.checkInProgressEnrollments(policyId);
      if (inProgressEnrollmentsCountFound) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "failure",
            location: "CompanyEmployeeController",
            method: "startEnrollmentProcess",
            messageData: "In-progress enrollments found",
          }),
        });
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createResponse(
              HttpStatus.BAD_REQUEST,
              "In-progress enrollments found",
            ),
          );
      }
      this.companyEmployeeService
        .startEnrollmentProcess(enrollmentFileId, policyId, endorsementId)
        .catch((error) => {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "failure",
              location: "CompanyEmployeeController",
              method: "startEnrollmentProcess",
              messageData: error,
            }),
          });
        });
      return res
        .status(HttpStatus.ACCEPTED)
        .json(createResponse(HttpStatus.ACCEPTED, "Batch processing started"));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "startEnrollmentProcess",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message),
        );
    }
  }

  @Put("policy/enrollment/batch")
  @batchEnrollmentSwaggerMetadata()
  async updateEnrollmentBatch(
    @Body() payload: EnrollmentBatchKeyDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req.headers?.userid as string);
    const { enrollmentBatchKey, endorsementId } = payload;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "updateEnrollmentBatch",
        payload: { enrollmentBatchKey },
        messageData: "method invoked",
      }),
    });
    try {
      this.companyEmployeeService
        .processEnrollmentBatch(enrollmentBatchKey, userId, endorsementId)
        .catch((error) => {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "failure",
              location: "CompanyEmployeeController",
              method: "updateEnrollmentBatch",
              messageData: error,
            }),
          });
        });
      return res
        .status(HttpStatus.ACCEPTED)
        .json(createResponse(HttpStatus.ACCEPTED, "Batch processing started"));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "updateEnrollmentBatch",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message),
        );
    }
  }

  @Put("policy/enrollment/payload")
  async processEnrollmentPayload(
    @Body() payload: ProcessEnrollmentPayloadDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req.headers?.userid as string);
    const { payloadId, payloadMapId, endorsementId } = payload;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "processEnrollmentPayload",
        payload: { payloadId, payloadMapId },
        messageData: "method invoked",
      }),
    });
    try {
      this.companyEmployeeService
        .processEnrollmentPayload(
          payloadId,
          payloadMapId,
          userId,
          endorsementId,
        )
        .catch((error) => {
          this.logger.error({
            level: "error",
            message: buildLogMessage({
              traceId: this.traceIdService.traceId,
              userId,
              status: "failure",
              location: "CompanyEmployeeController",
              method: "processEnrollmentPayload",
              messageData: error,
            }),
          });
        });
      return res
        .status(HttpStatus.ACCEPTED)
        .json(
          createResponse(HttpStatus.ACCEPTED, "Payload processing started"),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "processEnrollmentPayload",
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message),
        );
    }
  }

  @Get("employees/:employeeId/policies")
  @listEmployeePoliciesSwaggerMetadata()
  async listEmployeePolicies(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const rawToken = String(req.headers["authorization"] || "").replace(/^Bearer\s+/i, "");
    let configId: number | null = null;
    try {
      const jwtPayload = JSON.parse(Buffer.from(rawToken.split(".")[1], "base64url").toString());
      configId = jwtPayload?.configId ?? null;
    } catch { /* ignore */ }

    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "listEmployeePolicies",
          payload: { employeeId },
          messageData: "method invoked",
        }),
      });
      const data = await this.companyEmployeeService.getEmployeePolicies(
        employeeId,
        configId,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(HttpStatus.OK, successMessage.policiesRetrieved, data),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "listEmployeePolicies",
          payload: { employeeId },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(HttpStatus.BAD_REQUEST, (error as Error).message),
        );
    }
  }

  @Get("employee/:employeeId/policy/claims-overview")
  @getEmployeePolicyOverviewSwaggerMetadata()
  async getEmployeePolicyOverview(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "getEmployeePolicyOverview",
        payload: { employeeId },
        messageData: "method invoked",
      }),
    });
    try {
      const data = await this.companyEmployeeService.getEmployeePolicyOverview(
        employeeId,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.employeeClaimRetrieved,
            data,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getEmployeePolicyOverview",
          payload: { employeeId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.employeeClaimFetchFailed,
        errorMessages.employeeClaimFetchFailed,
        errorMessages.employeeClaimFetchFailed,
      );
    }
  }

  @Get("policy/:policyId/employee/:employeeId/enrollment-summary")
  @getEnrollmentSummarySwaggerMetadata()
  async getEnrollmentSummary(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getEnrollmentSummary",
          payload: { policyId, employeeId },
          messageData: "method invoked",
        }),
      });
      const data = await this.companyEmployeeService.getEnrollmentSummary(
        policyId,
        employeeId,
      );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            successMessage.enrollmentSummaryRetrieved,
            data,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getEnrollmentSummary",
          payload: { policyId, employeeId },
          messageData: error,
        }),
      });
      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.BAD_REQUEST;
      return res
        .status(status)
        .json(
          createErrorResponse(
            status,
            error instanceof Error ? error.message : errorMessages.unknownError,
          ),
        );
    }
  }

  @Get("policy/:policyId/employee-insured")
  @getPolicyEmployeeInsuredDetailsSwaggerMetadata()
  async getPolicyEmployeeInsuredDetails(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
    @Query("relationshipGroup") relationshipGroup?: string,
    @Query("claimStatus") claimStatus?: string,
    @Query("effectiveFrom") effectiveFrom?: string,
    @Query("effectiveTo") effectiveTo?: string,
    @Query("searchBy") searchBy?: string,
    @Query("search") search?: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid as string);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getPolicyEmployeeInsuredDetails",
          payload: { policyId },
          messageData: "method invoked",
        }),
      });
      const data =
        await this.companyEmployeeService.getPolicyEmployeeInsuredDetails(
          policyId,
          page ? Number(page) : undefined,
          limit ? Number(limit) : undefined,
          relationshipGroup,
          claimStatus,
          effectiveFrom,
          effectiveTo,
          searchBy,
          search,
        );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Employee insured details retrieved successfully",
            data,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getPolicyEmployeeInsuredDetails",
          payload: { policyId },
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.failedToFetchEmployeeDetails,
        errorMessages.failedToFetchEmployeeDetails,
        errorMessages.failedToFetchEmployeeDetails,
      );
    }
  }

  @Get("faq")
  @getEmployeeFaqsSwaggerMetadata()
  async getEmployeeFaqs(
    @Query() query: GetEmployeeFaqsDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid as string);
    
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "getEmployeeFaqs",
        payload: {
          employeeId: query.employeeId,
          category: query.category || "ALL",
          search: query.search || "NONE",
          page: query.page || DEFAULT_PAGE,
          limit: query.limit || DEFAULT_LIMIT,
        },
        messageData: "Employee FAQ retrieval request received",
      }),
    });

    try {
      // Validate and convert employeeId
      const employeeIdNum = parseInt(query.employeeId);
      if (isNaN(employeeIdNum) || employeeIdNum < DEFAULT_PAGE) {
        throw new BadRequestException(
          "Employee ID must be a valid positive number",
        );
      }

      const result = await this.companyEmployeeService.getEmployeeFaqs(
        employeeIdNum,
        query.category,
        query.search,
        query.page,
        query.limit,
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getEmployeeFaqs",
          payload: {
            employeeId: employeeIdNum,
            resultCount: result.faqs.length,
            totalCount: result.total,
            categoriesCount: result.availableCategories.length,
            sourcePoliciesCount: result.sourcePolicyIds.length,
          },
          messageData: "Employee FAQs retrieved successfully",
        }),
      });

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "Employee FAQs retrieved successfully",
        data: result,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getEmployeeFaqs",
          payload: {
            employeeId: query.employeeId,
            category: query.category || "ALL",
            search: query.search || "NONE",
          },
          messageData: `Failed to retrieve employee FAQs: ${
            (error as Error).message
          }`,
        }),
      });

      const status =
        error instanceof BadRequestException
          ? HttpStatus.BAD_REQUEST
          : HttpStatus.INTERNAL_SERVER_ERROR;

      return res.status(status).json({
        statusCode: status,
        message:
          error instanceof Error
            ? error.message
            : "Failed to retrieve employee FAQs",
        error:
          error instanceof BadRequestException
            ? "Bad Request"
            : "Internal Server Error",
      });
    }
  }

	  @Post("policy/hospitals/search")
	  @searchHospitalsSwaggerMetadata()
	  async searchHospitals(
    @Body() payload: SearchHospitalsByPoliciesDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userIdHeader = (req.headers["userid"] ??
      req.headers["userId"] ??
      req.headers["user-id"]) as string | undefined;

    if (!userIdHeader) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createResponse(HttpStatus.BAD_REQUEST, "Missing userid header", null),
        );
    }

    const userId = parseInt(userIdHeader, 10);
    if (isNaN(userId)) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createResponse(
            HttpStatus.BAD_REQUEST,
            "Invalid userid header - must be a valid number",
            null,
          ),
        );
    }

    try {
      const { policyIds, ...searchParams } = payload;
      const result = await this.companyEmployeeService.searchHospitalsByPolicyIds(
        policyIds,
        searchParams,
        userId,
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Hospitals retrieved successfully",
            result,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "searchHospitals",
          payload: { policyIds: payload.policyIds, searchParams: payload },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });

      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to search hospitals",
            null,
          ),
        );
    }
	  }

	  @Post("policy/:policyId/hospitals")
	  @createPolicyHospitalSwaggerMetadata()
	  async createPolicyHospital(
	    @Param("policyId", ParseIntPipe) policyId: number,
	    @Body() payload: CreatePolicyHospitalDto,
	    @Req() req: Request,
	    @Res() res: Response,
	  ): Promise<Response> {
	    const userIdHeader = (req.headers["userid"] ??
	      req.headers["userId"] ??
	      req.headers["user-id"]) as string | undefined;
	
	    if (!userIdHeader) {
	      return res
	        .status(HttpStatus.BAD_REQUEST)
	        .json(createResponse(HttpStatus.BAD_REQUEST, "Missing userid header", null));
	    }
	
	    const userId = parseInt(userIdHeader, 10);
	    if (isNaN(userId)) {
	      return res
	        .status(HttpStatus.BAD_REQUEST)
	        .json(
	          createResponse(
	            HttpStatus.BAD_REQUEST,
	            "Invalid userid header - must be a valid number",
	            null,
	          ),
	        );
	    }
	
	    try {
	      const result: CreatePolicyHospitalResponseDto =
	        await this.companyEmployeeService.createPolicyHospital(
	          policyId,
	          payload,
	          userId,
	        );
	
	      return res
	        .status(HttpStatus.CREATED)
	        .json(createResponse(HttpStatus.CREATED, "Hospital added successfully", result));
	    } catch (error) {
	      this.logger.error({
	        level: "error",
	        message: buildLogMessage({
	          traceId: this.traceIdService.traceId,
	          status: "failure",
	          location: "CompanyEmployeeController",
	          method: "createPolicyHospital",
	          payload: { policyId, payload },
	          messageData: error instanceof Error ? error.message : String(error),
	        }),
	      });
	
	      return res
	        .status(HttpStatus.BAD_REQUEST)
	        .json(
	          createResponse(
	            HttpStatus.BAD_REQUEST,
	            error instanceof Error ? error.message : "Failed to add hospital",
	            null,
	          ),
	        );
	    }
	  }

	  @Get("policies/:policyId/hospitals/export")
	  @exportHospitalsSwaggerMetadata()
	  async exportHospitalsToExcel(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query() searchParams: SearchHospitalDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userIdHeader = (req.headers["userid"] ??
      req.headers["userId"] ??
      req.headers["user-id"]) as string | undefined;

    if (!userIdHeader) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createResponse(HttpStatus.BAD_REQUEST, "Missing userid header", null),
        );
    }

    const userId = parseInt(userIdHeader, 10);
    if (isNaN(userId)) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createResponse(
            HttpStatus.BAD_REQUEST,
            "Invalid userid header - must be a valid number",
            null,
          ),
        );
    }

    try {
      const result = await this.companyEmployeeService.exportHospitalsToExcel(
        policyId,
        searchParams,
        userId,
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`,
      );
      res.setHeader(
        "Content-Type",
        result.mimeType || "application/octet-stream",
      );
      if (result.contentLength) {
        res.setHeader("Content-Length", result.contentLength);
      }
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

      result.stream.pipe(res);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "createResponse",
          messageData: error,
        }),
      });
      const userIdFromHeader = req.headers["userid"] as string | undefined;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId: userIdFromHeader ? parseInt(userIdFromHeader, 10) : undefined,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "exportHospitalsToExcel",
          payload: { policyId, searchParams },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });

      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to export hospitals data",
            null,
          ),
        );
    }
  }

  @Post("policy/locations")
  @getPolicyLocationsSwaggerMetadata()
  async getLocationData(
    @Body() payload: GetPolicyLocationsByPoliciesDto,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const { policyIds, state } = payload;
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getLocationData",
          payload: { policyIds, state },
          messageData: "method invoked",
        }),
      });

      const result = await this.companyEmployeeService.getLocationDataByPolicyIds(
        policyIds,
        state,
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Location data retrieved successfully",
            result,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getLocationData",
          payload: { policyIds: payload.policyIds, state: payload.state },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });

      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to retrieve location data",
            null,
          ),
        );
    }
  }

  @Get("policy/feature-document")
  @getPolicyFeatureDocumentByEmployeeSwaggerMetadata()
  async getPolicyFeatureDocumentByEmployee(
    @Query() query: GetPolicyFeatureDocumentsQueryDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid as string);
    const employeeId = Number(query.employeeId);

    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getPolicyFeatureDocumentByEmployee",
          payload: { employeeId },
          messageData: "method invoked",
        }),
      });

      const result =
        await this.companyEmployeeService.getActivePolicyFeatureDocumentForEmployee(
          employeeId,
          userId,
          query,
        );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy feature document retrieved successfully",
            result,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getPolicyFeatureDocumentByEmployee",
          payload: { employeeId },
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
              : "Failed to retrieve policy feature document",
          ),
        );
    }
  }

  @Get("policy/:policyId/feature-document")
  async getPolicyFeatureDocumentByPolicyId(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid as string);
    try {
      const result =
        await this.companyEmployeeService.getPolicyFeatureDocumentByPolicyId(
          policyId,
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy feature document retrieved successfully",
            result,
          ),
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getPolicyFeatureDocumentByPolicyId",
          payload: { policyId },
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
              : "Failed to retrieve policy feature document",
          ),
        );
    }
  }

  // New User Activity Log Endpoint
  @Post("/user-activity-log")
  @createUserActivityLogSwaggerMetadata()
  async createUserActivityLog(
    @Body() body: CreateUserActivityLogDto,
    @Req() req: Request,
  ): Promise<{ data?: any; statusCode: number; message: string }> {
    const headerUserId = parseInt(req?.headers?.userid as string, 10);
    const userId = headerUserId;

    if (!userId || Number.isNaN(userId)) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: "userId is required either in request body or userid header",
      };
    }

    try {
      const log = await this.companyEmployeeService.createUserActivityLog({
        userId,
        activityKey: body.activityKey,
        activityCategory: body.activityCategory,
        referenceId: body.referenceId,
        referenceType: body.referenceType,
        metadata: body.metadata,
      });

      return {
        statusCode: HttpStatus.CREATED,
        message: "User activity log created successfully",
        data: log,
      };
      
    }

    catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "createUserActivityLog",
          payload: body,
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message:
          error instanceof Error
            ? error.message
            : "Failed to create user activity log",
      };
    }
  }
  
  @Get("enrollment-progress/:employeeId")
  @getEnrollmentProgressSwaggerMetadata()
  async getEnrollmentProgress(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Query("enrollmentBatchKey") enrollmentBatchKey: string | undefined,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "getEnrollmentProgress",
        payload: { employeeId, enrollmentBatchKey },
        messageData: "method invoked",
      }),
    });

    try {
      const result = await this.companyEmployeeService.getEnrollmentProgress(
        employeeId,
        enrollmentBatchKey
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Enrollment progress retrieved successfully",
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
          location: "CompanyEmployeeController",
          method: "getEnrollmentProgress",
          payload: { employeeId, enrollmentBatchKey },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to retrieve enrollment progress"
          )
        );
    }
  }

  @Get("/user-activity-log")
  async getUserActivityLogs(
    @Req() req: Request,
    @Query("employeeId") employeeIdParam?: string,
    @Query("activityKey") activityKey?: string,
  ): Promise<{ data?: any; statusCode?: number; message?: string }> {
    const userId = parseInt(req?.headers?.userid as string);
    const employeeId = employeeIdParam ? parseInt(employeeIdParam) : undefined;
    try {
      const logs = await this.companyEmployeeService.fetchUserActivityLogs(
        userId,
        employeeId,
        activityKey,
      );
      const formattedLogs = logs.map((log: any) => ({
        id: log.id,
        userId: log.userId,
        activityKey: log.activityKey,
        activityCategory: log.activityCategory,
        actionDate: log.actionDate,
        activityDate: log.actionDate,
        referenceId: log.referenceId,
        referenceType: log.referenceType,
        metadata: log.metadata ?? null,
        meta: log.metadata ?? null,
        createdAt: log.createdAt,
      }));
      return {
        statusCode: 200,
        message: "User activity logs retrieved successfully",
        data: formattedLogs,
      };

    }
    catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getUserActivityLogs",
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      return {
        statusCode: 500,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch user activity logs",
      };
    }
  }

  @Put("enrollment-progress/:employeeId")
  @updateEnrollmentProgressSwaggerMetadata()
  async updateEnrollmentProgress(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Body() payload: UpdateEnrollmentProgressDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "updateEnrollmentProgress",
        payload: { employeeId, ...payload },
        messageData: "method invoked",
      }),
    });

    try {
      const result = await this.companyEmployeeService.updateEnrollmentProgress(
        employeeId,
        payload.enrollmentBatchKey,
        payload.stepName,
        payload.completed ?? true,
        payload.policiesCompleted
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Enrollment progress updated successfully",
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
            location: "CompanyEmployeeController",
            method: "updateEnrollmentProgress",
            payload: { employeeId, ...payload },
            messageData: error instanceof Error ? error.message : String(error),
          }),
        });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to update enrollment progress"
          )
        );
    }
  }

  @Post("enrollment-progress/initialize")
  @initializeEnrollmentProgressSwaggerMetadata()
  async initializeEnrollmentProgress(
    @Body() payload: InitializeEnrollmentProgressDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "initializeEnrollmentProgress",
        payload,
        messageData: "method invoked",
      }),
    });

    try {
      const result = await this.companyEmployeeService.initializeEnrollmentProgress(
        payload.employeeId,
        payload.policyIds
      );

      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            "Enrollment progress initialized successfully",
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
          location: "CompanyEmployeeController",
          method: "initializeEnrollmentProgress",
          payload,
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
              : "Failed to initialize enrollment progress"
          )
        );
    }
  }

  @Put("enrollment-periods/extend")
  @extendEnrollmentPeriodSwaggerMetadata()
  async extendEnrollmentPeriod(
    @Body() payload: ExtendEnrollmentPeriodDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "CompanyEmployeeController",
        method: "extendEnrollmentPeriod",
        payload,
        messageData: "method invoked",
      }),
    });

    try {
      const result = await this.companyEmployeeService.extendEnrollmentPeriod(
        payload.companyId,
        payload.periodIds,
        payload.newEndDate
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Enrollment period(s) extended successfully",
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
          location: "CompanyEmployeeController",
          method: "extendEnrollmentPeriod",
          payload,
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        "One or more enrollment periods were not found",
        "Enrollment period does not belong to the given company",
        "Failed to extend enrollment period"
      );
    }
  }

  @Post('/intimate-claim')
  async intimateClaim(
    @Body() dto: IntimateClaimDto,
    @Res() res: Response,
    @Req() req: any,
  ): Promise<Response> {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'CompanyEmployeeController',
          method: 'intimateClaim',
          payload: dto,
          messageData: 'Intimate claim request received',
        }),
      });

      const authHeader = String(req.headers["authorization"] || "");
      const result = await this.companyEmployeeService.intimateClaim(dto, authHeader);

      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'CompanyEmployeeController',
          method: 'intimateClaim',
          payload: { claimId: result.claimId },
          messageData: 'Claim intimated successfully',
        }),
      });

      return res.status(HttpStatus.CREATED).json(
        createResponse(HttpStatus.CREATED, 'Claim intimated successfully', result)
      );
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'CompanyEmployeeController',
          method: 'intimateClaim',
          payload: dto,
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
              : errorMessages.CLAIM_INTIMATION_FAILED
          )
        );
    }
  }

  // Internal-only — called by ClaimTpaSubmissionScheduler (scheduler-service)
  // directly by URL, the same way GenericTpaSyncScheduler calls document-
  // service directly, bypassing api-gateway. Not meant for end-user/frontend
  // use; nothing here is registered with the frontend endPoints constants.
  // See CompanyEmployeeService.processClaimTpaJob for what this actually does.
  @Post('/internal/claim-tpa-jobs/:jobId/process')
  async processClaimTpaJob(
    @Param('jobId', ParseIntPipe) jobId: number,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'CompanyEmployeeController',
          method: 'processClaimTpaJob',
          payload: { jobId },
          messageData: 'Claim TPA job processing requested',
        }),
      });

      const result = await this.companyEmployeeService.processClaimTpaJob(jobId);

      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'CompanyEmployeeController',
          method: 'processClaimTpaJob',
          payload: { jobId },
          messageData: { message: 'Responding', ...result },
        }),
      });

      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, 'Claim TPA job processed', result)
      );
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'CompanyEmployeeController',
          method: 'processClaimTpaJob',
          payload: { jobId },
          messageData: error,
        }),
      });

      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(
          createErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            error instanceof Error ? error.message : 'Failed to process claim TPA job',
          )
        );
    }
  }

  @Post('/claims/:claimId/submit')
  async submitClaim(
    @Param('claimId') claimId: string,
    @Body() dto: SubmitClaimDto,
    @Query('employeeId') employeeId: string,
    @Res() res: Response,
    @Req() req: any,
  ): Promise<Response> {
    try {
      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'CompanyEmployeeController',
          method: 'submitClaim',
          payload: { claimId, dto },
          messageData: 'Claim submission request received',
        }),
      });

      const authHeader = String(req.headers["authorization"] || "");
      const result = await this.companyEmployeeService.submitClaim(
        Number(claimId),
        dto,
        authHeader,
        Number(employeeId),
      );

      this.logger.log({
        level: 'info',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'success',
          location: 'CompanyEmployeeController',
          method: 'submitClaim',
          payload: { claimId: result.claimId },
          messageData: 'Claim submitted successfully',
        }),
      });

      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, 'Claim submitted successfully', result)
      );
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'CompanyEmployeeController',
          method: 'submitClaim',
          payload: { claimId, dto },
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
              : 'Claim submission failed'
          )
        );
    }
  }

  @Get('/claims/flow-mode/:policyId')
  async getClaimFlowMode(
    @Param('policyId') policyId: string,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const result = await this.companyEmployeeService.getClaimFlowMode(Number(policyId));
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, 'Claim flow mode resolved', result)
      );
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'CompanyEmployeeController',
          method: 'getClaimFlowMode',
          payload: { policyId },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : 'Failed to resolve claim flow mode'
          )
        );
    }
  }

  @Get('/claims/extra-fields/:policyId')
  async getClaimExtraFields(
    @Param('policyId') policyId: string,
    @Query('apiType') apiType: string,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const resolvedApiType = apiType === 'SUBMIT_CLAIM' ? 'SUBMIT_CLAIM' : 'INTIMATE_CLAIM';
      const result = await this.companyEmployeeService.getClaimExtraFields(Number(policyId), resolvedApiType);
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, 'Claim extra fields resolved', result)
      );
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'CompanyEmployeeController',
          method: 'getClaimExtraFields',
          payload: { policyId, apiType },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : 'Failed to resolve claim extra fields'
          )
        );
    }
  }

  @Get('/claims/intimated/:employeeId')
  async getIntimatedClaims(
    @Param('employeeId') employeeId: string,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const result = await this.companyEmployeeService.getIntimatedClaims(Number(employeeId));
      return res.status(HttpStatus.OK).json(
        createResponse(HttpStatus.OK, 'Intimated claims resolved', result)
      );
    } catch (error) {
      this.logger.error({
        level: 'error',
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: 'failure',
          location: 'CompanyEmployeeController',
          method: 'getIntimatedClaims',
          payload: { employeeId },
          messageData: error,
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createErrorResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : 'Failed to resolve intimated claims'
          )
        );
    }
  }

  @Get("/notification-info/:id")
  @getNotificationInfoByIdSwaggerMetadata()
  async getNotificationInfoById(
    @Param("id", ParseIntPipe) notificationInfoId: number,
    @Req() req: Request,
  ): Promise<{ data?: any; statusCode?: number; message?: string }> {
    const userId = parseInt(req?.headers?.userid as string);
    try {
      const notificationInfo =
        await this.companyEmployeeService.fetchNotificationInfoById(
          notificationInfoId,
          userId,
        );

      return {
        statusCode: 200,
        message: "Notification info retrieved successfully",
        data: notificationInfo,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getNotificationInfoById",
          payload: { notificationInfoId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });

      if (error instanceof NotFoundException) {
        return {
          statusCode: 404,
          message: error.message,
        };
      }

      return {
        statusCode: 500,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch notification info",
      };
    }
  }

  @Get("enrollment-submission/latest")
  async getLatestEnrollmentSubmissionMeta(
    @Query("employeeId") employeeIdRaw: string,
    @Query("companyId") companyIdRaw: string,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const employeeId = Number(employeeIdRaw);
      const companyId = Number(companyIdRaw);

      if (!Number.isFinite(employeeId) || !Number.isFinite(companyId)) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createErrorResponse(
              HttpStatus.BAD_REQUEST,
              "employeeId and companyId are required",
            ),
          );
      }

      const data =
        await this.companyEmployeeService.getLatestEnrollmentSubmissionMeta({
          employeeId,
          companyId,
        });

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Success", data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getLatestEnrollmentSubmissionMeta",
          messageData: error,
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  // Ticket Management Endpoints
  @Post("tickets")
  async createAnonymousTicket(
    @Body() createTicketDto: CreateTicketDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "createAnonymousTicket",
          payload: { createTicketDto },
          messageData: "Creating anonymous support ticket",
        }),
      });

      const result = await this.companyEmployeeService.createTicket(
        null,
        createTicketDto,
      );

      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, "Ticket created successfully", result));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "createAnonymousTicket",
          payload: { createTicketDto },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("tickets/public")
  async getTicketsByDomain(
    @Query("domain") domain: string,
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Query("status") status: string,
    @Query("category") category: string,
    @Res() res: Response,
  ): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getTicketsByDomain",
          payload: { domain },
          messageData: "Retrieving company tickets by domain",
        }),
      });

      const queryDto = {
        page: page ? Math.max(1, parseInt(page, 10)) : 1,
        limit: limit ? Math.max(1, parseInt(limit, 10)) : 50,
        status: status || undefined,
        category: category || undefined,
      };

      const result = await this.companyEmployeeService.getTicketsByDomain(domain, queryDto);

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Tickets retrieved successfully", result));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getTicketsByDomain",
          payload: { domain },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  @Post(":employeeId/tickets")
  @AuthProtected()
  async createTicket(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Body() createTicketDto: CreateTicketDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "createTicket",
          payload: { employeeId, createTicketDto },
          messageData: "Creating support ticket",
        }),
      });

      const userId = parseInt(String((req as any)?.headers?.userid ?? "0"), 10);
      const result = await this.companyEmployeeService.createTicket(
        employeeId,
        createTicketDto,
        userId || undefined,
      );

      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, "Ticket created successfully", result));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "createTicket",
          payload: { employeeId, createTicketDto },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get(":employeeId/tickets")
  @AuthProtected()
  async getTicketsByEmployeeId(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Query() queryDto: GetTicketsQueryDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getTicketsByEmployeeId",
          payload: { employeeId, queryDto },
          messageData: "Retrieving employee tickets",
        }),
      });

      const result = await this.companyEmployeeService.getTicketsByEmployeeId(
        employeeId,
        queryDto
      );

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Tickets retrieved successfully", result));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getTicketsByEmployeeId",
          payload: { employeeId, queryDto },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get(":employeeId/tickets/:ticketId")
  @AuthProtected()
  async getTicketById(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Param("ticketId", ParseIntPipe) ticketId: number,
    @Res() res: Response,
  ): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "getTicketById",
          payload: { employeeId, ticketId },
          messageData: "Retrieving ticket by ID",
        }),
      });

      const result = await this.companyEmployeeService.getTicketById(
        ticketId,
        employeeId
      );

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Ticket retrieved successfully", result));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "getTicketById",
          payload: { employeeId, ticketId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  @Put("tickets/:ticketId/status")
  @AuthProtected()
  async updateTicketStatus(
    @Param("ticketId", ParseIntPipe) ticketId: number,
    @Body() updateTicketStatusDto: UpdateTicketStatusDto,
    @Res() res: Response,
  ): Promise<any> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "CompanyEmployeeController",
          method: "updateTicketStatus",
          payload: { ticketId, updateTicketStatusDto },
          messageData: "Updating support ticket status",
        }),
      });

      const result = await this.companyEmployeeService.updateTicketStatus(
        ticketId,
        updateTicketStatusDto,
      );

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Ticket status updated successfully", result));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "CompanyEmployeeController",
          method: "updateTicketStatus",
          payload: { ticketId, updateTicketStatusDto },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      return handleErrorResponse(error as Error, res);
    }
  }

  @Get("address/country/list")
  async getCountryList(@Res() res: Response): Promise<Response> {
    try {
      const data = await this.companyEmployeeService.getAllCountries();
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Countries fetched successfully", data));
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, (error as Error).message)
      );
    }
  }

  @Get("address/state/:countryId")
  async getStatesByCountry(
    @Param("countryId", ParseIntPipe) countryId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const data = await this.companyEmployeeService.getStatesByCountry(countryId);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "States fetched successfully", data));
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, (error as Error).message)
      );
    }
  }

  @Get("address/city/:stateId")
  async getCitiesByState(
    @Param("stateId", ParseIntPipe) stateId: number,
    @Res() res: Response,
    @Query("search") search?: string
  ): Promise<Response> {
    try {
      const data = await this.companyEmployeeService.getCitiesByState(stateId, search);
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Cities fetched successfully", data));
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, (error as Error).message)
      );
    }
  }

  @Get("employee/:employeeId/tpa-features")
  async getEmployeeTpaFeatures(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const data = await this.companyEmployeeService.getEmployeeTpaFeatures(employeeId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "TPA features fetched", data));
    } catch (error) {
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, (error as Error).message));
    }
  }

  @Get("employee/:employeeId/tpa-portal-sso")
  async getEmployeeTpaPortalSsoUrl(
    @Param("employeeId", ParseIntPipe) employeeId: number,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const data = await this.companyEmployeeService.getEmployeeTpaPortalSsoUrl(employeeId);
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "TPA portal SSO URL generated", data));
    } catch (error) {
      if (error instanceof NotFoundException) {
        return res
          .status(HttpStatus.NOT_FOUND)
          .json(createErrorResponse(HttpStatus.NOT_FOUND, (error as Error).message));
      }
      return res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, (error as Error).message));
    }
  }

  @Post("claim-form/save-extraction")
  async saveClaimFormExtraction(
    @Body() body: { policyId?: number | null; employeeId?: number | null; fileName: string; claimData: Record<string, any>; aiResponseData?: Record<string, any> | null },
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const data = await this.companyEmployeeService.saveClaimFormExtraction({
        policyId: body.policyId ?? null,
        employeeId: body.employeeId ?? null,
        fileName: body.fileName,
        claimData: body.claimData,
        aiResponseData: body.aiResponseData ?? null,
      });
      return res.status(HttpStatus.OK).json(createResponse(HttpStatus.OK, "Claim extraction saved", data));
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
        createErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, (error as Error).message)
      );
    }
  }
}
