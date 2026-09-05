import {
  TraceIdService,
  buildLogMessage,
  createLogger,
} from "../../../../service-lib";
import { createResponse } from "../../../../../../libs/service-lib/src/lib/utils/response.utils";
import { serviceNames } from "../../../../service-lib/src/lib/constants";
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import type { ValidationError } from "class-validator";
import {
  ApiBearerAuth,
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import type { Response } from "express";
import type { CreateTemplateDto } from "./dto/create-template.dto";
import type { GetTemplatesDto } from "./dto/get-templates.dto";
import {
  ApprovalHistoryResponseDto,
  TemplateApprovalWorkflowDto,
} from "./dto/template-approval-workflow.dto";
import {
  ValidationResultResponseDto,
  EventTypeResponseDto,
  EventVariablesResponseDto,
} from "./dto/template-variable.dto";
import type { UpdateTemplateDto } from "./dto/update-template.dto";
import { SaveCompanyTemplateOverrideDto, SaveTemplateOverrideDto } from "./dto/template-override.dto";
import { UpdateTemplateStatusDto } from "./dto/template-status.dto";
import { TemplateService } from "./template.service";
import { TemplateVariableService } from "./template-variable.service";
import {
  createTemplateSwaggerMetadata,
  deleteCompanyTemplateOverrideSwaggerMetadata,
  deleteTemplateOverrideSwaggerMetadata,
  deleteTemplateSwaggerMetadata,
  getCompanyTemplateOverridesSummaryMetadata,
  getEffectiveTemplatesForCompanySwaggerMetadata,
  getEffectiveTemplatesSwaggerMetadata,
  getTemplateChangeLogSwaggerMetadata,
  getTemplateOverridesSummaryMetadata,
  getTemplateSwaggerMetadata,
  getTemplatesSwaggerMetadata,
  getWorkflowHistorySwaggerMetadata,
  processWorkflowActionSwaggerMetadata,
  saveCompanyTemplateOverrideSwaggerMetadata,
  saveTemplateOverrideSwaggerMetadata,
  updateTemplateStatusSwaggerMetadata,
  updateTemplateSwaggerMetadata,
} from "./template.swagger";
import {
  TemplateApprovalWorkflowService,
  UserContext,
} from "./template-approval-workflow.service";
import { AuthGuard } from "../../../../auth-service/src/guards/auth.guard";

@ApiTags("Templates")
@ApiBearerAuth("access-token")
@Controller("templates")
@UseGuards(AuthGuard)
export class TemplateController {
  private readonly logger: ReturnType<typeof createLogger>;

  constructor(
    private readonly templateService: TemplateService,
    private readonly traceIdService: TraceIdService,
    private readonly templateWorkflowService: TemplateApprovalWorkflowService,
    private readonly templateVariableService: TemplateVariableService
  ) {
    this.logger = createLogger(
      this.traceIdService,
      serviceNames.NOTIFICATION_SERVICE
    );
  }

  @Post()
  @createTemplateSwaggerMetadata()
  async createTemplate(
    @Body() createTemplateDto: CreateTemplateDto,
    @Res() res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: createTemplateDto,
        location: "TemplateController",
        method: "createTemplate",
      }),
    });

    try {
      const template = await this.templateService.createTemplate(
        createTemplateDto
      );

      this.logger.log({
        level: "info",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "success",
          payload: { templateId: template.id },
          location: "TemplateController",
          method: "createTemplate",
        }),
      });

      return res
        .status(HttpStatus.CREATED)
        .json(
          createResponse(
            HttpStatus.CREATED,
            "Template created successfully",
            template
          )
        );
    } catch (error) {
      const err = error as Error & { status?: number };
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: err.message },
          location: "TemplateController",
          method: "createTemplate",
        }),
      });

      const statusCode = err.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(
            statusCode,
            err.message || "Failed to create template",
            null
          )
        );
    }
  }

   @Get()
   @getTemplatesSwaggerMetadata()
   async getTemplates(
     @Query() query: GetTemplatesDto,
     @Res() res: Response,
   ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: query,
        location: "TemplateController",
        method: "getTemplates",
      }),
    });

    try {
      const result = await this.templateService.getTemplates(query);

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Templates retrieved successfully",
            result
          )
        );
    } catch (error) {
      const err = error as Error & { status?: number };
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: err.message },
          location: "TemplateController",
          method: "getTemplates",
        }),
      });

      const statusCode = err.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(
            statusCode,
            err.message || "Failed to retrieve templates",
            null
          )
        );
    }
  }

  @Put(":id")
  @updateTemplateSwaggerMetadata()
  async updateTemplate(
    @Param("id", ParseIntPipe) id: number,
    @Body() updateTemplateDto: UpdateTemplateDto,
    @Res() res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { templateId: id, updates: updateTemplateDto },
        location: "TemplateController",
        method: "updateTemplate",
      }),
    });

    try {
      const template = await this.templateService.updateTemplate(
        id,
        updateTemplateDto
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Template updated successfully",
            template
          )
        );
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, templateId: id },
          location: "TemplateController",
          method: "updateTemplate",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status ||
        HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(
            statusCode,
            (error as Error).message || "Failed to update template",
            null
          )
        );
    }
  }

  @Delete(":id")
  @deleteTemplateSwaggerMetadata()
  async deleteTemplate(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { templateId: id },
        location: "TemplateController",
        method: "deleteTemplate",
      }),
    });

    try {
      await this.templateService.deleteTemplate(id);

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Template deactivated successfully",
            null
          )
        );
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, templateId: id },
          location: "TemplateController",
          method: "deleteTemplate",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status ||
        HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(
            statusCode,
            (error as Error).message || "Failed to deactivate template",
            null
          )
        );
    }
  }

  // Company/config-scoped override endpoints (Customise Email Templates tab)

  private resolveUserId(req: any, fallback?: number): number {
    return req.user?.userId || parseInt(req.headers?.userid, 10) || fallback || 0;
  }

  @Put(":id/status")
  @updateTemplateStatusSwaggerMetadata()
  async updateTemplateStatus(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateTemplateStatusDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    const userId = this.resolveUserId(req);

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId: id, configId: dto.configId, active: dto.active, userId },
        location: "TemplateController",
        method: "updateTemplateStatus",
      }),
    });

    try {
      const result = await this.templateService.setTemplateStatus(id, dto, userId);

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            dto.active ? "Template enabled successfully" : "Template disabled successfully",
            result
          )
        );
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId: id, configId: dto.configId },
          location: "TemplateController",
          method: "updateTemplateStatus",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(statusCode, (error as Error).message || "Failed to update template status", null)
        );
    }
  }

  @Get("effective")
  @getEffectiveTemplatesSwaggerMetadata()
  async getEffectiveTemplates(
    @Query("configId", ParseIntPipe) configId: number,
    @Query("channelType") channelType: string,
    @Res() res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { configId, channelType },
        location: "TemplateController",
        method: "getEffectiveTemplates",
      }),
    });

    try {
      const result = await this.templateService.getEffectiveTemplates(
        configId,
        channelType || "email"
      );

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Effective templates retrieved successfully", result));
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, configId, channelType },
          location: "TemplateController",
          method: "getEffectiveTemplates",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(
            statusCode,
            (error as Error).message || "Failed to retrieve effective templates",
            null
          )
        );
    }
  }

  @Put(":id/override")
  @saveTemplateOverrideSwaggerMetadata()
  async saveTemplateOverride(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: SaveTemplateOverrideDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    const userId = this.resolveUserId(req);

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId: id, configId: dto.configId, userId },
        location: "TemplateController",
        method: "saveTemplateOverride",
      }),
    });

    try {
      const result = await this.templateService.saveTemplateOverride(id, dto, userId);

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Template override saved successfully", result));
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId: id, configId: dto.configId },
          location: "TemplateController",
          method: "saveTemplateOverride",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(statusCode, (error as Error).message || "Failed to save template override", null)
        );
    }
  }

  @Delete(":id/override")
  @deleteTemplateOverrideSwaggerMetadata()
  async deleteTemplateOverride(
    @Param("id", ParseIntPipe) id: number,
    @Query("configId", ParseIntPipe) configId: number,
    @Req() req: any,
    @Res() res: Response
  ) {
    const userId = this.resolveUserId(req);

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId: id, configId, userId },
        location: "TemplateController",
        method: "deleteTemplateOverride",
      }),
    });

    try {
      const result = await this.templateService.deleteTemplateOverride(id, configId, userId);

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Reverted to default template successfully", result));
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId: id, configId },
          location: "TemplateController",
          method: "deleteTemplateOverride",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(statusCode, (error as Error).message || "Failed to reset template override", null)
        );
    }
  }

  @Get(":id/overrides")
  @getTemplateOverridesSummaryMetadata()
  async getTemplateOverridesSummary(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId: id },
        location: "TemplateController",
        method: "getTemplateOverridesSummary",
      }),
    });

    try {
      const result = await this.templateService.getTemplateOverridesSummary(id);

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Existing customizations retrieved successfully", result));
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId: id },
          location: "TemplateController",
          method: "getTemplateOverridesSummary",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(statusCode, (error as Error).message || "Failed to retrieve existing customizations", null)
        );
    }
  }

  @Get(":id/change-log")
  @getTemplateChangeLogSwaggerMetadata()
  async getTemplateChangeLog(
    @Param("id", ParseIntPipe) id: number,
    @Query("configId") configId: string,
    @Query("companyId") companyId: string,
    @Res() res: Response
  ) {
    const parsedConfigId = configId ? parseInt(configId, 10) : undefined;
    const parsedCompanyId = companyId ? parseInt(companyId, 10) : undefined;

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId: id, configId: parsedConfigId, companyId: parsedCompanyId },
        location: "TemplateController",
        method: "getTemplateChangeLog",
      }),
    });

    try {
      const result = await this.templateService.getTemplateChangeLog(id, parsedConfigId, parsedCompanyId);

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Change log retrieved successfully", result));
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId: id, configId: parsedConfigId, companyId: parsedCompanyId },
          location: "TemplateController",
          method: "getTemplateChangeLog",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(statusCode, (error as Error).message || "Failed to retrieve change log", null)
        );
    }
  }

  // Company-scoped override endpoints (iwork/internal-CRM event types, no
  // domain concept — mirrors the config-scoped endpoints above)

  @Get("company-effective")
  @getEffectiveTemplatesForCompanySwaggerMetadata()
  async getEffectiveTemplatesForCompany(
    @Query("companyId", ParseIntPipe) companyId: number,
    @Query("channelType") channelType: string,
    @Res() res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { companyId, channelType },
        location: "TemplateController",
        method: "getEffectiveTemplatesForCompany",
      }),
    });

    try {
      const result = await this.templateService.getEffectiveTemplatesForCompany(
        companyId,
        channelType || "email"
      );

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Effective templates retrieved successfully", result));
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, companyId, channelType },
          location: "TemplateController",
          method: "getEffectiveTemplatesForCompany",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(
            statusCode,
            (error as Error).message || "Failed to retrieve effective templates",
            null
          )
        );
    }
  }

  @Put(":id/company-override")
  @saveCompanyTemplateOverrideSwaggerMetadata()
  async saveCompanyTemplateOverride(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: SaveCompanyTemplateOverrideDto,
    @Req() req: any,
    @Res() res: Response
  ) {
    const userId = this.resolveUserId(req);

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId: id, companyId: dto.companyId, userId },
        location: "TemplateController",
        method: "saveCompanyTemplateOverride",
      }),
    });

    try {
      const result = await this.templateService.saveCompanyTemplateOverride(id, dto, userId);

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Template override saved successfully", result));
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId: id, companyId: dto.companyId },
          location: "TemplateController",
          method: "saveCompanyTemplateOverride",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(statusCode, (error as Error).message || "Failed to save template override", null)
        );
    }
  }

  @Delete(":id/company-override")
  @deleteCompanyTemplateOverrideSwaggerMetadata()
  async deleteCompanyTemplateOverride(
    @Param("id", ParseIntPipe) id: number,
    @Query("companyId", ParseIntPipe) companyId: number,
    @Req() req: any,
    @Res() res: Response
  ) {
    const userId = this.resolveUserId(req);

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId: id, companyId, userId },
        location: "TemplateController",
        method: "deleteCompanyTemplateOverride",
      }),
    });

    try {
      const result = await this.templateService.deleteCompanyTemplateOverride(id, companyId, userId);

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Reverted to default template successfully", result));
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId: id, companyId },
          location: "TemplateController",
          method: "deleteCompanyTemplateOverride",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(statusCode, (error as Error).message || "Failed to reset template override", null)
        );
    }
  }

  @Get(":id/company-overrides")
  @getCompanyTemplateOverridesSummaryMetadata()
  async getCompanyTemplateOverridesSummary(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { defaultTemplateId: id },
        location: "TemplateController",
        method: "getCompanyTemplateOverridesSummary",
      }),
    });

    try {
      const result = await this.templateService.getCompanyTemplateOverridesSummary(id);

      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Existing customizations retrieved successfully", result));
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: (error as Error).message, defaultTemplateId: id },
          location: "TemplateController",
          method: "getCompanyTemplateOverridesSummary",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(statusCode, (error as Error).message || "Failed to retrieve existing customizations", null)
        );
    }
  }

  // Unified Approval Workflow Endpoints

  @Post(":id/workflow")
  @processWorkflowActionSwaggerMetadata()
  async processWorkflowAction(
    @Param("id", ParseIntPipe) id: number,
    // The global ValidationPipe (service-lib/common-bootstrap.ts) rejects a
    // bad payload here BEFORE this method's own try/catch below ever runs,
    // so it never gets wrapped in createResponse() — and class-validator's
    // default exceptionFactory throws an array of per-field messages, which
    // isn't a readable string for the frontend to toast. This param-scoped
    // override keeps the same validation rules but throws one plain-string
    // BadRequestException instead — still caught by Nest's default
    // exception handling like any other HttpException, no global filter
    // needed.
    @Body(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const message =
          errors
            .flatMap((error) => Object.values(error.constraints || {}))
            .join("; ") || "Invalid workflow action payload";
        return new BadRequestException(message);
      },
    }))
    workflowDto: TemplateApprovalWorkflowDto,
    @Res() res: Response,
    @Req() req: any
  ) {
    const traceId = this.traceIdService.traceId;

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId,
        status: "success",
        payload: { templateId: id, action: workflowDto.action },
        location: "TemplateController",
        method: "processWorkflowAction",
      }),
    });

    try {
      // Extract user context from request (set by auth middleware)
      const user = req.user;
      const userContext: UserContext = {
        userId:
          user?.userId ||
          parseInt(req.headers?.userid) ||
          workflowDto.performedBy,
        roles: user?.roles || [],
        organizationId: user?.organizationId,
      };

      // Extract Authorization header for inter-service calls (required in QA environment)
      const authorizationHeader = req.headers?.authorization;

      const result = await this.templateWorkflowService.processWorkflowAction(
        id,
        workflowDto,
        userContext,
        authorizationHeader
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            `Workflow action '${workflowDto.action}' completed successfully`,
            result
          )
        );
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId,
          status: "failure",
          payload: {
            templateId: id,
            action: workflowDto.action,
            error: (error as Error).message,
          },
          location: "TemplateController",
          method: "processWorkflowAction",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status ||
        HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(
            statusCode,
            (error as Error).message || "Failed to process workflow action",
            null
          )
        );
    }
  }

  @Get(":id/workflow/history")
  @getWorkflowHistorySwaggerMetadata()
  async getWorkflowHistory(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response
  ): Promise<Response<ApprovalHistoryResponseDto[]>> {
    const traceId = this.traceIdService.traceId;

    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId,
        status: "success",
        payload: { templateId: id },
        location: "TemplateController",
        method: "getWorkflowHistory",
      }),
    });

    try {
      const history = await this.templateWorkflowService.getApprovalHistory(id);

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Workflow history retrieved successfully",
            history
          )
        );
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId,
          status: "failure",
          payload: { templateId: id, error: (error as Error).message },
          location: "TemplateController",
          method: "getWorkflowHistory",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status ||
        HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(
            statusCode,
            (error as Error).message || "Failed to get workflow history",
            null
          )
        );
    }
  }

  // Template Variable Endpoints

  @Get("event-types")
  @ApiOperation({
    summary: "Get Available Event Types",
    description:
      "Retrieves all available notification event types for template variable mapping",
  })
  @ApiResponse({
    status: 200,
    description: "Event types retrieved successfully",
    type: [EventTypeResponseDto],
  })
  async getEventTypes(@Res() res: Response) {
    const traceId = this.traceIdService.traceId;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId,
        status: "success",
        payload: {},
        location: "TemplateController",
        method: "getEventTypes",
      }),
    });

    try {
      const eventTypes = await this.templateVariableService.getEventTypes();

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Event types retrieved successfully",
            eventTypes
          )
        );
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId,
          status: "failure",
          payload: { error: (error as Error).message },
          location: "TemplateController",
          method: "getEventTypes",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status ||
        HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(
            statusCode,
            (error as Error).message || "Failed to retrieve event types",
            null
          )
        );
    }
  }

  @Get("event-types/:eventTypeId/variables")
  @ApiOperation({
    summary: "Get Variables by Event Type",
    description:
      "Retrieves all template variables available for a specific event type",
  })
  @ApiParam({
    name: "eventTypeId",
    type: "number",
    description: "Event type ID",
    example: 1,
  })
  @ApiQuery({
    name: "requiredOnly",
    required: false,
    type: "boolean",
    description: "Return only required variables",
    example: false,
  })
  @ApiResponse({
    status: 200,
    description: "Event type variables retrieved successfully",
    type: EventVariablesResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Event type not found",
  })
  async getVariablesByEventType(
    @Param("eventTypeId", ParseIntPipe) eventTypeId: number,
    @Query("requiredOnly") requiredOnly: string,
    @Res() res: Response
  ) {
    const traceId = this.traceIdService.traceId;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId,
        status: "success",
        payload: { eventTypeId, requiredOnly },
        location: "TemplateController",
        method: "getVariablesByEventType",
      }),
    });

    try {
      const requiredOnlyBool = requiredOnly === "true";
      const result = await this.templateVariableService.getVariablesByEventType(
        eventTypeId,
        requiredOnlyBool
      );

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Event type variables retrieved successfully",
            result
          )
        );
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId,
          status: "failure",
          payload: { error: (error as Error).message, eventTypeId },
          location: "TemplateController",
          method: "getVariablesByEventType",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status ||
        HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(
            statusCode,
            (error as Error).message ||
              "Failed to retrieve event type variables",
            null
          )
        );
    }
  }

  @Post("variables/validate-for-event-type")
  @ApiOperation({
    summary: "Validate Variables for Event Type",
    description:
      "Validates template variables against a specific event type requirements",
  })
  @ApiBody({
    description: "Template content and event type for validation",
    schema: {
      type: "object",
      properties: {
        templateContent: {
          type: "string",
          description: "Template content with variables",
          example: "Hello {{firstName}}, your {{policyNumber}} is ready.",
        },
        eventTypeId: {
          type: "number",
          description: "Event type ID to validate against",
          example: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Template validation completed",
    type: ValidationResultResponseDto,
  })
  async validateVariablesForEventType(
    @Body()
    body: {
      templateContent: string;
      templateSubject?: string;
      eventTypeId: number;
    },
    @Res() res: Response
  ) {
    const traceId = this.traceIdService.traceId;
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId,
        status: "success",
        payload: { eventTypeId: body.eventTypeId },
        location: "TemplateController",
        method: "validateVariablesForEventType",
      }),
    });

    try {
      const validation =
        await this.templateVariableService.validateVariablesForEventType(
          body.templateContent,
          body.eventTypeId,
          body.templateSubject
        );

      const statusCode = validation.isValid
        ? HttpStatus.OK
        : HttpStatus.BAD_REQUEST;
      const message = validation.isValid
        ? "Template validation completed successfully"
        : "Template validation failed due to parameter mismatch.";

      return res
        .status(statusCode)
        .json(createResponse(statusCode, message, validation));
    } catch (error) {
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId,
          status: "failure",
          payload: { error: (error as Error).message },
          location: "TemplateController",
          method: "validateVariablesForEventType",
        }),
      });

      const statusCode =
        (error as Error & { status?: number }).status ||
        HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(
            statusCode,
            (error as Error).message || "Failed to validate template variables",
            null
          )
        );
    }
  }

  @Post("check-event-conflict")
  @ApiOperation({
    summary: "Check Event Type Conflict",
    description:
      "Checks if another template already has the same event type and channel combination",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        templateId: { type: "number", description: "Current template ID" },
        eventTypeId: { type: "number", description: "Event type ID to check" },
        channelTypeKey: {
          type: "string",
          description: "Channel type key (e.g. sms, email, in-app, whats-app)",
        },
        configId: {
          type: "number",
          description:
            "Omit when checking a default template; pass the target configId when checking a config-scoped override, so it only conflicts with another row in that same scope",
        },
      },
      required: ["templateId", "eventTypeId", "channelTypeKey"],
    },
  })
  async checkEventConflict(
    @Body()
    body: { templateId: number; eventTypeId: number; channelTypeKey: string; configId?: number },
    @Res() res: Response
  ) {
    try {
      const result = await this.templateService.checkEventConflict(
        body.templateId,
        body.eventTypeId,
        body.channelTypeKey,
        body.configId
      );
      return res
        .status(HttpStatus.OK)
        .json(createResponse(HttpStatus.OK, "Conflict check complete", result));
    } catch (error) {
      const statusCode =
        (error as Error & { status?: number }).status ||
        HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(
            statusCode,
            (error as Error).message || "Failed to check event conflict",
            null
          )
        );
    }
  }

  @Get(":id")
  @getTemplateSwaggerMetadata()
  async getTemplate(
    @Param("id", ParseIntPipe) id: number,
    @Res() res: Response
  ) {
    this.logger.log({
      level: "info",
      message: buildLogMessage({
        traceId: this.traceIdService.traceId,
        status: "success",
        payload: { templateId: id },
        location: "TemplateController",
        method: "getTemplate",
      }),
    });

    try {
      const template = await this.templateService.getTemplate(id);

      return res
        .status(HttpStatus.OK)
        .json(
          createResponse(
            HttpStatus.OK,
            "Template retrieved successfully",
            template
          )
        );
    } catch (error) {
      const err = error as Error & { status?: number };
      this.logger.log({
        level: "error",
        message: buildLogMessage({
          traceId: this.traceIdService.traceId,
          status: "failure",
          payload: { error: err.message, templateId: id },
          location: "TemplateController",
          method: "getTemplate",
        }),
      });

      const statusCode = err.status || HttpStatus.INTERNAL_SERVER_ERROR;
      return res
        .status(statusCode)
        .json(
          createResponse(
            statusCode,
            err.message || "Failed to retrieve template",
            null
          )
        );
    }
  }
}
