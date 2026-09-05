import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { successMessage } from "../../../../../../libs/service-lib/src/lib/messages";

export const generateReportSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Generate report with filters and pagination",
      description:
        "Generate a report with custom filters, pagination, and sorting options. Returns paginated report data based on the specified report type and parameters.",
    }),
    ApiParam({
      name: "report",
      description:
        "Report type identifier (e.g., 'user_activity', 'policy_summary', 'claims_report')",
      type: String,
      example: "user_activity",
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number for pagination",
      example: 1,
    }),
    ApiQuery({
      name: "limit",
      required: false,
      type: Number,
      description: "Number of records per page",
      example: 10,
    }),
    ApiQuery({
      name: "sort",
      required: false,
      type: String,
      description: "Sort field and order (e.g., 'createdAt:desc', 'name:asc')",
      example: "createdAt:desc",
    }),
    ApiBody({
      description:
        "Report generation filters and parameters. Structure varies by report type.",
      schema: {
        type: "object",
        additionalProperties: true,
      },
    }),
    ApiResponse({
      status: 201,
      description: "Report generated successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: {
            type: "number",
            example: 201,
          },
          message: {
            type: "string",
            example: successMessage.reportUserActivityGeneratedSuccessfully,
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: true,
                },
              },
              count: {
                type: "number",
                example: 250,
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to generate report",
    }),
    ApiResponse({
      status: 404,
      description: "Report not found",
    }),
  );

export const downloadReportSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Download report as CSV",
      description:
        "Download a full (un-paginated) report as a CSV file. Password protection is applied when enabled via environment/module config.",
    }),
    ApiParam({
      name: "report",
      description: "Report type identifier (e.g., 'cd_account_details', 'cd_transactions')",
      type: String,
      example: "cd_account_details",
    }),
    ApiBody({
      description: "Report filter parameters. Structure varies by report type.",
      schema: {
        type: "object",
        additionalProperties: true,
      },
    }),
    ApiResponse({
      status: 201,
      description: "File download — CSV (or ZIP if password-protected)",
      content: {
        "text/csv": { schema: { type: "string", format: "binary" } },
        "application/zip": { schema: { type: "string", format: "binary" } },
      },
    }),
    ApiResponse({ status: 400, description: "Failed to download report" }),
    ApiResponse({ status: 404, description: "Report not found" }),
  );
