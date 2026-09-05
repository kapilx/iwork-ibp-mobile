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
import { UpdateEnrollmentProgressDto, InitializeEnrollmentProgressDto, EnrollmentProgressResponseDto } from "./dto/enrollment-progress.dto";
import { ExtendEnrollmentPeriodDto } from "./dto/extend-enrollment-period.dto";
import { GetCompanyEmployeePolicyDetails } from "./dto/get-employee-details-with-components.dto";
import {
  EmployeePolicyOverviewResponseDto,
  PolicyOverviewItemDto,
  PolicySectionDto,
  CoverageDetailDto,
  ClaimStatusCountsDto,
  ClaimSummaryDto,
  FamilyMemberDto,
  PolicyTabDto,
  LifeEventCtaDto,
  AddOnsDto,
  AddOnSummaryDto,
} from "./dto/employee-policy-overview.dto";
import {
  successMessage,
  errorMessages,
} from "../../../../../../libs/service-lib/src/lib/messages";
import { CreatePolicyEmployeeComponentDto } from "./dto/create-policy-employee-component.dto";
import { UpdatePolicyEmployeeComponentDto } from "./dto/update-policy-employee-component.dto";
import { UpdatePolicyEmployeeEnrollmentStatusDto } from "./dto/update-policy-employee-enrollment-status.dto";
import { EmployeeDetailsDto } from "./dto/get-company-employee-details.dto";
import { UpdateEmployeeDetails } from "./dto/update-employee-details.dto";
import { ProcessEmployeeUploadDto } from "./dto/process-employee-upload.dto";
import { UpdateCompanyEmployeePassword } from "../../../../service-lib/src/lib/dto/company-employee-password-update.dto";
import { EmployeePolicyContactMatrixResponseDto } from "./dto/employee-policy-contact-matrix.dto";
import { EmployeeECardResponseDto } from "./dto/employee-ecard-details.dto";
import { EmployeeECardSignedUrlResponseDto, GetEmployeeECardSignedUrlDto } from "./dto/get-employee-ecard-signed-url.dto";
import {
  CompanyAdditionalDocumentDto,
  CompanyAdditionalDocumentsResponseDto,
} from "./dto/company-additional-documents.dto";
import {
  EmployeePersonalDocumentDto,
  EmployeePersonalDocumentsResponseDto,
  UpsertEmployeePersonalDocumentsDto,
} from "./dto/employee-personal-documents.dto";
import { ProcessEnrollmentDto } from "./dto/process-enrollment.dto";
import { SearchHospitalDto } from "./dto/search-hospital.dto";
import { SearchHospitalsByPoliciesDto } from "./dto/search-hospitals-by-policies.dto";
import { GetPolicyLocationsByPoliciesDto } from "./dto/get-policy-locations-by-policies.dto";
import { CreateUserActivityLogDto } from "./dto/create-user-activity-log.dto";
import { BulkDownloadEmployeeFilesDto } from "./dto/bulk-download-employee-files.dto";

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

export const getPolicyFeatureDocumentByEmployeeSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Retrieve policy feature documents mapped to an employee",
      description:
        "Returns active policy feature documents for every policy linked to the provided employee ID.",
    }),
    ApiQuery({
      name: "employeeId",
      description: "Employee ID from policy_enrollment_employee_policy_map",
      required: true,
      type: Number,
    }),
    ApiQuery({
      name: "search",
      description:
        "Optional free-text search across document title, file name, policy name, subtitle, and uploader name.",
      required: false,
      type: String,
    }),
    ApiQuery({
      name: "category",
      description: "Optional My Documents category filter.",
      required: false,
      enum: ["all", "policies", "claims", "life_events", "personal_documents", "support_tickets", "mail", "other"],
    }),
    ApiQuery({
      name: "documentType",
      description: "Optional My Documents document type filter.",
      required: false,
      enum: [
        "all",
        "policy_certificate",
        "claim_form",
        "life_event_proof",
        "personal_document",
        "communication",
        "document",
      ],
    }),
    ApiQuery({
      name: "sortOrder",
      description: "Optional sort direction for document date ordering.",
      required: false,
      enum: ["latest", "oldest"],
    }),
    ApiResponse({
      status: 200,
      description: "Policy feature documents retrieved successfully.",
    }),
    ApiResponse({ status: 400, description: "Bad Request" })
  );

export const bulkDownloadEmployeeFilesSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Download multiple employee documents as a ZIP",
      description:
        "Accepts document IDs from My Documents and returns a ZIP archive of all valid files.",
    }),
    ApiBody({ type: BulkDownloadEmployeeFilesDto }),
    ApiResponse({
      status: 200,
      description: "ZIP archive stream",
      schema: {
        type: "string",
        format: "binary",
      },
    }),
    ApiResponse({ status: 400, description: "Bad Request" }),
    ApiResponse({ status: 404, description: "No valid documents found" }),
  );

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
    ApiResponse({
      status: 200,
      description: "Employee details retrieved",
      type: EmployeeDetailsDto,
    }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const getEmployeeContactMatrixSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get employee policy contact matrix",
      description:
        "Returns the contact matrix for every policy mapped to the requested employee.",
    }),
    ApiParam({ name: "employeeId", description: "Employee identifier", type: Number }),
    ApiResponse({
      status: 200,
      type: EmployeePolicyContactMatrixResponseDto,
      description: "Employee policy contact matrix retrieved successfully",
    }),
    ApiResponse({ status: 400, description: "Bad Request" })
  );

export const getCompanyPortalConfigurationSwaggerMetadata = () =>
  applyDecorators(
    ApiOperation({
      summary: "Get company portal configuration",
      description: "Returns dashboard and policy configuration for a given company ID.",
    }),
    ApiParam({
      name: "companyId",
      description: "Identifier of the company",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "Company portal configuration retrieved successfully",
    }),
    ApiResponse({ status: 400, description: "Bad Request" }),
    ApiResponse({ status: 500, description: "Internal server error" }),
  );

export const getCompanyAdditionalDocumentsSwaggerMetadata = () =>
  applyDecorators(
    ApiOperation({
      summary: "Get company additional documents",
      description: "Returns the additional document metadata stored on the company record.",
    }),
    ApiParam({
      name: "companyId",
      description: "Identifier of the company",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "Company additional documents retrieved successfully",
      type: CompanyAdditionalDocumentsResponseDto,
    }),
    ApiResponse({ status: 404, description: "Company not found" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
    ApiResponse({ status: 500, description: "Internal server error" }),
  );

export const upsertCompanyAdditionalDocumentsSwaggerMetadata = () =>
  applyDecorators(
    ApiOperation({
      summary: "Upsert company additional documents",
      description:
        "Stores the provided document metadata array on the company record.",
    }),
    ApiParam({
      name: "companyId",
      description: "Identifier of the company",
      type: Number,
    }),
    ApiBody({
      type: [CompanyAdditionalDocumentDto],
      description: "Array of document metadata objects",
    }),
    ApiResponse({
      status: 200,
      description: "Company additional documents saved successfully",
      type: CompanyAdditionalDocumentsResponseDto,
    }),
    ApiResponse({ status: 404, description: "Company not found" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
    ApiResponse({ status: 500, description: "Internal server error" }),
  );

export const getEmployeePersonalDocumentsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get personal documents uploaded by an employee",
      description:
        "Returns the personal file uploads created by the employee so the UI can persist and reuse their document IDs.",
    }),
    ApiParam({
      name: "employeeId",
      description: "Employee ID to fetch personal documents for",
      type: Number,
    }),
    ApiExtraModels(
      EmployeePersonalDocumentsResponseDto,
      EmployeePersonalDocumentDto,
    ),
    ApiResponse({
      status: 200,
      description: "Employee personal documents retrieved successfully",
      schema: {
        allOf: [{ $ref: getSchemaPath(EmployeePersonalDocumentsResponseDto) }],
      },
    }),
    ApiResponse({ status: 404, description: "Employee not found" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
    ApiResponse({ status: 500, description: "Internal server error" }),
  );

export const upsertEmployeePersonalDocumentsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Upsert personal documents uploaded by an employee",
      description:
        "Stores the uploaded personal document metadata array in the employee enrollment record.",
    }),
    ApiParam({
      name: "employeeId",
      description: "Employee ID to store personal documents for",
      type: Number,
    }),
    ApiBody({
      type: UpsertEmployeePersonalDocumentsDto,
      description: "Array of uploaded personal document metadata objects",
    }),
    ApiExtraModels(
      EmployeePersonalDocumentsResponseDto,
      EmployeePersonalDocumentDto,
      UpsertEmployeePersonalDocumentsDto,
    ),
    ApiResponse({
      status: 200,
      description: "Employee personal documents saved successfully",
      schema: {
        allOf: [{ $ref: getSchemaPath(EmployeePersonalDocumentsResponseDto) }],
      },
    }),
    ApiResponse({ status: 404, description: "Employee not found" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
    ApiResponse({ status: 500, description: "Internal server error" }),
  );

export const updateCompanyEmployeePasswordSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth('access-token'),
    ApiOperation({ summary: 'Update company employee password' }),
    ApiBody({ type: UpdateCompanyEmployeePassword }),
    ApiResponse({ status: 200, description: 'Employee passsword updated' }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
  );

export const getEmployeeECardDetailsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get employee e-card details",
      description:
        "Returns GMC e-card details as a flat ecarddata list for e-card rendering.",
    }),
    ApiParam({
      name: "employeeId",
      description: "Employee identifier",
      type: Number,
    }),
    ApiResponse({
      status: 200,
      description: "Employee e-card details retrieved successfully",
      type: EmployeeECardResponseDto,
    }),
    ApiResponse({ status: 404, description: "Employee not found" }),
    ApiResponse({ status: 400, description: "Bad Request" }),
  );

export const getEmployeeECardSignedUrlSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get employee e-card signed URL",
      description:
        "Returns a pre-signed URL for the employee e-card PDF stored as `uploads/e-cards/company/{companyId}/{companyEmployeeId}.pdf`.",
    }),
    ApiBody({ type: GetEmployeeECardSignedUrlDto }),
    ApiResponse({
      status: 200,
      description: "Signed URL generated successfully",
      type: EmployeeECardSignedUrlResponseDto,
    }),
    ApiResponse({ status: 400, description: "Bad Request" }),
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

export const getPolicyEmployeeInsuredDetailsSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({ summary: "Get policy employee insured details" }),
    ApiParam({ name: "policyId", description: "Policy ID", type: Number }),
    ApiQuery({
      name: "page",
      description: "Page number",
      required: false,
      type: Number,
    }),
    ApiQuery({
      name: "limit",
      description: "Page size",
      required: false,
      type: Number,
    }),
    ApiQuery({
      name: "relationshipGroup",
      description: "Relationship group filter",
      required: false,
      type: String,
    }),
    ApiQuery({
      name: "claimStatus",
      description: "Claim status filter",
      required: false,
      type: String,
    }),
    ApiQuery({
      name: "effectiveFrom",
      description: "Effective from date (YYYY-MM-DD)",
      required: false,
      type: String,
    }),
    ApiQuery({
      name: "effectiveTo",
      description: "Effective to date (YYYY-MM-DD)",
      required: false,
      type: String,
    }),
    ApiQuery({
      name: "searchBy",
      description: "Search by insured name",
      required: false,
      type: String,
    }),
    ApiQuery({
      name: "search",
      description: "Smart search query",
      required: false,
      type: String,
    }),
    ApiResponse({
      status: 200,
      description: "Employee insured details retrieved",
    }),
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

export const getEmployeePolicyOverviewSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get policy overview for an employee",
      description:
        "Retrieve the base and parental coverage/claims summary for all policies mapped to the employee.",
    }),
    ApiParam({
      name: "employeeId",
      description: "Employee ID to fetch the policy overview for",
      type: Number,
    }),
    ApiExtraModels(
      EmployeePolicyOverviewResponseDto,
      PolicyOverviewItemDto,
      PolicySectionDto,
      CoverageDetailDto,
      ClaimStatusCountsDto,
      ClaimSummaryDto,
      FamilyMemberDto,
      PolicyTabDto,
      LifeEventCtaDto,
      AddOnsDto,
      AddOnSummaryDto,
    ),
    ApiResponse({
      status: 200,
      description: "Employee policy claims overview retrieved successfully",
      schema: {
        allOf: [{ $ref: getSchemaPath(EmployeePolicyOverviewResponseDto) }],
      },
    }),
    ApiResponse({ status: 400, description: "Bad Request" }),
    ApiResponse({ status: 404, description: "Employee not found" }),
  );

export function processEnrollmentSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Process Enrollment",
      description:
        "Initiates the enrollment process for a policy. Validates that no in-progress enrollments exist before starting batch processing.",
    }),
    ApiBearerAuth(),
    ApiBody({
      type: ProcessEnrollmentDto,
      description:
        "Enrollment processing details including file ID, policy ID, and optional endorsement ID",
    }),
    ApiResponse({
      status: 202,
      description: "Batch processing started",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 202 },
          message: { type: "string", example: "Batch processing started" },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description:
        "Bad Request - In-progress enrollments found or validation error",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 400 },
          message: { type: "string", example: "In-progress enrollments found" },
        },
      },
    }),
    ApiResponse({ status: 401, description: "Unauthorized" }),
    ApiResponse({ status: 500, description: "Internal Server Error" }),
  );
}

export function searchHospitalsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Search Hospitals",
      description:
        "Search and filter hospitals across multiple policies with pagination support. Filter by location (state, city, pin code), hospital name, or network classification.",
    }),
    ApiBearerAuth(),
    ApiBody({
      type: SearchHospitalsByPoliciesDto,
      description:
        "Policy IDs and optional filters. Returns unique hospitals across all provided policies.",
    }),
    ApiResponse({
      status: 200,
      description: "Hospitals retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Hospitals retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    hospitalId: { type: "number", example: 1 },
                    hospitalName: {
                      type: "string",
                      example: "Apollo Hospital",
                    },
                    address: { type: "string", example: "123 Main Street" },
                    city: { type: "string", example: "Mumbai" },
                    state: { type: "string", example: "Maharashtra" },
                    pinCode: { type: "string", example: "400001" },
                    isNetworkHospital: { type: "boolean", example: true },
                  },
                },
              },
              count: { type: "number", example: 150 },
              networkHospitalCount: { type: "number", example: 120 },
              excludedHospitalCount: { type: "number", example: 30 },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid parameters or missing userid header",
    }),
    ApiResponse({ status: 401, description: "Unauthorized" }),
    ApiResponse({ status: 500, description: "Internal Server Error" }),
  );
}

export function createPolicyHospitalSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Add Hospital To Policy",
      description:
        "Creates (or reuses) a hospital in master tables and maps it to a policy. Intended for reimbursement/manual hospital addition from IBP.",
    }),
    ApiBearerAuth(),
    ApiParam({
      name: "policyId",
      type: "number",
      description: "Policy ID to map the hospital to",
      example: 123,
    }),
    ApiBody({
      schema: {
        type: "object",
        properties: {
          hospitalName: { type: "string", example: "Apollo Hospital" },
          addressLine1: { type: "string", example: "123 Main Street" },
          addressLine2: { type: "string", example: "Near Central Park" },
          landmark: { type: "string", example: "Opp. Metro Station" },
          city: { type: "string", example: "Hyderabad" },
          state: { type: "string", example: "Telangana" },
          country: { type: "string", example: "India" },
          pinCode: { type: "string", example: "500001" },
          code: { type: "string", example: "APOLLO-HYD-001" },
          email: { type: "string", example: "helpdesk@apollo.com" },
          phoneNumber: { type: "string", example: "9876543210" },
          isNetworkHospital: { type: "boolean", example: false, default: false },
        },
        required: ["hospitalName", "addressLine1", "city", "state"],
      },
    }),
    ApiResponse({
      status: 201,
      description: "Hospital created/mapped successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 201 },
          message: { type: "string", example: "Hospital added successfully" },
          data: {
            type: "object",
            properties: {
              policyId: { type: "number", example: 712840 },
              hospitalId: { type: "number", example: 101 },
              existed: { type: "boolean", example: false },
              mappingExisted: { type: "boolean", example: false },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 400, description: "Bad Request" }),
    ApiResponse({ status: 401, description: "Unauthorized" }),
    ApiResponse({ status: 500, description: "Internal Server Error" }),
  );
}

export const createUserActivityLogSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Create user activity log",
      description:
        "Creates a user activity log entry. userId can be sent in payload or derived from userid request header.",
    }),
    ApiBody({ type: CreateUserActivityLogDto }),
    ApiResponse({
      status: 201,
      description: "User activity log created successfully",
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request",
    }),
    ApiResponse({
      status: 500,
      description: "Internal Server Error",
    }),
  );

export const getNotificationInfoByIdSwaggerMetadata = () =>
  applyDecorators(
    ApiBearerAuth("access-token"),
    ApiOperation({
      summary: "Get Notification Info by ID",
      description:
        "Retrieves a specific notification info record for the logged-in employee by its ID.",
    }),
    ApiParam({
      name: "id",
      type: Number,
      description: "Notification info ID",
      example: 55112,
    }),
    ApiResponse({
      status: 200,
      description: "Notification info retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Notification info retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              id: { type: "number", example: 55112 },
              toRecipients: {
                type: "array",
                items: { type: "string" },
              },
              ccRecipients: {
                type: "array",
                items: { type: "string" },
              },
              fromSender: { type: "string", nullable: true },
              subject: { type: "string" },
              notificationType: { type: "string" },
              templateId: { type: "number", nullable: true },
              variables: { type: "object", nullable: true },
              renderedHtml: { type: "string", nullable: true },
              provider: { type: "string", nullable: true },
              status: { type: "string" },
              providerMessageId: { type: "string", nullable: true },
              error: { type: "string", nullable: true },
              createdAt: { type: "string", nullable: true },
              createdBy: { type: "number", nullable: true },
              sentAt: { type: "string", nullable: true },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "Notification info not found" }),
    ApiResponse({ status: 500, description: "Internal Server Error" }),
  );

export function exportHospitalsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Export Hospitals to Excel",
      description:
        "Export filtered hospital list to Excel format. Supports the same filters as the search endpoint.",
    }),
    ApiBearerAuth(),
    ApiParam({
      name: "policyId",
      type: "number",
      description: "Policy ID to export hospitals for",
      example: 123,
    }),
    ApiExtraModels(SearchHospitalDto),
    ApiQuery({
      name: "query",
      required: false,
      type: SearchHospitalDto,
      style: "form",
      explode: true,
    }),
    ApiResponse({
      status: 200,
      description: "Excel file generated successfully",
      content: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
          schema: {
            type: "string",
            format: "binary",
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid parameters or missing userid header",
    }),
    ApiResponse({ status: 401, description: "Unauthorized" }),
    ApiResponse({ status: 500, description: "Internal Server Error" }),
  );
}

export function getPolicyLocationsSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get Policy Location Data",
      description:
        "Retrieve available states and cities across multiple policies. Optionally filter cities by state.",
    }),
    ApiBearerAuth(),
    ApiBody({
      type: GetPolicyLocationsByPoliciesDto,
      description:
        "Policy IDs and optional state filter. Returns unique states/cities across all provided policies.",
    }),
    ApiResponse({
      status: 200,
      description: "Location data retrieved successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: {
            type: "string",
            example: "Location data retrieved successfully",
          },
          data: {
            type: "object",
            properties: {
              states: {
                type: "array",
                items: { type: "string" },
                example: ["Maharashtra", "Karnataka", "Tamil Nadu"],
              },
              cities: {
                type: "array",
                items: { type: "string" },
                example: ["Mumbai", "Pune", "Nagpur"],
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: "Bad Request - Invalid policy ID",
    }),
    ApiResponse({ status: 401, description: "Unauthorized" }),
    ApiResponse({ status: 500, description: "Internal Server Error" }),
  );
}

export function getEnrollmentProgressSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Get enrollment progress",
      description: "Retrieves the enrollment progress for an employee, tracking completion of 6 enrollment steps",
    }),
    ApiBearerAuth(),
    ApiParam({
      name: "employeeId",
      type: Number,
      description: "Employee ID",
      example: 123,
    }),
    ApiQuery({
      name: "enrollmentBatchKey",
      type: String,
      required: false,
      description: "Specific enrollment batch key to retrieve (optional)",
      example: "enroll:123:101_102_103:1691234567890",
    }),
    ApiResponse({
      status: 200,
      description: "Enrollment progress retrieved successfully",
      type: EnrollmentProgressResponseDto,
    }),
    ApiResponse({ status: 404, description: "Employee not found" }),
    ApiResponse({ status: 401, description: "Unauthorized" }),
    ApiResponse({ status: 500, description: "Internal Server Error" }),
  );
}

export function updateEnrollmentProgressSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Update enrollment progress",
      description: "Updates the completion status of a specific enrollment step",
    }),
    ApiBearerAuth(),
    ApiParam({
      name: "employeeId",
      type: Number,
      description: "Employee ID",
      example: 123,
    }),
    ApiBody({ type: UpdateEnrollmentProgressDto }),
    ApiResponse({
      status: 200,
      description: "Enrollment progress updated successfully",
      type: EnrollmentProgressResponseDto,
    }),
    ApiResponse({ status: 404, description: "Employee or enrollment session not found" }),
    ApiResponse({ status: 400, description: "Bad Request - Invalid input" }),
    ApiResponse({ status: 401, description: "Unauthorized" }),
    ApiResponse({ status: 500, description: "Internal Server Error" }),
  );
}

export function initializeEnrollmentProgressSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Initialize enrollment progress",
      description: "Creates a new enrollment session and initializes progress tracking for specified policies",
    }),
    ApiBearerAuth(),
    ApiBody({ type: InitializeEnrollmentProgressDto }),
    ApiResponse({
      status: 201,
      description: "Enrollment progress initialized successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 201 },
          message: { type: "string", example: "Enrollment progress initialized successfully" },
          data: {
            type: "object",
            properties: {
              enrollmentBatchKey: { type: "string", example: "enroll:123:101_102_103:1691234567890" },
              policyIds: { type: "array", items: { type: "number" }, example: [101, 102, 103] },
              currentStep: { type: "number", example: 2 },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "Employee not found" }),
    ApiResponse({ status: 400, description: "Bad Request - Invalid input" }),
    ApiResponse({ status: 401, description: "Unauthorized" }),
    ApiResponse({ status: 500, description: "Internal Server Error" }),
  );
}

export function extendEnrollmentPeriodSwaggerMetadata() {
  return applyDecorators(
    ApiOperation({
      summary: "Extend an enrollment period",
      description: "Pushes the enrollment_end_date forward for one or more document_processing_file rows (every policy under an enrollment period card) and every employee's matching row in policy_enrollment_employee_policy_map.",
    }),
    ApiBearerAuth(),
    ApiBody({ type: ExtendEnrollmentPeriodDto }),
    ApiResponse({
      status: 200,
      description: "Enrollment period(s) extended successfully",
      schema: {
        type: "object",
        properties: {
          statusCode: { type: "number", example: 200 },
          message: { type: "string", example: "Enrollment period(s) extended successfully" },
          data: {
            type: "object",
            properties: {
              updatedPeriods: { type: "number", example: 14 },
              updatedEmployeeMappings: { type: "number", example: 132 },
              newEndDate: { type: "string", example: "2026-07-31" },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 404, description: "One or more enrollment periods were not found" }),
    ApiResponse({ status: 400, description: "Bad Request - Invalid input, or newEndDate is not after the current end date" }),
    ApiResponse({ status: 403, description: "Forbidden - period does not belong to the given company" }),
    ApiResponse({ status: 401, description: "Unauthorized" }),
    ApiResponse({ status: 500, description: "Internal Server Error" }),
  );
}
