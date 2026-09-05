import { applyDecorators } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiExtraModels,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { UpsertEnrollmentDataDto } from "./dto/upsert-enrollment-data.dto";
import { EnrollmentBatchKeyDto } from "./dto/enrollment-batch-key.dto";
import { GetCompanyEmployeePolicyDetails } from "./dto/get-employee-details-with-components.dto";
import { successMessage, errorMessages } from '../../../../../../libs/service-lib/src/lib/messages';
import { CreatePolicyEmployeeComponentDto } from './dto/create-policy-employee-component.dto';
import { UpdatePolicyEmployeeComponentDto } from './dto/update-policy-employee-component.dto';
import { UpdatePolicyEmployeeEnrollmentStatusDto } from './dto/update-policy-employee-enrollment-status.dto';
import { UpdateEmployeeDetails } from './dto/update-employee-details.dto';
import { ProcessEmployeeUploadDto } from './dto/process-employee-upload.dto';
import { UpdateCompanyEmployeePassword } from '../../../../service-lib/src/lib/dto/company-employee-password-update.dto';

export function loginSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: 'User Login',
      description:
        'Validates user credentials and returns access and refresh tokens.',
    }),
    ApiBody({
      description: 'User login credentials',
      schema: {
        type: 'object',
        properties: {
          userName: { type: 'string', example: 'john_doe' },
          password: { type: 'string', example: 'password123' },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Login successful',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 200 },
          message: { type: 'string', example: successMessage.userLoggedIn },
          data: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'object',
                properties: {
                  accessToken: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                  refreshToken: {
                    type: 'string',
                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                  },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid credentials',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Invalid Credentials' },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'User not found',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: errorMessages.userNotFound },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 500 },
          message: { type: 'string', example: 'An unexpected error occurred' },
        },
      },
    })
  );
}

export const createPolicyEmployeeComponentSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Create policy employee component' }),
    ApiQuery({
      name: 'submit',
      required: false,
      enum: ['true', 'false'],
      example: 'false',
    }),
    ApiBody({ type: [CreatePolicyEmployeeComponentDto] }),
    ApiResponse({ status: 201, description: successMessage.componentsCreated }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
  );

export const updatePolicyEmployeeComponentSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Create or update policy employee components' }),
    ApiQuery({
      name: 'submit',
      required: false,
      enum: ['true', 'false'],
      example: 'false',
    }),
    ApiBody({ type: [UpdatePolicyEmployeeComponentDto] }),
    ApiResponse({ status: 200, description: successMessage.componentsSaved }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
  );

export const updatePolicyEmployeeEnrollmentStatusSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Update employee enrollment status" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiBody({ type: UpdatePolicyEmployeeEnrollmentStatusDto }),
    ApiResponse({ status: 200, description: "Status updated" }),
    ApiResponse({ status: 400, description: "Bad Request" })
  );

export const getEmployeeDetailsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get employee details" }),
    ApiResponse({ status: 200, description: "Employee details retrieved" }),
    ApiResponse({ status: 400, description: "Bad Request" })
  );

export const updateCompanyEmployeePasswordSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Update company employee password' }),
    ApiBody({ type: UpdateCompanyEmployeePassword }),
    ApiResponse({ status: 200, description: 'Employee passsword updated' }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
  );

export const updateEmployeeDetailsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Update employee details" }),
    ApiParam({ name: "employeeId", description: "Employee ID", type: Number }),
    ApiBody({ type: UpdateEmployeeDetails }),
    ApiResponse({ status: 200, description: "Employee details updated" }),
    ApiResponse({ status: 400, description: "Bad Request" })
  );

export const getEmployeePolicyComponentDetailsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get employee policy component details" }),
    ApiBody({ type: GetCompanyEmployeePolicyDetails }),
    ApiResponse({
      status: 200,
      description: "Employee policy details retrieved",
    }),
    ApiResponse({ status: 400, description: "Bad Request" })
  );

export const getRelationsConstraintsAndDependentsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get relations, constraints, dependents and choices",
    }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiParam({ name: "employeeId", description: "Employee ID", type: Number }),
    ApiResponse({
      status: 200,
      description: "Relations, dependents and choices retrieved",
    }),
    ApiResponse({ status: 400, description: "Bad Request" })
  );

export const listEmployeePoliciesSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "List employee policies info" }),
    ApiParam({ name: "employeeId", description: "Employee ID", type: Number }),
    ApiResponse({ status: 200, description: successMessage.policiesRetrieved }),
    ApiResponse({ status: 400, description: "Bad Request" })
  );

export const saveEnrollmentSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Save enrollment data for a policy" }),
    ApiBody({
      description: "Payload to save enrollment data",
      type: UpsertEnrollmentDataDto,
    }),
    ApiResponse({
      status: 200,
      description: "Enrollment data saved successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Validation failed or invalid data",
    })
  );

export const updateEnrollmentSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Update enrollment data for a policy" }),
    ApiBody({
      description: "Payload to update enrollment data",
      type: UpsertEnrollmentDataDto,
    }),
    ApiResponse({
      status: 200,
      description: "Enrollment data updated successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Validation failed or invalid data",
    })
  );

export const batchEnrollmentSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Process enrollment data in batch" }),
    ApiBody({ type: EnrollmentBatchKeyDto }),
    ApiResponse({
      status: 200,
      description: "Enrollment batch processed successfully",
    }),
    ApiResponse({ status: 400, description: "Bad Request" })
  );

export const processEmployeeUploadSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Process company employee upload file" }),
    ApiBody({ type: ProcessEmployeeUploadDto }),
    ApiResponse({ status: 202, description: "Upload processing started" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
    ApiResponse({ status: 404, description: "Not Found" })
  );

export const uploadEmployeeFileSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Upload company employee file",
      description:
        "Uploads a file for the specified companyType. For companyType=policyFeature only PDF files up to 25MB are accepted.",
    }),
    ApiConsumes("multipart/form-data"),
    ApiBody({
      description: "Upload a file that contains company employee data",
      schema: {
        type: "object",
        properties: {
          file: { type: "string", format: "binary" },
          companyType: { type: "string", example: "policyFeature" },
          documentTypeLid: { type: "integer", example: 101 },
          companyId: { type: "integer", example: 123 },
        },
        required: ["file", "companyType"],
      },
    }),
    ApiResponse({
      status: 200,
      description: "File uploaded and queued for processing",
    }),
    ApiResponse({ status: 400, description: "Bad Request" })
  );

export const downloadEmployeeFileSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Download previously uploaded employee file" }),
    ApiParam({
      name: "documentId",
      description: "Document identifier returned at upload time",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "File stream response",
      schema: { type: "string", format: "binary" },
    }),
    ApiResponse({ status: 400, description: "Bad Request" }),
    ApiResponse({ status: 404, description: "Not Found" })
  );

export const getEnrollmentSummarySwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get enrollment summary" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiParam({ name: "employeeId", description: "Employee ID", type: Number }),
    ApiResponse({ status: 200, description: "Enrollment summary retrieved" }),
    ApiResponse({ status: 400, description: "Bad Request" })
  );

export const getEmployeeFaqsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ 
      summary: "Get FAQs for employee's mapped policies",
      description: "Retrieve FAQs for all active policies mapped to the employee with optional category filtering, search, and pagination support."
    }),
    ApiQuery({
      name: "employeeId",
      description: "Employee ID to fetch FAQs for their mapped policies",
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
      description: "Employee FAQs retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 200 },
          message: { type: "string", example: "Employee FAQs retrieved successfully" },
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
                    policyName: { type: "string", example: "Health Insurance Premium" },
                    category: { type: "string", example: "Claims" },
                    question: { type: "string", example: "How do I file a claim?" },
                    answer: { type: "string", example: "To file a claim, you need to..." },
                    displayOrder: { type: "integer", example: 1 },
                    createdAt: { type: "string", example: "2024-01-15T10:30:00Z" },
                  },
                },
              },
              pagination: {
                type: "object",
                properties: {
                  page: { type: "integer", example: 1 },
                  limit: { type: "integer", example: 20 },
                  total: { type: "integer", example: 150 },
                  totalPages: { type: "integer", example: 8 },
                },
              },
              availableCategories: {
                type: "array",
                items: { type: "string" },
                example: ["Claims", "Coverage", "Premium", "General"],
              },
              sourcePolicyIds: {
                type: "array",
                items: { type: "integer" },
                example: [12345, 67890, 11111],
              },
              total: { type: "integer", example: 150 },
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
          message: { type: "string", example: "Employee ID must be a valid positive number" },
          error: { type: "string", example: "Bad Request" },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: "No policies found for employee",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 404 },
          message: { type: "string", example: "No active policies found for employee" },
          error: { type: "string", example: "Not Found" },
        },
      },
    }),
  ApiResponse({
    status: 500,
    description: "Internal Server Error",
    schema: {
      type: "object",
        properties: {
          statusCode: { type: "integer", example: 500 },
          message: { type: "string", example: "Failed to retrieve employee FAQs" },
          error: { type: "string", example: "Internal Server Error" },
        },
      },
    })
  );
