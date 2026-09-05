import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  HttpException,
  NotFoundException,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";
import {
  createErrorResponse,
  handleErrorResponse,
} from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { CreateFileUploadDto } from "./dto/file-upload.dto";
import { BulkDownloadDto } from "./dto/bulk-download.dto";
import { FileUploadService } from "./file-upload.service";
import {
  replaceFileSwaggerMetadata,
  updateFileSizeSwaggerMetadata,
  uploadFileSwaggerMetadata,
  deleteUploadSwaggerMetadata,
  downloadFileSwaggerMetadata,
  fileDetailsSwaggerMetadata,
  allFileDetailsSwaggerMetadata,
} from "./file-upload.swagger";
import { GetAllFileDetailsDto } from "./dto/get-all-file-details.dto";
import type { Request, Response } from "express";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { formatSize } from "../../../../../../libs/service-lib/src/lib/utils/helper.utils";
import { TraceHttpService } from "../../../../service-lib/src/lib/trace-http.service";
import { ENV } from "../../../../service-lib/src/lib/environment";

@Controller("file-upload")
export class FileUploadController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly fileUploadService: FileUploadService,
    private readonly traceIdService: TraceIdService,
    private readonly traceHttpService: TraceHttpService
  ) {
    this.logger = createLogger(this.traceIdService, serviceNames.ORG_SERVICE);
  }

  /**
   * Fetches user details from auth service
   * @param userId - User ID to fetch details for
   * @param req - Express request object to forward headers
   * @returns User details containing firstName and lastName
   */
  private async fetchUserDetails(
    userId: number,
    req: Request
  ): Promise<{ firstName?: string; lastName?: string; email?: string; mobileNumber?: string; dob?: string; organisationKey?: string } | null> {
    try {
      const authServiceUrl = ENV.URL_AUTH_SERVICE ;
      const endpoint = `${authServiceUrl}/user-details`;

      // Forward all headers from original request
      const response = await this.traceHttpService.get<{
        userId: number;
        firstName?: string;
        lastName?: string;
        emailId?: string;
        mobile?: string;
        dob?: string;
        organisationKey?: string;
      }>(endpoint, {
        headers: {
          userid: userId.toString(),
          authorization: req.headers.authorization || "",
          cookie: req.headers.cookie || "",
        },
      });

      if (response.data && response.data.data) {
        return {
          firstName: response.data.data.firstName,
          lastName: response.data.data.lastName,
          email: response.data.data.emailId,
          mobileNumber: response.data.data.mobile,
          dob: response.data.data.dob,
          organisationKey: response.data.data.organisationKey,
        };
      }
      return null;
    } catch (error) {
      this.logger.warn({
        level: "warn",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "FileUploadController",
          method: "fetchUserDetails",
          messageData: `Failed to fetch user details: ${error.message}`,
        }),
      });
      return null;
    }
  }

  /**
   * Accepts a file through a POST request and processes it using the fileUploadService.
   */
  @Post("upload")
  @uploadFileSwaggerMetadata()
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateFileUploadDto,
    @Req() req: Request,
    @Res() res: Response
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "FileUploadController",
        method: "uploadFile",
        payload: body,
        messageData: "method invoked",
      }),
    });
    try {
      if (!file) {
        throw new BadRequestException("File is required");
      }
      if (!body.companyType) {
        throw new BadRequestException("companyType is required");
      }

      const companyId =
        body.companyId !== undefined ? Number(body.companyId) : undefined;
      const documentTypeLid =
        body.documentTypeLid !== undefined
          ? Number(body.documentTypeLid)
          : undefined;
      const fileSize = formatSize(file.size);
      const result = await this.fileUploadService.uploadFile(
        file,
        body.companyType.toLowerCase(),
        companyId,
        documentTypeLid,
        userId,
        body.opportunityId,
        body.opportunityActivityId,
        body.policyId,
        body.claimId,
        body.claimActivityId,
        body.meetingId,
        fileSize,
        body.endorsementId,
        body.uploadCategory
      );
      return res.status(result.status ?? HttpStatus.OK).json(result);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "FileUploadController",
          method: "uploadFile",
          payload: body,
          messageData: error,
        }),
      });
      return handleErrorResponse(
        error as Error,
        res,
        errorMessages.fileUploadFailed,
        errorMessages.fileForbidden,
        errorMessages.fileNotFound
      );
    }
  }

  @Delete("upload/delete/:fileId")
  async deleteFile(
    @Param("fileId", ParseIntPipe) fileId: number,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "FileUploadController",
        method: "deleteFile",
        payload: { fileId },
        messageData: "method invoked",
      }),
    });
    try {
      if (!fileId) {
        throw new BadRequestException("File ID is required");
      }

      const result = await this.fileUploadService.deleteFile(fileId, userId);
      return {
        status: HttpStatus.OK,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "FileUploadController",
          method: "deleteFile",
          payload: { fileId },
          messageData: error,
        }),
      });

      if (error instanceof NotFoundException) {
        return {
          status: HttpStatus.NOT_FOUND,
          message: error.message,
        };
      }

      if (error instanceof BadRequestException) {
        return {
          status: HttpStatus.BAD_REQUEST,
          message: error.message,
        };
      }

      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error.message || "File deletion failed",
      };
    }
  }
  /**
   * Replaces a file on the server based on the provided ID and file.
   */
  @Put("upload/replace/:documentId")
  @replaceFileSwaggerMetadata()
  @UseInterceptors(FileInterceptor("file"))
  async replaceFileFromServer(
    @Param("documentId") documentId: number,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: CreateFileUploadDto,
    @Req() req: Request
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "FileUploadController",
        method: "replaceFileFromServer",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    try {
      if (!documentId) {
        throw new BadRequestException("File ID is required");
      }

      if (!file) {
        throw new BadRequestException("File is required");
      }

      return this.fileUploadService.replaceFileFromServer(
        documentId,
        file,
        userId,
        body
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "FileUploadController",
          method: "replaceFileFromServer",
          payload: { documentId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          HttpStatus.NOT_FOUND,
          errorMessages.fileReplaceFailed
        );
      }
      return createErrorResponse(
        HttpStatus.BAD_REQUEST,
        error instanceof Error ? error.message : errorMessages.fileReplaceFailed
      );
    }
  }

  @Get(":documentId/download")
  @downloadFileSwaggerMetadata()
  async download(
    @Param("documentId") documentId: bigint,
    @Query("moduleKey") moduleKey: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(req?.headers?.userid as string);
    const headerModuleKey = req?.headers?.["x-module-key"] as string | undefined;
    const requestedModuleKey = moduleKey || headerModuleKey;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "FileUploadController",
        method: "download",
        payload: { documentId, requestedModuleKey },
        messageData: "method invoked",
      }),
    });
    try {
      // Fetch user details for password generation
      const userDetails = await this.fetchUserDetails(userId, req);

      // Download file with password protection
      const result = await this.fileUploadService.downloadWithPasswordProtection(
        documentId,
        userDetails,
        requestedModuleKey
      );

      // Set headers for download
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
          userId,
          status: "success",
          location: "FileUploadController",
          method: "download",
          payload: { documentId, fileName: result.fileName },
          messageData: "File download with password protection completed",
        }),
      });

      // Pipe the stream to the response
      result.stream.pipe(res);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "FileUploadController",
          method: "download",
          payload: { documentId },
          messageData: { error: errorMessage, stack: errorStack },
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

  /**
   * Updates file_size for up to 'count' records where file_size is null by downloading from S3 and updating DB.
   * Accepts a JSON body: { count: number } (required)
   */
  @Post("update-file-size")
  @updateFileSizeSwaggerMetadata()
  async updateFileSize(
    @Body() body: { count: number },
    @Res() res: Response
  ): Promise<void> {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "FileUploadController",
        method: "updateFileSize",
        payload: { count: body.count },
        messageData: "method invoked",
      }),
    });

    try {
      if (!body?.count) {
        throw new BadRequestException("Count is required");
      }
      const result = await this.fileUploadService.updateFileSizesForNullRecords(
        body.count
      );
      res.status(200).json(result);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "FileUploadController",
          method: "updateFileSize",
          payload: { count: body.count },
          messageData: error,
        }),
      });
      throw new BadRequestException(
        error instanceof Error ? error.message : "Failed to update file sizes",
      );
    }
  }

  @Get("file-details")
  @allFileDetailsSwaggerMetadata()
  async getAllFileDetails(
    @Query() query: GetAllFileDetailsDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(req?.headers?.userid as string);
    const { 
      page, 
      limit, 
      organisationId, 
      companyId, 
      companyName, 
      companyTypeLid, 
      entityType, 
      from, 
      to 
    } = query;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "FileUploadController",
        method: "getAllFileDetails",
        payload: { page, limit, organisationId, companyId, companyName, companyTypeLid, entityType, from, to },
        messageData: "method invoked",
      }),
    });
    try {
      const result = await this.fileUploadService.getAllFileDetails(
        page, 
        limit, 
        organisationId, 
        companyId, 
        companyName, 
        companyTypeLid, 
        entityType, 
        from, 
        to
      );
      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: "File details retrieved successfully",
        data: result.data,
        count: result.count,
        totalPages: result.totalPages,
        page,
        limit,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "FileUploadController",
          method: "getAllFileDetails",
          payload: { page, limit, organisationId, companyId, companyName, companyTypeLid, entityType, from, to },
          messageData: error,
        }),
      });
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error instanceof Error ? error.message : "Failed to retrieve file details",
      });
    }
  }

  @Get(":documentId/file-details")
  @fileDetailsSwaggerMetadata()
  async getFileDetails(
    @Param("documentId", ParseIntPipe) documentId: number,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(req?.headers?.userid as string);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "FileUploadController",
        method: "getFileDetails",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    try {
      const data = await this.fileUploadService.getFileDetails(documentId);
      return res.status(HttpStatus.OK).json({
        status: HttpStatus.OK,
        message: "File details retrieved successfully",
        data,
      });
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "FileUploadController",
          method: "getFileDetails",
          payload: { documentId },
          messageData: error,
        }),
      });
      if (error instanceof NotFoundException) {
        return res.status(HttpStatus.NOT_FOUND).json({
          status: HttpStatus.NOT_FOUND,
          message: error.message,
        });
      }
      if (error instanceof BadRequestException) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          status: HttpStatus.BAD_REQUEST,
          message: error.message,
        });
      }
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: error instanceof Error ? error.message : "Failed to retrieve file details",
      });
    }
  }

  @Post("bulk-download")
  async bulkDownload(@Body() dto: BulkDownloadDto, @Res() res: Response) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "FileUploadController",
        method: "bulkDownload",
        payload: {
          documentIds: dto.documentIds,
          count: dto.documentIds.length,
          moduleKey: dto.moduleKey,
        },
        messageData: "method invoked",
      }),
    });
    try {
      // Convert documentIds to bigint array with validation
      let bigintIds: bigint[];
      try {
        bigintIds = dto.documentIds.map((id) => BigInt(id));
      } catch (conversionError) {
        throw new BadRequestException(
          "Invalid documentIds: all values must be valid numbers or numeric strings",
        );
      }

      // Stream ZIP to response (does not return JSON)
      const userId = parseInt((res.req as Request)?.headers?.userid as string);
      const userDetails =
        Number.isFinite(userId) && userId > 0
          ? await this.fetchUserDetails(userId, res.req as Request)
          : null;

      await this.fileUploadService.bulkDownloadAsZip(
        bigintIds,
        res,
        dto.moduleKey,
        userDetails,
      );
    } catch (error) {
      const errForLog =
        error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error;
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "FileUploadController",
          method: "bulkDownload",
          payload: { documentIds: dto.documentIds, moduleKey: dto.moduleKey },
          messageData: errForLog,
        }),
      });

      // If headers already sent (streaming started), can't throw exception
      if (res.headersSent) {
        this.logger.error({
          level: "error",
          message: buildLogMessage({
            traceId: this.traceIdService.traceId,
            status: "failure",
            location: "FileUploadController",
          method: "bulkDownload",
          payload: { documentIds: dto.documentIds, moduleKey: dto.moduleKey },
          messageData:
            "Error occurred after streaming started, ending response",
        }),
      });
        res.end();
        return;
      }

      // Headers not sent yet, can throw exception
      if (error instanceof HttpException) {
        throw error; // preserves real status + message (404/500/etc.)
      }
      throw new InternalServerErrorException(
        "Failed to download documents as ZIP",
      );
    }
  }
}