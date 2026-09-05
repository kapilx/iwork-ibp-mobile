import { applyDecorators } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { successMessage, errorMessages } from "../../../../../../libs/service-lib/src/lib/messages";

// Swagger metadata for POST /document/excel/broking_slip_activity endpoint
export const generateBrokingSlipExcelSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Generate Broking Slip Excel",
      description:
        "Generates a broking slip Excel file based on versioned policy data and returns the file download URL.",
    }),

    ApiBody({
      description: "Broking slip Excel generation payload",
      required: true,
      schema: {
        type: "object",
        required: ["fileName", "data"],
        properties: {
          fileName: {
            type: "string",
            example: "broking_slip_activity_2024",
            description: "Name of the Excel file to be generated",
          },

          data: {
            type: "array",
            description: "List of version sheets to be rendered as Excel sheets",
            items: {
              type: "object",
              required: ["versionName", "policyType", "organisationName", "formData"],
              properties: {
                versionName: {
                  type: "string",
                  example: "Version 1",
                },
                policyType: {
                  type: "string",
                  example: "Group Health Insurance",
                },
                organisationName: {
                  type: "string",
                  example: "ABC Corporation",
                },
                formData: {
                  type: "object",
                  required: [
                    "generalData",
                    "expiringPolicyDetails",
                    "coversConfig",
                    "otherTermsAndConditions",
                    "disclaimer",
                  ],
                  properties: {
                    generalData: {
                      type: "object",
                      description: "General policy related data",
                      additionalProperties: true,
                    },
                    preferredTpaDetails: {
                      type: "array",
                      description: "Optional preferred TPA details",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    expiringPolicyDetails: {
                      type: "object",
                      description: "Details of expiring policy",
                      additionalProperties: true,
                    },
                    preferredInsurerDetails: {
                      type: "array",
                      description: "Optional preferred insurer details",
                      items: {
                        type: "object",
                        additionalProperties: true,
                      },
                    },
                    coversConfig: {
                      type: "object",
                      description: "Cover configuration details",
                      additionalProperties: true,
                    },
                    otherTermsAndConditions: {
                      type: "object",
                      description: "Other terms and conditions",
                      additionalProperties: true,
                    },
                    disclaimer: {
                      type: "object",
                      description: "Disclaimer details",
                      additionalProperties: true,
                    },
                  },
                },
              },
            },
          },

          userId: {
            type: "number",
            example: 123,
            description: "Optional user ID for tracking",
          },
        },
      },
    }),

    ApiResponse({
      status: 201,
      description: successMessage.brokingSlipExcelGenerated,
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 201 },
          message: {
            type: "string",
            example: successMessage.brokingSlipExcelGenerated,
          },
          data: {
            type: "string",
            example:
              "https://storage.example.com/broking_slip_activity_2024.xlsx",
            description: "Public URL of generated Excel file",
          },
        },
      },
    }),

    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid payload",
    }),

    ApiResponse({
      status: 401,
      description: "Unauthorized",
    }),

    ApiResponse({
      status: 500,
      description: errorMessages.excelGenerationError,
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 500 },
          message: {
            type: "string",
            example: errorMessages.excelGenerationError,
          },
        },
      },
    })
  );


// Swagger metadata for POST /document/excel/quote_comparison_report_activity endpoint
export const generateQuoteComparisonReportExcelSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Generate Quote Comparison Report Excel",
      description: "Generates a quote comparison report in Excel format comparing multiple insurance quotes.",
    }),
    ApiBody({
      description: "Quote comparison report Excel generation payload",
      schema: {
        type: "object",
        required: ["fileName", "data"],
        properties: {
          fileName: {
            type: "string",
            example: "quote_comparison_report_2024",
            description: "Name of the Excel file to be generated",
          },
          data: {
            type: "object",
            description: "Quote comparison data including insurers, premiums, and coverage details",
            additionalProperties: true,
          },
          userId: {
            type: "number",
            example: 123,
            description: "Optional user ID for tracking",
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: successMessage.quoteComparisonReportExcelGenerated,
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 201 },
          message: { type: "string", example: successMessage.quoteComparisonReportExcelGenerated },
          data: { 
            type: "string", 
            example: "https://storage.example.com/quote_comparison_report_2024.xlsx",
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized",
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.excelGenerationError,
    })
  );

// Swagger metadata for POST /document/excel/policy-generation endpoint
export const generatePolicyReportExcelSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Generate Policy Report Excel",
      description: "Generates a comprehensive policy report in Excel format with policy details and metrics.",
    }),
    ApiBody({
      description: "Policy report Excel generation payload",
      schema: {
        type: "object",
        required: ["fileName", "data"],
        properties: {
          fileName: {
            type: "string",
            example: "policy_report_2024",
            description: "Name of the Excel file to be generated",
          },
          data: {
            type: "object",
            description: "Policy report data including policy details, premium breakdown, and analytics",
            additionalProperties: true,
          },
          userId: {
            type: "number",
            example: 123,
            description: "Optional user ID for tracking",
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: successMessage.policyReportExcelGenerated,
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 201 },
          message: { type: "string", example: successMessage.policyReportExcelGenerated },
          data: { 
            type: "string", 
            example: "https://storage.example.com/policy_report_2024.xlsx",
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized",
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.excelGenerationError,
    })
  );

// Swagger metadata for POST /document/placement-slip/data endpoint
export const getPlacementSlipDataSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Placement Slip Data",
      description:
        "Retrieves formatted placement slip data for a policy or opportunity, including organization-specific templates and logo.",
    }),
    ApiBody({
      description: "Placement slip data request payload",
      schema: {
        type: "object",
        properties: {
          policyId: {
            type: "number",
            example: 123,
          },
          opportunityId: {
            type: "number",
            example: 456,
          },
        },
      },
    }),

    ApiResponse({
      status: 200,
      description: "Placement slip data retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.placementSlipRetrieved,
          },
          data: {
            type: "object",
            description: "Dynamic placement slip data",
            additionalProperties: true,
          },
        },
      },
    }),

    ApiResponse({
      status: 404,
      description: "Policy or template not found",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 404 },
          message: {
            type: "string",
            example: errorMessages.policyNotFound,
          },
        },
      },
    }),

    ApiResponse({
      status: 500,
      description: "Internal server error",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 500 },
          message: {
            type: "string",
            example: errorMessages.placementSlipRetrievalFailed,
          },
        },
      },
    }),
  );

