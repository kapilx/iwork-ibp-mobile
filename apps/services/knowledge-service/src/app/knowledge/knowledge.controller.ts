import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Get,
  Query,
  Put,
  Delete,
  Req,
  Param,
  Res,
  BadRequestException,
  NotFoundException,
  HttpStatus,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { KnowledgeService } from "./knowledge.service";
import { CreateKnowledgeFileDto } from "./dto/create-knowledge-file.dto";
import { CreateKnowledgeUrlDto } from "./dto/create-knowledge-url.dto";
import { UpdateKnowledgeDto } from "./dto/update-knowledge.dto";
import { TraceIdService } from "../../../../service-lib/src/lib/trace-id.service";
import { createLogger } from "../../../../service-lib/src/lib/logger";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import { buildLogMessage } from "../../../../service-lib/src/lib/utils/logger.util";
import { createResponse } from "../../../../service-lib/src/lib/utils/response.utils";
import type { Request, Response } from "express";
import { TraceHttpService } from "../../../../service-lib/src/lib/trace-http.service";
import { ENV } from "../../../../service-lib/src/lib/environment";
import {
  uploadFileSwaggerMetadata,
  createUrlSwaggerMetadata,
  replaceFileSwaggerMetadata,
  replaceUrlSwaggerMetadata,
  updateMetaSwaggerMetadata,
  deleteDocumentSwaggerMetadata,
  listDocumentsSwaggerMetadata,
  listCatalogSwaggerMetadata,
  downloadDocumentSwaggerMetadata,
  incrementAccessSwaggerMetadata,
} from "./knowledge.swagger";

@ApiTags("Knowledge Management")
@Controller("knowledge")
export class KnowledgeController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly service: KnowledgeService,
    private readonly traceIdService: TraceIdService,
    private readonly traceHttpService: TraceHttpService,
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.KNOWLEDGE_SERVICE ?? serviceNames.ORG_SERVICE,
    );
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
      // const endpoint = `${authServiceUrl}/iirm/auth-service/user-details`;
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
          authorization: req.headers.authorization || '',
          cookie: req.headers.cookie || '',
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
          organisationId: response.data?.data?.organisationId,
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
          location: "KnowledgeController",
          method: "fetchUserDetails",
          messageData: `Failed to fetch user details: ${error.message}`,
        }),
      });
      return null;
    }
  }

  @Post("file")
  @uploadFileSwaggerMetadata()
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: CreateKnowledgeFileDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "KnowledgeController",
        method: "uploadFile",
        messageData: "method invoked",
      }),
    });
    try {
      const result = await this.service.createFile(file, dto, userId);
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, result.message, result.data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "KnowledgeController",
          method: "uploadFile",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  @Post("url")
  @createUrlSwaggerMetadata()
  async createUrl(
    @Body() dto: CreateKnowledgeUrlDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "KnowledgeController",
        method: "createUrl",
        messageData: "method invoked",
      }),
    });
    try {
      const result = await this.service.createUrl(dto, userId);
      return res
        .status(HttpStatus.CREATED)
        .json(createResponse(HttpStatus.CREATED, result.message, result.data));
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "KnowledgeController",
          method: "createUrl",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  @Put("file/:documentId")
  @replaceFileSwaggerMetadata()
  @UseInterceptors(FileInterceptor("file"))
  async replaceFile(
    @UploadedFile() file: Express.Multer.File,
    @Param("documentId") documentId: bigint,
    @Body() dto: any,
    @Req() req: Request,
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "KnowledgeController",
        method: "replaceFile",
        messageData: "method invoked",
      }),
    });
    try {
      return await this.service.replaceFile(documentId, file, userId, dto);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "KnowledgeController",
          method: "replaceFile",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  @Put(":documentId/url")
  @replaceUrlSwaggerMetadata()
  replaceUrl(
    @Body("documentId") documentId: bigint,
    @Body("url") url: string,
    @Body() dto: UpdateKnowledgeDto,
    @Req() req: Request,
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "KnowledgeController",
        method: "replaceUrl",
        messageData: "method invoked",
      }),
    });
    try {
      return this.service.replaceUrl(+documentId, url, userId, dto);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "KnowledgeController",
          method: "replaceUrl",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  @Put(":documentId")
  @updateMetaSwaggerMetadata()
  async updateMeta(
    @Body("documentId") documentId: bigint,
    @Body() dto: UpdateKnowledgeDto,
    @Req() req: Request,
  ) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "KnowledgeController",
        method: "updateMeta",
        messageData: "method invoked",
      }),
    });
    try {
      return await this.service.updateMetadata(documentId, dto, userId);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "KnowledgeController",
          method: "updateMeta",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  @Delete(":documentId")
  @deleteDocumentSwaggerMetadata()
  async remove(@Param("documentId") documentId: bigint, @Req() req: Request) {
    const userId = parseInt(req?.headers?.userid);
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        userId,
        status: "success",
        location: "KnowledgeController",
        method: "remove",
        messageData: "method invoked",
      }),
    });
    try {
      return await this.service.delete(documentId, userId);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "KnowledgeController",
          method: "remove",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  @Get()
  @listDocumentsSwaggerMetadata()
  list(
    @Query("categoryId") categoryId?: number,
    @Query("page") page = "1",
    @Query("limit") limit = "10",
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeController",
        method: "list",
        payload: { categoryId, page, limit },
        messageData: "method invoked",
      }),
    });
    try {
      return this.service.list(
        categoryId ? +categoryId : undefined,
        +page,
        +limit,
      );
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "KnowledgeController",
          method: "list",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  @Get("catalog")
  @listCatalogSwaggerMetadata()
  listCatalog(@Query("start") start = "0", @Query("limit") limit = "10") {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeController",
        method: "listCatalog",
        payload: { start, limit },
        messageData: "method invoked",
      }),
    });
    try {
      return this.service.listForAllCategories(+start, +limit);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "KnowledgeController",
          method: "listCatalog",
          messageData: error,
        }),
      });
      throw error;
    }
  }

  @Get(":documentId/download")
  @downloadDocumentSwaggerMetadata()
  async download(
    @Param("documentId") documentId: bigint,
    @Query("countryId") countryId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const userId = parseInt(req?.headers?.userid as string);
    console.log('[knowledge controller] country ID', countryId);
    const parsedCountryId = countryId ? parseInt(countryId, 10) : undefined;
    try {
      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "KnowledgeController",
          method: "download",
          payload: { documentId },
          messageData: "method invoked",
        }),
      });

      // Fetch user details for password generation
      const userDetails = await this.fetchUserDetails(userId, req);

      // Download file with password protection
      const result = await this.service.downloadWithPasswordProtection(
        documentId,
        userDetails,
        parsedCountryId ?? userDetails?.organisationId, // Use organisationId from user details if countryId query param is not provided
      );

      // Set headers for download
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

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "success",
          location: "KnowledgeController",
          method: "download",
          payload: { documentId, fileName: result.fileName },
          messageData: "File download with password protection completed",
        }),
      });

      // Pipe the stream to the response
      result.stream.pipe(res);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          userId,
          status: "failure",
          location: "KnowledgeController",
          method: "download",
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

  @Post(":documentId/access")
  @incrementAccessSwaggerMetadata()
  async incrementAccess(@Param("documentId") documentId: number) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        location: "KnowledgeController",
        method: "incrementAccess",
        payload: { documentId },
        messageData: "method invoked",
      }),
    });
    try {
      return await this.service.incrementAccess(documentId);
    } catch (error) {
      this.logger.error({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          location: "KnowledgeController",
          method: "incrementAccess",
          payload: { documentId },
          messageData: error,
        }),
      });
      throw error;
    }
  }
}
