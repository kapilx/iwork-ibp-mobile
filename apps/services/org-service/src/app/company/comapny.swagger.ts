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
import {
  errorMessages,
  successMessage,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { OWNER_TYPES } from "../../../../../../libs/service-lib/src/lib/constants";
import { CompanyDetailsDto } from "./dto/company-detail.dto";
import { CompanyListResponseDto } from "./dto/company.dto";
import { CreateCompanyDto } from "./dto/create-company.dto";
import { GetCompaniesDto, GetCompanyListDto } from "./dto/get-company-list-dto";
import {
  CompanyHierarchyListResponseDto,
  CompanyHierarchyResponseDto,
} from "./dto/company-hierarchy-response.dto";
import { CompanyHierarchyQueryDto } from "./dto/company-hierarchy-query.dto";
import { UpdateCompanyDto } from "./dto/update-company.dto";
import { CompanyResponseDto } from "./dto/company-response.dto";

// Swagger metadata for the createCompany method
export function createCompanySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateCompanyDto, CompanyDetailsDto, CompanyResponseDto),
    ApiOperation({
      summary: "Create Company",
      description:
        'Creates a company along with its addresses, and details. Requires authentication and "BD" role.',
    }),
    ApiBody({
      description: "Company creation payload",
      schema: {
        type: "object",
        properties: {
          company: {
            $ref: getSchemaPath(CreateCompanyDto),
          },
          companyDetails: {
            $ref: getSchemaPath(CompanyDetailsDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: successMessage.companyCreated,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 201 },
          message: { type: "string", example: successMessage.companyCreated },
          data: {
            $ref: getSchemaPath(CompanyResponseDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing authentication token",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 401 },
          message: { type: "string", example: "Unauthorized" },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: "Forbidden - User does not have the required role",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 403 },
          message: {
            type: "string",
            example: "Access denied. User doesn't have permission.",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Invalid input data" },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error" },
        },
      },
    })
  );
}

// Swagger metadata for the getCompany method
export const getCompanySwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Get company data with all the related entities by ID",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "id",
      description: "The ID of the company",
      type: String,
    }),
    ApiExtraModels(CompanyResponseDto),
    ApiResponse({
      status: 200,
      description: successMessage.companyDetails,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.companyDetails },
          data: {
            $ref: getSchemaPath(CompanyResponseDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.companyNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: errorMessages.companyNotFound },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error" },
        },
      },
    })
  );
};

// Swagger metadata for the deleteCompany method
export const deleteCompanySwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({ summary: "Delete company by ID" }),
    ApiParam({
      name: "id",
      description: "The ID of the company to delete",
      type: String,
    }),
    ApiBearerAuth("access-token"), // Indicates that the endpoint requires a Bearer token for authentication
    ApiResponse({ status: 200, description: "Company deleted successfully" }),
    ApiResponse({ status: 404, description: "Company not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

// Swagger metadata for the listCompanies method
export const getCompaniesSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"), // Indicates that the endpoint requires a Bearer token for authentication
    ApiOperation({
      summary: "Retrieve a paginated list of companies",
      description:
        "Retrieves a paginated list of companies with optional filters and sorting.",
    }),
    ...Object.keys(GetCompaniesDto.prototype).map((key) =>
      ApiQuery({
        name: key,
        required: false,
        description: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetCompaniesDto.prototype,
          key
        )?.description,
        example: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetCompaniesDto.prototype,
          key
        )?.example,
      })
    ),
    ApiResponse({
      status: 200,
      description: successMessage.companyListRetrieved,
      type: CompanyListResponseDto,
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error" },
        },
      },
    })
  );
};

// Swagger metadata for the updateCompany method
export const updateCompanySwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Update Company",
      description:
        "Updates a company's details, addresses, GST details, group company mappings, and document mappings. Requires authentication and 'BD' role.",
    }),
    ApiBearerAuth("access-token"),
    ApiExtraModels(UpdateCompanyDto, CompanyDetailsDto, CompanyResponseDto),
    ApiParam({
      name: "companyId",
      description: "The ID of the company to update",
      type: String,
    }),
    ApiBody({
      description: "Company update payload",
      schema: {
        type: "object",
        properties: {
          company: {
            $ref: getSchemaPath(UpdateCompanyDto),
          },
          companyDetails: {
            $ref: getSchemaPath(CompanyDetailsDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.companyUpdated,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.companyUpdated },
          data: {
            $ref: getSchemaPath(CompanyResponseDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.companyNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: errorMessages.companyNotFound },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error" },
        },
      },
    })
  );
};

export const getCompanyListSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary:
        "Retrieve a paginated list of companies with id, name and country",
      description:
        "Returns a paginated list of companies. Supports optional search on displayName and companyName. Requires authentication and 'BD' role.",
    }),
    ApiExtraModels(GetCompanyListDto, CompanyListResponseDto),
    ApiBearerAuth("access-token"), // Indicates that the endpoint requires a Bearer token for authentication
    ...Object.keys(GetCompanyListDto.prototype).map((key) =>
      ApiQuery({
        name: key,
        required: false,
        description: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetCompanyListDto.prototype,
          key
        )?.description,
        example: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetCompanyListDto.prototype,
          key
        )?.example,
      })
    ),
    ApiResponse({
      status: 200,
      description: successMessage.companyListRetrieved,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.companyListRetrieved,
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 1 },
                    companyName: { type: "string", example: "TechCorp" },
                    displayName: {
                      type: "string",
                      example: "Tech Corporation",
                    },
                    companyType: { type: "string", example: "Private" },
                    status: { type: "string", example: "Active" },
                    groupCompany: { type: "string", example: "Tech Group" },
                  },
                },
              },
              count: { type: "number", example: 100 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.companyListNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: errorMessages.companyListNotFound,
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing authentication token",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 401 },
          message: { type: "string", example: "Unauthorized" },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: "Forbidden - User does not have the required role",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 403 },
          message: {
            type: "string",
            example: "Access denied. User doesn't have permission.",
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
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error" },
        },
      },
    })
  );
};

export const getHierarchyCompaniesSwaggerMetadata = () => {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(
      CompanyHierarchyResponseDto,
      CompanyHierarchyQueryDto,
      CompanyHierarchyListResponseDto
    ),
    ApiOperation({
      summary: "Fetch companies accessible through user hierarchy",
      description:
        "Returns a paginated list of companies filtered by the logged-in user or an explicitly provided owner. Supports manager and team hierarchy views with optional name search.",
    }),
    ...Object.keys(CompanyHierarchyQueryDto.prototype).map((key) =>
      ApiQuery({
        name: key,
        required: false,
        description: Reflect.getMetadata(
          "swagger/apiModelProperties",
          CompanyHierarchyQueryDto.prototype,
          key
        )?.description,
        example: Reflect.getMetadata(
          "swagger/apiModelProperties",
          CompanyHierarchyQueryDto.prototype,
          key
        )?.example,
        enum: key === "viewBy" ? Object.values(OWNER_TYPES) : undefined,
      })
    ),
    ApiResponse({
      status: 200,
      description: successMessage.companyListRetrieved,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.companyListRetrieved },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: { $ref: getSchemaPath(CompanyHierarchyResponseDto) },
              },
              count: { type: "number", example: 25 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.companyListFailed,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: errorMessages.companyListFailed },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.companyListFailed,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: errorMessages.companyListFailed },
        },
      },
    })
  );
};

export const getCompaniesDataSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary:
        "Retrieve a paginated list of companies with id, name and its associated companies",
      description:
        "Fetches a paginated list of companies with optional search functionality. Requires authentication and 'BD' role.",
    }),
    ApiExtraModels(GetCompanyListDto),
    ApiBearerAuth("access-token"), // Indicates that the endpoint requires a Bearer token for authentication
    ...Object.keys(GetCompanyListDto.prototype).map((key) =>
      ApiQuery({
        name: key,
        required: false,
        description: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetCompanyListDto.prototype,
          key
        )?.description,
        example: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetCompanyListDto.prototype,
          key
        )?.example,
      })
    ),
    ApiResponse({
      status: 200,
      description: successMessage.companyListRetrieved,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.companyListRetrieved,
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 1 },
                    companyName: { type: "string", example: "TechCorp test" },
                    childCompanies: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "number", example: 2 },
                          companyName: { type: "string", example: "TechCorp " },
                        },
                      },
                    },
                  },
                },
              },
              count: { type: "number", example: 100 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.companyListNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: errorMessages.companyListNotFound,
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing authentication token",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 401 },
          message: { type: "string", example: "Unauthorized" },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: "Forbidden - User does not have the required role",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 403 },
          message: {
            type: "string",
            example: "Access denied. User doesn't have permission.",
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
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error" },
        },
      },
    })
  );
};

export const getCompanyDetailsSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({ summary: "Get company details by ID" }),
    ApiParam({
      name: "id",
      description: "The ID of the company to retrieve details",
      type: String,
    }),
    ApiQuery({
      name: "contactId",
      description: "The ID of the contact to exclude from the response",
      type: Number,
      required: false,
    }),
    ApiBearerAuth("access-token"), // Indicates that the endpoint requires a Bearer token for authentication
    ApiResponse({
      status: 200,
      description: "Company details retrieved successfully",
      schema: {
        example: {
          status: 200,
          message: "Company retrieved successfully",
          data: [
            {
              id: 143,
              companyName: "hhh",
              displayName: "RLGK",
              companyAddresses: [
                {
                  id: 1,
                  address1: "testing Contact Details",
                  cityId: {
                    id: 1,
                    name: "Visakhapatnam",
                  },
                },
              ],
              contacts: [
                {
                  id: 156,
                  firstName: "testing",
                  lastName: "Contact",
                  middleName: "testing Contact Details",
                  displayName: "testing Contact Details",
                },
              ],
            },
          ],
        },
      },
    }),
    ApiResponse({ status: 404, description: "Company not found" }),
    ApiResponse({ status: 500, description: "Internal server error" })
  );
};

export const getGroupCompaniesSwaggerMetadata = () => {
  return applyDecorators(
    ApiOperation({
      summary: "Retrieve a paginated list of group companies with id, name",
      description:
        "Fetches a paginated list of group companies with optional search functionality. Requires authentication and 'BD' role.",
    }),
    ApiExtraModels(GetCompanyListDto, CompanyListResponseDto),
    ApiBearerAuth("access-token"), // Indicates that the endpoint requires a Bearer token for authentication
    ...Object.keys(GetCompanyListDto.prototype).map((key) =>
      ApiQuery({
        name: key,
        required: false,
        description: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetCompanyListDto.prototype,
          key
        )?.description,
        example: Reflect.getMetadata(
          "swagger/apiModelProperties",
          GetCompanyListDto.prototype,
          key
        )?.example,
      })
    ),
    ApiResponse({
      status: 200,
      description: successMessage.groupCompanyListRetrieved,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.groupCompanyListRetrieved,
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "number", example: 1 },
                    companyName: { type: "string", example: "TechCorp" },
                    displayName: {
                      type: "string",
                      example: "Tech Corporation",
                    },
                    country: {
                      type: "object",
                      properties: {
                        name: { type: "string", example: "India" },
                        isoCode: { type: "string", example: null },
                        id: { type: "number", example: 1 },
                      },
                    },
                  },
                },
              },
              count: { type: "number", example: 100 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: errorMessages.groupCompanyListRetrievalFailed,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: errorMessages.groupCompanyListRetrievalFailed,
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: "Unauthorized - Invalid or missing authentication token",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 401 },
          message: { type: "string", example: "Unauthorized" },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: "Forbidden - User does not have the required role",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 403 },
          message: {
            type: "string",
            example: "Access denied. User doesn't have permission.",
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
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error" },
        },
      },
    })
  );
};


// Swagger metadata for the bulk update companies method
export function bulkUpdateCompaniesSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Bulk Update Companies",
      description:
        "Performs bulk updates on multiple companies simultaneously. Supports updating leadCrm, accountManager, status, and priority fields with batched processing for optimal performance.",
    }),
    ApiBody({
      description: "Bulk update payload with record IDs and field updates",
      schema: {
        type: "object",
        properties: {
          recordIds: {
            type: "array",
            items: { type: "number" },
            example: [101, 102, 103],
            description: "Array of company IDs to update"
          },
          fieldUpdates: {
            type: "array",
            description:
              "Array of field update operations (supports leadCrm, accountManager, status, priority)",
            items: {
              type: "object",
              properties: {
                fieldName: { type: "string", example: "leadCrm" },
                newValue: {
                  oneOf: [
                    { type: "string" },
                    { type: "number" },
                    { type: "boolean" },
                    { type: "null" }
                  ],
                  example: 1415
                },
                operation: {
                  type: "string",
                  enum: ["set", "clear"],
                  example: "set"
                }
              },
              required: ["fieldName", "operation"]
            }
          }
        },
        required: ["recordIds", "fieldUpdates"]
      }
    }),
    ApiResponse({
      status: 200,
      description: "Bulk update completed successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Successfully updated 3 companies" },
          data: {
            type: "object",
            properties: {
              totalRecords: { type: "number", example: 3 },
              successCount: { type: "number", example: 3 },
              failureCount: { type: "number", example: 0 },
              errors: { type: "array", example: [] },
              affectedRecords: {
                type: "array",
                items: { type: "number" },
                example: [101, 102, 103]
              },
              processingDuration: { type: "number", example: 245 }
            }
          }
        }
      }
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid input data",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "recordIds is required and must contain at least one record ID" },
        },
      },
    })
  );
};

// Swagger metadata for inception-create-company endpoint
export function inceptionCreateCompanySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateCompanyDto),
    ApiOperation({
      summary: "Bulk Create Companies (Inception)",
      description: "Creates multiple companies in a single request for initial data load or bulk import operations.",
    }),
    ApiBody({
      description: "Array of company creation payloads",
      schema: {
        type: "array",
        items: {
          $ref: getSchemaPath(CreateCompanyDto),
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Companies created successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.companyCreated },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                companyId: { type: "number", example: 101 },
                companyName: { type: "string", example: "ABC Corporation" },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request",
    }),
    ApiResponse({
      status: 403,
      description: errorMessages.companyCreationForbidden,
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.companyCreationFailed,
    })
  );
}

// Swagger metadata for analytics/refresh endpoint
export function refreshCompanyAnalyticsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Refresh Company Analytics",
      description: "Triggers a refresh of company analytics data for the current user's scope.",
    }),
    ApiResponse({
      status: 200,
      description: "Company analytics refreshed successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.companyAnalyticsRefreshed },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: "Forbidden - User does not have permission to refresh analytics",
    }),
    ApiResponse({
      status: 404,
      description: errorMessages.companyNotFound,
    }),
    ApiResponse({
      status: 500,
      description: "Failed to refresh company analytics",
    })
  );
}

// Swagger metadata for company-opportunity-create endpoint
export function createCompanyOpportunitySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Quick Create Company with Opportunity",
      description: "Creates a company along with contacts and optionally an opportunity in a single request. Used for quick assistance workflows.",
    }),
    ApiBody({
      description: "Payload for creating company with opportunity",
      schema: {
        type: "object",
        properties: {
          company: {
            $ref: getSchemaPath(CreateCompanyDto),
          },
          opportunity: {
            type: "object",
            description: "Optional opportunity details",
            nullable: true,
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: "Company and opportunity created successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 201 },
          message: { type: "string", example: "Successfully created company and opportunity" },
          data: {
            type: "object",
            properties: {
              companyId: { type: "number", example: 101 },
              opportunityId: { type: "number", example: 501 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request",
    }),
    ApiResponse({
      status: 403,
      description: errorMessages.companyCreationForbidden,
    }),
    ApiResponse({
      status: 500,
      description: errorMessages.companyCreationFailed,
    })
  );
}

// Swagger metadata for :id/contacts endpoint
export function getCompanyContactsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Company Contacts",
      description: "Retrieves a paginated list of contacts associated with a specific company.",
    }),
    ApiParam({
      name: "id",
      description: "Company ID",
      type: Number,
      example: 101,
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number",
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
      name: "search",
      required: false,
      type: String,
      description: "Search term for filtering contacts",
    }),
    ApiQuery({
      name: "status",
      required: false,
      enum: ["ACTIVE", "INACTIVE"],
      description: "Filter contacts by status",
    }),
    ApiResponse({
      status: 200,
      description: "Company contacts retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.companyContactsRetrieved },
          data: {
            type: "object",
            properties: {
              data: { type: "array" ,example:[{
        "id": 57,
        "firstName": "Mrs. Upasana",
        "lastName": "Chawda",
        "displayName": "Mrs. Upasana Chawda",
        "status": "Active"
      }]},
              count: { type: "number", example: 15 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Company contacts not found",
    }),
    ApiResponse({
      status: 500,
      description: "Failed to retrieve company contacts",
    })
  );
}

// Swagger metadata for :id/documents endpoint
export function getCompanyDocumentsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(GetCompaniesDto),
    ApiOperation({
      summary: "Get Company Documents",
      description: "Retrieves a paginated list of documents associated with a specific company.",
    }),
    ApiParam({
      name: "id",
      description: "Company ID",
      type: Number,
      example: 101,
    }),
    ApiQuery({
      required: false,
      type: GetCompaniesDto,
      description: "Field name for date filtering",
    }),
    ApiResponse({
      status: 200,
      description: "Company documents retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.companyDocumentsRetrieved },
          data: {
            type: "object",
            properties: {
              data: { type: "array" },
              count: { type: "number", example: 10 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Failed to retrieve company documents",
    })
  );
}

// Swagger metadata for :id/locations endpoint
export function getCompanyLocationsSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(GetCompaniesDto),
    ApiOperation({
      summary: "Get Company Locations",
      description: "Retrieves a paginated list of locations (addresses) associated with a specific company.",
    }),
    ApiParam({
      name: "id",
      description: "Company ID",
      type: Number,
      example: 101,
    }),
    ApiQuery({
      name: "page",
      required: false,
      type: Number,
      description: "Page number",
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
      name: "search",
      required: false,
      type: String,
      description: "Search term for filtering locations",
    }),
    ApiQuery({
      name: "searchBy",
      required: false,
      type: String,
      description: "Field to search by",
    }),
    ApiQuery({
      name: "from",
      required: false,
      type: String,
      description: "Start date for filtering (ISO format)",
    }),
    ApiQuery({
      name: "to",
      required: false,
      type: String,
      description: "End date for filtering (ISO format)",
    }),
    ApiQuery({
      name: "field",
      required: false,
      type: String,
      description: "Field name for date filtering",
    }),
    ApiResponse({
      status: 200,
      description: "Company locations retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.companyLocationsRetrieved },
          data: {
            type: "object",
            properties: {
              data: { type: "array" },
              count: { type: "number", example: 5 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Failed to retrieve company locations",
    })
  );
}

// Swagger metadata for the migrateCompanies method
export function migrateCompaniesSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiQuery({
      name: "batchSize",
      required: false,
      type: Number,
      description: "unique_id groups to process per batch (default 100 / COMPANY_MIGRATION_BATCH_SIZE).",
    }),
    ApiOperation({
      summary: "Migrate company/contact/address records from a stored-procedure-backed source",
      description:
        "Calls the configured migration stored procedure (COMPANY_MIGRATION_PROC_NAME, defaults to the sample sp_create_company_csv_data) to refresh its 4 source views (company, contact, company_address, contact_address — COMPANY_MIGRATION_VIEW_* env vars), reads all 4 in full, and immediately uploads each as-is to S3 under migrate_company_log/migrate_company_log_<sheet>_<runId>.csv as a daily audit record. Rows across the 4 sheets are correlated by their shared unique_id, then processed in batches (default 100 unique_id groups) — validating the company and contact rows (required fields + FK checks), with company_address/contact_address treated as best-effort (a missing/invalid address doesn't block the company/contact insert). Valid groups are inserted into company, contact, address, company_address, contact_address, and company_contact_map — all within a per-batch transaction, so a failed batch doesn't roll back earlier committed batches. Every validation failure is persisted to company_migration_error_log (keyed by migrationRunId), and ALL of this run's failures are unconditionally uploaded to S3 under migrate_company_error_log/migrate_company_error_log_<runId>.csv. Every successfully-created company from this run is also exported to S3 under migrate_company_success_log/migrate_company_success_log_<runId>.csv (company_id, unique_id, company_name, created_at) for cross-referencing against the client's source system. Note: there is no cross-run duplicate detection — re-running against unchanged source data will insert duplicate company/contact/address rows (matches the legacy one-off script's behavior; a deliberate simplification, not an oversight).",
    }),
    ApiResponse({
      status: 200,
      description: "Migration completed — see response for aggregate counts, per-batch status, and the S3 locations of the raw/error CSVs",
      schema: {
        properties: {
          migrationRunId: { type: "string" },
          totalGroups: { type: "number" },
          totalBatches: { type: "number" },
          validGroups: { type: "number" },
          errorGroups: { type: "number" },
          insertedIntoCompany: { type: "number" },
          insertedIntoContact: { type: "number" },
          insertedIntoAddress: { type: "number" },
          insertedIntoCompanyAddress: { type: "number" },
          insertedIntoContactAddress: { type: "number" },
          insertedIntoCompanyContactMap: { type: "number" },
          errorLogTable: { type: "string" },
          batches: {
            type: "array",
            items: {
              properties: {
                batchNumber: { type: "number" },
                groupsRead: { type: "number" },
                validGroups: { type: "number" },
                errorGroups: { type: "number" },
                status: { type: "string", enum: ["completed", "failed"] },
                error: { type: "string", nullable: true },
                durationMs: { type: "number", nullable: true },
              },
            },
          },
          rawDataCsvKeys: {
            type: "object",
            properties: {
              company: { type: "string", nullable: true },
              contact: { type: "string", nullable: true },
              companyAddress: { type: "string", nullable: true },
              contactAddress: { type: "string", nullable: true },
            },
          },
          errorCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of this run's error CSV (migrate_company_error_log/migrate_company_error_log_<runId>.csv), null if there were no errors, the upload failed, or S3 isn't configured",
          },
          successCsvKey: {
            type: "string",
            nullable: true,
            description: "S3 key of this run's success CSV — one row per created company: company_id, unique_id, company_name, created_at (migrate_company_success_log/migrate_company_success_log_<runId>.csv), null if the upload failed or S3 isn't configured",
          },
        },
      },
    }),
    ApiResponse({ status: 500, description: "Internal Server Error" }),
  );
}