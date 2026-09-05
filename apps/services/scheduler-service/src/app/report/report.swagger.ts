import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { GenerateReportQueryDto } from "./dto/generate-report-query.dto";
import { successMessage } from "../../../../../../libs/service-lib/src/lib/messages";
export const getReportsListSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get list of available reports",
      description:
        "Retrieve the complete list of all available report types in the system",
    }),
    ApiResponse({
      status: 200,
      description: "Reports list retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Report generated successfully" },
          data: {
            type: "object",
            properties: {
              reportList: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 1 },
                    name: { type: "string", example: "user-activity" },
                    label: { type: "string", example: "User Activity" },
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Failed to retrieve reports list",
    }),
  );

export const getReportDetailsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get report details by ID",
      description:
        "Retrieve detailed information about a specific report including its configuration and metadata",
    }),
    ApiParam({
      name: "reportId",
      description: "Unique identifier of the report to retrieve",
      type: String,
      example: "1",
    }),
    ApiResponse({
      status: 200,
      description: "Report details retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Report generated successfully" },
          data: {
            type: "object",
            properties: {
              id: { type: "string", example: "user_activity" },
              name: { type: "string", example: "User Activity Report" },
              description: {
                type: "string",
                example: "Detailed user activity tracking",
              },
              fields: {
                type: "array",
                items: { type: "string" },
              },
              filters: { type: "object" },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Report not found or no data available",
    }),
  );

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
        properties: {
          startDate: {
            type: "string",
            format: "date",
            description: "Start date for date range filters",
            example: "2025-01-01",
          },
          endDate: {
            type: "string",
            format: "date",
            description: "End date for date range filters",
            example: "2025-12-31",
          },
          filters: {
            type: "object",
            description: "Additional filters specific to the report type",
            additionalProperties: true,
          },
        },
      },
      examples: {
        userActivity: {
          summary: "User Activity Report",
          value: {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            userId: 123,
          },
        },
        policySummary: {
          summary: "Policy Summary Report",
          value: {
            policyId: 555297,
            status: "active",
          },
        },
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
                  example: {
                    userId: 123,
                    userName: "John Doe",
                    activityCount: 45,
                  },
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
      description:
        "Bad Request - Invalid parameters or report generation failed",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    }),
  );

export const downloadReportSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Download report as CSV file",
      description:
        "Generate and download a complete report in CSV format. Exports all matching records without pagination limits.",
    }),
    ApiParam({
      name: "report",
      description:
        "Report type identifier to download (e.g., 'user_activity', 'policy_summary', 'claims_report')",
      type: String,
      example: "user_activity",
    }),
    ApiBody({
      description:
        "Report download filters. Structure varies by report type. All matching records will be exported.",
      schema: {
        type: "object",
        properties: {
          startDate: {
            type: "string",
            format: "date",
            description: "Start date for date range filters",
            example: "2025-01-01",
          },
          endDate: {
            type: "string",
            format: "date",
            description: "End date for date range filters",
            example: "2025-12-31",
          },
          filters: {
            type: "object",
            description: "Additional filters specific to the report type",
            additionalProperties: true,
          },
        },
      },
      examples: {
        userActivity: {
          summary: "User Activity Report Download",
          value: {
            startDate: "2025-01-01",
            endDate: "2025-01-31",
            userId: 123,
          },
        },
        policySummary: {
          summary: "Policy Summary Report Download",
          value: {
            policyId: 555297,
            status: "active",
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "CSV file generated successfully",
      content: {
        "text/csv": {
          schema: {
            type: "string",
            example:
              "userId,userName,activityCount\n123,John Doe,45\n124,Jane Smith,32",
          },
        },
      },
      headers: {
        "Content-Type": {
          description: "CSV MIME type",
          schema: {
            type: "string",
            example: "text/csv",
          },
        },
        "Content-Disposition": {
          description: "Attachment filename",
          schema: {
            type: "string",
            example: "attachment; filename=user_activity.csv",
          },
        },
      },
    }),

    ApiResponse({
      status: 400,
      description:
        "Bad Request - Invalid parameters or report generation failed",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    }),
  );
