import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { SearchHospitalDto } from "./dto/search-hospital.dto";
import {
  PolicyFeatureDocumentRequestDto,
  PolicyFeatureDocumentResponseDto,
} from "./dto/policy-feature-document.dto";
import {
  UpdatePolicyContactMatrixDto,
} from "./dto/contact-matrix.dto";

export const processHospitalUploadSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Process uploaded hospital Excel file",
      description: "Process hospital data from already uploaded Excel file using fileId. File must be uploaded to file_uploads table first."
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID to upload hospitals for",
      type: "number",
    }),
    ApiBody({
      description: 'Request body containing fileId',
      schema: {
        type: 'object',
        properties: {
          fileId: {
            type: 'number',
            description: 'ID of the uploaded file from file_uploads table',
          },
        },
        required: ['fileId'],
      },
    }),
    ApiResponse({ 
      status: 200, 
      description: "Hospital data processed successfully"
    }),
    ApiResponse({ 
      status: 400, 
      description: "Bad request - Invalid fileId or validation errors" 
    })
  );

export const getHospitalsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ 
      summary: "Get hospitals with pagination",
      description: "Retrieve paginated list of hospitals from the system"
    }),
    ApiQuery({ 
      name: "page", 
      required: false, 
      type: Number, 
      example: 1,
      description: "Page number for pagination"
    }),
    ApiQuery({ 
      name: "limit", 
      required: false, 
      type: Number, 
      example: 10,
      description: "Number of records per page"
    }),
    ApiResponse({ 
      status: 200, 
      description: "Hospitals retrieved successfully",
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Hospitals retrieved successfully' },
          data: {
            type: 'object',
            properties: {
              data: { type: 'array', items: { type: 'object' } },
              count: { type: 'number', example: 100 }
            }
          }
        }
      }
    }),
    ApiResponse({ 
      status: 400, 
      description: "Failed to retrieve hospitals" 
    })
  );

export const updatePolicyContactMatrixSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Configure policy contact matrix",
      description:
        "Create or update policy-level primary and secondary contacts for TPA and insurer",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID to update the contact matrix for",
      type: Number,
    }),
    ApiBody({
      description: "TPA and insurer contact matrix payload",
      type: UpdatePolicyContactMatrixDto,
    }),
    ApiResponse({
      status: 200,
      description: "Contact matrix saved successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Invalid payload or missing identifiers",
    })
  );

export const getTpaContactsWithCommsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get TPA contacts with communication values",
      description:
        "Returns the TPA-level contacts for a given TPA ID enriched with phone and email.",
    }),
    ApiParam({
      name: "tpaId",
      description: "TPA identifier",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "TPA contacts retrieved",
      schema: {
        type: "object",
      },
    })
  );

export const getInsurerContactsWithCommsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get insurer contacts with communication values",
      description:
        "Returns the insurer-level contacts for a given insurer ID enriched with phone and email.",
    }),
    ApiParam({
      name: "insurerId",
      description: "Insurer identifier",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "Insurer contacts retrieved",
      schema: {
        type: "object",
      },
    })
  );

export const getPolicyTpaInsurerInfoSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get primary TPA and insurer for a policy",
      description:
        "Returns the primary TPA and insurer records mapped to the supplied policy.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy identifier",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "Party IDs retrieved",
      schema: {
        type: "object",
      },
    })
  );

export const getSubmittedPolicyContactsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get combined submitted TPA and insurer contacts for a policy",
      description:
        "Returns the submitted contacts for both TPA and insurer recorded in policy_contact_metrics for the policy.",
    }),
    ApiParam({
      name: "policyId",
      description: "Policy identifier",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "Submitted contacts returned",
      schema: {
        type: "object",
      },
    })
  );


export const searchHospitalsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(SearchHospitalDto),
    ApiOperation({
      summary: "Search hospitals for a specific policy with filters",
      description: "Search and filter hospitals by city, state, pin code, and general search terms. Returns hospital counts and detailed information with location data."
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID to search hospitals for",
      type: "number",
      example: 555297
    }),
    ApiQuery({ 
      name: "page", 
      required: false, 
      type: Number, 
      example: 1,
      description: "Page number for pagination"
    }),
    ApiQuery({ 
      name: "limit", 
      required: false, 
      type: Number, 
      example: 10,
      description: "Number of records per page"
    }),
    ApiQuery({ 
      name: "search", 
      required: false, 
      type: String,
      example: "Apollo",
      description: "🔍 General search - Filter by hospital name, address, or other text fields (partial match)"
    }),
    ApiQuery({ 
      name: "city", 
      required: false, 
      type: String,
      example: "Mumbai",
      description: "🏙️ City filter - Filter hospitals by city name (partial match, case-insensitive)"
    }),
    ApiQuery({ 
      name: "state", 
      required: false, 
      type: String,
      example: "Maharashtra", 
      description: "🗺️ State filter - Filter hospitals by state name (partial match, case-insensitive)"
    }),
    ApiQuery({ 
      name: "pinCode", 
      required: false, 
      type: String,
      example: "400001",
      description: "📮 Pin Code filter - Filter by exact pin code or 3-digit prefix (e.g., '400' matches '400xxx')"
    }),
    ApiResponse({ 
      status: 200, 
      description: "Hospitals retrieved successfully with location data",
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Hospitals retrieved successfully' },
          data: {
            type: 'object',
            properties: {
              data: { 
                type: 'array', 
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    name: { type: 'string', example: 'Apollo Hospital' },
                    code: { type: 'string', example: 'APL001' },
                    addresses: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', example: 1 },
                        addressLine1: { type: 'string', example: 'Plot No. 251, Rd Number 3' },
                        addressLine2: { type: 'string', example: 'Banjara Hills' },
                        cityName: { type: 'string', example: 'Mumbai', description: '🏙️ City name as string' },
                        stateName: { type: 'string', example: 'Maharashtra', description: '🗺️ State name as string' },
                        countryName: { type: 'string', example: 'India', description: '🌍 Country name as string' },
                        pinCode: { type: 'string', example: '400001' },
                        phoneNumber: { type: 'string', example: '+91-40-23607777' },
                        email: { type: 'string', example: 'info@apollohospital.com' }
                      }
                    },
                    hospitalNetwork: {
                      type: 'object',
                      properties: {
                        isNetworkHospital: { type: 'boolean', example: true, description: '🏥 Network hospital status' },
                        classification: { type: 'string', example: 'Network', enum: ['Network', 'Excluded', 'Unknown'], description: '📋 Hospital classification' }
                      },
                      description: '🏥 Hospital network information for this policy'
                    },
                    policyMappings: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          isNetworkHospital: { type: 'boolean', example: true }
                        }
                      }
                    }
                  }
                }
              },
              count: { type: 'number', example: 50, description: 'Total hospitals for policy' },
              networkHospitalCount: { type: 'number', example: 30, description: 'Network hospitals count' },
              excludedHospitalCount: { type: 'number', example: 20, description: 'Excluded hospitals count' }
            }
          }
        }
      }
    }),
    ApiResponse({ 
      status: 400, 
      description: "Bad request" 
    }),
    ApiResponse({ 
      status: 403, 
      description: "Access denied" 
    })
  );

export const exportHospitalsToExcelSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(SearchHospitalDto),
    ApiOperation({
      summary: "Export hospitals data to Excel with filters",
      description: "Export filtered hospitals data to Excel file. Uses same search filters as search API (city, state, pin code, search terms) but exports ALL matching records to Excel file."
    }),
    ApiParam({ 
      name: 'policyId', 
      description: 'Policy ID for which to export hospitals data', 
      type: 'number',
      example: 555297
    }),
    ApiQuery({ 
      name: "search", 
      required: false, 
      type: String,
      example: "Apollo",
      description: "🔍 General search - Filter by hospital name, address, or other text fields (partial match)"
    }),
    ApiQuery({ 
      name: "city", 
      required: false, 
      type: String,
      example: "Mumbai",
      description: "🏙️ City filter - Filter hospitals by city name (partial match, case-insensitive)"
    }),
    ApiQuery({ 
      name: "state", 
      required: false, 
      type: String,
      example: "Maharashtra",
      description: "🗺️ State filter - Filter hospitals by state name (partial match, case-insensitive)"
    }),
    ApiQuery({ 
      name: "pinCode", 
      required: false, 
      type: String,
      example: "400001",
      description: "📮 Pin Code filter - Filter by exact pin code or 3-digit prefix (e.g., '400' matches '400xxx')"
    }),
    ApiResponse({ 
      status: 200, 
      description: "Excel file generated and streamed successfully",
      content: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
          schema: {
            type: 'string',
            format: 'binary'
          },
          examples: {
            file: {
              summary: "Excel file download",
              description: "Direct Excel file download with proper headers for browser download"
            }
          }
        }
      },
      headers: {
        'Content-Disposition': {
          description: 'Attachment header with filename',
          schema: { type: 'string', example: 'attachment; filename="Hospitals_Export_Policy_555297_2025-11-12.xlsx"' }
        },
        'Content-Type': {
          description: 'Excel MIME type',
          schema: { type: 'string', example: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        },
        'Content-Length': {
          description: 'File size in bytes',
          schema: { type: 'number', example: 15420 }
        }
      }
    }),
    ApiResponse({ 
      status: 400, 
      description: "Failed to export hospitals data" 
    })
  );

export const downloadTemplateSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Download Excel template for hospital upload",
      description: "Generates Excel template with headers from entity columns and mock hospital data (policy-independent). No authentication required."
    }),
    ApiResponse({ 
      status: 200, 
      description: "Template generated successfully",
      content: {
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
          schema: {
            type: 'string',
            format: 'binary'
          },
          examples: {
            template: {
              summary: "Hospital upload template",
              description: "Excel template with proper headers and sample data for hospital upload"
            }
          }
        }
      },
      headers: {
        'Content-Disposition': {
          description: 'Attachment header with filename',
          schema: { type: 'string', example: 'attachment; filename="hospital-upload-template.xlsx"' }
        },
        'Content-Type': {
          description: 'Excel MIME type',
          schema: { type: 'string', example: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        },
        'Content-Length': {
          description: 'File size in bytes',
          schema: { type: 'number', example: 8635 }
        }
      }
    }),
    ApiResponse({ 
      status: 400, 
      description: "Bad request - Failed to generate template" 
    })
  );

export const getLocationDataSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get available states and cities for policy hospitals",
      description: "Returns all states by default, or cities for a specific state from hospitals mapped to the policy"
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID to get location data for",
      type: "number",
      example: 555297
    }),
    ApiQuery({
      name: "state",
      required: false,
      type: String,
      description: "State name to get cities for (if not provided, returns all states)",
      example: "Maharashtra"
    }),
    ApiResponse({
      status: 200,
      description: "Location data retrieved successfully",
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Location data retrieved successfully' },
          data: {
            oneOf: [
              {
                type: 'object',
                properties: {
                  states: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['Maharashtra', 'Karnataka', 'Tamil Nadu'],
                    description: 'Available states (when no state parameter is provided)'
                  }
                },
                description: 'Response when getting all states'
              },
              {
                type: 'object',
                properties: {
                  cities: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['Mumbai', 'Pune', 'Nashik'],
                    description: 'Cities in the specified state'
                  },
                  selectedState: {
                    type: 'string',
                    example: 'Maharashtra',
                    description: 'The state that was queried'
                  }
                },
                description: 'Response when getting cities for a specific state'
              }
            ]
          }
        }
      }
    }),
    ApiResponse({
      status: 400,
      description: "Bad request - Failed to retrieve location data"
    })
  );

export const getTransactionHistorySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get hospital upload transaction history for a policy",
      description: "Retrieves paginated hospital file upload tracking records with user details and processing status"
    }),
    ApiParam({
      name: "policyId", 
      description: "Policy ID to get upload history for",
      type: "number",
    }),
    ApiQuery({ 
      name: "page", 
      required: false, 
      type: Number, 
      example: 1,
      description: "Page number for pagination"
    }),
    ApiQuery({ 
      name: "limit", 
      required: false, 
      type: Number, 
      example: 10,
      description: "Number of records per page"
    }),
    ApiResponse({ 
      status: 200, 
      description: "Upload history retrieved successfully",
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: 'Upload history retrieved successfully' },
          data: {
            type: 'object',
            properties: {
              data: { 
                type: 'array', 
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'number', example: 1 },
                    policyId: { type: 'number', example: 555297 },
                    fileName: { type: 'string', example: 'hospitals_upload.xlsx' },
                    status: { type: 'string', example: 'COMPLETED', enum: ['PROCESSING', 'COMPLETED', 'COMPLETED_WITH_ERRORS', 'FAILED'] },
                    successCount: { type: 'number', example: 45 },
                    errorCount: { type: 'number', example: 5 },
                    networkHospitalCount: { type: 'number', example: 30 },
                    excludedHospitalCount: { type: 'number', example: 15 },
                    totalRecords: { type: 'number', example: 50 },
                    uploadedAt: { type: 'string', format: 'date-time' },
                    processedAt: { type: 'string', format: 'date-time' },
                    uploadedBy: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', example: 1001 },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', example: 'john.doe@company.com' }
                      }
                    }
                  }
                }
              },
              count: { type: 'number', example: 25 }
            }
          }
        }
      }
    }),
    ApiResponse({ 
      status: 400, 
      description: "Bad request - Failed to retrieve upload history" 
    })
  );

export const downloadFaqTemplateSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ 
      summary: "Download FAQ template for policy",
      description: "Downloads an Excel template with FAQ headers (S. No, Category, Question, Answer) for a specific policy"
    }),
    ApiParam({ 
      name: "policyId", 
      type: Number, 
      description: "Policy ID for which to download FAQ template" 
    }),
    ApiResponse({ 
      status: 200, 
      description: "FAQ template downloaded successfully",
      headers: {
        'Content-Type': {
          description: 'MIME type of the downloaded file',
          schema: { type: 'string', example: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
        },
        'Content-Disposition': {
          description: 'Attachment disposition with filename',
          schema: { type: 'string', example: 'attachment; filename="FAQ_Template_Policy_123_2025-11-12.xlsx"' }
        }
      }
    }),
    ApiResponse({ 
      status: 400, 
      description: "Bad Request - Invalid policy ID" 
    }),
    ApiResponse({ 
      status: 500, 
      description: "Internal Server Error - Failed to generate template" })
    );

export const bulkUploadFaqSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ 
      summary: "Bulk upload FAQs from Excel file",
      description: "Upload multiple FAQs for a policy from an Excel file. Supports replacing existing FAQs or appending new ones."
    }),
    ApiBody({
      description: "Bulk upload FAQ request payload",
      schema: {
        type: "object",
        properties: {
          policyId: {
            type: "integer",
            description: "Policy ID to associate FAQs with",
            example: 12345,
          },
          fileId: {
            type: "integer", 
            description: "File ID from file_uploads table containing the Excel file",
            example: 67890,
          },
          replaceAll: {
            type: "boolean",
            description: "Whether to replace all existing FAQs for the policy or append new ones",
            example: false,
            default: false,
          },
        },
        required: ["policyId", "fileId", "replaceAll"],
      },
    }),
    ApiResponse({
      status: 200,
      description: "FAQ bulk upload processed successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: { type: "string", example: "FAQ bulk upload processed successfully" },
          data: {
            type: "object",
            properties: {
              uploadId: { type: "integer", example: 123 },
              processedCount: { type: "integer", example: 25 },
              successCount: { type: "integer", example: 23 },
              errorCount: { type: "integer", example: 2 },
              errors: {
                type: "array",
                items: { type: "string" },
                example: ["Row 3: Question field is required", "Row 5: Category field is too long"],
              },
              status: { type: "string", example: "FAQ_UPLOAD_COMPLETED" },
              replacedExisting: { type: "boolean", example: false },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid input, missing file, or Excel parsing error",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    }),
    ApiResponse({
      status: 404,
      description: "Not Found - Policy or file not found",
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
    })
  );

export const getPolicyFaqsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ 
      summary: "Get FAQs for policies",
      description: "Retrieve FAQs for multiple active policies with optional category filtering, search, and pagination support."
    }),
    ApiQuery({
      name: "policyId",
      description: "Policy ID to fetch FAQs for",
      required: true,
      example: "12345",
      type: String,
    }),
    ApiQuery({
      name: "category",
      description: "Category filter for FAQs. Use 'ALL' or omit to fetch all categories",
      required: false,
      example: "Claims",
      type: String,
    }),
    ApiQuery({
      name: "search",
      description: "Search term to filter questions and answers",
      required: false,
      example: "claim process",
      type: String,
    }),
    ApiQuery({
      name: "page",
      description: "Page number for pagination",
      required: false,
      example: 1,
      type: Number,
    }),
    ApiQuery({
      name: "limit",
      description: "Number of FAQs per page (max 100)",
      required: false,
      example: 20,
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "FAQs retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: { type: "string", example: "FAQs retrieved successfully" },
          data: {
            type: "object",
            properties: {
              faqs: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "integer", example: 1 },
                    policyId: { type: "integer", example: 12345 },
                    category: { type: "string", example: "Claims" },
                    question: { type: "string", example: "How do I submit a claim?" },
                    answer: { type: "string", example: "To submit a claim, please follow these steps..." },
                    isActive: { type: "boolean", example: true },
                    createdAt: { type: "string", format: "date-time", example: "2024-01-15T10:30:00Z" },
                    updatedAt: { type: "string", format: "date-time", example: "2024-01-20T15:45:00Z", nullable: true },
                  },
                },
              },
              total: { type: "integer", example: 45 },
              page: { type: "integer", example: 1 },
              limit: { type: "integer", example: 20 },
              totalPages: { type: "integer", example: 3 },
              availableCategories: {
                type: "array",
                items: { type: "string" },
                example: ["Claims", "Coverage", "Enrollment", "General"],
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid parameters",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 400 },
          message: { type: "string", example: "At least one policy ID is required" },
          error: { type: "string", example: "Bad Request" },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
    })
  );

export const getFaqUploadsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ 
      summary: "Get FAQ uploads",
      description: "Retrieve FAQ upload history with user details and pagination"
    }),
    ApiQuery({
      name: "policyId",
      required: false,
      type: Number,
      description: "Filter by policy ID",
      example: 556283,
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
      description: "Number of records per page (max 100)",
      example: 20,
    }),
    ApiResponse({
      status: 200,
      description: "FAQ uploads retrieved successfully",
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                policyId: { type: "integer", example: 556283 },
                fileId: { type: "integer", example: 345963 },
                fileName: { type: "string", example: "1763028814732_hospital_batch_03.xlsx" },
                uploadedBy: { type: "string", example: "Ramakrishna Vurakaranam" },
                uploadedAt: { type: "string", example: "13 Nov 2025, 03:43 pm" },
                faqCount: { type: "integer", example: 10 },
                fileStatus: { type: "string", example: "COMPLETED" },
                createdAt: { type: "string", format: "date-time", example: "2025-11-13T10:13:40.500Z" },
                createdBy: { type: "integer", example: 2 },
                createdByName: { type: "string", example: "Ramakrishna Vurakaranam" },
                createdByEmail: { type: "string", example: "ramarao@isbsindia.in" },
                updatedAt: { type: "string", format: "date-time", example: "2025-11-13T10:13:41.363Z" },
                updatedBy: { type: "integer", example: 2 },
                updatedByName: { type: "string", example: "Ramakrishna Vurakaranam" },
                updatedByEmail: { type: "string", example: "ramarao@isbsindia.in" },
              },
            },
          },
          total: { type: "integer", example: 150 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          totalPages: { type: "integer", example: 8 },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid parameters",
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing token",
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
    })
  );

export const createPolicyFeatureDocumentSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Upload policy feature document",
      description:
        "Links an uploaded document to the policy as the current feature document. If one exists, it is marked as replaced.",
    }),
    ApiParam({
      name: "policyId",
      type: Number,
      description: "Policy ID to attach the feature document to",
    }),
    ApiBody({ type: PolicyFeatureDocumentRequestDto }),
    ApiResponse({
      status: 201,
      description: "Policy feature document uploaded",
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid payload",
    })
  );

export const getPolicyFeatureDocumentSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(PolicyFeatureDocumentResponseDto),
    ApiOperation({
      summary: "Get policy feature document",
      description:
        "Retrieves the active policy feature document or the upload history when requested.",
    }),
    ApiParam({
      name: "policyId",
      type: Number,
      description: "Policy ID whose feature document is requested",
    }),
    ApiQuery({
      name: "history",
      required: false,
      description: "Set to true to fetch upload history",
      type: Boolean,
      example: false,
    }),
    ApiQuery({
      name: "page",
      required: false,
      description: "Page number when fetching history",
      type: Number,
      example: 1,
    }),
    ApiQuery({
      name: "limit",
      required: false,
      description: "Page size when fetching history",
      type: Number,
      example: 20,
    }),
    ApiResponse({
      status: 200,
      description: "Policy feature document retrieved",
      schema: { $ref: getSchemaPath(PolicyFeatureDocumentResponseDto) },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid parameters",
    })
  );

export const downloadPolicyFaqsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Download active FAQs for policy",
      description:
        "Downloads an Excel file containing all active FAQs for the specified policy",
    }),
    ApiParam({
      name: "policyId",
      type: Number,
      description: "Policy ID for which to download FAQs",
    }),
    ApiResponse({
      status: 200,
      description: "Active FAQs downloaded successfully",
      headers: {
        "Content-Type": {
          description: "MIME type of the downloaded file",
          schema: {
            type: "string",
            example:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        },
        "Content-Disposition": {
          description: "Attachment disposition with filename",
          schema: {
            type: "string",
            example:
              'attachment; filename="Policy_123_Active_FAQs_2025-11-12.xlsx"',
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "Policy or active FAQs not found" }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error - Failed to generate FAQ export",
    })
  );

export const getPortalConfigurationOverviewSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get portal configuration overview",
      description: "Retrieve hospital network overview for a policy"
    }),
    ApiParam({
      name: "policyId",
      description: "Policy ID",
      type: Number
    }),
    ApiResponse({
      status: 200,
      description: "Hospital network overview retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Hospital network overview retrieved successfully" },
          data: {
            type: "object",
            properties: {
              hospitalNetwork: {
                type: "object",
                properties: {
                  lastUploadDate: { type: "string", example: "2026-01-15T10:30:00Z", nullable: true },
                  totalNetworkHospitals: { type: "number", example: 500 },
                  totalExcludedHospitals: { type: "number", example: 25 },
                  totalHospitals: { type: "number", example: 525 },
                  hasUploadedData: { type: "boolean", example: true }
                }
              },
              policyFeature: {
                type: "object",
                properties: {
                  lastUploadDate: { type: "string", example: "2026-01-10T14:20:00Z", nullable: true },
                  uploadedByName: { type: "string", example: "John Doe", nullable: true },
                  status: { type: "string", example: "active" },
                  hasUploadedData: { type: "boolean", example: true }
                }
              },
              faq: {
                type: "object",
                properties: {
                  lastUploadDate: { type: "string", example: "2026-01-12T09:15:00Z", nullable: true },
                  totalSuccessCount: { type: "number", example: 45 },
                  totalCategories: { type: "number", example: 8 },
                  categoryStats: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string", example: "Claims" },
                        count: { type: "number", example: 12 }
                      }
                    }
                  },
                  hasUploadedData: { type: "boolean", example: true }
                }
              },
              contactMatrix: {
                type: "object",
                properties: {
                  configured: { type: "boolean", example: true },
                  configuredBy: { type: "string", example: "Jane Smith", nullable: true },
                  lastConfiguredAt: { type: "string", example: "2026-01-08T16:45:00Z", nullable: true }
                }
              }
            }
          }
        }
      }
    }),
    ApiResponse({
      status: 400,
      description: "Failed to retrieve hospital network overview"
    })
  );