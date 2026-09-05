import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from "@nestjs/swagger";
import { BulkEditRequestDto } from "./dto/bulk-edit-request.dto";
import { ValidationResultDto } from "./dto/bulk-edit-result.dto";

// Swagger metadata for the validateBulkEdit method
export function validateBulkEditSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(BulkEditRequestDto, ValidationResultDto),
    ApiOperation({
      summary: "Validate bulk edit request",
      description:
        'Validates a bulk edit request before execution. Checks entity types, field permissions, record limits, and business rules. Requires authentication and "Bulk Edit" privilege.',
    }),
    ApiBody({
      description: "Bulk edit validation request payload",
      schema: {
        $ref: getSchemaPath(BulkEditRequestDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: "Validation completed successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Bulk edit request validated successfully",
          },
          data: {
            $ref: getSchemaPath(ValidationResultDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid request data or validation failed",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Invalid bulk edit request data",
          },
          errors: {
            type: "array",
            items: {
              type: "object",
              properties: {
                field: { type: "string", example: "entityType" },
                message: {
                  type: "string",
                  example: "Invalid entity type specified",
                },
              },
            },
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
      description:
        "Forbidden - User does not have the required 'Bulk Edit' privilege",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 403 },
          message: {
            type: "string",
            example: "Access denied. User doesn't have 'Bulk Edit' privilege.",
          },
        },
      },
    }),
    ApiResponse({
      status: 422,
      description: "Validation failed - Business rule violations detected",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 422 },
          message: { type: "string", example: "Bulk edit validation failed" },
          data: {
            type: "object",
            properties: {
              isValid: { type: "boolean", example: false },
              errors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    errorCode: {
                      type: "string",
                      example: "INVALID_FIELD_VALUE",
                    },
                    errorMessage: {
                      type: "string",
                      example:
                        "Field 'invalidField' is not bulk editable for entity 'COMPANY'",
                    },
                    fieldName: { type: "string", example: "invalidField" },
                    recordId: { type: "number", example: 0 },
                  },
                },
              },
              warnings: {
                type: "array",
                items: { type: "string" },
                example: [
                  "Large batch operation: 500 records. Consider breaking into smaller batches for better performance.",
                ],
              },
            },
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
}

// Swagger metadata for the executeBulkEdit method
export function executeBulkEditSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Execute bulk edit operation",
      description:
        'Executes a bulk edit operation after validation. Routes the request to appropriate entity services (org-service, opportunity-service, policy-service) based on entity type. Requires authentication and "Bulk Edit" privilege.',
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Bulk Edit payload",
      examples: {
        "company-bulk-edit": {
          summary: "Bulk edit companies",
          value: {
            entityType: "COMPANY",
            selectedAll: false,
            excludedIds: [],
            selectedFilterValues: {
              from: "2025-11-10",
              to: "2026-11-09",
              organisationId: {
                label: "IIRM India",
                value: 1,
              },
              sbuId: {
                value: 2,
                label: "Commercial Lines",
              },
              verticalId: {
                value: 104,
                label: "Support Services",
              },
              branchId: {
                value: 3,
                label: "Chennai",
              },
              ownerId: {
                label: "Ramakrishna Vurakaranam",
                value: "2",
              },
              viewBy: {
                label: "Manager + Team",
                value: "team",
              },
              companyType: {
                label: "Public",
                value: "Public",
              },
              priority: {
                label: "VIMP",
                value: "VIMP",
              },
              industrySegment: {
                label: "Agriculture",
                value: "Agriculture",
              },
              city: {
                label: "Adoni",
                value: 3,
              },
              status: {
                label: "Active",
                value: "Active",
              },
              companyName1: "",
            },
            recordIds: [
              329066, 329143, 329083, 329091, 329146, 329116, 329046, 329080,
              329054, 329065,
            ],
            fieldUpdates: {
              leadCrm: 2004,
              statusLid: 901,
              accountManager: 2,
              priorityLid: 3302,
            },
          },
        },
        "opportunity-bulk-edit": {
          summary: "Bulk edit opportunities",
          value: {
            entityKey: "SALES_OPPORTUNITY",
            selectedAll: true,
            includedIds: [],
            excludedIds: [1018691, 682466],
            selectedFilterValues: {
              from: "2025-04-01",
              to: "2026-03-31",
              organisationId: {
                label: "IIRM India",
                value: 1,
              },
              sbuId: {
                value: 1,
                label: "Central Operations",
              },
              verticalId: {
                value: 101,
                label: "Customer Support",
              },
              branchId: {
                value: 2,
                label: "Bangalore",
              },
              ownerId: {
                value: "2",
                label: "Ramakrishna Vurakaranam",
              },
              viewBy: {
                value: "team",
                label: "Manager + Team",
              },
              companyName: {
                value: 294668,
                label: " AGRICULTURAL TRANING CENTRE NAMKOM",
              },
              opportunityPriority: {
                label: "High",
                value: "High",
              },
              opportunityContact: {
                value: 67167,
                label: " Gautam b",
              },
              opportunityPolicyType: {
                label: "All Risk Policy",
                value: "All Risk Policy",
              },
              opportunityIndustrySegment: {
                label: "Advertising",
                value: "Advertising",
              },
              activityName: ["Data Validation"],
              state: {
                value: "BD Planning",
                label: "BD Planning",
              },
              companyName23: "",
            },
            fieldUpdates: {
              bdOwner: 2,
              isgOwner: null,
              status: "ISG Planning",
              expiryDate: "2025-11-11",
            },
          },
        },
        "policy-bulk-edit": {
          summary: "Bulk edit policies",
          value: {
            entityType: "POLICY",
            selectedAll: false,
            excludedIds: [],
            selectedFilterValues: {
              from: "2025-11-10",
              to: "2026-02-09",
              organisationId: {
                label: "IIRM India",
                value: 1,
              },
              sbuId: {
                value: 2,
                label: "Commercial Lines",
              },
              verticalId: {
                value: 103,
                label: "Management",
              },
              branchId: {
                value: 2,
                label: "Bangalore",
              },
              ownerId: {
                label: "Ramakrishna Vurakaranam",
                value: 2,
              },
              viewBy: {
                label: "Manager + Team",
                value: "team",
              },
              companyName: {
                value: 294668,
                label: " AGRICULTURAL TRANING CENTRE NAMKOM",
              },
              policyCompanyPriority: {
                label: "VIMP",
                value: "VIMP",
              },
              policyType: {
                label: "Bharat Sookshma Udyam Suraksha (BSUS)",
                value: "Bharat Sookshma Udyam Suraksha (BSUS)",
              },
              industry: {
                label: "Clinical",
                value: "Clinical",
              },
              renewalPeriod: {
                label: "30 days",
                value: "30 days",
              },
              policyExpiryToDate: "2025-11-11",
              policyExpiryFromDate: "2025-11-26",
              companyName23: "",
            },
            recordIds: [
              556056, 556057, 556053, 556052, 556059, 556060, 556061, 556062,
              556034, 556029,
            ],
            fieldUpdates: {
              ownerId: 1415,
              isgId: 1468,
              amId: 2,
              policyStatusLid: 3101,
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Bulk edit executed successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Bulk edit operation completed successfully",
          },
          data: {
            type: "object",
            properties: {
              totalRecords: { type: "number", example: 2 },
              successCount: { type: "number", example: 2 },
              failureCount: { type: "number", example: 0 },
              errors: {
                type: "array",
                items: { type: "object" },
                example: [],
              },
              affectedRecords: {
                type: "array",
                items: { type: "number" },
                example: [1106288, 1106289],
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description:
        "Bad Request - Invalid request data or execution failed validation",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "Bulk edit request validation failed",
          },
          error: {
            type: "string",
            example: "Invalid entity type or field specified",
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
      description:
        "Forbidden - User does not have the required 'Bulk Edit' privilege",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 403 },
          message: {
            type: "string",
            example: "Access denied. User doesn't have 'Bulk Edit' privilege.",
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Not Found - Specified entity records not found",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: "Some entity records not found" },
        },
      },
    }),
    ApiResponse({
      status: 422,
      description:
        "Unprocessable Entity - Bulk edit operation failed with partial success",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 422 },
          message: {
            type: "string",
            example: "Bulk edit completed with errors",
          },
          data: {
            type: "object",
            properties: {
              totalRecords: { type: "number", example: 10 },
              successCount: { type: "number", example: 7 },
              failureCount: { type: "number", example: 3 },
              errors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    errorCode: { type: "string", example: "RECORD_NOT_FOUND" },
                    errorMessage: {
                      type: "string",
                      example: "Company with ID 123 not found",
                    },
                    fieldName: { type: "string", example: "entityId" },
                    recordId: { type: "number", example: 123 },
                  },
                },
              },
              warnings: {
                type: "array",
                items: { type: "string" },
                example: ["Some records were locked and could not be updated"],
              },
            },
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
          message: {
            type: "string",
            example: "Internal server error during bulk edit execution",
          },
        },
      },
    }),
    ApiResponse({
      status: 503,
      description: "Service Unavailable - External entity service unavailable",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 503 },
          message: {
            type: "string",
            example:
              "Entity service temporarily unavailable. Please try again later.",
          },
        },
      },
    })
  );
}

export function findUsersByRoleSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Find users with same role",
      description:
        "Retrieves all users who share the same roles as the specified user within the same organization. Returns the target user details along with peer users having matching roles.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "userId",
      description: "User ID to find role peers for",
      type: "number",
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: "Users with same role retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Peers with the same role retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  userId: { type: "number", example: 123 },
                  firstName: { type: "string", example: "John" },
                  lastName: { type: "string", example: "Doe" },
                  emailId: { type: "string", example: "john.doe@example.com" },
                  organisationId: { type: "number", example: 1 },
                },
              },
              peers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    userId: { type: "number", example: 456 },
                    firstName: { type: "string", example: "Jane" },
                    lastName: { type: "string", example: "Smith" },
                    emailId: {
                      type: "string",
                      example: "jane.smith@example.com",
                    },
                    organisationId: { type: "number", example: 1 },
                  },
                },
              },
              count: { type: "number", example: 5 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid user ID or user has no roles",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 400 },
          message: {
            type: "string",
            example: "User with id 123 does not have any roles assigned.",
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "User not found",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 404 },
          message: {
            type: "string",
            example: "User with id 123 not found.",
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
            example: "Failed to fetch users by role",
          },
        },
      },
    })
  );
}

export function findUsersByRoleNameSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Find users by role name and organization",
      description:
        "Retrieves all users with the specified role name within the given organization. First finds the role by name, then fetches all users assigned to that role in the specified organization.",
    }),
    ApiBearerAuth("access-token"),
    ApiParam({
      name: "roleName",
      description: "Name of the role to search for",
      type: "string",
      example: "Manager",
    }),
    ApiParam({
      name: "organisationId",
      description: "Organization ID to filter users by",
      type: "number",
      example: 123,
    }),
    ApiResponse({
      status: 200,
      description: "Users by role name retrieved successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Users by role name retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              role: {
                type: "object",
                properties: {
                  id: { type: "number", example: 5 },
                  name: { type: "string", example: "Manager" },
                  description: { type: "string", example: "Management role" },
                  roleKey: { type: "string", example: "ROLE_MANAGER" },
                },
              },
              users: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    userId: { type: "number", example: 456 },
                    firstName: { type: "string", example: "John" },
                    lastName: { type: "string", example: "Doe" },
                    emailId: {
                      type: "string",
                      example: "john.doe@example.com",
                    },
                    organisationId: { type: "number", example: 123 },
                    roles: {
                      type: "array",
                      items: { type: "object" },
                    },
                  },
                },
              },
              totalCount: { type: "number", example: 3 },
            },
          },
        },
      },
    })
  );
}
