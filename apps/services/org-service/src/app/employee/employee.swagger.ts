import { applyDecorators } from "@nestjs/common";
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
} from "@nestjs/swagger";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";
import { EmployeeResponseDto } from "./dto/get-employee.dto";
import { GetEmployeesDto } from "./dto/get-empolyees-query.dto";
import {
  successMessage,
  infoMessages,
  errorMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";

export function addEmployeeSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateEmployeeDto, EmployeeResponseDto),
    ApiOperation({
      summary: "Add a new employee",
      description: "Creates a new employee with the provided details.",
    }),
    ApiBody({
      description: "Details of the employee to be created.",
      schema: {
        $ref: getSchemaPath(CreateEmployeeDto),
      },
    }),
    ApiResponse({
      status: 201,
      description: successMessage.employeeCreation,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 201 },
          message: { type: "string", example: successMessage.employeeCreation },
          data: {
            $ref: getSchemaPath(EmployeeResponseDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Bad Request" },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    })
  );
}

export function getEmployeesSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(GetEmployeesDto, EmployeeResponseDto),
    ApiOperation({
      summary: "Get all employees",
      description:
        "Fetches all employees with optional search, sorting, and pagination.",
    }),
    ApiQuery({
      name: "page",
      required: false,
      example: 1,
      description: "Page number for pagination (optional).",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      example: 10,
      description: "Number of records per page (optional).",
    }),
    ApiQuery({
      name: "search",
      required: false,
      example: "John",
      description: "Search term to filter results (optional).",
    }),
    ApiQuery({
      name: "sort",
      required: false,
      example: "firstName:ASC",
      description: "Sorting criteria (optional).",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.employeeListRetrieval,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.employeeListRetrieval,
          },
          data: {
            type: "array",
            items: { $ref: getSchemaPath(EmployeeResponseDto) },
          },
          count: { type: "number", example: 100 },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: infoMessages.noEmployees,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: infoMessages.noEmployees },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    })
  );
}

export function getEmployeeByIdSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(EmployeeResponseDto),
    ApiOperation({
      summary: "Get an employee by ID",
      description: "Retrieves details of a specific employee by their ID.",
    }),
    ApiParam({
      name: "employeeId",
      required: true,
      example: 1,
      description: "The ID of the employee to retrieve.",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.employeeRetrieval,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.employeeRetrieval,
          },
          data: {
            $ref: getSchemaPath(EmployeeResponseDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: infoMessages.employeeNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: infoMessages.employeeNotFound },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    })
  );
}

export function getEmployeeHierarchySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get employee hierarchy by root User ID",
      description:
        "Retrieves the organizational hierarchy starting from the given root User ID.",
    }),
    ApiParam({
      name: "userId",
      required: true,
      example: 1,
      description: "The User ID of the root employee for the hierarchy.",
      type: "number",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.employeeHierarchyRetrieval,
      // Define a schema for your hierarchy data if you have one,
      // otherwise, a generic object or array example.
      schema: {
        type: "object", // Or 'array' depending on your hierarchy structure
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.employeeHierarchyRetrieval,
          },
          data: {
            type: "object", // Or 'array'
            example: { message: "Hierarchy data for userId 1 (to be implemented)" },
            description: "The employee hierarchy data.",
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: infoMessages.employeeHierarchyNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: {
            type: "string",
            example: infoMessages.employeeHierarchyNotFound,
          },
        },
      },
    }),
    // Add other common error responses like 500 if needed
    ApiResponse({ status: 500, description: "Internal server error." })
  );
}

export function updateEmployeeSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateEmployeeDto, EmployeeResponseDto),
    ApiOperation({
      summary: "Update an employee",
      description: "Updates the details of an existing employee.",
    }),
    ApiParam({
      name: "employeeId",
      required: true,
      example: 1,
      description: "The ID of the employee to update.",
    }),
    ApiBody({
      description: "Details of the employee to be updated.",
      schema: {
        $ref: getSchemaPath(CreateEmployeeDto),
      },
    }),
    ApiResponse({
      status: 200,
      description: successMessage.employeeUpdate,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.employeeUpdate },
          data: {
            $ref: getSchemaPath(EmployeeResponseDto),
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: infoMessages.employeeNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: infoMessages.employeeNotFound },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid input data.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "Bad Request Exception" },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    })
  );
}

export function deleteEmployeeSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Delete an employee",
      description: "Deletes an employee by their ID.",
    }),
    ApiParam({
      name: "employeeId",
      required: true,
      example: 1,
      description: "The ID of the employee to delete.",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.employeeDeletion,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.employeeDeletion },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: infoMessages.employeeNotFound,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: infoMessages.employeeNotFound },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    })
  );
}

export function getListOfEmployeesValuesSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(GetEmployeesDto, EmployeeResponseDto),
    ApiOperation({
      summary: "Get a lightweight list of employees",
      description:
        "Retrieves a list of employees with limited fields for dropdown or lightweight use cases. Supports pagination, sorting, and search.",
    }),
    ApiQuery({
      name: "page",
      required: false,
      example: 1,
      description: "Page number for pagination (optional).",
    }),
    ApiQuery({
      name: "limit",
      required: false,
      example: 10,
      description: "Number of records per page (optional).",
    }),
    ApiQuery({
      name: "search",
      required: false,
      example: "John",
      description: "Search term to filter results (optional).",
    }),
    ApiQuery({
      name: "sort",
      required: false,
      example: "firstName:ASC",
      description: "Sorting criteria (optional).",
    }),
    ApiResponse({
      status: 200,
      description: successMessage.employeeListRetrieval,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: successMessage.employeeListRetrieval,
          },
          data: {
            type: "array",
            items: { $ref: getSchemaPath(EmployeeResponseDto) },
          },
          count: { type: "number", example: 100 },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: infoMessages.noEmployees,
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 404 },
          message: { type: "string", example: infoMessages.noEmployees },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    })
  );
}

export function rebuildHierarchySwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Rebuild employee hierarchy",
      description:
        "Triggers a full rebuild of the employee_hierarchy table. This can be a long-running operation.",
    }),
    ApiResponse({
      status: 200,
      description: "Employee hierarchy rebuild process initiated successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Employee hierarchy rebuild process initiated successfully.",
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error during hierarchy rebuild.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: {
            type: "string",
            example: "Failed to rebuild employee hierarchy",
          },
        },
      },
    })
  );
}

export function reportingChainSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get reporting chains for a batch of employees",
      description:
        "For each given userId, returns their ordered reporting chain (root manager -> ... -> the employee), read from the precomputed employee_hierarchy table. Intended for grid display, e.g. the Employee Listing page.",
    }),
    ApiResponse({
      status: 200,
      description: "Reporting chains fetched successfully.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Reporting chains fetched successfully." },
          data: {
            type: "object",
            description: "Map of userId -> ordered chain of {userId, firstName, lastName}, root first.",
            example: {
              1: [
                { userId: 10, firstName: "System", lastName: "Admin" },
                { userId: 1, firstName: "Ramakrishna", lastName: "" },
              ],
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error.",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 500 },
          message: { type: "string", example: "Internal server error." },
        },
      },
    })
  );
}

// Swagger metadata for inception-create-employee endpoint
export function inceptionCreateEmployeeSwaggerMetadata() {
  return applyDecorators(
    ApiBearerAuth("access-token"),
    ApiExtraModels(CreateEmployeeDto),
    ApiOperation({
      summary: "Bulk Create Employees (Inception)",
      description: "Creates multiple employees in a single request for initial data load or bulk import operations.",
    }),
    ApiBody({
      description: "Array of employee creation payloads",
      schema: {
        type: "array",
        items: {
          $ref: getSchemaPath(CreateEmployeeDto),
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: "Employees created successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.employeeCreation },
          data: {
            type: "array",
            items: {
              type: "object",
              properties: {
                employeeId: { type: "number", example: 301 },
                firstName: { type: "string", example: "John" },
                lastName: { type: "string", example: "Doe" },
                emailId: { type: "string", example: "john.doe@company.com" },
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
      status: 500,
      description: "Internal server error",
    })
  );
}

// Swagger metadata for password-reset/validate endpoint
export function validateResetTokenSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Validate Password Reset Token",
      description: "Validates whether a password reset token is valid and not expired.",
    }),
    ApiQuery({
      name: "token",
      required: true,
      type: String,
      description: "Password reset token",
      example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    }),
    ApiResponse({
      status: 200,
      description: "Token is valid",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.employeeRetrieval },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid or expired token",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
    })
  );
}

// Swagger metadata for password-reset endpoint
export function resetPasswordSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Reset Password",
      description: "Resets an employee's password using a valid reset token.",
    }),
    ApiBearerAuth("access-token"),
    ApiBody({
      description: "Password reset payload",
      schema: {
        type: "object",
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          password: { type: "string", example: "NewSecurePassword123!" },
        },
        required: ["token", "password"],
      },
    }),
    ApiResponse({
      status: 200,
      description: "Password reset successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.passwordUpdated },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid or expired token",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
    })
  );
}

// Swagger metadata for ibp-password-reset endpoint
export function ibpResetPasswordSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "IBP Password Reset",
      description: "Resets a company employee's password for IBP portal using a valid reset token.",
    }),
    ApiBody({
      description: "IBP password reset payload",
      schema: {
        type: "object",
        properties: {
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          password: { type: "string", example: "NewSecurePassword123!" },
          companyId: { type: "number", example: 101 },
        },
        required: ["token", "password"],
      },
    }),
    ApiResponse({
      status: 200,
      description: "Password reset successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.passwordUpdated },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Invalid or expired token",
    }),
    ApiResponse({
      status: 500,
      description: "Internal server error",
    })
  );
}

// Swagger metadata for password-reset-mail/:emailId endpoint
export function sendPasswordResetMailSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Send Password Reset Email",
      description: "Sends a password reset email to the specified employee email address.",
    }),
    ApiParam({
      name: "emailId",
      description: "Employee email address",
      type: String,
      example: "john.doe@company.com",
    }),
    ApiQuery({
      name: "source",
      required: false,
      type: String,
      description: "Source of the reset request (e.g. 'ibp')",
      example: "ibp",
    }),
    ApiResponse({
      status: 200,
      description: "Password reset email sent successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.passwordResetMailSent },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Employee not found",
    }),
    ApiResponse({
      status: 500,
      description: "Failed to send password reset email",
    })
  );
}

// Swagger metadata for ibp-password-reset-mail/:emailId endpoint
export function sendIBPPasswordResetMailSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Send IBP Password Reset Email",
      description: "Sends a password reset email to the specified company user for IBP portal access.",
    }),
    ApiParam({
      name: "emailId",
      description: "Company user email address",
      type: String,
      example: "user@company.com",
    }),
    ApiQuery({
      name: "source",
      required: false,
      type: String,
      description: "Source of the reset request (e.g., 'ibp')",
      example: "ibp",
    }),
    ApiResponse({
      status: 200,
      description: "Password reset email sent successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.passwordResetMailSent },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "User with email not found",
    }),
    ApiResponse({
      status: 500,
      description: "Failed to send password reset email",
    })
  );
}

// Swagger metadata for company-employee-password-reset-mail/:emailId endpoint
export function sendCompanyEmployeePasswordResetMailSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Send Company Employee Password Reset Email",
      description: "Sends a password reset email to a company employee for portal access.",
    }),
    ApiParam({
      name: "emailId",
      description: "Company employee email address",
      type: String,
      example: "employee@clientcompany.com",
    }),
    ApiResponse({
      status: 200,
      description: "Password reset email sent successfully",
      schema: {
        type: "object",
        properties: {
          status: { type: "number", example: 200 },
          message: { type: "string", example: successMessage.passwordResetMailSent },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "Company employee not found",
    }),
    ApiResponse({
      status: 500,
      description: "Failed to send password reset email",
    })
  );
}
