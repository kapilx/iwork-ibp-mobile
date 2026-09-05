import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { CreateTemplateDto } from "./dto/create-template.dto";
import { GetTemplatesDto } from "./dto/get-templates.dto";
import {
  PaginatedTemplateResponseDto,
  TemplateResponseDto,
} from "./dto/template-response.dto";
import {
  ApprovalHistoryResponseDto,
  TemplateApprovalWorkflowDto,
} from "./dto/template-approval-workflow.dto";
import {
  ApprovalStatusEnum,
  TemplateStatusEnum,
} from "../../../../service-lib/src/lib/constants";
import { UpdateTemplateDto } from "./dto/update-template.dto";
import {
  EffectiveTemplateResponseDto,
  SaveCompanyTemplateOverrideDto,
  SaveTemplateOverrideDto,
  TemplateChangeLogEntryResponseDto,
  TemplateCompanyOverrideSummaryResponseDto,
  TemplateOverrideSummaryResponseDto,
} from "./dto/template-override.dto";
import {
  TemplateStatusResponseDto,
  UpdateTemplateStatusDto,
} from "./dto/template-status.dto";

// Swagger metadata for POST /templates endpoint
export const createTemplateSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateTemplateDto, TemplateResponseDto),
    ApiOperation({
      summary: "Create Template",
      description:
        "Creates a new template for multi-channel notifications with initial draft status.",
    }),
    ApiBody({
      description: "Template creation payload",
      schema: {
        $ref: getSchemaPath(CreateTemplateDto),
      },
    }),
    ApiResponse({
      status: 201,
      description: "Template created successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: {
            type: "number",
            example: 201,
          },
          message: {
            type: "string",
            example: "Template created successfully",
          },
          data: {
            $ref: getSchemaPath(TemplateResponseDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad request - validation errors",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Subject is required for email templates",
          },
          data: { type: "null" },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 401 },
          message: { type: "string", example: "Unauthorized" },
          data: { type: "null" },
        },
      },
    })
  );

// Swagger metadata for GET /templates/:id endpoint
export const getTemplateSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(TemplateResponseDto),
    ApiOperation({
      summary: "Get Template",
      description:
        "Retrieves a specific template by ID with all details including approval status.",
    }),
    ApiParam({
      name: "id",
      description: "Template ID",
      type: "number",
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "Template retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Template retrieved successfully",
          },
          data: { $ref: getSchemaPath(TemplateResponseDto) },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Template not found",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: "Template with ID 1 not found" },
          data: { type: "null" },
        },
      },
    })
  );

// Swagger metadata for GET /templates endpoint
export const getTemplatesSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(GetTemplatesDto, PaginatedTemplateResponseDto),
    ApiOperation({
      summary: "Get Templates",
      description:
        "Retrieves templates with pagination, filtering, and search capabilities.",
    }),
    ApiQuery({ name: "page", required: false, type: "number", example: 1 }),
    ApiQuery({ name: "limit", required: false, type: "number", example: 10 }),
    ApiQuery({
      name: "search",
      required: false,
      type: "string",
      example: "welcome",
    }),
    ApiQuery({
      name: "channelTypeId",
      required: false,
      type: "number",
      example: 1,
    }),
    ApiQuery({
      name: "approvalStatus",
      required: false,
      enum: ApprovalStatusEnum,
    }),
    ApiQuery({ name: "status", required: false, enum: TemplateStatusEnum }),
    ApiQuery({
      name: "organizationId",
      required: false,
      type: "number",
      example: 101,
    }),
    ApiQuery({
      name: "createdBy",
      required: false,
      type: "number",
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "Templates retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Templates retrieved successfully",
          },
          data: { $ref: getSchemaPath(PaginatedTemplateResponseDto) },
        },
      },
    })
  );

// Swagger metadata for PUT /templates/:id endpoint
export const updateTemplateSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdateTemplateDto, TemplateResponseDto),
    ApiOperation({
      summary: "Update Template",
      description:
        "Updates an existing template. Template must not be locked during approval process.",
    }),
    ApiParam({
      name: "id",
      description: "Template ID",
      type: "number",
      example: 1,
    }),
    ApiBody({
      description: "Template update payload",
      schema: {
        $ref: getSchemaPath(UpdateTemplateDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: "Template updated successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Template updated successfully" },
          data: { $ref: getSchemaPath(TemplateResponseDto) },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad request - template locked or validation error",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example:
              "Template is locked and cannot be edited during approval process",
          },
          data: { type: "null" },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Template not found",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: "Template with ID 1 not found" },
          data: { type: "null" },
        },
      },
    })
  );

// Swagger metadata for DELETE /templates/:id endpoint
export const deleteTemplateSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Deactivate Template",
      description:
        "Soft deletes a template by setting its active status to inactive. Approval history is preserved.",
    }),
    ApiParam({
      name: "id",
      description: "Template ID",
      type: "number",
      example: 1,
    }),
    ApiResponse({
      status: 200,
      description: "Template deactivated successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Template deactivated successfully",
          },
          data: { type: "null" },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Template is already inactive",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Template with ID 1 is already inactive",
          },
          data: { type: "null" },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Template not found",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: "Template with ID 1 not found" },
          data: { type: "null" },
        },
      },
    })
  );

// Unified Workflow Swagger Metadata

export function processWorkflowActionSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Process Unified Workflow Action",
      description:
        "Execute a workflow action on a template (submit, approve, reject, withdraw, revise). This unified endpoint handles all approval workflow operations with proper state validation and role-based authorization.",
      operationId: "processWorkflowAction",
    }),
    ApiParam({
      name: "id",
      description: "Template ID",
      type: "number",
      example: 1,
    }),
    ApiBody({
      description: "Workflow action details",
      type: TemplateApprovalWorkflowDto,
    }),
    ApiOkResponse({
      description: "Workflow action completed successfully",
    }),
    ApiBadRequestResponse({
      description: "Invalid workflow action or state transition",
    }),
    ApiForbiddenResponse({
      description: "Insufficient permissions for workflow action",
    })
  );
}

export function getWorkflowHistorySwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get Workflow History",
      description: "Retrieve complete approval history for a template.",
    }),
    ApiParam({
      name: "id",
      description: "Template ID",
      type: "number",
      example: 1,
    }),
    ApiOkResponse({
      description: "Workflow history retrieved successfully",
      type: [ApprovalHistoryResponseDto],
    })
  );
}

// Company/config-scoped override endpoints (Customise Email Templates tab) —
// see docs/IBP-Email-Notification-Company-Templates/TRD.md.

export function getEffectiveTemplatesSwaggerMetadata() {
  return applyDecorators(
    ApiExtraModels(EffectiveTemplateResponseDto),
    ApiOperation({
      summary: "Get Effective Templates For A Config",
      description:
        "For a given company_portal_configuration (configId), returns each default template's " +
        "effective content — that config's own override where one exists, else the shared default.",
    }),
    ApiQuery({ name: "configId", type: "number", required: true }),
    ApiQuery({ name: "channelType", type: "string", required: false, example: "email" }),
    ApiOkResponse({
      description: "Effective templates retrieved successfully",
      type: [EffectiveTemplateResponseDto],
    })
  );
}

export function updateTemplateStatusSwaggerMetadata() {
  return applyDecorators(
    ApiExtraModels(UpdateTemplateStatusDto, TemplateStatusResponseDto),
    ApiOperation({
      summary: "Disable Or Enable A Template",
      description:
        "Flips activeStatusLid on the shared default (configId/companyId both omitted), a specific " +
        "company/domain override (configId given), or a company-wide override (companyId given), " +
        "without touching content or approval status. A disabled row is excluded at send time — " +
        "recipients stop receiving this email for that scope.",
    }),
    ApiParam({ name: "id", type: "number", description: "Default template's ID" }),
    ApiBody({
      description: "Desired active state and optional target config",
      schema: { $ref: getSchemaPath(UpdateTemplateStatusDto) },
    }),
    ApiOkResponse({
      description: "Template status updated successfully",
      type: TemplateStatusResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: "Template not found, or no override exists for the given configId",
    })
  );
}

export function saveTemplateOverrideSwaggerMetadata() {
  return applyDecorators(
    ApiExtraModels(SaveTemplateOverrideDto, EffectiveTemplateResponseDto),
    ApiOperation({
      summary: "Save A Config-Scoped Template Override",
      description:
        "Creates or updates the override scoped to configId for this default template. " +
        "Never mutates the shared default row.",
    }),
    ApiParam({ name: "id", type: "number", description: "Default template's ID" }),
    ApiBody({
      description: "Override content and target configId",
      schema: { $ref: getSchemaPath(SaveTemplateOverrideDto) },
    }),
    ApiOkResponse({
      description: "Template override saved successfully",
      type: EffectiveTemplateResponseDto,
    })
  );
}

export function deleteTemplateOverrideSwaggerMetadata() {
  return applyDecorators(
    ApiExtraModels(EffectiveTemplateResponseDto),
    ApiOperation({
      summary: "Reset A Config To The Default Template",
      description: "Deletes configId's override for this default template, reverting to the shared default.",
    }),
    ApiParam({ name: "id", type: "number", description: "Default template's ID" }),
    ApiQuery({ name: "configId", type: "number", required: true }),
    ApiOkResponse({
      description: "Reverted to default template successfully",
      type: EffectiveTemplateResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: "No customization exists for this template/config to reset",
    })
  );
}

export function getTemplateOverridesSummaryMetadata() {
  return applyDecorators(
    ApiExtraModels(TemplateOverrideSummaryResponseDto),
    ApiOperation({
      summary: "Get Existing Customizations For A Template",
      description:
        "Lists every company/domain that already has its own override of this default template — " +
        "powers Template Management's 'Customise' drill-down detail view (see PRD/TRD §3.3, §5).",
    }),
    ApiParam({ name: "id", type: "number", description: "Default template's ID" }),
    ApiOkResponse({
      description: "Existing customizations retrieved successfully",
      type: [TemplateOverrideSummaryResponseDto],
    })
  );
}

export function getTemplateChangeLogSwaggerMetadata() {
  return applyDecorators(
    ApiExtraModels(TemplateChangeLogEntryResponseDto),
    ApiOperation({
      summary: "Get Content-Change History",
      description:
        "Pass configId for that config's override history, companyId for a company-wide override's " +
        "history, or omit both to get the shared default's own edit history. Separate from the " +
        "approval-workflow history endpoint.",
    }),
    ApiParam({ name: "id", type: "number", description: "Default template's ID" }),
    ApiQuery({ name: "configId", type: "number", required: false }),
    ApiQuery({ name: "companyId", type: "number", required: false }),
    ApiOkResponse({
      description: "Change log retrieved successfully",
      type: [TemplateChangeLogEntryResponseDto],
    })
  );
}

export function getEffectiveTemplatesForCompanySwaggerMetadata() {
  return applyDecorators(
    ApiExtraModels(EffectiveTemplateResponseDto),
    ApiOperation({
      summary: "Get Effective Templates For A Company",
      description:
        "Same idea as GET /templates/effective, scoped by companyId instead of configId — for " +
        "iwork/internal-CRM event types with no domain concept (anything NOT in " +
        "IBP_EMAIL_TEMPLATE_EVENT_TYPES).",
    }),
    ApiQuery({ name: "companyId", type: "number", required: true }),
    ApiQuery({ name: "channelType", type: "string", required: false, example: "email" }),
    ApiOkResponse({
      description: "Effective templates retrieved successfully",
      type: [EffectiveTemplateResponseDto],
    })
  );
}

export function saveCompanyTemplateOverrideSwaggerMetadata() {
  return applyDecorators(
    ApiExtraModels(SaveCompanyTemplateOverrideDto, EffectiveTemplateResponseDto),
    ApiOperation({
      summary: "Save A Company-Scoped Template Override",
      description:
        "Creates or updates the company-wide override for this default template. Never mutates " +
        "the shared default row. For iwork/internal-CRM event types only.",
    }),
    ApiParam({ name: "id", type: "number", description: "Default template's ID" }),
    ApiBody({
      description: "Override content and target companyId",
      schema: { $ref: getSchemaPath(SaveCompanyTemplateOverrideDto) },
    }),
    ApiOkResponse({
      description: "Template override saved successfully",
      type: EffectiveTemplateResponseDto,
    })
  );
}

export function deleteCompanyTemplateOverrideSwaggerMetadata() {
  return applyDecorators(
    ApiExtraModels(EffectiveTemplateResponseDto),
    ApiOperation({
      summary: "Reset A Company To The Default Template",
      description: "Deletes companyId's override for this default template, reverting to the shared default.",
    }),
    ApiParam({ name: "id", type: "number", description: "Default template's ID" }),
    ApiQuery({ name: "companyId", type: "number", required: true }),
    ApiOkResponse({
      description: "Reverted to default template successfully",
      type: EffectiveTemplateResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: "No customization exists for this template/company to reset",
    })
  );
}

export function getCompanyTemplateOverridesSummaryMetadata() {
  return applyDecorators(
    ApiExtraModels(TemplateCompanyOverrideSummaryResponseDto),
    ApiOperation({
      summary: "Get Existing Company-Wide Customizations For A Template",
      description:
        "Lists every company that already has its own company-wide override of this default " +
        "template (iwork/internal-CRM event types only).",
    }),
    ApiParam({ name: "id", type: "number", description: "Default template's ID" }),
    ApiOkResponse({
      description: "Existing customizations retrieved successfully",
      type: [TemplateCompanyOverrideSummaryResponseDto],
    })
  );
}
