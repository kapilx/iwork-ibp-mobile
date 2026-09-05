import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  ParseIntPipe,
  Req,
  Res,
  HttpStatus,
  Body,
  BadRequestException,
  HttpException,
  NotFoundException,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import {
  processHospitalUploadSwaggerMetadata,
  getHospitalsSwaggerMetadata,
  searchHospitalsSwaggerMetadata,
  exportHospitalsToExcelSwaggerMetadata,
  downloadTemplateSwaggerMetadata,
  getLocationDataSwaggerMetadata,
  getTransactionHistorySwaggerMetadata,
  downloadFaqTemplateSwaggerMetadata,
  bulkUploadFaqSwaggerMetadata,
  getPolicyFaqsSwaggerMetadata,
  getFaqUploadsSwaggerMetadata,
  downloadPolicyFaqsSwaggerMetadata,
  createPolicyFeatureDocumentSwaggerMetadata,
  getPolicyFeatureDocumentSwaggerMetadata,
  updatePolicyContactMatrixSwaggerMetadata,
  getTpaContactsWithCommsSwaggerMetadata,
  getInsurerContactsWithCommsSwaggerMetadata,
  getPolicyTpaInsurerInfoSwaggerMetadata,
  getSubmittedPolicyContactsSwaggerMetadata,
  getPortalConfigurationOverviewSwaggerMetadata,
} from "./portal-configuration.swagger";
import { PortalConfigurationService } from './portal-configuration.service';
import { SearchHospitalDto } from './dto/search-hospital.dto';
import { SearchHospitalsByPoliciesDto } from "./dto/search-hospitals-by-policies.dto";
import { HospitalUploadDto } from './dto/hospital-upload.dto';
import { TraceIdService } from '../../../../service-lib/src/lib/trace-id.service';
import { createLogger } from '../../../../service-lib/src/lib/logger';
import { serviceNames, DEFAULT_VALUES } from '../../../../service-lib/src/lib/constants';
import { errorMessages } from '../../../../../../libs/service-lib/src/lib/messages';
import { buildLogMessage } from '../../../../service-lib/src/lib/utils/logger.util';
import {
  createErrorResponse,
  createResponse,
  handleErrorResponse,
} from '../../../../../../libs/service-lib/src/lib/utils/response.utils';
import { GetPolicyFaqsDto } from "./dto/get-policy-faqs.dto";
import { GetFaqUploadsDto } from "./dto/get-faq-uploads.dto";
import { BulkUploadFaqDto } from "./dto/bulk-upload-faq.dto";
import { UpdatePolicyContactMatrixDto } from "./dto/contact-matrix.dto";
import { PolicyFeatureDocumentRequestDto } from "./dto/policy-feature-document.dto";

@ApiTags("Portal Configuration")
@Controller("portal-configuration")
export class PortalConfigurationController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly portalConfigurationService: PortalConfigurationService,
    private readonly traceIdService: TraceIdService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.POLICY_SERVICE
    );
  }

  @Post("policy/:policyId/hospitals/upload")
  @processHospitalUploadSwaggerMetadata()
  async processHospitalUpload(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() uploadDto: HospitalUploadDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      // Validate and parse userId from headers (added by JWT middleware)
      const userIdHeader = (req.headers["userid"] ??
        req.headers["userId"] ??
        req.headers["user-id"]) as string | undefined;
      if (!userIdHeader) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createResponse(
              HttpStatus.BAD_REQUEST,
              "Missing userid header",
              null
            )
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
              null
            )
          );
      }

      // Extract data from DTO (validation handled by NestJS automatically)
      const { fileId, isReplaceAll = false } = uploadDto;

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationController",
          method: "processHospitalUpload",
          payload: { policyId, fileId, isReplaceAll },
          messageData: "hospital file processing started",
        }),
      });

      // Process upload using fileId
      const result =
        await this.portalConfigurationService.processHospitalFileUpload(
          fileId,
          policyId,
          userId,
          isReplaceAll
        );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationController",
          method: "processHospitalUpload",
          payload: { policyId, ...result },
          messageData: "hospital upload completed",
        }),
      });

      const statusCode =
        result.status === "error" ? HttpStatus.BAD_REQUEST : HttpStatus.OK;

      return res
        .status(statusCode)
        .json(
          createResponse(statusCode, result.message, result)
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationController",
          method: "processHospitalUpload",
          payload: { policyId, fileId: req.body?.fileId },
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
              : "Failed to upload hospitals",
            null
          )
        );
    }
  }

  @Put("policy/:policyId/contact-matrix")
  @updatePolicyContactMatrixSwaggerMetadata()
  async updatePolicyContactMatrix(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() payload: UpdatePolicyContactMatrixDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userIdHeader = (req.headers["userid"] ??
      req.headers["userId"] ??
      req.headers["user-id"]) as string | undefined;

    if (!userIdHeader) {
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createResponse(
            HttpStatus.BAD_REQUEST,
            "Missing userid header",
            null
          )
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
            null
          )
        );
    }

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PortalConfigurationController",
        method: "updatePolicyContactMatrix",
        payload: { policyId, payload },
        messageData: "Updating contact matrix for policy",
      }),
    });

    try {
      const result =
        await this.portalConfigurationService.updatePolicyContactMatrix(
          policyId,
          payload,
          userId
        );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationController",
          method: "updatePolicyContactMatrix",
          payload: { policyId, updatedAt: result.updatedAt },
          messageData: "Contact matrix updated successfully",
        }),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Contact matrix updated successfully",
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
          location: "PortalConfigurationController",
          method: "updatePolicyContactMatrix",
          payload: { policyId, payload },
          messageData:
            error instanceof Error ? error.message : String(error),
        }),
      });

      return handleErrorResponse(
        error instanceof HttpException
          ? error
          : new BadRequestException(
              (error as Error).message || "Failed to update contact matrix"
            ),
        res,
        (error as Error).message,
        (error as Error).message
      );
    }
  }

  @Get("tpa/:tpaId/contacts")
  @getTpaContactsWithCommsSwaggerMetadata()
  async getTpaContacts(
    @Param("tpaId", ParseIntPipe) tpaId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt((req.headers["userid"] ?? "0") as string);
    try {
      const result =
        await this.portalConfigurationService.getTpaContactsWithCommunication(
          tpaId
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "TPA contacts retrieved successfully",
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
          location: "PortalConfigurationController",
          method: "getTpaContacts",
          payload: { tpaId },
          messageData:
            error instanceof Error ? error.message : String(error),
        }),
      });

      return handleErrorResponse(
        error instanceof HttpException
          ? error
          : new BadRequestException(
              (error as Error).message || "Failed to fetch TPA contacts"
            ),
        res,
        (error as Error).message,
        (error as Error).message
      );
    }
  }

  @Get("insurer/:insurerId/contacts")
  @getInsurerContactsWithCommsSwaggerMetadata()
  async getInsurerContacts(
    @Param("insurerId", ParseIntPipe) insurerId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt((req.headers["userid"] ?? "0") as string);
    try {
      const result =
        await this.portalConfigurationService.getInsurerContactsWithCommunication(
          insurerId
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Insurer contacts retrieved successfully",
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
          location: "PortalConfigurationController",
          method: "getInsurerContacts",
          payload: { insurerId },
          messageData:
            error instanceof Error ? error.message : String(error),
        }),
      });

      return handleErrorResponse(
        error instanceof HttpException
          ? error
          : new BadRequestException(
              (error as Error).message || "Failed to fetch insurer contacts"
            ),
        res,
        (error as Error).message,
        (error as Error).message
      );
    }
  }

  @Get("policy/:policyId/tpa-insurer-info")
  @getPolicyTpaInsurerInfoSwaggerMetadata()
  async getPolicyTpaInsurerInfo(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt((req.headers["userid"] ?? "0") as string);
    try {
      const result =
        await this.portalConfigurationService.getPolicyTpaInsurerInfo(
          policyId
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy party IDs retrieved successfully",
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
          location: "PortalConfigurationController",
          method: "getPolicyTpaInsurerInfo",
          payload: { policyId },
          messageData:
            error instanceof Error ? error.message : String(error),
        }),
      });

      return handleErrorResponse(
        error instanceof HttpException
          ? error
          : new BadRequestException(
              (error as Error).message || "Failed to fetch policy party IDs"
            ),
        res,
        (error as Error).message,
        (error as Error).message
      );
    }
  }

  @Get("policy/:policyId/submitted/contacts")
  @getSubmittedPolicyContactsSwaggerMetadata()
  async getSubmittedPolicyContacts(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt((req.headers["userid"] ?? "0") as string);
    try {
      const result =
        await this.portalConfigurationService.getSubmittedPolicyContactsCombined(
          policyId
        );
      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Submitted policy contacts retrieved successfully",
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
          location: "PortalConfigurationController",
          method: "getSubmittedPolicyContacts",
          payload: { policyId },
          messageData:
            error instanceof Error ? error.message : String(error),
        }),
      });

      return handleErrorResponse(
        error instanceof HttpException
          ? error
          : new BadRequestException(
              (error as Error).message ||
                "Failed to fetch submitted policy contacts"
            ),
        res,
        (error as Error).message,
        (error as Error).message
      );
    }
  }

  @Get("/hospitals")
  @getHospitalsSwaggerMetadata()
  async getHospitals(
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Res() res: Response
  ): Promise<Response> {
    try {
      const traceId = this.traceIdService.traceId;
      console.log(`Get hospitals request - TraceId: ${traceId}`);

      const result = await this.portalConfigurationService.getHospitals({
        page: Number(page),
        limit: Number(limit),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Hospitals retrieved successfully",
            result
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationController",
          method: "getHospitals",
          payload: { page, limit },
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
              : "Failed to retrieve hospitals",
            null
          )
        );
    }
  }

  @Get("policy/hospitals/search/:policyId")
  @searchHospitalsSwaggerMetadata()
  // @UseGuards(AclGuard)
  async searchHospitals(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query() searchParams: SearchHospitalDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
      // Validate and parse userId from headers (added by JWT middleware)
      const userIdHeader = (req.headers["userid"] ??
        req.headers["userId"] ??
        req.headers["user-id"]) as string | undefined;
      if (!userIdHeader) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createResponse(
              HttpStatus.BAD_REQUEST,
              "Missing userid header",
              null
            )
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
              null
            )
          );
      }

      // Check if this is a geospatial query (latitude and longitude provided in searchParams)
      const isGeospatialQuery = searchParams.latitude !== undefined && searchParams.longitude !== undefined;

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationController",
          method: "searchHospitals",
          payload: { policyId, searchParams, isGeospatialQuery },
          messageData: isGeospatialQuery ? "geospatial hospital search initiated" : "regular hospital search initiated",
        }),
      });

      const result = await this.portalConfigurationService.searchHospitals(
        policyId,
        searchParams,
        userId
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Hospitals retrieved successfully",
            result
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationController",
          method: "searchHospitals",
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
              : "Failed to search hospitals",
            null
          )
        );
    }
  }

  @Post("policy/hospitals/search")
  async searchHospitalsByPolicyIds(
    @Body() body: SearchHospitalsByPoliciesDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    try {
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
          .json(createResponse(HttpStatus.BAD_REQUEST, "Invalid userid header - must be a valid number", null));
      }

      const { policyIds, ...searchParams } = body;
      const result = await this.portalConfigurationService.searchHospitalsByPolicyIds(
        policyIds,
        searchParams,
        userId
      );

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Hospitals retrieved successfully", result));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationController",
          method: "searchHospitalsByPolicyIds",
          payload: { body },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error ? error.message : "Failed to retrieve hospitals",
            null
          )
        );
    }
  }

  @Get("policies/:policyId/hospitals/export")
  @exportHospitalsToExcelSwaggerMetadata()
  async exportHospitalsToExcel(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query() searchParams: SearchHospitalDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      // Validate and parse userId from headers (same pattern as other endpoints)
      const userIdHeader = (req.headers["userid"] ??
        req.headers["userId"] ??
        req.headers["user-id"]) as string | undefined;
      if (!userIdHeader) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .json(
            createResponse(
              HttpStatus.BAD_REQUEST,
              "Missing userid header",
              null
            )
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
              null
            )
          );
      }

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationController",
          method: "exportHospitalsToExcel",
          payload: { policyId, searchParams },
          messageData: "method invoked",
        }),
      });

      const result = await this.portalConfigurationService.exportHospitalsToExcel(
        policyId,
        searchParams,
        userId
      );

      // Set headers for download (same as file-upload service)
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`
      );
      res.setHeader(
        "Content-Type",
        result.mimeType || "application/octet-stream"
      );
      if (result.contentLength) {
        res.setHeader("Content-Length", result.contentLength);
      }
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

      // Pipe the stream to the response (same as file-upload service)
      result.stream.pipe(res);
    } catch (error) {
      const userIdHeader = (req.headers["userid"] ??
        req.headers["userId"] ??
        req.headers["user-id"]) as string | undefined;
      const userId = userIdHeader ? parseInt(userIdHeader, 10) : undefined;

      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PortalConfigurationController",
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
            null
          )
        );
    }
  }

  @Get("hospitals/template")
  @downloadTemplateSwaggerMetadata()
  async downloadTemplate(@Req() req: Request, @Res() res: Response): Promise<void> {
    try {
      const userIdHeader = (req.headers["userid"] ??
        req.headers["userId"] ??
        req.headers["user-id"]) as string | undefined;
      const userId = userIdHeader ? parseInt(userIdHeader, 10) : undefined;
      const userDetails = userId
        ? await this.portalConfigurationService.getUserDetails(userId)
        : null;

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationController",
          method: "downloadTemplate",
          payload: {},
          messageData: "generating template",
        }),
      });

      const result = await this.portalConfigurationService.generateTemplate(userDetails);

      // Set headers for download (same as file-upload service)
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`
      );
      res.setHeader(
        "Content-Type",
        result.mimeType || "application/octet-stream"
      );
      if (result.contentLength) {
        res.setHeader("Content-Length", result.contentLength);
      }
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationController",
          method: "downloadTemplate",
          payload: {
            bufferSize: result.contentLength,
            fileName: result.fileName,
          },
          messageData: "template generated successfully",
        }),
      });

      // Pipe the stream to the response (same as file-upload service)
      result.stream.pipe(res);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationController",
          method: "downloadTemplate",
          payload: {},
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });
      res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          createResponse(
            HttpStatus.BAD_REQUEST,
            error instanceof Error
              ? error.message
              : "Failed to generate template",
            null
          )
        );
    }
  }

  @Get("policy/:policyId/locations")
  @getLocationDataSwaggerMetadata()
  async getLocationData(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("state") state?: string,
    @Res() res: Response
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationController",
          method: "getLocationData",
          payload: { policyId, state },
          messageData: "method invoked",
        }),
      });

      const result = await this.portalConfigurationService.getLocationData(policyId, state);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationController",
          method: "getLocationData",
          payload: { 
            policyId, 
            state,
            statesCount: result.states?.length || 0,
            citiesCount: result.cities?.length || 0
          },
          messageData: "location data retrieved successfully",
        }),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Location data retrieved successfully",
            result
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationController",
          method: "getLocationData",
          payload: { policyId, state },
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
            null
          )
        );
    }
  }

  @Get("policy/:policyId/hospitals/transactions")
  @getTransactionHistorySwaggerMetadata()
  async getTransactionHistory(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Res() res: Response
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationController",
          method: "getTransactionHistory",
          payload: { policyId, page, limit },
          messageData: "method invoked",
        }),
      });

      // Default pagination values like feature-document API
      const pageNum = page ? parseInt(page) : 1;
      const limitNum = limit ? parseInt(limit) : undefined; // No limit if not provided

      const result = await this.portalConfigurationService.getUploadHistory(
        policyId,
        pageNum,
        limitNum
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationController",
          method: "getTransactionHistory",
          payload: { policyId, count: result.count },
          messageData: "upload history retrieved successfully",
        }),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Upload history retrieved successfully",
            result
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationController",
          method: "getTransactionHistory",
          payload: { policyId, page, limit },
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
              : "Failed to retrieve upload history",
            null
          )
        );
    }
  }

  @Get("policy/:policyId/overview")
  @getPortalConfigurationOverviewSwaggerMetadata()
  async getPortalConfigurationOverview(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Res() res: Response
  ): Promise<Response> {
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationController",
          method: "getPortalConfigurationOverview",
          payload: { policyId },
          messageData: "method invoked",
        }),
      });

      const result = await this.portalConfigurationService.getPortalConfigurationOverview(policyId);

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          location: "PortalConfigurationController",
          method: "getPortalConfigurationOverview",
          payload: { policyId, ...result.hospitalNetwork },
          messageData: "hospital network overview retrieved successfully",
        }),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Hospital network overview retrieved successfully",
            result
          )
        );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "PortalConfigurationController",
          method: "getPortalConfigurationOverview",
          payload: { policyId },
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
              : "Failed to retrieve hospital network overview",
            null
          )
        );
    }
  }

  @Get("faq")
  @getPolicyFaqsSwaggerMetadata()
  async getPolicyFaqs(
    @Query() query: GetPolicyFaqsDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid as string);

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PortalConfigurationController",
        method: "getPolicyFaqs",
        payload: {
          policyId: query.policyId,
          category: query.category || "ALL",
          search: query.search || "NONE",
          page: query.page || DEFAULT_VALUES.PAGE,
          limit: query.limit || DEFAULT_VALUES.LIMIT,
        },
        messageData: "FAQ retrieval request received",
      }),
    });

    try {
      const policyIdNum = parseInt(query.policyId);
      if (isNaN(policyIdNum) || policyIdNum <= 0) {
        throw new BadRequestException("Policy ID must be a valid positive number");
      }

      const result = await this.portalConfigurationService.getPolicyFaqs(
        policyIdNum,
        query.category,
        query.search,
        query.page,
        query.limit
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationController",
          method: "getPolicyFaqs",
          payload: {
            policyId: policyIdNum,
            resultCount: result.faqs.length,
            totalCount: result.total,
            categoriesCount: result.availableCategories.length,
          },
          messageData: "FAQs retrieved successfully",
        }),
      });

      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "FAQs retrieved successfully",
        data: result,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PortalConfigurationController",
          method: "getPolicyFaqs",
          payload: {
            policyId: query.policyId,
            category: query.category || "ALL",
            search: query.search || "NONE",
          },
          messageData: `Failed to retrieve FAQs: ${(error as Error).message}`,
        }),
      });

      return handleErrorResponse(
        error instanceof HttpException
          ? error
          : new BadRequestException(
              (error as Error).message || "Failed to retrieve FAQs"
            ),
        res,
        (error as Error).message,
        (error as Error).message
      );
    }
  }

  @Get("faq/faq-uploads-log")
  @getFaqUploadsSwaggerMetadata()
  async getFaqUploads(
    @Query() query: GetFaqUploadsDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid as string);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationController",
          method: "getFaqUploads",
          payload: {
            policyId: query.policyId ? parseInt(query.policyId) : undefined,
            userId,
            limit: query.limit,
            page: query.page,
          },
          messageData: "Started fetching FAQs upload data",
        }),
      });

      const policyId = query.policyId ? parseInt(query.policyId) : undefined;
      const page = query.page || DEFAULT_VALUES.PAGE;
      const limit = query.limit || DEFAULT_VALUES.LIMIT;

      const result = await this.portalConfigurationService.getFaqUploads(
        policyId,
        page,
        limit
      );
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        message: "FAQ uploads retrieved successfully",
        data: result,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PortalConfigurationController",
          method: "getFaqUpload",
          payload: {
            policyId: query.policyId,
            userId,
            limit: query.limit,
            page: query.page,
          },
          messageData: `Failed to get FAQ uploads - ${
            (error as Error).message
          }`,
        }),
      });

      return handleErrorResponse(
        error instanceof HttpException
          ? error
          : new BadRequestException(
              (error as Error).message || "Failed to retrieve FAQs upload"
            ),
        res,
        (error as Error).message,
        (error as Error).message
      );
    }
  }

  @Get("faq/:policyId/download")
  @downloadPolicyFaqsSwaggerMetadata()
  async downloadPolicyFaqs(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const userId = parseInt(req?.headers?.userid as string);
    const userDetails = userId ? await this.portalConfigurationService.getUserDetails(userId) : null;

    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationController",
          method: "downloadPolicyFaqs",
          payload: { policyId },
          messageData: "Active FAQ export requested",
        }),
      });

      const exportData = await this.portalConfigurationService.generatePolicyFaqExport(
        policyId,
        userDetails
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${exportData.fileName}"`
      );
      res.setHeader(
        "Content-Type",
        exportData.mimeType || "application/octet-stream"
      );
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      if (exportData.contentLength) {
        res.setHeader("Content-Length", exportData.contentLength);
      }

      exportData.stream.pipe(res);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PortalConfigurationController",
          method: "downloadPolicyFaqs",
          payload: { policyId },
          messageData:
            error instanceof Error
              ? error.message
              : "Failed to generate active FAQ export",
        }),
      });

      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error instanceof NotFoundException
          ? error.message
          : "Failed to generate active FAQ export";

      res.status(status).json(createErrorResponse(status, message));
    }
  }

  @Get(":policyId/faq/template/download")
  @downloadFaqTemplateSwaggerMetadata()
  async downloadFaqTemplate(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const userId = parseInt(req?.headers?.userid as string);
    const userDetails = userId ? await this.portalConfigurationService.getUserDetails(userId) : null;

    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationController",
          method: "downloadFaqTemplate",
          payload: { policyId },
          messageData: "FAQ template download requested",
        }),
      });

      const { stream, fileName, mimeType, contentLength } =
        await this.portalConfigurationService.generateFaqTemplate(policyId, userDetails);

      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.setHeader("Content-Type", mimeType);
      res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
      res.setHeader("Content-Length", contentLength);

      stream.pipe(res);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "PortalConfigurationController",
          method: "downloadFaqTemplate",
          payload: { policyId },
          messageData: error instanceof Error ? error.message : String(error),
        }),
      });

      const status =
        error instanceof NotFoundException
          ? HttpStatus.NOT_FOUND
          : HttpStatus.INTERNAL_SERVER_ERROR;
      const message =
        error instanceof Error
          ? error.message
          : "Failed to generate FAQ template";
      res.status(status).json(createErrorResponse(status, message));
    }
  }

  @Post("faq/bulk-upload")
  @bulkUploadFaqSwaggerMetadata()
  async bulkUploadFaq(
    @Body() bulkUploadFaqDto: BulkUploadFaqDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid as string);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationController",
          method: "bulkUpload FAQs",
          payload: {
            userId,
            ...bulkUploadFaqDto,
          },
          messageData: "FAQ bulk upload request received",
        }),
      });
      if (!userId) {
        this.logger.warn({
          level: "info",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            userId,
            status: "success",
            location: "PortalConfigurationController",
            method: "bulkUpload FAQs",
            payload: {
              userId,
              ...bulkUploadFaqDto,
            },
            messageData: "Unauthorized FAQ bulk upload attempt",
          }),
        });
        return res
          .status(HttpStatus.UNAUTHORIZED)
          .json(
            createErrorResponse(
              HttpStatus.UNAUTHORIZED,
              errorMessages.unauthorizedUser,
              null
            )
          );
      }

      const result = await this.portalConfigurationService.bulkUploadFaq(
        bulkUploadFaqDto,
        userId
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationController",
          method: "bulkUpload FAQs",
          payload: {
            userId,
            ...bulkUploadFaqDto,
          },
          messageData: "FAQ bulk upload completed successfully",
        }),
      });

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "FAQ bulk upload processed successfully",
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
          location: "PortalConfigurationController",
          method: "bulkUploadFaq",
          payload: {
            userId,
            ...bulkUploadFaqDto,
          },
          messageData:
            (error as Error).message || "Bulk upload of FAQs failed",
        }),
      });

      return handleErrorResponse(
        error instanceof HttpException
          ? error
          : new BadRequestException(
              (error as Error).message || "FAQs bulk upload failed"
            ),
        res,
        (error as Error).message,
        (error as Error).message
      );
    }
  }

  @Post(":policyId/feature-document")
  @createPolicyFeatureDocumentSwaggerMetadata()
  async createPolicyFeatureDocument(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Body() request: PolicyFeatureDocumentRequestDto,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid as string);
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationController",
          method: "createPolicyFeatureDocument",
          payload: { policyId, documentId: request.documentId },
          messageData: "method invoked",
        }),
      });

      const result = await this.portalConfigurationService.createPolicyFeatureDocument(
        policyId,
        request.documentId,
        userId
      );

      const responseMessage = result.isReplacement
        ? "Policy features document replaced successfully"
        : "Policy features document uploaded successfully";

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "PortalConfigurationController",
          method: "createPolicyFeatureDocument",
          payload: { policyId, result, isReplacement: result.isReplacement },
          messageData: responseMessage,
        }),
      });

      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            responseMessage,
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
          location: "PortalConfigurationController",
          method: "createPolicyFeatureDocument",
          payload: { policyId, documentId: request.documentId },
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
              : "Failed to create policy feature document"
          )
        );
    }
  }

  @Get(":policyId/feature-document")
  @getPolicyFeatureDocumentSwaggerMetadata()
  async getPolicyFeatureDocument(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Query("history") history?: boolean,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid as string);

    try {
      this.logger.log({
        level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "PortalConfigurationController",
        method: "getPolicyFeatureDocument",
        payload: { policyId, history, page, limit },
        messageData: "method invoked",
      }),
    });
    console.log("History:", history, "Page:", page, "Limit:", limit);
      let result;
      if (history == true) {
        result = await this.portalConfigurationService.getPolicyFeatureDocumentUploadHistory(
          policyId,
          page,
          limit
        );
      } else {
        result = await this.portalConfigurationService.getActivePolicyFeatureDocument(policyId);
      }

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy feature document retrieved successfully",
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
          location: "PortalConfigurationController",
          method: "getPolicyFeatureDocument",
          payload: { policyId, history, page, limit },
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
              : "Failed to retrieve policy feature document"
          )
        );
    }
  }

  @Delete(":policyId/feature-document")
  async deletePolicyFeatureDocument(
    @Param("policyId", ParseIntPipe) policyId: number,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<Response> {
    const userId = parseInt(req?.headers?.userid as string);

    try {
      const result =
        await this.portalConfigurationService.deletePolicyFeatureDocument(
          policyId,
          userId
        );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Policy feature document deleted successfully",
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
          location: "PortalConfigurationController",
          method: "deletePolicyFeatureDocument",
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
              : "Failed to delete policy feature document"
          )
        );
    }
  }
}
